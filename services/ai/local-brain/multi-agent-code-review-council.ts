import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BS_LOCKS,
  REVIEW_AUTO_MERGE_DENIED,
  type ReviewCouncilRole,
} from './engineering-university-memory-cortex-types';

/**
 * Multi-Agent Code Review Council — coder / tester / security / skeptic patterns.
 * Recommendation ≠ merge. Council cannot auto-merge.
 */

export const REVIEW_COUNCIL_STORE = 'multi-agent-code-review-council.json';

export type ReviewPosition = {
  role: ReviewCouncilRole;
  recommendation: 'approve' | 'request_changes' | 'abstain' | 'block';
  rationale: string;
  evidenceRefs: string[];
};

export type ReviewCouncilSession = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  subject: string;
  positions: ReviewPosition[];
  consensus: 'recommendation_only';
  merged: false;
  autoMerged: false;
  productionAuthorized: false;
  createdAt: string;
};

type CouncilStore = {
  sessions: ReviewCouncilSession[];
  denials: Array<{ id: string; at: string; reason: string; subject: string }>;
};

const MAX = 5_000;

function storePath(root: string) {
  return xivLocalPath(root, REVIEW_COUNCIL_STORE);
}

async function load(root: string): Promise<CouncilStore> {
  const parsed = await readJsonFile<CouncilStore>(storePath(root), {
    sessions: [],
    denials: [],
  });
  return {
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: CouncilStore) {
  await writeJsonFileAtomic(storePath(root), {
    sessions: store.sessions.slice(-MAX),
    denials: store.denials.slice(-MAX),
  });
}

const DEFAULT_ROLES: ReviewCouncilRole[] = ['coder', 'tester', 'security', 'skeptic'];

function defaultPosition(role: ReviewCouncilRole, subject: string): ReviewPosition {
  const base = {
    role,
    evidenceRefs: [] as string[],
  };
  switch (role) {
    case 'coder':
      return {
        ...base,
        recommendation: 'approve',
        rationale: `Coder pattern: structured review of ${subject}; recommendation only.`,
      };
    case 'tester':
      return {
        ...base,
        recommendation: 'request_changes',
        rationale: `Tester pattern: demand bounded regression coverage for ${subject}; recommendation only.`,
      };
    case 'security':
      return {
        ...base,
        recommendation: 'request_changes',
        rationale: `Security pattern: deny-by-default scan of ${subject}; recommendation only.`,
      };
    case 'skeptic':
      return {
        ...base,
        recommendation: 'abstain',
        rationale: `Skeptic pattern: UNKNOWN allowed; do not invent PASS for ${subject}; recommendation only.`,
      };
  }
}

export async function conveneCodeReviewCouncil(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  subject: string;
  positions?: ReviewPosition[];
  evidenceRefs?: string[];
  /** Hard-deny probe: council attempts auto-merge. */
  attemptAutoMerge?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (!input.orgId || !input.tenantId || !input.universeId || !input.subject.trim()) {
    return {
      accepted: false as const,
      reason: 'ORG_TENANT_UNIVERSE_SUBJECT_REQUIRED',
      session: null,
      merged: false as const,
      autoMerged: false as const,
    };
  }

  if (input.attemptAutoMerge) {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: REVIEW_AUTO_MERGE_DENIED,
      subject: input.subject,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: REVIEW_AUTO_MERGE_DENIED,
      session: null,
      merged: false as const,
      autoMerged: false as const,
      productionAuthorized: false as const,
      recommendationOnly: true as const,
    };
  }

  const positions =
    input.positions ??
    DEFAULT_ROLES.map((role) => {
      const pos = defaultPosition(role, input.subject);
      return {
        ...pos,
        evidenceRefs: [...pos.evidenceRefs, ...(input.evidenceRefs ?? [])],
      };
    });

  const session: ReviewCouncilSession = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    subject: input.subject.trim(),
    positions,
    consensus: 'recommendation_only',
    merged: false,
    autoMerged: false,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
  };
  store.sessions.push(session);
  await save(root, store);

  return {
    accepted: true as const,
    reason: 'REVIEW_COUNCIL_RECOMMENDATION_ONLY',
    session,
    merged: false as const,
    autoMerged: false as const,
    productionAuthorized: false as const,
    recommendationOnly: true as const,
  };
}

export async function attemptCouncilAutoMerge(input: {
  sessionId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const session = store.sessions.find((s) => s.id === input.sessionId);
  store.denials.push({
    id: randomUUID(),
    at: new Date().toISOString(),
    reason: REVIEW_AUTO_MERGE_DENIED,
    subject: session?.subject ?? input.sessionId,
  });
  await save(root, store);
  return {
    accepted: false as const,
    reason: REVIEW_AUTO_MERGE_DENIED,
    merged: false as const,
    autoMerged: false as const,
    productionAuthorized: false as const,
    recommendationOnly: true as const,
  };
}

export function reviewCouncilHonesty() {
  return {
    locks: BS_LOCKS,
    reviewCouncilAutoMerge: BS_LOCKS.REVIEW_COUNCIL_AUTO_MERGE,
    recommendationOnly: true as const,
    productionAuthorization: false as const,
  };
}
