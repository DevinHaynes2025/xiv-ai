/**
 * 62L-EX3 — Historical algorithm brain + XIV_ALGORITHM_DNA.
 * Lawful knowledge only; WAITING_DATA when external required.
 */

import { createHash } from 'node:crypto';

import type { AlgorithmFamily, Ex3ProblemClass } from './algorithm-registry.ts';
import { attemptOfflineExternalKnowledge } from './experiment.ts';
import { ex3Deny, type Ex3Denial, type Ex3TenantScope } from './ex3-types.ts';
import type { WorkloadGenome } from './problem-genome.ts';

export type AlgorithmLesson = {
  lessonId: string;
  algorithmId: string;
  outcome: 'PASS' | 'FAIL' | 'REGRESSED' | 'TRADEOFF';
  summary: string;
  lawful: true;
  source: 'XIV_EXPERIMENT' | 'PUBLIC_LITERATURE' | 'LICENSED_REF' | 'VERIFIED_LESSON';
  createdAt: string;
};

export type AlgorithmDnaRecord = {
  dnaId: string;
  version: string;
  schemas: readonly string[];
  genomes: readonly string[];
  recipes: readonly string[];
  routing: readonly string[];
  evaluation: readonly string[];
  lessons: readonly string[];
  compatibility: readonly string[];
  contentHash: string;
  previousHash: string | null;
  rollbackOf: string | null;
  createdAt: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type HistoricalAlgorithmBrain = {
  lessons: AlgorithmLesson[];
  dnaVersions: AlgorithmDnaRecord[];
};

export function createHistoricalBrain(): HistoricalAlgorithmBrain {
  return { lessons: [], dnaVersions: [] };
}

export function recordLesson(
  brain: HistoricalAlgorithmBrain,
  lesson: Omit<AlgorithmLesson, 'lawful' | 'createdAt'> & { createdAt?: string },
): AlgorithmLesson | Ex3Denial {
  if (!lesson.summary.trim()) return ex3Deny('LESSON_SUMMARY_REQUIRED');
  const entry: AlgorithmLesson = {
    ...lesson,
    lawful: true,
    createdAt: lesson.createdAt ?? new Date().toISOString(),
  };
  brain.lessons.push(entry);
  return entry;
}

function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function publishAlgorithmDna(
  brain: HistoricalAlgorithmBrain,
  input: {
    version: string;
    schemas: readonly string[];
    genomes: readonly WorkloadGenome[];
    recipes: readonly string[];
    routing: readonly string[];
    evaluation: readonly string[];
    lessons: readonly AlgorithmLesson[];
    compatibility: readonly string[];
    scope: Ex3TenantScope;
    rollbackOf?: string | null;
  },
): AlgorithmDnaRecord {
  const previous = brain.dnaVersions[brain.dnaVersions.length - 1] ?? null;
  const body = {
    version: input.version,
    schemas: input.schemas,
    genomes: input.genomes.map((g) => g.genomeId),
    recipes: input.recipes,
    routing: input.routing,
    evaluation: input.evaluation,
    lessons: input.lessons.map((l) => l.lessonId),
    compatibility: input.compatibility,
    previousHash: previous?.contentHash ?? null,
  };
  const record: AlgorithmDnaRecord = {
    dnaId: `dna-${input.version}`,
    version: input.version,
    schemas: input.schemas,
    genomes: body.genomes,
    recipes: input.recipes,
    routing: input.routing,
    evaluation: input.evaluation,
    lessons: body.lessons,
    compatibility: input.compatibility,
    contentHash: hashPayload(body),
    previousHash: previous?.contentHash ?? null,
    rollbackOf: input.rollbackOf ?? null,
    createdAt: new Date().toISOString(),
    orgId: input.scope.orgId,
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
  };
  brain.dnaVersions.push(record);
  return record;
}

export function queryOfflineKnowledge(input: {
  offline: boolean;
  topic: string;
  family?: AlgorithmFamily;
  localCorpusHit: boolean;
}): { state: 'WAITING_DATA' | 'AVAILABLE'; reason: string; topic: string } {
  void input.family;
  const result = attemptOfflineExternalKnowledge({
    offline: input.offline,
    externalRequired: true,
    localAvailable: input.localCorpusHit,
  });
  return { ...result, topic: input.topic };
}

/** Placeholder genome ids for DNA rollback materialization. */
export function materializeGenomeStub(genomeId: string): WorkloadGenome {
  return {
    genomeId,
    problemClass: 'SEARCH' as Ex3ProblemClass,
    variables: 0,
    constraints: 0,
    objectiveFunctions: [],
    graphStructure: 'none',
    matrixStructure: 'none',
    sparsity: 0,
    searchSpaceSize: 0,
    precision: 'float64',
    stochasticity: 'deterministic',
    parallelism: 'none',
    memoryRequirementMb: 0,
    latencyTargetMs: 0,
    problemSize: 1,
  };
}
