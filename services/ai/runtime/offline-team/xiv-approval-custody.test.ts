// 12D-247 tests — adversarial coverage for the approval custody link.
// Under test: verify-BEFORE-linking (an unverified packet never gets a
// receipt), the decision as an EXPLICIT input (no default, no inference,
// exact-case), the deterministic digest-bound decision receipt, the fixed
// purpose, the single register step binding (receipt/purpose/actor/time
// all pinned to the record), tampered plans refusing re-derivation, and
// the END-TO-END loop: verified packet → operator decision → 12D-244
// runner → custody evidence. Nothing calls a network or a model.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  XIV_APPROVAL_CUSTODY_POLICY,
  XIV_APPROVAL_CUSTODY_GUARDRAILS,
  buildApprovalCustodyPlan,
  deriveApprovalReceipt,
  verifyApprovalCustodyPlan,
} from './xiv-approval-custody';
import {
  buildStoryShellPacket, type StoryShellPacket,
} from './xiv-os-wire-contract';
import {
  runCustodyPlan,
} from './custody-runner';
import type { CustodyJournalStore } from './operator-custody-journal';

const T0 = 1_000_000;
const SEED = 'operator-approval-seed-1';
const OPERATOR = 'CEO-DEVIN-HAYNES';

function build(): Readonly<StoryShellPacket> {
  return buildStoryShellPacket({
    storyId: '12d-247-story-001',
    headline: 'XIV AI OS approval custody links decisions to the journal',
    bodyText: 'A human decides out of band; this contract records that decision.',
    generatedAtMs: T0 + 50,
    avatar: null,
    decidingOver: 'whether the governed story may proceed to execution',
  });
}

function memStore(): CustodyJournalStore & { isEmpty(): boolean } {
  let lines: string[] | null = null;
  return {
    load: () => (lines === null ? null : [...lines]),
    save: (next) => { lines = [...next]; },
    isEmpty: () => lines === null,
  };
}

test('12D-247 policy and guardrails are frozen with the pinned honest flags', () => {
  assert.ok(Object.isFrozen(XIV_APPROVAL_CUSTODY_POLICY));
  assert.ok(Object.isFrozen(XIV_APPROVAL_CUSTODY_GUARDRAILS));
  assert.equal(XIV_APPROVAL_CUSTODY_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(XIV_APPROVAL_CUSTODY_GUARDRAILS.learningPromoted, false);
  assert.equal(XIV_APPROVAL_CUSTODY_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(XIV_APPROVAL_CUSTODY_GUARDRAILS.zeroModelCalls, true);
  assert.equal(XIV_APPROVAL_CUSTODY_GUARDRAILS.billionUsersProven, false);
  assert.equal(XIV_APPROVAL_CUSTODY_GUARDRAILS.producesAPlanItNeverExecutes, true);
  assert.equal(XIV_APPROVAL_CUSTODY_GUARDRAILS.decisionIsAnExplicitInputNoDefault, true);
  assert.equal(XIV_APPROVAL_CUSTODY_POLICY.purpose, 'xiv-os-human-approval');
});

test('12D-247 happy path: an APPROVED decision on a verified packet produces a bound plan', () => {
  const packet = build();
  const plan = buildApprovalCustodyPlan({
    packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  assert.equal(plan.policyVersion, '12d-247-v1');
  assert.match(plan.decisionReceiptSha256, /^[0-9a-f]{64}$/);
  assert.equal(plan.decisionRecord.packetId, packet.packetId);
  assert.equal(plan.decisionRecord.storyId, packet.storyId);
  assert.equal(plan.decisionRecord.decision, 'APPROVED');
  assert.equal(plan.decisionRecord.decidedBy, OPERATOR);
  assert.equal(plan.decisionRecord.decidedAtMs, T0 + 100);
  // Exactly one register step binding receipt/purpose/actor/time.
  assert.equal(plan.steps.length, 1);
  const step = plan.steps[0];
  assert.equal(step.op, 'register');
  assert.equal(step.receiptSha256, plan.decisionReceiptSha256);
  assert.equal(step.purpose, 'xiv-os-human-approval');
  assert.equal(step.registeredBy, OPERATOR);
  assert.equal(step.issuedAtMs, T0 + 100);
  assert.equal(step.atMs, T0 + 100);
  assert.equal(verifyApprovalCustodyPlan(plan).ok, true);
});

test('12D-247 a REJECTED decision records too — refusal is a decision', () => {
  const plan = buildApprovalCustodyPlan({
    packet: build(), decision: 'REJECTED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  assert.equal(plan.decisionRecord.decision, 'REJECTED');
  assert.equal(verifyApprovalCustodyPlan(plan).ok, true);
  // A different decision derives a DIFFERENT receipt for the same packet.
  const approved = buildApprovalCustodyPlan({
    packet: build(), decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  assert.notEqual(approved.decisionReceiptSha256, plan.decisionReceiptSha256);
});

test('12D-247 the receipt is deterministic and re-derivable', () => {
  const packet = build();
  const record = {
    packetId: packet.packetId,
    storyId: packet.storyId,
    decision: 'APPROVED' as const,
    decidedBy: OPERATOR,
    decidedAtMs: T0 + 100,
  };
  assert.equal(deriveApprovalReceipt(record), deriveApprovalReceipt({ ...record }));
  const plan = buildApprovalCustodyPlan({
    packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  assert.equal(plan.decisionReceiptSha256, deriveApprovalReceipt(record));
});

test('12D-247 distinct packets derive distinct receipts (decision binds to THIS packet)', () => {
  const a = buildApprovalCustodyPlan({
    packet: build(), decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  const other = buildStoryShellPacket({
    storyId: '12d-247-story-002',
    headline: 'XIV AI OS a different governed story needs its own decision',
    bodyText: 'A different story body; the receipt must not collide with story 001.',
    generatedAtMs: T0 + 60,
    avatar: null,
    decidingOver: 'whether the second governed story may proceed onward',
  });
  const b = buildApprovalCustodyPlan({
    packet: other, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  assert.notEqual(a.decisionReceiptSha256, b.decisionReceiptSha256);
});

test('12D-247 an UNVERIFIED packet never gets a receipt (verify-before-linking)', () => {
  const packet = build();
  const tampered = { ...packet, headline: `${packet.headline} TAMPERED` } as StoryShellPacket;
  assert.throws(
    () => buildApprovalCustodyPlan({ packet: tampered, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100 }),
    /tampered in flight/,
  );
});

test('12D-247 the decision is explicit and exact — no default, no inference', () => {
  const packet = build();
  assert.throws(
    () => buildApprovalCustodyPlan({ packet, decision: 'approved' as 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100 }),
    /exactly 'APPROVED' or 'REJECTED'/,
  );
  assert.throws(
    () => buildApprovalCustodyPlan({ packet, decision: 'AUTO_APPROVED' as 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100 }),
    /exactly 'APPROVED' or 'REJECTED'/,
  );
  assert.throws(
    () => buildApprovalCustodyPlan({ packet, decision: undefined as unknown as 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100 }),
    /fail closed/,
  );
});

test('12D-247 a malformed actor or timestamp refuses', () => {
  const packet = build();
  assert.throws(
    () => buildApprovalCustodyPlan({ packet, decision: 'APPROVED', decidedBy: '', decidedAtMs: T0 + 100 }),
    /decidedBy must match/,
  );
  assert.throws(
    () => buildApprovalCustodyPlan({ packet, decision: 'APPROVED', decidedBy: 'bad id with spaces', decidedAtMs: T0 + 100 }),
    /decidedBy must match/,
  );
  assert.throws(
    () => buildApprovalCustodyPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: -1 }),
    /decidedAtMs must be a safe non-negative integer/,
  );
  assert.throws(
    () => buildApprovalCustodyPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: 1.5 }),
    /decidedAtMs must be a safe non-negative integer/,
  );
  // Options-object shape is gated too.
  assert.throws(
    () => buildApprovalCustodyPlan({ packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100, extra: 1 } as never),
    /exactly the keys/,
  );
});

test('12D-247 a tampered plan refuses verification', () => {
  const plan = buildApprovalCustodyPlan({
    packet: build(), decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  const flip = (hexStr: string): string =>
    (hexStr[0] === '0' ? '1' : '0') + hexStr.slice(1);

  // Tampered receipt.
  assert.throws(
    () => verifyApprovalCustodyPlan({ ...plan, decisionReceiptSha256: flip(plan.decisionReceiptSha256) }),
    /receipt mismatch — tampered or foreign plan/,
  );
  // Edited record (decision flipped post-hoc) re-derives a different receipt.
  assert.throws(
    () => verifyApprovalCustodyPlan({ ...plan, decisionRecord: { ...plan.decisionRecord, decision: 'REJECTED' } }),
    /receipt mismatch/,
  );
  // A step re-purposed under a different custody purpose refuses.
  const repurposed = {
    ...plan,
    steps: [{ ...plan.steps[0], purpose: 'some-other-purpose' }],
  };
  assert.throws(
    () => verifyApprovalCustodyPlan(repurposed),
    /fixed purpose/,
  );
  // A step whose registeredBy differs from the record refuses.
  assert.throws(
    () => verifyApprovalCustodyPlan({
      ...plan,
      steps: [{ ...plan.steps[0], registeredBy: 'SOMEONE-ELSE' } as never],
    }),
    /registeredBy must equal/,
  );
  // An extra key smuggled into the plan refuses.
  assert.throws(
    () => verifyApprovalCustodyPlan({ ...plan, smuggled: true } as never),
    /exactly the keys/,
  );
  // An authenticate step masquerading as the register refuses.
  assert.throws(
    () => verifyApprovalCustodyPlan({
      ...plan,
      steps: [Object.freeze({ ...plan.steps[0], op: 'authenticate' })] as never,
    }),
    /must be a 'register'/,
  );
});

test('12D-247 END-TO-END: shell packet → operator decision → 12D-244 runner → custody evidence', () => {
  const packet = build();
  const plan = buildApprovalCustodyPlan({
    packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  const store = memStore();
  const evidence = runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: plan.steps });
  assert.equal(evidence.applied.length, 1);
  assert.equal(evidence.applied[0].op, 'register');
  assert.equal(evidence.applied[0].receiptSha256, plan.decisionReceiptSha256);
  assert.equal(evidence.applied[0].purpose, 'xiv-os-human-approval');
  assert.equal(evidence.journalVerified, true);
  assert.equal(evidence.opsAfter, 1);
  assert.equal(store.isEmpty(), false);
  // The plan itself still verifies against its record after the run.
  assert.equal(verifyApprovalCustodyPlan(plan).ok, true);
  // A SECOND registration of the same decision receipt refuses at the
  // registry (registered-exactly-once) — the runner stops, nothing lies.
  const second = runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: plan.steps });
  assert.ok(second.refused);
  assert.equal(second.refused!.index, 0);
  assert.equal(second.refused!.op, 'register');
});

test('12D-247 a JSON round-tripped plan still verifies (value-compared structure)', () => {
  const plan = buildApprovalCustodyPlan({
    packet: build(), decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  const transported = JSON.parse(JSON.stringify(plan)) as typeof plan;
  assert.equal(verifyApprovalCustodyPlan(transported).ok, true);
});

test('12D-247 the seed never appears in the plan and honest flags are pinned', () => {
  const plan = buildApprovalCustodyPlan({
    packet: build(), decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  assert.equal(JSON.stringify(plan).includes(SEED), false);
  assert.equal('seed' in plan, false);
});