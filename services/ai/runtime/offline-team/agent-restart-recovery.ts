export type RecoverableAgentStatus = 'IDLE' | 'WORKING' | 'PAUSED' | 'FAILED' | 'RECOVERING';

export interface PersistedAgentState {
  tenantId: string;
  agentId: string;
  checkpointId: string;
  memoryNamespace: string;
  status: RecoverableAgentStatus;
  queue: string[];
  lastHeartbeatAt: string;
  stateHash: string;
}

export interface RestartRecoveryResult {
  agentId: string;
  restored: boolean;
  resumedStatus: 'IDLE' | 'PAUSED' | 'RECOVERING';
  reason: string;
}

export function recoverAgentAfterRestart(state: PersistedAgentState): RestartRecoveryResult {
  if (!state.tenantId || !state.agentId || !state.checkpointId || !state.stateHash) {
    return { agentId: state.agentId, restored: false, resumedStatus: 'PAUSED', reason: 'missing-recovery-evidence' };
  }
  if (state.status === 'FAILED') {
    return { agentId: state.agentId, restored: true, resumedStatus: 'RECOVERING', reason: 'return-to-homebase-checkpoint' };
  }
  return { agentId: state.agentId, restored: true, resumedStatus: 'PAUSED', reason: 'human-or-supervisor-resume-required' };
}
