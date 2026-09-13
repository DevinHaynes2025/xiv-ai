import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { ENTERPRISE_WORKFORCE } from './enterprise-workforce';
import {
  proposeTaskforceExpansion, expansionReadiness, expansionSnapshot,
  TASKFORCE_EXPANSION_POLICY, TASKFORCE_EXPANSION_GUARDRAILS,
} from './taskforce-expansion';

const proposedRole = (roleId: string) => ({
  roleId,
  mission: `Draft bounded ${roleId} outputs from authorized evidence without production writes.`,
  requestedReviewerRoleIds: ['secure_code_reviewer', 'release_verifier'],
  evidenceRefs: ['evidence:master-plan:12d-111', 'evidence:story:12d-111'],
});

test('a valid proposal references designated reviewers that already exist in the live factory', () => {
  const p = proposeTaskforceExpansion({
    epoch: 1, proposedBy: 'ceo-directive:12d-111',
    roles: [proposedRole('brain_consolidation_steward'), proposedRole('device_fleet_auditor')],
  });
  assert.equal(p.kind, 'TASKFORCE_ROSTER_EXPANSION_PROPOSAL');
  assert.equal(p.status, 'PROPOSED_AWAITING_HUMAN_DECISION');
  assert.equal(p.humanDecision, 'REQUIRED');
  assert.equal(p.roles.length, 2);
  for (const r of p.roles) for (const reviewer of r.requestedReviewerRoleIds) {
    assert.ok(ENTERPRISE_WORKFORCE.some(w => w.id === reviewer && w.reviewerIds.length > 0));
  }
});

test('unknown, non-designated, colliding, duplicate, and self-reviewing wiring is rejected', () => {
  const epoch = 2;
  const submit = (roles: readonly unknown[]) => proposeTaskforceExpansion({ epoch, proposedBy: 'ceo-directive:12d-111', roles: roles as never });
  assert.throws(() => submit([proposedRole('new_steward'), { ...proposedRole('pathway_mapper'), requestedReviewerRoleIds: ['secure_code_reviewer', 'no_such_role'] }]), /unknown reviewer role/);
  assert.throws(() => submit([{ ...proposedRole('local_reasoner_shadow'), requestedReviewerRoleIds: ['secure_code_reviewer', 'local_reasoner'] }]), /not a designated reviewer/);
  assert.throws(() => submit([proposedRole('local_reasoner')]), /collides with an existing live factory role/);
  assert.throws(() => submit([proposedRole('twin_steward'), proposedRole('twin_steward')]), /duplicate roleId/);
  assert.throws(() => submit([{ ...proposedRole('self_reviewer'), requestedReviewerRoleIds: ['secure_code_reviewer', 'pathway_mapper'] }, proposedRole('pathway_mapper')]), /self-review rejected/);
});

test('batches, text, evidence, epochs, and duplicate epochs are bounded', () => {
  const epoch = 3;
  const nine = Array.from({ length: TASKFORCE_EXPANSION_POLICY.maxProposedRolesPerRequest + 1 }, (_, i) => proposedRole(`overflow_role_${i}`));
  assert.throws(() => proposeTaskforceExpansion({ epoch, proposedBy: 'ceo', roles: nine }), /bounded proposal batch/);
  assert.throws(() => proposeTaskforceExpansion({ epoch, proposedBy: 'ceo', roles: [{ ...proposedRole('long_mission_role'), mission: 'x'.repeat(TASKFORCE_EXPANSION_POLICY.maxMissionChars + 1) }] }), /bounded text/);
  assert.throws(() => proposeTaskforceExpansion({ epoch, proposedBy: 'ceo', roles: [{ ...proposedRole('no_evidence_role'), evidenceRefs: [] }] }), /evidence refs/);
  assert.throws(() => proposeTaskforceExpansion({ epoch: 0, proposedBy: 'ceo', roles: [proposedRole('epoch_zero_role')] }), /epoch/);
  assert.throws(() => proposeTaskforceExpansion({ epoch: TASKFORCE_EXPANSION_POLICY.maxExpansionEpoch + 1, proposedBy: 'ceo', roles: [proposedRole('epoch_big_role')] }), /epoch/);
  const p = proposeTaskforceExpansion({ epoch, proposedBy: 'ceo', roles: [proposedRole('epoch_three_role')] });
  assert.throws(() => proposeTaskforceExpansion({ epoch: p.epoch, proposedBy: 'ceo', roles: [proposedRole('epoch_three_again')] }), /already holds a proposal/);
});

test('readiness never clears a role and lists human approval as the first gap', () => {
  const p = proposeTaskforceExpansion({
    epoch: 4, proposedBy: 'ceo-directive:12d-111',
    roles: [proposedRole('brain_consolidation_steward2'), proposedRole('device_fleet_auditor2')],
  });
  const readiness = expansionReadiness(p);
  assert.equal(readiness.allReady, false);
  assert.equal(readiness.readyRoleCount, 0);
  assert.equal(readiness.humanDecision, 'REQUIRED');
  for (const r of readiness.perRole) {
    assert.equal(r.ready, false);
    assert.equal(r.gaps[0], 'HUMAN_APPROVAL_REQUIRED');
    assert.deepEqual([...r.gaps], ['HUMAN_APPROVAL_REQUIRED', 'STAFFING_PLAN_REQUIRED', 'REVIEWER_WIRING_ADVISORY_UNTIL_HUMAN_RATIFICATION']);
  }
  assert.throws(() => expansionReadiness({} as never), /proposal is required/);
});

test('the snapshot stays honest: nothing is live, no agents started, no fabricated counts', () => {
  const s = expansionSnapshot();
  assert.equal(s.proposedRolesLive, 0);
  assert.equal(s.agentsStarted, 0);
  assert.equal(s.liveAgentCount, null);
  assert.equal(s.humanDecision, 'REQUIRED');
  assert.equal(s.liveFactoryRolesUnchanged, ENTERPRISE_WORKFORCE.length);
  assert.equal(s.proposalsHeld, 3);
  assert.ok(s.heldProposalIds.includes('taskforce-expansion:epoch-1'));
});

test('policy and guardrails are frozen and admit no live expansion', () => {
  assert.equal(Object.isFrozen(TASKFORCE_EXPANSION_POLICY), true);
  assert.equal(Object.isFrozen(TASKFORCE_EXPANSION_GUARDRAILS), true);
  assert.equal(TASKFORCE_EXPANSION_GUARDRAILS.startsNoAgentProcess, true);
  assert.equal(TASKFORCE_EXPANSION_GUARDRAILS.modelCallsAllowed, 0);
  assert.equal(TASKFORCE_EXPANSION_GUARDRAILS.remoteCallsAllowed, false);
  assert.equal(TASKFORCE_EXPANSION_GUARDRAILS.rolesAreSparseLogicalUntilStaffed, true);
  assert.equal(TASKFORCE_EXPANSION_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(TASKFORCE_EXPANSION_POLICY.requiredDistinctReviewerRoles, 2);
});