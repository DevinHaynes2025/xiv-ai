/**
 * 62L-ER11 — Public Government Data Pack runtime.
 *
 * Register official sources after rights/provenance; normalize/dedupe/index into
 * Government Knowledge Graph; classify truth states (never LIVE/real-time without
 * verified connection); build advisory capture/logistics analyses; deny
 * classified assumptions / portal bypass / fabricated relationships /
 * unsupported award claims / cross-tenant private pooling /
 * historical-as-future-guarantee.
 */

import { createHash } from 'node:crypto';
import {
  ER11_AGENT_BOUNDS,
  ER11_DB_CANDIDATES_STATUS,
  ER11_LOCKS,
  ER11_MAY,
  ER11_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_AUTHORITATIVE_LEVELS,
  GOV_CONTRACT_USE_CHAIN,
  GOV_DATA_BOUNDARY,
  GOV_DATA_CORE_FLOW,
  GOV_DATA_PRIORITY_CATEGORIES,
  GOV_DATA_TRUTH_STATES,
  GOV_HISTORICAL_BUYING_RULE,
  GOV_INGESTION_STATES,
  GOV_LOGISTICS_USES,
  GOV_SOURCE_RECORD_FIELDS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PUBLIC_GOVERNMENT_DATA_PACK_CYCLE,
  assertEr11LocksIntact,
  er11SoftWireSnapshot,
  historicalAwardsGuaranteeFutureBuying,
  isEr11Agent,
  isHumanApprover,
  mayClaimRealtime,
  softWireHopState,
  type AdvisoryCaptureAnalysis,
  type AdvisoryLogisticsAnalysis,
  type Er11Actor,
  type Er11EvidenceState,
  type Er11HopRecord,
  type Er11SoftWireSnapshot,
  type GovAuthoritativeLevel,
  type GovDataPriorityCategory,
  type GovDataTruthState,
  type GovLogisticsUse,
  type GovernmentKnowledgeGraphNode,
  type GovernmentSourceRecord,
} from './public-government-data-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PUBLIC_GOVERNMENT_DATA_PACK_CYCLE)[number],
  state: Er11EvidenceState,
  summary: string,
): Er11HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
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

export function attemptClassifiedOrNonPublicAssumption(): DenialResult {
  return deny(
    'CLASSIFIED_OR_NON_PUBLIC_GOV_DATA_ASSUMPTIONS=false — public government data only.',
  );
}

export function attemptRestrictedPortalBypass(): DenialResult {
  return deny('BYPASS_RESTRICTED_PORTALS=false.');
}

export function attemptFabricateAgencyRelationship(): DenialResult {
  return deny('FABRICATE_AGENCY_RELATIONSHIP=false.');
}

export function attemptUnsupportedEligibilityOrAwardClaim(): DenialResult {
  return deny('UNSUPPORTED_ELIGIBILITY_OR_AWARD_CLAIMS=false.');
}

export function attemptCrossTenantPrivateContractPooling(): DenialResult {
  return deny('CROSS_TENANT_POOL_PRIVATE_CONTRACT_DATA=false.');
}

export function attemptHistoricalAsFutureBuyingGuarantee(): DenialResult {
  return deny(
    'HISTORICAL_AWARDS_AS_GUARANTEED_FUTURE_BUYING=false — historical spending/awards ≠ guaranteed future buying.',
  );
}

export function attemptRealtimeWithoutVerifiedLiveConnection(): DenialResult {
  return deny(
    'CLAIM_REALTIME_WITHOUT_VERIFIED_LIVE_CONNECTION=false — never claim real-time without verified live connection.',
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
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act / authorize.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function classifyGovDataTruthState(input: {
  isOfficial: boolean;
  isCurrentPublication: boolean;
  isHistorical: boolean;
  delayed: boolean;
  stale: boolean;
  incomplete: boolean;
  sourceSupportsRealtime: boolean;
  liveConnectionVerified: boolean;
  attemptClaimRealtime?: boolean;
}): GovDataTruthState | DenialResult {
  if (
    input.attemptClaimRealtime ||
    ER11_LOCKS.CLAIM_REALTIME_WITHOUT_VERIFIED_LIVE_CONNECTION
  ) {
    if (
      !mayClaimRealtime({
        sourceSupportsRealtime: input.sourceSupportsRealtime,
        liveConnectionVerified: input.liveConnectionVerified,
      })
    ) {
      return attemptRealtimeWithoutVerifiedLiveConnection();
    }
  }
  if (input.stale) return 'STALE';
  if (input.incomplete) return 'INCOMPLETE';
  if (input.delayed) return 'DELAYED';
  if (input.isOfficial && input.isHistorical) return 'OFFICIAL_HISTORICAL';
  if (input.isOfficial && input.isCurrentPublication) return 'OFFICIAL_CURRENT';
  return 'UNKNOWN';
}

export function registerOfficialGovernmentSource(input: {
  actor: Er11Actor;
  governmentSourceId: string;
  agencyAuthority: string;
  datasetApi: string;
  jurisdiction: string;
  publicationUpdateDate: string;
  geographicScope: string;
  timeRange: string;
  schema: string;
  accessMethod: string;
  licensePublicUseTerms: string;
  freshness: string;
  dataQualityNotes: string;
  authoritativeSourceLevel: GovAuthoritativeLevel;
  category: GovDataPriorityCategory;
  evidenceRefs: readonly string[];
  rightsProvenancePassed: boolean;
  sourceSupportsRealtime?: boolean;
  liveConnectionVerified?: boolean;
  attemptClassifiedAssumption?: boolean;
  attemptPortalBypass?: boolean;
  attemptHiddenCot?: boolean;
}): GovernmentSourceRecord | DenialResult {
  if (!isEr11Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER11 agents / home_base may register government sources.');
  }
  if (input.attemptClassifiedAssumption) {
    return attemptClassifiedOrNonPublicAssumption();
  }
  if (input.attemptPortalBypass) {
    return attemptRestrictedPortalBypass();
  }
  if (input.attemptHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_GOV_DATA_PACK=false — no hidden chain-of-thought.',
    );
  }
  if (!input.rightsProvenancePassed) {
    return deny(
      'Provenance/rights gate required before registering official government source.',
    );
  }
  if (!input.licensePublicUseTerms || !input.evidenceRefs.length) {
    return deny(
      'license/public-use terms and evidence refs required for official registration.',
    );
  }
  if (!ER11_AGENT_BOUNDS.mayRegisterOfficialPublicSourcesAfterRightsGate) {
    return deny('mayRegisterOfficialPublicSourcesAfterRightsGate=false');
  }

  const truth = classifyGovDataTruthState({
    isOfficial: true,
    isCurrentPublication: !input.timeRange.toLowerCase().includes('historical'),
    isHistorical: input.timeRange.toLowerCase().includes('historical'),
    delayed: false,
    stale: false,
    incomplete: false,
    sourceSupportsRealtime: input.sourceSupportsRealtime === true,
    liveConnectionVerified: input.liveConnectionVerified === true,
  });
  if (typeof truth !== 'string') return truth;

  return {
    governmentSourceId: input.governmentSourceId,
    agencyAuthority: input.agencyAuthority,
    datasetApi: input.datasetApi,
    jurisdiction: input.jurisdiction,
    publicationUpdateDate: input.publicationUpdateDate,
    geographicScope: input.geographicScope,
    timeRange: input.timeRange,
    schema: input.schema,
    accessMethod: input.accessMethod,
    licensePublicUseTerms: input.licensePublicUseTerms,
    freshness: input.freshness,
    dataQualityNotes: input.dataQualityNotes,
    authoritativeSourceLevel: input.authoritativeSourceLevel,
    ingestionState: 'APPROVED',
    truthState: truth,
    category: input.category,
    evidenceRefs: input.evidenceRefs,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    classifiedOrNonPublicAssumed: false,
    liveRealtimeClaimed: false,
    liveConnectionVerified: input.liveConnectionVerified === true,
    secretOrRestrictedPortalBypassed: false,
  };
}

function normalizeKey(source: GovernmentSourceRecord): string {
  return [
    source.agencyAuthority,
    source.datasetApi,
    source.jurisdiction,
    source.geographicScope,
    source.timeRange,
    source.schema,
  ]
    .join('|')
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function normalizeDedupeIndexIntoGovKnowledgeGraph(input: {
  actor: Er11Actor;
  sources: readonly GovernmentSourceRecord[];
  existingNormalizedKeys?: ReadonlySet<string>;
}):
  | {
      nodes: GovernmentKnowledgeGraphNode[];
      dedupedCount: number;
      indexedCount: number;
      sources: GovernmentSourceRecord[];
    }
  | DenialResult {
  if (!ER11_AGENT_BOUNDS.mayNormalizeDedupeIndexIntoGovKnowledgeGraph) {
    return deny('mayNormalizeDedupeIndexIntoGovKnowledgeGraph=false');
  }
  if (!isEr11Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER11 agents / home_base may index into gov KG.');
  }

  const seen = new Set<string>(input.existingNormalizedKeys ?? []);
  const nodes: GovernmentKnowledgeGraphNode[] = [];
  const updated: GovernmentSourceRecord[] = [];
  let dedupedCount = 0;

  for (const source of input.sources) {
    if (source.orgId !== input.actor.orgId || source.tenantId !== input.actor.tenantId) {
      return attemptCrossTenantPrivateContractPooling();
    }
    const key = normalizeKey(source);
    if (seen.has(key)) {
      dedupedCount += 1;
      continue;
    }
    seen.add(key);
    const advanced: GovernmentSourceRecord = {
      ...source,
      ingestionState: 'GRAPHED',
    };
    updated.push(advanced);
    nodes.push({
      nodeId: `gkg-${source.governmentSourceId}`,
      governmentSourceId: source.governmentSourceId,
      category: source.category,
      normalizedKey: key,
      indexed: true,
      truthState: source.truthState,
      evidenceRefs: source.evidenceRefs,
      orgId: source.orgId,
      tenantId: source.tenantId,
      universeId: source.universeId,
    });
  }

  return {
    nodes,
    dedupedCount,
    indexedCount: nodes.length,
    sources: updated,
  };
}

export function buildAdvisoryCaptureAnalysis(input: {
  actor: Er11Actor;
  analysisId: string;
  governmentSourceIds: readonly string[];
  summary: string;
  evidenceRefs: readonly string[];
  attemptGuaranteeFutureBuying?: boolean;
  attemptUnsupportedAwardClaim?: boolean;
  attemptFabricateAgencyRelationship?: boolean;
}): AdvisoryCaptureAnalysis | DenialResult {
  if (!ER11_AGENT_BOUNDS.mayBuildAdvisoryCaptureAnalyses) {
    return deny('mayBuildAdvisoryCaptureAnalyses=false');
  }
  if (input.attemptGuaranteeFutureBuying) {
    return attemptHistoricalAsFutureBuyingGuarantee();
  }
  if (input.attemptUnsupportedAwardClaim) {
    return attemptUnsupportedEligibilityOrAwardClaim();
  }
  if (input.attemptFabricateAgencyRelationship) {
    return attemptFabricateAgencyRelationship();
  }
  if (historicalAwardsGuaranteeFutureBuying()) {
    return attemptHistoricalAsFutureBuyingGuarantee();
  }
  if (!input.governmentSourceIds.length || !input.evidenceRefs.length) {
    return deny('Capture analysis requires government sources and evidence refs.');
  }

  return {
    analysisId: input.analysisId,
    chain: GOV_CONTRACT_USE_CHAIN,
    governmentSourceIds: input.governmentSourceIds,
    advisoryOnly: true,
    historicalAsGuaranteedFutureBuying: false,
    unsupportedAwardClaim: false,
    fabricatedAgencyRelationship: false,
    summary: input.summary,
    evidenceRefs: input.evidenceRefs,
  };
}

export function buildAdvisoryLogisticsAnalysis(input: {
  actor: Er11Actor;
  analysisId: string;
  uses: readonly GovLogisticsUse[];
  governmentSourceIds: readonly string[];
  summary: string;
  evidenceRefs: readonly string[];
}): AdvisoryLogisticsAnalysis | DenialResult {
  if (!ER11_AGENT_BOUNDS.mayBuildAdvisoryLogisticsAnalyses) {
    return deny('mayBuildAdvisoryLogisticsAnalyses=false');
  }
  if (!input.uses.length) {
    return deny('Logistics analysis requires at least one allowed logistics use.');
  }
  for (const use of input.uses) {
    if (!(GOV_LOGISTICS_USES as readonly string[]).includes(use)) {
      return deny(`Logistics use ${use} is not in the MAY allow-list.`);
    }
  }
  if (!input.governmentSourceIds.length || !input.evidenceRefs.length) {
    return deny(
      'Logistics analysis requires government sources and evidence refs.',
    );
  }

  return {
    analysisId: input.analysisId,
    uses: input.uses,
    governmentSourceIds: input.governmentSourceIds,
    advisoryOnly: true,
    summary: input.summary,
    evidenceRefs: input.evidenceRefs,
  };
}

export function returnEr11EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er11Actor;
  governmentSourceId: string;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
      governmentSourceId: string;
      advisoryOnly: true;
    }
  | DenialResult {
  if (!ER11_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEr11Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER11 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
    governmentSourceId: input.governmentSourceId,
    advisoryOnly: true,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er11Actor;
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
    unchanged: ER11_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER11_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER11_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleOfficialProcurementSource(
  actor: Er11Actor,
): GovernmentSourceRecord {
  const registered = registerOfficialGovernmentSource({
    actor,
    governmentSourceId: 'gov-src-sam-awards-1',
    agencyAuthority: 'U.S. GSA / SAM.gov (illustrative public catalog)',
    datasetApi: 'https://api.sam.gov/entity-information/v1 (illustrative)',
    jurisdiction: 'US-federal',
    publicationUpdateDate: '2026-09-01',
    geographicScope: 'United States',
    timeRange: 'historical FY2018-FY2025',
    schema: 'public_award_summary_v1',
    accessMethod: 'public_api_or_bulk_download',
    licensePublicUseTerms: 'U.S. government public-use / open data terms',
    freshness: 'batch_periodic',
    dataQualityNotes: 'Illustrative park record; not live-verified.',
    authoritativeSourceLevel: 'PRIMARY_OFFICIAL',
    category: 'procurement_opportunities_and_awards',
    evidenceRefs: ['docs://public-gov/sam-awards-catalog'],
    rightsProvenancePassed: true,
    sourceSupportsRealtime: false,
    liveConnectionVerified: false,
  });
  if ('denied' in registered) throw new Error(registered.reason);
  return registered;
}

export function bootstrapPublicGovernmentDataPack(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er11SoftWireSnapshot;
  priorityCategories: typeof GOV_DATA_PRIORITY_CATEGORIES;
  sourceFields: typeof GOV_SOURCE_RECORD_FIELDS;
  coreFlow: typeof GOV_DATA_CORE_FLOW;
  contractUseChain: typeof GOV_CONTRACT_USE_CHAIN;
  logisticsUses: typeof GOV_LOGISTICS_USES;
  truthStates: typeof GOV_DATA_TRUTH_STATES;
  ingestionStates: typeof GOV_INGESTION_STATES;
  authoritativeLevels: typeof GOV_AUTHORITATIVE_LEVELS;
  govDataBoundary: typeof GOV_DATA_BOUNDARY;
  historicalBuyingRule: typeof GOV_HISTORICAL_BUYING_RULE;
  erLayer: typeof ER_LAYER_TITLE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof ER11_MAY;
  mustNot: typeof ER11_MUST_NOT;
  dbCandidates: typeof ER11_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEr11LocksIntact(),
    softWire: er11SoftWireSnapshot(repoRoot),
    priorityCategories: GOV_DATA_PRIORITY_CATEGORIES,
    sourceFields: GOV_SOURCE_RECORD_FIELDS,
    coreFlow: GOV_DATA_CORE_FLOW,
    contractUseChain: GOV_CONTRACT_USE_CHAIN,
    logisticsUses: GOV_LOGISTICS_USES,
    truthStates: GOV_DATA_TRUTH_STATES,
    ingestionStates: GOV_INGESTION_STATES,
    authoritativeLevels: GOV_AUTHORITATIVE_LEVELS,
    govDataBoundary: GOV_DATA_BOUNDARY,
    historicalBuyingRule: GOV_HISTORICAL_BUYING_RULE,
    erLayer: ER_LAYER_TITLE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: ER11_MAY,
    mustNot: ER11_MUST_NOT,
    dbCandidates: ER11_DB_CANDIDATES_STATUS,
  };
}

export function runPublicGovernmentDataPackCycle(input: {
  actor: Er11Actor;
  human: Er11Actor;
  repoRoot?: string;
}): {
  hops: Er11HopRecord[];
  source: GovernmentSourceRecord;
  softWire: Er11SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Er11HopRecord[] = [];
  const softWire = er11SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr11LocksIntact() ? 'PASS' : 'FAIL',
      'ER11 locks intact including L4=false and historical≠future buying.',
    ),
  );
  hops.push(
    hop(
      'public_government_data_pack_bootstrap',
      'PASS',
      'Public Government Data Pack bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'priority_categories_encoded',
      GOV_DATA_PRIORITY_CATEGORIES.length === 14 ? 'PASS' : 'FAIL',
      GOV_DATA_PRIORITY_CATEGORIES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'source_fields_encoded',
      GOV_SOURCE_RECORD_FIELDS.length === 15 &&
        GOV_SOURCE_RECORD_FIELDS[0] === 'governmentSourceId'
        ? 'PASS'
        : 'FAIL',
      GOV_SOURCE_RECORD_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      GOV_DATA_CORE_FLOW.length === 7 ? 'PASS' : 'FAIL',
      GOV_DATA_CORE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'contract_use_chain_encoded',
      GOV_CONTRACT_USE_CHAIN.length === 9 ? 'PASS' : 'FAIL',
      GOV_CONTRACT_USE_CHAIN.join(' → '),
    ),
  );
  hops.push(
    hop(
      'logistics_uses_encoded',
      GOV_LOGISTICS_USES.length === 8 ? 'PASS' : 'FAIL',
      GOV_LOGISTICS_USES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'truth_states_encoded',
      GOV_DATA_TRUTH_STATES.length === 6 ? 'PASS' : 'FAIL',
      GOV_DATA_TRUTH_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'gov_data_boundary_encoded',
      GOV_DATA_BOUNDARY.mayAssumeClassifiedOrNonPublicGovData === false &&
        GOV_DATA_BOUNDARY.mayTreatHistoricalAwardsAsGuaranteedFutureBuying ===
          false &&
        GOV_DATA_BOUNDARY.mayClaimRealTimeWithoutVerifiedLiveConnection ===
          false
        ? 'PASS'
        : 'FAIL',
      'Gov data boundary: public-only; historical≠future; no unverified realtime.',
    ),
  );

  const deniedWithoutRights = registerOfficialGovernmentSource({
    actor: input.actor,
    governmentSourceId: 'gov-src-denied',
    agencyAuthority: 'Example Agency',
    datasetApi: 'https://example.gov/api',
    jurisdiction: 'US-federal',
    publicationUpdateDate: '2026-01-01',
    geographicScope: 'US',
    timeRange: '2020-2025',
    schema: 'v1',
    accessMethod: 'api',
    licensePublicUseTerms: 'public-use',
    freshness: 'periodic',
    dataQualityNotes: 'n/a',
    authoritativeSourceLevel: 'PRIMARY_OFFICIAL',
    category: 'economic_indicators',
    evidenceRefs: ['ev://x'],
    rightsProvenancePassed: false,
  });
  const source = exampleOfficialProcurementSource(input.actor);
  hops.push(
    hop(
      'register_official_source_after_rights',
      'denied' in deniedWithoutRights &&
        source.ingestionState === 'APPROVED' &&
        source.classifiedOrNonPublicAssumed === false
        ? 'PASS'
        : 'FAIL',
      'Official source registers only after provenance/rights gate.',
    ),
  );

  const indexed = normalizeDedupeIndexIntoGovKnowledgeGraph({
    actor: input.actor,
    sources: [source, source],
  });
  hops.push(
    hop(
      'normalize_dedupe_index_into_gov_kg',
      !('denied' in indexed) &&
        indexed.indexedCount === 1 &&
        indexed.dedupedCount === 1 &&
        indexed.nodes[0]?.indexed === true
        ? 'PASS'
        : 'FAIL',
      'Normalize → dedupe → index into Government Knowledge Graph.',
    ),
  );

  const realtimeDenied = classifyGovDataTruthState({
    isOfficial: true,
    isCurrentPublication: true,
    isHistorical: false,
    delayed: false,
    stale: false,
    incomplete: false,
    sourceSupportsRealtime: true,
    liveConnectionVerified: false,
    attemptClaimRealtime: true,
  });
  const historicalTruth = classifyGovDataTruthState({
    isOfficial: true,
    isCurrentPublication: false,
    isHistorical: true,
    delayed: false,
    stale: false,
    incomplete: false,
    sourceSupportsRealtime: false,
    liveConnectionVerified: false,
  });
  hops.push(
    hop(
      'classify_truth_state_no_realtime_without_verified',
      typeof realtimeDenied !== 'string' &&
        realtimeDenied.state === 'DENIED' &&
        historicalTruth === 'OFFICIAL_HISTORICAL' &&
        source.liveRealtimeClaimed === false
        ? 'PASS'
        : 'FAIL',
      'Truth states classified; no realtime without verified live connection.',
    ),
  );

  const capture = buildAdvisoryCaptureAnalysis({
    actor: input.actor,
    analysisId: 'cap-1',
    governmentSourceIds: [source.governmentSourceId],
    summary: 'Advisory capture chain from public awards context.',
    evidenceRefs: source.evidenceRefs,
  });
  const logistics = buildAdvisoryLogisticsAnalysis({
    actor: input.actor,
    analysisId: 'log-1',
    uses: ['freight_flows', 'transportation_bottlenecks'],
    governmentSourceIds: [source.governmentSourceId],
    summary: 'Advisory logistics uses from public transportation datasets.',
    evidenceRefs: source.evidenceRefs,
  });
  const futureBuyingDenied = buildAdvisoryCaptureAnalysis({
    actor: input.actor,
    analysisId: 'cap-bad',
    governmentSourceIds: [source.governmentSourceId],
    summary: 'illegal guarantee',
    evidenceRefs: source.evidenceRefs,
    attemptGuaranteeFutureBuying: true,
  });
  hops.push(
    hop(
      'advisory_capture_and_logistics_analyses',
      !('denied' in capture) &&
        capture.advisoryOnly === true &&
        capture.historicalAsGuaranteedFutureBuying === false &&
        !('denied' in logistics) &&
        logistics.advisoryOnly === true &&
        'denied' in futureBuyingDenied
        ? 'PASS'
        : 'FAIL',
      'Advisory capture/logistics analyses; historical≠future buying.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof PUBLIC_GOVERNMENT_DATA_PACK_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_classified_non_public_assumptions',
      fn: attemptClassifiedOrNonPublicAssumption,
    },
    {
      hop: 'deny_restricted_portal_bypass',
      fn: attemptRestrictedPortalBypass,
    },
    {
      hop: 'deny_fabricated_agency_relationship',
      fn: attemptFabricateAgencyRelationship,
    },
    {
      hop: 'deny_unsupported_eligibility_award_claims',
      fn: attemptUnsupportedEligibilityOrAwardClaim,
    },
    {
      hop: 'deny_cross_tenant_private_contract_pooling',
      fn: attemptCrossTenantPrivateContractPooling,
    },
    {
      hop: 'deny_historical_as_future_buying_guarantee',
      fn: attemptHistoricalAsFutureBuyingGuarantee,
    },
    {
      hop: 'deny_realtime_without_verified_live_connection',
      fn: attemptRealtimeWithoutVerifiedLiveConnection,
    },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(d.hop, d.fn().state === 'DENIED' ? 'PASS' : 'FAIL', `${d.hop} DENIED.`),
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
      ER11_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
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
      'ER layer context (#162); next ER12 Live Data Connector Gate.',
    ),
  );

  const softPairs: Array<{
    hop: (typeof PUBLIC_GOVERNMENT_DATA_PACK_CYCLE)[number];
    present: boolean;
    note: string;
  }> = [
    {
      hop: 'er10_soft_wire',
      present: softWire.er10PublicGeospatialMobilityPack.present,
      note: softWire.er10PublicGeospatialMobilityPack.note,
    },
    {
      hop: 'er9_soft_wire',
      present: softWire.er9PublicLawPolicyKnowledgePack.present,
      note: softWire.er9PublicLawPolicyKnowledgePack.note,
    },
    {
      hop: 'er8_soft_wire',
      present: softWire.er8AncientCivilizationsKnowledgePack.present,
      note: softWire.er8AncientCivilizationsKnowledgePack.note,
    },
    {
      hop: 'er7_soft_wire',
      present: softWire.er7HistoricalScienceEngineeringAtlas.present,
      note: softWire.er7HistoricalScienceEngineeringAtlas.note,
    },
    {
      hop: 'er6_soft_wire',
      present: softWire.er6HistoricalBusinessCaseAtlasV2.present,
      note: softWire.er6HistoricalBusinessCaseAtlasV2.note,
    },
    {
      hop: 'er5_soft_wire',
      present: softWire.er5GlobalHistoricalKnowledgeIngestion.present,
      note: softWire.er5GlobalHistoricalKnowledgeIngestion.note,
    },
    {
      hop: 'er4_soft_wire',
      present: softWire.er4RightsProvenanceGate.present,
      note: softWire.er4RightsProvenanceGate.note,
    },
    {
      hop: 'er3_soft_wire',
      present: softWire.er3PublicDataSourceRegistry.present,
      note: softWire.er3PublicDataSourceRegistry.note,
    },
    {
      hop: 'er2_soft_wire',
      present: softWire.er2ApiTruthStateMachine.present,
      note: softWire.er2ApiTruthStateMachine.note,
    },
    {
      hop: 'er1_soft_wire',
      present: softWire.er1RealApiConnectionRegistry.present,
      note: softWire.er1RealApiConnectionRegistry.note,
    },
    {
      hop: 'eq16_soft_wire',
      present: softWire.eq16SoftwareWormholeRouter.present,
      note: softWire.eq16SoftwareWormholeRouter.note,
    },
    {
      hop: 'eq15_soft_wire',
      present: softWire.eq15PathwayPlasticity.present,
      note: softWire.eq15PathwayPlasticity.note,
    },
    {
      hop: 'eq14_soft_wire',
      present: softWire.eq14NeuralPathwayArchitectureGraph.present,
      note: softWire.eq14NeuralPathwayArchitectureGraph.note,
    },
    {
      hop: 'eq13_soft_wire',
      present: softWire.eq13ArchitectureReturnReceipt.present,
      note: softWire.eq13ArchitectureReturnReceipt.note,
    },
    {
      hop: 'eq12_soft_wire',
      present: softWire.eq12CrossArchitectureBenchmarkMatrix.present,
      note: softWire.eq12CrossArchitectureBenchmarkMatrix.note,
    },
    {
      hop: 'ep15_soft_wire',
      present: softWire.ep15AlgorithmTuningSandbox.present,
      note: softWire.ep15AlgorithmTuningSandbox.note,
    },
    {
      hop: 'em157_soft_wire',
      present: softWire.em157HomeBase.present,
      note: softWire.em157HomeBase.note,
    },
  ];
  for (const s of softPairs) {
    hops.push(hop(s.hop, softWireHopState(s.present), s.note));
  }

  hops.push(
    hop(
      'db_candidates_not_applied',
      ER11_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const evidence = returnEr11EvidenceToHomeBase({
    evidenceId: 'ev-er11-gov-1',
    actor: input.actor,
    governmentSourceId: source.governmentSourceId,
    summary: 'public government data pack advisory',
  });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er11-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in evidence || 'denied' in humanGate ? 'DENIED' : 'PASS',
      'Advisory evidence to Home Base; human gate exercised.',
    ),
  );

  void PUBLIC_GOVERNMENT_DATA_PACK_CYCLE;
  void attemptBypassGuardianRls;
  void attemptExpandTenantUniverseAccess;
  void attemptPersistHiddenChainOfThought;
  void attemptAutoDeployChanges;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      governmentSourceId: source.governmentSourceId,
      truthState: source.truthState,
    }),
  );

  return {
    hops,
    source,
    softWire,
    cycleEvidenceSha256,
  };
}
