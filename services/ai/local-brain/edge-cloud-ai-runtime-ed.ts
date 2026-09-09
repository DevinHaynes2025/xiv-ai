/**
 * 62L-ED Module F — Edge/Cloud AI Runtime.
 * Workload routing; offline agent runtimes; evidence gates.
 * Offline: WAITING_NODE / OFFLINE_STOPPED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  EDGE_CLOUD_ROUTED,
  MAX_RUNTIME_EVENTS,
  OFFLINE_WAITING_OR_STOPPED,
  RUNTIME_EVIDENCE_REQUIRED,
  type EdActor,
  type EdEvidenceState,
} from './data-galaxy-industry-memory-os-types';

export type WorkloadRoute = {
  id: string;
  workloadId: string;
  preferred: 'edge' | 'cloud';
  edgeAvailable: boolean;
  cloudConfigured: boolean;
  selected: 'edge' | 'cloud' | 'none';
  status: 'ok' | 'denied' | 'unavailable';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type OfflineAgentProbe = {
  id: string;
  agentId: string;
  poweredNodePresent: boolean;
  status: 'ok' | 'waiting' | 'stopped';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type RuntimeEvidenceProbe = {
  id: string;
  runtimeId: string;
  claimRunningVerified: boolean;
  evidencePresent: boolean;
  heartbeatPresent: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  routes: WorkloadRoute[];
  offline: OfflineAgentProbe[];
  evidence: RuntimeEvidenceProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'edge-cloud-ai-runtime-ed.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    routes: [],
    offline: [],
    evidence: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function edgeCloudAiRuntimeEdHonesty() {
  return {
    edgeCloudWorkloadRouting: true,
    unconfiguredCloudUnavailable: true,
    offlineAgentsHonest: true,
    runningVerifiedNeedsEvidence: true,
    l4AutonomyEnabled: false,
  };
}

export async function routeEdgeCloudWorkload(input: {
  workloadId: string;
  preferred: 'edge' | 'cloud';
  edgeAvailable: boolean;
  cloudConfigured: boolean;
  root: string;
  actor: EdActor;
}): Promise<WorkloadRoute> {
  const store = await load(input.root);
  void input.actor;
  if (store.routes.length >= MAX_RUNTIME_EVENTS) {
    throw new Error('MAX_RUNTIME_EVENTS');
  }
  let selected: WorkloadRoute['selected'] = 'none';
  let status: WorkloadRoute['status'] = 'unavailable';
  let state: EdEvidenceState = 'UNAVAILABLE';
  let reason = 'UNCONFIGURED_CLOUD_RUNTIME_UNAVAILABLE';

  if (input.preferred === 'edge' && input.edgeAvailable) {
    selected = 'edge';
    status = 'ok';
    state = 'LOCAL_PREFERRED';
    reason = EDGE_CLOUD_ROUTED;
  } else if (input.preferred === 'edge' && !input.edgeAvailable) {
    if (input.cloudConfigured) {
      selected = 'cloud';
      status = 'ok';
      state = 'AVAILABLE';
      reason = EDGE_CLOUD_ROUTED;
    }
  } else if (input.preferred === 'cloud') {
    if (input.cloudConfigured) {
      selected = 'cloud';
      status = 'ok';
      state = 'AVAILABLE';
      reason = EDGE_CLOUD_ROUTED;
    }
  }

  const row: WorkloadRoute = {
    id: id('edroute'),
    workloadId: input.workloadId,
    preferred: input.preferred,
    edgeAvailable: input.edgeAvailable,
    cloudConfigured: input.cloudConfigured,
    selected,
    status,
    state,
    reason,
    at: new Date().toISOString(),
  };
  store.routes.push(row);
  await save(input.root, store);
  return row;
}

export async function probeOfflineAgentRuntime(input: {
  agentId: string;
  poweredNodePresent: boolean;
  root: string;
  actor: EdActor;
}): Promise<OfflineAgentProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.offline.length >= MAX_RUNTIME_EVENTS) {
    throw new Error('MAX_RUNTIME_EVENTS');
  }
  const row: OfflineAgentProbe = {
    id: id('edoff'),
    agentId: input.agentId,
    poweredNodePresent: input.poweredNodePresent,
    status: input.poweredNodePresent ? 'ok' : 'waiting',
    state: input.poweredNodePresent ? 'AVAILABLE' : 'WAITING_NODE',
    reason: OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  if (!input.poweredNodePresent) {
    row.status = 'waiting';
    row.state = 'WAITING_NODE';
  }
  store.offline.push(row);
  await save(input.root, store);
  return row;
}

export async function probeOfflineStopped(input: {
  agentId: string;
  root: string;
  actor: EdActor;
}): Promise<OfflineAgentProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.offline.length >= MAX_RUNTIME_EVENTS) {
    throw new Error('MAX_RUNTIME_EVENTS');
  }
  const row: OfflineAgentProbe = {
    id: id('edoffstop'),
    agentId: input.agentId,
    poweredNodePresent: false,
    status: 'stopped',
    state: 'OFFLINE_STOPPED',
    reason: OFFLINE_WAITING_OR_STOPPED,
    at: new Date().toISOString(),
  };
  store.offline.push(row);
  await save(input.root, store);
  return row;
}

export async function probeRuntimeEvidence(input: {
  runtimeId: string;
  claimRunningVerified: boolean;
  evidencePresent: boolean;
  heartbeatPresent: boolean;
  root: string;
  actor: EdActor;
}): Promise<RuntimeEvidenceProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.evidence.length >= MAX_RUNTIME_EVENTS) {
    throw new Error('MAX_RUNTIME_EVENTS');
  }
  const ok =
    input.claimRunningVerified &&
    input.evidencePresent &&
    input.heartbeatPresent;
  const denied = input.claimRunningVerified && !ok;
  const row: RuntimeEvidenceProbe = {
    id: id('edevid'),
    runtimeId: input.runtimeId,
    claimRunningVerified: input.claimRunningVerified,
    evidencePresent: input.evidencePresent,
    heartbeatPresent: input.heartbeatPresent,
    status: denied || !ok ? (input.claimRunningVerified ? 'denied' : 'ok') : 'ok',
    state: denied || (input.claimRunningVerified && !ok) ? 'DENIED' : ok ? 'RUNNING_VERIFIED' : 'NOT_VERIFIED',
    reason: RUNTIME_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  if (input.claimRunningVerified && (!input.evidencePresent || !input.heartbeatPresent)) {
    row.status = 'denied';
    row.state = 'DENIED';
    row.reason = RUNTIME_EVIDENCE_REQUIRED;
  }
  store.evidence.push(row);
  await save(input.root, store);
  return row;
}
