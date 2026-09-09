/**
 * 62L-EM3 honesty locks — Universal Compute Registry.
 *
 * DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * DETECTED ≠ VERIFIED; silent fallback ≠ accelerator verify
 * L4_AUTONOMY_ENABLED=false
 */

export const EM3_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EM3_SOT_TITLE =
  '62L-EM3 — Universal Compute Registry (CPU/GPU/NPU/edge/authorized-cloud)' as const;

export const EM3_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const EM3_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  DETECTED_EQ_USABLE: false as const,
  SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED: false as const,
  VENDOR_SPECIAL_CASE_EVIDENCE_FORBIDDEN: true as const,
  GPU_NPU_VERIFIED_WITHOUT_BOUNDED_INFERENCE_OR_BENCHMARK: false as const,
  CLOUD_AUTO_PURCHASE_FORBIDDEN: true as const,
  CLOUD_WITHOUT_EXPLICIT_AUTHORIZATION_FORBIDDEN: true as const,
  CROSS_TENANT_COMPUTE_DENY_BY_DEFAULT: true as const,
  CROSS_TENANT_DATA_DENY_BY_DEFAULT: true as const,
  STALE_HEARTBEAT_REMAINS_RUNNING_VERIFIED: false as const,
  REVOKED_DEVICE_ELIGIBLE_FOR_NEW_TASKS: false as const,
  PERFORMANCE_CLAIM_WITHOUT_MEASURED_EVIDENCE: false as const,
  COST_CLAIM_WITHOUT_MEASURED_EVIDENCE: false as const,
  GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT: true as const,
  UNIVERSE_BOUNDARIES_INTACT: true as const,
  HUMAN_APPROVAL_REQUIRED_INTACT: true as const,
  ASSUME_HARDWARE_USABLE_FROM_DETECTED_ALONE: false as const,
});

export const EM3_NOT_TESTED_CLAIMS = Object.freeze([
  'founder_asus_live_node_registry',
  'amd_gpu_acceleration_live',
  'nvidia_gpu_acceleration_live',
  'intel_npu_acceleration_live',
  'apple_neural_engine_live',
  'authorized_cloud_capacity_live',
  'cross_edge_federation_live',
] as const);

export function assertEm3LocksIntact(): boolean {
  return (
    EM3_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM3_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EM3_LOCKS.DETECTED_EQ_USABLE === false &&
    EM3_LOCKS.SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED === false &&
    EM3_LOCKS.VENDOR_SPECIAL_CASE_EVIDENCE_FORBIDDEN === true &&
    EM3_LOCKS.GPU_NPU_VERIFIED_WITHOUT_BOUNDED_INFERENCE_OR_BENCHMARK === false &&
    EM3_LOCKS.CLOUD_AUTO_PURCHASE_FORBIDDEN === true &&
    EM3_LOCKS.CLOUD_WITHOUT_EXPLICIT_AUTHORIZATION_FORBIDDEN === true &&
    EM3_LOCKS.CROSS_TENANT_COMPUTE_DENY_BY_DEFAULT === true &&
    EM3_LOCKS.STALE_HEARTBEAT_REMAINS_RUNNING_VERIFIED === false &&
    EM3_LOCKS.REVOKED_DEVICE_ELIGIBLE_FOR_NEW_TASKS === false &&
    EM3_LOCKS.ASSUME_HARDWARE_USABLE_FROM_DETECTED_ALONE === false &&
    EM3_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT === true &&
    EM3_LOCKS.TIP_LAND === false
  );
}
