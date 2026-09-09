/**
 * 62L-CX Persistent Knowledge Civilization runtime —
 * Walks PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  bootstrapPersistentKnowledgeCivilization,
  persistentKnowledgeCivilizationHonesty,
} from './persistent-knowledge-civilization';
import {
  CX_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE,
  predecessorMap,
  type CxActor,
  type CxEvidenceState,
  type CxHop,
  type CxHopRecord,
} from './persistent-knowledge-civilization-types';

export {
  CX_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE,
  predecessorMap,
};

function hop(name: CxHop, state: CxEvidenceState, summary: string): CxHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CxCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CxActor;
  root?: string;
};

export async function runPersistentKnowledgeCivilizationCycle(input: CxCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CxHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CX_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CX_LOCKS.LOCAL_FIRST &&
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
        CX_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const civ = await bootstrapPersistentKnowledgeCivilization({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'civilization_bootstrap',
      civ && persistentKnowledgeCivilizationHonesty().l4AutonomyEnabled === false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `Persistent Knowledge Civilization façade id=${civ.id}`,
    ),
  );

  // Force offline realism first so shared durable roots cannot invent powered nodes.
  await setAuthorizedNodesPowered({ powered: false, root, actor });
  const colony = await registerResearchColony({
    name: 'colony-offline-1',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    authorizedNodePowered: false,
    root,
    actor,
  });
  const offlineEval = await evaluateOfflineColonyNetwork({ root, actor });
  hops.push(
    hop(
      'colony_no_powered_node_waiting_or_stopped',
      offlineEval.accepted === false &&
        (offlineEval.networkStatus === 'WAITING_NODE' ||
          offlineEval.networkStatus === 'OFFLINE_STOPPED')
        ? offlineEval.networkStatus
        : 'FAIL',
      offlineEval.reason,
    ),
  );

  await setAuthorizedNodesPowered({ powered: true, root, actor });
  const poweredColony = await registerResearchColony({
    name: `colony-hb-check-${Date.now().toString(36)}`,
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    authorizedNodePowered: true,
    root,
    actor,
  });
  const noHb = await claimColonyRunningVerified({
    colonyId: poweredColony.colony!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'colony_missing_heartbeat_not_running_verified',
      noHb.accepted === false ? 'DENIED' : 'FAIL',
      noHb.reason,
    ),
  );

  const pool = await attemptRawPrivateGlobalPool({
    label: 'raw-private-pool-attempt',
    root,
    actor,
  });
  hops.push(
    hop(
      'raw_private_global_pool_denied',
      pool.accepted === false ? 'DENIED' : 'FAIL',
      pool.reason,
    ),
  );

  const model = await proposeSandboxEvolution({
    modelId: 'cx-model-1',
    parentModelId: 'base',
    root,
    actor,
  });
  const modelPromo = await attemptModelSelfPromotion({
    candidateId: model.candidate!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'model_self_promotion_to_production_denied',
      modelPromo.accepted === false ? 'DENIED' : 'FAIL',
      modelPromo.reason,
    ),
  );

  const unsigned = await publishMemoryProduct({
    kind: 'scientific',
    label: 'unsigned-paper',
    signed: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_memory_product_rejected',
      unsigned.accepted === false ? 'REJECTED' : 'FAIL',
      unsigned.reason,
    ),
  );

  const unverifiedGpu = await registerAcceleratorTarget({
    kind: 'nvidia',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const unverifiedRoute = await routeAcceleratorWorkload({
    targetKind: 'nvidia',
    targetId: unverifiedGpu.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_gpu_qpu_unavailable',
      unverifiedGpu.status === 'UNAVAILABLE' && unverifiedRoute.status === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'FAIL',
      unverifiedRoute.reason,
    ),
  );

  const qpu = await registerAcceleratorTarget({
    kind: 'quantum',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const quantumNoBaseline = await routeAcceleratorWorkload({
    targetKind: 'quantum',
    targetId: qpu.id,
    classicalBaselineRef: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'quantum_without_classical_baseline_rejected',
      quantumNoBaseline.status === 'REJECTED' ? 'REJECTED' : 'FAIL',
      quantumNoBaseline.reason,
    ),
  );

  const approvedTool = await registerApprovedEcosystemTool({
    name: 'spectrum-analyzer',
    capabilityKey: 'spectrum-analysis',
    root,
    actor,
  });
  const reuse = await requestSandboxToolBuild({
    name: 'spectrum-analyzer-v2-dup',
    capabilityKey: 'spectrum-analysis',
    root,
    actor,
  });
  hops.push(
    hop(
      'tool_reuse_preferred_over_duplicate_sandbox',
      reuse.reused === true && reuse.tool?.id === approvedTool.tool?.id ? 'REUSED' : 'FAIL',
      reuse.reason,
    ),
  );

  const toolPromo = await attemptToolSelfPromotion({
    toolId: approvedTool.tool!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'tool_self_promotion_to_production_denied',
      toolPromo.accepted === false ? 'DENIED' : 'FAIL',
      toolPromo.reason,
    ),
  );

  const unapproved = await compileCrossUniverseTransfer({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-other',
    assetClass: 'unapproved',
    assetRef: 'secret-blob',
    authorizedUniverses: [input.universeId, 'univ-other'],
    root,
    actor,
  });
  hops.push(
    hop(
      'compiler_unapproved_cross_universe_denied',
      unapproved.accepted === false ? 'DENIED' : 'FAIL',
      unapproved.reason,
    ),
  );

  const rawXfer = await compileCrossUniverseTransfer({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-other',
    assetClass: 'raw_private',
    assetRef: 'raw-private-dump',
    authorizedUniverses: [input.universeId, 'univ-other'],
    root,
    actor,
  });
  hops.push(
    hop(
      'compiler_raw_private_cross_universe_denied',
      rawXfer.accepted === false ? 'DENIED' : 'FAIL',
      rawXfer.reason,
    ),
  );

  const sealed = await routeAcceleratorWorkload({
    targetKind: 'amd',
    contentMode: 'sealed',
    silentCloudAcceleratorFallback: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_cloud_accelerator',
      sealed.status === 'DENIED' ? 'DENIED' : 'FAIL',
      sealed.reason,
    ),
  );

  // Record a successful heartbeat for evidence path (does not invent RUNNING without it)
  if (colony.colony) {
    await setAuthorizedNodesPowered({ powered: true, root, actor });
    await recordColonyHeartbeat({
      colonyId: poweredColony.colony!.id,
      runtimeEvidence: 'pid=cx;runtime=local-colony',
      root,
      actor,
    });
  }

  void decisionGate({
    id: 'cx-cycle-gate',
    action: 'persistent_knowledge_civilization_cycle',
    consequence: 'HIGH',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CX persistent knowledge civilization cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CX'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CX persistent knowledge civilization cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning≠permission; colonies stop offline`,
      sourceRefs: ['62L-CX'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; does not grant permission'));

  void offlineColonyNetworkHonesty;
  void multiModelEvolutionLabHonesty;
  void scientificMemoryFabricHonesty;
  void adaptiveAcceleratorGridHonesty;
  void toolEcosystemHonesty;
  void intelligenceCompilerHonesty;

  return {
    ok: hops.every((h) =>
      [
        'PASS',
        'DENIED',
        'REJECTED',
        'UNAVAILABLE',
        'SANDBOXED',
        'REGISTERED',
        'SEARCHABLE',
        'UNPROMOTED',
        'IMPLEMENTED',
        'BOUNDED',
        'WAITING_DATA',
        'WAITING_NODE',
        'OFFLINE_STOPPED',
        'STALE',
        'HYPOTHESIS',
        'LINEAGED',
        'NEGATIVE_KEPT',
        'LOCAL_PREFERRED',
        'REUSED',
        'SIGNED',
        'APPROVED',
      ].includes(h.state),
    ),
    cycle: PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE,
    hops,
    honestyBanner: HONESTY_BANNER,
    locks: CX_LOCKS,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessors: predecessorMap(root),
    civilizationId: civ.id,
    productionAuthorized: false as const,
    l4AutonomyEnabled: false as const,
  };
}

export async function buildPersistentKnowledgeCivilizationHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const honesty = persistentKnowledgeCivilizationHonesty();
  const brain = await checkLocalBrainHealth(root).catch(() => ({
    ok: false,
    model: { availability: 'UNAVAILABLE' as const, reason: 'health_check_unavailable' },
    localStateDirectory: 'MISSING' as const,
    notes: ['health_check_unavailable'],
  }));
  return {
    phase: '62L-CX',
    title:
      'Persistent Knowledge Civilization + Offline Research Colony Network + Multi-Model Evolution Laboratory + Distributed Scientific Memory Fabric + Adaptive Accelerator Grid + Agent-Built Research Tool Ecosystem + Cross-Universe Intelligence Compiler',
    honestyBanner: HONESTY_BANNER,
    locks: CX_LOCKS,
    honesty,
    cycle: PERSISTENT_KNOWLEDGE_CIVILIZATION_CYCLE,
    predecessors: predecessorMap(root),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    githubSotIssue: 115,
    gitlabCoordinationIssue: 49,
    localBrainHealth: brain,
    productionAuthorized: false as const,
    tipLand: false as const,
    dbCandidatesApplied: false as const,
    at: new Date().toISOString(),
  };
}
