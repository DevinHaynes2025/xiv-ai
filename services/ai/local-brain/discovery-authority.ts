import { decisionGate, type ConsequenceClass } from './decision-gate';
import { evaluateOfflineTask } from './offline-policy';
import {
  CONSEQUENTIAL_ACTIONS,
  DISCOVERY_HONESTY,
  type ConsequentialAction,
  type EvidenceState,
} from './discovery-invention-types';

export type AuthorityDenial = {
  allowed: false;
  state: 'FAIL';
  action: ConsequentialAction;
  reason: string;
  humanApprovalRequired: true;
  productionAuthorization: false;
  l4AutonomyEnabled: false;
  inventedPass: false;
};

export function denyConsequentialAction(action: ConsequentialAction): AuthorityDenial {
  return {
    allowed: false,
    state: 'FAIL',
    action,
    reason: `Governed discovery cannot ${action.replaceAll('_', ' ')}. Pattern mining, hypotheses, and prototypes stay recommendation-only.`,
    humanApprovalRequired: true,
    productionAuthorization: false,
    l4AutonomyEnabled: false,
    inventedPass: false,
  };
}

export function denyAllConsequentialActions(): AuthorityDenial[] {
  return CONSEQUENTIAL_ACTIONS.map((action) => denyConsequentialAction(action));
}

export function gateDiscoveryAction(input: {
  action: string;
  consequence?: ConsequenceClass;
  production?: boolean;
  financialCommitment?: boolean;
  legalCommitment?: boolean;
  permissionChange?: boolean;
  grantPermission?: boolean;
  deploy?: boolean;
  spendMoney?: boolean;
  makeContract?: boolean;
  physicalControl?: boolean;
  inventPass?: boolean;
  inventCausation?: boolean;
  impersonateFounder?: boolean;
  weakenGuardianRls?: boolean;
}): { allowed: boolean; state: EvidenceState | 'DENIED'; reason: string; humanApprovalRequired: boolean } {
  if (input.inventPass) return { ...denyConsequentialAction('invent_pass'), allowed: false, state: 'FAIL' };
  if (input.inventCausation) return { ...denyConsequentialAction('invent_causation'), allowed: false, state: 'FAIL' };
  if (input.grantPermission || input.permissionChange) return { ...denyConsequentialAction('grant_permission'), allowed: false, state: 'FAIL' };
  if (input.deploy) return { ...denyConsequentialAction('deploy_production'), allowed: false, state: 'FAIL' };
  if (input.spendMoney || input.financialCommitment) return { ...denyConsequentialAction('spend_money'), allowed: false, state: 'FAIL' };
  if (input.makeContract || input.legalCommitment) return { ...denyConsequentialAction('make_contract'), allowed: false, state: 'FAIL' };
  if (input.physicalControl) return { ...denyConsequentialAction('control_physical_infrastructure'), allowed: false, state: 'FAIL' };
  if (input.impersonateFounder) return { ...denyConsequentialAction('impersonate_founder'), allowed: false, state: 'FAIL' };
  if (input.weakenGuardianRls) return { ...denyConsequentialAction('weaken_guardian_rls'), allowed: false, state: 'FAIL' };

  const gate = decisionGate({
    id: `disc-gate:${input.action}`,
    action: input.action,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  const offline = evaluateOfflineTask({
    needsInternet: false,
    needsCloudProvider: false,
    needsExternalFreshness: false,
    needsProductionWrite: input.production === true,
    needsPermissionChange: false,
    classification: 'internal',
  });
  if (!gate.executableByAgent || !offline.allowed) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: gate.reason,
      humanApprovalRequired: true,
    };
  }
  return {
    allowed: true,
    state: 'PASS',
    reason: gate.reason,
    humanApprovalRequired: gate.humanApprovalRequired,
  };
}

export function honestyLocks() {
  return { ...DISCOVERY_HONESTY };
}
