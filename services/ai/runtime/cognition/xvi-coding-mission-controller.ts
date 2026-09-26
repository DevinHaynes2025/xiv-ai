import { createHash } from "node:crypto";

import {
  createXviCodingAgentEvidence,
  type XviCodingAgentEvidence,
  type XviCodingAgentRole,
} from "./xvi-coding-agent-contract";
import {
  assessXviCodingMission,
  createXviCodingMission,
  type XviCodingMission,
} from "./xvi-coding-agent-orchestrator";
import {
  activateXviCodingWorktree,
  createXviCodingWorktreeRecord,
  markXviCodingWorktreeReadyForHumanReview,
  submitXviCodingEvidence,
  verifyXviCodingWorktree,
  type XviCodingWorktreeRecord,
} from "./xvi-coding-worktree-lifecycle";
import {
  createXviGitOperationPlan,
  type XviGitOperationPlan,
  type XviGitWorktreeIdentity,
} from "./xvi-git-worktree-adapter";

const ROLES = Object.freeze([
  "BUILDER",
  "TESTER",
  "REVIEWER",
  "SECURITY",
] as const);

export interface XviCodingMissionControllerEnvelope {
  readonly kind: "XVI_CODING_MISSION_CONTROLLER_ENVELOPE";
  readonly controllerVersion: "xvi-coding-mission-controller-v1";
  readonly mission: Readonly<XviCodingMission>;
  readonly worktrees: readonly Readonly<XviCodingWorktreeRecord>[];
  readonly gitPlans: readonly Readonly<XviGitOperationPlan>[];
  readonly evidence: readonly Readonly<XviCodingAgentEvidence>[];
  readonly state:
    | "CREATED"
    | "ACTIVE"
    | "EVIDENCE_PENDING"
    | "BLOCKED"
    | "READY_FOR_HUMAN_REVIEW";
  readonly humanApprovalRequired: true;
  readonly automaticMergeAllowed: false;
  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;
  readonly credentialAccessAllowed: false;
  readonly productionMutationAllowed: false;
  readonly envelopeDigest: string;
}

function refuse(reason: string): never {
  throw new Error(`XVI_CODING_MISSION_CONTROLLER_REFUSED: ${reason}`);
}

function canonicalBody(input: {
  mission: Readonly<XviCodingMission>;
  worktrees: readonly Readonly<XviCodingWorktreeRecord>[];
  gitPlans: readonly Readonly<XviGitOperationPlan>[];
  evidence: readonly Readonly<XviCodingAgentEvidence>[];
  state: XviCodingMissionControllerEnvelope["state"];
}) {
  return {
    kind: "XVI_CODING_MISSION_CONTROLLER_ENVELOPE" as const,
    controllerVersion: "xvi-coding-mission-controller-v1" as const,
    mission: input.mission,
    worktrees: input.worktrees,
    gitPlans: input.gitPlans,
    evidence: input.evidence,
    state: input.state,
    humanApprovalRequired: true as const,
    automaticMergeAllowed: false as const,
    automaticPushAllowed: false as const,
    automaticDeployAllowed: false as const,
    credentialAccessAllowed: false as const,
    productionMutationAllowed: false as const,
  };
}

function seal(
  body: ReturnType<typeof canonicalBody>,
): Readonly<XviCodingMissionControllerEnvelope> {
  const envelopeDigest = createHash("sha256")
    .update(JSON.stringify(body), "utf8")
    .digest("hex");

  return Object.freeze({
    ...body,
    worktrees: Object.freeze([...body.worktrees]),
    gitPlans: Object.freeze([...body.gitPlans]),
    evidence: Object.freeze([...body.evidence]),
    envelopeDigest,
  });
}

function assignmentFor(
  mission: Readonly<XviCodingMission>,
  role: XviCodingAgentRole,
) {
  const assignment = mission.assignments.find(item => item.role === role);
  if (!assignment) refuse(`assignment missing for ${role}`);
  return assignment;
}

export function createXviCodingMissionController(input: {
  missionId: string;
  baseCommitSha: string;
  permittedPaths: readonly string[];
  prohibitedPaths?: readonly string[];
  allowedTestCommands?: readonly string[];
  worktreePathForRole: Readonly<Record<XviCodingAgentRole, string>>;
  branchForRole: Readonly<Record<XviCodingAgentRole, string>>;
}): Readonly<XviCodingMissionControllerEnvelope> {
  const mission = createXviCodingMission({
    missionId: input.missionId,
    baseCommitSha: input.baseCommitSha,
    permittedPaths: input.permittedPaths,
    prohibitedPaths: input.prohibitedPaths,
    allowedTestCommands: input.allowedTestCommands,
  });

  const worktrees = ROLES.map(role =>
    createXviCodingWorktreeRecord(assignmentFor(mission, role)),
  );

  const gitPlans = ROLES.flatMap(role => {
    const assignment = assignmentFor(mission, role);
    const identity: Readonly<XviGitWorktreeIdentity> = Object.freeze({
      worktreeId: assignment.worktreeId,
      worktreePath: input.worktreePathForRole[role],
      branch: input.branchForRole[role],
      baseCommitSha: assignment.baseCommitSha,
    });

    return [
      createXviGitOperationPlan({
        identity,
        operation: "REV_PARSE_HEAD",
      }),
      createXviGitOperationPlan({
        identity,
        operation: "STATUS_SHORT",
      }),
    ];
  });

  return seal(canonicalBody({
    mission,
    worktrees,
    gitPlans,
    evidence: [],
    state: "CREATED",
  }));
}

export function activateXviCodingMissionController(input: {
  envelope: Readonly<XviCodingMissionControllerEnvelope>;
  nowMs: number;
}): Readonly<XviCodingMissionControllerEnvelope> {
  if (input.envelope.state !== "CREATED") {
    refuse("only CREATED mission may activate");
  }

  const worktrees = input.envelope.worktrees.map(record =>
    activateXviCodingWorktree({
      record,
      nowMs: input.nowMs,
    }),
  );

  return seal(canonicalBody({
    mission: input.envelope.mission,
    worktrees,
    gitPlans: input.envelope.gitPlans,
    evidence: input.envelope.evidence,
    state: "ACTIVE",
  }));
}

export function submitXviCodingMissionRoleEvidence(input: {
  envelope: Readonly<XviCodingMissionControllerEnvelope>;
  role: XviCodingAgentRole;
  changedPaths?: readonly string[];
  testCommands?: readonly string[];
  testPassed: boolean;
  findings?: readonly string[];
  submittedAtMs: number;
  currentHeadSha: string;
}): Readonly<XviCodingMissionControllerEnvelope> {
  if (
    input.envelope.state !== "ACTIVE" &&
    input.envelope.state !== "EVIDENCE_PENDING"
  ) {
    refuse("mission is not accepting evidence");
  }

  if (input.envelope.evidence.some(item => item.role === input.role)) {
    refuse(`duplicate evidence for ${input.role}`);
  }

  const assignment = assignmentFor(input.envelope.mission, input.role);
  const evidence = createXviCodingAgentEvidence({
    assignment,
    changedPaths: input.changedPaths,
    testCommands: input.testCommands,
    testPassed: input.testPassed,
    findings: input.findings,
    submittedAtMs: input.submittedAtMs,
  });

  const worktrees = input.envelope.worktrees.map(record => {
    if (record.role !== input.role) return record;

    const submitted = submitXviCodingEvidence({
      record,
      evidence,
      currentHeadSha: input.currentHeadSha,
    });

    return verifyXviCodingWorktree({
      record: submitted,
      accepted: evidence.testPassed,
      blockingFindings: evidence.findings,
    });
  });

  const evidenceSet = Object.freeze([
    ...input.envelope.evidence,
    evidence,
  ]);

  const blocked = worktrees.some(record => record.state === "BLOCKED");

  return seal(canonicalBody({
    mission: input.envelope.mission,
    worktrees,
    gitPlans: input.envelope.gitPlans,
    evidence: evidenceSet,
    state: blocked ? "BLOCKED" : "EVIDENCE_PENDING",
  }));
}

export function reconcileXviCodingMissionController(
  envelope: Readonly<XviCodingMissionControllerEnvelope>,
): Readonly<XviCodingMissionControllerEnvelope> {
  if (envelope.state === "BLOCKED") return envelope;

  if (envelope.evidence.length !== ROLES.length) {
    refuse("all four role evidence records are required");
  }

  const assessed = assessXviCodingMission({
    mission: envelope.mission,
    evidence: envelope.evidence,
  });

  if (!assessed.integrationReady) {
    return seal(canonicalBody({
      mission: assessed,
      worktrees: envelope.worktrees,
      gitPlans: envelope.gitPlans,
      evidence: envelope.evidence,
      state: "BLOCKED",
    }));
  }

  const worktrees = envelope.worktrees.map(record => {
    if (record.state !== "VERIFIED") {
      refuse(`role ${record.role} is not VERIFIED`);
    }
    return markXviCodingWorktreeReadyForHumanReview(record);
  });

  return seal(canonicalBody({
    mission: assessed,
    worktrees,
    gitPlans: envelope.gitPlans,
    evidence: envelope.evidence,
    state: "READY_FOR_HUMAN_REVIEW",
  }));
}
