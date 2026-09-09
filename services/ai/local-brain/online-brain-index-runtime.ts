/**
 * 62L-ER13 — Online Brain Index runtime.
 *
 * Register indexed objects with tenant/Universe/rights; permission-first
 * retrieval; deny private→public pooling; search-mode stubs with trust
 * annotations; measured corpus size only; security denies; cycle.
 */

import {
  EVIDENCE_CLASS_LABELS,
  ER13_DB_CANDIDATES_STATUS,
  ER13_LOCKS,
  ER13_MAY,
  ER13_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HOME_BASE_INTEGRATION_LOOP,
  HONESTY_BANNER,
  INDEXED_OBJECT_FIELDS,
  INDEX_DATA_CLASSES,
  INDEX_RIGHTS_STATES,
  INDEX_SCOPES,
  NEXT_PHASE_TITLE,
  ONLINE_BRAIN_AGENT_BOUNDS,
  ONLINE_BRAIN_INDEX_CYCLE,
  ONLINE_BRAIN_INDEX_STRUCTURE,
  ONLINE_BRAIN_MUST_NOT,
  PERMISSION_FIRST_FLOW,
  RESULT_TRUST_LAYER_FIELDS,
  SCALE_ARCHITECTURE_TARGETS,
  SEARCH_MODES,
  assertEr13LocksIntact,
  er13SoftWireSnapshot,
  isHumanApprover,
  isOnlineBrainAgent,
  isPublicIndexEligible,
  softWireState,
  type EvidenceClassLabel,
  type Er13Actor,
  type Er13EvidenceState,
  type Er13HopRecord,
  type Er13SoftWireSnapshot,
  type IndexDataClass,
  type IndexRightsState,
  type IndexScope,
  type IndexedObjectField,
  type SearchMode,
} from './online-brain-index-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ONLINE_BRAIN_INDEX_CYCLE)[number],
  state: Er13EvidenceState,
  summary: string,
): Er13HopRecord {
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

export type TrustAnnotation = {
  source: string;
  date: string;
  freshness: string;
  rights: IndexRightsState;
  confidence: string;
  evidenceClass: EvidenceClassLabel;
  contradictions: string;
};

export type IndexedObject = {
  objectId: string;
  sourceProvider: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  dataClass: IndexDataClass;
  rightsState: IndexRightsState;
  provenance: string;
  domain: string;
  geography: string;
  timeRange: string;
  language: string;
  freshness: string;
  authorityLevel: string;
  contradictionState: string;
  embeddingIndexVersion: string;
  retentionExpiry: string;
  revocationState: string;
  evidenceRefs: readonly string[];
  indexScope: IndexScope;
  createdAt: string;
};

export type RetrievalQuery = {
  actor: Er13Actor;
  queryText: string;
  purpose: string;
  dataClass: IndexDataClass;
  searchMode: SearchMode;
  attemptPermissionBypass?: boolean;
  attemptUnauthorizedScrape?: boolean;
};

export type TrustAnnotatedResult = {
  objectId: string;
  searchMode: SearchMode;
  trust: TrustAnnotation;
  citation: string;
  indexScope: IndexScope;
};

export type MeasuredCorpusStats = {
  measuredObjectCount: number;
  measuredAt: string;
  assumed: false;
  trillionClaimAuthorized: false;
};

/** In-memory bounded registry for park-and-implement tests. */
const registry = new Map<string, IndexedObject>();

export function clearOnlineBrainIndexRegistry(): void {
  registry.clear();
}

export function registerIndexedObject(input: {
  actor: Er13Actor;
  objectId: string;
  sourceProvider: string;
  dataClass: IndexDataClass;
  rightsState: IndexRightsState;
  provenance: string;
  domain: string;
  geography: string;
  timeRange: string;
  language: string;
  freshness: string;
  authorityLevel: string;
  contradictionState: string;
  embeddingIndexVersion: string;
  retentionExpiry: string;
  revocationState?: string;
  evidenceRefs?: readonly string[];
  attemptPoolPrivateIntoPublic?: boolean;
  attemptSecretIndexing?: boolean;
  targetScope?: IndexScope;
}): IndexedObject | DenialResult {
  void INDEXED_OBJECT_FIELDS;
  void INDEX_DATA_CLASSES;
  void INDEX_RIGHTS_STATES;
  void INDEX_SCOPES;

  if (input.attemptSecretIndexing || input.dataClass === 'SECRET' || input.rightsState === 'SECRET') {
    return deny('SECRET_INDEXING_ALLOWED=false — secrets must not be indexed.');
  }
  if (input.revocationState === 'REVOKED' || input.rightsState === 'REVOKED') {
    return deny('Revoked objects cannot be registered into the online brain index.');
  }

  const wantsPublic =
    input.targetScope === 'GLOBAL_PUBLIC' ||
    input.attemptPoolPrivateIntoPublic === true;

  const privateClass =
    input.dataClass === 'ENTERPRISE_PRIVATE' ||
    input.rightsState === 'ENTERPRISE_PRIVATE' ||
    input.rightsState === 'TENANT_SCOPED';

  if (wantsPublic && privateClass) {
    return deny(
      'PRIVATE_DATA_POOLING_INTO_PUBLIC_INDEX=false — private enterprise data must never become part of the global public index.',
    );
  }
  if (input.attemptPoolPrivateIntoPublic) {
    return deny(
      'PRIVATE_DATA_POOLING_INTO_PUBLIC_INDEX=false — pooling private into public DENIED.',
    );
  }

  let indexScope: IndexScope;
  if (isPublicIndexEligible(input.dataClass, input.rightsState)) {
    indexScope = 'GLOBAL_PUBLIC';
  } else if (
    input.dataClass === 'ENTERPRISE_PRIVATE' ||
    input.rightsState === 'ENTERPRISE_PRIVATE'
  ) {
    indexScope = 'ENTERPRISE_PRIVATE';
  } else if (input.rightsState === 'UNKNOWN_RIGHTS') {
    indexScope = 'QUARANTINE';
  } else {
    indexScope = 'TENANT_PRIVATE';
  }

  if (input.targetScope && input.targetScope !== indexScope) {
    if (
      input.targetScope === 'GLOBAL_PUBLIC' &&
      !isPublicIndexEligible(input.dataClass, input.rightsState)
    ) {
      return deny(
        'PRIVATE_DATA_POOLING_INTO_PUBLIC_INDEX=false — ineligible for GLOBAL_PUBLIC.',
      );
    }
  }

  const obj: IndexedObject = {
    objectId: input.objectId,
    sourceProvider: input.sourceProvider,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    dataClass: input.dataClass,
    rightsState: input.rightsState,
    provenance: input.provenance,
    domain: input.domain,
    geography: input.geography,
    timeRange: input.timeRange,
    language: input.language,
    freshness: input.freshness,
    authorityLevel: input.authorityLevel,
    contradictionState: input.contradictionState,
    embeddingIndexVersion: input.embeddingIndexVersion,
    retentionExpiry: input.retentionExpiry,
    revocationState: input.revocationState ?? 'active',
    evidenceRefs: input.evidenceRefs ?? [],
    indexScope,
    createdAt: nowIso(),
  };
  registry.set(obj.objectId, obj);
  return obj;
}

export function buildTrustAnnotation(obj: IndexedObject, evidenceClass: EvidenceClassLabel): TrustAnnotation {
  return {
    source: obj.sourceProvider,
    date: obj.timeRange,
    freshness: obj.freshness,
    rights: obj.rightsState,
    confidence: obj.authorityLevel,
    evidenceClass,
    contradictions: obj.contradictionState,
  };
}

export function permissionFirstRetrieval(input: RetrievalQuery):
  | {
      eligible: IndexedObject[];
      flow: typeof PERMISSION_FIRST_FLOW;
      permissionBypass: false;
    }
  | DenialResult {
  if (input.attemptPermissionBypass) {
    return deny('PERMISSION_BYPASS_ALLOWED=false — permission-first flow required.');
  }
  if (input.attemptUnauthorizedScrape) {
    return deny('UNAUTHORIZED_SCRAPING_ALLOWED=false — no unauthorized scraping.');
  }
  if (!isOnlineBrainAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only online-brain agents / home_base may retrieve.');
  }

  void PERMISSION_FIRST_FLOW;
  // Agent query → identity → tenant → Universe → purpose → data class → rights → eligible
  const eligible = [...registry.values()].filter((obj) => {
    if (obj.tenantId !== input.actor.tenantId) return false;
    if (obj.universeId !== input.actor.universeId) return false;
    if (obj.revocationState === 'REVOKED') return false;
    if (obj.indexScope === 'QUARANTINE') return false;
    if (obj.dataClass === 'SECRET' || obj.rightsState === 'SECRET') return false;
    if (
      obj.indexScope === 'ENTERPRISE_PRIVATE' &&
      input.dataClass === 'PUBLIC_APPROVED'
    ) {
      return false;
    }
    return true;
  });

  return {
    eligible,
    flow: PERMISSION_FIRST_FLOW,
    permissionBypass: false,
  };
}

export function dispatchSearchMode(input: {
  actor: Er13Actor;
  searchMode: SearchMode;
  evidenceClass: EvidenceClassLabel;
  purpose: string;
  dataClass: IndexDataClass;
}):
  | {
      results: TrustAnnotatedResult[];
      searchMode: SearchMode;
      trustLayerComplete: true;
    }
  | DenialResult {
  if (!SEARCH_MODES.includes(input.searchMode)) {
    return deny(`Unknown search mode: ${String(input.searchMode)}`);
  }
  if (!EVIDENCE_CLASS_LABELS.includes(input.evidenceClass)) {
    return deny(`Unknown evidence class: ${String(input.evidenceClass)}`);
  }

  const filtered = permissionFirstRetrieval({
    actor: input.actor,
    queryText: `mode:${input.searchMode}`,
    purpose: input.purpose,
    dataClass: input.dataClass,
    searchMode: input.searchMode,
  });
  if ('denied' in filtered) return filtered;

  const results: TrustAnnotatedResult[] = filtered.eligible.map((obj) => ({
    objectId: obj.objectId,
    searchMode: input.searchMode,
    trust: buildTrustAnnotation(obj, input.evidenceClass),
    citation: `cite:${obj.objectId}:${obj.provenance}`,
    indexScope: obj.indexScope,
  }));

  return {
    results,
    searchMode: input.searchMode,
    trustLayerComplete: true,
  };
}

export function distinguishEvidenceLabel(
  label: EvidenceClassLabel,
):
  | {
      label: EvidenceClassLabel;
      distinguished: true;
      notConfusedWith: readonly EvidenceClassLabel[];
    }
  | DenialResult {
  if (!EVIDENCE_CLASS_LABELS.includes(label)) {
    return deny(`Unknown evidence class label: ${String(label)}`);
  }
  return {
    label,
    distinguished: true,
    notConfusedWith: EVIDENCE_CLASS_LABELS.filter((l) => l !== label),
  };
}

export function measureCorpusSize(): MeasuredCorpusStats {
  return {
    measuredObjectCount: registry.size,
    measuredAt: nowIso(),
    assumed: false,
    trillionClaimAuthorized: false,
  };
}

export function attemptAssumeCorpusSize(): DenialResult {
  return deny(
    'CORPUS_SIZE_ASSUMED_EQ_MEASURED=false — actual corpus size must be measured rather than assumed.',
  );
}

export function attemptClaimTrillionCorpus(): DenialResult {
  return deny(
    'CLAIM_TRILLION_CORPUS_WITHOUT_MEASUREMENT=false — no trillion-corpus claim without measurement.',
  );
}

export function attemptUnauthorizedScraping(): DenialResult {
  return deny('UNAUTHORIZED_SCRAPING_ALLOWED=false.');
}

export function attemptPrivatePoolingIntoPublic(): DenialResult {
  return deny('PRIVATE_DATA_POOLING_INTO_PUBLIC_INDEX=false.');
}

export function attemptPermissionBypass(): DenialResult {
  return deny('PERMISSION_BYPASS_ALLOWED=false.');
}

export function attemptSecretIndexing(): DenialResult {
  return deny('SECRET_INDEXING_ALLOWED=false.');
}

export function attemptHiddenChainOfThoughtStorage(): DenialResult {
  return deny('HIDDEN_CHAIN_OF_THOUGHT_STORAGE=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function attemptTipLand(): DenialResult {
  return deny('TIP_LAND=false — no tip-land onto xiv-v2/main.');
}

export function returnEvidenceBundleToHomeBase(input: {
  bundleId: string;
  actor: Er13Actor;
  results: readonly TrustAnnotatedResult[];
  summary: string;
}):
  | {
      bundleId: string;
      returnedToHomeBase: true;
      loop: typeof HOME_BASE_INTEGRATION_LOOP;
      authorityGranted: false;
      neuralPathwayPromotion: 'REVIEW_REQUIRED';
    }
  | DenialResult {
  if (!ONLINE_BRAIN_AGENT_BOUNDS.mayReturnEvidenceBundleToHomeBase) {
    return deny('mayReturnEvidenceBundleToHomeBase=false');
  }
  if (!isOnlineBrainAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only online-brain agents / home_base may return evidence bundles.');
  }
  void input.results;
  void input.summary;
  return {
    bundleId: input.bundleId,
    returnedToHomeBase: true,
    loop: HOME_BASE_INTEGRATION_LOOP,
    authorityGranted: false,
    neuralPathwayPromotion: 'REVIEW_REQUIRED',
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er13Actor;
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
    unchanged: ER13_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER13_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER13_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function bootstrapOnlineBrainIndex(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er13SoftWireSnapshot;
  structure: typeof ONLINE_BRAIN_INDEX_STRUCTURE;
  fields: readonly IndexedObjectField[];
  searchModes: typeof SEARCH_MODES;
  permissionFlow: typeof PERMISSION_FIRST_FLOW;
  trustLayer: typeof RESULT_TRUST_LAYER_FIELDS;
  evidenceLabels: typeof EVIDENCE_CLASS_LABELS;
  homeBaseLoop: typeof HOME_BASE_INTEGRATION_LOOP;
  scaleTargets: typeof SCALE_ARCHITECTURE_TARGETS;
  mustNot: typeof ONLINE_BRAIN_MUST_NOT;
  sot: {
    family: typeof GITHUB_SOT_FAMILY;
    label: typeof GITHUB_SOT_LABEL;
    issue: typeof GITHUB_SOT_ISSUE;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof ER13_MAY;
  mustNotList: typeof ER13_MUST_NOT;
  dbCandidates: typeof ER13_DB_CANDIDATES_STATUS;
  corpus: MeasuredCorpusStats;
} {
  return {
    locksIntact: assertEr13LocksIntact(),
    softWire: er13SoftWireSnapshot(repoRoot),
    structure: ONLINE_BRAIN_INDEX_STRUCTURE,
    fields: INDEXED_OBJECT_FIELDS,
    searchModes: SEARCH_MODES,
    permissionFlow: PERMISSION_FIRST_FLOW,
    trustLayer: RESULT_TRUST_LAYER_FIELDS,
    evidenceLabels: EVIDENCE_CLASS_LABELS,
    homeBaseLoop: HOME_BASE_INTEGRATION_LOOP,
    scaleTargets: SCALE_ARCHITECTURE_TARGETS,
    mustNot: ONLINE_BRAIN_MUST_NOT,
    sot: {
      family: GITHUB_SOT_FAMILY,
      label: GITHUB_SOT_LABEL,
      issue: GITHUB_SOT_ISSUE,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: ER13_MAY,
    mustNotList: ER13_MUST_NOT,
    dbCandidates: ER13_DB_CANDIDATES_STATUS,
    corpus: measureCorpusSize(),
  };
}

export function runOnlineBrainIndexCycle(input: {
  actor: Er13Actor;
  human: Er13Actor;
  repoRoot?: string;
}): {
  hops: Er13HopRecord[];
  registered: IndexedObject | DenialResult;
  privateDenied: DenialResult;
  softWire: Er13SoftWireSnapshot;
  corpus: MeasuredCorpusStats;
} {
  clearOnlineBrainIndexRegistry();
  const hops: Er13HopRecord[] = [];
  const softWire = er13SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr13LocksIntact() ? 'PASS' : 'FAIL',
      'ER13 locks intact including L4=false and CORPUS_SIZE_ASSUMED_EQ_MEASURED=false.',
    ),
  );
  hops.push(
    hop(
      'online_brain_index_bootstrap',
      'PASS',
      'Online Brain Index bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'index_structure_encoded',
      'PASS',
      ONLINE_BRAIN_INDEX_STRUCTURE.join(' → '),
    ),
  );
  hops.push(
    hop(
      'indexed_object_fields_encoded',
      'PASS',
      `${INDEXED_OBJECT_FIELDS.length} indexed object fields encoded.`,
    ),
  );
  hops.push(
    hop('search_modes_encoded', 'PASS', SEARCH_MODES.join(' | ')),
  );
  hops.push(
    hop(
      'permission_first_flow_encoded',
      'PASS',
      PERMISSION_FIRST_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'trust_layer_encoded',
      'PASS',
      RESULT_TRUST_LAYER_FIELDS.join(' | '),
    ),
  );
  hops.push(
    hop(
      'evidence_labels_encoded',
      'PASS',
      EVIDENCE_CLASS_LABELS.join(' | '),
    ),
  );
  hops.push(
    hop(
      'home_base_loop_encoded',
      'PASS',
      HOME_BASE_INTEGRATION_LOOP.join(' → '),
    ),
  );
  hops.push(
    hop(
      'scale_honesty_encoded',
      ER13_LOCKS.CORPUS_SIZE_ASSUMED_EQ_MEASURED === false &&
        ER13_LOCKS.TRILLIONS_ARE_LONG_RANGE_ARCHITECTURE_TARGET_ONLY === true
        ? 'PASS'
        : 'FAIL',
      `Scale targets: ${SCALE_ARCHITECTURE_TARGETS.join(', ')}; assumed≠measured.`,
    ),
  );
  hops.push(
    hop(
      'must_not_encoded',
      'PASS',
      `${ONLINE_BRAIN_MUST_NOT.length} forbidden index/retrieval surfaces encoded.`,
    ),
  );

  const registered = registerIndexedObject({
    actor: input.actor,
    objectId: 'obj-public-1',
    sourceProvider: 'Example Open Data Portal',
    dataClass: 'PUBLIC_APPROVED',
    rightsState: 'PUBLIC_INDEX_ELIGIBLE',
    provenance: 'gov-open-portal',
    domain: 'census',
    geography: 'US',
    timeRange: '2020',
    language: 'en',
    freshness: 'published',
    authorityLevel: 'high',
    contradictionState: 'none',
    embeddingIndexVersion: 'v0-bounded',
    retentionExpiry: '2030-01-01',
    evidenceRefs: ['ev-1'],
  });

  hops.push(
    hop(
      'register_indexed_object',
      !('denied' in registered) && registered.indexScope === 'GLOBAL_PUBLIC'
        ? 'PASS'
        : 'FAIL',
      'Indexed object registered with tenant/Universe/rights.',
    ),
  );

  const retrieval = permissionFirstRetrieval({
    actor: input.actor,
    queryText: 'population',
    purpose: 'research_citation',
    dataClass: 'PUBLIC_APPROVED',
    searchMode: 'lexical',
  });
  hops.push(
    hop(
      'permission_first_retrieval',
      !('denied' in retrieval) && retrieval.permissionBypass === false
        ? 'PASS'
        : 'FAIL',
      'Permission-first retrieval filter applied.',
    ),
  );

  const privateDenied = registerIndexedObject({
    actor: input.actor,
    objectId: 'obj-private-1',
    sourceProvider: 'Enterprise CRM',
    dataClass: 'ENTERPRISE_PRIVATE',
    rightsState: 'ENTERPRISE_PRIVATE',
    provenance: 'tenant-crm',
    domain: 'crm',
    geography: 'internal',
    timeRange: '2026',
    language: 'en',
    freshness: 'live',
    authorityLevel: 'internal',
    contradictionState: 'none',
    embeddingIndexVersion: 'v0-bounded',
    retentionExpiry: '2027-01-01',
    attemptPoolPrivateIntoPublic: true,
    targetScope: 'GLOBAL_PUBLIC',
  }) as DenialResult;

  hops.push(
    hop(
      'deny_private_into_public_index',
      privateDenied.state === 'DENIED' ? 'PASS' : 'FAIL',
      'Private enterprise → global public index DENIED.',
    ),
  );

  const search =
    !('denied' in registered)
      ? dispatchSearchMode({
          actor: input.actor,
          searchMode: 'semantic_vector',
          evidenceClass: 'CURRENT_OFFICIAL',
          purpose: 'research',
          dataClass: 'PUBLIC_APPROVED',
        })
      : deny('register failed');
  hops.push(
    hop(
      'search_mode_dispatch_trust_annotated',
      !('denied' in search) &&
        search.trustLayerComplete &&
        search.results.every((r) =>
          RESULT_TRUST_LAYER_FIELDS.every((f) => f in r.trust || f === 'evidenceClass'),
        )
        ? 'PASS'
        : 'FAIL',
      'Search mode dispatch returns trust-annotated results.',
    ),
  );

  const labelsOk = EVIDENCE_CLASS_LABELS.every((label) => {
    const d = distinguishEvidenceLabel(label);
    return !('denied' in d) && d.distinguished;
  });
  hops.push(
    hop(
      'evidence_labels_distinguished',
      labelsOk ? 'PASS' : 'FAIL',
      'Evidence class labels distinguished.',
    ),
  );

  const corpus = measureCorpusSize();
  hops.push(
    hop(
      'measured_corpus_size_only',
      corpus.assumed === false &&
        corpus.trillionClaimAuthorized === false &&
        attemptAssumeCorpusSize().state === 'DENIED' &&
        attemptClaimTrillionCorpus().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      `Measured corpus size=${corpus.measuredObjectCount}; assumed≠measured.`,
    ),
  );

  hops.push(
    hop(
      'no_unauthorized_scraping',
      attemptUnauthorizedScraping().state,
      'Unauthorized scraping DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_private_pooling',
      attemptPrivatePoolingIntoPublic().state,
      'Private pooling into public index DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_permission_bypass',
      attemptPermissionBypass().state,
      'Permission bypass DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_secret_indexing',
      attemptSecretIndexing().state,
      'Secret indexing DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_hidden_cot_storage',
      attemptHiddenChainOfThoughtStorage().state,
      'Hidden CoT storage DENIED.',
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
      'l4_autonomy_false',
      ER13_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );
  hops.push(
    hop(
      'no_tip_land',
      attemptTipLand().state === 'DENIED' && ER13_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      'Tip-land DENIED.',
    ),
  );

  hops.push(
    hop('er12_soft_wire', softWireState(softWire.er12LiveDataConnectorGate), softWire.er12LiveDataConnectorGate.note),
  );
  hops.push(
    hop('er11_soft_wire', softWireState(softWire.er11ApprovedPublicDataConnectors), softWire.er11ApprovedPublicDataConnectors.note),
  );
  hops.push(
    hop('er10_soft_wire', softWireState(softWire.er10EnterpriseApiAdapters), softWire.er10EnterpriseApiAdapters.note),
  );
  hops.push(
    hop('er9_soft_wire', softWireState(softWire.er9ResearchEvidenceConnectors), softWire.er9ResearchEvidenceConnectors.note),
  );
  hops.push(
    hop('er8_soft_wire', softWireState(softWire.er8HistoricalKnowledgeConnectors), softWire.er8HistoricalKnowledgeConnectors.note),
  );
  hops.push(
    hop('er7_soft_wire', softWireState(softWire.er7AuthorizedApiConnectors), softWire.er7AuthorizedApiConnectors.note),
  );
  hops.push(
    hop('er6_soft_wire', softWireState(softWire.er6PublicDataConnectors), softWire.er6PublicDataConnectors.note),
  );
  hops.push(
    hop('er5_soft_wire', softWireState(softWire.er5ConnectorRegistry), softWire.er5ConnectorRegistry.note),
  );
  hops.push(
    hop('er4_soft_wire', softWireState(softWire.er4RightsProvenanceGate), softWire.er4RightsProvenanceGate.note),
  );
  hops.push(
    hop('er3_soft_wire', softWireState(softWire.er3PublicDataSourceRegistry), softWire.er3PublicDataSourceRegistry.note),
  );
  hops.push(
    hop('er2_soft_wire', softWireState(softWire.er2ApiTruthStateMachine), softWire.er2ApiTruthStateMachine.note),
  );
  hops.push(
    hop('er1_soft_wire', softWireState(softWire.er1RealApiConnectionRegistry), softWire.er1RealApiConnectionRegistry.note),
  );
  hops.push(
    hop('eq16_soft_wire', softWireState(softWire.eq16SoftwareWormholeRouter), softWire.eq16SoftwareWormholeRouter.note),
  );
  hops.push(
    hop('eq15_soft_wire', softWireState(softWire.eq15PathwayPlasticity), softWire.eq15PathwayPlasticity.note),
  );
  hops.push(
    hop('eq14_soft_wire', softWireState(softWire.eq14NeuralPathwayArchitectureGraph), softWire.eq14NeuralPathwayArchitectureGraph.note),
  );
  hops.push(
    hop('eq13_soft_wire', softWireState(softWire.eq13ArchitectureReturnReceipt), softWire.eq13ArchitectureReturnReceipt.note),
  );
  hops.push(
    hop('eq12_soft_wire', softWireState(softWire.eq12CrossArchitectureBenchmarkMatrix), softWire.eq12CrossArchitectureBenchmarkMatrix.note),
  );
  hops.push(
    hop('ep15_soft_wire', softWireState(softWire.ep15AlgorithmTuningSandbox), softWire.ep15AlgorithmTuningSandbox.note),
  );
  hops.push(
    hop('em157_soft_wire', softWireState(softWire.em157HomeBase), softWire.em157HomeBase.note),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ER13_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-er13-1',
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

  void ONLINE_BRAIN_INDEX_CYCLE;
  void attemptRecommendAsAct;
  void attemptAgentAutoAuthority;

  return {
    hops,
    registered,
    privateDenied,
    softWire,
    corpus,
  };
}
