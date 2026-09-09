import type { BusinessFeedItem, FeedItemType } from './types';

export function createFeedItem(input: Omit<BusinessFeedItem, 'feedId'> & { feedId?: string }): BusinessFeedItem {
  return {
    feedId: input.feedId ?? `feed_${input.type}`,
    type: input.type,
    visibility: input.visibility,
    provenance: input.provenance,
    status: input.status,
    event: input.event,
  };
}

export function privateFeedIsNotPublic(item: BusinessFeedItem) {
  return item.visibility !== 'public_external';
}

export const FEED_TYPES: readonly FeedItemType[] = [
  'company_update',
  'business_event',
  'business_case',
  'market_signal',
  'industry_insight',
  'live_business_broadcast',
  'trade_opportunity',
  'innovation_challenge',
];
