export type MacroProvenance = {
  sourceId: string;
  sourceRecordId: string;
  publisher: string;
  retrievedAt: string;
  usageRights: string;
  licenseType: string;
};

export type MacroEconomicObservation = {
  observationId: string;
  seriesId: string;
  period: string;
  value: number | null;
  historical: true;
  live: false;
  provenance: MacroProvenance;
};

export type InterestRateObservation = MacroEconomicObservation & { kind: 'interest_rate' };
export type InflationObservation = MacroEconomicObservation & { kind: 'inflation' };
export type EmploymentObservation = MacroEconomicObservation & { kind: 'employment' };
export type GDPObservation = MacroEconomicObservation & { kind: 'gdp' };
export type TradeObservation = MacroEconomicObservation & { kind: 'trade' };
export type CommodityObservation = MacroEconomicObservation & { kind: 'commodity' };
export type IndustryObservation = MacroEconomicObservation & { kind: 'industry' };
export type RegionalEconomicObservation = MacroEconomicObservation & { kind: 'regional'; country: string };

export function macroObservationIsLive(_observation: MacroEconomicObservation) {
  void _observation;
  return false;
}

export function macroKindFromIndicator(indicatorId: string) {
  if (indicatorId === 'NY.GDP.MKTP.CD') return 'gdp' as const;
  if (indicatorId === 'NY.GDP.MKTP.KD.ZG') return 'gdp_growth' as const;
  if (indicatorId === 'FP.CPI.TOTL.ZG') return 'inflation' as const;
  return 'macro' as const;
}

export function toRegionalEconomicObservation(input: {
  country: string;
  seriesId: string;
  period: string;
  value: number | null;
  provenance: MacroProvenance;
}): RegionalEconomicObservation {
  return {
    observationId: `${input.provenance.sourceRecordId}:regional`,
    seriesId: input.seriesId,
    period: input.period,
    value: input.value,
    historical: true,
    live: false,
    kind: 'regional',
    country: input.country,
    provenance: input.provenance,
  };
}

export function toGdpObservation(input: {
  seriesId: string;
  period: string;
  value: number | null;
  provenance: MacroProvenance;
}): GDPObservation {
  return {
    observationId: `${input.provenance.sourceRecordId}:gdp`,
    seriesId: input.seriesId,
    period: input.period,
    value: input.value,
    historical: true,
    live: false,
    kind: 'gdp',
    provenance: input.provenance,
  };
}

export function toInflationObservation(input: {
  seriesId: string;
  period: string;
  value: number | null;
  provenance: MacroProvenance;
}): InflationObservation {
  return {
    observationId: `${input.provenance.sourceRecordId}:inflation`,
    seriesId: input.seriesId,
    period: input.period,
    value: input.value,
    historical: true,
    live: false,
    kind: 'inflation',
    provenance: input.provenance,
  };
}
