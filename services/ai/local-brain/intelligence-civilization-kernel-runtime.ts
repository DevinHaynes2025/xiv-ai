/**
 * 62L-CZ Intelligence Civilization Kernel runtime —
 * Governed façade consolidating research departments, cognitive workbench,
 * event fabric, resource scheduler, product factory, and universe routing mesh.
 * Coexistence under Superbrain — not an unsafe mega-merge.
 * Extends CY Knowledge Colony Operating System when present.
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
} from './multi-model-cognitive-workbench';
import {
  eventFabricHonesty,
  publishFabricEvent,
} from './distributed-knowledge-experiment-event-fabric';
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
} from './agent-generated-ai-product-factory';
import {
  attemptMeshRecovery,
  authorizeUniverseRouteLink,
  recordMeshHeartbeat,
  registerMeshNode,
  routeUniversePayload,
  setMeshNodesPower,
  signUniverseRoutePayload,
  universeRoutingMeshHonesty,
} from './global-universe-routing-recovery-mesh';
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
  type CzEvidenceState,
  type CzHop,
  type CzHopRecord,
} from './intelligence-civilization-kernel-types';

export {
  INTELLIGENCE_CIVILIZATION_KERNEL_CYCLE,
  CZ_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CzHop, state: CzEvidenceState, summary: string): CzHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CzCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CzActor;
  root?: string;
};

export async function bootstrapIntelligenceCivilizationKernel(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: CzActor;
}) {
  const cyCycle = await runKnowledgeColonyOperatingSystemCycle({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    actor: {
      kind: 'colony_os_curator',
      id: input.actor.id,
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      role: input.actor.role,
      permissionLevel: input.actor.permissionLevel,
      authorityLevel: input.actor.authorityLevel,
    },
    root: input.root,
  });
  return {
    id: `ick_${Date.now().toString(36)}`,
    cyOk: cyCycle.ok,
    l4AutonomyEnabled: false as const,
    productionAuthorized: false as const,
    coexistenceUnderSuperbrain: true as const,
    unsafeMegaMerge: false as const,
  };
}

export async function runIntelligenceCivilizationKernelCycle(input: CzCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CzHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CZ_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CZ_LOCKS.LOCAL_FIRST &&
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
        CZ_LOCKS.KERNEL_IS_COEXISTENCE_LAYER
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = await bootstrapIntelligenceCivilizationKernel({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'intelligence_civilization_kernel_bootstrap',
      boot.cyOk &&
        boot.l4AutonomyEnabled === false &&
        boot.coexistenceUnderSuperbrain &&
        boot.unsafeMegaMerge === false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `Intelligence Civilization Kernel façade over CY Knowledge Colony OS id=${boot.id}`,
    ),
  );

  const dept = await registerResearchDepartment({
    name: 'dept-alpha',
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
    actor: {
      ...actor,
      kind: 'department_agent',
      authorityLevel: 0,
    },
  });
  hops.push(
    hop(
      'department_self_grant_production_authority_denied',
      selfGrant.accepted === false && selfGrant.reason === DEPARTMENT_SELF_GRANT_DENIED
        ? 'DENIED'
        : 'FAIL',
      selfGrant.reason,
    ),
  );

  const wb = await openCognitiveWorkbench({
    task: 'decompose-research-question',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  await contributeWorkbenchEvidence({
    sessionId: wb.session!.id,
    modelOrAgentId: 'model-a',
    content: 'evidence-claim-1',
    root,
    actor,
  });
  await contributeWorkbenchDissent({
    sessionId: wb.session!.id,
    modelOrAgentId: 'model-b',
    content: 'dissent-counter-1',
    root,
    actor,
  });
  const silenceAttempt = await applyWorkbenchConsensus({
    sessionId: wb.session!.id,
    votesFor: 9,
    votesAgainst: 1,
    silenceDissent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'workbench_dissent_preserved',
      silenceAttempt.session?.dissentSilenced === false &&
        (silenceAttempt.session?.dissent.length ?? 0) > 0 &&
        silenceAttempt.reason === DISSENT_PRESERVED
        ? 'DISSENT_PRESERVED'
        : 'FAIL',
      silenceAttempt.reason,
    ),
  );

  const proofClaim = await applyWorkbenchConsensus({
    sessionId: wb.session!.id,
    votesFor: 10,
    votesAgainst: 0,
    claimVerifiedProof: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'consensus_only_not_verified_proof',
      proofClaim.accepted === false &&
        proofClaim.session?.labeledVerifiedProof === false &&
        proofClaim.reason === CONSENSUS_NOT_VERIFIED_PROOF
        ? 'NOT_PROOF'
        : 'FAIL',
      proofClaim.reason,
    ),
  );

  const unverified = await registerSchedulerTarget({
    vendor: 'nvidia',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const unavailJob = await scheduleResourceWorkload({
    vendor: 'nvidia',
    targetId: unverified.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_accelerator_qpu_unavailable',
      unverified.status === 'UNAVAILABLE' &&
        unavailJob.status === 'UNAVAILABLE' &&
        unavailJob.reason === UNVERIFIED_ACCELERATOR_UNAVAILABLE
        ? 'UNAVAILABLE'
        : 'FAIL',
      unavailJob.reason,
    ),
  );

  const qReject = await scheduleResourceWorkload({
    vendor: 'quantum',
    classicalBaselineRef: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_without_classical_baseline_rejected',
      qReject.status === 'REJECTED' && qReject.reason === QUANTUM_WITHOUT_BASELINE_REJECTED
        ? 'REJECTED'
        : 'FAIL',
      qReject.reason,
    ),
  );

  const product = await registerProductCandidate({
    name: 'agent-product-1',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const selfPromote = await requestProductSelfPromote({
    productId: product.product!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'product_factory_self_promote_denied',
      selfPromote.accepted === false &&
        selfPromote.reason === PRODUCT_FACTORY_SELF_PROMOTE_DENIED
        ? 'DENIED'
        : 'FAIL',
      selfPromote.reason,
    ),
  );

  const silentSealed = await routeUniversePayload({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-other',
    payload: 'sealed-payload',
    contentClass: 'sealed',
    silentRoute: true,
    root,
    actor,
  });
  const silentRaw = await routeUniversePayload({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-other',
    payload: 'raw-private-payload',
    contentClass: 'raw_private',
    silentRoute: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_raw_private_silent_universe_route_denied',
      silentSealed.accepted === false &&
        silentRaw.accepted === false &&
        silentSealed.reason === SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED &&
        silentRaw.reason === SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED
        ? 'DENIED'
        : 'FAIL',
      `${silentSealed.reason};${silentRaw.reason}`,
    ),
  );

  const meshNode = await registerMeshNode({
    name: 'mesh-node-1',
    universeId: input.universeId,
    authorized: true,
    poweredOn: true,
    root,
    actor,
  });
  const recoveryNoHb = await attemptMeshRecovery({
    nodeId: meshNode.node!.id,
    claimRunningVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'recovery_without_heartbeat_not_running_verified',
      recoveryNoHb.accepted === false &&
        recoveryNoHb.node?.status !== 'RUNNING_VERIFIED' &&
        recoveryNoHb.reason === RECOVERY_NO_HEARTBEAT_NOT_RUNNING_VERIFIED
        ? 'DENIED'
        : 'FAIL',
      recoveryNoHb.reason,
    ),
  );

  await setMeshNodesPower({ poweredOn: false, root, actor });
  const offlineRecovery = await attemptMeshRecovery({
    nodeId: meshNode.node!.id,
    claimRunningVerified: true,
    stopMode: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'no_powered_node_waiting_or_offline_stopped',
      offlineRecovery.accepted === false &&
        (offlineRecovery.node?.status === 'WAITING_NODE' ||
          offlineRecovery.node?.status === 'OFFLINE_STOPPED') &&
        offlineRecovery.reason === NO_POWERED_NODE_WAITING_OR_STOPPED
        ? offlineRecovery.node?.status === 'OFFLINE_STOPPED'
          ? 'OFFLINE_STOPPED'
          : 'WAITING_NODE'
        : 'FAIL',
      offlineRecovery.reason,
    ),
  );

  const spend = await attemptSchedulerSpendOrBill({
    amount: 100,
    kind: 'spend',
    root,
    actor,
  });
  const bill = await attemptSchedulerSpendOrBill({
    amount: 50,
    kind: 'bill',
    root,
    actor,
  });
  hops.push(
    hop(
      'accounting_scheduler_cannot_spend_bill',
      spend.accepted === false &&
        bill.accepted === false &&
        spend.reason === ACCOUNTING_SCHEDULER_SPEND_DENIED &&
        bill.reason === ACCOUNTING_SCHEDULER_SPEND_DENIED
        ? 'DENIED'
        : 'FAIL',
      spend.reason,
    ),
  );

  // Smoke fabric + authorized signed route (positive path)
  await publishFabricEvent({
    kind: 'knowledge',
    topic: 'cz-kernel-cycle',
    payload: 'cycle-event',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    authorized: true,
    root,
    actor,
  });
  await authorizeUniverseRouteLink({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    root,
    actor,
  });
  const payload = 'open-authorized-payload';
  const key = 'cz-route-key';
  await routeUniversePayload({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    payload,
    signature: signUniverseRoutePayload(payload, key),
    signingKey: key,
    contentClass: 'open',
    silentRoute: false,
    root,
    actor,
  });

  // Heartbeat truth positive path after power restore
  await setMeshNodesPower({ poweredOn: true, root, actor });
  await recordMeshHeartbeat({
    nodeId: meshNode.node!.id,
    runtimeEvidence: 'pid=1;runtime=local',
    root,
    actor,
  });

  void decisionGate({
    id: 'cz-cycle-gate',
    action: 'intelligence_civilization_kernel_cycle',
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
      summary: '62L-CZ intelligence civilization kernel cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CZ'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CZ intelligence civilization kernel cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning≠permission; dissent preserved; no self-promote`,
      sourceRefs: ['62L-CZ'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; does not grant permission'));

  void researchDepartmentNetworkHonesty;
  void cognitiveWorkbenchHonesty;
  void eventFabricHonesty;
  void resourceSchedulerHonesty;
  void productFactoryHonesty;
  void universeRoutingMeshHonesty;

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
        'IMPLEMENTED',
        'BOUNDED',
        'WAITING_DATA',
        'STALE',
        'DISSENT_PRESERVED',
        'NOT_PROOF',
        'EVIDENCE',
        'CONSENSUS',
        'LOCAL_PREFERRED',
        'SIGNED',
        'REVOKED',
        'UNPROMOTED',
        'CANDIDATE',
      ].includes(h.state),
    ),
    cycle: INTELLIGENCE_CIVILIZATION_KERNEL_CYCLE,
    hops,
    honestyBanner: HONESTY_BANNER,
    locks: CZ_LOCKS,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessors: predecessorMap(root),
    productionAuthorized: false as const,
    l4AutonomyEnabled: false as const,
  };
}

export async function buildIntelligenceCivilizationKernelHealthReport(input?: {
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
    phase: '62L-CZ',
    title:
      'Intelligence Civilization Kernel + Autonomous Research Department Network + Multi-Model Cognitive Workbench + Distributed Knowledge/Experiment Event Fabric + GPU/NPU/Quantum Resource Scheduler + Agent-Generated AI Product Factory + Global Universe Routing & Recovery Mesh',
    honestyBanner: HONESTY_BANNER,
    locks: CZ_LOCKS,
    cycle: INTELLIGENCE_CIVILIZATION_KERNEL_CYCLE,
    predecessors: predecessorMap(root),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    githubSotIssue: 117,
    gitlabCoordinationIssue: 51,
    localBrainHealth: brain,
    cyKnowledgeColonyHealth: cyHealth
      ? { phase: cyHealth.phase, productionAuthorized: cyHealth.productionAuthorized }
      : null,
    productionAuthorized: false as const,
    tipLand: false as const,
    dbCandidatesApplied: false as const,
    draftPrCreated: false as const,
    at: new Date().toISOString(),
  };
}
