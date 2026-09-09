import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptAgeGatedActivation,
  attemptCrossModePrivateAccess,
  bootstrapAdaptiveLifeBusinessIntelligenceOs,
  adaptiveLifeBusinessIntelligenceOsHonesty,
  registerCommandCenterSurface,
} from './adaptive-life-business-intelligence-os';
import {
  bootstrapPersonalizedAiChiefOfStaffNetwork,
  personalizedAiChiefOfStaffHonesty,
  submitChiefOfStaffAction,
} from './personalized-ai-chief-of-staff-network';
import {
  bootstrapGlobalHistoricalKnowledgeEngine,
  discoverHistoricalPathway,
  globalHistoricalKnowledgeEngineHonesty,
  ingestHistoricalSource,
  registerHistoricalCoverageMap,
} from './global-historical-knowledge-engine';
import {
  bootstrapDecisionSimulationStudio,
  decisionSimulationStudioHonesty,
  runDecisionSimulation,
} from './decision-simulation-studio';
import {
  autonomousResearchWorkforcePlannerHonesty,
  bootstrapAutonomousResearchWorkforcePlanner,
  planResearchCampaign,
  scheduleOvernightWorkPlan,
} from './autonomous-research-workforce-planner';
import {
  bootstrapCommunityCollaborationGraph,
  communityCollaborationGraphHonesty,
  requestCommunityShare,
} from './community-collaboration-graph';
import {
  bootstrapContinuousUxLearningAgentEvolutionFabric,
  continuousUxLearningAgentEvolutionHonesty,
  recordUxAgentEvolution,
  rollbackUxAgentEvolution,
} from './continuous-ux-learning-agent-evolution-fabric';
import {
  ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_CYCLE,
  CHIEF_OF_STAFF_SPEND_DEPLOY_PUBLISH_DENIED,
  COMMUNITY_SHARE_OPT_IN_DENIED,
  CROSS_PERSONAL_BUSINESS_LEAK_DENIED,
  DECISION_SIM_NOT_VERIFIED_FACT,
  DH_LOCKS,
  EVOLUTION_ROLLBACK_OK,
  HONESTY_BANNER,
  LEARNING_AUTHORITY_SELF_GRANT_DENIED,
  NEXT_PHASE_TITLE,
  OVERNIGHT_OFFLINE_STOPPED,
  OVERNIGHT_WAITING_NODE,
  QUANTUM_ADJACENT_WITHOUT_BASELINE_REJECTED,
  UNAUTHORIZED_HISTORICAL_INGESTION_DENIED,
  UNDER_18_DENIED,
  predecessorMap,
  type DhActor,
} from './adaptive-life-business-intelligence-os-types';
import {
  buildAdaptiveLifeBusinessIntelligenceOsHealthReport,
  runAdaptiveLifeBusinessIntelligenceOsCycle,
} from './adaptive-life-business-intelligence-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldh-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DhActor = {
  kind: 'adaptive_os_curator',
  id: 'curator-dh-1',
  orgId: 'org-dh',
  tenantId: 'tenant-dh',
  universeId: 'univ-dh',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DH1-cycle',
    ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_CYCLE.join(' → ') ===
      'honesty_locks → adaptive_life_business_intelligence_os_bootstrap → cross_personal_business_private_leak_denied → under_18_denied_where_applicable → unauthorized_historical_ingestion_denied → decision_sim_not_labeled_verified_fact → quantum_adjacent_without_classical_baseline_rejected → overnight_plan_without_powered_node_waiting_or_offline → community_share_without_opt_in_denied → ux_agent_evolution_reversible_rollback → learning_cannot_self_grant_authority → chief_of_staff_cannot_approve_spend_deploy_publish_alone → evidence → learning',
    'Adaptive Life & Business Intelligence OS cycle recorded in order.',
  );

  check(
    'US-DH-locks',
    DH_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DH_LOCKS.UNDER_18_ACTIVATION_ALLOWED === false &&
      DH_LOCKS.CROSS_PERSONAL_BUSINESS_PRIVATE_LEAK === false &&
      DH_LOCKS.UNAUTHORIZED_HISTORICAL_INGESTION === false &&
      DH_LOCKS.DECISION_SIM_LABELED_AS_VERIFIED_FACT === false &&
      DH_LOCKS.QUANTUM_ADJACENT_WITHOUT_CLASSICAL_BASELINE === false &&
      DH_LOCKS.COMMUNITY_SHARE_WITHOUT_OPT_IN === false &&
      DH_LOCKS.OVERNIGHT_WITHOUT_POWERED_AUTHORIZED_NODE === false &&
      DH_LOCKS.LEARNING_SELF_GRANTS_AUTHORITY === false &&
      DH_LOCKS.CHIEF_OF_STAFF_CAN_APPROVE_SPEND === false &&
      DH_LOCKS.CHIEF_OF_STAFF_CAN_APPROVE_DEPLOY === false &&
      DH_LOCKS.CHIEF_OF_STAFF_CAN_APPROVE_PUBLISH === false &&
      DH_LOCKS.UX_AGENT_EVOLUTION_IRREVERSIBLE === false &&
      DH_LOCKS.TIP_LAND === false &&
      DH_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      DH_LOCKS.LIVE_SUPABASE_APPLY === false,
    'Honesty locks held.',
  );

  check(
    'US-DH-honesty-surfaces',
    adaptiveLifeBusinessIntelligenceOsHonesty().banner === HONESTY_BANNER &&
      personalizedAiChiefOfStaffHonesty().recommendationOnly === true &&
      globalHistoricalKnowledgeEngineHonesty().requiresProvenanceAndRights === true &&
      decisionSimulationStudioHonesty().predictionsRemainProbabilistic === true &&
      autonomousResearchWorkforcePlannerHonesty().overnightRequiresAuthorizedPoweredNode ===
        true &&
      communityCollaborationGraphHonesty().communitySharingOptInOnly === true &&
      continuousUxLearningAgentEvolutionHonesty().evolutionExplainableReversible === true &&
      NEXT_PHASE_TITLE.startsWith('62L-DI'),
    'Subsystem honesty surfaces + next phase DI title.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DH-predecessor-probe',
    preds.DF.tipProbe === 'PRESENT' &&
      preds.DF.report === 'PRESENT' &&
      (preds.DG.tipProbe === 'PRESENT' || preds.DG.tipProbe === 'WAITING_DATA'),
    `DG=${preds.DG.tipProbe}/${preds.DG.report}; DF=${preds.DF.tipProbe}/${preds.DF.report}`,
  );

  const os = await bootstrapAdaptiveLifeBusinessIntelligenceOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    mode: 'personal',
    root,
    actor,
    repoRoot,
  });
  const surface = await registerCommandCenterSurface({
    osId: os.id,
    surface: 'business_command',
    mode: 'business',
    root,
    actor,
  });
  check(
    'US-DH-bootstrap',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.productionAuthorized === false &&
      surface.accepted === true &&
      (os.predecessorLayer === 'DG' || os.predecessorLayer === 'DF'),
    `os=${os.id} predecessor=${os.predecessorLayer}`,
  );

  // Cross Personal/Business private leak DENIED by default
  const leak = await attemptCrossModePrivateAccess({
    osId: os.id,
    fromBoundary: 'personal_private',
    toBoundary: 'business_private',
    explicitSharedPolicy: false,
    root,
    actor,
  });
  const leakBiz = await attemptCrossModePrivateAccess({
    osId: os.id,
    fromBoundary: 'business_private',
    toBoundary: 'personal_private',
    root,
    actor,
  });
  check(
    'US-DH-cross-personal-business-private-leak-denied',
    leak.accepted === false &&
      leak.reason === CROSS_PERSONAL_BUSINESS_LEAK_DENIED &&
      leakBiz.accepted === false &&
      leakBiz.reason === CROSS_PERSONAL_BUSINESS_LEAK_DENIED,
    leak.reason,
  );

  // Under-18 DENIED where applicable
  const under18 = await attemptAgeGatedActivation({
    osId: os.id,
    declaredAgeYears: 16,
    root,
    actor,
  });
  const adult = await attemptAgeGatedActivation({
    osId: os.id,
    declaredAgeYears: 21,
    root,
    actor,
  });
  check(
    'US-DH-under-18-denied',
    under18.accepted === false &&
      under18.reason === UNDER_18_DENIED &&
      adult.accepted === true,
    under18.reason,
  );

  // Unauthorized historical ingestion DENIED
  const hist = await bootstrapGlobalHistoricalKnowledgeEngine({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  await registerHistoricalCoverageMap({
    engineId: hist.id,
    mapId: 'map-1',
    region: 'americas',
    root,
    actor,
  });
  const ingestDeny = await ingestHistoricalSource({
    engineId: hist.id,
    sourceId: 'rights-unclear',
    provenancePresent: true,
    rightsCleared: false,
    authorized: true,
    root,
    actor,
  });
  const ingestOk = await ingestHistoricalSource({
    engineId: hist.id,
    sourceId: 'cleared-source',
    provenancePresent: true,
    rightsCleared: true,
    authorized: true,
    root,
    actor,
  });
  const pathDeny = await discoverHistoricalPathway({
    engineId: hist.id,
    pathwayId: 'path-1',
    provenanceBacked: false,
    authorized: false,
    root,
    actor,
  });
  check(
    'US-DH-unauthorized-historical-ingestion-denied',
    ingestDeny.accepted === false &&
      ingestDeny.reason === UNAUTHORIZED_HISTORICAL_INGESTION_DENIED &&
      ingestOk.accepted === true &&
      pathDeny.accepted === false &&
      pathDeny.reason === UNAUTHORIZED_HISTORICAL_INGESTION_DENIED,
    ingestDeny.reason,
  );

  // Decision sim not labeled verified outcome/fact
  const studio = await bootstrapDecisionSimulationStudio({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const simDeny = await runDecisionSimulation({
    studioId: studio.id,
    scenarioId: 'as-fact',
    claimVerifiedOutcome: true,
    classicalBaselinePresent: true,
    assumptions: ['a1'],
    probability: 0.42,
    root,
    actor,
  });
  const simOk = await runDecisionSimulation({
    studioId: studio.id,
    scenarioId: 'labeled-sim',
    label: 'LABELED_SIMULATION',
    assumptions: ['market-upside'],
    probability: 0.55,
    classicalBaselinePresent: true,
    root,
    actor,
  });
  check(
    'US-DH-decision-sim-not-verified-fact',
    simDeny.accepted === false &&
      simDeny.reason === DECISION_SIM_NOT_VERIFIED_FACT &&
      simDeny.simulation?.labeledVerifiedFact === false &&
      simDeny.simulation?.labeledVerifiedOutcome === false &&
      simOk.accepted === true &&
      simOk.simulation?.label === 'LABELED_SIMULATION',
    simDeny.reason,
  );

  // Quantum-adjacent prediction without classical baseline REJECTED
  const qReject = await runDecisionSimulation({
    studioId: studio.id,
    scenarioId: 'q-adj',
    quantumAdjacent: true,
    classicalBaselinePresent: false,
    root,
    actor,
  });
  const qOk = await runDecisionSimulation({
    studioId: studio.id,
    scenarioId: 'q-adj-ok',
    quantumAdjacent: true,
    classicalBaselinePresent: true,
    label: 'PROBABILISTIC',
    probability: 0.3,
    root,
    actor,
  });
  check(
    'US-DH-quantum-adjacent-without-baseline-rejected',
    qReject.accepted === false &&
      qReject.reason === QUANTUM_ADJACENT_WITHOUT_BASELINE_REJECTED &&
      qOk.accepted === true,
    qReject.reason,
  );

  // Overnight plan with no powered node → WAITING_NODE or OFFLINE_STOPPED
  const planner = await bootstrapAutonomousResearchWorkforcePlanner({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  await planResearchCampaign({
    plannerId: planner.id,
    campaignId: 'r1',
    objective: 'corpus scan',
    root,
    actor,
  });
  const waitNode = await scheduleOvernightWorkPlan({
    plannerId: planner.id,
    planId: 'o1',
    poweredNodePresent: false,
    authorizedNode: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  const offline = await scheduleOvernightWorkPlan({
    plannerId: planner.id,
    planId: 'o2',
    poweredNodePresent: false,
    authorizedNode: true,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  const overnightOk = await scheduleOvernightWorkPlan({
    plannerId: planner.id,
    planId: 'o3',
    poweredNodePresent: true,
    authorizedNode: true,
    root,
    actor,
  });
  check(
    'US-DH-overnight-without-powered-node',
    waitNode.accepted === false &&
      waitNode.reason === OVERNIGHT_WAITING_NODE &&
      waitNode.plan?.status === 'WAITING_NODE' &&
      offline.accepted === false &&
      offline.reason === OVERNIGHT_OFFLINE_STOPPED &&
      offline.plan?.status === 'OFFLINE_STOPPED' &&
      overnightOk.accepted === true,
    `${waitNode.reason}/${offline.reason}`,
  );

  // Community share without opt-in DENIED
  const graph = await bootstrapCommunityCollaborationGraph({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const shareDeny = await requestCommunityShare({
    graphId: graph.id,
    fromNode: 'n1',
    toNode: 'n2',
    optIn: false,
    root,
    actor,
  });
  const shareOk = await requestCommunityShare({
    graphId: graph.id,
    fromNode: 'n1',
    toNode: 'n3',
    optIn: true,
    root,
    actor,
  });
  check(
    'US-DH-community-share-without-opt-in-denied',
    shareDeny.accepted === false &&
      shareDeny.reason === COMMUNITY_SHARE_OPT_IN_DENIED &&
      shareOk.accepted === true,
    shareDeny.reason,
  );

  // UX/agent evolution reversible / roll back trusted status
  const fabric = await bootstrapContinuousUxLearningAgentEvolutionFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const evo = await recordUxAgentEvolution({
    fabricId: fabric.id,
    subjectId: 'ux-agent-1',
    changeSummary: 'density preference',
    promoteTrusted: true,
    root,
    actor,
  });
  const rolled = await rollbackUxAgentEvolution({
    fabricId: fabric.id,
    entryId: evo.entry!.id,
    root,
    actor,
  });
  check(
    'US-DH-ux-agent-evolution-reversible-rollback',
    evo.accepted === true &&
      evo.entry?.trustedStatus === 'TRUSTED' &&
      evo.entry?.reversible === true &&
      evo.entry?.explainable === true &&
      rolled.accepted === true &&
      rolled.reason === EVOLUTION_ROLLBACK_OK &&
      rolled.entry?.trustedStatus === 'ROLLED_BACK' &&
      rolled.entry?.priorTrustedStatus === 'TRUSTED',
    rolled.reason,
  );

  // Learning cannot self-grant authority
  const grant = await recordUxAgentEvolution({
    fabricId: fabric.id,
    subjectId: 'ux-agent-1',
    changeSummary: 'self grant',
    authorityGrantRequested: true,
    root,
    actor,
  });
  check(
    'US-DH-learning-cannot-self-grant-authority',
    grant.accepted === false && grant.reason === LEARNING_AUTHORITY_SELF_GRANT_DENIED,
    grant.reason,
  );

  // Chief-of-Staff cannot approve spend/deploy/publish alone
  const cos = await bootstrapPersonalizedAiChiefOfStaffNetwork({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const spend = await submitChiefOfStaffAction({
    networkId: cos.id,
    action: 'approve_spend',
    summary: 'spend',
    root,
    actor,
  });
  const deploy = await submitChiefOfStaffAction({
    networkId: cos.id,
    action: 'approve_deploy',
    summary: 'deploy',
    root,
    actor,
  });
  const publish = await submitChiefOfStaffAction({
    networkId: cos.id,
    action: 'approve_publish',
    summary: 'publish',
    root,
    actor,
  });
  const recommend = await submitChiefOfStaffAction({
    networkId: cos.id,
    action: 'recommend',
    summary: 'suggest schedule',
    root,
    actor,
  });
  check(
    'US-DH-chief-of-staff-cannot-approve-spend-deploy-publish-alone',
    spend.accepted === false &&
      spend.reason === CHIEF_OF_STAFF_SPEND_DEPLOY_PUBLISH_DENIED &&
      deploy.accepted === false &&
      publish.accepted === false &&
      recommend.accepted === true &&
      recommend.recommendation?.status === 'RECOMMENDATION_ONLY' &&
      recommend.recommendation?.digitalTwinIsFounder === false,
    spend.reason,
  );

  const cycle = await runAdaptiveLifeBusinessIntelligenceOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: `${actor.universeId}-cycle`,
    actor,
    root,
    repoRoot,
  });
  check(
    'US-DH-cycle-run',
    cycle.hops.length === ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_CYCLE.length &&
      cycle.l4AutonomyEnabled === false &&
      cycle.tipLand === false &&
      cycle.fullProductionUxShipped === false,
    `hops=${cycle.hops.length}`,
  );

  const health = await buildAdaptiveLifeBusinessIntelligenceOsHealthReport({
    root,
    repoRoot,
  });
  check(
    'US-DH-health-report',
    health.honestyBanner === HONESTY_BANNER &&
      health.githubSotIssue === 125 &&
      health.gitlabCoordinationIssue === 59,
    'Health report emits SoT citations.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DH stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DH Adaptive Life & Business Intelligence OS stories passed.');
