import { cortexId } from './cortex-store';
import { retrieveEvidencePathway } from './cortex-evidence';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import { strengthenCortexPathway } from './memory-cortex';
import {
  AUTONOMOUS_RD_CYCLE,
  RESEARCH_HONESTY,
  type AutonomousRdStep,
  type EvidenceState,
  type KnowledgeGap,
  type ResearchHypothesis,
} from './autonomous-research-types';
import { predecessorMap, refuseSealedReplication } from './research-authority';
import { proposeExperimentCandidates, runOfflineExperiment, type OfflineExperimentRun } from './offline-experiment-factory';
import { replicateIndependently } from './independent-replication';
import {
  challengeCausation,
  evaluateAb,
  measureDiscoveryQuality,
  promoteExperimentEvidence,
  reviewAsSkeptic,
} from './discovery-intelligence';
import { wrapResearchCivilization } from './research-domain-cells';

export { AUTONOMOUS_RD_CYCLE, RESEARCH_HONESTY, EVIDENCE_STATES } from './autonomous-research-types';

export type ResearchDirector = {
  id: string;
  tenantId: string;
  universeId: string;
  cycle: typeof AUTONOMOUS_RD_CYCLE;
  l4AutonomyEnabled: false;
  claimsConsciousness: false;
  canFabricateFounderApproval: false;
  productionAuthorization: false;
  tradingAuthorized: false;
  boundedToOfflineExperiments: true;
};

export function createResearchDirector(input: { tenantId: string; universeId: string }): ResearchDirector {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  return {
    id: cortexId('rd'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    cycle: AUTONOMOUS_RD_CYCLE,
    l4AutonomyEnabled: false,
    claimsConsciousness: false,
    canFabricateFounderApproval: false,
    productionAuthorization: false,
    tradingAuthorized: false,
    boundedToOfflineExperiments: true,
  };
}

export async function detectKnowledgeGap(input: {
  tenantId: string;
  universeId: string;
  question: string;
  needsExternalFreshness?: boolean;
  root?: string;
}): Promise<KnowledgeGap> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.question.trim()) throw new Error('KNOWLEDGE_GAP_QUESTION_REQUIRED');
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.question,
    needsExternalFreshness: input.needsExternalFreshness,
    root: input.root,
  });
  const unknownCount = evidence.evidenceRefs.length === 0 ? 1 : 0;
  const state: EvidenceState = evidence.state === 'WAITING_DATA'
    ? 'WAITING_DATA'
    : evidence.state === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : unknownCount > 0
        ? 'UNKNOWN'
        : 'PASS';
  return {
    id: cortexId('gap'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question.trim().slice(0, 240),
    unknownCount,
    evidenceRefs: evidence.evidenceRefs,
    state,
    inventedFacts: false,
  };
}

export function mintResearchHypotheses(input: {
  tenantId: string;
  universeId: string;
  gap: KnowledgeGap;
}): ResearchHypothesis[] {
  const primary: ResearchHypothesis = {
    id: cortexId('hyp0'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    gapId: input.gap.id,
    statement: `Primary: a local offline experiment can reduce uncertainty about "${input.gap.question}".`,
    role: 'primary',
    competingWith: [],
    evidenceRefs: [...input.gap.evidenceRefs],
    inventedFacts: false,
  };
  const challenge: ResearchHypothesis = {
    id: cortexId('hyp1'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    gapId: input.gap.id,
    statement: `Challenge: the opposite of "${input.gap.question}" remains possible; local evidence may be incomplete.`,
    role: 'challenge',
    competingWith: [],
    evidenceRefs: [...input.gap.evidenceRefs],
    inventedFacts: false,
  };
  const nullHypothesis: ResearchHypothesis = {
    id: cortexId('hyp2'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    gapId: input.gap.id,
    statement: 'Null: local evidence is insufficient; the honest state is UNKNOWN until sourced facts exist.',
    role: 'null',
    competingWith: [],
    evidenceRefs: [...input.gap.evidenceRefs],
    inventedFacts: false,
  };
  primary.competingWith = [challenge.id, nullHypothesis.id];
  challenge.competingWith = [primary.id, nullHypothesis.id];
  nullHypothesis.competingWith = [primary.id, challenge.id];
  return [primary, challenge, nullHypothesis];
}

function projectWorldModel(input: {
  tenantId: string;
  universeId: string;
  qualityScore: number;
  replicatedPass: boolean;
}) {
  const predecessors = predecessorMap();
  if (predecessors['62L-AH'] === 'WAITING_DATA') {
    return {
      state: 'WAITING_DATA' as const,
      module: '62L-AH' as const,
      reason: 'Causal World Model + Digital Twins are not on this child tree. No twin was invented.',
      isReality: false as const,
      inventedDiscovery: false as const,
      digitalTwinVerified: false as const,
      qualityScore: input.qualityScore,
      replicatedPass: input.replicatedPass,
      tenantId: input.tenantId,
      universeId: input.universeId,
    };
  }
  return {
    state: input.replicatedPass ? 'UNKNOWN' as const : 'UNKNOWN' as const,
    module: '62L-AH' as const,
    reason: 'World-model module is present but simulation still is not verified fact.',
    isReality: false as const,
    inventedDiscovery: false as const,
    digitalTwinVerified: false as const,
    qualityScore: input.qualityScore,
    replicatedPass: input.replicatedPass,
    tenantId: input.tenantId,
    universeId: input.universeId,
  };
}

export async function runAutonomousResearchCycle(input: {
  tenantId: string;
  universeId: string;
  question: string;
  softwareCwd?: string;
  sealedPayload?: unknown;
  needsExternalFreshness?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.question.trim()) throw new Error('RESEARCH_QUESTION_REQUIRED');
  const root = input.root ?? process.cwd();
  const steps: AutonomousRdStep[] = [...AUTONOMOUS_RD_CYCLE];
  const director = createResearchDirector({ tenantId: input.tenantId, universeId: input.universeId });
  const predecessors = predecessorMap();

  const sealed = refuseSealedReplication(input.sealedPayload ?? {});
  const gap = await detectKnowledgeGap({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    needsExternalFreshness: input.needsExternalFreshness,
    root,
  });
  const priorEvidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.question,
    needsExternalFreshness: input.needsExternalFreshness,
    root,
  });
  const hypotheses = mintResearchHypotheses({ tenantId: input.tenantId, universeId: input.universeId, gap });
  const candidates = await proposeExperimentCandidates({
    tenantId: input.tenantId,
    universeId: input.universeId,
    gapId: gap.id,
    hypotheses,
    softwareCwd: input.softwareCwd,
    root,
  });

  const preferredKind = input.softwareCwd ? 'software' : 'data';
  const chosen = candidates.find((item) => item.eligible && item.kind === preferredKind)
    ?? candidates.find((item) => item.eligible)
    ?? candidates[0];
  if (!chosen) throw new Error('NO_EXPERIMENT_CANDIDATES');

  const civilization = await wrapResearchCivilization({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    hypothesis: hypotheses[0]?.statement ?? input.question,
    root,
  });

  const primary: OfflineExperimentRun = sealed.allowed
    ? await runOfflineExperiment({
      tenantId: input.tenantId,
      universeId: input.universeId,
      candidate: chosen,
      softwareCwd: input.softwareCwd,
      replicaLane: 'primary',
      root,
    })
    : await runOfflineExperiment({
      tenantId: input.tenantId,
      universeId: input.universeId,
      candidate: chosen,
      softwareCwd: input.softwareCwd,
      sealedPayload: input.sealedPayload,
      replicaLane: 'primary',
      root,
    });

  const replication = await replicateIndependently({
    tenantId: input.tenantId,
    universeId: input.universeId,
    original: primary,
    candidate: chosen,
    softwareCwd: input.softwareCwd,
    root,
  });

  const skeptic = await reviewAsSkeptic({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    run: primary,
    replication,
    root,
  });
  const causal = challengeCausation({
    tenantId: input.tenantId,
    universeId: input.universeId,
    claim: `${input.question} caused the measured outcome`,
    onlyCorrelation: true,
    fromSimulation: chosen.kind === 'simulation',
  });
  const abAlt = candidates.find((item) => item.eligible && item.id !== chosen.id && item.kind === chosen.kind);
  const abRun = abAlt
    ? await runOfflineExperiment({
      tenantId: input.tenantId,
      universeId: input.universeId,
      candidate: abAlt,
      softwareCwd: input.softwareCwd,
      replicaLane: 'primary',
      root,
    })
    : null;
  const ab = abRun
    ? evaluateAb({
      tenantId: input.tenantId,
      universeId: input.universeId,
      a: primary.measurement,
      b: abRun.measurement,
    })
    : evaluateAb({
      tenantId: input.tenantId,
      universeId: input.universeId,
      a: primary.measurement,
      b: replication.measurementAgreed ? primary.measurement : { ...primary.measurement, id: cortexId('ab-b'), value: primary.measurement.value, evidenceState: replication.replicaState },
    });

  const quality = measureDiscoveryQuality({
    run: primary,
    replication,
    skeptic,
    causal,
  });
  const promotion = await promoteExperimentEvidence({
    tenantId: input.tenantId,
    universeId: input.universeId,
    text: `Local offline result for: ${input.question}`,
    run: primary,
    replication,
    quality,
    root,
  });
  const worldModel = projectWorldModel({
    tenantId: input.tenantId,
    universeId: input.universeId,
    qualityScore: quality.score,
    replicatedPass: replication.evidenceState === 'PASS',
  });

  const learning = await appendLearning({
    domain: 'science',
    subject: `autonomous-rd:${director.id}`,
    claimState: promotion.promoted ? 'MODEL_INFERENCE' : 'UNKNOWN',
    summary: `gap=${gap.state}; experiment=${primary.evidenceState}; replica=${replication.evidenceState}; world=${worldModel.state}; inventedDiscovery=false`,
    sourceRefs: [...gap.evidenceRefs, ...primary.measurement.evidenceRefs],
    evidence: [primary.id, replication.id],
    confidence: quality.score,
  }, root);

  const memory = await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'world',
    kind: 'lesson',
    claimState: 'MODEL_INFERENCE',
    label: `Research director: ${input.question.slice(0, 72)}`,
    summary: `cycle complete; L4=false; sim≠fact; correlation≠causation`,
    evidenceRefs: [`learn:${learning.id}`, ...primary.measurement.evidenceRefs],
    sourceRefs: [director.id],
    pathwayStrength: 0.4,
    retentionClass: 'durable',
    root,
  });
  if (gap.evidenceRefs[0]) {
    await strengthenCortexPathway({
      id: memory.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      delta: 0.05,
      root,
    }).catch(() => memory);
  }

  const next = candidates.find((item) => item.eligible && item.id !== chosen.id && !item.blockedByDeadEnd) ?? null;

  return {
    steps,
    director,
    gap,
    priorEvidence,
    hypotheses,
    candidates,
    chosen,
    primary,
    replication,
    skeptic,
    causal,
    ab,
    quality,
    promotion,
    worldModel,
    learning,
    nextExperiment: next
      ? { candidateId: next.id, kind: next.kind, title: next.title, blockedByDeadEnd: next.blockedByDeadEnd }
      : { candidateId: null, kind: null, title: 'No further eligible local experiment without repeating a dead end.', blockedByDeadEnd: false },
    civilization,
    predecessors,
    honesty: RESEARCH_HONESTY,
    sealedFence: sealed,
    productionAuthorization: false as const,
    inventedPass: false as const,
    inventedDiscovery: false as const,
  };
}
