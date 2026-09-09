import { publishPersistentAgentMessage, loadPersistentInbox } from './persistent-agent-bus';
import { inbox, resetAgentBus, type AgentMessageKind } from './agent-bus';
import { LocalTaskQueue } from './task-queue';
import { LocalCheckpointStore } from './checkpoint-store';
import { join } from 'node:path';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import type { EnsEvidenceState } from './enterprise-nervous-types';

export type OfflineAgentNote = {
  id: string;
  fromRole: string;
  toRole: string;
  tenantId: string;
  universeId: string;
  kind: AgentMessageKind;
  body: string;
  evidenceRefs: string[];
  createdAt: string;
  requiresHumanApproval: boolean;
  productionAuthorization: false;
};

export type PersistentEnsEvent = {
  id: string;
  tenantId: string;
  universeId: string;
  topic: string;
  payloadPreview: string;
  sealed: boolean;
  state: 'queued' | 'running' | 'completed' | 'denied';
  createdAt: string;
  maxAttempts: number;
  attempts: number;
  productionAuthorization: false;
};

type EventStore = { events: PersistentEnsEvent[] };

const MAX_EVENTS = 10_000;

function eventsPath(root: string) {
  return xivLocalPath(root, 'ens-event-queue.json');
}

async function loadEvents(root: string): Promise<PersistentEnsEvent[]> {
  const parsed = await readJsonFile<EventStore>(eventsPath(root), { events: [] });
  return Array.isArray(parsed.events) ? parsed.events : [];
}

async function saveEvents(root: string, events: PersistentEnsEvent[]) {
  await writeJsonFileAtomic(eventsPath(root), { events: events.slice(-MAX_EVENTS) });
}

export async function publishOfflineAgentCommunication(input: {
  fromRole: string;
  toRole: string;
  tenantId: string;
  universeId: string;
  body: string;
  kind?: AgentMessageKind;
  evidenceRefs?: string[];
  requiresHumanApproval?: boolean;
  sealedPayload?: string;
  root?: string;
}): Promise<{ accepted: boolean; state: EnsEvidenceState; note?: OfflineAgentNote; reason?: string }> {
  if (!input.tenantId || !input.universeId) {
    return { accepted: false, state: 'FAIL', reason: 'TENANT_AND_UNIVERSE_REQUIRED' };
  }
  if (input.sealedPayload) {
    return { accepted: false, state: 'FAIL', reason: 'SEALED_PAYLOAD_NOT_ON_AGENT_BUS' };
  }
  const hot = await publishPersistentAgentMessage(
    {
      fromRole: input.fromRole,
      toRole: input.toRole,
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: input.kind ?? 'status',
      body: input.body,
      evidenceRefs: input.evidenceRefs ?? [],
      requiresHumanApproval: input.requiresHumanApproval === true,
    },
    input.root,
  );
  return {
    accepted: true,
    state: 'PASS',
    note: {
      id: hot.id,
      fromRole: hot.fromRole,
      toRole: hot.toRole,
      tenantId: hot.tenantId,
      universeId: hot.universeId,
      kind: hot.kind,
      body: hot.body,
      evidenceRefs: hot.evidenceRefs,
      createdAt: hot.createdAt,
      requiresHumanApproval: hot.requiresHumanApproval,
      productionAuthorization: false,
    },
  };
}

export async function loadOfflineAgentInbox(input: {
  role: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const persistent = await loadPersistentInbox(input);
  const hot = inbox(input.role, input.tenantId, input.universeId);
  const merged = [...persistent, ...hot.filter((item) => !persistent.some((p) => p.id === item.id))];
  return merged.filter(
    (item) => item.tenantId === input.tenantId && item.universeId === input.universeId && item.toRole === input.role,
  );
}

export async function enqueuePersistentEnsEvent(input: {
  tenantId: string;
  universeId: string;
  topic: string;
  payloadPreview: string;
  sealed?: boolean;
  root?: string;
}): Promise<{ accepted: boolean; state: EnsEvidenceState; event?: PersistentEnsEvent; reason?: string }> {
  if (!input.tenantId || !input.universeId) {
    return { accepted: false, state: 'FAIL', reason: 'TENANT_AND_UNIVERSE_REQUIRED' };
  }
  if (input.sealed) {
    return { accepted: false, state: 'FAIL', reason: 'SEALED_EVENT_NOT_ON_ORDINARY_QUEUE' };
  }
  const root = input.root ?? process.cwd();
  const events = await loadEvents(root);
  const event: PersistentEnsEvent = {
    id: cortexId('ensev'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    topic: input.topic.trim().slice(0, 240),
    payloadPreview: input.payloadPreview.slice(0, 240),
    sealed: false,
    state: 'queued',
    createdAt: new Date().toISOString(),
    maxAttempts: 3,
    attempts: 0,
    productionAuthorization: false,
  };
  events.push(event);
  await saveEvents(root, events);

  const queue = new LocalTaskQueue(new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json')));
  await queue.enqueue({
    kind: 'analysis',
    prompt: `ENS event ${event.id}: ${event.topic}`,
    maxAttempts: 3,
    maxModelCalls: 3,
    requirements: {
      needsInternet: false,
      needsCloudProvider: false,
      needsExternalFreshness: false,
      needsProductionWrite: false,
      needsPermissionChange: false,
      classification: 'internal',
    },
  });

  return { accepted: true, state: 'PASS', event };
}

export async function listPersistentEnsEvents(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const events = await loadEvents(input.root ?? process.cwd());
  return events.filter((event) => event.tenantId === input.tenantId && event.universeId === input.universeId);
}

export function resetOfflineAgentBusForTests() {
  resetAgentBus();
}
