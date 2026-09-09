import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BS_LOCKS,
  FLAKE_SUSPECTED_UNTIL_VERIFIED,
} from './engineering-university-memory-cortex-types';

/**
 * Autonomous Test Laboratory — bounded automated testing, regression detection,
 * flaky-test analysis. Not unbounded CI mutation of production.
 * Flake detections are evidence-labeled; suspected until verified;
 * false positives possible → not auto production block without policy.
 */

export const TEST_LAB_STORE = 'autonomous-test-laboratory.json';

export type TestRunRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  suiteId: string;
  testName: string;
  result: 'pass' | 'fail' | 'timeout' | 'error';
  durationMs: number;
  bounded: true;
  productionMutated: false;
  at: string;
};

export type FlakeLabel = 'suspected' | 'verified_flake' | 'verified_stable' | 'unknown';

export type FlakyAnalysisRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  testName: string;
  label: FlakeLabel;
  evidenceLabel: string;
  falsePositivePossible: true;
  autoProductionBlock: false;
  passFailHistory: Array<'pass' | 'fail'>;
  at: string;
};

export type RegressionSignal = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  testName: string;
  previousResult: 'pass';
  currentResult: 'fail' | 'timeout' | 'error';
  evidenceLabel: 'regression_suspected';
  autoProductionBlock: false;
  at: string;
};

type LabStore = {
  runs: TestRunRecord[];
  flakes: FlakyAnalysisRecord[];
  regressions: RegressionSignal[];
  denials: Array<{ id: string; at: string; reason: string }>;
};

const MAX = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, TEST_LAB_STORE);
}

async function load(root: string): Promise<LabStore> {
  const parsed = await readJsonFile<LabStore>(storePath(root), {
    runs: [],
    flakes: [],
    regressions: [],
    denials: [],
  });
  return {
    runs: Array.isArray(parsed.runs) ? parsed.runs : [],
    flakes: Array.isArray(parsed.flakes) ? parsed.flakes : [],
    regressions: Array.isArray(parsed.regressions) ? parsed.regressions : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: LabStore) {
  await writeJsonFileAtomic(storePath(root), {
    runs: store.runs.slice(-MAX),
    flakes: store.flakes.slice(-MAX),
    regressions: store.regressions.slice(-MAX),
    denials: store.denials.slice(-MAX),
  });
}

export async function runBoundedLabTest(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  suiteId: string;
  testName: string;
  result: TestRunRecord['result'];
  durationMs?: number;
  /** Hard-deny probe: attempt unbounded production CI mutation. */
  attemptProductionMutation?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (input.attemptProductionMutation || BS_LOCKS.UNBOUNDED_CI_MUTATION_OF_PRODUCTION) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: 'UNBOUNDED_CI_MUTATION_OF_PRODUCTION_DENIED',
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: 'UNBOUNDED_CI_MUTATION_OF_PRODUCTION_DENIED',
      run: null,
      productionMutated: false as const,
    };
  }

  if (!input.orgId || !input.tenantId || !input.universeId) {
    return { accepted: false as const, reason: 'ORG_TENANT_UNIVERSE_REQUIRED', run: null };
  }

  const run: TestRunRecord = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    suiteId: input.suiteId,
    testName: input.testName,
    result: input.result,
    durationMs: Math.max(0, Number(input.durationMs) || 0),
    bounded: true,
    productionMutated: false,
    at: new Date().toISOString(),
  };
  store.runs.push(run);

  // Regression: prior pass → current fail for same test.
  const priorPass = store.runs
    .filter((r) => r.testName === input.testName && r.id !== run.id && r.result === 'pass')
    .slice(-1)[0];
  let regression: RegressionSignal | null = null;
  if (priorPass && (run.result === 'fail' || run.result === 'timeout' || run.result === 'error')) {
    regression = {
      id: randomUUID(),
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      testName: input.testName,
      previousResult: 'pass',
      currentResult: run.result,
      evidenceLabel: 'regression_suspected',
      autoProductionBlock: false,
      at: run.at,
    };
    store.regressions.push(regression);
  }

  await save(root, store);
  return {
    accepted: true as const,
    reason: 'BOUNDED_LAB_TEST_RECORDED',
    run,
    regression,
    productionMutated: false as const,
    autoProductionBlock: false as const,
  };
}

export async function analyzeFlakyTest(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  testName: string;
  /** History of recent results; intermittent pass/fail → suspected flake. */
  passFailHistory: Array<'pass' | 'fail'>;
  /** Only elevate to verified_flake when explicitly verified. */
  verification?: 'unverified' | 'verified_flake' | 'verified_stable';
  /** Hard-deny probe: auto-block production on suspected flake. */
  attemptAutoProductionBlock?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (input.attemptAutoProductionBlock) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: 'FLAKY_AUTO_PRODUCTION_BLOCK_DENIED_WITHOUT_POLICY',
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: 'FLAKY_AUTO_PRODUCTION_BLOCK_DENIED_WITHOUT_POLICY',
      analysis: null,
      autoProductionBlock: false as const,
    };
  }

  const history = input.passFailHistory.slice(-20);
  const hasPass = history.includes('pass');
  const hasFail = history.includes('fail');
  let label: FlakeLabel = 'unknown';
  let evidenceLabel = 'insufficient_history';

  if (input.verification === 'verified_flake') {
    label = 'verified_flake';
    evidenceLabel = 'flake_verified_by_policy';
  } else if (input.verification === 'verified_stable') {
    label = 'verified_stable';
    evidenceLabel = 'stability_verified_by_policy';
  } else if (hasPass && hasFail) {
    label = 'suspected';
    evidenceLabel = FLAKE_SUSPECTED_UNTIL_VERIFIED;
  } else if (hasFail && !hasPass) {
    label = 'suspected';
    evidenceLabel = FLAKE_SUSPECTED_UNTIL_VERIFIED;
  }

  const analysis: FlakyAnalysisRecord = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    testName: input.testName,
    label,
    evidenceLabel,
    falsePositivePossible: true,
    autoProductionBlock: false,
    passFailHistory: history,
    at: new Date().toISOString(),
  };
  store.flakes.push(analysis);
  await save(root, store);

  return {
    accepted: true as const,
    reason:
      label === 'suspected'
        ? FLAKE_SUSPECTED_UNTIL_VERIFIED
        : `FLAKY_ANALYSIS_${label.toUpperCase()}`,
    analysis,
    autoProductionBlock: false as const,
    falsePositivePossible: true as const,
  };
}

export function testLabHonesty() {
  return {
    locks: BS_LOCKS,
    unboundedCiMutationOfProduction: BS_LOCKS.UNBOUNDED_CI_MUTATION_OF_PRODUCTION,
    flakyAutoProductionBlock: BS_LOCKS.FLAKY_AUTO_PRODUCTION_BLOCK,
    productionAuthorization: false as const,
  };
}
