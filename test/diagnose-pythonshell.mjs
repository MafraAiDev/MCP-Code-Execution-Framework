/**
 * Diagnostic tool for PythonShell communication
 * Isolates the exact problem between framework and bridge
 */

import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 DIAGNOSTICANDO PYTHONSHELL...
');

const bridgePath = path.join(__dirname, '..', 'servers', 'skills', 'bridge.py');
console.log('Bridge path:', bridgePath);

console.log('
📋 Testando PythonShell com bridge...
');

const pyshell = new PythonShell(bridgePath, {
  mode: 'json',
  pythonPath: 'python',
  pythonOptions: ['-u']
});

let receivedReady = false;
let timeout;

pyshell.on('message', (message) => {
  console.log('✅ Mensagem recebida:', JSON.stringify(message));
  if (message.type === 'ready') {
    receivedReady = true;
    console.log('✅ READY RECEBIDO!');

    // Enviar ping
    console.log('
2. Enviando ping...');
    pyshell.send({ action: 'ping', requestId: 'test-123' });
  } else if (message.type === 'pong') {
    console.log('✅ PONG RECEBIDO!');

    // Enviar comando de execução
    console.log('
3. Executando test-skill...');
    pyshell.send({
      action: 'execute',
      skill: 'test-skill',
      path: path.join(__dirname, 'fixtures', 'test-skill'),
      params: { name: 'Diagnostic Test', greeting: 'Hello' },
      requestId: 'exec-1'
    });
  } else if (message.type === 'result') {
    console.log('✅ RESULTADO RECEBIDO!');
    console.log('   Success:', message.success);
    console.log('   Result:', message.result);

    clearTimeout(timeout);
    pyshell.end();

    console.log('
🎉 PYTHONSHELL FUNCIONA PERFEITAMENTE!');
    console.log('🏆 PROBLEMA NÃO ESTÁ NO PYTHONSHELL!');
    process.exit(0);
  }
});

pyshell.on('error', (err) => {
  console.error('❌ Erro no PythonShell:', err);
  clearTimeout(timeout);
  process.exit(1);
});

pyshell.on('close', () => {
  console.log('
⚠️  PythonShell fechado');
  clearTimeout(timeout);
  if (!receivedReady) {
    console.error('❌ NUNCA RECEBEU READY! Este é o problema!');
    process.exit(1);
  }
});

// Timeout de segurança
timeout = setTimeout(() => {
  if (!receivedReady) {
    console.error('
❌ TIMEOUT! Bridge não enviou ready em 5 segundos');
    console.error('❌ ESTE É O PROBLEMA NO FRAMEWORK!');
    pyshell.kill();
    process.exit(1);
  }
}, 5000);

console.log('Aguardando ready message...
');