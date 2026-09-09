import { probeHardware } from './hardware-probe';
import { crossOsCompatibility, type DeviceNode } from './device-node-runtime';
import { hostOsClass } from './hybrid-edge-cloud-types';
import type { PackageHardwareClass, PackageManifest, PackageOsClass, PlatformEvidenceState } from './developer-platform-types';

export type CompatibilityResolution = {
  state: PlatformEvidenceState;
  hostOs: PackageOsClass;
  osCompatible: boolean;
  hardwareCompatible: boolean;
  hardware: Array<{ kind: string; availability: string }>;
  reason: string;
  physicalDeviceControl: false;
};

export async function resolvePackageCompatibility(input: {
  manifest: PackageManifest;
  device?: DeviceNode;
}): Promise<CompatibilityResolution> {
  const hostOs = input.device?.osClass ?? hostOsClass();
  const osCompatible = input.manifest.os.includes(hostOs);
  const probed = await probeHardware();
  const hardware = probed.map((item) => ({ kind: item.kind, availability: item.availability }));
  const hardwareCompatible = input.manifest.hardware.every((required: PackageHardwareClass) => {
    if (required === 'cpu') return probed.some((item) => item.kind === 'cpu' && item.availability === 'AVAILABLE');
    const slot = probed.find((item) => item.kind === required);
    return slot?.availability === 'AVAILABLE';
  });
  if (!osCompatible) {
    return {
      state: 'FAIL',
      hostOs,
      osCompatible,
      hardwareCompatible,
      hardware,
      reason: `Package OS list ${input.manifest.os.join(',')} does not include host OS ${hostOs}.`,
      physicalDeviceControl: false,
    };
  }
  if (!hardwareCompatible) {
    const missing = input.manifest.hardware.filter((required) => {
      if (required === 'cpu') return false;
      return probed.find((item) => item.kind === required)?.availability !== 'AVAILABLE';
    });
    return {
      state: 'UNAVAILABLE',
      hostOs,
      osCompatible,
      hardwareCompatible,
      hardware,
      reason: `Required hardware is UNAVAILABLE: ${missing.join(',') || 'unspecified'}.`,
      physicalDeviceControl: false,
    };
  }
  const adapter = crossOsCompatibility(hostOs, hostOs);
  return {
    state: 'PASS',
    hostOs,
    osCompatible,
    hardwareCompatible,
    hardware,
    reason: `Host ${hostOs} + CPU capability match. ${adapter.notes}`,
    physicalDeviceControl: false,
  };
}
