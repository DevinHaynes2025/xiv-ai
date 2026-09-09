import { appendLearning } from './learning-ledger';
import { createMeeting, runLocalMeeting, type MeshAgentRole } from './agent-mesh';

export type NightShiftTask = {
  id: string;
  objective: string;
  roles: MeshAgentRole[];
  maxRounds?: number;
  approved: boolean;
};

export type NightShiftReport = {
  startedAt: string;
  completedAt: string;
  tasksAttempted: number;
  tasksCompleted: number;
  tasksBlocked: number;
  productionDeployments: 0;
  permissionExpansions: 0;
  results: Array<{
    taskId: string;
    status: 'completed' | 'blocked';
    summary: string;
    meetingId?: string;
  }>;
};

const MAX_TASKS = 8;
const DEFAULT_ROLES: MeshAgentRole[] = ['architect', 'coder', 'tester', 'security', 'evidence_verifier'];

export async function runNightShift(tasks: NightShiftTask[]): Promise<NightShiftReport> {
  const startedAt = new Date().toISOString();
  const results: NightShiftReport['results'] = [];

  for (const task of tasks.slice(0, MAX_TASKS)) {
    if (!task.approved) {
      results.push({ taskId: task.id, status: 'blocked', summary: 'Task was not pre-approved for Night Shift.' });
      continue;
    }

    const roles = task.roles.length ? task.roles : DEFAULT_ROLES;
    const meeting = createMeeting(task.objective, roles, task.maxRounds ?? 2);
    try {
      await runLocalMeeting(meeting);
      const final = meeting.messages.at(-1)?.content ?? 'Meeting completed without a final message.';
      results.push({ taskId: task.id, status: 'completed', summary: final.slice(0, 2_000), meetingId: meeting.id });
      await appendLearning({
        domain: 'technology',
        subject: `night-shift:${task.id}`,
        claimState: 'MODEL_INFERENCE',
        summary: final.slice(0, 2_000),
        sourceRefs: [],
        evidence: meeting.messages.map((message) => message.id),
        taskId: task.id,
        meetingId: meeting.id,
      });
    } catch (error) {
      results.push({
        taskId: task.id,
        status: 'blocked',
        summary: `Night Shift stopped safely: ${(error as Error).message}`,
        meetingId: meeting.id,
      });
    }
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    tasksAttempted: results.length,
    tasksCompleted: results.filter((result) => result.status === 'completed').length,
    tasksBlocked: results.filter((result) => result.status === 'blocked').length,
    productionDeployments: 0,
    permissionExpansions: 0,
    results,
  };
}
