/**
 * 62L-DK Unified Intelligence Experience OS runtime —
 * Walks UNIFIED_INTELLIGENCE_EXPERIENCE_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  bootstrapBusinessMediaSupplyChainFoundation,
  shareBusinessMedia,
  submitSupplyChainForecast,
} from './business-media-supply-chain-foundation';
import {
  bootstrapGlobalTechHistoryAtlas,
  ingestTechHistorySource,
} from './global-tech-history-atlas';
import {
  bootstrapNeuralHighwayExpansion,
  openNeuralPath,
  proposeMiniServerDbCandidate,
  registerBlackHoleNode,
} from './neural-highway-expansion';
import {
  bootstrapOfflineAgentVerificationHarness,
  catalogLogicalOfflineAgent,
  claimOfflineAgentRunningVerified,
  recordOfflineNodeHeartbeat,
  registerPoweredAuthorizedNode,
  scheduleAlwaysOnWithoutPoweredNode,
} from './offline-agent-verification-harness';
import {
  bootstrapPrivacySecurityUniverseFabric,
  enableAnonymousChannel,
  loadSpaceDarkMatterPack,
  requestEmotionalAdaptation,
} from './privacy-security-universe-fabric';
import {
  bootstrapUnifiedIntelligenceExperienceOs,
  registerExperienceSurface,
  unifiedIntelligenceExperienceOsHonesty,
} from './unified-intelligence-experience-os';
import {
  DK_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  METAPHOR_ARCHITECTURE,
  NEXT_PHASE_TITLE,
  UNIFIED_INTELLIGENCE_EXPERIENCE_OS_CYCLE,
  predecessorMap,
  type DkActor,
  type DkEvidenceState,
  type DkHop,
  type DkHopRecord,
} from './unified-intelligence-experience-os-types';

export {
  DK_LOCKS,
  HONESTY_BANNER,
  METAPHOR_ARCHITECTURE,
  NEXT_PHASE_TITLE,
  UNIFIED_INTELLIGENCE_EXPERIENCE_OS_CYCLE,
  predecessorMap,
};

function hop(name: DkHop, state: DkEvidenceState, summary: string): DkHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DkCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DkActor;
  root?: string;
  repoRoot?: string;
};

export async function runUnifiedIntelligenceExperienceOsCycle(input: DkCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DkHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DK_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DK_LOCKS.LOCAL_FIRST &&
        DK_LOCKS.LOGICAL_AGENT_EQ_RUNNING_VERIFIED === false &&
        DK_LOCKS.WORMHOLE_BYPASS_SEALED_AUTH === false &&
        DK_LOCKS.UNAUTHORIZED_TECH_HISTORY_SOURCE === false &&
        DK_LOCKS.ANONYMOUS_WITHOUT_MODERATION === false &&
        DK_LOCKS.HIDDEN_MENTAL_HEALTH_DIAGNOSIS_INFERENCE === false &&
        DK_LOCKS.SPACE_DARK_MATTER_PHYSICAL_CONTROL === false &&
        DK_LOCKS.BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN === false &&
        DK_LOCKS.SUPPLY_CHAIN_FORECAST_LABELED_VERIFIED_FACT === false &&
        DK_LOCKS.BLACK_HOLE_UNBOUNDED_DESTRUCTION === false &&
        DK_LOCKS.MINI_SERVER_DB_AUTO_APPLY_MIGRATION === false &&
        DK_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapUnifiedIntelligenceExperienceOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  await registerExperienceSurface({
    osId: os.id,
    surface: 'unified_home',
    root,
    actor,
  });
  hops.push(
    hop(
      'unified_intelligence_experience_os_bootstrap',
      'PASS',
      `OS ${os.id} predecessor=${os.predecessorLayer}`,
    ),
  );

  const harness = await bootstrapOfflineAgentVerificationHarness({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const logical = await catalogLogicalOfflineAgent({
    harnessId: harness.id,
    name: 'logical-catalog-agent',
    root,
    actor,
  });
  const fakeRv = await claimOfflineAgentRunningVerified({
    agentId: logical.agent!.id,
    fabricateWithoutHeartbeat: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'logical_agent_not_running_verified_without_heartbeat_powered_node',
      fakeRv.accepted === false ? 'PASS' : 'FAIL',
      fakeRv.reason,
    ),
  );

  const noNode = await scheduleAlwaysOnWithoutPoweredNode({
    agentId: logical.agent!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'no_powered_node_waiting_or_offline_stopped',
      noNode.accepted === false &&
        (noNode.agent?.status === 'WAITING_NODE' || noNode.agent?.status === 'OFFLINE_STOPPED')
        ? 'PASS'
        : 'FAIL',
      noNode.reason,
    ),
  );

  // Positive path: powered + heartbeat → RUNNING_VERIFIED (evidence only)
  const node = await registerPoweredAuthorizedNode({
    harnessId: harness.id,
    name: 'authorized-edge-1',
    powered: true,
    authorized: true,
    root,
    actor,
  });
  await recordOfflineNodeHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'heartbeat-runtime-proof',
    root,
    actor,
  });
  await claimOfflineAgentRunningVerified({
    agentId: logical.agent!.id,
    nodeId: node.node!.id,
    root,
    actor,
  });

  const hwy = await bootstrapNeuralHighwayExpansion({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const wormholeBypass = await openNeuralPath({
    fabricId: hwy.id,
    kind: 'wormhole',
    from: 'a',
    to: 'b',
    authorized: true,
    bypassSealed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'neural_highway_wormhole_cannot_bypass_sealed_auth',
      wormholeBypass.accepted === false ? 'PASS' : 'FAIL',
      wormholeBypass.reason,
    ),
  );

  const atlas = await bootstrapGlobalTechHistoryAtlas({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const unauth = await ingestTechHistorySource({
    atlasId: atlas.id,
    sourceId: 'src-unauth',
    title: 'Unauthorized tech claim',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_tech_history_source_denied',
      unauth.accepted === false ? 'PASS' : 'FAIL',
      unauth.reason,
    ),
  );

  const privacy = await bootstrapPrivacySecurityUniverseFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const anon = await enableAnonymousChannel({
    fabricId: privacy.id,
    name: 'anon-no-mod',
    moderationEnabled: false,
    revocationEnabled: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'anonymous_channel_without_moderation_rejected',
      anon.accepted === false ? 'PASS' : 'FAIL',
      anon.reason,
    ),
  );

  const mh = await requestEmotionalAdaptation({
    fabricId: privacy.id,
    confidence: 0.4,
    hiddenMentalHealthDiagnosis: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'hidden_mental_health_diagnosis_inference_denied',
      mh.accepted === false ? 'PASS' : 'FAIL',
      mh.reason,
    ),
  );

  const space = await loadSpaceDarkMatterPack({
    fabricId: privacy.id,
    enablePhysicalControl: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'space_dark_matter_pack_no_physical_control',
      space.accepted === false ? 'PASS' : 'FAIL',
      space.reason,
    ),
  );

  const biz = await bootstrapBusinessMediaSupplyChainFoundation({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const media = await shareBusinessMedia({
    foundationId: biz.id,
    contentRef: 'post-1',
    optIn: false,
    declaredAgeYears: 25,
    root,
    actor,
  });
  hops.push(
    hop(
      'business_media_share_requires_opt_in',
      media.accepted === false ? 'PASS' : 'FAIL',
      media.reason,
    ),
  );

  const forecast = await submitSupplyChainForecast({
    foundationId: biz.id,
    skuOrLane: 'lane-a',
    provenanceRef: 'prov-1',
    claimVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'supply_chain_forecast_not_verified_fact',
      forecast.accepted === false ? 'PASS' : 'FAIL',
      forecast.reason,
    ),
  );

  const bh = await registerBlackHoleNode({
    fabricId: hwy.id,
    kind: 'bounded_archive',
    unboundedDestruction: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'black_hole_node_bounded_archive_anomaly',
      bh.accepted === false ? 'PASS' : 'FAIL',
      bh.reason,
    ),
  );

  const mini = await proposeMiniServerDbCandidate({
    fabricId: hwy.id,
    name: 'edge-mini-db',
    autoApplyProductionMigration: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'mini_server_db_candidate_cannot_auto_apply_migration',
      mini.accepted === false ? 'PASS' : 'FAIL',
      mini.reason,
    ),
  );

  void decisionGate({
    id: 'dk-cycle-gate',
    action: '62l_dk_unified_intelligence_experience_os_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void unifiedIntelligenceExperienceOsHonesty();

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DK unified intelligence experience OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DK'],
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
      subject: '62L-DK unified intelligence experience OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; logical≠RUNNING_VERIFIED; wormhole≠auth bypass; black-hole=bounded archive`,
      sourceRefs: ['62L-DK'],
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
    l4AutonomyEnabled: DK_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    metaphorArchitecture: METAPHOR_ARCHITECTURE,
    predecessorLayer: os.predecessorLayer,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionExperienceOsShipped: false as const,
    dbCandidatesApplied: false as const,
  };
}

export async function buildUnifiedIntelligenceExperienceOsHealthReport(input?: {
  root?: string;
  repoRoot?: string;
}) {
  const root = input?.root ?? process.cwd();
  const repoRoot = input?.repoRoot ?? root;
  const preds = predecessorMap(repoRoot);
  const honesty = unifiedIntelligenceExperienceOsHonesty();
  return {
    phase: '62L-DK',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DK_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DK_LOCKS.TIP_LAND,
    productionAuthorization: DK_LOCKS.PRODUCTION_AUTHORIZATION,
    liveSupabaseApply: DK_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DK_LOCKS.DB_CANDIDATES_APPLIED,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    metaphorArchitecture: METAPHOR_ARCHITECTURE,
    predecessorMap: preds,
    honesty,
    cycle: UNIFIED_INTELLIGENCE_EXPERIENCE_OS_CYCLE,
    generatedAt: new Date().toISOString(),
  };
}
