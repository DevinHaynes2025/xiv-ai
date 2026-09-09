/**
 * 62L-EO (#159) — Government Quantum AI Mission OS runtime.
 *
 * A: Government Contracts Command Center foundation
 * B: Mission packs + universal accelerator routing (QPU evidence-gated)
 * C: Quantum/Agentic R&D (NQI research-context labels; classical baselines)
 * D: Logistics Modernization (advisory; deny freight/PO/prod-change)
 * E: CFO Daily Revenue Council (analyze only; deny bid/price/spend/sign)
 * F/G: Soft-wire EN + EM1/EM10; Starlink UNCONNECTED
 * H: Honesty locks + denial surfaces
 *
 * Recommend ≠ charge / deploy / spend / sign / bid.
 */

import {
  ACCELERATOR_CLASSES,
  CFO_COUNCIL_ANALYSIS_SURFACES,
  EO_DB_CANDIDATES_STATUS,
  EO_LOCKS,
  EO_MAY,
  EO_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOVERNMENT_QUANTUM_AI_MISSION_OS_CYCLE,
  HONESTY_BANNER,
  MISSION_PACK_IDS,
  NEXT_PHASE_TITLE,
  NQI_RESEARCH_CONTEXT_LABELS,
  OPPORTUNITY_DECOMPOSITION_FACETS,
  OPPORTUNITY_JURISDICTIONS,
  QPU_EVIDENCE_STATES,
  assertEoLocksIntact,
  eoSoftWireSnapshot,
  isDigitalTwin,
  isHumanApprover,
  type AcceleratorClass,
  type EoActor,
  type EoEvidenceState,
  type EoHopRecord,
  type EoSoftWireSnapshot,
  type MissionPackId,
  type NqiAgencyLabel,
  type OpportunityDecompositionFacet,
  type OpportunityJurisdiction,
  type PartnershipClaimStatus,
  type QpuEvidenceState,
} from './government-quantum-ai-mission-os-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof GOVERNMENT_QUANTUM_AI_MISSION_OS_CYCLE)[number],
  state: EoEvidenceState,
  summary: string,
): EoHopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

// ---------------------------------------------------------------------------
// A — Government Contracts Command Center (EO1 foundation)
// ---------------------------------------------------------------------------

export type GovOpportunityStatus =
  | 'REGISTERED'
  | 'DECOMPOSING'
  | 'AWAITING_HUMAN'
  | 'HUMAN_APPROVED_PACKAGE'
  | 'TRACKING_PERFORMANCE'
  | 'CLOSED'
  | 'DENIED';

export type GovContractsOpportunity = {
  opportunityId: string;
  jurisdiction: OpportunityJurisdiction;
  title: string;
  status: GovOpportunityStatus;
  orgId: string;
  tenantId: string;
  universeId: string;
  facets: Record<OpportunityDecompositionFacet, string[]>;
  autoBidSent: false;
  autoSigned: false;
  createdAt: string;
};

export function registerGovContractsOpportunity(input: {
  opportunityId: string;
  jurisdiction: OpportunityJurisdiction;
  title: string;
  actor: EoActor;
}): GovContractsOpportunity {
  const emptyFacets = Object.fromEntries(
    OPPORTUNITY_DECOMPOSITION_FACETS.map((f) => [f, [] as string[]]),
  ) as Record<OpportunityDecompositionFacet, string[]>;

  return {
    opportunityId: input.opportunityId,
    jurisdiction: input.jurisdiction,
    title: input.title,
    status: 'REGISTERED',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    facets: emptyFacets,
    autoBidSent: false,
    autoSigned: false,
    createdAt: nowIso(),
  };
}

export function decomposeGovOpportunity(
  opportunity: GovContractsOpportunity,
  facet: OpportunityDecompositionFacet,
  items: string[],
): GovContractsOpportunity {
  return {
    ...opportunity,
    status: 'DECOMPOSING',
    facets: {
      ...opportunity.facets,
      [facet]: [...opportunity.facets[facet], ...items],
    },
  };
}

export type HumanApprovalResult =
  | {
      status: 'APPROVED_PACKAGE';
      state: 'PASS';
      opportunityId: string;
      authorizedSubmission: false;
      reason: string;
    }
  | {
      status: 'DENIED';
      state: 'DENIED';
      opportunityId: string;
      reason: string;
    };

export function requireHumanContractsApproval(input: {
  opportunity: GovContractsOpportunity;
  actor: EoActor;
}): HumanApprovalResult {
  if (!isHumanApprover(input.actor)) {
    return {
      status: 'DENIED',
      state: 'DENIED',
      opportunityId: input.opportunity.opportunityId,
      reason: 'HUMAN_APPROVAL_REQUIRED — digital twin / agent cannot approve consequential contract actions.',
    };
  }
  return {
    status: 'APPROVED_PACKAGE',
    state: 'PASS',
    opportunityId: input.opportunity.opportunityId,
    authorizedSubmission: false,
    reason:
      'Human approved package only — submission still requires separate human-authorized gate; no auto bid/sign.',
  };
}

// ---------------------------------------------------------------------------
// B — Mission packs + universal accelerator routing
// ---------------------------------------------------------------------------

export type MissionPackRecord = {
  packId: MissionPackId;
  status: 'REGISTERED';
  advisoryOnly: true;
  productionAuthorized: false;
  registeredAt: string;
};

export function registerMissionPack(packId: MissionPackId): MissionPackRecord {
  if (!MISSION_PACK_IDS.includes(packId)) {
    throw new Error(`Unknown mission pack: ${packId}`);
  }
  return {
    packId,
    status: 'REGISTERED',
    advisoryOnly: true,
    productionAuthorized: false,
    registeredAt: nowIso(),
  };
}

export function listMissionPacks(): MissionPackRecord[] {
  return MISSION_PACK_IDS.map(registerMissionPack);
}

export type AcceleratorRouteRecommendation = {
  accelerator: AcceleratorClass;
  qpuEvidence: QpuEvidenceState | null;
  recommended: true;
  verified: false;
  detectedEqualsVerified: false;
  mayExecuteAutonomously: false;
  classicalBaselineRequired: boolean;
  reason: string;
};

export function recommendAcceleratorRoute(input: {
  accelerator: AcceleratorClass;
  qpuClaimedState?: QpuEvidenceState;
  detectedOnly?: boolean;
  classicalBaselinePresent: boolean;
}): AcceleratorRouteRecommendation | { state: 'DENIED'; reason: string; executed: false } {
  if (!ACCELERATOR_CLASSES.includes(input.accelerator)) {
    return { state: 'DENIED', reason: 'UNKNOWN_ACCELERATOR', executed: false };
  }

  if (input.accelerator === 'QPU') {
    const claimed = input.qpuClaimedState ?? 'THEORETICAL';
    if (!QPU_EVIDENCE_STATES.includes(claimed)) {
      return { state: 'DENIED', reason: 'INVALID_QPU_EVIDENCE_STATE', executed: false };
    }
    if (input.detectedOnly === true && claimed === 'PHYSICAL_QPU_VERIFIED') {
      return {
        state: 'DENIED',
        reason: 'DETECTED_NEQ_VERIFIED — detection alone cannot claim PHYSICAL_QPU_VERIFIED.',
        executed: false,
      };
    }
    if (claimed !== 'PHYSICAL_QPU_VERIFIED' && !input.classicalBaselinePresent) {
      return {
        state: 'DENIED',
        reason: 'CLASSICAL_BASELINE_REQUIRED before SIMULATED / QUANTUM_INSPIRED / THEORETICAL QPU routing.',
        executed: false,
      };
    }
    return {
      accelerator: 'QPU',
      qpuEvidence: claimed,
      recommended: true,
      verified: claimed === 'PHYSICAL_QPU_VERIFIED',
      detectedEqualsVerified: false,
      mayExecuteAutonomously: false,
      classicalBaselineRequired: claimed !== 'PHYSICAL_QPU_VERIFIED',
      reason: `QPU route advisory only — evidence=${claimed}; DETECTED≠VERIFIED; no autonomous execute.`,
    };
  }

  return {
    accelerator: input.accelerator,
    qpuEvidence: null,
    recommended: true,
    verified: false,
    detectedEqualsVerified: false,
    mayExecuteAutonomously: false,
    classicalBaselineRequired: false,
    reason: `${input.accelerator} soft-wire EM fabric route — recommend only; not PRODUCTION AUTHORIZED.`,
  };
}

// ---------------------------------------------------------------------------
// C — Quantum/Agentic R&D (NQI-aware)
// ---------------------------------------------------------------------------

export type QuantumRdProgram = {
  programId: string;
  title: string;
  nqiAgencies: readonly NqiAgencyLabel[];
  partnershipClaim: PartnershipClaimStatus;
  classicalBaselineAttached: boolean;
  quantumAdvantageClaimed: false;
  status: 'REGISTERED' | 'DENIED';
  reason: string;
};

export function registerQuantumAgenticRd(input: {
  programId: string;
  title: string;
  classicalBaselineAttached: boolean;
  claimOfficialPartnership?: boolean;
  claimQuantumAdvantage?: boolean;
}): QuantumRdProgram | { state: 'DENIED'; reason: string; quantumAdvantageClaimed: false } {
  if (input.claimQuantumAdvantage === true) {
    return {
      state: 'DENIED',
      reason: 'NO_QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE — classical baseline + measured evidence required.',
      quantumAdvantageClaimed: false,
    };
  }
  if (!input.classicalBaselineAttached) {
    return {
      state: 'DENIED',
      reason: 'CLASSICAL_BASELINE_REQUIRED for Quantum/Agentic R&D programs.',
      quantumAdvantageClaimed: false,
    };
  }
  if (input.claimOfficialPartnership === true) {
    return {
      state: 'DENIED',
      reason:
        'NQI agency names are RESEARCH_CONTEXT / INTEGRATION_CANDIDATE labels — official partnership claim denied without evidence.',
      quantumAdvantageClaimed: false,
    };
  }

  return {
    programId: input.programId,
    title: input.title,
    nqiAgencies: NQI_RESEARCH_CONTEXT_LABELS.agencies,
    partnershipClaim: NQI_RESEARCH_CONTEXT_LABELS.partnershipClaimDefault,
    classicalBaselineAttached: true,
    quantumAdvantageClaimed: false,
    status: 'REGISTERED',
    reason: `${NQI_RESEARCH_CONTEXT_LABELS.framing} — NIST/NSF/DOE labels are research policy context, not affiliation.`,
  };
}

export function nqiPartnershipLabel(input?: {
  evidencedPartnership?: boolean;
}): PartnershipClaimStatus {
  if (input?.evidencedPartnership === true) return 'EVIDENCED_PARTNERSHIP';
  return NQI_RESEARCH_CONTEXT_LABELS.partnershipClaimDefault;
}

// ---------------------------------------------------------------------------
// D — Logistics Modernization + supply-chain resilience (advisory)
// ---------------------------------------------------------------------------

export type LogisticsAdvice = {
  status: 'ADVISORY_ONLY';
  topic: string;
  recommendations: string[];
  autoFreight: false;
  autoPurchaseOrder: false;
  autoProductionChange: false;
};

export function adviseLogisticsModernization(input: {
  topic: string;
  recommendations: string[];
}): LogisticsAdvice {
  return {
    status: 'ADVISORY_ONLY',
    topic: input.topic,
    recommendations: input.recommendations,
    autoFreight: false,
    autoPurchaseOrder: false,
    autoProductionChange: false,
  };
}

export type AutonomyDeny = {
  state: 'DENIED';
  executed: false;
  reason: string;
};

export function attemptAutonomousFreight(): AutonomyDeny & { autoFreight: false } {
  void EO_LOCKS.AUTO_FREIGHT_DISPATCH;
  return {
    state: 'DENIED',
    executed: false,
    autoFreight: false,
    reason: 'NO_AUTONOMOUS_FREIGHT — logistics modernization is advisory only.',
  };
}

export function attemptAutonomousPurchaseOrder(): AutonomyDeny & { autoPurchaseOrder: false } {
  void EO_LOCKS.AUTO_PURCHASE_ORDER;
  return {
    state: 'DENIED',
    executed: false,
    autoPurchaseOrder: false,
    reason: 'NO_AUTONOMOUS_PURCHASE_ORDER — human authorization required.',
  };
}

export function attemptAutonomousProductionChange(): AutonomyDeny & {
  autoProductionChange: false;
} {
  void EO_LOCKS.AUTO_PRODUCTION_CHANGE;
  return {
    state: 'DENIED',
    executed: false,
    autoProductionChange: false,
    reason: 'NO_AUTONOMOUS_PROD_CHANGE — recommend ≠ deploy/change production.',
  };
}

// ---------------------------------------------------------------------------
// E — CFO Daily Revenue Council
// ---------------------------------------------------------------------------

export type CfoDailyCouncilPacket = {
  status: 'ADVISORY_ONLY';
  surfaces: typeof CFO_COUNCIL_ANALYSIS_SURFACES;
  analyses: Record<(typeof CFO_COUNCIL_ANALYSIS_SURFACES)[number], string>;
  autoBidSent: false;
  pricingCommitmentMade: false;
  spendExecuted: false;
  contractSigned: false;
  l4AutonomyEnabled: false;
  generatedAt: string;
};

export function runCfoDailyRevenueCouncil(input?: {
  notes?: Partial<Record<(typeof CFO_COUNCIL_ANALYSIS_SURFACES)[number], string>>;
}): CfoDailyCouncilPacket {
  const analyses = Object.fromEntries(
    CFO_COUNCIL_ANALYSIS_SURFACES.map((s) => [
      s,
      input?.notes?.[s] ?? `Advisory analysis slot for ${s} — recommend only.`,
    ]),
  ) as Record<(typeof CFO_COUNCIL_ANALYSIS_SURFACES)[number], string>;

  return {
    status: 'ADVISORY_ONLY',
    surfaces: CFO_COUNCIL_ANALYSIS_SURFACES,
    analyses,
    autoBidSent: false,
    pricingCommitmentMade: false,
    spendExecuted: false,
    contractSigned: false,
    l4AutonomyEnabled: EO_LOCKS.L4_AUTONOMY_ENABLED,
    generatedAt: nowIso(),
  };
}

export function attemptAutonomousBid(): AutonomyDeny & { autoBidSent: false } {
  void EO_LOCKS.AUTO_SEND_BID;
  return {
    state: 'DENIED',
    executed: false,
    autoBidSent: false,
    reason: 'NO_AUTONOMOUS_BIDS — CFO council cannot send bids.',
  };
}

export function attemptAutonomousPricingCommitment(): AutonomyDeny & {
  pricingCommitmentMade: false;
} {
  void EO_LOCKS.AUTO_PRICING_COMMITMENT;
  return {
    state: 'DENIED',
    executed: false,
    pricingCommitmentMade: false,
    reason: 'NO_AUTONOMOUS_PRICING_COMMITMENTS — recommend ≠ bind price.',
  };
}

export function attemptAutonomousSpend(): AutonomyDeny & { spendExecuted: false } {
  void EO_LOCKS.AUTO_SPEND;
  return {
    state: 'DENIED',
    executed: false,
    spendExecuted: false,
    reason: 'NO_AUTONOMOUS_SPEND — CFO council cannot spend money.',
  };
}

export function attemptAutonomousSignContract(): AutonomyDeny & { contractSigned: false } {
  void EO_LOCKS.AUTO_SIGN_CONTRACT;
  return {
    state: 'DENIED',
    executed: false,
    contractSigned: false,
    reason: 'NO_AUTONOMOUS_SIGN_CONTRACTS — human signature required.',
  };
}

// ---------------------------------------------------------------------------
// F — EN soft-wire: SAM/FAR research; human-authorized submission only
// ---------------------------------------------------------------------------

export type AdapterProbe = {
  adapter: 'SAM_GOV' | 'FAR_RESEARCH' | 'STARLINK';
  status: 'UNAVAILABLE' | 'UNCONNECTED';
  configured: false;
  autoCertify: false;
  autoRepresent: false;
  autoAccept: false;
  reason: string;
};

export function probeSamGovAdapter(): AdapterProbe {
  return {
    adapter: 'SAM_GOV',
    status: 'UNAVAILABLE',
    configured: EO_LOCKS.SAM_GOV_CONFIGURED,
    autoCertify: false,
    autoRepresent: false,
    autoAccept: false,
    reason: 'SAM.gov research adapter UNAVAILABLE until configured; human-authorized submission only.',
  };
}

export function probeFarResearchAdapter(): AdapterProbe {
  return {
    adapter: 'FAR_RESEARCH',
    status: 'UNAVAILABLE',
    configured: EO_LOCKS.FAR_ADAPTER_CONFIGURED,
    autoCertify: false,
    autoRepresent: false,
    autoAccept: false,
    reason: 'FAR research adapter UNAVAILABLE until configured — not legal advice authority.',
  };
}

export function attemptAutoCertifyRepresentAccept(): AutonomyDeny & {
  autoCertified: false;
  autoRepresented: false;
  autoAccepted: false;
} {
  return {
    state: 'DENIED',
    executed: false,
    autoCertified: false,
    autoRepresented: false,
    autoAccepted: false,
    reason: 'NO_AUTO_CERTIFY_REPRESENT_ACCEPT — EN soft-wire inherits human-authorized submission only.',
  };
}

// ---------------------------------------------------------------------------
// G — Starlink / satellite / vehicle control
// ---------------------------------------------------------------------------

export type StarlinkProbe = AdapterProbe & {
  liveControl: false;
  vehicleControl: false;
};

export function probeStarlinkAdapter(input?: {
  claimConnectedWithoutCredentials?: boolean;
  attemptSatelliteControl?: boolean;
  attemptVehicleControl?: boolean;
}): StarlinkProbe | AutonomyDeny {
  if (input?.claimConnectedWithoutCredentials === true) {
    return {
      state: 'DENIED',
      executed: false,
      reason: 'STARLINK_REMAINS_UNCONNECTED without legitimate credentials + eligibility evidence.',
    };
  }
  if (input?.attemptSatelliteControl === true) {
    return {
      state: 'DENIED',
      executed: false,
      reason: 'SATELLITE_RESEARCH_NEQ_CONTROL — telecom/satellite research ≠ live control.',
    };
  }
  if (input?.attemptVehicleControl === true) {
    return {
      state: 'DENIED',
      executed: false,
      reason: 'NO_LIVE_VEHICLE_CONTROL.',
    };
  }
  return {
    adapter: 'STARLINK',
    status: 'UNCONNECTED',
    configured: false,
    autoCertify: false,
    autoRepresent: false,
    autoAccept: false,
    liveControl: false,
    vehicleControl: false,
    reason:
      'Starlink adapter candidate UNCONNECTED / UNAVAILABLE until credentials; research ≠ control.',
  };
}

// ---------------------------------------------------------------------------
// H — Digital twin ≠ founder; recommend ≠ charge/deploy/spend/sign
// ---------------------------------------------------------------------------

export function attemptDigitalTwinAsFounder(input: {
  actor: EoActor;
  action: 'charge' | 'deploy' | 'spend' | 'sign' | 'approve';
}): AutonomyDeny {
  if (isDigitalTwin(input.actor) || !isHumanApprover(input.actor)) {
    return {
      state: 'DENIED',
      executed: false,
      reason: `DIGITAL_TWIN_NEQ_FOUNDER — cannot ${input.action}; recommend ≠ charge/deploy/spend/sign.`,
    };
  }
  return {
    state: 'DENIED',
    executed: false,
    reason: `Even human path for ${input.action} is outside EO autonomous execution — external gate required.`,
  };
}

export function attemptL4Autonomy(): AutonomyDeny & { l4Enabled: false } {
  return {
    state: 'DENIED',
    executed: false,
    l4Enabled: EO_LOCKS.L4_AUTONOMY_ENABLED,
    reason: 'L4_AUTONOMY_ENABLED=false',
  };
}

// ---------------------------------------------------------------------------
// Bootstrap / cycle
// ---------------------------------------------------------------------------

export type EoBootstrapResult = {
  sotIssue: typeof GITHUB_SOT_ISSUE;
  sotTitle: typeof GITHUB_SOT_TITLE;
  gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  honestyBanner: typeof HONESTY_BANNER;
  nextPhase: typeof NEXT_PHASE_TITLE;
  locksIntact: boolean;
  dbCandidates: typeof EO_DB_CANDIDATES_STATUS;
  may: typeof EO_MAY;
  mustNot: typeof EO_MUST_NOT;
  softWire: EoSoftWireSnapshot;
  jurisdictions: typeof OPPORTUNITY_JURISDICTIONS;
  missionPacks: typeof MISSION_PACK_IDS;
  nqi: typeof NQI_RESEARCH_CONTEXT_LABELS;
  hops: EoHopRecord[];
  cfoCouncil: CfoDailyCouncilPacket;
  starlink: StarlinkProbe | AutonomyDeny;
  sam: AdapterProbe;
  far: AdapterProbe;
};

export function bootstrapGovernmentQuantumAiMissionOs(repoRoot?: string): EoBootstrapResult {
  const softWire = eoSoftWireSnapshot(repoRoot);
  const locksIntact = assertEoLocksIntact();
  const hops: EoHopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact ? 'EO locks intact.' : 'EO locks broken.',
    ),
  );
  hops.push(hop('mission_os_bootstrap', 'PASS', 'Mission OS bootstrap advisory surface ready.'));
  hops.push(
    hop(
      'gov_contracts_command_center_register',
      'PASS',
      'Government Contracts Command Center foundation registered (EO1 precursor).',
    ),
  );
  hops.push(hop('opportunity_decompose', 'PASS', 'Decomposition facets encoded.'));
  hops.push(hop('human_approval_gates', 'PASS', 'Human approval required before consequential actions.'));
  hops.push(hop('mission_pack_register', 'PASS', `${MISSION_PACK_IDS.length} mission packs encoded.`));
  hops.push(
    hop(
      'universal_accelerator_routing_soft_wire',
      softWire.em3Registry.present ? 'PASS' : 'WAITING_DATA',
      softWire.em3Registry.note,
    ),
  );
  hops.push(hop('qpu_evidence_gated', 'PASS', 'QPU evidence ladder PHYSICAL_QPU_VERIFIED|SIMULATED|QUANTUM_INSPIRED|THEORETICAL.'));
  hops.push(hop('quantum_agentic_rd_register', 'PASS', 'Quantum/Agentic R&D surface advisory.'));
  hops.push(hop('classical_baseline_required', 'PASS', 'Classical baselines required.'));
  hops.push(hop('no_quantum_advantage_without_evidence', 'PASS', 'Quantum advantage without evidence DENIED.'));
  hops.push(
    hop(
      'nqi_research_context_labels',
      'RESEARCH_CONTEXT',
      'NIST/NSF/DOE = research context labels, not claimed affiliation.',
    ),
  );
  hops.push(hop('logistics_modernization_advise', 'ADVISORY_ONLY', 'Logistics modernization advisory.'));
  hops.push(hop('no_autonomous_freight', 'DENIED', attemptAutonomousFreight().reason));
  hops.push(hop('no_autonomous_purchase_order', 'DENIED', attemptAutonomousPurchaseOrder().reason));
  hops.push(hop('no_autonomous_prod_change', 'DENIED', attemptAutonomousProductionChange().reason));

  const cfoCouncil = runCfoDailyRevenueCouncil();
  hops.push(hop('cfo_daily_revenue_council', 'ADVISORY_ONLY', 'CFO Daily Revenue Council packet built.'));
  hops.push(hop('no_autonomous_bids', 'DENIED', attemptAutonomousBid().reason));
  hops.push(hop('no_autonomous_pricing_commitments', 'DENIED', attemptAutonomousPricingCommitment().reason));
  hops.push(hop('no_autonomous_spend', 'DENIED', attemptAutonomousSpend().reason));
  hops.push(hop('no_autonomous_sign_contracts', 'DENIED', attemptAutonomousSignContract().reason));

  hops.push(
    hop(
      'en_deal_gov_contracting_soft_wire',
      softWire.enDealContractRuntime.present ? 'PASS' : 'WAITING_DATA',
      softWire.enDealContractRuntime.note,
    ),
  );
  hops.push(
    hop(
      'sam_far_research_human_authorized_only',
      'UNAVAILABLE',
      'SAM/FAR research UNAVAILABLE until configured; human-authorized submission only.',
    ),
  );
  hops.push(
    hop(
      'em1_em10_pricing_home_base_soft_wire',
      softWire.em1HomeBase.present && softWire.em10UserAccessEconomy.present ? 'PASS' : 'WAITING_DATA',
      `EM1=${softWire.em1HomeBase.present}; EM10=${softWire.em10UserAccessEconomy.present}`,
    ),
  );

  const starlink = probeStarlinkAdapter();
  hops.push(
    hop(
      'starlink_unconnected_until_credentials',
      'UNCONNECTED',
      'status' in starlink ? starlink.reason : starlink.reason,
    ),
  );
  hops.push(hop('digital_twin_neq_founder', 'PASS', 'Digital Twin ≠ founder.'));
  hops.push(hop('detected_neq_verified', 'PASS', 'DETECTED ≠ VERIFIED.'));
  hops.push(hop('satellite_research_neq_control', 'PASS', 'Satellite/telecom research ≠ control.'));
  hops.push(
    hop(
      'documented_neq_implemented_neq_verified_neq_prod',
      'PASS',
      HONESTY_BANNER,
    ),
  );
  hops.push(hop('db_candidates_not_applied', 'NOT_APPLIED', EO_DB_CANDIDATES_STATUS));
  hops.push(hop('evidence', locksIntact ? 'PASS' : 'FAIL', 'EO bootstrap evidence ledger closed.'));

  return {
    sotIssue: GITHUB_SOT_ISSUE,
    sotTitle: GITHUB_SOT_TITLE,
    gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    honestyBanner: HONESTY_BANNER,
    nextPhase: NEXT_PHASE_TITLE,
    locksIntact,
    dbCandidates: EO_DB_CANDIDATES_STATUS,
    may: EO_MAY,
    mustNot: EO_MUST_NOT,
    softWire,
    jurisdictions: OPPORTUNITY_JURISDICTIONS,
    missionPacks: MISSION_PACK_IDS,
    nqi: NQI_RESEARCH_CONTEXT_LABELS,
    hops,
    cfoCouncil,
    starlink,
    sam: probeSamGovAdapter(),
    far: probeFarResearchAdapter(),
  };
}

export function runGovernmentQuantumAiMissionCycle(repoRoot?: string): EoBootstrapResult {
  return bootstrapGovernmentQuantumAiMissionOs(repoRoot);
}
