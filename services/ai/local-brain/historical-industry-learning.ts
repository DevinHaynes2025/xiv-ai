import { KNOWLEDGE_DOMAINS } from './knowledge-domains';
import { retrieveEvidencePathway } from './cortex-evidence';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';

export const CROSS_INDUSTRY_DOMAINS = [
  'business',
  'economics',
  'finance',
  'supply_chain',
  'technology',
  'history',
  'science',
  'law_policy',
] as const;

export type CrossIndustryLesson = {
  tenantId: string;
  universeId: string;
  question: string;
  domainsConsulted: string[];
  evidenceRefs: string[];
  lessons: Array<{ domain: string; summary: string; claimState: 'HISTORICAL_ACCOUNT' | 'UNKNOWN' | 'MODEL_INFERENCE' }>;
  inventedFacts: false;
  productionAuthorization: false;
  state: 'AVAILABLE' | 'WAITING_DATA' | 'UNAVAILABLE';
};

export async function learnAcrossIndustries(input: {
  tenantId: string;
  universeId: string;
  question: string;
  domains?: readonly string[];
  needsExternalFreshness?: boolean;
  root?: string;
}): Promise<CrossIndustryLesson> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.question.trim()) throw new Error('HISTORICAL_LEARNING_QUESTION_REQUIRED');
  const domains = [...(input.domains ?? CROSS_INDUSTRY_DOMAINS)].filter((id) =>
    KNOWLEDGE_DOMAINS.some((domain) => domain.id === id),
  );
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.question,
    needsExternalFreshness: input.needsExternalFreshness,
    root: input.root,
  });

  const lessons = domains.map((domain) => {
    const hits = evidence.evidenceRefs.length;
    return {
      domain,
      summary: hits
        ? `Historical ${domain} evidence consulted for "${input.question}" (${hits} local refs). Analogy is not identity; transfer remains CANDIDATE until verified.`
        : `No local ${domain} evidence for "${input.question}". UNKNOWN is valid. Do not invent cross-industry facts.`,
      claimState: hits ? ('HISTORICAL_ACCOUNT' as const) : ('UNKNOWN' as const),
    };
  });

  if (evidence.state === 'AVAILABLE') {
    await appendLearning({
      domain: 'history',
      subject: `cross-industry:${input.question.slice(0, 80)}`,
      claimState: evidence.evidenceRefs.length ? 'HISTORICAL_ACCOUNT' : 'UNKNOWN',
      summary: lessons.map((lesson) => `${lesson.domain}:${lesson.claimState}`).join('; '),
      sourceRefs: evidence.evidenceRefs,
      evidence: evidence.evidenceRefs,
    }, input.root);

    await rememberCortexTrace({
      tenantId: input.tenantId,
      universeId: input.universeId,
      partition: 'world',
      kind: 'lesson',
      claimState: evidence.evidenceRefs.length ? 'HISTORICAL_ACCOUNT' : 'UNKNOWN',
      label: `Cross-industry lesson: ${input.question.slice(0, 80)}`,
      summary: `domains=${domains.join(',')}; inventedFacts=false`,
      evidenceRefs: evidence.evidenceRefs,
      sourceRefs: evidence.evidenceRefs,
      retentionClass: 'durable',
      root: input.root,
    });
  }

  return {
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question.trim(),
    domainsConsulted: domains,
    evidenceRefs: evidence.evidenceRefs,
    lessons,
    inventedFacts: false,
    productionAuthorization: false,
    state: evidence.state,
  };
}
