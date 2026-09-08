import type { Clock } from './clock';
import type { IdFactory } from './ids';
import type { TenantRef } from './types';

/** The nine signals AC-22 requires for every runtime workload. */
export const REQUIRED_TELEMETRY_SIGNALS = [
  'health',
  'workload_state',
  'agent',
  'model',
  'runtime',
  'resource_usage',
  'error',
  'security_event',
  'audit_lineage',
] as const;

export type TelemetrySignal = (typeof REQUIRED_TELEMETRY_SIGNALS)[number];

export type TelemetryEvent = {
  eventId: string;
  at: number;
  signal: TelemetrySignal;
  tenant: TenantRef | null;
  workloadId: string | null;
  nodeId: string | null;
  severity: 'info' | 'warn' | 'error' | 'critical';
  detail: Readonly<Record<string, unknown>>;
};

export type AlertPath = {
  alertId: string;
  name: string;
  channel: string;
  /** An alert path only counts as exercised when it has actually delivered. */
  exercisedAt: number | null;
  deliveries: number;
};

export class TelemetryHub {
  private readonly events: TelemetryEvent[] = [];
  private readonly byWorkload = new Map<string, Set<TelemetrySignal>>();
  private readonly alerts = new Map<string, AlertPath>();
  private readonly nodeOwners = new Map<string, string>();

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
  ) {}

  record(input: {
    signal: TelemetrySignal;
    tenant?: TenantRef | null;
    workloadId?: string | null;
    nodeId?: string | null;
    severity?: TelemetryEvent['severity'];
    detail?: Record<string, unknown>;
  }): TelemetryEvent {
    const event: TelemetryEvent = {
      eventId: this.ids.mint('tel'),
      at: this.clock.now(),
      signal: input.signal,
      tenant: input.tenant ?? null,
      workloadId: input.workloadId ?? null,
      nodeId: input.nodeId ?? null,
      severity: input.severity ?? 'info',
      detail: input.detail ?? {},
    };
    this.events.push(event);
    if (event.workloadId) {
      const signals = this.byWorkload.get(event.workloadId) ?? new Set<TelemetrySignal>();
      signals.add(event.signal);
      this.byWorkload.set(event.workloadId, signals);
    }
    return event;
  }

  registerAlertPath(name: string, channel: string): AlertPath {
    const path: AlertPath = { alertId: this.ids.mint('alert'), name, channel, exercisedAt: null, deliveries: 0 };
    this.alerts.set(path.alertId, path);
    return path;
  }

  exerciseAlertPath(alertId: string, detail: Record<string, unknown>): AlertPath | undefined {
    const path = this.alerts.get(alertId);
    if (!path) return undefined;
    const updated: AlertPath = { ...path, exercisedAt: this.clock.now(), deliveries: path.deliveries + 1 };
    this.alerts.set(alertId, updated);
    this.record({ signal: 'security_event', severity: 'warn', detail: { alert: path.name, ...detail } });
    return updated;
  }

  alertPaths(): AlertPath[] {
    return [...this.alerts.values()];
  }

  claimNodeOwner(nodeId: string, ownerPrincipalId: string) {
    this.nodeOwners.set(nodeId, ownerPrincipalId);
  }

  ownerOf(nodeId: string): string | undefined {
    return this.nodeOwners.get(nodeId);
  }

  signalsFor(workloadId: string): TelemetrySignal[] {
    return [...(this.byWorkload.get(workloadId) ?? new Set<TelemetrySignal>())];
  }

  /** A workload is traceable only when every required signal is present. */
  traceable(workloadId: string): boolean {
    const signals = this.byWorkload.get(workloadId);
    if (!signals) return false;
    return REQUIRED_TELEMETRY_SIGNALS.every((signal) => signals.has(signal));
  }

  traceabilityRate(workloadIds: readonly string[]): number {
    if (!workloadIds.length) return 0;
    const traced = workloadIds.filter((id) => this.traceable(id)).length;
    return traced / workloadIds.length;
  }

  count(signal?: TelemetrySignal): number {
    return signal ? this.events.filter((event) => event.signal === signal).length : this.events.length;
  }

  export(): readonly TelemetryEvent[] {
    return this.events;
  }
}
