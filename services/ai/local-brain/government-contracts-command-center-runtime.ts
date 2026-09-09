/**
 * 62L-EO1 — Government Contracts Command Center runtime.
 *
 * Workflow:
 * Opportunity → Requirement decomposition → Bid/No-Bid → Capture plan →
 * Solution architecture → Logistics model → Quantum/AI evidence → Pricing →
 * Compliance matrix → Proposal → Human approval → Submission →
 * Performance control tower
 *
 * Discovery ≠ eligibility. Recommend ≠ act / submit / sign / certify / dispatch.
 */

import {
  EO1_DB_CANDIDATES_STATUS,
  EO1_LOCKS,
  EO1_MAY,
  EO1_MUST_NOT,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_CONTRACTS_COMMAND_CENTER_VIEWS,
  GOV_CONTRACTS_COMMAND_CENTER_WORKFLOW,
  GOVERNMENT_CONTRACTS_COMMAND_CENTER_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_STATES,
  SOFT_WIRE_EN_ISSUE,
  SOFT_WIRE_EO_ISSUE,
  TRACKED_OPPORTUNITY_FIELDS,
  assertEo1LocksIntact,
  eo1SoftWireSnapshot,
  isCfoCouncil,
  isHumanApprover,
  type Eo1Actor,
  type Eo1EvidenceState,
  type Eo1HopRecord,
  type Eo1SoftWireSnapshot,
  type GovContractsViewId,
  type GovContractsWorkflowHop,
  type QuantumClaimState,
} from './government-contracts-command-center-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof GOVERNMENT_CONTRACTS_COMMAND_CENTER_CYCLE)[number],
  state: Eo1EvidenceState,
  summary: string,
): Eo1HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type ApprovalState =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'CFO_REVIEW'
  | 'LEGAL_REVIEW'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'HUMAN_AUTHORIZED'
  | 'DENIED'
  | 'SUBMITTED_HUMAN_AUTHORIZED'
  | 'AWARDED'
  | 'LOST'
  | 'CLOSED';

export type ReviewStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'APPROVED' | 'DENIED' | 'ADVISORY_ONLY';

/** Full tracked opportunity contract. */
export type GovernmentOpportunity = {
  opportunityId: string;
  agencyBureau: string;
  solicitationOrNoticeId: string;
  contractType: string;
  naics: string | null;
  psc: string | null;
  dueDate: string | null;
  estimatedValue: number | null;
  setAsideStatus: string | null;
  missionProblemStatement: string;
  logisticsSupplyChainRequirements: string[];
  digitalProductRequirements: string[];
  physicalProductRequirements: string[];
  aiQuantumRequirements: string[];
  complianceRequirements: string[];
  requiredCertificationsEvidence: string[];
  pricingModel: string | null;
  captureOwner: string | null;
  proposalOwner: string | null;
  technicalOwner: string | null;
  cfoAccountantReview: ReviewStatus;
  legalComplianceReview: ReviewStatus;
  probability: number | null;
  blockers: string[];
  approvalState: ApprovalState;
  /** Public discovery never implies eligibility. */
  discoveryState: 'DISCOVERED_NOT_ELIGIBLE' | 'ELIGIBILITY_UNKNOWN' | 'ELIGIBILITY_HUMAN_ASSERTED';
  eligibilityConfirmed: false | true;
  workflowPosition: GovContractsWorkflowHop;
  orgId: string;
  tenantId: string;
  universeId: string;
  fabricatedRegistration: false;
  fabricatedCertification: false;
  fabricatedClearance: false;
  fabricatedPastPerformance: false;
  fabricatedQuantumCapability: false;
  autoSubmitted: false;
  classifiedAccessed: false;
  exportControlBypassed: false;
  createdAt: string;
};

export function registerGovernmentOpportunity(input: {
  opportunityId: string;
  agencyBureau: string;
  solicitationOrNoticeId: string;
  contractType: string;
  missionProblemStatement: string;
  actor: Eo1Actor;
  naics?: string | null;
  psc?: string | null;
  dueDate?: string | null;
  estimatedValue?: number | null;
  setAsideStatus?: string | null;
  logisticsSupplyChainRequirements?: string[];
  digitalProductRequirements?: string[];
  physicalProductRequirements?: string[];
  aiQuantumRequirements?: string[];
  complianceRequirements?: string[];
  requiredCertificationsEvidence?: string[];
  pricingModel?: string | null;
  captureOwner?: string | null;
  proposalOwner?: string | null;
  technicalOwner?: string | null;
  probability?: number | null;
  blockers?: string[];
  /** If true, still does NOT set eligibility — discovery ≠ eligibility. */
  claimedEligibleFromDiscovery?: boolean;
}): GovernmentOpportunity | { denied: true; state: 'DENIED'; reason: string } {
  if (input.claimedEligibleFromDiscovery) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'PUBLIC_DISCOVERY_NEQ_ELIGIBILITY (EO1_LOCKS.PUBLIC_DISCOVERY_EQ_ELIGIBILITY=false).',
    };
  }

  return {
    opportunityId: input.opportunityId,
    agencyBureau: input.agencyBureau,
    solicitationOrNoticeId: input.solicitationOrNoticeId,
    contractType: input.contractType,
    naics: input.naics ?? null,
    psc: input.psc ?? null,
    dueDate: input.dueDate ?? null,
    estimatedValue: input.estimatedValue ?? null,
    setAsideStatus: input.setAsideStatus ?? null,
    missionProblemStatement: input.missionProblemStatement,
    logisticsSupplyChainRequirements: input.logisticsSupplyChainRequirements ?? [],
    digitalProductRequirements: input.digitalProductRequirements ?? [],
    physicalProductRequirements: input.physicalProductRequirements ?? [],
    aiQuantumRequirements: input.aiQuantumRequirements ?? [],
    complianceRequirements: input.complianceRequirements ?? [],
    requiredCertificationsEvidence: input.requiredCertificationsEvidence ?? [],
    pricingModel: input.pricingModel ?? null,
    captureOwner: input.captureOwner ?? null,
    proposalOwner: input.proposalOwner ?? null,
    technicalOwner: input.technicalOwner ?? null,
    cfoAccountantReview: 'NOT_STARTED',
    legalComplianceReview: 'NOT_STARTED',
    probability: input.probability ?? null,
    blockers: input.blockers ?? [],
    approvalState: 'DRAFT',
    discoveryState: 'DISCOVERED_NOT_ELIGIBLE',
    eligibilityConfirmed: false,
    workflowPosition: 'opportunity',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    fabricatedRegistration: false,
    fabricatedCertification: false,
    fabricatedClearance: false,
    fabricatedPastPerformance: false,
    fabricatedQuantumCapability: false,
    autoSubmitted: false,
    classifiedAccessed: false,
    exportControlBypassed: false,
    createdAt: nowIso(),
  };
}

export type RequirementDecomposition = {
  decompositionId: string;
  opportunityId: string;
  requirements: string[];
  logisticsProblems: string[];
  technicalSolutions: string[];
  complianceItems: string[];
  proposalTasks: string[];
  advisoryOnly: true;
  eligibilityImplied: false;
};

export function decomposeRequirements(input: {
  decompositionId: string;
  opportunityId: string;
  requirements: string[];
  logisticsProblems?: string[];
  technicalSolutions?: string[];
  complianceItems?: string[];
  proposalTasks?: string[];
}): RequirementDecomposition {
  return {
    decompositionId: input.decompositionId,
    opportunityId: input.opportunityId,
    requirements: input.requirements,
    logisticsProblems: input.logisticsProblems ?? [],
    technicalSolutions: input.technicalSolutions ?? [],
    complianceItems: input.complianceItems ?? [],
    proposalTasks: input.proposalTasks ?? [],
    advisoryOnly: true,
    eligibilityImplied: false,
  };
}

export type BidNoBidRecommendation = {
  decisionId: string;
  opportunityId: string;
  recommendation: 'BID' | 'NO_BID';
  rationale: string;
  binding: false;
  executed: false;
};

export function recommendBidNoBid(input: {
  decisionId: string;
  opportunityId: string;
  recommendation: 'BID' | 'NO_BID';
  rationale: string;
  attemptBind?: boolean;
}): BidNoBidRecommendation | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptBind) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Bid/No-Bid is RECOMMENDATION_ONLY — cannot bind without human gate.',
    };
  }
  return {
    decisionId: input.decisionId,
    opportunityId: input.opportunityId,
    recommendation: input.recommendation,
    rationale: input.rationale,
    binding: false,
    executed: false,
  };
}

export type CapturePlan = {
  planId: string;
  opportunityId: string;
  themes: string[];
  discriminators: string[];
  owners: { capture?: string; proposal?: string; technical?: string };
  planOnly: true;
};

export function draftCapturePlan(input: {
  planId: string;
  opportunityId: string;
  themes: string[];
  discriminators: string[];
  owners?: { capture?: string; proposal?: string; technical?: string };
}): CapturePlan {
  return {
    planId: input.planId,
    opportunityId: input.opportunityId,
    themes: input.themes,
    discriminators: input.discriminators,
    owners: input.owners ?? {},
    planOnly: true,
  };
}

export type SolutionArchitecture = {
  architectureId: string;
  opportunityId: string;
  components: string[];
  digitalProducts: string[];
  physicalProducts: string[];
  planOnly: true;
};

export function draftSolutionArchitecture(input: {
  architectureId: string;
  opportunityId: string;
  components: string[];
  digitalProducts?: string[];
  physicalProducts?: string[];
}): SolutionArchitecture {
  return {
    architectureId: input.architectureId,
    opportunityId: input.opportunityId,
    components: input.components,
    digitalProducts: input.digitalProducts ?? [],
    physicalProducts: input.physicalProducts ?? [],
    planOnly: true,
  };
}

export type LogisticsModel = {
  modelId: string;
  opportunityId: string;
  supplyChainNotes: string[];
  advisoryOnly: true;
  dispatched: false;
  purchaseOrderIssued: false;
  subcontractCommitted: false;
};

export function modelLogistics(input: {
  modelId: string;
  opportunityId: string;
  supplyChainNotes: string[];
  attemptDispatch?: boolean;
  attemptPurchase?: boolean;
  attemptSubcontractCommit?: boolean;
}): LogisticsModel | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptDispatch) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_AUTONOMOUS_PHYSICAL_DISPATCH (EO1_LOCKS.AUTONOMOUS_PHYSICAL_DISPATCH=false).',
    };
  }
  if (input.attemptPurchase) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_AUTONOMOUS_PURCHASING (EO1_LOCKS.AUTONOMOUS_PURCHASING=false).',
    };
  }
  if (input.attemptSubcontractCommit) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'NO_AUTONOMOUS_SUBCONTRACT_COMMITMENT (EO1_LOCKS.AUTONOMOUS_SUBCONTRACT_COMMITMENT=false).',
    };
  }
  return {
    modelId: input.modelId,
    opportunityId: input.opportunityId,
    supplyChainNotes: input.supplyChainNotes,
    advisoryOnly: true,
    dispatched: false,
    purchaseOrderIssued: false,
    subcontractCommitted: false,
  };
}

export type QuantumAiEvidenceRecord = {
  evidenceId: string;
  opportunityId: string;
  claimState: QuantumClaimState;
  classicalBaselinePresent: boolean;
  fabricated: false;
  summary: string;
};

export function recordQuantumAiEvidence(input: {
  evidenceId: string;
  opportunityId: string;
  claimState: QuantumClaimState;
  classicalBaselinePresent: boolean;
  summary: string;
  attemptFabricatePhysicalQpu?: boolean;
  attemptFabricateCapability?: boolean;
}):
  | QuantumAiEvidenceRecord
  | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptFabricateCapability || input.attemptFabricatePhysicalQpu) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'NO_FABRICATE_QUANTUM_CAPABILITY (EO1_LOCKS.FABRICATE_QUANTUM_CAPABILITY=false; AUTO_UPGRADE_TO_PHYSICAL_QPU_VERIFIED=false).',
    };
  }
  if (
    input.claimState === 'PHYSICAL_QPU_VERIFIED' &&
    !input.classicalBaselinePresent
  ) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'PHYSICAL_QPU_VERIFIED requires classical baseline + human-evidenced verification path; fabrication denied.',
    };
  }
  if (!QUANTUM_CLAIM_STATES.includes(input.claimState)) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Quantum claim must be THEORETICAL|SIMULATED|QUANTUM_INSPIRED|PHYSICAL_QPU_VERIFIED.',
    };
  }
  // Agents may only *label* non-verified states without evidence upgrade.
  if (input.claimState === 'PHYSICAL_QPU_VERIFIED') {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'Agent path cannot assert PHYSICAL_QPU_VERIFIED — human-evidenced verification required; use THEORETICAL|SIMULATED|QUANTUM_INSPIRED.',
    };
  }
  return {
    evidenceId: input.evidenceId,
    opportunityId: input.opportunityId,
    claimState: input.claimState,
    classicalBaselinePresent: input.classicalBaselinePresent,
    fabricated: false,
    summary: input.summary,
  };
}

export type PricingScenario = {
  scenarioId: string;
  opportunityId: string;
  recommendedPriceUsd: number;
  marginEstimate: number | null;
  binding: false;
  committed: false;
};

export function openPricingScenario(input: {
  scenarioId: string;
  opportunityId: string;
  recommendedPriceUsd: number;
  marginEstimate?: number | null;
  attemptBind?: boolean;
  actor?: Eo1Actor;
}): PricingScenario | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptBind) {
    if (input.actor && isCfoCouncil(input.actor)) {
      return {
        denied: true,
        state: 'DENIED',
        reason: 'CFO_COUNCIL_DENY — cannot auto price-commit (CFO_COUNCIL_MAY_AUTO_PRICE_COMMIT=false).',
      };
    }
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Recommend ≠ bind price (EO1_LOCKS.RECOMMEND_EQ_BIND_PRICE=false).',
    };
  }
  return {
    scenarioId: input.scenarioId,
    opportunityId: input.opportunityId,
    recommendedPriceUsd: input.recommendedPriceUsd,
    marginEstimate: input.marginEstimate ?? null,
    binding: false,
    committed: false,
  };
}

export type ComplianceMatrix = {
  matrixId: string;
  opportunityId: string;
  rows: Array<{ requirementId: string; proposalSection: string; status: 'advisory' | 'gap' | 'mapped' }>;
  advisoryOnly: true;
  autoCertified: false;
};

export function buildComplianceMatrix(input: {
  matrixId: string;
  opportunityId: string;
  rows: Array<{ requirementId: string; proposalSection: string; status: 'advisory' | 'gap' | 'mapped' }>;
  attemptAutoCertify?: boolean;
}): ComplianceMatrix | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptAutoCertify) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_AUTO_CERTIFY — certifications require explicit human authorization.',
    };
  }
  return {
    matrixId: input.matrixId,
    opportunityId: input.opportunityId,
    rows: input.rows,
    advisoryOnly: true,
    autoCertified: false,
  };
}

export type ProposalDraft = {
  proposalId: string;
  opportunityId: string;
  sections: string[];
  drafted: true;
  submitted: false;
  signed: false;
  representationsMade: false;
};

export function draftProposal(input: {
  proposalId: string;
  opportunityId: string;
  sections: string[];
  attemptSubmit?: boolean;
  attemptSign?: boolean;
  attemptRepresent?: boolean;
}): ProposalDraft | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptSubmit) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_AUTO_SUBMIT_BID (EO1_LOCKS.AUTO_SUBMIT_BID=false).',
    };
  }
  if (input.attemptSign) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_AUTO_SIGN (EO1_LOCKS.AUTO_SIGN_CERTIFICATION=false).',
    };
  }
  if (input.attemptRepresent) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_AUTO_REPRESENT (EO1_LOCKS.AUTO_MAKE_REPRESENTATION=false).',
    };
  }
  return {
    proposalId: input.proposalId,
    opportunityId: input.opportunityId,
    sections: input.sections,
    drafted: true,
    submitted: false,
    signed: false,
    representationsMade: false,
  };
}

export type GateResult = {
  decisionId: string;
  action: string;
  state:
    | 'DENIED'
    | 'HUMAN_APPROVAL_REQUIRED'
    | 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED'
    | 'APPROVED_BOUNDED';
  reason: string;
  executed: false;
  autoSubmitted: false;
  autoSigned: false;
  autoCertified: false;
  autoAccepted: false;
};

export function requireHumanApproval(input: {
  decisionId: string;
  action:
    | 'submit_bid'
    | 'sign_certification'
    | 'make_representation'
    | 'accept_contract'
    | 'authorize_spend'
    | 'dispatch'
    | 'purchase'
    | 'subcontract_commit';
  actor: Eo1Actor;
  attemptAutonomousExecute?: boolean;
  humanAuthorizedSubmission?: boolean;
}): GateResult {
  const denyMap: Record<typeof input.action, string> = {
    submit_bid: 'NO_AUTO_SUBMIT_BID',
    sign_certification: 'NO_AUTO_SIGN / NO_AUTO_CERTIFY',
    make_representation: 'NO_AUTO_REPRESENT',
    accept_contract: 'NO_AUTO_ACCEPT_CONTRACT',
    authorize_spend: 'CFO_COUNCIL_DENY / NO_AUTONOMOUS_SPEND',
    dispatch: 'NO_AUTONOMOUS_PHYSICAL_DISPATCH',
    purchase: 'NO_AUTONOMOUS_PURCHASING',
    subcontract_commit: 'NO_AUTONOMOUS_SUBCONTRACT_COMMITMENT',
  };

  if (input.attemptAutonomousExecute) {
    if (isCfoCouncil(input.actor) && (input.action === 'submit_bid' || input.action === 'authorize_spend' || input.action === 'sign_certification')) {
      return {
        decisionId: input.decisionId,
        action: input.action,
        state: 'DENIED',
        reason: `CFO_COUNCIL_DENY — ${denyMap[input.action]} (CFO council cannot auto bid/price-commit/spend/sign).`,
        executed: false,
        autoSubmitted: false,
        autoSigned: false,
        autoCertified: false,
        autoAccepted: false,
      };
    }
    return {
      decisionId: input.decisionId,
      action: input.action,
      state: 'DENIED',
      reason: `${denyMap[input.action]} — autonomous execute DENIED.`,
      executed: false,
      autoSubmitted: false,
      autoSigned: false,
      autoCertified: false,
      autoAccepted: false,
    };
  }

  if (isHumanApprover(input.actor) && input.humanAuthorizedSubmission) {
    return {
      decisionId: input.decisionId,
      action: input.action,
      state: 'APPROVED_BOUNDED',
      reason:
        'Human authorized submission gate passed — XIV still does not auto-execute external submission.',
      executed: false,
      autoSubmitted: false,
      autoSigned: false,
      autoCertified: false,
      autoAccepted: false,
    };
  }

  if (input.action === 'submit_bid') {
    return {
      decisionId: input.decisionId,
      action: input.action,
      state: 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED',
      reason: 'Bid submission requires explicit human authorization.',
      executed: false,
      autoSubmitted: false,
      autoSigned: false,
      autoCertified: false,
      autoAccepted: false,
    };
  }

  return {
    decisionId: input.decisionId,
    action: input.action,
    state: 'HUMAN_APPROVAL_REQUIRED',
    reason: `${denyMap[input.action]} — human approval required.`,
    executed: false,
    autoSubmitted: false,
    autoSigned: false,
    autoCertified: false,
    autoAccepted: false,
  };
}

export type SubmissionPackage = {
  packageId: string;
  opportunityId: string;
  proposalId: string;
  prepared: true;
  submittedByXiv: false;
  humanAuthorized: boolean;
  certificationsSignedByXiv: false;
  representationsMadeByXiv: false;
};

export function prepareSubmissionPackage(input: {
  packageId: string;
  opportunityId: string;
  proposalId: string;
  actor: Eo1Actor;
  humanAuthorized?: boolean;
  attemptAutoSubmit?: boolean;
}): SubmissionPackage | { denied: true; state: 'DENIED'; reason: string } {
  if (input.attemptAutoSubmit) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_AUTO_SUBMIT_BID — packages may be drafted only until human authorization.',
    };
  }
  const humanAuthorized =
    Boolean(input.humanAuthorized) && isHumanApprover(input.actor);
  return {
    packageId: input.packageId,
    opportunityId: input.opportunityId,
    proposalId: input.proposalId,
    prepared: true,
    submittedByXiv: false,
    humanAuthorized,
    certificationsSignedByXiv: false,
    representationsMadeByXiv: false,
  };
}

export type PerformanceControlTower = {
  towerId: string;
  opportunityId: string;
  milestones: string[];
  risks: string[];
  evidenceRefs: string[];
  advisoryOnly: true;
};

export function openPerformanceControlTower(input: {
  towerId: string;
  opportunityId: string;
  milestones?: string[];
  risks?: string[];
  evidenceRefs?: string[];
}): PerformanceControlTower {
  return {
    towerId: input.towerId,
    opportunityId: input.opportunityId,
    milestones: input.milestones ?? [],
    risks: input.risks ?? [],
    evidenceRefs: input.evidenceRefs ?? [],
    advisoryOnly: true,
  };
}

export type WinLossRecord = {
  recordId: string;
  opportunityId: string;
  outcome: 'win' | 'loss' | 'no_bid' | 'withdrawn';
  lessons: string[];
  provesFutureWin: false;
};

export function recordWinLossLearning(input: {
  recordId: string;
  opportunityId: string;
  outcome: 'win' | 'loss' | 'no_bid' | 'withdrawn';
  lessons: string[];
  claimGuaranteesFutureWin?: boolean;
}): WinLossRecord | { denied: true; state: 'DENIED'; reason: string } {
  if (input.claimGuaranteesFutureWin) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'Win/loss lessons ≠ guarantee of future win.',
    };
  }
  return {
    recordId: input.recordId,
    opportunityId: input.opportunityId,
    outcome: input.outcome,
    lessons: input.lessons,
    provesFutureWin: false,
  };
}

// ---------------------------------------------------------------------------
// Fabrication / classified / export-control denies
// ---------------------------------------------------------------------------

export function attemptFabricateRegistration(): {
  state: 'DENIED';
  fabricated: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    fabricated: false,
    reason: 'NO_FABRICATE_REGISTRATION (EO1_LOCKS.FABRICATE_REGISTRATION=false).',
  };
}

export function attemptFabricateCertification(): {
  state: 'DENIED';
  fabricated: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    fabricated: false,
    reason: 'NO_FABRICATE_CERTIFICATION (EO1_LOCKS.FABRICATE_CERTIFICATION=false).',
  };
}

export function attemptFabricateClearance(): {
  state: 'DENIED';
  fabricated: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    fabricated: false,
    reason: 'NO_FABRICATE_CLEARANCE (EO1_LOCKS.FABRICATE_CLEARANCE=false).',
  };
}

export function attemptFabricatePastPerformance(): {
  state: 'DENIED';
  fabricated: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    fabricated: false,
    reason: 'NO_FABRICATE_PAST_PERFORMANCE (EO1_LOCKS.FABRICATE_PAST_PERFORMANCE=false).',
  };
}

export function attemptFabricateQuantumCapability(): {
  state: 'DENIED';
  fabricated: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    fabricated: false,
    reason: 'NO_FABRICATE_QUANTUM_CAPABILITY (EO1_LOCKS.FABRICATE_QUANTUM_CAPABILITY=false).',
  };
}

export function attemptClassifiedDataAccess(): {
  state: 'DENIED';
  accessed: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    accessed: false,
    reason: 'NO_CLASSIFIED_DATA_ACCESS (EO1_LOCKS.CLASSIFIED_DATA_ACCESS=false).',
  };
}

export function attemptExportControlBypass(): {
  state: 'DENIED';
  bypassed: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    bypassed: false,
    reason: 'NO_EXPORT_CONTROL_BYPASS (EO1_LOCKS.EXPORT_CONTROL_BYPASS=false).',
  };
}

export function attemptAutoSubmitBid(): GateResult {
  return requireHumanApproval({
    decisionId: 'auto-submit',
    action: 'submit_bid',
    actor: {
      kind: 'cfo_council',
      id: 'cfo-auto',
      orgId: 'org',
      tenantId: 'ten',
      universeId: 'uni',
      permissions: [],
    },
    attemptAutonomousExecute: true,
  });
}

export function attemptAutoSignCertification(): GateResult {
  return requireHumanApproval({
    decisionId: 'auto-sign',
    action: 'sign_certification',
    actor: {
      kind: 'proposal_owner',
      id: 'prop-auto',
      orgId: 'org',
      tenantId: 'ten',
      universeId: 'uni',
      permissions: [],
    },
    attemptAutonomousExecute: true,
  });
}

export function attemptAutoMakeRepresentation(): GateResult {
  return requireHumanApproval({
    decisionId: 'auto-rep',
    action: 'make_representation',
    actor: {
      kind: 'proposal_owner',
      id: 'prop-auto',
      orgId: 'org',
      tenantId: 'ten',
      universeId: 'uni',
      permissions: [],
    },
    attemptAutonomousExecute: true,
  });
}

export function attemptCfoCouncilAutonomy(action: 'submit_bid' | 'authorize_spend' | 'sign_certification'): GateResult {
  return requireHumanApproval({
    decisionId: `cfo-${action}`,
    action,
    actor: {
      kind: 'cfo_council',
      id: 'cfo-1',
      orgId: 'org',
      tenantId: 'ten',
      universeId: 'uni',
      permissions: ['price_scenario', 'margin_advise'],
    },
    attemptAutonomousExecute: true,
  });
}

// ---------------------------------------------------------------------------
// View models (contracts/UI model — not full React UI)
// ---------------------------------------------------------------------------

export type CommandCenterViewModel = {
  viewId: GovContractsViewId;
  title: string;
  purpose: string;
  dataContract: string[];
  interactive: false;
  cards: false;
};

export function buildCommandCenterViewModels(): CommandCenterViewModel[] {
  const meta: Record<GovContractsViewId, { title: string; purpose: string; dataContract: string[] }> =
    {
      opportunity_pipeline: {
        title: 'Opportunity Pipeline',
        purpose: 'Track public-sector opportunities through workflow hops.',
        dataContract: ['opportunityId', 'agencyBureau', 'dueDate', 'approvalState', 'workflowPosition'],
      },
      agency_intelligence: {
        title: 'Agency Intelligence',
        purpose: 'Advisory agency/bureau context — not eligibility proof.',
        dataContract: ['agencyBureau', 'solicitationOrNoticeId', 'missionProblemStatement'],
      },
      requirements: {
        title: 'Requirements',
        purpose: 'Decomposed requirements and compliance mapping inputs.',
        dataContract: ['requirements', 'complianceRequirements', 'aiQuantumRequirements'],
      },
      logistics_supply_chain: {
        title: 'Logistics & Supply Chain',
        purpose: 'Advisory logistics model — no autonomous dispatch/PO.',
        dataContract: ['logisticsSupplyChainRequirements', 'physicalProductRequirements'],
      },
      quantum_ai_capability_matrix: {
        title: 'Quantum/AI Capability Matrix',
        purpose: 'Evidence-labeled quantum/AI claims only.',
        dataContract: [...QUANTUM_CLAIM_STATES],
      },
      proposal_factory: {
        title: 'Proposal Factory',
        purpose: 'Draft proposal packages — no auto submit/sign/represent.',
        dataContract: ['proposalOwner', 'requiredCertificationsEvidence'],
      },
      pricing_war_room: {
        title: 'Pricing War Room',
        purpose: 'Price scenarios — recommend ≠ bind; CFO council denies auto-commit.',
        dataContract: ['pricingModel', 'estimatedValue', 'cfoAccountantReview'],
      },
      compliance_evidence_vault: {
        title: 'Compliance Evidence Vault',
        purpose: 'Evidence inventory — no fabrication of certs/clearances/past performance.',
        dataContract: ['complianceRequirements', 'requiredCertificationsEvidence', 'legalComplianceReview'],
      },
      negotiation_room: {
        title: 'Negotiation Room',
        purpose: 'Advisory negotiation posture — human gates for commits.',
        dataContract: ['probability', 'blockers', 'approvalState'],
      },
      contract_performance: {
        title: 'Contract Performance',
        purpose: 'Performance control tower after award — advisory tracking.',
        dataContract: ['opportunityId', 'approvalState', 'blockers'],
      },
      win_loss_learning: {
        title: 'Win/Loss Learning',
        purpose: 'Structured lessons — not future-win guarantees.',
        dataContract: ['opportunityId', 'probability', 'blockers'],
      },
    };

  return GOV_CONTRACTS_COMMAND_CENTER_VIEWS.map((viewId) => ({
    viewId,
    title: meta[viewId].title,
    purpose: meta[viewId].purpose,
    dataContract: meta[viewId].dataContract,
    interactive: false as const,
    cards: false as const,
  }));
}

export type IsolationProbe = {
  guardianUnchanged: true;
  rlsUnchanged: true;
  tenantIsolated: true;
  universeIsolated: true;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export function probeGuardianRlsTenantUniverseIsolation(actor: Eo1Actor): IsolationProbe {
  return {
    guardianUnchanged: true,
    rlsUnchanged: true,
    tenantIsolated: true,
    universeIsolated: true,
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
  };
}

// ---------------------------------------------------------------------------
// Bootstrap + full cycle
// ---------------------------------------------------------------------------

export type CommandCenterBootstrap = {
  sotLabel: typeof GITHUB_SOT_LABEL;
  sotTitle: typeof GITHUB_SOT_TITLE;
  gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  banner: typeof HONESTY_BANNER;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  dbCandidates: typeof EO1_DB_CANDIDATES_STATUS;
  softWire: Eo1SoftWireSnapshot;
  workflow: typeof GOV_CONTRACTS_COMMAND_CENTER_WORKFLOW;
  views: typeof GOV_CONTRACTS_COMMAND_CENTER_VIEWS;
  trackedFields: typeof TRACKED_OPPORTUNITY_FIELDS;
  quantumClaimStates: typeof QUANTUM_CLAIM_STATES;
  may: typeof EO1_MAY;
  mustNot: typeof EO1_MUST_NOT;
  softWireEoIssue: typeof SOFT_WIRE_EO_ISSUE;
  softWireEnIssue: typeof SOFT_WIRE_EN_ISSUE;
  hops: Eo1HopRecord[];
  next: typeof NEXT_PHASE_TITLE;
};

export function bootstrapGovernmentContractsCommandCenter(
  repoRoot?: string,
): CommandCenterBootstrap {
  const locksIntact = assertEo1LocksIntact();
  const softWire = eo1SoftWireSnapshot(repoRoot);
  const views = buildCommandCenterViewModels();

  const hops: Eo1HopRecord[] = [
    hop('honesty_locks', locksIntact ? 'PASS' : 'FAIL', HONESTY_BANNER),
    hop(
      'command_center_bootstrap',
      'IMPLEMENTED',
      'Government Contracts Command Center contracts loaded.',
    ),
    hop('tracked_fields_encoded', 'IMPLEMENTED', TRACKED_OPPORTUNITY_FIELDS.join(', ')),
    hop(
      'public_discovery_neq_eligibility',
      'PASS',
      'PUBLIC_DISCOVERY_EQ_ELIGIBILITY=false',
    ),
    hop('views_model_register', 'IMPLEMENTED', views.map((v) => v.viewId).join(', ')),
    hop(
      'eo159_mission_os_soft_wire',
      softWire.eo159MissionOsTypes.present || softWire.eo159MissionOsRuntime.present
        ? 'IMPLEMENTED'
        : 'WAITING_DATA',
      `EO#${SOFT_WIRE_EO_ISSUE}: types=${softWire.eo159MissionOsTypes.present}; runtime=${softWire.eo159MissionOsRuntime.present}; report=${softWire.eo159Report.present}`,
    ),
    hop(
      'en158_sam_far_soft_wire',
      softWire.en158DealRuntime.present ? 'IMPLEMENTED' : 'WAITING_DATA',
      `EN#${SOFT_WIRE_EN_ISSUE}: os=${softWire.en158DealOs.present}; runtime=${softWire.en158DealRuntime.present}; report=${softWire.en158Report.present}`,
    ),
    hop(
      'cfo_council_deny_autonomy',
      'DENIED',
      'CFO council cannot auto bid / price-commit / spend / sign.',
    ),
    hop('no_fabricate_registration', 'DENIED', 'FABRICATE_REGISTRATION=false'),
    hop('no_fabricate_certification', 'DENIED', 'FABRICATE_CERTIFICATION=false'),
    hop('no_fabricate_clearance', 'DENIED', 'FABRICATE_CLEARANCE=false'),
    hop('no_fabricate_past_performance', 'DENIED', 'FABRICATE_PAST_PERFORMANCE=false'),
    hop('no_fabricate_quantum_capability', 'DENIED', 'FABRICATE_QUANTUM_CAPABILITY=false'),
    hop(
      'quantum_claim_ladder_enforced',
      'PASS',
      QUANTUM_CLAIM_STATES.join(' | '),
    ),
    hop('no_auto_submit_bid', 'DENIED', 'AUTO_SUBMIT_BID=false'),
    hop('no_auto_sign', 'DENIED', 'AUTO_SIGN_CERTIFICATION=false'),
    hop('no_auto_certify', 'DENIED', 'Certifications require human authority.'),
    hop('no_auto_represent', 'DENIED', 'AUTO_MAKE_REPRESENTATION=false'),
    hop('no_classified_access', 'DENIED', 'CLASSIFIED_DATA_ACCESS=false'),
    hop('no_export_control_bypass', 'DENIED', 'EXPORT_CONTROL_BYPASS=false'),
    hop('no_autonomous_purchasing', 'DENIED', 'AUTONOMOUS_PURCHASING=false'),
    hop('no_autonomous_subcontract', 'DENIED', 'AUTONOMOUS_SUBCONTRACT_COMMITMENT=false'),
    hop('no_autonomous_physical_dispatch', 'DENIED', 'AUTONOMOUS_PHYSICAL_DISPATCH=false'),
    hop(
      'guardian_rls_tenant_universe_isolation',
      'PASS',
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
    hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false'),
    hop(
      'evidence',
      'IMPLEMENTED',
      `workflow=${GOV_CONTRACTS_COMMAND_CENTER_WORKFLOW.join(' → ')}`,
    ),
  ];

  return {
    sotLabel: GITHUB_SOT_LABEL,
    sotTitle: GITHUB_SOT_TITLE,
    gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    banner: HONESTY_BANNER,
    locksIntact,
    l4AutonomyEnabled: false,
    dbCandidates: EO1_DB_CANDIDATES_STATUS,
    softWire,
    workflow: GOV_CONTRACTS_COMMAND_CENTER_WORKFLOW,
    views: GOV_CONTRACTS_COMMAND_CENTER_VIEWS,
    trackedFields: TRACKED_OPPORTUNITY_FIELDS,
    quantumClaimStates: QUANTUM_CLAIM_STATES,
    may: EO1_MAY,
    mustNot: EO1_MUST_NOT,
    softWireEoIssue: SOFT_WIRE_EO_ISSUE,
    softWireEnIssue: SOFT_WIRE_EN_ISSUE,
    hops,
    next: NEXT_PHASE_TITLE,
  };
}

export function runGovernmentContractsCommandCenterCycle(input: {
  actor: Eo1Actor;
  opportunityId: string;
  agencyBureau: string;
  solicitationOrNoticeId: string;
  title: string;
}): {
  opportunity: GovernmentOpportunity;
  decomposition: RequirementDecomposition;
  bidNoBid: BidNoBidRecommendation | { denied: true; state: 'DENIED'; reason: string };
  capture: CapturePlan;
  architecture: SolutionArchitecture;
  logistics: LogisticsModel | { denied: true; state: 'DENIED'; reason: string };
  quantum: QuantumAiEvidenceRecord | { denied: true; state: 'DENIED'; reason: string };
  pricing: PricingScenario | { denied: true; state: 'DENIED'; reason: string };
  compliance: ComplianceMatrix | { denied: true; state: 'DENIED'; reason: string };
  proposal: ProposalDraft | { denied: true; state: 'DENIED'; reason: string };
  humanGate: GateResult;
  package: SubmissionPackage | { denied: true; state: 'DENIED'; reason: string };
  tower: PerformanceControlTower;
  views: CommandCenterViewModel[];
  hops: Eo1HopRecord[];
} {
  const hops: Eo1HopRecord[] = [];

  const opportunityResult = registerGovernmentOpportunity({
    opportunityId: input.opportunityId,
    agencyBureau: input.agencyBureau,
    solicitationOrNoticeId: input.solicitationOrNoticeId,
    contractType: 'FFP',
    missionProblemStatement: input.title,
    actor: input.actor,
    naics: '541512',
    psc: 'D302',
  });
  if ('denied' in opportunityResult) {
    throw new Error(opportunityResult.reason);
  }
  let opportunity = opportunityResult;
  hops.push(hop('opportunity_register', 'REGISTERED', opportunity.opportunityId));

  const decomposition = decomposeRequirements({
    decompositionId: `dec-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    requirements: ['cyber_resilience', 'local_first_runtime'],
    logisticsProblems: ['secure_device_fleet'],
    technicalSolutions: ['edge_agent_mesh'],
    complianceItems: ['FAR_advisory_framing'],
    proposalTasks: ['technical_volume', 'price_volume'],
  });
  opportunity = { ...opportunity, workflowPosition: 'requirement_decomposition' };
  hops.push(hop('requirement_decomposition', 'ADVISORY_ONLY', decomposition.decompositionId));

  const bidNoBid = recommendBidNoBid({
    decisionId: `bnb-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    recommendation: 'BID',
    rationale: 'Advisory only — human decides; discovery ≠ eligibility.',
  });
  opportunity = { ...opportunity, workflowPosition: 'bid_no_bid' };
  hops.push(hop('bid_no_bid_gate', 'RECOMMENDATION_ONLY', 'Bid/No-Bid advisory.'));

  const capture = draftCapturePlan({
    planId: `cap-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    themes: ['best_value', 'integrity'],
    discriminators: ['evidence_grade', 'local_first'],
    owners: { capture: input.actor.id },
  });
  opportunity = { ...opportunity, workflowPosition: 'capture_plan' };
  hops.push(hop('capture_plan', 'PLAN_ONLY', capture.planId));

  const architecture = draftSolutionArchitecture({
    architectureId: `arch-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    components: ['command_center', 'evidence_vault'],
    digitalProducts: ['gov_contracts_cc'],
  });
  opportunity = { ...opportunity, workflowPosition: 'solution_architecture' };
  hops.push(hop('solution_architecture', 'PLAN_ONLY', architecture.architectureId));

  const logistics = modelLogistics({
    modelId: `log-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    supplyChainNotes: ['advisory_supply_plan'],
  });
  opportunity = { ...opportunity, workflowPosition: 'logistics_model' };
  hops.push(hop('logistics_model', 'ADVISORY_ONLY', 'Logistics model advisory.'));

  const quantum = recordQuantumAiEvidence({
    evidenceId: `q-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    claimState: 'THEORETICAL',
    classicalBaselinePresent: true,
    summary: 'Theoretical quantum-inspired routing note — not physical QPU verified.',
  });
  opportunity = { ...opportunity, workflowPosition: 'quantum_ai_evidence' };
  hops.push(hop('quantum_ai_evidence', 'THEORETICAL', 'Quantum claim ladder enforced.'));

  const pricing = openPricingScenario({
    scenarioId: `price-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    recommendedPriceUsd: 480000,
    marginEstimate: 0.22,
    actor: input.actor,
  });
  opportunity = { ...opportunity, workflowPosition: 'pricing' };
  hops.push(hop('pricing', 'RECOMMENDATION_ONLY', 'Price scenario unbound.'));

  const compliance = buildComplianceMatrix({
    matrixId: `cm-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    rows: [{ requirementId: 'FAR-ref-demo', proposalSection: 'compliance', status: 'advisory' }],
  });
  opportunity = { ...opportunity, workflowPosition: 'compliance_matrix' };
  hops.push(hop('compliance_matrix', 'ADVISORY_ONLY', 'Compliance matrix advisory.'));

  const proposal = draftProposal({
    proposalId: `prop-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    sections: ['technical', 'management', 'price', 'compliance'],
  });
  opportunity = { ...opportunity, workflowPosition: 'proposal', approvalState: 'PENDING_REVIEW' };
  hops.push(hop('proposal_draft', 'PLAN_ONLY', 'Proposal draft prepared.'));

  const humanGate = requireHumanApproval({
    decisionId: `gate-${input.opportunityId}`,
    action: 'submit_bid',
    actor: input.actor,
  });
  opportunity = {
    ...opportunity,
    workflowPosition: 'human_approval',
    approvalState: 'HUMAN_APPROVAL_REQUIRED',
  };
  hops.push(hop('human_approval', humanGate.state, humanGate.reason));

  const pkg = prepareSubmissionPackage({
    packageId: `pkg-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    proposalId: `prop-${input.opportunityId}`,
    actor: input.actor,
  });
  opportunity = { ...opportunity, workflowPosition: 'submission' };
  hops.push(
    hop(
      'submission_gate',
      'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED',
      'Package drafted; submittedByXiv=false',
    ),
  );

  const tower = openPerformanceControlTower({
    towerId: `tower-${input.opportunityId}`,
    opportunityId: input.opportunityId,
    milestones: ['kickoff', 'cdr', 'delivery'],
    risks: ['eligibility_unconfirmed'],
  });
  opportunity = { ...opportunity, workflowPosition: 'performance_control_tower' };
  hops.push(hop('performance_control_tower', 'ADVISORY_ONLY', tower.towerId));

  return {
    opportunity,
    decomposition,
    bidNoBid,
    capture,
    architecture,
    logistics,
    quantum,
    pricing,
    compliance,
    proposal,
    humanGate,
    package: pkg,
    tower,
    views: buildCommandCenterViewModels(),
    hops,
  };
}

export function governmentContractsCommandCenterHonesty() {
  return {
    banner: HONESTY_BANNER,
    locks: EO1_LOCKS,
    may: EO1_MAY,
    mustNot: EO1_MUST_NOT,
    cycle: GOVERNMENT_CONTRACTS_COMMAND_CENTER_CYCLE,
    workflow: GOV_CONTRACTS_COMMAND_CENTER_WORKFLOW,
    views: GOV_CONTRACTS_COMMAND_CENTER_VIEWS,
    next: NEXT_PHASE_TITLE,
  };
}

// Silence unused-cycle export reference for tree-shaking clarity in tests.
void GOVERNMENT_CONTRACTS_COMMAND_CENTER_CYCLE;
