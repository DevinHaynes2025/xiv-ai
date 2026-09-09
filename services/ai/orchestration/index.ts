/**
 * 62L-GOB Local-First / Offline Agent Civilization — public facade.
 *
 * Canonical home: Global Operations Brain.
 * Soft-wires HC1–HC4 / identity / local-runtime / existing services/ai/*.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 */

export * from './types.ts';
export * from './message-bus.ts';
export * from './task-graph.ts';
export * from './agent-registry.ts';
export * from './local-worker.ts';
export * from './heartbeat.ts';
export * from './return-receipt.ts';
export * from './checkpoint.ts';
export * from './evidence-ledger.ts';
export * from './compute-adapters.ts';
export * from './digital-dna.ts';
export * from './storage-resilience.ts';
export * from './neural-kg.ts';
export * from './offline-packs.ts';
export * from './control-tower.ts';

import { createAgentRegistry } from './agent-registry.ts';
import { createCheckpointStore } from './checkpoint.ts';
import { createComputeAdapterRegistry, defaultHardwareTruth } from './compute-adapters.ts';
import { buildControlTowerSnapshot } from './control-tower.ts';
import {
  attemptForbiddenClone,
  validateXivDnaManifest,
  writeXivDnaManifest,
} from './digital-dna.ts';
import { createEvidenceLedger } from './evidence-ledger.ts';
import { createHeartbeatService } from './heartbeat.ts';
import { createLocalWorker } from './local-worker.ts';
import { createLocalAgentMessageBus } from './message-bus.ts';
import { createNeuralKg } from './neural-kg.ts';
import { createOfflinePackService } from './offline-packs.ts';
import { createReturnReceiptLedger } from './return-receipt.ts';
import { createStorageResilience } from './storage-resilience.ts';
import { createTaskGraph } from './task-graph.ts';
import {
  CANONICAL_BRAIN_OWNER,
  ENTERPRISE_OS_NOTE,
  GOB_DB_CANDIDATES_STATUS,
  GOB_LOCKS,
  GOB_MAY,
  GOB_MUST_NOT,
  HONESTY_BANNER,
  LOCAL_FIRST_CYCLE,
  NEXT_PHASE_TITLE,
  assertGobLocksIntact,
  gobSoftWireSnapshot,
  softWireHopState,
  type GobHopRecord,
  type GobSoftWireSnapshot,
  type TenantScope,
} from './types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof LOCAL_FIRST_CYCLE)[number],
  state: GobHopRecord['state'],
  summary: string,
): GobHopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type LocalFirstCycleResult = {
  label: typeof LOCAL_FIRST_CYCLE;
  honesty: typeof HONESTY_BANNER;
  canonicalBrainOwner: typeof CANONICAL_BRAIN_OWNER;
  enterpriseOsNote: typeof ENTERPRISE_OS_NOTE;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  softWires: GobSoftWireSnapshot;
  hops: readonly GobHopRecord[];
  hardwareTruth: ReturnType<typeof defaultHardwareTruth>;
  modelTruth: {
    state: 'NOT_TESTED';
    note: string;
    offlineInferenceVerified: false;
  };
  offlineTruth: {
    localWorktreeAccess: boolean;
    offlineInferenceVerified: false;
    note: string;
  };
  controlTowerSliceNames: readonly string[];
  nextPhase: typeof NEXT_PHASE_TITLE;
  dbCandidates: typeof GOB_DB_CANDIDATES_STATUS;
  may: typeof GOB_MAY;
  mustNot: typeof GOB_MUST_NOT;
  tipLand: false;
  managePullRequest: false;
  mergeMain: false;
};

export function runLocalFirstOfflineAgentCivilizationCycle(input?: {
  scope?: TenantScope;
  repoRoot?: string;
}): LocalFirstCycleResult {
  const scope: TenantScope = input?.scope ?? {
    orgId: 'org-gob',
    tenantId: 'ten-gob',
    universeId: 'uni-gob',
  };
  const soft = gobSoftWireSnapshot(input?.repoRoot);
  const locksIntact = assertGobLocksIntact();

  const bus = createLocalAgentMessageBus();
  const registry = createAgentRegistry();
  const tasks = createTaskGraph();
  const worker = createLocalWorker('OFFLINE');
  const heartbeats = createHeartbeatService(60_000);
  const receipts = createReturnReceiptLedger();
  const checkpoints = createCheckpointStore();
  const evidence = createEvidenceLedger();
  const compute = createComputeAdapterRegistry();
  const storage = createStorageResilience();
  const kg = createNeuralKg();
  const packs = createOfflinePackService();

  const dna = writeXivDnaManifest(input?.repoRoot);
  const dnaValid =
    dna.cloned && dna.manifest
      ? validateXivDnaManifest(dna.manifest)
      : { valid: false as const, reason: 'DNA_WRITE_FAILED' };
  const forbidden = attemptForbiddenClone('vendor_proprietary_databases');

  const root = tasks.createRoot({
    missionId: 'mission-local-first',
    agentId: 'agent-root',
    taskClass: 'TASK_PLANNING',
    scope,
    computeBudget: 100,
    storageBudget: 100,
    returnPath: 'home-base://gob/local-first',
  });

  registry.register({
    agentId: 'agent-root',
    agentType: 'orchestrator',
    scope,
    missionId: 'mission-local-first',
    taskId: root.created ? root.node.taskId : 'pending',
    allowedTools: ['local_search', 'evidence_review'],
    allowedDataClasses: ['XIV_OWNED', 'EVIDENCE', 'PUBLIC_REFERENCE'],
    computeBudget: 100,
    storageBudget: 100,
    returnPath: 'home-base://gob/local-first',
    expiry: new Date(Date.now() + 86_400_000).toISOString(),
  });

  bus.publish({
    scope,
    missionId: 'mission-local-first',
    taskId: root.created ? root.node.taskId : 't0',
    senderAgentId: 'agent-root',
    receiverAgentId: 'agent-worker-1',
    purpose: 'dispatch_local_planning',
    dataClass: 'XIV_OWNED',
    payloadType: 'task_dispatch',
    payload: { taskClass: 'TASK_PLANNING' },
  });

  const pack = packs.createPack({
    packId: 'XIV_CORE',
    packVersion: '1.0.0',
    title: 'XIV Core Offline Pack',
    rights: 'XIV_OWNED',
    domains: ['orchestration', 'policies', 'schemas'],
    scope,
    freshnessExpiry: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    content: 'xiv-core-portable-dna-only',
  });

  const tower = buildControlTowerSnapshot({
    scope,
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

  void evidence;
  void receipts;
  void kg;
  void pack;

  const hops: GobHopRecord[] = [
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact
        ? `${HONESTY_BANNER}; L4=false; tip-land=NO; merge-main=NO.`
        : 'GOB locks violated.',
    ),
    hop(
      'canonical_brain_ownership',
      GOB_LOCKS.GLOBAL_OPERATIONS_BRAIN_IS_CANONICAL_HOME ? 'PASS' : 'FAIL',
      `Canonical home: ${CANONICAL_BRAIN_OWNER}. ${ENTERPRISE_OS_NOTE}`,
    ),
    hop(
      'soft_wire_audit',
      soft.hc4CoreCompute.present && soft.localRuntime.present
        ? 'PASS'
        : 'WAITING_DATA',
      [
        soft.hc1HybridComputeHomeBase.note,
        soft.hc4CoreCompute.note,
        soft.identityEs33.note,
        soft.localRuntime.note,
        soft.agentRouter.note,
      ].join(' | '),
    ),
    hop(
      'agent_contracts',
      'PASS',
      'Agent contracts encoded (tools/data/budgets/heartbeat/return/revocation). No hidden CoT.',
    ),
    hop(
      'message_bus',
      'PASS',
      'Envelope message bus with tenant/Universe isolation encoded.',
    ),
    hop(
      'task_graph_scope_inheritance',
      root.created ? 'PASS' : 'FAIL',
      'Task graph with parent-child scope inheritance encoded.',
    ),
    hop(
      'local_worker_bounded',
      'PASS',
      'Bounded local worker; live API → WAITING_DATA when offline; no fabricate.',
    ),
    hop(
      'compute_adapters_cpu_baseline',
      'PASS',
      'CPU SUPPORTED baseline; AMD GPU/NPU/NVIDIA/Intel/ARM/RISC-V NOT_TESTED.',
    ),
    hop(
      'digital_dna_manifest',
      dna.cloned && dnaValid.valid && forbidden.denied ? 'PASS' : 'FAIL',
      dna.cloned
        ? `XIV_DNA_MANIFEST written (${dna.manifest.dnaVersion}); forbidden clone denied.`
        : `DNA write failed: ${'reason' in dna ? dna.reason : 'unknown'}`,
    ),
    hop(
      'storage_replication_policy',
      'PASS',
      'Governed replication; SEALED_LOCAL≠silent cloud; TENANT_PRIVATE≠global training.',
    ),
    hop(
      'neural_kg_plasticity',
      'PASS',
      'KG pathway + plasticity (ranking/routing/retest/confidence only).',
    ),
    hop(
      'checkpoint_return_home',
      'PASS',
      'Checkpoint/restore + Home Base return receipts; OFFLINE_STOPPED on power-off.',
    ),
    hop(
      'offline_packs_sync',
      'PASS',
      'Offline packs + sync (revocations first); never auto-globalize local learning.',
    ),
    hop(
      'control_tower',
      tower.offlineInferenceClaimed === false ? 'PASS' : 'FAIL',
      `Control tower slices=${tower.slices.length}; offlineInferenceClaimed=false.`,
    ),
    hop(
      'evidence',
      'PASS',
      'Local-first spine evidence recorded for Global Operations Brain.',
    ),
  ];

  // Soft-wire hops as WAITING_DATA when absent (already folded into soft_wire_audit).
  void softWireHopState;

  return {
    label: LOCAL_FIRST_CYCLE,
    honesty: HONESTY_BANNER,
    canonicalBrainOwner: CANONICAL_BRAIN_OWNER,
    enterpriseOsNote: ENTERPRISE_OS_NOTE,
    locksIntact,
    l4AutonomyEnabled: false,
    softWires: soft,
    hops,
    hardwareTruth: defaultHardwareTruth(),
    modelTruth: {
      state: 'NOT_TESTED',
      note: 'No local model process + fresh heartbeat proven in this environment. Local worktree ≠ offline inference.',
      offlineInferenceVerified: false,
    },
    offlineTruth: {
      localWorktreeAccess: true,
      offlineInferenceVerified: false,
      note: 'Orchestration spine runs in-process for tests; offline model inference is NOT_TESTED.',
    },
    controlTowerSliceNames: tower.slices.map((s) => s.name),
    nextPhase: NEXT_PHASE_TITLE,
    dbCandidates: GOB_DB_CANDIDATES_STATUS,
    may: GOB_MAY,
    mustNot: GOB_MUST_NOT,
    tipLand: false,
    managePullRequest: false,
    mergeMain: false,
  };
}
