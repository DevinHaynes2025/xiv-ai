import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  peerReviewKnowledge,
  produceKnowledgeCandidate,
} from './agent-knowledge-production-line';
import {
  adviseDataSlo,
  planOfflineCloudSync,
  recommendDbHealth,
} from './autonomous-database-operations-brain';
import {
  gateConsequentialPromotion,
  registerNervousPathway,
} from './data-nervous-system';
import {
  bootstrapDataNervousSystem,
  dataNervousSystemOsHonesty,
} from './data-nervous-system-os';
import {
  AUTONOMY_BOUNDARY_DENIED,
  BENCHMARK_NEQ_PROD,
  CLASSICAL_BASELINE_REQUIRED,
  CONSEQUENTIAL_PROMOTION_GATED,
  CONTINUITY_EVIDENCE_REQUIRED,
  DATA_NERVOUS_SYSTEM_CYCLE,
  DATA_SLO_NOT_APPLIED,
  DB_HEALTH_RECOMMEND_ONLY,
  EE_LOCKS,
  FAILURE_SIM_LABELED,
  HISTORICAL_LEARNING_LABELED,
  HONESTY_BANNER,
  KNOWLEDGE_NEQ_AUTO_PUBLISH,
  LAUNCH_RELIABILITY_EVIDENCE,
  LEAN_EXPERIMENT_ONLY,
  LEARNING_LOOP_RULES,
  MISSING_EVIDENCE_NOT_VERIFIED,
  NERVOUS_PATHWAY_STAGES,
  NEXT_PHASE_TITLE,
  OFFLINE_WAITING_OR_STOPPED,
  PATHWAY_OUTCOME_CORRELATION,
  PATHWAY_PROVENANCE_REQUIRED,
  PEER_REVIEW_NEQ_GRANT,
  PEER_REVIEW_REQUIRED,
  PRODUCT_PHILOSOPHY,
  SECURITY_DEFENSIVE_ONLY,
  SIM_NEQ_FACT,
  STEALTH_INSTALL_DENIED,
  SYNC_NEQ_AUTO_MIGRATE,
  TEMPORAL_CORRELATION_ONLY,
  TWIN_NEQ_FOUNDER,
  TWIN_NEQ_PHYSICAL,
  TWIN_SIM_ADVISORY,
  predecessorMap,
  type EeActor,
} from './data-nervous-system-types';
import {
  buildDataNervousSystemHealthReport,
  runDataNervousSystemCycle,
} from './data-nervous-system-runtime';
import {
  probeContinuity,
  probeOfflineContinuity,
  runFailureSimulation,
} from './edge-cloud-continuity-grid';
import {
  addTemporalGraphEdge,
  linkPathwayOutcome,
  recordHistoricalLearning,
} from './historical-supply-chain-learning-cortex';
import {
  denyAutonomousAction,
  denyStealthInstall,
  probeDigitalTwinAuthority,
  probeLaunchDataReliability,
  runSecurityBoundaryTest,
} from './launch-data-reliability-command-center';
import {
  runAlgorithmBenchmark,
  runLeanExperiment,
} from './lean-enterprise-optimization-engine';
import {
  registerIndustryTwinTemplate,
  runTwinSimulation,
} from './universal-industry-digital-twin-factory';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lee-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: EeActor = {
  kind: 'data_nervous_system_curator',
  id: 'test-curator',
  orgId: 'org-ee',
  tenantId: 'tenant-ee',
  universeId: 'universe-ee',
};
const twinActor: EeActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      EE_LOCKS.L4_AUTONOMY_ENABLED === false &&
      EE_LOCKS.TIP_LAND === false &&
      EE_LOCKS.MISSING_EVIDENCE_EQ_VERIFIED === false &&
      EE_LOCKS.SYNC_EQ_AUTO_MIGRATE === false &&
      EE_LOCKS.CORRELATION_EQ_CAUSATION === false &&
      EE_LOCKS.SIM_EQ_VERIFIED_FACT === false &&
      EE_LOCKS.PEER_REVIEW_EQ_AUTO_PERMISSION_GRANT === false &&
      EE_LOCKS.KNOWLEDGE_EQ_AUTO_PROD_PUBLISH === false &&
      EE_LOCKS.OFFENSIVE_EXPLOIT_TOOLING_ALLOWED === false &&
      EE_LOCKS.STEALTH_INSTALL_ALLOWED === false &&
      EE_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
      EE_LOCKS.TRILLIONS_EQ_CURRENT_OWNERSHIP === false &&
      EE_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.nervousPathwayProvenanceRequired === true &&
      LEARNING_LOOP_RULES.correlationNeqCausation === true &&
      DATA_NERVOUS_SYSTEM_CYCLE.includes('missing_evidence_not_verified') &&
      NEXT_PHASE_TITLE.includes('62L-EF'),
    'locks + philosophy + cycle + next EF present',
  );

  const os = await bootstrapDataNervousSystem({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_data_nervous_system',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      (os.predecessorLayer === 'ED' || os.predecessorLayer === 'EB') &&
      (os.softWiredPredecessors.includes('ED') ||
        os.softWiredPredecessors.includes('EB')),
    `os=${os.id}; predecessor=${os.predecessorLayer}; soft=${os.softWiredPredecessors.join(',')}`,
  );

  // A — provenance pathway
  const complete = await registerNervousPathway({
    pathwayId: 'path-ok',
    stages: NERVOUS_PATHWAY_STAGES.map((stage) => ({
      stage,
      provenancePresent: true,
      reliabilityEvidencePresent: true,
    })),
    root,
    actor,
  });
  check(
    'nervous_pathway_provenance_end_to_end',
    complete.complete &&
      complete.status === 'ok' &&
      complete.reason === PATHWAY_PROVENANCE_REQUIRED,
    complete.reason,
  );
  const missing = await registerNervousPathway({
    pathwayId: 'path-bad',
    stages: [
      {
        stage: 'source',
        provenancePresent: true,
        reliabilityEvidencePresent: false,
      },
    ],
    root,
    actor,
  });
  check(
    'missing_evidence_not_verified',
    missing.state === 'NOT_VERIFIED' &&
      missing.reason === MISSING_EVIDENCE_NOT_VERIFIED,
    missing.reason,
  );
  const promo = await gateConsequentialPromotion({
    pathwayId: 'path-bad',
    evidenceComplete: false,
    root,
    actor,
  });
  check(
    'consequential_promotion_gated',
    promo.promoted === false &&
      promo.status === 'denied' &&
      promo.reason === CONSEQUENTIAL_PROMOTION_GATED,
    promo.reason,
  );

  // B — DB ops
  const db = await recommendDbHealth({
    agentId: 'a1',
    finding: 'vacuum_needed',
    autoMigrateRequested: true,
    root,
    actor,
  });
  check(
    'db_health_agent_recommend_only',
    db.migrationApplied === false &&
      db.status === 'denied' &&
      db.reason === DB_HEALTH_RECOMMEND_ONLY,
    db.reason,
  );
  const sync = await planOfflineCloudSync({
    syncId: 's1',
    direction: 'cloud_to_offline',
    autoMigrateRequested: true,
    root,
    actor,
  });
  check(
    'offline_cloud_sync_neq_auto_migrate',
    sync.migrationApplied === false &&
      sync.status === 'denied' &&
      sync.reason === SYNC_NEQ_AUTO_MIGRATE,
    sync.reason,
  );
  const slo = await adviseDataSlo({
    sloId: 'slo1',
    target: 'availability>=99.9',
    root,
    actor,
  });
  check(
    'data_slo_advisory_not_applied',
    slo.applied === false && slo.reason === DATA_SLO_NOT_APPLIED,
    slo.reason,
  );

  // C — learning cortex
  const hist = await recordHistoricalLearning({
    subject: 'port_congestion',
    sourceAuthorized: true,
    causationClaimed: false,
    root,
    actor,
  });
  check(
    'historical_learning_evidence_labeled',
    hist.state === 'CORRELATION_ONLY' &&
      hist.reason === HISTORICAL_LEARNING_LABELED,
    hist.reason,
  );
  const edge = await addTemporalGraphEdge({
    fromNode: 'weather',
    toNode: 'delay',
    claimCausation: true,
    root,
    actor,
  });
  check(
    'temporal_graph_correlation_neq_causation',
    edge.status === 'denied' &&
      edge.reason === TEMPORAL_CORRELATION_ONLY,
    edge.reason,
  );
  const outcome = await linkPathwayOutcome({
    pathwayId: 'path-ok',
    outcomeId: 'o1',
    claimCausation: false,
    root,
    actor,
  });
  check(
    'pathway_outcome_correlation_only',
    outcome.state === 'CORRELATION_ONLY' &&
      outcome.reason === PATHWAY_OUTCOME_CORRELATION,
    outcome.reason,
  );

  // D — lean
  const lean = await runLeanExperiment({
    method: 'six_sigma',
    applyToProductionRequested: true,
    root,
    actor,
  });
  check(
    'lean_six_sigma_kaizen_experiment_only',
    lean.productionChanged === false &&
      lean.status === 'denied' &&
      lean.reason === LEAN_EXPERIMENT_ONLY,
    lean.reason,
  );
  const bench = await runAlgorithmBenchmark({
    name: 'bench1',
    promoteToProdRequested: true,
    root,
    actor,
  });
  check(
    'algorithm_benchmark_neq_prod_change',
    bench.productionChanged === false &&
      bench.status === 'denied' &&
      bench.reason === BENCHMARK_NEQ_PROD,
    bench.reason,
  );
  const qi = await runAlgorithmBenchmark({
    name: 'qi1',
    quantumInspired: true,
    classicalBaselinePresent: false,
    root,
    actor,
  });
  check(
    'classical_baseline_when_quantum_inspired',
    qi.state === 'CLASSICAL_BASELINE_REQUIRED' &&
      qi.reason === CLASSICAL_BASELINE_REQUIRED,
    qi.reason,
  );

  // E — twin factory
  const twinPhys = await registerIndustryTwinTemplate({
    industry: 'retail',
    claimPhysicalControl: true,
    root,
    actor,
  });
  check(
    'industry_twin_template_sim_advisory',
    twinPhys.physicalControlEnabled === false &&
      twinPhys.reason === TWIN_NEQ_PHYSICAL,
    twinPhys.reason,
  );
  const sim = await runTwinSimulation({
    templateId: 't1',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'sim_neq_verified_fact',
    sim.status === 'denied' && sim.reason === SIM_NEQ_FACT,
    sim.reason,
  );
  const twinOk = await registerIndustryTwinTemplate({
    industry: 'agriculture',
    root,
    actor,
  });
  check(
    'twin_neq_physical_control',
    twinOk.status === 'sim_advisory' &&
      twinOk.physicalControlEnabled === false &&
      twinOk.reason === TWIN_SIM_ADVISORY,
    twinOk.reason,
  );

  // F — knowledge line
  const know = await produceKnowledgeCandidate({
    title: 'playbook',
    peerReviewed: false,
    root,
    actor,
  });
  check(
    'knowledge_production_peer_review_required',
    know.status === 'denied' &&
      know.published === false &&
      know.reason === PEER_REVIEW_REQUIRED,
    know.reason,
  );
  const grant = await peerReviewKnowledge({
    knowledgeId: 'k1',
    autoGrantPermissionRequested: true,
    root,
    actor,
  });
  check(
    'peer_review_neq_auto_permission_grant',
    grant.permissionGranted === false &&
      grant.status === 'denied' &&
      grant.reason === PEER_REVIEW_NEQ_GRANT,
    grant.reason,
  );
  const pub = await peerReviewKnowledge({
    knowledgeId: 'k1',
    autoPublishRequested: true,
    root,
    actor,
  });
  check(
    'knowledge_neq_auto_prod_publish',
    pub.published === false &&
      pub.status === 'denied' &&
      pub.reason === KNOWLEDGE_NEQ_AUTO_PUBLISH,
    pub.reason,
  );

  // G — continuity
  const cont = await probeContinuity({
    nodeId: 'n1',
    accelerator: 'npu',
    claimRunningVerified: true,
    heartbeatPresent: false,
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'cpu_gpu_npu_continuity_evidence_gate',
    cont.status === 'denied' &&
      cont.state === 'NOT_VERIFIED' &&
      cont.reason === CONTINUITY_EVIDENCE_REQUIRED,
    cont.reason,
  );
  const fail = await runFailureSimulation({
    scenario: 'partition',
    claimRealIncident: true,
    root,
    actor,
  });
  check(
    'failure_simulation_labeled',
    fail.status === 'denied' && fail.reason === FAILURE_SIM_LABELED,
    fail.reason,
  );
  const offline = await probeOfflineContinuity({
    nodeId: 'n2',
    mode: 'stopped',
    root,
    actor,
  });
  check(
    'offline_waiting_or_stopped',
    offline.state === 'OFFLINE_STOPPED' &&
      offline.reason === OFFLINE_WAITING_OR_STOPPED,
    offline.reason,
  );

  // H — launch command
  const sec = await runSecurityBoundaryTest({
    mode: 'offensive',
    root,
    actor,
  });
  check(
    'security_boundary_defensive_only',
    sec.status === 'denied' && sec.reason === SECURITY_DEFENSIVE_ONLY,
    sec.reason,
  );
  const launch = await probeLaunchDataReliability({
    datasetId: 'd1',
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'launch_data_reliability_evidence',
    launch.state === 'NOT_VERIFIED' &&
      launch.reason === LAUNCH_RELIABILITY_EVIDENCE,
    launch.reason,
  );
  const preds = predecessorMap(repoRoot);
  check(
    'ed_eb_soft_wire_probe',
    preds.EB.tipProbe === 'PRESENT' || preds.ED.tipProbe === 'PRESENT',
    `ED=${preds.ED.tipProbe}/${preds.ED.report}; EB=${preds.EB.tipProbe}/${preds.EB.report}`,
  );
  const stealth = await denyStealthInstall({
    attemptKind: 'stealth_install',
    root,
    actor,
  });
  check(
    'stealth_install_denied',
    stealth.status === 'denied' && stealth.reason === STEALTH_INSTALL_DENIED,
    stealth.reason,
  );
  const twinAuth = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twinAuth.status === 'denied' && twinAuth.reason === TWIN_NEQ_FOUNDER,
    twinAuth.reason,
  );
  const auto = await denyAutonomousAction({
    action: 'spend_money',
    root,
    actor,
  });
  check(
    'autonomy_boundary_no_freight_po_spend',
    auto.status === 'denied' && auto.reason === AUTONOMY_BOUNDARY_DENIED,
    auto.reason,
  );

  const cycle = await runDataNervousSystemCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle',
    failedHops.length === 0 &&
      cycle.productionAuthorized === false &&
      cycle.tipLand === false &&
      cycle.dbCandidatesApplied === false &&
      cycle.githubSotIssue === 149 &&
      cycle.gitlabCoordinationIssue === 82,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildDataNervousSystemHealthReport({
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
      health.dbCandidatesApplied === false &&
      health.nextPhaseTitle.includes('62L-EF'),
    `status=${health.status}; hops=${health.hopCount}`,
  );

  const honesty = dataNervousSystemOsHonesty(repoRoot);
  check(
    'system_honesty',
    honesty.l4AutonomyEnabled === false &&
      honesty.dbCandidatesApplied === false &&
      honesty.offensiveExploitAllowed === false &&
      honesty.nextPhaseTitle.includes('62L-EF'),
    `predecessor=${honesty.predecessorLayer}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('ALL 62L-EE STORIES PASSED');
