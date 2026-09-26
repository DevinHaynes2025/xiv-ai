import { createHash } from "node:crypto";
import {
  closeSync,
  lstatSync,
  openSync,
  realpathSync,
} from "node:fs";
import { DatabaseSync } from "node:sqlite";

export const XVI_DURABLE_ADOPTION_REPLAY_POLICY =
  Object.freeze({
    schemaVersion: 1,
    maxPathChars: 4096,
    maxScopeChars: 16,
    maxIdChars: 128,
    busyTimeoutMs: 1000,
  });

export const XVI_DURABLE_ADOPTION_REPLAY_GUARDRAILS =
  Object.freeze({
    durableAcrossRestart: true,
    atomicClaim: true,
    networkCallPerformed: false,
    productionAuthority: false,
    executesNothing: true,
    remoteCalls: 0,
    automaticRecovery: false,
  });

export type XviDurableAdoptionScope =
  | "SCALING"
  | "FAILOVER";

export interface XviDurableAdoptionReplayClaim {
  readonly scope: XviDurableAdoptionScope;
  readonly tenantId: string;
  readonly universeId: string;

  readonly instructionDigest: string;
  readonly cellAdoptionDigest: string;
  readonly bindingDigest: string;

  readonly workflowId: string;
  readonly actionId: string;
  readonly sourceRevision: string;

  readonly adoptedAtMs: number;
}

export interface XviDurableAdoptionReplayReceipt {
  readonly version:
    "xvi-durable-adoption-replay-v1";

  readonly replayKey: string;

  readonly scope:
    XviDurableAdoptionScope;

  readonly tenantId: string;
  readonly universeId: string;

  readonly instructionDigest: string;
  readonly cellAdoptionDigest: string;
  readonly bindingDigest: string;

  readonly workflowId: string;
  readonly actionId: string;
  readonly sourceRevision: string;

  readonly adoptedAtMs: number;

  readonly replayRejected: false;

  readonly networkCallPerformed: false;
  readonly productionAuthority: false;
  readonly executesNothing: true;
  readonly remoteCalls: 0;
}

type ReplayRow = {
  replay_key: string;
  scope: string;
  tenant_id: string;
  universe_id: string;
  instruction_digest: string;
  cell_adoption_digest: string;
  binding_digest: string;
  workflow_id: string;
  action_id: string;
  source_revision: string;
  adopted_at_ms: number;
};

const hex64 = (
  value: unknown,
): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{64}$/.test(value);

const hex40 = (
  value: unknown,
): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{40}$/.test(value);

const boundedId = (
  value: unknown,
): value is string =>
  typeof value === "string" &&
  value.length >= 1 &&
  value.length <=
    XVI_DURABLE_ADOPTION_REPLAY_POLICY.maxIdChars &&
  /^[A-Za-z0-9_.:@-]+$/.test(value);

const safePositiveInt = (
  value: unknown,
): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value > 0;

function sha256(
  value: string,
): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function refuse(
  reason: string,
): never {
  throw new Error(
    `XVI_DURABLE_ADOPTION_REPLAY_REFUSED: ${reason}`,
  );
}

function validatePath(
  path: string,
): void {
  if (
    typeof path !== "string" ||
    !path.trim() ||
    path.length >
      XVI_DURABLE_ADOPTION_REPLAY_POLICY.maxPathChars
  ) {
    refuse("local database path required");
  }
}

function validateClaim(
  claim:
    Readonly<XviDurableAdoptionReplayClaim>,
): void {
  if (
    claim.scope !== "SCALING" &&
    claim.scope !== "FAILOVER"
  ) {
    refuse("unsupported lineage scope");
  }

  if (!boundedId(claim.tenantId)) {
    refuse("tenantId invalid");
  }

  if (!boundedId(claim.universeId)) {
    refuse("universeId invalid");
  }

  if (!hex64(claim.instructionDigest)) {
    refuse("instruction digest invalid");
  }

  if (!hex64(claim.cellAdoptionDigest)) {
    refuse("cell adoption digest invalid");
  }

  if (!hex64(claim.bindingDigest)) {
    refuse("binding digest invalid");
  }

  if (!boundedId(claim.workflowId)) {
    refuse("workflowId invalid");
  }

  if (!boundedId(claim.actionId)) {
    refuse("actionId invalid");
  }

  if (!hex40(claim.sourceRevision)) {
    refuse("source revision invalid");
  }

  if (!safePositiveInt(claim.adoptedAtMs)) {
    refuse("adoption timestamp invalid");
  }
}

export function deriveXviDurableAdoptionReplayKey(
  claim:
    Readonly<XviDurableAdoptionReplayClaim>,
): string {
  validateClaim(claim);

  /*
   * Preserve the identity dimensions already used by
   * InstructionAdoptionGate's process-local replay key,
   * but hash the canonical tuple before storage.
   */
  return sha256(
    [
      claim.scope,
      claim.tenantId,
      claim.universeId,
      claim.instructionDigest,
      claim.cellAdoptionDigest,
      claim.bindingDigest,
    ].join("|"),
  );
}

export class XviDurableAdoptionReplayLedger {
  readonly #db: DatabaseSync;

  constructor(
    path: string,
  ) {
    validatePath(path);

    const stat = lstatSync(path);

    if (
      !stat.isFile() ||
      stat.isSymbolicLink()
    ) {
      refuse(
        "regular existing replay ledger required",
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
         PRAGMA busy_timeout=${XVI_DURABLE_ADOPTION_REPLAY_POLICY.busyTimeoutMs};
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

    /*
     * Explicit provisioning only. "wx" refuses every
     * existing path rather than silently replacing a
     * prior replay ledger.
     */
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
         PRAGMA busy_timeout=${XVI_DURABLE_ADOPTION_REPLAY_POLICY.busyTimeoutMs};

         CREATE TABLE xvi_adoption_replay_meta(
           singleton INTEGER PRIMARY KEY
             CHECK(singleton=1),
           schema_version INTEGER NOT NULL
             CHECK(schema_version=1)
         ) STRICT;

         INSERT INTO xvi_adoption_replay_meta(
           singleton,
           schema_version
         ) VALUES(
           1,
           ${XVI_DURABLE_ADOPTION_REPLAY_POLICY.schemaVersion}
         );

         CREATE TABLE xvi_adoption_replay_claims(
           replay_key TEXT PRIMARY KEY
             CHECK(length(replay_key)=64),

           scope TEXT NOT NULL
             CHECK(scope IN ('SCALING','FAILOVER')),

           tenant_id TEXT NOT NULL,
           universe_id TEXT NOT NULL,

           instruction_digest TEXT NOT NULL
             CHECK(length(instruction_digest)=64),

           cell_adoption_digest TEXT NOT NULL
             CHECK(length(cell_adoption_digest)=64),

           binding_digest TEXT NOT NULL
             CHECK(length(binding_digest)=64),

           workflow_id TEXT NOT NULL,
           action_id TEXT NOT NULL,

           source_revision TEXT NOT NULL
             CHECK(length(source_revision)=40),

           adopted_at_ms INTEGER NOT NULL
             CHECK(adopted_at_ms>0),

           UNIQUE(
             scope,
             tenant_id,
             universe_id,
             instruction_digest,
             cell_adoption_digest,
             binding_digest
           )
         ) STRICT;

         CREATE INDEX
           xvi_adoption_replay_instruction_idx
         ON xvi_adoption_replay_claims(
           instruction_digest
         );`,
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
      const result = fn();

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
        /*
         * Preserve the original failure as the blocker.
         */
      }

      throw error;
    }
  }

  #assertSchema(): void {
    const row =
      this.#db
        .prepare(
          `SELECT schema_version
           FROM xvi_adoption_replay_meta
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
        XVI_DURABLE_ADOPTION_REPLAY_POLICY.schemaVersion
    ) {
      refuse(
        "replay ledger schema mismatch",
      );
    }
  }

  claim(
    claim:
      Readonly<XviDurableAdoptionReplayClaim>,
  ): Readonly<XviDurableAdoptionReplayReceipt> {
    validateClaim(claim);

    const replayKey =
      deriveXviDurableAdoptionReplayKey(
        claim,
      );

    return this.#transaction(() => {
      const prior =
        this.#db
          .prepare(
            `SELECT replay_key
             FROM xvi_adoption_replay_claims
             WHERE replay_key=?`,
          )
          .get(
            replayKey,
          );

      if (prior) {
        refuse(
          "instruction lineage already durably claimed",
        );
      }

      try {
        this.#db
          .prepare(
            `INSERT INTO xvi_adoption_replay_claims(
               replay_key,
               scope,
               tenant_id,
               universe_id,
               instruction_digest,
               cell_adoption_digest,
               binding_digest,
               workflow_id,
               action_id,
               source_revision,
               adopted_at_ms
             ) VALUES(
               ?,?,?,?,?,?,?,?,?,?,?
             )`,
          )
          .run(
            replayKey,
            claim.scope,
            claim.tenantId,
            claim.universeId,
            claim.instructionDigest,
            claim.cellAdoptionDigest,
            claim.bindingDigest,
            claim.workflowId,
            claim.actionId,
            claim.sourceRevision,
            claim.adoptedAtMs,
          );
      } catch {
        /*
         * A concurrent process may have won the UNIQUE
         * constraint after our read. Fail closed rather
         * than distinguishing internal SQLite errors.
         */
        refuse(
          "instruction lineage already durably claimed",
        );
      }

      const receipt:
        XviDurableAdoptionReplayReceipt =
        {
          version:
            "xvi-durable-adoption-replay-v1",

          replayKey,

          scope:
            claim.scope,

          tenantId:
            claim.tenantId,

          universeId:
            claim.universeId,

          instructionDigest:
            claim.instructionDigest,

          cellAdoptionDigest:
            claim.cellAdoptionDigest,

          bindingDigest:
            claim.bindingDigest,

          workflowId:
            claim.workflowId,

          actionId:
            claim.actionId,

          sourceRevision:
            claim.sourceRevision,

          adoptedAtMs:
            claim.adoptedAtMs,

          replayRejected:
            false,

          networkCallPerformed:
            false,

          productionAuthority:
            false,

          executesNothing:
            true,

          remoteCalls:
            0,
        };

      return Object.freeze(
        receipt,
      );
    });
  }

  hasReplayKey(
    replayKey: string,
  ): boolean {
    if (!hex64(replayKey)) {
      refuse(
        "replay key invalid",
      );
    }

    return Boolean(
      this.#db
        .prepare(
          `SELECT 1
           FROM xvi_adoption_replay_claims
           WHERE replay_key=?`,
        )
        .get(
          replayKey,
        ),
    );
  }

  get size(): number {
    const row =
      this.#db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM xvi_adoption_replay_claims`,
        )
        .get() as {
          count: number;
        };

    return Number(
      row.count,
    );
  }
}
