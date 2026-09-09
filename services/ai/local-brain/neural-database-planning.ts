import { randomUUID } from 'node:crypto';

import {
  DATA_TIERS,
  FEDERATION_PERMISSION_REQUIRED,
  SEALED_PLACEMENT_DENIED,
  UNVERIFIED_ADAPTER_UNAVAILABLE,
  type AdapterKind,
  type BaActor,
  type DataTier,
  type WorkloadClass,
} from './neural-database-types';

export type LocalityRoute = {
  preferredTier: DataTier[];
  deniedTiers: DataTier[];
  reason: string;
  sealedWeakened: false;
};

export function routeDataLocality(input: {
  sealed: boolean;
  workload: WorkloadClass;
  preferEdge?: boolean;
}): LocalityRoute {
  if (input.sealed) {
    return {
      preferredTier: ['local_device', 'enterprise_system'],
      deniedTiers: ['edge_node', 'cloud_storage'],
      reason: SEALED_PLACEMENT_DENIED,
      sealedWeakened: false,
    };
  }
  if (input.preferEdge || input.workload === 'streaming') {
    return {
      preferredTier: ['edge_node', 'local_device', 'enterprise_system', 'cloud_storage'],
      deniedTiers: [],
      reason: 'Edge-preferring locality for streaming/low-latency non-sealed data.',
      sealedWeakened: false,
    };
  }
  if (input.workload === 'olap') {
    return {
      preferredTier: ['enterprise_system', 'cloud_storage', 'local_device', 'edge_node'],
      deniedTiers: [],
      reason: 'Analytical locality prefers enterprise/cloud capacity when authorized.',
      sealedWeakened: false,
    };
  }
  return {
    preferredTier: [...DATA_TIERS],
    deniedTiers: [],
    reason: 'Default multi-tier locality; sealed boundaries unchanged.',
    sealedWeakened: false,
  };
}

export type QueryPlanStep = {
  id: string;
  op: 'scan' | 'index_lookup' | 'filter' | 'join' | 'aggregate' | 'route' | 'deny';
  target?: string;
  tier?: DataTier;
  notes: string;
};

export type QueryExecutionPlan = {
  id: string;
  steps: QueryPlanStep[];
  productionExecuted: false;
  evidence: 'RECOMMENDED' | 'DENIED';
  reason: string;
};

export function planQueryToData(input: {
  query: string;
  tables: string[];
  sealedTables?: string[];
  actor: BaActor;
  locality: LocalityRoute;
}): QueryExecutionPlan {
  const sealedHit = (input.sealedTables ?? []).some((t) => input.tables.includes(t));
  if (sealedHit && input.actor.kind !== 'ceo_principal' && input.actor.kind !== 'human_operator') {
    return {
      id: `qp_${randomUUID()}`,
      steps: [{ id: `s_${randomUUID()}`, op: 'deny', notes: SEALED_PLACEMENT_DENIED }],
      productionExecuted: false,
      evidence: 'DENIED',
      reason: SEALED_PLACEMENT_DENIED,
    };
  }
  const steps: QueryPlanStep[] = [];
  for (const table of input.tables) {
    const tier = input.locality.preferredTier[0] ?? 'local_device';
    steps.push({
      id: `s_${randomUUID()}`,
      op: 'route',
      target: table,
      tier,
      notes: `Route ${table} to ${tier} (plan only; not production execution).`,
    });
    steps.push({
      id: `s_${randomUUID()}`,
      op: 'scan',
      target: table,
      tier,
      notes: `Logical scan of ${table}.`,
    });
  }
  if (/join/i.test(input.query) && input.tables.length > 1) {
    steps.push({
      id: `s_${randomUUID()}`,
      op: 'join',
      target: input.tables.join('+'),
      notes: 'Logical join candidate.',
    });
  }
  if (/count|sum|avg|group/i.test(input.query)) {
    steps.push({
      id: `s_${randomUUID()}`,
      op: 'aggregate',
      notes: 'Logical aggregate candidate.',
    });
  }
  return {
    id: `qp_${randomUUID()}`,
    steps,
    productionExecuted: false,
    evidence: 'RECOMMENDED',
    reason: 'Query-to-data plan is advisory; production execution requires human authorization.',
  };
}

export type ReplicationPlan = {
  id: string;
  sources: DataTier[];
  targets: DataTier[];
  sealedExcluded: true;
  productionApplied: false;
  notes: string;
};

export function planReplication(input: { sealed: boolean; targets: DataTier[] }): ReplicationPlan {
  const targets = input.sealed
    ? input.targets.filter((t) => t === 'local_device' || t === 'enterprise_system')
    : input.targets;
  return {
    id: `rep_${randomUUID()}`,
    sources: ['local_device'],
    targets,
    sealedExcluded: true,
    productionApplied: false,
    notes: input.sealed
      ? 'Sealed data excluded from edge/cloud replication targets.'
      : 'Replication plan is a recommendation only.',
  };
}

export type CostOptimizationRecommendation = {
  id: string;
  actions: string[];
  estimatedRelativeSavings: number;
  evidence: 'RECOMMENDED';
  productionApplied: false;
  notes: string;
};

export function recommendCostOptimization(input: {
  storageGb: number;
  queryFanout: number;
  idleReplicas: number;
}): CostOptimizationRecommendation {
  const actions: string[] = [];
  if (input.storageGb > 100) actions.push('Recommend colder tier for aged partitions (dry-run only).');
  if (input.queryFanout > 5) actions.push('Recommend index covering common filters (candidate only).');
  if (input.idleReplicas > 0) actions.push('Recommend retiring idle replicas after human review.');
  if (actions.length === 0) actions.push('No aggressive cost cuts recommended; wait for verified telemetry.');
  const savings = Math.min(0.4, (input.idleReplicas * 0.1 + (input.storageGb > 100 ? 0.15 : 0) + (input.queryFanout > 5 ? 0.1 : 0)));
  return {
    id: `cost_${randomUUID()}`,
    actions,
    estimatedRelativeSavings: savings,
    evidence: 'RECOMMENDED',
    productionApplied: false,
    notes: 'Cost figures are heuristic estimates, not verified billing impact. Recommendation ≠ deploy.',
  };
}

export type PerfBenchmarkContract = {
  id: string;
  suite: string;
  metrics: Array<{ name: string; unit: string; targetHint?: number }>;
  executed: false;
  evidence: 'DOCUMENTED' | 'IMPLEMENTED';
  notes: string;
};

export function buildPerfBenchmarkHarness(input: { suite?: string } = {}): PerfBenchmarkContract {
  return {
    id: `bench_${randomUUID()}`,
    suite: input.suite ?? 'neural-db-os-baseline',
    metrics: [
      { name: 'p50_query_ms', unit: 'ms', targetHint: 50 },
      { name: 'p99_query_ms', unit: 'ms', targetHint: 250 },
      { name: 'dry_run_migration_ms', unit: 'ms' },
      { name: 'adapter_probe_ms', unit: 'ms' },
    ],
    executed: false,
    evidence: 'IMPLEMENTED',
    notes: 'Harness/contracts only. No invented production benchmark PASS. NOT_TESTED against live DBs.',
  };
}

export type TierOpsPlan = {
  id: string;
  ops: Array<{
    op: 'index' | 'cache' | 'partition' | 'compress' | 'sync' | 'query' | 'route';
    tier: DataTier;
    allowed: boolean;
    reason: string;
  }>;
  sealedWeakened: false;
};

export function planTierOps(input: { sealed: boolean; tiers?: DataTier[] }): TierOpsPlan {
  const tiers = input.tiers ?? [...DATA_TIERS];
  const ops: TierOpsPlan['ops'] = [];
  for (const tier of tiers) {
    for (const op of ['index', 'cache', 'partition', 'compress', 'sync', 'query', 'route'] as const) {
      const sealedBlocked =
        input.sealed &&
        (tier === 'edge_node' || tier === 'cloud_storage') &&
        (op === 'sync' || op === 'cache' || op === 'route');
      ops.push({
        op,
        tier,
        allowed: !sealedBlocked,
        reason: sealedBlocked
          ? SEALED_PLACEMENT_DENIED
          : `Candidate ${op} on ${tier} (recommend/test only; not production alter).`,
      });
    }
  }
  return { id: `tier_${randomUUID()}`, ops, sealedWeakened: false };
}

export type AdapterProbe = {
  kind: AdapterKind;
  state: 'AVAILABLE' | 'UNAVAILABLE';
  configured: boolean;
  verified: boolean;
  reason: string;
  productionWrite: false;
};

const ADAPTER_ENV: Partial<Record<AdapterKind, string>> = {
  postgresql: 'XIV_PG_URL',
  sqlite: 'XIV_SQLITE_PATH',
  vector: 'XIV_VECTOR_URL',
  object_store: 'XIV_OBJECT_STORE_URL',
  document: 'XIV_DOCUMENT_URL',
  graph: 'XIV_GRAPH_URL',
  time_series: 'XIV_TS_URL',
  cache: 'XIV_CACHE_URL',
  search: 'XIV_SEARCH_URL',
};

export function probeAdapter(kind: AdapterKind, opts?: { forceVerified?: boolean }): AdapterProbe {
  if (kind === 'sqlite') {
    // In-process logical sqlite adapter may be marked AVAILABLE for local dry-runs only.
    return {
      kind,
      state: 'AVAILABLE',
      configured: true,
      verified: true,
      reason: 'Logical in-process SQLite adapter for dry-runs; productionAuthorization=false.',
      productionWrite: false,
    };
  }
  if (kind === 'custom' && opts?.forceVerified) {
    return {
      kind,
      state: 'AVAILABLE',
      configured: true,
      verified: true,
      reason: 'Test harness forced verification for custom adapter stub.',
      productionWrite: false,
    };
  }
  const envKey = ADAPTER_ENV[kind];
  const configured = Boolean(envKey && process.env[envKey]);
  if (!configured) {
    return {
      kind,
      state: 'UNAVAILABLE',
      configured: false,
      verified: false,
      reason: UNVERIFIED_ADAPTER_UNAVAILABLE,
      productionWrite: false,
    };
  }
  // Configured but not independently verified in this environment.
  return {
    kind,
    state: 'UNAVAILABLE',
    configured: true,
    verified: false,
    reason: 'Adapter env present but handshake not verified in this run.',
    productionWrite: false,
  };
}

export function listAdapterProbes(): AdapterProbe[] {
  const kinds: AdapterKind[] = [
    'postgresql',
    'sqlite',
    'vector',
    'object_store',
    'document',
    'graph',
    'time_series',
    'cache',
    'search',
    'custom',
  ];
  return kinds.map((kind) => probeAdapter(kind));
}

export function federationPermissionGate(input: {
  federated: boolean;
  authorizedUniverses: string[];
  requestedUniverses: string[];
}): { allowed: boolean; reason: string; state: 'AVAILABLE' | 'DENIED' } {
  if (!input.federated) {
    return { allowed: false, reason: FEDERATION_PERMISSION_REQUIRED, state: 'DENIED' };
  }
  const unauthorized = input.requestedUniverses.filter((u) => !input.authorizedUniverses.includes(u));
  if (unauthorized.length) {
    return {
      allowed: false,
      reason: `${FEDERATION_PERMISSION_REQUIRED}: unauthorized=${unauthorized.join(',')}`,
      state: 'DENIED',
    };
  }
  return {
    allowed: true,
    reason: 'Permissioned federation within authorized Universes only.',
    state: 'AVAILABLE',
  };
}
