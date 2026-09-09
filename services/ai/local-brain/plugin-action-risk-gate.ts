/**
 * 62L-DP Plugin Action Risk Gate (cross-cutting) —
 * Every plugin action labeled with risk class; approval thresholds by class.
 * CONSEQUENTIAL_WRITE / EXTERNAL_ACTION require human/founder gates; cannot self-approve.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ACTION_RISK_MATRIX,
  CONSEQUENTIAL_WRITE_GATE_REQUIRED,
  EXTERNAL_ACTION_GATE_REQUIRED,
  READ_ONLY_ESCALATION_DENIED,
  SELF_APPROVE_DENIED,
  isHumanOrFounder,
  riskClassForScope,
  type ActionRiskClass,
  type DpActor,
  type PermissionScope,
} from './plugin-civilization-os-types';

export type RiskGateDecision = {
  id: string;
  pluginId: string;
  actionId: string;
  scope: PermissionScope;
  riskClass: ActionRiskClass;
  status: 'allowed' | 'denied';
  reason: string;
  humanGateSatisfied: boolean;
  at: string;
};

type Store = {
  decisions: RiskGateDecision[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'plugin-action-risk-gate.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { decisions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pluginActionRiskGateHonesty() {
  return {
    matrix: ACTION_RISK_MATRIX,
    consequentialSelfApprove: false,
    externalSelfApprove: false,
    readOnlySilentEscalation: false,
  };
}

export async function evaluateActionRisk(input: {
  pluginId: string;
  actionId: string;
  scope: PermissionScope;
  grantedScopes: PermissionScope[];
  priorRiskClass?: ActionRiskClass;
  humanGatePresent?: boolean;
  actor: DpActor;
  root: string;
}): Promise<RiskGateDecision> {
  const store = await load(input.root);
  const riskClass = riskClassForScope(input.scope);
  const matrix = ACTION_RISK_MATRIX[riskClass];
  const humanOk = input.humanGatePresent === true || isHumanOrFounder(input.actor);
  const now = new Date().toISOString();

  const deny = async (reason: string): Promise<RiskGateDecision> => {
    const decision: RiskGateDecision = {
      id: id('dprisk'),
      pluginId: input.pluginId,
      actionId: input.actionId,
      scope: input.scope,
      riskClass,
      status: 'denied',
      reason,
      humanGateSatisfied: humanOk,
      at: now,
    };
    store.decisions.push(decision);
    await save(input.root, store);
    return decision;
  };

  // Silent escalation: READ_ONLY prior cannot jump to write without explicit new scope grant
  if (
    input.priorRiskClass === 'READ_ONLY' &&
    (riskClass === 'REVERSIBLE_WRITE' ||
      riskClass === 'CONSEQUENTIAL_WRITE' ||
      riskClass === 'EXTERNAL_ACTION') &&
    !input.grantedScopes.includes(input.scope)
  ) {
    return deny(READ_ONLY_ESCALATION_DENIED);
  }

  if (!input.grantedScopes.includes(input.scope)) {
    return deny('SCOPE_NOT_GRANTED');
  }

  if (matrix.humanGateRequired && !humanOk) {
    if (riskClass === 'CONSEQUENTIAL_WRITE') return deny(CONSEQUENTIAL_WRITE_GATE_REQUIRED);
    if (riskClass === 'EXTERNAL_ACTION') return deny(EXTERNAL_ACTION_GATE_REQUIRED);
    return deny(SELF_APPROVE_DENIED);
  }

  if (!matrix.selfApproveAllowed && input.actor.kind === 'agent' && !humanOk) {
    return deny(SELF_APPROVE_DENIED);
  }

  const decision: RiskGateDecision = {
    id: id('dprisk'),
    pluginId: input.pluginId,
    actionId: input.actionId,
    scope: input.scope,
    riskClass,
    status: 'allowed',
    reason: `RISK_GATE_ALLOWED_${riskClass}`,
    humanGateSatisfied: humanOk,
    at: now,
  };
  store.decisions.push(decision);
  await save(input.root, store);
  return decision;
}
