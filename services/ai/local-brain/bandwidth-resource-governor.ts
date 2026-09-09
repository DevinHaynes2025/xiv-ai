import { getAppNetworkNode } from './compromised-node-quarantine';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { NodeProfile } from './distributed-app-network-types';

export const GOVERNOR_FILE = 'app-network-governors.json';

export type NetworkBudget = {
  nodeId: string;
  tenantId: string;
  universeId: string;
  profile: NodeProfile;
  limits: { bandwidthBytes: number; transfers: number; cacheBytes: number };
  used: { bandwidthBytes: number; transfers: number; cacheBytes: number };
};

type GovernorStore = { budgets: NetworkBudget[] };

const PROFILE_LIMITS: Record<NodeProfile, NetworkBudget['limits']> = {
  mobile: { bandwidthBytes: 8_192, transfers: 2, cacheBytes: 16_384 },
  desktop: { bandwidthBytes: 65_536, transfers: 8, cacheBytes: 131_072 },
};

function storePath(root: string) {
  return xivLocalPath(root, GOVERNOR_FILE);
}

async function load(root: string) {
  const parsed = await readJsonFile<GovernorStore>(storePath(root), { budgets: [] });
  return Array.isArray(parsed.budgets) ? parsed.budgets : [];
}

async function save(root: string, budgets: NetworkBudget[]) {
  await writeJsonFileAtomic(storePath(root), { budgets: budgets.slice(-1_000) });
}

export async function ensureNetworkBudget(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const node = await getAppNetworkNode(input);
  if (!node) throw new Error('APP_NETWORK_NODE_NOT_FOUND');
  const budgets = await load(root);
  let budget = budgets.find((item) => item.nodeId === input.nodeId);
  if (!budget) {
    budget = {
      nodeId: input.nodeId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      profile: node.profile,
      limits: { ...PROFILE_LIMITS[node.profile] },
      used: { bandwidthBytes: 0, transfers: 0, cacheBytes: 0 },
    };
    budgets.push(budget);
    await save(root, budgets);
  }
  return budget;
}

export async function consumeNetworkBudget(input: {
  nodeId: string;
  tenantId: string;
  universeId: string;
  bytes?: number;
  transfers?: number;
  cacheBytes?: number;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  await ensureNetworkBudget(input);
  const budgets = await load(root);
  const budget = budgets.find((item) => item.nodeId === input.nodeId);
  if (!budget) throw new Error('NETWORK_BUDGET_NOT_FOUND');
  const next = {
    bandwidthBytes: budget.used.bandwidthBytes + (input.bytes ?? 0),
    transfers: budget.used.transfers + (input.transfers ?? 0),
    cacheBytes: budget.used.cacheBytes + (input.cacheBytes ?? 0),
  };
  if (next.bandwidthBytes > budget.limits.bandwidthBytes) {
    return { allowed: false as const, state: 'DENIED' as const, reason: 'Bandwidth governor denied the transfer.', budget };
  }
  if (next.transfers > budget.limits.transfers) {
    return { allowed: false as const, state: 'DENIED' as const, reason: 'Concurrent/transfer governor denied the transfer.', budget };
  }
  if (next.cacheBytes > budget.limits.cacheBytes) {
    return { allowed: false as const, state: 'DENIED' as const, reason: 'Edge-cache resource governor denied the write.', budget };
  }
  budget.used = next;
  await save(root, budgets);
  return { allowed: true as const, state: 'PASS' as const, reason: 'Within bandwidth and resource governors.', budget };
}

export function profileLimits(profile: NodeProfile) {
  return { ...PROFILE_LIMITS[profile], nodeCannotSelfExpand: true as const };
}
