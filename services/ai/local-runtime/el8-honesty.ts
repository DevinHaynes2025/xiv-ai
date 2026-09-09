/**
 * 62L-EL8 honesty locks — preserve Guardian/RLS/tenant/Universe/human-approval.
 * L4_AUTONOMY_ENABLED=false. Configuration ≠ working inference.
 */

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EL8_SOT_TITLE =
  '62L-EL8 — Model-Load Evidence (verification graduation + silent-fallback deny)' as const;

export const EL8_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  DRIVER_INSTALL_FORBIDDEN: true as const,
  PERMISSION_ELEVATION_FORBIDDEN: true as const,
  AUTOMATIC_MODEL_DOWNLOAD_FORBIDDEN: true as const,
  DETECTED_EQ_VERIFIED: false as const,
  CONFIGURED_EQ_VERIFIED: false as const,
  SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED: false as const,
  UNRUN_TEST_EQ_PASS: false as const,
  MODEL_LOAD_VERIFIED_WITHOUT_EVIDENCE: false as const,
  GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT: true as const,
  UNIVERSE_BOUNDARIES_INTACT: true as const,
  HUMAN_APPROVAL_REQUIRED_INTACT: true as const,
});

export function assertEl8LocksIntact(): boolean {
  return (
    EL8_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EL8_LOCKS.SILENT_FALLBACK_EQ_ACCELERATOR_VERIFIED === false &&
    EL8_LOCKS.CONFIGURED_EQ_VERIFIED === false &&
    EL8_LOCKS.UNRUN_TEST_EQ_PASS === false &&
    EL8_LOCKS.MODEL_LOAD_VERIFIED_WITHOUT_EVIDENCE === false &&
    EL8_LOCKS.GUARDIAN_RLS_TENANT_BOUNDARIES_INTACT === true &&
    EL8_LOCKS.HUMAN_APPROVAL_REQUIRED_INTACT === true &&
    EL8_LOCKS.TIP_LAND === false &&
    EL8_LOCKS.PRODUCTION_WRITE === false
  );
}
