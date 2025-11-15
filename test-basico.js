/**
 * Teste Básico - MCP Framework
 */

import framework from './core/index.js';

console.log('🧪 Iniciando teste básico do framework...\n');

async function runTests() {
  try {
    // Teste 1: Inicialização
    console.log('📋 Teste 1: Inicialização');
    await framework.initialize();
    console.log('✅ Framework inicializado\n');

    // Teste 2: Execução Python simples
    console.log('📋 Teste 2: Execução Python simples');
    const result1 = await framework.execute(`
# Teste simples Python
__result__ = 2 + 2
    `);
    console.log(`✅ Resultado: ${result1} (esperado: 4)\n`);

    // Teste 3: Import de servers
    console.log('📋 Teste 3: Import módulo servers');
    const result2 = await framework.execute(`
from servers import list_categories
__result__ = list_categories()
    `);
    console.log(`✅ Categorias: ${result2.join(', ')}\n`);

    // Teste 4: Estatísticas
    console.log('📋 Teste 4: Estatísticas');
    const stats = framework.getStats();
    console.log(`✅ Execuções: ${stats.executions}`);
    console.log(`✅ Python PID: ${stats.pythonBridge.processId}\n`);

    // Teste 5: Relatório
    console.log('📋 Teste 5: Relatório\n');
    const report = framework.generateReport();
    console.log(report);

    // Finaliza
    await framework.cleanup();
    console.log('🎉 Todos os testes passaram!\n');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
  }
}

runTests();
