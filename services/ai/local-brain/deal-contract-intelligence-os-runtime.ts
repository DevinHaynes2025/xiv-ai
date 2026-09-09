/**
 * 62L-EN (#158) — Deal & Contract Intelligence OS runtime.
 *
 * Government-contract flow:
 * SAM.gov opportunity → qualification → eligibility/readiness → bid/no-bid →
 * capture plan → compliance matrix → pricing → proposal → negotiation strategy →
 * human approval → human-authorized submission → award/performance → win/loss
 *
 * Recommend ≠ act / bind / submit / sign / certify / accept.
 */

import {
  DEAL_CONTRACT_INTELLIGENCE_OS_CYCLE,
  DEAL_TEAM_ROSTER,
  EN_DB_CANDIDATES_STATUS,
  EN_LOCKS,
  EN_MAY,
  EN_MUST_NOT,
  EN_POLICY_FRAMING,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOVERNMENT_CONTRACT_FLOW,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  assertEnLocksIntact,
  enSoftWireSnapshot,
  isHumanApprover,
  rolePermissionBounds,
  type DealTeamRole,
  type EnActor,
  type EnEvidenceState,
  type EnHopRecord,
  type EnSoftWireSnapshot,
  type GovContractFlowHop,
} from './deal-contract-intelligence-os-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof DEAL_CONTRACT_INTELLIGENCE_OS_CYCLE)[number],
  state: EnEvidenceState,
  summary: string,
): EnHopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

// ---------------------------------------------------------------------------
// A — Deal & Contract Intelligence OS home objects
// ---------------------------------------------------------------------------

export type OpportunityKind =
  | 'commercial'
  | 'enterprise'
  | 'licensing'
  | 'partnership'
  | 'subcontract'
  | 'government';

export type OpportunityStatus =
  | 'REGISTERED'
  | 'QUALIFYING'
  | 'BID_NO_BID'
  | 'CAPTURE'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'AWAITING_HUMAN'
  | 'HUMAN_APPROVED_PACKAGE'
  | 'SUBMITTED_HUMAN_AUTHORIZED'
  | 'AWARDED'
  | 'LOST'
  | 'CLOSED'
  | 'DENIED';

export type DealHomeObject = {
  opportunityId: string;
  kind: OpportunityKind;
  title: string;
  status: OpportunityStatus;
  orgId: string;
  tenantId: string;
  universeId: string;
  flowPosition: GovContractFlowHop;
  autoSubmitted: false;
  autoAccepted: false;
  createdAt: string;
};

export function registerDealHomeObject(input: {
  opportunityId: string;
  kind: OpportunityKind;
  title: string;
  actor: EnActor;
}): DealHomeObject {
  return {
    opportunityId: input.opportunityId,
    kind: input.kind,
    title: input.title,
    status: 'REGISTERED',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    flowPosition: input.kind === 'government' ? 'sam_gov_opportunity' : 'qualification',
    autoSubmitted: false,
    autoAccepted: false,
    createdAt: nowIso(),
  };
}

export function advanceOpportunityLifecycle(
  deal: DealHomeObject,
  nextStatus: OpportunityStatus,
  nextFlow?: GovContractFlowHop,
): DealHomeObject {
  return {
    ...deal,
    status: nextStatus,
    flowPosition: nextFlow ?? deal.flowPosition,
  };
}

// ---------------------------------------------------------------------------
// B — AI Marketing/Negotiation Team roster + permission bounds
// ---------------------------------------------------------------------------

export type DealTeamMember = {
  role: DealTeamRole;
  permissions: readonly string[];
  mayActAutonomously: false;
  maySelfExpandAuthority: false;
  recommendOnly: true;
};

export function buildDealTeamRoster(): DealTeamMember[] {
  return DEAL_TEAM_ROSTER.map((role) => ({
    role,
    permissions: rolePermissionBounds(role),
    mayActAutonomously: false,
    maySelfExpandAuthority: false,
    recommendOnly: true,
  }));
}

export type AuthorityExpansionAttempt = {
  status: 'denied';
  reason: string;
  state: 'DENIED';
};

export function attemptSelfExpandAuthority(input: {
  actor: EnActor;
  requestedPermissions: readonly string[];
}): AuthorityExpansionAttempt {
  void input;
  return {
    status: 'denied',
    state: 'DENIED',
    reason: 'AGENT_CANNOT_SELF_EXPAND_AUTHORITY (EN_LOCKS.AGENT_SELF_EXPAND_AUTHORITY=false).',
  };
}

export type RecommendActAttempt = {
  status: 'denied' | 'recommendation_only';
  reason: string;
  executed: false;
};

export function attemptAgentAct(input: {
  actor: EnActor;
  action: string;
  attemptExecute?: boolean;
}): RecommendActAttempt {
  if (input.attemptExecute && !isHumanApprover(input.actor)) {
    return {
      status: 'denied',
      executed: false,
      reason: `Recommend ≠ act — agent action '${input.action}' DENIED without human approver.`,
    };
  }
  return {
    status: 'recommendation_only',
    executed: false,
    reason: 'Governed agent recommendation recorded; not executed.',
  };
}

// ---------------------------------------------------------------------------
// C — Historical Negotiation Memory + neural lesson writeback
// ---------------------------------------------------------------------------

export type NegotiationLesson = {
  lessonId: string;
  title: string;
  domain: 'pricing' | 'concession' | 'batna' | 'government' | 'commercial' | 'teaming';
  provenance: string;
  structuredEvidence: string[];
  lessonSummary: string;
  provesStrategyWorksToday: false;
  correlationEqualsCausation: false;
  hiddenChainOfThoughtStored: false;
  strengthensAuthorityAutomatically: false;
  state: 'PROVENANCE_LABELED';
};

export function registerNegotiationLesson(input: {
  lessonId: string;
  title: string;
  domain: NegotiationLesson['domain'];
  provenance: string;
  structuredEvidence: string[];
  lessonSummary: string;
  claimGuaranteeWorksToday?: boolean;
  claimCausationFromCorrelation?: boolean;
  attemptHiddenCotStorage?: boolean;
  attemptAuthorityExpansionFromLesson?: boolean;
}): NegotiationLesson | { denied: true; state: 'DENIED'; reason: string } {
  if (!input.provenance.trim()) {
    return { denied: true, state: 'DENIED', reason: 'Historical negotiation lesson requires provenance.' };
  }
  if (input.structuredEvidence.length === 0) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Neural lesson writeback requires structured evidence only (no hidden CoT).',
    };
  }
  if (input.claimGuaranteeWorksToday) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'LESSON_NEQ_GUARANTEE — lessons ≠ proof the same strategy works today.',
    };
  }
  if (input.claimCausationFromCorrelation) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Correlation ≠ causation (EN_LOCKS.CORRELATION_EQ_CAUSATION=false).',
    };
  }
  if (input.attemptHiddenCotStorage) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'HIDDEN_CHAIN_OF_THOUGHT_STORAGE forbidden (EN_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_STORAGE=false).',
    };
  }
  if (input.attemptAuthorityExpansionFromLesson) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Lessons cannot self-expand agent authority.',
    };
  }
  return {
    lessonId: input.lessonId,
    title: input.title,
    domain: input.domain,
    provenance: input.provenance,
    structuredEvidence: [...input.structuredEvidence],
    lessonSummary: input.lessonSummary,
    provesStrategyWorksToday: false,
    correlationEqualsCausation: false,
    hiddenChainOfThoughtStored: false,
    strengthensAuthorityAutomatically: false,
    state: 'PROVENANCE_LABELED',
  };
}

export type NeuralLessonPathway = {
  pathwayId: string;
  lessonId: string;
  evidenceRefs: string[];
  state: 'REGISTERED';
  strengthensAuthorityAutomatically: false;
  isGuarantee: false;
};

export function writebackNeuralLessonPathway(input: {
  pathwayId: string;
  lesson: NegotiationLesson;
}): NeuralLessonPathway {
  return {
    pathwayId: input.pathwayId,
    lessonId: input.lesson.lessonId,
    evidenceRefs: [...input.lesson.structuredEvidence],
    state: 'REGISTERED',
    strengthensAuthorityAutomatically: false,
    isGuarantee: false,
  };
}

// ---------------------------------------------------------------------------
// D — Government Contracting Brain (SAM / FAR research adapters)
// ---------------------------------------------------------------------------

export type SamGovAdapterStatus = {
  adapterKind: 'sam_gov_opportunity_search_candidate';
  configured: false;
  state: 'UNAVAILABLE';
  liveConnected: false;
  reasons: string[];
};

export type FarResearchAdapterStatus = {
  adapterKind: 'far_research_reference_candidate';
  configured: false;
  state: 'UNAVAILABLE' | 'ADVISORY_ONLY';
  isLegalAdvice: false;
  reasons: string[];
};

export function probeSamGovAdapter(input?: {
  claimConfiguredWithoutCredentials?: boolean;
}): SamGovAdapterStatus | { denied: true; state: 'DENIED'; reason: string } {
  if (input?.claimConfiguredWithoutCredentials) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'SAM.gov remains UNAVAILABLE without authorized configuration/credentials.',
    };
  }
  return {
    adapterKind: 'sam_gov_opportunity_search_candidate',
    configured: false,
    state: 'UNAVAILABLE',
    liveConnected: false,
    reasons: [
      EN_POLICY_FRAMING.samGov,
      'Unconfigured → UNAVAILABLE (EN_LOCKS.SAM_GOV_CONFIGURED=false).',
    ],
  };
}

export function probeFarResearchAdapter(input?: {
  claimLegalAdviceAuthority?: boolean;
}): FarResearchAdapterStatus | { denied: true; state: 'DENIED'; reason: string } {
  if (input?.claimLegalAdviceAuthority) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'FAR research ≠ legal advice authority; Business Law agent ≠ attorney.',
    };
  }
  return {
    adapterKind: 'far_research_reference_candidate',
    configured: false,
    state: EN_LOCKS.FAR_ADAPTER_CONFIGURED ? 'ADVISORY_ONLY' : 'UNAVAILABLE',
    isLegalAdvice: false,
    reasons: [
      EN_POLICY_FRAMING.far,
      EN_POLICY_FRAMING.publicTrust,
      'Unconfigured → UNAVAILABLE; when configured, advisory research only.',
    ],
  };
}

export function probeLegalShieldPartner(): {
  status: 'UNAVAILABLE';
  authorized: false;
  reason: string;
} {
  return {
    status: 'UNAVAILABLE',
    authorized: false,
    reason: EN_POLICY_FRAMING.notAttorney,
  };
}

export function analyzeFarRequirements(input: {
  requirementIds: string[];
  notes: string;
}): {
  state: 'ADVISORY_ONLY';
  requirementIds: string[];
  notes: string;
  isLegalAdvice: false;
  binding: false;
} {
  return {
    state: 'ADVISORY_ONLY',
    requirementIds: [...input.requirementIds],
    notes: input.notes,
    isLegalAdvice: false,
    binding: false,
  };
}

// ---------------------------------------------------------------------------
// E — Proposal & Pricing War Room
// ---------------------------------------------------------------------------

export type PricingScenario = {
  scenarioId: string;
  opportunityId: string;
  recommendedPriceUsd: number;
  marginEstimate: number;
  labeledSimulation: true;
  binding: false;
  autoApplied: false;
  state: 'RECOMMENDATION_ONLY';
  humanDecisionRequired: true;
};

export function openPricingScenario(input: {
  scenarioId: string;
  opportunityId: string;
  recommendedPriceUsd: number;
  marginEstimate: number;
  attemptBind?: boolean;
  attemptAutoApply?: boolean;
}): PricingScenario | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptBind || input.attemptAutoApply) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Pricing scenario recommend ≠ bind / auto-apply (EN_LOCKS.RECOMMEND_EQ_BIND_PRICE=false).',
    };
  }
  return {
    scenarioId: input.scenarioId,
    opportunityId: input.opportunityId,
    recommendedPriceUsd: input.recommendedPriceUsd,
    marginEstimate: input.marginEstimate,
    labeledSimulation: true,
    binding: false,
    autoApplied: false,
    state: 'RECOMMENDATION_ONLY',
    humanDecisionRequired: true,
  };
}

export type ProposalDraft = {
  proposalId: string;
  opportunityId: string;
  sections: string[];
  state: 'PLAN_ONLY';
  submitted: false;
  autoSubmitted: false;
};

export function draftProposal(input: {
  proposalId: string;
  opportunityId: string;
  sections: string[];
  attemptAutoSubmit?: boolean;
}): ProposalDraft | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptAutoSubmit) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'AUTO_SUBMIT_BID forbidden — proposal draft only until human-authorized submission.',
    };
  }
  return {
    proposalId: input.proposalId,
    opportunityId: input.opportunityId,
    sections: [...input.sections],
    state: 'PLAN_ONLY',
    submitted: false,
    autoSubmitted: false,
  };
}

export type NegotiationPlan = {
  planId: string;
  opportunityId: string;
  batna: string;
  walkAway: number;
  target: number;
  concessions: string[];
  state: 'ADVISORY_ONLY';
  autoCommit: false;
};

export function draftNegotiationPlan(input: {
  planId: string;
  opportunityId: string;
  batna: string;
  walkAway: number;
  target: number;
  concessions?: string[];
  attemptBatnaAutoCommit?: boolean;
}): NegotiationPlan | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptBatnaAutoCommit) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'BATNA/concessions = sim/recommend; auto-commit DENIED (EN_LOCKS.BATNA_AUTO_COMMIT=false).',
    };
  }
  return {
    planId: input.planId,
    opportunityId: input.opportunityId,
    batna: input.batna,
    walkAway: input.walkAway,
    target: input.target,
    concessions: [...(input.concessions ?? [])],
    state: 'ADVISORY_ONLY',
    autoCommit: false,
  };
}

// ---------------------------------------------------------------------------
// F — Bid/No-Bid + Capture + Compliance matrix
// ---------------------------------------------------------------------------

export type BidNoBidRecommendation = {
  decisionId: string;
  opportunityId: string;
  recommendation: 'BID' | 'NO_BID';
  rationale: string;
  state: 'RECOMMENDATION_ONLY';
  binding: false;
  autoSubmitted: false;
};

export function recommendBidNoBid(input: {
  decisionId: string;
  opportunityId: string;
  recommendation: 'BID' | 'NO_BID';
  rationale: string;
  attemptAutoSubmit?: boolean;
}): BidNoBidRecommendation | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptAutoSubmit) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Bid/No-Bid recommendation ≠ autonomous submission.',
    };
  }
  return {
    decisionId: input.decisionId,
    opportunityId: input.opportunityId,
    recommendation: input.recommendation,
    rationale: input.rationale,
    state: 'RECOMMENDATION_ONLY',
    binding: false,
    autoSubmitted: false,
  };
}

export type CapturePlan = {
  planId: string;
  opportunityId: string;
  themes: string[];
  discriminators: string[];
  state: 'PLAN_ONLY';
  autoExecuted: false;
};

export function draftCapturePlan(input: {
  planId: string;
  opportunityId: string;
  themes: string[];
  discriminators: string[];
}): CapturePlan {
  return {
    planId: input.planId,
    opportunityId: input.opportunityId,
    themes: [...input.themes],
    discriminators: [...input.discriminators],
    state: 'PLAN_ONLY',
    autoExecuted: false,
  };
}

export type ComplianceMatrixRow = {
  requirementId: string;
  proposalSection: string;
  status: 'mapped' | 'gap' | 'advisory';
};

export type ComplianceMatrix = {
  matrixId: string;
  opportunityId: string;
  rows: ComplianceMatrixRow[];
  state: 'ADVISORY_ONLY';
  isLegalAdvice: false;
  certified: false;
};

export function buildComplianceMatrix(input: {
  matrixId: string;
  opportunityId: string;
  rows: ComplianceMatrixRow[];
  attemptAutoCertify?: boolean;
}): ComplianceMatrix | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptAutoCertify) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'AUTO_SIGN_CERTIFICATION forbidden — compliance matrix is advisory mapping only.',
    };
  }
  return {
    matrixId: input.matrixId,
    opportunityId: input.opportunityId,
    rows: input.rows.map((r) => ({ ...r })),
    state: 'ADVISORY_ONLY',
    isLegalAdvice: false,
    certified: false,
  };
}

// ---------------------------------------------------------------------------
// G — Teaming/Subcontracting + Win/Loss learning
// ---------------------------------------------------------------------------

export type TeamingAdvice = {
  adviceId: string;
  opportunityId: string;
  partners: string[];
  subcontractScopes: string[];
  state: 'ADVISORY_ONLY';
  autoExecuted: false;
  bindingAgreement: false;
};

export function adviseTeamingSubcontracting(input: {
  adviceId: string;
  opportunityId: string;
  partners: string[];
  subcontractScopes: string[];
  attemptAutoExecuteAgreement?: boolean;
}): TeamingAdvice | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptAutoExecuteAgreement) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Teaming/subcontract advice ≠ auto-execute binding agreement / accept contract.',
    };
  }
  return {
    adviceId: input.adviceId,
    opportunityId: input.opportunityId,
    partners: [...input.partners],
    subcontractScopes: [...input.subcontractScopes],
    state: 'ADVISORY_ONLY',
    autoExecuted: false,
    bindingAgreement: false,
  };
}

export type WinLossRecord = {
  recordId: string;
  opportunityId: string;
  outcome: 'win' | 'loss' | 'no_bid' | 'withdrawn';
  lessons: string[];
  state: 'PROVENANCE_LABELED';
  provesFutureWin: false;
};

export function recordWinLossLearning(input: {
  recordId: string;
  opportunityId: string;
  outcome: WinLossRecord['outcome'];
  lessons: string[];
  claimGuaranteesFutureWin?: boolean;
}): WinLossRecord | { denied: true; state: 'DENIED'; reason: string } {
  if (input.claimGuaranteesFutureWin) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Win/loss learning ≠ guarantee of future win (lesson ≠ guarantee).',
    };
  }
  return {
    recordId: input.recordId,
    opportunityId: input.opportunityId,
    outcome: input.outcome,
    lessons: [...input.lessons],
    state: 'PROVENANCE_LABELED',
    provesFutureWin: false,
  };
}

// ---------------------------------------------------------------------------
// H — Human approval → human-authorized submission gate
// ---------------------------------------------------------------------------

export type ConsequentialDealAction =
  | 'submit_bid'
  | 'sign_certification'
  | 'make_representation'
  | 'accept_contract'
  | 'bind_price'
  | 'commit_batna'
  | 'other_consequential';

export type DealGateResult = {
  decisionId: string;
  action: ConsequentialDealAction;
  state: 'HUMAN_APPROVAL_REQUIRED' | 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED' | 'DENIED' | 'APPROVED_BOUNDED';
  executed: false;
  autoSubmitted: false;
  autoSigned: false;
  autoCertified: false;
  autoAccepted: false;
  reason: string;
};

export function requireHumanDealApproval(input: {
  decisionId: string;
  action: ConsequentialDealAction;
  actor: EnActor;
  attemptAutonomousExecute?: boolean;
  humanAuthorizedSubmission?: boolean;
}): DealGateResult {
  if (input.attemptAutonomousExecute) {
    const denyMap: Record<ConsequentialDealAction, string> = {
      submit_bid: 'NO_AUTO_SUBMIT — XIV MUST NOT autonomously submit bids.',
      sign_certification: 'NO_AUTO_SIGN / NO_AUTO_CERTIFY — certifications require human authority.',
      make_representation: 'NO_AUTO_REPRESENTATION — representations require human authority.',
      accept_contract: 'NO_AUTO_ACCEPT — contract acceptance requires human authority.',
      bind_price: 'Recommend ≠ bind price.',
      commit_batna: 'BATNA/concessions need human/founder gates.',
      other_consequential: 'Consequential deal action DENIED without human approval.',
    };
    return {
      decisionId: input.decisionId,
      action: input.action,
      state: 'DENIED',
      executed: false,
      autoSubmitted: false,
      autoSigned: false,
      autoCertified: false,
      autoAccepted: false,
      reason: denyMap[input.action],
    };
  }

  if (input.action === 'submit_bid') {
    if (input.humanAuthorizedSubmission && isHumanApprover(input.actor)) {
      return {
        decisionId: input.decisionId,
        action: input.action,
        state: 'APPROVED_BOUNDED',
        executed: false,
        autoSubmitted: false,
        autoSigned: false,
        autoCertified: false,
        autoAccepted: false,
        reason:
          'Human-authorized submission gate cleared — package prepared for human to submit; XIV does not auto-submit.',
      };
    }
    return {
      decisionId: input.decisionId,
      action: input.action,
      state: 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED',
      executed: false,
      autoSubmitted: false,
      autoSigned: false,
      autoCertified: false,
      autoAccepted: false,
      reason: 'Human approval → human-authorized submission required before any bid leaves the system.',
    };
  }

  return {
    decisionId: input.decisionId,
    action: input.action,
    state: 'HUMAN_APPROVAL_REQUIRED',
    executed: false,
    autoSubmitted: false,
    autoSigned: false,
    autoCertified: false,
    autoAccepted: false,
    reason: `Consequential ${input.action} gated for human decision — recommendation held, not executed.`,
  };
}

export function attemptAutoSubmitBid(): DealGateResult {
  return requireHumanDealApproval({
    decisionId: 'auto-submit',
    action: 'submit_bid',
    actor: {
      kind: 'proposal_factory',
      id: 'agent',
      orgId: 'org',
      tenantId: 'ten',
      universeId: 'uni',
      permissions: ['draft_proposal'],
    },
    attemptAutonomousExecute: true,
  });
}

export function attemptAutoSignCertification(): DealGateResult {
  return requireHumanDealApproval({
    decisionId: 'auto-sign',
    action: 'sign_certification',
    actor: {
      kind: 'proposal_factory',
      id: 'agent',
      orgId: 'org',
      tenantId: 'ten',
      universeId: 'uni',
      permissions: ['draft_proposal'],
    },
    attemptAutonomousExecute: true,
  });
}

export function attemptAutoMakeRepresentation(): DealGateResult {
  return requireHumanDealApproval({
    decisionId: 'auto-rep',
    action: 'make_representation',
    actor: {
      kind: 'account_executive',
      id: 'agent',
      orgId: 'org',
      tenantId: 'ten',
      universeId: 'uni',
      permissions: ['recommend_deal_path'],
    },
    attemptAutonomousExecute: true,
  });
}

export function attemptAutoAcceptContract(): DealGateResult {
  return requireHumanDealApproval({
    decisionId: 'auto-accept',
    action: 'accept_contract',
    actor: {
      kind: 'negotiation_strategist',
      id: 'agent',
      orgId: 'org',
      tenantId: 'ten',
      universeId: 'uni',
      permissions: ['sim_scenario'],
    },
    attemptAutonomousExecute: true,
  });
}

export type SubmissionPackage = {
  packageId: string;
  opportunityId: string;
  proposalId: string;
  prepared: true;
  submittedByXiv: false;
  humanAuthorized: boolean;
  state: 'PLAN_ONLY' | 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED' | 'APPROVED_BOUNDED';
};

export function prepareSubmissionPackage(input: {
  packageId: string;
  opportunityId: string;
  proposalId: string;
  humanAuthorized?: boolean;
  actor: EnActor;
}): SubmissionPackage {
  const authorized = input.humanAuthorized === true && isHumanApprover(input.actor);
  return {
    packageId: input.packageId,
    opportunityId: input.opportunityId,
    proposalId: input.proposalId,
    prepared: true,
    submittedByXiv: false,
    humanAuthorized: authorized,
    state: authorized ? 'APPROVED_BOUNDED' : 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED',
  };
}

// ---------------------------------------------------------------------------
// Bootstrap + cycle runner
// ---------------------------------------------------------------------------

export type DealOsBootstrap = {
  sotIssue: typeof GITHUB_SOT_ISSUE;
  sotTitle: typeof GITHUB_SOT_TITLE;
  gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  banner: typeof HONESTY_BANNER;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  dbCandidates: typeof EN_DB_CANDIDATES_STATUS;
  softWire: EnSoftWireSnapshot;
  roster: DealTeamMember[];
  govFlow: typeof GOVERNMENT_CONTRACT_FLOW;
  may: typeof EN_MAY;
  mustNot: typeof EN_MUST_NOT;
  policyFraming: typeof EN_POLICY_FRAMING;
  hops: EnHopRecord[];
  next: typeof NEXT_PHASE_TITLE;
};

export function bootstrapDealContractIntelligenceOs(repoRoot?: string): DealOsBootstrap {
  const softWire = enSoftWireSnapshot(repoRoot);
  const locksIntact = assertEnLocksIntact();
  const roster = buildDealTeamRoster();

  const hops: EnHopRecord[] = [
    hop('honesty_locks', locksIntact ? 'PASS' : 'FAIL', HONESTY_BANNER),
    hop('deal_os_bootstrap', 'IMPLEMENTED', 'Deal & Contract Intelligence OS contracts loaded.'),
    hop('deal_team_roster', 'IMPLEMENTED', `Roster size=${roster.length}; recommend≠act.`),
    hop('recommend_neq_act', 'PASS', 'EN_LOCKS.RECOMMEND_EQ_ACT=false'),
    hop('agent_cannot_self_expand_authority', 'PASS', 'Self-expand authority DENIED.'),
    hop('lesson_neq_guarantee', 'PASS', 'Lessons ≠ guarantee strategy works today.'),
    hop('no_hidden_cot_storage', 'PASS', 'Hidden CoT storage locked false.'),
    hop('unconfigured_unavailable', 'UNAVAILABLE', 'SAM/FAR unconfigured → UNAVAILABLE.'),
    hop('policy_framing_not_legal_advice', 'PASS', EN_POLICY_FRAMING.publicTrust),
    hop('legalshield_unavailable_until_authorized', 'UNAVAILABLE', EN_POLICY_FRAMING.notAttorney),
    hop('pricing_scenario_recommend_neq_bind', 'PASS', 'Recommend ≠ bind price.'),
    hop('no_auto_submit', 'DENIED', 'AUTO_SUBMIT_BID=false'),
    hop('no_auto_sign', 'DENIED', 'AUTO_SIGN_CERTIFICATION=false'),
    hop('no_auto_certify', 'DENIED', 'Certifications require human authority.'),
    hop('no_auto_accept', 'DENIED', 'AUTO_ACCEPT_CONTRACT=false'),
    hop(
      'em_home_base_return_receipt_soft_wire',
      softWire.em157HomeBaseRuntime.present ? 'IMPLEMENTED' : 'WAITING_DATA',
      softWire.em157HomeBaseRuntime.note,
    ),
    hop(
      'em157_pricing_council_soft_wire',
      softWire.em157PricingCouncilSurface.present ? 'IMPLEMENTED' : 'WAITING_DATA',
      softWire.em157PricingCouncilSurface.note,
    ),
    hop(
      'dr_ds_negotiation_honesty_soft_wire',
      softWire.drNegotiationHonesty.present || softWire.dsDealSimulationHonesty.present
        ? 'IMPLEMENTED'
        : 'WAITING_DATA',
      `DR=${softWire.drNegotiationHonesty.present}; DS_sim=${softWire.dsDealSimulationHonesty.present}; DS_types=${softWire.dsRevenueOsTypes.present}`,
    ),
    hop('gov_contract_flow_encoded', 'IMPLEMENTED', GOVERNMENT_CONTRACT_FLOW.join(' → ')),
    hop('evidence', 'IMPLEMENTED', 'Structured evidence / denial paths ready.'),
  ];

  return {
    sotIssue: GITHUB_SOT_ISSUE,
    sotTitle: GITHUB_SOT_TITLE,
    gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    banner: HONESTY_BANNER,
    locksIntact,
    l4AutonomyEnabled: false,
    dbCandidates: EN_DB_CANDIDATES_STATUS,
    softWire,
    roster,
    govFlow: GOVERNMENT_CONTRACT_FLOW,
    may: EN_MAY,
    mustNot: EN_MUST_NOT,
    policyFraming: EN_POLICY_FRAMING,
    hops,
    next: NEXT_PHASE_TITLE,
  };
}

export function runGovernmentContractCycle(input: {
  actor: EnActor;
  opportunityId: string;
  title: string;
}): {
  deal: DealHomeObject;
  sam: ReturnType<typeof probeSamGovAdapter>;
  far: ReturnType<typeof probeFarResearchAdapter>;
  bidNoBid: BidNoBidRecommendation | { denied: true; state: 'DENIED'; reason: string };
  capture: CapturePlan;
  compliance: ComplianceMatrix | { denied: true; state: 'DENIED'; reason: string };
  pricing: PricingScenario | { denied: true; state: 'DENIED'; reason: string };
  proposal: ProposalDraft | { denied: true; state: 'DENIED'; reason: string };
  negotiation: NegotiationPlan | { denied: true; state: 'DENIED'; reason: string };
  humanGate: DealGateResult;
  package: SubmissionPackage;
  hops: EnHopRecord[];
} {
  const hops: EnHopRecord[] = [];
  let deal = registerDealHomeObject({
    opportunityId: input.opportunityId,
    kind: 'government',
    title: input.title,
    actor: input.actor,
  });
  hops.push(hop('deal_home_object_register', 'REGISTERED', deal.opportunityId));

  const sam = probeSamGovAdapter();
  hops.push(hop('sam_gov_adapter_probe', 'UNAVAILABLE', 'SAM.gov unconfigured.'));
  const far = probeFarResearchAdapter();
  hops.push(hop('far_research_adapter_probe', 'UNAVAILABLE', 'FAR adapter unconfigured.'));

  deal = advanceOpportunityLifecycle(deal, 'BID_NO_BID', 'bid_no_bid');
  const bidNoBid = recommendBidNoBid({
    decisionId: `bnb-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    recommendation: 'BID',
    rationale: 'Advisory qualification only — human decides.',
  });
  hops.push(hop('bid_no_bid_gate', 'RECOMMENDATION_ONLY', 'Bid/No-Bid advisory.'));

  const capture = draftCapturePlan({
    planId: `cap-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    themes: ['best_value', 'integrity'],
    discriminators: ['local_first', 'evidence_grade'],
  });
  hops.push(hop('capture_plan_draft', 'PLAN_ONLY', capture.planId));

  const compliance = buildComplianceMatrix({
    matrixId: `cm-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    rows: [{ requirementId: 'FAR-ref-demo', proposalSection: 'compliance', status: 'advisory' }],
  });
  hops.push(hop('compliance_matrix_build', 'ADVISORY_ONLY', 'Compliance matrix advisory.'));

  const pricing = openPricingScenario({
    scenarioId: `price-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    recommendedPriceUsd: 250000,
    marginEstimate: 0.28,
  });
  hops.push(hop('pricing_scenario_recommend_neq_bind', 'RECOMMENDATION_ONLY', 'Price scenario unbound.'));

  const proposal = draftProposal({
    proposalId: `prop-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    sections: ['technical', 'management', 'price', 'compliance'],
  });
  hops.push(hop('proposal_war_room', 'PLAN_ONLY', 'Proposal draft prepared.'));

  const negotiation = draftNegotiationPlan({
    planId: `neg-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    batna: 'walk',
    walkAway: 180000,
    target: 250000,
    concessions: ['optional_option_year'],
  });
  hops.push(hop('human_approval_required', 'HUMAN_APPROVAL_REQUIRED', 'Negotiation advisory.'));

  const humanGate = requireHumanDealApproval({
    decisionId: `gate-${input.opportunityId}`,
    action: 'submit_bid',
    actor: input.actor,
  });
  hops.push(
    hop('human_approval_required', humanGate.state, humanGate.reason),
  );

  const pkg = prepareSubmissionPackage({
    packageId: `pkg-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    proposalId: `prop-${input.opportunityId}`,
    actor: input.actor,
  });
  hops.push(
    hop(
      'no_auto_submit',
      'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED',
      `prepared=${pkg.prepared}; submittedByXiv=${pkg.submittedByXiv}`,
    ),
  );

  return {
    deal,
    sam,
    far,
    bidNoBid,
    capture,
    compliance,
    pricing,
    proposal,
    negotiation,
    humanGate,
    package: pkg,
    hops,
  };
}

export function dealContractIntelligenceOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    locks: EN_LOCKS,
    may: EN_MAY,
    mustNot: EN_MUST_NOT,
    cycle: DEAL_CONTRACT_INTELLIGENCE_OS_CYCLE,
    govFlow: GOVERNMENT_CONTRACT_FLOW,
  };
}
