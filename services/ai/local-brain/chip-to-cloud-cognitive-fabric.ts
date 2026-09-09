/**
 * 62L-EI Module A — Chip-to-Cloud Cognitive Fabric.
 * Semiconductor/device ↔ cloud fabric; evidence gates; unconfigured → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CHIP_CLOUD_EVIDENCE_GATE,
  CHIP_CLOUD_FABRIC_REGISTERED,
  CHIP_CLOUD_UNCONFIGURED,
  MAX_FABRIC_EVENTS,
  type EiActor,
  type EiEvidenceState,
} from './chip-to-cloud-cognitive-fabric-types';

export type FabricRegistration = {
  id: string;
  fabricId: string;
  deviceClass: string;
  configured: boolean;
  status: 'ok' | 'denied' | 'unavailable';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

export type FabricEvidenceGate = {
  id: string;
  fabricId: string;
  evidenceComplete: boolean;
  status: 'denied' | 'gated';
  state: EiEvidenceState;
  reason: string;
  promoted: false;
  runningVerified: false;
  at: string;
};

export type FabricProbe = {
  id: string;
  fabricId: string;
  configured: boolean;
  status: 'ok' | 'unavailable';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  registrations: FabricRegistration[];
  gates: FabricEvidenceGate[];
  probes: FabricProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'chip-to-cloud-cognitive-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    registrations: [],
    gates: [],
    probes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function chipToCloudCognitiveFabricHonesty() {
  return {
    evidenceGated: true,
    unconfiguredUnavailable: true,
    runningVerifiedNeedsEvidence: true,
    promoted: false,
    l4AutonomyEnabled: false,
  };
}

export async function registerChipCloudFabric(input: {
  fabricId: string;
  deviceClass: string;
  configured: boolean;
  root: string;
  actor: EiActor;
}): Promise<FabricRegistration> {
  const store = await load(input.root);
  void input.actor;
  if (store.registrations.length >= MAX_FABRIC_EVENTS) {
    throw new Error('MAX_FABRIC_EVENTS');
  }
  if (!input.configured) {
    const rec: FabricRegistration = {
      id: id('eifab'),
      fabricId: input.fabricId.trim(),
      deviceClass: input.deviceClass.trim(),
      configured: false,
      status: 'unavailable',
      state: 'UNAVAILABLE',
      reason: CHIP_CLOUD_UNCONFIGURED,
      at: new Date().toISOString(),
    };
    store.registrations.push(rec);
    await save(input.root, store);
    return rec;
  }
  const rec: FabricRegistration = {
    id: id('eifab'),
    fabricId: input.fabricId.trim(),
    deviceClass: input.deviceClass.trim(),
    configured: true,
    status: 'ok',
    state: 'REGISTERED',
    reason: CHIP_CLOUD_FABRIC_REGISTERED,
    at: new Date().toISOString(),
  };
  store.registrations.push(rec);
  await save(input.root, store);
  return rec;
}

export async function gateChipCloudEvidence(input: {
  fabricId: string;
  evidenceComplete: boolean;
  root: string;
  actor: EiActor;
}): Promise<FabricEvidenceGate> {
  const store = await load(input.root);
  void input.actor;
  const gate: FabricEvidenceGate = {
    id: id('eigate'),
    fabricId: input.fabricId.trim(),
    evidenceComplete: input.evidenceComplete,
    status: input.evidenceComplete ? 'gated' : 'denied',
    state: input.evidenceComplete ? 'BOUNDED' : 'DENIED',
    reason: CHIP_CLOUD_EVIDENCE_GATE,
    promoted: false,
    runningVerified: false,
    at: new Date().toISOString(),
  };
  store.gates.push(gate);
  await save(input.root, store);
  return gate;
}

export async function probeChipCloudConfigured(input: {
  fabricId: string;
  configured: boolean;
  root: string;
  actor: EiActor;
}): Promise<FabricProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: FabricProbe = {
    id: id('eiprobe'),
    fabricId: input.fabricId.trim(),
    configured: input.configured,
    status: input.configured ? 'ok' : 'unavailable',
    state: input.configured ? 'CONFIGURED' : 'UNAVAILABLE',
    reason: input.configured
      ? CHIP_CLOUD_FABRIC_REGISTERED
      : CHIP_CLOUD_UNCONFIGURED,
    at: new Date().toISOString(),
  };
  store.probes.push(probe);
  await save(input.root, store);
  return probe;
}
