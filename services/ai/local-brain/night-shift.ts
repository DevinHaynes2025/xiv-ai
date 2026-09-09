import { appendLearning } from './learning-ledger';
import type { MeshAgentRole } from './agent-mesh';
import { openMeetingRoom, runMeetingRoomRound } from './meeting-rooms';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';

export type NightShiftTask = {
  id: string;
  objective: string;
  roles: MeshAgentRole[];
  maxRounds?: number;
  approved: boolean;
  tenantId?: string;
  universeId?: string;
};

export type NightShiftReport = {
  startedAt: string;
  completedAt: string;
  runId: string;
  resumed: boolean;
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

export type NightShiftCheckpoint = {
  runId: string;
  startedAt: string;
  completedTaskIds: string[];
  blockedUnapprovedIds: string[];
  results: NightShiftReport['results'];
  state: 'running' | 'completed' | 'paused';
};

const MAX_TASKS = 8;
const DEFAULT_ROLES: MeshAgentRole[] = ['architect', 'coder', 'tester', 'security', 'evidence_verifier'];

function checkpointPath(root: string) {
  return xivLocalPath(root, 'night-shift.json');
}

export async function loadNightShiftCheckpoint(root = process.cwd()) {
  return readJsonFile<NightShiftCheckpoint | null>(checkpointPath(root), null);
}

function upsertResult(results: NightShiftReport['results'], entry: NightShiftReport['results'][number]) {
  const index = results.findIndex((item) => item.taskId === entry.taskId);
  if (index >= 0) results[index] = entry;
  else results.push(entry);
}

export async function runNightShift(
  tasks: NightShiftTask[],
  options?: { root?: string; resume?: boolean },
): Promise<NightShiftReport> {
  const root = options?.root ?? process.cwd();
  const prior = options?.resume ? await loadNightShiftCheckpoint(root) : null;
  const startedAt = prior?.startedAt ?? new Date().toISOString();
  const runId = prior?.runId ?? `night_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const completed = new Set(prior?.completedTaskIds ?? []);
  const blockedUnapproved = new Set(prior?.blockedUnapprovedIds ?? []);
  const results: NightShiftReport['results'] = [...(prior?.results ?? [])];

  const checkpoint: NightShiftCheckpoint = {
    runId,
    startedAt,
    completedTaskIds: [...completed],
    blockedUnapprovedIds: [...blockedUnapproved],
    results,
    state: 'running',
  };

  for (const task of tasks.slice(0, MAX_TASKS)) {
    if (completed.has(task.id) || blockedUnapproved.has(task.id)) continue;
    if (!task.approved) {
      const blocked = { taskId: task.id, status: 'blocked' as const, summary: 'Task was not pre-approved for Night Shift.' };
      upsertResult(results, blocked);
      blockedUnapproved.add(task.id);
      checkpoint.blockedUnapprovedIds = [...blockedUnapproved];
      checkpoint.results = results;
      await writeJsonFileAtomic(checkpointPath(root), checkpoint);
      continue;
    }

    const tenantId = task.tenantId ?? 'local';
    const universeId = task.universeId ?? 'local';
    const roles = task.roles.length ? task.roles : DEFAULT_ROLES;
    const room = await openMeetingRoom({
      tenantId,
      universeId,
      objective: task.objective,
      roles,
      maxRounds: task.maxRounds ?? 2,
      root,
    });

    try {
      let current = room;
      while (current.state === 'open' && current.roundsCompleted < current.maxRounds) {
        current = await runMeetingRoomRound({
          roomId: room.id,
          tenantId,
          universeId,
          root,
        });
      }
      if (current.state === 'unavailable') {
        upsertResult(results, {
          taskId: task.id,
          status: 'blocked',
          summary: current.messages.at(-1)?.content ?? 'Night Shift meeting became UNAVAILABLE; will retry on resume.',
          meetingId: room.id,
        });
        checkpoint.results = results;
        await writeJsonFileAtomic(checkpointPath(root), checkpoint);
        continue;
      }
      const final = current.messages.at(-1)?.content ?? 'Meeting completed without a final message.';
      upsertResult(results, { taskId: task.id, status: 'completed', summary: final.slice(0, 2_000), meetingId: room.id });
      completed.add(task.id);
      checkpoint.completedTaskIds = [...completed];
      checkpoint.results = results;
      await appendLearning({
        domain: 'technology',
        subject: `night-shift:${task.id}`,
        claimState: 'MODEL_INFERENCE',
        summary: final.slice(0, 2_000),
        sourceRefs: current.knowledgeRefs,
        evidence: current.messages.map((message) => message.id),
        taskId: task.id,
        meetingId: room.id,
      }, root);
      await writeJsonFileAtomic(checkpointPath(root), checkpoint);
    } catch (error) {
      upsertResult(results, {
        taskId: task.id,
        status: 'blocked',
        summary: `Night Shift stopped safely: ${(error as Error).message}`,
        meetingId: room.id,
      });
      checkpoint.results = results;
      await writeJsonFileAtomic(checkpointPath(root), checkpoint);
    }
  }

  checkpoint.state = 'completed';
  await writeJsonFileAtomic(checkpointPath(root), checkpoint);

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    runId,
    resumed: Boolean(prior),
    tasksAttempted: results.length,
    tasksCompleted: results.filter((result) => result.status === 'completed').length,
    tasksBlocked: results.filter((result) => result.status === 'blocked').length,
    productionDeployments: 0,
    permissionExpansions: 0,
    results,
  };
}
