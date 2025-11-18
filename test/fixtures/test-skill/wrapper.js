// Minimal CommonJS wrapper for test-skill
const { spawn } = require('child_process');
const path = require('path');

async function execute(params) {
  const pythonScript = path.join(__dirname, 'index.py');
  const pythonProcess = require('child_process').spawn('python', [pythonScript]);

  pythonProcess.stdin.write(JSON.stringify(params || {}));
  pythonProcess.stdin.end();

  return new Promise((resolve, reject) => {
    let stdout = '';
    pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
    pythonProcess.on('close', () => {
      try { resolve(JSON.parse(stdout)); } catch (e) { reject(e); }
    });
    pythonProcess.on('error', reject);
  });
}

module.exports = { execute };
