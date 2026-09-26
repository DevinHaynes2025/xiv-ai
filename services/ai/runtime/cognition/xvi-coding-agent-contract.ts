import { createHash } from "node:crypto";

export type XviCodingAgentRole = "BUILDER" | "TESTER" | "REVIEWER" | "SECURITY";

export interface XviCodingAgentAssignment {
  readonly kind: "XVI_CODING_AGENT_ASSIGNMENT";
  readonly taskId: string;
  readonly role: XviCodingAgentRole;
  readonly baseCommitSha: string;
  readonly worktreeId: string;
  readonly permittedPaths: readonly string[];
  readonly prohibitedPaths: readonly string[];
  readonly allowedTestCommands: readonly string[];
  readonly maxAttempts: number;
  readonly maxDurationMs: number;
  readonly repositoryWriteAllowed: boolean;
  readonly mergeAllowed: false;
  readonly pushAllowed: false;
  readonly deployAllowed: false;
  readonly credentialAccessAllowed: false;
  readonly productionMutationAllowed: false;
  readonly humanApprovalRequiredForIntegration: true;
}

export interface XviCodingAgentEvidence {
  readonly kind: "XVI_CODING_AGENT_EVIDENCE";
  readonly taskId: string;
  readonly role: XviCodingAgentRole;
  readonly baseCommitSha: string;
  readonly changedPaths: readonly string[];
  readonly testCommands: readonly string[];
  readonly testPassed: boolean;
  readonly findings: readonly string[];
  readonly submittedAtMs: number;
  readonly evidenceDigest: string;
  readonly mergeAllowed: false;
  readonly pushAllowed: false;
  readonly deployAllowed: false;
}

const SHA40 = /^[0-9a-f]{40}$/;
const ID = /^[A-Za-z0-9_.:@-]+$/;

function unique(values: readonly string[], field: string): readonly string[] {
  const normalized = values.map(v => v.trim());
  if (normalized.some(v => !v)) throw new Error(`${field} contains empty value`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} contains duplicate`);
  return Object.freeze([...normalized]);
}

function safePath(path: string): boolean {
  return !path.startsWith("/") &&
    !/^[A-Za-z]:[\\/]/.test(path) &&
    !path.split(/[\\/]+/).includes("..");
}

export function createXviCodingAgentAssignment(input: {
  taskId: string;
  role: XviCodingAgentRole;
  baseCommitSha: string;
  worktreeId: string;
  permittedPaths: readonly string[];
  prohibitedPaths?: readonly string[];
  allowedTestCommands?: readonly string[];
  maxAttempts?: number;
  maxDurationMs?: number;
}): Readonly<XviCodingAgentAssignment> {
  if (!input.taskId || input.taskId.length > 128 || !ID.test(input.taskId)) throw new Error("taskId invalid");
  if (!input.worktreeId || input.worktreeId.length > 128 || !ID.test(input.worktreeId)) throw new Error("worktreeId invalid");
  if (!SHA40.test(input.baseCommitSha)) throw new Error("baseCommitSha invalid");

  const permittedPaths = unique(input.permittedPaths, "permittedPaths");
  const prohibitedPaths = unique(input.prohibitedPaths ?? [], "prohibitedPaths");
  const allowedTestCommands = unique(input.allowedTestCommands ?? [], "allowedTestCommands");

  if (!permittedPaths.length || permittedPaths.some(p => !safePath(p)) ||
      prohibitedPaths.some(p => !safePath(p))) throw new Error("path contract invalid");

  const maxAttempts = input.maxAttempts ?? 3;
  const maxDurationMs = input.maxDurationMs ?? 300_000;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 8) throw new Error("maxAttempts invalid");
  if (!Number.isSafeInteger(maxDurationMs) || maxDurationMs < 1000 || maxDurationMs > 3_600_000) {
    throw new Error("maxDurationMs invalid");
  }

  return Object.freeze({
    kind: "XVI_CODING_AGENT_ASSIGNMENT" as const,
    taskId: input.taskId,
    role: input.role,
    baseCommitSha: input.baseCommitSha,
    worktreeId: input.worktreeId,
    permittedPaths,
    prohibitedPaths,
    allowedTestCommands,
    maxAttempts,
    maxDurationMs,
    repositoryWriteAllowed: input.role === "BUILDER",
    mergeAllowed: false as const,
    pushAllowed: false as const,
    deployAllowed: false as const,
    credentialAccessAllowed: false as const,
    productionMutationAllowed: false as const,
    humanApprovalRequiredForIntegration: true as const,
  });
}

export function createXviCodingAgentEvidence(input: {
  assignment: Readonly<XviCodingAgentAssignment>;
  changedPaths?: readonly string[];
  testCommands?: readonly string[];
  testPassed: boolean;
  findings?: readonly string[];
  submittedAtMs: number;
}): Readonly<XviCodingAgentEvidence> {
  if (!Number.isSafeInteger(input.submittedAtMs) || input.submittedAtMs <= 0) throw new Error("submittedAtMs invalid");

  const changedPaths = unique(input.changedPaths ?? [], "changedPaths");
  const testCommands = unique(input.testCommands ?? [], "testCommands");
  const findings = unique(input.findings ?? [], "findings");

  if (input.assignment.role !== "BUILDER" && changedPaths.length) {
    throw new Error("non-builder agent cannot submit repository changes");
  }

  for (const path of changedPaths) {
    const permitted = input.assignment.permittedPaths.some(p => path === p || path.startsWith(`${p}/`));
    const prohibited = input.assignment.prohibitedPaths.some(p => path === p || path.startsWith(`${p}/`));
    if (!safePath(path) || !permitted || prohibited) throw new Error(`changed path outside assignment: ${path}`);
  }

  for (const command of testCommands) {
    if (!input.assignment.allowedTestCommands.includes(command)) throw new Error(`test command outside allowlist: ${command}`);
  }

  const body = {
    kind: "XVI_CODING_AGENT_EVIDENCE" as const,
    taskId: input.assignment.taskId,
    role: input.assignment.role,
    baseCommitSha: input.assignment.baseCommitSha,
    changedPaths,
    testCommands,
    testPassed: input.testPassed,
    findings,
    submittedAtMs: input.submittedAtMs,
    mergeAllowed: false as const,
    pushAllowed: false as const,
    deployAllowed: false as const,
  };

  return Object.freeze({
    ...body,
    evidenceDigest: createHash("sha256").update(JSON.stringify(body), "utf8").digest("hex"),
  });
}
