/**
 * 62L-EI Module C — Enterprise Plugin Federation.
 * Salesforce/Oracle-compatible + retail connector packs as INTEGRATION_CANDIDATE /
 * UNVERIFIED_RELATIONSHIP until evidence. Plugin trust ≠ auto-grant.
 * Adapter contracts ≠ proprietary source/schema copy. Unconfigured → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADAPTER_NEQ_PROPRIETARY,
  ENTERPRISE_BRAND_CANDIDATES,
  INTEGRATION_CANDIDATE_LABEL,
  MAX_PLUGIN_EVENTS,
  PLUGIN_TRUST_NEQ_AUTO_GRANT,
  UNCONFIGURED_CONNECTOR_UNAVAILABLE,
  UNVERIFIED_RELATIONSHIP_LABEL,
  type EiActor,
  type EiEvidenceState,
} from './chip-to-cloud-cognitive-fabric-types';

export type PluginBrandRegistration = {
  id: string;
  brand: string;
  relationshipEvidencePresent: boolean;
  status: 'candidate' | 'denied';
  state: EiEvidenceState;
  relationshipLabel: typeof INTEGRATION_CANDIDATE_LABEL | typeof UNVERIFIED_RELATIONSHIP_LABEL;
  reason: string;
  activePartnershipClaimed: false;
  customerStatusClaimed: false;
  at: string;
};

export type PluginTrustScore = {
  id: string;
  pluginId: string;
  trustScore: number;
  status: 'scored_no_grant' | 'denied';
  state: EiEvidenceState;
  reason: string;
  authorityGranted: false;
  marketplaceListingEqTrust: false;
  at: string;
};

export type ConnectorAvailability = {
  id: string;
  connectorId: string;
  configured: boolean;
  status: 'ok' | 'unavailable';
  state: EiEvidenceState;
  reason: string;
  at: string;
};

export type AdapterContractProbe = {
  id: string;
  vendor: string;
  claimProprietaryCopy: boolean;
  status: 'denied' | 'contract_only';
  state: EiEvidenceState;
  reason: string;
  proprietaryCopyAllowed: false;
  at: string;
};

type Store = {
  brands: PluginBrandRegistration[];
  trust: PluginTrustScore[];
  connectors: ConnectorAvailability[];
  adapters: AdapterContractProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'enterprise-plugin-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    brands: [],
    trust: [],
    connectors: [],
    adapters: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function enterprisePluginFederationHonesty() {
  return {
    brandsAreIntegrationCandidatesUntilEvidence: true,
    unverifiedRelationshipDefault: true,
    pluginTrustNeqAutoGrant: true,
    marketplaceListingNeqTrust: true,
    adapterContractNeqProprietaryCopy: true,
    unconfiguredUnavailable: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerEnterpriseBrandCandidate(input: {
  brand: string;
  relationshipEvidencePresent: boolean;
  root: string;
  actor: EiActor;
}): Promise<PluginBrandRegistration> {
  const store = await load(input.root);
  void input.actor;
  if (store.brands.length >= MAX_PLUGIN_EVENTS) {
    throw new Error('MAX_PLUGIN_EVENTS');
  }
  const brand = input.brand.trim().toLowerCase();
  const isKnownCandidate = (ENTERPRISE_BRAND_CANDIDATES as readonly string[]).includes(
    brand,
  );
  // Even with "evidence flag", without verified production authority we stay candidate.
  // Evidence present still does not auto-claim partnership in this park-and-implement surface.
  const label = input.relationshipEvidencePresent
    ? INTEGRATION_CANDIDATE_LABEL
    : UNVERIFIED_RELATIONSHIP_LABEL;
  const rec: PluginBrandRegistration = {
    id: id('eibrand'),
    brand,
    relationshipEvidencePresent: input.relationshipEvidencePresent,
    status: 'candidate',
    state: 'INTEGRATION_CANDIDATE',
    relationshipLabel: label,
    reason: isKnownCandidate
      ? INTEGRATION_CANDIDATE_LABEL
      : INTEGRATION_CANDIDATE_LABEL,
    activePartnershipClaimed: false,
    customerStatusClaimed: false,
    at: new Date().toISOString(),
  };
  store.brands.push(rec);
  await save(input.root, store);
  return rec;
}

export async function scorePluginTrust(input: {
  pluginId: string;
  trustScore: number;
  requestAutoGrant: boolean;
  root: string;
  actor: EiActor;
}): Promise<PluginTrustScore> {
  const store = await load(input.root);
  void input.actor;
  const score: PluginTrustScore = {
    id: id('eitrust'),
    pluginId: input.pluginId.trim(),
    trustScore: input.trustScore,
    status: 'scored_no_grant',
    state: 'TRUST_SCORED_NO_GRANT',
    reason: PLUGIN_TRUST_NEQ_AUTO_GRANT,
    authorityGranted: false,
    marketplaceListingEqTrust: false,
    at: new Date().toISOString(),
  };
  void input.requestAutoGrant;
  store.trust.push(score);
  await save(input.root, store);
  return score;
}

export async function probePluginConnector(input: {
  connectorId: string;
  configured: boolean;
  root: string;
  actor: EiActor;
}): Promise<ConnectorAvailability> {
  const store = await load(input.root);
  void input.actor;
  const probe: ConnectorAvailability = {
    id: id('eiconn'),
    connectorId: input.connectorId.trim(),
    configured: input.configured,
    status: input.configured ? 'ok' : 'unavailable',
    state: input.configured ? 'CONFIGURED' : 'UNAVAILABLE',
    reason: input.configured
      ? 'CONNECTOR_CONFIGURED'
      : UNCONFIGURED_CONNECTOR_UNAVAILABLE,
    at: new Date().toISOString(),
  };
  store.connectors.push(probe);
  await save(input.root, store);
  return probe;
}

export async function probeAdapterProprietaryCopy(input: {
  vendor: string;
  claimProprietaryCopy: boolean;
  root: string;
  actor: EiActor;
}): Promise<AdapterContractProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: AdapterContractProbe = {
    id: id('eiadapt'),
    vendor: input.vendor.trim().toLowerCase(),
    claimProprietaryCopy: input.claimProprietaryCopy,
    status: input.claimProprietaryCopy ? 'denied' : 'contract_only',
    state: input.claimProprietaryCopy ? 'DENIED' : 'ADAPTER_CONTRACT_ONLY',
    reason: ADAPTER_NEQ_PROPRIETARY,
    proprietaryCopyAllowed: false,
    at: new Date().toISOString(),
  };
  store.adapters.push(probe);
  await save(input.root, store);
  return probe;
}
