import { classifySupplierClaim, supplierSelfReportIsVerifiedFact } from '../knowledge/supply';
import type { SupplierVerificationClass, WmsWorkflow } from './types';

export function wmsScan(input: {
  workflow: WmsWorkflow;
  barcode?: string;
  inventInventory?: boolean;
}): { allowed: boolean; reason?: string; invented: false } {
  if (input.inventInventory || !input.barcode) {
    return { allowed: false, reason: 'wms_scan_cannot_invent_inventory', invented: false };
  }
  return { allowed: true, invented: false };
}

export function tmsEvent(input: {
  shipmentId?: string;
  inventEvent?: boolean;
}): { allowed: boolean; reason?: string; invented: false } {
  if (input.inventEvent || !input.shipmentId) {
    return { allowed: false, reason: 'tms_cannot_invent_shipment_event', invented: false };
  }
  return { allowed: true, invented: false };
}

export function supplierVerification(kind: 'self_report' | 'verified_document'): SupplierVerificationClass {
  return classifySupplierClaim(kind) === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'SELF_REPORTED';
}

export function supplierSelfReportVerified(): boolean {
  return supplierSelfReportIsVerifiedFact('self_report');
}

export function supplierAgentFinalizeBindingAgreement(): { allowed: false; reason: string } {
  return { allowed: false, reason: 'supplier_agent_cannot_finalize_binding_agreement' };
}
