# Guardrails-AI - Setup e Uso

**Tipo:** Ferramenta standalone Python (NÃO é MCP)
**Repositório:** https://github.com/guardrails-ai/guardrails
**Versão instalada:** 0.6.7

---

## O QUE É GUARDRAILS-AI

Framework Python para construir aplicações de IA confiáveis com duas funções principais:

1. **Validação de Entrada/Saída:** Detecta e mitiga riscos em prompts e respostas de LLMs
2. **Estruturação de Dados:** Gera saídas estruturadas (JSON, Pydantic models)

---

## INSTALAÇÃO

### Verificar se está instalado

```bash
pip list | grep guardrails
```

**Saída esperada:**
```
guardrails-ai                            0.6.7
guardrails-api-client                    0.4.0
guardrails_hub_types                     0.0.4
```

### Instalar (se necessário)

```bash
pip install guardrails-ai
```

### Configuração Inicial

```bash
guardrails configure
```

---

## USO COM MODEL A (GERENTE)

### Papel no Sistema de 3 Modelos

**Model A** usa guardrails-ai para:
- Validar prompts antes de enviar para LLM
- Validar respostas do LLM antes de usar
- Detectar riscos de segurança
- Garantir outputs estruturados

---

## COMANDOS PRINCIPAIS

### 1. Listar Validators Disponíveis

```bash
guardrails hub list
```

### 2. Instalar Validator

```bash
# Exemplo: Validator de regex
guardrails hub install hub://guardrails/regex_match

# Exemplo: Validator de toxicidade
guardrails hub install hub://guardrails/toxic_language

# Exemplo: Validator de PII (dados sensíveis)
guardrails hub install hub://guardrails/detect_pii
```

### 3. Uso em Python

#### Validação Simples

```python
from guardrails import Guard, OnFailAction
from guardrails.hub import RegexMatch

# Criar guard
guard = Guard().use(
    RegexMatch,
    regex=r"^[a-zA-Z0-9]+$",
    on_fail=OnFailAction.EXCEPTION
)

# Validar texto
try:
    result = guard.validate("texto_valido123")
    print("Validação OK:", result)
except Exception as e:
    print("Erro de validação:", e)
```

#### Validação de Output de LLM

```python
from guardrails import Guard
from guardrails.hub import ToxicLanguage

# Guard para detectar linguagem tóxica
guard = Guard().use(
    ToxicLanguage,
    threshold=0.5,
    validation_method="sentence",
    on_fail=OnFailAction.FIX
)

# Validar resposta do LLM
llm_output = "Resposta do modelo..."
validated_output = guard.validate(llm_output)
```

#### Estruturação de Dados

```python
from guardrails import Guard
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int
    email: str

# Guard com schema Pydantic
guard = Guard.from_pydantic(output_class=User)

# Extrair dados estruturados do LLM
prompt = "Extract user info: John Doe, 30 years old, john@example.com"
result = guard(
    llm_api=your_llm_function,
    prompt=prompt
)
# result.validated_output -> User(name="John Doe", age=30, email="john@example.com")
```

---

## VALIDATORS RECOMENDADOS PARA MODEL A

### Segurança

```bash
# PII Detection (dados sensíveis)
guardrails hub install hub://guardrails/detect_pii

# Toxic Language
guardrails hub install hub://guardrails/toxic_language

# Secrets Scanning
guardrails hub install hub://guardrails/secrets_present
```

### Qualidade de Código

```bash
# Code Quality
guardrails hub install hub://guardrails/valid_python

# SQL Injection Prevention
guardrails hub install hub://guardrails/sql_injection
```

### Validação de Formato

```bash
# Regex Match
guardrails hub install hub://guardrails/regex_match

# JSON Validation
guardrails hub install hub://guardrails/valid_json
```

---

## INTEGRAÇÃO COM CLAUDE CODE

### Uso Típico em Model A

```python
from guardrails import Guard, OnFailAction
from guardrails.hub import DetectPII, ToxicLanguage

# Guard para validação de segurança
security_guard = Guard().use_many(
    DetectPII(pii_entities=["EMAIL", "PHONE", "SSN"], on_fail=OnFailAction.EXCEPTION),
    ToxicLanguage(threshold=0.7, on_fail=OnFailAction.FIX)
)

# Validar prompt do usuário antes de processar
def validate_user_input(user_prompt: str) -> str:
    """Valida entrada do usuário para segurança."""
    try:
        validated = security_guard.validate(user_prompt)
        return validated.validated_output
    except Exception as e:
        raise ValueError(f"Input inválido: {e}")

# Validar output do LLM antes de retornar
def validate_llm_output(llm_response: str) -> str:
    """Valida resposta do LLM antes de mostrar ao usuário."""
    try:
        validated = security_guard.validate(llm_response)
        return validated.validated_output
    except Exception as e:
        # Log erro e retorna versão sanitizada
        print(f"Warning: LLM output had issues: {e}")
        return validated.validated_output  # OnFailAction.FIX corrigiu
```

---

## SERVIDOR GUARDRAILS (OPCIONAL)

### Iniciar como REST API

```bash
# Criar configuração
guardrails create --validators=hub://guardrails/toxic_language

# Iniciar servidor
guardrails start --config=./config.py
```

**Servidor rodará em:** http://localhost:8000

### Fazer Request

```bash
curl -X POST http://localhost:8000/guards/validate \
  -H "Content-Type: application/json" \
  -d '{"text": "texto a validar"}'
```

---

## BOAS PRÁTICAS PARA MODEL A

### 1. Validar SEMPRE Inputs Críticos

```python
# Antes de processar comando do usuário
validated_input = security_guard.validate(user_command)
```

### 2. Validar Outputs Antes de Executar

```python
# Antes de executar código gerado por LLM
code_guard = Guard().use(ValidPython, on_fail=OnFailAction.EXCEPTION)
validated_code = code_guard.validate(llm_generated_code)
```

### 3. Usar OnFailAction Apropriadamente

```python
# EXCEPTION: Para dados críticos (falhar se inválido)
Guard().use(DetectPII, on_fail=OnFailAction.EXCEPTION)

# FIX: Para conteúdo (tentar corrigir automaticamente)
Guard().use(ToxicLanguage, on_fail=OnFailAction.FIX)

# FILTER: Para listas (remover itens inválidos)
Guard().use(Validator, on_fail=OnFailAction.FILTER)

# REASK: Para re-perguntar ao LLM
Guard().use(Validator, on_fail=OnFailAction.REASK)
```

---

## TROUBLESHOOTING

### Erro: Validator não encontrado

```bash
# Instalar validator
guardrails hub install hub://guardrails/[validator_name]
```

### Erro: Import falha

```python
# Certifique-se de importar corretamente
from guardrails.hub import ValidatorName  # Não guardrails.validators
```

### Performance Issues

```python
# Use validação assíncrona para múltiplos inputs
import asyncio

async def validate_many(texts: list[str]):
    tasks = [guard.validate_async(text) for text in texts]
    return await asyncio.gather(*tasks)
```

---

## DOCUMENTAÇÃO ADICIONAL

- **Documentação oficial:** https://docs.guardrailsai.com/
- **Hub de validators:** https://hub.guardrailsai.com/
- **GitHub:** https://github.com/guardrails-ai/guardrails
- **Discord:** https://discord.gg/guardrails

---

## RESUMO PARA MODEL A

```python
# Setup básico para usar em projetos
from guardrails import Guard, OnFailAction
from guardrails.hub import DetectPII, ToxicLanguage, ValidPython

# Guard de segurança
security_guard = Guard().use_many(
    DetectPII(pii_entities=["EMAIL", "PHONE", "SSN"], on_fail=OnFailAction.EXCEPTION),
    ToxicLanguage(threshold=0.7, on_fail=OnFailAction.FIX)
)

# Guard para código
code_guard = Guard().use(
    ValidPython(on_fail=OnFailAction.EXCEPTION)
)

# Usar nos pontos críticos:
# 1. Validar input do usuário
# 2. Validar output do LLM
# 3. Validar código gerado
# 4. Validar antes de executar comandos
```

**Guardrails-AI está instalado e pronto para uso!**
