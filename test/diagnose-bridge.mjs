#!/usr/bin/env node
/**
 * Diagnostic tool for Python Bridge
 * Tests Python bridge communication step by step
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 DIAGNÓSTICO DO PYTHON BRIDGE\n');
console.log('=' .repeat(60));

// Test 1: Check Python
console.log('\n📋 Teste 1: Verificar Python');
const pythonProcess = spawn('python', ['--version']);
pythonProcess.on('close', (code) => {
  console.log(`✅ Python disponível: ${code === 0 ? 'SIM' : 'NÃO'}`);

  // Test 2: Check Bridge File
  console.log('\n📋 Teste 2: Verificar arquivo bridge.py');
  const bridgePath = join(__dirname, '..', 'servers', 'skills', 'bridge.py');
  fs.access(bridgePath)
    .then(() => {
      console.log('✅ Bridge.py encontrado:', bridgePath);

      // Test 3: Test Bridge Execution
      console.log('\n📋 Teste 3: Testar execução do bridge');
      const bridgeProcess = spawn('python', [bridgePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let ready = false;
      bridgeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('   Bridge stdout:', output.trim());
        if (output.includes('ready') || output.includes('started')) {
          ready = true;
          console.log('✅ Bridge inicializado com sucesso!');

          // Test 4: Send ping
          console.log('\n📋 Teste 4: Enviar ping para o bridge');
          bridgeProcess.stdin.write(JSON.stringify({ action: 'ping', requestId: 'test-123' }) + '\n');

          setTimeout(() => {
            bridgeProcess.kill();
            console.log('\n' + '='.repeat(60));
            console.log('✅ Todos os testes completados!');
            process.exit(0);
          }, 2000);
        }
      });

      bridgeProcess.stderr.on('data', (data) => {
        console.error('   Bridge stderr:', data.toString());
      });

      bridgeProcess.on('error', (err) => {
        console.error('❌ Erro no bridge:', err.message);
        process.exit(1);
      });

      // Send init
      setTimeout(() => {
        bridgeProcess.stdin.write(JSON.stringify({ action: 'init' }) + '\n');
      }, 100);
    })
    .catch(() => {
      console.error('❌ Bridge.py não encontrado:', bridgePath);
      process.exit(1);
    });
});

pythonProcess.on('error', () => {
  console.error('❌ Python não disponível');
  process.exit(1);
});
