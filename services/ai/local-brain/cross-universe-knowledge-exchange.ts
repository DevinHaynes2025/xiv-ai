import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  APPROVED_DERIVED_KINDS,
  AUTHORITY_NON_TRANSFER,
  BM_LOCKS,
  DERIVED_CONTRACT_REQUIRED,
  FOUNDER_SEALED_DENIED,
  RAW_PRIVATE_EXCHANGE_DENIED,
  SPARSE_BOUNDS,
  type ApprovedDerivedKind,
  type BmActor,
  type DeniedExchangeKind,
} from './org-neural-federation-types';

export const KNOWLEDGE_EXCHANGE_FILE = 'cross-universe-knowledge-exchange.json';

export type SynapseContract = {
  id: string;
  federationId: string;
  fromOrgId: string;
  toOrgId: string;
  fromUniverseId: string;
  toUniverseId: string;
  kind: ApprovedDerivedKind;
  schemaRef: string;
  approved: true;
  rawPrivateAuthorized: false;
  authorityTransferAuthorized: false;
  founderSealedAuthorized: false;
  productionAuthorization: false;
  createdAt: string;
};

export type KnowledgeExchangeDecision = {
  allowed: boolean;
  state: 'PASS' | 'FAIL' | 'DENIED' | 'UNAVAILABLE';
  kind: ApprovedDerivedKind | DeniedExchangeKind | string;
  reason: string;
  body?: Record<string, unknown>;
  rawPooled: false;
  authorityTransferred: false;
  sealedLeaked: false;
  verifiedFact: false;
};

type ExchangeStore = {
  contracts: SynapseContract[];
  exchanges: Array<{
    id: string;
    at: string;
    contractId: string | null;
    decision: KnowledgeExchangeDecision;
  }>;
};

const MAX_EXCHANGES = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, KNOWLEDGE_EXCHANGE_FILE);
}

async function load(root: string): Promise<ExchangeStore> {
  const parsed = await readJsonFile<ExchangeStore>(storePath(root), {
    contracts: [],
    exchanges: [],
  });
  return {
    contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
    exchanges: Array.isArray(parsed.exchanges) ? parsed.exchanges : [],
  };
}

async function save(root: string, store: ExchangeStore) {
  await writeJsonFileAtomic(storePath(root), {
    contracts: store.contracts.slice(-SPARSE_BOUNDS.maxSynapseContracts),
    exchanges: store.exchanges.slice(-MAX_EXCHANGES),
  });
}

function isApprovedDerived(kind: string): kind is ApprovedDerivedKind {
  return (APPROVED_DERIVED_KINDS as readonly string[]).includes(kind);
}

/**
 * Explicit synapse contract for approved derived knowledge products only.
 */
export async function declareSynapseContract(input: {
  federationId: string;
  fromOrgId: string;
  toOrgId: string;
  fromUniverseId: string;
  toUniverseId: string;
  kind: ApprovedDerivedKind;
  schemaRef: string;
  actor: BmActor;
  root?: string;
  now?: number;
}) {
  if (input.actor.orgId !== input.fromOrgId) {
    return { accepted: false as const, reason: 'CROSS_ORG_CONTRACT_DECLARE_DENIED' };
  }
  if (!isApprovedDerived(input.kind)) {
    return { accepted: false as const, reason: 'KIND_NOT_APPROVED_DERIVED' };
  }
  if (!input.schemaRef.trim()) {
    return { accepted: false as const, reason: 'SCHEMA_REF_REQUIRED' };
  }
  if (input.fromOrgId === input.toOrgId) {
    return { accepted: false as const, reason: 'CROSS_UNIVERSE_COUNTERPARTY_REQUIRED' };
  }

  const root = input.root ?? process.cwd();
  const store = await load(root);
  if (store.contracts.length >= SPARSE_BOUNDS.maxSynapseContracts) {
    return { accepted: false as const, reason: 'SYNAPSE_CONTRACT_BUDGET_REACHED' };
  }

  const contract: SynapseContract = {
    id: `scon_${randomUUID()}`,
    federationId: input.federationId,
    fromOrgId: input.fromOrgId,
    toOrgId: input.toOrgId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    kind: input.kind,
    schemaRef: input.schemaRef.trim(),
    approved: true,
    rawPrivateAuthorized: false,
    authorityTransferAuthorized: false,
    founderSealedAuthorized: false,
    productionAuthorization: false,
    createdAt: new Date(input.now ?? Date.now()).toISOString(),
  };
  store.contracts.push(contract);
  await save(root, store);

  return {
    accepted: true as const,
    contract,
    reason: 'EXPLICIT_SYNAPSE_CONTRACT_DECLARED_DERIVED_ONLY',
  };
}

export async function listSynapseContracts(input: {
  federationId: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.contracts.filter((c) => c.federationId === input.federationId);
}

function denyDecision(
  kind: DeniedExchangeKind | string,
  reason: string,
): KnowledgeExchangeDecision {
  return {
    allowed: false,
    state: 'DENIED',
    kind,
    reason,
    rawPooled: false,
    authorityTransferred: false,
    sealedLeaked: false,
    verifiedFact: false,
  };
}

/**
 * Cross-universe knowledge exchange.
 * Raw private company data DENIED by default.
 * Approved derived products may pass only with an explicit synapse contract.
 */
export async function exchangeKnowledgeProduct(input: {
  federationId: string;
  fromOrgId: string;
  toOrgId: string;
  kind: string;
  payload: Record<string, unknown>;
  actor: BmActor;
  contractId?: string;
  classification?: 'derived' | 'raw_private' | 'founder_sealed' | 'authority_grant';
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  // Founder-sealed never exits via federation exchange.
  if (
    input.classification === 'founder_sealed' ||
    input.payload.founderSealed === true ||
    input.payload.sealedFounderToken != null
  ) {
    const decision = denyDecision('founder_sealed_export', FOUNDER_SEALED_DENIED);
    store.exchanges.push({
      id: `xchg_${randomUUID()}`,
      at: new Date().toISOString(),
      contractId: null,
      decision,
    });
    await save(root, store);
    return decision;
  }

  // Authority transfer never via federation synapse.
  if (input.classification === 'authority_grant' || input.payload.authorityGrant === true) {
    const decision = denyDecision('authority_transfer', AUTHORITY_NON_TRANSFER);
    store.exchanges.push({
      id: `xchg_${randomUUID()}`,
      at: new Date().toISOString(),
      contractId: null,
      decision,
    });
    await save(root, store);
    return decision;
  }

  // Raw private company data — deny by default.
  const isRaw =
    input.classification === 'raw_private' ||
    input.kind === 'raw_private_company_data' ||
    input.kind === 'raw_pool' ||
    input.kind === 'raw_export' ||
    input.kind === 'private_dump' ||
    input.payload.rawRows != null ||
    input.payload.originalText != null ||
    input.payload.privateCompanyDump != null ||
    input.payload.rawPrivateCompanyData != null;

  if (isRaw) {
    const decision = denyDecision('raw_private_company_data', RAW_PRIVATE_EXCHANGE_DENIED);
    store.exchanges.push({
      id: `xchg_${randomUUID()}`,
      at: new Date().toISOString(),
      contractId: null,
      decision,
    });
    await save(root, store);
    return decision;
  }

  if (!isApprovedDerived(input.kind)) {
    const decision = denyDecision(input.kind, DERIVED_CONTRACT_REQUIRED);
    store.exchanges.push({
      id: `xchg_${randomUUID()}`,
      at: new Date().toISOString(),
      contractId: null,
      decision,
    });
    await save(root, store);
    return decision;
  }

  const contracts = store.contracts.filter(
    (c) =>
      c.federationId === input.federationId &&
      c.fromOrgId === input.fromOrgId &&
      c.toOrgId === input.toOrgId &&
      c.kind === input.kind &&
      c.approved,
  );
  const contract = input.contractId
    ? contracts.find((c) => c.id === input.contractId)
    : contracts[0];

  if (!contract) {
    const decision: KnowledgeExchangeDecision = {
      allowed: false,
      state: 'UNAVAILABLE',
      kind: input.kind,
      reason: DERIVED_CONTRACT_REQUIRED,
      rawPooled: false,
      authorityTransferred: false,
      sealedLeaked: false,
      verifiedFact: false,
    };
    store.exchanges.push({
      id: `xchg_${randomUUID()}`,
      at: new Date().toISOString(),
      contractId: null,
      decision,
    });
    await save(root, store);
    return decision;
  }

  const body: Record<string, unknown> = {
    contractId: contract.id,
    kind: contract.kind,
    schemaRef: contract.schemaRef,
    derivedProduct: input.payload.derivedProduct ?? null,
    benchmark: input.payload.benchmark ?? null,
    signal: input.payload.signal ?? null,
    lesson: input.payload.lesson ?? null,
    aggregateMetric: input.payload.aggregateMetric ?? null,
    industryInsight: input.payload.industryInsight ?? null,
    originalPrivateTextMoved: false,
    rawRowsMoved: false,
  };

  const decision: KnowledgeExchangeDecision = {
    allowed: true,
    state: 'PASS',
    kind: contract.kind,
    reason: 'Approved derived knowledge product passed explicit synapse contract.',
    body,
    rawPooled: false,
    authorityTransferred: false,
    sealedLeaked: false,
    verifiedFact: false,
  };
  store.exchanges.push({
    id: `xchg_${randomUUID()}`,
    at: new Date().toISOString(),
    contractId: contract.id,
    decision,
  });
  await save(root, store);
  return decision;
}

export function knowledgeExchangeHonesty() {
  return {
    rawPrivateDefault: BM_LOCKS.RAW_PRIVATE_EXCHANGE_DEFAULT,
    derivedOnlyViaExplicitContract: BM_LOCKS.DERIVED_ONLY_VIA_EXPLICIT_CONTRACT,
    approvedKinds: APPROVED_DERIVED_KINDS,
    productionAuthorization: false as const,
    banner: 'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED',
  };
}
