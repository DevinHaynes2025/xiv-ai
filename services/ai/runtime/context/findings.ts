import type { DataProvenance } from './adapters/types';
import type { ContextSourceLabel } from './types';

export type HealthDomain =
  | 'supply_chain'
  | 'operations'
  | 'inventory'
  | 'warehouse'
  | 'customer'
  | 'finance'
  | 'security'
  | 'people'
  | 'technology';

export type FindingSeverity = 'info' | 'watch' | 'risk' | 'critical';

export type StoryStance = 'observed' | 'inferred' | 'hypothesized' | 'recommended';

export type StoryBeat = {
  step: number;
  label: string;
  stance: StoryStance;
  prototype: true;
};

export type BusinessHealthFinding = {
  findingId: string;
  domain: HealthDomain;
  severity: FindingSeverity;
  title: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  likelyCauses: readonly string[];
  businessImpact: string;
  recommendedActions: readonly string[];
  confidence: 'low' | 'medium' | 'high';
  evidenceQuality: 'sample' | 'prototype';
  sourceLabels: readonly ContextSourceLabel[];
  causalChain: readonly StoryBeat[];
  detectedAt: string;
  prototype: true;
  provenance?: DataProvenance | null;
};

export function findingHasPrototypeLabels(finding: BusinessHealthFinding) {
  return (
    finding.prototype === true &&
    finding.evidenceQuality === 'sample' &&
    finding.sourceLabels.includes('prototype_sample') &&
    finding.causalChain.every((beat) => beat.prototype)
  );
}
