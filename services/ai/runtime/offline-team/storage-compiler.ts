export type StorageProvider = 'LOCAL' | 'GOOGLE_CLOUD' | 'AZURE';
export type StorageClass = 'HOT' | 'WARM' | 'COLD' | 'ARCHIVE';

export interface AtomicDataCellManifest {
  cellId: string;
  tenantId: string;
  checksum: string;
  bytes: number;
  storageClass: StorageClass;
  replicas: readonly StorageReplica[];
  provenanceRefs: readonly string[];
}

export interface StorageReplica {
  provider: StorageProvider;
  location: string;
  encrypted: true;
  status: 'PLANNED' | 'LOCAL_PRESENT' | 'CLOUD_CONFIRMED';
}

export const STORAGE_COMPILER_GUARDRAILS = {
  literalAtomSizedDatabaseClaim: false,
  logicalAtomicDataCells: true,
  crossTenantReplicationAllowed: false,
  cloudWriteRequiresConfiguredAdapter: true,
  autonomousCloudCreation: false,
  autonomousProductionReplication: false,
  localFirst: true,
} as const;

export function compileStoragePlan(input: {
  cellId: string;
  tenantId: string;
  checksum: string;
  bytes: number;
  provenanceRefs: readonly string[];
  cloudTargets?: readonly Exclude<StorageProvider, 'LOCAL'>[];
}): AtomicDataCellManifest {
  if (input.bytes < 0) throw new Error('bytes must be >= 0');
  if (!input.cellId || !input.tenantId || !input.checksum) throw new Error('cellId, tenantId, checksum required');
  const storageClass: StorageClass = input.bytes <= 64 * 1024 ? 'HOT' : input.bytes <= 4 * 1024 * 1024 ? 'WARM' : 'COLD';
  const replicas: StorageReplica[] = [
    { provider: 'LOCAL', location: '.xiv-runtime/data-cells', encrypted: true, status: 'LOCAL_PRESENT' },
    ...(input.cloudTargets ?? []).map((provider) => ({ provider, location: 'adapter-managed', encrypted: true as const, status: 'PLANNED' as const })),
  ];
  return Object.freeze({
    cellId: input.cellId,
    tenantId: input.tenantId,
    checksum: input.checksum,
    bytes: input.bytes,
    storageClass,
    replicas: Object.freeze(replicas),
    provenanceRefs: Object.freeze([...input.provenanceRefs]),
  });
}
