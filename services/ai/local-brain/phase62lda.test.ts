import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  claimWorkcellRunningVerified,
  registerDepartmentOs,
  registerWorkcell,
  requestDepartmentProductionAuthority,
  recordWorkcellHeartbeat,
  setWorkcellNodePower,
  autonomousDepartmentOsHonesty,
} from './autonomous-department-operating-system';
import {
  neuralKnowledgeEventBusHonesty,
  publishKnowledgeEvent,
  signKnowledgePayload,
} from './neural-knowledge-event-bus';
import {
  localCloudModelFederationHonesty,
  registerFederationMember,
  routeFederationRequest,
} from './local-cloud-model-federation';
import {
  attemptControlPlaneSpendOrBill,
  heterogeneousComputeControlPlaneHonesty,
  placeComputeWorkload,
  registerComputeTarget,
} from './heterogeneous-compute-control-plane';
import {
  agentSoftwareCompanyFactoryHonesty,
  registerSoftwareProduct,
  requestSoftwareSelfPromoteOrMerge,
} from './agent-software-company-factory';
import {
  authorizeContinuityLink,
  signContinuityPayload,
  submitContinuityPack,
  universeContinuityEngineHonesty,
} from './distributed-universe-continuity-engine';
import {
  CONTROL_PLANE_SPEND_DENIED,
  DA_LOCKS,
  DEPARTMENT_SELF_GRANT_DENIED,
  HONESTY_BANNER,
  LOGICAL_NOT_RUNNING_VERIFIED,
  NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  REVOKED_CONTINUITY_REJECTED,
  SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
  SOFTWARE_FACTORY_SELF_PROMOTE_DENIED,
  SUPERBRAIN_RUNTIME_KERNEL_CYCLE,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  UNSIGNED_CONTINUITY_REJECTED,
  UNSIGNED_KNOWLEDGE_EVENT_REJECTED,
  predecessorMap,
  type DaActor,
} from './superbrain-runtime-kernel-types';
import {
  buildSuperbrainRuntimeKernelHealthReport,
  runSuperbrainRuntimeKernelCycle,
} from './superbrain-runtime-kernel-runtime';
import { superbrainRuntimeKernelHonesty } from './superbrain-runtime-kernel';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lda-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DaActor = {
  kind: 'superbrain_kernel_curator',
  id: 'curator-da-1',
  orgId: 'org-da',
  tenantId: 'tenant-da',
  universeId: 'univ-da',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DA1-cycle',
    SUPERBRAIN_RUNTIME_KERNEL_CYCLE.join(' → ') ===
      'honesty_locks → superbrain_runtime_kernel_bootstrap → department_self_grant_production_authority_denied → unsigned_knowledge_event_rejected → sealed_raw_private_silent_federation_universe_denied → unconfigured_cloud_model_accelerator_unavailable → quantum_without_classical_baseline_rejected → software_factory_self_promote_merge_denied → continuity_pack_unsigned_revoked_rejected → control_plane_cannot_spend_bill → missing_heartbeat_not_running_verified → no_powered_node_waiting_or_offline_stopped → logical_population_not_running_verified → evidence → learning',
    'Superbrain Runtime Kernel cycle recorded in order.',
  );

  check(
    'US-DA-locks',
    DA_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DA_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      DA_LOCKS.DEPARTMENT_SELF_GRANT_PRODUCTION_AUTHORITY === false &&
      DA_LOCKS.UNSIGNED_KNOWLEDGE_EVENT_ACCEPTED === false &&
      DA_LOCKS.SEALED_RAW_PRIVATE_SILENT_FEDERATION === false &&
      DA_LOCKS.SOFTWARE_FACTORY_SELF_PROMOTE === false &&
      DA_LOCKS.SOFTWARE_FACTORY_MERGE_TO_PROD === false &&
      DA_LOCKS.CONTROL_PLANE_SPEND_ENABLED === false &&
      DA_LOCKS.UNSIGNED_CONTINUITY_PACK_ACCEPTED === false &&
      DA_LOCKS.REVOKED_CONTINUITY_PACK_ACCEPTED === false &&
      DA_LOCKS.LOGICAL_EQ_RUNNING_VERIFIED === false &&
      DA_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DA_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DA-honesty-surfaces',
    autonomousDepartmentOsHonesty().departmentSelfGrantProductionAuthority === false &&
      neuralKnowledgeEventBusHonesty().unsignedAccepted === false &&
      localCloudModelFederationHonesty().localFirst === true &&
      heterogeneousComputeControlPlaneHonesty().spendEnabled === false &&
      agentSoftwareCompanyFactoryHonesty().selfPromote === false &&
      universeContinuityEngineHonesty().revokedAccepted === false &&
      superbrainRuntimeKernelHonesty().coexistenceLayer === true,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DA-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DB —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DA-predecessor-CY',
    preds.CY.tipProbe === 'PRESENT' && preds.CY.report === 'PRESENT',
    `CY tip=${preds.CY.tipProbe} report=${preds.CY.report}; CZ=${preds.CZ.tipProbe}/${preds.CZ.report}; CX=${preds.CX.tipProbe}/${preds.CX.report}; CW=${preds.CW.tipProbe}/${preds.CW.report}`,
  );

  // Department cannot self-grant production authority
  const dept = await registerDepartmentOs({
    name: 'dept-a',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const selfGrant = await requestDepartmentProductionAuthority({
    departmentId: dept.department!.id,
    selfGrant: true,
    root,
    actor: { ...actor, kind: 'department_agent' },
  });
  check(
    'US-DA-department-self-grant-denied',
    selfGrant.accepted === false &&
      selfGrant.reason === DEPARTMENT_SELF_GRANT_DENIED &&
      selfGrant.department?.productionAuthority === false,
    selfGrant.reason,
  );

  // Unsigned knowledge event rejected
  const unsigned = await publishKnowledgeEvent({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    topic: 't1',
    payload: 'p1',
    signature: null,
    root,
    actor,
  });
  check(
    'US-DA-unsigned-knowledge-event-rejected',
    unsigned.accepted === false && unsigned.reason === UNSIGNED_KNOWLEDGE_EVENT_REJECTED,
    unsigned.reason,
  );

  // Signed knowledge event accepted
  const signed = await publishKnowledgeEvent({
    sourceUniverseId: actor.universeId,
    targetUniverseId: actor.universeId,
    topic: 't2',
    payload: 'p2',
    signature: signKnowledgePayload('p2', 'k1'),
    signingKey: 'k1',
    root,
    actor,
  });
  check('US-DA-signed-knowledge-event-accepted', signed.accepted === true, signed.reason);

  // Sealed/raw private silent federation / Universe route DENIED
  const sealedFed = await routeFederationRequest({
    contentClass: 'sealed',
    silentCloudFallback: true,
    root,
    actor,
  });
  const rawEvt = await publishKnowledgeEvent({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    topic: 'private',
    payload: 'raw',
    contentClass: 'raw_private',
    signature: signKnowledgePayload('raw', 'k1'),
    signingKey: 'k1',
    silentCrossRoute: true,
    root,
    actor,
  });
  check(
    'US-DA-sealed-raw-private-silent-denied',
    sealedFed.status === 'DENIED' &&
      sealedFed.reason === SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED &&
      rawEvt.accepted === false &&
      rawEvt.reason === SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
    `${sealedFed.reason}; ${rawEvt.reason}`,
  );

  // Unconfigured cloud/model/accelerator → UNAVAILABLE
  const cloud = await registerFederationMember({
    kind: 'cloud_model',
    name: 'gpt-x',
    configured: false,
    root,
    actor,
  });
  const fedFail = await routeFederationRequest({
    memberId: cloud.id,
    preferLocal: false,
    root,
    actor,
  });
  const accel = await registerComputeTarget({
    kind: 'amd',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const placeFail = await placeComputeWorkload({
    targetKind: 'amd',
    targetId: accel.id,
    root,
    actor,
  });
  check(
    'US-DA-unconfigured-unavailable',
    fedFail.status === 'UNAVAILABLE' &&
      placeFail.status === 'UNAVAILABLE' &&
      placeFail.reason === UNCONFIGURED_PROVIDER_UNAVAILABLE,
    `${fedFail.reason}; ${placeFail.reason}`,
  );

  // Quantum without classical baseline REJECTED
  const qNoBase = await placeComputeWorkload({
    targetKind: 'quantum',
    classicalBaselineRef: null,
    root,
    actor,
  });
  check(
    'US-DA-quantum-no-baseline-rejected',
    qNoBase.status === 'REJECTED' && qNoBase.reason === QUANTUM_WITHOUT_BASELINE_REJECTED,
    qNoBase.reason,
  );

  // Verified CPU placement succeeds
  const cpu = await registerComputeTarget({
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
  check('US-DA-verified-cpu-placed', cpuJob.status === 'PLACED', cpuJob.reason);

  // Software factory self-promote / merge-to-prod DENIED
  const product = await registerSoftwareProduct({
    name: 'app-1',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const promote = await requestSoftwareSelfPromoteOrMerge({
    productId: product.product!.id,
    action: 'self_promote',
    root,
    actor,
  });
  const merge = await requestSoftwareSelfPromoteOrMerge({
    productId: product.product!.id,
    action: 'merge_to_prod',
    root,
    actor,
  });
  check(
    'US-DA-software-factory-self-promote-denied',
    promote.accepted === false &&
      merge.accepted === false &&
      promote.reason === SOFTWARE_FACTORY_SELF_PROMOTE_DENIED &&
      merge.product?.productionAuthority === false,
    `${promote.reason}; ${merge.reason}`,
  );

  // Continuity pack unsigned / revoked rejected
  const unsignedCont = await submitContinuityPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'c-u',
    signature: null,
    root,
    actor,
  });
  await authorizeContinuityLink({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    root,
    actor,
  });
  const revoked = await submitContinuityPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'c-r',
    signature: signContinuityPayload('c-r', 'k1'),
    signingKey: 'k1',
    revoked: true,
    root,
    actor,
  });
  const okCont = await submitContinuityPack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'c-ok',
    signature: signContinuityPayload('c-ok', 'k1'),
    signingKey: 'k1',
    root,
    actor,
  });
  check(
    'US-DA-continuity-unsigned-revoked-rejected',
    unsignedCont.accepted === false &&
      unsignedCont.reason === UNSIGNED_CONTINUITY_REJECTED &&
      revoked.accepted === false &&
      revoked.reason === REVOKED_CONTINUITY_REJECTED &&
      okCont.accepted === true,
    `${unsignedCont.reason}; ${revoked.reason}; ${okCont.reason}`,
  );

  // Control plane cannot spend/bill
  const spend = await attemptControlPlaneSpendOrBill({
    amount: 50,
    mode: 'bill',
    root,
    actor,
  });
  check(
    'US-DA-control-plane-cannot-spend-bill',
    spend.accepted === false && spend.reason === CONTROL_PLANE_SPEND_DENIED,
    spend.reason,
  );

  // Missing heartbeat → not RUNNING_VERIFIED
  const wc = await registerWorkcell({
    departmentId: dept.department!.id,
    name: 'wc-1',
    populationMode: 'materialized',
    authorizedNodePowered: true,
    root,
    actor,
  });
  const claimNoHb = await claimWorkcellRunningVerified({
    workcellId: wc.workcell!.id,
    root,
    actor,
  });
  check(
    'US-DA-missing-heartbeat-not-running-verified',
    claimNoHb.accepted === false &&
      claimNoHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      claimNoHb.workcell?.status !== 'RUNNING_VERIFIED',
    claimNoHb.reason,
  );

  // With heartbeat + powered → RUNNING_VERIFIED
  const hb = await recordWorkcellHeartbeat({
    workcellId: wc.workcell!.id,
    runtimeEvidence: 'pid=42;runtime=local',
    root,
    actor,
  });
  check(
    'US-DA-heartbeat-running-verified',
    hb.accepted === true && hb.workcell?.status === 'RUNNING_VERIFIED',
    hb.reason,
  );

  // No powered node → WAITING_NODE or OFFLINE_STOPPED
  const poweredOff = await setWorkcellNodePower({
    workcellId: wc.workcell!.id,
    poweredOn: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  const claimOff = await claimWorkcellRunningVerified({
    workcellId: wc.workcell!.id,
    root,
    actor,
  });
  check(
    'US-DA-no-powered-node-waiting',
    claimOff.accepted === false &&
      (claimOff.workcell?.status === 'WAITING_NODE' ||
        claimOff.workcell?.status === 'OFFLINE_STOPPED') &&
      claimOff.reason === NO_POWERED_NODE_WAITING_OR_STOPPED &&
      claimOff.workcell?.status !== 'RUNNING_VERIFIED',
    `${claimOff.reason} status=${claimOff.workcell?.status} power=${poweredOff.reason}`,
  );

  const stopped = await setWorkcellNodePower({
    workcellId: wc.workcell!.id,
    poweredOn: false,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  check(
    'US-DA-no-powered-node-offline-stopped',
    stopped.workcell?.status === 'OFFLINE_STOPPED' &&
      stopped.workcell.status !== 'RUNNING_VERIFIED',
    stopped.reason,
  );

  // Logical population ≠ RUNNING_VERIFIED
  const logical = await registerWorkcell({
    departmentId: dept.department!.id,
    name: 'wc-logical',
    populationMode: 'logical',
    authorizedNodePowered: true,
    root,
    actor,
  });
  const logicalHb = await recordWorkcellHeartbeat({
    workcellId: logical.workcell!.id,
    runtimeEvidence: 'fake',
    root,
    actor,
  });
  const logicalClaim = await claimWorkcellRunningVerified({
    workcellId: logical.workcell!.id,
    root,
    actor,
  });
  check(
    'US-DA-logical-not-running-verified',
    logical.workcell?.status === 'LOGICAL' &&
      logicalHb.accepted === false &&
      logicalClaim.accepted === false &&
      logicalClaim.reason === LOGICAL_NOT_RUNNING_VERIFIED &&
      logicalClaim.workcell?.status !== 'RUNNING_VERIFIED',
    logicalClaim.reason,
  );

  const cycle = await runSuperbrainRuntimeKernelCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check('US-DA-cycle-ok', cycle.ok === true, `hops=${cycle.hops.length}`);

  const health = await buildSuperbrainRuntimeKernelHealthReport({ root: repoRoot });
  check(
    'US-DA-health-report',
    health.phase === '62L-DA' &&
      health.productionAuthorized === false &&
      health.githubSotIssue === 118 &&
      health.gitlabCoordinationIssue === 52 &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false,
    health.honestyBanner,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL 62L-DA (${failures.length})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DA superbrain runtime kernel tests passed');
