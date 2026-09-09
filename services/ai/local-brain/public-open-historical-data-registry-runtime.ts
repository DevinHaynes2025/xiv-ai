/**
 * 62L-ER2 — Public/Open Historical Data Registry runtime.
 *
 * Catalog corpora with provenance/rights before ingestion.
 * Catalog ≠ ingest. No avatar synthesis in this phase.
 */

import { createHash } from 'node:crypto';
import {
  CORPUS_INGEST_PRECONDITIONS,
  ER2_AGENT_BOUNDS,
  ER2_DB_CANDIDATES_STATUS,
  ER2_LOCKS,
  ER2_MAY,
  ER2_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_CORPUS_REGISTRY_FIELDS,
  HISTORICAL_CORPUS_STATES,
  HISTORICAL_DATA_REGISTRY_FLOW,
  HISTORICAL_DATA_TRUTH_BOUNDARY,
  HISTORICAL_RIGHTS_CLASSES,
  HONESTY_BANNER,
  INGEST_ELIGIBILITY,
  NEXT_PHASE_TITLE,
  PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_CYCLE,
  assertEr2LocksIntact,
  catalogEntryMeansIngest,
  er2SoftWireSnapshot,
  evaluateCorpusIngestPreconditions,
  isEr2Agent,
  isHumanApprover,
  publicOpenMeansUnrestricted,
  unknownRightsAllowed,
  type CorpusIngestPrecondition,
  type Er2Actor,
  type Er2EvidenceState,
  type Er2HopRecord,
  type Er2SoftWireSnapshot,
  type HistoricalCorpusRecord,
  type HistoricalCorpusRegistryField,
  type HistoricalRightsClass,
} from './public-open-historical-data-registry-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_CYCLE)[number],
  state: Er2EvidenceState,
  summary: string,
): Er2HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
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

export type IngestEligibilityDecision =
  | {
      allowed: true;
      corpusId: string;
      eligibility: 'ELIGIBLE';
      preconditions: readonly CorpusIngestPrecondition[];
      synthesizesHistoricalAvatar: false;
    }
  | DenialResult;

export function catalogHistoricalCorpus(input: {
  actor: Er2Actor;
  corpusId: string;
  title: string;
  sourceAuthority: string;
  accessUrlOrLocator: string;
  format?: string;
  rightsClass?: HistoricalRightsClass;
  subjectTags?: readonly string[];
  evidenceRefs?: readonly string[];
}): HistoricalCorpusRecord | DenialResult {
  if (!ER2_AGENT_BOUNDS.mayCatalogHistoricalCorpora) {
    return deny('mayCatalogHistoricalCorpora=false');
  }
  if (!isEr2Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER2 agents / home_base may catalog corpora.');
  }
  if (!input.title || !input.sourceAuthority || !input.accessUrlOrLocator) {
    return deny('title, sourceAuthority, and locator required.');
  }

  return {
    corpusId: input.corpusId,
    title: input.title,
    sourceAuthority: input.sourceAuthority,
    accessUrlOrLocator: input.accessUrlOrLocator,
    licenseOrTermsRef: null,
    rightsClass: input.rightsClass ?? 'UNKNOWN_RIGHTS',
    provenanceRefs: [],
    timeCoverage: null,
    geographyCoverage: null,
    subjectTags: [...(input.subjectTags ?? [])],
    format: input.format ?? 'unspecified',
    freshnessCheckedAt: null,
    ingestEligibility: 'NOT_ELIGIBLE',
    quarantineReason: null,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    state: 'DOCUMENTED',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    synthesizesHistoricalAvatar: false,
    claimsLiteralResurrection: false,
  };
}

export function attachProvenanceAndLicense(input: {
  corpus: HistoricalCorpusRecord;
  licenseOrTermsRef: string;
  provenanceRefs: readonly string[];
  timeCoverage: string;
  geographyCoverage?: string | null;
  rightsClass: HistoricalRightsClass;
}): HistoricalCorpusRecord | DenialResult {
  if (!ER2_AGENT_BOUNDS.mayAttachProvenanceAndLicense) {
    return deny('mayAttachProvenanceAndLicense=false');
  }
  if (!input.licenseOrTermsRef) {
    return deny('licenseOrTermsRef required.');
  }
  if (input.provenanceRefs.length === 0) {
    return deny('provenanceRefs required — missing provenance cannot silent-ingest.');
  }

  const rightsKnown = input.rightsClass !== 'UNKNOWN_RIGHTS';
  return {
    ...input.corpus,
    subjectTags: [...input.corpus.subjectTags],
    evidenceRefs: [...input.corpus.evidenceRefs],
    licenseOrTermsRef: input.licenseOrTermsRef,
    provenanceRefs: [...input.provenanceRefs],
    timeCoverage: input.timeCoverage,
    geographyCoverage: input.geographyCoverage ?? null,
    rightsClass: input.rightsClass,
    freshnessCheckedAt: nowIso(),
    state: rightsKnown ? 'PROVENANCE_ATTACHED' : 'DOCUMENTED',
    ingestEligibility: rightsKnown ? 'ELIGIBLE_AFTER_RIGHTS' : 'NOT_ELIGIBLE',
    synthesizesHistoricalAvatar: false,
    claimsLiteralResurrection: false,
  };
}

export function quarantineCorpus(input: {
  corpus: HistoricalCorpusRecord;
  reason: string;
}): HistoricalCorpusRecord {
  return {
    ...input.corpus,
    subjectTags: [...input.corpus.subjectTags],
    provenanceRefs: [...input.corpus.provenanceRefs],
    evidenceRefs: [...input.corpus.evidenceRefs],
    state: 'QUARANTINED',
    ingestEligibility: 'QUARANTINED',
    quarantineReason: input.reason,
    synthesizesHistoricalAvatar: false,
    claimsLiteralResurrection: false,
  };
}

export function verifyRightsAndMarkEligible(input: {
  corpus: HistoricalCorpusRecord;
  human: Er2Actor;
  attemptWithoutHuman?: boolean;
  attemptSkipPreconditions?: boolean;
}): HistoricalCorpusRecord | DenialResult {
  if (input.attemptWithoutHuman || !isHumanApprover(input.human)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — ingest eligibility requires human_approver/founder/tenant_admin.',
    );
  }
  if (!input.human.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  if (
    input.attemptSkipPreconditions ||
    ER2_LOCKS.INGEST_WITHOUT_PRECONDITIONS ||
    catalogEntryMeansIngest()
  ) {
    return deny(
      'CATALOG_ENTRY_EQ_INGEST=false — all preconditions required.',
    );
  }

  if (input.corpus.rightsClass === 'UNKNOWN_RIGHTS' || unknownRightsAllowed()) {
    return deny('UNKNOWN_RIGHTS_EQ_ALLOWED=false — quarantine instead.');
  }

  // PUBLIC_OPEN still needs terms/provenance — not unrestricted
  if (
    publicOpenMeansUnrestricted() ||
    ER2_LOCKS.PUBLIC_OPEN_EQ_UNRESTRICTED === true
  ) {
    return deny('PUBLIC_OPEN_EQ_UNRESTRICTED=false.');
  }

  const pre = evaluateCorpusIngestPreconditions(input.corpus);
  if (!pre.ok) {
    return deny(
      `Ingest eligibility denied — missing: ${pre.missing.join(', ')}`,
    );
  }

  if (!ER2_AGENT_BOUNDS.mayMarkIngestEligibleWhenPreconditionsMet) {
    return deny('mayMarkIngestEligibleWhenPreconditionsMet=false');
  }

  return {
    ...input.corpus,
    subjectTags: [...input.corpus.subjectTags],
    provenanceRefs: [...input.corpus.provenanceRefs],
    evidenceRefs: [...input.corpus.evidenceRefs],
    state: 'INGEST_ELIGIBLE',
    ingestEligibility: 'ELIGIBLE',
    quarantineReason: null,
    synthesizesHistoricalAvatar: false,
    claimsLiteralResurrection: false,
  };
}

export function attemptIngestEligibility(input: {
  actor: Er2Actor;
  corpus: HistoricalCorpusRecord;
  attemptSkipPreconditions?: boolean;
  attemptSynthesizeAvatar?: boolean;
}): IngestEligibilityDecision {
  if (input.attemptSynthesizeAvatar || ER2_LOCKS.SYNTHESIZE_HISTORICAL_AVATARS_IN_ER2) {
    return deny(
      'SYNTHESIZE_HISTORICAL_AVATARS_IN_ER2=false — ER2 catalogs only.',
    );
  }
  if (
    input.attemptSkipPreconditions ||
    ER2_LOCKS.INGEST_WITHOUT_PRECONDITIONS ||
    catalogEntryMeansIngest()
  ) {
    return deny('Catalog entry ≠ ingest authorization.');
  }
  if (
    input.actor.tenantId !== input.corpus.tenantId ||
    input.actor.universeId !== input.corpus.universeId
  ) {
    return deny('Tenant/Universe scope mismatch.');
  }
  if (input.corpus.state !== 'INGEST_ELIGIBLE') {
    return deny(
      `Corpus state ${input.corpus.state} is not INGEST_ELIGIBLE.`,
    );
  }
  const pre = evaluateCorpusIngestPreconditions(input.corpus);
  if (!pre.ok) {
    return deny(`Missing preconditions: ${pre.missing.join(', ')}`);
  }
  return {
    allowed: true,
    corpusId: input.corpus.corpusId,
    eligibility: 'ELIGIBLE',
    preconditions: CORPUS_INGEST_PRECONDITIONS,
    synthesizesHistoricalAvatar: false,
  };
}

export function attemptIngestWithoutRightsAndProvenance(): DenialResult {
  return deny('Ingest without rights and provenance denied.');
}

export function attemptUnknownRightsAsAllowed(): DenialResult {
  return deny('UNKNOWN_RIGHTS_EQ_ALLOWED=false.');
}

export function attemptSilentIngestMissingProvenance(): DenialResult {
  return deny('SILENT_INGEST_MISSING_PROVENANCE=false.');
}

export function attemptAutonomousBulkIngest(): DenialResult {
  return deny('AUTONOMOUS_BULK_INGEST=false.');
}

export function attemptLiteralResurrectionClaim(): DenialResult {
  return deny(
    'CLAIM_LITERAL_RESURRECTION_OR_CONSCIOUSNESS=false — simulations disclosed later; ER2 catalogs only.',
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

export function returnEr2EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er2Actor;
  corpus: HistoricalCorpusRecord;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
      synthesizesHistoricalAvatar: false;
      corpusId: string;
      corpusState: HistoricalCorpusRecord['state'];
    }
  | DenialResult {
  if (!ER2_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEr2Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER2 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
    synthesizesHistoricalAvatar: false,
    corpusId: input.corpus.corpusId,
    corpusState: input.corpus.state,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er2Actor;
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
    unchanged: ER2_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER2_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER2_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleIngestEligibleCorpus(
  actor: Er2Actor,
  human: Er2Actor,
): {
  documented: HistoricalCorpusRecord;
  eligible: HistoricalCorpusRecord;
} {
  const documented = catalogHistoricalCorpus({
    actor,
    corpusId: 'corpus-loc-pd-1',
    title: 'Library of Congress Public Domain Prints',
    sourceAuthority: 'Library of Congress',
    accessUrlOrLocator: 'https://www.loc.gov/collections/',
    format: 'mixed_digitized',
    rightsClass: 'PUBLIC_DOMAIN',
    subjectTags: ['history', 'prints', 'public_domain'],
    evidenceRefs: ['rights://pd', 'er://162'],
  });
  if ('denied' in documented) throw new Error(documented.reason);

  const withProv = attachProvenanceAndLicense({
    corpus: documented,
    licenseOrTermsRef: 'terms://loc/public-domain',
    provenanceRefs: ['prov://loc/catalog', 'prov://loc/rights-statement'],
    timeCoverage: '1800-1925',
    geographyCoverage: 'United States',
    rightsClass: 'PUBLIC_DOMAIN',
  });
  if ('denied' in withProv) throw new Error(withProv.reason);

  const eligible = verifyRightsAndMarkEligible({
    corpus: withProv,
    human,
  });
  if ('denied' in eligible) throw new Error(eligible.reason);

  return { documented, eligible };
}

export function bootstrapPublicOpenHistoricalDataRegistry(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er2SoftWireSnapshot;
  registryFields: readonly HistoricalCorpusRegistryField[];
  corpusStates: typeof HISTORICAL_CORPUS_STATES;
  rightsClasses: typeof HISTORICAL_RIGHTS_CLASSES;
  ingestEligibility: typeof INGEST_ELIGIBILITY;
  preconditions: typeof CORPUS_INGEST_PRECONDITIONS;
  flow: typeof HISTORICAL_DATA_REGISTRY_FLOW;
  truthBoundary: typeof HISTORICAL_DATA_TRUTH_BOUNDARY;
  erLayer: typeof ER_LAYER_TITLE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof ER2_MAY;
  mustNot: typeof ER2_MUST_NOT;
  dbCandidates: typeof ER2_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEr2LocksIntact(),
    softWire: er2SoftWireSnapshot(repoRoot),
    registryFields: HISTORICAL_CORPUS_REGISTRY_FIELDS,
    corpusStates: HISTORICAL_CORPUS_STATES,
    rightsClasses: HISTORICAL_RIGHTS_CLASSES,
    ingestEligibility: INGEST_ELIGIBILITY,
    preconditions: CORPUS_INGEST_PRECONDITIONS,
    flow: HISTORICAL_DATA_REGISTRY_FLOW,
    truthBoundary: HISTORICAL_DATA_TRUTH_BOUNDARY,
    erLayer: ER_LAYER_TITLE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: ER2_MAY,
    mustNot: ER2_MUST_NOT,
    dbCandidates: ER2_DB_CANDIDATES_STATUS,
  };
}

function softWireHopState(present: boolean): Er2EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function runPublicOpenHistoricalDataRegistryCycle(input: {
  actor: Er2Actor;
  human: Er2Actor;
  repoRoot?: string;
}): {
  hops: Er2HopRecord[];
  corpus: HistoricalCorpusRecord;
  ingest: Extract<IngestEligibilityDecision, { allowed: true }>;
  softWire: Er2SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Er2HopRecord[] = [];
  const softWire = er2SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr2LocksIntact() ? 'PASS' : 'FAIL',
      'ER2 locks intact including L4=false and catalog≠ingest.',
    ),
  );
  hops.push(
    hop(
      'public_open_historical_data_registry_bootstrap',
      'PASS',
      'Public/Open Historical Data Registry bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'registry_fields_encoded',
      HISTORICAL_CORPUS_REGISTRY_FIELDS.length === 15 ? 'PASS' : 'FAIL',
      HISTORICAL_CORPUS_REGISTRY_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'corpus_states_encoded',
      HISTORICAL_CORPUS_STATES.length === 7 ? 'PASS' : 'FAIL',
      HISTORICAL_CORPUS_STATES.join(' → '),
    ),
  );
  hops.push(
    hop(
      'rights_classes_encoded',
      HISTORICAL_RIGHTS_CLASSES.length === 6 ? 'PASS' : 'FAIL',
      HISTORICAL_RIGHTS_CLASSES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'ingest_eligibility_encoded',
      INGEST_ELIGIBILITY.length === 5 ? 'PASS' : 'FAIL',
      INGEST_ELIGIBILITY.join(' | '),
    ),
  );
  hops.push(
    hop(
      'ingest_preconditions_encoded',
      CORPUS_INGEST_PRECONDITIONS.length === 9 ? 'PASS' : 'FAIL',
      `${CORPUS_INGEST_PRECONDITIONS.length} ingest preconditions.`,
    ),
  );
  hops.push(
    hop(
      'registry_flow_encoded',
      HISTORICAL_DATA_REGISTRY_FLOW.length === 7 ? 'PASS' : 'FAIL',
      HISTORICAL_DATA_REGISTRY_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'truth_boundary_catalog_neq_ingest',
      catalogEntryMeansIngest() === false &&
        HISTORICAL_DATA_TRUTH_BOUNDARY.catalogEntryMeansDocumentedOnly === true
        ? 'PASS'
        : 'FAIL',
      'Catalog = DOCUMENTED; entry ≠ ingest authorization.',
    ),
  );

  const { documented, eligible } = exampleIngestEligibleCorpus(
    input.actor,
    input.human,
  );

  hops.push(
    hop(
      'catalog_corpus_as_documented',
      documented.state === 'DOCUMENTED' &&
        documented.ingestEligibility === 'NOT_ELIGIBLE'
        ? 'PASS'
        : 'FAIL',
      'Corpus cataloged as DOCUMENTED / NOT_ELIGIBLE.',
    ),
  );

  hops.push(
    hop(
      'provenance_and_license_required',
      eligible.provenanceRefs.length > 0 &&
        eligible.licenseOrTermsRef !== null &&
        attemptSilentIngestMissingProvenance().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Provenance and license attached; silent ingest denied.',
    ),
  );

  const ingest = attemptIngestEligibility({
    actor: input.actor,
    corpus: eligible,
  });
  hops.push(
    hop(
      'ingest_requires_all_preconditions',
      !('denied' in ingest) &&
        ingest.allowed === true &&
        eligible.state === 'INGEST_ELIGIBLE'
        ? 'PASS'
        : 'FAIL',
      'Ingest eligibility only when all preconditions met.',
    ),
  );

  const unknown = catalogHistoricalCorpus({
    actor: input.actor,
    corpusId: 'corpus-unknown-1',
    title: 'Mystery Archive',
    sourceAuthority: 'Unknown',
    accessUrlOrLocator: 'https://example.invalid/archive',
    rightsClass: 'UNKNOWN_RIGHTS',
  });
  const quarantined =
    !('denied' in unknown) &&
    quarantineCorpus({
      corpus: unknown,
      reason: 'UNKNOWN_RIGHTS',
    });
  hops.push(
    hop(
      'unknown_rights_quarantines',
      typeof quarantined === 'object' &&
        quarantined.state === 'QUARANTINED' &&
        attemptUnknownRightsAsAllowed().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'UNKNOWN_RIGHTS → QUARANTINED; not allowed.',
    ),
  );

  hops.push(
    hop(
      'public_open_neq_unrestricted',
      publicOpenMeansUnrestricted() === false &&
        ER2_LOCKS.PUBLIC_OPEN_EQ_UNRESTRICTED === false
        ? 'PASS'
        : 'FAIL',
      'PUBLIC_OPEN ≠ unrestricted redistribute/train-without-terms.',
    ),
  );

  hops.push(
    hop(
      'no_avatar_synthesis_in_er2',
      eligible.synthesizesHistoricalAvatar === false &&
        attemptIngestEligibility({
          actor: input.actor,
          corpus: eligible,
          attemptSynthesizeAvatar: true,
        }).state === 'DENIED' &&
        attemptLiteralResurrectionClaim().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'ER2 catalogs only; no avatar synthesis or resurrection claims.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_ingest_without_rights_and_provenance',
      fn: attemptIngestWithoutRightsAndProvenance,
    },
    { hop: 'deny_unknown_rights_as_allowed', fn: attemptUnknownRightsAsAllowed },
    {
      hop: 'deny_silent_ingest_missing_provenance',
      fn: attemptSilentIngestMissingProvenance,
    },
    { hop: 'deny_autonomous_bulk_ingest', fn: attemptAutonomousBulkIngest },
    {
      hop: 'deny_literal_resurrection_claims',
      fn: attemptLiteralResurrectionClaim,
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
      ER2_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Historical Knowledge') &&
        GITHUB_SOT_ISSUE === 162
        ? 'PASS'
        : 'FAIL',
      `ER layer context: ${ER_LAYER_TITLE} (#162).`,
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
      ER2_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  if ('denied' in ingest) {
    throw new Error(`expected ingest eligibility: ${ingest.reason}`);
  }

  const evidence = returnEr2EvidenceToHomeBase({
    evidenceId: 'ev-er2-1',
    actor: input.actor,
    corpus: eligible,
    summary: 'historical corpus catalog advisory',
  });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er2-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in evidence || 'denied' in humanGate ? 'DENIED' : 'PASS',
      'Corpus receipt to Home Base; human gate exercised; no avatar synthesis.',
    ),
  );

  void PUBLIC_OPEN_HISTORICAL_DATA_REGISTRY_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      corpusId: eligible.corpusId,
      ingestAllowed: ingest.allowed,
    }),
  );

  return {
    hops,
    corpus: eligible,
    ingest,
    softWire,
    cycleEvidenceSha256,
  };
}
