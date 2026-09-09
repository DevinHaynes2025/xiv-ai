import type { TemporalContext, UniverseLifecycleStage } from './types';

export type DayPhase = 'overnight' | 'early_morning' | 'business_hours' | 'evening';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export type OperatingTime = {
  instant: string;
  secondOfDay: number;
  minuteOfHour: number;
  hourOfDay: number;
  dayPhase: DayPhase;
  isWeekday: boolean;
  dayOfWeek: number;
  season: Season;
  fiscalYear: number;
  fiscalQuarter: number;
  fiscalPeriodLabel: string;
  isHoliday: boolean;
  holidayName: string | null;
  calendarSystem: string;
  region: string;
};

export type OperatingTimeOptions = {
  region?: string;
  calendarSystem?: string;
  utcOffsetMinutes?: number;
  fiscalYearStartMonth?: number;
  holidays?: Readonly<Record<string, string>>;
  weekendDays?: readonly number[];
  businessHours?: { start: number; end: number };
};

// Operational time is not a timestamp. An agent that recommends a supplier
// change at 02:00 on a regional holiday during the last week of a fiscal
// quarter is technically correct and practically useless.
export function describeOperatingTime(instant: Date, options?: OperatingTimeOptions): OperatingTime {
  const offsetMinutes = options?.utcOffsetMinutes ?? 0;
  const local = new Date(instant.getTime() + offsetMinutes * 60_000);

  const hourOfDay = local.getUTCHours();
  const minuteOfHour = local.getUTCMinutes();
  const secondOfDay = hourOfDay * 3600 + minuteOfHour * 60 + local.getUTCSeconds();
  const dayOfWeek = local.getUTCDay();
  const weekendDays = options?.weekendDays ?? [0, 6];
  const businessHours = options?.businessHours ?? { start: 9, end: 18 };

  const monthIndex = local.getUTCMonth();
  const fiscalYearStartMonth = options?.fiscalYearStartMonth ?? 1;
  const monthsIntoFiscalYear = (monthIndex + 12 - (fiscalYearStartMonth - 1)) % 12;
  const fiscalQuarter = Math.floor(monthsIntoFiscalYear / 3) + 1;
  const fiscalYear = monthIndex + 1 >= fiscalYearStartMonth ? local.getUTCFullYear() : local.getUTCFullYear() - 1;

  const isoDate = local.toISOString().slice(0, 10);
  const holidayName = options?.holidays?.[isoDate] ?? null;

  return {
    instant: instant.toISOString(),
    secondOfDay,
    minuteOfHour,
    hourOfDay,
    dayPhase: dayPhaseFor(hourOfDay, businessHours),
    isWeekday: !weekendDays.includes(dayOfWeek),
    dayOfWeek,
    season: seasonFor(monthIndex),
    fiscalYear,
    fiscalQuarter,
    fiscalPeriodLabel: `FY${fiscalYear} Q${fiscalQuarter}`,
    isHoliday: holidayName !== null,
    holidayName,
    calendarSystem: options?.calendarSystem ?? 'gregorian',
    region: options?.region ?? 'unspecified',
  };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

// The operating time a meeting is held in, in the shape a meeting record stores.
// Meetings keep this rather than only a timestamp so that a recommendation can be
// read back with the calendar it was made against: "recommend calling the plant"
// means something different at 02:00 on a holiday than at 10:00 on a Tuesday.
export function temporalContextFor(
  instant: Date,
  input: {
    location: string;
    timeZone: string;
    utcOffsetMinutes: number;
    organizationLifecycle: UniverseLifecycleStage;
    businessCycle?: string;
    universeState?: string;
    options?: OperatingTimeOptions;
  },
): TemporalContext {
  const operating = describeOperatingTime(instant, {
    ...input.options,
    region: input.options?.region ?? input.location,
    utcOffsetMinutes: input.utcOffsetMinutes,
  });
  const local = new Date(instant.getTime() + input.utcOffsetMinutes * 60_000);

  return {
    location: input.location,
    timeZone: input.timeZone,
    localTime: local.toISOString().slice(11, 16),
    dayOfWeek: DAY_NAMES[operating.dayOfWeek],
    season: operating.season,
    fiscalPeriod: operating.fiscalPeriodLabel,
    businessCycle: input.businessCycle ?? operating.dayPhase,
    organizationLifecycle: input.organizationLifecycle,
    universeState: input.universeState ?? input.organizationLifecycle,
  };
}

function dayPhaseFor(hour: number, businessHours: { start: number; end: number }): DayPhase {
  if (hour < 5) return 'overnight';
  if (hour < businessHours.start) return 'early_morning';
  if (hour < businessHours.end) return 'business_hours';
  return 'evening';
}

function seasonFor(monthIndex: number): Season {
  if (monthIndex <= 1 || monthIndex === 11) return 'winter';
  if (monthIndex <= 4) return 'spring';
  if (monthIndex <= 7) return 'summer';
  return 'autumn';
}

export type LifecyclePosture = {
  stage: UniverseLifecycleStage;
  posture: string;
  favours: string[];
  avoids: string[];
  approvalBias: 'permissive' | 'balanced' | 'conservative';
};

// A recommendation that fits a seed-stage organization is the wrong
// recommendation for one in transformation. The same agent adapts by reading
// the lifecycle of the universe it serves.
const LIFECYCLE_POSTURES: Record<UniverseLifecycleStage, LifecyclePosture> = {
  created: {
    stage: 'created',
    posture: 'Establish identity, supervision and budgets before any work is scheduled.',
    favours: ['configuration', 'supervisor assignment', 'baseline evaluation'],
    avoids: ['external commitments', 'irreversible change'],
    approvalBias: 'conservative',
  },
  seed: {
    stage: 'seed',
    posture: 'Prove a small number of workflows end to end rather than broadening scope.',
    favours: ['single-team pilots', 'reversible experiments', 'evidence gathering'],
    avoids: ['multi-team rollouts', 'long contracts'],
    approvalBias: 'conservative',
  },
  growth: {
    stage: 'growth',
    posture: 'Scale what already works and keep the cost curve visible.',
    favours: ['repeatable playbooks', 'capacity planning', 'cost telemetry'],
    avoids: ['bespoke one-off work'],
    approvalBias: 'balanced',
  },
  operational: {
    stage: 'operational',
    posture: 'Optimize steady-state execution and protect service continuity.',
    favours: ['incremental optimization', 'risk reduction', 'supplier resilience'],
    avoids: ['unbounded experiments during peak cycles'],
    approvalBias: 'balanced',
  },
  mature: {
    stage: 'mature',
    posture: 'Defend margin and compliance posture; change carries more downside than upside.',
    favours: ['efficiency', 'consolidation', 'audit readiness'],
    avoids: ['speculative expansion'],
    approvalBias: 'conservative',
  },
  transformation: {
    stage: 'transformation',
    posture: 'Sequence change deliberately and keep a rollback path for every step.',
    favours: ['staged migration', 'parallel running', 'explicit rollback plans'],
    avoids: ['simultaneous structural changes'],
    approvalBias: 'conservative',
  },
  archive: {
    stage: 'archive',
    posture: 'Preserve lineage and answer historical questions. No new work is scheduled.',
    favours: ['retention', 'export', 'provenance queries'],
    avoids: ['any new task'],
    approvalBias: 'conservative',
  },
};

export function lifecyclePosture(stage: UniverseLifecycleStage): LifecyclePosture {
  return LIFECYCLE_POSTURES[stage];
}

export function adaptRecommendation(input: {
  stage: UniverseLifecycleStage;
  operatingTime: OperatingTime;
  recommendation: string;
}): { recommendation: string; timing: string; posture: LifecyclePosture } {
  const posture = lifecyclePosture(input.stage);
  const timing = timingAdvice(input.operatingTime);
  return {
    recommendation: `${input.recommendation} (${posture.posture})`,
    timing,
    posture,
  };
}

function timingAdvice(time: OperatingTime) {
  if (time.isHoliday) return `Defer execution: ${time.holidayName} in ${time.region}.`;
  if (!time.isWeekday) return 'Defer execution: outside the regional working week.';
  if (time.dayPhase !== 'business_hours') return 'Prepare now and execute in regional business hours.';
  if (time.fiscalQuarter === 4) return `Execute with finance sign-off: ${time.fiscalPeriodLabel} close is in progress.`;
  return 'Execution window is open.';
}
