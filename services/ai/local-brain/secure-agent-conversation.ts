import { createHmac, randomUUID } from 'node:crypto';

import { publishPersistentAgentMessage } from './persistent-agent-bus';
import { SEALED_REDACTION, redactSealedFields } from './ceo-sealed-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';

export type SecureEnvelope = {
  id: string;
  conversationId: string;
  tenantId: string;
  universeId: string;
  fromAgent: string;
  toAgent: string;
  mac: string;
  body: string;
  sealedRedacted: true;
  createdAt: string;
  deliveredAt?: string;
};

type ConversationStore = { envelopes: SecureEnvelope[] };

const MAX_ENVELOPES = 5_000;

function storePath(root: string) {
  return xivLocalPath(root, 'secure-agent-conversations.json');
}

function macOf(conversationId: string, body: string) {
  return createHmac('sha256', `xiv-a2a:${conversationId}`).update(body).digest('hex');
}

export function verifySecureEnvelope(envelope: SecureEnvelope) {
  return envelope.mac === macOf(envelope.conversationId, envelope.body);
}

export async function sendSecureAgentMessage(input: {
  tenantId: string;
  universeId: string;
  conversationId?: string;
  fromAgent: string;
  toAgent: string;
  body: string;
  containsSealed?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.fromAgent || !input.toAgent || !input.body.trim()) throw new Error('SECURE_MESSAGE_REQUIRED');
  const conversationId = input.conversationId ?? `conv_${randomUUID()}`;
  const raw = input.containsSealed ? SEALED_REDACTION : input.body.trim().slice(0, 8_000);
  const redacted = redactSealedFields({ sealedPayload: raw, body: raw });
  const body = String(redacted.body);
  const envelope: SecureEnvelope = {
    id: `senv_${randomUUID()}`,
    conversationId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromAgent: input.fromAgent,
    toAgent: input.toAgent,
    body,
    mac: macOf(conversationId, body),
    sealedRedacted: true,
    createdAt: new Date().toISOString(),
  };
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<ConversationStore>(storePath(root), { envelopes: [] });
  const envelopes = Array.isArray(store.envelopes) ? store.envelopes : [];
  envelopes.push(envelope);
  await writeJsonFileAtomic(storePath(root), { envelopes: envelopes.slice(-MAX_ENVELOPES) });
  await publishPersistentAgentMessage(
    {
      fromRole: input.fromAgent,
      toRole: input.toAgent,
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: 'status',
      body: `secure-envelope:${envelope.id}`,
      evidenceRefs: [`secure:${envelope.id}`],
      requiresHumanApproval: false,
    },
    root,
  );
  return envelope;
}

export async function listSecureConversation(input: {
  tenantId: string;
  universeId: string;
  conversationId: string;
  root?: string;
}) {
  const store = await readJsonFile<ConversationStore>(storePath(input.root ?? process.cwd()), { envelopes: [] });
  const envelopes = Array.isArray(store.envelopes) ? store.envelopes : [];
  return envelopes.filter(
    (item) =>
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId &&
      item.conversationId === input.conversationId,
  );
}
