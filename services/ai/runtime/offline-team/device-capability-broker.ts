export type DeviceCapability = 'FILES' | 'CAMERA' | 'MICROPHONE' | 'SCREEN' | 'NOTIFICATIONS' | 'LOCAL_MODEL' | 'LOCAL_DATABASE' | 'AUTOMATION' | 'NETWORK';

export interface CapabilityGrant {
  userId: string;
  tenantId: string;
  deviceId: string;
  capability: DeviceCapability;
  granted: boolean;
  grantedAt: string;
  expiresAt?: string;
  evidenceRefs: string[];
}

export function canUseCapability(grants: CapabilityGrant[], input: { userId: string; tenantId: string; deviceId: string; capability: DeviceCapability; now?: string }): boolean {
  const now = new Date(input.now ?? new Date().toISOString()).getTime();
  return grants.some(g =>
    g.userId === input.userId &&
    g.tenantId === input.tenantId &&
    g.deviceId === input.deviceId &&
    g.capability === input.capability &&
    g.granted &&
    g.evidenceRefs.length > 0 &&
    (!g.expiresAt || new Date(g.expiresAt).getTime() > now)
  );
}

export const CAPABILITY_BROKER_GUARDRAILS = {
  explicitConsentRequired: true,
  crossTenantCapabilityReuse: false,
  blanketDeviceAccessAllowed: false,
  immediateRevocationSupported: true,
  auditReceiptRequired: true,
  topSecretNetworkExportAllowed: false,
};
