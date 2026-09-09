import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BT_LOCKS,
  EXPERIMENT_APPLY_TO_MAIN_DENIED,
  NEGATIVE_KNOWLEDGE_BLOCKS_REPROPOSAL,
  NEGATIVE_KNOWLEDGE_STORED,
  type ExperimentStatus,
} from './apprenticeship-experiment-evolution-types';

/**
 * Continuous Code Experiment Factory — sandboxed micro-experiments with evidence capture.
 * Failed experiments → negative knowledge (not discarded, not auto-promoted to best practice).
 * Success ≠ auto-merge/deploy; apply-to-main DENIED without review gate.
 */

export const EXPERIMENT_FACTORY_STORE = 'continuous-code-experiment-factory.json';

export type ExperimentEvidence = {
  kind: 'log' | 'diff' | 'test_result' | 'metric' | 'audit';
  ref: string;
  summary: string;
};

export type NegativeKnowledgeRecord = {
  id: string;
  experimentId: string;
  approachFingerprint: string;
  status: 'failed' | 'rejected';
  summary: string;
  evidenceRefs: string[];
  provenance: string[];
  preserved: true;
  autoBestPractice: false;
  createdAt: string;
};

export type CodeExperimentRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  approachFingerprint: string;
  status: ExperimentStatus;
  sandboxed: true;
  evidence: ExperimentEvidence[];
  negativeKnowledgeId?: string;
  createdAt: string;
  updatedAt: string;
  productionAuthorized: false;
  autoMerged: false;
  autoDeployed: false;
  applyToMainAllowed: false;
};

type ExperimentStore = {
  experiments: CodeExperimentRecord[];
  negativeKnowledge: NegativeKnowledgeRecord[];
  denials: Array<{ id: string; at: string; reason: string; experimentId?: string }>;
};

const MAX_EXPERIMENTS = 5_000;
const MAX_NEGATIVE = 10_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, EXPERIMENT_FACTORY_STORE);
}

function fingerprint(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120);
}

async function load(root: string): Promise<ExperimentStore> {
  const parsed = await readJsonFile<ExperimentStore>(storePath(root), {
    experiments: [],
    negativeKnowledge: [],
    denials: [],
  });
  return {
    experiments: Array.isArray(parsed.experiments) ? parsed.experiments : [],
    negativeKnowledge: Array.isArray(parsed.negativeKnowledge) ? parsed.negativeKnowledge : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: ExperimentStore) {
  await writeJsonFileAtomic(storePath(root), {
    experiments: store.experiments.slice(-MAX_EXPERIMENTS),
    negativeKnowledge: store.negativeKnowledge.slice(-MAX_NEGATIVE),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export type ProposeExperimentInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  approach: string;
  evidence?: ExperimentEvidence[];
  /** When true, allow re-proposal but mark PREVIOUSLY_FAILED instead of hard block. */
  allowMarkedReproposal?: boolean;
  root?: string;
};

export type ProposeExperimentResult = {
  accepted: boolean;
  reason: string;
  experiment: CodeExperimentRecord | null;
  previouslyFailed: boolean;
  negativeKnowledgeHit: NegativeKnowledgeRecord | null;
  statusLabel: ExperimentStatus | 'PREVIOUSLY_FAILED' | 'DENIED';
};

export async function proposeCodeExperiment(
  input: ProposeExperimentInput,
): Promise<ProposeExperimentResult> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const approachFingerprint = fingerprint(input.approach || input.title);

  if (!input.orgId || !input.tenantId || !input.universeId || !input.title.trim()) {
    return {
      accepted: false,
      reason: 'EXPERIMENT_REQUIRES_ORG_TENANT_UNIVERSE_TITLE',
      experiment: null,
      previouslyFailed: false,
      negativeKnowledgeHit: null,
      statusLabel: 'DENIED',
    };
  }

  const prior = store.negativeKnowledge.find(
    (nk) =>
      nk.approachFingerprint === approachFingerprint &&
      (nk.status === 'failed' || nk.status === 'rejected'),
  );
  if (prior && input.allowMarkedReproposal !== true) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: NEGATIVE_KNOWLEDGE_BLOCKS_REPROPOSAL,
    });
    await save(root, store);
    return {
      accepted: false,
      reason: NEGATIVE_KNOWLEDGE_BLOCKS_REPROPOSAL,
      experiment: null,
      previouslyFailed: true,
      negativeKnowledgeHit: prior,
      statusLabel: 'PREVIOUSLY_FAILED',
    };
  }

  const now = new Date().toISOString();
  const experiment: CodeExperimentRecord = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: input.title.trim(),
    approachFingerprint,
    status: prior ? 'proposed' : 'running_sandboxed',
    sandboxed: true,
    evidence: [...(input.evidence ?? [])],
    createdAt: now,
    updatedAt: now,
    productionAuthorized: false,
    autoMerged: false,
    autoDeployed: false,
    applyToMainAllowed: false,
  };

  store.experiments.push(experiment);
  await save(root, store);

  return {
    accepted: true,
    reason: prior
      ? 'Experiment accepted as marked PREVIOUSLY_FAILED reproposal inside sandbox only.'
      : 'Sandboxed experiment opened; not authorized for main/deploy.',
    experiment: {
      ...experiment,
      status: prior ? 'proposed' : experiment.status,
    },
    previouslyFailed: Boolean(prior),
    negativeKnowledgeHit: prior ?? null,
    statusLabel: prior ? 'PREVIOUSLY_FAILED' : experiment.status,
  };
}

export type CompleteExperimentInput = {
  experimentId: string;
  outcome: 'succeeded_sandboxed' | 'failed' | 'rejected';
  evidence?: ExperimentEvidence[];
  failureSummary?: string;
  root?: string;
};

export async function completeCodeExperiment(input: CompleteExperimentInput) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const experiment = store.experiments.find((e) => e.id === input.experimentId);
  if (!experiment) {
    return {
      accepted: false as const,
      reason: 'EXPERIMENT_NOT_FOUND',
      experiment: null,
      negativeKnowledge: null,
    };
  }

  experiment.status = input.outcome;
  experiment.updatedAt = new Date().toISOString();
  if (input.evidence?.length) {
    experiment.evidence.push(...input.evidence);
  }

  let negativeKnowledge: NegativeKnowledgeRecord | null = null;
  if (input.outcome === 'failed' || input.outcome === 'rejected') {
    negativeKnowledge = {
      id: randomUUID(),
      experimentId: experiment.id,
      approachFingerprint: experiment.approachFingerprint,
      status: input.outcome,
      summary: (input.failureSummary ?? `${input.outcome} experiment`).trim(),
      evidenceRefs: experiment.evidence.map((e) => e.ref),
      provenance: [`experiment:${experiment.id}`, `status:${input.outcome}`],
      preserved: true,
      autoBestPractice: false,
      createdAt: new Date().toISOString(),
    };
    store.negativeKnowledge.push(negativeKnowledge);
    experiment.negativeKnowledgeId = negativeKnowledge.id;
    experiment.status = 'negative_knowledge';
  }

  await save(root, store);
  return {
    accepted: true as const,
    reason:
      negativeKnowledge != null
        ? NEGATIVE_KNOWLEDGE_STORED
        : 'Sandboxed success recorded; auto-merge/deploy still denied.',
    experiment,
    negativeKnowledge,
    autoMerged: false as const,
    autoDeployed: false as const,
    productionAuthorized: false as const,
  };
}

export type ApplyToMainInput = {
  experimentId: string;
  reviewGateApproved?: boolean;
  humanReviewerId?: string;
  root?: string;
};

export async function attemptApplyExperimentToMain(input: ApplyToMainInput) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const experiment = store.experiments.find((e) => e.id === input.experimentId);
  if (!experiment) {
    return {
      accepted: false as const,
      reason: 'EXPERIMENT_NOT_FOUND',
      applyToMain: false as const,
    };
  }

  const reviewOk =
    input.reviewGateApproved === true &&
    typeof input.humanReviewerId === 'string' &&
    input.humanReviewerId.trim().length > 0;

  if (
    !reviewOk ||
    BT_LOCKS.EXPERIMENT_APPLY_TO_MAIN_WITHOUT_REVIEW === true ||
    BT_LOCKS.EXPERIMENT_AUTO_MERGE === true ||
    BT_LOCKS.SUCCESS_EQUALS_AUTO_MERGE === true
  ) {
    experiment.status = 'apply_denied';
    experiment.updatedAt = new Date().toISOString();
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: EXPERIMENT_APPLY_TO_MAIN_DENIED,
      experimentId: experiment.id,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: EXPERIMENT_APPLY_TO_MAIN_DENIED,
      applyToMain: false as const,
      sandboxed: true as const,
      productionAuthorized: false as const,
    };
  }

  // Even with review gate, this factory never auto-applies; it only marks awaiting_review.
  experiment.status = 'awaiting_review';
  experiment.updatedAt = new Date().toISOString();
  await save(root, store);
  return {
    accepted: false as const,
    reason: 'REVIEW_GATE_RECORDED_BUT_AUTO_APPLY_DENIED; human merge still required.',
    applyToMain: false as const,
    sandboxed: true as const,
    productionAuthorized: false as const,
    awaitingReview: true as const,
  };
}

export async function findNegativeKnowledge(approach: string, root?: string) {
  const store = await load(root ?? process.cwd());
  const fp = fingerprint(approach);
  return store.negativeKnowledge.filter((nk) => nk.approachFingerprint === fp);
}

export function experimentFactoryHonesty() {
  return {
    experimentsSandboxed: BT_LOCKS.EXPERIMENTS_SANDBOXED,
    autoMerge: BT_LOCKS.EXPERIMENT_AUTO_MERGE,
    autoDeploy: BT_LOCKS.EXPERIMENT_AUTO_DEPLOY,
    applyToMainWithoutReview: BT_LOCKS.EXPERIMENT_APPLY_TO_MAIN_WITHOUT_REVIEW,
    successEqualsAutoMerge: BT_LOCKS.SUCCESS_EQUALS_AUTO_MERGE,
    failedDiscarded: BT_LOCKS.FAILED_EXPERIMENT_DISCARDED,
    failedAutoBestPractice: BT_LOCKS.FAILED_EXPERIMENT_AUTO_BEST_PRACTICE,
    negativeKnowledgePreserved: BT_LOCKS.NEGATIVE_KNOWLEDGE_PRESERVED,
    l4AutonomyEnabled: BT_LOCKS.L4_AUTONOMY_ENABLED,
  };
}
