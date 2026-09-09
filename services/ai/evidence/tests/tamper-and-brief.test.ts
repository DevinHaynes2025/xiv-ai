import assert from 'node:assert/strict';
import test from 'node:test';
import { MANDATORY_GATES } from '../gates';
import { parseTestEvents } from '../collect';
import {
  COMMIT,
  actor,
  ci,
  cleanRlsProbes,
  expectDenied,
  expectOk,
  fullyEvidence,
  newLedger,
  passingSuite,
  refusalProbes,
} from './fixtures';

/**
 * Sections 34, 39, 58 and 61: whether the evidence has been altered, what the
 * CI package says about the commit, and what may honestly be told to the
 * founder.
 */

test('section 34: editing a stored record breaks the chain and is visible', () => {
  const ledger = newLedger();
  const first = fullyEvidence(ledger, {
    criterion: 'rls',
    payload: cleanRlsProbes(),
    owner: 'database_owner',
    verifier: 'security_reviewer',
  });
  fullyEvidence(ledger, {
    criterion: 'kill_switch',
    payload: refusalProbes(),
    owner: 'runtime_owner',
    verifier: 'security_reviewer',
  });
  assert.equal(ledger.verifyIntegrity().ok, true);

  // Someone quietly turns a failure into a pass after the fact.
  const stored = ledger.getEvidence(first.evidenceId)!;
  (stored as { actualResult: string }).actualResult = 'deny, definitely, trust me';

  const integrity = ledger.verifyIntegrity();
  assert.equal(integrity.ok, false);
  assert.equal(integrity.brokenAt, first.evidenceId);
  assert.match(integrity.reason!, /no longer match/);

  const audit = expectOk(ledger.audit(first.evidenceId), 'audit');
  assert.equal(audit.audit.hasTheEvidenceBeenAltered, true);
  assert.equal(ledger.freshnessOf(first.evidenceId), 'invalid');
  // A gate resting on altered evidence is blocked, not passed.
  assert.equal(ledger.gateState('rls'), 'BLOCKED');
  // The untouched record is unaffected.
  assert.equal(ledger.gateState('kill_switch'), 'PASS');
});

test('section 34: altered evidence cannot be independently verified', () => {
  const ledger = newLedger();
  const record = expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'rls',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'rls/isolation',
      testCase: 'policy matrix',
      testVersion: '1',
      expectedResult: 'deny',
      actualResult: 'deny',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'database_owner',
      payload: cleanRlsProbes(),
    }),
    'recordEvidence',
  ).record;

  const payload = ledger.getEvidence(record.evidenceId)!.payload as unknown as { probes: { actual: string }[] };
  payload.probes.push({ actual: 'allow' } as never);

  const denied = expectDenied(
    ledger.verifyEvidence(actor('security_reviewer', { roles: ['verifier'] }), {
      evidenceId: record.evidenceId,
      verdict: 'satisfies',
      note: 'looks fine',
    }),
    'verifying altered evidence',
  );
  assert.equal(denied.code, 'evidence_tampered');
});

test('section 39: the manifest reports skipped and missing release-critical gates', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'kill_switch',
    payload: refusalProbes(),
    owner: 'runtime_owner',
    verifier: 'security_reviewer',
  });
  expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'backup_restore',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'ops/backup-restore',
      testCase: 'restore drill',
      testVersion: '1',
      expectedResult: 'a restore drill runs',
      actualResult: 'no non-production restore target exists yet',
      status: 'skipped',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:00.000Z',
      primaryOwner: 'sre_owner',
      payload: {
        kind: 'backup_restore',
        backupIdentifier: 'none',
        sourceEnvironment: 'none',
        restoreEnvironment: 'none',
        startedAt: '2026-01-01T00:00:00.000Z',
        finishedAt: '2026-01-01T00:00:00.000Z',
        recordsExpected: 0,
        recordsRecovered: 0,
        integrityChecksPassed: false,
        rlsChecksPassed: false,
        applicationValidationPassed: false,
        measuredRpoSeconds: 0,
        measuredRtoSeconds: 0,
        usedProductionData: false,
      },
    }),
    'skipped backup evidence',
  );

  const manifest = ledger.manifest(COMMIT, 'ci');
  assert.equal(manifest.testsExecuted, 2);
  assert.equal(manifest.passes, 1);
  assert.equal(manifest.testsSkipped, 1);
  assert.deepEqual(manifest.skippedMandatoryGates, ['backup_restore']);
  assert.equal(manifest.missingMandatoryGates.length, MANDATORY_GATES.length - 2);
  assert.ok(manifest.missingMandatoryGates.includes('rls'));
  assert.equal(manifest.chainHead, ledger.listEvidence().at(-1)!.chainHash);
  assert.ok(manifest.entries.every((entry) => entry.location.includes(COMMIT.commitSha)));
});

test('section 39: evidence from another commit stays out of this commit package', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, { criterion: 'kill_switch', payload: refusalProbes(), owner: 'a', verifier: 'b' });
  expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'rls',
      commit: { ...COMMIT, commitSha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' },
      environment: 'ci',
      testSuite: 'rls/isolation',
      testCase: 'yesterday run',
      testVersion: '1',
      expectedResult: 'deny',
      actualResult: 'deny',
      status: 'pass',
      startedAt: '2025-12-31T00:00:00.000Z',
      completedAt: '2025-12-31T00:00:01.000Z',
      primaryOwner: 'database_owner',
      payload: cleanRlsProbes(),
    }),
    'older evidence',
  );

  const manifest = ledger.manifest(COMMIT, 'ci');
  assert.equal(manifest.testsExecuted, 1);
  assert.ok(manifest.missingMandatoryGates.includes('rls'));
});

test('section 58: a founder brief distinguishes verified, observed, unproven and blocked', () => {
  const ledger = newLedger();

  fullyEvidence(ledger, {
    criterion: 'kill_switch',
    payload: refusalProbes(),
    owner: 'runtime_owner',
    verifier: 'security_reviewer',
  });
  assert.equal(ledger.founderBriefStatus('kill_switch').status, 'VERIFIED');

  // Recorded but never independently reviewed.
  expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'compute_routing',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'runtime/router',
      testCase: 'placement',
      testVersion: '1',
      expectedResult: 'gpu placement',
      actualResult: 'gpu placement',
      status: 'pass',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'runtime_owner',
      payload: passingSuite({ passed: 1000, failed: 0, cases: [] }),
      reproducibleCommand: 'npm test --prefix services/ai',
    }),
    'unverified evidence',
  );
  assert.equal(ledger.founderBriefStatus('compute_routing').status, 'OBSERVED');

  // Nothing recorded at all.
  assert.equal(ledger.founderBriefStatus('ios').status, 'UNPROVEN');

  // Recorded and failed.
  expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'model_authorization',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'runtime/models',
      testCase: 'substitution',
      testVersion: '1',
      expectedResult: 'substitution detected',
      actualResult: 'substitution went through',
      status: 'fail',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      primaryOwner: 'ml_owner',
      payload: { kind: 'negative', probes: [] },
    }),
    'failed evidence',
  );
  assert.equal(ledger.founderBriefStatus('model_authorization').status, 'BLOCKED');
});

test('section 58: REPORTED can never be reported as VERIFIED', () => {
  const ledger = newLedger();
  expectOk(
    ledger.recordEvidence(ci, {
      criterion: 'ios',
      commit: COMMIT,
      environment: 'ci',
      testSuite: 'mobile/ios',
      testCase: 'device matrix',
      testVersion: '1',
      expectedResult: 'authorization boundaries hold on device',
      actualResult: 'no device lab is connected',
      status: 'unavailable',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:00.000Z',
      primaryOwner: 'mobile_owner',
      payload: {
        kind: 'mobile',
        platform: 'ios',
        osVersion: 'n/a',
        deviceClass: 'n/a',
        buildId: 'n/a',
        testSuite: 'none',
        passed: 0,
        failed: 0,
        crashes: 0,
        authenticationResult: 'fail',
        authorizationResult: 'fail',
        offlineResult: 'fail',
        syncResult: 'fail',
      },
    }),
    'unavailable mobile evidence',
  );

  const derived = ledger.founderBriefStatus('ios');
  assert.equal(derived.status, 'BLOCKED');

  const overclaim = expectDenied(
    ledger.claimStatus(actor('founder', { roles: ['approver'], authority: 'ceo' }), {
      criterion: 'ios',
      status: 'VERIFIED',
    }),
    'claiming VERIFIED without evidence',
  );
  assert.equal(overclaim.code, 'status_upgrade_forbidden');
  assert.match(overclaim.message, /is BLOCKED in the ledger/);

  // Reporting the honest status, or something weaker, is fine.
  expectOk(ledger.claimStatus(actor('founder'), { criterion: 'ios', status: 'BLOCKED' }), 'claiming BLOCKED');
  assert.equal(ledger.reportedStatus('ios'), 'BLOCKED');
});

test('section 61: every question has an answer drawn from the record', () => {
  const ledger = newLedger();
  const record = fullyEvidence(ledger, {
    criterion: 'backup_restore',
    owner: 'sre_owner',
    verifier: 'db_reviewer',
    payload: {
      kind: 'backup_restore',
      backupIdentifier: 'nightly-2026-01-01',
      sourceEnvironment: 'staging',
      restoreEnvironment: 'restore-drill',
      startedAt: '2026-01-01T02:00:00.000Z',
      finishedAt: '2026-01-01T02:41:00.000Z',
      recordsExpected: 128_400,
      recordsRecovered: 128_400,
      integrityChecksPassed: true,
      rlsChecksPassed: true,
      applicationValidationPassed: true,
      measuredRpoSeconds: 900,
      measuredRtoSeconds: 2_460,
      usedProductionData: false,
    },
  });

  const { audit } = expectOk(ledger.audit(record.evidenceId), 'audit');
  assert.equal(audit.whereWasItTested, 'ci');
  assert.equal(audit.whoExecutedIt, 'ci:github:1');
  assert.equal(audit.whoOwnsRemediation, 'sre_owner');
  assert.equal(audit.whoIndependentlyVerifiedIt, 'db_reviewer');
  assert.equal(audit.isTheEvidenceFresh, 'valid');
  assert.equal(audit.hasTheEvidenceBeenAltered, false);
  assert.equal(audit.didAHumanApprovalBecomeNecessary, true);
  assert.match(audit.whereIsTheEvidence, /backup-restore/);
  assert.equal(ledger.gateState('backup_restore'), 'PASS');
});

test('section 49: a restore drill run against production data fails its gate', () => {
  const ledger = newLedger();
  fullyEvidence(ledger, {
    criterion: 'backup_restore',
    owner: 'sre_owner',
    verifier: 'db_reviewer',
    payload: {
      kind: 'backup_restore',
      backupIdentifier: 'nightly-2026-01-01',
      sourceEnvironment: 'production',
      restoreEnvironment: 'production',
      startedAt: '2026-01-01T02:00:00.000Z',
      finishedAt: '2026-01-01T02:41:00.000Z',
      recordsExpected: 128_400,
      recordsRecovered: 128_400,
      integrityChecksPassed: true,
      rlsChecksPassed: true,
      applicationValidationPassed: true,
      measuredRpoSeconds: 900,
      measuredRtoSeconds: 2_460,
      usedProductionData: true,
    },
  });
  assert.equal(ledger.gateState('backup_restore'), 'EVIDENCE_PENDING');
});

test('section 39: the collector reads the test event stream rather than a summary line', () => {
  const lanesFile = '/repo/runtime/tests/hardware-lanes.test.ts';
  const stdout = [
    JSON.stringify({
      type: 'test:pass',
      data: { name: 'proves the intel lane', file: lanesFile, nesting: 1, details: { duration_ms: 3.2 } },
    }),
    JSON.stringify({
      type: 'test:fail',
      data: { name: 'proves the amd lane', file: lanesFile, nesting: 1, details: { duration_ms: 2 } },
    }),
    JSON.stringify({
      type: 'test:pass',
      data: { name: 'XHAL hardware lanes', file: lanesFile, nesting: 0, details: { duration_ms: 6, type: 'suite' } },
    }),
    JSON.stringify({
      type: 'test:pass',
      data: {
        name: 'skipped for now',
        file: '/repo/runtime/tests/mobile.test.ts',
        nesting: 1,
        skip: true,
        details: { duration_ms: 0 },
      },
    }),
    'not json at all',
  ].join('\n');

  const bySuite = parseTestEvents(stdout);
  const lanes = bySuite.get('hardware-lanes.test.ts')!;
  assert.equal(lanes.length, 2, 'the enclosing suite is not counted alongside its cases');
  assert.deepEqual(
    lanes.map((entry) => entry.status),
    ['pass', 'fail'],
  );
  assert.equal(bySuite.get('mobile.test.ts')![0]!.status, 'skip');
});
