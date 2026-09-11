export type ConsultantRole = 'PRODUCT' | 'ENGINEERING' | 'DATA' | 'SECURITY' | 'UX' | 'SUPPLY_CHAIN' | 'FINANCE' | 'LEGAL' | 'TECHNICAL_WRITER';

export interface ConsultantMission {
  missionId: string;
  tenantId: string;
  roles: ConsultantRole[];
  evidenceRefs: string[];
  requiresHumanApproval: boolean;
  simulationOnly: boolean;
}

export function validateConsultantMission(mission: ConsultantMission): string[] {
  const errors: string[] = [];
  if (mission.roles.length < 2 || mission.roles.length > 8) errors.push('R&D councils require 2-8 roles');
  if (mission.evidenceRefs.length === 0) errors.push('evidence required');
  if (!mission.requiresHumanApproval) errors.push('human approval required for consequential outputs');
  return errors;
}

export const rdConsultantPolicy = {
  preserveDissent: true,
  externalAdviceIsNotTruth: true,
  financeCannotMoveMoney: true,
  legalAgentIsSupportNotLicensedCounsel: true,
};
