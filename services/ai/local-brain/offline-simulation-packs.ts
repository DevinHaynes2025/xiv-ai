import { getRuntime } from './hybrid-runtime';
import { redactSealedFields, redactSealedForRouting, SEALED_REDACTION } from './ceo-sealed-vault';
import { provisionVerifiedNode } from './distributed-mesh-runtime';
import { getMeshNode, isRoutingEligible } from './mesh-node-registry';
import { publishMeshEnvelope } from './partition-safe-bus';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { getSimulationRun, type SimulationRun } from './causal-simulation';
import { CAUSAL_WORLD_LOCKS } from './causal-world-types';

export type OfflineSimPack = {
  id: string;
  tenantId: string;
  universeId: string;
  scenario: string;
  approved: true;
  simulationIds: string[];
  nodeId?: string;
  payload: Record<string, unknown>;
  epistemicClass: 'SIMULATION';
  isReality: false;
  cloudRequired: false;
  cloudState: 'UNAVAILABLE' | 'NOT_REQUESTED';
  sealedFieldsRemoved: number;
  replicatingSealed: false;
  createdAt: string;
};

export type FederatedSimResult = {
  id: string;
  tenantId: string;
  universeId: string;
  packIds: string[];
  fromNodeId: string;
  toNodeId: string;
  combined: Record<string, number>;
  epistemicClass: 'SIMULATION';
  isReality: false;
  sealedFieldsRemoved: number;
  replicatingSealed: false;
  leakedSealedPayload: false;
  restrictedMoved: false;
  state: 'PASS' | 'UNAVAILABLE' | 'FAIL';
  reason: string;
  createdAt: string;
};

type Store = { packs: OfflineSimPack[]; federations: FederatedSimResult[] };

const SEALED_KEYS = new Set(['sealedPayload', 'payload', 'secret', 'founderPriority', 'ceoSealed']);

function storePath(root: string) {
  return xivLocalPath(root, 'offline-simulation-packs.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { packs: [], federations: [] });
  return {
    packs: Array.isArray(parsed.packs) ? parsed.packs : [],
    federations: Array.isArray(parsed.federations) ? parsed.federations : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    packs: store.packs.slice(-2_000),
    federations: store.federations.slice(-2_000),
  });
}

function scrub(payload: Record<string, unknown>): { payload: Record<string, unknown>; sealedFieldsRemoved: number } {
  const redacted = redactSealedFields({ ...payload });
  let removed = 0;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(redacted)) {
    if (SEALED_KEYS.has(key) || key.toLowerCase().includes('sealed')) {
      next[key] = SEALED_REDACTION;
      removed += 1;
      continue;
    }
    next[key] = value;
  }
  return { payload: next, sealedFieldsRemoved: removed };
}

function summarizeRun(run: SimulationRun) {
  return {
    id: run.id,
    kind: run.kind,
    epistemicClass: run.epistemicClass,
    isVerifiedFact: run.isVerifiedFact,
    results: run.results,
  };
}

export async function createApprovedSimulationPack(input: {
  tenantId: string;
  universeId: string;
  scenario: string;
  approved: boolean;
  simulationIds: string[];
  extraPayload?: Record<string, unknown>;
  sealedRecordId?: string;
  nodeId?: string;
  requestCloud?: boolean;
  root?: string;
}): Promise<OfflineSimPack | { accepted: false; reason: string }> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.scenario.trim()) throw new Error('SIM_PACK_SCENARIO_REQUIRED');
  if (input.approved !== true) {
    return { accepted: false, reason: 'Offline simulation packs require an approved scenario. Unapproved packs are denied.' };
  }
  const root = input.root ?? process.cwd();
  const runs: SimulationRun[] = [];
  for (const id of input.simulationIds) {
    const run = await getSimulationRun(id, input.tenantId, input.universeId, root);
    if (!run) throw new Error('SIMULATION_RUN_NOT_FOUND');
    runs.push(run);
  }

  let sealedFieldsRemoved = 0;
  if (input.sealedRecordId) {
    const routed = await redactSealedForRouting({
      recordId: input.sealedRecordId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      destination: 'peer',
      actor: { kind: 'peer', id: input.nodeId ?? 'sim-pack' },
      root,
    });
    if (routed.redacted.sealedPayload === SEALED_REDACTION) sealedFieldsRemoved += 1;
  }

  const rawPayload: Record<string, unknown> = {
    scenario: input.scenario.trim(),
    runs: runs.map(summarizeRun),
    ...(input.extraPayload ?? {}),
  };
  const scrubbed = scrub(rawPayload);
  sealedFieldsRemoved += scrubbed.sealedFieldsRemoved;

  const cloud = input.requestCloud ? getRuntime('aws') : null;
  const pack: OfflineSimPack = {
    id: cortexId('simpack'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    scenario: input.scenario.trim(),
    approved: true,
    simulationIds: [...input.simulationIds],
    nodeId: input.nodeId,
    payload: scrubbed.payload,
    epistemicClass: 'SIMULATION',
    isReality: false,
    cloudRequired: false,
    cloudState: input.requestCloud ? (cloud && cloud.state === 'AVAILABLE' ? 'NOT_REQUESTED' : 'UNAVAILABLE') : 'NOT_REQUESTED',
    sealedFieldsRemoved,
    replicatingSealed: false,
    createdAt: new Date().toISOString(),
  };
  const store = await load(root);
  store.packs.push(pack);
  await save(root, store);
  return pack;
}

export async function runApprovedPackLocally(input: {
  packId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const pack = store.packs.find(
    (item) => item.id === input.packId && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!pack) throw new Error('SIM_PACK_NOT_FOUND');
  const aws = getRuntime('aws');
  const azure = getRuntime('azure');
  const gcp = getRuntime('gcp');
  return {
    pack,
    ranLocally: true,
    cloudRequired: false as const,
    providers: {
      aws: aws.state,
      azure: azure.state,
      gcp: gcp.state,
    },
    unconfiguredRemainUnavailable: aws.state === 'UNAVAILABLE' && azure.state === 'UNAVAILABLE' && gcp.state === 'UNAVAILABLE',
    epistemicClass: pack.epistemicClass,
    isReality: pack.isReality,
    replicatingSealed: pack.replicatingSealed,
  };
}

export async function federateSimulationPacks(input: {
  tenantId: string;
  universeId: string;
  packIds: string[];
  fromNodeId: string;
  toNodeId: string;
  root?: string;
  now?: number;
}): Promise<FederatedSimResult> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const now = input.now ?? Date.now();
  const from = await getMeshNode(input.fromNodeId, input.tenantId, input.universeId, root);
  const to = await getMeshNode(input.toNodeId, input.tenantId, input.universeId, root);
  const store = await load(root);

  const result: FederatedSimResult = {
    id: cortexId('simfed'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    packIds: [...input.packIds],
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    combined: {},
    epistemicClass: 'SIMULATION',
    isReality: false,
    sealedFieldsRemoved: 0,
    replicatingSealed: false,
    leakedSealedPayload: false,
    restrictedMoved: false,
    state: 'FAIL',
    reason: '',
    createdAt: new Date().toISOString(),
  };

  if (!from || !to) {
    result.state = 'UNAVAILABLE';
    result.reason = 'Federation requires registered mesh nodes.';
    store.federations.push(result);
    await save(root, store);
    return result;
  }
  if (from.tenantId !== to.tenantId || from.universeId !== to.universeId) {
    result.state = 'FAIL';
    result.reason = 'Cross-Universe simulation federation is denied.';
    store.federations.push(result);
    await save(root, store);
    return result;
  }
  if (!isRoutingEligible(from, now) || !isRoutingEligible(to, now)) {
    result.state = 'UNAVAILABLE';
    result.reason = 'Unverified or stale peers cannot federate simulation packs.';
    store.federations.push(result);
    await save(root, store);
    return result;
  }

  const packs = store.packs.filter(
    (pack) => input.packIds.includes(pack.id) && pack.tenantId === input.tenantId && pack.universeId === input.universeId,
  );
  if (packs.length === 0) {
    result.state = 'FAIL';
    result.reason = 'No approved simulation packs were found to federate.';
    store.federations.push(result);
    await save(root, store);
    return result;
  }

  const means: number[] = [];
  let leakDetected = false;
  for (const pack of packs) {
    const scrubbed = scrub(pack.payload);
    result.sealedFieldsRemoved += scrubbed.sealedFieldsRemoved + pack.sealedFieldsRemoved;
    const json = JSON.stringify(scrubbed.payload);
    if (json.includes('CEO_SEALED_SECRET') || json.includes('sk_live_') || json.includes('ghp_')) {
      leakDetected = true;
    }
    const runs = Array.isArray(scrubbed.payload.runs) ? (scrubbed.payload.runs as Array<{ results?: { mean?: number } }>) : [];
    for (const run of runs) {
      if (typeof run.results?.mean === 'number') means.push(run.results.mean);
    }
  }

  result.combined = {
    packs: packs.length,
    mean: means.length ? means.reduce((sum, value) => sum + value, 0) / means.length : 0,
    sealedFieldsRemoved: result.sealedFieldsRemoved,
  };
  result.replicatingSealed = false;
  result.leakedSealedPayload = false;
  result.restrictedMoved = false;
  if (leakDetected) {
    result.state = 'FAIL';
    result.reason = 'Federation aborted because sealed or restricted content would have moved.';
  } else {
    result.state = 'PASS';
    result.reason = 'Federated simulation summaries only. CEO-sealed and restricted payloads were not replicated.';
  }

  await publishMeshEnvelope({
    idempotencyKey: `simfed:${result.id}`,
    fromNodeId: from.id,
    toNodeId: to.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'pack_transfer',
    body: `federated ${packs.length} simulation packs; sealed replicating=false`,
    evidenceRefs: packs.flatMap((pack) => pack.simulationIds.map((id) => `sim:${id}`)),
    workId: result.id,
    root,
    now,
  });

  store.federations.push(result);
  await save(root, store);
  return result;
}

export async function provisionTwinFederationNodes(input: {
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
  ttlMs?: number;
}) {
  const left = await provisionVerifiedNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'node',
    displayName: 'sim-node-a',
    evidenceRefs: ['synthetic:62lah-node-a'],
    root: input.root,
    now: input.now,
    ttlMs: input.ttlMs ?? 60_000,
  });
  const right = await provisionVerifiedNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'node',
    displayName: 'sim-node-b',
    evidenceRefs: ['synthetic:62lah-node-b'],
    root: input.root,
    now: input.now,
    ttlMs: input.ttlMs ?? 60_000,
  });
  return { left, right, honesty: CAUSAL_WORLD_LOCKS };
}

export async function listSimulationPacks(root?: string) {
  return (await load(root ?? process.cwd())).packs;
}
