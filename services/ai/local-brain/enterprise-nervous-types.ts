export const ENTERPRISE_NERVOUS_CYCLE = [
  'event',
  'policy',
  'language_culture',
  'historical_evidence',
  'reasoning',
  'math_quant',
  'agent_council',
  'security_data_sentinel',
  'highway_optimization',
  'human_gate',
  'outcome',
  'evaluation',
  'learning',
  'memory',
] as const;

export type EnsHop = (typeof ENTERPRISE_NERVOUS_CYCLE)[number];

export type EnsEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export const ENTERPRISE_NERVOUS_LOCKS = {
  L4_AUTONOMY_ENABLED: false,
  AUTO_PRODUCTION_DEPLOY: false,
  PRODUCTION_DATABASE_WRITE: false,
  PRODUCTION_GIT_PUSH: false,
  AUTO_PERMISSION_EXPANSION: false,
  PRODUCTION_AUTHORIZATION: false,
  FOUNDER_IMPERSONATION: false,
  TIP_LAND: false,
  INVENT_PASS: false,
  LITERAL_AGENT_FEELINGS: false,
  UNSUPPORTED_PSYCHOLOGICAL_CONCLUSIONS: false,
  CULTURAL_DETERMINISM_ABOUT_INDIVIDUALS: false,
  SENTINEL_IS_SPYWARE: false,
  COVERT_SURVEILLANCE: false,
  WORMHOLE_BYPASSES_BOUNDARIES: false,
  OFFENSIVE_THIRD_PARTY_EXPLOIT: false,
  CLAIMS_QUANTUM_ADVANTAGE: false,
  GUARDIAN_RLS_WEAKEN: false,
} as const;

export const COMMUNICATION_CONTEXT_SIGNALS = [
  'urgency',
  'frustration',
  'uncertainty',
  'celebration',
  'language',
  'cultural_context',
] as const;

export type CommunicationContextSignal = (typeof COMMUNICATION_CONTEXT_SIGNALS)[number];

export type CommunicationContext = {
  signals: CommunicationContextSignal[];
  languageCode?: string;
  culturalRegion?: string;
  urgencyScore: number;
  literalAgentFeelings: false;
  unsupportedPsychologicalConclusion: false;
  altersCommunication: true;
  inferredPersonalityOfIndividual: false;
};

export type EnsHopRecord = {
  hop: EnsHop;
  state: EnsEvidenceState;
  summary: string;
  refs: string[];
};

export const WORMHOLE_BOUNDARY_KINDS = ['guardian', 'rls', 'sealed', 'tenant', 'universe', 'owner'] as const;
export type WormholeBoundaryKind = (typeof WORMHOLE_BOUNDARY_KINDS)[number];

export const SENTINEL_WATCH_KINDS = [
  'leakage',
  'excessive_collection',
  'bad_provenance',
  'stale_info',
  'classification_error',
  'retention_violation',
  'unauthorized_destination',
] as const;
export type SentinelWatchKind = (typeof SENTINEL_WATCH_KINDS)[number];

export const SENTINEL_REFUSED_MODES = [
  'covert_surveillance',
  'keylogger',
  'clipboard_monitor',
  'secret_capture',
  'spyware',
] as const;
export type SentinelRefusedMode = (typeof SENTINEL_REFUSED_MODES)[number];

export const DEFENSIVE_CYBER_ACTIONS = [
  'security_architecture',
  'threat_modeling',
  'config_auditing',
  'vulnerability_dependency_review',
  'incident_triage',
  'secret_protection',
  'evidence_verification',
  'containment_planning',
] as const;
export type DefensiveCyberAction = (typeof DEFENSIVE_CYBER_ACTIONS)[number];

export const OFFENSIVE_CYBER_ACTIONS = [
  'exploit_third_party',
  'unauthorized_access',
  'exploit_poc',
  'offensive_payload',
] as const;
export type OffensiveCyberAction = (typeof OFFENSIVE_CYBER_ACTIONS)[number];

export type EnsEndpointKind = 'knowledge' | 'db' | 'agent' | 'device' | 'workcell';

export type EnsGraphEndpoint = {
  id: string;
  kind: EnsEndpointKind;
  tenantId: string;
  universeId: string;
  ownerId: string;
  guardianProtected: boolean;
  rlsProtected: boolean;
  sealed: boolean;
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'sealed';
};

export const NEXT_PHASE_TITLE_ONLY =
  '62L-AR — Distributed Memory Nervous System + Knowledge Compression + Adaptive Neural Highway Compiler';
