import type { RuntimeEnvironment } from '../policy';

export type ContextSourceLabel =
  | 'prototype_sample'
  | 'not_connected_erp'
  | 'not_connected_wms'
  | 'not_connected_tms'
  | 'aggregate_people_signal'
  | 'registry';

export type BusinessHealthStatus = 'healthy' | 'watch' | 'strained' | 'unknown';

export type OrganizationContextSlice = {
  id: string;
  name: string;
  industry: string;
  region: string;
};

export type BusinessHealthSlice = {
  status: BusinessHealthStatus;
  score: number;
  summary: string;
  risks: readonly string[];
  opportunities: readonly string[];
};

export type OperationalSignals = {
  inventory: string;
  supplier: string;
  warehouse: string;
  fulfillment: string;
  customerExperience: string;
};

export type PeopleAggregateSlice = {
  identifiedEmployees: false;
  coverage: string;
  climate: string;
};

export type SystemContextSlice = {
  environment: RuntimeEnvironment;
  serviceHealth: 'unknown' | 'reachable' | 'unreachable';
  dataFreshness: 'sample' | 'live' | 'unknown' | 'unavailable';
  sourceLabels: readonly ContextSourceLabel[];
  continuousMonitoring: false;
  dataStatus?: 'live' | 'unavailable' | 'not_configured' | 'stale' | 'prototype';
};

export type BusinessContext = {
  prototype: boolean;
  organization: OrganizationContextSlice;
  businessHealth: BusinessHealthSlice;
  operations: OperationalSignals;
  people: PeopleAggregateSlice;
  system: SystemContextSlice;
};

export type CausalChainStep = {
  label: string;
  prototype: true;
  stance?: 'observed' | 'inferred' | 'hypothesized' | 'recommended';
  step?: number;
};

export type DiagnosticStory = {
  prototype: true;
  whatHappened: string;
  whyItMatters: string;
  likelyCauses: readonly string[];
  businessImpact: string;
  recommendedNextAction: string;
  confidence: 'low' | 'medium' | 'high';
  evidenceQuality: 'sample' | 'prototype';
  sourceLabels: readonly ContextSourceLabel[];
  causalChain: readonly CausalChainStep[];
  disclaimer: string;
};
