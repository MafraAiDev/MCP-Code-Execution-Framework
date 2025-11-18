/**
 * Simple Test Skill - CommonJS
 * Minimal wrapper for testing
 */

async function execute(params) {
  console.log('Simple test skill executing with:', params);

  return {
    success: true,
    result: `Hello ${params?.name || 'World'}! Simple test passed!`,
    paramsReceived: params
  };
}

module.exports = { execute };
