import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import type { ClaimState } from './knowledge-domains';

export type HypothesisStatus = 'OPEN' | 'CHALLENGED' | 'SUPPORTED' | 'REJECTED' | 'UNKNOWN';

export type CompetingHypothesis = {
  id: string;
  tenantId: string;
  universeId: string;
  storyId: string;
  statement: string;
  claimState: ClaimState;
  status: HypothesisStatus;
  evidenceRefs: string[];
  competingWith: string[];
  inventedFacts: false;
  productionAuthorization: false;
  createdAt: string;
};

type Store = { hypotheses: CompetingHypothesis[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'hypothesis-factory.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { hypotheses: [] });
  return Array.isArray(parsed.hypotheses) ? parsed.hypotheses : [];
}

async function save(root: string, hypotheses: CompetingHypothesis[]) {
  await writeJsonFileAtomic(pathFor(root), { hypotheses: hypotheses.slice(-5_000) });
}

export async function mintCompetingHypotheses(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  intent: string;
  localEvidenceRefs?: string[];
  root?: string;
}): Promise<CompetingHypothesis[]> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.intent.trim()) throw new Error('HYPOTHESIS_INTENT_REQUIRED');
  const root = input.root ?? process.cwd();
  const evidenceRefs = [...(input.localEvidenceRefs ?? [])];
  const claimState: ClaimState = evidenceRefs.length ? 'MODEL_INFERENCE' : 'UNKNOWN';
  const base = input.intent.trim().slice(0, 240);
  const statements = [
    `Primary: ${base}`,
    `Challenge: The opposite of "${base}" is still possible given missing evidence.`,
    `Null: Local evidence is insufficient; the honest state is UNKNOWN until more sourced facts exist.`,
  ];
  const minted: CompetingHypothesis[] = statements.map((statement, index) => ({
    id: cortexId(`hyp${index}`),
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    statement,
    claimState: index === 2 ? 'UNKNOWN' : claimState,
    status: index === 2 ? 'UNKNOWN' : 'OPEN',
    evidenceRefs: [...evidenceRefs],
    competingWith: [],
    inventedFacts: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  }));
  for (const item of minted) {
    item.competingWith = minted.filter((other) => other.id !== item.id).map((other) => other.id);
  }
  const existing = await load(root);
  existing.push(...minted);
  await save(root, existing);
  return minted;
}

export async function listHypotheses(input: {
  tenantId: string;
  universeId: string;
  storyId?: string;
  root?: string;
}) {
  const items = await load(input.root ?? process.cwd());
  return items.filter((item) =>
    item.tenantId === input.tenantId &&
    item.universeId === input.universeId &&
    (!input.storyId || item.storyId === input.storyId),
  );
}
