/**
 * 62L-BU Software Design Pattern Genome — versioned pattern + anti-pattern catalog
 * with provenance. Anti-patterns retained as negative knowledge (never discarded).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ANTI_PATTERN_RETAINED,
  BU_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  containsForbiddenPrivateFields,
  type BuActor,
  type ConfidenceLabel,
  type PatternKind,
} from './code-research-benchmark-strategy-types';

export type PatternGenomeEntry = {
  id: string;
  key: string;
  kind: PatternKind;
  title: string;
  summary: string;
  version: number;
  provenance: string[];
  confidence: ConfidenceLabel;
  /** Anti-patterns are negative knowledge — retained, not discarded. */
  retained: true;
  discarded: false;
  negativeKnowledge: boolean;
  productionAuthorized: false;
  createdAt: string;
  updatedAt: string;
  actorId: string;
};

type Store = {
  entries: PatternGenomeEntry[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'software-design-pattern-genome.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { entries: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export async function registerPatternGenomeEntry(input: {
  key: string;
  kind: PatternKind;
  title: string;
  summary: string;
  provenance?: string[];
  confidence?: ConfidenceLabel;
  payload?: Record<string, unknown>;
  actor: BuActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
    };
  }

  const key = normalizeKey(input.key);
  const store = await load(root);
  const existing = store.entries.filter((e) => e.key === key);
  const version = existing.length + 1;
  const now = new Date().toISOString();

  const entry: PatternGenomeEntry = {
    id: id('pat'),
    key,
    kind: input.kind,
    title: input.title,
    summary: input.summary,
    version,
    provenance: input.provenance ?? ['62L-BU'],
    confidence: input.confidence ?? 'unverified',
    retained: true,
    discarded: false,
    negativeKnowledge: input.kind === 'anti_pattern',
    productionAuthorized: false,
    createdAt: now,
    updatedAt: now,
    actorId: input.actor.id,
  };

  store.entries.push(entry);
  await save(root, store);

  return {
    accepted: true as const,
    entry,
    reason:
      input.kind === 'anti_pattern' ? ANTI_PATTERN_RETAINED : 'PATTERN_GENOME_ENTRY_RECORDED',
  };
}

/**
 * Attempt to discard an anti-pattern — DENIED; anti-patterns are preserved.
 */
export async function attemptDiscardAntiPattern(input: {
  key: string;
  actor: BuActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const key = normalizeKey(input.key);
  const entry = [...store.entries].reverse().find((e) => e.key === key && e.kind === 'anti_pattern');

  if (!entry) {
    return {
      accepted: false as const,
      discarded: false as const,
      reason: 'ANTI_PATTERN_NOT_FOUND',
    };
  }

  // Explicitly refuse discard — retain as negative knowledge.
  return {
    accepted: false as const,
    discarded: false as const,
    retained: true as const,
    negativeKnowledge: true as const,
    entry,
    reason: ANTI_PATTERN_RETAINED,
    locks: {
      antiPatternDiscarded: BU_LOCKS.ANTI_PATTERN_DISCARDED,
      antiPatternsPreserved: BU_LOCKS.ANTI_PATTERNS_PRESERVED,
    },
  };
}

export async function listPatternGenome(root = process.cwd(), kind?: PatternKind) {
  const store = await load(root);
  return kind ? store.entries.filter((e) => e.kind === kind) : store.entries;
}

export async function listAntiPatterns(root = process.cwd()) {
  return listPatternGenome(root, 'anti_pattern');
}

export function patternGenomeHonesty() {
  return {
    banner: HONESTY_BANNER,
    antiPatternsPreserved: BU_LOCKS.ANTI_PATTERNS_PRESERVED,
    antiPatternDiscarded: BU_LOCKS.ANTI_PATTERN_DISCARDED,
    productionAuthorization: BU_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
