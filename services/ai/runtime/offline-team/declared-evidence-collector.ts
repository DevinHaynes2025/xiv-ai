// 12D-132 — Scaling & Failover DECLARED-EVIDENCE COLLECTOR (the measured-evidence rung
// after the 12D-130/131 execution bridges).
//
// The bridges emit EXECUTION_INSTRUCTIONs that execute nothing; the operator acts (or
// does not act) in a system outside this runtime. This module converts LOCALLY
// OBSERVED outcomes of those proposals into bounded, redacted, hash-bound evidence
// receipts — the first step toward MEASURED evidence for the failover and scaling
// rungs, which until now carried only DECLARED evidence.
//
// The trust discipline:
//   * Status is DECLARED, never inferred. The collector distinguishes PROPOSED,
//     NOT_EXECUTED, EXECUTED, FAILED, ROLLED_BACK, UNVERIFIED — and NEVER flips,
//     promotes, or infers a status from an instruction, an approval, or a receipt: an
//     accepted decision or an issued instruction is not execution.
//   * Every receipt binds tenant, universe, run, source commit, decision id, the
//     decision record's recordDigest, instruction id, operator receipt (identity
//     reference), and its own recording timestamp — plus BOTH a before and an after
//     traffic observation. A receipt without independent observations is
//     self-declared-only and rejected.
//   * Execution and rollback require SEPARATE evidence: a rollback receipt is issued
//     only against a separately presented, digest-verified EXECUTED receipt, with its
//     own fresh observations.
//   * The presented decision record is UNTRUSTED: its recordDigest is re-derived over
//     its recorded fields and compared — tampering fails closed before anything is
//     bound.
//   * Scope is fail-closed: the collector is constructed bound to ONE tenant and
//     universe; cross-tenant or cross-universe evidence is refused. A scaling receipt
//     can never bind a failover decision record, and vice versa.
//   * Freshness is fail-closed: observations older than the policy bound are stale;
//     observations dated in the future of the declared recording time are an
//     impossible ordering; a receipt cannot be recorded before the decision it
//     evidences; replayed evidence (same digest, reused observation ids) is refused.
//   * Redaction is structural: the only free text is a bounded note, scrubbed of
//     secret-shaped content (key=value pairs, long opaque tokens, private keys) before
//     it ever enters a receipt; the receipt records whether redaction was applied.
//     Exact-shape gates reject undeclared fields — prompts, responses, credentials,
//     customer data, and classified workloads can never ride in an observation.
//
// It PERMITS NOTHING: no provider call, no traffic movement, no production mutation,
// no merge, no deployment — the receipt observes; every honest flag is structural.

import { createHash } from 'node:crypto';
import {
  deriveScalingRecordDigest, type ScalingDecisionRecord,
} from './measured-horizontal-scaling';
import {
  deriveFailoverRecordDigest, type FailoverDecisionRecord,
} from './measured-regional-failover';

export const DECLARED_EVIDENCE_POLICY = Object.freeze({
  statuses: Object.freeze([
    'PROPOSED', 'NOT_EXECUTED', 'EXECUTED', 'FAILED', 'ROLLED_BACK', 'UNVERIFIED',
  ]) as readonly string[],
  /** An observation older than this, relative to the declared recording time, is stale. */
  maxObservationAgeMs: 3_600_000,
  maxObservedTrafficBps: 10_000, // the failover policy's traffic domain
  maxVirtualShard: 65_535,
  maxIdChars: 128,
  maxNoteChars: 500,
  /** Tokens this long in a note are treated as secret-shaped and redacted. */
  minSecretTokenChars: 32,
  redactedMarker: '[REDACTED]',
});

export const DECLARED_EVIDENCE_GUARDRAILS = Object.freeze({
  statusIsDeclaredNeverInferred: true, // an instruction or approval is not execution
  everyReceiptCarriesBeforeAndAfterObservations: true,
  executionAndRollbackRequireSeparateEvidence: true,
  presentedDecisionRecordsAreDigestVerified: true,
  scopeIsSingleTenantSingleUniverse: true,
  replayAndDuplicationRefused: true,
  notesAreRedactedOfSecretShapedContent: true,
  carriesNoPromptResponseOrCustomerData: true,
  carriesNoClassifiedWorkload: true,
  permitsNoProviderCall: true,
  permitsNoTrafficMovement: true,
  permitsNoProductionMutation: true,
  permitsNoMergeOrDeployment: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export const DECLARED_EVIDENCE_STATUSES = DECLARED_EVIDENCE_POLICY.statuses;
export type DeclaredEvidenceStatus =
  | 'PROPOSED' | 'NOT_EXECUTED' | 'EXECUTED' | 'FAILED' | 'ROLLED_BACK' | 'UNVERIFIED';
export type EvidenceScope = 'SCALING' | 'FAILOVER';

export interface TrafficObservation {
  /** Unique within the collector's lifetime; a reused id is a replay. */
  readonly observationId: string;
  readonly observedAtMs: number;
  readonly virtualShard: number;
  /** DECLARED locally observed traffic — this runtime never measures traffic itself. */
  readonly observedTrafficBps: number;
  /** Who/what made the observation (an identity reference, never a credential). */
  readonly observedBy: string;
}

export interface DeclaredEvidenceReceipt {
  readonly kind: 'DECLARED_OUTCOME_EVIDENCE' | 'DECLARED_ROLLBACK_EVIDENCE';
  readonly scope: EvidenceScope;
  readonly tenantId: string;
  readonly universeId: string;
  readonly runId: string;
  readonly sourceCommit: string;
  readonly decisionId: string;
  /** Re-derived over the presented record's recorded fields at binding time. */
  readonly decisionRecordDigest: string;
  /** The presented record's own decision, recorded verbatim — never reinterpreted. */
  readonly decisionDisposition: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
  readonly instructionId: string;
  /** The operator receipt (identity reference) backing THIS evidence, not the plan's. */
  readonly operatorReceiptSha256: string;
  readonly status: DeclaredEvidenceStatus;
  readonly observedBefore: Readonly<TrafficObservation>;
  readonly observedAfter: Readonly<TrafficObservation>;
  readonly note: string | null;
  readonly redactionApplied: boolean;
  readonly recordedAtMs: number;
  /** sha256 over every declared field — the receipt's own integrity value. */
  readonly evidenceDigest: string;
  /** Set only on a rollback receipt: the digest of the EXECUTED receipt it rolls back. */
  readonly rolledBackExecutionDigest: string | null;
  readonly guardrails: Readonly<typeof DECLARED_EVIDENCE_GUARDRAILS>;
  readonly providerInvocationAuthorized: false;
  readonly trafficMoved: false;
  readonly databasesProvisioned: 0;
  readonly productionMutationAllowed: false;
  readonly mergeAllowed: false;
  readonly deployAllowed: false;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const commitSha = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{40}$/.test(v);
const id = (v: unknown): v is string =>
  typeof v === 'string' && v.length >= 1 && v.length <= DECLARED_EVIDENCE_POLICY.maxIdChars
  && /^[A-Za-z0-9][A-Za-z0-9_.:@/-]*$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

const OBSERVATION_KEYS = Object.freeze([
  'observationId', 'observedAtMs', 'virtualShard', 'observedTrafficBps', 'observedBy',
]);

const hasExactKeys = (obj: unknown, keys: readonly string[]): boolean =>
  typeof obj === 'object' && obj !== null
  && JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...keys].sort());

/**
 * Scrubs secret-shaped content from a note BEFORE it can enter a receipt: key=value
 * credentials, provider key formats, private-key blocks, and any long opaque token.
 * Conservative by design — a 40-hex commit sha pasted into a note is redacted too.
 */
export const redactDeclaredNote = (note: string): { redacted: string; redactionApplied: boolean } => {
  let redacted = note;
  const scrub = (pattern: RegExp): void => {
    redacted = redacted.replace(pattern, DECLARED_EVIDENCE_POLICY.redactedMarker);
  };
  scrub(/(?:api[-_]?key|apikey|secret|token|password|passphrase|credential|authorization|bearer)\s*[:=]\s*\S+/gi);
  scrub(/\bsk-[A-Za-z0-9]{16,}\b/g);
  scrub(/\bAKIA[0-9A-Z]{16}\b/g);
  scrub(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g);
  // No word-boundary anchors: tokens ending in '=' or '/' (base64 padding, path shards)
  // would otherwise escape the boundary rule. Conservative — long URLs in notes redact too.
  scrub(new RegExp(`[A-Za-z0-9+/=_-]{${DECLARED_EVIDENCE_POLICY.minSecretTokenChars},}`, 'g'));
  return { redacted, redactionApplied: redacted !== note };
};

function assertObservation(o: unknown, label: string): asserts o is TrafficObservation {
  if (!hasExactKeys(o, OBSERVATION_KEYS))
    throw new Error(`${label} observation carries undeclared fields; prompts, responses, credentials, customer data, and classified workloads can never ride in an observation; fail closed`);
  const v = o as TrafficObservation;
  if (!id(v.observationId)) throw new Error(`${label} observation id invalid; fail closed`);
  if (!safeInt(v.observedAtMs) || v.observedAtMs <= 0)
    throw new Error(`${label} observation timestamp invalid; fail closed`);
  if (!safeInt(v.virtualShard) || v.virtualShard < 0
    || v.virtualShard > DECLARED_EVIDENCE_POLICY.maxVirtualShard)
    throw new Error(`${label} virtual shard outside policy; fail closed`);
  if (!safeInt(v.observedTrafficBps) || v.observedTrafficBps < 0
    || v.observedTrafficBps > DECLARED_EVIDENCE_POLICY.maxObservedTrafficBps)
    throw new Error(`${label} observed traffic outside policy; fail closed`);
  if (!id(v.observedBy)) throw new Error(`${label} observer identity invalid; fail closed`);
}

/**
 * The collector is bound at construction to ONE tenant and universe; every receipt it
 * issues is digest-deduplicated and observation-id-deduplicated for its lifetime.
 * Fail-closed on stale, future-dated, duplicated, unsigned, mismatched, cross-tenant,
 * or self-declared-only evidence.
 */
export class DeclaredEvidenceCollector {
  readonly #tenantId: string;
  readonly #universeId: string;
  readonly #collectorId: string;
  readonly #receiptDigests = new Set<string>();
  readonly #observationIds = new Set<string>();
  readonly #receipts: DeclaredEvidenceReceipt[] = [];

  constructor(input: { tenantId: string; universeId: string; collectorId: string }) {
    if (!id(input?.tenantId) || !id(input?.universeId) || !id(input?.collectorId))
      throw new Error('collector scope identity invalid; fail closed');
    this.#tenantId = input.tenantId;
    this.#universeId = input.universeId;
    this.#collectorId = input.collectorId;
  }

  get scope(): Readonly<{ tenantId: string; universeId: string; collectorId: string }> {
    return Object.freeze({ tenantId: this.#tenantId, universeId: this.#universeId, collectorId: this.#collectorId });
  }

  /** The receipts this collector has issued, in order — an auditable frozen view. */
  collectedReceipts(): readonly Readonly<DeclaredEvidenceReceipt>[] {
    return Object.freeze([...this.#receipts]);
  }

  /**
   * Verify a presented decision record's self-digest WITHOUT provenance: the digest
   * re-derives over the record's own recorded fields, so any post-recording field
   * tampering fails closed here (the 12D-130 discipline, made callable).
   */
  #verifyDecisionRecord(scope: EvidenceScope, record: unknown): {
    digest: string; disposition: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
    decidedAtMs: number; decision: string;
  } {
    if (!record || !Object.isFrozen(record)) throw new Error('not a frozen decision record; fail closed');
    const r = record as { kind: string; recordDigest: string; decision: string; decidedAtMs: number }
      & (ScalingDecisionRecord | FailoverDecisionRecord);
    if (scope === 'SCALING' && r.kind !== 'SCALING_DECISION_RECORD')
      throw new Error('a scaling evidence receipt cannot bind a non-scaling decision record; fail closed');
    if (scope === 'FAILOVER' && r.kind !== 'FAILOVER_DECISION_RECORD')
      throw new Error('a failover evidence receipt cannot bind a non-failover decision record; fail closed');
    const digest = scope === 'SCALING' ? deriveScalingRecordDigest(r as ScalingDecisionRecord)
      : deriveFailoverRecordDigest(r as FailoverDecisionRecord);
    if (digest !== r.recordDigest)
      throw new Error('the presented decision record does not re-derive its own recordDigest; tampered; fail closed');
    return {
      digest: r.recordDigest,
      disposition: r.decision as 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN',
      decidedAtMs: r.decidedAtMs,
      decision: r.decision,
    };
  }

  #validateObservations(
    before: TrafficObservation, after: TrafficObservation, recordedAtMs: number,
    requiresElapsed: boolean,
  ): void {
    assertObservation(before, 'before');
    assertObservation(after, 'after');
    for (const [label, o] of [['before', before], ['after', after]] as const) {
      if (this.#observationIds.has(o.observationId))
        throw new Error(`${label} observation id already recorded; duplicated evidence; fail closed`);
      if (o.observedAtMs > recordedAtMs)
        throw new Error(`${label} observation is dated in the future of the recording time; fail closed`);
      if (recordedAtMs - o.observedAtMs > DECLARED_EVIDENCE_POLICY.maxObservationAgeMs)
        throw new Error(`${label} observation is stale beyond the ${DECLARED_EVIDENCE_POLICY.maxObservationAgeMs}ms policy bound; fail closed`);
    }
    if (before.observationId === after.observationId)
      throw new Error('the before and after observations are not independent (same observation id); fail closed');
    if (after.observedAtMs < before.observedAtMs)
      throw new Error('the after observation predates the before observation; fail closed');
    if (requiresElapsed && after.observedAtMs === before.observedAtMs)
      throw new Error('an outcome claiming an action requires an after observation strictly after the before observation; fail closed');
  }

  #register(observationIds: string[], digest: string): void {
    if (this.#receiptDigests.has(digest))
      throw new Error('an identical evidence receipt was already recorded; replay refused; fail closed');
    for (const observationId of observationIds) this.#observationIds.add(observationId);
    this.#receiptDigests.add(digest);
  }

  #finish(input: Omit<DeclaredEvidenceReceipt, 'evidenceDigest' | 'guardrails' | 'tenantId' | 'universeId'
    | 'providerInvocationAuthorized' | 'trafficMoved' | 'databasesProvisioned' | 'productionMutationAllowed'
    | 'mergeAllowed' | 'deployAllowed' | 'humanDecision' | 'learningPromoted' | 'modelCalls' | 'remoteCalls'
    | 'billionUsersProven' | 'automaticRecovery'>,
    evidenceDigest: string,
  ): Readonly<DeclaredEvidenceReceipt> {
    // The digest is computed by the caller over the DECLARED-FIELDS preimage (the
    // exact preimage any downstream consumer re-derives) and is NOT recomputed here —
    // a second digest over different content would break self-binding.
    const sealed = Object.freeze({
      ...input,
      tenantId: this.#tenantId,
      universeId: this.#universeId,
      guardrails: DECLARED_EVIDENCE_GUARDRAILS,
      providerInvocationAuthorized: false as const,
      trafficMoved: false as const,
      databasesProvisioned: 0 as const,
      productionMutationAllowed: false as const,
      mergeAllowed: false as const,
      deployAllowed: false as const,
      humanDecision: 'REQUIRED' as const,
      learningPromoted: false as const,
      modelCalls: 0 as const,
      remoteCalls: 0 as const,
      billionUsersProven: false as const,
      automaticRecovery: false as const,
      evidenceDigest,
    });
    this.#receipts.push(sealed);
    return sealed;
  }

  /**
   * Record DECLARED outcome evidence for one proposal. The status is the operator's
   * declaration, never this module's inference; an accepted decision or an issued
   * instruction alone can never produce an EXECUTED receipt.
   */
  recordOutcomeEvidence(input: {
    /** The scope the evidence CLAIMS — must match the collector's binding or it is cross-tenant. */
    tenantId: string;
    universeId: string;
    scope: EvidenceScope;
    runId: string;
    sourceCommit: string;
    decisionId: string;
    decisionRecord: Readonly<ScalingDecisionRecord> | Readonly<FailoverDecisionRecord>;
    instructionId: string;
    operatorReceiptSha256: string;
    status: DeclaredEvidenceStatus;
    before: TrafficObservation;
    after: TrafficObservation;
    note?: string;
    recordedAtMs: number;
  }): Readonly<DeclaredEvidenceReceipt> {
    if (!input || typeof input !== 'object')
      throw new Error('evidence input required; fail closed');
    if (!DECLARED_EVIDENCE_POLICY.statuses.includes(input.status))
      throw new Error('evidence status unknown; fail closed');
    if (input.status === 'ROLLED_BACK')
      throw new Error('rollback evidence requires recordRollbackEvidence against a separately presented EXECUTED receipt; fail closed');
    if (!id(input.runId) || !id(input.decisionId) || !id(input.instructionId))
      throw new Error('run, decision, or instruction reference invalid; fail closed');
    if (!commitSha(input.sourceCommit)) throw new Error('source commit invalid; fail closed');
    if (!hex64(input.operatorReceiptSha256))
      throw new Error('evidence requires a 64-hex sha256 operator receipt; unsigned evidence fails closed');
    if (!safeInt(input.recordedAtMs) || input.recordedAtMs <= 0)
      throw new Error('recording timestamp invalid; fail closed');
    // Scope is fail-closed: cross-tenant or cross-universe evidence is refused here.
    if (input.tenantId !== this.#tenantId || input.universeId !== this.#universeId)
      throw new Error('evidence is outside this collector tenant/universe scope; fail closed');
    const record = this.#verifyDecisionRecord(input.scope, input.decisionRecord);
    // An accepted decision or issued instruction is NOT execution: execution, failure,
    // and rollback evidence can only bind an ACCEPTED decision record, and the status
    // is still the operator's separate declaration.
    if ((input.status === 'EXECUTED' || input.status === 'FAILED')
      && record.decision !== 'ACCEPTED_FOR_HUMAN_REVIEW')
      throw new Error('execution or failure evidence cannot bind a declined decision; fail closed');
    if (input.recordedAtMs < record.decidedAtMs)
      throw new Error('evidence recorded before the decision it evidences; impossible ordering; fail closed');
    // Both observations are mandatory — a status without independent observations is
    // self-declared-only and rejected.
    this.#validateObservations(input.before, input.after, input.recordedAtMs,
      input.status === 'EXECUTED' || input.status === 'FAILED');
    if (input.note !== undefined && (typeof input.note !== 'string'
      || input.note.length < 1 || input.note.length > DECLARED_EVIDENCE_POLICY.maxNoteChars))
      throw new Error('evidence note outside policy; fail closed');
    const noteResult = input.note === undefined
      ? { redacted: null, redactionApplied: false }
      : redactDeclaredNote(input.note);
    const digest = sha256(JSON.stringify({
      tenantId: input.tenantId, universeId: input.universeId, scope: input.scope,
      runId: input.runId, sourceCommit: input.sourceCommit,
      decisionId: input.decisionId, decisionRecordDigest: record.digest,
      decisionDisposition: record.decision, instructionId: input.instructionId,
      operatorReceiptSha256: input.operatorReceiptSha256, status: input.status,
      before: input.before, after: input.after, note: noteResult.redacted,
      recordedAtMs: input.recordedAtMs, rolledBackExecutionDigest: null,
    }));
    this.#register([input.before.observationId, input.after.observationId], digest);
    return this.#finish({
      kind: 'DECLARED_OUTCOME_EVIDENCE',
      scope: input.scope,
      runId: input.runId,
      sourceCommit: input.sourceCommit,
      decisionId: input.decisionId,
      decisionRecordDigest: record.digest,
      decisionDisposition: record.disposition,
      instructionId: input.instructionId,
      operatorReceiptSha256: input.operatorReceiptSha256,
      status: input.status,
      observedBefore: Object.freeze({ ...input.before }),
      observedAfter: Object.freeze({ ...input.after }),
      note: noteResult.redacted,
      redactionApplied: noteResult.redactionApplied,
      recordedAtMs: input.recordedAtMs,
      rolledBackExecutionDigest: null,
    }, digest);
  }

  /**
   * Record ROLLBACK evidence — SEPARATE from execution evidence by construction: it is
   * issued only against a separately presented, digest-verified EXECUTED receipt and
   * carries its own fresh before/after observations.
   */
  recordRollbackEvidence(input: {
    executionReceipt: Readonly<DeclaredEvidenceReceipt>;
    decisionId: string;
    instructionId: string;
    operatorReceiptSha256: string;
    before: TrafficObservation;
    after: TrafficObservation;
    note?: string;
    recordedAtMs: number;
  }): Readonly<DeclaredEvidenceReceipt> {
    if (!input || typeof input !== 'object')
      throw new Error('rollback input required; fail closed');
    if (!id(input.decisionId) || !id(input.instructionId))
      throw new Error('decision or instruction reference invalid; fail closed');
    if (!hex64(input.operatorReceiptSha256))
      throw new Error('rollback evidence requires a 64-hex sha256 operator receipt; fail closed');
    if (!safeInt(input.recordedAtMs) || input.recordedAtMs <= 0)
      throw new Error('recording timestamp invalid; fail closed');
    const presented = input.executionReceipt as DeclaredEvidenceReceipt | null;
    if (!presented || presented.kind !== 'DECLARED_OUTCOME_EVIDENCE' || !Object.isFrozen(presented))
      throw new Error('not a frozen DECLARED_OUTCOME_EVIDENCE receipt; fail closed');
    if (presented.tenantId !== this.#tenantId || presented.universeId !== this.#universeId)
      throw new Error('the presented execution receipt is outside this collector scope; fail closed');
    // The presented execution receipt is UNTRUSTED: its own digest must re-derive.
    const presentedDigest = sha256(JSON.stringify({
      tenantId: presented.tenantId, universeId: presented.universeId, scope: presented.scope,
      runId: presented.runId, sourceCommit: presented.sourceCommit,
      decisionId: presented.decisionId, decisionRecordDigest: presented.decisionRecordDigest,
      decisionDisposition: presented.decisionDisposition, instructionId: presented.instructionId,
      operatorReceiptSha256: presented.operatorReceiptSha256, status: presented.status,
      before: presented.observedBefore, after: presented.observedAfter, note: presented.note,
      recordedAtMs: presented.recordedAtMs, rolledBackExecutionDigest: null,
    }));
    if (presentedDigest !== presented.evidenceDigest)
      throw new Error('the presented execution receipt does not re-derive its own evidenceDigest; tampered; fail closed');
    if (presented.status !== 'EXECUTED')
      throw new Error('only an EXECUTED receipt can be rolled back; fail closed');
    if (input.recordedAtMs < presented.recordedAtMs)
      throw new Error('rollback evidence recorded before the execution evidence; impossible ordering; fail closed');
    // The rollback observes the world AFTER the execution it undoes.
    this.#validateObservations(input.before, input.after, input.recordedAtMs, true);
    if (input.before.observedAtMs < presented.observedAfter.observedAtMs)
      throw new Error('rollback observation predates the execution observation; impossible ordering; fail closed');
    if (input.note !== undefined && (typeof input.note !== 'string'
      || input.note.length < 1 || input.note.length > DECLARED_EVIDENCE_POLICY.maxNoteChars))
      throw new Error('rollback note outside policy; fail closed');
    const noteResult = input.note === undefined
      ? { redacted: null, redactionApplied: false }
      : redactDeclaredNote(input.note);
    const digest = sha256(JSON.stringify({
      tenantId: presented.tenantId, universeId: presented.universeId, scope: presented.scope,
      runId: presented.runId, sourceCommit: presented.sourceCommit,
      decisionId: input.decisionId, decisionRecordDigest: presented.decisionRecordDigest,
      decisionDisposition: presented.decisionDisposition, instructionId: input.instructionId,
      operatorReceiptSha256: input.operatorReceiptSha256, status: 'ROLLED_BACK',
      before: input.before, after: input.after, note: noteResult.redacted,
      recordedAtMs: input.recordedAtMs, rolledBackExecutionDigest: presented.evidenceDigest,
    }));
    this.#register([input.before.observationId, input.after.observationId], digest);
    return this.#finish({
      kind: 'DECLARED_ROLLBACK_EVIDENCE',
      scope: presented.scope,
      runId: presented.runId,
      sourceCommit: presented.sourceCommit,
      decisionId: input.decisionId,
      decisionRecordDigest: presented.decisionRecordDigest,
      decisionDisposition: presented.decisionDisposition,
      instructionId: input.instructionId,
      operatorReceiptSha256: input.operatorReceiptSha256,
      status: 'ROLLED_BACK',
      observedBefore: Object.freeze({ ...input.before }),
      observedAfter: Object.freeze({ ...input.after }),
      note: noteResult.redacted,
      redactionApplied: noteResult.redactionApplied,
      recordedAtMs: input.recordedAtMs,
      rolledBackExecutionDigest: presented.evidenceDigest,
    }, digest);
  }
}