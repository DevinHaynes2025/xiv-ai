export type PilotHealth = 'HEALTHY'|'DEGRADED'|'OFFLINE'|'UNVERIFIED';
export interface PilotHealthInput { daemonRunning:boolean; ollamaReachable:boolean; queueDepth:number; checkpointAgeMinutes:number; activeAgents:number; maxAgents:number; storageWritable:boolean; }
export interface PilotHealthReceipt { overall:PilotHealth; checks:Record<string,PilotHealth>; generatedAt:string; }
export function evaluatePilotHealth(input:PilotHealthInput):PilotHealthReceipt {
  const checks:Record<string,PilotHealth> = {
    daemon: input.daemonRunning ? 'HEALTHY':'OFFLINE',
    ollama: input.ollamaReachable ? 'HEALTHY':'UNVERIFIED',
    queue: input.queueDepth < 100 ? 'HEALTHY':'DEGRADED',
    checkpoint: input.checkpointAgeMinutes <= 60 ? 'HEALTHY':'DEGRADED',
    agents: input.activeAgents <= input.maxAgents && input.activeAgents >= 0 ? 'HEALTHY':'DEGRADED',
    storage: input.storageWritable ? 'HEALTHY':'DEGRADED'
  };
  const values = Object.values(checks);
  const overall:PilotHealth = values.includes('OFFLINE') ? 'OFFLINE' : values.includes('DEGRADED') ? 'DEGRADED' : values.includes('UNVERIFIED') ? 'UNVERIFIED' : 'HEALTHY';
  return { overall, checks, generatedAt:new Date().toISOString() };
}
