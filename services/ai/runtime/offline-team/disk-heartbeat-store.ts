import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export type AgentHeartbeat = {
  tenantId: string;
  agentId: string;
  status: 'ACTIVE' | 'IDLE' | 'PAUSED' | 'OFFLINE' | 'UNVERIFIED';
  observedAt: string;
  evidenceRef?: string;
};

const ROOT = resolve(process.cwd(), '.xiv-runtime');
const FILE = resolve(ROOT, 'heartbeats', 'agents.jsonl');

export async function appendHeartbeat(hb: AgentHeartbeat): Promise<void> {
  await mkdir(dirname(FILE), { recursive: true });
  await appendFile(FILE, JSON.stringify(hb) + '\n', 'utf8');
}

export async function readLatestHeartbeats(): Promise<Record<string, AgentHeartbeat>> {
  try {
    const lines = (await readFile(FILE, 'utf8')).trim().split(/\r?\n/).filter(Boolean);
    const latest: Record<string, AgentHeartbeat> = {};
    for (const line of lines) {
      const hb = JSON.parse(line) as AgentHeartbeat;
      latest[`${hb.tenantId}:${hb.agentId}`] = hb;
    }
    return latest;
  } catch {
    return {};
  }
}

export const diskHeartbeatPolicy = { persistent: true, topSecretPayloadAllowed: false, activeAgentLimit: 8 };
