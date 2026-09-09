/**
 * 62L-ED Module C — Lean Supply Chain Intelligence Factory.
 * Lean/Six Sigma intelligence; Kaizen experiments (advisory);
 * million-scale synthetic task generation labeled SYNTHETIC.
 * Experiment ≠ production change; synthetic ≠ real customer ownership.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  KAIZEN_NEQ_PROD_CHANGE,
  LEAN_ADVISORY_ONLY,
  MAX_LEAN_EVENTS,
  MILLION_SYNTHETIC_NEQ_CUSTOMER,
  SYNTHETIC_TASK_LABELED,
  type EdActor,
  type EdEvidenceState,
} from './data-galaxy-industry-memory-os-types';

export type LeanAdvisory = {
  id: string;
  experimentId: string;
  method: 'lean' | 'six_sigma' | 'kaizen';
  autoProdChangeRequested: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  productionChanged: false;
  at: string;
};

export type SyntheticTaskBatch = {
  id: string;
  batchId: string;
  scale: number;
  labeledSynthetic: boolean;
  claimedCustomerOwnership: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  advisories: LeanAdvisory[];
  batches: SyntheticTaskBatch[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'lean-supply-chain-intelligence-factory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    advisories: [],
    batches: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function leanSupplyChainIntelligenceFactoryHonesty() {
  return {
    leanSixSigmaAdvisoryOnly: true,
    kaizenExperimentNeqProductionChange: true,
    syntheticTasksLabeledSynthetic: true,
    millionScaleSyntheticNeqCustomerOwnership: true,
    selfPromotionDenied: true,
    l4AutonomyEnabled: false,
  };
}

export async function runLeanAdvisoryExperiment(input: {
  experimentId: string;
  method: LeanAdvisory['method'];
  autoProdChangeRequested?: boolean;
  root: string;
  actor: EdActor;
}): Promise<LeanAdvisory> {
  const store = await load(input.root);
  void input.actor;
  if (store.advisories.length >= MAX_LEAN_EVENTS) {
    throw new Error('MAX_LEAN_EVENTS');
  }
  const auto = input.autoProdChangeRequested === true;
  const reason =
    input.method === 'kaizen' && auto
      ? KAIZEN_NEQ_PROD_CHANGE
      : auto
        ? KAIZEN_NEQ_PROD_CHANGE
        : LEAN_ADVISORY_ONLY;
  const row: LeanAdvisory = {
    id: id('edlean'),
    experimentId: input.experimentId,
    method: input.method,
    autoProdChangeRequested: auto,
    status: auto ? 'denied' : 'ok',
    state: auto ? 'DENIED' : 'ADVISORY_ONLY',
    reason,
    productionChanged: false,
    at: new Date().toISOString(),
  };
  store.advisories.push(row);
  await save(input.root, store);
  return row;
}

export async function generateSyntheticSupplyChainTasks(input: {
  batchId: string;
  scale: number;
  labeledSynthetic?: boolean;
  claimedCustomerOwnership?: boolean;
  root: string;
  actor: EdActor;
}): Promise<SyntheticTaskBatch> {
  const store = await load(input.root);
  void input.actor;
  if (store.batches.length >= MAX_LEAN_EVENTS) {
    throw new Error('MAX_LEAN_EVENTS');
  }
  const labeled = input.labeledSynthetic !== false;
  const claimed = input.claimedCustomerOwnership === true;
  let status: SyntheticTaskBatch['status'] = 'ok';
  let state: EdEvidenceState = 'LABELED_SYNTHETIC';
  let reason = SYNTHETIC_TASK_LABELED;

  if (!labeled) {
    status = 'denied';
    state = 'DENIED';
    reason = SYNTHETIC_TASK_LABELED;
  } else if (claimed) {
    status = 'denied';
    state = 'DENIED';
    reason = MILLION_SYNTHETIC_NEQ_CUSTOMER;
  } else if (input.scale >= 1_000_000) {
    status = 'ok';
    state = 'LABELED_SYNTHETIC';
    reason = MILLION_SYNTHETIC_NEQ_CUSTOMER;
  }

  const row: SyntheticTaskBatch = {
    id: id('edsynth'),
    batchId: input.batchId,
    scale: input.scale,
    labeledSynthetic: labeled,
    claimedCustomerOwnership: claimed,
    status,
    state,
    reason,
    at: new Date().toISOString(),
  };
  store.batches.push(row);
  await save(input.root, store);
  return row;
}
