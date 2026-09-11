import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export type Classification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "SECRET" | "TOP_SECRET";
export type OperationsEventKind = "USAGE" | "BOOKKEEPING" | "TASK" | "MEETING" | "RUNTIME" | "SYNC";
export type VendorStatus = "TARGET" | "RESEARCH" | "API_READY" | "VERIFIED_PARTNER";
export type DeviceStatus = "TARGET" | "ADAPTER_BUILT" | "TESTED" | "VERIFIED";
export type ReceiptKind = "FINANCE_APPROVAL" | "MEETING_DECISION" | "VENDOR" | "DEVICE";

export interface OperationsEventInput {
  tenantId: string;
  kind: OperationsEventKind;
  occurredAt: string;
  classification: Classification;
  evidenceRefs: string[];
  payload: Record<string, unknown>;
}

export interface OperationsEvent extends OperationsEventInput {
  eventId: string;
  sequence: number;
  previousHash: string;
  hash: string;
}

export interface VerificationReceiptInput {
  tenantId: string;
  kind: ReceiptKind;
  subjectId: string;
  status?: VendorStatus | DeviceStatus;
  humanApproved?: boolean;
  evidenceRefs: string[];
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  classification?: Classification;
}

export interface VerificationReceipt extends VerificationReceiptInput {
  receiptId: string;
  sequence: number;
  previousHash: string;
  hash: string;
}

export interface OperationsMaterializedView {
  tenantId: string;
  sourceEventCount: number;
  sourceHeadHash: string;
  sourceReceiptCount: number;
  receiptHeadHash: string;
  lastSequence: number;
  rebuiltAt: string;
  freshnessMs: number;
  stale: boolean;
  integrityVerified: boolean;
  usage: {
    views: number;
    uniqueUsers: number;
    sessions: number;
    featureUsage: Record<string, number>;
  };
  bookkeeping: {
    approvedCount: number;
    pendingCount: number;
    approvedAmount: number;
    pendingAmount: number;
    canMoveMoney: false;
    canOpenAccounts: false;
    canSignContracts: false;
  };
  tasks: { open: number; blocked: number; completed: number };
  meetings: { unresolvedDissent: number; followUpTasks: number; approvedProductionDecisions: number };
  runtime: { status: "HEALTHY" | "DEGRADED" | "OFFLINE" | "UNVERIFIED"; p95LatencyMs?: number; storageUtilizationPct?: number };
  syncByPlatform: Record<string, { success: number; error: number; verifiedDeviceReceipts: number }>;
  verification: { currentVerifiedPartners: number; currentVerifiedDevices: number; universalDeviceSupportClaim: false };
}

const GENESIS = "0".repeat(64);

function assertTenantId(tenantId: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(tenantId)) throw new Error("invalid tenant id");
}

function assertEvidence(evidenceRefs: string[]): void {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0 || evidenceRefs.some((x) => !x.trim())) {
    throw new Error("evidence is required");
  }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value: unknown): string {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function parseTime(value: string): number {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error("invalid timestamp");
  return ms;
}

function isCurrent(receipt: VerificationReceipt, asOfMs: number): boolean {
  if (receipt.revokedAt && parseTime(receipt.revokedAt) <= asOfMs) return false;
  if (receipt.expiresAt && parseTime(receipt.expiresAt) <= asOfMs) return false;
  return parseTime(receipt.issuedAt) <= asOfMs;
}

export class OperationsEventJournal {
  private readonly events: OperationsEvent[] = [];
  constructor(private readonly tenantId: string) { assertTenantId(tenantId); }

  append(input: OperationsEventInput): OperationsEvent {
    if (input.tenantId !== this.tenantId) throw new Error("tenant isolation violation");
    if (input.classification === "TOP_SECRET") throw new Error("TOP_SECRET is prohibited from the ordinary operations journal");
    assertEvidence(input.evidenceRefs);
    parseTime(input.occurredAt);
    if (input.kind === "MEETING") {
      const roles = Array.isArray(input.payload.roles) ? input.payload.roles : [];
      if (roles.length < 2 || roles.length > 8) throw new Error("operations meetings require 2-8 active roles");
    }
    const previousHash = this.events.at(-1)?.hash ?? GENESIS;
    const eventWithoutHash = {
      ...input,
      eventId: typeof input.payload.eventId === "string" ? input.payload.eventId : randomUUID(),
      sequence: this.events.length + 1,
      previousHash,
    };
    const event: OperationsEvent = { ...eventWithoutHash, hash: digest(eventWithoutHash) };
    this.events.push(event);
    return event;
  }

  restore(events: OperationsEvent[]): void {
    this.events.length = 0;
    for (const event of events) {
      if (event.tenantId !== this.tenantId) throw new Error("tenant isolation violation");
      if (event.classification === "TOP_SECRET") throw new Error("TOP_SECRET journal entry rejected");
      assertEvidence(event.evidenceRefs);
      const expectedSequence = this.events.length + 1;
      const expectedPreviousHash = this.events.at(-1)?.hash ?? GENESIS;
      if (event.sequence !== expectedSequence || event.previousHash !== expectedPreviousHash) throw new Error("journal chain violation");
      const { hash, ...body } = event;
      if (digest(body) !== hash) throw new Error("journal hash mismatch");
      this.events.push({ ...event });
    }
  }

  list(): readonly OperationsEvent[] { return this.events.map((x) => ({ ...x, evidenceRefs: [...x.evidenceRefs], payload: { ...x.payload } })); }
  headHash(): string { return this.events.at(-1)?.hash ?? GENESIS; }
}

export class VerificationReceiptStore {
  private readonly receipts: VerificationReceipt[] = [];
  constructor(private readonly tenantId: string) { assertTenantId(tenantId); }

  append(input: VerificationReceiptInput): VerificationReceipt {
    if (input.tenantId !== this.tenantId) throw new Error("tenant isolation violation");
    if ((input.classification ?? "INTERNAL") === "TOP_SECRET") throw new Error("TOP_SECRET cannot enter the ordinary verification receipt store");
    assertEvidence(input.evidenceRefs);
    parseTime(input.issuedAt);
    if (input.expiresAt) parseTime(input.expiresAt);
    if (input.revokedAt) parseTime(input.revokedAt);
    if ((input.kind === "FINANCE_APPROVAL" || input.kind === "MEETING_DECISION") && input.humanApproved !== true) {
      throw new Error("human approval is required");
    }
    if (input.kind === "VENDOR" && input.status === "VERIFIED_PARTNER" && input.evidenceRefs.length === 0) throw new Error("partner evidence required");
    if (input.kind === "DEVICE" && input.status === "VERIFIED" && input.evidenceRefs.length === 0) throw new Error("device verification evidence required");
    const previousHash = this.receipts.at(-1)?.hash ?? GENESIS;
    const body = { ...input, receiptId: randomUUID(), sequence: this.receipts.length + 1, previousHash };
    const receipt: VerificationReceipt = { ...body, hash: digest(body) };
    this.receipts.push(receipt);
    return receipt;
  }

  restore(receipts: VerificationReceipt[]): void {
    this.receipts.length = 0;
    for (const receipt of receipts) {
      if (receipt.tenantId !== this.tenantId) throw new Error("tenant isolation violation");
      assertEvidence(receipt.evidenceRefs);
      const expectedSequence = this.receipts.length + 1;
      const expectedPreviousHash = this.receipts.at(-1)?.hash ?? GENESIS;
      if (receipt.sequence !== expectedSequence || receipt.previousHash !== expectedPreviousHash) throw new Error("receipt chain violation");
      const { hash, ...body } = receipt;
      if (digest(body) !== hash) throw new Error("receipt hash mismatch");
      this.receipts.push({ ...receipt });
    }
  }

  list(): readonly VerificationReceipt[] { return this.receipts.map((x) => ({ ...x, evidenceRefs: [...x.evidenceRefs] })); }
  headHash(): string { return this.receipts.at(-1)?.hash ?? GENESIS; }
  current(kind: ReceiptKind, subjectId: string, asOfMs: number): VerificationReceipt | undefined {
    return [...this.receipts].reverse().find((r) => r.kind === kind && r.subjectId === subjectId && isCurrent(r, asOfMs));
  }
}

export class JsonlHashChainStore<T extends { tenantId: string; sequence: number; previousHash: string; hash: string }> {
  constructor(private readonly rootDir: string, private readonly tenantId: string, private readonly fileName: string) {
    assertTenantId(tenantId);
    if (!/^[A-Za-z0-9._-]+\.jsonl$/.test(fileName)) throw new Error("invalid journal filename");
  }

  private filePath(): string {
    const tenantRoot = path.resolve(this.rootDir, this.tenantId);
    const target = path.resolve(tenantRoot, this.fileName);
    if (!target.startsWith(`${tenantRoot}${path.sep}`)) throw new Error("path traversal rejected");
    return target;
  }

  async append(record: T): Promise<void> {
    if (record.tenantId !== this.tenantId) throw new Error("tenant isolation violation");
    const records = await this.readAll();
    const expectedSequence = records.length + 1;
    const expectedPreviousHash = records.at(-1)?.hash ?? GENESIS;
    if (record.sequence !== expectedSequence || record.previousHash !== expectedPreviousHash) throw new Error("append chain violation");
    const { hash, ...body } = record;
    if (digest(body) !== hash) throw new Error("append hash mismatch");
    await mkdir(path.dirname(this.filePath()), { recursive: true, mode: 0o700 });
    await appendFile(this.filePath(), `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
  }

  async readAll(): Promise<T[]> {
    let raw = "";
    try { raw = await readFile(this.filePath(), "utf8"); } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    const records = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as T);
    let previousHash = GENESIS;
    records.forEach((record, index) => {
      if (record.tenantId !== this.tenantId) throw new Error("tenant isolation violation");
      if (record.sequence !== index + 1 || record.previousHash !== previousHash) throw new Error("persisted chain violation");
      const { hash, ...body } = record;
      if (digest(body) !== hash) throw new Error("persisted hash mismatch");
      previousHash = hash;
    });
    return records;
  }
}

function numberValue(value: unknown): number { return typeof value === "number" && Number.isFinite(value) ? value : 0; }
function stringValue(value: unknown): string { return typeof value === "string" ? value : ""; }

export function rebuildOperationsView(
  tenantId: string,
  events: readonly OperationsEvent[],
  receipts: readonly VerificationReceipt[],
  asOfMs: number,
  staleAfterMs = 5 * 60_000,
): OperationsMaterializedView {
  assertTenantId(tenantId);
  if (events.some((e) => e.tenantId !== tenantId) || receipts.some((r) => r.tenantId !== tenantId)) throw new Error("tenant isolation violation");
  const eventJournal = new OperationsEventJournal(tenantId); eventJournal.restore([...events]);
  const receiptStore = new VerificationReceiptStore(tenantId); receiptStore.restore([...receipts]);

  const users = new Set<string>();
  const sessions = new Set<string>();
  const featureUsage: Record<string, number> = {};
  let views = 0, approvedCount = 0, pendingCount = 0, approvedAmount = 0, pendingAmount = 0;
  let open = 0, blocked = 0, completed = 0, unresolvedDissent = 0, followUpTasks = 0, approvedProductionDecisions = 0;
  let runtime: OperationsMaterializedView["runtime"] = { status: "UNVERIFIED" };
  const syncByPlatform: OperationsMaterializedView["syncByPlatform"] = {};
  let newestTime = 0;

  for (const event of events) {
    newestTime = Math.max(newestTime, parseTime(event.occurredAt));
    const p = event.payload;
    if (event.kind === "USAGE") {
      const metric = stringValue(p.metric);
      if (metric === "VIEW") views += Math.max(1, numberValue(p.count));
      const userHash = stringValue(p.userHash); if (userHash) users.add(userHash);
      const sessionId = stringValue(p.sessionId); if (sessionId) sessions.add(sessionId);
      const feature = stringValue(p.feature); if (feature) featureUsage[feature] = (featureUsage[feature] ?? 0) + Math.max(1, numberValue(p.count));
    } else if (event.kind === "BOOKKEEPING") {
      const amount = numberValue(p.amount);
      const approvalSubjectId = stringValue(p.approvalSubjectId);
      const approval = approvalSubjectId ? receiptStore.current("FINANCE_APPROVAL", approvalSubjectId, asOfMs) : undefined;
      if (approval?.humanApproved) { approvedCount++; approvedAmount += amount; } else { pendingCount++; pendingAmount += amount; }
    } else if (event.kind === "TASK") {
      const status = stringValue(p.status);
      if (status === "COMPLETED") completed++; else if (status === "BLOCKED") blocked++; else open++;
    } else if (event.kind === "MEETING") {
      unresolvedDissent += Math.max(0, numberValue(p.unresolvedDissent));
      followUpTasks += Math.max(0, numberValue(p.followUpTasks));
      const decisionSubjectId = stringValue(p.productionDecisionSubjectId);
      if (decisionSubjectId && receiptStore.current("MEETING_DECISION", decisionSubjectId, asOfMs)?.humanApproved) approvedProductionDecisions++;
    } else if (event.kind === "RUNTIME") {
      const status = stringValue(p.status);
      runtime = {
        status: status === "HEALTHY" || status === "DEGRADED" || status === "OFFLINE" ? status : "UNVERIFIED",
        p95LatencyMs: typeof p.p95LatencyMs === "number" ? p.p95LatencyMs : undefined,
        storageUtilizationPct: typeof p.storageUtilizationPct === "number" ? p.storageUtilizationPct : undefined,
      };
    } else if (event.kind === "SYNC") {
      const platform = stringValue(p.platform);
      const deviceSubjectId = stringValue(p.deviceSubjectId);
      const verified = deviceSubjectId ? receiptStore.current("DEVICE", deviceSubjectId, asOfMs) : undefined;
      if (!platform || verified?.status !== "VERIFIED") continue;
      const row = syncByPlatform[platform] ?? { success: 0, error: 0, verifiedDeviceReceipts: 0 };
      row.verifiedDeviceReceipts = Math.max(row.verifiedDeviceReceipts, 1);
      if (p.outcome === "SUCCESS") row.success++; else if (p.outcome === "ERROR") row.error++;
      syncByPlatform[platform] = row;
    }
  }

  const currentVerifiedPartners = receipts.filter((r) => r.kind === "VENDOR" && r.status === "VERIFIED_PARTNER" && isCurrent(r, asOfMs)).length;
  const currentVerifiedDevices = receipts.filter((r) => r.kind === "DEVICE" && r.status === "VERIFIED" && isCurrent(r, asOfMs)).length;
  const freshnessMs = newestTime ? Math.max(0, asOfMs - newestTime) : Number.MAX_SAFE_INTEGER;
  return {
    tenantId, sourceEventCount: events.length, sourceHeadHash: eventJournal.headHash(), sourceReceiptCount: receipts.length,
    receiptHeadHash: receiptStore.headHash(), lastSequence: events.at(-1)?.sequence ?? 0,
    rebuiltAt: new Date(asOfMs).toISOString(), freshnessMs, stale: freshnessMs > staleAfterMs, integrityVerified: true,
    usage: { views, uniqueUsers: users.size, sessions: sessions.size, featureUsage },
    bookkeeping: { approvedCount, pendingCount, approvedAmount, pendingAmount, canMoveMoney: false, canOpenAccounts: false, canSignContracts: false },
    tasks: { open, blocked, completed }, meetings: { unresolvedDissent, followUpTasks, approvedProductionDecisions }, runtime, syncByPlatform,
    verification: { currentVerifiedPartners, currentVerifiedDevices, universalDeviceSupportClaim: false },
  };
}

export function buildReadOnlyExecutiveControlSnapshot(view: OperationsMaterializedView) {
  return {
    tenantId: view.tenantId,
    generatedFrom: { eventHeadHash: view.sourceHeadHash, receiptHeadHash: view.receiptHeadHash, eventCount: view.sourceEventCount, receiptCount: view.sourceReceiptCount },
    freshness: { rebuiltAt: view.rebuiltAt, freshnessMs: view.freshnessMs, stale: view.stale, integrityVerified: view.integrityVerified },
    usage: view.usage, bookkeeping: view.bookkeeping, tasks: view.tasks, meetings: view.meetings, runtime: view.runtime,
    syncByPlatform: view.syncByPlatform, verification: view.verification,
    authority: { readOnly: true, canWrite: false, canDeploy: false, canMoveMoney: false, canOpenAccounts: false, canSignContracts: false },
  } as const;
}
