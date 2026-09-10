export type ConsentScope = 'PROFILE' | 'FILES' | 'CAMERA' | 'MICROPHONE' | 'SCREEN' | 'NOTIFICATIONS' | 'CONNECTED_APPS' | 'LOCAL_MODEL' | 'LOCAL_DATABASE' | 'CLOUD_SYNC' | 'ANALYTICS';

export interface ConsentGrant {
  tenantId: string;
  userId: string;
  scope: ConsentScope;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  policyVersion: string;
  evidenceRef: string;
}

export function validateConsentGrant(grant: ConsentGrant): ConsentGrant {
  if (!grant.tenantId || !grant.userId || !grant.policyVersion || !grant.evidenceRef) throw new Error('consent provenance required');
  if (grant.granted && !grant.grantedAt) throw new Error('grantedAt required');
  if (!grant.granted && grant.grantedAt && !grant.revokedAt) throw new Error('revocation timestamp required');
  return grant;
}

export const PRIVACY_CONSENT_GUARDRAILS = {
  explicitOptInForSensitiveScopes: true,
  revocableAnyTime: true,
  separateConsentPerCapability: true,
  noBundledBlanketDevicePermission: true,
  noDarkPatterns: true,
  auditReceiptRequired: true,
};
