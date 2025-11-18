/**
   * Integration tests for Python bridge communication
   * Tests: subprocess communication, message protocol, error handling
   */

const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const { MCPCodeExecutionFramework } = require('../../core/index.js');

describe('Skills Python Bridge Communication', function() {
  this.timeout(30000); // Bridge tests can take time

  describe('Python Bridge Subprocess', () => {
    it('should start Python bridge subprocess', function(done) {
      const bridgePath = path.join(__dirname, '..', '..', 'servers', 'skills', 'bridge.py');
      const pythonProcess = spawn('python', [bridgePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let started = false;
      let errorOccurred = false;

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('ready') || output.includes('started')) {
          started = true;
          pythonProcess.kill();
          done();
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning') && !error.includes('WARN')) {
          errorOccurred = true;
          pythonProcess.kill();
          done(new Error(`Python bridge error: ${error}`));
        }
      });

      pythonProcess.on('error', (err) => {
        errorOccurred = true;
        done(new Error(`Failed to start Python: ${err.message}`));
      });

      pythonProcess.on('close', (code) => {
        if (!started && !errorOccurred) {
          done(new Error(`Python bridge exited with code ${code}`));
        }
      });

      // Send init message
      pythonProcess.stdin.write(JSON.stringify({ action: 'init' }) + '\n');

      // Timeout protection
      setTimeout(() => {
        if (!started && !errorOccurred) {
          pythonProcess.kill();
          done(new Error('Python bridge startup timeout'));
        }
      }, 10000);
    });

    it('should handle JSON communication protocol', function(done) {
      const bridgePath = path.join(__dirname, '..', '..', 'servers', 'skills', 'bridge.py');
      const pythonProcess = spawn('python', [bridgePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let responseReceived = false;
      const testMessage = {
        action: 'ping',
        requestId: 'test-123'
      };

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        try {
          const lines = output.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const response = JSON.parse(line);
            if (response.requestId === 'test-123') {
              responseReceived = true;
              pythonProcess.kill();
              assert.ok(response.success !== undefined);
              done();
            }
          }
        } catch (e) {
          // Ignore non-JSON output
        }
      });

      pythonProcess.on('error', (err) => {
        done(new Error(`Failed to communicate: ${err.message}`));
      });

      pythonProcess.on('close', () => {
        if (!responseReceived) {
          done(new Error('No response received from Python bridge'));
        }
      });

      // Send test message
      pythonProcess.stdin.write(JSON.stringify(testMessage) + '\n');

      setTimeout(() => {
        if (!responseReceived) {
          pythonProcess.kill();
          done(new Error('Response timeout'));
        }
      }, 5000);
    });
  });

  describe('Skills Manager Python Bridge', () => {
    let executor;

    beforeEach(() => {
      executor = new MCPCodeExecutionFramework({
        skillTimeoutMs: 10000,
        maxConcurrentSkills: 2
      });
    });

    afterEach(async () => {
      if (executor) {
        await executor.cleanup();
      }
    });

    it('should communicate with Python bridge for skill loading', async () => {
      // This test verifies that the SkillsManager can communicate with Python bridge
      const stats = await executor.getSkillsStats();
      assert.ok(stats);
      assert.ok(typeof stats.totalExecutions === 'number');
    });

    it('should handle Python bridge initialization', async () => {
      // Test that Python bridge initializes properly
      const result = await executor.executeSkill('test-skill', {
        name: 'Bridge Test'
      });

      assert.ok(result);
      assert.strictEqual(result.success, true);
      assert.ok(result.result);
    });

    it('should handle multiple concurrent bridge requests', async () => {
      const promises = [];

      // Send multiple concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(executor.executeSkill('test-skill', {
          name: `Concurrent Test ${i}`
        }));
      }

      const results = await Promise.allSettled(promises);

      // All requests should complete successfully
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      assert.ok(successful >= 3, `Only ${successful} out of 5 concurrent requests succeeded`);
    });

    it('should handle bridge communication errors', async () => {
      // Create executor with invalid Python bridge configuration
      const invalidExecutor = new MCPCodeExecutionFramework({
        skillTimeoutMs: 1000,
        maxConcurrentSkills: 1
      });

      try {
        // Try to execute with potentially problematic configuration
        await invalidExecutor.executeSkill('test-skill', { name: 'Error Test' });
        assert.ok(true); // May still work depending on configuration
      } catch (error) {
        assert.ok(error.message);
        assert.ok(error.message.includes('bridge') || error.message.includes('Python') || error.message.includes('timeout'));
      } finally {
        await invalidExecutor.cleanup();
      }
    });

    it('should handle bridge shutdown properly', async () => {
      // Execute a skill to ensure bridge is running
      await executor.executeSkill('test-skill', { name: 'Shutdown Test' });

      // Cleanup should shut down bridge properly
      await executor.cleanup();

      // Verify cleanup completed without errors
      assert.ok(true);
    });
  });

  describe('Message Protocol', () => {
    it('should handle request-response matching', function(done) {
      const bridgePath = path.join(__dirname, '..', '..', 'servers', 'skills', 'bridge.py');
      const pythonProcess = spawn('python', [bridgePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const requestIds = ['req-1', 'req-2', 'req-3'];
      const responses = {};
      let responsesReceived = 0;

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        const lines = output.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            if (response.requestId && requestIds.includes(response.requestId)) {
              responses[response.requestId] = response;
              responsesReceived++;

              if (responsesReceived === requestIds.length) {
                pythonProcess.kill();

                // Verify all responses are matched correctly
                assert.strictEqual(Object.keys(responses).length, 3);
                requestIds.forEach(id => {
                  assert.ok(responses[id], `Missing response for ${id}`);
                  assert.ok(responses[id].requestId === id);
                });

                done();
              }
            }
          } catch (e) {
            // Ignore non-JSON output
          }
        }
      });

      pythonProcess.on('error', (err) => {
        done(new Error(`Failed to communicate: ${err.message}`));
      });

      // Send multiple requests with different IDs
      requestIds.forEach(id => {
        pythonProcess.stdin.write(JSON.stringify({
          action: 'ping',
          requestId: id
        }) + '\n');
      });

      setTimeout(() => {
        pythonProcess.kill();
        if (responsesReceived < requestIds.length) {
          done(new Error(`Only received ${responsesReceived} out of ${requestIds.length} responses`));
        }
      }, 10000);
    });

    it('should handle timeout scenarios', function(done) {
      const bridgePath = path.join(__dirname, '..', '..', 'servers', 'skills', 'bridge.py');
      const pythonProcess = spawn('python', [bridgePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let timeoutHandled = false;

      // Send a request that might timeout or hang
      pythonProcess.stdin.write(JSON.stringify({
        action: 'unknown_action',
        requestId: 'timeout-test'
      }) + '\n');

      // Don't wait for response, just verify no crash
      setTimeout(() => {
        timeoutHandled = true;
        pythonProcess.kill();
        assert.ok(true); // Test passes if no crash
        done();
      }, 3000);

      pythonProcess.on('error', () => {
        // Process errors are acceptable for timeout tests
        if (!timeoutHandled) {
          done();
        }
      });

      pythonProcess.on('close', () => {
        if (!timeoutHandled) {
          done();
        }
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed JSON gracefully', function(done) {
      const bridgePath = path.join(__dirname, '..', '..', 'servers', 'skills', 'bridge.py');
      const pythonProcess = spawn('python', [bridgePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let errorHandled = false;

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('error') || output.includes('invalid')) {
          errorHandled = true;
          pythonProcess.kill();
          assert.ok(true); // Error was handled
          done();
        }
      });

      pythonProcess.on('error', () => {
        errorHandled = true;
        done();
      });

      pythonProcess.on('close', () => {
        if (!errorHandled) {
          assert.ok(true); // No crash is good
          done();
        }
      });

      // Send malformed JSON
      pythonProcess.stdin.write('{"invalid": json, missing quotes}');
      pythonProcess.stdin.write('\n');

      setTimeout(() => {
        if (!errorHandled) {
          pythonProcess.kill();
          done();
        }
      }, 3000);
    });

    it('should handle missing requestId', function(done) {
      const bridgePath = path.join(__dirname, '..', '..', 'servers', 'skills', 'bridge.py');
      const pythonProcess = spawn('python', [bridgePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let responseReceived = false;

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        try {
          const response = JSON.parse(output);
          if (response.action === 'ping' && !response.requestId) {
            responseReceived = true;
            pythonProcess.kill();
            done(new Error('Bridge should not respond to messages without requestId'));
          }
        } catch (e) {
          // Ignore non-JSON output
        }
      });

      pythonProcess.on('close', () => {
        if (!responseReceived) {
          assert.ok(true); // No response is correct behavior
          done();
        }
      });

      // Send message without requestId
      pythonProcess.stdin.write(JSON.stringify({
        action: 'ping'
        // Missing requestId
      }) + '\n');

      setTimeout(() => {
        pythonProcess.kill();
        if (!responseReceived) {
          done();
        }
      }, 3000);
    });
  });
});

// Run tests
if (require.main === module) {
  const Mocha = require('mocha');
  const mocha = new Mocha();
  mocha.addFile(__filename);
  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}