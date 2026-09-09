import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  cognitiveHomeostasisHonesty,
  evaluateCognitiveHomeostasis,
} from './cognitive-homeostasis';
import {
  attemptReadSourcePrivateMemoryFromClone,
  getClonedGenomeUniverse,
  organizationGenomeHonesty,
  registerApprovedGenomeTemplate,
  replicateOrganizationGenome,
} from './organization-digital-genome';
import { exchangeAgentSkill, skillExchangeHonesty } from './multi-agent-skill-exchange';
import {
  brainMeshHonesty,
  createRecoverySnapshot,
  declareMeshRoute,
  enterOfflineIslandMode,
  reconcileMeshRejoin,
  runDisasterRecoverySimulation,
  runIslandOperation,
  selectMeshRoute,
} from './resilient-edge-cloud-brain-mesh';
import {
  BP_LOCKS,
  CLOUD_MESH_UNAVAILABLE,
  CLONE_ISOLATION,
  COGNITIVE_HOMEOSTASIS_CYCLE,
  FRESHNESS_STALE,
  GENOME_AUTHORITY_DENIED,
  GENOME_PRIVATE_DENIED,
  GENOME_SEALED_DENIED,
  GENOME_SECRET_DENIED,
  HIGH_PRESSURE_HIBERNATE,
  HIGH_PRESSURE_THROTTLE,
  HOMEOSTASIS_L4_EXPAND_DENIED,
  HOMEOSTASIS_PERM_EXPAND_DENIED,
  HONESTY_BANNER,
  ISLAND_BOUNDED,
  LEARNING_NOT_AUTHORITY,
  NEXT_PHASE_TITLE,
  REJOIN_NO_AUTO_TRUST,
  SKILL_NOT_PERMISSION,
  predecessorMap,
  type BpActor,
} from './cognitive-homeostasis-types';
import {
  buildCognitiveHomeostasisHealthReport,
  runCognitiveHomeostasisCycle,
} from './cognitive-homeostasis-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbp-'));
const orgA = 'org-alpha-bp';
const orgB = 'org-beta-bp';
const tenantA = 'tenant-alpha-bp';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actorA: BpActor = {
  kind: 'org_admin',
  id: 'admin-a',
  orgId: orgA,
  tenantId: tenantA,
  universeId: 'univ-alpha-bp',
  role: 'org_admin',
  permissionLevel: 2,
  authorityLevel: 2,
};

const actorB: BpActor = {
  kind: 'ordinary_agent',
  id: 'agent-b',
  orgId: orgB,
  tenantId: tenantA,
  universeId: 'univ-beta-bp',
  role: 'analyst',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-BP1-cycle',
    COGNITIVE_HOMEOSTASIS_CYCLE.join(' → ') ===
      'metrics_sample → pressure_evaluate → stabilize_prefer → throttle_or_hibernate → rebalance_bounded → quarantine_unsafe → recover_verified → genome_template_select → genome_strip_forbidden → genome_clone_isolated → skill_exchange_governed → skill_not_permission → island_mode_enter → bounded_offline_op → freshness_gate → mesh_failover → mesh_rejoin_reconcile → recovery_snapshot → dr_simulation_only → evidence → learning',
    'Cognitive homeostasis + genome + skill + mesh recovery cycle recorded in order.',
  );

  check(
    'US-BP-locks',
    BP_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BP_LOCKS.HOMEOSTASIS_UNBOUNDED_EXPAND === false &&
      BP_LOCKS.HOMEOSTASIS_CAN_EXPAND_L4 === false &&
      BP_LOCKS.HOMEOSTASIS_CAN_EXPAND_PERMISSIONS === false &&
      BP_LOCKS.PREFER_STABILIZE_OVER_EXPAND === true &&
      BP_LOCKS.GENOME_APPROVED_TEMPLATES_ONLY === true &&
      BP_LOCKS.GENOME_SILENT_SECRET_COPY === false &&
      BP_LOCKS.SKILL_EXCHANGE_IS_PERMISSION_GRANT === false &&
      BP_LOCKS.LEARNING_IS_AUTHORITY === false &&
      BP_LOCKS.REJOIN_AUTO_TRUST_REMOTE === false &&
      BP_LOCKS.DR_SIM_IS_REAL_DISASTER_AUTH === false &&
      BP_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, stabilize≠expand, genome/skill/mesh deny defaults.',
  );

  // --- A. High queue pressure → throttle/hibernate, not unbounded spawn ---
  const throttle = await evaluateCognitiveHomeostasis({
    orgId: orgA,
    tenantId: tenantA,
    universeId: actorA.universeId,
    metrics: { queuePressure: 0.8, activeAgents: 12 },
    attemptUnboundedSpawn: true,
    root,
  });
  check(
    'US-BP-high-pressure-no-spawn',
    throttle.accepted === false &&
      throttle.spawnedAgents === 0 &&
      throttle.reason === HIGH_PRESSURE_THROTTLE,
    'Unbounded spawn under pressure DENIED; prefers throttle.',
  );

  const throttleOk = await evaluateCognitiveHomeostasis({
    orgId: orgA,
    tenantId: tenantA,
    universeId: actorA.universeId,
    metrics: { queuePressure: 0.8, activeAgents: 12 },
    root,
  });
  check(
    'US-BP-high-pressure-throttle',
    throttleOk.accepted === true &&
      throttleOk.decision?.action === 'throttle' &&
      throttleOk.spawnedAgents === 0 &&
      throttleOk.reason === HIGH_PRESSURE_THROTTLE,
    'High queue pressure → throttle (not unbounded spawn).',
  );

  const hibernate = await evaluateCognitiveHomeostasis({
    orgId: orgA,
    tenantId: tenantA,
    universeId: actorA.universeId,
    metrics: { queuePressure: 0.95, activeAgents: 20 },
    root,
  });
  check(
    'US-BP-high-pressure-hibernate',
    hibernate.accepted === true &&
      hibernate.decision?.action === 'hibernate' &&
      hibernate.spawnedAgents === 0 &&
      hibernate.reason === HIGH_PRESSURE_HIBERNATE,
    'Extreme queue pressure → hibernate (not unbounded spawn).',
  );

  // --- Homeostasis cannot expand L4/permissions ---
  const l4Deny = await evaluateCognitiveHomeostasis({
    orgId: orgA,
    tenantId: tenantA,
    universeId: actorA.universeId,
    metrics: { queuePressure: 0.1 },
    attemptExpandL4: true,
    root,
  });
  check(
    'US-BP-homeostasis-no-l4',
    l4Deny.accepted === false &&
      l4Deny.l4Expanded === false &&
      l4Deny.reason === HOMEOSTASIS_L4_EXPAND_DENIED &&
      cognitiveHomeostasisHonesty().l4AutonomyEnabled === false,
    'Homeostasis cannot expand L4 autonomy.',
  );

  const permDeny = await evaluateCognitiveHomeostasis({
    orgId: orgA,
    tenantId: tenantA,
    universeId: actorA.universeId,
    metrics: { queuePressure: 0.1 },
    attemptExpandPermissions: true,
    root,
  });
  check(
    'US-BP-homeostasis-no-perm-expand',
    permDeny.accepted === false &&
      permDeny.permissionsExpanded === false &&
      permDeny.reason === HOMEOSTASIS_PERM_EXPAND_DENIED,
    'Homeostasis cannot expand permissions.',
  );

  // --- B. Genome clone strips secrets/private/sealed/authority ---
  const tmpl = await registerApprovedGenomeTemplate({
    orgId: orgA,
    tenantId: tenantA,
    name: 'Alpha Approved Genome',
    genes: [
      { kind: 'policies', label: 'deny-default', content: 'policy:deny' },
      { kind: 'workflows', label: 'intake', content: 'wf:intake' },
      { kind: 'roles', label: 'analyst', content: 'role:analyst' },
      { kind: 'skills', label: 'research', content: 'skill:research' },
      { kind: 'schemas', label: 'v1', content: 'schema:v1' },
      {
        kind: 'knowledge_references',
        label: 'kb-ref',
        content: 'ref:kb',
        isReference: true,
      },
      { kind: 'operating_patterns', label: 'stabilize', content: 'pat:stabilize' },
    ],
    privateMemoryRefs: ['private-memory-alpha-1'],
    sealedPayloads: ['SEALED_FOUNDER_BP'],
    secrets: ['SECRET_BP_KEY'],
    authorityLevel: 9,
    root,
  });
  check('US-BP-genome-template', tmpl.accepted === true, 'Approved genome template registered.');

  const secretDeny = tmpl.accepted
    ? await replicateOrganizationGenome({
        sourceTemplateId: tmpl.template.id,
        sourceOrgId: orgA,
        targetOrgId: orgB,
        tenantId: tenantA,
        name: 'Bad secret clone',
        attemptCopySecrets: true,
        root,
      })
    : { accepted: false as const, reason: 'NO_TMPL', productionAuthorization: false as const };
  check(
    'US-BP-genome-strip-secrets',
    secretDeny.accepted === false && secretDeny.reason === GENOME_SECRET_DENIED,
    'Genome clone attempting secrets → DENIED.',
  );

  const privateDeny = tmpl.accepted
    ? await replicateOrganizationGenome({
        sourceTemplateId: tmpl.template.id,
        sourceOrgId: orgA,
        targetOrgId: orgB,
        tenantId: tenantA,
        name: 'Bad private clone',
        attemptCopyPrivateData: true,
        root,
      })
    : { accepted: false as const, reason: 'NO_TMPL', productionAuthorization: false as const };
  check(
    'US-BP-genome-strip-private',
    privateDeny.accepted === false && privateDeny.reason === GENOME_PRIVATE_DENIED,
    'Genome clone attempting private data → DENIED.',
  );

  const sealedDeny = tmpl.accepted
    ? await replicateOrganizationGenome({
        sourceTemplateId: tmpl.template.id,
        sourceOrgId: orgA,
        targetOrgId: orgB,
        tenantId: tenantA,
        name: 'Bad sealed clone',
        attemptCopySealed: true,
        root,
      })
    : { accepted: false as const, reason: 'NO_TMPL', productionAuthorization: false as const };
  check(
    'US-BP-genome-strip-sealed',
    sealedDeny.accepted === false && sealedDeny.reason === GENOME_SEALED_DENIED,
    'Genome clone attempting sealed info → DENIED.',
  );

  const authDeny = tmpl.accepted
    ? await replicateOrganizationGenome({
        sourceTemplateId: tmpl.template.id,
        sourceOrgId: orgA,
        targetOrgId: orgB,
        tenantId: tenantA,
        name: 'Bad authority clone',
        attemptCopyAuthority: true,
        root,
      })
    : { accepted: false as const, reason: 'NO_TMPL', productionAuthorization: false as const };
  check(
    'US-BP-genome-strip-authority',
    authDeny.accepted === false && authDeny.reason === GENOME_AUTHORITY_DENIED,
    'Genome clone attempting authority silent copy → DENIED.',
  );

  const clone = tmpl.accepted
    ? await replicateOrganizationGenome({
        sourceTemplateId: tmpl.template.id,
        sourceOrgId: orgA,
        targetOrgId: orgB,
        tenantId: tenantA,
        name: 'Beta Isolated Clone',
        root,
      })
    : { accepted: false as const, reason: 'NO_TMPL', productionAuthorization: false as const };
  check(
    'US-BP-genome-clone-isolated',
    clone.accepted === true &&
      clone.clone.isolated === true &&
      clone.clone.privateMemory.length === 0 &&
      clone.clone.secrets.length === 0 &&
      clone.clone.sealedPayloads.length === 0 &&
      clone.clone.authorityLevel === 0 &&
      clone.clone.labelIsAccess === false &&
      clone.isolatedFromSourcePrivateMemory === true,
    'Approved clone creates isolated Universe; forbidden categories stripped.',
  );

  // Cloned Universe isolated from source org private memory
  const privateRead =
    clone.accepted === true
      ? await attemptReadSourcePrivateMemoryFromClone({
          cloneId: clone.clone.id,
          sourcePrivateRef: 'private-memory-alpha-1',
          requestingOrgId: orgB,
          root,
        })
      : { allowed: false as const, reason: 'NO_CLONE', privateMemoryCopied: false as const };
  check(
    'US-BP-clone-no-source-private',
    privateRead.allowed === false &&
      privateRead.privateMemoryCopied === false &&
      privateRead.reason === CLONE_ISOLATION,
    'Cloned Universe cannot access source org private memory.',
  );

  if (clone.accepted) {
    const cross = await getClonedGenomeUniverse({
      cloneId: clone.clone.id,
      requestingOrgId: orgA,
      root,
    });
    check(
      'US-BP-clone-cross-org-deny',
      cross.allowed === false,
      'Source org cannot treat clone label as access to target universe.',
    );
  }

  check(
    'US-BP-genome-honesty',
    organizationGenomeHonesty().silentSecretCopy === false &&
      organizationGenomeHonesty().approvedTemplatesOnly === true,
    'Genome honesty locks: approved templates only; no silent secret copy.',
  );

  // --- C. Skill exchange does not escalate permissions ---
  const skillOk = await exchangeAgentSkill({
    fromOrgId: orgA,
    toOrgId: orgB,
    fromAgentId: actorA.id,
    toAgentId: actorB.id,
    tenantId: tenantA,
    universeId: actorA.universeId,
    skillKey: 'bounded-research',
    label: 'Bounded Research',
    evidenceRefs: ['ev-1'],
    fromPermissionLevel: 2,
    toPermissionLevel: 0,
    fromAuthorityLevel: 2,
    toAuthorityLevel: 0,
    root,
  });
  check(
    'US-BP-skill-exchange-ok',
    skillOk.accepted === true &&
      skillOk.permissionEscalated === false &&
      skillOk.authorityEscalated === false &&
      skillOk.exchange?.toPermissionLevelAfter === 0 &&
      skillOk.exchange?.toAuthorityLevelAfter === 0,
    'Evidence-backed skill exchange keeps receiver permission/authority unchanged.',
  );

  const skillPerm = await exchangeAgentSkill({
    fromOrgId: orgA,
    toOrgId: orgB,
    fromAgentId: actorA.id,
    toAgentId: actorB.id,
    tenantId: tenantA,
    universeId: actorA.universeId,
    skillKey: 'admin-bypass',
    label: 'Admin Bypass Skill',
    evidenceRefs: ['ev-2'],
    attemptPermissionGrantViaExchange: true,
    root,
  });
  check(
    'US-BP-skill-not-permission',
    skillPerm.accepted === false && skillPerm.reason === SKILL_NOT_PERMISSION,
    'Skill exchange attempting permission grant → DENIED.',
  );

  const skillAuth = await exchangeAgentSkill({
    fromOrgId: orgA,
    toOrgId: orgB,
    fromAgentId: actorA.id,
    toAgentId: actorB.id,
    tenantId: tenantA,
    universeId: actorA.universeId,
    skillKey: 'authority-boost',
    label: 'Authority Boost',
    evidenceRefs: ['ev-3'],
    attemptAuthorityEscalation: true,
    root,
  });
  check(
    'US-BP-skill-not-authority',
    skillAuth.accepted === false && skillAuth.reason === LEARNING_NOT_AUTHORITY,
    'Skill exchange attempting authority escalation → DENIED.',
  );
  check(
    'US-BP-skill-honesty',
    skillExchangeHonesty().skillExchangeIsPermissionGrant === false,
    'Skill exchange honesty: skill ≠ permission.',
  );

  // --- D. Offline island + freshness + rejoin + unconfigured cloud ---
  const island = await enterOfflineIslandMode({
    orgId: orgA,
    tenantId: tenantA,
    universeId: actorA.universeId,
    nodeId: 'edge-node-1',
    root,
  });
  check('US-BP-island-enter', island.accepted === true, 'Offline island mode entered.');

  const bounded =
    island.accepted === true
      ? await runIslandOperation({
          islandId: island.island.id,
          op: 'local-checkpoint',
          freshnessSensitive: false,
          root,
        })
      : { accepted: false, reason: 'NO', freshnessState: 'UNAVAILABLE' as const, islandMode: false, productionAuthorization: false as const };
  check(
    'US-BP-island-bounded-op',
    bounded.accepted === true && bounded.reason === ISLAND_BOUNDED,
    'Offline island continues bounded operation.',
  );

  const unbounded =
    island.accepted === true
      ? await runIslandOperation({
          islandId: island.island.id,
          op: 'spawn-all',
          attemptUnbounded: true,
          root,
        })
      : { accepted: false, reason: ISLAND_BOUNDED, freshnessState: 'DENIED' as const, islandMode: true, productionAuthorization: false as const };
  check(
    'US-BP-island-no-unbounded',
    unbounded.accepted === false && unbounded.reason === ISLAND_BOUNDED,
    'Offline island rejects unbounded expand.',
  );

  const stale =
    island.accepted === true
      ? await runIslandOperation({
          islandId: island.island.id,
          op: 'live-fx-quote',
          freshnessSensitive: true,
          localFreshnessOk: false,
          root,
        })
      : { accepted: false, reason: FRESHNESS_STALE, freshnessState: 'STALE' as const, islandMode: true, productionAuthorization: false as const };
  check(
    'US-BP-island-freshness-stale',
    stale.accepted === false &&
      stale.reason === FRESHNESS_STALE &&
      (stale.freshnessState === 'STALE' || stale.freshnessState === 'WAITING_DATA'),
    'Freshness-sensitive island op → STALE/WAITING_DATA.',
  );

  const rejoin = await reconcileMeshRejoin({
    orgId: orgA,
    nodeId: 'edge-node-1',
    remoteStateVerified: false,
    attemptAutoTrustUnverified: true,
    root,
  });
  check(
    'US-BP-rejoin-no-auto-trust',
    rejoin.accepted === false &&
      rejoin.autoTrusted === false &&
      rejoin.reason === REJOIN_NO_AUTO_TRUST,
    'Rejoin reconciliation does not auto-trust unverified remote state.',
  );

  await declareMeshRoute({
    kind: 'cloud',
    label: 'cloud-unconfigured',
    configured: false,
    verified: false,
    root,
  });
  const cloud = await selectMeshRoute({ prefer: 'cloud', root });
  check(
    'US-BP-cloud-mesh-unavailable',
    cloud.available === false &&
      cloud.state === 'UNAVAILABLE' &&
      cloud.reason === CLOUD_MESH_UNAVAILABLE,
    'Unconfigured cloud mesh route → UNAVAILABLE.',
  );

  const snap = await createRecoverySnapshot({
    orgId: orgA,
    tenantId: tenantA,
    universeId: actorA.universeId,
    payloadDigestSource: 'bp-recovery-v1',
    root,
  });
  check(
    'US-BP-recovery-snapshot',
    snap.version === 1 && snap.productionAuthorized === false,
    'Versioned recovery snapshot created (not production authorized).',
  );

  const dr = await runDisasterRecoverySimulation({
    scenario: 'partition-sim',
    claimRealAuthorization: true,
    root,
  });
  check(
    'US-BP-dr-sim-not-real-auth',
    dr.accepted === false && dr.sim.realDisasterAuthorization === false,
    'DR simulation ≠ real disaster authorization.',
  );

  check(
    'US-BP-mesh-honesty',
    brainMeshHonesty().rejoinAutoTrustRemote === false &&
      brainMeshHonesty().unconfiguredMeshState === 'UNAVAILABLE',
    'Mesh honesty locks: no auto-trust; unconfigured = UNAVAILABLE.',
  );

  // Cycle + health
  const cycle = await runCognitiveHomeostasisCycle({
    orgId: orgA,
    peerOrgId: orgB,
    tenantId: tenantA,
    actor: actorA,
    peerActor: actorB,
    root,
  });
  check(
    'US-BP-cycle-run',
    cycle.productionAuthorization === false &&
      cycle.l4AutonomyEnabled === false &&
      cycle.hops.length === COGNITIVE_HOMEOSTASIS_CYCLE.length,
    'Full BP cycle runs with productionAuthorization=false.',
  );

  const health = await buildCognitiveHomeostasisHealthReport(repoRoot);
  check(
    'US-BP-health',
    health.productionAuthorization === false &&
      health.l4AutonomyEnabled === false &&
      health.githubIssue === 80 &&
      health.gitlabIssue === 14 &&
      health.nextPhaseTitle === NEXT_PHASE_TITLE,
    'Health report: GitHub #80 / GitLab #14; next=BQ; unauthorized.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BP-pred-bo',
    preds.BO.module === 'AVAILABLE' && preds.BO.report === 'PASS',
    'BO predecessor module+report AVAILABLE on this base.',
  );
  check(
    'US-BP-pred-bm',
    preds.BM.module === 'AVAILABLE' && preds.BM.report === 'PASS',
    'BM predecessor module+report AVAILABLE (BO ancestor after BM rebase).',
  );
  check(
    'US-BP-pred-bl',
    preds.BL.module === 'AVAILABLE' && preds.BL.report === 'PASS',
    'BL predecessor module+report AVAILABLE (ancestor).',
  );
  check(
    'US-BP-pred-bn-waiting',
    preds.BN.module === 'WAITING_DATA' || preds.BN.report === 'WAITING_DATA',
    'BN in-tree module/report WAITING_DATA on this BO parent.',
  );
  check(
    'US-BP-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-BQ —'),
    'Next queue title is 62L-BQ only (title recorded).',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nFAIL ${failures.length} BP stories:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log(`\nAll 62L-BP required stories PASS (${HONESTY_BANNER}).`);
