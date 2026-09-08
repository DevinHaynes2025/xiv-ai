/**
 * 2I-AI-62A queued architecture contracts.
 * Documentation lock only. Does not start an agent civilization, register
 * agents, open meeting rooms, contact satellite providers, or enable L4.
 *
 * Status: QUEUED ARCHITECTURE — NOT IMPLEMENTED
 * Queue position: CURRENT = Deployment Gate Hardening; 62A is NEXT.
 */

export const STORY_ID = '2I-AI-62A' as const;
export const STORY_SERIES = '2I-AI-62' as const;
export const DEPLOYMENT_STATE = 'QUEUED' as const;
export const IMPLEMENTATION_STARTED = false;
export const L4_AUTONOMY_ENABLED = false;

/** The deployment-readiness gate is owned by other work; 62A cannot lift it. */
export const DEPLOYMENT_GATE_BLOCKED = true;

export const CAPABILITY_FLAGS = {
  AGENT_CIVILIZATION_LAYER_ENABLED: false,
  XACP_ENABLED: false,
  AGENT_MEETING_ROOMS_ENABLED: false,
  HUMAN_INTELLIGENCE_BRIDGE_ENABLED: false,
  HISTORICAL_KNOWLEDGE_LINEAGE_ENABLED: false,
  LANGUAGE_CULTURAL_INTELLIGENCE_ENABLED: false,
  TEMPORAL_INTELLIGENCE_ENABLED: false,
  CROSS_DEVICE_RUNTIME_ENABLED: false,
  PARALLEL_UNIVERSE_RUNTIME_ENABLED: false,
  AGENT_TASK_FORCES_ENABLED: false,
  MASSIVE_AGENT_SCHEDULER_ENABLED: false,
  INFORMATION_LOGISTICS_ENABLED: false,
  SPACE_INTELLIGENCE_LAYER_ENABLED: false,
  GALACTIC_NAMESPACE_ENABLED: false,
  STORAGE_CIVILIZATION_ENABLED: false,
} as const;

export const AUTO_FLAGS = {
  AUTO_AGENT_CREATION: false,
  AUTO_PERMISSION_EXPANSION: false,
  AUTO_PRODUCTION_DEPLOY: false,
  AUTO_CROSS_UNIVERSE_TRANSFER: false,
  AUTO_MODEL_TRAINING_PRIVATE_DATA: false,
  AUTO_FINANCIAL_ACTION: false,
  AUTO_EXTERNAL_ACCOUNT_CREATION: false,
  AUTO_SATELLITE_COMMAND: false,
  AUTO_GUARDIAN_MODIFICATION: false,
  AUTO_RECURSIVE_AGENT_SPAWN: false,
} as const;

/** §1 — an identity missing any field is not instantiable. */
export const AGENT_IDENTITY_FIELDS = [
  'agent_id',
  'organization_id',
  'universe_id',
  'specialization',
  'approved_tools',
  'model_runtime',
  'memory_scope',
  'language_capabilities',
  'cultural_context_modules',
  'security_classification',
  'permissions',
  'task_queue',
  'resource_budget',
  'lifecycle_state',
  'provenance',
  'evaluation_history',
  'human_supervisor',
  'guardian_policy',
] as const;

/** §2 — XIV Agent Communication Protocol. */
export const XACP_STAGES = [
  'discover',
  'request',
  'negotiate',
  'reason',
  'delegate',
  'collaborate',
  'verify',
  'report',
  'archive',
] as const;

export const XACP_RECORD_FIELDS = [
  'sender',
  'receiver',
  'universe',
  'purpose',
  'evidence',
  'reasoning_artifact',
  'decision',
  'confidence',
  'approval',
  'result',
] as const;

/** §4 — knowledge classes must never be silently collapsed into one another. */
export const KNOWLEDGE_CLASSES = [
  'HUMAN_FACT',
  'HUMAN_OPINION',
  'AGENT_INFERENCE',
  'HISTORICAL_EVIDENCE',
  'EXTERNAL_SOURCE',
  'PREDICTION',
  'UNKNOWN',
] as const;

/** §5 — historical records carry provenance, contradictions included. */
export const HISTORICAL_RECORD_FIELDS = [
  'source',
  'date',
  'civilization_location',
  'language',
  'translation',
  'interpretation',
  'confidence',
  'contradictions',
  'modern_relevance',
] as const;

/** §7 — Universe lifecycle. Distinct from the existing universes.status enum. */
export const UNIVERSE_LIFECYCLE_STATES = [
  'CREATED',
  'SEED',
  'GROWTH',
  'OPERATIONAL',
  'MATURE',
  'TRANSFORMATION',
  'ARCHIVE',
] as const;

/** §11 — bounded activation. */
export const AGENT_SCHEDULING_PIPELINE = [
  'LOGICAL_AGENTS',
  'AGENT_REGISTRY',
  'SCHEDULER',
  'TASK_QUEUE',
  'RESOURCE_GOVERNOR',
  'ACTIVE_AGENTS',
  'RUNTIME',
  'SLEEP_ARCHIVE',
] as const;

/** §12 — information logistics lineage. */
export const INFORMATION_LINEAGE_STAGES = [
  'ORIGIN',
  'ACQUISITION',
  'CLASSIFICATION',
  'STORAGE',
  'TRANSFORMATION',
  'REASONING',
  'VALIDATION',
  'DISTRIBUTION',
  'DECISION',
  'RETENTION_DELETION',
] as const;

/** §13 — satellite and orbital tiers stay unconfigured. */
export const SPACE_PROVIDER_STATE = 'UNCONFIGURED' as const;

export const COMPUTE_TIERS = [
  'EARTH_CLOUD',
  'EDGE',
  'TERRESTRIAL_DISTRIBUTED',
  'SATELLITE_CONNECTIVITY',
  'ORBITAL_COMPUTE',
  'DEEP_SPACE',
] as const;

/** §14 — organizational abstraction, not literal infrastructure. */
export const NAMESPACE_HIERARCHY = [
  'AGENT',
  'TEAM',
  'UNIVERSE',
  'CONSTELLATION',
  'GALAXY',
] as const;

/** §15 — tiering, with no hard-coded impossible capacity. */
export const STORAGE_TIERS = [
  'HOT',
  'WARM',
  'COLD',
  'ARCHIVAL',
  'KNOWLEDGE_COMPRESSION',
  'VECTOR_INDEX',
  'PROVENANCE_STORE',
] as const;

/** Security boundary — closed list. Not permitted means denied, never inferred safe. */
export const PROHIBITED_AGENT_ACTIONS = [
  'DISABLE_RLS',
  'BYPASS_TENANT_BOUNDARY',
  'EXPOSE_SECRETS',
  'INCREASE_OWN_PERMISSIONS',
  'SELF_DEPLOY_TO_PRODUCTION',
  'CREATE_UNRESTRICTED_EXTERNAL_ACCOUNTS',
  'EXECUTE_FINANCIAL_TRANSACTIONS',
  'COMMAND_SATELLITES',
  'MODIFY_GUARDIAN',
  'TRAIN_ON_PRIVATE_TENANT_DATA',
  'TRANSFER_CLASSIFIED_ACROSS_UNIVERSES',
  'CREATE_RECURSIVE_AGENT_POPULATIONS',
] as const;

/**
 * Slice 1 table dispositions, reconciled against migrations already on xiv-v2.
 * CREATE is only valid where nothing equivalent exists today; issuing CREATE
 * for an EXTEND or RECONCILE row would fork the agent schema.
 */
export const SLICE_1_TABLE_DISPOSITION = {
  agent_registry: 'CREATE',
  agent_capabilities: 'CREATE',
  agent_relationships: 'CREATE',
  agent_messages: 'RENAME',
  agent_meetings: 'EXTEND',
  agent_meeting_participants: 'CREATE',
  agent_tasks: 'RECONCILE',
  agent_task_forces: 'EXTEND',
  agent_knowledge_sources: 'CREATE',
  knowledge_lineage: 'CREATE',
  agent_evaluations: 'RECONCILE',
  agent_resource_budgets: 'CREATE',
  universe_lifecycle: 'RECONCILE',
  runtime_nodes: 'CREATE',
  runtime_capabilities: 'CREATE',
} as const;

/** Tables that already exist on xiv-v2 and must never be re-created by 62A. */
export const PREEXISTING_TABLES = [
  'agent_meetings',
  'agent_task_forces',
  'agent_task_force_members',
  'agent_mc_messages',
  'ai_agent_messages',
  'agent_performance',
  'agent_missions',
  'agent_workers',
  'agent_departments',
  'universes',
  'xiv_agent_meetings',
  'xiv_agent_meeting_participants',
  'xiv_agent_meeting_messages',
] as const;

/**
 * The agent model is already forked across parallel schemas: 62B landed before
 * 62A and added the xiv_agent_meetings family alongside the pre-existing
 * agent_meetings, so meetings have two homes and messages have three.
 * Slice 1.0 reconciles this; until then the fork is recorded, not resolved.
 */
export const SCHEMA_FORKED = true;

export const MEETING_TABLE_FAMILIES = ['agent_meetings', 'xiv_agent_meetings'] as const;

export const MESSAGE_TABLE_FAMILIES = [
  'ai_agent_messages',
  'agent_mc_messages',
  'xiv_agent_meeting_messages',
] as const;

/** Open defects found while reconciling. Both must be closed in Slice 1.0. */
export const OPEN_SCHEMA_DEFECTS = {
  universeBlindRls: true,
  tenantIdTypeInconsistent: true,
} as const;

/**
 * Tables carrying universe_id whose RLS policies filter on tenant_id only.
 * Nine from agent_mission_control plus ten from the 62B meetings migration.
 */
export const UNIVERSE_BLIND_TABLE_COUNT = 19;

export const ACCEPTANCE_CRITERIA_DEMONSTRATED = {
  organizationIsolation: false,
  universeIsolation: false,
  agentIdentityIsolation: false,
  rlsEnforcement: false,
  resourceQuotas: false,
  messageProvenance: false,
  meetingAuditability: false,
  noUnauthorizedToolExecution: false,
  agentEvaluationGates: false,
  deterministicKillSwitch: false,
  boundedAgentCreation: false,
  rollbackCapability: false,
  costTelemetry: false,
} as const;

export const INVARIANTS = {
  guardianIsSubordinateToAgents: false,
  logicalAgentCountIsRunningAgentCount: false,
  meetingIsAuthority: false,
  agentConsensusIsCorrectness: false,
  agentInferenceIsHumanFact: false,
  historicalBeliefIsModernFact: false,
  translationIsInterpretation: false,
  culturalAdaptationIsStereotyping: false,
  crossUniverseCommunicationIsImplicit: false,
  privateTenantDataIsTrainingData: false,
  satelliteProviderIsConfigured: false,
  galaxyIsLiteralInfrastructure: false,
  architectureGrowthIsDeploymentReadiness: false,
  insufficientEvidenceIsFailure: false,
} as const;

export const QUEUE_SEQUENCE = [
  '2I-AI-62A',
  '2I-AI-62B',
  '2I-AI-62C',
  '2I-AI-62D',
  '2I-AI-62E',
  '2I-AI-62F',
  '2I-AI-62G',
  '2I-AI-62H',
] as const;

export function allCapabilityFlagsFalse(): boolean {
  return Object.values(CAPABILITY_FLAGS).every((value) => value === false);
}

export function allAutoFlagsFalse(): boolean {
  return Object.values(AUTO_FLAGS).every((value) => value === false);
}

export function noAcceptanceCriteriaDemonstrated(): boolean {
  return Object.values(ACCEPTANCE_CRITERIA_DEMONSTRATED).every((value) => value === false);
}

/** A pre-existing table may be extended or reconciled, never created. */
export function dispositionIsSafe(table: keyof typeof SLICE_1_TABLE_DISPOSITION): boolean {
  const preexisting = (PREEXISTING_TABLES as readonly string[]).includes(table);
  return preexisting ? SLICE_1_TABLE_DISPOSITION[table] !== 'CREATE' : true;
}

export function storyIsImplemented(): boolean {
  return false;
}
