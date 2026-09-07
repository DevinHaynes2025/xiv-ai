export type CacheKeyParts = {
  tenant?: string | null;
  universe?: string | null;
  scope: 'public' | 'organization' | 'universe';
  classification: string;
  version: string;
  locale: string;
  key: string;
};

export function buildCacheKey(parts: CacheKeyParts) {
  if (parts.scope !== 'public' && !parts.tenant) {
    return { allowed: false as const, reason: 'Private cache key requires tenant scope: DENY' };
  }
  const tenant = parts.scope === 'public' ? 'public' : parts.tenant;
  return {
    allowed: true as const,
    key: [tenant, parts.universe ?? 'none', parts.scope, parts.classification, parts.version, parts.locale, parts.key].join(':'),
  };
}

export function privateCacheRequiresTenant(parts: CacheKeyParts) {
  return parts.scope === 'public' || Boolean(parts.tenant);
}
