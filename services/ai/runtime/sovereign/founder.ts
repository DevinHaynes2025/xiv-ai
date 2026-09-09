import { requestAgentSelfPromotion, requestAgentSelfToolGrant } from '../everywhere/cyber';
import { evaluateDataAccess } from '../premium/data';
import { defaultDenyUnknownHandoff } from '../security/firewall';
import { learningMayRewriteSecurityOrProductionPolicy } from '../knowledge/loop';

export const FOUNDER_TWIN_LABEL = 'XIV Founder Twin — AI representation of Devin Xavier Haynes';

export type FounderIdentity = {
  legalName: 'Devin Xavier Haynes';
  role: 'Founder / CEO / Co-Founder';
  organization: 'XIV AI';
  realPerson: true;
};

export type FounderAuthorityPolicy = {
  unrestrictedSuperuser: false;
  requiresPasskey: true;
  requiresTrustedDevice: true;
  requiresStepUp: true;
  requiresHumanConfirmation: true;
  auditRequired: true;
};

export type FounderKnowledge = { source: string; approved: boolean };
export type FounderPrinciple = { text: string; documented: true };
export type FounderDecision = { decisionId: string; realFounder: true };
export type FounderTwinInstance = {
  instanceId: string;
  ephemeral: true;
  expandsPermissions: false;
};
export type FounderTwinReport = { recommendations: readonly string[]; executes: false };

export type FounderTwin = {
  label: typeof FOUNDER_TWIN_LABEL;
  actualFounder: false;
  actualAuthority: false;
  mayGrantSelfPermissions: false;
  mayDisableGuardian: false;
};

export const REAL_FOUNDER: FounderIdentity = {
  legalName: 'Devin Xavier Haynes',
  role: 'Founder / CEO / Co-Founder',
  organization: 'XIV AI',
  realPerson: true,
};

export const FOUNDER_AUTHORITY_POLICY: FounderAuthorityPolicy = {
  unrestrictedSuperuser: false,
  requiresPasskey: true,
  requiresTrustedDevice: true,
  requiresStepUp: true,
  requiresHumanConfirmation: true,
  auditRequired: true,
};

export function openFounderTwin(): FounderTwin {
  return {
    label: FOUNDER_TWIN_LABEL,
    actualFounder: false,
    actualAuthority: false,
    mayGrantSelfPermissions: false,
    mayDisableGuardian: false,
  };
}

export function founderTwinIsRealFounderAuthority(_twin: FounderTwin): false {
  return false;
}

export function founderTwinGrantsSelfPermissions(): boolean {
  return (
    requestAgentSelfPromotion({
      agentId: 'founder-twin',
      claimedRole: 'Guardian',
      requestedAuthority: 'L4',
    }).allowed ||
    requestAgentSelfToolGrant({ agentId: 'founder-twin', toolId: 'guardian.disable' }).allowed
  );
}

export function founderTwinDisablesGuardian(): boolean {
  void defaultDenyUnknownHandoff();
  return learningMayRewriteSecurityOrProductionPolicy();
}

export function founderTwinExposesCustomerPrivateData(): boolean {
  return evaluateDataAccess({
    agent: 'Graph',
    tenantId: 'customer-a',
    requestedTenantId: 'founder-twin',
    classification: 'TENANT_PRIVATE',
    destination: 'global_brain',
    viaGateway: false,
    rawSecretRequested: true,
    destructiveMigration: false,
  }).allowed;
}

export function spawnFounderTwinInstance(task: string): FounderTwinInstance {
  return { instanceId: `founder-instance:${task}`, ephemeral: true, expandsPermissions: false };
}

export function parallelFounderInstancesExpandPermissions(_instances: readonly FounderTwinInstance[]): false {
  return false;
}

export function founderTwinMayChangeOwnership(): false {
  return false;
}

export function founderTwinMayIssueCredentials(): false {
  return false;
}

export function founderTwinMayAlterAudit(): false {
  return false;
}

export function founderTwinMayWeakenTenantIsolation(): false {
  return false;
}

export function founderTwinMayDeployUnrestrictedAgents(): false {
  return false;
}
