import type {
  AcceleratorSupport,
  CapabilityDescriptor,
  CapabilityDomain,
  CapabilityTier,
  HardwareLane,
  ParsedCapability,
  RuntimeCapabilityRecord,
  VendorSupportState,
} from './types';
import { TIER_RANK } from './types';

/**
 * XHAL — XIV Hardware Abstraction Layer (story section 2).
 *
 * XIV describes hardware by capability, never by vendor assumption. A lane is
 * only usable once it has been proven individually, so every lane ships as
 * `unproven` and can only be advanced by an authorized operator that supplies
 * validation evidence.
 */

const LANE_SEEDS: readonly Omit<HardwareLane, 'support' | 'evidence' | 'validatedAt' | 'validatedBy'>[] = [
  { id: 'intel_x86_64', label: 'Intel CPU (x86_64)', architecture: 'x86_64', cpuVendor: 'intel', gpuVendor: 'none' },
  { id: 'amd_x86_64', label: 'AMD CPU (x86_64)', architecture: 'x86_64', cpuVendor: 'amd', gpuVendor: 'none' },
  {
    id: 'nvidia_cuda_x86_64',
    label: 'NVIDIA GPU on x86_64 host',
    architecture: 'x86_64',
    cpuVendor: 'intel',
    gpuVendor: 'nvidia',
  },
  {
    id: 'nvidia_cuda_amd_host',
    label: 'NVIDIA GPU on AMD host',
    architecture: 'x86_64',
    cpuVendor: 'amd',
    gpuVendor: 'nvidia',
  },
  { id: 'amd_rocm', label: 'AMD GPU (ROCm)', architecture: 'x86_64', cpuVendor: 'amd', gpuVendor: 'amd' },
  { id: 'arm64_generic', label: 'ARM processor', architecture: 'arm64', cpuVendor: 'arm', gpuVendor: 'none' },
  { id: 'apple_silicon', label: 'Apple silicon', architecture: 'arm64', cpuVendor: 'apple', gpuVendor: 'apple' },
  {
    id: 'qualcomm_mobile',
    label: 'Qualcomm mobile processor',
    architecture: 'arm64',
    cpuVendor: 'qualcomm',
    gpuVendor: 'qualcomm',
  },
  { id: 'cloud_cpu_ampere', label: 'Cloud ARM CPU', architecture: 'arm64', cpuVendor: 'ampere', gpuVendor: 'none' },
];

export function createHardwareSupportMatrix(): Map<string, HardwareLane> {
  const matrix = new Map<string, HardwareLane>();
  for (const seed of LANE_SEEDS) {
    matrix.set(seed.id, { ...seed, support: 'unproven', evidence: [], validatedAt: null, validatedBy: null });
  }
  return matrix;
}

export function laneIdFor(hardware: Pick<RuntimeCapabilityRecord, 'architecture' | 'cpuVendor' | 'gpuVendor'>): string {
  for (const lane of LANE_SEEDS) {
    if (
      lane.architecture === hardware.architecture &&
      lane.cpuVendor === hardware.cpuVendor &&
      lane.gpuVendor === hardware.gpuVendor
    ) {
      return lane.id;
    }
  }
  return `unmodelled:${hardware.architecture}:${hardware.cpuVendor}:${hardware.gpuVendor}`;
}

export function laneSupport(matrix: ReadonlyMap<string, HardwareLane>, laneId: string): VendorSupportState {
  return matrix.get(laneId)?.support ?? 'unproven';
}

/* ------------------------------------------------------------------ */
/* Capability descriptors                                              */
/* ------------------------------------------------------------------ */

const DOMAINS: readonly CapabilityDomain[] = ['cpu', 'gpu', 'npu', 'storage', 'ui'];
const TIERS: readonly CapabilityTier[] = ['tiny', 'small', 'medium', 'large'];

export function parseCapability(descriptor: CapabilityDescriptor): ParsedCapability | null {
  const parts = descriptor.split('.');
  if (parts.length !== 3) return null;
  const [domain, fn, tier] = parts;
  if (!DOMAINS.includes(domain as CapabilityDomain)) return null;
  if (!TIERS.includes(tier as CapabilityTier)) return null;
  if (!fn) return null;
  return { domain: domain as CapabilityDomain, fn, tier: tier as CapabilityTier };
}

/** A node satisfies a request when it offers the same domain and function at an equal or higher tier. */
export function capabilitySatisfies(offered: CapabilityDescriptor, requested: CapabilityDescriptor): boolean {
  const a = parseCapability(offered);
  const b = parseCapability(requested);
  if (!a || !b) return false;
  if (a.domain !== b.domain || a.fn !== b.fn) return false;
  return TIER_RANK[a.tier] >= TIER_RANK[b.tier];
}

export function requiresAccelerator(descriptor: CapabilityDescriptor): boolean {
  const parsed = parseCapability(descriptor);
  return parsed?.domain === 'gpu' || parsed?.domain === 'npu';
}

/* ------------------------------------------------------------------ */
/* Capability derivation                                               */
/* ------------------------------------------------------------------ */

function memoryTier(memoryAvailableMb: number): CapabilityTier {
  if (memoryAvailableMb >= 65_536) return 'large';
  if (memoryAvailableMb >= 16_384) return 'medium';
  if (memoryAvailableMb >= 4_096) return 'small';
  return 'tiny';
}

function acceleratorTier(hardware: RuntimeCapabilityRecord): CapabilityTier {
  if (hardware.gpuVendor === 'nvidia') return memoryTier(hardware.memoryAvailableMb);
  if (hardware.gpuVendor === 'amd' || hardware.gpuVendor === 'apple') {
    return hardware.memoryAvailableMb >= 16_384 ? 'medium' : 'small';
  }
  return 'tiny';
}

const GPU_ACCELERATORS: readonly AcceleratorSupport[] = ['gpu_cuda', 'gpu_rocm', 'gpu_metal'];

/**
 * Derives the capability descriptors a node may offer from its reported
 * hardware. Declared capabilities are intersected with this, so a node cannot
 * advertise more than its hardware supports by simply claiming it.
 */
export function deriveCapabilities(hardware: RuntimeCapabilityRecord): CapabilityDescriptor[] {
  const derived = new Set<CapabilityDescriptor>();
  const cpuTier = memoryTier(hardware.memoryAvailableMb);

  derived.add(`cpu.analysis.${cpuTier}`);
  derived.add('cpu.analysis.tiny');
  derived.add(`cpu.inference.${cpuTier === 'large' ? 'medium' : cpuTier}`);
  derived.add(`cpu.embedding.${cpuTier}`);
  derived.add(`storage.cache.${memoryTier(hardware.storageAvailableMb)}`);

  if (hardware.deviceClass === 'mobile_phone' || hardware.deviceClass === 'tablet' || hardware.deviceClass === 'laptop') {
    derived.add('ui.approval.tiny');
    derived.add('ui.notification.tiny');
  }

  const hasGpu = hardware.acceleratorSupport.some((support) => GPU_ACCELERATORS.includes(support));
  if (hasGpu && hardware.gpuVendor !== 'none' && hardware.gpuVendor !== 'unknown') {
    const tier = acceleratorTier(hardware);
    derived.add(`gpu.inference.${tier}`);
    derived.add(`gpu.embedding.${tier}`);
    derived.add(`gpu.vision.${tier}`);
    derived.add(`gpu.simulation.${tier}`);
  }

  if (hardware.acceleratorSupport.includes('npu')) {
    derived.add('npu.inference.small');
  }

  return [...derived].sort();
}

export function reconcileCapabilities(
  hardware: RuntimeCapabilityRecord,
  declared: readonly CapabilityDescriptor[],
): CapabilityDescriptor[] {
  const derived = deriveCapabilities(hardware);
  if (declared.length === 0) return derived;
  return declared
    .filter((descriptor) => parseCapability(descriptor) !== null)
    .filter((descriptor) => derived.some((offered) => capabilitySatisfies(offered, descriptor)))
    .sort();
}

/* ------------------------------------------------------------------ */
/* Reporting hygiene (section 5)                                       */
/* ------------------------------------------------------------------ */

const PRIVATE_FIELDS = [
  'serialNumber',
  'hostname',
  'userName',
  'macAddress',
  'imei',
  'installedApps',
  'filePaths',
  'ipAddress',
] as const;

/**
 * Strips anything a node might volunteer that XIV has no reason to hold. The
 * fabric only ever persists the capability record shape from section 2.
 */
export function sanitizeCapabilityReport(reported: RuntimeCapabilityRecord & Record<string, unknown>): {
  hardware: RuntimeCapabilityRecord;
  dropped: string[];
} {
  const dropped: string[] = [];
  for (const field of PRIVATE_FIELDS) {
    if (field in reported) dropped.push(field);
  }
  for (const key of Object.keys(reported)) {
    if (!ALLOWED_HARDWARE_KEYS.has(key) && !dropped.includes(key)) dropped.push(key);
  }

  const hardware: RuntimeCapabilityRecord = {
    runtimeNode: reported.runtimeNode,
    deviceClass: reported.deviceClass,
    architecture: reported.architecture,
    cpuVendor: reported.cpuVendor,
    cpuFamily: reported.cpuFamily,
    gpuVendor: reported.gpuVendor,
    gpuFamily: reported.gpuFamily,
    memoryAvailableMb: reported.memoryAvailableMb,
    storageAvailableMb: reported.storageAvailableMb,
    networkState: reported.networkState,
    acceleratorSupport: [...reported.acceleratorSupport],
    energyState: { ...reported.energyState },
    thermalState: reported.thermalState,
    securityState: { ...reported.securityState },
    trustLevel: reported.trustLevel,
    region: reported.region,
    tenantScope: { ...reported.tenantScope },
    runtimeVersion: reported.runtimeVersion,
    lastAttestation: reported.lastAttestation,
  };

  return { hardware, dropped };
}

const ALLOWED_HARDWARE_KEYS = new Set<string>([
  'runtimeNode',
  'deviceClass',
  'architecture',
  'cpuVendor',
  'cpuFamily',
  'gpuVendor',
  'gpuFamily',
  'memoryAvailableMb',
  'storageAvailableMb',
  'networkState',
  'acceleratorSupport',
  'energyState',
  'thermalState',
  'securityState',
  'trustLevel',
  'region',
  'tenantScope',
  'runtimeVersion',
  'lastAttestation',
]);
