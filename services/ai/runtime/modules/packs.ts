export function insuranceUnderwritingDecision() {
  return {
    allowed: false as const,
    reason: 'Insurance pack does not make underwriting decisions and does not claim legal or regulatory approval.',
  };
}

export function realEstateFabricatesProperty() {
  return false;
}

export const INSURANCE_PACK = {
  id: 'insurance_business_pack',
  status: 'manifest_only' as const,
  modules: [
    'crm',
    'lead_engine',
    'producer_workflow',
    'client_records',
    'renewal_workflow',
    'document_workflow',
    'communications',
    'business_health',
  ],
  agents: [
    'insurance_workflow',
    'lead',
    'renewal',
    'communications',
    'compliance_support',
  ],
  underwriting: false,
  legalApprovalClaimed: false,
};

export const REAL_ESTATE_PACK = {
  id: 'real_estate_business_pack',
  status: 'manifest_only' as const,
  modules: [
    'crm',
    'lead_engine',
    'buyer_pipeline',
    'seller_pipeline',
    'listings',
    'showing_workflow',
    'transactions',
    'documents',
    'marketing',
    'market_intelligence',
  ],
  agents: [
    'real_estate_workflow',
    'lead',
    'listing_intelligence',
    'marketing',
    'transaction',
    'communications',
  ],
  fabricatesPropertyFacts: false,
};

export const WMS_INTERFACES = [
  'Warehouse',
  'Inventory',
  'Location',
  'Bin',
  'SKU',
  'StockLevel',
  'PurchaseOrder',
  'Receiving',
  'Putaway',
  'PickTask',
  'PackTask',
  'Shipment',
  'CycleCount',
  'WarehouseEvent',
] as const;

export function wmsInventoriesStock() {
  return false;
}
