/**
 * Diagnose bridge timeout issue
 */

import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bridgePath = path.join(__dirname, '..', 'servers', 'skills', 'bridge.py');

console.log('PYTHONSHELL TIMEOUT DIAGNOSTIC\n');
console.log('Bridge path:', bridgePath);
console.log('');

const start = Date.now();
const pyshell = new PythonShell(bridgePath, {
  mode: 'json',
  pythonPath: 'python',
  pythonOptions: ['-u']
});

let readyReceived = false;
let messageCount = 0;

pyshell.on('message', (msg) => {
  const elapsed = Date.now() - start;
  messageCount++;
  console.log(`[${elapsed}ms] Message ${messageCount}:`, JSON.stringify(msg));
  if (msg.type === 'ready') {
    readyReceived = true;
    console.log('\n✅ READY received!', elapsed, 'ms');
    pyshell.end();
  }
});

pyshell.on('error', (err) => {
  console.error('\n❌ Error:', err);
});

pyshell.on('close', () => {
  const elapsed = Date.now() - start;
  console.log('\n✅ Closed after', elapsed, 'ms');
  if (!readyReceived) {
    console.log('⚠️  Never received ready!');
    process.exit(1);
  }
  process.exit(0);
});

console.log('Waiting for messages...\n');
