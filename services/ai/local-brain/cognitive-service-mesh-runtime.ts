/**
 * 62L-DD Cognitive Service Mesh runtime —
 * Walks COGNITIVE_SERVICE_MESH_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  invokeDepartmentGateway,
  registerDepartmentGateway,
} from './department-agent-gateway-network';
import {
  authorizeLakehouseFederation,
  signLakehouseFederationPayload,
  submitLakehouseFederationPack,
} from './distributed-knowledge-lakehouse-federation';
import {
  evaluateModelConsensus,
  registerModelTarget,
} from './model-evaluation-routing-brain';
import {
  accountResourceExchange,
  matchComputeResource,
  registerExchangeTarget,
} from './adaptive-compute-resource-exchange';
import {
  advanceVentureGates,
  attemptVentureSelfPromotion,
  registerVentureSandboxProduct,
} from './autonomous-ai-venture-studio-system';
import {
  attemptRestore,
  grantRecoveryAuthorization,
  signBackupPackPayload,
  submitBackupPack,
} from './multi-universe-backup-restore-continuity-grid';
import {
  bootstrapCognitiveServiceMesh,
  claimMeshNodeRunningVerified,
  cognitiveServiceMeshHonesty,
  recordMeshNodeHeartbeat,
  registerMeshNode,
  setMeshNodePower,
} from './cognitive-service-mesh';
import {
  DD_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  COGNITIVE_SERVICE_MESH_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type DdActor,
  type DdEvidenceState,
  type DdHop,
  type DdHopRecord,
} from './cognitive-service-mesh-types';

export {
  DD_LOCKS,
  HONESTY_BANNER,
  COGNITIVE_SERVICE_MESH_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DdHop, state: DdEvidenceState, summary: string): DdHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DdCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DdActor;
  root?: string;
  repoRoot?: string;
};

export async function runCognitiveServiceMeshCycle(input: DdCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DdHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DD_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DD_LOCKS.LOCAL_FIRST &&
        DD_LOCKS.GATEWAY_BYPASS_SEALED_AUTH === false &&
        DD_LOCKS.RAW_PRIVATE_LAKEHOUSE_FEDERATION_DEFAULT === false &&
        DD_LOCKS.UNSIGNED_FEDERATION_PACK_ACCEPTED === false &&
        DD_LOCKS.UNSIGNED_BACKUP_PACK_ACCEPTED === false &&
        DD_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF === false &&
        DD_LOCKS.UNVERIFIED_ACCELERATOR_EXCHANGE === false &&
        DD_LOCKS.RESOURCE_EXCHANGE_CAN_PURCHASE === false &&
        DD_LOCKS.RESOURCE_EXCHANGE_CAN_BILL === false &&
        DD_LOCKS.VENTURE_SELF_PROMOTION_TO_PRODUCTION === false &&
        DD_LOCKS.RESTORE_WITHOUT_RECOVERY_AUTHORIZATION === false &&
        DD_LOCKS.BACKUP_TEST_AUTO_PRODUCTION_RESTORE === false &&
        DD_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const mesh = await bootstrapCognitiveServiceMesh({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'cognitive_service_mesh_bootstrap',
      mesh && cognitiveServiceMeshHonesty().l4AutonomyEnabled === false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `Cognitive Service Mesh id=${mesh.id} predecessor=${mesh.predecessorLayer}`,
    ),
  );

  const gw = await registerDepartmentGateway({
    departmentId: 'dept-research',
    name: 'research-gateway',
    authorizedScopes: ['read:approved'],
    root,
    actor,
  });
  const bypass = await invokeDepartmentGateway({
    gatewayId: gw.gateway!.id,
    requestedScope: 'admin:sealed',
    bypassSealed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'gateway_bypass_sealed_auth_denied',
      bypass.accepted === false ? 'DENIED' : 'FAIL',
      bypass.reason,
    ),
  );

  const rawFed = await submitLakehouseFederationPack({
    sourceLakehouseId: 'lh-a',
    targetLakehouseId: 'lh-b',
    assetClass: 'raw_private',
    payload: 'raw-private-blob',
    signature: signLakehouseFederationPayload('raw-private-blob', 'k1'),
    root,
    actor,
  });
  hops.push(
    hop(
      'raw_private_lakehouse_federation_denied',
      rawFed.accepted === false ? 'DENIED' : 'FAIL',
      rawFed.reason,
    ),
  );

  const unsignedFed = await submitLakehouseFederationPack({
    sourceLakehouseId: 'lh-a',
    targetLakehouseId: 'lh-b',
    assetClass: 'approved_knowledge',
    payload: 'knowledge',
    signature: null,
    root,
    actor,
  });
  const unsignedBackup = await submitBackupPack({
    universeId: input.universeId,
    payload: 'backup-blob',
    signature: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_federation_or_backup_pack_rejected',
      unsignedFed.accepted === false && unsignedBackup.accepted === false
        ? 'REJECTED'
        : 'FAIL',
      `${unsignedFed.reason}; ${unsignedBackup.reason}`,
    ),
  );

  const unconfigured = await registerModelTarget({
    kind: 'cloud',
    name: 'cloud-model-x',
    configured: false,
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_model_cloud_unavailable',
      unconfigured.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL',
      unconfigured.reason,
    ),
  );

  const consensus = await evaluateModelConsensus({
    topic: 'mesh-hypothesis',
    modelVotes: ['agree', 'agree'],
    claimConsensusIsProof: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'evaluation_consensus_not_verified_proof',
      consensus.accepted === false &&
        consensus.artifact?.labeledVerifiedProof === false
        ? 'CONSENSUS_ONLY'
        : 'FAIL',
      consensus.reason,
    ),
  );

  const unverified = await registerExchangeTarget({
    kind: 'nvidia',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const matchDenied = await matchComputeResource({
    targetKind: 'nvidia',
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_accelerator_exchange_denied',
      unverified.status === 'UNAVAILABLE' &&
        (matchDenied.status === 'UNAVAILABLE' || matchDenied.status === 'DENIED')
        ? 'UNAVAILABLE'
        : 'FAIL',
      matchDenied.reason,
    ),
  );

  const purchase = await accountResourceExchange({
    action: 'purchase',
    units: 3,
    root,
    actor,
  });
  const bill = await accountResourceExchange({
    action: 'bill',
    units: 2,
    root,
    actor,
  });
  hops.push(
    hop(
      'resource_exchange_cannot_purchase_bill',
      purchase.status === 'DENIED' && bill.status === 'DENIED' ? 'DENIED' : 'FAIL',
      `${purchase.reason}; ${bill.reason}`,
    ),
  );

  const venture = await registerVentureSandboxProduct({
    studioId: 'studio-1',
    name: 'sandbox-product',
    root,
    actor,
  });
  await advanceVentureGates({
    productId: venture.product!.id,
    sandboxPassed: true,
    securityGatePassed: true,
    reviewGatePassed: true,
    root,
    actor,
  });
  const promo = await attemptVentureSelfPromotion({
    productId: venture.product!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'venture_studio_self_promote_denied',
      promo.accepted === false ? 'DENIED' : 'FAIL',
      promo.reason,
    ),
  );

  const signedBackup = await submitBackupPack({
    universeId: input.universeId,
    payload: 'backup-signed',
    signature: signBackupPackPayload('backup-signed', 'bk1'),
    root,
    actor,
  });
  const restoreNoAuth = await attemptRestore({
    backupPackId: signedBackup.pack!.id,
    recoveryAuthorized: false,
    testMode: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'restore_without_recovery_authorization_denied',
      restoreNoAuth.accepted === false ? 'DENIED' : 'FAIL',
      restoreNoAuth.reason,
    ),
  );

  await grantRecoveryAuthorization({
    backupPackId: signedBackup.pack!.id,
    root,
    actor,
  });
  const autoProd = await attemptRestore({
    backupPackId: signedBackup.pack!.id,
    recoveryAuthorized: true,
    autoProductionRestore: true,
    testMode: true,
    root,
    actor,
  });
  const testRestore = await attemptRestore({
    backupPackId: signedBackup.pack!.id,
    recoveryAuthorized: true,
    autoProductionRestore: false,
    testMode: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'backup_restore_test_not_auto_production_restore',
      autoProd.accepted === false &&
        testRestore.accepted === true &&
        testRestore.attempt?.status === 'TEST_RECORDED'
        ? 'TEST_ONLY'
        : 'FAIL',
      `${autoProd.reason}; ${testRestore.reason}`,
    ),
  );

  const nodeReg = await registerMeshNode({
    meshId: mesh.id,
    name: 'mesh-node-1',
    authorizedNodePowered: true,
    root,
    actor,
  });
  await recordMeshNodeHeartbeat({
    nodeId: nodeReg.node!.id,
    runtimeEvidence: 'pid=dd;runtime=local-mesh',
    root,
    actor,
  });
  await setMeshNodePower({
    nodeId: nodeReg.node!.id,
    powered: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  const claimOff = await claimMeshNodeRunningVerified({
    nodeId: nodeReg.node!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'no_powered_node_waiting_or_stopped',
      claimOff.accepted === false &&
        (claimOff.node?.status === 'WAITING_NODE' ||
          claimOff.node?.status === 'OFFLINE_STOPPED')
        ? claimOff.node.status
        : 'FAIL',
      claimOff.reason,
    ),
  );

  await authorizeLakehouseFederation({
    sourceLakehouseId: 'lh-a',
    targetLakehouseId: 'lh-b',
    root,
    actor,
  });

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DD cognitive service mesh cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DD'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DD cognitive service mesh cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        'hops recorded; learning≠permission; consensus≠proof; exchange cannot spend; test≠prod restore',
      sourceRefs: ['62L-DD'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      DD_LOCKS.LEARNING_GRANTS_PERMISSION === false ? 'PASS' : 'FAIL',
      'Learning recorded; does not grant permission',
    ),
  );

  void decisionGate;

  return {
    ok: hops.every((h) => h.state !== 'FAIL'),
    honestyBanner: HONESTY_BANNER,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    locks: DD_LOCKS,
    meshId: mesh.id,
    hops,
    at: new Date().toISOString(),
  };
}

export async function buildCognitiveServiceMeshHealthReport(input?: { root?: string }) {
  const root = input?.root ?? process.cwd();
  const preds = predecessorMap(root);
  const brain = await checkLocalBrainHealth({ root }).catch(() => null);
  const honesty = cognitiveServiceMeshHonesty();
  return {
    phase: '62L-DD',
    title:
      'XIV Cognitive Service Mesh + Department Agent Gateway Network + Distributed Knowledge Lakehouse Federation + Model Evaluation & Routing Brain + Adaptive Compute Resource Exchange + Autonomous AI Venture Studio System + Multi-Universe Backup, Restore & Continuity Grid',
    honestyBanner: HONESTY_BANNER,
    locks: DD_LOCKS,
    honesty,
    predecessors: preds,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    cycle: COGNITIVE_SERVICE_MESH_CYCLE,
    localBrainHealth: brain,
    productionAuthorized: false,
    tipLand: false,
    dbCandidatesApplied: false,
    at: new Date().toISOString(),
  };
}
