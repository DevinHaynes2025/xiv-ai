import {
  DatabaseSync,
} from "node:sqlite";

import type {
  XviCodingAgentBackend,
  XviCodingAgentPrompt,
} from "./xvi-coding-agent-prompt";

import type {
  XviCodingWorkItem,
} from "./xvi-coding-work-item";

export type XviCodingQueueState =
  | "QUEUED"
  | "CLAIMED"
  | "RUNNING"
  | "RETRYABLE"
  | "READY_FOR_HUMAN_REVIEW"
  | "FAILED";

export interface XviQueuedCodingWork {
  readonly workId: string;
  readonly missionId: string;
  readonly workDigest: string;
  readonly promptDigest: string;
  readonly backend: XviCodingAgentBackend;
  readonly state: XviCodingQueueState;

  readonly attemptCount: number;
  readonly maxAttempts: number;

  readonly createdAtMs: number;
  readonly updatedAtMs: number;

  readonly claimedBy: string | null;
  readonly leaseExpiresAtMs: number | null;

  readonly humanApprovalRequired: true;
  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;
  readonly productionMutationAllowed: false;
}

export const XVI_DURABLE_CODING_QUEUE_POLICY =
  Object.freeze({
    durable: true,
    localQueueOnly: true,

    maximumLeaseMs:
      15 * 60 * 1000,

    humanApprovalRequired: true,

    automaticPushAllowed: false,
    automaticDeployAllowed: false,
    productionMutationAllowed: false,
  });

const refuse = (
  reason: string,
): never => {
  throw new Error(
    `XVI_DURABLE_CODING_QUEUE_REFUSED: ${reason}`,
  );
};

interface QueueRow {
  work_id: string;
  mission_id: string;
  work_digest: string;
  prompt_digest: string;
  backend: string;
  state: string;
  attempt_count: number;
  max_attempts: number;
  created_at_ms: number;
  updated_at_ms: number;
  claimed_by: string | null;
  lease_expires_at_ms: number | null;
}

function rowToWork(
  row: QueueRow,
): Readonly<XviQueuedCodingWork> {
  return Object.freeze({
    workId: row.work_id,
    missionId: row.mission_id,

    workDigest: row.work_digest,
    promptDigest: row.prompt_digest,

    backend:
      row.backend as XviCodingAgentBackend,

    state:
      row.state as XviCodingQueueState,

    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,

    createdAtMs: row.created_at_ms,
    updatedAtMs: row.updated_at_ms,

    claimedBy: row.claimed_by,
    leaseExpiresAtMs:
      row.lease_expires_at_ms,

    humanApprovalRequired:
      true as const,

    automaticPushAllowed:
      false as const,

    automaticDeployAllowed:
      false as const,

    productionMutationAllowed:
      false as const,
  });
}

export class XviDurableCodingWorkQueue {
  readonly #db: DatabaseSync;

  constructor(
    databasePath: string,
  ) {
    if (
      typeof databasePath !== "string" ||
      !databasePath.trim()
    ) {
      refuse("database path required");
    }

    this.#db =
      new DatabaseSync(databasePath);

    this.#db.exec(`
      PRAGMA trusted_schema=OFF;
      PRAGMA busy_timeout=5000;

      CREATE TABLE IF NOT EXISTS
        xvi_coding_work_queue (
          work_id TEXT PRIMARY KEY,
          mission_id TEXT NOT NULL,
          work_digest TEXT NOT NULL,
          prompt_digest TEXT NOT NULL,
          backend TEXT NOT NULL,
          state TEXT NOT NULL,
          attempt_count INTEGER NOT NULL,
          max_attempts INTEGER NOT NULL,
          created_at_ms INTEGER NOT NULL,
          updated_at_ms INTEGER NOT NULL,
          claimed_by TEXT,
          lease_expires_at_ms INTEGER
        );

      CREATE UNIQUE INDEX IF NOT EXISTS
        xvi_coding_work_digest_unique
      ON xvi_coding_work_queue (
        work_digest
      );
    `);
  }

  enqueue(input: {
    readonly work:
      Readonly<XviCodingWorkItem>;

    readonly prompt:
      Readonly<XviCodingAgentPrompt>;

    readonly nowMs: number;
  }): Readonly<XviQueuedCodingWork> {
    if (
      input.work.workId !==
        input.prompt.workId ||

      input.work.missionId !==
        input.prompt.missionId ||

      input.work.workDigest !==
        input.prompt.workDigest
    ) {
      refuse(
        "work and prompt identity mismatch",
      );
    }

    if (
      input.work.automaticPushAllowed !== false ||
      input.work.automaticDeployAllowed !== false ||
      input.work.productionMutationAllowed !== false ||
      input.prompt.automaticPushAllowed !== false ||
      input.prompt.automaticDeployAllowed !== false ||
      input.prompt.productionMutationAllowed !== false ||
      input.work.humanApprovalRequired !== true ||
      input.prompt.humanApprovalRequired !== true
    ) {
      refuse(
        "authority boundary mismatch",
      );
    }

    if (
      !Number.isSafeInteger(input.nowMs) ||
      input.nowMs <= 0
    ) {
      refuse(
        "invalid enqueue timestamp",
      );
    }

    try {
      this.#db
        .prepare(`
          INSERT INTO
            xvi_coding_work_queue (
              work_id,
              mission_id,
              work_digest,
              prompt_digest,
              backend,
              state,
              attempt_count,
              max_attempts,
              created_at_ms,
              updated_at_ms,
              claimed_by,
              lease_expires_at_ms
            )
          VALUES (
            ?, ?, ?, ?, ?,
            'QUEUED',
            0, ?, ?, ?,
            NULL, NULL
          )
        `)
        .run(
          input.work.workId,
          input.work.missionId,
          input.work.workDigest,
          input.prompt.promptDigest,
          input.prompt.backend,
          input.work.maxAttempts,
          input.nowMs,
          input.nowMs,
        );
    }
    catch {
      refuse(
        "duplicate or invalid work",
      );
    }

    const result =
      this.read(input.work.workId);

    if (!result) {
      refuse(
        "persisted work missing",
      );
    }

    return result;
  }

  read(
    workId: string,
  ): Readonly<XviQueuedCodingWork> | null {
    const row =
      this.#db
        .prepare(`
          SELECT
            work_id,
            mission_id,
            work_digest,
            prompt_digest,
            backend,
            state,
            attempt_count,
            max_attempts,
            created_at_ms,
            updated_at_ms,
            claimed_by,
            lease_expires_at_ms
          FROM
            xvi_coding_work_queue
          WHERE
            work_id = ?
        `)
        .get(workId) as
          QueueRow | undefined;

    return row
      ? rowToWork(row)
      : null;
  }

  claimNext(input: {
    readonly workerId: string;
    readonly backend: XviCodingAgentBackend;
    readonly nowMs: number;
    readonly leaseMs: number;
  }): Readonly<XviQueuedCodingWork> | null {
    if (
      typeof input.workerId !== "string" ||
      !input.workerId.trim() ||
      input.workerId.length > 128
    ) {
      refuse("invalid worker identity");
    }

    if (
      !Number.isSafeInteger(input.nowMs) ||
      input.nowMs <= 0
    ) {
      refuse("invalid claim timestamp");
    }

    if (
      !Number.isSafeInteger(input.leaseMs) ||
      input.leaseMs < 1 ||
      input.leaseMs >
        XVI_DURABLE_CODING_QUEUE_POLICY.maximumLeaseMs
    ) {
      refuse("invalid lease duration");
    }

    this.#db.exec("BEGIN IMMEDIATE");

    try {
      /*
       * Recover expired claims before choosing work.
       */
      this.#db
        .prepare(`
          UPDATE xvi_coding_work_queue
          SET
            state = 'QUEUED',
            claimed_by = NULL,
            lease_expires_at_ms = NULL,
            updated_at_ms = ?
          WHERE
            state IN ('CLAIMED', 'RUNNING')
            AND lease_expires_at_ms IS NOT NULL
            AND lease_expires_at_ms <= ?
            AND attempt_count < max_attempts
        `)
        .run(
          input.nowMs,
          input.nowMs,
        );

      const row =
        this.#db
          .prepare(`
            SELECT
              work_id,
              mission_id,
              work_digest,
              prompt_digest,
              backend,
              state,
              attempt_count,
              max_attempts,
              created_at_ms,
              updated_at_ms,
              claimed_by,
              lease_expires_at_ms

            FROM
              xvi_coding_work_queue

            WHERE
              state = 'QUEUED'
              AND backend = ?
              AND attempt_count < max_attempts

            ORDER BY
              created_at_ms ASC,
              work_id ASC

            LIMIT 1
          `)
          .get(
            input.backend,
          ) as QueueRow | undefined;

      if (!row) {
        this.#db.exec("COMMIT");
        return null;
      }

      const leaseExpiresAtMs =
        input.nowMs +
        input.leaseMs;

      const result =
        this.#db
          .prepare(`
            UPDATE
              xvi_coding_work_queue

            SET
              state = 'CLAIMED',
              claimed_by = ?,
              lease_expires_at_ms = ?,
              attempt_count = attempt_count + 1,
              updated_at_ms = ?

            WHERE
              work_id = ?
              AND state = 'QUEUED'
              AND attempt_count < max_attempts
          `)
          .run(
            input.workerId,
            leaseExpiresAtMs,
            input.nowMs,
            row.work_id,
          );

      if (
        Number(result.changes) !== 1
      ) {
        refuse("atomic claim failed");
      }

      const claimed =
        this.read(
          row.work_id,
        );

      if (!claimed) {
        refuse("claimed work disappeared");
      }

      this.#db.exec("COMMIT");

      return claimed;
    }
    catch {
      try {
        this.#db.exec("ROLLBACK");
      }
      catch {
        // Preserve original refusal path.
      }

      refuse("claim transaction failed");
    }
  }

  markRunning(input: {
    readonly workId: string;
    readonly workerId: string;
    readonly nowMs: number;
  }): Readonly<XviQueuedCodingWork> {
    const result =
      this.#db
        .prepare(`
          UPDATE xvi_coding_work_queue
          SET
            state = 'RUNNING',
            updated_at_ms = ?
          WHERE
            work_id = ?
            AND claimed_by = ?
            AND state = 'CLAIMED'
            AND lease_expires_at_ms > ?
        `)
        .run(
          input.nowMs,
          input.workId,
          input.workerId,
          input.nowMs,
        );

    if (
      Number(result.changes) !== 1
    ) {
      refuse("running transition refused");
    }

    const row =
      this.read(
        input.workId,
      );

    if (!row) {
      refuse("running work missing");
    }

    return row;
  }

  completeForReview(input: {
    readonly workId: string;
    readonly workerId: string;
    readonly nowMs: number;
  }): Readonly<XviQueuedCodingWork> {
    if (
      !Number.isSafeInteger(input.nowMs) ||
      input.nowMs <= 0
    ) {
      refuse("invalid completion timestamp");
    }

    const result =
      this.#db
        .prepare(`
          UPDATE xvi_coding_work_queue
          SET
            state = 'READY_FOR_HUMAN_REVIEW',
            updated_at_ms = ?,
            claimed_by = NULL,
            lease_expires_at_ms = NULL
          WHERE
            work_id = ?
            AND claimed_by = ?
            AND state = 'RUNNING'
            AND lease_expires_at_ms > ?
        `)
        .run(
          input.nowMs,
          input.workId,
          input.workerId,
          input.nowMs,
        );

    if (
      Number(result.changes) !== 1
    ) {
      refuse("completion transition refused");
    }

    const row =
      this.read(input.workId);

    if (!row) {
      refuse("completed work missing");
    }

    return row;
  }

  recordFailure(input: {
    readonly workId: string;
    readonly workerId: string;
    readonly nowMs: number;
  }): Readonly<XviQueuedCodingWork> {
    if (
      !Number.isSafeInteger(input.nowMs) ||
      input.nowMs <= 0
    ) {
      refuse("invalid failure timestamp");
    }

    this.#db.exec("BEGIN IMMEDIATE");

    try {
      const current =
        this.#db
          .prepare(`
            SELECT
              work_id,
              mission_id,
              work_digest,
              prompt_digest,
              backend,
              state,
              attempt_count,
              max_attempts,
              created_at_ms,
              updated_at_ms,
              claimed_by,
              lease_expires_at_ms
            FROM xvi_coding_work_queue
            WHERE work_id = ?
          `)
          .get(input.workId) as
            QueueRow | undefined;

      if (
        !current ||
        current.state !== "RUNNING" ||
        current.claimed_by !==
          input.workerId ||
        current.lease_expires_at_ms === null ||
        current.lease_expires_at_ms <=
          input.nowMs
      ) {
        refuse("failure transition refused");
      }

      const exhausted =
        current.attempt_count >=
        current.max_attempts;

      const nextState =
        exhausted
          ? "FAILED"
          : "RETRYABLE";

      const update =
        this.#db
          .prepare(`
            UPDATE xvi_coding_work_queue
            SET
              state = ?,
              updated_at_ms = ?,
              claimed_by = NULL,
              lease_expires_at_ms = NULL
            WHERE
              work_id = ?
              AND state = 'RUNNING'
              AND claimed_by = ?
          `)
          .run(
            nextState,
            input.nowMs,
            input.workId,
            input.workerId,
          );

      if (
        Number(update.changes) !== 1
      ) {
        refuse("failure update refused");
      }

      /*
       * Recoverable failures are immediately
       * returned to the durable queue.
       */
      if (!exhausted) {
        const retry =
          this.#db
            .prepare(`
              UPDATE xvi_coding_work_queue
              SET
                state = 'QUEUED',
                updated_at_ms = ?
              WHERE
                work_id = ?
                AND state = 'RETRYABLE'
            `)
            .run(
              input.nowMs,
              input.workId,
            );

        if (
          Number(retry.changes) !== 1
        ) {
          refuse("retry requeue refused");
        }
      }

      const row =
        this.read(input.workId);

      if (!row) {
        refuse("failed work missing");
      }

      this.#db.exec("COMMIT");

      return row;
    }
    catch {
      try {
        this.#db.exec("ROLLBACK");
      }
      catch {
        // Preserve original refusal.
      }

      refuse("failure transaction refused");
    }
  }

  close(): void {
    this.#db.close();
  }
}
