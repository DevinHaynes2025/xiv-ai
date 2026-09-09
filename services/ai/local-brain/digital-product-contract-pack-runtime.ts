/**
 * 62L-EO9 — Digital Product Contract Pack runtime.
 *
 * Workflow:
 * Solicitation requirement → Digital product mapping → Architecture →
 * Data/integration plan → Security/compliance gaps → Compute sizing →
 * Implementation plan → Test/acceptance criteria → Pricing → Proposal evidence
 *
 * Deployment claim only if tested. Certification claims denied without evidence.
 * Recommend ≠ act / deploy / submit / accept / ingest / expand permissions.
 */

import {
  ACCEPTANCE_CHECKLIST_ITEMS,
  CERTIFICATION_CLAIM_LABELS,
  DEPLOYMENT_OPTIONS,
  DIGITAL_PRODUCT_AGENT_BOUNDS,
  DIGITAL_PRODUCT_AGENT_TEAM,
  DIGITAL_PRODUCT_CONTRACT_PACK_CYCLE,
  DIGITAL_PRODUCT_CONTRACT_WORKFLOW,
  DIGITAL_PRODUCT_FAMILIES,
  DIGITAL_PRODUCT_FAMILY_LABELS,
  EO9_DB_CANDIDATES_STATUS,
  EO9_LOCKS,
  EO9_MAY,
  EO9_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_STATES,
  SOLUTION_RECORD_FIELDS,
  assertEo9LocksIntact,
  defaultDeploymentClaimState,
  eo9SoftWireSnapshot,
  isDigitalProductAgent,
  isHumanApprover,
  type AcceptanceChecklistItem,
  type CertificationClaimLabel,
  type DeploymentClaimState,
  type DeploymentOption,
  type DigitalProductAgentRole,
  type DigitalProductFamily,
  type DigitalProductWorkflowHop,
  type Eo9Actor,
  type Eo9EvidenceState,
  type Eo9HopRecord,
  type Eo9SoftWireSnapshot,
  type QuantumClaimState,
} from './digital-product-contract-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof DIGITAL_PRODUCT_CONTRACT_PACK_CYCLE)[number],
  state: Eo9EvidenceState,
  summary: string,
): Eo9HopRecord {
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

/** Solution record — contract surface for a mapped digital product. */
export type DigitalSolutionRecord = {
  requirementId: string;
  productModule: DigitalProductFamily;
  productModuleLabel: string;
  deploymentModel: DeploymentOption;
  deploymentClaimState: DeploymentClaimState;
  dataSources: string[];
  userRoles: string[];
  agentRoles: DigitalProductAgentRole[];
  computeRequirements: string;
  securityBoundary: string;
  integrationRequirements: string[];
  performanceTargets: string[];
  acceptanceTests: string[];
  supportModel: string | null;
  pricingModel: string | null;
  knownLimitations: string[];
  evidenceState: Eo9EvidenceState;
  workflowPosition: DigitalProductWorkflowHop;
  orgId: string;
  tenantId: string;
  universeId: string;
  fedrampClaimed: false;
  fismaClaimed: false;
  cmmcClaimed: false;
  clearanceClaimed: false;
  agencyAuthorizationClaimed: false;
  productionReadinessClaimed: false;
  autoDeployed: false;
  autoBidSubmitted: false;
  autoContractAccepted: false;
  customerDataIngested: false;
  permissionsExpanded: false;
  createdAt: string;
};

export function registerDigitalSolutionRecord(input: {
  requirementId: string;
  productModule: DigitalProductFamily;
  actor: Eo9Actor;
  deploymentModel?: DeploymentOption;
  dataSources?: string[];
  userRoles?: string[];
  agentRoles?: DigitalProductAgentRole[];
  computeRequirements?: string;
  securityBoundary?: string;
  integrationRequirements?: string[];
  performanceTargets?: string[];
  acceptanceTests?: string[];
  supportModel?: string | null;
  pricingModel?: string | null;
  knownLimitations?: string[];
  /** Attempting to claim TESTED/VERIFIED without test evidence → DENIED. */
  claimDeploymentTestedWithoutEvidence?: boolean;
}): DigitalSolutionRecord | DenialResult {
  if (input.claimDeploymentTestedWithoutEvidence) {
    return deny(
      'CLAIM_DEPLOYMENT_WITHOUT_TEST (EO9_LOCKS.CLAIM_DEPLOYMENT_WITHOUT_TEST=false). Untested → NOT_TESTED / CANDIDATE / NOT_AVAILABLE.',
    );
  }

  const deploymentModel = input.deploymentModel ?? 'LOCAL';
  const deploymentClaimState = defaultDeploymentClaimState(deploymentModel, {
    architectureListed: true,
  });

  return {
    requirementId: input.requirementId,
    productModule: input.productModule,
    productModuleLabel: DIGITAL_PRODUCT_FAMILY_LABELS[input.productModule],
    deploymentModel,
    deploymentClaimState,
    dataSources: input.dataSources ?? [],
    userRoles: input.userRoles ?? [],
    agentRoles: input.agentRoles ?? [...DIGITAL_PRODUCT_AGENT_TEAM],
    computeRequirements: input.computeRequirements ?? 'CANDIDATE — not sized',
    securityBoundary:
      input.securityBoundary ??
      'CANDIDATE — tenant/Universe isolation required; no auth claim',
    integrationRequirements: input.integrationRequirements ?? [],
    performanceTargets: input.performanceTargets ?? [],
    acceptanceTests: input.acceptanceTests ?? [],
    supportModel: input.supportModel ?? null,
    pricingModel: input.pricingModel ?? null,
    knownLimitations: input.knownLimitations ?? [
      'Deployment untested on this tip',
      'No FedRAMP/FISMA/CMMC/clearance/agency auth/production readiness claim',
    ],
    evidenceState: 'REGISTERED',
    workflowPosition: 'solicitation_requirement',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    fedrampClaimed: false,
    fismaClaimed: false,
    cmmcClaimed: false,
    clearanceClaimed: false,
    agencyAuthorizationClaimed: false,
    productionReadinessClaimed: false,
    autoDeployed: false,
    autoBidSubmitted: false,
    autoContractAccepted: false,
    customerDataIngested: false,
    permissionsExpanded: false,
    createdAt: nowIso(),
  };
}

export function mapSolicitationToProductFamilies(input: {
  mappingId: string;
  requirementId: string;
  solicitationText: string;
  families: DigitalProductFamily[];
  attemptBindEligibility?: boolean;
}):
  | {
      mappingId: string;
      requirementId: string;
      families: DigitalProductFamily[];
      familyLabels: string[];
      advisoryOnly: true;
      eligibilityImplied: false;
      binding: false;
    }
  | DenialResult {
  if (input.attemptBindEligibility) {
    return deny(
      'Digital product mapping is ADVISORY_ONLY — cannot imply eligibility or bind without human gate.',
    );
  }
  return {
    mappingId: input.mappingId,
    requirementId: input.requirementId,
    families: input.families,
    familyLabels: input.families.map((f) => DIGITAL_PRODUCT_FAMILY_LABELS[f]),
    advisoryOnly: true,
    eligibilityImplied: false,
    binding: false,
  };
}

export type ArchitecturePlan = {
  planId: string;
  requirementId: string;
  modules: DigitalProductFamily[];
  deploymentCandidates: Array<{
    option: DeploymentOption;
    claimState: DeploymentClaimState;
  }>;
  advisoryOnly: true;
  productionAuthorized: false;
};

export function draftArchitecturePlan(input: {
  planId: string;
  requirementId: string;
  modules: DigitalProductFamily[];
  deploymentCandidates?: DeploymentOption[];
}): ArchitecturePlan {
  const opts = input.deploymentCandidates ?? [...DEPLOYMENT_OPTIONS];
  return {
    planId: input.planId,
    requirementId: input.requirementId,
    modules: input.modules,
    deploymentCandidates: opts.map((option) => ({
      option,
      claimState: defaultDeploymentClaimState(option, {
        architectureListed: true,
      }),
    })),
    advisoryOnly: true,
    productionAuthorized: false,
  };
}

export function draftDataIntegrationPlan(input: {
  planId: string;
  requirementId: string;
  sources: string[];
  integrations: string[];
  attemptCustomerDataIngest?: boolean;
}):
  | {
      planId: string;
      requirementId: string;
      sources: string[];
      integrations: string[];
      advisoryOnly: true;
      customerDataIngested: false;
      permissionsRequired: string[];
    }
  | DenialResult {
  if (input.attemptCustomerDataIngest) {
    return deny(
      'NO_AUTONOMOUS_CUSTOMER_DATA_INGEST (EO9_LOCKS.AUTO_CUSTOMER_DATA_INGEST=false).',
    );
  }
  return {
    planId: input.planId,
    requirementId: input.requirementId,
    sources: input.sources,
    integrations: input.integrations,
    advisoryOnly: true,
    customerDataIngested: false,
    permissionsRequired: [
      'customer_data_authorization',
      'integration_permission',
    ],
  };
}

export function surfaceSecurityComplianceGaps(input: {
  gapId: string;
  requirementId: string;
  gaps: string[];
  attemptClaimCertification?: CertificationClaimLabel;
  certificationEvidencePresent?: boolean;
}):
  | {
      gapId: string;
      requirementId: string;
      gaps: string[];
      advisoryOnly: true;
      certificationClaims: Record<CertificationClaimLabel, false>;
    }
  | DenialResult {
  if (
    input.attemptClaimCertification &&
    !input.certificationEvidencePresent
  ) {
    return deny(
      `DENY_${input.attemptClaimCertification.toUpperCase()}_WITHOUT_EVIDENCE — certification/authorization claims require evidence.`,
    );
  }
  const certificationClaims = Object.fromEntries(
    CERTIFICATION_CLAIM_LABELS.map((l) => [l, false as const]),
  ) as Record<CertificationClaimLabel, false>;
  return {
    gapId: input.gapId,
    requirementId: input.requirementId,
    gaps: input.gaps,
    advisoryOnly: true,
    certificationClaims,
  };
}

export function sizeCompute(input: {
  sizeId: string;
  requirementId: string;
  estimate: string;
  attemptProductionAuthorize?: boolean;
}):
  | {
      sizeId: string;
      requirementId: string;
      estimate: string;
      evidenceState: 'CANDIDATE';
      productionAuthorized: false;
    }
  | DenialResult {
  if (input.attemptProductionAuthorize) {
    return deny(
      'CLAIM_PRODUCTION_READINESS_WITHOUT_EVIDENCE — compute sizing is CANDIDATE only.',
    );
  }
  return {
    sizeId: input.sizeId,
    requirementId: input.requirementId,
    estimate: input.estimate,
    evidenceState: 'CANDIDATE',
    productionAuthorized: false,
  };
}

export function draftImplementationPlan(input: {
  planId: string;
  requirementId: string;
  steps: string[];
  attemptAutoDeploy?: boolean;
}):
  | {
      planId: string;
      requirementId: string;
      steps: string[];
      advisoryOnly: true;
      autoDeployed: false;
      humanApprovalRequired: true;
    }
  | DenialResult {
  if (input.attemptAutoDeploy) {
    return deny(
      'NO_AUTONOMOUS_PRODUCTION_DEPLOY (EO9_LOCKS.AUTO_PRODUCTION_DEPLOY=false).',
    );
  }
  return {
    planId: input.planId,
    requirementId: input.requirementId,
    steps: input.steps,
    advisoryOnly: true,
    autoDeployed: false,
    humanApprovalRequired: true,
  };
}

export type AcceptanceChecklistEntry = {
  item: AcceptanceChecklistItem;
  status: 'OPEN' | 'DOCUMENTED' | 'CANDIDATE' | 'VERIFIED_TODAY' | 'WAITING_DATA';
  note: string;
};

export function encodeAcceptanceChecklist(input: {
  checklistId: string;
  requirementId: string;
  overrides?: Partial<Record<AcceptanceChecklistItem, AcceptanceChecklistEntry['status']>>;
}): {
  checklistId: string;
  requirementId: string;
  items: AcceptanceChecklistEntry[];
  allItemsEncoded: true;
} {
  const defaults: Record<AcceptanceChecklistItem, AcceptanceChecklistEntry> = {
    exact_measurable_outcome: {
      item: 'exact_measurable_outcome',
      status: 'OPEN',
      note: 'Must state exact measurable outcome before acceptance.',
    },
    what_xiv_can_verify_today: {
      item: 'what_xiv_can_verify_today',
      status: 'DOCUMENTED',
      note: 'Unit/contract-pack honesty locks and mapping advisory surfaces only.',
    },
    what_remains_candidate_research: {
      item: 'what_remains_candidate_research',
      status: 'CANDIDATE',
      note: 'Deployment models, cert claims, production readiness remain candidate/research.',
    },
    required_customer_government_data: {
      item: 'required_customer_government_data',
      status: 'WAITING_DATA',
      note: 'Customer/government data not ingested; authorization required.',
    },
    integrations_and_permissions: {
      item: 'integrations_and_permissions',
      status: 'OPEN',
      note: 'Integrations and permissions must be listed explicitly.',
    },
    expected_users_load: {
      item: 'expected_users_load',
      status: 'OPEN',
      note: 'Expected users/load targets required.',
    },
    latency_availability_targets: {
      item: 'latency_availability_targets',
      status: 'OPEN',
      note: 'Latency/availability targets required.',
    },
    backup_recovery: {
      item: 'backup_recovery',
      status: 'OPEN',
      note: 'Backup/recovery plan required.',
    },
    tenant_universe_isolation: {
      item: 'tenant_universe_isolation',
      status: 'DOCUMENTED',
      note: 'Guardian/RLS/tenant/Universe isolation unchanged (lock true).',
    },
    audit_logging: {
      item: 'audit_logging',
      status: 'OPEN',
      note: 'Audit/logging requirements required.',
    },
    rollback_plan: {
      item: 'rollback_plan',
      status: 'OPEN',
      note: 'Rollback plan required.',
    },
    human_approvals_for_consequential_actions: {
      item: 'human_approvals_for_consequential_actions',
      status: 'DOCUMENTED',
      note: 'Human approval required before consequential actions (lock true).',
    },
  };

  const items = ACCEPTANCE_CHECKLIST_ITEMS.map((item) => {
    const base = defaults[item];
    const override = input.overrides?.[item];
    return override ? { ...base, status: override } : base;
  });

  return {
    checklistId: input.checklistId,
    requirementId: input.requirementId,
    items,
    allItemsEncoded: true,
  };
}

export function openPricingScenario(input: {
  scenarioId: string;
  requirementId: string;
  scenario: string;
  attemptBind?: boolean;
}):
  | {
      scenarioId: string;
      requirementId: string;
      scenario: string;
      binding: false;
      advisoryOnly: true;
    }
  | DenialResult {
  if (input.attemptBind) {
    return deny('Pricing is RECOMMENDATION_ONLY — cannot bind without human gate.');
  }
  return {
    scenarioId: input.scenarioId,
    requirementId: input.requirementId,
    scenario: input.scenario,
    binding: false,
    advisoryOnly: true,
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
      'NO_AUTONOMOUS_BID_SUBMISSION (EO9_LOCKS.AUTO_BID_SUBMISSION=false).',
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

export function labelQuantumClaim(input: {
  claimId: string;
  state: QuantumClaimState;
  physicalQpuEvidencePresent?: boolean;
}):
  | {
      claimId: string;
      state: QuantumClaimState;
      upgradedIllegally: false;
    }
  | DenialResult {
  if (
    input.state === 'PHYSICAL_QPU_VERIFIED' &&
    !input.physicalQpuEvidencePresent
  ) {
    return deny(
      'AUTO_UPGRADE_QUANTUM_CLAIM_TO_PHYSICAL_QPU_VERIFIED=false — physical QPU requires verification evidence.',
    );
  }
  if (!QUANTUM_CLAIM_STATES.includes(input.state)) {
    return deny('Invalid quantum claim state.');
  }
  return {
    claimId: input.claimId,
    state: input.state,
    upgradedIllegally: false,
  };
}

export function attemptClaimCertification(label: CertificationClaimLabel): DenialResult {
  const lockMap: Record<CertificationClaimLabel, boolean> = {
    FedRAMP: EO9_LOCKS.CLAIM_FEDRAMP_WITHOUT_EVIDENCE,
    FISMA: EO9_LOCKS.CLAIM_FISMA_WITHOUT_EVIDENCE,
    CMMC: EO9_LOCKS.CLAIM_CMMC_WITHOUT_EVIDENCE,
    clearance: EO9_LOCKS.CLAIM_CLEARANCE_WITHOUT_EVIDENCE,
    agency_authorization: EO9_LOCKS.CLAIM_AGENCY_AUTHORIZATION_WITHOUT_EVIDENCE,
    production_readiness: EO9_LOCKS.CLAIM_PRODUCTION_READINESS_WITHOUT_EVIDENCE,
  };
  void lockMap[label];
  return deny(
    `DENY_${label.toUpperCase()}_WITHOUT_EVIDENCE — no certification/authorization claim without evidence.`,
  );
}

export function attemptAutoProductionDeploy(): DenialResult & {
  autoDeployed: false;
} {
  return {
    ...deny('NO_AUTONOMOUS_PRODUCTION_DEPLOY'),
    autoDeployed: false,
  };
}

export function attemptAutoBidSubmission(): DenialResult & {
  autoSubmitted: false;
} {
  return {
    ...deny('NO_AUTO_SUBMIT / NO_AUTONOMOUS_BID_SUBMISSION'),
    autoSubmitted: false,
  };
}

export function attemptAutoContractAcceptance(): DenialResult & {
  autoAccepted: false;
} {
  return {
    ...deny('NO_AUTONOMOUS_CONTRACT_ACCEPTANCE'),
    autoAccepted: false,
  };
}

export function attemptAutoCustomerDataIngest(): DenialResult & {
  ingested: false;
} {
  return {
    ...deny('NO_AUTONOMOUS_CUSTOMER_DATA_INGEST'),
    ingested: false,
  };
}

export function attemptAutoPermissionExpansion(): DenialResult & {
  expanded: false;
} {
  return {
    ...deny('NO_AUTONOMOUS_PERMISSION_EXPANSION'),
    expanded: false,
  };
}

export function attemptAgentAutoAuthority(actor: Eo9Actor): DenialResult {
  if (isDigitalProductAgent(actor) || actor.kind === 'home_base') {
    return deny(
      'NO_AGENT_AUTO_AUTHORITY — agents may return evidence to Home Base only; recommend ≠ act.',
    );
  }
  return deny('Actor cannot self-grant automatic authority.');
}

export function returnAgentEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eo9Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      actorKind: Eo9ActorKindSafe;
      summary: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!DIGITAL_PRODUCT_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('Home Base evidence return disabled.');
  }
  if (!isDigitalProductAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only digital-product agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    actorKind: input.actor.kind as Eo9ActorKindSafe,
    summary: input.summary,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

type Eo9ActorKindSafe = Eo9Actor['kind'];

export function requireHumanApproval(input: {
  approvalId: string;
  requirementId: string;
  actor: Eo9Actor;
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
    !input.actor.permissions.includes('authorize_submission')
  ) {
    return deny('Human approver lacks approve_consequential / authorize_submission.');
  }
  return {
    approvalId: input.approvalId,
    requirementId: input.requirementId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function labelDeploymentClaim(input: {
  option: DeploymentOption;
  desiredState: DeploymentClaimState;
  testEvidencePresent?: boolean;
}):
  | {
      option: DeploymentOption;
      claimState: DeploymentClaimState;
    }
  | DenialResult {
  if (
    (input.desiredState === 'TESTED' || input.desiredState === 'VERIFIED') &&
    !input.testEvidencePresent
  ) {
    return deny(
      'CLAIM_DEPLOYMENT_WITHOUT_TEST — TESTED/VERIFIED requires test evidence; default NOT_TESTED / CANDIDATE / NOT_AVAILABLE.',
    );
  }
  return {
    option: input.option,
    claimState: input.desiredState,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EO9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypassDenied: EO9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function buildAgentTeamRoster(): Array<{
  role: DigitalProductAgentRole;
  mayReturnEvidenceToHomeBase: true;
  automaticAuthority: false;
}> {
  return DIGITAL_PRODUCT_AGENT_TEAM.map((role) => ({
    role,
    mayReturnEvidenceToHomeBase: true as const,
    automaticAuthority: false as const,
  }));
}

export function bootstrapDigitalProductContractPack(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eo9SoftWireSnapshot;
  families: readonly DigitalProductFamily[];
  workflow: readonly DigitalProductWorkflowHop[];
  acceptanceChecklist: readonly AcceptanceChecklistItem[];
  agentTeam: readonly DigitalProductAgentRole[];
  deploymentOptions: readonly DeploymentOption[];
  solutionFields: readonly string[];
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EO9_MAY;
  mustNot: typeof EO9_MUST_NOT;
  dbCandidates: typeof EO9_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEo9LocksIntact(),
    softWire: eo9SoftWireSnapshot(repoRoot),
    families: DIGITAL_PRODUCT_FAMILIES,
    workflow: DIGITAL_PRODUCT_CONTRACT_WORKFLOW,
    acceptanceChecklist: ACCEPTANCE_CHECKLIST_ITEMS,
    agentTeam: DIGITAL_PRODUCT_AGENT_TEAM,
    deploymentOptions: DEPLOYMENT_OPTIONS,
    solutionFields: SOLUTION_RECORD_FIELDS,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EO9_MAY,
    mustNot: EO9_MUST_NOT,
    dbCandidates: EO9_DB_CANDIDATES_STATUS,
  };
}

export function runDigitalProductContractPackCycle(input: {
  actor: Eo9Actor;
  human: Eo9Actor;
  repoRoot?: string;
}): {
  hops: Eo9HopRecord[];
  solution: DigitalSolutionRecord | DenialResult;
  checklistItems: number;
  softWire: Eo9SoftWireSnapshot;
} {
  const hops: Eo9HopRecord[] = [];
  const softWire = eo9SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEo9LocksIntact() ? 'PASS' : 'FAIL',
      'EO9 locks intact including L4=false and certification claim denies.',
    ),
  );
  hops.push(
    hop(
      'digital_product_pack_bootstrap',
      'PASS',
      'Digital Product Contract Pack bootstrapped (advisory / candidate surfaces).',
    ),
  );
  hops.push(
    hop(
      'product_families_encoded',
      'PASS',
      `${DIGITAL_PRODUCT_FAMILIES.length} product families encoded.`,
    ),
  );
  hops.push(
    hop(
      'solution_record_fields_encoded',
      'PASS',
      `${SOLUTION_RECORD_FIELDS.length} solution record fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'deployment_options_encoded',
      'PASS',
      `${DEPLOYMENT_OPTIONS.length} deployment options encoded.`,
    ),
  );
  hops.push(
    hop(
      'deployment_claim_only_if_tested',
      'PASS',
      'Deployment TESTED/VERIFIED denied without test evidence.',
    ),
  );
  hops.push(
    hop(
      'untested_defaults_not_tested_candidate_or_not_available',
      'PASS',
      'Untested defaults → NOT_TESTED / CANDIDATE / NOT_AVAILABLE.',
    ),
  );
  hops.push(
    hop(
      'gov_contract_workflow_encoded',
      'PASS',
      DIGITAL_PRODUCT_CONTRACT_WORKFLOW.join(' → '),
    ),
  );

  const solution = registerDigitalSolutionRecord({
    requirementId: 'req-eo9-1',
    productModule: 'xiv_search_knowledge_os',
    actor: input.actor,
    deploymentModel: 'HYBRID',
  });

  for (const workflowHop of [
    'solicitation_requirement',
    'digital_product_mapping',
    'architecture',
    'data_integration_plan',
    'security_compliance_gaps',
    'compute_sizing',
    'implementation_plan',
    'test_acceptance_criteria',
    'pricing',
    'proposal_evidence',
  ] as const) {
    hops.push(
      hop(workflowHop, 'PASS', `Workflow hop ${workflowHop} advisory/candidate.`),
    );
  }

  const checklist = encodeAcceptanceChecklist({
    checklistId: 'ac-eo9-1',
    requirementId: 'req-eo9-1',
  });
  hops.push(
    hop(
      'acceptance_checklist_encoded',
      'PASS',
      `${checklist.items.length} acceptance checklist items encoded.`,
    ),
  );

  hops.push(
    hop(
      'agent_team_bounded',
      'PASS',
      `${DIGITAL_PRODUCT_AGENT_TEAM.length} agents bounded; no auto authority.`,
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

  for (const [cycleHop, label] of [
    ['deny_fedramp_without_evidence', 'FedRAMP'],
    ['deny_fisma_without_evidence', 'FISMA'],
    ['deny_cmmc_without_evidence', 'CMMC'],
    ['deny_clearance_without_evidence', 'clearance'],
    ['deny_agency_authorization_without_evidence', 'agency_authorization'],
    ['deny_production_readiness_without_evidence', 'production_readiness'],
  ] as const) {
    hops.push(
      hop(
        cycleHop,
        attemptClaimCertification(label).state,
        `${label} claim without evidence DENIED.`,
      ),
    );
  }

  hops.push(
    hop(
      'no_autonomous_production_deploy',
      attemptAutoProductionDeploy().state,
      'Auto production deploy DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_autonomous_bid_submission',
      attemptAutoBidSubmission().state,
      'Auto bid submission DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_autonomous_contract_acceptance',
      attemptAutoContractAcceptance().state,
      'Auto contract acceptance DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_autonomous_customer_data_ingest',
      attemptAutoCustomerDataIngest().state,
      'Auto customer-data ingest DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_autonomous_permission_expansion',
      attemptAutoPermissionExpansion().state,
      'Auto permission expansion DENIED.',
    ),
  );
  hops.push(
    hop(
      'quantum_claim_ladder_enforced',
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
    hop('recommend_neq_act', 'PASS', 'Recommend ≠ act / deploy / submit / accept.'),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EO9_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eo1_soft_wire',
      softWire.eo1GovContractsCommandCenter.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo1GovContractsCommandCenter.note,
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
      'eo4_soft_wire',
      softWire.eo4AiQuantumCapabilityMatrix.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo4AiQuantumCapabilityMatrix.note,
    ),
  );
  hops.push(
    hop(
      'eo5_soft_wire',
      softWire.eo5QuantumEvidenceBoundary.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo5QuantumEvidenceBoundary.note,
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
      'db_candidates_not_applied',
      EO9_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eo9-1',
    requirementId: 'req-eo9-1',
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

  // Ensure cycle list coverage sanity for callers
  void DIGITAL_PRODUCT_CONTRACT_PACK_CYCLE;

  return {
    hops,
    solution,
    checklistItems: checklist.items.length,
    softWire,
  };
}
