// 12D-270 — adversarial tests for the pathway approval view. Central
// properties under attack:
//   1. The WHOLE submission (packet + plan) verifies as one unit through the
//      REAL 12D-269 apply path — packet gates, plan verifier, cross-binding,
//      fresh eligibility — before anything renders.
//   2. BOTH recorded decisions render (approved opens the ledger path,
//      rejected closes it); neither is an affordance.
//   3. A refusal carries ZERO packet, plan, receipt, or pathway content.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { preparePathwayCandidateFromQueue, type PathwayEvidencePacket } from './pathway-evidence-bridge';
import {
  PATHWAY_APPROVAL_POLICY,
  buildPathwayApprovalPlan,
  candidateDigest,
  derivePathwayApprovalReceipt,
  type PathwayApprovalPlan,
} from './xiv-pathway-approval-link';
import {
  PATHWAY_APPROVAL_VIEW_GUARDRAILS,
  PATHWAY_APPROVAL_VIEW_POLICY,
  buildPathwayApprovalViewModel,
} from './xiv-pathway-approval-view';

const tenantId = 'pathway-tenant';
const outputHash = 'f'.repeat(64);
const OPERATOR = 'operator:devin';
const NOW_MS = 1_000_000;

const baseStory: OfflineStory = {
  id: 'story-1', tenantId, roleId: 'load_test',
  objective: 'synthetic reviewed story for the pathway approval view',
  acceptance: ['reviewed result is hash-bound'], dependencies: [],
  sourceRevision: 'a'.repeat(40), masterPlanSha256: 'b'.repeat(64),
  securityClass: 'ORDINARY', kind: 'PRODUCT_STORY',
};

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-pathway-approval-view-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
  return { q, done: () => { q.close(); rmSync(dir, { recursive: true, force: true }); } };
}

let storySeq = 0;
function bridgePacket(q: OfflineStoryQueue, overrides: Record<string, unknown> = {}): PathwayEvidencePacket {
  storySeq += 1;
  const storyId = `story-${storySeq}`;
  const qStory: OfflineStory = { ...baseStory, id: storyId, sourceRevision: 'a'.repeat(39) + String(storySeq % 10) };
  q.enqueue([qStory]);
  const lease = q.claimNext(tenantId, 'load_test', 'worker-1', 120000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash, providerSettled: true });
  q.applyReviewDecision({ tenantId, storyId, reviewerId: 'secure_code_reviewer', expectedOutputHash: outputHash, decision: 'APPROVED', reviewRef: 'review:queue-approved' });
  return preparePathwayCandidateFromQueue(q, {
    tenantId, storyId, expectedOutputHash: outputHash,
    pathwayId: 'pathway-270', domain: 'CODE', version: 1,
    confidence: 0.91, evaluationScore: 0.96,
    evidenceRefs: ['run:synthetic-1'],
    reviewRefs: ['review:one', 'review:two'],
    rollbackRef: 'rollback:pathway-270',
    ...overrides,
  });
}

function submission(packet: PathwayEvidencePacket, plan: PathwayApprovalPlan) {
  return { packet, plan };
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

test('12d-270: a recorded APPROVED decision renders with the ledger path open', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const vm = buildPathwayApprovalViewModel(submission(packet, plan));
    assert.ok(vm.kind === 'VERIFIED_PATHWAY_DECISION');
    assert.equal(vm.policyVersion, PATHWAY_APPROVAL_VIEW_POLICY.policyVersion);
    assert.equal(vm.display.pathwayId, 'pathway-270');
    assert.equal(vm.display.version, 1);
    assert.equal(vm.display.decision, 'APPROVED');
    assert.equal(vm.display.decidedBy, OPERATOR);
    assert.equal(vm.display.decidedAtMs, NOW_MS);
    assert.equal(vm.display.decisionReceipt, plan.decisionReceiptSha256);
    assert.match(vm.display.decisionReceipt, /^[0-9a-f]{64}$/);
    assert.ok(vm.display.ledgerPathOpen.includes('ledgered, never activated'));
    assert.ok(vm.display.operatorNote.includes('cross-binding'));
    assert.ok(vm.display.operatorNote.includes('never verifies who approved'));
    assert.ok(Object.isFrozen(vm) && Object.isFrozen(vm.display));
  } finally { f.done(); }
});

test('12d-270: a recorded REJECTED decision renders with the ledger path CLOSED', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'REJECTED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const vm = buildPathwayApprovalViewModel(submission(packet, plan));
    assert.ok(vm.kind === 'VERIFIED_PATHWAY_DECISION');
    assert.equal(vm.display.decision, 'REJECTED');
    assert.ok(vm.display.ledgerPathOpen.startsWith('CLOSED'));
  } finally { f.done(); }
});

test('12d-270: CROSS-BINDING — a decision over candidate B refuses against candidate A, zero leak', () => {
  const f = fixture();
  try {
    const packetA = bridgePacket(f.q);
    const packetB = bridgePacket(f.q, { pathwayId: 'pathway-other', confidence: 0.93 });
    const planB = buildPathwayApprovalPlan({ packet: packetB, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const vm = buildPathwayApprovalViewModel(submission(packetA, planB));
    assert.equal(vm.kind, 'REFUSED');
    assert.ok(vm.kind === 'REFUSED');
    assert.ok(vm.reason.includes('candidateDigest mismatch'));
    REFUSAL_LEAK_CHECK(vm, 'pathway-270', 'pathway-other', planB.decisionReceiptSha256, tenantId);
  } finally { f.done(); }
});

test('12d-270: a candidate tampered after the decision refuses with zero leak', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const tampered = { ...packet, candidate: { ...packet.candidate, evaluationScore: 0.99 } } as unknown as PathwayEvidencePacket;
    const vm = buildPathwayApprovalViewModel(submission(tampered, plan));
    assert.equal(vm.kind, 'REFUSED');
    REFUSAL_LEAK_CHECK(vm, 'pathway-270', plan.decisionReceiptSha256, OPERATOR);
  } finally { f.done(); }
});

test('12d-270: a forged eligibility claim cannot shortcut the gate — the refusal is honest', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q, { evaluationScore: 0.5 });
    const forged = { ...packet, currentEligibility: { eligible: true, reasons: [] } } as unknown as PathwayEvidencePacket;
    const plan = buildPathwayApprovalPlan({ packet: forged, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const vm = buildPathwayApprovalViewModel(submission(forged, plan));
    assert.equal(vm.kind, 'REFUSED');
    assert.ok(vm.kind === 'REFUSED');
    assert.ok(vm.reason.includes('not eligible'), 'the refusal names the real gate');
    REFUSAL_LEAK_CHECK(vm, 'pathway-270', plan.decisionReceiptSha256);
  } finally { f.done(); }
});

test('12d-270: a decision flipped after the fact refuses (receipt mismatch)', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const flipped = { ...plan, decisionRecord: { ...plan.decisionRecord, decision: 'REJECTED' } } as unknown as PathwayApprovalPlan;
    const vm = buildPathwayApprovalViewModel(submission(packet, flipped));
    assert.equal(vm.kind, 'REFUSED');
    assert.ok(vm.reason.includes('receipt mismatch'));
  } finally { f.done(); }
});

test('12d-270: the exact-keys gate refuses reordering, extras, and absences', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const reordered = { plan, packet } as unknown as Record<string, unknown>;
    assert.equal(buildPathwayApprovalViewModel(reordered).kind, 'REFUSED');
    const extra = { packet, plan, smuggled: true } as unknown as Record<string, unknown>;
    assert.equal(buildPathwayApprovalViewModel(extra).kind, 'REFUSED');
    const missing = { packet } as unknown as Record<string, unknown>;
    assert.equal(buildPathwayApprovalViewModel(missing).kind, 'REFUSED');
  } finally { f.done(); }
});

test('12d-270: malformed submissions HOLD — null, array, string, number, boolean, undefined', () => {
  for (const raw of [null, [], 'string', 42, true, undefined]) {
    const vm = buildPathwayApprovalViewModel(raw);
    assert.equal(vm.kind, 'REFUSED', `${String(raw)} must refuse`);
    assert.ok(vm.kind === 'REFUSED');
    assert.ok(vm.reason.length > 0);
  }
});

test('12d-270: a credential-shaped decidedBy in a forged plan refuses with zero leak', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const digest = candidateDigest(packet.candidate);
    const record = {
      pathwayId: 'pathway-270', version: 1, tenantId,
      candidateDigestSha256: digest,
      decision: 'APPROVED' as const,
      decidedBy: 'sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      decidedAtMs: NOW_MS,
    };
    // The receipt derives from the module's OWN canonical derivation — the
    // forgery is internally consistent, so the ONLY thing that can catch it
    // is the secret re-gate inside the validator.
    const receipt = derivePathwayApprovalReceipt(record);
    const forgedPlan = {
      policyVersion: PATHWAY_APPROVAL_POLICY.policyVersion,
      decisionReceiptSha256: receipt,
      decisionRecord: record,
      steps: [{ op: 'register', receiptSha256: receipt, purpose: 'xiv-os-pathway-approval', registeredBy: record.decidedBy, issuedAtMs: NOW_MS, atMs: NOW_MS }],
    };
    const vm = buildPathwayApprovalViewModel(submission(packet, forgedPlan as unknown as PathwayApprovalPlan));
    assert.equal(vm.kind, 'REFUSED');
    REFUSAL_LEAK_CHECK(vm, 'sk-AAAA', 'pathway-270');
  } finally { f.done(); }
});

test('12d-270: the verified view never carries an affordance', () => {
  const f = fixture();
  try {
    const packet = bridgePacket(f.q);
    const plan = buildPathwayApprovalPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: NOW_MS });
    const vm = buildPathwayApprovalViewModel(submission(packet, plan));
    assert.ok(vm.kind === 'VERIFIED_PATHWAY_DECISION');
    const rendered = JSON.stringify(vm);
    assert.ok(!rendered.includes('endpoint'), 'no endpoints in a verified view');
    assert.ok(!rendered.includes('activate '), 'no activation verb in a verified view');
    assert.ok(rendered.includes('never activated'), 'the honest never-activated pin renders');
  } finally { f.done(); }
});

test('12d-270: guardrails and policy are pinned and frozen', () => {
  assert.ok(Object.isFrozen(PATHWAY_APPROVAL_VIEW_POLICY));
  assert.ok(Object.isFrozen(PATHWAY_APPROVAL_VIEW_GUARDRAILS));
  assert.equal(PATHWAY_APPROVAL_VIEW_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(PATHWAY_APPROVAL_VIEW_GUARDRAILS.modelCalls, 0);
  assert.equal(PATHWAY_APPROVAL_VIEW_GUARDRAILS.remoteCalls, 0);
  assert.equal(PATHWAY_APPROVAL_VIEW_GUARDRAILS.learningPromoted, false);
  assert.equal(PATHWAY_APPROVAL_VIEW_GUARDRAILS.automaticRecovery, false);
  assert.equal(PATHWAY_APPROVAL_VIEW_GUARDRAILS.billionUsersProven, false);
  assert.equal(PATHWAY_APPROVAL_VIEW_GUARDRAILS.crossBindingGate, true);
  assert.equal(PATHWAY_APPROVAL_VIEW_GUARDRAILS.noActivationPath, true);
  assert.equal(PATHWAY_APPROVAL_VIEW_GUARDRAILS.eligibilityReEvaluatedInPath, true);
});