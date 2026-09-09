/**
 * 62L-EQ16 — Software Wormhole Router denial + honesty tests.
 *
 * Script: npm run test:62leq16
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EQ16_AGENT_BOUNDS,
  EQ16_DB_CANDIDATES_STATUS,
  EQ16_LOCKS,
  EQ16_MAY,
  EQ16_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SOFTWARE_WORMHOLE_ROUTER_CYCLE,
  WORMHOLE_AUTH_HOP_CHECKS,
  WORMHOLE_AUTH_RULE,
  WORMHOLE_CANDIDATE_TEST_GATES,
  WORMHOLE_CORE_FLOW,
  WORMHOLE_INVALIDATION_TRIGGERS,
  WORMHOLE_ROUTE_FIELDS,
  WORMHOLE_SHORTCUT_TYPES,
  WORMHOLE_TRUTH_BOUNDARY,
  assertEq16LocksIntact,
  claimsUnsupportedPhysics,
  eq16SoftWireSnapshot,
  securityShortcutAllowed,
  shortcutMayReduceAuthorizationChecks,
  wormholeMeansSoftwareOnly,
  type Eq16Actor,
} from './software-wormhole-router-types.ts';

import {
  attemptAutoDeployChanges,
  attemptBypassGuardianRls,
  attemptExpandTenantUniverseAccess,
  attemptPersistHiddenChainOfThought,
  attemptPhysicsOrFtlClaim,
  attemptPromoteCandidateWithoutGates,
  attemptRecommendAsAct,
  attemptSecurityShortcut,
  attemptSkipAuthorizationChecks,
  bootstrapSoftwareWormholeRouter,
  exampleActiveCacheRoute,
  invalidateRoute,
  probeGuardianRlsTenantUniverseIsolation,
  promoteCandidateAfterGates,
  proposeSandboxCandidate,
  requireHumanApproval,
  returnReceiptToHomeBase,
  routeShortcut,
  runSoftwareWormholeRouterCycle,
} from './software-wormhole-router-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq16Actor = {
  kind: 'wormhole_router',
  id: 'whr-1',
  orgId: 'org-eq16',
  tenantId: 'ten-eq16',
  universeId: 'uni-eq16',
  permissions: ['draft'],
};

const human: Eq16Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq16',
  tenantId: 'ten-eq16',
  universeId: 'uni-eq16',
  permissions: ['approve_consequential'],
};

test('SoT label EQ16 / #161; GitLab mirror not invented; next EQ17', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ16');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Software Wormhole Router/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ17/);
  assert.match(NEXT_PHASE_TITLE, /Circuit/);
});

test('honesty locks: L4 false; software-only; auth never reduced; DB NOT_APPLIED', () => {
  assert.equal(assertEq16LocksIntact(), true);
  assert.equal(EQ16_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ16_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ16_LOCKS.SHORTCUT_REDUCES_AUTHORIZATION_CHECKS, false);
  assert.equal(EQ16_LOCKS.SECURITY_SHORTCUT_ALLOWED, false);
  assert.equal(EQ16_LOCKS.CLAIM_SPACETIME_MANIPULATION, false);
  assert.equal(EQ16_LOCKS.CLAIM_FASTER_THAN_LIGHT, false);
  assert.equal(EQ16_LOCKS.WORMHOLE_MEANS_SOFTWARE_ONLY, true);
  assert.equal(EQ16_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(wormholeMeansSoftwareOnly(), true);
  assert.equal(claimsUnsupportedPhysics(), false);
  assert.equal(shortcutMayReduceAuthorizationChecks(), false);
  assert.equal(securityShortcutAllowed(), false);
  assert.equal(EQ16_AGENT_BOUNDS.mayReduceAuthorizationChecks, false);
  assert.equal(WORMHOLE_TRUTH_BOUNDARY.meansSoftwareRoutingAccelerationOnly, true);
  assert.equal(WORMHOLE_AUTH_RULE.shortcutMayReduceWork, true);
});

test('shortcut types + flow + route fields + auth/invalidation/gates encoded', () => {
  assert.equal(WORMHOLE_SHORTCUT_TYPES.length, 11);
  assert.ok(WORMHOLE_SHORTCUT_TYPES.includes('cache_hit_path'));
  assert.ok(WORMHOLE_SHORTCUT_TYPES.includes('materialized_view'));
  assert.ok(WORMHOLE_SHORTCUT_TYPES.includes('data_locality_routing'));
  assert.deepEqual([...WORMHOLE_CORE_FLOW], [
    'task',
    'policy_data_scope_check',
    'shortcut_candidate',
    'freshness_permission_check',
    'use_shortcut_or_full_path',
    'receipt',
    'home_base',
  ]);
  assert.ok(WORMHOLE_ROUTE_FIELDS.includes('routeId'));
  assert.ok(WORMHOLE_ROUTE_FIELDS.includes('invalidationTrigger'));
  assert.ok(WORMHOLE_ROUTE_FIELDS.includes('rollbackPath'));
  assert.deepEqual([...WORMHOLE_AUTH_HOP_CHECKS], [
    'user',
    'tenant',
    'universe',
    'object',
    'purpose',
    'data_class',
    'action',
  ]);
  assert.equal(WORMHOLE_INVALIDATION_TRIGGERS.length, 7);
  assert.equal(WORMHOLE_CANDIDATE_TEST_GATES.length, 6);
  assert.ok(EQ16_MAY.includes('use_governed_shortcut_after_policy_freshness_and_permission_checks'));
  assert.ok(EQ16_MUST_NOT.includes('skip_or_reduce_authorization_checks_via_shortcut'));
  assert.ok(EQ16_MUST_NOT.includes('claim_spacetime_ftl_or_unsupported_physics'));
});

test('governed shortcut after auth; skip-auth and security shortcut denied', () => {
  const { active, task } = exampleActiveCacheRoute(agent);
  const ok = routeShortcut({ task, route: active });
  assert.ok(!('denied' in ok));
  assert.equal(ok.used, 'shortcut');
  assert.equal(ok.receipt.authChecksSkipped, false);
  assert.equal(ok.receipt.securityShortcutUsed, false);
  assert.equal(ok.receipt.physicsClaimMade, false);
  assert.ok(ok.receipt.latencySavedMs > 0);
  assert.equal(ok.receipt.authChecksPerformed.length, 7);

  assert.equal(
    routeShortcut({ task, route: active, attemptSkipAuth: true }).state,
    'DENIED',
  );
  assert.equal(
    routeShortcut({ task, route: active, attemptSecurityShortcut: true }).state,
    'DENIED',
  );
  assert.equal(
    routeShortcut({ task, route: active, attemptPhysicsClaim: true }).state,
    'DENIED',
  );
  assert.equal(attemptSkipAuthorizationChecks().state, 'DENIED');
  assert.equal(attemptSecurityShortcut().state, 'DENIED');
  assert.equal(attemptPhysicsOrFtlClaim().state, 'DENIED');
});

test('candidates stay sandbox until gates; invalidate on triggers; full path on stale', () => {
  const proposed = proposeSandboxCandidate({
    actor: agent,
    routeId: 'wh-mv-1',
    source: 'query.agg',
    destination: 'mv.agg.daily',
    shortcutType: 'materialized_view',
    dataClass: 'aggregates',
    purpose: 'serve_daily_rollup',
    cacheIndexVersion: 'mv-v1',
    rollbackPath: 'full_path:query.agg',
  });
  assert.ok(!('denied' in proposed));
  assert.equal(proposed.state, 'SANDBOX_CANDIDATE');

  assert.equal(
    promoteCandidateAfterGates({
      actor: agent,
      route: proposed,
      gatesPassed: ['correctness', 'freshness'],
    }).state,
    'DENIED',
  );
  assert.equal(attemptPromoteCandidateWithoutGates().state, 'DENIED');

  const active = promoteCandidateAfterGates({
    actor: agent,
    route: proposed,
    gatesPassed: WORMHOLE_CANDIDATE_TEST_GATES,
  });
  assert.ok(!('denied' in active));
  assert.equal(active.state, 'ACTIVE');

  const stale = invalidateRoute({
    route: active,
    trigger: 'source_data_changes',
  });
  assert.equal(stale.state, 'STALE');
  assert.equal(stale.freshness, 'STALE');

  const bad = invalidateRoute({
    route: active,
    trigger: 'cache_integrity_fails',
  });
  assert.equal(bad.state, 'INVALIDATED');

  const task = {
    taskId: 't-stale',
    actor: agent,
    auth: {
      userId: agent.id,
      tenantId: agent.tenantId,
      universeId: agent.universeId,
      objectId: 'obj-1',
      purpose: active.purpose,
      dataClass: active.dataClass,
      action: 'read_shortcut',
    },
    purpose: active.purpose,
    dataClass: active.dataClass,
    action: 'read_shortcut',
    objectId: 'obj-1',
  };
  const fallback = routeShortcut({ task, route: stale });
  assert.ok(!('denied' in fallback));
  assert.equal(fallback.used, 'full_path');
  assert.equal(fallback.receipt.authChecksSkipped, false);
});

test('authority denies + guardian isolation hold', () => {
  assert.equal(attemptBypassGuardianRls().state, 'DENIED');
  assert.equal(attemptExpandTenantUniverseAccess().state, 'DENIED');
  assert.equal(attemptPersistHiddenChainOfThought().state, 'DENIED');
  assert.equal(attemptAutoDeployChanges().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; EQ14 WAITING_DATA; EQ15 PRESENT', () => {
  const boot = bootstrapSoftwareWormholeRouter(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.shortcutTypes.length, 11);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);
  assert.match(boot.sot.next, /EQ17/);

  const soft = eq16SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq15PathwayPlasticity.present, true);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);
  assert.match(soft.eq14NeuralPathwayArchitectureGraph.note, /WAITING_DATA/);
  assert.equal(soft.eq13ArchitectureReturnReceipt.present, true);
  assert.equal(soft.eq12CrossArchitectureBenchmarkMatrix.present, true);
  assert.equal(soft.eq6ArchitectureCapabilityGraph.present, true);

  const routed = routeShortcut({
    task: exampleActiveCacheRoute(agent).task,
    route: exampleActiveCacheRoute(agent).active,
  });
  assert.ok(!('denied' in routed));
  const home = returnReceiptToHomeBase({
    receipt: routed.receipt,
    actor: agent,
  });
  assert.ok(!('denied' in home));
  assert.equal(home.authorityGranted, false);
  assert.equal(home.authChecksSkipped, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runSoftwareWormholeRouterCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, SOFTWARE_WORMHOLE_ROUTER_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of SOFTWARE_WORMHOLE_ROUTER_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const eq15Hop = cycle.hops.find((h) => h.hop === 'eq15_soft_wire');
  assert.ok(eq15Hop);
  assert.equal(eq15Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.receipt.authChecksSkipped, false);
  assert.equal(cycle.receipt.pathUsed, 'shortcut');
});
