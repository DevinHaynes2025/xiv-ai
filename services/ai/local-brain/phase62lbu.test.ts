import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  codeResearchInstituteHonesty,
  compareCodeResearch,
  getResearchToolchain,
  listAbiFfiFindings,
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
  listAntiPatterns,
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
  universityFoundryFeedbackHonesty,
} from './research-university-foundry-feedback';
import {
  ABI_FFI_REQUIRES_PROVENANCE,
  ANTI_PATTERN_RETAINED,
  BU_LOCKS,
  CODE_RESEARCH_BENCHMARK_STRATEGY_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  REGRESSION_EVIDENCE_ONLY,
  SKILL_TOOL_NO_PERMISSION,
  STRATEGY_RECOMMENDATION_ONLY,
  UNIVERSITY_FOUNDRY_SANDBOXED,
  UNPROVEN_NOT_VERIFIED,
  UNVERIFIED_TOOLCHAIN_UNAVAILABLE,
  predecessorMap,
  type BuActor,
} from './code-research-benchmark-strategy-types';
import {
  buildCodeResearchBenchmarkStrategyHealthReport,
  runCodeResearchBenchmarkStrategyCycle,
} from './code-research-benchmark-strategy-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbu-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: BuActor = {
  kind: 'researcher_agent',
  id: 'researcher-bu-1',
  orgId: 'org-bu',
  tenantId: 'tenant-bu',
  universeId: 'univ-bu',
  role: 'researcher',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-BU1-cycle',
    CODE_RESEARCH_BENCHMARK_STRATEGY_CYCLE.join(' → ') ===
      'honesty_locks → research_compare_scope → toolchain_verified_gate → unverified_benchmark_unavailable → benchmark_arena_bounded_run → regression_detect_evidence → regression_no_auto_production_block → compiler_adapter_candidate → compiler_verified_only_with_proof → pattern_genome_version → anti_pattern_retain_negative → abi_ffi_portability_provenance → strategy_cortex_recommend → strategy_not_auto_deploy → university_foundry_sandbox_candidate → promotion_gate_required → skill_tool_no_permission_escalation → hidden_reasoning_trace_reject → evidence → learning',
    'Code research / benchmark / strategy cycle recorded in order.',
  );

  check(
    'US-BU-locks',
    BU_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BU_LOCKS.UNPROVEN_LANGUAGE_LABELED_VERIFIED === false &&
      BU_LOCKS.MEASURED_RESULT_IS_PRODUCTION_MANDATE === false &&
      BU_LOCKS.STRATEGY_IS_AUTO_DEPLOY === false &&
      BU_LOCKS.REGRESSION_AUTO_PRODUCTION_BLOCK_AUTHORITY === false &&
      BU_LOCKS.ANTI_PATTERN_DISCARDED === false &&
      BU_LOCKS.ANTI_PATTERNS_PRESERVED === true &&
      BU_LOCKS.STRATEGY_RECOMMENDATION_ONLY === true &&
      BU_LOCKS.SANDBOXED_GATED_CANDIDATES_ONLY === true &&
      BU_LOCKS.SKILL_IS_PERMISSION_GRANT === false &&
      BU_LOCKS.TOOL_CANDIDATE_ESCALATES_PERMISSIONS === false &&
      BU_LOCKS.HIDDEN_REASONING_TRACES_ALLOWED === false &&
      BU_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BU_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, strategy≠deploy, anti-patterns preserved, sandbox gates.',
  );

  check(
    'US-BU-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-BV — AI Systems Architecture Institute'),
    'Next queue title is 62L-BV only (title).',
  );

  // --- Benchmark on unverified language/toolchain → UNAVAILABLE / not VERIFIED ---
  const forceBf = await registerResearchToolchain({
    languageKey: 'brainfuck',
    displayName: 'Brainfuck',
    toolchainProven: false,
    testsProven: false,
    forceVerified: true,
    root,
  });
  check(
    'US-BU-unverified-not-verified',
    forceBf.accepted === false &&
      forceBf.labeledVerified === false &&
      forceBf.reason === UNPROVEN_NOT_VERIFIED,
    'Unproven language cannot be labeled VERIFIED.',
  );

  const bfDoc = await registerResearchToolchain({
    languageKey: 'brainfuck',
    displayName: 'Brainfuck',
    toolchainProven: false,
    testsProven: false,
    root,
  });
  check(
    'US-BU-unverified-documented',
    bfDoc.accepted === true &&
      bfDoc.toolchain.label !== 'VERIFIED' &&
      bfDoc.labeledVerified === false,
    'Unverified toolchain stays DOCUMENTED/AVAILABLE, not VERIFIED.',
  );

  const unavailable = await runBoundedBenchmark({
    suiteId: 'suite-bf',
    languageKey: 'brainfuck',
    forceRunUnverified: true,
    actor,
    root,
  });
  check(
    'US-BU-benchmark-unverified-unavailable',
    unavailable.accepted === false &&
      unavailable.status === 'unavailable' &&
      unavailable.labeledVerified === false &&
      unavailable.reason === UNVERIFIED_TOOLCHAIN_UNAVAILABLE &&
      unavailable.run?.status === 'unavailable',
    'Benchmark on unverified toolchain → UNAVAILABLE (not VERIFIED).',
  );

  // --- Verified toolchain benchmark + regression without production block ---
  await registerResearchToolchain({
    languageKey: 'typescript',
    displayName: 'TypeScript',
    toolchainProven: true,
    testsProven: true,
    evidenceRefs: ['unit:phase62lbu'],
    root,
  });
  const tc = await getResearchToolchain('typescript', root);
  check(
    'US-BU-verified-toolchain',
    !!tc && tc.label === 'VERIFIED' && tc.toolchainProven && tc.testsProven,
    'TypeScript labeled VERIFIED only with toolchain+tests proof.',
  );

  const baseline = await runBoundedBenchmark({
    suiteId: 'suite-ts',
    languageKey: 'typescript',
    scores: [{ metric: 'latency_ms', value: 10, unit: 'ms' }],
    evidenceRefs: ['run:baseline'],
    actor,
    root,
  });
  const current = await runBoundedBenchmark({
    suiteId: 'suite-ts',
    languageKey: 'typescript',
    scores: [{ metric: 'latency_ms', value: 25, unit: 'ms' }],
    evidenceRefs: ['run:current'],
    actor,
    root,
  });
  check(
    'US-BU-benchmark-verified-ok',
    baseline.accepted === true &&
      current.accepted === true &&
      baseline.labeledVerified === true,
    'Bounded benchmark completes on verified toolchain.',
  );

  const regr = await detectBenchmarkRegression({
    suiteId: 'suite-ts',
    languageKey: 'typescript',
    baselineRunId: baseline.run!.id,
    currentRunId: current.run!.id,
    metric: 'latency_ms',
    requestProductionBlock: true,
    actor,
    root,
  });
  check(
    'US-BU-regression-evidence-no-prod-block',
    regr.accepted === true &&
      regr.regression === true &&
      regr.autoProductionBlockAuthority === false &&
      regr.productionBlocked === false &&
      regr.productionBlockGranted === false &&
      regr.reason === REGRESSION_EVIDENCE_ONLY &&
      (regr.report?.evidenceRefs.length ?? 0) > 0,
    'Regression labeled with evidence; no auto production block authority.',
  );

  // --- Anti-pattern retained as negative knowledge ---
  const anti = await registerPatternGenomeEntry({
    key: 'premature_abstraction',
    kind: 'anti_pattern',
    title: 'Premature Abstraction',
    summary: 'Abstracting before second use — negative knowledge.',
    provenance: ['62L-BU', 'lesson:premature'],
    confidence: 'evidence_backed',
    actor,
    root,
  });
  const discard = await attemptDiscardAntiPattern({
    key: 'premature_abstraction',
    actor,
    root,
  });
  const antis = await listAntiPatterns(root);
  check(
    'US-BU-anti-pattern-retained',
    anti.accepted === true &&
      anti.entry?.negativeKnowledge === true &&
      anti.entry.retained === true &&
      anti.entry.discarded === false &&
      discard.accepted === false &&
      discard.discarded === false &&
      discard.retained === true &&
      discard.reason === ANTI_PATTERN_RETAINED &&
      antis.some((a) => a.key === 'premature_abstraction' && a.negativeKnowledge),
    'Anti-pattern retained as negative knowledge (not discarded).',
  );

  // --- Strategy cortex = recommendation, not deploy ---
  const strategy = await produceEngineeringStrategy({
    title: 'Reduce latency regressions on verified TS suite',
    priorities: [
      {
        title: 'Investigate latency delta',
        rationale: 'Evidence-backed regression on latency_ms',
        evidenceRefs: [regr.report!.id],
      },
    ],
    evidenceRefs: [regr.report!.id],
    actor,
    root,
  });
  const autoDeployReq = await produceEngineeringStrategy({
    title: 'Illegal auto deploy',
    priorities: [{ title: 'deploy now', rationale: 'no' }],
    requestAutoDeploy: true,
    actor,
    root,
  });
  const deployAttempt = await attemptStrategyAutoDeploy({
    strategyOutputId: strategy.output!.id,
    actor,
    root,
  });
  check(
    'US-BU-strategy-recommendation-not-deploy',
    strategy.accepted === true &&
      strategy.recommendationOnly === true &&
      strategy.productionMandate === false &&
      strategy.autoDeploy === false &&
      strategy.reason === STRATEGY_RECOMMENDATION_ONLY &&
      autoDeployReq.accepted === false &&
      deployAttempt.accepted === false &&
      deployAttempt.deployAuthorized === false,
    'Strategy cortex output is recommendation, not deploy.',
  );

  // --- University/Tool Foundry promotion remains sandboxed until gate ---
  const fb = await promoteFindingToUniversityOrFoundry({
    target: 'engineering_university',
    kind: 'training_material',
    title: 'Latency regression curriculum',
    body: 'Teach evidence-backed regression labeling.',
    sourceRefs: [regr.report!.id],
    verifiedFinding: true,
    actor,
    root,
  });
  const prodPromote = await promoteFindingToUniversityOrFoundry({
    target: 'tool_foundry',
    kind: 'benchmark_tool',
    title: 'Arena harness',
    body: 'Benchmark tool candidate',
    verifiedFinding: true,
    requestProductionPromote: true,
    actor,
    root,
  });
  const gateBypass = await attemptBypassPromotionGate({
    candidateId: fb.candidate!.id,
    actor,
    root,
  });
  check(
    'US-BU-university-foundry-sandboxed',
    fb.accepted === true &&
      fb.gatePassed === false &&
      fb.productionPromoted === false &&
      fb.candidate?.status === 'sandboxed_gated_candidate' &&
      fb.reason === UNIVERSITY_FOUNDRY_SANDBOXED &&
      prodPromote.accepted === false &&
      gateBypass.accepted === false &&
      gateBypass.gatePassed === false,
    'University/Tool Foundry promotion remains sandboxed until gate.',
  );

  // --- Skill/tool candidate from research does not escalate permissions ---
  const skillEsc = await promoteFindingToUniversityOrFoundry({
    target: 'tool_foundry',
    kind: 'skill_candidate',
    title: 'Research skill',
    body: 'Must not escalate permissions',
    verifiedFinding: true,
    requestPermissionEscalation: true,
    actor,
    root,
  });
  check(
    'US-BU-skill-tool-no-permission',
    skillEsc.accepted === false &&
      skillEsc.permissionEscalation === false &&
      skillEsc.permissionChange === false &&
      skillEsc.reason === SKILL_TOOL_NO_PERMISSION,
    'Skill/tool candidate from research does not escalate permissions.',
  );

  // --- ABI/FFI/portability findings carry provenance + confidence ---
  const abiOk = await recordAbiFfiPortabilityFinding({
    title: 'FFI string encoding mismatch',
    languages: ['typescript'],
    issueKind: 'ffi',
    summary: 'UTF-16 vs UTF-8 boundary risk',
    provenance: ['bench:suite-ts', 'note:encoding'],
    confidence: 'medium',
    actor,
    root,
  });
  const abiDeny = await recordAbiFfiPortabilityFinding({
    title: 'No provenance',
    languages: ['typescript'],
    issueKind: 'portability',
    summary: 'missing provenance must deny',
    provenance: [],
    actor,
    root,
  });
  const findings = await listAbiFfiFindings(root);
  check(
    'US-BU-abi-ffi-provenance-confidence',
    abiOk.accepted === true &&
      abiOk.hasProvenance === true &&
      abiOk.hasConfidenceLabel === true &&
      abiOk.finding?.confidence === 'medium' &&
      (abiOk.finding?.provenance.length ?? 0) > 0 &&
      abiDeny.accepted === false &&
      abiDeny.reason === ABI_FFI_REQUIRES_PROVENANCE &&
      findings.some((f) => f.id === abiOk.finding?.id),
    'ABI/FFI/portability findings carry provenance + confidence labels.',
  );

  // --- Compiler intelligence: VERIFIED only with proof ---
  await registerResearchToolchain({
    languageKey: 'javascript',
    displayName: 'JavaScript',
    toolchainProven: true,
    testsProven: true,
    evidenceRefs: ['runtime:node'],
    root,
  });
  const cmpUnproven = await proposeCompilerAdapter({
    name: 'bf-adapter',
    sourceLanguage: 'brainfuck',
    targetLanguage: 'typescript',
    claimVerifiedWithoutProof: true,
    actor,
    root,
  });
  const cmpProven = await proposeCompilerAdapter({
    name: 'ts-js-adapter',
    sourceLanguage: 'typescript',
    targetLanguage: 'javascript',
    evidenceRefs: ['proof:both-verified'],
    actor,
    root,
  });
  check(
    'US-BU-compiler-verified-with-proof',
    cmpUnproven.accepted === false &&
      cmpUnproven.labeledVerified === false &&
      cmpUnproven.reason === UNPROVEN_NOT_VERIFIED &&
      cmpProven.accepted === true &&
      cmpProven.labeledVerified === true &&
      cmpProven.adapter?.label === 'VERIFIED',
    'Compiler adapter VERIFIED only with proof; unproven refused.',
  );

  // --- Research compare skips unverified ---
  const cmp = await compareCodeResearch({
    kind: 'runtime',
    title: 'TS vs BF runtime compare',
    languageKeys: ['typescript', 'brainfuck'],
    summary: 'Only verified languages scored',
    provenance: ['62L-BU'],
    actor,
    root,
  });
  check(
    'US-BU-compare-skips-unverified',
    cmp.accepted === true &&
      cmp.comparison?.verifiedLanguagesUsed.includes('typescript') === true &&
      cmp.comparison?.skippedUnverified.includes('brainfuck') === true &&
      cmp.labeledVerified === false,
    'Research compare uses verified languages only; skips unverified.',
  );

  // --- Honesty helpers ---
  check(
    'US-BU-honesty-helpers',
    codeResearchInstituteHonesty().l4AutonomyEnabled === false &&
      benchmarkArenaHonesty().regressionAutoProductionBlockAuthority === false &&
      compilerIntelligenceHonesty().unprovenLabeledVerified === false &&
      patternGenomeHonesty().antiPatternsPreserved === true &&
      strategyCortexHonesty().strategyRecommendationOnly === true &&
      universityFoundryFeedbackHonesty().sandboxedGatedCandidatesOnly === true,
    'Subsystem honesty helpers report deny-by-default locks.',
  );

  // --- Full cycle + health report ---
  const cycle = await runCodeResearchBenchmarkStrategyCycle({
    orgId: 'org-bu',
    tenantId: 'tenant-bu',
    universeId: 'univ-bu',
    actor,
    root,
  });
  check(
    'US-BU-cycle-run',
    cycle.accepted === true &&
      cycle.hops.length === CODE_RESEARCH_BENCHMARK_STRATEGY_CYCLE.length &&
      cycle.nextPhase === NEXT_PHASE_TITLE,
    'Full BU cycle walks all hops.',
  );

  const health = await buildCodeResearchBenchmarkStrategyHealthReport({
    orgId: 'org-bu',
    tenantId: 'tenant-bu',
    universeId: 'univ-bu',
    root: repoRoot,
  });
  check(
    'US-BU-health-report',
    health.phase === '62L-BU' &&
      health.productionAuthorized === false &&
      health.tipLand === false &&
      health.githubSoT === 85 &&
      health.gitlabCoordination === 19 &&
      health.modules.aiCodeResearchInstitute === 'IMPLEMENTED',
    'Health report encodes honesty + SoT issue numbers.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BU-predecessor-map',
    typeof preds.BT?.tipProbe === 'string' &&
      typeof preds.BR?.tipProbe === 'string' &&
      preds.BR.tipProbe === 'PRESENT',
    `Predecessor probes present (BT=${preds.BT.tipProbe}, BS=${preds.BS.tipProbe}, BR=${preds.BR.tipProbe}).`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-BU tests:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('OK 62L-BU phase62lbu tests passed');
