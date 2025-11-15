/**
 * Exemplo 01: Hello World - Introdução ao Framework
 *
 * Este exemplo demonstra:
 * - Inicialização básica do framework
 * - Execução simples de código Python
 * - Tratamento de erros
 * - Cleanup adequado
 */

import framework from '../core/index.js';

async function helloWorldExample() {
  console.log('🌍 Exemplo 01: Hello World com MCP Framework\n');

  try {
    // 1. Inicializar o framework
    console.log('📋 Inicializando framework...');
    await framework.initialize();
    console.log('✅ Framework inicializado com sucesso!\n');

    // 2. Executar código Python simples
    console.log('🐍 Executando código Python básico...');

    // Cálculo simples
    const result1 = await framework.execute('2 + 2');
    console.log(`🧮 2 + 2 = ${result1}`);

    // Manipulação de strings
    const result2 = await framework.execute(`
message = "Hello from Python!"
len(message)
    `);
    console.log(`📏 Tamanho da mensagem: ${result2} caracteres`);

    // Trabalhar com listas
    const result3 = await framework.execute(`
numbers = [1, 2, 3, 4, 5]
squares = [x**2 for x in numbers]
squares
    `);
    console.log(`🔢 Quadrados: ${result3}`);

    // 3. Usar variáveis de contexto
    console.log('\n📦 Usando contexto JavaScript:');
    const context = {
      user_name: 'João',
      user_age: 25,
      favorite_color: 'azul'
    };

    const greeting = await framework.execute(`
message = f"Olá {user_name}! Você tem {user_age} anos e gosta de {favorite_color}!"
message
    `, context);
    console.log(`💬 ${greeting}`);

    // 4. Importar módulos Python
    console.log('\n📚 Importando módulos Python:');
    const math = await framework.importPython('math');
    console.log(`🥧 Valor de PI: ${math.pi}`);
    console.log(`📐 Coseno de 0: ${math.cos(0)}`);

    // 5. Avaliar expressões
    console.log('\n🧪 Avaliando expressões:');
    const expr1 = await framework.evalPython('10 * 5 + 3');
    console.log(`🔢 10 * 5 + 3 = ${expr1}`);

    const expr2 = await framework.evalPython('max([1, 5, 3, 9, 2])');
    console.log(`📊 Máximo da lista: ${expr2}`);

    // 6. Obter estatísticas
    console.log('\n📊 Estatísticas do framework:');
    const stats = framework.getStats();
    console.log(`⚡ Execuções realizadas: ${stats.executions}`);
    console.log(`💾 Tokens utilizados: ${stats.tokensUsed}`);
    console.log(`🔌 MCPs carregados: ${stats.mcpsLoaded.join(', ')}`);

    // 7. Gerar relatório
    console.log('\n📄 Relatório de execução:');
    const report = framework.generateReport();
    console.log(report);

  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);

    // Tratamento específico de erros
    if (error.code === 'PYTHON_ERROR') {
      console.log('🐍 Erro no código Python:', error.pythonError);
    } else if (error.code === 'TIMEOUT') {
      console.log('⏰ Execução demorou muito tempo');
    } else {
      console.log('🔍 Tipo de erro:', error.code || 'DESCONHECIDO');
    }
  } finally {
    // 8. Cleanup sempre executado
    console.log('\n🧹 Finalizando framework...');
    await framework.cleanup();
    console.log('✅ Framework finalizado com segurança!');
  }
}

// Executar o exemplo se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  helloWorldExample().catch(console.error);
}

export default helloWorldExample;