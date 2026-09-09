import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  denyTrustCircleSurveillance,
  joinTrustCircle,
  moderateImagery,
} from './adult-trust-circle-social-fabric';
import {
  accessCortexNode,
  probeCortexProvider,
  registerCortexNode,
} from './cortex-foundation';
import {
  accessSealedSuperhighwayNode,
  enrollSuperhighwayNode,
  probeDigitalTwinAuthority,
  probeOfflineSuperhighwayNode,
  probeSuperhighwayRunningVerified,
  requestAgentHandoff,
} from './cross-device-agent-superhighway';
import {
  calibrateForecast,
  runBacktest,
  runHistoricalSimulation,
} from './historical-simulation-engine';
import {
  denyCovertCapture,
  probeMultimodalCaptureDefaults,
} from './multimodal-command-center';
import {
  attemptVaultAccess,
  navigateWarehouse,
  runPermissionAwareSearch,
  storeVaultObject,
} from './personal-data-vault-search-os';
import {
  probeSemiconductorRunningVerified,
  routeChipWorkload,
} from './semiconductor-intelligence-brain';
import {
  createSupplyChainTwin,
  detectBottleneckAdvisory,
  registerConnectorAdapter,
} from './supply-chain-digital-twin-network';
import {
  bootstrapUniversalDataIndustryCortex,
  universalDataIndustryCortexHonesty,
} from './universal-data-industry-cortex';
import {
  ADULT_AGE_GATE_REQUIRED,
  BACKTEST_NEQ_PREDICTION,
  BOTTLENECK_ADVISORY_ONLY,
  CHIP_NEQ_FAB_CONTROL,
  CORTEX_DENIED,
  COVERT_CAPTURE_DENIED,
  DV_LOCKS,
  FORECAST_LABELED_ONLY,
  HEARTBEAT_REQUIRED_FOR_RUNNING,
  HONESTY_BANNER,
  LABEL_NEQ_CORTEX_ACCESS,
  MINOR_TRUST_DENIED,
  MULTIMODAL_CAPTURE_OFF,
  NEURAL_SUPERHIGHWAY_SEALED_DENIED,
  NEXT_PHASE_TITLE,
  NON_CONSENSUAL_DENIED,
  OFFLINE_WAITING_OR_STOPPED,
  PRODUCT_PHILOSOPHY,
  SEARCH_WITHOUT_PERMISSION,
  SEMICONDUCTOR_EVIDENCE_REQUIRED,
  SIM_NEQ_FACT,
  TRUST_SURVEILLANCE_DENIED,
  TWIN_NEQ_CONTROL,
  TWIN_NEQ_FOUNDER,
  UNAUTHORIZED_ADAPTER,
  UNAUTHORIZED_CHIP_SOURCE,
  UNCONFIGURED_CORTEX_PROVIDER,
  UNENROLLED_HANDOFF_DENIED,
  UNIVERSAL_DATA_INDUSTRY_CORTEX_CYCLE,
  VAULT_ACL_CROSS_CONTEXT,
  WAREHOUSE_NAV_DENIED,
  predecessorMap,
  type DvActor,
} from './universal-data-industry-cortex-types';
import {
  buildUniversalDataIndustryCortexHealthReport,
  runUniversalDataIndustryCortexCycle,
} from './universal-data-industry-cortex-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldv-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DvActor = {
  kind: 'data_industry_cortex_curator',
  id: 'test-curator',
  orgId: 'org-dv',
  tenantId: 'tenant-dv',
  universeId: 'universe-dv',
};
const twinActor: DvActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DV_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DV_LOCKS.TIP_LAND === false &&
      DV_LOCKS.TWIN_EQ_PHYSICAL_CONTROL === false &&
      DV_LOCKS.SIM_EQ_VERIFIED_FACT === false &&
      DV_LOCKS.VAULT_CROSS_CONTEXT_LEAKAGE === false &&
      DV_LOCKS.MINORS_IN_TRUST_CIRCLE === false &&
      DV_LOCKS.PUBLIC_LAUNCH_AUTHORIZED === false &&
      PRODUCT_PHILOSOPHY.evidenceBeforeOperationalClaims === true &&
      UNIVERSAL_DATA_INDUSTRY_CORTEX_CYCLE.includes('vault_acl_cross_context_denied'),
    'locks + philosophy + cycle present',
  );

  const os = await bootstrapUniversalDataIndustryCortex({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_universal_data_industry_cortex',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.publicLaunchAuthorized === false &&
      (os.predecessorLayer === 'DU' || os.predecessorLayer === 'DT') &&
      (os.softWiredPredecessors.includes('DU') ||
        os.softWiredPredecessors.includes('DT')),
    `os=${os.id}; predecessor=${os.predecessorLayer}; soft=${os.softWiredPredecessors.join(',')}`,
  );

  // A
  const cortex = await registerCortexNode({
    name: 'foundation',
    domain: 'data',
    sealed: true,
    root,
    actor,
  });
  const deny = await accessCortexNode({
    nodeId: cortex.id,
    labelPresent: false,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'cortex_deny_by_default',
    deny.status === 'denied' && deny.reason === CORTEX_DENIED,
    deny.reason,
  );
  const label = await accessCortexNode({
    nodeId: cortex.id,
    labelPresent: true,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'label_alone_neq_cortex_access',
    label.status === 'denied' && label.reason === LABEL_NEQ_CORTEX_ACCESS,
    label.reason,
  );
  const provider = await probeCortexProvider({
    providerId: 'cortex-stub',
    configured: false,
    claimAvailable: true,
    root,
    actor,
  });
  check(
    'unconfigured_cortex_provider_unavailable',
    provider.availability === 'UNAVAILABLE' &&
      provider.status === 'denied' &&
      provider.reason === UNCONFIGURED_CORTEX_PROVIDER,
    provider.reason,
  );

  // B
  const vault = await storeVaultObject({
    ownerContextId: 'ctx-owner',
    label: 'pii-blob',
    root,
    actor,
  });
  const cross = await attemptVaultAccess({
    objectId: vault.id,
    ownerContextId: 'ctx-owner',
    requestContextId: 'ctx-other',
    root,
    actor,
  });
  check(
    'vault_acl_cross_context_denied',
    vault.encrypted === true &&
      cross.status === 'denied' &&
      cross.reason === VAULT_ACL_CROSS_CONTEXT,
    cross.reason,
  );
  const search = await runPermissionAwareSearch({
    query: 'sku',
    contextId: 'ctx-owner',
    aclGranted: false,
    root,
    actor,
  });
  check(
    'search_without_permission_denied',
    search.status === 'denied' &&
      search.crossContextLeakage === false &&
      search.reason === SEARCH_WITHOUT_PERMISSION,
    search.reason,
  );
  const wh = await navigateWarehouse({
    warehouseId: 'lakehouse-1',
    labelPresent: true,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'warehouse_nav_deny_by_default',
    wh.status === 'denied' && wh.reason === WAREHOUSE_NAV_DENIED,
    wh.reason,
  );

  // C
  const twin = await createSupplyChainTwin({
    name: 'network-twin',
    attemptPhysicalControl: true,
    root,
    actor,
  });
  check(
    'twin_neq_physical_control',
    twin.physicalControlAuthorized === false &&
      twin.status === 'denied' &&
      twin.reason === TWIN_NEQ_CONTROL,
    twin.reason,
  );
  const adapter = await registerConnectorAdapter({
    kind: 'ERP',
    connectorAuthorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_wms_tms_erp_adapter_denied',
    adapter.status === 'denied' && adapter.reason === UNAUTHORIZED_ADAPTER,
    adapter.reason,
  );
  const bn = await detectBottleneckAdvisory({
    twinId: twin.id,
    signal: 'carrier-delay',
    attemptPhysicalControl: true,
    root,
    actor,
  });
  check(
    'bottleneck_advisory_neq_control',
    bn.advisoryOnly === true &&
      bn.physicalControl === false &&
      bn.reason === BOTTLENECK_ADVISORY_ONLY,
    bn.reason,
  );

  // D
  const fab = await routeChipWorkload({
    family: 'GPU',
    workload: 'batch',
    sourceAuthorized: true,
    attemptFabRemoteControl: true,
    root,
    actor,
  });
  check(
    'chip_workload_neq_fab_remote_control',
    fab.fabRemoteControl === false &&
      fab.status === 'denied' &&
      fab.reason === CHIP_NEQ_FAB_CONTROL,
    fab.reason,
  );
  const route = await routeChipWorkload({
    family: 'NVIDIA',
    workload: 'inference',
    sourceAuthorized: true,
    root,
    actor,
  });
  const sem = await probeSemiconductorRunningVerified({
    routeId: route.id,
    heartbeatFresh: false,
    runtimeEvidencePresent: false,
    root,
    actor,
  });
  check(
    'semiconductor_running_verified_needs_evidence',
    sem.state === 'NOT_VERIFIED' && sem.reason === SEMICONDUCTOR_EVIDENCE_REQUIRED,
    sem.reason,
  );
  const badSrc = await routeChipWorkload({
    family: 'AMD',
    workload: 'map',
    sourceAuthorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_chip_intel_source_denied',
    badSrc.status === 'denied' && badSrc.reason === UNAUTHORIZED_CHIP_SOURCE,
    badSrc.reason,
  );

  // E
  const sim = await runHistoricalSimulation({
    scenario: 'disruption',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'sim_neq_verified_fact',
    sim.verifiedFact === false &&
      sim.labeledSimulation === true &&
      sim.reason === SIM_NEQ_FACT,
    sim.reason,
  );
  const bt = await runBacktest({
    datasetRef: 'lanes-2023',
    claimVerifiedPrediction: true,
    root,
    actor,
  });
  check(
    'backtest_neq_verified_prediction',
    bt.verifiedPrediction === false && bt.reason === BACKTEST_NEQ_PREDICTION,
    bt.reason,
  );
  const fc = await calibrateForecast({
    modelRef: 'eta-v2',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'forecast_calibration_labeled_only',
    fc.verifiedFact === false && fc.reason === FORECAST_LABELED_ONLY,
    fc.reason,
  );

  // F
  const mm = await probeMultimodalCaptureDefaults({
    modality: 'camera',
    claimDefaultOn: true,
    root,
    actor,
  });
  check(
    'multimodal_capture_defaults_off',
    mm.captureDefaultOn === false &&
      mm.status === 'denied' &&
      mm.reason === MULTIMODAL_CAPTURE_OFF,
    mm.reason,
  );
  const covert = await denyCovertCapture({ modality: 'vision', root, actor });
  check(
    'covert_capture_denied',
    covert.status === 'denied' && covert.reason === COVERT_CAPTURE_DENIED,
    covert.reason,
  );

  // G
  const minor = await joinTrustCircle({
    subjectId: 'minor-1',
    ageVerifiedAdult: false,
    claimMinorAllowed: true,
    root,
    actor,
  });
  check(
    'minor_trust_circle_access_denied',
    minor.status === 'denied' && minor.reason === MINOR_TRUST_DENIED,
    minor.reason,
  );
  const img = await moderateImagery({ consensual: false, root, actor });
  check(
    'non_consensual_imagery_denied',
    img.status === 'denied' && img.reason === NON_CONSENSUAL_DENIED,
    img.reason,
  );
  const age = await joinTrustCircle({
    subjectId: 'unverified',
    ageVerifiedAdult: false,
    root,
    actor,
  });
  check(
    'adult_age_gate_required',
    age.status === 'denied' && age.reason === ADULT_AGE_GATE_REQUIRED,
    age.reason,
  );
  const surv = await denyTrustCircleSurveillance({
    kind: 'covert_emotion_detection',
    root,
    actor,
  });
  check(
    'trust_circle_surveillance_profiling_denied',
    surv.status === 'denied' && surv.reason === TRUST_SURVEILLANCE_DENIED,
    surv.reason,
  );

  // H
  const sh = await enrollSuperhighwayNode({
    deviceId: 'laptop-1',
    enrolled: true,
    sealed: true,
    root,
    actor,
    repoRoot,
  });
  const handoff = await requestAgentHandoff({
    fromDeviceId: 'laptop-1',
    toDeviceId: 'phone-x',
    peerEnrolled: false,
    authenticated: false,
    root,
    actor,
  });
  check(
    'unenrolled_peer_handoff_denied',
    handoff.status === 'denied' && handoff.reason === UNENROLLED_HANDOFF_DENIED,
    handoff.reason,
  );
  const running = await probeSuperhighwayRunningVerified({
    nodeId: sh.id,
    heartbeatFresh: false,
    runtimeEvidencePresent: true,
    root,
    actor,
  });
  check(
    'running_verified_requires_heartbeat',
    running.state === 'DENIED' && running.reason === HEARTBEAT_REQUIRED_FOR_RUNNING,
    running.reason,
  );
  const offline = await probeOfflineSuperhighwayNode({
    poweredAuthorizedNode: false,
    preferWaiting: true,
    root,
    actor,
  });
  check(
    'offline_without_powered_node_waiting_or_stopped',
    offline.state === 'WAITING_NODE' && offline.reason === OFFLINE_WAITING_OR_STOPPED,
    offline.reason,
  );
  const twinAuth = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twinAuth.status === 'denied' && twinAuth.reason === TWIN_NEQ_FOUNDER,
    twinAuth.reason,
  );
  const sealed = await accessSealedSuperhighwayNode({
    nodeId: sh.id,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'neural_superhighway_sealed_deny_by_default',
    sealed.status === 'denied' &&
      sh.grantsAuthority === false &&
      sealed.reason === NEURAL_SUPERHIGHWAY_SEALED_DENIED,
    sealed.reason,
  );

  const cycle = await runUniversalDataIndustryCortexCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_all_required_stories',
    failedHops.length === 0 &&
      cycle.tipLand === false &&
      cycle.productionAuthorized === false &&
      cycle.publicLaunchAuthorized === false &&
      cycle.githubSotIssue === 139 &&
      cycle.gitlabCoordinationIssue === 73,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildUniversalDataIndustryCortexHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report_healthy',
    health.status === 'HEALTHY' && health.nextPhaseTitle === NEXT_PHASE_TITLE,
    `status=${health.status}`,
  );

  const honesty = universalDataIndustryCortexHonesty(repoRoot);
  const preds = predecessorMap(repoRoot);
  check(
    'honesty_and_predecessor_probe',
    honesty.banner === HONESTY_BANNER &&
      honesty.l4AutonomyEnabled === false &&
      preds.DT.tipProbe === 'PRESENT' &&
      preds.DS.tipProbe === 'PRESENT' &&
      (preds.DU.tipProbe === 'PRESENT' || preds.DU.tipProbe === 'WAITING_DATA') &&
      (honesty.softWiredPredecessors.includes('DT') ||
        honesty.softWiredPredecessors.includes('DU')),
    `predecessor=${honesty.predecessorLayer}; DU=${preds.DU.tipProbe}; DT=${preds.DT.tipProbe}; DS=${preds.DS.tipProbe}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DV stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DV Universal Data & Industry Cortex stories passed');
