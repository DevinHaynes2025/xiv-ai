import { evaluateKpi, type KpiObservation, type KpiResult } from './kpi-engine';

export type KpiSchedule = {
  id: string;
  metric: string;
  cadenceMinutes: number;
  enabled: boolean;
  tenantId: string;
  universeId: string;
};

const schedules = new Map<string, KpiSchedule>();

export function registerKpiSchedule(schedule: KpiSchedule) {
  if (!schedule.tenantId || !schedule.universeId) throw new Error('tenantId and universeId are required');
  if (!Number.isFinite(schedule.cadenceMinutes) || schedule.cadenceMinutes < 5 || schedule.cadenceMinutes > 1440) {
    throw new Error('cadenceMinutes must be between 5 and 1440');
  }
  schedules.set(schedule.id, { ...schedule });
  return schedule;
}

export function evaluateScheduledObservation(scheduleId: string, observation: KpiObservation): KpiResult {
  const schedule = schedules.get(scheduleId);
  if (!schedule) throw new Error('unknown KPI schedule');
  if (!schedule.enabled) throw new Error('KPI schedule disabled');
  if (schedule.metric !== observation.metric) throw new Error('metric mismatch');
  return evaluateKpi(observation);
}

export function kpiScheduleStats() {
  const values = [...schedules.values()];
  return {
    registered: values.length,
    enabled: values.filter((item) => item.enabled).length,
    minimumCadenceMinutes: 5,
    productionEffect: false as const,
  };
}
