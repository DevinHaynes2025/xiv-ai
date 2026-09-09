/**
 * 62L-DY Module D — Universal Device/Chip Scheduler.
 * CPU / GPU / NPU / mobile / edge scheduling; offline continuity; evidence gates.
 * RUNNING_VERIFIED needs heartbeat/runtime evidence.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DEVICE_EVIDENCE_REQUIRED,
  MAX_DEVICE_SCHEDULES,
  OFFLINE_WAITING_OR_STOPPED,
  UNAUTHORIZED_DEVICE_SCHEDULE,
  type DyActor,
  type DyEvidenceState,
} from './intelligent-supply-chain-command-types';

export type DeviceKind = 'cpu' | 'gpu' | 'npu' | 'mobile' | 'edge';

export type DeviceScheduleProbe = {
  id: string;
  deviceKind: DeviceKind;
  authorized: boolean;
  heartbeatPresent: boolean;
  poweredNodePresent: boolean;
  claimRunningVerified: boolean;
  state: DyEvidenceState;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  schedules: DeviceScheduleProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-device-chip-scheduler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { schedules: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalDeviceChipSchedulerHonesty() {
  return {
    runningVerifiedNeedsEvidence: true,
    unauthorizedScheduleDenied: true,
    offlineHonestWaitingOrStopped: true,
    fabRemoteControlAuthorized: false,
  };
}

export async function probeDeviceScheduleRunningVerified(input: {
  deviceKind: DeviceKind;
  authorized: boolean;
  heartbeatPresent: boolean;
  claimRunningVerified: boolean;
  root: string;
  actor: DyActor;
}): Promise<DeviceScheduleProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.schedules.length >= MAX_DEVICE_SCHEDULES) {
    throw new Error('MAX_DEVICE_SCHEDULES_REACHED');
  }
  if (!input.authorized) {
    const denied: DeviceScheduleProbe = {
      id: id('dyds'),
      deviceKind: input.deviceKind,
      authorized: false,
      heartbeatPresent: input.heartbeatPresent,
      poweredNodePresent: true,
      claimRunningVerified: input.claimRunningVerified,
      state: 'DENIED',
      status: 'denied',
      reason: UNAUTHORIZED_DEVICE_SCHEDULE,
      at: new Date().toISOString(),
    };
    store.schedules.push(denied);
    await save(input.root, store);
    return denied;
  }
  const verified =
    input.claimRunningVerified && input.heartbeatPresent && input.authorized;
  const probe: DeviceScheduleProbe = {
    id: id('dyds'),
    deviceKind: input.deviceKind,
    authorized: true,
    heartbeatPresent: input.heartbeatPresent,
    poweredNodePresent: true,
    claimRunningVerified: input.claimRunningVerified,
    state: verified ? 'RUNNING_VERIFIED' : 'NOT_VERIFIED',
    status: verified ? 'ok' : 'denied',
    reason: verified ? 'DEVICE_SCHEDULE_RUNNING_VERIFIED' : DEVICE_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.schedules.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeOfflineDeviceNode(input: {
  deviceKind: DeviceKind;
  poweredNodePresent: boolean;
  root: string;
  actor: DyActor;
}): Promise<DeviceScheduleProbe> {
  const store = await load(input.root);
  void input.actor;
  // Deterministic: WAITING_NODE when unpowered (OFFLINE_STOPPED via dedicated probe)
  const finalState: DyEvidenceState = input.poweredNodePresent
    ? 'AVAILABLE'
    : 'WAITING_NODE';
  const probe: DeviceScheduleProbe = {
    id: id('dyoff'),
    deviceKind: input.deviceKind,
    authorized: true,
    heartbeatPresent: false,
    poweredNodePresent: input.poweredNodePresent,
    claimRunningVerified: false,
    state: finalState,
    status: input.poweredNodePresent ? 'ok' : 'denied',
    reason: input.poweredNodePresent
      ? 'POWERED_NODE_PRESENT'
      : OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  store.schedules.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeOfflineDeviceNodeStopped(input: {
  deviceKind: DeviceKind;
  root: string;
  actor: DyActor;
}): Promise<DeviceScheduleProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: DeviceScheduleProbe = {
    id: id('dyofs'),
    deviceKind: input.deviceKind,
    authorized: true,
    heartbeatPresent: false,
    poweredNodePresent: false,
    claimRunningVerified: false,
    state: 'OFFLINE_STOPPED',
    status: 'denied',
    reason: OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  store.schedules.push(probe);
  await save(input.root, store);
  return probe;
}
