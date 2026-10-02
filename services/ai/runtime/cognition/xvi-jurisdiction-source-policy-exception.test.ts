import test from "node:test";
import assert from "node:assert/strict";
import {
  createJurisdictionSourcePolicyEvidenceBinding,
  issueJurisdictionSourcePolicyExceptionBatch,
  type XviJurisdictionSourcePolicyExceptionReason,
} from "./xvi-jurisdiction-source-policy-exception";

const observedAt = "2026-10-02T09:00:00.000Z";

function batchBase(overrides: Record<string, unknown> = {}): any {
  return {
    batchId: "source-policy-exception-batch:alpha",
    scheduleId: "jurisdiction-schedule:alpha",
    globalFeedPlanId: "global-feed:x6-brain",
    tenantId: "tenant:alpha",
    jurisdictionId: "jurisdiction:za",
    runMode: "ONLINE_GOVERNED",
    observedAt,
    exceptions: [],
    zeroSecretContext: true,
    safeReadOnly: true,
    canFetchExternalData: false,
    canFeedCountryCell: false,
    canFeedCore: false,
    executionAuthority: false,
    mutationAuthority: false,
    productionAuthority: false,
    ...overrides,
  };
}

function exception(
  reason: XviJurisdictionSourcePolicyExceptionReason,
  index = 1,
  overrides: Record<string, unknown> = {},
  batchContext: any = batchBase()
) {
  const batch = batchContext;
  const seed = {
    exceptionId: `source-policy-exception:${index}`,
    tenantId: "tenant:alpha",
    jurisdictionId: "jurisdiction:za",
    sourceId: `source:${index}`,
    dedupKey: index.toString(16).padStart(64, "0"),
    reason,
    evidenceHash: (index + 100).toString(16).padStart(64, "0"),
    attemptCount: reason === "RETRY_EXHAUSTED" ? 3 : 0,
    maxRetries: 3,
    firstObservedAt: "2026-10-02T08:50:00.000Z",
    lastObservedAt: "2026-10-02T08:55:00.000Z",
    ...overrides,
  };
  const evidenceBindingHash = createJurisdictionSourcePolicyEvidenceBinding(batch, seed as any);
  return { ...seed, evidenceBindingHash };
}

function withExceptions(items: unknown[], overrides: Record<string, unknown> = {}) {
  return batchBase({ exceptions: items, ...overrides });
}

test("maps all policy exception reasons to bounded dispositions", () => {
  const reasons: XviJurisdictionSourcePolicyExceptionReason[] = [
    "LICENSE_MISSING",
    "PERMISSION_MISSING",
    "PROVENANCE_INVALID",
    "LANGUAGE_SCOPE_MISMATCH",
    "DATASET_SCOPE_MISMATCH",
    "RESTRICTED_PERSONAL_DATA",
    "DEDUP_COLLISION",
    "RESOURCE_CEILING",
    "RETRY_EXHAUSTED",
  ];
  const receipt = issueJurisdictionSourcePolicyExceptionBatch(
    withExceptions(reasons.map((reason, index) => exception(reason, index + 1)))
  );
  assert.equal(receipt.exceptionCount, 9);
  assert.equal(receipt.deferredCount, 1);
  assert.equal(receipt.needsReviewCount, 5);
  assert.equal(receipt.quarantinedCount, 2);
  assert.equal(receipt.rejectedCount, 1);
  assert.equal(receipt.requiresDurableReplayLedger, true);
  assert.equal(receipt.replayScope, "BATCH_ONLY");
});

test("all governed modes preserve zero action authority", () => {
  for (const runMode of ["ONLINE_GOVERNED", "OFFLINE_GOVERNED", "LOCAL_ONLY"] as const) {
    const batch = batchBase({ runMode });
    const item = exception("LICENSE_MISSING", 1, {}, batch);
    const receipt = issueJurisdictionSourcePolicyExceptionBatch({ ...batch, exceptions: [item] });
    assert.equal(receipt.runMode, runMode);
    assert.equal(receipt.canFetchExternalData, false);
    assert.equal(receipt.canFeedCountryCell, false);
    assert.equal(receipt.canFeedCore, false);
    assert.equal(receipt.executionAuthority, false);
  }
});

test("tenant scope mismatch fails closed", () => {
  const item = exception("LICENSE_MISSING", 1, { tenantId: "tenant:other" });
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([item])),
    /TENANT_SCOPE_MISMATCH/
  );
});

test("jurisdiction scope mismatch fails closed", () => {
  const item = exception("LICENSE_MISSING", 1, { jurisdictionId: "jurisdiction:other" });
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([item])),
    /JURISDICTION_SCOPE_MISMATCH/
  );
});

test("malformed evidence hash fails closed", () => {
  const item = exception("PROVENANCE_INVALID", 1, { evidenceHash: "bad" });
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([item])),
    /EVIDENCE_HASH_INVALID/
  );
});

test("forged evidence binding fails closed", () => {
  const item = { ...exception("PROVENANCE_INVALID"), evidenceBindingHash: "f".repeat(64) };
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([item])),
    /EVIDENCE_BINDING_MISMATCH/
  );
});

test("replayed equivalent event is rejected inside a batch", () => {
  const first = exception("LICENSE_MISSING", 1);
  const secondBase = {
    ...first,
    exceptionId: "source-policy-exception:2",
  };
  const second = {
    ...secondBase,
    evidenceBindingHash: createJurisdictionSourcePolicyEvidenceBinding(batchBase(), secondBase),
  };
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([first, second])),
    /REPLAY_DUPLICATE/
  );
});

test("duplicate exception IDs fail closed", () => {
  const first = exception("LICENSE_MISSING", 1);
  const second = exception("PERMISSION_MISSING", 1, {
    sourceId: "source:2",
    dedupKey: "2".repeat(64),
    evidenceHash: "3".repeat(64),
  });
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([first, second])),
    /ID_DUPLICATE/
  );
});

test("retry exhausted reason requires exhausted bounded retries", () => {
  const item = exception("RETRY_EXHAUSTED", 1, { attemptCount: 2, maxRetries: 3 });
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([item])),
    /RETRY_NOT_EXHAUSTED/
  );
});

test("resource ceiling is deferred and retryable without claiming execution", () => {
  const receipt = issueJurisdictionSourcePolicyExceptionBatch(
    withExceptions([exception("RESOURCE_CEILING")])
  );
  const item = receipt.exceptions[0];
  assert.equal(item.disposition, "DEFERRED");
  assert.equal(item.canRetry, true);
  assert.equal(item.requiresHumanReview, false);
  assert.equal(item.executionAuthority, false);
});

test("exception count above bounded ceiling fails closed", () => {
  const items = Array.from({ length: 129 }, (_, index) =>
    exception("RESOURCE_CEILING", index + 1)
  );
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions(items)),
    /COUNT_INVALID/
  );
});

test("retry values above three fail closed", () => {
  const item = exception("RESOURCE_CEILING", 1, { maxRetries: 4 });
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([item])),
    /MAX_RETRIES_INVALID/
  );
});

test("future exception observations fail closed", () => {
  const item = exception("LICENSE_MISSING", 1, {
    lastObservedAt: "2026-10-02T09:05:00.000Z",
  });
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([item])),
    /FROM_FUTURE/
  );
});

test("batch authority escalation is refused", () => {
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(
      withExceptions([exception("LICENSE_MISSING")], { canFeedCore: true })
    ),
    /AUTHORITY_VIOLATION/
  );
});

test("accessor-bearing exception fails without executing getter", () => {
  let hits = 0;
  const hostile: Record<string, unknown> = exception("LICENSE_MISSING");
  Object.defineProperty(hostile, "sourceId", {
    enumerable: true,
    get() {
      hits += 1;
      return "source:evil";
    },
  });
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch(withExceptions([hostile])),
    /ACCESSOR_FORBIDDEN/
  );
  assert.equal(hits, 0);
});

test("hidden batch fields fail exact schema validation", () => {
  assert.throws(
    () => issueJurisdictionSourcePolicyExceptionBatch({
      ...withExceptions([exception("LICENSE_MISSING")]),
      hiddenAuthority: true,
    }),
    /SCHEMA_MISMATCH/
  );
});
