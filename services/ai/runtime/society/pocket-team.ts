import { cachePocketRecord } from '../pocket/brain';
import { offlineQueueAuthorizesItself } from '../pocket/offline';
import type { PocketCachePolicy, PocketClassification } from '../pocket/types';

export const POCKET_TEAM_AGENTS = [
  'Pocket Assistant',
  'Pocket Security',
  'Pocket Warehouse',
  'Pocket Inventory',
  'Pocket Document',
  'Pocket Search',
  'Pocket Sync',
] as const;

export function pocketAgentAccessUncachedPrivateData(input: {
  cached: boolean;
  classification: PocketClassification;
  policy: PocketCachePolicy;
}): boolean {
  if (!input.cached) return false;
  const cached = cachePocketRecord({
    recordId: 'pocket-team-1',
    classification: input.classification,
    policy: input.policy,
  });
  return !('allowed' in cached) && cached.cached === true && input.classification === 'TENANT_PRIVATE' && input.policy === 'CLOUD_ONLY';
}

export function pocketAgentBypassesServerAuthority(): boolean {
  return offlineQueueAuthorizesItself();
}
