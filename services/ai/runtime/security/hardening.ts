export type HardeningCheckId =
  | 'session_fixation'
  | 'token_replay'
  | 'tenant_selector_tampering'
  | 'membership_replay'
  | 'stale_authorization_context'
  | 'agent_privilege_drift'
  | 'tool_privilege_drift'
  | 'cross_region_data_movement'
  | 'cache_tenant_leakage'
  | 'event_provenance_tampering';

export function evaluateHardeningCheck(id: HardeningCheckId) {
  return {
    id,
    detected: false,
    stance: 'projected' as const,
    reason: 'Architectural check only. No fake detection.',
  };
}

export function tenantSelectorIsAuthority() {
  return false;
}

export function eventWithoutProvenanceIsValid() {
  return false;
}
