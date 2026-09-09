/**
 * 62L-EW7 — Resource policy bridge.
 *
 * Soft-wires / reuses local-runtime resource-governor when PRESENT.
 * Does NOT duplicate competing governor logic — thin EW7-facing policy only.
 *
 * Checks: RAM, GPU/NPU memory (if measurable), concurrency, queue, battery,
 * thermal pressure, timeout, storage, network.
 * Results: ALLOW | QUEUE | THROTTLE | FALLBACK | DENY.
 * Never disables thermal protections.
 */

import type { GovernorResult } from './ew7-types.ts';
import {
  EW7_LOCKS,
  ew7SoftWireSnapshot,
  softWireHopState,
} from './ew7-types.ts';
import type { ComputeRequestEnvelope } from './compute-envelope.ts';

export type ResourcePressureSnapshot = {
  ramMbAvailable: number;
  gpuMemoryMbAvailable: number | null;
  npuMemoryMbAvailable: number | null;
  concurrencyInFlight: number;
  maxConcurrency: number;
  queueDepth: number;
  maxQueueDepth: number;
  batteryPercent: number | null;
  thermalPressure: 'NONE' | 'ELEVATED' | 'CRITICAL' | 'UNKNOWN';
  storageMbAvailable: number;
  networkAvailable: boolean;
  /** Soft-wire: true when resource-governor module was found. */
  governorSoftWired: boolean;
};

export type ResourcePolicyDecision = {
  result: GovernorResult;
  reasons: string[];
  thermalProtectionsDisabled: false;
  governorSoftWire: 'PASS' | 'WAITING_DATA';
  fallbackSuggested: boolean;
};

export type ResourcePolicyInput = {
  envelope: ComputeRequestEnvelope;
  pressure: ResourcePressureSnapshot;
  repoRoot?: string;
};

/**
 * Evaluate resource policy for an AMD adapter request.
 * When resource-governor is soft-wired PRESENT, note reuse; policy math stays
 * local so EW7 does not import/duplicate the EL9 module graph on xiv-v2 tip.
 */
export function evaluateResourcePolicy(
  input: ResourcePolicyInput,
): ResourcePolicyDecision {
  const soft = ew7SoftWireSnapshot(input.repoRoot);
  const governorSoftWire = softWireHopState(soft.resourceGovernor.present);
  const reasons: string[] = [];
  let result: GovernorResult = 'ALLOW';
  let fallbackSuggested = false;

  // Hard lock: never disable thermal protections.
  if (EW7_LOCKS.MAY_DISABLE_THERMAL_PROTECTIONS !== false) {
    return {
      result: 'DENY',
      reasons: ['LOCK_VIOLATION_THERMAL_PROTECTIONS'],
      thermalProtectionsDisabled: false,
      governorSoftWire,
      fallbackSuggested: false,
    };
  }

  const { envelope, pressure } = input;

  if (pressure.thermalPressure === 'CRITICAL') {
    reasons.push('THERMAL_CRITICAL — DENY (protections remain enabled).');
    return {
      result: 'DENY',
      reasons,
      thermalProtectionsDisabled: false,
      governorSoftWire,
      fallbackSuggested: false,
    };
  }

  if (pressure.thermalPressure === 'ELEVATED') {
    reasons.push('THERMAL_ELEVATED — THROTTLE (protections remain enabled).');
    result = 'THROTTLE';
  }

  if (envelope.maxMemoryMb > pressure.ramMbAvailable) {
    reasons.push(
      `RAM ${envelope.maxMemoryMb}MB exceeds available ${pressure.ramMbAvailable}MB.`,
    );
    result = 'DENY';
  }

  if (
    envelope.preferredDevice === 'AMD_GPU' &&
    pressure.gpuMemoryMbAvailable !== null &&
    envelope.maxMemoryMb > pressure.gpuMemoryMbAvailable
  ) {
    reasons.push('GPU_MEMORY_INSUFFICIENT — FALLBACK suggested.');
    result = result === 'DENY' ? 'DENY' : 'FALLBACK';
    fallbackSuggested = true;
  }

  if (
    envelope.preferredDevice === 'AMD_NPU' &&
    pressure.npuMemoryMbAvailable !== null &&
    envelope.maxMemoryMb > pressure.npuMemoryMbAvailable
  ) {
    reasons.push('NPU_MEMORY_INSUFFICIENT — FALLBACK suggested.');
    result = result === 'DENY' ? 'DENY' : 'FALLBACK';
    fallbackSuggested = true;
  }

  if (pressure.concurrencyInFlight >= pressure.maxConcurrency) {
    if (pressure.queueDepth < pressure.maxQueueDepth) {
      reasons.push('CONCURRENCY_SATURATED — QUEUE.');
      if (result === 'ALLOW' || result === 'THROTTLE') result = 'QUEUE';
    } else {
      reasons.push('QUEUE_FULL — DENY.');
      result = 'DENY';
    }
  }

  if (pressure.batteryPercent !== null && pressure.batteryPercent < 10) {
    reasons.push('BATTERY_CRITICAL — THROTTLE or FALLBACK.');
    if (result === 'ALLOW') result = 'THROTTLE';
    fallbackSuggested = true;
  }

  if (pressure.storageMbAvailable < 64) {
    reasons.push('STORAGE_LOW — DENY.');
    result = 'DENY';
  }

  if (envelope.cloudRequired && !pressure.networkAvailable) {
    reasons.push('NETWORK_UNAVAILABLE for cloud-required — DENY/WAITING_DATA path.');
    result = 'DENY';
  }

  if (envelope.maxRuntimeMs <= 0) {
    reasons.push('TIMEOUT_CEILING_INVALID — DENY.');
    result = 'DENY';
  }

  if (reasons.length === 0) {
    reasons.push('Resource policy ALLOW.');
  }

  if (soft.resourceGovernor.present) {
    reasons.push(
      `Soft-wire resource-governor PRESENT at ${soft.resourceGovernor.pathChecked} (reuse, not duplicate).`,
    );
  } else {
    reasons.push(
      'Soft-wire resource-governor WAITING_DATA — thin EW7 bridge only (not a competing governor).',
    );
  }

  return {
    result,
    reasons,
    thermalProtectionsDisabled: false,
    governorSoftWire,
    fallbackSuggested,
  };
}

export function defaultPressureForTests(
  overrides?: Partial<ResourcePressureSnapshot>,
): ResourcePressureSnapshot {
  return {
    ramMbAvailable: 8192,
    gpuMemoryMbAvailable: null,
    npuMemoryMbAvailable: null,
    concurrencyInFlight: 0,
    maxConcurrency: 4,
    queueDepth: 0,
    maxQueueDepth: 16,
    batteryPercent: 100,
    thermalPressure: 'NONE',
    storageMbAvailable: 10_000,
    networkAvailable: true,
    governorSoftWired: false,
    ...overrides,
  };
}
