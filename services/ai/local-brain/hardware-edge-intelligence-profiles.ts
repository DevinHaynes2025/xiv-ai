/**
 * 62L-CD Hardware / Edge Intelligence Profiles —
 * CPU/GPU/NPU intelligence, chip supply ledgers, low-energy runtime planning,
 * mobile/PC edge profiles.
 * "Mini XIV on every chip" = lightweight compatibility profile ONLY —
 * not stealth installation on chip/device.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CD_LOCKS,
  HONESTY_BANNER,
  MINI_XIV_NO_STEALTH,
  type CdActor,
} from './data-root-local-llm-archive-mesh-types';

export type AcceleratorKind = 'cpu' | 'gpu' | 'npu' | 'dsp' | 'other';
export type EdgeFormFactor = 'mobile' | 'pc' | 'edge_appliance' | 'server';

export type HardwareProfile = {
  id: string;
  label: string;
  accelerators: AcceleratorKind[];
  formFactor: EdgeFormFactor;
  lowEnergyPlan: boolean;
  verified: boolean;
  status: 'plan' | 'unavailable' | 'denied';
  reason: string;
  productionAuthorized: false;
  createdAt: string;
};

export type ChipSupplyLedgerEntry = {
  id: string;
  sku: string;
  provenanceRefs: string[];
  status: 'recorded' | 'waiting_data';
  reason: string;
};

export type MiniXivProfile = {
  id: string;
  targetDeviceId: string;
  compatibilityProfileOnly: true;
  stealthInstall: false;
  installedOnDevice: false;
  status: 'compatibility_profile' | 'denied';
  reason: string;
};

export type LowEnergyPlan = {
  id: string;
  profileId: string;
  recommendationOnly: true;
  mutatesFirmware: false;
  reason: string;
};

type Store = {
  profiles: HardwareProfile[];
  supply: ChipSupplyLedgerEntry[];
  miniXiv: MiniXivProfile[];
  energyPlans: LowEnergyPlan[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'hardware-edge-intelligence-profiles.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    profiles: [],
    supply: [],
    miniXiv: [],
    energyPlans: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function hardwareEdgeHonesty() {
  return {
    banner: HONESTY_BANNER,
    miniXivStealthInstall: CD_LOCKS.MINI_XIV_STEALTH_INSTALL,
    miniXivCompatibilityProfileOnly: CD_LOCKS.MINI_XIV_IS_COMPATIBILITY_PROFILE_ONLY,
    l4AutonomyEnabled: CD_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CD_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function registerHardwareEdgeProfile(input: {
  label: string;
  accelerators: AcceleratorKind[];
  formFactor: EdgeFormFactor;
  verified?: boolean;
  root: string;
  actor: CdActor;
}): Promise<HardwareProfile> {
  const store = await load(input.root);
  const verified = input.verified === true;
  const profile: HardwareProfile = {
    id: id('hwprof'),
    label: input.label,
    accelerators: [...input.accelerators],
    formFactor: input.formFactor,
    lowEnergyPlan: true,
    verified,
    status: verified ? 'plan' : 'unavailable',
    reason: verified
      ? 'HARDWARE_EDGE_PROFILE_PLAN_ONLY'
      : 'UNVERIFIED_HARDWARE_PROFILE_UNAVAILABLE',
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.profiles.push(profile);
  await save(input.root, store);
  return profile;
}

export async function recordChipSupplyLedger(input: {
  sku: string;
  provenanceRefs?: string[];
  root: string;
  actor: CdActor;
}): Promise<ChipSupplyLedgerEntry> {
  const store = await load(input.root);
  const refs = input.provenanceRefs ?? [];
  const entry: ChipSupplyLedgerEntry = {
    id: id('chipldg'),
    sku: input.sku,
    provenanceRefs: refs,
    status: refs.length ? 'recorded' : 'waiting_data',
    reason: refs.length
      ? 'CHIP_SUPPLY_LEDGER_RECORDED'
      : 'CHIP_SUPPLY_PROVENANCE_WAITING_DATA',
  };
  store.supply.push(entry);
  await save(input.root, store);
  return entry;
}

export async function planLowEnergyRuntime(input: {
  profileId: string;
  root: string;
  actor: CdActor;
}): Promise<LowEnergyPlan | { denied: true; reason: string }> {
  const store = await load(input.root);
  const profile = store.profiles.find((p) => p.id === input.profileId);
  if (!profile || profile.status !== 'plan') {
    return { denied: true, reason: 'LOW_ENERGY_PLAN_REQUIRES_VERIFIED_PROFILE' };
  }
  const plan: LowEnergyPlan = {
    id: id('energy'),
    profileId: profile.id,
    recommendationOnly: true,
    mutatesFirmware: false,
    reason: 'LOW_ENERGY_RUNTIME_PLAN_RECOMMENDATION_ONLY',
  };
  store.energyPlans.push(plan);
  await save(input.root, store);
  return plan;
}

/**
 * Emit a Mini XIV compatibility profile. Never stealth-installs on chip/device.
 * Attempts to force install are DENIED.
 */
export async function emitMiniXivCompatibilityProfile(input: {
  targetDeviceId: string;
  forceStealthInstall?: boolean;
  root: string;
  actor: CdActor;
}): Promise<MiniXivProfile> {
  const store = await load(input.root);
  if (input.forceStealthInstall === true) {
    const denied: MiniXivProfile = {
      id: id('minixiv'),
      targetDeviceId: input.targetDeviceId,
      compatibilityProfileOnly: true,
      stealthInstall: false,
      installedOnDevice: false,
      status: 'denied',
      reason: MINI_XIV_NO_STEALTH,
    };
    store.miniXiv.push(denied);
    await save(input.root, store);
    return denied;
  }

  const profile: MiniXivProfile = {
    id: id('minixiv'),
    targetDeviceId: input.targetDeviceId,
    compatibilityProfileOnly: true,
    stealthInstall: false,
    installedOnDevice: false,
    status: 'compatibility_profile',
    reason: MINI_XIV_NO_STEALTH,
  };
  store.miniXiv.push(profile);
  await save(input.root, store);
  return profile;
}
