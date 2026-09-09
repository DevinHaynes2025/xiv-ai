/**
 * Interface Evolution Engine — propose UX improvements; no dark patterns.
 */

import { INTERFACE_PROPOSAL_KINDS, type InterfaceProposalKind } from './types';

export type UIObservation = {
  observationId: string;
  surface: string;
  note: string;
};

export type UXFeedback = {
  feedbackId: string;
  userId: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  text: string;
};

export type UserJourney = {
  journeyId: string;
  steps: readonly string[];
};

export type AccessibilityIssue = {
  issueId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
};

export type PerformanceMetric = {
  metricId: string;
  name: string;
  value: number;
  unit: string;
};

export type FeatureUsage = {
  featureId: string;
  count: number;
};

export type InterfaceExperiment = {
  experimentId: string;
  hypothesis: string;
  darkPattern: false;
};

export type UIProposal = {
  proposalId: string;
  kind: InterfaceProposalKind;
  summary: string;
  darkPattern: false;
  autoShipsToProduction: false;
};

export type UIPrototype = {
  prototypeId: string;
  proposalId: string;
  stub: true;
};

export type UXEvaluation = {
  evaluationId: string;
  proposalId: string;
  score: number;
  notes: string;
};

export function listInterfaceProposalKinds(): readonly InterfaceProposalKind[] {
  return INTERFACE_PROPOSAL_KINDS;
}

export function openInterfaceEvolutionEngine(): {
  kinds: readonly InterfaceProposalKind[];
  darkPatternsAllowed: false;
  autoShipToProduction: false;
  productionLive: false;
} {
  return {
    kinds: INTERFACE_PROPOSAL_KINDS,
    darkPatternsAllowed: false,
    autoShipToProduction: false,
    productionLive: false,
  };
}

export function proposeInterfaceChange(input: {
  proposalId: string;
  kind: InterfaceProposalKind;
  summary: string;
}): UIProposal {
  return {
    proposalId: input.proposalId,
    kind: input.kind,
    summary: input.summary,
    darkPattern: false,
    autoShipsToProduction: false,
  };
}

export function darkPatternsAllowed(): false {
  return false;
}

export function interfaceProposalAutoShips(): false {
  return false;
}
