import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptPermissionGrant,
  bootstrapPersonalIntelligenceCommandOs,
  personalIntelligenceCommandOsHonesty,
  registerCommandSurface,
  scheduleOvernightWork,
} from './personal-intelligence-command-os';
import {
  claimCommandNodeRunningVerified,
  commandRuntimeNodeHonesty,
  recordCommandNodeHeartbeat,
  registerCommandRuntimeNode,
} from './personal-intelligence-command-runtime-nodes';
import {
  bootstrapPredictiveStorylineEngine,
  predictiveStorylineEngineHonesty,
  publishStorylineCard,
} from './predictive-storyline-engine';
import {
  bootstrapHistoricalPatternMemoryCortex,
  historicalPatternMemoryCortexHonesty,
  recordHistoricalPattern,
} from './historical-pattern-memory-cortex';
import {
  bootstrapDecisionScenarioControlTower,
  decisionScenarioControlTowerHonesty,
  submitScenarioRecommendation,
} from './decision-scenario-control-tower';
import {
  agentTeamOperatingMarketplaceHonesty,
  bootstrapAgentTeamOperatingMarketplace,
  listAgentTeam,
} from './agent-team-operating-marketplace';
import {
  attemptCrossTenantShare,
  bootstrapGlobalCollaborationKnowledgeRooms,
  globalCollaborationKnowledgeRoomsHonesty,
  openCollaborationRoom,
} from './global-collaboration-knowledge-rooms';
import {
  bootstrapContinuousProductExperienceLearningFabric,
  continuousProductExperienceLearningFabricHonesty,
  proposeUxImprovement,
  reverseUxImprovement,
} from './continuous-product-experience-learning-fabric';
import {
  COLLABORATION_OPT_IN_DENIED,
  CONTROL_TOWER_ACTION_DENIED,
  DJ_LOCKS,
  FABRICATED_RUNNING_VERIFIED_DENIED,
  GUARANTEED_PREDICTION_REJECTED,
  HONESTY_BANNER,
  MARKETPLACE_LISTING_AUTHORITY_DENIED,
  NEXT_PHASE_TITLE,
  PATTERN_CAUSATION_AUTO_PROMOTE_DENIED,
  PERSONAL_INTELLIGENCE_COMMAND_OS_CYCLE,
  RAW_PRIVATE_CROSS_TENANT_DENIED,
  SILENT_PERMISSION_INHERITANCE_DENIED,
  UX_SELF_GRANT_DENIED,
  predecessorMap,
  type DjActor,
} from './personal-intelligence-command-os-types';
import {
  buildPersonalIntelligenceCommandOsHealthReport,
  runPersonalIntelligenceCommandOsCycle,
} from './personal-intelligence-command-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldj-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DjActor = {
  kind: 'command_os_curator',
  id: 'curator-dj-1',
  orgId: 'org-dj',
  tenantId: 'tenant-dj',
  universeId: 'univ-dj',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DJ1-cycle',
    PERSONAL_INTELLIGENCE_COMMAND_OS_CYCLE.join(' → ') ===
      'honesty_locks → personal_intelligence_command_os_bootstrap → fabricated_running_verified_without_heartbeat_denied → silent_permission_inheritance_denied → guaranteed_prediction_claim_rejected → raw_private_cross_tenant_share_denied → overnight_without_powered_node_waiting_or_stopped → storyline_card_probabilistic_evidence_linked → pattern_memory_no_auto_causation_promotion → marketplace_listing_not_credentials_billing_deploy → ux_improvement_proposal_reversible_no_self_grant → collaboration_without_opt_in_denied → control_tower_recommendation_not_charge_deploy_publish → evidence → learning',
    'Personal Intelligence Command OS cycle recorded in order.',
  );

  check(
    'US-DJ-locks',
    DJ_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DJ_LOCKS.SILENT_PERMISSION_INHERITANCE === false &&
      DJ_LOCKS.GUARANTEED_PREDICTION_CLAIMS === false &&
      DJ_LOCKS.RAW_PRIVATE_CROSS_TENANT_SHARE === false &&
      DJ_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      DJ_LOCKS.FABRICATED_RUNTIME_STATE === false &&
      DJ_LOCKS.PATTERN_AUTO_PROMOTES_TO_CAUSATION === false &&
      DJ_LOCKS.MARKETPLACE_LISTING_GRANTS_CREDENTIALS === false &&
      DJ_LOCKS.MARKETPLACE_LISTING_GRANTS_BILLING === false &&
      DJ_LOCKS.MARKETPLACE_LISTING_GRANTS_DEPLOY === false &&
      DJ_LOCKS.UX_LEARNING_SELF_GRANTS_AUTHORITY === false &&
      DJ_LOCKS.COLLABORATION_WITHOUT_OPT_IN === false &&
      DJ_LOCKS.CONTROL_TOWER_RECOMMENDATION_CHARGES === false &&
      DJ_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DJ_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DJ-honesty-surfaces',
    personalIntelligenceCommandOsHonesty().l4AutonomyEnabled === false &&
      commandRuntimeNodeHonesty().runningVerifiedWithoutHeartbeat === false &&
      predictiveStorylineEngineHonesty().guaranteedPredictionClaims === false &&
      historicalPatternMemoryCortexHonesty().patternAutoPromotesToCausation === false &&
      decisionScenarioControlTowerHonesty().recommendationOnly === true &&
      agentTeamOperatingMarketplaceHonesty().listingIsListingOnly === true &&
      globalCollaborationKnowledgeRoomsHonesty().collaborationOptInRequired === true &&
      continuousProductExperienceLearningFabricHonesty().uxImprovementProposalsReversible ===
        true,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DJ-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DK —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DJ-predecessor-DF-or-better',
    preds.DF.tipProbe === 'PRESENT' ||
      preds.DI.tipProbe === 'PRESENT' ||
      preds.DH.tipProbe === 'PRESENT' ||
      preds.DG.tipProbe === 'PRESENT' ||
      preds.DE.tipProbe === 'PRESENT',
    `DI=${preds.DI.tipProbe}/${preds.DI.report}; DH=${preds.DH.tipProbe}/${preds.DH.report}; DG=${preds.DG.tipProbe}/${preds.DG.report}; DF=${preds.DF.tipProbe}/${preds.DF.report}`,
  );

  const os = await bootstrapPersonalIntelligenceCommandOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  await registerCommandSurface({
    osId: os.id,
    surface: 'storyline_feed',
    root,
    actor,
  });

  // Fabricated RUNNING_VERIFIED without heartbeat DENIED
  const node = await registerCommandRuntimeNode({
    osId: os.id,
    name: 'node-a',
    root,
    actor,
  });
  const fabricated = await claimCommandNodeRunningVerified({
    nodeId: node.node!.id,
    fabricateWithoutHeartbeat: true,
    root,
    actor,
  });
  const noHb = await claimCommandNodeRunningVerified({
    nodeId: node.node!.id,
    root,
    actor,
  });
  await recordCommandNodeHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'hb-1',
    root,
    actor,
  });
  const withHb = await claimCommandNodeRunningVerified({
    nodeId: node.node!.id,
    root,
    actor,
  });
  check(
    'US-DJ-fabricated-running-verified-without-heartbeat-denied',
    fabricated.accepted === false &&
      fabricated.reason === FABRICATED_RUNNING_VERIFIED_DENIED &&
      noHb.accepted === false &&
      withHb.accepted === true &&
      withHb.node?.status === 'RUNNING_VERIFIED',
    fabricated.reason,
  );

  // Silent permission inheritance DENIED
  const silent = await attemptPermissionGrant({
    osId: os.id,
    actorId: 'agent-x',
    inheritedFrom: 'ceo',
    silentInheritance: true,
    root,
    actor,
  });
  const explicit = await attemptPermissionGrant({
    osId: os.id,
    actorId: 'agent-y',
    explicitGrant: true,
    root,
    actor,
  });
  check(
    'US-DJ-silent-permission-inheritance-denied',
    silent.accepted === false &&
      silent.reason === SILENT_PERMISSION_INHERITANCE_DENIED &&
      explicit.accepted === true,
    silent.reason,
  );

  // Guaranteed prediction claim REJECTED
  const feed = await bootstrapPredictiveStorylineEngine({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const guaranteed = await publishStorylineCard({
    feedId: feed.id,
    title: 'sure thing',
    claimGuaranteed: true,
    root,
    actor,
  });
  const certain = await publishStorylineCard({
    feedId: feed.id,
    title: 'certain',
    labelAsCertain: true,
    evidenceIds: ['e1'],
    root,
    actor,
  });
  check(
    'US-DJ-guaranteed-prediction-claim-rejected',
    guaranteed.accepted === false &&
      guaranteed.reason === GUARANTEED_PREDICTION_REJECTED &&
      certain.accepted === false,
    guaranteed.reason,
  );

  // Raw private cross-tenant share DENIED
  const collab = await bootstrapGlobalCollaborationKnowledgeRooms({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const room = await openCollaborationRoom({
    fabricId: collab.id,
    name: 'knowledge-room',
    participantIds: ['a', 'b'],
    participantsOptedIn: ['a', 'b'],
    root,
    actor,
  });
  const rawShare = await attemptCrossTenantShare({
    roomId: room.room!.id,
    fromTenantId: actor.tenantId,
    toTenantId: 'tenant-other',
    rawPrivatePayload: true,
    payloadFields: ['raw_private_payload'],
    optInConfirmed: true,
    root,
    actor,
  });
  check(
    'US-DJ-raw-private-cross-tenant-share-denied',
    rawShare.accepted === false && rawShare.reason === RAW_PRIVATE_CROSS_TENANT_DENIED,
    rawShare.reason,
  );

  // Overnight without powered node → WAITING_NODE or OFFLINE_STOPPED
  const overnightOff = await scheduleOvernightWork({
    osId: os.id,
    poweredNodePresent: false,
    authorizedPoweredNode: false,
    root,
    actor,
  });
  const overnightWait = await scheduleOvernightWork({
    osId: os.id,
    poweredNodePresent: true,
    authorizedPoweredNode: false,
    root,
    actor,
  });
  const overnightOk = await scheduleOvernightWork({
    osId: os.id,
    poweredNodePresent: true,
    authorizedPoweredNode: true,
    root,
    actor,
  });
  check(
    'US-DJ-overnight-without-powered-node',
    overnightOff.status === 'OFFLINE_STOPPED' &&
      overnightWait.status === 'WAITING_NODE' &&
      overnightOk.status === 'SCHEDULED' &&
      overnightOk.accepted === true,
    `${overnightOff.status}/${overnightWait.status}/${overnightOk.status}`,
  );

  // Storyline card remains probabilistic / evidence-linked
  const story = await publishStorylineCard({
    feedId: feed.id,
    title: 'likely path',
    probability: 0.61,
    evidenceIds: ['ev-story-1'],
    root,
    actor,
  });
  check(
    'US-DJ-storyline-card-probabilistic-evidence-linked',
    story.accepted === true &&
      story.card?.label === 'PROBABILISTIC' &&
      story.card.claimGuaranteed === false &&
      story.card.evidenceIds.length > 0 &&
      story.card.probability === 0.61,
    story.reason,
  );

  // Pattern memory does not auto-promote correlation to verified causation
  const cortex = await bootstrapHistoricalPatternMemoryCortex({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const promote = await recordHistoricalPattern({
    cortexId: cortex.id,
    patternSummary: 'A then B',
    provenanceIds: ['p1'],
    autoPromoteToVerifiedCausation: true,
    root,
    actor,
  });
  const recorded = await recordHistoricalPattern({
    cortexId: cortex.id,
    patternSummary: 'A correlates B',
    provenanceIds: ['p2'],
    root,
    actor,
  });
  check(
    'US-DJ-pattern-memory-no-auto-causation-promotion',
    promote.accepted === false &&
      promote.reason === PATTERN_CAUSATION_AUTO_PROMOTE_DENIED &&
      recorded.accepted === true &&
      recorded.entry?.claimStatus === 'CORRELATION_ONLY',
    promote.reason,
  );

  // Marketplace listing ≠ credentials/billing/deploy
  const marketplace = await bootstrapAgentTeamOperatingMarketplace({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const listingAuth = await listAgentTeam({
    marketplaceId: marketplace.id,
    teamName: 'ops-team',
    requestCredentials: true,
    requestBilling: true,
    requestDeploy: true,
    root,
    actor,
  });
  const listingOk = await listAgentTeam({
    marketplaceId: marketplace.id,
    teamName: 'ops-team-listed',
    root,
    actor,
  });
  check(
    'US-DJ-marketplace-listing-not-authority',
    listingAuth.accepted === false &&
      listingAuth.reason === MARKETPLACE_LISTING_AUTHORITY_DENIED &&
      listingOk.accepted === true &&
      listingOk.listing?.grantsCredentials === false &&
      listingOk.listing?.grantsBilling === false &&
      listingOk.listing?.grantsDeploy === false,
    listingAuth.reason,
  );

  // UX improvement proposal reversible; cannot self-grant authority
  const ux = await bootstrapContinuousProductExperienceLearningFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const selfGrant = await proposeUxImprovement({
    fabricId: ux.id,
    summary: 'grant me admin',
    consentedFeedback: true,
    selfGrantAuthority: true,
    root,
    actor,
  });
  const proposal = await proposeUxImprovement({
    fabricId: ux.id,
    summary: 'simplify command home',
    consentedFeedback: true,
    root,
    actor,
  });
  const reversed = await reverseUxImprovement({
    proposalId: proposal.proposal!.id,
    root,
    actor,
  });
  check(
    'US-DJ-ux-proposal-reversible-no-self-grant',
    selfGrant.accepted === false &&
      selfGrant.reason === UX_SELF_GRANT_DENIED &&
      proposal.accepted === true &&
      proposal.proposal?.reversible === true &&
      reversed.accepted === true &&
      reversed.proposal?.status === 'REVERSED',
    `${selfGrant.reason}; ${reversed.reason}`,
  );

  // Collaboration without opt-in DENIED
  const noOptIn = await openCollaborationRoom({
    fabricId: collab.id,
    name: 'forced-room',
    participantIds: ['c'],
    skipOptIn: true,
    root,
    actor,
  });
  check(
    'US-DJ-collaboration-without-opt-in-denied',
    noOptIn.accepted === false && noOptIn.reason === COLLABORATION_OPT_IN_DENIED,
    noOptIn.reason,
  );

  // Control tower recommendation ≠ charge/deploy/publish
  const tower = await bootstrapDecisionScenarioControlTower({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const action = await submitScenarioRecommendation({
    towerId: tower.id,
    scenarioId: 's1',
    recommendation: 'ship it',
    charge: true,
    deploy: true,
    publish: true,
    root,
    actor,
  });
  const recOnly = await submitScenarioRecommendation({
    towerId: tower.id,
    scenarioId: 's2',
    recommendation: 'consider path B',
    root,
    actor,
  });
  check(
    'US-DJ-control-tower-recommendation-not-side-effects',
    action.accepted === false &&
      action.reason === CONTROL_TOWER_ACTION_DENIED &&
      recOnly.accepted === true &&
      recOnly.recommendation?.label === 'RECOMMENDATION_ONLY',
    action.reason,
  );

  const cycle = await runPersonalIntelligenceCommandOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: 'univ-dj-cycle',
    actor: { ...actor, universeId: 'univ-dj-cycle' },
    root,
    repoRoot,
  });
  check(
    'US-DJ-cycle-ok',
    cycle.ok === true &&
      cycle.githubSotIssue === 127 &&
      cycle.gitlabCoordinationIssue === 61,
    `ok=${cycle.ok} hops=${cycle.hops.length}`,
  );

  const health = await buildPersonalIntelligenceCommandOsHealthReport({ root: repoRoot });
  check(
    'US-DJ-health-report',
    health.honestyBanner === HONESTY_BANNER &&
      health.githubSotIssue === 127 &&
      health.l4AutonomyEnabled === false,
    'Health report SoT citations (#127 / #61)',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DJ stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DJ Personal Intelligence Command OS denial stories');
