/**
 * 62L-BZ Universal AI Device Federation — enrollment; revocation/quarantine enforced.
 * Authorized devices/providers only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BZ_LOCKS,
  HONESTY_BANNER,
  REVOKED_DEVICE_DENIED,
  type BzActor,
} from './global-compute-nervous-routing-types';

export type FederatedDeviceStatus =
  | 'enrolled'
  | 'available'
  | 'unavailable'
  | 'revoked'
  | 'quarantined'
  | 'denied';

export type FederatedDevice = {
  id: string;
  name: string;
  providerId: string | null;
  enrolled: boolean;
  authorized: boolean;
  configured: boolean;
  verified: boolean;
  status: FederatedDeviceStatus;
  reason: string;
  productionAuthorized: false;
  createdAt: string;
  updatedAt: string;
};

export type FederatedProvider = {
  id: string;
  name: string;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type WorkAssignment = {
  id: string;
  deviceId: string;
  workloadId: string;
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  devices: FederatedDevice[];
  providers: FederatedProvider[];
  assignments: WorkAssignment[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-ai-device-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    devices: [],
    providers: [],
    assignments: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function deviceFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BZ_LOCKS.L4_AUTONOMY_ENABLED,
    deviceAuthorizedOnly: BZ_LOCKS.DEVICE_AUTHORIZED_ONLY,
    revocationQuarantineEnforced: BZ_LOCKS.REVOCATION_QUARANTINE_ENFORCED,
    revokedReceivesWork: BZ_LOCKS.REVOKED_DEVICE_RECEIVES_WORK,
    quarantinedReceivesWork: BZ_LOCKS.QUARANTINED_DEVICE_RECEIVES_WORK,
    unconfiguredDeviceAvailable: BZ_LOCKS.UNCONFIGURED_DEVICE_AVAILABLE,
  };
}

export async function registerFederatedProvider(input: {
  name: string;
  configured: boolean;
  authorized: boolean;
  verified?: boolean;
  root: string;
}): Promise<FederatedProvider> {
  const store = await load(input.root);
  const ok = input.configured && input.authorized;
  const provider: FederatedProvider = {
    id: id('prov'),
    name: input.name,
    configured: input.configured === true,
    authorized: input.authorized === true,
    verified: input.verified === true,
    status: ok ? 'available' : 'unavailable',
    reason: ok ? 'AUTHORIZED_CONFIGURED_PROVIDER' : 'UNCONFIGURED_OR_UNAUTHORIZED_PROVIDER_UNAVAILABLE',
    createdAt: new Date().toISOString(),
  };
  store.providers.push(provider);
  await save(input.root, store);
  return provider;
}

export async function enrollFederatedDevice(input: {
  name: string;
  providerId?: string;
  enrolled: boolean;
  authorized: boolean;
  configured: boolean;
  verified?: boolean;
  root: string;
  actor: BzActor;
}): Promise<FederatedDevice> {
  const store = await load(input.root);
  const ok =
    input.enrolled === true &&
    input.authorized === true &&
    input.configured === true;
  const now = new Date().toISOString();
  const device: FederatedDevice = {
    id: id('dev'),
    name: input.name,
    providerId: input.providerId ?? null,
    enrolled: input.enrolled === true,
    authorized: input.authorized === true,
    configured: input.configured === true,
    verified: input.verified === true,
    status: ok ? 'available' : 'unavailable',
    reason: ok
      ? 'AUTHORIZED_ENROLLED_DEVICE'
      : 'UNCONFIGURED_OR_UNAUTHORIZED_DEVICE_UNAVAILABLE',
    productionAuthorized: false,
    createdAt: now,
    updatedAt: now,
  };
  store.devices.push(device);
  await save(input.root, store);
  return device;
}

export async function revokeFederatedDevice(input: {
  deviceId: string;
  root: string;
  actor: BzActor;
}): Promise<FederatedDevice | null> {
  const store = await load(input.root);
  const device = store.devices.find((d) => d.id === input.deviceId);
  if (!device) return null;
  device.status = 'revoked';
  device.authorized = false;
  device.reason = REVOKED_DEVICE_DENIED;
  device.updatedAt = new Date().toISOString();
  await save(input.root, store);
  return device;
}

export async function quarantineFederatedDevice(input: {
  deviceId: string;
  root: string;
  actor: BzActor;
}): Promise<FederatedDevice | null> {
  const store = await load(input.root);
  const device = store.devices.find((d) => d.id === input.deviceId);
  if (!device) return null;
  device.status = 'quarantined';
  device.reason = REVOKED_DEVICE_DENIED;
  device.updatedAt = new Date().toISOString();
  await save(input.root, store);
  return device;
}

export async function assignWorkToDevice(input: {
  deviceId: string;
  workloadId: string;
  root: string;
  actor: BzActor;
}): Promise<WorkAssignment> {
  const store = await load(input.root);
  const device = store.devices.find((d) => d.id === input.deviceId);
  let accepted = false;
  let reason = 'DEVICE_NOT_FOUND';
  if (!device) {
    // keep denied
  } else if (
    device.status === 'revoked' ||
    device.status === 'quarantined' ||
    !device.authorized ||
    !device.enrolled ||
    !device.configured
  ) {
    accepted = false;
    reason = REVOKED_DEVICE_DENIED;
  } else if (device.status === 'available') {
    accepted = true;
    reason = 'WORK_ASSIGNED_TO_AUTHORIZED_DEVICE';
  } else {
    accepted = false;
    reason = 'DEVICE_UNAVAILABLE';
  }
  const assignment: WorkAssignment = {
    id: id('work'),
    deviceId: input.deviceId,
    workloadId: input.workloadId,
    accepted,
    reason,
    at: new Date().toISOString(),
  };
  store.assignments.push(assignment);
  await save(input.root, store);
  return assignment;
}

export async function listFederatedDevices(root: string) {
  return (await load(root)).devices;
}
