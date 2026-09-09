import {
  DEFAULT_ROUTE_WEIGHTS,
  ROUTE_SCORE_DIMENSIONS,
  type EvidenceState,
  type InformationRoot,
  type RouteMetrics,
  type RouteScoreDimension,
  type SemanticQuery,
} from './information-control-tower-types';
import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';

export type RouteScore = {
  rootId: string;
  score: number;
  usedPopularity: false;
  missingDimensions: RouteScoreDimension[];
  slaBreached: boolean;
  state: EvidenceState;
  reason: string;
};

export type PolicyFilterResult = {
  root: InformationRoot;
  admitted: boolean;
  state: EvidenceState;
  reason: string;
};

export type FederatedDialect = 'knowledge_lake' | 'learning_ledger' | 'knowledge_graph' | 'evidence_ledger' | 'unavailable';

export type TranslatedQuery = {
  dialect: FederatedDialect;
  pushdown: Record<string, string | boolean | undefined>;
  returnsRawRows: false;
  minimizeMovement: true;
  state: EvidenceState;
  reason: string;
};

export type CongestionDecision = {
  admitted: boolean;
  inflight: number;
  cap: number;
  reason: string;
  state: EvidenceState | 'LOCAL_EXECUTABLE';
};

export type LoopDetection = {
  loop: boolean;
  repeatedNode?: string;
  path: string[];
  state: EvidenceState;
  reason: string;
};

export type VendorLockInReport = {
  rootId: string;
  vendorId: string;
  singleVendor: boolean;
  portability: number;
  popularityUsed: false;
  recommendation: 'prefer_portable_or_local' | 'acceptable' | 'unavailable';
  reason: string;
};

const inflightByRoot = new Map<string, number>();

export function resetRouterCongestion() {
  inflightByRoot.clear();
}

function clamp01(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(1, value));
}

export function freshnessFromSla(root: InformationRoot, now = Date.now()): { freshness: number; slaBreached: boolean } {
  const maxStalenessMs = root.maxStalenessMs ?? 86_400_000;
  if (!root.lastVerifiedAt) return { freshness: clamp01(root.metrics.freshness) ?? 0, slaBreached: true };
  const age = now - Date.parse(root.lastVerifiedAt);
  if (!Number.isFinite(age) || age < 0) return { freshness: 0, slaBreached: true };
  const freshness = age >= maxStalenessMs ? 0 : 1 - age / maxStalenessMs;
  return { freshness, slaBreached: age >= maxStalenessMs };
}

export function scoreInformationRoute(
  root: InformationRoot,
  weights: Record<RouteScoreDimension, number> = DEFAULT_ROUTE_WEIGHTS,
  now = Date.now(),
): RouteScore {
  const sla = freshnessFromSla(root, now);
  const metrics: RouteMetrics = {
    ...root.metrics,
    freshness: sla.freshness,
    offlineAvailability: root.offlineAvailable ? (root.metrics.offlineAvailability ?? 1) : 0,
  };
  const missingDimensions: RouteScoreDimension[] = [];
  let weighted = 0;
  let totalWeight = 0;
  for (const dimension of ROUTE_SCORE_DIMENSIONS) {
    const weight = weights[dimension];
    totalWeight += weight;
    const value = clamp01(metrics[dimension]);
    if (value === undefined) {
      missingDimensions.push(dimension);
      continue;
    }
    weighted += weight * value;
  }
  const score = totalWeight === 0 ? 0 : weighted / totalWeight;
  void metrics.popularity;
  let state: EvidenceState = 'PASS';
  let reason = 'Route scored on freshness, provenance, trust, privacy, latency, cost, offline availability, compatibility, and verified outcome quality. Popularity is ignored.';
  if (!root.configured || !root.authorized || !root.verified) {
    state = 'UNAVAILABLE';
    reason = 'Unconfigured, unauthorized, or unverified roots are UNAVAILABLE and are not ranked by popularity.';
  } else if (sla.slaBreached && !root.offlineAvailable) {
    state = 'WAITING_DATA';
    reason = 'Freshness SLA breached and the root is not offline-available.';
  } else if (missingDimensions.includes('verifiedOutcomeQuality') && missingDimensions.includes('provenance')) {
    state = 'UNKNOWN';
    reason = 'Insufficient provenance and verified outcome quality to trust this route.';
  }
  return {
    rootId: root.id,
    score,
    usedPopularity: false,
    missingDimensions,
    slaBreached: sla.slaBreached,
    state,
    reason,
  };
}

export function policyFilterRoot(root: InformationRoot, query: SemanticQuery): PolicyFilterResult {
  if (root.partnershipInvented !== false) {
    return { root, admitted: false, state: 'FAIL', reason: 'Invented partnerships are forbidden.' };
  }
  if (root.kind === 'data_fabric') {
    return {
      root,
      admitted: false,
      state: 'WAITING_DATA',
      reason: '62L-AM Information Supply Chain / Data Fabric is not on this parent. Raw pooling is not substituted.',
    };
  }
  if (root.kind === 'edge_sync') {
    return {
      root,
      admitted: false,
      state: 'WAITING_DATA',
      reason: '62L-AL Edge Sync is not on this parent. Local offline routes remain eligible.',
    };
  }
  if (root.kind === 'provider') {
    const slot = providerSlots().find((item) => item.provider === root.vendorId);
    const runtime = root.vendorId === 'aws' || root.vendorId === 'azure' || root.vendorId === 'gcp' || root.vendorId === 'local'
      ? getRuntime(root.vendorId)
      : undefined;
    const configured = root.configured && (slot?.configured === true || runtime?.configured === true);
    if (!configured || !root.authorized || !root.verified) {
      return { root, admitted: false, state: 'UNAVAILABLE', reason: 'Unconfigured providers are UNAVAILABLE.' };
    }
  }
  if (root.kind === 'enterprise_peer' && (!root.configured || !root.authorized || !root.verified)) {
    return { root, admitted: false, state: 'UNAVAILABLE', reason: 'Enterprise peers require an approved contract; none is invented.' };
  }
  if (!root.configured || !root.authorized || !root.verified) {
    return { root, admitted: false, state: 'UNAVAILABLE', reason: 'Root is unconfigured, unauthorized, or unverified.' };
  }
  if (query.partition === 'personal' || query.partition === 'company') {
    if (root.kind === 'enterprise_peer' || root.kind === 'provider') {
      return {
        root,
        admitted: false,
        state: 'FAIL',
        reason: 'Company/personal partitions cannot be routed to peers or providers as raw data.',
      };
    }
  }
  const loop = detectRouteLoop(root.hopPath ?? [root.id]);
  if (loop.loop) {
    return { root, admitted: false, state: 'FAIL', reason: loop.reason };
  }
  return { root, admitted: true, state: 'PASS', reason: 'Root passed policy filter.' };
}

export function rankRoutes(roots: InformationRoot[], query: SemanticQuery, now = Date.now()) {
  const filtered = roots.map((root) => policyFilterRoot(root, query));
  const scored = filtered
    .filter((item) => item.admitted)
    .map((item) => ({ filter: item, score: scoreInformationRoute(item.root, DEFAULT_ROUTE_WEIGHTS, now) }))
    .sort((a, b) => b.score.score - a.score.score);
  return { filtered, scored };
}

export function selectMultiPathRoutes(
  roots: InformationRoot[],
  query: SemanticQuery,
  maxPaths = 3,
  now = Date.now(),
) {
  const ranked = rankRoutes(roots, query, now);
  const paths = ranked.scored.filter((item) => item.score.state !== 'UNAVAILABLE').slice(0, Math.max(1, maxPaths));
  return { ...ranked, paths, pooledRaw: false as const };
}

export function failoverRoute(
  roots: InformationRoot[],
  query: SemanticQuery,
  failedRootId: string,
  now = Date.now(),
) {
  const ranked = rankRoutes(roots, query, now);
  const next = ranked.scored.find((item) => item.filter.root.id !== failedRootId && item.score.state !== 'UNAVAILABLE');
  if (!next) {
    const offline = ranked.scored.find((item) => item.filter.root.offlineAvailable);
    if (offline) return { selected: offline, state: 'PASS' as const, reason: 'Failed over to an offline-available root.' };
    return { selected: null, state: 'UNAVAILABLE' as const, reason: 'No remaining configured and authorized route.' };
  }
  return { selected: next, state: next.score.state, reason: 'Failed over to the next scored eligible root. Popularity was not used.' };
}

export function routeOfflineFirst(roots: InformationRoot[], query: SemanticQuery, now = Date.now()) {
  const ranked = rankRoutes(roots, query, now);
  const offline = ranked.scored.filter((item) => item.filter.root.offlineAvailable);
  if (offline.length === 0) {
    return {
      selected: [] as typeof ranked.scored,
      state: 'UNAVAILABLE' as const,
      reason: 'No offline-available root. Cloud-only work stays UNAVAILABLE while unconfigured.',
    };
  }
  return { selected: offline, state: 'PASS' as const, reason: 'Offline-first routing selected local/offline roots only.' };
}

export function detectRouteLoop(path: string[]): LoopDetection {
  const seen = new Set<string>();
  for (const node of path) {
    if (seen.has(node)) {
      return {
        loop: true,
        repeatedNode: node,
        path,
        state: 'FAIL',
        reason: `Route loop detected at ${node}; the semantic router refuses cyclic retrieval.`,
      };
    }
    seen.add(node);
  }
  return { loop: false, path, state: 'PASS', reason: 'No route loop in the hop path.' };
}

export function admitWithBackpressure(rootId: string, cap = 2): CongestionDecision {
  const inflight = inflightByRoot.get(rootId) ?? 0;
  if (inflight >= cap) {
    return {
      admitted: false,
      inflight,
      cap,
      reason: 'BACKPRESSURE: inflight queries at cap; query stays local and is not dumped into a raw pool.',
      state: 'WAITING_DATA',
    };
  }
  inflightByRoot.set(rootId, inflight + 1);
  return { admitted: true, inflight: inflight + 1, cap, reason: 'Admitted under congestion cap.', state: 'LOCAL_EXECUTABLE' };
}

export function releaseCongestion(rootId: string) {
  const inflight = inflightByRoot.get(rootId) ?? 0;
  inflightByRoot.set(rootId, Math.max(0, inflight - 1));
}

export function translateFederatedQuery(root: InformationRoot, query: SemanticQuery): TranslatedQuery {
  if (root.kind === 'knowledge_lake' || root.kind === 'local_graph') {
    return {
      dialect: 'knowledge_lake',
      pushdown: {
        tenantScoped: true,
        universeScoped: true,
        industry: query.industry,
        partition: query.partition,
        predicate: query.predicate,
        aggregation: query.aggregation === 'none' ? 'hash' : query.aggregation,
      },
      returnsRawRows: false,
      minimizeMovement: true,
      state: 'PASS',
      reason: 'Query is pushed to the Knowledge Lake/local graph; aggregates or hashes return, not raw enterprise dumps.',
    };
  }
  if (root.kind === 'learning_ledger') {
    return {
      dialect: 'learning_ledger',
      pushdown: { query: query.need, tenantScoped: true },
      returnsRawRows: false,
      minimizeMovement: true,
      state: 'PASS',
      reason: 'Learning Ledger search is local and query-to-data.',
    };
  }
  if (root.kind === 'evidence_ledger') {
    return {
      dialect: 'evidence_ledger',
      pushdown: { kind: 'evidence', tenantScoped: true },
      returnsRawRows: false,
      minimizeMovement: true,
      state: 'PASS',
      reason: 'Evidence ledger query stays tenant/Universe scoped.',
    };
  }
  if (root.kind === 'neural_fabric') {
    return {
      dialect: 'knowledge_graph',
      pushdown: { query: query.need, tenantScoped: true },
      returnsRawRows: false,
      minimizeMovement: true,
      state: 'PASS',
      reason: 'Neural fabric is a logical pathway index, not a raw data pool.',
    };
  }
  return {
    dialect: 'unavailable',
    pushdown: {},
    returnsRawRows: false,
    minimizeMovement: true,
    state: 'UNAVAILABLE',
    reason: 'No federated dialect for this unconfigured or predecessor-missing root.',
  };
}

export function analyzeVendorLockIn(root: InformationRoot): VendorLockInReport {
  const vendorId = root.vendorId ?? (root.kind === 'provider' ? 'unconfigured-provider' : 'local');
  const compatibility = clamp01(root.metrics.compatibility) ?? (root.kind === 'provider' ? 0.2 : 0.8);
  const singleVendor = root.kind === 'provider' && compatibility < 0.5;
  return {
    rootId: root.id,
    vendorId,
    singleVendor,
    portability: compatibility,
    popularityUsed: false,
    recommendation: !root.configured
      ? 'unavailable'
      : singleVendor
        ? 'prefer_portable_or_local'
        : 'acceptable',
    reason: singleVendor
      ? 'High vendor concentration with low compatibility. Prefer local/portable roots over a popular vendor lock-in.'
      : 'Vendor lock-in analysis does not treat popularity as a reason to bind XIV to a provider.',
  };
}
