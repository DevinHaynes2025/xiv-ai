/**
 * 62L-EO2 — Government Agency Knowledge Graph runtime.
 *
 * Provenance-backed graph registration + inference labeling + denial gates.
 * Capture/proposal agents reason from evidence — not assumptions.
 */

import {
  AGENCY_KNOWLEDGE_GRAPH_MODEL,
  EO2_DB_CANDIDATES_STATUS,
  EO2_LOCKS,
  EO2_MAY,
  EO2_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOVERNMENT_AGENCY_KNOWLEDGE_GRAPH_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NODE_RETAINED_FIELDS,
  RELATIONSHIP_INFERENCE_LABELS,
  XIV_CAPABILITY_ALIGNMENT_TAGS,
  assertEo2LocksIntact,
  eo2SoftWireSnapshot,
  type AgencyGraphNodeKind,
  type AgencyGraphProvenance,
  type Eo2Actor,
  type Eo2EvidenceState,
  type Eo2HopRecord,
  type Eo2SoftWireSnapshot,
  type EvidenceClass,
  type RelationshipInferenceLabel,
  type XivCapabilityAlignmentTag,
} from './government-agency-knowledge-graph-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof GOVERNMENT_AGENCY_KNOWLEDGE_GRAPH_CYCLE)[number],
  state: Eo2EvidenceState,
  summary: string,
): Eo2HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'EXCLUDED';
  reason: string;
};

function deny(reason: string, state: 'DENIED' | 'EXCLUDED' = 'DENIED'): DenialResult {
  return { denied: true, state, reason };
}

// ---------------------------------------------------------------------------
// Provenance helpers
// ---------------------------------------------------------------------------

export function validateProvenance(
  provenance: AgencyGraphProvenance,
): true | DenialResult {
  if (!provenance.sourceUrlOrReference?.trim()) {
    return deny('Provenance requires source URL/reference.');
  }
  if (!provenance.sourceDate?.trim()) {
    return deny('Provenance requires source date.');
  }
  if (
    typeof provenance.confidence !== 'number' ||
    provenance.confidence < 0 ||
    provenance.confidence > 1
  ) {
    return deny('Confidence must be a number in [0, 1].');
  }
  if (provenance.evidenceClass === 'classified_excluded') {
    return deny(
      'CLASSIFIED_PROCUREMENT_EXCLUDED — sensitive/classified procurement excluded unless separately authorized.',
      'EXCLUDED',
    );
  }
  return true;
}

export function requireAuthorizedPublicLicensedData(input: {
  dataClass: 'authorized_public' | 'licensed_public' | 'unauthorized' | 'classified_unauthorized';
}): true | DenialResult {
  if (
    input.dataClass === 'unauthorized' ||
    input.dataClass === 'classified_unauthorized'
  ) {
    return deny(
      'AUTHORIZED_PUBLIC_LICENSED_DATA_ONLY — unauthorized/unlicensed/classified ingest DENIED.',
    );
  }
  return true;
}

// ---------------------------------------------------------------------------
// A — Graph node registration
// ---------------------------------------------------------------------------

export type AgencyGraphNode = {
  nodeId: string;
  kind: AgencyGraphNodeKind;
  officialName: string;
  agencyBureauHierarchy: string[];
  missionAndPublicPriorities: string[];
  programNames: string[];
  procurementVehicles: string[];
  naicsPscAssociations: string[];
  publicBudgetProgramReferences: string[];
  historicalSolicitations: string[];
  publicAwardHistory: string[];
  incumbentContractorContext: string[];
  setAsidePatterns: string[];
  contractingOffice: string | null;
  provenance: AgencyGraphProvenance;
  capabilityAlignmentTags: XivCapabilityAlignmentTag[];
  leadershipChangeTimestamp: string | null;
  leadershipChangeIsPermanent: false;
  state: 'REGISTERED' | 'PROVENANCE_LABELED';
};

export type AgencyGraphEdge = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relation: string;
  inferenceLabel: RelationshipInferenceLabel;
  provenance: AgencyGraphProvenance;
  state: 'PUBLIC_EVIDENCE' | 'HYPOTHESIS' | 'UNKNOWN' | 'PROVENANCE_LABELED';
};

function baseNode(input: {
  nodeId: string;
  kind: AgencyGraphNodeKind;
  officialName: string;
  provenance: AgencyGraphProvenance;
  agencyBureauHierarchy?: string[];
  missionAndPublicPriorities?: string[];
  programNames?: string[];
  procurementVehicles?: string[];
  naicsPscAssociations?: string[];
  publicBudgetProgramReferences?: string[];
  historicalSolicitations?: string[];
  publicAwardHistory?: string[];
  incumbentContractorContext?: string[];
  setAsidePatterns?: string[];
  contractingOffice?: string | null;
  capabilityAlignmentTags?: XivCapabilityAlignmentTag[];
  leadershipChangeTimestamp?: string | null;
}): AgencyGraphNode | DenialResult {
  const prov = validateProvenance(input.provenance);
  if (prov !== true) return prov;

  return {
    nodeId: input.nodeId,
    kind: input.kind,
    officialName: input.officialName,
    agencyBureauHierarchy: [...(input.agencyBureauHierarchy ?? [])],
    missionAndPublicPriorities: [...(input.missionAndPublicPriorities ?? [])],
    programNames: [...(input.programNames ?? [])],
    procurementVehicles: [...(input.procurementVehicles ?? [])],
    naicsPscAssociations: [...(input.naicsPscAssociations ?? [])],
    publicBudgetProgramReferences: [...(input.publicBudgetProgramReferences ?? [])],
    historicalSolicitations: [...(input.historicalSolicitations ?? [])],
    publicAwardHistory: [...(input.publicAwardHistory ?? [])],
    incumbentContractorContext: [...(input.incumbentContractorContext ?? [])],
    setAsidePatterns: [...(input.setAsidePatterns ?? [])],
    contractingOffice: input.contractingOffice ?? null,
    provenance: { ...input.provenance },
    capabilityAlignmentTags: [...(input.capabilityAlignmentTags ?? [])],
    leadershipChangeTimestamp: input.leadershipChangeTimestamp ?? null,
    leadershipChangeIsPermanent: false,
    state: 'PROVENANCE_LABELED',
  };
}

export function registerAgencyNode(input: {
  nodeId: string;
  officialName: string;
  provenance: AgencyGraphProvenance;
  missionAndPublicPriorities?: string[];
  capabilityAlignmentTags?: XivCapabilityAlignmentTag[];
  claimPrioritiesWithoutPublicEvidence?: boolean;
  dataClass?: 'authorized_public' | 'licensed_public' | 'unauthorized' | 'classified_unauthorized';
}): AgencyGraphNode | DenialResult {
  const dataOk = requireAuthorizedPublicLicensedData({
    dataClass: input.dataClass ?? 'authorized_public',
  });
  if (dataOk !== true) return dataOk;

  if (input.claimPrioritiesWithoutPublicEvidence) {
    return deny(
      'PRIORITIES_FROM_CURRENT_PUBLIC_EVIDENCE_ONLY — agency priorities require current official/public evidence.',
    );
  }

  if (
    (input.missionAndPublicPriorities?.length ?? 0) > 0 &&
    input.provenance.evidenceClass !== 'official_public' &&
    input.provenance.evidenceClass !== 'licensed_public'
  ) {
    return deny(
      'PRIORITIES_FROM_CURRENT_PUBLIC_EVIDENCE_ONLY — priorities evidenceClass must be official_public or licensed_public.',
    );
  }

  return baseNode({
    nodeId: input.nodeId,
    kind: 'agency',
    officialName: input.officialName,
    provenance: input.provenance,
    agencyBureauHierarchy: [input.officialName],
    missionAndPublicPriorities: input.missionAndPublicPriorities,
    capabilityAlignmentTags: input.capabilityAlignmentTags,
  });
}

export function registerBureauProgramMission(input: {
  nodeId: string;
  kind: 'bureau' | 'program' | 'mission';
  officialName: string;
  agencyBureauHierarchy: string[];
  provenance: AgencyGraphProvenance;
  programNames?: string[];
  missionAndPublicPriorities?: string[];
}): AgencyGraphNode | DenialResult {
  return baseNode({
    nodeId: input.nodeId,
    kind: input.kind,
    officialName: input.officialName,
    provenance: input.provenance,
    agencyBureauHierarchy: input.agencyBureauHierarchy,
    programNames: input.programNames,
    missionAndPublicPriorities: input.missionAndPublicPriorities,
  });
}

export function registerProcurementVehicle(input: {
  nodeId: string;
  officialName: string;
  agencyBureauHierarchy: string[];
  provenance: AgencyGraphProvenance;
  procurementVehicles?: string[];
  naicsPscAssociations?: string[];
  setAsidePatterns?: string[];
  contractingOffice?: string;
  classifiedWithoutAuthorization?: boolean;
}): AgencyGraphNode | DenialResult {
  if (input.classifiedWithoutAuthorization) {
    return deny(
      'CLASSIFIED_PROCUREMENT_EXCLUDED — sensitive/classified procurement excluded unless separately authorized.',
      'EXCLUDED',
    );
  }
  return baseNode({
    nodeId: input.nodeId,
    kind: 'procurement_vehicle',
    officialName: input.officialName,
    provenance: input.provenance,
    agencyBureauHierarchy: input.agencyBureauHierarchy,
    procurementVehicles: input.procurementVehicles ?? [input.officialName],
    naicsPscAssociations: input.naicsPscAssociations,
    setAsidePatterns: input.setAsidePatterns,
    contractingOffice: input.contractingOffice,
  });
}

export function registerOpportunityOrAward(input: {
  nodeId: string;
  kind: 'opportunity' | 'award_history';
  officialName: string;
  agencyBureauHierarchy: string[];
  provenance: AgencyGraphProvenance;
  historicalSolicitations?: string[];
  publicAwardHistory?: string[];
  claimFuturePreferenceFromHistory?: boolean;
}): AgencyGraphNode | DenialResult {
  if (input.claimFuturePreferenceFromHistory) {
    return deny(
      'HISTORICAL_AWARD_NEQ_FUTURE_PREFERENCE — historical award data ≠ future preference.',
    );
  }
  return baseNode({
    nodeId: input.nodeId,
    kind: input.kind,
    officialName: input.officialName,
    provenance: input.provenance,
    agencyBureauHierarchy: input.agencyBureauHierarchy,
    historicalSolicitations: input.historicalSolicitations,
    publicAwardHistory: input.publicAwardHistory,
  });
}

export function registerVendorRequirementOutcome(input: {
  nodeId: string;
  kind: 'vendor_prime_sub' | 'requirement' | 'outcome';
  officialName: string;
  agencyBureauHierarchy: string[];
  provenance: AgencyGraphProvenance;
  incumbentContractorContext?: string[];
  claimXivPartnershipFromPublicContractor?: boolean;
}): AgencyGraphNode | DenialResult {
  if (input.claimXivPartnershipFromPublicContractor) {
    return deny(
      'PUBLIC_CONTRACTOR_NEQ_XIV_PARTNERSHIP — public contractor relationships ≠ partnership with XIV.',
    );
  }
  return baseNode({
    nodeId: input.nodeId,
    kind: input.kind,
    officialName: input.officialName,
    provenance: input.provenance,
    agencyBureauHierarchy: input.agencyBureauHierarchy,
    incumbentContractorContext: input.incumbentContractorContext,
  });
}

// ---------------------------------------------------------------------------
// B / C — Edges + inference labels
// ---------------------------------------------------------------------------

export function registerGraphEdge(input: {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relation: string;
  inferenceLabel?: RelationshipInferenceLabel;
  provenance: AgencyGraphProvenance;
  omitInferenceLabel?: boolean;
  claimHypothesisAsPublicEvidence?: boolean;
}): AgencyGraphEdge | DenialResult {
  const prov = validateProvenance(input.provenance);
  if (prov !== true) return prov;

  if (input.omitInferenceLabel || !input.inferenceLabel) {
    return deny(
      'INFERENCE_WITHOUT_LABEL — relationship inference must be PUBLIC_EVIDENCE | HYPOTHESIS | UNKNOWN.',
    );
  }

  if (
    input.claimHypothesisAsPublicEvidence &&
    input.inferenceLabel === 'HYPOTHESIS'
  ) {
    return deny(
      'HYPOTHESIS_NEQ_PUBLIC_EVIDENCE — hypothesis cannot be labeled as public evidence.',
    );
  }

  const state: AgencyGraphEdge['state'] =
    input.inferenceLabel === 'PUBLIC_EVIDENCE'
      ? 'PUBLIC_EVIDENCE'
      : input.inferenceLabel === 'HYPOTHESIS'
        ? 'HYPOTHESIS'
        : 'UNKNOWN';

  return {
    edgeId: input.edgeId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    relation: input.relation,
    inferenceLabel: input.inferenceLabel,
    provenance: { ...input.provenance },
    state,
  };
}

export function recordLeadershipChange(input: {
  nodeId: string;
  timestamp: string;
  claimPermanent?: boolean;
}):
  | {
      nodeId: string;
      leadershipChangeTimestamp: string;
      leadershipChangeIsPermanent: false;
      state: 'PROVENANCE_LABELED';
    }
  | DenialResult {
  if (!input.timestamp.trim()) {
    return deny('Leadership change requires timestamp.');
  }
  if (input.claimPermanent) {
    return deny(
      'LEADERSHIP_CHANGE_TIMESTAMPED_NEQ_PERMANENT — political/leadership changes are timestamped ≠ permanent.',
    );
  }
  return {
    nodeId: input.nodeId,
    leadershipChangeTimestamp: input.timestamp,
    leadershipChangeIsPermanent: false,
    state: 'PROVENANCE_LABELED',
  };
}

// ---------------------------------------------------------------------------
// D — Core use surfaces (contracts supporting capture/proposal agents)
// ---------------------------------------------------------------------------

export type AgencyAlignmentHit = {
  nodeId: string;
  officialName: string;
  matchedTags: XivCapabilityAlignmentTag[];
  state: 'RECOMMENDATION_ONLY';
  binding: false;
};

export function findAgenciesAlignedWithXivCapabilities(input: {
  nodes: AgencyGraphNode[];
  tags: XivCapabilityAlignmentTag[];
}): AgencyAlignmentHit[] {
  const tagSet = new Set(input.tags);
  return input.nodes
    .filter((n) => n.kind === 'agency' || n.kind === 'bureau' || n.kind === 'mission')
    .filter((n) => n.capabilityAlignmentTags.some((t) => tagSet.has(t)))
    .map((n) => ({
      nodeId: n.nodeId,
      officialName: n.officialName,
      matchedTags: n.capabilityAlignmentTags.filter((t) => tagSet.has(t)),
      state: 'RECOMMENDATION_ONLY' as const,
      binding: false as const,
    }));
}

export type ProcurementPattern = {
  patternId: string;
  vehicleOrSetAside: string;
  occurrences: number;
  state: 'ADVISORY_ONLY';
  predictsFuturePreference: false;
};

export function identifyRepeatedProcurementPatterns(input: {
  nodes: AgencyGraphNode[];
}): ProcurementPattern[] {
  const counts = new Map<string, number>();
  for (const n of input.nodes) {
    for (const v of n.procurementVehicles) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    for (const s of n.setAsidePatterns) {
      counts.set(`setaside:${s}`, (counts.get(`setaside:${s}`) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([vehicleOrSetAside, occurrences], i) => ({
      patternId: `pat-${i + 1}`,
      vehicleOrSetAside,
      occurrences,
      state: 'ADVISORY_ONLY' as const,
      predictsFuturePreference: false as const,
    }));
}

export type RequirementLanguageSurface = {
  phrases: string[];
  state: 'ADVISORY_ONLY';
  isLegalAdvice: false;
};

export function surfaceCommonRequirementLanguage(input: {
  requirementNodes: AgencyGraphNode[];
}): RequirementLanguageSurface {
  const phrases = input.requirementNodes
    .filter((n) => n.kind === 'requirement')
    .map((n) => n.officialName);
  return {
    phrases,
    state: 'ADVISORY_ONLY',
    isLegalAdvice: false,
  };
}

export type ComplianceGapHypothesis = {
  gapId: string;
  agencyNodeId: string;
  summary: string;
  inferenceLabel: 'HYPOTHESIS';
  state: 'HYPOTHESIS';
  binding: false;
};

export function surfaceComplianceGapHypotheses(input: {
  agencyNodeId: string;
  gaps: string[];
}): ComplianceGapHypothesis[] {
  return input.gaps.map((summary, i) => ({
    gapId: `gap-${input.agencyNodeId}-${i + 1}`,
    agencyNodeId: input.agencyNodeId,
    summary,
    inferenceLabel: 'HYPOTHESIS' as const,
    state: 'HYPOTHESIS' as const,
    binding: false as const,
  }));
}

export type CaptureHypothesisLink = {
  linkId: string;
  awardNodeId: string;
  opportunityHypothesis: string;
  inferenceLabel: 'HYPOTHESIS';
  state: 'HYPOTHESIS';
  historicalAwardEqualsFuturePreference: false;
};

export function connectAwardsToCaptureHypotheses(input: {
  awardNodeId: string;
  opportunityHypothesis: string;
  claimFuturePreference?: boolean;
}): CaptureHypothesisLink | DenialResult {
  if (input.claimFuturePreference) {
    return deny(
      'HISTORICAL_AWARD_NEQ_FUTURE_PREFERENCE — connect awards to capture hypotheses only; not preference.',
    );
  }
  return {
    linkId: `cap-${input.awardNodeId}`,
    awardNodeId: input.awardNodeId,
    opportunityHypothesis: input.opportunityHypothesis,
    inferenceLabel: 'HYPOTHESIS',
    state: 'HYPOTHESIS',
    historicalAwardEqualsFuturePreference: false,
  };
}

export type MissionTailoredEvidence = {
  packageId: string;
  agencyNodeId: string;
  missionThemes: string[];
  evidenceRefs: string[];
  state: 'PLAN_ONLY';
  genericSalesLanguage: false;
  submitted: false;
};

export function tailorProposalEvidenceToAgencyMission(input: {
  packageId: string;
  agencyNode: AgencyGraphNode;
  evidenceRefs: string[];
  useGenericSalesLanguage?: boolean;
}): MissionTailoredEvidence | DenialResult {
  if (input.useGenericSalesLanguage) {
    return deny(
      'Tailor proposal evidence to agency mission — generic sales language DENIED on this surface.',
    );
  }
  if (input.agencyNode.missionAndPublicPriorities.length === 0) {
    return deny(
      'Mission-tailored evidence requires mission/public priorities from current public evidence.',
    );
  }
  return {
    packageId: input.packageId,
    agencyNodeId: input.agencyNode.nodeId,
    missionThemes: [...input.agencyNode.missionAndPublicPriorities],
    evidenceRefs: [...input.evidenceRefs],
    state: 'PLAN_ONLY',
    genericSalesLanguage: false,
    submitted: false,
  };
}

// ---------------------------------------------------------------------------
// E — Integrity / influence denial helpers
// ---------------------------------------------------------------------------

export type InfluenceAttempt =
  | 'automated_lobbying'
  | 'improper_influence'
  | 'bribery'
  | 'procurement_manipulation'
  | 'auto_contact_agency_officials'
  | 'auto_submit_bid';

export function attemptForbiddenInfluence(action: InfluenceAttempt): DenialResult {
  const reasons: Record<InfluenceAttempt, string> = {
    automated_lobbying: 'NO_AUTOMATED_LOBBYING — automated lobbying DENIED.',
    improper_influence: 'NO_IMPROPER_INFLUENCE — improper influence DENIED.',
    bribery: 'NO_BRIBERY — bribery DENIED.',
    procurement_manipulation:
      'NO_PROCUREMENT_MANIPULATION — procurement manipulation DENIED.',
    auto_contact_agency_officials:
      'AUTO_CONTACT_AGENCY_OFFICIALS forbidden (EO2_LOCKS.AUTO_CONTACT_AGENCY_OFFICIALS=false).',
    auto_submit_bid: 'AUTO_SUBMIT_BID forbidden (EO2_LOCKS.AUTO_SUBMIT_BID=false).',
  };
  return deny(reasons[action]);
}

// ---------------------------------------------------------------------------
// Bootstrap + cycle
// ---------------------------------------------------------------------------

export type AgencyKgBootstrap = {
  sotIssue: typeof GITHUB_SOT_ISSUE;
  sotTitle: typeof GITHUB_SOT_TITLE;
  gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  banner: typeof HONESTY_BANNER;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  dbCandidates: typeof EO2_DB_CANDIDATES_STATUS;
  softWire: Eo2SoftWireSnapshot;
  graphModel: typeof AGENCY_KNOWLEDGE_GRAPH_MODEL;
  inferenceLabels: typeof RELATIONSHIP_INFERENCE_LABELS;
  retainedFields: typeof NODE_RETAINED_FIELDS;
  capabilityTags: typeof XIV_CAPABILITY_ALIGNMENT_TAGS;
  may: typeof EO2_MAY;
  mustNot: typeof EO2_MUST_NOT;
  hops: Eo2HopRecord[];
  next: typeof NEXT_PHASE_TITLE;
};

export function bootstrapGovernmentAgencyKnowledgeGraph(
  repoRoot?: string,
): AgencyKgBootstrap {
  const softWire = eo2SoftWireSnapshot(repoRoot);
  const locksIntact = assertEo2LocksIntact();

  const hops: Eo2HopRecord[] = [
    hop('honesty_locks', locksIntact ? 'PASS' : 'FAIL', HONESTY_BANNER),
    hop('agency_kg_bootstrap', 'IMPLEMENTED', 'Agency knowledge graph contracts loaded.'),
    hop(
      'graph_model_encoded',
      'IMPLEMENTED',
      AGENCY_KNOWLEDGE_GRAPH_MODEL.join(' → '),
    ),
    hop(
      'node_retained_fields',
      'IMPLEMENTED',
      `Retained fields=${NODE_RETAINED_FIELDS.length}`,
    ),
    hop(
      'relationship_inference_labels',
      'PASS',
      RELATIONSHIP_INFERENCE_LABELS.join(' | '),
    ),
    hop(
      'historical_award_neq_future_preference',
      'PASS',
      'HISTORICAL_AWARD_EQ_FUTURE_PREFERENCE=false',
    ),
    hop(
      'public_contractor_neq_xiv_partnership',
      'PASS',
      'PUBLIC_CONTRACTOR_EQ_XIV_PARTNERSHIP=false',
    ),
    hop(
      'priorities_from_current_public_evidence_only',
      'PASS',
      'Priorities require current official/public evidence.',
    ),
    hop(
      'leadership_change_timestamped_neq_permanent',
      'PASS',
      'Leadership changes timestamped ≠ permanent.',
    ),
    hop(
      'classified_procurement_excluded',
      'EXCLUDED',
      'Classified procurement excluded unless authorized.',
    ),
    hop('no_automated_lobbying', 'DENIED', 'AUTOMATED_LOBBYING=false'),
    hop('no_improper_influence', 'DENIED', 'IMPROPER_INFLUENCE=false'),
    hop('no_bribery', 'DENIED', 'BRIBERY=false'),
    hop('no_procurement_manipulation', 'DENIED', 'PROCUREMENT_MANIPULATION=false'),
    hop(
      'authorized_public_licensed_data_only',
      'PASS',
      'Unauthorized/unlicensed/classified ingest DENIED.',
    ),
    hop(
      'eo1_command_center_soft_wire',
      softWire.eo1CommandCenter.present ? 'IMPLEMENTED' : 'WAITING_DATA',
      softWire.eo1CommandCenter.note,
    ),
    hop(
      'eo_159_mission_os_soft_wire',
      softWire.eo159MissionOsTypes.present || softWire.eo159MissionOsRuntime.present
        ? 'IMPLEMENTED'
        : 'WAITING_DATA',
      `types=${softWire.eo159MissionOsTypes.present}; runtime=${softWire.eo159MissionOsRuntime.present}; report=${softWire.eo159Report.present}`,
    ),
    hop(
      'en_158_deal_os_soft_wire',
      softWire.en158DealOs.present || softWire.en158DealRuntime.present
        ? 'IMPLEMENTED'
        : 'WAITING_DATA',
      softWire.en158DealOs.note,
    ),
    hop('db_candidates_not_applied', 'NOT_APPLIED', EO2_DB_CANDIDATES_STATUS),
    hop('evidence', 'IMPLEMENTED', 'Structured evidence / denial paths ready.'),
  ];

  return {
    sotIssue: GITHUB_SOT_ISSUE,
    sotTitle: GITHUB_SOT_TITLE,
    gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    banner: HONESTY_BANNER,
    locksIntact,
    l4AutonomyEnabled: false,
    dbCandidates: EO2_DB_CANDIDATES_STATUS,
    softWire,
    graphModel: AGENCY_KNOWLEDGE_GRAPH_MODEL,
    inferenceLabels: RELATIONSHIP_INFERENCE_LABELS,
    retainedFields: NODE_RETAINED_FIELDS,
    capabilityTags: XIV_CAPABILITY_ALIGNMENT_TAGS,
    may: EO2_MAY,
    mustNot: EO2_MUST_NOT,
    hops,
    next: NEXT_PHASE_TITLE,
  };
}

export function runAgencyKnowledgeGraphDemoCycle(input: {
  actor: Eo2Actor;
}): {
  agency: AgencyGraphNode | DenialResult;
  bureau: AgencyGraphNode | DenialResult;
  vehicle: AgencyGraphNode | DenialResult;
  award: AgencyGraphNode | DenialResult;
  vendor: AgencyGraphNode | DenialResult;
  edge: AgencyGraphEdge | DenialResult;
  alignments: AgencyAlignmentHit[];
  patterns: ProcurementPattern[];
  captureLink: CaptureHypothesisLink | DenialResult;
  tailored: MissionTailoredEvidence | DenialResult;
  lobbyDeny: DenialResult;
  hops: Eo2HopRecord[];
} {
  void input.actor;
  const hops: Eo2HopRecord[] = [];

  const publicProv: AgencyGraphProvenance = {
    sourceUrlOrReference: 'https://example.gov/agency/mission',
    sourceDate: '2026-09-01',
    freshness: 'current',
    confidence: 0.82,
    evidenceClass: 'official_public',
  };

  const agency = registerAgencyNode({
    nodeId: 'agency-demo-1',
    officialName: 'Demo Federal Agency',
    provenance: publicProv,
    missionAndPublicPriorities: [
      'logistics modernization',
      'AI-enabled decision support',
    ],
    capabilityAlignmentTags: ['logistics', 'ai', 'modernization'],
  });
  hops.push(
    hop(
      'register_agency_node',
      'denied' in agency ? 'DENIED' : 'REGISTERED',
      'denied' in agency ? agency.reason : agency.nodeId,
    ),
  );

  const bureau = registerBureauProgramMission({
    nodeId: 'bureau-demo-1',
    kind: 'bureau',
    officialName: 'Demo Bureau',
    agencyBureauHierarchy: ['Demo Federal Agency', 'Demo Bureau'],
    provenance: publicProv,
    programNames: ['Modernization Program Alpha'],
  });
  hops.push(
    hop(
      'register_bureau_program_mission',
      'denied' in bureau ? 'DENIED' : 'REGISTERED',
      'denied' in bureau ? bureau.reason : bureau.nodeId,
    ),
  );

  const vehicle = registerProcurementVehicle({
    nodeId: 'vehicle-demo-1',
    officialName: 'Demo IDIQ Vehicle',
    agencyBureauHierarchy: ['Demo Federal Agency', 'Demo Bureau'],
    provenance: publicProv,
    naicsPscAssociations: ['541512', 'D307'],
    setAsidePatterns: ['small_business'],
    contractingOffice: 'Demo Contracting Office',
  });
  hops.push(
    hop(
      'register_procurement_vehicle',
      'denied' in vehicle ? 'DENIED' : 'REGISTERED',
      'denied' in vehicle ? vehicle.reason : vehicle.nodeId,
    ),
  );

  const award = registerOpportunityOrAward({
    nodeId: 'award-demo-1',
    kind: 'award_history',
    officialName: 'Historical public award FY24-001',
    agencyBureauHierarchy: ['Demo Federal Agency'],
    provenance: {
      ...publicProv,
      evidenceClass: 'historical_award_public',
      sourceUrlOrReference: 'https://example.gov/awards/fy24-001',
    },
    publicAwardHistory: ['FY24-001 public award record'],
  });
  hops.push(
    hop(
      'register_opportunity_award',
      'denied' in award ? 'DENIED' : 'REGISTERED',
      'denied' in award ? award.reason : award.nodeId,
    ),
  );

  const vendor = registerVendorRequirementOutcome({
    nodeId: 'vendor-demo-1',
    kind: 'vendor_prime_sub',
    officialName: 'Public Incumbent LLC',
    agencyBureauHierarchy: ['Demo Federal Agency'],
    provenance: publicProv,
    incumbentContractorContext: ['Public award incumbent record'],
  });
  hops.push(
    hop(
      'register_vendor_requirement_outcome',
      'denied' in vendor ? 'DENIED' : 'REGISTERED',
      'denied' in vendor ? vendor.reason : vendor.nodeId,
    ),
  );

  const edge = registerGraphEdge({
    edgeId: 'edge-demo-1',
    fromNodeId: 'agency-demo-1',
    toNodeId: 'bureau-demo-1',
    relation: 'contains_bureau',
    inferenceLabel: 'PUBLIC_EVIDENCE',
    provenance: publicProv,
  });
  hops.push(
    hop(
      'public_evidence_vs_hypothesis_vs_unknown',
      'denied' in edge ? 'DENIED' : edge.state,
      'denied' in edge ? edge.reason : edge.inferenceLabel,
    ),
  );

  const nodes = [agency, bureau, vehicle, award, vendor].filter(
    (n): n is AgencyGraphNode => !('denied' in n),
  );

  const alignments = findAgenciesAlignedWithXivCapabilities({
    nodes,
    tags: ['logistics', 'ai', 'quantum', 'data', 'simulation', 'modernization'],
  });
  hops.push(
    hop(
      'find_agencies_aligned_capabilities',
      'RECOMMENDATION_ONLY',
      `hits=${alignments.length}`,
    ),
  );

  // Seed a second vehicle occurrence for pattern detection
  if (!('denied' in vehicle)) {
    nodes.push({
      ...vehicle,
      nodeId: 'vehicle-demo-2',
      officialName: 'Demo IDIQ Vehicle (recompete notice)',
    });
  }
  const patterns = identifyRepeatedProcurementPatterns({ nodes });
  hops.push(
    hop(
      'identify_repeated_procurement_patterns',
      'ADVISORY_ONLY',
      `patterns=${patterns.length}`,
    ),
  );

  const captureLink = connectAwardsToCaptureHypotheses({
    awardNodeId: 'award-demo-1',
    opportunityHypothesis: 'Possible future logistics modernization recompete — HYPOTHESIS only.',
  });
  hops.push(
    hop(
      'connect_awards_to_capture_hypotheses',
      'denied' in captureLink ? 'DENIED' : 'HYPOTHESIS',
      'denied' in captureLink ? captureLink.reason : captureLink.linkId,
    ),
  );

  const tailored =
    !('denied' in agency)
      ? tailorProposalEvidenceToAgencyMission({
          packageId: 'pkg-demo-1',
          agencyNode: agency,
          evidenceRefs: ['public-mission-page', 'public-budget-excerpt'],
        })
      : deny('Agency registration failed.');
  hops.push(
    hop(
      'tailor_proposal_evidence_to_mission',
      'denied' in tailored ? 'DENIED' : 'PLAN_ONLY',
      'denied' in tailored ? tailored.reason : tailored.packageId,
    ),
  );

  const lobbyDeny = attemptForbiddenInfluence('automated_lobbying');
  hops.push(hop('no_automated_lobbying', 'DENIED', lobbyDeny.reason));

  return {
    agency,
    bureau,
    vehicle,
    award,
    vendor,
    edge,
    alignments,
    patterns,
    captureLink,
    tailored,
    lobbyDeny,
    hops,
  };
}

export function governmentAgencyKnowledgeGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    locks: EO2_LOCKS,
    may: EO2_MAY,
    mustNot: EO2_MUST_NOT,
    cycle: GOVERNMENT_AGENCY_KNOWLEDGE_GRAPH_CYCLE,
    graphModel: AGENCY_KNOWLEDGE_GRAPH_MODEL,
    inferenceLabels: RELATIONSHIP_INFERENCE_LABELS,
  };
}

export type { EvidenceClass };
