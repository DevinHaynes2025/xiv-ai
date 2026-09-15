// 12D-248 — XIV OS Approval Verification: the second half of the approval
// lifecycle 12D-247 opened. 12D-247 RECORDS an operator's decision about a
// verified packet (one register step, digest-bound receipt). THIS module
// AUTHENTICATES that recorded decision LATER: it produces the 12D-244
// authenticate plan that consumes the decision receipt exactly once, and
// confirms consumption from the runner's evidence.
//
// Why this matters: recording a decision proves it was journaled. Verifying
// it proves — to anyone holding the operator's decision record — that the
// receipt exists in the custody chain under the fixed purpose, was issued
// before the check, and had never been consumed before. The registry's
// single-use gate makes the verification itself one-shot: a receipt proves
// its own verification exactly once, and any second attempt refuses.
//
// Fail-closed by construction:
//   * The decision record is the operator's out-of-band artifact; the
//     receipt is RE-DERIVED from it (never accepted as a claim) — an edited
//     record breaks the digest and refuses.
//   * verifiedAtMs must be a safe non-negative integer and MUST be >= the
//     record's decidedAtMs (the registry refuses authenticating before
//     issuance — the suite proves the runner surfaces that refusal).
//   * The authenticate step registers under the FIXED purpose
//     'xiv-os-human-approval' — a receipt recorded under any other purpose
//     refuses at the registry (cross-purpose gate).
//   * This module produces a PLAN and CONFIRMS evidence; it EXECUTES
//     nothing and REGISTERS nothing new. The operator runs the plan through
//     runCustodyPlan (12D-244) out of band.
//   * The seed NEVER serializes into the plan — the operator re-provides it
//     to the runner out of band (12D-237 discipline).
//
// Disclosed residuals:
//   * Authentication is NOT identity proof: it authenticates the CHAIN, not
//     the operator (the 12D-233 residual carries over verbatim).
//   * A verification consumes the receipt — the operator should keep the
//     decision record + evidence packet as the durable proof, since the
//     receipt itself can never be re-authenticated.
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     modelCalls: 0, billionUsersProven: false on every surface.

import {
  deriveApprovalReceipt, XIV_APPROVAL_CUSTODY_POLICY,
  type ApprovalDecisionRecord,
} from './xiv-approval-custody';
import type { CustodyRunnerStep, CustodyRunEvidence } from './custody-runner';

export const XIV_APPROVAL_VERIFICATION_POLICY = Object.freeze({
  policyVersion: '12d-248-v1',
  purpose: XIV_APPROVAL_CUSTODY_POLICY.purpose,
});

export const XIV_APPROVAL_VERIFICATION_GUARDRAILS = Object.freeze({
  receiptReDerivedFromTheHeldRecord: true,
  singleUseConsumption: true, // the registry consumes; a second verify refuses
  recordsNothingNew: true, // authenticate consumes; it never registers
  fixedPurposeOnly: true,
  verifiedAtMsNeverBeforeDecidedAtMs: true,
  producesAPlanItNeverExecutes: true,
  seedNeverSerializesIntoThePlan: true,
  secretsNeverEnter: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false, // a refusal is a refusal; a human decides
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const VERIFICATION_PLAN_KEYS = ['policyVersion', 'decisionReceiptSha256', 'decisionRecord', 'steps'] as const;
const RECORD_KEYS = ['packetId', 'storyId', 'decision', 'decidedBy', 'decidedAtMs'] as const;

function gateDecisionRecord(record: unknown): Readonly<ApprovalDecisionRecord> {
  if (!record || typeof record !== 'object' || Array.isArray(record))
    throw new Error('an approval decision record is required; fail closed');
  const r = record as Record<string, unknown>;
  const keys = Object.keys(r);
  if (keys.length !== RECORD_KEYS.length || !RECORD_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`a decision record must have exactly the keys [${RECORD_KEYS.join(', ')}] in order; fail closed`);
  if (r.decision !== 'APPROVED' && r.decision !== 'REJECTED')
    throw new Error("a decision record decision must be exactly 'APPROVED' or 'REJECTED'; fail closed");
  if (typeof r.decidedBy !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(r.decidedBy))
    throw new Error('a decision record decidedBy must match the operator id pattern; fail closed');
  if (typeof r.decidedAtMs !== 'number' || !Number.isSafeInteger(r.decidedAtMs) || r.decidedAtMs < 0)
    throw new Error('a decision record decidedAtMs must be a safe non-negative integer; fail closed');
  if (typeof r.packetId !== 'string' || !/^[0-9a-f]{64}$/.test(r.packetId))
    throw new Error('a decision record packetId must be lowercase hex64; fail closed');
  if (typeof r.storyId !== 'string' || r.storyId.length === 0)
    throw new Error('a decision record storyId must be a non-empty string; fail closed');
  return record as Readonly<ApprovalDecisionRecord>;
}

/**
 * The verification plan: authenticate the decision receipt derived from the
 * operator-held record, exactly once, at a moment AFTER the decision.
 * Execution stays with the operator (runCustodyPlan, 12D-244).
 */
export function buildApprovalVerificationPlan(opts: Readonly<{
  decisionRecord: Readonly<ApprovalDecisionRecord>;
  verifiedAtMs: number;
}>): Readonly<{
  policyVersion: string;
  decisionReceiptSha256: string;
  decisionRecord: Readonly<ApprovalDecisionRecord>;
  steps: ReadonlyArray<CustodyRunnerStep>;
}> {
  if (!opts || typeof opts !== 'object' || Array.isArray(opts))
    throw new Error('buildApprovalVerificationPlan expects an options object; fail closed');
  const keys = Object.keys(opts);
  if (keys.length !== 2 || !['decisionRecord', 'verifiedAtMs'].every((k) => keys.includes(k)))
    throw new Error('buildApprovalVerificationPlan options must have exactly the keys [decisionRecord, verifiedAtMs]; fail closed');

  const record = gateDecisionRecord(opts.decisionRecord);
  const verifiedAtMs = opts.verifiedAtMs;
  if (typeof verifiedAtMs !== 'number' || !Number.isSafeInteger(verifiedAtMs) || verifiedAtMs < 0)
    throw new Error('verifiedAtMs must be a safe non-negative integer ms timestamp; fail closed');
  if (verifiedAtMs < record.decidedAtMs)
    throw new Error('verifiedAtMs must not precede decidedAtMs — the registry refuses authenticating before issuance; fail closed');

  // The receipt is re-derived from the record, never accepted as a claim.
  const receipt = deriveApprovalReceipt(record);
  const steps: ReadonlyArray<CustodyRunnerStep> = [Object.freeze({
    op: 'authenticate' as const,
    receiptSha256: receipt,
    purpose: XIV_APPROVAL_VERIFICATION_POLICY.purpose,
    atMs: verifiedAtMs,
  })];
  return Object.freeze({
    policyVersion: XIV_APPROVAL_VERIFICATION_POLICY.policyVersion,
    decisionReceiptSha256: receipt,
    decisionRecord: Object.freeze({ ...record }),
    steps,
  });
}

function exactKeys(value: object, expected: readonly string[], what: string): void {
  const actual = Object.keys(value);
  if (actual.length !== expected.length || !expected.every((k, i) => actual[i] === k))
    throw new Error(`${what} must have exactly the keys [${expected.join(', ')}] in order; fail closed`);
}

/**
 * Confirm, from the 12D-244 runner's evidence, that the decision receipt was
 * AUTHENTICATED (consumed exactly once) at the recorded moment. Proves the
 * evidence-to-record BINDING; journal authenticity remains verifyCustodySession
 * with the operator's seed (out of band, unchanged).
 */
export function confirmApprovalConsumed(
  evidence: Readonly<CustodyRunEvidence>,
  decisionRecord: Readonly<ApprovalDecisionRecord>,
): Readonly<{ ok: true; receiptSha256: string; consumedAtMs: number }> {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence))
    throw new Error('a custody run evidence packet is required; fail closed');
  if (evidence.journalVerified !== true)
    throw new Error('the evidence must be journalVerified; fail closed');
  const record = gateDecisionRecord(decisionRecord);
  const receipt = deriveApprovalReceipt(record);

  const consumed = evidence.applied.filter((a) =>
    a.op === 'authenticate'
    && a.receiptSha256 === receipt
    && a.purpose === XIV_APPROVAL_VERIFICATION_POLICY.purpose
    && a.consumed !== undefined
    && a.consumed.receiptSha256 === receipt
    && a.consumed.purpose === XIV_APPROVAL_VERIFICATION_POLICY.purpose
    && a.consumed.consumedAtMs >= record.decidedAtMs,
  );
  if (consumed.length !== 1)
    throw new Error('the evidence must show exactly one consumption of the decision receipt; fail closed');
  return Object.freeze({
    ok: true,
    receiptSha256: receipt,
    consumedAtMs: consumed[0].consumed!.consumedAtMs,
  });
}

/**
 * Verify a verification plan's internal binding (receipt re-derives from the
 * record; the single authenticate step pins receipt/purpose/time). The
 * mirror of 12D-247's verifyApprovalCustodyPlan for the authenticate half.
 */
export function verifyApprovalVerificationPlan(
  plan: Readonly<{
    policyVersion: string;
    decisionReceiptSha256: string;
    decisionRecord: Readonly<ApprovalDecisionRecord>;
    steps: ReadonlyArray<CustodyRunnerStep>;
  }>,
): Readonly<{ ok: true; decisionReceiptSha256: string }> {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan))
    throw new Error('an approval verification plan is required; fail closed');
  const p = plan as unknown as Record<string, unknown>;
  exactKeys(p, VERIFICATION_PLAN_KEYS, 'an approval verification plan');
  if (p.policyVersion !== XIV_APPROVAL_VERIFICATION_POLICY.policyVersion)
    throw new Error(`an approval verification plan policyVersion must be '${XIV_APPROVAL_VERIFICATION_POLICY.policyVersion}'; fail closed`);
  const record = gateDecisionRecord(p.decisionRecord);
  const receipt = deriveApprovalReceipt(record);
  if (p.decisionReceiptSha256 !== receipt)
    throw new Error('approval verification plan receipt mismatch — tampered or foreign plan; fail closed');
  const steps = p.steps;
  if (!Array.isArray(steps) || steps.length !== 1)
    throw new Error('an approval verification plan carries exactly one authenticate step; fail closed');
  const step = steps[0] as unknown as Record<string, unknown>;
  const stepKeys = ['op', 'receiptSha256', 'purpose', 'atMs'];
  if (!step || typeof step !== 'object' || Array.isArray(step)
    || Object.keys(step).length !== stepKeys.length
    || !stepKeys.every((k, i) => Object.keys(step)[i] === k))
    throw new Error('the authenticate step must have exactly the keys [op, receiptSha256, purpose, atMs] in order; fail closed');
  if (step.op !== 'authenticate')
    throw new Error("the approval verification step must be an 'authenticate'; fail closed");
  if (step.receiptSha256 !== receipt)
    throw new Error('the approval verification step must authenticate the derived decision receipt; fail closed');
  if (step.purpose !== XIV_APPROVAL_VERIFICATION_POLICY.purpose)
    throw new Error(`the approval verification step must authenticate under the fixed purpose '${XIV_APPROVAL_VERIFICATION_POLICY.purpose}'; fail closed`);
  if (typeof step.atMs !== 'number' || step.atMs < record.decidedAtMs)
    throw new Error('the approval verification step must authenticate at or after decidedAtMs; fail closed');
  return Object.freeze({ ok: true, decisionReceiptSha256: receipt });
}