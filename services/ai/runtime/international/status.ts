/**
 * International provider capability status.
 * LIVE only after a real retrieval is validated with provenance.
 * This is not Global Data Fabric production-live.
 */
import type { InternationalCompanySourceState } from './types';

export type GleifAdapterCapabilityStatus = 'PROTOTYPE' | 'CONFIGURED' | 'LIVE';

let gleifValidatedLive = false;

export function gleifAdapterCapabilityStatus(): GleifAdapterCapabilityStatus {
  return gleifValidatedLive ? 'LIVE' : 'PROTOTYPE';
}

export function internationalProviderSourceState(): InternationalCompanySourceState {
  return gleifValidatedLive ? 'AUTHORIZED' : 'NOT_CONFIGURED';
}

export function recordGleifValidatedRetrieval() {
  gleifValidatedLive = true;
}

export function resetGleifAdapterStatusForTests() {
  gleifValidatedLive = false;
}

export function authorizeInternationalProviderAfterProof(input: { proofSucceeded: boolean }) {
  if (!input.proofSucceeded) {
    return { allowed: false as const, state: internationalProviderSourceState(), reason: 'Proof did not succeed. Provider stays NOT_CONFIGURED.' };
  }
  if (!gleifValidatedLive) {
    return { allowed: false as const, state: internationalProviderSourceState(), reason: 'Authorization requires a validated retrieval, not configuration.' };
  }
  return { allowed: true as const, state: 'AUTHORIZED' as const };
}

export function gleifGlobalFabricIsProductionLive() {
  return false;
}

export function companiesHouseProviderId() {
  return 'uk_companies_house' as const;
}

export function companiesHouseSourceState(): InternationalCompanySourceState {
  return 'NOT_CONFIGURED';
}

export function companiesHouseBlocker() {
  return 'UK Companies House REST API requires an API key. Unauthenticated requests return 401 Empty Authorization header. No key is configured in this environment.';
}
