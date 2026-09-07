export { buildForesightReport, hypothesizedRemainsHypothesized, projectScenario, stanceIsNotFact } from './engine';
export type {
  ForesightReport,
  ForesightSignal,
  ForesightStance,
  LeadingIndicator,
  OpportunityTrajectory,
  RiskTrajectory,
  Scenario,
} from './types';
export {
  createForesightProvider,
  forecastRequiresEvidence,
  foresightIsCertain,
  productionForesightEnabled,
} from './provider';
export type {
  ComparableCompanyPattern,
  ForecastConfidence,
  ForecastRange,
  ForesightClaimKind,
  ForesightProvider,
  ForesightQuery,
  ForesightRecommendation,
  HistoricalSimilarity,
  OpportunitySignal,
  RiskSignal,
  ScenarioAssumption,
  ScenarioEvidence,
} from './provider';
