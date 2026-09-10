export type IndustryKind = 'ECOMMERCE' | 'STARTUP' | 'BRICK_AND_MORTAR' | 'ENTERPRISE' | 'HOSPITAL_ADMIN' | 'MANUFACTURING' | 'SUPPLIER' | 'CHIP_ECOSYSTEM' | 'CLOUD' | 'LOGISTICS' | 'RETAIL' | 'OTHER';
export type PartnerState = 'INTERNAL' | 'CONNECTED' | 'AVAILABLE_API' | 'WAITING_PARTNER' | 'UNVERIFIED';

export interface IndustryNode {
  nodeId: string;
  name: string;
  industry: IndustryKind;
  state: PartnerState;
  evidenceRefs: string[];
  capabilities: string[];
}

export interface IndustryEdge {
  from: string;
  to: string;
  relation: 'SUPPLIES' | 'INTEGRATES_WITH' | 'LEARNS_FROM' | 'SERVES' | 'DEPENDS_ON';
  evidenceRefs: string[];
}

export const DEFAULT_INDUSTRY_TARGETS: IndustryNode[] = [
  { nodeId: 'target:ecommerce', name: 'E-commerce ecosystem', industry: 'ECOMMERCE', state: 'WAITING_PARTNER', evidenceRefs: [], capabilities: ['commerce','orders','customer-signals'] },
  { nodeId: 'target:brick-mortar', name: 'Brick-and-mortar retail', industry: 'BRICK_AND_MORTAR', state: 'WAITING_PARTNER', evidenceRefs: [], capabilities: ['pos','inventory','store-operations'] },
  { nodeId: 'target:hospital-admin', name: 'Hospital administration', industry: 'HOSPITAL_ADMIN', state: 'WAITING_PARTNER', evidenceRefs: [], capabilities: ['operations','scheduling','supply-chain'] },
  { nodeId: 'target:manufacturing', name: 'Manufacturing ecosystem', industry: 'MANUFACTURING', state: 'WAITING_PARTNER', evidenceRefs: [], capabilities: ['production','quality','suppliers'] },
  { nodeId: 'target:arm', name: 'ARM ecosystem', industry: 'CHIP_ECOSYSTEM', state: 'WAITING_PARTNER', evidenceRefs: [], capabilities: ['arm64','edge','mobile'] },
  { nodeId: 'target:nvidia', name: 'NVIDIA ecosystem', industry: 'CHIP_ECOSYSTEM', state: 'WAITING_PARTNER', evidenceRefs: [], capabilities: ['gpu','cuda-adapter','inference'] },
  { nodeId: 'target:google', name: 'Google ecosystem', industry: 'CLOUD', state: 'WAITING_PARTNER', evidenceRefs: [], capabilities: ['cloud','android','ai'] },
  { nodeId: 'target:samsung', name: 'Samsung ecosystem', industry: 'CHIP_ECOSYSTEM', state: 'WAITING_PARTNER', evidenceRefs: [], capabilities: ['mobile','device','semiconductor'] },
];

export function validateIndustryNode(node: IndustryNode): IndustryNode {
  if ((node.state === 'CONNECTED' || node.state === 'AVAILABLE_API') && !node.evidenceRefs.length) throw new Error('connected industry nodes require evidence');
  return node;
}

export const INDUSTRY_GRAPH_GUARDRAILS = {
  partnershipClaimsRequireEvidence: true,
  crossTenantDataPoolingAllowed: false,
  productionIntegrationAutomatic: false,
  vendorNamesDoNotImplyPartnership: true,
};
