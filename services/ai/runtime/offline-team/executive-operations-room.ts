import type { OperationsMetricsSnapshot } from './metrics-dashboard';

export type OpsSeverity = 'INFO' | 'ATTENTION' | 'CRITICAL';

export interface ExecutiveAlert {
  code: string;
  severity: OpsSeverity;
  message: string;
}

export interface ExecutiveOperationsRoom {
  tenantId: string;
  generatedAt: string;
  metrics: OperationsMetricsSnapshot;
  alerts: ExecutiveAlert[];
  requiresHumanReview: boolean;
}

export function buildExecutiveOperationsRoom(metrics: OperationsMetricsSnapshot): ExecutiveOperationsRoom {
  const alerts: ExecutiveAlert[] = [];
  if (!metrics.runtimeReady) alerts.push({ code: 'RUNTIME_NOT_READY', severity: 'CRITICAL', message: metrics.runtimeBlockers.join('; ') || 'runtime not ready' });
  if (metrics.finance.pendingEntries > 0) alerts.push({ code: 'BOOKKEEPING_PENDING', severity: 'ATTENTION', message: `${metrics.finance.pendingEntries} bookkeeping entries await approval` });
  if (metrics.work.blockedTasks > 0) alerts.push({ code: 'BLOCKED_TASKS', severity: 'ATTENTION', message: `${metrics.work.blockedTasks} tasks are blocked` });
  if (metrics.work.unresolvedDissent > 0) alerts.push({ code: 'UNRESOLVED_DISSENT', severity: 'ATTENTION', message: `${metrics.work.unresolvedDissent} meeting dissent items remain unresolved` });
  return {
    tenantId: metrics.tenantId,
    generatedAt: metrics.measuredAt,
    metrics,
    alerts,
    requiresHumanReview: alerts.some(a => a.severity !== 'INFO'),
  };
}

export const EXECUTIVE_OPERATIONS_ROOM_GUARDRAILS = {
  canApproveBookkeeping: false,
  canMoveMoney: false,
  canDeployProduction: false,
  dissentMustBePreserved: true,
};
