import {
  createHash,
  randomUUID,
} from "node:crypto";

import {
  closeSync,
  lstatSync,
  openSync,
  realpathSync,
} from "node:fs";

import {
  DatabaseSync,
} from "node:sqlite";

export type XviDurableAdoptionState =
  | "RESERVED"
  | "COMMITTED"
  | "ABORTED";

export interface XviDurableAdoptionReservation {
  readonly replayKey: string;
  readonly reservationId: string;
  readonly state: "RESERVED";
  readonly reservedAtMs: number;
  readonly executesNothing: true;
  readonly productionAuthority: false;
}

export interface XviDurableAdoptionCommit {
  readonly replayKey: string;
  readonly reservationId: string;
  readonly state: "COMMITTED";
  readonly adoptionRecordDigest: string;
  readonly committedAtMs: number;
  readonly executesNothing: true;
  readonly productionAuthority: false;
}

export interface XviDurableAdoptionRecoveryAssessment {
  readonly replayKey: string;
  readonly state:
    | XviDurableAdoptionState
    | "AVAILABLE";
  readonly recoveryRequired: boolean;
  readonly automaticRetryAllowed: false;
  readonly executesNothing: true;
  readonly productionAuthority: false;
}

export interface XviDurableAdoptionRecoveryDescriptor {
  readonly replayKey: string;
  readonly state:
    | XviDurableAdoptionState
    | "AVAILABLE";
  readonly reservationId: string | null;
  readonly reservedAtMs: number | null;
  readonly committedAtMs: number | null;
  readonly abortedAtMs: number | null;
  readonly adoptionRecordDigest: string | null;
  readonly recoveryRequired: boolean;
  readonly automaticRetryAllowed: false;
  readonly executesNothing: true;
  readonly productionAuthority: false;
}

export const XVI_DURABLE_ADOPTION_COORDINATOR_POLICY =
  Object.freeze({
    schemaVersion: 1,
    maxPathChars: 4096,
    maxIdChars: 128,
    busyTimeoutMs: 1000,
  });

export const XVI_DURABLE_ADOPTION_COORDINATOR_GUARDRAILS =
  Object.freeze({
    durableAcrossRestart: true,
    atomicReservation: true,
    automaticRetryAllowed: false,
    reservedAfterRestartRequiresRecovery: true,
    executesNothing: true,
    productionAuthority: false,
    networkCalls: 0,
    remoteCalls: 0,
  });

type CoordinatorRow = {
  replay_key: string;
  reservation_id: string;
  state: XviDurableAdoptionState;
  reserved_at_ms: number;
  committed_at_ms: number | null;
  aborted_at_ms: number | null;
  adoption_record_digest: string | null;
};

const hex64 = (
  value: unknown,
): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{64}$/.test(value);

const boundedId = (
  value: unknown,
): value is string =>
  typeof value === "string" &&
  value.length >= 1 &&
  value.length <=
    XVI_DURABLE_ADOPTION_COORDINATOR_POLICY.maxIdChars &&
  /^[A-Za-z0-9_.:@-]+$/.test(value);

const safePositiveInt = (
  value: unknown,
): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value > 0;

function refuse(
  reason: string,
): never {
  throw new Error(
    `XVI_DURABLE_ADOPTION_COORDINATOR_REFUSED: ${reason}`,
  );
}

function validatePath(
  path: string,
): void {
  if (
    typeof path !== "string" ||
    !path.trim() ||
    path.length >
      XVI_DURABLE_ADOPTION_COORDINATOR_POLICY.maxPathChars
  ) {
    refuse("local coordinator database path required");
  }
}

function sha256(
  value: string,
): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

export class XviDurableAdoptionCoordinator {
  readonly #db: DatabaseSync;

  constructor(
    path: string,
  ) {
    validatePath(path);

    const stat =
      lstatSync(path);

    if (
      !stat.isFile() ||
      stat.isSymbolicLink()
    ) {
      refuse(
        "regular existing coordinator ledger required",
      );
    }

    this.#db =
      new DatabaseSync(
        realpathSync(path),
        {
          allowExtension: false,
        },
      );

    try {
      this.#db.exec(
        `PRAGMA trusted_schema=OFF;
         PRAGMA busy_timeout=${XVI_DURABLE_ADOPTION_COORDINATOR_POLICY.busyTimeoutMs};
         PRAGMA synchronous=FULL;`,
      );

      this.#transaction(() => {
        this.#assertSchema();
      });
    } catch (error) {
      this.#db.close();
      throw error;
    }
  }

  static initialize(
    path: string,
  ): void {
    validatePath(path);

    closeSync(
      openSync(
        path,
        "wx",
        0o600,
      ),
    );

    const db =
      new DatabaseSync(
        path,
        {
          allowExtension: false,
        },
      );

    try {
      db.exec(
        `PRAGMA trusted_schema=OFF;
         PRAGMA journal_mode=WAL;
         PRAGMA synchronous=FULL;
         PRAGMA busy_timeout=${XVI_DURABLE_ADOPTION_COORDINATOR_POLICY.busyTimeoutMs};

         CREATE TABLE xvi_adoption_coordinator_meta(
           singleton INTEGER PRIMARY KEY
             CHECK(singleton=1),
           schema_version INTEGER NOT NULL
             CHECK(schema_version=1)
         ) STRICT;

         INSERT INTO xvi_adoption_coordinator_meta(
           singleton,
           schema_version
         ) VALUES(
           1,
           ${XVI_DURABLE_ADOPTION_COORDINATOR_POLICY.schemaVersion}
         );

         CREATE TABLE xvi_adoption_coordinator(
           replay_key TEXT PRIMARY KEY
             CHECK(length(replay_key)=64),

           reservation_id TEXT NOT NULL UNIQUE,

           state TEXT NOT NULL
             CHECK(state IN ('RESERVED','COMMITTED','ABORTED')),

           reserved_at_ms INTEGER NOT NULL
             CHECK(reserved_at_ms>0),

           committed_at_ms INTEGER,
           aborted_at_ms INTEGER,

           adoption_record_digest TEXT,

           CHECK(
             (state='RESERVED'
               AND committed_at_ms IS NULL
               AND aborted_at_ms IS NULL
               AND adoption_record_digest IS NULL)
             OR
             (state='COMMITTED'
               AND committed_at_ms IS NOT NULL
               AND aborted_at_ms IS NULL
               AND adoption_record_digest IS NOT NULL
               AND length(adoption_record_digest)=64)
             OR
             (state='ABORTED'
               AND committed_at_ms IS NULL
               AND aborted_at_ms IS NOT NULL
               AND adoption_record_digest IS NULL)
           )
         ) STRICT;`,
      );
    } finally {
      db.close();
    }
  }

  close(): void {
    this.#db.close();
  }

  #transaction<T>(
    fn: () => T,
  ): T {
    this.#db.exec(
      "BEGIN IMMEDIATE",
    );

    try {
      const result =
        fn();

      this.#db.exec(
        "COMMIT",
      );

      return result;
    } catch (error) {
      try {
        this.#db.exec(
          "ROLLBACK",
        );
      } catch {
        // Preserve the original blocker.
      }

      throw error;
    }
  }

  #assertSchema(): void {
    const row =
      this.#db
        .prepare(
          `SELECT schema_version
           FROM xvi_adoption_coordinator_meta
           WHERE singleton=1`,
        )
        .get() as
        | {
            schema_version: number;
          }
        | undefined;

    if (
      !row ||
      row.schema_version !==
        XVI_DURABLE_ADOPTION_COORDINATOR_POLICY.schemaVersion
    ) {
      refuse(
        "coordinator schema mismatch",
      );
    }
  }

  #read(
    replayKey: string,
  ): CoordinatorRow | undefined {
    return this.#db
      .prepare(
        `SELECT
           replay_key,
           reservation_id,
           state,
           reserved_at_ms,
           committed_at_ms,
           aborted_at_ms,
           adoption_record_digest
         FROM xvi_adoption_coordinator
         WHERE replay_key=?`,
      )
      .get(
        replayKey,
      ) as
      | CoordinatorRow
      | undefined;
  }

  reserve(
    replayKey: string,
    nowMs: number,
  ): Readonly<XviDurableAdoptionReservation> {
    if (!hex64(replayKey)) {
      refuse(
        "replay key invalid",
      );
    }

    if (!safePositiveInt(nowMs)) {
      refuse(
        "reservation timestamp invalid",
      );
    }

    return this.#transaction(() => {
      const prior =
        this.#read(
          replayKey,
        );

      if (prior) {
        if (
          prior.state === "RESERVED"
        ) {
          refuse(
            "lineage already reserved; recovery required",
          );
        }

        if (
          prior.state === "COMMITTED"
        ) {
          refuse(
            "lineage already committed; replay refused",
          );
        }

        refuse(
          "lineage previously aborted; explicit reviewed recovery required",
        );
      }

      const reservationId =
        randomUUID();

      try {
        this.#db
          .prepare(
            `INSERT INTO xvi_adoption_coordinator(
               replay_key,
               reservation_id,
               state,
               reserved_at_ms,
               committed_at_ms,
               aborted_at_ms,
               adoption_record_digest
             ) VALUES(
               ?,?,
               'RESERVED',
               ?,
               NULL,
               NULL,
               NULL
             )`,
          )
          .run(
            replayKey,
            reservationId,
            nowMs,
          );
      } catch {
        refuse(
          "lineage reservation conflict; fail closed",
        );
      }

      return Object.freeze({
        replayKey,
        reservationId,
        state:
          "RESERVED" as const,
        reservedAtMs:
          nowMs,
        executesNothing:
          true as const,
        productionAuthority:
          false as const,
      });
    });
  }

  commit(input: {
    replayKey: string;
    reservationId: string;
    adoptionRecordCanonicalJson: string;
    nowMs: number;
  }): Readonly<XviDurableAdoptionCommit> {
    if (!hex64(input.replayKey)) {
      refuse(
        "replay key invalid",
      );
    }

    if (!boundedId(input.reservationId)) {
      refuse(
        "reservation id invalid",
      );
    }

    if (
      typeof input.adoptionRecordCanonicalJson !==
        "string" ||
      !input.adoptionRecordCanonicalJson
        .trim() ||
      input.adoptionRecordCanonicalJson.length >
        65536
    ) {
      refuse(
        "canonical adoption record required",
      );
    }

    if (!safePositiveInt(input.nowMs)) {
      refuse(
        "commit timestamp invalid",
      );
    }

    return this.#transaction(() => {
      const row =
        this.#read(
          input.replayKey,
        );

      if (!row) {
        refuse(
          "no reservation exists for lineage",
        );
      }

      if (
        row.reservation_id !==
          input.reservationId
      ) {
        refuse(
          "reservation identity mismatch",
        );
      }

      if (
        row.state !== "RESERVED"
      ) {
        refuse(
          "only a reserved lineage may commit",
        );
      }

      if (
        input.nowMs <
          row.reserved_at_ms
      ) {
        refuse(
          "commit predates reservation",
        );
      }

      const adoptionRecordDigest =
        sha256(
          input.adoptionRecordCanonicalJson,
        );

      const result =
        this.#db
          .prepare(
            `UPDATE xvi_adoption_coordinator
             SET
               state='COMMITTED',
               committed_at_ms=?,
               adoption_record_digest=?
             WHERE
               replay_key=?
               AND reservation_id=?
               AND state='RESERVED'`,
          )
          .run(
            input.nowMs,
            adoptionRecordDigest,
            input.replayKey,
            input.reservationId,
          );

      if (
        Number(result.changes) !== 1
      ) {
        refuse(
          "atomic commit failed",
        );
      }

      return Object.freeze({
        replayKey:
          input.replayKey,
        reservationId:
          input.reservationId,
        state:
          "COMMITTED" as const,
        adoptionRecordDigest,
        committedAtMs:
          input.nowMs,
        executesNothing:
          true as const,
        productionAuthority:
          false as const,
      });
    });
  }

  abort(input: {
    replayKey: string;
    reservationId: string;
    nowMs: number;
  }): void {
    if (!hex64(input.replayKey)) {
      refuse(
        "replay key invalid",
      );
    }

    if (!boundedId(input.reservationId)) {
      refuse(
        "reservation id invalid",
      );
    }

    if (!safePositiveInt(input.nowMs)) {
      refuse(
        "abort timestamp invalid",
      );
    }

    this.#transaction(() => {
      const row =
        this.#read(
          input.replayKey,
        );

      if (!row) {
        refuse(
          "no reservation exists for lineage",
        );
      }

      if (
        row.reservation_id !==
          input.reservationId
      ) {
        refuse(
          "reservation identity mismatch",
        );
      }

      if (
        row.state !== "RESERVED"
      ) {
        refuse(
          "only a reserved lineage may abort",
        );
      }

      if (
        input.nowMs <
          row.reserved_at_ms
      ) {
        refuse(
          "abort predates reservation",
        );
      }

      const result =
        this.#db
          .prepare(
            `UPDATE xvi_adoption_coordinator
             SET
               state='ABORTED',
               aborted_at_ms=?
             WHERE
               replay_key=?
               AND reservation_id=?
               AND state='RESERVED'`,
          )
          .run(
            input.nowMs,
            input.replayKey,
            input.reservationId,
          );

      if (
        Number(result.changes) !== 1
      ) {
        refuse(
          "atomic abort failed",
        );
      }
    });
  }

  assess(
    replayKey: string,
  ): Readonly<XviDurableAdoptionRecoveryAssessment> {
    if (!hex64(replayKey)) {
      refuse(
        "replay key invalid",
      );
    }

    const row =
      this.#read(
        replayKey,
      );

    if (!row) {
      return Object.freeze({
        replayKey,
        state:
          "AVAILABLE" as const,
        recoveryRequired:
          false,
        automaticRetryAllowed:
          false as const,
        executesNothing:
          true as const,
        productionAuthority:
          false as const,
      });
    }

    return Object.freeze({
      replayKey,
      state:
        row.state,
      recoveryRequired:
        row.state === "RESERVED" ||
        row.state === "ABORTED",
      automaticRetryAllowed:
        false as const,
      executesNothing:
        true as const,
      productionAuthority:
        false as const,
    });
  }

  recoveryDescriptor(
    replayKey: string,
  ): Readonly<XviDurableAdoptionRecoveryDescriptor> {
    if (!hex64(replayKey)) {
      refuse(
        "replay key invalid",
      );
    }

    const row =
      this.#read(
        replayKey,
      );

    if (!row) {
      return Object.freeze({
        replayKey,
        state:
          "AVAILABLE" as const,
        reservationId:
          null,
        reservedAtMs:
          null,
        committedAtMs:
          null,
        abortedAtMs:
          null,
        adoptionRecordDigest:
          null,
        recoveryRequired:
          false,
        automaticRetryAllowed:
          false as const,
        executesNothing:
          true as const,
        productionAuthority:
          false as const,
      });
    }

    return Object.freeze({
      replayKey,
      state:
        row.state,
      reservationId:
        row.reservation_id,
      reservedAtMs:
        row.reserved_at_ms,
      committedAtMs:
        row.committed_at_ms,
      abortedAtMs:
        row.aborted_at_ms,
      adoptionRecordDigest:
        row.adoption_record_digest,
      recoveryRequired:
        row.state === "RESERVED" ||
        row.state === "ABORTED",
      automaticRetryAllowed:
        false as const,
      executesNothing:
        true as const,
      productionAuthority:
        false as const,
    });
  }

}
