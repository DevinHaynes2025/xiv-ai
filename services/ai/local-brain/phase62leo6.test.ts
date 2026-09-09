/**
 * 62L-EO6 — Classical Baseline Requirement denial + honesty tests.
 *
 * Script: npm run test:62leo6
 * Covers: baseline framework + promotion gate + tradeoff honesty +
 * vague-claim deny + L4 false + soft-wire EO4/EO5/EM9
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CLASSICAL_BASELINE_COMPARISON_FLOW,
  CLASSICAL_BASELINE_FAMILIES,
  CLASSICAL_BASELINE_REQUIREMENT_CYCLE,
  COMPARISON_METRICS,
  EO6_DB_CANDIDATES_STATUS,
  EO6_LOCKS,
  EO6_MAY,
  EO6_MUST_NOT,
  EO6_POLICY_FRAMING,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROBLEM_DEFINITION_FIELDS,
  PROMOTION_FALLBACK_OUTCOMES,
  PROMOTION_OUTCOMES_WITH_EVIDENCE,
  VAGUE_CLAIM_PATTERNS,
  assertEo6LocksIntact,
  eo6SoftWireSnapshot,
  isVagueClaimText,
  metricDeltaDirection,
} from './classical-baseline-requirement-types.ts';
import {
  attemptAutoPromote,
  bootstrapClassicalBaselineRequirement,
  compareAgainstBaselines,
  denyVagueQuantumPoweredEfficiencyClaim,
  evaluateOptimizationClaim,
  evaluatePromotionGate,
  registerProblemDefinition,
  runClassicalBaselineComparisonCycle,
  selectClassicalBaselines,
} from './classical-baseline-requirement-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function sampleProblem(
  overrides: Partial<Parameters<typeof registerProblemDefinition>[0]> = {},
) {
  return {
    problemId: 'routing-opt-001',
    objectiveFunction: 'minimize_total_latency_subject_to_capacity',
    constraints: ['capacity<=100', 'deadline<=500ms'],
    datasetVersion: 'gov-logistics-bench/v1.0.0',
    baselineAlgorithms: [
      'greedy_rule_based',
      'graph_algorithms',
      'monte_carlo_statistical',
    ] as const,
    advancedCandidateAlgorithms: ['quantum_inspired_annealer_v0'],
    evaluationMetrics: [
      'solution_quality',
      'runtime',
      'memory',
      'cost',
      'reproducibility',
    ] as const,
    computeBudget: '8 vCPU · 16GB · 30min wall',
    runtimeBudget: '30s per instance',
    reproducibilitySeed: 4059,
    testEnvironment: 'unit-fixture/linux-x64',
    expectedOutcome: 'BETTER_QUALITY or NO_MEASURED_ADVANTAGE with honest tradeoffs',
    evidenceOwner: 'xiv-eo6-evidence-owner',
    ...overrides,
  };
}

test('SoT soft-wires #159 EO family; GitLab mirror not invented; next is EO7', () => {
  assert.equal(GITHUB_SOT_ISSUE, 159);
  assert.match(GITHUB_SOT_TITLE, /EO6 Classical Baseline Requirement/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EO7/);
  assert.match(NEXT_PHASE_TITLE, /Logistics Mission Pack/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEo6LocksIntact(), true);
  assert.equal(EO6_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EO6_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EO6_LOCKS.TIP_LAND, false);
  assert.equal(EO6_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EO6_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EO6_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EO6_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EO6_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('problem definition fields + minimum baseline families + comparison metrics encoded', () => {
  for (const f of [
    'problemId',
    'objectiveFunction',
    'constraints',
    'datasetVersion',
    'baselineAlgorithms',
    'advancedCandidateAlgorithms',
    'evaluationMetrics',
    'computeBudget',
    'runtimeBudget',
    'reproducibilitySeed',
    'testEnvironment',
    'expectedOutcome',
    'evidenceOwner',
  ]) {
    assert.ok(
      (PROBLEM_DEFINITION_FIELDS as readonly string[]).includes(f),
      `missing field ${f}`,
    );
  }

  for (const family of [
    'greedy_rule_based',
    'linear_programming',
    'mixed_integer_programming',
    'constraint_programming',
    'graph_algorithms',
    'dynamic_programming',
    'monte_carlo_statistical',
    'classical_ml',
    'metaheuristics',
  ]) {
    assert.ok(
      (CLASSICAL_BASELINE_FAMILIES as readonly string[]).includes(family),
      `missing family ${family}`,
    );
  }

  for (const m of [
    'solution_quality',
    'runtime',
    'memory',
    'throughput',
    'convergence',
    'robustness',
    'reliability',
    'cost',
    'energy_proxy',
    'explainability',
    'reproducibility',
  ]) {
    assert.ok((COMPARISON_METRICS as readonly string[]).includes(m));
  }

  assert.ok(CLASSICAL_BASELINE_COMPARISON_FLOW.includes('define_problem'));
  assert.ok(CLASSICAL_BASELINE_COMPARISON_FLOW.includes('promotion_gate'));
  assert.ok(CLASSICAL_BASELINE_REQUIREMENT_CYCLE.includes('vague_claim_deny'));
});

test('promotion outcomes require evidence; else NO_MEASURED_ADVANTAGE | RESEARCH_ONLY', () => {
  for (const o of [
    'BETTER_QUALITY',
    'LOWER_COST',
    'LOWER_LATENCY',
    'BETTER_SCALING',
    'BETTER_ROBUSTNESS',
    'BETTER_PRIVACY_LOCALITY',
    'BETTER_MULTI_OBJECTIVE_TRADEOFF',
  ]) {
    assert.ok((PROMOTION_OUTCOMES_WITH_EVIDENCE as readonly string[]).includes(o));
  }
  assert.deepEqual([...PROMOTION_FALLBACK_OUTCOMES], [
    'NO_MEASURED_ADVANTAGE',
    'RESEARCH_ONLY',
  ]);
});

test('critical rule: tradeoff honesty — must state what improved AND what got worse', () => {
  assert.equal(EO6_LOCKS.TRADEOFF_IMPROVED_ONLY_WITHOUT_WORSENED, false);
  assert.equal(EO6_LOCKS.PROMOTE_WITHOUT_TRADEOFF_STATEMENT, false);
  assert.ok(
    EO6_MUST_NOT.includes('claim_advantage_without_stating_what_got_worse'),
  );
  assert.match(EO6_POLICY_FRAMING.tradeoffHonesty, /exactly what tradeoff/);

  assert.equal(metricDeltaDirection('runtime', 100, 80), 'improved');
  assert.equal(metricDeltaDirection('runtime', 100, 120), 'worsened');
  assert.equal(metricDeltaDirection('solution_quality', 0.7, 0.9), 'improved');
  assert.equal(metricDeltaDirection('solution_quality', 0.9, 0.7), 'worsened');

  const evidence = compareAgainstBaselines({
    problemId: 'p1',
    datasetVersion: 'v1',
    reproducibilitySeed: 1,
    classicalFamiliesRun: ['greedy_rule_based', 'graph_algorithms'],
    candidateId: 'qi-v0',
    observations: [
      {
        metric: 'solution_quality',
        baselineValue: 0.72,
        candidateValue: 0.81,
        unit: 'score',
      },
      {
        metric: 'runtime',
        baselineValue: 40,
        candidateValue: 95,
        unit: 'ms',
      },
      {
        metric: 'explainability',
        baselineValue: 0.9,
        candidateValue: 0.4,
        unit: 'score',
      },
    ],
  });
  assert.ok(!('denied' in evidence));
  if (!('denied' in evidence)) {
    assert.deepEqual([...evidence.tradeoff.improved], ['solution_quality']);
    assert.ok(evidence.tradeoff.worsened.includes('runtime'));
    assert.ok(evidence.tradeoff.worsened.includes('explainability'));
    assert.match(evidence.tradeoff.narrative, /Improved:/);
    assert.match(evidence.tradeoff.narrative, /Worsened:/);
    assert.equal(evidence.tradeoff.honest, true);
  }
});

test('promotion gate: no auto-promote; evidence + classical baseline + tradeoff required', () => {
  assert.equal(EO6_LOCKS.AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE, false);
  assert.equal(EO6_LOCKS.PROMOTE_WITHOUT_CLASSICAL_BASELINE, false);
  assert.equal(EO6_LOCKS.PROMOTE_WITHOUT_BENCHMARK_EVIDENCE, false);

  const auto = attemptAutoPromote({ requestedOutcome: 'BETTER_QUALITY' });
  assert.equal(auto.state, 'DENIED');
  assert.match(auto.reason, /NO_AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE/);

  const problem = registerProblemDefinition(sampleProblem());
  assert.ok(!('denied' in problem));

  if (!('denied' in problem)) {
    const noEvidence = evaluatePromotionGate({
      problem,
      evidence: null,
      requestedOutcome: 'BETTER_QUALITY',
    });
    assert.equal('denied' in noEvidence && noEvidence.denied, true);
    assert.match(
      ('reason' in noEvidence && noEvidence.reason) || '',
      /PROMOTE_WITHOUT_BENCHMARK_EVIDENCE/,
    );

    const noBaseline = compareAgainstBaselines({
      problemId: problem.problemId,
      datasetVersion: problem.datasetVersion,
      reproducibilitySeed: problem.reproducibilitySeed,
      classicalFamiliesRun: [],
      candidateId: 'x',
      observations: [
        {
          metric: 'runtime',
          baselineValue: 1,
          candidateValue: 1,
          unit: 'ms',
        },
      ],
    });
    assert.equal('denied' in noBaseline && noBaseline.denied, true);
    assert.match(
      ('reason' in noBaseline && noBaseline.reason) || '',
      /NO_CLASSICAL_BASELINE/,
    );

    const evidence = compareAgainstBaselines({
      problemId: problem.problemId,
      datasetVersion: problem.datasetVersion,
      reproducibilitySeed: problem.reproducibilitySeed,
      classicalFamiliesRun: problem.baselineAlgorithms,
      candidateId: 'qi-v0',
      observations: [
        {
          metric: 'solution_quality',
          baselineValue: 0.7,
          candidateValue: 0.85,
          unit: 'score',
        },
        {
          metric: 'runtime',
          baselineValue: 50,
          candidateValue: 120,
          unit: 'ms',
        },
      ],
    });
    assert.ok(!('denied' in evidence));
    if (!('denied' in evidence)) {
      const decision = evaluatePromotionGate({
        problem,
        evidence,
        requestedOutcome: 'BETTER_QUALITY',
        autoPromote: true,
      });
      assert.equal('denied' in decision && decision.denied, true);

      const recommend = evaluatePromotionGate({
        problem,
        evidence,
        requestedOutcome: 'BETTER_QUALITY',
      });
      assert.ok(!('denied' in recommend));
      if (!('denied' in recommend)) {
        assert.equal(recommend.outcome, 'BETTER_QUALITY');
        assert.equal(recommend.promoted, false);
        assert.equal(recommend.autoPromoted, false);
        assert.equal(recommend.requiresHumanReview, true);
        assert.match(recommend.reason, /RECOMMENDATION_ONLY/);
        assert.match(recommend.reason, /Improved:/);
        assert.match(recommend.reason, /Worsened:/);
      }

      const noAdvantage = evaluatePromotionGate({
        problem,
        evidence: {
          ...evidence,
          tradeoff: {
            improved: [],
            worsened: ['runtime'],
            unchanged: ['solution_quality'],
            narrative:
              'Improved: [none]. Worsened: [runtime]. Unchanged: [solution_quality].',
            honest: true,
          },
          observations: evidence.observations.map((o) =>
            o.metric === 'solution_quality'
              ? { ...o, candidateValue: o.baselineValue, direction: 'unchanged' }
              : o,
          ),
        },
        requestedOutcome: 'BETTER_QUALITY',
      });
      assert.ok(!('denied' in noAdvantage));
      if (!('denied' in noAdvantage)) {
        assert.equal(noAdvantage.outcome, 'NO_MEASURED_ADVANTAGE');
        assert.equal(noAdvantage.promoted, false);
      }
    }
  }
});

test('government proposal rule: deny vague "quantum-powered efficiency" without test data', () => {
  assert.equal(EO6_LOCKS.VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA, false);
  assert.equal(EO6_LOCKS.QUANTUM_POWERED_EFFICIENCY_WITHOUT_TEST_DATA, false);
  assert.ok(isVagueClaimText('Our quantum-powered efficiency wins RFPs'));
  assert.ok(VAGUE_CLAIM_PATTERNS.some((p) => p.includes('quantum-powered')));

  const denied = denyVagueQuantumPoweredEfficiencyClaim();
  assert.equal(denied.state, 'DENIED');
  assert.match(denied.reason, /QUANTUM_POWERED_EFFICIENCY_WITHOUT_TEST_DATA/);

  const vague = evaluateOptimizationClaim({
    claimText: 'quantum-powered efficiency for logistics routing',
    hasBenchmarkEvidence: false,
    classicalBaselineCompared: false,
  });
  assert.equal(vague.allowed, false);
  assert.equal(vague.state, 'DENIED');
  assert.equal(vague.vague, true);

  const noBaseline = evaluateOptimizationClaim({
    claimText: 'Candidate reduces latency 12% vs greedy baseline on dataset v1',
    hasBenchmarkEvidence: true,
    classicalBaselineCompared: false,
  });
  assert.equal(noBaseline.allowed, false);
  assert.match(noBaseline.reason, /CLASSICAL_BASELINE/);

  const ok = evaluateOptimizationClaim({
    claimText:
      'Candidate improves solution_quality 0.72→0.81 vs greedy+graph baselines; runtime worsened 40→95ms (seed=4059).',
    hasBenchmarkEvidence: true,
    classicalBaselineCompared: true,
  });
  assert.equal(ok.allowed, true);
  assert.equal(ok.state, 'PASS');
});

test('registerProblemDefinition rejects missing fields / empty baselines', () => {
  const missing = registerProblemDefinition(
    sampleProblem({ evidenceOwner: '' }),
  );
  assert.equal('denied' in missing && missing.denied, true);

  const noBaselines = registerProblemDefinition(
    sampleProblem({ baselineAlgorithms: [] }),
  );
  assert.equal('denied' in noBaselines && noBaselines.denied, true);

  const selected = selectClassicalBaselines({
    requiredFamilies: ['linear_programming'],
    includeMetaheuristics: true,
    metaheuristicSubtypes: ['genetic_algorithm', 'simulated_annealing'],
    dynamicProgrammingApplicable: true,
  });
  assert.ok(selected.families.includes('greedy_rule_based'));
  assert.ok(selected.families.includes('linear_programming'));
  assert.ok(selected.families.includes('dynamic_programming'));
  assert.ok(selected.families.includes('metaheuristics'));
});

test('full comparison cycle: evidence-backed tradeoff + promotion held for human review', () => {
  const cycle = runClassicalBaselineComparisonCycle({
    problem: sampleProblem(),
    candidateId: 'quantum_inspired_annealer_v0',
    observations: [
      {
        metric: 'solution_quality',
        baselineValue: 0.7,
        candidateValue: 0.82,
        unit: 'score',
      },
      {
        metric: 'runtime',
        baselineValue: 35,
        candidateValue: 110,
        unit: 'ms',
      },
      {
        metric: 'cost',
        baselineValue: 1.0,
        candidateValue: 1.4,
        unit: 'relative',
      },
      {
        metric: 'reproducibility',
        baselineValue: 1,
        candidateValue: 1,
        unit: 'pass',
      },
    ],
    requestedOutcome: 'BETTER_QUALITY',
    claimText:
      'quantum_inspired_annealer_v0 improves solution_quality vs greedy+graph; runtime and cost worsened (seed=4059).',
    repoRoot,
  });
  assert.ok(!('denied' in cycle));
  if (!('denied' in cycle)) {
    assert.equal(cycle.problem.problemId, 'routing-opt-001');
    assert.equal(cycle.evidence.tradeoff.improved.includes('solution_quality'), true);
    assert.equal(cycle.evidence.tradeoff.worsened.includes('runtime'), true);
    assert.equal(cycle.evidence.tradeoff.worsened.includes('cost'), true);
    assert.equal(cycle.promotion.outcome, 'BETTER_QUALITY');
    assert.equal(cycle.promotion.promoted, false);
    assert.equal(cycle.promotion.autoPromoted, false);
    assert.equal(cycle.claimGate.allowed, true);
    assert.equal(cycle.flowPosition, 'evidence_owner_attestation');
  }
});

test('soft-wire EO4 / EO5 / EM9: presence probes; EM9 classical quant expected PRESENT', () => {
  const soft = eo6SoftWireSnapshot(repoRoot);
  // EM9 classical quant benchmark is on this tip (EN ancestry).
  assert.equal(soft.em9ClassicalQuantBenchmark.present, true);
  assert.match(soft.em9ClassicalQuantBenchmark.note, /PRESENT/);

  // EO4 / EO5 may be WAITING_DATA on this parked tip — presence ≠ VERIFIED either way.
  assert.equal(typeof soft.eo4CapabilityMatrix.present, 'boolean');
  assert.equal(typeof soft.eo5EvidenceBoundary.present, 'boolean');
  assert.equal(EO6_LOCKS.PRESENCE_EQ_VERIFIED, false);

  const boot = bootstrapClassicalBaselineRequirement(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.l4AutonomyEnabled, false);
  assert.equal(boot.dbCandidatesStatus, 'NOT_APPLIED');
  assert.match(boot.nextPhase, /EO7/);
  assert.ok(boot.families.length >= 9);
  assert.ok(boot.metrics.length >= 11);
  assert.ok(EO6_MAY.includes('deny_vague_claims_without_benchmark_data'));
  assert.ok(EO6_MUST_NOT.includes('auto_promote_without_measured_advantage'));

  const eo4Hop = boot.hops.find((h) => h.hop === 'eo4_capability_matrix_soft_wire');
  const eo5Hop = boot.hops.find((h) => h.hop === 'eo5_evidence_boundary_soft_wire');
  const em9Hop = boot.hops.find(
    (h) => h.hop === 'em9_classical_quant_benchmark_soft_wire',
  );
  assert.ok(eo4Hop);
  assert.ok(eo5Hop);
  assert.ok(em9Hop);
  assert.equal(em9Hop?.state, 'PASS');
  assert.ok(eo4Hop && (eo4Hop.state === 'PASS' || eo4Hop.state === 'WAITING_DATA'));
  assert.ok(eo5Hop && (eo5Hop.state === 'PASS' || eo5Hop.state === 'WAITING_DATA'));
});
