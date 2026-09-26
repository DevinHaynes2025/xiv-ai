import {
  createHash,
} from "node:crypto";

import {
  DatabaseSync,
} from "node:sqlite";

import type {
  XviCodingResumeIntegrityReceipt,
} from "./xvi-coding-resume-integrity";

export interface XviCodingDurableReplayReceipt {
  readonly version:
    "xvi-coding-durable-replay-v1";

  readonly missionId: string;
  readonly integrityDigest: string;
  readonly replayNonce: string;

  readonly consumedAtMs: number;

  readonly consumptionDigest: string;

  readonly durable: true;
  readonly consumedExactlyOnce: true;

  readonly remoteWriteAuthority: false;
  readonly deploymentAuthority: false;
  readonly credentialAuthority: false;
  readonly productionAuthority: false;
}

export const XVI_CODING_DURABLE_REPLAY_POLICY =
  Object.freeze({
    localPersistenceOnly: true,
    consumeExactlyOnce: true,

    remoteWriteAuthority: false,
    deploymentAuthority: false,
    credentialAuthority: false,
    productionAuthority: false,
  });

const SHA256 =
  /^[a-f0-9]{64}$/;

const NONCE =
  /^[A-Za-z0-9][A-Za-z0-9_.:@/-]{15,127}$/;

const ID =
  /^[A-Za-z0-9][A-Za-z0-9_.:@/-]{0,127}$/;

const refuse = (): never => {
  throw new Error(
    "XVI_CODING_DURABLE_REPLAY_REFUSED",
  );
};

function verifyIntegrity(
  receipt:
    Readonly<XviCodingResumeIntegrityReceipt>,
): void {
  if (
    receipt === null ||
    typeof receipt !== "object" ||
    receipt.version !==
      "xvi-coding-resume-integrity-v1" ||

    receipt.resumeIntegrityVerified !==
      true ||

    receipt.localMutationEligible !==
      true ||

    receipt.remoteWriteAuthority !==
      false ||

    receipt.deploymentAuthority !==
      false ||

    receipt.credentialAuthority !==
      false ||

    receipt.productionAuthority !==
      false ||

    !ID.test(receipt.missionId) ||

    !SHA256.test(
      receipt.integrityDigest,
    ) ||

    !NONCE.test(
      receipt.replayNonce,
    )
  ) {
    refuse();
  }
}

function digestConsumption(input: {
  missionId: string;
  integrityDigest: string;
  replayNonce: string;
  consumedAtMs: number;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        "xvi-coding-durable-replay-v1",
        input.missionId,
        input.integrityDigest,
        input.replayNonce,
        input.consumedAtMs,
      ]),
    )
    .digest("hex");
}

interface ReplayRow {
  mission_id: string;
  integrity_digest: string;
  replay_nonce: string;
  consumed_at_ms: number;
  consumption_digest: string;
}

export class XviCodingDurableReplayStore {
  readonly #db: DatabaseSync;

  constructor(
    databasePath: string,
  ) {
    if (
      typeof databasePath !== "string" ||
      !databasePath.trim()
    ) {
      refuse();
    }

    this.#db =
      new DatabaseSync(
        databasePath,
      );

    this.#db.exec(`
      PRAGMA trusted_schema=OFF;
      PRAGMA busy_timeout=5000;

      CREATE TABLE IF NOT EXISTS
        xvi_coding_resume_replay (
          mission_id TEXT NOT NULL,
          integrity_digest TEXT NOT NULL,
          replay_nonce TEXT NOT NULL,
          consumed_at_ms INTEGER NOT NULL,
          consumption_digest TEXT NOT NULL,

          PRIMARY KEY (
            mission_id,
            replay_nonce
          ),

          UNIQUE (
            integrity_digest
          )
        );
    `);
  }

  consume(input: {
    readonly integrity:
      Readonly<XviCodingResumeIntegrityReceipt>;

    readonly consumedAtMs: number;
  }): Readonly<XviCodingDurableReplayReceipt> {
    if (
      input === null ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.getPrototypeOf(input) !==
        Object.prototype
    ) {
      refuse();
    }

    const descriptors =
      Object.getOwnPropertyDescriptors(
        input,
      );

    const keys =
      Reflect.ownKeys(input);

    if (
      keys.length !== 2 ||
      !keys.includes("integrity") ||
      !keys.includes("consumedAtMs")
    ) {
      refuse();
    }

    for (
      const key of [
        "integrity",
        "consumedAtMs",
      ]
    ) {
      const descriptor =
        descriptors[key];

      if (
        !descriptor ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        refuse();
      }
    }

    const integrity =
      descriptors.integrity.value as
        Readonly<XviCodingResumeIntegrityReceipt>;

    verifyIntegrity(
      integrity,
    );

    const consumedAtMs =
      descriptors.consumedAtMs.value;

    if (
      !Number.isSafeInteger(
        consumedAtMs,
      ) ||
      consumedAtMs <
        integrity.observedAtMs
    ) {
      refuse();
    }

    const consumptionDigest =
      digestConsumption({
        missionId:
          integrity.missionId,

        integrityDigest:
          integrity.integrityDigest,

        replayNonce:
          integrity.replayNonce,

        consumedAtMs,
      });

    this.#db.exec(
      "BEGIN IMMEDIATE",
    );

    try {
      const existing =
        this.#db
          .prepare(`
            SELECT
              mission_id,
              integrity_digest,
              replay_nonce,
              consumed_at_ms,
              consumption_digest

            FROM
              xvi_coding_resume_replay

            WHERE
              mission_id = ?
              AND replay_nonce = ?
          `)
          .get(
            integrity.missionId,
            integrity.replayNonce,
          ) as ReplayRow | undefined;

      if (existing) {
        refuse();
      }

      this.#db
        .prepare(`
          INSERT INTO
            xvi_coding_resume_replay (
              mission_id,
              integrity_digest,
              replay_nonce,
              consumed_at_ms,
              consumption_digest
            )

          VALUES (?, ?, ?, ?, ?)
        `)
        .run(
          integrity.missionId,
          integrity.integrityDigest,
          integrity.replayNonce,
          consumedAtMs,
          consumptionDigest,
        );

      this.#db.exec(
        "COMMIT",
      );
    }
    catch {
      try {
        this.#db.exec(
          "ROLLBACK",
        );
      }
      catch {
        // Preserve the original refusal path.
      }

      refuse();
    }

    return Object.freeze({
      version:
        "xvi-coding-durable-replay-v1" as const,

      missionId:
        integrity.missionId,

      integrityDigest:
        integrity.integrityDigest,

      replayNonce:
        integrity.replayNonce,

      consumedAtMs,

      consumptionDigest,

      durable:
        true as const,

      consumedExactlyOnce:
        true as const,

      remoteWriteAuthority:
        false as const,

      deploymentAuthority:
        false as const,

      credentialAuthority:
        false as const,

      productionAuthority:
        false as const,
    });
  }

  hasConsumed(
    missionId: string,
    replayNonce: string,
  ): boolean {
    if (
      !ID.test(missionId) ||
      !NONCE.test(replayNonce)
    ) {
      refuse();
    }

    const row =
      this.#db
        .prepare(`
          SELECT 1 AS present
          FROM xvi_coding_resume_replay
          WHERE
            mission_id = ?
            AND replay_nonce = ?
        `)
        .get(
          missionId,
          replayNonce,
        );

    return row !== undefined;
  }

  get size(): number {
    const row =
      this.#db
        .prepare(`
          SELECT
            count(*) AS count
          FROM
            xvi_coding_resume_replay
        `)
        .get() as {
          count: number;
        };

    return Number(
      row.count,
    );
  }

  close(): void {
    this.#db.close();
  }
}
