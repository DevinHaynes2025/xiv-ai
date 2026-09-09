export type FollowMode = 'DISABLED' | 'PRIVATE_ANALYTICS' | 'ENABLED';

export type CommunityType =
  | 'INDUSTRY'
  | 'COMPANY'
  | 'SUPPLIER'
  | 'PRODUCT'
  | 'LOCAL'
  | 'PROFESSIONAL'
  | 'FOUNDER'
  | 'INNOVATION'
  | 'RESEARCH'
  | 'CUSTOMER'
  | 'LEARNING'
  | 'EVENT'
  | 'PRIVATE_ORGANIZATION';

export type ReviewClass =
  | 'USER_REVIEW'
  | 'VERIFIED_TRANSACTION_REVIEW'
  | 'COMPANY_RESPONSE'
  | 'PUBLIC_SOURCE'
  | 'XIV_RESEARCH'
  | 'AI_SUMMARY';

export type MediaKind = 'VIDEO' | 'AUDIO' | 'IMAGE' | 'ARTICLE' | 'LIVE' | 'DOCUMENT';

export type MediaRightsState = 'UNKNOWN' | 'LICENSED' | 'PUBLIC_DOMAIN' | 'FAIR_USE_REVIEW' | 'DENIED';

export type DataAgentRole =
  | 'Chief Data'
  | 'Database Architect'
  | 'Data Quality'
  | 'Schema'
  | 'Query Optimization'
  | 'Data Lineage'
  | 'Database Security'
  | 'Backup'
  | 'Replication'
  | 'Graph'
  | 'Vector Intelligence'
  | 'Search Index'
  | 'Streaming'
  | 'Archive'
  | 'Data Cost'
  | 'Data Contradiction'
  | 'Provenance';

export type PolyglotStore =
  | 'RELATIONAL'
  | 'GRAPH'
  | 'VECTOR'
  | 'SEARCH'
  | 'OBJECT'
  | 'STREAM'
  | 'TIME_SERIES'
  | 'CACHE'
  | 'WAREHOUSE';

export type SurfaceBreakpoint = 'PHONE' | 'TABLET' | 'DESKTOP';
