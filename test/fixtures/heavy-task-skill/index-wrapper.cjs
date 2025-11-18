/**
 * Heavy Task Skill Wrapper
 * Wrapper CJS para heavy-task-skill (Python)
 */

const PythonBridgeExecutor = require('../../../servers/skills/python-bridge-executor.cjs');

const metadata = {
  name: 'heavy-task-skill',
  version: '1.0.0',
  description: 'Tarefa pesada para testar paralelização',
  type: 'python',
  executor: 'python-bridge',
  pythonScript: __dirname + '/index.py',
  parameters: {
    iterations: {
      type: 'number',
      required: false,
      default: 1000,
      description: 'Número de iterações'
    }
  }
};

async function execute(params = {}) {
  return PythonBridgeExecutor.execute(metadata, params);
}

module.exports = {
  metadata,
  execute
};
