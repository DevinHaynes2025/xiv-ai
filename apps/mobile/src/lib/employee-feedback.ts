import {
  bindEmployeeFeedbackPersistence,
  listEmployeeFeedbackChannel,
  submitEmployeeFeedback,
  type EmployeeFeedbackCategory,
  type EmployeeFeedbackChannel,
  type EmployeeFeedbackRecord,
} from '@/lib/ai';
import { diagnoseAuthStage } from '@/lib/diagnostics';
import { supabase } from '@/lib/supabase';

/**
 * US-EMP-01 — mobile durable helper for anonymous employee feedback.
 * Targets Universe-scoped xiv_employee_feedback when present.
 * Honest WAITING_DATA when schema/auth unavailable. Never fabricates rows.
 * Payload is alias-only (no displayName / legal name).
 */

export type EmployeeFeedbackLoadError = {
  kind: 'missing_schema' | 'unauthorized' | 'unknown';
  code: string;
  message: string;
  hint: string;
};

export type EmployeeFeedbackDurableListResult = {
  submissions: Array<{
    id: string;
    alias: string;
    category: string;
    body: string;
    universe_id: string;
    organization_id: string;
    created_at: string;
  }>;
  error: EmployeeFeedbackLoadError | null;
  status: 'READY' | 'WAITING_DATA';
};

const TABLE = 'xiv_employee_feedback';
const COLUMNS = 'id, alias, category, body, universe_id, organization_id, created_at';

const SCHEMA_HINT =
  "Apply a Universe-scoped xiv_employee_feedback table with RLS (organization_id + universe_id membership). Until then durable feedback stays WAITING_DATA — session memory only. Submissions are not invented.";

let bound = false;

function classifyError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): EmployeeFeedbackLoadError {
  const code = error.code ?? 'unknown';
  const message = [error.message, error.details, error.hint].filter(Boolean).join(' — ') || 'employee_feedback:load_failed';
  const missing =
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    code === '42P01' ||
    /could not find the table/i.test(message) ||
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
      hint: 'Sign in with an employee Universe membership. Feedback uses the authenticated session only — no service-role key.',
    };
  }
  return {
    kind: 'unknown',
    code,
    message,
    hint: 'Query targets tenant-scoped feedback (RLS). No sample submissions are substituted.',
  };
}

export function bindMobileEmployeeFeedbackPersistence() {
  if (bound) return;
  bindEmployeeFeedbackPersistence({
    async insert(row) {
      const { error } = await supabase.from(TABLE).insert(row);
      return { error };
    },
  });
  bound = true;
}

bindMobileEmployeeFeedbackPersistence();

export async function listDurableEmployeeFeedback(input?: {
  universeId?: string;
  organizationId?: string;
}): Promise<EmployeeFeedbackDurableListResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    diagnoseAuthStage('employee_feedback:no_user', {
      code: userError?.code,
      message: userError?.message,
    });
    return {
      submissions: [],
      error: {
        kind: 'unauthorized',
        code: userError?.code ?? 'no_user',
        message: userError?.message ?? 'No authenticated user.',
        hint: 'Sign in to load Universe-scoped anonymous feedback for your membership.',
      },
      status: 'WAITING_DATA',
    };
  }

  let query = supabase.from(TABLE).select(COLUMNS).order('created_at', { ascending: false }).limit(80);
  if (input?.universeId) query = query.eq('universe_id', input.universeId);
  if (input?.organizationId) query = query.eq('organization_id', input.organizationId);

  const { data, error } = await query;
  if (error) {
    const classified = classifyError(error);
    diagnoseAuthStage('employee_feedback:load_failed', {
      code: classified.code,
      message: classified.message,
      hint: classified.hint,
    });
    return { submissions: [], error: classified, status: 'WAITING_DATA' };
  }

  const submissions = (data ?? [])
    .map((row) => {
      if (typeof row.id !== 'string') return null;
      // Defense: drop any accidental identity fields from row mapping.
      return {
        id: row.id,
        alias: typeof row.alias === 'string' ? row.alias : '',
        category: typeof row.category === 'string' ? row.category : 'other',
        body: typeof row.body === 'string' ? row.body : '',
        universe_id: typeof row.universe_id === 'string' ? row.universe_id : '',
        organization_id: typeof row.organization_id === 'string' ? row.organization_id : '',
        created_at: typeof row.created_at === 'string' ? row.created_at : '',
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return { submissions, error: null, status: 'READY' };
}

export async function submitAnonymousEmployeeFeedback(input: {
  userId: string;
  category: EmployeeFeedbackCategory | string;
  body: string;
  universeId: string;
  organizationId: string;
  /** Must not be forwarded into payload — accepted only to prove strip. */
  displayName?: string;
  legalName?: string;
}): Promise<{ record: EmployeeFeedbackRecord; channel: EmployeeFeedbackChannel }> {
  const record = await submitEmployeeFeedback({
    userId: input.userId,
    category: input.category,
    body: input.body,
    universeId: input.universeId,
    organizationId: input.organizationId,
    displayName: input.displayName,
    legalName: input.legalName,
  });
  const channel = listEmployeeFeedbackChannel({
    universeId: input.universeId,
    organizationId: input.organizationId,
  });
  return { record, channel };
}

export function sessionEmployeeFeedbackChannel(input?: {
  universeId?: string;
  organizationId?: string;
}): EmployeeFeedbackChannel {
  return listEmployeeFeedbackChannel(input);
}
