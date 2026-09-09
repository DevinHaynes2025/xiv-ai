import { randomUUID } from 'node:crypto';

import { listDeviceNodes } from './device-node-runtime';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { listSecureConversation, type SecureEnvelope } from './secure-agent-conversation';

export type StoreForwardMessage = {
  id: string;
  tenantId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  envelopeId: string;
  bodyPreview: string;
  state: 'queued' | 'delivered' | 'held_offline';
  createdAt: string;
  deliveredAt?: string;
};

type ForwardStore = { messages: StoreForwardMessage[] };

const MAX_MESSAGES = 5_000;

function storePath(root: string) {
  return xivLocalPath(root, 'store-and-forward.json');
}

export async function enqueueStoreAndForward(input: {
  tenantId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  envelope: Pick<SecureEnvelope, 'id' | 'body'>;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const nodes = await listDeviceNodes({ tenantId: input.tenantId, universeId: input.universeId, root });
  const to = nodes.find((node) => node.id === input.toNodeId);
  const from = nodes.find((node) => node.id === input.fromNodeId);
  if (!from || !to) throw new Error('STORE_FORWARD_NODES_REQUIRED');
  const store = await readJsonFile<ForwardStore>(storePath(root), { messages: [] });
  const messages = Array.isArray(store.messages) ? store.messages : [];
  const message: StoreForwardMessage = {
    id: `saf_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    envelopeId: input.envelope.id,
    bodyPreview: input.envelope.body.slice(0, 120),
    state: to.online ? 'queued' : 'held_offline',
    createdAt: new Date().toISOString(),
  };
  if (to.online) {
    message.state = 'delivered';
    message.deliveredAt = new Date().toISOString();
  }
  messages.push(message);
  await writeJsonFileAtomic(storePath(root), { messages: messages.slice(-MAX_MESSAGES) });
  return message;
}

export async function flushStoreAndForward(input: {
  tenantId: string;
  universeId: string;
  toNodeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const nodes = await listDeviceNodes({ tenantId: input.tenantId, universeId: input.universeId, root });
  const to = nodes.find((node) => node.id === input.toNodeId);
  if (!to?.online) {
    return { flushed: 0, state: 'held_offline' as const, reason: 'Destination node is offline; messages remain queued.' };
  }
  const store = await readJsonFile<ForwardStore>(storePath(root), { messages: [] });
  const messages = Array.isArray(store.messages) ? store.messages : [];
  let flushed = 0;
  for (const message of messages) {
    if (
      message.tenantId === input.tenantId &&
      message.universeId === input.universeId &&
      message.toNodeId === input.toNodeId &&
      message.state === 'held_offline'
    ) {
      message.state = 'delivered';
      message.deliveredAt = new Date().toISOString();
      flushed += 1;
    }
  }
  await writeJsonFileAtomic(storePath(root), { messages });
  return { flushed, state: 'delivered' as const, reason: 'Offline messages delivered after the destination node returned.' };
}

export async function listStoreAndForward(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const store = await readJsonFile<ForwardStore>(storePath(input.root ?? process.cwd()), { messages: [] });
  const messages = Array.isArray(store.messages) ? store.messages : [];
  return messages.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}

export async function conversationHeldForNode(input: {
  tenantId: string;
  universeId: string;
  conversationId: string;
  root?: string;
}) {
  return listSecureConversation(input);
}
