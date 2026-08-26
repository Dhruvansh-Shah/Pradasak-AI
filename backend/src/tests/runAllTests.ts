import { execSync } from 'child_process';

const suites = [
  { name: 'Unit Tests', file: 'src/tests/unit.test.ts' },
  { name: 'Functional API Tests', file: 'src/tests/functional.test.ts' },
  { name: 'End-to-End Integration Tests', file: 'src/tests/integration.test.ts' },
  { name: 'Performance & Benchmarks', file: 'src/tests/performance.test.ts' },
  { name: 'Concurrency & Stress Tests', file: 'src/tests/stress.test.ts' },
];

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║               PRADARSHAK AI - MASTER TEST SUITE               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const startTime = Date.now();
let totalPassed = 0;
let totalFailed = 0;

for (const suite of suites) {
  console.log(`▶ Executing ${suite.name} (${suite.file})...`);
  try {
    execSync(`npx tsx ${suite.file}`, { stdio: 'inherit', cwd: process.cwd() });
    totalPassed++;
  } catch {
    console.error(`\n❌ Suite Failed: ${suite.name}\n`);
    totalFailed++;
  }
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log(`║ TOTAL SUITES: ${suites.length} | PASSED: ${totalPassed} | FAILED: ${totalFailed} | TIME: ${totalDuration}s ║`);
console.log('╚════════════════════════════════════════════════════════════════╝\n');

process.exit(totalFailed > 0 ? 1 : 0);
