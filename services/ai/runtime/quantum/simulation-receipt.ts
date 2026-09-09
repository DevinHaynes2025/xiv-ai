/**
 * 62L-EX4 — Simulation execution receipts + EX2 baseline link + consensus.
 *
 * classification = SIMULATED_QUANTUM always for local sims.
 * Never PHYSICAL_QPU_VERIFIED.
 * A vs B disagreement → REVIEW_REQUIRED (no silent average).
 * Retain seed/shots/circuitHash/versions/device/precision/noise.
 */

import { createHash } from 'node:crypto';

import type { SimulationOutcome } from './simulation.ts';
import type {
  ConsensusState,
  ExecutionClass,
  ReproducibilityState,
  SimulationRequest,
} from './types.ts';
import { EX4_LOCKS } from './types.ts';

export type SimulationReceipt = {
  receiptId: string;
  requestId: string;
  missionId: string;
  taskId: string;
  agentId: string;
  tenantId: string;
  universeId: string;
  classification: 'SIMULATED_QUANTUM';
  /** Always false for EX4 local sims — never PHYSICAL_QPU_VERIFIED. */
  physicalQpuVerified: false;
  simulatorId: string;
  simulatorVersion: string;
  requestedDevice: string;
  actualDevice: string;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  seed: number;
  shots: number;
  circuitHash: string;
  precision: string;
  noiseModel: string | null;
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  outputHash: string;
  runtimeMs: number;
  memoryPeakMb: number;
  classicalBaselineId: string | null;
  reproducibilityState: ReproducibilityState;
  evidenceRefs: readonly string[];
  limitations: readonly string[];
  createdAt: string;
  returnPath: string;
  fabricated: false;
  quantumAdvantageClaimed: false;
  l4Enabled: false;
  hiddenCotPersisted: false;
  guardianRlsUnchanged: true;
};

export type ReceiptCreateResult =
  | { ok: true; receipt: SimulationReceipt }
  | { ok: false; reason: string };

export type ConsensusResult = {
  consensusState: ConsensusState;
  reasons: readonly string[];
  averaged: false;
  receiptAId: string;
  receiptBId: string;
};

export type ReproCompareResult = {
  reproducibilityState: ReproducibilityState;
  withinTolerance: boolean;
  maxProbDelta: number;
  reasons: readonly string[];
};

export function createSimulationReceipt(input: {
  receiptId: string;
  request: SimulationRequest;
  outcome: Extract<SimulationOutcome, { ok: true }>;
  classicalBaselineId?: string | null;
  evidenceRefs?: readonly string[];
  limitations?: readonly string[];
  returnPath?: string;
}): ReceiptCreateResult {
  if (input.outcome.classification !== 'SIMULATED_QUANTUM') {
    return { ok: false, reason: 'EX4_RECEIPT_REQUIRES_SIMULATED_QUANTUM' };
  }
  if ((input.outcome as { classification: ExecutionClass }).classification === 'PHYSICAL_QPU_VERIFIED') {
    return { ok: false, reason: 'PHYSICAL_QPU_VERIFIED_FORBIDDEN_IN_EX4' };
  }
  if (
    input.outcome.fallbackUsed &&
    input.outcome.requestedDevice !== input.outcome.actualDevice &&
    !input.outcome.fallbackReason
  ) {
    return { ok: false, reason: 'SILENT_FALLBACK_FORBIDDEN' };
  }

  const receipt: SimulationReceipt = {
    receiptId: input.receiptId,
    requestId: input.request.requestId,
    missionId: input.request.missionId,
    taskId: input.request.taskId,
    agentId: input.request.agentId,
    tenantId: input.request.tenantId,
    universeId: input.request.universeId,
    classification: 'SIMULATED_QUANTUM',
    physicalQpuVerified: false,
    simulatorId: input.outcome.simulatorId,
    simulatorVersion: input.outcome.simulatorVersion,
    requestedDevice: input.outcome.requestedDevice,
    actualDevice: input.outcome.actualDevice,
    fallbackUsed: input.outcome.fallbackUsed,
    fallbackReason: input.outcome.fallbackReason,
    seed: input.outcome.seed,
    shots: input.outcome.shots,
    circuitHash: input.outcome.circuitHash,
    precision: input.outcome.precision,
    noiseModel: input.outcome.noiseModel,
    counts: { ...input.outcome.counts },
    probabilities: { ...input.outcome.probabilities },
    outputHash: input.outcome.outputHash,
    runtimeMs: input.outcome.runtimeMs,
    memoryPeakMb: input.outcome.memoryPeakMb,
    classicalBaselineId:
      input.classicalBaselineId ?? input.request.classicalBaselineId,
    reproducibilityState: 'UNTESTED',
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    limitations: [
      'SIMULATED_QUANTUM_ONLY',
      'NOT_PHYSICAL_QPU',
      'NO_QUANTUM_ADVANTAGE_CLAIM',
      ...(input.limitations ?? []),
    ],
    createdAt: new Date().toISOString(),
    returnPath: input.returnPath ?? 'XIV_HOME_BASE',
    fabricated: false,
    quantumAdvantageClaimed: false,
    l4Enabled: false,
    hiddenCotPersisted: false,
    guardianRlsUnchanged: true,
  };

  void EX4_LOCKS;
  return { ok: true, receipt };
}

/**
 * Compare two simulator receipts under EX2-style rules.
 * Disagreement → REVIEW_REQUIRED. Never silent average.
 */
export function compareSimulatorConsensus(
  a: SimulationReceipt,
  b: SimulationReceipt,
  tolerance = 1e-6,
): ConsensusResult {
  if (EX4_LOCKS.SILENT_SIMULATOR_AVERAGE) {
    return {
      consensusState: 'REVIEW_REQUIRED',
      reasons: ['SILENT_AVERAGE_LOCK_VIOLATION'],
      averaged: false,
      receiptAId: a.receiptId,
      receiptBId: b.receiptId,
    };
  }

  if (a.tenantId !== b.tenantId) {
    return {
      consensusState: 'REVIEW_REQUIRED',
      reasons: ['CROSS_TENANT_COMPARE_DENIED'],
      averaged: false,
      receiptAId: a.receiptId,
      receiptBId: b.receiptId,
    };
  }
  if (a.universeId !== b.universeId) {
    return {
      consensusState: 'REVIEW_REQUIRED',
      reasons: ['CROSS_UNIVERSE_COMPARE_DENIED'],
      averaged: false,
      receiptAId: a.receiptId,
      receiptBId: b.receiptId,
    };
  }

  if (a.circuitHash !== b.circuitHash || a.seed !== b.seed || a.shots !== b.shots) {
    return {
      consensusState: 'INSUFFICIENT_EVIDENCE',
      reasons: ['NON_EQUIVALENT_INPUT_SEED_OR_SHOTS'],
      averaged: false,
      receiptAId: a.receiptId,
      receiptBId: b.receiptId,
    };
  }

  const keys = new Set([
    ...Object.keys(a.probabilities),
    ...Object.keys(b.probabilities),
  ]);
  let maxDelta = 0;
  for (const k of keys) {
    const da = a.probabilities[k] ?? 0;
    const db = b.probabilities[k] ?? 0;
    maxDelta = Math.max(maxDelta, Math.abs(da - db));
  }

  if (maxDelta > tolerance) {
    return {
      consensusState: 'REVIEW_REQUIRED',
      reasons: [
        `SIMULATOR_DISAGREEMENT maxProbDelta=${maxDelta} > tolerance=${tolerance}`,
        'NO_SILENT_AVERAGE',
      ],
      averaged: false,
      receiptAId: a.receiptId,
      receiptBId: b.receiptId,
    };
  }

  return {
    consensusState: 'AGREE',
    reasons: ['WITHIN_TOLERANCE'],
    averaged: false,
    receiptAId: a.receiptId,
    receiptBId: b.receiptId,
  };
}

/** Same circuit/seed reproducibility check within tolerance. */
export function evaluateReproducibility(
  a: SimulationReceipt,
  b: SimulationReceipt,
  tolerance = 1e-9,
): ReproCompareResult {
  if (
    a.circuitHash !== b.circuitHash ||
    a.seed !== b.seed ||
    a.shots !== b.shots ||
    a.simulatorId !== b.simulatorId ||
    a.precision !== b.precision
  ) {
    return {
      reproducibilityState: 'UNTESTED',
      withinTolerance: false,
      maxProbDelta: Number.POSITIVE_INFINITY,
      reasons: ['REPRO_REQUIRES_SAME_CIRCUIT_SEED_SHOTS_SIMULATOR_PRECISION'],
    };
  }

  const keys = new Set([
    ...Object.keys(a.probabilities),
    ...Object.keys(b.probabilities),
  ]);
  let maxDelta = 0;
  for (const k of keys) {
    maxDelta = Math.max(
      maxDelta,
      Math.abs((a.probabilities[k] ?? 0) - (b.probabilities[k] ?? 0)),
    );
  }

  if (maxDelta <= tolerance && a.outputHash === b.outputHash) {
    return {
      reproducibilityState: 'REPRODUCIBLE',
      withinTolerance: true,
      maxProbDelta: maxDelta,
      reasons: ['MATCH_WITHIN_TOLERANCE'],
    };
  }
  if (maxDelta <= tolerance * 1000) {
    return {
      reproducibilityState: 'PARTIALLY_REPRODUCIBLE',
      withinTolerance: false,
      maxProbDelta: maxDelta,
      reasons: ['PARTIAL_MATCH'],
    };
  }
  return {
    reproducibilityState: 'NON_REPRODUCIBLE',
    withinTolerance: false,
    maxProbDelta: maxDelta,
    reasons: ['DIVERGED'],
  };
}

export function receiptFingerprint(receipt: SimulationReceipt): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        circuitHash: receipt.circuitHash,
        seed: receipt.seed,
        shots: receipt.shots,
        simulatorId: receipt.simulatorId,
        simulatorVersion: receipt.simulatorVersion,
        actualDevice: receipt.actualDevice,
        precision: receipt.precision,
        noiseModel: receipt.noiseModel,
        outputHash: receipt.outputHash,
      }),
    )
    .digest('hex');
}

/** Strengthen neural pathway weight only from reproducible evidence. */
export function neuralPathwayWeightFromReceipt(
  receipt: SimulationReceipt,
  repro: ReproducibilityState,
): { strengthen: boolean; weightDelta: number; reason: string } {
  if (repro !== 'REPRODUCIBLE') {
    return {
      strengthen: false,
      weightDelta: 0,
      reason: 'PATHWAY_STRENGTHEN_REQUIRES_REPRODUCIBLE_EVIDENCE',
    };
  }
  if (receipt.classification !== 'SIMULATED_QUANTUM') {
    return {
      strengthen: false,
      weightDelta: 0,
      reason: 'INVALID_CLASSIFICATION',
    };
  }
  return {
    strengthen: true,
    weightDelta: 0.01,
    reason: 'REPRODUCIBLE_SIMULATED_QUANTUM_EVIDENCE',
  };
}

/**
 * Software wormhole check — never bypass auth/Guardian/RLS/tenant/Universe.
 */
export function evaluateWormhole(input: {
  bypassAuth?: boolean;
  bypassGuardian?: boolean;
  bypassRls?: boolean;
  crossTenant?: boolean;
  crossUniverse?: boolean;
}): { allowed: false; reason: string } {
  if (input.bypassAuth || input.bypassGuardian || input.bypassRls) {
    return { allowed: false, reason: 'WORMHOLE_BYPASS_DENIED' };
  }
  if (input.crossTenant) {
    return { allowed: false, reason: 'WORMHOLE_CROSS_TENANT_DENIED' };
  }
  if (input.crossUniverse) {
    return { allowed: false, reason: 'WORMHOLE_CROSS_UNIVERSE_DENIED' };
  }
  return { allowed: false, reason: 'WORMHOLE_NO_BYPASS_ALWAYS_SCOPED' };
}
