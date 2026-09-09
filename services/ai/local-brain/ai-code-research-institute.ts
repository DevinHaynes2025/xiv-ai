/**
 * 62L-BU AI Code Research Institute — compare algorithms, runtimes, compilers,
 * build systems, architecture choices, design patterns across verified languages;
 * study ABI/FFI and portability with provenance + confidence labels.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ABI_FFI_REQUIRES_PROVENANCE,
  BU_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  UNPROVEN_NOT_VERIFIED,
  containsForbiddenPrivateFields,
  type BuActor,
  type CompatibilityLabel,
  type ConfidenceLabel,
  type ResearchCompareKind,
} from './code-research-benchmark-strategy-types';

export type ToolchainRecord = {
  languageKey: string;
  displayName: string;
  label: CompatibilityLabel;
  toolchainProven: boolean;
  testsProven: boolean;
  evidenceRefs: string[];
};

export type ResearchComparison = {
  id: string;
  kind: ResearchCompareKind;
  title: string;
  languageKeys: string[];
  /** Only VERIFIED languages participate in scored compare; others flagged. */
  verifiedLanguagesUsed: string[];
  skippedUnverified: string[];
  summary: string;
  provenance: string[];
  confidence: ConfidenceLabel;
  labeledVerified: boolean;
  productionAuthorized: false;
  createdAt: string;
  actorId: string;
};

export type AbiFfiFinding = {
  id: string;
  title: string;
  languages: string[];
  issueKind: 'abi' | 'ffi' | 'portability';
  summary: string;
  provenance: string[];
  confidence: ConfidenceLabel;
  productionAuthorized: false;
  createdAt: string;
  actorId: string;
};

type Store = {
  toolchains: ToolchainRecord[];
  comparisons: ResearchComparison[];
  abiFfiFindings: AbiFfiFinding[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'ai-code-research-institute.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    toolchains: [],
    comparisons: [],
    abiFfiFindings: [],
  });
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

/** Register or update a language/toolchain with honest compatibility label. */
export async function registerResearchToolchain(input: {
  languageKey: string;
  displayName: string;
  toolchainProven: boolean;
  testsProven: boolean;
  evidenceRefs?: string[];
  /** Attempt to force VERIFIED without proof — refused. */
  forceVerified?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const key = normalizeKey(input.languageKey);

  let label: CompatibilityLabel = 'DOCUMENTED';
  if (input.forceVerified && !(input.toolchainProven && input.testsProven)) {
    return {
      accepted: false as const,
      reason: UNPROVEN_NOT_VERIFIED,
      label: 'DOCUMENTED' as const,
      labeledVerified: false as const,
    };
  }

  if (input.toolchainProven && input.testsProven) {
    label = 'VERIFIED';
  } else if (input.toolchainProven) {
    label = 'AVAILABLE';
  } else {
    label = 'DOCUMENTED';
  }

  const record: ToolchainRecord = {
    languageKey: key,
    displayName: input.displayName,
    label,
    toolchainProven: input.toolchainProven,
    testsProven: input.testsProven,
    evidenceRefs: input.evidenceRefs ?? [],
  };

  const idx = store.toolchains.findIndex((t) => t.languageKey === key);
  if (idx >= 0) store.toolchains[idx] = record;
  else store.toolchains.push(record);
  await save(root, store);

  return {
    accepted: true as const,
    toolchain: record,
    labeledVerified: label === 'VERIFIED',
    reason:
      label === 'VERIFIED'
        ? 'TOOLCHAIN_AND_TESTS_PROVEN'
        : UNPROVEN_NOT_VERIFIED,
  };
}

export async function getResearchToolchain(languageKey: string, root = process.cwd()) {
  const store = await load(root);
  return store.toolchains.find((t) => t.languageKey === normalizeKey(languageKey)) ?? null;
}

/**
 * Compare research subjects across languages. Unverified languages are skipped
 * (not labeled VERIFIED); comparison itself is not production authorization.
 */
export async function compareCodeResearch(input: {
  kind: ResearchCompareKind;
  title: string;
  languageKeys: string[];
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
      labeledVerified: false as const,
    };
  }

  const store = await load(root);
  const verified: string[] = [];
  const skipped: string[] = [];

  for (const raw of input.languageKeys) {
    const key = normalizeKey(raw);
    const tc = store.toolchains.find((t) => t.languageKey === key);
    if (tc && tc.label === 'VERIFIED' && tc.toolchainProven && tc.testsProven) {
      verified.push(key);
    } else {
      skipped.push(key);
    }
  }

  const confidence: ConfidenceLabel =
    input.confidence ??
    (verified.length > 0 && skipped.length === 0 ? 'evidence_backed' : 'unverified');

  const comparison: ResearchComparison = {
    id: id('cmp'),
    kind: input.kind,
    title: input.title,
    languageKeys: input.languageKeys.map(normalizeKey),
    verifiedLanguagesUsed: verified,
    skippedUnverified: skipped,
    summary: input.summary,
    provenance: input.provenance ?? ['62L-BU'],
    confidence,
    labeledVerified: verified.length > 0 && skipped.length === 0,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
  };

  store.comparisons.push(comparison);
  await save(root, store);

  return {
    accepted: true as const,
    comparison,
    labeledVerified: comparison.labeledVerified,
    productionAuthorized: false as const,
    reason:
      skipped.length > 0
        ? 'COMPARE_PARTIAL_UNVERIFIED_LANGUAGES_SKIPPED'
        : 'COMPARE_ON_VERIFIED_ONLY',
  };
}

/**
 * Record ABI/FFI/portability finding — requires provenance + confidence.
 * Missing provenance → DENIED (not silently accepted as VERIFIED).
 */
export async function recordAbiFfiPortabilityFinding(input: {
  title: string;
  languages: string[];
  issueKind: 'abi' | 'ffi' | 'portability';
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

  const provenance = input.provenance ?? [];
  if (provenance.length === 0) {
    return {
      accepted: false as const,
      reason: ABI_FFI_REQUIRES_PROVENANCE,
      missing: 'provenance' as const,
    };
  }

  const confidence = input.confidence ?? 'unverified';
  const store = await load(root);
  const finding: AbiFfiFinding = {
    id: id('abi'),
    title: input.title,
    languages: input.languages.map(normalizeKey),
    issueKind: input.issueKind,
    summary: input.summary,
    provenance,
    confidence,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  store.abiFfiFindings.push(finding);
  await save(root, store);

  return {
    accepted: true as const,
    finding,
    hasProvenance: true as const,
    hasConfidenceLabel: true as const,
    productionAuthorized: false as const,
    reason: 'ABI_FFI_PORTABILITY_RECORDED_WITH_PROVENANCE',
  };
}

export async function listResearchComparisons(root = process.cwd()) {
  return (await load(root)).comparisons;
}

export async function listAbiFfiFindings(root = process.cwd()) {
  return (await load(root)).abiFfiFindings;
}

export function codeResearchInstituteHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BU_LOCKS.L4_AUTONOMY_ENABLED,
    unprovenLabeledVerified: BU_LOCKS.UNPROVEN_LANGUAGE_LABELED_VERIFIED,
    measuredResultIsProductionMandate: BU_LOCKS.MEASURED_RESULT_IS_PRODUCTION_MANDATE,
    productionAuthorization: BU_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
