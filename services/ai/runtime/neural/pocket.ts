export type PocketBrainV3 = {
  encrypted: true;
  offlineActionIsServerAuthorization: false;
};

export type PocketCacheKind =
  | 'assigned_tasks'
  | 'approved_company_context'
  | 'approved_documents'
  | 'recent_messages'
  | 'warehouse_work'
  | 'supplier_contacts'
  | 'saved_research'
  | 'travel_itinerary'
  | 'pending_forms'
  | 'draft_ideas'
  | 'pending_actions';

export function cachePocketV3(input: {
  kind: PocketCacheKind;
  classification: 'ALLOWED_OFFLINE' | 'CLOUD_ONLY';
  policy: 'ALLOWED_OFFLINE' | 'CLOUD_ONLY';
}) {
  if (input.classification === 'CLOUD_ONLY' || input.policy === 'CLOUD_ONLY') {
    return { allowed: false as const, reason: 'cloud_only_cannot_cache' };
  }
  return {
    allowed: true as const,
    cache: { kind: input.kind, encrypted: true as const },
    becomesServerAuthority: false as const,
  };
}

export function syncOfflineAction(input: {
  signed: boolean;
  reauthenticated: boolean;
  guardianApproved: boolean;
  tenantVerified: boolean;
  universeVerified: boolean;
}) {
  if (!(input.signed && input.reauthenticated && input.guardianApproved && input.tenantVerified && input.universeVerified)) {
    return { allowed: false as const, reason: 'offline_action_requires_reconnect_authority' };
  }
  return { allowed: true as const, offlineEqualsServerAuth: false as const };
}

export function offlineEscalatesPrivilege(): false {
  return false;
}
