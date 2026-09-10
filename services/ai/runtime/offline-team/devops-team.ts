export type DevOpsRole = 'BUILD_ENGINEER' | 'RELEASE_ENGINEER' | 'CI_REVIEWER' | 'OBSERVABILITY_ENGINEER' | 'SRE_ANALYST' | 'CONFIG_REVIEWER';

export interface DevOpsAssignment {
  assignmentId: string;
  tenantId: string;
  role: DevOpsRole;
  objective: string;
  environment: 'LOCAL' | 'CLOUD_SANDBOX';
  evidenceRefs: readonly string[];
  productionMutationAllowed: false;
  state: 'READY' | 'WAITING_EVIDENCE' | 'BLOCKED';
}

export const DEVOPS_TEAM_GUARDRAILS = {
  localFirst: true,
  productionDeployAllowed: false,
  secretsInLogsAllowed: false,
  destructiveInfrastructureActionAllowed: false,
  cloudSandboxRequiresEvidence: true,
} as const;

export function createDevOpsAssignment(input: Omit<DevOpsAssignment, 'productionMutationAllowed' | 'state'>): DevOpsAssignment {
  const blockedCloud = input.environment === 'CLOUD_SANDBOX' && input.evidenceRefs.length === 0;
  return Object.freeze({
    ...input,
    productionMutationAllowed: false,
    state: blockedCloud ? 'WAITING_EVIDENCE' : 'READY',
  });
}
