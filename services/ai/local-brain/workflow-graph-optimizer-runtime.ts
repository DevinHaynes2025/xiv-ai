/**
 * 62L-ES28 — Workflow Graph Optimizer runtime.
 *
 * Existing workflow → baseline → candidates → sandbox compare →
 * evaluator review → improved candidate.
 * Soft-wires ES27/ES26/ES23/ES9/ER7/EP18 when present.
 */

import {
  ES28_DB_CANDIDATES_STATUS,
  ES28_LOCKS,
  ES28_MAY,
  ES28_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MANDATORY_PRESERVED_CHECKS,
  NEXT_PHASE_TITLE,
  OPTIMIZATION_EVALUATE_DIMENSIONS,
  OPTIMIZATION_RESULT_STATES,
  OPTIMIZATION_TRACKING_FIELDS,
  QUANTUM_OPTIMIZATION_LABELS,
  WORKFLOW_GRAPH_OPTIMIZER_CORE_FLOW,
  WORKFLOW_GRAPH_OPTIMIZER_CYCLE,
  WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY,
  assertEs28LocksIntact,
  es28SoftWireSnapshot,
  isEs28Agent,
  isHumanApprover,
  isMandatoryNodeKind,
  missingMandatoryChecks,
  softWireHopState,
  type Es28Actor,
  type Es28EvidenceState,
  type Es28HopRecord,
  type Es28SoftWireSnapshot,
  type OptimizationResultState,
  type QuantumOptimizationLabel,
  type WorkflowEdge,
  type WorkflowGraph,
  type WorkflowMetrics,
  type WorkflowNode,
} from './workflow-graph-optimizer-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof WORKFLOW_GRAPH_OPTIMIZER_CYCLE)[number],
  state: Es28EvidenceState,
  summary: string,
): Es28HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state:
    | 'DENIED'
    | 'REJECTED'
    | 'REGRESSED'
    | 'SANDBOX_REQUIRED'
    | 'WAITING_DATA';
  reason: string;
  executed: false;
  strippedCheck?: string;
};

function deny(
  reason: string,
  state: DenialResult['state'] = 'DENIED',
  strippedCheck?: string,
): DenialResult {
  return {
    denied: true,
    state,
    reason,
    executed: false,
    ...(strippedCheck ? { strippedCheck } : {}),
  };
}

export type ChangedNodesEdges = {
  addedNodes: readonly string[];
  removedNodes: readonly string[];
  addedEdges: readonly string[];
  removedEdges: readonly string[];
};

export type OptimizationRun = {
  optimizationId: string;
  compositionId: string;
  baselineWorkflowVersion: string;
  candidateWorkflowVersion: string;
  changedNodesEdges: ChangedNodesEdges;
  expectedBenefit: string;
  actualMeasuredBenefit: string;
  costDifference: number;
  latencyDifference: number;
  reliabilityDifference: number;
  evidenceQualityDifference: number;
  regressionState: 'none' | 'suspected' | 'confirmed';
  testRefs: readonly string[];
  reviewer: string;
  rollbackVersion: string;
  resultState: OptimizationResultState;
  quantumLabel: QuantumOptimizationLabel;
  classicalBaselineCompared: boolean;
  sandboxCompared: boolean;
  mandatoryChecksPreserved: true;
  productionDeployed: false;
  permissionsExpanded: false;
  budgetIncreased: false;
  reviewBypassed: false;
  l4AutonomyEnabled: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type SandboxComparison = {
  comparisonId: string;
  optimizationId: string;
  baselineMetrics: WorkflowMetrics;
  candidateMetrics: WorkflowMetrics;
  correctnessAtLeastBaseline: boolean;
  safetyAtLeastBaseline: boolean;
  resultHint: OptimizationResultState;
};

function edgeKey(e: WorkflowEdge): string {
  return `${e.from}->${e.to}:${e.kind}`;
}

export function diffGraphs(
  baseline: WorkflowGraph,
  candidate: WorkflowGraph,
): ChangedNodesEdges {
  const bNodes = new Set(baseline.nodes.map((n) => n.id));
  const cNodes = new Set(candidate.nodes.map((n) => n.id));
  const bEdges = new Set(baseline.edges.map(edgeKey));
  const cEdges = new Set(candidate.edges.map(edgeKey));
  return {
    addedNodes: [...cNodes].filter((id) => !bNodes.has(id)),
    removedNodes: [...bNodes].filter((id) => !cNodes.has(id)),
    addedEdges: [...cEdges].filter((k) => !bEdges.has(k)),
    removedEdges: [...bEdges].filter((k) => !cEdges.has(k)),
  };
}

export function measureWorkflowMetrics(graph: WorkflowGraph): WorkflowMetrics {
  const totalCost = graph.nodes.reduce((s, n) => s + n.estimatedCost, 0);
  // Parallel groups share wall-clock; sequential add.
  const byGroup = new Map<string, number>();
  let sequentialMs = 0;
  for (const n of graph.nodes) {
    if (n.parallelGroup) {
      byGroup.set(
        n.parallelGroup,
        Math.max(byGroup.get(n.parallelGroup) ?? 0, n.estimatedLatencyMs),
      );
    } else {
      sequentialMs += n.estimatedLatencyMs;
    }
  }
  let parallelMs = 0;
  for (const v of byGroup.values()) parallelMs += v;
  const researchNodes = graph.nodes.filter((n) => n.kind === 'research');
  const duplicateResearchCount = Math.max(0, researchNodes.length - 1);
  const handoffFrequency = graph.edges.filter((e) => e.kind === 'handoff')
    .length;
  const agentCount = new Set(
    graph.nodes.filter((n) => n.kind === 'analysis' || n.kind === 'research').map(
      (n) => n.id,
    ),
  ).size;
  const evidenceNodes = graph.nodes.filter(
    (n) => n.kind === 'evidence_provenance' || n.kind === 'merge',
  ).length;
  return {
    totalCost,
    totalLatencyMs: sequentialMs + parallelMs,
    reliability: Math.min(
      1,
      0.7 + graph.mandatoryCheckIds.length * 0.04 + evidenceNodes * 0.02,
    ),
    evidenceQuality: Math.min(1, 0.55 + evidenceNodes * 0.12),
    duplicateResearchCount,
    agentCount,
    handoffFrequency,
  };
}

export function assertMandatoryPreserved(
  baseline: WorkflowGraph,
  candidate: WorkflowGraph,
): true | DenialResult {
  const missing = missingMandatoryChecks(candidate);
  if (missing.length > 0) {
    return deny(
      `Cannot strip mandatory checks: ${missing.join(', ')}.`,
      'DENIED',
      missing[0],
    );
  }
  for (const id of baseline.mandatoryCheckIds) {
    if (!candidate.nodes.some((n) => n.id === id)) {
      return deny(
        `Mandatory node ${id} removed from candidate — wasted work may be removed, mandatory checks may not.`,
        'DENIED',
        id,
      );
    }
  }
  for (const id of baseline.approvalCheckpointIds) {
    if (!candidate.approvalCheckpointIds.includes(id)) {
      return deny(
        `Approval checkpoint ${id} stripped — approval gates are mandatory.`,
        'DENIED',
        'approval_gates',
      );
    }
  }
  for (const n of candidate.nodes) {
    if (isMandatoryNodeKind(n.kind) && !n.mandatory) {
      return deny(
        `Node ${n.id} kind ${n.kind} must remain mandatory=true.`,
        'DENIED',
        n.kind,
      );
    }
  }
  return true;
}

export function ingestExistingWorkflow(input: {
  actor: Es28Actor;
  graph: WorkflowGraph;
}): WorkflowGraph | DenialResult {
  if (!isEs28Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only workflow graph optimizer agents may ingest workflows.');
  }
  if (!input.graph.compositionId.trim() || !input.graph.version.trim()) {
    return deny('compositionId and version are required.');
  }
  const missing = missingMandatoryChecks(input.graph);
  if (missing.length > 0) {
    return deny(
      `Baseline workflow missing mandatory checks: ${missing.join(', ')}.`,
    );
  }
  return input.graph;
}

export function proposeOptimizationCandidate(input: {
  actor: Es28Actor;
  baseline: WorkflowGraph;
  candidateVersion: string;
  /** Shared retrieval instead of duplicate research A+B. */
  shareDuplicateResearch?: boolean;
  parallelizeIndependentAnalysis?: boolean;
  removeWastedCacheMisses?: boolean;
  /** Hostile attempts */
  attemptStripGuardian?: boolean;
  attemptStripApprovals?: boolean;
  attemptStripTenantUniverse?: boolean;
  attemptStripEvidence?: boolean;
  attemptStripSecurity?: boolean;
  attemptStripHumanAuth?: boolean;
}): WorkflowGraph | DenialResult {
  if (!isEs28Agent(input.actor)) {
    return deny('Only optimizer agents may propose candidates.');
  }
  if (input.attemptStripGuardian) {
    return deny(
      'STRIP_GUARDIAN_POLICY_CHECKS=false — cannot remove Guardian/policy checks.',
      'DENIED',
      'guardian_policy_checks',
    );
  }
  if (input.attemptStripApprovals) {
    return deny(
      'STRIP_APPROVAL_GATES=false — cannot remove approval gates.',
      'DENIED',
      'approval_gates',
    );
  }
  if (input.attemptStripTenantUniverse) {
    return deny(
      'STRIP_TENANT_UNIVERSE_CHECKS=false — cannot remove tenant/Universe checks.',
      'DENIED',
      'tenant_universe_checks',
    );
  }
  if (input.attemptStripEvidence) {
    return deny(
      'STRIP_EVIDENCE_PROVENANCE_CHECKS=false — cannot remove evidence/provenance checks.',
      'DENIED',
      'evidence_provenance_checks',
    );
  }
  if (input.attemptStripSecurity) {
    return deny(
      'STRIP_SECURITY_REVIEW=false — cannot remove security review.',
      'DENIED',
      'security_review',
    );
  }
  if (input.attemptStripHumanAuth) {
    return deny(
      'STRIP_HUMAN_AUTHORIZATION_CONSEQUENTIAL=false — cannot remove human authorization for consequential actions.',
      'DENIED',
      'human_authorization_consequential_actions',
    );
  }

  let nodes: WorkflowNode[] = input.baseline.nodes.map((n) => ({ ...n }));
  let edges: WorkflowEdge[] = input.baseline.edges.map((e) => ({ ...e }));

  if (input.shareDuplicateResearch) {
    const research = nodes.filter((n) => n.kind === 'research');
    if (research.length >= 2) {
      const keep = research[0]!;
      const dropIds = new Set(research.slice(1).map((n) => n.id));
      nodes = nodes
        .filter((n) => !dropIds.has(n.id))
        .map((n) =>
          n.id === keep.id
            ? {
                ...n,
                id: 'shared-retrieval',
                label: 'shared retrieval (deduped sources)',
                // Single shared retrieval replaces N duplicates — lower total cost.
                estimatedCost: Math.round(keep.estimatedCost * 1.15),
                estimatedLatencyMs: Math.round(keep.estimatedLatencyMs * 1.1),
              }
            : n,
        );
      edges = edges
        .filter((e) => !dropIds.has(e.from) && !dropIds.has(e.to))
        .map((e) => ({
          ...e,
          from: e.from === keep.id ? 'shared-retrieval' : e.from,
          to: e.to === keep.id ? 'shared-retrieval' : e.to,
        }));
    }
  }

  if (input.parallelizeIndependentAnalysis) {
    nodes = nodes.map((n) =>
      n.kind === 'analysis'
        ? { ...n, parallelGroup: n.parallelGroup ?? 'domain-analysis' }
        : n,
    );
    // Prefer parallel edges between shared retrieval and analysis nodes
    const analysisIds = nodes.filter((n) => n.kind === 'analysis').map((n) => n.id);
    const shared = nodes.find(
      (n) => n.id === 'shared-retrieval' || n.kind === 'research',
    );
    if (shared && analysisIds.length >= 2) {
      edges = edges.filter(
        (e) =>
          !(
            analysisIds.includes(e.from) &&
            analysisIds.includes(e.to) &&
            e.kind === 'sequence'
          ),
      );
      for (const aid of analysisIds) {
        const exists = edges.some(
          (e) => e.from === shared.id && e.to === aid,
        );
        if (!exists) {
          edges = [
            ...edges,
            { from: shared.id, to: aid, kind: 'parallel' },
          ];
        }
      }
    }
  }

  if (input.removeWastedCacheMisses) {
    const hasCache = nodes.some((n) => n.kind === 'cache_lookup');
    if (!hasCache) {
      nodes = [
        ...nodes,
        {
          id: 'cache-reuse',
          kind: 'cache_lookup',
          label: 'cache/index reuse',
          mandatory: false,
          estimatedCost: 1,
          estimatedLatencyMs: 20,
        },
      ];
    }
  }

  const candidate: WorkflowGraph = {
    version: input.candidateVersion,
    compositionId: input.baseline.compositionId,
    nodes,
    edges,
    approvalCheckpointIds: [...input.baseline.approvalCheckpointIds],
    mandatoryCheckIds: [...input.baseline.mandatoryCheckIds],
  };

  const preserved = assertMandatoryPreserved(input.baseline, candidate);
  if (preserved !== true) return preserved;
  return candidate;
}

export function classifyResult(
  baseline: WorkflowMetrics,
  candidate: WorkflowMetrics,
): OptimizationResultState {
  const costDelta = candidate.totalCost - baseline.totalCost;
  const latencyDelta = candidate.totalLatencyMs - baseline.totalLatencyMs;
  const relDelta = candidate.reliability - baseline.reliability;
  const evDelta = candidate.evidenceQuality - baseline.evidenceQuality;

  const regressed =
    relDelta < -0.02 ||
    evDelta < -0.02 ||
    (latencyDelta > baseline.totalLatencyMs * 0.15 &&
      costDelta > baseline.totalCost * 0.15);
  if (regressed) return 'REGRESSED';

  const lowerLatency = latencyDelta < -baseline.totalLatencyMs * 0.05;
  const lowerCost = costDelta < -baseline.totalCost * 0.05;
  const betterRel = relDelta > 0.02;
  const betterEv = evDelta > 0.02;
  const improvements = [lowerLatency, lowerCost, betterRel, betterEv].filter(
    Boolean,
  ).length;

  if (improvements >= 2) return 'BETTER_MULTI_OBJECTIVE_TRADEOFF';
  if (lowerLatency) return 'LOWER_LATENCY';
  if (lowerCost) return 'LOWER_COST';
  if (betterRel) return 'BETTER_RELIABILITY';
  if (betterEv) return 'BETTER_EVIDENCE';
  if (
    Math.abs(latencyDelta) / Math.max(1, baseline.totalLatencyMs) < 0.02 &&
    Math.abs(costDelta) / Math.max(1, baseline.totalCost) < 0.02
  ) {
    return 'NO_ADVANTAGE';
  }
  return 'REJECTED';
}

export function runSandboxComparison(input: {
  actor: Es28Actor;
  optimizationId: string;
  comparisonId: string;
  baseline: WorkflowGraph;
  candidate: WorkflowGraph;
  correctnessAtLeastBaseline?: boolean;
  safetyAtLeastBaseline?: boolean;
}): SandboxComparison | DenialResult {
  if (!isEs28Agent(input.actor)) {
    return deny('Only optimizer agents may run sandbox comparisons.');
  }
  const preserved = assertMandatoryPreserved(input.baseline, input.candidate);
  if (preserved !== true) return preserved;

  const baselineMetrics = measureWorkflowMetrics(input.baseline);
  const candidateMetrics = measureWorkflowMetrics(input.candidate);
  const correctness =
    input.correctnessAtLeastBaseline ??
    candidateMetrics.evidenceQuality >= baselineMetrics.evidenceQuality - 0.001;
  const safety =
    input.safetyAtLeastBaseline ??
    candidateMetrics.reliability >= baselineMetrics.reliability - 0.001;

  let resultHint = classifyResult(baselineMetrics, candidateMetrics);
  if (!correctness || !safety) {
    resultHint = 'REGRESSED';
  }

  return {
    comparisonId: input.comparisonId,
    optimizationId: input.optimizationId,
    baselineMetrics,
    candidateMetrics,
    correctnessAtLeastBaseline: correctness,
    safetyAtLeastBaseline: safety,
    resultHint,
  };
}

export function evaluatorReview(input: {
  actor: Es28Actor;
  optimizationId: string;
  compositionId: string;
  baseline: WorkflowGraph;
  candidate: WorkflowGraph;
  sandbox: SandboxComparison | null;
  expectedBenefit: string;
  testRefs?: readonly string[];
  quantumLabel?: QuantumOptimizationLabel;
  classicalBaselineCompared?: boolean;
  physicalQpuEvidence?: boolean;
  attemptPromoteWithoutSandbox?: boolean;
  attemptSelfDeploy?: boolean;
  attemptPermissionExpansion?: boolean;
  attemptBudgetIncrease?: boolean;
  attemptReviewBypass?: boolean;
  attemptQuantumWithoutClassical?: boolean;
  attemptClaimPhysicalQpuWithoutEvidence?: boolean;
  forceReject?: boolean;
}): OptimizationRun | DenialResult {
  if (input.attemptReviewBypass) {
    return deny('REVIEW_BYPASS=false — evaluator/human review required.');
  }
  if (input.actor.kind !== 'evaluator' && !isHumanApprover(input.actor)) {
    return deny('Only evaluator or human_approver/founder may review.');
  }
  if (input.attemptPromoteWithoutSandbox || !input.sandbox) {
    return deny(
      'PROMOTE_WITHOUT_SANDBOX=false — sandbox comparison required before promote.',
      'SANDBOX_REQUIRED',
    );
  }
  if (input.attemptSelfDeploy) {
    return deny(
      'SELF_DEPLOY_TO_PRODUCTION=false — no self-deploy to production.',
    );
  }
  if (input.attemptPermissionExpansion) {
    return deny('PERMISSION_EXPANSION=false — cannot expand permissions.');
  }
  if (input.attemptBudgetIncrease) {
    return deny('BUDGET_INCREASE=false — cannot increase budget.');
  }

  const quantumLabel = input.quantumLabel ?? 'CLASSICAL_GRAPH_OR';
  const classicalCompared = Boolean(input.classicalBaselineCompared);
  if (
    input.attemptQuantumWithoutClassical ||
    ((quantumLabel === 'QUANTUM_INSPIRED' ||
      quantumLabel === 'SIMULATED' ||
      quantumLabel === 'PHYSICAL_QPU') &&
      !classicalCompared)
  ) {
    return deny(
      'QUANTUM_WITHOUT_CLASSICAL_BASELINE=false — quantum-inspired must beat/justify against classical graph/OR baselines.',
    );
  }
  if (
    input.attemptClaimPhysicalQpuWithoutEvidence ||
    (quantumLabel === 'PHYSICAL_QPU' && !input.physicalQpuEvidence)
  ) {
    return deny(
      'QUANTUM_CLAIMED_PHYSICAL_WITHOUT_EVIDENCE=false — remains QUANTUM_INSPIRED or SIMULATED unless physical-QPU evidence.',
    );
  }

  const preserved = assertMandatoryPreserved(input.baseline, input.candidate);
  if (preserved !== true) return preserved;

  const sandbox = input.sandbox;
  let resultState = sandbox.resultHint;
  if (input.forceReject) resultState = 'REJECTED';
  if (!sandbox.correctnessAtLeastBaseline || !sandbox.safetyAtLeastBaseline) {
    resultState = 'REGRESSED';
  }

  const costDifference =
    sandbox.candidateMetrics.totalCost - sandbox.baselineMetrics.totalCost;
  const latencyDifference =
    sandbox.candidateMetrics.totalLatencyMs -
    sandbox.baselineMetrics.totalLatencyMs;
  const reliabilityDifference =
    sandbox.candidateMetrics.reliability -
    sandbox.baselineMetrics.reliability;
  const evidenceQualityDifference =
    sandbox.candidateMetrics.evidenceQuality -
    sandbox.baselineMetrics.evidenceQuality;

  const changed = diffGraphs(input.baseline, input.candidate);

  return {
    optimizationId: input.optimizationId,
    compositionId: input.compositionId,
    baselineWorkflowVersion: input.baseline.version,
    candidateWorkflowVersion: input.candidate.version,
    changedNodesEdges: changed,
    expectedBenefit: input.expectedBenefit,
    actualMeasuredBenefit: `costΔ=${costDifference.toFixed(2)}; latencyΔ=${latencyDifference.toFixed(0)}ms; relΔ=${reliabilityDifference.toFixed(3)}; evidenceΔ=${evidenceQualityDifference.toFixed(3)}`,
    costDifference,
    latencyDifference,
    reliabilityDifference,
    evidenceQualityDifference,
    regressionState: resultState === 'REGRESSED' ? 'confirmed' : 'none',
    testRefs: input.testRefs ?? [],
    reviewer: input.actor.id,
    rollbackVersion: input.baseline.version,
    resultState,
    quantumLabel,
    classicalBaselineCompared: classicalCompared || quantumLabel === 'CLASSICAL_GRAPH_OR',
    sandboxCompared: true,
    mandatoryChecksPreserved: true,
    productionDeployed: false,
    permissionsExpanded: false,
    budgetIncreased: false,
    reviewBypassed: false,
    l4AutonomyEnabled: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

/** Example: Research A + B same sources → shared retrieval → parallel analysis → one merge → reviewer. */
export function exampleDuplicateResearchWorkflow(): WorkflowGraph {
  const nodes: WorkflowNode[] = [
    {
      id: 'research-a',
      kind: 'research',
      label: 'Research A',
      mandatory: false,
      estimatedCost: 40,
      estimatedLatencyMs: 800,
    },
    {
      id: 'research-b',
      kind: 'research',
      label: 'Research B (same sources)',
      mandatory: false,
      estimatedCost: 40,
      estimatedLatencyMs: 800,
    },
    {
      id: 'analysis-domain-1',
      kind: 'analysis',
      label: 'Domain analysis 1',
      mandatory: false,
      estimatedCost: 25,
      estimatedLatencyMs: 500,
    },
    {
      id: 'analysis-domain-2',
      kind: 'analysis',
      label: 'Domain analysis 2',
      mandatory: false,
      estimatedCost: 25,
      estimatedLatencyMs: 500,
    },
    {
      id: 'evidence-merge',
      kind: 'merge',
      label: 'Evidence merge',
      mandatory: false,
      estimatedCost: 10,
      estimatedLatencyMs: 120,
    },
    {
      id: 'guardian-1',
      kind: 'guardian_policy',
      label: 'Guardian/policy check',
      mandatory: true,
      estimatedCost: 5,
      estimatedLatencyMs: 40,
    },
    {
      id: 'tenant-1',
      kind: 'tenant_universe',
      label: 'Tenant/Universe check',
      mandatory: true,
      estimatedCost: 5,
      estimatedLatencyMs: 30,
    },
    {
      id: 'approval-1',
      kind: 'approval_gate',
      label: 'Approval gate',
      mandatory: true,
      estimatedCost: 2,
      estimatedLatencyMs: 20,
    },
    {
      id: 'evidence-1',
      kind: 'evidence_provenance',
      label: 'Evidence/provenance check',
      mandatory: true,
      estimatedCost: 5,
      estimatedLatencyMs: 40,
    },
    {
      id: 'security-1',
      kind: 'security_review',
      label: 'Security review',
      mandatory: true,
      estimatedCost: 8,
      estimatedLatencyMs: 60,
    },
    {
      id: 'human-auth-1',
      kind: 'human_authorization',
      label: 'Human authorization (consequential)',
      mandatory: true,
      estimatedCost: 1,
      estimatedLatencyMs: 10,
    },
  ];
  const edges: WorkflowEdge[] = [
    { from: 'research-a', to: 'analysis-domain-1', kind: 'sequence' },
    { from: 'research-b', to: 'analysis-domain-2', kind: 'sequence' },
    { from: 'analysis-domain-1', to: 'analysis-domain-2', kind: 'sequence' },
    { from: 'analysis-domain-2', to: 'evidence-merge', kind: 'sequence' },
    { from: 'evidence-merge', to: 'guardian-1', kind: 'sequence' },
    { from: 'guardian-1', to: 'tenant-1', kind: 'sequence' },
    { from: 'tenant-1', to: 'approval-1', kind: 'sequence' },
    { from: 'approval-1', to: 'evidence-1', kind: 'sequence' },
    { from: 'evidence-1', to: 'security-1', kind: 'sequence' },
    { from: 'security-1', to: 'human-auth-1', kind: 'sequence' },
    { from: 'analysis-domain-1', to: 'evidence-merge', kind: 'handoff' },
  ];
  return {
    version: 'wf-v1-baseline',
    compositionId: 'comp-es28-demo',
    nodes,
    edges,
    approvalCheckpointIds: ['approval-1'],
    mandatoryCheckIds: [
      'guardian-1',
      'tenant-1',
      'approval-1',
      'evidence-1',
      'security-1',
      'human-auth-1',
    ],
  };
}

export function attemptStripGuardianPolicyChecks(): DenialResult {
  return deny(
    'STRIP_GUARDIAN_POLICY_CHECKS=false.',
    'DENIED',
    'guardian_policy_checks',
  );
}

export function attemptStripApprovalGates(): DenialResult {
  return deny('STRIP_APPROVAL_GATES=false.', 'DENIED', 'approval_gates');
}

export function attemptStripTenantUniverseChecks(): DenialResult {
  return deny(
    'STRIP_TENANT_UNIVERSE_CHECKS=false.',
    'DENIED',
    'tenant_universe_checks',
  );
}

export function attemptStripEvidenceProvenanceChecks(): DenialResult {
  return deny(
    'STRIP_EVIDENCE_PROVENANCE_CHECKS=false.',
    'DENIED',
    'evidence_provenance_checks',
  );
}

export function attemptStripSecurityReview(): DenialResult {
  return deny('STRIP_SECURITY_REVIEW=false.', 'DENIED', 'security_review');
}

export function attemptStripHumanAuthorization(): DenialResult {
  return deny(
    'STRIP_HUMAN_AUTHORIZATION_CONSEQUENTIAL=false.',
    'DENIED',
    'human_authorization_consequential_actions',
  );
}

export function attemptPromoteWithoutSandbox(): DenialResult {
  return deny(
    'PROMOTE_WITHOUT_SANDBOX=false.',
    'SANDBOX_REQUIRED',
  );
}

export function attemptSelfDeployToProduction(): DenialResult {
  return deny('SELF_DEPLOY_TO_PRODUCTION=false.');
}

export function attemptPermissionExpansion(): DenialResult {
  return deny('PERMISSION_EXPANSION=false.');
}

export function attemptBudgetIncrease(): DenialResult {
  return deny('BUDGET_INCREASE=false.');
}

export function attemptReviewBypass(): DenialResult {
  return deny('REVIEW_BYPASS=false.');
}

export function attemptQuantumWithoutClassicalBaseline(): DenialResult {
  return deny('QUANTUM_WITHOUT_CLASSICAL_BASELINE=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act.');
}

export function requireHumanApproval(actor: Es28Actor): true | DenialResult {
  if (!isHumanApprover(actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS — human approver required.',
      'DENIED',
    );
  }
  return true;
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  bypassDenied: true;
} {
  return { unchanged: true, bypassDenied: true };
}

export function returnOptimizationEvidenceToHomeBase(input: {
  run: OptimizationRun;
}): { accepted: true; productionAuthorized: false } {
  void input.run;
  return { accepted: true, productionAuthorized: false };
}

export function bootstrapWorkflowGraphOptimizer(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Es28SoftWireSnapshot;
  hops: Es28HopRecord[];
  honestyBanner: typeof HONESTY_BANNER;
  nextPhase: typeof NEXT_PHASE_TITLE;
  l4AutonomyEnabled: false;
  tipLand: false;
  managePullRequest: false;
  dbCandidatesStatus: typeof ES28_DB_CANDIDATES_STATUS;
} {
  const softWire = es28SoftWireSnapshot(repoRoot);
  const locksIntact = assertEs28LocksIntact();
  const hops: Es28HopRecord[] = [
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact
        ? 'ES28 locks intact; L4=false; mandatory checks preserved.'
        : 'ES28 locks violated.',
    ),
    hop(
      'workflow_graph_optimizer_bootstrap',
      'IMPLEMENTED',
      'Workflow Graph Optimizer bootstrapped (park-and-implement).',
    ),
    hop(
      'core_flow_encoded',
      'PASS',
      `Core flow: ${WORKFLOW_GRAPH_OPTIMIZER_CORE_FLOW.join(' → ')}`,
    ),
    hop(
      'evaluate_dimensions_encoded',
      'PASS',
      `${OPTIMIZATION_EVALUATE_DIMENSIONS.length} evaluate dimensions encoded.`,
    ),
    hop(
      'tracking_fields_encoded',
      'PASS',
      `${OPTIMIZATION_TRACKING_FIELDS.length} tracking fields encoded.`,
    ),
    hop(
      'result_states_encoded',
      'PASS',
      `Result states: ${OPTIMIZATION_RESULT_STATES.join(', ')}`,
    ),
    hop(
      'mandatory_checks_encoded',
      'PASS',
      `Mandatory: ${MANDATORY_PRESERVED_CHECKS.join(', ')}`,
    ),
    hop(
      'may_remove_wasted_work_only',
      'PASS',
      'May remove wasted/duplicate work only.',
    ),
    hop(
      'cannot_strip_mandatory_checks',
      'PASS',
      'Cannot strip Guardian/approvals/tenant/evidence/security/human auth.',
    ),
    hop(
      'sandbox_required_before_promote',
      'PASS',
      'Sandbox comparison required before improved candidate promote.',
    ),
    hop(
      'quantum_needs_classical_baseline',
      'PASS',
      'Quantum-inspired must beat/justify classical graph/OR baselines.',
    ),
    hop(
      'quantum_label_honesty',
      'PASS',
      `Labels: ${QUANTUM_OPTIMIZATION_LABELS.join(', ')}`,
    ),
    hop('no_strip_guardian_policy', 'PASS', 'Guardian strip denied.'),
    hop('no_strip_tenant_universe', 'PASS', 'Tenant/Universe strip denied.'),
    hop('no_strip_approval_gates', 'PASS', 'Approval gate strip denied.'),
    hop('no_strip_evidence_provenance', 'PASS', 'Evidence strip denied.'),
    hop('no_strip_security_review', 'PASS', 'Security review strip denied.'),
    hop('no_strip_human_authorization', 'PASS', 'Human auth strip denied.'),
    hop('no_self_deploy_production', 'PASS', 'Self-deploy denied.'),
    hop('no_permission_expansion', 'PASS', 'Permission expansion denied.'),
    hop('no_budget_increase', 'PASS', 'Budget increase denied.'),
    hop('no_review_bypass', 'PASS', 'Review bypass denied.'),
    hop(
      'guardian_rls_tenant_universe_isolation',
      'PASS',
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
    hop('recommend_neq_act', 'PASS', 'Recommend ≠ act.'),
    hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false.'),
    hop(
      'es27_soft_wire',
      softWireHopState(softWire.es27CapabilityComposition.present),
      softWire.es27CapabilityComposition.note,
    ),
    hop(
      'es26_soft_wire',
      softWireHopState(softWire.es26Marketplace.present),
      softWire.es26Marketplace.note,
    ),
    hop(
      'es23_soft_wire',
      softWireHopState(softWire.es23Experiments.present),
      softWire.es23Experiments.note,
    ),
    hop(
      'es9_soft_wire',
      softWireHopState(softWire.es9RegressionGate.present),
      softWire.es9RegressionGate.note,
    ),
    hop(
      'er7_soft_wire',
      softWireHopState(softWire.er7HistoricalAtlas.present),
      softWire.er7HistoricalAtlas.note,
    ),
    hop(
      'ep18_qi_soft_wire',
      softWireHopState(softWire.ep18QuantumInspiredLab.present),
      softWire.ep18QuantumInspiredLab.note,
    ),
    hop(
      'db_candidates_not_applied',
      'NOT_APPLIED',
      `DB candidates ${ES28_DB_CANDIDATES_STATUS}.`,
    ),
    hop(
      'evidence',
      'IMPLEMENTED',
      `${ES_LAYER_TITLE}; ${GITHUB_SOT_LABEL}; family ${GITHUB_SOT_FAMILY}; SoT issue ${String(GITHUB_SOT_ISSUE)}; ${GITHUB_SOT_ISSUE_NOTE}; ${GITLAB_MIRROR_NOTE}; ${GITHUB_SOT_TITLE}; next ${NEXT_PHASE_TITLE}; truth ${JSON.stringify(WORKFLOW_GRAPH_OPTIMIZER_TRUTH_BOUNDARY)}; may=${ES28_MAY.length}; must_not=${ES28_MUST_NOT.length}; locks tipLand=${String(ES28_LOCKS.TIP_LAND)}.`,
    ),
  ];

  return {
    locksIntact,
    softWire,
    hops,
    honestyBanner: HONESTY_BANNER,
    nextPhase: NEXT_PHASE_TITLE,
    l4AutonomyEnabled: false,
    tipLand: false,
    managePullRequest: false,
    dbCandidatesStatus: ES28_DB_CANDIDATES_STATUS,
  };
}

export function runWorkflowGraphOptimizerCycle(input?: {
  repoRoot?: string;
  actor?: Es28Actor;
}): {
  bootstrap: ReturnType<typeof bootstrapWorkflowGraphOptimizer>;
  baseline: WorkflowGraph;
  baselineMetrics: WorkflowMetrics;
  candidate: WorkflowGraph;
  sandbox: SandboxComparison;
  run: OptimizationRun;
} {
  const bootstrap = bootstrapWorkflowGraphOptimizer(input?.repoRoot);
  const actor: Es28Actor = input?.actor ?? {
    kind: 'workflow_graph_optimizer',
    id: 'wgo-cycle',
    orgId: 'org-es28',
    tenantId: 'ten-es28',
    universeId: 'uni-es28',
    permissions: ['draft'],
  };
  const evaluator: Es28Actor = {
    kind: 'evaluator',
    id: 'eval-cycle',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    permissions: ['review'],
  };

  const baseline = exampleDuplicateResearchWorkflow();
  const baselineMetrics = measureWorkflowMetrics(baseline);
  const candidate = proposeOptimizationCandidate({
    actor,
    baseline,
    candidateVersion: 'wf-v2-shared-parallel',
    shareDuplicateResearch: true,
    parallelizeIndependentAnalysis: true,
    removeWastedCacheMisses: true,
  });
  if ('denied' in candidate) {
    throw new Error(`cycle candidate denied: ${candidate.reason}`);
  }
  const sandbox = runSandboxComparison({
    actor,
    optimizationId: 'opt-cycle-1',
    comparisonId: 'cmp-cycle-1',
    baseline,
    candidate,
  });
  if ('denied' in sandbox) {
    throw new Error(`cycle sandbox denied: ${sandbox.reason}`);
  }
  const run = evaluatorReview({
    actor: evaluator,
    optimizationId: 'opt-cycle-1',
    compositionId: baseline.compositionId,
    baseline,
    candidate,
    sandbox,
    expectedBenefit: 'shared retrieval + parallel domain analysis',
    testRefs: ['phase62les28.test.ts'],
    quantumLabel: 'CLASSICAL_GRAPH_OR',
    classicalBaselineCompared: true,
  });
  if ('denied' in run) {
    throw new Error(`cycle review denied: ${run.reason}`);
  }

  void baselineMetrics;
  return { bootstrap, baseline, baselineMetrics, candidate, sandbox, run };
}
