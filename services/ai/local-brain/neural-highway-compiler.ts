import { NeuralFabric } from './neural-fabric';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  encodeLogicalAddress,
  materializeRelationIfBudgeted,
} from './sparse-logical-address';
import type { LearningSignalKind, MemoryLearningSignals } from './distributed-memory-types';
import type { MemoryPartition } from './memory-cortex';

export const HIGHWAY_MATERIALIZED_CAP = 512;
export const PRUNE_WEIGHT_FLOOR = 0.15;

export type CompiledHighway = {
  id: string;
  tenantId: string;
  universeId: string;
  fromIri: string;
  toIri: string;
  hops: string[];
  weight: number;
  verifiedUseCount: number;
  agreementCountIgnored: number;
  shortcut: boolean;
  pruned: boolean;
  evidenceRefs: string[];
  lastLearningKind?: LearningSignalKind;
  productionAuthorization: false;
  createdAt: string;
  updatedAt: string;
};

type HighwayStore = { highways: CompiledHighway[] };

function storePath(root: string) {
  return xivLocalPath(root, 'compiled-neural-highways.json');
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function highwayId(fromIri: string, toIri: string) {
  return `hwy_${fromIri.slice(-12)}_${toIri.slice(-12)}`.replace(/[^a-zA-Z0-9_]/g, '');
}

async function load(root: string): Promise<HighwayStore> {
  const parsed = await readJsonFile<HighwayStore>(storePath(root), { highways: [] });
  return { highways: Array.isArray(parsed.highways) ? parsed.highways : [] };
}

export function evidenceBasedDelta(signals: MemoryLearningSignals) {
  if (signals.kind === 'agent_agreement') {
    return {
      applied: false as const,
      delta: 0,
      reason: 'Agent agreement is not evidence. Pathways do not strengthen because agents repeatedly agree.',
    };
  }
  if (signals.inventedFacts) {
    return { applied: false as const, delta: 0, reason: 'Invented facts cannot strengthen a highway.' };
  }
  if (signals.kind === 'verified_evidence' || signals.kind === 'verified_outcome') {
    if (signals.evidenceRefs.length === 0) {
      return { applied: false as const, delta: 0, reason: 'Verified learning requires evidence refs.' };
    }
    const quality = clamp01(signals.evidenceQuality);
    const outcome = signals.outcome === null ? 0 : signals.outcome === 1 ? 0.25 : -0.25;
    const latencyPenalty = Math.min(0.2, signals.latencyMs / 10_000);
    const costPenalty = clamp01(signals.resourceCost) * 0.2;
    const delta = clamp01(quality) * 0.35 + outcome - latencyPenalty - costPenalty;
    return { applied: true as const, delta, reason: 'Evidence-quality / outcome / latency / cost learning.' };
  }
  if (signals.kind === 'correction') {
    return { applied: true as const, delta: -0.2, reason: 'Corrections weaken the compiled pathway.' };
  }
  if (signals.kind === 'latency') {
    const delta = signals.latencyMs > 1_000 ? -0.1 : 0.05;
    return { applied: true as const, delta, reason: 'Latency signal applied without using agreement.' };
  }
  const delta = signals.resourceCost > 0.7 ? -0.1 : 0.05;
  return { applied: true as const, delta, reason: 'Resource-cost signal applied without using agreement.' };
}

export async function compileNeuralHighway(input: {
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  fromSlot: number;
  toSlot: number;
  intermediateSlots?: number[];
  evidenceRefs: string[];
  fabric?: NeuralFabric;
  root?: string;
}) {
  if (input.evidenceRefs.length === 0) {
    return { compiled: false as const, reason: 'Highway compilation requires evidence refs, not popularity.' };
  }
  const from = encodeLogicalAddress({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    slot: input.fromSlot,
  });
  const to = encodeLogicalAddress({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    slot: input.toSlot,
  });
  const hops = [
    from.iri,
    ...(input.intermediateSlots ?? []).map(
      (slot) =>
        encodeLogicalAddress({
          tenantId: input.tenantId,
          universeId: input.universeId,
          partition: input.partition,
          slot,
        }).iri,
    ),
    to.iri,
  ];
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const id = highwayId(from.iri, to.iri);
  let highway = store.highways.find((item) => item.id === id);
  const now = new Date().toISOString();
  if (!highway) {
    if (store.highways.filter((item) => !item.pruned).length >= HIGHWAY_MATERIALIZED_CAP) {
      return { compiled: false as const, reason: 'Compiled highway cap reached. Logical addresses remain valid.' };
    }
    highway = {
      id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      fromIri: from.iri,
      toIri: to.iri,
      hops,
      weight: 0.4,
      verifiedUseCount: 0,
      agreementCountIgnored: 0,
      shortcut: false,
      pruned: false,
      evidenceRefs: [...input.evidenceRefs],
      productionAuthorization: false,
      createdAt: now,
      updatedAt: now,
    };
    store.highways.push(highway);
  } else {
    highway.hops = hops;
    highway.evidenceRefs = [...new Set([...highway.evidenceRefs, ...input.evidenceRefs])];
    highway.updatedAt = now;
    highway.pruned = false;
  }
  await writeJsonFileAtomic(storePath(root), { highways: store.highways.slice(-HIGHWAY_MATERIALIZED_CAP) });

  const materialized = await materializeRelationIfBudgeted({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromIri: from.iri,
    toIri: to.iri,
    relation: 'compiled_highway',
    evidenceRefs: input.evidenceRefs,
    root,
  });

  if (input.fabric) {
    const fromId = `lna:${from.iri}`;
    const toId = `lna:${to.iri}`;
    try {
      input.fabric.registerNode({
        id: fromId,
        kind: 'knowledge',
        label: from.iri,
        tenantId: input.tenantId,
        universeId: input.universeId,
        trust: 'VERIFIED',
        provenanceRefs: input.evidenceRefs,
      });
      input.fabric.registerNode({
        id: toId,
        kind: 'knowledge',
        label: to.iri,
        tenantId: input.tenantId,
        universeId: input.universeId,
        trust: 'VERIFIED',
        provenanceRefs: input.evidenceRefs,
      });
      input.fabric.connect({
        from: fromId,
        to: toId,
        relation: 'compiled_highway',
        weight: highway.weight,
        confidence: 0.7,
        evidenceRefs: input.evidenceRefs,
      });
    } catch {
      // already registered in this fabric instance
    }
  }

  return { compiled: true as const, highway, materialized };
}

export async function applyHighwayLearning(input: {
  tenantId: string;
  universeId: string;
  highwayId: string;
  signals: MemoryLearningSignals;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const highway = store.highways.find(
    (item) => item.id === input.highwayId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!highway) return { applied: false as const, reason: 'HIGHWAY_NOT_FOUND' };
  const decision = evidenceBasedDelta(input.signals);
  if (input.signals.kind === 'agent_agreement') {
    highway.agreementCountIgnored += input.signals.agreementCount ?? 1;
    highway.updatedAt = new Date().toISOString();
    highway.lastLearningKind = 'agent_agreement';
    await writeJsonFileAtomic(storePath(root), store);
    return {
      applied: false as const,
      strengthened: false as const,
      weight: highway.weight,
      reason: decision.reason,
      highway,
    };
  }
  if (!decision.applied) {
    return { applied: false as const, strengthened: false as const, weight: highway.weight, reason: decision.reason, highway };
  }
  const previous = highway.weight;
  highway.weight = clamp01(highway.weight + decision.delta);
  highway.verifiedUseCount += decision.delta > 0 ? 1 : 0;
  highway.lastLearningKind = input.signals.kind;
  highway.updatedAt = new Date().toISOString();
  if (input.signals.evidenceRefs.length) {
    highway.evidenceRefs = [...new Set([...highway.evidenceRefs, ...input.signals.evidenceRefs])];
  }
  await writeJsonFileAtomic(storePath(root), store);
  return {
    applied: true as const,
    strengthened: highway.weight > previous,
    weakened: highway.weight < previous,
    weight: highway.weight,
    previous,
    reason: decision.reason,
    highway,
  };
}

export async function pruneHighways(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  let pruned = 0;
  for (const highway of store.highways) {
    if (highway.tenantId !== input.tenantId || highway.universeId !== input.universeId) continue;
    if (highway.pruned) continue;
    if (highway.weight < PRUNE_WEIGHT_FLOOR && highway.verifiedUseCount === 0) {
      highway.pruned = true;
      highway.updatedAt = new Date().toISOString();
      pruned += 1;
    }
  }
  await writeJsonFileAtomic(storePath(root), store);
  return { pruned, remaining: store.highways.filter((item) => !item.pruned).length };
}

export async function compileLongDistanceShortcut(input: {
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  fromSlot: number;
  toSlot: number;
  viaSlots: number[];
  evidenceRefs: string[];
  root?: string;
}) {
  const compiled = await compileNeuralHighway({
    ...input,
    intermediateSlots: input.viaSlots,
  });
  if (!compiled.compiled) {
    return { ...compiled, shortcut: false as const, skippedIntermediateMaterialization: false as const };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const highway = store.highways.find((item) => item.id === compiled.highway.id);
  if (highway) {
    highway.shortcut = true;
    highway.updatedAt = new Date().toISOString();
    await writeJsonFileAtomic(storePath(root), store);
  }
  return {
    compiled: true as const,
    shortcut: true as const,
    skippedIntermediateMaterialization: true as const,
    hopCount: (input.viaSlots.length + 2),
    highway: highway ?? compiled.highway,
  };
}

export async function listCompiledHighways(input: {
  tenantId: string;
  universeId: string;
  includePruned?: boolean;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.highways.filter(
    (item) =>
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId &&
      (input.includePruned || !item.pruned),
  );
}
