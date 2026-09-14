// 12D-221 — focused tests for the OBSERVED-EVIDENCE COLLECTOR (renumbered from
// 12D-132 by CEO directive; only the story number changed).
// Coverage per the story spec: valid evidence, no execution, failure, rollback,
// replay, tampering, scope mismatch, stale evidence, secret redaction — plus the
// honest-flag and guardrail surface.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  DeclaredEvidenceCollector, DECLARED_EVIDENCE_POLICY, DECLARED_EVIDENCE_GUARDRAILS,
  redactDeclaredNote, type TrafficObservation, type DeclaredEvidenceReceipt,
} from './declared-evidence-collector';
import { deriveScalingRecordDigest } from './measured-horizontal-scaling';
import { deriveFailoverRecordDigest } from './measured-regional-failover';

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');
const RECEIPT = sha256('operator:xiv:12d-221');
const OTHER_RECEIPT = sha256('operator:xiv:12d-221:other');
const COMMIT = 'a'.repeat(40);
const NOW = 1_800_000_000_000;
const TENANT = 'tenant-alpha';
const UNIVERSE = 'universe-7';

const mkObservation = (over: Partial<TrafficObservation> = {}): TrafficObservation => ({
  observationId: `obs-${Math.random().toString(16).slice(2, 10)}`,
  observedAtMs: NOW - 60_000,
  virtualShard: 42,
  observedTrafficBps: 100,
  observedBy: 'observer:local-agent',
  ...over,
});

const mkScalingRecord = (over: Record<string, unknown> = {}) => {
  const base = {
    kind: 'SCALING_DECISION_RECORD' as const,
    planDigest: sha256('plan:scaling'),
    proposedNewDatabaseCount: 2,
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW' as const,
    decidedBy: 'operator:xiv',
    decidedAtMs: NOW - 120_000,
    operatorReceiptSha256: RECEIPT,
  };
  const merged = { ...base, ...over };
  const recordDigest = deriveScalingRecordDigest(merged as Parameters<typeof deriveScalingRecordDigest>[0]);
  return Object.freeze({
    ...merged,
    recordDigest,
    requiresDecisionSafetyWorkflowBeforeAnyAction: true as const,
    executedByThisRuntime: false as const,
    productionExecutionAllowed: false as const,
    databasesProvisioned: 0 as const,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
};

const mkFailoverRecord = (over: Record<string, unknown> = {}) => {
  const base = {
    kind: 'FAILOVER_DECISION_RECORD' as const,
    planDigest: sha256('plan:failover'),
    candidateRegionId: 'aws-us-west-2',
    requestedTrafficBps: 100,
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW' as const,
    decidedBy: 'operator:xiv',
    decidedAtMs: NOW - 120_000,
    operatorReceiptSha256: RECEIPT,
  };
  const merged = { ...base, ...over };
  const recordDigest = deriveFailoverRecordDigest(merged as Parameters<typeof deriveFailoverRecordDigest>[0]);
  return Object.freeze({
    ...merged,
    recordDigest,
    requiresDecisionSafetyWorkflowBeforeAnyAction: true as const,
    executedByThisRuntime: false as const,
    productionExecutionAllowed: false as const,
    authorizedTrafficBps: 0 as const,
    trafficMoved: false as const,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
};

/** A record tampered AFTER recording: fields swapped, the original digest retained. */
const tamperScalingRecord = (over: Record<string, unknown>) =>
  Object.freeze({ ...mkScalingRecord(), ...over });

const mkCollector = () => new DeclaredEvidenceCollector({
  tenantId: TENANT, universeId: UNIVERSE, collectorId: 'collector-1',
});

const mkOutcomeInput = (over: Record<string, unknown> = {}) => ({
  tenantId: TENANT,
  universeId: UNIVERSE,
  scope: 'SCALING' as const,
  runId: 'run-12d-221',
  sourceCommit: COMMIT,
  decisionId: 'decision-1',
  decisionRecord: mkScalingRecord(),
  instructionId: 'instr-1',
  operatorReceiptSha256: RECEIPT,
  status: 'PROPOSED' as const,
  before: mkObservation(),
  after: mkObservation({ observedAtMs: NOW - 30_000 }),
  recordedAtMs: NOW,
  ...over,
});

// Every declared field the receipt binds — the story's binding requirement, asserted
// field by field once, then relied on.
const assertReceiptBindings = (
  r: Readonly<DeclaredEvidenceReceipt>,
  expect: {
    status: string;
    kind?: 'DECLARED_OUTCOME_EVIDENCE' | 'DECLARED_ROLLBACK_EVIDENCE';
    decisionId?: string;
    instructionId?: string;
    operatorReceiptSha256?: string;
  },
): void => {
  assert.equal(r.tenantId, TENANT);
  assert.equal(r.universeId, UNIVERSE);
  assert.equal(r.runId, 'run-12d-221');
  assert.equal(r.sourceCommit, COMMIT);
  assert.equal(r.decisionId, expect.decisionId ?? 'decision-1');
  assert.match(r.decisionRecordDigest, /^[0-9a-f]{64}$/);
  assert.equal(r.decisionDisposition, 'ACCEPTED_FOR_HUMAN_REVIEW');
  assert.equal(r.instructionId, expect.instructionId ?? 'instr-1');
  assert.equal(r.operatorReceiptSha256, expect.operatorReceiptSha256 ?? RECEIPT);
  assert.equal(r.status, expect.status);
  assert.equal(r.kind, expect.kind ?? 'DECLARED_OUTCOME_EVIDENCE');
  assert.ok(r.observedBefore.observedAtMs <= r.observedAfter.observedAtMs);
  assert.match(r.evidenceDigest, /^[0-9a-f]{64}$/);
  // The digest is self-binding: it re-derives over the receipt's declared fields.
  assert.equal(sha256(JSON.stringify({
    tenantId: r.tenantId, universeId: r.universeId, scope: r.scope,
    runId: r.runId, sourceCommit: r.sourceCommit,
    decisionId: r.decisionId, decisionRecordDigest: r.decisionRecordDigest,
    decisionDisposition: r.decisionDisposition, instructionId: r.instructionId,
    operatorReceiptSha256: r.operatorReceiptSha256, status: r.status,
    before: r.observedBefore, after: r.observedAfter, note: r.note,
    recordedAtMs: r.recordedAtMs, rolledBackExecutionDigest: r.rolledBackExecutionDigest,
  })), r.evidenceDigest);
};

test('12d-221 valid scaling evidence binds every declared field and self-derives', () => {
  const c = mkCollector();
  const r = c.recordOutcomeEvidence(mkOutcomeInput({ status: 'PROPOSED' }));
  assertReceiptBindings(r, { status: 'PROPOSED' });
  assert.equal(c.collectedReceipts().length, 1);
});

test('12d-221 valid failover evidence binds a failover decision record', () => {
  const c = mkCollector();
  const r = c.recordOutcomeEvidence(mkOutcomeInput({
    scope: 'FAILOVER', decisionRecord: mkFailoverRecord(), status: 'EXECUTED',
  }));
  assertReceiptBindings(r, { status: 'EXECUTED' });
  // EXECUTED requires a strictly-elapsed after observation.
  assert.ok(r.observedAfter.observedAtMs > r.observedBefore.observedAtMs);
});

test('12d-221 no execution: statuses are declared, never inferred from decisions or instructions', () => {
  const c = mkCollector();
  // PROPOSED and NOT_EXECUTED are accepted as declared, and the collector never
  // promotes them.
  for (const status of ['PROPOSED', 'NOT_EXECUTED'] as const) {
    const r = c.recordOutcomeEvidence(mkOutcomeInput({ status, decisionId: `d-${status}` }));
    assert.equal(r.status, status);
  }
  // Equal before/after observations are legitimate for no-action statuses...
  const r = c.recordOutcomeEvidence(mkOutcomeInput({
    status: 'NOT_EXECUTED', decisionId: 'd-eq',
    after: mkObservation({ observedAtMs: NOW - 60_000 }),
  }));
  assert.equal(r.status, 'NOT_EXECUTED');
  // ...but an action claim with a frozen clock is refused.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    status: 'EXECUTED', decisionId: 'd-eq2',
    after: mkObservation({ observedAtMs: NOW - 60_000, observationId: 'obs-eq2' }),
  })), /strictly after/);
  // An unknown status fails closed — an accepted record plus an instruction id is
  // never silently promoted to execution.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({ status: 'ASSUMED_EXECUTED' as never })), /unknown/);
  // Execution evidence cannot bind a declined decision — a decision is never execution.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    status: 'EXECUTED', decisionId: 'd-declined',
    decisionRecord: mkScalingRecord({ decision: 'DECLINED_BY_HUMAN' }),
  })), /declined decision/);
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({ status: 'ROLLED_BACK' })), /recordRollbackEvidence/);
});

test('12d-221 failure evidence binds an accepted record', () => {
  const c = mkCollector();
  const r = c.recordOutcomeEvidence(mkOutcomeInput({ status: 'FAILED', decisionId: 'd-failed' }));
  assertReceiptBindings(r, { status: 'FAILED', decisionId: 'd-failed' });
});

test('12d-221 rollback: separate evidence against a separately presented EXECUTED receipt', () => {
  const c = mkCollector();
  const executed = c.recordOutcomeEvidence(mkOutcomeInput({
    status: 'EXECUTED', decisionId: 'd-exec',
    after: mkObservation({ observedAtMs: NOW - 20_000 }),
  }));
  const rb = c.recordRollbackEvidence({
    executionReceipt: executed,
    decisionId: 'd-exec',
    instructionId: 'instr-rollback',
    operatorReceiptSha256: OTHER_RECEIPT,
    before: mkObservation({ observedAtMs: NOW - 15_000 }),
    after: mkObservation({ observedAtMs: NOW - 10_000 }),
    recordedAtMs: NOW,
  });
  assertReceiptBindings(rb, {
    status: 'ROLLED_BACK', kind: 'DECLARED_ROLLBACK_EVIDENCE',
    decisionId: 'd-exec', instructionId: 'instr-rollback', operatorReceiptSha256: OTHER_RECEIPT,
  });
  assert.equal(rb.rolledBackExecutionDigest, executed.evidenceDigest);
  // The rollback observes the world AFTER the execution it undoes.
  assert.ok(rb.observedBefore.observedAtMs >= executed.observedAfter.observedAtMs);
  // The rollback's operator receipt is its own — separate human acts, separate receipts.
  assert.notEqual(rb.operatorReceiptSha256, executed.operatorReceiptSha256);
});

test('12d-221 rollback refused against a non-executed or tampered receipt', () => {
  const c = mkCollector();
  const proposed = c.recordOutcomeEvidence(mkOutcomeInput({ status: 'PROPOSED', decisionId: 'd-p' }));
  assert.throws(() => c.recordRollbackEvidence({
    executionReceipt: proposed, decisionId: 'd-p', instructionId: 'i',
    operatorReceiptSha256: RECEIPT,
    before: mkObservation({ observedAtMs: NOW - 15_000 }),
    after: mkObservation({ observedAtMs: NOW - 10_000 }),
    recordedAtMs: NOW,
  }), /only an EXECUTED receipt/);
  // A tampered presented receipt fails its own evidenceDigest re-derivation.
  const executed = c.recordOutcomeEvidence(mkOutcomeInput({
    status: 'EXECUTED', decisionId: 'd-exec',
    after: mkObservation({ observedAtMs: NOW - 20_000 }),
  }));
  const tampered = Object.freeze({ ...executed, status: 'FAILED' as const });
  assert.throws(() => c.recordRollbackEvidence({
    executionReceipt: tampered, decisionId: 'd-exec', instructionId: 'i',
    operatorReceiptSha256: RECEIPT,
    before: mkObservation({ observedAtMs: NOW - 15_000 }),
    after: mkObservation({ observedAtMs: NOW - 10_000 }),
    recordedAtMs: NOW,
  }), /re-derive its own evidenceDigest/);
  // Rollback before the execution's own observation is an impossible ordering.
  assert.throws(() => c.recordRollbackEvidence({
    executionReceipt: executed, decisionId: 'd-exec', instructionId: 'i',
    operatorReceiptSha256: RECEIPT,
    before: mkObservation({ observedAtMs: executed.observedAfter.observedAtMs - 1 }),
    after: mkObservation({ observedAtMs: NOW - 10_000 }),
    recordedAtMs: NOW,
  }), /impossible ordering/);
});

test('12d-221 replay: duplicate receipt digests and reused observation ids refused', () => {
  const c = mkCollector();
  const first = mkOutcomeInput({ status: 'PROPOSED', decisionId: 'd-1' });
  c.recordOutcomeEvidence(first);
  // The identical receipt again is a replay — refused as duplicated evidence (the
  // observation-id gate) or by the digest-replay backstop; both fail closed.
  assert.throws(() => c.recordOutcomeEvidence({
    ...first, before: { ...first.before }, after: { ...first.after },
  }), /replay refused|duplicated evidence/);
  // A different receipt that reuses either observation id is duplicated evidence.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    status: 'PROPOSED', decisionId: 'd-2', before: { ...first.before, observationId: first.before.observationId },
  })), /already recorded/);
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    status: 'PROPOSED', decisionId: 'd-3', after: { ...first.after, observationId: first.after.observationId },
  })), /already recorded/);
  // An observation id reused across a rollback is refused too.
  const executed = c.recordOutcomeEvidence(mkOutcomeInput({
    status: 'EXECUTED', decisionId: 'd-x',
    after: mkObservation({ observedAtMs: NOW - 20_000 }),
  }));
  assert.throws(() => c.recordRollbackEvidence({
    executionReceipt: executed, decisionId: 'd-x', instructionId: 'i',
    operatorReceiptSha256: RECEIPT,
    before: mkObservation({ observedAtMs: NOW - 15_000, observationId: executed.observedBefore.observationId }),
    after: mkObservation({ observedAtMs: NOW - 10_000 }),
    recordedAtMs: NOW,
  }), /already recorded/);
});

test('12d-221 tampering: presented decision records must re-derive their recordDigest', () => {
  const c = mkCollector();
  // A field swapped after recording (original digest retained) fails re-derivation.
  const swaps = [
    { decision: 'DECLINED_BY_HUMAN' },
    { operatorReceiptSha256: OTHER_RECEIPT },
    { decidedAtMs: NOW - 90_000 },
    { decidedBy: 'operator:other' },
    { proposedNewDatabaseCount: 3 },
    { planDigest: sha256('other-plan') },
  ];
  swaps.forEach((over, i) => {
    assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
      decisionId: `d-tamper-${i}`, decisionRecord: tamperScalingRecord(over),
    })), /re-derive its own recordDigest/);
  });
  // A forged digest on an untampered record fails too.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-forged-digest',
    decisionRecord: Object.freeze({ ...mkScalingRecord(), recordDigest: sha256('forged') }),
  })), /re-derive its own recordDigest/);
  // An unfrozen record is refused outright.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-unfrozen', decisionRecord: { ...mkScalingRecord() },
  })), /frozen decision record/);
});

test('12d-221 scope mismatch: cross-tenant, cross-universe, and record-kind mismatches refused', () => {
  const c = mkCollector();
  // Cross-tenant and cross-universe claims are refused at the collector boundary.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({ tenantId: 'tenant-beta' })), /outside this collector/);
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({ universeId: 'universe-8' })), /outside this collector/);
  // A scaling receipt cannot bind a failover decision record, and vice versa.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-kind-1', decisionRecord: mkFailoverRecord(),
  })), /cannot bind a non-scaling decision record/);
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    scope: 'FAILOVER', decisionId: 'd-kind-3', decisionRecord: mkScalingRecord(),
  })), /cannot bind a non-failover decision record/);
  // A rollback receipt presented across a different collector's scope is refused.
  const otherCollector = new DeclaredEvidenceCollector({
    tenantId: 'tenant-beta', universeId: UNIVERSE, collectorId: 'collector-2',
  });
  const executedHere = mkCollector().recordOutcomeEvidence(mkOutcomeInput({
    status: 'EXECUTED', decisionId: 'd-x',
    after: mkObservation({ observedAtMs: NOW - 20_000 }),
  }));
  assert.throws(() => otherCollector.recordRollbackEvidence({
    executionReceipt: executedHere, decisionId: 'd-x', instructionId: 'i',
    operatorReceiptSha256: RECEIPT,
    before: mkObservation({ observedAtMs: NOW - 15_000 }),
    after: mkObservation({ observedAtMs: NOW - 10_000 }),
    recordedAtMs: NOW,
  }), /outside this collector scope/);
});

test('12d-221 stale, future-dated, and temporally impossible evidence refused', () => {
  const c = mkCollector();
  // Older than the policy bound relative to the recording time.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-stale', before: mkObservation({ observedAtMs: NOW - DECLARED_EVIDENCE_POLICY.maxObservationAgeMs - 1 }),
  })), /stale/);
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-stale2', after: mkObservation({ observedAtMs: NOW - DECLARED_EVIDENCE_POLICY.maxObservationAgeMs - 1 }),
  })), /stale/);
  // Dated after the declared recording time.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-future', after: mkObservation({ observedAtMs: NOW + 1 }),
  })), /future of the recording time/);
  // Recorded before the decision it evidences.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-early', recordedAtMs: NOW - 121_000,
  })), /before the decision it evidences/);
  // The after observation predating the before observation.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-order', after: mkObservation({ observedAtMs: NOW - 90_000 }),
  })), /after observation predates/);
  // Unsigned evidence fails closed.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-unsigned', operatorReceiptSha256: 'deadbeef',
  })), /64-hex/);
  // A rollback receipt recorded before its execution receipt is impossible.
  const executed = mkCollector().recordOutcomeEvidence(mkOutcomeInput({
    status: 'EXECUTED', decisionId: 'd-x', recordedAtMs: NOW - 5_000,
    after: mkObservation({ observedAtMs: NOW - 20_000 }),
  }));
  assert.throws(() => mkCollector().recordRollbackEvidence({
    executionReceipt: executed, decisionId: 'd-x', instructionId: 'i',
    operatorReceiptSha256: RECEIPT,
    before: mkObservation({ observedAtMs: NOW - 15_000 }),
    after: mkObservation({ observedAtMs: NOW - 10_000 }),
    recordedAtMs: NOW - 10_000,
  }), /before the execution evidence/);
});

test('12d-221 secret redaction: notes are scrubbed before they enter a receipt', () => {
  // Key=value credentials.
  assert.equal(redactDeclaredNote('api_key=sk-live-abcdef123456 deployment note').redacted,
    `${DECLARED_EVIDENCE_POLICY.redactedMarker} deployment note`);
  // Bearer tokens.
  const bearer = redactDeclaredNote('Authorization: Bearer abcdef1234567890abcdef1234567890');
  assert.ok(!bearer.redacted.includes('abcdef1234567890abcdef1234567890'));
  assert.ok(bearer.redacted.includes(DECLARED_EVIDENCE_POLICY.redactedMarker));
  // Private-key blocks.
  const pem = redactDeclaredNote('-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----');
  assert.equal(pem.redacted, DECLARED_EVIDENCE_POLICY.redactedMarker);
  assert.equal(pem.redactionApplied, true);
  // A long opaque token in prose.
  const opaque = redactDeclaredNote('lease token AbCdEf0123456789AbCdEf0123456789 in redis');
  assert.ok(!opaque.redacted.includes('AbCdEf0123456789AbCdEf0123456789'));
  // A clean note passes through untouched, and the receipt records redaction honestly.
  const clean = redactDeclaredNote('traffic shifted on shard 42 as instructed');
  assert.equal(clean.redactionApplied, false);
  assert.equal(clean.redacted, 'traffic shifted on shard 42 as instructed');
  // Through the collector: redactionApplied is true, the secret is gone.
  const c = mkCollector();
  const r = c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-redact', note: 'api_key = AKIAIOSFODNN7EXAMPLE rotated',
  }));
  assert.equal(r.redactionApplied, true);
  assert.ok(!r.note!.includes('AKIAIOSFODNN7EXAMPLE'));
  assert.ok(r.note!.includes(DECLARED_EVIDENCE_POLICY.redactedMarker));
});

test('12d-221 honest flags and guardrails: the collector permits nothing', () => {
  const c = mkCollector();
  const r = c.recordOutcomeEvidence(mkOutcomeInput({ status: 'PROPOSED' }));
  assert.equal(r.providerInvocationAuthorized, false);
  assert.equal(r.trafficMoved, false);
  assert.equal(r.databasesProvisioned, 0);
  assert.equal(r.productionMutationAllowed, false);
  assert.equal(r.mergeAllowed, false);
  assert.equal(r.deployAllowed, false);
  assert.equal(r.humanDecision, 'REQUIRED');
  assert.equal(r.learningPromoted, false);
  assert.equal(r.modelCalls, 0);
  assert.equal(r.remoteCalls, 0);
  assert.equal(r.billionUsersProven, false);
  assert.equal(r.automaticRecovery, false);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.permitsNoProviderCall, true);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.permitsNoTrafficMovement, true);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.permitsNoProductionMutation, true);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.permitsNoMergeOrDeployment, true);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.statusIsDeclaredNeverInferred, true);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.executionAndRollbackRequireSeparateEvidence, true);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.zeroModelCalls, true);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.automaticRecovery, false);
  // The before and after observations must be independent — the same observation id
  // cannot serve both sides of a receipt.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-same-obs',
    after: mkObservation({ observationId: 'obs-same' }),
    before: mkObservation({ observationId: 'obs-same' }),
  })), /not independent/);
  // Undeclared fields on an observation can never ride in — the exact-shape gate.
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-extra', before: { ...mkObservation(), prompt: 'user prompt text' },
  })), /undeclared fields/);
  assert.throws(() => c.recordOutcomeEvidence(mkOutcomeInput({
    decisionId: 'd-extra2', after: { ...mkObservation(), customerPayload: { a: 1 } },
  })), /undeclared fields/);
  // Receipts are frozen; the collected view is frozen.
  assert.ok(Object.isFrozen(r));
  assert.ok(Object.isFrozen(c.collectedReceipts()));
});