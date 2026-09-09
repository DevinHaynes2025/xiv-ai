/**
 * 62L-CO Global Knowledge Exchange OS — exchange only across approved endpoints.
 * Missing residency/classification/provenance → DENIED or UNKNOWN (not silent allow).
 * Sealed content cannot silent-route cross-cloud.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CO_LOCKS,
  HONESTY_BANNER,
  MISSING_META_DENIED_OR_UNKNOWN,
  SEALED_CROSS_CLOUD_DENIED,
  UNAPPROVED_ENDPOINT_EXCHANGE_DENIED,
  type CoActor,
  type EndpointKind,
} from './global-knowledge-exchange-os-types';

export type ApprovedEndpoint = {
  id: string;
  kind: EndpointKind;
  label: string;
  approved: boolean;
  regionId: string;
  createdAt: string;
};

export type ExchangeAttempt = {
  id: string;
  fromEndpointId: string;
  toEndpointId: string | null;
  accepted: boolean;
  state: 'APPROVED' | 'DENIED' | 'UNKNOWN';
  reason: string;
  residency?: string | null;
  classification?: string | null;
  provenanceRef?: string | null;
  sealed?: boolean;
  productionAuthorized: false;
  at: string;
};

type Store = {
  endpoints: ApprovedEndpoint[];
  exchanges: ExchangeAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-knowledge-exchange-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { endpoints: [], exchanges: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function exchangeOsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CO_LOCKS.L4_AUTONOMY_ENABLED,
    exchangeRequiresApprovedEndpoint: CO_LOCKS.EXCHANGE_REQUIRES_APPROVED_ENDPOINT,
    unapprovedEndpointExchange: CO_LOCKS.UNAPPROVED_ENDPOINT_EXCHANGE,
    requireResidency: CO_LOCKS.REQUIRE_RESIDENCY,
    requireClassification: CO_LOCKS.REQUIRE_CLASSIFICATION,
    requireProvenance: CO_LOCKS.REQUIRE_PROVENANCE,
    missingMetaSilentAllow: CO_LOCKS.MISSING_META_SILENT_ALLOW,
    sealedSilentCrossCloud: CO_LOCKS.SEALED_SILENT_CROSS_CLOUD,
    localFirst: CO_LOCKS.LOCAL_FIRST,
    productionAuthorization: CO_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function approveExchangeEndpoint(input: {
  kind: EndpointKind;
  label: string;
  regionId: string;
  approved?: boolean;
  root: string;
  actor: CoActor;
}): Promise<ApprovedEndpoint> {
  const store = await load(input.root);
  const endpoint: ApprovedEndpoint = {
    id: id('ep'),
    kind: input.kind,
    label: input.label,
    approved: input.approved !== false,
    regionId: input.regionId,
    createdAt: new Date().toISOString(),
  };
  store.endpoints.push(endpoint);
  await save(input.root, store);
  return endpoint;
}

export async function attemptKnowledgeExchange(input: {
  fromEndpointId: string;
  toEndpointId?: string | null;
  /** When true, target is treated as unapproved even if registered. */
  forceUnapproved?: boolean;
  residency?: string | null;
  classification?: string | null;
  provenanceRef?: string | null;
  sealed?: boolean;
  /** Probe: attempt silent cross-cloud route for sealed content. */
  attemptSilentCrossCloud?: boolean;
  root: string;
  actor: CoActor;
}): Promise<ExchangeAttempt> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const toId = input.toEndpointId ?? null;
  const target = toId ? store.endpoints.find((e) => e.id === toId) : undefined;
  const approved =
    !input.forceUnapproved &&
    target?.approved === true &&
    CO_LOCKS.EXCHANGE_REQUIRES_APPROVED_ENDPOINT === true;

  if (input.sealed === true && input.attemptSilentCrossCloud === true) {
    const attempt: ExchangeAttempt = {
      id: id('xchg'),
      fromEndpointId: input.fromEndpointId,
      toEndpointId: toId,
      accepted: false,
      state: 'DENIED',
      reason: SEALED_CROSS_CLOUD_DENIED,
      residency: input.residency ?? null,
      classification: input.classification ?? null,
      provenanceRef: input.provenanceRef ?? null,
      sealed: true,
      productionAuthorized: false,
      at: now,
    };
    store.exchanges.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (!approved || !toId || !target) {
    const attempt: ExchangeAttempt = {
      id: id('xchg'),
      fromEndpointId: input.fromEndpointId,
      toEndpointId: toId,
      accepted: false,
      state: 'DENIED',
      reason: UNAPPROVED_ENDPOINT_EXCHANGE_DENIED,
      residency: input.residency ?? null,
      classification: input.classification ?? null,
      provenanceRef: input.provenanceRef ?? null,
      sealed: input.sealed === true,
      productionAuthorized: false,
      at: now,
    };
    store.exchanges.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const missingResidency = !input.residency;
  const missingClassification = !input.classification;
  const missingProvenance = !input.provenanceRef;
  if (missingResidency || missingClassification || missingProvenance) {
    const attempt: ExchangeAttempt = {
      id: id('xchg'),
      fromEndpointId: input.fromEndpointId,
      toEndpointId: toId,
      accepted: false,
      state: 'UNKNOWN',
      reason: MISSING_META_DENIED_OR_UNKNOWN,
      residency: input.residency ?? null,
      classification: input.classification ?? null,
      provenanceRef: input.provenanceRef ?? null,
      sealed: input.sealed === true,
      productionAuthorized: false,
      at: now,
    };
    store.exchanges.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: ExchangeAttempt = {
    id: id('xchg'),
    fromEndpointId: input.fromEndpointId,
    toEndpointId: toId,
    accepted: true,
    state: 'APPROVED',
    reason: 'EXCHANGE_ACROSS_APPROVED_ENDPOINT_WITH_PROVENANCE',
    residency: input.residency,
    classification: input.classification,
    provenanceRef: input.provenanceRef,
    sealed: input.sealed === true,
    productionAuthorized: false,
    at: now,
  };
  store.exchanges.push(attempt);
  await save(input.root, store);
  return attempt;
}
