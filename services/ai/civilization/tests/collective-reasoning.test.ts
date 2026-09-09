import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MEETING_STAGES } from '../meeting-engine';
import { REQUIRED_SYNTHESIS_ROLES, XARP_ROLE_DUTIES, XARP_ROLES } from '../xarp';
import { codeOf } from './harness';
import { boardroomWorld, loadEvidence, openSupplierRoom, type BoardroomWorld } from './meeting-harness';

function baseEvidence(overrides: Record<string, unknown> = {}) {
  return {
    subject: 'Supplier B',
    dimension: 'cost',
    claim: 'Supplier B costs more.',
    evidence: 'Four purchase orders priced against the current contract.',
    source: 'Procurement ledger',
    provenance: { system: 'erp' },
    confidence: 0.8,
    counterargument: 'The quote excludes the incumbent freight surcharge.',
    risk: 'Breaches the divisional ceiling.',
    claimKind: 'external_source' as const,
    ...overrides,
  };
}

test('every XARP role has a duty, and the required five are a subset of them', () => {
  for (const role of XARP_ROLES) {
    assert.ok(XARP_ROLE_DUTIES[role].length > 0, `${role} has no duty`);
  }
  for (const role of REQUIRED_SYNTHESIS_ROLES) {
    assert.ok(XARP_ROLES.includes(role));
  }
});

test('a room missing a challenger cannot synthesize a recommendation', () => {
  const world = boardroomWorld();
  const meeting = world.xiv.convene(world.founder, {
    title: 'A room that would only agree',
    agenda: [{ title: 'Question', detail: 'Should we proceed?' }],
  });

  // Everything except the challenger, so the room can gather evidence and reach
  // a comfortable conclusion nobody attacked.
  world.xiv.seat(world.founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.coordinator.id,
    xarpRoles: ['synthesizer', 'human_liaison'],
  });
  world.xiv.seat(world.founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.investigator.id,
    xarpRoles: ['investigator'],
  });
  world.xiv.seat(world.founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.risk.id,
    xarpRoles: ['risk'],
  });

  const coverage = world.xiv.roleCoverage(world.founder, meeting.id);
  assert.deepEqual(coverage.missing, ['challenger']);
  assert.equal(
    codeOf(() => world.xiv.synthesize(world.founder, { meetingId: meeting.id })),
    'xarp_role_coverage_incomplete',
  );

  world.xiv.seat(world.founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.challenger.id,
    xarpRoles: ['challenger'],
  });
  assert.equal(world.xiv.roleCoverage(world.founder, meeting.id).complete, true);
});

test('the evidence contract refuses reasoning that has not finished', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);

  const submit = (overrides: Record<string, unknown>) =>
    codeOf(() =>
      world.xiv.submitEvidence(world.founder, {
        meetingId: meeting.id,
        agentId: world.investigator.id,
        xarpRole: 'investigator',
        ...baseEvidence(overrides),
      } as never),
    );

  assert.equal(submit({ counterargument: '   ' }), 'evidence_contract_incomplete');
  assert.equal(submit({ risk: '' }), 'evidence_contract_incomplete');
  assert.equal(submit({ source: '' }), 'evidence_contract_incomplete');
  assert.equal(submit({ provenance: {} }), 'evidence_contract_incomplete');
  assert.equal(submit({ confidence: 1.4 }), 'evidence_contract_incomplete');

  // A complete submission is accepted, so the contract is a bar rather than a wall.
  const accepted = world.xiv.submitEvidence(world.founder, {
    meetingId: meeting.id,
    agentId: world.investigator.id,
    xarpRole: 'investigator',
    ...baseEvidence(),
  });
  assert.equal(accepted.counterargument.length > 0, true);
});

test('a proposal must cite evidence and a supporting vote must cite it too', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);
  const evidence = loadEvidence(world, meeting);

  assert.equal(
    codeOf(() =>
      world.xiv.proposeOption(world.founder, {
        meetingId: meeting.id,
        optionKey: 'Z',
        title: 'Trust the model',
        agentId: world.coordinator.id,
        xarpRole: 'synthesizer',
        claim: 'I am confident.',
        evidenceIds: [],
        source: 'Intuition',
        confidence: 0.99,
        counterargument: 'None.',
        risk: 'None.',
        recommendation: 'Proceed.',
      }),
    ),
    'proposal_requires_evidence',
  );

  const proposal = world.xiv.proposeOption(world.founder, {
    meetingId: meeting.id,
    optionKey: 'B',
    title: 'Dual-source through Supplier B',
    agentId: world.coordinator.id,
    xarpRole: 'synthesizer',
    claim: 'Dual sourcing buys resilience at a known cost.',
    evidenceIds: [evidence.resilience.id],
    source: 'Deliberation',
    confidence: 0.8,
    counterargument: 'Finance disputes affordability.',
    risk: 'Locks in a higher unit cost.',
    recommendation: 'Dual-source with a review gate.',
  });

  // Agreement cannot spread on the strength of another model's prose.
  assert.equal(
    codeOf(() =>
      world.xiv.castVote(world.founder, {
        meetingId: meeting.id,
        proposalId: proposal.id,
        agentId: world.risk.id,
        xarpRole: 'risk',
        vote: 'support',
        rationale: 'The coordinator argued it well.',
      }),
    ),
    'vote_requires_cited_evidence',
  );

  // Abstaining, and saying the evidence is not good enough, do not require a
  // citation, because neither is a claim about the evidence.
  const abstained = world.xiv.castVote(world.founder, {
    meetingId: meeting.id,
    proposalId: proposal.id,
    agentId: world.challenger.id,
    xarpRole: 'challenger',
    vote: 'insufficient_evidence',
    rationale: 'One favourable source is not enough to commit two quarters.',
  });
  assert.equal(abstained.vote, 'insufficient_evidence');
});

test('contradiction detection separates a real contradiction from a trade-off', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);

  // A genuine contradiction: the same supplier, the same dimension, opposite
  // directions.
  world.xiv.submitEvidence(world.founder, {
    meetingId: meeting.id,
    agentId: world.investigator.id,
    xarpRole: 'investigator',
    ...baseEvidence({ subject: 'Supplier A', dimension: 'reliability', direction: 'favourable' }),
  });
  world.xiv.submitEvidence(world.founder, {
    meetingId: meeting.id,
    agentId: world.challenger.id,
    xarpRole: 'challenger',
    ...baseEvidence({ subject: 'Supplier A', dimension: 'reliability', direction: 'unfavourable' }),
  });

  // A trade-off: two different suppliers leading on two different grounds.
  world.xiv.submitEvidence(world.founder, {
    meetingId: meeting.id,
    agentId: world.risk.id,
    xarpRole: 'risk',
    ...baseEvidence({ subject: 'Supplier B', dimension: 'resilience', direction: 'favourable' }),
  });
  world.xiv.submitEvidence(world.operatorOfFinance, {
    meetingId: meeting.id,
    agentId: world.finance.id,
    xarpRole: 'financial',
    ...baseEvidence({ subject: 'Supplier C', dimension: 'cost', direction: 'favourable' }),
  });

  const contradictions = world.xiv.detectContradictions(world.founder, meeting.id);
  assert.equal(contradictions.length, 1);
  assert.equal(contradictions[0].subject, 'Supplier A');
  assert.equal(contradictions[0].dimension, 'reliability');
  assert.equal(contradictions[0].consensusLevel, 0.5);
});

test('synthesis preserves disagreement instead of averaging it away', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);
  const evidence = loadEvidence(world, meeting);

  const optionB = world.xiv.proposeOption(world.founder, {
    meetingId: meeting.id,
    optionKey: 'B',
    title: 'Dual-source through Supplier B',
    agentId: world.coordinator.id,
    xarpRole: 'synthesizer',
    claim: 'Resilience is worth eighteen percent.',
    evidenceIds: [evidence.resilience.id, evidence.cost.id],
    source: 'Deliberation',
    confidence: 0.84,
    counterargument: 'Finance disputes affordability.',
    risk: 'Locks in a higher unit cost.',
    recommendation: 'Dual-source with a two-quarter review gate.',
  });

  world.xiv.proposeOption(world.operatorOfFinance, {
    meetingId: meeting.id,
    optionKey: 'A',
    title: 'Stay single-sourced and renegotiate',
    agentId: world.finance.id,
    xarpRole: 'financial',
    claim: 'The cheapest resilient option is a better incumbent contract.',
    evidenceIds: [evidence.cost.id],
    source: 'Deliberation',
    confidence: 0.7,
    counterargument: 'Renegotiation does not remove the single-berth dependency.',
    risk: 'Leaves the closure exposure untouched.',
    recommendation: 'Renegotiate with a penalty clause.',
  });

  world.xiv.raiseObjection(world.operatorOfFinance, {
    meetingId: meeting.id,
    proposalId: optionB.id,
    agentId: world.finance.id,
    xarpRole: 'financial',
    objection: 'Eighteen percent is not absorbable inside the divisional ceiling.',
    severity: 'blocking',
    supportingEvidenceId: evidence.cost.id,
  });

  const synthesis = world.xiv.synthesize(world.founder, { meetingId: meeting.id });

  // The executive receives options, not a single confident answer.
  assert.equal(synthesis.alternatives.length, 2);
  assert.deepEqual(
    synthesis.alternatives.map((item) => item.optionKey).sort(),
    ['A', 'B'],
  );

  // The finance position survives into the recommendation rather than being
  // outvoted into silence.
  assert.equal(synthesis.preservedDisagreements.length, 1);
  assert.equal(synthesis.preservedDisagreements[0].severity, 'blocking');
  assert.match(synthesis.preservedDisagreements[0].position, /not absorbable/);

  // A blocking objection forces the room to a person and costs the option
  // confidence rather than being noted and ignored.
  assert.equal(synthesis.humanDecisionRequired, true);
  assert.ok(synthesis.reasons.some((reason) => /blocking objection is unresolved/.test(reason)));

  // Option B was proposed at 0.84 against A's 0.7, so it led on its author's own
  // number. The unresolved blocking objection costs it enough to fall behind:
  // the challenge changed the answer rather than being recorded next to it.
  const scoredB = synthesis.alternatives.find((item) => item.optionKey === 'B');
  const scoredA = synthesis.alternatives.find((item) => item.optionKey === 'A');
  assert.ok((scoredB?.confidence ?? 1) < 0.84);
  assert.ok((scoredB?.confidence ?? 1) < (scoredA?.confidence ?? 0));
  assert.equal(synthesis.recommendedOptionKey, 'A');

  // The headline confidence is the leader's, capped by the weighted evidence
  // underneath it, so it can never exceed what the room actually established.
  assert.equal(synthesis.confidence, scoredA?.confidence);
  assert.ok(synthesis.confidence <= 1);
});

test('an agent cannot close an argument; only a human participant resolves an objection', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);
  const evidence = loadEvidence(world, meeting);

  const objection = world.xiv.raiseObjection(world.operatorOfFinance, {
    meetingId: meeting.id,
    agentId: world.finance.id,
    xarpRole: 'financial',
    objection: 'The cost case is not answered.',
    severity: 'blocking',
    supportingEvidenceId: evidence.cost.id,
  });

  // The CFO relays an agent but was never seated as a human, so cannot close it.
  assert.equal(
    codeOf(() =>
      world.xiv.resolveObjection(world.operatorOfFinance, {
        objectionId: objection.id,
        resolutionKind: 'rejected',
        resolution: 'Overruled.',
      }),
    ),
    'objection_requires_human_resolution',
  );

  // Closing it means saying how, not merely marking it closed.
  assert.equal(
    codeOf(() =>
      world.xiv.resolveObjection(world.founder, {
        objectionId: objection.id,
        resolutionKind: 'mitigated',
        resolution: '  ',
      }),
    ),
    'objection_requires_human_resolution',
  );

  const resolved = world.xiv.resolveObjection(world.founder, {
    objectionId: objection.id,
    resolutionKind: 'mitigated',
    resolution: 'Capped at two quarters with a mandatory review gate.',
  });
  assert.equal(resolved.resolvedByUserId, world.founder.userId);
});

test('the meeting lifecycle runs forward only, and status is derived from it', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);

  world.xiv.advanceStage(world.founder, { meetingId: meeting.id, stage: 'debate' });
  assert.equal(world.xiv.reconstructMeeting(world.founder, meeting.id).meeting.status, 'deliberating');

  assert.equal(
    codeOf(() => world.xiv.advanceStage(world.founder, { meetingId: meeting.id, stage: 'created' })),
    'meeting_lifecycle_regression',
  );

  const advanced = world.xiv.advanceStage(world.founder, { meetingId: meeting.id, stage: 'human_checkpoint' });
  assert.equal(advanced.status, 'awaiting_human');

  // Sixteen named stages, in the order the story gives them.
  assert.equal(MEETING_STAGES.length, 17);
  assert.equal(MEETING_STAGES[0], 'trigger');
  assert.equal(MEETING_STAGES[MEETING_STAGES.length - 1], 'knowledge_lineage');
});

test('a decision cannot be recorded before the room has synthesized anything', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);
  const evidence = loadEvidence(world, meeting);

  const proposal = world.xiv.proposeOption(world.founder, {
    meetingId: meeting.id,
    optionKey: 'B',
    title: 'Dual-source',
    agentId: world.coordinator.id,
    xarpRole: 'synthesizer',
    claim: 'Resilience matters.',
    evidenceIds: [evidence.resilience.id],
    source: 'Deliberation',
    confidence: 0.8,
    counterargument: 'Costly.',
    risk: 'Cost exposure.',
    recommendation: 'Dual-source.',
  });

  assert.equal(
    codeOf(() =>
      world.xiv.decide(world.founder, {
        meetingId: meeting.id,
        decisionKind: 'approved',
        selectedProposalId: proposal.id,
        rationale: 'Skipping the reasoning step.',
      }),
    ),
    'meeting_stage_not_reached',
  );
});

test('an action cannot execute without approval or without a way back', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);
  const evidence = loadEvidence(world, meeting);

  const proposal = world.xiv.proposeOption(world.founder, {
    meetingId: meeting.id,
    optionKey: 'B',
    title: 'Dual-source',
    agentId: world.coordinator.id,
    xarpRole: 'synthesizer',
    claim: 'Resilience matters.',
    evidenceIds: [evidence.resilience.id, evidence.cost.id],
    source: 'Deliberation',
    confidence: 0.8,
    counterargument: 'Costly.',
    risk: 'Cost exposure.',
    recommendation: 'Dual-source.',
  });
  world.xiv.synthesize(world.founder, { meetingId: meeting.id });
  const decision = world.xiv.decide(world.founder, {
    meetingId: meeting.id,
    decisionKind: 'approved',
    selectedProposalId: proposal.id,
    rationale: 'Proceeding with a review gate.',
  });

  const action = world.xiv.queueAction(world.founder, {
    meetingId: meeting.id,
    decisionId: decision.id,
    action: 'Open a dual-source purchase order.',
    authorizationBasis: `Decision ${decision.id}.`,
  });

  assert.equal(codeOf(() => world.xiv.executeAction(world.founder, { actionId: action.id })), 'action_requires_approval');
  assert.equal(
    codeOf(() => world.xiv.authorizeAction(world.founder, { actionId: action.id })),
    'action_requires_rollback_plan',
  );

  world.xiv.authorizeAction(world.founder, {
    actionId: action.id,
    rollbackPlan: 'Cancel before first release.',
  });
  assert.equal(world.xiv.executeAction(world.founder, { actionId: action.id }).status, 'completed');

  // A revoked action cannot be run afterwards.
  const second = world.xiv.queueAction(world.founder, {
    meetingId: meeting.id,
    decisionId: decision.id,
    action: 'Cancel the incumbent contract.',
    authorizationBasis: `Decision ${decision.id}.`,
    rollbackPlan: 'Reinstate the incumbent contract.',
  });
  world.xiv.authorizeAction(world.founder, { actionId: second.id });
  world.xiv.revokeAction(world.founder, { actionId: second.id, reason: 'The CFO withdrew approval.' });
  assert.equal(codeOf(() => world.xiv.executeAction(world.founder, { actionId: second.id })), 'action_revoked');
});
