export type SupplyChainEventType =
  | 'SOURCE'
  | 'EXTRACT'
  | 'PRODUCE'
  | 'ASSEMBLE'
  | 'PACK'
  | 'RECEIVE'
  | 'PUTAWAY'
  | 'MOVE'
  | 'COUNT'
  | 'REPLENISH'
  | 'PICK'
  | 'PACK_ORDER'
  | 'SHIP'
  | 'DEPART'
  | 'ARRIVE'
  | 'CUSTOMS'
  | 'TRANSFER'
  | 'DELIVER'
  | 'RETURN'
  | 'REPAIR'
  | 'RECYCLE';

export type ObservationStance = 'OBSERVED' | 'CALCULATED' | 'INFERRED' | 'FORECAST' | 'RECOMMENDED';

export type DataUniverseId =
  | 'PUBLIC_KNOWLEDGE'
  | 'HISTORICAL'
  | 'ECONOMIC'
  | 'SUPPLY_CHAIN'
  | 'PRODUCT'
  | 'LOGISTICS'
  | 'WAREHOUSE'
  | 'EARTH'
  | 'INDUSTRY'
  | 'COMPANY_PRIVATE'
  | 'PERSONAL_PRIVATE';

export type StorageTier = 'HOT' | 'WARM' | 'COLD' | 'ARCHIVE' | 'SOURCE_REFERENCE';

export type PipelineState =
  | 'PROPOSED'
  | 'ACCESS_REVIEW'
  | 'LICENSE_REVIEW'
  | 'SECURITY_REVIEW'
  | 'SANDBOXED'
  | 'VALIDATING'
  | 'HUMAN_APPROVAL'
  | 'APPROVED'
  | 'DEPLOYED'
  | 'DEGRADED'
  | 'SUSPENDED'
  | 'RETIRED';

export type AgentBehaviorState =
  | 'NORMAL'
  | 'OBSERVE'
  | 'SUSPICIOUS'
  | 'RESTRICTED'
  | 'QUARANTINE_REQUESTED'
  | 'HUMAN_REVIEW';

export type ProductJourneyStageV2 =
  | 'RAW_MATERIAL'
  | 'MINE_FARM_SOURCE'
  | 'PROCESSOR'
  | 'SUPPLIER'
  | 'COMPONENT'
  | 'FACTORY'
  | 'PACKAGING'
  | 'WAREHOUSE'
  | 'PORT_TERMINAL'
  | 'SHIP_AIR_RAIL_TRUCK'
  | 'DISTRIBUTION_CENTER'
  | 'STORE_ECOMMERCE'
  | 'PARCEL'
  | 'LAST_MILE'
  | 'CUSTOMER'
  | 'RETURN_REPAIR_RECYCLE';

export type DeviceSensorGate =
  | 'OPTED_IN'
  | 'PURPOSE_AUTHORIZED'
  | 'MINIMIZED'
  | 'CLASSIFIED'
  | 'PRIVACY_FILTERED'
  | 'SIGNED'
  | 'VERIFIED'
  | 'INGESTED';

export type LocationPrecisionClass = 'COARSE' | 'APPROXIMATE' | 'PRECISE';

export type LocationPurpose =
  | 'WAREHOUSE'
  | 'DELIVERY'
  | 'SUPPLY_CHAIN'
  | 'PORT'
  | 'FIELD_SERVICE';

export type ProviderCapabilityStatus = 'NOT_CONFIGURED' | 'AUTHORIZED' | 'LIVE' | 'DEGRADED' | 'UNAVAILABLE';

export type VerificationState = 'UNVERIFIED' | 'EVIDENCE_LINKED' | 'VERIFIED';

export type ConfidenceBand = 'unknown' | 'low' | 'medium' | 'high';
