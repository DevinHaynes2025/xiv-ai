import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bootstrapCivilizationMemoryGraph,
  civilizationMemoryGraphHonesty,
  ingestCivilizationMemory,
} from './civilization-memory-graph';
import {
  bootstrapCrossPlatformDeviceFabric,
  crossPlatformDeviceFabricHonesty,
  registerDevicePlatform,
} from './cross-platform-device-fabric';
import {
  attemptCulturalOnboarding,
  bootstrapGlobalCulturalIntelligenceLayer,
  globalCulturalIntelligenceHonesty,
  requestDemographicProfiling,
} from './global-cultural-intelligence-layer';
import {
  attemptOptimizerSpendOrBill,
  bootstrapHeterogeneousComputeOptimizationBrain,
  heterogeneousComputeOptimizationHonesty,
  proposeOptimizationPlan,
  registerAcceleratorTarget,
} from './heterogeneous-compute-optimization-brain';
import {
  attemptPluginPermissionElevation,
  bootstrapPluginIntelligenceExchange,
  claimPluginExchangeCredentialsOrBilling,
  pluginIntelligenceExchangeHonesty,
  registerPluginOnExchange,
} from './plugin-intelligence-exchange';
import {
  attemptSealedSilentLeak,
  bootstrapSovereignPrivacySecurityKernel,
  sovereignPrivacySecurityKernelHonesty,
} from './sovereign-privacy-security-kernel';
import {
  attemptRuntimeOnboarding,
  bootstrapUniversalAgentRuntimeOs,
  registerRuntimeSurface,
  universalAgentRuntimeOsHonesty,
} from './universal-agent-runtime-os';
import {
  CIVILIZATION_WITHOUT_PROVENANCE_DENIED,
  DEMOGRAPHIC_PROFILING_DENIED,
  DN_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  OPTIMIZER_SPEND_BILL_DENIED,
  PLUGIN_ELEVATE_DENIED,
  PLUGIN_NOT_AUTO_TRUSTED,
  PLUGIN_REGISTRATION_NEQ_CREDENTIALS_BILLING_DEPLOY,
  SEALED_SILENT_LEAK_DENIED,
  STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
  UNCONFIGURED_ACCELERATOR_UNAVAILABLE,
  UNDER_18_DENIED,
  UNIVERSAL_AGENT_RUNTIME_OS_CYCLE,
  UNVERIFIED_DEVICE_UNAVAILABLE_OR_NOT_TESTED,
  predecessorMap,
  type DnActor,
} from './universal-agent-runtime-os-types';
import {
  buildUniversalAgentRuntimeOsHealthReport,
  runUniversalAgentRuntimeOsCycle,
} from './universal-agent-runtime-os-runtime';
import {
  bootstrapVerifiedAutonomousShiftScheduler,
  claimShiftRunningVerified,
  recordShiftHeartbeat,
  registerShiftNode,
  scheduleBoundedShift,
  verifiedAutonomousShiftSchedulerHonesty,
} from './verified-autonomous-shift-scheduler';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldn-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DnActor = {
  kind: 'runtime_os_governor',
  id: 'gov-dn-1',
  orgId: 'org-dn',
  tenantId: 'tenant-dn',
  universeId: 'univ-dn',
  role: 'governor',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DN1-cycle',
    UNIVERSAL_AGENT_RUNTIME_OS_CYCLE.join(' → ') ===
      'honesty_locks → universal_agent_runtime_os_bootstrap → installed_plugin_without_compat_trust_gate_not_auto_trusted → plugin_cannot_elevate_permissions_without_trust → unverified_device_platform_unavailable_or_not_tested → civilization_memory_without_provenance_rights_denied → demographic_profiling_feature_denied → under_18_denied_where_18_plus_required → shift_scheduler_no_powered_node_waiting_or_offline_stopped → stale_heartbeat_not_running_verified → unconfigured_accelerator_unavailable → optimizer_cannot_spend_or_bill → sealed_silent_leak_via_plugin_or_device_fabric_denied → plugin_exchange_registration_neq_credentials_billing_deploy → evidence → learning',
    'Universal Agent Runtime OS cycle recorded in order.',
  );

  check(
    'US-DN-locks',
    DN_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DN_LOCKS.INSTALLED_PLUGIN_AUTO_TRUSTED === false &&
      DN_LOCKS.PLUGIN_COMPAT_TRUST_GATE_REQUIRED === true &&
      DN_LOCKS.UNVERIFIED_DEVICE_AVAILABLE === false &&
      DN_LOCKS.CIVILIZATION_WITHOUT_PROVENANCE_ALLOWED === false &&
      DN_LOCKS.USER_DEMOGRAPHIC_PROFILING === false &&
      DN_LOCKS.DEMOGRAPHIC_PROFILING_FEATURE_OFFERED === false &&
      DN_LOCKS.UNDER_18_ONBOARDING_ALLOWED === false &&
      DN_LOCKS.STALE_HEARTBEAT_NOT_RUNNING_VERIFIED === true &&
      DN_LOCKS.UNCONFIGURED_ACCELERATOR_AVAILABLE === false &&
      DN_LOCKS.OPTIMIZER_SPEND_AUTHORITY === false &&
      DN_LOCKS.OPTIMIZER_BILLING_AUTHORITY === false &&
      DN_LOCKS.SEALED_SILENT_LEAK === false &&
      DN_LOCKS.PLUGIN_REGISTRATION_EQ_CREDENTIALS === false &&
      DN_LOCKS.PLUGIN_REGISTRATION_EQ_BILLING === false &&
      DN_LOCKS.PLUGIN_REGISTRATION_EQ_DEPLOY === false &&
      DN_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DN_LOCKS.TIP_LAND === false &&
      DN_LOCKS.UNSAFE_MEGA_MERGE === false,
    HONESTY_BANNER,
  );

  check(
    'US-DN-honesty-surfaces',
    universalAgentRuntimeOsHonesty().l4AutonomyEnabled === false &&
      pluginIntelligenceExchangeHonesty().installedPluginAutoTrusted === false &&
      crossPlatformDeviceFabricHonesty().unverifiedDeviceAvailable === false &&
      civilizationMemoryGraphHonesty().withoutProvenanceAllowed === false &&
      globalCulturalIntelligenceHonesty().demographicProfilingFeatureOffered === false &&
      verifiedAutonomousShiftSchedulerHonesty().staleHeartbeatNotRunningVerified === true &&
      heterogeneousComputeOptimizationHonesty().optimizerSpendAuthority === false &&
      sovereignPrivacySecurityKernelHonesty().sealedSilentLeak === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DN-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DO —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DN-predecessor-DK-or-better',
    preds.DK.tipProbe === 'PRESENT' ||
      preds.DM.tipProbe === 'PRESENT' ||
      preds.DL.tipProbe === 'PRESENT' ||
      preds.DJ.tipProbe === 'PRESENT',
    `DM=${preds.DM.tipProbe}/${preds.DM.report}; DL=${preds.DL.tipProbe}/${preds.DL.report}; DK=${preds.DK.tipProbe}/${preds.DK.report}`,
  );

  const os = await bootstrapUniversalAgentRuntimeOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  await registerRuntimeSurface({
    osId: os.id,
    surface: 'universal_runtime_home',
    root,
    actor,
  });
  check(
    'US-DN-bootstrap',
    os.l4AutonomyEnabled === false &&
      os.productionAuthorized === false &&
      os.tipLand === false &&
      os.coexistenceNotMegaMerge === true,
    `predecessor=${os.predecessorLayer}`,
  );

  // Installed plugin without compat/trust gate not auto-trusted / cannot elevate
  const plx = await bootstrapPluginIntelligenceExchange({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const installed = await registerPluginOnExchange({
    exchangeId: plx.id,
    pluginId: 'p-installed',
    name: 'Installed Plugin',
    installed: true,
    compatibilityTested: false,
    root,
    actor,
  });
  check(
    'US-DN-plugin-not-auto-trusted',
    installed.entry?.trustState === 'INSTALLED_UNTRUSTED' &&
      installed.reason === PLUGIN_NOT_AUTO_TRUSTED,
    installed.reason,
  );
  const elevate = await attemptPluginPermissionElevation({
    entryId: installed.entry!.id,
    requestedPermissions: ['admin'],
    root,
    actor,
  });
  check(
    'US-DN-plugin-cannot-elevate',
    elevate.accepted === false && elevate.reason === PLUGIN_ELEVATE_DENIED,
    elevate.reason,
  );

  // Unverified device → UNAVAILABLE or NOT_TESTED
  const fabric = await bootstrapCrossPlatformDeviceFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const untested = await registerDevicePlatform({
    fabricId: fabric.id,
    platform: 'android',
    compatibilityTested: false,
    root,
    actor,
  });
  check(
    'US-DN-unverified-device',
    (untested.profile?.status === 'NOT_TESTED' ||
      untested.profile?.status === 'UNAVAILABLE') &&
      untested.reason === UNVERIFIED_DEVICE_UNAVAILABLE_OR_NOT_TESTED,
    `${untested.profile?.status}: ${untested.reason}`,
  );

  // Civilization memory without provenance/rights DENIED
  const civ = await bootstrapCivilizationMemoryGraph({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const civDenied = await ingestCivilizationMemory({
    graphId: civ.id,
    region: 'africa',
    title: 'No provenance',
    authorized: true,
    provenanceRef: '',
    root,
    actor,
  });
  check(
    'US-DN-civ-no-provenance',
    civDenied.accepted === false &&
      civDenied.reason === CIVILIZATION_WITHOUT_PROVENANCE_DENIED,
    civDenied.reason,
  );

  // Demographic profiling DENIED / not offered
  const cult = await bootstrapGlobalCulturalIntelligenceLayer({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const profiling = await requestDemographicProfiling({
    layerId: cult.id,
    dimension: 'gender',
    root,
    actor,
  });
  check(
    'US-DN-demographic-profiling-denied',
    profiling.accepted === false && profiling.reason === DEMOGRAPHIC_PROFILING_DENIED,
    profiling.reason,
  );

  // Under-18 DENIED
  const under18 = await attemptCulturalOnboarding({
    layerId: cult.id,
    declaredAgeYears: 17,
    root,
    actor,
  });
  const under18Os = await attemptRuntimeOnboarding({
    osId: os.id,
    declaredAgeYears: 15,
    root,
    actor,
  });
  check(
    'US-DN-under-18-denied',
    under18.accepted === false &&
      under18.reason === UNDER_18_DENIED &&
      under18Os.accepted === false &&
      under18Os.reason === UNDER_18_DENIED,
    `${under18.reason}; ${under18Os.reason}`,
  );

  // Shift scheduler: no powered node → WAITING_NODE or OFFLINE_STOPPED
  const sched = await bootstrapVerifiedAutonomousShiftScheduler({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const noNode = await scheduleBoundedShift({
    schedulerId: sched.id,
    name: 'lonely-shift',
    root,
    actor,
  });
  check(
    'US-DN-shift-no-node',
    noNode.accepted === false &&
      (noNode.slot?.status === 'WAITING_NODE' || noNode.slot?.status === 'OFFLINE_STOPPED') &&
      noNode.reason === NO_POWERED_NODE_WAITING_OR_STOPPED,
    `${noNode.slot?.status}: ${noNode.reason}`,
  );

  // Stale heartbeat → not RUNNING_VERIFIED
  const node = await registerShiftNode({
    schedulerId: sched.id,
    name: 'node-1',
    powered: true,
    authorized: true,
    root,
    actor,
  });
  await recordShiftHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'proof',
    root,
    actor,
    at: new Date(Date.now() - 180_000).toISOString(),
  });
  const slot = await scheduleBoundedShift({
    schedulerId: sched.id,
    name: 'stale-shift',
    nodeId: node.node!.id,
    root,
    actor,
  });
  const stale = await claimShiftRunningVerified({
    slotId: slot.slot!.id,
    nodeId: node.node!.id,
    forceStale: true,
    root,
    actor,
  });
  check(
    'US-DN-stale-heartbeat',
    stale.accepted === false &&
      stale.slot?.status !== 'RUNNING_VERIFIED' &&
      stale.reason === STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
    `${stale.slot?.status}: ${stale.reason}`,
  );

  // Fresh path evidence (not production authorization)
  await recordShiftHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'fresh-proof',
    root,
    actor,
  });
  const freshSlot = await scheduleBoundedShift({
    schedulerId: sched.id,
    name: 'fresh-shift',
    nodeId: node.node!.id,
    root,
    actor,
  });
  const fresh = await claimShiftRunningVerified({
    slotId: freshSlot.slot!.id,
    nodeId: node.node!.id,
    root,
    actor,
  });
  check(
    'US-DN-fresh-running-verified-evidence-only',
    fresh.accepted === true && fresh.slot?.status === 'RUNNING_VERIFIED',
    fresh.reason,
  );

  // Unconfigured accelerator → UNAVAILABLE
  const brain = await bootstrapHeterogeneousComputeOptimizationBrain({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const uncfg = await registerAcceleratorTarget({
    brainId: brain.id,
    kind: 'npu',
    configured: false,
    root,
    actor,
  });
  check(
    'US-DN-unconfigured-accelerator',
    uncfg.accepted === false &&
      uncfg.target?.status === 'UNAVAILABLE' &&
      uncfg.reason === UNCONFIGURED_ACCELERATOR_UNAVAILABLE,
    uncfg.reason,
  );

  // Optimizer cannot spend/bill
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
    kind: 'gpu',
    attemptBill: true,
    root,
    actor,
  });
  check(
    'US-DN-optimizer-no-spend-bill',
    spend.accepted === false &&
      bill.accepted === false &&
      spendPlan.accepted === false &&
      spend.reason === OPTIMIZER_SPEND_BILL_DENIED,
    `${spend.reason}; ${bill.reason}; ${spendPlan.reason}`,
  );

  // Sealed silent leak via plugin/device fabric DENIED
  const kernel = await bootstrapSovereignPrivacySecurityKernel({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const leakP = await attemptSealedSilentLeak({
    kernelId: kernel.id,
    channel: 'plugin',
    silent: true,
    root,
    actor,
  });
  const leakD = await attemptSealedSilentLeak({
    kernelId: kernel.id,
    channel: 'device_fabric',
    silent: true,
    root,
    actor,
  });
  check(
    'US-DN-sealed-silent-leak-denied',
    leakP.accepted === false &&
      leakD.accepted === false &&
      leakP.reason === SEALED_SILENT_LEAK_DENIED &&
      leakD.reason === SEALED_SILENT_LEAK_DENIED,
    `${leakP.reason}; ${leakD.reason}`,
  );

  // Plugin exchange registration ≠ credentials/billing/deploy
  const cred = await claimPluginExchangeCredentialsOrBilling({
    entryId: installed.entry!.id,
    claim: 'credentials',
    root,
    actor,
  });
  const billClaim = await claimPluginExchangeCredentialsOrBilling({
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
  check(
    'US-DN-plugin-reg-neq-cred-bill-deploy',
    cred.accepted === false &&
      billClaim.accepted === false &&
      deploy.accepted === false &&
      cred.reason === PLUGIN_REGISTRATION_NEQ_CREDENTIALS_BILLING_DEPLOY,
    `${cred.reason}; ${billClaim.reason}; ${deploy.reason}`,
  );

  const cycle = await runUniversalAgentRuntimeOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: 'univ-dn-cycle',
    actor: { ...actor, universeId: 'univ-dn-cycle' },
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter(
    (h) => h.state === 'FAIL' && h.hop !== 'learning',
  );
  check(
    'US-DN-cycle-runner',
    cycle.l4AutonomyEnabled === false &&
      cycle.tipLand === false &&
      cycle.productionAuthorized === false &&
      cycle.githubSotIssue === 131 &&
      cycle.gitlabCoordinationIssue === 65 &&
      failedHops.length === 0,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildUniversalAgentRuntimeOsHealthReport({ root, repoRoot });
  check(
    'US-DN-health-report',
    health.phase === '62L-DN' &&
      health.l4AutonomyEnabled === false &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false,
    `phase=${health.phase}`,
  );
} catch (err) {
  failures.push(`UNCAUGHT: ${(err as Error).stack ?? String(err)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log('OK 62L-DN Universal Agent Runtime OS — all required stories passed');
