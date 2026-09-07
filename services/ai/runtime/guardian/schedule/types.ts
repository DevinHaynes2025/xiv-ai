export type ScheduledCheckKind =
  | 'health'
  | 'dependency'
  | 'runtime_tests'
  | 'agent_health'
  | 'source_freshness'
  | 'policy'
  | 'security_posture';

export type CheckSchedule = {
  scheduleId: string;
  kind: ScheduledCheckKind;
  cadence: 'manual' | 'hourly' | 'daily' | 'weekly';
  provider: 'unbound';
  mutatesCode: false;
};

export type ScheduledCheck = {
  checkId: string;
  scheduleId: string;
  kind: ScheduledCheckKind;
};

export type CheckRun = {
  runId: string;
  checkId: string;
  startedAt: string;
  finishedAt: string | null;
};

export type CheckResultStatus = 'healthy' | 'degraded' | 'warning' | 'failed' | 'unknown';

export type CheckResult = {
  runId: string;
  checkId: string;
  status: CheckResultStatus;
  summary: string;
  mutatesCode: false;
};

export type CheckEscalation = {
  resultRunId: string;
  incidentId: string | null;
  circuitOpened: boolean;
  humanReviewRequired: true;
};
