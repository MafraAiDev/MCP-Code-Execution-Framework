/**
 * @fileoverview Demonstração do Python Process Pool
 * @module test/demo-process-pool
 */

import PythonProcessPool from '../core/process-pool.cjs';

console.log('🚀 Iniciando demonstração do Python Process Pool\n');

async function main() {
  try {
    // 1. Inicializar pool
    console.log('📦 Inicializando pool com 2 processos...');
    const pool = new PythonProcessPool({
      poolSize: 2,
      healthCheckInterval: 10000
    });

    await pool.initialize();
    console.log('✅ Pool inicializado\n');

    // 2. Mostrar estatísticas iniciais
    console.log('📊 Estatísticas iniciais:');
    console.log(JSON.stringify(pool.getStats(), null, 2));
    console.log('');

    // 3. Testar execuções paralelas
    console.log('⚡ Executando 3 testes em paralelo (poolSize=2, deve enfileirar 1)...');

    const startTime = Date.now();

    const requests = [
      { skillName: 'test-skill', params: { name: 'Alice', greeting: 'Hello' } },
      { skillName: 'test-skill', params: { name: 'Bob', greeting: 'Hi' } },
      { skillName: 'test-skill', params: { name: 'Charlie', greeting: 'Hey' } }
    ];

    const results = await Promise.all(
      requests.map(async (req, index) => {
        const reqStart = Date.now();
        try {
          const process = await pool._getAvailableProcess();
          console.log(`  ✅ Requisição ${index + 1}: Processo #${process.id} obtido`);

          // Simular execução
          await new Promise(resolve => setTimeout(resolve, 200));

          pool.available = pool.available.filter(p => p.id !== process.id);
          pool.busy.push(process);

          await new Promise(resolve => setTimeout(resolve, 1000));

          pool.busy = pool.busy.filter(p => p.id !== process.id);
          pool.available.push(process);
          pool._processQueue();

          const executionTime = Date.now() - reqStart;
          return { index: index + 1, success: true, executionTime };
        } catch (error) {
          return { index: index + 1, success: false, error: error.message };
        }
      })
    );

    const totalTime = Date.now() - startTime;

    console.log('\n📈 Resultados:');
    results.forEach(r => {
      console.log(`  Teste ${r.index}: ${r.success ? '✅' : '❌'} ${r.executionTime}ms`);
    });
    console.log(`\n  Tempo total: ${totalTime}ms`);
    console.log(`  Speedup: ${(requests.length * 1200 / totalTime).toFixed(2)}x\n`);

    // 4. Mostrar estatísticas finais
    console.log('📊 Estatísticas finais:');
    const finalStats = pool.getStats();
    console.log(JSON.stringify(finalStats, null, 2));
    console.log('');

    // 5. Testar métricas
    console.log('📏 Verificando métricas:');
    console.log(`  📌 Taxa de reuso: ${finalStats.reuseRate} (${finalStats.reuseCount}/${finalStats.totalRequests})`);
    console.log(`  📌 Utilização: ${finalStats.utilization}`);
    console.log(`  📌 Requests enfileirados: ${finalStats.queuedRequests}`);
    console.log(`  📌 Spawn count: ${finalStats.spawnCount}`);
    console.log('');

    // 6. Testar health checks
    console.log('🔍 Testando health checks (aguarde 3s)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(`  ✅ Health check failures: ${pool.stats.healthCheckFailures}`);
    console.log('');

    // 7. Limpar
    console.log('🧹 Limpando pool...');
    await pool.cleanup();
    console.log('✅ Concluído!\n');

    return {
      success: true,
      totalTime,
      reuseRate: finalStats.reuseRate,
      queuedRequests: finalStats.queuedRequests
    };
  } catch (error) {
    console.error('\n❌ Erro na demonstração:', error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Executar demonstração
main().then(result => {
  if (result.success) {
    console.log('🏆 Demonstração concluída com sucesso!');
    console.log(`   Tempo total: ${result.totalTime}ms`);
    console.log(`   Taxa de reuso: ${result.reuseRate}`);
    console.log(`   Requests enfileirados: ${result.queuedRequests}`);

    if (parseFloat(result.reuseRate) >= 50) {
      console.log('\n✨ Meta de reuso (>50%) atingida!');
    }
  }
  process.exit(result.success ? 0 : 1);
});
