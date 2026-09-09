/**
 * 62L-EM7 honesty locks — Device-Neutral Inference Router.
 *
 * DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * Hardware-neutral: agents must not hard-code AMD / NVIDIA / CPU / NPU / edge / cloud paths.
 * Privacy & correctness before speed. L4_AUTONOMY_ENABLED=false.
 */

export const EM7_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EM7_SOT_TITLE =
  '62L-EM7 — Device-Neutral Inference Router (park-and-implement)' as const;

export const EM7_CORE_FLOW = [
  'AGENT_REQUEST',
  'POLICY',
  'DATA_CLASSIFICATION',
  'MODEL_COMPATIBILITY',
  'COMPUTE_REGISTRY',
  'RESOURCE_GOVERNOR',
  'ROUTE_SCORING',
  'EXECUTE',
  'RETURN_RECEIPT',
  'XIV_HOME_BASE',
] as const;

export const EM7_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const EM7_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  MANAGE_PULL_REQUEST: false as const,
  DB_CANDIDATES_APPLIED: false as const,

  /** NOT_TESTED / UNAVAILABLE / stale nodes cannot win when verified execution is required. */
  NOT_TESTED_SELECTABLE_WHEN_VERIFIED_REQUIRED: false as const,
  UNAVAILABLE_SELECTABLE_WHEN_VERIFIED_REQUIRED: false as const,
  STALE_NODE_SELECTABLE_WHEN_VERIFIED_REQUIRED: false as const,

  /** No cross-tenant data movement for faster compute. */
  CROSS_TENANT_DATA_MOVE_FOR_FASTER_COMPUTE: false as const,
  CROSS_TENANT_COMPUTE_DENY_BY_DEFAULT: true as const,

  /** No cloud spillover / capacity purchase without explicit authorization. */
  CLOUD_SPILLOVER_WITHOUT_EXPLICIT_AUTHORIZATION: false as const,
  AUTOMATIC_CAPACITY_PURCHASE: false as const,

  /** Router cannot silently downgrade privacy requirements. */
  SILENT_PRIVACY_DOWNGRADE: false as const,

  /** Accelerator failure fallback must be visible (EM4 soft-wire). */
  SILENT_ACCELERATOR_FALLBACK: false as const,

  /** Consequential tasks remain approval-gated regardless of compute path. */
  CONSEQUENTIAL_AUTO_EXECUTE: false as const,

  /** Vendor neutrality — no hard-coded AMD/NVIDIA/CPU/NPU exclusive path. */
  HARD_CODED_VENDOR_PATH_REQUIRED: false as const,

  GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT: true as const,
  UNIVERSE_BOUNDARIES_INTACT: true as const,
  HUMAN_APPROVAL_REQUIRED_INTACT: true as const,
});

export const EM7_PRIORITY_BANDS = [
  'LOCAL_VERIFIED_NPU_GPU',
  'LOCAL_VERIFIED_CPU',
  'AUTHORIZED_EDGE',
  'AUTHORIZED_CLOUD',
] as const;

export const EM7_NOT_TESTED_CLAIMS = Object.freeze([
  'founder_asus_live_device_neutral_route',
  'live_multi_vendor_npu_gpu_scoring',
  'authorized_cloud_spillover_live',
  'edge_federation_live_routing',
  'cross_tenant_authorized_compute_live',
] as const);

export const NEXT_PHASE_EM8 =
  'EM8 — Compute Return Receipt — every CPU/GPU/NPU/edge/cloud execution must return proof of what actually ran before XIV accepts the result into Home Base' as const;

export function assertEm7LocksIntact(): boolean {
  return (
    EM7_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM7_LOCKS.NOT_TESTED_SELECTABLE_WHEN_VERIFIED_REQUIRED === false &&
    EM7_LOCKS.UNAVAILABLE_SELECTABLE_WHEN_VERIFIED_REQUIRED === false &&
    EM7_LOCKS.STALE_NODE_SELECTABLE_WHEN_VERIFIED_REQUIRED === false &&
    EM7_LOCKS.CROSS_TENANT_DATA_MOVE_FOR_FASTER_COMPUTE === false &&
    EM7_LOCKS.CROSS_TENANT_COMPUTE_DENY_BY_DEFAULT === true &&
    EM7_LOCKS.CLOUD_SPILLOVER_WITHOUT_EXPLICIT_AUTHORIZATION === false &&
    EM7_LOCKS.AUTOMATIC_CAPACITY_PURCHASE === false &&
    EM7_LOCKS.SILENT_PRIVACY_DOWNGRADE === false &&
    EM7_LOCKS.SILENT_ACCELERATOR_FALLBACK === false &&
    EM7_LOCKS.CONSEQUENTIAL_AUTO_EXECUTE === false &&
    EM7_LOCKS.HARD_CODED_VENDOR_PATH_REQUIRED === false &&
    EM7_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT === true &&
    EM7_LOCKS.UNIVERSE_BOUNDARIES_INTACT === true &&
    EM7_LOCKS.HUMAN_APPROVAL_REQUIRED_INTACT === true &&
    EM7_LOCKS.TIP_LAND === false &&
    EM7_LOCKS.MANAGE_PULL_REQUEST === false
  );
}
