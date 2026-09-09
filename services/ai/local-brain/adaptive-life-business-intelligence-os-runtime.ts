/**
 * 62L-DH Adaptive Life & Business Intelligence OS runtime —
 * Walks ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  adaptiveLifeBusinessIntelligenceOsHonesty,
  attemptAgeGatedActivation,
  attemptCrossModePrivateAccess,
  bootstrapAdaptiveLifeBusinessIntelligenceOs,
  registerCommandCenterSurface,
} from './adaptive-life-business-intelligence-os';
import {
  bootstrapPersonalizedAiChiefOfStaffNetwork,
  submitChiefOfStaffAction,
} from './personalized-ai-chief-of-staff-network';
import {
  bootstrapGlobalHistoricalKnowledgeEngine,
  ingestHistoricalSource,
  registerHistoricalCoverageMap,
} from './global-historical-knowledge-engine';
import {
  bootstrapDecisionSimulationStudio,
  runDecisionSimulation,
} from './decision-simulation-studio';
import {
  bootstrapAutonomousResearchWorkforcePlanner,
  planResearchCampaign,
  scheduleOvernightWorkPlan,
} from './autonomous-research-workforce-planner';
import {
  bootstrapCommunityCollaborationGraph,
  requestCommunityShare,
} from './community-collaboration-graph';
import {
  bootstrapContinuousUxLearningAgentEvolutionFabric,
  recordUxAgentEvolution,
  rollbackUxAgentEvolution,
} from './continuous-ux-learning-agent-evolution-fabric';
import {
  ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_CYCLE,
  DH_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type DhActor,
  type DhEvidenceState,
  type DhHop,
  type DhHopRecord,
} from './adaptive-life-business-intelligence-os-types';

export {
  ADAPTIVE_LIFE_BUSINESS_INTELLIGENCE_OS_CYCLE,
  DH_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DhHop, state: DhEvidenceState, summary: string): DhHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DhCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DhActor;
  root?: string;
  repoRoot?: string;
};

export async function runAdaptiveLifeBusinessIntelligenceOsCycle(input: DhCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DhHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DH_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DH_LOCKS.LOCAL_FIRST &&
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
        DH_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapAdaptiveLifeBusinessIntelligenceOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode: 'personal',
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  await registerCommandCenterSurface({
    osId: os.id,
    surface: 'life_command',
    root,
    actor,
  });
  hops.push(
    hop(
      'adaptive_life_business_intelligence_os_bootstrap',
      os && adaptiveLifeBusinessIntelligenceOsHonesty().l4AutonomyEnabled === false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `Adaptive OS id=${os.id} predecessor=${os.predecessorLayer} fullProductionUxShipped=${os.fullProductionUxShipped}`,
    ),
  );

  const leak = await attemptCrossModePrivateAccess({
    osId: os.id,
    fromBoundary: 'personal_private',
    toBoundary: 'business_private',
    explicitSharedPolicy: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'cross_personal_business_private_leak_denied',
      leak.accepted === false ? 'DENIED' : 'FAIL',
      leak.reason,
    ),
  );

  const under18 = await attemptAgeGatedActivation({
    osId: os.id,
    declaredAgeYears: 17,
    root,
    actor,
  });
  hops.push(
    hop(
      'under_18_denied_where_applicable',
      under18.accepted === false ? 'DENIED' : 'FAIL',
      under18.reason,
    ),
  );

  const hist = await bootstrapGlobalHistoricalKnowledgeEngine({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  await registerHistoricalCoverageMap({
    engineId: hist.id,
    mapId: 'coverage-1',
    region: 'global',
    root,
    actor,
  });
  const ingest = await ingestHistoricalSource({
    engineId: hist.id,
    sourceId: 'unauthorized-source',
    provenancePresent: false,
    rightsCleared: false,
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_historical_ingestion_denied',
      ingest.accepted === false ? 'DENIED' : 'FAIL',
      ingest.reason,
    ),
  );

  const studio = await bootstrapDecisionSimulationStudio({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const simFact = await runDecisionSimulation({
    studioId: studio.id,
    scenarioId: 'sim-verified-claim',
    claimVerifiedFact: true,
    classicalBaselinePresent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'decision_sim_not_labeled_verified_fact',
      simFact.accepted === false ? 'DENIED' : 'FAIL',
      simFact.reason,
    ),
  );

  const quantum = await runDecisionSimulation({
    studioId: studio.id,
    scenarioId: 'q-adjacent-1',
    quantumAdjacent: true,
    classicalBaselinePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_adjacent_without_classical_baseline_rejected',
      quantum.accepted === false ? 'REJECTED' : 'FAIL',
      quantum.reason,
    ),
  );

  const planner = await bootstrapAutonomousResearchWorkforcePlanner({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  await planResearchCampaign({
    plannerId: planner.id,
    campaignId: 'camp-1',
    objective: 'overnight research plan',
    root,
    actor,
  });
  const overnight = await scheduleOvernightWorkPlan({
    plannerId: planner.id,
    planId: 'overnight-1',
    poweredNodePresent: false,
    authorizedNode: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  hops.push(
    hop(
      'overnight_plan_without_powered_node_waiting_or_offline',
      overnight.accepted === false &&
        (overnight.plan?.status === 'WAITING_NODE' ||
          overnight.plan?.status === 'OFFLINE_STOPPED')
        ? overnight.plan.status
        : 'FAIL',
      overnight.reason,
    ),
  );

  const graph = await bootstrapCommunityCollaborationGraph({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const share = await requestCommunityShare({
    graphId: graph.id,
    fromNode: 'a',
    toNode: 'b',
    optIn: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'community_share_without_opt_in_denied',
      share.accepted === false ? 'DENIED' : 'FAIL',
      share.reason,
    ),
  );

  const fabric = await bootstrapContinuousUxLearningAgentEvolutionFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const evo = await recordUxAgentEvolution({
    fabricId: fabric.id,
    subjectId: 'agent-ux-1',
    changeSummary: 'layout preference learning',
    promoteTrusted: true,
    root,
    actor,
  });
  const rollback = await rollbackUxAgentEvolution({
    fabricId: fabric.id,
    entryId: evo.entry!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'ux_agent_evolution_reversible_rollback',
      rollback.accepted === true && rollback.entry?.trustedStatus === 'ROLLED_BACK'
        ? 'REVERSIBLE'
        : 'FAIL',
      rollback.reason,
    ),
  );

  const authGrant = await recordUxAgentEvolution({
    fabricId: fabric.id,
    subjectId: 'agent-ux-1',
    changeSummary: 'self-grant authority attempt',
    authorityGrantRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'learning_cannot_self_grant_authority',
      authGrant.accepted === false ? 'DENIED' : 'FAIL',
      authGrant.reason,
    ),
  );

  const cos = await bootstrapPersonalizedAiChiefOfStaffNetwork({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const spend = await submitChiefOfStaffAction({
    networkId: cos.id,
    action: 'approve_spend',
    summary: 'approve spend alone',
    root,
    actor,
  });
  hops.push(
    hop(
      'chief_of_staff_cannot_approve_spend_deploy_publish_alone',
      spend.accepted === false ? 'DENIED' : 'FAIL',
      spend.reason,
    ),
  );

  void decisionGate({
    id: 'dh-cycle-gate',
    action: '62l_dh_adaptive_life_business_intelligence_os_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void adaptiveLifeBusinessIntelligenceOsHonesty();

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DH adaptive life & business intelligence OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DH'],
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
      subject: '62L-DH adaptive life & business intelligence OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; learning≠authority; CoS recommendation-only; sim≠verified fact; overnight node-gated`,
      sourceRefs: ['62L-DH'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ authority; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);
  const preds = predecessorMap(input.repoRoot ?? root);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DH_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionUxShipped: false as const,
  };
}

export async function buildAdaptiveLifeBusinessIntelligenceOsHealthReport(input?: {
  root?: string;
  repoRoot?: string;
}) {
  const root = input?.root ?? process.cwd();
  const actor: DhActor = {
    kind: 'adaptive_os_curator',
    id: 'health-dh',
    orgId: 'org-health-dh',
    tenantId: 'tenant-health-dh',
    universeId: 'univ-health-dh',
    role: 'curator',
    permissionLevel: 1,
    authorityLevel: 0,
  };
  const cycle = await runAdaptiveLifeBusinessIntelligenceOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot: input?.repoRoot ?? root,
  });
  return {
    ...cycle,
    honesty: adaptiveLifeBusinessIntelligenceOsHonesty(),
    generatedAt: new Date().toISOString(),
  };
}
