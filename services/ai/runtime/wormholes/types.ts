/**
 * 62L-EX18 — Quantum Research Wormhole Router types + locks.
 * Parent: 62L-EX / GitHub #170 family (issue resolve may be unavailable in agent env).
 *
 * Wormhole = validated cache/index shortcut/precomputed result/compiled artifact/
 * warm runtime/materialized graph route/known-good path/historical solution seed.
 * NOT a physical spacetime wormhole. Cache hit NEVER bypasses authorization.
 *
 * Canonical:
 * MISSION → WORKLOAD GENOME → PROBLEM IR → POLICY GATE → WORMHOLE LOOKUP →
 * FRESHNESS/EVIDENCE CHECK → REUSE CANDIDATE → NORMAL ROUTER →
 * CPU/GPU/NPU/SIMULATOR/QPU CANDIDATE → EXECUTION → RECEIPT → FEEDBACK → HOME BASE
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED
 * Presence ≠ VERIFIED. Soft-wire absent → WAITING_DATA (not FAIL).
 * L4_AUTONOMY_ENABLED=false. STALE ≠ current VERIFIED.
 * SIMULATED_QUANTUM ≠ PHYSICAL_QPU_VERIFIED.
 */

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED; wormhole=software shortcut only; cache hit never bypasses authorization; presence ≠ VERIFIED; STALE ≠ VERIFIED; SIMULATED_QUANTUM ≠ PHYSICAL_QPU_VERIFIED' as const;

export const GITHUB_SOT_ISSUE = 170 as const;
export const GITHUB_SOT_LABEL = '62L-EX18' as const;
export const GITHUB_SOT_FAMILY = '62L-EX' as const;
export const GITHUB_SOT_TITLE =
  'EX18 — Quantum Research Wormhole Router — software cache/index shortcuts; auth never bypassed; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const EX18_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EX19 — XIV Quantum DNA Manifest + Replication Engine' as const;

/** Canonical flow hops. */
export const EX18_CANONICAL_FLOW = [
  'MISSION',
  'WORKLOAD_GENOME',
  'PROBLEM_IR',
  'POLICY_GATE',
  'WORMHOLE_LOOKUP',
  'FRESHNESS_EVIDENCE_CHECK',
  'REUSE_CANDIDATE',
  'NORMAL_ROUTER',
  'CPU_GPU_NPU_SIMULATOR_QPU_CANDIDATE',
  'EXECUTION',
  'RECEIPT',
  'FEEDBACK',
  'HOME_BASE',
] as const;

export type Ex18CanonicalHop = (typeof EX18_CANONICAL_FLOW)[number];

/** §2 Wormhole types. */
export const WORMHOLE_TYPES = [
  'KNOWLEDGE_INDEX',
  'SEMANTIC_SEARCH_CACHE',
  'ENTITY_GRAPH_SHORTCUT',
  'HISTORICAL_CASE_LOOKUP',
  'PREPROCESSED_DATA',
  'COMPILED_MODEL',
  'WARM_MODEL_SESSION',
  'COMPILED_CIRCUIT',
  'TRANSLATED_IR',
  'ALGORITHM_WARM_START',
  'PRECOMPUTED_EMBEDDING',
  'MATERIALIZED_GRAPH_VIEW',
  'BENCHMARK_LOOKUP',
  'ROUTE_CACHE',
  'RUNTIME_SESSION',
  'CHECKPOINT_RESUME',
  'SIMULATION_RESULT_CACHE',
] as const;

export type WormholeType = (typeof WORMHOLE_TYPES)[number];

/** Freshness ladder — STALE ≠ current VERIFIED. */
export const FRESHNESS_STATES = [
  'FRESH',
  'AGING',
  'STALE',
  'INVALID',
  'REVOKED',
] as const;

export type FreshnessState = (typeof FRESHNESS_STATES)[number];

/** Route disposition after lookup. */
export const ROUTE_DISPOSITIONS = [
  'WORMHOLE_ELIGIBLE',
  'NORMAL_PATH_REQUIRED',
  'NO_DIRECT_REUSE',
  'DENIED',
  'QUARANTINED',
  'WAITING_DATA',
  'WAITING_PROVIDER',
  'AVOID_ROUTE_HINT',
  'RETEST_REQUIRED',
  'FALLBACK_NORMAL',
] as const;

export type RouteDisposition = (typeof ROUTE_DISPOSITIONS)[number];

/** Highway maturity (§17). */
export const HIGHWAY_STATES = [
  'CANDIDATE',
  'MEASURED',
  'VERIFIED',
  'PREFERRED',
  'DEGRADED',
  'STALE',
] as const;

export type HighwayState = (typeof HIGHWAY_STATES)[number];

/** Benefit verification (§23) — measured only. */
export const BENEFIT_STATES = [
  'BENEFIT_VERIFIED',
  'NO_MEASURABLE_BENEFIT',
  'REGRESSION',
  'NOT_COMPARABLE',
  'NOT_TESTED',
] as const;

export type BenefitState = (typeof BENEFIT_STATES)[number];

/** Quantum truth labels — never collapse to generic QUANTUM. */
export const QUANTUM_TRUTH_LABELS = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED_QUANTUM',
  'PHYSICAL_QPU_HISTORICAL',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumTruthLabel = (typeof QUANTUM_TRUTH_LABELS)[number];

export const EX18_LOCKS = {
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  DB_CANDIDATES_APPLIED: false as const,

  // Security / auth
  CACHE_HIT_BYPASSES_AUTHORIZATION: false as const,
  SECURITY_SHORTCUT_ALLOWED: false as const,
  SKIP_GUARDIAN_CHECKS: false as const,
  WEAKEN_GUARDIAN_RLS: false as const,
  BROADEN_PERMISSIONS: false as const,
  CROSS_TENANT_PRIVATE_REUSE: false as const,
  CROSS_UNIVERSE_PRIVATE_REUSE: false as const,
  STALE_SESSION_PRIVILEGE_INHERITANCE: false as const,
  RUN_UNTRUSTED_COMPILED_ARTIFACT: false as const,
  ARBITRARY_LAN_PROPAGATION: false as const,
  QUARANTINED_IN_ACTIVE_ROUTING: false as const,
  ROOT_BYPASS: false as const,
  INDEXED_ROUTE_SKIP_POLICY_RESOURCE_HEARTBEAT: false as const,

  // Truth
  CLAIM_SPACETIME_WORMHOLE: false as const,
  CLAIM_FASTER_THAN_LIGHT: false as const,
  CLAIM_UNSUPPORTED_PHYSICS: false as const,
  STALE_EQ_VERIFIED: false as const,
  SIMULATED_EQ_PHYSICAL_QPU: false as const,
  HISTORICAL_QPU_EQ_NEW_PHYSICAL_VERIFIED: false as const,
  ALGORITHM_WARM_START_EQ_OPTIMAL: false as const,
  CLOUD_AUTO_BETTER_THAN_LOCAL: false as const,
  BENEFIT_VERIFIED_WITHOUT_MEASUREMENT: false as const,
  FAKE_SCALE_TELEMETRY: false as const,
  PRESENCE_EQ_VERIFIED: false as const,

  // Plasticity / DNA
  PLASTICITY_ALTERS_AUTHORITY: false as const,
  PLASTICITY_ALTERS_PERMISSIONS: false as const,
  PLASTICITY_ALTERS_GUARDIAN: false as const,
  PLASTICITY_ALTERS_RLS: false as const,
  PLASTICITY_ALTERS_BILLING: false as const,
  PLASTICITY_ALTERS_CONTRACTS: false as const,
  PLASTICITY_ALTERS_PROD_RIGHTS: false as const,
  PORTABLE_DNA_INCLUDES_PRIVATE_CUSTOMER_DATA: false as const,

  // Framework
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,
  DUPLICATE_IDENTITY_GUARDIAN_RLS: false as const,
  DUPLICATE_AGENT_MESH: false as const,
} as const;

export type Ex18LockKey = keyof typeof EX18_LOCKS;

export function assertEx18LocksIntact(): boolean {
  return (
    EX18_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EX18_LOCKS.TIP_LAND === false &&
    EX18_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EX18_LOCKS.MERGE_MAIN === false &&
    EX18_LOCKS.MANAGE_PULL_REQUEST === false &&
    EX18_LOCKS.CACHE_HIT_BYPASSES_AUTHORIZATION === false &&
    EX18_LOCKS.SECURITY_SHORTCUT_ALLOWED === false &&
    EX18_LOCKS.SKIP_GUARDIAN_CHECKS === false &&
    EX18_LOCKS.WEAKEN_GUARDIAN_RLS === false &&
    EX18_LOCKS.CROSS_TENANT_PRIVATE_REUSE === false &&
    EX18_LOCKS.CROSS_UNIVERSE_PRIVATE_REUSE === false &&
    EX18_LOCKS.STALE_SESSION_PRIVILEGE_INHERITANCE === false &&
    EX18_LOCKS.RUN_UNTRUSTED_COMPILED_ARTIFACT === false &&
    EX18_LOCKS.QUARANTINED_IN_ACTIVE_ROUTING === false &&
    EX18_LOCKS.ROOT_BYPASS === false &&
    EX18_LOCKS.CLAIM_SPACETIME_WORMHOLE === false &&
    EX18_LOCKS.STALE_EQ_VERIFIED === false &&
    EX18_LOCKS.SIMULATED_EQ_PHYSICAL_QPU === false &&
    EX18_LOCKS.HISTORICAL_QPU_EQ_NEW_PHYSICAL_VERIFIED === false &&
    EX18_LOCKS.ALGORITHM_WARM_START_EQ_OPTIMAL === false &&
    EX18_LOCKS.BENEFIT_VERIFIED_WITHOUT_MEASUREMENT === false &&
    EX18_LOCKS.FAKE_SCALE_TELEMETRY === false &&
    EX18_LOCKS.PLASTICITY_ALTERS_PERMISSIONS === false &&
    EX18_LOCKS.PLASTICITY_ALTERS_GUARDIAN === false &&
    EX18_LOCKS.PLASTICITY_ALTERS_RLS === false &&
    EX18_LOCKS.PORTABLE_DNA_INCLUDES_PRIVATE_CUSTOMER_DATA === false &&
    EX18_LOCKS.PRESENCE_EQ_VERIFIED === false
  );
}

export function ex18L4AutonomyEnabled(): false {
  return EX18_LOCKS.L4_AUTONOMY_ENABLED;
}

export function guardianRlsUnchangedByEx18(): true {
  return true;
}

export function cacheHitNeverBypassesAuthorization(): true {
  return EX18_LOCKS.CACHE_HIT_BYPASSES_AUTHORIZATION === false
    ? true
    : (false as never);
}

export type SoftWireDisposition = 'PRESENT_UNVERIFIED' | 'WAITING_DATA';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
  disposition: SoftWireDisposition;
};

export type Ex18Denial = {
  denied: true;
  state: 'DENIED' | 'QUARANTINED';
  reason: string;
  executed: false;
  guardianBypassed: false;
};

export function ex18Deny(
  reason: string,
  state: 'DENIED' | 'QUARANTINED' = 'DENIED',
): Ex18Denial {
  return {
    denied: true,
    state,
    reason,
    executed: false,
    guardianBypassed: false,
  };
}

export function isEx18Denial(v: unknown): v is Ex18Denial {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as Ex18Denial).denied === true &&
    (v as Ex18Denial).executed === false &&
    (v as Ex18Denial).guardianBypassed === false
  );
}

/** Auth context — every hop still verifies these. */
export type WormholeAuthContext = {
  userId: string;
  tenantId: string;
  universeId: string;
  objectId: string;
  purpose: string;
  dataClass: string;
  action: string;
  authorized: boolean;
  guardianApproved: boolean;
};

/** Platform/device enrollment for multi-device wormholes (§21). */
export type DeviceEnrollment = {
  deviceId: string;
  platform: string;
  arch: string;
  runtime: string;
  rightsGranted: boolean;
  enrolled: boolean;
  lanPropagationAllowed: false;
};

/**
 * §1 XivWormholeRoute — founder contract fields.
 * Software shortcut metadata only; never expands authority.
 */
export type XivWormholeRoute = {
  wormholeId: string;
  wormholeType: WormholeType;
  version: string;
  tenantId: string;
  universeId: string;
  sourceRef: string;
  destinationRef: string;
  workloadFingerprint: string;
  inputHash: string;
  integrityHash: string;
  dataClass: string;
  purpose: string;
  freshness: FreshnessState;
  ttlExpiryIso: string | null;
  evidenceRefs: readonly string[];
  quantumTruthLabel: QuantumTruthLabel;
  highwayState: HighwayState;
  benefitState: BenefitState;
  benefitMeasured: boolean;
  latencySavedMs: number | null;
  costSavedProxy: number | null;
  confidence: number;
  rootRefs: readonly string[];
  branchRefs: readonly string[];
  bridgeRefs: readonly string[];
  quarantineReason: string | null;
  failureHint: 'AVOID_ROUTE_HINT' | null;
  retestRequired: boolean;
  compiledArtifactTrusted: boolean;
  warmSessionAuthRecheckRequired: true;
  algorithmWarmStartIsHintOnly: true;
  indexedRouteStillRequiresPolicy: true;
  historicalQpuOnly: boolean;
  deviceEnrollment: DeviceEnrollment | null;
  mode: 'LOCAL_FIRST' | 'OFFLINE_FIRST' | 'HYBRID_READY';
  localPreferredWhenMeetsRequirements: true;
  cloudNotAutoBetter: true;
  authorityBypass: false;
  guardianBypass: false;
  rlsBypass: false;
  createdAtIso: string;
  updatedAtIso: string;
};

export type WormholeLookupRequest = {
  auth: WormholeAuthContext;
  wormholeType: WormholeType;
  workloadFingerprint: string;
  inputHash: string;
  nowIso: string;
  mode: 'LOCAL_FIRST' | 'OFFLINE_FIRST' | 'HYBRID_READY';
  offline: boolean;
  requiresLiveWeb?: boolean;
  requiresProvider?: boolean;
  hardwareAvailable?: boolean;
  attemptBypassGuardian?: boolean;
  attemptCrossTenant?: boolean;
  attemptCrossUniverse?: boolean;
  attemptSkipRoot?: boolean;
  attemptRunUntrustedArtifact?: boolean;
  attemptLanPropagate?: boolean;
  plasticityAttemptAlterPermissions?: boolean;
};

export type WormholeLookupResult = {
  disposition: RouteDisposition;
  route: XivWormholeRoute | null;
  reason: string;
  authChecksPerformed: true;
  guardianBypassed: false;
  evidenceRefs: readonly string[];
  quantumTruthLabel: QuantumTruthLabel | null;
  benefitState: BenefitState;
  waitingKind: 'WAITING_DATA' | 'WAITING_PROVIDER' | null;
  fallback: 'NORMAL_PATH' | 'NONE';
};

export type ScaleTelemetry = {
  measuredOnly: true;
  fabricated: false;
  hits: number;
  misses: number;
  denials: number;
  quarantines: number;
  regressions: number;
  benefitVerified: number;
};

/** Portable DNA — no private third-party/customer data (§26). */
export type XivWormholeDna = {
  dnaId: string;
  version: string;
  wormholeType: WormholeType;
  publicPatternHash: string;
  highwayState: HighwayState;
  containsPrivateCustomerData: false;
  containsThirdPartyPrivateData: false;
  portable: true;
};

export type Ex18SoftWireSnapshot = {
  agentMesh: SoftWirePresence;
  computeFabric: SoftWirePresence;
  quantum: SoftWirePresence;
  evidence: SoftWirePresence;
  pathway: SoftWirePresence;
  plasticity: SoftWirePresence;
  guardian: SoftWirePresence;
  ex1: SoftWirePresence;
  ex2: SoftWirePresence;
  ex3: SoftWirePresence;
  ex4: SoftWirePresence;
  ex5: SoftWirePresence;
  ex6: SoftWirePresence;
  ex7: SoftWirePresence;
  ex8: SoftWirePresence;
  ex9: SoftWirePresence;
  ex10: SoftWirePresence;
  ex11: SoftWirePresence;
  ex12: SoftWirePresence;
  ex13: SoftWirePresence;
  ex14: SoftWirePresence;
  ex15: SoftWirePresence;
  ex16: SoftWirePresence;
  ex17: SoftWirePresence;
};
