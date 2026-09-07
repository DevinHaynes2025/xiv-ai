import { clientSelectorIsNotAuthority } from '../tenant/authorize';
import type {
  DeviceCapability,
  DeviceClass,
  DeviceIdentity,
  DevicePlatform,
  DeviceTrustState,
  XivDevice,
} from './types';

export type DeviceEnrollment = {
  device: XivDevice;
  enrolledAt: string;
  enrolledByUserId: string;
};

export type DeviceSession = {
  sessionId: string;
  userId: string;
  tenantId: string;
  universeId: string;
  deviceId: string;
  createdAt: string;
  assurance: "standard" | "step_up_required";
  risk: "low" | "elevated" | "high";
  authorized: boolean;
  denial?: string;
};

export type SessionTransferRequest = {
  fromDeviceId: string;
  toDeviceId: string;
  userId: string;
  mfaSatisfied: boolean;
  sameTenant: boolean;
  sameUniverse: boolean;
};

export function createDeviceIdentity(input: {
  deviceId: string;
  class: DeviceClass;
  platform: DevicePlatform;
  trustState: DeviceTrustState;
  claimedTenantId?: string;
}): DeviceIdentity {
  return {
    deviceId: input.deviceId,
    class: input.class,
    platform: input.platform,
    trustState: input.trustState,
    clientReportedTenantId: input.claimedTenantId,
    tenantAuthority: false,
  };
}

export function deviceStateIsTenantAuthority(device: DeviceIdentity): boolean {
  return device.tenantAuthority === true;
}

export function clientDeviceClaimIsAuthority(
  device: DeviceIdentity,
  requestedTenantId: string,
): boolean {
  void requestedTenantId;
  return clientSelectorIsNotAuthority(device.clientReportedTenantId).allowed;
}

export function enrollDevice(input: {
  identity: DeviceIdentity;
  userId: string;
  tenantId: string;
  universeId: string;
  capabilities: DeviceCapability[];
}): DeviceEnrollment {
  return {
    device: {
      identity: input.identity,
      tenantId: input.tenantId,
      universeId: input.universeId,
      capabilities: [...input.capabilities],
      enrolledAt: "2026-09-07T00:00:00.000Z",
      lastSeenAt: "2026-09-07T00:00:00.000Z",
    },
    enrolledAt: "2026-09-07T00:00:00.000Z",
    enrolledByUserId: input.userId,
  };
}

export function authorizeDeviceSession(input: {
  device: XivDevice;
  userId: string;
  tenantId: string;
  universeId: string;
}): DeviceSession {
  if (input.device.identity.trustState === "REVOKED" || input.device.identity.trustState === "QUARANTINED") {
    return {
      sessionId: "denied",
      userId: input.userId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      deviceId: input.device.identity.deviceId,
      createdAt: "2026-09-07T00:00:00.000Z",
      assurance: "step_up_required",
      risk: "high",
      authorized: false,
      denial: "revoked_or_quarantined_device_cannot_authorize_session",
    };
  }
  if (input.device.tenantId !== input.tenantId) {
    return {
      sessionId: "denied",
      userId: input.userId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      deviceId: input.device.identity.deviceId,
      createdAt: "2026-09-07T00:00:00.000Z",
      assurance: "step_up_required",
      risk: "high",
      authorized: false,
      denial: "cross_org_device_use_denied",
    };
  }
  if (input.device.universeId !== input.universeId) {
    return {
      sessionId: "denied",
      userId: input.userId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      deviceId: input.device.identity.deviceId,
      createdAt: "2026-09-07T00:00:00.000Z",
      assurance: "step_up_required",
      risk: "high",
      authorized: false,
      denial: "cross_universe_device_use_denied",
    };
  }
  return {
    sessionId: `session:${input.device.identity.deviceId}`,
    userId: input.userId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    deviceId: input.device.identity.deviceId,
    createdAt: "2026-09-07T00:00:00.000Z",
    assurance: "standard",
    risk: "low",
    authorized: true,
  };
}

export function transferSession(request: SessionTransferRequest): {
  allowed: boolean;
  reason: string;
} {
  if (!request.mfaSatisfied) {
    return { allowed: false, reason: "device_transfer_cannot_bypass_mfa" };
  }
  if (!request.sameTenant) {
    return { allowed: false, reason: "cross_org_denied" };
  }
  if (!request.sameUniverse) {
    return { allowed: false, reason: "cross_universe_denied" };
  }
  return { allowed: true, reason: "transfer_requires_existing_trust_and_mfa" };
}

export function revokeDevice(device: XivDevice): XivDevice {
  return {
    ...device,
    identity: { ...device.identity, trustState: "REVOKED" },
  };
}

export function endpointProtectionClaimed(): false {
  return false;
}

export function nativeDesktopPackagingState(): "NOT_IMPLEMENTED" {
  return "NOT_IMPLEMENTED";
}
