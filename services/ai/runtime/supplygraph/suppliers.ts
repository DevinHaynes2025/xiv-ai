/**
 * Supplier + Commerce Network entities and authorized adapter contracts.
 * Adapters remain NOT_CONFIGURED until proven. No private supplier scraping.
 */

import {
  SUPPLIER_COMMERCE_ADAPTERS,
  SUPPLIER_VERIFICATION_STATES,
  type SupplierCommerceAdapterKind,
  type SupplierVerificationState,
} from './types';

export type SupplierEntityKind =
  | 'Supplier'
  | 'Manufacturer'
  | 'Factory'
  | 'Distributor'
  | 'Wholesaler'
  | 'Retailer'
  | 'Marketplace'
  | 'SupplierFacility'
  | 'Product'
  | 'SKU'
  | 'Material'
  | 'Component'
  | 'SupplierRelationship'
  | 'SupplierEvidence'
  | 'SupplierCertification'
  | 'SupplierRisk'
  | 'SupplierPrice'
  | 'SupplierLeadTime'
  | 'SupplierCapacity'
  | 'SupplierLocation'
  | 'SupplierQuality'
  | 'SupplierShipment'
  | 'SupplierConversation'
  | 'RFQ'
  | 'Quote'
  | 'PurchaseOrder'
  | 'ContractReference';

export type SupplierEntity = {
  entityId: string;
  kind: SupplierEntityKind;
  tenantId: string;
  universeId: string;
  verification: SupplierVerificationState;
  provenance: string;
  scrapesPrivateSystems: false;
};

export type SupplierCommerceAdapter = {
  kind: SupplierCommerceAdapterKind;
  healthState: 'NOT_CONFIGURED';
  productionLive: false;
  evidence: null;
  officialAvailabilityRequired: true;
};

export const SUPPLIER_ENTITY_KINDS: readonly SupplierEntityKind[] = [
  'Supplier',
  'Manufacturer',
  'Factory',
  'Distributor',
  'Wholesaler',
  'Retailer',
  'Marketplace',
  'SupplierFacility',
  'Product',
  'SKU',
  'Material',
  'Component',
  'SupplierRelationship',
  'SupplierEvidence',
  'SupplierCertification',
  'SupplierRisk',
  'SupplierPrice',
  'SupplierLeadTime',
  'SupplierCapacity',
  'SupplierLocation',
  'SupplierQuality',
  'SupplierShipment',
  'SupplierConversation',
  'RFQ',
  'Quote',
  'PurchaseOrder',
  'ContractReference',
] as const;

export function listSupplierEntityKinds(): readonly SupplierEntityKind[] {
  return SUPPLIER_ENTITY_KINDS;
}

export function listSupplierVerificationStates(): readonly SupplierVerificationState[] {
  return SUPPLIER_VERIFICATION_STATES;
}

export function listSupplierCommerceAdapters(): readonly SupplierCommerceAdapterKind[] {
  return SUPPLIER_COMMERCE_ADAPTERS;
}

export function openSupplierCommerceNetwork() {
  return {
    adapters: SUPPLIER_COMMERCE_ADAPTERS.map(
      (kind): SupplierCommerceAdapter => ({
        kind,
        healthState: 'NOT_CONFIGURED',
        productionLive: false,
        evidence: null,
        officialAvailabilityRequired: true,
      }),
    ),
    scrapesPrivateSupplierSystems: false as const,
    productionLive: false as const,
  };
}

export function supplierAdapterState(kind: SupplierCommerceAdapterKind): 'NOT_CONFIGURED' {
  void kind;
  return 'NOT_CONFIGURED';
}

export function createSupplierEntity(input: {
  entityId: string;
  kind: SupplierEntityKind;
  tenantId: string;
  universeId: string;
  verification?: SupplierVerificationState;
  provenance?: string;
}): SupplierEntity {
  return {
    entityId: input.entityId,
    kind: input.kind,
    tenantId: input.tenantId,
    universeId: input.universeId,
    verification: input.verification ?? 'UNKNOWN',
    provenance: input.provenance ?? 'NONE',
    scrapesPrivateSystems: false,
  };
}

export function evaluateSupplierProvenance(input: {
  entity: SupplierEntity;
  acceptInferredAsVerified?: boolean;
}): { trusted: boolean; reason: string; verification: SupplierVerificationState } {
  if (input.entity.scrapesPrivateSystems) {
    return { trusted: false, reason: 'private_scrape_forbidden', verification: input.entity.verification };
  }
  if (input.entity.verification === 'UNKNOWN' || input.entity.verification === 'SELF_REPORTED') {
    return { trusted: false, reason: 'insufficient_verification', verification: input.entity.verification };
  }
  if (input.entity.verification === 'INFERRED' && input.acceptInferredAsVerified !== true) {
    return { trusted: false, reason: 'inferred_not_verified', verification: 'INFERRED' };
  }
  return { trusted: true, reason: 'provenance_acceptable', verification: input.entity.verification };
}

export function privateSupplierScrapingEnabled(): false {
  return false;
}
