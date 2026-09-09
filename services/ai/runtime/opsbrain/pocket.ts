import { cachePocketRecord } from '../pocket/brain';
import { offlineQueueAuthorizesItself } from '../pocket/offline';
import type { PocketCachePolicy, PocketClassification } from '../pocket/types';

export type PocketAuthorizedCache =
  | 'assigned_tasks'
  | 'recent_company_context'
  | 'approved_documents'
  | 'inventory_tasks'
  | 'supplier_contacts'
  | 'meeting_notes'
  | 'recent_agent_reports'
  | 'maps_routes'
  | 'forms'
  | 'pending_actions';

export function cachePocketAuthorized(input: {
  kind: PocketAuthorizedCache;
  classification: PocketClassification;
  policy: PocketCachePolicy;
}) {
  return cachePocketRecord({
    recordId: input.kind,
    classification: input.classification,
    policy: input.policy,
  });
}

export function pocketBypassesServerAuthorization(): false {
  void offlineQueueAuthorizesItself();
  return false;
}
