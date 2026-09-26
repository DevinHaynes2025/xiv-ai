import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { XviDurableAdoptionCoordinator } from "./xvi-durable-adoption-coordinator";
import { createXviRecoveryEvidenceReceipt } from "./xvi-recovery-evidence-integrity";
import { XviDurableRecoveryReceiptJournal } from "./xvi-durable-recovery-receipt-journal";

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "xvi-gate28-"));
  const cp = join(dir, "coordinator.sqlite");
  const jp = join(dir, "journal.sqlite");
  XviDurableAdoptionCoordinator.initialize(cp);
  XviDurableRecoveryReceiptJournal.initialize(jp);
  const coordinator = new XviDurableAdoptionCoordinator(cp);
  const journal = new XviDurableRecoveryReceiptJournal(jp);
  const replayKey = "6".repeat(64);
  coordinator.reserve(replayKey, 1000);
  const receipt = createXviRecoveryEvidenceReceipt({
    coordinator, replayKey,
    evidence: { conclusion: "ADOPTION_COMPLETED",
      adoptionRecordCanonicalJson: "canonical-gate28-record" },
    evidenceAtMs: 1500,
  });
  return { dir, cp, jp, coordinator, journal, replayKey, receipt };
}

test("receipt survives journal restart as pending review", () => {
  const x = setup();
  try {
    x.journal.store(x.receipt, 1600);
    x.journal.close();
    const reopened = new XviDurableRecoveryReceiptJournal(x.jp);
    try {
      const row = reopened.read(x.receipt.receiptDigest);
      assert.equal(row?.state, "PENDING_REVIEW");
      assert.equal(row?.reservationId, x.receipt.reservationId);
      assert.equal(row?.automaticRetryAllowed, false);
    } finally { reopened.close(); }
  } finally {
    x.coordinator.close();
    rmSync(x.dir, { recursive: true, force: true });
  }
});

test("duplicate receipt is refused", () => {
  const x = setup();
  try {
    x.journal.store(x.receipt, 1600);
    assert.throws(() => x.journal.store(x.receipt, 1700), /duplicate or conflicting/);
  } finally {
    x.coordinator.close(); x.journal.close();
    rmSync(x.dir, { recursive: true, force: true });
  }
});

test("one reservation cannot receive two durable receipts", () => {
  const x = setup();
  try {
    x.journal.store(x.receipt, 1600);
    const second = { ...x.receipt, receiptDigest: "5".repeat(64) };
    assert.throws(() => x.journal.store(second, 1700), /duplicate or conflicting/);
  } finally {
    x.coordinator.close(); x.journal.close();
    rmSync(x.dir, { recursive: true, force: true });
  }
});

test("receipt resolves exactly once", () => {
  const x = setup();
  try {
    x.journal.store(x.receipt, 1600);
    const row = x.journal.resolve({
      receiptDigest: x.receipt.receiptDigest,
      resolution: "COMMITTED",
      resolvedAtMs: 2000,
    });
    assert.equal(row.state, "RESOLVED");
    assert.equal(row.resolution, "COMMITTED");
    assert.throws(() => x.journal.resolve({
      receiptDigest: x.receipt.receiptDigest,
      resolution: "COMMITTED",
      resolvedAtMs: 2100,
    }), /final/);
  } finally {
    x.coordinator.close(); x.journal.close();
    rmSync(x.dir, { recursive: true, force: true });
  }
});

test("resolution timestamp cannot predate durable storage", () => {
  const x = setup();
  try {
    x.journal.store(x.receipt, 1600);
    assert.throws(() => x.journal.resolve({
      receiptDigest: x.receipt.receiptDigest,
      resolution: "COMMITTED",
      resolvedAtMs: 1599,
    }), /predates storage/);
  } finally {
    x.coordinator.close(); x.journal.close();
    rmSync(x.dir, { recursive: true, force: true });
  }
});

test("journal initialization refuses overwrite", () => {
  const x = setup();
  try {
    assert.throws(() => XviDurableRecoveryReceiptJournal.initialize(x.jp));
  } finally {
    x.coordinator.close(); x.journal.close();
    rmSync(x.dir, { recursive: true, force: true });
  }
});
