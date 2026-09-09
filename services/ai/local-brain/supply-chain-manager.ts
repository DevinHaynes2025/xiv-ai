import { randomUUID } from 'node:crypto';

import { agenticPut } from './agentic-database';
import { redactSealedForRouting, SEALED_REDACTION, sealCeoRecord } from './ceo-sealed-vault';
import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { ingestLakeSource } from './knowledge-lake';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import { promoteLakeClaim } from './evidence-graph';
import { planCrossDatabaseQuery } from './database-adapters';
import { INFORMATION_SUPPLY_CHAIN, type ControlTowerMetrics, type InformationSupplyChainHop } from './information-supply-chain-types';
import type { SealedActor } from './hybrid-edge-cloud-types';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';

export type SupplyChainItem = {
  id: string;
  tenantId: string;
  universeId: string;
  supplierId: string;
  hop: InformationSupplyChainHop;
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'sealed_founder_priority';
  quality: 'pass' | 'fail' | 'pending';
  sealed: boolean;
  movementBytes: number;
  costUnits: number;
  slaMs: number;
  createdAt: string;
  updatedAt: string;
};

export type SupplyChainManagerState = {
  suppliers: Array<{ id: string; label: string }>;
  inventory: SupplyChainItem[];
  queues: Record<InformationSupplyChainHop, string[]>;
  transformations: number;
  routes: number;
  destinations: string[];
  slaBreaches: number;
  qualityFailures: number;
  bottlenecks: string[];
  costUnits: number;
  feedback: number;
};

function emptyQueues(): Record<InformationSupplyChainHop, string[]> {
  return {
    source: [],
    intake: [],
    quality: [],
    classification: [],
    transformation: [],
    storage: [],
    routing: [],
    delivery: [],
    decision: [],
    outcome: [],
    feedback: [],
  };
}

function emptyState(): SupplyChainManagerState {
  return {
    suppliers: [],
    inventory: [],
    queues: emptyQueues(),
    transformations: 0,
    routes: 0,
    destinations: [],
    slaBreaches: 0,
    qualityFailures: 0,
    bottlenecks: [],
    costUnits: 0,
    feedback: 0,
  };
}

function managerPath(root: string) {
  return xivLocalPath(root, 'information-supply-chain.json');
}

async function load(root: string): Promise<SupplyChainManagerState> {
  const parsed = await readJsonFile<SupplyChainManagerState>(managerPath(root), emptyState());
  return {
    ...emptyState(),
    ...parsed,
    queues: { ...emptyState().queues, ...(parsed.queues ?? {}) },
    inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
    suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : [],
  };
}

async function save(root: string, state: SupplyChainManagerState) {
  await writeJsonFileAtomic(managerPath(root), {
    ...state,
    inventory: state.inventory.slice(-10_000),
  });
}

export async function registerSupplier(input: { tenantId: string; universeId: string; label: string; root?: string }) {
  const root = input.root ?? process.cwd();
  const state = await load(root);
  const supplier = { id: `sup_${randomUUID()}`, label: input.label.trim() };
  state.suppliers.push(supplier);
  await save(root, state);
  return supplier;
}

export async function runInformationSupplyChain(input: {
  tenantId: string;
  universeId: string;
  supplierId: string;
  sourceUri: string;
  originalText: string;
  classification?: SupplyChainItem['classification'];
  sealedPayload?: string;
  actor?: SealedActor;
  destination?: string;
  slaMs?: number;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.supplierId) throw new Error('SUPPLY_CHAIN_SCOPE_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: InformationSupplyChainHop[] = [];
  const actor: SealedActor = input.actor ?? { kind: 'ordinary_agent', id: 'supply-chain-manager', role: 'librarian' };
  const ceo: SealedActor = { kind: 'ceo_principal', id: 'ceo-principal-sim' };
  const now = new Date().toISOString();
  const item: SupplyChainItem = {
    id: `isc_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    supplierId: input.supplierId,
    hop: 'source',
    classification: input.sealedPayload ? 'sealed_founder_priority' : (input.classification ?? 'internal'),
    quality: 'pending',
    sealed: Boolean(input.sealedPayload),
    movementBytes: 0,
    costUnits: 1,
    slaMs: input.slaMs ?? 60_000,
    createdAt: now,
    updatedAt: now,
  };

  const state = await load(root);
  if (!state.suppliers.some((supplier) => supplier.id === input.supplierId)) {
    throw new Error('SUPPLIER_NOT_REGISTERED');
  }

  hops.push('source');
  hops.push('intake');
  let lakeId: string | undefined;
  let sealedId: string | undefined;
  if (item.sealed && input.sealedPayload) {
    const sealed = await sealCeoRecord({
      tenantId: input.tenantId,
      universeId: input.universeId,
      label: `supply:${item.id}`,
      payload: input.sealedPayload,
      actor: ceo,
      root,
    });
    sealedId = sealed.record?.id;
  } else {
    const ingested = await ingestLakeSource({
      tenantId: input.tenantId,
      universeId: input.universeId,
      industry: 'information_supply',
      partition: 'company',
      sourceUri: input.sourceUri,
      sourceLanguage: 'en',
      originalText: input.originalText,
      provenanceRefs: [`supplier:${input.supplierId}`],
      classification: item.classification === 'sealed_founder_priority' ? 'restricted' : item.classification,
      root,
    });
    lakeId = ingested.object.id;
  }

  hops.push('quality');
  if (!input.originalText.trim() && !item.sealed) {
    item.quality = 'fail';
    state.qualityFailures += 1;
  } else {
    item.quality = 'pass';
  }

  hops.push('classification');
  hops.push('transformation');
  state.transformations += 1;
  if (!item.sealed) {
    await rememberCortexTrace({
      tenantId: input.tenantId,
      universeId: input.universeId,
      partition: 'company',
      kind: 'fact',
      claimState: 'PRIMARY_SOURCE',
      label: `supply:${item.id}`,
      summary: input.originalText.slice(0, 240),
      sourceRefs: [`supplier:${input.supplierId}`],
      root,
    });
  }

  hops.push('storage');
  if (!item.sealed) {
    await agenticPut({
      tenantId: input.tenantId,
      universeId: input.universeId,
      table: 'information_inventory',
      document: { itemId: item.id, lakeId, hop: 'storage' },
      root,
    });
  }

  hops.push('routing');
  const plan = planCrossDatabaseQuery({
    query: `inventory ${item.id}`,
    neededStores: ['local_knowledge_lake', 'local_agentic'],
    sealed: item.sealed,
    copyAllToOnePlace: false,
  });
  item.movementBytes = plan.movementBytes;
  if (item.sealed && sealedId) {
    await redactSealedForRouting({
      recordId: sealedId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      destination: 'cloud',
      actor,
      root,
    });
  } else {
    state.routes += 1;
  }

  hops.push('delivery');
  if (input.destination) state.destinations.push(input.destination);

  hops.push('decision');
  const gate = decisionGate({
    id: item.id,
    action: 'deliver_information',
    consequence: item.sealed ? 'HIGH' : 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  hops.push('outcome');
  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Supply chain ${item.id} ${item.quality}`,
    payload: {
      hops,
      lakeId,
      sealedId,
      sealedRedaction: item.sealed ? SEALED_REDACTION : undefined,
      plan,
      gate,
      copyAllToOnePlace: false,
    },
  }, root);

  if (lakeId) {
    await promoteLakeClaim({
      text: input.originalText.slice(0, 120),
      tenantId: input.tenantId,
      universeId: input.universeId,
      lakeObjectId: lakeId,
      root,
    });
  }

  hops.push('feedback');
  await appendLearning({
    domain: 'information_supply_chain',
    subject: item.id,
    claimState: item.quality === 'pass' ? 'PRIMARY_SOURCE' : 'UNKNOWN',
    summary: `Minimize-movement delivery; sealed=${item.sealed}; movementBytes=${item.movementBytes}`,
    sourceRefs: [`supplier:${input.supplierId}`],
    evidence: [item.id],
  }, root);
  state.feedback += 1;
  state.costUnits += item.costUnits;
  item.hop = 'feedback';
  item.updatedAt = new Date().toISOString();
  state.inventory.push(item);
  for (const hop of hops) state.queues[hop].push(item.id);
  if (item.quality === 'fail') state.bottlenecks.push('quality');
  if (item.sealed) state.bottlenecks.push('sealed_hold');
  await save(root, state);

  return {
    item,
    hops,
    plan,
    gate,
    lakeId,
    sealedId,
    sealedRedaction: item.sealed ? SEALED_REDACTION : undefined,
    copyAllToOnePlace: false as const,
    privateMemoryExposed: false as const,
  };
}

export async function controlTowerMetrics(root = process.cwd()): Promise<ControlTowerMetrics> {
  const state = await load(root);
  const inFlight = state.inventory.filter((item) => item.hop !== 'feedback').length;
  return {
    itemsInFlight: inFlight,
    qualityFailures: state.qualityFailures,
    bottlenecks: [...new Set(state.bottlenecks)],
    movementBytes: state.inventory.reduce((sum, item) => sum + item.movementBytes, 0),
    sealedHolds: state.inventory.filter((item) => item.sealed).length,
    unavailableAdapters: 0,
    loopsBlocked: 0,
    slaBreaches: state.slaBreaches,
    costUnits: state.costUnits,
    feedbackEvents: state.feedback,
    copyAllToOnePlace: false,
    productionAuthorization: false,
  };
}

export async function readSupplyChainManager(root = process.cwd()) {
  return load(root);
}
