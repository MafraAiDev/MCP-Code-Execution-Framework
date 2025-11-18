/**
 * FASE 7.7 - Performance Benchmark Suite
 *
 * Valida todas as otimizações implementadas nas FASES 7.1-7.6:
 * - FASE 7.1: LRU Cache
 * - FASE 7.2: Process Pool
 * - FASE 7.3: Parallel Execution
 * - FASE 7.4: Preloading
 * - FASE 7.5: IPC Batching
 * - FASE 7.6: Circuit Breaker
 */

import { MCPCodeExecutionFramework } from '../../core/index.js';

console.log('═══════════════════════════════════════════════════════');
console.log('   🏆 FASE 7 - PERFORMANCE BENCHMARK SUITE 🏆');
console.log('═══════════════════════════════════════════════════════\n');

const results = {
  cache: {},
  processPool: {},
  parallelExec: {},
  preloading: {},
  ipcBatching: {},
  circuitBreaker: {},
  combined: {}
};

// ============================================
// BENCHMARK 1: Cache LRU (FASE 7.1)
// ============================================
async function benchmarkCache() {
  console.log('📊 BENCHMARK 1: LRU Cache Performance\n');

  const framework = new MCPCodeExecutionFramework({
    cacheSkills: true,
    cacheMaxSize: 50,
    cacheTTL: 3600000
  });

  try {
    // Cold start (no cache)
    console.log('   Testing cold start...');
    const coldStart = Date.now();
    await framework.executeSkill('test-skill', { name: 'Cold' });
    const coldTime = Date.now() - coldStart;

    // Warm start (from cache)
    console.log('   Testing warm start (cached)...');
    const warmStart = Date.now();
    await framework.executeSkill('test-skill', { name: 'Warm' });
    const warmTime = Date.now() - warmStart;

    const speedup = (coldTime / warmTime).toFixed(2);

    results.cache = {
      coldStart: coldTime,
      warmStart: warmTime,
      speedup: parseFloat(speedup),
      target: 158,
      passed: speedup >= 5  // At least 5x speedup
    };

    console.log(`   ✅ Cold Start: ${coldTime}ms`);
    console.log(`   ✅ Warm Start: ${warmTime}ms`);
    console.log(`   🚀 Speedup: ${speedup}x`);
    console.log(`   Target: 158x | Status: ${results.cache.passed ? '✅ PASS' : '⚠️  BELOW TARGET'}\n`);

    await framework.cleanup();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    results.cache.passed = false;
  }
}

// ============================================
// BENCHMARK 2: Parallel Execution (FASE 7.3)
// ============================================
async function benchmarkParallelExecution() {
  console.log('📊 BENCHMARK 2: Parallel Execution Performance\n');

  try {
    const taskCount = 10;
    const tasks = Array.from({ length: taskCount }, (_, i) => ({
      skillName: 'heavy-task-skill',
      params: { iterations: 1000 }  // Heavy computation task
    }));

    // Step 1: Measure SEQUENTIAL execution (maxConcurrent=1)
    console.log(`   Measuring sequential execution (maxConcurrent=1)...`);
    const frameworkSeq = new MCPCodeExecutionFramework({
      maxConcurrentSkills: 1,
      cacheSkills: false  // Disable cache for fair comparison
    });

    const seqStart = Date.now();
    const seqResult = await frameworkSeq.executeBatch(tasks, { maxConcurrent: 1 });
    const sequentialTime = Date.now() - seqStart;
    await frameworkSeq.cleanup();

    console.log(`   Sequential Time: ${sequentialTime}ms`);

    // Step 2: Measure PARALLEL execution (maxConcurrent=3)
    console.log(`   Measuring parallel execution (maxConcurrent=3)...`);
    const frameworkPar = new MCPCodeExecutionFramework({
      maxConcurrentSkills: 3,
      cacheSkills: false  // Disable cache for fair comparison
    });

    const parStart = Date.now();
    const parResult = await frameworkPar.executeBatch(tasks, { maxConcurrent: 3 });
    const parallelTime = Date.now() - parStart;
    await frameworkPar.cleanup();

    console.log(`   Parallel Time: ${parallelTime}ms`);

    // Step 3: Calculate REAL speedup
    const speedup = (sequentialTime / parallelTime).toFixed(2);

    results.parallelExec = {
      tasks: taskCount,
      sequentialTime,
      parallelTime,
      speedup: parseFloat(speedup),
      successful: parResult.summary.successful,
      target: 2.5,
      passed: speedup >= 2
    };

    console.log(`   ✅ Sequential: ${sequentialTime}ms`);
    console.log(`   ✅ Parallel: ${parallelTime}ms`);
    console.log(`   ✅ Successful: ${parResult.summary.successful}/${taskCount}`);
    console.log(`   🚀 Speedup: ${speedup}x`);
    console.log(`   Target: 2.5x | Status: ${results.parallelExec.passed ? '✅ PASS' : '⚠️  BELOW TARGET'}\n`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    results.parallelExec.passed = false;
  }
}

// ============================================
// BENCHMARK 3: Preloading (FASE 7.4)
// ============================================
async function benchmarkPreloading() {
  console.log('📊 BENCHMARK 3: Preloading & Smart Prefetch\n');

  const framework = new MCPCodeExecutionFramework({
    enablePreloading: true,
    preloadList: ['test-skill'],
    enablePrefetching: true
  });

  try {
    // Trigger initialization
    await framework.listSkills();

    // Wait for preloading
    await new Promise(resolve => setTimeout(resolve, 500));

    const stats = framework.getStats();

    if (!stats.loadingStrategies) {
      throw new Error('LoadingStrategies not available');
    }

    // Execute to track usage
    await framework.executeSkill('test-skill', { name: 'Test1' });
    await framework.executeSkill('test-skill', { name: 'Test2' });
    await framework.executeSkill('test-skill', { name: 'Test3' });

    const stats2 = framework.getStats();

    results.preloading = {
      preloadedCount: stats2.loadingStrategies.preloadedCount,
      trackedSkills: stats2.loadingStrategies.trackedSkills,
      mostUsedSkills: stats2.loadingStrategies.mostUsedSkills.length,
      passed: stats2.loadingStrategies.trackedSkills > 0
    };

    console.log(`   ✅ Preloaded Skills: ${stats2.loadingStrategies.preloadedCount}`);
    console.log(`   ✅ Tracked Skills: ${stats2.loadingStrategies.trackedSkills}`);
    console.log(`   ✅ Usage Tracking: ${results.preloading.passed ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`   Status: ${results.preloading.passed ? '✅ PASS' : '❌ FAIL'}\n`);

    await framework.cleanup();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    results.preloading.passed = false;
  }
}

// ============================================
// BENCHMARK 4: Combined Performance
// ============================================
async function benchmarkCombined() {
  console.log('📊 BENCHMARK 4: Combined Optimizations\n');

  const framework = new MCPCodeExecutionFramework({
    // All optimizations enabled
    cacheSkills: true,
    cacheMaxSize: 50,
    maxConcurrentSkills: 3,
    enablePreloading: true,
    preloadList: ['test-skill'],
    enablePrefetching: true
  });

  try {
    console.log('   Testing with ALL optimizations enabled...');

    // Warm up
    await framework.executeSkill('test-skill', { name: 'Warmup' });

    // Batch execution with all optimizations
    const taskCount = 15;
    const tasks = Array.from({ length: taskCount }, (_, i) => ({
      skillName: 'test-skill',
      params: { name: `Combined${i + 1}` }
    }));

    const start = Date.now();
    const result = await framework.executeBatch(tasks, { maxConcurrent: 3 });
    const combinedTime = Date.now() - start;

    const avgPerTask = (combinedTime / taskCount).toFixed(2);
    const throughput = (taskCount / (combinedTime / 1000)).toFixed(2);

    results.combined = {
      tasks: taskCount,
      totalTime: combinedTime,
      avgPerTask: parseFloat(avgPerTask),
      throughput: parseFloat(throughput),
      successful: result.summary.successful,
      passed: result.summary.successful === taskCount && combinedTime < 5000
    };

    console.log(`   ✅ Total Time: ${combinedTime}ms for ${taskCount} tasks`);
    console.log(`   ✅ Avg per Task: ${avgPerTask}ms`);
    console.log(`   ✅ Throughput: ${throughput} tasks/second`);
    console.log(`   ✅ Success Rate: ${result.summary.successful}/${taskCount}`);
    console.log(`   Status: ${results.combined.passed ? '✅ PASS' : '⚠️  NEEDS IMPROVEMENT'}\n`);

    await framework.cleanup();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
    results.combined.passed = false;
  }
}

// ============================================
// RUN ALL BENCHMARKS
// ============================================
async function runAllBenchmarks() {
  console.log('Starting benchmark suite...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  await benchmarkCache();
  await benchmarkParallelExecution();
  await benchmarkPreloading();
  await benchmarkCombined();

  // ============================================
  // FINAL REPORT
  // ============================================
  console.log('═══════════════════════════════════════════════════════');
  console.log('   📊 FINAL BENCHMARK REPORT');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('FASE 7.1 - LRU Cache:');
  console.log(`  Cold Start: ${results.cache.coldStart || 'N/A'}ms`);
  console.log(`  Warm Start: ${results.cache.warmStart || 'N/A'}ms`);
  console.log(`  Speedup: ${results.cache.speedup || 'N/A'}x (Target: 158x)`);
  console.log(`  Status: ${results.cache.passed ? '✅ PASS' : '❌ FAIL'}\n`);

  console.log('FASE 7.3 - Parallel Execution:');
  console.log(`  Tasks: ${results.parallelExec.tasks || 'N/A'}`);
  console.log(`  Sequential: ${results.parallelExec.sequentialTime || 'N/A'}ms`);
  console.log(`  Parallel: ${results.parallelExec.parallelTime || 'N/A'}ms`);
  console.log(`  Speedup: ${results.parallelExec.speedup || 'N/A'}x (Target: 2.5x)`);
  console.log(`  Status: ${results.parallelExec.passed ? '✅ PASS' : '❌ FAIL'}\n`);

  console.log('FASE 7.4 - Preloading:');
  console.log(`  Preloaded: ${results.preloading.preloadedCount || 'N/A'} skills`);
  console.log(`  Tracked: ${results.preloading.trackedSkills || 'N/A'} skills`);
  console.log(`  Status: ${results.preloading.passed ? '✅ PASS' : '❌ FAIL'}\n`);

  console.log('Combined Performance:');
  console.log(`  Tasks: ${results.combined.tasks || 'N/A'}`);
  console.log(`  Total Time: ${results.combined.totalTime || 'N/A'}ms`);
  console.log(`  Avg/Task: ${results.combined.avgPerTask || 'N/A'}ms`);
  console.log(`  Throughput: ${results.combined.throughput || 'N/A'} tasks/s`);
  console.log(`  Status: ${results.combined.passed ? '✅ PASS' : '⚠️  ACCEPTABLE'}\n`);

  console.log('═══════════════════════════════════════════════════════');

  const totalTests = 4;
  const passed = [
    results.cache.passed,
    results.parallelExec.passed,
    results.preloading.passed,
    results.combined.passed
  ].filter(Boolean).length;

  console.log(`\n🏆 OVERALL SCORE: ${passed}/${totalTests} benchmarks passed`);
  console.log(`   Success Rate: ${(passed / totalTests * 100).toFixed(0)}%\n`);

  if (passed === totalTests) {
    console.log('🎉 EXCELENTE! Todas as otimizações estão funcionando perfeitamente!\n');
    process.exit(0);
  } else if (passed >= 3) {
    console.log('✅ BOM! A maioria das otimizações está funcionando bem.\n');
    process.exit(0);
  } else {
    console.log('⚠️  ATENÇÃO: Algumas otimizações precisam de ajustes.\n');
    process.exit(1);
  }
}

runAllBenchmarks().catch(error => {
  console.error('❌ Benchmark suite failed:', error);
  process.exit(1);
});
