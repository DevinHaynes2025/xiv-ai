import { africaIsNotOneMarket, africanCountryProfiles, chinaDeploymentCapability, getCountryProfile, xivIsDeployedInChina } from '../global';
import { createBusinessEvent } from '../realtime/events';
import type { BusinessEvent } from '../realtime/types';
import { mapWorldBankRecord, worldBankAttribution, type WorldBankObservation } from './world-bank';

export function countrySignalFromObservation(observation: WorldBankObservation) {
  const profile = getCountryProfile(observation.countryCode);
  return {
    countryCode: observation.countryCode,
    africanSubregion: profile?.africanSubregion ?? null,
    africaIsOneMarket: africaIsNotOneMarket().oneMarket,
    chinaDeployed: observation.countryCode === 'CN' ? xivIsDeployedInChina() : false,
    chinaReview: observation.countryCode === 'CN' ? chinaDeploymentCapability().dataResidencyRequirement : null,
    statistic: observation.value,
    fabricated: false,
    cadence: observation.cadence,
    attribution: worldBankAttribution(),
    countrySpecific: true,
  };
}

export function businessEventFromWorldBank(
  observation: WorldBankObservation,
): BusinessEvent | { allowed: false; reason: string } {
  if (observation.value === null) {
    return { allowed: false, reason: 'No sourced value. No event.' };
  }
  return createBusinessEvent({
    source: observation.sourceSystem,
    sourceId: observation.sourceRecordId,
    retrievedAt: observation.retrievedAt,
    eventTime: observation.eventTime,
    freshness: observation.freshness,
    jurisdiction: observation.jurisdiction,
    classification: 'public',
    confidence: observation.confidence,
    license: observation.license,
    eventType: 'market_demand_signal',
    entities: [observation.indicatorId],
    countries: [observation.countryCode],
    industries: [],
    evidence: [worldBankAttribution(), observation.sourceRecordId, `period:${observation.period}`],
    impactAssessment: null,
    scope: 'public',
    indicator: observation.indicatorId,
    period: observation.period,
  });
}

export function africaCountryAvailability() {
  return africanCountryProfiles().map((country) => ({
    countryCode: country.countryCode,
    dataAvailability: country.dataAvailability,
    fabricated: false,
    oneMarket: false,
  }));
}

export function missingCountryValueIsFabricated() {
  return false;
}

export function recordedWorldBankFixture() {
  return mapWorldBankRecord({
    country: { id: 'NG', value: 'Nigeria' },
    countryiso3code: 'NGA',
    indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP (current US$)' },
    date: '2023',
    value: null,
  });
}
