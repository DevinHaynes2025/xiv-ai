export type ClockFreshness = 'fresh' | 'aging' | 'stale' | 'unknown';

const FRESH_MS = 15 * 60_000;
const AGING_MS = 6 * 60 * 60_000;

/**
 * Deterministic freshness from timestamps. LLM judgment is not used.
 */
export function classifyFreshness(input: {
  retrievedAt?: string | null;
  sourceUpdatedAt?: string | null;
  now?: number;
}): ClockFreshness {
  const now = input.now ?? Date.now();
  const stamp = Date.parse(input.sourceUpdatedAt || input.retrievedAt || '');
  if (!Number.isFinite(stamp)) return 'unknown';
  const age = now - stamp;
  if (age < 0) return 'unknown';
  if (age <= FRESH_MS) return 'fresh';
  if (age <= AGING_MS) return 'aging';
  return 'stale';
}

export function freshnessLabel(status: ClockFreshness) {
  if (status === 'fresh') return 'FRESH';
  if (status === 'aging') return 'AGING';
  if (status === 'stale') return 'STALE DATA';
  return 'UNKNOWN FRESHNESS';
}
