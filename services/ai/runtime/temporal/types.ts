export type TemporalPeriod =
  | 'PREHISTORY'
  | 'EARLY_CIVILIZATIONS'
  | 'ANCIENT_COMMERCE'
  | 'CLASSICAL_WORLD'
  | 'MEDIEVAL_TRADE'
  | 'EARLY_MODERN_ECONOMY'
  | 'INDUSTRIAL_REVOLUTION'
  | 'GLOBAL_INDUSTRIALIZATION'
  | 'TWENTIETH_CENTURY'
  | 'DIGITAL_ECONOMY'
  | 'AI_ECONOMY'
  | 'PRESENT'
  | 'SCENARIO';

export type HistoricalEvidenceClass =
  | 'DIRECT_PRIMARY_SOURCE'
  | 'CONTEMPORARY_RECORD'
  | 'ARCHAEOLOGICAL_EVIDENCE'
  | 'ACADEMIC_SOURCE'
  | 'LATER_HISTORICAL_ACCOUNT'
  | 'RECONSTRUCTION'
  | 'ORAL_HISTORY'
  | 'DISPUTED'
  | 'UNKNOWN';

export type TranslationState =
  | 'ORIGINAL'
  | 'MACHINE_TRANSLATED'
  | 'SCHOLAR_TRANSLATED'
  | 'HUMAN_REVIEWED'
  | 'UNCERTAIN'
  | 'UNAVAILABLE';

export type TemporalStance = 'FACT' | 'INFERENCE' | 'SCENARIO' | 'FORECAST' | 'SPECULATION';

export type ForecastComputeProvider =
  | 'CPU'
  | 'GPU'
  | 'DISTRIBUTED'
  | 'NVIDIA'
  | 'SPECIALIZED_ACCELERATOR'
  | 'QUANTUM_FUTURE';

export type AtlasLevel = 'WORLD' | 'COUNTRY' | 'REGION' | 'STATE' | 'COUNTY' | 'CITY' | 'DISTRICT' | 'SITE';

export type TemporalSource = {
  institution: string;
  collection: string | null;
  document: string;
  retrievedAt: string;
  license: string;
  language: string;
};

export type TemporalEvidence = {
  evidenceClass: HistoricalEvidenceClass;
  source: TemporalSource;
  translationState: TranslationState;
};

export type TemporalClaim = {
  claimId: string;
  text: string;
  validFrom: string | null;
  validTo: string | null;
  geography: string;
  civilization: string | null;
  language: string;
  evidence: TemporalEvidence;
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  disputed: boolean;
  equivalentToPrimary: false;
};
