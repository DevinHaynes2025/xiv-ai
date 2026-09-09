/**
 * 62L-DU Module B — Supply Chain & Chip Knowledge Grid.
 * AMD/NVIDIA/CPU/GPU/NPU capability mapping; authorized sources only.
 * Chip mapping ≠ remote control of physical fabs/devices.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CHIP_NEQ_FAB_CONTROL,
  MAX_CHIP_MAPPINGS,
  UNAUTHORIZED_CHIP_SOURCE,
  type DuActor,
} from './universal-industry-intelligence-os-types';

export type ChipFamily = 'AMD' | 'NVIDIA' | 'CPU' | 'GPU' | 'NPU' | 'OTHER';

export type ChipCapabilityMapping = {
  id: string;
  family: ChipFamily;
  workloadHighway: string;
  sourceAuthorized: boolean;
  fabRemoteControl: false;
  status: 'mapped' | 'denied';
  reason: string;
  createdAt: string;
};

export type FabControlAttempt = {
  id: string;
  mappingId: string;
  attemptRemoteControl: boolean;
  status: 'denied';
  fabRemoteControl: false;
  reason: string;
  at: string;
};

type Store = {
  mappings: ChipCapabilityMapping[];
  fabAttempts: FabControlAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'supply-chain-chip-knowledge-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { mappings: [], fabAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function supplyChainChipKnowledgeGridHonesty() {
  return {
    unauthorizedSourceAllowed: false,
    chipMappingEqFabRemoteControl: false,
    authorizedPublicLicensedCustomerOwnedOnly: true,
    l4AutonomyEnabled: false,
  };
}

export async function mapChipCapability(input: {
  family: ChipFamily;
  workloadHighway: string;
  sourceAuthorized: boolean;
  attemptFabRemoteControl?: boolean;
  root: string;
  actor: DuActor;
}): Promise<ChipCapabilityMapping> {
  const store = await load(input.root);
  void input.actor;
  if (store.mappings.length >= MAX_CHIP_MAPPINGS) {
    throw new Error('MAX_CHIP_MAPPINGS_REACHED');
  }
  const denied =
    !input.sourceAuthorized || input.attemptFabRemoteControl === true;
  const mapping: ChipCapabilityMapping = {
    id: id('duchip'),
    family: input.family,
    workloadHighway: input.workloadHighway.trim(),
    sourceAuthorized: input.sourceAuthorized,
    fabRemoteControl: false,
    status: denied ? 'denied' : 'mapped',
    reason: !input.sourceAuthorized
      ? UNAUTHORIZED_CHIP_SOURCE
      : input.attemptFabRemoteControl
        ? CHIP_NEQ_FAB_CONTROL
        : 'CHIP_CAPABILITY_MAPPED_AUTHORIZED_SOURCE',
    createdAt: new Date().toISOString(),
  };
  store.mappings.push(mapping);
  await save(input.root, store);
  return mapping;
}

export async function attemptFabRemoteControl(input: {
  mappingId: string;
  attemptRemoteControl: boolean;
  root: string;
  actor: DuActor;
}): Promise<FabControlAttempt> {
  const store = await load(input.root);
  void input.actor;
  const attempt: FabControlAttempt = {
    id: id('dufab'),
    mappingId: input.mappingId,
    attemptRemoteControl: input.attemptRemoteControl,
    status: 'denied',
    fabRemoteControl: false,
    reason: CHIP_NEQ_FAB_CONTROL,
    at: new Date().toISOString(),
  };
  store.fabAttempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
