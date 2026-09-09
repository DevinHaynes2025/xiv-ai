export const LOAD_TEST_SCENARIOS = [100, 1_000, 10_000, 100_000] as const;

export const LOAD_TEST_METRICS = ['p50', 'p95', 'p99', 'error_rate', 'cpu', 'memory', 'db_connections', 'queue_depth', 'rate_limit_hits'] as const;

export function loadTestPlan() {
  return {
    status: 'planned' as const,
    passed: false,
    scenarios: LOAD_TEST_SCENARIOS,
    metrics: LOAD_TEST_METRICS,
    results: null,
  };
}

export function loadTestsHavePassed() {
  return false;
}
