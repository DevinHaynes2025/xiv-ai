/**
 * 62L-DX Module G — Industry Pack Marketplace.
 * Modular packs; listing ≠ auto-grant; wedge-first gate (supply-chain pilot first).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  LISTING_NEQ_AUTO_GRANT,
  MAX_MARKETPLACE_LISTINGS,
  WEDGE_FIRST_GATED,
  type DxActor,
} from './autonomous-supply-chain-ops-types';

export type IndustryPackDomain =
  | 'supply_chain'
  | 'healthcare'
  | 'finance'
  | 'manufacturing'
  | 'retail'
  | 'other';

export type IndustryPackListing = {
  id: string;
  packId: string;
  domain: IndustryPackDomain;
  listed: true;
  autoGranted: false;
  trustAuthority: false;
  wedgeGatePassed: boolean;
  status: 'listed_only' | 'denied';
  reason: string;
  createdAt: string;
};

export type IndustryPackInstallAttempt = {
  id: string;
  packId: string;
  listingId: string;
  autoGrantClaimed: boolean;
  status: 'denied' | 'install_requires_explicit_grant';
  reason: string;
  at: string;
};

type Store = {
  listings: IndustryPackListing[];
  installs: IndustryPackInstallAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'industry-pack-marketplace.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { listings: [], installs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function industryPackMarketplaceHonesty() {
  return {
    listingEqAutoGrant: false,
    listingEqTrustAuthority: false,
    wedgeFirstSupplyChainPilot: true,
  };
}

export async function listIndustryPack(input: {
  packId: string;
  domain: IndustryPackDomain;
  claimAutoGrant?: boolean;
  founderWedgeOverride?: boolean;
  root: string;
  actor: DxActor;
}): Promise<IndustryPackListing> {
  const store = await load(input.root);
  void input.actor;
  if (store.listings.length >= MAX_MARKETPLACE_LISTINGS) {
    throw new Error('MAX_MARKETPLACE_LISTINGS_REACHED');
  }

  const isSupplyChain = input.domain === 'supply_chain';
  const wedgeOk = isSupplyChain || input.founderWedgeOverride === true;

  let status: IndustryPackListing['status'] = 'listed_only';
  let reason = 'INDUSTRY_PACK_LISTED_NEQ_AUTO_GRANT';

  if (!wedgeOk) {
    status = 'denied';
    reason = WEDGE_FIRST_GATED;
  } else if (input.claimAutoGrant === true) {
    status = 'denied';
    reason = LISTING_NEQ_AUTO_GRANT;
  }

  const listing: IndustryPackListing = {
    id: id('dxpack'),
    packId: input.packId,
    domain: input.domain,
    listed: true,
    autoGranted: false,
    trustAuthority: false,
    wedgeGatePassed: wedgeOk,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.listings.push(listing);
  await save(input.root, store);
  return listing;
}

export async function attemptPackInstallFromListing(input: {
  listingId: string;
  packId: string;
  claimAutoGrantFromListing: boolean;
  root: string;
  actor: DxActor;
}): Promise<IndustryPackInstallAttempt> {
  const store = await load(input.root);
  void input.actor;
  const attempt: IndustryPackInstallAttempt = {
    id: id('dxinst'),
    packId: input.packId,
    listingId: input.listingId,
    autoGrantClaimed: input.claimAutoGrantFromListing,
    status: input.claimAutoGrantFromListing
      ? 'denied'
      : 'install_requires_explicit_grant',
    reason: input.claimAutoGrantFromListing
      ? LISTING_NEQ_AUTO_GRANT
      : 'INSTALL_REQUIRES_EXPLICIT_FOUNDER_OR_HUMAN_GRANT',
    at: new Date().toISOString(),
  };
  store.installs.push(attempt);
  await save(input.root, store);
  return attempt;
}
