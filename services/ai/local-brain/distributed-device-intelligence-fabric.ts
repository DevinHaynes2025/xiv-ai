/**
 * 62L-CK Distributed Device Intelligence Fabric —
 * Enrolled device fabric; explicit handoff/permissions; no hidden deploy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CK_LOCKS,
  HONESTY_BANNER,
  UNCONFIGURED_UNAVAILABLE,
  UNENROLLED_DEVICE_JOIN_DENIED,
  type CkActor,
} from './cognitive-infra-mini-cloud-history-types';

export type DeviceKind = 'pc' | 'laptop' | 'mobile' | 'tablet' | 'edge_appliance' | 'server_node';

export type FabricDevice = {
  id: string;
  deviceId: string;
  kind: DeviceKind;
  enrolled: boolean;
  authorized: boolean;
  hiddenDeploy: false;
  status: 'enrolled' | 'denied' | 'unavailable';
  reason: string;
  productionAuthorized: false;
  at: string;
};

export type FabricJoinAttempt = {
  id: string;
  deviceRecordId: string;
  status: 'joined' | 'denied' | 'unavailable';
  reason: string;
  hiddenDeploy: false;
  at: string;
};

export type FabricHandoff = {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  explicit: boolean;
  status: 'accepted' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

type Store = {
  devices: FabricDevice[];
  joins: FabricJoinAttempt[];
  handoffs: FabricHandoff[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-device-intelligence-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { devices: [], joins: [], handoffs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function deviceIntelligenceFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CK_LOCKS.L4_AUTONOMY_ENABLED,
    unenrolledJoin: CK_LOCKS.DEVICE_FABRIC_UNENROLLED_JOIN,
    hiddenDeploy: CK_LOCKS.DEVICE_HIDDEN_DEPLOY,
    enrollmentRequired: CK_LOCKS.DEVICE_ENROLLMENT_REQUIRED,
    productionAuthorization: CK_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function enrollFabricDevice(input: {
  deviceId: string;
  kind: DeviceKind;
  enrolled: boolean;
  authorized?: boolean;
  attemptHiddenDeploy?: boolean;
  root: string;
  actor: CkActor;
}): Promise<FabricDevice> {
  const store = await load(input.root);

  if (input.attemptHiddenDeploy === true) {
    const device: FabricDevice = {
      id: id('fdev'),
      deviceId: input.deviceId,
      kind: input.kind,
      enrolled: false,
      authorized: false,
      hiddenDeploy: false,
      status: 'denied',
      reason: 'HIDDEN_DEVICE_FABRIC_DEPLOY_DENIED',
      productionAuthorized: false,
      at: new Date().toISOString(),
    };
    store.devices.push(device);
    await save(input.root, store);
    return device;
  }

  const authorized = input.authorized !== false;
  const ready = input.enrolled === true && authorized;

  const device: FabricDevice = {
    id: id('fdev'),
    deviceId: input.deviceId,
    kind: input.kind,
    enrolled: input.enrolled === true,
    authorized,
    hiddenDeploy: false,
    status: ready ? 'enrolled' : input.enrolled ? 'denied' : 'unavailable',
    reason: ready
      ? 'DEVICE_FABRIC_ENROLLED'
      : UNENROLLED_DEVICE_JOIN_DENIED,
    productionAuthorized: false,
    at: new Date().toISOString(),
  };
  store.devices.push(device);
  await save(input.root, store);
  return device;
}

export async function attemptFabricJoin(input: {
  deviceRecordId: string;
  root: string;
  actor: CkActor;
}): Promise<FabricJoinAttempt> {
  const store = await load(input.root);
  const device = store.devices.find((d) => d.id === input.deviceRecordId);

  if (!device) {
    const attempt: FabricJoinAttempt = {
      id: id('fjoin'),
      deviceRecordId: input.deviceRecordId,
      status: 'unavailable',
      reason: UNCONFIGURED_UNAVAILABLE,
      hiddenDeploy: false,
      at: new Date().toISOString(),
    };
    store.joins.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (device.status !== 'enrolled' || device.enrolled !== true) {
    const attempt: FabricJoinAttempt = {
      id: id('fjoin'),
      deviceRecordId: device.id,
      status: device.status === 'unavailable' ? 'unavailable' : 'denied',
      reason: UNENROLLED_DEVICE_JOIN_DENIED,
      hiddenDeploy: false,
      at: new Date().toISOString(),
    };
    store.joins.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: FabricJoinAttempt = {
    id: id('fjoin'),
    deviceRecordId: device.id,
    status: 'joined',
    reason: 'DEVICE_FABRIC_JOIN_ENROLLED',
    hiddenDeploy: false,
    at: new Date().toISOString(),
  };
  store.joins.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function attemptFabricHandoff(input: {
  fromDeviceId: string;
  toDeviceId: string;
  explicit: boolean;
  root: string;
  actor: CkActor;
}): Promise<FabricHandoff> {
  const store = await load(input.root);
  const from = store.devices.find((d) => d.id === input.fromDeviceId);
  const to = store.devices.find((d) => d.id === input.toDeviceId);

  if (!from || !to || from.status !== 'enrolled' || to.status !== 'enrolled') {
    const handoff: FabricHandoff = {
      id: id('fhand'),
      fromDeviceId: input.fromDeviceId,
      toDeviceId: input.toDeviceId,
      explicit: input.explicit,
      status: 'denied',
      reason: UNENROLLED_DEVICE_JOIN_DENIED,
      at: new Date().toISOString(),
    };
    store.handoffs.push(handoff);
    await save(input.root, store);
    return handoff;
  }

  if (input.explicit !== true) {
    const handoff: FabricHandoff = {
      id: id('fhand'),
      fromDeviceId: from.id,
      toDeviceId: to.id,
      explicit: false,
      status: 'denied',
      reason: 'DEVICE_FABRIC_HANDOFF_REQUIRES_EXPLICIT_CONSENT',
      at: new Date().toISOString(),
    };
    store.handoffs.push(handoff);
    await save(input.root, store);
    return handoff;
  }

  const handoff: FabricHandoff = {
    id: id('fhand'),
    fromDeviceId: from.id,
    toDeviceId: to.id,
    explicit: true,
    status: 'accepted',
    reason: 'DEVICE_FABRIC_EXPLICIT_HANDOFF_ACCEPTED',
    at: new Date().toISOString(),
  };
  store.handoffs.push(handoff);
  await save(input.root, store);
  return handoff;
}
