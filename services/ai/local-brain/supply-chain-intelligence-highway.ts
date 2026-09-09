/**
 * 62L-DL Global Supply Chain Intelligence Highway —
 * Provenance-aware supply-chain intelligence with route policies.
 * Forecast ≠ verified fact.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DL_LOCKS,
  HONESTY_BANNER,
  MAX_SUPPLY_FORECASTS,
  MAX_SUPPLY_HIGHWAY_ROUTES,
  ROUTE_WITHOUT_POLICY_DENIED,
  SUPPLY_CHAIN_FORECAST_NOT_FACT,
  type DlActor,
} from './neural-transportation-os-types';

export type SupplyChainIntelligenceHighway = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  provenanceAware: true;
  createdAt: string;
};

export type SupplyRoutePolicy = {
  id: string;
  highwayId: string;
  routeId: string;
  allowlist: string[];
  revoked: boolean;
  createdAt: string;
};

export type SupplyIntelligenceTransport = {
  id: string;
  highwayId: string;
  routeId: string;
  laneOrSku: string;
  provenanceRef: string | null;
  status: 'ALLOWED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type SupplyChainForecast = {
  id: string;
  highwayId: string;
  skuOrLane: string;
  provenanceRef: string | null;
  label: 'LABELED_FORECAST' | 'PROBABILISTIC' | 'DENIED';
  labeledVerifiedFact: false;
  status: 'ACCEPTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

type Store = {
  highways: SupplyChainIntelligenceHighway[];
  policies: SupplyRoutePolicy[];
  transports: SupplyIntelligenceTransport[];
  forecasts: SupplyChainForecast[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'supply-chain-intelligence-highway.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    highways: [],
    policies: [],
    transports: [],
    forecasts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function supplyChainIntelligenceHighwayHonesty() {
  return {
    banner: HONESTY_BANNER,
    supplyChainForecastLabeledVerifiedFact:
      DL_LOCKS.SUPPLY_CHAIN_FORECAST_LABELED_VERIFIED_FACT,
    supplyChainForecastNeqFact: DL_LOCKS.SUPPLY_CHAIN_FORECAST_NEQ_FACT,
    supplyChainProvenanceAware: DL_LOCKS.SUPPLY_CHAIN_PROVENANCE_AWARE,
  };
}

export async function bootstrapSupplyChainIntelligenceHighway(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DlActor;
}): Promise<SupplyChainIntelligenceHighway> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.highways.find(
    (h) =>
      h.orgId === input.orgId &&
      h.tenantId === input.tenantId &&
      h.universeId === input.universeId,
  );
  if (existing) return existing;
  const highway: SupplyChainIntelligenceHighway = {
    id: id('dlsch'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    provenanceAware: true,
    createdAt: new Date().toISOString(),
  };
  store.highways.push(highway);
  await save(input.root, store);
  return highway;
}

export async function registerSupplyRoutePolicy(input: {
  highwayId: string;
  routeId: string;
  allowlist: string[];
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; policy?: SupplyRoutePolicy; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const highway = store.highways.find((h) => h.id === input.highwayId);
  if (!highway) return { accepted: false, reason: 'HIGHWAY_NOT_FOUND', at: now };
  if (store.policies.length >= MAX_SUPPLY_HIGHWAY_ROUTES) {
    return { accepted: false, reason: 'MAX_SUPPLY_HIGHWAY_ROUTES_REACHED', at: now };
  }
  const allowlist = (input.allowlist ?? []).map((x) => x.trim()).filter(Boolean);
  if (allowlist.length === 0) {
    return { accepted: false, reason: ROUTE_WITHOUT_POLICY_DENIED, at: now };
  }
  const policy: SupplyRoutePolicy = {
    id: id('dlspol'),
    highwayId: input.highwayId,
    routeId: input.routeId.trim(),
    allowlist,
    revoked: false,
    createdAt: now,
  };
  store.policies.push(policy);
  await save(input.root, store);
  return { accepted: true, reason: 'SUPPLY_ROUTE_POLICY_REGISTERED', policy, at: now };
}

export async function transportSupplyIntelligence(input: {
  highwayId: string;
  routeId: string;
  laneOrSku: string;
  actorId?: string;
  provenanceRef?: string;
  root: string;
  actor: DlActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  transport?: SupplyIntelligenceTransport;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const highway = store.highways.find((h) => h.id === input.highwayId);
  if (!highway) return { accepted: false, reason: 'HIGHWAY_NOT_FOUND', at: now };

  const policy = store.policies.find(
    (p) => p.highwayId === input.highwayId && p.routeId === input.routeId && !p.revoked,
  );
  const actorKey = (input.actorId ?? input.actor.id).trim();
  if (
    !policy ||
    (!policy.allowlist.includes(actorKey) && !policy.allowlist.includes('*'))
  ) {
    const transport: SupplyIntelligenceTransport = {
      id: id('dlsci'),
      highwayId: input.highwayId,
      routeId: input.routeId,
      laneOrSku: input.laneOrSku,
      provenanceRef: input.provenanceRef?.trim() || null,
      status: 'DENIED',
      reason: ROUTE_WITHOUT_POLICY_DENIED,
      createdAt: now,
    };
    store.transports.push(transport);
    await save(input.root, store);
    return { accepted: false, reason: ROUTE_WITHOUT_POLICY_DENIED, transport, at: now };
  }

  const transport: SupplyIntelligenceTransport = {
    id: id('dlsci'),
    highwayId: input.highwayId,
    routeId: input.routeId,
    laneOrSku: input.laneOrSku,
    provenanceRef: input.provenanceRef?.trim() || null,
    status: 'ALLOWED',
    reason: 'SUPPLY_INTELLIGENCE_TRANSPORTED_UNDER_ROUTE_POLICY',
    createdAt: now,
  };
  store.transports.push(transport);
  await save(input.root, store);
  return { accepted: true, reason: transport.reason, transport, at: now };
}

export async function submitSupplyChainIntelligenceForecast(input: {
  highwayId: string;
  skuOrLane: string;
  provenanceRef?: string;
  labelAsVerifiedFact?: boolean;
  root: string;
  actor: DlActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  forecast?: SupplyChainForecast;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const highway = store.highways.find((h) => h.id === input.highwayId);
  if (!highway) return { accepted: false, reason: 'HIGHWAY_NOT_FOUND', at: now };

  if (store.forecasts.length >= MAX_SUPPLY_FORECASTS) {
    return { accepted: false, reason: 'MAX_SUPPLY_FORECASTS_REACHED', at: now };
  }

  if (input.labelAsVerifiedFact === true) {
    const forecast: SupplyChainForecast = {
      id: id('dlfc'),
      highwayId: input.highwayId,
      skuOrLane: input.skuOrLane,
      provenanceRef: input.provenanceRef?.trim() || null,
      label: 'DENIED',
      labeledVerifiedFact: false,
      status: 'DENIED',
      reason: SUPPLY_CHAIN_FORECAST_NOT_FACT,
      createdAt: now,
    };
    store.forecasts.push(forecast);
    await save(input.root, store);
    return { accepted: false, reason: SUPPLY_CHAIN_FORECAST_NOT_FACT, forecast, at: now };
  }

  const forecast: SupplyChainForecast = {
    id: id('dlfc'),
    highwayId: input.highwayId,
    skuOrLane: input.skuOrLane,
    provenanceRef: input.provenanceRef?.trim() || null,
    label: 'LABELED_FORECAST',
    labeledVerifiedFact: false,
    status: 'ACCEPTED',
    reason: 'SUPPLY_CHAIN_FORECAST_ACCEPTED_AS_LABELED_FORECAST_NOT_FACT',
    createdAt: now,
  };
  store.forecasts.push(forecast);
  await save(input.root, store);
  return { accepted: true, reason: forecast.reason, forecast, at: now };
}
