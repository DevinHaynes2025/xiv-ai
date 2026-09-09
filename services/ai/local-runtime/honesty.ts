/**
 * 62L-EM honesty locks — soft-wire EL invariants + EK-style non-claims.
 *
 * DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * L4_AUTONOMY_ENABLED=false
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

/** DB migration candidates for EM remain NOT_APPLIED. */
export const EM_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

/** Founder queue SoT title — no GitHub # invented (search returned none at implement time). */
export const EM_SOT_TITLE =
  '62L-EM — Local Model Verification + ONNX/Windows ML Adapter + AMD Accelerator Benchmark + Agent Runtime Heartbeat API + Classical Quant Benchmark Suite' as const;

export const EM_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_EXECUTE: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  MODEL_LOAD_VERIFIED_WITHOUT_EVIDENCE: false as const,
  ONNX_SUCCESS_WITHOUT_INFERENCE: false as const,
  AMD_ACCELERATOR_VERIFIED_WITHOUT_BENCHMARK: false as const,
  AGENTS_WORKING_WHILE_NODE_OFF: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE: false as const,
  ASUS_AMD_ONNX_CLAIMED_WITHOUT_MEASUREMENT: false as const,
  AUTOMATIC_HIGH_RISK_EXECUTION: false as const,
});

/** Claims that remain NOT_TESTED until measured on a real authorized node. */
export const EM_NOT_TESTED_CLAIMS = Object.freeze([
  'founder_asus_hardware_model',
  'amd_gpu_acceleration',
  'amd_npu_acceleration',
  'windows_local_inference',
  'offline_running_agents',
  'onnx_model_loading',
  'windows_ml_path',
  'physical_quantum_hardware',
  'microsoft_desktop_integrations',
] as const);

export type EmHonestySnapshot = {
  banner: typeof HONESTY_BANNER;
  locks: typeof EM_LOCKS;
  notTestedClaims: typeof EM_NOT_TESTED_CLAIMS;
  elLocalRuntimePresent: true;
  ekHonestySoftWired: boolean;
  ekModulePathChecked: string;
};

/**
 * Soft-wire EK honesty when the EK types module exists in-repo.
 * Presence alone does not imply EK VERIFIED — only that honesty constants can be consulted.
 */
export function emHonestySnapshot(): EmHonestySnapshot {
  const ekPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../local-brain/windows-amd-local-cognitive-os-types.ts',
  );
  return {
    banner: HONESTY_BANNER,
    locks: EM_LOCKS,
    notTestedClaims: EM_NOT_TESTED_CLAIMS,
    elLocalRuntimePresent: true,
    ekHonestySoftWired: existsSync(ekPath),
    ekModulePathChecked: ekPath,
  };
}

export function assertEmLocksIntact(): boolean {
  return (
    EM_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EM_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EM_LOCKS.MODEL_LOAD_VERIFIED_WITHOUT_EVIDENCE === false &&
    EM_LOCKS.ONNX_SUCCESS_WITHOUT_INFERENCE === false &&
    EM_LOCKS.AMD_ACCELERATOR_VERIFIED_WITHOUT_BENCHMARK === false &&
    EM_LOCKS.AGENTS_WORKING_WHILE_NODE_OFF === false &&
    EM_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE === false &&
    EM_LOCKS.TIP_LAND === false &&
    EM_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EM_LOCKS.AUTOMATIC_HIGH_RISK_EXECUTION === false
  );
}
