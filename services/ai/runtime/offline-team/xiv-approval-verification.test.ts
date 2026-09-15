// 12D-248 tests — adversarial coverage for the approval verification half.
// Under test: the receipt re-derived from the held record (an edited record
// refuses), verifiedAtMs never before decidedAtMs, the single authenticate
// step binding (receipt/purpose/time), the FULL LIFECYCLE end-to-end
// (12D-247 register → 12D-244 runner → 12D-248 authenticate → confirm
// consumption), single-use (a second verification refuses at the registry),
// confirmApprovalConsumed refusing forged or foreign evidence, JSON
// round-trip, and the honest flags. Nothing calls a network or a model.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  XIV_APPROVAL_VERIFICATION_POLICY,
  XIV_APPROVAL_VERIFICATION_GUARDRAILS,
  buildApprovalVerificationPlan,
  verifyApprovalVerificationPlan,
  confirmApprovalConsumed,
} from './xiv-approval-verification';
import {
  buildApprovalCustodyPlan, type ApprovalDecisionRecord,
} from './xiv-approval-custody';
import { runCustodyPlan } from './custody-runner';
import { buildStoryShellPacket } from './xiv-os-wire-contract';
import type { CustodyJournalStore } from './operator-custody-journal';

const T0 = 1_000_000;
const SEED = 'operator-verification-seed-1';
const OPERATOR = 'CEO-DEVIN-HAYNES';

function memStore(): CustodyJournalStore {
  let lines: string[] | null = null;
  return {
    load: () => (lines === null ? null : [...lines]),
    save: (next) => { lines = [...next]; },
  };
}

/** The full recorded decision: verified packet → 12D-247 plan + record. */
function recordedDecision(): {
  record: Readonly<ApprovalDecisionRecord>;
  registerPlan: ReturnType<typeof buildApprovalCustodyPlan>;
} {
  const packet = buildStoryShellPacket({
    storyId: '12d-248-story-001',
    headline: 'XIV AI OS approval verification consumes the receipt once',
    bodyText: 'The recorded decision is verified exactly once, out of band.',
    generatedAtMs: T0 + 50,
    avatar: null,
    decidingOver: 'whether the governed story may proceed to execution',
  });
  const plan = buildApprovalCustodyPlan({
    packet, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  return { record: plan.decisionRecord, registerPlan: plan };
}

test('12D-248 policy and guardrails are frozen with the pinned honest flags', () => {
  assert.ok(Object.isFrozen(XIV_APPROVAL_VERIFICATION_POLICY));
  assert.ok(Object.isFrozen(XIV_APPROVAL_VERIFICATION_GUARDRAILS));
  assert.equal(XIV_APPROVAL_VERIFICATION_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(XIV_APPROVAL_VERIFICATION_GUARDRAILS.learningPromoted, false);
  assert.equal(XIV_APPROVAL_VERIFICATION_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(XIV_APPROVAL_VERIFICATION_GUARDRAILS.zeroModelCalls, true);
  assert.equal(XIV_APPROVAL_VERIFICATION_GUARDRAILS.billionUsersProven, false);
  assert.equal(XIV_APPROVAL_VERIFICATION_GUARDRAILS.singleUseConsumption, true);
  assert.equal(XIV_APPROVAL_VERIFICATION_GUARDRAILS.recordsNothingNew, true);
  assert.equal(XIV_APPROVAL_VERIFICATION_POLICY.purpose, 'xiv-os-human-approval');
});

test('12D-248 the verification plan re-derives the receipt from the held record', () => {
  const { record } = recordedDecision();
  const plan = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 200 });
  assert.equal(plan.policyVersion, '12d-248-v1');
  assert.match(plan.decisionReceiptSha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(plan.decisionRecord, record);
  assert.equal(plan.steps.length, 1);
  const step = plan.steps[0];
  assert.equal(step.op, 'authenticate');
  assert.equal(step.receiptSha256, plan.decisionReceiptSha256);
  assert.equal(step.purpose, 'xiv-os-human-approval');
  assert.equal(step.atMs, T0 + 200);
  assert.equal(verifyApprovalVerificationPlan(plan).ok, true);
  // Deterministic: same record + same moment, same plan bytes.
  const again = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 200 });
  assert.equal(JSON.stringify(again), JSON.stringify(plan));
});

test('12D-248 an edited record breaks the receipt re-derivation', () => {
  const { record } = recordedDecision();
  const plan = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 200 });
  // Post-hoc decision flip: the record re-derives a DIFFERENT receipt.
  assert.throws(
    () => verifyApprovalVerificationPlan({
      ...plan,
      decisionRecord: { ...record, decision: 'REJECTED' },
    }),
    /receipt mismatch — tampered or foreign plan/,
  );
  // A swapped receipt in the step refuses.
  assert.throws(
    () => verifyApprovalVerificationPlan({
      ...plan,
      steps: [{ ...plan.steps[0], receiptSha256: 'f'.repeat(64) }],
    } as never),
    /must authenticate the derived decision receipt/,
  );
  // A register masquerading as the authenticate refuses.
  assert.throws(
    () => verifyApprovalVerificationPlan({
      ...plan,
      steps: [Object.freeze({ ...plan.steps[0], op: 'register' })] as never,
    }),
    /must be an 'authenticate'/,
  );
  // Re-purposing refuses.
  assert.throws(
    () => verifyApprovalVerificationPlan({
      ...plan,
      steps: [{ ...plan.steps[0], purpose: 'some-other-purpose' }],
    }),
    /fixed purpose/,
  );
  // Smuggled keys refuse.
  assert.throws(
    () => verifyApprovalVerificationPlan({ ...plan, smuggled: true } as never),
    /exactly the keys/,
  );
  // A malformed record (bad decision) refuses at the gate.
  assert.throws(
    () => buildApprovalVerificationPlan({
      decisionRecord: { ...record, decision: 'MAYBE' } as unknown as ApprovalDecisionRecord,
      verifiedAtMs: T0 + 200,
    }),
    /exactly 'APPROVED' or 'REJECTED'/,
  );
});

test('12D-248 verifiedAtMs never precedes decidedAtMs (and malformed timestamps refuse)', () => {
  const { record } = recordedDecision();
  assert.throws(
    () => buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 99 }),
    /must not precede decidedAtMs/,
  );
  assert.throws(
    () => buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: -1 }),
    /safe non-negative integer/,
  );
  assert.throws(
    () => buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: 1.5 }),
    /safe non-negative integer/,
  );
  assert.throws(
    () => buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 200, extra: 1 } as never),
    /exactly the keys/,
  );
  // Equal timestamps are allowed (authenticate at the decision moment).
  const at = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: record.decidedAtMs });
  assert.equal(at.steps[0].atMs, record.decidedAtMs);
});

test('12D-248 FULL LIFECYCLE: record → runner → verify plan → runner → confirmed consumption', () => {
  const { record, registerPlan } = recordedDecision();
  const store = memStore();
  // 1. Record the decision (12D-247 plan through the 12D-244 runner).
  const regEvidence = runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  assert.equal(regEvidence.journalVerified, true);
  // 2. Verify the recorded decision (this module's plan through the runner).
  const plan = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 200 });
  const verEvidence = runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: plan.steps });
  assert.equal(verEvidence.journalVerified, true);
  assert.equal(verEvidence.opsAfter, 2);
  // 3. Confirm consumption from the evidence.
  const confirmed = confirmApprovalConsumed(verEvidence, record);
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.receiptSha256, plan.decisionReceiptSha256);
  assert.equal(confirmed.consumedAtMs, T0 + 200);
  // 4. The receipt is consumed — a SECOND verification refuses at the
  //    registry (single-use) and the runner reports the refusal honestly.
  const secondPlan = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 300 });
  const second = runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: secondPlan.steps });
  assert.ok(second.refused);
  assert.equal(second.refused!.op, 'authenticate');
  assert.equal(second.applied.length, 0);
});

test('12D-248 confirmApprovalConsumed refuses forged or foreign evidence', () => {
  const { record, registerPlan } = recordedDecision();
  const store = memStore();
  runCustodyPlan({ store, seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  const plan = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 200 });
  const evidence = runCustodyPlan({ store, seed: SEED, mode: 'resume', steps: plan.steps });

  // No consumption at all (register-only evidence, fresh store) refuses.
  const registerOnly = runCustodyPlan({ store: memStore(), seed: SEED, mode: 'bootstrap', steps: registerPlan.steps });
  assert.throws(
    () => confirmApprovalConsumed(registerOnly, record),
    /exactly one consumption/,
  );
  // A different record's receipt refuses (foreign evidence).
  const otherPacket = buildStoryShellPacket({
    storyId: '12d-248-story-002',
    headline: 'XIV AI OS a different governed story with its own decision',
    bodyText: 'Another story body; its receipt must not confirm this record.',
    generatedAtMs: T0 + 60,
    avatar: null,
    decidingOver: 'whether the second governed story may proceed onward',
  });
  const otherPlan = buildApprovalCustodyPlan({
    packet: otherPacket, decision: 'APPROVED', decidedBy: OPERATOR, decidedAtMs: T0 + 100,
  });
  assert.throws(
    () => confirmApprovalConsumed(evidence, otherPlan.decisionRecord),
    /exactly one consumption/,
  );
  // Unverified evidence refuses outright.
  assert.throws(
    () => confirmApprovalConsumed({ ...evidence, journalVerified: false } as never, record),
    /must be journalVerified/,
  );
});

test('12D-248 the plan never carries the custody seed and round-trips JSON', () => {
  const { record } = recordedDecision();
  const plan = buildApprovalVerificationPlan({ decisionRecord: record, verifiedAtMs: T0 + 200 });
  const serialized = JSON.stringify(plan);
  assert.equal(serialized.includes(SEED), false);
  assert.equal('seed' in plan, false);
  const transported = JSON.parse(JSON.stringify(plan)) as typeof plan;
  assert.equal(verifyApprovalVerificationPlan(transported).ok, true);
  // The transported plan still binds to the original record.
  assert.equal(transported.decisionRecord.decidedAtMs, record.decidedAtMs);
});