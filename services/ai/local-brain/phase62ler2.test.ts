/**
 * 62L-ER2 — API Truth State Machine denial + honesty tests.
 *
 * Script: npm run test:62ler2
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  API_TRUTH_BOUNDARY,
  API_TRUTH_CORE_PROGRESSION,
  API_TRUTH_DEGRADATION_TRIGGERS,
  API_TRUTH_ROUTING_RULES,
  API_TRUTH_STATE_MACHINE_CYCLE,
  API_TRUTH_STATES,
  API_TRUTH_TRANSITION_FIELDS,
  ER2_AGENT_BOUNDS,
  ER2_DB_CANDIDATES_STATUS,
  ER2_LOCKS,
  ER2_MAY,
  ER2_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  agentMayUseForWorkload,
  assertEr2LocksIntact,
  blocksRealtimeRequirement,
  er2SoftWireSnapshot,
  type Er2Actor,
} from './api-truth-state-machine-types.ts';

import {
  advanceApiTruthState,
  attemptCredentialReuseAcrossTenants,
  attemptLogSecretValues,
  attemptRecommendAsAct,
  attemptReturnStaleAsLive,
  attemptScrapeFallbackOnAuthFail,
  attemptSkipStateWithoutEvidence,
  bootstrapApiTruthStateMachine,
  createTargetConnector,
  degradeConnector,
  exampleVerifiedConnector,
  fingerprintCredentialScope,
  probeGuardianRlsTenantUniverseIsolation,
  requestRealtimeData,
  requireHumanApproval,
  returnEr2EvidenceToHomeBase,
  revokeConnector,
  routeAgentByState,
  runApiTruthStateMachineCycle,
} from './api-truth-state-machine-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er2Actor = {
  kind: 'api_truth_state_machine',
  id: 'atsm-1',
  orgId: 'org-er2',
  tenantId: 'ten-er2',
  universeId: 'uni-er2',
  permissions: ['draft'],
};

const human: Er2Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er2',
  tenantId: 'ten-er2',
  universeId: 'uni-er2',
  permissions: ['approve_consequential'],
};

test('SoT label ER2 / #162; API Truth State Machine; next ER3 Public Data Source Registry', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER2');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /API Truth State Machine/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER3/);
  assert.match(NEXT_PHASE_TITLE, /Public Data Source Registry/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; no skip; no stale-as-live; no secret logs; DB NOT_APPLIED', () => {
  assert.equal(assertEr2LocksIntact(), true);
  assert.equal(ER2_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER2_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER2_LOCKS.SKIP_STATE_WITHOUT_EVIDENCE, false);
  assert.equal(ER2_LOCKS.RETURN_STALE_DATA_AS_LIVE, false);
  assert.equal(ER2_LOCKS.LOG_SECRET_VALUES, false);
  assert.equal(ER2_LOCKS.SCRAPE_FALLBACK_ON_AUTH_FAIL, false);
  assert.equal(ER2_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(API_TRUTH_BOUNDARY.maySkipStateWithoutEvidence, false);
  assert.equal(ER2_AGENT_BOUNDS.mayReturnStaleDataAsLive, false);
});

test('states + progression + transition fields + degradation + routing encoded', () => {
  assert.deepEqual([...API_TRUTH_STATES], [
    'TARGET',
    'DOCUMENTED',
    'CONFIGURED',
    'AUTHORIZED',
    'SANDBOX_TESTED',
    'VERIFIED',
    'DEGRADED',
    'STALE',
    'REVOKED',
    'UNAVAILABLE',
  ]);
  assert.deepEqual([...API_TRUTH_CORE_PROGRESSION], [
    'TARGET',
    'DOCUMENTED',
    'CONFIGURED',
    'AUTHORIZED',
    'SANDBOX_TESTED',
    'VERIFIED',
  ]);
  assert.equal(API_TRUTH_TRANSITION_FIELDS.length, 10);
  assert.ok(API_TRUTH_TRANSITION_FIELDS.includes('credentialScopeFingerprint'));
  assert.equal(API_TRUTH_DEGRADATION_TRIGGERS.length, 7);
  assert.equal(API_TRUTH_ROUTING_RULES.VERIFIED, 'normal_approved_workloads');
  assert.equal(API_TRUTH_ROUTING_RULES.SANDBOX_TESTED, 'bounded_test_research_only');
  assert.equal(API_TRUTH_ROUTING_RULES.AUTHORIZED, 'tests_not_production_assumptions');
  assert.equal(API_TRUTH_ROUTING_RULES.DOCUMENTED, 'planning_only');
  assert.ok(ER2_MAY.includes('deny_or_waiting_data_when_realtime_required_but_stale_unavailable'));
  assert.ok(ER2_MUST_NOT.includes('return_old_data_as_live_when_realtime_required'));
});

test('progression TARGET→VERIFIED; skip without evidence denied; fingerprint not secret', () => {
  const target = createTargetConnector({
    actor: agent,
    connectionId: 'c1',
    provider: 'P',
  });
  assert.ok(!('denied' in target));
  assert.equal(target.state, 'TARGET');

  assert.equal(
    advanceApiTruthState({
      actor: agent,
      connector: target,
      to: 'VERIFIED',
      reason: 'skip',
      evidenceReference: 'x',
    }).state,
    'DENIED',
  );
  assert.equal(attemptSkipStateWithoutEvidence().state, 'DENIED');

  const { verified } = exampleVerifiedConnector(agent);
  assert.equal(verified.state, 'VERIFIED');
  assert.equal(verified.transitions.length, 5);
  assert.equal(verified.secretValuePresentInLogs, false);
  assert.ok(verified.credentialScopeFingerprint);
  assert.equal(
    fingerprintCredentialScope({
      credentialRef: 'vault:ref/weather-readonly',
      scopes: ['read:forecast'],
    }),
    verified.credentialScopeFingerprint,
  );
  assert.equal(attemptLogSecretValues().state, 'DENIED');
});

test('routing by state; REVOKED blocks; realtime STALE → WAITING_DATA', () => {
  const { target, verified } = exampleVerifiedConnector(agent);

  assert.equal(agentMayUseForWorkload('VERIFIED', 'normal_approved'), true);
  assert.equal(agentMayUseForWorkload('SANDBOX_TESTED', 'normal_approved'), false);
  assert.equal(agentMayUseForWorkload('SANDBOX_TESTED', 'bounded_test_research'), true);
  assert.equal(agentMayUseForWorkload('AUTHORIZED', 'tests'), true);
  assert.equal(agentMayUseForWorkload('DOCUMENTED', 'planning'), true);
  assert.equal(agentMayUseForWorkload('DOCUMENTED', 'normal_approved'), false);

  assert.ok(
    !('denied' in routeAgentByState({ connector: target, workload: 'planning' })),
  );
  assert.equal(
    routeAgentByState({ connector: verified, workload: 'normal_approved' }).allowed,
    true,
  );

  const revoked = revokeConnector({
    actor: agent,
    connector: verified,
    reason: 'policy',
    evidenceReference: 'rev://1',
  });
  assert.ok(!('denied' in revoked));
  assert.equal(
    routeAgentByState({ connector: revoked, workload: 'normal_approved' }).state,
    'DENIED',
  );

  const stale = degradeConnector({
    actor: agent,
    connector: verified,
    trigger: 'credentials_expire',
    evidenceReference: 'exp://1',
    as: 'STALE',
  });
  assert.ok(!('denied' in stale));
  assert.equal(blocksRealtimeRequirement('STALE'), true);
  const rt = requestRealtimeData({ connector: stale });
  assert.equal(rt.state, 'WAITING_DATA');
  assert.match(rt.reason, /REAL_TIME_REQUIRED/);

  const live = requestRealtimeData({ connector: verified });
  assert.ok(!('denied' in live));
  assert.equal(live.dataClass, 'live');

  assert.equal(
    requestRealtimeData({
      connector: stale,
      attemptReturnStaleAsLive: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptReturnStaleAsLive().state, 'DENIED');
  assert.equal(attemptScrapeFallbackOnAuthFail().state, 'DENIED');
  assert.equal(attemptCredentialReuseAcrossTenants().state, 'DENIED');
});

test('authority denies + guardian isolation hold', () => {
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; ER1 PRESENT; EQ14 WAITING_DATA', () => {
  const boot = bootstrapApiTruthStateMachine(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.truthStates.length, 10);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER3/);

  const soft = er2SoftWireSnapshot(repoRoot);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);

  const { verified } = exampleVerifiedConnector(agent);
  const ev = returnEr2EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    connector: verified,
    summary: 'truth sm advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.secretValuePresentInLogs, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runApiTruthStateMachineCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, API_TRUTH_STATE_MACHINE_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of API_TRUTH_STATE_MACHINE_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const er1Hop = cycle.hops.find((h) => h.hop === 'er1_soft_wire');
  assert.ok(er1Hop);
  assert.equal(er1Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.connector.state, 'VERIFIED');
});
