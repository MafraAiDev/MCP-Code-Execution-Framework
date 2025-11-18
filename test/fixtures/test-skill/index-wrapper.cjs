/**
 * CommonJS Wrapper for test-skill Python module
 * Executes Python test-skill via child process
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function execute(params = {}) {
  const projectRoot = process.cwd();
  const pythonPath = path.join(projectRoot, 'test', 'fixtures', 'test-skill', 'index.py');

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(pythonPath)) {
      return reject(new Error(`Python skill file not found: ${pythonPath}`));
    }

    const pythonProcess = spawn('python', [pythonPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
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
          reject(new Error(`Python skill execution failed: ${stderr || 'No output (exit code: ' + code + ')'}`));
        }
      } catch (error) {
        reject(new Error(`Invalid JSON from Python script: ${stdout}\nError: ${error.message}\nStderr: ${stderr}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });

    try {
      pythonProcess.stdin.write(JSON.stringify(params));
      pythonProcess.stdin.end();
    } catch (err) {
      reject(new Error(`Failed to send parameters: ${err.message}`));
    }
  });
}

module.exports = { execute };
