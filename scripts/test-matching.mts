// scripts/test-matching.mts
// ESM TypeScript test runner for the enhanced matching algorithm

import { runTests } from '../src/lib/matching.test.mts';

console.log('🚀 Starting Enhanced Matching Algorithm Test Suite...\n');

// Run the tests
runTests().then(() => {
  console.log('\n✨ Test suite completed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
}); 