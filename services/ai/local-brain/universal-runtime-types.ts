export const UNIVERSAL_RUNTIME_CYCLE = [
  'device_profile',
  'hardware_verify',
  'capability_gate',
  'algorithm_select',
  'data_fabric_select',
  'cost_model',
  'package_design',
  'bundle_select',
  'pricing_scenario',
  'margin_break_even',
  'sensitivity',
  'human_approval',
  'outcome',
  'learning',
] as const;

export type AvHop = (typeof UNIVERSAL_RUNTIME_CYCLE)[number];

export type AvEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED';

export type AvJobState =
  | 'queued'
  | 'running'
  | 'completed'
  | 'denied'
  | 'waiting_data'
  | 'unavailable'
  | 'failed';

export type EpistemicClass = 'VERIFIED_FACT' | 'SIMULATION' | 'FORECAST' | 'HYPOTHESIS' | 'UNKNOWN';

export const AV_HONESTY = Object.freeze({
  l4AutonomyEnabled: false as const,
  agentsPlanRecommendOnly: true as const,
  humansOwnConsequentialDecisions: true as const,
  ceoSealedCompartmentalized: true as const,
  founderImpersonation: false as const,
  tipLand: false as const,
  inventedPass: false as const,
  inventedAvailableHardware: false as const,
  inventedOptimality: false as const,
  cfoMayChargeCustomers: false as const,
  cfoMayMutateBilling: false as const,
  recommendationIsNotCharge: true as const,
  vehicleControlAuthorized: false as const,
  physicalVehicleActuation: false as const,
  guardianRlsWeaken: false as const,
  permissionExpansion: false as const,
  productionDatabaseWrite: false as const,
  migrationsApplied: false as const,
  unconfiguredProvidersUnavailable: true as const,
  partnershipsInvented: false as const,
});

export type AvHopRecord = {
  hop: AvHop;
  state: AvEvidenceState;
  summary: string;
  at: string;
};

export class AvSimulatedCrash extends Error {
  constructor(public readonly hop: AvHop) {
    super(`AV_SIMULATED_CRASH:${hop}`);
    this.name = 'AvSimulatedCrash';
  }
}

export const VEHICLE_CONTROL_DENIED = 'VEHICLE_CONTROL_DENIED';
export const HARDWARE_UNAVAILABLE_UNTIL_VERIFIED = 'HARDWARE_UNAVAILABLE_UNTIL_VERIFIED';
export const CFO_RECOMMENDATION_IS_NOT_CHARGE = 'CFO_RECOMMENDATION_IS_NOT_CHARGE_OR_BILLING_MUTATION';
export const ALGORITHM_NO_INVENTED_OPTIMALITY = 'ALGORITHM_SELECTION_DOES_NOT_INVENT_OPTIMALITY';
export const ENGINE_UNAVAILABLE_UNTIL_VERIFIED = 'STORAGE_ENGINE_UNAVAILABLE_UNTIL_VERIFIED';

export const NEXT_PHASE_TITLE =
  '62L-AW — XIV Universal Application Runtime + Adaptive Device Compiler + Distributed Database Mesh + Algorithm Auto-Selection Engine';
