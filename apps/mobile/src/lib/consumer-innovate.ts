import {
  bindConsumerInnovatePersistence,
  listConsumerInnovateChannel,
  submitConsumerIdea,
  type ConsumerIdeaCategory,
  type ConsumerIdeaStage,
  type ConsumerInnovateChannel,
  type ConsumerIdeaRecord,
} from '@/lib/ai';
import { diagnoseAuthStage } from '@/lib/diagnostics';
import { supabase } from '@/lib/supabase';

/**
 * US-CON-01 — mobile durable helper for consumer innovate / early access ideas.
 * Targets Universe-scoped xiv_consumer_ideas when present.
 * Named consumer identity (not employee anonymous alias).
 * Honest WAITING_DATA when schema/auth unavailable. Never fabricates rows or acceptance metrics.
 */

export type ConsumerInnovateLoadError = {
  kind: 'missing_schema' | 'unauthorized' | 'unknown';
  code: string;
  message: string;
  hint: string;
};

export type ConsumerInnovateDurableListResult = {
  ideas: Array<{
    id: string;
    consumer_handle: string;
    title: string;
    body: string;
    category: string;
    stage: string;
    universe_id: string;
    organization_id: string;
    created_at: string;
  }>;
  error: ConsumerInnovateLoadError | null;
  status: 'READY' | 'WAITING_DATA';
  acceptanceMetrics: 'WAITING_DATA';
};

const TABLE = 'xiv_consumer_ideas';
const COLUMNS =
  'id, consumer_handle, title, body, category, stage, universe_id, organization_id, created_at';

const SCHEMA_HINT =
  'Apply a Universe-scoped xiv_consumer_ideas table with RLS (organization_id + universe_id membership). Until then durable ideas stay WAITING_DATA — session memory only. Proposals and acceptance metrics are not invented.';

let bound = false;

function classifyError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): ConsumerInnovateLoadError {
  const code = error.code ?? 'unknown';
  const message = [error.message, error.details, error.hint].filter(Boolean).join(' — ') || 'consumer_innovate:load_failed';
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
      hint: 'Sign in with a consumer Universe membership. Ideas use the authenticated session only — no service-role key.',
    };
  }
  return {
    kind: 'unknown',
    code,
    message,
    hint: 'Query targets tenant-scoped consumer ideas (RLS). No sample proposals or acceptance metrics are substituted.',
  };
}

export function bindMobileConsumerInnovatePersistence() {
  if (bound) return;
  bindConsumerInnovatePersistence({
    async insert(row) {
      const { error } = await supabase.from(TABLE).insert(row);
      return { error };
    },
  });
  bound = true;
}

bindMobileConsumerInnovatePersistence();

export async function listDurableConsumerIdeas(input?: {
  universeId?: string;
  organizationId?: string;
}): Promise<ConsumerInnovateDurableListResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    diagnoseAuthStage('consumer_innovate:no_user', {
      code: userError?.code,
      message: userError?.message,
    });
    return {
      ideas: [],
      error: {
        kind: 'unauthorized',
        code: userError?.code ?? 'no_user',
        message: userError?.message ?? 'No authenticated user.',
        hint: 'Sign in to load Universe-scoped consumer idea proposals for your membership.',
      },
      status: 'WAITING_DATA',
      acceptanceMetrics: 'WAITING_DATA',
    };
  }

  let query = supabase.from(TABLE).select(COLUMNS).order('created_at', { ascending: false }).limit(80);
  if (input?.universeId) query = query.eq('universe_id', input.universeId);
  if (input?.organizationId) query = query.eq('organization_id', input.organizationId);

  const { data, error } = await query;
  if (error) {
    const classified = classifyError(error);
    diagnoseAuthStage('consumer_innovate:load_failed', {
      code: classified.code,
      message: classified.message,
      hint: classified.hint,
    });
    return { ideas: [], error: classified, status: 'WAITING_DATA', acceptanceMetrics: 'WAITING_DATA' };
  }

  const ideas = (data ?? [])
    .map((row) => {
      if (typeof row.id !== 'string') return null;
      return {
        id: row.id,
        consumer_handle: typeof row.consumer_handle === 'string' ? row.consumer_handle : '',
        title: typeof row.title === 'string' ? row.title : '',
        body: typeof row.body === 'string' ? row.body : '',
        category: typeof row.category === 'string' ? row.category : 'other',
        stage: typeof row.stage === 'string' ? row.stage : 'proposal',
        universe_id: typeof row.universe_id === 'string' ? row.universe_id : '',
        organization_id: typeof row.organization_id === 'string' ? row.organization_id : '',
        created_at: typeof row.created_at === 'string' ? row.created_at : '',
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return { ideas, error: null, status: 'READY', acceptanceMetrics: 'WAITING_DATA' };
}

export async function submitConsumerInnovateIdea(input: {
  userId: string;
  preferredHandle?: string | null;
  title: string;
  body: string;
  category: ConsumerIdeaCategory | string;
  stage?: ConsumerIdeaStage | string;
  universeId: string;
  organizationId: string;
}): Promise<{ record: ConsumerIdeaRecord; channel: ConsumerInnovateChannel }> {
  const record = await submitConsumerIdea(input);
  const channel = listConsumerInnovateChannel({
    universeId: input.universeId,
    organizationId: input.organizationId,
  });
  return { record, channel };
}

export function sessionConsumerInnovateChannel(input?: {
  universeId?: string;
  organizationId?: string;
}): ConsumerInnovateChannel {
  return listConsumerInnovateChannel(input);
}
