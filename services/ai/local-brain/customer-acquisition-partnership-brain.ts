/**
 * 62L-DT Module B — Customer Acquisition & Partnership Brain.
 * Design partners / partnership discovery = authorized data only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DESIGN_PARTNER_AUTHORIZED_ONLY,
  MAX_PARTNERS,
  PRIVATE_UNIVERSE_DENIED,
  UNAUTHORIZED_PARTNERSHIP_DENIED,
  type DtActor,
} from './growth-operating-system-types';

export type PartnershipDiscovery = {
  id: string;
  partnerName: string;
  dataAuthorized: boolean;
  outreachAuthorized: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  createdAt: string;
};

export type DesignPartnerEnrollment = {
  id: string;
  partnerName: string;
  dataAuthorized: boolean;
  status: 'enrolled_candidate' | 'denied';
  reason: string;
  createdAt: string;
};

export type PrivateUniverseAccess = {
  id: string;
  universeId: string;
  labelPresent: boolean;
  explicitGrant: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  discoveries: PartnershipDiscovery[];
  designPartners: DesignPartnerEnrollment[];
  universeAccess: PrivateUniverseAccess[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'customer-acquisition-partnership-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    discoveries: [],
    designPartners: [],
    universeAccess: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function customerAcquisitionPartnershipBrainHonesty() {
  return {
    unauthorizedOutreachAllowed: false,
    unauthorizedDataUseAllowed: false,
    labelAloneEqAccess: false,
    privateUniversesDenyByDefault: true,
    authorizedDataOnly: true,
  };
}

export async function discoverPartnership(input: {
  partnerName: string;
  dataAuthorized: boolean;
  outreachAuthorized: boolean;
  root: string;
  actor: DtActor;
}): Promise<PartnershipDiscovery> {
  const store = await load(input.root);
  void input.actor;
  if (store.discoveries.length >= MAX_PARTNERS) throw new Error('MAX_PARTNERS_REACHED');
  const allowed = input.dataAuthorized && input.outreachAuthorized;
  const discovery: PartnershipDiscovery = {
    id: id('dtpart'),
    partnerName: input.partnerName.trim(),
    dataAuthorized: input.dataAuthorized,
    outreachAuthorized: input.outreachAuthorized,
    status: allowed ? 'allowed' : 'denied',
    reason: allowed
      ? 'PARTNERSHIP_DISCOVERY_AUTHORIZED_INTEL_ONLY'
      : UNAUTHORIZED_PARTNERSHIP_DENIED,
    createdAt: new Date().toISOString(),
  };
  store.discoveries.push(discovery);
  await save(input.root, store);
  return discovery;
}

export async function enrollDesignPartner(input: {
  partnerName: string;
  dataAuthorized: boolean;
  root: string;
  actor: DtActor;
}): Promise<DesignPartnerEnrollment> {
  const store = await load(input.root);
  void input.actor;
  const enrollment: DesignPartnerEnrollment = {
    id: id('dtdesign'),
    partnerName: input.partnerName.trim(),
    dataAuthorized: input.dataAuthorized,
    status: input.dataAuthorized ? 'enrolled_candidate' : 'denied',
    reason: input.dataAuthorized
      ? 'DESIGN_PARTNER_CANDIDATE_AUTHORIZED_DATA'
      : DESIGN_PARTNER_AUTHORIZED_ONLY,
    createdAt: new Date().toISOString(),
  };
  store.designPartners.push(enrollment);
  await save(input.root, store);
  return enrollment;
}

export async function accessPrivateUniverse(input: {
  universeId: string;
  labelPresent: boolean;
  explicitGrant: boolean;
  root: string;
  actor: DtActor;
}): Promise<PrivateUniverseAccess> {
  const store = await load(input.root);
  void input.actor;
  const allowed = input.explicitGrant === true;
  const access: PrivateUniverseAccess = {
    id: id('dtuniv'),
    universeId: input.universeId,
    labelPresent: input.labelPresent,
    explicitGrant: input.explicitGrant,
    status: allowed ? 'allowed' : 'denied',
    reason: allowed ? 'PRIVATE_UNIVERSE_EXPLICIT_GRANT' : PRIVATE_UNIVERSE_DENIED,
    at: new Date().toISOString(),
  };
  store.universeAccess.push(access);
  await save(input.root, store);
  return access;
}
