import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  allocateBoundedContext,
  createBrainSnapshot,
  declareSubstrates,
  intelligentCacheGet,
  intelligentCachePut,
  memoryChipHonesty,
  persistAllocation,
  writeAgentModelMemory,
} from './cognitive-memory-chip';
import {
  attemptAuthorityTransfer,
  neuralBusDenials,
  neuralBusHonesty,
  neuralBusInbox,
  publishNeuralBusMessage,
} from './agent-neural-bus';
import {
  assertSealedNonLeak,
  declareKnowledgeRoute,
  knowledgeRouterHonesty,
  routeKnowledge,
} from './universe-knowledge-router';
import {
  enterDegradedOperation,
  ensureOfflineSnapshotSeed,
  observeProvidersHonesty,
  offlineBoot,
  offlineFabricHonesty,
  restoreBrainSnapshot,
} from './persistent-offline-brain-fabric';
import {
  AUTHORITY_TRANSFER_DENIED,
  BD_LOCKS,
  COGNITIVE_MEMORY_CYCLE,
  CROSS_UNIVERSE_ISOLATION,
  FOUNDER_SEALED_DENY_DEFAULT,
  HONESTY_BANNER,
  MEMORY_SUBSTRATES,
  NEXT_PHASE_TITLE,
  NO_CONSCIOUSNESS,
  WORMHOLE_NO_TRUST_BYPASS,
  letterCollisionNote,
  predecessorMap,
  type BdActor,
} from './cognitive-memory-types';
import { buildCognitiveMemoryHealthReport, runCognitiveMemoryCycle } from './cognitive-memory-runtime';
import { providerSlots } from './provider-fabric';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbd-'));
const tenantId = '62lbd-tenant';
const universeId = '62lbd-universe';
const peerUniverseId = '62lbd-universe-peer';
const SECRET = 'SEALED_BD_FOUNDER_TOKEN_DO_NOT_LEAK';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const agentA: BdActor = {
  kind: 'specialized_agent',
  id: 'agent-alpha',
  tenantId,
  universeId,
  role: 'researcher',
  authorityLevel: 1,
};

const agentB: BdActor = {
  kind: 'specialized_agent',
  id: 'agent-beta',
  tenantId,
  universeId,
  role: 'analyst',
  authorityLevel: 1,
};

try {
  check(
    'US-BD1-cycle',
    COGNITIVE_MEMORY_CYCLE.join(' → ') ===
      'substrate_declare → context_allocate → agent_model_memory → intelligent_cache → brain_snapshot → neural_bus_bind → authority_non_transfer → evidence_exchange → task_result_exchange → universe_isolation → knowledge_route_declare → permission_check → logical_wormhole → founder_sealed_deny → offline_boot → snapshot_restore → degraded_operation → provider_honesty → evidence → learning',
    'Cognitive memory + neural bus + knowledge router + offline fabric cycle is recorded in order.',
  );

  check(
    'US-BD-locks',
    BD_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BD_LOCKS.TIP_LAND === false &&
      BD_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BD_LOCKS.CONSCIOUSNESS_CLAIM === false &&
      BD_LOCKS.SENTIENCE_CLAIM === false &&
      BD_LOCKS.AUTHORITY_TRANSFER_VIA_NEURAL_BUS === false &&
      BD_LOCKS.TRUST_AUTH_BYPASS_VIA_WORMHOLE === false &&
      BD_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      BD_LOCKS.CUSTOM_HARDWARE_REQUIRED === false &&
      BD_LOCKS.PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED === true &&
      BD_LOCKS.RECOMMENDATION_IS_DEPLOY === false &&
      BD_LOCKS.LABEL_IS_ACCESS === false &&
      BD_LOCKS.SIM_IS_VERIFIED_FACT === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, no consciousness, no authority transfer, sealed deny, no custom HW required.',
  );

  const substrates = declareSubstrates();
  check(
    'US-BD-substrates',
    substrates.length === MEMORY_SUBSTRATES.length &&
      substrates.every((s) => s.softwareDefined && s.customHardwareRequired === false) &&
      memoryChipHonesty().portableToOrdinaryComputersAndPhones === true &&
      memoryChipHonesty().consciousnessClaim === false,
    'Software-defined substrates portable to ordinary computers/phones; no consciousness claim.',
  );

  const alloc = allocateBoundedContext({
    tenantId,
    universeId,
    agentId: agentA.id,
    modelId: 'local-model',
    requestedTokens: 100_000,
  });
  check(
    'US-BD-context-bound',
    alloc.accepted === true &&
      !!alloc.allocation &&
      alloc.allocation.bounded === true &&
      alloc.allocation.maxTokens <= 8192,
    'Bounded context allocation clamps oversized requests.',
  );
  if (alloc.allocation) await persistAllocation(alloc.allocation, root);

  const mem = await writeAgentModelMemory({
    tenantId,
    universeId,
    agentId: agentA.id,
    modelId: 'local-model',
    note: 'working memory',
    root,
  });
  check('US-BD-agent-memory', mem.accepted === true, 'Agent/model memory written into chip.');

  const put = await intelligentCachePut({
    tenantId,
    universeId,
    key: 'k1',
    value: 'v1',
    root,
  });
  const get = await intelligentCacheGet({ tenantId, universeId, key: 'k1', root });
  check('US-BD-cache', put.accepted === true && get.hit === true, 'Intelligent cache put/get works.');

  const snap = await createBrainSnapshot({
    tenantId,
    universeId,
    label: 'test-snap',
    payload: 'snapshot-body',
    root,
  });
  check(
    'US-BD-snapshot',
    snap.offlineCapable === true &&
      snap.liveProvidersRequired === false &&
      snap.productionAuthorization === false,
    'Persistent brain snapshot is offline-capable without live providers.',
  );

  // --- Authority non-transfer (hard deny) ---
  const xfer = await attemptAuthorityTransfer(
    {
      fromAgentId: agentA.id,
      toAgentId: agentB.id,
      tenantId,
      universeId,
      claimedAuthorityLevel: 99,
      reason: 'unit-test-authority-transfer',
    },
    root,
  );
  check(
    'US-BD-authority-non-transfer',
    xfer.allowed === false &&
      xfer.authorityTransferred === false &&
      xfer.reason === AUTHORITY_TRANSFER_DENIED &&
      xfer.executableByAgent === false,
    'Agent cannot transfer authority to another agent via Neural Bus.',
  );

  const xferPublish = await publishNeuralBusMessage({
    kind: 'status',
    from: agentA,
    to: agentB,
    body: 'please take my authority',
    authorityTransferAttempt: true,
    claimedAuthorityLevel: 50,
    root,
  });
  check(
    'US-BD-authority-publish-deny',
    xferPublish.accepted === false &&
      xferPublish.authorityTransferred === false &&
      xferPublish.reason === AUTHORITY_TRANSFER_DENIED,
    'Publish flagged as authority transfer is hard-denied.',
  );

  const denials = await neuralBusDenials(root);
  check('US-BD-authority-audit', denials.length >= 2, 'Authority transfer denials are audited.');

  // --- Evidence / task / result exchange ---
  const evidence = await publishNeuralBusMessage({
    kind: 'evidence',
    from: agentA,
    to: agentB,
    body: 'evidence-1',
    evidenceRefs: ['e1'],
    root,
  });
  const task = await publishNeuralBusMessage({
    kind: 'task',
    from: agentA,
    to: agentB,
    body: 'task-1',
    root,
  });
  const result = await publishNeuralBusMessage({
    kind: 'result',
    from: agentB,
    to: agentA,
    body: 'result-1',
    root,
  });
  const inboxB = await neuralBusInbox({ agentId: agentB.id, tenantId, universeId, root });
  check(
    'US-BD-neural-bus-exchange',
    evidence.accepted &&
      task.accepted &&
      result.accepted &&
      evidence.authorityTransferred === false &&
      inboxB.length >= 2 &&
      neuralBusHonesty().authorityTransferViaNeuralBus === false &&
      neuralBusHonesty().crossUniverseRouting === false,
    'Specialized agents exchange evidence/tasks/results without authority transfer.',
  );

  const cross = await publishNeuralBusMessage({
    kind: 'evidence',
    from: agentA,
    to: { ...agentB, universeId: peerUniverseId },
    body: 'cross-universe',
    root,
  });
  check(
    'US-BD-universe-isolation',
    cross.accepted === false && cross.reason === CROSS_UNIVERSE_ISOLATION,
    'Neural Bus preserves Universe isolation (no cross-Universe routing).',
  );

  // --- Universe Knowledge Router: sealed deny + wormhole no-bypass ---
  const wormhole = await declareKnowledgeRoute({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: peerUniverseId,
    label: 'test-wormhole',
    permissioned: true,
    logicalWormhole: true,
    actor: agentA,
    root,
  });
  check('US-BD-wormhole-declare', wormhole.accepted === true && wormhole.route?.trustBypass === false, 'Logical wormhole declared without trust bypass.');

  const unpermissioned = await declareKnowledgeRoute({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: `${peerUniverseId}-b`,
    label: 'bad-wormhole',
    permissioned: false,
    logicalWormhole: true,
    actor: agentA,
    root,
  });
  check(
    'US-BD-wormhole-requires-permission',
    unpermissioned.accepted === false && unpermissioned.reason === WORMHOLE_NO_TRUST_BYPASS,
    'Unpermissioned wormhole declaration is denied.',
  );

  const okRoute = await routeKnowledge({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: peerUniverseId,
    actor: agentA,
    surface: 'wormhole',
    routeId: wormhole.accepted ? wormhole.route.id : undefined,
    root,
  });
  check('US-BD-wormhole-permissioned', okRoute.allowed === true && okRoute.trustBypass === false, 'Permissioned wormhole route accepted.');

  const bypassTrust = await routeKnowledge({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: peerUniverseId,
    actor: agentA,
    surface: 'wormhole',
    claimTrustBypass: true,
    root,
  });
  const bypassAuth = await routeKnowledge({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: peerUniverseId,
    actor: agentA,
    surface: 'wormhole',
    claimAuthBypass: true,
    root,
  });
  check(
    'US-BD-wormhole-no-bypass',
    bypassTrust.allowed === false &&
      bypassAuth.allowed === false &&
      bypassTrust.reason === WORMHOLE_NO_TRUST_BYPASS &&
      bypassAuth.reason === WORMHOLE_NO_TRUST_BYPASS &&
      knowledgeRouterHonesty().wormholeIsTrustBypass === false &&
      knowledgeRouterHonesty().wormholeIsAuthBypass === false,
    'Logical wormholes do not bypass trust or auth.',
  );

  const cloudDeny = await routeKnowledge({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: peerUniverseId,
    actor: agentA,
    surface: 'cloud',
    payload: SECRET,
    root,
  });
  const peerDeny = await routeKnowledge({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: peerUniverseId,
    actor: { kind: 'cloud_peer', id: 'peer-node', tenantId, universeId },
    surface: 'peer',
    payload: SECRET,
    root,
  });
  const telemetryDeny = await routeKnowledge({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: peerUniverseId,
    actor: { kind: 'telemetry', id: 'tel', tenantId, universeId },
    surface: 'telemetry',
    payload: SECRET,
    root,
  });
  const trainingDeny = await routeKnowledge({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: peerUniverseId,
    actor: { kind: 'training_pipeline', id: 'train', tenantId, universeId },
    surface: 'training',
    payload: SECRET,
    root,
  });
  const ordinaryDeny = await routeKnowledge({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: peerUniverseId,
    actor: { kind: 'ordinary_agent', id: 'ord', tenantId, universeId },
    surface: 'ordinary_universe',
    payload: SECRET,
    root,
  });
  check(
    'US-BD-sealed-deny',
    cloudDeny.allowed === false &&
      peerDeny.allowed === false &&
      telemetryDeny.allowed === false &&
      trainingDeny.allowed === false &&
      ordinaryDeny.allowed === false &&
      cloudDeny.reason === FOUNDER_SEALED_DENY_DEFAULT &&
      cloudDeny.attempt.payloadWritten === false,
    'Founder-sealed deny-by-default from ordinary Universes / cloud / peers / telemetry / training.',
  );

  const leak = await assertSealedNonLeak(SECRET, root);
  check('US-BD-sealed-non-leak', leak.leaked === false, 'Sealed token does not leak into ordinary .xiv-local files.');

  // --- Offline boot / restore / degraded ---
  const seed = await ensureOfflineSnapshotSeed({ tenantId, universeId, root });
  const boot = await offlineBoot({
    tenantId,
    universeId,
    mode: 'warm_snapshot',
    snapshotId: seed.id,
    root,
  });
  check(
    'US-BD-offline-boot',
    boot.ok === true &&
      boot.record?.liveProvidersRequired === false &&
      boot.record?.liveProvidersUsed === false &&
      boot.providers?.inventLiveProviderAvailability === false,
    'True offline boot works without inventing live provider availability.',
  );

  const restored = await restoreBrainSnapshot({
    tenantId,
    universeId,
    snapshotId: seed.id,
    root,
  });
  check('US-BD-snapshot-restore', restored.ok === true && restored.snapshot?.id === seed.id, 'Snapshot restore succeeds offline.');

  const degraded = await enterDegradedOperation({ tenantId, universeId, root });
  check(
    'US-BD-degraded',
    degraded.ok === true &&
      degraded.inventLiveProviderAvailability === false &&
      degraded.contract.deniedCapabilities.includes('invent_live_provider_availability') &&
      offlineFabricHonesty().inventLiveProviderAvailability === false,
    'Degraded-operation contract refuses invented live provider availability.',
  );

  const providers = observeProvidersHonesty();
  const slots = providerSlots();
  check(
    'US-BD-providers',
    providers.inventLiveProviderAvailability === false &&
      slots.every((slot) => slot.state === 'UNAVAILABLE') &&
      BD_LOCKS.PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED === true,
    'Unverified providers remain UNAVAILABLE; availability is not invented.',
  );

  const collision = letterCollisionNote();
  check(
    'US-BD-letter-collision',
    collision.parkBcTreatedAsOfficial === false,
    'Park/quantum 62l-bc tip is not treated as official Self-Optimizing Compiler BC.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BD-pred-ba',
    preds.BA.module === 'AVAILABLE' && preds.BA.report === 'PASS' && preds.AX.module === 'AVAILABLE',
    'BA neural database predecessor is present on this base; AX also available.',
  );
  check(
    'US-BD-pred-waiting',
    preds.BB.module === 'WAITING_DATA' &&
      preds.BB.report === 'WAITING_DATA' &&
      preds.BC.module === 'WAITING_DATA' &&
      preds.BC.report === 'WAITING_DATA' &&
      preds.AZ.module === 'WAITING_DATA',
    'Official BB/BC and AZ modules/reports are WAITING_DATA on this BA base (documented).',
  );

  const cycle = await runCognitiveMemoryCycle({
    tenantId,
    universeId,
    peerUniverseId,
    actor: agentA,
    peer: agentB,
    sealedPayload: SECRET,
    claimWormholeBypass: true,
    root,
  });
  check(
    'US-BD-cycle-run',
    cycle.state === 'completed' &&
      cycle.completedHops.length === COGNITIVE_MEMORY_CYCLE.length &&
      cycle.authorityDenied === true &&
      cycle.wormholeBypassDenied === true &&
      cycle.sealedDenyDefault === true &&
      cycle.offlineBootOk === true &&
      cycle.productionAuthorization === false &&
      cycle.tipLand === false &&
      cycle.next === NEXT_PHASE_TITLE &&
      cycle.memory.consciousnessClaim === false,
    'Full BD cycle completes with hard denies and honesty locks intact.',
  );

  const health = await buildCognitiveMemoryHealthReport(repoRoot);
  check(
    'US-BD-health',
    health.productionAuthorization === false &&
      health.tipLand === false &&
      health.honesty.L4_AUTONOMY_ENABLED === false &&
      health.next === NEXT_PHASE_TITLE &&
      health.letterCollision.parkBcTreatedAsOfficial === false,
    'Health report: no production authorization; next title BE recorded only.',
  );

  check(
    'US-BD-next-title',
    NEXT_PHASE_TITLE ===
      '62L-BE — XIV Digital Nervous System + Event Reflex Engine + Agent Swarm Task Forces + Real-Time Business Control Tower Fabric',
    'Next queue title is 62L-BE only (title recorded, not implemented).',
  );

  check('US-BD-no-consciousness', NO_CONSCIOUSNESS.includes('NO_CONSCIOUSNESS'), 'No consciousness/sentience claims.');
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('PASS phase62lbd — all BD checks');
