/**
 * 12D-116: Governed agent training gate.
 *
 * The CEO asked to "continue training and building new agents". The governed truth is
 * that no model weights are mutated and no learning is promoted without explicit human
 * authorization. This module mechanizes that gate: it VALIDATES and HOLDS bounded
 * training-run proposals — it never executes a training run.
 *
 * HONEST STATE: this module starts no run, makes no model call, touches no weights, and
 * reaches no network. Every packet carries humanDecision:'REQUIRED' and is blocked from
 * execution until a human approves it.
 *
 * INTENTIONALLY ABSENT: there is NO recordTrainingOutcome export. Recording a completed
 * training run — "a model was trained" — belongs to a future human-ratified layer. By
 * omitting that path, no code in this module can ever claim a model was trained, a
 * checkpoint was produced, or learning was promoted.
 */
import { getEnterpriseRole } from './enterprise-workforce';

export const TRAINING_GATE_POLICY = Object.freeze({
  maxProposedTrainingRunsPerEpoch: 4,
  minTrainingEpoch: 1,
  maxTrainingEpoch: 10_000,
  maxAgentRoleIdChars: 64,
  maxObjectiveChars: 600,
  maxDatasetEvidenceRefs: 8,
  maxEvidenceRefChars: 256,
  maxOperatorAuthorizationRefChars: 256,
  maxRollbackRefChars: 256,
});

export const TRAINING_GUARDRAILS = Object.freeze({
  promotesLearning: false as const,
  mutatesModelWeights: false as const,
  automaticRecovery: false as const,
  humanDecision: 'REQUIRED' as const,
});

const boundedText = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export interface TrainingRunInput {
  epoch: number;
  /** Must exist in the live enterprise factory (sparse, logical; never an activated process). */
  agentRoleId: string;
  /** Bounded non-empty objective text. */
  objective: string;
  /** Distinct, bounded evidence refs describing the dataset source. */
  datasetEvidenceRefs: readonly string[];
  /** REQUIRED: a bounded reference to a human operator authorization for this run. */
  operatorAuthorizationRef: string;
  /** REQUIRED: a bounded reference to the rollback plan if the run is aborted. */
  rollbackRef: string;
}

export interface TrainingRunProposal {
  kind: 'TRAINING_RUN_PROPOSAL';
  proposalId: string;
  epoch: number;
  agentRoleId: string;
  objective: string;
  datasetEvidenceRefs: readonly string[];
  operatorAuthorizationRef: string;
  rollbackRef: string;
  approved: false;
  executionBlockedUntilHumanApproval: true;
  status: 'PROPOSED_AWAITING_HUMAN_DECISION';
  humanDecision: 'REQUIRED';
  guardrails: typeof TRAINING_GUARDRAILS;
}

const proposalsByEpoch = new Map<number, TrainingRunProposal[]>();

/** Validate and hold one bounded, human-gated training-run proposal. Starts nothing. */
export function proposeTrainingRun(input: TrainingRunInput): TrainingRunProposal {
  if (!input || !Number.isSafeInteger(input.epoch)
    || input.epoch < TRAINING_GATE_POLICY.minTrainingEpoch
    || input.epoch > TRAINING_GATE_POLICY.maxTrainingEpoch) {
    throw new Error(`training epoch must be an integer within ${TRAINING_GATE_POLICY.minTrainingEpoch}..${TRAINING_GATE_POLICY.maxTrainingEpoch}`);
  }
  if (!boundedText(input.agentRoleId, TRAINING_GATE_POLICY.maxAgentRoleIdChars)) {
    throw new Error('agentRoleId must be non-empty bounded text');
  }
  try {
    getEnterpriseRole(input.agentRoleId);
  } catch {
    throw new Error(`unknown agentRoleId: ${input.agentRoleId}; the proposed run target must exist in the live enterprise factory`);
  }
  if (!boundedText(input.objective, TRAINING_GATE_POLICY.maxObjectiveChars)) {
    throw new Error('objective must be non-empty bounded text');
  }
  if (!Array.isArray(input.datasetEvidenceRefs) || input.datasetEvidenceRefs.length < 1
    || input.datasetEvidenceRefs.length > TRAINING_GATE_POLICY.maxDatasetEvidenceRefs
    || !input.datasetEvidenceRefs.every((e: string) => boundedText(e, TRAINING_GATE_POLICY.maxEvidenceRefChars))) {
    throw new Error(`dataset needs 1..${TRAINING_GATE_POLICY.maxDatasetEvidenceRefs} bounded evidence refs`);
  }
  if (new Set(input.datasetEvidenceRefs).size !== input.datasetEvidenceRefs.length) {
    throw new Error('dataset evidence refs must be distinct; submit a deduplicated set');
  }
  if (!boundedText(input.operatorAuthorizationRef, TRAINING_GATE_POLICY.maxOperatorAuthorizationRefChars)) {
    throw new Error('operatorAuthorizationRef is REQUIRED and must be bounded text');
  }
  if (!boundedText(input.rollbackRef, TRAINING_GATE_POLICY.maxRollbackRefChars)) {
    throw new Error('rollbackRef is REQUIRED and must be bounded text');
  }

  const held = proposalsByEpoch.get(input.epoch) ?? [];
  if (held.length >= TRAINING_GATE_POLICY.maxProposedTrainingRunsPerEpoch) {
    throw new Error(`epoch ${input.epoch} already holds ${TRAINING_GATE_POLICY.maxProposedTrainingRunsPerEpoch} proposed training runs; use the next epoch`);
  }

  const proposal: TrainingRunProposal = Object.freeze({
    kind: 'TRAINING_RUN_PROPOSAL',
    proposalId: `training-gate:epoch-${input.epoch}:run-${held.length + 1}`,
    epoch: input.epoch,
    agentRoleId: input.agentRoleId,
    objective: input.objective,
    datasetEvidenceRefs: Object.freeze([...input.datasetEvidenceRefs]),
    operatorAuthorizationRef: input.operatorAuthorizationRef,
    rollbackRef: input.rollbackRef,
    approved: false as const,
    executionBlockedUntilHumanApproval: true as const,
    status: 'PROPOSED_AWAITING_HUMAN_DECISION',
    humanDecision: 'REQUIRED',
    guardrails: TRAINING_GUARDRAILS,
  });
  held.push(proposal);
  proposalsByEpoch.set(input.epoch, held);
  return proposal;
}

export interface ProposedRunReadiness {
  proposalId: string;
  ready: false;
  gaps: readonly ('HUMAN_APPROVAL_REQUIRED'
    | 'OPERATOR_AUTHORIZATION_VERIFICATION_REQUIRED'
    | 'DATASET_EVIDENCE_VERIFICATION_REQUIRED'
    | 'TRAINING_ENVIRONMENT_PROVISIONING_REQUIRED'
    | 'ROLLBACK_PLAN_VERIFICATION_REQUIRED')[];
}

export interface TrainingReadiness {
  proposalId: string;
  epoch: number;
  ready: false;
  gaps: readonly ProposedRunReadiness['gaps'][number][];
  humanDecision: 'REQUIRED';
}

/**
 * Pure evaluation: no proposal is ever "ready" here. Human approval comes first, then
 * verification of the receipts the proposal already carries, then a human-provisioned
 * training environment and a verified rollback plan. Returns explicit gaps instead of a
 * boolean shrug.
 */
export function evaluateTrainingReadiness(proposal: TrainingRunProposal): TrainingReadiness {
  if (!proposal || proposal.kind !== 'TRAINING_RUN_PROPOSAL') throw new Error('a training run proposal is required');
  const gaps = Object.freeze([
    'HUMAN_APPROVAL_REQUIRED',
    'OPERATOR_AUTHORIZATION_VERIFICATION_REQUIRED',
    'DATASET_EVIDENCE_VERIFICATION_REQUIRED',
    'TRAINING_ENVIRONMENT_PROVISIONING_REQUIRED',
    'ROLLBACK_PLAN_VERIFICATION_REQUIRED',
  ] as const);
  return Object.freeze({
    proposalId: proposal.proposalId,
    epoch: proposal.epoch,
    ready: false as const,
    gaps,
    humanDecision: 'REQUIRED' as const,
  });
}

/** Honest platform-wide snapshot. Never fabricates a count this module cannot know. */
export function trainingGateSnapshot() {
  const heldProposals = [...proposalsByEpoch.entries()]
    .sort((a, b) => a[0] - b[0])
    .flatMap(([, runs]) => runs.map(r => r.proposalId));
  return Object.freeze({
    runsStarted: 0,
    weightsMutated: 0,
    liveAgentCount: null,
    proposalsHeld: heldProposals.length,
    heldProposalIds: Object.freeze(heldProposals),
    learningPromoted: false as const,
    modelCalls: 0,
    remoteCalls: 0,
    humanDecision: 'REQUIRED' as const,
    guardrails: TRAINING_GUARDRAILS,
  });
}