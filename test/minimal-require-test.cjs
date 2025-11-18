/**
 * Minimal test to debug __dirname issue
 */

const path = require('path');
const fs = require('fs');

const wrapperPath = path.join(__dirname, '..', 'test', 'fixtures', 'test-skill', 'index-wrapper.cjs');

console.log('Current __dirname:', __dirname);
console.log('Current __filename:', __filename);
console.log('Trying to require:', wrapperPath);
console.log('');

// Check if file exists
if (fs.existsSync(wrapperPath)) {
  console.log('✅ File exists');
  console.log('Content preview:');
  const content = fs.readFileSync(wrapperPath, 'utf8');
  console.log(content.substring(0, 500));
  console.log('');
} else {
  console.log('❌ File does NOT exist');
  process.exit(1);
}

// Try to require it
console.log('\nAttempting require...\n');

try {
  const wrapper = require(wrapperPath);
  console.log('✅ SUCCESS! Module loaded');
  console.log('Exports:', Object.keys(wrapper));
} catch (err) {
  console.log('❌ FAILED with error:');
  console.log('Message:', err.message);
  console.log('\nStack trace:', err.stack);
  process.exit(1);
}
