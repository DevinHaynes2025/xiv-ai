/**
 * 62L-DW Module G — Global Industry Knowledge Graph.
 * Modular industry packs; wedge-first behind supply-chain pilot (gate, not fake GA).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  INDUSTRY_BEHIND_PILOT,
  MAX_INDUSTRY_PACKS,
  WEDGE_FIRST_GATED,
  type DwActor,
} from './supply-chain-superbrain-types';

export type IndustryPack = {
  id: string;
  packId: string;
  industry: string;
  supplyChainPilotProven: boolean;
  status: 'gated' | 'pilot_eligible' | 'denied';
  reason: string;
  createdAt: string;
};

export type BroaderIndustryGate = {
  id: string;
  supplyChainPilotProofPresent: boolean;
  attemptBroaderIndustry: boolean;
  status: 'allowed_pilot' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  packs: IndustryPack[];
  gates: BroaderIndustryGate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-industry-knowledge-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { packs: [], gates: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function globalIndustryKnowledgeGraphHonesty() {
  return {
    broaderIndustryBeforeSupplyChainPilot: false,
    wedgeFirstSupplyChainPilot: true,
    fakeGaClaimed: false,
    modularIndustryPacks: true,
  };
}

export async function registerIndustryPack(input: {
  packId: string;
  industry: string;
  supplyChainPilotProven: boolean;
  root: string;
  actor: DwActor;
}): Promise<IndustryPack> {
  const store = await load(input.root);
  void input.actor;
  if (store.packs.length >= MAX_INDUSTRY_PACKS) throw new Error('MAX_INDUSTRY_PACKS_REACHED');
  const pack: IndustryPack = {
    id: id('dwpack'),
    packId: input.packId.trim(),
    industry: input.industry.trim(),
    supplyChainPilotProven: input.supplyChainPilotProven,
    status: input.supplyChainPilotProven ? 'pilot_eligible' : 'gated',
    reason: INDUSTRY_BEHIND_PILOT,
    createdAt: new Date().toISOString(),
  };
  store.packs.push(pack);
  await save(input.root, store);
  return pack;
}

export async function evaluateBroaderIndustryGate(input: {
  supplyChainPilotProofPresent: boolean;
  attemptBroaderIndustry: boolean;
  root: string;
  actor: DwActor;
}): Promise<BroaderIndustryGate> {
  const store = await load(input.root);
  void input.actor;
  // Broader industry expansion stays behind supply-chain pilot (gate, not fake GA).
  const gate: BroaderIndustryGate = {
    id: id('dwigate'),
    supplyChainPilotProofPresent: input.supplyChainPilotProofPresent,
    attemptBroaderIndustry: input.attemptBroaderIndustry,
    status: 'denied',
    reason: WEDGE_FIRST_GATED,
    at: new Date().toISOString(),
  };
  if (input.attemptBroaderIndustry && !input.supplyChainPilotProofPresent) {
    gate.status = 'denied';
    gate.reason = WEDGE_FIRST_GATED;
  } else if (!input.supplyChainPilotProofPresent) {
    gate.status = 'denied';
    gate.reason = WEDGE_FIRST_GATED;
  } else {
    // Pilot proof present: still pilot-eligible only — not production GA for broader industry.
    gate.status = 'allowed_pilot';
    gate.reason = INDUSTRY_BEHIND_PILOT;
  }
  store.gates.push(gate);
  await save(input.root, store);
  return gate;
}
