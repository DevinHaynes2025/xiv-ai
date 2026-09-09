/**
 * 62L-DV Module D — Semiconductor Intelligence Brain.
 * AMD/NVIDIA/CPU/GPU/NPU intelligence; workload routing.
 * Evidence before operational / RUNNING_VERIFIED claims.
 * Workload routing ≠ unauthorized fab/hardware remote control.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CHIP_NEQ_FAB_CONTROL,
  MAX_CHIP_ROUTES,
  SEMICONDUCTOR_EVIDENCE_REQUIRED,
  UNAUTHORIZED_CHIP_SOURCE,
  type DvActor,
  type DvEvidenceState,
} from './universal-data-industry-cortex-types';

export type ChipFamily = 'AMD' | 'NVIDIA' | 'CPU' | 'GPU' | 'NPU' | 'OTHER';

export type WorkloadRoute = {
  id: string;
  family: ChipFamily;
  workload: string;
  sourceAuthorized: boolean;
  fabRemoteControl: false;
  status: 'routed_candidate' | 'denied';
  reason: string;
  createdAt: string;
};

export type SemiconductorRuntimeProbe = {
  id: string;
  routeId: string;
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  attestationPresent: boolean;
  state: DvEvidenceState;
  reason: string;
  at: string;
};

export type FabControlAttempt = {
  id: string;
  routeId: string;
  attemptRemoteControl: boolean;
  status: 'denied';
  fabRemoteControl: false;
  reason: string;
  at: string;
};

type Store = {
  routes: WorkloadRoute[];
  runtimeProbes: SemiconductorRuntimeProbe[];
  fabAttempts: FabControlAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'semiconductor-intelligence-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    routes: [],
    runtimeProbes: [],
    fabAttempts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function semiconductorIntelligenceHonesty() {
  return {
    unauthorizedSourceAllowed: false,
    chipRoutingEqFabRemoteControl: false,
    runningVerifiedWithoutEvidence: false,
    authorizedPublicLicensedCustomerOwnedOnly: true,
  };
}

export async function routeChipWorkload(input: {
  family: ChipFamily;
  workload: string;
  sourceAuthorized: boolean;
  attemptFabRemoteControl?: boolean;
  root: string;
  actor: DvActor;
}): Promise<WorkloadRoute> {
  const store = await load(input.root);
  void input.actor;
  if (store.routes.length >= MAX_CHIP_ROUTES) {
    throw new Error('MAX_CHIP_ROUTES_REACHED');
  }
  const denied =
    !input.sourceAuthorized || input.attemptFabRemoteControl === true;
  const route: WorkloadRoute = {
    id: id('dvchip'),
    family: input.family,
    workload: input.workload.trim(),
    sourceAuthorized: input.sourceAuthorized,
    fabRemoteControl: false,
    status: denied ? 'denied' : 'routed_candidate',
    reason: !input.sourceAuthorized
      ? UNAUTHORIZED_CHIP_SOURCE
      : input.attemptFabRemoteControl
        ? CHIP_NEQ_FAB_CONTROL
        : 'CHIP_WORKLOAD_ROUTED_AUTHORIZED_SOURCE',
    createdAt: new Date().toISOString(),
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}

export async function probeSemiconductorRunningVerified(input: {
  routeId: string;
  heartbeatFresh: boolean;
  runtimeEvidencePresent: boolean;
  attestationPresent?: boolean;
  root: string;
  actor: DvActor;
}): Promise<SemiconductorRuntimeProbe> {
  const store = await load(input.root);
  void input.actor;
  const ok =
    input.heartbeatFresh &&
    input.runtimeEvidencePresent &&
    input.attestationPresent !== false;
  const probe: SemiconductorRuntimeProbe = {
    id: id('dvsemrun'),
    routeId: input.routeId,
    heartbeatFresh: input.heartbeatFresh,
    runtimeEvidencePresent: input.runtimeEvidencePresent,
    attestationPresent: input.attestationPresent !== false,
    state: ok ? 'RUNNING_VERIFIED' : 'NOT_VERIFIED',
    reason: ok
      ? 'RUNNING_VERIFIED_WITH_HEARTBEAT_RUNTIME_EVIDENCE'
      : SEMICONDUCTOR_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.runtimeProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function attemptFabRemoteControl(input: {
  routeId: string;
  attemptRemoteControl: boolean;
  root: string;
  actor: DvActor;
}): Promise<FabControlAttempt> {
  const store = await load(input.root);
  void input.actor;
  const attempt: FabControlAttempt = {
    id: id('dvfab'),
    routeId: input.routeId,
    attemptRemoteControl: input.attemptRemoteControl,
    status: 'denied',
    fabRemoteControl: false,
    reason: CHIP_NEQ_FAB_CONTROL,
    at: new Date().toISOString(),
  };
  store.fabAttempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
