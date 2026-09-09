import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  configureEndpoint,
  registerKnowledgePacket,
  routeKnowledge,
  worldKnowledgeRoutingHonesty,
} from './world-knowledge-routing-os';
import {
  corridorGraphHonesty,
  registerCorridor,
  registerCorridorNode,
  transitCorridor,
} from './international-data-corridor-graph';
import {
  handoffMiniServer,
  miniServerMeshHonesty,
  registerMiniServer,
} from './regional-mini-server-mesh';
import {
  atlasHonesty,
  claimAllWorldCoverage,
  upsertAtlasEntry,
} from './historical-infrastructure-intelligence-atlas';
import {
  attemptResearchEscalation,
  crossBorderResearchHonesty,
  openResearchSession,
} from './cross-border-agent-research-network';
import {
  createSignedMemoryDelta,
  exchangeMemoryDelta,
  memoryExchangeHonesty,
  revokeMemoryDelta,
} from './distributed-global-memory-exchange';
import {
  ALL_WORLD_COVERAGE_REJECTED,
  ARBITRARY_DISCOVERY_DENIED,
  ATLAS_NOT_VERIFIED_WITHOUT_PROVENANCE,
  CN_LOCKS,
  CROSS_BORDER_PERMISSION_DENIED,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  POLICY_BEATS_SPEED,
  RAW_PRIVATE_POOLING_DENIED,
  REVOKED_DELTA_REJECTED,
  SEALED_CORRIDOR_DENIED,
  UNAPPROVED_KNOWLEDGE_CORRIDOR_DENIED,
  UNCONFIGURED_ENDPOINT_DENIED,
  UNSIGNED_DELTA_REJECTED,
  WORLD_KNOWLEDGE_ROUTING_OS_CYCLE,
  predecessorMap,
  type CnActor,
} from './world-knowledge-routing-os-types';
import {
  buildWorldKnowledgeRoutingOsHealthReport,
  runWorldKnowledgeRoutingOsCycle,
} from './world-knowledge-routing-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcn-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CnActor = {
  kind: 'world_knowledge_router',
  id: 'router-cn-1',
  orgId: 'org-cn',
  tenantId: 'tenant-cn',
  universeId: 'univ-cn',
  role: 'router',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CN1-cycle',
    WORLD_KNOWLEDGE_ROUTING_OS_CYCLE.join(' → ') ===
      'honesty_locks → configure_endpoint → route_unconfigured_endpoint_denied → approve_knowledge_for_corridor → unapproved_knowledge_corridor_denied → register_corridor → arbitrary_endpoint_discovery_denied → mesh_register_mini_server → atlas_upsert_with_provenance → atlas_without_provenance_not_verified → all_world_coverage_claim_rejected → cross_border_research_open_bounded → cross_border_research_no_permission_or_spend → memory_exchange_signed_delta → raw_private_pooling_denied → unsigned_or_revoked_delta_rejected → sealed_no_silent_international_corridor → policy_trust_beats_speed_cost → evidence → learning',
    'World knowledge routing OS cycle recorded in order.',
  );

  check(
    'US-CN-locks',
    CN_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CN_LOCKS.SEALED_SILENT_INTERNATIONAL_CORRIDOR === false &&
      CN_LOCKS.RAW_PRIVATE_POOLING_DEFAULT === false &&
      CN_LOCKS.ARBITRARY_ENDPOINT_DISCOVERY === false &&
      CN_LOCKS.UNAPPROVED_KNOWLEDGE_IN_CORRIDOR === false &&
      CN_LOCKS.ATLAS_WITHOUT_PROVENANCE_VERIFIED === false &&
      CN_LOCKS.ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE === false &&
      CN_LOCKS.CROSS_BORDER_PERMISSION_ESCALATION === false &&
      CN_LOCKS.CROSS_BORDER_SPEND_ESCALATION === false &&
      CN_LOCKS.EMBASSY_BUREAU_CAN_APPROVE_DEALS === false &&
      CN_LOCKS.EMBASSY_BUREAU_CAN_APPROVE_SPEND === false &&
      CN_LOCKS.POLICY_TRUST_BEATS_SPEED_COST === true &&
      CN_LOCKS.MEMORY_DELTA_REQUIRES_SIGNATURE === true &&
      CN_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      CN_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CN_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, no raw pool, no sealed corridor, policy>speed.',
  );

  check(
    'US-CN-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CO — XIV Global Knowledge Exchange OS'),
    'Next queue title is 62L-CO only (title).',
  );

  check(
    'US-CN-honesty-modules',
    worldKnowledgeRoutingHonesty().sealedSilentInternationalCorridor === false &&
      corridorGraphHonesty().unapprovedKnowledgeInCorridor === false &&
      miniServerMeshHonesty().arbitraryEndpointDiscovery === false &&
      atlasHonesty().allWorldCoverageWithoutEvidence === false &&
      crossBorderResearchHonesty().embassyBureauCanApproveSpend === false &&
      memoryExchangeHonesty().rawPrivatePoolingDefault === false,
    'Subsystem honesty helpers expose locks.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CN-pred-cm-present',
    preds.CM.tipProbe === 'PRESENT',
    `CM tipProbe=${preds.CM.tipProbe} report=${preds.CM.report}`,
  );
  check(
    'US-CN-pred-cl-present',
    preds.CL.tipProbe === 'PRESENT',
    `CL tipProbe=${preds.CL.tipProbe} report=${preds.CL.report}`,
  );

  // --- Route to unconfigured endpoint DENIED/UNAVAILABLE ---
  const uncfg = await routeKnowledge({
    endpointId: 'missing-endpoint',
    root,
    actor,
  });
  check(
    'US-CN-unconfigured-endpoint',
    uncfg.accepted === false && uncfg.reason === UNCONFIGURED_ENDPOINT_DENIED,
    'Route to unconfigured endpoint DENIED/UNAVAILABLE.',
  );

  const epHigh = await configureEndpoint({
    label: 'high-trust-archive',
    kind: 'archive',
    region: 'eu',
    trustScore: 95,
    root,
    actor,
  });
  const epFast = await configureEndpoint({
    label: 'fast-low-trust',
    kind: 'api',
    region: 'us',
    trustScore: 15,
    root,
    actor,
  });

  // --- Unapproved knowledge cannot enter corridor ---
  const badPkt = await registerKnowledgePacket({
    class: 'unapproved',
    summary: 'not approved',
    root,
    actor,
  });
  const badRoute = await routeKnowledge({
    endpointId: epHigh.id,
    packetId: badPkt.id,
    root,
    actor,
  });
  const nodeA = await registerCorridorNode({
    endpointId: epHigh.id,
    label: 'A',
    jurisdiction: 'EU',
    root,
    actor,
  });
  const nodeB = await registerCorridorNode({
    endpointId: epFast.id,
    label: 'B',
    jurisdiction: 'US',
    root,
    actor,
  });
  const corridor = await registerCorridor({
    fromNodeId: nodeA.id,
    toNodeId: nodeB.id,
    root,
    actor,
  });
  const badTransit = await transitCorridor({
    corridorId: corridor.edge!.id,
    knowledgeApproved: false,
    root,
    actor,
  });
  check(
    'US-CN-unapproved-knowledge',
    badRoute.accepted === false &&
      badRoute.reason === UNAPPROVED_KNOWLEDGE_CORRIDOR_DENIED &&
      badTransit.accepted === false &&
      badTransit.reason === UNAPPROVED_KNOWLEDGE_CORRIDOR_DENIED,
    'Unapproved knowledge cannot enter corridor.',
  );

  // --- Raw private pooling DENIED by default ---
  const signed = await createSignedMemoryDelta({
    compactPayload: 'fact-v1',
    approved: true,
    sign: true,
    root,
    actor,
  });
  const rawPool = await exchangeMemoryDelta({
    deltaId: signed.delta!.id,
    operation: 'import',
    attemptRawPrivatePooling: true,
    root,
    actor,
  });
  check(
    'US-CN-raw-private-pooling',
    rawPool.accepted === false && rawPool.reason === RAW_PRIVATE_POOLING_DENIED,
    'Raw private pooling via memory exchange DENIED by default.',
  );

  // --- Unsigned / revoked memory delta rejected ---
  const unsigned = await createSignedMemoryDelta({
    compactPayload: 'u1',
    approved: true,
    sign: false,
    root,
    actor,
  });
  const unsignedEx = await exchangeMemoryDelta({
    deltaId: unsigned.delta!.id,
    operation: 'import',
    root,
    actor,
  });
  const toRevoke = await createSignedMemoryDelta({
    compactPayload: 'r1',
    approved: true,
    sign: true,
    root,
    actor,
  });
  await revokeMemoryDelta({ deltaId: toRevoke.delta!.id, root, actor });
  const revokedEx = await exchangeMemoryDelta({
    deltaId: toRevoke.delta!.id,
    operation: 'import',
    root,
    actor,
  });
  check(
    'US-CN-unsigned-revoked-delta',
    unsignedEx.accepted === false &&
      unsignedEx.reason === UNSIGNED_DELTA_REJECTED &&
      revokedEx.accepted === false &&
      revokedEx.reason === REVOKED_DELTA_REJECTED,
    'Unsigned/revoked memory delta rejected.',
  );

  // --- Atlas without provenance not labeled verified ---
  const noProv = await upsertAtlasEntry({
    domain: 'telecom',
    region: 'unknown',
    eraStart: '1990',
    summary: 'no provenance entry',
    provenanceRefs: [],
    root,
    actor,
  });
  check(
    'US-CN-atlas-no-provenance',
    noProv.entry?.coverageLabel !== 'VERIFIED' &&
      noProv.entry?.verificationState !== 'VERIFIED' &&
      noProv.reason === ATLAS_NOT_VERIFIED_WITHOUT_PROVENANCE,
    'Atlas entry without provenance not labeled verified.',
  );

  // --- All-world coverage claim without evidence REJECTED ---
  const allWorld = await claimAllWorldCoverage({
    claim: 'all-world infrastructure complete',
    evidenceRefs: [],
    root,
    actor,
  });
  const allWorldWithPartial = await claimAllWorldCoverage({
    claim: 'all-world infrastructure complete',
    evidenceRefs: ['partial-source'],
    root,
    actor,
  });
  check(
    'US-CN-all-world-coverage',
    allWorld.accepted === false &&
      allWorld.reason === ALL_WORLD_COVERAGE_REJECTED &&
      allWorldWithPartial.accepted === false,
    'All-world infrastructure coverage claim without evidence REJECTED/not VERIFIED.',
  );

  // --- Cross-border research cannot escalate permissions or spend ---
  const session = await openResearchSession({
    topic: 'bounded study',
    jurisdictions: ['EU', 'JP'],
    root,
    actor,
  });
  const esc = await attemptResearchEscalation({
    sessionId: session.session!.id,
    claimPermissionEscalation: true,
    claimSpendAuthority: true,
    claimDealApproval: true,
    root,
    actor: { ...actor, kind: 'embassy_bureau' },
  });
  check(
    'US-CN-cross-border-no-escalation',
    session.accepted === true &&
      session.session?.bounded === true &&
      esc.accepted === false &&
      esc.reason === CROSS_BORDER_PERMISSION_DENIED &&
      esc.session?.permissionEscalated === false &&
      esc.session?.spendEscalated === false &&
      esc.session?.dealApproved === false,
    'Cross-border research cannot escalate permissions or spend.',
  );

  // --- Sealed content cannot silent-route onto international corridor ---
  const sealed = await registerKnowledgePacket({
    class: 'sealed',
    sealed: true,
    summary: 'sealed',
    root,
    actor,
  });
  const sealedRoute = await routeKnowledge({
    endpointId: epHigh.id,
    packetId: sealed.id,
    attemptSilentInternationalCorridor: true,
    root,
    actor,
  });
  check(
    'US-CN-sealed-no-silent-corridor',
    sealedRoute.accepted === false && sealedRoute.reason === SEALED_CORRIDOR_DENIED,
    'Sealed content cannot silent-route onto international corridor.',
  );

  // --- Faster low-trust corridor loses to policy/sealed weights ---
  const approved = await registerKnowledgePacket({
    class: 'approved',
    approved: true,
    summary: 'ok',
    root,
    actor,
  });
  const policy = await routeKnowledge({
    packetId: approved.id,
    candidates: [
      { endpointId: epFast.id, latencyMs: 5 },
      { endpointId: epHigh.id, latencyMs: 400 },
    ],
    root,
    actor,
  });
  check(
    'US-CN-policy-beats-speed',
    policy.accepted === true &&
      policy.endpointId === epHigh.id &&
      policy.selectedBy === 'policy_trust' &&
      (policy.reason === POLICY_BEATS_SPEED ||
        policy.reason === 'ROUTE_ACCEPTED_POLICY_TRUST'),
    'Faster low-trust corridor loses to policy/sealed weights.',
  );

  // --- Arbitrary endpoint discovery DENIED ---
  const disc = await routeKnowledge({
    attemptArbitraryDiscovery: true,
    root,
    actor,
  });
  const meshDisc = await handoffMiniServer({
    fromServerId: 'x',
    toServerId: 'y',
    attemptDiscoverPeer: true,
    root,
    actor,
  });
  check(
    'US-CN-arbitrary-discovery',
    disc.accepted === false &&
      disc.reason === ARBITRARY_DISCOVERY_DENIED &&
      meshDisc.accepted === false &&
      meshDisc.reason === ARBITRARY_DISCOVERY_DENIED,
    'Arbitrary endpoint discovery DENIED.',
  );

  // Mesh happy path with configured servers
  const s1 = await registerMiniServer({
    label: 'eu-mini',
    region: 'eu',
    cellRef: 'cl-cell',
    root,
    actor,
  });
  const s2 = await registerMiniServer({
    label: 'as-mini',
    region: 'apac',
    root,
    actor,
  });
  const handoff = await handoffMiniServer({
    fromServerId: s1.id,
    toServerId: s2.id,
    root,
    actor,
  });
  check(
    'US-CN-mesh-handoff-ok',
    handoff.accepted === true,
    'Configured mini-server mesh handoff accepted.',
  );

  const withProv = await upsertAtlasEntry({
    domain: 'ports',
    region: 'singapore',
    eraStart: '1965',
    summary: 'port growth',
    provenanceRefs: ['archive:sg-port-1965'],
    root,
    actor,
  });
  check(
    'US-CN-atlas-with-provenance',
    withProv.entry?.coverageLabel === 'VERIFIED',
    'Atlas entry with provenance can be VERIFIED.',
  );

  const okMem = await exchangeMemoryDelta({
    deltaId: signed.delta!.id,
    operation: 'import',
    root,
    actor,
  });
  check(
    'US-CN-signed-approved-import',
    okMem.accepted === true,
    'Signed approved compact memory delta import accepted.',
  );

  const cycle = await runWorldKnowledgeRoutingOsCycle({
    orgId: 'org-cn',
    tenantId: 'tenant-cn',
    universeId: 'univ-cn',
    actor,
    root,
  });
  check(
    'US-CN-cycle-runtime',
    cycle.hops.length === WORLD_KNOWLEDGE_ROUTING_OS_CYCLE.length &&
      cycle.hops.every((h) => h.state !== 'FAIL') &&
      cycle.nextPhase === NEXT_PHASE_TITLE,
    `Cycle hops=${cycle.hops.length} all non-FAIL.`,
  );

  const health = await buildWorldKnowledgeRoutingOsHealthReport({ root: repoRoot });
  check(
    'US-CN-health-report',
    health.phase === '62L-CN' &&
      health.l4AutonomyEnabled === false &&
      health.productionAuthorized === false &&
      health.tipLand === false &&
      health.githubSoT === 104 &&
      health.gitlabCoordination === 38 &&
      health.modules.worldKnowledgeRoutingOs === 'IMPLEMENTED',
    'Health report exposes honesty + module status.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL\n' + failures.map((f) => ` - ${f}`).join('\n'));
  process.exit(1);
}
console.log('OK 62L-CN world knowledge routing OS tests passed');
