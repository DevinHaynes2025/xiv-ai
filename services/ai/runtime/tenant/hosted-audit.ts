export type CatalogProof = 'proven_rest' | 'documented_prior_phase' | 'unproven_this_session';

export type HostedOrganizationsAudit = {
  table: 'public.organizations';
  origin: 'unknown';
  live: false;
  mayRename: false;
  mayDrop: false;
  mayAutoAlter: false;
  rest: {
    projectHost: 'laxpnlnavzkjawuvzyxh.supabase.co';
    selectWithoutAuthKeyShape: readonly string[];
    emptyAtPhase2Fb: true;
    missingColumns: readonly string[];
    anonOrPublishableCanSelect: true;
    universesInApiSchema: false;
    membershipsInApiSchema: false;
    xivCreateRpcsInApiSchema: false;
    proof: CatalogProof;
  };
  catalog: {
    columnTypes: CatalogProof;
    primaryKey: CatalogProof;
    foreignKeys: CatalogProof;
    uniqueConstraints: CatalogProof;
    indexes: CatalogProof;
    rlsEnabled: CatalogProof;
    forceRls: CatalogProof;
    policies: CatalogProof;
    grantsSql: CatalogProof;
    owner: CatalogProof;
    triggers: CatalogProof;
    functionsReferencing: CatalogProof;
    viewsReferencing: CatalogProof;
    inboundForeignKeys: CatalogProof;
  };
  appUsage: {
    mobileReadsOrganizationsForCollisionDetect: true;
    mobileDoesNotTreatItAsXivTenant: true;
    agentsDoNotQueryIt: true;
  };
};

export function hostedOrganizationsAudit(): HostedOrganizationsAudit {
  return {
    table: 'public.organizations',
    origin: 'unknown',
    live: false,
    mayRename: false,
    mayDrop: false,
    mayAutoAlter: false,
    rest: {
      projectHost: 'laxpnlnavzkjawuvzyxh.supabase.co',
      selectWithoutAuthKeyShape: ['id', 'name', 'slug', 'created_by', 'created_at'],
      emptyAtPhase2Fb: true,
      missingColumns: ['status', 'industry', 'region_preference', 'updated_at'],
      anonOrPublishableCanSelect: true,
      universesInApiSchema: false,
      membershipsInApiSchema: false,
      xivCreateRpcsInApiSchema: false,
      proof: 'documented_prior_phase',
    },
    catalog: {
      columnTypes: 'unproven_this_session',
      primaryKey: 'unproven_this_session',
      foreignKeys: 'unproven_this_session',
      uniqueConstraints: 'unproven_this_session',
      indexes: 'unproven_this_session',
      rlsEnabled: 'unproven_this_session',
      forceRls: 'unproven_this_session',
      policies: 'unproven_this_session',
      grantsSql: 'unproven_this_session',
      owner: 'unproven_this_session',
      triggers: 'unproven_this_session',
      functionsReferencing: 'unproven_this_session',
      viewsReferencing: 'unproven_this_session',
      inboundForeignKeys: 'unproven_this_session',
    },
    appUsage: {
      mobileReadsOrganizationsForCollisionDetect: true,
      mobileDoesNotTreatItAsXivTenant: true,
      agentsDoNotQueryIt: true,
    },
  };
}

export function hostedTableOriginAnalysis() {
  return {
    xivAuthoredCreateTable: 'a8dfa95 (Phase 2F-A, not applied)',
    earlierXivMigrations: 'none create public.organizations',
    supabaseStarterInRepo: false,
    hostedObjectPredatesXivMigration: true,
    assumedOwnership: false,
    conclusion:
      'Hosted public.organizations is not created by an applied XIV migration. Origin is unknown (manual hosted creation, dashboard, or another feature). Do not assume XIV owns it.',
  };
}
