/**
 * 62L-EL — Windows Hardware Truth Probe + Local Runtime Verification types.
 *
 * SoT: GitHub #156. GitLab coordination: search-only (not invented if absent).
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * L4_AUTONOMY_ENABLED=false
 *
 * EL1 gate: typed capability registry enums/flags default unknown/false/NOT_TESTED.
 */

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 156 as const;

export const EL_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AMD_GPU_NPU_ROUTE_BEFORE_EL1_EL4: false as const,
  ONNX_MODEL_LOAD_CLAIMED_WITHOUT_EVIDENCE: false as const,
  AGENTS_WORKING_WHILE_NODE_OFF: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE: false as const,
  STEALTH_PERSISTENCE: false as const,
  PERMISSION_BYPASS: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_EXECUTE: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
});

/** Explicit verification / evidence states for hardware + runtime claims. */
export type EvidenceState =
  | 'UNKNOWN'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'VERIFIED'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'NOT_TESTED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'STALE'
  | 'DENIED'
  | 'PASS'
  | 'FAIL'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'RUNNING_VERIFIED'
  | 'NOT_APPLIED'
  | 'WAITING_DATA';

export type CapabilityKind =
  | 'CPU'
  | 'GPU'
  | 'NPU'
  | 'WINDOWS_ML'
  | 'AMD_EP'
  | 'MODEL_LOAD'
  | 'ONNX_RUNTIME'
  | 'WINDOWS_OS';

/** Probe / routing boolean flags — default false or unknown until evidence. */
export const CAPABILITY_FLAGS = Object.freeze([
  'CPU_DETECTED',
  'GPU_DETECTED',
  'NPU_DETECTED',
  'WINDOWS_ML_SUPPORTED',
  'AMD_EP_SUPPORTED',
  'MODEL_LOAD_VERIFIED',
  'ONNX_LOAD_VERIFIED',
  'WINDOWS_LOCAL_INFERENCE_VERIFIED',
  'AMD_GPU_ACCELERATION_VERIFIED',
  'AMD_NPU_ACCELERATION_VERIFIED',
  'ASUS_HARDWARE_MODEL_VERIFIED',
  'OFFLINE_AGENTS_VERIFIED',
  'PHYSICAL_QUANTUM_HARDWARE_VERIFIED',
  'MICROSOFT_DESKTOP_INTEGRATION_VERIFIED',
] as const);

export type CapabilityFlag = (typeof CAPABILITY_FLAGS)[number];

export type FlagValue = boolean | 'unknown';

/** Default registry: unknown/false/NOT_TESTED — never assume VERIFIED. */
export function defaultCapabilityFlags(): Record<CapabilityFlag, FlagValue> {
  return {
    CPU_DETECTED: 'unknown',
    GPU_DETECTED: 'unknown',
    NPU_DETECTED: 'unknown',
    WINDOWS_ML_SUPPORTED: 'unknown',
    AMD_EP_SUPPORTED: 'unknown',
    MODEL_LOAD_VERIFIED: false,
    ONNX_LOAD_VERIFIED: false,
    WINDOWS_LOCAL_INFERENCE_VERIFIED: false,
    AMD_GPU_ACCELERATION_VERIFIED: false,
    AMD_NPU_ACCELERATION_VERIFIED: false,
    ASUS_HARDWARE_MODEL_VERIFIED: false,
    OFFLINE_AGENTS_VERIFIED: false,
    PHYSICAL_QUANTUM_HARDWARE_VERIFIED: false,
    MICROSOFT_DESKTOP_INTEGRATION_VERIFIED: false,
  };
}

export function defaultCapabilityStates(): Record<CapabilityKind, EvidenceState> {
  return {
    CPU: 'NOT_TESTED',
    GPU: 'NOT_TESTED',
    NPU: 'NOT_TESTED',
    WINDOWS_ML: 'NOT_TESTED',
    AMD_EP: 'NOT_TESTED',
    MODEL_LOAD: 'NOT_TESTED',
    ONNX_RUNTIME: 'NOT_TESTED',
    WINDOWS_OS: 'NOT_TESTED',
  };
}

export type CapabilityRegistry = {
  flags: Record<CapabilityFlag, FlagValue>;
  states: Record<CapabilityKind, EvidenceState>;
  updatedAt: string;
};

export function createCapabilityRegistry(
  partial?: Partial<{
    flags: Partial<Record<CapabilityFlag, FlagValue>>;
    states: Partial<Record<CapabilityKind, EvidenceState>>;
  }>,
): CapabilityRegistry {
  return {
    flags: { ...defaultCapabilityFlags(), ...partial?.flags },
    states: { ...defaultCapabilityStates(), ...partial?.states },
    updatedAt: new Date().toISOString(),
  };
}

export const EL_GATES = Object.freeze(['EL1', 'EL2', 'EL3', 'EL4'] as const);
export type ElGateId = (typeof EL_GATES)[number];

export type ElGateStatus = {
  gate: ElGateId;
  status: 'PASS' | 'FAIL' | 'PENDING';
  evidence: string;
  at: string;
};

export type AmdRouteTarget = 'amd_cpu' | 'amd_gpu' | 'amd_npu';

export type RouteDecision = {
  allowed: boolean;
  target: AmdRouteTarget | 'cpu_baseline' | 'cloud' | 'none';
  reason: string;
  state: EvidenceState;
  requiresProbeFlags: CapabilityFlag[];
  el1El4Required: true;
  amdInferenceClaimed: false;
};

export type ClassicalBenchmarkResult = {
  id: string;
  target: 'cpu';
  metric: string;
  value: number;
  unit: string;
  passed: boolean;
  state: EvidenceState;
  quantumComparisonAllowed: false;
  reason: string;
  at: string;
};

export type HeartbeatState =
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'STALE'
  | 'UNKNOWN';

export type RuntimeHeartbeat = {
  nodeId: string;
  observedAt: string;
  state: HeartbeatState;
  detail: string;
  agentsClaimedWorkingWhileOff: false;
};

export type OnnxAdapterStatus = {
  adapter: 'onnx_local_runtime';
  contractReady: boolean;
  loadState: EvidenceState;
  reason: string;
  modelLoadVerified: false | true;
};

export const PREFERRED_LOCAL_STACK = Object.freeze([
  'ASUS_HARDWARE',
  'WINDOWS_11',
  'WINDOWS_ML',
  'ONNX_RUNTIME',
  'AMD_CPU_GPU_NPU_EP',
  'XIV_LOCAL_RUNTIME',
] as const);

export const NOT_TESTED_UNTIL_LOCAL_EVIDENCE = Object.freeze([
  'founder_asus_hardware_model',
  'amd_gpu_acceleration',
  'npu_acceleration',
  'windows_local_inference',
  'offline_running_agents',
  'onnx_model_loading',
  'physical_quantum_hardware',
  'microsoft_desktop_integrations',
] as const);

export const MAY_TREAT_AS_EXISTING_IN_REPO = Object.freeze([
  'agent_service_code_exists',
  'authorization_tool_allowlists',
  'auto_execution_disabled',
  'human_approval_logic',
  'secret_redaction_diagnostics',
] as const);
