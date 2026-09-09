import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BS_LOCKS,
  HIDDEN_REASONING_REJECTED,
  UNVERIFIED_NOT_PROMOTED,
  type EngineeringLinkKind,
  type OutcomeVerification,
} from './engineering-university-memory-cortex-types';
import { appendNotebookEntry } from './engineering-notebook';
import { compileSoftwareKnowledge } from './superbrain-software-knowledge-compiler';
import {
  HIDDEN_TRACE_DENIED,
  type BrActor,
} from './structured-code-memory-types';

/**
 * Superbrain Engineering Memory Cortex — auditable links across code notes,
 * bugs, fixes, architecture decisions, tests, reviews, patterns, failures,
 * agent skills, and outcomes.
 *
 * Extends BR Structured Code Memory / Engineering Notebook / Software Knowledge
 * Compiler when present (reuse BR hidden-reasoning deny policy).
 * Unverified outcomes are not promoted into trusted cortex knowledge.
 */

export const ENGINEERING_MEMORY_CORTEX_STORE = 'superbrain-engineering-memory-cortex.json';

export type EngineeringMemoryLink = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  kind: EngineeringLinkKind;
  title: string;
  summary: string;
  linkedIds: string[];
  evidenceRefs: string[];
  trustTier: 'candidate' | 'trusted';
  outcomeVerification: OutcomeVerification;
  hiddenReasoningTrace: false;
  auditable: true;
  productionAuthorized: false;
  notebookEntryId: string | null;
  compilerArtifactId: string | null;
  createdAt: string;
};

type CortexStore = {
  links: EngineeringMemoryLink[];
  denials: Array<{ id: string; at: string; reason: string; kind?: string }>;
  brCodeMemoryCoupling: 'WAITING_DATA' | 'PRESENT';
};

const MAX = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, ENGINEERING_MEMORY_CORTEX_STORE);
}

function detectBrCoupling(root: string): 'WAITING_DATA' | 'PRESENT' {
  const here = dirname(fileURLToPath(import.meta.url));
  const hasCompiler = existsSync(join(here, 'superbrain-software-knowledge-compiler.ts'));
  const hasNotebook = existsSync(join(here, 'engineering-notebook.ts'));
  const hasReport = existsSync(
    join(root, 'docs/operations/62L_BR_STRUCTURED_CODE_MEMORY_DEBUG_ACADEMY_REPORT.md'),
  );
  if (hasCompiler && hasNotebook) return 'PRESENT';
  if (hasReport) return 'PRESENT';
  return 'WAITING_DATA';
}

async function load(root: string): Promise<CortexStore> {
  const parsed = await readJsonFile<CortexStore>(storePath(root), {
    links: [],
    denials: [],
    brCodeMemoryCoupling: 'WAITING_DATA',
  });
  return {
    links: Array.isArray(parsed.links) ? parsed.links : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
    brCodeMemoryCoupling: detectBrCoupling(root),
  };
}

async function save(root: string, store: CortexStore) {
  await writeJsonFileAtomic(storePath(root), {
    links: store.links.slice(-MAX),
    denials: store.denials.slice(-MAX),
    brCodeMemoryCoupling: store.brCodeMemoryCoupling,
  });
}

function toNotebookKind(
  kind: EngineeringLinkKind,
):
  | 'evidence'
  | 'lesson'
  | 'outcome'
  | 'architecture_decision'
  | 'failed_approach'
  | 'skill_candidate' {
  switch (kind) {
    case 'architecture_decision':
      return 'architecture_decision';
    case 'failure':
    case 'bug':
      return 'failed_approach';
    case 'agent_skill':
      return 'skill_candidate';
    case 'outcome':
    case 'fix':
      return 'outcome';
    case 'pattern':
    case 'review':
    case 'test':
    case 'code_note':
    default:
      return 'lesson';
  }
}

export type StoreEngineeringLinkInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  kind: EngineeringLinkKind;
  title: string;
  summary: string;
  linkedIds?: string[];
  evidenceRefs?: string[];
  outcomeVerification: OutcomeVerification;
  /** Hard-deny probe: attempt to store private hidden reasoning. */
  hiddenReasoningTrace?: boolean | string;
  /** Hard-deny probe: force promote unverified to trusted. */
  attemptPromoteUnverifiedToTrusted?: boolean;
  actorId?: string;
  root?: string;
};

export async function storeEngineeringMemoryLink(input: StoreEngineeringLinkInput) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const actor: BrActor = {
    kind: 'ordinary_agent',
    id: input.actorId ?? 'engineering-memory-cortex',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    role: 'memory_cortex',
  };

  const deny = async (reason: string) => {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
      kind: input.kind,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason,
      link: null,
      trustTier: null,
      hiddenReasoningTrace: false as const,
      productionAuthorized: false as const,
      brCodeMemoryCoupling: store.brCodeMemoryCoupling,
    };
  };

  if (!input.orgId || !input.tenantId || !input.universeId || !input.title.trim()) {
    return deny('ORG_TENANT_UNIVERSE_TITLE_REQUIRED');
  }

  if (
    input.hiddenReasoningTrace === true ||
    (typeof input.hiddenReasoningTrace === 'string' && input.hiddenReasoningTrace.trim().length > 0)
  ) {
    // Reuse BR notebook + compiler deny policy.
    const notebookDeny = await appendNotebookEntry({
      kind: 'lesson',
      title: input.title,
      body: input.summary,
      payload: { hidden_reasoning_trace: String(input.hiddenReasoningTrace) },
      mode: 'deny',
      actor,
      root,
    });
    const compilerDeny = await compileSoftwareKnowledge({
      kind: 'knowledge',
      title: input.title,
      body: input.summary,
      verifiedSource: false,
      payload: { hidden_reasoning_trace: String(input.hiddenReasoningTrace) },
      actor,
      root,
    });
    const reason =
      notebookDeny.reason === HIDDEN_TRACE_DENIED || compilerDeny.reason === 'HIDDEN_REASONING_TRACE_DENIED'
        ? HIDDEN_REASONING_REJECTED
        : HIDDEN_REASONING_REJECTED;
    return deny(reason);
  }

  if (
    input.attemptPromoteUnverifiedToTrusted &&
    input.outcomeVerification !== 'verified'
  ) {
    return deny(UNVERIFIED_NOT_PROMOTED);
  }

  const verified = input.outcomeVerification === 'verified';
  const trustTier = verified ? ('trusted' as const) : ('candidate' as const);

  if (!verified && trustTier === 'trusted') {
    return deny(UNVERIFIED_NOT_PROMOTED);
  }

  // Mirror into BR notebook (auditable only).
  const notebook = await appendNotebookEntry({
    kind: toNotebookKind(input.kind),
    title: input.title.trim(),
    body: input.summary.trim(),
    evidenceRefs: input.evidenceRefs ?? [],
    provenance: input.linkedIds ?? [],
    actor,
    root,
  });

  // Compile via BR Software Knowledge Compiler — unverified stays untrusted candidate.
  const compiled = await compileSoftwareKnowledge({
    kind: input.kind === 'agent_skill' ? 'skill' : 'knowledge',
    title: input.title.trim(),
    body: input.summary.trim(),
    sourceRefs: input.evidenceRefs ?? [],
    verifiedSource: verified,
    actor,
    root,
  });

  if (
    !verified &&
    'compiledIntoTrustedKnowledge' in compiled &&
    (compiled as { compiledIntoTrustedKnowledge?: boolean }).compiledIntoTrustedKnowledge === true
  ) {
    return deny(UNVERIFIED_NOT_PROMOTED);
  }

  const compilerArtifactId =
    'artifact' in compiled && compiled.artifact
      ? (compiled.artifact as { id: string }).id
      : null;

  const link: EngineeringMemoryLink = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    title: input.title.trim(),
    summary: input.summary.trim(),
    linkedIds: input.linkedIds ?? [],
    evidenceRefs: input.evidenceRefs ?? [],
    trustTier,
    outcomeVerification: input.outcomeVerification,
    hiddenReasoningTrace: false,
    auditable: true,
    productionAuthorized: false,
    notebookEntryId: notebook.accepted ? notebook.entry.id : null,
    compilerArtifactId,
    createdAt: new Date().toISOString(),
  };
  store.links.push(link);
  await save(root, store);

  return {
    accepted: true as const,
    reason: verified
      ? 'ENGINEERING_LINK_STORED_AUDITABLE_TRUSTED'
      : 'ENGINEERING_LINK_STORED_AS_CANDIDATE_NOT_TRUSTED',
    link,
    trustTier,
    promotedToTrusted: verified,
    hiddenReasoningTrace: false as const,
    productionAuthorized: false as const,
    brCodeMemoryCoupling: store.brCodeMemoryCoupling,
    notebookAccepted: notebook.accepted,
    compilerAccepted: compiled.accepted,
  };
}

export async function promoteEngineeringLinkToTrusted(input: {
  linkId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const link = store.links.find((l) => l.id === input.linkId);
  if (!link) {
    return { accepted: false as const, reason: 'LINK_NOT_FOUND', link: null };
  }
  if (link.outcomeVerification !== 'verified') {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason: UNVERIFIED_NOT_PROMOTED,
      kind: link.kind,
    });
    await save(root, store);
    return {
      accepted: false as const,
      reason: UNVERIFIED_NOT_PROMOTED,
      link,
      trustTier: link.trustTier,
    };
  }
  link.trustTier = 'trusted';
  await save(root, store);
  return { accepted: true as const, reason: 'LINK_ALREADY_OR_NOW_TRUSTED', link };
}

export async function listEngineeringMemoryLinks(root: string, orgId: string) {
  const store = await load(root);
  return store.links.filter((l) => l.orgId === orgId);
}

export function engineeringMemoryCortexHonesty() {
  return {
    locks: BS_LOCKS,
    hiddenReasoningTracesAllowed: BS_LOCKS.HIDDEN_REASONING_TRACES_ALLOWED,
    unverifiedOutcomePromotedToTrusted: BS_LOCKS.UNVERIFIED_OUTCOME_PROMOTED_TO_TRUSTED,
    productionAuthorization: false as const,
    brPolicy:
      'No private hidden reasoning traces — auditable engineering artifacts only (reuse BR notebook/compiler policy).',
    brHiddenTraceDeniedCode: HIDDEN_TRACE_DENIED,
  };
}
