import { requestAgentSelfPromotion, requestAgentSelfToolGrant } from '../everywhere/cyber';
import { defaultDenyUnknownHandoff } from '../security/firewall';
import type { AgentBehaviorState } from './types';

export type AgentBehaviorProfile = { agentId: string; baseline: 'NORMAL' };
export type AgentBehaviorObservation = { agentId: string; state: AgentBehaviorState };
export type AgentRiskSignal = { signalId: string; severity: 'low' | 'medium' | 'high' };
export type AgentToolObservation = { agentId: string; toolId: string };
export type AgentDataAccessObservation = { agentId: string; universeId: string; viaGateway: true };
export type AgentAnomaly = { agentId: string; state: Exclude<AgentBehaviorState, 'NORMAL'> };
export type AgentRestriction = { agentId: string; state: 'RESTRICTED' };
export type AgentQuarantineRequest = { agentId: string; highImpact: boolean; humanReviewRequired: true };
export type AgentSecurityReview = { reviewer: 'human'; destructiveRetaliation: false };

export const AI_VS_AI_MONITORS = [
  'Agent Security Agent',
  'Agent Behavior Monitor',
  'Agent Tool Monitor',
  'Agent Data Monitor',
  'Agent Audit Agent',
] as const;

export const DEFENSE_MESH_LAYERS = ['IDENTITY', 'DATA', 'AGENTS', 'SOC', 'INCIDENTS', 'HUMAN_AUTHORITY'] as const;

export function agentAnomalyBypassesGuardian(state: AgentBehaviorState): boolean {
  void state;
  return defaultDenyUnknownHandoff().allowed === true;
}

export function highImpactQuarantineRequiresHumanReview(): true {
  return true;
}

export function planetaryAgentSelfPromote(): boolean {
  return requestAgentSelfPromotion({
    agentId: 'chief-supply-chain',
    claimedRole: 'Guardian',
    requestedAuthority: 'L4',
  }).allowed;
}

export function planetaryAgentSelfGrantTools(): boolean {
  return requestAgentSelfToolGrant({ agentId: 'warehouse', toolId: 'inventory.write' }).allowed;
}

export function autonomousDestructiveRetaliationAllowed(): false {
  return false;
}

export function requestHighImpactQuarantine(agentId: string): AgentQuarantineRequest {
  return { agentId, highImpact: true, humanReviewRequired: true };
}
