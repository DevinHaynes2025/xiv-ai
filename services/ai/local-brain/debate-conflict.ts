import { publishAgentMessage } from './agent-bus';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { domainById, KNOWLEDGE_DOMAINS } from './knowledge-domains';
import { listContradictions, recordContradiction, transitionContradiction } from './world-knowledge-graph';
import { decisionGate, type ConsequenceClass } from './decision-gate';

export type DebateTurn = {
  id: string;
  role: string;
  body: string;
  independent: true;
  createdAt: string;
};

export type DebateThread = {
  id: string;
  tenantId: string;
  universeId: string;
  topic: string;
  turns: DebateTurn[];
  consensusForced: false;
  productionAuthorization: false;
};

type DebateStore = { threads: DebateThread[] };

function debatePath(root: string) {
  return xivLocalPath(root, 'debate-memory.json');
}

async function loadDebates(root: string) {
  const parsed = await readJsonFile<DebateStore>(debatePath(root), { threads: [] });
  return Array.isArray(parsed.threads) ? parsed.threads : [];
}

async function saveDebates(root: string, threads: DebateThread[]) {
  await writeJsonFileAtomic(debatePath(root), { threads: threads.slice(-5_000) });
}

export async function recordDebateTurn(input: {
  tenantId: string;
  universeId: string;
  topic: string;
  role: string;
  body: string;
  threadId?: string;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.body.trim()) throw new Error('DEBATE_TURN_REQUIRED');
  const root = input.root ?? process.cwd();
  const threads = await loadDebates(root);
  let thread = input.threadId
    ? threads.find((item) => item.id === input.threadId && item.tenantId === input.tenantId && item.universeId === input.universeId)
    : undefined;
  if (!thread) {
    thread = {
      id: cortexId('debate'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      topic: input.topic,
      turns: [],
      consensusForced: false,
      productionAuthorization: false,
    };
    threads.push(thread);
  }
  const turn: DebateTurn = {
    id: cortexId('dturn'),
    role: input.role,
    body: input.body.trim(),
    independent: true,
    createdAt: new Date().toISOString(),
  };
  thread.turns.push(turn);
  publishAgentMessage({
    fromRole: input.role,
    toRole: 'executive_synthesizer',
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'challenge',
    body: turn.body,
    evidenceRefs: [],
    requiresHumanApproval: false,
  });
  await saveDebates(root, threads);
  return thread;
}

export async function listDebateThreads(input: { tenantId: string; universeId: string; root?: string }) {
  const threads = await loadDebates(input.root ?? process.cwd());
  return threads.filter((thread) => thread.tenantId === input.tenantId && thread.universeId === input.universeId);
}

export function routeCrossDomain(input: {
  domainId: string;
  question: string;
}) {
  const domain = domainById(input.domainId);
  if (!domain) {
    return {
      domain: null,
      routed: false as const,
      state: 'UNKNOWN' as const,
      reason: 'Domain is not registered. No facts were invented.',
      availableDomains: KNOWLEDGE_DOMAINS.map((item) => item.id),
    };
  }
  return {
    domain,
    routed: true as const,
    state: 'NOT_TESTED' as const,
    reason: `Question routed to ${domain.label}. Registration does not imply data is present.`,
    availableDomains: KNOWLEDGE_DOMAINS.map((item) => item.id),
  };
}

export async function resolveExecutiveConflict(input: {
  tenantId: string;
  universeId: string;
  claimA: string;
  claimB: string;
  reason: string;
  consequence?: ConsequenceClass;
  production?: boolean;
  root?: string;
}) {
  const contradiction = await recordContradiction({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    claimA: input.claimA,
    claimB: input.claimB,
    evidenceRefs: ['executive-conflict', input.reason],
    root: input.root,
  });
  const gate = decisionGate({
    id: contradiction.id,
    action: 'resolve_executive_conflict',
    consequence: input.consequence ?? 'MEDIUM',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  const updated = await transitionContradiction({
    id: contradiction.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    state: gate.humanApprovalRequired ? 'INVESTIGATING' : 'INVESTIGATING',
    note: input.reason,
    root: input.root,
  });
  const open = await listContradictions({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  return {
    contradiction: updated,
    gate,
    consensusForced: false as const,
    openCount: open.filter((item) => item.state === 'OPEN' || item.state === 'INVESTIGATING').length,
    productionAuthorization: false as const,
  };
}
