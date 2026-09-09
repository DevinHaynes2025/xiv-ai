/**
 * Device + OS Fabric and NVIDIA + Compute Fabric.
 * XIV does not replace Android/iOS/Windows/Linux/macOS/Samsung OS.
 * NVIDIA = compute acceleration, not authorization.
 */

import {
  COMPUTE_CAPABILITY_KINDS,
  DEVICE_OS_KINDS,
  DEVICE_TRUST_PATH,
  type ComputeCapabilityKind,
  type ConnectorHealthState,
  type DeviceOsKind,
  type DeviceTrustPathHop,
} from './types';

export type DeviceProfile = {
  deviceId: string;
  os: DeviceOsKind;
  xivReplacesHostOs: false;
  trustPath: readonly DeviceTrustPathHop[];
  healthState: ConnectorHealthState;
};

export type ComputeProvider = {
  providerId: string;
  kind: ComputeCapabilityKind;
  nvidiaIsAuthorization: false;
  healthState: ConnectorHealthState;
  productionLive: false;
};

export type ComputeCapability = {
  capabilityId: string;
  kind: ComputeCapabilityKind;
  grantsAuthority: false;
};

export type ComputeJob = {
  jobId: string;
  providerId: string;
  tenantId: string;
  universeId: string;
  budgetBounded: true;
};

export type ComputePolicy = {
  policyId: string;
  nvidiaAuthorization: false;
  requiresGuardian: true;
};

export type ComputeBudget = {
  budgetId: string;
  ceiling: number;
  selfExpandable: false;
};

export type ComputeRegion = {
  regionId: string;
  residencyHonored: true;
};

export type ComputeHealth = {
  providerId: string;
  state: ConnectorHealthState;
};

export function listDeviceOsKinds(): readonly DeviceOsKind[] {
  return DEVICE_OS_KINDS;
}

export function listDeviceTrustPath(): readonly DeviceTrustPathHop[] {
  return DEVICE_TRUST_PATH;
}

export function listComputeCapabilities(): readonly ComputeCapabilityKind[] {
  return COMPUTE_CAPABILITY_KINDS;
}

export function openDeviceOsFabric() {
  return {
    devices: DEVICE_OS_KINDS.map(
      (os): DeviceProfile => ({
        deviceId: `device-${os}`,
        os,
        xivReplacesHostOs: false,
        trustPath: DEVICE_TRUST_PATH,
        healthState: 'NOT_CONFIGURED',
      }),
    ),
    xivReplacesHostOs: false as const,
    productionLive: false as const,
  };
}

export function xivReplacesHostOperatingSystem(): false {
  return false;
}

export function evaluateDeviceTrust(input: {
  osGranted: boolean;
  xivAppPresent: boolean;
  deviceTrusted: boolean;
  identityBound: boolean;
  universeValidated: boolean;
  guardianApproved: boolean;
}): { allowed: boolean; reason: string; path: readonly DeviceTrustPathHop[] } {
  if (!input.osGranted) return { allowed: false, reason: 'host_os_permission_required', path: DEVICE_TRUST_PATH };
  if (!input.xivAppPresent) return { allowed: false, reason: 'xiv_app_required', path: DEVICE_TRUST_PATH };
  if (!input.deviceTrusted) return { allowed: false, reason: 'device_trust_required', path: DEVICE_TRUST_PATH };
  if (!input.identityBound) return { allowed: false, reason: 'identity_required', path: DEVICE_TRUST_PATH };
  if (!input.universeValidated) return { allowed: false, reason: 'universe_validation_required', path: DEVICE_TRUST_PATH };
  if (!input.guardianApproved) return { allowed: false, reason: 'guardian_required', path: DEVICE_TRUST_PATH };
  return { allowed: true, reason: 'device_trust_ok', path: DEVICE_TRUST_PATH };
}

export function openComputeFabric() {
  return {
    providers: COMPUTE_CAPABILITY_KINDS.map(
      (kind): ComputeProvider => ({
        providerId: `compute-${kind}`,
        kind,
        nvidiaIsAuthorization: false,
        healthState: 'NOT_CONFIGURED',
        productionLive: false,
      }),
    ),
    nvidiaIsAuthorization: false as const,
    productionLive: false as const,
  };
}

export function nvidiaIsAuthorizationLayer(): false {
  return false;
}

export function createComputeJob(input: {
  jobId: string;
  providerId: string;
  tenantId: string;
  universeId: string;
  budgetCeiling: number;
  claimsNvidiaAuthority?: boolean;
}): { allowed: true; job: ComputeJob; policy: ComputePolicy; budget: ComputeBudget } | { allowed: false; reason: string } {
  if (input.claimsNvidiaAuthority === true) {
    return { allowed: false, reason: 'nvidia_is_not_authorization' };
  }
  if (input.budgetCeiling <= 0) {
    return { allowed: false, reason: 'budget_required' };
  }
  return {
    allowed: true,
    job: {
      jobId: input.jobId,
      providerId: input.providerId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      budgetBounded: true,
    },
    policy: {
      policyId: `policy-${input.jobId}`,
      nvidiaAuthorization: false,
      requiresGuardian: true,
    },
    budget: {
      budgetId: `budget-${input.jobId}`,
      ceiling: input.budgetCeiling,
      selfExpandable: false,
    },
  };
}
