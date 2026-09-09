export const EVIDENCE_STATES = ['PASS', 'FAIL', 'UNAVAILABLE', 'WAITING_DATA', 'UNKNOWN', 'NOT_TESTED'] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const AUTONOMOUS_RD_CYCLE = [
  'knowledge_gap',
  'research_director',
  'prior_evidence',
  'competing_hypotheses',
  'experiment_candidates',
  'risk_value_ranking',
  'offline_experiment',
  'measurement',
  'independent_replication',
  'skeptic_review',
  'evidence_promotion',
  'world_model',
  'learning',
  'next_experiment',
] as const;

export type AutonomousRdStep = (typeof AUTONOMOUS_RD_CYCLE)[number];

export const RESEARCH_HONESTY = {
  l4AutonomyEnabled: false as const,
  claimsConsciousness: false as const,
  canFabricateFounderApproval: false as const,
  founderImpersonation: false as const,
  productionAuthorization: false as const,
  tradingAuthorized: false as const,
  canGrantPermissions: false as const,
  canDeployProduction: false as const,
  canSpendMoney: false as const,
  canMakeContracts: false as const,
  canExecuteTrades: false as const,
  canControlPhysicalInfrastructure: false as const,
  correlationEqualsCausation: false as const,
  simulationIsVerifiedFact: false as const,
  claimsQuantumAdvantage: false as const,
  ceoSealedReplicatesByDefault: false as const,
  inventedPass: false as const,
  inventedDiscovery: false as const,
  tipLand: false as const,
};

export type ExperimentKind = 'software' | 'data' | 'simulation';

export type ConsequentialAction =
  | 'grant_permission'
  | 'deploy_production'
  | 'spend_money'
  | 'make_contract'
  | 'execute_trade'
  | 'control_physical_infrastructure'
  | 'weaken_guardian_rls'
  | 'impersonate_founder';

export type KnowledgeGap = {
  id: string;
  tenantId: string;
  universeId: string;
  question: string;
  unknownCount: number;
  evidenceRefs: string[];
  state: EvidenceState;
  inventedFacts: false;
};

export type ResearchHypothesis = {
  id: string;
  tenantId: string;
  universeId: string;
  gapId: string;
  statement: string;
  role: 'primary' | 'challenge' | 'null';
  competingWith: string[];
  evidenceRefs: string[];
  inventedFacts: false;
};

export type ExperimentCandidate = {
  id: string;
  tenantId: string;
  universeId: string;
  gapId: string;
  hypothesisId: string;
  kind: ExperimentKind;
  title: string;
  conditions: Record<string, string>;
  fingerprint: string;
  valueScore: number;
  riskScore: number;
  eligible: boolean;
  blockedByDeadEnd: boolean;
  denialReason?: string;
};
