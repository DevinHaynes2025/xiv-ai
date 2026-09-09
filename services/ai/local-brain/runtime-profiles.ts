import os from 'node:os';

import { probeHardware, type HardwareCapability } from './hardware-probe';
import { acceleratorById } from './accelerator-fabric';
import { COMPUTE_FABRIC_POLICY, selectComputeNode } from './compute-fabric';
import {
  HARDWARE_UNAVAILABLE_UNTIL_VERIFIED,
  VEHICLE_CONTROL_DENIED,
  type AvEvidenceState,
} from './universal-runtime-types';

export type RuntimeProfileId =
  | 'windows_asus_class_pc'
  | 'linux'
  | 'x86_64'
  | 'arm64'
  | 'apple_silicon'
  | 'android'
  | 'ios'
  | 'server'
  | 'approved_edge_embedded';

export type RuntimeProfile = {
  id: RuntimeProfileId;
  family: 'desktop' | 'mobile' | 'server' | 'edge';
  osHint: string[];
  archHint: string[];
  state: 'AVAILABLE' | 'UNAVAILABLE';
  verified: boolean;
  evidence: string[];
  reason: string;
};

export type VehicleCapability =
  | 'infotainment_read'
  | 'navigation_data_read'
  | 'business_telemetry_read'
  | 'cabin_data_read'
  | 'steering'
  | 'braking'
  | 'throttle'
  | 'propulsion'
  | 'autonomous_drive'
  | 'vehicle_actuation'
  | 'vehicle_control';

export const VEHICLE_DATA_INTERFACES: readonly VehicleCapability[] = [
  'infotainment_read',
  'navigation_data_read',
  'business_telemetry_read',
  'cabin_data_read',
] as const;

export const VEHICLE_CONTROL_CAPABILITIES: readonly VehicleCapability[] = [
  'steering',
  'braking',
  'throttle',
  'propulsion',
  'autonomous_drive',
  'vehicle_actuation',
  'vehicle_control',
] as const;

export type VehicleCapabilityResult = {
  capability: VehicleCapability;
  allowed: boolean;
  executed: false;
  physicalControl: false;
  state: AvEvidenceState;
  reason: string;
  interfaceKind: 'authorized_data' | 'vehicle_control' | 'unknown';
};

const PROFILE_SPECS: Array<{
  id: RuntimeProfileId;
  family: RuntimeProfile['family'];
  osHint: string[];
  archHint: string[];
}> = [
  { id: 'windows_asus_class_pc', family: 'desktop', osHint: ['win32'], archHint: ['x64', 'arm64'] },
  { id: 'linux', family: 'desktop', osHint: ['linux'], archHint: ['x64', 'arm64'] },
  { id: 'x86_64', family: 'desktop', osHint: ['linux', 'win32', 'darwin'], archHint: ['x64'] },
  { id: 'arm64', family: 'desktop', osHint: ['linux', 'win32', 'darwin'], archHint: ['arm64'] },
  { id: 'apple_silicon', family: 'desktop', osHint: ['darwin'], archHint: ['arm64'] },
  { id: 'android', family: 'mobile', osHint: ['android'], archHint: ['arm64', 'x64'] },
  { id: 'ios', family: 'mobile', osHint: ['ios'], archHint: ['arm64'] },
  { id: 'server', family: 'server', osHint: ['linux'], archHint: ['x64', 'arm64'] },
  { id: 'approved_edge_embedded', family: 'edge', osHint: ['linux'], archHint: ['arm64'] },
];

function hostFacts() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model ?? 'unknown',
  };
}

function profileMatchesHost(spec: (typeof PROFILE_SPECS)[number], facts: ReturnType<typeof hostFacts>) {
  if (spec.id === 'apple_silicon') return facts.platform === 'darwin' && facts.arch === 'arm64';
  if (spec.id === 'android' || spec.id === 'ios') return false;
  if (spec.id === 'approved_edge_embedded') return false;
  if (spec.id === 'server') return facts.platform === 'linux';
  return spec.osHint.includes(facts.platform) && spec.archHint.includes(facts.arch);
}

export function listRuntimeProfiles(): RuntimeProfile[] {
  const facts = hostFacts();
  return PROFILE_SPECS.map((spec) => {
    const matched = profileMatchesHost(spec, facts);
    const evidence = matched
      ? [`platform:${facts.platform}`, `arch:${facts.arch}`, `logical_cpus:${facts.cpus}`, `cpu:${facts.cpuModel}`]
      : [`host_platform:${facts.platform}`, `host_arch:${facts.arch}`, HARDWARE_UNAVAILABLE_UNTIL_VERIFIED];
    return {
      id: spec.id,
      family: spec.family,
      osHint: [...spec.osHint],
      archHint: [...spec.archHint],
      state: matched ? ('AVAILABLE' as const) : ('UNAVAILABLE' as const),
      verified: matched,
      evidence,
      reason: matched
        ? 'Host probe matched this profile. Availability is this-host only, not a fleet claim.'
        : 'Hardware is UNAVAILABLE until actually verified on this host. No invented AVAILABLE.',
    };
  });
}

export function getRuntimeProfile(id: RuntimeProfileId) {
  return listRuntimeProfiles().find((item) => item.id === id) ?? null;
}

export function verifyHardwareForProfile(id: RuntimeProfileId) {
  const profile = getRuntimeProfile(id);
  if (!profile) {
    return {
      id,
      state: 'UNAVAILABLE' as const,
      verified: false,
      reason: HARDWARE_UNAVAILABLE_UNTIL_VERIFIED,
    };
  }
  return {
    id,
    state: profile.state,
    verified: profile.verified,
    reason: profile.reason,
    evidence: profile.evidence,
  };
}

export async function probeHostHardware(): Promise<{
  host: ReturnType<typeof hostFacts>;
  capabilities: HardwareCapability[];
  acceleratorSlotsUnavailable: boolean;
  computePolicy: typeof COMPUTE_FABRIC_POLICY;
}> {
  const capabilities = await probeHardware();
  const cuda = acceleratorById('slot_nvidia_cuda');
  const metal = acceleratorById('slot_apple_metal');
  const selected = selectComputeNode({ requiredCapability: 'does-not-exist' });
  return {
    host: hostFacts(),
    capabilities,
    acceleratorSlotsUnavailable: (cuda?.state ?? 'UNAVAILABLE') !== 'AVAILABLE' && (metal?.state ?? 'UNAVAILABLE') !== 'AVAILABLE',
    computePolicy: COMPUTE_FABRIC_POLICY,
  };
}

export function requestVehicleCapability(capability: VehicleCapability): VehicleCapabilityResult {
  if ((VEHICLE_CONTROL_CAPABILITIES as readonly string[]).includes(capability)) {
    return {
      capability,
      allowed: false,
      executed: false,
      physicalControl: false,
      state: 'DENIED',
      reason: VEHICLE_CONTROL_DENIED,
      interfaceKind: 'vehicle_control',
    };
  }
  if ((VEHICLE_DATA_INTERFACES as readonly string[]).includes(capability)) {
    return {
      capability,
      allowed: true,
      executed: false,
      physicalControl: false,
      state: 'PASS',
      reason: 'Authorized data/infotainment/business interface only. No vehicle actuation.',
      interfaceKind: 'authorized_data',
    };
  }
  return {
    capability,
    allowed: false,
    executed: false,
    physicalControl: false,
    state: 'DENIED',
    reason: 'Unknown vehicle capability is not authorized.',
    interfaceKind: 'unknown',
  };
}

export function capabilityGate(input: {
  profileId: RuntimeProfileId;
  vehicleCapability?: VehicleCapability;
}) {
  const hardware = verifyHardwareForProfile(input.profileId);
  const vehicle = input.vehicleCapability ? requestVehicleCapability(input.vehicleCapability) : null;
  const denied = hardware.state === 'UNAVAILABLE' || (vehicle !== null && vehicle.state === 'DENIED');
  return {
    hardware,
    vehicle,
    state: denied ? (vehicle?.state === 'DENIED' ? ('DENIED' as const) : ('UNAVAILABLE' as const)) : ('PASS' as const),
    physicalVehicleActuation: false as const,
  };
}
