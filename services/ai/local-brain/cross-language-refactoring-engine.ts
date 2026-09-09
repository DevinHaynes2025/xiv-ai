import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BT_LOCKS,
  REFACTOR_NOT_VERIFIED_WITHOUT_EQUIVALENCE,
  type RefactorVerificationLabel,
} from './apprenticeship-experiment-evolution-types';

/**
 * Cross-Language Refactoring Engine — candidates until behavior-equivalence evidence.
 * Claim without checks ≠ VERIFIED.
 */

export const REFACTOR_ENGINE_STORE = 'cross-language-refactoring-engine.json';

export type BehaviorEquivalenceEvidence = {
  checkId: string;
  method: 'shared_tests' | 'oracle_compare' | 'property_test' | 'golden_output';
  passed: boolean;
  summary: string;
};

export type RefactorCandidateRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sourceLanguage: string;
  targetLanguage: string;
  summary: string;
  label: RefactorVerificationLabel;
  equivalenceEvidence: BehaviorEquivalenceEvidence[];
  createdAt: string;
  updatedAt: string;
  productionAuthorized: false;
  autoMerged: false;
};

type RefactorStore = {
  candidates: RefactorCandidateRecord[];
  denials: Array<{ id: string; at: string; reason: string; candidateId?: string }>;
};

const MAX_CANDIDATES = 5_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, REFACTOR_ENGINE_STORE);
}

async function load(root: string): Promise<RefactorStore> {
  const parsed = await readJsonFile<RefactorStore>(storePath(root), {
    candidates: [],
    denials: [],
  });
  return {
    candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: RefactorStore) {
  await writeJsonFileAtomic(storePath(root), {
    candidates: store.candidates.slice(-MAX_CANDIDATES),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export type ProposeRefactorInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  sourceLanguage: string;
  targetLanguage: string;
  summary: string;
  /** Hard-deny probe: claim VERIFIED without equivalence evidence. */
  claimVerifiedWithoutEquivalence?: boolean;
  equivalenceEvidence?: BehaviorEquivalenceEvidence[];
  root?: string;
};

export type ProposeRefactorResult = {
  accepted: boolean;
  reason: string;
  candidate: RefactorCandidateRecord | null;
  label: RefactorVerificationLabel | 'DENIED';
  verified: boolean;
};

export async function proposeCrossLanguageRefactor(
  input: ProposeRefactorInput,
): Promise<ProposeRefactorResult> {
  const root = input.root ?? process.cwd();
  const deny = async (
    reason: string,
    candidateId?: string,
  ): Promise<ProposeRefactorResult> => {
    const store = await load(root);
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
      candidateId,
    });
    await save(root, store);
    return {
      accepted: false,
      reason,
      candidate: null,
      label: 'DENIED',
      verified: false,
    };
  };

  if (
    !input.orgId ||
    !input.tenantId ||
    !input.universeId ||
    !input.sourceLanguage.trim() ||
    !input.targetLanguage.trim() ||
    !input.summary.trim()
  ) {
    return deny('REFACTOR_REQUIRES_ORG_TENANT_UNIVERSE_LANGUAGES_SUMMARY');
  }

  const evidence = [...(input.equivalenceEvidence ?? [])];
  const hasPassingEquivalence =
    evidence.length > 0 && evidence.every((e) => e.passed === true);

  if (
    input.claimVerifiedWithoutEquivalence === true ||
    (BT_LOCKS.REFACTOR_VERIFIED_WITHOUT_EQUIVALENCE === true)
  ) {
    return deny(REFACTOR_NOT_VERIFIED_WITHOUT_EQUIVALENCE);
  }

  let label: RefactorVerificationLabel = 'CANDIDATE';
  if (hasPassingEquivalence && BT_LOCKS.BEHAVIOR_EQUIVALENCE_REQUIRED_FOR_VERIFIED) {
    label = 'VERIFIED';
  } else if (evidence.length > 0 && !hasPassingEquivalence) {
    label = 'REJECTED';
  } else {
    label = 'CANDIDATE';
  }

  // Explicit: without evidence, never VERIFIED even if caller asks for verified label elsewhere.
  if (!hasPassingEquivalence && label === 'VERIFIED') {
    label = 'CANDIDATE';
  }

  const now = new Date().toISOString();
  const candidate: RefactorCandidateRecord = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sourceLanguage: input.sourceLanguage.trim(),
    targetLanguage: input.targetLanguage.trim(),
    summary: input.summary.trim(),
    label,
    equivalenceEvidence: evidence,
    createdAt: now,
    updatedAt: now,
    productionAuthorized: false,
    autoMerged: false,
  };

  const store = await load(root);
  store.candidates.push(candidate);
  await save(root, store);

  return {
    accepted: true,
    reason:
      label === 'VERIFIED'
        ? 'Refactor labeled VERIFIED with behavior-equivalence evidence.'
        : label === 'REJECTED'
          ? 'Refactor REJECTED — equivalence checks did not all pass.'
          : 'Refactor retained as CANDIDATE until behavior-equivalence evidence exists.',
    candidate,
    label,
    verified: label === 'VERIFIED',
  };
}

export type LabelRefactorInput = {
  candidateId: string;
  requestedLabel: RefactorVerificationLabel;
  equivalenceEvidence?: BehaviorEquivalenceEvidence[];
  root?: string;
};

export async function applyRefactorVerificationLabel(input: LabelRefactorInput) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const candidate = store.candidates.find((c) => c.id === input.candidateId);
  if (!candidate) {
    return {
      accepted: false as const,
      reason: 'REFACTOR_CANDIDATE_NOT_FOUND',
      label: 'DENIED' as const,
      verified: false as const,
    };
  }

  if (input.equivalenceEvidence?.length) {
    candidate.equivalenceEvidence.push(...input.equivalenceEvidence);
  }

  const hasPassingEquivalence =
    candidate.equivalenceEvidence.length > 0 &&
    candidate.equivalenceEvidence.every((e) => e.passed === true);

  if (input.requestedLabel === 'VERIFIED' && !hasPassingEquivalence) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: REFACTOR_NOT_VERIFIED_WITHOUT_EQUIVALENCE,
      candidateId: candidate.id,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: REFACTOR_NOT_VERIFIED_WITHOUT_EQUIVALENCE,
      label: candidate.label,
      verified: false as const,
      candidate,
    };
  }

  candidate.label = input.requestedLabel === 'VERIFIED' && hasPassingEquivalence
    ? 'VERIFIED'
    : input.requestedLabel === 'VERIFIED'
      ? 'CANDIDATE'
      : input.requestedLabel;
  candidate.updatedAt = new Date().toISOString();
  await save(root, store);

  return {
    accepted: true as const,
    reason: `Refactor label set to ${candidate.label}.`,
    label: candidate.label,
    verified: candidate.label === 'VERIFIED',
    candidate,
  };
}

export function refactorEngineHonesty() {
  return {
    refactorVerifiedWithoutEquivalence: BT_LOCKS.REFACTOR_VERIFIED_WITHOUT_EQUIVALENCE,
    behaviorEquivalenceRequiredForVerified: BT_LOCKS.BEHAVIOR_EQUIVALENCE_REQUIRED_FOR_VERIFIED,
    l4AutonomyEnabled: BT_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: BT_LOCKS.PRODUCTION_AUTHORIZATION,
    autoMerge: false as const,
  };
}
