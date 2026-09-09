/**
 * SEC 2I-D2 adapter capability status.
 * LIVE only after a real retrieval is validated with provenance.
 * This is not Global Data Fabric production-live.
 */
export type SecAdapterCapabilityStatus = 'PROTOTYPE' | 'CONFIGURED' | 'LIVE';

let validatedLive = false;

export function secAdapterCapabilityStatus(): SecAdapterCapabilityStatus {
  return validatedLive ? 'LIVE' : 'CONFIGURED';
}

export function recordSecValidatedRetrieval() {
  validatedLive = true;
}

export function resetSecAdapterStatusForTests() {
  validatedLive = false;
}

export function secGlobalFabricIsProductionLive() {
  return false;
}
