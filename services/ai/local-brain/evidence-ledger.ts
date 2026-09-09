import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export type EvidenceEventKind =
  | 'communication'
  | 'evidence'
  | 'test_result'
  | 'security_review'
  | 'patch_proposal'
  | 'sandbox_decision'
  | 'population';

export type EvidenceEvent = {
  id: string;
  kind: EvidenceEventKind;
  storyId?: string;
  tenantId: string;
  universeId: string;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
  productionAuthorization: false;
};

const MAX_EVENTS = 10_000;

function ledgerPath(root = process.cwd()) {
  return join(root, '.xiv-local', 'evidence-ledger.json');
}

async function load(path: string): Promise<EvidenceEvent[]> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
    return Array.isArray(parsed) ? parsed as EvidenceEvent[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function saveAtomic(path: string, events: EvidenceEvent[]) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(events, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await rename(tempPath, path);
}

export async function appendEvidenceEvent(
  input: Omit<EvidenceEvent, 'id' | 'createdAt' | 'productionAuthorization'>,
  root?: string,
) {
  if (!input.tenantId || !input.universeId || !input.summary.trim()) {
    throw new Error('Evidence events require tenant, Universe, and summary.');
  }
  const path = ledgerPath(root);
  const events = await load(path);
  const next: EvidenceEvent = {
    ...input,
    id: `evt_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    payload: { ...input.payload },
    productionAuthorization: false,
  };
  events.push(next);
  await saveAtomic(path, events.slice(-MAX_EVENTS));
  return next;
}

export async function listEvidenceEvents(input: {
  tenantId: string;
  universeId: string;
  kind?: EvidenceEventKind;
  root?: string;
}) {
  const events = await load(ledgerPath(input.root));
  return events.filter((event) =>
    event.tenantId === input.tenantId &&
    event.universeId === input.universeId &&
    (!input.kind || event.kind === input.kind),
  );
}
