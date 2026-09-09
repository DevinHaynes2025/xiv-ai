import { HASH_REF_BYTES, LEAN_WASTE_KINDS, type LeanWasteKind } from './information-economy-types';

export type BullwhipTrace = {
  demandId: string;
  fingerprint: string;
  searches: number;
  contextCopies: number;
  modelCalls: number;
  storageWrites: number;
  trafficBytes: number;
  inventoryHit: boolean;
};

export type BullwhipDetection = {
  detected: boolean;
  wastes: LeanWasteKind[];
  amplification: number;
  searches: number;
  contextCopies: number;
  modelCalls: number;
  storageWrites: number;
  trafficBytes: number;
  reason: string;
};

export type BullwhipReduction = {
  before: BullwhipTrace;
  after: BullwhipTrace;
  reduced: boolean;
  savedSearches: number;
  savedModelCalls: number;
  savedStorageWrites: number;
  savedTrafficBytes: number;
  savedContextCopies: number;
};

export function wastefulBullwhipTrace(input: {
  demandId: string;
  fingerprint: string;
  inventoryHit: boolean;
}): BullwhipTrace {
  return {
    demandId: input.demandId,
    fingerprint: input.fingerprint,
    searches: 8,
    contextCopies: 6,
    modelCalls: input.inventoryHit ? 4 : 3,
    storageWrites: 5,
    trafficBytes: 48_000,
    inventoryHit: input.inventoryHit,
  };
}

export function leanTraceForFulfillment(input: {
  demandId: string;
  fingerprint: string;
  inventoryHit: boolean;
  firstWrite: boolean;
}): BullwhipTrace {
  return {
    demandId: input.demandId,
    fingerprint: input.fingerprint,
    searches: 1,
    contextCopies: 1,
    modelCalls: 0,
    storageWrites: input.inventoryHit || !input.firstWrite ? 0 : 1,
    trafficBytes: input.inventoryHit ? 0 : HASH_REF_BYTES,
    inventoryHit: input.inventoryHit,
  };
}

export function detectInformationBullwhip(trace: BullwhipTrace): BullwhipDetection {
  const wastes: LeanWasteKind[] = [];
  if (trace.searches > 1) wastes.push('repeated_searches');
  if (trace.contextCopies > 1) wastes.push('duplicated_context');
  if (trace.inventoryHit && trace.modelCalls > 0) wastes.push('unnecessary_model_calls');
  if (!trace.inventoryHit && trace.modelCalls > 1) wastes.push('unnecessary_model_calls');
  if (trace.storageWrites > 1) wastes.push('duplicate_storage');
  if (trace.trafficBytes > HASH_REF_BYTES && trace.inventoryHit) wastes.push('excessive_traffic');
  if (!trace.inventoryHit && trace.trafficBytes > HASH_REF_BYTES * 4) wastes.push('excessive_traffic');
  if (trace.trafficBytes > HASH_REF_BYTES && trace.contextCopies > 1) wastes.push('overprocessing_full_copy');

  const activity = trace.searches + trace.contextCopies + trace.modelCalls + trace.storageWrites;
  const amplification = activity / 1;
  const detected = wastes.length > 0 && amplification > 2;
  return {
    detected,
    wastes: wastes.filter((kind, index) => wastes.indexOf(kind) === index),
    amplification,
    searches: trace.searches,
    contextCopies: trace.contextCopies,
    modelCalls: trace.modelCalls,
    storageWrites: trace.storageWrites,
    trafficBytes: trace.trafficBytes,
    reason: detected
      ? `Information bullwhip detected: one demand amplified into ${wastes.join(', ')}.`
      : 'No information bullwhip. Freight stayed at one search, one ref, no extra model call.',
  };
}

export function reduceInformationBullwhip(trace: BullwhipTrace): BullwhipReduction {
  const after: BullwhipTrace = {
    demandId: trace.demandId,
    fingerprint: trace.fingerprint,
    searches: 1,
    contextCopies: 1,
    modelCalls: 0,
    storageWrites: trace.inventoryHit ? 0 : 1,
    trafficBytes: trace.inventoryHit ? 0 : HASH_REF_BYTES,
    inventoryHit: trace.inventoryHit,
  };
  return {
    before: trace,
    after,
    reduced:
      after.searches < trace.searches ||
      after.modelCalls < trace.modelCalls ||
      after.storageWrites < trace.storageWrites ||
      after.trafficBytes < trace.trafficBytes,
    savedSearches: Math.max(0, trace.searches - after.searches),
    savedModelCalls: Math.max(0, trace.modelCalls - after.modelCalls),
    savedStorageWrites: Math.max(0, trace.storageWrites - after.storageWrites),
    savedTrafficBytes: Math.max(0, trace.trafficBytes - after.trafficBytes),
    savedContextCopies: Math.max(0, trace.contextCopies - after.contextCopies),
  };
}

export function analyzeLeanWaste(trace: BullwhipTrace) {
  const detection = detectInformationBullwhip(trace);
  return {
    kinds: LEAN_WASTE_KINDS,
    present: detection.wastes,
    detected: detection.detected,
    reason: detection.reason,
  };
}

export function costToServe(trace: BullwhipTrace) {
  const costUnits =
    trace.searches * 1 + trace.contextCopies * 1 + trace.modelCalls * 10 + trace.storageWrites * 2 + trace.trafficBytes / 1024;
  return {
    costUnits,
    verifiedSavings: false as const,
    epistemicClass: 'SIMULATION' as const,
    searches: trace.searches,
    modelCalls: trace.modelCalls,
    storageWrites: trace.storageWrites,
    trafficBytes: trace.trafficBytes,
  };
}
