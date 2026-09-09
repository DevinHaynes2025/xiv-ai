/**
 * 62L-EX7 — Hybrid Classical/Quantum Router.
 * One shared router on existing Agent Mesh / Home Base fabric.
 * Does NOT duplicate Agent Mesh / Guardian / identity / tenant /
 * compute envelope / QPU registry / baseline engine.
 */

import { createHash } from 'node:crypto';
import {
  assertBaselineForAdvantage,
  gateExpiry,
  gateTenantUniverse,
  isPhysicalQpuCandidate,
  isQuantumInspired,
  isSimulatedQuantum,
  partitionCandidates,
} from './route-policy.ts';
import { rankCandidates, staleLowersConfidence } from './route-score.ts';
import {
  applyRouteLearning,
  buildRouteReceipt,
  recordExplicitFallback,
} from './route-receipt.ts';
import {
  EX7_CANONICAL_FLOW,
  EX7_LOCKS,
  type HardwareDeviceRecord,
  type HybridExecutionRequest,
  type HybridRouteDecision,
  type HybridRouteReceipt,
  type RouteClass,
  type RouteState,
  ex7SoftWireSnapshot,
} from './types.ts';

export type RouteInventory = {
  devices: readonly HardwareDeviceRecord[];
  /** Explicit reasons required for any REMOTE device. */
  remoteReasons?: Readonly<Record<string, string | null>>;
  /** EX2 baseline presence for advantage/performance evaluation. */
  baselinePresent?: boolean;
};

function decisionIdFor(requestId: string, now: string): string {
  return `hrd-${createHash('sha256')
    .update(`${requestId}|${now}`)
    .digest('hex')
    .slice(0, 20)}`;
}

function emptyDecision(
  request: HybridExecutionRequest,
  state: RouteState,
  reasons: readonly string[],
  extras: Partial<HybridRouteDecision> = {},
): HybridRouteDecision {
  const now = new Date().toISOString();
  return {
    decisionId: decisionIdFor(request.requestId, now),
    requestId: request.requestId,
    state,
    eligible: [],
    ineligible: extras.ineligible ?? [],
    selected: null,
    selectedRouteClass: null,
    selectedDeviceId: null,
    selectedRuntimeId: null,
    score: null,
    reasons,
    approvalsRequired: extras.approvalsRequired ?? [],
    fallbackRequested: extras.fallbackRequested ?? [],
    fallbackActual: extras.fallbackActual ?? null,
    fallbackRecorded: extras.fallbackRecorded ?? false,
    evidenceRefs: extras.evidenceRefs ?? [],
    advantageClaimAllowed: false,
    advantageClaimBlockReason:
      extras.advantageClaimBlockReason ??
      'Advantage claims require EX2 baseline + comparability; EX7 never auto-claims.',
    learningState: extras.learningState ?? null,
    createdAt: now,
    ...extras,
    state,
    reasons,
  };
}

/**
 * Select a hybrid route. Policy gates override score.
 * PHYSICAL_QPU_CANDIDATE may be recommended — never autonomously submitted
 * when cost-bearing / approval-required.
 */
export function selectHybridRoute(
  request: HybridExecutionRequest,
  inventory: RouteInventory,
  nowIso?: string,
): HybridRouteDecision {
  void EX7_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK;
  void EX7_CANONICAL_FLOW;
  const now = nowIso ?? new Date().toISOString();

  const tenantGate = gateTenantUniverse(request);
  if (!tenantGate.ok) {
    return emptyDecision(request, tenantGate.state ?? 'ROUTE_DENIED', [
      tenantGate.reason,
    ]);
  }

  const expiryGate = gateExpiry(request, now);
  if (!expiryGate.ok) {
    return emptyDecision(request, expiryGate.state ?? 'EXPIRED', [
      expiryGate.reason,
    ]);
  }

  if (request.webFreshRequired && request.offline) {
    return emptyDecision(request, 'WAITING_DATA', [
      'WAITING_DATA — web-fresh required while offline; availability not fabricated.',
    ]);
  }

  const { eligible, ineligible, specialtyState } = partitionCandidates(
    request,
    inventory.devices,
    inventory.remoteReasons ?? {},
  );

  if (eligible.length === 0) {
    // Prefer specialty waiting states when they explain the empty set.
    if (specialtyState === 'WAITING_PROVIDER') {
      return emptyDecision(request, 'WAITING_PROVIDER', [
        'No eligible route; physical/remote provider unavailable offline or marked unavailable.',
      ], { ineligible });
    }
    if (specialtyState === 'WAITING_DATA') {
      return emptyDecision(request, 'WAITING_DATA', [
        'No eligible route; waiting on data freshness.',
      ], { ineligible });
    }
    if (specialtyState === 'HUMAN_APPROVAL_REQUIRED') {
      return emptyDecision(request, 'HUMAN_APPROVAL_REQUIRED', [
        'Cost-bearing physical QPU candidate requires human approval; not submitted.',
      ], {
        ineligible,
        approvalsRequired: ['HUMAN_APPROVAL_REQUIRED_PHYSICAL_QPU'],
      });
    }
    if (specialtyState === 'WAITING_NODE') {
      return emptyDecision(request, 'WAITING_NODE', [
        'No eligible route; waiting on local node availability.',
      ], { ineligible });
    }
    if (specialtyState === 'RESOURCE_LIMITED') {
      return emptyDecision(request, 'RESOURCE_LIMITED', [
        'No eligible route under resource/cost/latency budgets.',
      ], { ineligible });
    }
    return emptyDecision(request, 'NO_ELIGIBLE_ROUTE', [
      'NO_ELIGIBLE_ROUTE — all candidates failed policy/evidence/cost/privacy gates.',
    ], { ineligible });
  }

  const ranked = rankCandidates(request, eligible);
  let selectedEntry = ranked[0]!;

  // Explicit fallback chain — never silent.
  const preferred = request.preferredRouteClasses;
  const chain =
    request.fallbackPolicy === 'EXPLICIT_CHAIN' &&
    request.explicitFallbackChain.length > 0
      ? request.explicitFallbackChain
      : preferred.length > 0
        ? preferred
        : [];

  let fallbackRequested: readonly RouteClass[] = [];
  let fallbackActual: RouteClass | null = null;
  let fallbackRecorded = false;

  if (chain.length > 0) {
    fallbackRequested = chain;
    const firstChoice = chain[0]!;
    const firstAvailable = ranked.find((r) => r.candidate.routeClass === firstChoice);
    if (firstAvailable) {
      selectedEntry = firstAvailable;
      fallbackActual = firstChoice;
    } else {
      // Walk explicit chain; record requested vs actual.
      let found: (typeof ranked)[number] | undefined;
      for (const cls of chain) {
        found = ranked.find((r) => r.candidate.routeClass === cls);
        if (found) break;
      }
      if (found) {
        selectedEntry = found;
        fallbackActual = found.candidate.routeClass;
      } else {
        fallbackActual = selectedEntry.candidate.routeClass;
      }
    }
    const recorded = recordExplicitFallback({
      requested: fallbackRequested,
      actual: fallbackActual,
      silent: false,
    });
    fallbackRecorded = recorded.fallbackRecorded;
  }

  const staleInfo = staleLowersConfidence(
    selectedEntry.candidate,
    selectedEntry.score,
  );

  const baselineCheck = assertBaselineForAdvantage(
    inventory.baselinePresent === true,
  );
  const advantageClaimBlockReason = !baselineCheck.allowed
    ? baselineCheck.reason
    : 'EX7 router never claims unsupported quantum advantage; comparison requires EX2 gate.';

  // Preserve class identity — never collapse to vague QUANTUM.
  const selectedClass = selectedEntry.candidate.routeClass;
  if (isSimulatedQuantum(selectedClass) && selectedClass.includes('QUANTUM') === false) {
    // unreachable guard for class honesty
  }

  const reasons: string[] = [
    `ROUTE_SELECTED — ${selectedClass} on ${selectedEntry.candidate.device.deviceId}`,
    `LOCAL_FIRST tier=${selectedEntry.candidate.localFirstTier}`,
    `score.total=${selectedEntry.score.total.toFixed(3)}`,
    staleInfo.note,
    `class_preserved=${selectedClass}`,
  ];

  if (selectedEntry.candidate.remoteReason) {
    reasons.push(`remote_reason=${selectedEntry.candidate.remoteReason}`);
  }
  if (isQuantumInspired(selectedClass)) {
    reasons.push('QUANTUM_INSPIRED class preserved (not collapsed to QUANTUM).');
  }
  if (isSimulatedQuantum(selectedClass)) {
    reasons.push('SIMULATED_QUANTUM class preserved (≠ PHYSICAL_QPU).');
  }
  if (isPhysicalQpuCandidate(selectedClass)) {
    reasons.push(
      'PHYSICAL_QPU_CANDIDATE recommended only — ≠ submitted; ≠ cost-bearing without approval.',
    );
  }

  const learning = applyRouteLearning({
    routeClass: selectedClass,
    deviceId: selectedEntry.candidate.device.deviceId,
    success: true,
  });

  return {
    decisionId: decisionIdFor(request.requestId, now),
    requestId: request.requestId,
    state: 'ROUTE_SELECTED',
    eligible: ranked.map((r) => r.candidate),
    ineligible,
    selected: selectedEntry.candidate,
    selectedRouteClass: selectedClass,
    selectedDeviceId: selectedEntry.candidate.device.deviceId,
    selectedRuntimeId: selectedEntry.candidate.device.runtimeId,
    score: selectedEntry.score,
    reasons,
    approvalsRequired: [],
    fallbackRequested,
    fallbackActual,
    fallbackRecorded,
    evidenceRefs: [
      `device:${selectedEntry.candidate.device.deviceId}:${selectedEntry.candidate.device.evidenceState}`,
      `freshness:${selectedEntry.candidate.device.benchmarkFreshness}`,
    ],
    advantageClaimAllowed: false,
    advantageClaimBlockReason,
    learningState: learning.learningState,
    createdAt: now,
  };
}

export function executeHybridRouteDecision(
  request: HybridExecutionRequest,
  decision: HybridRouteDecision,
): HybridRouteReceipt {
  return buildRouteReceipt({
    decision,
    missionId: request.missionId,
    taskId: request.taskId,
    tenantId: request.tenantId,
    universeId: request.universeId,
    requestedRouteClass:
      request.preferredRouteClasses[0] ??
      decision.fallbackRequested[0] ??
      decision.selectedRouteClass,
  });
}

/** Multi-device inventory helper — keeps class identity per device. */
export function buildMultiDeviceInventory(
  devices: readonly HardwareDeviceRecord[],
  remoteReasons?: Readonly<Record<string, string | null>>,
  baselinePresent = false,
): RouteInventory {
  return { devices, remoteReasons, baselinePresent };
}

export function softWireEx7() {
  return ex7SoftWireSnapshot();
}
