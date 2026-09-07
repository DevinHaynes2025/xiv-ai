export type WorkPriority =
  | 'security_incident'
  | 'tenant_authorization'
  | 'executive_request'
  | 'business_event'
  | 'background_learning'
  | 'recommendation_refresh';

const PRIORITY: Record<WorkPriority, number> = {
  security_incident: 100,
  tenant_authorization: 90,
  executive_request: 70,
  business_event: 50,
  background_learning: 20,
  recommendation_refresh: 10,
};

export type OverloadAction = 'queue' | 'defer' | 'drop_duplicate' | 'degrade';

export function workPriority(kind: WorkPriority) {
  return PRIORITY[kind];
}

export function decideOverload(kind: WorkPriority, options?: { duplicate?: boolean }): OverloadAction {
  if (kind === 'security_incident' || kind === 'tenant_authorization') {
    return 'queue';
  }
  if (options?.duplicate) return 'drop_duplicate';
  if (kind === 'background_learning' || kind === 'recommendation_refresh') return 'defer';
  return 'degrade';
}

export function maySilentlyDrop(kind: WorkPriority) {
  return kind !== 'security_incident';
}

export function protectCriticalSecurityWork(kind: WorkPriority) {
  if (kind === 'security_incident') {
    return { drop: false, action: 'queue' as const, silentDropForbidden: true };
  }
  return { drop: false, action: decideOverload(kind), silentDropForbidden: kind === 'tenant_authorization' };
}
