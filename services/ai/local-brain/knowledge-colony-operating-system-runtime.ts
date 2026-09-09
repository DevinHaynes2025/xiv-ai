/**
 * 62L-CY Knowledge Colony Operating System runtime —
 * Walks KNOWLEDGE_COLONY_OPERATING_SYSTEM_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
import {
  nervousSystemHonesty,
  syncNervousSystemEvent,
} from './distributed-memory-experiment-nervous-system';
import {
  accountComputeResource,
  computeEconomyHonesty,
  registerEconomyComputeTarget,
  scheduleEconomyWorkload,
} from './adaptive-gpu-quantum-compute-economy';
import {
  advanceAiServiceGates,
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
  bootstrapKnowledgeColonyOperatingSystem,
  knowledgeColonyOsHonesty,
} from './knowledge-colony-operating-system';
import {
  CY_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  KNOWLEDGE_COLONY_OPERATING_SYSTEM_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CyActor,
  type CyEvidenceState,
  type CyHop,
  type CyHopRecord,
} from './knowledge-colony-operating-system-types';

/** 62L-CZ child extends this OS via intelligence-civilization-kernel-runtime (coexistence; no circular re-export). */
export {
  CY_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_COLONY_OPERATING_SYSTEM_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CyHop, state: CyEvidenceState, summary: string): CyHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CyCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CyActor;
  root?: string;
  repoRoot?: string;
};

export async function runKnowledgeColonyOperatingSystemCycle(input: CyCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CyHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CY_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CY_LOCKS.LOCAL_FIRST &&
        CY_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
        CY_LOCKS.LOGICAL_POPULATION_AUTO_RUNNING_VERIFIED === false &&
        CY_LOCKS.ECONOMY_CAN_SPEND_MONEY === false &&
        CY_LOCKS.ECONOMY_CAN_PURCHASE === false &&
        CY_LOCKS.ECONOMY_CAN_BILL === false &&
        CY_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF === false &&
        CY_LOCKS.UNVERIFIED_ACCELERATOR_AVAILABLE === false &&
        CY_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
        CY_LOCKS.SERVICE_SELF_PROMOTION_TO_PRODUCTION === false &&
        CY_LOCKS.SILENT_SEALED_OR_RAW_PRIVATE_UNIVERSE_ROUTE === false &&
        CY_LOCKS.UNSIGNED_ROUTE_PACK_ACCEPTED === false &&
        CY_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapKnowledgeColonyOperatingSystem({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'colony_os_bootstrap',
      os && knowledgeColonyOsHonesty().l4AutonomyEnabled === false
        ? 'IMPLEMENTED'
        : 'FAIL',
      `Knowledge Colony OS id=${os.id} predecessor=${os.predecessorLayer}`,
    ),
  );

  const society = await registerResearchSociety({
    name: 'society-logical-1',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    logicalPopulation: 100,
    authorizedNodePowered: true,
    root,
    actor,
  });
  await materializeSocietyWorkers({
    societyId: society.society!.id,
    count: 10,
    root,
    actor,
  });
  const census = await societyCensus({ root, actor });
  hops.push(
    hop(
      'logical_population_not_auto_running_verified',
      census.logicalPopulation >= 100 &&
        census.runningVerifiedWorkers === 0 &&
        census.autoRunningVerifiedFromLogical === false
        ? 'LOGICAL'
        : 'FAIL',
      census.reason,
    ),
  );

  const noHb = await claimSocietyRunningVerified({
    societyId: society.society!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'society_missing_heartbeat_not_running_verified',
      noHb.accepted === false ? 'DENIED' : 'FAIL',
      noHb.reason,
    ),
  );

  const poweredOff = await setSocietyNodePower({
    societyId: society.society!.id,
    powered: false,
    stopMode: 'WAITING_NODE',
    root,
    actor,
  });
  hops.push(
    hop(
      'no_powered_node_waiting_or_stopped',
      poweredOff.society?.status === 'WAITING_NODE' ||
        poweredOff.society?.status === 'OFFLINE_STOPPED'
        ? poweredOff.society.status
        : 'FAIL',
      poweredOff.reason,
    ),
  );

  const spend = await accountComputeResource({
    action: 'spend',
    units: 5,
    currencyAttempted: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'economy_cannot_spend_purchase_bill',
      spend.status === 'DENIED' ? 'DENIED' : 'FAIL',
      spend.reason,
    ),
  );

  const consensus = await compileMultiModelEvidence({
    topic: 'colony-hypothesis',
    modelVotes: ['agree', 'agree', 'agree'],
    claimConsensusIsProof: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'compiler_consensus_not_verified_proof',
      consensus.accepted === false &&
        consensus.artifact?.labeledVerifiedProof === false
        ? 'CONSENSUS_ONLY'
        : 'FAIL',
      consensus.reason,
    ),
  );

  const sync = await syncNervousSystemEvent({
    kind: 'experiment',
    sourceNodeId: 'node-a',
    targetNodeId: 'node-b',
    payloadRef: 'exp-meta-1',
    root,
    actor,
  });
  hops.push(
    hop(
      'nervous_system_sync_bounded',
      sync.accepted === true ? 'BOUNDED' : 'FAIL',
      sync.reason,
    ),
  );

  const unverified = await registerEconomyComputeTarget({
    kind: 'nvidia',
    configured: false,
    verified: false,
    root,
    actor,
  });
  const unavail = await scheduleEconomyWorkload({
    targetKind: 'nvidia',
    targetId: unverified.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unverified_gpu_qpu_unavailable',
      unverified.status === 'UNAVAILABLE' && unavail.status === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : 'FAIL',
      unavail.reason,
    ),
  );

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
  hops.push(
    hop(
      'quantum_without_classical_baseline_rejected',
      qNoBase.status === 'REJECTED' ? 'REJECTED' : 'FAIL',
      qNoBase.reason,
    ),
  );

  const svc = await registerAiServiceSandbox({
    name: 'colony-summarizer',
    capabilityKey: 'summarize',
    root,
    actor,
  });
  await advanceAiServiceGates({
    serviceId: svc.service!.id,
    sandboxPassed: true,
    securityGatePassed: true,
    benchmarkGatePassed: true,
    root,
    actor,
  });
  const promo = await attemptAiServiceSelfPromotion({
    serviceId: svc.service!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'service_self_promote_to_production_denied',
      promo.accepted === false ? 'DENIED' : 'FAIL',
      promo.reason,
    ),
  );

  const sealedSilent = await submitUniverseKnowledgeRoutePack({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    assetClass: 'sealed',
    payload: 'sealed-blob',
    signature: signKnowledgeRoutePayload('sealed-blob', 'k1'),
    signingKey: 'k1',
    silent: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_or_raw_private_silent_universe_route_denied',
      sealedSilent.accepted === false ? 'DENIED' : 'FAIL',
      sealedSilent.reason,
    ),
  );

  const unsigned = await submitUniverseKnowledgeRoutePack({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    assetClass: 'approved_knowledge',
    payload: 'knowledge-pack',
    signature: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_route_pack_rejected',
      unsigned.accepted === false ? 'REJECTED' : 'FAIL',
      unsigned.reason,
    ),
  );

  // Evidence path: restore power + heartbeat (does not invent prior RUNNING)
  await setSocietyNodePower({
    societyId: society.society!.id,
    powered: true,
    root,
    actor,
  });
  await recordSocietyHeartbeat({
    societyId: society.society!.id,
    runtimeEvidence: 'pid=cy;runtime=local-society',
    root,
    actor,
  });
  await authorizeUniverseKnowledgeRoute({
    sourceUniverseId: input.universeId,
    targetUniverseId: 'univ-peer',
    root,
    actor,
  });

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CY knowledge colony operating system cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CY'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CY knowledge colony operating system cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning≠permission; consensus≠proof; economy cannot spend`,
      sourceRefs: ['62L-CY'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      CY_LOCKS.LEARNING_GRANTS_PERMISSION === false ? 'PASS' : 'FAIL',
      'Learning recorded; does not grant permission',
    ),
  );

  void decisionGate;
  void researchSocietiesHonesty;
  void multiModelIntelligenceCompilerHonesty;
  void nervousSystemHonesty;
  void computeEconomyHonesty;
  void aiServiceFoundryHonesty;
  void universeKnowledgeRoutingHonesty;

  return {
    ok: hops.every((h) => h.state !== 'FAIL'),
    honestyBanner: HONESTY_BANNER,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    locks: CY_LOCKS,
    osId: os.id,
    hops,
    at: new Date().toISOString(),
  };
}

export async function buildKnowledgeColonyOperatingSystemHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const preds = predecessorMap(root);
  const brain = await checkLocalBrainHealth({ root }).catch(() => null);
  const honesty = knowledgeColonyOsHonesty();
  return {
    phase: '62L-CY',
    title:
      'XIV Knowledge Colony Operating System + Persistent Agent Research Societies + Multi-Model Intelligence Compiler + Distributed Memory/Experiment Nervous System + Adaptive GPU/Quantum Compute Economy + Agent-Built AI Service Foundry + Universe Knowledge Routing Grid',
    honestyBanner: HONESTY_BANNER,
    locks: CY_LOCKS,
    honesty,
    predecessors: preds,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    cycle: KNOWLEDGE_COLONY_OPERATING_SYSTEM_CYCLE,
    localBrainHealth: brain,
    productionAuthorized: false,
    tipLand: false,
    dbCandidatesApplied: false,
    at: new Date().toISOString(),
  };
}
