import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { runDebriefRecoveryCycle, type DebriefRecord } from './debrief-recovery';

export type ScheduledDebrief = {
  id: string;
  tenantId: string;
  universeId: string;
  storyId: string;
  intervalMs: number;
  nextRunAt: string;
  lastRunAt?: string;
  enabled: boolean;
};

type ScheduleStore = { items: ScheduledDebrief[] };

function schedulePath(root: string) {
  return xivLocalPath(root, 'debrief-schedule.json');
}

export async function scheduleDebriefCycle(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  intervalMs: number;
  now?: number;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.storyId) throw new Error('DEBRIEF_SCHEDULE_SCOPE_REQUIRED');
  const intervalMs = Math.max(1_000, input.intervalMs);
  const now = input.now ?? Date.now();
  const item: ScheduledDebrief = {
    id: `sched_${input.storyId}_${now.toString(36)}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    intervalMs,
    nextRunAt: new Date(now + intervalMs).toISOString(),
    enabled: true,
  };
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<ScheduleStore>(schedulePath(root), { items: [] });
  const items = Array.isArray(store.items) ? store.items : [];
  items.push(item);
  await writeJsonFileAtomic(schedulePath(root), { items: items.slice(-500) });
  return item;
}

export async function tickScheduledDebriefs(input: {
  tenantId: string;
  universeId: string;
  now?: number;
  root?: string;
  accomplishments?: string[];
  failures?: string[];
}) {
  const root = input.root ?? process.cwd();
  const now = input.now ?? Date.now();
  const store = await readJsonFile<ScheduleStore>(schedulePath(root), { items: [] });
  const items = Array.isArray(store.items) ? store.items : [];
  const due = items.filter((item) =>
    item.enabled &&
    item.tenantId === input.tenantId &&
    item.universeId === input.universeId &&
    Date.parse(item.nextRunAt) <= now,
  );

  const ran: DebriefRecord[] = [];
  for (const item of due) {
    const cycle = await runDebriefRecoveryCycle({
      tenantId: item.tenantId,
      universeId: item.universeId,
      storyId: item.storyId,
      taskId: `sched_${item.id}`,
      accomplishments: input.accomplishments ?? ['Scheduled transit checkpoint'],
      failures: input.failures ?? [],
      assumptions: ['Cloud partition remains closed until verified'],
      resourceUse: { modelCalls: 0, residentAgents: 0, notes: 'scheduled debrief' },
      lessons: ['Return learning to Global Brain after each transit cycle.'],
      nextPriorities: ['Keep local/offline routing preferred', 'Inspect dead letters before retry'],
      root,
    });
    ran.push(cycle.record);
    item.lastRunAt = new Date(now).toISOString();
    item.nextRunAt = new Date(now + item.intervalMs).toISOString();
  }
  await writeJsonFileAtomic(schedulePath(root), { items });
  return { due: due.length, ran, productionAuthorization: false as const };
}
