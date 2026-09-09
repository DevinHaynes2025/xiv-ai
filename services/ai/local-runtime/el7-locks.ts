/**
 * 62L-EL7 — Windows local runtime adapter governance locks.
 * Soft-wire only: never bypass auth.ts, Guardian, RLS, tenant, or Universe boundaries.
 */

export const EL7_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  AUTO_MODEL_DOWNLOAD: false as const,
  AUTO_DRIVER_OR_RUNTIME_INSTALL: false as const,
  AUTH_BYPASS: false as const,
  GUARDIAN_BYPASS: false as const,
  RLS_BYPASS: false as const,
  TENANT_BYPASS: false as const,
  UNIVERSE_BYPASS: false as const,
  /** Unit tests must not invent VERIFIED without measured-evidence fixture boundaries. */
  UNIT_TEST_AUTO_VERIFIED: false as const,
});

export const EL7_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EL7_DEFAULT_RESOURCE_BUDGET = Object.freeze({
  maxConcurrentTasks: 4,
  /** Soft default 2 GiB for local inference attempts. */
  maxMemoryBytes: 2 * 1024 * 1024 * 1024,
});
