export type PersonClaimClass =
  | 'BIOGRAPHICAL_FACT'
  | 'PRIMARY_SOURCE_STATEMENT'
  | 'DOCUMENTED_IDEA'
  | 'THIRD_PARTY_INTERPRETATION'
  | 'DISPUTED'
  | 'AI_INFERENCE'
  | 'SIMULATED_RESPONSE'
  | 'UNKNOWN';

export type SimulationLabel = 'AI_HISTORICAL_SIMULATION';

export type KnowledgePromotionState =
  | 'OBSERVED'
  | 'UNVERIFIED'
  | 'SUPPORTED'
  | 'CONTRADICTED'
  | 'REVIEW_REQUIRED'
  | 'VERIFIED';

export type LogicalBrainId =
  | 'PERSONAL'
  | 'COMPANY'
  | 'INDUSTRY'
  | 'SUPPLY_CHAIN'
  | 'PRODUCT'
  | 'SUPPLIER'
  | 'ECONOMIC'
  | 'HISTORICAL'
  | 'CIVILIZATION'
  | 'LEGACY'
  | 'EARTH'
  | 'GLOBAL_BUSINESS';

export type MeshProviderClass = 'PUBLIC' | 'OPEN_LICENSE' | 'LICENSED' | 'PARTNER' | 'TENANT_AUTHORIZED';

export type StorageEngine =
  | 'OBJECT'
  | 'RELATIONAL'
  | 'GRAPH'
  | 'VECTOR'
  | 'SEARCH'
  | 'STREAM'
  | 'TIME_SERIES'
  | 'CACHE'
  | 'ARCHIVE';

export type StorageTier = 'HOT' | 'WARM' | 'COLD' | 'ARCHIVE' | 'SOURCE_REFERENCE';

export type PhilosophyDomain =
  | 'ethics'
  | 'leadership'
  | 'meaning'
  | 'creativity'
  | 'decision-making'
  | 'epistemology'
  | 'consciousness'
  | 'innovation'
  | 'philosophy of technology';

export type ThinkerDomain =
  | 'business'
  | 'commerce'
  | 'technology'
  | 'science'
  | 'engineering'
  | 'mathematics'
  | 'economics'
  | 'philosophy'
  | 'leadership'
  | 'innovation'
  | 'supply chain'
  | 'physics'
  | 'computing'
  | 'human thought';
