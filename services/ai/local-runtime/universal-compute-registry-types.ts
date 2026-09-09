/**
 * 62L-EM3 — Universal Compute Registry contracts.
 *
 * One governed registry of CPU / GPU / NPU / edge / authorized-cloud compute.
 * DETECTED hardware is never automatically usable.
 * All vendors share the same evidence model.
 */

import type { CapabilityState } from './types';

/** Promotion chain + side / wait states used by the registry. */
export type ComputeTruthState =
  | CapabilityState
  | 'WAITING_NODE';

export const COMPUTE_TRUTH_PROMOTION = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const satisfies readonly ComputeTruthState[];

export const COMPUTE_TRUTH_SIDE_STATES = [
  'DEGRADED',
  'UNAVAILABLE',
  'NOT_TESTED',
  'WAITING_NODE',
] as const satisfies readonly ComputeTruthState[];

export type DeviceVendor = 'AMD' | 'NVIDIA' | 'INTEL' | 'APPLE' | 'OTHER' | 'UNKNOWN';

export type PlacementClass = 'local' | 'edge' | 'cloud';

export type PrivacyClass = 'private' | 'tenant' | 'shared' | 'public_cloud';

export type DeviceType =
  | 'cpu'
  | 'gpu'
  | 'npu'
  | 'heterogeneous'
  | 'edge'
  | 'cloud_instance';

export type RevocationState = 'ACTIVE' | 'REVOKED';

export type MeasuredEvidenceKind =
  | 'bounded_inference'
  | 'benchmark'
  | 'latency'
  | 'energy'
  | 'cost'
  | 'throughput';

/** Measured evidence — required for performance/cost claims and accelerator VERIFIED. */
export type MeasuredEvidence = {
  kind: MeasuredEvidenceKind;
  metric: string;
  value: number;
  unit: string;
  recordedAt: string;
  evidenceId: string;
  notes?: string;
};

export type ComponentCapability = {
  name?: string;
  vendor?: DeviceVendor;
  /** Truth for this component — never auto-promote DETECTED → VERIFIED. */
  verificationState: ComputeTruthState;
  coresOrUnits?: number;
  memoryBytes?: number;
  evidence: string[];
  measuredEvidence: MeasuredEvidence[];
};

export type CostModel = {
  /** Marketing / catalog claim — not usable as selection evidence alone. */
  claimedCostPerHourUsd?: number;
  /** Measured cost evidence only. */
  measured: MeasuredEvidence[];
  /** Cloud capacity purchase is never automatic. */
  authorizedPurchase: false;
  autoPurchaseEnabled: false;
};

export type CloudAuthorization = {
  /** Explicit authorization required before any cloud node is selectable. */
  explicitlyAuthorized: boolean;
  authorizedBy?: string;
  authorizedAt?: string;
  /** Hard lock — registry cannot auto-purchase capacity. */
  capacityPurchaseAllowed: false;
  autoPurchaseAttempted: false;
};

export type NodeHeartbeatRecord = {
  observedAt: string | null;
  running: boolean | null;
  /** Classified heartbeat outcome (fresh RUNNING_VERIFIED or wait/stale/offline). */
  classifiedState:
    | 'RUNNING_VERIFIED'
    | 'WAITING_NODE'
    | 'OFFLINE_STOPPED'
    | 'UNKNOWN'
    | 'STALE';
  staleAfterMs: number;
};

/**
 * Universal compute node — encode all governed fields.
 * Same schema for AMD / NVIDIA / Intel / Apple / other.
 */
export type ComputeNode = {
  nodeId: string;
  owner: string;
  tenantId: string;
  universeScope: string;
  deviceType: DeviceType;
  vendor: DeviceVendor;
  cpu?: ComponentCapability;
  gpu?: ComponentCapability;
  npu?: ComponentCapability;
  ramBytes?: number;
  storageBytes?: number;
  osRuntime?: string;
  executionProviders: string[];
  placement: PlacementClass;
  privacyClass: PrivacyClass;
  costModel: CostModel;
  latencyEvidence: MeasuredEvidence[];
  energyProxy: MeasuredEvidence | null;
  heartbeat: NodeHeartbeatRecord;
  /** Node-level verification aggregate — never assumes DETECTED usable. */
  verificationState: ComputeTruthState;
  revocationState: RevocationState;
  cloudAuthorization?: CloudAuthorization;
  registeredAt: string;
  updatedAt: string;
};

export type ComputeTaskRequest = {
  taskId: string;
  requestingTenantId: string;
  requestingUniverseScope: string;
  privacyClass: PrivacyClass;
  /** Prefer compatible local compute for private/tenant workloads. */
  preferLocal?: boolean;
  requireAccelerator?: 'gpu' | 'npu' | 'any';
  requireVerifiedAccelerator?: boolean;
  allowCloud?: boolean;
  allowEdge?: boolean;
  /** If true, deny nodes that only claim cost/perf without measured evidence. */
  requireMeasuredPerfOrCostClaims?: boolean;
  now?: string;
};

export type EligibilityDenialCode =
  | 'REVOKED'
  | 'CROSS_TENANT_DENIED'
  | 'CROSS_UNIVERSE_DENIED'
  | 'STALE_OR_WAITING_HEARTBEAT'
  | 'DETECTED_NOT_USABLE'
  | 'ACCELERATOR_NOT_VERIFIED'
  | 'ACCELERATOR_MISSING_BOUNDED_EVIDENCE'
  | 'CLOUD_NOT_AUTHORIZED'
  | 'CLOUD_AUTO_PURCHASE_DENIED'
  | 'CLOUD_NOT_ALLOWED_BY_TASK'
  | 'EDGE_NOT_ALLOWED_BY_TASK'
  | 'PRIVACY_PLACEMENT_MISMATCH'
  | 'PERFORMANCE_CLAIM_WITHOUT_EVIDENCE'
  | 'COST_CLAIM_WITHOUT_EVIDENCE'
  | 'UNAVAILABLE_OR_DEGRADED'
  | 'L4_AUTONOMY_DISABLED'
  | 'NODE_NOT_FOUND';

export type EligibilityResult = {
  eligible: boolean;
  nodeId: string;
  denialCodes: EligibilityDenialCode[];
  reasons: string[];
  usableFromDetectedAlone: false;
  vendorEvidenceModel: 'UNIVERSAL_SAME_FOR_ALL_VENDORS';
};

export type SelectionResult = {
  selected: ComputeNode | null;
  eligibleNodeIds: string[];
  denied: Array<{ nodeId: string; denialCodes: EligibilityDenialCode[]; reasons: string[] }>;
  preferLocalApplied: boolean;
  cloudAutoPurchase: false;
  l4AutonomyEnabled: false;
  reason: string;
};
