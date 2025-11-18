/**
 * Diagnostic tool for framework bridge initialization
 * Tests the exact code path used by the framework
 */

import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 DIAGNOSTICANDO FRAMEWORK BRIDGE INITIALIZATION\n');
console.log('=' .repeat(60));

const bridgePath = path.join(__dirname, '..', 'servers', 'skills', 'bridge.py');
console.log('Bridge path:', bridgePath);

// Simular EXATAMENTE o que o framework faz
console.log('\n📋 Criando PythonShell (igual ao framework)...\n');

const pythonBridge = new PythonShell(bridgePath, {
  mode: 'json',
  pythonPath: 'python', // or 'python3'
  pythonOptions: ['-u'], // Unbuffered output
});

pythonBridge.isRunning = false;
pythonBridge.pendingRequests = new Map();

// Handle messages from Python (igual ao framework)
pythonBridge.on('message', (message) => {
  console.log('📩 Mensagem recebida do bridge:', JSON.stringify(message));

  // Simular _handleSkillsPythonMessage
  const requestId = message.requestId;

  if (!requestId) {
    console.warn('⚠️ Mensagem sem requestId:', message);
    return;
  }

  const pending = pythonBridge.pendingRequests.get(requestId);
  if (!pending) {
    console.warn('⚠️ Sem request pendente para:', requestId);
    return;
  }

  // Clear timeout
  if (pending.timeout) {
    clearTimeout(pending.timeout);
  }

  // Remove from pending
  pythonBridge.pendingRequests.delete(requestId);

  // Handle response
  if (message.success === false || message.error) {
    pending.reject(new Error(message.error || 'Unknown Skills Python error'));
  } else {
    pending.resolve(message);
  }
});

// Handle errors (igual ao framework)
pythonBridge.on('error', (err) => {
  console.error('❌ Skills Python bridge error:', err);
});

// Handle close (igual ao framework)
pythonBridge.on('close', () => {
  pythonBridge.isRunning = false;
  console.log('⚠️ Skills Python bridge closed');
});

// Wait for ready signal (igual ao framework)
console.log('\n⏳ Aguardando ready signal (5 segundos timeout)...\n');

const initPromise = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error('Skills Python bridge initialization timeout'));
  }, 5000);

  const readyHandler = (message) => {
    console.log('📨 Handler chamado com message:', JSON.stringify(message));
    if (message.type === 'ready') {
      console.log('✅ READY DETECTADO!');
      clearTimeout(timeout);
      pythonBridge.off('message', readyHandler);
      resolve();
    }
  };

  pythonBridge.on('message', readyHandler);
});

initPromise
  .then(() => {
    pythonBridge.isRunning = true;
    console.log('\n🎉 Bridge inicializado com sucesso!');
    console.log('✅ isRunning =', pythonBridge.isRunning);

    // Testar execução
    console.log('\n📋 Testando execução de skill...\n');

    const requestId = 'test-exec-' + Date.now();
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (pythonBridge.pendingRequests.has(requestId)) {
          pythonBridge.pendingRequests.delete(requestId);
          reject(new Error('Skills Python bridge response timeout'));
        }
      }, 30000);

      pythonBridge.pendingRequests.set(requestId, { resolve, reject, timeout });
    });

    pythonBridge.send({
      action: 'execute',
      skill: 'test-skill',
      path: path.join(__dirname, 'fixtures', 'test-skill'),
      params: { name: 'Framework Test', greeting: 'Hello' },
      requestId: requestId
    });

    return promise;
  })
  .then((result) => {
    console.log('\n✅ Execução bem-sucedida!');
    console.log('Result:', result);
    pythonBridge.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ ERRO:', err.message);
    pythonBridge.end();
    process.exit(1);
  });
