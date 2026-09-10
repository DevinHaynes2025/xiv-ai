/**
 * US-EMP-01 — Anonymous employee feedback channel.
 * Alias only; no legal name / displayName leak into the feedback payload.
 * Structured submissions are Universe + organization (tenant) scoped.
 * WAITING_DATA when persistence unbound / durable table unavailable.
 * L4 remains false. Never fabricate submissions.
 */

import { isAgentPersistenceBound } from './persistence';

export const EMPLOYEE_FEEDBACK_POLICY = {
  l4Autonomy: false as const,
  storesDisplayName: false as const,
  storesLegalName: false as const,
  requiresApproval: false as const,
  productionMutation: false as const,
  label: 'ANONYMOUS_ALIAS_ONLY',
} as const;

/** Keys that must never appear on a stored feedback payload (audit contract). */
export const FORBIDDEN_FEEDBACK_IDENTITY_KEYS = [
  'displayName',
  'display_name',
  'fullName',
  'full_name',
  'legalName',
  'legal_name',
  'realName',
  'real_name',
  'name',
  'email',
  'firstName',
  'lastName',
] as const;

export type EmployeeFeedbackCategory =
  | 'wellness'
  | 'operations'
  | 'culture'
  | 'safety'
  | 'growth'
  | 'other';

export type EmployeeFeedbackPayload = {
  category: EmployeeFeedbackCategory;
  body: string;
  alias: string;
  universeId: string;
  organizationId: string;
};

export type EmployeeFeedbackRecord = {
  id: string;
  submittedAt: string;
  persona: 'employee';
  payload: EmployeeFeedbackPayload;
  source: 'session_memory' | 'persistence_bound';
};

export type EmployeeFeedbackChannel = {
  status: 'READY' | 'WAITING_DATA';
  persistenceBound: boolean;
  l4Autonomy: false;
  storesDisplayName: false;
  storesLegalName: false;
  submissions: EmployeeFeedbackRecord[];
  note: string;
};

export type EmployeeFeedbackPersistence = {
  insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string } | null }>;
};

const ALIAS_PREFIXES = ['Signal', 'Keel', 'North', 'Harbor', 'Atlas'] as const;

const globalStore = globalThis as typeof globalThis & {
  __xivEmployeeFeedbackStore?: EmployeeFeedbackRecord[];
  __xivEmployeeFeedbackPersistence?: EmployeeFeedbackPersistence;
};

function store(): EmployeeFeedbackRecord[] {
  if (!globalStore.__xivEmployeeFeedbackStore) {
    globalStore.__xivEmployeeFeedbackStore = [];
  }
  return globalStore.__xivEmployeeFeedbackStore;
}

/** Deterministic on-device alias — same algorithm as apps/mobile anonymousAlias. */
export function anonymousEmployeeAlias(userId: string): string {
  if (!userId) return 'Signal-00';
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }
  const prefix = ALIAS_PREFIXES[hash % ALIAS_PREFIXES.length];
  const letter = String.fromCharCode(65 + (hash % 26));
  const code = String((hash % 90) + 10).padStart(2, '0');
  return `${prefix}-${letter}${code}`;
}

export function bindEmployeeFeedbackPersistence(next: EmployeeFeedbackPersistence | null) {
  globalStore.__xivEmployeeFeedbackPersistence = next ?? undefined;
}

export function isEmployeeFeedbackPersistenceBound(): boolean {
  return Boolean(globalStore.__xivEmployeeFeedbackPersistence);
}

/** True when either dedicated feedback persistence or agent persistence adapter is bound. */
export function isEmployeeFeedbackDurableBound(): boolean {
  return isEmployeeFeedbackPersistenceBound() || isAgentPersistenceBound();
}

export function resetEmployeeFeedbackSessionStore() {
  globalStore.__xivEmployeeFeedbackStore = [];
}

export function feedbackPayloadHasIdentityLeak(payload: Record<string, unknown>): string[] {
  const leaks: string[] = [];
  for (const key of FORBIDDEN_FEEDBACK_IDENTITY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(payload, key) && payload[key] != null && payload[key] !== '') {
      leaks.push(key);
    }
  }
  return leaks;
}

export function assertFeedbackPayloadAnonymous(payload: Record<string, unknown>): void {
  const leaks = feedbackPayloadHasIdentityLeak(payload);
  if (leaks.length > 0) {
    throw new Error(`employee_feedback_identity_leak:${leaks.join(',')}`);
  }
  if (typeof payload.alias !== 'string' || !payload.alias.trim()) {
    throw new Error('employee_feedback_alias_required');
  }
}

function sanitizeCategory(value: unknown): EmployeeFeedbackCategory {
  if (
    value === 'wellness' ||
    value === 'operations' ||
    value === 'culture' ||
    value === 'safety' ||
    value === 'growth' ||
    value === 'other'
  ) {
    return value;
  }
  return 'other';
}

/**
 * Build a tenant-scoped anonymous payload. Strips any accidental identity fields.
 * Caller may pass displayName/legalName on input — they are dropped, never stored.
 */
export function buildAnonymousFeedbackPayload(input: {
  userId: string;
  category: EmployeeFeedbackCategory | string;
  body: string;
  universeId: string;
  organizationId: string;
  /** Ignored — accepted only so callers cannot accidentally rely on storage. */
  displayName?: string;
  legalName?: string;
  fullName?: string;
  email?: string;
}): EmployeeFeedbackPayload {
  const body = input.body.trim();
  if (!body) throw new Error('employee_feedback_body_required');
  if (!input.universeId.trim()) throw new Error('employee_feedback_universe_required');
  if (!input.organizationId.trim()) throw new Error('employee_feedback_organization_required');

  const payload: EmployeeFeedbackPayload = {
    category: sanitizeCategory(input.category),
    body,
    alias: anonymousEmployeeAlias(input.userId),
    universeId: input.universeId.trim(),
    organizationId: input.organizationId.trim(),
  };

  assertFeedbackPayloadAnonymous(payload as unknown as Record<string, unknown>);
  return payload;
}

export async function submitEmployeeFeedback(input: {
  userId: string;
  category: EmployeeFeedbackCategory | string;
  body: string;
  universeId: string;
  organizationId: string;
  displayName?: string;
  legalName?: string;
  fullName?: string;
  email?: string;
}): Promise<EmployeeFeedbackRecord> {
  const payload = buildAnonymousFeedbackPayload(input);
  const durableBound = isEmployeeFeedbackDurableBound();
  const record: EmployeeFeedbackRecord = {
    id: `emp_fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    submittedAt: new Date().toISOString(),
    persona: 'employee',
    payload,
    source: durableBound ? 'persistence_bound' : 'session_memory',
  };

  // Always keep session copy for local prototype UX — never invent remote rows.
  store().unshift(record);

  const client = globalStore.__xivEmployeeFeedbackPersistence;
  if (client) {
    const row = {
      id: record.id,
      organization_id: payload.organizationId,
      universe_id: payload.universeId,
      alias: payload.alias,
      category: payload.category,
      body: payload.body,
      persona: 'employee',
      created_at: record.submittedAt,
      // Explicitly omit displayName / legalName / email / full_name
    };
    assertFeedbackPayloadAnonymous(row);
    const result = await client.insert(row);
    if (result.error) {
      // Keep session record; durable write failed honestly.
      record.source = 'session_memory';
    }
  }

  return record;
}

export function listEmployeeFeedbackChannel(input?: {
  universeId?: string;
  organizationId?: string;
}): EmployeeFeedbackChannel {
  const durableBound = isEmployeeFeedbackDurableBound();
  let submissions = store().slice();
  if (input?.universeId) {
    submissions = submissions.filter((item) => item.payload.universeId === input.universeId);
  }
  if (input?.organizationId) {
    submissions = submissions.filter((item) => item.payload.organizationId === input.organizationId);
  }

  // Audit: every listed payload must remain alias-only.
  for (const item of submissions) {
    assertFeedbackPayloadAnonymous(item.payload as unknown as Record<string, unknown>);
  }

  const hasAny = submissions.length > 0;
  const status: EmployeeFeedbackChannel['status'] =
    !durableBound && !hasAny ? 'WAITING_DATA' : hasAny || durableBound ? 'READY' : 'WAITING_DATA';

  let note: string;
  if (!durableBound) {
    note = hasAny
      ? 'WAITING_DATA for durable xiv_employee_feedback (Universe RLS) — showing in-memory session submissions only. Persistence client not bound.'
      : 'WAITING_DATA — no employee feedback yet and feedback persistence is not bound. Submissions are not fabricated.';
  } else if (!hasAny) {
    note =
      'Persistence bound. No session feedback yet — durable rows appear after submit when xiv_employee_feedback + RLS are applied.';
  } else {
    note =
      'Anonymous alias-only feedback in session memory; durable writes target Universe-scoped xiv_employee_feedback when schema is live. Legal/display names are never stored on the payload.';
  }

  return {
    status,
    persistenceBound: durableBound,
    l4Autonomy: false,
    storesDisplayName: false,
    storesLegalName: false,
    submissions,
    note,
  };
}

export function employeeFeedbackAllowsL4(): false {
  return false;
}
