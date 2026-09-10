export type FreshnessState = 'LIVE' | 'RECENT' | 'STALE' | 'DEGRADED';

export interface FreshnessReceipt {
  observedAt: string;
  checkedAt: string;
  ageSeconds: number;
  state: FreshnessState;
}

export function classifyFreshness(observedAt: string, checkedAt = new Date().toISOString()): FreshnessReceipt {
  const ageSeconds = Math.max(0, Math.floor((Date.parse(checkedAt) - Date.parse(observedAt)) / 1000));
  const state: FreshnessState = ageSeconds <= 60 ? 'LIVE' : ageSeconds <= 900 ? 'RECENT' : ageSeconds <= 86400 ? 'STALE' : 'DEGRADED';
  return { observedAt, checkedAt, ageSeconds, state };
}
