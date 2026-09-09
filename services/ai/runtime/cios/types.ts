/**
 * Phase 2I-Z Continuous Intelligence OS Foundation contracts.
 * Governed cross-platform intelligence operating fabric.
 * L4 disabled. Providers stay NOT_CONFIGURED unless proven LIVE.
 * Extreme scale = FUTURE ENGINEERING TARGET / NOT PROVEN.
 */

export type CapabilityLifecycle = 'NOT_CONFIGURED' | 'CONFIGURED' | 'PROVEN' | 'LIVE';

/** Provider-neutral data fabric adapters. PostgreSQL/Supabase remains authoritative for identity/governance. */
export type DataFabricAdapterKind =
  | 'POSTGRESQL'
  | 'SUPABASE_POSTGRES'
  | 'PGVECTOR'
  | 'DOCUMENT_OBJECT_STORAGE'
  | 'GRAPH_DB'
  | 'VECTOR_DB'
  | 'SEARCH_INDEX'
  | 'EVENT_STREAM_DB'
  | 'ANALYTICS_WAREHOUSE'
  | 'CACHE'
  | 'TIME_SERIES'
  | 'MONGODB';

export type GovernanceStackHop =
  | 'CAPABILITY_GATEWAY'
  | 'IDENTITY_DEVICE_TRUST'
  | 'TENANT_UNIVERSE'
  | 'GUARDIAN'
  | 'AGENT_FIREWALL'
  | 'TOOL_PERMISSIONS'
  | 'DATA_ACCESS_GATEWAY'
  | 'HUMAN_AUTHORITY'
  | 'AUDIT';

export type AgentSocietyRole =
  | 'Executive'
  | 'Research'
  | 'Security'
  | 'Database'
  | 'SupplyChain'
  | 'Finance'
  | 'Product'
  | 'Engineering'
  | 'QA'
  | 'UAT'
  | 'DataQuality'
  | 'HistoricalIntelligence'
  | 'Foresight'
  | 'Innovation'
  | 'PatentResearch'
  | 'Infrastructure'
  | 'FounderIntelligence';

export type IntelligenceFabricLane =
  | 'COMPANY_BRAIN'
  | 'PERSONAL_BRAIN'
  | 'POCKET_BRAIN'
  | 'HISTORICAL_INTELLIGENCE'
  | 'EVIDENCE_KNOWLEDGE_GRAPH'
  | 'VECTOR_MEMORY'
  | 'OPERATIONAL_EVENTS'
  | 'RESEARCH_CORPUS'
  | 'PRODUCT_INTELLIGENCE'
  | 'GLOBAL_PUBLIC_INTELLIGENCE';

export type OperationsShiftKind =
  | 'MORNING'
  | 'NIGHT'
  | 'SECURITY_WATCH'
  | 'DATABASE_WATCH'
  | 'RESEARCH_WATCH'
  | 'QA_WATCH';

export type ShiftLifecycleStage =
  | 'ASSIGN'
  | 'PLAN'
  | 'AUTHORIZE'
  | 'EXECUTE_BOUNDED_TASKS'
  | 'TEST'
  | 'CRITIQUE'
  | 'EVIDENCE_CHECK'
  | 'SECURITY_CHECK'
  | 'HANDOFF'
  | 'FOUNDER_BRIEF';

export type ContinuousBoundary =
  | 'TIME'
  | 'COMPUTE'
  | 'COST'
  | 'DATA'
  | 'TOOL'
  | 'TENANT'
  | 'NETWORK'
  | 'AUTHORITY'
  | 'RETENTION'
  | 'ACTION';

export type OfflineSyncStage =
  | 'SIGNED_LOCAL_EVENT_QUEUE'
  | 'RECONNECT'
  | 'AUTHENTICATE'
  | 'DEVICE_VALIDATION'
  | 'TENANT_VALIDATION'
  | 'CONFLICT_DETECTION'
  | 'SERVER_AUTHORIZATION'
  | 'SYNCHRONIZE'
  | 'AUDIT';

export type PocketSyncScope =
  | 'APPROVED_LOCAL_CONTEXT'
  | 'TASKS'
  | 'DOCS'
  | 'CONVERSATIONS'
  | 'WAREHOUSE_WORKFLOWS'
  | 'RESEARCH_CACHE'
  | 'PENDING_EVENTS';

export type PlatformCapability =
  | 'ANDROID'
  | 'IOS'
  | 'WINDOWS'
  | 'LINUX'
  | 'WEB'
  | 'NVIDIA_ACCELERATION'
  | 'EDGE'
  | 'XR_FUTURE';

export type FoundryPipelineStage =
  | 'PROBLEM_SIGNAL'
  | 'RESEARCH'
  | 'HISTORICAL_COMPARISON'
  | 'MARKET_EVIDENCE'
  | 'AGENT_BRAINSTORM'
  | 'TECHNICAL_FEASIBILITY'
  | 'SECURITY_REVIEW'
  | 'IP_PATENT_RESEARCH'
  | 'PROTOTYPE_PROPOSAL'
  | 'SANDBOX_BUILD'
  | 'QA'
  | 'HUMAN_DECISION';

export type SecurityExpansionControl =
  | 'DEVICE_TRUST'
  | 'WORKLOAD_IDENTITY'
  | 'AGENT_IDENTITY'
  | 'DATABASE_GATEWAY'
  | 'SECRETS_ISOLATION'
  | 'SOFTWARE_SUPPLY_CHAIN'
  | 'SBOM'
  | 'DEPENDENCY_SCANNING'
  | 'CONTAINER_SCANNING'
  | 'SIGNED_ARTIFACTS'
  | 'DATA_PROVENANCE'
  | 'DLP'
  | 'REGIONAL_CONTROLS'
  | 'BACKUP_VERIFICATION'
  | 'RECOVERY_TESTING'
  | 'AGENT_ANOMALY_DETECTION'
  | 'PROMPT_INJECTION_DEFENSE'
  | 'TOOL_OUTPUT_VALIDATION'
  | 'COST_RATE_ABUSE_PROTECTION';

export type ScaleEngineeringTarget =
  | 'PARTITIONING'
  | 'REGIONALIZATION'
  | 'QUEUES'
  | 'STREAMS'
  | 'CACHING'
  | 'OBJECT_STORAGE'
  | 'INDEXES'
  | 'GRAPH_VECTOR_PARTITIONING'
  | 'RATE_LIMITS'
  | 'QUOTAS'
  | 'BACKPRESSURE'
  | 'REGIONAL_FAILOVER';

export type AgentAllowedAction =
  | 'RESEARCH'
  | 'REASON'
  | 'BRAINSTORM'
  | 'CRITIQUE'
  | 'COMPARE'
  | 'WRITE_DRAFTS'
  | 'WRITE_TESTS'
  | 'SANDBOX_PATCHES'
  | 'APPROVED_QA'
  | 'ANALYZE_PERMITTED_DATA'
  | 'PROPOSALS'
  | 'ARCHITECTURE_PLANS'
  | 'IDENTIFY_BUGS'
  | 'RECOMMEND_FIXES';

export type AgentForbiddenAction =
  | 'SELF_GRANT_PERMISSIONS'
  | 'CREATE_HIDDEN_CREDENTIALS'
  | 'DISABLE_GUARDIAN'
  | 'WEAKEN_TENANT_ISOLATION'
  | 'SILENT_PRODUCTION_DEPLOY'
  | 'PROMOTE_TO_L4'
  | 'READ_UNAUTHORIZED_TENANT_DATA'
  | 'REWRITE_AUTHORITY'
  | 'BYPASS_HUMAN_APPROVAL';

export const DATA_FABRIC_ADAPTER_KINDS: readonly DataFabricAdapterKind[] = [
  'POSTGRESQL',
  'SUPABASE_POSTGRES',
  'PGVECTOR',
  'DOCUMENT_OBJECT_STORAGE',
  'GRAPH_DB',
  'VECTOR_DB',
  'SEARCH_INDEX',
  'EVENT_STREAM_DB',
  'ANALYTICS_WAREHOUSE',
  'CACHE',
  'TIME_SERIES',
  'MONGODB',
] as const;

export const GOVERNANCE_STACK: readonly GovernanceStackHop[] = [
  'CAPABILITY_GATEWAY',
  'IDENTITY_DEVICE_TRUST',
  'TENANT_UNIVERSE',
  'GUARDIAN',
  'AGENT_FIREWALL',
  'TOOL_PERMISSIONS',
  'DATA_ACCESS_GATEWAY',
  'HUMAN_AUTHORITY',
  'AUDIT',
] as const;

export const AGENT_SOCIETY_ROLES: readonly AgentSocietyRole[] = [
  'Executive',
  'Research',
  'Security',
  'Database',
  'SupplyChain',
  'Finance',
  'Product',
  'Engineering',
  'QA',
  'UAT',
  'DataQuality',
  'HistoricalIntelligence',
  'Foresight',
  'Innovation',
  'PatentResearch',
  'Infrastructure',
  'FounderIntelligence',
] as const;

export const INTELLIGENCE_FABRIC_LANES: readonly IntelligenceFabricLane[] = [
  'COMPANY_BRAIN',
  'PERSONAL_BRAIN',
  'POCKET_BRAIN',
  'HISTORICAL_INTELLIGENCE',
  'EVIDENCE_KNOWLEDGE_GRAPH',
  'VECTOR_MEMORY',
  'OPERATIONAL_EVENTS',
  'RESEARCH_CORPUS',
  'PRODUCT_INTELLIGENCE',
  'GLOBAL_PUBLIC_INTELLIGENCE',
] as const;

export const OPERATIONS_SHIFT_KINDS: readonly OperationsShiftKind[] = [
  'MORNING',
  'NIGHT',
  'SECURITY_WATCH',
  'DATABASE_WATCH',
  'RESEARCH_WATCH',
  'QA_WATCH',
] as const;

export const SHIFT_LIFECYCLE: readonly ShiftLifecycleStage[] = [
  'ASSIGN',
  'PLAN',
  'AUTHORIZE',
  'EXECUTE_BOUNDED_TASKS',
  'TEST',
  'CRITIQUE',
  'EVIDENCE_CHECK',
  'SECURITY_CHECK',
  'HANDOFF',
  'FOUNDER_BRIEF',
] as const;

export const CONTINUOUS_BOUNDARIES: readonly ContinuousBoundary[] = [
  'TIME',
  'COMPUTE',
  'COST',
  'DATA',
  'TOOL',
  'TENANT',
  'NETWORK',
  'AUTHORITY',
  'RETENTION',
  'ACTION',
] as const;

export const OFFLINE_SYNC_STAGES: readonly OfflineSyncStage[] = [
  'SIGNED_LOCAL_EVENT_QUEUE',
  'RECONNECT',
  'AUTHENTICATE',
  'DEVICE_VALIDATION',
  'TENANT_VALIDATION',
  'CONFLICT_DETECTION',
  'SERVER_AUTHORIZATION',
  'SYNCHRONIZE',
  'AUDIT',
] as const;

export const PLATFORM_CAPABILITIES: readonly PlatformCapability[] = [
  'ANDROID',
  'IOS',
  'WINDOWS',
  'LINUX',
  'WEB',
  'NVIDIA_ACCELERATION',
  'EDGE',
  'XR_FUTURE',
] as const;

export const FOUNDRY_PIPELINE: readonly FoundryPipelineStage[] = [
  'PROBLEM_SIGNAL',
  'RESEARCH',
  'HISTORICAL_COMPARISON',
  'MARKET_EVIDENCE',
  'AGENT_BRAINSTORM',
  'TECHNICAL_FEASIBILITY',
  'SECURITY_REVIEW',
  'IP_PATENT_RESEARCH',
  'PROTOTYPE_PROPOSAL',
  'SANDBOX_BUILD',
  'QA',
  'HUMAN_DECISION',
] as const;

export const SECURITY_EXPANSION_CONTROLS: readonly SecurityExpansionControl[] = [
  'DEVICE_TRUST',
  'WORKLOAD_IDENTITY',
  'AGENT_IDENTITY',
  'DATABASE_GATEWAY',
  'SECRETS_ISOLATION',
  'SOFTWARE_SUPPLY_CHAIN',
  'SBOM',
  'DEPENDENCY_SCANNING',
  'CONTAINER_SCANNING',
  'SIGNED_ARTIFACTS',
  'DATA_PROVENANCE',
  'DLP',
  'REGIONAL_CONTROLS',
  'BACKUP_VERIFICATION',
  'RECOVERY_TESTING',
  'AGENT_ANOMALY_DETECTION',
  'PROMPT_INJECTION_DEFENSE',
  'TOOL_OUTPUT_VALIDATION',
  'COST_RATE_ABUSE_PROTECTION',
] as const;

export const SCALE_ENGINEERING_TARGETS: readonly ScaleEngineeringTarget[] = [
  'PARTITIONING',
  'REGIONALIZATION',
  'QUEUES',
  'STREAMS',
  'CACHING',
  'OBJECT_STORAGE',
  'INDEXES',
  'GRAPH_VECTOR_PARTITIONING',
  'RATE_LIMITS',
  'QUOTAS',
  'BACKPRESSURE',
  'REGIONAL_FAILOVER',
] as const;

export const AGENT_ALLOWED_ACTIONS: readonly AgentAllowedAction[] = [
  'RESEARCH',
  'REASON',
  'BRAINSTORM',
  'CRITIQUE',
  'COMPARE',
  'WRITE_DRAFTS',
  'WRITE_TESTS',
  'SANDBOX_PATCHES',
  'APPROVED_QA',
  'ANALYZE_PERMITTED_DATA',
  'PROPOSALS',
  'ARCHITECTURE_PLANS',
  'IDENTIFY_BUGS',
  'RECOMMEND_FIXES',
] as const;

export const AGENT_FORBIDDEN_ACTIONS: readonly AgentForbiddenAction[] = [
  'SELF_GRANT_PERMISSIONS',
  'CREATE_HIDDEN_CREDENTIALS',
  'DISABLE_GUARDIAN',
  'WEAKEN_TENANT_ISOLATION',
  'SILENT_PRODUCTION_DEPLOY',
  'PROMOTE_TO_L4',
  'READ_UNAUTHORIZED_TENANT_DATA',
  'REWRITE_AUTHORITY',
  'BYPASS_HUMAN_APPROVAL',
] as const;

/** Exact UI/copy disclosure — never imply the AI is the real founder. */
export const FOUNDER_TWIN_DISCLOSURE = 'XIV Founder Twin — AI representation of Devin Xavier Haynes' as const;
