export type LocalDatabaseEngine = 'SQLITE' | 'POSTGRES_LOCAL' | 'EMBEDDED_KV';

export interface OfflineDatabaseServerConfig {
  tenantId: string;
  engine: LocalDatabaseEngine;
  bindHost: '127.0.0.1';
  port: number;
  encryptedAtRest: boolean;
  externalNetworkAllowed: boolean;
}

export interface DatabaseHealthReceipt {
  engine: LocalDatabaseEngine;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';
  writable: boolean;
  encryptedAtRestVerified: boolean;
  checkedAt: string;
}

export function validateOfflineDatabaseConfig(config: OfflineDatabaseServerConfig): boolean {
  return config.bindHost === '127.0.0.1' && config.port > 0 && config.encryptedAtRest && !config.externalNetworkAllowed;
}
