import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptAlgorithmSelfPromotion,
  discoverAlgorithmCandidate,
  evaluateBenchmarkGate,
} from './algorithm-discovery-benchmark-factory';
import {
  attemptAgentSelfPromotion,
  openAgentShift,
  openSocietyMeeting,
} from './agent-society-coordination-layer';
import {
  accessHistoricalMemory,
  accessTemporalKnowledgeGraph,
} from './global-historical-data-memory-engine';
import {
  attemptAppPackSelfPromotion,
  composeIndustryApp,
  evaluateWedgeFirstGate,
} from './industry-app-composer';
import {
  claimTrust,
  evaluatePromotionGate,
  probeDigitalTwinAuthority,
} from './launch-resilience-trust-control-tower';
import {
  probeKnowledgeFirewall,
  probePersonalEnterpriseBoundary,
} from './personal-enterprise-knowledge-graph-firewall';
import {
  denyAutonomyBoundaryAction,
  modelDisruptionPropagation,
  proposeRootCausePathway,
} from './supply-chain-intelligence-fabric';
import {
  bootstrapSupplyChainIntelligenceFabric,
  supplyChainIntelligenceFabricSystemHonesty,
} from './supply-chain-intelligence-fabric-system';
import {
  ALGORITHM_SELF_PROMOTION_DENIED,
  AGENT_SELF_PROMOTION_DENIED,
  APP_PACK_SELF_PROMOTION_DENIED,
  BENCHMARK_GATE_REQUIRED,
  CONTRACT_SIGNING_DENIED,
  DEVICE_SELF_PROMOTION_DENIED,
  DISCOVERY_NEQ_PROD,
  DISRUPTION_NEQ_CAUSATION,
  DZ_LOCKS,
  EDGE_EVIDENCE_REQUIRED,
  FIREWALL_CROSS_CONTEXT_DENIED,
  FREIGHT_BOOKING_DENIED,
  HISTORICAL_MEMORY_ACL_DENIED,
  HONESTY_BANNER,
  LABEL_NEQ_HISTORICAL_ACCESS,
  LEARNING_LOOP_RULES,
  NEXT_PHASE_TITLE,
  OFFLINE_PACK_HONEST,
  OFFLINE_WAITING_OR_STOPPED,
  PATHWAY_HYPOTHESIZED_ONLY,
  PERSONAL_ENTERPRISE_BOUNDARY,
  PRODUCT_PHILOSOPHY,
  PRODUCTION_CHANGE_DENIED,
  PROMOTION_GATE,
  PROMOTION_GATE_REQUIRED,
  PURCHASE_ORDER_DENIED,
  QUANTUM_NEEDS_CLASSICAL,
  SANDBOX_NEQ_PROD,
  SPEND_MONEY_DENIED,
  SUPPLY_CHAIN_INTELLIGENCE_FABRIC_CYCLE,
  TASK_RELIABILITY_NEQ_AUTONOMY,
  TEMPORAL_KG_ACL,
  TRUST_EVIDENCE_REQUIRED,
  TWIN_NEQ_FOUNDER,
  UNAUTHORIZED_SOCIETY_MEETING,
  UNLABELED_LEAKAGE_DENIED,
  UNSIGNED_SHIFT_DENIED,
  WEDGE_FIRST_GATED,
  predecessorMap,
  type DzActor,
} from './supply-chain-intelligence-fabric-types';
import {
  buildSupplyChainIntelligenceFabricHealthReport,
  runSupplyChainIntelligenceFabricCycle,
} from './supply-chain-intelligence-fabric-runtime';
import {
  attemptDeviceSelfPromotion,
  probeEdgeRunningVerified,
  probeOfflineEdgeStopped,
  probeOfflineKnowledgePack,
} from './universal-edge-ai-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldz-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DzActor = {
  kind: 'supply_chain_intelligence_curator',
  id: 'test-curator',
  orgId: 'org-dz',
  tenantId: 'tenant-dz',
  universeId: 'universe-dz',
};
const twinActor: DzActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DZ_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DZ_LOCKS.TIP_LAND === false &&
      DZ_LOCKS.FREIGHT_BOOKING_AUTONOMOUS === false &&
      DZ_LOCKS.PATHWAY_EQ_VERIFIED_CAUSATION === false &&
      DZ_LOCKS.DISCOVERY_CANDIDATE_EQ_PRODUCTION_ALGORITHM === false &&
      DZ_LOCKS.ALGORITHM_SELF_PROMOTION_ALLOWED === false &&
      DZ_LOCKS.DEVICE_SELF_PROMOTION_ALLOWED === false &&
      DZ_LOCKS.AGENT_SELF_PROMOTION_ALLOWED === false &&
      DZ_LOCKS.APP_PACK_SELF_PROMOTION_ALLOWED === false &&
      DZ_LOCKS.SANDBOX_COMPOSITION_EQ_PROD_DEPLOY === false &&
      DZ_LOCKS.PROMOTION_WITHOUT_EXPLICIT_AUTH === false &&
      DZ_LOCKS.CLASSICAL_BASELINE_OPTIONAL === false &&
      DZ_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.promotionGateHardDenySelfPromotion === true &&
      LEARNING_LOOP_RULES.noSelfPromotionToProduction === true &&
      PROMOTION_GATE.selfPromotionForbidden === true &&
      SUPPLY_CHAIN_INTELLIGENCE_FABRIC_CYCLE.includes(
        'algorithm_self_promotion_denied',
      ),
    'locks + philosophy + promotion gate + cycle present',
  );

  const os = await bootstrapSupplyChainIntelligenceFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_supply_chain_intelligence_fabric',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      (os.predecessorLayer === 'DY' ||
        os.predecessorLayer === 'DX' ||
        os.predecessorLayer === 'DW') &&
      (os.softWiredPredecessors.includes('DY') ||
        os.softWiredPredecessors.includes('DX') ||
        os.softWiredPredecessors.includes('DW')),
    `os=${os.id}; predecessor=${os.predecessorLayer}; soft=${os.softWiredPredecessors.join(',')}`,
  );

  // A — pathways + autonomy
  const pathway = await proposeRootCausePathway({
    incidentId: 'inc-test',
    summary: 'supplier delay hypothesized',
    verifiedEvidence: false,
    causationClaimed: false,
    attemptPhysicalExecution: true,
    root,
    actor,
  });
  check(
    'root_cause_pathway_hypothesized_only',
    pathway.status === 'hypothesized' &&
      pathway.physicalExecutionAuthorized === false &&
      pathway.reason === PATHWAY_HYPOTHESIZED_ONLY,
    pathway.reason,
  );
  const causationClaim = await proposeRootCausePathway({
    incidentId: 'inc-claim',
    summary: 'claimed causation without evidence',
    verifiedEvidence: false,
    causationClaimed: true,
    root,
    actor,
  });
  check(
    'causation_claim_without_evidence_denied',
    causationClaim.status === 'denied' &&
      causationClaim.reason === DISRUPTION_NEQ_CAUSATION,
    causationClaim.reason,
  );
  const disruption = await modelDisruptionPropagation({
    sourceNode: 'port-a',
    targetNode: 'dc-b',
    correlationObserved: true,
    verifiedCausation: false,
    root,
    actor,
  });
  check(
    'disruption_propagation_neq_verified_causation',
    disruption.status === 'hypothesized' &&
      disruption.reason === DISRUPTION_NEQ_CAUSATION,
    disruption.reason,
  );

  const freight = await denyAutonomyBoundaryAction({
    action: 'book_freight',
    root,
    actor,
  });
  check(
    'freight_booking_denied',
    freight.status === 'denied' && freight.reason === FREIGHT_BOOKING_DENIED,
    freight.reason,
  );
  const po = await denyAutonomyBoundaryAction({
    action: 'issue_purchase_order',
    root,
    actor,
  });
  check(
    'purchase_order_denied',
    po.status === 'denied' && po.reason === PURCHASE_ORDER_DENIED,
    po.reason,
  );
  const contract = await denyAutonomyBoundaryAction({
    action: 'sign_contract',
    root,
    actor,
  });
  check(
    'contract_signing_denied',
    contract.status === 'denied' && contract.reason === CONTRACT_SIGNING_DENIED,
    contract.reason,
  );
  const spend = await denyAutonomyBoundaryAction({
    action: 'spend_money',
    root,
    actor,
  });
  check(
    'spend_money_denied',
    spend.status === 'denied' && spend.reason === SPEND_MONEY_DENIED,
    spend.reason,
  );
  const prod = await denyAutonomyBoundaryAction({
    action: 'change_production_system',
    root,
    actor,
  });
  check(
    'production_change_denied',
    prod.status === 'denied' && prod.reason === PRODUCTION_CHANGE_DENIED,
    prod.reason,
  );

  // B
  const hist = await accessHistoricalMemory({
    memoryId: 'mem-a',
    contextId: 'ctx-a',
    aclGranted: false,
    root,
    actor,
  });
  check(
    'historical_memory_acl_deny_by_default',
    hist.status === 'denied' && hist.reason === HISTORICAL_MEMORY_ACL_DENIED,
    hist.reason,
  );
  const label = await accessHistoricalMemory({
    memoryId: 'mem-b',
    contextId: 'ctx-a',
    aclGranted: false,
    labelPresent: true,
    root,
    actor,
  });
  check(
    'label_alone_neq_historical_access',
    label.status === 'denied' && label.reason === LABEL_NEQ_HISTORICAL_ACCESS,
    label.reason,
  );
  const tkg = await accessTemporalKnowledgeGraph({
    graphId: 'tkg-1',
    contextId: 'ctx-b',
    aclGranted: false,
    root,
    actor,
  });
  check(
    'temporal_knowledge_graph_acl_enforced',
    tkg.status === 'denied' && tkg.reason === TEMPORAL_KG_ACL,
    tkg.reason,
  );

  // C — discovery + self-promotion
  const disc = await discoverAlgorithmCandidate({
    candidateId: 'alg-dock',
    family: 'ml',
    classicalBaselinePresent: true,
    attemptProductionPromote: true,
    root,
    actor,
  });
  check(
    'discovery_candidate_neq_production_algorithm',
    disc.productionAlgorithmAuthorized === false &&
      disc.status === 'candidate' &&
      disc.reason === DISCOVERY_NEQ_PROD,
    disc.reason,
  );
  const qi = await discoverAlgorithmCandidate({
    candidateId: 'alg-qi',
    family: 'quantum_inspired',
    classicalBaselinePresent: false,
    root,
    actor,
  });
  check(
    'quantum_inspired_requires_classical_baseline',
    qi.status === 'denied' && qi.reason === QUANTUM_NEEDS_CLASSICAL,
    qi.reason,
  );
  const bench = await evaluateBenchmarkGate({
    discoveryId: disc.id,
    reproducible: true,
    evidenceBacked: true,
    root,
    actor,
  });
  check(
    'benchmark_gate_requires_reproducible_evidence',
    bench.status === 'benchmark_pass' &&
      bench.productionAlgorithmAuthorized === false &&
      bench.reason === BENCHMARK_GATE_REQUIRED,
    bench.reason,
  );
  const rejected = await evaluateBenchmarkGate({
    discoveryId: disc.id,
    reproducible: false,
    evidenceBacked: false,
    root,
    actor,
  });
  check(
    'non_reproducible_benchmark_rejected',
    rejected.status === 'rejected',
    rejected.reason,
  );
  const algPromo = await attemptAlgorithmSelfPromotion({
    discoveryId: disc.id,
    root,
    actor,
  });
  check(
    'algorithm_self_promotion_denied',
    algPromo.status === 'denied' &&
      algPromo.reason === ALGORITHM_SELF_PROMOTION_DENIED,
    algPromo.reason,
  );

  // D
  const edge = await probeEdgeRunningVerified({
    nodeId: 'edge-x',
    authorized: true,
    heartbeatPresent: false,
    claimRunningVerified: true,
    root,
    actor,
  });
  check(
    'edge_running_verified_needs_evidence',
    edge.state === 'NOT_VERIFIED' &&
      edge.status === 'denied' &&
      edge.reason === EDGE_EVIDENCE_REQUIRED,
    edge.reason,
  );
  const pack = await probeOfflineKnowledgePack({
    packId: 'okp-1',
    poweredNodePresent: false,
    accuracyClaimedWithoutEvidence: true,
    root,
    actor,
  });
  check(
    'offline_knowledge_pack_honest',
    pack.status === 'honest_offline' &&
      pack.state === 'NOT_VERIFIED' &&
      pack.reason === OFFLINE_PACK_HONEST,
    pack.reason,
  );
  const offlineStop = await probeOfflineEdgeStopped({
    nodeId: 'edge-y',
    root,
    actor,
  });
  check(
    'offline_without_powered_node_waiting_or_stopped',
    offlineStop.state === 'OFFLINE_STOPPED' &&
      offlineStop.reason === OFFLINE_WAITING_OR_STOPPED,
    offlineStop.reason,
  );
  const devicePromo = await attemptDeviceSelfPromotion({
    deviceId: 'dev-x',
    root,
    actor,
  });
  check(
    'device_self_promotion_denied',
    devicePromo.status === 'denied' &&
      devicePromo.reason === DEVICE_SELF_PROMOTION_DENIED,
    devicePromo.reason,
  );

  // E
  const unsigned = await openAgentShift({
    shiftId: 'shift-1',
    signed: false,
    authorized: true,
    root,
    actor,
  });
  check(
    'unsigned_agent_shift_denied',
    unsigned.status === 'denied' && unsigned.reason === UNSIGNED_SHIFT_DENIED,
    unsigned.reason,
  );
  const unauthMeet = await openSocietyMeeting({
    meetingId: 'meet-1',
    signed: true,
    authorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_society_meeting_denied',
    unauthMeet.status === 'denied' &&
      unauthMeet.reason === UNAUTHORIZED_SOCIETY_MEETING,
    unauthMeet.reason,
  );
  const autonomy = await openAgentShift({
    shiftId: 'shift-2',
    signed: true,
    authorized: true,
    unrestrictedAutonomyClaimed: true,
    root,
    actor,
  });
  check(
    'task_reliability_neq_unrestricted_autonomy',
    autonomy.status === 'denied' &&
      autonomy.reason === TASK_RELIABILITY_NEQ_AUTONOMY,
    autonomy.reason,
  );
  const agentPromo = await attemptAgentSelfPromotion({
    agentId: 'agent-x',
    root,
    actor,
  });
  check(
    'agent_self_promotion_denied',
    agentPromo.status === 'denied' &&
      agentPromo.reason === AGENT_SELF_PROMOTION_DENIED,
    agentPromo.reason,
  );

  // F
  const fw = await probeKnowledgeFirewall({
    sourceContext: 'personal',
    targetContext: 'enterprise',
    crossContextAttempt: true,
    root,
    actor,
  });
  check(
    'knowledge_firewall_sealed_deny_cross_context',
    fw.status === 'denied' && fw.reason === FIREWALL_CROSS_CONTEXT_DENIED,
    fw.reason,
  );
  const unlabeled = await probeKnowledgeFirewall({
    sourceContext: 'a',
    targetContext: 'b',
    crossContextAttempt: false,
    unlabeled: true,
    root,
    actor,
  });
  check(
    'unlabeled_leakage_denied',
    unlabeled.status === 'denied' &&
      unlabeled.reason === UNLABELED_LEAKAGE_DENIED,
    unlabeled.reason,
  );
  const boundary = await probePersonalEnterpriseBoundary({
    personalContextId: 'p1',
    enterpriseContextId: 'e1',
    attemptCrossBoundary: true,
    root,
    actor,
  });
  check(
    'personal_enterprise_boundary_enforced',
    boundary.status === 'denied' &&
      boundary.reason === PERSONAL_ENTERPRISE_BOUNDARY,
    boundary.reason,
  );

  // G
  const app = await composeIndustryApp({
    packId: 'pack-pharma',
    industry: 'pharma',
    supplyChainPilotProven: true,
    attemptProdDeploy: true,
    root,
    actor,
  });
  check(
    'sandbox_composition_neq_prod_deploy',
    app.sandboxOnly === true &&
      app.productionDeployAuthorized === false &&
      app.reason === SANDBOX_NEQ_PROD,
    app.reason,
  );
  const appPromo = await attemptAppPackSelfPromotion({
    packId: 'pack-pharma',
    root,
    actor,
  });
  check(
    'app_pack_self_promotion_denied',
    appPromo.status === 'denied' &&
      appPromo.reason === APP_PACK_SELF_PROMOTION_DENIED,
    appPromo.reason,
  );
  const wedge = await evaluateWedgeFirstGate({
    supplyChainPilotProofPresent: false,
    attemptBroaderIndustry: true,
    root,
    actor,
  });
  check(
    'wedge_first_industry_pack_gated',
    wedge.status === 'denied' && wedge.reason === WEDGE_FIRST_GATED,
    wedge.reason,
  );

  // H — promotion gate + trust
  const promoGate = await evaluatePromotionGate({
    subject: 'algorithm',
    evidencePresent: false,
    testingPassed: false,
    permissionsGranted: false,
    rollbackPlanPresent: false,
    explicitAuthorization: false,
    selfPromotionAttempted: true,
    root,
    actor,
  });
  check(
    'promotion_gate_requires_evidence_testing_permissions_rollback_auth',
    promoGate.status === 'denied' &&
      promoGate.productionAuthorized === false &&
      promoGate.reason === PROMOTION_GATE_REQUIRED,
    promoGate.reason,
  );
  const promoCompleteButStillGated = await evaluatePromotionGate({
    subject: 'app_pack',
    evidencePresent: true,
    testingPassed: true,
    permissionsGranted: true,
    rollbackPlanPresent: true,
    explicitAuthorization: true,
    selfPromotionAttempted: false,
    root,
    actor,
  });
  check(
    'promotion_gate_complete_still_not_production_authorized',
    promoCompleteButStillGated.productionAuthorized === false &&
      promoCompleteButStillGated.status === 'gated',
    promoCompleteButStillGated.reason,
  );
  const trust = await claimTrust({
    claim: 'resilient',
    evidencePresent: false,
    root,
    actor,
  });
  check(
    'trust_claim_needs_evidence',
    trust.status === 'denied' && trust.reason === TRUST_EVIDENCE_REQUIRED,
    trust.reason,
  );
  const twin = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twin.status === 'denied' && twin.reason === TWIN_NEQ_FOUNDER,
    twin.reason,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'dy_dx_soft_wire_probe',
    preds.DY.tipProbe === 'PRESENT' && preds.DY.report === 'PRESENT',
    `DY=${preds.DY.tipProbe}/${preds.DY.report}; DX=${preds.DX.tipProbe}/${preds.DX.report}; DW=${preds.DW.tipProbe}/${preds.DW.report}`,
  );

  check(
    'next_phase_title_documented_only',
    NEXT_PHASE_TITLE.startsWith('62L-EA') &&
      NEXT_PHASE_TITLE.includes('Global Operations Intelligence Grid'),
    NEXT_PHASE_TITLE,
  );

  const cycle = await runSupplyChainIntelligenceFabricCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_no_fail_hops',
    failedHops.length === 0 &&
      cycle.l4AutonomyEnabled === false &&
      cycle.productionAuthorized === false &&
      cycle.dbCandidatesApplied === false &&
      cycle.githubSotIssue === 143 &&
      cycle.gitlabCoordinationIssue === 77,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',')}`,
  );

  const health = await buildSupplyChainIntelligenceFabricHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report_healthy',
    health.status === 'HEALTHY' &&
      health.productionAuthorized === false &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false,
    `status=${health.status}; hops=${health.hopCount}`,
  );

  const honesty = supplyChainIntelligenceFabricSystemHonesty(repoRoot);
  check(
    'honesty_aggregate',
    honesty.l4AutonomyEnabled === false &&
      honesty.learningLoopRules.noSelfPromotionToProduction === true &&
      honesty.algorithmSelfPromotionAllowed === false &&
      honesty.pathwayEqVerifiedCausation === false &&
      honesty.sandboxCompositionEqProdDeploy === false,
    'honesty aggregate locks hold',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('PASS npm run test:62ldz — all denial/honesty stories');
