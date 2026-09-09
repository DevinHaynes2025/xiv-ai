import { selectAccelerator, type AcceleratorKind } from './accelerator-fabric';
import { probeHardware, type HardwareCapability } from './hardware-probe';
import { localModelStatus } from './local-model';

export type EvidenceState = 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'UNKNOWN' | 'NOT_TESTED';

export type ResourceBudget = {
  maxConcurrentWorkcells: number;
  maxModelCalls: number;
  maxRetries: number;
  modelCallsUsed: number;
  workcellsInFlight: number;
};

export type LocalModelRoute = {
  target: 'local' | 'none';
  state: 'AVAILABLE' | 'UNAVAILABLE';
  cloudFallback: false;
  reason: string;
  model: string | null;
};

export type HardwareSchedule = {
  selected: 'cpu' | AcceleratorKind | 'none';
  state: 'AVAILABLE' | 'UNAVAILABLE';
  hardware: HardwareCapability[];
  physicalDeviceControl: false;
  reason: string;
};

const DEFAULT_BUDGET: ResourceBudget = {
  maxConcurrentWorkcells: 2,
  maxModelCalls: 8,
  maxRetries: 3,
  modelCallsUsed: 0,
  workcellsInFlight: 0,
};

const budgets = new Map<string, ResourceBudget>();

function scopeKey(tenantId: string, universeId: string) {
  return `${tenantId}::${universeId}`;
}

export function resourceBudgetFor(tenantId: string, universeId: string): ResourceBudget {
  const key = scopeKey(tenantId, universeId);
  const existing = budgets.get(key);
  if (existing) return { ...existing };
  const created = { ...DEFAULT_BUDGET };
  budgets.set(key, created);
  return { ...created };
}

export function resetResourceBudget(tenantId: string, universeId: string) {
  budgets.set(scopeKey(tenantId, universeId), { ...DEFAULT_BUDGET });
}

export function admitWorkcell(tenantId: string, universeId: string) {
  const key = scopeKey(tenantId, universeId);
  const budget = budgets.get(key) ?? { ...DEFAULT_BUDGET };
  if (budget.workcellsInFlight >= budget.maxConcurrentWorkcells) {
    return {
      admitted: false as const,
      state: 'UNAVAILABLE' as const,
      reason: 'Resource governor refused: concurrent workcell budget exhausted.',
      budget: { ...budget },
      permissionExpansion: false as const,
    };
  }
  budget.workcellsInFlight += 1;
  budgets.set(key, budget);
  return {
    admitted: true as const,
    state: 'PASS' as const,
    reason: 'Workcell admitted under local resource budget.',
    budget: { ...budget },
    permissionExpansion: false as const,
  };
}

export function releaseWorkcell(tenantId: string, universeId: string) {
  const key = scopeKey(tenantId, universeId);
  const budget = budgets.get(key);
  if (!budget) return;
  budget.workcellsInFlight = Math.max(0, budget.workcellsInFlight - 1);
}

export function consumeModelCall(tenantId: string, universeId: string) {
  const key = scopeKey(tenantId, universeId);
  const budget = budgets.get(key) ?? { ...DEFAULT_BUDGET };
  if (budget.modelCallsUsed >= budget.maxModelCalls) {
    return {
      allowed: false as const,
      state: 'UNAVAILABLE' as const,
      reason: 'Resource governor refused: local model-call budget exhausted.',
      budget: { ...budget },
    };
  }
  budget.modelCallsUsed += 1;
  budgets.set(key, budget);
  return { allowed: true as const, state: 'PASS' as const, reason: 'Model call consumed.', budget: { ...budget } };
}

export async function routeLocalModel(): Promise<LocalModelRoute> {
  const status = await localModelStatus();
  if (status.availability === 'AVAILABLE' && status.model) {
    return {
      target: 'local',
      state: 'AVAILABLE',
      cloudFallback: false,
      reason: status.reason,
      model: status.model,
    };
  }
  return {
    target: 'none',
    state: 'UNAVAILABLE',
    cloudFallback: false,
    reason: status.reason,
    model: status.model,
  };
}

export async function scheduleWorkcellCompute(): Promise<HardwareSchedule> {
  const hardware = await probeHardware();
  const cpu = hardware.find((item) => item.kind === 'cpu' && item.availability === 'AVAILABLE');
  const gpu = hardware.find((item) => item.kind === 'nvidia_gpu' && item.availability === 'AVAILABLE');
  const accelerator = selectAccelerator('inference', { localOnly: true });

  if (gpu) {
    return {
      selected: 'nvidia_cuda',
      state: 'AVAILABLE',
      hardware,
      physicalDeviceControl: false,
      reason: 'Local NVIDIA GPU probed AVAILABLE; scheduling GPU-capable work. No physical device control.',
    };
  }
  if (accelerator) {
    return {
      selected: accelerator.kind,
      state: 'AVAILABLE',
      hardware,
      physicalDeviceControl: false,
      reason: `Verified local accelerator ${accelerator.id} selected. No physical device control.`,
    };
  }
  if (cpu) {
    return {
      selected: 'cpu',
      state: 'AVAILABLE',
      hardware,
      physicalDeviceControl: false,
      reason: 'GPU/accelerator UNAVAILABLE or unverified; scheduling CPU. No physical device control.',
    };
  }
  return {
    selected: 'none',
    state: 'UNAVAILABLE',
    hardware,
    physicalDeviceControl: false,
    reason: 'No local compute probe succeeded.',
  };
}
