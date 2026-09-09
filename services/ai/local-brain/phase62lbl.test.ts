import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  appendOrgMemory,
  attemptCrossOrgUniverseAccess,
  declareOrgAgentUniverse,
  getOrgUniverse,
  orgUniverseHonesty,
} from './org-agent-universe';
import {
  attemptCouncilChargeOrDeploy,
  conveneDepartmentCouncil,
} from './department-agent-council';
import {
  declareSynapseRoute,
  gravitationalPullHonesty,
  probeSpeedOverrideSecurity,
  selectSynapseRoute,
  synapseFabricHonesty,
} from './hybrid-synapse-fabric';
import {
  denyImpersonation,
  denySealedRouteAccess,
  eliteTrustHonesty,
  listTrustAudit,
  monitorDefensiveLeakage,
  synapseToGlobalOpsBrain,
  verifyAuditChain,
  zeroTrustIdentityCheck,
} from './elite-trust-protection';
import {
  ATTRACTOR_SOFTWARE_ONLY,
  BL_LOCKS,
  CROSS_ORG_ACCESS_DENIED,
  GRAVITATIONAL_PULL_GLOSSARY,
  HONESTY_BANNER,
  IMPERSONATION_DENIED,
  NEXT_PHASE_TITLE,
  ORG_AGENT_UNIVERSE_CYCLE,
  SEALED_NON_LEAK,
  SEALED_ROUTE_DENIED,
  SPEED_LOSES_TO_TRUST,
  UNVERIFIED_ROUTE_UNAVAILABLE,
  predecessorMap,
  type BlActor,
} from './org-agent-universe-types';
import {
  buildOrgAgentUniverseHealthReport,
  runOrgAgentUniverseCycle,
} from './org-agent-universe-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbl-'));
const orgA = 'org-alpha';
const orgB = 'org-beta';
const tenantA = 'tenant-alpha';
const tenantB = 'tenant-beta';
const SECRET = 'SEALED_BL_FOUNDER_TOKEN_DO_NOT_LEAK';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actorA: BlActor = {
  kind: 'org_admin',
  id: 'admin-a',
  orgId: orgA,
  tenantId: tenantA,
  universeId: 'pending',
  role: 'org_admin',
};

const actorB: BlActor = {
  kind: 'ordinary_agent',
  id: 'agent-b',
  orgId: orgB,
  tenantId: tenantB,
  universeId: 'pending-b',
  role: 'analyst',
};

try {
  check(
    'US-BL1-cycle',
    ORG_AGENT_UNIVERSE_CYCLE.join(' → ') ===
      'org_universe_declare → department_council_bind → org_memory_allocate → execution_profile_select → knowledge_pack_attach → authority_boundary_seal → synapse_route_declare → route_verification → attractor_score → trust_before_speed → failover_verified_only → zero_trust_identity → impersonation_guard → sealed_route_deny → secret_redaction → defensive_leak_monitor → global_ops_synapse → evidence → learning',
    'Org universe + synapse fabric + trust protection cycle is recorded in order.',
  );

  check(
    'US-BL-locks',
    BL_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BL_LOCKS.TIP_LAND === false &&
      BL_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BL_LOCKS.SPEED_OVERRIDES_SECURITY === false &&
      BL_LOCKS.COST_OVERRIDES_SECURITY === false &&
      BL_LOCKS.LABEL_IS_ACCESS === false &&
      BL_LOCKS.LEARNING_IS_AUTHORITY === false &&
      BL_LOCKS.RECOMMENDATION_IS_CHARGE_OR_DEPLOY === false &&
      BL_LOCKS.ORG_UNIVERSE_ISOLATION === true &&
      BL_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      BL_LOCKS.GRAVITATIONAL_PULL_IS_LITERAL === false &&
      BL_LOCKS.GRAVITATIONAL_PULL_IS_SOFTWARE_WEIGHTS === true &&
      BL_LOCKS.SYNAPSE_TRANSFERS_ORG_AUTHORITY === false &&
      BL_LOCKS.OFFENSIVE_LEAKAGE_TOOLS === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, speed≠security, software attractors only, sealed deny.',
  );

  check(
    'US-BL-attractor-glossary',
    GRAVITATIONAL_PULL_GLOSSARY.literalAstronomy === false &&
      GRAVITATIONAL_PULL_GLOSSARY.meaning === 'software_routing_attractors_and_weights' &&
      gravitationalPullHonesty().literalAstronomy === false &&
      synapseFabricHonesty().attractorNote === ATTRACTOR_SOFTWARE_ONLY &&
      ATTRACTOR_SOFTWARE_ONLY.includes('SOFTWARE_WEIGHTS'),
    'Gravitational pull documented as software routing weights — not literal astronomy.',
  );

  const univA = await declareOrgAgentUniverse({
    orgId: orgA,
    tenantId: tenantA,
    name: 'Alpha Org Universe',
    departments: ['engineering', 'security', 'operations'],
    executionProfile: 'hybrid_verified',
    actor: actorA,
    root,
  });
  check(
    'US-BL-org-universe',
    univA.accepted === true && univA.universe?.isolated === true && univA.universe.productionAuthorized === false,
    'Organization AI Agent Universe declared as isolated.',
  );
  const universeA = univA.accepted ? univA.universe.id : 'missing';
  actorA.universeId = universeA;

  const univB = await declareOrgAgentUniverse({
    orgId: orgB,
    tenantId: tenantB,
    name: 'Beta Org Universe',
    actor: actorB,
    root,
  });
  check('US-BL-org-universe-b', univB.accepted === true, 'Peer org Universe declared.');
  const universeB = univB.accepted ? univB.universe.id : 'missing-b';
  actorB.universeId = universeB;

  // --- Cross-org Universe access denied by default ---
  const cross = await attemptCrossOrgUniverseAccess({
    fromOrgId: orgA,
    toOrgId: orgB,
    fromUniverseId: universeA,
    toUniverseId: universeB,
    actor: actorA,
    root,
  });
  check(
    'US-BL-cross-org-deny',
    cross.allowed === false && cross.reason === CROSS_ORG_ACCESS_DENIED,
    'Cross-org Universe access denied by default.',
  );

  const crossMemory = await appendOrgMemory({
    orgId: orgB,
    note: 'intrusion attempt',
    actor: actorA,
    root,
  });
  check(
    'US-BL-cross-org-memory-deny',
    crossMemory.accepted === false && crossMemory.reason === CROSS_ORG_ACCESS_DENIED,
    'Cross-org memory write denied.',
  );

  const council = await conveneDepartmentCouncil({
    orgId: orgA,
    departmentId: 'engineering',
    topic: 'Hybrid routing recommendation',
    actor: actorA,
    root,
  });
  check(
    'US-BL-dept-council',
    council.accepted === true &&
      council.council?.recommendations.every((r) => r.chargeOrDeploy === false) === true,
    'Department Agent Council recommends only; chargeOrDeploy=false.',
  );
  if (council.accepted) {
    const charge = await attemptCouncilChargeOrDeploy({
      councilId: council.council.id,
      actor: actorA,
      root,
    });
    check(
      'US-BL-recommendation-not-deploy',
      charge.allowed === false && charge.chargeOrDeploy === false,
      'Recommendation ≠ charge/deploy.',
    );
  }

  // --- Sealed route deny from ordinary org / cloud / peer / telemetry ---
  for (const surface of ['ordinary_org', 'cloud', 'peer', 'telemetry'] as const) {
    const sealed = await denySealedRouteAccess({
      actor: actorA,
      surface,
      payload: SECRET,
      root,
    });
    check(
      `US-BL-sealed-deny-${surface}`,
      sealed.allowed === false &&
        sealed.payloadWritten === false &&
        sealed.reason === SEALED_ROUTE_DENIED,
      `Sealed route denied from ${surface}.`,
    );
  }

  const sealedSelect = await selectSynapseRoute({
    orgId: orgA,
    universeId: universeA,
    actor: actorA,
    requireSealedAccess: true,
    surface: 'ordinary_org',
    root,
  });
  check(
    'US-BL-sealed-select-deny',
    sealedSelect.selected === false && sealedSelect.reason === SEALED_ROUTE_DENIED,
    'Sealed route selection denied for ordinary org Universe.',
  );

  // --- Unverified cloud route → UNAVAILABLE ---
  const unverified = await declareSynapseRoute({
    orgId: orgA,
    universeId: universeA,
    kind: 'cloud',
    label: 'fast-cloud-unverified',
    verified: false,
    latencyMs: 1,
    trustScore: 0,
    actor: actorA,
    root,
  });
  check(
    'US-BL-unverified-state',
    unverified.accepted === true && unverified.route?.state === 'UNAVAILABLE',
    'Unverified cloud route declared as UNAVAILABLE.',
  );

  const pickUnverifiedOnly = await selectSynapseRoute({
    orgId: orgA,
    universeId: universeA,
    actor: actorA,
    allowKinds: ['cloud'],
    root,
  });
  check(
    'US-BL-unverified-unavailable',
    pickUnverifiedOnly.selected === false &&
      pickUnverifiedOnly.state === 'UNAVAILABLE' &&
      pickUnverifiedOnly.reason === UNVERIFIED_ROUTE_UNAVAILABLE,
    'Unverified cloud route selection → UNAVAILABLE.',
  );

  // --- Faster-but-untrusted loses to sealed/trust policy ---
  const trusted = await declareSynapseRoute({
    orgId: orgA,
    universeId: universeA,
    kind: 'local',
    label: 'slow-trusted-local',
    verified: true,
    latencyMs: 400,
    trustScore: 98,
    localityScore: 100,
    actor: actorA,
    root,
  });
  check('US-BL-trusted-route', trusted.accepted === true, 'Trusted local route declared.');

  const speedProbe = await probeSpeedOverrideSecurity({
    orgId: orgA,
    universeId: universeA,
    actor: actorA,
    root,
  });
  check(
    'US-BL-speed-never-overrides-security',
    speedProbe.allowedSpeedOverride === false &&
      speedProbe.pickedFastUntrusted === false &&
      speedProbe.speedOverrodeSecurity === false &&
      speedProbe.reason === SPEED_LOSES_TO_TRUST,
    'Faster-but-untrusted route loses to sealed/trust policy.',
  );

  const safePick = await selectSynapseRoute({
    orgId: orgA,
    universeId: universeA,
    actor: actorA,
    allowKinds: ['local', 'cloud'],
    root,
  });
  check(
    'US-BL-safe-path',
    safePick.selected === true &&
      safePick.route?.verified === true &&
      safePick.speedOverrodeSecurity === false &&
      safePick.attractorNote === ATTRACTOR_SOFTWARE_ONLY,
    'Fastest safe verified path selected via software attractors.',
  );

  // --- Impersonation DENIED ---
  const impersonator: BlActor = {
    kind: 'impersonator',
    id: 'attacker-1',
    orgId: orgA,
    tenantId: tenantA,
    universeId: universeA,
    claimedPrincipalId: 'ceo-founder',
  };
  const imp = await denyImpersonation({
    actor: impersonator,
    targetPrincipalId: 'ceo-founder',
    root,
  });
  check(
    'US-BL-impersonation-deny',
    imp.allowed === false && imp.reason === IMPERSONATION_DENIED && imp.attempting === true,
    'Impersonation attempt DENIED.',
  );

  const identity = await zeroTrustIdentityCheck({
    actor: impersonator,
    requiredOrgId: orgA,
    root,
  });
  check(
    'US-BL-zero-trust',
    identity.allowed === false,
    'Zero-trust identity rejects impersonator kind.',
  );

  // --- Synapse to Global Ops Brain: no authority transfer, no sealed leak ---
  const sealedSynapse = await synapseToGlobalOpsBrain({
    actor: actorA,
    orgId: orgA,
    message: 'try leak',
    sealedFounderPayload: SECRET,
    root,
  });
  check(
    'US-BL-global-ops-no-sealed-leak',
    sealedSynapse.connected === false &&
      sealedSynapse.sealedLeaked === false &&
      sealedSynapse.authorityTransferred === false &&
      sealedSynapse.reason === SEALED_NON_LEAK,
    'Synapse does not leak sealed founder data.',
  );

  const authSynapse = await synapseToGlobalOpsBrain({
    actor: actorA,
    orgId: orgA,
    message: 'try authority',
    attemptAuthorityTransfer: true,
    root,
  });
  check(
    'US-BL-global-ops-no-authority',
    authSynapse.authorityTransferred === false && authSynapse.connected === false,
    'Synapse to Global Ops Brain does not transfer org authority.',
  );

  const okSynapse = await synapseToGlobalOpsBrain({
    actor: actorA,
    orgId: orgA,
    message: 'status ok',
    root,
  });
  check(
    'US-BL-global-ops-connect',
    okSynapse.connected === true &&
      okSynapse.authorityTransferred === false &&
      okSynapse.sealedLeaked === false,
    'Governed synapse connects without swallow/leak/authority transfer.',
  );

  const leak = await monitorDefensiveLeakage({
    actor: actorA,
    token: SECRET,
    root,
  });
  check(
    'US-BL-defensive-leak-monitor',
    leak.defensiveOnly === true && leak.offensive === false && leak.leaked === false,
    'Defensive leakage monitoring only; sealed token not in ordinary files.',
  );

  const audit = await listTrustAudit(root);
  const chain = verifyAuditChain(audit);
  check('US-BL-tamper-evident-audit', chain.intact === true && audit.length > 0, 'Tamper-evident audit chain intact.');

  const cycle = await runOrgAgentUniverseCycle({
    orgId: orgA,
    peerOrgId: orgB,
    tenantId: tenantA,
    actor: actorA,
    peerActor: actorB,
    sealedPayload: SECRET,
    root,
  });
  check(
    'US-BL-cycle-run',
    cycle.productionAuthorization === false &&
      cycle.hops.length === ORG_AGENT_UNIVERSE_CYCLE.length &&
      cycle.attractorNote === ATTRACTOR_SOFTWARE_ONLY &&
      cycle.hops.every((h) => h.state !== 'FAIL'),
    'Full BL cycle runs without FAIL hops; production unauthorized.',
  );

  const health = await buildOrgAgentUniverseHealthReport(repoRoot);
  const preds = predecessorMap(repoRoot);
  check(
    'US-BL-health',
    health.productionAuthorization === false &&
      health.l4AutonomyEnabled === false &&
      health.githubIssue === 76 &&
      health.gitlabIssue === 10 &&
      health.nextPhaseTitle === NEXT_PHASE_TITLE &&
      orgUniverseHonesty().crossOrgAccessDefault === 'DENIED' &&
      eliteTrustHonesty().offensiveLeakageTools === false,
    'Health report honesty + GitHub #76 / GitLab #10 citations.',
  );

  check(
    'US-BL-waiting-predecessors',
    preds.BD.module === 'AVAILABLE' &&
      preds.BD.report === 'PASS' &&
      preds.BJ.module === 'AVAILABLE' &&
      preds.BJ.report === 'PASS' &&
      preds.BK.module === 'WAITING_DATA' &&
      preds.BI.module === 'WAITING_DATA',
    'BJ+BD present after rebase; BK/BI WAITING_DATA (not invented PASS).',
  );

  check(
    'US-BL-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-BM — Organization Neural Federation'),
    'Next queue title BM recorded.',
  );

  const stillIsolated = await getOrgUniverse(orgA, root);
  check(
    'US-BL-isolation-preserved',
    stillIsolated?.isolated === true && stillIsolated.authority.learningIsAuthority === false,
    'Org Universe isolation and learning≠authority preserved.',
  );
} catch (error) {
  failures.push(`UNCAUGHT: ${(error as Error).stack ?? (error as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('OK 62L-BL org agent universes + synapse fabric + elite trust protection');
