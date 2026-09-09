/**
 * 62L-DN Cross-Platform Device Fabric —
 * Verified portability across supported mobile/desktop/edge environments.
 * Unverified platforms → UNAVAILABLE or NOT_TESTED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DN_LOCKS,
  HONESTY_BANNER,
  MAX_DEVICE_PROFILES,
  UNVERIFIED_DEVICE_UNAVAILABLE_OR_NOT_TESTED,
  type DevicePlatform,
  type DnActor,
} from './universal-agent-runtime-os-types';

export type DeviceFabric = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  unverifiedUnavailableOrNotTested: true;
  createdAt: string;
};

export type DeviceProfile = {
  id: string;
  fabricId: string;
  platform: DevicePlatform;
  compatibilityTested: boolean;
  verified: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_TESTED';
  reason: string;
  createdAt: string;
};

type Store = { fabrics: DeviceFabric[]; profiles: DeviceProfile[] };

function storePath(root: string) {
  return xivLocalPath(root, 'cross-platform-device-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { fabrics: [], profiles: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function crossPlatformDeviceFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    unverifiedDeviceAvailable: DN_LOCKS.UNVERIFIED_DEVICE_AVAILABLE,
    unverifiedDeviceUnavailableOrNotTested:
      DN_LOCKS.UNVERIFIED_DEVICE_UNAVAILABLE_OR_NOT_TESTED,
  };
}

export async function bootstrapCrossPlatformDeviceFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DnActor;
}): Promise<DeviceFabric> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const fabric: DeviceFabric = {
    id: id('dndevfab'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    unverifiedUnavailableOrNotTested: true,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function registerDevicePlatform(input: {
  fabricId: string;
  platform: DevicePlatform;
  compatibilityTested?: boolean;
  verified?: boolean;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; profile?: DeviceProfile }> {
  void input.actor;
  const store = await load(input.root);
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'DEVICE_FABRIC_NOT_FOUND' };
  if (store.profiles.length >= MAX_DEVICE_PROFILES) {
    return { accepted: false, reason: 'MAX_DEVICE_PROFILES_REACHED' };
  }

  const tested = input.compatibilityTested === true;
  const verified = input.verified === true && tested;
  let status: DeviceProfile['status'];
  let reason: string;
  if (!tested) {
    status = 'NOT_TESTED';
    reason = UNVERIFIED_DEVICE_UNAVAILABLE_OR_NOT_TESTED;
  } else if (!verified) {
    status = 'UNAVAILABLE';
    reason = UNVERIFIED_DEVICE_UNAVAILABLE_OR_NOT_TESTED;
  } else {
    status = 'AVAILABLE';
    reason = 'DEVICE_PLATFORM_COMPAT_VERIFIED_CONTRACT_ONLY';
  }

  const profile: DeviceProfile = {
    id: id('dndev'),
    fabricId: input.fabricId,
    platform: input.platform,
    compatibilityTested: tested,
    verified,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.profiles.push(profile);
  await save(input.root, store);
  return {
    accepted: status === 'AVAILABLE',
    reason: profile.reason,
    profile,
  };
}
