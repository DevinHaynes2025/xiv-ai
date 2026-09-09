/**
 * Phase 2I-W Experience + Neural Ecosystem contracts.
 * Logical fabric only. Does not claim production deployment or host-OS replacement.
 */

export type MindKind =
  | 'ExecutiveMind'
  | 'StrategyMind'
  | 'OperationsMind'
  | 'SupplyChainMind'
  | 'FinanceMind'
  | 'SecurityMind'
  | 'DataMind'
  | 'InfrastructureMind'
  | 'ResearchMind'
  | 'MarketMind'
  | 'CustomerMind'
  | 'ProductMind'
  | 'InnovationMind'
  | 'LegalComplianceMind'
  | 'InternationalBusinessMind'
  | 'SimulationMind'
  | 'RiskMind'
  | 'HistoricalMind'
  | 'LearningMind'
  | 'MediaIntelligenceMind'
  | 'PeopleMind'
  | 'FounderIntelligenceMind'
  | 'SustainabilityMind';

export type MindHealth =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'SUSPICIOUS'
  | 'LIMITED'
  | 'QUARANTINED'
  | 'REVOKED'
  | 'UNKNOWN';

export type NeuralConnectionState =
  | 'DISCONNECTED'
  | 'AVAILABLE'
  | 'REQUESTED'
  | 'AUTHORIZED'
  | 'ACTIVE'
  | 'LIMITED'
  | 'QUARANTINED'
  | 'REVOKED';

export type KnowledgeState =
  | 'OBSERVED'
  | 'REPORTED'
  | 'UNVERIFIED'
  | 'SUPPORTED'
  | 'CONTRADICTED'
  | 'REVIEW_REQUIRED'
  | 'INFERRED'
  | 'SIMULATED'
  | 'VERIFIED'
  | 'QUARANTINED'
  | 'REVOKED'
  | 'UNKNOWN';

export type ExperienceSurface = 'PHONE' | 'TABLET' | 'DESKTOP' | 'WEB' | 'PWA';

export type ExperienceNav =
  | 'HOME'
  | 'INTELLIGENCE'
  | 'CREATE'
  | 'NETWORK'
  | 'WORK'
  | 'AI';

export type PolyglotStoreV3 =
  | 'RELATIONAL'
  | 'GRAPH'
  | 'VECTOR'
  | 'SEARCH'
  | 'OBJECT'
  | 'STREAM'
  | 'TIME_SERIES'
  | 'CACHE'
  | 'WAREHOUSE_LAKEHOUSE'
  | 'ARCHIVE';

export type ComputeBackendV3 =
  | 'CPU'
  | 'GPU'
  | 'NVIDIA_GPU'
  | 'AMD_GPU'
  | 'APPLE_SILICON'
  | 'NPU'
  | 'DISTRIBUTED'
  | 'SPECIALIZED_ACCELERATOR'
  | 'QUANTUM_FUTURE';

export type ConnectorState = 'NOT_CONFIGURED' | 'CONFIGURED' | 'PROVEN';

export type DeploymentLane = 'development' | 'test' | 'staging' | 'production';

export const MIND_KINDS: readonly MindKind[] = [
  'ExecutiveMind',
  'StrategyMind',
  'OperationsMind',
  'SupplyChainMind',
  'FinanceMind',
  'SecurityMind',
  'DataMind',
  'InfrastructureMind',
  'ResearchMind',
  'MarketMind',
  'CustomerMind',
  'ProductMind',
  'InnovationMind',
  'LegalComplianceMind',
  'InternationalBusinessMind',
  'SimulationMind',
  'RiskMind',
  'HistoricalMind',
  'LearningMind',
  'MediaIntelligenceMind',
  'PeopleMind',
  'FounderIntelligenceMind',
  'SustainabilityMind',
] as const;

export const EXPERIENCE_NAV: readonly ExperienceNav[] = [
  'HOME',
  'INTELLIGENCE',
  'CREATE',
  'NETWORK',
  'WORK',
  'AI',
] as const;

export const POLYGLOT_STORES_V3: readonly PolyglotStoreV3[] = [
  'RELATIONAL',
  'GRAPH',
  'VECTOR',
  'SEARCH',
  'OBJECT',
  'STREAM',
  'TIME_SERIES',
  'CACHE',
  'WAREHOUSE_LAKEHOUSE',
  'ARCHIVE',
] as const;

export const COMPUTE_BACKENDS_V3: readonly ComputeBackendV3[] = [
  'CPU',
  'GPU',
  'NVIDIA_GPU',
  'AMD_GPU',
  'APPLE_SILICON',
  'NPU',
  'DISTRIBUTED',
  'SPECIALIZED_ACCELERATOR',
  'QUANTUM_FUTURE',
] as const;

export const ENTERPRISE_CONNECTORS = [
  'AWS',
  'Azure',
  'GoogleCloud',
  'Oracle',
  'IBM',
  'SAP',
  'Salesforce',
  'Snowflake',
  'Databricks',
  'Cisco',
  'Microsoft',
  'ERP',
  'CRM',
  'WMS',
  'TMS',
] as const;

export type EnterpriseConnector = (typeof ENTERPRISE_CONNECTORS)[number];

export const AGENT_SPECIALTIES = [
  'Executive',
  'Strategy',
  'Operations',
  'Finance',
  'SupplyChain',
  'Warehouse',
  'Procurement',
  'Transportation',
  'Manufacturing',
  'Quality',
  'Customer',
  'Product',
  'Innovation',
  'Developer',
  'Data',
  'Database',
  'Graph',
  'Vector',
  'Research',
  'History',
  'Market',
  'Economics',
  'International',
  'LegalResearch',
  'Compliance',
  'Privacy',
  'Security',
  'SOC',
  'AgentSecurity',
  'ModelSecurity',
  'Infrastructure',
  'Cloud',
  'Device',
  'Media',
  'Translation',
  'Travel',
  'Events',
  'HospitalOperations',
  'Construction',
  'RealEstate',
  'Insurance',
  'Retail',
  'Startup',
  'CapitalResearch',
  'Sustainability',
] as const;

export type AgentSpecialty = (typeof AGENT_SPECIALTIES)[number];
