/**
 * 62L-DW Module A — Supply Chain Superbrain.
 * Inventory / transportation / warehouse / supplier-risk nodes; advisory; human gates.
 * Recommendation ≠ charge / deploy / spend.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_SC_NODES,
  SC_ADVISORY_NEQ_DEPLOY,
  SC_HUMAN_GATE_REQUIRED,
  UNCONFIGURED_SC_PROVIDER,
  isHumanOrFounder,
  type DwActor,
} from './supply-chain-superbrain-types';

export type ScNodeKind = 'inventory' | 'transportation' | 'warehouse' | 'supplier_risk';

export type ScAdvisory = {
  id: string;
  nodeKind: ScNodeKind;
  summary: string;
  action: 'recommend';
  chargesCustomer: false;
  deploysSpend: false;
  status: 'recommendation_only' | 'denied';
  reason: string;
  createdAt: string;
};

export type ScHumanGate = {
  id: string;
  advisoryId: string;
  humanGatePresent: boolean;
  autoExecuted: false;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

export type ScProviderProbe = {
  providerId: string;
  configured: boolean;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  advisories: ScAdvisory[];
  gates: ScHumanGate[];
  providers: ScProviderProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'supply-chain-superbrain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    advisories: [],
    gates: [],
    providers: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function supplyChainSuperbrainHonesty() {
  return {
    recommendEqCharge: false,
    recommendEqDeploy: false,
    recommendEqSpend: false,
    humanGateRequired: true,
    l4AutonomyEnabled: false,
    unconfiguredProviderInventedAvailable: false,
  };
}

export async function recommendSupplyChainAction(input: {
  nodeKind: ScNodeKind;
  summary: string;
  attemptDeploySpend?: boolean;
  attemptCharge?: boolean;
  root: string;
  actor: DwActor;
}): Promise<ScAdvisory> {
  const store = await load(input.root);
  void input.actor;
  if (store.advisories.length >= MAX_SC_NODES) throw new Error('MAX_SC_NODES_REACHED');
  const advisory: ScAdvisory = {
    id: id('dwsc'),
    nodeKind: input.nodeKind,
    summary: input.summary.trim(),
    action: 'recommend',
    chargesCustomer: false,
    deploysSpend: false,
    status: 'recommendation_only',
    reason: SC_ADVISORY_NEQ_DEPLOY,
    createdAt: new Date().toISOString(),
  };
  store.advisories.push(advisory);
  await save(input.root, store);
  return advisory;
}

export async function requireSupplyChainHumanGate(input: {
  advisoryId: string;
  humanGatePresent: boolean;
  attemptAutoExecute?: boolean;
  root: string;
  actor: DwActor;
}): Promise<ScHumanGate> {
  const store = await load(input.root);
  const allowed =
    input.humanGatePresent && isHumanOrFounder(input.actor) && !input.attemptAutoExecute;
  const gate: ScHumanGate = {
    id: id('dwgate'),
    advisoryId: input.advisoryId,
    humanGatePresent: input.humanGatePresent,
    autoExecuted: false,
    status: allowed ? 'allowed' : 'denied',
    reason: allowed ? 'SC_HUMAN_GATE_PRESENT' : SC_HUMAN_GATE_REQUIRED,
    at: new Date().toISOString(),
  };
  store.gates.push(gate);
  await save(input.root, store);
  return gate;
}

export async function probeSupplyChainProvider(input: {
  providerId: string;
  configured: boolean;
  claimAvailable?: boolean;
  root: string;
  actor: DwActor;
}): Promise<ScProviderProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: ScProviderProbe = input.configured
    ? {
        providerId: input.providerId,
        configured: true,
        availability: 'AVAILABLE',
        status: 'ok',
        reason: 'SC_PROVIDER_CONFIGURED_NOT_PRODUCTION_AUTHORIZED',
        at: new Date().toISOString(),
      }
    : {
        providerId: input.providerId,
        configured: false,
        availability: 'UNAVAILABLE',
        status: 'denied',
        reason: UNCONFIGURED_SC_PROVIDER,
        at: new Date().toISOString(),
      };
  store.providers.push(probe);
  await save(input.root, store);
  return probe;
}
