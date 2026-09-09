/**
 * 62L-AY — Growth Media Engine + Universal Onboarding + Offline Super Brain + Governed Data Refinery
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * L4_AUTONOMY_ENABLED=false. Unconfigured providers = UNAVAILABLE.
 * No consciousness/sentience claims. Correlation ≠ causation. Simulation ≠ verified fact.
 * Deny-by-default. Sealed non-replicating. Adult users only (18+).
 * Data refinery: authorized / public / licensed / customer-owned sources only.
 * "Database leakage" = defensive detection inside owned/authorized envs — never offensive theft.
 */

export const AY_PHASE = '62L-AY' as const;

export const L4_AUTONOMY_ENABLED = false as const;

export type AyEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED';

export type AyJobState =
  | 'queued'
  | 'running'
  | 'completed'
  | 'denied'
  | 'waiting_data'
  | 'unavailable'
  | 'failed';

export type EpistemicClass = 'VERIFIED_FACT' | 'SIMULATION' | 'FORECAST' | 'HYPOTHESIS' | 'UNKNOWN';

/** Full AY operating cycle across onboarding → packages → media → refinery → super brain → human gate. */
export const AY_OPERATING_CYCLE = [
  'channel_admit',
  'age_gate',
  'identity_adapter',
  'enterprise_seal',
  'onboarding_persist',
  'package_select',
  'entitlement_label',
  'package_council',
  'media_prepare',
  'media_review_gate',
  'source_authorize',
  'provenance_license',
  'ingest_classify',
  'warehouse_dedup',
  'pattern_hypothesis',
  'quant_evidence',
  'bi_recommend',
  'super_brain_checkpoint',
  'human_decision',
  'measured_learning',
] as const;

export type AyHop = (typeof AY_OPERATING_CYCLE)[number];

export type AyHopRecord = {
  hop: AyHop;
  state: AyEvidenceState;
  summary: string;
  at: string;
};

export const AY_HONESTY = Object.freeze({
  documentedIsNotImplemented: true as const,
  implementedIsNotVerified: true as const,
  verifiedIsNotProductionAuthorized: true as const,
  l4AutonomyEnabled: false as const,
  L4_AUTONOMY_ENABLED: false as const,
  agentsPlanRecommendOnly: true as const,
  humansOwnConsequentialDecisions: true as const,
  ceoSealedCompartmentalized: true as const,
  sealedNonReplicating: true as const,
  denyByDefault: true as const,
  founderImpersonation: false as const,
  tipLand: false as const,
  inventedPass: false as const,
  unconfiguredProvidersUnavailable: true as const,
  adultUsersOnly: true as const,
  minimumAgeYears: 18 as const,
  labelAloneIsNotAccess: true as const,
  packageDoesNotGrantAutonomy: true as const,
  recommendationIsNotChargeOrDeploy: true as const,
  noAutoPublishWithoutHumanGate: true as const,
  correlationIsNotCausation: true as const,
  simulationIsNotVerifiedFact: true as const,
  noConsciousnessClaims: true as const,
  noSentienceClaims: true as const,
  refineryAuthorizedSourcesOnly: true as const,
  leakageDetectionIsDefensiveOnly: true as const,
  offensiveTheftForbidden: true as const,
  stolenCredentialsForbidden: true as const,
  leakedDbMiningForbidden: true as const,
  guardianRlsWeaken: false as const,
  permissionExpansion: false as const,
  productionDatabaseWrite: false as const,
  migrationsApplied: false as const,
  partnershipsInvented: false as const,
  certificationsInvented: false as const,
  governmentCertificationClaimed: false as const,
  leakageIsNotSpyware: true as const,
  clipboardMonitor: false as const,
  keylogger: false as const,
  modelsCloudsReplaceable: true as const,
});

export const AGE_GATE_DENIED = 'UNDER_18_DENIED';
export const ENTERPRISE_SEAL_REQUIRED = 'ENTERPRISE_JOIN_REQUIRES_SEAL';
export const LABEL_IS_NOT_ACCESS = 'ENTITLEMENT_LABEL_ALONE_IS_NOT_ACCESS';
export const PACKAGE_NO_AUTONOMY = 'PACKAGE_DOES_NOT_GRANT_AUTONOMY';
export const MEDIA_NO_AUTO_PUBLISH = 'NO_AUTO_PUBLISH_WITHOUT_HUMAN_DECISION_GATE';
export const UNAUTHORIZED_SOURCE_REJECTED = 'UNAUTHORIZED_OR_LEAKAGE_SOURCE_REJECTED';
export const DEFENSIVE_LEAKAGE_ONLY = 'DEFENSIVE_LEAKAGE_DETECTION_ONLY_NOT_OFFENSIVE';
export const NOT_CONSCIOUS = 'OFFLINE_SUPER_BRAIN_IS_NOT_CONSCIOUS_OR_SENTIENT';
export const CORRELATION_NOT_CAUSATION = 'CORRELATION_IS_NOT_CAUSATION';
export const SIM_NOT_FACT = 'SIMULATION_IS_NOT_VERIFIED_FACT';
export const COUNCIL_RECOMMENDATION_ONLY = 'PACKAGE_COUNCIL_RECOMMENDATION_IS_NOT_CHARGE_OR_DEPLOY';
export const OFFENSIVE_LEAK_HARVEST_DENIED = 'OFFENSIVE_LEAK_HARVEST_DENIED_DEFENSIVE_ONLY';
export const SEALED_COMPARTMENT_NON_LEAK = 'SEALED_COMPARTMENT_HONORED_NON_REPLICATING';
export const SPYWARE_CAPABILITY_DENIED = 'LEAKAGE_DEFENSE_IS_NOT_SPYWARE_KEYLOGGER_OR_CLIPBOARD_MONITOR';
export const CERTIFICATION_NOT_CLAIMED = 'GOVERNMENT_CERTIFICATION_NOT_CLAIMED';

export const NEXT_PHASE_TITLE =
  '62L-AZ — XIV Global Data Refinery + Autonomous Knowledge Supply Chain + Multi-Brain Intelligence Compiler + Founder Media Command Center';

export const REFINERY_STAGES = [
  'authorized_source',
  'provenance_license_check',
  'ingestion',
  'classification',
  'warehouse_lakehouse',
  'dedup_contradiction',
  'pattern_gap_mining',
  'hypothesis',
  'quant_scientific_testing',
  'evidence',
  'business_intelligence',
  'human_decision',
  'learning',
] as const;

export type RefineryStage = (typeof REFINERY_STAGES)[number];

export const ONBOARDING_CHANNELS = [
  'email',
  'invite',
  'phone',
  'desktop',
  'enterprise',
] as const;

export type OnboardingChannel = (typeof ONBOARDING_CHANNELS)[number];

export const PACKAGE_TIERS = [
  'basic',
  'pro',
  'elite',
  'enterprise',
  'government',
  'builder',
] as const;

export type PackageTier = (typeof PACKAGE_TIERS)[number];

export const SUPER_BRAIN_METRICS = [
  'evidence_quality',
  'reasoning',
  'planning',
  'creativity',
  'calibration',
  'reliability',
  'efficiency',
] as const;

export type SuperBrainMetric = (typeof SUPER_BRAIN_METRICS)[number];

export class AySimulatedCrash extends Error {
  constructor(public readonly hop: AyHop) {
    super(`AY_SIMULATED_CRASH:${hop}`);
    this.name = 'AySimulatedCrash';
  }
}
