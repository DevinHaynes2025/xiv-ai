import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { providerSlots } from './provider-fabric';
import { createAdapterSdk, modelAuthorizedInformation, universalDataApi } from './neural-database-api';
import {
  classifyWorkload,
  compileIndexCandidate,
  compileMigrationDryRun,
  compileRollbackCandidate,
  compileSchemaCandidate,
  compileSchemaEvolutionCandidate,
  honestyLocksIntact,
  recommendCachePolicy,
  recommendCompressionPolicy,
  simulatePartitionSharding,
} from './neural-database-compiler';
import {
  buildPerfBenchmarkHarness,
  planQueryToData,
  planReplication,
  planTierOps,
  recommendCostOptimization,
  routeDataLocality,
} from './neural-database-planning';
import {
  checkTenantIsolation,
  classifyRecommendationEvidence,
  denyAutomaticProductionDml,
  denyAutomaticProductionSchemaChange,
  detectDefensiveLeakage,
  guardSealedDataPlacement,
  humanDecisionGateBeforeProductionAlter,
  mapRlsAbacPolicy,
  syncPolicyAcrossTiers,
} from './neural-database-guards';
import {
  buildLineageGraph,
  enqueueOfflineItem,
  planDistributedKnowledgeWarehouse,
  reconcileOffline,
  recordLineage,
  runPermissionedFederatedQuery,
} from './neural-database-warehouse';
import {
  BA_LOCKS,
  NEURAL_DATABASE_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type BaActor,
  type BaEvidenceState,
  type BaHop,
  type BaHopRecord,
  type WorkloadClass,
} from './neural-database-types';

export { BA_LOCKS, NEURAL_DATABASE_CYCLE, NEXT_PHASE_TITLE };

function hop(name: BaHop, state: BaEvidenceState, summary: string): BaHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BaCycleInput = {
  tenantId: string;
  universeId: string;
  actor: BaActor;
  table?: string;
  workloadHints?: {
    statementsPerSecond?: number;
    analyticalShare?: number;
    vectorQueries?: boolean;
    timeSeries?: boolean;
    sealed?: boolean;
    estimatedRows?: number;
    storageBound?: boolean;
    preferEdge?: boolean;
  };
  attemptProductionAlter?: boolean;
  humanApprovedProductionAlter?: boolean;
  federated?: boolean;
  authorizedUniverses?: string[];
  requestedUniverses?: string[];
  leakToken?: string;
  root?: string;
};

export async function runNeuralDatabaseCycle(input: BaCycleInput) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BaHopRecord[] = [];
  const table = input.table ?? 'knowledge_assets';
  const sealed = input.workloadHints?.sealed === true;
  const actor: BaActor = {
    ...input.actor,
    tenantId: input.tenantId,
    universeId: input.universeId,
  };

  const workload = classifyWorkload(input.workloadHints ?? {});
  hops.push(hop('workload_classify', 'PASS', `class=${workload.class}; ${workload.notes}`));

  const schema = compileSchemaCandidate({
    table,
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'tenant_id', type: 'text', nullable: false },
      { name: 'payload', type: 'jsonb', nullable: true },
    ],
    primaryKey: ['id'],
  });
  hops.push(
    hop(
      'schema_compile',
      schema.productionApplied === false && schema.automaticAlterAllowed === false ? 'PASS' : 'FAIL',
      `schema candidate ${schema.id}; productionApplied=false`,
    ),
  );

  const index = compileIndexCandidate({
    table,
    columns: ['tenant_id', 'id'],
    workload: workload.class,
  });
  hops.push(hop('index_compile', 'PASS', `index candidate ${index.id} kind=${index.kind}`));

  const partition = simulatePartitionSharding({
    workload: workload.class,
    estimatedRows: input.workloadHints?.estimatedRows ?? 10_000,
  });
  hops.push(
    hop(
      'partition_shard_sim',
      partition.simulated && !partition.productionApplied ? 'PASS' : 'FAIL',
      `${partition.strategy} shards=${partition.shardCount}`,
    ),
  );

  const cache = recommendCachePolicy({ workload: workload.class, sealed });
  hops.push(hop('cache_policy', 'PASS', `cache=${cache.policy}`));

  const compression = recommendCompressionPolicy({
    workload: workload.class,
    storageBound: input.workloadHints?.storageBound === true,
  });
  hops.push(hop('compression_policy', 'PASS', `codec=${compression.codec}`));

  const locality = routeDataLocality({
    sealed,
    workload: workload.class,
    preferEdge: input.workloadHints?.preferEdge,
  });
  hops.push(
    hop(
      'locality_route',
      locality.sealedWeakened === false ? 'PASS' : 'FAIL',
      `preferred=${locality.preferredTier.join(',')}`,
    ),
  );

  const plan = planQueryToData({
    query: `SELECT count(*) FROM ${table} JOIN meta`,
    tables: [table, 'meta'],
    sealedTables: sealed ? [table] : [],
    actor,
    locality,
  });
  hops.push(hop('query_plan', plan.evidence === 'DENIED' ? 'DENIED' : 'PASS', plan.reason));

  const uda = await universalDataApi({
    tenantId: input.tenantId,
    universeId: input.universeId,
    table,
    op: 'describe',
    actor,
    adapter: 'sqlite',
  });
  hops.push(hop('universal_data_api', uda.ok ? 'PASS' : uda.state, uda.reason));

  const sdk = createAdapterSdk();
  const probes = sdk.probeAll();
  const pg = probes.find((p) => p.kind === 'postgresql');
  hops.push(
    hop(
      'adapter_sdk',
      sdk.list().length >= 10 && pg?.state === 'UNAVAILABLE' ? 'PASS' : 'FAIL',
      `adapters=${sdk.list().length}; postgresql=${pg?.state ?? 'missing'}`,
    ),
  );

  const evolution = compileSchemaEvolutionCandidate({
    table,
    addColumns: [{ name: 'lineage_ref', type: 'text' }],
  });
  hops.push(hop('schema_evolution', 'PASS', `evolution candidate ${evolution.id}`));

  const migration = compileMigrationDryRun({
    fromVersion: '1',
    toVersion: '2',
    steps: ['ADD COLUMN lineage_ref text'],
  });
  hops.push(
    hop(
      'migration_dry_run',
      migration.dryRunOnly && !migration.productionApplied ? 'PASS' : 'FAIL',
      `migration ${migration.id} dryRunOnly`,
    ),
  );

  const rollback = compileRollbackCandidate({
    migrationId: migration.id,
    steps: ['DROP COLUMN lineage_ref'],
  });
  hops.push(hop('rollback_candidate', 'PASS', `rollback ${rollback.id}`));

  const rls = mapRlsAbacPolicy({
    tenantId: input.tenantId,
    universeId: input.universeId,
    table,
    roles: [actor.role ?? 'operator'],
  });
  hops.push(
    hop('rls_abac_map', rls.guardianWeakened === false ? 'PASS' : 'FAIL', `predicates=${rls.rlsPredicates.length}`),
  );

  const placement = guardSealedDataPlacement({
    sealed,
    tier: sealed ? 'cloud_storage' : 'cloud_storage',
  });
  hops.push(
    hop(
      'sealed_placement',
      sealed ? (placement.allowed ? 'FAIL' : 'PASS') : 'PASS',
      placement.reason,
    ),
  );

  const leak = await detectDefensiveLeakage({
    root,
    token: input.leakToken ?? 'NO_TOKEN',
    allowFiles: ['ceo-sealed-vault.json'],
  });
  hops.push(
    hop('leakage_detect', leak.offensive === false && leak.leaked === false ? 'PASS' : 'FAIL', leak.notes),
  );

  const edge = recordLineage({
    entity: table,
    from: 'ingest',
    to: table,
    transform: 'normalize',
  });
  const lineage = buildLineageGraph({ entity: table, edges: [edge] });
  hops.push(hop('lineage', 'PASS', `lineage edges=${lineage.edges.length}`));

  const fed = await runPermissionedFederatedQuery({
    tenantId: input.tenantId,
    authorizedUniverses: input.authorizedUniverses ?? [input.universeId],
    requestedUniverses: input.requestedUniverses ?? [input.universeId],
    table,
    actor,
    federated: input.federated === true,
    root,
  });
  hops.push(hop('federated_query', fed.state === 'DENIED' && input.federated !== true ? 'PASS' : fed.state === 'AVAILABLE' ? 'PASS' : 'DENIED', fed.reason));

  await enqueueOfflineItem({ tenantId: input.tenantId, payload: { table }, root });
  const offline = await reconcileOffline({ tenantId: input.tenantId, root });
  hops.push(
    hop(
      'offline_reconcile',
      offline.productionMutated === false && offline.sealedPreserved ? 'PASS' : 'FAIL',
      `reconciled=${offline.reconciled}`,
    ),
  );

  const replication = planReplication({
    sealed,
    targets: ['local_device', 'enterprise_system', 'edge_node', 'cloud_storage'],
  });
  hops.push(hop('replication_plan', 'PASS', `targets=${replication.targets.join(',')}`));

  const cost = recommendCostOptimization({ storageGb: 120, queryFanout: 6, idleReplicas: 1 });
  hops.push(hop('cost_optimize', 'PASS', `savings~${cost.estimatedRelativeSavings}`));

  const bench = buildPerfBenchmarkHarness();
  hops.push(
    hop('perf_benchmark', bench.executed === false ? 'PASS' : 'FAIL', `${bench.suite} harness only`),
  );

  const infoModel = modelAuthorizedInformation({
    entity: table,
    fields: [
      { name: 'id', sensitivity: 'internal', licensed: true },
      { name: 'payload', sensitivity: sealed ? 'sealed' : 'customer', licensed: true },
    ],
  });
  hops.push(hop('info_model', infoModel.unauthorizedSourcesDenied ? 'PASS' : 'FAIL', infoModel.notes));

  const tierOps = planTierOps({ sealed });
  hops.push(
    hop(
      'tier_ops',
      tierOps.sealedWeakened === false ? 'PASS' : 'FAIL',
      `ops=${tierOps.ops.length}`,
    ),
  );

  const warehouse = planDistributedKnowledgeWarehouse({
    datasets: [
      { name: table, sealed, preferredTier: sealed ? 'cloud_storage' : 'enterprise_system' },
      { name: 'public_catalog', sealed: false, preferredTier: 'cloud_storage' },
    ],
  });
  hops.push(
    hop(
      'warehouse_placement',
      warehouse.productionApplied === false && warehouse.placements.every((p) => p.sealedWeakened === false)
        ? 'PASS'
        : 'FAIL',
      `placements=${warehouse.placements.length}`,
    ),
  );

  const denyDdl = denyAutomaticProductionSchemaChange({
    action: input.attemptProductionAlter ? 'ALTER TABLE' : undefined,
  });
  const denyDml = denyAutomaticProductionDml({ action: 'UPDATE' });
  hops.push(
    hop(
      'deny_auto_prod_ddl',
      denyDdl.allowed === false && denyDdl.ddlApplied === false && denyDml.dmlApplied === false ? 'PASS' : 'FAIL',
      denyDdl.reason,
    ),
  );

  const humanGate = humanDecisionGateBeforeProductionAlter({
    recommendationKind: 'migration',
    actor,
    humanApproved: input.humanApprovedProductionAlter === true,
  });
  const gate = decisionGate({
    id: 'ba-prod-alter',
    action: 'production_schema_alter',
    consequence: 'CRITICAL',
    production: true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  hops.push(
    hop(
      'human_decision_gate',
      humanGate.productionAlterApplied === false && gate.executableByAgent === false ? 'PASS' : 'FAIL',
      humanGate.reason,
    ),
  );

  const evidence = classifyRecommendationEvidence({
    kind: 'schema',
    documented: true,
    implemented: true,
    verified: false,
    productionAuthorized: false,
  });
  hops.push(
    hop(
      'evidence_states',
      evidence.equalityLocks.documentedEqImplemented === false &&
        evidence.equalityLocks.implementedEqVerified === false &&
        evidence.equalityLocks.verifiedEqProductionAuthorized === false &&
        evidence.productionAuthorized === false
        ? 'PASS'
        : 'FAIL',
      `state=${evidence.state}`,
    ),
  );

  const isolation = checkTenantIsolation({
    actor,
    resourceTenantId: input.tenantId,
    resourceUniverseId: input.universeId,
  });
  hops.push(hop('tenant_isolation', isolation.ok && isolation.weakened === false ? 'PASS' : 'DENIED', isolation.reason));

  const sync = syncPolicyAcrossTiers({ includeSealed: sealed });
  hops.push(
    hop(
      'sync_policy',
      sync.sealedWeakened === false && sync.automaticProductionAlter === false ? 'PASS' : 'FAIL',
      sync.notes,
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-BA neural database OS cycle completed (recommend/test only).',
      payload: {
        hops: hops.length,
        productionAlterApplied: false,
        l4: BA_LOCKS.L4_AUTONOMY_ENABLED,
      },
    },
    root,
  );
  await appendLearning(
    {
      domain: '62l-ba',
      subject: 'neural-database-os',
      claimState: 'UNKNOWN',
      summary: 'Neural DB OS cycle — recommendation ≠ production alter; L4=false.',
      sourceRefs: hops.map((item) => item.hop),
      evidence: ['phase62lba'],
    },
    root,
  );

  return {
    hops,
    workload: workload.class as WorkloadClass,
    schema,
    index,
    migration,
    warehouse,
    denyDdl,
    humanGate,
    evidence,
    honestyLocksIntact: honestyLocksIntact(),
    providers: providerSlots().map((s) => ({ provider: s.provider, state: s.state })),
    predecessors: predecessorMap(root),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorization: false as const,
    l4AutonomyEnabled: BA_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function buildNeuralDatabaseHealthReport(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const actor: BaActor = {
    kind: 'human_operator',
    id: 'health-cli',
    tenantId: input.tenantId,
    universeId: input.universeId,
  };
  const cycle = await runNeuralDatabaseCycle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    actor,
    root: input.root,
    federated: false,
  });
  return {
    phase: '62L-BA',
    title: 'Neural Database OS + Autonomous Schema/Index Compiler + Distributed Knowledge Warehouse + Universal Data API',
    locks: BA_LOCKS,
    hopCount: cycle.hops.length,
    hopStates: Object.fromEntries(cycle.hops.map((h) => [h.hop, h.state])),
    honestyLocksIntact: cycle.honestyLocksIntact,
    productionAuthorization: false,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessors: cycle.predecessors,
    providersUnavailableUntilVerified: BA_LOCKS.PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED,
  };
}
