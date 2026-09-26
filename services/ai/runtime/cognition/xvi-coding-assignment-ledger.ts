import { closeSync, lstatSync, openSync, realpathSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { XviCodingWorktreeRecord, XviCodingWorktreeState } from "./xvi-coding-worktree-lifecycle";

type Row = {
  task_id: string; role: string; worktree_id: string; base_commit_sha: string;
  state: XviCodingWorktreeState; attempts_used: number; max_attempts: number;
  activated_at_ms: number | null; evidence_digest: string | null;
  current_head_sha: string | null; stale_base: number;
};

const refuse = (reason: string): never => {
  throw new Error(`XVI_CODING_ASSIGNMENT_LEDGER_REFUSED: ${reason}`);
};

function toRecord(row: Row): Readonly<XviCodingWorktreeRecord> {
  return Object.freeze({
    taskId: row.task_id, role: row.role as XviCodingWorktreeRecord["role"],
    worktreeId: row.worktree_id, baseCommitSha: row.base_commit_sha,
    state: row.state, attemptsUsed: row.attempts_used, maxAttempts: row.max_attempts,
    activatedAtMs: row.activated_at_ms, evidenceDigest: row.evidence_digest,
    currentHeadSha: row.current_head_sha, staleBase: row.stale_base === 1,
    humanApprovalRequired: true, automaticMergeAllowed: false,
    automaticPushAllowed: false, automaticDeployAllowed: false,
  });
}

export class XviCodingAssignmentLedger {
  readonly #db: DatabaseSync;

  constructor(path: string) {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) refuse("regular existing ledger required");
    this.#db = new DatabaseSync(realpathSync(path), { allowExtension: false });
    this.#db.exec("PRAGMA trusted_schema=OFF; PRAGMA synchronous=FULL; PRAGMA busy_timeout=1000;");
    const meta = this.#db.prepare(
      "SELECT schema_version FROM xvi_coding_assignment_meta WHERE singleton=1"
    ).get() as { schema_version: number } | undefined;
    if (!meta || meta.schema_version !== 1) {
      this.#db.close();
      refuse("ledger schema mismatch");
    }
  }

  static initialize(path: string): void {
    closeSync(openSync(path, "wx", 0o600));
    const db = new DatabaseSync(path, { allowExtension: false });
    try {
      db.exec(`PRAGMA trusted_schema=OFF;
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=FULL;
        CREATE TABLE xvi_coding_assignment_meta(
          singleton INTEGER PRIMARY KEY CHECK(singleton=1),
          schema_version INTEGER NOT NULL CHECK(schema_version=1)
        ) STRICT;
        INSERT INTO xvi_coding_assignment_meta VALUES(1,1);
        CREATE TABLE xvi_coding_assignments(
          task_id TEXT PRIMARY KEY,
          role TEXT NOT NULL CHECK(role IN ('BUILDER','TESTER','REVIEWER','SECURITY')),
          worktree_id TEXT NOT NULL UNIQUE,
          base_commit_sha TEXT NOT NULL CHECK(length(base_commit_sha)=40),
          state TEXT NOT NULL CHECK(state IN (
            'CREATED','ACTIVE','EVIDENCE_SUBMITTED','VERIFIED','BLOCKED','READY_FOR_HUMAN_REVIEW'
          )),
          attempts_used INTEGER NOT NULL CHECK(attempts_used>=0),
          max_attempts INTEGER NOT NULL CHECK(max_attempts>=1),
          activated_at_ms INTEGER,
          evidence_digest TEXT,
          current_head_sha TEXT,
          stale_base INTEGER NOT NULL CHECK(stale_base IN (0,1)),
          CHECK(evidence_digest IS NULL OR length(evidence_digest)=64),
          CHECK(current_head_sha IS NULL OR length(current_head_sha)=40)
        ) STRICT;`);
    } finally { db.close(); }
  }

  close(): void { this.#db.close(); }

  #tx<T>(fn: () => T): T {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const value = fn(); this.#db.exec("COMMIT"); return value;
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch {}
      throw error;
    }
  }

  read(taskId: string): Readonly<XviCodingWorktreeRecord> | null {
    const row = this.#db.prepare(`SELECT task_id,role,worktree_id,base_commit_sha,state,
      attempts_used,max_attempts,activated_at_ms,evidence_digest,current_head_sha,stale_base
      FROM xvi_coding_assignments WHERE task_id=?`).get(taskId) as Row | undefined;
    return row ? toRecord(row) : null;
  }

  put(record: Readonly<XviCodingWorktreeRecord>): void {
    this.#tx(() => {
      const prior = this.read(record.taskId);
      if (prior && prior.worktreeId !== record.worktreeId) refuse("task cannot change worktree identity");
      if (prior && prior.baseCommitSha !== record.baseCommitSha) refuse("task cannot change base commit");
      if (prior && prior.role !== record.role) refuse("task cannot change role");
      if (prior && record.attemptsUsed < prior.attemptsUsed) refuse("attempt counter cannot decrease");

      this.#db.prepare(`INSERT INTO xvi_coding_assignments(
        task_id,role,worktree_id,base_commit_sha,state,attempts_used,max_attempts,
        activated_at_ms,evidence_digest,current_head_sha,stale_base
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(task_id) DO UPDATE SET
        state=excluded.state,attempts_used=excluded.attempts_used,
        activated_at_ms=excluded.activated_at_ms,evidence_digest=excluded.evidence_digest,
        current_head_sha=excluded.current_head_sha,stale_base=excluded.stale_base
      WHERE xvi_coding_assignments.worktree_id=excluded.worktree_id
        AND xvi_coding_assignments.base_commit_sha=excluded.base_commit_sha
        AND xvi_coding_assignments.role=excluded.role`).run(
          record.taskId, record.role, record.worktreeId, record.baseCommitSha,
          record.state, record.attemptsUsed, record.maxAttempts, record.activatedAtMs,
          record.evidenceDigest, record.currentHeadSha, record.staleBase ? 1 : 0
        );
    });
  }
}
