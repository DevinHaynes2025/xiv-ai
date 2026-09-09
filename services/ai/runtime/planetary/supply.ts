import { supplierSelfReportIsVerifiedFact } from '../knowledge/supply';
import type {
  ConfidenceBand,
  DataUniverseId,
  DeviceSensorGate,
  ProductJourneyStageV2,
  SupplyChainEventType,
  VerificationState,
} from './types';

export type SupplyChainEvidence = {
  source: string;
  retrievedAt: string;
  reference: string;
};

export type SupplyChainEvent = {
  eventId: string;
  eventType: SupplyChainEventType;
  entity: string;
  organizationId: string;
  organization: string;
  universeId: DataUniverseId | string;
  location?: string;
  eventTime: string;
  observedAt: string;
  source: string;
  evidence: SupplyChainEvidence;
  verification: VerificationState;
  confidence: ConfidenceBand;
  invented: false;
};

export type SupplyChainGraphV2 = {
  supplierGraph: readonly string[];
  productGraph: readonly string[];
  logisticsGraph: readonly string[];
  warehouseGraph: readonly string[];
  everySupplierConnected: false;
  everyWarehouseConnected: false;
  everyProductTracked: false;
};

export type ProductJourneyV2 = {
  productId: string;
  stages: readonly ProductJourneyStageV2[];
  events: readonly SupplyChainEvent[];
  inventedOrigin: false;
};

export const PRODUCT_JOURNEY_V2: readonly ProductJourneyStageV2[] = [
  'RAW_MATERIAL',
  'MINE_FARM_SOURCE',
  'PROCESSOR',
  'SUPPLIER',
  'COMPONENT',
  'FACTORY',
  'PACKAGING',
  'WAREHOUSE',
  'PORT_TERMINAL',
  'SHIP_AIR_RAIL_TRUCK',
  'DISTRIBUTION_CENTER',
  'STORE_ECOMMERCE',
  'PARCEL',
  'LAST_MILE',
  'CUSTOMER',
  'RETURN_REPAIR_RECYCLE',
];

export const DEVICE_SENSOR_GATES: readonly DeviceSensorGate[] = [
  'OPTED_IN',
  'PURPOSE_AUTHORIZED',
  'MINIMIZED',
  'CLASSIFIED',
  'PRIVACY_FILTERED',
  'SIGNED',
  'VERIFIED',
  'INGESTED',
];

export const SUPPLY_CHAIN_AGENTS_V2 = [
  'Chief Supply Chain',
  'Raw Materials',
  'Supplier Discovery',
  'Supplier Verification',
  'Supplier Risk',
  'Sourcing',
  'Procurement',
  'Manufacturing',
  'Production Planning',
  'Capacity',
  'Quality',
  'Inventory',
  'Demand Planning',
  'Warehouse',
  'Slotting',
  'Picking Optimization',
  'Transportation',
  'Freight',
  'Parcel',
  'Cargo',
  'Ocean',
  'Air Cargo',
  'Rail',
  'Port Intelligence',
  'Customs',
  'Trade',
  'Route Optimization',
  'Last Mile',
  'Returns',
  'Resilience',
  'Disruption',
  'Network Design',
  'Supply Chain Digital Twin',
  'Supply Chain Evidence',
  'Supply Chain Contradiction',
] as const;

export function createSupplyChainNervousEvent(input: {
  eventType: SupplyChainEventType;
  entity: string;
  organizationId: string;
  universeId: string;
  location?: string;
  eventTime?: string;
  observedAt?: string;
  evidence?: SupplyChainEvidence | null;
  locationAuthorized?: boolean;
}): SupplyChainEvent | { allowed: false; reason: string } {
  if (!input.evidence?.source || !input.evidence.retrievedAt || !input.evidence.reference) {
    return { allowed: false, reason: 'supply_chain_event_requires_evidence' };
  }
  return {
    eventId: `scn:${input.eventType}:${input.entity}`,
    eventType: input.eventType,
    entity: input.entity,
    organizationId: input.organizationId,
    organization: input.organizationId,
    universeId: input.universeId,
    location: input.locationAuthorized === true ? input.location : undefined,
    eventTime: input.eventTime ?? input.evidence.retrievedAt,
    observedAt: input.observedAt ?? input.evidence.retrievedAt,
    source: input.evidence.source,
    evidence: input.evidence,
    verification: 'EVIDENCE_LINKED',
    confidence: 'unknown',
    invented: false,
  };
}

export function supplierClaimBecomesVerifiedAutomatically(): boolean {
  return supplierSelfReportIsVerifiedFact('self_report');
}

export function supplyChainAgentCreatesFacts(): false {
  return false;
}

export function supplyChainAgentOverridesSourceEvidence(): false {
  return false;
}

export function openSupplyChainGraphV2(): SupplyChainGraphV2 {
  return {
    supplierGraph: [],
    productGraph: [],
    logisticsGraph: [],
    warehouseGraph: [],
    everySupplierConnected: false,
    everyWarehouseConnected: false,
    everyProductTracked: false,
  };
}

export function startProductJourneyV2(productId: string): ProductJourneyV2 {
  return {
    productId,
    stages: PRODUCT_JOURNEY_V2,
    events: [],
    inventedOrigin: false,
  };
}

export function phoneBecomesGlobalXivSensor(): false {
  return false;
}

export function deviceObservationMayIngest(gates: readonly DeviceSensorGate[]): boolean {
  return DEVICE_SENSOR_GATES.every((gate) => gates.includes(gate));
}
