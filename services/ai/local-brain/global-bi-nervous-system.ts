import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ANOMALY_NON_VERIFIED,
  BI_DOMAINS,
  BM_LOCKS,
  FORECAST_NON_VERIFIED,
  SPARSE_BOUNDS,
  type BiDomain,
  type BmActor,
} from './org-neural-federation-types';

export const BI_NERVOUS_FILE = 'global-bi-nervous-system.json';

export type BiNervousNode = {
  id: string;
  federationId: string;
  domain: BiDomain;
  kind: 'node' | 'route' | 'index' | 'workcell' | 'pathway';
  label: string;
  /** Sparse logical coverage — not a live process. */
  liveProcess: false;
  active: boolean;
  createdAt: string;
};

export type BiPathway = {
  id: string;
  federationId: string;
  fromDomain: BiDomain;
  toDomain: BiDomain;
  label: string;
  liveProcess: false;
};

export type BiSignal = {
  id: string;
  at: string;
  federationId: string;
  domain: BiDomain;
  kind: 'forecast' | 'anomaly' | 'opportunity' | 'risk' | 'insight';
  summary: string;
  /** Forecasts and anomalies are never verified facts in this runtime. */
  verifiedFact: false;
  label: typeof FORECAST_NON_VERIFIED | typeof ANOMALY_NON_VERIFIED | 'NON_VERIFIED_SIGNAL';
  recommendationOnly: true;
  chargeOrDeploy: false;
  productionAuthorization: false;
};

type BiStore = {
  nodes: BiNervousNode[];
  pathways: BiPathway[];
  signals: BiSignal[];
};

const MAX_SIGNALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, BI_NERVOUS_FILE);
}

async function load(root: string): Promise<BiStore> {
  const parsed = await readJsonFile<BiStore>(storePath(root), {
    nodes: [],
    pathways: [],
    signals: [],
  });
  return {
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
    pathways: Array.isArray(parsed.pathways) ? parsed.pathways : [],
    signals: Array.isArray(parsed.signals) ? parsed.signals : [],
  };
}

async function save(root: string, store: BiStore) {
  await writeJsonFileAtomic(storePath(root), {
    nodes: store.nodes.slice(-(SPARSE_BOUNDS.maxNodesPerLayer * BI_DOMAINS.length)),
    pathways: store.pathways.slice(-SPARSE_BOUNDS.maxPathways),
    signals: store.signals.slice(-MAX_SIGNALS),
  });
}

/**
 * Index sparse Global BI Nervous System coverage across required domains.
 * Logical nodes/routes/indexes/workcells/pathways only — not process farms.
 */
export async function indexBiNervousCoverage(input: {
  federationId: string;
  actor: BmActor;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const nowIso = new Date(input.now ?? Date.now()).toISOString();
  const created: BiNervousNode[] = [];
  const pathways: BiPathway[] = [];

  for (const domain of BI_DOMAINS) {
    const existing = store.nodes.find(
      (n) => n.federationId === input.federationId && n.domain === domain && n.kind === 'node',
    );
    if (existing) {
      created.push(existing);
      continue;
    }
    const node: BiNervousNode = {
      id: `bi_${randomUUID()}`,
      federationId: input.federationId,
      domain,
      kind: 'node',
      label: `bi-${domain}`,
      liveProcess: false,
      active: true,
      createdAt: nowIso,
    };
    store.nodes.push(node);
    created.push(node);

    // One sparse index + pathway stub per domain.
    store.nodes.push({
      id: `bi_idx_${randomUUID()}`,
      federationId: input.federationId,
      domain,
      kind: 'index',
      label: `index-${domain}`,
      liveProcess: false,
      active: true,
      createdAt: nowIso,
    });
  }

  // Sparse pathways: executive_decision_support ← each domain (bounded).
  const existingPathCount = store.pathways.filter((p) => p.federationId === input.federationId).length;
  for (const domain of BI_DOMAINS) {
    if (domain === 'executive_decision_support') continue;
    if (existingPathCount + pathways.length >= SPARSE_BOUNDS.maxPathways) break;
    const path: BiPathway = {
      id: `bipath_${randomUUID()}`,
      federationId: input.federationId,
      fromDomain: domain,
      toDomain: 'executive_decision_support',
      label: `${domain}->executive_decision_support`,
      liveProcess: false,
    };
    pathways.push(path);
    store.pathways.push(path);
  }

  await save(root, store);

  return {
    accepted: true as const,
    domainsCovered: BI_DOMAINS.slice(),
    nodes: created,
    pathways,
    liveProcessesSpawned: 0 as const,
    reason: 'SPARSE_BI_NERVOUS_COVERAGE_INDEXED',
    productionAuthorization: false as const,
  };
}

/**
 * Emit a forecast — always labeled non-verified; never a verified fact.
 */
export async function emitBiForecast(input: {
  federationId: string;
  summary: string;
  actor: BmActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const signal: BiSignal = {
    id: `fc_${randomUUID()}`,
    at: new Date().toISOString(),
    federationId: input.federationId,
    domain: 'forecasts',
    kind: 'forecast',
    summary: input.summary,
    verifiedFact: false,
    label: FORECAST_NON_VERIFIED,
    recommendationOnly: true,
    chargeOrDeploy: false,
    productionAuthorization: false,
  };
  store.signals.push(signal);
  await save(root, store);
  return {
    signal,
    verifiedFact: false as const,
    label: FORECAST_NON_VERIFIED,
    locks: { FORECAST_IS_VERIFIED_FACT: BM_LOCKS.FORECAST_IS_VERIFIED_FACT },
  };
}

/**
 * Emit an anomaly — always labeled non-verified until human/evidence promotion.
 */
export async function emitBiAnomaly(input: {
  federationId: string;
  summary: string;
  actor: BmActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const signal: BiSignal = {
    id: `an_${randomUUID()}`,
    at: new Date().toISOString(),
    federationId: input.federationId,
    domain: 'anomalies',
    kind: 'anomaly',
    summary: input.summary,
    verifiedFact: false,
    label: ANOMALY_NON_VERIFIED,
    recommendationOnly: true,
    chargeOrDeploy: false,
    productionAuthorization: false,
  };
  store.signals.push(signal);
  await save(root, store);
  return {
    signal,
    verifiedFact: false as const,
    label: ANOMALY_NON_VERIFIED,
    locks: { ANOMALY_IS_VERIFIED_FACT: BM_LOCKS.ANOMALY_IS_VERIFIED_FACT },
  };
}

/**
 * Executive decision support — recommendation only; never charge/deploy.
 */
export async function executiveDecisionSupport(input: {
  federationId: string;
  topic: string;
  actor: BmActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const related = store.signals
    .filter((s) => s.federationId === input.federationId)
    .slice(-8)
    .map((s) => ({
      id: s.id,
      kind: s.kind,
      label: s.label,
      verifiedFact: false as const,
    }));

  return {
    topic: input.topic,
    recommendation: `Bounded recommendation for "${input.topic}" — human authority required.`,
    relatedSignals: related,
    recommendationOnly: true as const,
    chargeOrDeploy: false as const,
    verifiedFact: false as const,
    productionAuthorization: false as const,
    learningIsAuthority: false as const,
    locks: {
      RECOMMENDATION_IS_CHARGE_OR_DEPLOY: BM_LOCKS.RECOMMENDATION_IS_CHARGE_OR_DEPLOY,
      LEARNING_IS_AUTHORITY: BM_LOCKS.LEARNING_IS_AUTHORITY,
    },
  };
}

export function biNervousHonesty() {
  return {
    domains: BI_DOMAINS,
    forecastIsVerifiedFact: BM_LOCKS.FORECAST_IS_VERIFIED_FACT,
    anomalyIsVerifiedFact: BM_LOCKS.ANOMALY_IS_VERIFIED_FACT,
    neuronsAreSparseLogicalNodes: BM_LOCKS.NEURONS_ARE_SPARSE_LOGICAL_NODES,
    productionAuthorization: false as const,
    banner: 'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED',
  };
}
