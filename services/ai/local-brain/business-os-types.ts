export const BUSINESS_OS_CYCLE = [
  'xiv_os_kernel',
  'local_cloud_llms',
  'agent_society',
  'algorithm_foundry',
  'database_fabric',
  'information_highways',
  'logistics_core',
  'virtual_control_towers',
  'industry_apps',
  'developer_sdk',
  'marketplace',
  'businesses_employees_consumers',
  'learning',
] as const;

export type AwHop = (typeof BUSINESS_OS_CYCLE)[number];

export type AwEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED';

export type AwJobState =
  | 'queued'
  | 'running'
  | 'completed'
  | 'denied'
  | 'waiting_data'
  | 'unavailable'
  | 'failed';

export type IndustryLayer =
  | 'freight'
  | 'transportation_marketplaces'
  | 'ecommerce'
  | 'banking_ops_support'
  | 'warehouses'
  | 'brick_and_mortar'
  | 'infrastructure_planning'
  | 'enterprise_ops';

export const INDUSTRY_LAYERS: readonly IndustryLayer[] = [
  'freight',
  'transportation_marketplaces',
  'ecommerce',
  'banking_ops_support',
  'warehouses',
  'brick_and_mortar',
  'infrastructure_planning',
  'enterprise_ops',
] as const;

export type ControlTowerMode =
  | 'logistics_ops'
  | 'warehouse_ops'
  | 'freight_ops'
  | 'transport_marketplace_ops'
  | 'ecommerce_ops'
  | 'banking_ops_support'
  | 'retail_ops'
  | 'infrastructure_planning'
  | 'enterprise_ops';

export type PhysicalControlClaim =
  | 'physical_atc'
  | 'air_traffic_control'
  | 'highway_vehicle_control'
  | 'highway_traffic_control'
  | 'steering'
  | 'braking'
  | 'throttle'
  | 'propulsion'
  | 'autonomous_drive'
  | 'vehicle_actuation'
  | 'vehicle_control';

export const PHYSICAL_CONTROL_CLAIMS: readonly PhysicalControlClaim[] = [
  'physical_atc',
  'air_traffic_control',
  'highway_vehicle_control',
  'highway_traffic_control',
  'steering',
  'braking',
  'throttle',
  'propulsion',
  'autonomous_drive',
  'vehicle_actuation',
  'vehicle_control',
] as const;

export const ATC_HIGHWAY_CLAIMS: readonly PhysicalControlClaim[] = [
  'physical_atc',
  'air_traffic_control',
  'highway_vehicle_control',
  'highway_traffic_control',
] as const;

export type ExperienceTier = 'offline' | 'hybrid' | 'live';
export type CommunityAudience = 'consumer' | 'employee';
export type LocaleCode = 'en' | 'es' | 'fr' | 'ar' | 'zh' | 'hi' | 'pt' | 'sw';

export type ExternalSystemKind = 'erp' | 'bank' | 'pos' | 'wms' | 'cloud' | 'tms' | 'transport';

export const EXTERNAL_SYSTEM_KINDS: readonly ExternalSystemKind[] = [
  'erp',
  'bank',
  'pos',
  'wms',
  'cloud',
  'tms',
  'transport',
] as const;

export const AW_HONESTY = Object.freeze({
  l4AutonomyEnabled: false as const,
  agentsPlanRecommendOnly: true as const,
  humansOwnConsequentialDecisions: true as const,
  ceoSealedCompartmentalized: true as const,
  founderImpersonation: false as const,
  tipLand: false as const,
  inventedPass: false as const,
  inventedPartnerships: false as const,
  cfoMayChargeCustomers: false as const,
  marketplaceMayChargeCustomers: false as const,
  marketplaceMayMutateBilling: false as const,
  recommendationIsNotCharge: true as const,
  vehicleControlAuthorized: false as const,
  physicalVehicleActuation: false as const,
  physicalAtcAuthorized: false as const,
  highwayVehicleControlAuthorized: false as const,
  adultAccessPolicy18Plus: true as const,
  unverifiedRuntimeUnavailable: true as const,
  unconfiguredSystemsUnavailable: true as const,
  xivIsBridgeNotReplacement: true as const,
  guardianRlsWeaken: false as const,
  permissionExpansion: false as const,
  productionDatabaseWrite: false as const,
  migrationsApplied: false as const,
  unconfiguredProvidersUnavailable: true as const,
});

export const ATC_HIGHWAY_CONTROL_DENIED = 'VIRTUAL_CONTROL_TOWER_IS_BUSINESS_OPS_NOT_PHYSICAL_ATC_OR_HIGHWAY_CONTROL';
export const VEHICLE_CONTROL_DENIED = 'VEHICLE_CONTROL_DENIED';
export const ADULT_ACCESS_DENIED = 'ADULT_ACCESS_POLICY_18_PLUS';
export const MARKETPLACE_CHARGE_DENIED = 'MARKETPLACE_RECOMMENDATION_IS_NOT_CHARGE_OR_BILLING_MUTATION';
export const UNVERIFIED_RUNTIME_UNAVAILABLE = 'UNVERIFIED_RUNTIME_TARGET_UNAVAILABLE';
export const UNCONFIGURED_SYSTEM_UNAVAILABLE = 'UNCONFIGURED_SYSTEM_UNAVAILABLE';
export const FOUNDER_IMPERSONATION_DENIED = 'FOUNDER_IMPERSONATION_DENIED';
export const SEALED_REDACTION = '[REDACTED_SEALED]';

export type AwHopRecord = {
  hop: AwHop;
  state: AwEvidenceState;
  summary: string;
  at: string;
};

export class AwSimulatedCrash extends Error {
  constructor(public readonly hop: AwHop) {
    super(`AW_SIMULATED_CRASH:${hop}`);
    this.name = 'AwSimulatedCrash';
  }
}

export const NEXT_PHASE_TITLE =
  '62L-AX — XIV Universal Business Protocol + Developer Economy + App/Agent Runtime Federation + Enterprise Integration Gateway';
