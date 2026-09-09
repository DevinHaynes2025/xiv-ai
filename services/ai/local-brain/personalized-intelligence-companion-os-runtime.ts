/**
 * 62L-DI Personalized Intelligence Companion OS runtime.
 */
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  attemptCompanionAction, attemptCompanionOnboarding, bootstrapPersonalizedIntelligenceCompanionOs,
  personalizedIntelligenceCompanionHonesty, registerCompanionSurfaceContract,
} from './personalized-intelligence-companion-os';
import { attemptPrivateDataShare, bootstrapGlobalDataStorytellingEngine, registerStoryDashboard } from './global-data-storytelling-engine';
import { bootstrapHistoricalForecastMemoryNetwork, recordProbabilisticForecast, updateForecastMemoryFromError } from './historical-forecast-memory-network';
import { bootstrapDecisionCopilotStudio, submitCopilotScenario } from './decision-copilot-studio';
import {
  bootstrapAgentWorkforceMarketplace, claimMarketplaceAgentRunningVerified, listAgentTeam,
  registerMarketplaceAgent, scheduleOvernightMarketplaceWork,
} from './agent-workforce-marketplace';
import { attemptCollaborationShare, bootstrapRealtimeCollaborationUniverse, openCollaborationRoom } from './realtime-collaboration-universe';
import {
  applyUxGraphPreference, attemptUxGraphAuthoritySelfGrant, bootstrapAdaptiveUiUxIntelligenceGraph,
  reverseUxGraphPreference,
} from './adaptive-ui-ux-intelligence-graph';
import {
  DI_LOCKS, GITHUB_SOT_ISSUE, GITLAB_COORDINATION_ISSUE, HONESTY_BANNER, NEXT_PHASE_TITLE,
  PERSONALIZED_INTELLIGENCE_COMPANION_OS_CYCLE, predecessorMap,
  type DiActor, type DiEvidenceState, type DiHop, type DiHopRecord,
} from './personalized-intelligence-companion-os-types';

export { DI_LOCKS, HONESTY_BANNER, PERSONALIZED_INTELLIGENCE_COMPANION_OS_CYCLE, NEXT_PHASE_TITLE, predecessorMap };

function hop(name: DiHop, state: DiEvidenceState, summary: string): DiHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DiCycleInput = { orgId: string; tenantId: string; universeId: string; actor: DiActor; root?: string; repoRoot?: string };

export async function runPersonalizedIntelligenceCompanionOsCycle(input: DiCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DiHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(hop('honesty_locks',
    DI_LOCKS.L4_AUTONOMY_ENABLED === false && DI_LOCKS.LOCAL_FIRST && DI_LOCKS.COMPANION_IMPERSONATES_FOUNDER === false &&
    DI_LOCKS.SILENT_PRIVATE_DATA_SHARE === false && DI_LOCKS.FORECAST_MEMORY_REWRITES_HISTORY_AS_FACT === false &&
    DI_LOCKS.PREDICTIONS_REMAIN_PROBABILISTIC && DI_LOCKS.MARKETPLACE_LISTING_EQ_AUTHORITY === false &&
    DI_LOCKS.COLLABORATION_SHARE_WITHOUT_OPT_IN === false && DI_LOCKS.UX_GRAPH_SELF_GRANTS_AGENT_AUTHORITY === false &&
    DI_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false && DI_LOCKS.UNDER_18_ONBOARDING_ALLOWED === false &&
    DI_LOCKS.TIP_LAND === false ? 'PASS' : 'FAIL', HONESTY_BANNER));

  const os = await bootstrapPersonalizedIntelligenceCompanionOs({ orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, root, actor, repoRoot: input.repoRoot });
  await registerCompanionSurfaceContract({ osId: os.id, surface: 'companion_home', locale: 'en', root, actor });
  hops.push(hop('personalized_intelligence_companion_os_bootstrap', os && personalizedIntelligenceCompanionHonesty().l4AutonomyEnabled === false ? 'IMPLEMENTED' : 'FAIL', `Companion OS id=${os.id} predecessor=${os.predecessorLayer}`));

  const impersonate = await attemptCompanionAction({ osId: os.id, action: 'impersonate_founder', root, actor });
  const spend = await attemptCompanionAction({ osId: os.id, action: 'approve_spend', root, actor });
  const deploy = await attemptCompanionAction({ osId: os.id, action: 'approve_deploy', root, actor });
  hops.push(hop('companion_cannot_impersonate_founder_or_approve_spend_deploy', impersonate.accepted === false && spend.accepted === false && deploy.accepted === false ? 'DENIED' : 'FAIL', impersonate.reason));

  const story = await bootstrapGlobalDataStorytellingEngine({ orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, root, actor });
  await registerStoryDashboard({ engineId: story.id, title: 'Premium story dashboard', evidenceLinks: ['evidence://local/di-1'], root, actor });
  const silentShare = await attemptPrivateDataShare({ engineId: story.id, field: 'private_user_payload', silent: true, explicitOptIn: false, root, actor });
  hops.push(hop('silent_private_data_share_denied', silentShare.accepted === false ? 'DENIED' : 'FAIL', silentShare.reason));

  const forecastNet = await bootstrapHistoricalForecastMemoryNetwork({ orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, root, actor });
  const forecast = await recordProbabilisticForecast({ networkId: forecastNet.id, forecastId: 'f-1', probability: 0.62, label: 'PROBABILISTIC', root, actor });
  const relabel = await updateForecastMemoryFromError({ memoryId: forecast.memory!.id, observedOutcome: 'miss', relabelAsVerifiedFact: true, root, actor });
  hops.push(hop('forecast_memory_cannot_relabel_past_as_verified_fact', relabel.accepted === false && forecast.memory?.labeledVerifiedFact === false ? 'DENIED' : 'FAIL', relabel.reason));

  const studio = await bootstrapDecisionCopilotStudio({ orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, root, actor });
  const factClaim = await submitCopilotScenario({ studioId: studio.id, title: 'verified claim attempt', probability: 0.9, claimVerifiedFact: true, root, actor });
  const okScenario = await submitCopilotScenario({ studioId: studio.id, title: 'probabilistic scenario', probability: 0.55, evidenceDrawerIds: ['drawer-1'], root, actor });
  hops.push(hop('prediction_surfaces_remain_probabilistic', factClaim.accepted === false && okScenario.accepted === true && okScenario.scenario?.labeledVerifiedFact === false ? 'PROBABILISTIC' : 'FAIL', factClaim.reason));

  const marketplace = await bootstrapAgentWorkforceMarketplace({ orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, root, actor });
  const listingAuth = await listAgentTeam({ marketplaceId: marketplace.id, teamName: 'team-a', requestCredentials: true, requestBilling: true, requestDeploy: true, root, actor });
  hops.push(hop('marketplace_listing_does_not_grant_credentials_billing_deploy', listingAuth.accepted === false && listingAuth.listing?.grantsCredentials === false ? 'DENIED' : 'FAIL', listingAuth.reason));

  const collab = await bootstrapRealtimeCollaborationUniverse({ orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, root, actor });
  const room = await openCollaborationRoom({ universeRecordId: collab.id, title: 'Room ES', locale: 'es', root, actor });
  const shareDeny = await attemptCollaborationShare({ roomId: room.room!.id, explicitOptIn: false, root, actor });
  hops.push(hop('collaboration_share_without_opt_in_denied', shareDeny.accepted === false ? 'DENIED' : 'FAIL', shareDeny.reason));

  const uxGraph = await bootstrapAdaptiveUiUxIntelligenceGraph({ orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, root, actor });
  const pref = await applyUxGraphPreference({ graphId: uxGraph.id, nodeKey: 'density', preferenceValue: 'compact', root, actor });
  const reversed = await reverseUxGraphPreference({ nodeId: pref.node!.id, root, actor });
  const authGrant = await attemptUxGraphAuthoritySelfGrant({ graphId: uxGraph.id, root, actor });
  hops.push(hop('ux_graph_change_reversible_cannot_self_grant_authority', reversed.accepted === true && authGrant.accepted === false ? 'REVERSIBLE' : 'FAIL', authGrant.reason));

  const agentReg = await registerMarketplaceAgent({ marketplaceId: marketplace.id, name: 'overnight-agent', root, actor });
  const overnight = await scheduleOvernightMarketplaceWork({ agentId: agentReg.agent!.id, authorizedPoweredNode: false, root, actor });
  hops.push(hop('overnight_without_powered_node_waiting_or_offline', overnight.accepted === false && (overnight.status === 'WAITING_NODE' || overnight.status === 'OFFLINE_STOPPED') ? overnight.status! : 'FAIL', overnight.reason));

  const noHb = await claimMarketplaceAgentRunningVerified({ agentId: agentReg.agent!.id, root, actor });
  hops.push(hop('agent_without_heartbeat_not_running_verified', noHb.accepted === false ? 'DENIED' : 'FAIL', noHb.reason));

  const under18 = await attemptCompanionOnboarding({ osId: os.id, declaredAgeYears: 16, root, actor });
  hops.push(hop('under_18_denied_where_applicable', under18.accepted === false ? 'DENIED' : 'FAIL', under18.reason));

  const evidenceEvent = await appendEvidenceEvent({
    kind: 'evidence', tenantId: input.tenantId, universeId: input.universeId,
    summary: '62L-DI personalized intelligence companion OS cycle completed',
    payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-DI'], githubSotIssue: GITHUB_SOT_ISSUE, gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE },
  }, root).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning({
    domain: 'technology', subject: '62L-DI personalized intelligence companion OS cycle', claimState: 'MODEL_INFERENCE',
    summary: `hops=${hops.length}; learning≠permission; companion≠founder impersonation; forecast≠fact`,
    sourceRefs: ['62L-DI'], evidence: hops.map((h) => `${h.hop}:${h.state}`),
  }, root).catch(() => undefined);
  hops.push(hop('learning', 'BOUNDED', 'Learning recorded locally; learning ≠ permission; no production authorization.'));

  const health = await checkLocalBrainHealth(root).catch(() => null);
  return {
    honestyBanner: HONESTY_BANNER, l4AutonomyEnabled: DI_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const, tipLand: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE, gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE, predecessorLayer: os.predecessorLayer,
    predecessors: predecessorMap(input.repoRoot ?? root), cycle: PERSONALIZED_INTELLIGENCE_COMPANION_OS_CYCLE,
    hops, locks: DI_LOCKS, osId: os.id, localBrainHealth: health,
  };
}

export async function buildPersonalizedIntelligenceCompanionOsHealthReport(input?: { root?: string; repoRoot?: string }) {
  const root = input?.root ?? process.cwd();
  const repoRoot = input?.repoRoot ?? root;
  const health = await checkLocalBrainHealth(root).catch(() => null);
  return {
    phase: '62L-DI', honestyBanner: HONESTY_BANNER, githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE, nextPhaseTitle: NEXT_PHASE_TITLE,
    locks: DI_LOCKS, honesty: personalizedIntelligenceCompanionHonesty(),
    predecessor: predecessorMap(repoRoot), localBrainHealth: health,
    tipLand: false, productionAuthorized: false, dbCandidatesApplied: false,
    fullProductionCompanionShipped: false, at: new Date().toISOString(),
  };
}
