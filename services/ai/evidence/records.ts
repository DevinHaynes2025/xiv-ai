import { refuse } from '../civilization/errors';
import { assertLevelClaim, assessLevel } from './levels';
import { requireGate, requireMember, requireRecord, sha256, visibleTo, type EvidenceState } from './store';
import type {
  CodeIdentity,
  EvidenceActor,
  EvidenceLevel,
  EvidenceRecord,
  EvidenceStatus,
  ExecutorType,
  OutcomeKind,
} from './types';

// Section 34 — the evidence record contract, and the two things that make it
// worth anything: it must be complete when it is written, and it must not be
// editable afterwards.

// Credential shapes that must never be copied into an artifact (sections 34 and
// 47). This is not the secret scanner and does not pretend to be; it is the
// guard on the one table that is append-only and never deleted from, where a
// pasted token would live forever. The service-layer list and the SQL trigger's
// list are kept in step deliberately, so a PostgREST write cannot slip past a
// check the service makes.
const SECRET_SHAPES: readonly { name: string; pattern: RegExp }[] = [
  { name: 'bearer token', pattern: /bearer\s+[a-z0-9._-]{20,}/i },
  { name: 'private key block', pattern: /-----begin[a-z ]*private key-----/i },
  { name: 'credentialed connection string', pattern: /(postgres(ql)?|mysql|mongodb):\/\/[^\s:]+:[^\s@]+@/i },
  { name: 'json web token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./ },
  { name: 'provider api key', pattern: /(sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|gh[pousr]_[A-Za-z0-9]{20,})/ },
  { name: 'aws secret access key', pattern: /aws_secret_access_key\s*[:=]\s*\S+/i },
];

export function findSecretShapes(value: string): string[] {
  return SECRET_SHAPES.filter((shape) => shape.pattern.test(value)).map((shape) => shape.name);
}

export function assertNoSecrets(parts: Record<string, string>) {
  for (const [field, value] of Object.entries(parts)) {
    const found = findSecretShapes(value);
    if (found.length > 0) {
      // The offending value is named by shape and field, never echoed. An error
      // message is itself a place a secret would end up.
      refuse('evidence_contains_secret', `${field} looks like a ${found.join(' and ')}`);
    }
  }
}

export type RecordEvidenceInput = {
  gateKey: string;
  testRunId: string;
  code: CodeIdentity;
  environment: string;
  testSuite: string;
  testCase: string;
  testVersion?: string;
  expectedResult: string;
  actualResult: string;
  status: EvidenceStatus;
  outcomeKind?: OutcomeKind;
  mandatory?: boolean;
  claimedLevel: EvidenceLevel;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number | null;
  runtimeNodeId?: string | null;
  modelId?: string | null;
  modelVersion?: string | null;
  executorType: ExecutorType;
  executorId: string;
  evidenceLocation: string;
  evidenceContent?: string;
  evidenceHash?: string;
  reproductionCommand?: string | null;
  primaryOwner: string;
  expiresAt?: string | null;
  securityClassification?: string;
  retentionPolicy?: string;
  provenance?: Record<string, unknown>;
};

const REQUIRED_TEXT: readonly (keyof RecordEvidenceInput)[] = [
  'gateKey',
  'testRunId',
  'environment',
  'testSuite',
  'testCase',
  'expectedResult',
  'actualResult',
  'executorId',
  'evidenceLocation',
  'primaryOwner',
];

export function recordEvidence(
  state: EvidenceState,
  actor: EvidenceActor,
  input: RecordEvidenceInput,
): EvidenceRecord {
  requireMember(state, actor);
  const gate = requireGate(state, actor.universeId, input.gateKey);

  for (const field of REQUIRED_TEXT) {
    const value = input[field];
    if (typeof value !== 'string' || value.trim() === '') {
      refuse('evidence_contract_field_missing', String(field));
    }
  }

  // Section 38. Anything claiming to be an automated result onward has to say
  // which code it ran against, or it proves nothing about any commit.
  const claimsAutomation = input.claimedLevel !== 'E0' && input.claimedLevel !== 'E1';
  if (claimsAutomation && input.code.commitSha.trim().length < 7) {
    refuse('evidence_commit_required', `${input.testCase} claims ${input.claimedLevel} without a commit`);
  }

  assertNoSecrets({
    expectedResult: input.expectedResult,
    actualResult: input.actualResult,
    evidenceLocation: input.evidenceLocation,
    provenance: JSON.stringify(input.provenance ?? {}),
    ...(input.evidenceContent ? { evidenceContent: input.evidenceContent } : {}),
  });

  const evidenceHash =
    input.evidenceHash ?? (input.evidenceContent ? sha256(input.evidenceContent) : '');
  if (!evidenceHash && input.claimedLevel !== 'E0') {
    refuse('evidence_contract_field_missing', 'evidenceHash');
  }

  const assessment = assessLevel(
    {
      code: input.code,
      executorType: input.executorType,
      evidenceLocation: input.evidenceLocation,
      evidenceHash,
      reproductionCommand: input.reproductionCommand ?? null,
      status: input.status,
    },
    // A brand new record has no verifications yet, so E4 is unreachable at
    // insert by construction. It becomes reachable when somebody independent
    // says so, which is exactly the ordering section 35 describes.
    { verifications: [] },
  );
  assertLevelClaim(input.claimedLevel, assessment);

  const timestamp = state.clock();
  const record: EvidenceRecord = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: state.organizationOf(actor.universeId),
    gateId: gate.id,
    testRunId: input.testRunId,
    code: { ...input.code },
    environment: input.environment,
    testSuite: input.testSuite,
    testCase: input.testCase,
    testVersion: input.testVersion ?? '1',
    expectedResult: input.expectedResult,
    actualResult: input.actualResult,
    status: input.status,
    outcomeKind: input.outcomeKind ?? 'positive',
    mandatory: input.mandatory ?? true,
    evidenceLevel: input.claimedLevel,
    startedAt: input.startedAt ?? timestamp,
    completedAt: input.completedAt ?? timestamp,
    durationMs: input.durationMs ?? null,
    runtimeNodeId: input.runtimeNodeId ?? null,
    modelId: input.modelId ?? null,
    modelVersion: input.modelVersion ?? null,
    executorType: input.executorType,
    executorId: input.executorId,
    evidenceLocation: input.evidenceLocation,
    evidenceHash,
    reproductionCommand: input.reproductionCommand ?? null,
    primaryOwner: input.primaryOwner,
    reviewer: null,
    approvalState: gate.humanApprovalRule === 'none' ? 'not_required' : 'pending',
    exceptionId: null,
    expiresAt: input.expiresAt ?? null,
    supersededBy: null,
    invalidatedAt: null,
    invalidatedReason: null,
    provenance: { ...(input.provenance ?? {}), recordedBy: actor.userId },
    securityClassification: input.securityClassification ?? 'internal',
    retentionPolicy: input.retentionPolicy ?? 'retain-7y-then-review',
    createdBy: actor.userId,
    createdAt: timestamp,
  };

  state.records.push(record);
  return record;
}

// The only way to correct a record. The original stays readable and points at
// its replacement, so the trail shows that a result was revised and by whom
// rather than showing a result that was always right.
export function supersede(
  state: EvidenceState,
  actor: EvidenceActor,
  input: { recordId: string; replacement: RecordEvidenceInput; reason: string },
): { previous: EvidenceRecord; replacement: EvidenceRecord } {
  requireMember(state, actor);
  const previous = requireRecord(state, actor.universeId, input.recordId);
  if (previous.supersededBy) {
    refuse('evidence_immutable', `${previous.id} was already superseded`);
  }
  if (!input.reason.trim()) {
    refuse('evidence_contract_field_missing', 'reason');
  }

  const replacement = recordEvidence(state, actor, {
    ...input.replacement,
    provenance: { ...(input.replacement.provenance ?? {}), supersedes: previous.id, reason: input.reason },
  });
  previous.supersededBy = replacement.id;
  return { previous, replacement };
}

export function invalidate(
  state: EvidenceState,
  actor: EvidenceActor,
  input: { recordId: string; reason: string },
): EvidenceRecord {
  requireMember(state, actor);
  const record = requireRecord(state, actor.universeId, input.recordId);
  if (!input.reason.trim()) refuse('evidence_contract_field_missing', 'reason');
  record.invalidatedAt = state.clock();
  record.invalidatedReason = input.reason;
  return record;
}

// Section 38's escape hatch, with its price attached. Evidence may be carried to
// a second commit only when someone writes down why the change cannot affect the
// property that was validated, and signs their name to it. Without that the
// answer is simply that commit B is unproven.
export function reuseAcrossCommits(
  state: EvidenceState,
  actor: EvidenceActor,
  input: {
    recordId: string;
    toCommitSha: string;
    impactAnalysis: string;
    analyzedBy: string;
  },
): EvidenceRecord {
  requireMember(state, actor);
  const source = requireRecord(state, actor.universeId, input.recordId);

  if (input.impactAnalysis.trim().length < 40) {
    refuse(
      'evidence_reuse_requires_impact_analysis',
      'carrying evidence to another commit needs an argument for why the change cannot affect it',
    );
  }
  if (input.analyzedBy === source.primaryOwner) {
    refuse('verifier_must_be_independent', 'the owner of the evidence cannot certify its own reuse');
  }
  if (source.status !== 'pass') {
    refuse('evidence_commit_mismatch', 'only a passing result can be carried forward');
  }

  const carried: EvidenceRecord = {
    ...source,
    id: state.nextId(),
    code: { ...source.code, commitSha: input.toCommitSha },
    provenance: {
      ...source.provenance,
      carriedFrom: source.id,
      carriedFromCommit: source.code.commitSha,
      impactAnalysis: input.impactAnalysis,
      analyzedBy: input.analyzedBy,
    },
    createdBy: actor.userId,
    createdAt: state.clock(),
  };
  state.records.push(carried);
  return carried;
}

export function listRecords(state: EvidenceState, actor: EvidenceActor): EvidenceRecord[] {
  return visibleTo(state, actor, state.records);
}

export function recordsForGate(
  state: EvidenceState,
  actor: EvidenceActor,
  gateKey: string,
  commitSha?: string,
): EvidenceRecord[] {
  const gate = requireGate(state, actor.universeId, gateKey);
  return listRecords(state, actor).filter(
    (record) => record.gateId === gate.id && (commitSha === undefined || record.code.commitSha === commitSha),
  );
}

// Section 52. The denials XIV can prove it performed, which is the half of
// security that a passing feature test never shows.
export function negativeEvidence(state: EvidenceState, actor: EvidenceActor): EvidenceRecord[] {
  return listRecords(state, actor).filter((record) => record.outcomeKind === 'negative');
}
