import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bootstrapBusinessMediaSupplyChainFoundation,
  businessMediaSupplyChainHonesty,
  shareBusinessMedia,
  submitSupplyChainForecast,
} from './business-media-supply-chain-foundation';
import {
  bootstrapGlobalTechHistoryAtlas,
  globalTechHistoryAtlasHonesty,
  ingestTechHistorySource,
} from './global-tech-history-atlas';
import {
  bootstrapNeuralHighwayExpansion,
  neuralHighwayExpansionHonesty,
  openNeuralPath,
  proposeMiniServerDbCandidate,
  registerBlackHoleNode,
} from './neural-highway-expansion';
import {
  bootstrapOfflineAgentVerificationHarness,
  catalogLogicalOfflineAgent,
  claimOfflineAgentRunningVerified,
  offlineAgentVerificationHonesty,
  recordOfflineNodeHeartbeat,
  registerPoweredAuthorizedNode,
  scheduleAlwaysOnWithoutPoweredNode,
} from './offline-agent-verification-harness';
import {
  bootstrapPrivacySecurityUniverseFabric,
  enableAnonymousChannel,
  loadSpaceDarkMatterPack,
  privacySecurityUniverseFabricHonesty,
  requestEmotionalAdaptation,
} from './privacy-security-universe-fabric';
import {
  bootstrapUnifiedIntelligenceExperienceOs,
  registerExperienceSurface,
  unifiedIntelligenceExperienceOsHonesty,
} from './unified-intelligence-experience-os';
import {
  ANONYMOUS_WITHOUT_MODERATION_REJECTED,
  BLACK_HOLE_UNBOUNDED_DENIED,
  BUSINESS_MEDIA_OPT_IN_DENIED,
  DK_LOCKS,
  HIDDEN_MH_DIAGNOSIS_DENIED,
  HONESTY_BANNER,
  LOGICAL_NOT_RUNNING_VERIFIED,
  METAPHOR_ARCHITECTURE,
  MINI_SERVER_AUTO_APPLY_DENIED,
  NEURAL_HIGHWAY_WORMHOLE_BYPASS_DENIED,
  NEXT_PHASE_TITLE,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  SPACE_PHYSICAL_CONTROL_DENIED,
  SUPPLY_CHAIN_FORECAST_NOT_FACT,
  UNAUTHORIZED_TECH_HISTORY_DENIED,
  UNIFIED_INTELLIGENCE_EXPERIENCE_OS_CYCLE,
  predecessorMap,
  type DkActor,
} from './unified-intelligence-experience-os-types';
import {
  buildUnifiedIntelligenceExperienceOsHealthReport,
  runUnifiedIntelligenceExperienceOsCycle,
} from './unified-intelligence-experience-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldk-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DkActor = {
  kind: 'experience_os_curator',
  id: 'curator-dk-1',
  orgId: 'org-dk',
  tenantId: 'tenant-dk',
  universeId: 'univ-dk',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DK1-cycle',
    UNIFIED_INTELLIGENCE_EXPERIENCE_OS_CYCLE.join(' → ') ===
      'honesty_locks → unified_intelligence_experience_os_bootstrap → logical_agent_not_running_verified_without_heartbeat_powered_node → no_powered_node_waiting_or_offline_stopped → neural_highway_wormhole_cannot_bypass_sealed_auth → unauthorized_tech_history_source_denied → anonymous_channel_without_moderation_rejected → hidden_mental_health_diagnosis_inference_denied → space_dark_matter_pack_no_physical_control → business_media_share_requires_opt_in → supply_chain_forecast_not_verified_fact → black_hole_node_bounded_archive_anomaly → mini_server_db_candidate_cannot_auto_apply_migration → evidence → learning',
    'Unified Intelligence Experience OS cycle recorded in order.',
  );

  check(
    'US-DK-locks',
    DK_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DK_LOCKS.LOGICAL_AGENT_EQ_RUNNING_VERIFIED === false &&
      DK_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      DK_LOCKS.WORMHOLE_BYPASS_SEALED_AUTH === false &&
      DK_LOCKS.UNAUTHORIZED_TECH_HISTORY_SOURCE === false &&
      DK_LOCKS.ANONYMOUS_WITHOUT_MODERATION === false &&
      DK_LOCKS.HIDDEN_MENTAL_HEALTH_DIAGNOSIS_INFERENCE === false &&
      DK_LOCKS.SPACE_DARK_MATTER_PHYSICAL_CONTROL === false &&
      DK_LOCKS.BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN === false &&
      DK_LOCKS.SUPPLY_CHAIN_FORECAST_LABELED_VERIFIED_FACT === false &&
      DK_LOCKS.BLACK_HOLE_UNBOUNDED_DESTRUCTION === false &&
      DK_LOCKS.MINI_SERVER_DB_AUTO_APPLY_MIGRATION === false &&
      DK_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DK_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DK-honesty-surfaces',
    unifiedIntelligenceExperienceOsHonesty().l4AutonomyEnabled === false &&
      neuralHighwayExpansionHonesty().wormholeBypassSealedAuth === false &&
      globalTechHistoryAtlasHonesty().patternEqCausation === false &&
      offlineAgentVerificationHonesty().logicalAgentEqRunningVerified === false &&
      privacySecurityUniverseFabricHonesty().hiddenMentalHealthDiagnosisInference ===
        false &&
      businessMediaSupplyChainHonesty().businessMediaOptInRequired === true,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DK-metaphor-architecture',
    METAPHOR_ARCHITECTURE.black_holes.includes('Bounded archive') &&
      METAPHOR_ARCHITECTURE.parallel_universes.includes('Isolated workspaces') &&
      METAPHOR_ARCHITECTURE.dark_matter_space.includes('research knowledge') &&
      METAPHOR_ARCHITECTURE.emotional_understanding.includes('not hidden mental-health') &&
      METAPHOR_ARCHITECTURE.wormholes.includes('not auth/sealed bypass'),
    'Metaphor→architecture translations present.',
  );

  check(
    'US-DK-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DL —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DK-predecessor-DF-or-better',
    preds.DF.tipProbe === 'PRESENT' ||
      preds.DJ.tipProbe === 'PRESENT' ||
      preds.DI.tipProbe === 'PRESENT' ||
      preds.DH.tipProbe === 'PRESENT' ||
      preds.DG.tipProbe === 'PRESENT' ||
      preds.DE.tipProbe === 'PRESENT',
    `DJ=${preds.DJ.tipProbe}/${preds.DJ.report}; DI=${preds.DI.tipProbe}/${preds.DI.report}; DH=${preds.DH.tipProbe}/${preds.DH.report}; DG=${preds.DG.tipProbe}/${preds.DG.report}; DF=${preds.DF.tipProbe}/${preds.DF.report}`,
  );

  const os = await bootstrapUnifiedIntelligenceExperienceOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  await registerExperienceSurface({
    osId: os.id,
    surface: 'neural_highway_map',
    root,
    actor,
  });

  const harness = await bootstrapOfflineAgentVerificationHarness({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const logical = await catalogLogicalOfflineAgent({
    harnessId: harness.id,
    name: 'catalog-only-agent',
    root,
    actor,
  });
  check(
    'US-DK-logical-catalog-status',
    logical.accepted === true && logical.agent?.status === 'LOGICAL',
    logical.reason,
  );

  const fakeRv = await claimOfflineAgentRunningVerified({
    agentId: logical.agent!.id,
    fabricateWithoutHeartbeat: true,
    root,
    actor,
  });
  check(
    'US-DK-logical-neq-running-verified-without-heartbeat-powered-node',
    fakeRv.accepted === false &&
      fakeRv.reason === LOGICAL_NOT_RUNNING_VERIFIED &&
      fakeRv.agent?.status !== 'RUNNING_VERIFIED',
    fakeRv.reason,
  );

  const noNode = await scheduleAlwaysOnWithoutPoweredNode({
    agentId: logical.agent!.id,
    root,
    actor,
  });
  const noNodeStopped = await scheduleAlwaysOnWithoutPoweredNode({
    agentId: logical.agent!.id,
    preferStopped: true,
    root,
    actor,
  });
  check(
    'US-DK-no-powered-node-waiting-or-offline-stopped',
    noNode.accepted === false &&
      noNode.reason === NO_POWERED_NODE_WAITING_OR_STOPPED &&
      (noNode.agent?.status === 'WAITING_NODE' || noNode.agent?.status === 'OFFLINE_STOPPED') &&
      noNodeStopped.agent?.status === 'OFFLINE_STOPPED',
    `${noNode.agent?.status}/${noNodeStopped.agent?.status}`,
  );

  const powered = await registerPoweredAuthorizedNode({
    harnessId: harness.id,
    name: 'powered-auth-node',
    powered: true,
    authorized: true,
    root,
    actor,
  });
  await recordOfflineNodeHeartbeat({
    nodeId: powered.node!.id,
    runtimeEvidence: 'runtime-proof-1',
    root,
    actor,
  });
  const realRv = await claimOfflineAgentRunningVerified({
    agentId: logical.agent!.id,
    nodeId: powered.node!.id,
    root,
    actor,
  });
  check(
    'US-DK-running-verified-with-heartbeat-powered-node',
    realRv.accepted === true && realRv.agent?.status === 'RUNNING_VERIFIED',
    realRv.reason,
  );

  const unpowered = await registerPoweredAuthorizedNode({
    harnessId: harness.id,
    name: 'unpowered-node',
    powered: false,
    authorized: true,
    root,
    actor,
  });
  const agent2 = await catalogLogicalOfflineAgent({
    harnessId: harness.id,
    name: 'agent-2',
    root,
    actor,
  });
  const claimUnpowered = await claimOfflineAgentRunningVerified({
    agentId: agent2.agent!.id,
    nodeId: unpowered.node!.id,
    root,
    actor,
  });
  check(
    'US-DK-unpowered-node-not-fake-247',
    claimUnpowered.accepted === false &&
      claimUnpowered.reason === NO_POWERED_NODE_WAITING_OR_STOPPED &&
      (claimUnpowered.agent?.status === 'OFFLINE_STOPPED' ||
        claimUnpowered.agent?.status === 'WAITING_NODE'),
    claimUnpowered.reason,
  );

  const hwy = await bootstrapNeuralHighwayExpansion({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const wormholeBypass = await openNeuralPath({
    fabricId: hwy.id,
    kind: 'wormhole',
    from: 'src',
    to: 'dst',
    authorized: true,
    bypassSealed: true,
    root,
    actor,
  });
  const wormholeUnauth = await openNeuralPath({
    fabricId: hwy.id,
    kind: 'wormhole',
    from: 'src',
    to: 'dst2',
    authorized: false,
    root,
    actor,
  });
  const highwayOk = await openNeuralPath({
    fabricId: hwy.id,
    kind: 'highway',
    from: 'a',
    to: 'b',
    authorized: true,
    root,
    actor,
  });
  check(
    'US-DK-neural-highway-wormhole-cannot-bypass-sealed-auth',
    wormholeBypass.accepted === false &&
      wormholeBypass.reason === NEURAL_HIGHWAY_WORMHOLE_BYPASS_DENIED &&
      wormholeUnauth.accepted === false &&
      highwayOk.accepted === true,
    wormholeBypass.reason,
  );

  const atlas = await bootstrapGlobalTechHistoryAtlas({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const unauthTech = await ingestTechHistorySource({
    atlasId: atlas.id,
    sourceId: 'bad-src',
    title: 'Unauthorized',
    authorized: false,
    root,
    actor,
  });
  const noProv = await ingestTechHistorySource({
    atlasId: atlas.id,
    sourceId: 'no-prov',
    title: 'Missing provenance',
    authorized: true,
    root,
    actor,
  });
  const okTech = await ingestTechHistorySource({
    atlasId: atlas.id,
    sourceId: 'good-src',
    title: 'Authorized tech',
    authorized: true,
    provenanceRef: 'archive://xiv/tech/1',
    claimCausationFromPattern: true,
    root,
    actor,
  });
  check(
    'US-DK-unauthorized-tech-history-source-denied',
    unauthTech.accepted === false &&
      unauthTech.reason === UNAUTHORIZED_TECH_HISTORY_DENIED &&
      noProv.accepted === false &&
      okTech.accepted === true &&
      okTech.entry?.claimKind === 'CORRELATION_ONLY',
    unauthTech.reason,
  );

  const privacy = await bootstrapPrivacySecurityUniverseFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const anonBad = await enableAnonymousChannel({
    fabricId: privacy.id,
    name: 'anon-bad',
    moderationEnabled: false,
    revocationEnabled: true,
    root,
    actor,
  });
  const anonOk = await enableAnonymousChannel({
    fabricId: privacy.id,
    name: 'anon-ok',
    moderationEnabled: true,
    revocationEnabled: true,
    root,
    actor,
  });
  check(
    'US-DK-anonymous-channel-without-moderation-rejected',
    anonBad.accepted === false &&
      anonBad.reason === ANONYMOUS_WITHOUT_MODERATION_REJECTED &&
      anonOk.accepted === true,
    anonBad.reason,
  );

  const mh = await requestEmotionalAdaptation({
    fabricId: privacy.id,
    confidence: 0.5,
    hiddenMentalHealthDiagnosis: true,
    root,
    actor,
  });
  const emoOk = await requestEmotionalAdaptation({
    fabricId: privacy.id,
    confidence: 0.5,
    root,
    actor,
  });
  check(
    'US-DK-hidden-mental-health-diagnosis-inference-denied',
    mh.accepted === false &&
      mh.reason === HIDDEN_MH_DIAGNOSIS_DENIED &&
      emoOk.accepted === true,
    mh.reason,
  );

  const spaceBad = await loadSpaceDarkMatterPack({
    fabricId: privacy.id,
    enablePhysicalControl: true,
    root,
    actor,
  });
  const spaceOk = await loadSpaceDarkMatterPack({
    fabricId: privacy.id,
    root,
    actor,
  });
  check(
    'US-DK-space-dark-matter-pack-no-physical-control',
    spaceBad.accepted === false &&
      spaceBad.reason === SPACE_PHYSICAL_CONTROL_DENIED &&
      spaceOk.accepted === true &&
      spaceOk.pack?.physicalControlEnabled === false,
    spaceBad.reason,
  );

  const biz = await bootstrapBusinessMediaSupplyChainFoundation({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const mediaNoOptIn = await shareBusinessMedia({
    foundationId: biz.id,
    contentRef: 'c1',
    optIn: false,
    declaredAgeYears: 30,
    root,
    actor,
  });
  const mediaPublish = await shareBusinessMedia({
    foundationId: biz.id,
    contentRef: 'c2',
    optIn: true,
    declaredAgeYears: 30,
    publish: true,
    root,
    actor,
  });
  const mediaOk = await shareBusinessMedia({
    foundationId: biz.id,
    contentRef: 'c3',
    optIn: true,
    declaredAgeYears: 30,
    recommendationOnly: true,
    root,
    actor,
  });
  check(
    'US-DK-business-media-share-requires-opt-in',
    mediaNoOptIn.accepted === false &&
      mediaNoOptIn.reason === BUSINESS_MEDIA_OPT_IN_DENIED &&
      mediaPublish.accepted === false &&
      mediaOk.accepted === true,
    mediaNoOptIn.reason,
  );

  const forecastFact = await submitSupplyChainForecast({
    foundationId: biz.id,
    skuOrLane: 'sku-1',
    provenanceRef: 'prov-sc-1',
    claimVerifiedFact: true,
    root,
    actor,
  });
  const forecastOk = await submitSupplyChainForecast({
    foundationId: biz.id,
    skuOrLane: 'sku-2',
    provenanceRef: 'prov-sc-2',
    root,
    actor,
  });
  check(
    'US-DK-supply-chain-forecast-not-verified-fact',
    forecastFact.accepted === false &&
      forecastFact.reason === SUPPLY_CHAIN_FORECAST_NOT_FACT &&
      forecastOk.accepted === true &&
      forecastOk.forecast?.labeledVerifiedFact === false &&
      forecastOk.forecast?.label === 'LABELED_FORECAST',
    forecastFact.reason,
  );

  const bhBad = await registerBlackHoleNode({
    fabricId: hwy.id,
    kind: 'anomaly_node',
    unboundedDestruction: true,
    root,
    actor,
  });
  const bhAudit = await registerBlackHoleNode({
    fabricId: hwy.id,
    kind: 'bounded_archive',
    destroySealedAuditWithoutPolicy: true,
    root,
    actor,
  });
  const bhOk = await registerBlackHoleNode({
    fabricId: hwy.id,
    kind: 'compression_node',
    archiveBytes: 1024,
    root,
    actor,
  });
  check(
    'US-DK-black-hole-node-bounded-archive-anomaly',
    bhBad.accepted === false &&
      bhBad.reason === BLACK_HOLE_UNBOUNDED_DENIED &&
      bhAudit.accepted === false &&
      bhOk.accepted === true &&
      bhOk.node?.bounded === true &&
      bhOk.node?.destroysSealedAuditWithoutPolicy === false,
    bhBad.reason,
  );

  const miniBad = await proposeMiniServerDbCandidate({
    fabricId: hwy.id,
    name: 'prod-auto',
    autoApplyProductionMigration: true,
    root,
    actor,
  });
  const miniOk = await proposeMiniServerDbCandidate({
    fabricId: hwy.id,
    name: 'candidate-only',
    root,
    actor,
  });
  check(
    'US-DK-mini-server-db-candidate-cannot-auto-apply-migration',
    miniBad.accepted === false &&
      miniBad.reason === MINI_SERVER_AUTO_APPLY_DENIED &&
      miniOk.accepted === true &&
      miniOk.candidate?.applied === false &&
      miniOk.candidate?.status === 'NOT_APPLIED',
    miniBad.reason,
  );

  const cycle = await runUnifiedIntelligenceExperienceOsCycle({
    orgId: 'org-dk-cycle',
    tenantId: 'tenant-dk-cycle',
    universeId: 'univ-dk-cycle',
    actor: { ...actor, orgId: 'org-dk-cycle', tenantId: 'tenant-dk-cycle', universeId: 'univ-dk-cycle' },
    root,
    repoRoot,
  });
  check(
    'US-DK-cycle-runtime',
    cycle.hops.length === UNIFIED_INTELLIGENCE_EXPERIENCE_OS_CYCLE.length &&
      cycle.tipLand === false &&
      cycle.productionAuthorized === false &&
      cycle.dbCandidatesApplied === false &&
      cycle.githubSotIssue === 128 &&
      cycle.gitlabCoordinationIssue === 62 &&
      cycle.nextPhaseTitle.startsWith('62L-DL —'),
    `hops=${cycle.hops.length} tipLand=${cycle.tipLand}`,
  );

  const health = await buildUnifiedIntelligenceExperienceOsHealthReport({
    root: repoRoot,
    repoRoot,
  });
  check(
    'US-DK-health-report',
    health.honestyBanner === HONESTY_BANNER &&
      health.l4AutonomyEnabled === false &&
      health.liveSupabaseApply === false,
    'Health report honesty intact.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DK stories:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DK Unified Intelligence Experience OS + Neural Highway stories passed.');
