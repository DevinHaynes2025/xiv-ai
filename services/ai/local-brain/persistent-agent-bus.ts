import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { publishAgentMessage, type AgentMessage, type PublishAgentMessageInput } from './agent-bus';

const MAX_MESSAGES = 10_000;

function storePath(root = process.cwd()) {
  return join(root, '.xiv-local', 'agent-messages.json');
}

function live(messages: AgentMessage[], now = Date.now()) {
  return messages.filter((message) => !message.expiresAt || Date.parse(message.expiresAt) > now);
}

async function load(path: string, now = Date.now()): Promise<AgentMessage[]> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
    return Array.isArray(parsed) ? live(parsed as AgentMessage[], now) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function saveAtomic(path: string, messages: AgentMessage[]) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(messages, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await rename(tempPath, path);
}

export async function publishPersistentAgentMessage(
  input: PublishAgentMessageInput,
  root?: string,
) {
  const hot = publishAgentMessage(input);
  const path = storePath(root);
  const stored = await load(path, input.now);
  stored.push(hot);
  await saveAtomic(path, live(stored, input.now).slice(-MAX_MESSAGES));
  return hot;
}

export async function loadPersistentInbox(input: {
  role: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const stored = await load(storePath(input.root));
  return stored.filter((message) =>
    message.toRole === input.role &&
    message.tenantId === input.tenantId &&
    message.universeId === input.universeId,
  );
}
