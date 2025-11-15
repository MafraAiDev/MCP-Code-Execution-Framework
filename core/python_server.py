#!/usr/bin/env python3
"""
Python Server - Servidor Python Persistente para MCP Framework

Responsabilidades:
- Receber e executar código Python do JavaScript
- Permitir importação dinâmica de módulos MCP
- Chamar funções JavaScript (callbacks)
- Manter estado entre execuções

@module core/python_server
@complexity HIGH
@architect Sonnet 4.5
"""

import sys
import json
import asyncio
import inspect
import traceback
from typing import Any, Dict, Optional
from io import StringIO
import os

# Adiciona diretório do projeto ao PYTHONPATH
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)


class JSBridge:
    """
    Ponte para chamar funções JavaScript do Python
    """

    def __init__(self):
        self.call_id = 0
        self.pending_calls = {}

    async def call(self, module: str, method: str, *args) -> Any:
        """
        Chama uma função JavaScript

        Args:
            module: Nome do módulo JS (ex: 'dataFilter', 'privacyTokenizer')
            method: Nome do método
            *args: Argumentos para o método

        Returns:
            Resultado da chamada JS
        """
        call_id = self.call_id
        self.call_id += 1

        # Envia requisição para JS
        self._send_message({
            'type': 'js_call',
            'callId': call_id,
            'module': module,
            'method': method,
            'args': list(args)
        })

        # Aguarda resposta
        future = asyncio.Future()
        self.pending_calls[call_id] = future

        return await future

    def _send_message(self, message: Dict):
        """Envia mensagem para JavaScript"""
        json_str = json.dumps(message)
        print(json_str, flush=True)

    def handle_response(self, call_id: int, result: Any = None, error: str = None):
        """Trata resposta de chamada JS"""
        if call_id in self.pending_calls:
            future = self.pending_calls.pop(call_id)

            if error:
                future.set_exception(Exception(f"JS Error: {error}"))
            else:
                future.set_result(result)


class PythonServer:
    """
    Servidor Python que executa código recebido do JavaScript
    """

    def __init__(self):
        self.js_bridge = JSBridge()
        self.global_context = {
            '__builtins__': __builtins__,
            'js': self.js_bridge,  # Disponível para código Python
        }

    def log(self, message: str):
        """Envia log para JavaScript"""
        self._send_message({
            'type': 'log',
            'message': message
        })

    def _send_message(self, message: Dict):
        """Envia mensagem para JavaScript"""
        json_str = json.dumps(message)
        print(json_str, flush=True)

    async def execute_code(self, code: str, context: Dict) -> Any:
        """
        Executa código Python com contexto fornecido

        Args:
            code: Código Python a executar
            context: Contexto/variáveis disponíveis

        Returns:
            Resultado da execução (última expressão ou return)
        """
        # Mescla contexto fornecido com contexto global
        exec_context = {
            **self.global_context,
            'context': context,  # Disponibiliza 'context' como variável Python
            **context  # Também injeta variáveis diretamente
        }

        try:
            # Captura stdout/stderr
            old_stdout = sys.stdout
            old_stderr = sys.stderr
            sys.stdout = StringIO()
            sys.stderr = StringIO()

            result = None

            try:
                # Tenta compilar como expressão primeiro (para eval)
                compiled = compile(code, '<string>', 'eval')
                result = eval(compiled, exec_context)

                # Se for coroutine, aguarda
                if inspect.iscoroutine(result):
                    result = await result

            except SyntaxError:
                # Não é expressão, executa como statements
                compiled = compile(code, '<string>', 'exec')
                exec(compiled, exec_context)

                # IMPORTANTE: Preserva variáveis para próximas execuções
                for key in list(exec_context.keys()):
                    if not key.startswith('__') and key not in ['context', 'js']:
                        self.global_context[key] = exec_context[key]

                # Procura por 'return' no contexto
                if 'return' in exec_context:
                    result = exec_context['return']
                # Ou verifica se última variável definida é o resultado
                elif '__result__' in exec_context:
                    result = exec_context['__result__']

            # Captura output
            stdout_value = sys.stdout.getvalue()
            stderr_value = sys.stderr.getvalue()

            # Restaura stdout/stderr
            sys.stdout = old_stdout
            sys.stderr = old_stderr

            # Loga output se houver
            if stdout_value:
                self.log(f"STDOUT: {stdout_value}")
            if stderr_value:
                self.log(f"STDERR: {stderr_value}")

            return result

        except Exception as e:
            # Restaura stdout/stderr em caso de erro
            sys.stdout = old_stdout
            sys.stderr = old_stderr

            # Captura traceback completo
            tb = traceback.format_exc()
            raise Exception(f"{str(e)}\n\nTraceback:\n{tb}")

    async def handle_request(self, request: Dict):
        """
        Trata requisição do JavaScript

        Args:
            request: Requisição recebida
        """
        req_type = request.get('type')

        if req_type == 'execute':
            # Executa código Python
            req_id = request['id']
            code = request['code']
            context = request.get('context', {})

            try:
                result = await self.execute_code(code, context)

                # Serializa resultado
                # (converte tipos não-serializáveis)
                serialized_result = self._serialize(result)

                self._send_message({
                    'type': 'response',
                    'id': req_id,
                    'result': serialized_result
                })

            except Exception as e:
                self._send_message({
                    'type': 'response',
                    'id': req_id,
                    'error': str(e)
                })

        elif req_type == 'js_call_response':
            # Resposta de chamada JS
            call_id = request['callId']
            result = request.get('result')
            error = request.get('error')

            self.js_bridge.handle_response(call_id, result, error)

        elif req_type == 'shutdown':
            # Sinal de término
            self.log("Recebido sinal de shutdown")
            return False  # Indica para parar loop

        return True  # Continua loop

    def _serialize(self, obj: Any) -> Any:
        """
        Serializa objeto para JSON

        Trata tipos especiais que não são serializáveis por padrão
        """
        if obj is None or isinstance(obj, (bool, int, float, str)):
            return obj
        elif isinstance(obj, (list, tuple)):
            return [self._serialize(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: self._serialize(value) for key, value in obj.items()}
        elif hasattr(obj, '__dict__'):
            # Objeto customizado - serializa atributos
            return {
                '__type__': type(obj).__name__,
                '__dict__': self._serialize(obj.__dict__)
            }
        else:
            # Fallback: converte para string
            return str(obj)

    async def run(self):
        """
        Loop principal do servidor
        """
        self.log("Python Server inicializado")

        # Envia sinal de "ready"
        self._send_message({'type': 'ready'})

        # Loop de processamento
        while True:
            try:
                # Lê linha do stdin (bloqueante)
                line = sys.stdin.readline()

                if not line:
                    # EOF - JavaScript terminou
                    break

                line = line.strip()
                if not line:
                    continue

                # Parseia JSON
                request = json.loads(line)

                # Processa requisição
                should_continue = await self.handle_request(request)

                if not should_continue:
                    break

            except json.JSONDecodeError as e:
                self.log(f"Erro ao parsear JSON: {e}")
            except Exception as e:
                self.log(f"Erro no loop principal: {e}")
                traceback.print_exc()

        self.log("Python Server finalizando")


async def main():
    """Entry point"""
    server = PythonServer()
    await server.run()


if __name__ == '__main__':
    # Configura event loop
    if sys.platform == 'win32':
        # Windows requer ProactorEventLoop para subprocess
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    # Executa servidor
    asyncio.run(main())
