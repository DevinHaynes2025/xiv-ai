export type CapabilityState =
  | 'UNKNOWN'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'VERIFIED'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'NOT_TESTED';

export type RuntimeMode = 'LOCAL' | 'HYBRID' | 'CLOUD';

export type ComputeKind = 'cpu' | 'gpu' | 'npu';

export type ComputeCapability = {
  kind: ComputeKind;
  name?: string;
  vendor?: string;
  state: CapabilityState;
  evidence: string[];
};

export type HardwareSnapshot = {
  capturedAt: string;
  platform: string;
  release: string;
  arch: string;
  hostname?: string;
  totalMemoryBytes: number;
  freeMemoryBytes: number;
  cpu: ComputeCapability;
  gpus: ComputeCapability[];
  npus: ComputeCapability[];
  notes: string[];
};

export type RuntimeHeartbeat = {
  nodeId: string;
  observedAt: string;
  state: 'RUNNING_VERIFIED' | 'WAITING_NODE' | 'OFFLINE_STOPPED' | 'UNKNOWN' | 'STALE';
  detail?: string;
};

export type WorkloadRequirements = {
  requiresVerifiedAccelerator?: boolean;
  preferLocal?: boolean;
  allowCloud?: boolean;
  maxMemoryBytes?: number;
};

export type RouteDecision = {
  mode: RuntimeMode;
  compute: ComputeKind;
  reason: string;
  capabilityState: CapabilityState;
};
