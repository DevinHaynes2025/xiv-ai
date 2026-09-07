import {
  recordTenantActivationProofs,
  resetTenantActivationProofs,
  tenantPersistenceIsLive as activationIsLive,
} from './activation-gate';
import { resetHostedCatalogRecord } from './hosted-catalog-evidence';

export type HostedApplyEvidence = {
  applied: boolean;
  migration: '20260906230000_xiv_tenant_reconciliation.sql';
  phase2fApplied: false;
  tablesVisible: boolean;
  rlsVerified: boolean;
  reason: string;
};

export type HostedIsolationEvidence = {
  bootstrapPassed: boolean;
  isolationPassed: boolean;
  escalationPassed: boolean;
  freshnessPassed: boolean;
  twoUsers: boolean;
  reason: string;
};

const applyEvidence: HostedApplyEvidence = {
  applied: false,
  migration: '20260906230000_xiv_tenant_reconciliation.sql',
  phase2fApplied: false,
  tablesVisible: false,
  rlsVerified: false,
  reason: 'APPLY BLOCKED — PRIVILEGED DATABASE CONNECTION REQUIRED.',
};

const isolationEvidence: HostedIsolationEvidence = {
  bootstrapPassed: false,
  isolationPassed: false,
  escalationPassed: false,
  freshnessPassed: false,
  twoUsers: false,
  reason: 'Hosted two-user isolation has not been proven in this process.',
};

function syncActivationFromLegacyEvidence() {
  const isolationComplete =
    isolationEvidence.bootstrapPassed &&
    isolationEvidence.isolationPassed &&
    isolationEvidence.escalationPassed &&
    isolationEvidence.freshnessPassed &&
    isolationEvidence.twoUsers;
  recordTenantActivationProofs({
    migrationApplied: applyEvidence.applied,
    rlsVerified: applyEvidence.rlsVerified,
    forceRlsVerified: false,
    userABootstrapPassed: isolationEvidence.bootstrapPassed && isolationEvidence.twoUsers,
    userBBootstrapPassed: isolationEvidence.bootstrapPassed && isolationEvidence.twoUsers,
    crossOrgIsolationPassed: isolationEvidence.isolationPassed,
    crossUniverseIsolationPassed: isolationEvidence.isolationPassed,
    arbitraryJoinDenied: isolationEvidence.escalationPassed,
    selfPromotionDenied: isolationEvidence.escalationPassed,
    foreignRoleGrantDenied: isolationEvidence.escalationPassed,
    staleAuthorizationDenied: isolationEvidence.freshnessPassed,
    clientSelectorNotAuthority: isolationEvidence.escalationPassed,
    userRolesNotAuthority: isolationEvidence.escalationPassed,
    profileCompanyNotAuthority: isolationEvidence.escalationPassed,
    evidenceKind: 'unproven',
    reason: isolationComplete
      ? `${isolationEvidence.reason} Legacy apply/isolation flags are not authenticated_runtime + human_verified_hosted_catalog.`
      : applyEvidence.reason,
  });
}

export function recordHostedApplyEvidence(input: Partial<HostedApplyEvidence> & { reason: string }) {
  Object.assign(applyEvidence, input, { phase2fApplied: false as const });
  syncActivationFromLegacyEvidence();
}

export function recordHostedIsolationEvidence(input: Partial<HostedIsolationEvidence> & { reason: string }) {
  Object.assign(isolationEvidence, input);
  syncActivationFromLegacyEvidence();
}

export function hostedApplyEvidence(): HostedApplyEvidence {
  return { ...applyEvidence };
}

export function hostedIsolationEvidence(): HostedIsolationEvidence {
  return { ...isolationEvidence };
}

export function tenantPersistenceIsLive() {
  return activationIsLive();
}

export function resetHostedProofForTests() {
  recordHostedApplyEvidence({
    applied: false,
    tablesVisible: false,
    rlsVerified: false,
    reason: 'Reset. APPLY BLOCKED — PRIVILEGED DATABASE CONNECTION REQUIRED.',
  });
  recordHostedIsolationEvidence({
    bootstrapPassed: false,
    isolationPassed: false,
    escalationPassed: false,
    freshnessPassed: false,
    twoUsers: false,
    reason: 'Reset. Hosted two-user isolation has not been proven in this process.',
  });
  resetHostedCatalogRecord();
  resetTenantActivationProofs();
}
