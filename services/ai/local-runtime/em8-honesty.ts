/**
 * 62L-EM8 honesty locks — Compute Return Receipt.
 *
 * DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * Requested hardware ≠ actual hardware. CPU fallback never verifies NPU/GPU.
 * Finalized receipts are immutable audit artifacts.
 * L4_AUTONOMY_ENABLED=false
 */

export const EM8_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EM8_SOT_TITLE =
  '62L-EM8 — Compute Return Receipt (requested≠actual device honesty + Home Base ingest gate)' as const;

export const EM8_CORE_FLOW = [
  'COMPUTE_REQUEST',
  'RUNTIME_EXECUTION',
  'STRUCTURED_RETURN_RECEIPT',
  'FINALIZE_SIGN',
  'HOME_BASE_INGEST_GATE',
  'NEURAL_PATHWAY_REF',
] as const;

export const EM8_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  MANAGE_PULL_REQUEST: false as const,

  /** Requested accelerator success cannot be inferred from a different device. */
  REQUESTED_EQ_ACTUAL_DEVICE: false as const,
  CPU_FALLBACK_EQ_NPU_VERIFIED: false as const,
  CPU_FALLBACK_EQ_GPU_VERIFIED: false as const,
  SILENT_FALLBACK_WITHOUT_RECEIPT_FLAG: false as const,

  /** Finalized receipts must not be mutated. */
  FINALIZED_RECEIPT_MUTATION_ALLOWED: false as const,

  /** Hidden chain-of-thought is never stored on receipts. */
  HIDDEN_CHAIN_OF_THOUGHT_ON_RECEIPT: false as const,

  /** Tenant / Universe IDs must match the originating request. */
  TENANT_UNIVERSE_MISMATCH_ACCEPT: false as const,

  /** Missing/malformed receipts cannot promote results beyond UNVERIFIED. */
  MISSING_RECEIPT_EQ_VERIFIED: false as const,
  MALFORMED_RECEIPT_EQ_VERIFIED: false as const,

  /** Stale runtime evidence cannot promote hardware capability. */
  STALE_EVIDENCE_PROMOTES_HARDWARE: false as const,

  /** High-consequence outputs still need human approval after compute PASS. */
  HIGH_CONSEQUENCE_AUTO_ACCEPT_ON_PASS: false as const,

  GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT: true as const,
  UNIVERSE_BOUNDARIES_INTACT: true as const,
  HUMAN_APPROVAL_REQUIRED_INTACT: true as const,
});

export const EM8_NOT_TESTED_CLAIMS = Object.freeze([
  'live_multi_node_receipt_mesh',
  'production_kms_receipt_signatures',
  'live_npu_bounded_inference_receipt',
  'live_gpu_bounded_inference_receipt',
  'cross_region_receipt_replication',
] as const);

export const NEXT_PHASE_EM9 =
  'EM9 — Compute Resource Market Simulator — compare verified local/edge/authorized cloud on cost, latency, reliability, privacy, energy proxies before choosing where workloads run' as const;

export function assertEm8LocksIntact(): boolean {
  return (
    EM8_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM8_LOCKS.REQUESTED_EQ_ACTUAL_DEVICE === false &&
    EM8_LOCKS.CPU_FALLBACK_EQ_NPU_VERIFIED === false &&
    EM8_LOCKS.CPU_FALLBACK_EQ_GPU_VERIFIED === false &&
    EM8_LOCKS.SILENT_FALLBACK_WITHOUT_RECEIPT_FLAG === false &&
    EM8_LOCKS.FINALIZED_RECEIPT_MUTATION_ALLOWED === false &&
    EM8_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_ON_RECEIPT === false &&
    EM8_LOCKS.TENANT_UNIVERSE_MISMATCH_ACCEPT === false &&
    EM8_LOCKS.MISSING_RECEIPT_EQ_VERIFIED === false &&
    EM8_LOCKS.MALFORMED_RECEIPT_EQ_VERIFIED === false &&
    EM8_LOCKS.STALE_EVIDENCE_PROMOTES_HARDWARE === false &&
    EM8_LOCKS.HIGH_CONSEQUENCE_AUTO_ACCEPT_ON_PASS === false &&
    EM8_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT === true &&
    EM8_LOCKS.HUMAN_APPROVAL_REQUIRED_INTACT === true &&
    EM8_LOCKS.TIP_LAND === false &&
    EM8_LOCKS.MANAGE_PULL_REQUEST === false
  );
}

export function em8HonestySnapshot() {
  return {
    banner: EM8_HONESTY_BANNER,
    title: EM8_SOT_TITLE,
    locks: EM8_LOCKS,
    coreFlow: EM8_CORE_FLOW,
    nextPhase: NEXT_PHASE_EM9,
    notTested: EM8_NOT_TESTED_CLAIMS,
    l4AutonomyEnabled: false as const,
  };
}
