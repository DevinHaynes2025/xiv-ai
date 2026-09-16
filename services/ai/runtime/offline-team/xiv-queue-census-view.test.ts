// 12D-273 — adversarial tests for the queue census view. Central
// properties under attack:
//   1. The POLICY GATE: a submission must carry the REAL frozen
//      PINNED_OFFLINE_QUEUE_POLICY, unchanged — a relaxed ceiling or an
//      auto-steal flag is not this queue's book.
//   2. HONEST FLAGS ARE RE-VERIFIED, NEVER TRUSTED: forged
//      liveAgentCount / capacityRowsAreUserStories /
//      hostWideCoordinationVerified refuse.
//   3. CROSS-CONSISTENCY: submissions that could not come from a real
//      queue (expired lease without a lease, zero counts, repeated
//      pairs, total over the ceiling) refuse.
//   4. MEASURED COUNTS ONLY: the ceiling renders as a CEILING, never as
//      achieved usage; the fixtures drive a REAL queue through all five
//      states and the render must match its summary() exactly.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  OFFLINE_QUEUE_POLICY as REAL_QUEUE_POLICY,
  OfflineStoryQueue,
  type OfflineStory,
} from './offline-story-queue';
import {
  PINNED_OFFLINE_QUEUE_POLICY,
  QUEUE_CENSUS_VIEW_GUARDRAILS,
  QUEUE_CENSUS_VIEW_POLICY,
  buildQueueCensusViewModel,
} from './xiv-queue-census-view';

const tenantId = 'census-tenant';
const T0 = 1_000_000;
const clock = () => T0;

const baseStory: OfflineStory = {
  id: 'story-1', tenantId, roleId: 'load_test',
  objective: 'synthetic story for the queue census view',
  acceptance: ['measured facts are hash-bound'], dependencies: [],
  sourceRevision: 'a'.repeat(40), masterPlanSha256: 'b'.repeat(64),
  securityClass: 'ORDINARY', kind: 'PRODUCT_STORY',
};

/** Drive one REAL queue to a spread of states and return its summary(). */
function realQueueSummary(): { summary: unknown; stateCount: number } {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-queue-census-view-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'), clock);
  try {
    q.enqueue([
      { ...baseStory, id: 's-done', sourceRevision: 'a'.repeat(39) + '1' },
      { ...baseStory, id: 's-await', sourceRevision: 'a'.repeat(39) + '2' },
      { ...baseStory, id: 's-failed', sourceRevision: 'a'.repeat(39) + '3' },
      { ...baseStory, id: 's-ready', sourceRevision: 'a'.repeat(39) + '4' },
    ]);
    const settle = (storyId: string, outcome: 'DRAFT' | 'FAILED') => {
      const lease = q.claimNext(tenantId, 'load_test', 'worker-1', 120000);
      assert.ok(lease, `lease for ${storyId}`);
      q.settle(lease!, { outcome, outputHash: 'f'.repeat(64), providerSettled: true });
    };
    settle('s-done', 'DRAFT');
    assert.equal(q.applyReviewDecision({ tenantId, storyId: 's-done', reviewerId: 'secure_code_reviewer', expectedOutputHash: 'f'.repeat(64), decision: 'APPROVED', reviewRef: 'review:done' }), 'DONE');
    settle('s-await', 'DRAFT'); // left AWAITING_REVIEW
    settle('s-failed', 'FAILED');
    const renewLease = q.claimNext(tenantId, 'load_test', 'worker-1', 120000);
    // the READY story is leased but never settled — LEASED state
    assert.ok(renewLease);
    return { summary: q.summary(tenantId), stateCount: q.summary(tenantId).counts.length };
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
}

const REFUSAL_LEAK_CHECK = (
  vm: { display: { headline: string; bodyText: string; operatorNote: string }; reason: string },
  ...secrets: string[]
) => {
  for (const secret of secrets) {
    assert.ok(!vm.display.headline.includes(secret), `headline leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.bodyText.includes(secret), `body leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.operatorNote.includes(secret), `operatorNote leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.reason.includes(secret), `reason leaked ${secret.slice(0, 30)}`);
  }
};

test('12d-273: a REAL queue\'s policy + summary renders the measured census', () => {
  const { summary } = realQueueSummary();
  const vm = buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary });
  assert.ok(vm.kind === 'VERIFIED_QUEUE_CENSUS');
  assert.equal(vm.policyVersion, QUEUE_CENSUS_VIEW_POLICY.policyVersion);
  const s = summary as { counts: { kind: string; state: string; count: number }[]; leaseHeld: boolean; leaseExpired: boolean };
  const total = s.counts.reduce((n, r) => n + r.count, 0);
  assert.equal(vm.display.totalStories, total);
  assert.equal(vm.display.byKind['PRODUCT_STORY'], total);
  assert.equal(vm.display.byState['DONE'], 1);
  assert.equal(vm.display.byState['AWAITING_REVIEW'], 1);
  assert.equal(vm.display.byState['FAILED'], 1);
  assert.equal(vm.display.byState['LEASED'], 1);
  assert.equal(vm.display.byState['READY'], 0);
  assert.equal(vm.display.leaseHeld, s.leaseHeld);
  assert.equal(vm.display.leaseExpired, s.leaseExpired);
  assert.equal(vm.display.policyCeilingRows, 2_000_000);
  assert.equal(vm.display.liveAgentCount, null);
  assert.ok(vm.display.capacityNote.includes('never achieved usage'));
  assert.ok(vm.display.operatorNote.includes('NEVER TRUSTED'));
  assert.ok(vm.display.operatorNote.includes('zero real user stories'));
  assert.ok(Object.isFrozen(vm) && Object.isFrozen(vm.display) && Object.isFrozen(vm.display.byState));
});

test('12d-273: an empty queue renders the measured 0 — the ceiling stays a ceiling', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-queue-census-view-'));
  const q = new OfflineStoryQueue(join(dir, 'empty.sqlite'), clock);
  try {
    const summary = q.summary(tenantId);
    const vm = buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary });
    assert.ok(vm.kind === 'VERIFIED_QUEUE_CENSUS');
    assert.equal(vm.display.totalStories, 0);
    const rendered = JSON.stringify(vm);
    assert.ok(!rendered.includes('trillion'), 'no scale claims');
    assert.ok(rendered.includes('never achieved usage'), 'the ceiling stays labeled');
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('12d-273: the POLICY GATE — a relaxed ceiling or auto-steal flag is not this queue', () => {
  const { summary } = realQueueSummary();
  const relaxed = { ...PINNED_OFFLINE_QUEUE_POLICY, maxRows: 9_999_999_999 };
  assert.equal(buildQueueCensusViewModel({ policy: relaxed, summary }).kind, 'REFUSED');
  const autoSteal = { ...PINNED_OFFLINE_QUEUE_POLICY, automaticallyStealsExpiredLeases: true };
  assert.equal(buildQueueCensusViewModel({ policy: autoSteal, summary }).kind, 'REFUSED');
  const networked = { ...PINNED_OFFLINE_QUEUE_POLICY, networkCalls: true };
  assert.equal(buildQueueCensusViewModel({ policy: networked, summary }).kind, 'REFUSED');
});

test('12d-273: HONEST FLAGS ARE RE-VERIFIED — forged flags refuse with zero leak', () => {
  const { summary } = realQueueSummary();
  const base = summary as Record<string, unknown>;
  const liveAgents = { ...base, liveAgentCount: 42 };
  const vm1 = buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: liveAgents });
  assert.equal(vm1.kind, 'REFUSED');
  assert.ok(vm1.kind === 'REFUSED');
  assert.ok(vm1.reason.includes('honest null'));
  REFUSAL_LEAK_CHECK(vm1, 'census-tenant', 'PRODUCT_STORY');
  const userStories = { ...base, capacityRowsAreUserStories: true };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: userStories }).kind, 'REFUSED');
  const coordVerified = { ...base, hostWideCoordinationVerified: true };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: coordVerified }).kind, 'REFUSED');
});

test('12d-273: CROSS-CONSISTENCY — impossible-in-queue summaries refuse', () => {
  const { summary } = realQueueSummary();
  const base = summary as Record<string, unknown>;
  // expired lease without a held lease
  const ghostExpiry = { ...base, leaseHeld: false, leaseExpired: true };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: ghostExpiry }).kind, 'REFUSED');
  // a zero GROUP BY count
  const zeroCount = { ...base, counts: [...(base.counts as readonly unknown[]), { kind: 'PRODUCT_STORY', state: 'DONE', count: 0 }] };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: zeroCount }).kind, 'REFUSED');
  // a repeated (kind, state) pair
  const first = (base.counts as readonly { kind: string; state: string; count: number }[])[0]!;
  const repeated = { ...base, counts: [...(base.counts as readonly unknown[]), { kind: first.kind, state: first.state, count: 1 }] };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: repeated }).kind, 'REFUSED');
  // a total over the policy ceiling
  const overCeiling = { ...base, counts: [{ kind: 'PRODUCT_STORY', state: 'READY', count: PINNED_OFFLINE_QUEUE_POLICY.maxRows + 1 }] };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: overCeiling }).kind, 'REFUSED');
});

test('12d-273: unknown kinds, states, and negative counts refuse', () => {
  const { summary } = realQueueSummary();
  const base = summary as Record<string, unknown>;
  const badKind = { ...base, counts: [{ kind: 'USER_STORY', state: 'DONE', count: 1 }] };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: badKind }).kind, 'REFUSED');
  const badState = { ...base, counts: [{ kind: 'PRODUCT_STORY', state: 'ACTIVATED', count: 1 }] };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: badState }).kind, 'REFUSED');
  const negative = { ...base, counts: [{ kind: 'PRODUCT_STORY', state: 'DONE', count: -1 }] };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: negative }).kind, 'REFUSED');
  const fractional = { ...base, counts: [{ kind: 'PRODUCT_STORY', state: 'DONE', count: 1.5 }] };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: fractional }).kind, 'REFUSED');
});

test('12d-273: the exact-keys gates refuse reordering, extras, and absences', () => {
  const { summary } = realQueueSummary();
  const reorderedInput = { summary, policy: PINNED_OFFLINE_QUEUE_POLICY } as unknown as Record<string, unknown>;
  assert.equal(buildQueueCensusViewModel(reorderedInput).kind, 'REFUSED');
  const extra = { policy: PINNED_OFFLINE_QUEUE_POLICY, summary, smuggled: true } as unknown as Record<string, unknown>;
  assert.equal(buildQueueCensusViewModel(extra).kind, 'REFUSED');
  const missing = { policy: PINNED_OFFLINE_QUEUE_POLICY } as unknown as Record<string, unknown>;
  assert.equal(buildQueueCensusViewModel(missing).kind, 'REFUSED');
  // a reordered SUMMARY is not this queue's summary() output either
  const reorderedSummary = summary as Record<string, unknown>;
  const flip = { counts: reorderedSummary.counts, leaseHeld: reorderedSummary.leaseHeld, leaseExpired: reorderedSummary.leaseExpired, capacityRowsAreUserStories: reorderedSummary.capacityRowsAreUserStories, hostWideCoordinationVerified: reorderedSummary.hostWideCoordinationVerified, liveAgentCount: reorderedSummary.liveAgentCount };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: flip }).kind, 'REFUSED');
  // a count row with reordered keys refuses
  const base = summary as Record<string, unknown>;
  const badRows = { ...base, counts: [{ count: 1, state: 'DONE', kind: 'PRODUCT_STORY' }] };
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: badRows }).kind, 'REFUSED');
});

test('12d-273: malformed submissions HOLD — null, array, string, number, boolean, undefined', () => {
  for (const raw of [null, [], 'string', 42, true, undefined]) {
    const vm = buildQueueCensusViewModel(raw);
    assert.equal(vm.kind, 'REFUSED', `${String(raw)} must refuse`);
    assert.ok(vm.kind === 'REFUSED');
    assert.ok(vm.reason.length > 0);
  }
  const { summary } = realQueueSummary();
  const base2 = summary as Record<string, unknown>;
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: { ...base2, counts: 'not-an-array' } }).kind, 'REFUSED');
  assert.equal(buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary: { ...base2, counts: [42] } }).kind, 'REFUSED');
});

test('12d-273: the verified census never carries an affordance and claims no activation', () => {
  const { summary } = realQueueSummary();
  const vm = buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary });
  assert.ok(vm.kind === 'VERIFIED_QUEUE_CENSUS');
  const rendered = JSON.stringify(vm);
  assert.ok(!rendered.includes('activate '), 'no activation verb');
  assert.ok(!rendered.includes('promote'), 'no learning promotion verb');
  assert.ok(!rendered.includes('are user stories":true'), 'no forged honesty flags');
  assert.ok(rendered.includes('"liveAgentCount":null'), 'the honest null renders');
});

test('12d-273: the census renders story CONTENT never — counts only', () => {
  const { summary } = realQueueSummary();
  const vm = buildQueueCensusViewModel({ policy: PINNED_OFFLINE_QUEUE_POLICY, summary });
  assert.ok(vm.kind === 'VERIFIED_QUEUE_CENSUS');
  const rendered = JSON.stringify(vm);
  assert.ok(!rendered.includes('synthetic story'), 'no story objectives in a census render');
  assert.ok(!rendered.includes('load_test'), 'no role ids in a census render');
  assert.ok(!rendered.includes('census-tenant'), 'no tenant ids in a census render');
});

test('12d-273: POLICY SNAPSHOT GATE — the pinned snapshot equals the REAL policy exactly', () => {
  assert.ok(Object.isFrozen(PINNED_OFFLINE_QUEUE_POLICY));
  assert.ok(Object.isFrozen(REAL_QUEUE_POLICY));
  assert.equal(JSON.stringify(PINNED_OFFLINE_QUEUE_POLICY), JSON.stringify(REAL_QUEUE_POLICY),
    'the snapshot has drifted from the REAL offline queue policy — update the view deliberately, by a reviewed change');
  assert.equal(REAL_QUEUE_POLICY.maxRows, 2_000_000, 'the only measured-ceiling bound stays 2,000,000 rows/database');
});

test('12d-273: guardrails and policy are pinned and frozen', () => {
  assert.ok(Object.isFrozen(QUEUE_CENSUS_VIEW_POLICY));
  assert.ok(Object.isFrozen(QUEUE_CENSUS_VIEW_GUARDRAILS));
  assert.ok(Object.isFrozen(PINNED_OFFLINE_QUEUE_POLICY));
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.modelCalls, 0);
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.remoteCalls, 0);
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.learningPromoted, false);
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.automaticRecovery, false);
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.billionUsersProven, false);
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.measuredCountsOnly, true);
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.noWritePath, true);
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.noActivationPath, true);
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.crossConsistencyGates, true);
  assert.equal(QUEUE_CENSUS_VIEW_GUARDRAILS.honestFlagsReVerifiedNeverTrusted, true);
});