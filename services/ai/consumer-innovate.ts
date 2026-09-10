/**
 * US-CON-01 — Consumer innovate / early access loop.
 * Named consumer identity (separate from employee anonymous-alias model).
 * Structured idea proposals into Universe + organization (tenant) scope.
 * Ideas are proposals only — never production mutations. L4 remains false.
 * WAITING_DATA when persistence unbound / durable table unavailable.
 * Never fabricate acceptance metrics or durable rows.
 */

import { isAgentPersistenceBound } from './persistence';

export const CONSUMER_INNOVATE_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  ideasAreProposals: true as const,
  requiresApproval: true as const,
  identityModel: 'named_consumer_handle' as const,
  distinctFromEmployeeAnonymous: true as const,
  label: 'CONSUMER_IDEA_PROPOSAL',
} as const;

export type ConsumerIdeaCategory =
  | 'feature'
  | 'early_access'
  | 'experience'
  | 'accessibility'
  | 'other';

export type ConsumerIdeaStage = 'proposal' | 'early_access_interest';

export type ConsumerIdeaPayload = {
  title: string;
  body: string;
  category: ConsumerIdeaCategory;
  stage: ConsumerIdeaStage;
  /** Named consumer handle — not employee anonymous alias. */
  consumerHandle: string;
  universeId: string;
  organizationId: string;
  /** Explicit: ideas do not mutate production systems. */
  proposalOnly: true;
};

export type ConsumerIdeaRecord = {
  id: string;
  submittedAt: string;
  persona: 'consumer';
  payload: ConsumerIdeaPayload;
  source: 'session_memory' | 'persistence_bound';
  /** Honest: no fabricated acceptance/metrics. */
  acceptanceMetrics: 'WAITING_DATA' | 'UNBOUND';
};

export type ConsumerInnovateChannel = {
  status: 'READY' | 'WAITING_DATA';
  persistenceBound: boolean;
  l4Autonomy: false;
  ideasAreProposals: true;
  productionMutation: false;
  identityModel: 'named_consumer_handle';
  ideas: ConsumerIdeaRecord[];
  note: string;
  /** Never invent funnel/acceptance numbers. */
  acceptanceMetrics: 'WAITING_DATA';
};

export type ConsumerInnovatePersistence = {
  insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string } | null }>;
};

const HANDLE_PREFIXES = ['Spark', 'Vista', 'Pulse', 'Orbit', 'Nova'] as const;

const globalStore = globalThis as typeof globalThis & {
  __xivConsumerInnovateStore?: ConsumerIdeaRecord[];
  __xivConsumerInnovatePersistence?: ConsumerInnovatePersistence;
};

function store(): ConsumerIdeaRecord[] {
  if (!globalStore.__xivConsumerInnovateStore) {
    globalStore.__xivConsumerInnovateStore = [];
  }
  return globalStore.__xivConsumerInnovateStore;
}

/**
 * Deterministic named consumer handle — separate prefix set from employee anonymousAlias.
 * Preferred handle (from consumer profile) wins when safe; else derived from userId.
 */
export function consumerHandleFromIdentity(input: {
  userId: string;
  preferredHandle?: string | null;
}): string {
  const preferred = (input.preferredHandle ?? '').trim();
  if (preferred) {
    const cleaned = preferred
      .replace(/[^A-Za-z0-9 _.-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 32);
    if (cleaned.length >= 2) return cleaned;
  }
  if (!input.userId) return 'Spark-00';
  let hash = 0;
  for (let index = 0; index < input.userId.length; index += 1) {
    hash = (hash * 31 + input.userId.charCodeAt(index)) >>> 0;
  }
  // Offset hash so consumer handles do not collide with employee alias shapes casually.
  hash = (hash ^ 0xc01a5) >>> 0;
  const prefix = HANDLE_PREFIXES[hash % HANDLE_PREFIXES.length];
  const letter = String.fromCharCode(65 + (hash % 26));
  const code = String((hash % 90) + 10).padStart(2, '0');
  return `${prefix}-${letter}${code}`;
}

export function bindConsumerInnovatePersistence(next: ConsumerInnovatePersistence | null) {
  globalStore.__xivConsumerInnovatePersistence = next ?? undefined;
}

export function isConsumerInnovatePersistenceBound(): boolean {
  return Boolean(globalStore.__xivConsumerInnovatePersistence);
}

export function isConsumerInnovateDurableBound(): boolean {
  return isConsumerInnovatePersistenceBound() || isAgentPersistenceBound();
}

export function resetConsumerInnovateSessionStore() {
  globalStore.__xivConsumerInnovateStore = [];
}

function sanitizeCategory(value: unknown): ConsumerIdeaCategory {
  if (
    value === 'feature' ||
    value === 'early_access' ||
    value === 'experience' ||
    value === 'accessibility' ||
    value === 'other'
  ) {
    return value;
  }
  return 'other';
}

function sanitizeStage(value: unknown): ConsumerIdeaStage {
  if (value === 'early_access_interest') return 'early_access_interest';
  return 'proposal';
}

export function buildConsumerIdeaPayload(input: {
  userId: string;
  preferredHandle?: string | null;
  title: string;
  body: string;
  category: ConsumerIdeaCategory | string;
  stage?: ConsumerIdeaStage | string;
  universeId: string;
  organizationId: string;
}): ConsumerIdeaPayload {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new Error('consumer_idea_title_required');
  if (!body) throw new Error('consumer_idea_body_required');
  if (!input.universeId.trim()) throw new Error('consumer_idea_universe_required');
  if (!input.organizationId.trim()) throw new Error('consumer_idea_organization_required');

  return {
    title,
    body,
    category: sanitizeCategory(input.category),
    stage: sanitizeStage(input.stage),
    consumerHandle: consumerHandleFromIdentity({
      userId: input.userId,
      preferredHandle: input.preferredHandle,
    }),
    universeId: input.universeId.trim(),
    organizationId: input.organizationId.trim(),
    proposalOnly: true,
  };
}

export async function submitConsumerIdea(input: {
  userId: string;
  preferredHandle?: string | null;
  title: string;
  body: string;
  category: ConsumerIdeaCategory | string;
  stage?: ConsumerIdeaStage | string;
  universeId: string;
  organizationId: string;
}): Promise<ConsumerIdeaRecord> {
  const payload = buildConsumerIdeaPayload(input);
  const durableBound = isConsumerInnovateDurableBound();
  const record: ConsumerIdeaRecord = {
    id: `con_idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    submittedAt: new Date().toISOString(),
    persona: 'consumer',
    payload,
    source: durableBound ? 'persistence_bound' : 'session_memory',
    acceptanceMetrics: durableBound ? 'WAITING_DATA' : 'UNBOUND',
  };

  store().unshift(record);

  const client = globalStore.__xivConsumerInnovatePersistence;
  if (client) {
    const row = {
      id: record.id,
      organization_id: payload.organizationId,
      universe_id: payload.universeId,
      consumer_handle: payload.consumerHandle,
      title: payload.title,
      body: payload.body,
      category: payload.category,
      stage: payload.stage,
      persona: 'consumer',
      proposal_only: true,
      production_mutation: false,
      created_at: record.submittedAt,
    };
    const result = await client.insert(row);
    if (result.error) {
      record.source = 'session_memory';
      record.acceptanceMetrics = 'UNBOUND';
    }
  }

  return record;
}

export function listConsumerInnovateChannel(input?: {
  universeId?: string;
  organizationId?: string;
}): ConsumerInnovateChannel {
  const durableBound = isConsumerInnovateDurableBound();
  let ideas = store().slice();
  if (input?.universeId) {
    ideas = ideas.filter((item) => item.payload.universeId === input.universeId);
  }
  if (input?.organizationId) {
    ideas = ideas.filter((item) => item.payload.organizationId === input.organizationId);
  }

  for (const item of ideas) {
    if (item.payload.proposalOnly !== true) {
      throw new Error('consumer_idea_must_be_proposal');
    }
    if (item.persona !== 'consumer') {
      throw new Error('consumer_idea_persona_mismatch');
    }
  }

  const hasAny = ideas.length > 0;
  const status: ConsumerInnovateChannel['status'] =
    !durableBound && !hasAny ? 'WAITING_DATA' : hasAny || durableBound ? 'READY' : 'WAITING_DATA';

  let note: string;
  if (!durableBound) {
    note = hasAny
      ? 'WAITING_DATA for durable xiv_consumer_ideas (Universe RLS) — showing in-memory session proposals only. Persistence client not bound. Acceptance metrics not fabricated.'
      : 'WAITING_DATA — no consumer ideas yet and innovate persistence is not bound. Proposals and acceptance metrics are not fabricated.';
  } else if (!hasAny) {
    note =
      'Persistence bound. No session proposals yet — durable rows appear after submit when xiv_consumer_ideas + RLS are applied. Acceptance metrics remain WAITING_DATA until a real metrics source binds.';
  } else {
    note =
      'Named consumer proposals in session memory; durable writes target Universe-scoped xiv_consumer_ideas when schema is live. Ideas are proposals only (not production changes). Acceptance metrics: WAITING_DATA.';
  }

  return {
    status,
    persistenceBound: durableBound,
    l4Autonomy: false,
    ideasAreProposals: true,
    productionMutation: false,
    identityModel: 'named_consumer_handle',
    ideas,
    note,
    acceptanceMetrics: 'WAITING_DATA',
  };
}

export function consumerInnovateAllowsL4(): false {
  return false;
}

export function consumerIdeaAllowsProductionMutation(): false {
  return false;
}
