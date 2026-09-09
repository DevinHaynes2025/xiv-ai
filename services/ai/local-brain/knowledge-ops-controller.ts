import { ingestRawEvidence, promoteEvidence, listPromotedEvidence, type EvidencePromotionState } from './evidence-promotion-gate';
import { detectKnowledgeGaps } from './knowledge-gap-detector';
import { retrieveEvidencePathway } from './cortex-evidence';
import { storyAt } from './story-factory';

export type KnowledgeOpsController = {
  id: string;
  tenantId: string;
  universeId: string;
  l4AutonomyEnabled: false;
  productionAuthorization: false;
};

export function createKnowledgeOpsController(input: { tenantId: string; universeId: string }): KnowledgeOpsController {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  return {
    id: `kops:${input.tenantId}:${input.universeId}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    l4AutonomyEnabled: false,
    productionAuthorization: false,
  };
}

export async function operateKnowledge(input: {
  tenantId: string;
  universeId: string;
  summary: string;
  sourceRefs: string[];
  promoteTo?: EvidencePromotionState;
  testState?: 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'UNKNOWN' | 'NOT_TESTED';
  root?: string;
}) {
  const controller = createKnowledgeOpsController(input);
  const raw = await ingestRawEvidence({
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: input.summary,
    sourceRefs: input.sourceRefs,
    root: input.root,
  });
  let current = raw;
  const chain: EvidencePromotionState[] = ['parsed', 'claims'];
  for (const step of chain) {
    current = await promoteEvidence({
      id: current.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      to: step,
      root: input.root,
    });
  }
  if (input.promoteTo) {
    current = await promoteEvidence({
      id: current.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      to: input.promoteTo,
      testState: input.testState,
      evidenceRefs: input.sourceRefs,
      root: input.root,
    });
  }
  const retrieval = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.summary,
    root: input.root,
  });
  const gaps = await detectKnowledgeGaps({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  return {
    controller,
    record: current,
    retrieval,
    gaps,
    nextStory: storyAt(Date.now() % 1_000),
    inventedFacts: false as const,
    productionAuthorization: false as const,
  };
}

export { listPromotedEvidence };
