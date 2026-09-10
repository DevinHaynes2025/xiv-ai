export interface PublicDataSource {
  sourceId: string;
  url: string;
  publicOrAuthorized: boolean;
  robotsAllowed: boolean;
  rateLimitPerMinute: number;
  tenantId: string;
}

export interface PublicDataIngestPlan {
  sourceId: string;
  tenantId: string;
  allowed: boolean;
  reasons: readonly string[];
  maxRequestsPerMinute: number;
  storeRawLocally: boolean;
  cloudReplicationPlanned: false;
  productionWrite: false;
}

export const PUBLIC_DATA_INGEST_GUARDRAILS = {
  publicOrAuthorizedOnly: true,
  obeyRobots: true,
  boundedRateLimit: true,
  bypassAuthenticationAllowed: false,
  scrapePrivateDataAllowed: false,
  autonomousCloudReplication: false,
  productionWriteAllowed: false,
} as const;

export function planPublicDataIngest(source: PublicDataSource): PublicDataIngestPlan {
  const reasons: string[] = [];
  if (!source.publicOrAuthorized) reasons.push('SOURCE_NOT_PUBLIC_OR_AUTHORIZED');
  if (!source.robotsAllowed) reasons.push('ROBOTS_POLICY_BLOCKS_INGEST');
  if (source.rateLimitPerMinute < 1) reasons.push('RATE_LIMIT_REQUIRED');
  const allowed = reasons.length === 0;
  return Object.freeze({
    sourceId: source.sourceId,
    tenantId: source.tenantId,
    allowed,
    reasons: Object.freeze(reasons),
    maxRequestsPerMinute: Math.max(0, Math.min(source.rateLimitPerMinute, 60)),
    storeRawLocally: allowed,
    cloudReplicationPlanned: false,
    productionWrite: false,
  });
}
