import { createHash } from 'node:crypto';

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { hashLakeContent, ingestLakeSource, listLakeObjects } from './knowledge-lake';
import {
  type EconomyEvidenceState,
  type InformationClassification,
} from './information-economy-types';

export type InformationSku = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  domain: string;
  contentHash: string;
  demandFingerprint: string;
  lakeObjectId?: string;
  sourceId: string;
  sourceUri: string;
  classification: InformationClassification;
  qualified: boolean;
  onHandRefs: number;
  sealed: boolean;
  createdAt: string;
  productionAuthorization: false;
};

export type InformationBom = {
  id: string;
  tenantId: string;
  universeId: string;
  parentSkuId: string;
  componentSkuIds: string[];
  copiesPayload: false;
  createdAt: string;
};

export type SourceQualification = {
  sourceId: string;
  sourceUri: string;
  state: EconomyEvidenceState;
  qualified: boolean;
  reason: string;
  inventedPartnership: false;
  providerVerified: boolean;
};

type SkuStore = { skus: InformationSku[]; boms: InformationBom[]; sources: SourceQualification[] };

function storePath(root: string) {
  return xivLocalPath(root, 'information-skus.json');
}

async function load(root: string): Promise<SkuStore> {
  const parsed = await readJsonFile<SkuStore>(storePath(root), { skus: [], boms: [], sources: [] });
  return {
    skus: Array.isArray(parsed.skus) ? parsed.skus : [],
    boms: Array.isArray(parsed.boms) ? parsed.boms : [],
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
  };
}

async function save(root: string, store: SkuStore) {
  await writeJsonFileAtomic(storePath(root), {
    skus: store.skus.slice(-10_000),
    boms: store.boms.slice(-10_000),
    sources: store.sources.slice(-10_000),
  });
}

export function fingerprintDemand(query: string) {
  return createHash('sha256').update(query.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase()).digest('hex');
}

export function qualifyInformationSource(input: {
  sourceId: string;
  sourceUri: string;
  provenanceRefs: string[];
  providerConfigured?: boolean;
  providerVerified?: boolean;
  partnershipClaimed?: boolean;
  sealed?: boolean;
  invented?: boolean;
}): SourceQualification {
  if (input.partnershipClaimed || input.invented) {
    return {
      sourceId: input.sourceId,
      sourceUri: input.sourceUri,
      state: 'DENIED',
      qualified: false,
      reason: 'Partnerships are not invented. Unverified counterparties stay unqualified.',
      inventedPartnership: false,
      providerVerified: false,
    };
  }
  if (input.sealed) {
    return {
      sourceId: input.sourceId,
      sourceUri: input.sourceUri,
      state: 'DENIED',
      qualified: false,
      reason: 'CEO-sealed sources are outside ordinary information SKU qualification.',
      inventedPartnership: false,
      providerVerified: false,
    };
  }
  if (input.providerConfigured && !input.providerVerified) {
    return {
      sourceId: input.sourceId,
      sourceUri: input.sourceUri,
      state: 'UNAVAILABLE',
      qualified: false,
      reason: 'Providers remain UNAVAILABLE until configured, authorized, and verified.',
      inventedPartnership: false,
      providerVerified: false,
    };
  }
  if (!input.provenanceRefs.length) {
    return {
      sourceId: input.sourceId,
      sourceUri: input.sourceUri,
      state: 'UNKNOWN',
      qualified: false,
      reason: 'Empty provenance cannot qualify a source.',
      inventedPartnership: false,
      providerVerified: false,
    };
  }
  return {
    sourceId: input.sourceId,
    sourceUri: input.sourceUri,
    state: 'PASS',
    qualified: true,
    reason: 'Local source has provenance and is not an invented partnership.',
    inventedPartnership: false,
    providerVerified: input.providerVerified === true,
  };
}

export async function registerInformationSku(input: {
  tenantId: string;
  universeId: string;
  title: string;
  domain: string;
  originalText: string;
  sourceId: string;
  sourceUri: string;
  sourceLanguage?: string;
  provenanceRefs: string[];
  classification?: InformationClassification;
  sealed?: boolean;
  root?: string;
}): Promise<{ sku: InformationSku; duplicate: boolean; movementBytes: number }> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const contentHash = hashLakeContent(input.sourceLanguage ?? 'en', input.originalText);
  const existing = store.skus.find(
    (item) => item.tenantId === input.tenantId && item.universeId === input.universeId && item.contentHash === contentHash,
  );
  if (existing) {
    existing.onHandRefs += 1;
    await save(root, store);
    return { sku: existing, duplicate: true, movementBytes: 0 };
  }

  let lakeObjectId: string | undefined;
  if (!input.sealed) {
    const ingested = await ingestLakeSource({
      tenantId: input.tenantId,
      universeId: input.universeId,
      industry: input.domain,
      partition: 'business',
      sourceUri: input.sourceUri,
      sourceLanguage: input.sourceLanguage ?? 'en',
      originalText: input.originalText,
      provenanceRefs: input.provenanceRefs,
      classification: input.classification === 'sealed_founder_priority' ? 'restricted' : (input.classification ?? 'internal'),
      root,
    });
    lakeObjectId = ingested.object.id;
  }

  const sku: InformationSku = {
    id: cortexId('isku'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: input.title,
    domain: input.domain,
    contentHash,
    demandFingerprint: fingerprintDemand(`${input.title}\n${input.originalText}`),
    lakeObjectId,
    sourceId: input.sourceId,
    sourceUri: input.sourceUri,
    classification: input.sealed ? 'sealed_founder_priority' : (input.classification ?? 'internal'),
    qualified: !input.sealed,
    onHandRefs: 1,
    sealed: Boolean(input.sealed),
    createdAt: new Date().toISOString(),
    productionAuthorization: false,
  };
  store.skus.push(sku);
  await save(root, store);
  return { sku, duplicate: false, movementBytes: input.sealed ? 0 : Buffer.byteLength(input.originalText, 'utf8') };
}

export async function registerInformationBom(input: {
  tenantId: string;
  universeId: string;
  parentSkuId: string;
  componentSkuIds: string[];
  root?: string;
}): Promise<InformationBom> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const parent = store.skus.find((item) => item.id === input.parentSkuId && item.tenantId === input.tenantId);
  if (!parent) throw new Error('BOM_PARENT_SKU_NOT_FOUND');
  if (parent.tenantId !== input.tenantId || parent.universeId !== input.universeId) {
    throw new Error('BOM_CROSS_SCOPE_DENIED');
  }
  for (const componentId of input.componentSkuIds) {
    const component = store.skus.find((item) => item.id === componentId);
    if (!component || component.tenantId !== input.tenantId || component.universeId !== input.universeId) {
      throw new Error('BOM_COMPONENT_SCOPE_DENIED');
    }
  }
  const bom: InformationBom = {
    id: cortexId('ibom'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    parentSkuId: input.parentSkuId,
    componentSkuIds: [...input.componentSkuIds],
    copiesPayload: false,
    createdAt: new Date().toISOString(),
  };
  store.boms.push(bom);
  await save(root, store);
  return bom;
}

export async function listInformationSkus(input: { tenantId: string; universeId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.skus.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}

export async function findSkuByHash(input: { tenantId: string; universeId: string; contentHash: string; root?: string }) {
  const skus = await listInformationSkus(input);
  return skus.find((item) => item.contentHash === input.contentHash) ?? null;
}

export async function findSkuByFingerprint(input: {
  tenantId: string;
  universeId: string;
  query: string;
  root?: string;
}) {
  const hash = fingerprintDemand(input.query);
  const objects = await listLakeObjects({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  const store = await load(input.root ?? process.cwd());
  const byQuery = store.skus.find(
    (item) =>
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId &&
      (item.demandFingerprint === hash ||
        fingerprintDemand(item.title) === hash ||
        fingerprintDemand(`${item.title}\n${input.query}`) === item.demandFingerprint),
  );
  if (byQuery) return byQuery;
  const lakeHit = objects.find(
    (item) => fingerprintDemand(item.originalText) === hash || item.originalText === input.query,
  );
  if (!lakeHit) return null;
  return store.skus.find((item) => item.lakeObjectId === lakeHit.id) ?? null;
}

export async function recordSourceQualification(input: SourceQualification & { root?: string }) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  store.sources.push(input);
  await save(root, store);
  return input;
}
