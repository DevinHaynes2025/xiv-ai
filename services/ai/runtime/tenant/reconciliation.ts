export const PREFERRED_RECONCILIATION = 'C_isolate_xiv_tables' as const;

export const XIV_TENANT_TABLES = [
  'xiv_organizations',
  'xiv_universes',
  'xiv_organization_memberships',
  'xiv_universe_memberships',
] as const;

export const PHASE2HA_MIGRATION = '20260906230000_xiv_tenant_reconciliation.sql';
export const PHASE2FA_MIGRATION_DO_NOT_APPLY = '20260906220000_persistent_organizations_and_universes.sql';

export type ReconciliationOptionId = 'A_adopt' | 'B_extend' | 'C_isolate_xiv_tables';

export type ReconciliationOption = {
  id: ReconciliationOptionId;
  title: string;
  executeNow: false;
  security: string;
  migrationComplexity: string;
  backwardCompatibility: string;
  rlsRisk: string;
  futureScaling: string;
  apiImpact: string;
  agentIntegration: string;
  businessLiveImpact: string;
  mediaStorageImpact: string;
  rollbackDifficulty: string;
};

export const RECONCILIATION_OPTIONS: readonly ReconciliationOption[] = [
  {
    id: 'A_adopt',
    title: 'Adopt existing public.organizations',
    executeNow: false,
    security: 'Inherits anon/publishable SELECT. Unknown policies/grants. High.',
    migrationComplexity: 'Must prove catalog, then layer memberships onto an unknown object.',
    backwardCompatibility: 'Preserves the name other unknown clients already see.',
    rlsRisk: 'Tightening grants may break unknown consumers; leaving anon SELECT is unsafe.',
    futureScaling: 'Name collision with XIV design continues.',
    apiImpact: 'PostgREST path stays /organizations with a weak public surface.',
    agentIntegration: 'Agents still must not query it directly.',
    businessLiveImpact: 'Private Live would sit on an unproven grant surface.',
    mediaStorageImpact: 'Prefixes could collide with unknown rows later.',
    rollbackDifficulty: 'Hard — adopted object is shared.',
  },
  {
    id: 'B_extend',
    title: 'Extend existing public.organizations',
    executeNow: false,
    security: 'ALTER + revoke anon could be correct, but catalog is unproven.',
    migrationComplexity: 'Exact ALTERs: ADD status, industry, region_preference, updated_at, plus memberships.',
    backwardCompatibility: 'Keeps name; changes shape and grants.',
    rlsRisk: 'Enabling FORCE RLS / revoking anon without knowing dependents is unsafe.',
    futureScaling: 'Possible, after catalog proof.',
    apiImpact: 'Existing OpenAPI path changes meaning.',
    agentIntegration: 'Same gateway rules.',
    businessLiveImpact: 'Blocked until isolation proof regardless.',
    mediaStorageImpact: 'Same as adopt.',
    rollbackDifficulty: 'ALTER + revoke is hard to roll back safely.',
  },
  {
    id: 'C_isolate_xiv_tables',
    title: 'Create XIV-specific tenant tables',
    executeNow: false,
    security: 'Hosted table untouched. New tables deny anon. Lowest unknown-blast radius.',
    migrationComplexity: 'New tables + helpers. Does not ALTER hosted organizations.',
    backwardCompatibility: 'Unknown hosted clients keep working. XIV app stays on collision until apply + proof.',
    rlsRisk: 'Policies are authored on new names only.',
    futureScaling: 'Clean namespace for sharding later.',
    apiImpact: 'Future paths are /xiv_organizations, not the colliding name.',
    agentIntegration: 'Still no direct DB access.',
    businessLiveImpact: 'Can bind host grants to xiv_* memberships after isolation proof.',
    mediaStorageImpact: 'Prefix organizations/{xivOrgId}/ stays unused until apply.',
    rollbackDifficulty: 'Drop new xiv_* objects only after review. Never drop hosted organizations.',
  },
];

export function preferredReconciliation() {
  return {
    option: PREFERRED_RECONCILIATION,
    reason:
      'Catalog (PK, FKs, triggers, owner, SQL grants) is unproven this session. Hosted table allows anon/publishable SELECT and is not an applied XIV migration. Isolating xiv_* tables avoids renaming, dropping, or altering the live object.',
    executeNow: false,
    alterHostedOrganizations: false,
    dropHostedOrganizations: false,
    renameHostedOrganizations: false,
  };
}

export function hostedTableIsNeverAutoDropped() {
  return true;
}

export function reconciliationRenamesHostedTable() {
  return false;
}
