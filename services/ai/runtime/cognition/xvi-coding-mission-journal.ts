import { createHash } from "node:crypto";
import {
  closeSync,
  lstatSync,
  openSync,
  realpathSync,
} from "node:fs";
import { DatabaseSync } from "node:sqlite";

import type {
  XviCodingMissionControllerEnvelope,
} from "./xvi-coding-mission-controller";

type MissionState =
  XviCodingMissionControllerEnvelope["state"];

type Row = {
  mission_id: string;
  base_commit_sha: string;
  state: MissionState;
  envelope_digest: string;
  envelope_json: string;
  evidence_count: number;
  updated_at_ms: number;
};

const SHA40 = /^[0-9a-f]{40}$/;
const SHA64 = /^[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9_.:@-]+$/;

const ALLOWED_TRANSITIONS = {
  CREATED: ["CREATED", "ACTIVE"],
  ACTIVE: ["ACTIVE", "EVIDENCE_PENDING", "BLOCKED"],
  EVIDENCE_PENDING: [
    "EVIDENCE_PENDING",
    "BLOCKED",
    "READY_FOR_HUMAN_REVIEW",
  ],
  BLOCKED: ["BLOCKED"],
  READY_FOR_HUMAN_REVIEW: [
    "READY_FOR_HUMAN_REVIEW",
  ],
} as const satisfies Readonly<Record<
  MissionState,
  readonly MissionState[]
>>;

function transitionAllowed(
  from: MissionState,
  to: MissionState,
): boolean {
  const allowed: readonly MissionState[] =
    ALLOWED_TRANSITIONS[from];

  return allowed.includes(to);
}

function refuse(reason: string): never {
  throw new Error(`XVI_CODING_MISSION_JOURNAL_REFUSED: ${reason}`);
}

function positive(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function canonicalEnvelopeBody(
  envelope: Readonly<XviCodingMissionControllerEnvelope>,
) {
  return {
    kind: "XVI_CODING_MISSION_CONTROLLER_ENVELOPE" as const,
    controllerVersion: "xvi-coding-mission-controller-v1" as const,
    mission: envelope.mission,
    worktrees: envelope.worktrees,
    gitPlans: envelope.gitPlans,
    evidence: envelope.evidence,
    state: envelope.state,
    humanApprovalRequired: true as const,
    automaticMergeAllowed: false as const,
    automaticPushAllowed: false as const,
    automaticDeployAllowed: false as const,
    credentialAccessAllowed: false as const,
    productionMutationAllowed: false as const,
  };
}

function verifyEnvelope(
  envelope: Readonly<XviCodingMissionControllerEnvelope>,
): true {
  if (
    envelope.kind !== "XVI_CODING_MISSION_CONTROLLER_ENVELOPE" ||
    envelope.controllerVersion !== "xvi-coding-mission-controller-v1"
  ) {
    refuse("controller envelope identity invalid");
  }

  if (
    !envelope.mission.missionId ||
    envelope.mission.missionId.length > 128 ||
    !ID.test(envelope.mission.missionId)
  ) {
    refuse("mission identity invalid");
  }

  if (!SHA40.test(envelope.mission.baseCommitSha)) {
    refuse("mission base commit invalid");
  }

  if (
    envelope.humanApprovalRequired !== true ||
    envelope.automaticMergeAllowed !== false ||
    envelope.automaticPushAllowed !== false ||
    envelope.automaticDeployAllowed !== false ||
    envelope.credentialAccessAllowed !== false ||
    envelope.productionMutationAllowed !== false
  ) {
    refuse("mission authority contract invalid");
  }

  if (!ALLOWED_TRANSITIONS[envelope.state]) {
    refuse("mission state invalid");
  }

  if (!SHA64.test(envelope.envelopeDigest)) {
    refuse("envelope digest invalid");
  }

  const expectedDigest = createHash("sha256")
    .update(JSON.stringify(canonicalEnvelopeBody(envelope)), "utf8")
    .digest("hex");

  if (expectedDigest !== envelope.envelopeDigest) {
    refuse("envelope digest mismatch");
  }

  return true;
}

function parseRow(
  row: Row,
): Readonly<XviCodingMissionControllerEnvelope> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(row.envelope_json);
  } catch {
    refuse("stored envelope JSON invalid");
  }

  const envelope =
    parsed as Readonly<XviCodingMissionControllerEnvelope>;

  verifyEnvelope(envelope);

  if (
    envelope.mission.missionId !== row.mission_id ||
    envelope.mission.baseCommitSha !== row.base_commit_sha ||
    envelope.state !== row.state ||
    envelope.envelopeDigest !== row.envelope_digest ||
    envelope.evidence.length !== row.evidence_count
  ) {
    refuse("stored mission metadata mismatch");
  }

  return Object.freeze(envelope);
}

export class XviCodingMissionJournal {
  readonly #db: DatabaseSync;

  constructor(path: string) {
    const stat = lstatSync(path);

    if (!stat.isFile() || stat.isSymbolicLink()) {
      refuse("regular existing journal required");
    }

    this.#db = new DatabaseSync(realpathSync(path), {
      allowExtension: false,
    });

    this.#db.exec(
      `PRAGMA trusted_schema=OFF;
       PRAGMA synchronous=FULL;
       PRAGMA busy_timeout=1000;`,
    );

    const meta = this.#db
      .prepare(
        `SELECT schema_version
         FROM xvi_coding_mission_meta
         WHERE singleton=1`,
      )
      .get() as
      | { schema_version: number }
      | undefined;

    if (!meta || meta.schema_version !== 1) {
      this.#db.close();
      refuse("journal schema mismatch");
    }
  }

  static initialize(path: string): void {
    closeSync(openSync(path, "wx", 0o600));

    const db = new DatabaseSync(path, {
      allowExtension: false,
    });

    try {
      db.exec(
        `PRAGMA trusted_schema=OFF;
         PRAGMA journal_mode=WAL;
         PRAGMA synchronous=FULL;

         CREATE TABLE xvi_coding_mission_meta(
           singleton INTEGER PRIMARY KEY
             CHECK(singleton=1),
           schema_version INTEGER NOT NULL
             CHECK(schema_version=1)
         ) STRICT;

         INSERT INTO xvi_coding_mission_meta(
           singleton,
           schema_version
         ) VALUES(1,1);

         CREATE TABLE xvi_coding_missions(
           mission_id TEXT PRIMARY KEY,

           base_commit_sha TEXT NOT NULL
             CHECK(length(base_commit_sha)=40),

           state TEXT NOT NULL
             CHECK(state IN (
               'CREATED',
               'ACTIVE',
               'EVIDENCE_PENDING',
               'BLOCKED',
               'READY_FOR_HUMAN_REVIEW'
             )),

           envelope_digest TEXT NOT NULL
             CHECK(length(envelope_digest)=64),

           envelope_json TEXT NOT NULL,

           evidence_count INTEGER NOT NULL
             CHECK(evidence_count>=0 AND evidence_count<=4),

           updated_at_ms INTEGER NOT NULL
             CHECK(updated_at_ms>0)
         ) STRICT;`,
      );
    } finally {
      db.close();
    }
  }

  close(): void {
    this.#db.close();
  }

  #tx<T>(fn: () => T): T {
    this.#db.exec("BEGIN IMMEDIATE");

    try {
      const value = fn();
      this.#db.exec("COMMIT");
      return value;
    } catch (error) {
      try {
        this.#db.exec("ROLLBACK");
      } catch {
        // Preserve original blocker.
      }
      throw error;
    }
  }

  read(
    missionId: string,
  ): Readonly<XviCodingMissionControllerEnvelope> | null {
    const row = this.#db
      .prepare(
        `SELECT
           mission_id,
           base_commit_sha,
           state,
           envelope_digest,
           envelope_json,
           evidence_count,
           updated_at_ms
         FROM xvi_coding_missions
         WHERE mission_id=?`,
      )
      .get(missionId) as Row | undefined;

    return row ? parseRow(row) : null;
  }

  put(input: {
    envelope: Readonly<XviCodingMissionControllerEnvelope>;
    updatedAtMs: number;
  }): void {
    verifyEnvelope(input.envelope);

    if (!positive(input.updatedAtMs)) {
      refuse("updated timestamp invalid");
    }

    this.#tx(() => {
      const priorRow = this.#db
        .prepare(
          `SELECT
             mission_id,
             base_commit_sha,
             state,
             envelope_digest,
             envelope_json,
             evidence_count,
             updated_at_ms
           FROM xvi_coding_missions
           WHERE mission_id=?`,
        )
        .get(input.envelope.mission.missionId) as Row | undefined;

      if (priorRow) {
        const prior = parseRow(priorRow);

        if (
          prior.mission.baseCommitSha !==
          input.envelope.mission.baseCommitSha
        ) {
          refuse("mission cannot change base commit");
        }

        if (
          !transitionAllowed(
            prior.state,
            input.envelope.state,
          )
        ) {
          refuse("mission state cannot roll back");
        }

        if (
          input.envelope.evidence.length <
          prior.evidence.length
        ) {
          refuse("mission evidence cannot decrease");
        }

        if (input.updatedAtMs < priorRow.updated_at_ms) {
          refuse("updated timestamp cannot decrease");
        }
      }

      this.#db
        .prepare(
          `INSERT INTO xvi_coding_missions(
             mission_id,
             base_commit_sha,
             state,
             envelope_digest,
             envelope_json,
             evidence_count,
             updated_at_ms
           ) VALUES(?,?,?,?,?,?,?)
           ON CONFLICT(mission_id) DO UPDATE SET
             state=excluded.state,
             envelope_digest=excluded.envelope_digest,
             envelope_json=excluded.envelope_json,
             evidence_count=excluded.evidence_count,
             updated_at_ms=excluded.updated_at_ms
           WHERE
             xvi_coding_missions.base_commit_sha=
               excluded.base_commit_sha`,
        )
        .run(
          input.envelope.mission.missionId,
          input.envelope.mission.baseCommitSha,
          input.envelope.state,
          input.envelope.envelopeDigest,
          JSON.stringify(input.envelope),
          input.envelope.evidence.length,
          input.updatedAtMs,
        );
    });
  }
}
