export type SecurityHealth = 'HEALTHY' | 'ATTENTION' | 'DEGRADED' | 'INCIDENT' | 'UNVERIFIED';

export interface SecurityControlStatus {
  controlId: string;
  label: string;
  state: SecurityHealth;
  evidenceRefs: string[];
  userActionRequired: boolean;
}

export interface SecurityCommandCenterView {
  tenantId: string;
  userId: string;
  overall: SecurityHealth;
  controls: SecurityControlStatus[];
  activeDefensiveAgents: number;
  quarantinedItems: number;
  lastVerifiedAt?: string;
  emergencyStopAvailable: boolean;
}

export function composeSecurityCommandCenter(input: SecurityCommandCenterView): SecurityCommandCenterView {
  if (!input.tenantId || !input.userId) throw new Error('tenantId and userId required');
  if (input.controls.some(c => c.state !== 'UNVERIFIED' && !c.evidenceRefs.length)) throw new Error('verified security states require evidence');
  return { ...input, emergencyStopAvailable: true };
}

export const SECURITY_COMMAND_CENTER_GUARDRAILS = {
  defensiveOnly: true,
  noCounterIntrusion: true,
  evidenceRequiredForVerifiedState: true,
  quarantineAndRollbackPreferred: true,
  userVisibleEmergencyStop: true,
  noRawSecretsInClientView: true,
};
