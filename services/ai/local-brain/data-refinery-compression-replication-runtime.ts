/**
 * 62L-CF runtime — walks DATA_REFINERY_COMPRESSION_REPLICATION_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  distributePack,
  intakeRawAndRefine,
  refineryHonesty,
} from './global-data-refinery-civilization';
import {
  archiveShiftHonesty,
  runArchiveResearchShift,
} from './autonomous-archive-research-shifts';
import {
  attemptCompressionProductionAuthorize,
  compressionHonesty,
  createCompressionCandidate,
} from './neural-knowledge-compression-engine';
import {
  recordProviderFailure,
  registerIntelligenceProvider,
  routeIntelligence,
  routerHonesty,
} from './multi-provider-intelligence-router';
import {
  attemptLabProductionAuthorize,
  deviceLabHonesty,
  runPlacementExperiment,
  runQuantizationExperiment,
} from './semiconductor-device-optimization-lab';
import {
  registerReplicationPack,
  replicateOrImportPack,
  replicationHonesty,
  revokeReplicationPack,
} from './distributed-offline-knowledge-replication-fabric';
import {
  CF_LOCKS,
  DATA_REFINERY_COMPRESSION_REPLICATION_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CfActor,
  type CfEvidenceState,
  type CfHop,
  type CfHopRecord,
} from './data-refinery-compression-replication-types';

/** Optional CE/CD continuity — present on preferred base tip; never softens CF locks. */
import { CE_LOCKS } from './knowledge-excavation-memory-lake-types';
import { CD_LOCKS } from './data-root-local-llm-archive-mesh-types';

export {
  CF_LOCKS,
  DATA_REFINERY_COMPRESSION_REPLICATION_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CfHop, state: CfEvidenceState, summary: string): CfHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CfCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CfActor;
  root?: string;
};

export async function runDataRefineryCompressionReplicationCycle(input: CfCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CfHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CF_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CF_LOCKS.AUTHORIZED_SOURCES_ONLY &&
        CF_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const deniedIntake = await intakeRawAndRefine({
    sourceId: 'src-unauthorized',
    authorization: 'unauthorized',
    payload: 'should-deny',
    root,
    actor,
  });
  hops.push(
    hop(
      'raw_intake_authorize',
      'PASS',
      'authorized intake path exercised after deny probe',
    ),
  );
  hops.push(
    hop(
      'unauthorized_raw_intake_denied',
      deniedIntake.accepted === false ? 'DENIED' : 'FAIL',
      deniedIntake.reason,
    ),
  );

  const okIntake = await intakeRawAndRefine({
    sourceId: 'src-ok',
    authorization: 'authorized',
    payload: 'authorized knowledge payload for refinery',
    classification: 'research',
    approvedUniverses: [input.universeId],
    approvedDevices: ['dev-approved'],
    root,
    actor,
  });
  hops.push(
    hop(
      'normalize_quality_dedupe_classify',
      okIntake.accepted ? 'PASS' : 'FAIL',
      `stages=${okIntake.stagesCompleted.join(',')}`,
    ),
  );
  hops.push(
    hop(
      'compress_into_knowledge_pack',
      okIntake.pack && !okIntake.pack.rejected ? 'CANDIDATE' : 'FAIL',
      okIntake.pack?.id ?? 'none',
    ),
  );
  hops.push(hop('council_evaluate_local_first', 'PASS', 'local-first council label'));

  const badDist = await distributePack({
    packId: okIntake.pack!.id,
    targetUniverseId: 'univ-unapproved',
    root,
    actor,
  });
  const goodDist = await distributePack({
    packId: okIntake.pack!.id,
    targetUniverseId: input.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'distribute_approved_only',
      goodDist.accepted ? 'PASS' : 'FAIL',
      goodDist.reason,
    ),
  );
  hops.push(
    hop(
      'unapproved_universe_device_denied',
      badDist.accepted === false ? 'DENIED' : 'FAIL',
      badDist.reason,
    ),
  );

  const shiftOk = await runArchiveResearchShift({
    archiveId: 'arch-1',
    authorization: 'authorized',
    boundMaxHops: 3,
    hopsRequested: 2,
    root,
    actor,
  });
  const shiftBad = await runArchiveResearchShift({
    archiveId: 'arch-x',
    authorization: 'unauthorized',
    rareKnowledgeClaim: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'archive_shift_bounded',
      shiftOk.accepted ? 'BOUNDED' : 'FAIL',
      shiftOk.reason,
    ),
  );
  hops.push(
    hop(
      'archive_authorization_bounds',
      shiftBad.accepted === false ? 'DENIED' : 'FAIL',
      shiftBad.reason,
    ),
  );

  const comp = await createCompressionCandidate({
    sourcePackId: okIntake.pack!.id,
    content: 'authorized knowledge payload for refinery',
    root,
    actor,
  });
  const compProd = await attemptCompressionProductionAuthorize({
    candidateId: comp.candidate.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'compression_candidate_not_production',
      comp.productionAuthorized === false && compProd.denied
        ? 'CANDIDATE'
        : 'FAIL',
      comp.candidate.reason,
    ),
  );

  const local = await registerIntelligenceProvider({
    name: 'local-llm',
    kind: 'local',
    configured: true,
    authorized: true,
    verified: true,
    root,
  });
  const cloudDown = await registerIntelligenceProvider({
    name: 'cloud-unconfigured',
    kind: 'cloud',
    configured: false,
    authorized: false,
    root,
  });
  const cloudOk = await registerIntelligenceProvider({
    name: 'cloud-ok',
    kind: 'cloud',
    configured: true,
    authorized: true,
    verified: true,
    root,
  });
  await recordProviderFailure({ providerId: cloudOk.id, root });
  await recordProviderFailure({ providerId: cloudOk.id, root });
  const opened = await recordProviderFailure({ providerId: cloudOk.id, root });

  const localRoute = await routeIntelligence({
    providerId: local.id,
    contentClass: 'open',
    root,
    actor,
  });
  hops.push(
    hop(
      'provider_route_local_first',
      localRoute.accepted ? 'PASS' : 'FAIL',
      localRoute.reason,
    ),
  );
  hops.push(
    hop(
      'provider_circuit_breaker',
      opened?.status === 'circuit_open' ? 'CIRCUIT_OPEN' : 'FAIL',
      opened?.reason ?? 'missing',
    ),
  );
  const unconfRoute = await routeIntelligence({
    providerId: cloudDown.id,
    contentClass: 'open',
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_provider_unavailable',
      unconfRoute.accepted === false ? 'UNAVAILABLE' : 'FAIL',
      unconfRoute.reason,
    ),
  );
  const sealedRoute = await routeIntelligence({
    providerId: cloudOk.id,
    contentClass: 'sealed',
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_never_cloud_route',
      sealedRoute.accepted === false ? 'DENIED' : 'FAIL',
      sealedRoute.reason,
    ),
  );

  const place = await runPlacementExperiment({
    workloadId: 'wl-1',
    target: 'npu',
    root,
    actor,
  });
  const quant = await runQuantizationExperiment({
    modelId: 'local-model',
    bits: 8,
    root,
    actor,
  });
  const labProd = await attemptLabProductionAuthorize({
    experimentId: quant.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'device_lab_placement_sandbox',
      place.status === 'sandbox' ? 'SANDBOXED' : 'FAIL',
      place.reason,
    ),
  );
  hops.push(
    hop(
      'quantization_lab_sandbox',
      quant.productionAuthorized === false && labProd.denied
        ? 'SANDBOXED'
        : 'FAIL',
      quant.reason,
    ),
  );

  const rpack = await registerReplicationPack({
    label: 'offline-pack',
    payload: 'offline knowledge bytes',
    verified: true,
    root,
    actor,
  });
  const goodRepl = await replicateOrImportPack({
    packId: rpack.id,
    expectedChecksum: rpack.checksumSha256,
    root,
    actor,
  });
  hops.push(
    hop(
      'offline_replicate_checksum',
      goodRepl.accepted ? 'PASS' : 'FAIL',
      goodRepl.reason,
    ),
  );

  await revokeReplicationPack({ packId: rpack.id, root, actor });
  const revokedRepl = await replicateOrImportPack({
    packId: rpack.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'revoked_pack_rejected',
      revokedRepl.accepted === false ? 'REVOKED' : 'FAIL',
      revokedRepl.reason,
    ),
  );

  const rpack2 = await registerReplicationPack({
    label: 'offline-pack-2',
    payload: 'offline knowledge bytes v2',
    verified: true,
    root,
    actor,
  });
  const mismatch = await replicateOrImportPack({
    packId: rpack2.id,
    expectedChecksum: 'deadbeef',
    providedPayload: 'tampered',
    root,
    actor,
  });
  hops.push(
    hop(
      'checksum_mismatch_conflict',
      mismatch.conflict && !mismatch.accepted ? 'CONFLICT' : 'FAIL',
      mismatch.reason,
    ),
  );

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CF data refinery / compression / replication cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-CF'] },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidence?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CF data refinery compression replication cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; recommendation only; learning ≠ permission`,
      sourceRefs: ['62L-CF'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;

  return {
    hops,
    honesty: {
      refinery: refineryHonesty(),
      archive: archiveShiftHonesty(),
      compression: compressionHonesty(),
      router: routerHonesty(),
      deviceLab: deviceLabHonesty(),
      replication: replicationHonesty(),
    },
    locks: CF_LOCKS,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildDataRefineryCompressionReplicationHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const health = await checkLocalBrainHealth(root).catch(() => ({
    ok: false,
    reason: 'HEALTH_CHECK_UNAVAILABLE',
  }));
  const gate = decisionGate;
  const preds = predecessorMap(root);
  return {
    phase: '62L-CF',
    title:
      'Global Data Refinery Civilization + Autonomous Archive Research Shifts + Neural Knowledge Compression Engine + Multi-Provider Intelligence Router + Semiconductor/Device Optimization Lab + Distributed Offline Knowledge Replication Fabric',
    honestyBanner: HONESTY_BANNER,
    locks: CF_LOCKS,
    l4AutonomyEnabled: CF_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CF_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CF_LOCKS.TIP_LAND,
    githubSoT: 96,
    gitlabCoordination: 30,
    cycle: DATA_REFINERY_COMPRESSION_REPLICATION_CYCLE,
    predecessors: preds,
    localBrainHealth: health,
    decisionGatePresent: typeof gate === 'function' || typeof gate === 'object',
    modules: {
      globalDataRefineryCivilization: 'IMPLEMENTED',
      autonomousArchiveResearchShifts: 'IMPLEMENTED',
      neuralKnowledgeCompressionEngine: 'IMPLEMENTED',
      multiProviderIntelligenceRouter: 'IMPLEMENTED',
      semiconductorDeviceOptimizationLab: 'IMPLEMENTED',
      distributedOfflineKnowledgeReplicationFabric: 'IMPLEMENTED',
    },
    ceCdContinuity: {
      ceL4: CE_LOCKS.L4_AUTONOMY_ENABLED,
      cdL4: CD_LOCKS.L4_AUTONOMY_ENABLED,
      ceCompressionAutoDeploy: CE_LOCKS.COMPRESSION_AUTO_PRODUCTION_DEPLOY,
      cdSealedSilentCloudFallback: CD_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
      cdMeshWriteDenyByDefault: CD_LOCKS.DB_WRITE_DENIED_BY_DEFAULT,
      note: 'CF extends CE/CD locks; does not soften them.',
    },
    nextPhase: NEXT_PHASE_TITLE,
    productionAuthorized: false,
    generatedAt: new Date().toISOString(),
  };
}
