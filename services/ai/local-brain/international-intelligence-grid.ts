/**
 * 62L-CM International Business/Law/Health/Supply Intelligence Grid.
 * Provenance-aware; forecast/simulation ≠ verified fact.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CM_LOCKS,
  FORECAST_SIM_NOT_FACT,
  HONESTY_BANNER,
  type CmActor,
} from './sovereign-regional-knowledge-clouds-types';

export type IntelDomain = 'business' | 'law' | 'health' | 'supply';

export type IntelHonestyLabel =
  | 'verified_fact'
  | 'forecast'
  | 'simulation'
  | 'hypothesis'
  | 'aggregate';

export type IntelligenceOutput = {
  id: string;
  domain: IntelDomain;
  summary: string;
  provenanceRefs: string[];
  honestyLabel: IntelHonestyLabel;
  accepted: boolean;
  reason: string;
  productionAuthorized: false;
  at: string;
};

type Store = {
  outputs: IntelligenceOutput[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'international-intelligence-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { outputs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function intelligenceGridHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CM_LOCKS.L4_AUTONOMY_ENABLED,
    forecastEqVerifiedFact: CM_LOCKS.FORECAST_EQ_VERIFIED_FACT,
    simulationEqVerifiedFact: CM_LOCKS.SIMULATION_EQ_VERIFIED_FACT,
  };
}

export async function emitIntelligenceOutput(input: {
  domain: IntelDomain;
  summary: string;
  provenanceRefs?: string[];
  intendedLabel: IntelHonestyLabel;
  root: string;
  actor: CmActor;
}): Promise<IntelligenceOutput> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const provenance = input.provenanceRefs ?? [];

  let honestyLabel = input.intendedLabel;
  let accepted = true;
  let reason = 'INTELLIGENCE_OUTPUT_LABELED';

  // Forecast/sim cannot be relabeled as verified fact.
  if (
    (input.intendedLabel === 'forecast' || input.intendedLabel === 'simulation') &&
    false
  ) {
    // unreachable placeholder — actual deny path below via attemptRelabel
  }

  if (input.intendedLabel === 'verified_fact' && provenance.length === 0) {
    honestyLabel = 'hypothesis';
    accepted = false;
    reason = FORECAST_SIM_NOT_FACT;
  }

  const output: IntelligenceOutput = {
    id: id('intel'),
    domain: input.domain,
    summary: input.summary,
    provenanceRefs: provenance,
    honestyLabel,
    accepted,
    reason,
    productionAuthorized: false,
    at: now,
  };
  store.outputs.push(output);
  await save(input.root, store);
  return output;
}

export async function attemptRelabelForecastOrSimAsFact(input: {
  outputId: string;
  root: string;
  actor: CmActor;
}): Promise<IntelligenceOutput> {
  const store = await load(input.root);
  const output = store.outputs.find((o) => o.id === input.outputId);
  if (!output) {
    throw new Error('INTELLIGENCE_OUTPUT_NOT_FOUND');
  }
  if (output.honestyLabel === 'forecast' || output.honestyLabel === 'simulation') {
    const denial: IntelligenceOutput = {
      ...output,
      id: id('intel'),
      honestyLabel: output.honestyLabel,
      accepted: false,
      reason: FORECAST_SIM_NOT_FACT,
      productionAuthorized: false,
      at: new Date().toISOString(),
    };
    store.outputs.push(denial);
    await save(input.root, store);
    return denial;
  }
  return output;
}
