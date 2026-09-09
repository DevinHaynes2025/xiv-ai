/**
 * 62L-DZ Module A — Supply Chain Intelligence Fabric.
 * Root-cause pathways + disruption propagation: hypothesized unless verified.
 * Hard autonomy boundary denies freight / PO / contract / spend / prod-change.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTONOMY_BOUNDARY,
  AUTONOMY_BOUNDARY_DENIED_ACTIONS,
  CONTRACT_SIGNING_DENIED,
  DISRUPTION_NEQ_CAUSATION,
  FREIGHT_BOOKING_DENIED,
  MAX_PATHWAYS,
  PATHWAY_HYPOTHESIZED_ONLY,
  PRODUCTION_CHANGE_DENIED,
  PURCHASE_ORDER_DENIED,
  SPEND_MONEY_DENIED,
  type AutonomyBoundaryAction,
  type DzActor,
} from './supply-chain-intelligence-fabric-types';

export type RootCausePathway = {
  id: string;
  incidentId: string;
  summary: string;
  verifiedEvidence: boolean;
  causationClaimed: boolean;
  status: 'hypothesized' | 'verified_pathway' | 'denied';
  reason: string;
  physicalExecutionAuthorized: false;
  createdAt: string;
};

export type DisruptionPropagation = {
  id: string;
  sourceNode: string;
  targetNode: string;
  correlationObserved: boolean;
  verifiedCausation: boolean;
  status: 'hypothesized' | 'denied';
  reason: string;
  at: string;
};

export type AutonomyBoundaryDenial = {
  id: string;
  action: AutonomyBoundaryAction;
  status: 'denied';
  reason: string;
  founderHumanGateRequired: true;
  at: string;
};

type Store = {
  pathways: RootCausePathway[];
  disruptions: DisruptionPropagation[];
  denials: AutonomyBoundaryDenial[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'supply-chain-intelligence-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    pathways: [],
    disruptions: [],
    denials: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const DENIAL_REASON: Record<AutonomyBoundaryAction, string> = {
  book_freight: FREIGHT_BOOKING_DENIED,
  issue_purchase_order: PURCHASE_ORDER_DENIED,
  sign_contract: CONTRACT_SIGNING_DENIED,
  spend_money: SPEND_MONEY_DENIED,
  change_production_system: PRODUCTION_CHANGE_DENIED,
};

export function supplyChainIntelligenceFabricHonesty() {
  return {
    pathwaysHypothesizedUnlessVerified: true,
    correlationNeqCausation: true,
    physicalExecutionAuthorized: false,
    l4AutonomyEnabled: false,
    autonomyBoundary: AUTONOMY_BOUNDARY,
    recommendEqCharge: false,
    recommendEqDeploy: false,
    recommendEqSpend: false,
    recommendEqSign: false,
  };
}

export async function proposeRootCausePathway(input: {
  incidentId: string;
  summary: string;
  verifiedEvidence: boolean;
  causationClaimed?: boolean;
  attemptPhysicalExecution?: boolean;
  root: string;
  actor: DzActor;
}): Promise<RootCausePathway> {
  const store = await load(input.root);
  void input.actor;
  if (store.pathways.length >= MAX_PATHWAYS) {
    throw new Error('MAX_PATHWAYS_REACHED');
  }
  const claimedWithoutEvidence =
    Boolean(input.causationClaimed) && !input.verifiedEvidence;
  const pathway: RootCausePathway = {
    id: id('dzrcp'),
    incidentId: input.incidentId.trim(),
    summary: input.summary.trim(),
    verifiedEvidence: input.verifiedEvidence,
    causationClaimed: Boolean(input.causationClaimed),
    status: claimedWithoutEvidence
      ? 'denied'
      : input.verifiedEvidence
        ? 'verified_pathway'
        : 'hypothesized',
    reason: claimedWithoutEvidence
      ? DISRUPTION_NEQ_CAUSATION
      : input.verifiedEvidence
        ? 'PATHWAY_VERIFIED_WITH_EVIDENCE'
        : PATHWAY_HYPOTHESIZED_ONLY,
    physicalExecutionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.pathways.push(pathway);
  await save(input.root, store);
  return pathway;
}

export async function modelDisruptionPropagation(input: {
  sourceNode: string;
  targetNode: string;
  correlationObserved: boolean;
  verifiedCausation: boolean;
  root: string;
  actor: DzActor;
}): Promise<DisruptionPropagation> {
  const store = await load(input.root);
  void input.actor;
  const overclaim = input.correlationObserved && !input.verifiedCausation;
  const disruption: DisruptionPropagation = {
    id: id('dzdp'),
    sourceNode: input.sourceNode.trim(),
    targetNode: input.targetNode.trim(),
    correlationObserved: input.correlationObserved,
    verifiedCausation: input.verifiedCausation,
    status: overclaim || !input.verifiedCausation ? 'hypothesized' : 'hypothesized',
    reason: input.verifiedCausation
      ? 'VERIFIED_CAUSATION_PRESENT'
      : DISRUPTION_NEQ_CAUSATION,
    at: new Date().toISOString(),
  };
  // Always labeled hypothesized unless verified — never claim verified causation
  // from correlation alone. Even with verifiedCausation flag, pathway status
  // remains hypothesized in this module unless evidence is separately sealed.
  if (!input.verifiedCausation) {
    disruption.status = 'hypothesized';
    disruption.reason = DISRUPTION_NEQ_CAUSATION;
  }
  store.disruptions.push(disruption);
  await save(input.root, store);
  return disruption;
}

export async function denyAutonomyBoundaryAction(input: {
  action: AutonomyBoundaryAction;
  root: string;
  actor: DzActor;
}): Promise<AutonomyBoundaryDenial> {
  const store = await load(input.root);
  void input.actor;
  if (!AUTONOMY_BOUNDARY_DENIED_ACTIONS.includes(input.action)) {
    throw new Error('UNKNOWN_AUTONOMY_BOUNDARY_ACTION');
  }
  const denial: AutonomyBoundaryDenial = {
    id: id('dzabd'),
    action: input.action,
    status: 'denied',
    reason: DENIAL_REASON[input.action],
    founderHumanGateRequired: true,
    at: new Date().toISOString(),
  };
  store.denials.push(denial);
  await save(input.root, store);
  return denial;
}
