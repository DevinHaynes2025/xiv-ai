import { GATES } from '../gates';
import { EvidenceLedger } from '../ledger';
import type {
  CommitBinding,
  EvidenceActor,
  EvidenceDenied,
  EvidenceResult,
  EvidenceRole,
  ExecutorType,
  NegativePayload,
  RlsEvidencePayload,
  TestSuitePayload,
} from '../types';

export const PLATFORM = { organizationId: 'xiv_platform', universeId: 'engineering' };

export function newLedger(): EvidenceLedger {
  let tick = 0;
  let sequence = 0;
  return new EvidenceLedger({
    now: () => new Date(Date.UTC(2026, 0, 1) + tick++ * 1000),
    newId: (prefix) => `${prefix}_${String(++sequence).padStart(4, '0')}`,
  });
}

type ActorOptions = {
  roles?: readonly EvidenceRole[];
  actorType?: ExecutorType;
  authority?: EvidenceActor['authority'];
  scope?: EvidenceActor['scope'];
};

export function actor(actorId: string, options: ActorOptions = {}): EvidenceActor {
  return {
    actorId,
    actorType: options.actorType ?? 'human',
    roles: options.roles ?? ['owner'],
    scope: options.scope ?? PLATFORM,
    authority: options.authority,
  };
}

export const ci = actor('github:1', { actorType: 'ci', roles: ['owner'] });
export const guardian = actor('guardian', { roles: ['guardian', 'approver'] });

export const COMMIT: CommitBinding = {
  repository: 'git@github.com:xiv/xiv.git',
  branch: 'main',
  commitSha: '1f0c9d2ab34e5f6708192a3b4c5d6e7f80912a3b',
  buildId: 'build_1',
  runtimeVersion: '62d.0.0',
  policyVersion: '62d-security-lock',
};

export function expectOk<T>(result: EvidenceResult<T>, label: string): { ok: true } & T {
  if (!result.ok) throw new Error(`${label} was denied: ${result.code} — ${result.message}`);
  return result;
}

export function expectDenied<T>(result: EvidenceResult<T>, label: string): EvidenceDenied {
  if (result.ok) throw new Error(`${label} unexpectedly succeeded`);
  return result;
}

export function passingSuite(overrides: Partial<TestSuitePayload> = {}): TestSuitePayload {
  return {
    kind: 'test_suite',
    runner: 'node:test',
    passed: 12,
    failed: 0,
    skipped: 0,
    cases: [{ name: 'bounded workload executes on an authorized node', status: 'pass', durationMs: 4 }],
    ...overrides,
  };
}

export function cleanRlsProbes(): RlsEvidencePayload {
  return {
    kind: 'rls',
    probes: [
      {
        table: 'xiv_compute_workloads',
        testIdentity: 'member_of_org_alpha',
        identityState: 'authenticated',
        operation: 'select',
        sourceTenant: 'org_alpha',
        targetTenant: 'org_beta',
        expected: 'deny',
        actual: 'deny',
        rowsReturned: 0,
      },
      {
        table: 'xiv_compute_workloads',
        testIdentity: 'member_of_org_alpha',
        identityState: 'authenticated',
        operation: 'select',
        sourceTenant: 'org_alpha',
        targetTenant: 'org_alpha',
        expected: 'allow',
        actual: 'allow',
        rowsReturned: 3,
      },
    ],
  };
}

export function refusalProbes(): NegativePayload {
  return {
    kind: 'negative',
    probes: [
      {
        scenario: 'unregistered node presents a proof',
        attempted: 'attestRuntime',
        expected: 'denied',
        actual: 'denied',
        denialCode: 'runtime_identity_unknown',
      },
    ],
  };
}

/**
 * Records a piece of evidence, has an independent reviewer verify it and, where
 * the gate demands it, has a human approve it. Most tests care about the state
 * a gate reaches rather than the three calls it took to get there.
 */
export function fullyEvidence(
  ledger: EvidenceLedger,
  input: {
    criterion: Parameters<EvidenceLedger['recordEvidence']>[1]['criterion'];
    payload: Parameters<EvidenceLedger['recordEvidence']>[1]['payload'];
    owner?: string;
    verifier?: string;
    approver?: EvidenceActor | null;
    status?: Parameters<EvidenceLedger['recordEvidence']>[1]['status'];
    reproducibleCommand?: string | null;
    testCase?: string;
  },
) {
  const owner = input.owner ?? 'platform_owner';
  const verifier = input.verifier ?? 'security_reviewer';
  // Distinct by payload kind so a gate requiring several categories does not
  // have each new record supersede the last.
  const testCase = input.testCase ?? `${input.criterion}-${input.payload.kind}`;

  const recorded = expectOk(
    ledger.recordEvidence(ci, {
      criterion: input.criterion,
      commit: COMMIT,
      environment: 'ci',
      testSuite: `suite/${input.criterion}`,
      testCase,
      testVersion: '1',
      expectedResult: 'the criterion holds',
      actualResult: 'the criterion held',
      status: input.status ?? 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:04.000Z',
      primaryOwner: owner,
      payload: input.payload,
      reproducibleCommand:
        input.reproducibleCommand === undefined ? `npm test --prefix services/ai` : input.reproducibleCommand,
    }),
    `recordEvidence(${input.criterion})`,
  );

  expectOk(
    ledger.verifyEvidence(actor(verifier, { roles: ['verifier'] }), {
      evidenceId: recorded.record.evidenceId,
      verdict: 'satisfies',
      note: 'reran the suite against the same commit',
    }),
    `verifyEvidence(${input.criterion})`,
  );

  const rule = GATES[input.criterion].humanApproval;
  if (input.approver !== null && (rule === 'required' || rule === 'named_human')) {
    const approver = input.approver ?? actor('release_manager', { roles: ['approver'], authority: 'release_manager' });
    expectOk(
      ledger.approveGate(approver, {
        gateId: input.criterion,
        evidenceId: recorded.record.evidenceId,
        decision: 'approved',
        note: 'reviewed the package',
      }),
      `approveGate(${input.criterion})`,
    );
  }

  return recorded.record;
}
