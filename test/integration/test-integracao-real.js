/**
 * Testes de Integração REAIS - Execução de MCP
 * Scripts standalone que testa fluxo completo: JS → Python Bridge → Python Server → MCPs
 * Este arquivo é executado diretamente com node (não via jest) para evitar problemas de ES modules
 */

import framework from '../../core/index.js';

console.log('═══════════════════════════════════════════');
console.log('   TESTES REAIS DE INTEGRAÇÃO - MCP');
console.log('═══════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    passCount++;
    results.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    failCount++;
    results.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}`);
    console.log(`   Erro: ${error.message}\n`);
  }
}

async function runTests() {
  try {
    console.log('📋 Inicializando framework\n');
    await framework.initialize();
    console.log('');

    // Teste 1: Execução Python básica
    await test('Execução Python simples', async () => {
      const result = await framework.execute('2 + 2');
      if (result !== 4) throw new Error(`Expected 4, got ${result}`);
    });

    // Teste 2: Import servers module
    await test('Import de servers (list_categories)', async () => {
      const code = `
from servers import list_categories
__result__ = list_categories()
      `;
      const result = await framework.execute(code);
      if (!Array.isArray(result)) throw new Error(`Result is not array: ${typeof result}`);
      if (!result.includes('security')) throw new Error('Missing "security" category');
      if (!result.includes('scraping')) throw new Error('Missing "scraping" category');
    });

    // Teste 3: Import módulos MCP
    await test('Import de módulos MCP (apify, guardrails)', async () => {
      const code = `
from servers.scraping import apify
from servers.security import guardrails

has_apify = hasattr(apify, 'run_actor')
has_guardrails = hasattr(guardrails, 'validate')

__result__ = {'has_apify': has_apify, 'has_guardrails': has_guardrails}
      `;
      const result = await framework.execute(code);
      if (!result) throw new Error('Result is null');
      if (!result.has_apify) throw new Error('Apify module not found');
      if (!result.has_guardrails) throw new Error('Guardrails module not found');
    });

    // Teste 4: Listar categorias
    await test('Listar categorias de MCPs', async () => {
      const code = `
from servers import list_categories
__result__ = list_categories()
      `;
      const result = await framework.execute(code);
      if (!Array.isArray(result)) throw new Error(`Result is not array: ${typeof result}`);
      if (result.length === 0) throw new Error('No categories returned');
    });

    // Teste 5: Manter estado entre execuções
    await test('Manter estado entre execuções Python', async () => {
      await framework.execute('# Python\nx = 42');
      const result = await framework.execute('# Python\n__result__ = x');
      if (result !== 42) throw new Error(`Expected 42, got ${result}`);
    });

    // Teste 6: Tratamento de erros
    await test('Tratamento de erros Python (ZeroDivision)', async () => {
      try {
        await framework.execute('# Python\n1 / 0');
        throw new Error('Should have thrown error');
      } catch (error) {
        if (!error.message.includes('division by zero') && !error.message.includes('ZeroDivision')) {
          throw new Error(`Wrong error: ${error.message}`);
        }
      }
    });

    // Teste 7: Funções Python
    await test('Execução de funções Python', async () => {
      const code = `
def greet(name):
    return f"Hello, {name}!"

__result__ = greet('World')
      `;
      const result = await framework.execute(code);
      if (result !== 'Hello, World!') throw new Error(`Expected 'Hello, World!', got ${result}`);
    });

    // Teste 8: Context variables
    await test('Passagem de context variables', async () => {
      const context = { name: 'World' };
      const code = `# Python
name_value = context.get('name', 'Unknown')
__result__ = f"Name: {name_value}"
      `;
      const result = await framework.execute(code, context);
      if (result !== 'Name: World') throw new Error(`Expected 'Name: World', got ${result}`);
    });

    // Teste 9: Estruturas de dados complexas
    await test('Estruturas de dados complexas', async () => {
      const code = `# Python
data_dict = {
    'list': [1, 2, 3],
    'dict': {'nested': 'value'},
    'number': 42,
    'string': 'text'
}
__result__ = data_dict
      `;
      const result = await framework.execute(code);
      if (!result) throw new Error('Result is null');
      if (!result.list) throw new Error('Missing list property');
      if (!Array.isArray(result.list)) throw new Error('List is not array');
      if (result.list.length !== 3) throw new Error(`Expected 3 items, got ${result.list.length}`);
    });

    // Teste 10: Estatísticas
    await test('Estatísticas do framework', async () => {
      const stats = framework.getStats();
      if (!stats.executions) throw new Error('No executions count');
      if (!stats.initialized) throw new Error('Framework not initialized');
      if (!stats.mcpInterceptor) throw new Error('No mcpInterceptor stats');
    });

    // Teste 11: Sistema de Enforcement
    await test('Sistema de enforcement ativo', async () => {
      const stats = framework.getStats();
      if (!stats.mcpInterceptor.enforced) throw new Error('Enforcement not active');
    });

    // Teste 12: Progressive Disclosure
    await test('Progressive Disclosure (discover_mcps)', async () => {
      const code = `
from servers import list_mcps
__result__ = list_mcps('security')
      `;
      const result = await framework.execute(code);
      if (!Array.isArray(result)) throw new Error(`Result is not array: ${typeof result}`);
      if (result.length === 0) throw new Error('No MCPs found');
      if (!result.includes('guardrails')) throw new Error('guardrails not in security MCPs');
    });

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('   RESULTADOS');
    console.log('═══════════════════════════════════════════');
    console.log(`Total: ${passCount + failCount}`);
    console.log(`✅ Passaram: ${passCount}`);
    console.log(`❌ Falharam: ${failCount}`);

    if (failCount > 0) {
      console.log('\nFalhas:');
      results.forEach(r => {
        if (r.status === '❌ FAIL') {
          console.log(`  - ${r.name}: ${r.error}`);
        }
      });
    }

    console.log('');

    // Cleanup
    await framework.cleanup();

    // Exit with proper code
    process.exit(failCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});
