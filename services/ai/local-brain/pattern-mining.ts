import { retrieveEvidencePathway } from './cortex-evidence';
import { learnAcrossIndustries } from './historical-industry-learning';
import { addKnowledgeEdge, upsertKnowledgeNode } from './knowledge-graph';
import { listNetworkEntities } from './supply-network-twins';
import { probeInformationSupplyChain, probeKnowledgeLake } from './sc-traceability';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  HYPOTHESIS_IS_NOT_FACT,
  PATTERN_IS_NOT_CAUSATION,
  type DiscoveryEpistemicClass,
  type EvidenceState,
} from './discovery-invention-types';
import { predecessorMap } from './discovery-predecessors';

export type MinedPattern = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: 'historical' | 'supply_chain' | 'information_supply' | 'scientific' | 'technology_convergence' | 'cross_domain_analogy';
  statement: string;
  domains: string[];
  evidenceRefs: string[];
  epistemicClass: 'PATTERN';
  isCausation: false;
  isVerifiedFact: false;
  correlationNote: typeof PATTERN_IS_NOT_CAUSATION;
  evidenceState: EvidenceState;
  inventedFacts: false;
  createdAt: string;
};

type Store = { patterns: MinedPattern[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'discovery-patterns.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { patterns: [] });
  return Array.isArray(parsed.patterns) ? parsed.patterns : [];
}

async function save(root: string, patterns: MinedPattern[]) {
  await writeJsonFileAtomic(pathFor(root), { patterns: patterns.slice(-8_000) });
}

function cannotPromotePatternToFact(epistemicClass: DiscoveryEpistemicClass) {
  if (epistemicClass === 'VERIFIED_FACT') throw new Error('PATTERN_CANNOT_SELF_CERTIFY_AS_FACT');
  return true;
}

async function persist(pattern: MinedPattern, root: string) {
  cannotPromotePatternToFact(pattern.epistemicClass);
  const existing = await load(root);
  existing.push(pattern);
  await save(root, existing);
  return pattern;
}

export async function mineHistoricalPatterns(input: {
  tenantId: string;
  universeId: string;
  question: string;
  root?: string;
}): Promise<MinedPattern> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const lesson = await learnAcrossIndustries({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    domains: ['history', 'business', 'economics', 'science'],
    root,
  });
  const evidenceState: EvidenceState = lesson.state === 'WAITING_DATA'
    ? 'WAITING_DATA'
    : lesson.state === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : lesson.evidenceRefs.length
        ? 'UNKNOWN'
        : 'UNKNOWN';
  return persist({
    id: cortexId('pat-hist'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'historical',
    statement: `Historical co-occurrence candidate for "${input.question}". ${PATTERN_IS_NOT_CAUSATION}`,
    domains: lesson.domainsConsulted,
    evidenceRefs: lesson.evidenceRefs,
    epistemicClass: 'PATTERN',
    isCausation: false,
    isVerifiedFact: false,
    correlationNote: PATTERN_IS_NOT_CAUSATION,
    evidenceState,
    inventedFacts: false,
    createdAt: new Date().toISOString(),
  }, root);
}

export async function mineSupplyChainPatterns(input: {
  tenantId: string;
  universeId: string;
  question: string;
  root?: string;
}): Promise<MinedPattern> {
  const root = input.root ?? process.cwd();
  const predecessors = predecessorMap();
  const entities = predecessors['62L-AO'] === 'AVAILABLE'
    ? await listNetworkEntities({ tenantId: input.tenantId, universeId: input.universeId, root })
    : [];
  const evidenceState: EvidenceState = predecessors['62L-AO'] === 'WAITING_DATA'
    ? 'WAITING_DATA'
    : entities.length
      ? 'UNKNOWN'
      : 'UNKNOWN';
  return persist({
    id: cortexId('pat-sc'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'supply_chain',
    statement: `Supply-network co-movement candidate among ${entities.length} governed twins for "${input.question}". ${PATTERN_IS_NOT_CAUSATION} Twin ≠ warehouse control.`,
    domains: ['supply_chain'],
    evidenceRefs: entities.slice(0, 8).map((entity) => entity.id),
    epistemicClass: 'PATTERN',
    isCausation: false,
    isVerifiedFact: false,
    correlationNote: PATTERN_IS_NOT_CAUSATION,
    evidenceState,
    inventedFacts: false,
    createdAt: new Date().toISOString(),
  }, root);
}

export async function mineInformationSupplyPatterns(input: {
  tenantId: string;
  universeId: string;
  question: string;
  root?: string;
}): Promise<MinedPattern> {
  const root = input.root ?? process.cwd();
  const am = probeInformationSupplyChain();
  const lake = probeKnowledgeLake();
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.question,
    root,
  });
  const evidenceState: EvidenceState = am.state === 'WAITING_DATA' || lake.state === 'WAITING_DATA'
    ? 'WAITING_DATA'
    : evidence.state === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : 'UNKNOWN';
  return persist({
    id: cortexId('pat-info'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'information_supply',
    statement: `Information-supply-chain discovery candidate for "${input.question}". AM modulePresent=${am.modulePresent}. ${PATTERN_IS_NOT_CAUSATION}`,
    domains: ['technology', 'supply_chain'],
    evidenceRefs: evidence.evidenceRefs,
    epistemicClass: 'PATTERN',
    isCausation: false,
    isVerifiedFact: false,
    correlationNote: PATTERN_IS_NOT_CAUSATION,
    evidenceState,
    inventedFacts: false,
    createdAt: new Date().toISOString(),
  }, root);
}

export async function mineScientificRelationshipCandidates(input: {
  tenantId: string;
  universeId: string;
  question: string;
  root?: string;
}): Promise<MinedPattern> {
  const root = input.root ?? process.cwd();
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.question,
    root,
  });
  const from = await upsertKnowledgeNode({
    id: cortexId('sci-a'),
    type: 'concept',
    domain: 'science',
    label: `candidate-a:${input.question.slice(0, 80)}`,
    summary: 'Scientific relationship candidate endpoint A. Not a verified mechanism.',
    claimState: 'MODEL_INFERENCE',
    sourceRefs: evidence.evidenceRefs,
    classification: 'internal',
  }, root);
  const to = await upsertKnowledgeNode({
    id: cortexId('sci-b'),
    type: 'concept',
    domain: 'science',
    label: `candidate-b:${input.question.slice(0, 80)}`,
    summary: 'Scientific relationship candidate endpoint B. Not a verified mechanism.',
    claimState: 'MODEL_INFERENCE',
    sourceRefs: evidence.evidenceRefs,
    classification: 'internal',
  }, root);
  await addKnowledgeEdge({
    id: cortexId('sci-e'),
    from: from.id,
    to: to.id,
    type: 'RELATES_TO',
    evidenceRefs: evidence.evidenceRefs,
  }, root);
  return persist({
    id: cortexId('pat-sci'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'scientific',
    statement: `RELATES_TO candidate between ${from.id} and ${to.id}. Not CAUSED_BY. ${HYPOTHESIS_IS_NOT_FACT}`,
    domains: ['science'],
    evidenceRefs: [...evidence.evidenceRefs, from.id, to.id],
    epistemicClass: 'PATTERN',
    isCausation: false,
    isVerifiedFact: false,
    correlationNote: PATTERN_IS_NOT_CAUSATION,
    evidenceState: evidence.evidenceRefs.length ? 'UNKNOWN' : 'UNKNOWN',
    inventedFacts: false,
    createdAt: new Date().toISOString(),
  }, root);
}

export async function mapTechnologyConvergence(input: {
  tenantId: string;
  universeId: string;
  question: string;
  root?: string;
}): Promise<MinedPattern> {
  const root = input.root ?? process.cwd();
  const lesson = await learnAcrossIndustries({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    domains: ['technology', 'science', 'business'],
    root,
  });
  return persist({
    id: cortexId('pat-conv'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'technology_convergence',
    statement: `Technology-convergence map candidate for "${input.question}". Overlap is not identity and not causation.`,
    domains: lesson.domainsConsulted,
    evidenceRefs: lesson.evidenceRefs,
    epistemicClass: 'PATTERN',
    isCausation: false,
    isVerifiedFact: false,
    correlationNote: PATTERN_IS_NOT_CAUSATION,
    evidenceState: lesson.state === 'WAITING_DATA' ? 'WAITING_DATA' : 'UNKNOWN',
    inventedFacts: false,
    createdAt: new Date().toISOString(),
  }, root);
}

export async function mineCrossDomainAnalogy(input: {
  tenantId: string;
  universeId: string;
  question: string;
  root?: string;
}): Promise<MinedPattern> {
  const root = input.root ?? process.cwd();
  const lesson = await learnAcrossIndustries({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    root,
  });
  const analogyIsIdentity = false as const;
  return persist({
    id: cortexId('pat-ana'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'cross_domain_analogy',
    statement: `Cross-domain analogy candidate for "${input.question}". analogyIsIdentity=${analogyIsIdentity}. Analogy ≠ identity. ${PATTERN_IS_NOT_CAUSATION}`,
    domains: lesson.domainsConsulted,
    evidenceRefs: lesson.evidenceRefs,
    epistemicClass: 'PATTERN',
    isCausation: false,
    isVerifiedFact: false,
    correlationNote: PATTERN_IS_NOT_CAUSATION,
    evidenceState: lesson.state === 'WAITING_DATA' ? 'WAITING_DATA' : 'UNKNOWN',
    inventedFacts: false,
    createdAt: new Date().toISOString(),
  }, root);
}

export async function listMinedPatterns(input: { tenantId: string; universeId: string; root?: string }) {
  const patterns = await load(input.root ?? process.cwd());
  return patterns.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}
