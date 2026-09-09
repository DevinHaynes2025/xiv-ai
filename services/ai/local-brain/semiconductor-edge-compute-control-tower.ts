/**
 * 62L-DW Module D — Semiconductor / Edge Compute Control Tower.
 * AMD/NVIDIA/edge; proof before hardware-support claims;
 * ≠ unauthorized remote hardware control.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CHIP_HEARTBEAT_REQUIRED,
  EDGE_NEQ_REMOTE,
  HARDWARE_PROOF_REQUIRED,
  MAX_EDGE_PROBES,
  type DwActor,
  type DwEvidenceState,
} from './supply-chain-superbrain-types';

export type HardwareVendor = 'AMD' | 'NVIDIA' | 'EDGE_GENERIC' | 'UNKNOWN';

export type HardwareSupportClaim = {
  id: string;
  vendor: HardwareVendor;
  proofPresent: boolean;
  state: Extract<DwEvidenceState, 'NOT_VERIFIED' | 'UNAVAILABLE' | 'DENIED'>;
  reason: string;
  at: string;
};

export type EdgeRemoteControlProbe = {
  id: string;
  targetNodeId: string;
  authorized: boolean;
  remoteControlGranted: false;
  status: 'denied' | 'advisory_only';
  reason: string;
  at: string;
};

export type ChipRuntimeProbe = {
  id: string;
  nodeId: string;
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  state: Extract<DwEvidenceState, 'RUNNING_VERIFIED' | 'DENIED' | 'UNAVAILABLE'>;
  reason: string;
  at: string;
};

type Store = {
  hardwareClaims: HardwareSupportClaim[];
  remoteProbes: EdgeRemoteControlProbe[];
  runtimeProbes: ChipRuntimeProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'semiconductor-edge-compute-control-tower.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    hardwareClaims: [],
    remoteProbes: [],
    runtimeProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function semiconductorEdgeComputeControlTowerHonesty() {
  return {
    hardwareSupportWithoutProof: false,
    unauthorizedRemoteHardwareControl: false,
    amdSupportClaimedVerified: false,
    nvidiaSupportClaimedVerified: false,
    edgeSupportClaimedVerified: false,
  };
}

export async function claimHardwareSupport(input: {
  vendor: HardwareVendor;
  proofPresent: boolean;
  root: string;
  actor: DwActor;
}): Promise<HardwareSupportClaim> {
  const store = await load(input.root);
  void input.actor;
  if (store.hardwareClaims.length >= MAX_EDGE_PROBES) throw new Error('MAX_EDGE_PROBES_REACHED');
  const claim: HardwareSupportClaim = {
    id: id('dwhw'),
    vendor: input.vendor,
    proofPresent: input.proofPresent,
    state: input.proofPresent ? 'NOT_VERIFIED' : 'UNAVAILABLE',
    reason: HARDWARE_PROOF_REQUIRED,
    at: new Date().toISOString(),
  };
  store.hardwareClaims.push(claim);
  await save(input.root, store);
  return claim;
}

export async function attemptEdgeRemoteControl(input: {
  targetNodeId: string;
  authorized: boolean;
  root: string;
  actor: DwActor;
}): Promise<EdgeRemoteControlProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: EdgeRemoteControlProbe = {
    id: id('dwedge'),
    targetNodeId: input.targetNodeId,
    authorized: input.authorized,
    remoteControlGranted: false,
    status: 'denied',
    reason: EDGE_NEQ_REMOTE,
    at: new Date().toISOString(),
  };
  store.remoteProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeChipRunningVerified(input: {
  nodeId: string;
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  root: string;
  actor: DwActor;
}): Promise<ChipRuntimeProbe> {
  const store = await load(input.root);
  void input.actor;
  const ok = input.heartbeatFresh && input.runtimeEvidencePresent;
  const probe: ChipRuntimeProbe = {
    id: id('dwchip'),
    nodeId: input.nodeId,
    heartbeatFresh: input.heartbeatFresh,
    runtimeEvidencePresent: input.runtimeEvidencePresent,
    state: ok ? 'RUNNING_VERIFIED' : 'DENIED',
    reason: ok ? 'CHIP_RUNTIME_EVIDENCE_PRESENT_NOT_PROD_AUTH' : CHIP_HEARTBEAT_REQUIRED,
    at: new Date().toISOString(),
  };
  store.runtimeProbes.push(probe);
  await save(input.root, store);
  return probe;
}
