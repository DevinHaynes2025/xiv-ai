export const MEMORY_NERVOUS_LOOP = [
  'evidence',
  'memory_classification',
  'deduplication',
  'contradiction_detection',
  'hot_warm_cold_storage',
  'compression',
  'neural_highway_compilation',
  'retrieval',
  'agent_reasoning',
  'outcome',
  'learning',
  'memory_consolidation',
] as const;

export type MemoryNervousHop = (typeof MEMORY_NERVOUS_LOOP)[number];

export const DISTRIBUTED_MEMORY_LOCKS = {
  L4_AUTONOMY_ENABLED: false,
  AUTO_PRODUCTION_DEPLOY: false,
  PRODUCTION_DATABASE_WRITE: false,
  PRODUCTION_GIT_PUSH: false,
  AUTO_PERMISSION_EXPANSION: false,
  PRODUCTION_AUTHORIZATION: false,
  FOUNDER_IMPERSONATION: false,
  TIP_LAND: false,
  CEO_SEALED_REPLICATES: false,
  STRENGTHEN_ON_AGENT_AGREEMENT: false,
  MATERIALIZE_TRILLION_ROWS: false,
} as const;

export type EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export type MemoryClass =
  | 'episode'
  | 'fact'
  | 'lesson'
  | 'contradiction'
  | 'outcome'
  | 'highway'
  | 'founder_restricted'
  | 'sealed';

export type MemoryTier = 'hot' | 'warm' | 'cold';

export type MemoryPolarity = 'claim' | 'counterclaim' | 'neutral';

export type PoisonState = 'clean' | 'quarantine';

export type LearningSignalKind =
  | 'verified_evidence'
  | 'verified_outcome'
  | 'correction'
  | 'latency'
  | 'resource_cost'
  | 'agent_agreement';

export type MemoryLearningSignals = {
  kind: LearningSignalKind;
  evidenceQuality: number;
  outcome: 0 | 1 | null;
  correction: boolean;
  latencyMs: number;
  resourceCost: number;
  agreementCount?: number;
  evidenceRefs: string[];
  inventedFacts: false;
};

/** AG Agent Society metrics, reused when the module is on the tree. */
export type CompatibleSocietyMetrics = {
  evidenceQuality: number;
  factualSupport: number;
  testSuccess: number;
  calibration: number;
  correctionRate: number;
  latencyMs: number;
  resourceUse: {
    workcellsInFlight: number;
    modelCallsUsed: number;
    maxConcurrentWorkcells: number;
  };
  agentCount: number;
  smarterBecauseMoreAgents: false;
};
