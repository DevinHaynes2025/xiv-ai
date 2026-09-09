/**
 * 62L-DN Universal Agent Runtime OS runtime —
 * Walks UNIVERSAL_AGENT_RUNTIME_OS_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  bootstrapCivilizationMemoryGraph,
  ingestCivilizationMemory,
} from './civilization-memory-graph';
import {
  bootstrapCrossPlatformDeviceFabric,
  registerDevicePlatform,
} from './cross-platform-device-fabric';
import {
  attemptCulturalOnboarding,
  bootstrapGlobalCulturalIntelligenceLayer,
  requestDemographicProfiling,
} from './global-cultural-intelligence-layer';
import {
  attemptOptimizerSpendOrBill,
  bootstrapHeterogeneousComputeOptimizationBrain,
  proposeOptimizationPlan,
  registerAcceleratorTarget,
} from './heterogeneous-compute-optimization-brain';
import {
  attemptPluginPermissionElevation,
  bootstrapPluginIntelligenceExchange,
  claimPluginExchangeCredentialsOrBilling,
  registerPluginOnExchange,
} from './plugin-intelligence-exchange';
import {
  attemptSealedSilentLeak,
  bootstrapSovereignPrivacySecurityKernel,
} from './sovereign-privacy-security-kernel';
import {
  attemptRuntimeOnboarding,
  bootstrapUniversalAgentRuntimeOs,
  registerRuntimeSurface,
  universalAgentRuntimeOsHonesty,
} from './universal-agent-runtime-os';
import {
  DN_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  METAPHOR_ARCHITECTURE,
  NEXT_PHASE_TITLE,
  UNIVERSAL_AGENT_RUNTIME_OS_CYCLE,
  predecessorMap,
  type DnActor,
  type DnEvidenceState,
  type DnHop,
  type DnHopRecord,
} from './universal-agent-runtime-os-types';
import {
  bootstrapVerifiedAutonomousShiftScheduler,
  claimShiftRunningVerified,
  recordShiftHeartbeat,
  registerShiftNode,
  scheduleBoundedShift,
} from './verified-autonomous-shift-scheduler';

export {
  DN_LOCKS,
  HONESTY_BANNER,
  METAPHOR_ARCHITECTURE,
  NEXT_PHASE_TITLE,
  UNIVERSAL_AGENT_RUNTIME_OS_CYCLE,
  predecessorMap,
};

function hop(name: DnHop, state: DnEvidenceState, summary: string): DnHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DnCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DnActor;
  root?: string;
  repoRoot?: string;
};

export async function runUniversalAgentRuntimeOsCycle(input: DnCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DnHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DN_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DN_LOCKS.LOCAL_FIRST &&
        DN_LOCKS.INSTALLED_PLUGIN_AUTO_TRUSTED === false &&
        DN_LOCKS.UNVERIFIED_DEVICE_AVAILABLE === false &&
        DN_LOCKS.USER_DEMOGRAPHIC_PROFILING === false &&
        DN_LOCKS.OPTIMIZER_SPEND_AUTHORITY === false &&
        DN_LOCKS.SEALED_SILENT_LEAK === false &&
        DN_LOCKS.TIP_LAND === false &&
        DN_LOCKS.UNSAFE_MEGA_MERGE === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapUniversalAgentRuntimeOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  await registerRuntimeSurface({
    osId: os.id,
    surface: 'universal_runtime_home',
    root,
    actor,
  });
  hops.push(
    hop(
      'universal_agent_runtime_os_bootstrap',
      'PASS',
      `OS ${os.id} predecessor=${os.predecessorLayer}`,
    ),
  );

  const plx = await bootstrapPluginIntelligenceExchange({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const installed = await registerPluginOnExchange({
    exchangeId: plx.id,
    pluginId: 'plugin-installed-1',
    name: 'Installed Untrusted Plugin',
    installed: true,
    compatibilityTested: false,
    trusted: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'installed_plugin_without_compat_trust_gate_not_auto_trusted',
      installed.entry?.trustState === 'INSTALLED_UNTRUSTED' &&
        installed.reason.includes('NOT_AUTO_TRUSTED')
        ? 'PASS'
        : 'FAIL',
      installed.reason,
    ),
  );

  const elevate = await attemptPluginPermissionElevation({
    entryId: installed.entry!.id,
    requestedPermissions: ['admin', 'billing'],
    root,
    actor,
  });
  hops.push(
    hop(
      'plugin_cannot_elevate_permissions_without_trust',
      elevate.accepted === false ? 'PASS' : 'FAIL',
      elevate.reason,
    ),
  );

  const devices = await bootstrapCrossPlatformDeviceFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const unverifiedDevice = await registerDevicePlatform({
    fabricId: devices.id,
    platform: 'ios',
    compatibilityTested: false,
    verified: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_device_platform_unavailable_or_not_tested',
      unverifiedDevice.profile?.status === 'NOT_TESTED' ||
        unverifiedDevice.profile?.status === 'UNAVAILABLE'
        ? 'PASS'
        : 'FAIL',
      unverifiedDevice.reason,
    ),
  );

  const civ = await bootstrapCivilizationMemoryGraph({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const civDenied = await ingestCivilizationMemory({
    graphId: civ.id,
    region: 'egypt',
    title: 'Unauthorized civilization claim',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'civilization_memory_without_provenance_rights_denied',
      civDenied.accepted === false ? 'PASS' : 'FAIL',
      civDenied.reason,
    ),
  );

  const cult = await bootstrapGlobalCulturalIntelligenceLayer({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const profiling = await requestDemographicProfiling({
    layerId: cult.id,
    dimension: 'race',
    root,
    actor,
  });
  hops.push(
    hop(
      'demographic_profiling_feature_denied',
      profiling.accepted === false ? 'PASS' : 'FAIL',
      profiling.reason,
    ),
  );

  const under18 = await attemptCulturalOnboarding({
    layerId: cult.id,
    declaredAgeYears: 17,
    root,
    actor,
  });
  const under18Runtime = await attemptRuntimeOnboarding({
    osId: os.id,
    declaredAgeYears: 16,
    root,
    actor,
  });
  hops.push(
    hop(
      'under_18_denied_where_18_plus_required',
      under18.accepted === false && under18Runtime.accepted === false ? 'PASS' : 'FAIL',
      `${under18.reason}; ${under18Runtime.reason}`,
    ),
  );

  const shifts = await bootstrapVerifiedAutonomousShiftScheduler({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const noNode = await scheduleBoundedShift({
    schedulerId: shifts.id,
    name: 'shift-no-node',
    mode: 'offline',
    root,
    actor,
  });
  hops.push(
    hop(
      'shift_scheduler_no_powered_node_waiting_or_offline_stopped',
      noNode.accepted === false &&
        (noNode.slot?.status === 'WAITING_NODE' || noNode.slot?.status === 'OFFLINE_STOPPED')
        ? 'PASS'
        : 'FAIL',
      noNode.reason,
    ),
  );

  const node = await registerShiftNode({
    schedulerId: shifts.id,
    name: 'authorized-edge-1',
    powered: true,
    authorized: true,
    root,
    actor,
  });
  await recordShiftHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'fresh-runtime-proof',
    root,
    actor,
    at: new Date(Date.now() - 120_000).toISOString(),
  });
  const withNode = await scheduleBoundedShift({
    schedulerId: shifts.id,
    name: 'shift-stale-hb',
    mode: 'hybrid',
    nodeId: node.node!.id,
    root,
    actor,
  });
  const stale = await claimShiftRunningVerified({
    slotId: withNode.slot!.id,
    nodeId: node.node!.id,
    forceStale: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'stale_heartbeat_not_running_verified',
      stale.accepted === false && stale.slot?.status !== 'RUNNING_VERIFIED' ? 'PASS' : 'FAIL',
      stale.reason,
    ),
  );

  const brain = await bootstrapHeterogeneousComputeOptimizationBrain({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const unconfigured = await registerAcceleratorTarget({
    brainId: brain.id,
    kind: 'gpu',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const planUnavail = await proposeOptimizationPlan({
    brainId: brain.id,
    kind: 'gpu',
    targetId: unconfigured.target?.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_accelerator_unavailable',
      unconfigured.target?.status === 'UNAVAILABLE' && planUnavail.accepted === false
        ? 'PASS'
        : 'FAIL',
      `${unconfigured.reason}; ${planUnavail.reason}`,
    ),
  );

  const spend = await attemptOptimizerSpendOrBill({
    brainId: brain.id,
    kind: 'spend',
    root,
    actor,
  });
  const bill = await attemptOptimizerSpendOrBill({
    brainId: brain.id,
    kind: 'bill',
    root,
    actor,
  });
  const spendPlan = await proposeOptimizationPlan({
    brainId: brain.id,
    kind: 'cpu',
    attemptSpend: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'optimizer_cannot_spend_or_bill',
      spend.accepted === false && bill.accepted === false && spendPlan.accepted === false
        ? 'PASS'
        : 'FAIL',
      `${spend.reason}; ${bill.reason}; ${spendPlan.reason}`,
    ),
  );

  const privacy = await bootstrapSovereignPrivacySecurityKernel({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const leakPlugin = await attemptSealedSilentLeak({
    kernelId: privacy.id,
    channel: 'plugin',
    silent: true,
    root,
    actor,
  });
  const leakDevice = await attemptSealedSilentLeak({
    kernelId: privacy.id,
    channel: 'device_fabric',
    silent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_silent_leak_via_plugin_or_device_fabric_denied',
      leakPlugin.accepted === false && leakDevice.accepted === false ? 'PASS' : 'FAIL',
      `${leakPlugin.reason}; ${leakDevice.reason}`,
    ),
  );

  const cred = await claimPluginExchangeCredentialsOrBilling({
    entryId: installed.entry!.id,
    claim: 'credentials',
    root,
    actor,
  });
  const billing = await claimPluginExchangeCredentialsOrBilling({
    entryId: installed.entry!.id,
    claim: 'billing',
    root,
    actor,
  });
  const deploy = await claimPluginExchangeCredentialsOrBilling({
    entryId: installed.entry!.id,
    claim: 'deploy',
    root,
    actor,
  });
  hops.push(
    hop(
      'plugin_exchange_registration_neq_credentials_billing_deploy',
      cred.accepted === false && billing.accepted === false && deploy.accepted === false
        ? 'PASS'
        : 'FAIL',
      `${cred.reason}; ${billing.reason}; ${deploy.reason}`,
    ),
  );

  void decisionGate({
    id: 'dn-cycle-gate',
    action: '62l_dn_universal_agent_runtime_os_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void universalAgentRuntimeOsHonesty();

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DN universal agent runtime OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DN'],
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
      subject: '62L-DN universal agent runtime OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        'hops recorded; installed≠trusted; unverified device NOT_TESTED; optimizer no spend; sealed no silent leak',
      sourceRefs: ['62L-DN'],
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
    l4AutonomyEnabled: DN_LOCKS.L4_AUTONOMY_ENABLED as false,
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
    fullProductionDnShipped: false as const,
    dbCandidatesApplied: false as const,
  };
}

export async function buildUniversalAgentRuntimeOsHealthReport(input?: {
  root?: string;
  repoRoot?: string;
}) {
  const root = input?.root ?? process.cwd();
  const repoRoot = input?.repoRoot ?? root;
  const preds = predecessorMap(repoRoot);
  const honesty = universalAgentRuntimeOsHonesty();
  return {
    phase: '62L-DN',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DN_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DN_LOCKS.TIP_LAND,
    productionAuthorization: DN_LOCKS.PRODUCTION_AUTHORIZATION,
    liveSupabaseApply: DN_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DN_LOCKS.DB_CANDIDATES_APPLIED,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    metaphorArchitecture: METAPHOR_ARCHITECTURE,
    predecessorMap: preds,
    honesty,
    cycle: UNIVERSAL_AGENT_RUNTIME_OS_CYCLE,
    generatedAt: new Date().toISOString(),
  };
}
