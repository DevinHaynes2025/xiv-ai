import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  invokeDepartmentGateway,
  registerDepartmentGateway,
  departmentAgentGatewayHonesty,
} from './department-agent-gateway-network';
import {
  authorizeLakehouseFederation,
  lakehouseFederationHonesty,
  signLakehouseFederationPayload,
  submitLakehouseFederationPack,
} from './distributed-knowledge-lakehouse-federation';
import {
  evaluateModelConsensus,
  modelEvaluationRoutingHonesty,
  registerModelTarget,
} from './model-evaluation-routing-brain';
import {
  accountResourceExchange,
  computeResourceExchangeHonesty,
  matchComputeResource,
  registerExchangeTarget,
} from './adaptive-compute-resource-exchange';
import {
  advanceVentureGates,
  attemptVentureSelfPromotion,
  registerVentureSandboxProduct,
  ventureStudioHonesty,
} from './autonomous-ai-venture-studio-system';
import {
  attemptRestore,
  continuityGridHonesty,
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
  BACKUP_TEST_NOT_AUTO_PROD,
  COGNITIVE_SERVICE_MESH_CYCLE,
  CONSENSUS_NOT_VERIFIED_PROOF,
  DD_LOCKS,
  GATEWAY_BYPASS_DENIED,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  RAW_PRIVATE_FEDERATION_DENIED,
  RESOURCE_EXCHANGE_SPEND_DENIED,
  RESTORE_WITHOUT_AUTH_DENIED,
  UNSIGNED_BACKUP_PACK_REJECTED,
  UNSIGNED_FEDERATION_PACK_REJECTED,
  UNCONFIGURED_MODEL_UNAVAILABLE,
  UNVERIFIED_ACCELERATOR_DENIED,
  VENTURE_SELF_PROMOTION_DENIED,
  predecessorMap,
  type DdActor,
} from './cognitive-service-mesh-types';
import {
  buildCognitiveServiceMeshHealthReport,
  runCognitiveServiceMeshCycle,
} from './cognitive-service-mesh-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldd-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DdActor = {
  kind: 'mesh_curator',
  id: 'curator-dd-1',
  orgId: 'org-dd',
  tenantId: 'tenant-dd',
  universeId: 'univ-dd',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DD1-cycle',
    COGNITIVE_SERVICE_MESH_CYCLE.join(' → ') ===
      'honesty_locks → cognitive_service_mesh_bootstrap → gateway_bypass_sealed_auth_denied → raw_private_lakehouse_federation_denied → unsigned_federation_or_backup_pack_rejected → unconfigured_model_cloud_unavailable → evaluation_consensus_not_verified_proof → unverified_accelerator_exchange_denied → resource_exchange_cannot_purchase_bill → venture_studio_self_promote_denied → restore_without_recovery_authorization_denied → backup_restore_test_not_auto_production_restore → no_powered_node_waiting_or_stopped → evidence → learning',
    'Cognitive Service Mesh cycle recorded in order.',
  );

  check(
    'US-DD-locks',
    DD_LOCKS.L4_AUTONOMY_ENABLED === false &&
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
      DD_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DD_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DD-honesty-surfaces',
    departmentAgentGatewayHonesty().gatewayBypassSealedAuth === false &&
      lakehouseFederationHonesty().rawPrivateFederationDefault === false &&
      modelEvaluationRoutingHonesty().consensusEqVerifiedProof === false &&
      computeResourceExchangeHonesty().canPurchase === false &&
      ventureStudioHonesty().selfPromotionToProduction === false &&
      continuityGridHonesty().backupTestAutoProductionRestore === false &&
      cognitiveServiceMeshHonesty().l4AutonomyEnabled === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DD-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DE —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DD-predecessor-CY-or-better',
    preds.CY.tipProbe === 'PRESENT' ||
      preds.CX.tipProbe === 'PRESENT' ||
      preds.DC.tipProbe === 'PRESENT' ||
      preds.CZ.tipProbe === 'PRESENT',
    `DC=${preds.DC.tipProbe}/${preds.DC.report}; DB=${preds.DB.tipProbe}; DA=${preds.DA.tipProbe}; CZ=${preds.CZ.tipProbe}/${preds.CZ.report}; CY=${preds.CY.tipProbe}/${preds.CY.report}`,
  );

  // Gateway bypass of sealed/auth DENIED
  const gw = await registerDepartmentGateway({
    departmentId: 'dept-a',
    name: 'gw-a',
    authorizedScopes: ['read:public'],
    root,
    actor,
  });
  const bypass = await invokeDepartmentGateway({
    gatewayId: gw.gateway!.id,
    requestedScope: 'write:sealed',
    bypassSealed: true,
    bypassAuth: true,
    root,
    actor,
  });
  const outOfScope = await invokeDepartmentGateway({
    gatewayId: gw.gateway!.id,
    requestedScope: 'admin:all',
    root,
    actor,
  });
  check(
    'US-DD-gateway-bypass-sealed-auth-denied',
    bypass.accepted === false &&
      bypass.reason === GATEWAY_BYPASS_DENIED &&
      outOfScope.accepted === false &&
      outOfScope.reason === GATEWAY_BYPASS_DENIED,
    bypass.reason,
  );

  // Raw private lakehouse federation DENIED by default
  const raw = await submitLakehouseFederationPack({
    sourceLakehouseId: 'lh-1',
    targetLakehouseId: 'lh-2',
    assetClass: 'raw_private',
    payload: 'private',
    signature: signLakehouseFederationPayload('private', 'k'),
    root,
    actor,
  });
  check(
    'US-DD-raw-private-lakehouse-federation-denied',
    raw.accepted === false && raw.reason === RAW_PRIVATE_FEDERATION_DENIED,
    raw.reason,
  );

  // Unsigned federation/backup pack rejected
  const unsignedFed = await submitLakehouseFederationPack({
    sourceLakehouseId: 'lh-1',
    targetLakehouseId: 'lh-2',
    assetClass: 'approved_knowledge',
    payload: 'kpack',
    signature: null,
    root,
    actor,
  });
  const unsignedBackup = await submitBackupPack({
    universeId: actor.universeId,
    payload: 'bpack',
    signature: null,
    root,
    actor,
  });
  check(
    'US-DD-unsigned-federation-backup-rejected',
    unsignedFed.accepted === false &&
      unsignedFed.reason === UNSIGNED_FEDERATION_PACK_REJECTED &&
      unsignedBackup.accepted === false &&
      unsignedBackup.reason === UNSIGNED_BACKUP_PACK_REJECTED,
    `${unsignedFed.reason}; ${unsignedBackup.reason}`,
  );

  // Signed authorized federation accepted
  await authorizeLakehouseFederation({
    sourceLakehouseId: 'lh-1',
    targetLakehouseId: 'lh-2',
    root,
    actor,
  });
  const signedFed = await submitLakehouseFederationPack({
    sourceLakehouseId: 'lh-1',
    targetLakehouseId: 'lh-2',
    assetClass: 'approved_knowledge',
    payload: 'approved-k',
    signature: signLakehouseFederationPayload('approved-k', 'k'),
    root,
    actor,
  });
  check(
    'US-DD-signed-authorized-federation-accepted',
    signedFed.accepted === true,
    signedFed.reason,
  );

  // Unconfigured model/cloud → UNAVAILABLE
  const cloud = await registerModelTarget({
    kind: 'cloud',
    name: 'gpt-x',
    configured: false,
    root,
    actor,
  });
  check(
    'US-DD-unconfigured-model-cloud-unavailable',
    cloud.status === 'UNAVAILABLE' && cloud.reason === UNCONFIGURED_MODEL_UNAVAILABLE,
    cloud.reason,
  );

  // Evaluation consensus-only ≠ verified proof
  const consensus = await evaluateModelConsensus({
    topic: 't1',
    modelVotes: ['yes', 'yes'],
    claimConsensusIsProof: true,
    root,
    actor,
  });
  const consensusOk = await evaluateModelConsensus({
    topic: 't2',
    modelVotes: ['yes', 'yes'],
    root,
    actor,
  });
  check(
    'US-DD-evaluation-consensus-not-verified-proof',
    consensus.accepted === false &&
      consensus.artifact?.labeledVerifiedProof === false &&
      consensus.reason === CONSENSUS_NOT_VERIFIED_PROOF &&
      consensusOk.artifact?.status === 'CONSENSUS_ONLY' &&
      consensusOk.artifact.labeledVerifiedProof === false,
    consensus.reason,
  );

  // Unverified accelerator exchange DENIED/UNAVAILABLE
  const unverified = await registerExchangeTarget({
    kind: 'amd',
    configured: true,
    authorized: true,
    verified: false,
    root,
    actor,
  });
  const match = await matchComputeResource({
    targetKind: 'amd',
    root,
    actor,
  });
  check(
    'US-DD-unverified-accelerator-exchange-denied',
    unverified.status === 'UNAVAILABLE' &&
      unverified.reason === UNVERIFIED_ACCELERATOR_DENIED &&
      match.status === 'UNAVAILABLE',
    match.reason,
  );

  // Resource exchange cannot purchase/bill
  const purchase = await accountResourceExchange({
    action: 'purchase',
    units: 1,
    root,
    actor,
  });
  const bill = await accountResourceExchange({
    action: 'bill',
    units: 1,
    root,
    actor,
  });
  const account = await accountResourceExchange({
    action: 'account',
    units: 4,
    root,
    actor,
  });
  check(
    'US-DD-resource-exchange-cannot-purchase-bill',
    purchase.status === 'DENIED' &&
      bill.status === 'DENIED' &&
      purchase.reason === RESOURCE_EXCHANGE_SPEND_DENIED &&
      account.status === 'RECORDED',
    `${purchase.reason}; account=${account.status}`,
  );

  // Venture studio self-promote DENIED
  const venture = await registerVentureSandboxProduct({
    studioId: 's1',
    name: 'cand-1',
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
  check(
    'US-DD-venture-studio-self-promote-denied',
    promo.accepted === false && promo.reason === VENTURE_SELF_PROMOTION_DENIED,
    promo.reason,
  );

  // Restore without recovery authorization DENIED
  const backup = await submitBackupPack({
    universeId: actor.universeId,
    payload: 'snap-1',
    signature: signBackupPackPayload('snap-1', 'bk'),
    root,
    actor,
  });
  const restoreDenied = await attemptRestore({
    backupPackId: backup.pack!.id,
    recoveryAuthorized: false,
    root,
    actor,
  });
  check(
    'US-DD-restore-without-recovery-authorization-denied',
    restoreDenied.accepted === false &&
      restoreDenied.reason === RESTORE_WITHOUT_AUTH_DENIED,
    restoreDenied.reason,
  );

  // Backup/restore test ≠ auto production restore
  await grantRecoveryAuthorization({
    backupPackId: backup.pack!.id,
    root,
    actor,
  });
  const autoProd = await attemptRestore({
    backupPackId: backup.pack!.id,
    recoveryAuthorized: true,
    autoProductionRestore: true,
    root,
    actor,
  });
  const testOk = await attemptRestore({
    backupPackId: backup.pack!.id,
    recoveryAuthorized: true,
    autoProductionRestore: false,
    testMode: true,
    root,
    actor,
  });
  check(
    'US-DD-backup-restore-test-not-auto-production-restore',
    autoProd.accepted === false &&
      autoProd.reason === BACKUP_TEST_NOT_AUTO_PROD &&
      testOk.accepted === true &&
      testOk.attempt?.status === 'TEST_RECORDED' &&
      testOk.reason === BACKUP_TEST_NOT_AUTO_PROD,
    `${autoProd.reason}; test=${testOk.attempt?.status}`,
  );

  // No powered node → WAITING_NODE or OFFLINE_STOPPED
  const mesh = await bootstrapCognitiveServiceMesh({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  const node = await registerMeshNode({
    meshId: mesh.id,
    name: 'n1',
    authorizedNodePowered: true,
    root,
    actor,
  });
  await recordMeshNodeHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'pid=1',
    root,
    actor,
  });
  await setMeshNodePower({
    nodeId: node.node!.id,
    powered: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  const claim = await claimMeshNodeRunningVerified({
    nodeId: node.node!.id,
    root,
    actor,
  });
  const stopped = await setMeshNodePower({
    nodeId: node.node!.id,
    powered: false,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  check(
    'US-DD-no-powered-node-waiting-or-stopped',
    claim.accepted === false &&
      (claim.node?.status === 'WAITING_NODE' ||
        claim.node?.status === 'OFFLINE_STOPPED') &&
      claim.reason === NO_POWERED_NODE_WAITING_OR_STOPPED &&
      stopped.node?.status === 'OFFLINE_STOPPED',
    `${claim.reason} status=${claim.node?.status}/${stopped.node?.status}`,
  );

  const cycle = await runCognitiveServiceMeshCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'US-DD-cycle-health',
    cycle.ok === true &&
      cycle.hops.length === COGNITIVE_SERVICE_MESH_CYCLE.length &&
      cycle.honestyBanner === HONESTY_BANNER,
    `ok=${cycle.ok} hops=${cycle.hops.length}`,
  );

  const health = await buildCognitiveServiceMeshHealthReport({ root: repoRoot });
  check(
    'US-DD-health-report',
    health.phase === '62L-DD' &&
      health.githubSotIssue === 121 &&
      health.gitlabCoordinationIssue === 55 &&
      health.productionAuthorized === false &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false,
    `phase=${health.phase} sot=#${health.githubSotIssue}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DD stories:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DD Cognitive Service Mesh — all required stories passed');
