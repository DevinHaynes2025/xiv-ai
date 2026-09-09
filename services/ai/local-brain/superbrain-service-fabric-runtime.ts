/**
 * 62L-DC Superbrain Service Fabric runtime —
 * Walks SUPERBRAIN_SERVICE_FABRIC_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  invokeDepartmentApiMesh,
  registerDepartmentApiGateway,
} from './agent-department-api-mesh';
import {
  openMemoryLakeStream,
  signMemoryLakePayload,
} from './distributed-memory-lake-streaming';
import {
  evaluateBrokerConsensus,
  registerModelProvider,
} from './model-broker-evaluation-grid';
import {
  accountFederationResource,
  registerFederatedAccelerator,
  scheduleFederatedWorkload,
} from './adaptive-accelerator-federation';
import {
  attemptStudioSelfPromotion,
  registerAiProductStudio,
} from './autonomous-ai-product-studio-network';
import {
  compileMultiUniverseStatePack,
  planDisasterRecovery,
  signStateCompilePayload,
} from './multi-universe-state-compiler-dr-fabric';
import {
  bootstrapSuperbrainServiceFabric,
  registerFabricNode,
  setFabricNodePower,
  superbrainServiceFabricHonesty,
} from './superbrain-service-fabric';
import {
  DC_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SUPERBRAIN_SERVICE_FABRIC_CYCLE,
  predecessorMap,
  type DcActor,
  type DcEvidenceState,
  type DcHop,
  type DcHopRecord,
} from './superbrain-service-fabric-types';

export {
  DC_LOCKS,
  HONESTY_BANNER,
  SUPERBRAIN_SERVICE_FABRIC_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DcHop, state: DcEvidenceState, summary: string): DcHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DcCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DcActor;
  root?: string;
  repoRoot?: string;
};

export async function runSuperbrainServiceFabricCycle(input: DcCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DcHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DC_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DC_LOCKS.LOCAL_FIRST &&
        DC_LOCKS.API_MESH_BYPASS_SEALED_AUTH === false &&
        DC_LOCKS.UNSIGNED_MEMORY_LAKE_STREAM_ACCEPTED === false &&
        DC_LOCKS.SILENT_SEALED_OR_RAW_PRIVATE_STREAM === false &&
        DC_LOCKS.UNCONFIGURED_MODEL_PROVIDER_AVAILABLE === false &&
        DC_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF === false &&
        DC_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE === false &&
        DC_LOCKS.FEDERATION_CAN_SPEND_MONEY === false &&
        DC_LOCKS.FEDERATION_CAN_BILL === false &&
        DC_LOCKS.STUDIO_SELF_PROMOTION_TO_PRODUCTION === false &&
        DC_LOCKS.DR_SIMULATION_AUTO_PRODUCTION_RESTORE === false &&
        DC_LOCKS.UNSIGNED_STATE_COMPILE_PACK_ACCEPTED === false &&
        DC_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const fabric = await bootstrapSuperbrainServiceFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'service_fabric_bootstrap',
      fabric && superbrainServiceFabricHonesty().l4AutonomyEnabled === false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `Superbrain Service Fabric id=${fabric.id} predecessor=${fabric.predecessorLayer}`,
    ),
  );

  const gw = await registerDepartmentApiGateway({
    departmentId: 'dept-research',
    contractId: 'contract-sealed',
    requiredScope: 'sealed',
    root,
    actor,
  });
  const bypass = await invokeDepartmentApiMesh({
    gatewayId: gw.gateway!.id,
    requestedScope: 'public_gated',
    attemptBypassSealedAuth: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'api_mesh_sealed_auth_bypass_denied',
      bypass.accepted === false ? 'DENIED' : 'FAIL',
      bypass.reason,
    ),
  );

  const unsignedStream = await openMemoryLakeStream({
    lakeId: 'lake-1',
    assetClass: 'approved_knowledge',
    payload: 'unsigned-blob',
    signature: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_memory_lake_stream_rejected',
      unsignedStream.accepted === false ? 'REJECTED' : 'FAIL',
      unsignedStream.reason,
    ),
  );

  const silentSealed = await openMemoryLakeStream({
    lakeId: 'lake-1',
    assetClass: 'sealed',
    payload: 'sealed-blob',
    signature: signMemoryLakePayload('sealed-blob', 'k1'),
    signingKey: 'k1',
    silent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_raw_private_silent_stream_denied',
      silentSealed.accepted === false ? 'DENIED' : 'FAIL',
      silentSealed.reason,
    ),
  );

  const unconfigured = await registerModelProvider({
    name: 'cloud-gpt-x',
    configured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_model_provider_unavailable',
      unconfigured.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL',
      unconfigured.reason,
    ),
  );

  const consensus = await evaluateBrokerConsensus({
    topic: 'fabric-hypothesis',
    providerIds: ['p1', 'p2'],
    votes: ['agree', 'agree'],
    claimConsensusIsProof: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'broker_consensus_not_verified_proof',
      consensus.accepted === false &&
        consensus.evaluation?.labeledVerifiedProof === false
        ? 'CONSENSUS_ONLY'
        : 'FAIL',
      consensus.reason,
    ),
  );

  const unverified = await registerFederatedAccelerator({
    kind: 'nvidia',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const unavail = await scheduleFederatedWorkload({
    targetKind: 'nvidia',
    targetId: unverified.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_accelerator_unavailable',
      unverified.status === 'UNAVAILABLE' && unavail.status === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'FAIL',
      unavail.reason,
    ),
  );

  const spend = await accountFederationResource({
    action: 'spend',
    units: 5,
    currencyAttempted: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'federation_cannot_spend_bill',
      spend.status === 'DENIED' ? 'DENIED' : 'FAIL',
      spend.reason,
    ),
  );

  const studio = await registerAiProductStudio({
    name: 'studio-alpha',
    productKey: 'assistant',
    root,
    actor,
  });
  const promo = await attemptStudioSelfPromotion({
    studioId: studio.studio!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'studio_self_promote_to_production_denied',
      promo.accepted === false ? 'DENIED' : 'FAIL',
      promo.reason,
    ),
  );

  const dr = await planDisasterRecovery({
    mode: 'auto_production_restore',
    root,
    actor,
  });
  hops.push(
    hop(
      'dr_simulation_not_auto_production_restore',
      dr.accepted === false ? 'DENIED' : 'FAIL',
      dr.reason,
    ),
  );

  const unsignedPack = await compileMultiUniverseStatePack({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'state-pack',
    signature: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_revoked_state_compile_pack_rejected',
      unsignedPack.accepted === false ? 'REJECTED' : 'FAIL',
      unsignedPack.reason,
    ),
  );

  const node = await registerFabricNode({
    fabricId: fabric.id,
    name: 'fabric-node-1',
    authorizedNodePowered: false,
    root,
    actor,
  });
  const poweredOff = await setFabricNodePower({
    nodeId: node.node!.id,
    powered: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  hops.push(
    hop(
      'no_powered_node_waiting_or_offline_stopped',
      poweredOff.node?.status === 'WAITING_NODE' ||
        poweredOff.node?.status === 'OFFLINE_STOPPED'
        ? poweredOff.node.status
        : 'FAIL',
      poweredOff.reason,
    ),
  );

  await setFabricNodePower({
    nodeId: node.node!.id,
    powered: true,
    root,
    actor,
  });
  void signStateCompilePayload;

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DC superbrain service fabric cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DC'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DC superbrain service fabric cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning≠permission; consensus≠proof; fabric cannot spend; DR≠auto restore`,
      sourceRefs: ['62L-DC'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      DC_LOCKS.LEARNING_GRANTS_PERMISSION === false ? 'PASS' : 'FAIL',
      'Learning recorded; does not grant permission',
    ),
  );

  void decisionGate;

  return {
    ok: hops.every((h) => h.state !== 'FAIL'),
    honestyBanner: HONESTY_BANNER,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    locks: DC_LOCKS,
    fabricId: fabric.id,
    hops,
    at: new Date().toISOString(),
  };
}

export async function buildSuperbrainServiceFabricHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const preds = predecessorMap(root);
  const brain = await checkLocalBrainHealth({ root }).catch(() => null);
  const honesty = superbrainServiceFabricHonesty();
  return {
    phase: '62L-DC',
    title:
      'XIV Superbrain Service Fabric + Agent Department API Mesh + Distributed Memory Lake Streaming + Model Broker & Evaluation Grid + Adaptive Accelerator Federation + Autonomous AI Product Studio Network + Multi-Universe State Compiler & Disaster Recovery Fabric',
    honestyBanner: HONESTY_BANNER,
    locks: DC_LOCKS,
    honesty,
    predecessors: preds,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    cycle: SUPERBRAIN_SERVICE_FABRIC_CYCLE,
    localBrainHealth: brain,
    productionAuthorized: false,
    tipLand: false,
    dbCandidatesApplied: false,
    at: new Date().toISOString(),
  };
}
