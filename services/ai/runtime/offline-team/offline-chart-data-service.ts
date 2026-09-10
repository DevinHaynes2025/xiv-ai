export interface CachedVisualDataset {
  cacheKey: string;
  tenantId: string;
  createdAt: string;
  expiresAt?: string;
  sourceHash: string;
  payload: unknown;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

export class OfflineChartDataService {
  private cache = new Map<string, CachedVisualDataset>();

  put(dataset: CachedVisualDataset) {
    if (!dataset.tenantId || !dataset.sourceHash) throw new Error('tenant and source hash required');
    this.cache.set(`${dataset.tenantId}:${dataset.cacheKey}`, dataset);
  }

  get(tenantId: string, cacheKey: string): CachedVisualDataset | undefined {
    return this.cache.get(`${tenantId}:${cacheKey}`);
  }

  clearTenant(tenantId: string) {
    for (const key of [...this.cache.keys()]) if (key.startsWith(`${tenantId}:`)) this.cache.delete(key);
  }
}

export const OFFLINE_CHART_GUARDRAILS = {
  tenantScopedCache: true,
  encryptedDiskAdapterRequiredForPersistentUse: true,
  topSecretCacheAllowed: false,
  staleDataMustBeLabeled: true,
};
