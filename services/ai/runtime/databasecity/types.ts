export type CloudProvider = 'LOCAL' | 'GOOGLE_CLOUD' | 'AZURE';
export type MemoryTier = 'HOT' | 'WARM' | 'COLD' | 'ARCHIVE';
export type BrainLevel = 'DEVICE' | 'COMPANY' | 'REGIONAL' | 'GLOBAL';
export type NodeState = 'OFFLINE' | 'AVAILABLE' | 'DEGRADED' | 'READ_ONLY' | 'QUARANTINED';

export interface DatabaseNode {
  id: string;
  level: BrainLevel;
  provider: CloudProvider;
  region: string;
  tier: MemoryTier;
  state: NodeState;
  writable: boolean;
  vectorCapable: boolean;
  graphCapable: boolean;
  encrypted: boolean;
  tenantId?: string;
  estimatedLatencyMs: number;
  estimatedCostPerMillionOps: number;
}

export interface HighwayRequest {
  tenantId: string;
  requiresWrite: boolean;
  requiresVector: boolean;
  requiresGraph: boolean;
  offlinePreferred: boolean;
  maxLatencyMs: number;
  maxCostPerMillionOps: number;
  allowedProviders: CloudProvider[];
}

export interface HighwayRoute {
  nodeIds: string[];
  totalLatencyMs: number;
  estimatedCostPerMillionOps: number;
  score: number;
}

export interface ReplicationPolicy {
  sourceNodeId: string;
  targetNodeId: string;
  mode: 'EVENTUAL' | 'CHECKPOINT' | 'MANUAL';
  encrypted: true;
  productionAutoApply: false;
}
