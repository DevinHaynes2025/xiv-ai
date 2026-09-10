export type DefenseRole = 'SENSOR' | 'ANOMALY_ANALYST' | 'MALWARE_SCANNER' | 'POLICY_GUARD' | 'QUARANTINE_COORDINATOR' | 'RECOVERY_REVIEWER' | 'INCIDENT_COMMANDER';

export interface DefenseAgent {
  id: string;
  role: DefenseRole;
  tenantId: string;
  logical: true;
  authority: 'OBSERVE' | 'RECOMMEND' | 'QUARANTINE_PREAPPROVED';
  evidenceRefs: string[];
}

export interface DefenseIncident {
  incidentId: string;
  tenantId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: string[];
  evidenceRefs: string[];
  containmentRecommended: boolean;
  humanApprovalRequired: boolean;
}

export function buildDefenseSwarm(tenantId: string, desiredLogicalAgents = 64): DefenseAgent[] {
  if (!tenantId) throw new Error('tenantId required');
  const count = Math.min(Math.max(desiredLogicalAgents, 7), 10000);
  const roles: DefenseRole[] = ['SENSOR','ANOMALY_ANALYST','MALWARE_SCANNER','POLICY_GUARD','QUARANTINE_COORDINATOR','RECOVERY_REVIEWER','INCIDENT_COMMANDER'];
  return Array.from({ length: count }, (_, i) => ({
    id: `defense:${tenantId}:${i + 1}`,
    role: roles[i % roles.length],
    tenantId,
    logical: true as const,
    authority: roles[i % roles.length] === 'QUARANTINE_COORDINATOR' ? 'QUARANTINE_PREAPPROVED' : 'RECOMMEND',
    evidenceRefs: [],
  }));
}

export const DEFENSE_SWARM_GUARDRAILS = {
  defensiveOnly: true,
  counterIntrusionAllowed: false,
  credentialTheftAllowed: false,
  destructiveActionsAllowed: false,
  containmentMustBeReversible: true,
  criticalResponseRequiresHumanApproval: true,
  logicalScaleTargetNotActiveProcessClaim: true,
};
