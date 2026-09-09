/**
 * XIV Marketplace shell. Module install remains governed by existing module policy.
 * No arbitrary downloaded executable JS.
 */
export const MARKETPLACE_SECTIONS = [
  'featured',
  'operations',
  'supply_chain',
  'sales',
  'finance',
  'security',
  'analytics',
  'crm',
  'wms',
  'real_estate',
  'insurance',
  'developer_tools',
  'ai',
  'data',
] as const;

export type MarketplaceSection = (typeof MARKETPLACE_SECTIONS)[number];
export type MarketplaceItemKind = 'business_app' | 'ai_agent' | 'industry_pack' | 'data_connector' | 'cloud_integration' | 'developer_module';

export type MarketplaceListing = {
  listingId: string;
  kind: MarketplaceItemKind;
  section: MarketplaceSection;
  title: string;
  executableJsDownload: false;
};

export function createMarketplaceListing(input: {
  listingId: string;
  kind: MarketplaceItemKind;
  section: MarketplaceSection;
  title: string;
}): MarketplaceListing {
  return { ...input, executableJsDownload: false };
}

export function marketplaceAllowsArbitraryExecutableJs() {
  return false;
}
