/**
 * 62L-EM6 honesty locks — NVIDIA Runtime Candidate Path.
 *
 * DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * Detecting NVIDIA GPU ≠ proving CUDA or TensorRT works.
 * NVIDIA remains INTEGRATION_CANDIDATE until bounded evidence exists.
 * L4_AUTONOMY_ENABLED=false
 */

export const EM6_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EM6_SOT_TITLE =
  '62L-EM6 — NVIDIA Runtime Candidate Path (governed adapter + truth gates)' as const;

/** Adapter posture until measured bounded inference on the requested NVIDIA path. */
export const EM6_INTEGRATION_STATUS = 'INTEGRATION_CANDIDATE' as const;

export const EM6_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const EM6_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  DB_CANDIDATES_APPLIED: false as const,

  /** Detecting a GPU never equals CUDA/TensorRT proven or VERIFIED. */
  NVIDIA_DETECTED_EQ_CUDA_WORKS: false as const,
  NVIDIA_DETECTED_EQ_TENSORRT_WORKS: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  DETECTED_EQ_USABLE: false as const,

  /** Silent / CPU fallback cannot verify the NVIDIA path. */
  SILENT_FALLBACK_EQ_NVIDIA_VERIFIED: false as const,
  CPU_FALLBACK_EQ_NVIDIA_VERIFIED: false as const,

  /** Agents cannot auto-install or change privileged system state. */
  CUDA_AUTO_INSTALL_FORBIDDEN: true as const,
  DRIVER_AUTO_INSTALL_FORBIDDEN: true as const,
  TENSORRT_AUTO_INSTALL_FORBIDDEN: true as const,
  SYSTEM_PACKAGE_AUTO_INSTALL_FORBIDDEN: true as const,
  OVERCLOCK_FORBIDDEN: true as const,
  BIOS_MODIFICATION_FORBIDDEN: true as const,
  THERMAL_LIMIT_BYPASS_FORBIDDEN: true as const,
  PRIVILEGED_CONFIG_CHANGE_FORBIDDEN: true as const,

  /** Cloud NVIDIA requires separate authorization + spend controls. */
  CLOUD_NVIDIA_AUTO_PURCHASE_FORBIDDEN: true as const,
  CLOUD_WITHOUT_EXPLICIT_AUTHORIZATION_FORBIDDEN: true as const,
  CLOUD_WITHOUT_SPEND_CONTROLS_FORBIDDEN: true as const,

  /** Private/tenant data cannot move to another node without explicit auth. */
  PRIVATE_TENANT_DATA_CROSS_NODE_WITHOUT_AUTH_FORBIDDEN: true as const,

  /** Multi-GPU routing remains NOT_TESTED until measured. */
  MULTI_GPU_ROUTING_ASSUMED_VERIFIED: false as const,

  GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT: true as const,
  UNIVERSE_BOUNDARIES_INTACT: true as const,
  HUMAN_APPROVAL_REQUIRED_INTACT: true as const,
});

export const EM6_NOT_TESTED_CLAIMS = Object.freeze([
  'live_nvidia_gpu_bounded_inference',
  'cuda_runtime_on_requested_path',
  'tensorrt_or_tensorrt_llm_on_requested_path',
  'multi_gpu_routing',
  'authorized_cloud_nvidia_capacity_live',
  'cross_vendor_cpu_amd_nvidia_benchmark_suite_measured',
] as const);

export function assertEm6LocksIntact(): boolean {
  return (
    EM6_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM6_LOCKS.NVIDIA_DETECTED_EQ_CUDA_WORKS === false &&
    EM6_LOCKS.NVIDIA_DETECTED_EQ_TENSORRT_WORKS === false &&
    EM6_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EM6_LOCKS.SILENT_FALLBACK_EQ_NVIDIA_VERIFIED === false &&
    EM6_LOCKS.CPU_FALLBACK_EQ_NVIDIA_VERIFIED === false &&
    EM6_LOCKS.CUDA_AUTO_INSTALL_FORBIDDEN === true &&
    EM6_LOCKS.DRIVER_AUTO_INSTALL_FORBIDDEN === true &&
    EM6_LOCKS.TENSORRT_AUTO_INSTALL_FORBIDDEN === true &&
    EM6_LOCKS.SYSTEM_PACKAGE_AUTO_INSTALL_FORBIDDEN === true &&
    EM6_LOCKS.OVERCLOCK_FORBIDDEN === true &&
    EM6_LOCKS.BIOS_MODIFICATION_FORBIDDEN === true &&
    EM6_LOCKS.THERMAL_LIMIT_BYPASS_FORBIDDEN === true &&
    EM6_LOCKS.PRIVILEGED_CONFIG_CHANGE_FORBIDDEN === true &&
    EM6_LOCKS.CLOUD_NVIDIA_AUTO_PURCHASE_FORBIDDEN === true &&
    EM6_LOCKS.MULTI_GPU_ROUTING_ASSUMED_VERIFIED === false &&
    EM6_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT === true &&
    EM6_LOCKS.TIP_LAND === false
  );
}
