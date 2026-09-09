/**
 * 62L-BY Multi-Device Agent Runtime — handoff/checkpointing across devices;
 * offline island mode; reconcile safely. Authority does not transfer via handoff.
 * Unverified device → UNAVAILABLE. Freshness-sensitive offline → STALE/WAITING_DATA.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BY_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  HANDOFF_NO_AUTHORITY,
  OFFLINE_ISLAND_STALE,
  UNVERIFIED_DEVICE_UNAVAILABLE,
  containsForbiddenPrivateFields,
  type ByActor,
  type FreshnessLabel,
} from './hardware-cortex-synapse-compiler-types';

export type DeviceRuntimeRecord = {
  id: string;
  deviceId: string;
  enrolled: boolean;
  verified: boolean;
  status: 'available' | 'unavailable' | 'offline_island';
  authorityLevel: number;
  permissionLevel: number;
  createdAt: string;
  actorId: string;
  reason: string;
};

export type DeviceCheckpoint = {
  id: string;
  deviceId: string;
  taskId: string;
  payload: Record<string, unknown>;
  authorityLevel: number;
  permissionLevel: number;
  createdAt: string;
  actorId: string;
};

export type DeviceHandoff = {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  checkpointId: string;
  preservedCheckpoint: boolean;
  authorityTransferred: false;
  permissionTransferred: false;
  status: 'accepted' | 'denied' | 'unavailable';
  createdAt: string;
  actorId: string;
  reason: string;
};

export type OfflineIslandQuery = {
  id: string;
  deviceId: string;
  freshnessSensitive: boolean;
  freshness: FreshnessLabel;
  status: 'ok' | 'stale' | 'waiting_data' | 'denied';
  createdAt: string;
  actorId: string;
  reason: string;
};

type Store = {
  devices: DeviceRuntimeRecord[];
  checkpoints: DeviceCheckpoint[];
  handoffs: DeviceHandoff[];
  islandQueries: OfflineIslandQuery[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-device-agent-runtime.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    devices: [],
    checkpoints: [],
    handoffs: [],
    islandQueries: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function multiDeviceRuntimeHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4: BY_LOCKS.L4_AUTONOMY_ENABLED,
    handoffTransfersAuthority: BY_LOCKS.HANDOFF_TRANSFERS_AUTHORITY,
    unverifiedDeviceAvailable: BY_LOCKS.UNVERIFIED_DEVICE_RUNTIME_AVAILABLE,
    offlineIslandBounded: BY_LOCKS.OFFLINE_ISLAND_BOUNDED,
  };
}

export async function enrollDeviceRuntime(input: {
  deviceId: string;
  enrolled?: boolean;
  verified?: boolean;
  authorityLevel?: number;
  permissionLevel?: number;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const enrolled = input.enrolled ?? false;
  const verified = input.verified ?? false;
  const available = enrolled && verified;
  const record: DeviceRuntimeRecord = {
    id: id('dev'),
    deviceId: input.deviceId.trim(),
    enrolled,
    verified,
    status: available ? 'available' : 'unavailable',
    authorityLevel: available ? (input.authorityLevel ?? 0) : 0,
    permissionLevel: available ? (input.permissionLevel ?? 0) : 0,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: available
      ? 'DEVICE_RUNTIME_AVAILABLE_VERIFIED'
      : UNVERIFIED_DEVICE_UNAVAILABLE,
  };
  const store = await load(root);
  store.devices = store.devices.filter((d) => d.deviceId !== record.deviceId);
  store.devices.push(record);
  await save(root, store);
  return {
    accepted: available,
    status: record.status,
    reason: record.reason,
    device: record,
  };
}

export async function resolveDevice(deviceId: string, root = process.cwd()) {
  const store = await load(root);
  return store.devices.find((d) => d.deviceId === deviceId) ?? null;
}

/**
 * Unverified / unenrolled device runtime → UNAVAILABLE.
 */
export async function useDeviceRuntime(input: {
  deviceId: string;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const device = await resolveDevice(input.deviceId, root);
  if (!device || device.status !== 'available' || !device.verified || !device.enrolled) {
    return {
      accepted: false as const,
      status: 'unavailable' as const,
      reason: UNVERIFIED_DEVICE_UNAVAILABLE,
      device,
    };
  }
  return {
    accepted: true as const,
    status: 'available' as const,
    reason: 'DEVICE_RUNTIME_OK',
    device,
  };
}

export async function createDeviceCheckpoint(input: {
  deviceId: string;
  taskId: string;
  payload?: Record<string, unknown>;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      checkpoint: null,
    };
  }
  const device = await resolveDevice(input.deviceId, root);
  if (!device || device.status !== 'available') {
    return {
      accepted: false as const,
      reason: UNVERIFIED_DEVICE_UNAVAILABLE,
      checkpoint: null,
    };
  }
  const checkpoint: DeviceCheckpoint = {
    id: id('ckpt'),
    deviceId: input.deviceId,
    taskId: input.taskId,
    payload: input.payload ?? {},
    authorityLevel: device.authorityLevel,
    permissionLevel: device.permissionLevel,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  const store = await load(root);
  store.checkpoints.push(checkpoint);
  await save(root, store);
  return { accepted: true as const, reason: 'CHECKPOINT_CREATED', checkpoint };
}

/**
 * Handoff preserves checkpoint; authority/permission do NOT transfer via handoff.
 */
export async function handoffDeviceCheckpoint(input: {
  fromDeviceId: string;
  toDeviceId: string;
  checkpointId: string;
  attemptAuthorityTransfer?: boolean;
  attemptPermissionTransfer?: boolean;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const checkpoint = store.checkpoints.find((c) => c.id === input.checkpointId);
  const from = store.devices.find((d) => d.deviceId === input.fromDeviceId);
  const to = store.devices.find((d) => d.deviceId === input.toDeviceId);

  if (!checkpoint || !from || from.status !== 'available') {
    const handoff: DeviceHandoff = {
      id: id('hof'),
      fromDeviceId: input.fromDeviceId,
      toDeviceId: input.toDeviceId,
      checkpointId: input.checkpointId,
      preservedCheckpoint: false,
      authorityTransferred: false,
      permissionTransferred: false,
      status: 'unavailable',
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: UNVERIFIED_DEVICE_UNAVAILABLE,
    };
    store.handoffs.push(handoff);
    await save(root, store);
    return { accepted: false as const, handoff };
  }

  if (!to || to.status !== 'available' || !to.verified) {
    const handoff: DeviceHandoff = {
      id: id('hof'),
      fromDeviceId: input.fromDeviceId,
      toDeviceId: input.toDeviceId,
      checkpointId: input.checkpointId,
      preservedCheckpoint: true,
      authorityTransferred: false,
      permissionTransferred: false,
      status: 'unavailable',
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: UNVERIFIED_DEVICE_UNAVAILABLE,
    };
    store.handoffs.push(handoff);
    await save(root, store);
    return { accepted: false as const, handoff };
  }

  // Authority never transfers via handoff — even if requested.
  if (input.attemptAuthorityTransfer || input.attemptPermissionTransfer) {
    const handoff: DeviceHandoff = {
      id: id('hof'),
      fromDeviceId: input.fromDeviceId,
      toDeviceId: input.toDeviceId,
      checkpointId: input.checkpointId,
      preservedCheckpoint: true,
      authorityTransferred: false,
      permissionTransferred: false,
      status: 'accepted',
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: HANDOFF_NO_AUTHORITY,
    };
    // Re-bind checkpoint to target device without raising authority.
    store.checkpoints.push({
      ...checkpoint,
      id: id('ckpt'),
      deviceId: to.deviceId,
      authorityLevel: Math.min(checkpoint.authorityLevel, to.authorityLevel),
      permissionLevel: Math.min(checkpoint.permissionLevel, to.permissionLevel),
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
    });
    store.handoffs.push(handoff);
    await save(root, store);
    return {
      accepted: true as const,
      authorityTransferred: false as const,
      permissionTransferred: false as const,
      preservedCheckpoint: true as const,
      handoff,
    };
  }

  const handoff: DeviceHandoff = {
    id: id('hof'),
    fromDeviceId: input.fromDeviceId,
    toDeviceId: input.toDeviceId,
    checkpointId: input.checkpointId,
    preservedCheckpoint: true,
    authorityTransferred: false,
    permissionTransferred: false,
    status: 'accepted',
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: HANDOFF_NO_AUTHORITY,
  };
  store.checkpoints.push({
    ...checkpoint,
    id: id('ckpt'),
    deviceId: to.deviceId,
    authorityLevel: Math.min(checkpoint.authorityLevel, to.authorityLevel),
    permissionLevel: Math.min(checkpoint.permissionLevel, to.permissionLevel),
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
  });
  store.handoffs.push(handoff);
  await save(root, store);
  return {
    accepted: true as const,
    authorityTransferred: false as const,
    permissionTransferred: false as const,
    preservedCheckpoint: true as const,
    handoff,
  };
}

/**
 * Offline island mode: freshness-sensitive queries → STALE / WAITING_DATA.
 */
export async function queryOfflineIsland(input: {
  deviceId: string;
  freshnessSensitive: boolean;
  islandFreshness?: FreshnessLabel;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const device = store.devices.find((d) => d.deviceId === input.deviceId);
  if (!device) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      reason: UNVERIFIED_DEVICE_UNAVAILABLE,
      query: null,
    };
  }

  const freshness =
    input.islandFreshness ??
    (input.freshnessSensitive ? 'waiting_data' : 'fresh');

  if (input.freshnessSensitive && (freshness === 'stale' || freshness === 'waiting_data' || freshness === 'unknown')) {
    const query: OfflineIslandQuery = {
      id: id('isl'),
      deviceId: input.deviceId,
      freshnessSensitive: true,
      freshness: freshness === 'unknown' ? 'waiting_data' : freshness,
      status: freshness === 'stale' ? 'stale' : 'waiting_data',
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: OFFLINE_ISLAND_STALE,
    };
    store.islandQueries.push(query);
    // Mark device as offline island (bounded).
    device.status = 'offline_island';
    await save(root, store);
    return {
      accepted: false as const,
      status: query.status,
      reason: OFFLINE_ISLAND_STALE,
      query,
    };
  }

  const query: OfflineIslandQuery = {
    id: id('isl'),
    deviceId: input.deviceId,
    freshnessSensitive: input.freshnessSensitive,
    freshness,
    status: 'ok',
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: 'OFFLINE_ISLAND_BOUNDED_OK',
  };
  store.islandQueries.push(query);
  await save(root, store);
  return { accepted: true as const, status: 'ok' as const, reason: query.reason, query };
}

export async function listDeviceHandoffs(root = process.cwd()) {
  return (await load(root)).handoffs;
}
