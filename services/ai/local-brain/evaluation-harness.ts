import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import { recallStrategyTactics, recordStrategyTactic, type StrategyOutcome } from './strategy-memory';
import { resourceBudgetFor } from './resource-governor';
import { updateAgentSkill } from './persistent-agent-registry';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export const EVALUATION_FILE = 'agent-society-evaluation.json';

export type EvidenceState = 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'UNKNOWN' | 'NOT_TESTED';

export type EvaluationMetrics = {
  evidenceQuality: number;
  factualSupport: number;
  testSuccess: number;
  calibration: number;
  correctionRate: number;
  latencyMs: number;
  resourceUse: {
    workcellsInFlight: number;
    modelCallsUsed: number;
    maxConcurrentWorkcells: number;
  };
  agentCount: number;
};

export type StoredBaseline = {
  id: string;
  tenantId: string;
  universeId: string;
  label: string;
  metrics: EvaluationMetrics;
  evidenceRefs: string[];
  createdAt: string;
  inventedSmarter: false;
};

export type EvaluationRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  label: string;
  kind: 'baseline' | 'candidate';
  metrics: EvaluationMetrics;
  predictedConfidence: number;
  observedOutcome: 0 | 1;
  calibrationError: number;
  evidenceRefs: string[];
  inventedFacts: false;
  smarterBecauseMoreAgents: false;
  productionAuthorization: false;
  createdAt: string;
};

export type ComparisonVerdict = 'IMPROVED' | 'REGRESSED' | 'UNCHANGED' | 'INSUFFICIENT_EVIDENCE';

export type BaselineComparison = {
  id: string;
  baselineId: string;
  candidateId: string;
  deltas: {
    evidenceQuality: number;
    factualSupport: number;
    testSuccess: number;
    calibration: number;
    correctionRate: number;
    latencyMs: number;
    resourceUseModelCalls: number;
    agentCount: number;
  };
  verdict: ComparisonVerdict;
  qualityRegression: boolean;
  smarterBecauseMoreAgents: false;
  intelligenceGainClaimed: false;
  reason: string;
};

type Store = {
  baselines: StoredBaseline[];
  evaluations: EvaluationRecord[];
  comparisons: BaselineComparison[];
};

const REGRESSION_EPS = 0.05;

function pathFor(root: string) {
  return xivLocalPath(root, EVALUATION_FILE);
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(pathFor(root), { baselines: [], evaluations: [], comparisons: [] });
  return {
    baselines: Array.isArray(parsed.baselines) ? parsed.baselines : [],
    evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
    comparisons: Array.isArray(parsed.comparisons) ? parsed.comparisons : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(pathFor(root), {
    baselines: store.baselines.slice(-500),
    evaluations: store.evaluations.slice(-2_000),
    comparisons: store.comparisons.slice(-2_000),
  });
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function computeEvaluationMetrics(input: {
  evidenceRefs: string[];
  inventedFacts: boolean;
  testPassed: boolean;
  testAttempts: number;
  corrections: number;
  predictedConfidence: number;
  latencyMs: number;
  tenantId: string;
  universeId: string;
  agentCount: number;
}): EvaluationMetrics {
  const evidenceQuality = input.inventedFacts
    ? 0
    : clamp01(input.evidenceRefs.length === 0 ? 0 : Math.min(1, input.evidenceRefs.length / 4) + (input.inventedFacts ? 0 : 0.15));
  const factualSupport = !input.inventedFacts && input.evidenceRefs.length > 0 ? clamp01(0.5 + Math.min(0.5, input.evidenceRefs.length / 8)) : 0;
  const testSuccess = input.testPassed ? 1 : 0;
  const observed = testSuccess;
  const calibration = clamp01(1 - Math.abs(clamp01(input.predictedConfidence) - observed));
  const correctionRate = input.testAttempts <= 0 ? 0 : clamp01(input.corrections / input.testAttempts);
  const budget = resourceBudgetFor(input.tenantId, input.universeId);
  return {
    evidenceQuality,
    factualSupport,
    testSuccess,
    calibration,
    correctionRate,
    latencyMs: Math.max(0, input.latencyMs),
    resourceUse: {
      workcellsInFlight: budget.workcellsInFlight,
      modelCallsUsed: budget.modelCallsUsed,
      maxConcurrentWorkcells: budget.maxConcurrentWorkcells,
    },
    agentCount: Math.max(0, input.agentCount),
  };
}

export async function recordEvaluation(input: {
  tenantId: string;
  universeId: string;
  label: string;
  kind: 'baseline' | 'candidate';
  metrics: EvaluationMetrics;
  predictedConfidence: number;
  observedOutcome: 0 | 1;
  evidenceRefs: string[];
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const record: EvaluationRecord = {
    id: cortexId('eval'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.label.trim(),
    kind: input.kind,
    metrics: input.metrics,
    predictedConfidence: clamp01(input.predictedConfidence),
    observedOutcome: input.observedOutcome,
    calibrationError: Math.abs(clamp01(input.predictedConfidence) - input.observedOutcome),
    evidenceRefs: [...input.evidenceRefs],
    inventedFacts: false,
    smarterBecauseMoreAgents: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  store.evaluations.push(record);
  if (input.kind === 'baseline') {
    store.baselines.push({
      id: record.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      label: record.label,
      metrics: input.metrics,
      evidenceRefs: record.evidenceRefs,
      createdAt: record.createdAt,
      inventedSmarter: false,
    });
  }
  await save(root, store);
  await appendLearning({
    domain: 'evaluation',
    subject: `eval:${record.label.slice(0, 80)}`,
    claimState: 'MODEL_INFERENCE',
    summary: `${record.kind} evidenceQuality=${record.metrics.evidenceQuality.toFixed(3)} testSuccess=${record.metrics.testSuccess} calibration=${record.metrics.calibration.toFixed(3)} agents=${record.metrics.agentCount} (agent count is not an intelligence score)`,
    sourceRefs: [`eval:${record.id}`],
    evidence: record.evidenceRefs,
    confidence: record.metrics.calibration,
  }, root);
  return record;
}

export async function compareAgainstBaseline(input: {
  tenantId: string;
  universeId: string;
  baselineId: string;
  candidateId: string;
  root?: string;
}): Promise<BaselineComparison> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const baseline = store.evaluations.find(
    (item) => item.id === input.baselineId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  const candidate = store.evaluations.find(
    (item) => item.id === input.candidateId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!baseline || !candidate) {
    const comparison: BaselineComparison = {
      id: cortexId('cmp'),
      baselineId: input.baselineId,
      candidateId: input.candidateId,
      deltas: {
        evidenceQuality: 0,
        factualSupport: 0,
        testSuccess: 0,
        calibration: 0,
        correctionRate: 0,
        latencyMs: 0,
        resourceUseModelCalls: 0,
        agentCount: 0,
      },
      verdict: 'INSUFFICIENT_EVIDENCE',
      qualityRegression: false,
      smarterBecauseMoreAgents: false,
      intelligenceGainClaimed: false,
      reason: 'Baseline or candidate evaluation is missing.',
    };
    store.comparisons.push(comparison);
    await save(root, store);
    return comparison;
  }
  const deltas = {
    evidenceQuality: candidate.metrics.evidenceQuality - baseline.metrics.evidenceQuality,
    factualSupport: candidate.metrics.factualSupport - baseline.metrics.factualSupport,
    testSuccess: candidate.metrics.testSuccess - baseline.metrics.testSuccess,
    calibration: candidate.metrics.calibration - baseline.metrics.calibration,
    correctionRate: candidate.metrics.correctionRate - baseline.metrics.correctionRate,
    latencyMs: candidate.metrics.latencyMs - baseline.metrics.latencyMs,
    resourceUseModelCalls: candidate.metrics.resourceUse.modelCallsUsed - baseline.metrics.resourceUse.modelCallsUsed,
    agentCount: candidate.metrics.agentCount - baseline.metrics.agentCount,
  };
  const qualityRegression =
    deltas.evidenceQuality < -REGRESSION_EPS ||
    deltas.factualSupport < -REGRESSION_EPS ||
    deltas.testSuccess < 0 ||
    deltas.calibration < -REGRESSION_EPS;
  const improved =
    !qualityRegression &&
    (deltas.evidenceQuality > REGRESSION_EPS || deltas.factualSupport > REGRESSION_EPS || deltas.testSuccess > 0 || deltas.calibration > REGRESSION_EPS);
  const verdict: ComparisonVerdict = qualityRegression
    ? 'REGRESSED'
    : improved
      ? 'IMPROVED'
      : Math.abs(deltas.evidenceQuality) <= REGRESSION_EPS && deltas.testSuccess === 0
        ? 'UNCHANGED'
        : 'UNCHANGED';
  const comparison: BaselineComparison = {
    id: cortexId('cmp'),
    baselineId: baseline.id,
    candidateId: candidate.id,
    deltas,
    verdict,
    qualityRegression,
    smarterBecauseMoreAgents: false,
    intelligenceGainClaimed: false,
    reason: qualityRegression
      ? 'Candidate regressed on evidence quality, factual support, test success, or calibration versus the stored baseline. Agent count is not treated as intelligence.'
      : improved
        ? 'Candidate improved on stored baseline metrics (evidence/tests/calibration). This is not a claim that XIV is smarter because more agents exist.'
        : 'No material metric movement versus baseline. More agents would not change this verdict.',
  };
  store.comparisons.push(comparison);
  await save(root, store);
  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: qualityRegression ? 'contradiction' : 'lesson',
    claimState: qualityRegression ? 'DISPUTED' : 'MODEL_INFERENCE',
    label: `Eval compare ${verdict}`,
    summary: comparison.reason,
    evidenceRefs: [...baseline.evidenceRefs, ...candidate.evidenceRefs],
    sourceRefs: [`cmp:${comparison.id}`],
    retentionClass: 'working',
    root,
  });
  return comparison;
}

export async function strategyReputation(input: {
  tenantId: string;
  universeId: string;
  query: string;
  root?: string;
}) {
  const recalled = await recallStrategyTactics({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.query,
    root: input.root,
  });
  const counts = { succeeded: 0, failed: 0, blocked: 0, waiting_data: 0, unavailable: 0 };
  for (const tactic of recalled.tactics) counts[tactic.outcome] += 1;
  const scored = recalled.tactics.length === 0 ? 0 : (counts.succeeded - counts.failed) / recalled.tactics.length;
  return {
    query: input.query,
    samples: recalled.tactics.length,
    counts,
    reputation: Math.max(-1, Math.min(1, scored)),
    inventedFacts: false as const,
    smarterBecauseMoreAgents: false as const,
  };
}

export async function recordStrategyOutcome(input: {
  tenantId: string;
  universeId: string;
  subject: string;
  tactic: string;
  outcome: StrategyOutcome;
  evidenceRefs?: string[];
  root?: string;
}) {
  return recordStrategyTactic(input);
}

export async function evolveSkillsFromEvaluation(input: {
  tenantId: string;
  universeId: string;
  agentIds: string[];
  comparison: BaselineComparison;
  evidenceRefs: string[];
  root?: string;
}) {
  const delta = input.comparison.qualityRegression ? -0.05 : input.comparison.verdict === 'IMPROVED' ? 0.05 : 0;
  const updates = [];
  for (const agentId of input.agentIds) {
    updates.push(
      await updateAgentSkill({
        agentId,
        tenantId: input.tenantId,
        universeId: input.universeId,
        delta,
        evidenceRefs: input.evidenceRefs,
        agentCountDelta: input.comparison.deltas.agentCount,
        root: input.root,
      }),
    );
  }
  return {
    updates,
    skillUsesAgentCount: false as const,
    appliedDelta: delta,
  };
}

export async function latestBaseline(tenantId: string, universeId: string, root = process.cwd()) {
  const store = await load(root);
  return [...store.baselines].reverse().find((item) => item.tenantId === tenantId && item.universeId === universeId) ?? null;
}

export async function listEvaluations(tenantId: string, universeId: string, root = process.cwd()) {
  const store = await load(root);
  return store.evaluations.filter((item) => item.tenantId === tenantId && item.universeId === universeId);
}

export async function listComparisons(tenantId: string, universeId: string, root = process.cwd()) {
  const store = await load(root);
  const evalIds = new Set(
    store.evaluations.filter((item) => item.tenantId === tenantId && item.universeId === universeId).map((item) => item.id),
  );
  return store.comparisons.filter((item) => evalIds.has(item.baselineId) || evalIds.has(item.candidateId));
}

export function evaluationHonesty() {
  return {
    inventedPass: false as const,
    inventedSmarter: false as const,
    l4AutonomyEnabled: false as const,
    productionAuthorization: false as const,
  };
}
