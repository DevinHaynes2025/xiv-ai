import { closeSync, lstatSync, openSync, realpathSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { XviRecoveryEvidenceReceipt } from "./xvi-recovery-evidence-integrity";

export type XviRecoveryReceiptJournalState = "PENDING_REVIEW" | "RESOLVED";
export type XviRecoveryReceiptResolution = "COMMITTED" | "ABORTED" | "REMAIN_RESERVED";

export interface XviDurableRecoveryReceiptRecord {
  readonly receiptDigest: string;
  readonly replayKey: string;
  readonly reservationId: string;
  readonly conclusion: XviRecoveryEvidenceReceipt["conclusion"];
  readonly adoptionRecordDigest: string | null;
  readonly evidenceAtMs: number;
  readonly storedAtMs: number;
  readonly state: XviRecoveryReceiptJournalState;
  readonly resolvedAtMs: number | null;
  readonly resolution: XviRecoveryReceiptResolution | null;
  readonly automaticRetryAllowed: false;
  readonly executesNothing: true;
  readonly productionAuthority: false;
}

export const XVI_DURABLE_RECOVERY_RECEIPT_JOURNAL_POLICY = Object.freeze({
  schemaVersion: 1,
  maxPathChars: 4096,
  maxIdChars: 128,
  busyTimeoutMs: 1000,
});

const hex64 = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
const boundedId = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= 128 &&
  /^[A-Za-z0-9_.:@-]+$/.test(v);
const safePositiveInt = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const refuse = (reason: string): never => {
  throw new Error(`XVI_DURABLE_RECOVERY_RECEIPT_JOURNAL_REFUSED: ${reason}`);
};

function requireRow(
  value: Row | undefined,
  reason: string,
): asserts value is Row {
  if (value === undefined) {
    refuse(reason);
  }
}
const validatePath = (path: string): void => {
  if (!path?.trim() || path.length > 4096) refuse("local journal path required");
};

type Row = {
  receipt_digest: string;
  replay_key: string;
  reservation_id: string;
  conclusion: XviRecoveryEvidenceReceipt["conclusion"];
  adoption_record_digest: string | null;
  evidence_at_ms: number;
  stored_at_ms: number;
  state: XviRecoveryReceiptJournalState;
  resolved_at_ms: number | null;
  resolution: XviRecoveryReceiptResolution | null;
};

const toRecord = (r: Row): Readonly<XviDurableRecoveryReceiptRecord> =>
  Object.freeze({
    receiptDigest: r.receipt_digest,
    replayKey: r.replay_key,
    reservationId: r.reservation_id,
    conclusion: r.conclusion,
    adoptionRecordDigest: r.adoption_record_digest,
    evidenceAtMs: r.evidence_at_ms,
    storedAtMs: r.stored_at_ms,
    state: r.state,
    resolvedAtMs: r.resolved_at_ms,
    resolution: r.resolution,
    automaticRetryAllowed: false,
    executesNothing: true,
    productionAuthority: false,
  });

export class XviDurableRecoveryReceiptJournal {
  readonly #db: DatabaseSync;

  constructor(path: string) {
    validatePath(path);
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) refuse("regular existing journal required");
    this.#db = new DatabaseSync(realpathSync(path), { allowExtension: false });
    try {
      this.#db.exec(`PRAGMA trusted_schema=OFF;
        PRAGMA busy_timeout=${XVI_DURABLE_RECOVERY_RECEIPT_JOURNAL_POLICY.busyTimeoutMs};
        PRAGMA synchronous=FULL;`);
      this.#tx(() => this.#assertSchema());
    } catch (error) {
      this.#db.close();
      throw error;
    }
  }

  static initialize(path: string): void {
    validatePath(path);
    closeSync(openSync(path, "wx", 0o600));
    const db = new DatabaseSync(path, { allowExtension: false });
    try {
      db.exec(`PRAGMA trusted_schema=OFF;
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=FULL;
        PRAGMA busy_timeout=${XVI_DURABLE_RECOVERY_RECEIPT_JOURNAL_POLICY.busyTimeoutMs};

        CREATE TABLE xvi_recovery_receipt_meta(
          singleton INTEGER PRIMARY KEY CHECK(singleton=1),
          schema_version INTEGER NOT NULL CHECK(schema_version=1)
        ) STRICT;
        INSERT INTO xvi_recovery_receipt_meta(singleton,schema_version)
        VALUES(1,${XVI_DURABLE_RECOVERY_RECEIPT_JOURNAL_POLICY.schemaVersion});

        CREATE TABLE xvi_recovery_receipts(
          receipt_digest TEXT PRIMARY KEY CHECK(length(receipt_digest)=64),
          replay_key TEXT NOT NULL CHECK(length(replay_key)=64),
          reservation_id TEXT NOT NULL UNIQUE,
          conclusion TEXT NOT NULL CHECK(conclusion IN (
            'ADOPTION_COMPLETED','ADOPTION_NOT_COMPLETED','AMBIGUOUS'
          )),
          adoption_record_digest TEXT,
          evidence_at_ms INTEGER NOT NULL CHECK(evidence_at_ms>0),
          stored_at_ms INTEGER NOT NULL CHECK(stored_at_ms>0),
          state TEXT NOT NULL CHECK(state IN ('PENDING_REVIEW','RESOLVED')),
          resolved_at_ms INTEGER,
          resolution TEXT CHECK(resolution IS NULL OR resolution IN (
            'COMMITTED','ABORTED','REMAIN_RESERVED'
          )),
          CHECK(
            (conclusion='ADOPTION_COMPLETED' AND adoption_record_digest IS NOT NULL
              AND length(adoption_record_digest)=64)
            OR
            (conclusion!='ADOPTION_COMPLETED' AND adoption_record_digest IS NULL)
          ),
          CHECK(
            (state='PENDING_REVIEW' AND resolved_at_ms IS NULL AND resolution IS NULL)
            OR
            (state='RESOLVED' AND resolved_at_ms IS NOT NULL AND resolution IS NOT NULL)
          )
        ) STRICT;
        CREATE INDEX xvi_recovery_receipt_replay_idx
          ON xvi_recovery_receipts(replay_key);`);
    } finally {
      db.close();
    }
  }

  close(): void { this.#db.close(); }

  #tx<T>(fn: () => T): T {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const value = fn();
      this.#db.exec("COMMIT");
      return value;
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch {}
      throw error;
    }
  }

  #assertSchema(): void {
    const row = this.#db.prepare(
      "SELECT schema_version FROM xvi_recovery_receipt_meta WHERE singleton=1"
    ).get() as { schema_version: number } | undefined;
    if (!row || row.schema_version !== 1) refuse("journal schema mismatch");
  }

  #read(digest: string): Row | undefined {
    return this.#db.prepare(`SELECT receipt_digest,replay_key,reservation_id,
      conclusion,adoption_record_digest,evidence_at_ms,stored_at_ms,state,
      resolved_at_ms,resolution FROM xvi_recovery_receipts
      WHERE receipt_digest=?`).get(digest) as Row | undefined;
  }

  store(receipt: Readonly<XviRecoveryEvidenceReceipt>, storedAtMs: number):
    Readonly<XviDurableRecoveryReceiptRecord> {
    if (receipt.kind !== "XVI_RECOVERY_EVIDENCE_RECEIPT" ||
        !hex64(receipt.receiptDigest) || !hex64(receipt.replayKey) ||
        !boundedId(receipt.reservationId) || !safePositiveInt(receipt.evidenceAtMs) ||
        !safePositiveInt(storedAtMs) || storedAtMs < receipt.evidenceAtMs ||
        receipt.humanDecision !== "REQUIRED" ||
        receipt.automaticRetryAllowed !== false ||
        receipt.executesNothing !== true || receipt.productionAuthority !== false) {
      refuse("receipt contract invalid");
    }
    if (receipt.conclusion === "ADOPTION_COMPLETED") {
      if (!hex64(receipt.adoptionRecordDigest)) refuse("completed receipt digest missing");
    } else if (receipt.adoptionRecordDigest !== null) {
      refuse("non-completed receipt carries adoption digest");
    }

    return this.#tx(() => {
      try {
        this.#db.prepare(`INSERT INTO xvi_recovery_receipts(
          receipt_digest,replay_key,reservation_id,conclusion,adoption_record_digest,
          evidence_at_ms,stored_at_ms,state,resolved_at_ms,resolution
        ) VALUES(?,?,?,?,?,?,?,'PENDING_REVIEW',NULL,NULL)`).run(
          receipt.receiptDigest, receipt.replayKey, receipt.reservationId,
          receipt.conclusion, receipt.adoptionRecordDigest, receipt.evidenceAtMs,
          storedAtMs
        );
      } catch {
        refuse("duplicate or conflicting recovery receipt refused");
      }
      const row =
        this.#read(
          receipt.receiptDigest,
        );

      requireRow(
        row,
        "stored receipt disappeared",
      );

      return toRecord(
        row,
      );
    });
  }

  read(receiptDigest: string): Readonly<XviDurableRecoveryReceiptRecord> | null {
    if (!hex64(receiptDigest)) refuse("receipt digest invalid");
    const row = this.#read(receiptDigest);
    return row ? toRecord(row) : null;
  }

  resolve(input: {
    receiptDigest: string;
    resolution: XviRecoveryReceiptResolution;
    resolvedAtMs: number;
  }): Readonly<XviDurableRecoveryReceiptRecord> {
    if (!hex64(input.receiptDigest) || !safePositiveInt(input.resolvedAtMs))
      refuse("resolution identity or timestamp invalid");
    if (!["COMMITTED","ABORTED","REMAIN_RESERVED"].includes(input.resolution))
      refuse("resolution invalid");

    return this.#tx(() => {
      const row =
        this.#read(
          input.receiptDigest,
        );

      requireRow(
        row,
        "receipt not found",
      );

      if (
        row.state !==
          "PENDING_REVIEW"
      ) {
        refuse(
          "resolved receipt is final",
        );
      }

      if (
        input.resolvedAtMs <
          row.stored_at_ms
      ) {
        refuse(
          "resolution predates storage",
        );
      }
      const result = this.#db.prepare(`UPDATE xvi_recovery_receipts
        SET state='RESOLVED',resolved_at_ms=?,resolution=?
        WHERE receipt_digest=? AND state='PENDING_REVIEW'`).run(
          input.resolvedAtMs, input.resolution, input.receiptDigest
        );
      if (Number(result.changes) !== 1) refuse("atomic resolution failed");
      const updated =
        this.#read(
          input.receiptDigest,
        );

      requireRow(
        updated,
        "resolved receipt disappeared",
      );

      return toRecord(
        updated,
      );
    });
  }
}
