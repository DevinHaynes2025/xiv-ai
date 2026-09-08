/**
 * Phase 2I-AB Supply Chain Intelligence Graph + Information Logistics contracts.
 * Parallel Universes = logical namespaces/graph contexts — NOT physical alternate universes.
 * Extreme scale = ENGINEERING_CAPACITY_TARGET / NOT PROVEN.
 * Supplier adapters start NOT_CONFIGURED. Do not scrape private supplier systems.
 */

export type SupplierVerificationState =
  | 'SELF_REPORTED'
  | 'DOCUMENT_VERIFIED'
  | 'REGISTRY_VERIFIED'
  | 'PUBLIC_SOURCE'
  | 'BUYER_CONFIRMED'
  | 'INFERRED'
  | 'UNKNOWN';

export type SupplyChainNodeKind =
  | 'RAW_MATERIAL'
  | 'PROCESSOR'
  | 'SUPPLIER'
  | 'COMPONENT'
  | 'MANUFACTURER'
  | 'FACTORY'
  | 'WAREHOUSE'
  | 'PORT'
  | 'CARRIER'
  | 'DISTRIBUTION_CENTER'
  | 'STORE'
  | 'ECOMMERCE'
  | 'CUSTOMER'
  | 'RETURN'
  | 'REPAIR'
  | 'RECYCLE';

export type InformationLogisticsStage =
  | 'SOURCE'
  | 'INGEST'
  | 'CLASSIFY'
  | 'VERIFY'
  | 'ROUTE'
  | 'STORE'
  | 'INDEX'
  | 'ANALYZE'
  | 'DECIDE'
  | 'ACT'
  | 'MEASURE'
  | 'LEARN';

export type UniverseFabricKind =
  | 'PersonalUniverse'
  | 'CompanyUniverse'
  | 'SupplierUniverse'
  | 'IndustryUniverse'
  | 'CommunityUniverse'
  | 'ResearchUniverse'
  | 'HistoricalUniverse'
  | 'PublicIntelligenceUniverse';

export type ContinuousImprovementStage =
  | 'OBSERVE'
  | 'MEASURE'
  | 'ANALYZE'
  | 'HYPOTHESIZE'
  | 'PLAN'
  | 'SANDBOX'
  | 'REVIEW'
  | 'APPROVE'
  | 'ACT'
  | 'LEARN';

export type ScalePartitionKind =
  | 'REGIONAL'
  | 'TENANT'
  | 'GRAPH'
  | 'VECTOR'
  | 'OBJECT_STORAGE'
  | 'STREAM'
  | 'QUEUE'
  | 'CACHE'
  | 'SEARCH'
  | 'LAKEHOUSE'
  | 'CDN_EDGE'
  | 'BACKPRESSURE'
  | 'RATE_LIMIT'
  | 'QUOTA'
  | 'FAILOVER'
  | 'DISASTER_RECOVERY';

export type VisualGraphKind =
  | 'GLOBAL_SUPPLY_CHAIN'
  | 'INFORMATION_LOGISTICS'
  | 'SUPPLIER_NETWORK'
  | 'CLOUD_RESOURCE'
  | 'AGENT_COLLABORATION'
  | 'COMPANY_BRAIN'
  | 'PRODUCT_JOURNEY'
  | 'LOCATION_MAP'
  | 'DATA_LINEAGE'
  | 'UNIVERSE_MAP';

export type SupplierCommerceAdapterKind =
  | 'ALIBABA_TYPE'
  | 'TEMU_PDD_OFFICIAL'
  | 'AMAZON_BUSINESS'
  | 'RETAILER_PORTAL'
  | 'MANUFACTURER_PORTAL'
  | 'DISTRIBUTOR_PORTAL'
  | 'WHOLESALER_API'
  | 'LOGISTICS_API'
  | 'PROCUREMENT_API'
  | 'TRADE_DB'
  | 'COMPANY_SUPPLIER_DB';

export type LocationV3Purpose =
  | 'SUPPLY_CHAIN_FACILITY_MAP'
  | 'SHIPMENT_CORRIDOR'
  | 'SUPPLIER_PROXIMITY'
  | 'WAREHOUSE_YARD'
  | 'PORT_TERMINAL'
  | 'LAST_MILE_CONTEXT'
  | 'FIELD_PROCUREMENT'
  | 'BUSINESS_TRAVEL_CONTEXT';

export const SUPPLY_CHAIN_NODE_KINDS: readonly SupplyChainNodeKind[] = [
  'RAW_MATERIAL',
  'PROCESSOR',
  'SUPPLIER',
  'COMPONENT',
  'MANUFACTURER',
  'FACTORY',
  'WAREHOUSE',
  'PORT',
  'CARRIER',
  'DISTRIBUTION_CENTER',
  'STORE',
  'ECOMMERCE',
  'CUSTOMER',
  'RETURN',
  'REPAIR',
  'RECYCLE',
] as const;

export const INFORMATION_LOGISTICS_STAGES: readonly InformationLogisticsStage[] = [
  'SOURCE',
  'INGEST',
  'CLASSIFY',
  'VERIFY',
  'ROUTE',
  'STORE',
  'INDEX',
  'ANALYZE',
  'DECIDE',
  'ACT',
  'MEASURE',
  'LEARN',
] as const;

export const UNIVERSE_FABRIC_KINDS: readonly UniverseFabricKind[] = [
  'PersonalUniverse',
  'CompanyUniverse',
  'SupplierUniverse',
  'IndustryUniverse',
  'CommunityUniverse',
  'ResearchUniverse',
  'HistoricalUniverse',
  'PublicIntelligenceUniverse',
] as const;

export const CONTINUOUS_IMPROVEMENT_STAGES: readonly ContinuousImprovementStage[] = [
  'OBSERVE',
  'MEASURE',
  'ANALYZE',
  'HYPOTHESIZE',
  'PLAN',
  'SANDBOX',
  'REVIEW',
  'APPROVE',
  'ACT',
  'LEARN',
] as const;

export const SCALE_PARTITION_KINDS: readonly ScalePartitionKind[] = [
  'REGIONAL',
  'TENANT',
  'GRAPH',
  'VECTOR',
  'OBJECT_STORAGE',
  'STREAM',
  'QUEUE',
  'CACHE',
  'SEARCH',
  'LAKEHOUSE',
  'CDN_EDGE',
  'BACKPRESSURE',
  'RATE_LIMIT',
  'QUOTA',
  'FAILOVER',
  'DISASTER_RECOVERY',
] as const;

export const VISUAL_GRAPH_KINDS: readonly VisualGraphKind[] = [
  'GLOBAL_SUPPLY_CHAIN',
  'INFORMATION_LOGISTICS',
  'SUPPLIER_NETWORK',
  'CLOUD_RESOURCE',
  'AGENT_COLLABORATION',
  'COMPANY_BRAIN',
  'PRODUCT_JOURNEY',
  'LOCATION_MAP',
  'DATA_LINEAGE',
  'UNIVERSE_MAP',
] as const;

export const SUPPLIER_COMMERCE_ADAPTERS: readonly SupplierCommerceAdapterKind[] = [
  'ALIBABA_TYPE',
  'TEMU_PDD_OFFICIAL',
  'AMAZON_BUSINESS',
  'RETAILER_PORTAL',
  'MANUFACTURER_PORTAL',
  'DISTRIBUTOR_PORTAL',
  'WHOLESALER_API',
  'LOGISTICS_API',
  'PROCUREMENT_API',
  'TRADE_DB',
  'COMPANY_SUPPLIER_DB',
] as const;

export const SUPPLIER_VERIFICATION_STATES: readonly SupplierVerificationState[] = [
  'SELF_REPORTED',
  'DOCUMENT_VERIFIED',
  'REGISTRY_VERIFIED',
  'PUBLIC_SOURCE',
  'BUYER_CONFIRMED',
  'INFERRED',
  'UNKNOWN',
] as const;

export const LOCATION_V3_PURPOSES: readonly LocationV3Purpose[] = [
  'SUPPLY_CHAIN_FACILITY_MAP',
  'SHIPMENT_CORRIDOR',
  'SUPPLIER_PROXIMITY',
  'WAREHOUSE_YARD',
  'PORT_TERMINAL',
  'LAST_MILE_CONTEXT',
  'FIELD_PROCUREMENT',
  'BUSINESS_TRAVEL_CONTEXT',
] as const;
