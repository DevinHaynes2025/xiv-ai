import {
  createXviCodingAgentAssignment,
  type XviCodingAgentAssignment,
  type XviCodingAgentEvidence,
  type XviCodingAgentRole,
} from "./xvi-coding-agent-contract";

export interface XviCodingMission {
  readonly missionId: string;
  readonly baseCommitSha: string;
  readonly assignments: readonly Readonly<XviCodingAgentAssignment>[];
  readonly integrationReady: boolean;
  readonly humanApprovalRequired: true;
  readonly automaticMergeAllowed: false;
  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;
}

const ROLES: readonly XviCodingAgentRole[] =
  Object.freeze(["BUILDER", "TESTER", "REVIEWER", "SECURITY"]);

export function createXviCodingMission(input: {
  missionId: string;
  baseCommitSha: string;
  permittedPaths: readonly string[];
  prohibitedPaths?: readonly string[];
  allowedTestCommands?: readonly string[];
}): Readonly<XviCodingMission> {
  const assignments = ROLES.map(role =>
    createXviCodingAgentAssignment({
      taskId: `${input.missionId}.${role.toLowerCase()}`,
      role,
      baseCommitSha: input.baseCommitSha,
      worktreeId: `${input.missionId}.${role.toLowerCase()}`,
      permittedPaths: input.permittedPaths,
      prohibitedPaths: input.prohibitedPaths,
      allowedTestCommands: input.allowedTestCommands,
    }),
  );

  return Object.freeze({
    missionId: input.missionId,
    baseCommitSha: input.baseCommitSha,
    assignments: Object.freeze(assignments),
    integrationReady: false,
    humanApprovalRequired: true,
    automaticMergeAllowed: false,
    automaticPushAllowed: false,
    automaticDeployAllowed: false,
  });
}

export function assessXviCodingMission(input: {
  mission: Readonly<XviCodingMission>;
  evidence: readonly Readonly<XviCodingAgentEvidence>[];
}): Readonly<XviCodingMission> {
  const byRole = new Map<XviCodingAgentRole, Readonly<XviCodingAgentEvidence>>();

  for (const item of input.evidence) {
    if (item.baseCommitSha !== input.mission.baseCommitSha) throw new Error("coding evidence base commit mismatch");
    if (byRole.has(item.role)) throw new Error(`duplicate coding evidence for role ${item.role}`);
    byRole.set(item.role, item);
  }

  for (const role of ROLES) {
    if (!byRole.has(role)) return Object.freeze({ ...input.mission, integrationReady: false });
  }

  const builder = byRole.get("BUILDER");
  const tester = byRole.get("TESTER");
  const reviewer = byRole.get("REVIEWER");
  const security = byRole.get("SECURITY");
  if (!builder || !tester || !reviewer || !security) throw new Error("role reconciliation failed");

  const expected = {
    BUILDER: `${input.mission.missionId}.builder`,
    TESTER: `${input.mission.missionId}.tester`,
    REVIEWER: `${input.mission.missionId}.reviewer`,
    SECURITY: `${input.mission.missionId}.security`,
  } as const;

  for (const [role, evidence] of byRole) {
    if (evidence.taskId !== expected[role]) throw new Error("coding evidence mission binding mismatch");
  }

  const blocked =
    !builder.testPassed || !tester.testPassed || !reviewer.testPassed || !security.testPassed ||
    reviewer.findings.length > 0 || security.findings.length > 0;

  return Object.freeze({
    ...input.mission,
    integrationReady: !blocked,
    humanApprovalRequired: true,
    automaticMergeAllowed: false,
    automaticPushAllowed: false,
    automaticDeployAllowed: false,
  });
}
