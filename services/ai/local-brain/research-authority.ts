import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decisionGate, type ConsequenceClass } from './decision-gate';
import { evaluateOfflineTask } from './offline-policy';
import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import { cortexId } from './cortex-store';
import type { ConsequentialAction, EvidenceState } from './autonomous-research-types';
import { RESEARCH_HONESTY } from './autonomous-research-types';

const HERE = dirname(fileURLToPath(import.meta.url));

export type PredecessorId = '62L-AB' | '62L-AC' | '62L-AD' | '62L-AE' | '62L-AF' | '62L-AG' | '62L-AH' | '62L-Z';

const PREDECESSOR_FILES: Record<PredecessorId, string> = {
  '62L-AB': 'knowledge-lake.ts',
  '62L-AC': 'offline-agent-runtime.ts',
  '62L-AD': 'distributed-mesh-runtime.ts',
  '62L-AE': 'ceo-sealed-vault.ts',
  '62L-AF': 'universe-kernel.ts',
  '62L-AG': 'evaluation-harness.ts',
  '62L-AH': 'causal-world-model.ts',
  '62L-Z': 'executive-cortex.ts',
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_FILES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorMap(): Record<PredecessorId, 'AVAILABLE' | 'WAITING_DATA'> {
  return {
    '62L-AB': predecessorModuleState('62L-AB'),
    '62L-AC': predecessorModuleState('62L-AC'),
    '62L-AD': predecessorModuleState('62L-AD'),
    '62L-AE': predecessorModuleState('62L-AE'),
    '62L-AF': predecessorModuleState('62L-AF'),
    '62L-AG': predecessorModuleState('62L-AG'),
    '62L-AH': predecessorModuleState('62L-AH'),
    '62L-Z': predecessorModuleState('62L-Z'),
  };
}

export type AuthorityDenial = {
  allowed: false;
  state: 'FAIL';
  action: ConsequentialAction;
  reason: string;
  humanApprovalRequired: true;
  productionAuthorization: false;
  l4AutonomyEnabled: false;
};

export function denyConsequentialAction(action: ConsequentialAction): AuthorityDenial {
  return {
    allowed: false,
    state: 'FAIL',
    action,
    reason: `Autonomous research cannot ${action.replaceAll('_', ' ')}. Bounded offline software/data/simulation only.`,
    humanApprovalRequired: true,
    productionAuthorization: false,
    l4AutonomyEnabled: false,
  };
}

export function gateResearchAction(input: {
  action: string;
  consequence?: ConsequenceClass;
  production?: boolean;
  financialCommitment?: boolean;
  legalCommitment?: boolean;
  permissionChange?: boolean;
  externalPublication?: boolean;
  trading?: boolean;
  physicalControl?: boolean;
  grantPermission?: boolean;
  deploy?: boolean;
  spendMoney?: boolean;
  makeContract?: boolean;
  impersonateFounder?: boolean;
  weakenGuardian?: boolean;
}):
  | { allowed: true; state: 'PASS'; reason: string; gate: ReturnType<typeof decisionGate> }
  | { allowed: false; state: 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA'; reason: string; gate: ReturnType<typeof decisionGate>; denial?: AuthorityDenial } {
  if (input.grantPermission) {
    const denial = denyConsequentialAction('grant_permission');
    return { allowed: false, state: 'FAIL', reason: denial.reason, gate: decisionGate({
      id: cortexId('auth-gate'), action: input.action, consequence: 'CRITICAL', production: true,
      financialCommitment: false, legalCommitment: false, permissionChange: true, externalPublication: false,
    }), denial };
  }
  if (input.deploy) {
    const denial = denyConsequentialAction('deploy_production');
    return { allowed: false, state: 'FAIL', reason: denial.reason, gate: decisionGate({
      id: cortexId('auth-gate'), action: input.action, consequence: 'CRITICAL', production: true,
      financialCommitment: false, legalCommitment: false, permissionChange: false, externalPublication: false,
    }), denial };
  }
  if (input.spendMoney) {
    const denial = denyConsequentialAction('spend_money');
    return { allowed: false, state: 'FAIL', reason: denial.reason, gate: decisionGate({
      id: cortexId('auth-gate'), action: input.action, consequence: 'HIGH', production: false,
      financialCommitment: true, legalCommitment: false, permissionChange: false, externalPublication: false,
    }), denial };
  }
  if (input.makeContract) {
    const denial = denyConsequentialAction('make_contract');
    return { allowed: false, state: 'FAIL', reason: denial.reason, gate: decisionGate({
      id: cortexId('auth-gate'), action: input.action, consequence: 'HIGH', production: false,
      financialCommitment: false, legalCommitment: true, permissionChange: false, externalPublication: false,
    }), denial };
  }
  if (input.trading) {
    const denial = denyConsequentialAction('execute_trade');
    return { allowed: false, state: 'FAIL', reason: denial.reason, gate: decisionGate({
      id: cortexId('auth-gate'), action: input.action, consequence: 'HIGH', production: false,
      financialCommitment: true, legalCommitment: false, permissionChange: false, externalPublication: false,
    }), denial };
  }
  if (input.physicalControl) {
    const denial = denyConsequentialAction('control_physical_infrastructure');
    return { allowed: false, state: 'FAIL', reason: denial.reason, gate: decisionGate({
      id: cortexId('auth-gate'), action: input.action, consequence: 'CRITICAL', production: true,
      financialCommitment: false, legalCommitment: false, permissionChange: false, externalPublication: false,
    }), denial };
  }
  if (input.impersonateFounder) {
    const denial = denyConsequentialAction('impersonate_founder');
    return { allowed: false, state: 'FAIL', reason: denial.reason, gate: decisionGate({
      id: cortexId('auth-gate'), action: input.action, consequence: 'CRITICAL', production: false,
      financialCommitment: false, legalCommitment: false, permissionChange: false, externalPublication: true,
    }), denial };
  }
  if (input.weakenGuardian) {
    const denial = denyConsequentialAction('weaken_guardian_rls');
    return { allowed: false, state: 'FAIL', reason: denial.reason, gate: decisionGate({
      id: cortexId('auth-gate'), action: input.action, consequence: 'CRITICAL', production: true,
      financialCommitment: false, legalCommitment: false, permissionChange: true, externalPublication: false,
    }), denial };
  }

  const gate = decisionGate({
    id: cortexId('auth-gate'),
    action: input.action,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: input.financialCommitment === true,
    legalCommitment: input.legalCommitment === true,
    permissionChange: input.permissionChange === true,
    externalPublication: input.externalPublication === true,
  });
  if (!gate.executableByAgent) {
    return { allowed: false, state: 'FAIL', reason: gate.reason, gate };
  }
  return { allowed: true, state: 'PASS', reason: gate.reason, gate };
}

export function evaluateResearchOffline(input: {
  needsInternet?: boolean;
  needsCloudProvider?: boolean;
  needsExternalFreshness?: boolean;
  needsProductionWrite?: boolean;
  needsPermissionChange?: boolean;
}): { allowed: boolean; state: EvidenceState; reason: string } {
  const decision = evaluateOfflineTask({
    needsInternet: input.needsInternet === true,
    needsCloudProvider: input.needsCloudProvider === true,
    needsExternalFreshness: input.needsExternalFreshness === true,
    needsProductionWrite: input.needsProductionWrite === true,
    needsPermissionChange: input.needsPermissionChange === true,
    classification: 'internal',
  });
  if (decision.allowed) return { allowed: true, state: 'PASS', reason: decision.reason };
  const state: EvidenceState = decision.state === 'DENIED' ? 'FAIL' : decision.state;
  return { allowed: false, state, reason: decision.reason };
}

export type SealedFenceResult = {
  allowed: boolean;
  replicated: false;
  reason: string;
  ceoSealedReplicatesByDefault: false;
};

export function refuseSealedReplication(payload: unknown): SealedFenceResult {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
  const sealed = record?.sealed === true
    || record?.ordinaryMemory === false
    || record?.classification === 'sealed_founder_priority'
    || record?.classification === 'ceo_sealed'
    || (typeof record?.label === 'string' && /ceo[-_ ]sealed/i.test(record.label));
  if (sealed) {
    return {
      allowed: false,
      replicated: false,
      reason: 'CEO-sealed records are non-replicating by default and cannot enter experiment, replica, or ordinary memory.',
      ceoSealedReplicatesByDefault: false,
    };
  }
  return {
    allowed: true,
    replicated: false,
    reason: 'Payload is not CEO-sealed; ordinary research memory may store a non-secret local copy.',
    ceoSealedReplicatesByDefault: false,
  };
}

export function unconfiguredProviderStates() {
  return {
    slots: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length > 0 ? slot.state : 'UNAVAILABLE' as const,
      configured: slot.configured,
    })),
    localRuntime: getRuntime('local').state,
    honesty: RESEARCH_HONESTY,
  };
}
