/**
 * 62L-ER37 — Federated Learning Research Candidate (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion +
 * Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device
 * Distribution (GitHub #162).
 *
 * Federated-learning research layer so opted-in devices can help improve models
 * or routing policies without centrally pooling raw private data.
 *
 * Core flow:
 * Local approved data → on-device training/evaluation → bounded update →
 * privacy/security checks → aggregation → evaluation → candidate model/policy →
 * human/policy promotion
 *
 * Soft-wire when PRESENT: ER36 privacy-safe contribution/consent, ER35 model/
 * data pack manifests, ER34 capability manifests, ER33 update channels,
 * ER32 vehicle deny locks, ER4 rights. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Federated learning ≠ automatically private.
 * No automatic global deployment. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER38 — CFO / COO Monetization Council.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER37' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER37 Federated Learning Research Candidate — local approved data → bounded updates; FL≠auto-private; org≠auto-global; suspicious→QUARANTINED; promotion evidence+human/policy; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER37_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER38 — CFO / COO Monetization Council — governed monetization council for research candidates without automatic commercial deployment or L4 autonomy.' as const;

/**
 * Required federated-learning job tracking fields.
 */
export const FEDERATED_LEARNING_JOB_FIELDS = [
  'campaignId',
  'modelOrPolicyVersion',
  'participatingDeviceClass',
  'consentScope',
  'tenantUniverse',
  'approvedDataClass',
  'localTrainingObjective',
  'localEpochsOrSteps',
  'updateType',
  'aggregationMethod',
  'minimumParticipantCount',
  'privacyControls',
  'poisoningAnomalyChecks',
  'evaluationDataset',
  'rollbackVersion',
  'promotionState',
] as const;

export type FederatedLearningJobField =
  (typeof FEDERATED_LEARNING_JOB_FIELDS)[number];

/**
 * Required federated job lifecycle states.
 */
export const FEDERATED_LEARNING_JOB_STATES = [
  'RESEARCH_ONLY',
  'OPT_IN_PENDING',
  'ENROLLED',
  'LOCAL_TRAINING',
  'UPDATE_SUBMITTED',
  'AGGREGATED',
  'EVALUATED',
  'CANDIDATE',
  'REJECTED',
  'REVOKED',
] as const;

export type FederatedLearningJobState =
  (typeof FEDERATED_LEARNING_JOB_STATES)[number];

/**
 * Contribution disposition for adversarial / suspicious updates.
 * QUARANTINED is not an auto-aggregation path.
 */
export const CONTRIBUTION_DISPOSITIONS = [
  'ACCEPTED_FOR_AGGREGATION',
  'QUARANTINED',
  'REJECTED',
] as const;

export type ContributionDisposition =
  (typeof CONTRIBUTION_DISPOSITIONS)[number];

/**
 * Tenant isolation scopes — org private signal cannot auto-influence global.
 */
export const FEDERATED_TENANT_SCOPES = [
  'DEVICE_ONLY',
  'ORGANIZATION_FEDERATED',
  'GLOBAL_OPT_IN_RESEARCH',
] as const;

export type FederatedTenantScope =
  (typeof FEDERATED_TENANT_SCOPES)[number];

/**
 * Bounded artifacts XIV may exchange (not raw source documents/routes/images/telemetry).
 */
export const ALLOWED_BOUNDED_ARTIFACTS = [
  'model_deltas',
  'gradients_or_aggregates',
  'evaluation_metrics',
  'benchmark_summaries',
] as const;

export type AllowedBoundedArtifact =
  (typeof ALLOWED_BOUNDED_ARTIFACTS)[number];

/**
 * Raw source classes that stay local when federated design allows.
 */
export const RAW_SOURCE_STAYS_LOCAL = [
  'original_documents',
  'routes',
  'images',
  'telemetry',
  'gps',
  'camera',
  'driver_signals',
  'vehicle_telemetry',
] as const;

export type RawSourceStaysLocal = (typeof RAW_SOURCE_STAYS_LOCAL)[number];

/**
 * Adversarial / integrity checks before aggregation.
 */
export const ADVERSARIAL_PROTECTION_CHECKS = [
  'poisoned_updates',
  'anomalous_gradients',
  'sybil_like_abuse',
  'model_inversion_leakage_risk',
  'extreme_outlier_updates',
  'corrupted_clients',
  'stale_model_versions',
] as const;

export type AdversarialProtectionCheck =
  (typeof ADVERSARIAL_PROTECTION_CHECKS)[number];

/**
 * Promotion gate evidence requirements — no automatic global deployment.
 */
export const PROMOTION_GATE_REQUIREMENTS = [
  'measurable_quality_improvement',
  'no_unacceptable_regression',
  'acceptable_privacy_security_evidence',
  'reproducibility',
  'rollback_capability',
  'appropriate_consent_rights',
  'human_or_policy_promotion',
] as const;

export type PromotionGateRequirement =
  (typeof PROMOTION_GATE_REQUIREMENTS)[number];

/**
 * Core federated research flow hops.
 */
export const FEDERATED_LEARNING_CORE_FLOW = [
  'local_approved_data',
  'on_device_training_or_evaluation',
  'bounded_update',
  'privacy_security_checks',
  'aggregation',
  'evaluation',
  'candidate_model_or_policy',
  'human_or_policy_promotion',
] as const;

export type FederatedLearningCoreFlowHop =
  (typeof FEDERATED_LEARNING_CORE_FLOW)[number];

/**
 * Privacy honesty: federated design does not automatically make training private.
 */
export const FEDERATED_PRIVACY_HONESTY = Object.freeze({
  federatedLearningAutomaticallyPrivate: false as const,
  rawSourceDataStaysLocalWhenDesignAllows: true as const,
  mayExchangeBoundedArtifactsOnly: true as const,
  stillRequiresThreatReview: true as const,
  stillRequiresSecureAggregationWhereApplicable: true as const,
  stillRequiresLeakageTesting: true as const,
  stillRequiresExplicitConsent: true as const,
  mayClaimFlIsAutomaticallyPrivate: false as const,
});

/**
 * Vehicle / mobile boundary — mobility learning is future explicit opt-in.
 */
export const VEHICLE_MOBILE_BOUNDARY = Object.freeze({
  mobilityLearningRequiresExplicitOptIn: true as const,
  rawGpsAssumedAvailable: false as const,
  rawCameraAssumedAvailable: false as const,
  rawDriverSignalsAssumedAvailable: false as const,
  rawVehicleTelemetryAssumedAvailable: false as const,
  selfDrivingRemainsSimulationOrResearchUnlessSeparatelyAuthorized: true as const,
  safetyValidationRequiredForSelfDrivingApplications: true as const,
});

/**
 * Tenant isolation honesty.
 */
export const TENANT_ISOLATION_BOUNDARY = Object.freeze({
  orgPrivateTrainingSignalAutoInfluencesGlobal: false as const,
  deviceOnlyCannotBleedToOrgWithoutConsent: true as const,
  organizationFederatedCannotAutoPromoteToGlobal: true as const,
  globalRequiresExplicitGlobalOptInResearch: true as const,
});

/**
 * Promotion honesty.
 */
export const PROMOTION_BOUNDARY = Object.freeze({
  automaticGlobalDeployment: false as const,
  requiresMeasurableQualityImprovement: true as const,
  requiresNoUnacceptableRegression: true as const,
  requiresPrivacySecurityEvidence: true as const,
  requiresReproducibility: true as const,
  requiresRollbackCapability: true as const,
  requiresAppropriateConsentRights: true as const,
  requiresHumanOrPolicyPromotion: true as const,
});

export const FEDERATED_LEARNING_RESEARCH_CANDIDATE_CYCLE = [
  'honesty_locks',
  'federated_learning_research_candidate_bootstrap',
  // A — Structure
  'job_fields_encoded',
  'job_states_encoded',
  'tenant_scopes_encoded',
  'core_flow_encoded',
  'bounded_artifacts_encoded',
  'raw_source_stays_local_encoded',
  'adversarial_checks_encoded',
  'promotion_gate_encoded',
  'privacy_honesty_encoded',
  'vehicle_mobile_boundary_encoded',
  // B — Flow
  'enroll_opt_in_device',
  'run_local_training_raw_stays_local',
  'submit_bounded_update',
  'quarantine_suspicious_contribution',
  'aggregate_only_accepted_non_quarantined',
  'evaluate_candidate',
  'promotion_requires_evidence_and_human_or_policy',
  'deny_org_signal_auto_global',
  'deny_claim_fl_automatically_private',
  // C — Vehicle / governance denies
  'deny_assume_vehicle_telemetry_available',
  'deny_self_driving_without_separate_authorization',
  'deny_automatic_global_deployment',
  'deny_pool_raw_private_data_centrally',
  'deny_hidden_chain_of_thought',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
  'er36_soft_wire',
  'er35_soft_wire',
  'er34_soft_wire',
  'er33_soft_wire',
  'er32_soft_wire',
  'er4_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er37Hop =
  (typeof FEDERATED_LEARNING_RESEARCH_CANDIDATE_CYCLE)[number];

export type Er37EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'QUARANTINED'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'ENROLLED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'STALE'
  | 'UNKNOWN'
  | 'REVOKED'
  | 'RESEARCH_ONLY';

export type Er37HopRecord = {
  hop: Er37Hop;
  state: Er37EvidenceState;
  summary: string;
  at: string;
};

export type Er37ActorKind =
  | 'federated_learning_coordinator'
  | 'opted_in_device'
  | 'aggregator'
  | 'privacy_security_reviewer'
  | 'evaluation_runner'
  | 'proposal'
  | 'human_approver'
  | 'policy_promoter'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er37Actor = {
  kind: Er37ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER37_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_FEDERATED_LEARNING_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Privacy honesty
  FEDERATED_LEARNING_AUTOMATICALLY_PRIVATE: false as const,
  MAY_CLAIM_FL_AUTOMATICALLY_PRIVATE: false as const,
  POOL_RAW_PRIVATE_DATA_CENTRALLY: false as const,
  EXCHANGE_RAW_DOCUMENTS_ROUTES_IMAGES_TELEMETRY: false as const,

  // Tenant isolation
  ORG_PRIVATE_SIGNAL_AUTO_INFLUENCES_GLOBAL: false as const,
  DEVICE_ONLY_BLEEDS_TO_ORG_WITHOUT_CONSENT: false as const,
  ORGANIZATION_FEDERATED_AUTO_PROMOTES_TO_GLOBAL: false as const,

  // Adversarial
  AGGREGATE_QUARANTINED_UPDATES_AUTOMATICALLY: false as const,
  SKIP_POISONING_ANOMALY_CHECKS: false as const,

  // Vehicle / mobile
  ASSUME_RAW_GPS_AVAILABLE: false as const,
  ASSUME_RAW_CAMERA_AVAILABLE: false as const,
  ASSUME_RAW_DRIVER_SIGNALS_AVAILABLE: false as const,
  ASSUME_RAW_VEHICLE_TELEMETRY_AVAILABLE: false as const,
  SELF_DRIVING_WITHOUT_SEPARATE_AUTHORIZATION: false as const,
  MOBILITY_LEARNING_WITHOUT_EXPLICIT_OPT_IN: false as const,

  // Promotion
  AUTOMATIC_GLOBAL_DEPLOYMENT: false as const,
  PROMOTE_WITHOUT_QUALITY_EVIDENCE: false as const,
  PROMOTE_WITHOUT_PRIVACY_SECURITY_EVIDENCE: false as const,
  PROMOTE_WITHOUT_REPRODUCIBILITY: false as const,
  PROMOTE_WITHOUT_ROLLBACK: false as const,
  PROMOTE_WITHOUT_CONSENT_RIGHTS: false as const,
  PROMOTE_WITHOUT_HUMAN_OR_POLICY: false as const,

  // Governance
  HIDDEN_CHAIN_OF_THOUGHT_IN_ER37: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  RAW_SOURCE_STAYS_LOCAL_WHEN_DESIGN_ALLOWS: true as const,
});

export const ER37_AGENT_BOUNDS = Object.freeze({
  mayRunResearchOnlyFederatedCampaigns: true as const,
  mayEnrollExplicitOptInDevices: true as const,
  mayTrainLocallyOnApprovedDataClasses: true as const,
  mayExchangeBoundedArtifactsOnly: true as const,
  mayQuarantineSuspiciousUpdates: true as const,
  mayAggregateAcceptedNonQuarantinedUpdates: true as const,
  mayEvaluateCandidates: true as const,
  mayRecommendPromotionWithEvidence: true as const,
  mayClaimFlAutomaticallyPrivate: false as const,
  mayPoolRawPrivateDataCentrally: false as const,
  mayLetOrgSignalAutoInfluenceGlobal: false as const,
  mayAggregateQuarantinedAutomatically: false as const,
  mayAssumeVehicleTelemetryAvailable: false as const,
  mayAutoDeployGlobally: false as const,
  mayPromoteWithoutHumanOrPolicy: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ER37_MAY = Object.freeze([
  'run_research_only_federated_learning_campaigns_with_explicit_opt_in',
  'keep_raw_approved_data_local_and_exchange_bounded_updates_only',
  'apply_privacy_security_poisoning_and_anomaly_checks_before_aggregation',
  'quarantine_suspicious_contributions_instead_of_auto_aggregating',
  'isolate_DEVICE_ONLY_ORGANIZATION_FEDERATED_and_GLOBAL_OPT_IN_RESEARCH_scopes',
  'promote_candidates_only_with_quality_privacy_reproducibility_rollback_consent_and_human_or_policy',
] as const);

export const ER37_MUST_NOT = Object.freeze([
  'claim_federated_learning_is_automatically_private',
  'centrally_pool_raw_private_documents_routes_images_or_telemetry',
  'let_organization_private_training_signal_automatically_influence_global_models',
  'aggregate_QUARANTINED_or_suspicious_updates_automatically',
  'assume_raw_gps_camera_driver_or_vehicle_telemetry_is_available',
  'treat_self_driving_as_authorized_without_separate_safety_validation',
  'automatically_deploy_federated_candidates_globally',
  'promote_without_evidence_and_human_or_policy_gate',
  'store_hidden_chain_of_thought',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
  'enable_l4_autonomy',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er37SoftWireSnapshot = {
  er36PrivacySafeContribution: SoftWirePresence;
  er36Report: SoftWirePresence;
  er35ModelDataPackManifest: SoftWirePresence;
  er35Report: SoftWirePresence;
  er34CapabilityManifest: SoftWirePresence;
  er34Report: SoftWirePresence;
  er33RuntimeUpdateChannel: SoftWirePresence;
  er33Report: SoftWirePresence;
  er32EdgeVehicleRuntimeCandidate: SoftWirePresence;
  er32Report: SoftWirePresence;
  er4RightsProvenanceGate: SoftWirePresence;
  er4Report: SoftWirePresence;
};

export function assertEr37LocksIntact(): boolean {
  return (
    ER37_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER37_LOCKS.FEDERATED_LEARNING_AUTOMATICALLY_PRIVATE === false &&
    ER37_LOCKS.MAY_CLAIM_FL_AUTOMATICALLY_PRIVATE === false &&
    ER37_LOCKS.POOL_RAW_PRIVATE_DATA_CENTRALLY === false &&
    ER37_LOCKS.EXCHANGE_RAW_DOCUMENTS_ROUTES_IMAGES_TELEMETRY === false &&
    ER37_LOCKS.ORG_PRIVATE_SIGNAL_AUTO_INFLUENCES_GLOBAL === false &&
    ER37_LOCKS.DEVICE_ONLY_BLEEDS_TO_ORG_WITHOUT_CONSENT === false &&
    ER37_LOCKS.ORGANIZATION_FEDERATED_AUTO_PROMOTES_TO_GLOBAL === false &&
    ER37_LOCKS.AGGREGATE_QUARANTINED_UPDATES_AUTOMATICALLY === false &&
    ER37_LOCKS.SKIP_POISONING_ANOMALY_CHECKS === false &&
    ER37_LOCKS.ASSUME_RAW_GPS_AVAILABLE === false &&
    ER37_LOCKS.ASSUME_RAW_CAMERA_AVAILABLE === false &&
    ER37_LOCKS.ASSUME_RAW_DRIVER_SIGNALS_AVAILABLE === false &&
    ER37_LOCKS.ASSUME_RAW_VEHICLE_TELEMETRY_AVAILABLE === false &&
    ER37_LOCKS.SELF_DRIVING_WITHOUT_SEPARATE_AUTHORIZATION === false &&
    ER37_LOCKS.MOBILITY_LEARNING_WITHOUT_EXPLICIT_OPT_IN === false &&
    ER37_LOCKS.AUTOMATIC_GLOBAL_DEPLOYMENT === false &&
    ER37_LOCKS.PROMOTE_WITHOUT_QUALITY_EVIDENCE === false &&
    ER37_LOCKS.PROMOTE_WITHOUT_PRIVACY_SECURITY_EVIDENCE === false &&
    ER37_LOCKS.PROMOTE_WITHOUT_REPRODUCIBILITY === false &&
    ER37_LOCKS.PROMOTE_WITHOUT_ROLLBACK === false &&
    ER37_LOCKS.PROMOTE_WITHOUT_CONSENT_RIGHTS === false &&
    ER37_LOCKS.PROMOTE_WITHOUT_HUMAN_OR_POLICY === false &&
    ER37_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_ER37 === false &&
    ER37_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER37_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER37_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER37_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER37_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER37_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER37_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER37_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER37_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER37_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER37_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER37_LOCKS.RAW_SOURCE_STAYS_LOCAL_WHEN_DESIGN_ALLOWS === true &&
    ER37_LOCKS.TIP_LAND === false &&
    ER37_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER37_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER37_LOCKS.FULL_PRODUCTION_FEDERATED_LEARNING_SHIPPED === false &&
    ER37_LOCKS.MANAGE_PULL_REQUEST === false &&
    FEDERATED_PRIVACY_HONESTY.federatedLearningAutomaticallyPrivate === false &&
    FEDERATED_PRIVACY_HONESTY.mayClaimFlIsAutomaticallyPrivate === false &&
    TENANT_ISOLATION_BOUNDARY.orgPrivateTrainingSignalAutoInfluencesGlobal ===
      false &&
    PROMOTION_BOUNDARY.automaticGlobalDeployment === false &&
    PROMOTION_BOUNDARY.requiresHumanOrPolicyPromotion === true &&
    VEHICLE_MOBILE_BOUNDARY.rawVehicleTelemetryAssumedAvailable === false &&
    ER37_AGENT_BOUNDS.automaticAuthority === false &&
    ER37_AGENT_BOUNDS.mayClaimFlAutomaticallyPrivate === false &&
    ER37_AGENT_BOUNDS.mayAutoDeployGlobally === false
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

export function er37SoftWireSnapshot(repoRoot?: string): Er37SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er36PrivacySafeContribution: softWireFile(
      './privacy-safe-contribution-types.ts',
      'ER36 Privacy-Safe Contribution PRESENT (soft-wire).',
      'ER36 Privacy-Safe Contribution absent — soft-wire WAITING_DATA.',
    ),
    er36Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER36_PRIVACY_SAFE_CONTRIBUTION_REPORT.md',
      'ER36 report PRESENT (soft-wire).',
      'ER36 report absent — soft-wire WAITING_DATA.',
    ),
    er35ModelDataPackManifest: softWireFile(
      './model-data-pack-manifest-types.ts',
      'ER35 Model / Data Pack Manifest PRESENT (soft-wire).',
      'ER35 Model / Data Pack Manifest absent — soft-wire WAITING_DATA.',
    ),
    er35Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER35_MODEL_DATA_PACK_MANIFEST_REPORT.md',
      'ER35 report PRESENT (soft-wire).',
      'ER35 report absent — soft-wire WAITING_DATA.',
    ),
    er34CapabilityManifest: softWireFile(
      './capability-manifest-types.ts',
      'ER34 Capability Manifest PRESENT (soft-wire).',
      'ER34 Capability Manifest absent — soft-wire WAITING_DATA.',
    ),
    er34Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER34_CAPABILITY_MANIFEST_REPORT.md',
      'ER34 report PRESENT (soft-wire).',
      'ER34 report absent — soft-wire WAITING_DATA.',
    ),
    er33RuntimeUpdateChannel: softWireFile(
      './runtime-update-channel-types.ts',
      'ER33 Runtime Update Channel PRESENT (soft-wire).',
      'ER33 Runtime Update Channel absent — soft-wire WAITING_DATA.',
    ),
    er33Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER33_RUNTIME_UPDATE_CHANNEL_REPORT.md',
      'ER33 report PRESENT (soft-wire).',
      'ER33 report absent — soft-wire WAITING_DATA.',
    ),
    er32EdgeVehicleRuntimeCandidate: softWireFile(
      './edge-vehicle-runtime-candidate-types.ts',
      'ER32 Edge / Vehicle Runtime Candidate PRESENT (soft-wire).',
      'ER32 Edge / Vehicle Runtime Candidate absent — soft-wire WAITING_DATA.',
    ),
    er32Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER32_EDGE_VEHICLE_RUNTIME_CANDIDATE_REPORT.md',
      'ER32 report PRESENT (soft-wire).',
      'ER32 report absent — soft-wire WAITING_DATA.',
    ),
    er4RightsProvenanceGate: softWireFile(
      './rights-provenance-gate-types.ts',
      'ER4 Rights & Provenance Gate PRESENT (soft-wire).',
      'ER4 Rights & Provenance Gate absent — soft-wire WAITING_DATA.',
    ),
    er4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER4_RIGHTS_PROVENANCE_GATE_REPORT.md',
      'ER4 report PRESENT (soft-wire).',
      'ER4 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(
  presence: SoftWirePresence,
): 'PASS' | 'WAITING_DATA' {
  return presence.present ? 'PASS' : 'WAITING_DATA';
}

export function isEr37Agent(actor: Er37Actor): boolean {
  return (
    actor.kind === 'federated_learning_coordinator' ||
    actor.kind === 'opted_in_device' ||
    actor.kind === 'aggregator' ||
    actor.kind === 'privacy_security_reviewer' ||
    actor.kind === 'evaluation_runner' ||
    actor.kind === 'proposal' ||
    actor.kind === 'home_base'
  );
}

export function isHumanOrPolicyPromoter(actor: Er37Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'policy_promoter' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.permissions.includes('approve_consequential') ||
    actor.permissions.includes('promote_candidate')
  );
}

export function orgScopeMayAutoInfluenceGlobal(
  scope: FederatedTenantScope,
): boolean {
  void scope;
  return TENANT_ISOLATION_BOUNDARY.orgPrivateTrainingSignalAutoInfluencesGlobal;
}

export function federatedLearningIsAutomaticallyPrivate(): boolean {
  return FEDERATED_PRIVACY_HONESTY.federatedLearningAutomaticallyPrivate;
}
