/**
 * 62L-EM5 honesty locks — AMD Windows ML Adapter Path.
 *
 * DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * DETECTED / SUPPORTED ≠ verified inference hardware
 * Silent CPU fallback must be recorded explicitly (EL8 soft-wire)
 * L4_AUTONOMY_ENABLED=false
 */

export const EM5_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EM5_SOT_TITLE =
  '62L-EM5 — AMD Windows ML Adapter Path (Windows ML / ONNX Runtime / AMD EP)' as const;

export const EM5_CORE_FLOW = [
  'AGENT_COMPUTE_ENVELOPE',
  'POLICY_GATE',
  'UNIVERSAL_COMPUTE_REGISTRY',
  'AMD_WINDOWS_ML_ADAPTER',
  'ACTUAL_EXECUTION_PROVIDER',
  'RETURN_RECEIPT',
  'XIV_HOME_BASE',
] as const;

export const EM5_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const EM5_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  MANAGE_PULL_REQUEST: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  /** DETECTED or SUPPORTED never equals verified inference hardware. */
  DETECTED_OR_SUPPORTED_EQ_VERIFIED_INFERENCE_HARDWARE: false as const,
  SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED: false as const,
  SILENT_FALLBACK_WITHOUT_RECEIPT_FLAG: false as const,
  AMD_GPU_VERIFIED_WITHOUT_BOUNDED_INFERENCE_ON_EXACT_EP: false as const,
  AMD_NPU_VERIFIED_WITHOUT_BOUNDED_INFERENCE_ON_EXACT_EP: false as const,
  FAKE_LIVE_ASUS_VERIFICATION: false as const,
  DRIVER_INSTALL_FORBIDDEN: true as const,
  BIOS_OVERCLOCK_FORBIDDEN: true as const,
  PRIVILEGE_ESCALATION_FORBIDDEN: true as const,
  HIDDEN_PERSISTENCE_FORBIDDEN: true as const,
  AUTOMATIC_MODEL_DOWNLOAD_FORBIDDEN: true as const,
  CLOUD_ESCALATION_FORBIDDEN: true as const,
  GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT: true as const,
  UNIVERSE_BOUNDARIES_INTACT: true as const,
  HUMAN_APPROVAL_REQUIRED_INTACT: true as const,
  AUTH_BYPASS: false as const,
});

export const EM5_NOT_TESTED_CLAIMS = Object.freeze([
  'founder_asus_amd_windows_ml_live',
  'amd_gpu_windows_ml_verified_live',
  'amd_npu_windows_ml_verified_live',
  'onnx_amd_ep_live_inference',
  'windows_ml_session_live',
] as const);

export const NEXT_PHASE_EM6 =
  'EM6 — NVIDIA Runtime Candidate Path — same evidence-first contract for NVIDIA GPUs / TensorRT-compatible inference' as const;

export function assertEm5LocksIntact(): boolean {
  return (
    EM5_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM5_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EM5_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EM5_LOCKS.DETECTED_OR_SUPPORTED_EQ_VERIFIED_INFERENCE_HARDWARE === false &&
    EM5_LOCKS.SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED === false &&
    EM5_LOCKS.SILENT_FALLBACK_WITHOUT_RECEIPT_FLAG === false &&
    EM5_LOCKS.AMD_GPU_VERIFIED_WITHOUT_BOUNDED_INFERENCE_ON_EXACT_EP === false &&
    EM5_LOCKS.AMD_NPU_VERIFIED_WITHOUT_BOUNDED_INFERENCE_ON_EXACT_EP === false &&
    EM5_LOCKS.FAKE_LIVE_ASUS_VERIFICATION === false &&
    EM5_LOCKS.DRIVER_INSTALL_FORBIDDEN === true &&
    EM5_LOCKS.BIOS_OVERCLOCK_FORBIDDEN === true &&
    EM5_LOCKS.PRIVILEGE_ESCALATION_FORBIDDEN === true &&
    EM5_LOCKS.HIDDEN_PERSISTENCE_FORBIDDEN === true &&
    EM5_LOCKS.AUTOMATIC_MODEL_DOWNLOAD_FORBIDDEN === true &&
    EM5_LOCKS.CLOUD_ESCALATION_FORBIDDEN === true &&
    EM5_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT === true &&
    EM5_LOCKS.UNIVERSE_BOUNDARIES_INTACT === true &&
    EM5_LOCKS.HUMAN_APPROVAL_REQUIRED_INTACT === true &&
    EM5_LOCKS.TIP_LAND === false &&
    EM5_LOCKS.MANAGE_PULL_REQUEST === false
  );
}
