/**
 * 62L-DP Universal Connector Marketplace —
 * Searchable connector marketplace with machine-readable manifests.
 * Listing ≠ trusted / ≠ authority. Registration ≠ billing/credentials/deploy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MARKETPLACE_LISTING_NOT_TRUSTED,
  MAX_MARKETPLACE_LISTINGS,
  REGISTRATION_NO_BILLING_CREDS_DEPLOY,
  type ConnectorCategory,
  type DpActor,
  type PermissionScope,
  type TrustState,
} from './plugin-civilization-os-types';

export type ConnectorManifest = {
  id: string;
  name: string;
  version: string;
  schemaVersion: string;
  category: ConnectorCategory;
  scopes: PermissionScope[];
  listed: boolean;
  installed: boolean;
  configured: boolean;
  verified: boolean;
  approved: boolean;
  agentBuilt: boolean;
  sandbox: boolean;
  trustState: TrustState;
  grantsAuthority: false;
  grantsCredentials: false;
  grantsBilling: false;
  grantsDeploy: false;
  grantsBroaderDataAccess: false;
  searchableTags: string[];
  reason: string;
  createdAt: string;
};

export type MarketplaceSearchHit = {
  manifestId: string;
  name: string;
  category: ConnectorCategory;
  listed: boolean;
  trusted: false;
  authority: false;
  reason: string;
};

type Store = {
  listings: ConnectorManifest[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-connector-marketplace.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { listings: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalConnectorMarketplaceHonesty() {
  return {
    listingEqTrusted: false,
    listingEqAuthority: false,
    registrationGrantsBilling: false,
    registrationGrantsCredentials: false,
    registrationGrantsDeploy: false,
    machineReadableManifests: true,
  };
}

export async function listConnectorOnMarketplace(input: {
  name: string;
  version: string;
  schemaVersion?: string;
  category: ConnectorCategory;
  scopes?: PermissionScope[];
  tags?: string[];
  agentBuilt?: boolean;
  root: string;
  actor: DpActor;
}): Promise<ConnectorManifest> {
  const store = await load(input.root);
  void input.actor;
  if (store.listings.length >= MAX_MARKETPLACE_LISTINGS) {
    throw new Error('MAX_MARKETPLACE_LISTINGS_REACHED');
  }
  const agentBuilt = input.agentBuilt === true;
  const listing: ConnectorManifest = {
    id: id('dpconn'),
    name: input.name.trim(),
    version: input.version.trim(),
    schemaVersion: (input.schemaVersion ?? '1.0.0').trim(),
    category: input.category,
    scopes: input.scopes ?? ['read'],
    listed: true,
    installed: false,
    configured: false,
    verified: false,
    approved: false,
    agentBuilt,
    sandbox: agentBuilt || true,
    trustState: agentBuilt ? 'sandbox' : 'listed',
    grantsAuthority: false,
    grantsCredentials: false,
    grantsBilling: false,
    grantsDeploy: false,
    grantsBroaderDataAccess: false,
    searchableTags: input.tags ?? [],
    reason: MARKETPLACE_LISTING_NOT_TRUSTED,
    createdAt: new Date().toISOString(),
  };
  store.listings.push(listing);
  await save(input.root, store);
  return listing;
}

export async function searchMarketplace(input: {
  query?: string;
  category?: ConnectorCategory;
  root: string;
}): Promise<MarketplaceSearchHit[]> {
  const store = await load(input.root);
  const q = (input.query ?? '').trim().toLowerCase();
  return store.listings
    .filter((l) => l.listed)
    .filter((l) => (input.category ? l.category === input.category : true))
    .filter((l) =>
      !q
        ? true
        : l.name.toLowerCase().includes(q) ||
          l.searchableTags.some((t) => t.toLowerCase().includes(q)),
    )
    .map((l) => ({
      manifestId: l.id,
      name: l.name,
      category: l.category,
      listed: true,
      trusted: false as const,
      authority: false as const,
      reason: MARKETPLACE_LISTING_NOT_TRUSTED,
    }));
}

export async function probeMarketplaceAuthority(input: {
  manifestId: string;
  claimBilling?: boolean;
  claimCredentials?: boolean;
  claimDeploy?: boolean;
  claimAuthority?: boolean;
  root: string;
  actor: DpActor;
}): Promise<{
  status: 'denied';
  trusted: false;
  authority: false;
  grantsBilling: false;
  grantsCredentials: false;
  grantsDeploy: false;
  reason: string;
}> {
  void input;
  return {
    status: 'denied',
    trusted: false,
    authority: false,
    grantsBilling: false,
    grantsCredentials: false,
    grantsDeploy: false,
    reason:
      input.claimBilling || input.claimCredentials || input.claimDeploy
        ? REGISTRATION_NO_BILLING_CREDS_DEPLOY
        : MARKETPLACE_LISTING_NOT_TRUSTED,
  };
}

export async function getMarketplaceListing(input: {
  manifestId: string;
  root: string;
}): Promise<ConnectorManifest | null> {
  const store = await load(input.root);
  return store.listings.find((l) => l.id === input.manifestId) ?? null;
}

export async function markMarketplaceVerified(input: {
  manifestId: string;
  approve?: boolean;
  root: string;
  actor: DpActor;
}): Promise<ConnectorManifest | null> {
  const store = await load(input.root);
  void input.actor;
  const listing = store.listings.find((l) => l.id === input.manifestId);
  if (!listing) return null;
  listing.verified = true;
  listing.approved = input.approve === true;
  listing.sandbox = listing.agentBuilt && !listing.approved;
  listing.trustState = listing.approved ? 'approved' : 'verified';
  listing.reason = listing.approved
    ? 'MARKETPLACE_XIV_VERIFIED_APPROVED'
    : 'MARKETPLACE_XIV_VERIFIED_PENDING_APPROVAL';
  await save(input.root, store);
  return listing;
}
