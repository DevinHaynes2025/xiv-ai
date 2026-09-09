export type GlobalEventKind =
  | 'shipment_delayed'
  | 'supplier_outage'
  | 'inventory_shortage'
  | 'security_alert'
  | 'financial_anomaly'
  | 'regulatory_update'
  | 'customer_escalation'
  | 'warehouse_congestion'
  | 'production_stoppage'
  | 'system_degradation';

export type EventSource = { sourceId: string };
export type EventClassification = { classification: 'PUBLIC' | 'TENANT_PRIVATE' };
export type EventTenant = { tenantId: string };
export type EventUniverse = { universeId: string };
export type EventTimestamp = { at: string };
export type EventEvidence = { evidenceId: string };
export type EventConfidence = { level: 'low' | 'medium' | 'high'; certainty: false };
export type EventRoute = { tenantId: string; universeId: string };
export type EventConsumer = { consumerId: string; tenantId: string; universeId: string };
export type EventRetention = { policy: string };
export type EventAudit = { eventId: string };

export type GlobalEvent = {
  eventId: string;
  kind: GlobalEventKind;
  tenantId: string;
  universeId: string;
};

export function routeGlobalEvent(input: {
  event: GlobalEvent;
  consumerTenantId: string;
  consumerUniverseId: string;
}) {
  if (input.event.tenantId !== input.consumerTenantId) {
    return { allowed: false as const, reason: 'event_consumer_cannot_cross_tenant' };
  }
  if (input.event.universeId !== input.consumerUniverseId) {
    return { allowed: false as const, reason: 'event_routing_honors_universe' };
  }
  return { allowed: true as const, routed: true as const };
}
