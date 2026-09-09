import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  claimColonyRunningVerified,
  evaluateOfflineColonyNetwork,
  recordColonyHeartbeat,
  registerResearchColony,
  setAuthorizedNodesPowered,
  offlineColonyNetworkHonesty,
} from './offline-research-colony-network';
import {
  attemptModelSelfPromotion,
  multiModelEvolutionLabHonesty,
  proposeSandboxEvolution,
} from './multi-model-evolution-laboratory';
import {
  attemptRawPrivateGlobalPool,
  publishMemoryProduct,
  scientificMemoryFabricHonesty,
} from './distributed-scientific-memory-fabric';
import {
  adaptiveAcceleratorGridHonesty,
  registerAcceleratorTarget,
  routeAcceleratorWorkload,
} from './adaptive-accelerator-grid';
import {
  attemptToolSelfPromotion,
  registerApprovedEcosystemTool,
  requestSandboxToolBuild,
  toolEcosystemHonesty,
} from './agent-built-research-tool-ecosystem';
import {
  compileCrossUniverseTransfer,
  intelligenceCompilerHonesty,
} from './cross-universe-intelligence-compiler';
import {
  ALL_NODES_OFFLINE_WAITING_OR_STOPPED,
  COMPILER_RAW_PRIVATE_DENIED,
  COMPILER_UNAPPROVED_DENIED,
  CX_LOCKS,
  HONESTY_BANNER,
  MODEL_SELF_PROMOTION_DENIED,
  NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  RAW_PRIVATE_GLOBAL_POOL_DENIED,
  SEALED_SILENT_CLOUD_ACCELERATOR_DENIED,
  TOOL_REUSE_PREFERRED,
  TOOL_SELF_PROMOTION_DENIED,
  UNSIGNED_MEMORY_PRODUCT_REJECTED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  predecessorMap,
  type CxActor,
} from './persistent-knowledge-civilization-types';
import {
  buildPersistentKnowledgeCivilizationHealthReport,
  runPersistentKnowledgeCivilizationCycle,
} from './persistent-knowledge-civilization-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcx-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CxActor = {
  kind: 'civilization_curator',
  id: 'curator-cx-1',
  orgId: 'org-cx',
  tenantId: 'tenant-cx',
  universeId: 'univ-cx',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 1,
};

try {
  check(
    'US-CX1-cycle',
    PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE.join(' → ') ===
      'honesty_locks → civilization_bootstrap → colony_no_powered_node_waiting_or_stopped → colony_missing_heartbeat_not_running_verified → raw_private_global_pool_denied → model_self_promotion_to_production_denied → unsigned_memory_product_rejected → unverified_gpu_qpu_unavailable → quantum_without_classical_baseline_rejected → tool_reuse_preferred_over_duplicate_sandbox → tool_self_promotion_to_production_denied → compiler_unapproved_cross_universe_denied → compiler_raw_private_cross_universe_denied → sealed_no_silent_cloud_accelerator → evidence → learning',
    'Persistent Knowledge Civilization cycle recorded in order.',
  );

  check(
    'US-CX-locks',
    CX_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CX_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      CX_LOCKS.OFFLINE_DEVICES_PRETEND_RUNNING === false &&
      CX_LOCKS.RAW_PRIVATE_GLOBAL_POOLING === false &&
      CX_LOCKS.MODEL_SELF_PROMOTION_TO_PRODUCTION === false &&
      CX_LOCKS.TOOL_SELF_PROMOTION_TO_PRODUCTION === false &&
      CX_LOCKS.MEMORY_PRODUCT_REQUIRES_SIGNATURE &&
      CX_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE === false &&
      CX_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
      CX_LOCKS.TOOL_REUSE_FIRST &&
      CX_LOCKS.COMPILER_UNAPPROVED_CROSS_UNIVERSE === false &&
      CX_LOCKS.COMPILER_RAW_PRIVATE_CROSS_UNIVERSE === false &&
      CX_LOCKS.SEALED_SILENT_CLOUD_ACCELERATOR_FALLBACK === false &&
      CX_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CX_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CX-honesty-surfaces',
    offlineColonyNetworkHonesty().runningVerifiedWithoutHeartbeat === false &&
      multiModelEvolutionLabHonesty().selfPromotionToProduction === false &&
      scientificMemoryFabricHonesty().rawPrivateGlobalPooling === false &&
      adaptiveAcceleratorGridHonesty().quantumClassicalBaselineRequired === true &&
      toolEcosystemHonesty().reuseFirst === true &&
      intelligenceCompilerHonesty().rawPrivateCrossUniverse === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-CX-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CY —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CX-predecessor-CV',
    preds.CV.tipProbe === 'PRESENT' && preds.CV.report === 'PRESENT',
    `CV tip=${preds.CV.tipProbe} report=${preds.CV.report}; CW=${preds.CW.tipProbe}/${preds.CW.report}`,
  );

  // No powered authorized node → WAITING_NODE or OFFLINE_STOPPED
  const offlineColony = await registerResearchColony({
    name: 'colony-no-power',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    authorizedNodePowered: false,
    root,
    actor,
  });
  const offlineEval = await evaluateOfflineColonyNetwork({ root, actor });
  check(
    'US-CX-no-powered-node',
    offlineEval.accepted === false &&
      (offlineEval.networkStatus === 'WAITING_NODE' ||
        offlineEval.networkStatus === 'OFFLINE_STOPPED') &&
      offlineEval.reason === ALL_NODES_OFFLINE_WAITING_OR_STOPPED &&
      offlineColony.colony?.status === 'WAITING_NODE',
    `${offlineEval.networkStatus}:${offlineEval.reason}`,
  );

  const stop = await setAuthorizedNodesPowered({ powered: false, root, actor });
  check(
    'US-CX-offline-stopped',
    stop.networkStatus === 'OFFLINE_STOPPED' || stop.networkStatus === 'WAITING_NODE',
    String(stop.networkStatus),
  );

  // Missing heartbeat → not RUNNING_VERIFIED
  await setAuthorizedNodesPowered({ powered: true, root, actor });
  const hbColony = await registerResearchColony({
    name: 'colony-hb',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    authorizedNodePowered: true,
    root,
    actor,
  });
  const claimNoHb = await claimColonyRunningVerified({
    colonyId: hbColony.colony!.id,
    root,
    actor,
  });
  check(
    'US-CX-missing-heartbeat',
    claimNoHb.accepted === false &&
      claimNoHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      claimNoHb.colony?.status !== 'RUNNING_VERIFIED',
    claimNoHb.reason,
  );

  const hb = await recordColonyHeartbeat({
    colonyId: hbColony.colony!.id,
    runtimeEvidence: 'pid=1;runtime=colony-shift',
    root,
    actor,
  });
  check(
    'US-CX-with-heartbeat',
    hb.accepted === true && hb.colony?.status === 'RUNNING_VERIFIED',
    hb.reason,
  );

  // Raw private global pool DENIED
  const pool = await attemptRawPrivateGlobalPool({
    label: 'private-dump',
    root,
    actor,
  });
  check(
    'US-CX-raw-private-pool',
    pool.accepted === false && pool.reason === RAW_PRIVATE_GLOBAL_POOL_DENIED,
    pool.reason,
  );

  // Unverified GPU/QPU → UNAVAILABLE
  const gpu = await registerAcceleratorTarget({
    kind: 'nvidia',
    configured: true,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const gpuRoute = await routeAcceleratorWorkload({
    targetKind: 'nvidia',
    targetId: gpu.id,
    root,
    actor,
  });
  check(
    'US-CX-unverified-gpu',
    gpu.status === 'UNAVAILABLE' &&
      gpuRoute.status === 'UNAVAILABLE' &&
      gpuRoute.reason === UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    gpuRoute.reason,
  );

  const qpu = await registerAcceleratorTarget({
    kind: 'quantum',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  check(
    'US-CX-unverified-qpu',
    qpu.status === 'UNAVAILABLE' && qpu.reason === UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    qpu.reason,
  );

  // Model/tool self-promotion DENIED
  const model = await proposeSandboxEvolution({
    modelId: 'cx-m1',
    parentModelId: 'base',
    root,
    actor,
  });
  const modelPromo = await attemptModelSelfPromotion({
    candidateId: model.candidate!.id,
    root,
    actor,
  });
  check(
    'US-CX-model-self-promo',
    modelPromo.accepted === false &&
      modelPromo.reason === MODEL_SELF_PROMOTION_DENIED &&
      model.candidate?.status === 'SANDBOX',
    modelPromo.reason,
  );

  const tool = await registerApprovedEcosystemTool({
    name: 'diff-tool',
    capabilityKey: 'diff-analysis',
    root,
    actor,
  });
  const toolPromo = await attemptToolSelfPromotion({
    toolId: tool.tool!.id,
    root,
    actor,
  });
  check(
    'US-CX-tool-self-promo',
    toolPromo.accepted === false && toolPromo.reason === TOOL_SELF_PROMOTION_DENIED,
    toolPromo.reason,
  );

  // Unsigned memory product rejected
  const unsigned = await publishMemoryProduct({
    kind: 'business',
    label: 'unsigned-memo',
    signed: false,
    root,
    actor,
  });
  check(
    'US-CX-unsigned-memory',
    unsigned.accepted === false &&
      unsigned.reason === UNSIGNED_MEMORY_PRODUCT_REJECTED,
    unsigned.reason,
  );

  const signed = await publishMemoryProduct({
    kind: 'scientific',
    label: 'signed-paper',
    signed: true,
    signatureRef: 'sig:founder:1',
    root,
    actor,
  });
  check(
    'US-CX-signed-memory',
    signed.accepted === true && signed.product?.signed === true,
    signed.reason,
  );

  // Compiler rejects unapproved/raw private
  const unapproved = await compileCrossUniverseTransfer({
    sourceUniverseId: 'univ-cx',
    targetUniverseId: 'univ-other',
    assetClass: 'unapproved',
    assetRef: 'blob',
    authorizedUniverses: ['univ-cx', 'univ-other'],
    root,
    actor,
  });
  check(
    'US-CX-compiler-unapproved',
    unapproved.accepted === false && unapproved.reason === COMPILER_UNAPPROVED_DENIED,
    unapproved.reason,
  );

  const rawXfer = await compileCrossUniverseTransfer({
    sourceUniverseId: 'univ-cx',
    targetUniverseId: 'univ-other',
    assetClass: 'raw_private',
    assetRef: 'raw',
    authorizedUniverses: ['univ-cx', 'univ-other'],
    root,
    actor,
  });
  check(
    'US-CX-compiler-raw-private',
    rawXfer.accepted === false && rawXfer.reason === COMPILER_RAW_PRIVATE_DENIED,
    rawXfer.reason,
  );

  const approvedCompile = await compileCrossUniverseTransfer({
    sourceUniverseId: 'univ-cx',
    targetUniverseId: 'univ-other',
    assetClass: 'approved_knowledge',
    assetRef: 'knowledge-index-1',
    authorizedUniverses: ['univ-cx', 'univ-other'],
    root,
    actor,
  });
  check(
    'US-CX-compiler-approved',
    approvedCompile.accepted === true,
    approvedCompile.reason,
  );

  // Quantum without classical baseline REJECTED
  const qVerified = await registerAcceleratorTarget({
    kind: 'quantum',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const qNoBase = await routeAcceleratorWorkload({
    targetKind: 'quantum',
    targetId: qVerified.id,
    classicalBaselineRef: null,
    root,
    actor,
  });
  check(
    'US-CX-quantum-no-baseline',
    qNoBase.status === 'REJECTED' &&
      qNoBase.reason === QUANTUM_WITHOUT_BASELINE_REJECTED,
    qNoBase.reason,
  );

  const qWithBase = await routeAcceleratorWorkload({
    targetKind: 'quantum',
    targetId: qVerified.id,
    classicalBaselineRef: 'classical-run-1',
    root,
    actor,
  });
  check(
    'US-CX-quantum-with-baseline',
    qWithBase.status === 'ROUTED',
    qWithBase.reason,
  );

  // Prefer reuse approved tool over duplicate sandbox build
  const reuse = await requestSandboxToolBuild({
    name: 'diff-tool-dup',
    capabilityKey: 'diff-analysis',
    root,
    actor,
  });
  check(
    'US-CX-tool-reuse',
    reuse.reused === true &&
      reuse.reason === TOOL_REUSE_PREFERRED &&
      reuse.tool?.id === tool.tool?.id,
    reuse.reason,
  );

  // Sealed cannot silent-route to cloud accelerator
  const sealed = await routeAcceleratorWorkload({
    targetKind: 'amd',
    contentMode: 'sealed',
    silentCloudAcceleratorFallback: true,
    root,
    actor,
  });
  check(
    'US-CX-sealed-no-cloud',
    sealed.status === 'DENIED' &&
      sealed.reason === SEALED_SILENT_CLOUD_ACCELERATOR_DENIED,
    sealed.reason,
  );

  const cycleRoot = await mkdtemp(join(tmpdir(), 'xiv-62lcx-cycle-'));
  const cycle = await runPersistentKnowledgeCivilizationCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root: cycleRoot,
  });
  check(
    'US-CX-cycle-ok',
    cycle.ok === true && cycle.hops.length === PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE.length,
    `ok=${cycle.ok} hops=${cycle.hops.length}`,
  );
  await rm(cycleRoot, { recursive: true, force: true });

  const health = await buildPersistentKnowledgeCivilizationHealthReport({ root: repoRoot });
  check(
    'US-CX-health',
    health.phase === '62L-CX' &&
      health.githubSotIssue === 115 &&
      health.gitlabCoordinationIssue === 49 &&
      health.productionAuthorized === false &&
      health.tipLand === false,
    `phase=${health.phase}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('OK 62L-CX persistent knowledge civilization tests passed');
