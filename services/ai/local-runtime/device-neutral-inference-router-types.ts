/**
 * 62L-EM7 — Device-Neutral Inference Router contracts.
 *
 * Agents request inference without hard-coding AMD, NVIDIA, CPU, NPU, edge, or cloud paths.
 * Scoring applies only to eligible routes after safeguard gates.
 */

import type { EM7_PRIORITY_BANDS } from './em7-honesty';

export type Em7DeviceKind = 'CPU' | 'GPU' | 'NPU' | 'EDGE' | 'CLOUD';

export type Em7Placement = 'local' | 'edge' | 'cloud';

export type Em7Vendor =
  | 'AMD'
  | 'NVIDIA'
  | 'INTEL'
  | 'APPLE'
  | 'OTHER'
  | 'UNKNOWN'
  | 'MULTI';

export type Em7VerificationState =
  | 'NOT_TESTED'
  | 'UNKNOWN'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'AVAILABLE'
  | 'CONFIGURED'
  | 'VERIFIED'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'WAITING_NODE'
  | 'DENIED';

export type Em7HeartbeatState =
  | 'RUNNING_VERIFIED'
  | 'STALE'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'UNKNOWN';

export type Em7DataClass =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'sovereign';

export type Em7PrivacyRequirement =
  | 'local_only'
  | 'tenant_private'
  | 'hybrid_authorized'
  | 'cloud_forbidden'
  | 'cloud_allowed_explicit';

export type Em7PrivacyState =
  | 'LOCAL'
  | 'TENANT_PRIVATE'
  | 'HYBRID_AUTHORIZED'
  | 'CLOUD_AUTHORIZED'
  | 'DENIED_PRIVACY'
  | 'UNCHANGED';

export type Em7PriorityBand = (typeof EM7_PRIORITY_BANDS)[number];

export type Em7SafeguardDenialCode =
  | 'POLICY_DENIED'
  | 'DATA_CLASSIFICATION_DENIED'
  | 'MODEL_INCOMPATIBLE'
  | 'NOT_TESTED_WHEN_VERIFIED_REQUIRED'
  | 'UNAVAILABLE_WHEN_VERIFIED_REQUIRED'
  | 'STALE_OR_WAITING_HEARTBEAT'
  | 'CROSS_TENANT_DENIED'
  | 'CROSS_UNIVERSE_DENIED'
  | 'CLOUD_WITHOUT_AUTHORIZATION'
  | 'CLOUD_AUTO_PURCHASE_DENIED'
  | 'PRIVACY_DOWNGRADE_DENIED'
  | 'CONSEQUENTIAL_APPROVAL_REQUIRED'
  | 'GOVERNOR_DENIED'
  | 'FALLBACK_NOT_PERMITTED'
  | 'NETWORK_UNAVAILABLE'
  | 'L4_AUTONOMY_DISABLED'
  | 'NO_ELIGIBLE_ROUTE';

export type Em7ReasonCode =
  | Em7SafeguardDenialCode
  | 'SELECTED_LOCAL_VERIFIED_NPU_GPU'
  | 'SELECTED_LOCAL_VERIFIED_CPU'
  | 'SELECTED_AUTHORIZED_EDGE'
  | 'SELECTED_AUTHORIZED_CLOUD'
  | 'PRIORITY_BAND_APPLIED'
  | 'SCORE_WINNER'
  | 'ACCELERATOR_FALLBACK_VISIBLE'
  | 'CPU_FALLBACK_PLAN'
  | 'PRIVACY_REQUIREMENT_PRESERVED'
  | 'VENDOR_NEUTRAL_SELECTION'
  | 'HOME_BASE_RECEIPT_PENDING_EM8';

/** Device-neutral route candidate — same schema for all vendors/placements. */
export type Em7RouteCandidate = {
  nodeId: string;
  device: Em7DeviceKind;
  placement: Em7Placement;
  vendor: Em7Vendor;
  runtimeProvider: string;
  verificationState: Em7VerificationState;
  heartbeatState: Em7HeartbeatState;
  tenantId: string;
  universeScope: string;
  privacyClass: Em7PrivacyRequirement;
  modelIdsCompatible: string[];
  availableRamBytes: number;
  availableVramBytes: number;
  queueDepth: number;
  queueCapacity: number;
  /** Lower is better; omit when unmeasured. */
  measuredLatencyMs?: number;
  /** Lower is better; omit when unmeasured. */
  measuredCostUsd?: number;
  /** Lower is better energy proxy; omit when unmeasured. */
  energyProxy?: number;
  reliabilityScore: number; // 0..1
  networkAvailable: boolean;
  cloudExplicitlyAuthorized: boolean;
  capacityPurchaseAttempted: boolean;
  fallbackAllowed: boolean;
  evidenceRefs: string[];
};

export type Em7InferenceRequest = {
  requestId: string;
  agentId: string;
  tenantId: string;
  universeScope: string;
  modelId: string;
  dataClass: Em7DataClass;
  privacyRequirement: Em7PrivacyRequirement;
  /** When true, only VERIFIED + fresh heartbeat routes may be selected. */
  requireVerifiedExecution: boolean;
  /** Preferred devices are hints only — never hard-coded exclusive paths. */
  preferredDevices?: Em7DeviceKind[];
  allowEdge?: boolean;
  allowCloud?: boolean;
  allowFallback?: boolean;
  consequential?: boolean;
  humanApproved?: boolean;
  policyAllowed?: boolean;
  estimatedRamBytes?: number;
  estimatedVramBytes?: number;
  /** Soft-wire: governor already ALLOW'd this request. */
  governorAllowed?: boolean;
  /** Soft signal that accelerator previously failed — forces visible fallback plan. */
  acceleratorFailed?: boolean;
  /** Attempt to silently lower privacy (must be denied). */
  attemptSilentPrivacyDowngrade?: boolean;
  /** Attempt automatic capacity purchase (must be denied). */
  attemptAutoCapacityPurchase?: boolean;
  now?: string;
};

export type Em7FallbackPlan = {
  enabled: boolean;
  visibleInReceipt: true;
  device: Em7DeviceKind | null;
  runtimeProvider: string | null;
  reason: string;
  /** Soft-wire EM4: fallback must never silently verify the failed accelerator. */
  doesNotVerifyFailedAccelerator: true;
};

export type Em7ScoredRoute = {
  candidate: Em7RouteCandidate;
  eligible: boolean;
  denialCodes: Em7SafeguardDenialCode[];
  priorityBand: Em7PriorityBand | null;
  score: number;
  scoreBreakdown: Record<string, number>;
};

export type Em7RoutingDecision = {
  requestId: string;
  allowed: boolean;
  selectedNode: string | null;
  selectedDevice: Em7DeviceKind | null;
  runtimeProvider: string | null;
  reasonCodes: Em7ReasonCode[];
  estimatedLatency: number | null;
  estimatedCost: number | null;
  privacyState: Em7PrivacyState;
  fallbackPlan: Em7FallbackPlan;
  evidenceRefs: string[];
  priorityBand: Em7PriorityBand | null;
  score: number | null;
  deniedCandidates: Array<{
    nodeId: string;
    device: Em7DeviceKind;
    denialCodes: Em7SafeguardDenialCode[];
  }>;
  coreFlow: typeof import('./em7-honesty').EM7_CORE_FLOW;
  l4AutonomyEnabled: false;
  automaticCapacityPurchase: false;
  silentPrivacyDowngrade: false;
  vendorNeutral: true;
  homeBaseReturn: 'PENDING_EM8_RECEIPT';
  nextPhase: typeof import('./em7-honesty').NEXT_PHASE_EM8;
};
