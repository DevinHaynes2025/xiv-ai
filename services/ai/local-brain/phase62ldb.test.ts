import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  claimMicroserviceRunningVerified,
  recordMicroserviceHeartbeat,
  registerDepartmentMicroservice,
  requestMicroserviceProductionAuthority,
  setMicroserviceNodePower,
  agentDepartmentMicroservicesHonesty,
} from './agent-department-microservices';
import {
  neuralMemoryStreamingFabricHonesty,
  publishMemoryStream,
  signMemoryPayload,
} from './neural-memory-streaming-fabric';
import {
  multiProviderModelGatewayHonesty,
  registerGatewayProvider,
  routeGatewayRequest,
} from './multi-provider-model-gateway';
import {
  attemptSchedulerSpendOrBill,
  registerAcceleratorTarget,
  scheduleAcceleratorWorkload,
  universalAcceleratorSchedulerHonesty,
} from './universal-accelerator-scheduler';
import {
  autonomousSoftwareRndCompanyNetworkHonesty,
  registerRndWorkcell,
  requestRndSelfPromoteOrMerge,
} from './autonomous-software-rnd-company-network';
import {
  authorizeReplicationLink,
  rollbackReplicationWithoutInventingRunning,
  signReplicationPayload,
  submitReplicationPack,
  universeStateReplicationRecoveryGridHonesty,
} from './universe-state-replication-recovery-grid';
import {
  CONSENSUS_NOT_VERIFIED_PROOF,
  DB_LOCKS,
  DISTRIBUTED_SUPERBRAIN_RUNTIME_MESH_CYCLE,
  HONESTY_BANNER,
  MICROSERVICE_SELF_ESCALATE_DENIED,
  NEXT_PHASE_TITLE,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  REVOKED_REPLICATION_REJECTED,
  RND_SELF_PROMOTE_DENIED,
  ROLLBACK_NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  SCHEDULER_SPEND_DENIED,
  SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  UNSIGNED_MEMORY_STREAM_REJECTED,
  UNSIGNED_REPLICATION_REJECTED,
  predecessorMap,
  type DbActor,
} from './distributed-superbrain-runtime-mesh-types';
import {
  buildDistributedSuperbrainRuntimeMeshHealthReport,
  runDistributedSuperbrainRuntimeMeshCycle,
} from './distributed-superbrain-runtime-mesh-runtime';
import { distributedSuperbrainRuntimeMeshHonesty } from './distributed-superbrain-runtime-mesh';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldb-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DbActor = {
  kind: 'mesh_curator',
  id: 'curator-db-1',
  orgId: 'org-db',
  tenantId: 'tenant-db',
  universeId: 'univ-db',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DB1-cycle',
    DISTRIBUTED_SUPERBRAIN_RUNTIME_MESH_CYCLE.join(' → ') ===
      'honesty_locks → distributed_superbrain_runtime_mesh_bootstrap → microservice_self_escalate_production_authority_denied → unsigned_memory_stream_rejected → sealed_raw_private_silent_cross_universe_stream_denied → unconfigured_provider_unavailable → quantum_schedule_without_classical_baseline_rejected → rnd_workcell_self_promote_merge_denied → unsigned_revoked_replication_pack_rejected → rollback_without_heartbeat_not_running_verified → no_powered_node_waiting_or_offline_stopped → scheduler_cannot_spend_bill → consensus_only_gateway_output_not_verified_proof → evidence → learning',
    'Distributed Superbrain Runtime Mesh cycle recorded in order.',
  );

  check(
    'US-DB-locks',
    DB_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DB_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      DB_LOCKS.MICROSERVICE_SELF_ESCALATE_PRODUCTION_AUTHORITY === false &&
      DB_LOCKS.UNSIGNED_MEMORY_STREAM_ACCEPTED === false &&
      DB_LOCKS.SEALED_RAW_PRIVATE_SILENT_CROSS_UNIVERSE_STREAM === false &&
      DB_LOCKS.RND_WORKCELL_SELF_PROMOTE === false &&
      DB_LOCKS.RND_WORKCELL_MERGE_TO_PROD === false &&
      DB_LOCKS.SCHEDULER_SPEND_ENABLED === false &&
      DB_LOCKS.UNSIGNED_REPLICATION_PACK_ACCEPTED === false &&
      DB_LOCKS.REVOKED_REPLICATION_PACK_ACCEPTED === false &&
      DB_LOCKS.ROLLBACK_INVENTS_RUNNING_VERIFIED === false &&
      DB_LOCKS.CONSENSUS_EQ_PROOF === false &&
      DB_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DB_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DB-honesty-surfaces',
    agentDepartmentMicroservicesHonesty().selfEscalateProductionAuthority === false &&
      neuralMemoryStreamingFabricHonesty().unsignedAccepted === false &&
      multiProviderModelGatewayHonesty().localFirst === true &&
      multiProviderModelGatewayHonesty().consensusEqProof === false &&
      universalAcceleratorSchedulerHonesty().spendEnabled === false &&
      autonomousSoftwareRndCompanyNetworkHonesty().selfPromote === false &&
      universeStateReplicationRecoveryGridHonesty().revokedAccepted === false &&
      distributedSuperbrainRuntimeMeshHonesty().modularResilient === true,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DB-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DC —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DB-predecessor-DA',
    preds.DA.tipProbe === 'PRESENT' && preds.DA.report === 'PRESENT',
    `DA tip=${preds.DA.tipProbe} report=${preds.DA.report}; CZ=${preds.CZ.tipProbe}/${preds.CZ.report}; CY=${preds.CY.tipProbe}/${preds.CY.report}; CX=${preds.CX.tipProbe}/${preds.CX.report}; CW=${preds.CW.tipProbe}/${preds.CW.report}`,
  );

  // Microservice cannot self-escalate production authority
  const ms = await registerDepartmentMicroservice({
    name: 'ms-a',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    authorizedNodePowered: true,
    root,
    actor,
  });
  const selfEsc = await requestMicroserviceProductionAuthority({
    serviceId: ms.service!.id,
    selfEscalate: true,
    root,
    actor: { ...actor, kind: 'microservice_agent' },
  });
  check(
    'US-DB-microservice-self-escalate-denied',
    selfEsc.accepted === false &&
      selfEsc.reason === MICROSERVICE_SELF_ESCALATE_DENIED &&
      selfEsc.service?.productionAuthority === false,
    selfEsc.reason,
  );

  // Unsigned memory stream rejected
  const unsigned = await publishMemoryStream({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    topic: 't1',
    payload: 'p1',
    signature: null,
    root,
    actor,
  });
  check(
    'US-DB-unsigned-memory-stream-rejected',
    unsigned.accepted === false && unsigned.reason === UNSIGNED_MEMORY_STREAM_REJECTED,
    unsigned.reason,
  );

  // Signed memory stream accepted (local scope)
  const signed = await publishMemoryStream({
    sourceUniverseId: actor.universeId,
    targetUniverseId: actor.universeId,
    topic: 't2',
    payload: 'p2',
    signature: signMemoryPayload('p2', 'k1'),
    signingKey: 'k1',
    root,
    actor,
  });
  check('US-DB-signed-memory-stream-accepted', signed.accepted === true, signed.reason);

  // Sealed/raw private silent cross-Universe stream DENIED
  const sealed = await publishMemoryStream({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    topic: 'private',
    payload: 'raw',
    contentClass: 'raw_private',
    signature: signMemoryPayload('raw', 'k1'),
    signingKey: 'k1',
    silentCrossRoute: true,
    root,
    actor,
  });
  const sealedCloud = await publishMemoryStream({
    sourceUniverseId: actor.universeId,
    targetUniverseId: actor.universeId,
    topic: 'cloud-private',
    payload: 'sealed',
    contentClass: 'sealed',
    signature: signMemoryPayload('sealed', 'k1'),
    signingKey: 'k1',
    silentCrossRoute: true,
    cloudTarget: true,
    root,
    actor,
  });
  check(
    'US-DB-sealed-raw-private-silent-stream-denied',
    sealed.accepted === false &&
      sealed.reason === SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED &&
      sealedCloud.accepted === false &&
      sealedCloud.reason === SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
    `${sealed.reason}; ${sealedCloud.reason}`,
  );

  // Unconfigured provider → UNAVAILABLE
  const cloud = await registerGatewayProvider({
    kind: 'cloud_model',
    name: 'gpt-x',
    configured: false,
    root,
    actor,
  });
  const fedFail = await routeGatewayRequest({
    providerId: cloud.id,
    preferLocal: false,
    root,
    actor,
  });
  check(
    'US-DB-unconfigured-provider-unavailable',
    fedFail.status === 'UNAVAILABLE' &&
      fedFail.reason === UNCONFIGURED_PROVIDER_UNAVAILABLE,
    fedFail.reason,
  );

  // Quantum schedule without classical baseline REJECTED
  const qNoBase = await scheduleAcceleratorWorkload({
    targetKind: 'quantum',
    classicalBaselineRef: null,
    root,
    actor,
  });
  check(
    'US-DB-quantum-no-baseline-rejected',
    qNoBase.status === 'REJECTED' && qNoBase.reason === QUANTUM_WITHOUT_BASELINE_REJECTED,
    qNoBase.reason,
  );

  // Verified CPU schedule succeeds
  const cpu = await registerAcceleratorTarget({
    kind: 'cpu',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const cpuJob = await scheduleAcceleratorWorkload({
    targetKind: 'cpu',
    targetId: cpu.id,
    root,
    actor,
  });
  check('US-DB-verified-cpu-scheduled', cpuJob.status === 'SCHEDULED', cpuJob.reason);

  // R&D workcell self-promote / merge DENIED
  const rnd = await registerRndWorkcell({
    name: 'rnd-app-1',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const promote = await requestRndSelfPromoteOrMerge({
    workcellId: rnd.workcell!.id,
    action: 'self_promote',
    root,
    actor,
  });
  const merge = await requestRndSelfPromoteOrMerge({
    workcellId: rnd.workcell!.id,
    action: 'merge_to_prod',
    root,
    actor,
  });
  check(
    'US-DB-rnd-self-promote-merge-denied',
    promote.accepted === false &&
      merge.accepted === false &&
      promote.reason === RND_SELF_PROMOTE_DENIED &&
      merge.workcell?.productionAuthority === false,
    `${promote.reason}; ${merge.reason}`,
  );

  // Unsigned / revoked replication pack rejected
  const unsignedRep = await submitReplicationPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'c-u',
    signature: null,
    root,
    actor,
  });
  await authorizeReplicationLink({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    root,
    actor,
  });
  const revoked = await submitReplicationPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'c-r',
    signature: signReplicationPayload('c-r', 'k1'),
    signingKey: 'k1',
    revoked: true,
    root,
    actor,
  });
  const okRep = await submitReplicationPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'c-ok',
    signature: signReplicationPayload('c-ok', 'k1'),
    signingKey: 'k1',
    root,
    actor,
  });
  check(
    'US-DB-replication-unsigned-revoked-rejected',
    unsignedRep.accepted === false &&
      unsignedRep.reason === UNSIGNED_REPLICATION_REJECTED &&
      revoked.accepted === false &&
      revoked.reason === REVOKED_REPLICATION_REJECTED &&
      okRep.accepted === true,
    `${unsignedRep.reason}; ${revoked.reason}; ${okRep.reason}`,
  );

  // Rollback does not invent RUNNING_VERIFIED without heartbeat
  const rollback = await rollbackReplicationWithoutInventingRunning({
    packId: okRep.pack!.id,
    claimRunningVerified: true,
    hasHeartbeatEvidence: false,
    root,
    actor,
  });
  check(
    'US-DB-rollback-no-heartbeat-not-running-verified',
    rollback.accepted === false &&
      rollback.reason === ROLLBACK_NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      rollback.checkpoint?.claimedRunningVerified === false &&
      rollback.checkpoint?.status !== 'RUNNING_VERIFIED',
    rollback.reason,
  );

  // No powered node → WAITING_NODE or OFFLINE_STOPPED
  const poweredOff = await setMicroserviceNodePower({
    serviceId: ms.service!.id,
    poweredOn: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  const claimOff = await claimMicroserviceRunningVerified({
    serviceId: ms.service!.id,
    root,
    actor,
  });
  check(
    'US-DB-no-powered-node-waiting',
    claimOff.accepted === false &&
      (claimOff.service?.status === 'WAITING_NODE' ||
        claimOff.service?.status === 'OFFLINE_STOPPED') &&
      claimOff.reason === NO_POWERED_NODE_WAITING_OR_STOPPED &&
      claimOff.service?.status !== 'RUNNING_VERIFIED',
    `${claimOff.reason} status=${claimOff.service?.status} power=${poweredOff.reason}`,
  );

  const stopped = await setMicroserviceNodePower({
    serviceId: ms.service!.id,
    poweredOn: false,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  check(
    'US-DB-no-powered-node-offline-stopped',
    stopped.service?.status === 'OFFLINE_STOPPED' &&
      stopped.service.status !== 'RUNNING_VERIFIED',
    stopped.reason,
  );

  // With heartbeat + powered → RUNNING_VERIFIED
  await setMicroserviceNodePower({
    serviceId: ms.service!.id,
    poweredOn: true,
    root,
    actor,
  });
  const hb = await recordMicroserviceHeartbeat({
    serviceId: ms.service!.id,
    runtimeEvidence: 'pid=42;runtime=local',
    root,
    actor,
  });
  check(
    'US-DB-heartbeat-running-verified',
    hb.accepted === true && hb.service?.status === 'RUNNING_VERIFIED',
    hb.reason,
  );

  // Scheduler cannot spend/bill
  const spend = await attemptSchedulerSpendOrBill({
    amount: 50,
    mode: 'bill',
    root,
    actor,
  });
  check(
    'US-DB-scheduler-cannot-spend-bill',
    spend.accepted === false && spend.reason === SCHEDULER_SPEND_DENIED,
    spend.reason,
  );

  // Consensus-only gateway output ≠ verified proof
  const consensus = await routeGatewayRequest({
    consensusOnly: true,
    root,
    actor,
  });
  check(
    'US-DB-consensus-not-verified-proof',
    consensus.status === 'CONSENSUS_ONLY' &&
      consensus.verifiedProof === false &&
      consensus.reason === CONSENSUS_NOT_VERIFIED_PROOF,
    consensus.reason,
  );

  const cycle = await runDistributedSuperbrainRuntimeMeshCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check('US-DB-cycle-ok', cycle.ok === true, `hops=${cycle.hops.length}`);

  const health = await buildDistributedSuperbrainRuntimeMeshHealthReport({
    root: repoRoot,
  });
  check(
    'US-DB-health-report',
    health.phase === '62L-DB' &&
      health.productionAuthorized === false &&
      health.githubSotIssue === 119 &&
      health.gitlabCoordinationIssue === 53 &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false,
    health.honestyBanner,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL 62L-DB (${failures.length})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DB distributed superbrain runtime mesh tests passed');
