import { createHash } from 'node:crypto';

export type LocalDbEngine = 'SQLITE' | 'FILE_JSON';
export type LocalDbHealth = 'READY' | 'DEGRADED' | 'UNVERIFIED';

export interface LocalDbConfig {
  tenantId: string;
  engine: LocalDbEngine;
  path: string;
  encryptedAtRest: boolean;
  localhostOnly: true;
}

export interface LocalDbReceipt {
  tenantId: string;
  engine: LocalDbEngine;
  path: string;
  schemaVersion: number;
  health: LocalDbHealth;
  verifiedAt?: string;
  receiptHash: string;
}

export function buildLocalDbReceipt(config: LocalDbConfig, schemaVersion = 1, verified = false): LocalDbReceipt {
  if (!config.tenantId || !config.path) throw new Error('tenantId and path are required');
  if (!config.encryptedAtRest) throw new Error('local persistence must be encrypted at rest');
  const health: LocalDbHealth = verified ? 'READY' : 'UNVERIFIED';
  const payload = `${config.tenantId}|${config.engine}|${config.path}|${schemaVersion}|${health}`;
  return {
    tenantId: config.tenantId,
    engine: config.engine,
    path: config.path,
    schemaVersion,
    health,
    verifiedAt: verified ? new Date().toISOString() : undefined,
    receiptHash: createHash('sha256').update(payload).digest('hex'),
  };
}

export const LOCAL_DB_GUARDRAILS = {
  localhostOnly: true,
  productionMutationAllowed: false,
  topSecretExternalSyncAllowed: false,
  secretsInSourceAllowed: false,
} as const;
