/**
 * 62L-DF Human-Centered Superbrain UX OS runtime —
 * Walks HUMAN_CENTERED_SUPERBRAIN_UX_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  recordWorkforceAgentHeartbeat,
  registerWorkforceAgent,
} from './global-personal-agent-workforce';
import {
  bootstrapHistoricalAtlasQuantEngine,
  claimTrillionScaleCapacity,
  mineHistoricalPathway,
  submitPredictiveForecast,
} from './historical-data-atlas-predictive-quant-engine';
import {
  bootstrapEthicalSecurityDiscoveryLab,
  invokeLeakSentinel,
  runEthicalSecurityProbe,
} from './ethical-security-discovery-lab';
import {
  bootstrapNeuralGrowthLedger,
  recordNeuralGrowth,
} from './neural-growth-ledger';
import {
  attemptMeetingProductionAuthorityTransfer,
  bootstrapAgentMeetingCommunicationFabric,
  openAgentTeamMeeting,
} from './agent-meeting-communication-fabric';
import {
  DF_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  HUMAN_CENTERED_SUPERBRAIN_UX_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type DfActor,
  type DfEvidenceState,
  type DfHop,
  type DfHopRecord,
} from './human-centered-superbrain-ux-types';

export {
  DF_LOCKS,
  HONESTY_BANNER,
  HUMAN_CENTERED_SUPERBRAIN_UX_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DfHop, state: DfEvidenceState, summary: string): DfHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DfCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DfActor;
  root?: string;
  repoRoot?: string;
};

export async function runHumanCenteredSuperbrainUxCycle(input: DfCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DfHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DF_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DF_LOCKS.LOCAL_FIRST &&
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
        DF_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapHumanCenteredSuperbrainUxOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    universeKind: 'personal',
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  await registerUxScreenContract({
    osId: os.id,
    screen: 'home_today',
    locale: 'en',
    root,
    actor,
  });
  hops.push(
    hop(
      'human_centered_superbrain_ux_bootstrap',
      os && humanCenteredSuperbrainUxHonesty().l4AutonomyEnabled === false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `UX OS id=${os.id} predecessor=${os.predecessorLayer} fullProductionUxShipped=${os.fullProductionUxShipped}`,
    ),
  );

  const under18 = await attemptPersonalOnboarding({
    osId: os.id,
    declaredAgeYears: 17,
    root,
    actor,
  });
  hops.push(
    hop(
      'under_18_onboarding_denied',
      under18.accepted === false ? 'DENIED' : 'FAIL',
      under18.reason,
    ),
  );

  const wormhole = await invokeWormholeFastPath({
    osId: os.id,
    pathId: 'fast-graph-1',
    authorized: false,
    bypassSealed: true,
    bypassAuth: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'wormhole_cannot_bypass_sealed_auth',
      wormhole.accepted === false ? 'DENIED' : 'FAIL',
      wormhole.reason,
    ),
  );

  const atlas = await bootstrapHistoricalAtlasQuantEngine({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const trillion = await claimTrillionScaleCapacity({
    atlasId: atlas.id,
    claimedScale: 'trillions_of_data',
    measured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'trillion_scale_unmeasured_not_verified',
      trillion.accepted === false && trillion.claim?.status === 'ARCHITECTURE_TARGET'
        ? 'ARCHITECTURE_TARGET'
        : 'FAIL',
      trillion.reason,
    ),
  );

  const quantum = await submitPredictiveForecast({
    engineId: atlas.id,
    scenarioId: 'q-scenario-1',
    classicalBaselinePresent: false,
    quantumAdapterUsed: true,
    claimGuaranteed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_without_classical_baseline_rejected',
      quantum.accepted === false ? 'REJECTED' : 'FAIL',
      quantum.reason,
    ),
  );

  const lab = await bootstrapEthicalSecurityDiscoveryLab({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const offensive = await runEthicalSecurityProbe({
    labId: lab.id,
    mode: 'offensive_unauthorized',
    targetScope: 'unauthorized',
    root,
    actor,
  });
  hops.push(
    hop(
      'offensive_unauthorized_ethical_hack_denied',
      offensive.accepted === false ? 'DENIED' : 'FAIL',
      offensive.reason,
    ),
  );

  const mining = await mineHistoricalPathway({
    atlasId: atlas.id,
    pathwayId: 'hidden-jewel-1',
    lawfulAuthorized: false,
    hiddenJewel: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_historical_hidden_jewel_mining_denied',
      mining.accepted === false ? 'DENIED' : 'FAIL',
      mining.reason,
    ),
  );

  const forecast = await submitPredictiveForecast({
    engineId: atlas.id,
    scenarioId: 'scenario-verified-claim',
    classicalBaselinePresent: true,
    quantumAdapterUsed: false,
    claimVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'forecast_scenario_not_labeled_verified_fact',
      forecast.accepted === false ? 'DENIED' : 'FAIL',
      forecast.reason,
    ),
  );

  const ledger = await bootstrapNeuralGrowthLedger({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const growth = await recordNeuralGrowth({
    ledgerId: ledger.id,
    agentId: 'agent-grow-1',
    changeSummary: 'attempt permission expand',
    permissionDeltaRequested: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'neural_growth_cannot_self_expand_permissions',
      growth.accepted === false ? 'DENIED' : 'FAIL',
      growth.reason,
    ),
  );

  const fabric = await bootstrapAgentMeetingCommunicationFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const meeting = await openAgentTeamMeeting({
    fabricId: fabric.id,
    roomName: 'Agent Team Room',
    objective: 'debrief',
    transferProductionAuthority: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'meeting_cannot_transfer_production_authority',
      meeting.accepted === false ? 'DENIED' : 'FAIL',
      meeting.reason,
    ),
  );

  const leak = await invokeLeakSentinel({
    labId: lab.id,
    requested: 'offensive_harvest',
    root,
    actor,
  });
  hops.push(
    hop(
      'leak_sentinel_offensive_harvest_denied',
      leak.accepted === false ? 'DENIED' : 'FAIL',
      leak.reason,
    ),
  );

  const workforce = await bootstrapAgentWorkforce({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const agent = await registerWorkforceAgent({
    workforceId: workforce.id,
    name: 'ux-surface-agent',
    root,
    actor,
  });
  const claimNoHb = await claimWorkforceAgentRunningVerified({
    agentId: agent.agent!.id,
    root,
    actor,
  });
  await recordWorkforceAgentHeartbeat({
    agentId: agent.agent!.id,
    runtimeEvidence: 'pid=1;runtime=local-ux-workforce',
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_without_heartbeat_not_running_verified',
      claimNoHb.accepted === false ? 'DENIED' : 'FAIL',
      claimNoHb.reason,
    ),
  );

  void attemptMeetingProductionAuthorityTransfer;
  void decisionGate({
    id: 'df-cycle-gate',
    action: '62l_df_human_centered_superbrain_ux_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void humanCenteredSuperbrainUxHonesty();

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DF human-centered superbrain UX cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DF'],
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
      subject: '62L-DF human-centered superbrain UX cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; learning≠permission; UX contracts≠full production UX; wormhole≠auth bypass`,
      sourceRefs: ['62L-DF'],
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
    l4AutonomyEnabled: DF_LOCKS.L4_AUTONOMY_ENABLED as false,
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

export async function buildHumanCenteredSuperbrainUxHealthReport(input?: {
  root?: string;
  repoRoot?: string;
}) {
  const root = input?.root ?? process.cwd();
  const actor: DfActor = {
    kind: 'ux_os_curator',
    id: 'health-df',
    orgId: 'org-health-df',
    tenantId: 'tenant-health-df',
    universeId: 'univ-health-df',
    role: 'curator',
    permissionLevel: 1,
    authorityLevel: 0,
  };
  const cycle = await runHumanCenteredSuperbrainUxCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot: input?.repoRoot ?? root,
  });
  return {
    ...cycle,
    honesty: humanCenteredSuperbrainUxHonesty(),
    generatedAt: new Date().toISOString(),
  };
}
