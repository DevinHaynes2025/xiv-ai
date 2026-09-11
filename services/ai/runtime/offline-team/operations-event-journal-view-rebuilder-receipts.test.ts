import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  JsonlHashChainStore,
  OperationsEventJournal,
  VerificationReceiptStore,
  buildReadOnlyExecutiveControlSnapshot,
  rebuildOperationsView,
  type OperationsEvent,
  type VerificationReceipt,
} from "./operations-event-journal-view-rebuilder-receipts";

const tenantId = "tenant-alpha";
const now = Date.parse("2026-09-11T09:00:00.000Z");
const evidence = ["receipt://local/evidence-1"];

async function main() {
  const receipts = new VerificationReceiptStore(tenantId);
  const financeApproval = receipts.append({
    tenantId, kind: "FINANCE_APPROVAL", subjectId: "book-1", humanApproved: true,
    evidenceRefs: ["human://finance/approval-1"], issuedAt: "2026-09-11T08:50:00.000Z",
  });
  receipts.append({
    tenantId, kind: "MEETING_DECISION", subjectId: "decision-1", humanApproved: true,
    evidenceRefs: ["human://ops/decision-1"], issuedAt: "2026-09-11T08:51:00.000Z",
  });
  receipts.append({
    tenantId, kind: "VENDOR", subjectId: "vendor-a", status: "VERIFIED_PARTNER",
    evidenceRefs: ["partner://agreement/verified-a"], issuedAt: "2026-09-11T08:00:00.000Z", expiresAt: "2026-09-12T08:00:00.000Z",
  });
  receipts.append({
    tenantId, kind: "DEVICE", subjectId: "device-win-1", status: "VERIFIED",
    evidenceRefs: ["device://windows/receipt-1"], issuedAt: "2026-09-11T08:00:00.000Z", expiresAt: "2026-09-12T08:00:00.000Z",
  });
  receipts.append({
    tenantId, kind: "DEVICE", subjectId: "device-expired", status: "VERIFIED",
    evidenceRefs: ["device://expired/receipt"], issuedAt: "2026-09-10T08:00:00.000Z", expiresAt: "2026-09-11T08:30:00.000Z",
  });
  receipts.append({
    tenantId, kind: "DEVICE", subjectId: "device-revoked", status: "VERIFIED",
    evidenceRefs: ["device://revoked/receipt"], issuedAt: "2026-09-11T07:00:00.000Z", revokedAt: "2026-09-11T08:30:00.000Z",
  });

  assert.equal(receipts.current("FINANCE_APPROVAL", "book-1", now)?.receiptId, financeApproval.receiptId);
  assert.equal(receipts.current("DEVICE", "device-expired", now), undefined);
  assert.equal(receipts.current("DEVICE", "device-revoked", now), undefined);
  assert.throws(() => receipts.append({
    tenantId, kind: "FINANCE_APPROVAL", subjectId: "book-bad", humanApproved: false,
    evidenceRefs: evidence, issuedAt: "2026-09-11T08:52:00.000Z",
  }), /human approval/i);
  assert.throws(() => receipts.append({
    tenantId, kind: "DEVICE", subjectId: "device-secret", status: "VERIFIED", classification: "TOP_SECRET",
    evidenceRefs: evidence, issuedAt: "2026-09-11T08:52:00.000Z",
  }), /TOP_SECRET/);

  const journal = new OperationsEventJournal(tenantId);
  journal.append({ tenantId, kind: "USAGE", occurredAt: "2026-09-11T08:52:00.000Z", classification: "INTERNAL", evidenceRefs: evidence,
    payload: { metric: "VIEW", count: 2, userHash: "user-hash-a", sessionId: "session-a", feature: "control-room" } });
  journal.append({ tenantId, kind: "USAGE", occurredAt: "2026-09-11T08:53:00.000Z", classification: "INTERNAL", evidenceRefs: evidence,
    payload: { metric: "VIEW", count: 1, userHash: "user-hash-b", sessionId: "session-b", feature: "control-room" } });
  journal.append({ tenantId, kind: "BOOKKEEPING", occurredAt: "2026-09-11T08:54:00.000Z", classification: "CONFIDENTIAL", evidenceRefs: evidence,
    payload: { amount: 125.50, approvalSubjectId: "book-1" } });
  journal.append({ tenantId, kind: "BOOKKEEPING", occurredAt: "2026-09-11T08:54:30.000Z", classification: "CONFIDENTIAL", evidenceRefs: evidence,
    payload: { amount: 80, approvalSubjectId: "book-pending" } });
  journal.append({ tenantId, kind: "TASK", occurredAt: "2026-09-11T08:55:00.000Z", classification: "INTERNAL", evidenceRefs: evidence,
    payload: { status: "BLOCKED", taskId: "task-1" } });
  journal.append({ tenantId, kind: "MEETING", occurredAt: "2026-09-11T08:56:00.000Z", classification: "INTERNAL", evidenceRefs: evidence,
    payload: { roles: ["ops", "finance", "security"], unresolvedDissent: 1, followUpTasks: 2, productionDecisionSubjectId: "decision-1" } });
  journal.append({ tenantId, kind: "RUNTIME", occurredAt: "2026-09-11T08:57:00.000Z", classification: "INTERNAL", evidenceRefs: evidence,
    payload: { status: "HEALTHY", p95LatencyMs: 42, storageUtilizationPct: 28 } });
  journal.append({ tenantId, kind: "SYNC", occurredAt: "2026-09-11T08:58:00.000Z", classification: "INTERNAL", evidenceRefs: evidence,
    payload: { platform: "windows", deviceSubjectId: "device-win-1", outcome: "SUCCESS" } });
  journal.append({ tenantId, kind: "SYNC", occurredAt: "2026-09-11T08:58:30.000Z", classification: "INTERNAL", evidenceRefs: evidence,
    payload: { platform: "android", deviceSubjectId: "device-expired", outcome: "SUCCESS" } });

  assert.throws(() => journal.append({ tenantId, kind: "MEETING", occurredAt: "2026-09-11T08:59:00.000Z", classification: "INTERNAL", evidenceRefs: evidence,
    payload: { roles: ["only-one"] } }), /2-8/);
  assert.throws(() => journal.append({ tenantId, kind: "USAGE", occurredAt: "2026-09-11T08:59:00.000Z", classification: "TOP_SECRET", evidenceRefs: evidence,
    payload: { metric: "VIEW" } }), /TOP_SECRET/);

  const viewA = rebuildOperationsView(tenantId, journal.list(), receipts.list(), now);
  const viewB = rebuildOperationsView(tenantId, journal.list(), receipts.list(), now);
  assert.deepEqual(viewA, viewB, "rebuild must be deterministic for the same journal, receipts, and as-of time");
  assert.equal(viewA.usage.views, 3);
  assert.equal(viewA.usage.uniqueUsers, 2);
  assert.equal(viewA.usage.sessions, 2);
  assert.equal(viewA.usage.featureUsage["control-room"], 3);
  assert.equal(viewA.bookkeeping.approvedCount, 1);
  assert.equal(viewA.bookkeeping.pendingCount, 1);
  assert.equal(viewA.bookkeeping.approvedAmount, 125.50);
  assert.equal(viewA.bookkeeping.canMoveMoney, false);
  assert.equal(viewA.tasks.blocked, 1);
  assert.equal(viewA.meetings.unresolvedDissent, 1);
  assert.equal(viewA.meetings.approvedProductionDecisions, 1);
  assert.equal(viewA.runtime.status, "HEALTHY");
  assert.deepEqual(viewA.syncByPlatform.windows, { success: 1, error: 0, verifiedDeviceReceipts: 1 });
  assert.equal(viewA.syncByPlatform.android, undefined, "expired device receipts must not count as verified sync coverage");
  assert.equal(viewA.verification.universalDeviceSupportClaim, false);
  assert.equal(viewA.verification.currentVerifiedPartners, 1);
  assert.equal(viewA.verification.currentVerifiedDevices, 1);

  const snapshot = buildReadOnlyExecutiveControlSnapshot(viewA);
  assert.equal(snapshot.authority.readOnly, true);
  assert.equal(snapshot.authority.canWrite, false);
  assert.equal(snapshot.authority.canDeploy, false);
  assert.equal(snapshot.authority.canMoveMoney, false);
  assert.equal(snapshot.freshness.integrityVerified, true);

  const root = await mkdtemp(path.join(os.tmpdir(), "xiv-12d68-"));
  try {
    const eventDisk = new JsonlHashChainStore<OperationsEvent>(root, tenantId, "operations-events.jsonl");
    for (const event of journal.list()) await eventDisk.append(event);
    const restoredEvents = await eventDisk.readAll();
    assert.deepEqual(restoredEvents, journal.list());

    const receiptDisk = new JsonlHashChainStore<VerificationReceipt>(root, tenantId, "verification-receipts.jsonl");
    for (const receipt of receipts.list()) await receiptDisk.append(receipt);
    const restoredReceipts = await receiptDisk.readAll();
    assert.deepEqual(restoredReceipts, receipts.list());

    const persistedView = rebuildOperationsView(tenantId, restoredEvents, restoredReceipts, now);
    assert.deepEqual(persistedView, viewA, "restart rebuild must match the in-memory view");

    const eventPath = path.join(root, tenantId, "operations-events.jsonl");
    const original = await readFile(eventPath, "utf8");
    await writeFile(eventPath, original.replace('"metric":"VIEW"', '"metric":"TAMPERED"'), "utf8");
    await assert.rejects(() => eventDisk.readAll(), /hash mismatch/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }

  assert.throws(() => new JsonlHashChainStore<OperationsEvent>(".", tenantId, "../escape.jsonl"), /invalid journal filename/);
  assert.throws(() => rebuildOperationsView("tenant-beta", journal.list(), receipts.list(), now), /tenant isolation/);

  console.log("12D-68 operations event journal/view rebuilder/verification receipt contracts: OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
