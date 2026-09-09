/**
 * 62L-DO Universal Device/Chip Capability Graph —
 * Verified entries only; unverified → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DEVICE_CHIP_UNAVAILABLE,
  DO_LOCKS,
  HONESTY_BANNER,
  MAX_DEVICE_CHIP_ENTRIES,
  type DoActor,
} from './distributed-cognitive-runtime-plugin-mesh-types';

export type DeviceChipEntry = {
  id: string;
  deviceId: string;
  chipId: string;
  capability: string;
  verified: boolean;
  status: 'VERIFIED' | 'UNAVAILABLE' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type DeviceChipLookup = {
  id: string;
  deviceId: string;
  chipId: string;
  capability: string;
  status: 'VERIFIED' | 'UNAVAILABLE';
  reason: string;
  at: string;
};

type Store = {
  entries: DeviceChipEntry[];
  lookups: DeviceChipLookup[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-device-chip-capability-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { entries: [], lookups: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalDeviceChipCapabilityGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    deviceChipVerifiedOnly: DO_LOCKS.DEVICE_CHIP_VERIFIED_ONLY,
    unverifiedAvailable: DO_LOCKS.UNVERIFIED_DEVICE_CHIP_AVAILABLE,
  };
}

export async function registerDeviceChipCapability(input: {
  deviceId: string;
  chipId: string;
  capability: string;
  verified?: boolean;
  root: string;
  actor: DoActor;
}): Promise<DeviceChipEntry> {
  const store = await load(input.root);
  void input.actor;
  if (store.entries.length >= MAX_DEVICE_CHIP_ENTRIES) {
    throw new Error('MAX_DEVICE_CHIP_ENTRIES_REACHED');
  }
  const verified = input.verified === true;
  const entry: DeviceChipEntry = {
    id: id('dochip'),
    deviceId: input.deviceId.trim(),
    chipId: input.chipId.trim(),
    capability: input.capability.trim().toLowerCase(),
    verified,
    status: verified ? 'VERIFIED' : 'UNAVAILABLE',
    reason: verified
      ? 'DEVICE_CHIP_CAPABILITY_VERIFIED'
      : DEVICE_CHIP_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.entries.push(entry);
  await save(input.root, store);
  return entry;
}

export async function lookupDeviceChipCapability(input: {
  deviceId: string;
  chipId: string;
  capability: string;
  root: string;
  actor: DoActor;
}): Promise<DeviceChipLookup> {
  const store = await load(input.root);
  void input.actor;
  const cap = input.capability.trim().toLowerCase();
  const entry = store.entries.find(
    (e) =>
      e.deviceId === input.deviceId &&
      e.chipId === input.chipId &&
      e.capability === cap &&
      e.verified,
  );
  const lookup: DeviceChipLookup = {
    id: id('dolook'),
    deviceId: input.deviceId,
    chipId: input.chipId,
    capability: cap,
    status: entry ? 'VERIFIED' : 'UNAVAILABLE',
    reason: entry ? 'DEVICE_CHIP_CAPABILITY_VERIFIED' : DEVICE_CHIP_UNAVAILABLE,
    at: new Date().toISOString(),
  };
  store.lookups.push(lookup);
  await save(input.root, store);
  return lookup;
}
