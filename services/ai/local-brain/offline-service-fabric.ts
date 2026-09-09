import { probeHardware, type HardwareCapability } from './hardware-probe';
import { localModelStatus } from './local-model';
import { cloudPeerSlots } from './cloud-peer-adapters';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { isAllowedLocalCommand } from './local-command-runner';
import type { KernelProfileKind, KernelServiceName } from './universe-os-types';

export type CapabilityPackageId =
  | 'offline_kernel'
  | 'offline_research'
  | 'offline_coding'
  | 'local_llm'
  | 'memory_journal'
  | 'secure_ipc'
  | 'snapshot_restore';

export type CapabilityPackage = {
  id: CapabilityPackageId;
  profile: KernelProfileKind;
  services: KernelServiceName[];
  state: 'AVAILABLE' | 'UNAVAILABLE' | 'WAITING_DATA';
  cloudRequired: false;
  notes: string;
};

export type KernelProfile = {
  kind: KernelProfileKind;
  maxConcurrentServices: number;
  maxJournalBytes: number;
  allowsPeerReplication: boolean;
  allowsCloudExtensions: false;
  physicalDeviceControl: false;
};

export type SupervisedService = {
  name: KernelServiceName;
  state: 'stopped' | 'running' | 'degraded' | 'quarantined';
  lastTickAt?: string;
  restarts: number;
};

export type HardwareSchedule = {
  cpu: HardwareCapability;
  selectedAccelerator: HardwareCapability;
  reason: string;
  physicalDeviceControl: false;
};

type FabricStore = {
  services: SupervisedService[];
  packages: CapabilityPackage[];
};

const ALL_SERVICES: KernelServiceName[] = [
  'ceo_policy',
  'service_registry',
  'offline_supervisor',
  'offline_scheduler',
  'job_allocator',
  'memory_router',
  'local_model',
  'secure_ipc',
  'journal',
  'snapshot',
  'quarantine',
];

const DESKTOP_PROFILE: KernelProfile = {
  kind: 'desktop',
  maxConcurrentServices: 11,
  maxJournalBytes: 8_000_000,
  allowsPeerReplication: true,
  allowsCloudExtensions: false,
  physicalDeviceControl: false,
};

const MOBILE_PROFILE: KernelProfile = {
  kind: 'mobile_microkernel',
  maxConcurrentServices: 6,
  maxJournalBytes: 512_000,
  allowsPeerReplication: true,
  allowsCloudExtensions: false,
  physicalDeviceControl: false,
};

function fabricPath(root: string) {
  return xivLocalPath(root, 'offline-service-fabric.json');
}

export function kernelProfile(kind: KernelProfileKind): KernelProfile {
  return kind === 'mobile_microkernel' ? { ...MOBILE_PROFILE } : { ...DESKTOP_PROFILE };
}

export function servicesForProfile(kind: KernelProfileKind): KernelServiceName[] {
  if (kind === 'mobile_microkernel') {
    return ['ceo_policy', 'service_registry', 'offline_supervisor', 'memory_router', 'journal', 'quarantine'];
  }
  return [...ALL_SERVICES];
}

export async function installCapabilityPackages(input: {
  profile: KernelProfileKind;
  root?: string;
}): Promise<CapabilityPackage[]> {
  const model = await localModelStatus();
  const packages: CapabilityPackage[] = [
    {
      id: 'offline_kernel',
      profile: input.profile,
      services: servicesForProfile(input.profile),
      state: 'AVAILABLE',
      cloudRequired: false,
      notes: 'Local Universe OS kernel does not require cloud.',
    },
    {
      id: 'offline_research',
      profile: input.profile,
      services: ['memory_router', 'journal'],
      state: 'AVAILABLE',
      cloudRequired: false,
      notes: 'Research continues on local Knowledge Lake / retrieval.',
    },
    {
      id: 'offline_coding',
      profile: input.profile,
      services: ['job_allocator'],
      state: isAllowedLocalCommand('git_status') ? 'AVAILABLE' : 'UNAVAILABLE',
      cloudRequired: false,
      notes: 'Allowlisted local commands only.',
    },
    {
      id: 'local_llm',
      profile: input.profile,
      services: ['local_model'],
      state: model.availability === 'AVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE',
      cloudRequired: false,
      notes: model.reason,
    },
    {
      id: 'memory_journal',
      profile: input.profile,
      services: ['journal', 'memory_router'],
      state: 'AVAILABLE',
      cloudRequired: false,
      notes: 'CEO-sealed records are never auto-packaged for replication.',
    },
    {
      id: 'secure_ipc',
      profile: input.profile,
      services: ['secure_ipc'],
      state: 'AVAILABLE',
      cloudRequired: false,
      notes: 'Reuses 62L-AE HMAC envelopes; sealed bodies stay redacted.',
    },
    {
      id: 'snapshot_restore',
      profile: input.profile,
      services: ['snapshot'],
      state: 'AVAILABLE',
      cloudRequired: false,
      notes: 'Distributable snapshots exclude the CEO sealed vault.',
    },
  ];
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<FabricStore>(fabricPath(root), { services: [], packages: [] });
  store.packages = packages;
  await writeJsonFileAtomic(fabricPath(root), store);
  return packages;
}

export async function superviseServices(input: {
  profile: KernelProfileKind;
  quarantine?: boolean;
  root?: string;
}): Promise<SupervisedService[]> {
  const profile = kernelProfile(input.profile);
  const names = servicesForProfile(input.profile).slice(0, profile.maxConcurrentServices);
  const model = await localModelStatus();
  const services: SupervisedService[] = names.map((name) => {
    if (input.quarantine) {
      const essential = name === 'ceo_policy' || name === 'quarantine' || name === 'offline_supervisor';
      return {
        name,
        state: essential ? 'running' : 'quarantined',
        lastTickAt: new Date().toISOString(),
        restarts: 0,
      };
    }
    if (name === 'local_model' && model.availability !== 'AVAILABLE') {
      return { name, state: 'degraded', lastTickAt: new Date().toISOString(), restarts: 0 };
    }
    return { name, state: 'running', lastTickAt: new Date().toISOString(), restarts: 0 };
  });
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<FabricStore>(fabricPath(root), { services: [], packages: [] });
  store.services = services;
  await writeJsonFileAtomic(fabricPath(root), store);
  return services;
}

export async function scheduleHardwareAware(input: { root?: string } = {}): Promise<HardwareSchedule> {
  const probed = await probeHardware();
  const cpu = probed.find((item) => item.kind === 'cpu') ?? probed[0];
  const accelerator =
    probed.find((item) => item.availability === 'AVAILABLE' && item.kind !== 'cpu') ?? cpu;
  void input.root;
  return {
    cpu,
    selectedAccelerator: accelerator,
    reason:
      accelerator.kind === 'cpu'
        ? 'No verified accelerator; CPU is the eligible offline scheduler.'
        : `Using verified local accelerator ${accelerator.kind}.`,
    physicalDeviceControl: false,
  };
}

export function cloudExtensionsRemainUnavailable() {
  return cloudPeerSlots().map((slot) => ({
    peer: slot.peer,
    state: slot.state,
    optionalExtension: true as const,
    requiredForBoot: false as const,
  }));
}
