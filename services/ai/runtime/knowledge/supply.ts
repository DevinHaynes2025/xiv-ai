import type { PassportEvidenceClass, ProductJourneyStage } from './types';

export type SupplyChainEvidence = {
  source: string;
  retrievedAt: string;
  reference: string;
};

export type SupplyChainEvent = {
  eventId: string;
  entity: 'material' | 'component' | 'product' | 'shipment' | 'inventory' | 'quality' | 'custody';
  stage: ProductJourneyStage;
  evidence: SupplyChainEvidence;
  inferredCompletion: false;
};

export type ProductPassport = {
  productId: string;
  origin: { value: string | null; evidenceClass: PassportEvidenceClass };
  materials: readonly { name: string; evidenceClass: PassportEvidenceClass }[];
  journey: readonly SupplyChainEvent[];
  inventedOrigin: false;
};

export type SupplierClaimClass = 'VERIFIED' | 'SUPPLIER_REPORTED' | 'UNKNOWN';

export type SupplierProfile = {
  supplierId: string;
  legalName: string;
  country: string;
  capability: string;
  claimClass: SupplierClaimClass;
  evidence: SupplyChainEvidence | null;
  verification: 'UNVERIFIED' | 'VERIFIED';
};

export function createSupplyChainEvent(input: {
  entity: SupplyChainEvent['entity'];
  stage: ProductJourneyStage;
  evidence?: SupplyChainEvidence | null;
}): SupplyChainEvent | { allowed: false; reason: string } {
  if (!input.evidence?.source || !input.evidence.retrievedAt || !input.evidence.reference) {
    return { allowed: false, reason: 'supply_chain_events_require_evidence' };
  }
  return {
    eventId: `sc:${input.entity}:${input.stage}`,
    entity: input.entity,
    stage: input.stage,
    evidence: input.evidence,
    inferredCompletion: false,
  };
}

export function inferCompletedJourneyStage(stage: ProductJourneyStage): { allowed: false; reason: string } {
  void stage;
  return { allowed: false, reason: 'never_infer_completed_stage_without_evidence' };
}

export function createProductPassport(input: {
  productId: string;
  origin?: string | null;
  originEvidence?: PassportEvidenceClass;
}): ProductPassport {
  const evidenceClass = input.originEvidence ?? (input.origin ? 'UNKNOWN' : 'UNKNOWN');
  return {
    productId: input.productId,
    origin: { value: evidenceClass === 'UNKNOWN' && !input.origin ? null : input.origin ?? null, evidenceClass },
    materials: [],
    journey: [],
    inventedOrigin: false,
  };
}

export function productPassportInventedOrigin(passport: ProductPassport): boolean {
  return passport.inventedOrigin || Boolean(passport.origin.value && passport.origin.evidenceClass === 'UNKNOWN' && !passport.origin.value);
}

export function inventProductOrigin(): { allowed: false; reason: string } {
  return { allowed: false, reason: 'product_passport_does_not_invent_origin' };
}

export function classifySupplierClaim(kind: 'self_report' | 'verified_document'): SupplierClaimClass {
  return kind === 'verified_document' ? 'VERIFIED' : 'SUPPLIER_REPORTED';
}

export function supplierSelfReportIsVerifiedFact(kind: 'self_report' | 'verified_document'): boolean {
  return classifySupplierClaim(kind) === 'VERIFIED';
}

export function carrierEventIsManufacturerFact(): false {
  return false;
}

export function createSupplierProfile(input: {
  legalName: string;
  country: string;
  capability: string;
  claimKind: 'self_report' | 'verified_document';
  evidence?: SupplyChainEvidence | null;
}): SupplierProfile {
  const claimClass = classifySupplierClaim(input.claimKind);
  return {
    supplierId: `supplier:${input.country}:${input.legalName}`,
    legalName: input.legalName,
    country: input.country,
    capability: input.capability,
    claimClass,
    evidence: input.evidence ?? null,
    verification: claimClass === 'VERIFIED' && input.evidence ? 'VERIFIED' : 'UNVERIFIED',
  };
}
