/**
 * 62L-DE Agent Gateway Marketplace —
 * Internal capability marketplace for agent gateways/tools/plugins.
 * Listing/registration ≠ credentials, billing, deploy, or broader data access.
 * Missing scope DENIED (deny-by-default).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DE_LOCKS,
  HONESTY_BANNER,
  MARKETPLACE_LISTING_NO_AUTHORITY,
  MAX_MARKETPLACE_LISTINGS,
  MISSING_SCOPE_DENIED,
  type DeActor,
} from './knowledge-exchange-gateway-marketplace-types';

export type MarketplaceListing = {
  id: string;
  name: string;
  capabilityKey: string;
  requiredScopes: string[];
  credentialsGranted: false;
  billingGranted: false;
  deployGranted: false;
  broaderDataAccessGranted: false;
  authorityGranted: false;
  status: 'LISTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type MarketplaceInvoke = {
  id: string;
  listingId: string;
  requestedScopes: string[];
  status: 'ALLOWED' | 'DENIED';
  reason: string;
  credentialsGranted: false;
  billingGranted: false;
  deployGranted: false;
  broaderDataAccessGranted: false;
  at: string;
};

type Store = {
  listings: MarketplaceListing[];
  invokes: MarketplaceInvoke[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-gateway-marketplace.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { listings: [], invokes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentGatewayMarketplaceHonesty() {
  return {
    banner: HONESTY_BANNER,
    listingGrantsCredentials: DE_LOCKS.MARKETPLACE_LISTING_GRANTS_CREDENTIALS,
    listingGrantsBilling: DE_LOCKS.MARKETPLACE_LISTING_GRANTS_BILLING,
    listingGrantsDeploy: DE_LOCKS.MARKETPLACE_LISTING_GRANTS_DEPLOY,
    listingGrantsBroaderDataAccess:
      DE_LOCKS.MARKETPLACE_LISTING_GRANTS_BROADER_DATA_ACCESS,
    missingScopeAllowed: DE_LOCKS.MARKETPLACE_MISSING_SCOPE_ALLOWED,
    founderSealedDenyByDefault: DE_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}

export async function listGatewayCapability(input: {
  name: string;
  capabilityKey: string;
  requiredScopes: string[];
  root: string;
  actor: DeActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  listing?: MarketplaceListing;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.listings.length >= MAX_MARKETPLACE_LISTINGS) {
    return { accepted: false, reason: 'MAX_MARKETPLACE_LISTINGS_BOUNDED', at: now };
  }
  const listing: MarketplaceListing = {
    id: id('agm'),
    name: input.name.trim() || 'unnamed-capability',
    capabilityKey: input.capabilityKey.trim().toLowerCase(),
    requiredScopes: (input.requiredScopes ?? []).map((s) => s.trim()).filter(Boolean),
    credentialsGranted: false,
    billingGranted: false,
    deployGranted: false,
    broaderDataAccessGranted: false,
    authorityGranted: false,
    status: 'LISTED',
    reason: MARKETPLACE_LISTING_NO_AUTHORITY,
    createdAt: now,
  };
  store.listings.push(listing);
  await save(input.root, store);
  return { accepted: true, reason: listing.reason, listing, at: now };
}

export async function invokeMarketplaceCapability(input: {
  listingId: string;
  requestedScopes?: string[];
  actorScopes?: string[];
  root: string;
  actor: DeActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  invoke?: MarketplaceInvoke;
  listing?: MarketplaceListing;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const listing = store.listings.find((l) => l.id === input.listingId);
  const requested = (input.requestedScopes ?? []).map((s) => s.trim()).filter(Boolean);
  const held = new Set(
    [...(input.actorScopes ?? []), ...(input.actor.scopes ?? [])].map((s) => s.trim()),
  );

  if (!listing) {
    const invoke: MarketplaceInvoke = {
      id: id('agmi'),
      listingId: input.listingId,
      requestedScopes: requested,
      status: 'DENIED',
      reason: 'MARKETPLACE_LISTING_NOT_FOUND',
      credentialsGranted: false,
      billingGranted: false,
      deployGranted: false,
      broaderDataAccessGranted: false,
      at: now,
    };
    store.invokes.push(invoke);
    await save(input.root, store);
    return { accepted: false, reason: invoke.reason, invoke, at: now };
  }

  const required = listing.requiredScopes;
  const missingReq = required.filter((s) => !held.has(s));
  if (required.length > 0 && missingReq.length > 0) {
    const invoke: MarketplaceInvoke = {
      id: id('agmi'),
      listingId: listing.id,
      requestedScopes: requested,
      status: 'DENIED',
      reason: MISSING_SCOPE_DENIED,
      credentialsGranted: false,
      billingGranted: false,
      deployGranted: false,
      broaderDataAccessGranted: false,
      at: now,
    };
    store.invokes.push(invoke);
    await save(input.root, store);
    return { accepted: false, reason: invoke.reason, invoke, listing, at: now };
  }

  // Even allowed invoke never grants credentials/billing/deploy/broader access.
  const invoke: MarketplaceInvoke = {
    id: id('agmi'),
    listingId: listing.id,
    requestedScopes: requested,
    status: 'ALLOWED',
    reason: 'MARKETPLACE_INVOKE_ALLOWED_WITHOUT_AUTHORITY_ESCALATION',
    credentialsGranted: false,
    billingGranted: false,
    deployGranted: false,
    broaderDataAccessGranted: false,
    at: now,
  };
  store.invokes.push(invoke);
  await save(input.root, store);
  return { accepted: true, reason: invoke.reason, invoke, listing, at: now };
}

/** Explicit deny path when caller requests a scope not in listing and not held. */
export async function requestMarketplaceScope(input: {
  listingId: string;
  scope: string;
  actorScopes?: string[];
  root: string;
  actor: DeActor;
}): Promise<{ accepted: boolean; reason: string; at: string }> {
  const held = new Set(
    [...(input.actorScopes ?? []), ...(input.actor.scopes ?? [])].map((s) => s.trim()),
  );
  const scope = input.scope.trim();
  if (!scope || !held.has(scope)) {
    const store = await load(input.root);
    const now = new Date().toISOString();
    store.invokes.push({
      id: id('agmi'),
      listingId: input.listingId,
      requestedScopes: [scope],
      status: 'DENIED',
      reason: MISSING_SCOPE_DENIED,
      credentialsGranted: false,
      billingGranted: false,
      deployGranted: false,
      broaderDataAccessGranted: false,
      at: now,
    });
    await save(input.root, store);
    return { accepted: false, reason: MISSING_SCOPE_DENIED, at: now };
  }
  return invokeMarketplaceCapability({
    listingId: input.listingId,
    requestedScopes: [scope],
    actorScopes: input.actorScopes,
    root: input.root,
    actor: input.actor,
  }).then((r) => ({ accepted: r.accepted, reason: r.reason, at: r.at }));
}
