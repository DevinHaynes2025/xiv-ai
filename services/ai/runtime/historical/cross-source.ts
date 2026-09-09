import type { ObservedIndicatorSnapshot } from './time-machine';

export type CrossSourceContext = {
  companyPeriod: string;
  cik: string;
  companyFacts: readonly { metric: string; value: number; sourceRecordId: string }[];
  macro: readonly ObservedIndicatorSnapshot[];
  causalClaim: false;
  question: string;
  answer: string;
  limitations: readonly string[];
};

export function macroSurroundingCompanyPeriod(input: {
  cik: string;
  companyPeriod: string;
  companyFacts: readonly { metric: string; value: number; sourceRecordId: string }[];
  macro: readonly ObservedIndicatorSnapshot[];
}): CrossSourceContext | { allowed: false; reason: string } {
  if (!input.cik || !input.companyPeriod) {
    return { allowed: false, reason: 'Cross-source context requires company CIK and period provenance.' };
  }
  if (input.macro.some((item) => !item.sourceRecordId)) {
    return { allowed: false, reason: 'Cross-source provenance missing on a macro observation.' };
  }
  const surrounding = input.macro.filter((item) => item.period === input.companyPeriod || item.period.startsWith(input.companyPeriod));
  const lines = surrounding.map((item) => `${item.indicatorName}=${item.value ?? 'null'} (${item.sourceRecordId})`);
  return {
    companyPeriod: input.companyPeriod,
    cik: input.cik,
    companyFacts: input.companyFacts,
    macro: surrounding,
    causalClaim: false,
    question: 'What macroeconomic conditions surrounded this company\'s observed financial period?',
    answer:
      surrounding.length === 0
        ? `No retrieved macro observation matched period ${input.companyPeriod}. Missing values are not fabricated.`
        : `Retrieved public macro observations for ${input.companyPeriod}: ${lines.join('; ')}`,
    limitations: [
      'Macro conditions are historical context, not a causal claim about company performance.',
      'World Bank and SEC provenance are retained separately.',
      'Private Company Brain data is not used.',
    ],
  };
}

export function crossSourceClaimsCausation() {
  return false;
}
