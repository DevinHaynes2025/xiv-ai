/**
 * 2I-AI-62C queued knowledge-schema contracts.
 *
 * Documentation lock only. Does not ingest any source, create any knowledge
 * table, translate anything, or enable L4.
 *
 * Purpose: 62C §26 names fifteen tables. Two of them are the same concept 62A
 * already planned under different names, and no knowledge table exists yet, so
 * the fork is preventable rather than recordable. The agent_meetings /
 * xiv_agent_meetings split already happened because two stories named the same
 * concept differently and both shipped; this module exists so that cannot
 * repeat for knowledge.
 *
 * Status: QUEUED ARCHITECTURE — NOT IMPLEMENTED
 */

export const STORY_ID = '2I-AI-62C' as const;
export const STORY_SERIES = '2I-AI-62' as const;
export const DEPLOYMENT_STATE = 'QUEUED' as const;
export const IMPLEMENTATION_STARTED = false;
export const L4_AUTONOMY_ENABLED = false;
export const DEPLOYMENT_GATE_BLOCKED = true;

export const CAPABILITY_FLAGS = {
  CIVILIZATION_KNOWLEDGE_GRAPH_ENABLED: false,
  HISTORICAL_TIMELINE_ENABLED: false,
  KNOWLEDGE_INGESTION_ENABLED: false,
  PROFESSIONAL_LIBRARY_ENABLED: false,
  XLIN_TRANSLATION_ENABLED: false,
  LANGUAGE_AGENT_NETWORK_ENABLED: false,
  CULTURAL_CONTEXT_ENGINE_ENABLED: false,
  TEMPORAL_INTELLIGENCE_ENGINE_ENABLED: false,
  KNOWLEDGE_AGING_ENABLED: false,
  CONTRADICTION_ENGINE_ENABLED: false,
  KNOWLEDGE_SUPPLY_CHAIN_ENABLED: false,
  INTEGRITY_HASHING_ENABLED: false,
  AGENT_KNOWLEDGE_BUDGETS_ENABLED: false,
  KNOWLEDGE_QUARANTINE_ENABLED: false,
} as const;

export const AUTO_FLAGS = {
  AUTO_INTERNET_INGESTION: false,
  AUTO_COPYRIGHTED_DATASET_COPY: false,
  AUTO_SECRET_COLLECTION: false,
  AUTO_CROSS_TENANT_LEARNING: false,
  AUTO_PRIVATE_DATA_POOLING: false,
  AUTO_PERMISSION_EXPANSION: false,
  AUTO_GUARDIAN_MODIFICATION: false,
  AUTO_PRODUCTION_DEPLOY: false,
  AUTO_MODEL_RETRAINING: false,
  AUTO_SATELLITE_ACCESS: false,
  AUTO_EXTERNAL_ACTION: false,
} as const;

/** §4 — a classification must never be silently promoted to another. */
export const KNOWLEDGE_CLASSIFICATIONS = [
  'VERIFIED_FACT',
  'PRIMARY_SOURCE',
  'SECONDARY_SOURCE',
  'HISTORICAL_ACCOUNT',
  'SCIENTIFIC_EVIDENCE',
  'EXPERT_INTERPRETATION',
  'CULTURAL_TRADITION',
  'RELIGIOUS_TEXT',
  'MYTHOLOGY',
  'ORAL_HISTORY',
  'OPINION',
  'DISPUTED_CLAIM',
  'MODEL_INFERENCE',
  'PREDICTION',
  'UNKNOWN',
] as const;

/** §16 — access classes. Public knowledge never justifies pooling private data. */
export const KNOWLEDGE_ACCESS_CLASSES = [
  'PUBLIC_KNOWLEDGE',
  'ORGANIZATION_KNOWLEDGE',
  'UNIVERSE_PRIVATE',
  'HUMAN_PRIVATE',
  'RESTRICTED',
  'HIGHLY_RESTRICTED',
] as const;

/** §2 — periods are expandable and regionally overlapping, never a single line. */
export const HISTORICAL_PERIODS = [
  'PREHISTORIC',
  'ANCIENT',
  'CLASSICAL',
  'MEDIEVAL',
  'EARLY_MODERN',
  'INDUSTRIAL_REVOLUTION',
  'MODERN_INDUSTRIAL',
  'INFORMATION_AGE',
  'INTERNET_ERA',
  'CLOUD_ERA',
  'AI_ERA',
  'PRESENT',
] as const;

export const REGIONAL_TIMELINES_MAY_OVERLAP = true;

/** §8 — translation never destroys source lineage. */
export const TRANSLATION_CHAIN = [
  'ORIGINAL',
  'MACHINE_TRANSLATION',
  'VALIDATED_TRANSLATION',
  'CULTURAL_INTERPRETATION',
  'AGENT_INTERPRETATION',
] as const;

/** §17 — lineage backing every consequential conclusion. */
export const KNOWLEDGE_LINEAGE_STAGES = [
  'SOURCE',
  'ACQUISITION',
  'CLASSIFICATION',
  'STORAGE',
  'TRANSLATION',
  'TRANSFORMATION',
  'AGENT_RETRIEVAL',
  'AGENT_REASONING',
  'MEETING',
  'RECOMMENDATION',
  'HUMAN_DECISION',
  'OUTCOME',
] as const;

/** §20 — knowledge moves like freight, including reverse logistics. */
export const KNOWLEDGE_SUPPLY_CHAIN_STAGES = [
  'SUPPLIER',
  'RECEIVING',
  'INSPECTION',
  'WAREHOUSE',
  'INVENTORY',
  'TRANSPORTATION',
  'QUALITY_CONTROL',
  'CUSTOMER',
  'REVERSE_LOGISTICS',
] as const;

/** §22 — retrieval is budgeted; the graph is never loaded wholesale. */
export const RETRIEVAL_PIPELINE = [
  'PROBLEM',
  'DOMAIN_DETECTION',
  'KNOWLEDGE_RETRIEVAL',
  'RELEVANCE_RANKING',
  'PERMISSION_CHECK',
  'CONTEXT_ASSEMBLY',
  'REASONING',
] as const;

/** §24 — quarantine reasons. Untrusted never becomes trusted by default. */
export const QUARANTINE_REASONS = [
  'UNKNOWN_PROVENANCE',
  'MALFORMED_SOURCE',
  'SUSPECTED_MANIPULATION',
  'CONTRADICTORY_METADATA',
  'SECURITY_CONCERN',
  'FAILED_INTEGRITY_VERIFICATION',
  'UNAPPROVED_CLASSIFICATION',
] as const;

/**
 * §26 schema slice.
 *
 * `tenantBearing` decides whether a table needs tenant + Universe RLS or is
 * shared reference data. Getting this wrong fails in both directions: marking
 * reference data tenant-bearing forces every tenant to re-import the historical
 * record, and marking tenant data global leaks private knowledge into a shared
 * layer, which §16 explicitly forbids.
 *
 * `reconcileWith` names a table another story already planned for the same
 * concept. Those must be resolved to one canonical name before any migration.
 */
export type KnowledgeTablePlan = {
  readonly tenantBearing: boolean;
  readonly rationale: string;
  readonly reconcileWith?: string;
};

export const KNOWLEDGE_SCHEMA_PLAN: Readonly<Record<string, KnowledgeTablePlan>> = {
  xiv_knowledge_sources: {
    tenantBearing: true,
    rationale: 'A source carries a licence and rights grant that is per-organization.',
    reconcileWith: 'agent_knowledge_sources',
  },
  xiv_knowledge_objects: {
    tenantBearing: true,
    rationale: 'Holds claims that may be ORGANIZATION_KNOWLEDGE or UNIVERSE_PRIVATE.',
  },
  xiv_knowledge_versions: {
    tenantBearing: true,
    rationale: 'Versions inherit the access class of the object they version.',
  },
  xiv_knowledge_claims: {
    tenantBearing: true,
    rationale: 'Claims are the unit agents retrieve; they inherit object access.',
  },
  xiv_knowledge_contradictions: {
    tenantBearing: true,
    rationale: 'A contradiction references two claims and leaks both if unscoped.',
  },
  xiv_knowledge_translations: {
    tenantBearing: true,
    rationale: 'A translation of private content is private content.',
  },
  xiv_knowledge_lineage: {
    tenantBearing: true,
    rationale: 'Lineage reveals which decision depended on which private source.',
    reconcileWith: 'knowledge_lineage',
  },
  xiv_civilizations: {
    tenantBearing: false,
    rationale: 'Shared historical reference data; no tenant owns a civilization.',
  },
  xiv_historical_periods: {
    tenantBearing: false,
    rationale: 'Shared reference taxonomy with regionally overlapping ranges.',
  },
  xiv_languages: {
    tenantBearing: false,
    rationale: 'Shared reference registry of languages.',
  },
  xiv_professions: {
    tenantBearing: false,
    rationale: 'Shared reference taxonomy of professional domains.',
  },
  xiv_knowledge_domains: {
    tenantBearing: false,
    rationale: 'Shared reference taxonomy; §6 domains are not tenant-specific.',
  },
  xiv_agent_knowledge_access: {
    tenantBearing: true,
    rationale: 'Grants are per agent, per organization, per Universe.',
  },
  xiv_knowledge_evaluations: {
    tenantBearing: true,
    rationale: 'Evaluations reference tenant outcomes and retrieval history.',
  },
  xiv_knowledge_quarantine: {
    tenantBearing: true,
    rationale: 'Quarantined content is untrusted tenant input, not shared data.',
  },
} as const;

/** §27 — required before staging. None demonstrated. */
export const REQUIRED_EVALUATIONS_DEMONSTRATED = {
  sourceAttribution: false,
  translationFidelity: false,
  contradiction: false,
  freshness: false,
  tenantIsolation: false,
  promptInjection: false,
  provenance: false,
  deletionRetention: false,
} as const;

export const INVARIANTS = {
  historicalBeliefIsModernFact: false,
  mythologyIsHistory: false,
  translationIsInterpretation: false,
  culturalContextIsIdentity: false,
  historicalAnalogueIsPrediction: false,
  consensusIsCertainty: false,
  publicKnowledgeJustifiesPrivatePooling: false,
  quarantinedIsTrusted: false,
  newLearningOverwritesProvenance: false,
  oldInformationIsCurrent: false,
  translatorIsCulturallyAuthoritative: false,
  ingestionIsAuthorized: false,
} as const;

export function tenantBearingTables(): string[] {
  return Object.entries(KNOWLEDGE_SCHEMA_PLAN)
    .filter(([, p]) => p.tenantBearing)
    .map(([t]) => t)
    .sort();
}

export function referenceTables(): string[] {
  return Object.entries(KNOWLEDGE_SCHEMA_PLAN)
    .filter(([, p]) => !p.tenantBearing)
    .map(([t]) => t)
    .sort();
}

/** Concepts another story already named differently; resolve before migrating. */
export function unresolvedNameCollisions(): Array<{ planned: string; alsoPlannedAs: string }> {
  return Object.entries(KNOWLEDGE_SCHEMA_PLAN)
    .filter(([, p]) => p.reconcileWith !== undefined)
    .map(([planned, p]) => ({ planned, alsoPlannedAs: p.reconcileWith! }));
}

export function allCapabilityFlagsFalse(): boolean {
  return Object.values(CAPABILITY_FLAGS).every((v) => v === false);
}

export function allAutoFlagsFalse(): boolean {
  return Object.values(AUTO_FLAGS).every((v) => v === false);
}

export function noEvaluationsDemonstrated(): boolean {
  return Object.values(REQUIRED_EVALUATIONS_DEMONSTRATED).every((v) => v === false);
}

export function storyIsImplemented(): boolean {
  return false;
}
