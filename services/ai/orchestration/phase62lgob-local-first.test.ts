/**
 * 62L-GOB Local-First / Offline Agent Civilization — denial + honesty tests.
 *
 * Script: npm run test:62lgob-local-first
 * Canonical home: Global Operations Brain.
 * Must actually run — no PASS without execution.
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ALLOWED_TASK_CLASSES,
  CANONICAL_BRAIN_OWNER,
  CONTROL_TOWER_STATES,
  GOB_LOCKS,
  HONESTY_BANNER,
  KG_NODE_KINDS,
  LOCAL_FIRST_CYCLE,
  NEXT_PHASE_TITLE,
  OFFLINE_PACK_IDS,
  assertGobLocksIntact,
  attemptForbiddenClone,
  buildControlTowerSnapshot,
  createAgentRegistry,
  createCheckpointStore,
  createComputeAdapterRegistry,
  createEvidenceLedger,
  createHeartbeatService,
  createLocalAgentMessageBus,
  createLocalWorker,
  createNeuralKg,
  createOfflinePackService,
  createReturnReceiptLedger,
  createStorageResilience,
  createTaskGraph,
  gobSoftWireSnapshot,
  readXivDnaManifest,
  runLocalFirstOfflineAgentCivilizationCycle,
  validateXivDnaManifest,
  writeXivDnaManifest,
  type TenantScope,
} from './index.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const scopeA: TenantScope = {
  orgId: 'org-a',
  tenantId: 'tenant-a',
  universeId: 'uni-a',
};

const scopeB: TenantScope = {
  orgId: 'org-b',
  tenantId: 'tenant-b',
  universeId: 'uni-b',
};

test('SoT GOB local-first; Global Ops Brain canonical; L4=false; next phase set', () => {
  assert.equal(CANONICAL_BRAIN_OWNER, 'Global Operations Brain');
  assert.equal(GOB_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(GOB_LOCKS.MERGE_MAIN, false);
  assert.equal(GOB_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(assertGobLocksIntact(), true);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.ok(NEXT_PHASE_TITLE.length > 10);
  assert.ok(LOCAL_FIRST_CYCLE.includes('message_bus'));
  assert.ok(ALLOWED_TASK_CLASSES.includes('LOCAL_SEARCH'));
  assert.ok(OFFLINE_PACK_IDS.includes('XIV_CORE'));
  assert.equal(KG_NODE_KINDS[0], 'Source');
  assert.ok(CONTROL_TOWER_STATES.includes('RUNNING_VERIFIED'));
});

test('agent message routing + acknowledgement', () => {
  const bus = createLocalAgentMessageBus();
  const pub = bus.publish({
    scope: scopeA,
    missionId: 'm1',
    taskId: 't1',
    senderAgentId: 'sender-1',
    receiverAgentId: 'recv-1',
    purpose: 'dispatch',
    dataClass: 'XIV_OWNED',
    payloadType: 'task_dispatch',
    payload: { hello: 'world' },
  });
  assert.equal(pub.published, true);
  if (!pub.published) return;
  const routed = bus.routeTo({ receiverAgentId: 'recv-1', scope: scopeA });
  assert.equal(routed.length, 1);
  assert.equal(routed[0]!.messageId, pub.message.messageId);
  const ack = bus.acknowledge({
    messageId: pub.message.messageId,
    scope: scopeA,
    ack: 'ACKED',
  });
  assert.equal(ack.published, true);
});

test('hidden CoT persistence denied on message bus', () => {
  const bus = createLocalAgentMessageBus();
  const denied = bus.publish({
    scope: scopeA,
    missionId: 'm1',
    taskId: 't1',
    senderAgentId: 's',
    receiverAgentId: 'r',
    purpose: 'leak',
    dataClass: 'XIV_OWNED',
    payloadType: 'hidden_cot',
    payload: { thought: 'secret' },
  });
  assert.equal(denied.published, false);
});

test('parent-child scope inheritance on agents and task graph', () => {
  const registry = createAgentRegistry();
  const parent = registry.register({
    agentId: 'parent',
    agentType: 'orchestrator',
    scope: scopeA,
    missionId: 'm1',
    taskId: 't-root',
    allowedTools: ['local_search', 'code_analysis'],
    allowedDataClasses: ['XIV_OWNED', 'EVIDENCE'],
    computeBudget: 100,
    storageBudget: 50,
    returnPath: 'home-base://a',
    expiry: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(parent.registered, true);

  const child = registry.register({
    agentId: 'child',
    agentType: 'worker',
    scope: scopeA,
    parentAgentId: 'parent',
    missionId: 'm1',
    taskId: 't-child',
    allowedTools: ['local_search'],
    allowedDataClasses: ['XIV_OWNED'],
    computeBudget: 40,
    storageBudget: 20,
    returnPath: 'home-base://a',
    expiry: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(child.registered, true);

  const inherit = registry.inheritChildScope('parent', 'child', scopeA);
  assert.equal(inherit.ok, true);

  const badChild = registry.register({
    agentId: 'bad-child',
    agentType: 'worker',
    scope: scopeA,
    parentAgentId: 'parent',
    missionId: 'm1',
    taskId: 't-bad',
    allowedTools: ['local_search', 'admin_override'],
    allowedDataClasses: ['XIV_OWNED'],
    computeBudget: 10,
    storageBudget: 10,
    returnPath: 'home-base://a',
    expiry: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(badChild.registered, true);
  const badInherit = registry.inheritChildScope('parent', 'bad-child', scopeA);
  assert.equal(badInherit.ok, false);

  const graph = createTaskGraph();
  const root = graph.createRoot({
    missionId: 'm1',
    agentId: 'parent',
    taskClass: 'TASK_PLANNING',
    scope: scopeA,
    computeBudget: 100,
    storageBudget: 50,
    returnPath: 'home-base://a',
  });
  assert.equal(root.created, true);
  if (!root.created) return;
  const childTask = graph.spawnChild({
    parentTaskId: root.node.taskId,
    agentId: 'child',
    taskClass: 'CODE_ANALYSIS',
    computeBudget: 40,
    storageBudget: 20,
  });
  assert.equal(childTask.created, true);
  if (!childTask.created) return;
  assert.equal(childTask.node.scope.tenantId, scopeA.tenantId);
  assert.equal(childTask.node.scope.universeId, scopeA.universeId);

  const expand = graph.spawnChild({
    parentTaskId: root.node.taskId,
    agentId: 'child2',
    taskClass: 'LOCAL_SEARCH',
    requestedScope: scopeB,
    computeBudget: 10,
    storageBudget: 10,
  });
  assert.equal(expand.created, false);
});

test('tenant isolation + Universe isolation', () => {
  const bus = createLocalAgentMessageBus();
  bus.publish({
    scope: scopeA,
    missionId: 'm1',
    taskId: 't1',
    senderAgentId: 'a1',
    receiverAgentId: 'shared-recv',
    purpose: 'iso',
    dataClass: 'TENANT_PRIVATE',
    payloadType: 'task_dispatch',
    payload: { secret: true },
  });
  const cross = bus.routeTo({ receiverAgentId: 'shared-recv', scope: scopeB });
  assert.equal(cross.length, 0);
  const probe = bus.attemptCrossTenantRead({
    scope: scopeB,
    foreignScope: scopeA,
    receiverAgentId: 'shared-recv',
  });
  assert.equal(probe.denied, true);

  const registry = createAgentRegistry();
  registry.register({
    agentId: 'iso-a',
    agentType: 'worker',
    scope: scopeA,
    missionId: 'm1',
    taskId: 't1',
    allowedTools: ['local_search'],
    allowedDataClasses: ['XIV_OWNED'],
    computeBudget: 10,
    storageBudget: 10,
    returnPath: 'home-base://a',
    expiry: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(registry.get('iso-a', scopeB), null);
  assert.equal(registry.attemptCrossTenantGet('iso-a', scopeB), null);
});

test('checkpoint restore + power-off OFFLINE_STOPPED', () => {
  const store = createCheckpointStore();
  const saved = store.save({
    agentId: 'a1',
    missionId: 'm1',
    taskId: 't1',
    scope: scopeA,
    runtimeState: 'RUNNING',
    progressSummary: 'mid-task',
    computeState: 'SUPPORTED',
    dependencySnapshot: ['dep-1'],
  });
  assert.equal(saved.saved, true);
  if (!saved.saved) return;

  const off = store.onPowerOff(scopeA);
  assert.equal(off.newState, 'OFFLINE_STOPPED');
  assert.equal(off.workContinuedWhileOff, false);
  const after = store.get(saved.checkpoint.checkpointId, scopeA);
  assert.equal(after?.runtimeState, 'OFFLINE_STOPPED');

  const badPolicy = store.restore({
    checkpointId: saved.checkpoint.checkpointId,
    scope: scopeA,
    policyValid: false,
    dependenciesValid: true,
  });
  assert.equal(badPolicy.restored, false);

  const ok = store.restore({
    checkpointId: saved.checkpoint.checkpointId,
    scope: scopeA,
    policyValid: true,
    dependenciesValid: true,
  });
  assert.equal(ok.restored, true);
  if (!ok.restored) return;
  assert.equal(ok.resumeCandidate, true);
  assert.equal(ok.workContinuedWhileOff, false);
});

test('stale heartbeat + claim work while off denied', () => {
  const hb = createHeartbeatService(100);
  hb.beat({
    agentId: 'a1',
    nodeId: 'node-1',
    scope: scopeA,
    state: 'LOCAL_ONLY',
    at: new Date(Date.now() - 5_000).toISOString(),
  });
  assert.equal(hb.isStale('a1', scopeA, Date.now()), true);
  assert.equal(hb.isStale('missing', scopeA), true);

  hb.beat({
    agentId: 'a2',
    nodeId: 'node-1',
    scope: scopeA,
    state: 'LOCAL_ONLY',
  });
  const off = hb.markPowerOff('node-1', scopeA);
  assert.equal(off.state, 'OFFLINE_STOPPED');
  assert.equal(off.claimWorkContinued, false);
  const claim = hb.claimWorkWhileOff();
  assert.equal(claim.denied, true);
});

test('offline API denial → WAITING_DATA; no fabricate', () => {
  const worker = createLocalWorker('OFFLINE');
  const deniedClass = worker.execute({
    taskId: 't1',
    agentId: 'a1',
    taskClass: 'LIVE_STOCK_QUOTE',
    scope: scopeA,
    requiresLiveApi: true,
    payload: {},
  });
  assert.equal(deniedClass.status, 'DENIED');

  const waiting = worker.execute({
    taskId: 't2',
    agentId: 'a1',
    taskClass: 'KNOWLEDGE_RETRIEVAL',
    scope: scopeA,
    requiresLiveApi: true,
    payload: { query: 'latest market' },
  });
  assert.equal(waiting.status, 'WAITING_DATA');
  if (waiting.status !== 'WAITING_DATA') return;
  assert.equal(waiting.offlineMode, true);
  assert.match(waiting.reason, /EXTERNAL_LIVE_API/);

  const localOk = worker.execute({
    taskId: 't3',
    agentId: 'a1',
    taskClass: 'CODE_ANALYSIS',
    scope: scopeA,
    requiresLiveApi: false,
    payload: { file: 'index.ts' },
  });
  assert.equal(localOk.status, 'COMPLETED');
});

test('CPU fallback; GPU/NPU truth states NOT_TESTED', () => {
  const compute = createComputeAdapterRegistry();
  assert.equal(compute.get('CPU').state, 'SUPPORTED');
  assert.equal(compute.get('AMD_GPU').state, 'NOT_TESTED');
  assert.equal(compute.get('AMD_NPU').state, 'NOT_TESTED');
  assert.equal(compute.get('NVIDIA').verified, false);

  const incomplete = compute.attemptVerify({
    id: 'AMD_GPU',
    loaded: true,
    executed: false,
    deviceConfirmed: false,
    validResult: false,
    benchmarked: false,
    evidenceRefs: [],
  });
  assert.equal(incomplete.verified, false);
  assert.equal(compute.get('AMD_GPU').state, 'NOT_TESTED');

  const fallback = compute.route({ prefer: 'AMD_GPU', requireVerifiedAccelerator: true });
  assert.equal(fallback.selected, 'CPU');
  assert.equal(fallback.usedFallback, true);
  assert.equal(fallback.claimedAcceleratorVerified, false);

  const cpuFb = compute.cpuFallback();
  assert.equal(cpuFb.claimedAcceleratorVerified, false);
});

test('pack manifest validation + revocation-before-sync + dedupe', () => {
  const packs = createOfflinePackService();
  const created = packs.createPack({
    packId: 'SEMICONDUCTORS',
    packVersion: '1.0.0',
    title: 'Semiconductors pack',
    rights: 'XIV_OWNED',
    domains: ['chips'],
    scope: scopeA,
    freshnessExpiry: new Date(Date.now() + 86_400_000).toISOString(),
    content: 'xiv-owned-portable-only',
  });
  assert.equal(created.created, true);
  if (!created.created) return;
  const valid = packs.validateManifest(created.manifest);
  assert.equal(valid.valid, true);

  assert.equal(packs.revoke('SEMICONDUCTORS', scopeA), true);

  const sync = packs.sync({
    scope: scopeA,
    authenticated: true,
    localCandidates: [
      { id: 'c1', contentHash: 'aaa', summary: 'lesson-1' },
      { id: 'c2', contentHash: 'aaa', summary: 'dup' },
      { id: 'c3', contentHash: 'bbb', summary: 'lesson-2' },
    ],
  });
  assert.ok(!('denied' in sync));
  if ('denied' in sync) return;
  assert.equal(sync.revocationsFirst, true);
  assert.equal(sync.steps[1]!.step, 'revocations');
  assert.equal(sync.autoGlobalized, false);
  assert.equal(sync.mergeCandidate, true);

  const dedupe = packs.dedupe(['x', 'y', 'x', 'z', 'y']);
  assert.deepEqual(dedupe.unique, ['x', 'y', 'z']);
  assert.equal(dedupe.duplicatesRemoved, 2);

  const auto = packs.attemptAutoGlobalize('learn-nope', scopeA);
  assert.equal(auto.denied, true);
});

test('replication-policy denial; SEALED_LOCAL never silent cloud', () => {
  const storage = createStorageResilience();
  const put = storage.put({
    owner: 'agent-1',
    scope: scopeA,
    dataClass: 'SEALED_LOCAL',
    source: 'local',
    rights: 'XIV_OWNED',
    retention: '30d',
    replicationPolicy: ['HOME_BASE', 'LOCAL_NODE', 'BACKUP'],
    encryptionState: 'SEALED',
    version: '1',
    freshness: new Date().toISOString(),
    location: 'SEALED_LOCAL',
    content: 'sealed-bytes',
  });
  const denied = storage.replicate({
    objectId: put.object.objectId,
    scope: scopeA,
    destination: 'AUTHORIZED_CLOUD',
  });
  assert.equal(denied.replicated, false);
  if (denied.replicated) return;
  assert.match(denied.reason, /REPLICATION_POLICY_DENIES|SEALED_LOCAL/);

  const silent = storage.attemptSilentCloudSealedLocal(
    put.object.objectId,
    scopeA,
  );
  assert.equal(silent.replicated, false);

  const privatePut = storage.put({
    owner: 'agent-1',
    scope: scopeA,
    dataClass: 'TENANT_PRIVATE',
    source: 'local',
    rights: 'TENANT',
    retention: '90d',
    replicationPolicy: ['TENANT_PRIVATE', 'LOCAL_NODE'],
    encryptionState: 'AT_REST',
    version: '1',
    freshness: new Date().toISOString(),
    location: 'TENANT_PRIVATE',
    content: 'private-bytes',
  });
  const train = storage.attemptTenantPrivateGlobalTraining(
    privatePut.object.objectId,
    scopeA,
  );
  assert.equal(train.replicated, false);

  const ok = storage.replicate({
    objectId: put.object.objectId,
    scope: scopeA,
    destination: 'BACKUP',
  });
  assert.equal(ok.replicated, true);
});

test('contradiction preservation + Home Base return receipts', () => {
  const ledger = createEvidenceLedger();
  const rec = ledger.record({
    agentId: 'a1',
    missionId: 'm1',
    taskId: 't1',
    scope: scopeA,
    kind: 'analysis',
    summary: 'claim A',
    contradictions: ['contradicts:prior-claim-B'],
  });
  assert.equal(rec.recorded, true);
  const preserved = ledger.preserveContradictions(scopeA);
  assert.ok(preserved.includes('contradicts:prior-claim-B'));

  const cotDenied = ledger.record({
    agentId: 'a1',
    missionId: 'm1',
    taskId: 't1',
    scope: scopeA,
    kind: 'analysis',
    summary: 'x',
    hiddenCot: 'secret reasoning',
  });
  assert.equal(cotDenied.recorded, false);

  const kg = createNeuralKg();
  const n1 = kg.addNode({
    kind: 'Claim',
    label: 'claim-A',
    state: 'HYPOTHESIS',
    scope: scopeA,
  });
  assert.equal(kg.markContradiction(n1.nodeId, scopeA, 'conflicts with B'), true);
  assert.ok(kg.listContradictions(scopeA).length >= 1);

  const plasticityDeny = kg.applyPlasticity({
    scope: scopeA,
    adjustment: {
      targetId: n1.nodeId,
      kind: 'retrieval_ranking',
      delta: 0.1,
      reason: 'test',
    },
    attemptPermissionChange: true,
  });
  assert.equal(plasticityDeny.applied, false);

  const plasticityOk = kg.applyPlasticity({
    scope: scopeA,
    adjustment: {
      targetId: n1.nodeId,
      kind: 'recommendation_confidence',
      delta: 0.1,
      reason: 'evidence boost',
    },
  });
  assert.equal(plasticityOk.applied, true);

  const receipts = createReturnReceiptLedger();
  const registry = createAgentRegistry();
  const payload = registry.buildReturnPayload({
    result: { ok: true },
    evidence: ['ev-1'],
    tests: ['t-routing'],
    failures: [],
    contradictions: ['contradicts:prior-claim-B'],
    blockers: [],
    lessons: ['preserve contradictions'],
    candidateSkills: [],
    nextAction: 'RETURN_TO_HOME_BASE',
  });
  assert.equal(payload.ok, true);
  if (!payload.ok) return;
  const submitted = receipts.submit({
    agentId: 'a1',
    missionId: 'm1',
    taskId: 't1',
    scope: scopeA,
    returnPath: 'home-base://gob',
    payload: payload.payload,
    offlineMode: true,
  });
  assert.equal(submitted.accepted, true);
  if (!submitted.accepted) return;
  assert.equal(submitted.receipt.hiddenCotPersisted, false);
  assert.equal(submitted.receipt.l4AutonomyEnabled, false);
  assert.ok(receipts.get(submitted.receipt.receiptId, scopeA));
  assert.equal(receipts.get(submitted.receipt.receiptId, scopeB), null);
});

test('XIV DNA manifest + forbidden clone denial', () => {
  const written = writeXivDnaManifest(repoRoot);
  assert.equal(written.cloned, true);
  if (!written.cloned) return;
  const valid = validateXivDnaManifest(written.manifest);
  assert.equal(valid.valid, true);
  const read = readXivDnaManifest(repoRoot);
  assert.ok(read);
  assert.equal(read?.sourceRights, 'XIV_OWNED_PORTABLE_ONLY');
  const denied = attemptForbiddenClone('private_chip_ip');
  assert.equal(denied.cloned, false);
});

test('control tower honesty — offline inference not claimed', () => {
  const compute = createComputeAdapterRegistry();
  const heartbeats = createHeartbeatService();
  const checkpoints = createCheckpointStore();
  const packs = createOfflinePackService();
  const storage = createStorageResilience();
  const worker = createLocalWorker('OFFLINE');
  const tasks = createTaskGraph();
  const tower = buildControlTowerSnapshot({
    scope: scopeA,
    homeBaseReachable: false,
    networkOnline: false,
    cloudReachable: false,
    localWorktreeAccess: true,
    localModelProcessAlive: false,
    localModelHeartbeatFresh: false,
    compute,
    heartbeats,
    checkpoints,
    packs,
    storage,
    worker,
    tasks,
  });
  assert.equal(tower.offlineInferenceClaimed, false);
  const models = tower.slices.find((s) => s.name === 'LOCAL_MODELS');
  assert.equal(models?.state, 'NOT_TESTED');
  const gpu = tower.slices.find((s) => s.name === 'GPU');
  assert.equal(gpu?.state, 'NOT_TESTED');
});

test('soft-wire presence audit (presence ≠ VERIFIED)', () => {
  const soft = gobSoftWireSnapshot(repoRoot);
  assert.equal(soft.hc4CoreCompute.present, true);
  assert.equal(soft.localRuntime.present, true);
  assert.equal(soft.agentRouter.present, true);
  assert.equal(soft.policies.present, true);
  assert.match(soft.hc4CoreCompute.note, /Presence≠VERIFIED|PRESENT/);
});

test('full local-first cycle runner', () => {
  const cycle = runLocalFirstOfflineAgentCivilizationCycle({
    scope: scopeA,
    repoRoot,
  });
  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.l4AutonomyEnabled, false);
  assert.equal(cycle.tipLand, false);
  assert.equal(cycle.mergeMain, false);
  assert.equal(cycle.modelTruth.offlineInferenceVerified, false);
  assert.equal(cycle.offlineTruth.offlineInferenceVerified, false);
  assert.equal(cycle.hardwareTruth.AMD_GPU, 'NOT_TESTED');
  assert.equal(cycle.hardwareTruth.AMD_NPU, 'NOT_TESTED');
  assert.equal(cycle.hardwareTruth.CPU, 'SUPPORTED');
  const failed = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(failed.length, 0, JSON.stringify(failed));
  assert.ok(cycle.controlTowerSliceNames.includes('HOME_BASE'));
  assert.ok(cycle.controlTowerSliceNames.includes('LOCAL_MODELS'));
});
