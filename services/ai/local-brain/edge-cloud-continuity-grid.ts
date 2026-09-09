/**
 * 62L-EE Module G — Edge/Cloud Continuity Grid.
 * CPU/GPU/NPU continuity; failure simulation labeled; evidence gates.
 * RUNNING_VERIFIED needs evidence; offline WAITING_NODE / OFFLINE_STOPPED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONTINUITY_EVIDENCE_REQUIRED,
  FAILURE_SIM_LABELED,
  MAX_CONTINUITY_PROBES,
  OFFLINE_WAITING_OR_STOPPED,
  type EeActor,
  type EeEvidenceState,
} from './data-nervous-system-types';

export type ContinuityProbe = {
  id: string;
  nodeId: string;
  accelerator: 'cpu' | 'gpu' | 'npu';
  claimRunningVerified: boolean;
  heartbeatPresent: boolean;
  evidencePresent: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

export type FailureSimulation = {
  id: string;
  scenario: string;
  claimRealIncident: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

export type OfflineNodeProbe = {
  id: string;
  nodeId: string;
  mode: 'waiting' | 'stopped';
  status: 'ok';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  continuity: ContinuityProbe[];
  failures: FailureSimulation[];
  offline: OfflineNodeProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'edge-cloud-continuity-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    continuity: [],
    failures: [],
    offline: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function edgeCloudContinuityGridHonesty() {
  return {
    cpuGpuNpuContinuityEvidenceGate: true,
    failureSimulationLabeled: true,
    failureSimNeqRealIncident: true,
    offlineWaitingOrStopped: true,
    runningVerifiedNeedsEvidence: true,
  };
}

export async function probeContinuity(input: {
  nodeId: string;
  accelerator: 'cpu' | 'gpu' | 'npu';
  claimRunningVerified?: boolean;
  heartbeatPresent?: boolean;
  evidencePresent?: boolean;
  root: string;
  actor: EeActor;
}): Promise<ContinuityProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.continuity.length >= MAX_CONTINUITY_PROBES) {
    throw new Error('MAX_CONTINUITY_PROBES_REACHED');
  }
  const claim = Boolean(input.claimRunningVerified);
  const heartbeat = Boolean(input.heartbeatPresent);
  const evidence = Boolean(input.evidencePresent);
  const ok = !claim || (heartbeat && evidence);
  const probe: ContinuityProbe = {
    id: id('eecont'),
    nodeId: input.nodeId.trim(),
    accelerator: input.accelerator,
    claimRunningVerified: claim,
    heartbeatPresent: heartbeat,
    evidencePresent: evidence,
    status: ok ? 'ok' : 'denied',
    state: ok && claim ? 'RUNNING_VERIFIED' : ok ? 'PASS' : 'NOT_VERIFIED',
    reason: CONTINUITY_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.continuity.push(probe);
  await save(input.root, store);
  return probe;
}

export async function runFailureSimulation(input: {
  scenario: string;
  claimRealIncident?: boolean;
  root: string;
  actor: EeActor;
}): Promise<FailureSimulation> {
  const store = await load(input.root);
  void input.actor;
  if (store.failures.length >= MAX_CONTINUITY_PROBES) {
    throw new Error('MAX_CONTINUITY_PROBES_REACHED');
  }
  const claim = Boolean(input.claimRealIncident);
  const sim: FailureSimulation = {
    id: id('eefail'),
    scenario: input.scenario.trim(),
    claimRealIncident: claim,
    status: claim ? 'denied' : 'ok',
    state: claim ? 'DENIED' : 'LABELED_SIMULATION',
    reason: FAILURE_SIM_LABELED,
    at: new Date().toISOString(),
  };
  store.failures.push(sim);
  await save(input.root, store);
  return sim;
}

export async function probeOfflineContinuity(input: {
  nodeId: string;
  mode: 'waiting' | 'stopped';
  root: string;
  actor: EeActor;
}): Promise<OfflineNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.offline.length >= MAX_CONTINUITY_PROBES) {
    throw new Error('MAX_CONTINUITY_PROBES_REACHED');
  }
  const probe: OfflineNodeProbe = {
    id: id('eeoff'),
    nodeId: input.nodeId.trim(),
    mode: input.mode,
    status: 'ok',
    state: input.mode === 'waiting' ? 'WAITING_NODE' : 'OFFLINE_STOPPED',
    reason: OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  store.offline.push(probe);
  await save(input.root, store);
  return probe;
}
