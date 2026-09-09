import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  invokeDepartmentApiMesh,
  registerDepartmentApiGateway,
  agentDepartmentApiMeshHonesty,
} from './agent-department-api-mesh';
import {
  memoryLakeStreamingHonesty,
  openMemoryLakeStream,
  signMemoryLakePayload,
} from './distributed-memory-lake-streaming';
import {
  brokerModelRoute,
  evaluateBrokerConsensus,
  modelBrokerEvaluationHonesty,
  registerModelProvider,
} from './model-broker-evaluation-grid';
import {
  accountFederationResource,
  adaptiveAcceleratorFederationHonesty,
  registerFederatedAccelerator,
  scheduleFederatedWorkload,
} from './adaptive-accelerator-federation';
import {
  aiProductStudioNetworkHonesty,
  attemptStudioSelfPromotion,
  registerAiProductStudio,
} from './autonomous-ai-product-studio-network';
import {
  compileMultiUniverseStatePack,
  multiUniverseStateCompilerDrHonesty,
  planDisasterRecovery,
  revokeStateCompilePack,
  signStateCompilePayload,
} from './multi-universe-state-compiler-dr-fabric';
import {
  bootstrapSuperbrainServiceFabric,
  claimFabricNodeRunningVerified,
  recordFabricNodeHeartbeat,
  registerFabricNode,
  setFabricNodePower,
  superbrainServiceFabricHonesty,
} from './superbrain-service-fabric';
import {
  API_MESH_SEALED_AUTH_BYPASS_DENIED,
  BROKER_CONSENSUS_NOT_VERIFIED_PROOF,
  DC_LOCKS,
  DR_SIMULATION_NOT_AUTO_RESTORE,
  FEDERATION_SPEND_DENIED,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
  STUDIO_SELF_PROMOTION_DENIED,
  SUPERBRAIN_SERVICE_FABRIC_CYCLE,
  UNCONFIGURED_MODEL_PROVIDER_UNAVAILABLE,
  UNSIGNED_MEMORY_LAKE_STREAM_REJECTED,
  UNSIGNED_OR_REVOKED_STATE_PACK_REJECTED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  predecessorMap,
  type DcActor,
} from './superbrain-service-fabric-types';
import {
  buildSuperbrainServiceFabricHealthReport,
  runSuperbrainServiceFabricCycle,
} from './superbrain-service-fabric-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldc-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DcActor = {
  kind: 'service_fabric_curator',
  id: 'curator-dc-1',
  orgId: 'org-dc',
  tenantId: 'tenant-dc',
  universeId: 'univ-dc',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-DC1-cycle',
    SUPERBRAIN_SERVICE_FABRIC_CYCLE.join(' → ') ===
      'honesty_locks → service_fabric_bootstrap → api_mesh_sealed_auth_bypass_denied → unsigned_memory_lake_stream_rejected → sealed_raw_private_silent_stream_denied → unconfigured_model_provider_unavailable → broker_consensus_not_verified_proof → unverified_accelerator_unavailable → federation_cannot_spend_bill → studio_self_promote_to_production_denied → dr_simulation_not_auto_production_restore → unsigned_revoked_state_compile_pack_rejected → no_powered_node_waiting_or_offline_stopped → evidence → learning',
    'Superbrain Service Fabric cycle recorded in order.',
  );

  check(
    'US-DC-locks',
    DC_LOCKS.L4_AUTONOMY_ENABLED === false &&
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
      DC_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DC_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DC-honesty-surfaces',
    agentDepartmentApiMeshHonesty().bypassSealedAuth === false &&
      memoryLakeStreamingHonesty().unsignedAccepted === false &&
      modelBrokerEvaluationHonesty().consensusEqVerifiedProof === false &&
      adaptiveAcceleratorFederationHonesty().canSpendMoney === false &&
      aiProductStudioNetworkHonesty().selfPromotionToProduction === false &&
      multiUniverseStateCompilerDrHonesty().drSimulationAutoProductionRestore ===
        false &&
      superbrainServiceFabricHonesty().publicExposureWithoutGates === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DC-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DD —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DC-predecessor-DB-or-DA-or-CY',
    preds.DB.tipProbe === 'PRESENT' ||
      preds.DA.tipProbe === 'PRESENT' ||
      preds.CY.tipProbe === 'PRESENT' ||
      preds.CX.tipProbe === 'PRESENT',
    `DB=${preds.DB.tipProbe}/${preds.DB.report}; DA=${preds.DA.tipProbe}/${preds.DA.report}; CZ=${preds.CZ.tipProbe}/${preds.CZ.report}; CY=${preds.CY.tipProbe}/${preds.CY.report}; CX=${preds.CX.tipProbe}/${preds.CX.report}`,
  );

  const fabric = await bootstrapSuperbrainServiceFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });

  const gw = await registerDepartmentApiGateway({
    departmentId: 'dept-ops',
    contractId: 'c-sealed',
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
  const underScope = await invokeDepartmentApiMesh({
    gatewayId: gw.gateway!.id,
    requestedScope: 'org_internal',
    root,
    actor,
  });
  check(
    'US-DC-api-mesh-cannot-bypass-sealed-auth',
    bypass.accepted === false &&
      underScope.accepted === false &&
      bypass.reason === API_MESH_SEALED_AUTH_BYPASS_DENIED &&
      underScope.reason === API_MESH_SEALED_AUTH_BYPASS_DENIED,
    bypass.reason,
  );

  const unsigned = await openMemoryLakeStream({
    lakeId: 'lake-dc',
    assetClass: 'approved_knowledge',
    payload: 'knowledge',
    signature: null,
    root,
    actor,
  });
  check(
    'US-DC-unsigned-memory-lake-stream-rejected',
    unsigned.accepted === false &&
      unsigned.reason === UNSIGNED_MEMORY_LAKE_STREAM_REJECTED,
    unsigned.reason,
  );

  const sealedSilent = await openMemoryLakeStream({
    lakeId: 'lake-dc',
    assetClass: 'sealed',
    payload: 'sealed',
    signature: signMemoryLakePayload('sealed', 'k1'),
    signingKey: 'k1',
    silent: true,
    root,
    actor,
  });
  const rawSilent = await openMemoryLakeStream({
    lakeId: 'lake-dc',
    assetClass: 'raw_private',
    payload: 'raw',
    signature: signMemoryLakePayload('raw', 'k1'),
    signingKey: 'k1',
    silent: true,
    root,
    actor,
  });
  check(
    'US-DC-sealed-raw-private-silent-stream-denied',
    sealedSilent.accepted === false &&
      rawSilent.accepted === false &&
      sealedSilent.reason === SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED &&
      rawSilent.reason === SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED,
    sealedSilent.reason,
  );

  const signedOk = await openMemoryLakeStream({
    lakeId: 'lake-dc',
    assetClass: 'approved_knowledge',
    payload: 'ok-knowledge',
    signature: signMemoryLakePayload('ok-knowledge', 'k1'),
    signingKey: 'k1',
    root,
    actor,
  });
  check('US-DC-signed-memory-stream-accepted', signedOk.accepted === true, signedOk.reason);

  const uncfg = await registerModelProvider({
    name: 'remote-unconfigured',
    configured: false,
    root,
    actor,
  });
  const route = await brokerModelRoute({
    providerId: uncfg.id,
    root,
    actor,
  });
  check(
    'US-DC-unconfigured-model-provider-unavailable',
    uncfg.status === 'UNAVAILABLE' &&
      route.accepted === false &&
      route.reason === UNCONFIGURED_MODEL_PROVIDER_UNAVAILABLE,
    route.reason,
  );

  const consensusProof = await evaluateBrokerConsensus({
    topic: 'claim',
    providerIds: [uncfg.id],
    votes: ['yes', 'yes', 'yes'],
    claimConsensusIsProof: true,
    root,
    actor,
  });
  const consensusOnly = await evaluateBrokerConsensus({
    topic: 'eval',
    providerIds: [uncfg.id],
    votes: ['yes', 'yes'],
    claimConsensusIsProof: false,
    root,
    actor,
  });
  check(
    'US-DC-broker-consensus-not-verified-proof',
    consensusProof.accepted === false &&
      consensusProof.reason === BROKER_CONSENSUS_NOT_VERIFIED_PROOF &&
      consensusProof.evaluation?.labeledVerifiedProof === false &&
      consensusOnly.accepted === true &&
      consensusOnly.evaluation?.status === 'CONSENSUS_ONLY' &&
      consensusOnly.evaluation.labeledVerifiedProof === false,
    `${consensusProof.reason}; status=${consensusOnly.evaluation?.status}`,
  );

  const unverified = await registerFederatedAccelerator({
    kind: 'amd',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const schedFail = await scheduleFederatedWorkload({
    targetKind: 'amd',
    targetId: unverified.id,
    root,
    actor,
  });
  check(
    'US-DC-unverified-accelerator-unavailable',
    unverified.status === 'UNAVAILABLE' &&
      schedFail.status === 'UNAVAILABLE' &&
      schedFail.reason === UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    schedFail.reason,
  );

  const spend = await accountFederationResource({
    action: 'spend',
    units: 10,
    currencyAttempted: true,
    root,
    actor,
  });
  const bill = await accountFederationResource({
    action: 'bill',
    units: 2,
    root,
    actor,
  });
  const account = await accountFederationResource({
    action: 'account',
    units: 7,
    root,
    actor,
  });
  check(
    'US-DC-federation-cannot-spend-bill',
    spend.status === 'DENIED' &&
      bill.status === 'DENIED' &&
      spend.reason === FEDERATION_SPEND_DENIED &&
      account.status === 'RECORDED',
    `spend=${spend.reason}; account=${account.reason}`,
  );

  const studio = await registerAiProductStudio({
    name: 'dc-studio',
    productKey: 'research-tool',
    root,
    actor,
  });
  const promo = await attemptStudioSelfPromotion({
    studioId: studio.studio!.id,
    root,
    actor,
  });
  check(
    'US-DC-studio-self-promote-denied',
    promo.accepted === false &&
      promo.reason === STUDIO_SELF_PROMOTION_DENIED &&
      promo.studio?.productionAuthorized === false &&
      promo.studio?.isolated === true,
    promo.reason,
  );

  const autoRestore = await planDisasterRecovery({
    mode: 'auto_production_restore',
    root,
    actor,
  });
  const sim = await planDisasterRecovery({
    mode: 'simulation',
    root,
    actor,
  });
  const rollback = await planDisasterRecovery({
    mode: 'rollback_plan',
    root,
    actor,
  });
  check(
    'US-DC-dr-simulation-not-auto-production-restore',
    autoRestore.accepted === false &&
      autoRestore.reason === DR_SIMULATION_NOT_AUTO_RESTORE &&
      autoRestore.plan?.productionRestoreAuthorized === false &&
      sim.accepted === true &&
      sim.plan?.status === 'LABELED_SIMULATION' &&
      rollback.accepted === true &&
      rollback.plan?.status === 'PLAN_ONLY',
    autoRestore.reason,
  );

  const unsignedPack = await compileMultiUniverseStatePack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'state',
    signature: null,
    root,
    actor,
  });
  const signedPack = await compileMultiUniverseStatePack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'state-ok',
    signature: signStateCompilePayload('state-ok', 'k1'),
    signingKey: 'k1',
    root,
    actor,
  });
  await revokeStateCompilePack({
    packId: signedPack.pack!.id,
    root,
    actor,
  });
  const revokedReuse = await compileMultiUniverseStatePack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    payload: 'state-ok',
    signature: signStateCompilePayload('state-ok', 'k1'),
    signingKey: 'k1',
    packIdToReuse: signedPack.pack!.id,
    root,
    actor,
  });
  check(
    'US-DC-unsigned-revoked-state-compile-pack-rejected',
    unsignedPack.accepted === false &&
      unsignedPack.reason === UNSIGNED_OR_REVOKED_STATE_PACK_REJECTED &&
      signedPack.accepted === true &&
      revokedReuse.accepted === false &&
      revokedReuse.reason === UNSIGNED_OR_REVOKED_STATE_PACK_REJECTED,
    `${unsignedPack.reason}; revoked=${revokedReuse.reason}`,
  );

  const node = await registerFabricNode({
    fabricId: fabric.id,
    name: 'node-dc-1',
    authorizedNodePowered: false,
    root,
    actor,
  });
  const claimOff = await claimFabricNodeRunningVerified({
    nodeId: node.node!.id,
    root,
    actor,
  });
  check(
    'US-DC-no-powered-node-waiting-or-stopped',
    claimOff.accepted === false &&
      (claimOff.node?.status === 'WAITING_NODE' ||
        claimOff.node?.status === 'OFFLINE_STOPPED') &&
      claimOff.reason === NO_POWERED_NODE_WAITING_OR_STOPPED,
    `${claimOff.reason} status=${claimOff.node?.status}`,
  );

  const stopped = await setFabricNodePower({
    nodeId: node.node!.id,
    powered: false,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  check(
    'US-DC-offline-stopped',
    stopped.node?.status === 'OFFLINE_STOPPED',
    stopped.reason,
  );

  await setFabricNodePower({
    nodeId: node.node!.id,
    powered: true,
    root,
    actor,
  });
  const hb = await recordFabricNodeHeartbeat({
    nodeId: node.node!.id,
    runtimeEvidence: 'pid=1;runtime=fabric-node',
    root,
    actor,
  });
  check(
    'US-DC-heartbeat-running-verified',
    hb.accepted === true && hb.node?.status === 'RUNNING_VERIFIED',
    hb.reason,
  );

  const cycle = await runSuperbrainServiceFabricCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check('US-DC-cycle-ok', cycle.ok === true, `hops=${cycle.hops.length}`);

  const health = await buildSuperbrainServiceFabricHealthReport({ root: repoRoot });
  check(
    'US-DC-health-report',
    health.phase === '62L-DC' &&
      health.productionAuthorized === false &&
      health.githubSotIssue === 120 &&
      health.gitlabCoordinationIssue === 54,
    health.honestyBanner,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL 62L-DC (${failures.length})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DC superbrain service fabric tests passed');
