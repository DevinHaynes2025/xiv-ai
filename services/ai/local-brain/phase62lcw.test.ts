import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  claimLaboratoryRunningVerified,
  offlineAgentLaboratoriesHonesty,
  recordLaboratoryHeartbeat,
  registerOfflineLaboratory,
  setLaboratoryDevicesPower,
} from './persistent-offline-agent-laboratories';
import {
  experimentGraphHonesty,
  proposeExperimentGraphNode,
  registerRootExperimentGraphNode,
} from './distributed-model-tool-experiment-graph';
import {
  intakeLakehouseObject,
  knowledgeLakehouseHonesty,
} from './global-knowledge-lakehouse';
import {
  adaptiveComputeFabricHonesty,
  placeComputeWorkload,
  registerAdaptiveComputeTarget,
} from './adaptive-compute-fabric';
import {
  algorithmDiscoveryFoundryHonesty,
  proposeAlgorithmDiscovery,
} from './scientific-algorithm-discovery-foundry';
import {
  authorizeUniverseReplicationLink,
  signReplicationPayload,
  submitIntelligenceReplicationPack,
  universeReplicationHonesty,
} from './universe-intelligence-replication-network';
import {
  ALL_DEVICES_OFFLINE_WAITING_OR_STOPPED,
  ALGORITHM_NOT_VERIFIED_WITHOUT_REPRO,
  AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_CYCLE,
  CW_LOCKS,
  HONESTY_BANNER,
  LINEAGE_REQUIRED,
  NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  REVOKED_REPLICATION_REJECTED,
  SEALED_SILENT_CLOUD_COMPUTE_DENIED,
  UNAUTHORIZED_UNIVERSE_REPLICATION_DENIED,
  UNKNOWN_RIGHTS_LAKEHOUSE_DENIED,
  UNSIGNED_REPLICATION_REJECTED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  predecessorMap,
  type CwActor,
} from './autonomous-research-infrastructure-os-types';
import {
  buildAutonomousResearchInfrastructureOsHealthReport,
  runAutonomousResearchInfrastructureOsCycle,
} from './autonomous-research-infrastructure-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcw-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CwActor = {
  kind: 'research_infra_curator',
  id: 'curator-cw-1',
  orgId: 'org-cw',
  tenantId: 'tenant-cw',
  universeId: 'univ-cw',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-CW1-cycle',
    AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_CYCLE.join(' → ') ===
      'honesty_locks → research_infra_os_bootstrap → offline_lab_all_devices_powered_off → heartbeat_missing_not_running_verified → experiment_model_tool_lineage_required → unauthorized_universe_replication_denied → unsigned_revoked_replication_pack_rejected → unconfigured_accelerator_qpu_unavailable → quantum_without_classical_baseline_rejected → unknown_rights_lakehouse_intake_denied → algorithm_discovery_without_repro_not_verified → sealed_no_silent_cloud_compute → evidence → learning',
    'Autonomous Research Infrastructure OS cycle recorded in order.',
  );

  check(
    'US-CW-locks',
    CW_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CW_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      CW_LOCKS.OFFLINE_DEVICES_PRETEND_RUNNING === false &&
      CW_LOCKS.MODEL_TOOL_EXPERIMENT_REQUIRES_LINEAGE &&
      CW_LOCKS.UNKNOWN_RIGHTS_LAKEHOUSE_INTAKE === false &&
      CW_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE === false &&
      CW_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
      CW_LOCKS.ALGORITHM_VERIFIED_WITHOUT_REPRODUCIBILITY === false &&
      CW_LOCKS.UNAUTHORIZED_UNIVERSE_REPLICATION === false &&
      CW_LOCKS.UNSIGNED_REPLICATION_PACK_ACCEPTED === false &&
      CW_LOCKS.REVOKED_REPLICATION_PACK_ACCEPTED === false &&
      CW_LOCKS.SEALED_SILENT_CLOUD_COMPUTE_FALLBACK === false &&
      CW_LOCKS.RAW_PRIVATE_POOLING_BY_DEFAULT === false &&
      CW_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CW_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CW-honesty-surfaces',
    offlineAgentLaboratoriesHonesty().offlineDevicesPretendRunning === false &&
      experimentGraphHonesty().requiresLineage === true &&
      knowledgeLakehouseHonesty().unknownRightsIntake === false &&
      adaptiveComputeFabricHonesty().quantumClassicalBaselineRequired === true &&
      algorithmDiscoveryFoundryHonesty().verifiedWithoutReproducibility === false &&
      universeReplicationHonesty().unauthorizedReplication === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-CW-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CX —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CW-predecessor-CV',
    preds.CV.tipProbe === 'PRESENT' && preds.CV.report === 'PRESENT',
    `CV tip=${preds.CV.tipProbe} report=${preds.CV.report}; CU=${preds.CU.tipProbe}/${preds.CU.report}`,
  );

  // All authorized devices powered off → WAITING_NODE or OFFLINE_STOPPED
  const lab = await registerOfflineLaboratory({
    name: 'lab-offline',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    devices: [
      { name: 'dev-1', authorized: true, poweredOn: true },
      { name: 'dev-2', authorized: true, poweredOn: true },
    ],
    root,
    actor,
  });
  await recordLaboratoryHeartbeat({
    labId: lab.lab!.id,
    runtimeEvidence: 'pid=9;runtime=local',
    root,
    actor,
  });
  const poweredOff = await setLaboratoryDevicesPower({
    labId: lab.lab!.id,
    poweredOn: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  const claimOff = await claimLaboratoryRunningVerified({
    labId: lab.lab!.id,
    root,
    actor,
  });
  check(
    'US-CW-all-devices-off-waiting-node',
    claimOff.accepted === false &&
      (claimOff.lab?.status === 'WAITING_NODE' || claimOff.lab?.status === 'OFFLINE_STOPPED') &&
      claimOff.reason === ALL_DEVICES_OFFLINE_WAITING_OR_STOPPED &&
      claimOff.lab?.status !== 'RUNNING_VERIFIED',
    `${claimOff.reason} status=${claimOff.lab?.status} powerReason=${poweredOff.reason}`,
  );

  const stopped = await setLaboratoryDevicesPower({
    labId: lab.lab!.id,
    poweredOn: false,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  check(
    'US-CW-all-devices-off-offline-stopped',
    stopped.lab?.status === 'OFFLINE_STOPPED' && stopped.lab.status !== 'RUNNING_VERIFIED',
    stopped.reason,
  );

  // Heartbeat missing → not RUNNING_VERIFIED
  const lab2 = await registerOfflineLaboratory({
    name: 'lab-no-hb',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    devices: [{ name: 'dev-on', authorized: true, poweredOn: true }],
    root,
    actor,
  });
  const claimNoHb = await claimLaboratoryRunningVerified({
    labId: lab2.lab!.id,
    root,
    actor,
  });
  check(
    'US-CW-heartbeat-missing-not-running-verified',
    claimNoHb.accepted === false &&
      claimNoHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      claimNoHb.lab?.status !== 'RUNNING_VERIFIED',
    claimNoHb.reason,
  );

  // With heartbeat + powered device → RUNNING_VERIFIED
  const hb = await recordLaboratoryHeartbeat({
    labId: lab2.lab!.id,
    runtimeEvidence: 'pid=1;runtime=local-shift',
    root,
    actor,
  });
  check(
    'US-CW-heartbeat-running-verified',
    hb.accepted === true && hb.lab?.status === 'RUNNING_VERIFIED',
    hb.reason,
  );

  // Experiment/model/tool nodes require lineage
  const missingLineage = await proposeExperimentGraphNode({
    kind: 'experiment',
    refId: 'orphan-exp',
    parentNodeId: null,
    metadata: {},
    root,
    actor,
  });
  check(
    'US-CW-lineage-required',
    missingLineage.accepted === false && missingLineage.reason === LINEAGE_REQUIRED,
    missingLineage.reason,
  );

  const rootNode = await registerRootExperimentGraphNode({
    kind: 'model',
    refId: 'base-model',
    metadata: { arch: 'transformer', rev: '1' },
    root,
    actor,
  });
  const toolChild = await proposeExperimentGraphNode({
    kind: 'tool',
    refId: 'tool-1',
    parentNodeId: rootNode.node!.id,
    metadata: { parent: 'base-model' },
    root,
    actor,
  });
  check(
    'US-CW-lineage-ok',
    toolChild.accepted === true && toolChild.node?.status === 'LINEAGED',
    toolChild.reason,
  );

  // Unauthorized Universe replication DENIED
  const unauth = await submitIntelligenceReplicationPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-foreign',
    payload: 'secret-intel',
    signature: signReplicationPayload('secret-intel', 'k1'),
    signingKey: 'k1',
    root,
    actor,
  });
  check(
    'US-CW-unauthorized-universe-denied',
    unauth.accepted === false &&
      unauth.reason === UNAUTHORIZED_UNIVERSE_REPLICATION_DENIED &&
      unauth.pack?.status === 'DENIED',
    unauth.reason,
  );

  // Unsigned / revoked replication pack rejected
  const unsigned = await submitIntelligenceReplicationPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'pack-u',
    signature: null,
    root,
    actor,
  });
  check(
    'US-CW-unsigned-rejected',
    unsigned.accepted === false && unsigned.reason === UNSIGNED_REPLICATION_REJECTED,
    unsigned.reason,
  );

  const link = await authorizeUniverseReplicationLink({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    root,
    actor,
  });
  const revoked = await submitIntelligenceReplicationPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'pack-r',
    signature: signReplicationPayload('pack-r', 'k1'),
    signingKey: 'k1',
    revoked: true,
    root,
    actor,
  });
  check(
    'US-CW-revoked-rejected',
    revoked.accepted === false && revoked.reason === REVOKED_REPLICATION_REJECTED,
    `${revoked.reason}; link=${link.accepted}`,
  );

  // Authorized + signed accepted
  const okPack = await submitIntelligenceReplicationPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'pack-ok',
    signature: signReplicationPayload('pack-ok', 'k1'),
    signingKey: 'k1',
    root,
    actor,
  });
  check('US-CW-signed-authorized-accepted', okPack.accepted === true, okPack.reason);

  // Unconfigured accelerator/QPU → UNAVAILABLE
  const unconfigured = await registerAdaptiveComputeTarget({
    kind: 'npu',
    configured: false,
    root,
    actor,
  });
  const placeFail = await placeComputeWorkload({
    targetKind: 'npu',
    targetId: unconfigured.id,
    root,
    actor,
  });
  check(
    'US-CW-unconfigured-unavailable',
    placeFail.status === 'UNAVAILABLE' &&
      placeFail.reason === UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    placeFail.reason,
  );

  const unverifiedQpu = await registerAdaptiveComputeTarget({
    kind: 'quantum',
    configured: true,
    authorized: true,
    verified: false,
    root,
    actor,
  });
  const qpuFail = await placeComputeWorkload({
    targetKind: 'quantum',
    targetId: unverifiedQpu.id,
    classicalBaselineRef: 'cpu-baseline-1',
    root,
    actor,
  });
  check('US-CW-unverified-qpu-unavailable', qpuFail.status === 'UNAVAILABLE', qpuFail.reason);

  // Quantum placement without classical baseline REJECTED
  const qNoBase = await placeComputeWorkload({
    targetKind: 'quantum',
    classicalBaselineRef: null,
    root,
    actor,
  });
  check(
    'US-CW-quantum-no-baseline-rejected',
    qNoBase.status === 'REJECTED' && qNoBase.reason === QUANTUM_WITHOUT_BASELINE_REJECTED,
    qNoBase.reason,
  );

  // Unknown-rights lakehouse intake DENIED
  const unknownRights = await intakeLakehouseObject({
    sourceId: 'unknown-src',
    rightsClass: 'unknown_rights',
    contentSummary: 'deny me',
    root,
    actor,
  });
  check(
    'US-CW-unknown-rights-denied',
    unknownRights.accepted === false &&
      unknownRights.reason === UNKNOWN_RIGHTS_LAKEHOUSE_DENIED,
    unknownRights.reason,
  );

  // Algorithm discovery without reproducibility not VERIFIED
  const noRepro = await proposeAlgorithmDiscovery({
    name: 'unrepro-algo',
    hypothesisText: 'maybe faster',
    reproducibilityMetadata: null,
    claimVerified: true,
    root,
    actor,
  });
  check(
    'US-CW-algo-without-repro-not-verified',
    noRepro.accepted === false &&
      noRepro.candidate?.status !== 'VERIFIED' &&
      noRepro.reason === ALGORITHM_NOT_VERIFIED_WITHOUT_REPRO,
    noRepro.reason,
  );

  const withRepro = await proposeAlgorithmDiscovery({
    name: 'repro-algo',
    hypothesisText: 'bounded search',
    reproducibilityMetadata: { seed: '7', commit: 'abc123' },
    claimVerified: true,
    root,
    actor,
  });
  check(
    'US-CW-algo-with-repro-verified',
    withRepro.accepted === true && withRepro.candidate?.status === 'VERIFIED',
    withRepro.reason,
  );

  // Sealed content cannot silent-route to cloud compute
  const sealed = await placeComputeWorkload({
    targetKind: 'gpu',
    contentMode: 'sealed',
    silentCloudComputeFallback: true,
    root,
    actor,
  });
  check(
    'US-CW-sealed-no-silent-cloud',
    sealed.status === 'DENIED' && sealed.reason === SEALED_SILENT_CLOUD_COMPUTE_DENIED,
    sealed.reason,
  );

  // Verified CPU placement succeeds
  const cpu = await registerAdaptiveComputeTarget({
    kind: 'cpu',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const cpuJob = await placeComputeWorkload({
    targetKind: 'cpu',
    targetId: cpu.id,
    root,
    actor,
  });
  check('US-CW-verified-cpu-placed', cpuJob.status === 'PLACED', cpuJob.reason);

  const cycle = await runAutonomousResearchInfrastructureOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check('US-CW-cycle-ok', cycle.ok === true, `hops=${cycle.hops.length}`);

  const health = await buildAutonomousResearchInfrastructureOsHealthReport({ root: repoRoot });
  check(
    'US-CW-health-report',
    health.phase === '62L-CW' &&
      health.productionAuthorized === false &&
      health.githubSotIssue === 114 &&
      health.gitlabCoordinationIssue === 48,
    health.honestyBanner,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL 62L-CW (${failures.length})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-CW autonomous research infrastructure OS tests passed');
