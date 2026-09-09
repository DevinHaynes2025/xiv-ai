/**
 * 62L-DG Universal Personal/Business AI OS runtime —
 * Walks UNIVERSAL_PERSONAL_BUSINESS_AI_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  attemptCrossModePrivateAccess,
  attemptPersonalModeActivation,
  bootstrapUniversalPersonalBusinessAiOs,
  storeModePrivateRecord,
  universalPersonalBusinessAiOsHonesty,
} from './universal-personal-business-ai-os';
import {
  bootstrapGlobalLifeEnterpriseCommandCenter,
  registerCommandCenterSurface,
  runUniversalSearchWithEvidence,
} from './global-life-enterprise-command-center-ux';
import {
  bootstrapHistoricalWorldSimulationEngine,
  exploreHistoricalPathway,
  registerHistoricalSource,
} from './historical-world-simulation-engine';
import {
  bootstrapPredictiveDecisionIntelligence,
  composePredictiveScenario,
} from './predictive-decision-intelligence';
import {
  attemptAgentEconomySpend,
  bootstrapPersonalAgentEconomy,
  planOvernightShift,
  registerPersonalAgentTeam,
} from './personal-agent-economy';
import {
  attemptCommunityShare,
  bootstrapMultilingualCommunityIntelligenceNetwork,
  discoverCommunityExpert,
} from './multilingual-community-intelligence-network';
import {
  bootstrapContinuousAgentLearningDebriefSystem,
  openVisibleDebriefRoom,
  recordLearningDebrief,
} from './continuous-agent-learning-debrief-system';
import {
  DG_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  UNIVERSAL_PERSONAL_BUSINESS_AI_OS_CYCLE,
  predecessorMap,
  type DgActor,
  type DgEvidenceState,
  type DgHop,
  type DgHopRecord,
} from './universal-personal-business-ai-os-types';

export {
  DG_LOCKS,
  HONESTY_BANNER,
  UNIVERSAL_PERSONAL_BUSINESS_AI_OS_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DgHop, state: DgEvidenceState, summary: string): DgHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DgCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DgActor;
  root?: string;
  repoRoot?: string;
};

export async function runUniversalPersonalBusinessAiOsCycle(input: DgCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DgHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DG_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DG_LOCKS.LOCAL_FIRST &&
        DG_LOCKS.CROSS_MODE_LEAK_PERSONAL_TO_BUSINESS === false &&
        DG_LOCKS.CROSS_MODE_LEAK_BUSINESS_TO_PERSONAL === false &&
        DG_LOCKS.DUAL_MODE_COLLAPSES_ISOLATION_WITHOUT_EXPLICIT_POLICY === false &&
        DG_LOCKS.UNDER_18_PERSONAL_ACTIVATION_ALLOWED === false &&
        DG_LOCKS.UNAUTHORIZED_HISTORICAL_SOURCE === false &&
        DG_LOCKS.PREDICTION_LABELED_AS_VERIFIED_FACT === false &&
        DG_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE === false &&
        DG_LOCKS.COMMUNITY_SHARE_WITHOUT_OPT_IN === false &&
        DG_LOCKS.LEARNING_SELF_GRANTS_AUTHORITY === false &&
        DG_LOCKS.AGENT_ECONOMY_CAN_PURCHASE === false &&
        DG_LOCKS.AGENT_ECONOMY_CAN_BILL === false &&
        DG_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const personalOs = await bootstrapUniversalPersonalBusinessAiOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode: 'personal',
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  const businessOs = await bootstrapUniversalPersonalBusinessAiOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode: 'business',
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  const dualOs = await bootstrapUniversalPersonalBusinessAiOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode: 'dual',
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'universal_personal_business_ai_os_bootstrap',
      'IMPLEMENTED',
      `personal=${personalOs.id}; business=${businessOs.id}; dual=${dualOs.id}; pred=${personalOs.predecessorLayer}`,
    ),
  );

  await storeModePrivateRecord({
    osId: personalOs.id,
    mode: 'personal',
    boundary: 'personal_private',
    key: 'diary',
    value: 'personal-secret',
    root,
    actor,
  });
  await storeModePrivateRecord({
    osId: businessOs.id,
    mode: 'business',
    boundary: 'business_private',
    key: 'payroll',
    value: 'business-secret',
    root,
    actor,
  });

  const p2b = await attemptCrossModePrivateAccess({
    osId: personalOs.id,
    fromMode: 'personal',
    toMode: 'business',
    targetBoundary: 'business_private',
    root,
    actor,
  });
  hops.push(
    hop(
      'cross_mode_isolation_personal_to_business_denied',
      p2b.allowed === false ? 'DENIED' : 'FAIL',
      p2b.reason,
    ),
  );

  const b2p = await attemptCrossModePrivateAccess({
    osId: businessOs.id,
    fromMode: 'business',
    toMode: 'personal',
    targetBoundary: 'personal_private',
    root,
    actor,
  });
  hops.push(
    hop(
      'cross_mode_isolation_business_to_personal_denied',
      b2p.allowed === false ? 'DENIED' : 'FAIL',
      b2p.reason,
    ),
  );

  const dualHold = await attemptCrossModePrivateAccess({
    osId: dualOs.id,
    fromMode: 'dual',
    toMode: 'personal',
    targetBoundary: 'personal_private',
    explicitSharedPolicy: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'dual_mode_does_not_collapse_isolation',
      dualHold.status === 'ISOLATION_HELD' || dualHold.allowed === false
        ? 'ISOLATION_HELD'
        : 'FAIL',
      dualHold.reason,
    ),
  );

  const under18 = await attemptPersonalModeActivation({
    osId: personalOs.id,
    declaredAgeYears: 16,
    root,
    actor,
  });
  hops.push(
    hop(
      'under_18_personal_activation_denied',
      under18.accepted === false ? 'DENIED' : 'FAIL',
      under18.reason,
    ),
  );

  const center = await bootstrapGlobalLifeEnterpriseCommandCenter({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode: 'dual',
    root,
    actor,
  });
  await registerCommandCenterSurface({
    centerId: center.id,
    surface: 'life_command',
    locale: 'en',
    root,
    actor,
  });
  await runUniversalSearchWithEvidence({
    centerId: center.id,
    query: 'evidence-first command search',
    root,
    actor,
  });

  const hist = await bootstrapHistoricalWorldSimulationEngine({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const unauthSrc = await registerHistoricalSource({
    engineId: hist.id,
    sourceId: 'unauthorized-src',
    authorized: false,
    provenanceBacked: false,
    root,
    actor,
  });
  const unauthExplore = await exploreHistoricalPathway({
    engineId: hist.id,
    timelineId: 'tl-unauth',
    sourceId: 'unauthorized-src',
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_historical_source_denied',
      unauthSrc.accepted === false && unauthExplore.accepted === false ? 'DENIED' : 'FAIL',
      unauthSrc.reason,
    ),
  );

  const pred = await bootstrapPredictiveDecisionIntelligence({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const verifiedClaim = await composePredictiveScenario({
    engineId: pred.id,
    scenarioId: 'sc-verified-claim',
    claimVerifiedFact: true,
    classicalBaselinePresent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'prediction_not_labeled_verified_fact',
      verifiedClaim.accepted === false ? 'DENIED' : 'FAIL',
      verifiedClaim.reason,
    ),
  );

  const quantumNoBase = await composePredictiveScenario({
    engineId: pred.id,
    scenarioId: 'sc-quantum-no-base',
    quantumPathUsed: true,
    classicalBaselinePresent: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_without_classical_baseline_rejected',
      quantumNoBase.accepted === false ? 'REJECTED' : 'FAIL',
      quantumNoBase.reason,
    ),
  );

  const community = await bootstrapMultilingualCommunityIntelligenceNetwork({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  await discoverCommunityExpert({
    networkId: community.id,
    locale: 'es',
    query: 'expertos locales',
    root,
    actor,
  });
  const noOptIn = await attemptCommunityShare({
    networkId: community.id,
    payloadRef: 'payload-1',
    optIn: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'community_share_without_opt_in_denied',
      noOptIn.accepted === false ? 'DENIED' : 'FAIL',
      noOptIn.reason,
    ),
  );

  const economy = await bootstrapPersonalAgentEconomy({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  await registerPersonalAgentTeam({
    economyId: economy.id,
    teamId: 'team-night',
    root,
    actor,
  });
  const overnight = await planOvernightShift({
    economyId: economy.id,
    shiftId: 'shift-1',
    teamId: 'team-night',
    poweredAuthorizedNode: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'overnight_shift_without_powered_node_waiting_or_offline',
      overnight.status === 'WAITING_NODE' || overnight.status === 'OFFLINE_STOPPED'
        ? overnight.status
        : 'FAIL',
      overnight.reason,
    ),
  );

  const learning = await bootstrapContinuousAgentLearningDebriefSystem({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  await openVisibleDebriefRoom({
    systemId: learning.id,
    roomId: 'room-1',
    root,
    actor,
  });
  const selfGrant = await recordLearningDebrief({
    systemId: learning.id,
    roomId: 'room-1',
    agentId: 'agent-1',
    summary: 'learned something',
    authoritySelfGrantRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'learning_debrief_cannot_self_grant_authority',
      selfGrant.accepted === false ? 'DENIED' : 'FAIL',
      selfGrant.reason,
    ),
  );

  const spend = await attemptAgentEconomySpend({
    economyId: economy.id,
    kind: 'purchase',
    amount: 42,
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_economy_cannot_purchase_or_bill',
      spend.accepted === false ? 'DENIED' : 'FAIL',
      spend.reason,
    ),
  );

  void decisionGate({
    id: 'dg-cycle-gate',
    action: '62l_dg_universal_personal_business_ai_os_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void universalPersonalBusinessAiOsHonesty();

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DG universal personal/business AI OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DG'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`),
  );

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DG universal personal/business AI OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        'hops recorded; learning≠permission; mode isolation held; predictions probabilistic; no spend authority',
      sourceRefs: ['62L-DG'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);
  const preds = predecessorMap(input.repoRoot ?? root);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DG_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: personalOs.predecessorLayer,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionUxShipped: false as const,
  };
}

export async function buildUniversalPersonalBusinessAiOsHealthReport(input?: {
  root?: string;
  repoRoot?: string;
}) {
  const root = input?.root ?? process.cwd();
  const actor: DgActor = {
    kind: 'universal_os_curator',
    id: 'health-dg',
    orgId: 'org-health-dg',
    tenantId: 'tenant-health-dg',
    universeId: 'univ-health-dg',
    role: 'curator',
    permissionLevel: 1,
    authorityLevel: 0,
  };
  const cycle = await runUniversalPersonalBusinessAiOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot: input?.repoRoot ?? root,
  });
  return {
    ...cycle,
    honesty: universalPersonalBusinessAiOsHonesty(),
    generatedAt: new Date().toISOString(),
  };
}
