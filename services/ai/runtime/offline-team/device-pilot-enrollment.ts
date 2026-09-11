export type DevicePilotCapability = 'FILES_READ' | 'FILES_WRITE' | 'CAMERA' | 'MICROPHONE' | 'SCREEN' | 'NOTIFICATIONS' | 'LOCAL_MODELS' | 'LOCAL_DATABASES' | 'AUTOMATION';

export interface DevicePilotEnrollment {
  userId: string;
  tenantId: string;
  deviceId: string;
  enrolledAt: string;
  expiresAt?: string;
  consentVersion: string;
  capabilities: readonly DevicePilotCapability[];
  biometricOrPasskeyVerified: boolean;
  mfaVerified: boolean;
  recoveryConfigured: boolean;
  auditEnabled: boolean;
  killSwitchEnabled: boolean;
}

export const DEVICE_PILOT_GUARDRAILS = {
  explicitOptInRequired: true,
  blanketDeviceAccessAllowed: false,
  perCapabilityConsentRequired: true,
  auditRequired: true,
  killSwitchRequired: true,
  backgroundCaptureByDefault: false,
  crossTenantAccessAllowed: false,
  secretsMayLeaveDeviceByDefault: false,
};

export function validateDevicePilotEnrollment(enrollment: DevicePilotEnrollment): boolean {
  if (!enrollment.userId || !enrollment.tenantId || !enrollment.deviceId) return false;
  if (!enrollment.biometricOrPasskeyVerified || !enrollment.mfaVerified) return false;
  if (!enrollment.recoveryConfigured || !enrollment.auditEnabled || !enrollment.killSwitchEnabled) return false;
  if (!enrollment.capabilities.length) return false;
  return new Set(enrollment.capabilities).size === enrollment.capabilities.length;
}
