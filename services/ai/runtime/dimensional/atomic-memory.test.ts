import assert from 'node:assert/strict';
import {
  ATOMIC_MEMORY_GUARDRAILS,
  historicalPath,
  shardFacts,
  stableFactId,
  type AtomicFact,
} from './atomic-memory';

const rawA = {
  subject: 'Ancient trade route',
  predicate: 'influenced',
  object: 'regional commerce network',
  era: 'ANCIENT' as const,
  sourceIds: ['source-1'],
  evidence: 'OBSERVED' as const,
  confidence: 0.9,
};
const rawB = {
  subject: 'regional commerce network',
  predicate: 'influenced',
  object: 'modern supply-chain pattern',
  era: 'MODERN' as const,
  sourceIds: ['source-2'],
  evidence: 'DERIVED' as const,
  confidence: 0.8,
};
const facts: AtomicFact[] = [
  { ...rawA, id: stableFactId(rawA) },
  { ...rawB, id: stableFactId(rawB) },
];

assert.equal(stableFactId(rawA), stableFactId(rawA));
assert.notEqual(facts[0].id, facts[1].id);

const shard = shardFacts(facts, 12, 'global-public');
assert.equal(shard.dimension, 12);
assert.equal(shard.factIds.length, 2);
assert.equal(shard.offlineEligible, true);
assert.ok(shard.checksum.length > 32);

const path = historicalPath(facts, 'Ancient trade route', 'modern supply-chain pattern');
assert.ok(path);
assert.equal(path!.factIds.length, 2);
assert.equal(Number(path!.score.toFixed(2)), 0.72);
assert.deepEqual(path!.eras, ['ANCIENT', 'MODERN']);

assert.throws(() => shardFacts(facts, 0, 'x'));
assert.throws(() => shardFacts(facts, 101, 'x'));
assert.equal(ATOMIC_MEMORY_GUARDRAILS.literalAtomicStorageClaim, false);
assert.equal(ATOMIC_MEMORY_GUARDRAILS.biologicalCloningCapability, false);
assert.equal(ATOMIC_MEMORY_GUARDRAILS.hypothesesStoredAsFacts, false);

console.log('12D-02 Atomic Knowledge + Historical Memory Fabric contracts hold.');
