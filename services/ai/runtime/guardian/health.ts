import type { GuardianCheckId } from './checks';

export type GuardianOverallStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export type GuardianCheckStatus = 'healthy' | 'warning' | 'critical' | 'unknown' | 'skipped' | 'denied';

export type GuardianExecutionMode = 'in_process' | 'injected' | 'trusted_host' | 'unavailable_on_device' | 'denied';

export type GuardianCheckResult = {
  id: GuardianCheckId | 'unknown';
  name: string;
  status: GuardianCheckStatus;
  message: string;
  durationMs: number;
  timestamp: string;
  safeToRun: boolean;
  executionMode: GuardianExecutionMode;
  diagnosis?: string;
  recommendedAction?: string;
  outputSummary?: string;
};

export type GuardianCounts = {
  total: number;
  passed: number;
  warning: number;
  failed: number;
  unknown: number;
};

export type GuardianHealthReport = {
  overallStatus: GuardianOverallStatus;
  prototype: true;
  continuousMonitoring: false;
  developerValidation: true;
  onDemand: true;
  generatedAt: string;
  checks: GuardianCheckResult[];
  counts: GuardianCounts;
  summary: string;
  recommendedActions: string[];
};

export function countChecks(checks: readonly GuardianCheckResult[]): GuardianCounts {
  return {
    total: checks.length,
    passed: checks.filter((check) => check.status === 'healthy').length,
    warning: checks.filter((check) => check.status === 'warning').length,
    failed: checks.filter((check) => check.status === 'critical' || check.status === 'denied').length,
    unknown: checks.filter((check) => check.status === 'unknown' || check.status === 'skipped').length,
  };
}

export function rollupOverall(checks: readonly GuardianCheckResult[]): GuardianOverallStatus {
  if (checks.some((check) => check.status === 'critical')) return 'critical';
  if (checks.some((check) => check.status === 'warning' || check.status === 'denied')) return 'warning';
  if (checks.some((check) => check.status === 'healthy') && checks.every((check) => check.status === 'healthy' || check.status === 'skipped')) {
    return 'healthy';
  }
  return 'unknown';
}

export function summarizeReport(overall: GuardianOverallStatus, counts: GuardianCounts) {
  return `Developer validation · on-demand · not continuous monitoring. Overall ${overall}. ${counts.passed} passed, ${counts.warning} warning, ${counts.failed} failed, ${counts.unknown} unknown/skipped.`;
}
