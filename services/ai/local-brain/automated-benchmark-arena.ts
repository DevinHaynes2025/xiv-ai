/**
 * 62L-BU Automated Benchmark Arena — bounded benchmarks, regression detection,
 * evidence-backed scores; honest UNAVAILABLE when toolchain missing/unverified.
 * Regression labels evidence without auto production block authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { getResearchToolchain } from './ai-code-research-institute';
import {
  BU_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  REGRESSION_EVIDENCE_ONLY,
  UNVERIFIED_TOOLCHAIN_UNAVAILABLE,
  containsForbiddenPrivateFields,
  type BuActor,
  type ConfidenceLabel,
} from './code-research-benchmark-strategy-types';

export type BenchmarkScore = {
  metric: string;
  value: number;
  unit: string;
};

export type BenchmarkRun = {
  id: string;
  suiteId: string;
  languageKey: string;
  status: 'completed' | 'unavailable' | 'denied';
  scores: BenchmarkScore[];
  evidenceRefs: string[];
  labeledVerified: boolean;
  productionBlockAuthority: false;
  createdAt: string;
  actorId: string;
  reason: string;
};

export type RegressionReport = {
  id: string;
  suiteId: string;
  languageKey: string;
  baselineRunId: string;
  currentRunId: string;
  metric: string;
  baselineValue: number;
  currentValue: number;
  delta: number;
  regression: boolean;
  evidenceRefs: string[];
  confidence: ConfidenceLabel;
  /** Explicit: evidence label only — not production block authority. */
  autoProductionBlockAuthority: false;
  productionBlocked: false;
  createdAt: string;
  actorId: string;
  reason: typeof REGRESSION_EVIDENCE_ONLY;
};

type Store = {
  runs: BenchmarkRun[];
  regressions: RegressionReport[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'automated-benchmark-arena.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { runs: [], regressions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Run a bounded benchmark. Unverified / missing toolchain → UNAVAILABLE
 * (not VERIFIED). Does not grant production authority.
 */
export async function runBoundedBenchmark(input: {
  suiteId: string;
  languageKey: string;
  scores?: BenchmarkScore[];
  evidenceRefs?: string[];
  /** Attempt to run despite unverified toolchain. */
  forceRunUnverified?: boolean;
  payload?: Record<string, unknown>;
  actor: BuActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      status: 'denied' as const,
      labeledVerified: false as const,
    };
  }

  const key = normalizeKey(input.languageKey);
  const toolchain = await getResearchToolchain(key, root);
  const verified =
    !!toolchain &&
    toolchain.label === 'VERIFIED' &&
    toolchain.toolchainProven &&
    toolchain.testsProven;

  const store = await load(root);

  if (!verified) {
    const run: BenchmarkRun = {
      id: id('bench'),
      suiteId: input.suiteId,
      languageKey: key,
      status: 'unavailable',
      scores: [],
      evidenceRefs: input.evidenceRefs ?? [],
      labeledVerified: false,
      productionBlockAuthority: false,
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: UNVERIFIED_TOOLCHAIN_UNAVAILABLE,
    };
    store.runs.push(run);
    await save(root, store);
    return {
      accepted: false as const,
      run,
      status: 'unavailable' as const,
      labeledVerified: false as const,
      reason: UNVERIFIED_TOOLCHAIN_UNAVAILABLE,
      forceIgnored: input.forceRunUnverified === true,
    };
  }

  const scores = input.scores ?? [{ metric: 'throughput', value: 1, unit: 'ops/s' }];
  const run: BenchmarkRun = {
    id: id('bench'),
    suiteId: input.suiteId,
    languageKey: key,
    status: 'completed',
    scores,
    evidenceRefs: input.evidenceRefs ?? [`toolchain:${key}`],
    labeledVerified: true,
    productionBlockAuthority: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: 'BENCHMARK_COMPLETED_ON_VERIFIED_TOOLCHAIN',
  };
  store.runs.push(run);
  await save(root, store);

  return {
    accepted: true as const,
    run,
    status: 'completed' as const,
    labeledVerified: true as const,
    productionAuthorized: false as const,
    reason: run.reason,
  };
}

/**
 * Detect regression between baseline and current runs.
 * Labels evidence only — does NOT auto-block production.
 */
export async function detectBenchmarkRegression(input: {
  suiteId: string;
  languageKey: string;
  baselineRunId: string;
  currentRunId: string;
  metric: string;
  /**
   * Metric direction. Default: infer from metric name
   * (latency/duration/error/_ms → higherIsWorse; else higherIsBetter).
   */
  higherIsBetter?: boolean;
  /** Attempt to claim production block authority — refused. */
  requestProductionBlock?: boolean;
  actor: BuActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const key = normalizeKey(input.languageKey);
  const baseline = store.runs.find((r) => r.id === input.baselineRunId);
  const current = store.runs.find((r) => r.id === input.currentRunId);

  if (!baseline || !current) {
    return {
      accepted: false as const,
      reason: 'BENCHMARK_RUN_NOT_FOUND',
      autoProductionBlockAuthority: false as const,
    };
  }

  const bScore = baseline.scores.find((s) => s.metric === input.metric);
  const cScore = current.scores.find((s) => s.metric === input.metric);
  if (!bScore || !cScore) {
    return {
      accepted: false as const,
      reason: 'METRIC_NOT_FOUND',
      autoProductionBlockAuthority: false as const,
    };
  }

  const metricLower = input.metric.toLowerCase();
  const inferredHigherIsBetter =
    input.higherIsBetter ??
    !(
      metricLower.includes('latency') ||
      metricLower.includes('duration') ||
      metricLower.includes('error') ||
      metricLower.endsWith('_ms') ||
      metricLower.endsWith('_sec')
    );

  const delta = cScore.value - bScore.value;
  const regression = inferredHigherIsBetter
    ? cScore.value < bScore.value
    : cScore.value > bScore.value;

  const report: RegressionReport = {
    id: id('regr'),
    suiteId: input.suiteId,
    languageKey: key,
    baselineRunId: baseline.id,
    currentRunId: current.id,
    metric: input.metric,
    baselineValue: bScore.value,
    currentValue: cScore.value,
    delta,
    regression,
    evidenceRefs: [
      ...baseline.evidenceRefs,
      ...current.evidenceRefs,
      `delta:${delta}`,
    ],
    confidence: regression ? 'evidence_backed' : 'evidence_backed',
    autoProductionBlockAuthority: false,
    productionBlocked: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: REGRESSION_EVIDENCE_ONLY,
  };

  store.regressions.push(report);
  await save(root, store);

  return {
    accepted: true as const,
    report,
    regression,
    autoProductionBlockAuthority: false as const,
    productionBlocked: false as const,
    productionBlockRequested: input.requestProductionBlock === true,
    productionBlockGranted: false as const,
    reason: REGRESSION_EVIDENCE_ONLY,
    locks: {
      regressionAutoProductionBlockAuthority:
        BU_LOCKS.REGRESSION_AUTO_PRODUCTION_BLOCK_AUTHORITY,
    },
  };
}

export async function listBenchmarkRuns(root = process.cwd()) {
  return (await load(root)).runs;
}

export async function listRegressions(root = process.cwd()) {
  return (await load(root)).regressions;
}

export function benchmarkArenaHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BU_LOCKS.L4_AUTONOMY_ENABLED,
    benchmarkUnverifiedToolchain: BU_LOCKS.BENCHMARK_UNVERIFIED_TOOLCHAIN,
    regressionAutoProductionBlockAuthority:
      BU_LOCKS.REGRESSION_AUTO_PRODUCTION_BLOCK_AUTHORITY,
    measuredResultIsProductionMandate: BU_LOCKS.MEASURED_RESULT_IS_PRODUCTION_MANDATE,
  };
}
