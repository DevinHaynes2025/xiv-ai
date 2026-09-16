// 12D-267 — adversarial tests for the custody decision view. Central
// properties under attack:
//   1. The WHOLE submission (packet + plan) verifies as one unit through the
//      REAL 12D-242/12D-247 contracts before anything renders.
//   2. The CROSS-BINDING gate: a plan about a DIFFERENT packet never renders,
//      even when the plan is internally consistent and the packet verifies.
//   3. A refusal carries ZERO packet, plan, or receipt content.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStoryShellPacket,
  verifyStoryShellPacket,
  type StoryShellPacket,
} from './xiv-os-wire-contract';
import {
  buildApprovalCustodyPlan,
  deriveApprovalReceipt,
  XIV_APPROVAL_CUSTODY_POLICY,
  type ApprovalDecisionRecord,
} from './xiv-approval-custody';
import {
  CUSTODY_DECISION_VIEW_GUARDRAILS,
  CUSTODY_DECISION_VIEW_POLICY,
  buildCustodyDecisionViewModel,
} from './xiv-custody-decision-view';

const OPERATOR = 'operator:devin';
const NOW_MS = 1_000_000;

function makePacket(storyId: string, headline: string): StoryShellPacket {
  const packet = buildStoryShellPacket({
    storyId,
    headline,
    bodyText: 'the operator recorded a custody decision over this packet out of band',
    generatedAtMs: 1_000_000,
    avatar: null,
    decidingOver: 'whether the story may proceed under operator custody',
  });
  assert.equal(verifyStoryShellPacket(packet).ok, true, 'test fixture packet must verify');
  return packet;
}

function makePlan(packet: StoryShellPacket, decision: 'APPROVED' | 'REJECTED' = 'APPROVED') {
  return buildApprovalCustodyPlan({
    packet,
    decision,
    decidedBy: OPERATOR,
    decidedAtMs: NOW_MS,
  });
}

/** An INTERNALLY CONSISTENT plan about a foreign decision record — every
 * field re-derives its receipt, but the record is about a packet this
 * submission does not carry (or a storyId the packet does not carry). */
function foreignConsistentPlan(record: ApprovalDecisionRecord): Record<string, unknown> {
  const receipt = deriveApprovalReceipt(record);
  return {
    policyVersion: XIV_APPROVAL_CUSTODY_POLICY.policyVersion,
    decisionReceiptSha256: receipt,
    decisionRecord: { ...record },
    steps: [{
      op: 'register',
      receiptSha256: receipt,
      purpose: XIV_APPROVAL_CUSTODY_POLICY.purpose,
      registeredBy: record.decidedBy,
      issuedAtMs: record.decidedAtMs,
      atMs: record.decidedAtMs,
    }],
  };
}

const REFUSAL_LEAK_CHECK = (
  vm: { display: { headline: string; bodyText: string; operatorNote: string } },
  ...secrets: string[]
) => {
  for (const secret of secrets) {
    assert.ok(!vm.display.headline.includes(secret), `headline leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.bodyText.includes(secret), `body leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.operatorNote.includes(secret), `operatorNote leaked ${secret.slice(0, 30)}`);
  }
};

test('12d-267: a real recorded decision renders a fully verified view', () => {
  const packet = makePacket('12d-267-custody-view-happy', 'The operator decided');
  const plan = makePlan(packet);
  const vm = buildCustodyDecisionViewModel({ packet, plan });
  assert.equal(vm.kind, 'VERIFIED_CUSTODY_DECISION');
  assert.ok(vm.kind === 'VERIFIED_CUSTODY_DECISION');
  assert.equal(vm.policyVersion, CUSTODY_DECISION_VIEW_POLICY.policyVersion);
  assert.equal(vm.display.storyId, '12d-267-custody-view-happy');
  assert.equal(vm.display.packetId, packet.packetId);
  assert.equal(vm.display.decision, 'APPROVED');
  assert.equal(vm.display.decidedBy, OPERATOR);
  assert.equal(vm.display.decidedAtMs, NOW_MS);
  assert.equal(vm.display.decisionReceipt, plan.decisionReceiptSha256);
  assert.match(vm.display.decisionReceipt, /^[0-9a-f]{64}$/);
  assert.equal(vm.display.purpose, 'xiv-os-human-approval');
  assert.ok(vm.display.operatorNote.includes('cross-binding'), 'the note names the new gate');
  assert.ok(vm.display.operatorNote.includes('OUT OF BAND'), 'journal authentication stays out of band');
  assert.ok(Object.isFrozen(vm), 'view model must be frozen');
  assert.ok(Object.isFrozen(vm.display), 'display must be frozen');
});

test('12d-267: a REJECTED decision is a decision — it records, renders, and derives a distinct receipt', () => {
  const packet = makePacket('12d-267-custody-view-reject', 'The operator refused');
  const plan = makePlan(packet, 'REJECTED');
  const vm = buildCustodyDecisionViewModel({ packet, plan });
  assert.ok(vm.kind === 'VERIFIED_CUSTODY_DECISION');
  assert.equal(vm.display.decision, 'REJECTED');
  const approvalPlan = makePlan(packet, 'APPROVED');
  assert.notEqual(plan.decisionReceiptSha256, approvalPlan.decisionReceiptSha256);
});

test('12d-267: CROSS-BINDING — a plan about a different packet refuses with zero content', () => {
  const packetA = makePacket('12d-267-binding-a', 'Packet A headline');
  const packetB = makePacket('12d-267-binding-b', 'Packet B headline');
  const planB = makePlan(packetB);
  const vm = buildCustodyDecisionViewModel({ packet: packetA, plan: planB });
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.reason.includes('packetId mismatch'));
  REFUSAL_LEAK_CHECK(
    vm,
    'Packet A headline', 'Packet B headline',
    packetA.packetId, packetB.packetId,
    planB.decisionReceiptSha256, packetB.storyId,
  );
  assert.ok(!vm.reason.includes(packetA.headline), 'reason must not leak packet content');
  assert.ok(!vm.reason.includes(planB.decisionReceiptSha256), 'reason must not leak the receipt');
});

test('12d-267: CROSS-BINDING on storyId — an internally consistent plan about a foreign storyId refuses', () => {
  const packet = makePacket('12d-267-binding-story', 'Bound packet');
  // The record re-derives its receipt and passes verifyApprovalCustodyPlan —
  // ONLY the storyId cross-binding gate can catch this one.
  const foreignRecord: ApprovalDecisionRecord = {
    packetId: packet.packetId,
    storyId: '12d-267-some-other-story',
    decision: 'APPROVED',
    decidedBy: OPERATOR,
    decidedAtMs: NOW_MS,
  };
  const vm = buildCustodyDecisionViewModel({ packet, plan: foreignConsistentPlan(foreignRecord) });
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.reason.includes('storyId mismatch'));
  REFUSAL_LEAK_CHECK(vm, 'Bound packet', foreignRecord.storyId, deriveApprovalReceipt(foreignRecord));
});

test('12d-267: a decision flipped after the fact refuses (receipt mismatch) with zero leak', () => {
  const packet = makePacket('12d-267-flip', 'Flip target');
  const plan = makePlan(packet, 'APPROVED');
  const forgedPlan = {
    ...plan,
    decisionRecord: { ...plan.decisionRecord, decision: 'REJECTED' },
  } as unknown as Record<string, unknown>;
  const vm = buildCustodyDecisionViewModel({ packet, plan: forgedPlan });
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.reason.includes('receipt mismatch'));
  REFUSAL_LEAK_CHECK(vm, 'Flip target', plan.decisionReceiptSha256, OPERATOR);
});

test('12d-267: a tampered packet refuses the whole submission', () => {
  const packet = makePacket('12d-267-tamper', 'Tamper target');
  const plan = makePlan(packet);
  const tampered = { ...packet, headline: 'Tampered: edited in flight' } as unknown as StoryShellPacket;
  const vm = buildCustodyDecisionViewModel({ packet: tampered, plan });
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, 'Tampered: edited in flight', plan.decisionReceiptSha256);
});

test('12d-267: the exact-keys gate refuses reordering, extras, and absences', () => {
  const packet = makePacket('12d-267-keys', 'Key gate');
  const plan = makePlan(packet);
  const reordered = { plan, packet } as unknown as Record<string, unknown>;
  assert.equal(buildCustodyDecisionViewModel(reordered).kind, 'REFUSED');
  const extra = { packet, plan, smuggled: true } as unknown as Record<string, unknown>;
  assert.equal(buildCustodyDecisionViewModel(extra).kind, 'REFUSED');
  const missing = { packet } as unknown as Record<string, unknown>;
  assert.equal(buildCustodyDecisionViewModel(missing).kind, 'REFUSED');
});

test('12d-267: malformed submissions HOLD — null, array, string, number, empty object', () => {
  for (const raw of [null, [], 'string', 42, {}, undefined, true]) {
    const vm = buildCustodyDecisionViewModel(raw);
    assert.equal(vm.kind, 'REFUSED', `${String(raw)} must refuse`);
    assert.ok(vm.kind === 'REFUSED');
    assert.ok(vm.reason.length > 0);
  }
});

test('12d-267: a misdirected plan under a foreign purpose refuses', () => {
  const packet = makePacket('12d-267-purpose', 'Purpose gate');
  const plan = makePlan(packet) as unknown as Record<string, unknown>;
  const misdirected = {
    ...plan,
    steps: [{ ...(plan.steps as Array<Record<string, unknown>>)[0], purpose: 'some-other-purpose' }],
  };
  const vm = buildCustodyDecisionViewModel({ packet, plan: misdirected });
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.reason.includes('xiv-os-human-approval'));
  REFUSAL_LEAK_CHECK(vm, 'Purpose gate');
});

test('12d-267: a plan that registers nothing extra — two steps refuse', () => {
  const packet = makePacket('12d-267-steps', 'Step count gate');
  const plan = makePlan(packet) as unknown as Record<string, unknown>;
  const twoSteps = { ...plan, steps: [...(plan.steps as unknown[]), ...(plan.steps as unknown[])] };
  const vm = buildCustodyDecisionViewModel({ packet, plan: twoSteps });
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.reason.includes('exactly one register step'));
});

test('12d-267: credential-shaped decidedBy refuses with zero leak', () => {
  const packet = makePacket('12d-267-cred', 'Credential gate');
  const foreignRecord: ApprovalDecisionRecord = {
    packetId: packet.packetId,
    storyId: packet.storyId,
    decision: 'APPROVED',
    decidedBy: 'sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    decidedAtMs: NOW_MS,
  };
  // The plan is internally consistent, so ONLY the record-level re-gates
  // inside the plan verifier (operator id pattern) can catch it here.
  const vm = buildCustodyDecisionViewModel({ packet, plan: foreignConsistentPlan(foreignRecord) });
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.reason.includes('credential-shaped content'));
  REFUSAL_LEAK_CHECK(vm, 'sk-AAAA', 'Credential gate');
});

test('12d-267: guardrails and policy are pinned and frozen', () => {
  assert.ok(Object.isFrozen(CUSTODY_DECISION_VIEW_POLICY));
  assert.ok(Object.isFrozen(CUSTODY_DECISION_VIEW_GUARDRAILS));
  assert.equal(CUSTODY_DECISION_VIEW_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(CUSTODY_DECISION_VIEW_GUARDRAILS.modelCalls, 0);
  assert.equal(CUSTODY_DECISION_VIEW_GUARDRAILS.remoteCalls, 0);
  assert.equal(CUSTODY_DECISION_VIEW_GUARDRAILS.learningPromoted, false);
  assert.equal(CUSTODY_DECISION_VIEW_GUARDRAILS.automaticRecovery, false);
  assert.equal(CUSTODY_DECISION_VIEW_GUARDRAILS.billionUsersProven, false);
  assert.equal(CUSTODY_DECISION_VIEW_GUARDRAILS.collectsNothing, true);
  assert.equal(CUSTODY_DECISION_VIEW_GUARDRAILS.crossBindingGate, true);
  assert.equal(CUSTODY_DECISION_VIEW_GUARDRAILS.journalAuthenticationStaysOutOfBand, true);
});

test('12d-267: the verified view never carries an approve affordance', () => {
  const packet = makePacket('12d-267-affordance', 'Affordance gate');
  const plan = makePlan(packet);
  const vm = buildCustodyDecisionViewModel({ packet, plan });
  assert.ok(vm.kind === 'VERIFIED_CUSTODY_DECISION');
  const rendered = JSON.stringify(vm);
  // The ONLY 'approve' occurrence is inside the operator's reminder that
  // there is no approve control — no affordance key, no endpoint, no action.
  const approveHits = rendered.split('approve').length - 1;
  assert.equal(approveHits, 1, 'approve appears only inside the no-approve-control note');
  assert.ok(!rendered.includes('endpoint'), 'no endpoints in a verified view');
  assert.ok(vm.display.operatorNote.includes('no approve control'));
});