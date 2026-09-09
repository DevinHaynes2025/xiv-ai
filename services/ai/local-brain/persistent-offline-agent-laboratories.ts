/**
 * 62L-CW Persistent Offline Agent Laboratories —
 * Persistent offline research labs with truthful offline stop/waiting states.
 * If every authorized device is powered off → WAITING_NODE or OFFLINE_STOPPED.
 * RUNNING_VERIFIED only with fresh heartbeat + runtime evidence + powered device.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ALL_DEVICES_OFFLINE_WAITING_OR_STOPPED,
  CW_LOCKS,
  HEARTBEAT_TTL_MS,
  HONESTY_BANNER,
  MAX_OFFLINE_LABS,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  type CwActor,
  type OfflineLabStatus,
} from './autonomous-research-infrastructure-os-types';

export type LabDevice = {
  id: string;
  name: string;
  authorized: boolean;
  poweredOn: boolean;
};

export type OfflineAgentLaboratory = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  status: OfflineLabStatus;
  devices: LabDevice[];
  lastHeartbeatAt: string | null;
  runtimeEvidence: string | null;
  permissionLevel: number;
  createdAt: string;
  updatedAt: string;
};

export type OfflineLabResult = {
  accepted: boolean;
  reason: string;
  lab?: OfflineAgentLaboratory;
  at: string;
};

type Store = { labs: OfflineAgentLaboratory[] };

function storePath(root: string) {
  return xivLocalPath(root, 'persistent-offline-agent-laboratories.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { labs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function authorizedDevices(lab: OfflineAgentLaboratory): LabDevice[] {
  return lab.devices.filter((d) => d.authorized);
}

function allAuthorizedPoweredOff(lab: OfflineAgentLaboratory): boolean {
  const auth = authorizedDevices(lab);
  if (auth.length === 0) return true;
  return auth.every((d) => !d.poweredOn);
}

function deriveOfflineStatus(lab: OfflineAgentLaboratory): OfflineLabStatus {
  if (allAuthorizedPoweredOff(lab)) {
    return lab.status === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
  }
  if (!lab.lastHeartbeatAt || !lab.runtimeEvidence) {
    return lab.status === 'REGISTERED' ? 'REGISTERED' : 'HEARTBEAT_STALE';
  }
  const age = Date.now() - Date.parse(lab.lastHeartbeatAt);
  if (Number.isNaN(age) || age > HEARTBEAT_TTL_MS) return 'HEARTBEAT_STALE';
  return 'RUNNING_VERIFIED';
}

export function offlineAgentLaboratoriesHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CW_LOCKS.L4_AUTONOMY_ENABLED,
    runningVerifiedWithoutHeartbeat: CW_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    offlineDevicesPretendRunning: CW_LOCKS.OFFLINE_DEVICES_PRETEND_RUNNING,
  };
}

export async function registerOfflineLaboratory(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  devices: Array<{ name: string; authorized?: boolean; poweredOn?: boolean }>;
  root: string;
  actor: CwActor;
}): Promise<OfflineLabResult> {
  const store = await load(input.root);
  if (store.labs.length >= MAX_OFFLINE_LABS) {
    return {
      accepted: false,
      reason: 'MAX_OFFLINE_LABS_BOUNDED',
      at: new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  const devices: LabDevice[] = (input.devices.length
    ? input.devices
    : [{ name: 'default-node', authorized: true, poweredOn: false }]
  ).map((d, i) => ({
    id: id(`dev${i}`),
    name: d.name.trim() || `device-${i}`,
    authorized: d.authorized !== false,
    poweredOn: d.poweredOn === true,
  }));
  const lab: OfflineAgentLaboratory = {
    id: id('olab'),
    name: input.name.trim() || 'unnamed-offline-lab',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    status: 'REGISTERED',
    devices,
    lastHeartbeatAt: null,
    runtimeEvidence: null,
    permissionLevel: Math.max(0, input.actor.permissionLevel),
    createdAt: now,
    updatedAt: now,
  };
  if (allAuthorizedPoweredOff(lab)) {
    lab.status = 'WAITING_NODE';
  }
  store.labs.push(lab);
  await save(input.root, store);
  return {
    accepted: true,
    reason: allAuthorizedPoweredOff(lab)
      ? ALL_DEVICES_OFFLINE_WAITING_OR_STOPPED
      : 'OFFLINE_LAB_REGISTERED',
    lab,
    at: now,
  };
}

export async function setLaboratoryDevicesPower(input: {
  labId: string;
  poweredOn: boolean;
  stopMode?: 'WAITING_NODE' | 'OFFLINE_STOPPED';
  root: string;
  actor: CwActor;
}): Promise<OfflineLabResult> {
  void input.actor;
  const store = await load(input.root);
  const lab = store.labs.find((l) => l.id === input.labId);
  if (!lab) {
    return { accepted: false, reason: 'LAB_NOT_FOUND', at: new Date().toISOString() };
  }
  const now = new Date().toISOString();
  for (const d of lab.devices) {
    if (d.authorized) d.poweredOn = input.poweredOn;
  }
  if (!input.poweredOn && allAuthorizedPoweredOff(lab)) {
    lab.status = input.stopMode === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    lab.lastHeartbeatAt = null;
    lab.runtimeEvidence = null;
  } else if (input.poweredOn) {
    lab.status = lab.lastHeartbeatAt && lab.runtimeEvidence ? deriveOfflineStatus(lab) : 'REGISTERED';
  }
  lab.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: allAuthorizedPoweredOff(lab)
      ? ALL_DEVICES_OFFLINE_WAITING_OR_STOPPED
      : 'LAB_DEVICE_POWER_UPDATED',
    lab,
    at: now,
  };
}

export async function recordLaboratoryHeartbeat(input: {
  labId: string;
  runtimeEvidence: string;
  root: string;
  actor: CwActor;
}): Promise<OfflineLabResult> {
  void input.actor;
  const store = await load(input.root);
  const lab = store.labs.find((l) => l.id === input.labId);
  if (!lab) {
    return { accepted: false, reason: 'LAB_NOT_FOUND', at: new Date().toISOString() };
  }
  if (allAuthorizedPoweredOff(lab)) {
    lab.status = lab.status === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    lab.updatedAt = new Date().toISOString();
    await save(input.root, store);
    return {
      accepted: false,
      reason: ALL_DEVICES_OFFLINE_WAITING_OR_STOPPED,
      lab,
      at: lab.updatedAt,
    };
  }
  const evidence = input.runtimeEvidence.trim();
  if (!evidence) {
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      lab,
      at: new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  lab.lastHeartbeatAt = now;
  lab.runtimeEvidence = evidence;
  lab.status = 'RUNNING_VERIFIED';
  lab.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'LAB_HEARTBEAT_RECORDED_RUNNING_VERIFIED', lab, at: now };
}

export async function claimLaboratoryRunningVerified(input: {
  labId: string;
  root: string;
  actor: CwActor;
}): Promise<OfflineLabResult> {
  void input.actor;
  const store = await load(input.root);
  const lab = store.labs.find((l) => l.id === input.labId);
  if (!lab) {
    return { accepted: false, reason: 'LAB_NOT_FOUND', at: new Date().toISOString() };
  }
  if (allAuthorizedPoweredOff(lab)) {
    const status: OfflineLabStatus =
      lab.status === 'OFFLINE_STOPPED' ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    lab.status = status;
    lab.updatedAt = new Date().toISOString();
    await save(input.root, store);
    return {
      accepted: false,
      reason: ALL_DEVICES_OFFLINE_WAITING_OR_STOPPED,
      lab,
      at: lab.updatedAt,
    };
  }
  const derived = deriveOfflineStatus(lab);
  if (derived !== 'RUNNING_VERIFIED') {
    lab.status = derived === 'REGISTERED' ? 'HEARTBEAT_STALE' : derived;
    lab.updatedAt = new Date().toISOString();
    await save(input.root, store);
    return {
      accepted: false,
      reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
      lab,
      at: lab.updatedAt,
    };
  }
  lab.status = 'RUNNING_VERIFIED';
  lab.updatedAt = new Date().toISOString();
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'LAB_RUNNING_VERIFIED',
    lab,
    at: lab.updatedAt,
  };
}

export async function listOfflineLaboratories(root: string): Promise<OfflineAgentLaboratory[]> {
  const store = await load(root);
  return store.labs;
}
