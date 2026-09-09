/**
 * 62L-ES27 — Capability Composition Engine denial + honesty tests.
 *
 * Script: npm run test:62les27
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  CAPABILITY_COMPOSITION_CORE_FLOW,
  CAPABILITY_COMPOSITION_CYCLE,
  CAPABILITY_COMPOSITION_TRUTH_BOUNDARY,
  COMPATIBILITY_CHECKS,
  COMPOSITION_STATES,
  COMPOSITION_TRACKING_FIELDS,
  ES27_AGENT_BOUNDS,
  ES27_DB_CANDIDATES_STATUS,
  ES27_LOCKS,
  ES27_MAY,
  ES27_MUST_NOT,
  ES_LAYER_TITLE,
  FORBIDDEN_COMPOSITION_ACTIONS,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_CONTRACT_EXPECTED_OUTPUTS,
  GOV_CONTRACT_WORKFLOW_STAGES,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  assertEs27LocksIntact,
  es27SoftWireSnapshot,
  intersectPermissions,
  permissionModeIsIntersection,
  unionPermissions,
  type CertifiedSkill,
  type Es27Actor,
} from './capability-composition-engine-types.ts';

import {
  attemptAutonomousCloudPurchasing,
  attemptAutonomousProductionChanges,
  attemptBidSubmission,
  attemptBudgetExpansion,
  attemptContractSigning,
  attemptCrossTenantDataPooling,
  attemptFabricateDownstreamResults,
  attemptHiddenChainOfThought,
  attemptHiddenToolChaining,
  attemptPaymentAuthority,
  attemptPermissionUnionExpansion,
  attemptRecommendAsAct,
  bootstrapCapabilityCompositionEngine,
  composeWorkflow,
  estimateCompositionCost,
  exampleGovContractAgents,
  exampleGovContractSkills,
  executeBoundedComposition,
  probeGuardianRlsTenantUniverseIsolation,
  propagateSkillRevocation,
  requireHumanApproval,
  returnEvidenceToHomeBase,
  runCapabilityCompositionCycle,
} from './capability-composition-engine-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es27Actor = {
  kind: 'capability_composer',
  id: 'composer-1',
  orgId: 'org-es27',
  tenantId: 'ten-es27',
  universeId: 'uni-es27',
  permissions: ['draft'],
};

const human: Es27Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-es27',
  tenantId: 'ten-es27',
  universeId: 'uni-es27',
  permissions: ['approve_consequential'],
};

function skill(
  partial: Omit<CertifiedSkill, 'certified' | 'revoked' | 'versionCurrent'> & {
    certified?: boolean;
    revoked?: boolean;
    versionCurrent?: boolean;
  },
): CertifiedSkill {
  return {
    ...partial,
    certified: partial.certified ?? true,
    revoked: partial.revoked ?? false,
    versionCurrent: partial.versionCurrent ?? true,
  };
}

test('SoT label ES27; Capability Composition Engine; next ES28 Workflow Graph Optimizer', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES27');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Capability Composition Engine/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES28/);
  assert.match(NEXT_PHASE_TITLE, /Workflow Graph Optimizer/);
  assert.match(ES_LAYER_TITLE, /Certified Skill Marketplace/);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('honesty locks: L4 false; INTERSECTION≠UNION; no bid/contract/payment; DB NOT_APPLIED', () => {
  assert.equal(assertEs27LocksIntact(), true);
  assert.equal(ES27_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES27_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES27_LOCKS.PERMISSION_UNION, false);
  assert.equal(ES27_LOCKS.BID_SUBMISSION, false);
  assert.equal(ES27_LOCKS.CONTRACT_SIGNING, false);
  assert.equal(ES27_LOCKS.PAYMENT_AUTHORITY, false);
  assert.equal(ES27_LOCKS.FABRICATE_DOWNSTREAM_RESULTS, false);
  assert.equal(ES27_LOCKS.AUTONOMOUS_CLOUD_PURCHASING, false);
  assert.equal(ES27_LOCKS.BUDGET_EXPANSION, false);
  assert.equal(ES27_LOCKS.TIP_LAND, false);
  assert.equal(ES27_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(ES27_LOCKS.AUTO_OPEN_PR, false);
  assert.equal(permissionModeIsIntersection(), true);
  assert.equal(
    CAPABILITY_COMPOSITION_TRUTH_BOUNDARY.permissionMode,
    'INTERSECTION',
  );
  assert.equal(
    CAPABILITY_COMPOSITION_TRUTH_BOUNDARY.mayUsePermissionUnion,
    false,
  );
  assert.equal(ES27_AGENT_BOUNDS.automaticAuthority, false);
  assert.ok(ES27_MAY.length > 0);
  assert.ok(ES27_MUST_NOT.includes('use_permission_UNION_or_expand_beyond_intersection'));
  assert.equal(COMPOSITION_STATES.length, 10);
  assert.equal(COMPATIBILITY_CHECKS.length, 7);
  assert.equal(COMPOSITION_TRACKING_FIELDS.length, 16);
  assert.equal(CAPABILITY_COMPOSITION_CORE_FLOW[0], 'user_mission_request');
  assert.equal(CAPABILITY_COMPOSITION_CORE_FLOW.at(-1), 'home_base');
  assert.equal(GOV_CONTRACT_WORKFLOW_STAGES.length, 6);
  assert.equal(GOV_CONTRACT_EXPECTED_OUTPUTS.length, 4);
  assert.equal(FORBIDDEN_COMPOSITION_ACTIONS.length, 10);
  assert.ok(CAPABILITY_COMPOSITION_CYCLE.length >= 35);
});

test('permission INTERSECTION ≠ UNION: read_supplier + draft_contract_analysis ≠ signing/payment', () => {
  const a = skill({
    skillId: 'sk-a',
    name: 'A',
    version: '1.0.0',
    permissions: ['read_supplier'],
    dataScopes: ['supplier'],
    authorizedApis: ['supplier_api'],
    modelsRuntimes: ['local-llm'],
    inputSchema: 'q',
    outputSchema: 'supplier_pack',
    costEstimateUnits: 1,
    evidenceRefs: [],
    testBenchmarkRefs: [],
  });
  const b = skill({
    skillId: 'sk-b',
    name: 'B',
    version: '1.0.0',
    permissions: ['draft_contract_analysis'],
    dataScopes: ['draft'],
    authorizedApis: ['draft_api'],
    modelsRuntimes: ['local-llm'],
    inputSchema: 'supplier_pack',
    outputSchema: 'analysis',
    costEstimateUnits: 1,
    evidenceRefs: [],
    testBenchmarkRefs: [],
  });
  const inter = intersectPermissions([a, b]);
  const uni = unionPermissions([a, b]);
  assert.deepEqual(inter, []);
  assert.ok(uni.includes('read_supplier'));
  assert.ok(uni.includes('draft_contract_analysis'));
  assert.ok(!inter.includes('contract_signing'));
  assert.ok(!inter.includes('payment_authority'));
  assert.ok(!uni.includes('contract_signing'));
  assert.equal(attemptPermissionUnionExpansion().denied, true);

  const composed = composeWorkflow({
    actor: agent,
    compositionId: 'comp-inter-1',
    mission: 'supplier_plus_draft',
    skills: [a, b],
    agents: exampleGovContractAgents(agent).slice(0, 2),
    costBudget: 50,
  });
  assert.ok(!('denied' in composed));
  assert.equal(composed.permissionMode, 'INTERSECTION');
  assert.deepEqual(composed.intersectedPermissions, []);
  assert.ok(composed.unionWouldHaveIncluded.includes('read_supplier'));
  assert.ok(!composed.intersectedPermissions.includes('contract_signing'));
  assert.ok(!composed.intersectedPermissions.includes('payment_authority'));
});

test('gov contract workflow: proposal candidate path; bid submission denied', () => {
  const skills = exampleGovContractSkills();
  assert.equal(skills.length, 6);
  const composed = composeWorkflow({
    actor: agent,
    compositionId: 'comp-gov-1',
    mission: 'gov_contract_proposal_candidate',
    skills,
    agents: exampleGovContractAgents(agent),
    costBudget: 200,
    expectedOutputs: [...GOV_CONTRACT_EXPECTED_OUTPUTS],
  });
  assert.ok(!('denied' in composed));
  assert.equal(composed.bidSubmissionAuthorized, false);
  assert.equal(composed.contractSigningAuthorized, false);
  assert.equal(composed.paymentAuthorityAuthorized, false);
  assert.ok(composed.expectedOutputs.includes('proposal_candidate'));
  assert.ok(composed.expectedOutputs.includes('human_decisions_required'));
  assert.ok(!composed.intersectedPermissions.includes('bid_submission'));
  assert.equal(attemptBidSubmission().denied, true);
  assert.equal(attemptContractSigning().denied, true);
  assert.equal(attemptPaymentAuthority().denied, true);

  const bidAttempt = composeWorkflow({
    actor: agent,
    compositionId: 'comp-bid-deny',
    mission: 'illegal_bid',
    skills,
    agents: exampleGovContractAgents(agent),
    costBudget: 200,
    attemptBidSubmission: true,
  });
  assert.equal('denied' in bidAttempt, true);
});

test('skill fail → PARTIAL/BLOCKED with failure receipt; fabricate denied', () => {
  const skills = exampleGovContractSkills();
  const composed = composeWorkflow({
    actor: agent,
    compositionId: 'comp-fail-1',
    mission: 'gov_contract_proposal_candidate',
    skills,
    agents: exampleGovContractAgents(agent),
    costBudget: 200,
  });
  assert.ok(!('denied' in composed));

  const partial = executeBoundedComposition({
    composition: { ...composed, state: 'EXECUTING' },
    skillResults: {
      'sk-opportunity-research': { ok: true, outputs: ['opportunity_pack'] },
      'sk-requirement-decomposer': {
        ok: false,
        reason: 'decomposer_timeout',
        useFallback: true,
      },
    },
  });
  assert.ok(!('denied' in partial));
  assert.equal(partial.state, 'PARTIAL');
  assert.equal(partial.failureReceipt?.skillId, 'sk-requirement-decomposer');
  assert.equal(partial.failureReceipt?.fabricatedDownstream, false);

  const blocked = executeBoundedComposition({
    composition: { ...composed, state: 'EXECUTING' },
    skillResults: {
      'sk-opportunity-research': { ok: false, reason: 'upstream_fail' },
    },
  });
  assert.ok(!('denied' in blocked));
  assert.equal(blocked.state, 'BLOCKED');

  const fabricate = executeBoundedComposition({
    composition: { ...composed, state: 'EXECUTING' },
    skillResults: {
      'sk-opportunity-research': { ok: false, reason: 'upstream_fail' },
    },
    attemptFabricateOnFailure: true,
  });
  assert.equal('denied' in fabricate, true);
  assert.equal(attemptFabricateDownstreamResults().denied, true);
});

test('revoked component skill → BLOCKED / REVALIDATION_REQUIRED', () => {
  const skills = exampleGovContractSkills();
  const composed = composeWorkflow({
    actor: agent,
    compositionId: 'comp-rev-1',
    mission: 'gov_contract_proposal_candidate',
    skills,
    agents: exampleGovContractAgents(agent),
    costBudget: 200,
  });
  assert.ok(!('denied' in composed));

  const blocked = propagateSkillRevocation({
    composition: composed,
    revokedSkillId: 'sk-compliance-review',
    mode: 'BLOCKED',
  });
  assert.equal(blocked.state, 'BLOCKED');
  assert.equal(blocked.rollbackRevocationState, 'BLOCKED');
  assert.equal(blocked.failureReceipt?.reason, 'component_skill_revoked');

  const reval = propagateSkillRevocation({
    composition: composed,
    revokedSkillId: 'sk-proposal-draft',
    mode: 'REVALIDATION_REQUIRED',
  });
  assert.equal(reval.state, 'REVALIDATION_REQUIRED');
  assert.equal(reval.rollbackRevocationState, 'REVALIDATION_REQUIRED');

  const withRevoked = composeWorkflow({
    actor: agent,
    compositionId: 'comp-rev-2',
    mission: 'gov_contract_proposal_candidate',
    skills: skills.map((s) =>
      s.skillId === 'sk-logistics-solution' ? { ...s, revoked: true } : s,
    ),
    agents: exampleGovContractAgents(agent),
    costBudget: 200,
  });
  assert.ok(!('denied' in withRevoked));
  assert.equal(withRevoked.state, 'BLOCKED');
});

test('cycle soft-wires ES26/ES25/ES19 (WAITING_DATA ok); Home Base when present; L4 false; denies', () => {
  const soft = es27SoftWireSnapshot(repoRoot);
  // ES26/ES25/ES19 expected absent → WAITING_DATA (not FAIL)
  assert.equal(typeof soft.es26SkillMarketplace.present, 'boolean');
  assert.equal(typeof soft.es25SkillCertification.present, 'boolean');
  assert.equal(typeof soft.es19ProductionBoundary.present, 'boolean');
  assert.equal(typeof soft.er16HomeBase.present, 'boolean');
  if (!soft.es26SkillMarketplace.present) {
    assert.match(soft.es26SkillMarketplace.note, /WAITING_DATA/);
  }
  if (!soft.es25SkillCertification.present) {
    assert.match(soft.es25SkillCertification.note, /WAITING_DATA/);
  }
  if (!soft.es19ProductionBoundary.present) {
    assert.match(soft.es19ProductionBoundary.note, /WAITING_DATA/);
  }

  const boot = bootstrapCapabilityCompositionEngine(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const cost = estimateCompositionCost({
    skills: exampleGovContractSkills(),
    costBudget: 200,
  });
  assert.ok(cost.totalUnits > 0);
  assert.equal(cost.autonomousPurchaseAttempted, false);
  assert.equal(cost.budgetExpansionAttempted, false);

  assert.equal(attemptAutonomousCloudPurchasing().denied, true);
  assert.equal(attemptBudgetExpansion().denied, true);
  assert.equal(attemptHiddenToolChaining().denied, true);
  assert.equal(attemptCrossTenantDataPooling().denied, true);
  assert.equal(attemptAutonomousProductionChanges().denied, true);
  assert.equal(attemptHiddenChainOfThought().denied, true);
  assert.equal(attemptRecommendAsAct().denied, true);

  const isolation = probeGuardianRlsTenantUniverseIsolation({
    actor: agent,
    otherTenantId: 'ten-other',
    otherUniverseId: 'uni-other',
  });
  assert.equal('denied' in isolation, true);

  const humanGate = requireHumanApproval({
    approvalId: 'appr-1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in humanGate));
  assert.equal(humanGate.automaticAuthority, false);

  const cycle = runCapabilityCompositionCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 35);
  assert.equal(cycle.receipt.permissionMode, 'INTERSECTION');
  assert.equal(cycle.receipt.bidSubmissionAuthorized, false);
  assert.equal(cycle.receipt.fabricatedDownstream, false);
  assert.equal(ES27_LOCKS.L4_AUTONOMY_ENABLED, false);

  const l4Hop = cycle.hops.find((h) => h.hop === 'l4_autonomy_false');
  assert.ok(l4Hop);
  assert.equal(l4Hop.state, 'PASS');

  const interHop = cycle.hops.find(
    (h) => h.hop === 'permission_intersection_not_union',
  );
  assert.ok(interHop);
  assert.equal(interHop.state, 'PASS');

  const softEs26 = cycle.hops.find((h) => h.hop === 'es26_marketplace_soft_wire');
  assert.ok(softEs26);
  assert.ok(
    softEs26.state === 'PASS' || softEs26.state === 'WAITING_DATA',
  );

  const composed = composeWorkflow({
    actor: agent,
    compositionId: 'comp-home-1',
    mission: 'gov_contract_proposal_candidate',
    skills: exampleGovContractSkills(),
    agents: exampleGovContractAgents(agent),
    costBudget: 200,
  });
  assert.ok(!('denied' in composed));
  const done = executeBoundedComposition({
    composition: { ...composed, state: 'EXECUTING' },
    skillResults: Object.fromEntries(
      exampleGovContractSkills().map((s) => [
        s.skillId,
        { ok: true as const, outputs: [s.outputSchema] },
      ]),
    ),
  });
  assert.ok(!('denied' in done));
  assert.equal(done.state, 'COMPLETED');
  assert.equal(done.mergedEvidence?.preservesSkillProvenance, true);
  const home = returnEvidenceToHomeBase({ actor: agent, composition: done });
  assert.equal(home.returned, true);
  assert.equal(home.authorityGranted, false);
  assert.equal(home.bidSubmissionAuthorized, false);
});
