import type { RealtimeSourceKind } from './types';

export type RealtimeAdapter = {
  kind: RealtimeSourceKind;
  status: 'not_configured';
  scrape: false;
  fetch(): never;
};

export function createUnavailableRealtimeAdapter(kind: RealtimeSourceKind): RealtimeAdapter {
  return {
    kind,
    status: 'not_configured',
    scrape: false,
    fetch(): never {
      throw new Error(`${kind} adapter is NOT CONFIGURED. Arbitrary scraping is not permitted.`);
    },
  };
}

export function scrapingIsEnabled() {
  return false;
}

export const FUTURE_PUBLIC_PROVIDERS = [
  'market_data',
  'news',
  'business_registries',
  'trade_data',
  'shipping',
  'ports',
  'weather',
  'commodities',
  'filings',
] as const;

export function futureProviderConnected(_kind: (typeof FUTURE_PUBLIC_PROVIDERS)[number]) {
  return false;
}
