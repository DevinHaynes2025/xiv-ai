/**
 * 62L-DX Module D — Edge/Chip Runtime Federation.
 * AMD/NVIDIA/NPU runtime verification; cross-device workload routing; evidence gates.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CHIP_EVIDENCE_REQUIRED,
  CHIP_NEQ_FAB_CONTROL,
  MAX_CHIP_RUNTIME_PROBES,
  UNAUTHORIZED_CHIP_RUNTIME,
  type DxActor,
} from './autonomous-supply-chain-ops-types';

export type ChipFamily = 'AMD' | 'NVIDIA' | 'NPU' | 'CPU' | 'GPU';

export type ChipRuntimeProbe = {
  id: string;
  family: ChipFamily;
  sourceAuthorized: boolean;
  heartbeatEvidence: boolean;
  claimRunningVerified: boolean;
  runningState: 'RUNNING_VERIFIED' | 'NOT_VERIFIED' | 'UNAVAILABLE';
  fabRemoteControl: false;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type WorkloadRoute = {
  id: string;
  probeId: string;
  targetDevice: string;
  fabRemoteControl: false;
  status: 'routed_sandbox' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  probes: ChipRuntimeProbe[];
  routes: WorkloadRoute[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'edge-chip-runtime-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { probes: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function edgeChipRuntimeFederationHonesty() {
  return {
    runningVerifiedNeedsEvidence: true,
    unauthorizedRuntimeDenied: true,
    routingEqFabRemoteControl: false,
  };
}

export async function probeChipRuntime(input: {
  family: ChipFamily;
  sourceAuthorized: boolean;
  heartbeatEvidence?: boolean;
  claimRunningVerified?: boolean;
  root: string;
  actor: DxActor;
}): Promise<ChipRuntimeProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.probes.length >= MAX_CHIP_RUNTIME_PROBES) {
    throw new Error('MAX_CHIP_RUNTIME_PROBES_REACHED');
  }

  if (!input.sourceAuthorized) {
    const probe: ChipRuntimeProbe = {
      id: id('dxchip'),
      family: input.family,
      sourceAuthorized: false,
      heartbeatEvidence: false,
      claimRunningVerified: input.claimRunningVerified === true,
      runningState: 'UNAVAILABLE',
      fabRemoteControl: false,
      status: 'denied',
      reason: UNAUTHORIZED_CHIP_RUNTIME,
      at: new Date().toISOString(),
    };
    store.probes.push(probe);
    await save(input.root, store);
    return probe;
  }

  const evidence = input.heartbeatEvidence === true;
  const claimed = input.claimRunningVerified === true;
  const probe: ChipRuntimeProbe = {
    id: id('dxchip'),
    family: input.family,
    sourceAuthorized: true,
    heartbeatEvidence: evidence,
    claimRunningVerified: claimed,
    runningState: evidence && claimed ? 'RUNNING_VERIFIED' : 'NOT_VERIFIED',
    fabRemoteControl: false,
    status: claimed && !evidence ? 'denied' : 'ok',
    reason:
      claimed && !evidence
        ? CHIP_EVIDENCE_REQUIRED
        : evidence
          ? 'CHIP_RUNTIME_EVIDENCE_RECORDED_NOT_PRODUCTION_AUTHORIZED'
          : 'CHIP_RUNTIME_NOT_VERIFIED',
    at: new Date().toISOString(),
  };
  store.probes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function routeCrossDeviceWorkload(input: {
  probeId: string;
  targetDevice: string;
  attemptFabRemoteControl?: boolean;
  root: string;
  actor: DxActor;
}): Promise<WorkloadRoute> {
  const store = await load(input.root);
  void input.actor;
  const attempting = input.attemptFabRemoteControl === true;
  const route: WorkloadRoute = {
    id: id('dxroute'),
    probeId: input.probeId,
    targetDevice: input.targetDevice,
    fabRemoteControl: false,
    status: attempting ? 'denied' : 'routed_sandbox',
    reason: attempting
      ? CHIP_NEQ_FAB_CONTROL
      : 'CROSS_DEVICE_ROUTING_SANDBOXED_ADVISORY',
    at: new Date().toISOString(),
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
