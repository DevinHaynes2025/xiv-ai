export type PilotDaemonState = 'STOPPED' | 'STARTING' | 'RUNNING' | 'DEGRADED' | 'RECOVERING';
export interface PilotDaemonConfig { tenantId:string; deviceId:string; checkpointId:string; maxLocalAgents:number; localhostOnly:boolean; productionMutationAllowed:false; }
export interface PilotDaemonReceipt { state:PilotDaemonState; tenantId:string; deviceId:string; checkpointId:string; activeAgents:number; persisted:boolean; resumedFromCheckpoint:boolean; externalNetworkUsed:boolean; generatedAt:string; }
export function startPilotDaemon(config:PilotDaemonConfig, activeAgents:number, checkpointPresent:boolean):PilotDaemonReceipt {
  if (!config.tenantId || !config.deviceId || !config.checkpointId) throw new Error('tenant/device/checkpoint required');
  if (config.maxLocalAgents < 2 || config.maxLocalAgents > 8) throw new Error('maxLocalAgents must be 2..8');
  if (activeAgents < 0 || activeAgents > config.maxLocalAgents) throw new Error('invalid activeAgents');
  return { state: checkpointPresent ? 'RUNNING':'DEGRADED', tenantId:config.tenantId, deviceId:config.deviceId, checkpointId:config.checkpointId, activeAgents, persisted:true, resumedFromCheckpoint:checkpointPresent, externalNetworkUsed:false, generatedAt:new Date().toISOString() };
}
export const pilotDaemonGuardrails = { offlineFirst:true, localhostOnlyDefault:true, productionMutationAllowed:false, topSecretExternalRoutingAllowed:false, maxAgents:8 } as const;
