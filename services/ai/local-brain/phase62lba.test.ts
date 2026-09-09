import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  federationPermissionGate,
  listAdapterProbes,
  planQueryToData,
  planReplication,
  planTierOps,
  probeAdapter,
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
} from './neural-database-types';
import { runNeuralDatabaseCycle } from './neural-database-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lba-'));
const tenantId = '62lba-tenant';
const universeId = '62lba-universe';
const SECRET = 'SEALED_BA_TOKEN_DO_NOT_LEAK';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const human: BaActor = {
  kind: 'human_operator',
  id: 'ops-human',
  tenantId,
  universeId,
  role: 'db_operator',
};

const agent: BaActor = {
  kind: 'ordinary_agent',
  id: 'db-agent',
  tenantId,
  universeId,
  role: 'researcher',
};

const founder: BaActor = {
  kind: 'ceo_principal',
  id: 'founder',
  tenantId,
  universeId,
};

try {
  check(
    'US-BA1-cycle-shape',
    NEURAL_DATABASE_CYCLE.length === 30 &&
      NEURAL_DATABASE_CYCLE[0] === 'workload_classify' &&
      NEURAL_DATABASE_CYCLE[25] === 'deny_auto_prod_ddl' &&
      NEURAL_DATABASE_CYCLE[29] === 'sync_policy',
    `cycle hops=${NEURAL_DATABASE_CYCLE.length}`,
  );

  check(
    'US-BA-locks',
    BA_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BA_LOCKS.AUTO_PRODUCTION_DDL === false &&
      BA_LOCKS.AUTO_PRODUCTION_DML === false &&
      BA_LOCKS.AUTO_PRODUCTION_SCHEMA_CHANGE === false &&
      BA_LOCKS.RECOMMENDATION_IS_NOT_DEPLOY === true &&
      BA_LOCKS.LABEL_IS_NOT_ACCESS === true &&
      BA_LOCKS.SEALED_DATA_WEAKENING === false &&
      BA_LOCKS.TENANT_ISOLATION_WEAKENED === false &&
      BA_LOCKS.OFFENSIVE_LEAKAGE_TOOLS === false &&
      BA_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
      BA_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
      BA_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
      honestyLocksIntact(),
    'Honesty locks: L4=false; no auto prod DDL/DML; DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION_AUTHORIZED',
  );

  // 1 Workload classification
  const oltp = classifyWorkload({ statementsPerSecond: 200 });
  const olap = classifyWorkload({ analyticalShare: 0.8 });
  const vector = classifyWorkload({ vectorQueries: true });
  check(
    'US-BA1-workload',
    oltp.class === 'oltp' && olap.class === 'olap' && vector.class === 'vector_search',
    `classes=${oltp.class},${olap.class},${vector.class}`,
  );

  // 2 Schema candidate compiler
  const schema = compileSchemaCandidate({
    table: 'assets',
    columns: [
      { name: 'id', type: 'uuid' },
      { name: 'tenant_id', type: 'text' },
    ],
    primaryKey: ['id'],
  });
  check(
    'US-BA2-schema',
    schema.productionApplied === false && schema.automaticAlterAllowed === false && schema.evidence === 'RECOMMENDED',
    `schema=${schema.id} productionApplied=false`,
  );

  // 3 Index candidate compiler
  const index = compileIndexCandidate({ table: 'assets', columns: ['tenant_id'], workload: 'vector_search' });
  check(
    'US-BA3-index',
    index.kind === 'vector' && index.automaticAlterAllowed === false && index.productionApplied === false,
    `index kind=${index.kind}`,
  );

  // 4 Partitioning / sharding simulation
  const part = simulatePartitionSharding({ workload: 'olap', estimatedRows: 5_000_000 });
  check(
    'US-BA4-partition',
    part.simulated === true && part.productionApplied === false && part.strategy === 'range',
    `strategy=${part.strategy} shards=${part.shardCount}`,
  );

  // 5 Cache policy
  const cacheSealed = recommendCachePolicy({ workload: 'oltp', sealed: true });
  const cacheOpen = recommendCachePolicy({ workload: 'oltp', sealed: false });
  check(
    'US-BA5-cache',
    cacheSealed.policy === 'none' && cacheOpen.policy === 'lru' && cacheSealed.productionApplied === false,
    `sealed=${cacheSealed.policy} open=${cacheOpen.policy}`,
  );

  // 6 Compression policy
  const comp = recommendCompressionPolicy({ workload: 'olap', storageBound: true });
  check('US-BA6-compression', comp.codec === 'zstd' && comp.productionApplied === false, `codec=${comp.codec}`);

  // 7 Data-locality routing
  const locSealed = routeDataLocality({ sealed: true, workload: 'oltp' });
  check(
    'US-BA7-locality',
    locSealed.deniedTiers.includes('cloud_storage') && locSealed.sealedWeakened === false,
    `denied=${locSealed.deniedTiers.join(',')}`,
  );

  // 8 Query-to-data execution planning
  const qp = planQueryToData({
    query: 'SELECT count(*) FROM assets JOIN meta GROUP BY tenant_id',
    tables: ['assets', 'meta'],
    actor: human,
    locality: routeDataLocality({ sealed: false, workload: 'olap' }),
  });
  const qpDenied = planQueryToData({
    query: 'SELECT * FROM sealed_table',
    tables: ['sealed_table'],
    sealedTables: ['sealed_table'],
    actor: agent,
    locality: locSealed,
  });
  check(
    'US-BA8-query-plan',
    qp.productionExecuted === false &&
      qp.steps.some((s) => s.op === 'join') &&
      qpDenied.evidence === 'DENIED',
    `steps=${qp.steps.length} sealedDeny=${qpDenied.evidence}`,
  );

  // 9 Universal Data API
  const put = await universalDataApi({
    tenantId,
    universeId,
    table: 'assets',
    op: 'put',
    document: { name: 'alpha' },
    actor: human,
    adapter: 'sqlite',
  });
  const ddl = await universalDataApi({
    tenantId,
    universeId,
    table: 'assets',
    op: 'ddl',
    actor: human,
  });
  const prod = await universalDataApi({
    tenantId,
    universeId,
    table: 'assets',
    op: 'put',
    document: { name: 'prod' },
    actor: human,
    production: true,
  });
  check(
    'US-BA9-uda',
    put.ok && put.productionWrite === false && ddl.state === 'DENIED' && prod.state === 'DENIED',
    `put=${put.state} ddl=${ddl.state} prod=${prod.state}`,
  );

  // 10 Database adapter SDK
  const sdk = createAdapterSdk();
  const probes = listAdapterProbes();
  check(
    'US-BA10-adapters',
    sdk.list().length >= 10 &&
      probeAdapter('postgresql').state === 'UNAVAILABLE' &&
      probeAdapter('sqlite').state === 'AVAILABLE' &&
      probes.every((p) => p.productionWrite === false),
    `adapters=${sdk.list().length} pg=${probeAdapter('postgresql').state} sqlite=${probeAdapter('sqlite').state}`,
  );

  // 11 Schema evolution candidates
  const evo = compileSchemaEvolutionCandidate({
    table: 'assets',
    addColumns: [{ name: 'tag', type: 'text' }],
  });
  check('US-BA11-evolution', evo.automaticAlterAllowed === false, `evo=${evo.id}`);

  // 12 Migration dry-runs
  const mig = compileMigrationDryRun({
    fromVersion: '1',
    toVersion: '2',
    steps: ['ADD COLUMN tag text'],
  });
  check(
    'US-BA12-migration-dryrun',
    mig.dryRunOnly === true && mig.productionApplied === false && mig.evidence === 'DRY_RUN_TESTED',
    `mig=${mig.id}`,
  );

  // 13 Rollback candidates
  const rb = compileRollbackCandidate({ migrationId: mig.id, steps: ['DROP COLUMN tag'] });
  check('US-BA13-rollback', rb.productionApplied === false && rb.automaticAlterAllowed === false, `rb=${rb.id}`);

  // 14 RLS / ABAC policy mapping
  const rls = mapRlsAbacPolicy({ tenantId, universeId, table: 'assets', roles: ['reader'] });
  check(
    'US-BA14-rls-abac',
    rls.guardianWeakened === false && rls.productionApplied === false && rls.rlsPredicates.length >= 2,
    `predicates=${rls.rlsPredicates.length}`,
  );

  // 15 Sealed-data placement guards
  const sealedCloud = guardSealedDataPlacement({ sealed: true, tier: 'cloud_storage' });
  const sealedLocal = guardSealedDataPlacement({ sealed: true, tier: 'local_device' });
  check(
    'US-BA15-sealed-placement',
    sealedCloud.allowed === false && sealedLocal.allowed === true && sealedCloud.sealedWeakened === false,
    `cloud=${sealedCloud.allowed} local=${sealedLocal.allowed}`,
  );

  // 16 Defensive leakage detection
  await mkdir(join(root, '.xiv-local'), { recursive: true });
  await writeFile(join(root, '.xiv-local', 'ordinary-cache.json'), JSON.stringify({ ok: true }), 'utf8');
  const clean = await detectDefensiveLeakage({ root, token: SECRET });
  await writeFile(join(root, '.xiv-local', 'ordinary-cache.json'), JSON.stringify({ leak: SECRET }), 'utf8');
  const dirty = await detectDefensiveLeakage({ root, token: SECRET });
  await writeFile(join(root, '.xiv-local', 'ordinary-cache.json'), JSON.stringify({ ok: true }), 'utf8');
  check(
    'US-BA16-leakage',
    clean.leaked === false && dirty.leaked === true && clean.offensive === false && dirty.offensive === false,
    `clean=${clean.leaked} dirty=${dirty.leaked} offensive=false`,
  );

  // 17 Lineage
  const edge = recordLineage({ entity: 'assets', from: 'ingest', to: 'assets', transform: 'normalize' });
  const graph = buildLineageGraph({ entity: 'assets', edges: [edge] });
  check('US-BA17-lineage', graph.edges.length === 1 && edge.productionAuthorization === false, `edges=${graph.edges.length}`);

  // 18 Federated queries (permissioned)
  const fedDeny = federationPermissionGate({
    federated: false,
    authorizedUniverses: [universeId],
    requestedUniverses: [universeId],
  });
  const fedOk = await runPermissionedFederatedQuery({
    tenantId,
    authorizedUniverses: [universeId, 'u2'],
    requestedUniverses: [universeId],
    actor: human,
    federated: true,
    root,
  });
  const fedBad = await runPermissionedFederatedQuery({
    tenantId,
    authorizedUniverses: [universeId],
    requestedUniverses: ['other-universe'],
    actor: human,
    federated: true,
    root,
  });
  check(
    'US-BA18-federated',
    fedDeny.allowed === false && fedOk.state === 'AVAILABLE' && fedBad.state === 'DENIED',
    `deny=${fedDeny.state} ok=${fedOk.state} bad=${fedBad.state}`,
  );

  // 19 Offline reconciliation
  await enqueueOfflineItem({ tenantId, payload: { x: 1 }, root });
  await enqueueOfflineItem({ tenantId: 'other', payload: { x: 2 }, root });
  const off = await reconcileOffline({ tenantId, root });
  check(
    'US-BA19-offline',
    off.reconciled === 1 && off.productionMutated === false && off.sealedPreserved === true,
    `reconciled=${off.reconciled}`,
  );

  // 20 Replication planning
  const rep = planReplication({ sealed: true, targets: ['local_device', 'edge_node', 'cloud_storage'] });
  check(
    'US-BA20-replication',
    rep.sealedExcluded === true &&
      rep.productionApplied === false &&
      !rep.targets.includes('edge_node') &&
      !rep.targets.includes('cloud_storage'),
    `targets=${rep.targets.join(',')}`,
  );

  // 21 Database cost optimization recommendations
  const cost = recommendCostOptimization({ storageGb: 200, queryFanout: 8, idleReplicas: 2 });
  check(
    'US-BA21-cost',
    cost.productionApplied === false && cost.evidence === 'RECOMMENDED' && cost.actions.length >= 2,
    `actions=${cost.actions.length} savings=${cost.estimatedRelativeSavings}`,
  );

  // 22 Performance benchmarks (harness/contracts)
  const bench = buildPerfBenchmarkHarness({ suite: 'ba-unit' });
  check(
    'US-BA22-benchmarks',
    bench.executed === false && bench.evidence === 'IMPLEMENTED' && bench.metrics.length >= 3,
    `suite=${bench.suite} executed=false`,
  );

  // 23 Modeling how authorized info is represented
  const model = modelAuthorizedInformation({
    entity: 'assets',
    fields: [
      { name: 'id', sensitivity: 'public', licensed: true },
      { name: 'secret', sensitivity: 'sealed', licensed: true },
    ],
  });
  check(
    'US-BA23-info-model',
    model.unauthorizedSourcesDenied === true && model.sources.includes('customer_owned'),
    model.notes,
  );

  // 24 Index/cache/partition/compress/sync/query/route across tiers
  const tiers = planTierOps({ sealed: true });
  const blocked = tiers.ops.filter((o) => !o.allowed);
  check(
    'US-BA24-tier-ops',
    tiers.sealedWeakened === false && blocked.length > 0 && blocked.every((b) => b.tier === 'edge_node' || b.tier === 'cloud_storage'),
    `blocked=${blocked.length}`,
  );

  // 25 Distributed knowledge warehouse placement rules
  const wh = planDistributedKnowledgeWarehouse({
    datasets: [
      { name: 'sealed_kb', sealed: true, preferredTier: 'cloud_storage' },
      { name: 'public_kb', sealed: false, preferredTier: 'cloud_storage' },
    ],
  });
  check(
    'US-BA25-warehouse',
    wh.productionApplied === false &&
      wh.placements.find((p) => p.dataset === 'sealed_kb')?.allowed === false &&
      wh.placements.find((p) => p.dataset === 'public_kb')?.allowed === true,
    `placements=${wh.placements.map((p) => `${p.dataset}:${p.allowed}`).join(',')}`,
  );

  // 26 Deny automatic production schema changes
  const denyDdl = denyAutomaticProductionSchemaChange({ action: 'ALTER TABLE' });
  const denyDml = denyAutomaticProductionDml({ action: 'DELETE' });
  check(
    'US-BA26-deny-auto-prod',
    denyDdl.allowed === false &&
      denyDdl.executed === false &&
      denyDdl.ddlApplied === false &&
      denyDml.dmlApplied === false &&
      denyDdl.state === 'DENIED',
    denyDdl.reason,
  );

  // 27 Human decision gate before production-altering recommendation applies
  const agentGate = humanDecisionGateBeforeProductionAlter({
    recommendationKind: 'schema',
    actor: agent,
    humanApproved: false,
  });
  const humanGate = humanDecisionGateBeforeProductionAlter({
    recommendationKind: 'migration',
    actor: human,
    humanApproved: true,
  });
  check(
    'US-BA27-human-gate',
    agentGate.executableByAgent === false &&
      agentGate.productionAlterApplied === false &&
      humanGate.productionAlterApplied === false &&
      humanGate.humanApprovalRequired === true,
    'Even human approval does not auto-apply production DDL in this runtime',
  );

  // 28 Evidence states for recommendations vs verified vs authorized
  const ev = classifyRecommendationEvidence({
    kind: 'index',
    documented: true,
    implemented: true,
    verified: true,
    productionAuthorized: true,
  });
  check(
    'US-BA28-evidence',
    ev.equalityLocks.documentedEqImplemented === false &&
      ev.equalityLocks.implementedEqVerified === false &&
      ev.equalityLocks.verifiedEqProductionAuthorized === false &&
      ev.productionAuthorized === false &&
      ev.verified === false &&
      (ev.state === 'IMPLEMENTED' || ev.state === 'DOCUMENTED' || ev.state === 'DENIED'),
    `state=${ev.state} (DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION_AUTHORIZED)`,
  );

  // 29 Tenant isolation checks
  const okIso = checkTenantIsolation({ actor: human, resourceTenantId: tenantId, resourceUniverseId: universeId });
  const badIso = checkTenantIsolation({
    actor: { ...human, tenantId: 'other-tenant' },
    resourceTenantId: tenantId,
    resourceUniverseId: universeId,
  });
  const labelIso = checkTenantIsolation({
    actor: { kind: 'label_only_principal', id: 'label', tenantId, universeId, labelOnly: true },
    resourceTenantId: tenantId,
    resourceUniverseId: universeId,
  });
  check(
    'US-BA29-tenant',
    okIso.ok && !badIso.ok && !labelIso.ok && okIso.weakened === false,
    `ok=${okIso.ok} cross=${badIso.reason} label=${labelIso.reason}`,
  );

  // 30 Sync policy across tiers without sealed-data weakening
  const syncSealed = syncPolicyAcrossTiers({ includeSealed: true });
  const syncOpen = syncPolicyAcrossTiers({ includeSealed: false });
  check(
    'US-BA30-sync',
    syncSealed.sealedWeakened === false &&
      syncSealed.automaticProductionAlter === false &&
      !syncSealed.tiers.includes('edge_node') &&
      syncOpen.tiers.includes('cloud_storage'),
    syncSealed.notes,
  );

  // Full cycle
  const cycle = await runNeuralDatabaseCycle({
    tenantId,
    universeId,
    actor: founder,
    table: 'knowledge_assets',
    workloadHints: { statementsPerSecond: 80, analyticalShare: 0.3, sealed: true, estimatedRows: 2_000_000 },
    attemptProductionAlter: true,
    humanApprovedProductionAlter: true,
    federated: false,
    leakToken: SECRET,
    root,
  });
  const hopNames = cycle.hops.map((h) => h.hop);
  check(
    'US-BA-cycle-complete',
    hopNames.join(',') === NEURAL_DATABASE_CYCLE.join(',') &&
      cycle.hops.every((h) => h.state === 'PASS' || h.state === 'DENIED') &&
      cycle.productionAuthorization === false &&
      cycle.l4AutonomyEnabled === false &&
      cycle.denyDdl.ddlApplied === false &&
      cycle.humanGate.productionAlterApplied === false &&
      cycle.nextPhaseTitle === NEXT_PHASE_TITLE,
    `hops=${cycle.hops.length} next=${cycle.nextPhaseTitle}`,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BA-predecessor-ax',
    preds.AX.module === 'AVAILABLE' && (preds.AX.report === 'PASS' || preds.AX.report === 'WAITING_DATA'),
    `AX module=${preds.AX.module} report=${preds.AX.report}`,
  );
  check(
    'US-BA-waiting-az-ay',
    preds.AZ.module === 'WAITING_DATA' && preds.AY.module === 'WAITING_DATA',
    `AZ=${preds.AZ.module}/${preds.AZ.report} AY=${preds.AY.module}/${preds.AY.report}`,
  );

  check(
    'US-BA-next-phase-title',
    NEXT_PHASE_TITLE.startsWith('62L-BB — Adaptive Compute Fabric'),
    NEXT_PHASE_TITLE,
  );

  // Cross-tenant UDA denial
  const cross = await universalDataApi({
    tenantId,
    universeId,
    table: 'assets',
    op: 'query',
    actor: { ...human, tenantId: 'evil' },
  });
  check('US-BA-uda-tenant-deny', cross.state === 'DENIED', cross.reason);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nFAIL ${failures.length} check(s):`);
  for (const f of failures) console.error(` - ${f}`);
  process.exitCode = 1;
} else {
  console.log('\nAll 62L-BA neural database OS checks passed (unit). NOT production authorization.');
}
