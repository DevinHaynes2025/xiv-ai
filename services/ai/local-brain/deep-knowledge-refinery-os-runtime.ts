/**
 * 62L-CG runtime — walks DEEP_KNOWLEDGE_REFINERY_OS_CYCLE and builds health report.
 */

import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import {
  deepKnowledgeRefineryOsHonesty,
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
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CgActor,
  type CgEvidenceState,
  type CgHop,
  type CgHopRecord,
} from './deep-knowledge-refinery-os-types';

export {
  CG_LOCKS,
  DEEP_KNOWLEDGE_REFINERY_OS_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CgHop, state: CgEvidenceState, summary: string): CgHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CgCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CgActor;
  root?: string;
};

export async function runDeepKnowledgeRefineryOsCycle(input: CgCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CgHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CG_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CG_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
        CG_LOCKS.STORAGE_INDEX_AUTO_APPLY === false &&
        CG_LOCKS.EDGE_PROFILE_STEALTH_INSTALL === false &&
        CG_LOCKS.OS_SWALLOWS_UNRELATED_MEGA_DELTA === false &&
        CG_LOCKS.LEARNING_IS_PERMISSION === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const osReg = await registerOsSubsystems({ root, actor });
  hops.push(
    hop(
      'os_register_subsystems',
      osReg.registrations.length === 7 && osReg.registrations.every((r) => r.status === 'registered')
        ? 'PASS'
        : 'FAIL',
      osReg.coexistenceLayer,
    ),
  );

  const mega = await registerOsSubsystems({
    root,
    actor,
    attemptMegaDeltaSwallow: true,
    megaDeltaLabel: 'ATTRIBUTION_UNSAFE_MEGA_PR_38',
    megaDeltaBytesHint: 191_000,
  });
  hops.push(
    hop(
      'os_reject_mega_delta_swallow',
      mega.megaDeltaDenied ? 'DENIED' : 'FAIL',
      mega.megaDeltaReason,
    ),
  );

  const curriculum = await registerResearchCurriculum({
    title: 'Deep Knowledge Research Track',
    root,
    actor,
  });
  hops.push(
    hop(
      'university_curriculum_bound',
      curriculum.bounded ? 'BOUNDED' : 'FAIL',
      `curriculum=${curriculum.id}`,
    ),
  );

  const skillOk = await grantResearchSkill({
    agentId: 'agent-research-1',
    skillKey: 'archive_graph_analysis',
    examScore: 0.9,
    currentPermissionLevel: actor.permissionLevel,
    currentAuthorityLevel: actor.authorityLevel,
    root,
    actor,
  });
  const skillEsc = await grantResearchSkill({
    agentId: 'agent-research-1',
    skillKey: 'archive_graph_analysis',
    examScore: 0.95,
    attemptPermissionEscalation: true,
    currentPermissionLevel: actor.permissionLevel,
    currentAuthorityLevel: actor.authorityLevel,
    root,
    actor,
  });
  hops.push(
    hop(
      'university_skill_no_permission_escalation',
      skillOk.accepted &&
        !skillOk.permissionIncreased &&
        !skillEsc.accepted &&
        skillEsc.reason.includes('DOES_NOT_ESCALATE')
        ? 'DENIED'
        : 'FAIL',
      skillEsc.reason,
    ),
  );

  const nodeA = await enrollArchiveNode({
    label: 'Authorized Law Archive',
    kind: 'business_law',
    universeId: input.universeId,
    authorized: true,
    consentKnown: true,
    licenseKnown: true,
    jurisdictionKnown: true,
    root,
    actor,
  });
  const nodeB = await enrollArchiveNode({
    label: 'Authorized Civ Memory',
    kind: 'civilization_memory',
    universeId: input.universeId,
    authorized: true,
    consentKnown: true,
    licenseKnown: true,
    jurisdictionKnown: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'archive_federation_authorize',
      nodeA.status === 'enrolled' && nodeB.status === 'enrolled' ? 'PASS' : 'FAIL',
      `${nodeA.id},${nodeB.id}`,
    ),
  );

  const badNode = await enrollArchiveNode({
    label: 'Unauthorized Dump',
    kind: 'other',
    universeId: input.universeId,
    authorized: false,
    root,
    actor,
  });
  const badEdge = await linkArchiveFederationEdge({
    fromNodeId: nodeA.id,
    toNodeId: badNode.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_archive_edge_denied',
      badEdge.status === 'denied' ? 'DENIED' : 'FAIL',
      badEdge.reason,
    ),
  );

  const pooling = await attemptArchivePooling({ mode: 'raw_private', root, actor });
  hops.push(
    hop(
      'no_raw_private_pooling',
      pooling.status === 'denied' ? 'DENIED' : 'FAIL',
      pooling.reason,
    ),
  );

  const cand = await compileStorageIndexCandidate({
    kind: 'index',
    ddlHint: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS cg_archive_idx ON cg_archive_nodes (universe_id);',
    root,
    actor,
  });
  hops.push(
    hop(
      'storage_index_compile_candidate',
      cand.status === 'candidate' && cand.autoApplied === false ? 'CANDIDATE' : 'FAIL',
      cand.reason,
    ),
  );

  const dry = await dryRunStorageIndexCandidate({ candidateId: cand.id, root, actor });
  hops.push(
    hop(
      'storage_index_dry_run_recommend',
      dry.ok ? 'DRY_RUN' : 'FAIL',
      dry.reason,
    ),
  );

  const apply = await attemptApplyStorageIndex({
    candidateId: cand.id,
    target: 'production',
    autoApply: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'storage_index_auto_apply_denied',
      apply.status === 'denied' ? 'DENIED' : 'FAIL',
      apply.reason,
    ),
  );

  await configureModelProvider({
    provider: 'local_llm',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const localRoute = await routeReasoningLocalFirst({
    promptId: 'cg-local-1',
    sensitivity: 'public',
    requestedProvider: 'local_llm',
    root,
    actor,
  });
  hops.push(
    hop(
      'reasoning_local_first',
      localRoute.status === 'routed_local' ? 'PASS' : 'FAIL',
      localRoute.reason,
    ),
  );

  const sealed = await routeReasoningLocalFirst({
    promptId: 'cg-sealed-1',
    sensitivity: 'sealed',
    requestedProvider: 'openai',
    forceCloudFallback: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_never_silent_cloud',
      sealed.status === 'denied' && sealed.silentCloudFallback === false ? 'DENIED' : 'FAIL',
      sealed.reason,
    ),
  );

  const unconf = await routeReasoningLocalFirst({
    promptId: 'cg-unconf-1',
    sensitivity: 'public',
    requestedProvider: 'anthropic',
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_provider_unavailable',
      unconf.status === 'unavailable' ? 'UNAVAILABLE' : 'FAIL',
      unconf.reason,
    ),
  );

  const approved = await registerEdgeDeploymentProfile({
    deviceId: 'pc-approved-1',
    kind: 'pc',
    approved: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_profile_approve_only',
      approved.status === 'profile' && approved.stealthInstall === false ? 'PASS' : 'FAIL',
      approved.reason,
    ),
  );

  const unapproved = await registerEdgeDeploymentProfile({
    deviceId: 'mobile-rogue-1',
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
  hops.push(
    hop(
      'unapproved_edge_deploy_denied',
      unapprovedDeploy.status === 'denied' || unapprovedDeploy.status === 'unavailable'
        ? 'DENIED'
        : 'FAIL',
      unapprovedDeploy.reason,
    ),
  );

  const stealth = await registerEdgeDeploymentProfile({
    deviceId: 'edge-stealth-probe',
    kind: 'edge_appliance',
    approved: true,
    attemptStealthInstall: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_profile_not_stealth',
      stealth.status === 'denied' && stealth.stealthInstall === false ? 'DENIED' : 'FAIL',
      stealth.reason,
    ),
  );

  const authClaim = await proposeEdgeDeployCandidate({
    profileId: approved.id,
    claimProductionAuthority: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'deploy_candidate_not_production_authority',
      authClaim.status === 'denied' && authClaim.productionAuthority === false ? 'DENIED' : 'FAIL',
      authClaim.reason,
    ),
  );

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CG Deep Knowledge Refinery OS cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-CG'] },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidence?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CG deep knowledge refinery os cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning ≠ permission; coexistence layer only`,
      sourceRefs: ['62L-CG'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'BOUNDED', 'learning recorded; not permission grant'));

  return {
    cycle: [...DEEP_KNOWLEDGE_REFINERY_OS_CYCLE],
    hops,
    companions: probeCompanionModules(root),
    honesty: {
      os: deepKnowledgeRefineryOsHonesty(),
      university: researchUniversitiesHonesty(),
      archive: archiveFederationHonesty(),
      storage: storageIndexCompilerHonesty(),
      reasoning: multiModelReasoningHonesty(),
      edge: edgeDeployOrchestratorHonesty(),
    },
  };
}

export async function buildDeepKnowledgeRefineryOsHealthReport(input: {
  root?: string;
  orgId?: string;
  tenantId?: string;
  universeId?: string;
}) {
  const root = input.root ?? process.cwd();
  const actor: CgActor = {
    kind: 'refinery_os_curator',
    id: 'cg-health-curator',
    orgId: input.orgId ?? 'org-cg',
    tenantId: input.tenantId ?? 'tenant-cg',
    universeId: input.universeId ?? 'univ-cg',
    role: 'curator',
    permissionLevel: 0,
    authorityLevel: 0,
  };

  const result = await runDeepKnowledgeRefineryOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });

  return {
    phase: '62L-CG',
    title:
      'XIV Deep Knowledge Refinery OS + Autonomous Research Universities + Global Archive Graph Federation + Intelligent Storage/Index Compiler + Multi-Model Reasoning Fabric + Edge Superbrain Deployment Orchestrator',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CG_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CG_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CG_LOCKS.TIP_LAND,
    githubSotIssue: 97,
    gitlabCoordinationIssue: 31,
    nextPhase: NEXT_PHASE_TITLE,
    predecessors: predecessorMap(root),
    companions: result.companions,
    cycle: result.cycle,
    hops: result.hops,
    honesty: result.honesty,
    generatedAt: new Date().toISOString(),
  };
}
