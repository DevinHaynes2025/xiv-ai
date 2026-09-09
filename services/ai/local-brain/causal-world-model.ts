import { retrieveEvidencePathway } from './cortex-evidence';
import { listKnowledgePacks } from './knowledge-packs';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  CAUSAL_WORLD_LOCKS,
  CORRELATION_IS_NOT_CAUSATION,
  type EpistemicClass,
} from './causal-world-types';

export type WorldModelQuery = {
  id: string;
  tenantId: string;
  universeId: string;
  question: string;
  evidenceRefs: string[];
  knowledgePackIds: string[];
  evidenceState: 'AVAILABLE' | 'WAITING_DATA' | 'UNAVAILABLE';
  inventedFacts: false;
  epistemicClass: 'UNKNOWN';
  isVerifiedFact: false;
  reason: string;
  createdAt: string;
};

export type CausalHypothesis = {
  id: string;
  tenantId: string;
  universeId: string;
  queryId: string;
  mechanism: string;
  confounders: string[];
  correlationNote: typeof CORRELATION_IS_NOT_CAUSATION;
  epistemicClass: 'HYPOTHESIS';
  isCausation: false;
  isVerifiedFact: false;
  competingGroupId: string;
  evidenceRefs: string[];
  createdAt: string;
};

type Store = { queries: WorldModelQuery[]; hypotheses: CausalHypothesis[] };

function storePath(root: string) {
  return xivLocalPath(root, 'causal-world-model.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { queries: [], hypotheses: [] });
  return {
    queries: Array.isArray(parsed.queries) ? parsed.queries : [],
    hypotheses: Array.isArray(parsed.hypotheses) ? parsed.hypotheses : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    queries: store.queries.slice(-2_000),
    hypotheses: store.hypotheses.slice(-4_000),
  });
}

export async function queryWorldModel(input: {
  tenantId: string;
  universeId: string;
  question: string;
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  root?: string;
}): Promise<WorldModelQuery> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.question.trim()) throw new Error('WORLD_MODEL_QUESTION_REQUIRED');
  const root = input.root ?? process.cwd();
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.question,
    needsExternalFreshness: input.needsExternalFreshness,
    needsCloudProvider: input.needsCloudProvider,
    root,
  });
  const packs = await listKnowledgePacks({ tenantId: input.tenantId, universeId: input.universeId, root });
  const matchingPacks = packs.filter((pack) =>
    `${pack.title} ${pack.domain}`.toLowerCase().includes(input.question.trim().toLowerCase().split(/\s+/)[0] ?? ''),
  );
  const query: WorldModelQuery = {
    id: cortexId('wmq'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question.trim(),
    evidenceRefs: evidence.evidenceRefs,
    knowledgePackIds: matchingPacks.map((pack) => pack.id),
    evidenceState: evidence.state,
    inventedFacts: false,
    epistemicClass: 'UNKNOWN',
    isVerifiedFact: false,
    reason: `${evidence.reason} World-model query is retrieval, not a verified causal claim.`,
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.queries.push(query);
  await save(root, store);
  return query;
}

export async function generateCompetingCausalHypotheses(input: {
  tenantId: string;
  universeId: string;
  queryId: string;
  subject: string;
  root?: string;
}): Promise<CausalHypothesis[]> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.subject.trim()) throw new Error('CAUSAL_SUBJECT_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const query = store.queries.find(
    (item) => item.id === input.queryId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!query) throw new Error('WORLD_MODEL_QUERY_NOT_FOUND');

  const groupId = cortexId('hgroup');
  const templates: Array<{ mechanism: string; confounders: string[] }> = [
    {
      mechanism: `Direct-path hypothesis: a change in ${input.subject} causes the observed downstream metric via an identified local mechanism.`,
      confounders: ['unmeasured demand shock', 'shared seasonality'],
    },
    {
      mechanism: `Common-cause hypothesis: a confounder jointly moves ${input.subject} and the metric; the association is correlational.`,
      confounders: ['macro regime', 'reporting lag', 'selection into the sample'],
    },
    {
      mechanism: `Reverse-path / collider hypothesis: the metric or a downstream control influences measured ${input.subject}.`,
      confounders: ['collider stratification', 'feedback control policy'],
    },
  ];

  const created: CausalHypothesis[] = templates.map((template) => ({
    id: cortexId('hyp'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    queryId: query.id,
    mechanism: template.mechanism,
    confounders: template.confounders,
    correlationNote: CORRELATION_IS_NOT_CAUSATION,
    epistemicClass: 'HYPOTHESIS' as const,
    isCausation: false as const,
    isVerifiedFact: false as const,
    competingGroupId: groupId,
    evidenceRefs: query.evidenceRefs,
    createdAt: new Date().toISOString(),
  }));

  store.hypotheses.push(...created);
  await save(root, store);
  return created;
}

export async function listCausalHypotheses(input: {
  tenantId: string;
  universeId: string;
  queryId?: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.hypotheses.filter(
    (item) =>
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId &&
      (!input.queryId || item.queryId === input.queryId),
  );
}

export function hypothesisCannotBecomeFactBySimulation(hypothesis: CausalHypothesis): boolean {
  return hypothesis.epistemicClass === 'HYPOTHESIS' && hypothesis.isCausation === false && hypothesis.isVerifiedFact === false;
}

export function assertNotVerifiedFact(epistemicClass: EpistemicClass) {
  return epistemicClass !== 'VERIFIED_FACT' && CAUSAL_WORLD_LOCKS.forecastIsVerifiedFact === false;
}
