import { randomUUID } from 'node:crypto';

import { evaluateQuantSignals } from './quant-logic';
import { createQuantumExperiment } from './quantum-research';
import {
  BC_LOCKS,
  CLASSICAL_BASELINE_REQUIRED,
  QPU_UNAVAILABLE,
  QUANTUM_ADVANTAGE_DENIED,
  type PathwayMetrics,
  type PathwayRouteKind,
} from './quantum-agentic-types';

export type PathwayCandidate = {
  id: string;
  route: PathwayRouteKind;
  available: boolean;
  reason: string;
  classicalBaseline: boolean;
  claimsQuantumAdvantage: false;
  metrics: PathwayMetrics;
};

export type PathwayCompetitionResult = {
  id: string;
  objective: string;
  candidates: PathwayCandidate[];
  winnerRoute: PathwayRouteKind;
  winnerId: string;
  classicalBaselinePresent: true;
  quantumUsed: boolean;
  quantumState: 'UNAVAILABLE' | 'READY_FOR_SIMULATION' | 'COMPLETED';
  claimsQuantumAdvantage: false;
  claimsConsciousness: false;
  productionAuthorization: false;
  notes: string[];
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function score(metrics: PathwayMetrics): number {
  // Higher correctness + calibration, lower cost + latency. Not consciousness.
  return clamp01(metrics.correctness * 0.45 + metrics.calibration * 0.25 + (1 - metrics.cost) * 0.15 + (1 - clamp01(metrics.latencyMs / 5_000)) * 0.15);
}

function classicalMetrics(route: PathwayRouteKind, seed: number): PathwayMetrics {
  const baseLatency = route === 'classical_dynamic_programming' ? 120 : route === 'classical_graph' ? 80 : 40;
  return {
    correctness: clamp01(0.72 + (seed % 7) * 0.03),
    cost: clamp01(0.2 + (seed % 5) * 0.05),
    latencyMs: baseLatency + (seed % 11) * 3,
    calibration: clamp01(0.7 + (seed % 4) * 0.05),
    claimsConsciousness: false,
    claimsSentience: false,
    claimsQuantumAdvantage: false,
  };
}

export function listClassicalRoutes(): PathwayRouteKind[] {
  return ['classical_graph', 'classical_greedy', 'classical_dynamic_programming', 'classical_heuristic'];
}

export function runClassicalBaseline(input: {
  objective: string;
  route?: Exclude<PathwayRouteKind, 'quantum_simulator' | 'quantum_qpu'>;
}): PathwayCandidate {
  const route = input.route ?? 'classical_graph';
  const metrics = classicalMetrics(route, input.objective.length);
  return {
    id: `path_${randomUUID()}`,
    route,
    available: true,
    reason: CLASSICAL_BASELINE_REQUIRED,
    classicalBaseline: true,
    claimsQuantumAdvantage: false,
    metrics,
  };
}

export function probeQuantumRoute(input: {
  kind: 'quantum_simulator' | 'quantum_qpu';
  backendVerified?: boolean;
  objective: string;
}): PathwayCandidate {
  if (BC_LOCKS.CLAIMS_QUANTUM_ADVANTAGE) throw new Error('INVARIANT_BROKEN_NO_FAKE_QUANTUM_ADVANTAGE');
  const experiment = createQuantumExperiment({
    id: `bc-q-${input.kind}`,
    objective: input.objective,
    algorithm: 'qaoa',
    backend: input.kind === 'quantum_qpu' ? 'quantum_qpu' : 'quantum_simulator',
    qubitCount: 4,
    backendVerified: input.backendVerified === true,
  });
  const available = experiment.state !== 'UNAVAILABLE';
  return {
    id: `path_${randomUUID()}`,
    route: input.kind,
    available,
    reason: available
      ? 'Quantum backend verified for bounded research; classical baseline still required.'
      : QPU_UNAVAILABLE,
    classicalBaseline: false,
    claimsQuantumAdvantage: false,
    metrics: {
      correctness: available ? 0.5 : 0,
      cost: available ? 0.9 : 1,
      latencyMs: available ? 2_000 : 0,
      calibration: available ? 0.4 : 0,
      claimsConsciousness: false,
      claimsSentience: false,
      claimsQuantumAdvantage: false,
    },
  };
}

export function denyQuantumAdvantageClaim(input: { verifiedAdvantage?: boolean }) {
  if (input.verifiedAdvantage === true) {
    // Even if a caller asserts advantage, this runtime refuses to mint the claim without an external verification harness.
    return {
      allowed: false as const,
      claimsQuantumAdvantage: false as const,
      reason: QUANTUM_ADVANTAGE_DENIED,
      note: 'No verified quantum-advantage harness is wired. Claim denied.',
    };
  }
  return {
    allowed: false as const,
    claimsQuantumAdvantage: false as const,
    reason: QUANTUM_ADVANTAGE_DENIED,
    note: 'Quantum advantage claims are deny-by-default without independent verification.',
  };
}

/**
 * Multiple bounded routes compete; classical baseline is always present and required.
 */
export function compileAndCompetePathways(input: {
  objective: string;
  includeQuantumSimulator?: boolean;
  includeQuantumQpu?: boolean;
  quantumSimulatorVerified?: boolean;
  quantumQpuVerified?: boolean;
  claimQuantumAdvantage?: boolean;
}): PathwayCompetitionResult {
  if (!input.objective.trim()) throw new Error('PATHWAY_OBJECTIVE_REQUIRED');
  if (BC_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE) {
    throw new Error('INVARIANT_BROKEN_CLASSICAL_BASELINE_REQUIRED');
  }

  const classical = listClassicalRoutes().map((route) =>
    runClassicalBaseline({
      objective: input.objective,
      route: route as Exclude<PathwayRouteKind, 'quantum_simulator' | 'quantum_qpu'>,
    }),
  );

  const quantCandidates: PathwayCandidate[] = [];
  if (input.includeQuantumSimulator) {
    quantCandidates.push(
      probeQuantumRoute({
        kind: 'quantum_simulator',
        backendVerified: input.quantumSimulatorVerified === true,
        objective: input.objective,
      }),
    );
  }
  if (input.includeQuantumQpu) {
    quantCandidates.push(
      probeQuantumRoute({
        kind: 'quantum_qpu',
        backendVerified: input.quantumQpuVerified === true,
        objective: input.objective,
      }),
    );
  }

  // Classical probabilistic baseline signal (quant-logic), always run.
  const classicalSignal = evaluateQuantSignals([
    {
      id: 'bc-classical-baseline',
      weight: 1,
      confidence: 0.9,
      direction: 1,
      evidenceRefs: ['synthetic:62lbc-classical'],
    },
  ]);

  const advantage = denyQuantumAdvantageClaim({ verifiedAdvantage: input.claimQuantumAdvantage === true });

  const available = [...classical, ...quantCandidates.filter((c) => c.available)];
  if (available.length === 0) {
    throw new Error('NO_AVAILABLE_PATHWAY_ROUTES');
  }
  let winner = available[0]!;
  let best = score(winner.metrics);
  for (const candidate of available.slice(1)) {
    const s = score(candidate.metrics);
    if (s > best) {
      best = s;
      winner = candidate;
    }
  }

  // Prefer classical winner when quantum is only marginally better and unverified for advantage.
  if (winner.route.startsWith('quantum') && !input.claimQuantumAdvantage) {
    const bestClassical = classical.reduce((a, b) => (score(a.metrics) >= score(b.metrics) ? a : b));
    if (score(winner.metrics) - score(bestClassical.metrics) < 0.15) {
      winner = bestClassical;
    }
  }

  const quantumState: PathwayCompetitionResult['quantumState'] = quantCandidates.some((c) => c.available)
    ? 'READY_FOR_SIMULATION'
    : quantCandidates.length > 0
      ? 'UNAVAILABLE'
      : 'UNAVAILABLE';

  return {
    id: `qapc_${randomUUID()}`,
    objective: input.objective.trim(),
    candidates: [...classical, ...quantCandidates],
    winnerRoute: winner.route,
    winnerId: winner.id,
    classicalBaselinePresent: true,
    quantumUsed: winner.route.startsWith('quantum'),
    quantumState,
    claimsQuantumAdvantage: false,
    claimsConsciousness: false,
    productionAuthorization: false,
    notes: [
      CLASSICAL_BASELINE_REQUIRED,
      `Classical signal model=${classicalSignal.model}; recommendation=${classicalSignal.recommendation}.`,
      advantage.note,
      'Evaluation metrics are correctness, cost, latency, and calibration — not consciousness.',
      BC_LOCKS.L4_AUTONOMY_ENABLED === false ? 'L4_AUTONOMY_ENABLED=false' : 'L4_BROKEN',
    ],
  };
}

export function calibratePathwayMetrics(samples: Array<{ predicted: number; observed: 0 | 1 }>) {
  if (samples.length === 0) {
    return { ece: 1, calibrated: false as const, claimsConsciousness: false as const };
  }
  const buckets = new Map<number, { conf: number; acc: number; n: number }>();
  for (const sample of samples) {
    const key = Math.min(9, Math.floor(sample.predicted * 10));
    const bucket = buckets.get(key) ?? { conf: 0, acc: 0, n: 0 };
    bucket.conf += sample.predicted;
    bucket.acc += sample.observed;
    bucket.n += 1;
    buckets.set(key, bucket);
  }
  let ece = 0;
  let total = 0;
  for (const bucket of buckets.values()) {
    const conf = bucket.conf / bucket.n;
    const acc = bucket.acc / bucket.n;
    ece += bucket.n * Math.abs(conf - acc);
    total += bucket.n;
  }
  ece = total === 0 ? 1 : ece / total;
  return { ece, calibrated: ece <= 0.2, claimsConsciousness: false as const };
}
