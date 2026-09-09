import type {
  CommitBinding,
  EvidenceLevel,
  EvidencePayload,
  EvidenceStatus,
  ExecutorType,
  VerificationRecord,
} from './types';

/**
 * Section 35. Evidence strength is assessed, never declared. A caller cannot
 * hand the ledger an `E4` and have it believed; the ledger derives the level
 * from what the record actually contains, and re-derives it when a verification
 * arrives.
 *
 *   E0 claim                     no artifact
 *   E1 manual observation        a human looked at it
 *   E2 automated test result     a suite ran, bound to an exact revision
 *   E3 system-generated          machine-produced, hashed, from CI or a scanner
 *   E4 independently verified    E3 plus a reviewer who is not the owner and no
 *                                unresolved blocker
 */

const SYSTEM_EXECUTORS: readonly ExecutorType[] = ['ci', 'runtime', 'scanner'];

/** Categories that are inherently machine-generated rather than observational. */
const SYSTEM_CATEGORIES: readonly EvidencePayload['kind'][] = [
  'rls',
  'agent_security',
  'runtime',
  'performance',
  'cost',
  'model_evaluation',
  'agent_evaluation',
  'secret_scan',
  'dependency',
  'lineage',
  'negative',
  'test_suite',
  'backup_restore',
  'rollback',
];

export type LevelInput = {
  commit: CommitBinding;
  executorType: ExecutorType;
  artifactHash: string | null;
  evidenceLocation: string | null;
  payload: EvidencePayload;
  status: EvidenceStatus;
  reproducibleCommand: string | null;
  verification: VerificationRecord | null;
  primaryOwner: string;
  unresolvedBlockers: number;
};

export function hasCommitBinding(commit: CommitBinding): boolean {
  return Boolean(commit.repository && commit.branch && commit.commitSha);
}

export function assessLevel(input: LevelInput): EvidenceLevel {
  const hasArtifact = Boolean(input.artifactHash && input.evidenceLocation);
  if (!hasArtifact) return 'E0';

  if (!hasCommitBinding(input.commit)) return 'E1';

  const machineProduced =
    SYSTEM_EXECUTORS.includes(input.executorType) && SYSTEM_CATEGORIES.includes(input.payload.kind);
  if (!machineProduced) return 'E2';

  const independentlyVerified =
    input.verification !== null &&
    input.verification.verdict === 'satisfies' &&
    input.verification.verifierId !== input.primaryOwner;

  const releaseReady =
    independentlyVerified &&
    Boolean(input.reproducibleCommand) &&
    input.status === 'pass' &&
    input.unresolvedBlockers === 0;

  return releaseReady ? 'E4' : 'E3';
}

/** Section 35: a claim can never satisfy an acceptance criterion. */
export function canSatisfyCriterion(level: EvidenceLevel): boolean {
  return level !== 'E0';
}
