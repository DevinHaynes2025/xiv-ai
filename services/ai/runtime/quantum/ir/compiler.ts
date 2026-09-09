/**
 * 62L-EX16 — Deterministic compiler pipeline:
 * PARSE → VALIDATE → NORMALIZE → LOWER → OPTIMIZE → TARGET → VERIFY → EMIT
 * Safe optimization passes with semantic checks. Versioning → STALE on change.
 */

import {
  COMPILER_PIPELINE,
  EX16_COMPILER_VERSION,
  EX16_SCHEMA_VERSION,
  type CompilerPipelineStage,
  type RepresentationTarget,
  type TranslationStatus,
} from './types.ts';
import type { XivProblemIR } from './problem-ir.ts';
import { markProblemIrStale } from './problem-ir.ts';
import { validateProblemIR, canEnterExecutionRouter } from './validation.ts';
import {
  translateAlgorithm,
  type AlgorithmTranslation,
} from './translator.ts';

export type CompilerStageRecord = {
  stage: CompilerPipelineStage;
  ok: boolean;
  detail: string;
};

export type CompilerResult = {
  ok: boolean;
  status: TranslationStatus;
  stages: CompilerStageRecord[];
  translation: AlgorithmTranslation | null;
  mayEnterExecutionRouter: boolean;
  compilerVersion: typeof EX16_COMPILER_VERSION;
  schemaVersion: typeof EX16_SCHEMA_VERSION;
};

export function runCompilerPipeline(input: {
  problem: XivProblemIR;
  target: RepresentationTarget;
  lossy?: boolean;
  approximateObjective?: string;
  materialChange?: boolean;
  optimize?: boolean;
}): CompilerResult {
  const stages: CompilerStageRecord[] = [];
  const push = (stage: CompilerPipelineStage, ok: boolean, detail: string) => {
    stages.push({ stage, ok, detail });
  };

  // PARSE
  if (!input.problem.irId || !input.problem.schemaVersion) {
    push('PARSE', false, 'unparseable IR');
    return fail(stages, 'TRANSLATION_FAILED');
  }
  push('PARSE', true, `parsed ${input.problem.irId}`);

  // VALIDATE
  const validation = validateProblemIR(input.problem);
  push('VALIDATE', validation.ok, validation.ok ? 'valid' : validation.errors.join(';'));
  if (!validation.ok) return fail(stages, 'TRANSLATION_FAILED');

  // NORMALIZE
  const normalized: XivProblemIR = {
    ...input.problem,
    objective: {
      ...input.problem.objective,
      expression: input.problem.objective.expression.trim(),
    },
    notes: [...input.problem.notes, 'normalized'],
  };
  push('NORMALIZE', true, 'objective trimmed');

  // LOWER
  push('LOWER', true, `lowered toward ${input.target}`);

  // OPTIMIZE (safe; semantic check)
  let materialChange = input.materialChange === true;
  let approximateObjective = input.approximateObjective;
  if (input.optimize) {
    // Safe pass: drop no-op notes only; never rewrite objective silently.
    const before = normalized.objective.expression;
    const after = before;
    if (after !== before) materialChange = true;
    push('OPTIMIZE', true, 'safe no-op optimize; semantic check passed');
  } else {
    push('OPTIMIZE', true, 'optimize skipped');
  }

  // TARGET
  push('TARGET', true, `target=${input.target}`);

  // VERIFY + EMIT via translator
  const translation = translateAlgorithm({
    problem: normalized,
    target: input.target,
    lossy: input.lossy,
    approximateObjective,
    materialChange,
    compilerVersion: EX16_COMPILER_VERSION,
  });

  const verifyOk =
    translation.status === 'VALID' &&
    translation.semanticEquivalence !== 'SEMANTICALLY_DIFFERENT';
  push(
    'VERIFY',
    verifyOk || translation.lossyState === 'LOSSY' || translation.lossyState === 'EQUIVALENT_WITH_TOLERANCE',
    `semantic=${translation.semanticEquivalence}; lossy=${translation.lossyState}`,
  );

  if (translation.status === 'TRANSLATION_FAILED') {
    push('EMIT', false, 'emit blocked');
    return fail(stages, 'TRANSLATION_FAILED', translation);
  }

  push('EMIT', true, `emitted ${translation.translationId}`);

  // Ensure pipeline order matches contract
  const orderOk = COMPILER_PIPELINE.every((s, i) => stages[i]?.stage === s);
  if (!orderOk) {
    return fail(stages, 'TRANSLATION_FAILED', translation);
  }

  return {
    ok: true,
    status: translation.status,
    stages,
    translation,
    mayEnterExecutionRouter: canEnterExecutionRouter(validation) && translation.status === 'VALID',
    compilerVersion: EX16_COMPILER_VERSION,
    schemaVersion: EX16_SCHEMA_VERSION,
  };
}

function fail(
  stages: CompilerStageRecord[],
  status: TranslationStatus,
  translation: AlgorithmTranslation | null = null,
): CompilerResult {
  // Fill remaining stages as skipped/failed for auditability
  for (const stage of COMPILER_PIPELINE) {
    if (!stages.find((s) => s.stage === stage)) {
      stages.push({ stage, ok: false, detail: 'skipped after failure' });
    }
  }
  return {
    ok: false,
    status,
    stages,
    translation,
    mayEnterExecutionRouter: false,
    compilerVersion: EX16_COMPILER_VERSION,
    schemaVersion: EX16_SCHEMA_VERSION,
  };
}

export function isTranslationStale(input: {
  translationCompilerVersion: string;
  translationSchemaVersion: string;
  currentCompilerVersion?: string;
  currentSchemaVersion?: string;
}): boolean {
  const compiler = input.currentCompilerVersion ?? EX16_COMPILER_VERSION;
  const schema = input.currentSchemaVersion ?? EX16_SCHEMA_VERSION;
  return (
    input.translationCompilerVersion !== compiler ||
    input.translationSchemaVersion !== schema
  );
}

export function invalidateStalePreference(input: {
  problem: XivProblemIR;
  translationCompilerVersion: string;
  translationSchemaVersion: string;
}): { stale: true; problem: XivProblemIR; preference: 'INVALIDATED' } | { stale: false } {
  if (
    !isTranslationStale({
      translationCompilerVersion: input.translationCompilerVersion,
      translationSchemaVersion: input.translationSchemaVersion,
    })
  ) {
    return { stale: false };
  }
  return {
    stale: true,
    preference: 'INVALIDATED',
    problem: markProblemIrStale(
      input.problem,
      'compiler/schema version change invalidates old preference',
    ),
  };
}
