export type ForesightStance = 'observed' | 'inferred' | 'projected' | 'hypothesized' | 'recommended';

export type ForesightSignal = {
  signalId: string;
  label: string;
  stance: ForesightStance;
  direction: 'up' | 'down' | 'unclear';
  confidence: 'low' | 'medium' | 'high';
  evidenceRefs: readonly string[];
};

export type LeadingIndicator = {
  id: string;
  name: string;
  stance: ForesightStance;
  available: boolean;
};

export type RiskTrajectory = {
  id: string;
  label: string;
  stance: 'projected' | 'hypothesized';
  direction: 'up' | 'down' | 'unclear';
};

export type OpportunityTrajectory = {
  id: string;
  label: string;
  stance: 'projected' | 'hypothesized';
  direction: 'up' | 'down' | 'unclear';
};

export type Scenario = {
  scenarioId: string;
  question: string;
  assumptions: readonly string[];
  knownData: readonly string[];
  missingData: readonly string[];
  estimatedDirection: 'up' | 'down' | 'unclear';
  confidence: 'low' | 'medium' | 'high';
  dependencies: readonly string[];
  unsupportedClaims: readonly string[];
  financialImpactInvented: false;
  stance: 'projected';
};

export type ForesightReport = {
  signals: readonly ForesightSignal[];
  scenarios: readonly Scenario[];
  indicators: readonly LeadingIndicator[];
  risks: readonly RiskTrajectory[];
  opportunities: readonly OpportunityTrajectory[];
  prototype: true;
};
