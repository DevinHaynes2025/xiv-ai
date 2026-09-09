export const CAUSAL_WORLD_CYCLE = [
  'approved_story',
  'world_model_query',
  'evidence_retrieval',
  'competing_causal_hypotheses',
  'digital_twin_simulation',
  'agent_challenge_council',
  'evidence_check',
  'outcome_estimate',
  'human_gate',
  'observed_result',
  'calibration',
  'learning_ledger',
  'memory',
  'next_story',
] as const;

export type CausalWorldHop = (typeof CAUSAL_WORLD_CYCLE)[number];

export type EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

/** Visible epistemic class. Simulation/forecast must never be labeled VERIFIED_FACT. */
export type EpistemicClass = 'VERIFIED_FACT' | 'SIMULATION' | 'FORECAST' | 'HYPOTHESIS' | 'UNKNOWN';

export const DIGITAL_TWIN_KINDS = [
  'business',
  'supply_chain',
  'manufacturing',
  'cloud_compute',
  'infrastructure',
  'market_economic',
  'technology_adoption',
] as const;

export type DigitalTwinKind = (typeof DIGITAL_TWIN_KINDS)[number];

export const CAUSAL_WORLD_LOCKS = Object.freeze({
  l4AutonomyEnabled: false as const,
  autoProductionDeploy: false as const,
  productionDatabaseWrite: false as const,
  productionGitPush: false as const,
  autoPermissionExpansion: false as const,
  productionAuthorization: false as const,
  founderImpersonation: false as const,
  physicalDeviceControl: false as const,
  physicalSatelliteControl: false as const,
  tipLand: false as const,
  inventedPass: false as const,
  correlationEqualsCausation: false as const,
  simulationIsReality: false as const,
  forecastIsVerifiedFact: false as const,
  ceoSealedReplicating: false as const,
  claimsQuantumAdvantage: false as const,
});

export const CORRELATION_IS_NOT_CAUSATION =
  'Correlation is not causation. Competing mechanisms remain hypotheses until independently verified.';
