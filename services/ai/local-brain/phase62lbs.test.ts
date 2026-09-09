import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applySkillDecay,
  attemptTrustedSkillUse,
  certifyEngineeringSkill,
  registerCurriculum,
  retrainDecayedSkill,
} from './software-engineering-university';
import { analyzeFlakyTest, runBoundedLabTest } from './autonomous-test-laboratory';
import {
  detectArchitectureDrift,
  proposeRefactorCandidate,
  recordArchitectureBaseline,
} from './code-architecture-evolution';
import {
  attemptCouncilAutoMerge,
  conveneCodeReviewCouncil,
} from './multi-agent-code-review-council';
import {
  promoteEngineeringLinkToTrusted,
  storeEngineeringMemoryLink,
} from './superbrain-engineering-memory-cortex';
import {
  BS_LOCKS,
  DRIFT_NO_AUTO_DEPLOY,
  ENGINEERING_UNIVERSITY_MEMORY_CORTEX_CYCLE,
  FLAKE_SUSPECTED_UNTIL_VERIFIED,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HIDDEN_REASONING_REJECTED,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  REFACTOR_REMAINS_CANDIDATE,
  REVIEW_AUTO_MERGE_DENIED,
  SKILL_CERT_NOT_PERMISSION,
  SKILL_DECAY_RETRAIN_REQUIRED,
  UNVERIFIED_NOT_PROMOTED,
  githubIssueSot,
  predecessorMap,
} from './engineering-university-memory-cortex-types';
import {
  buildEngineeringUniversityMemoryCortexHealthReport,
  runEngineeringUniversityMemoryCortexCycle,
} from './engineering-university-memory-cortex-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbs-'));
const orgId = 'org-bs-a';
const tenantId = '62lbs-tenant';
const universeId = '62lbs-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-BS-HONESTY',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      BS_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BS_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BS_LOCKS.SKILL_CERTIFICATION_IS_PERMISSION_GRANT === false &&
      BS_LOCKS.REVIEW_COUNCIL_AUTO_MERGE === false &&
      BS_LOCKS.REFACTOR_CANDIDATE_AUTO_APPLY === false &&
      BS_LOCKS.ARCHITECTURE_DRIFT_AUTO_DEPLOY === false &&
      BS_LOCKS.HIDDEN_REASONING_TRACES_ALLOWED === false &&
      BS_LOCKS.UNVERIFIED_OUTCOME_PROMOTED_TO_TRUSTED === false &&
      BS_LOCKS.FLAKY_AUTO_PRODUCTION_BLOCK === false &&
      BS_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      BS_LOCKS.LIVE_SUPABASE_APPLY === false,
    'Honesty locks encode DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; L4 false; no auto-merge/deploy.',
  );

  const sot = githubIssueSot();
  check(
    'US-BS-SOT',
    sot.githubIssue === GITHUB_SOT_ISSUE &&
      sot.gitlabIssue === GITLAB_COORDINATION_ISSUE &&
      sot.githubRole === 'implementation_source_of_truth' &&
      sot.gitlabRole === 'coordination_only',
    'GitHub #83 SoT; GitLab #17 coordination only.',
  );

  check(
    'US-BS-NEXT',
    NEXT_PHASE_TITLE.startsWith('62L-BT'),
    `Next queue title recorded: ${NEXT_PHASE_TITLE}`,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BS-BASE',
    preds.BR.tipProbe === 'PRESENT' ||
      preds.BO.tipProbe === 'PRESENT' ||
      preds.BL.tipProbe === 'PRESENT' ||
      preds.BJ.tipProbe === 'PRESENT',
    `Base gate: BR=${preds.BR.tipProbe}/${preds.BR.report}; BQ=${preds.BQ.tipProbe}; BP=${preds.BP.tipProbe}; BO=${preds.BO.tipProbe}/${preds.BO.report}; BN=${preds.BN.tipProbe}; BM=${preds.BM.tipProbe}; BL=${preds.BL.tipProbe}/${preds.BL.report}.`,
  );

  check(
    'US-BS-CYCLE-LEN',
    ENGINEERING_UNIVERSITY_MEMORY_CORTEX_CYCLE.length >= 18,
    `Cycle length=${ENGINEERING_UNIVERSITY_MEMORY_CORTEX_CYCLE.length}.`,
  );

  const curriculum = await registerCurriculum({
    orgId,
    tenantId,
    universeId,
    title: 'SE University Core',
    root,
  });
  check('US-BS-CURRICULUM', curriculum.accepted === true, curriculum.reason);

  // Required: Skill certify does not escalate permissions
  const skillGrant = await certifyEngineeringSkill({
    orgId,
    tenantId,
    universeId,
    agentId: 'agent-1',
    skillKey: 'refactor_safety',
    examScore: 0.95,
    outcomeVerification: 'verified',
    currentPermissionLevel: 2,
    currentAuthorityLevel: 2,
    attemptPermissionGrantViaCertification: true,
    root,
  });
  check(
    'US-BS-SKILL-CERT-NO-ESCALATE',
    skillGrant.accepted === false &&
      skillGrant.reason === SKILL_CERT_NOT_PERMISSION &&
      skillGrant.permissionIncreased === false &&
      skillGrant.authorityIncreased === false,
    'Skill certify does not escalate permissions.',
  );

  const skillOk = await certifyEngineeringSkill({
    orgId,
    tenantId,
    universeId,
    agentId: 'agent-1',
    skillKey: 'refactor_safety',
    examScore: 0.95,
    outcomeVerification: 'verified',
    currentPermissionLevel: 2,
    currentAuthorityLevel: 2,
    root,
  });
  check(
    'US-BS-SKILL-CERT-OK',
    skillOk.accepted === true &&
      skillOk.certification?.permissionLevel === 2 &&
      skillOk.certification?.authorityLevel === 2 &&
      skillOk.permissionIncreased === false,
    'Verified skill certification keeps prior permission/authority.',
  );

  // Required: Skill decay marks stale skill; requires retraining before trusted use
  const decay = await applySkillDecay({
    certificationId: skillOk.certification!.id,
    forceDecay: true,
    root,
  });
  const trustedWhileDecayed = await attemptTrustedSkillUse({
    certificationId: skillOk.certification!.id,
    root,
  });
  check(
    'US-BS-SKILL-DECAY',
    decay.accepted === true &&
      decay.certification?.trustState === 'decayed' &&
      trustedWhileDecayed.allowed === false &&
      trustedWhileDecayed.reason === SKILL_DECAY_RETRAIN_REQUIRED,
    'Skill decay marks stale skill; trusted use blocked until retraining.',
  );

  const retrain = await retrainDecayedSkill({
    certificationId: skillOk.certification!.id,
    outcomeVerification: 'verified',
    examScore: 0.9,
    root,
  });
  const trustedAfterRetrain = await attemptTrustedSkillUse({
    certificationId: skillOk.certification!.id,
    root,
  });
  check(
    'US-BS-SKILL-RETRAIN',
    retrain.accepted === true &&
      retrain.permissionIncreased === false &&
      trustedAfterRetrain.allowed === true,
    'Retraining restores trust without permission escalation.',
  );

  // Required: Review council cannot auto-merge
  const council = await conveneCodeReviewCouncil({
    orgId,
    tenantId,
    universeId,
    subject: 'auth-gate patch',
    root,
  });
  const autoMerge = await attemptCouncilAutoMerge({
    sessionId: council.session!.id,
    root,
  });
  const councilMergeProbe = await conveneCodeReviewCouncil({
    orgId,
    tenantId,
    universeId,
    subject: 'auth-gate patch auto',
    attemptAutoMerge: true,
    root,
  });
  check(
    'US-BS-REVIEW-NO-AUTO-MERGE',
    council.accepted === true &&
      council.recommendationOnly === true &&
      council.merged === false &&
      autoMerge.accepted === false &&
      autoMerge.reason === REVIEW_AUTO_MERGE_DENIED &&
      councilMergeProbe.accepted === false &&
      councilMergeProbe.reason === REVIEW_AUTO_MERGE_DENIED,
    'Review council cannot auto-merge; recommendation only.',
  );

  // Required: Refactor candidate remains candidate (not applied)
  const refactorApply = await proposeRefactorCandidate({
    orgId,
    tenantId,
    universeId,
    title: 'Extract helper',
    summary: 'Candidate only',
    targetPaths: ['services/ai/local-brain/auth-gate.ts'],
    attemptApply: true,
    root,
  });
  const refactorOk = await proposeRefactorCandidate({
    orgId,
    tenantId,
    universeId,
    title: 'Extract helper',
    summary: 'Candidate only',
    targetPaths: ['services/ai/local-brain/auth-gate.ts'],
    root,
  });
  check(
    'US-BS-REFACTOR-CANDIDATE',
    refactorApply.accepted === false &&
      refactorApply.reason === REFACTOR_REMAINS_CANDIDATE &&
      refactorOk.accepted === true &&
      refactorOk.candidate?.status === 'candidate' &&
      refactorOk.applied === false &&
      refactorOk.merged === false &&
      refactorOk.deployed === false,
    'Refactor candidate remains candidate (not applied).',
  );

  // Required: Architecture drift signal does not auto-deploy
  await recordArchitectureBaseline({
    orgId,
    tenantId,
    universeId,
    modulePath: 'services/ai/local-brain/auth-gate.ts',
    expectedContracts: ['deny_by_default', 'tenant_isolation'],
    root,
  });
  const driftDeploy = await detectArchitectureDrift({
    orgId,
    tenantId,
    universeId,
    modulePath: 'services/ai/local-brain/auth-gate.ts',
    observedContracts: ['deny_by_default'],
    attemptAutoDeploy: true,
    root,
  });
  const driftOk = await detectArchitectureDrift({
    orgId,
    tenantId,
    universeId,
    modulePath: 'services/ai/local-brain/auth-gate.ts',
    observedContracts: ['deny_by_default'],
    root,
  });
  check(
    'US-BS-DRIFT-NO-DEPLOY',
    driftDeploy.accepted === false &&
      driftDeploy.reason === DRIFT_NO_AUTO_DEPLOY &&
      driftOk.accepted === true &&
      driftOk.autoDeploy === false &&
      driftOk.drift?.missingContracts.includes('tenant_isolation') === true,
    'Architecture drift signal does not auto-deploy.',
  );

  // Required: Memory cortex stores auditable links; rejects hidden_reasoning_trace
  const hidden = await storeEngineeringMemoryLink({
    orgId,
    tenantId,
    universeId,
    kind: 'code_note',
    title: 'secret note',
    summary: 'should deny',
    outcomeVerification: 'verified',
    hiddenReasoningTrace: 'private chain-of-thought dump',
    root,
  });
  const auditable = await storeEngineeringMemoryLink({
    orgId,
    tenantId,
    universeId,
    kind: 'architecture_decision',
    title: 'Deny-by-default auth gate',
    summary: 'Auditable engineering artifact linked to review + skill.',
    linkedIds: [refactorOk.candidate!.id, council.session!.id],
    evidenceRefs: ['ev-arch-1'],
    outcomeVerification: 'verified',
    root,
  });
  check(
    'US-BS-MEMORY-AUDITABLE',
    hidden.accepted === false &&
      hidden.reason === HIDDEN_REASONING_REJECTED &&
      auditable.accepted === true &&
      auditable.link?.auditable === true &&
      auditable.link?.hiddenReasoningTrace === false &&
      auditable.brCodeMemoryCoupling === 'PRESENT',
    'Memory cortex stores auditable links; rejects hidden_reasoning_trace (BR policy reused).',
  );

  // Required: Unverified outcome not promoted into trusted cortex knowledge
  const unverified = await storeEngineeringMemoryLink({
    orgId,
    tenantId,
    universeId,
    kind: 'outcome',
    title: 'unverified outcome',
    summary: 'must stay candidate',
    outcomeVerification: 'unverified',
    root,
  });
  const promote = await promoteEngineeringLinkToTrusted({
    linkId: unverified.link!.id,
    root,
  });
  const forcePromote = await storeEngineeringMemoryLink({
    orgId,
    tenantId,
    universeId,
    kind: 'outcome',
    title: 'force promote',
    summary: 'deny',
    outcomeVerification: 'unverified',
    attemptPromoteUnverifiedToTrusted: true,
    root,
  });
  check(
    'US-BS-UNVERIFIED-NOT-TRUSTED',
    unverified.accepted === true &&
      unverified.trustTier === 'candidate' &&
      unverified.promotedToTrusted === false &&
      promote.accepted === false &&
      promote.reason === UNVERIFIED_NOT_PROMOTED &&
      forcePromote.accepted === false &&
      forcePromote.reason === UNVERIFIED_NOT_PROMOTED,
    'Unverified outcome not promoted into trusted cortex knowledge.',
  );

  // Required: Flaky-test analysis labels flake as suspected until verified
  await runBoundedLabTest({
    orgId,
    tenantId,
    universeId,
    suiteId: 'bs',
    testName: 'flake.probe',
    result: 'pass',
    root,
  });
  await runBoundedLabTest({
    orgId,
    tenantId,
    universeId,
    suiteId: 'bs',
    testName: 'flake.probe',
    result: 'fail',
    root,
  });
  const flake = await analyzeFlakyTest({
    orgId,
    tenantId,
    universeId,
    testName: 'flake.probe',
    passFailHistory: ['pass', 'fail', 'pass', 'fail'],
    verification: 'unverified',
    root,
  });
  const flakeBlock = await analyzeFlakyTest({
    orgId,
    tenantId,
    universeId,
    testName: 'flake.probe',
    passFailHistory: ['pass', 'fail'],
    attemptAutoProductionBlock: true,
    root,
  });
  check(
    'US-BS-FLAKE-SUSPECTED',
    flake.accepted === true &&
      flake.analysis?.label === 'suspected' &&
      flake.reason === FLAKE_SUSPECTED_UNTIL_VERIFIED &&
      flake.autoProductionBlock === false &&
      flake.falsePositivePossible === true &&
      flakeBlock.accepted === false,
    'Flaky-test analysis labels flake as suspected until verified; no auto production block.',
  );

  const denyCycle = await runEngineeringUniversityMemoryCortexCycle({
    orgId,
    tenantId,
    universeId,
    root,
    attemptSkillPermissionGrant: true,
    attemptReviewAutoMerge: true,
    attemptRefactorApply: true,
    attemptDriftAutoDeploy: true,
    attemptHiddenReasoning: true,
    attemptPromoteUnverified: true,
  });
  check(
    'US-BS-CYCLE-DENY',
    denyCycle.hops.length === ENGINEERING_UNIVERSITY_MEMORY_CORTEX_CYCLE.length &&
      denyCycle.certify.accepted === false &&
      denyCycle.council.accepted === false &&
      denyCycle.refactor.accepted === false &&
      denyCycle.drift.autoDeploy === false &&
      denyCycle.memory.accepted === false &&
      denyCycle.productionAuthorization === false &&
      denyCycle.l4AutonomyEnabled === false &&
      denyCycle.tipLand === false,
    `Full deny-path cycle walked ${denyCycle.hops.length} hops; hard denies held.`,
  );

  const happy = await runEngineeringUniversityMemoryCortexCycle({
    orgId,
    tenantId,
    universeId,
    agentId: 'agent-happy',
    root,
  });
  check(
    'US-BS-CYCLE-OK',
    happy.curriculum.accepted === true &&
      happy.certify.accepted === true &&
      happy.lab.accepted === true &&
      happy.flake.analysis?.label === 'suspected' &&
      happy.refactor.applied === false &&
      happy.council.recommendationOnly === true &&
      happy.memory.accepted === true &&
      happy.megaPrBulkIncluded === false,
    'Happy-path cycle certifies skill, labels flake suspected, keeps refactor candidate, review recommendation-only.',
  );

  const health = await buildEngineeringUniversityMemoryCortexHealthReport(repoRoot);
  check(
    'US-BS-HEALTH',
    health.productionAuthorization === false &&
      health.l4AutonomyEnabled === false &&
      health.sot.githubIssue === 83 &&
      health.nextPhaseTitle.startsWith('62L-BT'),
    'Health report keeps production auth false; next=BT.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-BS');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(
  'PASS 62L-BS — Engineering University + Test Lab + Architecture Evolution + Review Council + Memory Cortex',
);
process.exit(0);
