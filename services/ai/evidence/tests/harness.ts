import { isGovernanceError } from '../../civilization/errors';
import { createEvidenceLedger, type EvidenceLedger } from '../evidence';
import type { RecordEvidenceInput } from '../records';
import type { CodeIdentity, EvidenceActor } from '../types';

// A small world with four distinct hands, because section 36 cannot be tested
// with fewer. If owner, verifier and approver were the same person the tests
// would pass while proving the opposite of what they claim.

export const COMMIT = 'c0ffee1234567890abcdef1234567890abcdef12';
export const OTHER_COMMIT = 'ba5eba11deadbeefba5eba11deadbeefba5eba11';

export const CODE: CodeIdentity = {
  repository: 'xiv',
  branch: 'main',
  commitSha: COMMIT,
  buildId: 'build-1',
  migrationHash: 'migration-hash-1',
  dependencyLockHash: 'lock-hash-1',
};

export type EvidenceWorld = {
  xiv: EvidenceLedger;
  owner: EvidenceActor;
  verifier: EvidenceActor;
  approver: EvidenceActor;
  outsider: EvidenceActor;
  advance: (ms: number) => void;
};

export function evidenceWorld(): EvidenceWorld {
  const universeId = 'universe-a';
  const members = new Map<string, boolean>([
    ['owner', true],
    ['verifier', true],
    ['approver', true],
  ]);

  let clock = Date.parse('2026-09-09T09:00:00.000Z');

  const xiv = createEvidenceLedger({
    isMember: (universe, user) => universe === universeId && members.has(user),
    isSupervisor: (universe, user) => universe === universeId && members.get(user) === true,
    organizationOf: () => 'org-a',
    now: () => new Date(clock),
  });

  const owner: EvidenceActor = { universeId, userId: 'owner' };
  xiv.seedOwnershipMatrix(owner);

  return {
    xiv,
    owner,
    verifier: { universeId, userId: 'verifier' },
    approver: { universeId, userId: 'approver' },
    outsider: { universeId: 'universe-b', userId: 'outsider' },
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

// Asserting on the refusal code rather than the message, because the message is
// prose for a person and the code is the contract.
export function refusalCode(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    if (isGovernanceError(error)) return error.code;
    throw error;
  }
  throw new Error('expected a refusal but the call succeeded');
}

// A well-formed E3 artifact, so each test only has to vary the one thing it is
// actually about.
export function passingEvidence(overrides: Partial<RecordEvidenceInput> = {}): RecordEvidenceInput {
  return {
    gateKey: 'rls',
    testRunId: 'run-1',
    code: CODE,
    environment: 'local-postgres',
    testSuite: 'rls-matrix',
    testCase: 'agent_registry :: SELECT ORG_A -> ORG_B',
    expectedResult: 'DENY',
    actualResult: 'DENY (0 rows)',
    status: 'pass',
    outcomeKind: 'negative',
    claimedLevel: 'E3',
    executorType: 'database',
    executorId: 'postgresql-16',
    evidenceLocation: 'xiv-evidence/rls/matrix.jsonl',
    evidenceContent: '{"result":"DENY"}',
    reproductionCommand: './supabase/tests/run-local.sh',
    primaryOwner: 'owner',
    ...overrides,
  };
}
