/**
 * 62L-EM4 — CPU/GPU/NPU Message Envelope contracts
 *
 * Core flow:
 * Agent → policy gate → compute registry → resource governor →
 * verified device → execution → signed return receipt → XIV Home Base
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * L4_AUTONOMY_ENABLED=false — no tip-land / PR / cloud purchase / hardware provisioning.
 */

export const EM4_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EM4_SOT_TITLE =
  '62L-EM4 — CPU/GPU/NPU Message Envelope (signed scoped agent-to-compute requests)' as const;

export const EM4_CORE_FLOW = [
  'AGENT',
  'POLICY_GATE',
  'COMPUTE_REGISTRY',
  'RESOURCE_GOVERNOR',
  'VERIFIED_DEVICE',
  'EXECUTION',
  'SIGNED_RETURN_RECEIPT',
  'XIV_HOME_BASE',
] as const;

export const EM4_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  MANAGE_PULL_REQUEST: false as const,
  AUTOMATIC_CLOUD_PURCHASE: false as const,
  HARDWARE_PROVISIONING: false as const,
  DRIVER_BIOS_SECURITY_CONFIG_CHANGES: false as const,
  CROSS_TENANT_DEFAULT: false as const,
  CROSS_UNIVERSE_DEFAULT: false as const,
  CHILD_WIDEN_DEVICE_MODEL_DATA_NETWORK: false as const,
  HIGH_CONSEQUENCE_AUTO_EXECUTE: false as const,
  CPU_SUCCESS_VERIFIES_REQUESTED_ACCELERATOR: false as const,
  SILENT_FALLBACK_WITHOUT_RECEIPT_FLAG: false as const,
});

export const NEXT_PHASE_EM5 =
  'EM5 — AMD Windows ML Adapter Path — map envelopes to Windows/AMD EP candidates; CPU fallback + evidence truth preserved' as const;

export type ComputeDevice = 'CPU' | 'GPU' | 'NPU';

export type VerificationState =
  | 'NOT_TESTED'
  | 'DETECTED'
  | 'AVAILABLE'
  | 'CONFIGURED'
  | 'SUPPORTED'
  | 'MODEL_LOADED'
  | 'INFERENCE_PASSED'
  | 'VERIFIED'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'DENIED';

export type InputDataClass =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'sovereign';

export type PrivacyMode = 'local_only' | 'hybrid_authorized' | 'cloud_forbidden';

export type NetworkPolicy =
  | 'deny_all'
  | 'local_loopback'
  | 'tenant_private'
  | 'explicit_allowlist';

export type ResultState =
  | 'SUCCEEDED'
  | 'FAILED'
  | 'DENIED'
  | 'EXPIRED'
  | 'RECOMMENDATION_ONLY'
  | 'FALLBACK_CPU'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED';

export type Em4FailureClass =
  | null
  | 'EXPIRED'
  | 'BUDGET_EXCEEDED'
  | 'CROSS_TENANT_DENIED'
  | 'CROSS_UNIVERSE_DENIED'
  | 'CHILD_PERMISSION_WIDEN_DENIED'
  | 'HIGH_CONSEQUENCE_RECOMMENDATION_ONLY'
  | 'CLOUD_PURCHASE_DENIED'
  | 'HARDWARE_PROVISIONING_DENIED'
  | 'DRIVER_BIOS_CONFIG_DENIED'
  | 'L4_AUTONOMY_DENIED'
  | 'DEVICE_NOT_VERIFIED'
  | 'REGISTRY_MISS'
  | 'GOVERNOR_DENIED'
  | 'SILENT_FALLBACK_TO_CPU'
  | 'SIGNATURE_INVALID'
  | 'SCHEMA_INVALID'
  | 'NETWORK_POLICY_DENIED'
  | 'PRIVACY_MODE_DENIED'
  | 'EXECUTION_ERROR';

export type ComputeMessageRequest = {
  requestId: string;
  agentId: string;
  parentTaskId: string | null;
  homeUniverseId: string;
  tenantId: string;
  purpose: string;
  modelId: string;
  inputDataClass: InputDataClass;
  requestedDevice: ComputeDevice;
  minimumVerificationState: VerificationState;
  maxRuntimeMs: number;
  maxMemoryMb: number;
  maxConcurrency: number;
  privacyMode: PrivacyMode;
  networkPolicy: NetworkPolicy;
  expiry: string;
  returnPath: string;
};

export type SignedComputeMessageRequest = {
  payload: ComputeMessageRequest;
  signature: string;
  algorithm: 'HMAC-SHA256';
  signedAt: string;
  keyId: string;
};

export type ResourceEvidence = {
  cpuPercentObserved: number | null;
  memoryMbObserved: number | null;
  concurrencyObserved: number | null;
  governorState: string | null;
  notes: readonly string[];
};

export type ComputeReturnReceipt = {
  requestId: string;
  deviceId: string;
  providerRuntime: string;
  actualExecutionDevice: ComputeDevice;
  modelVersionHash: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  resourceEvidence: ResourceEvidence;
  resultState: ResultState;
  fallbackUsed: boolean;
  failureClass: Em4FailureClass;
  evidenceRefs: readonly string[];
  requestedDevice: ComputeDevice;
  acceleratorVerified: boolean;
  homeUniverseId: string;
  tenantId: string;
  agentId: string;
  returnPath: string;
  highConsequenceRecommendationOnly: boolean;
};

export type SignedComputeReturnReceipt = {
  payload: ComputeReturnReceipt;
  signature: string;
  algorithm: 'HMAC-SHA256';
  signedAt: string;
  keyId: string;
};

export type AgentComputeGrant = {
  agentId: string;
  parentAgentId: string | null;
  homeUniverseId: string;
  tenantId: string;
  allowedDevices: readonly ComputeDevice[];
  allowedModels: readonly string[];
  allowedDataClasses: readonly InputDataClass[];
  allowedNetworkPolicies: readonly NetworkPolicy[];
  maxRuntimeMs: number;
  maxMemoryMb: number;
  maxConcurrency: number;
  privacyMode: PrivacyMode;
  highConsequence: boolean;
  allowCrossTenant: boolean;
  allowCrossUniverse: boolean;
  parentGrant: AgentComputeGrant | null;
};

export type PolicyGateDecision =
  | {
      allowed: true;
      reasons: string[];
      highConsequenceRecommendationOnly: boolean;
    }
  | {
      allowed: false;
      denialCode: Em4FailureClass;
      reasons: string[];
      highConsequenceRecommendationOnly: boolean;
    };

export type RegistryDeviceRecord = {
  deviceId: string;
  deviceKind: ComputeDevice;
  verificationState: VerificationState;
  providerRuntime: string;
  modelVersionHash: string;
  present: boolean;
};

export type ExecutionAttempt = {
  actualExecutionDevice: ComputeDevice;
  deviceId: string;
  providerRuntime: string;
  modelVersionHash: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  resourceEvidence: ResourceEvidence;
  executionSucceeded: boolean;
  evidenceRefs: readonly string[];
  errorMessage?: string;
};

export type Em4SoftWireSnapshot = {
  em1HomeBasePresent: boolean;
  em1PathChecked: string;
  em3RegistryPresent: boolean;
  em3PathChecked: string;
  el9GovernorPresent: boolean;
  el9PathChecked: string;
  el7AdapterPresent: boolean;
  el7PathChecked: string;
  el8SilentFallbackPresent: boolean;
  el8PathChecked: string;
  note: string;
};

export type EnvelopePipelineResult = {
  request: SignedComputeMessageRequest;
  policy: PolicyGateDecision;
  receipt: SignedComputeReturnReceipt | null;
  softWire: Em4SoftWireSnapshot;
};

export const DATA_CLASS_RANK: Readonly<Record<InputDataClass, number>> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
  sovereign: 4,
};

export const VERIFICATION_STATE_RANK: Readonly<Record<VerificationState, number>> = {
  NOT_TESTED: 0,
  DETECTED: 1,
  AVAILABLE: 2,
  CONFIGURED: 3,
  SUPPORTED: 4,
  MODEL_LOADED: 5,
  INFERENCE_PASSED: 6,
  VERIFIED: 7,
  DEGRADED: 3,
  UNAVAILABLE: -1,
  DENIED: -2,
};
