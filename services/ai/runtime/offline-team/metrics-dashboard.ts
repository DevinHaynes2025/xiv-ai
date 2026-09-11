export interface MeasuredUsageMetrics {
  views: number;
  uniqueUsers: number;
  sessions: number;
  featureUses: number;
}

export interface FinanceMetrics {
  approvedEntries: number;
  pendingEntries: number;
  revenueCents: number;
  expenseCents: number;
  currency: string;
}

export interface WorkMetrics {
  openTasks: number;
  blockedTasks: number;
  completedTasks: number;
  meetingsHeld: number;
  unresolvedDissent: number;
}

export interface OperationsMetricsSnapshot {
  tenantId: string;
  measuredAt: string;
  countSource: 'MEASURED';
  usage: MeasuredUsageMetrics;
  finance: FinanceMetrics;
  work: WorkMetrics;
  runtimeReady: boolean;
  runtimeBlockers: string[];
}

function assertCount(value: number, name: string) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a nonnegative integer`);
}

export function composeOperationsMetrics(input: Omit<OperationsMetricsSnapshot, 'countSource'>): OperationsMetricsSnapshot {
  if (!input.tenantId || !input.measuredAt) throw new Error('tenant/measured time required');
  const counts = [
    ['views', input.usage.views], ['uniqueUsers', input.usage.uniqueUsers], ['sessions', input.usage.sessions], ['featureUses', input.usage.featureUses],
    ['approvedEntries', input.finance.approvedEntries], ['pendingEntries', input.finance.pendingEntries],
    ['openTasks', input.work.openTasks], ['blockedTasks', input.work.blockedTasks], ['completedTasks', input.work.completedTasks],
    ['meetingsHeld', input.work.meetingsHeld], ['unresolvedDissent', input.work.unresolvedDissent],
  ] as const;
  counts.forEach(([name, value]) => assertCount(value, name));
  return { ...input, countSource: 'MEASURED' };
}

export const METRICS_DASHBOARD_GUARDRAILS = {
  fabricatedViewCountsAllowed: false,
  fabricatedUserCountsAllowed: false,
  measuredSourceRequired: true,
  rawSecretsInDashboardAllowed: false,
};
