// 12D-247 — XIV OS Approval Custody Link: the missing connection between the
// 12D-242 story shell's "HUMAN DECISION REQUIRED" surface and the 12D-233/244
// custody chain. The shell renders the decision surface with NO approve
// control — the decision happens OUT-OF-BAND. This module is that out-of-band
// link: it turns an operator's EXPLICITLY STATED decision about a VERIFIED
// packet into a custody plan (12D-244 shape) the operator can run, plus the
// decision receipt the operator holds.
//
// Fail-closed by construction:
//   * The packet is VERIFIED FIRST (12D-241 verifyStoryShellPacket) — an
//     unverified packet never gets a decision receipt. Its refusal propagates.
//   * The decision is an EXPLICIT input: 'APPROVED' | 'REJECTED', exact-case,
//     no default, no inference. This module NEVER decides — it records a
//     decision a human already made. Absent or creative values refuse.
//   * The decision receipt is a sha256 over the canonical decision record
//     {domain, receiptVersion, packetId, storyId, decision, decidedBy,
//     decidedAtMs} — ids are digests, re-derived never invented (the
//     12D-241 pattern). The same record always yields the same receipt;
//     any field change yields a different one.
//   * The plan registers the receipt under the FIXED purpose
//     'xiv-os-human-approval' — a decision recorded under any other purpose
//     refuses at the registry (cross-purpose gate), so a misdirected record
//     cannot pass for this one.
//   * This module produces a PLAN; it EXECUTES nothing. The operator runs it
//     through runCustodyPlan (12D-244) themselves, out of band. Nothing here
//     auto-approves, auto-executes, or auto-records.
//   * Secrets never enter: credential-shaped decidedBy values refuse (the
//     charset gate makes them structurally impossible; the content re-gate
//     is belt-and-braces at the receipt boundary).
//
// Disclosed residuals:
//   * Registration is NOT authenticity: the journal proves the decision was
//     recorded, not that the person who stated it is who they claim (the
//     12D-233 residual carries over verbatim — custody authenticates the
//     CHAIN, not the operator; possession of the seed is control).
//   * Verification of a RECORDED decision (authenticating the receipt later,
//     single-use, 12D-233 semantics) is a future story; today the operator
//     holds the receipt and the journal holds the record.
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     modelCalls: 0, billionUsersProven: false on every surface. It calls
//     nothing remote and nothing model-shaped.

import { createHash } from 'crypto';
import {
  verifyStoryShellPacket, type StoryShellPacket,
} from './xiv-os-wire-contract';
import type { CustodyRunnerStep } from './custody-runner';

export const XIV_APPROVAL_CUSTODY_POLICY = Object.freeze({
  policyVersion: '12d-247-v1',
  domain: 'XIV_OS_APPROVAL_RECEIPT',
  receiptVersion: 1 as const,
  /** The ONLY purpose an approval decision may register under. */
  purpose: 'xiv-os-human-approval',
});

export const XIV_APPROVAL_CUSTODY_GUARDRAILS = Object.freeze({
  verifiesPacketBeforeLinking: true,
  recordsOnlyOperatorStatedDecisions: true,
  decisionIsAnExplicitInputNoDefault: true,
  producesAPlanItNeverExecutes: true,
  receiptIsADigestReDerivedNeverInvented: true,
  fixedPurposeOnly: true,
  deterministicReceipt: true,
  shellStaysPassive: true, // the 12D-242 shell renders the surface; this records the decision
  secretsNeverEnter: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false, // a refusal is a refusal; a human decides
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface ApprovalDecisionRecord {
  packetId: string;
  storyId: string;
  decision: ApprovalDecision;
  decidedBy: string;
  decidedAtMs: number;
}

const DECIDED_BY_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const APPROVAL_PLAN_KEYS = ['policyVersion', 'decisionReceiptSha256', 'decisionRecord', 'steps'] as const;
const SECRET_CONTENT_RE = /(-----BEGIN [A-Z ]+PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})/;

/**
 * The decision receipt: sha256 over the canonical decision record. The
 * domain tag keeps it DISTINCT from every other digest in the OS.
 */
export function deriveApprovalReceipt(record: Readonly<ApprovalDecisionRecord>): string {
  return createHash('sha256').update(JSON.stringify({
    domain: XIV_APPROVAL_CUSTODY_POLICY.domain,
    receiptVersion: XIV_APPROVAL_CUSTODY_POLICY.receiptVersion,
    packetId: record.packetId,
    storyId: record.storyId,
    decision: record.decision,
    decidedBy: record.decidedBy,
    decidedAtMs: record.decidedAtMs,
  }), 'utf8').digest('hex');
}

/**
 * Link an operator's EXPLICIT decision on a VERIFIED packet into custody:
 * verify the packet, freeze the decision record, derive its receipt, and
 * return the 12D-244 custody plan that records it. Execution stays with the
 * operator (runCustodyPlan) — this function runs nothing.
 */
export function buildApprovalCustodyPlan(opts: Readonly<{
  packet: Readonly<StoryShellPacket>;
  decision: ApprovalDecision;
  decidedBy: string;
  decidedAtMs: number;
}>): Readonly<{
  policyVersion: string;
  decisionReceiptSha256: string;
  decisionRecord: Readonly<ApprovalDecisionRecord>;
  steps: ReadonlyArray<CustodyRunnerStep>;
}> {
  if (!opts || typeof opts !== 'object' || Array.isArray(opts))
    throw new Error('buildApprovalCustodyPlan expects an options object; fail closed');
  const actualKeys = Object.keys(opts);
  if (actualKeys.length !== 4 || !['packet', 'decision', 'decidedBy', 'decidedAtMs'].every((k) => actualKeys.includes(k)))
    throw new Error('buildApprovalCustodyPlan options must have exactly the keys [packet, decision, decidedBy, decidedAtMs]; fail closed');

  // 1. The packet is verified FIRST — no receipt for an unverified packet.
  const verdict = verifyStoryShellPacket(opts.packet);
  if (!verdict.ok)
    throw new Error('the story packet failed verification; fail closed');

  // 2. The decision is explicit and exact — this module never decides.
  const decision = opts.decision;
  if (decision !== 'APPROVED' && decision !== 'REJECTED')
    throw new Error("decision must be exactly 'APPROVED' or 'REJECTED' (stated by the operator, never inferred); fail closed");
  const decidedBy = opts.decidedBy;
  if (typeof decidedBy !== 'string' || !DECIDED_BY_RE.test(decidedBy))
    throw new Error(`decidedBy must match ${DECIDED_BY_RE.source} (a non-empty operator id); fail closed`);
  if (SECRET_CONTENT_RE.test(decidedBy))
    throw new Error('decidedBy carries credential-shaped content; fail closed');
  const decidedAtMs = opts.decidedAtMs;
  if (typeof decidedAtMs !== 'number' || !Number.isSafeInteger(decidedAtMs) || decidedAtMs < 0)
    throw new Error('decidedAtMs must be a safe non-negative integer ms timestamp; fail closed');

  const decisionRecord: Readonly<ApprovalDecisionRecord> = Object.freeze({
    packetId: verdict.packetId,
    storyId: opts.packet.storyId,
    decision,
    decidedBy,
    decidedAtMs,
  });
  const decisionReceiptSha256 = deriveApprovalReceipt(decisionRecord);

  // The register step that records the decision in the 12D-236 journal via
  // the 12D-244 runner. issuedAtMs === registeredAtMs === decidedAtMs.
  const steps: ReadonlyArray<CustodyRunnerStep> = [Object.freeze({
    op: 'register' as const,
    receiptSha256: decisionReceiptSha256,
    purpose: XIV_APPROVAL_CUSTODY_POLICY.purpose,
    registeredBy: decidedBy,
    issuedAtMs: decidedAtMs,
    atMs: decidedAtMs,
  })];

  return Object.freeze({
    policyVersion: XIV_APPROVAL_CUSTODY_POLICY.policyVersion,
    decisionReceiptSha256,
    decisionRecord,
    steps,
  });
}

/**
 * Verify an approval custody plan against its decision record: the plan must
 * be a current-policy plan whose frozen decision record re-derives its
 * receipt, and whose single register step binds exactly to that receipt
 * under the fixed purpose. Proves the BINDING; journal authenticity remains
 * verifyCustodySession with the operator's seed (out of band, unchanged).
 */
export function verifyApprovalCustodyPlan(
  plan: Readonly<{
    policyVersion: string;
    decisionReceiptSha256: string;
    decisionRecord: Readonly<ApprovalDecisionRecord>;
    steps: ReadonlyArray<CustodyRunnerStep>;
  }>,
): Readonly<{ ok: true; decisionReceiptSha256: string }> {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan))
    throw new Error('an approval custody plan is required; fail closed');
  const p = plan as unknown as Record<string, unknown>;
  const actualKeys = Object.keys(p);
  if (actualKeys.length !== APPROVAL_PLAN_KEYS.length
    || !APPROVAL_PLAN_KEYS.every((k: string, i: number) => actualKeys[i] === k))
    throw new Error(`an approval custody plan must have exactly the keys [${APPROVAL_PLAN_KEYS.join(', ')}] in order; fail closed`);
  if (p.policyVersion !== XIV_APPROVAL_CUSTODY_POLICY.policyVersion)
    throw new Error(`an approval custody plan policyVersion must be '${XIV_APPROVAL_CUSTODY_POLICY.policyVersion}'; fail closed`);
  if (typeof p.decisionReceiptSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(p.decisionReceiptSha256))
    throw new Error('an approval custody plan receipt must be lowercase hex64; fail closed');

  const record = p.decisionRecord;
  if (!record || typeof record !== 'object' || Array.isArray(record))
    throw new Error('an approval custody plan carries a decision record; fail closed');
  const r = record as unknown as Record<string, unknown>;
  const recordKeys = ['packetId', 'storyId', 'decision', 'decidedBy', 'decidedAtMs'];
  if (Object.keys(r).length !== recordKeys.length || !recordKeys.every((k, i) => Object.keys(r)[i] === k))
    throw new Error('a decision record must have exactly the keys [packetId, storyId, decision, decidedBy, decidedAtMs] in order; fail closed');
  if (r.decision !== 'APPROVED' && r.decision !== 'REJECTED')
    throw new Error("a decision record decision must be exactly 'APPROVED' or 'REJECTED'; fail closed");
  if (typeof r.decidedBy !== 'string' || !DECIDED_BY_RE.test(r.decidedBy))
    throw new Error('a decision record decidedBy must match the operator id pattern; fail closed');
  if (typeof r.decidedAtMs !== 'number' || !Number.isSafeInteger(r.decidedAtMs) || r.decidedAtMs < 0)
    throw new Error('a decision record decidedAtMs must be a safe non-negative integer; fail closed');
  if (typeof r.packetId !== 'string' || !/^[0-9a-f]{64}$/.test(r.packetId))
    throw new Error('a decision record packetId must be lowercase hex64; fail closed');
  if (typeof r.storyId !== 'string' || r.storyId.length === 0)
    throw new Error('a decision record storyId must be a non-empty string; fail closed');

  // The record re-derives the receipt — any field edit breaks the binding.
  const reDerived = deriveApprovalReceipt(record as Readonly<ApprovalDecisionRecord>);
  if (reDerived !== p.decisionReceiptSha256)
    throw new Error('approval custody plan receipt mismatch — tampered or foreign plan; fail closed');

  const steps = p.steps;
  if (!Array.isArray(steps) || steps.length !== 1)
    throw new Error('an approval custody plan carries exactly one register step; fail closed');
  const step = steps[0] as unknown as Record<string, unknown>;
  const stepKeys = ['op', 'receiptSha256', 'purpose', 'registeredBy', 'issuedAtMs', 'atMs'];
  if (!step || typeof step !== 'object' || Array.isArray(step)
    || Object.keys(step).length !== stepKeys.length
    || !stepKeys.every((k, i) => Object.keys(step)[i] === k))
    throw new Error('the register step must have exactly the keys [op, receiptSha256, purpose, registeredBy, issuedAtMs, atMs] in order; fail closed');
  if (step.op !== 'register')
    throw new Error("the approval custody step must be a 'register'; fail closed");
  if (step.receiptSha256 !== reDerived)
    throw new Error('the approval custody step must register the derived decision receipt; fail closed');
  if (step.purpose !== XIV_APPROVAL_CUSTODY_POLICY.purpose)
    throw new Error(`the approval custody step must register under the fixed purpose '${XIV_APPROVAL_CUSTODY_POLICY.purpose}'; fail closed`);
  if (step.registeredBy !== r.decidedBy)
    throw new Error('the approval custody step registeredBy must equal the record decidedBy; fail closed');
  if (step.issuedAtMs !== r.decidedAtMs || step.atMs !== r.decidedAtMs)
    throw new Error('the approval custody step timestamps must equal the record decidedAtMs; fail closed');

  return Object.freeze({ ok: true, decisionReceiptSha256: reDerived });
}