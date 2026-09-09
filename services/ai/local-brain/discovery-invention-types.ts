export const EVIDENCE_STATES = ['PASS', 'FAIL', 'UNAVAILABLE', 'WAITING_DATA', 'UNKNOWN', 'NOT_TESTED'] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const KNOWLEDGE_DISCOVERY_CYCLE = [
  'knowledge',
  'gap_detection',
  'pattern_mining',
  'cross_industry_connections',
  'hypotheses',
  'math_optimization',
  'experiments',
  'digital_twins',
  'skeptic_review',
  'replication',
  'evidence',
  'human_review',
  'learning',
] as const;

export type DiscoveryHop = (typeof KNOWLEDGE_DISCOVERY_CYCLE)[number];

/** Pattern ≠ causation. Hypothesis ≠ fact. Prototype ≠ validated invention. */
export type DiscoveryEpistemicClass =
  | 'VERIFIED_FACT'
  | 'PATTERN'
  | 'HYPOTHESIS'
  | 'PROTOTYPE'
  | 'TRUSTED_CANDIDATE'
  | 'SIMULATION'
  | 'FORECAST'
  | 'UNKNOWN';

export const DISCOVERY_HONESTY = Object.freeze({
  l4AutonomyEnabled: false as const,
  patternEqualsCausation: false as const,
  hypothesisEqualsFact: false as const,
  prototypeEqualsValidatedInvention: false as const,
  evidencePromotionAutoVerifiedFact: false as const,
  canInventPass: false as const,
  canInventCausation: false as const,
  canGrantPermissions: false as const,
  canDeployProduction: false as const,
  canSpendMoney: false as const,
  canMakeContracts: false as const,
  canControlPhysicalInfrastructure: false as const,
  founderImpersonation: false as const,
  ceoSealedCompartmentalized: true as const,
  ceoSealedReplicating: false as const,
  claimsQuantumAdvantage: false as const,
  quantumRequiresClassicalBaseline: true as const,
  providersUnavailableUntilVerified: true as const,
  tipLand: false as const,
  productionAuthorization: false as const,
  inventedDiscovery: false as const,
  guardianRlsWeaken: false as const,
  permissionExpansion: false as const,
  migrationsApplied: false as const,
});

export type ConsequentialAction =
  | 'invent_pass'
  | 'invent_causation'
  | 'grant_permission'
  | 'deploy_production'
  | 'spend_money'
  | 'make_contract'
  | 'control_physical_infrastructure'
  | 'impersonate_founder'
  | 'weaken_guardian_rls';

export const CONSEQUENTIAL_ACTIONS: readonly ConsequentialAction[] = [
  'invent_pass',
  'invent_causation',
  'grant_permission',
  'deploy_production',
  'spend_money',
  'make_contract',
  'control_physical_infrastructure',
  'impersonate_founder',
  'weaken_guardian_rls',
] as const;

export const PATTERN_IS_NOT_CAUSATION =
  'Pattern ≠ causation. Co-occurrence, analogy, and co-movement remain PATTERN until independently verified causal evidence exists.';

export const HYPOTHESIS_IS_NOT_FACT =
  'Hypothesis ≠ fact. A portfolio item is a competing explanation, not a verified world fact.';

export const PROTOTYPE_IS_NOT_INVENTION =
  'Prototype ≠ validated invention. Generated artifacts stay PROTOTYPE until human review and independent validation.';

export type DiscoveryStory = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  question: string;
  approved: boolean;
  domains?: string[];
  needsExternalFreshness?: boolean;
  seedSupplyNetwork?: boolean;
  consequence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  production?: boolean;
  humanReviewerId?: string;
  humanApprovedTrustedEntry?: boolean;
  failExperiment?: boolean;
};

export type DiscoveryHopRecord = {
  hop: DiscoveryHop;
  state: EvidenceState | 'DENIED';
  summary: string;
  epistemicClass: DiscoveryEpistemicClass;
  at: string;
};

export type ExperimentKind = 'software' | 'data' | 'simulation' | 'digital_twin';
