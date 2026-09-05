import { bindAgentPersistence, type AgentPersistence, type PersistedAgentActionStatus } from '@/lib/ai';
import { diagnoseAuthStage } from '@/lib/diagnostics';
import { supabase } from '@/lib/supabase';

export type PersistedAgentAction = {
  id: string;
  agent_type: string;
  tool_id: string;
  action_type: string;
  description: string;
  risk_level: string;
  status: PersistedAgentActionStatus;
  input_payload: Record<string, unknown> | null;
  result_payload: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
};

export type AgentActivityErrorKind = 'missing_schema' | 'unauthorized' | 'unknown';

export type AgentActivityLoadError = {
  kind: AgentActivityErrorKind;
  code: string;
  message: string;
  hint: string;
};

export type AgentActivityLoadResult = {
  actions: PersistedAgentAction[];
  error: AgentActivityLoadError | null;
};

const ACTION_COLUMNS =
  'id, agent_type, tool_id, action_type, description, risk_level, status, input_payload, result_payload, created_at, completed_at';

const SCHEMA_HINT =
  "Run supabase/migrations/20260904180000_ai_agent_governance.sql in the Supabase SQL editor, then execute NOTIFY pgrst, 'reload schema'; so PostgREST reloads public.ai_agent_actions. Activity is not invented while those tables are missing.";

const adapter: AgentPersistence = {
  async insert(table, row) {
    const { error } = await supabase.from(table).insert(row);
    return { error };
  },
  async upsert(table, row, onConflict = 'id') {
    const { error } = await supabase.from(table).upsert(row, { onConflict });
    return { error };
  },
  async update(table, id, patch) {
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    return { error };
  },
};

let bound = false;

export function bindMobileAgentPersistence() {
  if (bound) return;
  bindAgentPersistence(adapter);
  bound = true;
}

bindMobileAgentPersistence();

function asStatus(value: unknown): PersistedAgentActionStatus | null {
  if (
    value === 'proposed' ||
    value === 'awaiting_approval' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'executing' ||
    value === 'completed' ||
    value === 'failed' ||
    value === 'cancelled'
  ) {
    return value;
  }
  return null;
}

function asPayload(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function classifyActivityError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): AgentActivityLoadError {
  const code = error.code ?? 'unknown';
  const message = [error.message, error.details, error.hint].filter(Boolean).join(' — ') || 'agent_activity:load_failed';
  const missing =
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    code === '42P01' ||
    /could not find the table/i.test(message) ||
    /could not find the .+ column/i.test(message) ||
    /schema cache/i.test(message) ||
    /relation .+ does not exist/i.test(message);

  if (missing) {
    return { kind: 'missing_schema', code, message, hint: SCHEMA_HINT };
  }

  if (code === 'PGRST301' || code === '42501' || code === '401' || /jwt|unauthorized|permission denied/i.test(message)) {
    return {
      kind: 'unauthorized',
      code,
      message,
      hint: 'Sign in again. Agent activity is loaded with the authenticated session only — no service-role key is used.',
    };
  }

  return {
    kind: 'unknown',
    code,
    message,
    hint: 'The query targets public.ai_agent_actions (owner-only RLS). No sample activity is substituted.',
  };
}

export async function listPersistedAgentActions(): Promise<AgentActivityLoadResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    diagnoseAuthStage('agent_activity:no_user', {
      code: userError?.code,
      message: userError?.message,
    });
    return {
      actions: [],
      error: {
        kind: 'unauthorized',
        code: userError?.code ?? 'no_user',
        message: userError?.message ?? 'No authenticated user.',
        hint: 'Sign in to load governed agent activity for your account.',
      },
    };
  }

  // Exact query: public.ai_agent_actions columns from
  // supabase/migrations/20260904180000_ai_agent_governance.sql
  // Scoped to auth.uid() via user_id + owner RLS. organization_id is nullable
  // and reserved for a future org membership table — not invented here.
  // Authenticated session only. No service-role key in the mobile client.
  const { data, error } = await supabase
    .from('ai_agent_actions')
    .select(ACTION_COLUMNS)
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) {
    const classified = classifyActivityError(error);
    diagnoseAuthStage('agent_activity:load_failed', {
      code: classified.code,
      message: classified.message,
      hint: classified.hint,
    });
    return { actions: [], error: classified };
  }

  const actions = (data ?? [])
    .map((row) => {
      const status = asStatus(row.status);
      if (!status || typeof row.id !== 'string') return null;
      return {
        id: row.id,
        agent_type: typeof row.agent_type === 'string' ? row.agent_type : '',
        tool_id: typeof row.tool_id === 'string' ? row.tool_id : '',
        action_type: typeof row.action_type === 'string' ? row.action_type : '',
        description: typeof row.description === 'string' ? row.description : '',
        risk_level: typeof row.risk_level === 'string' ? row.risk_level : '',
        status,
        input_payload: asPayload(row.input_payload),
        result_payload: asPayload(row.result_payload),
        created_at: typeof row.created_at === 'string' ? row.created_at : '',
        completed_at: typeof row.completed_at === 'string' ? row.completed_at : null,
      } satisfies PersistedAgentAction;
    })
    .filter((row): row is PersistedAgentAction => Boolean(row));

  return { actions, error: null };
}
