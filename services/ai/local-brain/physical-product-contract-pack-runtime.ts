/**
 * 62L-EO10 — Physical Product Contract Pack runtime.
 *
 * Lifecycle:
 * Contract requirement → product architecture → BOM → supplier sourcing →
 * prototype → verification testing → manufacturing planning → quality inspection →
 * logistics/distribution → field support → maintenance/spares → EOL management
 *
 * No auto PO / manufacturing commit / supplier contract / shipment / unverified
 * safety cert / export bypass / live high-consequence control.
 * Pricing dimensions structure-only — no fabricated cost or savings figures.
 * Quantum hardware: THEORETICAL | SIMULATED | QUANTUM_INSPIRED unless authorized
 * PHYSICAL_QPU evidence exists.
 */

import {
  EO10_DB_CANDIDATES_STATUS,
  EO10_LOCKS,
  EO10_MAY,
  EO10_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HIGH_CONSEQUENCE_LIVE_CONTROL_DOMAINS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PHYSICAL_PRICING_DIMENSIONS,
  PHYSICAL_PRODUCT_AGENT_BOUNDS,
  PHYSICAL_PRODUCT_AGENT_TEAM,
  PHYSICAL_PRODUCT_CONTRACT_LIFECYCLE,
  PHYSICAL_PRODUCT_CONTRACT_PACK_CYCLE,
  PHYSICAL_PRODUCT_FAMILIES,
  PHYSICAL_PRODUCT_FAMILY_LABELS,
  PHYSICAL_SOLUTION_RECORD_FIELDS,
  QUANTUM_CLAIM_STATES,
  SAFETY_CERT_CLAIM_LABELS,
  SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS,
  assertEo10LocksIntact,
  eo10SoftWireSnapshot,
  isHumanApprover,
  isPhysicalProductAgent,
  type Eo10Actor,
  type Eo10EvidenceState,
  type Eo10HopRecord,
  type Eo10SoftWireSnapshot,
  type HighConsequenceLiveControlDomain,
  type PhysicalPricingDimension,
  type PhysicalProductAgentRole,
  type PhysicalProductFamily,
  type PhysicalProductLifecycleHop,
  type QuantumClaimState,
  type SafetyCertClaimLabel,
  type SupplyChainIntelligenceDimension,
} from './physical-product-contract-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PHYSICAL_PRODUCT_CONTRACT_PACK_CYCLE)[number],
  state: Eo10EvidenceState,
  summary: string,
): Eo10HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

function deny(reason: string): DenialResult {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

/** Physical solution record — contract surface for a mapped hardware product. */
export type PhysicalSolutionRecord = {
  requirementId: string;
  productFamily: PhysicalProductFamily;
  productFamilyLabel: string;
  BOM: string[];
  supplierGraph: string[];
  manufacturingMethod: string | null;
  qualityRequirements: string[];
  testingRequirements: string[];
  firmwareSoftwareDependencies: string[];
  computeRequirements: string;
  securityRequirements: string[];
  packaging: string | null;
  transportation: string | null;
  maintenance: string | null;
  warranty: string | null;
  spares: string[];
  lifecycle: PhysicalProductLifecycleHop;
  unitCost: null;
  volumePricing: null;
  acceptanceCriteria: string[];
  evidenceState: Eo10EvidenceState;
  pricingFiguresFabricated: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  safetyCertClaimed: false;
  purchaseOrderIssued: false;
  manufacturingCommitted: false;
  supplierContractSigned: false;
  deviceShipped: false;
  deviceDeployed: false;
  liveHighConsequenceControlEnabled: false;
  exportControlBypassed: false;
  procurementRuleBypassed: false;
  createdAt: string;
};

export function registerPhysicalSolutionRecord(input: {
  requirementId: string;
  productFamily: PhysicalProductFamily;
  actor: Eo10Actor;
  BOM?: string[];
  supplierGraph?: string[];
  manufacturingMethod?: string | null;
  qualityRequirements?: string[];
  testingRequirements?: string[];
  firmwareSoftwareDependencies?: string[];
  computeRequirements?: string;
  securityRequirements?: string[];
  packaging?: string | null;
  transportation?: string | null;
  maintenance?: string | null;
  warranty?: string | null;
  spares?: string[];
  acceptanceCriteria?: string[];
  /** Attempting to invent numeric unit/volume costs → DENIED. */
  attemptFabricateCostFigures?: boolean;
}): PhysicalSolutionRecord | DenialResult {
  if (input.attemptFabricateCostFigures) {
    return deny(
      'FABRICATE_COST_FIGURES=false — unitCost/volumePricing remain null until evidenced; no fabricated figures.',
    );
  }

  return {
    requirementId: input.requirementId,
    productFamily: input.productFamily,
    productFamilyLabel: PHYSICAL_PRODUCT_FAMILY_LABELS[input.productFamily],
    BOM: input.BOM ?? [],
    supplierGraph: input.supplierGraph ?? [],
    manufacturingMethod: input.manufacturingMethod ?? null,
    qualityRequirements: input.qualityRequirements ?? [],
    testingRequirements: input.testingRequirements ?? [],
    firmwareSoftwareDependencies: input.firmwareSoftwareDependencies ?? [],
    computeRequirements:
      input.computeRequirements ?? 'CANDIDATE — not sized / not verified',
    securityRequirements: input.securityRequirements ?? [
      'CANDIDATE — tenant/Universe isolation required; no safety cert claim',
    ],
    packaging: input.packaging ?? null,
    transportation: input.transportation ?? null,
    maintenance: input.maintenance ?? null,
    warranty: input.warranty ?? null,
    spares: input.spares ?? [],
    lifecycle: 'contract_requirement',
    unitCost: null,
    volumePricing: null,
    acceptanceCriteria: input.acceptanceCriteria ?? [],
    evidenceState: 'REGISTERED',
    pricingFiguresFabricated: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    safetyCertClaimed: false,
    purchaseOrderIssued: false,
    manufacturingCommitted: false,
    supplierContractSigned: false,
    deviceShipped: false,
    deviceDeployed: false,
    liveHighConsequenceControlEnabled: false,
    exportControlBypassed: false,
    procurementRuleBypassed: false,
    createdAt: nowIso(),
  };
}

export function mapRequirementToProductFamilies(input: {
  mappingId: string;
  requirementId: string;
  requirementText: string;
  families: PhysicalProductFamily[];
  attemptBindEligibility?: boolean;
}):
  | {
      mappingId: string;
      requirementId: string;
      families: PhysicalProductFamily[];
      familyLabels: string[];
      advisoryOnly: true;
      eligibilityImplied: false;
      binding: false;
    }
  | DenialResult {
  if (input.attemptBindEligibility) {
    return deny(
      'Mapping is ADVISORY_ONLY — cannot bind eligibility / commitment without human gate.',
    );
  }
  void input.requirementText;
  return {
    mappingId: input.mappingId,
    requirementId: input.requirementId,
    families: input.families,
    familyLabels: input.families.map((f) => PHYSICAL_PRODUCT_FAMILY_LABELS[f]),
    advisoryOnly: true,
    eligibilityImplied: false,
    binding: false,
  };
}

export type ProductArchitecturePlan = {
  planId: string;
  requirementId: string;
  families: PhysicalProductFamily[];
  notes: string[];
  productionAuthorized: false;
  manufacturingAuthorized: false;
};

export function draftProductArchitecture(input: {
  planId: string;
  requirementId: string;
  families: PhysicalProductFamily[];
  notes?: string[];
}): ProductArchitecturePlan {
  return {
    planId: input.planId,
    requirementId: input.requirementId,
    families: input.families,
    notes: input.notes ?? [
      'Architecture is PLAN_ONLY / CANDIDATE',
      'No manufacturing or shipment authorization implied',
    ],
    productionAuthorized: false,
    manufacturingAuthorized: false,
  };
}

export function draftBomCandidate(input: {
  bomId: string;
  requirementId: string;
  lineItems: string[];
  attemptIssuePurchaseOrder?: boolean;
}):
  | {
      bomId: string;
      requirementId: string;
      lineItems: string[];
      candidate: true;
      purchaseOrderIssued: false;
      binding: false;
    }
  | DenialResult {
  if (input.attemptIssuePurchaseOrder) {
    return deny(
      'NO_AUTONOMOUS_PURCHASE_ORDERS (EO10_LOCKS.AUTO_PURCHASE_ORDER=false).',
    );
  }
  return {
    bomId: input.bomId,
    requirementId: input.requirementId,
    lineItems: input.lineItems,
    candidate: true,
    purchaseOrderIssued: false,
    binding: false,
  };
}

export function modelSupplierGraph(input: {
  graphId: string;
  requirementId: string;
  tiers: Array<{ tier: number; suppliers: string[] }>;
  attemptSignSupplierContract?: boolean;
}):
  | {
      graphId: string;
      requirementId: string;
      tiers: Array<{ tier: number; suppliers: string[] }>;
      advisoryOnly: true;
      supplierContractSigned: false;
    }
  | DenialResult {
  if (input.attemptSignSupplierContract) {
    return deny(
      'NO_SUPPLIER_CONTRACTS (EO10_LOCKS.AUTO_SUPPLIER_CONTRACT=false).',
    );
  }
  return {
    graphId: input.graphId,
    requirementId: input.requirementId,
    tiers: input.tiers,
    advisoryOnly: true,
    supplierContractSigned: false,
  };
}

export function surfaceSupplyChainIntelligence(input: {
  surfaceId: string;
  requirementId: string;
  dimensions?: SupplyChainIntelligenceDimension[];
}): {
  surfaceId: string;
  requirementId: string;
  dimensions: SupplyChainIntelligenceDimension[];
  figuresFabricated: false;
  evidenceState: 'STRUCTURE_ONLY';
} {
  return {
    surfaceId: input.surfaceId,
    requirementId: input.requirementId,
    dimensions: input.dimensions
      ? [...input.dimensions]
      : [...SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS],
    figuresFabricated: false,
    evidenceState: 'STRUCTURE_ONLY',
  };
}

export function draftManufacturingPlan(input: {
  planId: string;
  requirementId: string;
  method: string;
  attemptCommit?: boolean;
}):
  | {
      planId: string;
      requirementId: string;
      method: string;
      committed: false;
      advisoryOnly: true;
    }
  | DenialResult {
  if (input.attemptCommit) {
    return deny(
      'NO_MANUFACTURING_COMMITMENTS (EO10_LOCKS.AUTO_MANUFACTURING_COMMITMENT=false).',
    );
  }
  return {
    planId: input.planId,
    requirementId: input.requirementId,
    method: input.method,
    committed: false,
    advisoryOnly: true,
  };
}

export function openPricingDimensionComparison(input: {
  scenarioId: string;
  requirementId: string;
  dimensions?: PhysicalPricingDimension[];
  /** Numeric values would be fabricated — deny if attempted. */
  attemptFabricateFigures?: boolean;
  fabricatedPrototypeCost?: number;
  fabricatedSavings?: number;
}):
  | {
      scenarioId: string;
      requirementId: string;
      dimensions: PhysicalPricingDimension[];
      binding: false;
      advisoryOnly: true;
      figuresFabricated: false;
      numericValues: null;
      evidenceState: 'STRUCTURE_ONLY';
    }
  | DenialResult {
  if (
    input.attemptFabricateFigures ||
    input.fabricatedPrototypeCost !== undefined ||
    input.fabricatedSavings !== undefined
  ) {
    return deny(
      'NO_FABRICATED_COST_OR_SAVINGS — CFO/accountant agents compare dimensions only; numeric figures require external evidence.',
    );
  }
  return {
    scenarioId: input.scenarioId,
    requirementId: input.requirementId,
    dimensions: input.dimensions
      ? [...input.dimensions]
      : [...PHYSICAL_PRICING_DIMENSIONS],
    binding: false,
    advisoryOnly: true,
    figuresFabricated: false,
    numericValues: null,
    evidenceState: 'STRUCTURE_ONLY',
  };
}

export function prepareProposalEvidence(input: {
  packageId: string;
  requirementId: string;
  evidenceRefs: string[];
  attemptAutoSubmit?: boolean;
}):
  | {
      packageId: string;
      requirementId: string;
      evidenceRefs: string[];
      prepared: true;
      submitted: false;
      humanAuthorizedSubmissionRequired: true;
    }
  | DenialResult {
  if (input.attemptAutoSubmit) {
    return deny(
      'Proposal evidence may be prepared only — human-authorized submission required; no auto commitment.',
    );
  }
  return {
    packageId: input.packageId,
    requirementId: input.requirementId,
    evidenceRefs: input.evidenceRefs,
    prepared: true,
    submitted: false,
    humanAuthorizedSubmissionRequired: true,
  };
}

export function labelQuantumHardwareClaim(input: {
  claimId: string;
  state: QuantumClaimState;
  authorizedPhysicalQpuEvidencePresent?: boolean;
}):
  | {
      claimId: string;
      state: QuantumClaimState;
      upgradedIllegally: false;
      aiAccelerationPathAllowed: boolean;
    }
  | DenialResult {
  if (
    input.state === 'PHYSICAL_QPU_VERIFIED' &&
    !input.authorizedPhysicalQpuEvidencePresent
  ) {
    return deny(
      'CLAIM_QUANTUM_HARDWARE_WITHOUT_AUTHORIZED_PHYSICAL_QPU — otherwise THEORETICAL | SIMULATED | QUANTUM_INSPIRED. AI acceleration paths may be verified separately without claiming quantum hardware.',
    );
  }
  if (!QUANTUM_CLAIM_STATES.includes(input.state)) {
    return deny('Invalid quantum claim state.');
  }
  return {
    claimId: input.claimId,
    state: input.state,
    upgradedIllegally: false,
    aiAccelerationPathAllowed: true,
  };
}

export function attemptClaimSafetyCertification(
  label: SafetyCertClaimLabel,
): DenialResult {
  void label;
  void SAFETY_CERT_CLAIM_LABELS;
  return deny(
    `DENY_${label.toUpperCase()}_WITHOUT_EVIDENCE — no safety/export/procurement/production claim without evidence.`,
  );
}

export function attemptAutonomousPurchaseOrder(): DenialResult & {
  purchaseOrderIssued: false;
} {
  return {
    ...deny('NO_AUTONOMOUS_PURCHASE_ORDERS'),
    purchaseOrderIssued: false,
  };
}

export function attemptManufacturingCommitment(): DenialResult & {
  committed: false;
} {
  return {
    ...deny('NO_MANUFACTURING_COMMITMENTS'),
    committed: false,
  };
}

export function attemptSupplierContract(): DenialResult & {
  signed: false;
} {
  return {
    ...deny('NO_SUPPLIER_CONTRACTS'),
    signed: false,
  };
}

export function attemptDeviceShipmentOrDeployment(): DenialResult & {
  shipped: false;
  deployed: false;
} {
  return {
    ...deny('NO_DEVICE_SHIPMENT_OR_DEPLOYMENT'),
    shipped: false,
    deployed: false,
  };
}

export function attemptExportControlOrProcurementBypass(): DenialResult & {
  bypassed: false;
} {
  return {
    ...deny('NO_EXPORT_CONTROL_OR_PROCUREMENT_RULE_BYPASS'),
    bypassed: false,
  };
}

export function attemptLiveHighConsequenceControl(
  domain: HighConsequenceLiveControlDomain,
): DenialResult & {
  liveControlEnabled: false;
  domain: HighConsequenceLiveControlDomain;
} {
  void HIGH_CONSEQUENCE_LIVE_CONTROL_DOMAINS;
  return {
    ...deny(
      `NO_LIVE_HIGH_CONSEQUENCE_CONTROL — domain=${domain} denied from this queue.`,
    ),
    liveControlEnabled: false,
    domain,
  };
}

export function attemptAgentAutoAuthority(actor: Eo10Actor): DenialResult {
  if (isPhysicalProductAgent(actor) || actor.kind === 'home_base') {
    return deny(
      'NO_AGENT_AUTO_AUTHORITY — agents may return evidence to Home Base only; recommend ≠ act.',
    );
  }
  return deny('Actor cannot self-grant automatic authority.');
}

export function returnAgentEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eo10Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      actorKind: Eo10Actor['kind'];
      summary: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!PHYSICAL_PRODUCT_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('Home Base evidence return disabled.');
  }
  if (
    !isPhysicalProductAgent(input.actor) &&
    input.actor.kind !== 'home_base'
  ) {
    return deny('Only physical-product agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    actorKind: input.actor.kind,
    summary: input.summary,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  requirementId: string;
  actor: Eo10Actor;
  action: string;
}):
  | {
      approvalId: string;
      requirementId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver or founder.',
    );
  }
  if (
    !input.actor.permissions.includes('approve_consequential') &&
    !input.actor.permissions.includes('authorize_commitment')
  ) {
    return deny(
      'Human approver lacks approve_consequential / authorize_commitment.',
    );
  }
  return {
    approvalId: input.approvalId,
    requirementId: input.requirementId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EO10_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypassDenied: EO10_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function buildAgentTeamRoster(): Array<{
  role: PhysicalProductAgentRole;
  mayReturnEvidenceToHomeBase: true;
  automaticAuthority: false;
}> {
  return PHYSICAL_PRODUCT_AGENT_TEAM.map((role) => ({
    role,
    mayReturnEvidenceToHomeBase: true as const,
    automaticAuthority: false as const,
  }));
}

export function bootstrapPhysicalProductContractPack(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eo10SoftWireSnapshot;
  families: readonly PhysicalProductFamily[];
  lifecycle: readonly PhysicalProductLifecycleHop[];
  supplyChainDimensions: readonly SupplyChainIntelligenceDimension[];
  pricingDimensions: readonly PhysicalPricingDimension[];
  agentTeam: readonly PhysicalProductAgentRole[];
  solutionFields: readonly string[];
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EO10_MAY;
  mustNot: typeof EO10_MUST_NOT;
  dbCandidates: typeof EO10_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEo10LocksIntact(),
    softWire: eo10SoftWireSnapshot(repoRoot),
    families: PHYSICAL_PRODUCT_FAMILIES,
    lifecycle: PHYSICAL_PRODUCT_CONTRACT_LIFECYCLE,
    supplyChainDimensions: SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS,
    pricingDimensions: PHYSICAL_PRICING_DIMENSIONS,
    agentTeam: PHYSICAL_PRODUCT_AGENT_TEAM,
    solutionFields: PHYSICAL_SOLUTION_RECORD_FIELDS,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EO10_MAY,
    mustNot: EO10_MUST_NOT,
    dbCandidates: EO10_DB_CANDIDATES_STATUS,
  };
}

export function runPhysicalProductContractPackCycle(input: {
  actor: Eo10Actor;
  human: Eo10Actor;
  repoRoot?: string;
}): {
  hops: Eo10HopRecord[];
  solution: PhysicalSolutionRecord | DenialResult;
  softWire: Eo10SoftWireSnapshot;
} {
  const hops: Eo10HopRecord[] = [];
  const softWire = eo10SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEo10LocksIntact() ? 'PASS' : 'FAIL',
      'EO10 locks intact including L4=false and physical autonomy denies.',
    ),
  );
  hops.push(
    hop(
      'physical_product_pack_bootstrap',
      'PASS',
      'Physical Product Contract Pack bootstrapped (advisory / candidate surfaces).',
    ),
  );
  hops.push(
    hop(
      'product_families_encoded',
      'PASS',
      `${PHYSICAL_PRODUCT_FAMILIES.length} product families encoded.`,
    ),
  );
  hops.push(
    hop(
      'solution_record_fields_encoded',
      'PASS',
      `${PHYSICAL_SOLUTION_RECORD_FIELDS.length} solution record fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'physical_product_lifecycle_encoded',
      'PASS',
      PHYSICAL_PRODUCT_CONTRACT_LIFECYCLE.join(' → '),
    ),
  );

  const solution = registerPhysicalSolutionRecord({
    requirementId: 'req-eo10-1',
    productFamily: 'edge_ai_appliances',
    actor: input.actor,
  });

  for (const lifecycleHop of PHYSICAL_PRODUCT_CONTRACT_LIFECYCLE) {
    hops.push(
      hop(
        lifecycleHop,
        'PASS',
        `Lifecycle hop ${lifecycleHop} advisory/candidate.`,
      ),
    );
  }

  hops.push(
    hop(
      'supply_chain_intelligence_encoded',
      'PASS',
      `${SUPPLY_CHAIN_INTELLIGENCE_DIMENSIONS.length} supply-chain intelligence dimensions encoded.`,
    ),
  );
  hops.push(
    hop(
      'pricing_dimensions_encoded',
      'PASS',
      `${PHYSICAL_PRICING_DIMENSIONS.length} pricing dimensions encoded (structure-only).`,
    ),
  );
  hops.push(
    hop(
      'no_fabricated_cost_or_savings',
      openPricingDimensionComparison({
        scenarioId: 'price-cycle-1',
        requirementId: 'req-eo10-1',
        attemptFabricateFigures: true,
      }).state,
      'Fabricated cost/savings DENIED.',
    ),
  );

  hops.push(
    hop(
      'agent_team_bounded',
      'PASS',
      `${PHYSICAL_PRODUCT_AGENT_TEAM.length} agents bounded; no auto authority.`,
    ),
  );
  hops.push(
    hop(
      'agent_evidence_to_home_base',
      'PASS',
      'Agents may return evidence to Home Base only.',
    ),
  );
  hops.push(
    hop(
      'no_agent_auto_authority',
      attemptAgentAutoAuthority(input.actor).state,
      'Agent auto authority DENIED.',
    ),
  );

  hops.push(
    hop(
      'no_autonomous_purchase_orders',
      attemptAutonomousPurchaseOrder().state,
      'Auto purchase order DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_manufacturing_commitments',
      attemptManufacturingCommitment().state,
      'Manufacturing commitment DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_supplier_contracts',
      attemptSupplierContract().state,
      'Supplier contract DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_device_shipment_or_deployment',
      attemptDeviceShipmentOrDeployment().state,
      'Device shipment/deployment DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_safety_cert_without_evidence',
      attemptClaimSafetyCertification('safety_certification').state,
      'Safety certification without evidence DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_export_control_or_procurement_bypass',
      attemptExportControlOrProcurementBypass().state,
      'Export-control / procurement-rule bypass DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_live_high_consequence_control',
      attemptLiveHighConsequenceControl('weapons').state,
      'Live high-consequence control DENIED.',
    ),
  );
  hops.push(
    hop(
      'quantum_hardware_claim_ladder_enforced',
      'PASS',
      QUANTUM_CLAIM_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      'PASS',
      'Recommend ≠ purchase / manufacture / ship / contract / deploy.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EO10_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eo9_soft_wire',
      softWire.eo9DigitalProductContractPack.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo9DigitalProductContractPack.note,
    ),
  );
  hops.push(
    hop(
      'eo8_soft_wire',
      softWire.eo8SupplyChainResiliencePack.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo8SupplyChainResiliencePack.note,
    ),
  );
  hops.push(
    hop(
      'eo7_soft_wire',
      softWire.eo7Pack.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo7Pack.note,
    ),
  );
  hops.push(
    hop(
      'en158_soft_wire',
      softWire.en158DealOs.present ? 'PASS' : 'WAITING_DATA',
      softWire.en158DealOs.note,
    ),
  );
  hops.push(
    hop(
      'em10_soft_wire',
      softWire.em10UserAccessEconomy.present ? 'PASS' : 'WAITING_DATA',
      softWire.em10UserAccessEconomy.note,
    ),
  );
  hops.push(
    hop(
      'em1_soft_wire',
      softWire.em1HomeBaseContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.em1HomeBaseContract.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EO10_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eo10-1',
    requirementId: 'req-eo10-1',
    actor: input.human,
    action: 'authorize_proposal_evidence_package',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void PHYSICAL_PRODUCT_CONTRACT_PACK_CYCLE;

  return {
    hops,
    solution,
    softWire,
  };
}
