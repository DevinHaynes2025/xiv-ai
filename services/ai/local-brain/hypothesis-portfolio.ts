import { retrieveEvidencePathway } from './cortex-evidence';
import { generateCompetingCausalHypotheses, queryWorldModel } from './causal-world-model';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { HYPOTHESIS_IS_NOT_FACT, type EvidenceState } from './discovery-invention-types';
import { predecessorMap } from './discovery-predecessors';

export type PortfolioHypothesis = {
  id: string;
  tenantId: string;
  universeId: string;
  gapId: string;
  statement: string;
  role: 'primary' | 'challenge' | 'null' | 'causal_competitor';
  competingWith: string[];
  evidenceRefs: string[];
  epistemicClass: 'HYPOTHESIS';
  isFact: false;
  isCausation: false;
  isVerifiedFact: false;
  priorKnowledgeState: EvidenceState;
  opportunityScore: number;
  opportunityIsFact: false;
  inventedFacts: false;
};

export type HypothesisPortfolio = {
  id: string;
  tenantId: string;
  universeId: string;
  gapId: string;
  items: PortfolioHypothesis[];
  hypothesisEqualsFact: false;
  note: typeof HYPOTHESIS_IS_NOT_FACT;
};

export type KnowledgeGap = {
  id: string;
  tenantId: string;
  universeId: string;
  question: string;
  unknownCount: number;
  evidenceRefs: string[];
  state: EvidenceState;
  inventedFacts: false;
};

type Store = { portfolios: HypothesisPortfolio[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'hypothesis-portfolios.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { portfolios: [] });
  return Array.isArray(parsed.portfolios) ? parsed.portfolios : [];
}

async function save(root: string, portfolios: HypothesisPortfolio[]) {
  await writeJsonFileAtomic(pathFor(root), { portfolios: portfolios.slice(-4_000) });
}

export async function detectDiscoveryGap(input: {
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
        : 'UNKNOWN';
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

export async function checkPriorKnowledge(input: {
  tenantId: string;
  universeId: string;
  question: string;
  root?: string;
}) {
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.question,
    root: input.root,
  });
  return {
    state: (evidence.state === 'WAITING_DATA' ? 'WAITING_DATA' : evidence.evidenceRefs.length ? 'UNKNOWN' : 'UNKNOWN') as EvidenceState,
    evidenceRefs: evidence.evidenceRefs,
    inventedFacts: false as const,
    isVerifiedFact: false as const,
    researchDirector: predecessorMap()['62L-AI'],
    knowledgeLake: predecessorMap()['62L-AB'],
  };
}

export function scoreOpportunity(input: {
  valueScore: number;
  riskScore: number;
  priorUnknown: boolean;
}): { score: number; opportunityIsFact: false; isVerifiedFact: false } {
  const raw = Math.max(0, Math.min(1, input.valueScore)) - Math.max(0, Math.min(1, input.riskScore));
  const score = input.priorUnknown ? Math.max(0, raw) * 0.5 : Math.max(0, raw);
  return { score, opportunityIsFact: false, isVerifiedFact: false };
}

export async function mintHypothesisPortfolio(input: {
  tenantId: string;
  universeId: string;
  gap: KnowledgeGap;
  root?: string;
}): Promise<HypothesisPortfolio> {
  const root = input.root ?? process.cwd();
  const prior = await checkPriorKnowledge({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.gap.question,
    root,
  });
  const opportunity = scoreOpportunity({
    valueScore: 0.6,
    riskScore: 0.2,
    priorUnknown: input.gap.unknownCount > 0,
  });

  const primary: PortfolioHypothesis = {
    id: cortexId('hyp0'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    gapId: input.gap.id,
    statement: `Primary: a local governed experiment can reduce uncertainty about "${input.gap.question}". ${HYPOTHESIS_IS_NOT_FACT}`,
    role: 'primary',
    competingWith: [],
    evidenceRefs: [...input.gap.evidenceRefs, ...prior.evidenceRefs],
    epistemicClass: 'HYPOTHESIS',
    isFact: false,
    isCausation: false,
    isVerifiedFact: false,
    priorKnowledgeState: prior.state,
    opportunityScore: opportunity.score,
    opportunityIsFact: false,
    inventedFacts: false,
  };
  const challenge: PortfolioHypothesis = {
    id: cortexId('hyp1'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    gapId: input.gap.id,
    statement: `Challenge: the opposite of "${input.gap.question}" remains possible; observed co-occurrence may be confounding.`,
    role: 'challenge',
    competingWith: [],
    evidenceRefs: [...input.gap.evidenceRefs],
    epistemicClass: 'HYPOTHESIS',
    isFact: false,
    isCausation: false,
    isVerifiedFact: false,
    priorKnowledgeState: prior.state,
    opportunityScore: opportunity.score * 0.8,
    opportunityIsFact: false,
    inventedFacts: false,
  };
  const nullHypothesis: PortfolioHypothesis = {
    id: cortexId('hyp2'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    gapId: input.gap.id,
    statement: 'Null: local evidence is insufficient; the honest state is UNKNOWN until sourced facts exist.',
    role: 'null',
    competingWith: [],
    evidenceRefs: [...input.gap.evidenceRefs],
    epistemicClass: 'HYPOTHESIS',
    isFact: false,
    isCausation: false,
    isVerifiedFact: false,
    priorKnowledgeState: prior.state,
    opportunityScore: 0,
    opportunityIsFact: false,
    inventedFacts: false,
  };

  const causalCompetitors: PortfolioHypothesis[] = [];
  if (predecessorMap()['62L-AH'] === 'AVAILABLE') {
    const query = await queryWorldModel({
      tenantId: input.tenantId,
      universeId: input.universeId,
      question: input.gap.question,
      root,
    });
    const causal = await generateCompetingCausalHypotheses({
      tenantId: input.tenantId,
      universeId: input.universeId,
      queryId: query.id,
      subject: input.gap.question,
      root,
    });
    for (const item of causal) {
      causalCompetitors.push({
        id: item.id,
        tenantId: input.tenantId,
        universeId: input.universeId,
        gapId: input.gap.id,
        statement: `${item.mechanism} ${item.correlationNote}`,
        role: 'causal_competitor',
        competingWith: [],
        evidenceRefs: item.evidenceRefs,
        epistemicClass: 'HYPOTHESIS',
        isFact: false,
        isCausation: false,
        isVerifiedFact: false,
        priorKnowledgeState: prior.state,
        opportunityScore: opportunity.score * 0.4,
        opportunityIsFact: false,
        inventedFacts: false,
      });
    }
  }

  const items = [primary, challenge, nullHypothesis, ...causalCompetitors];
  for (const item of items) {
    item.competingWith = items.filter((other) => other.id !== item.id).map((other) => other.id);
  }

  const portfolio: HypothesisPortfolio = {
    id: cortexId('hport'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    gapId: input.gap.id,
    items,
    hypothesisEqualsFact: false,
    note: HYPOTHESIS_IS_NOT_FACT,
  };
  const store = await load(root);
  store.push(portfolio);
  await save(root, store);
  return portfolio;
}

export function hypothesisCannotBecomeFact(item: PortfolioHypothesis): boolean {
  return item.epistemicClass === 'HYPOTHESIS' && item.isFact === false && item.isVerifiedFact === false;
}
