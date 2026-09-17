// 12D-269 — Pathway Approval Link: the 12D-247-pattern custody link for
// pathway candidates. The 12D-264 ledger requires a candidate that carries
// the operator's RECORDED human approval — but between the 12D-2xx bridge
// (which produces a candidate with humanApproved: false) and the ledger,
// the approval was an UNVERIFIABLE out-of-band handoff: nothing bound the
// recorded decision to the exact candidate bytes it decided over. This link
// closes that gap, fail-closed:
//
//   * The operator's EXPLICIT decision is recorded as a digest-bound plan
//     (the 12D-247 shape): sha256 over the canonical record {domain,
//     receiptVersion, pathwayId, version, tenantId, candidateDigestSha256,
//     decision, decidedBy, decidedAtMs} — the receipt is RE-DERIVED, never
//     invented (the 12D-241 pattern), under a FIXED custody purpose
//     'xiv-os-pathway-approval' so a misdirected record cannot pass for
//     this one.
//   * THE CANDIDATE-BYTES BINDING (the property that exists nowhere else):
//     the decision record carries the candidate's canonical-JSON sha256,
//     and applyRecordedApproval refuses any packet whose candidate does
//     not re-derive that exact digest. A decision recorded over candidate
//     B cannot approve candidate A — the 12D-267 cross-binding lesson,
//     applied to the brain's ledger.
//   * ELIGIBILITY IS RE-EVALUATED, NEVER TRUSTED: the approved candidate
//     must pass the REAL 12D-89 growth-engine gate fresh at apply time —
//     a packet whose stored currentEligibility claims eligible cannot
//     shortcut the gate.
//   * REJECTED IS A DECISION: a recorded rejection returns an honest
//     REJECTED_RECORDED result with NO ledger-ready candidate — the
//     ledger path stays structurally closed.
//   * The secret-content re-gate lives INSIDE the verifier from day one
//     (the 12D-267 paydown, learned before it could recur here).
//
// Disclosed residuals (honest flags pinned on every surface):
//   * The plan produces custody steps the operator runs out of band
//     (runCustodyPlan, 12D-244) — this module executes nothing.
//   * A recorded approval is not an activation: nothing is activated, no
//     weight mutates, learningPromoted stays false; the ledger (12D-264)
//     still holds evidence awaiting human review, with no activation path.
//   * The link proves the BINDING, not the approver's identity —
//     registration is not issuance proof (the 12D-233 residual verbatim).

import { createHash } from 'crypto';
import {
  evaluatePathwayCandidate,
  type NeuralPathwayCandidate,
} from './neural-pathway-growth-engine';
import type { CustodyRunnerStep } from './custody-runner';

export const PATHWAY_APPROVAL_POLICY = Object.freeze({
  policyVersion: '12d-269-v1',
  domain: 'XIV_OS_PATHWAY_APPROVAL_RECEIPT',
  receiptVersion: 1 as const,
  /** The ONLY purpose a pathway approval may register under. */
  purpose: 'xiv-os-pathway-approval',
});

export const PATHWAY_APPROVAL_GUARDRAILS = Object.freeze({
  verifiesCandidateBinding: true, // the decision is about THESE bytes
  reEvaluatesEligibilityNeverTrustsStored: true,
  recordsOnlyOperatorStatedDecisions: true,
  decisionIsAnExplicitInputNoDefault: true,
  rejectedIsADecisionWithNoLedgerPath: true,
  receiptIsADigestReDerivedNeverInvented: true,
  fixedPurposeOnly: true,
  secretReGateInsideTheValidator: true, // the 12D-267 paydown, from day one
  producesAPlanItNeverExecutes: true,
  ledgeredNeverActivated: true,
  secretsNeverEnter: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type PathwayApprovalDecision = 'APPROVED' | 'REJECTED';

export interface PathwayApprovalRecord {
  pathwayId: string;
  version: number;
  tenantId: string;
  candidateDigestSha256: string;
  decision: PathwayApprovalDecision;
  decidedBy: string;
  decidedAtMs: number;
}

export interface PathwayEvidencePacketInput {
  readonly kind: 'QUEUE_OUTCOME_TO_PATHWAY_CANDIDATE';
  readonly candidate: Readonly<NeuralPathwayCandidate>;
}

export interface PathwayApprovalPlan {
  readonly policyVersion: string;
  readonly decisionReceiptSha256: string;
  readonly decisionRecord: Readonly<PathwayApprovalRecord>;
  readonly steps: ReadonlyArray<CustodyRunnerStep>;
}

export type PathwayApprovalOutcome = Readonly<
  | {
      kind: 'LEDGER_READY_PATHWAY_CANDIDATE';
      policyVersion: string;
      candidate: Readonly<NeuralPathwayCandidate>;
      decisionReceiptSha256: string;
      sourceStoryId: string;
      outputHash: string;
      ledgeredNeverActivated: true;
      modelWeightMutation: false;
      productionMutation: false;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
  | {
      kind: 'CANDIDATE_REJECTED_RECORDED';
      policyVersion: string;
      pathwayId: string;
      version: number;
      decisionReceiptSha256: string;
      ledgeredNeverActivated: true;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

const DECIDED_BY_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const SECRET_CONTENT_RE = /(-----BEGIN [A-Z ]+PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}|(?:sk|pk)_(?:test|live)_[A-Za-z0-9]{10,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{22,}|glpat-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[A-Za-z0-9-]{10,}|[?&](?:[A-Za-z]+-)?token=[A-Za-z0-9]{20,}|[Bb]earer [A-Za-z0-9_.=+/-]{30,})/;
const PLAN_KEYS = ['policyVersion', 'decisionReceiptSha256', 'decisionRecord', 'steps'] as const;
const RECORD_KEYS = ['pathwayId', 'version', 'tenantId', 'candidateDigestSha256', 'decision', 'decidedBy', 'decidedAtMs'] as const;
const PACKET_KEYS = ['kind', 'tenantId', 'storyId', 'outputHash', 'candidate', 'currentEligibility', 'activationAttempted', 'learningPromoted', 'modelWeightMutation', 'productionMutation', 'humanDecision'] as const;
const CANDIDATE_KEYS = ['pathwayId', 'tenantId', 'domain', 'version', 'parentPathwayId', 'confidence', 'evaluationScore', 'evidenceRefs', 'reviewRefs', 'humanApproved', 'rollbackRef', 'modelWeightMutation', 'productionMutation'] as const;

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const sha256Hex = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);

/** Canonical candidate JSON — the SAME key list and order the 12D-264
 * ledger's digest discipline uses, so the binding survives the ledger
 * boundary byte-exactly. */
export function canonicalCandidateJson(c: Readonly<NeuralPathwayCandidate>): string {
  return JSON.stringify(c, [
    'pathwayId', 'tenantId', 'domain', 'version', 'parentPathwayId',
    'confidence', 'evaluationScore', 'evidenceRefs', 'reviewRefs',
    'humanApproved', 'rollbackRef', 'modelWeightMutation', 'productionMutation',
  ]);
}

export function candidateDigest(c: Readonly<NeuralPathwayCandidate>): string {
  return createHash('sha256').update(canonicalCandidateJson(c), 'utf8').digest('hex');
}

/** The decision receipt: sha256 over the canonical decision record. The
 * domain tag keeps it DISTINCT from every other receipt in the OS. */
export function derivePathwayApprovalReceipt(record: Readonly<PathwayApprovalRecord>): string {
  return createHash('sha256').update(JSON.stringify({
    domain: PATHWAY_APPROVAL_POLICY.domain,
    receiptVersion: PATHWAY_APPROVAL_POLICY.receiptVersion,
    pathwayId: record.pathwayId,
    version: record.version,
    tenantId: record.tenantId,
    candidateDigestSha256: record.candidateDigestSha256,
    decision: record.decision,
    decidedBy: record.decidedBy,
    decidedAtMs: record.decidedAtMs,
  }), 'utf8').digest('hex');
}

/** Verify a pathway approval plan against its own record: exact keys in
 * order, current policy, the record re-derives its receipt, and the single
 * register step binds exactly to that receipt under the fixed purpose. The
 * secret-content re-gate lives HERE, inside the validator, from day one. */
export function verifyPathwayApprovalPlan(plan: unknown): Readonly<{ ok: true; decisionReceiptSha256: string }> {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan))
    throw new Error('a pathway approval plan is required; fail closed');
  const p = plan as Readonly<Record<string, unknown>>;
  const actualKeys = Object.keys(p);
  if (actualKeys.length !== PLAN_KEYS.length
    || !PLAN_KEYS.every((k: string, i: number) => actualKeys[i] === k))
    throw new Error(`a pathway approval plan must have exactly the keys [${PLAN_KEYS.join(', ')}] in order; fail closed`);
  if (p.policyVersion !== PATHWAY_APPROVAL_POLICY.policyVersion)
    throw new Error(`a pathway approval plan policyVersion must be '${PATHWAY_APPROVAL_POLICY.policyVersion}'; fail closed`);
  if (!sha256Hex(p.decisionReceiptSha256))
    throw new Error('a pathway approval plan receipt must be lowercase hex64; fail closed');

  const record = p.decisionRecord;
  if (!record || typeof record !== 'object' || Array.isArray(record))
    throw new Error('a pathway approval plan carries a decision record; fail closed');
  const r = record as Readonly<Record<string, unknown>>;
  const recordKeys = Object.keys(r);
  if (recordKeys.length !== RECORD_KEYS.length
    || !RECORD_KEYS.every((k: string, i: number) => recordKeys[i] === k))
    throw new Error(`a decision record must have exactly the keys [${RECORD_KEYS.join(', ')}] in order; fail closed`);
  if (!id(r.pathwayId) || !id(r.tenantId))
    throw new Error('scoped pathway/tenant identities required; fail closed');
  if (typeof r.version !== 'number' || !Number.isSafeInteger(r.version) || r.version < 1)
    throw new Error('version must be a safe integer >= 1; fail closed');
  if (!sha256Hex(r.candidateDigestSha256))
    throw new Error('a decision record candidateDigestSha256 must be lowercase hex64; fail closed');
  if (r.decision !== 'APPROVED' && r.decision !== 'REJECTED')
    throw new Error("a decision record decision must be exactly 'APPROVED' or 'REJECTED'; fail closed");
  if (typeof r.decidedBy !== 'string' || !DECIDED_BY_RE.test(r.decidedBy))
    throw new Error('a decision record decidedBy must match the operator id pattern; fail closed');
  if (SECRET_CONTENT_RE.test(r.decidedBy))
    throw new Error('a decision record decidedBy carries credential-shaped content; fail closed');
  if (typeof r.decidedAtMs !== 'number' || !Number.isSafeInteger(r.decidedAtMs) || r.decidedAtMs < 0)
    throw new Error('a decision record decidedAtMs must be a safe non-negative integer; fail closed');

  const reDerived = derivePathwayApprovalReceipt(record as Readonly<PathwayApprovalRecord>);
  if (reDerived !== p.decisionReceiptSha256)
    throw new Error('pathway approval plan receipt mismatch — tampered or foreign plan; fail closed');

  const steps = p.steps;
  if (!Array.isArray(steps) || steps.length !== 1)
    throw new Error('a pathway approval plan carries exactly one register step; fail closed');
  const step = steps[0] as unknown as Record<string, unknown>;
  const stepKeys = ['op', 'receiptSha256', 'purpose', 'registeredBy', 'issuedAtMs', 'atMs'];
  if (!step || typeof step !== 'object' || Array.isArray(step)
    || Object.keys(step).length !== stepKeys.length
    || !stepKeys.every((k, i) => Object.keys(step)[i] === k))
    throw new Error('the register step must have exactly the keys [op, receiptSha256, purpose, registeredBy, issuedAtMs, atMs] in order; fail closed');
  if (step.op !== 'register')
    throw new Error("the pathway approval step must be a 'register'; fail closed");
  if (step.receiptSha256 !== reDerived)
    throw new Error('the pathway approval step must register the derived decision receipt; fail closed');
  if (step.purpose !== PATHWAY_APPROVAL_POLICY.purpose)
    throw new Error(`the pathway approval step must register under the fixed purpose '${PATHWAY_APPROVAL_POLICY.purpose}'; fail closed`);
  if (step.registeredBy !== r.decidedBy)
    throw new Error('the pathway approval step registeredBy must equal the record decidedBy; fail closed');
  if (step.issuedAtMs !== r.decidedAtMs || step.atMs !== r.decidedAtMs)
    throw new Error('the pathway approval step timestamps must equal the record decidedAtMs; fail closed');

  return Object.freeze({ ok: true, decisionReceiptSha256: reDerived });
}

/** Build the custody plan for an operator's EXPLICIT decision over a
 * 12D-2xx bridge packet's candidate. The packet's pinned flags are
 * re-checked (never trusted); the decision is explicit; the receipt binds
 * to the candidate's exact canonical bytes. This function RUNS nothing. */
export function buildPathwayApprovalPlan(opts: Readonly<{
  packet: Readonly<PathwayEvidencePacketInput>;
  decision: PathwayApprovalDecision;
  decidedBy: string;
  decidedAtMs: number;
}>): PathwayApprovalPlan {
  if (!opts || typeof opts !== 'object' || Array.isArray(opts))
    throw new Error('buildPathwayApprovalPlan expects an options object; fail closed');
  const actualKeys = Object.keys(opts);
  if (actualKeys.length !== 4 || !['packet', 'decision', 'decidedBy', 'decidedAtMs'].every((k) => actualKeys.includes(k)))
    throw new Error('buildPathwayApprovalPlan options must have exactly the keys [packet, decision, decidedBy, decidedAtMs]; fail closed');

  // The bridge packet is re-checked, never trusted: exact keys in order,
  // the queue-outcome kind, and the pinned never-mutate flags.
  const pkt = opts.packet as unknown as Record<string, unknown>;
  if (!pkt || typeof pkt !== 'object')
    throw new Error('a 12D-2xx pathway evidence packet is required; fail closed');
  const packetKeys = Object.keys(pkt);
  if (packetKeys.length !== PACKET_KEYS.length
    || !PACKET_KEYS.every((k: string, i: number) => packetKeys[i] === k))
    throw new Error(`a pathway evidence packet must have exactly the keys [${PACKET_KEYS.join(', ')}] in order; fail closed`);
  if (pkt.kind !== 'QUEUE_OUTCOME_TO_PATHWAY_CANDIDATE')
    throw new Error('the packet must be a QUEUE_OUTCOME_TO_PATHWAY_CANDIDATE; fail closed');
  if (pkt.activationAttempted !== false || pkt.learningPromoted !== false
    || pkt.modelWeightMutation !== false || pkt.productionMutation !== false)
    throw new Error('a pathway evidence packet never mutates or promotes; fail closed');
  if (pkt.humanDecision !== 'REQUIRED')
    throw new Error("a pathway evidence packet pins humanDecision: 'REQUIRED'; fail closed");

  // The decision is explicit and exact — this module never decides.
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

  const candidate = pkt.candidate;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
    throw new Error('a pathway evidence packet carries a candidate; fail closed');
  const c = candidate as Readonly<Record<string, unknown>>;
  if (c.humanApproved !== false)
    throw new Error('a bridge candidate arrives UNAPPROVED — the approval is recorded through this link, never assumed; fail closed');
  if (c.modelWeightMutation !== false || c.productionMutation !== false)
    throw new Error('a bridge candidate never mutates weights or production; fail closed');
  if (!id(c.pathwayId) || !id(c.tenantId))
    throw new Error('scoped pathway/tenant identities required; fail closed');
  if (typeof c.version !== 'number' || !Number.isSafeInteger(c.version) || c.version < 1)
    throw new Error('version must be a safe integer >= 1; fail closed');

  const decisionRecord: Readonly<PathwayApprovalRecord> = Object.freeze({
    pathwayId: c.pathwayId as string,
    version: c.version as number,
    tenantId: c.tenantId as string,
    candidateDigestSha256: candidateDigest(candidate as Readonly<NeuralPathwayCandidate>),
    decision,
    decidedBy,
    decidedAtMs,
  });
  const decisionReceiptSha256 = derivePathwayApprovalReceipt(decisionRecord);

  const steps: ReadonlyArray<CustodyRunnerStep> = [Object.freeze({
    op: 'register' as const,
    receiptSha256: decisionReceiptSha256,
    purpose: PATHWAY_APPROVAL_POLICY.purpose,
    registeredBy: decidedBy,
    issuedAtMs: decidedAtMs,
    atMs: decidedAtMs,
  })];

  return Object.freeze({
    policyVersion: PATHWAY_APPROVAL_POLICY.policyVersion,
    decisionReceiptSha256,
    decisionRecord,
    steps,
  });
}

/**
 * Apply a VERIFIED recorded decision to the bridge packet: the candidate
 * bytes must re-derive the recorded digest (the cross-binding gate), the
 * packet must still be the packet the plan was built over, and — for an
 * approval — the approved candidate must pass the REAL 12D-89 gate fresh
 * (never trusting the packet's stored eligibility). APPROVED yields a
 * LEDGER-READY candidate for the 12D-264 ledger; REJECTED yields an honest
 * recorded rejection with no ledger path.
 */
export function applyRecordedApproval(
  packet: Readonly<PathwayEvidencePacketInput>,
  plan: unknown,
): PathwayApprovalOutcome {
  const verified = verifyPathwayApprovalPlan(plan);
  const pkt = packet as unknown as Record<string, unknown>;
  if (!pkt || typeof pkt !== 'object' || Array.isArray(pkt))
    throw new Error('a pathway evidence packet is required; fail closed');
  const record = (plan as Readonly<Record<string, unknown>>).decisionRecord as Readonly<PathwayApprovalRecord>;
  const candidate = pkt.candidate;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
    throw new Error('a pathway evidence packet carries a candidate; fail closed');
  const c = candidate as Readonly<Record<string, unknown>>;
  // The cross-binding gate: the decision is about THESE candidate bytes —
  // any other candidate (or a tampered field) refuses, whatever the plan's
  // internal consistency.
  const digest = candidateDigest(candidate as Readonly<NeuralPathwayCandidate>);
  if (record.candidateDigestSha256 !== digest)
    throw new Error('the recorded decision is not about this candidate (candidateDigest mismatch); fail closed');
  if (record.pathwayId !== c.pathwayId || record.tenantId !== c.tenantId
    || record.version !== c.version)
    throw new Error('the recorded decision is not about this candidate (identity mismatch); fail closed');

  if (record.decision === 'REJECTED') {
    return Object.freeze({
      kind: 'CANDIDATE_REJECTED_RECORDED' as const,
      policyVersion: PATHWAY_APPROVAL_POLICY.policyVersion,
      pathwayId: record.pathwayId,
      version: record.version,
      decisionReceiptSha256: verified.decisionReceiptSha256,
      ledgeredNeverActivated: true as const,
      learningPromoted: false as const,
      humanDecision: 'REQUIRED' as const,
    });
  }

  // The approval is real and binds to these bytes — produce the ledger-ready
  // candidate with humanApproved carried by the RECORDED decision, and let
  // the REAL growth-engine gate judge eligibility fresh (never the packet's
  // stored claim).
  const readyCandidate = Object.freeze({
    ...(candidate as Readonly<NeuralPathwayCandidate>),
    humanApproved: true as const,
  });
  const eligibility = evaluatePathwayCandidate(readyCandidate);
  if (!eligibility.eligible)
    throw new Error(`the approved candidate is not eligible (${eligibility.reasons.join('; ')}); fail closed`);
  return Object.freeze({
    kind: 'LEDGER_READY_PATHWAY_CANDIDATE' as const,
    policyVersion: PATHWAY_APPROVAL_POLICY.policyVersion,
    candidate: readyCandidate,
    decisionReceiptSha256: verified.decisionReceiptSha256,
    sourceStoryId: typeof pkt.storyId === 'string' ? pkt.storyId : '',
    outputHash: typeof pkt.outputHash === 'string' ? pkt.outputHash : '',
    ledgeredNeverActivated: true as const,
    modelWeightMutation: false as const,
    productionMutation: false as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}