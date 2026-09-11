export type UsageEventType = 'VIEW' | 'SESSION_START' | 'SESSION_END' | 'ACTIVE_USER' | 'FEATURE_USE' | 'MARKETPLACE_OPEN';

export interface UsageEvent {
  eventId: string;
  tenantId: string;
  actorHash: string;
  type: UsageEventType;
  occurredAt: string;
  surface?: string;
  feature?: string;
}

export interface UsageSnapshot {
  views: number;
  uniqueUsers: number;
  sessions: number;
  featureUses: number;
}

export class UsageAnalyticsLedger {
  private events: UsageEvent[] = [];

  append(event: UsageEvent) {
    if (!event.tenantId || !event.actorHash) throw new Error('tenant and pseudonymous actor hash required');
    this.events.push(event);
  }

  snapshot(tenantId: string): UsageSnapshot {
    const rows = this.events.filter(e => e.tenantId === tenantId);
    return {
      views: rows.filter(e => e.type === 'VIEW').length,
      uniqueUsers: new Set(rows.map(e => e.actorHash)).size,
      sessions: rows.filter(e => e.type === 'SESSION_START').length,
      featureUses: rows.filter(e => e.type === 'FEATURE_USE').length,
    };
  }
}

export const USAGE_ANALYTICS_GUARDRAILS = {
  rawSecretsInTelemetryAllowed: false,
  crossTenantAggregationAllowedWithoutPolicy: false,
  pseudonymousActorIdsPreferred: true,
  userCountRequiresMeasuredEvents: true,
};
