import { createHash } from "node:crypto";

export const XVI_GIT_ADAPTER_POLICY = Object.freeze({
  policyVersion: "xvi-git-worktree-adapter-v1",
  allowedOperations: Object.freeze([
    "STATUS_SHORT",
    "REV_PARSE_HEAD",
    "DIFF_NAME_ONLY",
    "WORKTREE_LIST_PORCELAIN",
  ] as const),
});

export type XviGitReadOperation =
  (typeof XVI_GIT_ADAPTER_POLICY.allowedOperations)[number];

export interface XviGitWorktreeIdentity {
  readonly worktreeId: string;
  readonly worktreePath: string;
  readonly branch: string;
  readonly baseCommitSha: string;
}

export interface XviGitOperationPlan {
  readonly kind: "XVI_GIT_OPERATION_PLAN";
  readonly policyVersion: string;
  readonly operation: XviGitReadOperation;
  readonly worktreeId: string;
  readonly worktreePath: string;
  readonly branch: string;
  readonly baseCommitSha: string;
  readonly executable: "git";
  readonly args: readonly string[];
  readonly readOnly: true;
  readonly networkAllowed: false;
  readonly credentialAccessAllowed: false;
  readonly remoteMutationAllowed: false;
  readonly mergeAllowed: false;
  readonly pushAllowed: false;
  readonly deployAllowed: false;
  readonly destructiveResetAllowed: false;
  readonly planDigest: string;
}

const SHA40 = /^[0-9a-f]{40}$/;
const SAFE_ID = /^[A-Za-z0-9_.:@/-]+$/;

function refuse(reason: string): never {
  throw new Error(`XVI_GIT_WORKTREE_ADAPTER_REFUSED: ${reason}`);
}

function assertIdentity(
  identity: Readonly<XviGitWorktreeIdentity>,
): void {
  if (
    !identity.worktreeId ||
    identity.worktreeId.length > 128 ||
    !SAFE_ID.test(identity.worktreeId)
  ) {
    refuse("invalid worktree identity");
  }

  if (!identity.worktreePath.trim()) {
    refuse("worktree path required");
  }

  if (
    !identity.branch ||
    identity.branch.length > 200 ||
    !SAFE_ID.test(identity.branch)
  ) {
    refuse("invalid branch identity");
  }

  if (!SHA40.test(identity.baseCommitSha)) {
    refuse("invalid base commit");
  }
}

function argsFor(
  operation: XviGitReadOperation,
): readonly string[] {
  switch (operation) {
    case "STATUS_SHORT":
      return Object.freeze(["status", "--short"]);

    case "REV_PARSE_HEAD":
      return Object.freeze(["rev-parse", "HEAD"]);

    case "DIFF_NAME_ONLY":
      return Object.freeze(["diff", "--name-only"]);

    case "WORKTREE_LIST_PORCELAIN":
      return Object.freeze(["worktree", "list", "--porcelain"]);
  }
}

function canonicalPlanBody(input: {
  identity: Readonly<XviGitWorktreeIdentity>;
  operation: XviGitReadOperation;
  args: readonly string[];
}) {
  return {
    kind: "XVI_GIT_OPERATION_PLAN" as const,
    policyVersion: XVI_GIT_ADAPTER_POLICY.policyVersion,
    operation: input.operation,
    worktreeId: input.identity.worktreeId,
    worktreePath: input.identity.worktreePath,
    branch: input.identity.branch,
    baseCommitSha: input.identity.baseCommitSha,
    executable: "git" as const,
    args: input.args,
    readOnly: true as const,
    networkAllowed: false as const,
    credentialAccessAllowed: false as const,
    remoteMutationAllowed: false as const,
    mergeAllowed: false as const,
    pushAllowed: false as const,
    deployAllowed: false as const,
    destructiveResetAllowed: false as const,
  };
}

export function createXviGitOperationPlan(input: {
  identity: Readonly<XviGitWorktreeIdentity>;
  operation: XviGitReadOperation;
}): Readonly<XviGitOperationPlan> {
  assertIdentity(input.identity);

  if (
    !XVI_GIT_ADAPTER_POLICY.allowedOperations.includes(
      input.operation,
    )
  ) {
    refuse("operation is not allowlisted");
  }

  const args = argsFor(input.operation);
  const body = canonicalPlanBody({
    identity: input.identity,
    operation: input.operation,
    args,
  });

  const planDigest = createHash("sha256")
    .update(JSON.stringify(body), "utf8")
    .digest("hex");

  return Object.freeze({
    ...body,
    planDigest,
  });
}

export function verifyXviGitOperationPlan(
  plan: Readonly<XviGitOperationPlan>,
): true {
  assertIdentity(plan);

  if (
    !XVI_GIT_ADAPTER_POLICY.allowedOperations.includes(
      plan.operation,
    )
  ) {
    refuse("operation is not allowlisted");
  }

  const expectedArgs = argsFor(plan.operation);

  if (
    plan.executable !== "git" ||
    JSON.stringify(plan.args) !== JSON.stringify(expectedArgs)
  ) {
    refuse("command shape does not match fixed allowlist");
  }

  if (
    plan.readOnly !== true ||
    plan.networkAllowed !== false ||
    plan.credentialAccessAllowed !== false ||
    plan.remoteMutationAllowed !== false ||
    plan.mergeAllowed !== false ||
    plan.pushAllowed !== false ||
    plan.deployAllowed !== false ||
    plan.destructiveResetAllowed !== false
  ) {
    refuse("authority flags violate read-only policy");
  }

  const body = canonicalPlanBody({
    identity: plan,
    operation: plan.operation,
    args: expectedArgs,
  });

  const expectedDigest = createHash("sha256")
    .update(JSON.stringify(body), "utf8")
    .digest("hex");

  if (plan.planDigest !== expectedDigest) {
    refuse("plan digest mismatch");
  }

  return true;
}

export function assertXviGitObservedIdentity(input: {
  plan: Readonly<XviGitOperationPlan>;
  observedHeadSha: string;
  observedBranch: string;
}): true {
  verifyXviGitOperationPlan(input.plan);

  if (input.observedHeadSha !== input.plan.baseCommitSha) {
    refuse("observed HEAD does not match assignment base");
  }

  if (input.observedBranch !== input.plan.branch) {
    refuse("observed branch does not match assignment");
  }

  return true;
}
