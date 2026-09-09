/**
 * Compose authenticated runtime isolation + human-verified hosted catalog.
 * Neither source alone can activate tenant persistence.
 */
import {
  evaluateTenantActivation,
  recordIsolationProvenance,
  recordTenantActivationProofs,
} from './activation-gate';

export type IsolationRunAssertion = {
  testName: string;
  result: 'PASS' | 'FAIL';
  timestamp: string;
};

export type IsolationRunSnapshot = {
  isolation: 'PASS' | 'FAIL';
  assertions: IsolationRunAssertion[];
  identities: {
    userAId: string | null;
    userBId: string | null;
    orgAId: string | null;
    orgBId: string | null;
    universeAId: string | null;
    universeBId: string | null;
  };
  roleVersion: {
    before: number | null;
    after: number | null;
    incremented: boolean;
    staleContextDenied: boolean;
  };
  reason: string;
};

function passed(assertions: IsolationRunAssertion[], name: string) {
  return assertions.find((row) => row.testName === name)?.result === 'PASS';
}

function groupPass(assertions: IsolationRunAssertion[], prefix: string) {
  const rows = assertions.filter((row) => row.testName.startsWith(prefix));
  return rows.length > 0 && rows.every((row) => row.result === 'PASS');
}

export function applyHostedIsolationRun(run: IsolationRunSnapshot) {
  const recordedAt = new Date().toISOString();
  const allAssertionsPass =
    run.assertions.length > 0 && run.assertions.every((row) => row.result === 'PASS');
  const isolationOk = run.isolation === 'PASS' && allAssertionsPass;
  const bootstrapPassed = passed(run.assertions, 'bootstrap.userA') && passed(run.assertions, 'bootstrap.userB');
  const crossOrg = passed(run.assertions, 'cross.org.A-reads-B') && passed(run.assertions, 'cross.org.B-reads-A');
  const crossUniverse =
    passed(run.assertions, 'cross.universe.A-reads-B') && passed(run.assertions, 'cross.universe.B-reads-A');
  const freshnessPassed =
    passed(run.assertions, 'freshness.staleAuthorizationDenied') &&
    passed(run.assertions, 'freshness.demotedAdminCannotManageOrg');

  recordTenantActivationProofs({
    migrationApplied: bootstrapPassed || isolationOk,
    rlsVerified: isolationOk,
    userABootstrapPassed: passed(run.assertions, 'bootstrap.userA'),
    userBBootstrapPassed: passed(run.assertions, 'bootstrap.userB'),
    crossOrgIsolationPassed: crossOrg,
    crossUniverseIsolationPassed: crossUniverse,
    arbitraryJoinDenied:
      passed(run.assertions, 'write.joinForeignOrg.A-into-B') &&
      passed(run.assertions, 'write.joinForeignOrg.B-into-A'),
    selfPromotionDenied: passed(run.assertions, 'write.selfPromote.A') && passed(run.assertions, 'write.selfPromote.B'),
    foreignRoleGrantDenied:
      passed(run.assertions, 'write.joinForeignOrg.A-into-B') &&
      passed(run.assertions, 'authority.adminCannotCreateOwner'),
    staleAuthorizationDenied: freshnessPassed,
    clientSelectorNotAuthority: passed(run.assertions, 'authority.clientSelectorNotAuthority'),
    userRolesNotAuthority: passed(run.assertions, 'authority.userRolesNotAuthority'),
    profileCompanyNotAuthority: passed(run.assertions, 'authority.profileCompanyNotAuthority'),
    evidenceKind: isolationOk ? 'hosted' : 'unproven',
    reason: isolationOk
      ? 'Authenticated User A/B isolation assertions passed. Catalog FORCE RLS is a separate human-verified evidence kind.'
      : run.reason,
  });

  recordIsolationProvenance({
    isolationEvidenceKind: isolationOk ? 'authenticated_runtime' : 'unproven',
    isolationValidated: isolationOk,
    isolationRecordedAt: recordedAt,
    evidenceKind: isolationOk ? 'hosted' : 'unproven',
    reason: isolationOk
      ? 'Isolation provenance: authenticated_runtime.'
      : 'Isolation provenance remains unproven.',
  });

  return {
    isolationOk,
    recordedAt,
    freshnessPassed,
    positiveAccess: groupPass(run.assertions, 'positive.'),
    evaluated: evaluateTenantActivation(),
  };
}
