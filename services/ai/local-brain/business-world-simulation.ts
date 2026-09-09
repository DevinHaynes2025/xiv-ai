import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { BJ_LOCKS } from './global-operations-brain-types';

/**
 * Persistent organization/business digital twins + scenario Universes.
 * Simulation/scenario Universe ≠ verified fact; forecast ≠ fact.
 */

export type BusinessTwinKind = 'organization' | 'business_unit' | 'product_line' | 'market';

export type BusinessDigitalTwin = {
  id: string;
  kind: BusinessTwinKind;
  tenantId: string;
  universeId: string;
  displayName: string;
  isFounder: false;
  authority: 'SIMULATED_ONLY';
  productionAuthorization: false;
  createdAt: string;
};

export type ScenarioUniverse = {
  id: string;
  tenantId: string;
  parentUniverseId: string;
  label: string;
  isolated: true;
  verifiedFact: false;
  forecastIsFact: false;
  createdAt: string;
};

export type ScenarioRunInput = {
  tenantId: string;
  parentUniverseId: string;
  twinId: string;
  scenarioLabel: string;
  hypothesis: string;
  claimAsVerifiedFact?: boolean;
  root?: string;
};

export type ScenarioRunResult = {
  accepted: boolean;
  reason: string;
  scenario: ScenarioUniverse | null;
  forecast: string | null;
  verifiedFact: false;
  forecastIsFact: false;
  productionAuthorization: false;
};

type TwinStore = {
  twins: BusinessDigitalTwin[];
  scenarios: ScenarioUniverse[];
};

function storePath(root: string) {
  return join(root, '.xiv-local', 'business-world-simulation.json');
}

async function loadStore(root: string): Promise<TwinStore> {
  try {
    const raw = await readFile(storePath(root), 'utf8');
    const parsed = JSON.parse(raw) as TwinStore;
    return {
      twins: Array.isArray(parsed.twins) ? parsed.twins : [],
      scenarios: Array.isArray(parsed.scenarios) ? parsed.scenarios : [],
    };
  } catch {
    return { twins: [], scenarios: [] };
  }
}

async function saveStore(root: string, store: TwinStore) {
  await mkdir(join(root, '.xiv-local'), { recursive: true });
  await writeFile(storePath(root), JSON.stringify(store, null, 2), 'utf8');
}

export async function createBusinessDigitalTwin(input: {
  tenantId: string;
  universeId: string;
  kind: BusinessTwinKind;
  displayName: string;
  claimIsFounder?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) {
    return { accepted: false as const, reason: 'TENANT_AND_UNIVERSE_REQUIRED', twin: null };
  }
  if (input.claimIsFounder) {
    return {
      accepted: false as const,
      reason: 'DIGITAL_TWIN_IS_NOT_FOUNDER',
      twin: null,
    };
  }
  const root = input.root ?? process.cwd();
  const store = await loadStore(root);
  const twin: BusinessDigitalTwin = {
    id: `btwin_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    tenantId: input.tenantId,
    universeId: input.universeId,
    displayName: input.displayName,
    isFounder: false,
    authority: 'SIMULATED_ONLY',
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  store.twins.push(twin);
  await saveStore(root, store);
  return { accepted: true as const, reason: 'BUSINESS_TWIN_PERSISTED_SIMULATED_ONLY', twin };
}

export async function runScenarioUniverse(input: ScenarioRunInput): Promise<ScenarioRunResult> {
  const root = input.root ?? process.cwd();
  if (!input.tenantId || !input.parentUniverseId) {
    return {
      accepted: false,
      reason: 'TENANT_AND_UNIVERSE_REQUIRED',
      scenario: null,
      forecast: null,
      verifiedFact: false,
      forecastIsFact: false,
      productionAuthorization: false,
    };
  }
  if (input.claimAsVerifiedFact) {
    return {
      accepted: false,
      reason: 'SIMULATION_IS_NOT_VERIFIED_FACT',
      scenario: null,
      forecast: null,
      verifiedFact: false,
      forecastIsFact: false,
      productionAuthorization: false,
    };
  }

  const store = await loadStore(root);
  const twin = store.twins.find(
    (t) => t.id === input.twinId && t.tenantId === input.tenantId && t.universeId === input.parentUniverseId,
  );
  if (!twin) {
    return {
      accepted: false,
      reason: 'TWIN_NOT_FOUND_IN_PARENT_UNIVERSE',
      scenario: null,
      forecast: null,
      verifiedFact: false,
      forecastIsFact: false,
      productionAuthorization: false,
    };
  }

  const scenario: ScenarioUniverse = {
    id: `scen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    tenantId: input.tenantId,
    parentUniverseId: input.parentUniverseId,
    label: input.scenarioLabel,
    isolated: true,
    verifiedFact: false,
    forecastIsFact: false,
    createdAt: new Date().toISOString(),
  };
  store.scenarios.push(scenario);
  await saveStore(root, store);

  return {
    accepted: true,
    reason: 'SCENARIO_UNIVERSE_ISOLATED',
    scenario,
    forecast: `Forecast for "${input.hypothesis}" under twin ${twin.displayName} — forecast ≠ fact; scenario ≠ verified reality.`,
    verifiedFact: false,
    forecastIsFact: false,
    productionAuthorization: false,
  };
}

export function businessWorldHonesty() {
  return {
    locks: BJ_LOCKS,
    simulationIsVerifiedFact: BJ_LOCKS.SIMULATION_IS_VERIFIED_FACT,
    forecastIsFact: BJ_LOCKS.FORECAST_IS_FACT,
    digitalTwinIsFounder: BJ_LOCKS.DIGITAL_TWIN_IS_FOUNDER,
    productionAuthorization: false as const,
  };
}
