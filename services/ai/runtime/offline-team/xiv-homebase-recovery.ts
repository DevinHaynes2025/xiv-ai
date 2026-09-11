export interface HomebaseCheckpoint {
  checkpointId: string;
  tenantId: string;
  createdAt: string;
  stateHash: string;
  approvedLessons: string[];
  evidenceRefs: string[];
  productionSafe: boolean;
}

export interface RecoveryRequest {
  tenantId: string;
  failedExperimentId: string;
  checkpoint: HomebaseCheckpoint;
  reason: string;
}

export function canRecoverToHomebase(request: RecoveryRequest): boolean {
  return Boolean(
    request.tenantId &&
    request.reason &&
    request.checkpoint.tenantId === request.tenantId &&
    request.checkpoint.stateHash &&
    request.checkpoint.evidenceRefs.length > 0
  );
}

export const homebaseGuardrails = {
  checkpointBeforeExperiment: true,
  rollbackBeforeRetry: true,
  approvedLessonsOnly: true,
  noSilentSelfRewrite: true,
};
