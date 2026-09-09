import { xivHardwareIsProductionLive, xivReplacesHostOperatingSystem } from '../ecosystem/hardware';
import { nativeDesktopPackagingState } from '../everywhere/devices';
import type { HardwareCapabilityId, ReferenceDeviceProfile } from './types';
import { HARDWARE_CAPABILITIES, REFERENCE_DEVICE_PROFILES } from './types';

export type OEMPartner = { partnerId: string; contractOnly: true };
export type OEMAgreementReference = { referenceId: string; live: false };
export type OEMRuntimeProfile = { profileId: string; grantsRuntimePrivilege: false };
export type OEMDeviceClass = { classId: string; manufactured: false };
export type OEMDistributionPolicy = { policyId: string };
export type OEMBrandingPolicy = { policyId: string };
export type OEMCapabilityProfile = { profileId: string };
export type OEMSecurityProfile = { profileId: string; secureBootLive: false };
export type OEMUpdatePolicy = { policyId: string };
export type OEMLicensePolicy = { policyId: string; licensingLive: false };

export type HardwareCapability = {
  capability: HardwareCapabilityId;
  available: boolean;
  hostProvides: boolean;
};

export type HardwareProvider = { providerId: string; proven: boolean };
export type HardwareSecurityCapability = { capability: 'SECURE_ELEMENT' | 'TRUSTED_EXECUTION'; live: false };
export type HardwareAIAccelerator = { kind: 'GPU' | 'NPU'; proven: boolean };
export type HardwareSensor = { kind: 'CAMERA' | 'GPS' | 'NFC' | 'BARCODE' | 'MICROPHONE'; available: boolean };
export type HardwareStorageCapability = { encrypted: boolean };
export type HardwareNetworkCapability = { kind: 'NETWORK' | 'SATELLITE_CONNECTIVITY_FUTURE'; available: boolean };
export type HardwareAttestationCapability = { claimed: boolean; evidence: boolean };

export type DeviceEnrollment = {
  deviceId: string;
  enrolled: boolean;
  attested: boolean;
};

export type DeviceAttestation = {
  deviceId: string;
  claimed: boolean;
  hostEvidence: boolean;
};

export type DeviceIdentity = { deviceId: string; hardwareIdentityProven: boolean };
export type DeviceCertificateReference = { reference: string; rawKeyStored: false };
export type DeviceSecurityPosture = { state: 'UNKNOWN' | 'TRUSTED' | 'REVOKED' | 'QUARANTINED' };
export type DevicePolicy = { universeScoped: true };
export type DeviceRevocation = { deviceId: string; revoked: true };
export type DeviceQuarantine = { deviceId: string; quarantined: true };
export type DeviceRecovery = { deviceId: string; humanRequired: true };

export type DeviceUniverseBinding = {
  deviceId: string;
  tenantId: string;
  universeIds: readonly string[];
};

export type DeviceOrganizationBinding = { deviceId: string; organizationId: string };
export type DeviceUserBinding = { deviceId: string; userId: string };
export type DeviceScope = { deviceId: string; perRequest: true };
export type DevicePermission = { capability: string; granted: boolean };
export type DeviceBindingAudit = { eventId: string; deviceId: string };

export type LocalAIRuntime = {
  runtimeId: string;
  authorizedLocalDataOnly: true;
  bypassesGuardian: false;
};

export type LocalModelReference = { modelId: string };
export type LocalModelCapability = { capability: string; localOnly: true };
export type LocalInferencePolicy = { guardianRequired: true };
export type LocalDataScope = { cachedAndAuthorized: boolean };
export type LocalMemoryScope = { privateUncachedDenied: true };
export type LocalRuntimeHealth = { state: 'HEALTHY' | 'UNKNOWN' };

export type SmartDisplaySurface = 'ExecutiveDisplay' | 'WarehouseDisplay' | 'OperationsDisplay' | 'BusinessLiveDisplay';
export type EdgeWorkflowRuntime = { alwaysOnMicrophone: false; surveillanceDefault: false };

export function createOemPartner(partnerId: string): OEMPartner {
  return { partnerId, contractOnly: true };
}

export function oemProfileGrantsRuntimePrivilege(_profile: OEMRuntimeProfile | OEMPartner): false {
  return false;
}

export function oemLicensingIsLive(): false {
  return false;
}

export function hardwareSecureBootIsLive(): false {
  return false;
}

export function secureElementIntegrationIsLive(): false {
  return false;
}

export function xivLaptopExists(): false {
  return false;
}

export function xivPhoneExists(): false {
  return false;
}

export function xivOwnsOperatingSystemKernel(): false {
  void xivReplacesHostOperatingSystem;
  return false;
}

export function referenceProfileIsManufacturedDevice(_profile: ReferenceDeviceProfile): false {
  void REFERENCE_DEVICE_PROFILES;
  return false;
}

export function resolveHardwareCapability(input: {
  capability: HardwareCapabilityId;
  hostProvides: boolean;
}): HardwareCapability {
  void HARDWARE_CAPABILITIES;
  return {
    capability: input.capability,
    hostProvides: input.hostProvides,
    available: input.hostProvides === true && input.capability !== 'SATELLITE_CONNECTIVITY_FUTURE',
  };
}

export function unavailableHardwareCapabilityRemainsUnavailable(capability: HardwareCapability): boolean {
  return capability.hostProvides === false ? capability.available === false : capability.available === capability.hostProvides;
}

export function claimHardwareAttestation(input: { hostAttestationEvidence: boolean }): DeviceAttestation {
  return {
    deviceId: 'device-1',
    hostEvidence: input.hostAttestationEvidence,
    claimed: input.hostAttestationEvidence === true,
  };
}

export function hardwareAttestationClaimedWithoutEvidence(attestation: DeviceAttestation): boolean {
  return attestation.claimed === true && attestation.hostEvidence !== true;
}

export function bindDeviceToUniverses(input: {
  deviceId: string;
  tenantId: string;
  universeIds: readonly string[];
}): DeviceUniverseBinding {
  return { deviceId: input.deviceId, tenantId: input.tenantId, universeIds: input.universeIds };
}

export function deviceBindingBypassesUniversePolicy(): false {
  return false;
}

export function authorizeBoundDeviceRequest(input: {
  binding: DeviceUniverseBinding;
  requestedUniverseId: string;
  revoked?: boolean;
  quarantined?: boolean;
  universePolicyAllows?: boolean;
}) {
  if (input.revoked === true || input.quarantined === true) {
    return { allowed: false as const, reason: 'revoked_device_denied' };
  }
  if (!input.binding.universeIds.includes(input.requestedUniverseId)) {
    return { allowed: false as const, reason: 'device_not_bound_to_requested_universe' };
  }
  if (input.universePolicyAllows !== true) {
    return { allowed: false as const, reason: 'device_binding_cannot_bypass_universe_policy' };
  }
  return { allowed: true as const, scopedPerRequest: true as const };
}

export function invokeLocalAi(input: {
  cachedAndAuthorized: boolean;
  guardianAuthorized: boolean;
  classification?: 'PUBLIC' | 'TENANT_PRIVATE' | 'FOUNDER_RESTRICTED';
}) {
  if (input.classification === 'FOUNDER_RESTRICTED') {
    return { allowed: false as const, reason: 'local_ai_cannot_access_founder_restricted_data' };
  }
  if (input.cachedAndAuthorized !== true) {
    return { allowed: false as const, reason: 'local_ai_cannot_access_uncached_private_data' };
  }
  if (input.guardianAuthorized !== true) {
    return { allowed: false as const, reason: 'local_ai_cannot_bypass_guardian' };
  }
  return { allowed: true as const, bypassesGuardian: false as const };
}

export function localAiBypassesGuardian(): false {
  return false;
}

export function createLocalAiRuntime(): LocalAIRuntime {
  return { runtimeId: 'local-ai', authorizedLocalDataOnly: true, bypassesGuardian: false };
}

export function nativeDesktopBinaryExists(): false {
  void nativeDesktopPackagingState();
  return false;
}

export function alwaysOnMicrophoneEnabled(): false {
  return false;
}

export function surveillanceDefaultEnabled(): false {
  return false;
}

export function hardwareProductionLive(): false {
  return xivHardwareIsProductionLive();
}

export function enrollManagedDevice(input: { deviceId: string; hostAttestationEvidence?: boolean }): DeviceEnrollment {
  return {
    deviceId: input.deviceId,
    enrolled: true,
    attested: input.hostAttestationEvidence === true,
  };
}
