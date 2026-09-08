import type { KnowledgeState } from './types';

export type BusinessScenarioKind =
  | 'supplier_failure'
  | 'warehouse_closure'
  | 'demand_spike'
  | 'inventory_shortage'
  | 'routing_disruption'
  | 'capacity_loss'
  | 'pricing_change'
  | 'market_entry'
  | 'acquisition_research'
  | 'competitor_response'
  | 'cloud_outage'
  | 'cyber_incident'
  | 'financial_stress'
  | 'supply_chain_redesign';

export type ScenarioResult = {
  kind: BusinessScenarioKind;
  label: KnowledgeState;
  isFact: boolean;
  createsAuthority: false;
  claimsSentience: false;
  claimsClairvoyance: false;
};

export function runBusinessScenario(input: {
  kind: BusinessScenarioKind;
  label: KnowledgeState;
}) {
  if (input.label === 'SIMULATED' || input.label === 'INFERRED' || input.label === 'UNKNOWN') {
    return {
      allowed: true as const,
      result: {
        kind: input.kind,
        label: input.label,
        isFact: false,
        createsAuthority: false as const,
        claimsSentience: false as const,
        claimsClairvoyance: false as const,
      } satisfies ScenarioResult,
    };
  }
  if (input.label === 'OBSERVED') {
    return { allowed: false as const, reason: 'simulation_cannot_be_labeled_observed_fact' };
  }
  return {
    allowed: true as const,
    result: {
      kind: input.kind,
      label: input.label,
      isFact: false,
      createsAuthority: false as const,
      claimsSentience: false as const,
      claimsClairvoyance: false as const,
    },
  };
}

export function simulationCreatesAuthority(): false {
  return false;
}
