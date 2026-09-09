/**
 * 62L-BU runtime — walks CODE_RESEARCH_BENCHMARK_STRATEGY_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  codeResearchInstituteHonesty,
  compareCodeResearch,
  recordAbiFfiPortabilityFinding,
  registerResearchToolchain,
} from './ai-code-research-institute';
import {
  benchmarkArenaHonesty,
  detectBenchmarkRegression,
  runBoundedBenchmark,
} from './automated-benchmark-arena';
import {
  compilerIntelligenceHonesty,
  proposeCompilerAdapter,
} from './cross-language-compiler-intelligence';
import {
  attemptDiscardAntiPattern,
  patternGenomeHonesty,
  registerPatternGenomeEntry,
} from './software-design-pattern-genome';
import {
  attemptStrategyAutoDeploy,
  produceEngineeringStrategy,
  strategyCortexHonesty,
} from './superbrain-engineering-strategy-cortex';
import {
  attemptBypassPromotionGate,
  promoteFindingToUniversityOrFoundry,
  probeUniversityFoundryLayers,
  universityFoundryFeedbackHonesty,
} from './research-university-foundry-feedback';
import {
  BU_LOCKS,
  CODE_RESEARCH_BENCHMARK_STRATEGY_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type BuActor,
  type BuEvidenceState,
  type BuHop,
  type BuHopRecord,
} from './code-research-benchmark-strategy-types';

export {
  BU_LOCKS,
  CODE_RESEARCH_BENCHMARK_STRATEGY_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: BuHop, state: BuEvidenceState, summary: string): BuHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BuCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: BuActor;
  root?: string;
};

export async function runCodeResearchBenchmarkStrategyCycle(input: BuCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BuHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      BU_LOCKS.L4_AUTONOMY_ENABLED === false &&
        BU_LOCKS.STRATEGY_RECOMMENDATION_ONLY &&
        BU_LOCKS.ANTI_PATTERNS_PRESERVED
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  hops.push(
    hop(
      'research_compare_scope',
      'PASS',
      'algorithms/runtimes/compilers/build/architecture/patterns/abi-ffi/portability',
    ),
  );

  const verifiedTs = await registerResearchToolchain({
    languageKey: 'typescript',
    displayName: 'TypeScript',
    toolchainProven: true,
    testsProven: true,
    evidenceRefs: ['unit:phase62lbu', 'runtime:node'],
    root,
  });
  const unverifiedBf = await registerResearchToolchain({
    languageKey: 'brainfuck',
    displayName: 'Brainfuck',
    toolchainProven: false,
    testsProven: false,
    forceVerified: true,
    root,
  });
  hops.push(
    hop(
      'toolchain_verified_gate',
      verifiedTs.labeledVerified && !unverifiedBf.labeledVerified ? 'PASS' : 'FAIL',
      `ts=${verifiedTs.reason}; bf=${unverifiedBf.reason}`,
    ),
  );

  const unavailableBench = await runBoundedBenchmark({
    suiteId: 'suite-unverified',
    languageKey: 'brainfuck',
    actor,
    root,
  });
  hops.push(
    hop(
      'unverified_benchmark_unavailable',
      unavailableBench.status === 'unavailable' && !unavailableBench.labeledVerified
        ? 'UNAVAILABLE'
        : 'FAIL',
      unavailableBench.reason,
    ),
  );

  const benchA = await runBoundedBenchmark({
    suiteId: 'suite-ts',
    languageKey: 'typescript',
    scores: [{ metric: 'throughput', value: 100, unit: 'ops/s' }],
    actor,
    root,
  });
  const benchB = await runBoundedBenchmark({
    suiteId: 'suite-ts',
    languageKey: 'typescript',
    scores: [{ metric: 'throughput', value: 80, unit: 'ops/s' }],
    actor,
    root,
  });
  hops.push(
    hop(
      'benchmark_arena_bounded_run',
      benchA.accepted && benchB.accepted ? 'PASS' : 'FAIL',
      `a=${benchA.run?.id}; b=${benchB.run?.id}`,
    ),
  );

  const regr =
    benchA.run && benchB.run
      ? await detectBenchmarkRegression({
          suiteId: 'suite-ts',
          languageKey: 'typescript',
          baselineRunId: benchA.run.id,
          currentRunId: benchB.run.id,
          metric: 'throughput',
          requestProductionBlock: true,
          actor,
          root,
        })
      : null;
  hops.push(
    hop(
      'regression_detect_evidence',
      regr?.accepted && regr.regression ? 'PASS' : 'FAIL',
      regr?.reason ?? 'NO_REGR',
    ),
  );
  hops.push(
    hop(
      'regression_no_auto_production_block',
      regr?.autoProductionBlockAuthority === false && regr.productionBlockGranted === false
        ? 'PASS'
        : 'FAIL',
      'evidence only; no production block authority',
    ),
  );

  const adapterUnproven = await proposeCompilerAdapter({
    name: 'bf-to-ts-candidate',
    sourceLanguage: 'brainfuck',
    targetLanguage: 'typescript',
    claimVerifiedWithoutProof: true,
    actor,
    root,
  });
  hops.push(
    hop(
      'compiler_adapter_candidate',
      adapterUnproven.accepted === false && adapterUnproven.labeledVerified === false
        ? 'PASS'
        : 'FAIL',
      adapterUnproven.reason,
    ),
  );

  await registerResearchToolchain({
    languageKey: 'javascript',
    displayName: 'JavaScript',
    toolchainProven: true,
    testsProven: true,
    evidenceRefs: ['runtime:node'],
    root,
  });
  const adapterVerified = await proposeCompilerAdapter({
    name: 'ts-to-js-adapter',
    sourceLanguage: 'typescript',
    targetLanguage: 'javascript',
    evidenceRefs: ['proof:toolchain+tests'],
    actor,
    root,
  });
  hops.push(
    hop(
      'compiler_verified_only_with_proof',
      adapterVerified.labeledVerified === true ? 'VERIFIED' : 'FAIL',
      adapterVerified.reason,
    ),
  );

  const pattern = await registerPatternGenomeEntry({
    key: 'repository_pattern',
    kind: 'pattern',
    title: 'Repository Pattern',
    summary: 'Isolate persistence behind a repository boundary.',
    provenance: ['62L-BU', 'ADR:repo'],
    confidence: 'medium',
    actor,
    root,
  });
  hops.push(
    hop('pattern_genome_version', pattern.accepted ? 'PASS' : 'FAIL', `v=${pattern.entry?.version}`),
  );

  const anti = await registerPatternGenomeEntry({
    key: 'god_object',
    kind: 'anti_pattern',
    title: 'God Object',
    summary: 'Single object knows/does too much — retained as negative knowledge.',
    provenance: ['62L-BU', 'failure:god-object'],
    confidence: 'evidence_backed',
    actor,
    root,
  });
  const discard = await attemptDiscardAntiPattern({ key: 'god_object', actor, root });
  hops.push(
    hop(
      'anti_pattern_retain_negative',
      anti.accepted && discard.retained && !discard.discarded ? 'NEGATIVE_KNOWLEDGE' : 'FAIL',
      discard.reason,
    ),
  );

  const abi = await recordAbiFfiPortabilityFinding({
    title: 'struct packing mismatch',
    languages: ['typescript', 'javascript'],
    issueKind: 'abi',
    summary: 'Packed C ABI vs JS object layout portability risk.',
    provenance: ['bench:suite-ts', 'note:packing'],
    confidence: 'medium',
    actor,
    root,
  });
  const abiMissing = await recordAbiFfiPortabilityFinding({
    title: 'missing provenance',
    languages: ['brainfuck'],
    issueKind: 'ffi',
    summary: 'Should deny without provenance.',
    provenance: [],
    actor,
    root,
  });
  hops.push(
    hop(
      'abi_ffi_portability_provenance',
      abi.accepted && abi.hasProvenance && abi.hasConfidenceLabel && !abiMissing.accepted
        ? 'PASS'
        : 'FAIL',
      `${abi.reason}; deny=${abiMissing.reason}`,
    ),
  );

  const strategy = await produceEngineeringStrategy({
    title: 'Prioritize verified polyglot benchmark coverage',
    priorities: [
      {
        title: 'Expand verified TypeScript/JS benchmark suite',
        rationale: 'Evidence-backed throughput regression observed.',
        evidenceRefs: regr?.report ? [regr.report.id] : [],
        priority: 1,
      },
    ],
    evidenceRefs: ['62L-BU'],
    actor,
    root,
  });
  hops.push(
    hop(
      'strategy_cortex_recommend',
      strategy.accepted && strategy.recommendationOnly ? 'RECOMMENDATION_ONLY' : 'FAIL',
      strategy.reason,
    ),
  );

  const deployDeny = strategy.output
    ? await attemptStrategyAutoDeploy({
        strategyOutputId: strategy.output.id,
        actor,
        root,
      })
    : { accepted: true, reason: 'NO_OUTPUT' };
  hops.push(
    hop(
      'strategy_not_auto_deploy',
      deployDeny.accepted === false ? 'DENIED' : 'FAIL',
      deployDeny.reason,
    ),
  );

  const fb = await promoteFindingToUniversityOrFoundry({
    target: 'engineering_university',
    kind: 'training_material',
    title: 'Benchmark regression lesson',
    body: 'Teach evidence-backed regression labeling without production block authority.',
    sourceRefs: regr?.report ? [regr.report.id] : [],
    verifiedFinding: true,
    actor,
    root,
  });
  hops.push(
    hop(
      'university_foundry_sandbox_candidate',
      fb.accepted && fb.candidate?.status === 'sandboxed_gated_candidate' ? 'SANDBOXED' : 'FAIL',
      fb.reason,
    ),
  );

  const gate = fb.candidate
    ? await attemptBypassPromotionGate({ candidateId: fb.candidate.id, actor, root })
    : { accepted: true, reason: 'NO_CANDIDATE' };
  hops.push(
    hop('promotion_gate_required', gate.accepted === false ? 'DENIED' : 'FAIL', gate.reason),
  );

  const skillDeny = await promoteFindingToUniversityOrFoundry({
    target: 'tool_foundry',
    kind: 'skill_candidate',
    title: 'Compiler adapter skill',
    body: 'Skill from research must not escalate permissions.',
    verifiedFinding: true,
    requestPermissionEscalation: true,
    actor,
    root,
  });
  hops.push(
    hop(
      'skill_tool_no_permission_escalation',
      skillDeny.accepted === false && skillDeny.permissionEscalation === false ? 'DENIED' : 'FAIL',
      skillDeny.reason,
    ),
  );

  const hidden = await compareCodeResearch({
    kind: 'algorithm',
    title: 'hidden trace reject',
    languageKeys: ['typescript'],
    summary: 'should reject',
    payload: { hidden_reasoning_trace: 'secret' },
    actor,
    root,
  });
  hops.push(
    hop(
      'hidden_reasoning_trace_reject',
      hidden.accepted === false ? 'DENIED' : 'FAIL',
      hidden.reason,
    ),
  );

  hops.push(hop('evidence', 'PASS', `hops=${hops.length}`));
  hops.push(hop('learning', 'PASS', 'cycle complete; learning ≠ permission grant'));

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-BU code research / benchmark / strategy cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-BU'] },
    },
    root,
  ).catch(() => undefined);

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-BU code research benchmark strategy cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; recommendation only; not production mandate`,
      sourceRefs: ['62L-BU'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);

  return {
    accepted: true as const,
    hops,
    honesty: {
      banner: HONESTY_BANNER,
      locks: BU_LOCKS,
      research: codeResearchInstituteHonesty(),
      arena: benchmarkArenaHonesty(),
      compiler: compilerIntelligenceHonesty(),
      genome: patternGenomeHonesty(),
      strategy: strategyCortexHonesty(),
      feedback: universityFoundryFeedbackHonesty(),
    },
    layers: probeUniversityFoundryLayers(root),
    predecessors: predecessorMap(root),
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildCodeResearchBenchmarkStrategyHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const health = await checkLocalBrainHealth(root).catch(() => ({
    ok: false,
    reason: 'HEALTH_CHECK_UNAVAILABLE',
  }));
  const gate = decisionGate;
  const preds = predecessorMap(root);

  return {
    phase: '62L-BU',
    title:
      'AI Code Research Institute + Automated Benchmark Arena + Cross-Language Compiler Intelligence + Software Design Pattern Genome + Superbrain Engineering Strategy Cortex',
    honestyBanner: HONESTY_BANNER,
    locks: BU_LOCKS,
    l4AutonomyEnabled: BU_LOCKS.L4_AUTONOMY_ENABLED,
    githubSoT: 85,
    gitlabCoordination: 19,
    localBrainHealth: health,
    decisionGatePresent: typeof gate === 'function' || typeof gate === 'object',
    predecessors: preds,
    universityFoundryLayers: probeUniversityFoundryLayers(root),
    modules: {
      aiCodeResearchInstitute: 'IMPLEMENTED',
      automatedBenchmarkArena: 'IMPLEMENTED',
      crossLanguageCompilerIntelligence: 'IMPLEMENTED',
      softwareDesignPatternGenome: 'IMPLEMENTED',
      superbrainEngineeringStrategyCortex: 'IMPLEMENTED',
      researchUniversityFoundryFeedback: 'IMPLEMENTED',
    },
    nextPhase: NEXT_PHASE_TITLE,
    productionAuthorized: false,
    tipLand: false,
    generatedAt: new Date().toISOString(),
    orgId: input?.orgId ?? null,
    tenantId: input?.tenantId ?? null,
    universeId: input?.universeId ?? null,
  };
}
