// test-matching.js
// Simple test runner for the enhanced matching algorithm

const { runTests } = require('./src/lib/matching.test.ts');

console.log('🚀 Starting Enhanced Matching Algorithm Test Suite...\n');

// Run the tests
runTests().then(() => {
  console.log('\n✨ Test suite completed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
}); 