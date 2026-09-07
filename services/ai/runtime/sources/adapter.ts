export type BusinessDataAdapterRequest = {
  providerId: string;
  query: Record<string, string>;
};

export type BusinessDataAdapterProvenance = {
  sourceId: string;
  sourceRecordId: string;
  retrievedAt: string;
  publisher: string;
  licenseType: string;
  usageRights: string;
};

export type BusinessDataAdapterRateLimit = {
  remaining: number | null;
  limited: boolean;
};

export type BusinessDataAdapterError = {
  allowed: false;
  reason: string;
};

export type BusinessDataAdapterResponse = {
  allowed: true;
  records: readonly Record<string, unknown>[];
  provenance: BusinessDataAdapterProvenance;
  freshness: string;
  fabricated: false;
};

export type BusinessDataAdapterHealthCheck = {
  providerId: string;
  reachable: boolean;
  status: string;
};

export type BusinessDataAdapter = {
  providerId: string;
  fetch(request: BusinessDataAdapterRequest): Promise<BusinessDataAdapterResponse | BusinessDataAdapterError>;
  normalize(record: Record<string, unknown>): Record<string, unknown> | BusinessDataAdapterError;
  validate(record: Record<string, unknown>): { ok: boolean; reason: string };
  classify(record: Record<string, unknown>): string;
  attachProvenance(record: Record<string, unknown>): BusinessDataAdapterProvenance | BusinessDataAdapterError;
  deduplicate(records: readonly Record<string, unknown>[]): readonly Record<string, unknown>[];
  recordFreshness(record: Record<string, unknown>): string;
  health(): BusinessDataAdapterHealthCheck;
};
