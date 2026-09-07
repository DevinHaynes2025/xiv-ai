import { WMS_CORE_CONTRACTS } from './wms';
import type { BusinessModuleManifest } from './os-types';

const FIRST_PARTY_SIGNATURE = {
  status: 'unsigned_first_party_declaration' as const,
  algorithm: null,
  verified: false as const,
};

function firstPartyManifest(
  input: Omit<BusinessModuleManifest, 'publisherId' | 'manifestVersion' | 'signatureMetadata' | 'installationPolicy'>,
): BusinessModuleManifest {
  return {
    ...input,
    publisherId: 'xiv.first-party',
    manifestVersion: '2I-A',
    installationPolicy: 'first_party_review',
    signatureMetadata: FIRST_PARTY_SIGNATURE,
  };
}

export const WMS_PACK_MANIFEST = firstPartyManifest({
  packageId: 'xiv.wms',
  name: 'XIV WMS Pack',
  version: '0.0.1',
  description: 'Warehouse primitives. Inventory is not fabricated. Movements are append-oriented.',
  category: 'wms',
  supportedIndustries: ['logistics', 'wholesale', 'manufacturing', 'retail'],
  supportedRegions: ['declared'],
  requiredPermissions: ['inventory.read'],
  optionalPermissions: ['inventory.write'],
  requiredCapabilities: ['records.read', 'workflow.recommend'],
  entryExperience: 'wms.desk',
  agentBindings: ['inventory', 'operations'],
  dataScopes: ['organization', 'universe'],
  riskLevel: 'high',
  checksum: 'sha256:declared-xiv-wms-0.0.1',
  createdAt: '2026-09-07T00:00:00.000Z',
});

export const INSURANCE_PACK_MANIFEST = firstPartyManifest({
  packageId: 'xiv.insurance',
  name: 'XIV Insurance Agency Pack',
  version: '0.0.1',
  description: 'Insurance agency workflows. No autonomous underwriting or fabricated regulatory approval.',
  category: 'insurance',
  supportedIndustries: ['insurance'],
  supportedRegions: ['declared'],
  requiredPermissions: ['crm.read', 'contacts.read'],
  optionalPermissions: ['documents.read', 'business_health.read'],
  requiredCapabilities: ['records.read', 'agent.consult'],
  entryExperience: 'insurance.desk',
  agentBindings: ['insurance_workflow', 'lead', 'compliance_support'],
  dataScopes: ['organization', 'universe'],
  riskLevel: 'critical',
  checksum: 'sha256:declared-xiv-insurance-0.0.1',
  createdAt: '2026-09-07T00:00:00.000Z',
});

export const REAL_ESTATE_PACK_MANIFEST = firstPartyManifest({
  packageId: 'xiv.real-estate',
  name: 'XIV Real Estate Pack',
  version: '0.0.1',
  description: 'Real estate workflows. Property facts require provenance. No fabrication.',
  category: 'real_estate',
  supportedIndustries: ['real_estate'],
  supportedRegions: ['declared'],
  requiredPermissions: ['crm.read', 'contacts.read'],
  optionalPermissions: ['documents.read', 'analytics.read'],
  requiredCapabilities: ['records.read', 'workflow.recommend'],
  entryExperience: 'real_estate.desk',
  agentBindings: ['real_estate_workflow', 'listing_intelligence'],
  dataScopes: ['organization', 'universe'],
  riskLevel: 'high',
  checksum: 'sha256:declared-xiv-real-estate-0.0.1',
  createdAt: '2026-09-07T00:00:00.000Z',
});

export const SALES_PACK_MANIFEST = firstPartyManifest({
  packageId: 'xiv.sales',
  name: 'XIV Sales Pack',
  version: '0.0.1',
  description: 'CRM and Lead Engine surfaces. No spam automation.',
  category: 'sales',
  supportedIndustries: ['declared'],
  supportedRegions: ['declared'],
  requiredPermissions: ['crm.read', 'contacts.read'],
  optionalPermissions: ['crm.write', 'analytics.read'],
  requiredCapabilities: ['records.read', 'agent.consult'],
  entryExperience: 'sales.desk',
  agentBindings: ['lead'],
  dataScopes: ['organization', 'universe'],
  riskLevel: 'medium',
  checksum: 'sha256:declared-xiv-sales-0.0.1',
  createdAt: '2026-09-07T00:00:00.000Z',
});

export const FIRST_PARTY_PACK_MANIFESTS = [
  WMS_PACK_MANIFEST,
  INSURANCE_PACK_MANIFEST,
  REAL_ESTATE_PACK_MANIFEST,
  SALES_PACK_MANIFEST,
] as const;

export function insuranceUnderwritingDecision() {
  return {
    allowed: false as const,
    autonomous: false as const,
    fabricatedRegulatoryApproval: false as const,
    autonomousLegalDetermination: false as const,
    consequentialRequiresHumanApproval: true as const,
    reason: 'Insurance pack does not make underwriting decisions and does not claim legal or regulatory approval.',
  };
}

export function realEstateFabricatesProperty() {
  return false;
}

export function realEstateConsequentialRequiresHuman() {
  return true;
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

export const WMS_INTERFACES = WMS_CORE_CONTRACTS;

export function wmsInventoriesStock() {
  return false;
}
