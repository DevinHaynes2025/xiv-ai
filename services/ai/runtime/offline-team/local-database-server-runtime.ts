export type RuntimeHealth = 'TARGET' | 'DETECTED' | 'VERIFIED' | 'DEGRADED' | 'OFFLINE';
export type StoreEngine = 'SQLITE' | 'POSTGRES' | 'JSONL' | 'VECTOR' | 'OBJECT';
export type StorePlane = 'LOCAL' | 'HYBRID' | 'CLOUD_TARGET';

export interface RuntimeReceipt {
  serviceId: string;
  kind: 'DATABASE' | 'API' | 'CACHE' | 'QUEUE' | 'VECTOR' | 'OBJECT_STORE';
  host: string;
  port?: number;
  status: RuntimeHealth;
  checkedAt: string;
  evidenceRef?: string;
  latencyMs?: number;
}

export interface StoreDescriptor {
  storeId: string;
  tenantId: string;
  engine: StoreEngine;
  plane: StorePlane;
  status: RuntimeHealth;
  encryptionAtRest: boolean;
  receiptRef?: string;
}

export interface RuntimeReadiness {
  tenantId: string;
  ready: boolean;
  verifiedStores: number;
  verifiedServices: number;
  blockers: string[];
}

export class LocalDatabaseServerRuntime {
  private stores = new Map<string, StoreDescriptor>();
  private receipts = new Map<string, RuntimeReceipt>();

  registerStore(store: StoreDescriptor) {
    if (!store.tenantId || !store.storeId) throw new Error('tenant/store required');
    if (store.status === 'VERIFIED' && !store.receiptRef) throw new Error('verified store requires receipt');
    this.stores.set(`${store.tenantId}:${store.storeId}`, store);
  }

  recordReceipt(receipt: RuntimeReceipt) {
    if (!receipt.serviceId || !receipt.checkedAt) throw new Error('service/check time required');
    if (receipt.status === 'VERIFIED' && !receipt.evidenceRef) throw new Error('verified service requires evidence receipt');
    this.receipts.set(receipt.serviceId, receipt);
  }

  readiness(tenantId: string): RuntimeReadiness {
    const stores = [...this.stores.values()].filter(s => s.tenantId === tenantId);
    const verifiedStores = stores.filter(s => s.status === 'VERIFIED' && s.plane !== 'CLOUD_TARGET').length;
    const verifiedServices = [...this.receipts.values()].filter(r => r.status === 'VERIFIED').length;
    const blockers: string[] = [];
    if (!stores.some(s => s.status === 'VERIFIED' && s.plane !== 'CLOUD_TARGET' && (s.engine === 'SQLITE' || s.engine === 'POSTGRES' || s.engine === 'JSONL'))) blockers.push('no verified local/hybrid primary store');
    if (![...this.receipts.values()].some(r => r.kind === 'API' && r.status === 'VERIFIED')) blockers.push('no verified API receipt');
    return { tenantId, ready: blockers.length === 0, verifiedStores, verifiedServices, blockers };
  }

  listStores(tenantId: string) { return [...this.stores.values()].filter(s => s.tenantId === tenantId); }
  listReceipts() { return [...this.receipts.values()]; }
}

export const LOCAL_DATABASE_SERVER_GUARDRAILS = {
  verifiedRequiresReceipt: true,
  cloudTargetIsNotRuntimeProof: true,
  topSecretRequiresEncryptedLocalPolicy: true,
  productionMutationFromHealthCheckAllowed: false,
};
