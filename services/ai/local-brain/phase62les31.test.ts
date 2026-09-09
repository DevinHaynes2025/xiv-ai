/**
 * 62L-ES31 — Dynamic Agent Team Builder denial + honesty tests.
 *
 * Script: npm run test:62les31
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  DYNAMIC_AGENT_TEAM_CORE_FLOW,
  DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY,
  ES31_AGENT_BOUNDS,
  ES31_DB_CANDIDATES_STATUS,
  ES31_LOCKS,
  ES_LAYER_TITLE,
  FORBIDDEN_TEAM_AUTHORITY_ACTIONS,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_LOGISTICS_SMALLEST_TEAM_ROLES,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  TEAM_TRACKING_FIELDS,
  assertEs31LocksIntact,
  childProposalAllowed,
  es31SoftWireSnapshot,
  type Es31Actor,
  type MissionTeamRequest,
} from './dynamic-agent-team-builder-types.ts';

import {
  attemptActivateAboveBudget,
  attemptEnableL4Autonomy,
  attemptManagePullRequest,
  attemptOverspawnEveryDepartment,
  attemptSignContracts,
  attemptTipLand,
  buildTeamProposal,
  exampleGovLogisticsMission,
  runDynamicAgentTeamBuilderCycle,
} from './dynamic-agent-team-builder-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const actor: Es31Actor = {
  kind: 'team_builder',
  id: 'es31-builder-1',
  orgId: 'org-es31',
  tenantId: 'ten-es31',
  universeId: 'uni-es31',
  permissions: ['draft', 'analyze', 'recommend'],
};

const scope = {
  tenantId: 'ten-es31',
  universeId: 'uni-es31',
  orgId: 'org-es31',
  crossTenantSharing: false as const,
};

test('SoT label ES31; Dynamic Agent Team Builder; next ES32; no invented issue', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES31');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Dynamic Agent Team Builder/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES32/);
  assert.match(NEXT_PHASE_TITLE, /Mission Decomposition/);
  assert.match(ES_LAYER_TITLE, /Autonomous Research/);
  assert.equal(TEAM_TRACKING_FIELDS.includes('teamId'), true);
  assert.equal(TEAM_TRACKING_FIELDS.includes('revocationState'), true);
  assert.deepEqual(
    [...DYNAMIC_AGENT_TEAM_CORE_FLOW],
    [
      'mission',
      'task_decomposition',
      'required_domains_skills',
      'eligible_agents',
      'trust_capability_check',
      'permission_intersection',
      'cost_compute_check',
      'team_proposal',
      'home_base',
    ],
  );
});

test('honesty locks: L4 false; tip-land/PR denied; DB NOT_APPLIED; team≠contract authority', () => {
  assert.equal(assertEs31LocksIntact(), true);
  assert.equal(ES31_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES31_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES31_LOCKS.TIP_LAND, false);
  assert.equal(ES31_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(ES31_LOCKS.SIGN_CONTRACTS, false);
  assert.equal(ES31_LOCKS.SUBMIT_BIDS, false);
  assert.equal(ES31_LOCKS.MOVE_MONEY, false);
  assert.equal(ES31_LOCKS.CHANGE_PRODUCTION, false);
  assert.equal(ES31_LOCKS.WIDEN_PERMISSIONS, false);
  assert.equal(ES31_LOCKS.CONTROL_VEHICLES_INFRASTRUCTURE, false);
  assert.equal(ES31_AGENT_BOUNDS.l4AutonomyEnabled, false);
  assert.equal(ES31_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(
    DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY.teamProposalNeqContractAuthority,
    true,
  );
  assert.equal(
    DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY.l4AutonomyEnabled,
    false,
  );
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(FORBIDDEN_TEAM_AUTHORITY_ACTIONS.includes('sign_contracts'), true);

  assert.equal(attemptEnableL4Autonomy().denied, true);
  assert.equal(attemptTipLand().denied, true);
  assert.equal(attemptManagePullRequest().denied, true);
  const contractDeny = attemptSignContracts();
  assert.equal(contractDeny.denied, true);
  assert.match(contractDeny.reason, /contract authority/i);
});

test('overspawn denied — prefer smallest qualified gov logistics team', () => {
  const overspawn = attemptOverspawnEveryDepartment();
  assert.equal(overspawn.denied, true);
  assert.match(overspawn.reason, /Overspawn denied/i);

  const mission = exampleGovLogisticsMission(scope);
  mission.attemptOverspawn = true;
  const denied = buildTeamProposal(actor, mission, repoRoot);
  assert.equal('denied' in denied && denied.denied, true);

  const okMission = exampleGovLogisticsMission(scope);
  const proposal = buildTeamProposal(actor, okMission, repoRoot);
  assert.equal('denied' in proposal, false);
  if ('denied' in proposal) return;
  assert.equal(proposal.overspawnDenied, true);
  assert.equal(proposal.contractAuthority, false);
  assert.equal(proposal.l4AutonomyEnabled, false);
  assert.ok(proposal.memberAgents.length <= 5);
  assert.ok(proposal.memberAgents.length >= 5);
  for (const role of GOV_LOGISTICS_SMALLEST_TEAM_ROLES) {
    assert.equal(proposal.selectedRoles.includes(role), true);
  }
  assert.equal(proposal.selectedRoles.includes('HR'), false);
  assert.equal(proposal.selectedRoles.includes('Marketing'), false);
  assert.equal(proposal.selectedRoles.includes('Facilities'), false);
  assert.equal(proposal.state, 'PROPOSED');
});

test('budget overrun → TEAM_PROPOSAL_BLOCKED (or smaller alternative when possible)', () => {
  const mission = exampleGovLogisticsMission(scope);
  mission.computeBudgetUnits = 20; // each agent costs 12; 5×12=60 > 20
  for (const c of mission.candidates) {
    c.costEstimate = {
      ...c.costEstimate,
      totalUnits: 12,
      budgetUnits: 20,
      withinBudget: false,
    };
  }
  const blocked = buildTeamProposal(actor, mission, repoRoot);
  assert.equal('denied' in blocked && blocked.denied, true);
  if (!('denied' in blocked)) return;
  assert.equal(blocked.state, 'TEAM_PROPOSAL_BLOCKED');
  assert.match(blocked.reason, /budget|TEAM_PROPOSAL_BLOCKED/i);

  const activate = attemptActivateAboveBudget();
  assert.equal(activate.denied, true);
  assert.equal(activate.state, 'TEAM_PROPOSAL_BLOCKED');
});

test('child without stop condition denied; valid child bounds allowed', () => {
  const deniedChild = childProposalAllowed({
    needed: true,
    narrowerThanParent: true,
    computeDataBudgetExists: true,
    returnPathDefined: true,
    stopConditionExists: false,
  });
  assert.equal(deniedChild.allowed, false);
  assert.match(deniedChild.reason, /stop condition/i);

  const mission: MissionTeamRequest = exampleGovLogisticsMission(scope);
  mission.childProposal = {
    needed: true,
    narrowerThanParent: true,
    computeDataBudgetExists: true,
    returnPathDefined: true,
    stopConditionExists: false,
  };
  const result = buildTeamProposal(actor, mission, repoRoot);
  assert.equal('denied' in result && result.denied, true);
  if (!('denied' in result)) return;
  assert.match(result.reason, /stop condition|Child/i);

  const ok = childProposalAllowed({
    needed: true,
    narrowerThanParent: true,
    computeDataBudgetExists: true,
    returnPathDefined: true,
    stopConditionExists: true,
  });
  assert.equal(ok.allowed, true);
});

test('team proposal ≠ contract authority; L4 remains false through cycle; soft-wires WAITING_DATA≠FAIL', () => {
  const mission = exampleGovLogisticsMission(scope);
  mission.strongDisagreement = true;
  mission.attemptSignContract = true;
  const contractAttempt = buildTeamProposal(actor, mission, repoRoot);
  assert.equal('denied' in contractAttempt && contractAttempt.denied, true);

  const clean = exampleGovLogisticsMission(scope);
  clean.strongDisagreement = true;
  const cycle = runDynamicAgentTeamBuilderCycle({
    actor,
    request: clean,
    repoRoot,
  });
  assert.equal(cycle.l4AutonomyEnabled, false);
  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.proposal?.contractAuthority, false);
  assert.equal(cycle.proposal?.l4AutonomyEnabled, false);
  assert.equal(cycle.proposal?.conflictHandling.addIndependentEvaluator, true);
  assert.equal(
    cycle.proposal?.conflictHandling.reliedOnlyOnHigherTrust,
    false,
  );
  assert.match(cycle.nextPhase, /ES32/);

  const soft = es31SoftWireSnapshot(repoRoot);
  for (const entry of Object.values(soft)) {
    if (!entry.present) {
      assert.match(entry.note, /WAITING_DATA/);
    }
  }
  const softHops = cycle.hops.filter((h) => h.hop.includes('soft_wire'));
  assert.ok(softHops.length >= 5);
  for (const h of softHops) {
    assert.ok(h.state === 'PASS' || h.state === 'WAITING_DATA');
    assert.notEqual(h.state, 'DENIED');
  }
});
