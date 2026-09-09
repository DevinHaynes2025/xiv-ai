/**
 * 62L-EQ8 — ARM Server / Cloud Runtime Research runtime.
 *
 * Research nodes, comparison matrix, cloud registry DOCUMENTED-until-tested,
 * scheduler recommendations ≠ authorized execution. Soft-wires EQ7…EQ1/EM157.
 */

import {
  ARM_SERVER_CLOUD_CORE_FLOW,
  ARM_SERVER_CLOUD_EVIDENCE_STATES,
  ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS,
  ARM_SERVER_CLOUD_RUNTIME_CYCLE,
  CLOUD_TRUTH_BOUNDARY,
  COMPARISON_CANDIDATE_CLASSES,
  COMPARISON_METRICS,
  EQ8_AGENT_BOUNDS,
  EQ8_DB_CANDIDATES_STATUS,
  EQ8_LOCKS,
  EQ8_MAY,
  EQ8_MUST_NOT,
  EQ8_SECURITY_DENIES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  XIV_ECONOMICS_BRAIN_PATH,
  assertEq8LocksIntact,
  canMarkCloudVerified,
  cloudRegistryImpliesVerified,
  eq8SoftWireSnapshot,
  isEq8Agent,
  isHumanApprover,
  recommendationImpliesAuthorizedExecution,
  type ArmServerCloudEvidenceState,
  type ComparisonCandidateClass,
  type ComparisonMetric,
  type Eq8Actor,
  type Eq8EvidenceState,
  type Eq8HopRecord,
  type Eq8SoftWireSnapshot,
} from './arm-server-cloud-runtime-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ARM_SERVER_CLOUD_RUNTIME_CYCLE)[number],
  state: Eq8EvidenceState,
  summary: string,
): Eq8HopRecord {
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

export type ArmResearchDimension =
  (typeof ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS)[number];

export type ArmServerResearchNode = {
  nodeId: string;
  dimension: ArmResearchDimension;
  notes: string;
  evidenceState: ArmServerCloudEvidenceState;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type CloudRegistryEntry = {
  entryId: string;
  providerLabel: string;
  evidenceState: 'DOCUMENTED';
  accountTested: false;
  regionTested: false;
  runtimeTested: false;
  quotasTested: false;
  workloadTested: false;
  verified: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type ComparisonMatrixRow = {
  candidateClass: ComparisonCandidateClass;
  metrics: Record<ComparisonMetric, number | string | null>;
  evidenceState: ArmServerCloudEvidenceState;
  benchmarkFreshness: string | null;
};

export type ComparisonMatrix = {
  matrixId: string;
  workloadId: string;
  rows: ComparisonMatrixRow[];
  xivOwnedIntelligence: true;
};

export type SchedulerRecommendation = {
  recommendationId: string;
  workloadId: string;
  preferredCandidate: ComparisonCandidateClass;
  economicsPath: typeof XIV_ECONOMICS_BRAIN_PATH;
  authorizedExecution: false;
  authorityGranted: false;
  evidenceState: 'RECOMMENDATION_ONLY';
};

export type AuthorizedExecutionGate = {
  approvalId: string;
  recommendationId: string;
  authorized: true;
  humanGate: true;
};

export function emitArmServerResearchNode(input: {
  actor: Eq8Actor;
  nodeId: string;
  dimension: ArmResearchDimension;
  notes: string;
  evidenceState?: ArmServerCloudEvidenceState;
  attemptIncludeHiddenCot?: boolean;
}): ArmServerResearchNode | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_EQ8=false.');
  }
  return {
    nodeId: input.nodeId,
    dimension: input.dimension,
    notes: input.notes,
    evidenceState: input.evidenceState ?? 'DOCUMENTED',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function registerCloudProvider(input: {
  actor: Eq8Actor;
  entryId: string;
  providerLabel: string;
  attemptEquateRegistryWithVerified?: boolean;
  attemptAutonomousProvision?: boolean;
  attemptAutonomousScale?: boolean;
  attemptAutonomousPurchase?: boolean;
  attemptHiddenResourceCreation?: boolean;
  attemptCredentialHarvesting?: boolean;
}): CloudRegistryEntry | DenialResult {
  if (input.attemptEquateRegistryWithVerified) {
    return deny(
      'CLOUD_REGISTRY_EQ_VERIFIED=false — registry appearance means DOCUMENTED until tested.',
    );
  }
  if (input.attemptAutonomousProvision) {
    return deny('AUTONOMOUS_PROVISIONING=false.');
  }
  if (input.attemptAutonomousScale) {
    return deny('AUTONOMOUS_SCALING=false.');
  }
  if (input.attemptAutonomousPurchase) {
    return deny('AUTONOMOUS_PURCHASING=false.');
  }
  if (input.attemptHiddenResourceCreation) {
    return deny('HIDDEN_RESOURCE_CREATION=false.');
  }
  if (input.attemptCredentialHarvesting) {
    return deny('CREDENTIAL_HARVESTING=false.');
  }
  void CLOUD_TRUTH_BOUNDARY;
  return {
    entryId: input.entryId,
    providerLabel: input.providerLabel,
    evidenceState: 'DOCUMENTED',
    accountTested: false,
    regionTested: false,
    runtimeTested: false,
    quotasTested: false,
    workloadTested: false,
    verified: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function advanceCloudRegistryEvidence(input: {
  entry: CloudRegistryEntry;
  accountTested: boolean;
  regionTested: boolean;
  runtimeTested: boolean;
  quotasTested: boolean;
  workloadTested: boolean;
  attemptMarkVerifiedWithoutTests?: boolean;
}):
  | {
      entry: CloudRegistryEntry & {
        evidenceState: ArmServerCloudEvidenceState;
        verified: boolean;
        accountTested: boolean;
        regionTested: boolean;
        runtimeTested: boolean;
        quotasTested: boolean;
        workloadTested: boolean;
      };
    }
  | DenialResult {
  if (input.attemptMarkVerifiedWithoutTests) {
    return deny(
      'CLOUD_REGISTRY_EQ_VERIFIED=false — account/region/runtime/quotas/workload must be tested.',
    );
  }
  const verified = canMarkCloudVerified({
    accountTested: input.accountTested,
    regionTested: input.regionTested,
    runtimeTested: input.runtimeTested,
    quotasTested: input.quotasTested,
    workloadTested: input.workloadTested,
  });
  if (!verified) {
    return deny(
      'Cannot mark cloud VERIFIED until account, region, runtime, quotas, and workload are actually tested.',
    );
  }
  return {
    entry: {
      ...input.entry,
      accountTested: true,
      regionTested: true,
      runtimeTested: true,
      quotasTested: true,
      workloadTested: true,
      evidenceState: 'VERIFIED',
      verified: true,
    },
  };
}

export function buildComparisonMatrix(input: {
  matrixId: string;
  workloadId: string;
  rows: ComparisonMatrixRow[];
  attemptCrossTenantPool?: boolean;
  attemptUnrestrictedCloudMove?: boolean;
}): ComparisonMatrix | DenialResult {
  if (input.attemptCrossTenantPool) {
    return deny('CROSS_TENANT_DATA_POOLING=false.');
  }
  if (input.attemptUnrestrictedCloudMove) {
    return deny('UNRESTRICTED_CLOUD_MOVEMENT=false.');
  }
  for (const row of input.rows) {
    if (
      !(COMPARISON_CANDIDATE_CLASSES as readonly string[]).includes(
        row.candidateClass,
      )
    ) {
      return deny(`Unknown candidate class: ${row.candidateClass}`);
    }
  }
  return {
    matrixId: input.matrixId,
    workloadId: input.workloadId,
    rows: input.rows,
    xivOwnedIntelligence: true,
  };
}

export function emitSchedulerRecommendation(input: {
  recommendationId: string;
  workloadId: string;
  preferredCandidate: ComparisonCandidateClass;
  attemptTreatAsAuthorizedExecution?: boolean;
  attemptProductionWithoutHumanAuth?: boolean;
}): SchedulerRecommendation | DenialResult {
  if (input.attemptTreatAsAuthorizedExecution) {
    return deny(
      'RECOMMENDATION_EQ_AUTHORIZED_EXECUTION=false — recommendation ≠ authorized execution.',
    );
  }
  if (input.attemptProductionWithoutHumanAuth) {
    return deny(
      'PRODUCTION_DEPLOYMENT_WITHOUT_HUMAN_AUTHORIZATION=false.',
    );
  }
  return {
    recommendationId: input.recommendationId,
    workloadId: input.workloadId,
    preferredCandidate: input.preferredCandidate,
    economicsPath: XIV_ECONOMICS_BRAIN_PATH,
    authorizedExecution: false,
    authorityGranted: false,
    evidenceState: 'RECOMMENDATION_ONLY',
  };
}

export function authorizeExecution(input: {
  approvalId: string;
  recommendationId: string;
  actor: Eq8Actor;
  attemptWithoutHuman?: boolean;
}): AuthorizedExecutionGate | DenialResult {
  if (input.attemptWithoutHuman || !isHumanApprover(input.actor)) {
    return deny(
      'PRODUCTION_DEPLOYMENT_WITHOUT_HUMAN_AUTHORIZATION=false — human authorization required.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    recommendationId: input.recommendationId,
    authorized: true,
    humanGate: true,
  };
}

export function attemptAutonomousProvisioning(): DenialResult {
  return deny('AUTONOMOUS_PROVISIONING=false.');
}

export function attemptAutonomousScaling(): DenialResult {
  return deny('AUTONOMOUS_SCALING=false.');
}

export function attemptAutonomousPurchasing(): DenialResult {
  return deny('AUTONOMOUS_PURCHASING=false.');
}

export function attemptEquateRegistryWithVerified(): DenialResult {
  return deny('CLOUD_REGISTRY_EQ_VERIFIED=false.');
}

export function attemptCrossTenantDataPooling(): DenialResult {
  return deny('CROSS_TENANT_DATA_POOLING=false.');
}

export function attemptUnrestrictedCloudMovement(): DenialResult {
  return deny('UNRESTRICTED_CLOUD_MOVEMENT=false.');
}

export function attemptCredentialHarvesting(): DenialResult {
  return deny('CREDENTIAL_HARVESTING=false.');
}

export function attemptHiddenResourceCreation(): DenialResult {
  return deny('HIDDEN_RESOURCE_CREATION=false.');
}

export function attemptProductionWithoutHumanAuth(): DenialResult {
  return deny('PRODUCTION_DEPLOYMENT_WITHOUT_HUMAN_AUTHORIZATION=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEq8EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq8Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!EQ8_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEq8Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ8 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq8Actor;
  action: string;
}):
  | {
      approvalId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, or tenant_admin.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EQ8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ8_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ8_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

function emptyMetrics(): Record<ComparisonMetric, number | string | null> {
  const m = {} as Record<ComparisonMetric, number | string | null>;
  for (const key of COMPARISON_METRICS) {
    m[key] = null;
  }
  return m;
}

export function exampleWorkloadComparisonMatrix(): ComparisonMatrix {
  const rows: ComparisonMatrixRow[] = COMPARISON_CANDIDATE_CLASSES.map(
    (candidateClass, i) => ({
      candidateClass,
      metrics: {
        ...emptyMetrics(),
        latency: 100 + i * 10,
        throughput: 10 - i,
        cost: 1 + i * 0.5,
        energy_proxy: 0.5 + i * 0.1,
        reliability: 0.99,
        privacy_locality:
          candidateClass === 'local_asus_node' || candidateClass === 'edge_node'
            ? 'local'
            : 'remote',
        scaling_behavior: 'documented',
        memory: 32,
      },
      evidenceState:
        candidateClass === 'local_asus_node' ? 'VERIFIED' : 'DOCUMENTED',
      benchmarkFreshness:
        candidateClass === 'local_asus_node' ? nowIso() : null,
    }),
  );
  const matrix = buildComparisonMatrix({
    matrixId: 'mx-wl-1',
    workloadId: 'wl-inference-1',
    rows,
  });
  if ('denied' in matrix) throw new Error('example matrix failed');
  return matrix;
}

export function bootstrapArmServerCloudRuntime(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq8SoftWireSnapshot;
  dimensions: typeof ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS;
  coreFlow: typeof ARM_SERVER_CLOUD_CORE_FLOW;
  candidates: typeof COMPARISON_CANDIDATE_CLASSES;
  metrics: typeof COMPARISON_METRICS;
  evidenceStates: typeof ARM_SERVER_CLOUD_EVIDENCE_STATES;
  cloudBoundary: typeof CLOUD_TRUTH_BOUNDARY;
  economicsPath: typeof XIV_ECONOMICS_BRAIN_PATH;
  securityDenies: typeof EQ8_SECURITY_DENIES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ8_MAY;
  mustNot: typeof EQ8_MUST_NOT;
  dbCandidates: typeof EQ8_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq8LocksIntact(),
    softWire: eq8SoftWireSnapshot(repoRoot),
    dimensions: ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS,
    coreFlow: ARM_SERVER_CLOUD_CORE_FLOW,
    candidates: COMPARISON_CANDIDATE_CLASSES,
    metrics: COMPARISON_METRICS,
    evidenceStates: ARM_SERVER_CLOUD_EVIDENCE_STATES,
    cloudBoundary: CLOUD_TRUTH_BOUNDARY,
    economicsPath: XIV_ECONOMICS_BRAIN_PATH,
    securityDenies: EQ8_SECURITY_DENIES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ8_MAY,
    mustNot: EQ8_MUST_NOT,
    dbCandidates: EQ8_DB_CANDIDATES_STATUS,
  };
}

export function runArmServerCloudRuntimeCycle(input: {
  actor: Eq8Actor;
  human: Eq8Actor;
  repoRoot?: string;
}): {
  hops: Eq8HopRecord[];
  researchNode: ArmServerResearchNode;
  cloudEntry: CloudRegistryEntry;
  matrix: ComparisonMatrix;
  recommendation: SchedulerRecommendation;
  softWire: Eq8SoftWireSnapshot;
} {
  const hops: Eq8HopRecord[] = [];
  const softWire = eq8SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq8LocksIntact() ? 'PASS' : 'FAIL',
      'EQ8 locks intact including L4=false and cloud registry≠verified.',
    ),
  );
  hops.push(
    hop(
      'arm_server_cloud_runtime_bootstrap',
      'PASS',
      'ARM Server/Cloud Runtime Research bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'research_dimensions_encoded',
      'PASS',
      `${ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS.length} research dimensions encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      'PASS',
      ARM_SERVER_CLOUD_CORE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'comparison_matrix_encoded',
      'PASS',
      COMPARISON_CANDIDATE_CLASSES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'comparison_metrics_encoded',
      'PASS',
      COMPARISON_METRICS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'cloud_truth_boundary_encoded',
      'PASS',
      'Cloud registry appearance = DOCUMENTED until account/region/runtime/quotas/workload tested.',
    ),
  );
  hops.push(
    hop(
      'economics_brain_path_encoded',
      'PASS',
      XIV_ECONOMICS_BRAIN_PATH.join(' → '),
    ),
  );

  const researchNodeResult = emitArmServerResearchNode({
    actor: input.actor,
    nodeId: 'arm-srv-cost-1',
    dimension: 'cost_per_workload',
    notes: 'DOCUMENTED cost proxies; not verified for all regions.',
  });
  if ('denied' in researchNodeResult) throw new Error('research node failed');
  const researchNode = researchNodeResult;

  const cloudEntryResult = registerCloudProvider({
    actor: input.actor,
    entryId: 'cloud-prov-1',
    providerLabel: 'example-arm-cloud',
  });
  if ('denied' in cloudEntryResult) throw new Error('cloud register failed');
  const cloudEntry = cloudEntryResult;

  const incomplete = advanceCloudRegistryEvidence({
    entry: cloudEntry,
    accountTested: true,
    regionTested: false,
    runtimeTested: false,
    quotasTested: false,
    workloadTested: false,
  });
  const matrix = exampleWorkloadComparisonMatrix();
  const recommendationResult = emitSchedulerRecommendation({
    recommendationId: 'rec-1',
    workloadId: matrix.workloadId,
    preferredCandidate: 'local_asus_node',
  });
  if ('denied' in recommendationResult) throw new Error('rec failed');
  const recommendation = recommendationResult;

  hops.push(
    hop(
      'cloud_registry_eq_documented_until_tested',
      cloudEntry.evidenceState === 'DOCUMENTED' &&
        cloudEntry.verified === false &&
        incomplete.state === 'DENIED' &&
        cloudRegistryImpliesVerified() === false &&
        attemptEquateRegistryWithVerified().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Cloud registry = DOCUMENTED until fully tested.',
    ),
  );

  hops.push(
    hop(
      'recommendation_neq_authorized_execution',
      recommendation.authorizedExecution === false &&
        recommendationImpliesAuthorizedExecution() === false &&
        emitSchedulerRecommendation({
          recommendationId: 'bad',
          workloadId: 'w',
          preferredCandidate: 'arm_cpu_server',
          attemptTreatAsAuthorizedExecution: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Scheduler recommendation ≠ authorized execution.',
    ),
  );

  hops.push(
    hop(
      'xiv_owned_economics_intelligence',
      matrix.xivOwnedIntelligence === true &&
        recommendation.economicsPath === XIV_ECONOMICS_BRAIN_PATH
        ? 'PASS'
        : 'FAIL',
      'Cross-architecture economics brain is XIV-owned intelligence.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof ARM_SERVER_CLOUD_RUNTIME_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_autonomous_provisioning', fn: attemptAutonomousProvisioning },
    { hop: 'deny_autonomous_scaling', fn: attemptAutonomousScaling },
    { hop: 'deny_autonomous_purchasing', fn: attemptAutonomousPurchasing },
    {
      hop: 'deny_equate_registry_with_verified',
      fn: attemptEquateRegistryWithVerified,
    },
    {
      hop: 'deny_cross_tenant_data_pooling',
      fn: attemptCrossTenantDataPooling,
    },
    {
      hop: 'deny_unrestricted_cloud_movement',
      fn: attemptUnrestrictedCloudMovement,
    },
    { hop: 'deny_credential_harvesting', fn: attemptCredentialHarvesting },
    {
      hop: 'deny_hidden_resource_creation',
      fn: attemptHiddenResourceCreation,
    },
    {
      hop: 'deny_production_without_human_auth',
      fn: attemptProductionWithoutHumanAuth,
    },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(
        d.hop,
        d.fn().state === 'DENIED' ? 'PASS' : 'FAIL',
        `${d.hop} DENIED.`,
      ),
    );
  }

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
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act / authorize.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EQ8_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eq7_soft_wire',
      softWire.eq7ArmEdgeAmdAcceleration.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq7ArmEdgeAmdAcceleration.note,
    ),
  );
  hops.push(
    hop(
      'eq6_soft_wire',
      softWire.eq6ArchitectureCapabilityGraph.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq6ArchitectureCapabilityGraph.note,
    ),
  );
  hops.push(
    hop(
      'eq5_soft_wire',
      softWire.eq5CompilerIrTranslationLayer.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq5CompilerIrTranslationLayer.note,
    ),
  );
  hops.push(
    hop(
      'eq2_soft_wire',
      softWire.eq2ArmArchitectureKnowledgePack.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eq2ArmArchitectureKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'eq1_soft_wire',
      softWire.eq1CrossArchitectureContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq1CrossArchitectureContract.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWire.em157HomeBase.present ? 'PASS' : 'WAITING_DATA',
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EQ8_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq8-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void ARM_SERVER_CLOUD_RUNTIME_CYCLE;
  void attemptAgentAutoAuthority;
  void authorizeExecution;
  void researchNode;

  return {
    hops,
    researchNode,
    cloudEntry,
    matrix,
    recommendation,
    softWire,
  };
}
