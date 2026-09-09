/**
 * 2I-AI-62D queued runtime contracts.
 *
 * Documentation lock only. Registers no node, routes no workload, creates no
 * table, enrolls no device, and enables L4 nowhere.
 *
 * Two things are pinned here that prose cannot hold on its own:
 *
 *  1. The eight compute routers that already exist. 62D §8 proposes a ninth.
 *     The inventory is asserted so a tenth cannot be added without the count
 *     changing in a diff.
 *  2. The AC-01..AC-24 gates, every one recorded as unmeasured. The scorecard
 *     rule is that TBD is not PASS, so the gates are represented as `null`
 *     rather than `false` — unmeasured and failed are different states.
 *
 * Section: Global Operations Brain (shared core), per the story placement rule.
 * Status: QUEUED ARCHITECTURE — NOT IMPLEMENTED
 */

export const STORY_ID = '2I-AI-62D' as const;
export const STORY_SERIES = '2I-AI-62' as const;
export const SECTION = 'GLOBAL_OPERATIONS_BRAIN' as const;
export const DEPLOYMENT_STATE = 'QUEUED' as const;
export const IMPLEMENTATION_STARTED = false;
export const L4_AUTONOMY_ENABLED = false;
export const CANARY_CANDIDATE = false;

/** §32 security lock. */
export const SECURITY_LOCK = {
  L4_AUTONOMY_ENABLED: false,
  AUTO_DEPLOY: false,
  AUTO_SCALE_AUTHORITY: false,
  AUTO_PERMISSION_EXPANSION: false,
  AUTO_SATELLITE_ACCESS: false,
  AUTO_EXTERNAL_ACCOUNT_CREATION: false,
  AUTO_PRODUCTION_MUTATION: false,
} as const;

export const CAPABILITY_FLAGS = {
  XUR_ENABLED: false,
  XHAL_ENABLED: false,
  XCR_ENABLED: false,
  XDN_ENABLED: false,
  EDGE_NETWORK_ENABLED: false,
  OFFLINE_PACKAGES_ENABLED: false,
  RUNTIME_ATTESTATION_ENABLED: false,
  CAPABILITY_REGISTRY_ENABLED: false,
  COMPUTE_ECONOMICS_ENABLED: false,
  THERMAL_AWARENESS_ENABLED: false,
  HOME_BASE_RECEIPTS_ENABLED: false,
} as const;

/**
 * §8 / placement rule.
 *
 * Every function in the runtime that routes a workload toward compute or a
 * model. None accepts a tenant or Universe identifier, which is why §24 and
 * AC-03 have no enforcement point on the compute plane today.
 */
export const EXISTING_COMPUTE_ROUTERS = [
  { fn: 'routeComputeWorkload', module: 'foundations/compute.ts', tenantAware: false },
  { fn: 'routeCompute', module: 'neural/compute.ts', tenantAware: false },
  { fn: 'routeAdvancedCompute', module: 'nightshift/compute-fabric.ts', tenantAware: false },
  { fn: 'routeNvidiaAcceleration', module: 'cios/platforms.ts', tenantAware: false },
  { fn: 'routeInference', module: 'modelfoundry/backend.ts', tenantAware: false },
  { fn: 'scheduleAiWorkload', module: 'foundations/models.ts', tenantAware: false },
  { fn: 'scheduleMission', module: 'cloudworker/scheduler.ts', tenantAware: false },
  { fn: 'routeMissionIntelligence', module: 'cloudworker/model-gateway.ts', tenantAware: false },
] as const;

/**
 * §2. The only hardware capability detector in the runtime is NVIDIA-shaped, so
 * AC-06's Intel / AMD / ARM / mobile portability matrix cannot be expressed.
 * A vendor is `proven` only when it has an independently evidenced detector.
 */
export const VENDOR_DETECTION = {
  NVIDIA: { detector: 'detectNvidiaCapability', proven: true },
  INTEL: { detector: null, proven: false },
  AMD: { detector: null, proven: false },
  ARM: { detector: null, proven: false },
  APPLE_SILICON: { detector: null, proven: false },
  NPU: { detector: null, proven: false },
} as const;

/** §16. An unknown node receives no protected workload. */
export const ATTESTATION_STATES = [
  'UNKNOWN',
  'REGISTERED',
  'VERIFIED',
  'ATTESTED',
  'DEGRADED',
  'QUARANTINED',
  'REVOKED',
] as const;

export const ATTESTATION_STATES_ELIGIBLE_FOR_PROTECTED_WORKLOAD = ['ATTESTED'] as const;

/** §25. The control plane never depends on the workload's cooperation. */
export const KILL_SWITCH_CONTROLS = [
  'PAUSE_NODE',
  'DRAIN_NODE',
  'QUARANTINE_NODE',
  'REVOKE_NODE',
  'STOP_TASK',
  'STOP_AGENT',
  'STOP_MEETING',
  'REVOKE_MODEL',
] as const;

/** §17 / AC-08. Every dimension a workload budget must bound. */
export const RESOURCE_BUDGET_DIMENSIONS = [
  'CPU',
  'GPU',
  'RAM',
  'STORAGE',
  'NETWORK',
  'TOKENS',
  'MODEL_CALLS',
  'AGENT_COUNT',
  'TASK_COUNT',
  'ENERGY',
  'COST',
  'DURATION',
] as const;

/** §8. Security precedes performance; an unauthorized node is never cheapest. */
export const ROUTING_PRIORITY = ['SECURITY', 'CORRECTNESS', 'AVAILABILITY', 'LATENCY', 'COST'] as const;

/** §15 / §23 lineage across compute. */
export const COMPUTE_LINEAGE_FIELDS = [
  'SOURCE',
  'CLASSIFICATION',
  'ORGANIZATION',
  'UNIVERSE',
  'AGENT',
  'MODEL',
  'RUNTIME',
  'TRANSFORMATION',
  'MEETING_OR_TASK',
  'RECOMMENDATION',
  'APPROVAL',
  'RESULT',
] as const;

/** §31. Satellite remains unconfigured until separately authorized. */
export const SPACE_PROVIDER_STATE = 'UNCONFIGURED' as const;

/** §27 schema slice. No name collides with an existing migration. */
export type RuntimeTablePlan = { readonly tenantBearing: boolean; readonly rationale: string };

export const RUNTIME_SCHEMA_PLAN: Readonly<Record<string, RuntimeTablePlan>> = {
  xiv_runtime_nodes: {
    tenantBearing: true,
    rationale: '§9 binds a node to an Organization and Universe at registration.',
  },
  xiv_runtime_capabilities: {
    tenantBearing: false,
    rationale: 'A capability descriptor such as gpu.inference.medium is a platform fact.',
  },
  xiv_runtime_attestations: {
    tenantBearing: true,
    rationale: 'Attestation history inherits the scope of the node it describes.',
  },
  xiv_runtime_health: {
    tenantBearing: true,
    rationale: 'Health telemetry reveals a tenant node fleet.',
  },
  xiv_compute_workloads: {
    tenantBearing: true,
    rationale: 'A workload belongs to the Universe that submitted it.',
  },
  xiv_compute_assignments: {
    tenantBearing: true,
    rationale: 'Assignments link tenant workloads to nodes; §24 forbids collapsing that.',
  },
  xiv_compute_budgets: {
    tenantBearing: true,
    rationale: 'Budgets are per organization and Universe.',
  },
  xiv_compute_usage: {
    tenantBearing: true,
    rationale: 'Usage is billing data and AC-21 requires attribution.',
  },
  xiv_model_registry: {
    tenantBearing: false,
    rationale: 'Which models are approved is a platform fact, not tenant data.',
  },
  xiv_model_evaluations: {
    tenantBearing: true,
    rationale: 'How a model performed against a tenant workload is tenant data.',
  },
  xiv_agent_runtime_assignments: {
    tenantBearing: true,
    rationale: '§15 keeps agent identity separate from compute, both tenant-scoped.',
  },
  xiv_offline_work_packages: {
    tenantBearing: true,
    rationale: 'A package carries granted authority; the most sensitive row in the slice.',
  },
  xiv_sync_events: {
    tenantBearing: true,
    rationale: 'Sync reveals offline tenant activity.',
  },
  xiv_runtime_security_events: {
    tenantBearing: true,
    rationale: 'Security events name tenant nodes, agents and workloads.',
  },
} as const;

/**
 * AC-01..AC-24. `null` means unmeasured, which the scorecard distinguishes from
 * a measured failure: TBD is not PASS, and it is not FAIL either.
 */
export type GateResult = boolean | null;

export const ACCEPTANCE_GATES: Readonly<Record<string, GateResult>> = {
  AC01_runtime_identity: null,
  AC02_attestation: null,
  AC03_tenant_universe_isolation: null,
  AC04_workload_authorization: null,
  AC05_compute_routing: null,
  AC06_hardware_portability: null,
  AC07_agent_runtime_assignment: null,
  AC08_resource_governance: null,
  AC09_logical_agent_scale: null,
  AC10_offline_packages: null,
  AC11_offline_meeting_integrity: null,
  AC12_failure_recovery: null,
  AC13_kill_switch: null,
  AC14_model_authorization: null,
  AC15_lineage: null,
  AC16_secrets: null,
  AC17_dependencies: null,
  AC18_mobile_regression: null,
  AC19_web_api_regression: null,
  AC20_performance: null,
  AC21_cost_governance: null,
  AC22_observability: null,
  AC23_backup_restore: null,
  AC24_rollback: null,
} as const;

/** Numeric targets that must not be softened without a founder decision. */
export const ACCEPTANCE_TARGETS = {
  routingDecisionSampleSize: 1000,
  routingPolicyCorrectMinPercent: 99.9,
  securityInvalidRoutingMax: 0,
  tenantInvalidRoutingMax: 0,
  hardwareCompletionMinPercent: 99,
  forcedFailureScenarios: 100,
  failureDetectionMinPercent: 99,
  duplicateConsequentialActionsMax: 0,
  killSwitchAckP95Seconds: 2,
  logicalAgentIdentities: 100_000,
  concurrentBoundedTasks: 1000,
  schedulerAcceptP95Ms: 500,
  schedulingDecisionP95Ms: 250,
  workloadStartP95Seconds: 2,
  computeUsageRecordMinPercent: 99.9,
  traceabilityMinPercent: 99.9,
} as const;

/** 62E entry requirement: logical agents are not simultaneously active agents. */
export const NEXT_STORY_ENTRY_REQUIREMENT = {
  storyId: '2I-AI-62E',
  registeredLogicalAgents: 100_000,
  syntheticSchedulingTest: 10_000,
  simultaneouslyActiveBoundedTasks: 1000,
  crossTenantSchedulingViolationsMax: 0,
  recursiveAgentCreationMax: 0,
  resourceBudgetAttachmentPercent: 100,
} as const;

export const INVARIANTS = {
  moreComputeMeansMoreAuthority: false,
  installedSoftwareMeansTrustedDevice: false,
  physicalProximityMeansTrust: false,
  offlineMeansAdditionalAuthority: false,
  sharedHostMeansSharedUniverse: false,
  runtimeMayOverrideGuardian: false,
  agentMayGrantItselfInfrastructure: false,
  unconfiguredMeansSupported: false,
  documentedMeansImplemented: false,
  implementedMeansVerified: false,
  verifiedMeansProductionAuthorized: false,
  tbdMeansPass: false,
} as const;

export function tenantBearingTables(): string[] {
  return Object.entries(RUNTIME_SCHEMA_PLAN)
    .filter(([, p]) => p.tenantBearing)
    .map(([t]) => t)
    .sort();
}

export function referenceTables(): string[] {
  return Object.entries(RUNTIME_SCHEMA_PLAN)
    .filter(([, p]) => !p.tenantBearing)
    .map(([t]) => t)
    .sort();
}

/** Routers that cannot enforce §24 because they never see a tenant. */
export function tenantBlindRouters(): string[] {
  return EXISTING_COMPUTE_ROUTERS.filter((r) => !r.tenantAware).map((r) => r.fn);
}

/** Vendors AC-06 names that have no independently proven detector. */
export function unprovenVendors(): string[] {
  return Object.entries(VENDOR_DETECTION)
    .filter(([, v]) => !v.proven)
    .map(([name]) => name)
    .sort();
}

export function measuredGates(): string[] {
  return Object.entries(ACCEPTANCE_GATES)
    .filter(([, v]) => v !== null)
    .map(([g]) => g);
}

export function allGatesUnmeasured(): boolean {
  return measuredGates().length === 0;
}

export function securityLockHolds(): boolean {
  return Object.values(SECURITY_LOCK).every((v) => v === false);
}

export function allCapabilityFlagsFalse(): boolean {
  return Object.values(CAPABILITY_FLAGS).every((v) => v === false);
}

/** The canary gate requires every listed gate to be a measured PASS. */
export function canaryGateOpen(): boolean {
  return Object.values(ACCEPTANCE_GATES).every((v) => v === true);
}

export function storyIsImplemented(): boolean {
  return false;
}
