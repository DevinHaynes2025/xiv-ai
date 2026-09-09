export type TaskForceId = 'SUPPLY_DISRUPTION' | 'GLOBAL_EXPANSION';

export type TaskForceParticipant = { agentId: string; permissionsGrantedByTaskForce: false };

export type AgentTaskForce = {
  taskForceId: TaskForceId;
  participants: readonly TaskForceParticipant[];
  grantsPermissions: false;
  chatbotOnly: false;
};

export function conveneTaskForce(taskForceId: TaskForceId, agentIds: readonly string[]): AgentTaskForce {
  return {
    taskForceId,
    participants: agentIds.map((agentId) => ({ agentId, permissionsGrantedByTaskForce: false })),
    grantsPermissions: false,
    chatbotOnly: false,
  };
}

export function taskForceGrantsPermissions(_force: AgentTaskForce): false {
  return false;
}
