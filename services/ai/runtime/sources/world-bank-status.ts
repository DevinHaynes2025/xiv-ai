/**
 * World Bank 2I-D adapter capability status.
 * LIVE only after a real retrieval is validated with provenance.
 * This is not Global Data Fabric production-live.
 * Legacy WORLD_BANK_PROVIDER_STATUS remains not_configured.
 */
export type WorldBankAdapterCapabilityStatus = 'PROTOTYPE' | 'CONFIGURED' | 'LIVE';

let validatedLive = false;

export function worldBankAdapterCapabilityStatus(): WorldBankAdapterCapabilityStatus {
  return validatedLive ? 'LIVE' : 'CONFIGURED';
}

export function recordWorldBankValidatedRetrieval() {
  validatedLive = true;
}

export function resetWorldBankAdapterStatusForTests() {
  validatedLive = false;
}

export function worldBankGlobalFabricIsProductionLive() {
  return false;
}
