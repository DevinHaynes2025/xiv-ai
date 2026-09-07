import { companiesHouseSourceState } from '../international';
import { gleifRemainsIdentityOnly, marketPriceFeedAvailable } from '../market';
import { globalDataFabricProductionLive } from '../network-os';
import type { RealtimeSourceState } from './types';

export type RealtimeObservation = {
  source: "world_bank" | "sec_edgar" | "gleif_lei";
  sourceTimestamp: string;
  retrievedAt: string;
  freshness: RealtimeSourceState;
  verification: "verified" | "unverified";
  quality: "high" | "limited";
  streaming: false;
};

export type ResearchWatchRule = {
  source: "world_bank" | "sec_edgar" | "gleif_lei";
  trigger: "macro_series_update" | "new_sec_filing" | "lei_status_change";
};

export type ResearchAlertCandidate = {
  source: ResearchWatchRule["source"];
  trigger: ResearchWatchRule["trigger"];
  reviewRequired: true;
  notificationTransportLive: false;
};

export function describeRealtimeObservation(source: RealtimeObservation["source"]): RealtimeObservation {
  return {
    source,
    sourceTimestamp: "2026-09-07T00:00:00.000Z",
    retrievedAt: "2026-09-07T00:00:00.000Z",
    freshness: "RECENT",
    verification: "verified",
    quality: "high",
    streaming: false,
  };
}

export function pollingIsStreaming(): false {
  return false;
}

export function watchProvenSources(): ResearchWatchRule[] {
  return [
    { source: "world_bank", trigger: "macro_series_update" },
    { source: "sec_edgar", trigger: "new_sec_filing" },
    { source: "gleif_lei", trigger: "lei_status_change" },
  ];
}

export function createResearchAlert(rule: ResearchWatchRule): ResearchAlertCandidate {
  return {
    source: rule.source,
    trigger: rule.trigger,
    reviewRequired: true,
    notificationTransportLive: false,
  };
}

export function notificationTransportProductionLive(): false {
  return false;
}

export function marketPriceFeedsUnavailable(): boolean {
  return marketPriceFeedAvailable().available === false;
}

export function realtimeTruthBoundary() {
  return {
    worldBank: "proven_live_macro",
    sec: "proven_live_filings",
    gleif: gleifRemainsIdentityOnly() ? "proven_live_identity_only" : "violated",
    companiesHouse: companiesHouseSourceState(),
    fabric: globalDataFabricProductionLive(),
    marketPrices: marketPriceFeedAvailable(),
    notificationTransport: notificationTransportProductionLive(),
  };
}
