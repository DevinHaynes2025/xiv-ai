/**
 * Human-verified hosted catalog evidence.
 * Distinct from authenticated runtime, unit, inferred, and simulated proof.
 * FORCE RLS is never inferred from apply + behavioral RLS.
 */
import { recordCatalogProvenance } from './activation-gate';
import { XIV_TENANT_TABLES } from './reconciliation';

export const HUMAN_VERIFIED_HOSTED_CATALOG = 'human_verified_hosted_catalog' as const;

export type CatalogEvidenceKind =
  | 'unproven'
  | typeof HUMAN_VERIFIED_HOSTED_CATALOG
  | 'authenticated_runtime'
  | 'unit_semantic'
  | 'inferred'
  | 'simulated';

export type IsolationEvidenceKind =
  | 'unproven'
  | 'authenticated_runtime'
  | 'unit_semantic'
  | 'inferred'
  | 'simulated'
  | typeof HUMAN_VERIFIED_HOSTED_CATALOG;

const TENANT_TABLES = [...XIV_TENANT_TABLES] as const;

export type HostedCatalogTableObservation = {
  schema: 'public';
  table: (typeof TENANT_TABLES)[number];
  relrowsecurity: boolean;
  relforcerowsecurity: boolean;
};

export type HostedCatalogAclObservation = {
  anonTableGrants: 'none';
  authenticated: {
    xiv_organizations: readonly ['SELECT', 'UPDATE'];
    xiv_universes: readonly ['SELECT', 'UPDATE'];
    xiv_organization_memberships: readonly ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    xiv_universe_memberships: readonly ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    truncate: false;
    trigger: false;
    references: false;
  };
};

export type HostedCatalogInternalObservation = {
  anonExecuteAnyInternalHelperOrProtect: false;
  authenticatedExecute: readonly [
    'xiv_user_is_org_member',
    'xiv_universe_org_id',
    'xiv_universe_belongs_to_org',
  ];
  authenticatedCannotExecute: readonly [
    'protect_organization_membership',
    'protect_universe_membership',
    'protect_universe_organization',
  ];
};

export type HostedCatalogObservation = {
  evidenceKind: typeof HUMAN_VERIFIED_HOSTED_CATALOG;
  source: 'human_sql_editor_after_migration_install';
  not: readonly ['authenticated_runtime', 'unit_semantic', 'inferred', 'simulated'];
  tables: readonly HostedCatalogTableObservation[];
  authenticatedPolicyCount: 12;
  acl: HostedCatalogAclObservation;
  xivInternal: HostedCatalogInternalObservation;
};

export type HostedCatalogRecord = {
  evidenceKind: CatalogEvidenceKind;
  validated: boolean;
  recordedAt: string | null;
  humanReportedAt: string | null;
  observation: HostedCatalogObservation | null;
  findings: string[];
  reason: string;
};

const EXPECTED_AUTH_GRANTS = {
  xiv_organizations: ['SELECT', 'UPDATE'],
  xiv_universes: ['SELECT', 'UPDATE'],
  xiv_organization_memberships: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  xiv_universe_memberships: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
} as const;

const blockedCatalog = (): HostedCatalogRecord => ({
  evidenceKind: 'unproven',
  validated: false,
  recordedAt: null,
  humanReportedAt: null,
  observation: null,
  findings: ['Hosted catalog evidence is unproven.'],
  reason: 'No human-verified hosted catalog evidence has been recorded.',
});

let catalogRecord: HostedCatalogRecord = blockedCatalog();

export function hostedCatalogRecord(): HostedCatalogRecord {
  return {
    ...catalogRecord,
    findings: [...catalogRecord.findings],
    observation: catalogRecord.observation,
  };
}

export function resetHostedCatalogRecord() {
  catalogRecord = blockedCatalog();
}

export function sameStringList(actual: readonly string[], expected: readonly string[]) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

export function validateHostedCatalogObservation(observation: HostedCatalogObservation) {
  const findings: string[] = [];
  if (observation.evidenceKind !== HUMAN_VERIFIED_HOSTED_CATALOG) {
    findings.push('Catalog evidenceKind must be human_verified_hosted_catalog.');
  }
  if (observation.source !== 'human_sql_editor_after_migration_install') {
    findings.push('Catalog source must be human SQL Editor verification after migration install.');
  }
  if (observation.not.includes('human_verified_hosted_catalog' as never)) {
    findings.push('Catalog observation must not exclude its own evidence kind.');
  }
  for (const kind of ['authenticated_runtime', 'unit_semantic', 'inferred', 'simulated'] as const) {
    if (!observation.not.includes(kind)) {
      findings.push(`Catalog observation must distinguish itself from ${kind}.`);
    }
  }
  if (observation.authenticatedPolicyCount !== 12) {
    findings.push('Hosted catalog must report exactly 12 authenticated RLS policies.');
  }
  const tables = observation.tables;
  if (tables.length !== TENANT_TABLES.length) {
    findings.push('Catalog must include all four xiv_* tenant tables.');
  }
  for (const name of TENANT_TABLES) {
    const row = tables.find((table) => table.table === name && table.schema === 'public');
    if (!row) {
      findings.push(`Missing catalog row for public.${name}.`);
      continue;
    }
    if (row.relrowsecurity !== true) findings.push(`${name} relrowsecurity must be true.`);
    if (row.relforcerowsecurity !== true) findings.push(`${name} relforcerowsecurity must be true.`);
  }
  if (observation.acl.anonTableGrants !== 'none') {
    findings.push('anon must have no tenant table grants.');
  }
  if (observation.acl.authenticated.truncate !== false) findings.push('authenticated TRUNCATE must be absent.');
  if (observation.acl.authenticated.trigger !== false) findings.push('authenticated TRIGGER must be absent.');
  if (observation.acl.authenticated.references !== false) {
    findings.push('authenticated REFERENCES must be absent.');
  }
  for (const table of TENANT_TABLES) {
    const actual = observation.acl.authenticated[table];
    const expected = EXPECTED_AUTH_GRANTS[table];
    if (!sameStringList(actual, expected)) {
      findings.push(`${table} authenticated grants must be ${expected.join(', ')}.`);
    }
  }
  if (observation.xivInternal.anonExecuteAnyInternalHelperOrProtect !== false) {
    findings.push('anon must not execute xiv_internal helpers or protect functions.');
  }
  if (
    !sameStringList(
      observation.xivInternal.authenticatedExecute,
      ['xiv_user_is_org_member', 'xiv_universe_org_id', 'xiv_universe_belongs_to_org'],
    )
  ) {
    findings.push('authenticated xiv_internal EXECUTE set is not the RLS helper trio.');
  }
  if (
    !sameStringList(observation.xivInternal.authenticatedCannotExecute, [
      'protect_organization_membership',
      'protect_universe_membership',
      'protect_universe_organization',
    ])
  ) {
    findings.push('authenticated must not execute xiv_internal protect functions.');
  }
  return {
    ok: findings.length === 0,
    findings,
  };
}

/**
 * Catalog facts reported from the hosted SQL Editor after migration install.
 * This is not authenticated runtime proof and not inferred FORCE RLS.
 */
export const PHASE2HC_HUMAN_VERIFIED_HOSTED_CATALOG: HostedCatalogObservation = {
  evidenceKind: HUMAN_VERIFIED_HOSTED_CATALOG,
  source: 'human_sql_editor_after_migration_install',
  not: ['authenticated_runtime', 'unit_semantic', 'inferred', 'simulated'],
  tables: [
    {
      schema: 'public',
      table: 'xiv_organizations',
      relrowsecurity: true,
      relforcerowsecurity: true,
    },
    {
      schema: 'public',
      table: 'xiv_universes',
      relrowsecurity: true,
      relforcerowsecurity: true,
    },
    {
      schema: 'public',
      table: 'xiv_organization_memberships',
      relrowsecurity: true,
      relforcerowsecurity: true,
    },
    {
      schema: 'public',
      table: 'xiv_universe_memberships',
      relrowsecurity: true,
      relforcerowsecurity: true,
    },
  ],
  authenticatedPolicyCount: 12,
  acl: {
    anonTableGrants: 'none',
    authenticated: {
      xiv_organizations: ['SELECT', 'UPDATE'],
      xiv_universes: ['SELECT', 'UPDATE'],
      xiv_organization_memberships: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      xiv_universe_memberships: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      truncate: false,
      trigger: false,
      references: false,
    },
  },
  xivInternal: {
    anonExecuteAnyInternalHelperOrProtect: false,
    authenticatedExecute: ['xiv_user_is_org_member', 'xiv_universe_org_id', 'xiv_universe_belongs_to_org'],
    authenticatedCannotExecute: [
      'protect_organization_membership',
      'protect_universe_membership',
      'protect_universe_organization',
    ],
  },
};

export function recordHumanVerifiedHostedCatalog(input: {
  observation: HostedCatalogObservation;
  humanReportedAt?: string;
}) {
  const recordedAt = new Date().toISOString();
  const review = validateHostedCatalogObservation(input.observation);
  if (!review.ok) {
    catalogRecord = {
      evidenceKind: 'unproven',
      validated: false,
      recordedAt,
      humanReportedAt: input.humanReportedAt ?? null,
      observation: input.observation,
      findings: review.findings,
      reason: `Human catalog observation rejected: ${review.findings.join(' ')}`,
    };
    recordCatalogProvenance({
      forceRlsVerified: false,
      catalogEvidenceKind: 'unproven',
      catalogValidated: false,
      catalogRecordedAt: recordedAt,
      reason: catalogRecord.reason,
    });
    return catalogRecord;
  }

  catalogRecord = {
    evidenceKind: HUMAN_VERIFIED_HOSTED_CATALOG,
    validated: true,
    recordedAt,
    humanReportedAt: input.humanReportedAt ?? null,
    observation: input.observation,
    findings: [],
    reason:
      'Human-verified hosted catalog accepted: RLS and FORCE RLS on all four xiv_* tables, 12 authenticated policies, expected ACLs, xiv_internal helper/protect split.',
  };

  recordCatalogProvenance({
    migrationApplied: true,
    forceRlsVerified: true,
    catalogEvidenceKind: HUMAN_VERIFIED_HOSTED_CATALOG,
    catalogValidated: true,
    catalogRecordedAt: recordedAt,
    reason: catalogRecord.reason,
  });
  return catalogRecord;
}
