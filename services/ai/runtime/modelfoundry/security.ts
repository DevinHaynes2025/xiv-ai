/**
 * Model Security controls — defense contracts, not attack tooling.
 */

import { MODEL_SECURITY_CONTROLS, type ModelSecurityControl } from './types';
import type { ModelRecord } from './registry';
import { quarantineModel } from './registry';

export type ModelSecurityFabric = {
  controls: readonly ModelSecurityControl[];
  bypassable: false;
  l4Enabled: false;
};

export function openModelSecurity(): ModelSecurityFabric {
  return {
    controls: MODEL_SECURITY_CONTROLS,
    bypassable: false,
    l4Enabled: false,
  };
}

export function listModelSecurityControls(): readonly ModelSecurityControl[] {
  return MODEL_SECURITY_CONTROLS;
}

export function detectPromptInjection(input: { text: string; suspicious?: boolean }) {
  if (input.suspicious === true || /ignore (all|previous) instructions/i.test(input.text)) {
    return { detected: true as const, blocked: true as const, control: 'PROMPT_INJECTION_DEFENSE' as const };
  }
  return { detected: false as const, blocked: false as const, control: 'PROMPT_INJECTION_DEFENSE' as const };
}

export function validateToolOutput(input: { output: unknown; schemaValid: boolean }) {
  if (!input.schemaValid) {
    return { valid: false as const, control: 'TOOL_OUTPUT_VALIDATION' as const };
  }
  return { valid: true as const, control: 'TOOL_OUTPUT_VALIDATION' as const };
}

export function detectModelDrift(input: { baselineScore: number; currentScore: number; threshold: number }) {
  const drifted = input.currentScore < input.baselineScore - input.threshold;
  return {
    detected: drifted,
    control: 'MODEL_DRIFT_DETECTOR' as const,
  };
}

export function detectModelPoisoning(input: { integrityHashMatches: boolean }) {
  return {
    detected: !input.integrityHashMatches,
    control: 'MODEL_POISONING_DETECTOR' as const,
  };
}

export function assertTrainingDataIntegrity(input: { provenanceComplete: boolean; tampered?: boolean }) {
  if (!input.provenanceComplete || input.tampered === true) {
    return { ok: false as const, control: 'TRAINING_DATA_INTEGRITY' as const };
  }
  return { ok: true as const, control: 'TRAINING_DATA_INTEGRITY' as const };
}

export function evalRegressionGate(input: { prior: number; current: number; maxDrop: number }) {
  if (input.current < input.prior - input.maxDrop) {
    return { passed: false as const, control: 'EVAL_REGRESSION_GATE' as const };
  }
  return { passed: true as const, control: 'EVAL_REGRESSION_GATE' as const };
}

export function detectSensitiveDataLeak(input: { containsSecret?: boolean; containsPii?: boolean }) {
  if (input.containsSecret || input.containsPii) {
    return { detected: true as const, blocked: true as const, control: 'SENSITIVE_DATA_LEAK_DETECTOR' as const };
  }
  return { detected: false as const, blocked: false as const, control: 'SENSITIVE_DATA_LEAK_DETECTOR' as const };
}

export function detectCrossTenantLeak(input: {
  modelTenantId: string;
  dataTenantId: string;
}) {
  if (input.modelTenantId !== input.dataTenantId) {
    return { detected: true as const, blocked: true as const, control: 'CROSS_TENANT_LEAK_DETECTOR' as const };
  }
  return { detected: false as const, blocked: false as const, control: 'CROSS_TENANT_LEAK_DETECTOR' as const };
}

export function detectUnsafeToolCall(input: { unsafe: boolean }) {
  if (input.unsafe) {
    return { detected: true as const, blocked: true as const, control: 'UNSAFE_TOOL_CALL_DETECTOR' as const };
  }
  return { detected: false as const, blocked: false as const, control: 'UNSAFE_TOOL_CALL_DETECTOR' as const };
}

export function applyModelQuarantine(model: ModelRecord) {
  const q = quarantineModel(model);
  return {
    model: q,
    control: 'MODEL_QUARANTINE' as const,
    mayRun: false as const,
  };
}
