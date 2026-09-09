export type FailurePattern = {
  patternId: string;
  factors: readonly string[];
  stance: 'hypothesized' | 'observed';
};

export type SuccessPattern = {
  patternId: string;
  factors: readonly string[];
  stance: 'hypothesized' | 'observed';
};

export type DistressSignal = {
  signalId: string;
  stance: 'forecast';
  bankruptClaim: false;
};

export type GrowthSignal = { signalId: string; stance: 'forecast' };
export type TurnaroundSignal = { signalId: string; stance: 'forecast' };
export type BankruptcyPattern = { patternId: string; authoritativeSource: boolean };
export type RecoveryPattern = { patternId: string; stance: 'hypothesized' };
export type FailureSuccessEvidence = { evidenceId: string; sourceId: string; authoritative: boolean };

export type FailureSuccessReport = {
  distress?: DistressSignal;
  bankruptcyDeclared: boolean;
  stance: 'forecast' | 'observed';
  certainty: false;
};

export const FAILURE_SUCCESS_FACTORS = [
  'cash_pressure',
  'debt',
  'margin_deterioration',
  'inventory_buildup',
  'customer_concentration',
  'supplier_concentration',
  'demand_weakness',
  'expansion_speed',
  'capital_availability',
  'operational_efficiency',
  'market_conditions',
] as const;

export function declareBankruptcy(input: { authoritativeSource: boolean; sourceId?: string | null }) {
  if (!input.authoritativeSource || !input.sourceId) {
    return {
      allowed: false as const,
      bankrupt: false as const,
      reason: 'Bankruptcy status requires an authoritative source.',
    };
  }
  return {
    allowed: true as const,
    bankrupt: true as const,
    stance: 'observed' as const,
    reason: 'Authoritative bankruptcy source accepted as observed, not forecast.',
  };
}

export function createDistressSignal(evidenceIds: readonly string[]): DistressSignal | { allowed: false; reason: string } {
  if (evidenceIds.length === 0) {
    return { allowed: false, reason: 'Distress prediction requires evidence and is a forecast/risk signal.' };
  }
  return {
    signalId: 'distress_forecast',
    stance: 'forecast',
    bankruptClaim: false,
  };
}

export function createGrowthSignal(evidenceIds: readonly string[]): GrowthSignal | { allowed: false; reason: string } {
  if (evidenceIds.length === 0) {
    return { allowed: false, reason: 'Growth signals require evidence and are not a declaration of success.' };
  }
  return { signalId: 'growth_forecast', stance: 'forecast' };
}

export function createTurnaroundSignal(evidenceIds: readonly string[]): TurnaroundSignal | { allowed: false; reason: string } {
  if (evidenceIds.length === 0) {
    return { allowed: false, reason: 'Turnaround signals require evidence.' };
  }
  return { signalId: 'turnaround_forecast', stance: 'forecast' };
}

export function companySignalsFromFacts(input: {
  facts: readonly { metric: string; period: string; value: number; sourceRecordId: string }[];
}) {
  const metrics = new Set(input.facts.map((item) => item.metric));
  if (metrics.size < 2) {
    return {
      declaredSuccess: false as const,
      declaredDistress: false as const,
      bankruptcyDeclared: false as const,
      reason: 'Do not declare a company distressed or successful based on a single metric.',
      growth: null,
      distress: null,
    };
  }
  const revenue = input.facts.filter((item) => item.metric === 'revenue').sort((a, b) => a.period.localeCompare(b.period));
  const income = input.facts.filter((item) => item.metric === 'net_income').sort((a, b) => a.period.localeCompare(b.period));
  const evidenceIds = input.facts.map((item) => item.sourceRecordId);
  const revenueUp =
    revenue.length >= 2 && revenue[0] && revenue[revenue.length - 1] && revenue[revenue.length - 1]!.value > revenue[0]!.value;
  const incomeUp =
    income.length >= 2 && income[0] && income[income.length - 1] && income[income.length - 1]!.value > income[0]!.value;
  return {
    declaredSuccess: false as const,
    declaredDistress: false as const,
    bankruptcyDeclared: false as const,
    inferred:
      revenueUp && incomeUp
        ? 'Revenue and net income both increased across retrieved periods. This is inferred from SEC facts, not a success declaration.'
        : !revenueUp && !incomeUp && revenue.length >= 2 && income.length >= 2
          ? 'Revenue and net income did not both increase. This is inferred, not a distress declaration.'
          : 'Insufficient paired periods for a multi-metric inference.',
    growth: revenueUp && incomeUp ? createGrowthSignal(evidenceIds) : null,
    distress: !revenueUp && !incomeUp && revenue.length >= 2 && income.length >= 2 ? createDistressSignal(evidenceIds) : null,
    stance: 'inferred' as const,
    certainty: false as const,
  };
}
