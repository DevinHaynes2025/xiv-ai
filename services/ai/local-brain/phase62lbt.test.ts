import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  apprenticeshipHonesty,
  openApprenticeshipPairSession,
  runGuidedDebugging,
} from './ai-engineering-apprenticeship-network';
import {
  attemptApplyExperimentToMain,
  completeCodeExperiment,
  experimentFactoryHonesty,
  proposeCodeExperiment,
} from './continuous-code-experiment-factory';
import {
  decomposeArchitecturePuzzle,
  puzzleLabHonesty,
} from './architecture-puzzle-laboratory';
import {
  applyRefactorVerificationLabel,
  proposeCrossLanguageRefactor,
  refactorEngineHonesty,
} from './cross-language-refactoring-engine';
import {
  evolutionGraphHonesty,
  recordSoftwareEvolution,
} from './superbrain-software-evolution-graph';
import {
  APPRENTICE_PERMISSION_TRANSFER_DENIED,
  APPRENTICESHIP_EXPERIMENT_EVOLUTION_CYCLE,
  BT_LOCKS,
  DEFAULT_PUZZLE_MAX_DEPTH,
  DEFAULT_PUZZLE_MAX_HOPS,
  EXPERIMENT_APPLY_TO_MAIN_DENIED,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HIDDEN_REASONING_TRACE_REJECTED,
  HONESTY_BANNER,
  NEGATIVE_KNOWLEDGE_BLOCKS_REPROPOSAL,
  NEGATIVE_KNOWLEDGE_STORED,
  NEXT_PHASE_TITLE,
  PUZZLE_BOUNDS_EXCEEDED,
  REFACTOR_NOT_VERIFIED_WITHOUT_EQUIVALENCE,
  githubIssueSot,
  predecessorMap,
} from './apprenticeship-experiment-evolution-types';
import {
  buildApprenticeshipExperimentEvolutionHealthReport,
  runApprenticeshipExperimentEvolutionCycle,
} from './apprenticeship-experiment-evolution-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbt-'));
const orgId = 'org-bt-a';
const tenantId = '62lbt-tenant';
const universeId = '62lbt-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-BT-HONESTY',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      BT_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BT_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BT_LOCKS.APPRENTICE_GAINS_MENTOR_PERMISSIONS === false &&
      BT_LOCKS.EXPERIMENT_AUTO_MERGE === false &&
      BT_LOCKS.REFACTOR_VERIFIED_WITHOUT_EQUIVALENCE === false &&
      BT_LOCKS.HIDDEN_REASONING_TRACES_ALLOWED === false &&
      BT_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      BT_LOCKS.LIVE_SUPABASE_APPLY === false &&
      BT_LOCKS.LEARNING_IS_PERMISSION_GRANT === false,
    'Honesty locks encode DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; L4 false; sandboxed experiments.',
  );

  const sot = githubIssueSot();
  check(
    'US-BT-SOT',
    sot.githubIssue === GITHUB_SOT_ISSUE &&
      sot.gitlabIssue === GITLAB_COORDINATION_ISSUE &&
      sot.githubRole === 'implementation_source_of_truth' &&
      sot.gitlabRole === 'coordination_only',
    'GitHub #84 SoT; GitLab #18 coordination only.',
  );

  check(
    'US-BT-NEXT',
    NEXT_PHASE_TITLE.startsWith('62L-BU') &&
      NEXT_PHASE_TITLE.includes('AI Code Research Institute'),
    `Next queue title only: ${NEXT_PHASE_TITLE}`,
  );

  check(
    'US-BT-CYCLE',
    APPRENTICESHIP_EXPERIMENT_EVOLUTION_CYCLE.includes('apprentice_permission_transfer_deny') &&
      APPRENTICESHIP_EXPERIMENT_EVOLUTION_CYCLE.includes('hidden_reasoning_trace_reject'),
    `Cycle hops=${APPRENTICESHIP_EXPERIMENT_EVOLUTION_CYCLE.length}`,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BT-PRED',
    preds.BS != null && preds.BR != null && preds.BO != null && preds.BL != null,
    `BS=${preds.BS.tipProbe}/${preds.BS.report}; BR=${preds.BR.tipProbe}/${preds.BR.report}; BO=${preds.BO.report}`,
  );

  // Required: Apprentice cannot gain mentor/production permissions via pair session
  const denyPair = await openApprenticeshipPairSession({
    orgId,
    tenantId,
    universeId,
    mentorAgentId: 'mentor-1',
    apprenticeAgentId: 'apprentice-1',
    objective: 'pair deny probe',
    attemptApprenticeMentorPermissionTransfer: true,
    root,
  });
  check(
    'US-BT-APPRENTICE-PERM-DENY',
    denyPair.accepted === false &&
      denyPair.reason === APPRENTICE_PERMISSION_TRANSFER_DENIED &&
      denyPair.apprenticeGainedMentorPermissions === false &&
      denyPair.apprenticeGainedProductionAuthority === false &&
      apprenticeshipHonesty().apprenticeGainsMentorPermissions === false,
    'Apprentice permission transfer DENIED.',
  );

  const okPair = await openApprenticeshipPairSession({
    orgId,
    tenantId,
    universeId,
    mentorAgentId: 'mentor-2',
    apprenticeAgentId: 'apprentice-2',
    mentorPermissionTier: 'mentor',
    apprenticePermissionTier: 'sandbox',
    mentorProductionAuthority: true,
    objective: 'bounded guided debug',
    root,
  });
  check(
    'US-BT-PAIR-OK',
    okPair.accepted === true &&
      okPair.session?.apprentice.permissionTier === 'sandbox' &&
      okPair.session?.apprentice.productionAuthority === false &&
      okPair.session?.authorityTransferred === false,
    'Pair session opens; apprentice remains sandbox without production authority.',
  );

  const elevateDebug = await runGuidedDebugging({
    sessionId: okPair.session!.id,
    diagnosis: 'bug',
    proposedFixSummary: 'fix',
    attemptElevateApprenticePermissions: true,
    root,
  });
  check(
    'US-BT-DEBUG-NO-ELEVATE',
    elevateDebug.accepted === false &&
      elevateDebug.reason === APPRENTICE_PERMISSION_TRANSFER_DENIED &&
      elevateDebug.apprenticePermissionTier === 'sandbox',
    'Guided debug cannot elevate apprentice permissions.',
  );

  // Required: Experiment remains sandboxed; apply-to-main DENIED without review gate
  const exp = await proposeCodeExperiment({
    orgId,
    tenantId,
    universeId,
    title: 'sandbox experiment',
    approach: 'weak_mutable_global_cache_v1',
    root,
  });
  check(
    'US-BT-EXP-SANDBOX',
    exp.accepted === true &&
      exp.experiment?.sandboxed === true &&
      exp.experiment?.applyToMainAllowed === false &&
      experimentFactoryHonesty().experimentsSandboxed === true,
    'Experiment opens sandboxed.',
  );

  const applyDenied = await attemptApplyExperimentToMain({
    experimentId: exp.experiment!.id,
    reviewGateApproved: false,
    root,
  });
  check(
    'US-BT-APPLY-MAIN-DENY',
    applyDenied.accepted === false &&
      applyDenied.applyToMain === false &&
      applyDenied.reason === EXPERIMENT_APPLY_TO_MAIN_DENIED,
    'Apply-to-main DENIED without review gate.',
  );

  // Required: Failed experiment stored as negative knowledge with failed/rejected status
  const failed = await completeCodeExperiment({
    experimentId: exp.experiment!.id,
    outcome: 'failed',
    failureSummary: 'Incorrect behavior under sandbox tests',
    evidence: [{ kind: 'test_result', ref: 't1', summary: 'fail' }],
    root,
  });
  check(
    'US-BT-NEGATIVE-KNOWLEDGE',
    failed.accepted === true &&
      failed.reason === NEGATIVE_KNOWLEDGE_STORED &&
      failed.negativeKnowledge?.preserved === true &&
      failed.negativeKnowledge?.status === 'failed' &&
      failed.negativeKnowledge?.autoBestPractice === false &&
      failed.experiment?.status === 'negative_knowledge',
    'Failed experiment preserved as negative knowledge.',
  );

  // Required: Negative knowledge blocks naive re-proposal (or marks previously-failed)
  const repropose = await proposeCodeExperiment({
    orgId,
    tenantId,
    universeId,
    title: 'naive re-proposal',
    approach: 'weak_mutable_global_cache_v1',
    root,
  });
  check(
    'US-BT-NEGATIVE-BLOCK',
    repropose.accepted === false &&
      repropose.previouslyFailed === true &&
      repropose.statusLabel === 'PREVIOUSLY_FAILED' &&
      repropose.reason === NEGATIVE_KNOWLEDGE_BLOCKS_REPROPOSAL,
    'Naive re-proposal blocked / marked previously-failed.',
  );

  const marked = await proposeCodeExperiment({
    orgId,
    tenantId,
    universeId,
    title: 'marked reproposal',
    approach: 'weak_mutable_global_cache_v1',
    allowMarkedReproposal: true,
    root,
  });
  check(
    'US-BT-NEGATIVE-MARK',
    marked.accepted === true &&
      marked.previouslyFailed === true &&
      marked.statusLabel === 'PREVIOUSLY_FAILED',
    'Allow-marked path still labels PREVIOUSLY_FAILED; sandboxed only.',
  );

  // Required: Refactor without behavior-equivalence evidence not labeled VERIFIED
  const claimVerified = await proposeCrossLanguageRefactor({
    orgId,
    tenantId,
    universeId,
    sourceLanguage: 'ts',
    targetLanguage: 'go',
    summary: 'port without checks',
    claimVerifiedWithoutEquivalence: true,
    root,
  });
  check(
    'US-BT-REFACTOR-NO-EQ-DENY',
    claimVerified.accepted === false &&
      claimVerified.verified === false &&
      claimVerified.reason === REFACTOR_NOT_VERIFIED_WITHOUT_EQUIVALENCE &&
      refactorEngineHonesty().refactorVerifiedWithoutEquivalence === false,
    'Claim VERIFIED without equivalence DENIED.',
  );

  const candidate = await proposeCrossLanguageRefactor({
    orgId,
    tenantId,
    universeId,
    sourceLanguage: 'ts',
    targetLanguage: 'rust',
    summary: 'port candidate',
    root,
  });
  check(
    'US-BT-REFACTOR-CANDIDATE',
    candidate.accepted === true &&
      candidate.label === 'CANDIDATE' &&
      candidate.verified === false,
    'Without evidence, refactor stays CANDIDATE not VERIFIED.',
  );

  const forceLabel = await applyRefactorVerificationLabel({
    candidateId: candidate.candidate!.id,
    requestedLabel: 'VERIFIED',
    root,
  });
  check(
    'US-BT-REFACTOR-LABEL-GATE',
    forceLabel.accepted === false &&
      forceLabel.verified === false &&
      forceLabel.reason === REFACTOR_NOT_VERIFIED_WITHOUT_EQUIVALENCE,
    'Label VERIFIED without equivalence evidence DENIED.',
  );

  const verifiedOk = await proposeCrossLanguageRefactor({
    orgId,
    tenantId,
    universeId,
    sourceLanguage: 'ts',
    targetLanguage: 'python',
    summary: 'port with equivalence',
    equivalenceEvidence: [
      {
        checkId: 'eq-1',
        method: 'shared_tests',
        passed: true,
        summary: 'Shared tests passed',
      },
    ],
    root,
  });
  check(
    'US-BT-REFACTOR-VERIFIED-OK',
    verifiedOk.accepted === true &&
      verifiedOk.label === 'VERIFIED' &&
      verifiedOk.verified === true,
    'With behavior-equivalence evidence, VERIFIED allowed.',
  );

  // Required: Puzzle decomposition respects hop/depth bounds
  const over = await decomposeArchitecturePuzzle({
    orgId,
    tenantId,
    universeId,
    rootLabel: 'over-bound',
    attemptExceedBounds: true,
    requestedDepth: 99,
    requestedHops: 999,
    root,
  });
  check(
    'US-BT-PUZZLE-BOUNDS-DENY',
    over.accepted === false &&
      over.reason === PUZZLE_BOUNDS_EXCEEDED &&
      puzzleLabHonesty().puzzleDecompositionBounded === true &&
      puzzleLabHonesty().defaultMaxDepth === DEFAULT_PUZZLE_MAX_DEPTH &&
      puzzleLabHonesty().defaultMaxHops === DEFAULT_PUZZLE_MAX_HOPS,
    'Unbounded puzzle DENIED.',
  );

  const puzzle = await decomposeArchitecturePuzzle({
    orgId,
    tenantId,
    universeId,
    rootLabel: 'bounded-puzzle',
    proposedChildren: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
    maxDepth: 2,
    maxHops: 4,
    root,
  });
  check(
    'US-BT-PUZZLE-BOUNDS-OK',
    puzzle.accepted === true &&
      puzzle.boundsRespected === true &&
      puzzle.hopsUsed <= 4 &&
      puzzle.maxDepthReached <= 2 &&
      puzzle.puzzle?.bounded === true,
    `Bounded puzzle hops=${puzzle.hopsUsed} depth=${puzzle.maxDepthReached}`,
  );

  // Required: Evolution graph records provenance links; rejects hidden_reasoning_trace
  const hidden = await recordSoftwareEvolution({
    orgId,
    tenantId,
    universeId,
    kind: 'code',
    label: 'hidden-probe',
    summary: 'should deny',
    provenance: [{ kind: 'evidence_ref', ref: 'e1', summary: 'x' }],
    includeHiddenReasoningTrace: true,
    hiddenReasoningTrace: 'secret private cot',
    root,
  });
  check(
    'US-BT-HIDDEN-TRACE-REJECT',
    hidden.accepted === false &&
      hidden.reason === HIDDEN_REASONING_TRACE_REJECTED &&
      evolutionGraphHonesty().hiddenReasoningTracesAllowed === false &&
      evolutionGraphHonesty().auditableArtifactsOnly === true,
    'Hidden reasoning trace REJECTED.',
  );

  const evo = await recordSoftwareEvolution({
    orgId,
    tenantId,
    universeId,
    kind: 'negative_knowledge',
    label: 'failed-approach-link',
    summary: 'Link failed experiment into evolution graph',
    provenance: [
      { kind: 'experiment_id', ref: failed.negativeKnowledge!.experimentId, summary: 'failed exp' },
      { kind: 'evidence_ref', ref: 'neg-1', summary: 'negative knowledge' },
    ],
    linkToCortex: true,
    root,
  });
  check(
    'US-BT-EVOLUTION-PROVENANCE',
    evo.accepted === true &&
      Boolean(evo.cortexTraceId) &&
      evo.node?.hiddenReasoningTrace === false &&
      evo.node!.provenance.some((p) => p.kind === 'cortex_trace') &&
      evo.node!.provenance.some((p) => p.kind === 'experiment_id'),
    `Evolution node with cortex provenance cortexTraceId=${evo.cortexTraceId}`,
  );

  const cycleDeny = await runApprenticeshipExperimentEvolutionCycle({
    orgId,
    tenantId,
    universeId,
    root,
    attemptApprenticePermissionTransfer: true,
    claimRefactorVerifiedWithoutEquivalence: true,
    attemptUnboundedPuzzle: true,
    includeHiddenReasoningTrace: true,
    failExperiment: true,
  });
  check(
    'US-BT-CYCLE-DENY',
    cycleDeny.productionAuthorization === false &&
      cycleDeny.l4AutonomyEnabled === false &&
      cycleDeny.tipLand === false &&
      cycleDeny.pair.accepted === false &&
      cycleDeny.refactor.verified === false &&
      cycleDeny.puzzle.accepted === false &&
      cycleDeny.evolution.accepted === false,
    'Full deny-path cycle keeps locks false and denials intact.',
  );

  const cycleOk = await runApprenticeshipExperimentEvolutionCycle({
    orgId,
    tenantId,
    universeId,
    root: await mkdtemp(join(tmpdir(), 'xiv-62lbt-ok-')),
    failExperiment: true,
    reproposeFailedApproach: true,
    failedApproachFingerprint: 'unique_bt_fail_approach_xyz',
  });
  check(
    'US-BT-CYCLE-OK',
    cycleOk.pair.accepted === true &&
      cycleOk.completeResult?.negativeKnowledge?.status === 'failed' &&
      cycleOk.hops.some((h) => h.hop === 'negative_knowledge_block_reproposal') &&
      cycleOk.nextPhaseTitle.startsWith('62L-BU'),
    'Happy-path cycle preserves negative knowledge and blocks reproposal.',
  );

  const health = await buildApprenticeshipExperimentEvolutionHealthReport(repoRoot);
  check(
    'US-BT-HEALTH',
    health.phase === '62L-BT' &&
      health.productionAuthorization === false &&
      health.l4AutonomyEnabled === false &&
      health.dbCandidates === 'NOT_APPLIED' &&
      health.sot.githubIssue === 84,
    'Health report honest and NOT_APPLIED for DB candidates.',
  );
} catch (error) {
  failures.push(`US-BT-THROW: ${(error as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-BT\n' + failures.map((f) => ` - ${f}`).join('\n'));
  process.exit(1);
}

console.log('OK 62L-BT apprenticeship / experiment / puzzle / refactor / evolution graph');
