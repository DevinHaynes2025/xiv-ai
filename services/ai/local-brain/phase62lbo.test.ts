import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyPlasticityUpdate, neuroplasticityHonesty } from './neuroplasticity-engine';
import {
  knowledgeDnaHonesty,
  readOrganizationKnowledgeDna,
  upsertOrganizationKnowledgeDna,
} from './organization-knowledge-dna';
import { evolveAgentSkill, skillEvolutionHonesty } from './agent-skill-evolution';
import {
  attemptTrustedRetrieval,
  immuneSystemHonesty,
  registerOrInspectArtifact,
  requireMemoryRevalidation,
} from './global-intelligence-immune-system';
import {
  adaptBrainLayerPlacement,
  adaptiveLayersHonesty,
} from './adaptive-offline-cloud-brain-layers';
import {
  BO_LOCKS,
  CROSS_ORG_DNA_DENIED,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  MEMORY_REVALIDATION_REQUIRED,
  NEXT_PHASE_TITLE,
  QUARANTINE_BYPASS_DENIED,
  SELF_PERMISSION_EXPANSION_DENIED,
  SKILL_NOT_PERMISSION,
  SUPERBRAIN_NEUROPLASTICITY_CYCLE,
  UNVERIFIED_OUTCOME_REJECTED,
  githubIssueSot,
  predecessorMap,
} from './superbrain-neuroplasticity-types';
import {
  buildSuperbrainNeuroplasticityHealthReport,
  runSuperbrainNeuroplasticityCycle,
} from './superbrain-neuroplasticity-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbo-'));
const orgId = 'org-bo-a';
const otherOrgId = 'org-bo-b';
const tenantId = '62lbo-tenant';
const universeId = '62lbo-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-BO-HONESTY',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      BO_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BO_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BO_LOCKS.SELF_PERMISSION_EXPANSION === false &&
      BO_LOCKS.SKILL_EVOLUTION_IS_PERMISSION_GRANT === false &&
      BO_LOCKS.SILENT_TRUST_STALE_OR_POISONED === false &&
      BO_LOCKS.FASTER_ROUTE_BYPASSES_QUARANTINE === false &&
      BO_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      BO_LOCKS.LIVE_SUPABASE_APPLY === false,
    'Honesty locks encode DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; L4 false; no silent trust.',
  );

  const sot = githubIssueSot();
  check(
    'US-BO-SOT',
    sot.githubIssue === GITHUB_SOT_ISSUE &&
      sot.gitlabIssue === GITLAB_COORDINATION_ISSUE &&
      sot.githubRole === 'implementation_source_of_truth' &&
      sot.gitlabRole === 'coordination_only',
    'GitHub #79 SoT; GitLab #13 coordination only.',
  );

  check(
    'US-BO-NEXT',
    NEXT_PHASE_TITLE.startsWith('62L-BP'),
    `Next queue title recorded: ${NEXT_PHASE_TITLE}`,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BO-BASE',
    (preds.BL.tipProbe === 'PRESENT' && preds.BL.report === 'PRESENT') ||
      (preds.BJ.tipProbe === 'PRESENT' && preds.BJ.report === 'PRESENT'),
    `Base gate: BL=${preds.BL.tipProbe}/${preds.BL.report}; BJ=${preds.BJ.tipProbe}/${preds.BJ.report}; BN=${preds.BN.tipProbe}/${preds.BN.report}; BM=${preds.BM.tipProbe}; BK=${preds.BK.tipProbe}/${preds.BK.report}.`,
  );

  check(
    'US-BO-CYCLE-LEN',
    SUPERBRAIN_NEUROPLASTICITY_CYCLE.length >= 18,
    `Cycle length=${SUPERBRAIN_NEUROPLASTICITY_CYCLE.length}.`,
  );

  // Required: Plasticity update from unverified outcome REJECTED
  const unverified = await applyPlasticityUpdate({
    orgId,
    tenantId,
    universeId,
    target: 'route_weight',
    key: 'r1',
    proposedWeight: 0.9,
    outcomeVerification: 'unverified',
    verifiedOutcomeId: 'should-not-matter',
    root,
  });
  check(
    'US-BO-PLASTICITY-UNVERIFIED',
    unverified.accepted === false &&
      unverified.reason.includes(UNVERIFIED_OUTCOME_REJECTED) &&
      unverified.permissionExpanded === false,
    'Plasticity update from unverified outcome REJECTED.',
  );

  const forecast = await applyPlasticityUpdate({
    orgId,
    tenantId,
    universeId,
    target: 'retrieval_strategy',
    key: 's1',
    proposedWeight: 0.5,
    outcomeVerification: 'forecast',
    root,
  });
  check(
    'US-BO-PLASTICITY-FORECAST',
    forecast.accepted === false && forecast.reason.includes(UNVERIFIED_OUTCOME_REJECTED),
    'Forecast/sim ≠ verified fact for plasticity.',
  );

  // Required: Attempted self-permission expansion DENIED
  const selfPerm = await applyPlasticityUpdate({
    orgId,
    tenantId,
    universeId,
    target: 'agent_task_mapping',
    key: 'm1',
    proposedWeight: 0.6,
    outcomeVerification: 'verified',
    verifiedOutcomeId: 'vo-perm',
    attemptSelfPermissionExpansion: true,
    root,
  });
  check(
    'US-BO-SELF-PERM-DENY',
    selfPerm.accepted === false &&
      selfPerm.reason === SELF_PERMISSION_EXPANSION_DENIED &&
      selfPerm.permissionExpanded === false &&
      neuroplasticityHonesty().selfPermissionExpansion === false,
    'Attempted self-permission expansion DENIED.',
  );

  const verifiedPlasticity = await applyPlasticityUpdate({
    orgId,
    tenantId,
    universeId,
    target: 'cache_placement',
    key: 'cache-local',
    proposedWeight: 0.77,
    strategyHint: 'hot_local',
    evidenceRefs: ['e-cache'],
    outcomeVerification: 'verified',
    verifiedOutcomeId: 'vo-cache',
    root,
  });
  check(
    'US-BO-PLASTICITY-OK',
    verifiedPlasticity.accepted === true &&
      verifiedPlasticity.record?.weight === 0.77 &&
      verifiedPlasticity.productionAuthorization === false,
    'Verified outcome plasticity applied without production auth.',
  );

  // Required: Skill evolution does not increase authority/permissions
  const skillGrant = await evolveAgentSkill({
    orgId,
    tenantId,
    universeId,
    agentId: 'agent-1',
    skillKey: 'planning',
    proposedProficiency: 0.9,
    evaluationScore: 0.85,
    outcomeVerification: 'verified',
    currentPermissionLevel: 2,
    currentAuthorityLevel: 2,
    attemptPermissionGrantViaSkill: true,
    root,
  });
  check(
    'US-BO-SKILL-PERM-DENY',
    skillGrant.accepted === false &&
      skillGrant.reason === SKILL_NOT_PERMISSION &&
      skillGrant.permissionIncreased === false &&
      skillGrant.authorityIncreased === false,
    'Skill evolution cannot grant permissions.',
  );

  const skillOk = await evolveAgentSkill({
    orgId,
    tenantId,
    universeId,
    agentId: 'agent-1',
    skillKey: 'planning',
    proposedProficiency: 0.88,
    evaluationScore: 0.8,
    evidenceRefs: ['skill-ok'],
    outcomeVerification: 'verified',
    currentPermissionLevel: 2,
    currentAuthorityLevel: 2,
    root,
  });
  check(
    'US-BO-SKILL-OK',
    skillOk.accepted === true &&
      skillOk.skill?.permissionLevel === 2 &&
      skillOk.skill?.authorityLevel === 2 &&
      skillOk.skillIsPermissionGrant === false &&
      skillEvolutionHonesty().skillEvolutionIsPermissionGrant === false,
    'Skill evolved; permission/authority unchanged.',
  );

  // Required: Poisoned/stale artifact → quarantined; not used as trusted retrieval hit
  const poisoned = await registerOrInspectArtifact({
    orgId,
    tenantId,
    universeId,
    artifactKey: 'poison-pack',
    kind: 'knowledge',
    poisoned: true,
    root,
  });
  check(
    'US-BO-POISON-QUARANTINE',
    poisoned.quarantined === true &&
      poisoned.usableAsTrustedRetrieval === false &&
      poisoned.artifact.trustState === 'quarantined',
    'Poisoned artifact quarantined; not trusted.',
  );

  const poisonHit = await attemptTrustedRetrieval({
    orgId,
    universeId,
    artifactKey: 'poison-pack',
    root,
  });
  check(
    'US-BO-POISON-RETRIEVAL',
    poisonHit.allowed === false && poisonHit.usedAsTrustedHit === false,
    'Poisoned artifact not used as trusted retrieval hit.',
  );

  const stale = await registerOrInspectArtifact({
    orgId,
    tenantId,
    universeId,
    artifactKey: 'stale-pack',
    kind: 'knowledge',
    stale: true,
    root,
  });
  check(
    'US-BO-STALE-QUARANTINE',
    stale.quarantined === true && stale.usableAsTrustedRetrieval === false,
    'Stale artifact quarantined.',
  );

  // Required: Corrupted memory path → revalidation required
  const corrupted = await requireMemoryRevalidation({
    orgId,
    tenantId,
    universeId,
    memoryKey: 'mem-corrupt-1',
    root,
  });
  check(
    'US-BO-CORRUPT-MEMORY',
    corrupted.artifact.revalidationRequired === true &&
      corrupted.artifact.trustState === 'revalidation_required' &&
      corrupted.artifact.reason.includes(MEMORY_REVALIDATION_REQUIRED) &&
      corrupted.usableAsTrustedRetrieval === false,
    'Corrupted memory requires revalidation; not silently trusted.',
  );

  // Required: Cross-org Knowledge DNA leak DENIED by default
  const dna = await upsertOrganizationKnowledgeDna({
    orgId,
    tenantId,
    universeId,
    genes: [
      {
        kind: 'durable_knowledge',
        label: 'pricing_policy',
        content: 'org-private pricing lessons',
        evidenceLineage: ['dna-1'],
      },
    ],
    root,
  });
  check('US-BO-DNA-UPSERT', dna.accepted === true && dna.dna.isolated === true, 'Org Knowledge DNA versioned and isolated.');

  const leak = await readOrganizationKnowledgeDna({
    orgId,
    universeId,
    requestingOrgId: otherOrgId,
    actorId: 'attacker-agent',
    root,
  });
  check(
    'US-BO-DNA-CROSS-ORG',
    leak.allowed === false &&
      leak.reason === CROSS_ORG_DNA_DENIED &&
      knowledgeDnaHonesty().crossOrgDnaPoolingDefault === false,
    'Cross-org Knowledge DNA leak DENIED by default.',
  );

  const ownRead = await readOrganizationKnowledgeDna({
    orgId,
    universeId,
    requestingOrgId: orgId,
    root,
  });
  check('US-BO-DNA-OWN', ownRead.allowed === true, 'Same-org Knowledge DNA read allowed.');

  // Required: Faster route cannot bypass immune quarantine
  const bypass = await attemptTrustedRetrieval({
    orgId,
    universeId,
    artifactKey: 'poison-pack',
    preferFasterRouteBypass: true,
    root,
  });
  check(
    'US-BO-QUARANTINE-BYPASS',
    bypass.allowed === false &&
      bypass.reason === QUARANTINE_BYPASS_DENIED &&
      immuneSystemHonesty().fasterRouteBypassesQuarantine === false,
    'Faster route cannot bypass immune quarantine.',
  );

  const placeBypass = await adaptBrainLayerPlacement({
    orgId,
    tenantId,
    universeId,
    workloadKey: 'fast-cloud',
    preferredLocality: 'cloud',
    localCapacityOk: true,
    cloudConfigured: true,
    cloudVerified: true,
    requiredArtifactKey: 'poison-pack',
    attemptFasterBypassQuarantine: true,
    metabolismBudgetOk: true,
    root,
  });
  check(
    'US-BO-ADAPTIVE-BYPASS',
    placeBypass.accepted === false &&
      placeBypass.reason === QUARANTINE_BYPASS_DENIED &&
      adaptiveLayersHonesty().privacyOverSpeedOrPrice === true,
    'Adaptive layer refuses faster cloud bypass of quarantine.',
  );

  const placeLocal = await adaptBrainLayerPlacement({
    orgId,
    tenantId,
    universeId,
    workloadKey: 'local-ok',
    preferredLocality: 'cloud',
    localCapacityOk: true,
    cloudConfigured: true,
    cloudVerified: false,
    metabolismBudgetOk: true,
    root,
  });
  check(
    'US-BO-ADAPTIVE-LOCAL',
    placeLocal.accepted === true &&
      placeLocal.placement?.locality === 'local' &&
      placeLocal.providersUnavailableUntilVerified === true,
    'Privacy over speed: local retained; unverified cloud unavailable.',
  );

  const denyCycle = await runSuperbrainNeuroplasticityCycle({
    orgId,
    tenantId,
    universeId,
    root,
    useUnverifiedOutcome: true,
    attemptSelfPermissionExpansion: true,
    attemptSkillPermissionGrant: true,
    poisonArtifactKey: 'cycle-poison',
    corruptMemoryKey: 'cycle-mem',
    crossOrgReadOrgId: otherOrgId,
    attemptFasterQuarantineBypass: true,
  });
  check(
    'US-BO-CYCLE-DENY',
    denyCycle.hops.length === SUPERBRAIN_NEUROPLASTICITY_CYCLE.length &&
      denyCycle.plasticity.accepted === false &&
      denyCycle.skill.accepted === false &&
      denyCycle.crossOrg.allowed === false &&
      denyCycle.retrieval.allowed === false &&
      denyCycle.placement.accepted === false &&
      denyCycle.productionAuthorization === false &&
      denyCycle.l4AutonomyEnabled === false &&
      denyCycle.tipLand === false,
    `Full deny-path cycle walked ${denyCycle.hops.length} hops; hard denies held.`,
  );

  const happy = await runSuperbrainNeuroplasticityCycle({
    orgId,
    tenantId,
    universeId,
    agentId: 'agent-happy',
    root,
  });
  check(
    'US-BO-CYCLE-OK',
    happy.plasticity.accepted === true &&
      happy.skill.accepted === true &&
      happy.dna.accepted === true &&
      happy.crossOrg.allowed === true &&
      happy.placement.accepted === true &&
      happy.megaPrBulkIncluded === false,
    'Happy-path cycle applies verified plasticity, DNA, skill, and adaptive local placement.',
  );

  const health = await buildSuperbrainNeuroplasticityHealthReport(repoRoot);
  check(
    'US-BO-HEALTH',
    health.productionAuthorization === false &&
      health.l4AutonomyEnabled === false &&
      health.sot.githubIssue === 79 &&
      health.nextPhaseTitle.startsWith('62L-BP'),
    'Health report keeps production auth false; next=BP.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-BO');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(
  'PASS 62L-BO — Superbrain Neuroplasticity + Knowledge DNA + Skill Evolution + Immune System + Adaptive Layers',
);
process.exit(0);
