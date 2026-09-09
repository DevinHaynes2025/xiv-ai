/**
 * 62L-DJ Agent Team Operating Marketplace —
 * Agent-team marketplace (reuse DI/DE marketplace patterns).
 * Listing ≠ credentials / billing / deploy authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DJ_LOCKS,
  HONESTY_BANNER,
  MARKETPLACE_LISTING_AUTHORITY_DENIED,
  MAX_MARKETPLACE_LISTINGS,
  type DjActor,
} from './personal-intelligence-command-os-types';

export type AgentTeamOperatingMarketplace = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type AgentTeamListing = {
  id: string;
  marketplaceId: string;
  teamName: string;
  listed: true;
  grantsCredentials: false;
  grantsBilling: false;
  grantsDeploy: false;
  attemptedCredentials: boolean;
  attemptedBilling: boolean;
  attemptedDeploy: boolean;
  status: 'LISTED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  marketplaces: AgentTeamOperatingMarketplace[];
  listings: AgentTeamListing[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-team-operating-marketplace.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { marketplaces: [], listings: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentTeamOperatingMarketplaceHonesty() {
  return {
    banner: HONESTY_BANNER,
    listingGrantsCredentials: DJ_LOCKS.MARKETPLACE_LISTING_GRANTS_CREDENTIALS,
    listingGrantsBilling: DJ_LOCKS.MARKETPLACE_LISTING_GRANTS_BILLING,
    listingGrantsDeploy: DJ_LOCKS.MARKETPLACE_LISTING_GRANTS_DEPLOY,
    listingIsListingOnly: DJ_LOCKS.MARKETPLACE_LISTING_IS_LISTING_ONLY,
    productionAuthorization: DJ_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapAgentTeamOperatingMarketplace(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DjActor;
}): Promise<AgentTeamOperatingMarketplace> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.marketplaces.find(
    (m) =>
      m.orgId === input.orgId &&
      m.tenantId === input.tenantId &&
      m.universeId === input.universeId,
  );
  if (existing) return existing;
  const marketplace: AgentTeamOperatingMarketplace = {
    id: id('djmp'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.marketplaces.push(marketplace);
  await save(input.root, store);
  return marketplace;
}

export async function listAgentTeam(input: {
  marketplaceId: string;
  teamName: string;
  requestCredentials?: boolean;
  requestBilling?: boolean;
  requestDeploy?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{ accepted: boolean; reason: string; listing?: AgentTeamListing; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const marketplace = store.marketplaces.find((m) => m.id === input.marketplaceId);
  if (!marketplace) return { accepted: false, reason: 'MARKETPLACE_NOT_FOUND', at: now };
  if (store.listings.length >= MAX_MARKETPLACE_LISTINGS) {
    return { accepted: false, reason: 'MAX_MARKETPLACE_LISTINGS_BOUNDED', at: now };
  }

  if (
    input.requestCredentials === true ||
    input.requestBilling === true ||
    input.requestDeploy === true
  ) {
    const listing: AgentTeamListing = {
      id: id('djlist'),
      marketplaceId: marketplace.id,
      teamName: input.teamName.trim() || 'unnamed-team',
      listed: true,
      grantsCredentials: false,
      grantsBilling: false,
      grantsDeploy: false,
      attemptedCredentials: input.requestCredentials === true,
      attemptedBilling: input.requestBilling === true,
      attemptedDeploy: input.requestDeploy === true,
      status: 'DENIED',
      reason: MARKETPLACE_LISTING_AUTHORITY_DENIED,
      at: now,
    };
    store.listings.push(listing);
    await save(input.root, store);
    return { accepted: false, reason: MARKETPLACE_LISTING_AUTHORITY_DENIED, listing, at: now };
  }

  const listing: AgentTeamListing = {
    id: id('djlist'),
    marketplaceId: marketplace.id,
    teamName: input.teamName.trim() || 'unnamed-team',
    listed: true,
    grantsCredentials: false,
    grantsBilling: false,
    grantsDeploy: false,
    attemptedCredentials: false,
    attemptedBilling: false,
    attemptedDeploy: false,
    status: 'LISTED',
    reason: 'AGENT_TEAM_LISTED_WITHOUT_AUTHORITY_GRANTS',
    at: now,
  };
  store.listings.push(listing);
  await save(input.root, store);
  return { accepted: true, reason: listing.reason, listing, at: now };
}
