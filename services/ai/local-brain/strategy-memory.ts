import { appendLearning } from './learning-ledger';
import { rememberCortexTrace, recallCortexTraces } from './memory-cortex';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type StrategyOutcome = 'succeeded' | 'failed' | 'blocked' | 'waiting_data' | 'unavailable';

export type StrategyTactic = {
  id: string;
  tenantId: string;
  universeId: string;
  subject: string;
  tactic: string;
  outcome: StrategyOutcome;
  evidenceRefs: string[];
  inventedFacts: false;
  productionAuthorization: false;
  createdAt: string;
};

type Store = { tactics: StrategyTactic[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'strategy-memory.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { tactics: [] });
  return Array.isArray(parsed.tactics) ? parsed.tactics : [];
}

async function save(root: string, tactics: StrategyTactic[]) {
  await writeJsonFileAtomic(pathFor(root), { tactics: tactics.slice(-5_000) });
}

export async function recordStrategyTactic(input: {
  tenantId: string;
  universeId: string;
  subject: string;
  tactic: string;
  outcome: StrategyOutcome;
  evidenceRefs?: string[];
  root?: string;
}): Promise<StrategyTactic> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.subject.trim() || !input.tactic.trim()) throw new Error('STRATEGY_SUBJECT_AND_TACTIC_REQUIRED');
  const root = input.root ?? process.cwd();
  const tactic: StrategyTactic = {
    id: cortexId('strat'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    subject: input.subject.trim(),
    tactic: input.tactic.trim(),
    outcome: input.outcome,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    inventedFacts: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  const tactics = await load(root);
  tactics.push(tactic);
  await save(root, tactics);

  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'lesson',
    claimState: input.outcome === 'succeeded' ? 'VERIFIED_FACT' : 'MODEL_INFERENCE',
    label: `Strategy: ${input.subject.slice(0, 72)}`,
    summary: `${input.outcome}: ${input.tactic.slice(0, 240)}`,
    evidenceRefs: tactic.evidenceRefs,
    sourceRefs: [`strategy:${tactic.id}`],
    pathwayStrength: input.outcome === 'succeeded' ? 0.4 : 0.15,
    retentionClass: 'working',
    root,
  });

  await appendLearning({
    domain: 'business',
    subject: `strategy:${input.subject.slice(0, 80)}`,
    claimState: input.outcome === 'succeeded' ? 'VERIFIED_FACT' : 'MODEL_INFERENCE',
    summary: `${input.outcome} tactic recorded; inventedFacts=false`,
    sourceRefs: tactic.evidenceRefs,
    evidence: tactic.evidenceRefs,
  }, root);

  return tactic;
}

export async function recallStrategyTactics(input: {
  tenantId: string;
  universeId: string;
  query: string;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const needle = input.query.trim().toLowerCase();
  const tactics = (await load(root)).filter((item) =>
    item.tenantId === input.tenantId &&
    item.universeId === input.universeId &&
    (!needle || `${item.subject} ${item.tactic}`.toLowerCase().includes(needle)),
  );
  const cortex = await recallCortexTraces({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.query,
    partition: 'business',
    root,
  });
  return {
    tactics: tactics.slice(-50),
    cortexIds: cortex.map((item) => item.id),
    inventedFacts: false as const,
    productionAuthorization: false as const,
  };
}
