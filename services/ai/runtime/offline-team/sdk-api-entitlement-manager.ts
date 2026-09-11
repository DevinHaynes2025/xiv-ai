export type SdkScope = 'READ_PUBLIC' | 'READ_TENANT' | 'WRITE_SANDBOX' | 'MODEL_INFERENCE' | 'VECTOR_SEARCH' | 'STORAGE' | 'SIMULATION';

export interface ApiEntitlement {
  entitlementId: string;
  developerId: string;
  tenantId: string;
  scopes: SdkScope[];
  apiKeyRef?: string;
  expiresAt?: string;
  revoked: boolean;
  contractReceiptRef: string;
  securityReceiptRef: string;
}

export function entitlementUsable(e: ApiEntitlement, now = new Date()): boolean {
  if (e.revoked || !e.apiKeyRef || !e.contractReceiptRef || !e.securityReceiptRef) return false;
  if (e.expiresAt && new Date(e.expiresAt).getTime() <= now.getTime()) return false;
  return true;
}

export function canUseScope(e: ApiEntitlement, scope: SdkScope, now = new Date()): boolean {
  return entitlementUsable(e, now) && e.scopes.includes(scope);
}

export const API_KEY_POLICY = {
  storeRawKeysInRepo: false,
  exposeRawKeysInLogs: false,
  tenantIsolationRequired: true,
  productionWriteScopeDefined: false,
  topSecretExternalApiAllowed: false,
} as const;
