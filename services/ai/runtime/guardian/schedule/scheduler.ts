import { createId, nowIso } from '../../actions';
import type { CheckResult, CheckSchedule, CheckResultStatus, ScheduledCheckKind } from './types';

export type SchedulerProvider = {
  name: 'cron' | 'queue_worker' | 'cloud_scheduler' | 'none';
  status: 'not_configured';
  bind(): never;
};

export function createUnboundScheduler(): SchedulerProvider {
  return {
    name: 'none',
    status: 'not_configured',
    bind(): never {
      throw new Error('Guardian scheduler is provider-neutral and NOT CONFIGURED.');
    },
  };
}

export function defineSchedule(kind: ScheduledCheckKind, cadence: CheckSchedule['cadence']): CheckSchedule {
  return {
    scheduleId: createId('gsch'),
    kind,
    cadence,
    provider: 'unbound',
    mutatesCode: false,
  };
}

export function runScheduledCheck(kind: ScheduledCheckKind, status: CheckResultStatus = 'unknown'): CheckResult {
  return {
    runId: createId('grun'),
    checkId: `chk_${kind}`,
    status,
    summary: `Scheduled ${kind} architecture ran in-process. This is not 24/7 production monitoring.`,
    mutatesCode: false,
  };
}

export function scheduledGuardianMutatesCode() {
  return false;
}

export function scheduledCheckStartedAt() {
  return nowIso();
}
