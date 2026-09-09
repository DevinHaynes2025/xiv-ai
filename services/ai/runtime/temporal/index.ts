export type {
  AtlasLevel,
  ForecastComputeProvider,
  HistoricalEvidenceClass,
  TemporalClaim,
  TemporalEvidence,
  TemporalPeriod,
  TemporalSource,
  TemporalStance,
  TranslationState,
} from './types';

export {
  archaeologicalEqualsPrimarySource,
  contradictoryTemporalSourcesRemainVisible,
  correctTemporalClaim,
  createTemporalClaim,
  deduplicateTemporalSources,
  disputedClaimStaysDisputed,
  evidenceClassesAreEquivalent,
  laterAccountBecomesContemporary,
  machineTranslationIsVerifiedInterpretation,
  sourceCorrectionPreservesHistory,
} from './graph';
export type { TemporalCorrection } from './graph';

export {
  GLOBAL_THINKER_REGIONS,
  atlasRecord,
  createThinker,
  historicalSupplyChain,
} from './civilization';
export type { CivilizationEntityKind, HistoricalPerson, HistoricalPersonRole, HistoricalSupplyChain } from './civilization';

export {
  ARCHIVE_PROVIDER_REGISTRY,
  HISTORICAL_RESEARCH_AGENTS,
  archiveProviderStatus,
  historicalAgentMayElevateSpeculationToFact,
  libraryProviderRemainsNotConfigured,
} from './archives';

export {
  TEMPORAL_SCALE_LAYERS,
  createForecastScenario,
  createHistoricalAnalogue,
  forecastComputeProvider,
  forecastIsFact,
  historicalAnalogyBecomesForecastFact,
  quantumForecastProviderStatus,
  runSimulation,
  scenarioClaimsCertainty,
  trillionDocumentCapacityProven,
} from './foresight';
export type { ForecastScenario, HistoricalAnalogue, SimulationKind } from './foresight';
