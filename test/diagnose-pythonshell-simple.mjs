/**
 * Simple diagnostic for PythonShell
 * Tests basic communication
 */

import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('PYTHONSHELL DIAGNOSTIC\n');

const bridgePath = path.join(__dirname, '..', 'servers', 'skills', 'bridge.py');
console.log('Bridge path:', bridgePath);

const pyshell = new PythonShell(bridgePath, {
  mode: 'json',
  pythonPath: 'python',
  pythonOptions: ['-u']
});

let receivedReady = false;
let timeout;

pyshell.on('message', (message) => {
  console.log('Message:', JSON.stringify(message));
  if (message.type === 'ready') {
    receivedReady = true;
    console.log('READY RECEIVED!');
    pyshell.end();
  }
});

pyshell.on('error', (err) => {
  console.error('Error:', err);
  clearTimeout(timeout);
  process.exit(1);
});

pyshell.on('close', () => {
  clearTimeout(timeout);
  if (!receivedReady) {
    console.error('NEVER RECEIVED READY!');
    process.exit(1);
  } else {
    console.log('SUCCESS! PythonShell works!');
    process.exit(0);
  }
});

timeout = setTimeout(() => {
  if (!receivedReady) {
    console.error('TIMEOUT after 5 seconds');
    pyshell.kill();
    process.exit(1);
  }
}, 5000);

console.log('Waiting for ready...\n');
