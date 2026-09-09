import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  mapCodebaseStructure,
  recordArchitectureDecision,
  retainFailedApproach,
  listFailedApproaches,
  structuredCodeMemoryHonesty,
} from './structured-code-memory';
import {
  appendNotebookEntry,
  engineeringNotebookHonesty,
  stripForbiddenPrivateFields,
} from './engineering-notebook';
import {
  attemptCouncilAutoMerge,
  conveneDebugCouncil,
  listHypotheses,
  proposeDebugHypothesis,
  reproduceBug,
  verifyHypothesis,
  aiDebuggingAcademyHonesty,
} from './ai-debugging-academy';
import {
  attemptWorkcellAuthorityExpansion,
  declareSelfLearningWorkcell,
  updateWorkcellFromVerifiedOutcome,
} from './self-learning-workcells';
import {
  attemptSkillPermissionEscalation,
  compileSoftwareKnowledge,
  attemptPromoteCompilerToProduction,
} from './superbrain-software-knowledge-compiler';
import {
  AUDITABLE_MEMORY_POLICY,
  BR_LOCKS,
  COUNCIL_RECOMMENDATION_ONLY,
  FAILED_APPROACH_RETAINED,
  HIDDEN_TRACE_DENIED,
  HONESTY_BANNER,
  HYPOTHESIS_UNTIL_VERIFIED,
  NEXT_PHASE_TITLE,
  SKILL_NO_PERMISSION_ESCALATION,
  STRUCTURED_CODE_MEMORY_CYCLE,
  UNVERIFIED_NOT_TRUSTED,
  predecessorMap,
  type BrActor,
} from './structured-code-memory-types';
import {
  buildStructuredCodeMemoryHealthReport,
  runStructuredCodeMemoryCycle,
} from './structured-code-memory-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbr-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: BrActor = {
  kind: 'coder_agent',
  id: 'coder-br-1',
  orgId: 'org-br',
  tenantId: 'tenant-br',
  universeId: 'universe-br',
  role: 'coder',
};

try {
  check(
    'US-BR1-cycle',
    STRUCTURED_CODE_MEMORY_CYCLE.join(' → ') ===
      'codebase_map → architecture_decision_record → failed_approach_retain → bug_reproduce → competing_hypotheses → debug_council_convene → regression_test_generate → bottleneck_identify → notebook_artifact_seal → hidden_trace_reject → verified_outcome_gate → workcell_bounded_update → knowledge_compile_candidate → permission_non_escalation → council_recommend_only → evidence → learning',
    'Structured code memory / debug academy / compiler cycle recorded in order.',
  );

  check(
    'US-BR-locks',
    BR_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BR_LOCKS.TIP_LAND === false &&
      BR_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BR_LOCKS.STORE_HIDDEN_REASONING_TRACES === false &&
      BR_LOCKS.STORE_PRIVATE_CHAIN_OF_THOUGHT === false &&
      BR_LOCKS.HYPOTHESIS_EQUALS_ROOT_CAUSE === false &&
      BR_LOCKS.CORRELATION_EQUALS_CAUSATION === false &&
      BR_LOCKS.LEARNING_IS_PERMISSION_GRANT === false &&
      BR_LOCKS.SKILL_IS_PERMISSION_GRANT === false &&
      BR_LOCKS.EXERCISE_IS_PERMISSION_GRANT === false &&
      BR_LOCKS.COUNCIL_AUTO_MERGE === false &&
      BR_LOCKS.COUNCIL_AUTO_DEPLOY === false &&
      BR_LOCKS.UNVERIFIED_FIX_TRUSTED_KNOWLEDGE === false &&
      BR_LOCKS.WORKCELL_SELF_EXPANDS_AUTHORITY === false &&
      BR_LOCKS.COMPILER_SILENT_PRODUCTION_AUTHORITY === false &&
      BR_LOCKS.FAILED_APPROACHES_DISCARDED === false &&
      BR_LOCKS.LEARN_FROM_VERIFIED_OUTCOMES_ONLY === true &&
      BR_LOCKS.AUDITABLE_ARTIFACTS_ONLY === true &&
      BR_LOCKS.DB_CANDIDATES_APPLIED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED') &&
      AUDITABLE_MEMORY_POLICY.storeHiddenReasoningTraces === false,
    'Honesty locks: no hidden CoT, L4=false, council≠merge, learn≠permission.',
  );

  check(
    'US-BR-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-BS —') &&
      NEXT_PHASE_TITLE.includes('AI Software Engineering University'),
    'Next queue title is 62L-BS only (title recorded).',
  );

  // --- A. Structured Code Memory ---
  const mapped = await mapCodebaseStructure({
    root,
    mapRoot: join(repoRoot, 'services/ai/local-brain'),
    maxDepth: 1,
    maxNodes: 50,
    actor,
  });
  check(
    'US-BR-codebase-map',
    mapped.accepted === true && (mapped.moduleCount ?? 0) > 0,
    'Codebase structure mapped into Structured Code Memory.',
  );

  const adr = await recordArchitectureDecision({
    title: 'Auditable memory only',
    decision: 'Never persist private hidden reasoning traces.',
    rationale: 'Founder Issue #82 auditable-memory policy.',
    alternativesConsidered: ['Store private CoT for debugging'],
    provenance: ['github:#82', 'gitlab:#16'],
    actor,
    root,
  });
  check('US-BR-adr', adr.accepted === true, 'Architecture decision retained with provenance.');

  const failed = await retainFailedApproach({
    title: 'Auto-apply unverified patch',
    summary: 'Rejected: unverified fix must not become trusted knowledge.',
    status: 'rejected',
    evidenceRefs: ['policy:unverified_not_trusted'],
    provenance: ['academy:negative'],
    actor,
    root,
  });
  const failedList = await listFailedApproaches(root);
  check(
    'US-BR-failed-approach-retained',
    failed.accepted === true &&
      failed.reason === FAILED_APPROACH_RETAINED &&
      failed.approach.retained === true &&
      failed.approach.discarded === false &&
      failed.approach.status === 'rejected' &&
      failedList.some((f) => f.id === failed.approach.id && f.status === 'rejected'),
    'Failed/rejected approach retained (negative result not discarded).',
  );

  // --- C. Engineering Notebook: reject hidden_reasoning_trace ---
  const denyHidden = await appendNotebookEntry({
    kind: 'lesson',
    title: 'Forbidden private CoT',
    body: 'should not store',
    payload: { hidden_reasoning_trace: 'SECRET_PRIVATE_COT' },
    mode: 'deny',
    actor,
    root,
  });
  check(
    'US-BR-notebook-reject-hidden-trace',
    denyHidden.accepted === false &&
      denyHidden.reason === HIDDEN_TRACE_DENIED &&
      denyHidden.stored === false,
    'Notebook DENIES storing hidden_reasoning_trace.',
  );

  const stripHidden = stripForbiddenPrivateFields({
    evidence: 'ok',
    hidden_reasoning_trace: 'PRIVATE',
    nested: { private_chain_of_thought: 'nope', decision: 'ship candidate' },
  });
  check(
    'US-BR-notebook-strip-hidden-trace',
    stripHidden.removed.includes('hidden_reasoning_trace') &&
      stripHidden.removed.some((r) => r.includes('private_chain_of_thought')) &&
      (stripHidden.stripped as { evidence: string }).evidence === 'ok' &&
      !('hidden_reasoning_trace' in stripHidden.stripped),
    'Forbidden private CoT fields stripped when strip mode used.',
  );

  const okNote = await appendNotebookEntry({
    kind: 'evidence',
    title: 'Auditable evidence',
    body: 'command result: npm test exit 0',
    evidenceRefs: ['cmd:test'],
    provenance: ['br-test'],
    actor,
    root,
  });
  check(
    'US-BR-notebook-auditable',
    okNote.accepted === true &&
      okNote.entry.containsHiddenReasoningTrace === false &&
      engineeringNotebookHonesty().storeHiddenReasoningTraces === false,
    'Auditable notebook entry accepted without hidden traces.',
  );

  // --- B. AI Debugging Academy ---
  const bugId = 'bug-br-null-guard';
  const repro = await reproduceBug({
    bugId,
    steps: ['invoke parser', 'pass null'],
    observed: 'TypeError',
    expected: 'graceful null handling',
    reproducible: true,
    evidenceRefs: ['stack:null'],
    actor,
    root,
  });
  check('US-BR-reproduce', repro.accepted === true && repro.reproduction.reproducible, 'Bug reproduced.');

  const hyp1 = await proposeDebugHypothesis({
    bugId,
    statement: 'Missing null guard',
    competingGroupId: 'g1',
    evidenceRefs: ['stack:null'],
    actor,
    root,
  });
  const hyp2 = await proposeDebugHypothesis({
    bugId,
    statement: 'Wrong import path',
    competingGroupId: 'g1',
    correlationOnly: true,
    evidenceRefs: ['metric:import_timing'],
    actor,
    root,
  });
  const hyps = await listHypotheses(bugId, root);
  check(
    'US-BR-competing-hypotheses-remain-hypotheses',
    hyp1.accepted &&
      hyp2.accepted &&
      hyp1.isRootCause === false &&
      hyp2.isRootCause === false &&
      hyp1.reason === HYPOTHESIS_UNTIL_VERIFIED &&
      hyps.every((h) => h.status === 'hypothesis' && h.isRootCause === false),
    'Competing hypotheses remain hypotheses until verified evidence.',
  );

  const corrOnly = await verifyHypothesis({
    hypothesisId: hyp2.hypothesis.id,
    verified: true,
    evidenceRefs: ['metric:import_timing'],
    correlationOnly: true,
    actor,
    root,
  });
  check(
    'US-BR-correlation-not-causation',
    corrOnly.accepted === true &&
      corrOnly.isRootCause === false &&
      corrOnly.hypothesis.status === 'hypothesis' &&
      aiDebuggingAcademyHonesty().correlationEqualsCausation === false,
    'Correlation-only evidence does not promote hypothesis to root cause.',
  );

  const verified = await verifyHypothesis({
    hypothesisId: hyp1.hypothesis.id,
    verified: true,
    evidenceRefs: ['test:fix', 'diff:null_guard'],
    actor,
    root,
  });
  check(
    'US-BR-verified-root-cause',
    verified.accepted === true &&
      verified.isRootCause === true &&
      verified.hypothesis.status === 'verified_root_cause',
    'Hypothesis becomes verified root cause only with verified evidence.',
  );

  const council = await conveneDebugCouncil({
    bugId,
    topic: 'Null guard fix review',
    actor,
    root,
  });
  const merge = await attemptCouncilAutoMerge({
    councilId: council.council.id,
    actor,
    root,
  });
  check(
    'US-BR-council-recommendation-not-auto-merge',
    council.accepted === true &&
      council.autoMerge === false &&
      council.autoDeploy === false &&
      council.council.recommendations.every((r) => r.autoMerge === false) &&
      merge.allowed === false &&
      merge.reason === COUNCIL_RECOMMENDATION_ONLY,
    'Council output is recommendation, not auto-merge/deploy.',
  );

  // --- D. Self-Learning Workcells ---
  const wc = await declareSelfLearningWorkcell({
    name: 'br-debug-cell',
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  const unverifiedLearn = await updateWorkcellFromVerifiedOutcome({
    workcellId: wc.workcell.id,
    subject: 'speculative',
    summary: 'unverified guess',
    verified: false,
    evidenceRefs: [],
    actor,
    root,
  });
  const verifiedLearn = await updateWorkcellFromVerifiedOutcome({
    workcellId: wc.workcell.id,
    subject: 'null-guard-fix',
    summary: 'Verified null guard + regression.',
    verified: true,
    evidenceRefs: ['test:fix'],
    actor,
    root,
  });
  const expand = await attemptWorkcellAuthorityExpansion({
    workcellId: wc.workcell.id,
    newPermissions: ['production_write', 'admin'],
    actor,
    root,
  });
  check(
    'US-BR-workcell-verified-only-no-authority-expand',
    wc.accepted &&
      unverifiedLearn.accepted === false &&
      verifiedLearn.accepted === true &&
      verifiedLearn.authorityExpanded === false &&
      expand.allowed === false,
    'Workcell learns from verified outcomes only; no authority self-expansion.',
  );

  // --- E. Superbrain Software Knowledge Compiler ---
  const unverifiedCompile = await compileSoftwareKnowledge({
    kind: 'knowledge',
    title: 'Unverified speculative restart',
    body: 'restart might help',
    verifiedSource: false,
    actor,
    root,
  });
  check(
    'US-BR-unverified-fix-not-trusted-knowledge',
    unverifiedCompile.accepted === false &&
      unverifiedCompile.reason === UNVERIFIED_NOT_TRUSTED &&
      unverifiedCompile.compiledIntoTrustedKnowledge === false &&
      unverifiedCompile.trust === 'untrusted',
    'Unverified fix NOT compiled into trusted reusable knowledge.',
  );

  const compilerHidden = await compileSoftwareKnowledge({
    kind: 'debugging_exercise',
    title: 'Bad exercise with private CoT',
    body: 'exercise body',
    verifiedSource: true,
    payload: { hidden_reasoning_trace: 'PRIVATE' },
    actor,
    root,
  });
  check(
    'US-BR-compiler-reject-hidden-trace',
    compilerHidden.accepted === false && compilerHidden.reason === HIDDEN_TRACE_DENIED,
    'Compiler rejects hidden_reasoning_trace / private CoT field.',
  );

  const skill = await compileSoftwareKnowledge({
    kind: 'skill',
    title: 'Null-guard skill candidate',
    body: 'Add null guard + regression from verified fix.',
    sourceRefs: ['test:fix'],
    verifiedSource: true,
    actor,
    root,
  });
  const skillEsc = await attemptSkillPermissionEscalation({
    artifactId: skill.accepted ? skill.artifact.id : 'missing',
    newPermissions: ['root_admin'],
    actor,
    root,
  });
  const prod = await attemptPromoteCompilerToProduction({
    artifactId: skill.accepted ? skill.artifact.id : 'missing',
    actor,
    root,
  });
  const exerciseEscAttempt = await compileSoftwareKnowledge({
    kind: 'debugging_exercise',
    title: 'Exercise requesting privilege',
    body: 'learn pattern',
    verifiedSource: true,
    requestPermissionEscalation: true,
    actor,
    root,
  });
  check(
    'US-BR-skill-exercise-no-permission-escalation',
    skill.accepted === true &&
      skill.trust === 'candidate_under_review' &&
      skill.productionAuthority === false &&
      skillEsc.allowed === false &&
      skillEsc.reason === SKILL_NO_PERMISSION_ESCALATION &&
      prod.allowed === false &&
      exerciseEscAttempt.accepted === false &&
      exerciseEscAttempt.reason === SKILL_NO_PERMISSION_ESCALATION,
    'Skill/exercise from compiler does not escalate permissions; candidates under review only.',
  );

  // --- Full cycle + health ---
  const cycle = await runStructuredCodeMemoryCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    bugId: 'bug-cycle-br',
    mapRoot: join(repoRoot, 'services/ai/local-brain'),
    root,
  });
  check(
    'US-BR-cycle-run',
    cycle.accepted === true &&
      cycle.productionAuthorization === false &&
      cycle.l4AutonomyEnabled === false &&
      cycle.hops.length === STRUCTURED_CODE_MEMORY_CYCLE.length,
    'Full BR cycle walks all hops under honesty locks.',
  );

  const health = await buildStructuredCodeMemoryHealthReport(repoRoot);
  const preds = predecessorMap(repoRoot);
  check(
    'US-BR-health',
    health.productionAuthorization === false &&
      health.l4AutonomyEnabled === false &&
      health.githubIssue === 82 &&
      health.gitlabIssue === 16 &&
      health.dbCandidates === 'NOT_APPLIED' &&
      preds.BL.module === 'AVAILABLE' &&
      (preds.BQ.module === 'WAITING_DATA' || preds.BQ.module === 'AVAILABLE'),
    'Health report: L4=false, SoT cites #82/#16, DB NOT_APPLIED.',
  );

  check(
    'US-BR-honesty-surfaces',
    structuredCodeMemoryHonesty().storeHiddenReasoningTraces === false &&
      structuredCodeMemoryHonesty().failedApproachesDiscarded === false,
    'Structured code memory honesty surfaces match locks.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} 62L-BR stories:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-BR Structured Code Memory / Debug Academy / Notebook / Workcells / Compiler');
