export const TENANT_ACTIVATION_PROOF_KEYS = [
  'migrationApplied',
  'rlsVerified',
  'forceRlsVerified',
  'userABootstrapPassed',
  'userBBootstrapPassed',
  'crossOrgIsolationPassed',
  'crossUniverseIsolationPassed',
  'arbitraryJoinDenied',
  'selfPromotionDenied',
  'foreignRoleGrantDenied',
  'staleAuthorizationDenied',
  'clientSelectorNotAuthority',
  'userRolesNotAuthority',
  'profileCompanyNotAuthority',
] as const;

export type TenantActivationProofKey = (typeof TENANT_ACTIVATION_PROOF_KEYS)[number];

export type TenantActivationEvidenceKind = 'unproven' | 'hosted' | 'unit_semantic';

export type IsolationEvidenceKind =
  | 'unproven'
  | 'authenticated_runtime'
  | 'unit_semantic'
  | 'inferred'
  | 'simulated'
  | 'human_verified_hosted_catalog';

export type CatalogEvidenceKind =
  | 'unproven'
  | 'human_verified_hosted_catalog'
  | 'authenticated_runtime'
  | 'unit_semantic'
  | 'inferred'
  | 'simulated';

export type TenantActivationProofs = Record<TenantActivationProofKey, boolean> & {
  evidenceKind: TenantActivationEvidenceKind;
  isolationEvidenceKind: IsolationEvidenceKind;
  catalogEvidenceKind: CatalogEvidenceKind;
  isolationValidated: boolean;
  catalogValidated: boolean;
  isolationRecordedAt: string | null;
  catalogRecordedAt: string | null;
  phase2fApplied: false;
  reason: string;
};

export type TenantPersistenceGateStatus = 'live' | 'blocked';

const blockedProofs = (): TenantActivationProofs => ({
  migrationApplied: false,
  rlsVerified: false,
  forceRlsVerified: false,
  userABootstrapPassed: false,
  userBBootstrapPassed: false,
  crossOrgIsolationPassed: false,
  crossUniverseIsolationPassed: false,
  arbitraryJoinDenied: false,
  selfPromotionDenied: false,
  foreignRoleGrantDenied: false,
  staleAuthorizationDenied: false,
  clientSelectorNotAuthority: false,
  userRolesNotAuthority: false,
  profileCompanyNotAuthority: false,
  evidenceKind: 'unproven',
  isolationEvidenceKind: 'unproven',
  catalogEvidenceKind: 'unproven',
  isolationValidated: false,
  catalogValidated: false,
  isolationRecordedAt: null,
  catalogRecordedAt: null,
  phase2fApplied: false,
  reason: 'APPLY BLOCKED — PRIVILEGED DATABASE CONNECTION REQUIRED. Hosted RLS proofs are unproven.',
});

let proofs: TenantActivationProofs = blockedProofs();

export function tenantActivationProofs(): TenantActivationProofs {
  return { ...proofs };
}

export function recordTenantActivationProofs(input: Partial<TenantActivationProofs> & { reason: string }) {
  const {
    isolationValidated: _isolationValidated,
    catalogValidated: _catalogValidated,
    isolationEvidenceKind: _isolationEvidenceKind,
    catalogEvidenceKind: _catalogEvidenceKind,
    isolationRecordedAt: _isolationRecordedAt,
    catalogRecordedAt: _catalogRecordedAt,
    ...rest
  } = input;
  void _isolationValidated;
  void _catalogValidated;
  void _isolationEvidenceKind;
  void _catalogEvidenceKind;
  void _isolationRecordedAt;
  void _catalogRecordedAt;
  proofs = {
    ...proofs,
    ...rest,
    isolationValidated: proofs.isolationValidated,
    catalogValidated: proofs.catalogValidated,
    isolationEvidenceKind: proofs.isolationEvidenceKind,
    catalogEvidenceKind: proofs.catalogEvidenceKind,
    isolationRecordedAt: proofs.isolationRecordedAt,
    catalogRecordedAt: proofs.catalogRecordedAt,
    phase2fApplied: false,
    evidenceKind: rest.evidenceKind ?? proofs.evidenceKind,
  };
}

export function recordIsolationProvenance(input: {
  isolationEvidenceKind: IsolationEvidenceKind;
  isolationValidated: boolean;
  isolationRecordedAt: string;
  reason: string;
} & Partial<Pick<TenantActivationProofs, TenantActivationProofKey | 'evidenceKind'>>) {
  proofs = {
    ...proofs,
    ...input,
    phase2fApplied: false,
  };
}

export function recordCatalogProvenance(input: {
  catalogEvidenceKind: CatalogEvidenceKind;
  catalogValidated: boolean;
  catalogRecordedAt: string;
  reason: string;
} & Partial<Pick<TenantActivationProofs, TenantActivationProofKey | 'evidenceKind'>>) {
  proofs = {
    ...proofs,
    ...input,
    phase2fApplied: false,
  };
}

export function resetTenantActivationProofs() {
  proofs = blockedProofs();
}

function compositeEvidenceKind(input: TenantActivationProofs): TenantActivationEvidenceKind {
  if (
    input.evidenceKind === 'unit_semantic' ||
    input.isolationEvidenceKind === 'unit_semantic' ||
    input.catalogEvidenceKind === 'unit_semantic'
  ) {
    return 'unit_semantic';
  }
  if (
    input.isolationEvidenceKind === 'authenticated_runtime' &&
    input.isolationValidated &&
    input.catalogEvidenceKind === 'human_verified_hosted_catalog' &&
    input.catalogValidated
  ) {
    return 'hosted';
  }
  return 'unproven';
}

export function evaluateTenantActivation(input: TenantActivationProofs = proofs) {
  const missing = TENANT_ACTIVATION_PROOF_KEYS.filter((key) => input[key] !== true);
  const compositeKind = compositeEvidenceKind(input);
  const isolationOk =
    input.isolationEvidenceKind === 'authenticated_runtime' && input.isolationValidated === true;
  const catalogOk =
    input.catalogEvidenceKind === 'human_verified_hosted_catalog' && input.catalogValidated === true;
  const inferredOrSimulated =
    input.isolationEvidenceKind === 'inferred' ||
    input.isolationEvidenceKind === 'simulated' ||
    input.catalogEvidenceKind === 'inferred' ||
    input.catalogEvidenceKind === 'simulated';
  const allProofs = missing.length === 0 && input.phase2fApplied === false;
  const live = allProofs && isolationOk && catalogOk && !inferredOrSimulated && compositeKind === 'hosted';
  const missingEvidence = [
    ...missing,
    ...(!isolationOk ? (['authenticated_runtime_isolation'] as const) : []),
    ...(!catalogOk ? (['human_verified_hosted_catalog'] as const) : []),
  ];
  return {
    tenantPersistence: (live ? 'live' : 'blocked') as TenantPersistenceGateStatus,
    businessModulesTenantReady: live,
    tenantAuthorization: live ? ('implemented' as const) : ('blocked' as const),
    liveProvider: 'not_configured' as const,
    evidenceKind: compositeKind,
    isolationEvidenceKind: input.isolationEvidenceKind,
    catalogEvidenceKind: input.catalogEvidenceKind,
    isolationValidated: input.isolationValidated,
    catalogValidated: input.catalogValidated,
    isolationRecordedAt: input.isolationRecordedAt,
    catalogRecordedAt: input.catalogRecordedAt,
    missing: missingEvidence,
    hostedRlsProof: live,
    unitSemanticIsNotHostedProof: compositeKind !== 'hosted',
    reason: live
      ? 'Authenticated User A/B isolation and human-verified hosted catalog both passed. tenantPersistence = live.'
      : compositeKind === 'unit_semantic'
        ? 'UNIT/SEMANTIC TEST is not HOSTED RLS PROOF. tenantPersistence = blocked.'
        : inferredOrSimulated
          ? 'Inferred or simulated evidence cannot activate tenant persistence.'
          : missingEvidence.length
            ? `Missing evidence: ${missingEvidence.join(', ')}`
            : input.reason,
  };
}

export function tenantPersistenceStatus(): TenantPersistenceGateStatus {
  return evaluateTenantActivation().tenantPersistence;
}

export function tenantPersistenceIsLive() {
  return tenantPersistenceStatus() === 'live';
}

export function businessModulesTenantReady() {
  return evaluateTenantActivation().businessModulesTenantReady;
}

export function tenantAuthorizationStatus() {
  return evaluateTenantActivation().tenantAuthorization;
}

export function authoritativeXivHydrationEnabled() {
  return tenantPersistenceIsLive();
}
