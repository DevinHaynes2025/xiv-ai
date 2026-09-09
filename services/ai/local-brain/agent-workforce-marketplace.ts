/**
 * 62L-DI Agent Workforce Marketplace — listing ≠ authority; RUNNING_VERIFIED needs heartbeat.
 */
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DI_LOCKS, HEARTBEAT_TTL_MS, HONESTY_BANNER, MARKETPLACE_AUTHORITY_DENIED,
  MAX_MARKETPLACE_LISTINGS, NO_HEARTBEAT_NOT_RUNNING_VERIFIED, OVERNIGHT_NO_POWERED_NODE,
  type DiActor, type WorkforceSurfaceStatus,
} from './personalized-intelligence-companion-os-types';

export type MarketplaceListing = {
  id: string; marketplaceId: string; teamName: string; searchable: true;
  grantsCredentials: false; grantsBilling: false; grantsDeploy: false; grantsAuthority: false;
  status: 'LISTED' | 'DENIED'; reason: string; createdAt: string;
};
export type MarketplaceAgent = {
  id: string; marketplaceId: string; name: string; status: WorkforceSurfaceStatus;
  lastHeartbeatAt: string | null; runtimeEvidence: string | null;
  overnightAuthorizedPoweredNode: boolean; logical: true; createdAt: string; updatedAt: string;
};
export type AgentWorkforceMarketplace = { id: string; orgId: string; tenantId: string; universeId: string; createdAt: string };
type Store = { marketplaces: AgentWorkforceMarketplace[]; listings: MarketplaceListing[]; agents: MarketplaceAgent[] };

function storePath(root: string) { return xivLocalPath(root, 'agent-workforce-marketplace.json'); }
async function load(root: string): Promise<Store> { return readJsonFile<Store>(storePath(root), { marketplaces: [], listings: [], agents: [] }); }
async function save(root: string, store: Store) { await writeJsonFileAtomic(storePath(root), store); }
function id(prefix: string) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
function heartbeatFresh(at: string | null, nowMs = Date.now()): boolean {
  if (!at) return false; const ts = Date.parse(at); if (!Number.isFinite(ts)) return false; return nowMs - ts <= HEARTBEAT_TTL_MS;
}

export function agentWorkforceMarketplaceHonesty() {
  return {
    banner: HONESTY_BANNER,
    marketplaceListingGrantsCredentials: DI_LOCKS.MARKETPLACE_LISTING_GRANTS_CREDENTIALS,
    marketplaceListingGrantsBilling: DI_LOCKS.MARKETPLACE_LISTING_GRANTS_BILLING,
    marketplaceListingGrantsDeploy: DI_LOCKS.MARKETPLACE_LISTING_GRANTS_DEPLOY,
    marketplaceListingEqAuthority: DI_LOCKS.MARKETPLACE_LISTING_EQ_AUTHORITY,
    runningVerifiedWithoutHeartbeat: DI_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT,
    overnightRequiresAuthorizedPoweredNode: DI_LOCKS.OVERNIGHT_REQUIRES_AUTHORIZED_POWERED_NODE,
  };
}

export async function bootstrapAgentWorkforceMarketplace(input: {
  orgId: string; tenantId: string; universeId: string; root: string; actor: DiActor;
}): Promise<AgentWorkforceMarketplace> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.marketplaces.find((m) => m.orgId === input.orgId && m.tenantId === input.tenantId && m.universeId === input.universeId);
  if (existing) return existing;
  const marketplace: AgentWorkforceMarketplace = { id: id('diwm'), orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, createdAt: new Date().toISOString() };
  store.marketplaces.push(marketplace); await save(input.root, store); return marketplace;
}

export async function listAgentTeam(input: {
  marketplaceId: string; teamName: string; requestCredentials?: boolean; requestBilling?: boolean;
  requestDeploy?: boolean; requestAuthority?: boolean; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; listing?: MarketplaceListing }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const marketplace = store.marketplaces.find((m) => m.id === input.marketplaceId);
  if (!marketplace) return { accepted: false, reason: 'MARKETPLACE_NOT_FOUND' };
  if (store.listings.length >= MAX_MARKETPLACE_LISTINGS) return { accepted: false, reason: 'MAX_MARKETPLACE_LISTINGS_BOUNDED' };
  if (input.requestCredentials === true || input.requestBilling === true || input.requestDeploy === true || input.requestAuthority === true) {
    const listing: MarketplaceListing = {
      id: id('dilist'), marketplaceId: marketplace.id, teamName: input.teamName.trim() || 'unnamed-team', searchable: true,
      grantsCredentials: false, grantsBilling: false, grantsDeploy: false, grantsAuthority: false,
      status: 'DENIED', reason: MARKETPLACE_AUTHORITY_DENIED, createdAt: now,
    };
    store.listings.push(listing); await save(input.root, store);
    return { accepted: false, reason: MARKETPLACE_AUTHORITY_DENIED, listing };
  }
  const listing: MarketplaceListing = {
    id: id('dilist'), marketplaceId: marketplace.id, teamName: input.teamName.trim() || 'unnamed-team', searchable: true,
    grantsCredentials: false, grantsBilling: false, grantsDeploy: false, grantsAuthority: false,
    status: 'LISTED', reason: 'MARKETPLACE_LISTING_SEARCHABLE_NO_AUTHORITY', createdAt: now,
  };
  store.listings.push(listing); await save(input.root, store);
  return { accepted: true, reason: 'AGENT_TEAM_LISTED_NO_AUTHORITY', listing };
}

export async function registerMarketplaceAgent(input: {
  marketplaceId: string; name: string; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; agent?: MarketplaceAgent }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const marketplace = store.marketplaces.find((m) => m.id === input.marketplaceId);
  if (!marketplace) return { accepted: false, reason: 'MARKETPLACE_NOT_FOUND' };
  const agent: MarketplaceAgent = {
    id: id('diag'), marketplaceId: marketplace.id, name: input.name.trim() || 'unnamed-agent',
    status: 'REGISTERED', lastHeartbeatAt: null, runtimeEvidence: null, overnightAuthorizedPoweredNode: false,
    logical: true, createdAt: now, updatedAt: now,
  };
  store.agents.push(agent); await save(input.root, store);
  return { accepted: true, reason: 'MARKETPLACE_AGENT_REGISTERED_LOGICAL', agent };
}

export async function recordMarketplaceAgentHeartbeat(input: {
  agentId: string; runtimeEvidence?: string | null; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; agent?: MarketplaceAgent }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) return { accepted: false, reason: 'AGENT_NOT_FOUND' };
  agent.lastHeartbeatAt = now;
  agent.runtimeEvidence = input.runtimeEvidence?.trim() || agent.runtimeEvidence;
  agent.status = 'LOGICAL'; agent.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'MARKETPLACE_AGENT_HEARTBEAT_RECORDED', agent };
}

export async function claimMarketplaceAgentRunningVerified(input: {
  agentId: string; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; agent?: MarketplaceAgent }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) return { accepted: false, reason: 'AGENT_NOT_FOUND' };
  if (!heartbeatFresh(agent.lastHeartbeatAt) || !agent.runtimeEvidence) {
    agent.status = agent.lastHeartbeatAt ? 'HEARTBEAT_STALE' : 'LOGICAL';
    agent.updatedAt = now; await save(input.root, store);
    return { accepted: false, reason: NO_HEARTBEAT_NOT_RUNNING_VERIFIED, agent };
  }
  agent.status = 'RUNNING_VERIFIED'; agent.updatedAt = now; await save(input.root, store);
  return { accepted: true, reason: 'MARKETPLACE_AGENT_RUNNING_VERIFIED', agent };
}

export async function scheduleOvernightMarketplaceWork(input: {
  agentId: string; authorizedPoweredNode: boolean; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; agent?: MarketplaceAgent; status?: WorkforceSurfaceStatus }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const agent = store.agents.find((a) => a.id === input.agentId);
  if (!agent) return { accepted: false, reason: 'AGENT_NOT_FOUND' };
  if (!input.authorizedPoweredNode) {
    agent.overnightAuthorizedPoweredNode = false; agent.status = 'WAITING_NODE'; agent.updatedAt = now;
    await save(input.root, store);
    return { accepted: false, reason: OVERNIGHT_NO_POWERED_NODE, agent, status: 'WAITING_NODE' };
  }
  agent.overnightAuthorizedPoweredNode = true; agent.status = 'LOGICAL'; agent.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'OVERNIGHT_AUTHORIZED_POWERED_NODE_SCHEDULED_LOGICAL', agent, status: 'LOGICAL' };
}

export function marketplaceWorkforceSurfaceStatus(agent: MarketplaceAgent, nowMs = Date.now()): WorkforceSurfaceStatus {
  if (agent.status === 'WAITING_NODE' || agent.status === 'OFFLINE_STOPPED') return agent.status;
  if (agent.status === 'RUNNING_VERIFIED' && heartbeatFresh(agent.lastHeartbeatAt, nowMs) && agent.runtimeEvidence) return 'RUNNING_VERIFIED';
  if (agent.lastHeartbeatAt && !heartbeatFresh(agent.lastHeartbeatAt, nowMs)) return 'HEARTBEAT_STALE';
  return agent.status === 'REGISTERED' ? 'REGISTERED' : 'LOGICAL';
}
