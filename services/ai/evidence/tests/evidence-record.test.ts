import assert from 'node:assert/strict';
import test from 'node:test';
import { COMMIT, ci, cleanRlsProbes, expectDenied, expectOk, newLedger, passingSuite, actor } from './fixtures';

/**
 * Sections 34, 35, 38 and 61: what an evidence record has to contain before it
 * counts as evidence at all.
 */

test('section 34: a record answers where the artifact is and whether it has been altered', () => {
  const ledger = newLedger();
  const { record } = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'rls',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'rls/isolation',
      testCase: 'cross-tenant select returns zero rows',
      testVersion: '3',
      expectedResult: 'deny',
      actualResult: 'deny',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:02.500Z',
      primaryOwner: 'database_owner',
      payload: cleanRlsProbes(),
      reproducibleCommand: 'npm run test:rls',
    }),
    'recordEvidence',
  );

  assert.equal(record.durationMs, 2500);
  assert.match(record.evidenceLocation, /^xiv-evidence\/1f0c9d2ab34e5f6708192a3b4c5d6e7f80912a3b\/rls\/evd_/);
  assert.ok(record.artifactHash.startsWith('sha256:'));
  assert.equal(record.previousHash, null);

  const audit = expectOk(ledger.audit(record.evidenceId), 'audit');
  assert.equal(audit.audit.hasTheEvidenceBeenAltered, false);
  assert.equal(audit.audit.whoOwnsRemediation, 'database_owner');
  assert.equal(audit.audit.againstWhichCommit, `${COMMIT.repository}@main#${COMMIT.commitSha}`);
  assert.equal(audit.audit.whoIndependentlyVerifiedIt, null);
});

test('section 38: evidence with no exact commit is refused', () => {
  const ledger = newLedger();
  const denied = expectDenied(
    ledger.recordEvidence(ci, {
      criterion: 'rls',
      commit: { ...COMMIT, commitSha: '' },
      environment: 'ci',
      testSuite: 'rls/isolation',
      testCase: 'cross-tenant select',
      testVersion: '3',
      expectedResult: 'deny',
      actualResult: 'deny',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'database_owner',
      payload: cleanRlsProbes(),
    }),
    'recordEvidence without a commit',
  );
  assert.equal(denied.code, 'commit_binding_missing');
});

test('section 35: strength is derived from the record, not declared by its author', () => {
  const ledger = newLedger();

  // A human observation of a machine-readable artifact tops out at E2: it is
  // bound to a commit, but nothing about it is independently reproducible.
  const observed = expectOk(
    ledger.recordEvidence(actor('qa_engineer', { actorType: 'human' }), {
      criterion: 'compute_routing',
      commit: COMMIT,
      environment: 'staging',
      testSuite: 'manual/routing',
      testCase: 'watched the router pick the GPU host',
      testVersion: '1',
      expectedResult: 'gpu placement',
      actualResult: 'gpu placement',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:01:00.000Z',
      primaryOwner: 'runtime_owner',
      payload: passingSuite(),
    }),
    'manual evidence',
  );
  assert.equal(observed.record.level, 'E2');

  // The same criterion produced by CI reaches E3, and only independent
  // verification takes it to E4.
  const generated = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'compute_routing',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'runtime/tests/definition-of-done.test.ts',
      testCase: 'router selects the GPU host',
      testVersion: '1',
      expectedResult: 'gpu placement',
      actualResult: 'gpu placement',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'runtime_owner',
      payload: passingSuite(),
      reproducibleCommand: 'npm test --prefix services/ai',
    }),
    'ci evidence',
  );
  assert.equal(generated.record.level, 'E3');

  const verified = expectOk(
    ledger.verifyEvidence(actor('qa_verifier', { roles: ['verifier'] }), {
      evidenceId: generated.record.evidenceId,
      verdict: 'satisfies',
      note: 'reran it',
    }),
    'verifyEvidence',
  );
  assert.equal(verified.level, 'E4');
});

test('section 35: an artifact-free claim is E0 and cannot satisfy a criterion', () => {
  const ledger = newLedger();
  const { record } = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'cost_governance',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'cost/telemetry',
      testCase: 'cost is tracked',
      testVersion: '1',
      expectedResult: 'cost recorded',
      actualResult: 'not run',
      status: 'unavailable',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:00.000Z',
      primaryOwner: 'finops_owner',
      payload: { kind: 'cost', workloadCount: 0, agentCount: 0, activeAgentCount: 0, modelCalls: 0, tokens: 0, cpuMillis: 0, gpuMillis: 0, storageMb: 0, networkMb: 0, estimatedCostUsd: 0, attributableCostUsd: null, costPerTaskUsd: 0, costPerSuccessfulTaskUsd: null },
    }),
    'unavailable evidence',
  );

  // Every record carries an artifact hash, so an empty run is E3-shaped but
  // still cannot pass its gate: the gate state, not the level, carries that.
  assert.equal(ledger.gateState('cost_governance'), 'BLOCKED');
  assert.equal(record.status, 'unavailable');
});

test('section 34: a secret in a payload is refused rather than quietly scrubbed', () => {
  const ledger = newLedger();
  const denied = expectDenied(
    ledger.recordEvidence(ci, {
      criterion: 'secret_scanning',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'security/secrets',
      testCase: 'repository scan',
      testVersion: '1',
      expectedResult: 'no findings',
      actualResult: 'one finding',
      status: 'fail',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:03.000Z',
      primaryOwner: 'security_owner',
      payload: {
        kind: 'secret_scan',
        scanner: 'gitleaks',
        scannerVersion: '8.0.0',
        scope: 'repository',
        filesScanned: 900,
        findingsBySeverity: { critical: 1, high: 0, medium: 0, low: 0 },
        findings: [
          {
            credentialType: 'gemini api key',
            // Section 47: the value must never travel with the finding.
            locationCategory: 'services/ai/.env (AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q)',
            severity: 'critical',
            remediationState: 'open',
          },
        ],
        suppressedFindings: 0,
        suppressionReason: null,
      },
    }),
    'evidence carrying a credential',
  );

  assert.equal(denied.code, 'evidence_contains_secret');
  assert.match(denied.message, /secret_value_shape/);
});

test('section 34: later evidence for the same case supersedes the earlier record', () => {
  const ledger = newLedger();
  const first = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'kill_switch',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'runtime/tests/kill-switch.test.ts',
      testCase: 'quarantine terminates running work',
      testVersion: '1',
      expectedResult: 'terminated',
      actualResult: 'still running',
      status: 'fail',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'runtime_owner',
      payload: { kind: 'negative', probes: [] },
    }),
    'first attempt',
  );

  const second = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'kill_switch',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'runtime/tests/kill-switch.test.ts',
      testCase: 'quarantine terminates running work',
      testVersion: '2',
      expectedResult: 'terminated',
      actualResult: 'terminated',
      status: 'pass',
      startedAt: '2026-01-01T00:00:02.000Z',
      completedAt: '2026-01-01T00:00:03.000Z',
      primaryOwner: 'runtime_owner',
      payload: {
        kind: 'negative',
        probes: [
          {
            scenario: 'operator quarantines a busy node',
            attempted: 'quarantineRuntime',
            expected: 'terminated',
            actual: 'terminated',
            denialCode: null,
          },
        ],
      },
    }),
    'retest',
  );

  assert.equal(ledger.getEvidence(first.record.evidenceId)?.supersededBy, second.record.evidenceId);
  assert.equal(ledger.getEvidence(first.record.evidenceId)?.freshness, 'superseded');
  assert.deepEqual(
    ledger.currentEvidence('kill_switch').map((entry) => entry.evidenceId),
    [second.record.evidenceId],
  );
  // The superseded failure no longer holds the gate down, but it is still in
  // the ledger and still in the chain.
  assert.equal(ledger.listEvidence('kill_switch').length, 2);
});
