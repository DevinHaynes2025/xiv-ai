import {
  authorizeDeviceSession,
  createDeviceIdentity,
  enrollDevice,
  revokeDevice,
  type DeviceSession,
} from '../everywhere/devices';
import type { AndroidTrustState } from './types';

export type AndroidDeviceIdentity = ReturnType<typeof createDeviceIdentity> & {
  platform: 'ANDROID';
  playCompatibleTarget: 'modern_android';
  replacesAndroid: false;
};

export function enrollAndroidDevice(input: {
  deviceId: string;
  userId: string;
  tenantId: string;
  universeId: string;
  claimedTrust?: AndroidTrustState;
}): ReturnType<typeof enrollDevice> {
  const identity = createDeviceIdentity({
    deviceId: input.deviceId,
    class: 'PHONE',
    platform: 'ANDROID',
    trustState: 'UNKNOWN',
    claimedTenantId: input.tenantId,
  });
  return enrollDevice({
    identity,
    userId: input.userId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    capabilities: ['LOCATION', 'CAMERA', 'BARCODE', 'QR', 'NOTIFICATIONS', 'BIOMETRICS', 'OFFLINE_STORAGE'],
  });
}

export function unknownDeviceBecomesTrustedAutomatically(_claimed?: AndroidTrustState): false {
  return false;
}

export function authorizeAndroidSession(input: {
  deviceId: string;
  tenantId: string;
  universeId: string;
  trustState: AndroidTrustState;
}): DeviceSession {
  const enrollment = enrollAndroidDevice({
    deviceId: input.deviceId,
    userId: 'user-1',
    tenantId: input.tenantId,
    universeId: input.universeId,
  });
  const device =
    input.trustState === 'REVOKED' || input.trustState === 'QUARANTINED'
      ? revokeDevice(enrollment.device)
      : enrollment.device;
  return authorizeDeviceSession({
    device,
    userId: 'user-1',
    tenantId: input.tenantId,
    universeId: input.universeId,
  });
}

export function androidReplacesHostOs(): false {
  return false;
}
