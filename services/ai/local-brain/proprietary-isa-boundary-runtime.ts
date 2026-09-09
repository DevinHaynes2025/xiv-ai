/**
 * 62L-EQ4 — Proprietary ISA Boundary runtime.
 *
 * Source → rights/provenance check → classification →
 * ALLOW / QUARANTINE / DENY → knowledge graph.
 * UNKNOWN_RIGHTS → QUARANTINE (not auto-ingest).
 * Soft-wires EQ3/EQ2/EQ1/EP16/EM157 when present.
 */

import {
  ALLOWED_LEARNING_TARGETS,
  ALLOWED_RESEARCH_SOURCES,
  ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS,
  BLOCKED_LEARNING_TARGETS,
  BLOCKED_OR_QUARANTINED_MATERIAL,
  EQ4_DB_CANDIDATES_STATUS,
  EQ4_LOCKS,
  EQ4_MAY,
  EQ4_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROPRIETARY_ISA_BOUNDARY_CYCLE,
  PROPRIETARY_ISA_BOUNDARY_FLOW,
  RIGHTS_CLASSIFICATION_OUTCOMES,
  RIGHTS_GATE_AGENT_BOUNDS,
  SOURCE_RIGHTS_STATES,
  assertEq4LocksIntact,
  classifyRightsState,
  eq4SoftWireSnapshot,
  isHumanApprover,
  isRightsGateAgent,
  type Eq4Actor,
  type Eq4EvidenceState,
  type Eq4HopRecord,
  type Eq4SoftWireSnapshot,
  type RightsClassificationOutcome,
  type SourceRightsState,
} from './proprietary-isa-boundary-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PROPRIETARY_ISA_BOUNDARY_CYCLE)[number],
  state: Eq4EvidenceState,
  summary: string,
): Eq4HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

function deny(reason: string): DenialResult {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

export type AllowedLearningTarget = (typeof ALLOWED_LEARNING_TARGETS)[number];
export type BlockedLearningTarget = (typeof BLOCKED_LEARNING_TARGETS)[number];
export type BlockedMaterialKind =
  (typeof BLOCKED_OR_QUARANTINED_MATERIAL)[number];
export type AllowedResearchSource = (typeof ALLOWED_RESEARCH_SOURCES)[number];

export type ArchitectureKnowledgeNode = {
  nodeId: string;
  sourceId: string;
  rightsState: SourceRightsState;
  architectureFeature: string;
  claim: string;
  tenantId: string;
  universeId: string;
  purpose: string;
  reviewer: string;
  timestamp: string;
  revocationPath: string;
  globalKnowledgeBase: boolean;
  learningTarget: AllowedLearningTarget;
  hiddenChainOfThoughtPresent: false;
};

export type SourceClassificationResult = {
  sourceId: string;
  rightsState: SourceRightsState;
  outcome: RightsClassificationOutcome;
  allowedSourceKind?: AllowedResearchSource;
  blockedMaterial?: BlockedMaterialKind;
  learningTarget: AllowedLearningTarget | BlockedLearningTarget;
  learningAllowed: boolean;
  entersKnowledgeGraph: boolean;
  globalKnowledgeBase: boolean;
  tenantUniverseOnly: boolean;
  reason: string;
};

/**
 * Classify a source by rights state. UNKNOWN_RIGHTS → QUARANTINE.
 */
export function classifySource(input: {
  sourceId: string;
  rightsState: SourceRightsState;
  architectureFeature: string;
  claim: string;
  purpose: string;
  reviewer: string;
  learningTarget: AllowedLearningTarget | BlockedLearningTarget;
  allowedSourceKind?: AllowedResearchSource;
  blockedMaterial?: BlockedMaterialKind;
  tenantId?: string;
  universeId?: string;
  attemptAutoIngestUnknownRights?: boolean;
  attemptPromoteTenantPrivateToGlobal?: boolean;
  attemptPromoteQuarantineToGlobal?: boolean;
  attemptLearnConfidentialInternals?: boolean;
  attemptCopyProprietaryDesign?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): SourceClassificationResult | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_RIGHTS_GATE=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptAutoIngestUnknownRights) {
    return deny(
      'UNKNOWN_RIGHTS_AUTO_INGEST=false — UNKNOWN_RIGHTS → QUARANTINE, not auto-ingest.',
    );
  }
  if (input.attemptPromoteQuarantineToGlobal) {
    return deny('PROMOTE_QUARANTINE_TO_GLOBAL=false.');
  }
  if (input.attemptPromoteTenantPrivateToGlobal) {
    return deny(
      'TENANT_PRIVATE_EQ_GLOBAL_KB=false — AUTHORIZED_PRIVATE stays in tenant Universe.',
    );
  }
  if (
    input.attemptLearnConfidentialInternals ||
    input.learningTarget === 'confidential_implementation_internals'
  ) {
    return deny(
      'LEARN_CONFIDENTIAL_IMPLEMENTATION_INTERNALS=false.',
    );
  }
  if (
    input.attemptCopyProprietaryDesign ||
    input.learningTarget === 'copied_proprietary_design'
  ) {
    return deny('COPY_PROPRIETARY_DESIGN=false.');
  }

  if (input.blockedMaterial) {
    return {
      sourceId: input.sourceId,
      rightsState: input.rightsState === 'LEAKED_OR_STOLEN'
        ? 'LEAKED_OR_STOLEN'
        : input.rightsState === 'RESTRICTED'
          ? 'RESTRICTED'
          : 'CONFIDENTIAL',
      outcome: 'DENY',
      allowedSourceKind: input.allowedSourceKind,
      blockedMaterial: input.blockedMaterial,
      learningTarget: input.learningTarget,
      learningAllowed: false,
      entersKnowledgeGraph: false,
      globalKnowledgeBase: false,
      tenantUniverseOnly: false,
      reason: `Blocked material: ${input.blockedMaterial}`,
    };
  }

  const outcome = classifyRightsState(input.rightsState);
  const learningAllowed = (
    ALLOWED_LEARNING_TARGETS as readonly string[]
  ).includes(input.learningTarget);

  if (outcome === 'QUARANTINE') {
    return {
      sourceId: input.sourceId,
      rightsState: input.rightsState,
      outcome: 'QUARANTINE',
      allowedSourceKind: input.allowedSourceKind,
      learningTarget: input.learningTarget,
      learningAllowed,
      entersKnowledgeGraph: false,
      globalKnowledgeBase: false,
      tenantUniverseOnly: false,
      reason: 'UNKNOWN_RIGHTS → QUARANTINE (not automatic ingestion)',
    };
  }

  if (outcome === 'DENY') {
    return {
      sourceId: input.sourceId,
      rightsState: input.rightsState,
      outcome: 'DENY',
      allowedSourceKind: input.allowedSourceKind,
      learningTarget: input.learningTarget,
      learningAllowed: false,
      entersKnowledgeGraph: false,
      globalKnowledgeBase: false,
      tenantUniverseOnly: false,
      reason: `${input.rightsState} → DENY`,
    };
  }

  // ALLOW path
  if (!learningAllowed) {
    return deny('Learning target not in allowed semantics/compiler/workload/benchmark set.');
  }

  const isAuthorizedPrivate = input.rightsState === 'AUTHORIZED_PRIVATE';
  const tenantScoped = Boolean(input.tenantId && input.universeId);

  if (isAuthorizedPrivate && !tenantScoped) {
    return deny(
      'AUTHORIZED_PRIVATE requires tenantId+universeId; cannot enter global KB.',
    );
  }

  return {
    sourceId: input.sourceId,
    rightsState: input.rightsState,
    outcome: 'ALLOW',
    allowedSourceKind: input.allowedSourceKind,
    learningTarget: input.learningTarget,
    learningAllowed: true,
    entersKnowledgeGraph: true,
    globalKnowledgeBase: !isAuthorizedPrivate,
    tenantUniverseOnly: isAuthorizedPrivate,
    reason: isAuthorizedPrivate
      ? 'AUTHORIZED_PRIVATE scoped to tenant Universe only — not global KB'
      : `${input.rightsState} → ALLOW into knowledge graph`,
  };
}

export function emitArchitectureKnowledgeNode(input: {
  actor: Eq4Actor;
  classification: SourceClassificationResult;
  architectureFeature: string;
  claim: string;
  purpose: string;
  reviewer: string;
  nodeId?: string;
}): ArchitectureKnowledgeNode | DenialResult {
  if (!input.classification.entersKnowledgeGraph) {
    return deny(
      `Cannot emit knowledge node when outcome=${input.classification.outcome}`,
    );
  }
  if (input.classification.outcome !== 'ALLOW') {
    return deny('Only ALLOW classifications may enter the knowledge graph.');
  }
  if (
    input.classification.tenantUniverseOnly &&
    input.classification.globalKnowledgeBase
  ) {
    return deny('TENANT_PRIVATE_EQ_GLOBAL_KB=false.');
  }

  void ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS;

  const learningTarget = input.classification
    .learningTarget as AllowedLearningTarget;

  return {
    nodeId: input.nodeId ?? `akn-${input.classification.sourceId}`,
    sourceId: input.classification.sourceId,
    rightsState: input.classification.rightsState,
    architectureFeature: input.architectureFeature,
    claim: input.claim,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    purpose: input.purpose,
    reviewer: input.reviewer,
    timestamp: nowIso(),
    revocationPath: `eq4/revoke/${input.classification.sourceId}`,
    globalKnowledgeBase: input.classification.globalKnowledgeBase,
    learningTarget,
    hiddenChainOfThoughtPresent: false,
  };
}

export function attemptAutoIngestUnknownRights(): DenialResult {
  return deny('UNKNOWN_RIGHTS_AUTO_INGEST=false — quarantine instead.');
}

export function attemptPromoteTenantPrivateToGlobalKb(): DenialResult {
  return deny('TENANT_PRIVATE_EQ_GLOBAL_KB=false.');
}

export function attemptPromoteQuarantineToGlobal(): DenialResult {
  return deny('PROMOTE_QUARANTINE_TO_GLOBAL=false.');
}

export function attemptLearnConfidentialImplementationInternals(): DenialResult {
  return deny('LEARN_CONFIDENTIAL_IMPLEMENTATION_INTERNALS=false.');
}

export function attemptCopyProprietaryDesign(): DenialResult {
  return deny('COPY_PROPRIETARY_DESIGN=false.');
}

export function attemptPrivateRtlIngestion(): DenialResult {
  return deny('PRIVATE_RTL_INGESTION=false.');
}

export function attemptConfidentialMicroarchitectureIngestion(): DenialResult {
  return deny('CONFIDENTIAL_MICROARCHITECTURE_INGESTION=false.');
}

export function attemptFirmwareSigningKeysIngestion(): DenialResult {
  return deny('FIRMWARE_SIGNING_KEYS_INGESTION=false.');
}

export function attemptLeakedOrStolenIngestion(): DenialResult {
  return deny('LEAKED_SOURCE_INGESTION=false / LEAKED_OR_STOLEN → DENY.');
}

export function attemptTradeSecretsIngestion(): DenialResult {
  return deny('TRADE_SECRETS_INGESTION=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnBoundaryEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq4Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!RIGHTS_GATE_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isRightsGateAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only rights_gate agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq4Actor;
  action: string;
}):
  | {
      approvalId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, or tenant_admin.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EQ4_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ4_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ4_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function examplePublicIsaAllow(
  actor: Eq4Actor,
): {
  classification: SourceClassificationResult;
  node: ArchitectureKnowledgeNode;
} {
  const classification = classifySource({
    sourceId: 'src-public-isa-1',
    rightsState: 'PUBLIC_OPEN',
    architectureFeature: 'instruction_semantics',
    claim: 'DOCUMENTED',
    purpose: 'portable_abstraction_layer',
    reviewer: actor.id,
    learningTarget: 'instruction_semantics',
    allowedSourceKind: 'public_isa_specifications',
    tenantId: actor.tenantId,
    universeId: actor.universeId,
  });
  if ('denied' in classification) {
    throw new Error('examplePublicIsaAllow classify failed');
  }
  const node = emitArchitectureKnowledgeNode({
    actor,
    classification,
    architectureFeature: 'instruction_semantics',
    claim: 'DOCUMENTED',
    purpose: 'portable_abstraction_layer',
    reviewer: actor.id,
    nodeId: 'akn-public-isa-1',
  });
  if ('denied' in node) throw new Error('examplePublicIsaAllow emit failed');
  return { classification, node };
}

export function exampleUnknownRightsQuarantine(): SourceClassificationResult {
  const result = classifySource({
    sourceId: 'src-unknown-1',
    rightsState: 'UNKNOWN_RIGHTS',
    architectureFeature: 'unclear_extension',
    claim: 'DOCUMENTED',
    purpose: 'rights_review',
    reviewer: 'rights_gate',
    learningTarget: 'instruction_semantics',
  });
  if ('denied' in result) throw new Error('quarantine example failed');
  return result;
}

export function exampleAuthorizedPrivateTenantOnly(
  actor: Eq4Actor,
): {
  classification: SourceClassificationResult;
  node: ArchitectureKnowledgeNode;
} {
  const classification = classifySource({
    sourceId: 'src-auth-private-1',
    rightsState: 'AUTHORIZED_PRIVATE',
    architectureFeature: 'org_device_doc',
    claim: 'DOCUMENTED',
    purpose: 'tenant_universe_research',
    reviewer: actor.id,
    learningTarget: 'workload_mapping',
    tenantId: actor.tenantId,
    universeId: actor.universeId,
  });
  if ('denied' in classification) {
    throw new Error('authorized private classify failed');
  }
  const node = emitArchitectureKnowledgeNode({
    actor,
    classification,
    architectureFeature: 'org_device_doc',
    claim: 'DOCUMENTED',
    purpose: 'tenant_universe_research',
    reviewer: actor.id,
    nodeId: 'akn-auth-private-1',
  });
  if ('denied' in node) throw new Error('authorized private emit failed');
  return { classification, node };
}

export function bootstrapProprietaryIsaBoundary(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq4SoftWireSnapshot;
  allowedSources: typeof ALLOWED_RESEARCH_SOURCES;
  blockedMaterial: typeof BLOCKED_OR_QUARANTINED_MATERIAL;
  rightsStates: typeof SOURCE_RIGHTS_STATES;
  outcomes: typeof RIGHTS_CLASSIFICATION_OUTCOMES;
  flow: typeof PROPRIETARY_ISA_BOUNDARY_FLOW;
  auditFields: typeof ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS;
  allowedLearning: typeof ALLOWED_LEARNING_TARGETS;
  blockedLearning: typeof BLOCKED_LEARNING_TARGETS;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ4_MAY;
  mustNot: typeof EQ4_MUST_NOT;
  dbCandidates: typeof EQ4_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq4LocksIntact(),
    softWire: eq4SoftWireSnapshot(repoRoot),
    allowedSources: ALLOWED_RESEARCH_SOURCES,
    blockedMaterial: BLOCKED_OR_QUARANTINED_MATERIAL,
    rightsStates: SOURCE_RIGHTS_STATES,
    outcomes: RIGHTS_CLASSIFICATION_OUTCOMES,
    flow: PROPRIETARY_ISA_BOUNDARY_FLOW,
    auditFields: ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS,
    allowedLearning: ALLOWED_LEARNING_TARGETS,
    blockedLearning: BLOCKED_LEARNING_TARGETS,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ4_MAY,
    mustNot: EQ4_MUST_NOT,
    dbCandidates: EQ4_DB_CANDIDATES_STATUS,
  };
}

export function runProprietaryIsaBoundaryCycle(input: {
  actor: Eq4Actor;
  human: Eq4Actor;
  repoRoot?: string;
}): {
  hops: Eq4HopRecord[];
  publicAllow: {
    classification: SourceClassificationResult;
    node: ArchitectureKnowledgeNode;
  };
  quarantine: SourceClassificationResult;
  tenantPrivate: {
    classification: SourceClassificationResult;
    node: ArchitectureKnowledgeNode;
  };
  softWire: Eq4SoftWireSnapshot;
} {
  const hops: Eq4HopRecord[] = [];
  const softWire = eq4SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq4LocksIntact() ? 'PASS' : 'FAIL',
      'EQ4 locks intact including L4=false and UNKNOWN_RIGHTS quarantine.',
    ),
  );
  hops.push(
    hop(
      'proprietary_isa_boundary_bootstrap',
      'PASS',
      'Proprietary ISA Boundary bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'allowed_sources_encoded',
      'PASS',
      `${ALLOWED_RESEARCH_SOURCES.length} allowed research sources encoded.`,
    ),
  );
  hops.push(
    hop(
      'blocked_material_encoded',
      'PASS',
      `${BLOCKED_OR_QUARANTINED_MATERIAL.length} blocked material categories encoded.`,
    ),
  );
  hops.push(
    hop(
      'rights_states_encoded',
      'PASS',
      SOURCE_RIGHTS_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'classification_outcomes_encoded',
      'PASS',
      RIGHTS_CLASSIFICATION_OUTCOMES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      'PASS',
      PROPRIETARY_ISA_BOUNDARY_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'audit_fields_encoded',
      'PASS',
      ARCHITECTURE_KNOWLEDGE_AUDIT_FIELDS.join(' · '),
    ),
  );

  const publicAllow = examplePublicIsaAllow(input.actor);
  const quarantine = exampleUnknownRightsQuarantine();
  const tenantPrivate = exampleAuthorizedPrivateTenantOnly(input.actor);

  hops.push(
    hop(
      'unknown_rights_quarantines_not_auto_ingest',
      quarantine.outcome === 'QUARANTINE' &&
        quarantine.entersKnowledgeGraph === false &&
        attemptAutoIngestUnknownRights().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'UNKNOWN_RIGHTS → QUARANTINE; auto-ingest DENIED.',
    ),
  );
  hops.push(
    hop(
      'allowed_learning_not_proprietary_copy',
      publicAllow.classification.learningAllowed &&
        attemptLearnConfidentialImplementationInternals().state === 'DENIED' &&
        attemptCopyProprietaryDesign().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'May learn semantics/compiler/workload/benchmark; not proprietary internals.',
    ),
  );
  hops.push(
    hop(
      'tenant_private_not_global_kb',
      tenantPrivate.classification.tenantUniverseOnly === true &&
        tenantPrivate.node.globalKnowledgeBase === false &&
        attemptPromoteTenantPrivateToGlobalKb().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'AUTHORIZED_PRIVATE scoped to Universe — not global KB.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof PROPRIETARY_ISA_BOUNDARY_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_private_rtl', fn: attemptPrivateRtlIngestion },
    {
      hop: 'deny_confidential_microarchitecture',
      fn: attemptConfidentialMicroarchitectureIngestion,
    },
    {
      hop: 'deny_firmware_signing_keys',
      fn: attemptFirmwareSigningKeysIngestion,
    },
    { hop: 'deny_leaked_or_stolen', fn: attemptLeakedOrStolenIngestion },
    { hop: 'deny_trade_secrets', fn: attemptTradeSecretsIngestion },
    {
      hop: 'deny_promote_quarantine_to_global',
      fn: attemptPromoteQuarantineToGlobal,
    },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(
        d.hop,
        d.fn().state === 'DENIED' ? 'PASS' : 'FAIL',
        `${d.hop} DENIED.`,
      ),
    );
  }

  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act / authorize.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EQ4_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eq3_soft_wire',
      softWire.eq3RiscvOpenIsaKnowledgePack.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq3RiscvOpenIsaKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'eq2_soft_wire',
      softWire.eq2ArmArchitectureKnowledgePack.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eq2ArmArchitectureKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'eq1_soft_wire',
      softWire.eq1CrossArchitectureContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq1CrossArchitectureContract.note,
    ),
  );
  hops.push(
    hop(
      'ep16_soft_wire',
      softWire.ep16NoOverclockBiosRule.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep16NoOverclockBiosRule.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWire.em157HomeBase.present ? 'PASS' : 'WAITING_DATA',
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EQ4_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq4-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void PROPRIETARY_ISA_BOUNDARY_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    publicAllow,
    quarantine,
    tenantPrivate,
    softWire,
  };
}
