export type OllamaHeartbeatStatus = 'ACTIVE' | 'OFFLINE' | 'UNVERIFIED';

export interface OllamaHeartbeat {
  status: OllamaHeartbeatStatus;
  endpoint: 'http://127.0.0.1:11434';
  modelNames: string[];
  timestamp: string;
  receiptRef?: string;
}

export function classifyOllamaHeartbeat(reachable: boolean, receiptRef?: string): OllamaHeartbeatStatus {
  if (!receiptRef) return 'UNVERIFIED';
  return reachable ? 'ACTIVE' : 'OFFLINE';
}
