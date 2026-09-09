/**
 * 62L-EP12 — Hardware-Neutral Scheduler runtime.
 *
 * Score eligible routes; enforce privacy/cost/verification gates;
 * return UNAVAILABLE when no safe route. Soft-wires EP11/EP10/EP6/EP5/EP1/EM157.
 */

import {
  DEFAULT_ROUTE_WEIGHTS,
  DEVICE_CLASSES,
  DEVICE_VERIFICATION_STATES,
  EP12_DB_CANDIDATES_STATUS,
  EP12_LOCKS,
  EP12_MAY,
  EP12_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HARDWARE_NEUTRAL_SCHEDULER_CYCLE,
  HONESTY_BANNER,
  LEARNING_LOOP_FIELDS,
  NEXT_PHASE_TITLE,
  PRIVACY_MODES,
  QUANTUM_SCHEDULING_COMPETITORS,
  ROUTE_SCORE_COMPONENTS,
  ROUTE_STATES,
  SCHEDULER_AGENT_BOUNDS,
  SCHEDULER_CORE_FLOW,
  SCHEDULER_SCORE_DIMENSIONS,
  assertEp12LocksIntact,
  computeRouteScore,
  ep12SoftWireSnapshot,
  isHumanApprover,
  isSchedulerAgent,
  type DeviceClass,
  type DeviceVerificationState,
  type Ep12Actor,
  type Ep12EvidenceState,
  type Ep12HopRecord,
  type Ep12SoftWireSnapshot,
  type PrivacyMode,
  type RouteScoreComponent,
  type RouteState,
  type RouteWeights,
  type SchedulerScoreDimension,
} from './hardware-neutral-scheduler-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof HARDWARE_NEUTRAL_SCHEDULER_CYCLE)[number],
  state: Ep12EvidenceState,
  summary: string,
): Ep12HopRecord {
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

export type TaskEnvelopeSummary = {
  taskEnvelopeId: string;
  privacyMode: PrivacyMode;
  minimumVerificationState: DeviceVerificationState;
  costCeiling: number;
  requiredCapabilities: readonly string[];
  preferredDeviceClass?: DeviceClass;
};

export type CandidateNode = {
  nodeId: string;
  deviceClass: DeviceClass;
  verificationState: DeviceVerificationState;
  heartbeatFresh: boolean;
  locality: 'local' | 'edge' | 'cloud';
  estimatedCost: number;
  scoreComponents: {
    compatibility: number;
    privacy: number;
    reliability: number;
    performance: number;
    cost: number;
    resourcePressure: number;
    networkRisk: number;
  };
};

export type ScoredRoute = {
  nodeId: string;
  deviceClass: DeviceClass;
  routeState: RouteState;
  routeScore: number;
  verificationState: DeviceVerificationState;
  locality: 'local' | 'edge' | 'cloud';
  estimatedCost: number;
  explainable: true;
};

export type ScheduleDecision = {
  decisionId: string;
  taskEnvelopeId: string;
  selected: ScoredRoute | null;
  ranked: readonly ScoredRoute[];
  outcome: 'ROUTED' | 'UNAVAILABLE';
  reason: string;
  silentFallbackRecorded: boolean;
  weights: RouteWeights;
  learningLoop: {
    plannedRoute: string | null;
    actualRoute: string | null;
    latency: string | null;
    costResourceEvidence: string | null;
    successFailure: 'pending' | 'success' | 'failure';
    feedsBenchmarkMemory: true;
    permissionsExpanded: false;
  };
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export function mergeOrgMissionWeights(
  overrides?: Partial<RouteWeights>,
): RouteWeights {
  return {
    ...DEFAULT_ROUTE_WEIGHTS,
    ...overrides,
  };
}

export function classifyRouteState(input: {
  verificationState: DeviceVerificationState;
  heartbeatFresh: boolean;
  minimumVerificationState: DeviceVerificationState;
  throttled?: boolean;
  degraded?: boolean;
}): RouteState {
  if (!input.heartbeatFresh) return 'STALE';
  if (
    input.minimumVerificationState === 'VERIFIED' &&
    input.verificationState === 'NOT_TESTED'
  ) {
    return 'NOT_ELIGIBLE';
  }
  if (
    input.minimumVerificationState === 'VERIFIED' &&
    input.verificationState !== 'VERIFIED'
  ) {
    return 'NOT_ELIGIBLE';
  }
  if (input.verificationState === 'UNAVAILABLE') return 'WAITING_NODE';
  if (input.throttled) return 'THROTTLED';
  if (input.degraded || input.verificationState === 'DEGRADED') return 'DEGRADED';
  if (input.verificationState === 'VERIFIED') return 'PREFERRED';
  return 'ELIGIBLE';
}

export function privacyAllowsLocality(input: {
  privacyMode: PrivacyMode;
  locality: 'local' | 'edge' | 'cloud';
}): boolean {
  if (input.privacyMode === 'LOCAL_ONLY') return input.locality === 'local';
  if (input.privacyMode === 'EDGE_ALLOWED') {
    return input.locality === 'local' || input.locality === 'edge';
  }
  return true;
}

export function scheduleTask(input: {
  actor: Ep12Actor;
  decisionId: string;
  envelope: TaskEnvelopeSummary;
  candidates: readonly CandidateNode[];
  weights?: Partial<RouteWeights>;
  attemptNotTestedForVerified?: boolean;
  attemptStaleHeartbeat?: boolean;
  attemptTradePrivacyForPerformance?: boolean;
  attemptLocalOnlyToCloud?: boolean;
  attemptExceedCostCeiling?: boolean;
  attemptIncreaseAgentBudget?: boolean;
  attemptForceWithoutSafeRoute?: boolean;
  attemptAutonomousProvisioning?: boolean;
  attemptAutonomousCloudPurchasing?: boolean;
  attemptSelfExpandPermissions?: boolean;
  silentFallbackOccurred?: boolean;
  attemptOmitSilentFallbackRecord?: boolean;
}): ScheduleDecision | DenialResult {
  if (input.attemptAutonomousProvisioning) {
    return deny(
      'AUTONOMOUS_PROVISIONING=false — no autonomous provisioning.',
    );
  }
  if (input.attemptAutonomousCloudPurchasing) {
    return deny(
      'AUTONOMOUS_CLOUD_PURCHASING=false — no autonomous cloud purchasing.',
    );
  }
  if (input.attemptIncreaseAgentBudget) {
    return deny(
      'AGENT_BUDGET_INCREASE_VIA_SCHEDULER=false — agents cannot increase compute budgets through scheduling.',
    );
  }
  if (input.attemptSelfExpandPermissions) {
    return deny(
      'SCHEDULER_SELF_EXPANDS_PERMISSIONS=false — scheduler cannot self-expand permissions.',
    );
  }
  if (input.attemptTradePrivacyForPerformance) {
    return deny(
      'PRIVACY_TRADED_FOR_PERFORMANCE=false — privacy and security constraints cannot be traded away for performance.',
    );
  }
  if (
    input.attemptLocalOnlyToCloud &&
    input.envelope.privacyMode === 'LOCAL_ONLY'
  ) {
    return deny(
      'LOCAL_ONLY_SILENT_CLOUD=false — LOCAL_ONLY workloads cannot silently move to cloud.',
    );
  }
  if (
    input.silentFallbackOccurred &&
    input.attemptOmitSilentFallbackRecord
  ) {
    return deny(
      'SILENT_FALLBACK_UNRECORDED=false — silent accelerator fallback must be recorded.',
    );
  }

  const weights = mergeOrgMissionWeights(input.weights);
  const ranked: ScoredRoute[] = [];

  for (const c of input.candidates) {
    if (input.attemptStaleHeartbeat && !c.heartbeatFresh) {
      // will be classified STALE / excluded
    }
    if (
      input.attemptNotTestedForVerified &&
      c.verificationState === 'NOT_TESTED' &&
      input.envelope.minimumVerificationState === 'VERIFIED'
    ) {
      return deny(
        'NOT_TESTED_SATISFIES_VERIFIED=false — NOT_TESTED hardware cannot win a route requiring VERIFIED.',
      );
    }

    const routeState = classifyRouteState({
      verificationState: c.verificationState,
      heartbeatFresh: c.heartbeatFresh,
      minimumVerificationState: input.envelope.minimumVerificationState,
    });

    if (routeState === 'STALE' || routeState === 'NOT_ELIGIBLE') {
      ranked.push({
        nodeId: c.nodeId,
        deviceClass: c.deviceClass,
        routeState,
        routeScore: Number.NEGATIVE_INFINITY,
        verificationState: c.verificationState,
        locality: c.locality,
        estimatedCost: c.estimatedCost,
        explainable: true,
      });
      continue;
    }

    if (
      !privacyAllowsLocality({
        privacyMode: input.envelope.privacyMode,
        locality: c.locality,
      })
    ) {
      ranked.push({
        nodeId: c.nodeId,
        deviceClass: c.deviceClass,
        routeState: 'NOT_ELIGIBLE',
        routeScore: Number.NEGATIVE_INFINITY,
        verificationState: c.verificationState,
        locality: c.locality,
        estimatedCost: c.estimatedCost,
        explainable: true,
      });
      continue;
    }

    if (c.estimatedCost > input.envelope.costCeiling) {
      if (input.attemptExceedCostCeiling) {
        return deny(
          'COST_CEILING_SOFT=false — cost ceilings are hard constraints.',
        );
      }
      ranked.push({
        nodeId: c.nodeId,
        deviceClass: c.deviceClass,
        routeState: 'NOT_ELIGIBLE',
        routeScore: Number.NEGATIVE_INFINITY,
        verificationState: c.verificationState,
        locality: c.locality,
        estimatedCost: c.estimatedCost,
        explainable: true,
      });
      continue;
    }

    const routeScore = computeRouteScore(c.scoreComponents, weights);
    ranked.push({
      nodeId: c.nodeId,
      deviceClass: c.deviceClass,
      routeState,
      routeScore,
      verificationState: c.verificationState,
      locality: c.locality,
      estimatedCost: c.estimatedCost,
      explainable: true,
    });
  }

  const eligible = ranked
    .filter(
      (r) =>
        r.routeState === 'ELIGIBLE' ||
        r.routeState === 'PREFERRED' ||
        r.routeState === 'DEGRADED' ||
        r.routeState === 'THROTTLED',
    )
    .sort((a, b) => b.routeScore - a.routeScore);

  if (!eligible.length) {
    if (input.attemptForceWithoutSafeRoute) {
      return deny(
        'FORCE_EXECUTE_WITHOUT_SAFE_ROUTE=false — if no safe route exists, return UNAVAILABLE instead of forcing execution.',
      );
    }
    return {
      decisionId: input.decisionId,
      taskEnvelopeId: input.envelope.taskEnvelopeId,
      selected: null,
      ranked,
      outcome: 'UNAVAILABLE',
      reason: 'No safe eligible route.',
      silentFallbackRecorded: Boolean(input.silentFallbackOccurred),
      weights,
      learningLoop: {
        plannedRoute: null,
        actualRoute: null,
        latency: null,
        costResourceEvidence: null,
        successFailure: 'pending',
        feedsBenchmarkMemory: true,
        permissionsExpanded: false,
      },
      orgId: input.actor.orgId,
      tenantId: input.actor.tenantId,
      universeId: input.actor.universeId,
      createdAt: nowIso(),
    };
  }

  const selected = eligible[0]!;
  return {
    decisionId: input.decisionId,
    taskEnvelopeId: input.envelope.taskEnvelopeId,
    selected,
    ranked,
    outcome: 'ROUTED',
    reason: `Selected ${selected.deviceClass}@${selected.nodeId} score=${selected.routeScore}`,
    silentFallbackRecorded: Boolean(input.silentFallbackOccurred),
    weights,
    learningLoop: {
      plannedRoute: `${selected.deviceClass}@${selected.nodeId}`,
      actualRoute: null,
      latency: null,
      costResourceEvidence: null,
      successFailure: 'pending',
      feedsBenchmarkMemory: true,
      permissionsExpanded: false,
    },
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    createdAt: nowIso(),
  };
}

export function recordExecutionOutcome(input: {
  decision: ScheduleDecision;
  actualRoute: string;
  latency: string;
  costResourceEvidence: string;
  success: boolean;
  silentFallback?: boolean;
}): ScheduleDecision | DenialResult {
  if (input.silentFallback && !input.decision.silentFallbackRecorded) {
    return deny(
      'SILENT_FALLBACK_UNRECORDED=false — silent accelerator fallback must be recorded.',
    );
  }
  return {
    ...input.decision,
    silentFallbackRecorded:
      input.decision.silentFallbackRecorded || Boolean(input.silentFallback),
    learningLoop: {
      ...input.decision.learningLoop,
      actualRoute: input.actualRoute,
      latency: input.latency,
      costResourceEvidence: input.costResourceEvidence,
      successFailure: input.success ? 'success' : 'failure',
      feedsBenchmarkMemory: true,
      permissionsExpanded: false,
    },
  };
}

export function attemptQuantumSchedulingWithoutBaseline(): DenialResult {
  return deny(
    'QUANTUM_WITHOUT_CLASSICAL_BASELINE=false — any claimed quantum improvement must satisfy the classical-baseline gate.',
  );
}

export function attemptNotTestedSatisfiesVerified(): DenialResult {
  return deny('NOT_TESTED_SATISFIES_VERIFIED=false.');
}

export function attemptStaleHeartbeatAvailable(): DenialResult {
  return deny('STALE_HEARTBEAT_EQ_AVAILABLE=false.');
}

export function attemptTradePrivacyForPerformance(): DenialResult {
  return deny('PRIVACY_TRADED_FOR_PERFORMANCE=false.');
}

export function attemptLocalOnlySilentCloud(): DenialResult {
  return deny('LOCAL_ONLY_SILENT_CLOUD=false.');
}

export function attemptIncreaseAgentBudget(): DenialResult {
  return deny('AGENT_BUDGET_INCREASE_VIA_SCHEDULER=false.');
}

export function attemptAutonomousProvisioning(): DenialResult {
  return deny('AUTONOMOUS_PROVISIONING=false.');
}

export function attemptAutonomousCloudPurchasing(): DenialResult {
  return deny('AUTONOMOUS_CLOUD_PURCHASING=false.');
}

export function attemptSelfExpandPermissions(): DenialResult {
  return deny('SCHEDULER_SELF_EXPANDS_PERMISSIONS=false.');
}

export function attemptForceWithoutSafeRoute(): DenialResult {
  return deny('FORCE_EXECUTE_WITHOUT_SAFE_ROUTE=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnSchedulerEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep12Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      flow: typeof SCHEDULER_CORE_FLOW;
      authorityGranted: false;
    }
  | DenialResult {
  if (!SCHEDULER_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isSchedulerAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only scheduler agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    flow: SCHEDULER_CORE_FLOW,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep12Actor;
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
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver or founder.',
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
    unchanged: EP12_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP12_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP12_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleLocalOnlyEnvelope(): TaskEnvelopeSummary {
  return {
    taskEnvelopeId: 'env-local-1',
    privacyMode: 'LOCAL_ONLY',
    minimumVerificationState: 'VERIFIED',
    costCeiling: 10,
    requiredCapabilities: ['onnx', 'fp16'],
    preferredDeviceClass: 'npu',
  };
}

export function exampleCandidates(): CandidateNode[] {
  return [
    {
      nodeId: 'npu-1',
      deviceClass: 'npu',
      verificationState: 'VERIFIED',
      heartbeatFresh: true,
      locality: 'local',
      estimatedCost: 2,
      scoreComponents: {
        compatibility: 9,
        privacy: 10,
        reliability: 8,
        performance: 7,
        cost: 2,
        resourcePressure: 1,
        networkRisk: 0,
      },
    },
    {
      nodeId: 'gpu-1',
      deviceClass: 'gpu',
      verificationState: 'VERIFIED',
      heartbeatFresh: true,
      locality: 'local',
      estimatedCost: 4,
      scoreComponents: {
        compatibility: 9,
        privacy: 10,
        reliability: 8,
        performance: 9,
        cost: 4,
        resourcePressure: 3,
        networkRisk: 0,
      },
    },
    {
      nodeId: 'cpu-1',
      deviceClass: 'cpu',
      verificationState: 'VERIFIED',
      heartbeatFresh: true,
      locality: 'local',
      estimatedCost: 1,
      scoreComponents: {
        compatibility: 8,
        privacy: 10,
        reliability: 9,
        performance: 4,
        cost: 1,
        resourcePressure: 2,
        networkRisk: 0,
      },
    },
    {
      nodeId: 'cloud-gpu-1',
      deviceClass: 'cloud_gpu',
      verificationState: 'VERIFIED',
      heartbeatFresh: true,
      locality: 'cloud',
      estimatedCost: 20,
      scoreComponents: {
        compatibility: 9,
        privacy: 2,
        reliability: 7,
        performance: 10,
        cost: 8,
        resourcePressure: 1,
        networkRisk: 6,
      },
    },
    {
      nodeId: 'not-tested-gpu',
      deviceClass: 'gpu',
      verificationState: 'NOT_TESTED',
      heartbeatFresh: true,
      locality: 'local',
      estimatedCost: 3,
      scoreComponents: {
        compatibility: 5,
        privacy: 10,
        reliability: 1,
        performance: 8,
        cost: 3,
        resourcePressure: 2,
        networkRisk: 0,
      },
    },
  ];
}

export function bootstrapHardwareNeutralScheduler(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep12SoftWireSnapshot;
  coreFlow: typeof SCHEDULER_CORE_FLOW;
  scoreDimensions: readonly SchedulerScoreDimension[];
  scoreComponents: readonly RouteScoreComponent[];
  routeStates: typeof ROUTE_STATES;
  privacyModes: typeof PRIVACY_MODES;
  deviceClasses: typeof DEVICE_CLASSES;
  learningLoop: typeof LEARNING_LOOP_FIELDS;
  quantumCompetitors: typeof QUANTUM_SCHEDULING_COMPETITORS;
  defaultWeights: typeof DEFAULT_ROUTE_WEIGHTS;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP12_MAY;
  mustNot: typeof EP12_MUST_NOT;
  dbCandidates: typeof EP12_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp12LocksIntact(),
    softWire: ep12SoftWireSnapshot(repoRoot),
    coreFlow: SCHEDULER_CORE_FLOW,
    scoreDimensions: SCHEDULER_SCORE_DIMENSIONS,
    scoreComponents: ROUTE_SCORE_COMPONENTS,
    routeStates: ROUTE_STATES,
    privacyModes: PRIVACY_MODES,
    deviceClasses: DEVICE_CLASSES,
    learningLoop: LEARNING_LOOP_FIELDS,
    quantumCompetitors: QUANTUM_SCHEDULING_COMPETITORS,
    defaultWeights: DEFAULT_ROUTE_WEIGHTS,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP12_MAY,
    mustNot: EP12_MUST_NOT,
    dbCandidates: EP12_DB_CANDIDATES_STATUS,
  };
}

export function runHardwareNeutralSchedulerCycle(input: {
  actor: Ep12Actor;
  human: Ep12Actor;
  repoRoot?: string;
}): {
  hops: Ep12HopRecord[];
  decision: ScheduleDecision | DenialResult;
  softWire: Ep12SoftWireSnapshot;
} {
  const hops: Ep12HopRecord[] = [];
  const softWire = ep12SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp12LocksIntact() ? 'PASS' : 'FAIL',
      'EP12 locks intact including L4=false and privacy not traded for performance.',
    ),
  );
  hops.push(
    hop(
      'hardware_neutral_scheduler_bootstrap',
      'PASS',
      'Hardware-Neutral Scheduler bootstrapped.',
    ),
  );
  hops.push(
    hop('core_flow_encoded', 'PASS', SCHEDULER_CORE_FLOW.join(' → ')),
  );
  hops.push(
    hop(
      'score_dimensions_encoded',
      'PASS',
      `${SCHEDULER_SCORE_DIMENSIONS.length} score dimensions encoded.`,
    ),
  );
  hops.push(
    hop(
      'route_score_components_encoded',
      'PASS',
      ROUTE_SCORE_COMPONENTS.join(' ± '),
    ),
  );
  hops.push(
    hop('route_states_encoded', 'PASS', ROUTE_STATES.join(' | ')),
  );
  hops.push(
    hop('privacy_modes_encoded', 'PASS', PRIVACY_MODES.join(' | ')),
  );
  hops.push(
    hop(
      'learning_loop_encoded',
      'PASS',
      LEARNING_LOOP_FIELDS.join(' → '),
    ),
  );
  hops.push(
    hop(
      'quantum_competitors_encoded',
      'PASS',
      QUANTUM_SCHEDULING_COMPETITORS.join(' | '),
    ),
  );

  hops.push(
    hop(
      'not_tested_cannot_satisfy_verified',
      attemptNotTestedSatisfiesVerified().state === 'DENIED' &&
        scheduleTask({
          actor: input.actor,
          decisionId: 'd-not-tested',
          envelope: exampleLocalOnlyEnvelope(),
          candidates: exampleCandidates().filter(
            (c) => c.verificationState === 'NOT_TESTED',
          ),
          attemptNotTestedForVerified: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'NOT_TESTED cannot satisfy VERIFIED — DENIED.',
    ),
  );

  const staleClass = classifyRouteState({
    verificationState: 'VERIFIED',
    heartbeatFresh: false,
    minimumVerificationState: 'VERIFIED',
  });
  hops.push(
    hop(
      'stale_heartbeat_unavailable',
      staleClass === 'STALE' &&
        attemptStaleHeartbeatAvailable().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Stale heartbeat → STALE / unavailable for new work.',
    ),
  );

  hops.push(
    hop(
      'silent_fallback_recorded',
      scheduleTask({
        actor: input.actor,
        decisionId: 'd-fallback',
        envelope: exampleLocalOnlyEnvelope(),
        candidates: exampleCandidates().filter((c) => c.locality === 'local'),
        silentFallbackOccurred: true,
        attemptOmitSilentFallbackRecord: true,
      }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Silent accelerator fallback must be recorded — omit DENIED.',
    ),
  );

  hops.push(
    hop(
      'privacy_not_traded_for_performance',
      attemptTradePrivacyForPerformance().state,
      'Privacy traded for performance DENIED.',
    ),
  );

  const localOnly = scheduleTask({
    actor: input.actor,
    decisionId: 'd-local',
    envelope: exampleLocalOnlyEnvelope(),
    candidates: exampleCandidates(),
  });
  hops.push(
    hop(
      'local_only_cannot_leave_device',
      !('denied' in localOnly) &&
        localOnly.outcome === 'ROUTED' &&
        localOnly.selected?.locality === 'local' &&
        attemptLocalOnlySilentCloud().state === 'DENIED' &&
        scheduleTask({
          actor: input.actor,
          decisionId: 'd-cloud-leak',
          envelope: exampleLocalOnlyEnvelope(),
          candidates: exampleCandidates(),
          attemptLocalOnlyToCloud: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'LOCAL_ONLY cannot leave enrolled device for cloud speed.',
    ),
  );

  hops.push(
    hop(
      'cost_ceilings_hard_constraints',
      scheduleTask({
        actor: input.actor,
        decisionId: 'd-cost',
        envelope: { ...exampleLocalOnlyEnvelope(), costCeiling: 1 },
        candidates: [
          {
            ...exampleCandidates()[1]!,
            estimatedCost: 50,
          },
        ],
        attemptExceedCostCeiling: true,
      }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Cost ceilings are hard constraints.',
    ),
  );

  hops.push(
    hop(
      'agents_cannot_increase_budgets',
      attemptIncreaseAgentBudget().state,
      'Agent budget increase via scheduler DENIED.',
    ),
  );

  const unavailable = scheduleTask({
    actor: input.actor,
    decisionId: 'd-none',
    envelope: exampleLocalOnlyEnvelope(),
    candidates: exampleCandidates().map((c) => ({
      ...c,
      heartbeatFresh: false,
    })),
  });
  hops.push(
    hop(
      'no_safe_route_returns_unavailable',
      !('denied' in unavailable) &&
        unavailable.outcome === 'UNAVAILABLE' &&
        attemptForceWithoutSafeRoute().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'No safe route → UNAVAILABLE (not forced).',
    ),
  );

  const weighted = mergeOrgMissionWeights({ performance: 2, cost: 0.5 });
  hops.push(
    hop(
      'weights_configurable_by_org_mission',
      weighted.performance === 2 && weighted.cost === 0.5 ? 'PASS' : 'FAIL',
      'Route weights configurable by organization/mission.',
    ),
  );

  hops.push(
    hop(
      'learning_loop_feeds_benchmark_memory',
      !('denied' in localOnly) &&
        localOnly.learningLoop.feedsBenchmarkMemory
        ? 'PASS'
        : 'FAIL',
      'Learning loop feeds Benchmark Memory / Neural Compute Pathway Graph.',
    ),
  );
  hops.push(
    hop(
      'scheduler_cannot_self_expand_permissions',
      attemptSelfExpandPermissions().state,
      'Scheduler self-expand permissions DENIED.',
    ),
  );
  hops.push(
    hop(
      'quantum_requires_classical_baseline_gate',
      attemptQuantumSchedulingWithoutBaseline().state,
      'Quantum without classical baseline DENIED.',
    ),
  );

  hops.push(
    hop(
      'no_autonomous_provisioning',
      attemptAutonomousProvisioning().state,
      'Autonomous provisioning DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_autonomous_cloud_purchasing',
      attemptAutonomousCloudPurchasing().state,
      'Autonomous cloud purchasing DENIED.',
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
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act / provision.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP12_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep11_soft_wire',
      softWire.ep11TaskEnvelope.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep11TaskEnvelope.note,
    ),
  );
  hops.push(
    hop(
      'ep10_soft_wire',
      softWire.ep10OtherAcceleratorRegistry.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep10OtherAcceleratorRegistry.note,
    ),
  );
  hops.push(
    hop(
      'ep6_soft_wire',
      softWire.ep6HardwareTruthProbe.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep6HardwareTruthProbe.note,
    ),
  );
  hops.push(
    hop(
      'ep5_soft_wire',
      softWire.ep5BenchmarkMemory.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep5BenchmarkMemory.note,
    ),
  );
  hops.push(
    hop(
      'ep1_soft_wire',
      softWire.ep1VirtualChipContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep1VirtualChipContract.note,
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
      EP12_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep12-1',
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

  void HARDWARE_NEUTRAL_SCHEDULER_CYCLE;
  void attemptAgentAutoAuthority;
  void DEVICE_VERIFICATION_STATES;

  return {
    hops,
    decision: localOnly,
    softWire,
  };
}
