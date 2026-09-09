import { randomUUID } from 'node:crypto';

import { decisionGate, type ConsequenceClass } from './decision-gate';

export const TWIN_FORBIDDEN_ACTIONS = [
  'fabricate_founder_approval',
  'sign_contract',
  'spend_money',
  'hire',
  'fire',
  'impersonate_founder_external',
] as const;

export type TwinForbiddenAction = (typeof TWIN_FORBIDDEN_ACTIONS)[number];

export type FounderDigitalTwin = {
  id: string;
  founderId: string;
  tenantId: string;
  universeId: string;
  displayName: string;
  authority: 'SIMULATED_ONLY';
  realFounderRemainsAuthority: true;
  canFabricateApproval: false;
  canSignContracts: false;
  canSpendMoney: false;
  canHireOrFire: false;
  canImpersonateFounderExternally: false;
  productionAuthorization: false;
  createdAt: string;
};

export type TwinActInput = {
  twin: FounderDigitalTwin;
  action: string;
  kind?: TwinForbiddenAction | 'recommend' | 'draft' | 'route' | 'simulate_decision';
  consequence?: ConsequenceClass;
  production?: boolean;
  financialCommitment?: boolean;
  legalCommitment?: boolean;
  permissionChange?: boolean;
  externalPublication?: boolean;
  impersonateFounderExternally?: boolean;
};

export type TwinActResult = {
  allowed: boolean;
  executableByAgent: false;
  founderApprovalFabricated: false;
  humanApprovalRequired: true;
  reason: string;
  recommendation: string | null;
  productionAuthorization: false;
};

const twins = new Map<string, FounderDigitalTwin>();

function isForbidden(kind: TwinActInput['kind'], action: string, impersonate?: boolean): TwinForbiddenAction | null {
  if (impersonate) return 'impersonate_founder_external';
  if (kind && (TWIN_FORBIDDEN_ACTIONS as readonly string[]).includes(kind)) {
    return kind as TwinForbiddenAction;
  }
  const needle = action.toLowerCase();
  if (/\b(approve as founder|fabricate.{0,12}approval|forged approval)\b/.test(needle)) return 'fabricate_founder_approval';
  if (/\b(sign(s|ed|ing)? (the )?contract|execute the agreement)\b/.test(needle)) return 'sign_contract';
  if (/\b(spend|wire|pay|purchase|budget commit)\b/.test(needle) && /\b(money|usd|funds|invoice)\b/.test(needle)) return 'spend_money';
  if (/\b(hire|offer letter|onboard employee)\b/.test(needle)) return 'hire';
  if (/\b(fire|terminate employment|dismiss employee)\b/.test(needle)) return 'fire';
  if (/\b(impersonate|act as the founder externally|send as founder)\b/.test(needle)) return 'impersonate_founder_external';
  return null;
}

export function resetFounderDigitalTwins() {
  twins.clear();
}

export function getFounderDigitalTwin(id: string) {
  return twins.get(id) ?? null;
}

export function createFounderDigitalTwin(input: {
  founderId: string;
  tenantId: string;
  universeId: string;
  displayName?: string;
}): FounderDigitalTwin {
  if (!input.founderId || !input.tenantId || !input.universeId) {
    throw new Error('FOUNDER_TWIN_SCOPE_REQUIRED');
  }
  const twin: FounderDigitalTwin = {
    id: `twin_${randomUUID()}`,
    founderId: input.founderId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    displayName: input.displayName ?? `Founder Digital Twin (${input.founderId})`,
    authority: 'SIMULATED_ONLY',
    realFounderRemainsAuthority: true,
    canFabricateApproval: false,
    canSignContracts: false,
    canSpendMoney: false,
    canHireOrFire: false,
    canImpersonateFounderExternally: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  twins.set(twin.id, twin);
  return twin;
}

export function twinAct(input: TwinActInput): TwinActResult {
  if (input.twin.tenantId === '' || input.twin.universeId === '') {
    return {
      allowed: false,
      executableByAgent: false,
      founderApprovalFabricated: false,
      humanApprovalRequired: true,
      reason: 'Digital Twin requires tenant and Universe scope.',
      recommendation: null,
      productionAuthorization: false,
    };
  }

  const forbidden = isForbidden(input.kind, input.action, input.impersonateFounderExternally);
  if (forbidden) {
    return {
      allowed: false,
      executableByAgent: false,
      founderApprovalFabricated: false,
      humanApprovalRequired: true,
      reason: `Digital Twin cannot ${forbidden.replaceAll('_', ' ')}. Real founder remains authority.`,
      recommendation: null,
      productionAuthorization: false,
    };
  }

  const gate = decisionGate({
    id: `twin_gate_${input.twin.id}`,
    action: input.action,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: input.financialCommitment === true,
    legalCommitment: input.legalCommitment === true,
    permissionChange: input.permissionChange === true,
    externalPublication: input.externalPublication === true,
  });

  return {
    allowed: true,
    executableByAgent: false,
    founderApprovalFabricated: false,
    humanApprovalRequired: true,
    reason: `${gate.reason} Twin output is a simulated recommendation only; it is not founder approval.`,
    recommendation: `SIMULATED: ${input.action.trim()}`,
    productionAuthorization: false,
  };
}
