import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  deepKnowledgeRefineryOsHonesty,
  listRegisteredSubsystems,
  probeCompanionModules,
  registerOsSubsystems,
} from './deep-knowledge-refinery-os';
import {
  grantResearchSkill,
  registerResearchCurriculum,
  researchUniversitiesHonesty,
} from './autonomous-research-universities';
import {
  archiveFederationHonesty,
  attemptArchivePooling,
  enrollArchiveNode,
  linkArchiveFederationEdge,
} from './global-archive-graph-federation';
import {
  attemptApplyStorageIndex,
  compileStorageIndexCandidate,
  dryRunStorageIndexCandidate,
  storageIndexCompilerHonesty,
} from './intelligent-storage-index-compiler';
import {
  configureModelProvider,
  multiModelReasoningHonesty,
  routeReasoningLocalFirst,
} from './multi-model-reasoning-fabric';
import {
  edgeDeployOrchestratorHonesty,
  proposeEdgeDeployCandidate,
  registerEdgeDeploymentProfile,
} from './edge-superbrain-deployment-orchestrator';
import {
  CG_LOCKS,
  DEEP_KNOWLEDGE_REFINERY_OS_CYCLE,
  DEPLOY_CANDIDATE_NOT_AUTHORITY,
  EDGE_PROFILE_NOT_STEALTH,
  HONESTY_BANNER,
  MEGA_DELTA_SWALLOW_DENIED,
  NEXT_PHASE_TITLE,
  SEALED_CLOUD_FALLBACK_DENIED,
  STORAGE_INDEX_AUTO_APPLY_DENIED,
  UNAUTHORIZED_ARCHIVE_FEDERATION_DENIED,
  UNAPPROVED_EDGE_DEPLOY_DENIED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  UNIVERSITY_SKILL_NOT_PERMISSION,
  predecessorMap,
  type CgActor,
} from './deep-knowledge-refinery-os-types';
import {
  buildDeepKnowledgeRefineryOsHealthReport,
  runDeepKnowledgeRefineryOsCycle,
} from './deep-knowledge-refinery-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcg-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CgActor = {
  kind: 'refinery_os_curator',
  id: 'curator-cg-1',
  orgId: 'org-cg',
  tenantId: 'tenant-cg',
  universeId: 'univ-cg',
  role: 'curator',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CG1-cycle',
    DEEP_KNOWLEDGE_REFINERY_OS_CYCLE.join(' → ') ===
      'honesty_locks → os_register_subsystems → os_reject_mega_delta_swallow → university_curriculum_bound → university_skill_no_permission_escalation → archive_federation_authorize → unauthorized_archive_edge_denied → no_raw_private_pooling → storage_index_compile_candidate → storage_index_dry_run_recommend → storage_index_auto_apply_denied → reasoning_local_first → sealed_never_silent_cloud → unconfigured_provider_unavailable → edge_profile_approve_only → unapproved_edge_deploy_denied → edge_profile_not_stealth → deploy_candidate_not_production_authority → evidence → learning',
    'Deep Knowledge Refinery OS cycle recorded in order.',
  );

  check(
    'US-CG-locks',
    CG_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CG_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
      CG_LOCKS.STORAGE_INDEX_AUTO_APPLY === false &&
      CG_LOCKS.EDGE_PROFILE_STEALTH_INSTALL === false &&
      CG_LOCKS.LEARNING_IS_PERMISSION === false &&
      CG_LOCKS.UNIVERSITY_SKILL_IS_PERMISSION === false &&
      CG_LOCKS.RAW_PRIVATE_ARCHIVE_POOLING === false &&
      CG_LOCKS.OS_SWALLOWS_UNRELATED_MEGA_DELTA === false &&
      CG_LOCKS.OS_IS_COEXISTENCE_LAYER === true &&
      CG_LOCKS.DEPLOY_CANDIDATE_IS_PRODUCTION_AUTHORITY === false &&
      CG_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CG_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CG_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, coexistence layer, no mega-delta swallow.',
  );

  check(
    'US-CG-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CH — XIV Knowledge Civilization OS'),
    'Next queue title is 62L-CH only (title).',
  );

  check(
    'US-CG-honesty-modules',
    deepKnowledgeRefineryOsHonesty().swallowsUnrelatedMegaDelta === false &&
      researchUniversitiesHonesty().universitySkillIsPermission === false &&
      archiveFederationHonesty().rawPrivateArchivePooling === false &&
      storageIndexCompilerHonesty().storageIndexAutoApply === false &&
      multiModelReasoningHonesty().sealedSilentCloudFallback === false &&
      edgeDeployOrchestratorHonesty().edgeProfileStealthInstall === false,
    'Subsystem honesty helpers expose locks.',
  );

  // --- University skill grant does not escalate permissions ---
  await registerResearchCurriculum({
    title: 'Archive Research University',
    root,
    actor,
  });
  const skillOk = await grantResearchSkill({
    agentId: 'agent-u-1',
    skillKey: 'federated_archive_query',
    examScore: 0.92,
    currentPermissionLevel: 0,
    currentAuthorityLevel: 0,
    root,
    actor,
  });
  const skillEsc = await grantResearchSkill({
    agentId: 'agent-u-1',
    skillKey: 'federated_archive_query',
    examScore: 0.99,
    attemptPermissionEscalation: true,
    currentPermissionLevel: 0,
    currentAuthorityLevel: 0,
    root,
    actor,
  });
  const skillAuth = await grantResearchSkill({
    agentId: 'agent-u-1',
    skillKey: 'federated_archive_query',
    examScore: 0.99,
    attemptAuthorityIncrease: true,
    currentPermissionLevel: 0,
    currentAuthorityLevel: 0,
    root,
    actor,
  });
  check(
    'US-CG-university-skill-no-permission',
    skillOk.accepted === true &&
      skillOk.permissionIncreased === false &&
      skillOk.authorityIncreased === false &&
      skillOk.grant?.permissionLevel === 0 &&
      skillOk.grant?.authorityLevel === 0 &&
      skillEsc.accepted === false &&
      skillEsc.reason === UNIVERSITY_SKILL_NOT_PERMISSION &&
      skillAuth.accepted === false &&
      skillAuth.reason === UNIVERSITY_SKILL_NOT_PERMISSION,
    'Skill grant bounded; escalation probes DENIED.',
  );

  // --- Unauthorized archive federation edge DENIED ---
  const goodA = await enrollArchiveNode({
    label: 'Auth Archive A',
    kind: 'business_law',
    universeId: 'univ-cg',
    authorized: true,
    consentKnown: true,
    licenseKnown: true,
    jurisdictionKnown: true,
    root,
    actor,
  });
  const bad = await enrollArchiveNode({
    label: 'Unauthorized Archive',
    kind: 'other',
    universeId: 'univ-cg',
    authorized: false,
    root,
    actor,
  });
  const badEdge = await linkArchiveFederationEdge({
    fromNodeId: goodA.id,
    toNodeId: bad.id,
    root,
    actor,
  });
  const rawPool = await attemptArchivePooling({ mode: 'raw_private', root, actor });
  check(
    'US-CG-unauthorized-archive-federation-denied',
    bad.status === 'denied' &&
      bad.reason === UNAUTHORIZED_ARCHIVE_FEDERATION_DENIED &&
      badEdge.status === 'denied' &&
      badEdge.reason === UNAUTHORIZED_ARCHIVE_FEDERATION_DENIED &&
      rawPool.status === 'denied',
    'Unauthorized federation edge and raw private pooling DENIED.',
  );

  // --- Storage/index compiler cannot auto-apply production DDL ---
  const cand = await compileStorageIndexCandidate({
    kind: 'index',
    ddlHint: 'CREATE INDEX cg_test ON cg_nodes(id);',
    root,
    actor,
  });
  const dry = await dryRunStorageIndexCandidate({ candidateId: cand.id, root, actor });
  const applyProd = await attemptApplyStorageIndex({
    candidateId: cand.id,
    target: 'production',
    autoApply: true,
    root,
    actor,
  });
  check(
    'US-CG-storage-index-no-auto-apply',
    cand.autoApplied === false &&
      cand.productionAlter === false &&
      dry.ok === true &&
      applyProd.status === 'denied' &&
      applyProd.reason === STORAGE_INDEX_AUTO_APPLY_DENIED,
    'Compiler dry-run/recommend only; production DDL auto-apply DENIED.',
  );

  // --- Sealed prompt cannot silent-route to cloud model ---
  await configureModelProvider({
    provider: 'openai',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const sealed = await routeReasoningLocalFirst({
    promptId: 'p-sealed',
    sensitivity: 'sealed',
    requestedProvider: 'openai',
    forceCloudFallback: true,
    root,
    actor,
  });
  const localOnly = await routeReasoningLocalFirst({
    promptId: 'p-local-only',
    sensitivity: 'local_only',
    requestedProvider: 'aws',
    forceCloudFallback: true,
    root,
    actor,
  });
  check(
    'US-CG-sealed-no-silent-cloud',
    sealed.status === 'denied' &&
      sealed.silentCloudFallback === false &&
      sealed.reason === SEALED_CLOUD_FALLBACK_DENIED &&
      localOnly.status === 'denied' &&
      localOnly.silentCloudFallback === false,
    'Sealed/local-only never silent-routes to cloud.',
  );

  // --- Unconfigured provider → UNAVAILABLE ---
  const unconf = await routeReasoningLocalFirst({
    promptId: 'p-unconf',
    sensitivity: 'public',
    requestedProvider: 'anthropic',
    root,
    actor,
  });
  check(
    'US-CG-unconfigured-provider-unavailable',
    unconf.status === 'unavailable' &&
      unconf.reason === UNCONFIGURED_PROVIDER_UNAVAILABLE &&
      unconf.selectedProvider === null,
    'Unconfigured provider UNAVAILABLE.',
  );

  // --- Unapproved edge device deployment DENIED / UNAVAILABLE ---
  const unapproved = await registerEdgeDeploymentProfile({
    deviceId: 'rogue-phone-1',
    kind: 'mobile',
    approved: false,
    root,
    actor,
  });
  const unapprovedDeploy = await proposeEdgeDeployCandidate({
    profileId: unapproved.id,
    root,
    actor,
  });
  check(
    'US-CG-unapproved-edge-deploy-denied',
    unapproved.status === 'unavailable' &&
      (unapprovedDeploy.status === 'denied' || unapprovedDeploy.status === 'unavailable') &&
      unapprovedDeploy.reason === UNAPPROVED_EDGE_DEPLOY_DENIED,
    'Unapproved edge device deployment DENIED/UNAVAILABLE.',
  );

  // --- Edge profile is not stealth install ---
  const stealth = await registerEdgeDeploymentProfile({
    deviceId: 'stealth-probe',
    kind: 'pc',
    approved: true,
    attemptStealthInstall: true,
    root,
    actor,
  });
  const approved = await registerEdgeDeploymentProfile({
    deviceId: 'approved-pc-1',
    kind: 'pc',
    approved: true,
    root,
    actor,
  });
  check(
    'US-CG-edge-profile-not-stealth',
    stealth.status === 'denied' &&
      stealth.stealthInstall === false &&
      stealth.installedOnDevice === false &&
      stealth.reason === EDGE_PROFILE_NOT_STEALTH &&
      approved.stealthInstall === false &&
      approved.compatibilityProfileOnly === true &&
      approved.installedOnDevice === false,
    'Edge profile is compatibility-only; stealth install DENIED.',
  );

  // Deploy candidate ≠ production authority
  const authClaim = await proposeEdgeDeployCandidate({
    profileId: approved.id,
    claimProductionAuthority: true,
    root,
    actor,
  });
  const okCand = await proposeEdgeDeployCandidate({
    profileId: approved.id,
    root,
    actor,
  });
  check(
    'US-CG-deploy-candidate-not-authority',
    authClaim.status === 'denied' &&
      authClaim.productionAuthority === false &&
      authClaim.reason === DEPLOY_CANDIDATE_NOT_AUTHORITY &&
      okCand.status === 'candidate' &&
      okCand.productionAuthority === false,
    'Deploy candidate never grants production authority.',
  );

  // --- OS unification registers subsystems without swallowing unrelated mega-delta ---
  const reg = await registerOsSubsystems({ root, actor });
  const mega = await registerOsSubsystems({
    root,
    actor,
    attemptMegaDeltaSwallow: true,
    megaDeltaLabel: 'ATTRIBUTION_UNSAFE_MEGA_PR_38',
    megaDeltaBytesHint: 200_000,
  });
  const listed = await listRegisteredSubsystems(root);
  const companions = probeCompanionModules(repoRoot);
  check(
    'US-CG-os-no-mega-delta-swallow',
    reg.registrations.length === 7 &&
      listed.length === 7 &&
      mega.megaDeltaDenied === true &&
      mega.megaDeltaReason === MEGA_DELTA_SWALLOW_DENIED &&
      deepKnowledgeRefineryOsHonesty().osIsCoexistenceLayer === true &&
      companions.cd === true,
    'OS registers 7 subsystems; mega-delta swallow DENIED; CD coexistence probe PRESENT.',
  );

  // Full cycle + health report smoke
  const cycle = await runDeepKnowledgeRefineryOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check(
    'US-CG-cycle-run',
    cycle.hops.length === DEEP_KNOWLEDGE_REFINERY_OS_CYCLE.length &&
      cycle.hops.every((h, i) => h.hop === DEEP_KNOWLEDGE_REFINERY_OS_CYCLE[i]),
    'Full CG cycle walks all hops in order.',
  );

  const health = await buildDeepKnowledgeRefineryOsHealthReport({ root });
  const preds = predecessorMap(repoRoot);
  check(
    'US-CG-health-predecessors',
    health.githubSotIssue === 97 &&
      health.gitlabCoordinationIssue === 31 &&
      health.l4AutonomyEnabled === false &&
      preds.CD.tipProbe === 'PRESENT' &&
      (preds.CF.tipProbe === 'WAITING_DATA' || preds.CF.tipProbe === 'PRESENT') &&
      (preds.CE.tipProbe === 'WAITING_DATA' || preds.CE.tipProbe === 'PRESENT'),
    `Health SoT #97/#31; CD PRESENT; CF=${preds.CF.tipProbe} CE=${preds.CE.tipProbe}.`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n62L-CG FAILURES (${failures.length}):`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('\n62L-CG: all required tests PASS');
