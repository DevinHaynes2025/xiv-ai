import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptCompanionAction, attemptCompanionOnboarding, bootstrapPersonalizedIntelligenceCompanionOs,
  personalizedIntelligenceCompanionHonesty, registerCompanionSurfaceContract,
} from './personalized-intelligence-companion-os';
import {
  attemptPrivateDataShare, bootstrapGlobalDataStorytellingEngine, globalDataStorytellingHonesty, registerStoryDashboard,
} from './global-data-storytelling-engine';
import {
  bootstrapHistoricalForecastMemoryNetwork, historicalForecastMemoryHonesty, recordProbabilisticForecast, updateForecastMemoryFromError,
} from './historical-forecast-memory-network';
import { bootstrapDecisionCopilotStudio, decisionCopilotStudioHonesty, submitCopilotScenario } from './decision-copilot-studio';
import {
  agentWorkforceMarketplaceHonesty, bootstrapAgentWorkforceMarketplace, claimMarketplaceAgentRunningVerified,
  listAgentTeam, marketplaceWorkforceSurfaceStatus, recordMarketplaceAgentHeartbeat, registerMarketplaceAgent,
  scheduleOvernightMarketplaceWork,
} from './agent-workforce-marketplace';
import {
  attemptCollaborationOnboarding, attemptCollaborationShare, bootstrapRealtimeCollaborationUniverse,
  openCollaborationRoom, realtimeCollaborationUniverseHonesty,
} from './realtime-collaboration-universe';
import {
  adaptiveUiUxIntelligenceGraphHonesty, applyUxGraphPreference, attemptUxGraphAuthoritySelfGrant,
  bootstrapAdaptiveUiUxIntelligenceGraph, reverseUxGraphPreference,
} from './adaptive-ui-ux-intelligence-graph';
import {
  COLLABORATION_OPT_IN_REQUIRED_DENIED, COMPANION_FOUNDER_IMPERSONATION_DENIED, DI_LOCKS,
  FORECAST_MEMORY_RELABEL_DENIED, HONESTY_BANNER, MARKETPLACE_AUTHORITY_DENIED, NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED, OVERNIGHT_NO_POWERED_NODE, PERSONALIZED_INTELLIGENCE_COMPANION_OS_CYCLE,
  PREDICTION_MUST_REMAIN_PROBABILISTIC, SILENT_PRIVATE_DATA_SHARE_DENIED, UNDER_18_DENIED,
  UX_GRAPH_AUTHORITY_SELF_GRANT_DENIED, predecessorMap, type DiActor,
} from './personalized-intelligence-companion-os-types';
import {
  buildPersonalizedIntelligenceCompanionOsHealthReport, runPersonalizedIntelligenceCompanionOsCycle,
} from './personalized-intelligence-companion-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldi-'));
const failures: string[] = [];
function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}
const actor: DiActor = {
  kind: 'companion_os_curator', id: 'curator-di-1', orgId: 'org-di', tenantId: 'tenant-di',
  universeId: 'univ-di', role: 'curator', permissionLevel: 1, authorityLevel: 0,
};

try {
  check('US-DI1-cycle', PERSONALIZED_INTELLIGENCE_COMPANION_OS_CYCLE.join(' → ') ===
    'honesty_locks → personalized_intelligence_companion_os_bootstrap → companion_cannot_impersonate_founder_or_approve_spend_deploy → silent_private_data_share_denied → forecast_memory_cannot_relabel_past_as_verified_fact → prediction_surfaces_remain_probabilistic → marketplace_listing_does_not_grant_credentials_billing_deploy → collaboration_share_without_opt_in_denied → ux_graph_change_reversible_cannot_self_grant_authority → overnight_without_powered_node_waiting_or_offline → agent_without_heartbeat_not_running_verified → under_18_denied_where_applicable → evidence → learning',
    'Personalized Intelligence Companion OS cycle recorded in order.');

  check('US-DI-locks',
    DI_LOCKS.L4_AUTONOMY_ENABLED === false && DI_LOCKS.COMPANION_IMPERSONATES_FOUNDER === false &&
    DI_LOCKS.SILENT_PRIVATE_DATA_SHARE === false && DI_LOCKS.FORECAST_MEMORY_REWRITES_HISTORY_AS_FACT === false &&
    DI_LOCKS.PREDICTIONS_REMAIN_PROBABILISTIC === true && DI_LOCKS.MARKETPLACE_LISTING_GRANTS_CREDENTIALS === false &&
    DI_LOCKS.COLLABORATION_SHARE_WITHOUT_OPT_IN === false && DI_LOCKS.UX_GRAPH_SELF_GRANTS_AGENT_AUTHORITY === false &&
    DI_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false && DI_LOCKS.UNDER_18_ONBOARDING_ALLOWED === false &&
    DI_LOCKS.LIVE_SUPABASE_APPLY === false && DI_LOCKS.TIP_LAND === false, HONESTY_BANNER);

  check('US-DI-honesty-surfaces',
    personalizedIntelligenceCompanionHonesty().l4AutonomyEnabled === false &&
    personalizedIntelligenceCompanionHonesty().companionImpersonatesFounder === false &&
    globalDataStorytellingHonesty().silentPrivateDataShare === false &&
    historicalForecastMemoryHonesty().predictionsRemainProbabilistic === true &&
    decisionCopilotStudioHonesty().recommendationEqDeploy === false &&
    agentWorkforceMarketplaceHonesty().marketplaceListingEqAuthority === false &&
    realtimeCollaborationUniverseHonesty().communityOptInRequired === true &&
    adaptiveUiUxIntelligenceGraphHonesty().learningGrantsPermission === false,
    'Subsystem honesty surfaces deny-by-default.');

  check('US-DI-next-title', NEXT_PHASE_TITLE.startsWith('62L-DJ —'), NEXT_PHASE_TITLE);

  const preds = predecessorMap(repoRoot);
  check('US-DI-predecessor-DF-or-better',
    preds.DF.tipProbe === 'PRESENT' || preds.DH.tipProbe === 'PRESENT' || preds.DG.tipProbe === 'PRESENT' ||
    preds.DE.tipProbe === 'PRESENT' || preds.CY.tipProbe === 'PRESENT',
    `DH=${preds.DH.tipProbe}/${preds.DH.report}; DG=${preds.DG.tipProbe}/${preds.DG.report}; DF=${preds.DF.tipProbe}/${preds.DF.report}`);

  const os = await bootstrapPersonalizedIntelligenceCompanionOs({
    orgId: actor.orgId, tenantId: actor.tenantId, universeId: actor.universeId, root, actor, repoRoot,
  });
  await registerCompanionSurfaceContract({ osId: os.id, surface: 'decision_copilot', locale: 'en', root, actor });
  check('US-DI-predecessor-soft-wire',
    os.predecessorLayer === 'DF' || os.predecessorLayer === 'DG' || os.predecessorLayer === 'DH' || os.predecessorLayer === 'DE',
    `predecessorLayer=${os.predecessorLayer}`);

  const imp = await attemptCompanionAction({ osId: os.id, action: 'impersonate_founder', root, actor });
  const spend = await attemptCompanionAction({ osId: os.id, action: 'approve_spend', root, actor });
  const deploy = await attemptCompanionAction({ osId: os.id, action: 'approve_deploy', root, actor });
  const recommend = await attemptCompanionAction({ osId: os.id, action: 'recommend', root, actor });
  check('US-DI-companion-cannot-impersonate-founder-or-approve-spend-deploy',
    imp.accepted === false && spend.accepted === false && deploy.accepted === false && recommend.accepted === true &&
    recommend.attempt?.recommendationOnly === true && imp.reason === COMPANION_FOUNDER_IMPERSONATION_DENIED, imp.reason);

  const story = await bootstrapGlobalDataStorytellingEngine({ orgId: actor.orgId, tenantId: actor.tenantId, universeId: actor.universeId, root, actor });
  await registerStoryDashboard({ engineId: story.id, title: 'Global story', evidenceLinks: ['ev://1'], root, actor });
  const silent = await attemptPrivateDataShare({ engineId: story.id, field: 'sealed_personal_data', silent: true, explicitOptIn: false, root, actor });
  check('US-DI-silent-private-data-share-denied', silent.accepted === false && silent.reason === SILENT_PRIVATE_DATA_SHARE_DENIED, silent.reason);

  const fnet = await bootstrapHistoricalForecastMemoryNetwork({ orgId: actor.orgId, tenantId: actor.tenantId, universeId: actor.universeId, root, actor });
  const recorded = await recordProbabilisticForecast({ networkId: fnet.id, forecastId: 'fx-1', probability: 0.7, label: 'PROBABILISTIC', root, actor });
  const relabel = await updateForecastMemoryFromError({ memoryId: recorded.memory!.id, observedOutcome: 'error', relabelAsVerifiedFact: true, root, actor });
  const learnOk = await updateForecastMemoryFromError({ memoryId: recorded.memory!.id, observedOutcome: 'miss_calibrated', relabelAsVerifiedFact: false, root, actor });
  check('US-DI-forecast-memory-cannot-relabel-past-as-verified-fact',
    recorded.accepted === true && recorded.memory?.originalLabel === 'PROBABILISTIC' && recorded.memory?.labeledVerifiedFact === false &&
    relabel.accepted === false && relabel.reason === FORECAST_MEMORY_RELABEL_DENIED && learnOk.accepted === true &&
    learnOk.memory?.historyRewrittenAsFact === false && learnOk.memory?.originalLabel === 'PROBABILISTIC' &&
    learnOk.memory?.labeledVerifiedFact === false, relabel.reason);

  const studio = await bootstrapDecisionCopilotStudio({ orgId: actor.orgId, tenantId: actor.tenantId, universeId: actor.universeId, root, actor });
  const fact = await submitCopilotScenario({ studioId: studio.id, title: 'as fact', probability: 0.99, claimVerifiedFact: true, root, actor });
  const okSc = await submitCopilotScenario({ studioId: studio.id, title: 'probabilistic', probability: 0.42, evidenceDrawerIds: ['d1'], root, actor });
  const factForecast = await recordProbabilisticForecast({ networkId: fnet.id, forecastId: 'fx-fact', probability: 0.8, claimVerifiedFact: true, root, actor });
  check('US-DI-prediction-surfaces-remain-probabilistic',
    fact.accepted === false && fact.reason === PREDICTION_MUST_REMAIN_PROBABILISTIC && okSc.accepted === true &&
    okSc.scenario?.labeledVerifiedFact === false && okSc.scenario?.label === 'LABELED_SCENARIO' && factForecast.accepted === false, fact.reason);

  const market = await bootstrapAgentWorkforceMarketplace({ orgId: actor.orgId, tenantId: actor.tenantId, universeId: actor.universeId, root, actor });
  const badList = await listAgentTeam({ marketplaceId: market.id, teamName: 'ops-team', requestCredentials: true, requestBilling: true, requestDeploy: true, root, actor });
  const goodList = await listAgentTeam({ marketplaceId: market.id, teamName: 'ops-team-ok', root, actor });
  check('US-DI-marketplace-listing-no-credentials-billing-deploy',
    badList.accepted === false && badList.reason === MARKETPLACE_AUTHORITY_DENIED && badList.listing?.grantsCredentials === false &&
    badList.listing?.grantsBilling === false && badList.listing?.grantsDeploy === false && goodList.accepted === true &&
    goodList.listing?.grantsAuthority === false, badList.reason);

  const collab = await bootstrapRealtimeCollaborationUniverse({ orgId: actor.orgId, tenantId: actor.tenantId, universeId: actor.universeId, root, actor });
  const room = await openCollaborationRoom({ universeRecordId: collab.id, title: 'Multilingual room', locale: 'fr', root, actor });
  const noOpt = await attemptCollaborationShare({ roomId: room.room!.id, explicitOptIn: false, root, actor });
  const withOpt = await attemptCollaborationShare({ roomId: room.room!.id, explicitOptIn: true, root, actor });
  check('US-DI-collaboration-share-without-opt-in-denied',
    noOpt.accepted === false && noOpt.reason === COLLABORATION_OPT_IN_REQUIRED_DENIED && withOpt.accepted === true, noOpt.reason);

  const graph = await bootstrapAdaptiveUiUxIntelligenceGraph({ orgId: actor.orgId, tenantId: actor.tenantId, universeId: actor.universeId, root, actor });
  const pref = await applyUxGraphPreference({ graphId: graph.id, nodeKey: 'theme', preferenceValue: 'ocean', root, actor });
  const rev = await reverseUxGraphPreference({ nodeId: pref.node!.id, root, actor });
  const selfGrant = await attemptUxGraphAuthoritySelfGrant({ graphId: graph.id, root, actor });
  check('US-DI-ux-graph-reversible-cannot-self-grant-authority',
    pref.accepted === true && pref.node?.explainable === true && pref.node?.reversible === true &&
    rev.accepted === true && rev.node?.status === 'REVERSED' && selfGrant.accepted === false &&
    selfGrant.reason === UX_GRAPH_AUTHORITY_SELF_GRANT_DENIED, selfGrant.reason);

  const agent = await registerMarketplaceAgent({ marketplaceId: market.id, name: 'night-worker', root, actor });
  const overnight = await scheduleOvernightMarketplaceWork({ agentId: agent.agent!.id, authorizedPoweredNode: false, root, actor });
  check('US-DI-overnight-without-powered-node-waiting-or-offline',
    overnight.accepted === false && overnight.reason === OVERNIGHT_NO_POWERED_NODE &&
    (overnight.status === 'WAITING_NODE' || overnight.status === 'OFFLINE_STOPPED'), `${overnight.reason}/${overnight.status}`);

  const noHb = await claimMarketplaceAgentRunningVerified({ agentId: agent.agent!.id, root, actor });
  const surfaceNoHb = marketplaceWorkforceSurfaceStatus(noHb.agent!);
  await recordMarketplaceAgentHeartbeat({ agentId: agent.agent!.id, runtimeEvidence: 'runtime-ok', root, actor });
  const withHb = await claimMarketplaceAgentRunningVerified({ agentId: agent.agent!.id, root, actor });
  check('US-DI-missing-heartbeat-not-running-verified',
    noHb.accepted === false && noHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED && surfaceNoHb !== 'RUNNING_VERIFIED' &&
    withHb.accepted === true && withHb.agent?.status === 'RUNNING_VERIFIED', noHb.reason);

  const under18 = await attemptCompanionOnboarding({ osId: os.id, declaredAgeYears: 15, root, actor });
  const adult = await attemptCompanionOnboarding({ osId: os.id, declaredAgeYears: 22, root, actor });
  const collabUnder18 = await attemptCollaborationOnboarding({ universeRecordId: collab.id, declaredAgeYears: 17, root, actor });
  check('US-DI-under-18-denied',
    under18.accepted === false && under18.reason === UNDER_18_DENIED && adult.accepted === true && collabUnder18.accepted === false,
    under18.reason);

  const cycle = await runPersonalizedIntelligenceCompanionOsCycle({
    orgId: actor.orgId, tenantId: actor.tenantId, universeId: `${actor.universeId}-cycle`,
    actor: { ...actor, universeId: `${actor.universeId}-cycle` }, root, repoRoot,
  });
  check('US-DI-cycle-health-sot',
    cycle.githubSotIssue === 126 && cycle.gitlabCoordinationIssue === 60 &&
    cycle.hops.length === PERSONALIZED_INTELLIGENCE_COMPANION_OS_CYCLE.length &&
    cycle.tipLand === false && cycle.productionAuthorized === false,
    `hops=${cycle.hops.length}; SoT=#${cycle.githubSotIssue}/#${cycle.gitlabCoordinationIssue}`);

  const health = await buildPersonalizedIntelligenceCompanionOsHealthReport({ root: repoRoot, repoRoot });
  check('US-DI-health-report',
    health.phase === '62L-DI' && health.githubSotIssue === 126 && health.tipLand === false && health.dbCandidatesApplied === false,
    health.honestyBanner);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log('OK 62L-DI personalized intelligence companion OS tests passed');
