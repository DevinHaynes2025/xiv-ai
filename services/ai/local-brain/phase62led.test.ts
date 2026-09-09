import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  accessHistoricalIndustryMemory,
  labelProvenanceHighway,
  navigateMicrodatabase,
  probeScaleTargetClaim,
} from './data-galaxy-industry-memory-os';
import {
  bootstrapDataGalaxyIndustryMemoryOs,
  dataGalaxyIndustryMemoryOsSystemHonesty,
} from './data-galaxy-industry-memory-os-system';
import {
  AUTONOMY_FREIGHT_PO_SPEND_DENIED,
  CONNECTOR_REGISTERED,
  CROSS_CONTEXT_SEALED_DENY,
  DATA_GALAXY_INDUSTRY_MEMORY_OS_CYCLE,
  ED_LOCKS,
  EDGE_CLOUD_ROUTED,
  GENOME_ORIGINAL_XIV_ONLY,
  HISTORICAL_MEMORY_ACL_DENIED,
  HISTORICAL_RESEARCH_AUTHORIZED,
  HONESTY_BANNER,
  KAIZEN_NEQ_PROD_CHANGE,
  KNOWLEDGE_TOWER_ACL_DENIED,
  LEAN_ADVISORY_ONLY,
  LEARNING_LOOP_RULES,
  MICRODB_NAV_OK,
  MILLION_SYNTHETIC_NEQ_CUSTOMER,
  NEURAL_NODES_EVIDENCE_GATED,
  NEXT_PHASE_TITLE,
  OFFLINE_WAITING_OR_STOPPED,
  ORACLE_COMPATIBLE_CONTRACT_ONLY,
  PRODUCT_PHILOSOPHY,
  PROPRIETARY_DB_COPY_DENIED,
  PROVENANCE_HIGHWAY_LABELED,
  RUNTIME_EVIDENCE_REQUIRED,
  SCALE_TARGET_NEQ_OWNED_CORPUS,
  SELF_PROMOTION_DENIED,
  SIM_NEQ_FACT,
  SIM_UNIVERSE_ISOLATED,
  STEALTH_INSTALL_DENIED,
  SYNTHETIC_TASK_LABELED,
  TRILLIONS_SCALE_TARGET_ONLY,
  TWIN_NEQ_FOUNDER,
  TWIN_NEQ_PHYSICAL_CONTROL,
  UNCONFIGURED_CONNECTOR_UNAVAILABLE,
  predecessorMap,
  type EdActor,
} from './data-galaxy-industry-memory-os-types';
import {
  buildDataGalaxyIndustryMemoryOsHealthReport,
  runDataGalaxyIndustryMemoryOsCycle,
} from './data-galaxy-industry-memory-os-runtime';
import {
  attemptSelfPromotionEd,
  denyStealthInstallEd,
  probeAutonomyBoundaryEd,
  probeDigitalTwinAuthorityEd,
  probeNeuralNodeEd,
} from './data-galaxy-softwire-gates';
import {
  probeOfflineAgentRuntime,
  probeOfflineStopped,
  probeRuntimeEvidence,
  routeEdgeCloudWorkload,
} from './edge-cloud-ai-runtime-ed';
import {
  probeEnterpriseConnector,
  registerEnterpriseConnector,
} from './enterprise-connector-federation';
import {
  denyProprietaryDbCopy,
  registerGenomeSchema,
  registerOracleCompatibleContract,
} from './federated-database-genome';
import {
  generateSyntheticSupplyChainTasks,
  runLeanAdvisoryExperiment,
} from './lean-supply-chain-intelligence-factory';
import {
  accessKnowledgeControlTower,
  probePersonalBusinessFirewall,
} from './personal-business-knowledge-control-tower';
import {
  ingestHistoricalMarketResearch,
  openSimulationUniverse,
  probeIndustryTwin,
} from './simulation-universes-ed';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62led-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: EdActor = {
  kind: 'data_galaxy_curator',
  id: 'test-curator',
  orgId: 'org-ed',
  tenantId: 'tenant-ed',
  universeId: 'universe-ed',
};
const twinActor: EdActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      ED_LOCKS.L4_AUTONOMY_ENABLED === false &&
      ED_LOCKS.TIP_LAND === false &&
      ED_LOCKS.TRILLIONS_EQ_CURRENT_OWNED_CORPUS === false &&
      ED_LOCKS.SCALE_TARGET_EQ_OWNED_VERIFIED_CORPUS === false &&
      ED_LOCKS.PROPRIETARY_DB_COPY_ALLOWED === false &&
      ED_LOCKS.ORACLE_REVERSE_COPY_ALLOWED === false &&
      ED_LOCKS.GENOME_EQ_COPIED_PROPRIETARY_SOURCE === false &&
      ED_LOCKS.SYNTHETIC_EQ_REAL_CUSTOMER_OWNERSHIP === false &&
      ED_LOCKS.SIM_EQ_VERIFIED_FACT === false &&
      ED_LOCKS.INDUSTRY_TWIN_EQ_PHYSICAL_CONTROL === false &&
      ED_LOCKS.UNCONFIGURED_CONNECTOR_EQ_AVAILABLE === false &&
      ED_LOCKS.STEALTH_INSTALL_ALLOWED === false &&
      ED_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
      ED_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.scaleTargetNeqOwnedCorpus === true &&
      PRODUCT_PHILOSOPHY.genomeOriginalXivSchemasAndLawfulPatternsOnly === true &&
      LEARNING_LOOP_RULES.noSelfPromotionToProduction === true &&
      DATA_GALAXY_INDUSTRY_MEMORY_OS_CYCLE.includes(
        'scale_target_neq_owned_corpus',
      ) &&
      NEXT_PHASE_TITLE.includes('62L-EE'),
    'locks + philosophy + cycle + next EE present',
  );

  const os = await bootstrapDataGalaxyIndustryMemoryOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_data_galaxy_industry_memory_os',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      (os.predecessorLayer === 'EC' ||
        os.predecessorLayer === 'EB' ||
        os.predecessorLayer === 'EA') &&
      (os.softWiredPredecessors.includes('EB') ||
        os.softWiredPredecessors.includes('EA') ||
        os.softWiredPredecessors.includes('EC')),
    `os=${os.id}; predecessor=${os.predecessorLayer}; soft=${os.softWiredPredecessors.join(',')}`,
  );

  // A — Data Galaxy
  const nav = await navigateMicrodatabase({
    dbId: 'mdb-1',
    location: 'local',
    root,
    actor,
  });
  check(
    'microdatabase_visual_navigation',
    nav.status === 'ok' && nav.reason === MICRODB_NAV_OK,
    nav.reason,
  );
  const prov = await labelProvenanceHighway({
    recordId: 'rec-1',
    lineageLabeled: true,
    root,
    actor,
  });
  check(
    'provenance_highway_labeled',
    prov.status === 'ok' && prov.reason === PROVENANCE_HIGHWAY_LABELED,
    prov.reason,
  );
  const scaleOwned = await probeScaleTargetClaim({
    claimKind: 'trillions',
    claimedOwnedVolume: true,
    root,
    actor,
  });
  check(
    'scale_target_neq_owned_corpus',
    scaleOwned.status === 'denied' &&
      scaleOwned.scaleTargetOnly === true &&
      scaleOwned.reason === SCALE_TARGET_NEQ_OWNED_CORPUS,
    scaleOwned.reason,
  );
  const trillions = await probeScaleTargetClaim({
    claimKind: 'trillions',
    claimedOwnedVolume: false,
    root,
    actor,
  });
  check(
    'trillions_scale_target_only',
    trillions.status === 'ok' &&
      trillions.state === 'SCALE_TARGET_ONLY' &&
      trillions.reason === TRILLIONS_SCALE_TARGET_ONLY,
    trillions.reason,
  );
  const mem = await accessHistoricalIndustryMemory({
    memoryId: 'mem-1',
    aclGranted: false,
    labelPresent: true,
    root,
    actor,
  });
  check(
    'historical_industry_memory_acl',
    mem.status === 'denied' && mem.reason === HISTORICAL_MEMORY_ACL_DENIED,
    mem.reason,
  );

  // B — Genome
  const genomeOk = await registerGenomeSchema({
    schemaId: 'xiv-core',
    source: 'original_xiv',
    root,
    actor,
  });
  check(
    'genome_original_xiv_schemas_only',
    genomeOk.status === 'ok' &&
      genomeOk.state === 'ORIGINAL_XIV_SCHEMA' &&
      genomeOk.reason === GENOME_ORIGINAL_XIV_ONLY,
    genomeOk.reason,
  );
  const genomeCopy = await registerGenomeSchema({
    schemaId: 'oracle-copy',
    source: 'oracle_source',
    root,
    actor,
  });
  check(
    'genome_proprietary_source_denied',
    genomeCopy.status === 'denied' &&
      genomeCopy.reason === PROPRIETARY_DB_COPY_DENIED,
    genomeCopy.reason,
  );
  const copy = await denyProprietaryDbCopy({
    attemptKind: 'proprietary_db_copy',
    root,
    actor,
  });
  check(
    'proprietary_db_copy_denied',
    copy.status === 'denied' && copy.reason === PROPRIETARY_DB_COPY_DENIED,
    copy.reason,
  );
  const oracleCopy = await registerOracleCompatibleContract({
    connectorId: 'ora-bad',
    authorizedAdapterContract: true,
    proprietaryCopyAttempted: true,
    root,
    actor,
  });
  check(
    'oracle_compatible_neq_proprietary_copy',
    oracleCopy.status === 'denied' &&
      oracleCopy.reason === PROPRIETARY_DB_COPY_DENIED,
    oracleCopy.reason,
  );
  const oracleOk = await registerOracleCompatibleContract({
    connectorId: 'ora-ok',
    authorizedAdapterContract: true,
    proprietaryCopyAttempted: false,
    root,
    actor,
  });
  check(
    'oracle_compatible_contract_only',
    oracleOk.status === 'ok' &&
      oracleOk.state === 'ORACLE_COMPATIBLE_CONTRACT' &&
      oracleOk.reason === ORACLE_COMPATIBLE_CONTRACT_ONLY,
    oracleOk.reason,
  );

  // C — Lean factory
  const lean = await runLeanAdvisoryExperiment({
    experimentId: 'lean-1',
    method: 'six_sigma',
    root,
    actor,
  });
  check(
    'lean_six_sigma_advisory_only',
    lean.status === 'ok' &&
      lean.productionChanged === false &&
      lean.reason === LEAN_ADVISORY_ONLY,
    lean.reason,
  );
  const kaizen = await runLeanAdvisoryExperiment({
    experimentId: 'kaizen-1',
    method: 'kaizen',
    autoProdChangeRequested: true,
    root,
    actor,
  });
  check(
    'kaizen_experiment_neq_production_change',
    kaizen.status === 'denied' &&
      kaizen.productionChanged === false &&
      kaizen.reason === KAIZEN_NEQ_PROD_CHANGE,
    kaizen.reason,
  );
  const synth = await generateSyntheticSupplyChainTasks({
    batchId: 's1',
    scale: 5000,
    labeledSynthetic: true,
    root,
    actor,
  });
  check(
    'synthetic_task_generation_labeled',
    synth.status === 'ok' &&
      synth.state === 'LABELED_SYNTHETIC' &&
      synth.reason === SYNTHETIC_TASK_LABELED,
    synth.reason,
  );
  const million = await generateSyntheticSupplyChainTasks({
    batchId: 's-million',
    scale: 1_000_000,
    labeledSynthetic: true,
    claimedCustomerOwnership: true,
    root,
    actor,
  });
  check(
    'million_scale_synthetic_neq_customer_ownership',
    million.status === 'denied' &&
      million.reason === MILLION_SYNTHETIC_NEQ_CUSTOMER,
    million.reason,
  );
  const unlabeled = await generateSyntheticSupplyChainTasks({
    batchId: 's-bad',
    scale: 100,
    labeledSynthetic: false,
    root,
    actor,
  });
  check(
    'unlabeled_synthetic_denied',
    unlabeled.status === 'denied' &&
      unlabeled.reason === SYNTHETIC_TASK_LABELED,
    unlabeled.reason,
  );

  // D — Connectors
  const conn = await registerEnterpriseConnector({
    connectorId: 'sap-1',
    authorized: true,
    configured: true,
    root,
    actor,
  });
  check(
    'authorized_connector_registered',
    conn.status === 'ok' && conn.reason === CONNECTOR_REGISTERED,
    conn.reason,
  );
  const unavail = await probeEnterpriseConnector({
    connectorId: 'sap-unconfig',
    configured: false,
    root,
    actor,
  });
  check(
    'unconfigured_connector_unavailable',
    unavail.status === 'unavailable' &&
      unavail.state === 'UNAVAILABLE' &&
      unavail.reason === UNCONFIGURED_CONNECTOR_UNAVAILABLE,
    unavail.reason,
  );

  // E — Simulation Universes
  const sim = await openSimulationUniverse({
    universeId: 'sim-ag',
    isolatedWorkspace: true,
    root,
    actor,
  });
  check(
    'sim_universe_isolated_workspace',
    sim.status === 'ok' && sim.reason === SIM_UNIVERSE_ISOLATED,
    sim.reason,
  );
  const literal = await openSimulationUniverse({
    universeId: 'sim-literal',
    literalRealityClaimed: true,
    root,
    actor,
  });
  check(
    'sim_neq_literal_reality',
    literal.status === 'denied' && literal.reason === SIM_NEQ_FACT,
    literal.reason,
  );
  const fact = await probeIndustryTwin({
    twinKind: 'retail',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'sim_neq_verified_fact',
    fact.verifiedFact === false &&
      fact.status === 'denied' &&
      fact.reason === SIM_NEQ_FACT,
    fact.reason,
  );
  const phys = await probeIndustryTwin({
    twinKind: 'agriculture',
    physicalControlAttempted: true,
    root,
    actor,
  });
  check(
    'industry_twin_neq_physical_control',
    phys.status === 'denied' && phys.reason === TWIN_NEQ_PHYSICAL_CONTROL,
    phys.reason,
  );
  const hist = await ingestHistoricalMarketResearch({
    sourceAuthorized: true,
    sourcePublicOrLicensed: true,
    root,
    actor,
  });
  check(
    'historical_market_research_authorized_sources',
    hist.status === 'ok' && hist.reason === HISTORICAL_RESEARCH_AUTHORIZED,
    hist.reason,
  );
  const histBad = await ingestHistoricalMarketResearch({
    sourceAuthorized: false,
    sourcePublicOrLicensed: false,
    root,
    actor,
  });
  check(
    'unauthorized_historical_research_denied',
    histBad.status === 'denied',
    histBad.reason,
  );

  // F — Edge/Cloud runtime
  const route = await routeEdgeCloudWorkload({
    workloadId: 'wl-1',
    preferred: 'edge',
    edgeAvailable: true,
    cloudConfigured: false,
    root,
    actor,
  });
  check(
    'edge_cloud_workload_routing',
    route.selected === 'edge' && route.reason === EDGE_CLOUD_ROUTED,
    route.reason,
  );
  const offline = await probeOfflineAgentRuntime({
    agentId: 'off-1',
    poweredNodePresent: false,
    root,
    actor,
  });
  const stopped = await probeOfflineStopped({
    agentId: 'off-2',
    root,
    actor,
  });
  check(
    'offline_agent_waiting_or_stopped',
    offline.state === 'WAITING_NODE' &&
      stopped.state === 'OFFLINE_STOPPED' &&
      offline.reason === OFFLINE_WAITING_OR_STOPPED,
    `${offline.reason}; ${stopped.reason}`,
  );
  const evid = await probeRuntimeEvidence({
    runtimeId: 'rt-1',
    claimRunningVerified: true,
    evidencePresent: false,
    heartbeatPresent: false,
    root,
    actor,
  });
  check(
    'runtime_evidence_gate',
    evid.status === 'denied' && evid.reason === RUNTIME_EVIDENCE_REQUIRED,
    evid.reason,
  );

  // G — Knowledge Control Tower
  const tower = await accessKnowledgeControlTower({
    knowledgeId: 'k-1',
    context: 'business',
    aclGranted: false,
    labelPresent: true,
    root,
    actor,
  });
  check(
    'knowledge_tower_acl_deny',
    tower.status === 'denied' && tower.reason === KNOWLEDGE_TOWER_ACL_DENIED,
    tower.reason,
  );
  const fw = await probePersonalBusinessFirewall({
    sourceContext: 'personal',
    targetContext: 'business',
    crossContextAttempt: true,
    root,
    actor,
  });
  check(
    'personal_business_firewall_cross_context_sealed_deny',
    fw.status === 'denied' && fw.reason === CROSS_CONTEXT_SEALED_DENY,
    fw.reason,
  );

  // H — Soft-wire + gates
  const neural = await probeNeuralNodeEd({
    nodeId: 'nn-1',
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'neural_nodes_evidence_gated',
    neural.status === 'denied' && neural.reason === NEURAL_NODES_EVIDENCE_GATED,
    neural.reason,
  );
  const promo = await attemptSelfPromotionEd({
    subjectId: 'agent-1',
    root,
    actor,
  });
  check(
    'self_promotion_denied',
    promo.status === 'denied' && promo.reason === SELF_PROMOTION_DENIED,
    promo.reason,
  );
  const stealth = await denyStealthInstallEd({
    attemptKind: 'stealth_install',
    root,
    actor,
  });
  check(
    'stealth_install_denied',
    stealth.status === 'denied' && stealth.reason === STEALTH_INSTALL_DENIED,
    stealth.reason,
  );
  const twin = await probeDigitalTwinAuthorityEd({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twin.status === 'denied' && twin.reason === TWIN_NEQ_FOUNDER,
    twin.reason,
  );
  const freight = await probeAutonomyBoundaryEd({
    action: 'book_freight',
    root,
    actor,
  });
  const po = await probeAutonomyBoundaryEd({
    action: 'issue_purchase_order',
    root,
    actor,
  });
  const spend = await probeAutonomyBoundaryEd({
    action: 'spend_money',
    root,
    actor,
  });
  check(
    'autonomy_boundary_no_freight_po_spend',
    freight.status === 'denied' &&
      po.status === 'denied' &&
      spend.status === 'denied' &&
      freight.reason === AUTONOMY_FREIGHT_PO_SPEND_DENIED,
    freight.reason,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'ec_eb_ea_soft_wire_probe',
    preds.EC.tipProbe === 'PRESENT' ||
      preds.EB.tipProbe === 'PRESENT' ||
      preds.EA.tipProbe === 'PRESENT',
    `EC=${preds.EC.tipProbe}/${preds.EC.report}; EB=${preds.EB.tipProbe}/${preds.EB.report}; EA=${preds.EA.tipProbe}/${preds.EA.report}`,
  );

  const honesty = dataGalaxyIndustryMemoryOsSystemHonesty(repoRoot);
  check(
    'system_honesty_report',
    honesty.l4AutonomyEnabled === false &&
      honesty.dbCandidatesApplied === false &&
      honesty.tipLand === false &&
      honesty.trillionsEqCurrentOwnedCorpus === false &&
      honesty.proprietaryDbCopyAllowed === false &&
      honesty.nextPhaseTitle.includes('62L-EE'),
    `pred=${honesty.predecessorLayer}; soft=${honesty.softWiredPredecessors.join(',')}`,
  );

  const cycle = await runDataGalaxyIndustryMemoryOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_all_hops',
    failedHops.length === 0 &&
      cycle.productionAuthorized === false &&
      cycle.tipLand === false &&
      cycle.dbCandidatesApplied === false &&
      cycle.githubSotIssue === 148 &&
      cycle.gitlabCoordinationIssue === 81,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildDataGalaxyIndustryMemoryOsHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report',
    health.status === 'HEALTHY' &&
      health.productionAuthorized === false &&
      health.dbCandidatesApplied === false,
    `status=${health.status}; hops=${health.hopCount}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('PASS npm run test:62led — all denial/honesty stories');
