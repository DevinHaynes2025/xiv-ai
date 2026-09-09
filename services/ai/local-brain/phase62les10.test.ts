/**
 * 62L-ES10 — Draft PR/MR Evidence Packager denial + honesty tests.
 *
 * Script: npm run test:62les10
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  DRAFT_PR_MR_CORE_FLOW,
  DRAFT_PR_MR_TRUTH_BOUNDARY,
  DRAFT_REVIEW_PACKAGE_FIELDS,
  ES10_AGENT_BOUNDS,
  ES10_DB_CANDIDATES_STATUS,
  ES10_LOCKS,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  REQUIRED_DRAFT_SECTIONS,
  VERIFICATION_CHECK_STATES,
  assertEs10LocksIntact,
  canClaimAllTestsPass,
  es10SoftWireSnapshot,
  listNotVerified,
  listUnrunTests,
  type Es10Actor,
} from './draft-pr-mr-evidence-packager-types.ts';

import {
  applyHardTruthRule,
  attemptApplyProdMigrations,
  attemptDeployProd,
  attemptExpandPermissions,
  attemptFalseAllTestsPassClaim,
  attemptManagePullRequest,
  attemptMergeMain,
  attemptOpenRemotePrMr,
  attemptProvisionPaidInfra,
  attemptPublishExternally,
  attemptTipLand,
  collectBranchChanges,
  exampleMixedEvidencePackage,
  generateDraftMarkdown,
  runDraftPrMrEvidencePackagerCycle,
} from './draft-pr-mr-evidence-packager-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es10Actor = {
  kind: 'draft_pr_mr_evidence_packager',
  id: 'es10-packager-1',
  orgId: 'org-es10',
  tenantId: 'ten-es10',
  universeId: 'uni-es10',
  permissions: ['draft'],
};

test('SoT label ES10; Draft PR/MR Evidence Packager; next ES11; no invented issue', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES10');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Draft PR\/MR Evidence Packager/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES11/);
  assert.match(NEXT_PHASE_TITLE, /Human Review/);
  assert.match(ES_LAYER_TITLE, /Autonomous Research & Productization Factory/);
});

test('honesty locks: L4 false; merge/deploy denied; hard truth; DB NOT_APPLIED', () => {
  assert.equal(assertEs10LocksIntact(), true);
  assert.equal(ES10_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES10_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES10_LOCKS.MERGE_MAIN, false);
  assert.equal(ES10_LOCKS.DEPLOY_PROD, false);
  assert.equal(ES10_LOCKS.APPLY_PROD_MIGRATIONS, false);
  assert.equal(ES10_LOCKS.EXPAND_PERMISSIONS, false);
  assert.equal(ES10_LOCKS.PROVISION_PAID_INFRA, false);
  assert.equal(ES10_LOCKS.PUBLISH_EXTERNALLY, false);
  assert.equal(ES10_LOCKS.OPEN_REMOTE_PR_MR, false);
  assert.equal(ES10_LOCKS.FALSE_ALL_TESTS_PASS_CLAIM, false);
  assert.equal(ES10_LOCKS.TIP_LAND, false);
  assert.equal(ES10_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ES10_AGENT_BOUNDS.mayMergeMain, false);
  assert.equal(ES10_AGENT_BOUNDS.mayDeployProd, false);
  assert.equal(ES10_AGENT_BOUNDS.mayClaimAllTestsPassWhenAnyUnrun, false);
  assert.equal(
    DRAFT_PR_MR_TRUTH_BOUNDARY.hardTruthAllTestsPassRequiresEveryCheckExecutedPass,
    true,
  );
  assert.equal(DRAFT_PR_MR_TRUTH_BOUNDARY.l4AutonomyEnabled, false);
});

test('package fields + required sections + core flow + verification states encoded', () => {
  assert.equal(DRAFT_REVIEW_PACKAGE_FIELDS.length, 23);
  assert.ok(DRAFT_REVIEW_PACKAGE_FIELDS.includes('reviewPackageId'));
  assert.ok(DRAFT_REVIEW_PACKAGE_FIELDS.includes('rollbackProcedure'));
  assert.ok(DRAFT_REVIEW_PACKAGE_FIELDS.includes('humanDecisionsRequired'));
  assert.deepEqual([...REQUIRED_DRAFT_SECTIONS], [
    'What changed',
    'Why',
    'Security & permissions',
    'Verification actually performed',
    'Not verified',
    'Performance evidence',
    'Data/rights impact',
    'Rollback',
  ]);
  assert.deepEqual([...DRAFT_PR_MR_CORE_FLOW], [
    'branch_changes',
    'es9_review',
    'evidence_collection',
    'draft_pr_mr_description',
    'human_review',
  ]);
  assert.ok(VERIFICATION_CHECK_STATES.includes('NOT_TESTED'));
  assert.ok(VERIFICATION_CHECK_STATES.includes('WAITING_NODE'));
  assert.ok(VERIFICATION_CHECK_STATES.includes('UNAVAILABLE'));
  assert.ok(VERIFICATION_CHECK_STATES.includes('BLOCKED'));
});

test('false All tests pass denied; unrun listed in Not verified', () => {
  const collected = collectBranchChanges(exampleMixedEvidencePackage(agent));
  assert.ok(!('denied' in collected));
  if ('denied' in collected) return;

  assert.equal(canClaimAllTestsPass(collected.testResults), false);
  assert.equal(collected.allTestsPassClaim, false);
  assert.ok(collected.unrunTests.includes('ASUS GPU'));
  assert.ok(collected.unrunTests.includes('NPU'));

  const falseClaim = attemptFalseAllTestsPassClaim(collected);
  assert.equal(falseClaim.denied, true);
  assert.match(falseClaim.reason, /All tests pass/i);

  const forged = applyHardTruthRule({
    ...collected,
    allTestsPassClaim: true,
  });
  assert.ok('denied' in forged);
  if (!('denied' in forged)) return;
  assert.equal(forged.denied, true);

  const notVerified = listNotVerified(collected.testResults);
  assert.ok(notVerified.some((c) => c.name === 'ASUS GPU'));
  assert.ok(notVerified.some((c) => c.name === 'NPU'));
  assert.deepEqual(listUnrunTests(collected.testResults).sort(), [
    'ASUS GPU',
    'NPU',
  ]);

  const md = generateDraftMarkdown(collected);
  assert.match(md.fullMarkdown, /## Not verified/);
  assert.match(md.notVerified, /ASUS GPU/);
  assert.match(md.notVerified, /NPU/);
  assert.match(md.notVerified, /NOT_TESTED|WAITING_NODE/);
  assert.match(md.fullMarkdown, /## Verification actually performed/);
  assert.match(md.fullMarkdown, /All tests pass claim: \*\*false\*\*/);
  assert.doesNotMatch(
    md.fullMarkdown,
    /All tests pass claim: \*\*true\*\*/,
  );
  for (const section of REQUIRED_DRAFT_SECTIONS) {
    assert.match(md.fullMarkdown, new RegExp(`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
});

test('merge/deploy/migration/permission/paid-infra/publish/PR denies; L4 false', () => {
  const collected = collectBranchChanges(exampleMixedEvidencePackage(agent));
  assert.ok(!('denied' in collected));
  if ('denied' in collected) return;

  assert.equal(collected.l4AutonomyEnabled, false);
  assert.equal(collected.mergeAuthorized, false);
  assert.equal(collected.deployAuthorized, false);

  assert.equal(attemptMergeMain(collected, agent).denied, true);
  assert.equal(attemptDeployProd(collected, agent).denied, true);
  assert.equal(attemptApplyProdMigrations(collected, agent).denied, true);
  assert.equal(attemptExpandPermissions(collected, agent).denied, true);
  assert.equal(attemptProvisionPaidInfra(collected, agent).denied, true);
  assert.equal(attemptPublishExternally(collected, agent).denied, true);
  assert.equal(attemptOpenRemotePrMr(collected, agent).denied, true);
  assert.equal(attemptTipLand(collected, agent).denied, true);
  assert.equal(attemptManagePullRequest(collected, agent).denied, true);
});

test('cycle packs mixed evidence; soft-wires WAITING_DATA or PRESENT; no FAIL on absent', () => {
  const cycle = runDraftPrMrEvidencePackagerCycle({
    actor: agent,
    repoRoot,
  });
  assert.ok(!('denied' in cycle));
  if ('denied' in cycle) return;

  assert.equal(cycle.locksIntact, true);
  assert.equal(cycle.package.l4AutonomyEnabled, false);
  assert.equal(cycle.package.allTestsPassClaim, false);
  assert.ok(cycle.package.unrunTests.includes('ASUS GPU'));
  assert.match(cycle.markdown.fullMarkdown, /ASUS GPU/);
  assert.match(cycle.markdown.fullMarkdown, /NPU/);

  const soft = es10SoftWireSnapshot(repoRoot);
  for (const key of Object.keys(soft) as (keyof typeof soft)[]) {
    const entry = soft[key];
    // Presence ≠ VERIFIED; absent must be WAITING_DATA messaging, never FAIL
    if (!entry.present) {
      assert.match(entry.note, /WAITING_DATA/);
    }
  }

  const softHops = cycle.hops.filter((h) => h.hop.includes('soft_wire'));
  assert.ok(softHops.length >= 3);
  for (const h of softHops) {
    assert.ok(h.state === 'PASS' || h.state === 'WAITING_DATA');
    assert.notEqual(h.state, 'FAIL');
  }

  assert.equal(cycle.meta.dbCandidatesStatus, 'NOT_APPLIED');
  assert.match(cycle.meta.nextPhaseTitle, /ES11/);
});
