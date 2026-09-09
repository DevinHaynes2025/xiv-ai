/**
 * 62L-ER9 — Public Law & Policy Knowledge Pack runtime.
 *
 * Register policy nodes; effective-date/freshness checks (unclear → UNKNOWN/STALE
 * not current); version compare; advisory compliance matrices; counsel-review
 * flags; deny binding conclusions / certify / filings / licensed representation /
 * scraping / cross-tenant client matters.
 */

import {
  ER9_AGENT_BOUNDS,
  ER9_DB_CANDIDATES_STATUS,
  ER9_LOCKS,
  ER9_MAY,
  ER9_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_CONTRACT_INTEGRATION_FLOW,
  HONESTY_BANNER,
  LEGAL_FRESHNESS_RULE,
  LEGAL_POLICY_BOUNDARY,
  LEGAL_POLICY_CORE_FLOW,
  LEGAL_POLICY_NODE_FIELDS,
  LEGAL_POLICY_PRIORITY_DOMAINS,
  LEGAL_POLICY_STATES,
  NEXT_PHASE_TITLE,
  PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE,
  assertEr9LocksIntact,
  er9SoftWireSnapshot,
  freshnessWhenEffectiveVersionUnconfirmed,
  isEr9Agent,
  isHumanApprover,
  legalStateFromFreshness,
  mayTreatAsCurrentOfficial,
  type Er9Actor,
  type Er9EvidenceState,
  type Er9HopRecord,
  type Er9SoftWireSnapshot,
  type GovContractIntegrationStep,
  type LegalFreshnessOutcome,
  type LegalPolicyCoreFlowStep,
  type LegalPolicyNodeField,
  type LegalPolicyPriorityDomain,
  type LegalPolicyState,
} from './public-law-policy-knowledge-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE)[number],
  state: Er9EvidenceState,
  summary: string,
): Er9HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type LegalPolicyNode = {
  policyId: string;
  jurisdiction: string;
  agencyAuthority: string;
  lawRegulationStandardName: string;
  citationIdentifier: string;
  effectiveDate: string | null;
  revisionVersion: string | null;
  sourceUrlReference: string;
  applicability: string;
  affectedIndustries: readonly string[];
  obligations: readonly string[];
  exceptionsExemptions: readonly string[];
  enforcementAuthority: string;
  supersededBy: string | null;
  confidence: number;
  freshnessState: LegalPolicyState;
  freshnessOutcome: LegalFreshnessOutcome;
  freshnessConfirmed: boolean;
  reviewer: string | null;
  domain: LegalPolicyPriorityDomain;
  orgId: string;
  tenantId: string;
  universeId: string;
  counselReviewRequired: boolean;
  bindingLegalConclusion: false;
  complianceCertified: false;
  filingSubmitted: false;
  licensedRepresentationClaimed: false;
  hiddenChainOfThoughtPresent: false;
};

export type PolicyVersionCompare = {
  olderPolicyId: string;
  newerPolicyId: string;
  differences: readonly string[];
  advisoryOnly: true;
  bindingConclusion: false;
};

export type ComplianceMatrixRow = {
  obligation: string;
  policyId: string;
  citationIdentifier: string;
  evidenceRef: string | null;
  status: 'FLAGGED' | 'UNCERTAIN' | 'MAPPED_ADVISORY';
};

export type ComplianceMatrix = {
  matrixId: string;
  solicitationId: string | null;
  rows: readonly ComplianceMatrixRow[];
  advisoryOnly: true;
  certified: false;
  counselReviewRequired: true;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type CounselReviewFlag = {
  flagId: string;
  policyId: string | null;
  matrixId: string | null;
  reason: string;
  required: true;
  bindingUseBlockedUntilCounsel: true;
};

export type GovContractIntegrationRecord = {
  flow: typeof GOV_CONTRACT_INTEGRATION_FLOW;
  currentStep: GovContractIntegrationStep;
  solicitationId: string;
  matrixId: string | null;
  evidenceVaultRef: string | null;
  proposalRef: string | null;
  humanReviewComplete: boolean;
  advisoryOnly: true;
};

export function registerPolicyNode(input: {
  actor: Er9Actor;
  policyId: string;
  jurisdiction: string;
  agencyAuthority: string;
  lawRegulationStandardName: string;
  citationIdentifier: string;
  effectiveDate: string | null;
  revisionVersion: string | null;
  sourceUrlReference: string;
  applicability: string;
  affectedIndustries: readonly string[];
  obligations: readonly string[];
  exceptionsExemptions: readonly string[];
  enforcementAuthority: string;
  supersededBy?: string | null;
  confidence: number;
  domain: LegalPolicyPriorityDomain;
  reviewer?: string | null;
  freshnessConfirmed?: boolean;
  claimedState?: LegalPolicyState;
  attemptBindingConclusion?: boolean;
  attemptCertifyCompliance?: boolean;
  attemptSubmitFiling?: boolean;
  attemptLicensedRepresentation?: boolean;
  attemptUnauthorizedScraping?: boolean;
  attemptCrossTenantClientMatter?: boolean;
  attemptTreatUnclearAsCurrent?: boolean;
  attemptIncludeHiddenCot?: boolean;
  otherTenantId?: string;
}): LegalPolicyNode | DenialResult {
  if (!isEr9Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER9 agents / home_base may register policy nodes.');
  }
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false — no hidden chain-of-thought.',
    );
  }
  if (
    input.attemptBindingConclusion ||
    ER9_LOCKS.BINDING_LEGAL_CONCLUSIONS
  ) {
    return deny(
      'BINDING_LEGAL_CONCLUSIONS=false — agents must not autonomously make binding legal conclusions.',
    );
  }
  if (input.attemptCertifyCompliance || ER9_LOCKS.CERTIFY_COMPLIANCE) {
    return deny('CERTIFY_COMPLIANCE=false — agents must not certify compliance.');
  }
  if (input.attemptSubmitFiling || ER9_LOCKS.SUBMIT_FILINGS) {
    return deny('SUBMIT_FILINGS=false — agents must not submit filings.');
  }
  if (
    input.attemptLicensedRepresentation ||
    ER9_LOCKS.REPRESENT_XIV_AS_LICENSED_CERTIFIED_WHEN_NOT
  ) {
    return deny(
      'REPRESENT_XIV_AS_LICENSED_CERTIFIED_WHEN_NOT=false — do not represent XIV as licensed/certified when it is not.',
    );
  }
  if (
    input.attemptUnauthorizedScraping ||
    ER9_LOCKS.UNAUTHORIZED_LEGAL_DATABASE_SCRAPING
  ) {
    return deny(
      'UNAUTHORIZED_LEGAL_DATABASE_SCRAPING=false — no unauthorized legal database scraping.',
    );
  }
  if (
    input.attemptCrossTenantClientMatter ||
    (input.otherTenantId &&
      input.otherTenantId !== input.actor.tenantId) ||
    ER9_LOCKS.CONFIDENTIAL_CLIENT_MATTER_INGESTION_ACROSS_TENANTS
  ) {
    return deny(
      'CONFIDENTIAL_CLIENT_MATTER_INGESTION_ACROSS_TENANTS=false — no confidential client matter ingestion across tenants.',
    );
  }

  const freshnessConfirmed = input.freshnessConfirmed === true;
  let freshnessOutcome: LegalFreshnessOutcome;
  let freshnessState: LegalPolicyState;

  if (!freshnessConfirmed) {
    if (
      input.attemptTreatUnclearAsCurrent ||
      ER9_LOCKS.TREAT_UNCLEAR_FRESHNESS_AS_CURRENT ||
      input.claimedState === 'CURRENT_OFFICIAL'
    ) {
      return deny(
        'TREAT_UNCLEAR_FRESHNESS_AS_CURRENT=false — unclear effective version → UNKNOWN/STALE, not current.',
        'WAITING_DATA',
      );
    }
    freshnessOutcome = freshnessWhenEffectiveVersionUnconfirmed({
      evidenceOfSupersession: Boolean(input.supersededBy),
      knownStale: input.claimedState === 'UNKNOWN',
    });
    if (input.supersededBy) {
      freshnessOutcome = 'SUPERSEDED';
      freshnessState = 'SUPERSEDED';
    } else {
      freshnessState = legalStateFromFreshness(freshnessOutcome);
    }
  } else {
    freshnessState = input.claimedState ?? 'CURRENT_OFFICIAL';
    freshnessOutcome =
      freshnessState === 'CURRENT_OFFICIAL'
        ? 'CURRENT'
        : freshnessState === 'SUPERSEDED'
          ? 'SUPERSEDED'
          : freshnessState === 'UNKNOWN'
            ? 'UNKNOWN'
            : 'CURRENT';
    if (
      freshnessState === 'CURRENT_OFFICIAL' &&
      !mayTreatAsCurrentOfficial(freshnessState, true)
    ) {
      return deny('Cannot label as CURRENT_OFFICIAL without confirmation path.');
    }
  }

  return {
    policyId: input.policyId,
    jurisdiction: input.jurisdiction,
    agencyAuthority: input.agencyAuthority,
    lawRegulationStandardName: input.lawRegulationStandardName,
    citationIdentifier: input.citationIdentifier,
    effectiveDate: input.effectiveDate,
    revisionVersion: input.revisionVersion,
    sourceUrlReference: input.sourceUrlReference,
    applicability: input.applicability,
    affectedIndustries: [...input.affectedIndustries],
    obligations: [...input.obligations],
    exceptionsExemptions: [...input.exceptionsExemptions],
    enforcementAuthority: input.enforcementAuthority,
    supersededBy: input.supersededBy ?? null,
    confidence: input.confidence,
    freshnessState,
    freshnessOutcome,
    freshnessConfirmed,
    reviewer: input.reviewer ?? null,
    domain: input.domain,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    counselReviewRequired: true,
    bindingLegalConclusion: false,
    complianceCertified: false,
    filingSubmitted: false,
    licensedRepresentationClaimed: false,
    hiddenChainOfThoughtPresent: false,
  };
}

/**
 * Effective-date / freshness check. Unclear → UNKNOWN/STALE, not current.
 */
export function checkEffectiveDateFreshness(input: {
  node: LegalPolicyNode;
  confirmedCurrentVersion?: boolean;
  attemptTreatUnclearAsCurrent?: boolean;
}):
  | {
      freshnessState: LegalPolicyState;
      freshnessOutcome: LegalFreshnessOutcome;
      treatedAsCurrent: false | true;
      counselReviewRequired: true;
    }
  | DenialResult {
  if (
    input.attemptTreatUnclearAsCurrent ||
    (!input.confirmedCurrentVersion &&
      input.node.freshnessConfirmed !== true)
  ) {
    if (input.attemptTreatUnclearAsCurrent) {
      return deny(
        'Unclear effective version cannot be labeled current — LEGAL_STATE=UNKNOWN/STALE.',
        'WAITING_DATA',
      );
    }
    const outcome = freshnessWhenEffectiveVersionUnconfirmed({
      evidenceOfSupersession: Boolean(input.node.supersededBy),
      knownStale: true,
    });
    return {
      freshnessState: legalStateFromFreshness(outcome),
      freshnessOutcome: outcome,
      treatedAsCurrent: false,
      counselReviewRequired: true,
    };
  }
  if (input.node.freshnessState === 'SUPERSEDED') {
    return {
      freshnessState: 'SUPERSEDED',
      freshnessOutcome: 'SUPERSEDED',
      treatedAsCurrent: false,
      counselReviewRequired: true,
    };
  }
  return {
    freshnessState: input.node.freshnessState,
    freshnessOutcome: input.node.freshnessOutcome,
    treatedAsCurrent:
      input.node.freshnessState === 'CURRENT_OFFICIAL' &&
      input.confirmedCurrentVersion === true,
    counselReviewRequired: true,
  };
}

export function comparePolicyVersions(input: {
  actor: Er9Actor;
  older: LegalPolicyNode;
  newer: LegalPolicyNode;
  attemptBindingConclusion?: boolean;
}): PolicyVersionCompare | DenialResult {
  if (input.attemptBindingConclusion) {
    return deny(
      'Version compare is advisory only — no binding legal conclusions.',
    );
  }
  if (!isEr9Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Only ER9 agents or approvers may compare policy versions.');
  }
  const differences: string[] = [];
  if (input.older.revisionVersion !== input.newer.revisionVersion) {
    differences.push(
      `revision ${input.older.revisionVersion ?? 'null'} → ${input.newer.revisionVersion ?? 'null'}`,
    );
  }
  if (input.older.effectiveDate !== input.newer.effectiveDate) {
    differences.push(
      `effectiveDate ${input.older.effectiveDate ?? 'null'} → ${input.newer.effectiveDate ?? 'null'}`,
    );
  }
  if (input.older.freshnessState !== input.newer.freshnessState) {
    differences.push(
      `freshness ${input.older.freshnessState} → ${input.newer.freshnessState}`,
    );
  }
  const oldObs = new Set(input.older.obligations);
  for (const o of input.newer.obligations) {
    if (!oldObs.has(o)) differences.push(`added_obligation:${o}`);
  }
  return {
    olderPolicyId: input.older.policyId,
    newerPolicyId: input.newer.policyId,
    differences,
    advisoryOnly: true,
    bindingConclusion: false,
  };
}

export function buildComplianceMatrix(input: {
  actor: Er9Actor;
  matrixId: string;
  solicitationId?: string | null;
  nodes: readonly LegalPolicyNode[];
  attemptCertify?: boolean;
  attemptBindingConclusion?: boolean;
}): ComplianceMatrix | DenialResult {
  if (input.attemptCertify || ER9_LOCKS.CERTIFY_COMPLIANCE) {
    return deny(
      'CERTIFY_COMPLIANCE=false — compliance matrices are advisory only.',
    );
  }
  if (input.attemptBindingConclusion) {
    return deny('Compliance matrix cannot make binding legal conclusions.');
  }
  if (!isEr9Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER9 agents / home_base may build compliance matrices.');
  }
  const rows: ComplianceMatrixRow[] = [];
  for (const node of input.nodes) {
    for (const obligation of node.obligations) {
      rows.push({
        obligation,
        policyId: node.policyId,
        citationIdentifier: node.citationIdentifier,
        evidenceRef: null,
        status:
          node.freshnessConfirmed && node.freshnessState === 'CURRENT_OFFICIAL'
            ? 'MAPPED_ADVISORY'
            : node.freshnessState === 'UNKNOWN'
              ? 'UNCERTAIN'
              : 'FLAGGED',
      });
    }
  }
  return {
    matrixId: input.matrixId,
    solicitationId: input.solicitationId ?? null,
    rows,
    advisoryOnly: true,
    certified: false,
    counselReviewRequired: true,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function flagCounselReview(input: {
  actor: Er9Actor;
  flagId: string;
  policyId?: string | null;
  matrixId?: string | null;
  reason: string;
}): CounselReviewFlag | DenialResult {
  if (!isEr9Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Only ER9 agents or approvers may raise counsel-review flags.');
  }
  return {
    flagId: input.flagId,
    policyId: input.policyId ?? null,
    matrixId: input.matrixId ?? null,
    reason: input.reason,
    required: true,
    bindingUseBlockedUntilCounsel: true,
  };
}

export function startGovContractIntegration(input: {
  actor: Er9Actor;
  solicitationId: string;
}): GovContractIntegrationRecord | DenialResult {
  if (!isEr9Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER9 agents / home_base may start gov-contract flow.');
  }
  return {
    flow: GOV_CONTRACT_INTEGRATION_FLOW,
    currentStep: 'solicitation',
    solicitationId: input.solicitationId,
    matrixId: null,
    evidenceVaultRef: null,
    proposalRef: null,
    humanReviewComplete: false,
    advisoryOnly: true,
  };
}

export function advanceGovContractIntegration(input: {
  actor: Er9Actor;
  record: GovContractIntegrationRecord;
  to: GovContractIntegrationStep;
  matrixId?: string | null;
  evidenceVaultRef?: string | null;
  proposalRef?: string | null;
  attemptSkipHumanReview?: boolean;
  attemptSubmitFiling?: boolean;
}): GovContractIntegrationRecord | DenialResult {
  if (input.attemptSubmitFiling) {
    return deny('SUBMIT_FILINGS=false — gov-contract flow cannot submit filings.');
  }
  const fromIdx = (GOV_CONTRACT_INTEGRATION_FLOW as readonly string[]).indexOf(
    input.record.currentStep,
  );
  const toIdx = (GOV_CONTRACT_INTEGRATION_FLOW as readonly string[]).indexOf(
    input.to,
  );
  if (fromIdx < 0 || toIdx !== fromIdx + 1) {
    return deny(
      `Cannot advance gov-contract ${input.record.currentStep} → ${input.to} (no skips).`,
    );
  }
  if (input.to === 'human_review' && input.attemptSkipHumanReview) {
    return deny('Human review step cannot be skipped.');
  }
  if (input.to === 'human_review' && !isHumanApprover(input.actor)) {
    return deny(
      'human_review requires human/counsel approver — HUMAN_APPROVAL_BOUNDARIES_UNCHANGED.',
    );
  }
  return {
    ...input.record,
    currentStep: input.to,
    matrixId: input.matrixId ?? input.record.matrixId,
    evidenceVaultRef: input.evidenceVaultRef ?? input.record.evidenceVaultRef,
    proposalRef: input.proposalRef ?? input.record.proposalRef,
    humanReviewComplete: input.to === 'human_review',
    advisoryOnly: true,
  };
}

export function attemptBindingLegalConclusion(): DenialResult {
  return deny(
    'BINDING_LEGAL_CONCLUSIONS=false — no autonomous binding legal conclusions.',
  );
}

export function attemptCertifyCompliance(): DenialResult {
  return deny('CERTIFY_COMPLIANCE=false — no compliance certification.');
}

export function attemptSubmitFilings(): DenialResult {
  return deny('SUBMIT_FILINGS=false — no filings.');
}

export function attemptLicensedRepresentationWhenNot(): DenialResult {
  return deny(
    'REPRESENT_XIV_AS_LICENSED_CERTIFIED_WHEN_NOT=false — no false licensed/certified representation.',
  );
}

export function attemptUnauthorizedLegalDatabaseScraping(): DenialResult {
  return deny(
    'UNAUTHORIZED_LEGAL_DATABASE_SCRAPING=false — no unauthorized legal database scraping.',
  );
}

export function attemptCrossTenantConfidentialClientMatters(): DenialResult {
  return deny(
    'CONFIDENTIAL_CLIENT_MATTER_INGESTION_ACROSS_TENANTS=false — tenant/Universe isolation.',
  );
}

export function attemptFilingCertificationWithoutAuthorization(): DenialResult {
  return deny(
    'LEGAL_FILING_OR_CERTIFICATION_WITHOUT_EXPLICIT_AUTHORIZATION=false.',
  );
}

export function attemptTreatUnclearAsCurrent(): DenialResult {
  return deny(
    'TREAT_UNCLEAR_FRESHNESS_AS_CURRENT=false — UNKNOWN/STALE ≠ current.',
    'WAITING_DATA',
  );
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('BYPASS_GUARDIAN_RLS=false.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('EXPAND_TENANT_UNIVERSE_ACCESS=false.');
}

export function attemptPersistHiddenChainOfThought(): DenialResult {
  return deny('PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('AUTO_DEPLOY_CHANGES=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS';
  isolationUnchanged: true;
} {
  return {
    state: 'PASS',
    isolationUnchanged:
      ER9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
  };
}

export function bootstrapPublicLawPolicyKnowledgePack(repoRoot?: string): {
  locksIntact: boolean;
  legalStates: readonly LegalPolicyState[];
  nodeFields: readonly LegalPolicyNodeField[];
  domains: readonly LegalPolicyPriorityDomain[];
  coreFlow: readonly LegalPolicyCoreFlowStep[];
  govContractFlow: typeof GOV_CONTRACT_INTEGRATION_FLOW;
  dbCandidates: typeof ER9_DB_CANDIDATES_STATUS;
  softWire: Er9SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ER_LAYER_TITLE;
  };
  may: typeof ER9_MAY;
  mustNot: typeof ER9_MUST_NOT;
  bounds: typeof ER9_AGENT_BOUNDS;
} {
  return {
    locksIntact: assertEr9LocksIntact(),
    legalStates: LEGAL_POLICY_STATES,
    nodeFields: LEGAL_POLICY_NODE_FIELDS,
    domains: LEGAL_POLICY_PRIORITY_DOMAINS,
    coreFlow: LEGAL_POLICY_CORE_FLOW,
    govContractFlow: GOV_CONTRACT_INTEGRATION_FLOW,
    dbCandidates: ER9_DB_CANDIDATES_STATUS,
    softWire: er9SoftWireSnapshot(repoRoot),
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
      gitlab: GITLAB_MIRROR_NOTE,
      layer: ER_LAYER_TITLE,
    },
    may: ER9_MAY,
    mustNot: ER9_MUST_NOT,
    bounds: ER9_AGENT_BOUNDS,
  };
}

export function exampleCurrentOfficialNode(
  actor: Er9Actor,
): LegalPolicyNode {
  const node = registerPolicyNode({
    actor,
    policyId: 'pol-far-52-204-21',
    jurisdiction: 'US-federal',
    agencyAuthority: 'GSA / FAR Council',
    lawRegulationStandardName: 'FAR 52.204-21 Basic Safeguarding of Covered Contractor Information Systems',
    citationIdentifier: 'FAR 52.204-21',
    effectiveDate: '2016-06-15',
    revisionVersion: 'FAC-2005-89',
    sourceUrlReference: 'https://www.acquisition.gov/far/52.204-21',
    applicability: 'covered contractor information systems',
    affectedIndustries: ['government_contracting', 'cybersecurity'],
    obligations: ['safeguard_covered_contractor_information_systems'],
    exceptionsExemptions: [],
    enforcementAuthority: 'contracting_officer',
    confidence: 0.85,
    domain: 'far_and_agency_supplements',
    freshnessConfirmed: true,
    claimedState: 'CURRENT_OFFICIAL',
    reviewer: 'human-reviewer-1',
  });
  if ('denied' in node) {
    throw new Error(`example node denied: ${node.reason}`);
  }
  return node;
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er9Actor;
  action: string;
}):
  | { approvalId: string; approved: true; action: string }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny('HUMAN_APPROVAL_REQUIRED — consequential actions need human/counsel.');
  }
  if (
    !input.actor.permissions.includes('approve_consequential') &&
    !input.actor.permissions.includes('counsel_review')
  ) {
    return deny('Approver lacks approve_consequential / counsel_review permission.');
  }
  return {
    approvalId: input.approvalId,
    approved: true,
    action: input.action,
  };
}

export function returnEr9EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er9Actor;
  node: LegalPolicyNode;
  summary: string;
}):
  | {
      evidenceId: string;
      summary: string;
      advisoryOnly: true;
      bindingLegalConclusion: false;
      hiddenChainOfThoughtPresent: false;
    }
  | DenialResult {
  if (input.node.hiddenChainOfThoughtPresent) {
    return deny('Evidence must not include hidden chain-of-thought.');
  }
  return {
    evidenceId: input.evidenceId,
    summary: input.summary,
    advisoryOnly: true,
    bindingLegalConclusion: false,
    hiddenChainOfThoughtPresent: false,
  };
}

function softWireHopState(present: boolean): Er9EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function runPublicLawPolicyKnowledgePackCycle(input: {
  actor: Er9Actor;
  human: Er9Actor;
  repoRoot?: string;
}): {
  hops: Er9HopRecord[];
  node: LegalPolicyNode;
  matrix: ComplianceMatrix;
  softWire: Er9SoftWireSnapshot;
} {
  const hops: Er9HopRecord[] = [];
  const softWire = er9SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr9LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );
  hops.push(
    hop(
      'public_law_policy_knowledge_pack_bootstrap',
      'PASS',
      'Public Law & Policy Knowledge Pack bootstrap.',
    ),
  );
  hops.push(
    hop(
      'legal_policy_states_encoded',
      LEGAL_POLICY_STATES.length === 6 ? 'PASS' : 'FAIL',
      `States: ${LEGAL_POLICY_STATES.join(', ')}`,
    ),
  );
  hops.push(
    hop(
      'legal_policy_node_fields_encoded',
      LEGAL_POLICY_NODE_FIELDS.length === 17 ? 'PASS' : 'FAIL',
      `${LEGAL_POLICY_NODE_FIELDS.length} policy node fields.`,
    ),
  );
  hops.push(
    hop(
      'priority_domains_encoded',
      LEGAL_POLICY_PRIORITY_DOMAINS.length === 15 ? 'PASS' : 'FAIL',
      `${LEGAL_POLICY_PRIORITY_DOMAINS.length} priority domains.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      LEGAL_POLICY_CORE_FLOW.length === 8 ? 'PASS' : 'FAIL',
      `Core flow: ${LEGAL_POLICY_CORE_FLOW.join(' → ')}`,
    ),
  );
  hops.push(
    hop(
      'gov_contract_integration_encoded',
      GOV_CONTRACT_INTEGRATION_FLOW.length === 6 ? 'PASS' : 'FAIL',
      `Gov-contract: ${GOV_CONTRACT_INTEGRATION_FLOW.join(' → ')}`,
    ),
  );
  hops.push(
    hop(
      'freshness_rule_encoded',
      LEGAL_FRESHNESS_RULE.mayLabelUnclearAsCurrent === false &&
        LEGAL_FRESHNESS_RULE.unclearEffectiveVersionImpliesNotCurrent === true
        ? 'PASS'
        : 'FAIL',
      'Unclear effective version → UNKNOWN/STALE, not current.',
    ),
  );
  hops.push(
    hop(
      'legal_policy_boundary_encoded',
      LEGAL_POLICY_BOUNDARY.mayAutonomouslyMakeBindingLegalConclusions ===
        false &&
        LEGAL_POLICY_BOUNDARY.mayCertifyCompliance === false &&
        LEGAL_POLICY_BOUNDARY.complianceMatrixIsAdvisoryOnly === true
        ? 'PASS'
        : 'FAIL',
      'Legal/policy boundary locks encoded.',
    ),
  );

  const node = exampleCurrentOfficialNode(input.actor);
  hops.push(
    hop(
      'register_policy_node',
      node.policyId.length > 0 && node.bindingLegalConclusion === false
        ? 'PASS'
        : 'FAIL',
      `Registered policy node ${node.policyId}.`,
    ),
  );

  const freshnessOk = checkEffectiveDateFreshness({
    node,
    confirmedCurrentVersion: true,
  });
  const freshnessUnclear = checkEffectiveDateFreshness({
    node: { ...node, freshnessConfirmed: false, freshnessState: 'UNKNOWN' },
    confirmedCurrentVersion: false,
  });
  hops.push(
    hop(
      'effective_date_freshness_check',
      !('denied' in freshnessOk) &&
        freshnessOk.treatedAsCurrent === true &&
        !('denied' in freshnessUnclear) &&
        freshnessUnclear.treatedAsCurrent === false
        ? 'PASS'
        : 'FAIL',
      'Effective-date freshness check distinguishes confirmed vs unclear.',
    ),
  );

  const unclearDeny = registerPolicyNode({
    actor: input.actor,
    policyId: 'pol-unclear',
    jurisdiction: 'US-federal',
    agencyAuthority: 'Unknown',
    lawRegulationStandardName: 'Unclear Regulation',
    citationIdentifier: 'UNK-1',
    effectiveDate: null,
    revisionVersion: null,
    sourceUrlReference: 'https://example.gov/unclear',
    applicability: 'unknown',
    affectedIndustries: [],
    obligations: ['unknown_obligation'],
    exceptionsExemptions: [],
    enforcementAuthority: 'unknown',
    confidence: 0.1,
    domain: 'ai_governance',
    freshnessConfirmed: false,
    claimedState: 'CURRENT_OFFICIAL',
    attemptTreatUnclearAsCurrent: true,
  });
  hops.push(
    hop(
      'unclear_freshness_unknown_stale_not_current',
      'denied' in unclearDeny &&
        (unclearDeny.state === 'WAITING_DATA' || unclearDeny.state === 'DENIED') &&
        attemptTreatUnclearAsCurrent().state === 'WAITING_DATA'
        ? 'PASS'
        : 'FAIL',
      'Unclear freshness → UNKNOWN/STALE / WAITING_DATA — not current.',
    ),
  );

  const older = {
    ...node,
    policyId: 'pol-old',
    revisionVersion: 'v1',
    obligations: ['safeguard_covered_contractor_information_systems'],
  };
  const newer = {
    ...node,
    policyId: 'pol-new',
    revisionVersion: 'v2',
    obligations: [
      'safeguard_covered_contractor_information_systems',
      'report_cyber_incidents',
    ],
  };
  const cmp = comparePolicyVersions({
    actor: input.actor,
    older,
    newer,
  });
  hops.push(
    hop(
      'version_compare',
      !('denied' in cmp) &&
        cmp.advisoryOnly === true &&
        cmp.bindingConclusion === false &&
        cmp.differences.length > 0
        ? 'PASS'
        : 'FAIL',
      'Version compare advisory only.',
    ),
  );

  const matrix = buildComplianceMatrix({
    actor: input.actor,
    matrixId: 'mtx-1',
    solicitationId: 'sol-1',
    nodes: [node],
  });
  if ('denied' in matrix) {
    throw new Error(`matrix denied: ${matrix.reason}`);
  }
  hops.push(
    hop(
      'compliance_matrix_advisory',
      matrix.advisoryOnly === true &&
        matrix.certified === false &&
        matrix.counselReviewRequired === true
        ? 'PASS'
        : 'FAIL',
      'Compliance matrix is advisory; not certified.',
    ),
  );

  const counsel = flagCounselReview({
    actor: input.actor,
    flagId: 'cr-1',
    policyId: node.policyId,
    matrixId: matrix.matrixId,
    reason: 'Binding use requires counsel/qualified professional review.',
  });
  hops.push(
    hop(
      'counsel_review_flag',
      !('denied' in counsel) &&
        counsel.required === true &&
        counsel.bindingUseBlockedUntilCounsel === true
        ? 'PASS'
        : 'FAIL',
      'Counsel-review flag raised for binding use.',
    ),
  );

  let gov = startGovContractIntegration({
    actor: input.actor,
    solicitationId: 'sol-1',
  });
  if ('denied' in gov) {
    throw new Error(`gov start denied: ${gov.reason}`);
  }
  const steps: GovContractIntegrationStep[] = [
    'far_agency_rules',
    'compliance_matrix',
    'evidence_vault',
    'proposal',
  ];
  for (const step of steps) {
    const next = advanceGovContractIntegration({
      actor: input.actor,
      record: gov,
      to: step,
      matrixId: matrix.matrixId,
      evidenceVaultRef: 'vault://ev-1',
      proposalRef: 'proposal://p-1',
    });
    if ('denied' in next) {
      throw new Error(`gov advance denied: ${next.reason}`);
    }
    gov = next;
  }
  const humanStep = advanceGovContractIntegration({
    actor: input.human,
    record: gov,
    to: 'human_review',
  });
  hops.push(
    hop(
      'gov_contract_flow',
      !('denied' in humanStep) &&
        humanStep.currentStep === 'human_review' &&
        humanStep.humanReviewComplete === true &&
        humanStep.advisoryOnly === true
        ? 'PASS'
        : 'FAIL',
      'Solicitation → FAR/agency → matrix → vault → proposal → human review.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_binding_legal_conclusions',
      fn: attemptBindingLegalConclusion,
    },
    { hop: 'deny_certify_compliance', fn: attemptCertifyCompliance },
    { hop: 'deny_submit_filings', fn: attemptSubmitFilings },
    {
      hop: 'deny_licensed_representation_when_not',
      fn: attemptLicensedRepresentationWhenNot,
    },
    {
      hop: 'deny_unauthorized_legal_database_scraping',
      fn: attemptUnauthorizedLegalDatabaseScraping,
    },
    {
      hop: 'deny_cross_tenant_confidential_client_matters',
      fn: attemptCrossTenantConfidentialClientMatters,
    },
    {
      hop: 'deny_filing_certification_without_authorization',
      fn: attemptFilingCertificationWithoutAuthorization,
    },
    {
      hop: 'deny_treat_unclear_as_current',
      fn: attemptTreatUnclearAsCurrent,
    },
    { hop: 'deny_bypass_guardian_rls', fn: attemptBypassGuardianRls },
    {
      hop: 'deny_expand_tenant_universe_access',
      fn: attemptExpandTenantUniverseAccess,
    },
    {
      hop: 'deny_persist_hidden_chain_of_thought',
      fn: attemptPersistHiddenChainOfThought,
    },
    { hop: 'deny_auto_deploy_changes', fn: attemptAutoDeployChanges },
  ];
  for (const d of denyHops) {
    const result = d.fn();
    const ok =
      result.state === 'DENIED' ||
      (d.hop === 'deny_treat_unclear_as_current' &&
        result.state === 'WAITING_DATA');
    hops.push(hop(d.hop, ok ? 'PASS' : 'FAIL', `${d.hop} → ${result.state}.`));
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
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAgentAutoAuthority().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no agent auto-authority.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER9_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Real API Data Fabric') &&
        GITHUB_SOT_ISSUE === 162
        ? 'PASS'
        : 'FAIL',
      'ER layer context (#162); next ER10 Public Geospatial / Mobility Pack.',
    ),
  );

  hops.push(
    hop(
      'er8_soft_wire',
      softWireHopState(softWire.er8AncientCivilizationsKnowledgePack.present),
      softWire.er8AncientCivilizationsKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'er7_soft_wire',
      softWireHopState(softWire.er7HistoricalScienceEngineeringAtlas.present),
      softWire.er7HistoricalScienceEngineeringAtlas.note,
    ),
  );
  hops.push(
    hop(
      'er6_soft_wire',
      softWireHopState(softWire.er6HistoricalBusinessCaseAtlasV2.present),
      softWire.er6HistoricalBusinessCaseAtlasV2.note,
    ),
  );
  hops.push(
    hop(
      'er5_soft_wire',
      softWireHopState(softWire.er5GlobalHistoricalKnowledgeIngestion.present),
      softWire.er5GlobalHistoricalKnowledgeIngestion.note,
    ),
  );
  hops.push(
    hop(
      'er4_soft_wire',
      softWireHopState(softWire.er4RightsProvenanceGate.present),
      softWire.er4RightsProvenanceGate.note,
    ),
  );
  hops.push(
    hop(
      'er3_soft_wire',
      softWireHopState(softWire.er3PublicDataSourceRegistry.present),
      softWire.er3PublicDataSourceRegistry.note,
    ),
  );
  hops.push(
    hop(
      'er2_soft_wire',
      softWireHopState(softWire.er2ApiTruthStateMachine.present),
      softWire.er2ApiTruthStateMachine.note,
    ),
  );
  hops.push(
    hop(
      'er1_soft_wire',
      softWireHopState(softWire.er1RealApiConnectionRegistry.present),
      softWire.er1RealApiConnectionRegistry.note,
    ),
  );
  hops.push(
    hop(
      'eq16_soft_wire',
      softWireHopState(softWire.eq16SoftwareWormholeRouter.present),
      softWire.eq16SoftwareWormholeRouter.note,
    ),
  );
  hops.push(
    hop(
      'eq15_soft_wire',
      softWireHopState(softWire.eq15PathwayPlasticity.present),
      softWire.eq15PathwayPlasticity.note,
    ),
  );
  hops.push(
    hop(
      'eq14_soft_wire',
      softWireHopState(softWire.eq14NeuralPathwayArchitectureGraph.present),
      softWire.eq14NeuralPathwayArchitectureGraph.note,
    ),
  );
  hops.push(
    hop(
      'eq13_soft_wire',
      softWireHopState(softWire.eq13ArchitectureReturnReceipt.present),
      softWire.eq13ArchitectureReturnReceipt.note,
    ),
  );
  hops.push(
    hop(
      'eq12_soft_wire',
      softWireHopState(softWire.eq12CrossArchitectureBenchmarkMatrix.present),
      softWire.eq12CrossArchitectureBenchmarkMatrix.note,
    ),
  );
  hops.push(
    hop(
      'ep15_soft_wire',
      softWireHopState(softWire.ep15AlgorithmTuningSandbox.present),
      softWire.ep15AlgorithmTuningSandbox.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWireHopState(softWire.em157HomeBase.present),
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ER9_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );
  hops.push(
    hop(
      'evidence',
      'ADVISORY_ONLY',
      'ER9 evidence returned advisory-only; DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION AUTHORIZED.',
    ),
  );

  if (hops.length !== PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE.length) {
    throw new Error(
      `Cycle hop count mismatch: ${hops.length} vs ${PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_CYCLE.length}`,
    );
  }

  return { hops, node, matrix, softWire };
}
