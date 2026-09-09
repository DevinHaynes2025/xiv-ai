/**
 * 62L-ER6 — Historical Business Case Atlas v2 denial + honesty tests.
 *
 * Script: npm run test:62ler6
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ALLOWED_ANALOGY_LABEL,
  CURRENT_CONTEXT_REQUIREMENTS,
  ER6_DB_CANDIDATES_STATUS,
  ER6_LOCKS,
  ER6_MAY_QUERY_APIS,
  ER_LAYER_TITLE,
  FORBIDDEN_ANALOGY_LABEL,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_BUSINESS_CASE_ATLAS_CYCLE,
  HISTORICAL_BUSINESS_CASE_CORE_FLOW,
  HISTORICAL_BUSINESS_CASE_DOMAINS,
  HISTORICAL_BUSINESS_CASE_FIELDS,
  HISTORICAL_BUSINESS_CASE_TRUTH_BOUNDARY,
  HISTORICAL_CASE_NEURAL_PATHWAY,
  HONESTY_BANNER,
  IP_COPYRIGHT_BOUNDARY,
  NEXT_PHASE_TITLE,
  assertEr6LocksIntact,
  er6SoftWireSnapshot,
  type Er6Actor,
} from './historical-business-case-atlas-v2-types.ts';

import {
  applyLessonTransferFeedback,
  attemptCrossTenantReuse,
  attemptFullCopyrightedIngest,
  attemptIgnoreCurrentContext,
  attemptLabelProvenCause,
  attemptPiratedCasebookIngest,
  attemptRecommendAsAct,
  attachReusableLesson,
  bootstrapHistoricalBusinessCaseAtlas,
  buildStructuredDecisionObject,
  exampleAtlasCase,
  probeGuardianRlsTenantUniverseIsolation,
  querySimilarCases,
  reconstructHistoricalCase,
  requireHumanApproval,
  returnEr6EvidenceToHomeBase,
  reviewCaseEvidence,
  runHistoricalBusinessCaseAtlasCycle,
} from './historical-business-case-atlas-v2-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er6Actor = {
  kind: 'historical_business_case_atlas',
  id: 'hbca-1',
  orgId: 'org-er6',
  tenantId: 'ten-er6',
  universeId: 'uni-er6',
  permissions: ['draft'],
};

const human: Er6Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er6',
  tenantId: 'ten-er6',
  universeId: 'uni-er6',
  permissions: ['approve_consequential'],
};

test('SoT label ER6 / #162; Historical Business Case Atlas v2; next ER7', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER6');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Historical Business Case Atlas/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER7/);
  assert.match(NEXT_PHASE_TITLE, /Science & Engineering Atlas/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; SIMILAR_CASE≠PROVEN_CAUSE; IP boundary; DB NOT_APPLIED', () => {
  assert.equal(assertEr6LocksIntact(), true);
  assert.equal(ER6_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER6_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER6_LOCKS.SIMILAR_CASE_EQ_PROVEN_CAUSE, false);
  assert.equal(ER6_LOCKS.MAY_LABEL_ANALOGY_AS_PROVEN_CAUSE, false);
  assert.equal(ER6_LOCKS.PIRATED_CASEBOOKS, false);
  assert.equal(ER6_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ALLOWED_ANALOGY_LABEL, 'SIMILAR_CASE');
  assert.equal(FORBIDDEN_ANALOGY_LABEL, 'PROVEN_CAUSE');
  assert.equal(
    HISTORICAL_BUSINESS_CASE_TRUTH_BOUNDARY.similarCaseEqProvenCause,
    false,
  );
  assert.equal(IP_COPYRIGHT_BOUNDARY.mayStorePiratedCasebooks, false);
  assert.equal(IP_COPYRIGHT_BOUNDARY.mayStoreFullCopyrightedArticles, false);
  assert.equal(IP_COPYRIGHT_BOUNDARY.mayStoreStructuredSummaries, true);
});

test('case fields + domains + flow + neural pathway + MAY query APIs encoded', () => {
  assert.equal(HISTORICAL_BUSINESS_CASE_FIELDS.length, 20);
  assert.ok(HISTORICAL_BUSINESS_CASE_FIELDS.includes('caseId'));
  assert.ok(HISTORICAL_BUSINESS_CASE_FIELDS.includes('contradictionState'));
  assert.equal(HISTORICAL_BUSINESS_CASE_DOMAINS.length, 17);
  assert.ok(
    HISTORICAL_BUSINESS_CASE_DOMAINS.includes('logistics_and_freight'),
  );
  assert.ok(
    HISTORICAL_BUSINESS_CASE_DOMAINS.includes('government_contracting'),
  );
  assert.deepEqual([...HISTORICAL_BUSINESS_CASE_CORE_FLOW], [
    'historical_source',
    'case_reconstruction',
    'evidence_review',
    'structured_decision_object',
    'reusable_lesson',
    'neural_graph',
  ]);
  assert.deepEqual([...HISTORICAL_CASE_NEURAL_PATHWAY], [
    'historical_case',
    'problem_pattern',
    'decision_pattern',
    'outcome',
    'lesson',
    'current_decision_candidate',
  ]);
  assert.equal(ER6_MAY_QUERY_APIS.length, 7);
  assert.ok(ER6_MAY_QUERY_APIS.includes('query_similar_bottleneck_cases'));
  assert.ok(
    ER6_MAY_QUERY_APIS.includes(
      'query_government_contract_patterns_overruns_vs_success',
    ),
  );
  assert.equal(CURRENT_CONTEXT_REQUIREMENTS.length, 5);
});

test('reconstruct → review → decision → lesson; proven_cause / pirated denied', () => {
  assert.equal(
    reconstructHistoricalCase({
      actor: agent,
      caseId: 'x',
      organization: 'O',
      company: 'C',
      industry: 'i',
      geography: 'g',
      timePeriod: 't',
      problem: 'p',
      decision: 'd',
      outcome: 'o',
      sourceSet: ['s1'],
      domains: ['pricing_strategy'],
      attemptProvenCauseLabel: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptLabelProvenCause().state, 'DENIED');
  assert.equal(attemptPiratedCasebookIngest().state, 'DENIED');
  assert.equal(attemptFullCopyrightedIngest().state, 'DENIED');

  const { caseRecord, decision, lesson, store } = exampleAtlasCase(agent);
  assert.equal(caseRecord.reconstructed, true);
  assert.equal(caseRecord.evidenceReviewed, true);
  assert.equal(caseRecord.analogyLabel, 'SIMILAR_CASE');
  assert.equal(decision.analogyLabel, 'SIMILAR_CASE');
  assert.equal(decision.currentContextAccounted.length, 5);
  assert.equal(lesson.analogyLabel, 'SIMILAR_CASE');
  assert.equal(store.edges.length, 5);

  assert.equal(
    buildStructuredDecisionObject({
      actor: agent,
      caseRecord,
      decisionObjectId: 'bad',
      problemPattern: 'p',
      decisionPattern: 'd',
      attemptProvenCauseLabel: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    buildStructuredDecisionObject({
      actor: agent,
      caseRecord,
      decisionObjectId: 'bad2',
      problemPattern: 'p',
      decisionPattern: 'd',
      attemptIgnoreCurrentContext: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptIgnoreCurrentContext().state, 'DENIED');

  const q = querySimilarCases({
    actor: agent,
    store,
    queryKind: 'logistics_recovery_from_disruptions',
  });
  assert.ok(!('denied' in q));
  assert.equal(q.analogyLabel, 'SIMILAR_CASE');
  assert.ok(q.matches.length >= 1);
  assert.equal(
    querySimilarCases({
      actor: agent,
      store,
      queryKind: 'similar_bottleneck',
      attemptProvenCauseLabel: true,
    }).state,
    'DENIED',
  );
});

test('strengthen on successful reuse; weaken on poor transfer; cross-tenant denied', () => {
  const { lesson, store } = exampleAtlasCase(agent);
  const up = applyLessonTransferFeedback({
    actor: agent,
    lesson,
    quality: 'successful_reuse',
    store,
  });
  assert.ok(!('denied' in up));
  assert.ok(up.lesson.strength > lesson.strength);
  assert.equal(up.lesson.successfulReuseCount, 1);

  const down = applyLessonTransferFeedback({
    actor: agent,
    lesson: up.lesson,
    quality: 'poor_transfer',
    store: up.store,
  });
  assert.ok(!('denied' in down));
  assert.ok(down.lesson.strength < up.lesson.strength);
  assert.equal(down.lesson.poorTransferCount, 1);

  assert.equal(attemptCrossTenantReuse().state, 'DENIED');
  const otherTenant: Er6Actor = {
    ...agent,
    tenantId: 'other-tenant',
  };
  assert.equal(
    reviewCaseEvidence({
      actor: otherTenant,
      caseRecord: exampleAtlasCase(agent).caseRecord,
    }).state,
    'DENIED',
  );
});

test('authority denies + guardian isolation hold', () => {
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; ER5/ER2 PRESENT; ER4/ER3/EQ14 WAITING_DATA ok', () => {
  const boot = bootstrapHistoricalBusinessCaseAtlas(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.caseFields.length, 20);
  assert.equal(boot.domains.length, 17);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER7/);

  const soft = er6SoftWireSnapshot(repoRoot);
  assert.equal(soft.er5GlobalHistoricalKnowledgeIngestion.present, true);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  // Incomplete / absent predecessors — WAITING_DATA, not FAIL.
  assert.equal(soft.er4RightsProvenanceGate.present, false);
  assert.equal(soft.er3PublicDataSourceRegistry.present, false);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);

  const { caseRecord } = exampleAtlasCase(agent);
  const ev = returnEr6EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    caseRecord,
    summary: 'atlas advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.analogyLabel, 'SIMILAR_CASE');
  assert.equal(ev.piratedCasebookPresent, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  // Ensure attach path still works when store already has case.
  const again = attachReusableLesson({
    actor: agent,
    caseRecord,
    decision: exampleAtlasCase(agent).decision,
    lessonId: 'lesson-2',
    statement: 'Sunset surcharge clauses after recovery.',
    store: exampleAtlasCase(agent).store,
  });
  assert.ok(!('denied' in again));

  const cycle = runHistoricalBusinessCaseAtlasCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, HISTORICAL_BUSINESS_CASE_ATLAS_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of HISTORICAL_BUSINESS_CASE_ATLAS_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er5Hop = cycle.hops.find((h) => h.hop === 'er5_soft_wire');
  assert.ok(er5Hop);
  assert.equal(er5Hop.state, 'PASS');

  const er4Hop = cycle.hops.find((h) => h.hop === 'er4_soft_wire');
  assert.ok(er4Hop);
  assert.equal(er4Hop.state, 'WAITING_DATA');

  const er3Hop = cycle.hops.find((h) => h.hop === 'er3_soft_wire');
  assert.ok(er3Hop);
  assert.equal(er3Hop.state, 'WAITING_DATA');

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.caseRecord.analogyLabel, 'SIMILAR_CASE');
});
