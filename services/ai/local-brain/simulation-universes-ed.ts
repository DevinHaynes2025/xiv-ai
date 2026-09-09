/**
 * 62L-ED Module E — Simulation Universes.
 * Isolated workspace/sim branches — not literal alternate realities.
 * Agriculture/retail/semiconductor twins = sim/advisory; ≠ physical control.
 * Historical market research = authorized/public/licensed sources only.
 * Sim/forecast ≠ verified fact.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HISTORICAL_RESEARCH_AUTHORIZED,
  MAX_SIM_EVENTS,
  SIM_NEQ_FACT,
  SIM_UNIVERSE_ISOLATED,
  TWIN_NEQ_PHYSICAL_CONTROL,
  type EdActor,
  type EdEvidenceState,
} from './data-galaxy-industry-memory-os-types';

export type SimUniverse = {
  id: string;
  universeId: string;
  isolatedWorkspace: boolean;
  literalRealityClaimed: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type IndustryTwinProbe = {
  id: string;
  twinKind: 'agriculture' | 'retail' | 'semiconductor';
  physicalControlAttempted: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type HistoricalMarketResearch = {
  id: string;
  sourceAuthorized: boolean;
  sourcePublicOrLicensed: boolean;
  claimedVerifiedFact: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  universes: SimUniverse[];
  twins: IndustryTwinProbe[];
  research: HistoricalMarketResearch[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'simulation-universes-ed.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    universes: [],
    twins: [],
    research: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function simulationUniversesHonesty() {
  return {
    isolatedWorkspaceBranches: true,
    notLiteralAlternateRealities: true,
    simNeqVerifiedFact: true,
    industryTwinNeqPhysicalControl: true,
    historicalResearchAuthorizedSourcesOnly: true,
    l4AutonomyEnabled: false,
  };
}

export async function openSimulationUniverse(input: {
  universeId: string;
  isolatedWorkspace?: boolean;
  literalRealityClaimed?: boolean;
  root: string;
  actor: EdActor;
}): Promise<SimUniverse> {
  const store = await load(input.root);
  void input.actor;
  if (store.universes.length >= MAX_SIM_EVENTS) throw new Error('MAX_SIM_EVENTS');
  const literal = input.literalRealityClaimed === true;
  const isolated = input.isolatedWorkspace !== false;
  const denied = literal || !isolated;
  const row: SimUniverse = {
    id: id('edsim'),
    universeId: input.universeId,
    isolatedWorkspace: isolated,
    literalRealityClaimed: literal,
    status: denied ? 'denied' : 'ok',
    state: denied ? 'DENIED' : 'LABELED_SIMULATION',
    reason: denied ? SIM_NEQ_FACT : SIM_UNIVERSE_ISOLATED,
    at: new Date().toISOString(),
  };
  store.universes.push(row);
  await save(input.root, store);
  return row;
}

export async function probeIndustryTwin(input: {
  twinKind: IndustryTwinProbe['twinKind'];
  physicalControlAttempted?: boolean;
  claimVerifiedFact?: boolean;
  root: string;
  actor: EdActor;
}): Promise<IndustryTwinProbe & { verifiedFact: false }> {
  const store = await load(input.root);
  void input.actor;
  if (store.twins.length >= MAX_SIM_EVENTS) throw new Error('MAX_SIM_EVENTS');
  const physical = input.physicalControlAttempted === true;
  const factClaim = input.claimVerifiedFact === true;
  const denied = physical || factClaim;
  const row: IndustryTwinProbe & { verifiedFact: false } = {
    id: id('edtwin'),
    twinKind: input.twinKind,
    physicalControlAttempted: physical,
    status: denied ? 'denied' : 'ok',
    state: denied ? 'DENIED' : 'LABELED_SIMULATION',
    reason: physical
      ? TWIN_NEQ_PHYSICAL_CONTROL
      : factClaim
        ? SIM_NEQ_FACT
        : SIM_NEQ_FACT,
    verifiedFact: false,
    at: new Date().toISOString(),
  };
  if (!denied) {
    row.status = 'ok';
    row.state = 'LABELED_SIMULATION';
    row.reason = SIM_NEQ_FACT;
  }
  store.twins.push(row);
  await save(input.root, store);
  return row;
}

export async function ingestHistoricalMarketResearch(input: {
  sourceAuthorized: boolean;
  sourcePublicOrLicensed: boolean;
  claimedVerifiedFact?: boolean;
  root: string;
  actor: EdActor;
}): Promise<HistoricalMarketResearch> {
  const store = await load(input.root);
  void input.actor;
  if (store.research.length >= MAX_SIM_EVENTS) throw new Error('MAX_SIM_EVENTS');
  const authorized =
    input.sourceAuthorized && input.sourcePublicOrLicensed;
  const factClaim = input.claimedVerifiedFact === true;
  const denied = !authorized || factClaim;
  const row: HistoricalMarketResearch = {
    id: id('edhist'),
    sourceAuthorized: input.sourceAuthorized,
    sourcePublicOrLicensed: input.sourcePublicOrLicensed,
    claimedVerifiedFact: factClaim,
    status: denied ? 'denied' : 'ok',
    state: denied ? 'DENIED' : 'LABELED_FORECAST',
    reason: !authorized
      ? 'HISTORICAL_MARKET_RESEARCH_UNAUTHORIZED_SOURCE'
      : factClaim
        ? SIM_NEQ_FACT
        : HISTORICAL_RESEARCH_AUTHORIZED,
    at: new Date().toISOString(),
  };
  store.research.push(row);
  await save(input.root, store);
  return row;
}
