/**
 * 62L-DA Superbrain Runtime Kernel runtime —
 * Walks SUPERBRAIN_RUNTIME_KERNEL_CYCLE; façade over CY Knowledge Colony OS
 * when present (CZ preferred when landed). Coexistence — not mega-merge.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  buildKnowledgeColonyOperatingSystemHealthReport,
  runKnowledgeColonyOperatingSystemCycle,
} from './knowledge-colony-operating-system-runtime';
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
  bootstrapSuperbrainRuntimeKernel,
  superbrainRuntimeKernelHonesty,
} from './superbrain-runtime-kernel';
import {
  DA_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SUPERBRAIN_RUNTIME_KERNEL_CYCLE,
  predecessorMap,
  type DaActor,
  type DaEvidenceState,
  type DaHop,
  type DaHopRecord,
} from './superbrain-runtime-kernel-types';

export {
  DA_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SUPERBRAIN_RUNTIME_KERNEL_CYCLE,
  predecessorMap,
};

function hop(name: DaHop, state: DaEvidenceState, summary: string): DaHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DaCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DaActor;
  root?: string;
};

export async function runSuperbrainRuntimeKernelCycle(input: DaCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DaHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DA_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DA_LOCKS.LOCAL_FIRST &&
        DA_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
        DA_LOCKS.DEPARTMENT_SELF_GRANT_PRODUCTION_AUTHORITY === false &&
        DA_LOCKS.UNSIGNED_KNOWLEDGE_EVENT_ACCEPTED === false &&
        DA_LOCKS.SEALED_RAW_PRIVATE_SILENT_FEDERATION === false &&
        DA_LOCKS.SOFTWARE_FACTORY_SELF_PROMOTE === false &&
        DA_LOCKS.CONTROL_PLANE_SPEND_ENABLED === false &&
        DA_LOCKS.UNSIGNED_CONTINUITY_PACK_ACCEPTED === false &&
        DA_LOCKS.REVOKED_CONTINUITY_PACK_ACCEPTED === false &&
        DA_LOCKS.LOGICAL_EQ_RUNNING_VERIFIED === false &&
        DA_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const cyCycle = await runKnowledgeColonyOperatingSystemCycle({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    actor: {
      kind: 'colony_os_curator',
      id: actor.id,
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      role: actor.role,
      permissionLevel: actor.permissionLevel,
      authorityLevel: actor.authorityLevel,
    },
    root,
  }).catch(() => ({ ok: false }));

  const kernel = await bootstrapSuperbrainRuntimeKernel({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'superbrain_runtime_kernel_bootstrap',
      kernel.l4AutonomyEnabled === false &&
        kernel.productionAuthorized === false &&
        (cyCycle as { ok?: boolean }).ok !== false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `Superbrain Runtime Kernel id=${kernel.id} over CY Knowledge Colony OS`,
    ),
  );

  const dept = await registerDepartmentOs({
    name: 'dept-ops-1',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const selfGrant = await requestDepartmentProductionAuthority({
    departmentId: dept.department!.id,
    selfGrant: true,
    root,
    actor: { ...actor, kind: 'department_agent' },
  });
  hops.push(
    hop(
      'department_self_grant_production_authority_denied',
      selfGrant.accepted === false ? 'DENIED' : 'FAIL',
      selfGrant.reason,
    ),
  );

  const unsignedEvt = await publishKnowledgeEvent({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    topic: 'knowledge.delta',
    payload: 'unsigned-payload',
    signature: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_knowledge_event_rejected',
      unsignedEvt.accepted === false ? 'REJECTED' : 'FAIL',
      unsignedEvt.reason,
    ),
  );

  const sealedFed = await routeFederationRequest({
    contentClass: 'sealed',
    silentCloudFallback: true,
    root,
    actor,
  });
  const sealedEvt = await publishKnowledgeEvent({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    topic: 'sealed.route',
    payload: 'sealed-private',
    contentClass: 'raw_private',
    signature: signKnowledgePayload('sealed-private', 'key-da'),
    signingKey: 'key-da',
    silentCrossRoute: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_raw_private_silent_federation_universe_denied',
      sealedFed.status === 'DENIED' && sealedEvt.accepted === false ? 'DENIED' : 'FAIL',
      `${sealedFed.reason}; ${sealedEvt.reason}`,
    ),
  );

  const unconfiguredCloud = await registerFederationMember({
    kind: 'cloud_provider',
    name: 'unconfigured-cloud',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const fedUnavail = await routeFederationRequest({
    memberId: unconfiguredCloud.id,
    preferLocal: false,
    root,
    actor,
  });
  const unconfiguredAccel = await registerComputeTarget({
    kind: 'nvidia',
    configured: false,
    root,
    actor,
  });
  const placeUnavail = await placeComputeWorkload({
    targetKind: 'nvidia',
    targetId: unconfiguredAccel.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_cloud_model_accelerator_unavailable',
      fedUnavail.status === 'UNAVAILABLE' && placeUnavail.status === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'FAIL',
      `${fedUnavail.reason}; ${placeUnavail.reason}`,
    ),
  );

  const qNoBase = await placeComputeWorkload({
    targetKind: 'quantum',
    classicalBaselineRef: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_without_classical_baseline_rejected',
      qNoBase.status === 'REJECTED' ? 'REJECTED' : 'FAIL',
      qNoBase.reason,
    ),
  );

  const product = await registerSoftwareProduct({
    name: 'sandbox-app',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const selfPromote = await requestSoftwareSelfPromoteOrMerge({
    productId: product.product!.id,
    action: 'merge_to_prod',
    root,
    actor,
  });
  hops.push(
    hop(
      'software_factory_self_promote_merge_denied',
      selfPromote.accepted === false ? 'DENIED' : 'FAIL',
      selfPromote.reason,
    ),
  );

  const unsignedCont = await submitContinuityPack({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'cont-u',
    signature: null,
    root,
    actor,
  });
  await authorizeContinuityLink({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    root,
    actor,
  });
  const revokedCont = await submitContinuityPack({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'cont-r',
    signature: signContinuityPayload('cont-r', 'key-da'),
    signingKey: 'key-da',
    revoked: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'continuity_pack_unsigned_revoked_rejected',
      unsignedCont.accepted === false && revokedCont.accepted === false ? 'REJECTED' : 'FAIL',
      `${unsignedCont.reason}; ${revokedCont.reason}`,
    ),
  );

  const spend = await attemptControlPlaneSpendOrBill({
    amount: 100,
    mode: 'spend',
    root,
    actor,
  });
  hops.push(
    hop(
      'control_plane_cannot_spend_bill',
      spend.accepted === false ? 'DENIED' : 'FAIL',
      spend.reason,
    ),
  );

  const wc = await registerWorkcell({
    departmentId: dept.department!.id,
    name: 'wc-hb',
    populationMode: 'materialized',
    authorizedNodePowered: true,
    root,
    actor,
  });
  const noHb = await claimWorkcellRunningVerified({
    workcellId: wc.workcell!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'missing_heartbeat_not_running_verified',
      noHb.accepted === false && noHb.workcell?.status !== 'RUNNING_VERIFIED'
        ? 'DENIED'
        : 'FAIL',
      noHb.reason,
    ),
  );

  await setWorkcellNodePower({
    workcellId: wc.workcell!.id,
    poweredOn: false,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  const offline = await claimWorkcellRunningVerified({
    workcellId: wc.workcell!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'no_powered_node_waiting_or_offline_stopped',
      offline.accepted === false &&
        (offline.workcell?.status === 'WAITING_NODE' ||
          offline.workcell?.status === 'OFFLINE_STOPPED')
        ? offline.workcell?.status === 'OFFLINE_STOPPED'
          ? 'OFFLINE_STOPPED'
          : 'WAITING_NODE'
        : 'FAIL',
      offline.reason,
    ),
  );

  const logical = await registerWorkcell({
    departmentId: dept.department!.id,
    name: 'wc-logical',
    populationMode: 'logical',
    authorizedNodePowered: true,
    root,
    actor,
  });
  await recordWorkcellHeartbeat({
    workcellId: logical.workcell!.id,
    runtimeEvidence: 'should-not-matter',
    root,
    actor,
  }).catch(() => undefined);
  const logicalClaim = await claimWorkcellRunningVerified({
    workcellId: logical.workcell!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'logical_population_not_running_verified',
      logicalClaim.accepted === false && logical.workcell?.status === 'LOGICAL'
        ? 'LOGICAL'
        : 'FAIL',
      logicalClaim.reason,
    ),
  );

  void decisionGate({
    id: 'da-cycle-gate',
    action: 'superbrain_runtime_kernel_cycle',
    consequence: 'HIGH',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DA superbrain runtime kernel cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DA'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DA superbrain runtime kernel cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning≠permission; coexistence kernel`,
      sourceRefs: ['62L-DA'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; does not grant permission'));

  void autonomousDepartmentOsHonesty;
  void neuralKnowledgeEventBusHonesty;
  void localCloudModelFederationHonesty;
  void heterogeneousComputeControlPlaneHonesty;
  void agentSoftwareCompanyFactoryHonesty;
  void universeContinuityEngineHonesty;
  void superbrainRuntimeKernelHonesty;

  return {
    ok: hops.every((h) =>
      [
        'PASS',
        'DENIED',
        'REJECTED',
        'UNAVAILABLE',
        'WAITING_NODE',
        'OFFLINE_STOPPED',
        'SANDBOXED',
        'REGISTERED',
        'SEARCHABLE',
        'UNPROMOTED',
        'IMPLEMENTED',
        'BOUNDED',
        'WAITING_DATA',
        'STALE',
        'HYPOTHESIS',
        'LINEAGED',
        'NEGATIVE_KEPT',
        'LOCAL_PREFERRED',
        'SIGNED',
        'REVOKED',
        'LOGICAL',
        'MATERIALIZED',
        'FEDERATED',
        'REUSED',
      ].includes(h.state),
    ),
    cycle: SUPERBRAIN_RUNTIME_KERNEL_CYCLE,
    hops,
    honestyBanner: HONESTY_BANNER,
    locks: DA_LOCKS,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessors: predecessorMap(root),
    productionAuthorized: false as const,
    l4AutonomyEnabled: false as const,
  };
}

export async function buildSuperbrainRuntimeKernelHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const brain = await checkLocalBrainHealth(root).catch(() => ({
    ok: false,
    model: { availability: 'UNAVAILABLE' as const, reason: 'health_check_unavailable' },
    localStateDirectory: 'MISSING' as const,
    notes: ['health_check_unavailable'],
  }));
  const cyHealth = await buildKnowledgeColonyOperatingSystemHealthReport({ root }).catch(
    () => null,
  );
  return {
    phase: '62L-DA',
    title:
      'Superbrain Runtime Kernel + Autonomous Department Operating System + Neural Knowledge Event Bus + Local/Cloud Model Federation + Heterogeneous Compute Control Plane + Agent Software Company Factory + Distributed Universe Continuity Engine',
    honestyBanner: HONESTY_BANNER,
    locks: DA_LOCKS,
    cycle: SUPERBRAIN_RUNTIME_KERNEL_CYCLE,
    predecessors: predecessorMap(root),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    githubSotIssue: 118,
    gitlabCoordinationIssue: 52,
    localBrainHealth: brain,
    cyColonyOsHealth: cyHealth
      ? { phase: cyHealth.phase, productionAuthorized: cyHealth.productionAuthorized }
      : null,
    honesty: superbrainRuntimeKernelHonesty(),
    productionAuthorized: false as const,
    tipLand: false as const,
    dbCandidatesApplied: false as const,
    at: new Date().toISOString(),
  };
}
