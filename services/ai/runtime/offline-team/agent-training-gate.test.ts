import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import * as gate from './agent-training-gate';
import {
  proposeTrainingRun, evaluateTrainingReadiness, trainingGateSnapshot,
  TRAINING_GATE_POLICY, TRAINING_GUARDRAILS, TrainingRunInput,
} from './agent-training-gate';

const validInput = (epoch: number, agentRoleId = 'research'): TrainingRunInput => ({
  epoch,
  agentRoleId,
  objective: 'Improve bounded local drafting quality for research packs from authorized evidence only.',
  datasetEvidenceRefs: ['evidence:master-plan:12d-116', 'evidence:story:12d-116'],
  operatorAuthorizationRef: 'auth:operator-approval:12d-116',
  rollbackRef: 'rollback:checkpoint-restore:12d-116',
});

test('a valid proposal is held PROPOSED with approved:false and execution blocked until human approval', () => {
  const p = proposeTrainingRun(validInput(1));
  assert.equal(p.kind, 'TRAINING_RUN_PROPOSAL');
  assert.equal(p.status, 'PROPOSED_AWAITING_HUMAN_DECISION');
  assert.equal(p.approved, false);
  assert.equal(p.executionBlockedUntilHumanApproval, true);
  assert.equal(p.humanDecision, 'REQUIRED');
  assert.equal(p.proposalId, 'training-gate:epoch-1:run-1');
  assert.deepEqual([...p.datasetEvidenceRefs], ['evidence:master-plan:12d-116', 'evidence:story:12d-116']);
});

test('every required receipt is enforced: operator authorization and rollback refs cannot be omitted', () => {
  assert.throws(() => proposeTrainingRun({ ...validInput(2), operatorAuthorizationRef: '' }), /operatorAuthorizationRef is REQUIRED/);
  assert.throws(() => proposeTrainingRun({ ...validInput(2), operatorAuthorizationRef: 'x'.repeat(TRAINING_GATE_POLICY.maxOperatorAuthorizationRefChars + 1) }), /operatorAuthorizationRef is REQUIRED/);
  assert.throws(() => proposeTrainingRun({ ...validInput(2), rollbackRef: ' ' }), /rollbackRef is REQUIRED/);
  assert.throws(() => proposeTrainingRun({ ...validInput(2), rollbackRef: 'y'.repeat(TRAINING_GATE_POLICY.maxRollbackRefChars + 1) }), /rollbackRef is REQUIRED/);
});

test('unknown agentRoleId is rejected against the live enterprise factory', () => {
  assert.throws(() => proposeTrainingRun(validInput(3, 'no_such_agent_role')), /unknown agentRoleId/);
});

test('dataset evidence refs must be distinct and bounded', () => {
  assert.throws(() => proposeTrainingRun({ ...validInput(4), datasetEvidenceRefs: [] }), /evidence refs/);
  assert.throws(() => proposeTrainingRun({ ...validInput(4), datasetEvidenceRefs: ['evidence:a', 'evidence:a'] }), /must be distinct/);
  assert.throws(() => proposeTrainingRun({ ...validInput(4), datasetEvidenceRefs: ['e'.repeat(TRAINING_GATE_POLICY.maxEvidenceRefChars + 1)] }), /evidence refs/);
  assert.throws(() => proposeTrainingRun({
    ...validInput(4),
    datasetEvidenceRefs: Array.from({ length: TRAINING_GATE_POLICY.maxDatasetEvidenceRefs + 1 }, (_, i) => `evidence:overflow-${i}`),
  }), /evidence refs/);
});

test('epochs are bounded and each epoch holds at most maxProposedTrainingRunsPerEpoch proposals', () => {
  assert.throws(() => proposeTrainingRun(validInput(0)), /training epoch/);
  assert.throws(() => proposeTrainingRun(validInput(TRAINING_GATE_POLICY.maxTrainingEpoch + 1)), /training epoch/);
  for (let i = 0; i < TRAINING_GATE_POLICY.maxProposedTrainingRunsPerEpoch; i++) {
    proposeTrainingRun({ ...validInput(5), objective: `bounded objective variant ${i}` });
  }
  assert.throws(() => proposeTrainingRun({ ...validInput(5), objective: 'one proposal too many for this epoch' }), /use the next epoch/);
});

test('readiness is pure, never ready, and lists HUMAN_APPROVAL as the first gap', () => {
  const p = proposeTrainingRun(validInput(6));
  const readiness = evaluateTrainingReadiness(p);
  assert.equal(readiness.ready, false);
  assert.equal(readiness.humanDecision, 'REQUIRED');
  assert.equal(readiness.gaps[0], 'HUMAN_APPROVAL_REQUIRED');
  assert.ok(readiness.gaps.includes('OPERATOR_AUTHORIZATION_VERIFICATION_REQUIRED'));
  assert.ok(readiness.gaps.includes('DATASET_EVIDENCE_VERIFICATION_REQUIRED'));
  assert.throws(() => evaluateTrainingReadiness({} as never), /proposal is required/);
});

test('no outcome-recording path exists: the module cannot claim a model was trained', () => {
  assert.equal('recordTrainingOutcome' in gate, false);
  assert.equal((gate as Record<string, unknown>).recordTrainingOutcome, undefined);
  assert.equal(trainingGateSnapshot().runsStarted, 0);
  assert.equal(trainingGateSnapshot().weightsMutated, 0);
});

test('the snapshot stays honest and policy/guardrails are frozen with no promotion path', () => {
  const s = trainingGateSnapshot();
  assert.equal(s.liveAgentCount, null);
  assert.equal(s.learningPromoted, false);
  assert.equal(s.modelCalls, 0);
  assert.equal(s.remoteCalls, 0);
  assert.equal(s.humanDecision, 'REQUIRED');
  assert.equal(s.proposalsHeld >= 1, true);
  assert.ok(s.heldProposalIds.includes('training-gate:epoch-1:run-1'));
  assert.equal(Object.isFrozen(TRAINING_GATE_POLICY), true);
  assert.equal(Object.isFrozen(TRAINING_GUARDRAILS), true);
  assert.equal(TRAINING_GUARDRAILS.promotesLearning, false);
  assert.equal(TRAINING_GUARDRAILS.mutatesModelWeights, false);
  assert.equal(TRAINING_GUARDRAILS.automaticRecovery, false);
  assert.equal(TRAINING_GUARDRAILS.humanDecision, 'REQUIRED');
});