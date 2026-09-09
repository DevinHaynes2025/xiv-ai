import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  registerResearchDepartment,
  requestDepartmentProductionAuthority,
  researchDepartmentNetworkHonesty,
} from './autonomous-research-department-network';
import {
  applyWorkbenchConsensus,
  contributeWorkbenchDissent,
  contributeWorkbenchEvidence,
  cognitiveWorkbenchHonesty,
  openCognitiveWorkbench,
  workbenchDissentIntact,
} from './multi-model-cognitive-workbench';
import {
  attemptSchedulerSpendOrBill,
  registerSchedulerTarget,
  resourceSchedulerHonesty,
  scheduleResourceWorkload,
} from './gpu-npu-quantum-resource-scheduler';
import {
  productFactoryHonesty,
  registerProductCandidate,
  requestProductSelfPromote,
  attemptFactorySpend,
} from './agent-generated-ai-product-factory';
import {
  attemptMeshRecovery,
  authorizeUniverseRouteLink,
  meshOfflineTruth,
  recordMeshHeartbeat,
  registerMeshNode,
  routeUniversePayload,
  setMeshNodesPower,
  signUniverseRoutePayload,
  universeRoutingMeshHonesty,
} from './global-universe-routing-recovery-mesh';
import { publishFabricEvent } from './distributed-knowledge-experiment-event-fabric';
import {
  ACCOUNTING_SCHEDULER_SPEND_DENIED,
  CONSENSUS_NOT_VERIFIED_PROOF,
  CZ_LOCKS,
  DEPARTMENT_SELF_GRANT_DENIED,
  DISSENT_PRESERVED,
  HONESTY_BANNER,
  INTELLIGENCE_CIVILIZATION_KERNEL_CYCLE,
  NEXT_PHASE_TITLE,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  PRODUCT_FACTORY_SELF_PROMOTE_DENIED,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  RECOVERY_NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  predecessorMap,
  type CzActor,
} from './intelligence-civilization-kernel-types';
import {
  buildIntelligenceCivilizationKernelHealthReport,
  runIntelligenceCivilizationKernelCycle,
} from './intelligence-civilization-kernel-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcz-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CzActor = {
  kind: 'intelligence_kernel_curator',
  id: 'curator-cz-1',
  orgId: 'org-cz',
  tenantId: 'tenant-cz',
  universeId: 'univ-cz',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-CZ1-cycle',
    INTELLIGENCE_CIVILIZATION_KERNEL_CYCLE.join(' → ') ===
      'honesty_locks → intelligence_civilization_kernel_bootstrap → department_self_grant_production_authority_denied → workbench_dissent_preserved → consensus_only_not_verified_proof → unverified_accelerator_qpu_unavailable → quantum_without_classical_baseline_rejected → product_factory_self_promote_denied → sealed_raw_private_silent_universe_route_denied → recovery_without_heartbeat_not_running_verified → no_powered_node_waiting_or_offline_stopped → accounting_scheduler_cannot_spend_bill → evidence → learning',
    'Intelligence Civilization Kernel cycle recorded in order.',
  );

  check(
    'US-CZ-locks',
    CZ_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CZ_LOCKS.DEPARTMENT_SELF_GRANT_PRODUCTION_AUTHORITY === false &&
      CZ_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF === false &&
      CZ_LOCKS.DISSENT_SILENCED_BY_MAJORITY === false &&
      CZ_LOCKS.PRODUCT_FACTORY_SELF_PROMOTE === false &&
      CZ_LOCKS.SCHEDULER_SPEND_BILL_ENABLED === false &&
      CZ_LOCKS.SEALED_RAW_PRIVATE_SILENT_UNIVERSE_ROUTE === false &&
      CZ_LOCKS.RECOVERY_INVENTS_RUNNING_VERIFIED === false &&
      CZ_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      CZ_LOCKS.OFFLINE_DEVICES_PRETEND_RUNNING === false &&
      CZ_LOCKS.UNSAFE_MEGA_MERGE === false &&
      CZ_LOCKS.KERNEL_IS_COEXISTENCE_LAYER &&
      CZ_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CZ_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CZ-honesty-surfaces',
    researchDepartmentNetworkHonesty().departmentSelfGrantProductionAuthority === false &&
      cognitiveWorkbenchHonesty().consensusEqVerifiedProof === false &&
      resourceSchedulerHonesty().spendBillEnabled === false &&
      productFactoryHonesty().selfPromote === false &&
      universeRoutingMeshHonesty().sealedRawPrivateSilentRoute === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-CZ-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DA —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CZ-predecessor-CW',
    preds.CW.tipProbe === 'PRESENT' && preds.CW.report === 'PRESENT',
    `CW tip=${preds.CW.tipProbe} report=${preds.CW.report}; CY=${preds.CY.tipProbe}/${preds.CY.report}; CX=${preds.CX.tipProbe}/${preds.CX.report}`,
  );
  check(
    'US-CZ-predecessor-CY-CX-waiting',
    preds.CY.tipProbe === 'WAITING_DATA' || preds.CY.tipProbe === 'PRESENT',
    `CY=${preds.CY.tipProbe} CX=${preds.CX.tipProbe} (WAITING_DATA documented when absent)`,
  );

  // Department cannot self-grant production authority
  const dept = await registerResearchDepartment({
    name: 'research-dept-1',
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
    actor: { ...actor, kind: 'department_agent', authorityLevel: 0 },
  });
  check(
    'US-CZ-department-self-grant-denied',
    selfGrant.accepted === false &&
      selfGrant.department?.productionAuthority === false &&
      selfGrant.reason === DEPARTMENT_SELF_GRANT_DENIED,
    selfGrant.reason,
  );

  // Workbench dissent preserved (not silenced by majority consensus-as-proof)
  const wb = await openCognitiveWorkbench({
    task: 'multi-model-decompose',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  await contributeWorkbenchEvidence({
    sessionId: wb.session!.id,
    modelOrAgentId: 'model-majority',
    content: 'majority-evidence',
    root,
    actor,
  });
  await contributeWorkbenchDissent({
    sessionId: wb.session!.id,
    modelOrAgentId: 'model-dissent',
    content: 'minority-dissent',
    root,
    actor,
  });
  const silence = await applyWorkbenchConsensus({
    sessionId: wb.session!.id,
    votesFor: 99,
    votesAgainst: 1,
    silenceDissent: true,
    root,
    actor,
  });
  check(
    'US-CZ-dissent-preserved',
    silence.session?.dissentSilenced === false &&
      workbenchDissentIntact(silence.session!) &&
      (silence.session?.dissent.length ?? 0) === 1 &&
      silence.reason === DISSENT_PRESERVED,
    silence.reason,
  );

  // Consensus-only output not labeled verified proof
  const proof = await applyWorkbenchConsensus({
    sessionId: wb.session!.id,
    votesFor: 100,
    votesAgainst: 0,
    claimVerifiedProof: true,
    root,
    actor,
  });
  check(
    'US-CZ-consensus-not-verified-proof',
    proof.accepted === false &&
      proof.session?.labeledVerifiedProof === false &&
      proof.reason === CONSENSUS_NOT_VERIFIED_PROOF,
    proof.reason,
  );

  // Unverified accelerator/QPU → UNAVAILABLE
  const unverifiedGpu = await registerSchedulerTarget({
    vendor: 'amd',
    configured: false,
    authorized: true,
    verified: false,
    root,
    actor,
  });
  const unverifiedQpu = await registerSchedulerTarget({
    vendor: 'quantum',
    configured: true,
    authorized: true,
    verified: false,
    root,
    actor,
  });
  const gpuJob = await scheduleResourceWorkload({
    vendor: 'amd',
    targetId: unverifiedGpu.id,
    root,
    actor,
  });
  const qpuJob = await scheduleResourceWorkload({
    vendor: 'quantum',
    targetId: unverifiedQpu.id,
    classicalBaselineRef: 'classical-ref-1',
    root,
    actor,
  });
  check(
    'US-CZ-unverified-accelerator-unavailable',
    unverifiedGpu.status === 'UNAVAILABLE' &&
      unverifiedQpu.status === 'UNAVAILABLE' &&
      gpuJob.status === 'UNAVAILABLE' &&
      qpuJob.status === 'UNAVAILABLE' &&
      gpuJob.reason === UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    `${gpuJob.reason};${qpuJob.reason}`,
  );

  // Quantum without classical baseline REJECTED
  const qNoBaseline = await scheduleResourceWorkload({
    vendor: 'quantum',
    classicalBaselineRef: null,
    root,
    actor,
  });
  check(
    'US-CZ-quantum-without-baseline-rejected',
    qNoBaseline.status === 'REJECTED' &&
      qNoBaseline.reason === QUANTUM_WITHOUT_BASELINE_REJECTED,
    qNoBaseline.reason,
  );

  // Verified NVIDIA with classical path succeeds (positive)
  const nvidia = await registerSchedulerTarget({
    vendor: 'nvidia',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const nvidiaJob = await scheduleResourceWorkload({
    vendor: 'nvidia',
    targetId: nvidia.id,
    root,
    actor,
  });
  check('US-CZ-verified-nvidia-scheduled', nvidiaJob.status === 'SCHEDULED', nvidiaJob.reason);

  // Product factory self-promote DENIED
  const product = await registerProductCandidate({
    name: 'sandbox-product',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const promote = await requestProductSelfPromote({
    productId: product.product!.id,
    root,
    actor,
  });
  check(
    'US-CZ-product-self-promote-denied',
    promote.accepted === false &&
      promote.product?.promoted === false &&
      promote.product?.productionAuthority === false &&
      promote.reason === PRODUCT_FACTORY_SELF_PROMOTE_DENIED,
    promote.reason,
  );

  // Sealed/raw private silent Universe route DENIED
  const sealed = await routeUniversePayload({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-remote',
    payload: 'sealed-data',
    contentClass: 'sealed',
    silentRoute: true,
    root,
    actor,
  });
  const rawPriv = await routeUniversePayload({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-remote',
    payload: 'raw-private-data',
    contentClass: 'raw_private',
    silentRoute: true,
    root,
    actor,
  });
  check(
    'US-CZ-sealed-raw-private-silent-denied',
    sealed.accepted === false &&
      rawPriv.accepted === false &&
      sealed.reason === SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED &&
      rawPriv.reason === SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
    `${sealed.reason};${rawPriv.reason}`,
  );

  // Authorized signed open route accepted
  await authorizeUniverseRouteLink({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    root,
    actor,
  });
  const openPayload = 'open-route-payload';
  const key = 'cz-test-key';
  const openRoute = await routeUniversePayload({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: openPayload,
    signature: signUniverseRoutePayload(openPayload, key),
    signingKey: key,
    contentClass: 'open',
    silentRoute: false,
    root,
    actor,
  });
  check('US-CZ-authorized-signed-route-accepted', openRoute.accepted === true, openRoute.reason);

  // Recovery cannot invent RUNNING_VERIFIED without heartbeat
  const node = await registerMeshNode({
    name: 'recovery-node',
    universeId: actor.universeId,
    authorized: true,
    poweredOn: true,
    root,
    actor,
  });
  const noHb = await attemptMeshRecovery({
    nodeId: node.node!.id,
    claimRunningVerified: true,
    root,
    actor,
  });
  check(
    'US-CZ-recovery-no-heartbeat-denied',
    noHb.accepted === false &&
      noHb.node?.status !== 'RUNNING_VERIFIED' &&
      noHb.reason === RECOVERY_NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
    noHb.reason,
  );

  // With heartbeat → RUNNING_VERIFIED allowed
  await recordMeshHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'pid=42;runtime=local',
    root,
    actor,
  });
  const withHb = await attemptMeshRecovery({
    nodeId: node.node!.id,
    claimRunningVerified: true,
    root,
    actor,
  });
  check(
    'US-CZ-recovery-with-heartbeat-verified',
    withHb.accepted === true && withHb.node?.status === 'RUNNING_VERIFIED',
    withHb.reason,
  );

  // No powered node → WAITING_NODE or OFFLINE_STOPPED
  await setMeshNodesPower({ poweredOn: false, stopMode: false, root, actor });
  const waiting = await attemptMeshRecovery({
    nodeId: node.node!.id,
    claimRunningVerified: true,
    stopMode: false,
    root,
    actor,
  });
  check(
    'US-CZ-no-powered-waiting-node',
    waiting.accepted === false &&
      waiting.node?.status === 'WAITING_NODE' &&
      waiting.reason === NO_POWERED_NODE_WAITING_OR_STOPPED,
    waiting.reason,
  );

  await setMeshNodesPower({ poweredOn: false, stopMode: true, root, actor });
  const stopped = await attemptMeshRecovery({
    nodeId: node.node!.id,
    claimRunningVerified: true,
    stopMode: true,
    root,
    actor,
  });
  check(
    'US-CZ-no-powered-offline-stopped',
    stopped.accepted === false &&
      stopped.node?.status === 'OFFLINE_STOPPED' &&
      stopped.reason === NO_POWERED_NODE_WAITING_OR_STOPPED,
    stopped.reason,
  );

  const truth = meshOfflineTruth([
    {
      id: 'x',
      name: 'x',
      universeId: actor.universeId,
      authorized: true,
      poweredOn: false,
      lastHeartbeatAt: null,
      runtimeEvidence: null,
      status: 'WAITING_NODE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  check(
    'US-CZ-mesh-offline-truth',
    truth.allAuthorizedOff === true &&
      (truth.status === 'WAITING_NODE' || truth.status === 'OFFLINE_STOPPED'),
    String(truth.status),
  );

  // Accounting/scheduler cannot spend/bill
  const spend = await attemptSchedulerSpendOrBill({
    amount: 999,
    kind: 'spend',
    root,
    actor,
  });
  const bill = await attemptSchedulerSpendOrBill({
    amount: 999,
    kind: 'bill',
    root,
    actor,
  });
  const factorySpend = await attemptFactorySpend({
    productId: product.product!.id,
    amount: 10,
    root,
    actor,
  });
  const scheduleSpend = await scheduleResourceWorkload({
    vendor: 'nvidia',
    targetId: nvidia.id,
    spendRequested: true,
    root,
    actor,
  });
  check(
    'US-CZ-accounting-scheduler-no-spend-bill',
    spend.accepted === false &&
      bill.accepted === false &&
      factorySpend.accepted === false &&
      scheduleSpend.status === 'DENIED' &&
      spend.reason === ACCOUNTING_SCHEDULER_SPEND_DENIED &&
      scheduleSpend.reason === ACCOUNTING_SCHEDULER_SPEND_DENIED,
    spend.reason,
  );

  // Fabric smoke
  const evt = await publishFabricEvent({
    kind: 'experiment',
    topic: 'cz-test',
    payload: 'exp-1',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    authorized: true,
    root,
    actor,
  });
  check('US-CZ-fabric-event-accepted', evt.accepted === true, evt.reason);

  const cycle = await runIntelligenceCivilizationKernelCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check('US-CZ-cycle-ok', cycle.ok === true, `hops=${cycle.hops.length}`);

  const health = await buildIntelligenceCivilizationKernelHealthReport({ root: repoRoot });
  check(
    'US-CZ-health-report',
    health.phase === '62L-CZ' &&
      health.productionAuthorized === false &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false &&
      health.draftPrCreated === false &&
      health.githubSotIssue === 117 &&
      health.gitlabCoordinationIssue === 51,
    health.honestyBanner,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL 62L-CZ (${failures.length})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-CZ intelligence civilization kernel');
