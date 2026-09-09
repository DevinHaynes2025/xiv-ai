import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptCrossModePrivateAccess,
  attemptPersonalModeActivation,
  bootstrapUniversalPersonalBusinessAiOs,
  storeModePrivateRecord,
  universalPersonalBusinessAiOsHonesty,
} from './universal-personal-business-ai-os';
import {
  bootstrapGlobalLifeEnterpriseCommandCenter,
  globalLifeEnterpriseCommandCenterHonesty,
  registerCommandCenterSurface,
  runUniversalSearchWithEvidence,
} from './global-life-enterprise-command-center-ux';
import {
  bootstrapHistoricalWorldSimulationEngine,
  exploreHistoricalPathway,
  historicalWorldSimulationHonesty,
  registerHistoricalSource,
} from './historical-world-simulation-engine';
import {
  bootstrapPredictiveDecisionIntelligence,
  composePredictiveScenario,
  predictiveDecisionIntelligenceHonesty,
} from './predictive-decision-intelligence';
import {
  attemptAgentEconomySpend,
  bootstrapPersonalAgentEconomy,
  personalAgentEconomyHonesty,
  planOvernightShift,
  registerPersonalAgentTeam,
} from './personal-agent-economy';
import {
  attemptCommunityShare,
  bootstrapMultilingualCommunityIntelligenceNetwork,
  discoverCommunityExpert,
  multilingualCommunityIntelligenceHonesty,
} from './multilingual-community-intelligence-network';
import {
  bootstrapContinuousAgentLearningDebriefSystem,
  continuousAgentLearningDebriefHonesty,
  openVisibleDebriefRoom,
  recordLearningDebrief,
} from './continuous-agent-learning-debrief-system';
import {
  AGENT_ECONOMY_PURCHASE_BILL_DENIED,
  COMMUNITY_SHARE_OPT_IN_DENIED,
  CROSS_MODE_LEAK_DENIED,
  DG_LOCKS,
  DUAL_MODE_ISOLATION_HELD,
  HONESTY_BANNER,
  LEARNING_AUTHORITY_SELF_GRANT_DENIED,
  NEXT_PHASE_TITLE,
  OVERNIGHT_OFFLINE_STOPPED,
  OVERNIGHT_WAITING_NODE,
  PREDICTION_NOT_VERIFIED_FACT,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  UNAUTHORIZED_HISTORICAL_SOURCE_DENIED,
  UNDER_18_PERSONAL_ACTIVATION_DENIED,
  UNIVERSAL_PERSONAL_BUSINESS_AI_OS_CYCLE,
  predecessorMap,
  type DgActor,
} from './universal-personal-business-ai-os-types';
import {
  buildUniversalPersonalBusinessAiOsHealthReport,
  runUniversalPersonalBusinessAiOsCycle,
} from './universal-personal-business-ai-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldg-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DgActor = {
  kind: 'universal_os_curator',
  id: 'curator-dg-1',
  orgId: 'org-dg',
  tenantId: 'tenant-dg',
  universeId: 'univ-dg',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DG1-cycle',
    UNIVERSAL_PERSONAL_BUSINESS_AI_OS_CYCLE.join(' → ') ===
      'honesty_locks → universal_personal_business_ai_os_bootstrap → cross_mode_isolation_personal_to_business_denied → cross_mode_isolation_business_to_personal_denied → dual_mode_does_not_collapse_isolation → under_18_personal_activation_denied → unauthorized_historical_source_denied → prediction_not_labeled_verified_fact → quantum_without_classical_baseline_rejected → community_share_without_opt_in_denied → overnight_shift_without_powered_node_waiting_or_offline → learning_debrief_cannot_self_grant_authority → agent_economy_cannot_purchase_or_bill → evidence → learning',
    'Universal Personal/Business AI OS cycle recorded in order.',
  );

  check(
    'US-DG-locks',
    DG_LOCKS.L4_AUTONOMY_ENABLED === false &&
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
      DG_LOCKS.FULL_PRODUCTION_UX_SHIPPED === false &&
      DG_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DG_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DG-honesty-surfaces',
    universalPersonalBusinessAiOsHonesty().l4AutonomyEnabled === false &&
      universalPersonalBusinessAiOsHonesty().modeIsolationDefault === true &&
      globalLifeEnterpriseCommandCenterHonesty().extendsDfUx === true &&
      historicalWorldSimulationHonesty().historicalRequiresAuthorizedProvenance === true &&
      predictiveDecisionIntelligenceHonesty().predictionsRemainProbabilistic === true &&
      personalAgentEconomyHonesty().accountingOnly === true &&
      multilingualCommunityIntelligenceHonesty().communitySharingOptInOnly === true &&
      continuousAgentLearningDebriefHonesty().learningSelfGrantsAuthority === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check('US-DG-next-title', NEXT_PHASE_TITLE.startsWith('62L-DH —'), NEXT_PHASE_TITLE);

  const preds = predecessorMap(repoRoot);
  check(
    'US-DG-predecessor-DF-or-better',
    preds.DF.tipProbe === 'PRESENT' ||
      preds.DE.tipProbe === 'PRESENT' ||
      preds.DD.tipProbe === 'PRESENT' ||
      preds.DA.tipProbe === 'PRESENT',
    `DF=${preds.DF.tipProbe}/${preds.DF.report}; DE=${preds.DE.tipProbe}; DD=${preds.DD.tipProbe}; DC=${preds.DC.tipProbe}; DB=${preds.DB.tipProbe}; DA=${preds.DA.tipProbe}`,
  );

  const personalOs = await bootstrapUniversalPersonalBusinessAiOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    mode: 'personal',
    root,
    actor,
    repoRoot,
  });
  const businessOs = await bootstrapUniversalPersonalBusinessAiOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    mode: 'business',
    root,
    actor,
    repoRoot,
  });
  const dualOs = await bootstrapUniversalPersonalBusinessAiOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    mode: 'dual',
    root,
    actor,
    repoRoot,
  });

  await storeModePrivateRecord({
    osId: personalOs.id,
    mode: 'personal',
    boundary: 'personal_private',
    key: 'personal-note',
    value: 'secret-personal',
    root,
    actor,
  });
  await storeModePrivateRecord({
    osId: businessOs.id,
    mode: 'business',
    boundary: 'business_private',
    key: 'business-ledger',
    value: 'secret-business',
    root,
    actor,
  });

  // Cross-mode leak Personal→Business private DENIED by default
  const p2b = await attemptCrossModePrivateAccess({
    osId: personalOs.id,
    fromMode: 'personal',
    toMode: 'business',
    targetBoundary: 'business_private',
    root,
    actor,
  });
  check(
    'US-DG-cross-mode-personal-to-business-denied',
    p2b.allowed === false && p2b.reason === CROSS_MODE_LEAK_DENIED,
    p2b.reason,
  );

  // Reverse: Business→Personal private DENIED by default
  const b2p = await attemptCrossModePrivateAccess({
    osId: businessOs.id,
    fromMode: 'business',
    toMode: 'personal',
    targetBoundary: 'personal_private',
    root,
    actor,
  });
  check(
    'US-DG-cross-mode-business-to-personal-denied',
    b2p.allowed === false && b2p.reason === CROSS_MODE_LEAK_DENIED,
    b2p.reason,
  );

  // Dual mode does not collapse isolation without explicit policy
  const dualHold = await attemptCrossModePrivateAccess({
    osId: dualOs.id,
    fromMode: 'dual',
    toMode: 'business',
    targetBoundary: 'business_private',
    explicitSharedPolicy: false,
    root,
    actor,
  });
  check(
    'US-DG-dual-mode-isolation-held',
    dualHold.allowed === false &&
      (dualHold.status === 'ISOLATION_HELD' || dualHold.reason === DUAL_MODE_ISOLATION_HELD),
    dualHold.reason,
  );

  // Under-18 personal activation DENIED
  const under18 = await attemptPersonalModeActivation({
    osId: personalOs.id,
    declaredAgeYears: 17,
    root,
    actor,
  });
  const adult = await attemptPersonalModeActivation({
    osId: personalOs.id,
    declaredAgeYears: 21,
    root,
    actor,
  });
  check(
    'US-DG-under-18-personal-activation-denied',
    under18.accepted === false &&
      under18.reason === UNDER_18_PERSONAL_ACTIVATION_DENIED &&
      adult.accepted === true,
    under18.reason,
  );

  const center = await bootstrapGlobalLifeEnterpriseCommandCenter({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    mode: 'dual',
    root,
    actor,
  });
  const surface = await registerCommandCenterSurface({
    centerId: center.id,
    surface: 'enterprise_command',
    locale: 'fr',
    root,
    actor,
  });
  const search = await runUniversalSearchWithEvidence({
    centerId: center.id,
    query: 'global life command',
    root,
    actor,
  });
  check(
    'US-DG-command-center-contracts',
    surface.accepted === true &&
      surface.surface?.extendsDfUx === true &&
      search.status === 'BOUNDED',
    search.reason,
  );

  // Unauthorized historical source DENIED
  const hist = await bootstrapHistoricalWorldSimulationEngine({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const badSrc = await registerHistoricalSource({
    engineId: hist.id,
    sourceId: 'bad-source',
    authorized: false,
    provenanceBacked: true,
    root,
    actor,
  });
  const noProv = await registerHistoricalSource({
    engineId: hist.id,
    sourceId: 'no-prov',
    authorized: true,
    provenanceBacked: false,
    root,
    actor,
  });
  const goodSrc = await registerHistoricalSource({
    engineId: hist.id,
    sourceId: 'good-source',
    authorized: true,
    provenanceBacked: true,
    root,
    actor,
  });
  const badExplore = await exploreHistoricalPathway({
    engineId: hist.id,
    timelineId: 'tl-bad',
    sourceId: 'bad-source',
    root,
    actor,
  });
  const goodExplore = await exploreHistoricalPathway({
    engineId: hist.id,
    timelineId: 'tl-good',
    sourceId: 'good-source',
    root,
    actor,
  });
  check(
    'US-DG-unauthorized-historical-source-denied',
    badSrc.accepted === false &&
      noProv.accepted === false &&
      badExplore.accepted === false &&
      badExplore.reason === UNAUTHORIZED_HISTORICAL_SOURCE_DENIED &&
      goodSrc.accepted === true &&
      goodExplore.accepted === true &&
      goodExplore.timeline?.labeledSimulation === true &&
      goodExplore.timeline?.labeledVerifiedFact === false,
    badSrc.reason,
  );

  // Prediction not labeled verified fact
  const pred = await bootstrapPredictiveDecisionIntelligence({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const claimFact = await composePredictiveScenario({
    engineId: pred.id,
    scenarioId: 'claim-fact',
    claimVerifiedFact: true,
    classicalBaselinePresent: true,
    root,
    actor,
  });
  const okPred = await composePredictiveScenario({
    engineId: pred.id,
    scenarioId: 'ok-pred',
    label: 'PROBABILISTIC',
    classicalBaselinePresent: true,
    root,
    actor,
  });
  check(
    'US-DG-prediction-not-verified-fact',
    claimFact.accepted === false &&
      claimFact.reason === PREDICTION_NOT_VERIFIED_FACT &&
      okPred.accepted === true &&
      okPred.scenario?.probabilistic === true &&
      okPred.scenario?.labeledVerifiedFact === false,
    claimFact.reason,
  );

  // Quantum path without classical baseline REJECTED
  const qReject = await composePredictiveScenario({
    engineId: pred.id,
    scenarioId: 'q-no-base',
    quantumPathUsed: true,
    classicalBaselinePresent: false,
    root,
    actor,
  });
  const qOk = await composePredictiveScenario({
    engineId: pred.id,
    scenarioId: 'q-with-base',
    quantumPathUsed: true,
    classicalBaselinePresent: true,
    root,
    actor,
  });
  check(
    'US-DG-quantum-without-classical-baseline-rejected',
    qReject.accepted === false &&
      qReject.reason === QUANTUM_WITHOUT_BASELINE_REJECTED &&
      qOk.accepted === true &&
      qOk.scenario?.guaranteed === false,
    qReject.reason,
  );

  // Community share without opt-in DENIED
  const community = await bootstrapMultilingualCommunityIntelligenceNetwork({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  await discoverCommunityExpert({
    networkId: community.id,
    locale: 'ja',
    query: '専門家',
    root,
    actor,
  });
  const noOptIn = await attemptCommunityShare({
    networkId: community.id,
    payloadRef: 'p1',
    optIn: false,
    root,
    actor,
  });
  const withOptIn = await attemptCommunityShare({
    networkId: community.id,
    payloadRef: 'p2',
    optIn: true,
    root,
    actor,
  });
  check(
    'US-DG-community-share-without-opt-in-denied',
    noOptIn.accepted === false &&
      noOptIn.reason === COMMUNITY_SHARE_OPT_IN_DENIED &&
      withOptIn.accepted === true,
    noOptIn.reason,
  );

  // Overnight shift with no powered authorized node → WAITING_NODE or OFFLINE_STOPPED
  const economy = await bootstrapPersonalAgentEconomy({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  await registerPersonalAgentTeam({
    economyId: economy.id,
    teamId: 'team-a',
    root,
    actor,
  });
  const waiting = await planOvernightShift({
    economyId: economy.id,
    shiftId: 's-wait',
    teamId: 'team-a',
    poweredAuthorizedNode: false,
    root,
    actor,
  });
  const offline = await planOvernightShift({
    economyId: economy.id,
    shiftId: 's-off',
    teamId: 'team-a',
    poweredAuthorizedNode: false,
    nodeOnline: false,
    root,
    actor,
  });
  const powered = await planOvernightShift({
    economyId: economy.id,
    shiftId: 's-ok',
    teamId: 'team-a',
    poweredAuthorizedNode: true,
    nodeOnline: true,
    root,
    actor,
  });
  check(
    'US-DG-overnight-no-powered-node-waiting-or-offline',
    (waiting.status === OVERNIGHT_WAITING_NODE || waiting.status === OVERNIGHT_OFFLINE_STOPPED) &&
      offline.status === OVERNIGHT_OFFLINE_STOPPED &&
      powered.status === 'RUNNING_VERIFIED',
    `${waiting.status}/${offline.status}/${powered.status}`,
  );

  // Learning/debrief cannot self-grant authority
  const learning = await bootstrapContinuousAgentLearningDebriefSystem({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  await openVisibleDebriefRoom({
    systemId: learning.id,
    roomId: 'debrief-1',
    root,
    actor,
  });
  const selfGrant = await recordLearningDebrief({
    systemId: learning.id,
    roomId: 'debrief-1',
    agentId: 'agent-x',
    summary: 'try grant',
    authoritySelfGrantRequested: true,
    root,
    actor,
  });
  const recorded = await recordLearningDebrief({
    systemId: learning.id,
    roomId: 'debrief-1',
    agentId: 'agent-x',
    summary: 'normal learn',
    authoritySelfGrantRequested: false,
    root,
    actor,
  });
  check(
    'US-DG-learning-debrief-cannot-self-grant-authority',
    selfGrant.accepted === false &&
      selfGrant.reason === LEARNING_AUTHORITY_SELF_GRANT_DENIED &&
      recorded.accepted === true &&
      recorded.entry.learningGrantsPermission === false,
    selfGrant.reason,
  );

  // Agent economy cannot purchase/bill
  const purchase = await attemptAgentEconomySpend({
    economyId: economy.id,
    kind: 'purchase',
    amount: 10,
    root,
    actor,
  });
  const bill = await attemptAgentEconomySpend({
    economyId: economy.id,
    kind: 'bill',
    amount: 5,
    root,
    actor,
  });
  check(
    'US-DG-agent-economy-cannot-purchase-or-bill',
    purchase.accepted === false &&
      bill.accepted === false &&
      purchase.reason === AGENT_ECONOMY_PURCHASE_BILL_DENIED &&
      economy.accountingOnly === true &&
      economy.canPurchase === false &&
      economy.canBill === false,
    purchase.reason,
  );

  const cycle = await runUniversalPersonalBusinessAiOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: 'univ-dg-cycle',
    actor: { ...actor, universeId: 'univ-dg-cycle' },
    root,
    repoRoot,
  });
  check(
    'US-DG-cycle-health-sot',
    cycle.githubSotIssue === 124 &&
      cycle.gitlabCoordinationIssue === 58 &&
      cycle.tipLand === false &&
      cycle.productionAuthorized === false &&
      cycle.hops.length === UNIVERSAL_PERSONAL_BUSINESS_AI_OS_CYCLE.length &&
      cycle.nextPhaseTitle.startsWith('62L-DH —'),
    `hops=${cycle.hops.length}; sot=#${cycle.githubSotIssue}/#${cycle.gitlabCoordinationIssue}`,
  );

  const health = await buildUniversalPersonalBusinessAiOsHealthReport({
    root,
    repoRoot,
  });
  check(
    'US-DG-health-report',
    health.honestyBanner === HONESTY_BANNER && health.l4AutonomyEnabled === false,
    health.honestyBanner,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log('OK phase62ldg — all stories PASS');
