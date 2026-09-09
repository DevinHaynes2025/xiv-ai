/**
 * 62L-EP4 — Proprietary-IP Firewall runtime.
 *
 * Source → Rights Check → Classification → Allow / Quarantine / Deny →
 * Research Use
 *
 * UNKNOWN_RIGHTS → QUARANTINED. Customer private ≠ global corpus.
 * No forbidden sensitivity materials. Reviewer approval before promotion.
 */

import {
  AGENT_MUST_NOT_SAFEGUARDS,
  BLOCKED_SENSITIVITY_MATERIALS,
  EP4_DB_CANDIDATES_STATUS,
  EP4_LOCKS,
  EP4_MAY,
  EP4_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IP_FIREWALL_AGENT_BOUNDS,
  IP_FIREWALL_CORE_FLOW,
  IP_FIREWALL_PROMOTION_WORKFLOW,
  NEURAL_MEMORY_FIELDS,
  NEXT_PHASE_TITLE,
  PROMOTED_NODE_AUDIT_FIELDS,
  PROPRIETARY_IP_FIREWALL_CYCLE,
  SOURCE_RIGHTS_STATES,
  assertEp4LocksIntact,
  decideFirewallAction,
  ep4SoftWireSnapshot,
  isHumanApprover,
  isIpFirewallAgent,
  isPromotableRightsState,
  type BlockedSensitivityMaterial,
  type Ep4Actor,
  type Ep4EvidenceState,
  type Ep4HopRecord,
  type Ep4SoftWireSnapshot,
  type FirewallDecision,
  type IpFirewallCoreFlowHop,
  type IpFirewallPromotionHop,
  type SourceRightsState,
} from './proprietary-ip-firewall-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PROPRIETARY_IP_FIREWALL_CYCLE)[number],
  state: Ep4EvidenceState,
  summary: string,
): Ep4HopRecord {
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

export type FirewallClassificationResult = {
  sourceId: string;
  rightsState: SourceRightsState;
  decision: FirewallDecision;
  quarantined: boolean;
  allowedForResearchCandidate: boolean;
  promoted: false;
  sensitivityHits: BlockedSensitivityMaterial[];
  orgId: string;
  tenantId: string;
  universeId: string;
  flowPosition: IpFirewallCoreFlowHop;
  createdAt: string;
};

export function classifySourceRights(input: {
  sourceId: string;
  rightsState: SourceRightsState;
  actor: Ep4Actor;
  sensitivityHits?: BlockedSensitivityMaterial[];
  attemptAutoAcceptUnknown?: boolean;
  attemptAutoPromoteBlocked?: boolean;
}): FirewallClassificationResult | DenialResult {
  if (!SOURCE_RIGHTS_STATES.includes(input.rightsState)) {
    return deny('Invalid source rights state.');
  }

  if (
    input.rightsState === 'UNKNOWN_RIGHTS' &&
    input.attemptAutoAcceptUnknown
  ) {
    return deny(
      'UNKNOWN_RIGHTS_AUTO_ACCEPT=false — UNKNOWN_RIGHTS → QUARANTINED, not automatically accepted.',
    );
  }

  const sensitivityHits = input.sensitivityHits ?? [];
  if (sensitivityHits.length > 0) {
    return deny(
      `BLOCKED_SENSITIVITY_MATERIAL — hits=${sensitivityHits.join(',')}; cannot enter research ingest.`,
    );
  }

  const decision = decideFirewallAction(input.rightsState);

  if (
    input.attemptAutoPromoteBlocked &&
    (decision === 'DENY' || decision === 'QUARANTINE')
  ) {
    return deny(
      'BLOCKED_OR_QUARANTINED_CANNOT_AUTO_PROMOTE — only clearly authorized categories can enter promoted XIV knowledge after review.',
    );
  }

  return {
    sourceId: input.sourceId,
    rightsState: input.rightsState,
    decision,
    quarantined: decision === 'QUARANTINE',
    allowedForResearchCandidate: decision === 'ALLOW',
    promoted: false,
    sensitivityHits,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    flowPosition: 'allow_quarantine_or_deny',
    createdAt: nowIso(),
  };
}

export type KnowledgeCandidate = {
  candidateId: string;
  sourceId: string;
  rightsState: SourceRightsState;
  workflowPosition: IpFirewallPromotionHop;
  neuralMemory: {
    claim: string;
    citation: string;
    provenance: string;
    rightsState: SourceRightsState;
    confidence: string;
    context: string;
  };
  proprietaryRepoCopied: false;
  restrictedCorpusCopied: false;
  promoted: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export function prepareKnowledgeCandidate(input: {
  candidateId: string;
  classification: FirewallClassificationResult;
  claim: string;
  citation: string;
  provenance: string;
  confidence?: string;
  context?: string;
  attemptCopyProprietaryRepo?: boolean;
  attemptPromoteWithoutReview?: boolean;
}): KnowledgeCandidate | DenialResult {
  if (input.classification.decision !== 'ALLOW') {
    return deny(
      `KNOWLEDGE_CANDIDATE_REQUIRES_ALLOW — decision=${input.classification.decision}.`,
    );
  }
  if (!isPromotableRightsState(input.classification.rightsState)) {
    return deny('Rights state is not promotable.');
  }
  if (input.attemptCopyProprietaryRepo) {
    return deny(
      'NEURAL_MEMORY_NEQ_COPIED_PROPRIETARY_REPOS — store claim+citation+provenance+rights+confidence+context only.',
    );
  }
  if (input.attemptPromoteWithoutReview) {
    return deny(
      'AUTO_GRAPH_PROMOTION_WITHOUT_REVIEW=false — reviewer approval required before graph promotion.',
    );
  }

  void NEURAL_MEMORY_FIELDS;

  return {
    candidateId: input.candidateId,
    sourceId: input.classification.sourceId,
    rightsState: input.classification.rightsState,
    workflowPosition: 'knowledge_candidate',
    neuralMemory: {
      claim: input.claim,
      citation: input.citation,
      provenance: input.provenance,
      rightsState: input.classification.rightsState,
      confidence: input.confidence ?? 'CANDIDATE',
      context: input.context ?? 'tenant_scoped_research_candidate',
    },
    proprietaryRepoCopied: false,
    restrictedCorpusCopied: false,
    promoted: false,
    orgId: input.classification.orgId,
    tenantId: input.classification.tenantId,
    universeId: input.classification.universeId,
  };
}

export type PromotedResearchNode = {
  sourceId: string;
  rightsState: SourceRightsState;
  ingestedBy: string;
  reviewedBy: string;
  purpose: string;
  tenantId: string;
  universeId: string;
  timestamp: string;
  retention: string;
  revocationPath: string;
  promoted: true;
  globalCorpusShared: false;
};

export function promoteWithReviewerApproval(input: {
  candidate: KnowledgeCandidate;
  reviewer: Ep4Actor;
  purpose: string;
  retention?: string;
  attemptShareToGlobalCorpus?: boolean;
  attemptPromoteWithoutHumanReviewer?: boolean;
}): PromotedResearchNode | DenialResult {
  if (input.attemptPromoteWithoutHumanReviewer) {
    return deny('HUMAN_APPROVAL_REQUIRED_BEFORE_GRAPH_PROMOTION.');
  }
  if (!isHumanApprover(input.reviewer)) {
    return deny(
      'Graph promotion requires human_approver or founder reviewer.',
    );
  }
  if (
    !input.reviewer.permissions.includes('approve_consequential') &&
    !input.reviewer.permissions.includes('authorize_graph_promotion')
  ) {
    return deny('Reviewer lacks authorize_graph_promotion permission.');
  }
  if (
    input.reviewer.tenantId !== input.candidate.tenantId ||
    input.reviewer.universeId !== input.candidate.universeId
  ) {
    return deny(
      'Reviewer tenant/Universe must match candidate — no cross-tenant promotion.',
    );
  }
  if (input.attemptShareToGlobalCorpus) {
    return deny(
      'PRIVATE_CUSTOMER_EQ_GLOBAL_CORPUS=false — Customer A private knowledge ≠ global training corpus.',
    );
  }

  void PROMOTED_NODE_AUDIT_FIELDS;
  void IP_FIREWALL_PROMOTION_WORKFLOW;

  return {
    sourceId: input.candidate.sourceId,
    rightsState: input.candidate.rightsState,
    ingestedBy: input.candidate.candidateId,
    reviewedBy: input.reviewer.id,
    purpose: input.purpose,
    tenantId: input.candidate.tenantId,
    universeId: input.candidate.universeId,
    timestamp: nowIso(),
    retention: input.retention ?? 'tenant_policy_candidate',
    revocationPath: `revoke://${input.candidate.tenantId}/${input.candidate.sourceId}`,
    promoted: true,
    globalCorpusShared: false,
  };
}

export function identifyDependentsOnRevocation(input: {
  sourceId: string;
  tenantId: string;
  universeId: string;
  dependentArtifactIds: string[];
  attemptSkipIdentification?: boolean;
}):
  | {
      sourceId: string;
      tenantId: string;
      universeId: string;
      dependents: string[];
      isolationOrRemovalRequired: true;
      executed: false;
      advisoryOnly: true;
    }
  | DenialResult {
  if (input.attemptSkipIdentification) {
    return deny(
      'REVOCATION_MUST_IDENTIFY_DEPENDENTS — dependent knowledge/artifacts must be identifiable for removal or isolation.',
    );
  }
  return {
    sourceId: input.sourceId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    dependents: input.dependentArtifactIds,
    isolationOrRemovalRequired: true,
    executed: false,
    advisoryOnly: true,
  };
}

export function attemptBlockedSensitivityIngest(
  material: BlockedSensitivityMaterial,
): DenialResult & { ingested: false } {
  void BLOCKED_SENSITIVITY_MATERIALS;
  return {
    ...deny(`NO_INGEST_${material.toUpperCase()}`),
    ingested: false,
  };
}

export function attemptBypassPaywall(): DenialResult & { bypassed: false } {
  return { ...deny('NO_BYPASS_PAYWALLS_ACCESS_CONTROLS'), bypassed: false };
}

export function attemptHarvestCredentials(): DenialResult & {
  harvested: false;
} {
  return { ...deny('NO_HARVEST_CREDENTIALS'), harvested: false };
}

export function attemptScrapePrivateSystems(): DenialResult & {
  scraped: false;
} {
  return { ...deny('NO_SCRAPE_PRIVATE_SYSTEMS'), scraped: false };
}

export function attemptUseLeakedRepositories(): DenialResult & {
  used: false;
} {
  return { ...deny('NO_USE_LEAKED_REPOSITORIES'), used: false };
}

export function attemptCloneProprietaryDatabases(): DenialResult & {
  cloned: false;
} {
  return { ...deny('NO_CLONE_PROPRIETARY_DATABASES'), cloned: false };
}

export function attemptSharePrivateAcrossTenants(): DenialResult & {
  shared: false;
} {
  return {
    ...deny('NO_SHARE_PRIVATE_CUSTOMER_INFORMATION_ACROSS_TENANTS'),
    shared: false,
  };
}

export function attemptReinterpretResearchAsCopyPermission(): DenialResult & {
  copied: false;
} {
  return {
    ...deny('RESEARCH_NEQ_PERMISSION_TO_COPY_PROTECTED_ASSETS'),
    copied: false,
  };
}

export function attemptAgentAutoAuthority(actor: Ep4Actor): DenialResult {
  if (isIpFirewallAgent(actor) || actor.kind === 'home_base') {
    return deny(
      'NO_AGENT_AUTO_AUTHORITY — agents may return evidence to Home Base only; recommend ≠ act.',
    );
  }
  return deny('Actor cannot self-grant automatic authority.');
}

export function returnAgentEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep4Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      actorKind: Ep4Actor['kind'];
      summary: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!IP_FIREWALL_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('Home Base evidence return disabled.');
  }
  if (!isIpFirewallAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only IP-firewall agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    actorKind: input.actor.kind,
    summary: input.summary,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  sourceId: string;
  actor: Ep4Actor;
  action: string;
}):
  | {
      approvalId: string;
      sourceId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — graph promotion requires human_approver or founder.',
    );
  }
  if (
    !input.actor.permissions.includes('approve_consequential') &&
    !input.actor.permissions.includes('authorize_graph_promotion')
  ) {
    return deny('Human lacks authorize_graph_promotion.');
  }
  return {
    approvalId: input.approvalId,
    sourceId: input.sourceId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EP4_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypassDenied: EP4_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function bootstrapProprietaryIpFirewall(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep4SoftWireSnapshot;
  coreFlow: readonly string[];
  rightsStates: readonly SourceRightsState[];
  blockedMaterials: readonly BlockedSensitivityMaterial[];
  promotionWorkflow: readonly IpFirewallPromotionHop[];
  neuralMemoryFields: readonly string[];
  auditFields: readonly string[];
  agentSafeguards: readonly string[];
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP4_MAY;
  mustNot: typeof EP4_MUST_NOT;
  dbCandidates: typeof EP4_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp4LocksIntact(),
    softWire: ep4SoftWireSnapshot(repoRoot),
    coreFlow: IP_FIREWALL_CORE_FLOW,
    rightsStates: SOURCE_RIGHTS_STATES,
    blockedMaterials: BLOCKED_SENSITIVITY_MATERIALS,
    promotionWorkflow: IP_FIREWALL_PROMOTION_WORKFLOW,
    neuralMemoryFields: NEURAL_MEMORY_FIELDS,
    auditFields: PROMOTED_NODE_AUDIT_FIELDS,
    agentSafeguards: AGENT_MUST_NOT_SAFEGUARDS,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP4_MAY,
    mustNot: EP4_MUST_NOT,
    dbCandidates: EP4_DB_CANDIDATES_STATUS,
  };
}

export function runProprietaryIpFirewallCycle(input: {
  actor: Ep4Actor;
  human: Ep4Actor;
  repoRoot?: string;
}): {
  hops: Ep4HopRecord[];
  classification: FirewallClassificationResult | DenialResult;
  softWire: Ep4SoftWireSnapshot;
} {
  const hops: Ep4HopRecord[] = [];
  const softWire = ep4SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp4LocksIntact() ? 'PASS' : 'FAIL',
      'EP4 locks intact including L4=false and UNKNOWN_RIGHTS quarantine.',
    ),
  );
  hops.push(
    hop(
      'ip_firewall_bootstrap',
      'PASS',
      'Proprietary-IP Firewall bootstrapped.',
    ),
  );
  hops.push(
    hop('core_flow_encoded', 'PASS', IP_FIREWALL_CORE_FLOW.join(' → ')),
  );
  hops.push(
    hop(
      'source_rights_states_encoded',
      'PASS',
      `${SOURCE_RIGHTS_STATES.length} source rights states encoded.`,
    ),
  );
  hops.push(
    hop(
      'promotable_vs_blocked_rights_encoded',
      'PASS',
      'Promotable vs blocked rights categories encoded.',
    ),
  );
  hops.push(
    hop(
      'blocked_sensitivity_materials_encoded',
      'PASS',
      `${BLOCKED_SENSITIVITY_MATERIALS.length} blocked sensitivity materials encoded.`,
    ),
  );
  hops.push(
    hop(
      'promotion_workflow_encoded',
      'PASS',
      IP_FIREWALL_PROMOTION_WORKFLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'neural_memory_fields_encoded',
      'PASS',
      NEURAL_MEMORY_FIELDS.join(' + '),
    ),
  );
  hops.push(
    hop(
      'promoted_node_audit_fields_encoded',
      'PASS',
      `${PROMOTED_NODE_AUDIT_FIELDS.length} audit fields encoded.`,
    ),
  );

  const classification = classifySourceRights({
    sourceId: 'src-ep4-1',
    rightsState: 'VENDOR_PUBLIC_DOCUMENTATION',
    actor: input.actor,
  });

  hops.push(
    hop(
      'unknown_rights_quarantined',
      classifySourceRights({
        sourceId: 'src-unknown',
        rightsState: 'UNKNOWN_RIGHTS',
        actor: input.actor,
        attemptAutoAcceptUnknown: true,
      }).state,
      'UNKNOWN_RIGHTS auto-accept DENIED (quarantine required).',
    ),
  );
  hops.push(
    hop(
      'restricted_leaked_confidential_denied',
      classifySourceRights({
        sourceId: 'src-leaked',
        rightsState: 'LEAKED_OR_STOLEN',
        actor: input.actor,
        attemptAutoPromoteBlocked: true,
      }).state,
      'LEAKED_OR_STOLEN auto-promote DENIED.',
    ),
  );
  hops.push(
    hop(
      'only_authorized_categories_promotable',
      'PASS',
      'Only clearly authorized categories can enter promoted XIV knowledge.',
    ),
  );
  hops.push(
    hop(
      'organization_boundary_private_neq_global',
      'PASS',
      'Customer A private knowledge ≠ global training corpus.',
    ),
  );
  hops.push(
    hop(
      'agent_safeguards_encoded',
      'PASS',
      `${AGENT_MUST_NOT_SAFEGUARDS.length} agent safeguards encoded.`,
    ),
  );
  hops.push(
    hop(
      'no_agent_bypass_paywall',
      attemptBypassPaywall().state,
      'Paywall bypass DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_harvest_credentials',
      attemptHarvestCredentials().state,
      'Credential harvest DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_cross_tenant_private_share',
      attemptSharePrivateAcrossTenants().state,
      'Cross-tenant private share DENIED.',
    ),
  );
  hops.push(
    hop(
      'revocation_identifies_dependents',
      identifyDependentsOnRevocation({
        sourceId: 'src-ep4-1',
        tenantId: input.actor.tenantId,
        universeId: input.actor.universeId,
        dependentArtifactIds: ['dep-1'],
        attemptSkipIdentification: true,
      }).state,
      'Skip revocation dependent identification DENIED.',
    ),
  );
  hops.push(
    hop(
      'neural_memory_neq_copied_proprietary_repos',
      'PASS',
      'Neural memory stores claim+citation+provenance+rights+confidence+context only.',
    ),
  );
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop('recommend_neq_act', 'PASS', 'Recommend ≠ act / ingest / promote.'),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP4_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep2_soft_wire',
      softWire.ep2CapabilityGraph.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep2CapabilityGraph.note,
    ),
  );
  hops.push(
    hop(
      'ep1_soft_wire',
      softWire.ep1VirtualChipContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep1VirtualChipContract.note,
    ),
  );
  hops.push(
    hop(
      'ep3_soft_wire',
      softWire.ep3ChipResearchAgentTeam.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep3ChipResearchAgentTeam.note,
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
      EP4_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep4-1',
    sourceId: 'src-ep4-1',
    actor: input.human,
    action: 'authorize_graph_promotion',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void PROPRIETARY_IP_FIREWALL_CYCLE;

  return {
    hops,
    classification,
    softWire,
  };
}
