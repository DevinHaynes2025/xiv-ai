import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUDITABLE_MEMORY_POLICY,
  BR_LOCKS,
  FORBIDDEN_PRIVATE_FIELDS,
  HIDDEN_TRACE_DENIED,
  HONESTY_BANNER,
  type AuditableArtifactKind,
  type BrActor,
} from './structured-code-memory-types';

export type NotebookEntry = {
  id: string;
  kind: AuditableArtifactKind;
  title: string;
  body: string;
  evidenceRefs: string[];
  provenance: string[];
  hypothesisStatus?: 'hypothesis' | 'supported' | 'refuted' | 'verified_root_cause';
  recordedAt: string;
  actorId: string;
  permissionChange: false;
  productionAuthorized: false;
  /** Always false — private CoT is never persisted. */
  containsHiddenReasoningTrace: false;
};

export type NotebookStore = {
  entries: NotebookEntry[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'engineering-notebook.json');
}

async function load(root: string): Promise<NotebookStore> {
  return readJsonFile<NotebookStore>(storePath(root), { entries: [] });
}

async function save(root: string, store: NotebookStore) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function hasForbiddenField(payload: Record<string, unknown>): string | null {
  for (const key of Object.keys(payload)) {
    const lower = key.toLowerCase();
    for (const forbidden of FORBIDDEN_PRIVATE_FIELDS) {
      if (lower === forbidden.toLowerCase() || lower.includes('hidden_reasoning') || lower.includes('private_cot')) {
        return key;
      }
    }
  }
  return null;
}

/**
 * Strip forbidden private CoT / hidden-trace fields from a payload.
 * Returns stripped copy + list of removed keys.
 */
export function stripForbiddenPrivateFields(payload: Record<string, unknown>): {
  stripped: Record<string, unknown>;
  removed: string[];
} {
  const stripped: Record<string, unknown> = {};
  const removed: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    const lower = key.toLowerCase();
    const isForbidden =
      (FORBIDDEN_PRIVATE_FIELDS as readonly string[]).some((f) => f.toLowerCase() === lower) ||
      lower.includes('hidden_reasoning') ||
      lower.includes('private_chain_of_thought') ||
      lower.includes('private_cot') ||
      lower.includes('hidden_cot') ||
      lower.includes('secret_reasoning') ||
      lower.includes('internal_monologue');
    if (isForbidden) {
      removed.push(key);
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = stripForbiddenPrivateFields(value as Record<string, unknown>);
      stripped[key] = nested.stripped;
      removed.push(...nested.removed.map((r) => `${key}.${r}`));
    } else {
      stripped[key] = value;
    }
  }
  return { stripped, removed };
}

/**
 * Append an auditable engineering notebook artifact.
 * Requests that include `hidden_reasoning_trace` / private CoT fields are DENIED
 * (or may be stripped when `mode: 'strip'`).
 */
export async function appendNotebookEntry(input: {
  kind: AuditableArtifactKind;
  title: string;
  body: string;
  evidenceRefs?: string[];
  provenance?: string[];
  hypothesisStatus?: NotebookEntry['hypothesisStatus'];
  /** Extra payload inspected for forbidden private fields. */
  payload?: Record<string, unknown>;
  /** DENY (default) rejects; strip removes forbidden fields and continues. */
  mode?: 'deny' | 'strip';
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const payload = input.payload ?? {};
  const mode = input.mode ?? 'deny';
  const forbidden = hasForbiddenField(payload);

  if (forbidden && mode === 'deny') {
    return {
      accepted: false as const,
      reason: HIDDEN_TRACE_DENIED,
      forbiddenField: forbidden,
      stored: false as const,
    };
  }

  let body = input.body;
  let removed: string[] = [];
  if (forbidden && mode === 'strip') {
    const result = stripForbiddenPrivateFields(payload);
    removed = result.removed;
    body = `${body}\n\n[stripped_forbidden_fields=${removed.join(',')}]`;
  }

  if (!(AUDITABLE_MEMORY_POLICY.allowedArtifactKinds as readonly string[]).includes(input.kind)) {
    return {
      accepted: false as const,
      reason: 'ARTIFACT_KIND_NOT_AUDITABLE',
      stored: false as const,
    };
  }

  const store = await load(root);
  const entry: NotebookEntry = {
    id: id('note'),
    kind: input.kind,
    title: input.title,
    body,
    evidenceRefs: input.evidenceRefs ?? [],
    provenance: input.provenance ?? [],
    hypothesisStatus: input.hypothesisStatus,
    recordedAt: new Date().toISOString(),
    actorId: input.actor.id,
    permissionChange: false,
    productionAuthorized: false,
    containsHiddenReasoningTrace: false,
  };
  store.entries.push(entry);
  store.entries = store.entries.slice(-10_000);
  await save(root, store);
  return {
    accepted: true as const,
    entry,
    strippedFields: removed,
    storeHiddenReasoningTraces: BR_LOCKS.STORE_HIDDEN_REASONING_TRACES,
  };
}

export async function listNotebookEntries(root?: string) {
  const store = await load(root ?? process.cwd());
  return store.entries;
}

export function engineeringNotebookHonesty() {
  return {
    banner: HONESTY_BANNER,
    auditableOnly: BR_LOCKS.AUDITABLE_ARTIFACTS_ONLY,
    storeHiddenReasoningTraces: BR_LOCKS.STORE_HIDDEN_REASONING_TRACES,
    storePrivateChainOfThought: BR_LOCKS.STORE_PRIVATE_CHAIN_OF_THOUGHT,
    policy: AUDITABLE_MEMORY_POLICY,
    deniedCode: HIDDEN_TRACE_DENIED,
  };
}
