export type OrchestratorCriteria = {
  task: string;
  department: string;
  capability: string;
  evidenceNeed: boolean;
  securityLevel: string;
  dataClassification: string;
  tenantId: string;
  universeId: string;
  cost?: string;
  latency?: string;
};

export function selectSpecialists(input: OrchestratorCriteria & { authorized: boolean }): { allowed: boolean; reason?: string; agents: readonly string[] } {
  if (!input.authorized) {
    return { allowed: false, reason: 'never_select_around_authorization_boundaries', agents: [] };
  }
  return { allowed: true, agents: [input.department] };
}

export function orchestratorMayBypassAuthorization(): false {
  return false;
}
