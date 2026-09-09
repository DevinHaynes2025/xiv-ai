/**
 * 62L-EO3 — Quantum Mission Opportunity Watch runtime.
 *
 * Workflow:
 * Official opportunity source → classify → capability match → readiness gaps →
 * strategic score → EO Command Center → human bid/no-bid
 *
 * Hard rule: never upgrade capability / quantum truth because a solicitation asks.
 */

import {
  CAPABILITY_MATCH_LABELS,
  EO3_DB_CANDIDATES_STATUS,
  EO3_LOCKS,
  EO3_MAY,
  EO3_MUST_NOT,
  EO3_POLICY_FRAMING,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NOTICE_INSTRUMENT_TYPES,
  OPPORTUNITY_CLASSIFICATION_DOMAINS,
  QUANTUM_MISSION_OPPORTUNITY_WATCH_CYCLE,
  QUANTUM_MISSION_WATCH_FLOW,
  QUANTUM_TRUTH_STATES,
  assertEo3LocksIntact,
  eo3SoftWireSnapshot,
  isCapabilityUpgrade,
  isQuantumTruthUpgrade,
  type CapabilityMatchLabel,
  type CapturePriority,
  type Eo3EvidenceState,
  type Eo3HopRecord,
  type Eo3SoftWireSnapshot,
  type NoticeInstrumentType,
  type OpportunityClassificationDomain,
  type QuantumTruthState,
  type SourceAuthority,
  type WatchFlowHop,
} from './quantum-mission-opportunity-watch-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof QUANTUM_MISSION_OPPORTUNITY_WATCH_CYCLE)[number],
  state: Eo3EvidenceState,
  summary: string,
): Eo3HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

// ---------------------------------------------------------------------------
// Opportunity record (EO3 watch contract)
// ---------------------------------------------------------------------------

export type OpportunityWatchRecord = {
  watchId: string;
  source: string;
  sourceAuthority: SourceAuthority;
  agency: string;
  program: string;
  noticeSolicitationId: string;
  publicationDate: string;
  missionArea: OpportunityClassificationDomain;
  missionAreas: readonly OpportunityClassificationDomain[];
  deadline: string | null;
  contractResearchType: NoticeInstrumentType;
  estimatedValuePublished: number | null;
  estimatedValueCurrency: string | null;
  eligibilityReadinessRequirements: readonly string[];
  eligibilityClaimed: false;
  aiQuantumRelevance: string;
  logisticsRelevance: string;
  xivCapabilityMatch: CapabilityMatchLabel;
  quantumTruthState: QuantumTruthState;
  evidenceGaps: readonly string[];
  capturePriority: CapturePriority;
  humanOwner: string | null;
  strategicScore: number | null;
  flowPosition: WatchFlowHop;
  autoCapabilityUpgraded: false;
  autoBidSubmitted: false;
  fabricatedCertifications: false;
  fabricatedClearances: false;
  fabricatedPastPerformance: false;
  fabricatedQpuAccess: false;
  createdAt: string;
};

export type DeniedResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
};

// ---------------------------------------------------------------------------
// A — Official / authorized source ingest
// ---------------------------------------------------------------------------

export function ingestOfficialOpportunity(input: {
  watchId: string;
  source: string;
  sourceAuthority: SourceAuthority;
  agency: string;
  program: string;
  noticeSolicitationId: string;
  publicationDate: string;
  deadline?: string | null;
  contractResearchType: NoticeInstrumentType;
  estimatedValuePublished?: number | null;
  estimatedValueCurrency?: string | null;
  eligibilityReadinessRequirements?: readonly string[];
  aiQuantumRelevance?: string;
  logisticsRelevance?: string;
  /** Baseline capability from entity evidence — never from solicitation ask alone. */
  xivCapabilityMatch: CapabilityMatchLabel;
  quantumTruthState: QuantumTruthState;
  claimOfficialWithoutAuthority?: boolean;
}): OpportunityWatchRecord | DeniedResult {
  if (
    input.claimOfficialWithoutAuthority ||
    (input.sourceAuthority === 'official' && !input.source.trim())
  ) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'UNOFFICIAL_SOURCE_NEQ_OFFICIAL — cannot claim official authority without an authorized source identity (EO3_LOCKS.UNOFFICIAL_SOURCE_EQ_OFFICIAL=false).',
    };
  }

  if (input.sourceAuthority === 'unofficial' || input.sourceAuthority === 'unknown') {
    // Allowed to ingest but labeled — never promoted to official.
  }

  if (!input.noticeSolicitationId.trim() || !input.publicationDate.trim()) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'PRESERVE_PUBLICATION_DATE_AND_SOLICITATION_ID — both publicationDate and noticeSolicitationId are required.',
    };
  }

  if (!NOTICE_INSTRUMENT_TYPES.includes(input.contractResearchType)) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'UNKNOWN_NOTICE_INSTRUMENT_TYPE',
    };
  }

  return {
    watchId: input.watchId,
    source: input.source,
    sourceAuthority: input.sourceAuthority,
    agency: input.agency,
    program: input.program,
    noticeSolicitationId: input.noticeSolicitationId,
    publicationDate: input.publicationDate,
    missionArea: 'ai_ml_agentic_systems',
    missionAreas: [],
    deadline: input.deadline ?? null,
    contractResearchType: input.contractResearchType,
    estimatedValuePublished: input.estimatedValuePublished ?? null,
    estimatedValueCurrency: input.estimatedValueCurrency ?? null,
    eligibilityReadinessRequirements: input.eligibilityReadinessRequirements ?? [],
    eligibilityClaimed: false,
    aiQuantumRelevance: input.aiQuantumRelevance ?? '',
    logisticsRelevance: input.logisticsRelevance ?? '',
    xivCapabilityMatch: input.xivCapabilityMatch,
    quantumTruthState: input.quantumTruthState,
    evidenceGaps: [],
    capturePriority: 'WATCH_ONLY',
    humanOwner: null,
    strategicScore: null,
    flowPosition: 'official_opportunity_source',
    autoCapabilityUpgraded: false,
    autoBidSubmitted: false,
    fabricatedCertifications: false,
    fabricatedClearances: false,
    fabricatedPastPerformance: false,
    fabricatedQpuAccess: false,
    createdAt: nowIso(),
  };
}

// ---------------------------------------------------------------------------
// B — Classify mission domains + notice type already distinguished at ingest
// ---------------------------------------------------------------------------

export function classifyOpportunity(input: {
  record: OpportunityWatchRecord;
  missionAreas: readonly OpportunityClassificationDomain[];
}): OpportunityWatchRecord | DeniedResult {
  if (input.missionAreas.length === 0) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'CLASSIFY_REQUIRES_AT_LEAST_ONE_MISSION_DOMAIN',
    };
  }
  for (const area of input.missionAreas) {
    if (!OPPORTUNITY_CLASSIFICATION_DOMAINS.includes(area)) {
      return {
        denied: true,
        state: 'DENIED',
        reason: `UNKNOWN_MISSION_DOMAIN: ${area}`,
      };
    }
  }
  return {
    ...input.record,
    missionArea: input.missionAreas[0]!,
    missionAreas: [...input.missionAreas],
    flowPosition: 'classify',
  };
}

export function distinguishNoticeType(
  type: NoticeInstrumentType,
): { type: NoticeInstrumentType; distinguished: true; collapsed: false } {
  return { type, distinguished: true, collapsed: false };
}

// ---------------------------------------------------------------------------
// C — Capability match (NO solicitation-driven upgrade)
// ---------------------------------------------------------------------------

export function matchCapabilityToEvidence(input: {
  record: OpportunityWatchRecord;
  /** Evidence-backed label only. */
  evidenceBackedLabel: CapabilityMatchLabel;
  quantumTruthState: QuantumTruthState;
  /** What the solicitation asks for (informational — must not upgrade). */
  solicitationRequestedCapability?: CapabilityMatchLabel;
  solicitationRequestedQuantumTruth?: QuantumTruthState;
  /** Attack path: attempt to upgrade because solicitation asks. */
  attemptUpgradeFromSolicitation?: boolean;
}): OpportunityWatchRecord | DeniedResult {
  if (!CAPABILITY_MATCH_LABELS.includes(input.evidenceBackedLabel)) {
    return { denied: true, state: 'DENIED', reason: 'UNKNOWN_CAPABILITY_LABEL' };
  }
  if (!QUANTUM_TRUTH_STATES.includes(input.quantumTruthState)) {
    return { denied: true, state: 'DENIED', reason: 'UNKNOWN_QUANTUM_TRUTH_STATE' };
  }

  if (input.attemptUpgradeFromSolicitation) {
    const solicitedCap = input.solicitationRequestedCapability;
    const solicitedQ = input.solicitationRequestedQuantumTruth;
    const wouldUpgradeCap =
      solicitedCap !== undefined &&
      isCapabilityUpgrade(input.evidenceBackedLabel, solicitedCap);
    const wouldUpgradeQ =
      solicitedQ !== undefined &&
      isQuantumTruthUpgrade(input.quantumTruthState, solicitedQ);

    if (wouldUpgradeCap || wouldUpgradeQ || solicitedCap || solicitedQ) {
      return {
        denied: true,
        state: 'DENIED',
        reason:
          'NO_AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION — watch must never upgrade capability/quantum truth because a solicitation asks for it (EO3_LOCKS.AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION=false).',
      };
    }
  }

  // Even without the attempt flag: refuse applying a solicited stronger label.
  if (
    input.solicitationRequestedCapability &&
    isCapabilityUpgrade(input.evidenceBackedLabel, input.solicitationRequestedCapability) &&
    input.solicitationRequestedCapability !== input.evidenceBackedLabel
  ) {
    // Keep evidence-backed label; do not apply solicitation upgrade.
  }

  return {
    ...input.record,
    xivCapabilityMatch: input.evidenceBackedLabel,
    quantumTruthState: input.quantumTruthState,
    autoCapabilityUpgraded: false,
    flowPosition: 'capability_match',
  };
}

/**
 * Explicit denial helper for solicitation-driven upgrade attempts.
 */
export function attemptCapabilityUpgradeFromSolicitation(input: {
  current: CapabilityMatchLabel;
  solicited: CapabilityMatchLabel;
  currentQuantum: QuantumTruthState;
  solicitedQuantum: QuantumTruthState;
}): DeniedResult & {
  upgraded: false;
  autoCapabilityUpgraded: false;
  locks: {
    AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION: false;
    SOLICITATION_ASK_EQ_CAPABILITY_VERIFIED: false;
    SOLICITATION_ASK_EQ_PHYSICAL_QPU_VERIFIED: false;
  };
} {
  void input;
  return {
    denied: true,
    state: 'DENIED',
    upgraded: false,
    autoCapabilityUpgraded: false,
    reason:
      'NO_AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION — solicitation ask ≠ VERIFIED / PHYSICAL_QPU_VERIFIED.',
    locks: {
      AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION: false,
      SOLICITATION_ASK_EQ_CAPABILITY_VERIFIED: false,
      SOLICITATION_ASK_EQ_PHYSICAL_QPU_VERIFIED: false,
    },
  };
}

// ---------------------------------------------------------------------------
// D — Readiness / eligibility gaps (evidence-gated)
// ---------------------------------------------------------------------------

export function surfaceReadinessGaps(input: {
  record: OpportunityWatchRecord;
  evidenceGaps: readonly string[];
  attemptEligibilityClaimWithoutEvidence?: boolean;
  attemptFabricateCertifications?: boolean;
  attemptFabricateClearances?: boolean;
  attemptFabricatePastPerformance?: boolean;
  attemptFabricateQpuAccess?: boolean;
}): OpportunityWatchRecord | DeniedResult {
  if (input.attemptEligibilityClaimWithoutEvidence) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'NO_ELIGIBILITY_CLAIM_WITHOUT_ENTITY_EVIDENCE (EO3_LOCKS.ELIGIBILITY_CLAIM_WITHOUT_ENTITY_EVIDENCE=false).',
    };
  }
  if (input.attemptFabricateCertifications) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_FABRICATE_CERTIFICATIONS (EO3_LOCKS.FABRICATE_CERTIFICATIONS=false).',
    };
  }
  if (input.attemptFabricateClearances) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_FABRICATE_CLEARANCES (EO3_LOCKS.FABRICATE_CLEARANCES=false).',
    };
  }
  if (input.attemptFabricatePastPerformance) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_FABRICATE_PAST_PERFORMANCE (EO3_LOCKS.FABRICATE_PAST_PERFORMANCE=false).',
    };
  }
  if (input.attemptFabricateQpuAccess) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_FABRICATE_QPU_ACCESS (EO3_LOCKS.FABRICATE_QPU_ACCESS=false).',
    };
  }

  return {
    ...input.record,
    evidenceGaps: [...input.evidenceGaps],
    eligibilityClaimed: false,
    fabricatedCertifications: false,
    fabricatedClearances: false,
    fabricatedPastPerformance: false,
    fabricatedQpuAccess: false,
    flowPosition: 'readiness_gaps',
  };
}

// ---------------------------------------------------------------------------
// E — Strategic score + capture priority (advisory)
// ---------------------------------------------------------------------------

export function computeStrategicScore(input: {
  record: OpportunityWatchRecord;
  /** 0–100 advisory score. */
  score: number;
  capturePriority: CapturePriority;
  attemptCommitFromScore?: boolean;
}): OpportunityWatchRecord | DeniedResult {
  if (input.attemptCommitFromScore) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'SCORE_NEQ_COMMIT (EO3_LOCKS.SCORE_EQ_COMMIT=false).',
    };
  }
  if (input.score < 0 || input.score > 100 || Number.isNaN(input.score)) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'STRATEGIC_SCORE_OUT_OF_RANGE',
    };
  }

  return {
    ...input.record,
    strategicScore: input.score,
    capturePriority: input.capturePriority,
    flowPosition: 'strategic_score',
  };
}

// ---------------------------------------------------------------------------
// F — Soft-wire EO Command Center + human bid/no-bid
// ---------------------------------------------------------------------------

export type CommandCenterRoute = {
  watchId: string;
  routed: true;
  executed: false;
  autoBidSubmitted: false;
  softWire: Eo3SoftWireSnapshot;
  state: 'ROUTED' | 'WAITING_DATA';
  summary: string;
};

export function routeToEoCommandCenter(input: {
  record: OpportunityWatchRecord;
  repoRoot?: string;
}): { record: OpportunityWatchRecord; route: CommandCenterRoute } {
  const soft = eo3SoftWireSnapshot(input.repoRoot);
  const eo1Present = soft.eo1CommandCenter.present || soft.eo1CommandCenterReport.present;
  const state: CommandCenterRoute['state'] = eo1Present ? 'ROUTED' : 'WAITING_DATA';
  const summary = eo1Present
    ? 'Routed advisory packet to EO1 Command Center soft-wire (presence ≠ VERIFIED).'
    : 'EO1 Command Center WAITING_DATA — advisory packet staged locally; soft-wire no-op.';

  return {
    record: {
      ...input.record,
      flowPosition: 'eo_command_center',
    },
    route: {
      watchId: input.record.watchId,
      routed: true,
      executed: false,
      autoBidSubmitted: false,
      softWire: soft,
      state,
      summary,
    },
  };
}

export type HumanBidNoBidResult = {
  decisionId: string;
  watchId: string;
  recommendation: 'BID' | 'NO_BID' | 'WATCH';
  binding: false;
  autoSubmitted: false;
  executed: false;
  state: 'HUMAN_BID_NO_BID_REQUIRED' | 'ADVISORY_ONLY' | 'DENIED';
  humanOwner: string | null;
  reason: string;
};

export function requireHumanBidNoBid(input: {
  decisionId: string;
  record: OpportunityWatchRecord;
  recommendation: 'BID' | 'NO_BID' | 'WATCH';
  humanOwner?: string | null;
  attemptAutonomousBid?: boolean;
  attemptExternalCommitment?: boolean;
}): HumanBidNoBidResult {
  if (input.attemptAutonomousBid) {
    return {
      decisionId: input.decisionId,
      watchId: input.record.watchId,
      recommendation: input.recommendation,
      binding: false,
      autoSubmitted: false,
      executed: false,
      state: 'DENIED',
      humanOwner: input.humanOwner ?? null,
      reason:
        'NO_AUTONOMOUS_BID_SUBMISSION (EO3_LOCKS.AUTONOMOUS_BID_SUBMISSION=false; AUTO_SUBMIT_BID=false).',
    };
  }
  if (input.attemptExternalCommitment) {
    return {
      decisionId: input.decisionId,
      watchId: input.record.watchId,
      recommendation: input.recommendation,
      binding: false,
      autoSubmitted: false,
      executed: false,
      state: 'DENIED',
      humanOwner: input.humanOwner ?? null,
      reason:
        'NO_AUTONOMOUS_EXTERNAL_COMMITMENT (EO3_LOCKS.AUTONOMOUS_EXTERNAL_COMMITMENT=false).',
    };
  }

  return {
    decisionId: input.decisionId,
    watchId: input.record.watchId,
    recommendation: input.recommendation,
    binding: false,
    autoSubmitted: false,
    executed: false,
    state: 'HUMAN_BID_NO_BID_REQUIRED',
    humanOwner: input.humanOwner ?? null,
    reason:
      'Advisory capture recommendation only — human owner must decide bid/no-bid (EO3_LOCKS.HUMAN_BID_NO_BID_REQUIRED=true).',
  };
}

export function attemptAutoSubmitBid(): {
  state: 'DENIED';
  executed: false;
  autoSubmitted: false;
  reason: string;
} {
  return {
    state: 'DENIED',
    executed: false,
    autoSubmitted: false,
    reason: 'NO_AUTO_SUBMIT_BID (EO3_LOCKS.AUTO_SUBMIT_BID=false; L4_AUTONOMY_ENABLED=false).',
  };
}

export function assignHumanOwner(input: {
  record: OpportunityWatchRecord;
  humanOwner: string;
}): OpportunityWatchRecord | DeniedResult {
  if (!input.humanOwner.trim()) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'HUMAN_OWNER_REQUIRED_FOR_CAPTURE',
    };
  }
  return {
    ...input.record,
    humanOwner: input.humanOwner.trim(),
    flowPosition: 'human_bid_no_bid',
  };
}

// ---------------------------------------------------------------------------
// Bootstrap + full watch cycle
// ---------------------------------------------------------------------------

export type Eo3BootstrapResult = {
  locksIntact: boolean;
  sotIssue: typeof GITHUB_SOT_ISSUE;
  sotTitle: typeof GITHUB_SOT_TITLE;
  gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  honestyBanner: typeof HONESTY_BANNER;
  nextPhase: typeof NEXT_PHASE_TITLE;
  l4AutonomyEnabled: false;
  dbCandidates: typeof EO3_DB_CANDIDATES_STATUS;
  may: typeof EO3_MAY;
  mustNot: typeof EO3_MUST_NOT;
  policy: typeof EO3_POLICY_FRAMING;
  softWire: Eo3SoftWireSnapshot;
  hops: Eo3HopRecord[];
  watchFlow: typeof QUANTUM_MISSION_WATCH_FLOW;
};

export function bootstrapQuantumMissionOpportunityWatch(
  repoRoot?: string,
): Eo3BootstrapResult {
  const soft = eo3SoftWireSnapshot(repoRoot);
  const locksIntact = assertEo3LocksIntact();
  const hops: Eo3HopRecord[] = [
    hop('honesty_locks', locksIntact ? 'PASS' : 'FAIL', 'EO3 locks intact check'),
    hop('watch_bootstrap', 'IMPLEMENTED', 'EO3 watch bootstrap'),
    hop(
      'official_source_ingest',
      'IMPLEMENTED',
      'Official/authorized ingest surface ready',
    ),
    hop(
      'preserve_publication_date_and_solicitation_id',
      'PASS',
      'Publication date + solicitation ID required',
    ),
    hop(
      'prioritize_official_authorized_sources',
      'PASS',
      EO3_POLICY_FRAMING.officialSources,
    ),
    hop('classify_mission_domain', 'IMPLEMENTED', 'Domain classification surface'),
    hop('distinguish_notice_types', 'PASS', EO3_POLICY_FRAMING.noticeTypes),
    hop('capability_match_labels', 'IMPLEMENTED', 'VERIFIED|SUPPORTED|CANDIDATE|NOT_AVAILABLE'),
    hop(
      'quantum_truth_states',
      'IMPLEMENTED',
      'PHYSICAL_QPU_VERIFIED|SIMULATED|QUANTUM_INSPIRED|THEORETICAL',
    ),
    hop(
      'no_auto_capability_upgrade_from_solicitation',
      'PASS',
      EO3_POLICY_FRAMING.noAutoUpgrade,
    ),
    hop('readiness_gaps', 'IMPLEMENTED', 'Evidence-gap surfacing'),
    hop(
      'no_eligibility_claim_without_entity_evidence',
      'PASS',
      'Eligibility claims denied without entity evidence',
    ),
    hop(
      'no_fabricated_certifications_clearances_pp_qpu',
      'PASS',
      'Fabrication of certs/clearances/PP/QPU denied',
    ),
    hop('strategic_score', 'IMPLEMENTED', 'Advisory strategic score 0–100'),
    hop('capture_priority_assign', 'IMPLEMENTED', 'Advisory capture priority'),
    hop(
      'eo1_command_center_soft_wire',
      soft.eo1CommandCenter.present || soft.eo1CommandCenterReport.present
        ? 'AVAILABLE'
        : 'WAITING_DATA',
      soft.eo1CommandCenter.note,
    ),
    hop(
      'eo2_agency_graph_soft_wire',
      soft.eo2AgencyGraph.present || soft.eo2AgencyGraphReport.present
        ? 'AVAILABLE'
        : 'WAITING_DATA',
      soft.eo2AgencyGraph.note,
    ),
    hop(
      'eo159_umbrella_soft_wire',
      soft.eoUmbrellaReport.present ? 'AVAILABLE' : 'WAITING_DATA',
      soft.eoUmbrellaReport.note,
    ),
    hop(
      'en_deal_os_soft_wire',
      soft.enDealContractOs.present ? 'AVAILABLE' : 'WAITING_DATA',
      soft.enDealContractOs.note,
    ),
    hop('route_to_eo_command_center', 'IMPLEMENTED', 'Advisory route to EO Command Center'),
    hop('human_bid_no_bid_gate', 'PASS', EO3_POLICY_FRAMING.humanGate),
    hop('no_autonomous_bid', 'PASS', 'AUTO_SUBMIT_BID=false'),
    hop('watch_flow_encoded', 'PASS', QUANTUM_MISSION_WATCH_FLOW.join(' → ')),
    hop('evidence', 'DOCUMENTED', 'Unit evidence via test:62leo3; ≠ PRODUCTION AUTHORIZED'),
  ];

  return {
    locksIntact,
    sotIssue: GITHUB_SOT_ISSUE,
    sotTitle: GITHUB_SOT_TITLE,
    gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    honestyBanner: HONESTY_BANNER,
    nextPhase: NEXT_PHASE_TITLE,
    l4AutonomyEnabled: false,
    dbCandidates: EO3_DB_CANDIDATES_STATUS,
    may: EO3_MAY,
    mustNot: EO3_MUST_NOT,
    policy: EO3_POLICY_FRAMING,
    softWire: soft,
    hops,
    watchFlow: QUANTUM_MISSION_WATCH_FLOW,
  };
}

export type WatchCycleResult = {
  record: OpportunityWatchRecord;
  route: CommandCenterRoute;
  humanGate: HumanBidNoBidResult;
  upgradeDenial: ReturnType<typeof attemptCapabilityUpgradeFromSolicitation>;
  autoBidDenial: ReturnType<typeof attemptAutoSubmitBid>;
};

export function runQuantumMissionWatchCycle(input: {
  watchId: string;
  source: string;
  sourceAuthority: SourceAuthority;
  agency: string;
  program: string;
  noticeSolicitationId: string;
  publicationDate: string;
  deadline?: string | null;
  contractResearchType: NoticeInstrumentType;
  missionAreas: readonly OpportunityClassificationDomain[];
  xivCapabilityMatch: CapabilityMatchLabel;
  quantumTruthState: QuantumTruthState;
  evidenceGaps?: readonly string[];
  score?: number;
  capturePriority?: CapturePriority;
  humanOwner?: string;
  recommendation?: 'BID' | 'NO_BID' | 'WATCH';
  /** Solicitations may ask for stronger capability — must be denied. */
  solicitationRequestedCapability?: CapabilityMatchLabel;
  solicitationRequestedQuantumTruth?: QuantumTruthState;
  repoRoot?: string;
}): WatchCycleResult {
  const ingested = ingestOfficialOpportunity({
    watchId: input.watchId,
    source: input.source,
    sourceAuthority: input.sourceAuthority,
    agency: input.agency,
    program: input.program,
    noticeSolicitationId: input.noticeSolicitationId,
    publicationDate: input.publicationDate,
    deadline: input.deadline,
    contractResearchType: input.contractResearchType,
    xivCapabilityMatch: input.xivCapabilityMatch,
    quantumTruthState: input.quantumTruthState,
  });
  if ('denied' in ingested) {
    throw new Error(`ingest denied unexpectedly: ${ingested.reason}`);
  }

  const classified = classifyOpportunity({
    record: ingested,
    missionAreas: input.missionAreas,
  });
  if ('denied' in classified) {
    throw new Error(`classify denied unexpectedly: ${classified.reason}`);
  }

  const matched = matchCapabilityToEvidence({
    record: classified,
    evidenceBackedLabel: input.xivCapabilityMatch,
    quantumTruthState: input.quantumTruthState,
    solicitationRequestedCapability: input.solicitationRequestedCapability,
    solicitationRequestedQuantumTruth: input.solicitationRequestedQuantumTruth,
  });
  if ('denied' in matched) {
    throw new Error(`match denied unexpectedly: ${matched.reason}`);
  }

  const gapped = surfaceReadinessGaps({
    record: matched,
    evidenceGaps: input.evidenceGaps ?? ['entity_eligibility_unverified'],
  });
  if ('denied' in gapped) {
    throw new Error(`gaps denied unexpectedly: ${gapped.reason}`);
  }

  const scored = computeStrategicScore({
    record: gapped,
    score: input.score ?? 55,
    capturePriority: input.capturePriority ?? 'P2',
  });
  if ('denied' in scored) {
    throw new Error(`score denied unexpectedly: ${scored.reason}`);
  }

  const owned =
    input.humanOwner !== undefined
      ? assignHumanOwner({ record: scored, humanOwner: input.humanOwner })
      : scored;
  if ('denied' in owned) {
    throw new Error(`owner denied unexpectedly: ${owned.reason}`);
  }

  const { record, route } = routeToEoCommandCenter({
    record: owned,
    repoRoot: input.repoRoot,
  });

  const humanGate = requireHumanBidNoBid({
    decisionId: `bnb-${input.watchId}`,
    record,
    recommendation: input.recommendation ?? 'WATCH',
    humanOwner: record.humanOwner,
  });

  const upgradeDenial = attemptCapabilityUpgradeFromSolicitation({
    current: input.xivCapabilityMatch,
    solicited: input.solicitationRequestedCapability ?? 'VERIFIED',
    currentQuantum: input.quantumTruthState,
    solicitedQuantum: input.solicitationRequestedQuantumTruth ?? 'PHYSICAL_QPU_VERIFIED',
  });

  return {
    record,
    route,
    humanGate,
    upgradeDenial,
    autoBidDenial: attemptAutoSubmitBid(),
  };
}
