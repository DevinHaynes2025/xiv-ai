/**
 * 62L-DX Module H — Launch Reliability Command Center.
 * Reliability + chaos-simulation testing; chaos-sim ≠ production incident authority.
 * Soft-wires DW / DV / DU when PRESENT.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CHAOS_NEQ_PROD_AUTHORITY,
  MAX_RELIABILITY_EVENTS,
  OFFLINE_WAITING_OR_STOPPED,
  RELIABILITY_EVIDENCE_REQUIRED,
  TWIN_NEQ_FOUNDER,
  detectPredecessorLayer,
  predecessorMap,
  type DxActor,
  type DxEvidenceState,
} from './autonomous-supply-chain-ops-types';

export type ChaosSimulation = {
  id: string;
  scenario: string;
  labeledChaosSim: true;
  productionIncidentAuthority: false;
  status: 'labeled_chaos_sim' | 'denied';
  reason: string;
  at: string;
};

export type ReliabilityClaim = {
  id: string;
  claim: string;
  evidencePresent: boolean;
  state: 'NOT_VERIFIED' | 'VERIFIED' | 'UNAVAILABLE';
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type OfflineProbe = {
  id: string;
  poweredAuthorizedNode: boolean;
  state: 'WAITING_NODE' | 'OFFLINE_STOPPED' | 'AVAILABLE';
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorKind: DxActor['kind'];
  isFounder: false;
  status: 'denied' | 'ok';
  reason: string;
  at: string;
};

type Store = {
  chaosSims: ChaosSimulation[];
  reliabilityClaims: ReliabilityClaim[];
  offlineProbes: OfflineProbe[];
  twinProbes: TwinAuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'launch-reliability-command-center.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    chaosSims: [],
    reliabilityClaims: [],
    offlineProbes: [],
    twinProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function launchReliabilityCommandCenterHonesty(repoRoot?: string) {
  return {
    chaosSimEqProductionIncidentAuthority: false,
    reliabilityNeedsEvidence: true,
    predecessors: predecessorMap(repoRoot),
    predecessorLayer: detectPredecessorLayer(repoRoot),
  };
}

export async function runChaosSimulation(input: {
  scenario: string;
  claimProductionIncidentAuthority?: boolean;
  root: string;
  actor: DxActor;
}): Promise<ChaosSimulation> {
  const store = await load(input.root);
  void input.actor;
  if (store.chaosSims.length >= MAX_RELIABILITY_EVENTS) {
    throw new Error('MAX_RELIABILITY_EVENTS_REACHED');
  }
  const claiming = input.claimProductionIncidentAuthority === true;
  const sim: ChaosSimulation = {
    id: id('dxchaos'),
    scenario: input.scenario.trim(),
    labeledChaosSim: true,
    productionIncidentAuthority: false,
    status: claiming ? 'denied' : 'labeled_chaos_sim',
    reason: claiming ? CHAOS_NEQ_PROD_AUTHORITY : 'CHAOS_SIM_LABELED_ONLY',
    at: new Date().toISOString(),
  };
  store.chaosSims.push(sim);
  await save(input.root, store);
  return sim;
}

export async function claimReliability(input: {
  claim: string;
  evidencePresent: boolean;
  root: string;
  actor: DxActor;
}): Promise<ReliabilityClaim> {
  const store = await load(input.root);
  void input.actor;
  const record: ReliabilityClaim = {
    id: id('dxrel'),
    claim: input.claim.trim(),
    evidencePresent: input.evidencePresent,
    state: input.evidencePresent ? 'VERIFIED' : 'NOT_VERIFIED',
    status: input.evidencePresent ? 'ok' : 'denied',
    reason: input.evidencePresent
      ? 'RELIABILITY_EVIDENCE_RECORDED_NOT_PRODUCTION_AUTHORIZED'
      : RELIABILITY_EVIDENCE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.reliabilityClaims.push(record);
  await save(input.root, store);
  return record;
}

export async function probeOfflineReliability(input: {
  poweredAuthorizedNode: boolean;
  preferWaiting?: boolean;
  root: string;
  actor: DxActor;
}): Promise<OfflineProbe> {
  const store = await load(input.root);
  void input.actor;
  let state: OfflineProbe['state'] = 'AVAILABLE';
  let reason = 'POWERED_AUTHORIZED_NODE_PRESENT';
  if (!input.poweredAuthorizedNode) {
    state = input.preferWaiting === false ? 'OFFLINE_STOPPED' : 'WAITING_NODE';
    reason = OFFLINE_WAITING_OR_STOPPED;
  }
  const probe: OfflineProbe = {
    id: id('dxoff'),
    poweredAuthorizedNode: input.poweredAuthorizedNode,
    state,
    reason,
    at: new Date().toISOString(),
  };
  store.offlineProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeDigitalTwinAuthority(input: {
  actor: DxActor;
  claimFounderAuthority?: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  const claiming =
    input.claimFounderAuthority === true || input.actor.kind === 'digital_twin';
  const probe: TwinAuthorityProbe = {
    id: id('dxtwinauth'),
    actorKind: input.actor.kind,
    isFounder: false,
    status: claiming ? 'denied' : 'ok',
    reason: claiming ? TWIN_NEQ_FOUNDER : 'ACTOR_NOT_CLAIMING_FOUNDER_VIA_TWIN',
    at: new Date().toISOString(),
  };
  store.twinProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export function softWireDwDvStatus(repoRoot?: string): {
  layer: ReturnType<typeof detectPredecessorLayer>;
  dw: DxEvidenceState;
  dv: DxEvidenceState;
  du: DxEvidenceState;
  summary: string;
} {
  const map = predecessorMap(repoRoot);
  const layer = detectPredecessorLayer(repoRoot);
  const toState = (p: { tipProbe: string; report: string }): DxEvidenceState =>
    p.tipProbe === 'PRESENT' || p.report === 'PRESENT'
      ? 'AVAILABLE'
      : p.report === 'MISSING'
        ? 'WAITING_DATA'
        : 'WAITING_DATA';
  return {
    layer,
    dw: toState(map.DW),
    dv: toState(map.DV),
    du: toState(map.DU),
    summary: `predecessor=${layer}; DW=${map.DW.tipProbe}/${map.DW.report}; DV=${map.DV.tipProbe}/${map.DV.report}; DU=${map.DU.tipProbe}/${map.DU.report}`,
  };
}
