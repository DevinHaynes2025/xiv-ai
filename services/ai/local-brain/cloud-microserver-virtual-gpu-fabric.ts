/**
 * 62L-EA Module C — Cloud Microserver & Virtual GPU Fabric.
 * Microservers, vGPU scheduling; CPU/GPU/NPU verification with evidence gates.
 * Offline: WAITING_NODE / OFFLINE_STOPPED. Self-promotion denied.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HARDWARE_EVIDENCE_REQUIRED,
  MAX_FABRIC_EVENTS,
  MICROSERVER_SELF_PROMOTION_DENIED,
  OFFLINE_WAITING_OR_STOPPED,
  VGPU_EVIDENCE_REQUIRED,
  type EaActor,
  type EaEvidenceState,
} from './global-operations-intelligence-grid-types';

export type VgpuProbe = {
  id: string;
  nodeId: string;
  authorized: boolean;
  heartbeatPresent: boolean;
  claimRunningVerified: boolean;
  state: EaEvidenceState;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type HardwareClaimProbe = {
  id: string;
  claimKind: 'CPU' | 'GPU' | 'NPU';
  evidencePresent: boolean;
  state: EaEvidenceState;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type OfflineMicroserverProbe = {
  id: string;
  nodeId: string;
  poweredNodePresent: boolean;
  state: EaEvidenceState;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type MicroserverSelfPromotion = {
  id: string;
  microserverId: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  vgpu: VgpuProbe[];
  hardware: HardwareClaimProbe[];
  offline: OfflineMicroserverProbe[];
  promotions: MicroserverSelfPromotion[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'cloud-microserver-virtual-gpu-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    vgpu: [],
    hardware: [],
    offline: [],
    promotions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cloudMicroserverVirtualGpuFabricHonesty() {
  return {
    runningVerifiedNeedsEvidence: true,
    hardwareClaimsNeedEvidence: true,
    offlineHonestWaitingOrStopped: true,
    microserverSelfPromotionForbidden: true,
  };
}

export async function probeVgpuRunningVerified(input: {
  nodeId: string;
  authorized: boolean;
  heartbeatPresent: boolean;
  claimRunningVerified: boolean;
  root: string;
  actor: EaActor;
}): Promise<VgpuProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.vgpu.length >= MAX_FABRIC_EVENTS) {
    throw new Error('MAX_FABRIC_EVENTS_REACHED');
  }
  const evidenceOk =
    input.authorized &&
    input.heartbeatPresent &&
    input.claimRunningVerified;
  if (input.claimRunningVerified && !evidenceOk) {
    const denied: VgpuProbe = {
      id: id('eavgpu'),
      nodeId: input.nodeId.trim(),
      authorized: input.authorized,
      heartbeatPresent: input.heartbeatPresent,
      claimRunningVerified: true,
      state: 'NOT_VERIFIED',
      status: 'denied',
      reason: VGPU_EVIDENCE_REQUIRED,
      at: new Date().toISOString(),
    };
    store.vgpu.push(denied);
    await save(input.root, store);
    return denied;
  }
  if (!input.authorized || !input.heartbeatPresent) {
    const denied: VgpuProbe = {
      id: id('eavgpu'),
      nodeId: input.nodeId.trim(),
      authorized: input.authorized,
      heartbeatPresent: input.heartbeatPresent,
      claimRunningVerified: input.claimRunningVerified,
      state: 'NOT_VERIFIED',
      status: 'denied',
      reason: VGPU_EVIDENCE_REQUIRED,
      at: new Date().toISOString(),
    };
    store.vgpu.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: VgpuProbe = {
    id: id('eavgpu'),
    nodeId: input.nodeId.trim(),
    authorized: true,
    heartbeatPresent: true,
    claimRunningVerified: true,
    state: 'RUNNING_VERIFIED',
    status: 'ok',
    reason: 'VGPU_EVIDENCE_PRESENT',
    at: new Date().toISOString(),
  };
  store.vgpu.push(ok);
  await save(input.root, store);
  return ok;
}

export async function probeHardwareClaim(input: {
  claimKind: 'CPU' | 'GPU' | 'NPU';
  evidencePresent: boolean;
  root: string;
  actor: EaActor;
}): Promise<HardwareClaimProbe> {
  const store = await load(input.root);
  void input.actor;
  if (!input.evidencePresent) {
    const denied: HardwareClaimProbe = {
      id: id('eahw'),
      claimKind: input.claimKind,
      evidencePresent: false,
      state: 'NOT_VERIFIED',
      status: 'denied',
      reason: HARDWARE_EVIDENCE_REQUIRED,
      at: new Date().toISOString(),
    };
    store.hardware.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: HardwareClaimProbe = {
    id: id('eahw'),
    claimKind: input.claimKind,
    evidencePresent: true,
    state: 'VERIFIED',
    status: 'ok',
    reason: 'HARDWARE_EVIDENCE_PRESENT',
    at: new Date().toISOString(),
  };
  store.hardware.push(ok);
  await save(input.root, store);
  return ok;
}

export async function probeOfflineMicroserver(input: {
  nodeId: string;
  poweredNodePresent: boolean;
  root: string;
  actor: EaActor;
}): Promise<OfflineMicroserverProbe> {
  const store = await load(input.root);
  void input.actor;
  if (!input.poweredNodePresent) {
    const stopped: OfflineMicroserverProbe = {
      id: id('eaoff'),
      nodeId: input.nodeId.trim(),
      poweredNodePresent: false,
      state: 'OFFLINE_STOPPED',
      status: 'denied',
      reason: OFFLINE_WAITING_OR_STOPPED,
      at: new Date().toISOString(),
    };
    store.offline.push(stopped);
    await save(input.root, store);
    return stopped;
  }
  const waiting: OfflineMicroserverProbe = {
    id: id('eaoff'),
    nodeId: input.nodeId.trim(),
    poweredNodePresent: true,
    state: 'WAITING_NODE',
    status: 'ok',
    reason: 'MICROSERVER_NODE_PRESENT_WAITING_WORKLOAD',
    at: new Date().toISOString(),
  };
  store.offline.push(waiting);
  await save(input.root, store);
  return waiting;
}

export async function attemptMicroserverSelfPromotion(input: {
  microserverId: string;
  root: string;
  actor: EaActor;
}): Promise<MicroserverSelfPromotion> {
  const store = await load(input.root);
  void input.actor;
  const denial: MicroserverSelfPromotion = {
    id: id('eamsp'),
    microserverId: input.microserverId.trim(),
    status: 'denied',
    reason: MICROSERVER_SELF_PROMOTION_DENIED,
    at: new Date().toISOString(),
  };
  store.promotions.push(denial);
  await save(input.root, store);
  return denial;
}
