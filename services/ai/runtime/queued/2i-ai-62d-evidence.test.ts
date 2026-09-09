/**
 * 2I-AI-62D §§33-61 evidence, verification and ownership contracts.
 * Deterministic. No network. Holds the evidence model to its own standard by
 * classifying the series' existing claims rather than only future ones.
 */
import assert from 'node:assert/strict';

import {
  BRIEF_STATUSES,
  EVIDENCE_FORBIDDEN_CONTENT,
  EVIDENCE_LEDGER,
  EVIDENCE_LEVELS,
  EVIDENCE_PACKAGE_DIRS,
  EVIDENCE_PROGRESSION,
  EVIDENCE_RECORD_FIELDS,
  EVIDENCE_ROLES,
  E4_REQUIREMENTS,
  EXACT_COMMIT_FIELDS,
  FORBIDDEN_BRIEF_PROMOTION,
  FRESHNESS_STATES,
  GATE_OWNERSHIP,
  HUMAN_ONLY_DECISIONS,
  LEVEL_CANNOT_SATISFY_ANY_CRITERION,
  LEVEL_MINIMUM_FOR_RELEASE_GATE,
  LEVEL_REQUIRED_FOR_CRITICAL_GATE,
  NON_WAIVABLE_BLOCKERS,
  OWNERSHIP_STATES,
  REQUIRED_NEGATIVE_EVIDENCE,
  REVALIDATION_TRIGGERS,
  RLS_REQUIRED_OPERATIONS,
  RLS_REQUIRED_SCENARIOS,
  RLS_TABLES_ALTERED,
  RLS_TABLES_BEHAVIOURALLY_TESTED,
  ROLES_REQUIRING_SEPARATION,
  SKIPPED_MANDATORY_TEST_COUNTS_AS_PASS,
  STATE_FORBIDDEN_AT_CANARY,
  STORY_ID,
  automationCanApprove,
  canPromoteBriefStatus,
  claimsAtOrAboveLevel,
  evidenceTransfers,
  exceptionCanWaive,
  gatesRequiringIndependentVerification,
  roleSeparationSatisfied,
  satisfiesGate,
  selfVerifyingGates,
  uncoveredRlsOperations,
  uncoveredRlsScenarios,
  unassignedGates,
  verifiedClaims,
} from './2i-ai-62d-evidence';

function check(name: string, fn: () => void): void {
  fn();
  console.log(`  ok  ${name}`);
}

console.log(`${STORY_ID} §§33-61 evidence and ownership contracts`);

check('§33 progression never skips a step', () => {
  assert.equal(EVIDENCE_PROGRESSION.length, 7);
  assert.equal(EVIDENCE_PROGRESSION[0], 'DOCUMENTED');
  assert.equal(EVIDENCE_PROGRESSION.at(-1), 'STAGING_CANARY_CANDIDATE');
  const verified = EVIDENCE_PROGRESSION.indexOf('INDEPENDENTLY_VERIFIED');
  const passed = EVIDENCE_PROGRESSION.indexOf('GATE_PASSED');
  assert.ok(verified < passed, 'verification precedes the gate');
});

check('§34 evidence record carries all 33 fields and excludes secrets', () => {
  assert.equal(EVIDENCE_RECORD_FIELDS.length, 33);
  for (const f of ['commit_sha', 'evidence_hash', 'primary_owner', 'reviewer', 'expires_at']) {
    assert.ok(EVIDENCE_RECORD_FIELDS.includes(f as never), `${f} required`);
  }
  assert.ok(EVIDENCE_FORBIDDEN_CONTENT.includes('SECRETS'));
  assert.ok(EVIDENCE_FORBIDDEN_CONTENT.includes('AUTH_TOKENS'));
});

check('§35 levels are ordered and E0 satisfies nothing', () => {
  assert.deepEqual([...EVIDENCE_LEVELS], ['E0', 'E1', 'E2', 'E3', 'E4']);
  assert.equal(LEVEL_CANNOT_SATISFY_ANY_CRITERION, 'E0');
  assert.equal(satisfiesGate('E0', 'E3'), false);
  assert.equal(satisfiesGate('E1', 'E3'), false);
  assert.equal(satisfiesGate('E2', 'E3'), false);
  assert.equal(satisfiesGate('E3', 'E3'), true);
  assert.equal(satisfiesGate('E3', 'E4'), false);
  assert.equal(satisfiesGate('E4', 'E4'), true);
  assert.equal(LEVEL_MINIMUM_FOR_RELEASE_GATE, 'E3');
  assert.equal(LEVEL_REQUIRED_FOR_CRITICAL_GATE, 'E4');
});

check('§35 E4 needs all five properties including an independent reviewer', () => {
  assert.equal(E4_REQUIREMENTS.length, 5);
  assert.ok(E4_REQUIREMENTS.includes('INDEPENDENT_REVIEWER'));
  assert.ok(E4_REQUIREMENTS.includes('EXACT_COMMIT'));
});

check('§36 one actor cannot own, verify and approve a critical gate', () => {
  assert.equal(EVIDENCE_ROLES.length, 4);
  assert.deepEqual([...ROLES_REQUIRING_SEPARATION], ['OWNER', 'VERIFIER', 'APPROVER']);
  assert.equal(roleSeparationSatisfied({ owner: 'a', verifier: 'a', approver: 'a' }), false);
  assert.equal(roleSeparationSatisfied({ owner: 'a', verifier: 'a', approver: 'b' }), false);
  assert.equal(roleSeparationSatisfied({ owner: 'a', verifier: 'b', approver: 'c' }), true);
});

check('§37 all 26 gates are mapped, and every one is still UNASSIGNED', () => {
  assert.equal(Object.keys(GATE_OWNERSHIP).length, 26);
  assert.equal(unassignedGates().length, 26);
  assert.equal(STATE_FORBIDDEN_AT_CANARY, 'UNASSIGNED');
});

check('§37 secret scanning is the one gate that verifies itself', () => {
  // Allowed by §37's small-team note, but it is the weakest independence in
  // the matrix and §36 pushes the other way, so it stays visible.
  assert.deepEqual(selfVerifyingGates(), ['secret_scanning']);
  assert.equal(GATE_OWNERSHIP.secret_scanning.owner, GATE_OWNERSHIP.secret_scanning.verifier);
});

check('§37 the isolation and recovery gates demand E4', () => {
  const e4 = gatesRequiringIndependentVerification();
  for (const g of ['rls', 'tenant_isolation', 'universe_isolation', 'kill_switch', 'provenance', 'backup_restore', 'rollback', 'canary_promotion']) {
    assert.ok(e4.includes(g), `${g} must require E4`);
  }
});

check('§56 eleven ownership states exist', () => {
  assert.equal(OWNERSHIP_STATES.length, 11);
  for (const s of ['EVIDENCE_PENDING', 'VERIFICATION_PENDING', 'EXCEPTION_APPROVED', 'STALE']) {
    assert.ok(OWNERSHIP_STATES.includes(s as never));
  }
});

check('§38 evidence for one commit does not transfer by default', () => {
  assert.deepEqual([...EXACT_COMMIT_FIELDS], ['repository', 'branch', 'commit_sha']);
  assert.equal(evidenceTransfers(false, false), false);
  assert.equal(evidenceTransfers(true, false), true);
  // Transfer is allowed only when impact analysis proves the change cannot matter.
  assert.equal(evidenceTransfers(false, true), true);
});

check('§39 package has all 18 directories and skips stay visible', () => {
  assert.equal(EVIDENCE_PACKAGE_DIRS.length, 18);
  assert.ok(EVIDENCE_PACKAGE_DIRS.includes('rls'));
  assert.ok(EVIDENCE_PACKAGE_DIRS.includes('tenant-isolation'));
  assert.equal(SKIPPED_MANDATORY_TEST_COUNTS_AS_PASS, false);
});

check('§40 the required RLS matrix is five scenarios by seven operations', () => {
  assert.equal(RLS_REQUIRED_SCENARIOS.length, 5);
  assert.equal(RLS_REQUIRED_OPERATIONS.length, 7);
});

check('§40 current RLS evidence is honestly incomplete', () => {
  // Only the A->B direction, SELECT and INSERT, on one of eighteen tables.
  assert.deepEqual(uncoveredRlsScenarios(), [
    'ORG_B_TO_ORG_A_DENY',
    'REVOKED_USER_DENY',
    'UNAUTHENTICATED_DENY',
  ]);
  assert.deepEqual(uncoveredRlsOperations(), [
    'DELETE',
    'RPC',
    'SERVICE_INTERFACE',
    'STORAGE',
    'UPDATE',
  ]);
  assert.equal(RLS_TABLES_ALTERED, 18);
  assert.equal(RLS_TABLES_BEHAVIOURALLY_TESTED, 1);
  assert.ok(RLS_TABLES_BEHAVIOURALLY_TESTED < RLS_TABLES_ALTERED);
});

check('§52 negative evidence is required for all six refusals', () => {
  assert.equal(REQUIRED_NEGATIVE_EVIDENCE.length, 6);
  assert.ok(REQUIRED_NEGATIVE_EVIDENCE.includes('CROSS_TENANT_READ_DENIED'));
  assert.ok(REQUIRED_NEGATIVE_EVIDENCE.includes('BUDGET_EXCEEDED_TERMINATED'));
});

check('§54 exceptions cannot waive the five hard blockers', () => {
  assert.equal(NON_WAIVABLE_BLOCKERS.length, 5);
  for (const b of NON_WAIVABLE_BLOCKERS) {
    assert.equal(exceptionCanWaive(b), false, `${b} must not be waivable`);
  }
  assert.equal(exceptionCanWaive('FLAKY_UI_TEST'), true);
});

check('§55 freshness is recalculated, not assumed', () => {
  assert.deepEqual([...FRESHNESS_STATES], ['VALID', 'STALE', 'SUPERSEDED', 'INVALID']);
  assert.equal(REVALIDATION_TRIGGERS.length, 9);
  assert.ok(REVALIDATION_TRIGGERS.includes('RLS_POLICY_CHANGE'));
  assert.ok(REVALIDATION_TRIGGERS.includes('SCHEMA_CHANGE'));
});

check('§58 REPORTED never becomes VERIFIED without evidence', () => {
  assert.equal(BRIEF_STATUSES.length, 6);
  assert.equal(FORBIDDEN_BRIEF_PROMOTION.from, 'REPORTED');
  assert.equal(FORBIDDEN_BRIEF_PROMOTION.to, 'VERIFIED');
  assert.equal(canPromoteBriefStatus('REPORTED', 'VERIFIED', false), false);
  assert.equal(canPromoteBriefStatus('REPORTED', 'VERIFIED', true), true);
  assert.equal(canPromoteBriefStatus('OBSERVED', 'UNPROVEN', false), true);
});

check('§59/§60 automation prepares but never approves', () => {
  assert.equal(HUMAN_ONLY_DECISIONS.length, 8);
  assert.ok(HUMAN_ONLY_DECISIONS.includes('L4_AUTONOMY_CHANGE'));
  assert.ok(HUMAN_ONLY_DECISIONS.includes('PRODUCTION_DEPLOYMENT'));
  assert.equal(automationCanApprove(), false);
});

check('the series has produced no VERIFIED and no E3+ evidence', () => {
  assert.ok(EVIDENCE_LEDGER.length > 0);
  assert.deepEqual(verifiedClaims(), []);
  assert.deepEqual(claimsAtOrAboveLevel('E3'), []);
  // Nothing has an independent reviewer, so nothing can reach E4.
  for (const e of EVIDENCE_LEDGER) {
    assert.equal(e.independentlyVerified, false, `${e.claim} claims independent verification`);
    assert.equal(satisfiesGate(e.level, 'E4'), false);
  }
});

check('every ledger entry is commit-scoped and carries a stated limitation', () => {
  for (const e of EVIDENCE_LEDGER) {
    assert.equal(e.commitScoped, true, `${e.claim} must name the code under test`);
    assert.ok(e.note.length > 0, `${e.claim} needs its limitation stated`);
  }
});

check("the landed 62B database claim is REPORTED, not OBSERVED", () => {
  const entry = EVIDENCE_LEDGER.find((e) => e.claim.includes('62B meeting engine'));
  assert.ok(entry);
  assert.equal(entry.level, 'E1');
  assert.equal(entry.briefStatus, 'REPORTED');
});

console.log(`${STORY_ID}: all evidence and ownership contracts hold`);
