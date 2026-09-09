import { companyEntersGlobalBrainAutomatically, evaluateBrainTransfer } from '../fabric';
import type { PocketCachePolicy, PocketClassification } from './types';

export type PocketBrainRecord = {
  recordId: string;
  classification: PocketClassification;
  policy: PocketCachePolicy;
  cached: boolean;
  mayEnterGlobalBrain: false;
};

export function cachePocketRecord(input: {
  recordId: string;
  classification: PocketClassification;
  policy: PocketCachePolicy;
}): PocketBrainRecord | { allowed: false; reason: string } {
  if (input.policy === 'CLOUD_ONLY' || input.classification === 'CLOUD_ONLY' || input.policy === 'OFFLINE_PROHIBITED') {
    return { allowed: false, reason: 'pocket_brain_cannot_cache_cloud_only' };
  }
  return {
    recordId: input.recordId,
    classification: input.classification,
    policy: input.policy,
    cached: true,
    mayEnterGlobalBrain: false,
  };
}

export function pocketPrivateEntersGlobalBrain(record: PocketBrainRecord): boolean {
  if (record.classification === 'TENANT_PRIVATE') return false;
  return companyEntersGlobalBrainAutomatically() || evaluateBrainTransfer({ from: 'company', to: 'global' }).allowed;
}
