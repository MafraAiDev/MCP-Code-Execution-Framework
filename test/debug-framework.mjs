/**
 * Debug framework execution with detailed logging
 */

import { MCPCodeExecutionFramework } from '../core/index.js';

const executor = new MCPCodeExecutionFramework({ skillTimeoutMs: 15000 });

console.log('[DEBUG] Framework created\n');

// Adicionar listeners de debug
executor.on('error', (err) => console.log('[EVENT] Error:', JSON.stringify(err)));
executor.on('initialized', () => console.log('[EVENT] Initialized'));
executor.on('executed', (data) => console.log('[EVENT] Executed:', data.skillName || 'unknown'));

// Clear cache before testing
try {
  if (executor.skillsManager) {
    console.log('[DEBUG] Limpando cache de skills...\n');
    executor.skillsManager.loader.clearCache();
    console.log('[DEBUG] Cache limpo!\n');
  }
} catch (e) {
  console.log('[DEBUG] Não foi possível limpar cache:', e.message);
}

try {
  console.log('[DEBUG] Step 1: Listando skills...\n');
  const skills = await executor.listSkills();
  console.log('[DEBUG] Step 1: Skills listadas:', skills.length, '\n');

  console.log('[DEBUG] Step 2: Verificando test-skill...');
  const testSkill = skills.find(s => s.name === 'test-skill');
  console.log('[DEBUG] Step 2: test-skill encontrada:', !!testSkill, '\n');
  if (testSkill) {
    console.log('[DEBUG] test-skill path:', testSkill.path);
    console.log('[DEBUG] test-skill entrypoint:', testSkill.entrypoint, '\n');
  }

  console.log('[DEBUG] Step 3: Executando test-skill...\n');
  const result = await executor.executeSkill('test-skill', {
    name: 'Debug Test',
    greeting: 'Hello'
  });

  console.log('[DEBUG] Step 3: Resultado recebido!');
  console.log('[DEBUG] Success:', result.success);
  console.log('[DEBUG] Result:', result.result);
  console.log('[DEBUG] Error:', result.error);
  console.log('[DEBUG] ExecutionTime:', result.executionTime);

} catch (error) {
  console.error('\n[DEBUG] ERRO CAPTURADO:', error.message);
  console.error('[DEBUG] Stack:', error.stack);
} finally {
  console.log('\n[DEBUG] Cleanup...');
  await executor.cleanup();
  console.log('[DEBUG] Done');
}
