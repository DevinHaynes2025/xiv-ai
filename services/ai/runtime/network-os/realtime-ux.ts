/**
 * Real-time intelligence UX contracts. Never fake live data.
 */
export type RealtimeSignalKind =
  | 'market'
  | 'economic'
  | 'company_alert'
  | 'supply_chain'
  | 'customer'
  | 'event'
  | 'business_news_metadata'
  | 'agent_observation';

export type RealtimeSignalCard = {
  kind: RealtimeSignalKind;
  source: string;
  timestamp: string;
  freshness: 'fresh' | 'aging' | 'stale' | 'unknown' | 'not_connected';
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  connected: boolean;
  liveLabel: 'LIVE' | 'NOT CONNECTED';
};

export function realtimeSignalCard(input: {
  kind: RealtimeSignalKind;
  source: string;
  timestamp: string;
  connected: boolean;
  freshness?: RealtimeSignalCard['freshness'];
  confidence?: RealtimeSignalCard['confidence'];
}): RealtimeSignalCard {
  return {
    kind: input.kind,
    source: input.source,
    timestamp: input.timestamp,
    freshness: input.connected ? input.freshness ?? 'unknown' : 'not_connected',
    confidence: input.confidence ?? 'unknown',
    connected: input.connected,
    liveLabel: input.connected ? 'LIVE' : 'NOT CONNECTED',
  };
}

export function fakeLiveSignalsEnabled() {
  return false;
}
