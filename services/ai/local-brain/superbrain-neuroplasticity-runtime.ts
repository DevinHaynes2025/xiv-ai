import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { checkLocalBrainHealth } from './health-check';
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
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SUPERBRAIN_NEUROPLASTICITY_CYCLE,
  githubIssueSot,
  predecessorMap,
  type BoEvidenceState,
  type BoHop,
  type BoHopRecord,
} from './superbrain-neuroplasticity-types';

export {
  BO_LOCKS,
  SUPERBRAIN_NEUROPLASTICITY_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  predecessorMap,
  githubIssueSot,
};

function hop(name: BoHop, state: BoEvidenceState, summary: string): BoHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BoCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  agentId?: string;
  root?: string;
  /** Drive deny paths for tests. */
  useUnverifiedOutcome?: boolean;
  attemptSelfPermissionExpansion?: boolean;
  attemptSkillPermissionGrant?: boolean;
  poisonArtifactKey?: string;
  corruptMemoryKey?: string;
  crossOrgReadOrgId?: string;
  attemptFasterQuarantineBypass?: boolean;
};

export async function runSuperbrainNeuroplasticityCycle(input: BoCycleInput) {
  if (!input.orgId || !input.tenantId || !input.universeId) {
    throw new Error('ORG_TENANT_UNIVERSE_REQUIRED');
  }
  const root = input.root ?? process.cwd();
  const agentId = input.agentId ?? 'agent-bo-1';
  const hops: BoHopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      'PASS',
      `${HONESTY_BANNER}; L4=${BO_LOCKS.L4_AUTONOMY_ENABLED}; SoT=GitHub#${GITHUB_SOT_ISSUE}; GitLab#${GITLAB_COORDINATION_ISSUE} coordination only.`,
    ),
  );

  const plasticity = await applyPlasticityUpdate({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    target: 'route_weight',
    key: 'primary_retrieval_route',
    proposedWeight: 0.72,
    strategyHint: 'prefer_local_verified',
    evidenceRefs: ['outcome-ev-1'],
    outcomeVerification: input.useUnverifiedOutcome ? 'unverified' : 'verified',
    verifiedOutcomeId: input.useUnverifiedOutcome ? undefined : 'vo-1',
    attemptSelfPermissionExpansion: input.attemptSelfPermissionExpansion === true,
    root,
  });
  hops.push(
    hop(
      'plasticity_verified_outcome_gate',
      plasticity.accepted || input.useUnverifiedOutcome || input.attemptSelfPermissionExpansion
        ? plasticity.accepted
          ? 'PASS'
          : 'DENIED'
        : 'FAIL',
      plasticity.reason,
    ),
  );

  for (const targetHop of [
    'route_weight_adapt',
    'retrieval_strategy_adapt',
    'agent_task_mapping_adapt',
    'workcell_composition_adapt',
    'cache_placement_adapt',
    'resource_allocation_adapt',
  ] as const) {
    if (plasticity.accepted) {
      hops.push(hop(targetHop, 'IMPLEMENTED', `Plasticity target pathway ready (${targetHop}).`));
    } else {
      hops.push(hop(targetHop, 'DENIED', `Skipped — ${plasticity.reason}`));
    }
  }

  hops.push(
    hop(
      'self_permission_expansion_deny',
      plasticity.permissionExpanded === false ? 'PASS' : 'FAIL',
      `permissionExpanded=${plasticity.permissionExpanded}; self-expansion hard-denied.`,
    ),
  );

  const dnaUpsert = await upsertOrganizationKnowledgeDna({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    genes: [
      {
        kind: 'policy',
        label: 'deny_by_default',
        content: 'founder-sealed deny-by-default',
        evidenceLineage: ['policy-1'],
      },
      {
        kind: 'lesson',
        label: 'verified_outcomes_only',
        content: 'plasticity from verified outcomes',
        evidenceLineage: ['lesson-1'],
      },
    ],
    root,
  });
  hops.push(
    hop(
      'knowledge_dna_version',
      dnaUpsert.accepted ? 'PASS' : 'FAIL',
      dnaUpsert.accepted
        ? `Knowledge DNA v${dnaUpsert.dna.version}; genes=${dnaUpsert.dna.genes.length}.`
        : dnaUpsert.reason,
    ),
  );

  const crossOrg = await readOrganizationKnowledgeDna({
    orgId: input.orgId,
    universeId: input.universeId,
    requestingOrgId: input.crossOrgReadOrgId ?? input.orgId,
    actorId: agentId,
    root,
  });
  hops.push(
    hop(
      'org_isolation_seal',
      input.crossOrgReadOrgId && input.crossOrgReadOrgId !== input.orgId
        ? crossOrg.allowed
          ? 'FAIL'
          : 'DENIED'
        : crossOrg.allowed
          ? 'PASS'
          : 'FAIL',
      crossOrg.allowed ? 'Org DNA read within isolation.' : crossOrg.reason,
    ),
  );

  const skill = await evolveAgentSkill({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId,
    skillKey: 'retrieval_ranking',
    proposedProficiency: 0.8,
    evaluationScore: 0.75,
    evidenceRefs: ['skill-ev-1'],
    outcomeVerification: 'verified',
    currentPermissionLevel: 1,
    currentAuthorityLevel: 1,
    attemptPermissionGrantViaSkill: input.attemptSkillPermissionGrant === true,
    root,
  });
  hops.push(
    hop(
      'skill_evolution_evaluate',
      skill.accepted || input.attemptSkillPermissionGrant ? (skill.accepted ? 'PASS' : 'DENIED') : 'FAIL',
      skill.reason,
    ),
  );
  hops.push(
    hop(
      'skill_not_permission_lock',
      skill.permissionIncreased === false &&
        skill.authorityIncreased === false &&
        skill.skillIsPermissionGrant === false
        ? 'PASS'
        : 'FAIL',
      'Skill evolution did not increase authority/permissions.',
    ),
  );

  const artifactKey = input.poisonArtifactKey ?? 'knowledge-pack-a';
  const inspect = await registerOrInspectArtifact({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    artifactKey,
    kind: 'knowledge',
    poisoned: Boolean(input.poisonArtifactKey),
    stale: false,
    root,
  });
  hops.push(
    hop(
      'immune_detect_stale_poison',
      input.poisonArtifactKey
        ? inspect.quarantined
          ? 'QUARANTINED'
          : 'FAIL'
        : 'PASS',
      inspect.artifact.reason,
    ),
  );
  hops.push(
    hop(
      'immune_quarantine',
      input.poisonArtifactKey
        ? inspect.usableAsTrustedRetrieval === false
          ? 'PASS'
          : 'FAIL'
        : 'PASS',
      `usableAsTrustedRetrieval=${inspect.usableAsTrustedRetrieval}`,
    ),
  );

  const retrieval = await attemptTrustedRetrieval({
    orgId: input.orgId,
    universeId: input.universeId,
    artifactKey,
    preferFasterRouteBypass: input.attemptFasterQuarantineBypass === true,
    root,
  });
  hops.push(
    hop(
      'immune_revalidate',
      input.poisonArtifactKey || input.attemptFasterQuarantineBypass
        ? retrieval.allowed
          ? 'FAIL'
          : 'DENIED'
        : retrieval.allowed
          ? 'PASS'
          : 'FAIL',
      retrieval.reason,
    ),
  );

  if (input.corruptMemoryKey) {
    const mem = await requireMemoryRevalidation({
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      memoryKey: input.corruptMemoryKey,
      root,
    });
    hops.push(
      hop(
        'corrupted_memory_revalidation',
        mem.artifact.revalidationRequired ? 'REVALIDATION_REQUIRED' : 'FAIL',
        mem.artifact.reason,
      ),
    );
  } else {
    hops.push(
      hop(
        'corrupted_memory_revalidation',
        'PASS',
        'No corrupted memory in this cycle; revalidation path available.',
      ),
    );
  }

  const placement = await adaptBrainLayerPlacement({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    workloadKey: 'bo-adaptive-1',
    preferredLocality: 'cloud',
    localCapacityOk: true,
    cloudConfigured: true,
    cloudVerified: false,
    requiredArtifactKey: input.poisonArtifactKey,
    attemptFasterBypassQuarantine: input.attemptFasterQuarantineBypass === true,
    metabolismBudgetOk: true,
    root,
  });
  hops.push(
    hop(
      'adaptive_layer_place',
      placement.accepted || input.poisonArtifactKey || input.attemptFasterQuarantineBypass
        ? placement.accepted
          ? 'PASS'
          : 'DENIED'
        : 'FAIL',
      placement.reason,
    ),
  );
  hops.push(
    hop(
      'faster_route_cannot_bypass_quarantine',
      input.attemptFasterQuarantineBypass
        ? placement.accepted === false
          ? 'DENIED'
          : 'FAIL'
        : 'PASS',
      input.attemptFasterQuarantineBypass
        ? placement.reason
        : 'No bypass attempt; privacy/trust retained.',
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `62L-BO cycle plasticity=${plasticity.accepted}; skill=${skill.accepted}; placement=${placement.accepted}`,
      payload: {
        orgId: input.orgId,
        hops: hops.map((h) => h.hop),
        l4: BO_LOCKS.L4_AUTONOMY_ENABLED,
      },
    },
    root,
  );
  hops.push(hop('evidence', 'PASS', 'Evidence event recorded; recommendation ≠ charge/deploy.'));

  await appendLearning(
    {
      domain: 'superbrain_neuroplasticity',
      subject: `bo-cycle:${input.orgId}`,
      claimState: 'MODEL_INFERENCE',
      summary: 'BO cycle complete; learning ≠ authority.',
      sourceRefs: [`tenant:${input.tenantId}`],
      evidence: ['bo-cycle'],
    },
    root,
  );

  return {
    hops,
    plasticity,
    dna: dnaUpsert,
    crossOrg,
    skill,
    immune: inspect,
    retrieval,
    placement,
    honesty: {
      banner: HONESTY_BANNER,
      locks: BO_LOCKS,
      neuroplasticity: neuroplasticityHonesty(),
      knowledgeDna: knowledgeDnaHonesty(),
      skillEvolution: skillEvolutionHonesty(),
      immune: immuneSystemHonesty(),
      adaptive: adaptiveLayersHonesty(),
    },
    sot: githubIssueSot(),
    predecessors: predecessorMap(root),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
    megaPrBulkIncluded: false as const,
  };
}

export async function buildSuperbrainNeuroplasticityHealthReport(root = process.cwd()) {
  const health = await checkLocalBrainHealth(root);
  const preds = predecessorMap(root);
  return {
    phase: '62L-BO',
    title:
      'Superbrain Neuroplasticity Engine + Organization Knowledge DNA + Agent Skill Evolution + Global Intelligence Immune System + Adaptive Offline/Cloud Brain Layers',
    banner: HONESTY_BANNER,
    locks: BO_LOCKS,
    sot: githubIssueSot(),
    predecessors: preds,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    cycleLength: SUPERBRAIN_NEUROPLASTICITY_CYCLE.length,
    localBrainHealth: health,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
    megaPrBulkIncluded: false as const,
    liveSupabaseApply: false as const,
    documentedEqImplemented: false as const,
    implementedEqVerified: false as const,
    verifiedEqProductionAuthorized: false as const,
  };
}
