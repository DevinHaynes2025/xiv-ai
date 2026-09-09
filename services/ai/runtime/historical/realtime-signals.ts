export type RealtimeSignalFreshness = 'fresh' | 'aging' | 'stale' | 'unknown' | 'not_configured';

export type RealtimeProviderConnection = {
  providerId: string;
  status: 'not_configured';
  streamingInfrastructureClaimed: false;
};

export type RealtimeBusinessSignal = {
  signalId: string;
  freshness: RealtimeSignalFreshness;
  live: false;
};

export type RealtimeEconomicSignal = RealtimeBusinessSignal & { kind: 'economic' };
export type RealtimeMarketSignal = RealtimeBusinessSignal & { kind: 'market' };
export type RealtimeSupplyChainSignal = RealtimeBusinessSignal & { kind: 'supply_chain' };
export type RealtimeNewsSignal = RealtimeBusinessSignal & { kind: 'news_metadata' };

export function realtimeStreamingExists() {
  return false;
}

export function createRealtimeProviderConnection(providerId: string): RealtimeProviderConnection {
  return {
    providerId,
    status: 'not_configured',
    streamingInfrastructureClaimed: false,
  };
}
