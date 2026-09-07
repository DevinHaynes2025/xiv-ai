import type { PersistenceStatus } from './context';

export type TenantPersistenceInvestigation = {
  status: Extract<PersistenceStatus, 'schema_collision'>;
  live: false;
  mayApplyMigration: false;
  mayRenameHostedTable: false;
  mayDropHostedTable: false;
  reason: string;
  hostedOrganizationsShape: readonly string[];
  authoredOrganizationsExtraColumns: readonly string[];
};

export function describeTenantPersistenceBlock(): TenantPersistenceInvestigation {
  return {
    status: 'schema_collision',
    live: false,
    mayApplyMigration: false,
    mayRenameHostedTable: false,
    mayDropHostedTable: false,
    reason:
      'Hosted public.organizations already exists with id, name, slug, created_by, created_at. It is not the Phase 2F schema. Persistence remains NOT LIVE.',
    hostedOrganizationsShape: ['id', 'name', 'slug', 'created_by', 'created_at'],
    authoredOrganizationsExtraColumns: ['status', 'industry', 'region_preference', 'updated_at'],
  };
}

export function tenantPersistenceIsLive() {
  return false;
}
