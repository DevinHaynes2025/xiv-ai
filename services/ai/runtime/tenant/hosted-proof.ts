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
  reason: 'Hosted apply has not been proven in this process.',
};

const isolationEvidence: HostedIsolationEvidence = {
  bootstrapPassed: false,
  isolationPassed: false,
  escalationPassed: false,
  freshnessPassed: false,
  twoUsers: false,
  reason: 'Hosted two-user isolation has not been proven in this process.',
};

export function recordHostedApplyEvidence(input: Partial<HostedApplyEvidence> & { reason: string }) {
  Object.assign(applyEvidence, input);
}

export function recordHostedIsolationEvidence(input: Partial<HostedIsolationEvidence> & { reason: string }) {
  Object.assign(isolationEvidence, input);
}

export function hostedApplyEvidence(): HostedApplyEvidence {
  return { ...applyEvidence };
}

export function hostedIsolationEvidence(): HostedIsolationEvidence {
  return { ...isolationEvidence };
}

export function tenantPersistenceIsLive() {
  return (
    applyEvidence.applied &&
    applyEvidence.tablesVisible &&
    applyEvidence.rlsVerified &&
    applyEvidence.phase2fApplied === false &&
    isolationEvidence.bootstrapPassed &&
    isolationEvidence.isolationPassed &&
    isolationEvidence.escalationPassed &&
    isolationEvidence.freshnessPassed &&
    isolationEvidence.twoUsers
  );
}

export function resetHostedProofForTests() {
  recordHostedApplyEvidence({
    applied: false,
    tablesVisible: false,
    rlsVerified: false,
    reason: 'Reset. Hosted apply has not been proven in this process.',
  });
  recordHostedIsolationEvidence({
    bootstrapPassed: false,
    isolationPassed: false,
    escalationPassed: false,
    freshnessPassed: false,
    twoUsers: false,
    reason: 'Reset. Hosted two-user isolation has not been proven in this process.',
  });
}
