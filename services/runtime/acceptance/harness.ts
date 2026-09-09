/**
 * Shared harness for the 2I-AI-62D acceptance suite.
 *
 * Every threshold in this suite is `measured` from code that ran in this
 * process. When something cannot be measured here — unconfigured hardware, an
 * unconfigured provider, a device farm we do not have — the threshold is
 * reported as UNCONFIGURED or UNVERIFIED. Those are not passes, and the
 * scorecard renders them as such.
 */
import { RuntimePlane } from '../src/plane';
import { ManualClock } from '../src/clock';
import { generateSigningKeys } from '../src/crypto';
import type { AuthenticatedPrincipal, Capability, ResourceBudget, TenantRef, WorkloadSpec } from '../src/types';

export type ThresholdStatus = 'PASS' | 'FAIL' | 'UNVERIFIED' | 'UNCONFIGURED';

export type Threshold = {
  id: string;
  label: string;
  target: string;
  measured: string;
  status: ThresholdStatus;
  /** Set when a failure blocks the canary gate regardless of other results. */
  blocker?: boolean;
  note?: string;
};

export type AcceptanceResult = {
  id: string;
  title: string;
  status: 'PASS' | 'FAIL' | 'UNVERIFIED' | 'PARTIAL';
  thresholds: Threshold[];
  evidence: Record<string, unknown>;
  blockers: string[];
  ranAt: string;
};

export function percent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(value === 100 || value === 0 ? 0 : 3)}%`;
}

/** A threshold that must be exactly zero. */
export function zero(id: string, label: string, observed: number, options: { blocker?: boolean; note?: string } = {}): Threshold {
  return {
    id,
    label,
    target: '0',
    measured: String(observed),
    status: observed === 0 ? 'PASS' : 'FAIL',
    blocker: options.blocker,
    note: options.note,
  };
}

/** A threshold that must reach a minimum rate, expressed as a percentage. */
export function atLeast(
  id: string,
  label: string,
  observedPercent: number,
  targetPercent: number,
  options: { blocker?: boolean; note?: string } = {},
): Threshold {
  return {
    id,
    label,
    target: targetPercent === 100 ? '100%' : `≥${targetPercent}%`,
    measured: formatPercent(observedPercent),
    // Compare with a small epsilon so floating point division does not fail a
    // rate that is exactly at the threshold.
    status: observedPercent + 1e-9 >= targetPercent ? 'PASS' : 'FAIL',
    blocker: options.blocker,
    note: options.note,
  };
}

/** A threshold that must stay at or below a ceiling (latency, error rate). */
export function atMost(
  id: string,
  label: string,
  observed: number,
  ceiling: number,
  unit: string,
  options: { blocker?: boolean; note?: string } = {},
): Threshold {
  return {
    id,
    label,
    target: `≤${ceiling}${unit}`,
    measured: `${Number.isInteger(observed) ? observed : observed.toFixed(3)}${unit}`,
    status: observed <= ceiling ? 'PASS' : 'FAIL',
    blocker: options.blocker,
    note: options.note,
  };
}

export function boolean(
  id: string,
  label: string,
  observed: boolean,
  options: { blocker?: boolean; note?: string } = {},
): Threshold {
  return {
    id,
    label,
    target: 'YES',
    measured: observed ? 'YES' : 'NO',
    status: observed ? 'PASS' : 'FAIL',
    blocker: options.blocker,
    note: options.note,
  };
}

export function unverified(id: string, label: string, target: string, note: string): Threshold {
  return { id, label, target, measured: 'UNVERIFIED', status: 'UNVERIFIED', note };
}

export function unconfigured(id: string, label: string, target: string, note: string): Threshold {
  return { id, label, target, measured: 'UNCONFIGURED', status: 'UNCONFIGURED', note };
}

export function summarize(
  id: string,
  title: string,
  thresholds: Threshold[],
  evidence: Record<string, unknown>,
): AcceptanceResult {
  const failed = thresholds.filter((threshold) => threshold.status === 'FAIL');
  const open = thresholds.filter((threshold) => threshold.status === 'UNVERIFIED' || threshold.status === 'UNCONFIGURED');
  const status: AcceptanceResult['status'] = failed.length
    ? 'FAIL'
    : open.length && open.length === thresholds.length
      ? 'UNVERIFIED'
      : open.length
        ? 'PARTIAL'
        : 'PASS';
  return {
    id,
    title,
    status,
    thresholds,
    evidence,
    blockers: failed.filter((threshold) => threshold.blocker).map((threshold) => `${id}:${threshold.id}`),
    ranAt: new Date().toISOString(),
  };
}

export function percentileOf(values: readonly number[], percentileValue: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1));
  return sorted[index] as number;
}

export const TENANT_A: TenantRef = { organizationId: 'org_northwind', universeId: 'universe_operations' };
export const TENANT_A_ALT_UNIVERSE: TenantRef = { organizationId: 'org_northwind', universeId: 'universe_research' };
export const TENANT_B: TenantRef = { organizationId: 'org_meridian', universeId: 'universe_operations' };

export const ALL_CAPABILITIES: readonly Capability[] = [
  'node.register',
  'node.control',
  'workload.submit',
  'workload.submit.protected',
  'agent.register',
  'agent.activate',
  'model.invoke',
  'offline.package.issue',
  'offline.external_action',
  'meeting.host',
  'approval.grant',
];

export function standardBudget(overrides: Partial<ResourceBudget> = {}): ResourceBudget {
  return {
    cpuMillis: 5_000,
    gpuMillis: 0,
    ramMb: 512,
    storageMb: 64,
    networkKb: 1_024,
    modelCalls: 4,
    modelTokens: 8_000,
    maxDurationMs: 60_000,
    maxAgents: 4,
    maxTasks: 8,
    maxCostUsd: 1,
    hardTerminationMs: 120_000,
    ...overrides,
  };
}

export function standardQuota(tenant: TenantRef, overrides: Record<string, number> = {}) {
  return {
    tenant,
    cpuMillis: 100_000_000,
    gpuMillis: 10_000_000,
    modelCalls: 1_000_000,
    modelTokens: 1_000_000_000,
    costUsd: 1_000_000,
    concurrentWorkloads: 5_000,
    ...overrides,
  };
}

export type Fixture = {
  clock: ManualClock;
  plane: RuntimePlane;
  operatorA: { principal: AuthenticatedPrincipal; token: string };
  operatorB: { principal: AuthenticatedPrincipal; token: string };
  operatorAltUniverse: { principal: AuthenticatedPrincipal; token: string };
  agentPrincipalA: { principal: AuthenticatedPrincipal; token: string };
  limitedA: { principal: AuthenticatedPrincipal; token: string };
};

/**
 * Builds a plane with a deterministic clock and three tenants: two separate
 * organizations plus a second universe inside the first organization. That is
 * the minimum needed to test both tenant and universe isolation.
 */
export function buildFixture(): Fixture {
  const clock = new ManualClock();
  const plane = new RuntimePlane({ clock, keys: generateSigningKeys(), env: {}, version: '62d.1.0' });

  const enroll = (tenant: TenantRef, kind: 'human' | 'agent' | 'service', capabilities: readonly Capability[], ceiling: 'public' | 'internal' | 'confidential' | 'restricted') => {
    const { record, token } = plane.principals.enroll({ kind, tenant, capabilities, maxClassification: ceiling });
    return { principal: plane.principals.verify(token), token, record };
  };

  plane.setTenantQuota(standardQuota(TENANT_A));
  plane.setTenantQuota(standardQuota(TENANT_B));
  plane.setTenantQuota(standardQuota(TENANT_A_ALT_UNIVERSE));

  return {
    clock,
    plane,
    operatorA: enroll(TENANT_A, 'human', ALL_CAPABILITIES, 'restricted'),
    operatorB: enroll(TENANT_B, 'human', ALL_CAPABILITIES, 'restricted'),
    operatorAltUniverse: enroll(TENANT_A_ALT_UNIVERSE, 'human', ALL_CAPABILITIES, 'restricted'),
    agentPrincipalA: enroll(TENANT_A, 'agent', ['workload.submit', 'model.invoke', 'agent.activate'], 'internal'),
    limitedA: enroll(TENANT_A, 'service', ['workload.submit'], 'internal'),
  };
}

let workloadCounter = 0;

export function workloadSpec(overrides: Partial<WorkloadSpec> & { tenant: TenantRef }): WorkloadSpec {
  workloadCounter += 1;
  return {
    workloadId: overrides.workloadId ?? `wl_${workloadCounter.toString(36)}`,
    tenant: overrides.tenant,
    classification: overrides.classification ?? 'internal',
    requiredCapabilities: overrides.requiredCapabilities ?? ['workload.submit'],
    hardware: overrides.hardware ?? {},
    budget: overrides.budget ?? standardBudget(),
    agentId: overrides.agentId,
    modelId: overrides.modelId,
    consequential: overrides.consequential ?? false,
    requiresApproval: overrides.requiresApproval ?? false,
    sourceId: overrides.sourceId,
  };
}

export function catchCode(fn: () => unknown): string {
  try {
    fn();
    return 'no_error';
  } catch (error) {
    const code = (error as { code?: string }).code;
    return code ?? (error instanceof Error ? error.message : 'unknown');
  }
}
