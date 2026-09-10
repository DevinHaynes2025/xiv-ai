import assert from 'node:assert/strict';
import {
  CURRENT_DIMENSIONAL_MILESTONE,
  DEFAULT_BENCHMARK_ITERATIONS,
  DIMENSION_LADDER,
  PRODUCTION_DIMENSIONAL_FABRIC_ENABLED,
  RESEARCH_DIMENSION_CEILING,
  createDimensionLadderBenchmarks,
  runDimensionBenchmarks,
  runSingleDimensionBenchmark,
} from './index';

assert.equal(CURRENT_DIMENSIONAL_MILESTONE, 12);
assert.equal(RESEARCH_DIMENSION_CEILING, 100);
assert.equal(PRODUCTION_DIMENSIONAL_FABRIC_ENABLED, false);
assert.equal(DEFAULT_BENCHMARK_ITERATIONS, 64);

// Stubs remain NOT_RUN until harness executes
const stubs = createDimensionLadderBenchmarks();
assert.equal(stubs.length, DIMENSION_LADDER.length);
assert.ok(stubs.every((b) => b.status === 'NOT_RUN'));
assert.ok(stubs.every((b) => b.quality.defects === 0));
assert.ok(stubs.every((b) => b.quality.evidenceCoverage === 'WAITING'));

// Full ladder CPU-only run
const results = runDimensionBenchmarks({ iterations: 16 });
assert.equal(results.length, 6);
assert.deepEqual(
  results.map((r) => r.dimensions),
  [3, 6, 12, 24, 50, 100],
);

for (const result of results) {
  assert.equal(result.status, 'RUN');
  assert.equal(result.backend, 'cpu');
  assert.ok(result.executedAt);
  assert.equal(typeof result.metrics.latencyMs, 'number');
  assert.ok((result.metrics.latencyMs as number) >= 0);
  assert.equal(typeof result.quality.latencyMs, 'number');
  assert.equal(typeof result.quality.throughputOps, 'number');
  assert.equal(result.quality.defects, 0);
  assert.equal(result.quality.evidenceCoverage, 'WAITING');
  assert.equal(result.quality.falseLinkRate, 'WAITING');
  assert.equal(result.quality.reproducibility, 'WAITING');
  assert.ok(result.notes.includes('CPU-only'));
  assert.ok(!/\b(GPU|NPU|QPU)\s+VERIFIED\b/.test(result.notes));
  assert.ok(result.notes.includes('no device receipt'));
  assert.ok(result.iterations > 0);
}

const single = runSingleDimensionBenchmark(12, { iterations: 4 });
assert.equal(single.dimensions, 12);
assert.equal(single.status, 'RUN');
assert.equal(single.backend, 'cpu');

assert.throws(() => runDimensionBenchmarks({ dimensions: [7 as never] }), RangeError);

console.log('XIV 12D-03 local dimension benchmark runner contracts hold (CPU-only RUN, L4=false).');
