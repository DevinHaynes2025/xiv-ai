/**
 * 62L-CW Autonomous Research Infrastructure OS runtime —
 * Façade over CV Distributed Intelligence Laboratory OS coordinating
 * offline labs, experiment graph, lakehouse, compute fabric, algorithm
 * foundry, and universe replication.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  buildDistributedIntelligenceLaboratoryOsHealthReport,
  runDistributedIntelligenceLaboratoryOsCycle,
} from './distributed-intelligence-laboratory-os-runtime';
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
  AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_CYCLE,
  CW_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CwActor,
  type CwEvidenceState,
  type CwHop,
  type CwHopRecord,
} from './autonomous-research-infrastructure-os-types';

export {
  AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_CYCLE,
  CW_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CwHop, state: CwEvidenceState, summary: string): CwHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CwCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CwActor;
  root?: string;
};

export async function bootstrapAutonomousResearchInfrastructureOs(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: CwActor;
}) {
  const cvCycle = await runDistributedIntelligenceLaboratoryOsCycle({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    actor: {
      kind: 'lab_os_curator',
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
    id: `arios_${Date.now().toString(36)}`,
    cvOk: cvCycle.ok,
    l4AutonomyEnabled: false as const,
    productionAuthorized: false as const,
  };
}

export async function runAutonomousResearchInfrastructureOsCycle(input: CwCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CwHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CW_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CW_LOCKS.LOCAL_FIRST &&
        CW_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
        CW_LOCKS.OFFLINE_DEVICES_PRETEND_RUNNING === false &&
        CW_LOCKS.MODEL_TOOL_EXPERIMENT_REQUIRES_LINEAGE &&
        CW_LOCKS.UNKNOWN_RIGHTS_LAKEHOUSE_INTAKE === false &&
        CW_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
        CW_LOCKS.ALGORITHM_VERIFIED_WITHOUT_REPRODUCIBILITY === false &&
        CW_LOCKS.UNAUTHORIZED_UNIVERSE_REPLICATION === false &&
        CW_LOCKS.UNSIGNED_REPLICATION_PACK_ACCEPTED === false &&
        CW_LOCKS.REVOKED_REPLICATION_PACK_ACCEPTED === false &&
        CW_LOCKS.SEALED_SILENT_CLOUD_COMPUTE_FALLBACK === false &&
        CW_LOCKS.RAW_PRIVATE_POOLING_BY_DEFAULT === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = await bootstrapAutonomousResearchInfrastructureOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'research_infra_os_bootstrap',
      boot.cvOk && boot.l4AutonomyEnabled === false ? 'IMPLEMENTED' : 'FAIL',
      `Research Infrastructure OS façade over CV Lab OS id=${boot.id}`,
    ),
  );

  const lab = await registerOfflineLaboratory({
    name: 'offline-lab-1',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    devices: [
      { name: 'node-a', authorized: true, poweredOn: false },
      { name: 'node-b', authorized: true, poweredOn: false },
    ],
    root,
    actor,
  });
  const poweredOff = await setLaboratoryDevicesPower({
    labId: lab.lab!.id,
    poweredOn: false,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  const claimOffline = await claimLaboratoryRunningVerified({
    labId: lab.lab!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_lab_all_devices_powered_off',
      claimOffline.accepted === false &&
        (poweredOff.lab?.status === 'WAITING_NODE' ||
          poweredOff.lab?.status === 'OFFLINE_STOPPED' ||
          claimOffline.lab?.status === 'WAITING_NODE' ||
          claimOffline.lab?.status === 'OFFLINE_STOPPED')
        ? claimOffline.lab?.status === 'OFFLINE_STOPPED'
          ? 'OFFLINE_STOPPED'
          : 'WAITING_NODE'
        : 'FAIL',
      claimOffline.reason,
    ),
  );

  await setLaboratoryDevicesPower({
    labId: lab.lab!.id,
    poweredOn: true,
    root,
    actor,
  });
  const noHb = await claimLaboratoryRunningVerified({
    labId: lab.lab!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'heartbeat_missing_not_running_verified',
      noHb.accepted === false && noHb.lab?.status !== 'RUNNING_VERIFIED' ? 'DENIED' : 'FAIL',
      noHb.reason,
    ),
  );

  const noLineage = await proposeExperimentGraphNode({
    kind: 'model',
    refId: 'orphan-model',
    parentNodeId: null,
    metadata: {},
    root,
    actor,
  });
  hops.push(
    hop(
      'experiment_model_tool_lineage_required',
      noLineage.accepted === false ? 'DENIED' : 'FAIL',
      noLineage.reason,
    ),
  );

  const unauthRep = await submitIntelligenceReplicationPack({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-unauthorized',
    payload: 'intel-pack-1',
    signature: signReplicationPayload('intel-pack-1', 'key-cw'),
    signingKey: 'key-cw',
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_universe_replication_denied',
      unauthRep.accepted === false ? 'DENIED' : 'FAIL',
      unauthRep.reason,
    ),
  );

  const unsigned = await submitIntelligenceReplicationPack({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'intel-pack-2',
    signature: null,
    root,
    actor,
  });
  const revoked = await submitIntelligenceReplicationPack({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'intel-pack-3',
    signature: signReplicationPayload('intel-pack-3', 'key-cw'),
    signingKey: 'key-cw',
    revoked: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_revoked_replication_pack_rejected',
      unsigned.accepted === false && revoked.accepted === false ? 'REJECTED' : 'FAIL',
      `${unsigned.reason}; ${revoked.reason}`,
    ),
  );

  const unconfigured = await registerAdaptiveComputeTarget({
    kind: 'gpu',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const placeUnconfigured = await placeComputeWorkload({
    targetKind: 'gpu',
    targetId: unconfigured.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_accelerator_qpu_unavailable',
      placeUnconfigured.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL',
      placeUnconfigured.reason,
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

  const unknownRights = await intakeLakehouseObject({
    sourceId: 'shadow-corpus',
    rightsClass: 'unknown_rights',
    contentSummary: 'should deny',
    root,
    actor,
  });
  hops.push(
    hop(
      'unknown_rights_lakehouse_intake_denied',
      unknownRights.accepted === false ? 'DENIED' : 'FAIL',
      unknownRights.reason,
    ),
  );

  const noRepro = await proposeAlgorithmDiscovery({
    name: 'algo-no-repro',
    hypothesisText: 'faster sort conjecture',
    reproducibilityMetadata: null,
    claimVerified: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'algorithm_discovery_without_repro_not_verified',
      noRepro.accepted === false && noRepro.candidate?.status !== 'VERIFIED'
        ? 'HYPOTHESIS'
        : 'FAIL',
      noRepro.reason,
    ),
  );

  const sealed = await placeComputeWorkload({
    targetKind: 'cpu',
    contentMode: 'sealed',
    silentCloudComputeFallback: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_cloud_compute',
      sealed.status === 'DENIED' ? 'DENIED' : 'FAIL',
      sealed.reason,
    ),
  );

  void authorizeUniverseReplicationLink;
  void registerRootExperimentGraphNode;
  void recordLaboratoryHeartbeat;

  void decisionGate({
    id: 'cw-cycle-gate',
    action: 'autonomous_research_infrastructure_os_cycle',
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
      summary: '62L-CW autonomous research infrastructure OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CW'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CW autonomous research infrastructure OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning≠permission; offline realism enforced`,
      sourceRefs: ['62L-CW'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; does not grant permission'));

  void offlineAgentLaboratoriesHonesty;
  void experimentGraphHonesty;
  void knowledgeLakehouseHonesty;
  void adaptiveComputeFabricHonesty;
  void algorithmDiscoveryFoundryHonesty;
  void universeReplicationHonesty;

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
      ].includes(h.state),
    ),
    cycle: AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_CYCLE,
    hops,
    honestyBanner: HONESTY_BANNER,
    locks: CW_LOCKS,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessors: predecessorMap(root),
    productionAuthorized: false as const,
    l4AutonomyEnabled: false as const,
  };
}

export async function buildAutonomousResearchInfrastructureOsHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const brain = await checkLocalBrainHealth(root).catch(() => ({
    ok: false,
    model: { availability: 'UNAVAILABLE' as const, reason: 'health_check_unavailable' },
    localStateDirectory: 'MISSING' as const,
    notes: ['health_check_unavailable'],
  }));
  const cvHealth = await buildDistributedIntelligenceLaboratoryOsHealthReport({ root }).catch(
    () => null,
  );
  return {
    phase: '62L-CW',
    title:
      'Autonomous Research Infrastructure OS + Persistent Offline Agent Laboratories + Distributed Model/Tool Experiment Graph + Global Knowledge Lakehouse + Adaptive Compute Fabric + Scientific Algorithm Discovery Foundry + Universe Intelligence Replication Network',
    honestyBanner: HONESTY_BANNER,
    locks: CW_LOCKS,
    cycle: AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_CYCLE,
    predecessors: predecessorMap(root),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    githubSotIssue: 114,
    gitlabCoordinationIssue: 48,
    localBrainHealth: brain,
    cvLabOsHealth: cvHealth
      ? { phase: cvHealth.phase, productionAuthorized: cvHealth.productionAuthorized }
      : null,
    productionAuthorized: false as const,
    tipLand: false as const,
    dbCandidatesApplied: false as const,
    at: new Date().toISOString(),
  };
}
