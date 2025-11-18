/**
 * Test wrapper directly from CommonJS context
 */

const path = require('path');

const wrapperPath = path.join(__dirname, '..', 'test', 'fixtures', 'test-skill', 'index-wrapper.cjs');

console.log('Testing direct require of wrapper from CommonJS context...\n');
console.log('Wrapper path:', wrapperPath);
console.log('');

try {
  // Clear cache first
  delete require.cache[wrapperPath];

  const wrapper = require(wrapperPath);
  console.log('✅ Wrapper loaded successfully!');
  console.log('Exports:', Object.keys(wrapper));
  console.log('');

  if (wrapper.execute) {
    console.log('✅ Execute function found');
    wrapper.execute({ name: 'Test', greeting: 'Hello' })
      .then(result => {
        console.log('\n✅ Execution result:', JSON.stringify(result, null, 2));
      })
      .catch(err => {
        console.error('\n❌ Execution error:', err.message);
      });
  } else {
    console.log('❌ Execute function not found');
  }
} catch (error) {
  console.error('❌ Error loading wrapper:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
