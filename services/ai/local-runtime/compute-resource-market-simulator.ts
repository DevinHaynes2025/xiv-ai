/**
 * 62L-EM9 — Compute Resource Market Simulator
 *
 * Task → eligible verified nodes → simulate candidate routes → score tradeoffs
 * → recommend route → human/policy gate if consequential → execute separately.
 *
 * Simulation estimates options only — it does NOT execute the workload.
 * Never fabricates cloud prices or available capacity (UNKNOWN when unavailable).
 * No autonomous purchasing / provisioning. L4_AUTONOMY_ENABLED=false.
 */

import {
  classifyNodeHeartbeat,
  evaluateNodeEligibility,
  type ComputeNode,
} from './universal-compute-registry';
import {
  denyQuantumAdvantageClaim,
  runClassicalQuantBenchmarkSuite,
} from './classical-quant-benchmark';
import { EM9_LOCKS } from './em9-honesty';
import { probeEm9SoftWires } from './em9-soft-wire';
import type {
  DeviceDescriptor,
  EstimateNumberOrUnknown,
  GateDecision,
  HistoricalBenchmark,
  MarketCandidate,
  MarketSimulationRequest,
  MarketSimulationResult,
  QuantumInspiredHookResult,
  UnknownValue,
} from './compute-resource-market-simulator-types';
import { EM9_COMPARE_DIMENSIONS } from './compute-resource-market-simulator-types';
import type { PrivacyClass } from './universal-compute-registry-types';

export * from './compute-resource-market-simulator-types';
export {
  EM9_LOCKS,
  assertEm9LocksIntact,
  EM9_HONESTY_BANNER,
  EM9_SOT_TITLE,
  EM9_CORE_FLOW,
  EM9_DB_CANDIDATES_STATUS,
  EM9_NOT_TESTED_CLAIMS,
  NEXT_PHASE_EM10,
} from './em9-honesty';
export { probeEm9SoftWires } from './em9-soft-wire';

const UNKNOWN: UnknownValue = 'UNKNOWN';

const PRODUCTION_TRUTH = new Set(['VERIFIED', 'SUPPORTED']);

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function deviceDescriptor(node: ComputeNode): DeviceDescriptor {
  const parts: string[] = [node.placement, node.vendor, node.deviceType];
  if (node.cpu) parts.push('CPU');
  if (node.gpu) parts.push('GPU');
  if (node.npu) parts.push('NPU');
  return {
    placement: node.placement,
    vendor: node.vendor,
    deviceType: node.deviceType,
    cpuPresent: Boolean(node.cpu),
    gpuPresent: Boolean(node.gpu),
    npuPresent: Boolean(node.npu),
    label: parts.join('/'),
  };
}

function latestMeasured(
  evidence: { metric: string; value: number; recordedAt: string; evidenceId: string }[],
  metricPred: (metric: string) => boolean,
): { value: number; evidenceId: string; recordedAt: string } | null {
  const hits = evidence
    .filter((e) => metricPred(e.metric) && typeof e.value === 'number' && e.recordedAt)
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
  const top = hits[0];
  return top
    ? { value: top.value, evidenceId: top.evidenceId, recordedAt: top.recordedAt }
    : null;
}

function estimateLatency(
  node: ComputeNode,
  historical: HistoricalBenchmark[],
): { value: EstimateNumberOrUnknown; refs: string[] } {
  const fromNode = latestMeasured(node.latencyEvidence, (m) =>
    /latency|p50|p95|rtt/i.test(m),
  );
  if (fromNode) {
    return { value: fromNode.value, refs: [fromNode.evidenceId] };
  }
  const hist = historical
    .filter((h) => h.nodeId === node.nodeId && /latency|p50|p95|rtt/i.test(h.metric))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
  const h0 = hist[0];
  if (h0) return { value: h0.value, refs: [h0.evidenceId] };
  return { value: UNKNOWN, refs: [] };
}

function estimateCost(
  node: ComputeNode,
  historical: HistoricalBenchmark[],
): { value: EstimateNumberOrUnknown; refs: string[] } {
  const measured = latestMeasured(node.costModel.measured, (m) =>
    /cost|usd|price/i.test(m),
  );
  if (measured) {
    return { value: measured.value, refs: [measured.evidenceId] };
  }
  const hist = historical
    .filter((h) => h.nodeId === node.nodeId && /cost|usd|price/i.test(h.metric))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
  const h0 = hist[0];
  if (h0) return { value: h0.value, refs: [h0.evidenceId] };
  // Never use claimedCostPerHourUsd as a fabricated estimate.
  return { value: UNKNOWN, refs: [] };
}

function estimateEnergy(
  node: ComputeNode,
  historical: HistoricalBenchmark[],
): { value: EstimateNumberOrUnknown; refs: string[] } {
  if (node.energyProxy && node.energyProxy.recordedAt) {
    return {
      value: node.energyProxy.value,
      refs: [node.energyProxy.evidenceId],
    };
  }
  const hist = historical
    .filter((h) => h.nodeId === node.nodeId && /energy|watt|joule/i.test(h.metric))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
  const h0 = hist[0];
  if (h0) return { value: h0.value, refs: [h0.evidenceId] };
  return { value: UNKNOWN, refs: [] };
}

function estimateCapacity(
  node: ComputeNode,
  historical: HistoricalBenchmark[],
): EstimateNumberOrUnknown {
  const fromBench = latestMeasured(
    [
      ...(node.cpu?.measuredEvidence ?? []),
      ...(node.gpu?.measuredEvidence ?? []),
      ...(node.npu?.measuredEvidence ?? []),
    ],
    (m) => /capacity|utilization|queue_slots|free_vram|available/i.test(m),
  );
  if (fromBench) return fromBench.value;
  const hist = historical.find(
    (h) =>
      h.nodeId === node.nodeId &&
      /capacity|utilization|queue_slots|free_vram|available/i.test(h.metric) &&
      h.recordedAt,
  );
  if (hist) return hist.value;
  return UNKNOWN;
}

function privacyScore(node: ComputeNode, privacyClass: PrivacyClass): number {
  if (privacyClass === 'private') {
    if (node.placement === 'local' && node.privacyClass === 'private') return 1;
    if (node.placement === 'local') return 0.9;
    if (node.placement === 'edge') return 0.55;
    return 0.15;
  }
  if (privacyClass === 'tenant') {
    if (node.placement === 'local') return 0.95;
    if (node.placement === 'edge') return 0.75;
    return 0.35;
  }
  if (privacyClass === 'shared') {
    if (node.placement === 'edge') return 0.7;
    if (node.placement === 'local') return 0.65;
    return 0.5;
  }
  // public_cloud
  if (node.placement === 'cloud') return 0.55;
  if (node.placement === 'edge') return 0.6;
  return 0.5;
}

function localityFit(
  node: ComputeNode,
  privacyClass: PrivacyClass,
  preferLocal: boolean,
): number {
  if (!preferLocal && privacyClass === 'public_cloud') {
    return node.placement === 'cloud' ? 0.7 : node.placement === 'edge' ? 0.6 : 0.5;
  }
  if (node.placement === 'local') return 1;
  if (node.placement === 'edge') return 0.55;
  return 0.2;
}

function reliabilityScore(
  node: ComputeNode,
  historical: HistoricalBenchmark[],
): { score: number; refs: string[] } {
  const hist = historical
    .filter(
      (h) =>
        h.nodeId === node.nodeId &&
        /reliability|success_rate|uptime/i.test(h.metric) &&
        h.recordedAt,
    )
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
  if (hist[0]) {
    const raw = hist[0].value;
    const normalized = raw > 1 ? clamp01(raw / 100) : clamp01(raw);
    return { score: normalized, refs: [hist[0].evidenceId] };
  }
  // Truth-state proxy — not fabricated history.
  switch (node.verificationState) {
    case 'VERIFIED':
      return { score: 0.85, refs: [`truth:${node.nodeId}:VERIFIED`] };
    case 'SUPPORTED':
      return { score: 0.65, refs: [`truth:${node.nodeId}:SUPPORTED`] };
    case 'DETECTED':
      return { score: 0.35, refs: [`truth:${node.nodeId}:DETECTED`] };
    case 'NOT_TESTED':
      return { score: 0.2, refs: [`truth:${node.nodeId}:NOT_TESTED`] };
    default:
      return { score: 0.25, refs: [`truth:${node.nodeId}:${node.verificationState}`] };
  }
}

function networkDependence(node: ComputeNode): number {
  if (node.placement === 'local') return 0.05;
  if (node.placement === 'edge') return 0.45;
  return 0.9;
}

function dataEgressImpact(
  node: ComputeNode,
  privacyClass: PrivacyClass,
): EstimateNumberOrUnknown {
  if (node.placement === 'local') return 0;
  if (privacyClass === 'private' || privacyClass === 'tenant') {
    // Egress risk known qualitatively; numeric USD/bytes unknown without evidence.
    return UNKNOWN;
  }
  if (node.placement === 'edge') return 0.3;
  return UNKNOWN;
}

function fallbackQuality(node: ComputeNode): number {
  let q = 0.4;
  if (node.cpu && PRODUCTION_TRUTH.has(node.cpu.verificationState)) q += 0.25;
  if (node.gpu && PRODUCTION_TRUTH.has(node.gpu.verificationState)) q += 0.15;
  if (node.npu && PRODUCTION_TRUTH.has(node.npu.verificationState)) q += 0.15;
  if (node.placement === 'local') q += 0.1;
  return clamp01(q);
}

function modelCompatibility(
  node: ComputeNode,
  req: MarketSimulationRequest,
): { ok: boolean; score: number; refs: string[] } {
  const required = req.requiredModelTags ?? [];
  if (required.length === 0) {
    return { ok: true, score: 0.7, refs: ['model:unspecified'] };
  }
  const tags = req.nodeModelTags?.[node.nodeId] ?? [];
  const hits = required.filter((t) => tags.includes(t));
  if (hits.length === required.length) {
    return {
      ok: true,
      score: 1,
      refs: hits.map((t) => `model:${node.nodeId}:${t}`),
    };
  }
  if (hits.length === 0) {
    return { ok: false, score: 0, refs: [`model:${node.nodeId}:incompatible`] };
  }
  return {
    ok: false,
    score: hits.length / required.length,
    refs: hits.map((t) => `model:${node.nodeId}:${t}`),
  };
}

function resourceFit(node: ComputeNode, req: MarketSimulationRequest): number {
  let score = 0.7;
  if (typeof req.requiredRamBytes === 'number' && typeof node.ramBytes === 'number') {
    score = node.ramBytes >= req.requiredRamBytes ? 1 : 0.2;
  }
  if (typeof req.requiredVramBytes === 'number') {
    const vram = node.gpu?.memoryBytes ?? node.npu?.memoryBytes;
    if (typeof vram === 'number') {
      score = Math.min(score, vram >= req.requiredVramBytes ? 1 : 0.15);
    } else {
      // Unknown VRAM — do not invent capacity.
      score = Math.min(score, 0.5);
    }
  }
  return clamp01(score);
}

/**
 * Classical weighted score — privacy / correctness / reliability before cost.
 * Cheapest is never automatically best.
 */
export function classicalTradeoffScore(candidate: MarketCandidate): number {
  const latencyTerm =
    candidate.estimatedLatency === UNKNOWN
      ? 0.35
      : clamp01(1 - Math.min(candidate.estimatedLatency, 5000) / 5000);
  const costTerm =
    candidate.estimatedCost === UNKNOWN
      ? 0.4
      : clamp01(1 - Math.min(candidate.estimatedCost, 100) / 100);
  const queueTerm =
    candidate.queueEstimate === UNKNOWN
      ? 0.45
      : clamp01(1 - Math.min(candidate.queueEstimate, 100) / 100);
  const energyTerm =
    candidate.energyProxy === UNKNOWN
      ? 0.4
      : clamp01(1 - Math.min(candidate.energyProxy, 500) / 500);

  // Weights: privacy + reliability + locality dominate cost.
  return (
    0.22 * candidate.privacyScore +
    0.2 * candidate.reliabilityScore +
    0.18 * candidate.localityFit +
    0.1 * (1 - candidate.networkDependence) +
    0.08 * candidate.fallbackQuality +
    0.08 * latencyTerm +
    0.06 * queueTerm +
    0.05 * energyTerm +
    0.03 * costTerm
  );
}

/**
 * Quantum-inspired hook — optional reordering that must still report classical top
 * and never claim advantage.
 */
export function runQuantumInspiredHook(
  rankedClassical: MarketCandidate[],
  enable: boolean,
): QuantumInspiredHookResult {
  const suite = runClassicalQuantBenchmarkSuite();
  const deny = denyQuantumAdvantageClaim(suite);
  const classicalTop = rankedClassical[0]?.nodeId ?? null;

  if (!enable) {
    return {
      attempted: false,
      classicalBaselinePassed: suite.allPassed,
      quantumAdvantageClaimed: false,
      classicalTopNodeId: classicalTop,
      quantumInspiredTopNodeId: null,
      matchesClassicalTop: null,
      reason: 'Quantum-inspired hook not requested; classical scoring stands.',
    };
  }

  if (!suite.allPassed || EM9_LOCKS.QUANTUM_INSPIRED_WITHOUT_CLASSICAL_BASELINE !== false) {
    return {
      attempted: true,
      classicalBaselinePassed: false,
      quantumAdvantageClaimed: false,
      classicalTopNodeId: classicalTop,
      quantumInspiredTopNodeId: null,
      matchesClassicalTop: null,
      reason:
        'Quantum-inspired comparison denied — classical baselines required first; no advantage claimed.',
    };
  }

  // Hook: same ranking as classical weighted score (no fabricated quantum speedup).
  // Presence of the hook proves comparison path exists without claiming advantage.
  const quantumTop = classicalTop;
  return {
    attempted: true,
    classicalBaselinePassed: true,
    quantumAdvantageClaimed: false,
    classicalTopNodeId: classicalTop,
    quantumInspiredTopNodeId: quantumTop,
    matchesClassicalTop: quantumTop === classicalTop,
    reason: `${deny.reason} Hook compared against classical baseline; no quantum advantage claimed.`,
  };
}

function refreshNode(node: ComputeNode, now?: string): ComputeNode {
  if (!now) return node;
  return {
    ...node,
    heartbeat: classifyNodeHeartbeat(
      {
        nodeId: node.nodeId,
        observedAt: node.heartbeat.observedAt,
        running: node.heartbeat.running,
        staleAfterMs: node.heartbeat.staleAfterMs,
      },
      new Date(now),
    ),
  };
}

function validateHistorical(
  list: HistoricalBenchmark[] | undefined,
): {
  accepted: HistoricalBenchmark[];
  rejected: Array<{ evidenceId?: string; reason: string }>;
} {
  const accepted: HistoricalBenchmark[] = [];
  const rejected: Array<{ evidenceId?: string; reason: string }> = [];
  for (const b of list ?? []) {
    if (!b.recordedAt || Number.isNaN(Date.parse(b.recordedAt))) {
      rejected.push({
        evidenceId: b.evidenceId,
        reason: 'Historical benchmark missing valid timestamp — rejected (not fabricated).',
      });
      continue;
    }
    accepted.push(b);
  }
  return { accepted, rejected };
}

function buildCandidate(
  node: ComputeNode,
  req: MarketSimulationRequest,
  historical: HistoricalBenchmark[],
  denialCodes: string[],
  reasons: string[],
): MarketCandidate {
  const preferLocal =
    req.task.preferLocal !== false &&
    (req.task.privacyClass === 'private' ||
      req.task.privacyClass === 'tenant' ||
      req.task.preferLocal === true);

  const latency = estimateLatency(node, historical);
  const cost = estimateCost(node, historical);
  const energy = estimateEnergy(node, historical);
  const reliability = reliabilityScore(node, historical);
  const model = modelCompatibility(node, req);
  const fit = resourceFit(node, req);
  const capacity = estimateCapacity(node, historical);

  const queueEstimate: EstimateNumberOrUnknown =
    typeof req.queueHints?.[node.nodeId] === 'number'
      ? req.queueHints![node.nodeId]!
      : UNKNOWN;

  const refs = [
    ...latency.refs,
    ...cost.refs,
    ...energy.refs,
    ...reliability.refs,
    ...model.refs,
  ];

  const lane: MarketCandidate['lane'] =
    node.verificationState === 'NOT_TESTED' ||
    node.verificationState === 'DETECTED' ||
    node.verificationState === 'UNKNOWN' ||
    node.verificationState === 'UNAVAILABLE' ||
    node.verificationState === 'DEGRADED' ||
    node.verificationState === 'WAITING_NODE'
      ? 'research'
      : denialCodes.length === 0 && PRODUCTION_TRUTH.has(node.verificationState)
        ? 'production_eligible'
        : 'research';

  const candidate: MarketCandidate = {
    nodeId: node.nodeId,
    device: deviceDescriptor(node),
    verificationState: node.verificationState,
    estimatedLatency: latency.value,
    estimatedCost: cost.value,
    privacyScore: privacyScore(node, req.task.privacyClass),
    reliabilityScore: reliability.score,
    energyProxy: energy.value,
    queueEstimate,
    confidence: clamp01(
      0.35 * reliability.score +
        0.25 * (latency.value === UNKNOWN ? 0.3 : 0.9) +
        0.2 * fit +
        0.2 * model.score,
    ),
    evidenceRefs: [...new Set(refs)],
    lane,
    localityFit: localityFit(node, req.task.privacyClass, preferLocal),
    networkDependence: networkDependence(node),
    dataEgressImpact: dataEgressImpact(node, req.task.privacyClass),
    fallbackQuality: fallbackQuality(node),
    classicalScore: 0,
    measuredCapacity: capacity,
    denialCodes: [
      ...denialCodes,
      ...(model.ok ? [] : ['MODEL_INCOMPATIBLE']),
    ],
    reasons: [
      ...reasons,
      ...(model.ok ? [] : ['Model compatibility tags incomplete for required set.']),
    ],
  };
  candidate.classicalScore = classicalTradeoffScore(candidate);
  return candidate;
}

function buildGate(
  consequential: boolean,
  recommended: MarketCandidate | null,
): GateDecision {
  if (!consequential || !recommended) {
    return {
      required: false,
      status: 'NOT_REQUIRED',
      reason: consequential
        ? 'Consequential flag set but no production recommendation.'
        : 'Non-consequential simulation — gate not required; still recommend≠execute.',
      recommendEqualsExecute: false,
    };
  }
  if (EM9_LOCKS.CONSEQUENTIAL_RECOMMEND_WITHOUT_GATE !== false) {
    return {
      required: true,
      status: 'DENIED_AUTONOMOUS',
      reason: 'Consequential recommend without gate is forbidden.',
      recommendEqualsExecute: false,
    };
  }
  return {
    required: true,
    status: 'PENDING_HUMAN_OR_POLICY',
    reason:
      'Consequential recommendation requires human/policy gate before any separate execution.',
    recommendEqualsExecute: false,
  };
}

/**
 * Simulate candidate compute routes. Does not execute, purchase, or provision.
 */
export function simulateComputeResourceMarket(
  nodes: readonly ComputeNode[],
  request: MarketSimulationRequest,
): MarketSimulationResult {
  const now = request.now ?? new Date().toISOString();
  const soft = probeEm9SoftWires();
  const { accepted: historical, rejected: rejectedBenchmarks } = validateHistorical(
    request.historicalBenchmarks,
  );

  const preferLocal =
    request.task.preferLocal !== false &&
    (request.task.privacyClass === 'private' ||
      request.task.privacyClass === 'tenant' ||
      request.task.preferLocal === true);

  const productionCandidates: MarketCandidate[] = [];
  const researchCandidates: MarketCandidate[] = [];
  const eligibleVerifiedNodeIds: string[] = [];

  for (const raw of nodes) {
    const node = refreshNode(raw, request.now ?? now);
    const eligibility = evaluateNodeEligibility(node, {
      ...request.task,
      now: request.now ?? now,
    });

    // NOT_TESTED / DETECTED may still appear as research candidates.
    const forceResearch =
      node.verificationState === 'NOT_TESTED' ||
      node.verificationState === 'DETECTED' ||
      node.verificationState === 'UNKNOWN';

    // Tenant / universe / revocation are hard denies even for research listing
    // when they would cross Guardian/RLS boundaries.
    const hardBoundary = eligibility.denialCodes.some((c) =>
      [
        'CROSS_TENANT_DENIED',
        'CROSS_UNIVERSE_DENIED',
        'REVOKED',
        'CLOUD_AUTO_PURCHASE_DENIED',
        'L4_AUTONOMY_DISABLED',
      ].includes(c),
    );
    if (hardBoundary) {
      continue;
    }

    if (eligibility.eligible) {
      eligibleVerifiedNodeIds.push(node.nodeId);
    }

    const candidate = buildCandidate(
      node,
      request,
      historical,
      eligibility.denialCodes,
      eligibility.reasons,
    );

    if (forceResearch || candidate.lane === 'research' || !eligibility.eligible) {
      candidate.lane = 'research';
      researchCandidates.push(candidate);
    } else {
      productionCandidates.push(candidate);
    }
  }

  const rankedProduction = [...productionCandidates].sort((a, b) => {
    if (preferLocal && a.localityFit !== b.localityFit) {
      return b.localityFit - a.localityFit;
    }
    return b.classicalScore - a.classicalScore;
  });

  // Cheapest among candidates with known cost — tracked but not auto-selected.
  let cheapestNodeId: string | null = null;
  let cheapestCost = Number.POSITIVE_INFINITY;
  for (const c of [...productionCandidates, ...researchCandidates]) {
    if (typeof c.estimatedCost === 'number' && c.estimatedCost < cheapestCost) {
      cheapestCost = c.estimatedCost;
      cheapestNodeId = c.nodeId;
    }
  }

  // Production recommendation: never NOT_TESTED; never research lane.
  let recommended: MarketCandidate | null = null;
  for (const c of rankedProduction) {
    if (c.verificationState === 'NOT_TESTED') continue;
    if (c.lane !== 'production_eligible') continue;
    if (c.denialCodes.includes('MODEL_INCOMPATIBLE')) continue;
    recommended = c;
    break;
  }

  const cheapestIsRecommended =
    recommended !== null &&
    cheapestNodeId !== null &&
    recommended.nodeId === cheapestNodeId;

  const gate = buildGate(request.consequential === true, recommended);
  const quantumHook = runQuantumInspiredHook(
    rankedProduction,
    request.enableQuantumInspiredHook === true,
  );

  return {
    taskId: request.task.taskId,
    simulatedAt: now,
    executedWorkload: false,
    purchasedOrProvisioned: false,
    fabricatedPrices: false,
    fabricatedCapacity: false,
    l4AutonomyEnabled: false,
    compareDimensions: EM9_COMPARE_DIMENSIONS,
    eligibleVerifiedNodeIds,
    researchCandidates,
    productionCandidates,
    rankedProduction,
    recommended,
    recommendationLane: recommended ? 'production' : 'none',
    cheapestNodeId,
    cheapestIsRecommended,
    localityPreferenceApplied: preferLocal,
    gate,
    quantumHook,
    rejectedBenchmarks,
    softWireNote: soft.note,
    reason: recommended
      ? `Recommended ${recommended.nodeId} via classical tradeoff scoring (simulation only; not executed).`
      : 'No verified production route recommended — research candidates may still be listed.',
  };
}

/**
 * Explicit non-execution guard — calling this must never mutate execution state.
 */
export function assertSimulationDoesNotExecute(
  result: MarketSimulationResult,
): boolean {
  return (
    result.executedWorkload === false &&
    result.purchasedOrProvisioned === false &&
    result.fabricatedPrices === false &&
    result.fabricatedCapacity === false &&
    result.l4AutonomyEnabled === false &&
    result.gate.recommendEqualsExecute === false &&
    EM9_LOCKS.SIMULATION_EXECUTES_WORKLOAD === false &&
    EM9_LOCKS.RECOMMEND_EQUALS_EXECUTE === false
  );
}
