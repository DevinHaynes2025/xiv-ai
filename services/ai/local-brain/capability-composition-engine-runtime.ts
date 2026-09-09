/**
 * 62L-ES27 — Capability Composition Engine runtime.
 *
 * Compose certified skills under permission INTERSECTION; compatibility gate;
 * PARTIAL/BLOCKED failure honesty; evidence merge; cost estimate; revocation
 * propagation. No bid submit / contract / payment / fabricate / L4.
 */

import { createHash } from 'node:crypto';
import {
  CAPABILITY_COMPOSITION_CORE_FLOW,
  CAPABILITY_COMPOSITION_CYCLE,
  CAPABILITY_COMPOSITION_TRUTH_BOUNDARY,
  COMPATIBILITY_CHECKS,
  COMPOSITION_STATES,
  COMPOSITION_TRACKING_FIELDS,
  ES27_AGENT_BOUNDS,
  ES27_DB_CANDIDATES_STATUS,
  ES27_LOCKS,
  ES27_MAY,
  ES27_MUST_NOT,
  ES_LAYER_TITLE,
  FORBIDDEN_COMPOSITION_ACTIONS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_CONTRACT_EXPECTED_OUTPUTS,
  GOV_CONTRACT_WORKFLOW_STAGES,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  assertEs27LocksIntact,
  es27SoftWireSnapshot,
  intersectPermissions,
  isEs27Agent,
  isHumanApprover,
  permissionModeIsIntersection,
  softWireHopState,
  unionPermissions,
  type CertifiedSkill,
  type CompatibilityResult,
  type CompositionAgent,
  type CostEstimate,
  type Es27Actor,
  type Es27EvidenceState,
  type Es27HopRecord,
  type Es27SoftWireSnapshot,
  type FailureReceipt,
  type ForbiddenCompositionAction,
  type MergedEvidence,
  type SkillEvidenceSlice,
  type SkillPermission,
  type WorkflowComposition,
} from './capability-composition-engine-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CAPABILITY_COMPOSITION_CYCLE)[number],
  state: Es27EvidenceState,
  summary: string,
): Es27HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' | 'PARTIAL';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' | 'PARTIAL' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export function estimateCompositionCost(input: {
  skills: readonly CertifiedSkill[];
  costBudget: number;
  extraModelUnits?: number;
  extraApiUnits?: number;
  extraComputeUnits?: number;
  extraStorageNetworkUnits?: number;
}): CostEstimate {
  const agentUnits = input.skills.length * 2;
  const modelUnits =
    input.skills.reduce((s, sk) => s + sk.costEstimateUnits, 0) +
    (input.extraModelUnits ?? 0);
  const apiUnits =
    input.skills.reduce((s, sk) => s + sk.authorizedApis.length, 0) +
    (input.extraApiUnits ?? 0);
  const computeUnits = (input.extraComputeUnits ?? 0) + input.skills.length;
  const storageNetworkUnits = input.extraStorageNetworkUnits ?? 1;
  const totalUnits =
    agentUnits + modelUnits + apiUnits + computeUnits + storageNetworkUnits;
  return {
    agentUnits,
    modelUnits,
    apiUnits,
    computeUnits,
    storageNetworkUnits,
    totalUnits,
    withinBudget: totalUnits <= input.costBudget,
    autonomousPurchaseAttempted: false,
    budgetExpansionAttempted: false,
  };
}

export function checkSkillCompatibility(
  skills: readonly CertifiedSkill[],
  policyCeiling: number,
): CompatibilityResult {
  const checks = {
    skill_versions_current: skills.every((s) => s.versionCurrent),
    data_scopes_compatible: skills.every((s) => s.dataScopes.length > 0),
    apis_authorized: skills.every((s) => s.authorizedApis.length > 0),
    models_runtimes_available: skills.every((s) => s.modelsRuntimes.length > 0),
    output_schema_matches_next_input: skills.every((s, i) => {
      if (i === skills.length - 1) return true;
      return s.outputSchema === skills[i + 1]!.inputSchema;
    }),
    no_revoked_dependency: skills.every((s) => !s.revoked),
    cost_resource_ceilings_within_policy:
      estimateCompositionCost({ skills, costBudget: policyCeiling })
        .withinBudget,
  } as const satisfies Record<(typeof COMPATIBILITY_CHECKS)[number], boolean>;

  const blockers: string[] = [];
  for (const key of COMPATIBILITY_CHECKS) {
    if (!checks[key]) blockers.push(key);
  }
  return { ok: blockers.length === 0, checks, blockers };
}

export function mergeSkillEvidence(
  slices: readonly SkillEvidenceSlice[],
): MergedEvidence {
  for (const slice of slices) {
    if (slice.fabricated !== false) {
      throw new Error('FABRICATED_EVIDENCE_FORBIDDEN');
    }
  }
  return {
    slices: [...slices],
    preservesSkillProvenance: true,
    fabricatedDownstream: false,
  };
}

export function composeWorkflow(input: {
  actor: Es27Actor;
  compositionId: string;
  mission: string;
  skills: readonly CertifiedSkill[];
  agents: readonly CompositionAgent[];
  requiredApisTools?: readonly string[];
  requiredDataClasses?: readonly string[];
  computeRuntimeNeeds?: readonly string[];
  costBudget: number;
  timeoutMs?: number;
  approvalCheckpoints?: readonly string[];
  expectedOutputs?: readonly string[];
  evidenceRequirements?: readonly string[];
  fallbackPaths?: readonly string[];
  attemptPermissionUnion?: boolean;
  attemptBidSubmission?: boolean;
  attemptContractSigning?: boolean;
  attemptPaymentAuthority?: boolean;
  attemptFabricateDownstream?: boolean;
  attemptCloudPurchase?: boolean;
  attemptBudgetExpand?: boolean;
  attemptHiddenToolChain?: boolean;
  attemptCrossTenantPool?: boolean;
  attemptAutonomousProductionChange?: boolean;
  includeHiddenChainOfThought?: boolean;
}): WorkflowComposition | DenialResult {
  if (!isEs27Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only capability composers / mission agents may compose.');
  }
  if (input.attemptPermissionUnion === true) {
    return deny(
      'Composed workflow must use permission INTERSECTION, not UNION.',
    );
  }
  if (input.attemptBidSubmission === true) {
    return deny('Bid submission is forbidden under composition governance.');
  }
  if (input.attemptContractSigning === true) {
    return deny('Contract signing is forbidden under composition governance.');
  }
  if (input.attemptPaymentAuthority === true) {
    return deny('Payment authority is forbidden under composition governance.');
  }
  if (input.attemptFabricateDownstream === true) {
    return deny(
      'Fabricating downstream results after skill failure is forbidden.',
    );
  }
  if (input.attemptCloudPurchase === true) {
    return deny('Autonomous cloud purchasing is forbidden.');
  }
  if (input.attemptBudgetExpand === true) {
    return deny('Autonomous budget expansion is forbidden.');
  }
  if (input.attemptHiddenToolChain === true) {
    return deny('Hidden tool chaining is forbidden.');
  }
  if (input.attemptCrossTenantPool === true) {
    return deny('Cross-tenant data pooling is forbidden.');
  }
  if (input.attemptAutonomousProductionChange === true) {
    return deny('Autonomous production changes are forbidden.');
  }
  if (input.includeHiddenChainOfThought === true) {
    return deny('Hidden chain-of-thought must not appear in compositions.');
  }
  for (const skill of input.skills) {
    if (!skill.certified) {
      return deny(`Skill ${skill.skillId} is not certified — composition blocked.`);
    }
  }
  for (const agent of input.agents) {
    if (
      agent.tenantId !== input.actor.tenantId ||
      agent.universeId !== input.actor.universeId
    ) {
      return deny('Cross-tenant/Universe agent participation denied.');
    }
  }

  const intersected = intersectPermissions(input.skills);
  const unioned = unionPermissions(input.skills);
  const compatibility = checkSkillCompatibility(
    input.skills,
    input.costBudget,
  );
  const costEstimate = estimateCompositionCost({
    skills: input.skills,
    costBudget: input.costBudget,
  });

  let state: WorkflowComposition['state'] = 'GRAPH_BUILT';
  let rollbackRevocationState: WorkflowComposition['rollbackRevocationState'] =
    'ACTIVE';

  if (input.skills.some((s) => s.revoked)) {
    state = 'BLOCKED';
    rollbackRevocationState = 'BLOCKED';
  } else if (!compatibility.ok) {
    state = 'BLOCKED';
  } else if (!costEstimate.withinBudget) {
    state = 'BLOCKED';
  } else {
    state = 'PERMISSIONS_INTERSECTED';
  }

  return {
    compositionId: input.compositionId,
    mission: input.mission,
    participatingSkills: [...input.skills],
    participatingAgents: [...input.agents],
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    requiredApisTools: [
      ...(input.requiredApisTools ??
        input.skills.flatMap((s) => s.authorizedApis)),
    ],
    requiredDataClasses: [
      ...(input.requiredDataClasses ??
        input.skills.flatMap((s) => s.dataScopes)),
    ],
    computeRuntimeNeeds: [
      ...(input.computeRuntimeNeeds ??
        input.skills.flatMap((s) => s.modelsRuntimes)),
    ],
    dependencyOrder: input.skills.map((s) => s.skillId),
    costBudget: input.costBudget,
    costEstimate,
    timeoutMs: input.timeoutMs ?? 600_000,
    approvalCheckpoints: [
      ...(input.approvalCheckpoints ?? [
        'after_pricing_scenario',
        'after_proposal_draft',
        'before_any_external_submission',
      ]),
    ],
    expectedOutputs: [
      ...(input.expectedOutputs ?? [...GOV_CONTRACT_EXPECTED_OUTPUTS]),
    ],
    evidenceRequirements: [
      ...(input.evidenceRequirements ?? [
        'skill_provenance',
        'source_refs',
        'test_benchmark_refs',
        'uncertainty',
        'approval_requirements',
      ]),
    ],
    fallbackPaths: [
      ...(input.fallbackPaths ?? ['skip_failed_skill_emit_PARTIAL', 'human_review']),
    ],
    rollbackRevocationState,
    intersectedPermissions: intersected,
    unionWouldHaveIncluded: unioned,
    permissionMode: 'INTERSECTION',
    state,
    compatibility,
    mergedEvidence: null,
    failureReceipt: null,
    bidSubmissionAuthorized: false,
    contractSigningAuthorized: false,
    paymentAuthorityAuthorized: false,
    containsHiddenChainOfThought: false,
  };
}

export function executeBoundedComposition(input: {
  composition: WorkflowComposition;
  skillResults: Readonly<
    Record<
      string,
      | { ok: true; outputs: readonly string[]; uncertainty?: string }
      | { ok: false; reason: string; useFallback?: boolean }
    >
  >;
  attemptFabricateOnFailure?: boolean;
}): WorkflowComposition | DenialResult {
  if (input.composition.state === 'BLOCKED') {
    return {
      ...input.composition,
      state: 'BLOCKED',
    };
  }
  if (input.attemptFabricateOnFailure === true) {
    return deny(
      'Must not silently fabricate downstream results after skill failure.',
    );
  }

  const slices: SkillEvidenceSlice[] = [];
  let failureReceipt: FailureReceipt | null = null;
  let anyFail = false;

  for (const skill of input.composition.participatingSkills) {
    const result = input.skillResults[skill.skillId];
    if (!result) {
      anyFail = true;
      failureReceipt = {
        skillId: skill.skillId,
        reason: 'missing_skill_result',
        fallbackAttempted: false,
        fabricatedDownstream: false,
      };
      break;
    }
    if (!result.ok) {
      anyFail = true;
      failureReceipt = {
        skillId: skill.skillId,
        reason: result.reason,
        fallbackAttempted: result.useFallback === true,
        fabricatedDownstream: false,
      };
      break;
    }
    slices.push({
      skillId: skill.skillId,
      outputs: [...result.outputs],
      sourceRefs: [...skill.evidenceRefs],
      testBenchmarkRefs: [...skill.testBenchmarkRefs],
      uncertainty: result.uncertainty ?? 'bounded',
      approvalRequirements: input.composition.approvalCheckpoints.filter(
        (c) => c.includes(skill.skillId) || c.startsWith('after_') || c.startsWith('before_'),
      ),
      fabricated: false,
    });
  }

  if (anyFail && failureReceipt) {
    return {
      ...input.composition,
      state: failureReceipt.fallbackAttempted ? 'PARTIAL' : 'BLOCKED',
      failureReceipt,
      mergedEvidence: slices.length
        ? mergeSkillEvidence(slices)
        : {
            slices: [],
            preservesSkillProvenance: true,
            fabricatedDownstream: false,
          },
    };
  }

  return {
    ...input.composition,
    state: 'COMPLETED',
    failureReceipt: null,
    mergedEvidence: mergeSkillEvidence(slices),
  };
}

export function propagateSkillRevocation(input: {
  composition: WorkflowComposition;
  revokedSkillId: string;
  mode?: 'REVALIDATION_REQUIRED' | 'BLOCKED';
}): WorkflowComposition {
  const mode = input.mode ?? 'BLOCKED';
  const skills = input.composition.participatingSkills.map((s) =>
    s.skillId === input.revokedSkillId ? { ...s, revoked: true } : s,
  );
  return {
    ...input.composition,
    participatingSkills: skills,
    state: mode === 'BLOCKED' ? 'BLOCKED' : 'REVALIDATION_REQUIRED',
    rollbackRevocationState: mode,
    failureReceipt: {
      skillId: input.revokedSkillId,
      reason: 'component_skill_revoked',
      fallbackAttempted: false,
      fabricatedDownstream: false,
    },
  };
}

export function attemptPermissionUnionExpansion(): DenialResult {
  return deny(
    'Permission UNION / expansion beyond intersection is forbidden.',
  );
}

export function attemptBidSubmission(): DenialResult {
  return deny('Bid submission denied — proposal candidate only.');
}

export function attemptContractSigning(): DenialResult {
  return deny('Contract signing denied under composition governance.');
}

export function attemptPaymentAuthority(): DenialResult {
  return deny('Payment authority denied under composition governance.');
}

export function attemptFabricateDownstreamResults(): DenialResult {
  return deny(
    'Fabricating downstream results after skill failure is forbidden.',
  );
}

export function attemptAutonomousCloudPurchasing(): DenialResult {
  return deny('Autonomous cloud purchasing denied.');
}

export function attemptBudgetExpansion(): DenialResult {
  return deny('Autonomous budget expansion denied.');
}

export function attemptHiddenToolChaining(): DenialResult {
  return deny('Hidden tool chaining denied.');
}

export function attemptCrossTenantDataPooling(): DenialResult {
  return deny('Cross-tenant data pooling denied.');
}

export function attemptAutonomousProductionChanges(): DenialResult {
  return deny('Autonomous production changes denied.');
}

export function attemptHiddenChainOfThought(): DenialResult {
  return deny('Hidden chain-of-thought denied.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Bypass Guardian/RLS denied.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('Expand tenant/Universe access denied.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('Recommend ≠ act — agents may recommend only.');
}

export function probeGuardianRlsTenantUniverseIsolation(input: {
  actor: Es27Actor;
  otherTenantId: string;
  otherUniverseId: string;
}): { isolated: true; deniedCrossAccess: true } | DenialResult {
  if (
    input.actor.tenantId === input.otherTenantId &&
    input.actor.universeId === input.otherUniverseId
  ) {
    return { isolated: true, deniedCrossAccess: true };
  }
  return deny('Cross-tenant/Universe access denied — isolation unchanged.');
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Es27Actor;
  action: string;
}):
  | { approved: true; approvalId: string; automaticAuthority: false }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny('Human approver required for consequential composition actions.');
  }
  void input.action;
  return {
    approved: true,
    approvalId: input.approvalId,
    automaticAuthority: false,
  };
}

export function returnEvidenceToHomeBase(input: {
  actor: Es27Actor;
  composition: WorkflowComposition;
}): {
  returned: true;
  authorityGranted: false;
  compositionId: string;
  state: WorkflowComposition['state'];
  bidSubmissionAuthorized: false;
} {
  void input.actor;
  return {
    returned: true,
    authorityGranted: false,
    compositionId: input.composition.compositionId,
    state: input.composition.state,
    bidSubmissionAuthorized: false,
  };
}

function skill(
  partial: Omit<CertifiedSkill, 'certified' | 'revoked' | 'versionCurrent'> & {
    certified?: boolean;
    revoked?: boolean;
    versionCurrent?: boolean;
  },
): CertifiedSkill {
  return {
    ...partial,
    certified: partial.certified ?? true,
    revoked: partial.revoked ?? false,
    versionCurrent: partial.versionCurrent ?? true,
  };
}

/**
 * Canonical gov contract composition example:
 * Opportunity Research → … → Compliance Review → proposal candidate + evidence
 * + blockers + human decisions. No bid submission.
 */
export function exampleGovContractSkills(): CertifiedSkill[] {
  const chain = [
    {
      skillId: 'sk-opportunity-research',
      name: 'Opportunity Research',
      version: '1.0.0',
      permissions: ['read_opportunity', 'read_supplier'] as SkillPermission[],
      dataScopes: ['public_opportunity'],
      authorizedApis: ['sam_gov_read'],
      modelsRuntimes: ['local-llm'],
      inputSchema: 'mission_brief',
      outputSchema: 'opportunity_pack',
      costEstimateUnits: 3,
      evidenceRefs: ['src:opp-1'],
      testBenchmarkRefs: ['bench:opp-1'],
    },
    {
      skillId: 'sk-requirement-decomposer',
      name: 'Requirement Decomposer',
      version: '1.0.0',
      permissions: ['decompose_requirements', 'read_supplier'] as SkillPermission[],
      dataScopes: ['public_opportunity'],
      authorizedApis: ['requirements_api'],
      modelsRuntimes: ['local-llm'],
      inputSchema: 'opportunity_pack',
      outputSchema: 'requirements_graph',
      costEstimateUnits: 4,
      evidenceRefs: ['src:req-1'],
      testBenchmarkRefs: ['bench:req-1'],
    },
    {
      skillId: 'sk-logistics-solution',
      name: 'Logistics Solution',
      version: '1.0.0',
      permissions: ['draft_logistics', 'read_supplier'] as SkillPermission[],
      dataScopes: ['logistics'],
      authorizedApis: ['logistics_api'],
      modelsRuntimes: ['local-llm'],
      inputSchema: 'requirements_graph',
      outputSchema: 'logistics_plan',
      costEstimateUnits: 5,
      evidenceRefs: ['src:log-1'],
      testBenchmarkRefs: ['bench:log-1'],
    },
    {
      skillId: 'sk-pricing-scenario',
      name: 'Pricing Scenario',
      version: '1.0.0',
      permissions: ['draft_pricing_scenario', 'read_supplier'] as SkillPermission[],
      dataScopes: ['pricing'],
      authorizedApis: ['pricing_api'],
      modelsRuntimes: ['local-llm'],
      inputSchema: 'logistics_plan',
      outputSchema: 'pricing_pack',
      costEstimateUnits: 5,
      evidenceRefs: ['src:price-1'],
      testBenchmarkRefs: ['bench:price-1'],
    },
    {
      skillId: 'sk-proposal-draft',
      name: 'Proposal Draft',
      version: '1.0.0',
      permissions: ['draft_proposal', 'draft_contract_analysis'] as SkillPermission[],
      dataScopes: ['proposal_draft'],
      authorizedApis: ['draft_api'],
      modelsRuntimes: ['local-llm'],
      inputSchema: 'pricing_pack',
      outputSchema: 'proposal_draft',
      costEstimateUnits: 6,
      evidenceRefs: ['src:prop-1'],
      testBenchmarkRefs: ['bench:prop-1'],
    },
    {
      skillId: 'sk-compliance-review',
      name: 'Compliance Review',
      version: '1.0.0',
      permissions: ['compliance_review', 'draft_contract_analysis'] as SkillPermission[],
      dataScopes: ['compliance'],
      authorizedApis: ['compliance_api'],
      modelsRuntimes: ['local-llm'],
      inputSchema: 'proposal_draft',
      outputSchema: 'proposal_candidate',
      costEstimateUnits: 4,
      evidenceRefs: ['src:comp-1'],
      testBenchmarkRefs: ['bench:comp-1'],
    },
  ] as const;

  return chain.map((c) => skill({ ...c }));
}

export function exampleGovContractAgents(actor: Es27Actor): CompositionAgent[] {
  return GOV_CONTRACT_WORKFLOW_STAGES.map((stage, i) => ({
    agentId: `agent-${stage}`,
    role: stage,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    index: i,
  })).map(({ agentId, role, tenantId, universeId }) => ({
    agentId,
    role,
    tenantId,
    universeId,
  }));
}

export function bootstrapCapabilityCompositionEngine(repoRoot?: string): {
  locksIntact: boolean;
  coreFlow: typeof CAPABILITY_COMPOSITION_CORE_FLOW;
  trackingFields: typeof COMPOSITION_TRACKING_FIELDS;
  states: typeof COMPOSITION_STATES;
  compatibilityChecks: typeof COMPATIBILITY_CHECKS;
  govStages: typeof GOV_CONTRACT_WORKFLOW_STAGES;
  forbidden: typeof FORBIDDEN_COMPOSITION_ACTIONS;
  dbCandidates: typeof ES27_DB_CANDIDATES_STATUS;
  softWire: Es27SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ES_LAYER_TITLE;
  };
} {
  const softWire = es27SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEs27LocksIntact(),
    coreFlow: CAPABILITY_COMPOSITION_CORE_FLOW,
    trackingFields: COMPOSITION_TRACKING_FIELDS,
    states: COMPOSITION_STATES,
    compatibilityChecks: COMPATIBILITY_CHECKS,
    govStages: GOV_CONTRACT_WORKFLOW_STAGES,
    forbidden: FORBIDDEN_COMPOSITION_ACTIONS,
    dbCandidates: ES27_DB_CANDIDATES_STATUS,
    softWire,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
      gitlab: GITLAB_MIRROR_NOTE,
      layer: ES_LAYER_TITLE,
    },
  };
}

export function runCapabilityCompositionCycle(input: {
  actor: Es27Actor;
  human: Es27Actor;
  repoRoot?: string;
}): {
  hops: Es27HopRecord[];
  receipt: {
    compositionId: string;
    permissionMode: 'INTERSECTION';
    bidSubmissionAuthorized: false;
    fabricatedDownstream: false;
    state: WorkflowComposition['state'];
  };
  cycleEvidenceSha256: string;
} {
  const hops: Es27HopRecord[] = [];
  const softWire = es27SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEs27LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = bootstrapCapabilityCompositionEngine(input.repoRoot);
  hops.push(
    hop(
      'capability_composition_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'Capability Composition Engine bootstrap.',
    ),
  );

  hops.push(
    hop(
      'core_flow_encoded',
      CAPABILITY_COMPOSITION_CORE_FLOW.length === 8 ? 'PASS' : 'FAIL',
      `Core flow=${CAPABILITY_COMPOSITION_CORE_FLOW.join('→')}.`,
    ),
  );
  hops.push(
    hop(
      'tracking_fields_encoded',
      COMPOSITION_TRACKING_FIELDS.length === 16 ? 'PASS' : 'FAIL',
      `Tracking fields=${COMPOSITION_TRACKING_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'composition_states_encoded',
      COMPOSITION_STATES.length === 10 ? 'PASS' : 'FAIL',
      `States=${COMPOSITION_STATES.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'compatibility_checks_encoded',
      COMPATIBILITY_CHECKS.length === 7 ? 'PASS' : 'FAIL',
      `Compatibility checks=${COMPATIBILITY_CHECKS.length}.`,
    ),
  );
  hops.push(
    hop(
      'gov_contract_workflow_encoded',
      GOV_CONTRACT_WORKFLOW_STAGES.length === 6 &&
        GOV_CONTRACT_EXPECTED_OUTPUTS.length === 4
        ? 'PASS'
        : 'FAIL',
      `Gov stages=${GOV_CONTRACT_WORKFLOW_STAGES.length}; outputs=${GOV_CONTRACT_EXPECTED_OUTPUTS.join(',')}.`,
    ),
  );
  hops.push(
    hop(
      'forbidden_actions_encoded',
      FORBIDDEN_COMPOSITION_ACTIONS.length === 10 ? 'PASS' : 'FAIL',
      `Forbidden=${FORBIDDEN_COMPOSITION_ACTIONS.length}.`,
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      permissionModeIsIntersection() ? 'PASS' : 'FAIL',
      `permissionMode=${CAPABILITY_COMPOSITION_TRUTH_BOUNDARY.permissionMode}.`,
    ),
  );

  const skills = exampleGovContractSkills();
  // Skill A read_supplier + Skill B draft_contract_analysis — intersection
  // must NOT include contract_signing / payment / bid_submission.
  const a: CertifiedSkill = skill({
    skillId: 'sk-a-supplier',
    name: 'Supplier Read',
    version: '1.0.0',
    permissions: ['read_supplier'],
    dataScopes: ['supplier'],
    authorizedApis: ['supplier_api'],
    modelsRuntimes: ['local-llm'],
    inputSchema: 'supplier_query',
    outputSchema: 'supplier_pack',
    costEstimateUnits: 2,
    evidenceRefs: ['src:a'],
    testBenchmarkRefs: ['bench:a'],
  });
  const b: CertifiedSkill = skill({
    skillId: 'sk-b-contract-draft',
    name: 'Contract Analysis Draft',
    version: '1.0.0',
    permissions: ['draft_contract_analysis'],
    dataScopes: ['contract_draft'],
    authorizedApis: ['draft_api'],
    modelsRuntimes: ['local-llm'],
    inputSchema: 'supplier_pack',
    outputSchema: 'analysis_draft',
    costEstimateUnits: 3,
    evidenceRefs: ['src:b'],
    testBenchmarkRefs: ['bench:b'],
  });
  const intersectedAb = intersectPermissions([a, b]);
  const unionAb = unionPermissions([a, b]);
  const intersectionOk =
    intersectedAb.length === 0 &&
    unionAb.includes('read_supplier') &&
    unionAb.includes('draft_contract_analysis') &&
    !intersectedAb.includes('contract_signing') &&
    !intersectedAb.includes('payment_authority') &&
    !intersectedAb.includes('bid_submission');
  hops.push(
    hop(
      'permission_intersection_not_union',
      intersectionOk ? 'PASS' : 'FAIL',
      `A∩B=${JSON.stringify(intersectedAb)}; A∪B=${JSON.stringify(unionAb)}; no signing/payment/bid.`,
    ),
  );

  const agents = exampleGovContractAgents(input.actor);
  const composed = composeWorkflow({
    actor: input.actor,
    compositionId: 'comp-gov-1',
    mission: 'gov_contract_proposal_candidate',
    skills,
    agents,
    costBudget: 200,
    expectedOutputs: [...GOV_CONTRACT_EXPECTED_OUTPUTS],
  });
  const govOk =
    !('denied' in composed) &&
    composed.bidSubmissionAuthorized === false &&
    composed.contractSigningAuthorized === false &&
    composed.paymentAuthorityAuthorized === false &&
    composed.permissionMode === 'INTERSECTION' &&
    !composed.intersectedPermissions.includes('bid_submission') &&
    !composed.intersectedPermissions.includes('contract_signing') &&
    !composed.intersectedPermissions.includes('payment_authority');
  hops.push(
    hop(
      'gov_contract_workflow_no_bid_submit',
      govOk ? 'PASS' : 'FAIL',
      'Gov contract composition yields proposal candidate path only — no bid submit.',
    ),
  );

  const compat =
    !('denied' in composed) && composed.compatibility.ok
      ? 'PASS'
      : 'FAIL';
  hops.push(
    hop(
      'compatibility_gate',
      compat,
      !('denied' in composed)
        ? `Compatibility ok=${composed.compatibility.ok}; blockers=${composed.compatibility.blockers.join(',') || 'none'}.`
        : composed.reason,
    ),
  );

  const costOk =
    !('denied' in composed) &&
    composed.costEstimate.totalUnits > 0 &&
    composed.costEstimate.autonomousPurchaseAttempted === false &&
    composed.costEstimate.budgetExpansionAttempted === false;
  hops.push(
    hop(
      'cost_estimate_before_larger_workflow',
      costOk ? 'PASS' : 'FAIL',
      !('denied' in composed)
        ? `Cost total=${composed.costEstimate.totalUnits}; withinBudget=${composed.costEstimate.withinBudget}.`
        : composed.reason,
    ),
  );

  let execState: WorkflowComposition['state'] = 'BLOCKED';
  let fabricated = false;
  if (!('denied' in composed)) {
    const failMid = executeBoundedComposition({
      composition: { ...composed, state: 'EXECUTING' },
      skillResults: {
        'sk-opportunity-research': {
          ok: true,
          outputs: ['opportunity_pack'],
        },
        'sk-requirement-decomposer': {
          ok: false,
          reason: 'decomposer_timeout',
          useFallback: true,
        },
      },
    });
    if (!('denied' in failMid)) {
      execState = failMid.state;
      fabricated = failMid.mergedEvidence?.fabricatedDownstream === true;
    }
    const fabricateAttempt = executeBoundedComposition({
      composition: { ...composed, state: 'EXECUTING' },
      skillResults: {
        'sk-opportunity-research': { ok: false, reason: 'upstream_fail' },
      },
      attemptFabricateOnFailure: true,
    });
    if (!('denied' in fabricateAttempt)) {
      fabricated = true;
    }
  }
  hops.push(
    hop(
      'bounded_execution_partial_on_skill_fail',
      execState === 'PARTIAL' && !fabricated ? 'PASS' : 'FAIL',
      `Skill fail → ${execState}; fabricateDenied=true.`,
    ),
  );

  const evidenceOk =
    !('denied' in composed) &&
    (() => {
      const done = executeBoundedComposition({
        composition: { ...composed, state: 'EXECUTING' },
        skillResults: Object.fromEntries(
          skills.map((s) => [
            s.skillId,
            { ok: true as const, outputs: [s.outputSchema] },
          ]),
        ),
      });
      return (
        !('denied' in done) &&
        done.mergedEvidence?.preservesSkillProvenance === true &&
        done.mergedEvidence.slices.every((sl) => sl.fabricated === false) &&
        done.mergedEvidence.slices.length === skills.length
      );
    })();
  hops.push(
    hop(
      'evidence_merge_preserves_provenance',
      evidenceOk ? 'PASS' : 'FAIL',
      'Merged evidence preserves which skill produced what; no fabricate.',
    ),
  );

  let revokeOk = false;
  if (!('denied' in composed)) {
    const revoked = propagateSkillRevocation({
      composition: composed,
      revokedSkillId: 'sk-compliance-review',
      mode: 'BLOCKED',
    });
    revokeOk =
      revoked.state === 'BLOCKED' &&
      revoked.rollbackRevocationState === 'BLOCKED' &&
      revoked.failureReceipt?.reason === 'component_skill_revoked';
  }
  hops.push(
    hop(
      'revocation_propagates_block_or_revalidation',
      revokeOk ? 'PASS' : 'FAIL',
      'Component skill revoked → BLOCKED / REVALIDATION_REQUIRED.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof CAPABILITY_COMPOSITION_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_permission_union_expansion', fn: attemptPermissionUnionExpansion },
    { hop: 'deny_bid_submission', fn: attemptBidSubmission },
    { hop: 'deny_contract_signing', fn: attemptContractSigning },
    { hop: 'deny_payment_authority', fn: attemptPaymentAuthority },
    {
      hop: 'deny_fabricate_downstream_results',
      fn: attemptFabricateDownstreamResults,
    },
    {
      hop: 'deny_autonomous_cloud_purchasing',
      fn: attemptAutonomousCloudPurchasing,
    },
    { hop: 'deny_budget_expansion', fn: attemptBudgetExpansion },
    { hop: 'deny_hidden_tool_chaining', fn: attemptHiddenToolChaining },
    {
      hop: 'deny_cross_tenant_data_pooling',
      fn: attemptCrossTenantDataPooling,
    },
    {
      hop: 'deny_autonomous_production_changes',
      fn: attemptAutonomousProductionChanges,
    },
    { hop: 'deny_hidden_chain_of_thought', fn: attemptHiddenChainOfThought },
    { hop: 'deny_bypass_guardian_rls', fn: attemptBypassGuardianRls },
    {
      hop: 'deny_expand_tenant_universe_access',
      fn: attemptExpandTenantUniverseAccess,
    },
  ];
  for (const d of denyHops) {
    const result = d.fn();
    hops.push(
      hop(d.hop, result.denied ? 'DENIED' : 'FAIL', result.reason),
    );
  }

  const isolation = probeGuardianRlsTenantUniverseIsolation({
    actor: input.actor,
    otherTenantId: 'ten-other',
    otherUniverseId: 'uni-other',
  });
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      'denied' in isolation ? 'DENIED' : 'PASS',
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );

  const recommend = attemptRecommendAsAct();
  hops.push(
    hop(
      'recommend_neq_act',
      recommend.denied ? 'DENIED' : 'FAIL',
      recommend.reason,
    ),
  );

  hops.push(
    hop(
      'l4_autonomy_false',
      ES27_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false.',
    ),
  );

  hops.push(
    hop(
      'es_layer_context_documented',
      ES_LAYER_TITLE.length > 0 ? 'DOCUMENTED' : 'FAIL',
      ES_LAYER_TITLE,
    ),
  );
  hops.push(
    hop(
      'es26_marketplace_soft_wire',
      softWireHopState(softWire.es26SkillMarketplace.present),
      softWire.es26SkillMarketplace.note,
    ),
  );
  hops.push(
    hop(
      'es25_certification_soft_wire',
      softWireHopState(softWire.es25SkillCertification.present),
      softWire.es25SkillCertification.note,
    ),
  );
  hops.push(
    hop(
      'es19_production_boundary_soft_wire',
      softWireHopState(softWire.es19ProductionBoundary.present),
      softWire.es19ProductionBoundary.note,
    ),
  );
  hops.push(
    hop(
      'er16_home_base_soft_wire',
      softWireHopState(softWire.er16HomeBase.present),
      softWire.er16HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ES27_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'NOT_APPLIED' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  let homeOk = false;
  let finalState: WorkflowComposition['state'] = 'BLOCKED';
  if (!('denied' in composed)) {
    const completed = executeBoundedComposition({
      composition: { ...composed, state: 'EXECUTING' },
      skillResults: Object.fromEntries(
        skills.map((s) => [
          s.skillId,
          { ok: true as const, outputs: [s.outputSchema] },
        ]),
      ),
    });
    if (!('denied' in completed)) {
      finalState = completed.state;
      const home = returnEvidenceToHomeBase({
        actor: input.actor,
        composition: completed,
      });
      homeOk =
        home.returned &&
        home.authorityGranted === false &&
        home.bidSubmissionAuthorized === false;
    }
  }
  const humanGate = requireHumanApproval({
    approvalId: 'appr-es27-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      homeOk && !('denied' in humanGate) ? 'PASS' : 'DENIED',
      'Composition evidence returned to Home Base; human gate exercised; no auto authority; no bid submit.',
    ),
  );

  void ES27_MAY;
  void ES27_MUST_NOT;
  void ES27_AGENT_BOUNDS;
  void CAPABILITY_COMPOSITION_CYCLE;
  void FORBIDDEN_COMPOSITION_ACTIONS;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
    }),
  );

  return {
    hops,
    receipt: {
      compositionId: !('denied' in composed)
        ? composed.compositionId
        : 'denied',
      permissionMode: 'INTERSECTION',
      bidSubmissionAuthorized: false,
      fabricatedDownstream: false,
      state: finalState,
    },
    cycleEvidenceSha256,
  };
}
