export type DmaicPhase = 'DEFINE' | 'MEASURE' | 'ANALYZE' | 'IMPROVE' | 'CONTROL';

export interface DebugExperiment {
  experimentId: string;
  tenantId: string;
  phase: DmaicPhase;
  hypothesis: string;
  baselineMetric?: number;
  observedMetric?: number;
  evidenceRefs: string[];
  sandboxOnly: boolean;
  approvedForPromotion: boolean;
}

export function evaluateExperiment(exp: DebugExperiment): 'LEARN' | 'PROMOTE' | 'ROLLBACK' {
  if (!exp.sandboxOnly || exp.evidenceRefs.length === 0) return 'ROLLBACK';
  if (exp.phase !== 'CONTROL') return 'LEARN';
  if (exp.approvedForPromotion && exp.observedMetric !== undefined && exp.baselineMetric !== undefined && exp.observedMetric >= exp.baselineMetric) return 'PROMOTE';
  return 'ROLLBACK';
}

export const leanGuardrails = {
  failFastInSandbox: true,
  productionMutationAllowed: false,
  evidenceBeforeLearning: true,
  humanApprovalBeforePromotion: true,
};
