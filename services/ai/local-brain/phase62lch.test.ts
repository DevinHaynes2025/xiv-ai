import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bootstrapKnowledgeCivilizationOs,
  civilizationOsHonesty,
  rejectSoulResurrectionClaim,
} from './knowledge-civilization-os';
import {
  attemptTrustedUseWhileDecayed,
  departmentUniversitiesHonesty,
  evaluateOrDecaySkill,
  openDepartmentUniversity,
  recordSkillTranscript,
} from './agent-department-universities';
import {
  attemptWorldModelPromotion,
  recordWorldModelNode,
  worldModelHonesty,
} from './historical-world-model-graph';
import {
  attemptAutoApplyProductionSchema,
  dbFabricHonesty,
  proposeDbFabricChange,
  recordWorkloadEvidence,
} from './adaptive-database-memory-fabric';
import {
  deliberateExpertCouncil,
  expertCouncilsHonesty,
  registerExpertCouncilMember,
} from './multi-model-expert-councils';
import {
  edgeColonyHonesty,
  enrollEdgeColonyNode,
  registerEdgeColonyNode,
  requestEdgeColonyAction,
} from './distributed-edge-intelligence-colony';
import {
  CH_LOCKS,
  CORRELATION_TO_FACT_REJECTED,
  DB_FABRIC_NO_AUTO_APPLY,
  DB_PROPOSAL_WITHOUT_EVIDENCE_REJECTED,
  DEPARTMENT_KEYS,
  EVALUATION_DECAY_REVERSES_TRUST,
  HONESTY_BANNER,
  KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_CYCLE,
  NEXT_PHASE_TITLE,
  SEALED_NO_CLOUD_FALLBACK,
  SIM_TO_VERIFIED_FACT_REJECTED,
  SKILL_TRANSCRIPT_NOT_PERMISSION,
  SOUL_CLAIM_REJECTED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  UNENROLLED_EDGE_DENIED,
  predecessorMap,
  type ChActor,
} from './knowledge-civilization-dept-universities-types';
import {
  buildKnowledgeCivilizationDeptUniversitiesHealthReport,
  runKnowledgeCivilizationDeptUniversitiesCycle,
} from './knowledge-civilization-dept-universities-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lch-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: ChActor = {
  kind: 'department_dean',
  id: 'dean-ch-1',
  orgId: 'org-ch',
  tenantId: 'tenant-ch',
  universeId: 'univ-ch',
  role: 'dean',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CH1-cycle',
    KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_CYCLE.join(' → ') ===
      'honesty_locks → civilization_os_facade → department_university_enroll → skill_transcript_no_permission → evaluation_decay_reverses_trust → world_model_typed_states → reject_correlation_to_fact → reject_sim_to_verified_fact → db_fabric_propose_from_evidence → db_fabric_no_auto_apply → proposal_without_evidence_rejected → council_local_first → unconfigured_provider_unavailable → sealed_no_cloud_fallback → edge_enroll_explicit → unenrolled_edge_denied → soul_claim_rejected → evidence → learning',
    'Knowledge civilization / dept universities cycle recorded in order.',
  );

  check(
    'US-CH-locks',
    CH_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CH_LOCKS.LOCAL_MODEL_FIRST === true &&
      CH_LOCKS.SKILL_IS_PERMISSION === false &&
      CH_LOCKS.SKILL_IS_AUTHORITY === false &&
      CH_LOCKS.LEARNING_MEASURABLE === true &&
      CH_LOCKS.LEARNING_REVERSIBLE === true &&
      CH_LOCKS.FACTS_EQ_CORRELATIONS === false &&
      CH_LOCKS.CORRELATION_PROMOTE_TO_FACT === false &&
      CH_LOCKS.SIM_PROMOTE_TO_VERIFIED_FACT === false &&
      CH_LOCKS.AUTO_ALTER_PRODUCTION_DB === false &&
      CH_LOCKS.DB_PROPOSAL_REQUIRES_MEASURED_WORKLOAD === true &&
      CH_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
      CH_LOCKS.EDGE_REQUIRES_EXPLICIT_ENROLLMENT === true &&
      CH_LOCKS.UNENROLLED_EDGE_ALLOWED === false &&
      CH_LOCKS.SOUL_RESURRECTION_CLAIMS === false &&
      CH_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      CH_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CH_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, skill≠permission, world-model hard separation, no auto DB apply.',
  );

  check(
    'US-CH-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CI — XIV Persistent Intelligence Economy'),
    'Next queue title is 62L-CI only (title).',
  );

  check(
    'US-CH-departments',
    DEPARTMENT_KEYS.length === 10 &&
      DEPARTMENT_KEYS.includes('law_governance') &&
      DEPARTMENT_KEYS.includes('executive_work'),
    'Ten department universities defined.',
  );

  check(
    'US-CH-honesty-modules',
    civilizationOsHonesty().l4AutonomyEnabled === false &&
      departmentUniversitiesHonesty().skillIsPermission === false &&
      worldModelHonesty().correlationPromoteToFact === false &&
      dbFabricHonesty().autoAlterProductionDb === false &&
      expertCouncilsHonesty().localModelFirst === true &&
      edgeColonyHonesty().unenrolledAllowed === false,
    'Subsystem honesty helpers expose locks.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CH-pred-CE',
    preds.CE.tipProbe === 'PRESENT' && preds.CE.report === 'PRESENT',
    `CE tip/report PRESENT (base). CG=${preds.CG.tipProbe} CF=${preds.CF.tipProbe}`,
  );

  // --- Department skill transcript does not grant permissions ---
  await bootstrapKnowledgeCivilizationOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const uni = await openDepartmentUniversity({
    department: 'security',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const skillGrant = await recordSkillTranscript({
    universityId: uni.id,
    agentId: 'agent-sec-1',
    skillKey: 'threat_modeling',
    score: 0.95,
    currentPermissionLevel: 2,
    currentAuthorityLevel: 2,
    attemptPermissionGrantViaTranscript: true,
    root,
    actor,
  });
  check(
    'US-CH-skill-no-permission',
    skillGrant.accepted === false &&
      skillGrant.reason === SKILL_TRANSCRIPT_NOT_PERMISSION &&
      skillGrant.permissionIncreased === false &&
      skillGrant.authorityIncreased === false &&
      skillGrant.skillIsPermissionGrant === false,
    'Department skill transcript does not grant permissions.',
  );

  const skillOk = await recordSkillTranscript({
    universityId: uni.id,
    agentId: 'agent-sec-1',
    skillKey: 'threat_modeling',
    score: 0.88,
    currentPermissionLevel: 2,
    currentAuthorityLevel: 2,
    evidenceRefs: ['exam-1'],
    root,
    actor,
  });
  check(
    'US-CH-skill-measurable',
    skillOk.accepted === true &&
      skillOk.transcript?.measurable === true &&
      skillOk.transcript?.reversible === true &&
      skillOk.transcript?.trustState === 'trusted' &&
      skillOk.transcript?.permissionLevel === 2 &&
      skillOk.permissionIncreased === false,
    'Trusted skill keeps prior permission; learning measurable+reversible.',
  );

  // --- Failed evaluation / decay can reverse trusted skill status ---
  const decay = await evaluateOrDecaySkill({
    transcriptId: skillOk.transcript!.id,
    forceDecay: true,
    root,
    actor,
  });
  const blocked = await attemptTrustedUseWhileDecayed({
    transcriptId: skillOk.transcript!.id,
    root,
    actor,
  });
  check(
    'US-CH-decay-reverses-trust',
    decay.accepted === true &&
      decay.transcript?.trustState === 'decayed' &&
      decay.trustReversed === true &&
      decay.reason === EVALUATION_DECAY_REVERSES_TRUST &&
      blocked.allowed === false &&
      blocked.reason === EVALUATION_DECAY_REVERSES_TRUST,
    'Failed evaluation / decay reverses trusted skill status.',
  );

  const failed = await recordSkillTranscript({
    universityId: uni.id,
    agentId: 'agent-sec-2',
    skillKey: 'audit',
    score: 0.91,
    currentPermissionLevel: 0,
    currentAuthorityLevel: 0,
    root,
    actor,
  });
  const failEval = await evaluateOrDecaySkill({
    transcriptId: failed.transcript!.id,
    forceFail: true,
    evaluationScore: 0.2,
    root,
    actor,
  });
  check(
    'US-CH-fail-eval-reverses',
    failEval.transcript?.trustState === 'failed' && failEval.trustReversed === true,
    'Failed evaluation reverses trusted skill status.',
  );

  // --- World model rejects promoting correlation to fact / sim to verified fact ---
  const corr = await recordWorldModelNode({
    kind: 'correlation',
    label: 'c1',
    statement: 'X correlates with Y',
    root,
    actor,
  });
  const sim = await recordWorldModelNode({
    kind: 'simulation',
    label: 's1',
    statement: 'Simulated outcome',
    root,
    actor,
  });
  const corrPromo = await attemptWorldModelPromotion({
    nodeId: corr.id,
    toKind: 'fact',
    claimVerifiedFact: true,
    root,
    actor,
  });
  const simPromo = await attemptWorldModelPromotion({
    nodeId: sim.id,
    toKind: 'fact',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'US-CH-corr-not-fact',
    corrPromo.rejected === true &&
      corrPromo.accepted === false &&
      corrPromo.reason === CORRELATION_TO_FACT_REJECTED &&
      corrPromo.node?.kind === 'correlation',
    'World model rejects promoting correlation to fact.',
  );
  check(
    'US-CH-sim-not-verified-fact',
    simPromo.rejected === true &&
      simPromo.accepted === false &&
      simPromo.reason === SIM_TO_VERIFIED_FACT_REJECTED &&
      simPromo.node?.kind === 'simulation' &&
      simPromo.node.simulationLabeled === true,
    'World model rejects promoting simulation to verified fact.',
  );

  // --- DB/memory fabric proposal cannot auto-apply production schema ---
  const wl = await recordWorkloadEvidence({
    metric: 'cache_miss_rate',
    value: 0.42,
    source: 'fabric-sampler',
    root,
    actor,
  });
  const prop = await proposeDbFabricChange({
    kind: 'cache',
    summary: 'Enlarge hot cache partition',
    evidenceIds: [wl.id],
    root,
    actor,
  });
  const auto = await attemptAutoApplyProductionSchema({
    proposalId: prop.proposal!.id,
    root,
    actor,
  });
  check(
    'US-CH-db-no-auto-apply',
    prop.accepted === true &&
      prop.verified === false &&
      prop.proposal?.autoApplied === false &&
      auto.applied === false &&
      auto.denied === true &&
      auto.productionAltered === false &&
      auto.status === 'NOT_APPLIED' &&
      auto.reason === DB_FABRIC_NO_AUTO_APPLY,
    'DB/memory fabric proposal cannot auto-apply production schema.',
  );

  // --- Proposal without measured workload evidence REJECTED or not VERIFIED ---
  const blind = await proposeDbFabricChange({
    kind: 'schema',
    summary: 'Blind alter',
    evidenceIds: [],
    root,
    actor,
  });
  check(
    'US-CH-db-no-evidence-rejected',
    blind.accepted === false &&
      blind.verified === false &&
      blind.reason === DB_PROPOSAL_WITHOUT_EVIDENCE_REJECTED &&
      blind.proposal?.status === 'rejected',
    'Proposal without measured workload evidence REJECTED / not VERIFIED.',
  );

  // --- Unenrolled edge node DENIED/UNAVAILABLE ---
  const edge = await registerEdgeColonyNode({
    label: 'node-x',
    enroll: false,
    root,
    actor,
  });
  const edgeAct = await requestEdgeColonyAction({
    nodeId: edge.id,
    action: 'coordinate',
    root,
    actor,
  });
  check(
    'US-CH-unenrolled-edge',
    edge.enrolled === false &&
      edge.status === 'unavailable' &&
      edge.reason === UNENROLLED_EDGE_DENIED &&
      (edgeAct.status === 'denied' || edgeAct.status === 'unavailable') &&
      edgeAct.reason === UNENROLLED_EDGE_DENIED,
    'Unenrolled edge node DENIED/UNAVAILABLE.',
  );

  const enrolled = await registerEdgeColonyNode({
    label: 'node-y',
    enroll: false,
    root,
    actor,
  });
  const enrollOk = await enrollEdgeColonyNode({
    nodeId: enrolled.id,
    permissions: ['coordinate', 'sync_bounded'],
    root,
    actor,
  });
  const coord = await requestEdgeColonyAction({
    nodeId: enrolled.id,
    action: 'coordinate',
    root,
    actor,
  });
  check(
    'US-CH-enrolled-edge-bounded',
    enrollOk.accepted === true && coord.status === 'allowed',
    'Enrolled edge with explicit permissions can coordinate (bounded).',
  );

  // --- Sealed content cannot silent-route to cloud council member ---
  const local = await registerExpertCouncilMember({
    name: 'local-mistral',
    kind: 'local',
    role: 'domain_expert',
    department: 'finance',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const cloud = await registerExpertCouncilMember({
    name: 'cloud-opus',
    kind: 'cloud',
    role: 'skeptic',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const sealedCloudOnly = await deliberateExpertCouncil({
    topic: 'sealed finance',
    mode: 'sealed',
    memberIds: [cloud.id],
    attemptSilentCloudFallback: true,
    root,
    actor,
  });
  const sealedWithLocal = await deliberateExpertCouncil({
    topic: 'sealed with local',
    mode: 'local_only',
    memberIds: [local.id, cloud.id],
    attemptSilentCloudFallback: true,
    root,
    actor,
  });
  check(
    'US-CH-sealed-no-cloud',
    sealedCloudOnly.status === 'denied' &&
      sealedCloudOnly.reason === SEALED_NO_CLOUD_FALLBACK &&
      sealedCloudOnly.cloudFallbackAttempted === false &&
      sealedWithLocal.status === 'deliberated' &&
      sealedWithLocal.selectedMemberIds.includes(local.id) &&
      !sealedWithLocal.selectedMemberIds.includes(cloud.id),
    'Sealed content cannot silent-route to cloud council member.',
  );

  // --- Unconfigured provider → UNAVAILABLE ---
  const bare = await registerExpertCouncilMember({
    name: 'cloud-missing',
    kind: 'cloud',
    role: 'auditor',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  check(
    'US-CH-unconfigured-provider',
    bare.status === 'unavailable' && bare.reason === UNCONFIGURED_PROVIDER_UNAVAILABLE,
    'Unconfigured provider → UNAVAILABLE.',
  );

  const soul = await rejectSoulResurrectionClaim({
    claim: 'communicate with deceased founder',
    root,
    actor,
  });
  check(
    'US-CH-soul-rejected',
    soul.denied === true && soul.reason === SOUL_CLAIM_REJECTED,
    'Soul-resurrection claim REJECTED (Founder-sealed deny-by-default).',
  );

  const cycle = await runKnowledgeCivilizationDeptUniversitiesCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check(
    'US-CH-runtime-cycle',
    cycle.hops.length === KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_CYCLE.length &&
      cycle.nextPhase === NEXT_PHASE_TITLE &&
      cycle.locks.L4_AUTONOMY_ENABLED === false,
    `Runtime cycle walked ${cycle.hops.length} hops.`,
  );

  const health = await buildKnowledgeCivilizationDeptUniversitiesHealthReport({
    root: repoRoot,
  });
  check(
    'US-CH-health-report',
    health.phase === '62L-CH' &&
      health.githubSoT === 98 &&
      health.gitlabCoordination === 32 &&
      health.productionAuthorized === false &&
      health.modules.knowledgeCivilizationOs === 'IMPLEMENTED',
    'Health report exposes SoT cites and honesty.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL phase62lch');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK phase62lch — all required CH stories passed.');
