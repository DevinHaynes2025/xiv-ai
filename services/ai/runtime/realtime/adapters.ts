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
