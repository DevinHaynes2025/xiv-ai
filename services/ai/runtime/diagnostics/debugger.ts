import { createId, nowIso } from '../actions';
import type { XivAgentId } from '../agents';
import { evaluateCircuitBreaker } from './circuit-breaker';
import type { CircuitSignal, DebuggerAction, DebuggerFindingKind, DebuggerProhibited } from './types';

export const AGENT_DEBUGGER_PROHIBITED: readonly DebuggerProhibited[] = [
  'rewrite_production_code',
  'deploy',
  'modify_rls',
  'rotate_credentials',
  'disable_security_controls',
  'unrestricted_shell',
];

export const AGENT_DEBUGGER_ALLOWED: readonly DebuggerAction[] = [
  'inspect',
  'classify',
  'recommend',
  'isolate',
  'request_human_review',
];

export type AgentDebuggerFinding = {
  findingId: string;
  agentId: XivAgentId | 'unknown';
  kind: DebuggerFindingKind;
  action: DebuggerAction;
  isolated: boolean;
  createdAt: string;
  canDeploy: false;
  canExecuteShell: false;
  canModifyRls: false;
  canRotateCredentials: false;
};

export function inspectAgentFailure(input: {
  agentId: XivAgentId | 'unknown';
  kind: DebuggerFindingKind;
  signals?: readonly CircuitSignal[];
}): AgentDebuggerFinding {
  const isolate = input.kind === 'repeated_failure' || input.kind === 'loop' || input.kind === 'authorization_failure';
  if (isolate && input.signals?.length) {
    evaluateCircuitBreaker({ agentId: input.agentId, signals: input.signals });
  }
  return {
    findingId: createId('dbg'),
    agentId: input.agentId,
    kind: input.kind,
    action: isolate ? 'isolate' : 'classify',
    isolated: isolate,
    createdAt: nowIso(),
    canDeploy: false,
    canExecuteShell: false,
    canModifyRls: false,
    canRotateCredentials: false,
  };
}

export function agentDebuggerCanDeploy() {
  return false;
}

export function agentDebuggerCanExecuteShell() {
  return false;
}

export function requestDebuggerAction(action: string) {
  if ((AGENT_DEBUGGER_PROHIBITED as readonly string[]).includes(action)) {
    return {
      allowed: false as const,
      reason: `AgentDebugger may not ${action.replaceAll('_', ' ')}.`,
    };
  }
  if ((AGENT_DEBUGGER_ALLOWED as readonly string[]).includes(action)) {
    return { allowed: true as const, reason: `AgentDebugger may ${action.replaceAll('_', ' ')}.` };
  }
  return { allowed: false as const, reason: 'Unknown debugger action is denied.' };
}
