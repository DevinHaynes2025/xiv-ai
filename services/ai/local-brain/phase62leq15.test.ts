/**
 * 62L-EQ15 — Pathway Plasticity denial + honesty tests.
 *
 * Script: npm run test:62leq15
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EQ15_AGENT_BOUNDS,
  EQ15_DB_CANDIDATES_STATUS,
  EQ15_LOCKS,
  EQ15_MAY,
  EQ15_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PATHWAY_LEARNING_BOUNDARY,
  PATHWAY_LIFECYCLE_STATES,
  PATHWAY_METADATA_FIELDS,
  PATHWAY_PLASTICITY_CYCLE,
  PATHWAY_STRENGTHEN_CONDITIONS,
  PATHWAY_WEAKEN_CONDITIONS,
  PATHWAY_WEIGHT_INFLUENCES,
  assertEq15LocksIntact,
  canStrengthenPathway,
  eq15SoftWireSnapshot,
  preferenceImpliesAuthority,
  preferenceImpliesPermission,
  type Eq15Actor,
} from './pathway-plasticity-types.ts';

import {
  attemptAutoDeployChanges,
  attemptBypassGuardianRls,
  attemptExpandTenantUniverseAccess,
  attemptPersistHiddenChainOfThought,
  attemptPreferenceAsAuthority,
  attemptPreferenceAsPermission,
  attemptPromoteResearchToProduction,
  attemptRecommendAsAct,
  attemptSelfGrantTools,
  attemptStrengthenWithoutEvidence,
  bootstrapPathwayPlasticity,
  exampleVerifiedPathway,
  initialPathway,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEq15EvidenceToHomeBase,
  runPathwayPlasticityCycle,
  strengthenPathway,
  weakenPathway,
} from './pathway-plasticity-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq15Actor = {
  kind: 'pathway_plasticity_engine',
  id: 'ppe-1',
  orgId: 'org-eq15',
  tenantId: 'ten-eq15',
  universeId: 'uni-eq15',
  permissions: ['draft'],
};

const human: Eq15Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq15',
  tenantId: 'ten-eq15',
  universeId: 'uni-eq15',
  permissions: ['approve_consequential'],
};

test('SoT label EQ15 / #161; GitLab mirror not invented; next EQ16', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ15');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Pathway Plasticity/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ16/);
  assert.match(NEXT_PHASE_TITLE, /Software Wormhole Router/);
});

test('honesty locks: L4 false; preference≠permission/authority; DB NOT_APPLIED', () => {
  assert.equal(assertEq15LocksIntact(), true);
  assert.equal(EQ15_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ15_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ15_LOCKS.PREFERENCE_EQ_PERMISSION, false);
  assert.equal(EQ15_LOCKS.PREFERENCE_EQ_AUTHORITY, false);
  assert.equal(EQ15_LOCKS.SELF_GRANT_TOOLS, false);
  assert.equal(EQ15_LOCKS.BYPASS_GUARDIAN_RLS, false);
  assert.equal(EQ15_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS, false);
  assert.equal(EQ15_LOCKS.PROMOTE_RESEARCH_DIRECTLY_TO_PRODUCTION, false);
  assert.equal(EQ15_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT, false);
  assert.equal(EQ15_LOCKS.AUTO_DEPLOY_CHANGES, false);
  assert.equal(EQ15_LOCKS.STRENGTHEN_WITHOUT_EVIDENCE, false);
  assert.equal(EQ15_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EQ15_AGENT_BOUNDS.mayChangePermissions, false);
  assert.equal(EQ15_AGENT_BOUNDS.mayChangeAuthority, false);
  assert.equal(PATHWAY_LEARNING_BOUNDARY.mayChangeRoutingPreference, true);
  assert.equal(preferenceImpliesPermission(), false);
  assert.equal(preferenceImpliesAuthority(), false);
});

test('weight influences + lifecycle + metadata + strengthen/weaken conditions encoded', () => {
  assert.deepEqual([...PATHWAY_WEIGHT_INFLUENCES], [
    'benchmark_success',
    'recency_freshness',
    'reliability',
    'latency',
    'cost_energy_proxy',
    'output_quality',
    'repeated_failure',
    'contradiction',
    'regression',
    'evaluator_review',
    'human_approval_where_required',
  ]);
  assert.deepEqual([...PATHWAY_LIFECYCLE_STATES], [
    'HYPOTHESIS',
    'TESTED',
    'MEASURED',
    'VERIFIED',
    'STALE',
    'REGRESSED',
    'REJECTED',
  ]);
  assert.ok(PATHWAY_METADATA_FIELDS.includes('weight'));
  assert.ok(PATHWAY_METADATA_FIELDS.includes('rollbackVersion'));
  assert.ok(
    PATHWAY_STRENGTHEN_CONDITIONS.includes('results_reproducible'),
  );
  assert.ok(
    PATHWAY_WEAKEN_CONDITIONS.includes('reviewer_rejects_conclusion'),
  );
  assert.ok(EQ15_MAY.includes('change_routing_preference_from_evidence'));
  assert.ok(
    EQ15_MUST_NOT.includes(
      'treat_preference_change_as_permission_or_authority_change',
    ),
  );
});

test('strengthen on bounded reproducible fresh success; deny without evidence', () => {
  const hypo = initialPathway({
    pathwayId: 'p1',
    routeKey: 'r1',
    hypothesis: 'prefer verified low-latency route',
    evidenceRefs: ['ev-1'],
  });
  assert.equal(hypo.lifecycle, 'HYPOTHESIS');

  assert.equal(
    canStrengthenPathway({
      repeatedBoundedTestsSucceed: true,
      resultsReproducible: true,
      evidenceFresh: true,
      evidenceRefs: ['ev-1'],
    }),
    true,
  );
  assert.equal(
    canStrengthenPathway({
      repeatedBoundedTestsSucceed: false,
      resultsReproducible: true,
      evidenceFresh: true,
      evidenceRefs: ['ev-1'],
    }),
    false,
  );

  const ok = strengthenPathway({
    actor: agent,
    pathway: hypo,
    influences: { benchmark_success: 0.95, reliability: 0.9, output_quality: 0.85 },
    repeatedBoundedTestsSucceed: true,
    resultsReproducible: true,
    evidenceFresh: true,
    beatsOrJustifiesBaseline: true,
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.pathway.lifecycle, 'VERIFIED');
  assert.ok(ok.pathway.weight > hypo.weight);
  assert.equal(ok.permissionsChanged, false);
  assert.equal(ok.authorityChanged, false);

  const bare = strengthenPathway({
    actor: agent,
    pathway: hypo,
    repeatedBoundedTestsSucceed: false,
    resultsReproducible: false,
    evidenceFresh: false,
    beatsOrJustifiesBaseline: false,
  });
  assert.equal(bare.state, 'DENIED');
  assert.equal(attemptStrengthenWithoutEvidence().state, 'DENIED');
});

test('weaken on regression / stale / contradiction / reviewer reject', () => {
  const { strengthened } = exampleVerifiedPathway(agent);
  const base = strengthened.pathway;

  const regressed = weakenPathway({
    actor: agent,
    pathway: base,
    reason: 'runtime_regression',
    influences: { regression: 0.9 },
  });
  assert.equal(regressed.pathway.lifecycle, 'REGRESSED');
  assert.ok(regressed.pathway.weight < base.weight);
  assert.equal(regressed.permissionsChanged, false);

  const stale = weakenPathway({
    actor: agent,
    pathway: base,
    reason: 'evidence_stale',
  });
  assert.equal(stale.pathway.lifecycle, 'STALE');

  const conflicted = weakenPathway({
    actor: agent,
    pathway: base,
    reason: 'conflicting_results',
    influences: { contradiction: 0.8 },
  });
  assert.equal(conflicted.pathway.regressionState, 'SUSPECTED');

  const rejected = weakenPathway({
    actor: agent,
    pathway: base,
    reason: 'reviewer_rejected',
  });
  assert.equal(rejected.pathway.lifecycle, 'REJECTED');

  const noStrengthenAfterReject = strengthenPathway({
    actor: agent,
    pathway: rejected.pathway,
    repeatedBoundedTestsSucceed: true,
    resultsReproducible: true,
    evidenceFresh: true,
    beatsOrJustifiesBaseline: true,
  });
  assert.equal(noStrengthenAfterReject.state, 'DENIED');
});

test('authority/permission expansion denies hold', () => {
  assert.equal(attemptSelfGrantTools().state, 'DENIED');
  assert.equal(attemptBypassGuardianRls().state, 'DENIED');
  assert.equal(attemptExpandTenantUniverseAccess().state, 'DENIED');
  assert.equal(attemptPromoteResearchToProduction().state, 'DENIED');
  assert.equal(attemptPersistHiddenChainOfThought().state, 'DENIED');
  assert.equal(attemptAutoDeployChanges().state, 'DENIED');
  assert.equal(attemptPreferenceAsPermission().state, 'DENIED');
  assert.equal(attemptPreferenceAsAuthority().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
});

test('bootstrap + soft-wire + cycle; EQ14 WAITING_DATA ok; guardian unchanged', () => {
  const boot = bootstrapPathwayPlasticity(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.weightInfluences.length, PATHWAY_WEIGHT_INFLUENCES.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);
  assert.match(boot.sot.next, /EQ16/);

  const soft = eq15SoftWireSnapshot(repoRoot);
  // EQ14 intentionally skipped / not yet parked — WAITING_DATA, not FAIL
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);
  assert.match(soft.eq14NeuralPathwayArchitectureGraph.note, /WAITING_DATA/);
  assert.equal(soft.eq13ArchitectureReturnReceipt.present, true);
  assert.equal(soft.eq12CrossArchitectureBenchmarkMatrix.present, true);
  assert.equal(soft.eq6ArchitectureCapabilityGraph.present, true);

  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const ev = returnEq15EvidenceToHomeBase({
    evidenceId: 'ev-eq15-1',
    actor: agent,
    summary: 'pathway plasticity advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(ev.permissionsChanged, false);
  assert.equal(ev.hiddenChainOfThoughtPresent, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runPathwayPlasticityCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, PATHWAY_PLASTICITY_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of PATHWAY_PLASTICITY_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.pathway.lifecycle, 'VERIFIED');
  assert.equal(cycle.strengthened.permissionsChanged, false);
});
