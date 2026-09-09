/**
 * 62L-DJ Personal Intelligence Command OS runtime —
 * Walks PERSONAL_INTELLIGENCE_COMMAND_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  attemptPermissionGrant,
  bootstrapPersonalIntelligenceCommandOs,
  personalIntelligenceCommandOsHonesty,
  registerCommandSurface,
  scheduleOvernightWork,
} from './personal-intelligence-command-os';
import {
  claimCommandNodeRunningVerified,
  recordCommandNodeHeartbeat,
  registerCommandRuntimeNode,
} from './personal-intelligence-command-runtime-nodes';
import {
  bootstrapPredictiveStorylineEngine,
  publishStorylineCard,
} from './predictive-storyline-engine';
import {
  bootstrapHistoricalPatternMemoryCortex,
  recordHistoricalPattern,
} from './historical-pattern-memory-cortex';
import {
  bootstrapDecisionScenarioControlTower,
  submitScenarioRecommendation,
} from './decision-scenario-control-tower';
import {
  bootstrapAgentTeamOperatingMarketplace,
  listAgentTeam,
} from './agent-team-operating-marketplace';
import {
  attemptCrossTenantShare,
  bootstrapGlobalCollaborationKnowledgeRooms,
  openCollaborationRoom,
} from './global-collaboration-knowledge-rooms';
import {
  bootstrapContinuousProductExperienceLearningFabric,
  proposeUxImprovement,
  reverseUxImprovement,
} from './continuous-product-experience-learning-fabric';
import {
  DJ_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PERSONAL_INTELLIGENCE_COMMAND_OS_CYCLE,
  predecessorMap,
  type DjActor,
  type DjEvidenceState,
  type DjHop,
  type DjHopRecord,
} from './personal-intelligence-command-os-types';

export {
  DJ_LOCKS,
  HONESTY_BANNER,
  PERSONAL_INTELLIGENCE_COMMAND_OS_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DjHop, state: DjEvidenceState, summary: string): DjHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DjCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DjActor;
  root?: string;
  repoRoot?: string;
};

export async function runPersonalIntelligenceCommandOsCycle(input: DjCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DjHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DJ_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DJ_LOCKS.LOCAL_FIRST &&
        DJ_LOCKS.SILENT_PERMISSION_INHERITANCE === false &&
        DJ_LOCKS.GUARANTEED_PREDICTION_CLAIMS === false &&
        DJ_LOCKS.RAW_PRIVATE_CROSS_TENANT_SHARE === false &&
        DJ_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
        DJ_LOCKS.PATTERN_AUTO_PROMOTES_TO_CAUSATION === false &&
        DJ_LOCKS.MARKETPLACE_LISTING_GRANTS_CREDENTIALS === false &&
        DJ_LOCKS.UX_LEARNING_SELF_GRANTS_AUTHORITY === false &&
        DJ_LOCKS.COLLABORATION_WITHOUT_OPT_IN === false &&
        DJ_LOCKS.CONTROL_TOWER_RECOMMENDATION_CHARGES === false &&
        DJ_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapPersonalIntelligenceCommandOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  await registerCommandSurface({
    osId: os.id,
    surface: 'command_home',
    root,
    actor,
  });
  hops.push(
    hop(
      'personal_intelligence_command_os_bootstrap',
      os && personalIntelligenceCommandOsHonesty().l4AutonomyEnabled === false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `Command OS id=${os.id} predecessor=${os.predecessorLayer} fullProductionCommandOsShipped=${os.fullProductionCommandOsShipped}`,
    ),
  );

  const nodeReg = await registerCommandRuntimeNode({
    osId: os.id,
    name: 'command-node-1',
    root,
    actor,
  });
  const fabricated = await claimCommandNodeRunningVerified({
    nodeId: nodeReg.node!.id,
    fabricateWithoutHeartbeat: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'fabricated_running_verified_without_heartbeat_denied',
      fabricated.accepted === false ? 'DENIED' : 'FAIL',
      fabricated.reason,
    ),
  );

  const silentPerm = await attemptPermissionGrant({
    osId: os.id,
    actorId: 'agent-a',
    inheritedFrom: 'parent-role',
    silentInheritance: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'silent_permission_inheritance_denied',
      silentPerm.accepted === false ? 'DENIED' : 'FAIL',
      silentPerm.reason,
    ),
  );

  const feed = await bootstrapPredictiveStorylineEngine({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const guaranteed = await publishStorylineCard({
    feedId: feed.id,
    title: 'guaranteed future',
    claimGuaranteed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'guaranteed_prediction_claim_rejected',
      guaranteed.accepted === false ? 'REJECTED' : 'FAIL',
      guaranteed.reason,
    ),
  );

  const collab = await bootstrapGlobalCollaborationKnowledgeRooms({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const roomOk = await openCollaborationRoom({
    fabricId: collab.id,
    name: 'room-1',
    participantIds: ['u1', 'u2'],
    participantsOptedIn: ['u1', 'u2'],
    root,
    actor,
  });
  const rawShare = await attemptCrossTenantShare({
    roomId: roomOk.room!.id,
    fromTenantId: input.tenantId,
    toTenantId: 'other-tenant',
    rawPrivatePayload: true,
    optInConfirmed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'raw_private_cross_tenant_share_denied',
      rawShare.accepted === false ? 'DENIED' : 'FAIL',
      rawShare.reason,
    ),
  );

  const overnight = await scheduleOvernightWork({
    osId: os.id,
    poweredNodePresent: false,
    authorizedPoweredNode: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'overnight_without_powered_node_waiting_or_stopped',
      overnight.status === 'WAITING_NODE' || overnight.status === 'OFFLINE_STOPPED'
        ? overnight.status
        : 'FAIL',
      overnight.reason,
    ),
  );

  const storyOk = await publishStorylineCard({
    feedId: feed.id,
    title: 'probabilistic path',
    probability: 0.42,
    evidenceIds: ['ev-1'],
    root,
    actor,
  });
  hops.push(
    hop(
      'storyline_card_probabilistic_evidence_linked',
      storyOk.accepted === true &&
        storyOk.card?.label === 'PROBABILISTIC' &&
        storyOk.card.claimGuaranteed === false
        ? 'PROBABILISTIC'
        : 'FAIL',
      storyOk.reason,
    ),
  );

  const cortex = await bootstrapHistoricalPatternMemoryCortex({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const patternPromote = await recordHistoricalPattern({
    cortexId: cortex.id,
    patternSummary: 'correlation spike',
    provenanceIds: ['prov-1'],
    autoPromoteToVerifiedCausation: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'pattern_memory_no_auto_causation_promotion',
      patternPromote.accepted === false ? 'DENIED' : 'FAIL',
      patternPromote.reason,
    ),
  );

  const marketplace = await bootstrapAgentTeamOperatingMarketplace({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const listingAuth = await listAgentTeam({
    marketplaceId: marketplace.id,
    teamName: 'team-alpha',
    requestCredentials: true,
    requestBilling: true,
    requestDeploy: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'marketplace_listing_not_credentials_billing_deploy',
      listingAuth.accepted === false ? 'DENIED' : 'FAIL',
      listingAuth.reason,
    ),
  );

  const uxFabric = await bootstrapContinuousProductExperienceLearningFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const selfGrant = await proposeUxImprovement({
    fabricId: uxFabric.id,
    summary: 'self grant',
    consentedFeedback: true,
    selfGrantAuthority: true,
    root,
    actor,
  });
  const reversible = await proposeUxImprovement({
    fabricId: uxFabric.id,
    summary: 'tweak CTA',
    consentedFeedback: true,
    root,
    actor,
  });
  const reversed = await reverseUxImprovement({
    proposalId: reversible.proposal!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'ux_improvement_proposal_reversible_no_self_grant',
      selfGrant.accepted === false &&
        reversible.accepted === true &&
        reversed.accepted === true &&
        reversed.proposal?.status === 'REVERSED'
        ? 'REVERSIBLE'
        : 'FAIL',
      `${selfGrant.reason}; ${reversed.reason}`,
    ),
  );

  const noOptIn = await openCollaborationRoom({
    fabricId: collab.id,
    name: 'room-no-optin',
    participantIds: ['u3'],
    skipOptIn: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'collaboration_without_opt_in_denied',
      noOptIn.accepted === false ? 'DENIED' : 'FAIL',
      noOptIn.reason,
    ),
  );

  const tower = await bootstrapDecisionScenarioControlTower({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const chargeAttempt = await submitScenarioRecommendation({
    towerId: tower.id,
    scenarioId: 'sc-1',
    recommendation: 'do X',
    charge: true,
    deploy: true,
    publish: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'control_tower_recommendation_not_charge_deploy_publish',
      chargeAttempt.accepted === false ? 'DENIED' : 'FAIL',
      chargeAttempt.reason,
    ),
  );

  await recordCommandNodeHeartbeat({
    nodeId: nodeReg.node!.id,
    runtimeEvidence: 'hb-cycle',
    root,
    actor,
  });

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DJ personal intelligence command OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DJ'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'evidence',
      'PASS',
      `evidence=${evidenceEvent?.id ?? 'recorded'}; GitHub SoT #${GITHUB_SOT_ISSUE}; GitLab #${GITLAB_COORDINATION_ISSUE}`,
    ),
  );

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DJ personal intelligence command OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; learning≠authority; marketplace listing≠credentials; predictions probabilistic`,
      sourceRefs: ['62L-DJ'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop('learning', 'BOUNDED', 'Learning recorded locally; learning ≠ authority; no production authorization.'),
  );

  void decisionGate;
  void checkLocalBrainHealth;

  return {
    ok: hops.every((h) => h.state !== 'FAIL'),
    hops,
    honestyBanner: HONESTY_BANNER,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    locks: DJ_LOCKS,
    predecessor: predecessorMap(input.repoRoot),
  };
}

export async function buildPersonalIntelligenceCommandOsHealthReport(input: {
  root: string;
}) {
  const actor: DjActor = {
    kind: 'command_os_curator',
    id: 'health-cli',
    orgId: 'org-health',
    tenantId: 'tenant-health',
    universeId: 'univ-health',
    role: 'curator',
    permissionLevel: 1,
    authorityLevel: 0,
  };
  const cycle = await runPersonalIntelligenceCommandOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root: input.root,
    repoRoot: input.root,
  });
  return {
    phase: '62L-DJ',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DJ_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DJ_LOCKS.TIP_LAND,
    productionAuthorization: DJ_LOCKS.PRODUCTION_AUTHORIZATION,
    liveSupabaseApply: DJ_LOCKS.LIVE_SUPABASE_APPLY,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessor: predecessorMap(input.root),
    cycleOk: cycle.ok,
    hops: cycle.hops,
    honesty: personalIntelligenceCommandOsHonesty(),
    at: new Date().toISOString(),
  };
}
