export type WorkRole = 'VIRTUAL_COO' | 'PRODUCT' | 'ENGINEERING' | 'DATA' | 'SECURITY' | 'FINANCE' | 'SUPPLY_CHAIN' | 'QA' | 'UX';
export interface StrategicTask {
  taskId: string;
  tenantId: string;
  title: string;
  ownerRole: WorkRole;
  status: 'QUEUED' | 'ACTIVE' | 'BLOCKED' | 'DONE';
  priority: 1 | 2 | 3 | 4 | 5;
  evidenceRefs: string[];
}

export interface AgentMeeting {
  meetingId: string;
  tenantId: string;
  objective: string;
  roles: WorkRole[];
  evidenceRefs: string[];
  decisionRequiresHumanApproval: boolean;
}

export class TeamTaskMeetingOrchestrator {
  private tasks = new Map<string, StrategicTask>();

  assign(task: StrategicTask) {
    if (!task.tenantId || !task.title) throw new Error('tenant/title required');
    this.tasks.set(task.taskId, task);
  }

  activeTasks(tenantId: string) {
    return [...this.tasks.values()].filter(t => t.tenantId === tenantId && t.status === 'ACTIVE').slice(0, 8);
  }

  validateMeeting(meeting: AgentMeeting) {
    if (meeting.roles.length < 2 || meeting.roles.length > 8) throw new Error('meetings require 2-8 active roles');
    if (!meeting.evidenceRefs.length) throw new Error('meeting evidence required');
    return true;
  }
}

export const TEAM_OPS_GUARDRAILS = {
  maxConcurrentActiveAgents: 8,
  decisionsNeedEvidence: true,
  productionMutationRequiresHumanApproval: true,
  virtualCOOIsAdvisoryCoordinator: true,
};
