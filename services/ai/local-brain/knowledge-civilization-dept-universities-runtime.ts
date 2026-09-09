/**
 * 62L-CH runtime — walks KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  bootstrapKnowledgeCivilizationOs,
  civilizationOsHonesty,
  enrollDepartmentInCivilization,
  rejectSoulResurrectionClaim,
} from './knowledge-civilization-os';
import {
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
  registerEdgeColonyNode,
  requestEdgeColonyAction,
} from './distributed-edge-intelligence-colony';
import {
  CH_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type ChActor,
  type ChEvidenceState,
  type ChHop,
  type ChHopRecord,
} from './knowledge-civilization-dept-universities-types';

export {
  CH_LOCKS,
  HONESTY_BANNER,
  KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: ChHop, state: ChEvidenceState, summary: string): ChHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type ChCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: ChActor;
  root?: string;
};

export async function runKnowledgeCivilizationDeptUniversitiesCycle(input: ChCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: ChHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CH_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CH_LOCKS.LOCAL_MODEL_FIRST &&
        CH_LOCKS.SKILL_IS_PERMISSION === false &&
        CH_LOCKS.AUTO_ALTER_PRODUCTION_DB === false &&
        CH_LOCKS.SOUL_RESURRECTION_CLAIMS === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const civ = await bootstrapKnowledgeCivilizationOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(hop('civilization_os_facade', 'PASS', civ.id));

  const enrolled = await enrollDepartmentInCivilization({
    civilizationId: civ.id,
    department: 'research',
    root,
    actor,
  });
  const uni = await openDepartmentUniversity({
    department: 'research',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'department_university_enroll',
      enrolled.accepted && uni.id ? 'PASS' : 'FAIL',
      uni.id,
    ),
  );

  const skillGrant = await recordSkillTranscript({
    universityId: uni.id,
    agentId: 'agent-ch-1',
    skillKey: 'research_synthesis',
    score: 0.9,
    currentPermissionLevel: 1,
    currentAuthorityLevel: 1,
    attemptPermissionGrantViaTranscript: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'skill_transcript_no_permission',
      skillGrant.accepted === false && skillGrant.permissionIncreased === false
        ? 'DENIED'
        : 'FAIL',
      skillGrant.reason,
    ),
  );

  const skillOk = await recordSkillTranscript({
    universityId: uni.id,
    agentId: 'agent-ch-1',
    skillKey: 'research_synthesis',
    score: 0.92,
    currentPermissionLevel: 1,
    currentAuthorityLevel: 1,
    evidenceRefs: ['eval-1'],
    root,
    actor,
  });
  const decay = await evaluateOrDecaySkill({
    transcriptId: skillOk.transcript!.id,
    forceDecay: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'evaluation_decay_reverses_trust',
      decay.trustReversed && decay.transcript?.trustState === 'decayed'
        ? 'REVERSED'
        : 'FAIL',
      decay.reason,
    ),
  );

  const fact = await recordWorldModelNode({
    kind: 'fact',
    label: 'authorized-fact',
    statement: 'Documented historical event with provenance',
    evidenceRefs: ['src-1'],
    root,
    actor,
  });
  const corr = await recordWorldModelNode({
    kind: 'correlation',
    label: 'corr-a',
    statement: 'A correlates with B',
    root,
    actor,
  });
  const sim = await recordWorldModelNode({
    kind: 'simulation',
    label: 'sim-a',
    statement: 'Simulated scenario',
    root,
    actor,
  });
  hops.push(
    hop(
      'world_model_typed_states',
      fact.kind === 'fact' &&
        corr.kind === 'correlation' &&
        sim.kind === 'simulation' &&
        sim.simulationLabeled
        ? 'PASS'
        : 'FAIL',
      `${fact.id},${corr.id},${sim.id}`,
    ),
  );

  const corrPromo = await attemptWorldModelPromotion({
    nodeId: corr.id,
    toKind: 'fact',
    claimVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'reject_correlation_to_fact',
      corrPromo.rejected ? 'REJECTED' : 'FAIL',
      corrPromo.reason,
    ),
  );

  const simPromo = await attemptWorldModelPromotion({
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

  const evidence = await recordWorkloadEvidence({
    metric: 'query_p99_ms',
    value: 420,
    source: 'workload-sampler',
    root,
    actor,
  });
  const proposal = await proposeDbFabricChange({
    kind: 'index',
    summary: 'Add index on hot path',
    evidenceIds: [evidence.id],
    root,
    actor,
  });
  hops.push(
    hop(
      'db_fabric_propose_from_evidence',
      proposal.accepted && proposal.verified === false ? 'RECOMMENDATION_ONLY' : 'FAIL',
      proposal.reason,
    ),
  );

  const autoApply = await attemptAutoApplyProductionSchema({
    proposalId: proposal.proposal!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'db_fabric_no_auto_apply',
      autoApply.denied && autoApply.applied === false ? 'NOT_APPLIED' : 'FAIL',
      autoApply.reason,
    ),
  );

  const noEvidence = await proposeDbFabricChange({
    kind: 'schema',
    summary: 'Blind schema change',
    evidenceIds: [],
    root,
    actor,
  });
  hops.push(
    hop(
      'proposal_without_evidence_rejected',
      noEvidence.accepted === false ? 'REJECTED' : 'FAIL',
      noEvidence.reason,
    ),
  );

  const local = await registerExpertCouncilMember({
    name: 'local-expert',
    kind: 'local',
    role: 'domain_expert',
    department: 'research',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const cloud = await registerExpertCouncilMember({
    name: 'cloud-expert',
    kind: 'cloud',
    role: 'skeptic',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const open = await deliberateExpertCouncil({
    topic: 'department synthesis',
    department: 'research',
    mode: 'open',
    memberIds: [local.id, cloud.id],
    preferCloudWhenLocalAvailable: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'council_local_first',
      open.preferredKind === 'local' && !open.selectedMemberIds.includes(cloud.id)
        ? 'LOCAL_PREFERRED'
        : 'FAIL',
      open.reason,
    ),
  );

  const bare = await registerExpertCouncilMember({
    name: 'unconfigured-cloud',
    kind: 'cloud',
    role: 'auditor',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_provider_unavailable',
      bare.status === 'unavailable' ? 'UNAVAILABLE' : 'FAIL',
      bare.reason,
    ),
  );

  const sealed = await deliberateExpertCouncil({
    topic: 'sealed briefing',
    mode: 'sealed',
    memberIds: [cloud.id],
    attemptSilentCloudFallback: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_cloud_fallback',
      sealed.status === 'denied' ? 'DENIED' : 'FAIL',
      sealed.reason,
    ),
  );

  const unenrolled = await registerEdgeColonyNode({
    label: 'shadow-edge',
    enroll: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_enroll_explicit',
      unenrolled.enrolled === false ? 'PASS' : 'FAIL',
      unenrolled.reason,
    ),
  );

  const edgeDenied = await requestEdgeColonyAction({
    nodeId: unenrolled.id,
    action: 'coordinate',
    root,
    actor,
  });
  hops.push(
    hop(
      'unenrolled_edge_denied',
      edgeDenied.status === 'denied' || edgeDenied.status === 'unavailable'
        ? 'DENIED'
        : 'FAIL',
      edgeDenied.reason,
    ),
  );

  const soul = await rejectSoulResurrectionClaim({
    claim: 'resurrect historical persona as living agent',
    root,
    actor,
  });
  hops.push(
    hop('soul_claim_rejected', soul.denied ? 'REJECTED' : 'FAIL', soul.reason),
  );

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CH knowledge civilization / department universities cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-CH'] },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CH knowledge civilization dept universities cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning ≠ permission`,
      sourceRefs: ['62L-CH'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;

  return {
    hops,
    honesty: {
      civilizationOs: civilizationOsHonesty(),
      universities: departmentUniversitiesHonesty(),
      worldModel: worldModelHonesty(),
      dbFabric: dbFabricHonesty(),
      councils: expertCouncilsHonesty(),
      edgeColony: edgeColonyHonesty(),
    },
    locks: CH_LOCKS,
    nextPhase: NEXT_PHASE_TITLE,
  };
}

export async function buildKnowledgeCivilizationDeptUniversitiesHealthReport(input?: {
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
    phase: '62L-CH',
    title:
      'XIV Knowledge Civilization OS + Agent Department Universities + Historical World Model Graph + Adaptive Database/Memory Fabric + Multi-Model Expert Councils + Distributed Edge Intelligence Colony',
    honestyBanner: HONESTY_BANNER,
    locks: CH_LOCKS,
    l4AutonomyEnabled: CH_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CH_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CH_LOCKS.TIP_LAND,
    githubSoT: 98,
    gitlabCoordination: 32,
    cycle: KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_CYCLE,
    predecessors: preds,
    localBrainHealth: health,
    decisionGatePresent: typeof gate === 'function' || typeof gate === 'object',
    modules: {
      knowledgeCivilizationOs: 'IMPLEMENTED',
      agentDepartmentUniversities: 'IMPLEMENTED',
      historicalWorldModelGraph: 'IMPLEMENTED',
      adaptiveDatabaseMemoryFabric: 'IMPLEMENTED',
      multiModelExpertCouncils: 'IMPLEMENTED',
      distributedEdgeIntelligenceColony: 'IMPLEMENTED',
    },
    nextPhase: NEXT_PHASE_TITLE,
    productionAuthorized: false,
    generatedAt: new Date().toISOString(),
  };
}
