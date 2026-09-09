/**
 * 62L-DF Historical Data Atlas & Predictive Quant Engine —
 * Historical-data foundation; temporal knowledge graphs; lawful pathway mining;
 * classical quantitative baselines; calibration/outcome tracking;
 * bounded quantum research adapters (not guaranteed predictions).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DF_LOCKS,
  FORECAST_NOT_VERIFIED_FACT,
  HONESTY_BANNER,
  MAX_ATLAS_PATHWAYS,
  MAX_QUANT_FORECASTS,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  TRILLION_SCALE_NOT_VERIFIED,
  UNAUTHORIZED_HISTORICAL_MINING_DENIED,
  type DfActor,
  type ForecastLabel,
} from './human-centered-superbrain-ux-types';

export type AtlasPathway = {
  id: string;
  atlasId: string;
  pathwayId: string;
  lawfulAuthorized: boolean;
  hiddenJewel: boolean;
  status: 'REGISTERED' | 'DENIED' | 'MINED';
  reason: string;
  createdAt: string;
};

export type CapacityClaim = {
  id: string;
  atlasId: string;
  claimedScale: string;
  measured: boolean;
  measuredVolume: number | null;
  status: 'ARCHITECTURE_TARGET' | 'VERIFIED' | 'REJECTED';
  reason: string;
  at: string;
};

export type QuantForecast = {
  id: string;
  engineId: string;
  scenarioId: string;
  label: ForecastLabel;
  classicalBaselinePresent: boolean;
  quantumAdapterUsed: boolean;
  labeledVerifiedFact: false;
  guaranteed: false;
  status: 'ACCEPTED' | 'REJECTED' | 'DENIED';
  reason: string;
  calibrationTracked: boolean;
  outcomeTracked: boolean;
  at: string;
};

export type HistoricalAtlasQuantEngine = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

type Store = {
  engines: HistoricalAtlasQuantEngine[];
  pathways: AtlasPathway[];
  capacityClaims: CapacityClaim[];
  forecasts: QuantForecast[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-data-atlas-predictive-quant-engine.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    engines: [],
    pathways: [],
    capacityClaims: [],
    forecasts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function historicalAtlasQuantHonesty() {
  return {
    banner: HONESTY_BANNER,
    trillionScaleClaimedWithoutMeasurement:
      DF_LOCKS.TRILLION_SCALE_CLAIMED_WITHOUT_MEASUREMENT,
    trillionScaleArchitectureTargetUntilMeasured:
      DF_LOCKS.TRILLION_SCALE_IS_ARCHITECTURE_TARGET_UNTIL_MEASURED,
    quantumWithoutClassicalBaseline: DF_LOCKS.QUANTUM_PREDICTION_WITHOUT_CLASSICAL_BASELINE,
    quantumPredictionGuaranteed: DF_LOCKS.QUANTUM_PREDICTION_GUARANTEED,
    classicalBaselineRequired: DF_LOCKS.CLASSICAL_QUANT_BASELINE_REQUIRED,
    unauthorizedHistoricalMining: DF_LOCKS.UNAUTHORIZED_HISTORICAL_MINING,
    unauthorizedHiddenJewelDiscovery: DF_LOCKS.UNAUTHORIZED_HIDDEN_JEWEL_DISCOVERY,
    forecastLabeledAsVerifiedFact: DF_LOCKS.FORECAST_LABELED_AS_VERIFIED_FACT,
    scenarioMustBeLabeled: DF_LOCKS.SCENARIO_MUST_BE_LABELED,
  };
}

export async function bootstrapHistoricalAtlasQuantEngine(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DfActor;
}): Promise<HistoricalAtlasQuantEngine> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.engines.find(
    (e) =>
      e.orgId === input.orgId &&
      e.tenantId === input.tenantId &&
      e.universeId === input.universeId,
  );
  if (existing) return existing;
  const engine: HistoricalAtlasQuantEngine = {
    id: id('dfaq'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.engines.push(engine);
  await save(input.root, store);
  return engine;
}

export async function mineHistoricalPathway(input: {
  atlasId: string;
  pathwayId: string;
  lawfulAuthorized?: boolean;
  hiddenJewel?: boolean;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; pathway?: AtlasPathway; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const engine = store.engines.find((e) => e.id === input.atlasId);
  if (!engine) return { accepted: false, reason: 'ATLAS_ENGINE_NOT_FOUND', at: now };
  if (store.pathways.length >= MAX_ATLAS_PATHWAYS) {
    return { accepted: false, reason: 'MAX_ATLAS_PATHWAYS_BOUNDED', at: now };
  }

  const lawfulAuthorized = input.lawfulAuthorized === true;
  const hiddenJewel = input.hiddenJewel === true;

  if (!lawfulAuthorized || (hiddenJewel && !lawfulAuthorized)) {
    const pathway: AtlasPathway = {
      id: id('dfpw'),
      atlasId: engine.id,
      pathwayId: (input.pathwayId ?? '').trim() || 'unnamed-pathway',
      lawfulAuthorized: false,
      hiddenJewel,
      status: 'DENIED',
      reason: UNAUTHORIZED_HISTORICAL_MINING_DENIED,
      createdAt: now,
    };
    store.pathways.push(pathway);
    await save(input.root, store);
    return { accepted: false, reason: pathway.reason, pathway, at: now };
  }

  const pathway: AtlasPathway = {
    id: id('dfpw'),
    atlasId: engine.id,
    pathwayId: (input.pathwayId ?? '').trim() || 'unnamed-pathway',
    lawfulAuthorized: true,
    hiddenJewel,
    status: 'MINED',
    reason: hiddenJewel
      ? 'AUTHORIZED_HIDDEN_JEWEL_DISCOVERY_GOVERNED'
      : 'LAWFUL_HISTORICAL_PATHWAY_MINED',
    createdAt: now,
  };
  store.pathways.push(pathway);
  await save(input.root, store);
  return { accepted: true, reason: pathway.reason, pathway, at: now };
}

export async function claimTrillionScaleCapacity(input: {
  atlasId: string;
  claimedScale?: string;
  measured?: boolean;
  measuredVolume?: number | null;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; claim?: CapacityClaim; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const engine = store.engines.find((e) => e.id === input.atlasId);
  if (!engine) return { accepted: false, reason: 'ATLAS_ENGINE_NOT_FOUND', at: now };

  const measured = input.measured === true;
  const volume =
    typeof input.measuredVolume === 'number' && Number.isFinite(input.measuredVolume)
      ? input.measuredVolume
      : null;

  if (!measured || volume === null) {
    const claim: CapacityClaim = {
      id: id('dfcc'),
      atlasId: engine.id,
      claimedScale: input.claimedScale?.trim() || 'trillions_of_data',
      measured: false,
      measuredVolume: null,
      status: 'ARCHITECTURE_TARGET',
      reason: TRILLION_SCALE_NOT_VERIFIED,
      at: now,
    };
    store.capacityClaims.push(claim);
    await save(input.root, store);
    return { accepted: false, reason: claim.reason, claim, at: now };
  }

  const claim: CapacityClaim = {
    id: id('dfcc'),
    atlasId: engine.id,
    claimedScale: input.claimedScale?.trim() || 'measured_corpus',
    measured: true,
    measuredVolume: volume,
    status: 'VERIFIED',
    reason: 'MEASURED_CAPACITY_RECORDED_NOT_PRODUCTION_AUTHORIZED',
    at: now,
  };
  store.capacityClaims.push(claim);
  await save(input.root, store);
  return { accepted: true, reason: claim.reason, claim, at: now };
}

export async function submitPredictiveForecast(input: {
  engineId: string;
  scenarioId: string;
  label?: ForecastLabel | 'VERIFIED_FACT';
  classicalBaselinePresent?: boolean;
  quantumAdapterUsed?: boolean;
  claimVerifiedFact?: boolean;
  claimGuaranteed?: boolean;
  root: string;
  actor: DfActor;
}): Promise<{ accepted: boolean; reason: string; forecast?: QuantForecast; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const engine = store.engines.find((e) => e.id === input.engineId);
  if (!engine) return { accepted: false, reason: 'ATLAS_ENGINE_NOT_FOUND', at: now };
  if (store.forecasts.length >= MAX_QUANT_FORECASTS) {
    return { accepted: false, reason: 'MAX_QUANT_FORECASTS_BOUNDED', at: now };
  }

  const classicalBaselinePresent = input.classicalBaselinePresent === true;
  const quantumAdapterUsed = input.quantumAdapterUsed === true;
  const claimVerifiedFact = input.claimVerifiedFact === true || input.label === 'VERIFIED_FACT';
  const claimGuaranteed = input.claimGuaranteed === true;

  if (quantumAdapterUsed && (!classicalBaselinePresent || claimGuaranteed)) {
    const forecast: QuantForecast = {
      id: id('dffc'),
      engineId: engine.id,
      scenarioId: (input.scenarioId ?? '').trim() || 'unnamed-scenario',
      label: 'HYPOTHESIS',
      classicalBaselinePresent,
      quantumAdapterUsed,
      labeledVerifiedFact: false,
      guaranteed: false,
      status: 'REJECTED',
      reason: QUANTUM_WITHOUT_BASELINE_REJECTED,
      calibrationTracked: false,
      outcomeTracked: false,
      at: now,
    };
    store.forecasts.push(forecast);
    await save(input.root, store);
    return { accepted: false, reason: forecast.reason, forecast, at: now };
  }

  if (claimVerifiedFact || DF_LOCKS.FORECAST_LABELED_AS_VERIFIED_FACT) {
    const forecast: QuantForecast = {
      id: id('dffc'),
      engineId: engine.id,
      scenarioId: (input.scenarioId ?? '').trim() || 'unnamed-scenario',
      label: 'LABELED_FORECAST',
      classicalBaselinePresent,
      quantumAdapterUsed,
      labeledVerifiedFact: false,
      guaranteed: false,
      status: 'DENIED',
      reason: FORECAST_NOT_VERIFIED_FACT,
      calibrationTracked: true,
      outcomeTracked: true,
      at: now,
    };
    store.forecasts.push(forecast);
    await save(input.root, store);
    return { accepted: false, reason: forecast.reason, forecast, at: now };
  }

  const label: ForecastLabel =
    input.label === 'LABELED_SCENARIO' ||
    input.label === 'LABELED_SIMULATION' ||
    input.label === 'HYPOTHESIS' ||
    input.label === 'CALIBRATION_PENDING'
      ? input.label
      : 'LABELED_FORECAST';

  const forecast: QuantForecast = {
    id: id('dffc'),
    engineId: engine.id,
    scenarioId: (input.scenarioId ?? '').trim() || 'unnamed-scenario',
    label,
    classicalBaselinePresent,
    quantumAdapterUsed,
    labeledVerifiedFact: false,
    guaranteed: false,
    status: 'ACCEPTED',
    reason: 'LABELED_FORECAST_WITH_CALIBRATION_TRACKING',
    calibrationTracked: true,
    outcomeTracked: true,
    at: now,
  };
  store.forecasts.push(forecast);
  await save(input.root, store);
  return { accepted: true, reason: forecast.reason, forecast, at: now };
}
