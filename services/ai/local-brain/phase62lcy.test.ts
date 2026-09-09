import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  claimSocietyRunningVerified,
  materializeSocietyWorkers,
  recordSocietyHeartbeat,
  registerResearchSociety,
  researchSocietiesHonesty,
  setSocietyNodePower,
  societyCensus,
} from './persistent-agent-research-societies';
import {
  compileMultiModelEvidence,
  multiModelIntelligenceCompilerHonesty,
} from './multi-model-intelligence-compiler';
import { nervousSystemHonesty } from './distributed-memory-experiment-nervous-system';
import {
  accountComputeResource,
  computeEconomyHonesty,
  registerEconomyComputeTarget,
  scheduleEconomyWorkload,
} from './adaptive-gpu-quantum-compute-economy';
import {
  aiServiceFoundryHonesty,
  attemptAiServiceSelfPromotion,
  registerAiServiceSandbox,
} from './agent-built-ai-service-foundry';
import {
  authorizeUniverseKnowledgeRoute,
  signKnowledgeRoutePayload,
  submitUniverseKnowledgeRoutePack,
  universeKnowledgeRoutingHonesty,
} from './universe-knowledge-routing-grid';
import {
  CONSENSUS_NOT_VERIFIED_PROOF,
  CY_LOCKS,
  ECONOMY_SPEND_DENIED,
  HONESTY_BANNER,
  KNOWLEDGE_COLONY_OPERATING_SYSTEM_CYCLE,
  LOGICAL_POPULATION_NOT_RUNNING_VERIFIED,
  NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  SEALED_OR_RAW_PRIVATE_ROUTE_DENIED,
  SERVICE_SELF_PROMOTION_DENIED,
  UNSIGNED_ROUTE_PACK_REJECTED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  predecessorMap,
  type CyActor,
} from './knowledge-colony-operating-system-types';
import {
  buildKnowledgeColonyOperatingSystemHealthReport,
  runKnowledgeColonyOperatingSystemCycle,
} from './knowledge-colony-operating-system-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcy-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CyActor = {
  kind: 'colony_os_curator',
  id: 'curator-cy-1',
  orgId: 'org-cy',
  tenantId: 'tenant-cy',
  universeId: 'univ-cy',
  role: 'curator',
  permissionLevel: 1,
  authorityLevel: 0,
};

try {
  check(
    'US-CY1-cycle',
    KNOWLEDGE_COLONY_OPERATING_SYSTEM_CYCLE.join(' → ') ===
      'honesty_locks → colony_os_bootstrap → logical_population_not_auto_running_verified → society_missing_heartbeat_not_running_verified → no_powered_node_waiting_or_stopped → economy_cannot_spend_purchase_bill → compiler_consensus_not_verified_proof → nervous_system_sync_bounded → unverified_gpu_qpu_unavailable → quantum_without_classical_baseline_rejected → service_self_promote_to_production_denied → sealed_or_raw_private_silent_universe_route_denied → unsigned_route_pack_rejected → evidence → learning',
    'Knowledge Colony OS cycle recorded in order.',
  );

  check(
    'US-CY-locks',
    CY_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CY_LOCKS.LOGICAL_POPULATION_AUTO_RUNNING_VERIFIED === false &&
      CY_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      CY_LOCKS.ECONOMY_CAN_SPEND_MONEY === false &&
      CY_LOCKS.ECONOMY_CAN_PURCHASE === false &&
      CY_LOCKS.ECONOMY_CAN_BILL === false &&
      CY_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF === false &&
      CY_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE === false &&
      CY_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
      CY_LOCKS.SERVICE_SELF_PROMOTION_TO_PRODUCTION === false &&
      CY_LOCKS.SILENT_SEALED_OR_RAW_PRIVATE_UNIVERSE_ROUTE === false &&
      CY_LOCKS.UNSIGNED_ROUTE_PACK_ACCEPTED === false &&
      CY_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CY_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CY-honesty-surfaces',
    researchSocietiesHonesty().logicalPopulationAutoRunningVerified === false &&
      multiModelIntelligenceCompilerHonesty().consensusEqVerifiedProof === false &&
      nervousSystemHonesty().productionAuthorization === false &&
      computeEconomyHonesty().canSpendMoney === false &&
      aiServiceFoundryHonesty().selfPromotionToProduction === false &&
      universeKnowledgeRoutingHonesty().unsignedAccepted === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-CY-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CZ —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CY-predecessor-CW-or-CX',
    preds.CW.tipProbe === 'PRESENT' || preds.CX.tipProbe === 'PRESENT',
    `CX=${preds.CX.tipProbe}/${preds.CX.report}; CW=${preds.CW.tipProbe}/${preds.CW.report}; CV=${preds.CV.tipProbe}/${preds.CV.report}`,
  );

  // Logical population ≠ auto RUNNING_VERIFIED
  const society = await registerResearchSociety({
    name: 'soc-logical',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    logicalPopulation: 250,
    authorizedNodePowered: true,
    root,
    actor,
  });
  await materializeSocietyWorkers({
    societyId: society.society!.id,
    count: 25,
    root,
    actor,
  });
  const census = await societyCensus({ root, actor });
  check(
    'US-CY-logical-population-not-auto-running-verified',
    census.logicalPopulation === 250 &&
      census.materializedWorkers === 25 &&
      census.runningVerifiedWorkers === 0 &&
      census.autoRunningVerifiedFromLogical === false &&
      census.reason === LOGICAL_POPULATION_NOT_RUNNING_VERIFIED &&
      society.society?.status !== 'RUNNING_VERIFIED',
    `logical=${census.logicalPopulation} mat=${census.materializedWorkers} rv=${census.runningVerifiedWorkers}`,
  );

  // Missing heartbeat → not RUNNING_VERIFIED
  const claimNoHb = await claimSocietyRunningVerified({
    societyId: society.society!.id,
    root,
    actor,
  });
  check(
    'US-CY-missing-heartbeat-not-running-verified',
    claimNoHb.accepted === false &&
      claimNoHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      claimNoHb.society?.status !== 'RUNNING_VERIFIED',
    claimNoHb.reason,
  );

  // With heartbeat → RUNNING_VERIFIED
  const hb = await recordSocietyHeartbeat({
    societyId: society.society!.id,
    runtimeEvidence: 'pid=1;runtime=local-society',
    root,
    actor,
  });
  check(
    'US-CY-heartbeat-running-verified',
    hb.accepted === true && hb.society?.status === 'RUNNING_VERIFIED',
    hb.reason,
  );

  // No powered node → WAITING_NODE or OFFLINE_STOPPED
  const waiting = await setSocietyNodePower({
    societyId: society.society!.id,
    powered: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  const claimOff = await claimSocietyRunningVerified({
    societyId: society.society!.id,
    root,
    actor,
  });
  check(
    'US-CY-no-powered-node-waiting-or-stopped',
    claimOff.accepted === false &&
      (claimOff.society?.status === 'WAITING_NODE' ||
        claimOff.society?.status === 'OFFLINE_STOPPED') &&
      claimOff.reason === NO_POWERED_NODE_WAITING_OR_STOPPED &&
      waiting.society?.status !== 'RUNNING_VERIFIED',
    `${claimOff.reason} status=${claimOff.society?.status}`,
  );

  const stopped = await setSocietyNodePower({
    societyId: society.society!.id,
    powered: false,
    stopMode: 'OFFLINE_STOPPED',
    root,
    actor,
  });
  check(
    'US-CY-offline-stopped',
    stopped.society?.status === 'OFFLINE_STOPPED',
    stopped.reason,
  );

  // Economy cannot purchase/bill/spend
  const spend = await accountComputeResource({
    action: 'spend',
    units: 10,
    currencyAttempted: true,
    root,
    actor,
  });
  const purchase = await accountComputeResource({
    action: 'purchase',
    units: 3,
    root,
    actor,
  });
  const bill = await accountComputeResource({
    action: 'bill',
    units: 2,
    root,
    actor,
  });
  const accountOnly = await accountComputeResource({
    action: 'account',
    units: 7,
    root,
    actor,
  });
  check(
    'US-CY-economy-cannot-spend-purchase-bill',
    spend.status === 'DENIED' &&
      purchase.status === 'DENIED' &&
      bill.status === 'DENIED' &&
      spend.reason === ECONOMY_SPEND_DENIED &&
      accountOnly.status === 'RECORDED',
    `spend=${spend.reason}; account=${accountOnly.reason}`,
  );

  // Compiler consensus only ≠ verified proof
  const consensusProof = await compileMultiModelEvidence({
    topic: 'colony-claim',
    modelVotes: ['yes', 'yes', 'yes'],
    claimConsensusIsProof: true,
    root,
    actor,
  });
  const consensusOnly = await compileMultiModelEvidence({
    topic: 'colony-evidence',
    modelVotes: ['yes', 'yes'],
    claimConsensusIsProof: false,
    root,
    actor,
  });
  check(
    'US-CY-compiler-consensus-not-verified-proof',
    consensusProof.accepted === false &&
      consensusProof.reason === CONSENSUS_NOT_VERIFIED_PROOF &&
      consensusProof.artifact?.labeledVerifiedProof === false &&
      consensusOnly.accepted === true &&
      consensusOnly.artifact?.status === 'CONSENSUS_ONLY' &&
      consensusOnly.artifact.labeledVerifiedProof === false,
    `${consensusProof.reason}; status=${consensusOnly.artifact?.status}`,
  );

  // Sealed or raw private silent Universe route DENIED
  const sealedSilent = await submitUniverseKnowledgeRoutePack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    assetClass: 'sealed',
    payload: 'sealed-data',
    signature: signKnowledgeRoutePayload('sealed-data', 'k1'),
    signingKey: 'k1',
    silent: true,
    root,
    actor,
  });
  const rawSilent = await submitUniverseKnowledgeRoutePack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    assetClass: 'raw_private',
    payload: 'raw-private',
    signature: signKnowledgeRoutePayload('raw-private', 'k1'),
    signingKey: 'k1',
    silent: true,
    root,
    actor,
  });
  check(
    'US-CY-sealed-or-raw-private-silent-route-denied',
    sealedSilent.accepted === false &&
      rawSilent.accepted === false &&
      sealedSilent.reason === SEALED_OR_RAW_PRIVATE_ROUTE_DENIED &&
      rawSilent.reason === SEALED_OR_RAW_PRIVATE_ROUTE_DENIED,
    sealedSilent.reason,
  );

  // Unsigned route pack rejected
  const unsigned = await submitUniverseKnowledgeRoutePack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    assetClass: 'approved_knowledge',
    payload: 'knowledge',
    signature: null,
    root,
    actor,
  });
  check(
    'US-CY-unsigned-route-pack-rejected',
    unsigned.accepted === false && unsigned.reason === UNSIGNED_ROUTE_PACK_REJECTED,
    unsigned.reason,
  );

  // Signed authorized route accepted
  await authorizeUniverseKnowledgeRoute({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    root,
    actor,
  });
  const okRoute = await submitUniverseKnowledgeRoutePack({
    sourceUniverseId: actor.universeId,
    targetUniverseId: 'univ-peer',
    assetClass: 'approved_knowledge',
    payload: 'knowledge-ok',
    signature: signKnowledgeRoutePayload('knowledge-ok', 'k1'),
    signingKey: 'k1',
    root,
    actor,
  });
  check('US-CY-signed-authorized-route-accepted', okRoute.accepted === true, okRoute.reason);

  // Unverified GPU/QPU → UNAVAILABLE
  const unverifiedGpu = await registerEconomyComputeTarget({
    kind: 'amd',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const gpuFail = await scheduleEconomyWorkload({
    targetKind: 'amd',
    targetId: unverifiedGpu.id,
    root,
    actor,
  });
  check(
    'US-CY-unverified-gpu-qpu-unavailable',
    unverifiedGpu.status === 'UNAVAILABLE' &&
      gpuFail.status === 'UNAVAILABLE' &&
      gpuFail.reason === UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    gpuFail.reason,
  );

  // Quantum without classical baseline REJECTED
  const qpu = await registerEconomyComputeTarget({
    kind: 'quantum',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const qNoBase = await scheduleEconomyWorkload({
    targetKind: 'quantum',
    targetId: qpu.id,
    classicalBaselineRef: null,
    root,
    actor,
  });
  check(
    'US-CY-quantum-without-baseline-rejected',
    qNoBase.status === 'REJECTED' &&
      qNoBase.reason === QUANTUM_WITHOUT_BASELINE_REJECTED,
    qNoBase.reason,
  );

  const qOk = await scheduleEconomyWorkload({
    targetKind: 'quantum',
    targetId: qpu.id,
    classicalBaselineRef: 'cpu-baseline-cy',
    root,
    actor,
  });
  check('US-CY-quantum-with-baseline-scheduled', qOk.status === 'SCHEDULED', qOk.reason);

  // Service self-promote to production DENIED
  const svc = await registerAiServiceSandbox({
    name: 'cy-service',
    capabilityKey: 'research-assist',
    root,
    actor,
  });
  const promo = await attemptAiServiceSelfPromotion({
    serviceId: svc.service!.id,
    root,
    actor,
  });
  check(
    'US-CY-service-self-promote-denied',
    promo.accepted === false &&
      promo.reason === SERVICE_SELF_PROMOTION_DENIED &&
      promo.service?.productionAuthorized === false,
    promo.reason,
  );

  const cycle = await runKnowledgeColonyOperatingSystemCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check('US-CY-cycle-ok', cycle.ok === true, `hops=${cycle.hops.length}`);

  const health = await buildKnowledgeColonyOperatingSystemHealthReport({ root: repoRoot });
  check(
    'US-CY-health-report',
    health.phase === '62L-CY' &&
      health.productionAuthorized === false &&
      health.githubSotIssue === 116 &&
      health.gitlabCoordinationIssue === 50,
    health.honestyBanner,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL 62L-CY (${failures.length})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-CY knowledge colony operating system tests passed');
