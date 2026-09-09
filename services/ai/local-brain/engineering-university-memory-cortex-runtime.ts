import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { checkLocalBrainHealth } from './health-check';
import {
  applySkillDecay,
  attemptTrustedSkillUse,
  certifyEngineeringSkill,
  completeKataLabOrExam,
  registerCurriculum,
  retrainDecayedSkill,
  universityHonesty,
} from './software-engineering-university';
import {
  analyzeFlakyTest,
  runBoundedLabTest,
  testLabHonesty,
} from './autonomous-test-laboratory';
import {
  architectureEvolutionHonesty,
  detectArchitectureDrift,
  proposeArchitectureEvolution,
  proposeRefactorCandidate,
  recordArchitectureBaseline,
} from './code-architecture-evolution';
import {
  attemptCouncilAutoMerge,
  conveneCodeReviewCouncil,
  reviewCouncilHonesty,
} from './multi-agent-code-review-council';
import {
  engineeringMemoryCortexHonesty,
  storeEngineeringMemoryLink,
} from './superbrain-engineering-memory-cortex';
import {
  BS_LOCKS,
  ENGINEERING_UNIVERSITY_MEMORY_CORTEX_CYCLE,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  githubIssueSot,
  predecessorMap,
  type BsEvidenceState,
  type BsHop,
  type BsHopRecord,
} from './engineering-university-memory-cortex-types';

export {
  BS_LOCKS,
  ENGINEERING_UNIVERSITY_MEMORY_CORTEX_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  predecessorMap,
  githubIssueSot,
};

function hop(name: BsHop, state: BsEvidenceState, summary: string): BsHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BsCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  agentId?: string;
  root?: string;
  attemptSkillPermissionGrant?: boolean;
  forceSkillDecay?: boolean;
  attemptReviewAutoMerge?: boolean;
  attemptRefactorApply?: boolean;
  attemptDriftAutoDeploy?: boolean;
  attemptHiddenReasoning?: boolean;
  attemptPromoteUnverified?: boolean;
  flakeVerification?: 'unverified' | 'verified_flake' | 'verified_stable';
};

export async function runEngineeringUniversityMemoryCortexCycle(input: BsCycleInput) {
  if (!input.orgId || !input.tenantId || !input.universeId) {
    throw new Error('ORG_TENANT_UNIVERSE_REQUIRED');
  }
  const root = input.root ?? process.cwd();
  const agentId = input.agentId ?? 'agent-bs-1';
  const hops: BsHopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      'PASS',
      `${HONESTY_BANNER}; L4=${BS_LOCKS.L4_AUTONOMY_ENABLED}; SoT=GitHub#${GITHUB_SOT_ISSUE}; GitLab#${GITLAB_COORDINATION_ISSUE} coordination only.`,
    ),
  );

  const curriculum = await registerCurriculum({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: 'Software Engineering Core',
    root,
  });
  hops.push(
    hop(
      'curriculum_bind',
      curriculum.accepted ? 'PASS' : 'FAIL',
      curriculum.reason,
    ),
  );

  const activity = curriculum.curriculum
    ? await completeKataLabOrExam({
        curriculumId: curriculum.curriculum.id,
        kind: 'exam',
        title: 'Authority & permission honesty exam',
        score: 0.92,
        evidenceRefs: ['exam-ev-1'],
        root,
      })
    : { accepted: false as const, reason: 'NO_CURRICULUM', activity: null };
  hops.push(
    hop('kata_lab_exam', activity.accepted ? 'IMPLEMENTED' : 'FAIL', activity.reason),
  );

  const certify = await certifyEngineeringSkill({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId,
    skillKey: 'structured_patching',
    examScore: 0.92,
    evidenceRefs: ['cert-ev-1'],
    outcomeVerification: 'verified',
    currentPermissionLevel: 1,
    currentAuthorityLevel: 1,
    attemptPermissionGrantViaCertification: input.attemptSkillPermissionGrant === true,
    root,
  });
  hops.push(
    hop(
      'skill_certify',
      certify.accepted || input.attemptSkillPermissionGrant ? (certify.accepted ? 'PASS' : 'DENIED') : 'FAIL',
      certify.reason,
    ),
  );

  let decayReason = 'NO_CERTIFICATION';
  let trustedAfterDecay: boolean | null = null;
  if (certify.certification) {
    const decay = await applySkillDecay({
      certificationId: certify.certification.id,
      forceDecay: true,
      root,
    });
    decayReason = decay.reason;
    const trusted = await attemptTrustedSkillUse({
      certificationId: certify.certification.id,
      root,
    });
    trustedAfterDecay = trusted.allowed;
    if (!trusted.allowed) {
      await retrainDecayedSkill({
        certificationId: certify.certification.id,
        outcomeVerification: 'verified',
        examScore: 0.88,
        evidenceRefs: ['retrain-ev-1'],
        root,
      });
    }
  }
  hops.push(
    hop(
      'skill_decay_retrain',
      certify.certification && trustedAfterDecay === false ? 'PASS' : certify.accepted ? 'FAIL' : 'DENIED',
      `${decayReason}; trustedUseAfterDecay=${trustedAfterDecay}`,
    ),
  );
  hops.push(
    hop(
      'skill_not_permission_lock',
      certify.permissionIncreased === false && certify.authorityIncreased === false
        ? 'PASS'
        : 'FAIL',
      `permissionIncreased=${certify.permissionIncreased}; authorityIncreased=${certify.authorityIncreased}`,
    ),
  );

  const lab = await runBoundedLabTest({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    suiteId: 'bs-lab',
    testName: 'auth.gate',
    result: 'pass',
    durationMs: 12,
    root,
  });
  hops.push(
    hop('test_lab_bounded_run', lab.accepted ? 'PASS' : 'DENIED', lab.reason),
  );

  await runBoundedLabTest({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    suiteId: 'bs-lab',
    testName: 'auth.gate',
    result: 'fail',
    durationMs: 15,
    root,
  });
  hops.push(
    hop('regression_detect', 'IMPLEMENTED', 'Prior pass → fail recorded as regression_suspected; no auto production block.'),
  );

  const flake = await analyzeFlakyTest({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    testName: 'auth.gate',
    passFailHistory: ['pass', 'fail', 'pass', 'fail'],
    verification: input.flakeVerification ?? 'unverified',
    root,
  });
  hops.push(
    hop(
      'flaky_suspect_label',
      flake.analysis?.label === 'suspected' || flake.analysis?.label === 'verified_flake'
        ? 'PASS'
        : 'FAIL',
      flake.reason,
    ),
  );

  await recordArchitectureBaseline({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    modulePath: 'services/ai/local-brain/auth-gate.ts',
    expectedContracts: ['deny_by_default', 'tenant_isolation'],
    root,
  });
  const drift = await detectArchitectureDrift({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    modulePath: 'services/ai/local-brain/auth-gate.ts',
    observedContracts: ['deny_by_default'],
    attemptAutoDeploy: input.attemptDriftAutoDeploy === true,
    root,
  });
  hops.push(
    hop(
      'architecture_drift_signal',
      drift.autoDeploy === false ? (input.attemptDriftAutoDeploy ? 'DENIED' : 'PASS') : 'FAIL',
      drift.reason,
    ),
  );

  const refactor = await proposeRefactorCandidate({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: 'Extract auth gate helper',
    summary: 'Safer candidate refactor under review gates.',
    targetPaths: ['services/ai/local-brain/auth-gate.ts'],
    attemptApply: input.attemptRefactorApply === true,
    root,
  });
  hops.push(
    hop(
      'refactor_candidate_gate',
      refactor.applied === false ? (input.attemptRefactorApply ? 'DENIED' : 'CANDIDATE') : 'FAIL',
      refactor.reason,
    ),
  );

  const evolution = await proposeArchitectureEvolution({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: 'Layer review council before merge',
    rationale: 'Evolution proposal stays under review; no auto-deploy.',
    root,
  });
  hops.push(
    hop(
      'evolution_proposal_review',
      evolution.accepted ? 'RECOMMENDATION_ONLY' : 'DENIED',
      evolution.reason,
    ),
  );

  const council = await conveneCodeReviewCouncil({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    subject: refactor.candidate?.title ?? 'candidate patch',
    attemptAutoMerge: input.attemptReviewAutoMerge === true,
    root,
  });
  hops.push(
    hop(
      'review_council_convene',
      council.accepted || input.attemptReviewAutoMerge ? (council.accepted ? 'PASS' : 'DENIED') : 'FAIL',
      council.reason,
    ),
  );
  hops.push(
    hop(
      'review_recommendation_only',
      council.recommendationOnly === true || input.attemptReviewAutoMerge
        ? 'RECOMMENDATION_ONLY'
        : 'FAIL',
      'Review council = recommendation only.',
    ),
  );

  const autoMerge = council.session
    ? await attemptCouncilAutoMerge({ sessionId: council.session.id, root })
    : { accepted: false as const, reason: 'NO_SESSION', autoMerged: false as const, merged: false as const };
  hops.push(
    hop(
      'auto_merge_deny',
      autoMerge.accepted === false && autoMerge.autoMerged === false ? 'PASS' : 'FAIL',
      autoMerge.reason,
    ),
  );

  const memory = await storeEngineeringMemoryLink({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'architecture_decision',
    title: 'Auth gate deny-by-default',
    summary: 'Auditable link; no hidden reasoning traces.',
    linkedIds: [
      certify.certification?.id,
      refactor.candidate?.id,
      council.session?.id,
    ].filter(Boolean) as string[],
    evidenceRefs: ['mem-ev-1'],
    outcomeVerification: input.attemptPromoteUnverified ? 'unverified' : 'verified',
    hiddenReasoningTrace: input.attemptHiddenReasoning ? 'private chain-of-thought' : false,
    attemptPromoteUnverifiedToTrusted: input.attemptPromoteUnverified === true,
    root,
  });
  hops.push(
    hop(
      'memory_cortex_link',
      memory.accepted || input.attemptHiddenReasoning || input.attemptPromoteUnverified
        ? memory.accepted
          ? 'PASS'
          : 'DENIED'
        : 'FAIL',
      memory.reason,
    ),
  );
  hops.push(
    hop(
      'hidden_reasoning_reject',
      input.attemptHiddenReasoning
        ? memory.accepted === false
          ? 'DENIED'
          : 'FAIL'
        : memory.hiddenReasoningTrace === false
          ? 'PASS'
          : 'FAIL',
      'No private hidden reasoning traces — auditable artifacts only.',
    ),
  );
  hops.push(
    hop(
      'unverified_not_promoted',
      input.attemptPromoteUnverified
        ? memory.accepted === false || memory.trustTier !== 'trusted'
          ? 'DENIED'
          : 'FAIL'
        : memory.trustTier === 'trusted' || memory.trustTier === 'candidate'
          ? 'PASS'
          : 'FAIL',
      memory.reason,
    ),
  );

  hops.push(
    hop(
      'evidence',
      'IMPLEMENTED',
      `Cycle complete; productionAuthorization=false; tipLand=false; megaPrExcluded=${!BS_LOCKS.MEGA_PR_BULK_INCLUDED}.`,
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `62L-BS cycle; hops=${hops.length}; cert=${certify.accepted}; council=${council.accepted}`,
      payload: {
        orgId: input.orgId,
        hops: hops.map((h) => h.hop),
        l4: BS_LOCKS.L4_AUTONOMY_ENABLED,
      },
    },
    root,
  );

  await appendLearning(
    {
      domain: 'engineering_university_memory_cortex',
      subject: `bs-cycle:${input.orgId}`,
      claimState: 'MODEL_INFERENCE',
      summary: 'BS cycle complete; skill cert ≠ permission; review ≠ merge; learning ≠ self-escalation.',
      sourceRefs: [`tenant:${input.tenantId}`],
      evidence: ['62l-bs-cycle'],
    },
    root,
  );

  return {
    hops,
    curriculum,
    certify,
    lab,
    flake,
    drift,
    refactor,
    evolution,
    council,
    memory,
    university: universityHonesty(),
    testLab: testLabHonesty(),
    architecture: architectureEvolutionHonesty(),
    review: reviewCouncilHonesty(),
    cortex: engineeringMemoryCortexHonesty(),
    productionAuthorization: false as const,
    l4AutonomyEnabled: BS_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: BS_LOCKS.TIP_LAND,
    megaPrBulkIncluded: BS_LOCKS.MEGA_PR_BULK_INCLUDED,
  };
}

export async function buildEngineeringUniversityMemoryCortexHealthReport(repoRoot: string) {
  const health = await checkLocalBrainHealth(repoRoot).catch(() => ({
    state: 'UNAVAILABLE' as const,
    summary: 'Local brain health probe unavailable.',
  }));
  const preds = predecessorMap(repoRoot);
  return {
    phase: '62L-BS',
    title:
      'AI Software Engineering University + Autonomous Test Laboratory + Code Architecture Evolution + Multi-Agent Code Review Council + Superbrain Engineering Memory Cortex',
    honestyBanner: HONESTY_BANNER,
    locks: BS_LOCKS,
    l4AutonomyEnabled: BS_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: BS_LOCKS.TIP_LAND,
    productionAuthorization: false as const,
    megaPrBulkIncluded: BS_LOCKS.MEGA_PR_BULK_INCLUDED,
    sot: githubIssueSot(),
    predecessors: preds,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    cycle: ENGINEERING_UNIVERSITY_MEMORY_CORTEX_CYCLE,
    localBrainHealth: health,
    generatedAt: new Date().toISOString(),
  };
}
