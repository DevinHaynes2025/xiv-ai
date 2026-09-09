/**
 * 62L-BU Cross-Language Compiler Intelligence — compiler/adapter intelligence
 * candidates; VERIFIED only with proof (toolchain + tests).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { getResearchToolchain } from './ai-code-research-institute';
import {
  BU_LOCKS,
  COMPILER_CANDIDATE_ONLY,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  UNPROVEN_NOT_VERIFIED,
  containsForbiddenPrivateFields,
  type BuActor,
  type CompatibilityLabel,
} from './code-research-benchmark-strategy-types';

export type CompilerAdapterCandidate = {
  id: string;
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  label: CompatibilityLabel;
  toolchainProven: boolean;
  testsProven: boolean;
  evidenceRefs: string[];
  underReview: true;
  productionAuthorized: false;
  createdAt: string;
  actorId: string;
  reason: string;
};

type Store = {
  adapters: CompilerAdapterCandidate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'cross-language-compiler-intelligence.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { adapters: [] });
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

/**
 * Propose a compiler/adapter intelligence candidate.
 * Without proof → CANDIDATE / DOCUMENTED / UNAVAILABLE — never silent VERIFIED.
 */
export async function proposeCompilerAdapter(input: {
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  evidenceRefs?: string[];
  /** Claim verification without proof — refused. */
  claimVerifiedWithoutProof?: boolean;
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

  const src = normalizeKey(input.sourceLanguage);
  const tgt = normalizeKey(input.targetLanguage);
  const srcTc = await getResearchToolchain(src, root);
  const tgtTc = await getResearchToolchain(tgt, root);

  const srcVerified =
    !!srcTc && srcTc.label === 'VERIFIED' && srcTc.toolchainProven && srcTc.testsProven;
  const tgtVerified =
    !!tgtTc && tgtTc.label === 'VERIFIED' && tgtTc.toolchainProven && tgtTc.testsProven;

  if (input.claimVerifiedWithoutProof && !(srcVerified && tgtVerified)) {
    return {
      accepted: false as const,
      reason: UNPROVEN_NOT_VERIFIED,
      labeledVerified: false as const,
      candidateOnly: true as const,
    };
  }

  let label: CompatibilityLabel = 'DOCUMENTED';
  let reason: string = COMPILER_CANDIDATE_ONLY;

  if (srcVerified && tgtVerified) {
    label = 'VERIFIED';
    reason = 'COMPILER_ADAPTER_VERIFIED_WITH_TOOLCHAIN_AND_TESTS_PROOF';
  } else if (!srcTc || !tgtTc) {
    label = 'UNAVAILABLE';
    reason = 'COMPILER_ADAPTER_LANGUAGE_TOOLCHAIN_UNAVAILABLE';
  } else {
    label = 'AVAILABLE';
    reason = COMPILER_CANDIDATE_ONLY;
  }

  const adapter: CompilerAdapterCandidate = {
    id: id('cmpi'),
    name: input.name,
    sourceLanguage: src,
    targetLanguage: tgt,
    label,
    toolchainProven: srcVerified && tgtVerified,
    testsProven: srcVerified && tgtVerified,
    evidenceRefs: input.evidenceRefs ?? [],
    underReview: true,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason,
  };

  const store = await load(root);
  store.adapters.push(adapter);
  await save(root, store);

  return {
    accepted: true as const,
    adapter,
    labeledVerified: label === 'VERIFIED',
    productionAuthorized: false as const,
    underReview: true as const,
    reason,
  };
}

export async function listCompilerAdapters(root = process.cwd()) {
  return (await load(root)).adapters;
}

export function compilerIntelligenceHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BU_LOCKS.L4_AUTONOMY_ENABLED,
    unprovenLabeledVerified: BU_LOCKS.UNPROVEN_LANGUAGE_LABELED_VERIFIED,
    productionAuthorization: BU_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
