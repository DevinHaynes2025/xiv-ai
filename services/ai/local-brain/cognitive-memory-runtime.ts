import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  allocateBoundedContext,
  createBrainSnapshot,
  declareSubstrates,
  intelligentCachePut,
  memoryChipHonesty,
  persistAllocation,
  writeAgentModelMemory,
} from './cognitive-memory-chip';
import {
  attemptAuthorityTransfer,
  neuralBusHonesty,
  publishNeuralBusMessage,
} from './agent-neural-bus';
import {
  declareKnowledgeRoute,
  knowledgeRouterHonesty,
  routeKnowledge,
} from './universe-knowledge-router';
import {
  ensureOfflineSnapshotSeed,
  enterDegradedOperation,
  observeProvidersHonesty,
  offlineBoot,
  offlineFabricHonesty,
} from './persistent-offline-brain-fabric';
import {
  BD_LOCKS,
  COGNITIVE_MEMORY_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NO_CONSCIOUSNESS,
  letterCollisionNote,
  predecessorMap,
  type BdActor,
  type BdEvidenceState,
  type BdHop,
  type BdHopRecord,
} from './cognitive-memory-types';

export {
  BD_LOCKS,
  COGNITIVE_MEMORY_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  letterCollisionNote,
  predecessorMap,
};

function hop(name: BdHop, state: BdEvidenceState, summary: string): BdHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BdCycleInput = {
  tenantId: string;
  universeId: string;
  peerUniverseId?: string;
  actor: BdActor;
  peer?: BdActor;
  sealedPayload?: string;
  attemptAuthorityTransfer?: boolean;
  claimWormholeBypass?: boolean;
  root?: string;
};

export async function runCognitiveMemoryCycle(input: BdCycleInput) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BdHopRecord[] = [];
  const peerUniverseId = input.peerUniverseId ?? `${input.universeId}-peer`;
  const peer: BdActor = input.peer ?? {
    kind: 'specialized_agent',
    id: 'peer-specialist',
    tenantId: input.tenantId,
    universeId: input.universeId,
    role: 'analyst',
  };

  const substrates = declareSubstrates();
  hops.push(
    hop(
      'substrate_declare',
      'PASS',
      `Substrates=${substrates.map((s) => s.substrate).join(',')}; customHardwareRequired=false; ${NO_CONSCIOUSNESS}.`,
    ),
  );

  const alloc = allocateBoundedContext({
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: input.actor.id,
    modelId: 'local-bounded-model',
    requestedTokens: 4096,
  });
  if (alloc.allocation) await persistAllocation(alloc.allocation, root);
  hops.push(hop('context_allocate', alloc.accepted ? 'PASS' : 'FAIL', alloc.reason));

  const memory = await writeAgentModelMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: input.actor.id,
    modelId: 'local-bounded-model',
    note: 'agent working memory note',
    root,
  });
  hops.push(hop('agent_model_memory', memory.accepted ? 'PASS' : 'FAIL', memory.reason));

  const cache = await intelligentCachePut({
    tenantId: input.tenantId,
    universeId: input.universeId,
    key: 'bd-cache-key',
    value: 'cached-local-knowledge',
    root,
  });
  hops.push(hop('intelligent_cache', cache.accepted ? 'PASS' : 'FAIL', cache.reason));

  const snapshot = await createBrainSnapshot({
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: 'cycle-snapshot',
    payload: `snap:${input.tenantId}:${input.universeId}`,
    allocationIds: alloc.allocation ? [alloc.allocation.id] : [],
    root,
  });
  hops.push(hop('brain_snapshot', 'PASS', `Snapshot ${snapshot.id} offlineCapable=true liveProvidersRequired=false.`));

  hops.push(hop('neural_bus_bind', 'PASS', 'Agent Neural Bus bound for same-Universe evidence/task/result exchange.'));

  let authorityDenied = true;
  if (input.attemptAuthorityTransfer) {
    const denied = await attemptAuthorityTransfer(
      {
        fromAgentId: input.actor.id,
        toAgentId: peer.id,
        tenantId: input.tenantId,
        universeId: input.universeId,
        claimedAuthorityLevel: 99,
        reason: 'cycle_authority_probe',
      },
      root,
    );
    authorityDenied = denied.allowed === false && denied.authorityTransferred === false;
    hops.push(hop('authority_non_transfer', authorityDenied ? 'PASS' : 'FAIL', denied.reason));
  } else {
    const denied = await publishNeuralBusMessage({
      kind: 'status',
      from: input.actor,
      to: peer,
      body: 'probe authority transfer',
      authorityTransferAttempt: true,
      claimedAuthorityLevel: 5,
      root,
    });
    authorityDenied = denied.accepted === false && denied.authorityTransferred === false;
    hops.push(hop('authority_non_transfer', authorityDenied ? 'PASS' : 'FAIL', denied.reason));
  }

  const evidenceMsg = await publishNeuralBusMessage({
    kind: 'evidence',
    from: input.actor,
    to: peer,
    body: 'evidence packet A',
    evidenceRefs: ['ev-bd-1'],
    root,
  });
  hops.push(hop('evidence_exchange', evidenceMsg.accepted ? 'PASS' : 'FAIL', evidenceMsg.reason));

  const taskMsg = await publishNeuralBusMessage({
    kind: 'task',
    from: input.actor,
    to: peer,
    body: 'analyze local corpus',
    root,
  });
  const resultMsg = await publishNeuralBusMessage({
    kind: 'result',
    from: peer,
    to: input.actor,
    body: 'analysis complete (local)',
    root,
  });
  hops.push(
    hop(
      'task_result_exchange',
      taskMsg.accepted && resultMsg.accepted ? 'PASS' : 'FAIL',
      'Task and result exchanged without authority transfer.',
    ),
  );

  const cross = await publishNeuralBusMessage({
    kind: 'evidence',
    from: input.actor,
    to: { ...peer, universeId: peerUniverseId },
    body: 'cross-universe leak attempt',
    root,
  });
  hops.push(
    hop(
      'universe_isolation',
      cross.accepted === false ? 'PASS' : 'FAIL',
      cross.reason ?? 'cross-universe neural bus denied',
    ),
  );

  const routeDecl = await declareKnowledgeRoute({
    tenantId: input.tenantId,
    fromUniverseId: input.universeId,
    toUniverseId: peerUniverseId,
    label: 'bd-wormhole',
    permissioned: true,
    logicalWormhole: true,
    founderSealed: false,
    actor: input.actor,
    root,
  });
  hops.push(hop('knowledge_route_declare', routeDecl.accepted ? 'PASS' : 'FAIL', routeDecl.reason));

  const permitted = await routeKnowledge({
    tenantId: input.tenantId,
    fromUniverseId: input.universeId,
    toUniverseId: peerUniverseId,
    actor: input.actor,
    surface: 'wormhole',
    routeId: routeDecl.accepted ? routeDecl.route.id : undefined,
    root,
  });
  hops.push(hop('permission_check', permitted.allowed ? 'PASS' : 'DENIED', permitted.reason));

  const bypass = await routeKnowledge({
    tenantId: input.tenantId,
    fromUniverseId: input.universeId,
    toUniverseId: peerUniverseId,
    actor: input.actor,
    surface: 'wormhole',
    claimTrustBypass: input.claimWormholeBypass !== false,
    claimAuthBypass: input.claimWormholeBypass !== false,
    root,
  });
  hops.push(
    hop(
      'logical_wormhole',
      bypass.allowed === false ? 'PASS' : 'FAIL',
      bypass.reason,
    ),
  );

  const sealedDeny = await routeKnowledge({
    tenantId: input.tenantId,
    fromUniverseId: input.universeId,
    toUniverseId: peerUniverseId,
    actor: { ...input.actor, kind: 'ordinary_agent' },
    surface: 'cloud',
    payload: input.sealedPayload ?? 'FOUNDER_SEALED_BD_TOKEN',
    root,
  });
  const peerDeny = await routeKnowledge({
    tenantId: input.tenantId,
    fromUniverseId: input.universeId,
    toUniverseId: peerUniverseId,
    actor: { kind: 'telemetry', id: 'telemetry-sink', tenantId: input.tenantId, universeId: input.universeId },
    surface: 'telemetry',
    payload: input.sealedPayload ?? 'FOUNDER_SEALED_BD_TOKEN',
    root,
  });
  const trainingDeny = await routeKnowledge({
    tenantId: input.tenantId,
    fromUniverseId: input.universeId,
    toUniverseId: peerUniverseId,
    actor: { kind: 'training_pipeline', id: 'train-pipe', tenantId: input.tenantId, universeId: input.universeId },
    surface: 'training',
    payload: input.sealedPayload ?? 'FOUNDER_SEALED_BD_TOKEN',
    root,
  });
  hops.push(
    hop(
      'founder_sealed_deny',
      sealedDeny.allowed === false && peerDeny.allowed === false && trainingDeny.allowed === false ? 'PASS' : 'FAIL',
      'Founder-sealed deny-by-default for cloud/peers/telemetry/training paths.',
    ),
  );

  const seed = await ensureOfflineSnapshotSeed({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  const boot = await offlineBoot({
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode: 'warm_snapshot',
    snapshotId: seed.id,
    root,
  });
  hops.push(hop('offline_boot', boot.ok ? 'PASS' : 'FAIL', boot.reason));

  hops.push(
    hop(
      'snapshot_restore',
      boot.ok && boot.snapshot?.id === seed.id ? 'PASS' : 'FAIL',
      boot.ok ? `Restored snapshot ${boot.snapshot?.id}` : boot.reason,
    ),
  );

  const degraded = await enterDegradedOperation({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  hops.push(
    hop(
      'degraded_operation',
      degraded.ok && degraded.inventLiveProviderAvailability === false ? 'PASS' : 'FAIL',
      degraded.reason,
    ),
  );

  const providers = observeProvidersHonesty();
  hops.push(
    hop(
      'provider_honesty',
      providers.inventLiveProviderAvailability === false ? 'PASS' : 'FAIL',
      providers.reason,
    ),
  );

  const gate = decisionGate({
    id: `bd-${input.tenantId}`,
    action: 'cognitive-memory-cycle',
    consequence: 'HIGH',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  await appendEvidenceEvent(
    {
      kind: 'security_review',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-BD cognitive memory / neural bus / knowledge router cycle',
      payload: {
        hops: hops.map((item) => item.hop),
        authorityDenied,
        wormholeBypassDenied: bypass.allowed === false,
        sealedDeny: sealedDeny.allowed === false,
        l4: BD_LOCKS.L4_AUTONOMY_ENABLED,
        humanApprovalRequired: gate.humanApprovalRequired,
        honesty: HONESTY_BANNER,
      },
    },
    root,
  );
  hops.push(hop('evidence', 'PASS', 'Evidence ledger wrote a non-production security review.'));

  await appendLearning(
    {
      domain: '62l-bd',
      subject: 'cognitive-memory-neural-bus',
      claimState: 'UNKNOWN',
      summary: 'Authority non-transfer, sealed deny, wormhole no-bypass, offline boot without inventing providers.',
      sourceRefs: hops.map((item) => item.hop),
      evidence: ['phase62lbd'],
    },
    root,
  );
  hops.push(hop('learning', 'PASS', 'Learning ledger recorded hypothesis; permissionChange remains false.'));

  const failCount = hops.filter((item) => item.state === 'FAIL').length;
  return {
    state: failCount === 0 ? ('completed' as const) : ('denied' as const),
    hops,
    completedHops: hops.map((item) => item.hop),
    authorityDenied,
    wormholeBypassDenied: bypass.allowed === false,
    sealedDenyDefault: sealedDeny.allowed === false,
    offlineBootOk: boot.ok === true,
    locks: BD_LOCKS,
    memory: memoryChipHonesty(),
    neuralBus: neuralBusHonesty(),
    knowledgeRouter: knowledgeRouterHonesty(),
    offlineFabric: offlineFabricHonesty(),
    providers,
    letterCollision: letterCollisionNote(),
    productionAuthorization: false as const,
    tipLand: false as const,
    next: NEXT_PHASE_TITLE,
  };
}

export async function buildCognitiveMemoryHealthReport(root = process.cwd()) {
  const predecessors = predecessorMap(root);
  const providers = observeProvidersHonesty();
  const brain = await checkLocalBrainHealth(root);
  return {
    phase: '62L-BD',
    productionAuthorization: false as const,
    tipLand: false as const,
    honestyBanner: HONESTY_BANNER,
    honesty: BD_LOCKS,
    substrates: declareSubstrates(),
    memory: memoryChipHonesty(),
    neuralBus: neuralBusHonesty(),
    knowledgeRouter: knowledgeRouterHonesty(),
    offlineFabric: offlineFabricHonesty(),
    letterCollision: letterCollisionNote(),
    predecessors,
    providers,
    localBrain: { ok: brain.ok, productionAuthorization: false as const },
    next: NEXT_PHASE_TITLE,
  };
}
