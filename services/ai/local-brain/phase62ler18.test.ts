/**
 * 62L-ER18 — Research Review Board denial + honesty tests.
 *
 * Script: npm run test:62ler18
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ER18_DB_CANDIDATES_STATUS,
  ER18_LOCKS,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_CULTURAL_PRESERVE_FIELDS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_REVIEW_STATES,
  RESEARCH_PROMOTION_FLOW,
  RESEARCH_REVIEW_BOARD_CYCLE,
  RESEARCH_REVIEW_DECISIONS,
  RESEARCH_REVIEW_EVALUATOR_ROLES,
  RESEARCH_REVIEW_FIELDS,
  TECHNICAL_REVIEW_CHECKS,
  assertEr18LocksIntact,
  er18SoftWireSnapshot,
  type Er18Actor,
} from './research-review-board-types.ts';

import {
  attemptBeliefAsScientificFact,
  attemptEnableL4Autonomy,
  attemptHiddenChainOfThought,
  attemptSelfApproval,
  createEmptyReviewBoardStore,
  defaultBoardSeats,
  enforceQuantumClassification,
  exampleResearchArtifact,
  probeGuardianRlsTenantUniverseIsolation,
  promoteAfterBoardDecision,
  quarantineUnclearOrIllicitRights,
  requireHumanApproval,
  returnEr18EvidenceToHomeBase,
  runBoardReview,
  runResearchReviewBoardCycle,
  submitResearchArtifact,
} from './research-review-board-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er18Actor = {
  kind: 'research_agent',
  id: 'research-1',
  orgId: 'org-er18',
  tenantId: 'ten-er18',
  universeId: 'uni-er18',
  permissions: ['draft'],
};

const human: Er18Actor = {
  kind: 'human_escalation_gate',
  id: 'human-1',
  orgId: 'org-er18',
  tenantId: 'ten-er18',
  universeId: 'uni-er18',
  permissions: ['approve_consequential'],
};

function mkReviewer(kind: Er18Actor['kind'], id: string): Er18Actor {
  return {
    kind,
    id,
    orgId: agent.orgId,
    tenantId: agent.tenantId,
    universeId: agent.universeId,
    permissions: ['review'],
  };
}

const reviewers = {
  provenance: mkReviewer('provenance_reviewer', 'rev-prov-1'),
  rights: mkReviewer('data_rights_reviewer', 'rev-rights-1'),
  technical: mkReviewer('technical_evidence_reviewer', 'rev-tech-1'),
  historical: mkReviewer('historical_context_reviewer', 'rev-hist-1'),
  cultural: mkReviewer('cultural_context_reviewer', 'rev-cult-1'),
  benchmark: mkReviewer('benchmark_reproducibility_reviewer', 'rev-bench-1'),
  security: mkReviewer('security_privacy_reviewer', 'rev-sec-1'),
  quantum: mkReviewer('quantum_evidence_reviewer', 'rev-q-1'),
  domain: mkReviewer('domain_specialist_reviewer', 'rev-dom-1'),
};

test('SoT label ER18 / #162; Research Review Board; next ER19 Knowledge Deduplication', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER18');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Research Review Board/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER19/);
  assert.match(NEXT_PHASE_TITLE, /Knowledge Deduplication Graph/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; no self-approval; belief≠fact; DB NOT_APPLIED', () => {
  assert.equal(assertEr18LocksIntact(), true);
  assert.equal(ER18_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER18_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER18_LOCKS.SELF_APPROVAL, false);
  assert.equal(ER18_LOCKS.BELIEF_EQ_SCIENTIFIC_FACT, false);
  assert.equal(ER18_LOCKS.STRONGER_QUANTUM_LANGUAGE_WITHOUT_EVIDENCE, false);
  assert.equal(ER18_LOCKS.PROMOTE_UNCLEAR_RIGHTS, false);
  assert.equal(ER18_LOCKS.TIP_LAND, false);
  assert.equal(ER18_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(attemptEnableL4Autonomy().denied, true);
  assert.equal(attemptHiddenChainOfThought().denied, true);
});

test('roles + fields + decisions + promotion flow + quantum states encoded', () => {
  assert.equal(RESEARCH_REVIEW_EVALUATOR_ROLES.length, 10);
  assert.ok(
    RESEARCH_REVIEW_EVALUATOR_ROLES.includes('Provenance Reviewer'),
  );
  assert.ok(
    RESEARCH_REVIEW_EVALUATOR_ROLES.includes('Quantum Evidence Reviewer'),
  );
  assert.ok(
    RESEARCH_REVIEW_EVALUATOR_ROLES.includes('Human Escalation Gate'),
  );
  assert.equal(RESEARCH_REVIEW_FIELDS.length, 14);
  assert.ok(RESEARCH_REVIEW_FIELDS.includes('reviewId'));
  assert.ok(RESEARCH_REVIEW_FIELDS.includes('expiryRecheckDate'));
  assert.deepEqual([...RESEARCH_REVIEW_DECISIONS], [
    'APPROVED',
    'APPROVED_WITH_LIMITS',
    'REVIEW_REQUIRED',
    'QUARANTINED',
    'REJECTED',
    'STALE',
  ]);
  assert.deepEqual([...RESEARCH_PROMOTION_FLOW], [
    'research_artifact',
    'rights_review',
    'provenance_review',
    'technical_domain_review',
    'contradiction_check',
    'security_privacy_review',
    'promotion_decision',
    'neural_knowledge_graph',
  ]);
  assert.deepEqual([...QUANTUM_REVIEW_STATES], [
    'THEORETICAL',
    'SIMULATED',
    'QUANTUM_INSPIRED',
    'PHYSICAL_QPU_VERIFIED',
  ]);
  assert.equal(HISTORICAL_CULTURAL_PRESERVE_FIELDS.length, 6);
  assert.equal(TECHNICAL_REVIEW_CHECKS.length, 7);
  assert.ok(RESEARCH_REVIEW_BOARD_CYCLE.includes('deny_self_approval'));
  assert.ok(RESEARCH_REVIEW_BOARD_CYCLE.includes('er17_soft_wire'));
  assert.ok(RESEARCH_REVIEW_BOARD_CYCLE.includes('er16_soft_wire'));
});

test('deny self-approval; quantum stronger language blocked; belief→fact blocked', () => {
  const self = attemptSelfApproval({
    submitterId: agent.id,
    approverId: agent.id,
  });
  assert.equal(self.denied, true);
  assert.match(self.reason, /own research/i);

  const quantumDeny = enforceQuantumClassification({
    claimed: 'PHYSICAL_QPU_VERIFIED',
    supported: 'SIMULATED',
  });
  assert.equal('denied' in quantumDeny, true);

  const quantumOk = enforceQuantumClassification({
    claimed: 'SIMULATED',
    supported: 'SIMULATED',
  });
  assert.equal('ok' in quantumOk, true);

  const beliefDeny = attemptBeliefAsScientificFact({
    historicalCultural: {
      geography: 'Nile',
      era: 'New Kingdom',
      originalSource: 'temple inscription',
      translationContext: 'modern English gloss',
      scholarlyDisagreement: 'open',
      culturalAttribution: 'ancient Egyptian ritual belief',
      treatsBeliefAsScientificFact: true,
    },
  });
  assert.equal('denied' in beliefDeny, true);
});

test('quarantine unclear/illicit rights; private org stays in tenant/Universe', () => {
  for (const rights of [
    'UNCLEAR',
    'RESTRICTED',
    'REVOKED',
    'LEAKED',
    'STOLEN',
  ] as const) {
    const q = quarantineUnclearOrIllicitRights({ rightsState: rights });
    assert.equal(q.denied, true);
    assert.equal(q.state, 'QUARANTINED');
  }
  const ok = quarantineUnclearOrIllicitRights({ rightsState: 'OPEN_LICENSE' });
  assert.equal('ok' in ok, true);

  const rls = probeGuardianRlsTenantUniverseIsolation({
    actor: agent,
    otherTenantId: 'ten-other',
    otherUniverseId: 'uni-other',
  });
  assert.equal(rls.denied, true);
});

test('promote only after APPROVED board decision; human gate required', () => {
  const store = createEmptyReviewBoardStore();
  const artifact = exampleResearchArtifact(agent);
  const submitted = submitResearchArtifact({ actor: agent, store, artifact });
  assert.equal('ok' in submitted, true);

  const board = runBoardReview({
    actor: human,
    store,
    artifactId: artifact.artifactId,
    reviewers: defaultBoardSeats({ reviewers }),
  });
  assert.equal('ok' in board, true);
  if (!('ok' in board)) return;
  assert.ok(
    board.packet.decision === 'APPROVED' ||
      board.packet.decision === 'APPROVED_WITH_LIMITS',
  );

  const selfPromote = promoteAfterBoardDecision({
    actor: agent,
    store,
    reviewId: board.packet.reviewId,
  });
  assert.equal('denied' in selfPromote, true);

  const humanOk = requireHumanApproval({
    actor: human,
    action: 'promote_to_neural_knowledge_graph',
  });
  assert.equal('ok' in humanOk, true);

  const promo = promoteAfterBoardDecision({
    actor: human,
    store,
    reviewId: board.packet.reviewId,
  });
  assert.equal('ok' in promo, true);
  if (!('ok' in promo)) return;
  assert.equal(promo.node.reviewId, board.packet.reviewId);
  assert.equal(promo.packet.promotedToNeuralGraph, true);

  // Unclear rights → QUARANTINED, no promote
  const badStore = createEmptyReviewBoardStore();
  const badArt = {
    ...exampleResearchArtifact(agent),
    artifactId: 'art-unclear-1',
    rightsState: 'UNCLEAR' as const,
  };
  submitResearchArtifact({ actor: agent, store: badStore, artifact: badArt });
  const badBoard = runBoardReview({
    actor: human,
    store: badStore,
    artifactId: badArt.artifactId,
    reviewers: defaultBoardSeats({ reviewers }),
  });
  assert.equal('ok' in badBoard, true);
  if (!('ok' in badBoard)) return;
  assert.equal(badBoard.packet.decision, 'QUARANTINED');
  const badPromo = promoteAfterBoardDecision({
    actor: human,
    store: badStore,
    reviewId: badBoard.packet.reviewId,
  });
  assert.equal('denied' in badPromo, true);
});

test('cycle soft-wires ER17/ER16 strongly (WAITING_DATA ok); ER6/ER2/ER1 present; receipt', () => {
  const snap = er18SoftWireSnapshot(repoRoot);
  // Strong soft-wire targets may be absent → WAITING_DATA (not FAIL)
  assert.equal(typeof snap.er17AutonomousResearchSwarm.present, 'boolean');
  assert.equal(typeof snap.er16LearningReturnReceipt.present, 'boolean');
  assert.equal(snap.er6HistoricalBusinessCaseAtlasV2.present, true);
  assert.equal(snap.er2ApiTruthStateMachine.present, true);
  assert.equal(snap.er1RealApiConnectionRegistry.present, true);

  const cycle = runResearchReviewBoardCycle({
    actor: agent,
    human,
    repoRoot,
    reviewers,
  });
  const er17 = cycle.hops.find((h) => h.hop === 'er17_soft_wire');
  const er16 = cycle.hops.find((h) => h.hop === 'er16_soft_wire');
  assert.ok(er17);
  assert.ok(er16);
  assert.ok(er17.state === 'PASS' || er17.state === 'WAITING_DATA');
  assert.ok(er16.state === 'PASS' || er16.state === 'WAITING_DATA');
  assert.notEqual(er17.state, 'FAIL');
  assert.notEqual(er16.state, 'FAIL');

  const er6 = cycle.hops.find((h) => h.hop === 'er6_soft_wire');
  assert.ok(er6);
  assert.equal(er6.state, 'PASS');

  assert.ok(cycle.lastPacket);
  assert.ok(cycle.lastNode);
  const receipt = returnEr18EvidenceToHomeBase({
    reviewId: cycle.lastPacket!.reviewId,
    decision: cycle.lastPacket!.decision,
  });
  assert.match(receipt.receiptId, /^er18-home-/);
});
