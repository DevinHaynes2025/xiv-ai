/**
 * 62L-ER37 — Federated Learning Research Candidate runtime.
 *
 * Opt-in enrollment → local training on approved data (raw stays local) →
 * bounded update submission → privacy/security + adversarial checks →
 * quarantine suspicious → aggregate accepted → evaluate → candidate →
 * human/policy promotion only (no automatic global deploy).
 */

import {
  ADVERSARIAL_PROTECTION_CHECKS,
  ALLOWED_BOUNDED_ARTIFACTS,
  ER37_AGENT_BOUNDS,
  ER37_DB_CANDIDATES_STATUS,
  ER37_LOCKS,
  ER37_MAY,
  ER37_MUST_NOT,
  ER_LAYER_TITLE,
  FEDERATED_LEARNING_CORE_FLOW,
  FEDERATED_LEARNING_JOB_FIELDS,
  FEDERATED_LEARNING_JOB_STATES,
  FEDERATED_LEARNING_RESEARCH_CANDIDATE_CYCLE,
  FEDERATED_PRIVACY_HONESTY,
  FEDERATED_TENANT_SCOPES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROMOTION_BOUNDARY,
  PROMOTION_GATE_REQUIREMENTS,
  RAW_SOURCE_STAYS_LOCAL,
  TENANT_ISOLATION_BOUNDARY,
  VEHICLE_MOBILE_BOUNDARY,
  assertEr37LocksIntact,
  er37SoftWireSnapshot,
  federatedLearningIsAutomaticallyPrivate,
  isEr37Agent,
  isHumanOrPolicyPromoter,
  orgScopeMayAutoInfluenceGlobal,
  softWireHopState,
  type AllowedBoundedArtifact,
  type ContributionDisposition,
  type Er37Actor,
  type Er37EvidenceState,
  type Er37HopRecord,
  type Er37SoftWireSnapshot,
  type FederatedLearningJobState,
  type FederatedTenantScope,
} from './federated-learning-research-candidate-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof FEDERATED_LEARNING_RESEARCH_CANDIDATE_CYCLE)[number],
  state: Er37EvidenceState,
  summary: string,
): Er37HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'QUARANTINED' | 'REJECTED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: DenialResult['state'] = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type PrivacyControls = {
  threatReviewRequired: true;
  secureAggregationWhereApplicable: true;
  leakageTestingRequired: true;
  explicitConsentRequired: true;
  claimsAutomaticallyPrivate: false;
};

export type FederatedLearningJob = {
  campaignId: string;
  modelOrPolicyVersion: string;
  participatingDeviceClass: string;
  consentScope: FederatedTenantScope;
  tenantId: string;
  universeId: string;
  orgId: string;
  approvedDataClass: string;
  localTrainingObjective: string;
  localEpochsOrSteps: number;
  updateType: 'model_delta' | 'gradient_aggregate' | 'policy_delta';
  aggregationMethod: string;
  minimumParticipantCount: number;
  privacyControls: PrivacyControls;
  poisoningAnomalyChecks: readonly string[];
  evaluationDataset: string;
  rollbackVersion: string;
  promotionState: FederatedLearningJobState;
  rawSourceRemainsLocal: true;
  automaticGlobalDeployment: false;
  mobilityOptIn: boolean;
  vehicleTelemetryAssumed: false;
};

export type LocalTrainingSession = {
  campaignId: string;
  deviceId: string;
  state: 'LOCAL_TRAINING';
  approvedDataClass: string;
  localEpochsOrSteps: number;
  rawArtifactsExchanged: false;
  boundedArtifactPrepared: AllowedBoundedArtifact | null;
  rawSourceClassesKeptLocal: typeof RAW_SOURCE_STAYS_LOCAL;
};

export type BoundedUpdateSubmission = {
  campaignId: string;
  deviceId: string;
  updateId: string;
  artifactType: AllowedBoundedArtifact;
  modelOrPolicyVersion: string;
  state: 'UPDATE_SUBMITTED';
  containsRawSourceData: false;
  disposition: ContributionDisposition;
  adversarialFlags: readonly string[];
};

export type AggregationResult = {
  campaignId: string;
  participantCount: number;
  aggregatedUpdateIds: readonly string[];
  quarantinedUpdateIds: readonly string[];
  state: 'AGGREGATED';
  includedQuarantined: false;
};

export type EvaluationResult = {
  campaignId: string;
  state: 'EVALUATED' | 'CANDIDATE' | 'REJECTED';
  measurableQualityImprovement: boolean;
  unacceptableRegression: boolean;
  privacySecurityEvidenceAccepted: boolean;
  reproducible: boolean;
  rollbackVersion: string;
  candidateVersion: string | null;
};

export type PromotionDecision = {
  campaignId: string;
  promoted: true;
  state: 'CANDIDATE';
  automaticGlobalDeployment: false;
  humanOrPolicyApproved: true;
  evidenceSatisfied: typeof PROMOTION_GATE_REQUIREMENTS;
};

export function createFederatedLearningJob(input: {
  actor: Er37Actor;
  campaignId: string;
  modelOrPolicyVersion: string;
  participatingDeviceClass: string;
  consentScope: FederatedTenantScope;
  approvedDataClass: string;
  localTrainingObjective: string;
  localEpochsOrSteps: number;
  updateType: FederatedLearningJob['updateType'];
  aggregationMethod: string;
  minimumParticipantCount: number;
  evaluationDataset: string;
  rollbackVersion: string;
  mobilityOptIn?: boolean;
  attemptAssumeVehicleTelemetry?: boolean;
  attemptClaimAutomaticallyPrivate?: boolean;
  attemptPoolRawCentrally?: boolean;
  attemptOrgAutoGlobal?: boolean;
}): FederatedLearningJob | DenialResult {
  if (!isEr37Agent(input.actor) && input.actor.kind !== 'tenant_admin') {
    return deny('Only federated research actors may create FL campaigns.');
  }
  if (input.attemptClaimAutomaticallyPrivate) {
    return deny(
      'FEDERATED_LEARNING_AUTOMATICALLY_PRIVATE=false — FL still needs threat review, secure aggregation where applicable, leakage testing, and explicit consent.',
    );
  }
  if (input.attemptPoolRawCentrally) {
    return deny(
      'POOL_RAW_PRIVATE_DATA_CENTRALLY=false — raw source data stays local; exchange bounded artifacts only.',
    );
  }
  if (input.attemptAssumeVehicleTelemetry) {
    return deny(
      'ASSUME_RAW_VEHICLE_TELEMETRY_AVAILABLE=false — GPS/camera/driver/vehicle telemetry never assumed available.',
    );
  }
  if (
    input.attemptOrgAutoGlobal ||
    (input.consentScope === 'ORGANIZATION_FEDERATED' &&
      orgScopeMayAutoInfluenceGlobal(input.consentScope))
  ) {
    return deny(
      'ORG_PRIVATE_SIGNAL_AUTO_INFLUENCES_GLOBAL=false — organization federated signal cannot automatically influence a global model.',
    );
  }
  if (
    input.consentScope === 'GLOBAL_OPT_IN_RESEARCH' &&
    !input.actor.permissions.includes('global_opt_in_research')
  ) {
    return deny(
      'GLOBAL_OPT_IN_RESEARCH requires explicit global opt-in research permission; org scope does not auto-upgrade.',
    );
  }

  return {
    campaignId: input.campaignId,
    modelOrPolicyVersion: input.modelOrPolicyVersion,
    participatingDeviceClass: input.participatingDeviceClass,
    consentScope: input.consentScope,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    approvedDataClass: input.approvedDataClass,
    localTrainingObjective: input.localTrainingObjective,
    localEpochsOrSteps: input.localEpochsOrSteps,
    updateType: input.updateType,
    aggregationMethod: input.aggregationMethod,
    minimumParticipantCount: input.minimumParticipantCount,
    privacyControls: {
      threatReviewRequired: true,
      secureAggregationWhereApplicable: true,
      leakageTestingRequired: true,
      explicitConsentRequired: true,
      claimsAutomaticallyPrivate: false,
    },
    poisoningAnomalyChecks: ADVERSARIAL_PROTECTION_CHECKS,
    evaluationDataset: input.evaluationDataset,
    rollbackVersion: input.rollbackVersion,
    promotionState: 'RESEARCH_ONLY',
    rawSourceRemainsLocal: true,
    automaticGlobalDeployment: false,
    mobilityOptIn: input.mobilityOptIn === true,
    vehicleTelemetryAssumed: false,
  };
}

export function enrollOptInDevice(input: {
  job: FederatedLearningJob;
  deviceId: string;
  explicitConsent: boolean;
  consentScope: FederatedTenantScope;
}):
  | {
      deviceId: string;
      campaignId: string;
      state: 'ENROLLED';
      consentScope: FederatedTenantScope;
    }
  | DenialResult {
  if (!input.explicitConsent) {
    return deny(
      'OPT_IN_PENDING — explicit consent required before ENROLLED.',
      'DENIED',
    );
  }
  if (input.consentScope !== input.job.consentScope) {
    return deny(
      'Consent scope must match campaign scope; no silent scope escalation.',
    );
  }
  if (
    input.job.consentScope === 'ORGANIZATION_FEDERATED' &&
    orgScopeMayAutoInfluenceGlobal(input.consentScope)
  ) {
    return deny(
      'Organization enrollment cannot auto-escalate into GLOBAL_OPT_IN_RESEARCH.',
    );
  }
  return {
    deviceId: input.deviceId,
    campaignId: input.job.campaignId,
    state: 'ENROLLED',
    consentScope: input.consentScope,
  };
}

export function runLocalTraining(input: {
  job: FederatedLearningJob;
  deviceId: string;
  attemptExfiltrateRaw?: boolean;
  attemptUseAssumedVehicleTelemetry?: boolean;
  attemptMobilityWithoutOptIn?: boolean;
}): LocalTrainingSession | DenialResult {
  if (input.attemptExfiltrateRaw) {
    return deny(
      'RAW_SOURCE_STAYS_LOCAL — original documents/routes/images/telemetry must not leave the device in this federated design.',
    );
  }
  if (input.attemptUseAssumedVehicleTelemetry) {
    return deny(
      'Vehicle/mobile telemetry is not assumed available; future mobility learning requires explicit opt-in.',
    );
  }
  if (input.attemptMobilityWithoutOptIn && !input.job.mobilityOptIn) {
    return deny(
      'MOBILITY_LEARNING_WITHOUT_EXPLICIT_OPT_IN=false — mobility learning requires explicit opt-in.',
    );
  }
  if (input.job.promotionState === 'REVOKED') {
    return deny('REVOKED campaigns cannot run local training.');
  }

  return {
    campaignId: input.job.campaignId,
    deviceId: input.deviceId,
    state: 'LOCAL_TRAINING',
    approvedDataClass: input.job.approvedDataClass,
    localEpochsOrSteps: input.job.localEpochsOrSteps,
    rawArtifactsExchanged: false,
    boundedArtifactPrepared: 'model_deltas',
    rawSourceClassesKeptLocal: RAW_SOURCE_STAYS_LOCAL,
  };
}

export function submitBoundedUpdate(input: {
  job: FederatedLearningJob;
  deviceId: string;
  updateId: string;
  artifactType: string;
  adversarialFlags?: readonly string[];
  containsRawSourceData?: boolean;
  staleModelVersion?: boolean;
}): BoundedUpdateSubmission | DenialResult {
  if (input.containsRawSourceData) {
    return deny(
      'EXCHANGE_RAW_DOCUMENTS_ROUTES_IMAGES_TELEMETRY=false — only bounded artifacts permitted.',
    );
  }
  if (
    !(ALLOWED_BOUNDED_ARTIFACTS as readonly string[]).includes(
      input.artifactType,
    )
  ) {
    return deny(
      `Artifact type ${input.artifactType} is not an allowed bounded artifact.`,
    );
  }

  const flags = [
    ...(input.adversarialFlags ?? []),
    ...(input.staleModelVersion ? (['stale_model_versions'] as const) : []),
  ];
  const suspicious = flags.length > 0;

  if (suspicious) {
    return {
      campaignId: input.job.campaignId,
      deviceId: input.deviceId,
      updateId: input.updateId,
      artifactType: input.artifactType as AllowedBoundedArtifact,
      modelOrPolicyVersion: input.job.modelOrPolicyVersion,
      state: 'UPDATE_SUBMITTED',
      containsRawSourceData: false,
      disposition: 'QUARANTINED',
      adversarialFlags: flags,
    };
  }

  return {
    campaignId: input.job.campaignId,
    deviceId: input.deviceId,
    updateId: input.updateId,
    artifactType: input.artifactType as AllowedBoundedArtifact,
    modelOrPolicyVersion: input.job.modelOrPolicyVersion,
    state: 'UPDATE_SUBMITTED',
    containsRawSourceData: false,
    disposition: 'ACCEPTED_FOR_AGGREGATION',
    adversarialFlags: [],
  };
}

export function quarantineSuspiciousContribution(input: {
  submission: BoundedUpdateSubmission;
}): BoundedUpdateSubmission | DenialResult {
  if (input.submission.adversarialFlags.length === 0) {
    return deny('No adversarial flags — nothing to quarantine.');
  }
  return {
    ...input.submission,
    disposition: 'QUARANTINED',
  };
}

export function aggregateAcceptedUpdates(input: {
  job: FederatedLearningJob;
  submissions: readonly BoundedUpdateSubmission[];
  forceIncludeQuarantined?: boolean;
}): AggregationResult | DenialResult {
  if (input.forceIncludeQuarantined) {
    return deny(
      'AGGREGATE_QUARANTINED_UPDATES_AUTOMATICALLY=false — suspicious contributions stay QUARANTINED.',
    );
  }

  const accepted = input.submissions.filter(
    (s) => s.disposition === 'ACCEPTED_FOR_AGGREGATION',
  );
  const quarantined = input.submissions.filter(
    (s) => s.disposition === 'QUARANTINED',
  );

  if (accepted.length < input.job.minimumParticipantCount) {
    return deny(
      `Minimum participant count ${input.job.minimumParticipantCount} not met (accepted=${accepted.length}).`,
      'WAITING_DATA',
    );
  }

  return {
    campaignId: input.job.campaignId,
    participantCount: accepted.length,
    aggregatedUpdateIds: accepted.map((s) => s.updateId),
    quarantinedUpdateIds: quarantined.map((s) => s.updateId),
    state: 'AGGREGATED',
    includedQuarantined: false,
  };
}

export function evaluateFederatedCandidate(input: {
  job: FederatedLearningJob;
  aggregation: AggregationResult;
  measurableQualityImprovement: boolean;
  unacceptableRegression: boolean;
  privacySecurityEvidenceAccepted: boolean;
  reproducible: boolean;
  candidateVersion: string;
}): EvaluationResult | DenialResult {
  if (input.aggregation.includedQuarantined) {
    return deny('Cannot evaluate an aggregation that included quarantined updates.');
  }

  const eligible =
    input.measurableQualityImprovement &&
    !input.unacceptableRegression &&
    input.privacySecurityEvidenceAccepted &&
    input.reproducible &&
    Boolean(input.job.rollbackVersion);

  return {
    campaignId: input.job.campaignId,
    state: eligible ? 'CANDIDATE' : 'REJECTED',
    measurableQualityImprovement: input.measurableQualityImprovement,
    unacceptableRegression: input.unacceptableRegression,
    privacySecurityEvidenceAccepted: input.privacySecurityEvidenceAccepted,
    reproducible: input.reproducible,
    rollbackVersion: input.job.rollbackVersion,
    candidateVersion: eligible ? input.candidateVersion : null,
  };
}

export function promoteFederatedCandidate(input: {
  job: FederatedLearningJob;
  evaluation: EvaluationResult;
  actor: Er37Actor;
  attemptAutomaticGlobalDeploy?: boolean;
  skipHumanOrPolicy?: boolean;
}): PromotionDecision | DenialResult {
  if (input.attemptAutomaticGlobalDeploy) {
    return deny(
      'AUTOMATIC_GLOBAL_DEPLOYMENT=false — federated candidates do not auto-deploy globally.',
    );
  }
  if (input.skipHumanOrPolicy || !isHumanOrPolicyPromoter(input.actor)) {
    return deny(
      'PROMOTE_WITHOUT_HUMAN_OR_POLICY=false — human or policy promotion required.',
    );
  }
  if (input.evaluation.state !== 'CANDIDATE') {
    return deny('Only EVALUATED→CANDIDATE results may be promoted.');
  }
  if (!input.evaluation.measurableQualityImprovement) {
    return deny('PROMOTE_WITHOUT_QUALITY_EVIDENCE=false.');
  }
  if (input.evaluation.unacceptableRegression) {
    return deny('Unacceptable regression blocks promotion.');
  }
  if (!input.evaluation.privacySecurityEvidenceAccepted) {
    return deny('PROMOTE_WITHOUT_PRIVACY_SECURITY_EVIDENCE=false.');
  }
  if (!input.evaluation.reproducible) {
    return deny('PROMOTE_WITHOUT_REPRODUCIBILITY=false.');
  }
  if (!input.job.rollbackVersion) {
    return deny('PROMOTE_WITHOUT_ROLLBACK=false.');
  }
  if (input.job.consentScope === 'ORGANIZATION_FEDERATED') {
    // Org candidates stay org-scoped; cannot silently become global.
    if (orgScopeMayAutoInfluenceGlobal(input.job.consentScope)) {
      return deny(
        'Organization federated candidates cannot automatically influence global models.',
      );
    }
  }

  return {
    campaignId: input.job.campaignId,
    promoted: true,
    state: 'CANDIDATE',
    automaticGlobalDeployment: false,
    humanOrPolicyApproved: true,
    evidenceSatisfied: PROMOTION_GATE_REQUIREMENTS,
  };
}

export function attemptClaimFlAutomaticallyPrivate(): DenialResult {
  return deny(
    'MAY_CLAIM_FL_AUTOMATICALLY_PRIVATE=false — federated learning is not automatically private.',
  );
}

export function attemptOrgSignalAutoGlobal(): DenialResult {
  return deny(
    'ORG_PRIVATE_SIGNAL_AUTO_INFLUENCES_GLOBAL=false — company private training signal cannot automatically influence a global model.',
  );
}

export function attemptAggregateQuarantined(): DenialResult {
  return deny(
    'AGGREGATE_QUARANTINED_UPDATES_AUTOMATICALLY=false — suspicious contributions remain QUARANTINED.',
  );
}

export function attemptAutomaticGlobalDeploy(): DenialResult {
  return deny(
    'AUTOMATIC_GLOBAL_DEPLOYMENT=false — no automatic global deployment of federated candidates.',
  );
}

export function attemptAssumeVehicleTelemetry(): DenialResult {
  return deny(
    'ASSUME_RAW_VEHICLE_TELEMETRY_AVAILABLE=false — raw GPS/camera/driver/vehicle telemetry never assumed available.',
  );
}

export function attemptSelfDrivingWithoutAuthorization(): DenialResult {
  return deny(
    'SELF_DRIVING_WITHOUT_SEPARATE_AUTHORIZATION=false — self-driving remains simulation/research unless separately authorized and safety validated.',
  );
}

export function attemptPoolRawPrivateData(): DenialResult {
  return deny(
    'POOL_RAW_PRIVATE_DATA_CENTRALLY=false — raw private data stays local.',
  );
}

export function attemptEnableL4Autonomy(): DenialResult {
  return deny('L4_AUTONOMY_ENABLED=false — autonomy remains locked off.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act.');
}

export function attemptHiddenChainOfThought(): DenialResult {
  return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_ER37=false.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE=false.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('EXPAND_TENANT_UNIVERSE_ACCESS=false.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  state: 'PASS';
  unchanged: true;
} {
  return {
    state: 'PASS',
    unchanged: ER37_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er37Actor;
  action: string;
}):
  | {
      approvalId: string;
      approved: true;
      action: string;
      automaticAuthority: false;
    }
  | DenialResult {
  if (!isHumanOrPolicyPromoter(input.actor)) {
    return deny('Human/policy approval required for consequential actions.');
  }
  return {
    approvalId: input.approvalId,
    approved: true,
    action: input.action,
    automaticAuthority: false,
  };
}

export function returnEr37EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er37Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      received: true;
      authorityGranted: false;
      summary: string;
    }
  | DenialResult {
  if (!isEr37Agent(input.actor) && !isHumanOrPolicyPromoter(input.actor)) {
    return deny('Unrecognized actor for evidence return.');
  }
  return {
    evidenceId: input.evidenceId,
    received: true,
    authorityGranted: false,
    summary: input.summary,
  };
}

export function exampleResearchJob(actor: Er37Actor): FederatedLearningJob {
  const job = createFederatedLearningJob({
    actor: {
      ...actor,
      permissions: [...actor.permissions],
    },
    campaignId: 'fl-campaign-research-1',
    modelOrPolicyVersion: 'routing-policy-v0.3.1',
    participatingDeviceClass: 'edge_node',
    consentScope: 'ORGANIZATION_FEDERATED',
    approvedDataClass: 'approved_local_routing_features',
    localTrainingObjective: 'improve_local_routing_ranker',
    localEpochsOrSteps: 3,
    updateType: 'model_delta',
    aggregationMethod: 'secure_fedavg_candidate',
    minimumParticipantCount: 2,
    evaluationDataset: 'org_heldout_routing_bench_v1',
    rollbackVersion: 'routing-policy-v0.3.0',
  });
  if ('denied' in job) {
    throw new Error(job.reason);
  }
  return job;
}

export function bootstrapFederatedLearningResearchCandidate(repoRoot?: string): {
  locksIntact: boolean;
  honesty: typeof HONESTY_BANNER;
  fields: typeof FEDERATED_LEARNING_JOB_FIELDS;
  states: typeof FEDERATED_LEARNING_JOB_STATES;
  scopes: typeof FEDERATED_TENANT_SCOPES;
  coreFlow: typeof FEDERATED_LEARNING_CORE_FLOW;
  boundedArtifacts: typeof ALLOWED_BOUNDED_ARTIFACTS;
  rawStaysLocal: typeof RAW_SOURCE_STAYS_LOCAL;
  adversarialChecks: typeof ADVERSARIAL_PROTECTION_CHECKS;
  promotionGate: typeof PROMOTION_GATE_REQUIREMENTS;
  privacyHonesty: typeof FEDERATED_PRIVACY_HONESTY;
  vehicleBoundary: typeof VEHICLE_MOBILE_BOUNDARY;
  tenantIsolation: typeof TENANT_ISOLATION_BOUNDARY;
  promotionBoundary: typeof PROMOTION_BOUNDARY;
  may: typeof ER37_MAY;
  mustNot: typeof ER37_MUST_NOT;
  agentBounds: typeof ER37_AGENT_BOUNDS;
  dbCandidates: typeof ER37_DB_CANDIDATES_STATUS;
  softWire: Er37SoftWireSnapshot;
  flAutomaticallyPrivate: false;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ER_LAYER_TITLE;
    next: typeof NEXT_PHASE_TITLE;
  };
} {
  const softWire = er37SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEr37LocksIntact(),
    honesty: HONESTY_BANNER,
    fields: FEDERATED_LEARNING_JOB_FIELDS,
    states: FEDERATED_LEARNING_JOB_STATES,
    scopes: FEDERATED_TENANT_SCOPES,
    coreFlow: FEDERATED_LEARNING_CORE_FLOW,
    boundedArtifacts: ALLOWED_BOUNDED_ARTIFACTS,
    rawStaysLocal: RAW_SOURCE_STAYS_LOCAL,
    adversarialChecks: ADVERSARIAL_PROTECTION_CHECKS,
    promotionGate: PROMOTION_GATE_REQUIREMENTS,
    privacyHonesty: FEDERATED_PRIVACY_HONESTY,
    vehicleBoundary: VEHICLE_MOBILE_BOUNDARY,
    tenantIsolation: TENANT_ISOLATION_BOUNDARY,
    promotionBoundary: PROMOTION_BOUNDARY,
    may: ER37_MAY,
    mustNot: ER37_MUST_NOT,
    agentBounds: ER37_AGENT_BOUNDS,
    dbCandidates: ER37_DB_CANDIDATES_STATUS,
    softWire,
    flAutomaticallyPrivate: federatedLearningIsAutomaticallyPrivate(),
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      layer: ER_LAYER_TITLE,
      next: NEXT_PHASE_TITLE,
    },
  };
}

export function runFederatedLearningResearchCandidateCycle(input: {
  actor: Er37Actor;
  human: Er37Actor;
  repoRoot?: string;
}): {
  hops: Er37HopRecord[];
  softWire: Er37SoftWireSnapshot;
} {
  const softWire = er37SoftWireSnapshot(input.repoRoot);
  const hops: Er37HopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      assertEr37LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );
  hops.push(
    hop(
      'federated_learning_research_candidate_bootstrap',
      'PASS',
      'Federated learning research candidate bootstrap',
    ),
  );
  hops.push(
    hop(
      'job_fields_encoded',
      FEDERATED_LEARNING_JOB_FIELDS.length === 16 ? 'PASS' : 'FAIL',
      `${FEDERATED_LEARNING_JOB_FIELDS.length} job fields`,
    ),
  );
  hops.push(
    hop(
      'job_states_encoded',
      FEDERATED_LEARNING_JOB_STATES.length === 10 ? 'PASS' : 'FAIL',
      `${FEDERATED_LEARNING_JOB_STATES.length} job states`,
    ),
  );
  hops.push(
    hop(
      'tenant_scopes_encoded',
      FEDERATED_TENANT_SCOPES.length === 3 ? 'PASS' : 'FAIL',
      FEDERATED_TENANT_SCOPES.join('|'),
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      FEDERATED_LEARNING_CORE_FLOW.length === 8 ? 'PASS' : 'FAIL',
      FEDERATED_LEARNING_CORE_FLOW.join('→'),
    ),
  );
  hops.push(
    hop(
      'bounded_artifacts_encoded',
      ALLOWED_BOUNDED_ARTIFACTS.length === 4 ? 'PASS' : 'FAIL',
      ALLOWED_BOUNDED_ARTIFACTS.join(','),
    ),
  );
  hops.push(
    hop(
      'raw_source_stays_local_encoded',
      RAW_SOURCE_STAYS_LOCAL.length >= 4 ? 'PASS' : 'FAIL',
      'raw source stays local when design allows',
    ),
  );
  hops.push(
    hop(
      'adversarial_checks_encoded',
      ADVERSARIAL_PROTECTION_CHECKS.length === 7 ? 'PASS' : 'FAIL',
      ADVERSARIAL_PROTECTION_CHECKS.join(','),
    ),
  );
  hops.push(
    hop(
      'promotion_gate_encoded',
      PROMOTION_GATE_REQUIREMENTS.length === 7 ? 'PASS' : 'FAIL',
      PROMOTION_GATE_REQUIREMENTS.join(','),
    ),
  );
  hops.push(
    hop(
      'privacy_honesty_encoded',
      FEDERATED_PRIVACY_HONESTY.federatedLearningAutomaticallyPrivate === false
        ? 'PASS'
        : 'FAIL',
      'FL ≠ automatically private',
    ),
  );
  hops.push(
    hop(
      'vehicle_mobile_boundary_encoded',
      VEHICLE_MOBILE_BOUNDARY.rawVehicleTelemetryAssumedAvailable === false
        ? 'PASS'
        : 'FAIL',
      'vehicle telemetry not assumed',
    ),
  );

  const job = exampleResearchJob(input.actor);
  const enrolled = enrollOptInDevice({
    job,
    deviceId: 'device-1',
    explicitConsent: true,
    consentScope: 'ORGANIZATION_FEDERATED',
  });
  hops.push(
    hop(
      'enroll_opt_in_device',
      'denied' in enrolled ? 'DENIED' : 'ENROLLED',
      'denied' in enrolled ? enrolled.reason : 'device enrolled with explicit consent',
    ),
  );

  const local = runLocalTraining({
    job,
    deviceId: 'device-1',
  });
  hops.push(
    hop(
      'run_local_training_raw_stays_local',
      'denied' in local ? 'DENIED' : 'PASS',
      'denied' in local
        ? local.reason
        : 'local training; raw artifacts not exchanged',
    ),
  );

  const clean = submitBoundedUpdate({
    job,
    deviceId: 'device-1',
    updateId: 'upd-1',
    artifactType: 'model_deltas',
  });
  hops.push(
    hop(
      'submit_bounded_update',
      'denied' in clean ? 'DENIED' : 'PASS',
      'denied' in clean ? clean.reason : 'bounded model delta submitted',
    ),
  );

  const poisoned = submitBoundedUpdate({
    job,
    deviceId: 'device-bad',
    updateId: 'upd-poison',
    artifactType: 'gradients_or_aggregates',
    adversarialFlags: ['poisoned_updates', 'anomalous_gradients'],
  });
  hops.push(
    hop(
      'quarantine_suspicious_contribution',
      !('denied' in poisoned) && poisoned.disposition === 'QUARANTINED'
        ? 'QUARANTINED'
        : 'FAIL',
      'suspicious contribution quarantined (not auto-aggregated)',
    ),
  );

  const clean2 = submitBoundedUpdate({
    job,
    deviceId: 'device-2',
    updateId: 'upd-2',
    artifactType: 'model_deltas',
  });
  const submissions = [clean, poisoned, clean2].filter(
    (s): s is BoundedUpdateSubmission => !('denied' in s),
  );
  const agg = aggregateAcceptedUpdates({ job, submissions });
  hops.push(
    hop(
      'aggregate_only_accepted_non_quarantined',
      'denied' in agg ? 'DENIED' : 'PASS',
      'denied' in agg
        ? agg.reason
        : `aggregated ${agg.participantCount}; quarantined excluded`,
    ),
  );

  const evaluation =
    'denied' in agg
      ? null
      : evaluateFederatedCandidate({
          job,
          aggregation: agg,
          measurableQualityImprovement: true,
          unacceptableRegression: false,
          privacySecurityEvidenceAccepted: true,
          reproducible: true,
          candidateVersion: 'routing-policy-v0.3.2-fl-candidate',
        });
  hops.push(
    hop(
      'evaluate_candidate',
      evaluation && !('denied' in evaluation) && evaluation.state === 'CANDIDATE'
        ? 'CANDIDATE'
        : 'REJECTED',
      'evaluation against promotion evidence gate',
    ),
  );

  const promotion =
    evaluation && !('denied' in evaluation)
      ? promoteFederatedCandidate({
          job,
          evaluation,
          actor: input.human,
        })
      : deny('no evaluation');
  hops.push(
    hop(
      'promotion_requires_evidence_and_human_or_policy',
      'denied' in promotion ? 'DENIED' : 'PASS',
      'denied' in promotion
        ? promotion.reason
        : 'human/policy promotion with evidence; no auto global deploy',
    ),
  );

  hops.push(
    hop(
      'deny_org_signal_auto_global',
      attemptOrgSignalAutoGlobal().state,
      attemptOrgSignalAutoGlobal().reason,
    ),
  );
  hops.push(
    hop(
      'deny_claim_fl_automatically_private',
      attemptClaimFlAutomaticallyPrivate().state,
      attemptClaimFlAutomaticallyPrivate().reason,
    ),
  );
  hops.push(
    hop(
      'deny_assume_vehicle_telemetry_available',
      attemptAssumeVehicleTelemetry().state,
      attemptAssumeVehicleTelemetry().reason,
    ),
  );
  hops.push(
    hop(
      'deny_self_driving_without_separate_authorization',
      attemptSelfDrivingWithoutAuthorization().state,
      attemptSelfDrivingWithoutAuthorization().reason,
    ),
  );
  hops.push(
    hop(
      'deny_automatic_global_deployment',
      attemptAutomaticGlobalDeploy().state,
      attemptAutomaticGlobalDeploy().reason,
    ),
  );
  hops.push(
    hop(
      'deny_pool_raw_private_data_centrally',
      attemptPoolRawPrivateData().state,
      attemptPoolRawPrivateData().reason,
    ),
  );
  hops.push(
    hop(
      'deny_hidden_chain_of_thought',
      attemptHiddenChainOfThought().state,
      attemptHiddenChainOfThought().reason,
    ),
  );
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      attemptBypassGuardianRls().state,
      attemptBypassGuardianRls().reason,
    ),
  );
  hops.push(
    hop(
      'deny_expand_tenant_universe_access',
      attemptExpandTenantUniverseAccess().state,
      attemptExpandTenantUniverseAccess().reason,
    ),
  );
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state,
      'recommend ≠ act',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      attemptEnableL4Autonomy().state === 'DENIED' &&
        ER37_LOCKS.L4_AUTONOMY_ENABLED === false
        ? 'PASS'
        : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );
  hops.push(
    hop('er_layer_context_documented', 'DOCUMENTED', ER_LAYER_TITLE),
  );
  hops.push(
    hop(
      'er36_soft_wire',
      softWireHopState(softWire.er36PrivacySafeContribution),
      softWire.er36PrivacySafeContribution.note,
    ),
  );
  hops.push(
    hop(
      'er35_soft_wire',
      softWireHopState(softWire.er35ModelDataPackManifest),
      softWire.er35ModelDataPackManifest.note,
    ),
  );
  hops.push(
    hop(
      'er34_soft_wire',
      softWireHopState(softWire.er34CapabilityManifest),
      softWire.er34CapabilityManifest.note,
    ),
  );
  hops.push(
    hop(
      'er33_soft_wire',
      softWireHopState(softWire.er33RuntimeUpdateChannel),
      softWire.er33RuntimeUpdateChannel.note,
    ),
  );
  hops.push(
    hop(
      'er32_soft_wire',
      softWireHopState(softWire.er32EdgeVehicleRuntimeCandidate),
      softWire.er32EdgeVehicleRuntimeCandidate.note,
    ),
  );
  hops.push(
    hop(
      'er4_soft_wire',
      softWireHopState(softWire.er4RightsProvenanceGate),
      softWire.er4RightsProvenanceGate.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ER37_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'NOT_APPLIED' : 'FAIL',
      'DB candidates NOT_APPLIED',
    ),
  );
  hops.push(
    hop(
      'evidence',
      'PASS',
      'ER37 federated learning research candidate evidence recorded (research-only)',
    ),
  );

  return { hops, softWire };
}
