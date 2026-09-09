import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { publishAgentMessage, type AgentMessage } from './agent-bus';

const MAX_MESSAGES = 10_000;

function storePath(root = process.cwd()) {
  return join(root, '.xiv-local', 'agent-messages.json');
}

async function load(path: string): Promise<AgentMessage[]> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
    return Array.isArray(parsed) ? parsed as AgentMessage[] : [];
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
  input: Omit<AgentMessage, 'id' | 'createdAt'>,
  root?: string,
) {
  const hot = publishAgentMessage(input);
  const path = storePath(root);
  const stored = await load(path);
  stored.push(hot);
  await saveAtomic(path, stored.slice(-MAX_MESSAGES));
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
