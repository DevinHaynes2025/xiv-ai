import { createHash } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export type OperationsClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type RuntimeHealth = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';

export type MeasuredOperationsEvent = {
  tenantId: string;
  eventId: string;
  kind: 'USAGE' | 'BOOKKEEPING' | 'TASK' | 'MEETING' | 'RUNTIME';
  measuredAt: string;
  classification: OperationsClassification;
  evidenceRefs: string[];
  measurement: { measured: true; source: string; receiptId: string };
  payload: Record<string, unknown>;
};

export type OperationsMaterializedSnapshot = {
  schemaVersion: 1;
  tenantId: string;
  generatedAt: string;
  sourceEventCount: number;
  sourceEvidenceRefs: string[];
  usage: {
    views: number;
    uniqueUsers: number;
    sessions: number;
    featureUsage: Record<string, number>;
    surfaceViews: Record<string, number>;
  };
  bookkeeping: {
    approvedEntries: number;
    pendingApprovalEntries: number;
    rejectedEntries: number;
    approvedAmountMinorByCurrency: Record<string, number>;
  };
  tasks: { open: number; blocked: number; completed: number; blockedTaskIds: string[] };
  meetings: { total: number; unresolvedDissent: number; followUpTaskIds: string[] };
  runtime: Record<string, { status: RuntimeHealth; measuredAt: string; receiptId: string }>;
};

type SnapshotEnvelope = {
  tenantId: string;
  schemaVersion: 1;
  payloadHash: string;
  snapshot: OperationsMaterializedSnapshot;
};

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${label} is required`);
  return value.trim();
}

function safeTenant(tenantId: string): string {
  requiredString(tenantId, 'tenantId');
  if (!/^[A-Za-z0-9._-]+$/.test(tenantId)) throw new Error('tenantId contains unsafe path characters');
  return tenantId;
}

function assertEvent(event: MeasuredOperationsEvent, tenantId: string): void {
  if (event.tenantId !== tenantId) throw new Error('cross-tenant operations event rejected');
  if (event.classification === 'TOP_SECRET') throw new Error('TOP_SECRET is excluded from ordinary operations views');
  if (!event.measurement?.measured) throw new Error('only measured events may refresh operations views');
  requiredString(event.measurement.source, 'measurement.source');
  requiredString(event.measurement.receiptId, 'measurement.receiptId');
  if (!Array.isArray(event.evidenceRefs) || event.evidenceRefs.length === 0) throw new Error('evidenceRefs are required');
  event.evidenceRefs.forEach((ref) => requiredString(ref, 'evidenceRef'));
  requiredString(event.eventId, 'eventId');
  if (Number.isNaN(Date.parse(event.measuredAt))) throw new Error('measuredAt must be an ISO-compatible timestamp');
}

function numberValue(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

export function materializeOperationsViews(
  tenantId: string,
  events: MeasuredOperationsEvent[],
  generatedAt = new Date().toISOString(),
): OperationsMaterializedSnapshot {
  safeTenant(tenantId);
  const ids = new Set<string>();
  const actors = new Set<string>();
  const sessions = new Set<string>();
  const featureUsage: Record<string, number> = {};
  const surfaceViews: Record<string, number> = {};
  const approvedAmountMinorByCurrency: Record<string, number> = {};
  const blockedTaskIds = new Set<string>();
  const followUpTaskIds = new Set<string>();
  const runtime: OperationsMaterializedSnapshot['runtime'] = {};
  const evidence = new Set<string>();
  let views = 0;
  let approvedEntries = 0;
  let pendingApprovalEntries = 0;
  let rejectedEntries = 0;
  let open = 0;
  let blocked = 0;
  let completed = 0;
  let meetingTotal = 0;
  let unresolvedDissent = 0;

  for (const event of events) {
    assertEvent(event, tenantId);
    if (ids.has(event.eventId)) throw new Error(`duplicate eventId rejected: ${event.eventId}`);
    ids.add(event.eventId);
    event.evidenceRefs.forEach((ref) => evidence.add(ref));
    evidence.add(event.measurement.receiptId);
    const p = event.payload;

    if (event.kind === 'USAGE') {
      const usageType = requiredString(p.usageType, 'usageType');
      if (usageType === 'VIEW') {
        views += 1;
        const surface = requiredString(p.surface, 'surface');
        surfaceViews[surface] = (surfaceViews[surface] ?? 0) + 1;
        if (typeof p.actorHash === 'string' && p.actorHash) actors.add(p.actorHash);
        if (typeof p.sessionId === 'string' && p.sessionId) sessions.add(p.sessionId);
      } else if (usageType === 'SESSION') {
        sessions.add(requiredString(p.sessionId, 'sessionId'));
        if (typeof p.actorHash === 'string' && p.actorHash) actors.add(p.actorHash);
      } else if (usageType === 'FEATURE_USE') {
        const feature = requiredString(p.feature, 'feature');
        featureUsage[feature] = (featureUsage[feature] ?? 0) + 1;
        if (typeof p.actorHash === 'string' && p.actorHash) actors.add(p.actorHash);
        if (typeof p.sessionId === 'string' && p.sessionId) sessions.add(p.sessionId);
      } else {
        throw new Error(`unsupported usageType: ${usageType}`);
      }
    }

    if (event.kind === 'BOOKKEEPING') {
      const status = requiredString(p.status, 'bookkeeping.status');
      if (status === 'APPROVED') {
        requiredString(p.humanApprovalReceiptId, 'humanApprovalReceiptId');
        approvedEntries += 1;
        const currency = requiredString(p.currency, 'currency').toUpperCase();
        const amountMinor = numberValue(p.amountMinor, 'amountMinor');
        approvedAmountMinorByCurrency[currency] = (approvedAmountMinorByCurrency[currency] ?? 0) + amountMinor;
      } else if (status === 'PENDING_APPROVAL') pendingApprovalEntries += 1;
      else if (status === 'REJECTED') rejectedEntries += 1;
      else throw new Error(`unsupported bookkeeping status: ${status}`);
    }

    if (event.kind === 'TASK') {
      const status = requiredString(p.status, 'task.status');
      const taskId = requiredString(p.taskId, 'taskId');
      if (status === 'OPEN') open += 1;
      else if (status === 'BLOCKED') { blocked += 1; blockedTaskIds.add(taskId); }
      else if (status === 'COMPLETED') completed += 1;
      else throw new Error(`unsupported task status: ${status}`);
    }

    if (event.kind === 'MEETING') {
      const roles = p.activeRoles;
      if (!Array.isArray(roles) || roles.length < 2 || roles.length > 8) throw new Error('operations meetings require 2-8 active roles');
      roles.forEach((role) => requiredString(role, 'activeRole'));
      meetingTotal += 1;
      const dissent = numberValue(p.unresolvedDissentCount ?? 0, 'unresolvedDissentCount');
      if (!Number.isInteger(dissent) || dissent < 0) throw new Error('unresolvedDissentCount must be a non-negative integer');
      unresolvedDissent += dissent;
      const followUps = p.followUpTaskIds ?? [];
      if (!Array.isArray(followUps)) throw new Error('followUpTaskIds must be an array');
      followUps.forEach((id) => followUpTaskIds.add(requiredString(id, 'followUpTaskId')));
      requiredString(p.minutesEvidenceRef, 'minutesEvidenceRef');
    }

    if (event.kind === 'RUNTIME') {
      const component = requiredString(p.component, 'runtime.component');
      const status = requiredString(p.status, 'runtime.status') as RuntimeHealth;
      if (!['HEALTHY', 'DEGRADED', 'OFFLINE', 'UNVERIFIED'].includes(status)) throw new Error('invalid runtime health status');
      const current = runtime[component];
      if (!current || Date.parse(event.measuredAt) >= Date.parse(current.measuredAt)) {
        runtime[component] = { status, measuredAt: event.measuredAt, receiptId: event.measurement.receiptId };
      }
    }
  }

  return {
    schemaVersion: 1,
    tenantId,
    generatedAt,
    sourceEventCount: events.length,
    sourceEvidenceRefs: [...evidence].sort(),
    usage: { views, uniqueUsers: actors.size, sessions: sessions.size, featureUsage, surfaceViews },
    bookkeeping: { approvedEntries, pendingApprovalEntries, rejectedEntries, approvedAmountMinorByCurrency },
    tasks: { open, blocked, completed, blockedTaskIds: [...blockedTaskIds].sort() },
    meetings: { total: meetingTotal, unresolvedDissent, followUpTaskIds: [...followUpTaskIds].sort() },
    runtime,
  };
}

function hashSnapshot(snapshot: OperationsMaterializedSnapshot): string {
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

export class PersistentOperationsViewStore {
  constructor(private readonly baseDir: string) {}

  private pathFor(tenantId: string): string {
    const tenant = safeTenant(tenantId);
    const base = resolve(this.baseDir);
    const path = resolve(join(base, `${tenant}.operations-view.json`));
    if (!path.startsWith(base)) throw new Error('unsafe operations view path');
    return path;
  }

  async save(snapshot: OperationsMaterializedSnapshot): Promise<{ path: string; bytes: number; sha256: string }> {
    safeTenant(snapshot.tenantId);
    await mkdir(resolve(this.baseDir), { recursive: true, mode: 0o700 });
    const path = this.pathFor(snapshot.tenantId);
    const envelope: SnapshotEnvelope = {
      tenantId: snapshot.tenantId,
      schemaVersion: 1,
      payloadHash: hashSnapshot(snapshot),
      snapshot,
    };
    const body = `${JSON.stringify(envelope, null, 2)}\n`;
    const tmp = `${path}.tmp`;
    await writeFile(tmp, body, { encoding: 'utf8', mode: 0o600 });
    await rename(tmp, path);
    await chmod(path, 0o600);
    return { path, bytes: Buffer.byteLength(body), sha256: envelope.payloadHash };
  }

  async load(tenantId: string): Promise<OperationsMaterializedSnapshot> {
    const path = this.pathFor(tenantId);
    const envelope = JSON.parse(await readFile(path, 'utf8')) as SnapshotEnvelope;
    if (envelope.tenantId !== tenantId || envelope.snapshot.tenantId !== tenantId) throw new Error('tenant mismatch in operations view');
    if (envelope.schemaVersion !== 1 || envelope.snapshot.schemaVersion !== 1) throw new Error('unsupported operations view schema');
    if (hashSnapshot(envelope.snapshot) !== envelope.payloadHash) throw new Error('operations view integrity check failed');
    return envelope.snapshot;
  }
}
