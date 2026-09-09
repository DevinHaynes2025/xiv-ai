import { randomUUID } from 'node:crypto';

import {
  redactSealedForRouting,
  SEALED_REDACTION,
} from './ceo-sealed-vault';
import type { SealedActor } from './hybrid-edge-cloud-types';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  APPROVED_EXCHANGE_KINDS,
  type ApprovedExchangeKind,
  type DeniedExchangeKind,
  type EvidenceState,
  type ExchangeKind,
} from './information-control-tower-types';

export type DataExchangeContract = {
  id: string;
  tenantId: string;
  universeId: string;
  counterpartyId: string;
  kind: ApprovedExchangeKind;
  schemaRef: string;
  approved: boolean;
  createdAt: string;
  productionAuthorization: false;
  rawPoolingAuthorized: false;
};

export type ExchangeProposal = {
  kind: ExchangeKind;
  tenantId: string;
  universeId: string;
  counterpartyId: string;
  schemaRef?: string;
  payload: Record<string, unknown>;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted' | 'sealed_founder_priority';
  sealedRecordId?: string;
  actor: SealedActor;
};

export type ExchangeDecision = {
  allowed: boolean;
  state: EvidenceState;
  kind: ExchangeKind;
  reason: string;
  body?: Record<string, unknown>;
  rawPooled: false;
  sealedLeaked: false;
};

type ContractStore = { contracts: DataExchangeContract[] };

const MAX_CONTRACTS = 4_000;

function storePath(root: string) {
  return xivLocalPath(root, 'enterprise-data-exchange.json');
}

async function load(root: string): Promise<ContractStore> {
  const parsed = await readJsonFile<ContractStore>(storePath(root), { contracts: [] });
  return { contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [] };
}

async function save(root: string, store: ContractStore) {
  await writeJsonFileAtomic(storePath(root), { contracts: store.contracts.slice(-MAX_CONTRACTS) });
}

function isApprovedKind(kind: ExchangeKind): kind is ApprovedExchangeKind {
  return (APPROVED_EXCHANGE_KINDS as readonly string[]).includes(kind);
}

export async function approveDataExchangeContract(input: {
  tenantId: string;
  universeId: string;
  counterpartyId: string;
  kind: ApprovedExchangeKind;
  schemaRef: string;
  root?: string;
}): Promise<DataExchangeContract> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.counterpartyId.trim() || !input.schemaRef.trim()) throw new Error('EXCHANGE_CONTRACT_METADATA_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const contract: DataExchangeContract = {
    id: `xcon_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    counterpartyId: input.counterpartyId.trim(),
    kind: input.kind,
    schemaRef: input.schemaRef.trim(),
    approved: true,
    createdAt: new Date().toISOString(),
    productionAuthorization: false,
    rawPoolingAuthorized: false,
  };
  store.contracts.push(contract);
  await save(root, store);
  return contract;
}

export async function listDataExchangeContracts(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.contracts.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}

export function denyRawPool(kind: ExchangeKind): ExchangeDecision | null {
  if (kind === 'raw_pool' || kind === 'raw_cross_enterprise') {
    const denied: DeniedExchangeKind = kind;
    return {
      allowed: false,
      state: 'FAIL',
      kind: denied,
      reason: 'Raw cross-enterprise pooling is DENIED by default. XIV is not a giant pool of raw private company data.',
      rawPooled: false,
      sealedLeaked: false,
    };
  }
  return null;
}

export async function proposeEnterpriseExchange(input: ExchangeProposal & { root?: string }): Promise<ExchangeDecision> {
  const raw = denyRawPool(input.kind);
  if (raw) return raw;
  if (input.kind === 'ceo_sealed_ordinary' || input.classification === 'sealed_founder_priority' || input.sealedRecordId) {
    if (input.sealedRecordId) {
      const redacted = await redactSealedForRouting({
        recordId: input.sealedRecordId,
        tenantId: input.tenantId,
        universeId: input.universeId,
        destination: 'peer',
        actor: input.actor,
        root: input.root,
      });
      return {
        allowed: false,
        state: 'FAIL',
        kind: 'ceo_sealed_ordinary',
        reason: 'CEO-sealed records are outside ordinary enterprise exchange. Payload remains redacted.',
        body: { redacted: redacted.redacted, token: SEALED_REDACTION },
        rawPooled: false,
        sealedLeaked: false,
      };
    }
    return {
      allowed: false,
      state: 'FAIL',
      kind: 'ceo_sealed_ordinary',
      reason: 'CEO-sealed content cannot enter ordinary enterprise data exchange.',
      rawPooled: false,
      sealedLeaked: false,
    };
  }
  if (!isApprovedKind(input.kind)) {
    return {
      allowed: false,
      state: 'FAIL',
      kind: input.kind,
      reason: 'Exchange kind is not on the approved schema/aggregate/benchmark/capability/permissioned-intelligence list.',
      rawPooled: false,
      sealedLeaked: false,
    };
  }
  const contracts = await listDataExchangeContracts({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  const contract = contracts.find(
    (item) => item.approved && item.kind === input.kind && item.counterpartyId === input.counterpartyId,
  );
  if (!contract) {
    return {
      allowed: false,
      state: 'UNAVAILABLE',
      kind: input.kind,
      reason: 'No approved exchange contract for this counterparty. Partnerships are not invented.',
      rawPooled: false,
      sealedLeaked: false,
    };
  }
  if (input.payload.rawRows || input.payload.originalText || input.payload.privateCompanyDump) {
    return {
      allowed: false,
      state: 'FAIL',
      kind: input.kind,
      reason: 'Approved contracts still refuse raw rows, original private text, or company dumps. Query-to-data only.',
      rawPooled: false,
      sealedLeaked: false,
    };
  }
  const body: Record<string, unknown> = {
    contractId: contract.id,
    kind: input.kind,
    schemaRef: contract.schemaRef,
    aggregate: input.payload.aggregate ?? null,
    benchmark: input.payload.benchmark ?? null,
    capability: input.payload.capability ?? null,
    permissionedIntelligence: input.payload.permissionedIntelligence ?? null,
    originalTextMoved: false,
  };
  return {
    allowed: true,
    state: 'PASS',
    kind: input.kind,
    reason: 'Permissioned exchange of approved schema/aggregate/benchmark/capability/intelligence only.',
    body,
    rawPooled: false,
    sealedLeaked: false,
  };
}

export async function exchangePrivacyPreservingAggregate(input: {
  tenantId: string;
  universeId: string;
  counterpartyId: string;
  count: number;
  contentHash: string;
  actor: SealedActor;
  root?: string;
}) {
  return proposeEnterpriseExchange({
    kind: 'aggregate',
    tenantId: input.tenantId,
    universeId: input.universeId,
    counterpartyId: input.counterpartyId,
    actor: input.actor,
    payload: { aggregate: { count: input.count, contentHash: input.contentHash } },
    root: input.root,
  });
}

export async function exchangeSupplyChainCapability(input: {
  tenantId: string;
  universeId: string;
  counterpartyId: string;
  capability: string;
  latencyMs?: number;
  actor: SealedActor;
  root?: string;
}) {
  return proposeEnterpriseExchange({
    kind: 'capability',
    tenantId: input.tenantId,
    universeId: input.universeId,
    counterpartyId: input.counterpartyId,
    actor: input.actor,
    payload: { capability: { name: input.capability, latencyMs: input.latencyMs, invoicesMoved: false } },
    root: input.root,
  });
}
