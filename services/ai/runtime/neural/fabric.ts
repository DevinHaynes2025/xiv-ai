import type { NeuralConnectionState } from './types';
import type { GovernedMind } from './minds';

export type NeuralFabric = {
  fabricId: string;
  productionLive: false;
  createsPrivilege: false;
};

export type NeuralNode = { nodeId: string; mindId: string };
export type NeuralRoute = { routeId: string; from: string; to: string };
export type NeuralMessage = {
  messageId: string;
  fromMind: string;
  toMind: string;
  tenantId: string;
  universeId: string;
  classification: string;
  purpose: string;
};
export type NeuralContext = { sanitized: true; rawMemoryShared: false };
export type NeuralPermission = { authorized: boolean };
export type NeuralPurpose = { purpose: string };
export type NeuralEvidence = { evidenceId: string; verifiedByConsensus: false };
export type NeuralConfidence = 'low' | 'medium' | 'high' | 'unknown';
export type NeuralConflict = { retained: true };
export type NeuralConsensus = { createsVerifiedEvidence: false };
export type NeuralAudit = { eventId: string };
export type NeuralHealth = { state: NeuralConnectionState };

export type NeuralConnection = {
  connectionId: string;
  from: GovernedMind;
  to: GovernedMind;
  state: NeuralConnectionState;
  guardianPassed: boolean;
  cognitiveGatePassed: boolean;
  neuralFirewallPassed: boolean;
  sharesUnrestrictedMemory: false;
};

export function openNeuralFabric(): NeuralFabric {
  return { fabricId: 'neural-fabric', productionLive: false, createsPrivilege: false };
}

export function availableIsAuthorized(state: NeuralConnectionState): boolean {
  return state === 'AUTHORIZED' || state === 'ACTIVE';
}

export function requestNeuralConnection(input: {
  from: GovernedMind;
  to: GovernedMind;
  guardianApproved: boolean;
  cognitiveGateCleared: boolean;
  firewallCleared: boolean;
  purpose: string;
  classification: string;
  sameTenant: boolean;
  sameUniverse: boolean;
  fromHealth?: GovernedMind['healthState'];
}): { allowed: false; reason: string } | { allowed: true; connection: NeuralConnection } {
  if (input.fromHealth === 'QUARANTINED' || input.from.healthState === 'QUARANTINED') {
    return { allowed: false, reason: 'quarantined_mind_denied' };
  }
  if (!input.sameTenant) return { allowed: false, reason: 'cross_tenant_route_denied' };
  if (!input.sameUniverse) return { allowed: false, reason: 'cross_universe_route_denied' };
  if (!input.guardianApproved) return { allowed: false, reason: 'neural_route_requires_guardian' };
  if (!input.cognitiveGateCleared) return { allowed: false, reason: 'cognitive_security_gate_blocked' };
  if (!input.firewallCleared) return { allowed: false, reason: 'neural_firewall_blocked' };
  if (!input.purpose) return { allowed: false, reason: 'purpose_required' };
  if (!input.classification) return { allowed: false, reason: 'classification_required' };

  return {
    allowed: true,
    connection: {
      connectionId: `nc:${input.from.mindId}:${input.to.mindId}`,
      from: input.from,
      to: input.to,
      state: 'AUTHORIZED',
      guardianPassed: true,
      cognitiveGatePassed: true,
      neuralFirewallPassed: true,
      sharesUnrestrictedMemory: false,
    },
  };
}

export function proposeAdaptiveRoute(input: {
  observedUsefulness: boolean;
  sandboxed: boolean;
  securityReviewed: boolean;
  governanceApproved: boolean;
}) {
  if (!(input.observedUsefulness && input.sandboxed && input.securityReviewed && input.governanceApproved)) {
    return { allowed: false as const, reason: 'adaptive_route_cannot_self_approve' };
  }
  return { allowed: true as const, state: 'AUTHORIZED' as const, selfApproved: false as const };
}

export function aiConsensusCreatesVerifiedEvidence(): false {
  return false;
}

export function neuralBridgeGrantsExtraDataAccess(): false {
  return false;
}
