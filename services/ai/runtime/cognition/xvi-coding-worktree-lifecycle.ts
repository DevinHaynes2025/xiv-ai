import type {
  XviCodingAgentAssignment,
  XviCodingAgentEvidence,
  XviCodingAgentRole,
} from "./xvi-coding-agent-contract";

export type XviCodingWorktreeState =
  | "CREATED" | "ACTIVE" | "EVIDENCE_SUBMITTED"
  | "VERIFIED" | "BLOCKED" | "READY_FOR_HUMAN_REVIEW";

export interface XviCodingWorktreeRecord {
  readonly taskId: string;
  readonly role: XviCodingAgentRole;
  readonly worktreeId: string;
  readonly baseCommitSha: string;
  readonly state: XviCodingWorktreeState;
  readonly attemptsUsed: number;
  readonly maxAttempts: number;
  readonly activatedAtMs: number | null;
  readonly evidenceDigest: string | null;
  readonly currentHeadSha: string | null;
  readonly staleBase: boolean;
  readonly humanApprovalRequired: true;
  readonly automaticMergeAllowed: false;
  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;
}

const SHA40 = /^[0-9a-f]{40}$/;
const positive = (v: number) => Number.isSafeInteger(v) && v > 0;

export function createXviCodingWorktreeRecord(
  assignment: Readonly<XviCodingAgentAssignment>,
): Readonly<XviCodingWorktreeRecord> {
  return Object.freeze({
    taskId: assignment.taskId, role: assignment.role,
    worktreeId: assignment.worktreeId, baseCommitSha: assignment.baseCommitSha,
    state: "CREATED" as const, attemptsUsed: 0, maxAttempts: assignment.maxAttempts,
    activatedAtMs: null, evidenceDigest: null, currentHeadSha: null, staleBase: false,
    humanApprovalRequired: true as const,
    automaticMergeAllowed: false as const,
    automaticPushAllowed: false as const,
    automaticDeployAllowed: false as const,
  });
}

export function activateXviCodingWorktree(input: {
  record: Readonly<XviCodingWorktreeRecord>; nowMs: number;
}): Readonly<XviCodingWorktreeRecord> {
  if (input.record.state !== "CREATED") throw new Error("only CREATED worktree may activate");
  if (!positive(input.nowMs)) throw new Error("activation timestamp invalid");
  if (input.record.attemptsUsed >= input.record.maxAttempts) throw new Error("coding attempt budget exhausted");
  return Object.freeze({
    ...input.record, state: "ACTIVE" as const,
    attemptsUsed: input.record.attemptsUsed + 1, activatedAtMs: input.nowMs,
  });
}

export function submitXviCodingEvidence(input: {
  record: Readonly<XviCodingWorktreeRecord>;
  evidence: Readonly<XviCodingAgentEvidence>;
  currentHeadSha: string;
}): Readonly<XviCodingWorktreeRecord> {
  if (input.record.state !== "ACTIVE") throw new Error("evidence requires ACTIVE worktree");
  if (input.evidence.taskId !== input.record.taskId ||
      input.evidence.role !== input.record.role ||
      input.evidence.baseCommitSha !== input.record.baseCommitSha) {
    throw new Error("coding evidence does not belong to worktree assignment");
  }
  if (!/^[0-9a-f]{64}$/.test(input.evidence.evidenceDigest)) throw new Error("evidence digest invalid");
  if (!SHA40.test(input.currentHeadSha)) throw new Error("currentHeadSha invalid");
  return Object.freeze({
    ...input.record, state: "EVIDENCE_SUBMITTED" as const,
    evidenceDigest: input.evidence.evidenceDigest,
    currentHeadSha: input.currentHeadSha,
    staleBase: input.currentHeadSha !== input.record.baseCommitSha,
  });
}

export function verifyXviCodingWorktree(input: {
  record: Readonly<XviCodingWorktreeRecord>;
  accepted: boolean;
  blockingFindings: readonly string[];
}): Readonly<XviCodingWorktreeRecord> {
  if (input.record.state !== "EVIDENCE_SUBMITTED") {
    throw new Error("verification requires submitted evidence");
  }
  const blocked = !input.accepted || input.blockingFindings.length > 0 || input.record.staleBase;
  return Object.freeze({
    ...input.record,
    state: blocked ? "BLOCKED" as const : "VERIFIED" as const,
  });
}

export function markXviCodingWorktreeReadyForHumanReview(
  record: Readonly<XviCodingWorktreeRecord>,
): Readonly<XviCodingWorktreeRecord> {
  if (record.state !== "VERIFIED") throw new Error("only VERIFIED worktree may reach human review");
  return Object.freeze({ ...record, state: "READY_FOR_HUMAN_REVIEW" as const });
}
