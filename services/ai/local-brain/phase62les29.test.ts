/**
 * 62L-ES29 — Multi-Agent Reliability & Consensus Engine denial + honesty tests.
 *
 * Script: npm run test:62les29
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  CONSENSUS_CORE_FLOW,
  CONSENSUS_OUTCOME_STATES,
  CONSENSUS_TRACKING_FIELDS,
  CONSENSUS_TRUTH_BOUNDARY,
  ES29_DB_CANDIDATES_STATUS,
  ES29_LOCKS,
  ES_LAYER_TITLE,
  FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RELIABILITY_DOMAINS,
  assertEs29LocksIntact,
  es29SoftWireSnapshot,
  type Es29Actor,
} from './multi-agent-reliability-consensus-types.ts';

import {
  attemptConsensusAuthority,
  attemptCrossDomainAutoTrust,
  attemptEnableL4Autonomy,
  attemptHiddenChainOfThought,
  attemptSameSourceEchoAsStrong,
  attemptSilentDissentDiscard,
  bootstrapMultiAgentConsensusEngine,
  createEmptyConsensusStore,
  exampleDissentOutputs,
  exampleDiverseOutputs,
  exampleLogisticsExpertProfile,
  exampleParticipatingAgents,
  exampleSameSourceEchoOutputs,
  measureIndependence,
  returnConsensusToHomeBase,
  runConsensusEngineCycle,
  runMultiAgentConsensus,
  scoreDomainReliability,
} from './multi-agent-reliability-consensus-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es29Actor = {
  kind: 'consensus_agent',
  id: 'consensus-1',
  orgId: 'org-es29',
  tenantId: 'ten-es29',
  universeId: 'uni-es29',
  permissions: ['draft'],
};

const human: Es29Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-es29',
  tenantId: 'ten-es29',
  universeId: 'uni-es29',
  permissions: ['approve_consequential'],
};

test('SoT label ES29; Multi-Agent Reliability & Consensus; next ES30 reputation graph', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES29');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Multi-Agent Reliability & Consensus/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES30/);
  assert.match(NEXT_PHASE_TITLE, /Agent Reputation & Domain Trust Graph/);
  assert.match(ES_LAYER_TITLE, /Autonomous Research/);
});

test('honesty locks: L4 false; consensus≠authority; DB NOT_APPLIED; no hidden CoT', () => {
  assert.equal(assertEs29LocksIntact(), true);
  assert.equal(ES29_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES29_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES29_LOCKS.CONSENSUS_EQ_AUTHORITY, false);
  assert.equal(ES29_LOCKS.SAME_SOURCE_ECHO_EQ_CONSENSUS_STRONG, false);
  assert.equal(ES29_LOCKS.SILENT_DISSENT_DISCARD, false);
  assert.equal(ES29_LOCKS.CROSS_DOMAIN_AUTO_TRUST, false);
  assert.equal(ES29_LOCKS.HIDDEN_CHAIN_OF_THOUGHT, false);
  assert.equal(ES29_LOCKS.TIP_LAND, false);
  assert.equal(ES29_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(attemptEnableL4Autonomy().denied, true);
  assert.equal(attemptHiddenChainOfThought().denied, true);
  assert.equal(CONSENSUS_TRUTH_BOUNDARY.consensusIsNotAuthority, true);
});

test('fields + outcomes + flow + forbidden authority encoded', () => {
  assert.equal(CONSENSUS_TRACKING_FIELDS.length, 16);
  assert.ok(CONSENSUS_TRACKING_FIELDS.includes('consensusId'));
  assert.ok(CONSENSUS_TRACKING_FIELDS.includes('minorityDissentingViews'));
  assert.ok(CONSENSUS_TRACKING_FIELDS.includes('approvalState'));
  assert.deepEqual([...CONSENSUS_OUTCOME_STATES], [
    'CONSENSUS_STRONG',
    'CONSENSUS_WEAK',
    'MIXED_EVIDENCE',
    'HIGH_DISAGREEMENT',
    'INSUFFICIENT_EVIDENCE',
    'REVIEW_REQUIRED',
  ]);
  assert.deepEqual([...CONSENSUS_CORE_FLOW], [
    'mission',
    'multiple_bounded_agents',
    'independent_outputs',
    'evidence_comparison',
    'disagreement_analysis',
    'evaluator_review',
    'consensus_candidate',
    'home_base',
  ]);
  assert.equal(FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS.length, 8);
  assert.ok(FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS.includes('sign_contracts'));
  assert.ok(FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS.includes('submit_gov_bids'));
  assert.ok(FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS.includes('move_money'));
  assert.ok(
    FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS.includes('control_infrastructure'),
  );
  assert.ok(RELIABILITY_DOMAINS.includes('logistics'));
  assert.ok(RELIABILITY_DOMAINS.includes('legal'));
  assert.ok(RELIABILITY_DOMAINS.includes('quantum'));
  assert.ok(RELIABILITY_DOMAINS.includes('cyber'));
});

test('same-source echo ≠ CONSENSUS_STRONG (independence rule)', () => {
  const echo = exampleSameSourceEchoOutputs();
  const independence = measureIndependence(echo);
  assert.equal(independence.sameSourceEchoDetected, true);
  assert.equal('denied' in attemptSameSourceEchoAsStrong(independence), true);

  const store = createEmptyConsensusStore();
  const result = runMultiAgentConsensus({
    actor: agent,
    store,
    missionTask: 'Confirm supplier A status',
    questionDomain: 'general',
    agents: exampleParticipatingAgents(echo),
    outputs: echo,
  });
  assert.equal('ok' in result && result.ok, true);
  if (!('ok' in result) || !result.ok) return;
  assert.notEqual(result.run.outcome, 'CONSENSUS_STRONG');
  assert.ok(
    result.run.outcome === 'CONSENSUS_WEAK' ||
      result.run.outcome === 'MIXED_EVIDENCE' ||
      result.run.outcome === 'REVIEW_REQUIRED',
  );
});

test('diverse independent evidence can reach CONSENSUS_STRONG', () => {
  const diverse = exampleDiverseOutputs();
  const independence = measureIndependence(diverse);
  assert.equal(independence.sameSourceEchoDetected, false);
  assert.ok(independence.uniqueSourceCount >= 5);
  assert.ok(independence.uniqueMethodCount >= 5);

  const store = createEmptyConsensusStore();
  const result = runMultiAgentConsensus({
    actor: agent,
    store,
    missionTask: 'Supplier lane reliability recommendation',
    questionDomain: 'general',
    agents: exampleParticipatingAgents(diverse),
    outputs: diverse,
  });
  assert.equal('ok' in result && result.ok, true);
  if (!('ok' in result) || !result.ok) return;
  assert.equal(result.run.outcome, 'CONSENSUS_STRONG');
  assert.equal(result.run.mergePackage.humanDecisionRequired, true);
  assert.equal(result.run.mergePackage.hiddenChainOfThoughtPersisted, false);
});

test('credible dissent preserved (Agent C: supplier data stale)', () => {
  const outputs = exampleDissentOutputs();
  const store = createEmptyConsensusStore();
  const result = runMultiAgentConsensus({
    actor: agent,
    store,
    missionTask: 'Supplier A go/no-go',
    questionDomain: 'ops',
    agents: exampleParticipatingAgents(outputs),
    outputs,
  });
  assert.equal('ok' in result && result.ok, true);
  if (!('ok' in result) || !result.ok) return;

  assert.ok(result.run.minorityDissentingViews.length >= 1);
  const agentC = result.run.minorityDissentingViews.find(
    (d) => d.agentId === 'agent-c',
  );
  assert.ok(agentC);
  assert.match(agentC!.finding, /supplier data stale/i);
  assert.equal(agentC!.credibleEvidence, true);
  assert.equal(agentC!.silentlyDiscarded, false);

  const preserve = attemptSilentDissentDiscard(
    result.run.minorityDissentingViews,
  );
  assert.equal('ok' in preserve && preserve.ok, true);
});

test('domain reliability isolation: logistics expert ≠ legal/quantum/cyber auto-trust', () => {
  const logistics = exampleLogisticsExpertProfile();
  const legal = scoreDomainReliability(logistics, 'legal');
  const quantum = scoreDomainReliability(logistics, 'quantum');
  const cyber = scoreDomainReliability(logistics, 'cyber');
  const logisticsOk = scoreDomainReliability(logistics, 'logistics');

  assert.equal(legal.applies, false);
  assert.equal(legal.score, 0);
  assert.equal(quantum.applies, false);
  assert.equal(cyber.applies, false);
  assert.equal(logisticsOk.applies, true);
  assert.ok(logisticsOk.score > 0.5);

  assert.equal(
    'denied' in
      attemptCrossDomainAutoTrust({
        agentDomain: 'logistics',
        questionDomain: 'legal',
      }),
    true,
  );
  assert.equal(
    'ok' in
      attemptCrossDomainAutoTrust({
        agentDomain: 'logistics',
        questionDomain: 'logistics',
      }),
    true,
  );
});

test('unanimous ≠ contract/bid/money/production/permissions/employment/vehicle authority; L4 false', () => {
  for (const action of FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS) {
    const d = attemptConsensusAuthority(action, { unanimous: true });
    assert.equal(d.denied, true);
    assert.match(d.reason, /Consensus ≠ authority/i);
  }
  assert.equal(ES29_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(attemptEnableL4Autonomy().denied, true);
});

test('soft-wire ES28/ES27/ER16 Home Base/ER18: presence≠VERIFIED; absent→WAITING_DATA≠FAIL', () => {
  const boot = bootstrapMultiAgentConsensusEngine({
    actor: agent,
    repoRoot,
  });
  assert.equal(boot.ok, true);
  assert.equal(boot.locksIntact, true);

  const soft = es29SoftWireSnapshot(repoRoot);
  // Home Base expected PRESENT on ER34-derived tips.
  assert.equal(soft.er16HomeBase.present, true);

  // ES28 / ER18 may be WAITING_DATA; ES27 may be present as sibling WIP — either ok.
  for (const probe of [
    soft.es28WorkflowGraphOptimizer,
    soft.es27CapabilityComposition,
    soft.er18ResearchReviewBoard,
  ]) {
    if (!probe.present) {
      assert.match(probe.note, /WAITING_DATA/);
    } else {
      assert.match(probe.note, /PRESENT/);
    }
  }

  const cycle = runConsensusEngineCycle({
    actor: agent,
    store: createEmptyConsensusStore(),
    missionTask: 'Cycle probe',
    questionDomain: 'general',
    agents: exampleParticipatingAgents(exampleDiverseOutputs()),
    outputs: exampleDiverseOutputs(),
    repoRoot,
  });
  assert.equal(cycle.locksIntact, true);
  assert.ok(cycle.run);
  assert.equal(cycle.run!.outcome, 'CONSENSUS_STRONG');

  const es28Hop = cycle.hops.find(
    (h) => h.hop === 'es28_workflow_graph_optimizer_soft_wire',
  );
  const es27Hop = cycle.hops.find(
    (h) => h.hop === 'es27_capability_composition_soft_wire',
  );
  const er16Hop = cycle.hops.find((h) => h.hop === 'er16_home_base_soft_wire');
  const er18Hop = cycle.hops.find(
    (h) => h.hop === 'er18_research_review_board_soft_wire',
  );
  assert.ok(es28Hop);
  assert.ok(es27Hop);
  assert.ok(er16Hop);
  assert.ok(er18Hop);
  assert.ok(
    es28Hop!.state === 'AVAILABLE' || es28Hop!.state === 'WAITING_DATA',
  );
  assert.ok(
    es27Hop!.state === 'AVAILABLE' || es27Hop!.state === 'WAITING_DATA',
  );
  assert.equal(er16Hop!.state, 'AVAILABLE');
  assert.ok(
    er18Hop!.state === 'AVAILABLE' || er18Hop!.state === 'WAITING_DATA',
  );
  assert.notEqual(es28Hop!.state, 'FAIL');
  assert.notEqual(es27Hop!.state, 'FAIL');
  assert.notEqual(er18Hop!.state, 'FAIL');

  const handoff = returnConsensusToHomeBase({
    actor: human,
    run: cycle.run!,
    repoRoot,
  });
  assert.equal('ok' in handoff && handoff.ok, true);
  if (!('ok' in handoff) || !handoff.ok) return;
  assert.equal(handoff.authority, false);
  assert.equal(handoff.handoff, 'HOME_BASE_CANDIDATE');
});
