import { createHash } from "node:crypto";

export type XviJurisdictionPolicyRunMode =
  | "ONLINE_GOVERNED"
  | "OFFLINE_GOVERNED"
  | "LOCAL_ONLY";

export type XviJurisdictionSourcePolicyExceptionReason =
  | "LICENSE_MISSING"
  | "PERMISSION_MISSING"
  | "PROVENANCE_INVALID"
  | "LANGUAGE_SCOPE_MISMATCH"
  | "DATASET_SCOPE_MISMATCH"
  | "RESTRICTED_PERSONAL_DATA"
  | "DEDUP_COLLISION"
  | "RESOURCE_CEILING"
  | "RETRY_EXHAUSTED";

export type XviJurisdictionSourcePolicyDisposition =
  | "DEFERRED"
  | "NEEDS_REVIEW"
  | "QUARANTINED"
  | "REJECTED";

export interface XviJurisdictionSourcePolicyExceptionInput {
  readonly exceptionId: string;
  readonly tenantId: string;
  readonly jurisdictionId: string;
  readonly sourceId: string;
  readonly dedupKey: string;
  readonly reason: XviJurisdictionSourcePolicyExceptionReason;
  readonly evidenceHash: string;
  readonly evidenceBindingHash: string;
  readonly attemptCount: number;
  readonly maxRetries: number;
  readonly firstObservedAt: string;
  readonly lastObservedAt: string;
}

export interface XviJurisdictionSourcePolicyExceptionBatchInput {
  readonly batchId: string;
  readonly scheduleId: string;
  readonly globalFeedPlanId: string;
  readonly tenantId: string;
  readonly jurisdictionId: string;
  readonly runMode: XviJurisdictionPolicyRunMode;
  readonly observedAt: string;
  readonly exceptions: readonly XviJurisdictionSourcePolicyExceptionInput[];
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly canFetchExternalData: false;
  readonly canFeedCountryCell: false;
  readonly canFeedCore: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviJurisdictionSourcePolicyExceptionReceipt {
  readonly exceptionId: string;
  readonly tenantId: string;
  readonly jurisdictionId: string;
  readonly sourceId: string;
  readonly dedupKey: string;
  readonly reason: XviJurisdictionSourcePolicyExceptionReason;
  readonly disposition: XviJurisdictionSourcePolicyDisposition;
  readonly evidenceHash: string;
  readonly evidenceBindingHash: string;
  readonly replayKey: string;
  readonly exceptionDigest: string;
  readonly attemptCount: number;
  readonly maxRetries: number;
  readonly canRetry: boolean;
  readonly requiresHumanReview: boolean;
  readonly firstObservedAt: string;
  readonly lastObservedAt: string;
  readonly safeReadOnly: true;
  readonly canFetchExternalData: false;
  readonly canFeedCountryCell: false;
  readonly canFeedCore: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviJurisdictionSourcePolicyExceptionBatchReceipt {
  readonly schemaVersion: "xvi-jurisdiction-source-policy-exception-v1";
  readonly batchId: string;
  readonly scheduleId: string;
  readonly globalFeedPlanId: string;
  readonly tenantId: string;
  readonly jurisdictionId: string;
  readonly runMode: XviJurisdictionPolicyRunMode;
  readonly observedAt: string;
  readonly exceptionCount: number;
  readonly deferredCount: number;
  readonly needsReviewCount: number;
  readonly quarantinedCount: number;
  readonly rejectedCount: number;
  readonly exceptions: readonly XviJurisdictionSourcePolicyExceptionReceipt[];
  readonly replayScope: "BATCH_ONLY";
  readonly requiresDurableReplayLedger: true;
  readonly zeroSecretContext: true;
  readonly safeReadOnly: true;
  readonly canFetchExternalData: false;
  readonly canFeedCountryCell: false;
  readonly canFeedCore: false;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

const PLAIN = Object.getPrototypeOf({});
const MAX_EXCEPTIONS = 128;
const MAX_RETRIES = 3;
const MODES = new Set<XviJurisdictionPolicyRunMode>([
  "ONLINE_GOVERNED",
  "OFFLINE_GOVERNED",
  "LOCAL_ONLY",
]);
const REASONS = new Set<XviJurisdictionSourcePolicyExceptionReason>([
  "LICENSE_MISSING",
  "PERMISSION_MISSING",
  "PROVENANCE_INVALID",
  "LANGUAGE_SCOPE_MISMATCH",
  "DATASET_SCOPE_MISMATCH",
  "RESTRICTED_PERSONAL_DATA",
  "DEDUP_COLLISION",
  "RESOURCE_CEILING",
  "RETRY_EXHAUSTED",
]);

function plain(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== PLAIN) {
    throw new Error(`${label}_PLAIN_REQUIRED`);
  }
  if (Object.getOwnPropertySymbols(value).length) {
    throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  }
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) {
      throw new Error(`${label}_ACCESSOR_FORBIDDEN`);
    }
  }
}

function exact(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label}_SCHEMA_MISMATCH`);
  }
}

function safeInt(value: number, min: number, max: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${label}_INVALID`);
  }
}

function iso(value: string, label: string): void {
  if (typeof value !== "string" || !value.includes("T") || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label}_INVALID`);
  }
}

function hash(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label}_INVALID`);
  }
}

function id(value: string, prefix: string, label: string): void {
  if (typeof value !== "string" || !value.startsWith(prefix) || value.length > 240) {
    throw new Error(`${label}_INVALID`);
  }
}

function canonicalEvidenceBinding(
  batch: Pick<XviJurisdictionSourcePolicyExceptionBatchInput, "scheduleId" | "globalFeedPlanId" | "tenantId" | "jurisdictionId" | "runMode">,
  item: Pick<XviJurisdictionSourcePolicyExceptionInput, "sourceId" | "dedupKey" | "reason" | "evidenceHash">
): string {
  return createHash("sha256")
    .update(JSON.stringify({
      scheduleId: batch.scheduleId,
      globalFeedPlanId: batch.globalFeedPlanId,
      tenantId: batch.tenantId,
      jurisdictionId: batch.jurisdictionId,
      runMode: batch.runMode,
      sourceId: item.sourceId,
      dedupKey: item.dedupKey,
      reason: item.reason,
      evidenceHash: item.evidenceHash,
    }), "utf8")
    .digest("hex");
}

export function createJurisdictionSourcePolicyEvidenceBinding(
  batch: Pick<XviJurisdictionSourcePolicyExceptionBatchInput, "scheduleId" | "globalFeedPlanId" | "tenantId" | "jurisdictionId" | "runMode">,
  item: Pick<XviJurisdictionSourcePolicyExceptionInput, "sourceId" | "dedupKey" | "reason" | "evidenceHash">
): string {
  return canonicalEvidenceBinding(batch, item);
}

function disposition(reason: XviJurisdictionSourcePolicyExceptionReason): XviJurisdictionSourcePolicyDisposition {
  if (reason === "RESOURCE_CEILING") return "DEFERRED";
  if (reason === "PROVENANCE_INVALID" || reason === "DEDUP_COLLISION") return "QUARANTINED";
  if (reason === "RESTRICTED_PERSONAL_DATA") return "REJECTED";
  return "NEEDS_REVIEW";
}

function replayKey(
  batch: Pick<XviJurisdictionSourcePolicyExceptionBatchInput, "scheduleId" | "tenantId" | "jurisdictionId" | "runMode">,
  item: Pick<XviJurisdictionSourcePolicyExceptionInput, "sourceId" | "dedupKey" | "reason" | "evidenceHash">
): string {
  return createHash("sha256")
    .update(JSON.stringify({
      scheduleId: batch.scheduleId,
      tenantId: batch.tenantId,
      jurisdictionId: batch.jurisdictionId,
      runMode: batch.runMode,
      sourceId: item.sourceId,
      dedupKey: item.dedupKey,
      reason: item.reason,
      evidenceHash: item.evidenceHash,
    }), "utf8")
    .digest("hex");
}

function exceptionDigest(
  batch: Pick<XviJurisdictionSourcePolicyExceptionBatchInput, "batchId" | "scheduleId" | "globalFeedPlanId" | "tenantId" | "jurisdictionId" | "runMode" | "observedAt">,
  item: XviJurisdictionSourcePolicyExceptionInput,
  itemDisposition: XviJurisdictionSourcePolicyDisposition,
  itemReplayKey: string
): string {
  return createHash("sha256")
    .update(JSON.stringify({
      batchId: batch.batchId,
      scheduleId: batch.scheduleId,
      globalFeedPlanId: batch.globalFeedPlanId,
      tenantId: batch.tenantId,
      jurisdictionId: batch.jurisdictionId,
      runMode: batch.runMode,
      observedAt: batch.observedAt,
      exceptionId: item.exceptionId,
      sourceId: item.sourceId,
      dedupKey: item.dedupKey,
      reason: item.reason,
      disposition: itemDisposition,
      evidenceHash: item.evidenceHash,
      evidenceBindingHash: item.evidenceBindingHash,
      replayKey: itemReplayKey,
      attemptCount: item.attemptCount,
      maxRetries: item.maxRetries,
      firstObservedAt: item.firstObservedAt,
      lastObservedAt: item.lastObservedAt,
    }), "utf8")
    .digest("hex");
}

function validateItem(
  input: unknown,
  batch: XviJurisdictionSourcePolicyExceptionBatchInput
): Readonly<XviJurisdictionSourcePolicyExceptionInput> {
  plain(input, "SOURCE_POLICY_EXCEPTION");
  exact(input, [
    "exceptionId",
    "tenantId",
    "jurisdictionId",
    "sourceId",
    "dedupKey",
    "reason",
    "evidenceHash",
    "evidenceBindingHash",
    "attemptCount",
    "maxRetries",
    "firstObservedAt",
    "lastObservedAt",
  ], "SOURCE_POLICY_EXCEPTION");

  const item = input as unknown as XviJurisdictionSourcePolicyExceptionInput;
  id(item.exceptionId, "source-policy-exception:", "SOURCE_POLICY_EXCEPTION_ID");
  id(item.tenantId, "tenant:", "SOURCE_POLICY_EXCEPTION_TENANT");
  id(item.jurisdictionId, "jurisdiction:", "SOURCE_POLICY_EXCEPTION_JURISDICTION");
  id(item.sourceId, "source:", "SOURCE_POLICY_EXCEPTION_SOURCE");
  hash(item.dedupKey, "SOURCE_POLICY_EXCEPTION_DEDUP_KEY");
  hash(item.evidenceHash, "SOURCE_POLICY_EXCEPTION_EVIDENCE_HASH");
  hash(item.evidenceBindingHash, "SOURCE_POLICY_EXCEPTION_EVIDENCE_BINDING_HASH");
  if (!REASONS.has(item.reason)) throw new Error("SOURCE_POLICY_EXCEPTION_REASON_INVALID");
  safeInt(item.attemptCount, 0, MAX_RETRIES, "SOURCE_POLICY_EXCEPTION_ATTEMPT_COUNT");
  safeInt(item.maxRetries, 0, MAX_RETRIES, "SOURCE_POLICY_EXCEPTION_MAX_RETRIES");
  iso(item.firstObservedAt, "SOURCE_POLICY_EXCEPTION_FIRST_OBSERVED_AT");
  iso(item.lastObservedAt, "SOURCE_POLICY_EXCEPTION_LAST_OBSERVED_AT");

  if (item.tenantId !== batch.tenantId) throw new Error("SOURCE_POLICY_EXCEPTION_TENANT_SCOPE_MISMATCH");
  if (item.jurisdictionId !== batch.jurisdictionId) throw new Error("SOURCE_POLICY_EXCEPTION_JURISDICTION_SCOPE_MISMATCH");
  if (Date.parse(item.lastObservedAt) < Date.parse(item.firstObservedAt)) {
    throw new Error("SOURCE_POLICY_EXCEPTION_OBSERVED_ORDER_INVALID");
  }
  if (Date.parse(item.lastObservedAt) > Date.parse(batch.observedAt)) {
    throw new Error("SOURCE_POLICY_EXCEPTION_FROM_FUTURE");
  }
  if (item.reason === "RETRY_EXHAUSTED" && (item.maxRetries === 0 || item.attemptCount < item.maxRetries)) {
    throw new Error("SOURCE_POLICY_EXCEPTION_RETRY_NOT_EXHAUSTED");
  }

  const expectedBinding = canonicalEvidenceBinding(batch, item);
  if (item.evidenceBindingHash !== expectedBinding) {
    throw new Error("SOURCE_POLICY_EXCEPTION_EVIDENCE_BINDING_MISMATCH");
  }

  return Object.freeze({ ...item });
}

export function issueJurisdictionSourcePolicyExceptionBatch(
  input: unknown
): Readonly<XviJurisdictionSourcePolicyExceptionBatchReceipt> {
  plain(input, "SOURCE_POLICY_EXCEPTION_BATCH");
  exact(input, [
    "batchId",
    "scheduleId",
    "globalFeedPlanId",
    "tenantId",
    "jurisdictionId",
    "runMode",
    "observedAt",
    "exceptions",
    "zeroSecretContext",
    "safeReadOnly",
    "canFetchExternalData",
    "canFeedCountryCell",
    "canFeedCore",
    "executionAuthority",
    "mutationAuthority",
    "productionAuthority",
  ], "SOURCE_POLICY_EXCEPTION_BATCH");

  const batch = input as unknown as XviJurisdictionSourcePolicyExceptionBatchInput;
  id(batch.batchId, "source-policy-exception-batch:", "SOURCE_POLICY_EXCEPTION_BATCH_ID");
  id(batch.scheduleId, "jurisdiction-schedule:", "SOURCE_POLICY_EXCEPTION_SCHEDULE_ID");
  id(batch.globalFeedPlanId, "global-feed:", "SOURCE_POLICY_EXCEPTION_GLOBAL_FEED_ID");
  id(batch.tenantId, "tenant:", "SOURCE_POLICY_EXCEPTION_BATCH_TENANT");
  id(batch.jurisdictionId, "jurisdiction:", "SOURCE_POLICY_EXCEPTION_BATCH_JURISDICTION");
  if (!MODES.has(batch.runMode)) throw new Error("SOURCE_POLICY_EXCEPTION_RUN_MODE_INVALID");
  iso(batch.observedAt, "SOURCE_POLICY_EXCEPTION_BATCH_OBSERVED_AT");

  if (!Array.isArray(batch.exceptions) || batch.exceptions.length < 1 || batch.exceptions.length > MAX_EXCEPTIONS) {
    throw new Error("SOURCE_POLICY_EXCEPTION_COUNT_INVALID");
  }

  if (
    batch.zeroSecretContext !== true ||
    batch.safeReadOnly !== true ||
    batch.canFetchExternalData !== false ||
    batch.canFeedCountryCell !== false ||
    batch.canFeedCore !== false ||
    batch.executionAuthority !== false ||
    batch.mutationAuthority !== false ||
    batch.productionAuthority !== false
  ) {
    throw new Error("SOURCE_POLICY_EXCEPTION_BATCH_AUTHORITY_VIOLATION");
  }

  const exceptionIds = new Set<string>();
  const replayKeys = new Set<string>();
  const receipts: XviJurisdictionSourcePolicyExceptionReceipt[] = [];

  for (const raw of batch.exceptions) {
    const item = validateItem(raw, batch);
    if (exceptionIds.has(item.exceptionId)) {
      throw new Error("SOURCE_POLICY_EXCEPTION_ID_DUPLICATE");
    }
    exceptionIds.add(item.exceptionId);

    const itemReplayKey = replayKey(batch, item);
    if (replayKeys.has(itemReplayKey)) {
      throw new Error("SOURCE_POLICY_EXCEPTION_REPLAY_DUPLICATE");
    }
    replayKeys.add(itemReplayKey);

    const itemDisposition = disposition(item.reason);
    const canRetry = item.reason === "RESOURCE_CEILING";
    const requiresHumanReview = itemDisposition !== "DEFERRED";

    receipts.push(Object.freeze({
      exceptionId: item.exceptionId,
      tenantId: item.tenantId,
      jurisdictionId: item.jurisdictionId,
      sourceId: item.sourceId,
      dedupKey: item.dedupKey,
      reason: item.reason,
      disposition: itemDisposition,
      evidenceHash: item.evidenceHash,
      evidenceBindingHash: item.evidenceBindingHash,
      replayKey: itemReplayKey,
      exceptionDigest: exceptionDigest(batch, item, itemDisposition, itemReplayKey),
      attemptCount: item.attemptCount,
      maxRetries: item.maxRetries,
      canRetry,
      requiresHumanReview,
      firstObservedAt: item.firstObservedAt,
      lastObservedAt: item.lastObservedAt,
      safeReadOnly: true,
      canFetchExternalData: false,
      canFeedCountryCell: false,
      canFeedCore: false,
      executionAuthority: false,
      mutationAuthority: false,
      productionAuthority: false,
    }));
  }

  const deferredCount = receipts.filter((item) => item.disposition === "DEFERRED").length;
  const needsReviewCount = receipts.filter((item) => item.disposition === "NEEDS_REVIEW").length;
  const quarantinedCount = receipts.filter((item) => item.disposition === "QUARANTINED").length;
  const rejectedCount = receipts.filter((item) => item.disposition === "REJECTED").length;

  return Object.freeze({
    schemaVersion: "xvi-jurisdiction-source-policy-exception-v1",
    batchId: batch.batchId,
    scheduleId: batch.scheduleId,
    globalFeedPlanId: batch.globalFeedPlanId,
    tenantId: batch.tenantId,
    jurisdictionId: batch.jurisdictionId,
    runMode: batch.runMode,
    observedAt: batch.observedAt,
    exceptionCount: receipts.length,
    deferredCount,
    needsReviewCount,
    quarantinedCount,
    rejectedCount,
    exceptions: Object.freeze(receipts),
    replayScope: "BATCH_ONLY",
    requiresDurableReplayLedger: true,
    zeroSecretContext: true,
    safeReadOnly: true,
    canFetchExternalData: false,
    canFeedCountryCell: false,
    canFeedCore: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
  });
}
