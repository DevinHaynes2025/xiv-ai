/**
 * 62L-EW9 — Resource policy bridge (shared fabric soft-wire).
 *
 * Soft-wires / reuses local-runtime + EW7 resource-governor when PRESENT.
 * Does NOT duplicate competing governor logic — thin EW9-facing policy only.
 * Results: ALLOW | QUEUE | THROTTLE | FALLBACK | DENY.
 * Never bypasses OS/hardware safety or disables thermal protections.
 */

import type { GovernorResult } from './ew9-types.ts';
import {
  EW9_LOCKS,
  ew9SoftWireSnapshot,
  softWireHopState,
} from './ew9-types.ts';
import type { ComputeRequestEnvelope } from './intel-envelope.ts';

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
  governorSoftWired: boolean;
};

export type ResourcePolicyDecision = {
  result: GovernorResult;
  reasons: string[];
  thermalProtectionsDisabled: false;
  osHardwareSafetyBypassed: false;
  governorSoftWire: 'PASS' | 'WAITING_DATA';
  fallbackSuggested: boolean;
};

export type ResourcePolicyInput = {
  envelope: ComputeRequestEnvelope;
  pressure: ResourcePressureSnapshot;
  repoRoot?: string;
};

export function evaluateResourcePolicy(
  input: ResourcePolicyInput,
): ResourcePolicyDecision {
  const soft = ew9SoftWireSnapshot(input.repoRoot);
  const governorSoftWire = softWireHopState(
    soft.localRuntimeGovernor.present || soft.ew7ResourcePolicy.present,
  );
  const reasons: string[] = [];
  let result: GovernorResult = 'ALLOW';
  let fallbackSuggested = false;

  if (EW9_LOCKS.MAY_DISABLE_THERMAL_PROTECTIONS !== false) {
    return {
      result: 'DENY',
      reasons: ['LOCK_VIOLATION_THERMAL_PROTECTIONS'],
      thermalProtectionsDisabled: false,
      osHardwareSafetyBypassed: false,
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
      osHardwareSafetyBypassed: false,
      governorSoftWire,
      fallbackSuggested: false,
    };
  }

  if (pressure.thermalPressure === 'ELEVATED') {
    reasons.push('THERMAL_ELEVATED — THROTTLE (protections remain enabled).');
    result = 'THROTTLE';
  }

  if (envelope.memoryRequirementMb > pressure.ramMbAvailable) {
    reasons.push(
      `RAM ${envelope.memoryRequirementMb}MB exceeds available ${pressure.ramMbAvailable}MB.`,
    );
    result = 'DENY';
  }

  if (
    envelope.preferredDevice === 'INTEL_GPU' &&
    pressure.gpuMemoryMbAvailable !== null &&
    envelope.memoryRequirementMb > pressure.gpuMemoryMbAvailable
  ) {
    reasons.push('GPU_MEMORY_INSUFFICIENT — FALLBACK suggested.');
    result = result === 'DENY' ? 'DENY' : 'FALLBACK';
    fallbackSuggested = true;
  }

  if (
    envelope.preferredDevice === 'INTEL_NPU' &&
    pressure.npuMemoryMbAvailable !== null &&
    envelope.memoryRequirementMb > pressure.npuMemoryMbAvailable
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
    reasons.push(
      'NETWORK_UNAVAILABLE for cloud-required — DENY/WAITING_DATA path.',
    );
    result = 'DENY';
  }

  if (envelope.maxRuntimeMs <= 0) {
    reasons.push('TIMEOUT_CEILING_INVALID — DENY.');
    result = 'DENY';
  }

  if (reasons.length === 0) {
    reasons.push('Resource policy ALLOW.');
  }

  if (soft.localRuntimeGovernor.present || soft.ew7ResourcePolicy.present) {
    reasons.push(
      'Soft-wire shared governor/resource-policy PRESENT (reuse, not duplicate).',
    );
  } else {
    reasons.push(
      'Soft-wire shared governor WAITING_DATA — thin EW9 bridge only (not a competing governor).',
    );
  }

  return {
    result,
    reasons,
    thermalProtectionsDisabled: false,
    osHardwareSafetyBypassed: false,
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
