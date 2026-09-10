import { diagnoseAgentStage } from './diagnostics';
import type { AgentIntentLog, AgentMemoryRow, PersistedAgentActionStatus } from './types';

export const AGENT_TABLES = [
  'ai_agent_sessions',
  'ai_agent_messages',
  'ai_agent_actions',
  'ai_agent_approvals',
  'ai_agent_audit_events',
] as const;

export type AgentTable = (typeof AGENT_TABLES)[number];

export type AgentPersistence = {
  insert: (table: AgentTable, row: Record<string, unknown>) => Promise<{ error: { code?: string } | null }>;
  upsert: (
    table: AgentTable,
    row: Record<string, unknown>,
    onConflict?: string,
  ) => Promise<{ error: { code?: string } | null }>;
  update: (
    table: AgentTable,
    id: string,
    patch: Record<string, unknown>,
  ) => Promise<{ error: { code?: string } | null }>;
};

const EXECUTION_STATUSES = new Set<PersistedAgentActionStatus>(['executing', 'completed']);

const globalStore = globalThis as typeof globalThis & { __xivAgentPersistence?: AgentPersistence };

export function bindAgentPersistence(next: AgentPersistence | null) {
  globalStore.__xivAgentPersistence = next ?? undefined;
}

/** True when a Supabase (or test) persistence adapter is bound. Unbound ⇒ durable trail WAITING_DATA. */
export function isAgentPersistenceBound(): boolean {
  return Boolean(globalStore.__xivAgentPersistence);
}

function blocksHighRiskExecution(row: Record<string, unknown>) {
  const risk = row.risk_level;
  const status = row.status;
  return (
    (risk === 'high' || risk === 'critical') &&
    typeof status === 'string' &&
    EXECUTION_STATUSES.has(status as PersistedAgentActionStatus)
  );
}

async function write(table: AgentTable, kind: 'insert' | 'upsert', row: Record<string, unknown>, onConflict?: string) {
  const client = globalStore.__xivAgentPersistence;
  if (!client) return;
  try {
    const result = kind === 'insert' ? await client.insert(table, row) : await client.upsert(table, row, onConflict);
    if (result.error) diagnoseAgentStage(`persist:${table}:${kind}_failed`, result.error.code);
  } catch (caught) {
    diagnoseAgentStage(`persist:${table}:exception`, (caught as { code?: string }).code);
  }
}

async function writeUpdate(table: AgentTable, id: string, patch: Record<string, unknown>) {
  const client = globalStore.__xivAgentPersistence;
  if (!client) return;
  try {
    const result = await client.update(table, id, patch);
    if (result.error) diagnoseAgentStage(`persist:${table}:update_failed`, result.error.code);
  } catch (caught) {
    diagnoseAgentStage(`persist:${table}:update_exception`, (caught as { code?: string }).code);
  }
}

export async function persistAgent(_row: Record<string, unknown>) {
  return;
}

export async function persistSession(row: Record<string, unknown>) {
  await write('ai_agent_sessions', 'upsert', row, 'id');
}

export async function persistMessage(row: Record<string, unknown>) {
  await write('ai_agent_messages', 'insert', row);
}

export async function persistAction(row: Record<string, unknown>) {
  if (blocksHighRiskExecution(row)) {
    diagnoseAgentStage('persist:ai_agent_actions:high_blocked');
    return;
  }
  await write('ai_agent_actions', 'upsert', row, 'id');
}

export async function persistActionPatch(id: string, patch: Record<string, unknown>) {
  if (blocksHighRiskExecution(patch)) {
    diagnoseAgentStage('persist:ai_agent_actions:high_blocked');
    return;
  }
  await writeUpdate('ai_agent_actions', id, patch);
}

export async function persistApproval(row: Record<string, unknown>) {
  await write('ai_agent_approvals', 'insert', row);
}

export async function persistMemory(_row: AgentMemoryRow) {
  return;
}

export async function persistAudit(entry: AgentIntentLog, extras?: { sessionId?: string | null }) {
  await write('ai_agent_audit_events', 'insert', {
    id: entry.id,
    user_id: entry.userId,
    session_id: extras?.sessionId ?? null,
    action_id: entry.actionId ?? null,
    event_type: entry.kind,
    event_data: {
      agent_type: entry.agentType,
      tool_id: entry.toolId ?? null,
      risk_level: entry.riskLevel ?? null,
      note: entry.note,
    },
  });
}
