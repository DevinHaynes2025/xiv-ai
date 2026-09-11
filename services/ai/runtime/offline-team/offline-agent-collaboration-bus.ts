export type CollaborationMessageKind = 'PROPOSAL'|'EVIDENCE'|'CHALLENGE'|'DECISION_DRAFT'|'LEARNING';
export interface CollaborationMessage { id:string; tenantId:string; fromAgentId:string; toAgentIds:string[]; kind:CollaborationMessageKind; body:string; evidenceRefs:string[]; createdAt:string; }
export interface CollaborationBusConfig { tenantId:string; allowedAgentIds:string[]; maxAgents:number; localhostOnly:true; }
export function publishCollaborationMessage(config:CollaborationBusConfig, message:CollaborationMessage):CollaborationMessage {
  if (config.maxAgents < 2 || config.maxAgents > 8) throw new Error('maxAgents must be 2..8');
  if (message.tenantId !== config.tenantId) throw new Error('cross-tenant message blocked');
  if (!config.allowedAgentIds.includes(message.fromAgentId)) throw new Error('sender not allowed');
  if (message.toAgentIds.some(id => !config.allowedAgentIds.includes(id))) throw new Error('recipient not allowed');
  if (!message.evidenceRefs.length && message.kind !== 'CHALLENGE') throw new Error('evidence required');
  return message;
}
export const collaborationBusGuardrails = { network:'LOCALHOST_ONLY', autonomousProductionAction:false, dissentPreserved:true, evidenceRequired:true } as const;
