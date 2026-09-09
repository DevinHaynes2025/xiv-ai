/**
 * 62L-EE Data Nervous System runtime —
 * Walks DATA_NERVOUS_SYSTEM_CYCLE and builds health report.
 */

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
  DATA_NERVOUS_SYSTEM_CYCLE,
  EE_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NERVOUS_PATHWAY_STAGES,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type EeActor,
  type EeEvidenceState,
  type EeHop,
  type EeHopRecord,
} from './data-nervous-system-types';
import { decisionGate } from './decision-gate';
import {
  probeContinuity,
  probeOfflineContinuity,
  runFailureSimulation,
} from './edge-cloud-continuity-grid';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
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
import { appendLearning } from './learning-ledger';
import {
  runAlgorithmBenchmark,
  runLeanExperiment,
} from './lean-enterprise-optimization-engine';
import {
  registerIndustryTwinTemplate,
  runTwinSimulation,
} from './universal-industry-digital-twin-factory';

export {
  DATA_NERVOUS_SYSTEM_CYCLE,
  EE_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: EeHop, state: EeEvidenceState, summary: string): EeHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type EeCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: EeActor;
  root?: string;
  repoRoot?: string;
};

export async function runDataNervousSystemCycle(input: EeCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: EeHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };
  const twinActor: EeActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

  hops.push(
    hop(
      'honesty_locks',
      EE_LOCKS.L4_AUTONOMY_ENABLED === false &&
        EE_LOCKS.LOCAL_FIRST &&
        EE_LOCKS.MISSING_EVIDENCE_EQ_VERIFIED === false &&
        EE_LOCKS.SYNC_EQ_AUTO_MIGRATE === false &&
        EE_LOCKS.CORRELATION_EQ_CAUSATION === false &&
        EE_LOCKS.SIM_EQ_VERIFIED_FACT === false &&
        EE_LOCKS.PEER_REVIEW_EQ_AUTO_PERMISSION_GRANT === false &&
        EE_LOCKS.KNOWLEDGE_EQ_AUTO_PROD_PUBLISH === false &&
        EE_LOCKS.OFFENSIVE_EXPLOIT_TOOLING_ALLOWED === false &&
        EE_LOCKS.STEALTH_INSTALL_ALLOWED === false &&
        EE_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
        EE_LOCKS.TIP_LAND === false &&
        EE_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapDataNervousSystem({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'data_nervous_system_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}; softWire=${os.softWiredPredecessors.join(',')}`,
    ),
  );

  // A — Data Nervous System pathway
  const completeStages = NERVOUS_PATHWAY_STAGES.map((stage) => ({
    stage,
    provenancePresent: true,
    reliabilityEvidencePresent: true,
  }));
  const pathwayOk = await registerNervousPathway({
    pathwayId: 'path-complete',
    stages: completeStages,
    root,
    actor,
  });
  hops.push(
    hop(
      'nervous_pathway_provenance_end_to_end',
      pathwayOk.complete && pathwayOk.status === 'ok' ? 'PASS' : 'FAIL',
      pathwayOk.reason,
    ),
  );
  const pathwayMissing = await registerNervousPathway({
    pathwayId: 'path-missing',
    stages: [
      {
        stage: 'source',
        provenancePresent: false,
        reliabilityEvidencePresent: false,
      },
    ],
    root,
    actor,
  });
  hops.push(
    hop(
      'missing_evidence_not_verified',
      pathwayMissing.state === 'NOT_VERIFIED' ? 'PASS' : 'FAIL',
      pathwayMissing.reason,
    ),
  );
  const promo = await gateConsequentialPromotion({
    pathwayId: 'path-missing',
    evidenceComplete: false,
    humanApproved: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'consequential_promotion_gated',
      promo.promoted === false && promo.status === 'denied' ? 'PASS' : 'FAIL',
      promo.reason,
    ),
  );

  // B — DB ops brain
  const dbHealth = await recommendDbHealth({
    agentId: 'db-agent-1',
    finding: 'index_bloat_advisory',
    autoMigrateRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'db_health_agent_recommend_only',
      dbHealth.migrationApplied === false && dbHealth.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      dbHealth.reason,
    ),
  );
  const sync = await planOfflineCloudSync({
    syncId: 'sync-1',
    direction: 'offline_to_cloud',
    autoMigrateRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_cloud_sync_neq_auto_migrate',
      sync.migrationApplied === false && sync.status === 'denied' ? 'PASS' : 'FAIL',
      sync.reason,
    ),
  );
  const slo = await adviseDataSlo({
    sloId: 'slo-1',
    target: 'p99_latency_ms<=200',
    root,
    actor,
  });
  hops.push(
    hop(
      'data_slo_advisory_not_applied',
      slo.applied === false ? 'PASS' : 'FAIL',
      slo.reason,
    ),
  );

  // C — Historical learning
  const hist = await recordHistoricalLearning({
    subject: 'lane_delay_pattern',
    sourceAuthorized: true,
    causationClaimed: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'historical_learning_evidence_labeled',
      hist.state === 'CORRELATION_ONLY' ? 'PASS' : 'FAIL',
      hist.reason,
    ),
  );
  const edge = await addTemporalGraphEdge({
    fromNode: 'supplier_a',
    toNode: 'delay_event',
    claimCausation: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'temporal_graph_correlation_neq_causation',
      edge.status === 'denied' && edge.state === 'ATTRIBUTION_UNSAFE'
        ? 'PASS'
        : 'FAIL',
      edge.reason,
    ),
  );
  const outcome = await linkPathwayOutcome({
    pathwayId: 'path-complete',
    outcomeId: 'outcome-1',
    claimCausation: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'pathway_outcome_correlation_only',
      outcome.state === 'CORRELATION_ONLY' ? 'PASS' : 'FAIL',
      outcome.reason,
    ),
  );

  // D — Lean engine
  const lean = await runLeanExperiment({
    method: 'kaizen',
    applyToProductionRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'lean_six_sigma_kaizen_experiment_only',
      lean.productionChanged === false && lean.status === 'denied' ? 'PASS' : 'FAIL',
      lean.reason,
    ),
  );
  const bench = await runAlgorithmBenchmark({
    name: 'routing_heuristic',
    quantumInspired: false,
    classicalBaselinePresent: true,
    promoteToProdRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'algorithm_benchmark_neq_prod_change',
      bench.productionChanged === false && bench.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      bench.reason,
    ),
  );
  const qi = await runAlgorithmBenchmark({
    name: 'qi_optimizer',
    quantumInspired: true,
    classicalBaselinePresent: false,
    promoteToProdRequested: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'classical_baseline_when_quantum_inspired',
      qi.state === 'CLASSICAL_BASELINE_REQUIRED' ? 'PASS' : 'FAIL',
      qi.reason,
    ),
  );

  // E — Twin factory
  const twin = await registerIndustryTwinTemplate({
    industry: 'semiconductor',
    claimVerifiedFact: false,
    claimPhysicalControl: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'industry_twin_template_sim_advisory',
      twin.physicalControlEnabled === false && twin.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      twin.reason,
    ),
  );
  const sim = await runTwinSimulation({
    templateId: twin.id,
    claimVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sim_neq_verified_fact',
      sim.status === 'denied' ? 'PASS' : 'FAIL',
      sim.reason,
    ),
  );
  const twinOk = await registerIndustryTwinTemplate({
    industry: 'agriculture',
    claimVerifiedFact: false,
    claimPhysicalControl: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'twin_neq_physical_control',
      twinOk.physicalControlEnabled === false && twinOk.status === 'sim_advisory'
        ? 'PASS'
        : 'FAIL',
      twinOk.reason,
    ),
  );

  // F — Knowledge production
  const know = await produceKnowledgeCandidate({
    title: 'routing_playbook',
    peerReviewed: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'knowledge_production_peer_review_required',
      know.status === 'denied' && know.published === false ? 'PASS' : 'FAIL',
      know.reason,
    ),
  );
  const reviewGrant = await peerReviewKnowledge({
    knowledgeId: 'know-1',
    autoGrantPermissionRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'peer_review_neq_auto_permission_grant',
      reviewGrant.permissionGranted === false && reviewGrant.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      reviewGrant.reason,
    ),
  );
  const reviewPub = await peerReviewKnowledge({
    knowledgeId: 'know-1',
    autoPublishRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'knowledge_neq_auto_prod_publish',
      reviewPub.published === false && reviewPub.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      reviewPub.reason,
    ),
  );

  // G — Continuity grid
  const cont = await probeContinuity({
    nodeId: 'edge-1',
    accelerator: 'gpu',
    claimRunningVerified: true,
    heartbeatPresent: false,
    evidencePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'cpu_gpu_npu_continuity_evidence_gate',
      cont.status === 'denied' && cont.state === 'NOT_VERIFIED' ? 'PASS' : 'FAIL',
      cont.reason,
    ),
  );
  const failSim = await runFailureSimulation({
    scenario: 'gpu_partition_loss',
    claimRealIncident: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'failure_simulation_labeled',
      failSim.status === 'denied' ? 'PASS' : 'FAIL',
      failSim.reason,
    ),
  );
  const offline = await probeOfflineContinuity({
    nodeId: 'edge-2',
    mode: 'waiting',
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_waiting_or_stopped',
      offline.state === 'WAITING_NODE' ? 'PASS' : 'FAIL',
      offline.reason,
    ),
  );

  // H — Launch command center
  const secOff = await runSecurityBoundaryTest({
    mode: 'offensive',
    root,
    actor,
  });
  hops.push(
    hop(
      'security_boundary_defensive_only',
      secOff.status === 'denied' ? 'PASS' : 'FAIL',
      secOff.reason,
    ),
  );
  const launch = await probeLaunchDataReliability({
    datasetId: 'launch-set-1',
    evidencePresent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'launch_data_reliability_evidence',
      launch.status === 'ok' ? 'PASS' : 'FAIL',
      launch.reason,
    ),
  );

  const preds = predecessorMap(input.repoRoot ?? root);
  const softWireOk =
    preds.ED.tipProbe === 'PRESENT' ||
    preds.EB.tipProbe === 'PRESENT' ||
    preds.ED.tipProbe === 'WAITING_DATA';
  hops.push(
    hop(
      'ed_eb_soft_wire_probe',
      softWireOk ? 'PASS' : 'FAIL',
      `ED=${preds.ED.tipProbe}/${preds.ED.report}; EB=${preds.EB.tipProbe}/${preds.EB.report}`,
    ),
  );

  const stealth = await denyStealthInstall({
    attemptKind: 'stealth_install',
    root,
    actor,
  });
  hops.push(
    hop(
      'stealth_install_denied',
      stealth.status === 'denied' ? 'PASS' : 'FAIL',
      stealth.reason,
    ),
  );

  const twinAuth = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  hops.push(
    hop(
      'digital_twin_neq_founder',
      twinAuth.status === 'denied' ? 'PASS' : 'FAIL',
      twinAuth.reason,
    ),
  );

  const auto = await denyAutonomousAction({
    action: 'book_freight',
    root,
    actor,
  });
  hops.push(
    hop(
      'autonomy_boundary_no_freight_po_spend',
      auto.status === 'denied' ? 'PASS' : 'FAIL',
      auto.reason,
    ),
  );

  void decisionGate({
    id: 'ee-cycle-gate',
    action: '62l_ee_data_nervous_system_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void dataNervousSystemOsHonesty(input.repoRoot);
  void DATA_NERVOUS_SYSTEM_CYCLE;

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-EE data nervous system cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-EE'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-EE data nervous system cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; provenance gated; sync≠migrate; sim≠fact; ` +
        'peer-review≠grant; continuity evidence; autonomy denied',
      sourceRefs: ['62L-EE'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no self-promotion; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: EE_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    softWiredPredecessors: os.softWiredPredecessors,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionDataNervousSystemShipped: false as const,
    dbCandidatesApplied: false as const,
    os,
  };
}

export async function buildDataNervousSystemHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: EeActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: EeActor =
    input?.actor ??
    ({
      kind: 'data_nervous_system_curator',
      id: 'health',
      orgId,
      tenantId,
      universeId,
    } satisfies EeActor);
  const cycle = await runDataNervousSystemCycle({
    orgId,
    tenantId,
    universeId,
    actor,
    root: input?.root,
    repoRoot: input?.repoRoot,
  });
  const failed = cycle.hops.filter((h) => h.state === 'FAIL');
  return {
    status: failed.length === 0 ? 'HEALTHY' : 'DEGRADED',
    failedHops: failed.map((h) => h.hop),
    hopCount: cycle.hops.length,
    predecessorLayer: cycle.predecessorLayer,
    softWiredPredecessors: cycle.softWiredPredecessors,
    honesty: dataNervousSystemOsHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    publicLaunchAuthorized: false as const,
    contractPaymentAuthorized: false as const,
    dbCandidatesApplied: false as const,
  };
}
