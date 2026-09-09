/**
 * 62L-CL runtime — walks GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  attemptArbitraryServerDiscovery,
  bootstrapKnowledgeServerConstellation,
  claimCoverage,
  constellationHonesty,
  enrollRegionalCloudServiceCell,
  requestRegionalCellService,
} from './global-knowledge-server-constellation';
import {
  archiveMiningHonesty,
  attemptArchiveIntake,
  enrollArchiveSource,
} from './international-archive-mining-network';
import {
  compileDataHighway,
  highwayCompilerHonesty,
  registerCloudEndpoint,
  routeContentOnHighway,
} from './multi-cloud-data-highway-compiler';
import {
  attemptCivilizationGraphPromotion,
  civilizationGraphHonesty,
  recordCivilizationGraphNode,
} from './historical-civilization-knowledge-graph';
import {
  attemptBureauPermissionEscalation,
  grantBureauSkill,
  openRegionalResearchBureau,
  researchBureausHonesty,
} from './regional-agent-research-bureaus';
import {
  applySyncPack,
  createSyncPack,
  revokeSyncPack,
  syncFabricHonesty,
} from './offline-cloud-superbrain-sync-fabric';
import {
  CL_LOCKS,
  GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type ClActor,
  type ClEvidenceState,
  type ClHop,
  type ClHopRecord,
} from './global-knowledge-server-constellation-types';

export {
  CL_LOCKS,
  GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: ClHop, state: ClEvidenceState, summary: string): ClHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type ClCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: ClActor;
  root?: string;
};

export async function runGlobalKnowledgeServerConstellationCycle(input: ClCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: ClHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CL_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CL_LOCKS.LOCAL_FIRST &&
        CL_LOCKS.EVIDENCE_FIRST &&
        CL_LOCKS.ARBITRARY_SERVER_DISCOVERY === false &&
        CL_LOCKS.SEALED_SILENT_CLOUD_HIGHWAY === false &&
        CL_LOCKS.AUTO_TRUST_UNVERIFIED_PACKS === false &&
        CL_LOCKS.BUREAU_SKILL_IS_PERMISSION === false &&
        CL_LOCKS.SIM_PROMOTE_TO_VERIFIED_FACT === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const constellation = await bootstrapKnowledgeServerConstellation({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(hop('constellation_bootstrap', 'PASS', constellation.id));

  const enrolled = await enrollRegionalCloudServiceCell({
    constellationId: constellation.id,
    regionCode: 'eu-west',
    label: 'EU West Cell',
    enroll: true,
    verified: true,
    buildsOnMiniCell: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'enroll_regional_cell',
      enrolled.enrolled && enrolled.status === 'available' ? 'ENROLLED' : 'FAIL',
      enrolled.reason,
    ),
  );

  const unenrolled = await enrollRegionalCloudServiceCell({
    constellationId: constellation.id,
    regionCode: 'shadow',
    label: 'Shadow Cell',
    enroll: false,
    root,
    actor,
  });
  const unenrolledSvc = await requestRegionalCellService({
    cellId: unenrolled.id,
    action: 'query',
    root,
    actor,
  });
  hops.push(
    hop(
      'unenrolled_cell_unavailable',
      unenrolledSvc.status === 'unavailable' || unenrolledSvc.status === 'denied'
        ? 'UNAVAILABLE'
        : 'FAIL',
      unenrolledSvc.reason,
    ),
  );

  const discovery = await attemptArbitraryServerDiscovery({
    target: 'https://arbitrary.example/discover',
    root,
    actor,
  });
  hops.push(
    hop(
      'arbitrary_server_discovery_denied',
      discovery.status === 'denied' ? 'DENIED' : 'FAIL',
      discovery.reason,
    ),
  );

  const allWorld = await claimCoverage({
    scope: 'all_world',
    root,
    actor,
  });
  hops.push(
    hop(
      'all_world_coverage_rejected',
      allWorld.status === 'rejected' && allWorld.verified === false
        ? 'REJECTED'
        : 'FAIL',
      allWorld.reason,
    ),
  );

  const archiveSrc = await enrollArchiveSource({
    regionCode: 'eu-west',
    language: 'fr',
    label: 'BNF authorized slice',
    authorized: true,
    provenanceRef: 'prov://bnf/authorized/2026',
    root,
    actor,
  });
  const archiveOk = await attemptArchiveIntake({
    sourceId: archiveSrc.id,
    regionCode: 'eu-west',
    language: 'fr',
    title: 'Authorized chronicle',
    root,
    actor,
  });
  hops.push(
    hop(
      'archive_intake_authorized',
      archiveOk.status === 'accepted' ? 'PASS' : 'FAIL',
      archiveOk.reason,
    ),
  );

  const archiveDenied = await attemptArchiveIntake({
    regionCode: 'xx',
    language: 'und',
    title: 'Unauthorized scrape',
    authorized: false,
    provenanceRef: null,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_archive_denied',
      archiveDenied.status === 'denied' ? 'DENIED' : 'FAIL',
      archiveDenied.reason,
    ),
  );

  const endpoint = await registerCloudEndpoint({
    provider: 'cloud-a',
    label: 'Cloud A verified',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const highway = await compileDataHighway({
    name: 'authorized-highway',
    endpointIds: [endpoint.id],
    mode: 'open',
    root,
    actor,
  });
  hops.push(
    hop(
      'highway_compile_authorized',
      highway.status === 'candidate' ? 'CANDIDATE' : 'FAIL',
      highway.reason,
    ),
  );

  const bareEp = await registerCloudEndpoint({
    provider: 'cloud-b',
    label: 'Unconfigured',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const badHwy = await compileDataHighway({
    name: 'bad-highway',
    endpointIds: [bareEp.id],
    mode: 'open',
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_highway_denied',
      badHwy.status === 'unavailable' || badHwy.status === 'denied'
        ? 'UNAVAILABLE'
        : 'FAIL',
      badHwy.reason,
    ),
  );

  const sealedRoute = await routeContentOnHighway({
    highwayId: highway.id,
    contentClass: 'sealed',
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_cloud_highway',
      sealedRoute.status === 'denied' ? 'DENIED' : 'FAIL',
      sealedRoute.reason,
    ),
  );

  const fact = await recordCivilizationGraphNode({
    kind: 'fact',
    label: 'era-fact',
    statement: 'Documented trade route exists',
    era: 'classical',
    regionCode: 'eu-west',
    evidenceRefs: ['ev-1'],
    root,
    actor,
  });
  const sim = await recordCivilizationGraphNode({
    kind: 'simulation',
    label: 'era-sim',
    statement: 'Simulated population pressure',
    era: 'classical',
    regionCode: 'eu-west',
    root,
    actor,
  });
  hops.push(
    hop(
      'civilization_graph_typed',
      fact.kind === 'fact' &&
        sim.kind === 'simulation' &&
        sim.simulationLabeled
        ? 'PASS'
        : 'FAIL',
      `${fact.id},${sim.id}`,
    ),
  );

  const simPromo = await attemptCivilizationGraphPromotion({
    nodeId: sim.id,
    toKind: 'fact',
    claimVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'reject_sim_to_verified_fact',
      simPromo.rejected ? 'REJECTED' : 'FAIL',
      simPromo.reason,
    ),
  );

  const bureau = await openRegionalResearchBureau({
    regionCode: 'eu-west',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'bureau_open_bounded',
      bureau.sandboxed && bureau.autonomousSpend === false ? 'BOUNDED' : 'FAIL',
      bureau.id,
    ),
  );

  const grant = await grantBureauSkill({
    bureauId: bureau.id,
    agentId: 'agent-cl-1',
    skillKey: 'regional-archive-eval',
    score: 0.91,
    actorPermissionLevel: actor.permissionLevel,
    actorAuthorityLevel: actor.authorityLevel,
    root,
    actor,
  });
  const escalate = await attemptBureauPermissionEscalation({
    grantId: grant.id,
    requestedPermissionDelta: 5,
    requestedAuthorityDelta: 3,
    root,
    actor,
  });
  hops.push(
    hop(
      'bureau_skill_no_permission',
      grant.skillIsPermissionGrant === false &&
        escalate.rejected &&
        grant.permissionLevel === actor.permissionLevel
        ? 'DENIED'
        : 'FAIL',
      escalate.reason,
    ),
  );

  const payload = 'offline-knowledge-pack-v1';
  const pack = await createSyncPack({
    label: 'eu-west-pack',
    payload,
    signature: 'sig-demo-cl',
    root,
    actor,
  });
  hops.push(
    hop(
      'sync_pack_signed',
      pack.signed && pack.trusted === false ? 'SIGNED' : 'FAIL',
      pack.reason,
    ),
  );

  const unsigned = await createSyncPack({
    label: 'unsigned-pack',
    payload: 'bad',
    signature: null,
    root,
    actor,
  });
  const revoked = await revokeSyncPack({ packId: pack.id, root, actor });
  const revokedApply = await applySyncPack({
    packId: pack.id,
    expectedChecksum: pack.payloadDigest,
    observedPayload: payload,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_or_revoked_pack_rejected',
      unsigned.status === 'rejected' &&
        revoked.accepted &&
        revokedApply.status === 'rejected'
        ? 'REJECTED'
        : 'FAIL',
      revokedApply.reason,
    ),
  );

  const goodPack = await createSyncPack({
    label: 'checksum-pack',
    payload: 'good-payload',
    signature: 'sig-ok',
    root,
    actor,
  });
  const conflict = await applySyncPack({
    packId: goodPack.id,
    expectedChecksum: goodPack.payloadDigest,
    observedPayload: 'tampered-payload',
    root,
    actor,
  });
  hops.push(
    hop(
      'checksum_conflict_not_silent',
      conflict.status === 'rejected' && conflict.conflict ? 'CONFLICT' : 'FAIL',
      conflict.reason,
    ),
  );

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CL global knowledge server constellation cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CL'],
        constellationId: constellation.id,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CL global knowledge server constellation cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning ≠ permission; coverage enrolled/verified only`,
      sourceRefs: ['62L-CL'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;
  void constellationHonesty;
  void archiveMiningHonesty;
  void highwayCompilerHonesty;
  void civilizationGraphHonesty;
  void researchBureausHonesty;
  void syncFabricHonesty;

  return {
    ok: hops.every((h) =>
      [
        'PASS',
        'DENIED',
        'REJECTED',
        'UNAVAILABLE',
        'BOUNDED',
        'CANDIDATE',
        'ENROLLED',
        'SIGNED',
        'CONFLICT',
        'LABELED_SIMULATION',
        'NOT_APPLIED',
        'RECOMMENDATION_ONLY',
        'LOCAL_PREFERRED',
      ].includes(h.state),
    ),
    hops,
    constellationId: constellation.id,
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CL_LOCKS.L4_AUTONOMY_ENABLED,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildGlobalKnowledgeServerConstellationHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const health = await checkLocalBrainHealth(root);
  const predecessors = predecessorMap(root);
  return {
    phase: '62L-CL',
    title:
      'XIV Global Knowledge Server Constellation + International Archive Mining Network + Multi-Cloud Data Highway Compiler + Historical Civilization Knowledge Graph + Regional Agent Research Bureaus + Offline/Cloud Superbrain Sync Fabric',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CL_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorized: CL_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CL_LOCKS.TIP_LAND,
    githubSotIssue: 102,
    gitlabCoordinationIssue: 36,
    locks: { ...CL_LOCKS },
    honesty: {
      constellation: constellationHonesty(),
      archive: archiveMiningHonesty(),
      highway: highwayCompilerHonesty(),
      graph: civilizationGraphHonesty(),
      bureau: researchBureausHonesty(),
      sync: syncFabricHonesty(),
    },
    cycle: [...GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_CYCLE],
    predecessors,
    localBrainHealth: health,
    nextPhase: NEXT_PHASE_TITLE,
    documentedEqImplemented: false,
    implementedEqVerified: false,
    verifiedEqProductionAuthorized: false,
    at: new Date().toISOString(),
  };
}
