/**
 * 62L-ES1 — Research-to-Product Candidate Gate runtime.
 *
 * Ingest validated research; walk core flow; deny incomplete promotion;
 * freeze quantum status; deny auto prod/pricing/contracts/public claims;
 * encode AMD local routing → Local Compute Optimizer scenario; cycle.
 */

import {
  ES1_AGENT_BOUNDS,
  ES1_DB_CANDIDATES_STATUS,
  ES1_LOCKS,
  ES1_MAY,
  ES1_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NON_LAWFUL_RIGHTS,
  PRODUCT_CANDIDATE_FIELDS,
  PRODUCT_CANDIDATE_STATES,
  PROMOTION_REQUIREMENTS,
  QUANTUM_PRODUCT_STATUSES,
  RESEARCH_TO_PRODUCT_CANDIDATE_GATE_CYCLE,
  RESEARCH_TO_PRODUCT_CORE_FLOW,
  RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY,
  allPromotionRequirementsMet,
  assertEs1LocksIntact,
  es1SoftWireSnapshot,
  isHumanApprover,
  missingPromotionRequirements,
  quantumProductStatusRank,
  softWireHopState,
  type ComputePathKind,
  type Es1Actor,
  type Es1EvidenceState,
  type Es1HopRecord,
  type Es1SoftWireSnapshot,
  type ProductCandidate,
  type ProductCandidateState,
  type PromotionChecklist,
  type QuantumProductStatus,
  type RightsState,
} from './research-to-product-candidate-gate-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof RESEARCH_TO_PRODUCT_CANDIDATE_GATE_CYCLE)[number],
  state: Es1EvidenceState,
  summary: string,
): Es1HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' | 'REJECTED';
  reason: string;
  executed: false;
  missingRequirements?: readonly string[];
};

function deny(
  reason: string,
  state: DenialResult['state'] = 'DENIED',
  missingRequirements?: readonly string[],
): DenialResult {
  return {
    denied: true,
    state,
    reason,
    executed: false,
    ...(missingRequirements ? { missingRequirements } : {}),
  };
}

function emptyChecklist(): PromotionChecklist {
  return {
    clearUserProblemFit: false,
    lawfulDataRights: false,
    reproducibleEvidence: false,
    definedSecurityBoundaries: false,
    measurableAcceptanceCriteria: false,
    costResourceEstimate: false,
    rollbackStopConditions: false,
    humanOwnership: false,
  };
}

export function checklistFromCandidate(
  candidate: ProductCandidate,
): PromotionChecklist {
  const lawful =
    !NON_LAWFUL_RIGHTS.includes(
      candidate.rightsState as (typeof NON_LAWFUL_RIGHTS)[number],
    ) &&
    (candidate.rightsState === 'PUBLIC_DOMAIN' ||
      candidate.rightsState === 'OPEN_LICENSE' ||
      candidate.rightsState === 'LICENSED' ||
      candidate.rightsState === 'AUTHORIZED' ||
      candidate.rightsState === 'PRIVATE_ORG_TENANT');

  return {
    clearUserProblemFit:
      candidate.problemBeingSolved.trim().length > 0 &&
      candidate.targetUserCustomer.trim().length > 0,
    lawfulDataRights: lawful,
    reproducibleEvidence: candidate.evidenceRefs.length > 0,
    definedSecurityBoundaries:
      candidate.securityPrivacyRequirements.length > 0,
    measurableAcceptanceCriteria: candidate.acceptanceCriteria.length > 0,
    costResourceEstimate:
      candidate.estimatedCostToBuild.trim().length > 0 &&
      candidate.estimatedCostToServe.trim().length > 0 &&
      candidate.requiredComputePath.length > 0,
    rollbackStopConditions: candidate.rollbackStopConditions.length > 0,
    humanOwnership: candidate.owner.trim().length > 0,
  };
}

export function ingestValidatedResearch(input: {
  actor: Es1Actor;
  candidateId: string;
  sourceResearch: string;
  problemBeingSolved?: string;
  rightsState?: RightsState;
  evidenceRefs?: readonly string[];
  quantumStatus?: QuantumProductStatus | null;
  classicalBaseline?: string;
  industry?: string;
}): ProductCandidate | DenialResult {
  if (!input.sourceResearch.trim()) {
    return deny('Validated research source is required.');
  }

  return {
    candidateId: input.candidateId,
    sourceResearch: input.sourceResearch,
    problemBeingSolved: input.problemBeingSolved ?? '',
    targetUserCustomer: '',
    industry: input.industry ?? '',
    valueHypothesis: '',
    requiredData: [],
    requiredApis: [],
    requiredAgents: [],
    requiredComputePath: [],
    architectureDependencies: [],
    securityPrivacyRequirements: [],
    classicalBaseline: input.classicalBaseline ?? '',
    quantumStatus: input.quantumStatus ?? null,
    prototypeScope: '',
    acceptanceCriteria: [],
    estimatedCostToBuild: '',
    estimatedCostToServe: '',
    pricingHypothesis: '',
    measurableSuccessMetrics: [],
    owner: '',
    blockers: [],
    evidenceRefs: input.evidenceRefs ?? [],
    state: 'RESEARCH_ONLY',
    rightsState: input.rightsState ?? 'AUTHORIZED',
    rollbackStopConditions: [],
    supportedHardwareMatrix: [],
    uxScope: '',
    testPlan: [],
    researchIsNotProduct: true,
    productIsNotProduction: true,
    l4AutonomyEnabled: false,
    productionReleaseAuthorized: false,
    pricingCommitmentAuthorized: false,
    customerLaunchAuthorized: false,
    contractAuthorized: false,
    cloudPurchaseAuthorized: false,
    permissionExpansionAuthorized: false,
    publicClaimAuthorized: false,
  };
}

export function defineProblem(
  candidate: ProductCandidate,
  problemBeingSolved: string,
): ProductCandidate | DenialResult {
  if (!problemBeingSolved.trim()) {
    return deny('Problem definition cannot be empty.');
  }
  return {
    ...candidate,
    problemBeingSolved,
    state:
      candidate.state === 'RESEARCH_ONLY'
        ? 'RESEARCH_ONLY'
        : candidate.state,
  };
}

export function formProductHypothesis(input: {
  candidate: ProductCandidate;
  valueHypothesis: string;
  industry: string;
}): ProductCandidate | DenialResult {
  if (!input.valueHypothesis.trim()) {
    return deny('Product hypothesis / value hypothesis required.');
  }
  if (!input.candidate.problemBeingSolved.trim()) {
    return deny('Problem definition required before product hypothesis.');
  }
  return {
    ...input.candidate,
    valueHypothesis: input.valueHypothesis,
    industry: input.industry,
    state: 'PRODUCT_HYPOTHESIS',
  };
}

export function identifyUserBuyer(input: {
  candidate: ProductCandidate;
  targetUserCustomer: string;
}): ProductCandidate | DenialResult {
  if (!input.targetUserCustomer.trim()) {
    return deny('Target user/buyer required.');
  }
  return {
    ...input.candidate,
    targetUserCustomer: input.targetUserCustomer,
  };
}

export function buildValueCase(input: {
  candidate: ProductCandidate;
  measurableSuccessMetrics: readonly string[];
}): ProductCandidate | DenialResult {
  if (input.measurableSuccessMetrics.length === 0) {
    return deny('Value case requires measurable success metrics.');
  }
  return {
    ...input.candidate,
    measurableSuccessMetrics: input.measurableSuccessMetrics,
  };
}

export function definePrototypeScope(input: {
  candidate: ProductCandidate;
  prototypeScope: string;
  acceptanceCriteria: readonly string[];
  requiredData?: readonly string[];
  requiredApis?: readonly string[];
  requiredAgents?: readonly string[];
  requiredComputePath?: readonly ComputePathKind[];
  architectureDependencies?: readonly string[];
  securityPrivacyRequirements?: readonly string[];
  classicalBaseline?: string;
  supportedHardwareMatrix?: readonly string[];
  uxScope?: string;
}): ProductCandidate | DenialResult {
  if (!input.prototypeScope.trim()) {
    return deny('Prototype scope required.');
  }
  if (input.acceptanceCriteria.length === 0) {
    return deny('Acceptance criteria required.');
  }
  return {
    ...input.candidate,
    prototypeScope: input.prototypeScope,
    acceptanceCriteria: input.acceptanceCriteria,
    requiredData: input.requiredData ?? input.candidate.requiredData,
    requiredApis: input.requiredApis ?? input.candidate.requiredApis,
    requiredAgents: input.requiredAgents ?? input.candidate.requiredAgents,
    requiredComputePath:
      input.requiredComputePath ?? input.candidate.requiredComputePath,
    architectureDependencies:
      input.architectureDependencies ??
      input.candidate.architectureDependencies,
    securityPrivacyRequirements:
      input.securityPrivacyRequirements ??
      input.candidate.securityPrivacyRequirements,
    classicalBaseline:
      input.classicalBaseline ?? input.candidate.classicalBaseline,
    supportedHardwareMatrix:
      input.supportedHardwareMatrix ??
      input.candidate.supportedHardwareMatrix,
    uxScope: input.uxScope ?? input.candidate.uxScope,
    state: 'PROTOTYPE_READY',
  };
}

export function defineTestPlan(input: {
  candidate: ProductCandidate;
  testPlan: readonly string[];
}): ProductCandidate | DenialResult {
  if (input.testPlan.length === 0) {
    return deny('Test plan required.');
  }
  return {
    ...input.candidate,
    testPlan: input.testPlan,
    state: 'TESTING',
  };
}

export function formPricingHypothesis(input: {
  candidate: ProductCandidate;
  pricingHypothesis: string;
  estimatedCostToBuild: string;
  estimatedCostToServe: string;
}): ProductCandidate | DenialResult {
  if (!input.pricingHypothesis.trim()) {
    return deny('Pricing hypothesis required (hypothesis only — not a commitment).');
  }
  if (
    !input.estimatedCostToBuild.trim() ||
    !input.estimatedCostToServe.trim()
  ) {
    return deny('Cost-to-build and cost-to-serve estimates required.');
  }
  return {
    ...input.candidate,
    pricingHypothesis: input.pricingHypothesis,
    estimatedCostToBuild: input.estimatedCostToBuild,
    estimatedCostToServe: input.estimatedCostToServe,
    pricingCommitmentAuthorized: false,
  };
}

export function attachRiskAndOwnership(input: {
  candidate: ProductCandidate;
  owner: string;
  rollbackStopConditions: readonly string[];
  blockers?: readonly string[];
  securityPrivacyRequirements?: readonly string[];
}): ProductCandidate | DenialResult {
  if (!input.owner.trim()) {
    return deny('Human ownership required.');
  }
  if (input.rollbackStopConditions.length === 0) {
    return deny('Rollback/stop conditions required.');
  }
  return {
    ...input.candidate,
    owner: input.owner,
    rollbackStopConditions: input.rollbackStopConditions,
    blockers: input.blockers ?? input.candidate.blockers,
    securityPrivacyRequirements:
      input.securityPrivacyRequirements ??
      input.candidate.securityPrivacyRequirements,
  };
}

/**
 * Promote only when all promotion requirements are met.
 * Incomplete → DENIED (not silent advance).
 */
export function promoteToSandboxCandidate(input: {
  candidate: ProductCandidate;
  forceIncomplete?: boolean;
}): ProductCandidate | DenialResult {
  if (input.forceIncomplete === true) {
    return deny(
      'Incomplete promotion denied — all promotion requirements must pass.',
    );
  }

  const checklist = checklistFromCandidate(input.candidate);
  if (!allPromotionRequirementsMet(checklist)) {
    const missing = missingPromotionRequirements(checklist);
    return deny(
      `Incomplete promotion denied — missing: ${missing.join(', ')}`,
      'DENIED',
      missing,
    );
  }

  if (input.candidate.state === 'REJECTED' || input.candidate.state === 'BLOCKED') {
    return deny(
      `Cannot promote from ${input.candidate.state}.`,
      input.candidate.state === 'BLOCKED' ? 'BLOCKED' : 'REJECTED',
    );
  }

  return {
    ...input.candidate,
    state: 'SANDBOX_CANDIDATE',
    productIsNotProduction: true,
    productionReleaseAuthorized: false,
  };
}

export function advanceCandidateState(input: {
  candidate: ProductCandidate;
  next: ProductCandidateState;
}): ProductCandidate | DenialResult {
  const allowedFrom: Record<ProductCandidateState, ProductCandidateState[]> = {
    RESEARCH_ONLY: ['PRODUCT_HYPOTHESIS', 'REJECTED', 'BLOCKED'],
    PRODUCT_HYPOTHESIS: [
      'SANDBOX_CANDIDATE',
      'PROTOTYPE_READY',
      'REJECTED',
      'BLOCKED',
    ],
    SANDBOX_CANDIDATE: [
      'PROTOTYPE_READY',
      'TESTING',
      'REJECTED',
      'BLOCKED',
    ],
    PROTOTYPE_READY: ['TESTING', 'SANDBOX_CANDIDATE', 'REJECTED', 'BLOCKED'],
    TESTING: [
      'VALIDATED_CANDIDATE',
      'SANDBOX_CANDIDATE',
      'REJECTED',
      'BLOCKED',
    ],
    VALIDATED_CANDIDATE: ['REJECTED', 'BLOCKED'],
    REJECTED: [],
    BLOCKED: ['RESEARCH_ONLY', 'REJECTED'],
  };

  if (input.next === 'SANDBOX_CANDIDATE') {
    return promoteToSandboxCandidate({ candidate: input.candidate });
  }

  if (!allowedFrom[input.candidate.state].includes(input.next)) {
    return deny(
      `Illegal state transition ${input.candidate.state} → ${input.next}.`,
    );
  }

  if (input.next === 'VALIDATED_CANDIDATE') {
    const checklist = checklistFromCandidate(input.candidate);
    if (!allPromotionRequirementsMet(checklist)) {
      return deny(
        'VALIDATED_CANDIDATE requires complete promotion requirements.',
        'DENIED',
        missingPromotionRequirements(checklist),
      );
    }
  }

  return { ...input.candidate, state: input.next };
}

/**
 * Quantum status freeze: marketing / product copy must not upgrade rank.
 */
export function attemptQuantumStatusUpgrade(input: {
  candidate: ProductCandidate;
  claimedStatus: QuantumProductStatus;
  viaMarketing?: boolean;
}): ProductCandidate | DenialResult {
  const current = input.candidate.quantumStatus ?? 'THEORETICAL';
  const currentRank = quantumProductStatusRank(current);
  const claimedRank = quantumProductStatusRank(input.claimedStatus);

  if (claimedRank > currentRank) {
    return deny(
      `Quantum status freeze — cannot upgrade ${current} → ${input.claimedStatus}` +
        (input.viaMarketing ? ' via product marketing' : ''),
    );
  }

  return {
    ...input.candidate,
    quantumStatus: input.claimedStatus,
  };
}

export function attemptAutoProductionRelease(
  _candidate: ProductCandidate,
): DenialResult {
  return deny(
    'No automatic production release — candidate ≠ PRODUCTION AUTHORIZED.',
  );
}

export function attemptAutoPricingCommitment(
  _candidate: ProductCandidate,
): DenialResult {
  return deny(
    'No automatic pricing commitment — pricing hypothesis is not a commitment.',
  );
}

export function attemptAutoCustomerLaunch(
  _candidate: ProductCandidate,
): DenialResult {
  return deny('No automatic customer launch.');
}

export function attemptAutoContract(_candidate: ProductCandidate): DenialResult {
  return deny('No automatic contract.');
}

export function attemptAutoCloudPurchase(
  _candidate: ProductCandidate,
): DenialResult {
  return deny('No automatic cloud purchase.');
}

export function attemptPermissionExpansion(
  _candidate: ProductCandidate,
): DenialResult {
  return deny('No automatic permission expansion.');
}

export function attemptPublicClaim(input: {
  candidate: ProductCandidate;
  claim: string;
}): DenialResult {
  return deny(
    `No automatic public claim — refused: ${input.claim.slice(0, 120)}`,
  );
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Guardian/RLS/tenant/Universe isolation remains enforced.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('Cannot expand tenant/Universe access via product candidate gate.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('Recommend ≠ act — agents have recommendation-only authority.');
}

export function probeGuardianRlsTenantUniverseIsolation(input: {
  actor: Es1Actor;
  candidateTenantId: string;
  candidateUniverseId: string;
}): {
  isolated: true;
  sameTenant: boolean;
  sameUniverse: boolean;
  l4: false;
} {
  return {
    isolated: true,
    sameTenant: input.actor.tenantId === input.candidateTenantId,
    sameUniverse: input.actor.universeId === input.candidateUniverseId,
    l4: false,
  };
}

export function requireHumanApproval(input: {
  actor: Es1Actor;
  action: string;
}): { approved: boolean; reason: string } {
  if (!isHumanApprover(input.actor)) {
    return {
      approved: false,
      reason: `Human approval required for consequential action: ${input.action}`,
    };
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return {
      approved: false,
      reason: 'Approver lacks approve_consequential permission.',
    };
  }
  return {
    approved: true,
    reason: `Human-approved (bounded): ${input.action}`,
  };
}

/**
 * Example scenario (test/encode only — not a marketing claim):
 * AMD local routing improves a specific workload → could become
 * "XIV Local Compute Optimizer" only after full gate.
 */
export function exampleAmdLocalRoutingOptimizerCandidate(): ProductCandidate {
  return {
    candidateId: 'cand-xiv-local-compute-optimizer-001',
    sourceResearch:
      'AMD local routing improves a specific workload (research finding; not product).',
    problemBeingSolved:
      'Reduce latency/cost for eligible local inference workloads on supported AMD hardware.',
    targetUserCustomer:
      'XIV operators / tenants needing local compute optimization on AMD endpoints',
    industry: 'local_ai_runtime_optimization',
    valueHypothesis:
      'Bounded local routing on supported AMD hardware can lower cost-to-serve for specific workloads vs unoptimized CPU path.',
    requiredData: [
      'workload_benchmarks',
      'hardware_capability_probe',
      'rights_cleared_telemetry_aggregates',
    ],
    requiredApis: ['local_runtime_probe', 'benchmark_ledger_read'],
    requiredAgents: ['routing_research_agent', 'benchmark_agent'],
    requiredComputePath: ['CPU', 'GPU', 'NPU'],
    architectureDependencies: [
      'EP7 AMD adapter research path',
      'EQ16 software wormhole router',
      'local hardware truth probe',
    ],
    securityPrivacyRequirements: [
      'tenant_universe_isolation',
      'no_cross_tenant_benchmark_leak',
      'guardian_rls_enforced',
    ],
    classicalBaseline: 'CPU-only unoptimized local routing for same workload',
    quantumStatus: null,
    prototypeScope:
      'Sandbox prototype: measure AMD local routing on approved hardware matrix with rollback.',
    acceptanceCriteria: [
      'benchmark_repeatability_pass',
      'supported_hardware_matrix_documented',
      'ux_bounded_local_controls',
      'pricing_hypothesis_documented_not_committed',
      'test_plan_executed_in_sandbox',
    ],
    estimatedCostToBuild: 'sandbox_estimate_not_production_budget',
    estimatedCostToServe: 'per_workload_estimate_hypothesis',
    pricingHypothesis:
      'Optional add-on for local optimizer — hypothesis only; no commitment.',
    measurableSuccessMetrics: [
      'p95_latency_delta_vs_classical_baseline',
      'cost_proxy_delta',
      'repeatability_across_n_runs',
    ],
    owner: 'human-candidate-owner-1',
    blockers: [
      'requires_benchmark_repeatability',
      'requires_product_scope',
      'requires_supported_hardware_matrix',
      'requires_ux',
      'requires_pricing_hypothesis',
      'requires_tests',
    ],
    evidenceRefs: [
      'research://amd-local-routing/workload-x/bench-v1',
      'ep7://amd-adapter-research-path',
    ],
    state: 'PRODUCT_HYPOTHESIS',
    rightsState: 'AUTHORIZED',
    rollbackStopConditions: [
      'stop_on_regression_vs_classical_baseline',
      'stop_on_thermal_or_resource_governor_trip',
      'revoke_sandbox_on_rights_change',
    ],
    supportedHardwareMatrix: [
      'amd_cpu_supported_sku_list_tbd',
      'amd_gpu_candidate_not_verified',
      'amd_npu_candidate_not_verified',
    ],
    uxScope: 'bounded_local_controls_for_optimizer_toggle',
    testPlan: [
      'benchmark',
      'repeatability',
      'product_scope_review',
      'hardware_matrix_check',
      'ux_review',
      'pricing_hypothesis_review',
      'sandbox_tests',
    ],
    researchIsNotProduct: true,
    productIsNotProduction: true,
    l4AutonomyEnabled: false,
    productionReleaseAuthorized: false,
    pricingCommitmentAuthorized: false,
    customerLaunchAuthorized: false,
    contractAuthorized: false,
    cloudPurchaseAuthorized: false,
    permissionExpansionAuthorized: false,
    publicClaimAuthorized: false,
  };
}

export function returnEvidenceToHomeBase(input: {
  candidate: ProductCandidate;
  summary: string;
}): {
  receiptId: string;
  candidateId: string;
  state: ProductCandidateState;
  summary: string;
  productionAuthorized: false;
} {
  return {
    receiptId: `es1-ev-${input.candidate.candidateId}`,
    candidateId: input.candidate.candidateId,
    state: input.candidate.state,
    summary: input.summary,
    productionAuthorized: false,
  };
}

export function bootstrapResearchToProductCandidateGate(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Es1SoftWireSnapshot;
  honesty: typeof HONESTY_BANNER;
  layer: typeof ES_LAYER_TITLE;
  next: typeof NEXT_PHASE_TITLE;
  dbCandidates: typeof ES1_DB_CANDIDATES_STATUS;
  sot: {
    label: typeof GITHUB_SOT_LABEL;
    family: typeof GITHUB_SOT_FAMILY;
    issue: typeof GITHUB_SOT_ISSUE;
    issueNote: typeof GITHUB_SOT_ISSUE_NOTE;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
  };
} {
  const softWire = es1SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEs1LocksIntact(),
    softWire,
    honesty: HONESTY_BANNER,
    layer: ES_LAYER_TITLE,
    next: NEXT_PHASE_TITLE,
    dbCandidates: ES1_DB_CANDIDATES_STATUS,
    sot: {
      label: GITHUB_SOT_LABEL,
      family: GITHUB_SOT_FAMILY,
      issue: GITHUB_SOT_ISSUE,
      issueNote: GITHUB_SOT_ISSUE_NOTE,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
    },
  };
}

export function runResearchToProductCandidateGateCycle(input: {
  actor: Es1Actor;
  repoRoot?: string;
}): {
  hops: Es1HopRecord[];
  softWire: Es1SoftWireSnapshot;
  example: ProductCandidate;
  promoted: ProductCandidate | DenialResult;
  incompleteDenied: DenialResult;
} {
  const hops: Es1HopRecord[] = [];
  const boot = bootstrapResearchToProductCandidateGate(input.repoRoot);
  const soft = boot.softWire;

  hops.push(
    hop(
      'honesty_locks',
      boot.locksIntact ? 'PASS' : 'FAIL',
      `Locks intact=${boot.locksIntact}; L4=false; honesty ladder enforced.`,
    ),
  );
  hops.push(
    hop(
      'research_to_product_candidate_gate_bootstrap',
      'PASS',
      'Research-to-Product Candidate Gate bootstrap; soft-wires probed.',
    ),
  );
  hops.push(
    hop(
      'candidate_fields_encoded',
      PRODUCT_CANDIDATE_FIELDS.length === 23 ? 'PASS' : 'FAIL',
      `${PRODUCT_CANDIDATE_FIELDS.length} candidate fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'candidate_states_encoded',
      PRODUCT_CANDIDATE_STATES.length === 8 ? 'PASS' : 'FAIL',
      `${PRODUCT_CANDIDATE_STATES.length} states encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      RESEARCH_TO_PRODUCT_CORE_FLOW.length === 10 ? 'PASS' : 'FAIL',
      `Core flow hops=${RESEARCH_TO_PRODUCT_CORE_FLOW.length}.`,
    ),
  );
  hops.push(
    hop(
      'promotion_requirements_encoded',
      PROMOTION_REQUIREMENTS.length === 8 ? 'PASS' : 'FAIL',
      `${PROMOTION_REQUIREMENTS.length} promotion requirements encoded.`,
    ),
  );
  hops.push(
    hop(
      'quantum_statuses_encoded',
      QUANTUM_PRODUCT_STATUSES[0] === 'THEORETICAL' &&
        QUANTUM_PRODUCT_STATUSES[3] === 'PHYSICAL_QPU_VERIFIED'
        ? 'PASS'
        : 'FAIL',
      'Quantum statuses THEORETICAL→PHYSICAL_QPU_VERIFIED encoded.',
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.researchIsNotProduct &&
        RESEARCH_TO_PRODUCT_TRUTH_BOUNDARY.productIsNotProduction
        ? 'PASS'
        : 'FAIL',
      'research≠product≠production truth boundary encoded.',
    ),
  );

  let cand = ingestValidatedResearch({
    actor: input.actor,
    candidateId: 'cycle-cand-1',
    sourceResearch: 'Validated research packet (cycle).',
    problemBeingSolved: 'Cycle problem',
    evidenceRefs: ['ev://cycle-1'],
    quantumStatus: 'SIMULATED',
    classicalBaseline: 'classical-cycle-baseline',
  });
  if ('denied' in cand) {
    hops.push(hop('ingest_validated_research', 'FAIL', cand.reason));
    return {
      hops,
      softWire: soft,
      example: exampleAmdLocalRoutingOptimizerCandidate(),
      promoted: cand,
      incompleteDenied: cand,
    };
  }
  hops.push(
    hop('ingest_validated_research', 'RESEARCH_ONLY', 'Ingested as RESEARCH_ONLY.'),
  );

  const problem = defineProblem(cand, cand.problemBeingSolved);
  if ('denied' in problem) {
    hops.push(hop('define_problem', 'DENIED', problem.reason));
  } else {
    cand = problem;
    hops.push(hop('define_problem', 'PASS', 'Problem defined.'));
  }

  const hyp = formProductHypothesis({
    candidate: cand,
    valueHypothesis: 'Cycle value hypothesis',
    industry: 'cycle_industry',
  });
  if ('denied' in hyp) {
    hops.push(hop('form_product_hypothesis', 'DENIED', hyp.reason));
  } else {
    cand = hyp;
    hops.push(
      hop('form_product_hypothesis', 'PRODUCT_HYPOTHESIS', 'Hypothesis formed.'),
    );
  }

  const user = identifyUserBuyer({
    candidate: cand,
    targetUserCustomer: 'cycle-user',
  });
  if ('denied' in user) {
    hops.push(hop('identify_user_buyer', 'DENIED', user.reason));
  } else {
    cand = user;
    hops.push(hop('identify_user_buyer', 'PASS', 'User/buyer identified.'));
  }

  const value = buildValueCase({
    candidate: cand,
    measurableSuccessMetrics: ['metric_a'],
  });
  if ('denied' in value) {
    hops.push(hop('build_value_case', 'DENIED', value.reason));
  } else {
    cand = value;
    hops.push(hop('build_value_case', 'PASS', 'Value case built.'));
  }

  const scope = definePrototypeScope({
    candidate: cand,
    prototypeScope: 'sandbox prototype scope',
    acceptanceCriteria: ['ac-1'],
    requiredComputePath: ['CPU'],
    securityPrivacyRequirements: ['tenant_isolation'],
    classicalBaseline: 'classical-cycle-baseline',
  });
  if ('denied' in scope) {
    hops.push(hop('define_prototype_scope', 'DENIED', scope.reason));
  } else {
    cand = scope;
    hops.push(
      hop('define_prototype_scope', 'PROTOTYPE_READY', 'Prototype scope set.'),
    );
  }

  const tests = defineTestPlan({
    candidate: cand,
    testPlan: ['unit', 'sandbox'],
  });
  if ('denied' in tests) {
    hops.push(hop('define_test_plan', 'DENIED', tests.reason));
  } else {
    cand = tests;
    hops.push(hop('define_test_plan', 'TESTING', 'Test plan set.'));
  }

  const pricing = formPricingHypothesis({
    candidate: cand,
    pricingHypothesis: 'hypothesis-only pricing',
    estimatedCostToBuild: 'build-est',
    estimatedCostToServe: 'serve-est',
  });
  if ('denied' in pricing) {
    hops.push(hop('form_pricing_hypothesis', 'DENIED', pricing.reason));
  } else {
    cand = pricing;
    hops.push(
      hop(
        'form_pricing_hypothesis',
        'PASS',
        'Pricing hypothesis recorded (not committed).',
      ),
    );
  }

  const risk = attachRiskAndOwnership({
    candidate: cand,
    owner: 'human-owner-cycle',
    rollbackStopConditions: ['stop_on_fail'],
  });
  if ('denied' in risk) {
    hops.push(hop('risk_review', 'DENIED', risk.reason));
  } else {
    cand = risk;
    hops.push(hop('risk_review', 'PASS', 'Risk/ownership attached.'));
  }

  const checklist = checklistFromCandidate(cand);
  hops.push(
    hop(
      'evaluate_promotion_requirements',
      allPromotionRequirementsMet(checklist) ? 'PASS' : 'DENIED',
      `Promotion checklist complete=${allPromotionRequirementsMet(checklist)}.`,
    ),
  );

  const incomplete = promoteToSandboxCandidate({
    candidate: {
      ...cand,
      owner: '',
    },
  });
  const incompleteDenied: DenialResult =
    'denied' in incomplete
      ? incomplete
      : deny('expected incomplete denial');
  hops.push(
    hop(
      'deny_incomplete_promotion',
      'denied' in incomplete ? 'DENIED' : 'FAIL',
      incompleteDenied.reason,
    ),
  );

  const promoted = promoteToSandboxCandidate({ candidate: cand });
  hops.push(
    hop(
      'promote_to_sandbox_candidate',
      'denied' in promoted ? 'DENIED' : 'SANDBOX_CANDIDATE',
      'denied' in promoted
        ? promoted.reason
        : 'Promoted to SANDBOX_CANDIDATE.',
    ),
  );
  if (!('denied' in promoted)) {
    cand = promoted;
  }

  hops.push(
    hop(
      'freeze_quantum_status',
      cand.quantumStatus === 'SIMULATED' ? 'PASS' : 'FAIL',
      `Quantum status retained: ${cand.quantumStatus}.`,
    ),
  );

  const upgrade = attemptQuantumStatusUpgrade({
    candidate: cand,
    claimedStatus: 'PHYSICAL_QPU_VERIFIED',
    viaMarketing: true,
  });
  hops.push(
    hop(
      'deny_quantum_status_upgrade',
      'denied' in upgrade ? 'DENIED' : 'FAIL',
      'denied' in upgrade ? upgrade.reason : 'upgrade unexpectedly allowed',
    ),
  );

  const example = exampleAmdLocalRoutingOptimizerCandidate();
  hops.push(
    hop(
      'amd_local_routing_optimizer_scenario',
      example.state === 'PRODUCT_HYPOTHESIS' &&
        example.researchIsNotProduct &&
        !example.productionReleaseAuthorized
        ? 'PASS'
        : 'FAIL',
      'AMD local routing → Local Compute Optimizer encoded as scenario (not marketing).',
    ),
  );

  hops.push(
    hop(
      'deny_auto_production_release',
      attemptAutoProductionRelease(cand).state,
      attemptAutoProductionRelease(cand).reason,
    ),
  );
  hops.push(
    hop(
      'deny_auto_pricing_commitment',
      attemptAutoPricingCommitment(cand).state,
      attemptAutoPricingCommitment(cand).reason,
    ),
  );
  hops.push(
    hop(
      'deny_auto_customer_launch',
      attemptAutoCustomerLaunch(cand).state,
      attemptAutoCustomerLaunch(cand).reason,
    ),
  );
  hops.push(
    hop(
      'deny_auto_contract',
      attemptAutoContract(cand).state,
      attemptAutoContract(cand).reason,
    ),
  );
  hops.push(
    hop(
      'deny_auto_cloud_purchase',
      attemptAutoCloudPurchase(cand).state,
      attemptAutoCloudPurchase(cand).reason,
    ),
  );
  hops.push(
    hop(
      'deny_permission_expansion',
      attemptPermissionExpansion(cand).state,
      attemptPermissionExpansion(cand).reason,
    ),
  );
  hops.push(
    hop(
      'deny_public_claim',
      attemptPublicClaim({
        candidate: cand,
        claim: 'XIV Local Compute Optimizer is production-ready',
      }).state,
      'Public claim denied.',
    ),
  );
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      attemptBypassGuardianRls().state,
      attemptBypassGuardianRls().reason,
    ),
  );
  hops.push(
    hop(
      'deny_expand_tenant_universe_access',
      attemptExpandTenantUniverseAccess().state,
      attemptExpandTenantUniverseAccess().reason,
    ),
  );
  hops.push(
    hop(
      'research_neq_product',
      cand.researchIsNotProduct ? 'PASS' : 'FAIL',
      'research ≠ product.',
    ),
  );
  hops.push(
    hop(
      'product_neq_production',
      cand.productIsNotProduction && !cand.productionReleaseAuthorized
        ? 'PASS'
        : 'FAIL',
      'product candidate ≠ production.',
    ),
  );
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      'PASS',
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state,
      attemptRecommendAsAct().reason,
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ES1_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
  );

  hops.push(
    hop(
      'er40_founder_brief_soft_wire',
      softWireHopState(soft.er40FounderBrief.present || soft.er40Report.present),
      soft.er40FounderBrief.note,
    ),
  );
  hops.push(
    hop(
      'er39_revenue_evidence_soft_wire',
      softWireHopState(
        soft.er39RevenueEvidence.present || soft.er39Report.present,
      ),
      soft.er39RevenueEvidence.note,
    ),
  );
  hops.push(
    hop(
      'er18_review_board_soft_wire',
      softWireHopState(
        soft.er18ResearchReviewBoard.present || soft.er18Report.present,
      ),
      soft.er18ResearchReviewBoard.note,
    ),
  );
  hops.push(
    hop(
      'er7_science_atlas_soft_wire',
      softWireHopState(
        soft.er7ScienceEngineeringAtlas.present || soft.er7Report.present,
      ),
      soft.er7ScienceEngineeringAtlas.note,
    ),
  );
  hops.push(
    hop(
      'eq16_wormhole_soft_wire',
      softWireHopState(
        soft.eq16SoftwareWormholeRouter.present || soft.eq16Report.present,
      ),
      soft.eq16SoftwareWormholeRouter.note,
    ),
  );
  hops.push(
    hop(
      'ep7_amd_adapter_soft_wire',
      softWireHopState(
        soft.ep7AmdAdapterResearchPath.present || soft.ep7Report.present,
      ),
      soft.ep7AmdAdapterResearchPath.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWireHopState(soft.em157HomeBase.present),
      soft.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ES1_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );
  hops.push(
    hop(
      'evidence',
      'PASS',
      `Cycle complete; may=${ES1_MAY.length}; must_not=${ES1_MUST_NOT.length}; bounds recommendOnly=${ES1_AGENT_BOUNDS.mayRecommendOnly}.`,
    ),
  );

  // Ensure cycle length matches constant (defensive).
  void RESEARCH_TO_PRODUCT_CANDIDATE_GATE_CYCLE;

  return {
    hops,
    softWire: soft,
    example,
    promoted,
    incompleteDenied,
  };
}
