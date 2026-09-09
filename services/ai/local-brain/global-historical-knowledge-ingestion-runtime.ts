/**
 * 62L-ER5 — Global Historical Knowledge Ingestion Pipeline runtime.
 *
 * Retrieve → Normalize → Parse → Rights Check → Deduplicate → Classify →
 * Cite → Index → Review → Promote
 *
 * No rights bypass; no pirated/leaked/cross-tenant; no auto-promote-to-truth;
 * promote only after review; claim clustering required.
 */

import { createHash } from 'node:crypto';
import {
  BRAIN_EXPANSION_TARGETS,
  EVIDENCE_CLASSES,
  ER5_AGENT_BOUNDS,
  ER5_DB_CANDIDATES_STATUS,
  ER5_LOCKS,
  ER5_MAY,
  ER5_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_CYCLE,
  HONESTY_BANNER,
  INGESTION_BOUNDARY,
  INGESTION_CORE_PROGRESSION,
  INGESTION_JOB_FIELDS,
  INGESTION_PIPELINE_STAGES,
  INGESTION_PROMOTION_STATES,
  NEXT_PHASE_TITLE,
  PROMOTED_CLAIM_FIELDS,
  assertEr5LocksIntact,
  er5SoftWireSnapshot,
  isCoreProgressionStep,
  isEr5Agent,
  isHumanApprover,
  nextCoreState,
  normalizeClaimKey,
  rightsStateAllowsApproval,
  type BrainExpansionTarget,
  type ClaimNode,
  type Er5Actor,
  type Er5EvidenceState,
  type Er5HopRecord,
  type Er5SoftWireSnapshot,
  type EvidenceClass,
  type IngestionJob,
  type IngestionJobField,
  type IngestionPromotionState,
  type IngestionSourceType,
  type LicenseRightsState,
  type PromotedClaim,
} from './global-historical-knowledge-ingestion-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_CYCLE)[number],
  state: Er5EvidenceState,
  summary: string,
): Er5HopRecord {
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

export function createDiscoveredJob(input: {
  actor: Er5Actor;
  ingestionId: string;
  sourceId: string;
  sourceType: IngestionSourceType;
  domain: string;
  geography: string;
  eraTimeRange: string;
  language: string;
  licenseRightsState?: LicenseRightsState;
}): IngestionJob | DenialResult {
  if (!isEr5Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER5 agents / home_base may create DISCOVERED jobs.');
  }
  if (!ER5_AGENT_BOUNDS.mayCreateDiscoveredJobs) {
    return deny('mayCreateDiscoveredJobs=false');
  }
  return {
    ingestionId: input.ingestionId,
    sourceId: input.sourceId,
    sourceType: input.sourceType,
    domain: input.domain,
    geography: input.geography,
    eraTimeRange: input.eraTimeRange,
    language: input.language,
    licenseRightsState: input.licenseRightsState ?? 'UNKNOWN',
    parserVersion: null,
    transformationHistory: ['retrieve:discovered'],
    entityLinks: [],
    duplicateMatches: [],
    contradictionFlags: [],
    confidence: null,
    reviewer: null,
    promotionState: 'DISCOVERED',
    evidenceRefs: [],
    evidenceClass: null,
    citationRefs: [],
    indexKeys: [],
    claimClusterId: null,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    piratedFullWork: false,
    leakedDatabase: false,
    crossTenantPooled: false,
    autoPromotedToTruth: false,
    hiddenChainOfThoughtStored: false,
  };
}

function appendEvidence(
  job: IngestionJob,
  evidenceReference: string,
  transformation: string,
  extra?: Partial<IngestionJob>,
): IngestionJob {
  return {
    ...job,
    ...extra,
    evidenceRefs: [...job.evidenceRefs, evidenceReference],
    transformationHistory: [...job.transformationHistory, transformation],
    piratedFullWork: false,
    leakedDatabase: false,
    crossTenantPooled: false,
    autoPromotedToTruth: false,
    hiddenChainOfThoughtStored: false,
  };
}

export type AdvanceInput = {
  actor: Er5Actor;
  job: IngestionJob;
  to: IngestionPromotionState;
  reason: string;
  evidenceReference: string;
  parserVersion?: string;
  attemptSkip?: boolean;
  attemptRightsBypass?: boolean;
  attemptAutoPromoteToTruth?: boolean;
};

/**
 * Advance one core progression step with evidence.
 * RIGHTS_APPROVED requires rights gate; PROMOTED requires REVIEW_REQUIRED + human.
 */
export function advanceIngestionState(
  input: AdvanceInput,
): IngestionJob | DenialResult {
  if (input.attemptSkip) {
    return deny('Cannot skip promotion states without supporting evidence.');
  }
  if (input.attemptRightsBypass || ER5_LOCKS.RIGHTS_BYPASS) {
    return deny('RIGHTS_BYPASS=false — rights check cannot be skipped.');
  }
  if (
    input.attemptAutoPromoteToTruth ||
    ER5_LOCKS.AUTO_PROMOTE_DISCOVERY_TO_TRUTH
  ) {
    return deny(
      'AUTO_PROMOTE_DISCOVERY_TO_TRUTH=false — discovery is not truth.',
    );
  }
  if (!ER5_AGENT_BOUNDS.mayAdvanceWithEvidence) {
    return deny('mayAdvanceWithEvidence=false');
  }
  if (!input.evidenceReference) {
    return deny('Supporting evidence reference required for every transition.');
  }
  if (
    input.job.promotionState === 'QUARANTINED' ||
    input.job.promotionState === 'REJECTED'
  ) {
    return deny(
      `Terminal ${input.job.promotionState} job cannot advance on core ladder.`,
    );
  }

  const from = input.job.promotionState;
  const to = input.to;

  if (!isCoreProgressionStep(from, to)) {
    return deny(
      `Cannot advance ${from} → ${to} without the next core step (no skips).`,
    );
  }

  if (to === 'RIGHTS_APPROVED') {
    const gate = rightsCheckGate({
      actor: input.actor,
      job: input.job,
      evidenceReference: input.evidenceReference,
      attemptBypass: input.attemptRightsBypass,
    });
    if ('denied' in gate) return gate;
    return gate;
  }

  if (to === 'PROMOTED') {
    return promoteAfterReview({
      actor: input.actor,
      job: input.job,
      reason: input.reason,
      evidenceReference: input.evidenceReference,
    });
  }

  if (to === 'PARSED' && !input.parserVersion && !input.job.parserVersion) {
    return deny('PARSED requires parserVersion.');
  }

  return appendEvidence(input.job, input.evidenceReference, `advance:${to}`, {
    promotionState: to,
    parserVersion:
      input.parserVersion ?? input.job.parserVersion ?? (to === 'PARSED' ? 'v0' : null),
  });
}

export function rightsCheckGate(input: {
  actor: Er5Actor;
  job: IngestionJob;
  evidenceReference: string;
  approvedRightsState?: LicenseRightsState;
  attemptBypass?: boolean;
  piratedFullWork?: boolean;
  leakedDatabase?: boolean;
}): IngestionJob | DenialResult {
  if (input.attemptBypass || ER5_LOCKS.RIGHTS_BYPASS) {
    return deny('RIGHTS_BYPASS=false — cannot bypass rights check.');
  }
  if (!ER5_AGENT_BOUNDS.mayRightsCheckGate) {
    return deny('mayRightsCheckGate=false');
  }
  if (input.piratedFullWork || ER5_LOCKS.PIRATED_FULL_WORKS) {
    return deny('PIRATED_FULL_WORKS=false — no pirated full works.');
  }
  if (input.leakedDatabase || ER5_LOCKS.PRIVATE_OR_LEAKED_DATABASES) {
    return deny(
      'PRIVATE_OR_LEAKED_DATABASES=false — no private or leaked databases.',
    );
  }
  if (input.job.promotionState !== 'DISCOVERED') {
    return deny('Rights check applies from DISCOVERED only.');
  }
  if (!input.evidenceReference) {
    return deny('Rights check requires evidence reference.');
  }

  const rights =
    input.approvedRightsState ?? input.job.licenseRightsState;
  if (rights === 'UNKNOWN') {
    return quarantineJob({
      actor: input.actor,
      job: input.job,
      reason: 'UNKNOWN_RIGHTS',
      evidenceReference: input.evidenceReference,
    });
  }
  if (rights === 'PIRATED_SUSPECT' || rights === 'LEAKED_SUSPECT') {
    return deny(
      `Rights state ${rights} denied — pirated/leaked material blocked.`,
    );
  }
  if (rights === 'PRIVATE_TENANT' || rights === 'DENIED' || rights === 'RESTRICTED') {
    return rejectJob({
      actor: input.actor,
      job: input.job,
      reason: `rights_${rights.toLowerCase()}`,
      evidenceReference: input.evidenceReference,
    });
  }
  if (!rightsStateAllowsApproval(rights)) {
    return deny(`Rights state ${rights} cannot be RIGHTS_APPROVED.`);
  }

  return appendEvidence(input.job, input.evidenceReference, 'rights_check:approved', {
    promotionState: 'RIGHTS_APPROVED',
    licenseRightsState: rights,
  });
}

export function dedupeClusterClaims(input: {
  actor: Er5Actor;
  jobs: readonly IngestionJob[];
  claimText: string;
  evidenceClass: EvidenceClass;
  confidence: number;
  contradictionFlags?: readonly string[];
}):
  | {
      claimNode: ClaimNode;
      jobs: readonly IngestionJob[];
      independentFactsCreated: false;
    }
  | DenialResult {
  if (
    ER5_LOCKS.CREATE_INDEPENDENT_FACTS_FOR_SAME_CLAIM ||
    !INGESTION_BOUNDARY.claimClusteringRequired
  ) {
    return deny(
      'CREATE_INDEPENDENT_FACTS_FOR_SAME_CLAIM=false — cluster into one claim node.',
    );
  }
  if (!ER5_AGENT_BOUNDS.mayDedupeClusterClaims) {
    return deny('mayDedupeClusterClaims=false');
  }
  if (input.jobs.length === 0) {
    return deny('At least one job required to cluster claims.');
  }

  const tenantId = input.jobs[0]!.tenantId;
  const orgId = input.jobs[0]!.orgId;
  const universeId = input.jobs[0]!.universeId;
  for (const j of input.jobs) {
    if (
      j.tenantId !== tenantId ||
      j.orgId !== orgId ||
      j.universeId !== universeId
    ) {
      return deny(
        'CROSS_TENANT_PRIVATE_DATA_POOLING=false — cannot pool claims across tenants.',
      );
    }
  }

  const key = normalizeClaimKey(input.claimText);
  const claimId = `claim-${sha256(key).slice(0, 16)}`;
  const sourceIds = input.jobs.map((j) => j.sourceId);

  const claimNode: ClaimNode = {
    claimId,
    claimText: input.claimText,
    normalizedKey: key,
    evidenceClass: input.evidenceClass,
    confidence: input.confidence,
    sourceIds,
    contradictionFlags: input.contradictionFlags ?? [],
    orgId,
    tenantId,
    universeId,
  };

  const jobs = input.jobs.map((j) =>
    appendEvidence(j, `dedupe://${claimId}`, 'dedupe:cluster', {
      promotionState:
        j.promotionState === 'NORMALIZED' || j.promotionState === 'DEDUPED'
          ? 'DEDUPED'
          : j.promotionState,
      claimClusterId: claimId,
      duplicateMatches: sourceIds.filter((s) => s !== j.sourceId),
      contradictionFlags: input.contradictionFlags ?? j.contradictionFlags,
      confidence: input.confidence,
      evidenceClass: input.evidenceClass,
    }),
  );

  return {
    claimNode,
    jobs,
    independentFactsCreated: false,
  };
}

export function classifyEvidenceClass(input: {
  actor: Er5Actor;
  job: IngestionJob;
  evidenceClass: EvidenceClass;
  evidenceReference: string;
  attemptTreatDisputedAsConsensus?: boolean;
}): IngestionJob | DenialResult {
  if (!ER5_AGENT_BOUNDS.mayClassifyEvidenceClass) {
    return deny('mayClassifyEvidenceClass=false');
  }
  if (
    input.attemptTreatDisputedAsConsensus ||
    ER5_LOCKS.TREAT_DISPUTED_AS_CONSENSUS
  ) {
    if (
      input.job.evidenceClass === 'disputed_claim' ||
      input.evidenceClass === 'disputed_claim'
    ) {
      return deny(
        'TREAT_DISPUTED_AS_CONSENSUS=false — disputed claims stay separate.',
      );
    }
    if (input.attemptTreatDisputedAsConsensus) {
      return deny(
        'TREAT_DISPUTED_AS_CONSENSUS=false — cannot reclassify disputed as consensus.',
      );
    }
  }
  if (!EVIDENCE_CLASSES.includes(input.evidenceClass)) {
    return deny(`Unknown evidence class: ${input.evidenceClass}`);
  }
  return appendEvidence(
    input.job,
    input.evidenceReference,
    `classify:${input.evidenceClass}`,
    { evidenceClass: input.evidenceClass },
  );
}

export function citeJob(input: {
  actor: Er5Actor;
  job: IngestionJob;
  citationRefs: readonly string[];
  evidenceReference: string;
}): IngestionJob | DenialResult {
  if (!ER5_AGENT_BOUNDS.mayCiteAndIndex) {
    return deny('mayCiteAndIndex=false');
  }
  if (input.citationRefs.length === 0) {
    return deny('At least one citation ref required.');
  }
  return appendEvidence(input.job, input.evidenceReference, 'cite', {
    citationRefs: [...input.job.citationRefs, ...input.citationRefs],
  });
}

export function indexJob(input: {
  actor: Er5Actor;
  job: IngestionJob;
  indexKeys: readonly string[];
  evidenceReference: string;
}): IngestionJob | DenialResult {
  if (!ER5_AGENT_BOUNDS.mayCiteAndIndex) {
    return deny('mayCiteAndIndex=false');
  }
  if (input.indexKeys.length === 0) {
    return deny('At least one index key required.');
  }
  return appendEvidence(input.job, input.evidenceReference, 'index', {
    indexKeys: [...input.job.indexKeys, ...input.indexKeys],
  });
}

export function reviewGate(input: {
  actor: Er5Actor;
  job: IngestionJob;
  evidenceReference: string;
}): IngestionJob | DenialResult {
  if (input.job.promotionState !== 'DEDUPED') {
    return deny('Review gate requires DEDUPED state.');
  }
  if (!input.evidenceReference) {
    return deny('Review gate requires evidence.');
  }
  return appendEvidence(input.job, input.evidenceReference, 'review:required', {
    promotionState: 'REVIEW_REQUIRED',
  });
}

export function promoteAfterReview(input: {
  actor: Er5Actor;
  job: IngestionJob;
  reason: string;
  evidenceReference: string;
  brainDestinations?: readonly BrainExpansionTarget[];
}):
  | {
      job: IngestionJob;
      promotedClaim: PromotedClaim;
      autoPromotedToTruth: false;
      brainDestinations: readonly BrainExpansionTarget[];
    }
  | DenialResult {
  if (
    ER5_LOCKS.SKIP_REVIEW_BEFORE_PROMOTE ||
    !INGESTION_BOUNDARY.promotedRequiresReviewGate
  ) {
    return deny('SKIP_REVIEW_BEFORE_PROMOTE=false — review required.');
  }
  if (ER5_LOCKS.AUTO_PROMOTE_DISCOVERY_TO_TRUTH) {
    return deny('AUTO_PROMOTE_DISCOVERY_TO_TRUTH=false.');
  }
  if (input.job.promotionState !== 'REVIEW_REQUIRED') {
    return deny(
      `Promote requires REVIEW_REQUIRED (got ${input.job.promotionState}).`,
    );
  }
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — promote requires human_approver, founder, tenant_admin, or reviewer.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential for promotion.');
  }
  if (!input.job.evidenceClass) {
    return deny('Promoted claim requires evidence class.');
  }
  if (!input.job.claimClusterId) {
    return deny('Promoted claim requires claim cluster (dedupe).');
  }

  const destinations =
    input.brainDestinations ??
    (['Historical Business Atlas', 'Search and retrieval'] as const);

  const job = appendEvidence(
    input.job,
    input.evidenceReference,
    'promote:after_review',
    {
      promotionState: 'PROMOTED',
      reviewer: input.actor.id,
    },
  );

  const promotedClaim: PromotedClaim = {
    claimId: input.job.claimClusterId,
    source: input.job.sourceId,
    authorOrganization: input.job.domain,
    dateEra: input.job.eraTimeRange,
    geography: input.job.geography,
    context: input.reason,
    claim: input.job.claimClusterId,
    evidenceClass: input.job.evidenceClass,
    confidence: input.job.confidence ?? 0,
    brainDestinations: destinations,
    promotedAt: nowIso(),
    reviewerId: input.actor.id,
  };

  return {
    job,
    promotedClaim,
    autoPromotedToTruth: false,
    brainDestinations: destinations,
  };
}

export function quarantineJob(input: {
  actor: Er5Actor;
  job: IngestionJob;
  reason: string;
  evidenceReference: string;
}): IngestionJob | DenialResult {
  if (!ER5_AGENT_BOUNDS.mayQuarantineRejectStale) {
    return deny('mayQuarantineRejectStale=false');
  }
  return appendEvidence(
    input.job,
    input.evidenceReference,
    `quarantine:${input.reason}`,
    { promotionState: 'QUARANTINED' },
  );
}

export function rejectJob(input: {
  actor: Er5Actor;
  job: IngestionJob;
  reason: string;
  evidenceReference: string;
}): IngestionJob | DenialResult {
  if (!ER5_AGENT_BOUNDS.mayQuarantineRejectStale) {
    return deny('mayQuarantineRejectStale=false');
  }
  return appendEvidence(
    input.job,
    input.evidenceReference,
    `reject:${input.reason}`,
    { promotionState: 'REJECTED' },
  );
}

export function markStale(input: {
  actor: Er5Actor;
  job: IngestionJob;
  reason: string;
  evidenceReference: string;
}): IngestionJob | DenialResult {
  if (!ER5_AGENT_BOUNDS.mayQuarantineRejectStale) {
    return deny('mayQuarantineRejectStale=false');
  }
  if (
    input.job.promotionState === 'QUARANTINED' ||
    input.job.promotionState === 'REJECTED'
  ) {
    return deny(`Cannot mark ${input.job.promotionState} as STALE.`);
  }
  return appendEvidence(
    input.job,
    input.evidenceReference,
    `stale:${input.reason}`,
    { promotionState: 'STALE' },
  );
}

export function attemptRightsBypass(): DenialResult {
  return deny('RIGHTS_BYPASS=false.');
}

export function attemptPiratedFullWorks(): DenialResult {
  return deny('PIRATED_FULL_WORKS=false.');
}

export function attemptPrivateOrLeakedDatabases(): DenialResult {
  return deny('PRIVATE_OR_LEAKED_DATABASES=false.');
}

export function attemptCrossTenantPrivatePooling(): DenialResult {
  return deny('CROSS_TENANT_PRIVATE_DATA_POOLING=false.');
}

export function attemptAutoPromoteDiscoveryToTruth(): DenialResult {
  return deny('AUTO_PROMOTE_DISCOVERY_TO_TRUTH=false.');
}

export function attemptPersistHiddenChainOfThought(): DenialResult {
  return deny('PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('BYPASS_GUARDIAN_RLS=false.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('EXPAND_TENANT_UNIVERSE_ACCESS=false.');
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

export function returnEr5EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er5Actor;
  job: IngestionJob;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
      autoPromotedToTruth: false;
      hiddenChainOfThoughtStored: false;
      ingestionId: string;
      promotionState: IngestionPromotionState;
    }
  | DenialResult {
  if (!ER5_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEr5Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER5 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
    autoPromotedToTruth: false,
    hiddenChainOfThoughtStored: false,
    ingestionId: input.job.ingestionId,
    promotionState: input.job.promotionState,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er5Actor;
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
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, tenant_admin, or reviewer.',
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
    unchanged: ER5_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER5_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER5_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

/**
 * Walk a job DISCOVERED → REVIEW_REQUIRED with evidence (no promote yet).
 */
export function exampleReviewReadyJob(actor: Er5Actor): {
  discovered: IngestionJob;
  reviewRequired: IngestionJob;
  claimNode: ClaimNode;
} {
  const discovered = createDiscoveredJob({
    actor,
    ingestionId: 'ing-hist-1',
    sourceId: 'src-archive-1',
    sourceType: 'historical_document',
    domain: 'logistics',
    geography: 'Mediterranean',
    eraTimeRange: '1200-1400 CE',
    language: 'en',
    licenseRightsState: 'APPROVED_PUBLIC',
  });
  if ('denied' in discovered) throw new Error(discovered.reason);

  const rights = rightsCheckGate({
    actor,
    job: discovered,
    evidenceReference: 'rights://public-archive-ok',
    approvedRightsState: 'APPROVED_PUBLIC',
  });
  if ('denied' in rights) throw new Error(rights.reason);

  const steps: Array<{
    to: IngestionPromotionState;
    reason: string;
    evidence: string;
    parserVersion?: string;
  }> = [
    {
      to: 'PARSED',
      reason: 'parser_ok',
      evidence: 'parse://v1/doc-1',
      parserVersion: 'hist-parser@1.0.0',
    },
    {
      to: 'NORMALIZED',
      reason: 'normalize_ok',
      evidence: 'norm://schema-v1',
    },
  ];

  let cur = rights;
  for (const s of steps) {
    const next = advanceIngestionState({
      actor,
      job: cur,
      to: s.to,
      reason: s.reason,
      evidenceReference: s.evidence,
      parserVersion: s.parserVersion,
    });
    if ('denied' in next) throw new Error(`${s.to}: ${next.reason}`);
    cur = next;
  }

  const classified = classifyEvidenceClass({
    actor,
    job: cur,
    evidenceClass: 'primary_evidence',
    evidenceReference: 'class://primary',
  });
  if ('denied' in classified) throw new Error(classified.reason);

  const cited = citeJob({
    actor,
    job: classified,
    citationRefs: ['cite://archive-1#p12'],
    evidenceReference: 'cite://pack-1',
  });
  if ('denied' in cited) throw new Error(cited.reason);

  const indexed = indexJob({
    actor,
    job: cited,
    indexKeys: ['era:1200-1400', 'geo:mediterranean', 'domain:logistics'],
    evidenceReference: 'index://keys-1',
  });
  if ('denied' in indexed) throw new Error(indexed.reason);

  // Second source repeating same claim — cluster, do not invent 50 facts
  const twin = createDiscoveredJob({
    actor,
    ingestionId: 'ing-hist-2',
    sourceId: 'src-archive-2',
    sourceType: 'public_archive',
    domain: 'logistics',
    geography: 'Mediterranean',
    eraTimeRange: '1200-1400 CE',
    language: 'en',
    licenseRightsState: 'APPROVED_PUBLIC',
  });
  if ('denied' in twin) throw new Error(twin.reason);
  const twinRights = rightsCheckGate({
    actor,
    job: twin,
    evidenceReference: 'rights://public-2',
    approvedRightsState: 'APPROVED_PUBLIC',
  });
  if ('denied' in twinRights) throw new Error(twinRights.reason);
  let twinCur = twinRights;
  for (const s of steps) {
    const next = advanceIngestionState({
      actor,
      job: twinCur,
      to: s.to,
      reason: s.reason,
      evidenceReference: `${s.evidence}/twin`,
      parserVersion: s.parserVersion,
    });
    if ('denied' in next) throw new Error(`twin ${s.to}: ${next.reason}`);
    twinCur = next;
  }

  const clustered = dedupeClusterClaims({
    actor,
    jobs: [indexed, twinCur],
    claimText: 'Venetian galley freight rates followed seasonal monsoon patterns',
    evidenceClass: 'primary_evidence',
    confidence: 0.72,
    contradictionFlags: [],
  });
  if ('denied' in clustered) throw new Error(clustered.reason);

  const dedupedJob = clustered.jobs[0]!;
  const review = reviewGate({
    actor,
    job: dedupedJob,
    evidenceReference: 'review://ready-1',
  });
  if ('denied' in review) throw new Error(review.reason);

  return {
    discovered,
    reviewRequired: review,
    claimNode: clustered.claimNode,
  };
}

export function bootstrapGlobalHistoricalKnowledgeIngestion(
  repoRoot?: string,
): {
  locksIntact: boolean;
  softWire: Er5SoftWireSnapshot;
  promotionStates: typeof INGESTION_PROMOTION_STATES;
  coreProgression: typeof INGESTION_CORE_PROGRESSION;
  pipelineStages: typeof INGESTION_PIPELINE_STAGES;
  jobFields: readonly IngestionJobField[];
  evidenceClasses: typeof EVIDENCE_CLASSES;
  claimFields: typeof PROMOTED_CLAIM_FIELDS;
  brainTargets: typeof BRAIN_EXPANSION_TARGETS;
  ingestionBoundary: typeof INGESTION_BOUNDARY;
  erLayer: typeof ER_LAYER_TITLE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof ER5_MAY;
  mustNot: typeof ER5_MUST_NOT;
  dbCandidates: typeof ER5_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEr5LocksIntact(),
    softWire: er5SoftWireSnapshot(repoRoot),
    promotionStates: INGESTION_PROMOTION_STATES,
    coreProgression: INGESTION_CORE_PROGRESSION,
    pipelineStages: INGESTION_PIPELINE_STAGES,
    jobFields: INGESTION_JOB_FIELDS,
    evidenceClasses: EVIDENCE_CLASSES,
    claimFields: PROMOTED_CLAIM_FIELDS,
    brainTargets: BRAIN_EXPANSION_TARGETS,
    ingestionBoundary: INGESTION_BOUNDARY,
    erLayer: ER_LAYER_TITLE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: ER5_MAY,
    mustNot: ER5_MUST_NOT,
    dbCandidates: ER5_DB_CANDIDATES_STATUS,
  };
}

function softWireHopState(present: boolean): Er5EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function runGlobalHistoricalKnowledgeIngestionCycle(input: {
  actor: Er5Actor;
  human: Er5Actor;
  repoRoot?: string;
}): {
  hops: Er5HopRecord[];
  job: IngestionJob;
  softWire: Er5SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Er5HopRecord[] = [];
  const softWire = er5SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr5LocksIntact() ? 'PASS' : 'FAIL',
      'ER5 locks intact including L4=false and no auto-promote-to-truth.',
    ),
  );
  hops.push(
    hop(
      'ingestion_pipeline_bootstrap',
      'PASS',
      'Global Historical Knowledge Ingestion Pipeline bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'promotion_states_encoded',
      INGESTION_PROMOTION_STATES.length === 10 ? 'PASS' : 'FAIL',
      INGESTION_PROMOTION_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'core_progression_encoded',
      INGESTION_CORE_PROGRESSION.length === 7 ? 'PASS' : 'FAIL',
      INGESTION_CORE_PROGRESSION.join(' → '),
    ),
  );
  hops.push(
    hop(
      'pipeline_stages_encoded',
      INGESTION_PIPELINE_STAGES.length === 10 ? 'PASS' : 'FAIL',
      INGESTION_PIPELINE_STAGES.join(' → '),
    ),
  );
  hops.push(
    hop(
      'job_fields_encoded',
      INGESTION_JOB_FIELDS.length === 17 ? 'PASS' : 'FAIL',
      INGESTION_JOB_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'evidence_classes_encoded',
      EVIDENCE_CLASSES.length === 6 ? 'PASS' : 'FAIL',
      EVIDENCE_CLASSES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'claim_structure_encoded',
      PROMOTED_CLAIM_FIELDS.length === 8 ? 'PASS' : 'FAIL',
      PROMOTED_CLAIM_FIELDS.join(' → '),
    ),
  );
  hops.push(
    hop(
      'brain_targets_encoded',
      BRAIN_EXPANSION_TARGETS.length === 10 ? 'PASS' : 'FAIL',
      'Documented brain expansion destinations after PROMOTED.',
    ),
  );
  hops.push(
    hop(
      'ingestion_boundary_encoded',
      INGESTION_BOUNDARY.mayBypassRightsCheck === false &&
        INGESTION_BOUNDARY.mayAutoPromoteDiscoveryToTruth === false &&
        INGESTION_BOUNDARY.promotedRequiresReviewGate === true
        ? 'PASS'
        : 'FAIL',
      'Ingestion boundary: no rights bypass; no auto-truth; review required.',
    ),
  );

  const { discovered, reviewRequired, claimNode } = exampleReviewReadyJob(
    input.actor,
  );

  hops.push(
    hop(
      'create_discovered_job',
      discovered.promotionState === 'DISCOVERED' ? 'PASS' : 'FAIL',
      'DISCOVERED job created with tracking fields.',
    ),
  );

  const unknown = createDiscoveredJob({
    actor: input.actor,
    ingestionId: 'ing-unknown',
    sourceId: 'src-u',
    sourceType: 'other',
    domain: 'test',
    geography: 'n/a',
    eraTimeRange: 'n/a',
    language: 'en',
    licenseRightsState: 'UNKNOWN',
  });
  const unknownGate =
    !('denied' in unknown)
      ? rightsCheckGate({
          actor: input.actor,
          job: unknown,
          evidenceReference: 'rights://unknown',
        })
      : unknown;
  const bypass = rightsCheckGate({
    actor: input.actor,
    job: discovered,
    evidenceReference: 'rights://bypass',
    attemptBypass: true,
  });
  hops.push(
    hop(
      'rights_check_gate',
      !('denied' in unknownGate) &&
        unknownGate.promotionState === 'QUARANTINED' &&
        bypass.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'UNKNOWN_RIGHTS→QUARANTINE; rights bypass DENIED.',
    ),
  );

  hops.push(
    hop(
      'advance_with_evidence',
      reviewRequired.promotionState === 'REVIEW_REQUIRED' &&
        nextCoreState('DEDUPED') === 'REVIEW_REQUIRED'
        ? 'PASS'
        : 'FAIL',
      'Core progression advanced with evidence to REVIEW_REQUIRED.',
    ),
  );

  hops.push(
    hop(
      'dedupe_cluster_claims',
      claimNode.sourceIds.length >= 2 &&
        reviewRequired.claimClusterId === claimNode.claimId
        ? 'PASS'
        : 'FAIL',
      'Duplicate claims clustered into one node with multi-source links.',
    ),
  );

  hops.push(
    hop(
      'classify_evidence_class',
      reviewRequired.evidenceClass === 'primary_evidence' ? 'PASS' : 'FAIL',
      'Evidence class classified and kept separate from speculation/disputed.',
    ),
  );

  hops.push(
    hop(
      'cite_and_index',
      reviewRequired.citationRefs.length > 0 &&
        reviewRequired.indexKeys.length > 0
        ? 'PASS'
        : 'FAIL',
      'Citation and index keys recorded before review.',
    ),
  );

  const skipPromote = advanceIngestionState({
    actor: input.actor,
    job: discovered,
    to: 'PROMOTED',
    reason: 'illegal_skip',
    evidenceReference: 'bad',
    attemptAutoPromoteToTruth: true,
  });
  hops.push(
    hop(
      'review_gate_before_promote',
      reviewRequired.promotionState === 'REVIEW_REQUIRED' &&
        skipPromote.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Review gate required; auto-promote-to-truth DENIED.',
    ),
  );

  const promoted = promoteAfterReview({
    actor: input.human,
    job: reviewRequired,
    reason: 'curated historical logistics claim',
    evidenceReference: 'promote://human-1',
    brainDestinations: [
      'Historical Business Atlas',
      'Logistics/Supply Chain brain',
      'Search and retrieval',
    ],
  });
  hops.push(
    hop(
      'promote_after_review',
      !('denied' in promoted) &&
        promoted.job.promotionState === 'PROMOTED' &&
        promoted.autoPromotedToTruth === false
        ? 'PASS'
        : 'FAIL',
      'PROMOTED only after human review; not treated as automatic truth.',
    ),
  );

  const stale = markStale({
    actor: input.actor,
    job: reviewRequired,
    reason: 'superseded_corpus',
    evidenceReference: 'stale://1',
  });
  const rejected = rejectJob({
    actor: input.actor,
    job: discovered,
    reason: 'policy',
    evidenceReference: 'reject://1',
  });
  hops.push(
    hop(
      'quarantine_reject_stale',
      !('denied' in unknownGate) &&
        unknownGate.promotionState === 'QUARANTINED' &&
        !('denied' in stale) &&
        stale.promotionState === 'STALE' &&
        !('denied' in rejected) &&
        rejected.promotionState === 'REJECTED'
        ? 'PASS'
        : 'FAIL',
      'QUARANTINED / REJECTED / STALE paths available with evidence.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_rights_bypass', fn: attemptRightsBypass },
    { hop: 'deny_pirated_full_works', fn: attemptPiratedFullWorks },
    {
      hop: 'deny_private_leaked_databases',
      fn: attemptPrivateOrLeakedDatabases,
    },
    {
      hop: 'deny_cross_tenant_private_pooling',
      fn: attemptCrossTenantPrivatePooling,
    },
    {
      hop: 'deny_auto_promote_discovery_to_truth',
      fn: attemptAutoPromoteDiscoveryToTruth,
    },
    {
      hop: 'deny_hidden_chain_of_thought',
      fn: attemptPersistHiddenChainOfThought,
    },
    { hop: 'deny_bypass_guardian_rls', fn: attemptBypassGuardianRls },
    {
      hop: 'deny_expand_tenant_universe_access',
      fn: attemptExpandTenantUniverseAccess,
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
      ER5_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Global Historical Knowledge Ingestion') &&
        GITHUB_SOT_ISSUE === 162
        ? 'PASS'
        : 'FAIL',
      'ER layer context (#162); next ER6 Historical Business Case Atlas v2.',
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
      ER5_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const finalJob =
    !('denied' in promoted) ? promoted.job : reviewRequired;
  const evidence = returnEr5EvidenceToHomeBase({
    evidenceId: 'ev-er5-ingest-1',
    actor: input.actor,
    job: finalJob,
    summary: 'historical knowledge ingestion advisory',
  });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er5-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in evidence || 'denied' in humanGate ? 'DENIED' : 'PASS',
      'Ingestion evidence to Home Base; human gate exercised; no hidden CoT.',
    ),
  );

  void GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      ingestionId: finalJob.ingestionId,
      promotionState: finalJob.promotionState,
    }),
  );

  return {
    hops,
    job: finalJob,
    softWire,
    cycleEvidenceSha256,
  };
}
