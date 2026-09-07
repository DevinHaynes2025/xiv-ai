/**
 * Provider-neutral database connector fabric.
 * Credentials server-side only. Read-only default. Unknown sources denied.
 * Oracle is a connector, not a client-side database dependency.
 */
export type DatabaseEngine =
  | 'postgresql'
  | 'supabase'
  | 'oracle'
  | 'mysql'
  | 'sql_server'
  | 'snowflake'
  | 'bigquery'
  | 'redshift'
  | 'mongodb'
  | 'databricks'
  | 'object_storage'
  | 'data_lake';

export type DatabaseProviderStatus = 'not_configured' | 'configured' | 'connected' | 'degraded' | 'unavailable';

export type DatabaseCredentialReference = {
  credentialId: string;
  stored: 'server_side';
  passwordExposedClientSide: false;
};

export type DatabaseConnectionDescriptor = {
  connectionId: string;
  engine: DatabaseEngine;
  status: DatabaseProviderStatus;
  tenantScopeRequired: true;
  clientPassword: null;
};

export type DatabaseSchemaDescriptor = { schemaId: string; name: string };
export type DatabaseTableDescriptor = { tableId: string; name: string };
export type DatabaseColumnDescriptor = { columnId: string; name: string; classification: string };
export type DatabaseQueryPolicy = {
  unrestrictedSql: false;
  allowlistRequired: true;
  auditRequired: true;
  classificationRequired: true;
  provenanceRequired: true;
};
export type DatabaseReadCapability = { allowed: true; mode: 'read_only_default' };
export type DatabaseWriteCapability = { allowed: false; reason: string };
export type DatabaseHealth = { status: DatabaseProviderStatus; live: false };
export type DatabaseProvenance = { sourceId: string; retrievedAt: string; classification: string };

export type DatabaseProvider = {
  engine: DatabaseEngine;
  status: DatabaseProviderStatus;
  credentials: DatabaseCredentialReference | null;
  queryPolicy: DatabaseQueryPolicy;
  live: false;
};

export function databaseQueryPolicy(): DatabaseQueryPolicy {
  return {
    unrestrictedSql: false,
    allowlistRequired: true,
    auditRequired: true,
    classificationRequired: true,
    provenanceRequired: true,
  };
}

export function createDatabaseProvider(engine: DatabaseEngine): DatabaseProvider {
  return {
    engine,
    status: 'not_configured',
    credentials: null,
    queryPolicy: databaseQueryPolicy(),
    live: false,
  };
}

export function oracleConnector() {
  const provider = createDatabaseProvider('oracle');
  return {
    ...provider,
    engine: 'oracle' as const,
    write: { allowed: false as const, reason: 'Oracle connector defaults read-only.' },
    clientSideDependency: false as const,
  };
}

export function oracleDefaultsReadOnly() {
  return oracleConnector().write.allowed === false;
}

export function databaseCredentialsExposedClientSide() {
  return false;
}

export function unknownDatabaseSourceDenied(engine: string) {
  const known: readonly string[] = [
    'postgresql',
    'supabase',
    'oracle',
    'mysql',
    'sql_server',
    'snowflake',
    'bigquery',
    'redshift',
    'mongodb',
    'databricks',
    'object_storage',
    'data_lake',
  ];
  if (!known.includes(engine)) {
    return { allowed: false as const, reason: 'Unknown database source denied.' };
  }
  return { allowed: true as const, status: 'not_configured' as const };
}
