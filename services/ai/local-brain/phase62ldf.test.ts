import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptPersonalOnboarding,
  bootstrapHumanCenteredSuperbrainUxOs,
  humanCenteredSuperbrainUxHonesty,
  invokeWormholeFastPath,
  registerUxScreenContract,
} from './human-centered-superbrain-ux-os';
import {
  bootstrapAgentWorkforce,
  claimWorkforceAgentRunningVerified,
  globalPersonalAgentWorkforceHonesty,
  recordWorkforceAgentHeartbeat,
  registerWorkforceAgent,
  uxWorkforceSurfaceStatus,
} from './global-personal-agent-workforce';
import {
  bootstrapHistoricalAtlasQuantEngine,
  claimTrillionScaleCapacity,
  historicalAtlasQuantHonesty,
  mineHistoricalPathway,
  submitPredictiveForecast,
} from './historical-data-atlas-predictive-quant-engine';
import {
  bootstrapEthicalSecurityDiscoveryLab,
  ethicalSecurityDiscoveryLabHonesty,
  invokeLeakSentinel,
  runEthicalSecurityProbe,
} from './ethical-security-discovery-lab';
import {
  bootstrapNeuralGrowthLedger,
  neuralGrowthLedgerHonesty,
  recordNeuralGrowth,
} from './neural-growth-ledger';
import {
  agentMeetingCommunicationFabricHonesty,
  attemptMeetingProductionAuthorityTransfer,
  bootstrapAgentMeetingCommunicationFabric,
  openAgentTeamMeeting,
} from './agent-meeting-communication-fabric';
import {
  DF_LOCKS,
  FORECAST_NOT_VERIFIED_FACT,
  HONESTY_BANNER,
  HUMAN_CENTERED_SUPERBRAIN_UX_CYCLE,
  MEETING_PRODUCTION_AUTHORITY_DENIED,
  NEURAL_GROWTH_PERMISSION_EXPAND_DENIED,
  NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  OFFENSIVE_ETHICAL_HACK_DENIED,
  OFFENSIVE_HARVEST_DENIED,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  TRILLION_SCALE_NOT_VERIFIED,
  UNAUTHORIZED_HISTORICAL_MINING_DENIED,
  UNDER_18_ONBOARDING_DENIED,
  WORMHOLE_BYPASS_DENIED,
  predecessorMap,
  type DfActor,
} from './human-centered-superbrain-ux-types';
import {
  buildHumanCenteredSuperbrainUxHealthReport,
  runHumanCenteredSuperbrainUxCycle,
} from './human-centered-superbrain-ux-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldf-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DfActor = {
  kind: 'ux_os_curator',
  id: 'curator-df-1',
  orgId: 'org-df',
  tenantId: 'tenant-df',
  universeId: 'univ-df',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DF1-cycle',
    HUMAN_CENTERED_SUPERBRAIN_UX_CYCLE.join(' → ') ===
      'honesty_locks → human_centered_superbrain_ux_bootstrap → under_18_onboarding_denied → wormhole_cannot_bypass_sealed_auth → trillion_scale_unmeasured_not_verified → quantum_without_classical_baseline_rejected → offensive_unauthorized_ethical_hack_denied → unauthorized_historical_hidden_jewel_mining_denied → forecast_scenario_not_labeled_verified_fact → neural_growth_cannot_self_expand_permissions → meeting_cannot_transfer_production_authority → leak_sentinel_offensive_harvest_denied → agent_without_heartbeat_not_running_verified → evidence → learning',
    'Human-Centered Superbrain UX cycle recorded in order.',
  );

  check(
    'US-DF-locks',
    DF_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DF_LOCKS.UNDER_18_ONBOARDING_ALLOWED === false &&
      DF_LOCKS.WORMHOLE_BYPASS_SEALED_AUTH === false &&
      DF_LOCKS.TRILLION_SCALE_CLAIMED_WITHOUT_MEASUREMENT === false &&
      DF_LOCKS.QUANTUM_PREDICTION_WITHOUT_CLASSICAL_BASELINE === false &&
      DF_LOCKS.OFFENSIVE_UNAUTHORIZED_ETHICAL_HACK === false &&
      DF_LOCKS.UNAUTHORIZED_HISTORICAL_MINING === false &&
      DF_LOCKS.FORECAST_LABELED_AS_VERIFIED_FACT === false &&
      DF_LOCKS.NEURAL_GROWTH_SELF_EXPANDS_PERMISSIONS === false &&
      DF_LOCKS.MEETING_TRANSFERS_PRODUCTION_AUTHORITY === false &&
      DF_LOCKS.LEAK_SENTINEL_OFFENSIVE_HARVEST === false &&
      DF_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      DF_LOCKS.FULL_PRODUCTION_UX_SHIPPED === false &&
      DF_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DF_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DF-honesty-surfaces',
    humanCenteredSuperbrainUxHonesty().l4AutonomyEnabled === false &&
      humanCenteredSuperbrainUxHonesty().fullProductionUxShipped === false &&
      globalPersonalAgentWorkforceHonesty().runningVerifiedWithoutHeartbeat === false &&
      historicalAtlasQuantHonesty().quantumPredictionGuaranteed === false &&
      ethicalSecurityDiscoveryLabHonesty().leakSentinelDefensiveOnly === true &&
      neuralGrowthLedgerHonesty().learningGrantsPermission === false &&
      agentMeetingCommunicationFabricHonesty().meetingTransfersProductionAuthority ===
        false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DF-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DG —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DF-predecessor-DE-or-better',
    preds.DE.tipProbe === 'PRESENT' ||
      preds.DD.tipProbe === 'PRESENT' ||
      preds.CY.tipProbe === 'PRESENT' ||
      preds.DA.tipProbe === 'PRESENT',
    `DE=${preds.DE.tipProbe}/${preds.DE.report}; DD=${preds.DD.tipProbe}/${preds.DD.report}; DC=${preds.DC.tipProbe}; DB=${preds.DB.tipProbe}; DA=${preds.DA.tipProbe}; CY=${preds.CY.tipProbe}`,
  );

  const os = await bootstrapHumanCenteredSuperbrainUxOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    universeKind: 'personal',
    root,
    actor,
    repoRoot,
  });
  await registerUxScreenContract({
    osId: os.id,
    screen: 'agent_team_room',
    locale: 'es',
    root,
    actor,
  });

  // Under-18 onboarding DENIED
  const under18 = await attemptPersonalOnboarding({
    osId: os.id,
    declaredAgeYears: 16,
    root,
    actor,
  });
  const adult = await attemptPersonalOnboarding({
    osId: os.id,
    declaredAgeYears: 21,
    root,
    actor,
  });
  check(
    'US-DF-under-18-onboarding-denied',
    under18.accepted === false &&
      under18.reason === UNDER_18_ONBOARDING_DENIED &&
      adult.accepted === true,
    under18.reason,
  );

  // Wormhole/fast path cannot bypass sealed/auth
  const wormholeBypass = await invokeWormholeFastPath({
    osId: os.id,
    pathId: 'wormhole-a',
    authorized: true,
    bypassSealed: true,
    root,
    actor,
  });
  const wormholeUnauth = await invokeWormholeFastPath({
    osId: os.id,
    pathId: 'wormhole-b',
    authorized: false,
    root,
    actor,
  });
  const wormholeOk = await invokeWormholeFastPath({
    osId: os.id,
    pathId: 'wormhole-c',
    authorized: true,
    root,
    actor,
  });
  check(
    'US-DF-wormhole-cannot-bypass-sealed-auth',
    wormholeBypass.accepted === false &&
      wormholeBypass.reason === WORMHOLE_BYPASS_DENIED &&
      wormholeUnauth.accepted === false &&
      wormholeOk.accepted === true,
    wormholeBypass.reason,
  );

  const atlas = await bootstrapHistoricalAtlasQuantEngine({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });

  // Trillion-scale capacity claim without measurement not VERIFIED
  const trillion = await claimTrillionScaleCapacity({
    atlasId: atlas.id,
    claimedScale: 'trillions_of_data',
    measured: false,
    root,
    actor,
  });
  check(
    'US-DF-trillion-scale-unmeasured-not-verified',
    trillion.accepted === false &&
      trillion.reason === TRILLION_SCALE_NOT_VERIFIED &&
      trillion.claim?.status === 'ARCHITECTURE_TARGET',
    trillion.reason,
  );

  // Quantum prediction without classical baseline / evidence REJECTED
  const quantum = await submitPredictiveForecast({
    engineId: atlas.id,
    scenarioId: 'q1',
    classicalBaselinePresent: false,
    quantumAdapterUsed: true,
    claimGuaranteed: true,
    root,
    actor,
  });
  const classicalOk = await submitPredictiveForecast({
    engineId: atlas.id,
    scenarioId: 'c1',
    label: 'LABELED_FORECAST',
    classicalBaselinePresent: true,
    quantumAdapterUsed: false,
    root,
    actor,
  });
  check(
    'US-DF-quantum-without-classical-baseline-rejected',
    quantum.accepted === false &&
      quantum.reason === QUANTUM_WITHOUT_BASELINE_REJECTED &&
      classicalOk.accepted === true &&
      classicalOk.forecast?.labeledVerifiedFact === false,
    quantum.reason,
  );

  const lab = await bootstrapEthicalSecurityDiscoveryLab({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });

  // Offensive unauthorized ethical-hack DENIED
  const offensive = await runEthicalSecurityProbe({
    labId: lab.id,
    mode: 'offensive_unauthorized',
    targetScope: 'unauthorized',
    root,
    actor,
  });
  const defensive = await runEthicalSecurityProbe({
    labId: lab.id,
    mode: 'defensive_authorized',
    targetScope: 'xiv_owned',
    root,
    actor,
  });
  check(
    'US-DF-offensive-unauthorized-ethical-hack-denied',
    offensive.accepted === false &&
      offensive.reason === OFFENSIVE_ETHICAL_HACK_DENIED &&
      defensive.accepted === true,
    offensive.reason,
  );

  // Unauthorized historical/hidden-jewel mining DENIED
  const mining = await mineHistoricalPathway({
    atlasId: atlas.id,
    pathwayId: 'jewel-x',
    lawfulAuthorized: false,
    hiddenJewel: true,
    root,
    actor,
  });
  const jewelUnauthProbe = await runEthicalSecurityProbe({
    labId: lab.id,
    mode: 'hidden_jewel_unauthorized',
    targetScope: 'xiv_owned',
    root,
    actor,
  });
  check(
    'US-DF-unauthorized-historical-hidden-jewel-mining-denied',
    mining.accepted === false &&
      mining.reason === UNAUTHORIZED_HISTORICAL_MINING_DENIED &&
      jewelUnauthProbe.accepted === false,
    mining.reason,
  );

  // Forecast/scenario not labeled verified fact
  const verifiedClaim = await submitPredictiveForecast({
    engineId: atlas.id,
    scenarioId: 's-verified',
    classicalBaselinePresent: true,
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'US-DF-forecast-scenario-not-labeled-verified-fact',
    verifiedClaim.accepted === false &&
      verifiedClaim.reason === FORECAST_NOT_VERIFIED_FACT &&
      verifiedClaim.forecast?.labeledVerifiedFact === false,
    verifiedClaim.reason,
  );

  // Neural growth cannot self-expand permissions
  const ledger = await bootstrapNeuralGrowthLedger({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const growthDeny = await recordNeuralGrowth({
    ledgerId: ledger.id,
    agentId: 'a1',
    changeSummary: 'expand perms',
    permissionDeltaRequested: true,
    root,
    actor,
  });
  const growthOk = await recordNeuralGrowth({
    ledgerId: ledger.id,
    agentId: 'a1',
    changeSummary: 'skill refinement',
    permissionDeltaRequested: false,
    root,
    actor,
  });
  check(
    'US-DF-neural-growth-cannot-self-expand-permissions',
    growthDeny.accepted === false &&
      growthDeny.reason === NEURAL_GROWTH_PERMISSION_EXPAND_DENIED &&
      growthOk.accepted === true &&
      growthOk.entry?.learningGrantsPermission === false,
    growthDeny.reason,
  );

  // Meeting/communication cannot transfer production authority
  const fabric = await bootstrapAgentMeetingCommunicationFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const meetingDeny = await openAgentTeamMeeting({
    fabricId: fabric.id,
    roomName: 'Team Room',
    objective: 'escalate',
    transferProductionAuthority: true,
    root,
    actor,
  });
  const meetingOk = await openAgentTeamMeeting({
    fabricId: fabric.id,
    roomName: 'Team Room',
    objective: 'debrief',
    root,
    actor,
  });
  const xfer = await attemptMeetingProductionAuthorityTransfer({
    meetingId: meetingOk.meeting!.id,
    root,
    actor,
  });
  check(
    'US-DF-meeting-cannot-transfer-production-authority',
    meetingDeny.accepted === false &&
      meetingDeny.reason === MEETING_PRODUCTION_AUTHORITY_DENIED &&
      meetingOk.accepted === true &&
      meetingOk.meeting?.productionAuthorityTransferred === false &&
      xfer.accepted === false &&
      xfer.reason === MEETING_PRODUCTION_AUTHORITY_DENIED,
    meetingDeny.reason,
  );

  // Leak sentinel defensive-only (offensive harvest DENIED)
  const harvest = await invokeLeakSentinel({
    labId: lab.id,
    requested: 'offensive_harvest',
    root,
    actor,
  });
  const scan = await invokeLeakSentinel({
    labId: lab.id,
    requested: 'defensive_scan',
    root,
    actor,
  });
  check(
    'US-DF-leak-sentinel-offensive-harvest-denied',
    harvest.accepted === false &&
      harvest.reason === OFFENSIVE_HARVEST_DENIED &&
      scan.accepted === true,
    harvest.reason,
  );

  // Agent without heartbeat not RUNNING_VERIFIED on UX workforce surface
  const workforce = await bootstrapAgentWorkforce({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const agentReg = await registerWorkforceAgent({
    workforceId: workforce.id,
    name: 'surface-agent',
    root,
    actor,
  });
  const claimNoHb = await claimWorkforceAgentRunningVerified({
    agentId: agentReg.agent!.id,
    root,
    actor,
  });
  check(
    'US-DF-agent-without-heartbeat-not-running-verified',
    claimNoHb.accepted === false &&
      claimNoHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      uxWorkforceSurfaceStatus(claimNoHb.agent!) !== 'RUNNING_VERIFIED',
    claimNoHb.reason,
  );
  await recordWorkforceAgentHeartbeat({
    agentId: agentReg.agent!.id,
    runtimeEvidence: 'pid=42;runtime=local',
    root,
    actor,
  });
  const claimHb = await claimWorkforceAgentRunningVerified({
    agentId: agentReg.agent!.id,
    root,
    actor,
  });
  check(
    'US-DF-agent-with-heartbeat-running-verified',
    claimHb.accepted === true && claimHb.agent?.status === 'RUNNING_VERIFIED',
    claimHb.reason,
  );

  const cycle = await runHumanCenteredSuperbrainUxCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: `${actor.universeId}-cycle`,
    actor,
    root,
    repoRoot,
  });
  check(
    'US-DF-cycle-run',
    cycle.hops.length === HUMAN_CENTERED_SUPERBRAIN_UX_CYCLE.length &&
      cycle.l4AutonomyEnabled === false &&
      cycle.tipLand === false &&
      cycle.fullProductionUxShipped === false,
    `hops=${cycle.hops.length}`,
  );

  const health = await buildHumanCenteredSuperbrainUxHealthReport({
    root,
    repoRoot,
  });
  check(
    'US-DF-health-report',
    health.honestyBanner === HONESTY_BANNER &&
      health.githubSotIssue === 123 &&
      health.gitlabCoordinationIssue === 57,
    'Health report emits SoT citations.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DF stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DF Human-Centered Superbrain UX OS stories passed.');
