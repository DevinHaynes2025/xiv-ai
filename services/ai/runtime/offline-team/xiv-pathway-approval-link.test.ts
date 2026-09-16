// 12D-269 — adversarial tests for the pathway approval link. Central
// properties under attack:
//   1. The CANDIDATE-BYTES BINDING: a recorded decision approves ONLY the
//      exact candidate bytes it was recorded over — a different candidate,
//      a tampered field, or a foreign identity refuses.
//   2. ELIGIBILITY IS RE-EVALUATED, NEVER TRUSTED — a forged packet
//      claiming eligibility cannot shortcut the real 12D-89 gate.
//   3. REJECTED is a decision with NO ledger path.
//   4. The end-to-end loop: bridge packet → recorded decision → 12D-264
//      ledger — and NOTHING before the recorded decision ledger.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { preparePathwayCandidateFromQueue, type PathwayEvidencePacket } from './pathway-evidence-bridge';
import { appendPathwayCandidate, replayPathwayCensus, type PathwayLedgerStore } from './xiv-pathway-ledger';
import { evaluatePathwayCandidate } from './neural-pathway-growth-engine';
import {
  PATHWAY_APPROVAL_GUARDRAILS,
  PATHWAY_APPROVAL_POLICY,
  applyRecordedApproval,
  buildPathwayApprovalPlan,
  candidateDigest,
  derivePathwayApprovalReceipt,
  verifyPathwayApprovalPlan,
} from './xiv-pathway-approval-link';

const tenantId = 'pathway-tenant';
const outputHash = 'f'.repeat(64);
const GENESIS = '12d-269-ledger-genesis';
const OPERATOR = 'operator:devin';
const NOW_MS = 1_000_000;

const story: OfflineStory = {
  id: 'story-1', tenantId, roleId: 'load_test',
  objective: 'synthetic reviewed story for the pathway approval link',
  acceptance: ['reviewed result is hash-bound'], dependencies: [],
  sourceRevision: 'a'.repeat(40), masterPlanSha256: 'b'.repeat(64),
  securityClass: 'ORDINARY', kind: 'PRODUCT_STORY',
};

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-pathway-approval-link-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
  return { q, done: () => { q.close(); rmSync(dir, { recursive: true, force: true }); } };
}

let storySeq = 0;
function bridgePacket(q: OfflineStoryQueue, overrides: Record<string, unknown> = {}): PathwayEvidencePacket {
  // Each packet binds its OWN story — the queue refuses duplicate ids.
  storySeq += 1;
  const storyId = `story-${storySeq}`;
  const qStory: OfflineStory = { ...story, id: storyId, sourceRevision: ('a'.repeat(39) + String(storySeq % 10)) };
  q.enqueue([qStory]);
  const lease = q.claimNext(tenantId, 'load_test', 'worker-1', 120000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash, providerSettled: true });
  q.applyReviewDecision({ tenantId, storyId, reviewerId: 'secure_code_reviewer', expectedOutputHash: outputHash, decision: 'APPROVED', reviewRef: 'review:queue-approved' });
  return preparePathwayCandidateFromQueue(q, {
    tenantId, storyId, expectedOutputHash: outputHash,
    pathwayId: 'pathway-269', domain: 'OPERATIONS', version: 1,
    confidence: 0.91, evaluationScore: 0.96,
    evidenceRefs: ['run:synthetic-1'],
    reviewRefs: ['review:one', 'review:two'],
    rollbackRef: 'rollback:pathway-1',
    ...overrides,
  });
}

class MemoryLedgerStore implements PathwayLedgerStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

test('12d-269: bridge packet → recorded decision → LEDGER-READY candidate → the 12D-264 ledger appends it', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    assert.equal(plan.policyVersion, PATHWAY_APPROVAL_POLICY.policyVersion);
    assert.match(plan.decisionReceiptSha256, /^[0-9a-f]{64}$/);
    const outcome = applyRecordedApproval(packet, plan);
    assert.ok(outcome.kind === 'LEDGER_READY_PATHWAY_CANDIDATE');
    assert.equal(outcome.candidate.humanApproved, true);
    assert.equal(outcome.candidate.pathwayId, 'pathway-269');
    assert.equal(outcome.decisionReceiptSha256, plan.decisionReceiptSha256);
    assert.equal(outcome.learningPromoted, false);
    assert.equal(outcome.ledgeredNeverActivated, true);
    // The end-to-end proof: the ledger-ready candidate LEDGERS.
    const store = new MemoryLedgerStore();
    const entry = appendPathwayCandidate(store, GENESIS, outcome.candidate);
    assert.equal(entry.op, 'CANDIDATE_LEDGERED');
    const census = replayPathwayCensus(store, GENESIS);
    assert.equal(census.entries, 1);
    assert.equal(census.activated, 0);
  } finally { f.done(); }
});

test('12d-269: REJECTED is a decision — recorded honestly, with NO ledger path', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'REJECTED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const outcome = applyRecordedApproval(packet, plan);
    assert.ok(outcome.kind === 'CANDIDATE_REJECTED_RECORDED');
    assert.ok(!('candidate' in outcome), 'a rejected candidate yields no ledger-ready shape');
    assert.notEqual(plan.decisionReceiptSha256,
      buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS }).decisionReceiptSha256);
    // The unapproved candidate the bridge produced still cannot ledger —
    // the ledger path stays structurally closed behind a REJECTED record.
    assert.throws(() => appendPathwayCandidate(new MemoryLedgerStore(), GENESIS, packet.candidate), /fail closed|human/);
  } finally { f.done(); }
});

test('12d-269: CROSS-BINDING — a decision recorded over candidate B cannot approve candidate A', () => {
  const f = fixture();
  try {
    const packetA = bridgePacket(f.q);
    const packetB = bridgePacket(f.q, { pathwayId: 'pathway-2', confidence: 0.93 });
    assert.notEqual(candidateDigest(packetA.candidate), candidateDigest(packetB.candidate));
    const planB = buildPathwayApprovalPlan({ packet: packetB, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    assert.throws(() => applyRecordedApproval(packetA, planB), /candidateDigest mismatch/);
  } finally { f.done(); }
});

test('12d-269: a candidate tampered after the decision refuses the binding', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const tampered = { ...packet, candidate: { ...packet.candidate, confidence: 0.99 } } as unknown as PathwayEvidencePacket;
    assert.throws(() => applyRecordedApproval(tampered, plan), /candidateDigest mismatch/);
  } finally { f.done(); }
});

test('12d-269: an identity-mismatched record refuses even with a compensating digest', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const forged = {
      ...plan,
      decisionRecord: { ...plan.decisionRecord, pathwayId: 'pathway-other', candidateDigestSha256: plan.decisionRecord.candidateDigestSha256 },
    };
    // The receipt re-derivation in verify refuses the edited record before
    // the identity gate — either way it refuses.
    assert.throws(() => applyRecordedApproval(packet, forged), /fail closed/);
  } finally { f.done(); }
});

test('12d-269: a decision flipped after the fact refuses (receipt mismatch)', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const flipped = {
      ...plan,
      decisionRecord: { ...plan.decisionRecord, decision: 'REJECTED' },
    };
    assert.throws(() => applyRecordedApproval(packet, flipped), /receipt mismatch/);
  } finally { f.done(); }
});

test('12d-269: a credential-shaped decidedBy refuses INSIDE the verifier — forged plans cannot verify', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const digest = candidateDigest(packet.candidate);
    const record = {
      pathwayId: 'pathway-269', version: 1, tenantId,
      candidateDigestSha256: digest,
      decision: 'APPROVED' as const, decidedBy: 'sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', decidedAtMs: NOW_MS,
    };
    const receipt = derivePathwayApprovalReceipt(record);
    const forged = {
      policyVersion: PATHWAY_APPROVAL_POLICY.policyVersion,
      decisionReceiptSha256: receipt,
      decisionRecord: record,
      steps: [{ op: 'register', receiptSha256: receipt, purpose: PATHWAY_APPROVAL_POLICY.purpose, registeredBy: record.decidedBy, issuedAtMs: NOW_MS, atMs: NOW_MS }],
    };
    assert.throws(() => verifyPathwayApprovalPlan(forged), /credential-shaped content/);
  } finally { f.done(); }
});

test('12d-269: ELIGIBILITY IS RE-EVALUATED — a forged packet claiming eligibility cannot shortcut the real gate', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q, { evaluationScore: 0.5 });
    assert.equal(packet.currentEligibility.eligible, false);
    const forged = { ...packet, currentEligibility: { eligible: true, reasons: [] } } as unknown as PathwayEvidencePacket;
    const plan = buildPathwayApprovalPlan({ packet: forged, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    // The REAL 12D-89 gate re-runs at apply time on the APPROVED candidate.
    assert.throws(() => applyRecordedApproval(forged, plan), /not eligible/);
    // And the re-evaluation is honest: the same candidate WITH the recorded
    // approval is judged by the gate on its own merits.
    assert.equal(evaluatePathwayCandidate({ ...forged.candidate, humanApproved: true }).eligible, false);
  } finally { f.done(); }
});

test('12d-269: exact-keys gates — packet keys, plan keys, and record keys all refuse disorder', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const packetCopy = { ...packet } as unknown as Record<string, unknown>;
    const reorderedPacket = { candidate: packetCopy.candidate, kind: packetCopy.kind } as unknown as PathwayEvidencePacket;
    assert.throws(() => buildPathwayApprovalPlan({ packet: reorderedPacket, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS }), /fail closed/);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const reorderedPlan = {
      steps: plan.steps, policyVersion: plan.policyVersion,
      decisionRecord: plan.decisionRecord, decisionReceiptSha256: plan.decisionReceiptSha256,
    };
    assert.throws(() => verifyPathwayApprovalPlan(reorderedPlan), /in order/);
    const extra = { ...plan, smuggled: true };
    assert.throws(() => verifyPathwayApprovalPlan(extra), /in order/);
  } finally { f.done(); }
});

test('12d-269: a candidate that already claims humanApproved cannot enter the link', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const selfApproved = { ...packet, candidate: { ...packet.candidate, humanApproved: true } } as unknown as PathwayEvidencePacket;
    assert.throws(() => buildPathwayApprovalPlan({ packet: selfApproved, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS }), /arrives UNAPPROVED/);
  } finally { f.done(); }
});

test('12d-269: malformed inputs fail closed, never crash strangely', () => {
  for (const bad of [null, undefined, 42, 'text', [], true]) {
    assert.throws(() => verifyPathwayApprovalPlan(bad), /fail closed/);
    assert.throws(() => applyRecordedApproval(bad as never, bad), /fail closed/);
  }
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    assert.throws(() => buildPathwayApprovalPlan({ packet, decision: 'AUTO_APPROVED' as never, decidedBy: OPERATOR, decidedAtMs: NOW_MS }), /exactly 'APPROVED' or 'REJECTED'/);
    assert.throws(() => buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: '', decidedAtMs: NOW_MS }), /operator id/);
    assert.throws(() => buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: -1 }), /safe non-negative/);
  } finally { f.done(); }
});

test('12d-269: policy pins — the honest boundary never moves', () => {
  assert.ok(Object.isFrozen(PATHWAY_APPROVAL_POLICY));
  assert.ok(Object.isFrozen(PATHWAY_APPROVAL_GUARDRAILS));
  assert.equal(PATHWAY_APPROVAL_POLICY.purpose, 'xiv-os-pathway-approval');
  assert.notEqual(PATHWAY_APPROVAL_POLICY.domain, 'XIV_OS_APPROVAL_RECEIPT', 'the receipt domain is distinct from 12D-247');
  assert.equal(PATHWAY_APPROVAL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(PATHWAY_APPROVAL_GUARDRAILS.learningPromoted, false);
  assert.equal(PATHWAY_APPROVAL_GUARDRAILS.billionUsersProven, false);
  assert.equal(PATHWAY_APPROVAL_GUARDRAILS.automaticRecovery, false);
  assert.equal(PATHWAY_APPROVAL_GUARDRAILS.zeroModelCalls, true);
  assert.equal(PATHWAY_APPROVAL_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(PATHWAY_APPROVAL_GUARDRAILS.ledgeredNeverActivated, true);
  assert.equal(PATHWAY_APPROVAL_GUARDRAILS.secretReGateInsideTheValidator, true);
  assert.equal(PATHWAY_APPROVAL_GUARDRAILS.reEvaluatesEligibilityNeverTrustsStored, true);
});