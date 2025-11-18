/**
 * Test Skill - JavaScript Wrapper (CommonJS - para compatibilidade com loader)
 * Wraps the Python test skill for execution via Python Bridge
 */

const { spawn } = require('child_process');
const path = require('path');

async function execute(params = {}) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'index.py');
    const pythonProcess = spawn('python', [pythonScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      try {
        if (stdout.trim()) {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } else {
          reject(new Error(`Python skill execution failed: ${stderr || 'No output'}`));
        }
      } catch (error) {
        reject(new Error(`Invalid JSON from Python script: ${stdout}\nError: ${error.message}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });

    // Send parameters
    pythonProcess.stdin.write(JSON.stringify(params));
    pythonProcess.stdin.end();
  });
}

module.exports = { execute };
