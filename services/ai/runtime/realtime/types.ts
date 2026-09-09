export type RealtimeSourceKind =
  | 'company_authorized_api'
  | 'financial_market'
  | 'business_news'
  | 'government'
  | 'economic'
  | 'shipping_logistics'
  | 'supplier'
  | 'weather'
  | 'commodity'
  | 'trade_statistics'
  | 'company_filing'
  | 'business_registry'
  | 'erp'
  | 'crm'
  | 'wms'
  | 'tms';

export type LicenseUseStatus = {
  licenseStatus: 'unknown' | 'restricted' | 'permitted' | 'not_configured';
  attributionRequired: boolean | 'unknown';
  redistributionAllowed: boolean | 'unknown';
  retentionLimit: string | null;
};

export type RealtimeItem = {
  source: string;
  sourceId: string;
  retrievedAt: string;
  eventTime: string | null;
  freshness: 'fresh' | 'aging' | 'stale' | 'unknown' | 'not_configured';
  jurisdiction: string | null;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  confidence: 'low' | 'medium' | 'high' | 'not_measured';
  license: LicenseUseStatus;
};

export type BusinessEventType =
  | 'supplier_disruption'
  | 'port_disruption'
  | 'company_earnings'
  | 'regulatory_announcement'
  | 'facility_opening'
  | 'facility_closure'
  | 'product_launch'
  | 'investment'
  | 'merger'
  | 'acquisition'
  | 'leadership_change'
  | 'labor_disruption'
  | 'transport_disruption'
  | 'commodity_change'
  | 'currency_movement'
  | 'market_demand_signal'
  | 'cybersecurity_incident'
  | 'new_partnership';

export type BusinessEvent = RealtimeItem & {
  eventId: string;
  eventType: BusinessEventType;
  entities: readonly string[];
  countries: readonly string[];
  industries: readonly string[];
  evidence: readonly string[];
  impactAssessment: string | null;
  scope: 'public' | 'organization' | 'universe';
  indicator?: string;
  period?: string;
};

export type FeedItemType =
  | 'company_update'
  | 'business_event'
  | 'business_case'
  | 'market_signal'
  | 'industry_insight'
  | 'live_business_broadcast'
  | 'trade_opportunity'
  | 'innovation_challenge';

export type BusinessFeedItem = {
  feedId: string;
  type: FeedItemType;
  visibility: 'public_external' | 'private_organization';
  provenance: string;
  status: 'prototype' | 'not_configured' | 'public_source';
  event?: BusinessEvent;
};
