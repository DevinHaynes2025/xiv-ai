/**
 * 62L-EX16 — Validation pass.
 * Invalid IR → TRANSLATION_FAILED (cannot enter execution router).
 */

import type { XivProblemIR } from './problem-ir.ts';
import {
  EX16_SCHEMA_VERSION,
  type TranslationStatus,
} from './types.ts';

export type ValidationResult = {
  ok: boolean;
  status: TranslationStatus;
  errors: string[];
  warnings: string[];
};

export function validateProblemIR(ir: XivProblemIR): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (ir.schemaVersion !== EX16_SCHEMA_VERSION) {
    errors.push(`schemaVersion mismatch: ${ir.schemaVersion}`);
  }
  if (!ir.missionId) errors.push('missionId required');
  if (!ir.problemId) errors.push('problemId required');
  if (!ir.tenantId) errors.push('tenantId required');
  if (!ir.universeId) errors.push('universeId required');
  if (!ir.objective?.expression) errors.push('objective.expression required');
  if (!Number.isFinite(ir.dimensions.n) || ir.dimensions.n <= 0) {
    errors.push('dimensions.n invalid');
  }
  const unmapped = ir.constraints.filter((c) => !c.mapped);
  if (unmapped.length > 0) {
    errors.push(`unmapped constraints: ${unmapped.map((c) => c.id).join(',')}`);
  }
  if (ir.status === 'DENIED' || ir.status === 'INVALID') {
    errors.push(`ir status ${ir.status}`);
  }
  if (ir.representationTargets.length === 0) {
    warnings.push('no representation targets declared');
  }

  if (errors.length > 0) {
    return {
      ok: false,
      status: 'TRANSLATION_FAILED',
      errors,
      warnings,
    };
  }
  return { ok: true, status: 'VALID', errors, warnings };
}

/**
 * Invalid translation must never enter the execution router.
 */
export function canEnterExecutionRouter(validation: ValidationResult): boolean {
  return validation.ok && validation.status === 'VALID';
}
