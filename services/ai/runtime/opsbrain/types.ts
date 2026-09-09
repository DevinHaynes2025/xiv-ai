export type MobileSurface =
  | 'IPHONE'
  | 'IPAD'
  | 'ANDROID_PHONE'
  | 'ANDROID_TABLET'
  | 'RUGGED_WAREHOUSE'
  | 'FOLDABLE'
  | 'WEB_FALLBACK'
  | 'DESKTOP_LATER'
  | 'XR_FUTURE'
  | 'VEHICLE_FUTURE'
  | 'INDUSTRIAL_FUTURE';

export type DistributionChannel =
  | 'APPLE_APP_STORE'
  | 'TESTFLIGHT'
  | 'GOOGLE_PLAY'
  | 'PLAY_INTERNAL'
  | 'PLAY_CLOSED'
  | 'ENTERPRISE_MANAGED'
  | 'WEB_PWA';

export type DistributionState = 'FOUNDATION' | 'NOT_LIVE' | 'LIVE';

export type AgentDivision =
  | 'EXECUTIVE'
  | 'OPERATIONS'
  | 'SUPPLY_CHAIN'
  | 'FINANCE'
  | 'LEGAL_GOVERNANCE'
  | 'SECURITY'
  | 'PEOPLE'
  | 'MEDIA'
  | 'DATA'
  | 'PLATFORM';

export type InfrastructureFabric =
  | 'ComputeFabric'
  | 'DataFabric'
  | 'MediaFabric'
  | 'AgentFabric'
  | 'SecurityFabric'
  | 'IdentityFabric'
  | 'KnowledgeFabric'
  | 'EventFabric'
  | 'DeviceFabric'
  | 'ConnectorFabric'
  | 'ObservabilityFabric';

export type DataStoreKind =
  | 'RELATIONAL'
  | 'GRAPH'
  | 'VECTOR'
  | 'SEARCH'
  | 'OBJECT_STORAGE'
  | 'STREAMING'
  | 'TIME_SERIES'
  | 'CACHE'
  | 'ARCHIVE';

export type OpsRegion =
  | 'NORTH_AMERICA'
  | 'EUROPE'
  | 'LATIN_AMERICA'
  | 'AFRICA'
  | 'MIDDLE_EAST'
  | 'ASIA_PACIFIC';

export type ReleaseStage =
  | 'DEVELOPMENT'
  | 'AUTOMATED_TESTS'
  | 'SECURITY_CHECKS'
  | 'BETA_INTERNAL'
  | 'STAGED_ROLLOUT'
  | 'PRODUCTION'
  | 'HEALTH_MONITORING'
  | 'ROLLBACK';

export type SoftwarePackKind =
  | 'WarehousePack'
  | 'FreightPack'
  | 'InsurancePack'
  | 'RealEstatePack'
  | 'RetailPack'
  | 'ManufacturingPack'
  | 'LegalOperationsPack'
  | 'StartupPack';

export type MediaLayer =
  | 'WHAT_IS_IT'
  | 'TOPICS'
  | 'ENTITIES'
  | 'CLAIMS'
  | 'BUSINESS_RELEVANCE'
  | 'SUPPLY_CHAIN_RELEVANCE'
  | 'LEGAL_SAFETY'
  | 'LANGUAGE'
  | 'EVIDENCE'
  | 'RIGHTS'
  | 'UNIVERSE_VISIBILITY';

export const MOBILE_SURFACES: readonly MobileSurface[] = [
  'IPHONE',
  'IPAD',
  'ANDROID_PHONE',
  'ANDROID_TABLET',
  'RUGGED_WAREHOUSE',
  'FOLDABLE',
  'WEB_FALLBACK',
  'DESKTOP_LATER',
  'XR_FUTURE',
  'VEHICLE_FUTURE',
  'INDUSTRIAL_FUTURE',
];

export const DISTRIBUTION_CHANNELS: readonly DistributionChannel[] = [
  'APPLE_APP_STORE',
  'TESTFLIGHT',
  'GOOGLE_PLAY',
  'PLAY_INTERNAL',
  'PLAY_CLOSED',
  'ENTERPRISE_MANAGED',
  'WEB_PWA',
];

export const AGENT_DIVISIONS: readonly AgentDivision[] = [
  'EXECUTIVE',
  'OPERATIONS',
  'SUPPLY_CHAIN',
  'FINANCE',
  'LEGAL_GOVERNANCE',
  'SECURITY',
  'PEOPLE',
  'MEDIA',
  'DATA',
  'PLATFORM',
];

export const INFRASTRUCTURE_FABRICS: readonly InfrastructureFabric[] = [
  'ComputeFabric',
  'DataFabric',
  'MediaFabric',
  'AgentFabric',
  'SecurityFabric',
  'IdentityFabric',
  'KnowledgeFabric',
  'EventFabric',
  'DeviceFabric',
  'ConnectorFabric',
  'ObservabilityFabric',
];

export const OPS_REGIONS: readonly OpsRegion[] = [
  'NORTH_AMERICA',
  'EUROPE',
  'LATIN_AMERICA',
  'AFRICA',
  'MIDDLE_EAST',
  'ASIA_PACIFIC',
];

export const SOFTWARE_PACKS: readonly SoftwarePackKind[] = [
  'WarehousePack',
  'FreightPack',
  'InsurancePack',
  'RealEstatePack',
  'RetailPack',
  'ManufacturingPack',
  'LegalOperationsPack',
  'StartupPack',
];
