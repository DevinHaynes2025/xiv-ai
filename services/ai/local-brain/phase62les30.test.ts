/**
 * 62L-ES30 — Agent Reputation & Domain Trust Graph denial + honesty tests.
 *
 * Script: npm run test:62les30
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY,
  DOMAIN_TRUST_MODEL,
  ES30_AGENT_BOUNDS,
  ES30_DB_CANDIDATES_STATUS,
  ES30_LOCKS,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  TRUST_DECREASE_SIGNALS,
  TRUST_INCREASE_SIGNALS,
  TRUST_RECORD_FIELDS,
  TRUST_ROUTING_PATH,
  TRUST_STATES,
  assertEs30LocksIntact,
  domainsAreIsolated,
  es30SoftWireSnapshot,
  mayAutoSuppressLowerTrustWithStrongerEvidence,
  softWireHopState,
  trustGrantsPermissionsOrAuthority,
  trustTransfersAcrossDomains,
  type Es30Actor,
} from './agent-reputation-domain-trust-graph-types.ts';

import {
  applyTrustDecrease,
  applyTrustIncrease,
  assertDomainIsolation,
  attemptEnableL4Autonomy,
  attemptManagePullRequest,
  attemptSelfModifyCertification,
  attemptSelfModifyReviewerHistory,
  attemptSelfModifyTrustScore,
  attemptTipLand,
  attemptTrustGrantsAuthority,
  attemptTrustGrantsPermission,
  candidatesFromRecords,
  exampleLegalUnverified,
  exampleLowerTrustStrongEvidencePair,
  exampleSupplyChainHighTrust,
  lookupDomainTrust,
  registerDomainTrustRecord,
  runAgentReputationDomainTrustGraphCycle,
  selectTeamByTrustGraph,
  weightDissentWithEvidencePrimacy,
} from './agent-reputation-domain-trust-graph-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const authority: Es30Actor = {
  kind: 'trust_graph_authority',
  id: 'trust-auth-1',
  orgId: 'org-es30',
  tenantId: 'ten-es30',
  universeId: 'uni-es30',
  permissions: ['trust_admin'],
};

const homeBase: Es30Actor = {
  kind: 'home_base',
  id: 'home-base-1',
  orgId: 'org-es30',
  tenantId: 'ten-es30',
  universeId: 'uni-es30',
  permissions: ['route'],
};

test('SoT label ES30; Agent Reputation & Domain Trust Graph; next ES31; no invented issue', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES30');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Agent Reputation & Domain Trust Graph/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES31/);
  assert.match(NEXT_PHASE_TITLE, /Dynamic Agent Team Builder/);
  assert.match(ES_LAYER_TITLE, /Reputation & Trust/);
});

test('honesty locks: L4 false; no self-modify; trust≠authority; DB NOT_APPLIED', () => {
  assert.equal(assertEs30LocksIntact(), true);
  assert.equal(ES30_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES30_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES30_LOCKS.SELF_MODIFY_TRUST_SCORE, false);
  assert.equal(ES30_LOCKS.SELF_MODIFY_CERTIFICATION, false);
  assert.equal(ES30_LOCKS.SELF_MODIFY_REVIEWER_HISTORY, false);
  assert.equal(ES30_LOCKS.TRUST_GRANTS_PERMISSIONS, false);
  assert.equal(ES30_LOCKS.TRUST_GRANTS_AUTHORITY, false);
  assert.equal(ES30_LOCKS.CROSS_DOMAIN_TRUST_TRANSFER, false);
  assert.equal(
    ES30_LOCKS.AUTO_SUPPRESS_LOWER_TRUST_WITH_STRONGER_EVIDENCE,
    false,
  );
  assert.equal(ES30_LOCKS.TIP_LAND, false);
  assert.equal(ES30_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ES30_AGENT_BOUNDS.maySelfModifyOwnTrustScore, false);
  assert.equal(ES30_AGENT_BOUNDS.mayGrantPermissionsFromTrust, false);
  assert.equal(ES30_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(
    AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.evidenceRemainsPrimaryOverReputation,
    true,
  );
  assert.equal(
    AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.l4AutonomyEnabled,
    false,
  );
  assert.equal(trustGrantsPermissionsOrAuthority(), false);
  assert.equal(trustTransfersAcrossDomains(), false);
  assert.equal(mayAutoSuppressLowerTrustWithStrongerEvidence(), false);
  assert.equal(attemptEnableL4Autonomy().denied, true);
  assert.equal(attemptTipLand().denied, true);
  assert.equal(attemptManagePullRequest().denied, true);
});

test('trust states + fields + model + routing + signals encoded', () => {
  assert.deepEqual([...TRUST_STATES], [
    'UNVERIFIED',
    'LIMITED_TRUST',
    'DOMAIN_VERIFIED',
    'HIGH_TRUST',
    'DEGRADED',
    'SUSPENDED',
    'REVALIDATION_REQUIRED',
  ]);
  assert.equal(TRUST_RECORD_FIELDS.length, 19);
  assert.ok(TRUST_RECORD_FIELDS.includes('agentId'));
  assert.ok(TRUST_RECORD_FIELDS.includes('skillId'));
  assert.ok(TRUST_RECORD_FIELDS.includes('domain'));
  assert.ok(TRUST_RECORD_FIELDS.includes('trustState'));
  assert.ok(TRUST_RECORD_FIELDS.includes('evidenceRefs'));
  assert.deepEqual([...DOMAIN_TRUST_MODEL], [
    'agent',
    'domain',
    'skill',
    'task',
    'evidence',
    'outcome',
  ]);
  assert.deepEqual([...TRUST_ROUTING_PATH], [
    'mission',
    'required_domain',
    'eligible_agents',
    'trust_graph',
    'capability_cost_availability',
    'team_selection',
  ]);
  assert.ok(TRUST_INCREASE_SIGNALS.includes('independent_tests_pass'));
  assert.ok(TRUST_INCREASE_SIGNALS.includes('reviewers_approve'));
  assert.ok(TRUST_DECREASE_SIGNALS.includes('hallucinations'));
  assert.ok(
    TRUST_DECREASE_SIGNALS.includes('certified_skill_expires_or_regresses'),
  );
});

test('domain isolation: supply_chain HIGH_TRUST ≠ legal HIGH_TRUST', () => {
  const supply = exampleSupplyChainHighTrust(authority);
  assert.equal(supply.domain, 'supply_chain');
  assert.equal(supply.trustState, 'HIGH_TRUST');

  const legal = exampleLegalUnverified(authority, supply.agentId);
  assert.equal(legal.domain, 'legal');
  assert.equal(legal.trustState, 'UNVERIFIED');
  assert.ok(domainsAreIsolated(supply.domain, legal.domain));

  const isolation = assertDomainIsolation({
    supplyChainRecord: supply,
    legalDomain: 'legal',
  });
  assert.ok(!('denied' in isolation));
  if ('denied' in isolation) return;
  assert.equal(isolation.isolated, true);
  assert.equal(isolation.supplyChainTrustDoesNotApplyToLegal, true);

  const records = [supply, legal];
  assert.equal(
    lookupDomainTrust(records, supply.agentId, 'supply_chain')?.trustState,
    'HIGH_TRUST',
  );
  assert.equal(
    lookupDomainTrust(records, supply.agentId, 'legal')?.trustState,
    'UNVERIFIED',
  );
  assert.equal(
    lookupDomainTrust(records, supply.agentId, 'legal')?.trustState ===
      'HIGH_TRUST',
    false,
  );
});

test('self-modify trust/certification/reviewer history denied', () => {
  const supply = exampleSupplyChainHighTrust(authority);
  const subject: Es30Actor = {
    kind: 'subject_agent',
    id: supply.agentId,
    orgId: authority.orgId,
    tenantId: authority.tenantId,
    universeId: authority.universeId,
    permissions: [],
  };

  assert.equal(
    attemptSelfModifyTrustScore({
      actor: subject,
      record: supply,
      desiredState: 'HIGH_TRUST',
    }).denied,
    true,
  );
  assert.equal(
    attemptSelfModifyCertification({ actor: subject, record: supply }).denied,
    true,
  );
  assert.equal(
    attemptSelfModifyReviewerHistory({ actor: subject, record: supply })
      .denied,
    true,
  );

  const selfIncrease = applyTrustIncrease({
    actor: subject,
    record: supply,
    signal: 'independent_tests_pass',
    evidenceRef: 'ev-self',
    subjectAgentId: subject.id,
  });
  assert.ok('denied' in selfIncrease);
  assert.equal(selfIncrease.denied, true);
});

test('lower-trust agent with stronger evidence is NOT auto-suppressed', () => {
  const pair = exampleLowerTrustStrongEvidencePair(authority);
  assert.ok(pair.lowerEvidence.strength > pair.higherEvidence.strength);
  assert.notEqual(pair.lowerTrust.trustState, 'HIGH_TRUST');
  assert.equal(pair.higherTrust.trustState, 'HIGH_TRUST');

  const decision = weightDissentWithEvidencePrimacy({
    lowerTrustRecord: pair.lowerTrust,
    higherTrustRecord: pair.higherTrust,
    lowerTrustEvidence: pair.lowerEvidence,
    higherTrustEvidence: pair.higherEvidence,
  });
  assert.ok(!('denied' in decision));
  if ('denied' in decision) return;
  assert.equal(decision.suppressed, false);
  assert.equal(decision.evidencePrimary, true);
  assert.equal(decision.reputationInfluencesConfidence, true);
  assert.match(decision.reason, /NOT auto-suppressed|evidence remains primary/i);
});

test('trust does not grant permissions/authority; routing prefers best qualified', () => {
  const supply = exampleSupplyChainHighTrust(authority);
  assert.equal(supply.grantsPermissions, false);
  assert.equal(supply.grantsAuthority, false);
  assert.equal(
    attemptTrustGrantsPermission({
      actor: authority,
      record: supply,
      permission: 'deploy_prod',
    }).denied,
    true,
  );
  assert.equal(
    attemptTrustGrantsAuthority({ actor: authority, record: supply }).denied,
    true,
  );

  const best = registerDomainTrustRecord({
    actor: authority,
    agentId: 'agent-best-qualified',
    domain: 'supply_chain',
    taskClass: 'inventory_forecast',
    trustState: 'DOMAIN_VERIFIED',
    factualAccuracy: 0.94,
    citationQuality: 0.9,
    costUnits: 2,
    activityCount: 1,
  });
  const noisy = registerDomainTrustRecord({
    actor: authority,
    agentId: 'agent-most-active-expensive',
    domain: 'supply_chain',
    taskClass: 'inventory_forecast',
    trustState: 'LIMITED_TRUST',
    factualAccuracy: 0.45,
    citationQuality: 0.4,
    costUnits: 500,
    activityCount: 99999,
  });
  assert.ok(!('denied' in best) && !('denied' in noisy));
  if ('denied' in best || 'denied' in noisy) return;

  const team = selectTeamByTrustGraph({
    actor: homeBase,
    domain: 'supply_chain',
    candidates: candidatesFromRecords([best, noisy], {
      'agent-best-qualified': { capabilityFit: 0.96, available: true },
      'agent-most-active-expensive': { capabilityFit: 0.3, available: true },
    }),
    maxTeamSize: 1,
  });
  assert.ok(!('denied' in team));
  if ('denied' in team) return;
  assert.deepEqual([...team.selectedAgentIds], ['agent-best-qualified']);
  assert.equal(team.preferredBy, 'best_qualified');
  assert.deepEqual([...team.notPreferredBy], ['most_active', 'most_expensive']);

  const inc = applyTrustIncrease({
    actor: authority,
    record: best,
    signal: 'reviewers_approve',
    evidenceRef: 'ev-review-ok',
  });
  assert.ok(!('denied' in inc));
  const dec = applyTrustDecrease({
    actor: authority,
    record: supply,
    signal: 'policy_violations',
    evidenceRef: 'ev-policy-fail',
  });
  assert.ok(!('denied' in dec));
  if (!('denied' in dec)) {
    assert.notEqual(dec.trustState, 'HIGH_TRUST');
  }
});

test('cycle runs; L4 false; soft-wires WAITING_DATA or PRESENT (absent ≠ FAIL)', () => {
  const cycle = runAgentReputationDomainTrustGraphCycle({
    actor: authority,
    repoRoot,
  });
  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.l4AutonomyEnabled, false);
  assert.equal(cycle.tipLand, false);
  assert.equal(cycle.managePullRequest, false);
  assert.equal(cycle.dbCandidatesStatus, 'NOT_APPLIED');
  assert.match(cycle.nextPhaseTitle, /ES31/);

  const soft = es30SoftWireSnapshot(repoRoot);
  for (const presence of [
    soft.es29MultiAgentConsensus,
    soft.es29Report,
    soft.es28PriorTip,
    soft.es28Report,
    soft.es25SkillCertification,
    soft.es25Report,
    soft.es16Report,
  ]) {
    const state = softWireHopState(presence);
    assert.ok(state === 'AVAILABLE' || state === 'WAITING_DATA');
    assert.notEqual(state, 'FAIL');
  }
  // Home Base compute surface is typically PRESENT on this tip — presence ≠ VERIFIED
  if (soft.homeBaseComputeSurface.present || soft.es16HomeBase.present) {
    assert.ok(true);
  } else {
    assert.equal(softWireHopState(soft.es16HomeBase), 'WAITING_DATA');
  }

  const softHops = cycle.hops.filter((h) => h.hop.includes('soft_wire'));
  assert.ok(softHops.length >= 4);
  for (const h of softHops) {
    assert.notEqual(h.state, 'FAIL');
    assert.ok(
      h.state === 'AVAILABLE' ||
        h.state === 'WAITING_DATA' ||
        h.state === 'PASS',
    );
  }

  assert.ok(
    cycle.hops.some(
      (h) => h.hop === 'l4_autonomy_false' && h.state === 'PASS',
    ),
  );
  assert.ok(
    cycle.hops.some(
      (h) =>
        h.hop === 'deny_self_modify_trust_score' && h.state === 'DENIED',
    ),
  );
  assert.ok(
    cycle.hops.some(
      (h) =>
        h.hop === 'weight_dissent_without_suppressing_stronger_evidence' &&
        h.state === 'PASS',
    ),
  );
});
