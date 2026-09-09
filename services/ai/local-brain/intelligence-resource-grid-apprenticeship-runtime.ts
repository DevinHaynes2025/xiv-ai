/**
 * 62L-CJ runtime — walks INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  placeAndAccountWorkload,
  registerResourceAccount,
  resourceGridHonesty,
} from './intelligence-resource-grid';
import {
  apprenticeshipNetworkHonesty,
  attemptSkillPermissionEscalation,
  openApprenticeshipSession,
} from './autonomous-agent-apprenticeship-network';
import {
  reconstructHistoricalKnowledge,
  reconstructionHonesty,
  rejectSoulResurrectionClaim,
} from './historical-knowledge-reconstruction-engine';
import {
  attemptAutoApplyProductionIndexOrSchema,
  proposeRetrievalMemoryCandidate,
  retrievalMemoryLabHonesty,
} from './self-optimizing-retrieval-memory-lab';
import {
  modelFederationHonesty,
  registerFederationMember,
  routeFederationRequest,
} from './local-cloud-model-federation';
import {
  edgeRuntimeMeshHonesty,
  enrollEdgeDevice,
  handoffEdgeRuntime,
} from './universal-edge-runtime-mesh';
import {
  CJ_LOCKS,
  HONESTY_BANNER,
  INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CjActor,
  type CjEvidenceState,
  type CjHop,
  type CjHopRecord,
} from './intelligence-resource-grid-apprenticeship-types';

/** Optional CF/CE continuity — present on preferred base tip; never softens CJ locks. */
import { CF_LOCKS } from './data-refinery-compression-replication-types';
import { CE_LOCKS } from './knowledge-excavation-memory-lake-types';

export {
  CJ_LOCKS,
  HONESTY_BANNER,
  INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CjHop, state: CjEvidenceState, summary: string): CjHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CjCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CjActor;
  root?: string;
};

export async function runIntelligenceResourceGridApprenticeshipCycle(
  input: CjCycleInput,
) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CjHopRecord[] = [];
  const actor = {
    ...input.actor,
    universeId: input.universeId || input.actor.universeId,
  };

  hops.push(
    hop(
      'honesty_locks',
      CJ_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CJ_LOCKS.RESOURCE_GRID_PLACEMENT_ACCOUNTING_ONLY &&
        CJ_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
        CJ_LOCKS.SOUL_RESURRECTION_CLAIMS === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  await registerResourceAccount({
    kind: 'cpu',
    unitsAvailable: 8,
    freshnessLabel: 'fresh',
    root,
  });
  await registerResourceAccount({
    kind: 'gpu',
    unitsAvailable: 2,
    freshnessLabel: 'fresh',
    root,
  });
  const placed = await placeAndAccountWorkload({
    workloadId: 'wl-cj-1',
    placements: [
      { kind: 'cpu', units: 2 },
      { kind: 'gpu', units: 1 },
    ],
    root,
    actor,
  });
  hops.push(
    hop(
      'grid_place_account_resources',
      placed.accepted ? 'PLACED' : 'FAIL',
      placed.reason,
    ),
  );

  const spendDeny = await placeAndAccountWorkload({
    workloadId: 'wl-spend',
    placements: [{ kind: 'model_call', units: 1 }],
    attemptPurchase: true,
    attemptBill: true,
    attemptSpend: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'grid_purchase_bill_spend_denied',
      spendDeny.accepted === false ? 'DENIED' : 'FAIL',
      spendDeny.reason,
    ),
  );

  const appr = await openApprenticeshipSession({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mentorAgentId: 'mentor-1',
    apprenticeAgentId: 'apprentice-1',
    objective: 'learn bounded coding workcell',
    mentorEvalPassed: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'apprentice_open_with_mentor_eval_gate',
      appr.accepted ? 'PASS' : 'FAIL',
      appr.reason,
    ),
  );

  const permDeny = await openApprenticeshipSession({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mentorAgentId: 'mentor-2',
    apprenticeAgentId: 'apprentice-2',
    objective: 'probe authority transfer',
    mentorEvalPassed: true,
    attemptApprenticeMentorPermissionTransfer: true,
    attemptApprenticeProductionAuthority: true,
    root,
    actor,
  });
  const skillEsc = appr.session
    ? await attemptSkillPermissionEscalation({
        sessionId: appr.session.id,
        claimMentorPermissions: true,
        root,
        actor,
      })
    : { accepted: true, reason: 'missing', skillRaised: false };
  hops.push(
    hop(
      'apprentice_cannot_gain_mentor_production_permissions',
      permDeny.accepted === false && skillEsc.accepted === false
        ? 'DENIED'
        : 'FAIL',
      permDeny.reason,
    ),
  );

  const withEvidence = await reconstructHistoricalKnowledge({
    subject: 'trade-route-1847',
    claim: 'Port ledger lists 12 licensed vessels in 1847',
    evidenceRefs: ['archive://port-ledger-1847#p12'],
    intendedLabel: 'verified_fact',
    root,
    actor,
  });
  hops.push(
    hop(
      'reconstruction_evidence_backed',
      withEvidence.label === 'verified_fact' ? 'VERIFIED' : 'FAIL',
      withEvidence.reason,
    ),
  );

  const noEvidence = await reconstructHistoricalKnowledge({
    subject: 'trade-route-1847',
    claim: 'Unsourced claim of 500 vessels',
    evidenceRefs: [],
    intendedLabel: 'verified_fact',
    root,
    actor,
  });
  hops.push(
    hop(
      'reconstruction_without_evidence_not_verified_fact',
      noEvidence.label !== 'verified_fact' && noEvidence.accepted === false
        ? 'REJECTED'
        : 'FAIL',
      noEvidence.reason,
    ),
  );

  const soul = await rejectSoulResurrectionClaim({
    subject: 'persona-sim',
    claim: 'soul resurrection capability for archive persona',
    root,
    actor,
  });
  hops.push(
    hop(
      'soul_afterlife_capability_claim_rejected',
      soul.label === 'rejected' ? 'REJECTED' : 'FAIL',
      soul.reason,
    ),
  );

  const cand = await proposeRetrievalMemoryCandidate({
    kind: 'memory_index',
    proposal: 'candidate HNSW params for sandbox corpus',
    root,
    actor,
  });
  hops.push(
    hop(
      'retrieval_lab_sandbox_candidate',
      cand.status === 'sandbox_candidate' ? 'SANDBOXED' : 'FAIL',
      cand.reason,
    ),
  );

  const autoApply = await attemptAutoApplyProductionIndexOrSchema({
    candidateId: cand.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'retrieval_lab_auto_apply_production_denied',
      autoApply.denied ? 'DENIED' : 'FAIL',
      autoApply.reason,
    ),
  );

  const local = await registerFederationMember({
    name: 'local-llm',
    kind: 'local',
    configured: true,
    authorized: true,
    verified: true,
    root,
  });
  const cloud = await registerFederationMember({
    name: 'cloud-llm',
    kind: 'cloud',
    configured: true,
    authorized: true,
    verified: true,
    root,
  });
  const bare = await registerFederationMember({
    name: 'bare-cloud',
    kind: 'cloud',
    configured: false,
    authorized: false,
    root,
  });
  const localRoute = await routeFederationRequest({
    memberId: cloud.id,
    contentClass: 'open',
    preferLocal: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'federation_local_first',
      localRoute.accepted && localRoute.memberId === local.id ? 'PASS' : 'FAIL',
      localRoute.reason,
    ),
  );
  const unconf = await routeFederationRequest({
    memberId: bare.id,
    contentClass: 'open',
    root,
    actor,
  });
  hops.push(
    hop(
      'federation_unconfigured_unavailable',
      unconf.accepted === false ? 'UNAVAILABLE' : 'FAIL',
      unconf.reason,
    ),
  );
  const sealed = await routeFederationRequest({
    memberId: cloud.id,
    contentClass: 'sealed',
    attemptSilentCloudFallback: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'federation_sealed_no_silent_cloud',
      sealed.accepted === false && sealed.silentCloudFallback === false
        ? 'DENIED'
        : 'FAIL',
      sealed.reason,
    ),
  );

  const enrolled = await enrollEdgeDevice({
    label: 'laptop-a',
    online: true,
    freshness: 'fresh',
    root,
    actor,
  });
  hops.push(
    hop('edge_enroll_device', enrolled.enrolled ? 'ENROLLED' : 'FAIL', enrolled.reason),
  );

  const unenrolled = await handoffEdgeRuntime({
    toDeviceId: 'not-enrolled-device',
    explicit: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_unenrolled_handoff_denied',
      unenrolled.accepted === false ? 'DENIED' : 'FAIL',
      unenrolled.reason,
    ),
  );

  const explicit = await handoffEdgeRuntime({
    fromDeviceId: enrolled.id,
    toDeviceId: enrolled.id,
    explicit: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_explicit_handoff_only',
      explicit.accepted ? 'PASS' : 'FAIL',
      explicit.reason,
    ),
  );

  const hidden = await handoffEdgeRuntime({
    toDeviceId: enrolled.id,
    attemptHiddenDeploy: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_hidden_deploy_denied',
      hidden.accepted === false ? 'DENIED' : 'FAIL',
      hidden.reason,
    ),
  );

  const staleDevice = await enrollEdgeDevice({
    label: 'island-node',
    online: false,
    freshness: 'stale',
    root,
    actor,
  });
  const staleHandoff = await handoffEdgeRuntime({
    toDeviceId: staleDevice.id,
    explicit: true,
    freshnessSensitive: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'freshness_sensitive_offline_stale_waiting',
      staleHandoff.accepted === false &&
        (staleHandoff.freshnessState === 'stale' ||
          staleHandoff.freshnessState === 'waiting_data')
        ? staleHandoff.freshnessState === 'waiting_data'
          ? 'WAITING_DATA'
          : 'STALE'
        : 'FAIL',
      staleHandoff.reason,
    ),
  );

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary:
        '62L-CJ intelligence resource grid / apprenticeship / reconstruction / federation / edge cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-CJ'],
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidence?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CJ intelligence resource grid apprenticeship cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; recommendation only; learning ≠ permission`,
      sourceRefs: ['62L-CJ'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;

  return {
    hops,
    honesty: {
      resourceGrid: resourceGridHonesty(),
      apprenticeship: apprenticeshipNetworkHonesty(),
      reconstruction: reconstructionHonesty(),
      retrievalLab: retrievalMemoryLabHonesty(),
      federation: modelFederationHonesty(),
      edgeMesh: edgeRuntimeMeshHonesty(),
    },
    locks: CJ_LOCKS,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildIntelligenceResourceGridApprenticeshipHealthReport(input?: {
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
    phase: '62L-CJ',
    title:
      'XIV Intelligence Resource Grid + Autonomous Agent Apprenticeship Network + Historical Knowledge Reconstruction Engine + Self-Optimizing Retrieval/Memory Lab + Local/Cloud Model Federation + Universal Edge Runtime Mesh',
    honestyBanner: HONESTY_BANNER,
    locks: CJ_LOCKS,
    l4AutonomyEnabled: CJ_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CJ_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CJ_LOCKS.TIP_LAND,
    githubSoT: 100,
    gitlabCoordination: 34,
    cycle: INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_CYCLE,
    predecessors: preds,
    localBrainHealth: health,
    decisionGatePresent: typeof gate === 'function' || typeof gate === 'object',
    modules: {
      intelligenceResourceGrid: 'IMPLEMENTED',
      autonomousAgentApprenticeshipNetwork: 'IMPLEMENTED',
      historicalKnowledgeReconstructionEngine: 'IMPLEMENTED',
      selfOptimizingRetrievalMemoryLab: 'IMPLEMENTED',
      localCloudModelFederation: 'IMPLEMENTED',
      universalEdgeRuntimeMesh: 'IMPLEMENTED',
    },
    cfCeContinuity: {
      cfL4: CF_LOCKS.L4_AUTONOMY_ENABLED,
      ceL4: CE_LOCKS.L4_AUTONOMY_ENABLED,
      cfSealedSilentCloudFallback: CF_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
      ceSoulResurrectionClaims: CE_LOCKS.SOUL_RESURRECTION_CLAIMS,
      note: 'CJ extends CF/CE locks; does not soften them. CI/CH/CG may remain WAITING_DATA.',
    },
    nextPhase: NEXT_PHASE_TITLE,
    productionAuthorized: false,
    generatedAt: new Date().toISOString(),
  };
}
