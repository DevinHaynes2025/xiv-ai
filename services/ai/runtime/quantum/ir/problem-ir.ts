/**
 * 62L-EX16 — XivProblemIR + IR primitives.
 * Bounded primitives used by real tests; not a full math CAS.
 */

import { createHash } from 'node:crypto';

import {
  EX16_SCHEMA_VERSION,
  assertSameTenantUniverse,
  ex16Deny,
  type AccessScope,
  type Ex16Denial,
  type ExecutionClass,
  type RepresentationTarget,
} from './types.ts';

export const IR_PRIMITIVES = [
  'VARIABLE',
  'CONSTANT',
  'VECTOR',
  'MATRIX',
  'TENSOR',
  'GRAPH_NODE',
  'GRAPH_EDGE',
  'CONSTRAINT',
  'OBJECTIVE',
  'ADD',
  'SUB',
  'MUL',
  'DIV',
  'DOT',
  'MATRIX_MULTIPLY',
  'MINIMIZE',
  'MAXIMIZE',
  'SAMPLE',
  'SEARCH',
  'MATCH',
  'ROUTE',
  'SCHEDULE',
  'NORMALIZE',
  'TRANSFORM',
  'ENCODE',
  'DECODE',
  'MEASURE',
] as const;

export type IrPrimitiveKind = (typeof IR_PRIMITIVES)[number];

export type IrNode = {
  id: string;
  kind: IrPrimitiveKind;
  label?: string;
  dims?: number[];
  value?: number | string | boolean | null;
  refs?: string[];
  meta?: Record<string, string | number | boolean | null>;
};

export type IrConstraint = {
  id: string;
  expression: string;
  mapped: boolean;
  sense: 'EQ' | 'LE' | 'GE' | 'RANGE' | 'CUSTOM';
};

export type IrObjective = {
  id: string;
  sense: 'MINIMIZE' | 'MAXIMIZE' | 'SATISFY' | 'SAMPLE';
  expression: string;
  weight: number;
};

export type XivProblemIR = {
  irId: string;
  schemaVersion: typeof EX16_SCHEMA_VERSION;
  missionId: string;
  taskId: string;
  parentTaskId: string | null;
  genomeId: string | null;
  problemId: string;
  problemClass: string;
  problemVersion: string;
  tenantId: string;
  universeId: string;
  objective: IrObjective;
  objectives: IrObjective[];
  variables: IrNode[];
  constants: IrNode[];
  vectors: IrNode[];
  matrices: IrNode[];
  tensors: IrNode[];
  graphNodes: IrNode[];
  graphEdges: IrNode[];
  constraints: IrConstraint[];
  operations: IrNode[];
  dimensions: { n: number; m: number; k: number };
  precision: string;
  tolerance: number | null;
  deterministic: boolean;
  seedRequired: boolean;
  localOnly: boolean;
  offlineCapable: boolean;
  representationTargets: RepresentationTarget[];
  preferredExecutionClasses: ExecutionClass[];
  inputSchemaHash: string;
  createdAt: string;
  status: 'DRAFT' | 'VALID' | 'INVALID' | 'STALE' | 'DENIED';
  notes: string[];
};

export type ProblemIrInput = {
  missionId: string;
  taskId: string;
  parentTaskId?: string | null;
  genomeId?: string | null;
  problemId: string;
  problemClass: string;
  problemVersion?: string;
  tenantId: string;
  universeId: string;
  objective: IrObjective;
  objectives?: IrObjective[];
  variables?: IrNode[];
  constants?: IrNode[];
  vectors?: IrNode[];
  matrices?: IrNode[];
  tensors?: IrNode[];
  graphNodes?: IrNode[];
  graphEdges?: IrNode[];
  constraints?: IrConstraint[];
  operations?: IrNode[];
  dimensions: { n: number; m: number; k: number };
  precision?: string;
  tolerance?: number | null;
  deterministic?: boolean;
  seedRequired?: boolean;
  localOnly?: boolean;
  offlineCapable?: boolean;
  representationTargets?: RepresentationTarget[];
  preferredExecutionClasses?: ExecutionClass[];
  createdAt?: string;
  notes?: string[];
};

function hashInput(parts: unknown[]): string {
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 24);
}

export function createXivProblemIR(input: ProblemIrInput): XivProblemIR | Ex16Denial {
  if (!Number.isFinite(input.dimensions.n) || input.dimensions.n <= 0) {
    return ex16Deny('invalid dimensions: n must be positive finite');
  }
  if (!Number.isFinite(input.dimensions.m) || input.dimensions.m < 0) {
    return ex16Deny('invalid dimensions: m must be non-negative finite');
  }
  if (!Number.isFinite(input.dimensions.k) || input.dimensions.k < 0) {
    return ex16Deny('invalid dimensions: k must be non-negative finite');
  }

  const constraints = input.constraints ?? [];
  const unmapped = constraints.filter((c) => !c.mapped);
  if (unmapped.length > 0) {
    return ex16Deny(
      `missing constraint mapping rejected: ${unmapped.map((c) => c.id).join(',')}`,
    );
  }

  const irId = `pir_${hashInput([input.missionId, input.problemId, input.tenantId, input.universeId])}`;
  const inputSchemaHash = hashInput([
    input.problemClass,
    input.dimensions,
    input.objective,
    constraints,
    input.variables ?? [],
  ]);

  return {
    irId,
    schemaVersion: EX16_SCHEMA_VERSION,
    missionId: input.missionId,
    taskId: input.taskId,
    parentTaskId: input.parentTaskId ?? null,
    genomeId: input.genomeId ?? null,
    problemId: input.problemId,
    problemClass: input.problemClass,
    problemVersion: input.problemVersion ?? '1.0.0',
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective,
    objectives: input.objectives ?? [input.objective],
    variables: input.variables ?? [],
    constants: input.constants ?? [],
    vectors: input.vectors ?? [],
    matrices: input.matrices ?? [],
    tensors: input.tensors ?? [],
    graphNodes: input.graphNodes ?? [],
    graphEdges: input.graphEdges ?? [],
    constraints,
    operations: input.operations ?? [],
    dimensions: input.dimensions,
    precision: input.precision ?? 'f64',
    tolerance: input.tolerance ?? null,
    deterministic: input.deterministic ?? true,
    seedRequired: input.seedRequired ?? false,
    localOnly: input.localOnly ?? true,
    offlineCapable: input.offlineCapable ?? true,
    representationTargets: input.representationTargets ?? ['CLASSICAL_GRAPH'],
    preferredExecutionClasses: input.preferredExecutionClasses ?? ['CLASSICAL'],
    inputSchemaHash,
    createdAt: input.createdAt ?? new Date().toISOString(),
    status: 'VALID',
    notes: input.notes ?? [],
  };
}

export function isXivProblemIR(value: unknown): value is XivProblemIR {
  if (!value || typeof value !== 'object') return false;
  const v = value as XivProblemIR;
  return (
    typeof v.irId === 'string' &&
    v.schemaVersion === EX16_SCHEMA_VERSION &&
    typeof v.missionId === 'string' &&
    typeof v.tenantId === 'string' &&
    typeof v.universeId === 'string' &&
    !!v.objective &&
    Array.isArray(v.constraints) &&
    !!v.dimensions
  );
}

export function assertProblemIrAccess(
  ir: XivProblemIR,
  actor: AccessScope,
): Ex16Denial | null {
  return assertSameTenantUniverse(
    { tenantId: ir.tenantId, universeId: ir.universeId },
    actor,
  );
}

export function markProblemIrStale(ir: XivProblemIR, reason: string): XivProblemIR {
  return {
    ...ir,
    status: 'STALE',
    notes: [...ir.notes, `STALE: ${reason}`],
  };
}
