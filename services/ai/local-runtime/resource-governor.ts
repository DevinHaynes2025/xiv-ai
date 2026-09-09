/**
 * 62L-EL9 — Local Resource Governor
 *
 * Task request → estimate → compare policy → ALLOW | THROTTLE | QUEUE | DENY
 * → execute → monitor → STOP_SAFE if ceilings are exceeded.
 *
 * Preserves the original concurrency/RAM ceiling evaluator while deepening
 * into a full governor state machine for the ASUS local runtime.
 *
 * Safety (non-negotiable):
 * - Never disable Windows thermal protections
 * - No BIOS / overclock / undervolt / fan-control / power-limit modification
 * - No unlimited CPU / GPU / RAM
 * - No automatic cloud spillover without separate authorization
 * - System-critical and user workloads outrank XIV background work
 * - L4_AUTONOMY_ENABLED=false; Guardian/RLS/approval unchanged
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RuntimeHeartbeat } from './types';

// ---------------------------------------------------------------------------
// Legacy ceiling API (preserved)
// ---------------------------------------------------------------------------

export type ResourceBudget = {
  maxConcurrentTasks: number;
  maxMemoryBytes: number;
};

export type ResourceRequest = {
  concurrentTasks: number;
  estimatedMemoryBytes: number;
};

export type ResourceDecision = {
  allowed: boolean;
  reasons: string[];
};

export function evaluateResourceRequest(
  request: ResourceRequest,
  budget: ResourceBudget,
): ResourceDecision {
  const reasons: string[] = [];

  if (!Number.isFinite(request.concurrentTasks) || request.concurrentTasks < 0) {
    reasons.push('Concurrent task count must be a finite non-negative number.');
  }
  if (!Number.isFinite(request.estimatedMemoryBytes) || request.estimatedMemoryBytes < 0) {
    reasons.push('Estimated memory must be a finite non-negative number.');
  }
  if (request.concurrentTasks > budget.maxConcurrentTasks) {
    reasons.push(
      `Requested concurrency ${request.concurrentTasks} exceeds ceiling ${budget.maxConcurrentTasks}.`,
    );
  }
  if (request.estimatedMemoryBytes > budget.maxMemoryBytes) {
    reasons.push(
      `Estimated memory ${request.estimatedMemoryBytes} exceeds ceiling ${budget.maxMemoryBytes}.`,
    );
  }

  return { allowed: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// EL9 honesty / safety locks
// ---------------------------------------------------------------------------

export const EL9_HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const EL9_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  WINDOWS_THERMAL_PROTECTION_DISABLE_FORBIDDEN: true as const,
  BIOS_MODIFICATION_FORBIDDEN: true as const,
  OVERCLOCK_FORBIDDEN: true as const,
  UNDERVOLT_FORBIDDEN: true as const,
  FAN_CONTROL_FORBIDDEN: true as const,
  POWER_LIMIT_MODIFICATION_FORBIDDEN: true as const,
  UNLIMITED_CPU_FORBIDDEN: true as const,
  UNLIMITED_GPU_FORBIDDEN: true as const,
  UNLIMITED_RAM_FORBIDDEN: true as const,
  AUTOMATIC_CLOUD_SPILLOVER_FORBIDDEN: true as const,
  GUARDIAN_RLS_APPROVAL_UNCHANGED: true as const,
  SYSTEM_USER_PRIORITY_OVER_XIV_BACKGROUND: true as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
});

export function assertEl9LocksIntact(): boolean {
  return (
    EL9_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EL9_LOCKS.WINDOWS_THERMAL_PROTECTION_DISABLE_FORBIDDEN === true &&
    EL9_LOCKS.BIOS_MODIFICATION_FORBIDDEN === true &&
    EL9_LOCKS.OVERCLOCK_FORBIDDEN === true &&
    EL9_LOCKS.UNDERVOLT_FORBIDDEN === true &&
    EL9_LOCKS.FAN_CONTROL_FORBIDDEN === true &&
    EL9_LOCKS.POWER_LIMIT_MODIFICATION_FORBIDDEN === true &&
    EL9_LOCKS.UNLIMITED_CPU_FORBIDDEN === true &&
    EL9_LOCKS.UNLIMITED_GPU_FORBIDDEN === true &&
    EL9_LOCKS.UNLIMITED_RAM_FORBIDDEN === true &&
    EL9_LOCKS.AUTOMATIC_CLOUD_SPILLOVER_FORBIDDEN === true &&
    EL9_LOCKS.GUARDIAN_RLS_APPROVAL_UNCHANGED === true &&
    EL9_LOCKS.SYSTEM_USER_PRIORITY_OVER_XIV_BACKGROUND === true &&
    EL9_LOCKS.TIP_LAND === false &&
    EL9_LOCKS.PRODUCTION_AUTHORIZATION === false
  );
}

// ---------------------------------------------------------------------------
// Soft-wire EL7 adapter + EL8 evidence (presence only — not VERIFIED)
// ---------------------------------------------------------------------------

export type El9SoftWireSnapshot = {
  el7AdapterPresent: boolean;
  el7AdapterPathChecked: string;
  el8EvidencePresent: boolean;
  el8EvidencePathChecked: string;
  note: string;
};

export function el9SoftWireSnapshot(): El9SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const el7Path = join(here, 'windows-local-runtime-adapter.ts');
  const el8Path = join(here, 'model-load-evidence.ts');
  return {
    el7AdapterPresent: existsSync(el7Path),
    el7AdapterPathChecked: el7Path,
    el8EvidencePresent: existsSync(el8Path),
    el8EvidencePathChecked: el8Path,
    note: 'Presence soft-wire only; does not imply EL7/EL8 VERIFIED or production authorization.',
  };
}

// ---------------------------------------------------------------------------
// Policy + estimate + observation types
// ---------------------------------------------------------------------------

export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical' | 'unknown';

export type WorkloadPriority = 'system_critical' | 'user' | 'xiv_background';

export type WorkloadKind =
  | 'offline_research'
  | 'model_session'
  | 'simulation'
  | 'search'
  | 'system_critical'
  | 'user'
  | 'xiv_background';

export type ResourceGovernorPolicy = {
  maxCpuUtilizationPercent: number;
  maxWorkerCount: number;
  maxMemoryBytes: number;
  /** When null, GPU memory is not measurable — large GPU asks must QUEUE/DENY, never assume unlimited. */
  maxGpuMemoryBytes: number | null;
  maxNpuMemoryBytes: number | null;
  maxConcurrentModelSessions: number;
  maxLocalCacheBytes: number;
  maxNetworkBytesPerTask: number;
  maxTaskDurationMs: number;
  maxQueueSize: number;
  /** Background XIV work pauses/throttles below this battery % when on battery. */
  minBatteryPercentForBackground: number;
  /** At/above this thermal severity, enter THERMAL_LIMIT (read-only observation). */
  thermalDenyAt: Exclude<ThermalState, 'unknown' | 'nominal'>;
  /** Throttle background work at this thermal severity. */
  thermalThrottleAt: Exclude<ThermalState, 'unknown' | 'critical'>;
  /** Separate human authorization required for any cloud spillover. Default false. */
  cloudSpilloverAuthorized: boolean;
  /** Offline research hard budget multiplier (≤1) applied to ceilings. */
  offlineResearchBudgetFactor: number;
};

/** Finite, non-unlimited default ceilings for ASUS local runtime. */
export const DEFAULT_EL9_POLICY: ResourceGovernorPolicy = Object.freeze({
  maxCpuUtilizationPercent: 70,
  maxWorkerCount: 4,
  maxMemoryBytes: 4 * 1024 * 1024 * 1024, // 4 GiB XIV budget
  maxGpuMemoryBytes: 2 * 1024 * 1024 * 1024, // 2 GiB when measurable
  maxNpuMemoryBytes: 512 * 1024 * 1024,
  maxConcurrentModelSessions: 1,
  maxLocalCacheBytes: 8 * 1024 * 1024 * 1024, // 8 GiB cache ceiling
  maxNetworkBytesPerTask: 64 * 1024 * 1024,
  maxTaskDurationMs: 30 * 60 * 1000, // 30 minutes
  maxQueueSize: 16,
  minBatteryPercentForBackground: 25,
  thermalDenyAt: 'critical',
  thermalThrottleAt: 'serious',
  cloudSpilloverAuthorized: false,
  offlineResearchBudgetFactor: 0.5,
});

export type TaskResourceRequest = {
  taskId: string;
  kind: WorkloadKind;
  priority?: WorkloadPriority;
  /** Required for large simulations — missing estimate → DENY. */
  estimatedCpuWorkers?: number;
  estimatedCpuPercent?: number;
  estimatedMemoryBytes?: number;
  estimatedGpuMemoryBytes?: number;
  estimatedNpuMemoryBytes?: number;
  modelSessions?: number;
  estimatedCacheBytes?: number;
  estimatedNetworkBytes?: number;
  estimatedDurationMs?: number;
  requestsCloudSpillover?: boolean;
  /** Explicit flag that cost was estimated before execution (simulations). */
  costEstimated?: boolean;
};

export type ResourceEstimate = {
  taskId: string;
  kind: WorkloadKind;
  priority: WorkloadPriority;
  cpuWorkers: number;
  cpuPercent: number;
  memoryBytes: number;
  gpuMemoryBytes: number;
  npuMemoryBytes: number;
  modelSessions: number;
  cacheBytes: number;
  networkBytes: number;
  durationMs: number;
  requestsCloudSpillover: boolean;
  costEstimated: boolean;
  largeSimulation: boolean;
};

export type HostResourceObservation = {
  cpuUtilizationPercent: number;
  activeWorkers: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  gpuMemoryUsedBytes?: number | null;
  gpuMemoryMeasurable?: boolean;
  npuMemoryUsedBytes?: number | null;
  npuMemoryMeasurable?: boolean;
  activeModelSessions: number;
  localCacheBytes: number;
  queueDepth: number;
  batteryPercent?: number | null;
  onAcPower?: boolean | null;
  thermalState?: ThermalState | null;
  heartbeatState?: RuntimeHeartbeat['state'] | null;
  userWorkloadActive?: boolean;
  systemCriticalActive?: boolean;
};

export type GovernorAction = 'ALLOW' | 'THROTTLE' | 'QUEUE' | 'DENY' | 'STOP_SAFE';

export type GovernorState =
  | 'NORMAL'
  | 'THROTTLED'
  | 'RESOURCE_PRESSURE'
  | 'THERMAL_LIMIT'
  | 'BATTERY_SAVER'
  | 'MEMORY_LIMIT'
  | 'QUEUE_FULL'
  | 'DENIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED';

export const EL9_GOVERNOR_STATES: readonly GovernorState[] = [
  'NORMAL',
  'THROTTLED',
  'RESOURCE_PRESSURE',
  'THERMAL_LIMIT',
  'BATTERY_SAVER',
  'MEMORY_LIMIT',
  'QUEUE_FULL',
  'DENIED',
  'WAITING_NODE',
  'OFFLINE_STOPPED',
] as const;

export type ThrottlePlan = {
  maxWorkers: number;
  maxCpuPercent: number;
  maxMemoryBytes: number;
  maxModelSessions: number;
};

export type CloudSpilloverVerdict =
  | 'NOT_REQUESTED'
  | 'DENIED_NO_AUTHORIZATION'
  | 'AUTHORIZED_SEPARATELY';

export type GovernorDecision = {
  action: GovernorAction;
  state: GovernorState;
  allowed: boolean;
  reasons: string[];
  estimate: ResourceEstimate;
  throttle?: ThrottlePlan;
  cloudSpillover: CloudSpilloverVerdict;
  stopSafeRequired: boolean;
  priorityDeferred: boolean;
  locks: typeof EL9_LOCKS;
};

export type MonitorSample = HostResourceObservation & {
  taskId: string;
  elapsedMs: number;
  memoryBytesInUse: number;
  cpuPercentInUse: number;
};

export type MonitorVerdict = {
  action: 'CONTINUE' | 'STOP_SAFE';
  state: GovernorState;
  reasons: string[];
  stopSafeRequired: boolean;
};

// ---------------------------------------------------------------------------
// Estimate
// ---------------------------------------------------------------------------

const LARGE_SIMULATION_MEMORY_BYTES = 1024 * 1024 * 1024; // 1 GiB
const LARGE_SIMULATION_DURATION_MS = 10 * 60 * 1000;

function defaultPriority(kind: WorkloadKind): WorkloadPriority {
  if (kind === 'system_critical') return 'system_critical';
  if (kind === 'user') return 'user';
  return 'xiv_background';
}

export function estimateResourceNeed(request: TaskResourceRequest): ResourceEstimate {
  const priority = request.priority ?? defaultPriority(request.kind);
  const memoryBytes = Math.max(0, request.estimatedMemoryBytes ?? 0);
  const durationMs = Math.max(0, request.estimatedDurationMs ?? 0);
  const largeSimulation =
    request.kind === 'simulation' &&
    (memoryBytes >= LARGE_SIMULATION_MEMORY_BYTES || durationMs >= LARGE_SIMULATION_DURATION_MS);

  return {
    taskId: request.taskId,
    kind: request.kind,
    priority,
    cpuWorkers: Math.max(0, request.estimatedCpuWorkers ?? 1),
    cpuPercent: Math.max(0, request.estimatedCpuPercent ?? 10),
    memoryBytes,
    gpuMemoryBytes: Math.max(0, request.estimatedGpuMemoryBytes ?? 0),
    npuMemoryBytes: Math.max(0, request.estimatedNpuMemoryBytes ?? 0),
    modelSessions: Math.max(0, request.modelSessions ?? (request.kind === 'model_session' ? 1 : 0)),
    cacheBytes: Math.max(0, request.estimatedCacheBytes ?? 0),
    networkBytes: Math.max(0, request.estimatedNetworkBytes ?? 0),
    durationMs,
    requestsCloudSpillover: request.requestsCloudSpillover === true,
    costEstimated: request.costEstimated === true || request.estimatedMemoryBytes != null,
    largeSimulation,
  };
}

function effectivePolicy(
  estimate: ResourceEstimate,
  policy: ResourceGovernorPolicy,
): ResourceGovernorPolicy {
  if (estimate.kind !== 'offline_research') return policy;
  const f = policy.offlineResearchBudgetFactor;
  return {
    ...policy,
    maxCpuUtilizationPercent: Math.floor(policy.maxCpuUtilizationPercent * f),
    maxWorkerCount: Math.max(1, Math.floor(policy.maxWorkerCount * f)),
    maxMemoryBytes: Math.floor(policy.maxMemoryBytes * f),
    maxGpuMemoryBytes:
      policy.maxGpuMemoryBytes == null ? null : Math.floor(policy.maxGpuMemoryBytes * f),
    maxNpuMemoryBytes:
      policy.maxNpuMemoryBytes == null ? null : Math.floor(policy.maxNpuMemoryBytes * f),
    maxConcurrentModelSessions: Math.max(1, Math.floor(policy.maxConcurrentModelSessions * f)),
    maxLocalCacheBytes: Math.floor(policy.maxLocalCacheBytes * f),
    maxNetworkBytesPerTask: Math.floor(policy.maxNetworkBytesPerTask * f),
    maxTaskDurationMs: Math.floor(policy.maxTaskDurationMs * f),
  };
}

function thermalRank(state: ThermalState): number {
  switch (state) {
    case 'nominal':
      return 0;
    case 'fair':
      return 1;
    case 'serious':
      return 2;
    case 'critical':
      return 3;
    default:
      return -1;
  }
}

function rejectUnlimitedPolicy(policy: ResourceGovernorPolicy): string[] {
  const reasons: string[] = [];
  const finitePositive = (n: number) => Number.isFinite(n) && n > 0 && n !== Infinity;

  if (!finitePositive(policy.maxCpuUtilizationPercent) || policy.maxCpuUtilizationPercent > 100) {
    reasons.push('Policy maxCpuUtilizationPercent must be a finite positive ≤100 (unlimited CPU forbidden).');
  }
  if (!finitePositive(policy.maxWorkerCount)) {
    reasons.push('Policy maxWorkerCount must be a finite positive (unlimited workers forbidden).');
  }
  if (!finitePositive(policy.maxMemoryBytes)) {
    reasons.push('Policy maxMemoryBytes must be a finite positive (unlimited RAM forbidden).');
  }
  if (policy.maxGpuMemoryBytes != null && !finitePositive(policy.maxGpuMemoryBytes)) {
    reasons.push('Policy maxGpuMemoryBytes must be finite positive when set (unlimited GPU forbidden).');
  }
  if (policy.maxNpuMemoryBytes != null && !finitePositive(policy.maxNpuMemoryBytes)) {
    reasons.push('Policy maxNpuMemoryBytes must be finite positive when set (unlimited NPU forbidden).');
  }
  if (!finitePositive(policy.maxConcurrentModelSessions)) {
    reasons.push('Policy maxConcurrentModelSessions must be a finite positive.');
  }
  if (!finitePositive(policy.maxLocalCacheBytes)) {
    reasons.push('Policy maxLocalCacheBytes must be a finite positive.');
  }
  if (!finitePositive(policy.maxNetworkBytesPerTask)) {
    reasons.push('Policy maxNetworkBytesPerTask must be a finite positive.');
  }
  if (!finitePositive(policy.maxTaskDurationMs)) {
    reasons.push('Policy maxTaskDurationMs must be a finite positive.');
  }
  if (!finitePositive(policy.maxQueueSize)) {
    reasons.push('Policy maxQueueSize must be a finite positive.');
  }
  return reasons;
}

function deny(
  estimate: ResourceEstimate,
  state: GovernorState,
  reasons: string[],
  extras: Partial<Pick<GovernorDecision, 'cloudSpillover' | 'priorityDeferred' | 'throttle'>> = {},
): GovernorDecision {
  return {
    action: 'DENY',
    state,
    allowed: false,
    reasons,
    estimate,
    cloudSpillover: extras.cloudSpillover ?? 'NOT_REQUESTED',
    stopSafeRequired: false,
    priorityDeferred: extras.priorityDeferred ?? false,
    locks: EL9_LOCKS,
    ...(extras.throttle ? { throttle: extras.throttle } : {}),
  };
}

function throttlePlan(policy: ResourceGovernorPolicy): ThrottlePlan {
  return {
    maxWorkers: Math.max(1, Math.floor(policy.maxWorkerCount / 2)),
    maxCpuPercent: Math.max(5, Math.floor(policy.maxCpuUtilizationPercent / 2)),
    maxMemoryBytes: Math.max(64 * 1024 * 1024, Math.floor(policy.maxMemoryBytes / 2)),
    maxModelSessions: 1,
  };
}

// ---------------------------------------------------------------------------
// Core evaluate / decide
// ---------------------------------------------------------------------------

export function governTaskRequest(
  request: TaskResourceRequest,
  observation: HostResourceObservation,
  policy: ResourceGovernorPolicy = DEFAULT_EL9_POLICY,
): GovernorDecision {
  const estimate = estimateResourceNeed(request);
  const policyIssues = rejectUnlimitedPolicy(policy);
  if (policyIssues.length > 0) {
    return deny(estimate, 'DENIED', policyIssues);
  }

  const eff = effectivePolicy(estimate, policy);
  const reasons: string[] = [];

  // Heartbeat soft-wire — laptop sleep / shutdown / lost runtime
  if (observation.heartbeatState === 'OFFLINE_STOPPED') {
    return deny(estimate, 'OFFLINE_STOPPED', [
      'Runtime heartbeat is OFFLINE_STOPPED; local execution is halted safely.',
    ]);
  }
  if (observation.heartbeatState === 'WAITING_NODE' || observation.heartbeatState === 'STALE') {
    return deny(estimate, 'WAITING_NODE', [
      `Runtime heartbeat is ${observation.heartbeatState}; soft-wire WAITING_NODE — do not claim agents are working.`,
    ]);
  }

  // Cloud spillover — never automatic
  let cloudSpillover: CloudSpilloverVerdict = 'NOT_REQUESTED';
  if (estimate.requestsCloudSpillover) {
    if (!policy.cloudSpilloverAuthorized || EL9_LOCKS.AUTOMATIC_CLOUD_SPILLOVER_FORBIDDEN) {
      cloudSpillover = 'DENIED_NO_AUTHORIZATION';
      return deny(
        estimate,
        'DENIED',
        [
          'Automatic cloud spillover is forbidden without separate authorization (EL9_LOCKS.AUTOMATIC_CLOUD_SPILLOVER_FORBIDDEN).',
        ],
        { cloudSpillover },
      );
    }
    cloudSpillover = 'AUTHORIZED_SEPARATELY';
  }

  // Large simulations must estimate cost before execution
  if (estimate.kind === 'simulation' && (!estimate.costEstimated || estimate.memoryBytes <= 0)) {
    return deny(estimate, 'DENIED', [
      'Large/any simulation must estimate resource cost before execution; missing or zero memory estimate.',
    ]);
  }
  if (estimate.largeSimulation && !estimate.costEstimated) {
    return deny(estimate, 'DENIED', [
      'Large simulation requires an explicit cost estimate before execution.',
    ]);
  }

  // Thermal — read-only; never disable protections
  const thermal = observation.thermalState ?? 'unknown';
  if (thermal !== 'unknown' && thermalRank(thermal) >= thermalRank(eff.thermalDenyAt)) {
    return deny(
      estimate,
      'THERMAL_LIMIT',
      [
        `Thermal state ${thermal} reached deny threshold ${eff.thermalDenyAt}. Windows thermal protections remain enabled; no fan/BIOS/power-limit changes attempted.`,
      ],
      { cloudSpillover },
    );
  }

  // Battery saver for background XIV work
  const onBattery = observation.onAcPower === false;
  const batteryLow =
    typeof observation.batteryPercent === 'number' &&
    observation.batteryPercent < eff.minBatteryPercentForBackground;
  if (onBattery && batteryLow && estimate.priority === 'xiv_background') {
    return {
      action: 'QUEUE',
      state: 'BATTERY_SAVER',
      allowed: false,
      reasons: [
        `Battery ${observation.batteryPercent}% on DC is below background floor ${eff.minBatteryPercentForBackground}%; XIV background work queued.`,
      ],
      estimate,
      cloudSpillover,
      stopSafeRequired: false,
      priorityDeferred: true,
      locks: EL9_LOCKS,
    };
  }

  // Priority: system-critical / user over XIV background
  const priorityDeferred =
    estimate.priority === 'xiv_background' &&
    (observation.userWorkloadActive === true || observation.systemCriticalActive === true);
  if (priorityDeferred) {
    return {
      action: 'QUEUE',
      state: 'RESOURCE_PRESSURE',
      allowed: false,
      reasons: [
        'System-critical/user workloads have priority over XIV background work; request queued.',
      ],
      estimate,
      cloudSpillover,
      stopSafeRequired: false,
      priorityDeferred: true,
      locks: EL9_LOCKS,
    };
  }

  // Queue full
  if (observation.queueDepth >= eff.maxQueueSize) {
    return deny(
      estimate,
      'QUEUE_FULL',
      [`Queue depth ${observation.queueDepth} meets/exceeds ceiling ${eff.maxQueueSize}.`],
      { cloudSpillover },
    );
  }

  // Hard ceiling checks via preserved evaluator + extended dimensions
  const ceiling = evaluateResourceRequest(
    {
      concurrentTasks: observation.activeWorkers + estimate.cpuWorkers,
      estimatedMemoryBytes: estimate.memoryBytes,
    },
    { maxConcurrentTasks: eff.maxWorkerCount, maxMemoryBytes: eff.maxMemoryBytes },
  );
  if (!ceiling.allowed) {
    const memoryHit = ceiling.reasons.some((r) => /memory/i.test(r));
    const state: GovernorState = memoryHit ? 'MEMORY_LIMIT' : 'RESOURCE_PRESSURE';
    // Over absolute ceilings → DENY; near pressure with room to queue → QUEUE
    if (
      estimate.memoryBytes > eff.maxMemoryBytes ||
      estimate.cpuWorkers > eff.maxWorkerCount ||
      observation.activeWorkers + estimate.cpuWorkers > eff.maxWorkerCount
    ) {
      // If only concurrency pressure and queue has room, queue instead of hard deny
      if (
        estimate.memoryBytes <= eff.maxMemoryBytes &&
        estimate.cpuWorkers <= eff.maxWorkerCount &&
        observation.queueDepth < eff.maxQueueSize
      ) {
        return {
          action: 'QUEUE',
          state: 'RESOURCE_PRESSURE',
          allowed: false,
          reasons: [...ceiling.reasons, 'Queued until worker/memory headroom recovers.'],
          estimate,
          cloudSpillover,
          stopSafeRequired: false,
          priorityDeferred: false,
          locks: EL9_LOCKS,
        };
      }
      return deny(estimate, state, ceiling.reasons, { cloudSpillover });
    }
  }

  if (observation.memoryUsedBytes + estimate.memoryBytes > eff.maxMemoryBytes) {
    if (observation.queueDepth < eff.maxQueueSize) {
      return {
        action: 'QUEUE',
        state: 'MEMORY_LIMIT',
        allowed: false,
        reasons: [
          `Projected memory ${observation.memoryUsedBytes + estimate.memoryBytes} exceeds ceiling ${eff.maxMemoryBytes}; queued.`,
        ],
        estimate,
        cloudSpillover,
        stopSafeRequired: false,
        priorityDeferred: false,
        locks: EL9_LOCKS,
      };
    }
    return deny(
      estimate,
      'MEMORY_LIMIT',
      [
        `Projected memory ${observation.memoryUsedBytes + estimate.memoryBytes} exceeds ceiling ${eff.maxMemoryBytes} and queue is full.`,
      ],
      { cloudSpillover },
    );
  }

  // Model sessions
  if (observation.activeModelSessions + estimate.modelSessions > eff.maxConcurrentModelSessions) {
    if (observation.queueDepth < eff.maxQueueSize) {
      return {
        action: 'QUEUE',
        state: 'RESOURCE_PRESSURE',
        allowed: false,
        reasons: [
          `Model sessions ${observation.activeModelSessions + estimate.modelSessions} exceed ceiling ${eff.maxConcurrentModelSessions}; queued.`,
        ],
        estimate,
        cloudSpillover,
        stopSafeRequired: false,
        priorityDeferred: false,
        locks: EL9_LOCKS,
      };
    }
    return deny(
      estimate,
      'DENIED',
      [
        `Model sessions ${observation.activeModelSessions + estimate.modelSessions} exceed ceiling ${eff.maxConcurrentModelSessions}.`,
      ],
      { cloudSpillover },
    );
  }

  // Cache / storage growth
  if (observation.localCacheBytes + estimate.cacheBytes > eff.maxLocalCacheBytes) {
    return deny(
      estimate,
      'DENIED',
      [
        `Local cache growth ${observation.localCacheBytes + estimate.cacheBytes} exceeds ceiling ${eff.maxLocalCacheBytes}.`,
      ],
      { cloudSpillover },
    );
  }

  // Network use
  if (estimate.networkBytes > eff.maxNetworkBytesPerTask) {
    return deny(
      estimate,
      'DENIED',
      [
        `Estimated network ${estimate.networkBytes} exceeds per-task ceiling ${eff.maxNetworkBytesPerTask}.`,
      ],
      { cloudSpillover },
    );
  }

  // Task duration
  if (estimate.durationMs > eff.maxTaskDurationMs) {
    return deny(
      estimate,
      'DENIED',
      [
        `Estimated duration ${estimate.durationMs}ms exceeds ceiling ${eff.maxTaskDurationMs}ms.`,
      ],
      { cloudSpillover },
    );
  }

  // GPU/NPU — fall back/queue rather than destabilize when not measurable or over ceiling
  if (estimate.gpuMemoryBytes > 0) {
    const measurable = observation.gpuMemoryMeasurable === true && eff.maxGpuMemoryBytes != null;
    if (!measurable) {
      return {
        action: 'QUEUE',
        state: 'RESOURCE_PRESSURE',
        allowed: false,
        reasons: [
          'GPU memory is not measurable on this host; GPU-heavy work is queued rather than risking destabilization. CPU fallback/router should be preferred.',
        ],
        estimate,
        cloudSpillover,
        stopSafeRequired: false,
        priorityDeferred: false,
        locks: EL9_LOCKS,
      };
    }
    const used = observation.gpuMemoryUsedBytes ?? 0;
    if (used + estimate.gpuMemoryBytes > (eff.maxGpuMemoryBytes as number)) {
      return {
        action: 'QUEUE',
        state: 'RESOURCE_PRESSURE',
        allowed: false,
        reasons: [
          `GPU memory ${used + estimate.gpuMemoryBytes} exceeds ceiling ${eff.maxGpuMemoryBytes}; queued (no destabilizing overcommit).`,
        ],
        estimate,
        cloudSpillover,
        stopSafeRequired: false,
        priorityDeferred: false,
        locks: EL9_LOCKS,
      };
    }
  }

  if (estimate.npuMemoryBytes > 0) {
    const measurable = observation.npuMemoryMeasurable === true && eff.maxNpuMemoryBytes != null;
    if (!measurable) {
      return {
        action: 'QUEUE',
        state: 'RESOURCE_PRESSURE',
        allowed: false,
        reasons: [
          'NPU memory is not measurable on this host; NPU-heavy work is queued rather than risking destabilization.',
        ],
        estimate,
        cloudSpillover,
        stopSafeRequired: false,
        priorityDeferred: false,
        locks: EL9_LOCKS,
      };
    }
    const used = observation.npuMemoryUsedBytes ?? 0;
    if (used + estimate.npuMemoryBytes > (eff.maxNpuMemoryBytes as number)) {
      return {
        action: 'QUEUE',
        state: 'RESOURCE_PRESSURE',
        allowed: false,
        reasons: [
          `NPU memory ${used + estimate.npuMemoryBytes} exceeds ceiling ${eff.maxNpuMemoryBytes}; queued.`,
        ],
        estimate,
        cloudSpillover,
        stopSafeRequired: false,
        priorityDeferred: false,
        locks: EL9_LOCKS,
      };
    }
  }

  // Thermal throttle (serious but not critical)
  if (
    thermal !== 'unknown' &&
    thermalRank(thermal) >= thermalRank(eff.thermalThrottleAt) &&
    estimate.priority === 'xiv_background'
  ) {
    return {
      action: 'THROTTLE',
      state: 'THERMAL_LIMIT',
      allowed: true,
      reasons: [
        `Thermal state ${thermal} requires throttle for background work. Thermal protections remain enabled.`,
      ],
      estimate,
      throttle: throttlePlan(eff),
      cloudSpillover,
      stopSafeRequired: false,
      priorityDeferred: false,
      locks: EL9_LOCKS,
    };
  }

  // Battery saver throttle (on DC but above floor, or background on battery)
  if (onBattery && estimate.priority === 'xiv_background' && !batteryLow) {
    return {
      action: 'THROTTLE',
      state: 'BATTERY_SAVER',
      allowed: true,
      reasons: ['On battery power — XIV background work runs throttled under BATTERY_SAVER.'],
      estimate,
      throttle: throttlePlan(eff),
      cloudSpillover,
      stopSafeRequired: false,
      priorityDeferred: false,
      locks: EL9_LOCKS,
    };
  }

  // CPU utilization pressure → throttle
  const projectedCpu = observation.cpuUtilizationPercent + estimate.cpuPercent;
  if (projectedCpu > eff.maxCpuUtilizationPercent) {
    if (projectedCpu > eff.maxCpuUtilizationPercent * 1.25 && estimate.priority === 'xiv_background') {
      return {
        action: 'QUEUE',
        state: 'RESOURCE_PRESSURE',
        allowed: false,
        reasons: [
          `Projected CPU ${projectedCpu}% exceeds ceiling ${eff.maxCpuUtilizationPercent}%; background work queued.`,
        ],
        estimate,
        cloudSpillover,
        stopSafeRequired: false,
        priorityDeferred: false,
        locks: EL9_LOCKS,
      };
    }
    return {
      action: 'THROTTLE',
      state: 'THROTTLED',
      allowed: true,
      reasons: [
        `Projected CPU ${projectedCpu}% exceeds soft ceiling ${eff.maxCpuUtilizationPercent}%; throttling.`,
      ],
      estimate,
      throttle: throttlePlan(eff),
      cloudSpillover,
      stopSafeRequired: false,
      priorityDeferred: false,
      locks: EL9_LOCKS,
    };
  }

  // Absolute hard deny for oversubscribed single-request ceilings (request alone exceeds policy)
  if (estimate.memoryBytes > eff.maxMemoryBytes) {
    return deny(
      estimate,
      'MEMORY_LIMIT',
      [`Estimated memory ${estimate.memoryBytes} exceeds ceiling ${eff.maxMemoryBytes}.`],
      { cloudSpillover },
    );
  }
  if (estimate.cpuWorkers > eff.maxWorkerCount) {
    return deny(
      estimate,
      'DENIED',
      [`Estimated workers ${estimate.cpuWorkers} exceed ceiling ${eff.maxWorkerCount}.`],
      { cloudSpillover },
    );
  }

  return {
    action: 'ALLOW',
    state: 'NORMAL',
    allowed: true,
    reasons: reasons.length ? reasons : ['Within configured resource ceilings.'],
    estimate,
    cloudSpillover,
    stopSafeRequired: false,
    priorityDeferred: false,
    locks: EL9_LOCKS,
  };
}

/**
 * Monitor a running task; stop safely if live usage exceeds policy.
 * Does not disable thermal protections or mutate firmware/power limits.
 */
export function monitorRunningTask(
  sample: MonitorSample,
  policy: ResourceGovernorPolicy = DEFAULT_EL9_POLICY,
): MonitorVerdict {
  const reasons: string[] = [];

  if (sample.heartbeatState === 'OFFLINE_STOPPED') {
    return {
      action: 'STOP_SAFE',
      state: 'OFFLINE_STOPPED',
      reasons: ['Heartbeat OFFLINE_STOPPED — stop task safely.'],
      stopSafeRequired: true,
    };
  }
  if (sample.heartbeatState === 'WAITING_NODE' || sample.heartbeatState === 'STALE') {
    return {
      action: 'STOP_SAFE',
      state: 'WAITING_NODE',
      reasons: [`Heartbeat ${sample.heartbeatState} — stop task safely.`],
      stopSafeRequired: true,
    };
  }

  const thermal = sample.thermalState ?? 'unknown';
  if (thermal !== 'unknown' && thermalRank(thermal) >= thermalRank(policy.thermalDenyAt)) {
    return {
      action: 'STOP_SAFE',
      state: 'THERMAL_LIMIT',
      reasons: [
        `Thermal state ${thermal} — stop safely. Windows thermal protections remain enabled.`,
      ],
      stopSafeRequired: true,
    };
  }

  if (sample.elapsedMs > policy.maxTaskDurationMs) {
    reasons.push(
      `Elapsed ${sample.elapsedMs}ms exceeds duration ceiling ${policy.maxTaskDurationMs}ms.`,
    );
    return {
      action: 'STOP_SAFE',
      state: 'DENIED',
      reasons,
      stopSafeRequired: true,
    };
  }

  if (sample.memoryBytesInUse > policy.maxMemoryBytes) {
    return {
      action: 'STOP_SAFE',
      state: 'MEMORY_LIMIT',
      reasons: [
        `Live memory ${sample.memoryBytesInUse} exceeds ceiling ${policy.maxMemoryBytes}.`,
      ],
      stopSafeRequired: true,
    };
  }

  if (sample.cpuPercentInUse > policy.maxCpuUtilizationPercent * 1.35) {
    return {
      action: 'STOP_SAFE',
      state: 'RESOURCE_PRESSURE',
      reasons: [
        `Live CPU ${sample.cpuPercentInUse}% far exceeds ceiling ${policy.maxCpuUtilizationPercent}%.`,
      ],
      stopSafeRequired: true,
    };
  }

  if (
    sample.onAcPower === false &&
    typeof sample.batteryPercent === 'number' &&
    sample.batteryPercent < policy.minBatteryPercentForBackground
  ) {
    return {
      action: 'STOP_SAFE',
      state: 'BATTERY_SAVER',
      reasons: [
        `Battery ${sample.batteryPercent}% below floor while on DC — stop background work safely.`,
      ],
      stopSafeRequired: true,
    };
  }

  return {
    action: 'CONTINUE',
    state: 'NORMAL',
    reasons: ['Within live monitor ceilings.'],
    stopSafeRequired: false,
  };
}

/**
 * Convenience: estimate then govern (full EL9 pipeline entry).
 */
export function evaluateGovernedRequest(
  request: TaskResourceRequest,
  observation: HostResourceObservation,
  policy: ResourceGovernorPolicy = DEFAULT_EL9_POLICY,
): GovernorDecision {
  return governTaskRequest(request, observation, policy);
}
