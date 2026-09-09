import { randomUUID } from 'node:crypto';

import {
  BK_LOCKS,
  DB_CANDIDATE_NOT_APPLIED,
  type CodingMeshEnvironmentId,
  type ExecutionContractStatus,
} from './superbrain-coexistence-types';

/**
 * Cross-Platform Execution Contracts — typed evidence/status return and
 * integration-candidate gating. DB candidates remain NOT_APPLIED.
 */

export type WorkcellResultArtifact = {
  workcellId: string;
  agentId: string;
  environmentId: CodingMeshEnvironmentId;
  filesTouched: string[];
  testsPassed: boolean;
  evidenceRefs: string[];
  codeSummary: string;
  collectedAt: string;
  reconciled: boolean;
  integrationCandidate: boolean;
};

export type CrossPlatformExecutionContract = {
  id: string;
  version: '62L-BK-1';
  status: ExecutionContractStatus;
  at: string;
  artifact: WorkcellResultArtifact | null;
  reason: string;
  honesty: {
    documentedEqImplemented: false;
    implementedEqVerified: false;
    verifiedEqProductionAuthorized: false;
    l4AutonomyEnabled: false;
    productionAuthorization: false;
    tipLand: false;
    draftPr: false;
    dbCandidateApplied: false;
    dbCandidateState: typeof DB_CANDIDATE_NOT_APPLIED;
    branchIsNotProductionDeploy: true;
    workcellIsNotProductionDeploy: true;
    recommendationIsNotCharge: true;
    learningIsNotPermissionGrant: true;
  };
  evidenceRefs: string[];
};

export function sealExecutionContract(input: {
  status: ExecutionContractStatus;
  artifact: WorkcellResultArtifact | null;
  reason: string;
  evidenceRefs?: string[];
}): CrossPlatformExecutionContract {
  const artifact = input.artifact
    ? {
        ...input.artifact,
        // Enforce: without reconcile flag, never integration candidate
        integrationCandidate:
          input.status === 'INTEGRATION_CANDIDATE' &&
          input.artifact.reconciled === true &&
          input.artifact.integrationCandidate === true,
      }
    : null;

  let status = input.status;
  if (status === 'INTEGRATION_CANDIDATE') {
    if (!artifact || !artifact.reconciled || !artifact.integrationCandidate) {
      status = 'NOT_INTEGRATION_CANDIDATE';
    }
  }

  return {
    id: randomUUID(),
    version: '62L-BK-1',
    status,
    at: new Date().toISOString(),
    artifact,
    reason: input.reason,
    honesty: {
      documentedEqImplemented: false,
      implementedEqVerified: false,
      verifiedEqProductionAuthorized: false,
      l4AutonomyEnabled: BK_LOCKS.L4_AUTONOMY_ENABLED,
      productionAuthorization: BK_LOCKS.PRODUCTION_AUTHORIZATION,
      tipLand: BK_LOCKS.TIP_LAND,
      draftPr: BK_LOCKS.DRAFT_PR,
      dbCandidateApplied: false,
      dbCandidateState: DB_CANDIDATE_NOT_APPLIED,
      branchIsNotProductionDeploy: true,
      workcellIsNotProductionDeploy: true,
      recommendationIsNotCharge: true,
      learningIsNotPermissionGrant: true,
    },
    evidenceRefs: input.evidenceRefs ?? artifact?.evidenceRefs ?? [],
  };
}

export function contractAllowsIntegrationCandidate(
  contract: CrossPlatformExecutionContract,
): boolean {
  return (
    contract.status === 'INTEGRATION_CANDIDATE' &&
    contract.artifact?.reconciled === true &&
    contract.artifact?.integrationCandidate === true &&
    contract.honesty.productionAuthorization === false &&
    contract.honesty.dbCandidateApplied === false
  );
}

export function executionContractHonesty() {
  return {
    locks: BK_LOCKS,
    dbCandidateNotApplied: DB_CANDIDATE_NOT_APPLIED,
    statuses: [
      'AVAILABLE',
      'UNAVAILABLE',
      'WAITING_DATA',
      'DENIED',
      'COLLECTED',
      'RECONCILED',
      'INTEGRATION_CANDIDATE',
      'NOT_INTEGRATION_CANDIDATE',
    ] as const,
  };
}
