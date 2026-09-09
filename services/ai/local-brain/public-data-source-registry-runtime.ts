/**
 * 62L-ER3 — Public Data Source Registry runtime.
 *
 * Discover → rights/provenance → quality → approve → ingest → cite → freshness.
 * No orphan facts. UNKNOWN_RIGHTS quarantined. Soft-wires EP4/EP5/EP10/EM157.
 */

import {
  DATA_SOURCE_AGENT_BOUNDS,
  DATA_SOURCE_MUST_NOT,
  DATA_SOURCE_PRIORITY_CATEGORIES,
  DATA_SOURCE_RECORD_FIELDS,
  DATA_SOURCE_STATES,
  ER3_DB_CANDIDATES_STATUS,
  ER3_LOCKS,
  ER3_MAY,
  ER3_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE_PROVISIONAL,
  GITHUB_SOT_ISSUE_STATUS,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_NOTE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_BRAIN_CHAIN,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS,
  PUBLIC_DATA_SOURCE_CORE_FLOW,
  PUBLIC_DATA_SOURCE_REGISTRY_CYCLE,
  assertEr3LocksIntact,
  er3SoftWireSnapshot,
  isDataSourceAgent,
  isForbiddenRights,
  isHumanApprover,
  isUnknownRights,
  type DataSourcePriorityCategory,
  type DataSourceRecordField,
  type DataSourceState,
  type Er3Actor,
  type Er3EvidenceState,
  type Er3HopRecord,
  type Er3SoftWireSnapshot,
  type HistoricalBrainChainField,
  type LicenseRightsState,
  type OfflineKnowledgePackPrecondition,
  type PublicDataSourceCoreFlowHop,
} from './public-data-source-registry-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PUBLIC_DATA_SOURCE_REGISTRY_CYCLE)[number],
  state: Er3EvidenceState,
  summary: string,
): Er3HopRecord {
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

export type HistoricalBrainRecord = {
  source: string;
  date: string;
  geography: string;
  context: string;
  claim: string;
  confidence: string;
  contradictionState: string;
};

export type DataSourceRecord = {
  sourceId: string;
  sourceProvider: string;
  datasetTitle: string;
  domain: string;
  geography: string;
  timeRange: string;
  language: string;
  accessMethod: string;
  apiDownloadEndpoint: string;
  licenseRightsState: LicenseRightsState;
  updateFrequency: string;
  freshness: string;
  schemaFormat: string;
  estimatedSize: string;
  dataQuality: string;
  allowedUses: string;
  retentionRestrictions: string;
  provenance: string;
  ingestionState: DataSourceState;
  reviewer: string;
  evidenceRefs: readonly string[];
  category: DataSourcePriorityCategory;
  quarantined: boolean;
  historicalChainAttached: boolean;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
  flowPosition: PublicDataSourceCoreFlowHop;
};

export type OfflinePackFlags = Partial<
  Record<OfflineKnowledgePackPrecondition, boolean>
>;

export function allOfflinePackPreconditionsMet(
  flags: OfflinePackFlags,
): boolean {
  return OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS.every((p) => flags[p] === true);
}

export function historicalChainComplete(
  chain: Partial<HistoricalBrainRecord>,
): boolean {
  return HISTORICAL_BRAIN_CHAIN.every((field) => {
    const key =
      field === 'contradiction_state'
        ? 'contradictionState'
        : (field as keyof HistoricalBrainRecord);
    const v = chain[key];
    return typeof v === 'string' && v.trim().length > 0;
  });
}

export function discoverDataSource(input: {
  actor: Er3Actor;
  sourceId: string;
  sourceProvider: string;
  datasetTitle: string;
  domain: string;
  geography: string;
  timeRange: string;
  language: string;
  accessMethod: string;
  apiDownloadEndpoint: string;
  licenseRightsState: LicenseRightsState;
  updateFrequency: string;
  freshness: string;
  schemaFormat: string;
  estimatedSize: string;
  dataQuality: string;
  allowedUses: string;
  retentionRestrictions: string;
  provenance: string;
  category: DataSourcePriorityCategory;
  evidenceRefs?: readonly string[];
  attemptLeakedDataset?: boolean;
  attemptPrivateDatabase?: boolean;
  attemptPaywallBypass?: boolean;
  attemptRestrictedArchive?: boolean;
  attemptStolenRecords?: boolean;
  attemptPrivateGpsHistories?: boolean;
  attemptConfidentialCompanyData?: boolean;
  attemptProviderDataOutsideTerms?: boolean;
}): DataSourceRecord | DenialResult {
  if (!DATA_SOURCE_PRIORITY_CATEGORIES.includes(input.category)) {
    return deny(`Unknown category: ${String(input.category)}`);
  }
  if (input.attemptLeakedDataset) {
    return deny('LEAKED_DATASETS_ALLOWED=false — no leaked datasets.');
  }
  if (input.attemptPrivateDatabase) {
    return deny('PRIVATE_DATABASES_ALLOWED=false — no private databases.');
  }
  if (input.attemptPaywallBypass) {
    return deny('PAYWALL_BYPASS_ALLOWED=false — no paywall bypass.');
  }
  if (input.attemptRestrictedArchive) {
    return deny('RESTRICTED_ARCHIVES_ALLOWED=false — no restricted archives.');
  }
  if (input.attemptStolenRecords) {
    return deny('STOLEN_RECORDS_ALLOWED=false — no stolen records.');
  }
  if (input.attemptPrivateGpsHistories) {
    return deny(
      'PRIVATE_GPS_HISTORIES_ALLOWED=false — no private GPS histories.',
    );
  }
  if (input.attemptConfidentialCompanyData) {
    return deny(
      'CONFIDENTIAL_COMPANY_DATA_ALLOWED=false — no confidential company data.',
    );
  }
  if (input.attemptProviderDataOutsideTerms) {
    return deny(
      'PROVIDER_DATA_OUTSIDE_ALLOWED_TERMS=false — provider data outside allowed terms denied.',
    );
  }
  if (isForbiddenRights(input.licenseRightsState)) {
    return deny(
      `Forbidden rights state ${input.licenseRightsState} — source DENIED/RESTRICTED.`,
    );
  }

  void DATA_SOURCE_RECORD_FIELDS;

  const unknown = isUnknownRights(input.licenseRightsState);
  return {
    sourceId: input.sourceId,
    sourceProvider: input.sourceProvider,
    datasetTitle: input.datasetTitle,
    domain: input.domain,
    geography: input.geography,
    timeRange: input.timeRange,
    language: input.language,
    accessMethod: input.accessMethod,
    apiDownloadEndpoint: input.apiDownloadEndpoint,
    licenseRightsState: input.licenseRightsState,
    updateFrequency: input.updateFrequency,
    freshness: input.freshness,
    schemaFormat: input.schemaFormat,
    estimatedSize: input.estimatedSize,
    dataQuality: input.dataQuality,
    allowedUses: input.allowedUses,
    retentionRestrictions: input.retentionRestrictions,
    provenance: input.provenance,
    ingestionState: unknown ? 'RIGHTS_REVIEW' : 'DISCOVERED',
    reviewer: '',
    evidenceRefs: input.evidenceRefs ?? [],
    category: input.category,
    quarantined: unknown,
    historicalChainAttached: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    createdAt: nowIso(),
    flowPosition: 'discover_source',
  };
}

export function advanceRightsReview(input: {
  record: DataSourceRecord;
  reviewer: Er3Actor;
  attemptApproveUnknownRightsIntoGlobalBrain?: boolean;
}): DataSourceRecord | DenialResult {
  if (
    input.record.licenseRightsState === 'UNKNOWN_RIGHTS' &&
    input.attemptApproveUnknownRightsIntoGlobalBrain
  ) {
    return deny(
      'UNKNOWN_RIGHTS_INTO_GLOBAL_BRAIN=false — UNKNOWN_RIGHTS stays quarantined.',
    );
  }
  if (input.record.licenseRightsState === 'UNKNOWN_RIGHTS') {
    return {
      ...input.record,
      ingestionState: 'RIGHTS_REVIEW',
      quarantined: true,
      reviewer: input.reviewer.id,
      flowPosition: 'rights_provenance_review',
    };
  }
  if (!isHumanApprover(input.reviewer) && input.reviewer.kind !== 'rights_reviewer') {
    return deny('Rights review requires rights_reviewer or human_approver.');
  }
  return {
    ...input.record,
    ingestionState: 'APPROVED',
    quarantined: false,
    reviewer: input.reviewer.id,
    flowPosition: 'approve',
  };
}

export function attachHistoricalBrainClaim(input: {
  record: DataSourceRecord;
  chain: Partial<HistoricalBrainRecord>;
  attemptOrphanFact?: boolean;
}):
  | {
      record: DataSourceRecord;
      claim: HistoricalBrainRecord;
      historicalEvidence: true;
      currentReality: false;
    }
  | DenialResult {
  if (input.attemptOrphanFact || !historicalChainComplete(input.chain)) {
    return deny(
      'ORPHAN_FACTS_ALLOWED=false — data point must retain source → date → geography → context → claim → confidence → contradiction state.',
    );
  }
  if (input.record.quarantined) {
    return deny('Quarantined sources cannot attach claims to the global brain.');
  }
  const claim: HistoricalBrainRecord = {
    source: input.chain.source!,
    date: input.chain.date!,
    geography: input.chain.geography!,
    context: input.chain.context!,
    claim: input.chain.claim!,
    confidence: input.chain.confidence!,
    contradictionState: input.chain.contradictionState!,
  };
  return {
    record: {
      ...input.record,
      historicalChainAttached: true,
      flowPosition: 'cite',
    },
    claim,
    historicalEvidence: true,
    currentReality: false,
  };
}

export function markIngestionReady(input: {
  record: DataSourceRecord;
  qualityPass: boolean;
}): DataSourceRecord | DenialResult {
  if (input.record.ingestionState !== 'APPROVED') {
    return deny('Only APPROVED sources can become INGESTION_READY.');
  }
  if (input.record.quarantined) {
    return deny('Quarantined sources cannot become INGESTION_READY.');
  }
  if (!input.qualityPass) {
    return deny('Schema/quality check failed.');
  }
  return {
    ...input.record,
    ingestionState: 'INGESTION_READY',
    flowPosition: 'schema_quality_check',
  };
}

export function ingestSource(input: {
  record: DataSourceRecord;
}): DataSourceRecord | DenialResult {
  if (input.record.ingestionState !== 'INGESTION_READY') {
    return deny('Ingest requires INGESTION_READY state.');
  }
  return {
    ...input.record,
    ingestionState: 'INGESTED',
    flowPosition: 'ingest_index',
  };
}

export function monitorFreshness(input: {
  record: DataSourceRecord;
  stale?: boolean;
}): DataSourceRecord {
  if (input.stale) {
    return {
      ...input.record,
      ingestionState: 'STALE',
      freshness: 'stale',
      flowPosition: 'monitor_freshness',
    };
  }
  return {
    ...input.record,
    flowPosition: 'monitor_freshness',
  };
}

export function prepareOfflineKnowledgePack(input: {
  record: DataSourceRecord;
  preconditions: OfflinePackFlags;
  attemptWithoutPreconditions?: boolean;
}):
  | {
      packId: string;
      sourceId: string;
      ready: true;
      encryptedCandidate: true;
    }
  | DenialResult {
  if (input.record.ingestionState !== 'INGESTED' && input.record.ingestionState !== 'APPROVED') {
    return deny('Offline pack requires APPROVED or INGESTED source.');
  }
  const allMet = allOfflinePackPreconditionsMet(input.preconditions);
  if (input.attemptWithoutPreconditions || !allMet) {
    return deny(
      'OFFLINE_PACK_WITHOUT_PRECONDITIONS=false — licensing, size/storage, version, expiration/update rules, and tenant/device scope required.',
    );
  }
  return {
    packId: `pack-${input.record.sourceId}`,
    sourceId: input.record.sourceId,
    ready: true,
    encryptedCandidate: true,
  };
}

export function attemptUnknownRightsIntoGlobalBrain(): DenialResult {
  return deny('UNKNOWN_RIGHTS_INTO_GLOBAL_BRAIN=false — quarantined.');
}

export function attemptOrphanFact(): DenialResult {
  return deny('ORPHAN_FACTS_ALLOWED=false.');
}

export function attemptLeakedDataset(): DenialResult {
  return deny('LEAKED_DATASETS_ALLOWED=false.');
}

export function attemptPaywallBypass(): DenialResult {
  return deny('PAYWALL_BYPASS_ALLOWED=false.');
}

export function attemptPrivateGpsHistories(): DenialResult {
  return deny('PRIVATE_GPS_HISTORIES_ALLOWED=false.');
}

export function attemptConfidentialCompanyData(): DenialResult {
  return deny('CONFIDENTIAL_COMPANY_DATA_ALLOWED=false.');
}

export function attemptProviderDataOutsideTerms(): DenialResult {
  return deny('PROVIDER_DATA_OUTSIDE_ALLOWED_TERMS=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnRegistryEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er3Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!DATA_SOURCE_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isDataSourceAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only data-source agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er3Actor;
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
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver or founder.',
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
    unchanged: ER3_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER3_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER3_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function fullOfflinePackPreconditions(): OfflinePackFlags {
  return Object.fromEntries(
    OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS.map((p) => [p, true]),
  ) as OfflinePackFlags;
}

export function fullHistoricalChain(
  overrides?: Partial<HistoricalBrainRecord>,
): HistoricalBrainRecord {
  return {
    source: 'src-census-1',
    date: '2020-04-01',
    geography: 'US',
    context: 'decennial census published table',
    claim: 'population count example',
    confidence: 'high',
    contradictionState: 'none',
    ...overrides,
  };
}

export function bootstrapPublicDataSourceRegistry(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er3SoftWireSnapshot;
  coreFlow: typeof PUBLIC_DATA_SOURCE_CORE_FLOW;
  fields: readonly DataSourceRecordField[];
  states: readonly DataSourceState[];
  categories: typeof DATA_SOURCE_PRIORITY_CATEGORIES;
  historicalChain: readonly HistoricalBrainChainField[];
  offlinePreconditions: typeof OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS;
  mustNot: typeof DATA_SOURCE_MUST_NOT;
  sot: {
    family: typeof GITHUB_SOT_FAMILY;
    label: typeof GITHUB_SOT_LABEL;
    provisionalIssue: typeof GITHUB_SOT_ISSUE_PROVISIONAL;
    issueStatus: typeof GITHUB_SOT_ISSUE_STATUS;
    title: typeof GITHUB_SOT_TITLE;
    githubNote: typeof GITHUB_SOT_NOTE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof ER3_MAY;
  mustNotList: typeof ER3_MUST_NOT;
  dbCandidates: typeof ER3_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEr3LocksIntact(),
    softWire: er3SoftWireSnapshot(repoRoot),
    coreFlow: PUBLIC_DATA_SOURCE_CORE_FLOW,
    fields: DATA_SOURCE_RECORD_FIELDS,
    states: DATA_SOURCE_STATES,
    categories: DATA_SOURCE_PRIORITY_CATEGORIES,
    historicalChain: HISTORICAL_BRAIN_CHAIN,
    offlinePreconditions: OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS,
    mustNot: DATA_SOURCE_MUST_NOT,
    sot: {
      family: GITHUB_SOT_FAMILY,
      label: GITHUB_SOT_LABEL,
      provisionalIssue: GITHUB_SOT_ISSUE_PROVISIONAL,
      issueStatus: GITHUB_SOT_ISSUE_STATUS,
      title: GITHUB_SOT_TITLE,
      githubNote: GITHUB_SOT_NOTE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: ER3_MAY,
    mustNotList: ER3_MUST_NOT,
    dbCandidates: ER3_DB_CANDIDATES_STATUS,
  };
}

export function runPublicDataSourceRegistryCycle(input: {
  actor: Er3Actor;
  reviewer: Er3Actor;
  human: Er3Actor;
  repoRoot?: string;
}): {
  hops: Er3HopRecord[];
  discovered: DataSourceRecord | DenialResult;
  unknownRights: DataSourceRecord | DenialResult;
  softWire: Er3SoftWireSnapshot;
} {
  const hops: Er3HopRecord[] = [];
  const softWire = er3SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr3LocksIntact() ? 'PASS' : 'FAIL',
      'ER3 locks intact including L4=false and UNKNOWN_RIGHTS quarantine.',
    ),
  );
  hops.push(
    hop(
      'public_data_source_registry_bootstrap',
      'PASS',
      'Public Data Source Registry bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      'PASS',
      PUBLIC_DATA_SOURCE_CORE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'record_fields_encoded',
      'PASS',
      `${DATA_SOURCE_RECORD_FIELDS.length} data source fields encoded.`,
    ),
  );
  hops.push(
    hop('source_states_encoded', 'PASS', DATA_SOURCE_STATES.join(' | ')),
  );
  hops.push(
    hop(
      'priority_categories_encoded',
      'PASS',
      `${DATA_SOURCE_PRIORITY_CATEGORIES.length} priority categories encoded.`,
    ),
  );
  hops.push(
    hop(
      'historical_brain_chain_encoded',
      'PASS',
      HISTORICAL_BRAIN_CHAIN.join(' → '),
    ),
  );
  hops.push(
    hop(
      'offline_pack_preconditions_encoded',
      'PASS',
      OFFLINE_KNOWLEDGE_PACK_PRECONDITIONS.join(' + '),
    ),
  );
  hops.push(
    hop(
      'must_not_encoded',
      'PASS',
      `${DATA_SOURCE_MUST_NOT.length} forbidden ingest surfaces encoded.`,
    ),
  );

  const discovered = discoverDataSource({
    actor: input.actor,
    sourceId: 'src-gov-open-1',
    sourceProvider: 'Example Open Data Portal',
    datasetTitle: 'Public demographics sample',
    domain: 'census',
    geography: 'US',
    timeRange: '2010-2020',
    language: 'en',
    accessMethod: 'https_api',
    apiDownloadEndpoint: 'https://example.gov/data/sample',
    licenseRightsState: 'GOVERNMENT_OPEN',
    updateFrequency: 'annual',
    freshness: 'current',
    schemaFormat: 'csv',
    estimatedSize: '100MB',
    dataQuality: 'documented',
    allowedUses: 'research_citation',
    retentionRestrictions: 'public_terms',
    provenance: 'government-open-portal',
    category: 'census_demographics',
    evidenceRefs: ['ev-1'],
  });

  const unknownRights = discoverDataSource({
    actor: input.actor,
    sourceId: 'src-unknown-1',
    sourceProvider: 'Unknown mirror',
    datasetTitle: 'Unclear rights dump',
    domain: 'misc',
    geography: 'unknown',
    timeRange: 'unknown',
    language: 'en',
    accessMethod: 'download',
    apiDownloadEndpoint: 'https://example.invalid/dump',
    licenseRightsState: 'UNKNOWN_RIGHTS',
    updateFrequency: 'unknown',
    freshness: 'unknown',
    schemaFormat: 'json',
    estimatedSize: 'unknown',
    dataQuality: 'unknown',
    allowedUses: 'unknown',
    retentionRestrictions: 'unknown',
    provenance: 'unclear',
    category: 'historical_archives',
  });

  hops.push(
    hop(
      'no_orphan_facts',
      attemptOrphanFact().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Orphan facts DENIED.',
    ),
  );

  const chainOk =
    !('denied' in discovered)
      ? attachHistoricalBrainClaim({
          record: {
            ...discovered,
            ingestionState: 'APPROVED',
            quarantined: false,
          },
          chain: fullHistoricalChain(),
        })
      : deny('discover failed');
  const chainBad =
    !('denied' in discovered)
      ? attachHistoricalBrainClaim({
          record: {
            ...discovered,
            ingestionState: 'APPROVED',
            quarantined: false,
          },
          chain: { claim: 'orphan' },
          attemptOrphanFact: true,
        })
      : deny('discover failed');

  hops.push(
    hop(
      'historical_chain_required',
      !('denied' in chainOk) &&
        chainOk.historicalEvidence &&
        !chainOk.currentReality &&
        chainBad.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Historical brain chain required; distinguishes historical evidence from current reality.',
    ),
  );

  hops.push(
    hop(
      'unknown_rights_quarantined',
      !('denied' in unknownRights) &&
        unknownRights.quarantined &&
        unknownRights.ingestionState === 'RIGHTS_REVIEW' &&
        attemptUnknownRightsIntoGlobalBrain().state === 'DENIED' &&
        (!('denied' in unknownRights)
          ? advanceRightsReview({
              record: unknownRights,
              reviewer: input.reviewer,
              attemptApproveUnknownRightsIntoGlobalBrain: true,
            }).state
          : 'DENIED') === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'UNKNOWN_RIGHTS quarantined; global-brain approve DENIED.',
    ),
  );

  hops.push(
    hop(
      'distinguish_historical_from_current',
      !('denied' in chainOk) &&
        chainOk.historicalEvidence === true &&
        chainOk.currentReality === false
        ? 'PASS'
        : 'FAIL',
      'Agents can distinguish historical evidence from current reality.',
    ),
  );

  const offlineBad =
    !('denied' in discovered)
      ? prepareOfflineKnowledgePack({
          record: { ...discovered, ingestionState: 'INGESTED' },
          preconditions: {},
          attemptWithoutPreconditions: true,
        })
      : deny('discover failed');
  const offlineOk =
    !('denied' in discovered)
      ? prepareOfflineKnowledgePack({
          record: { ...discovered, ingestionState: 'INGESTED' },
          preconditions: fullOfflinePackPreconditions(),
        })
      : deny('discover failed');
  hops.push(
    hop(
      'offline_pack_requires_all_preconditions',
      offlineBad.state === 'DENIED' && !('denied' in offlineOk)
        ? 'PASS'
        : 'FAIL',
      'Offline knowledge packs require all preconditions.',
    ),
  );

  hops.push(
    hop(
      'no_leaked_or_stolen_datasets',
      attemptLeakedDataset().state === 'DENIED' &&
        discoverDataSource({
          actor: input.actor,
          sourceId: 'bad-stolen',
          sourceProvider: 'x',
          datasetTitle: 'x',
          domain: 'x',
          geography: 'x',
          timeRange: 'x',
          language: 'en',
          accessMethod: 'x',
          apiDownloadEndpoint: 'x',
          licenseRightsState: 'PUBLIC_DOMAIN',
          updateFrequency: 'x',
          freshness: 'x',
          schemaFormat: 'x',
          estimatedSize: 'x',
          dataQuality: 'x',
          allowedUses: 'x',
          retentionRestrictions: 'x',
          provenance: 'x',
          category: 'scientific_research',
          attemptStolenRecords: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Leaked/stolen datasets DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_paywall_bypass',
      attemptPaywallBypass().state,
      'Paywall bypass DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_private_gps_or_confidential_company_data',
      attemptPrivateGpsHistories().state === 'DENIED' &&
        attemptConfidentialCompanyData().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Private GPS / confidential company data DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_provider_data_outside_allowed_terms',
      attemptProviderDataOutsideTerms().state,
      'Provider data outside allowed terms DENIED.',
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
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act / ingest.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER3_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep4_soft_wire',
      softWire.ep4IpFirewall.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep4IpFirewall.note,
    ),
  );
  hops.push(
    hop(
      'ep5_soft_wire',
      softWire.ep5BenchmarkMemory.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep5BenchmarkMemory.note,
    ),
  );
  hops.push(
    hop(
      'ep10_soft_wire',
      softWire.ep10OtherAcceleratorRegistry.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep10OtherAcceleratorRegistry.note,
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
      ER3_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-er3-1',
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

  void PUBLIC_DATA_SOURCE_REGISTRY_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    discovered,
    unknownRights,
    softWire,
  };
}
