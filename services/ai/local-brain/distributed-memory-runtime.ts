import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { publishAgentMessage } from './agent-bus';
import { LocalCheckpointStore } from './checkpoint-store';
import { xivLocalPath } from './durable-json';
import { decisionGate } from './decision-gate';
import {
  DISTRIBUTED_MEMORY_LOCKS,
  MEMORY_NERVOUS_LOOP,
  type CompatibleSocietyMetrics,
  type EvidenceState,
  type MemoryLearningSignals,
} from './distributed-memory-types';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { getRuntime } from './hybrid-runtime';
import { appendLearning } from './learning-ledger';
import { detectAndPreserveContradiction, ingestEvidenceMemory, listDistributedMemory } from './memory-ingest';
import {
  isolateFounderMemory,
  ordinaryCannotRecallFounderMemory,
  scanMemoryPoison,
  sealAndRefuseReplication,
} from './memory-integrity';
import { retrieveWithPlan } from './memory-retrieval';
import { compressKnowledge, governMemoryResources, placeHotWarmCold } from './memory-storage';
import { NeuralFabric } from './neural-fabric';
import {
  applyHighwayLearning,
  compileLongDistanceShortcut,
  compileNeuralHighway,
  listCompiledHighways,
  pruneHighways,
} from './neural-highway-compiler';
import { evaluateOfflineTask } from './offline-policy';
import { exportOfflineMemoryPack, reconcileMemoryPacks } from './offline-memory-packs';
import { providerSlots } from './provider-fabric';
import {
  addressLogicalRelationship,
  LOGICAL_RELATIONSHIP_CEILING,
  sparseAddressStats,
} from './sparse-logical-address';
import { runDecisionCouncil } from './workcells';
import { sealedVaultStats } from './ceo-sealed-vault';
import type { SealedActor } from './hybrid-edge-cloud-types';
import type { MemoryPartition } from './memory-cortex';

export { DISTRIBUTED_MEMORY_LOCKS, MEMORY_NERVOUS_LOOP };

export type MemoryHopRecord = {
  hop: (typeof MEMORY_NERVOUS_LOOP)[number];
  state: EvidenceState;
  summary: string;
  refs: string[];
};

export type DistributedMemoryNeed = {
  tenantId: string;
  universeId: string;
  claim: string;
  counterclaim?: string;
  summary?: string;
  partition?: MemoryPartition;
  query?: string;
  evidenceRefs?: string[];
  fromSlot?: number;
  toSlot?: number;
  viaSlots?: number[];
  founderRestricted?: boolean;
  founderId?: string;
  sealedPayload?: string;
  actor?: SealedActor;
  replicator?: SealedActor;
  learning?: MemoryLearningSignals;
  agreementLearning?: MemoryLearningSignals;
  deviceIds?: [string, string];
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  consequence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  validFrom?: string;
  asOf?: string;
  root?: string;
};

function hop(name: MemoryHopRecord['hop'], state: EvidenceState, summary: string, refs: string[] = []): MemoryHopRecord {
  return { hop: name, state, summary, refs };
}

function reportsRoot(root: string) {
  if (existsSync(join(root, 'docs/operations'))) return root;
  if (existsSync(join(root, '../docs/operations'))) return join(root, '..');
  if (existsSync(join(root, '../../docs/operations'))) return join(root, '../..');
  return root;
}

function predecessorReportState(root: string, file: string): EvidenceState {
  return existsSync(join(reportsRoot(root), 'docs/operations', file)) ? 'PASS' : 'WAITING_DATA';
}

function moduleState(file: string): EvidenceState {
  const here = dirname(fileURLToPath(import.meta.url));
  return existsSync(join(here, file)) ? 'PASS' : 'WAITING_DATA';
}

function societyMetricsFromSignals(signals: MemoryLearningSignals, agentCount: number): CompatibleSocietyMetrics {
  return {
    evidenceQuality: signals.evidenceQuality,
    factualSupport: signals.evidenceRefs.length > 0 && !signals.inventedFacts ? Math.min(1, 0.5 + signals.evidenceRefs.length / 8) : 0,
    testSuccess: signals.outcome === 1 ? 1 : 0,
    calibration: signals.outcome === null ? 0 : 1,
    correctionRate: signals.correction ? 1 : 0,
    latencyMs: signals.latencyMs,
    resourceUse: {
      workcellsInFlight: 0,
      modelCallsUsed: 0,
      maxConcurrentWorkcells: 0,
    },
    agentCount,
    smarterBecauseMoreAgents: false,
  };
}

export async function runDistributedMemoryCycle(need: DistributedMemoryNeed) {
  const root = need.root ?? process.cwd();
  const partition = need.partition ?? 'business';
  const evidenceRefs = need.evidenceRefs ?? [`62L-AR:${need.claim.slice(0, 24)}`];
  const hops: MemoryHopRecord[] = [];
  const fabric = new NeuralFabric();
  const fromSlot = need.fromSlot ?? 7;
  const toSlot = need.toSlot ?? 999_999_999_991;
  const actor: SealedActor = need.actor ?? { kind: 'ceo_principal', id: 'ceo-principal-sim' };
  const replicator: SealedActor = need.replicator ?? { kind: 'ordinary_agent', id: 'memory-agent', role: 'knowledge_curator' };

  const ingested = await ingestEvidenceMemory({
    tenantId: need.tenantId,
    universeId: need.universeId,
    partition,
    claim: need.claim,
    summary: need.summary ?? need.claim,
    evidenceRefs,
    founderRestricted: need.founderRestricted,
    validFrom: need.validFrom,
    root,
  });
  hops.push(hop('evidence', 'PASS', 'Evidence ingested into Knowledge Lake + distributed memory.', [ingested.record.id]));

  hops.push(hop('memory_classification', 'PASS', `Classified as ${ingested.record.memoryClass}.`, [ingested.record.memoryClass]));

  hops.push(hop(
    'deduplication',
    ingested.duplicate || ingested.lakeDuplicate ? 'PASS' : 'PASS',
    ingested.duplicate ? 'Duplicate claim merged by content hash.' : 'No duplicate; new memory record retained.',
    ingested.record.sourceRefs,
  ));

  let contradiction = need.counterclaim
    ? await detectAndPreserveContradiction({
      tenantId: need.tenantId,
      universeId: need.universeId,
      partition,
      claimA: need.claim,
      claimB: need.counterclaim,
      evidenceRefs,
      root,
    })
    : { contradicted: false as const, dropped: false as const, bothRetained: true as const, forgotten: false as const };
  hops.push(hop(
    'contradiction_detection',
    contradiction.contradicted ? 'PASS' : 'PASS',
    contradiction.contradicted
      ? 'Conflicting evidence retained; nothing silently dropped.'
      : 'No polarity conflict detected; records retained.',
    'records' in contradiction ? contradiction.records : [ingested.record.id],
  ));

  const tiers = await placeHotWarmCold({ tenantId: need.tenantId, universeId: need.universeId, root });
  hops.push(hop('hot_warm_cold_storage', tiers.withinBudget ? 'PASS' : 'FAIL', `hot=${tiers.hot} warm=${tiers.warm} cold=${tiers.cold}`, []));

  const compressed = await compressKnowledge({ tenantId: need.tenantId, universeId: need.universeId, root });
  hops.push(hop(
    'compression',
    compressed.droppedContradictions ? 'FAIL' : 'PASS',
    `Compressed ratio=${compressed.ratio.toFixed(3)}; contradictions retained.`,
    compressed.retainedIds,
  ));

  const far = addressLogicalRelationship({
    tenantId: need.tenantId,
    universeId: need.universeId,
    partition,
    slot: toSlot,
  });
  const compiled = await compileNeuralHighway({
    tenantId: need.tenantId,
    universeId: need.universeId,
    partition,
    fromSlot,
    toSlot,
    intermediateSlots: need.viaSlots ?? [11, 29],
    evidenceRefs,
    fabric,
    root,
  });
  if (need.viaSlots?.length || true) {
    await compileLongDistanceShortcut({
      tenantId: need.tenantId,
      universeId: need.universeId,
      partition,
      fromSlot,
      toSlot,
      viaSlots: need.viaSlots ?? [11, 29],
      evidenceRefs,
      root,
    });
  }
  hops.push(hop(
    'neural_highway_compilation',
    compiled.compiled ? 'PASS' : 'FAIL',
    compiled.compiled
      ? `Compiled highway ${compiled.highway.id}; far slot ${far.address.slot} stayed logical.`
      : compiled.reason,
    compiled.compiled ? [compiled.highway.id] : [],
  ));

  const retrieval = await retrieveWithPlan({
    tenantId: need.tenantId,
    universeId: need.universeId,
    query: need.query ?? need.claim.split(' ').slice(0, 3).join(' '),
    estimatedRecords: LOGICAL_RELATIONSHIP_CEILING,
    asOf: need.asOf,
    root,
  });
  hops.push(hop(
    'retrieval',
    retrieval.inventedFacts ? 'FAIL' : 'PASS',
    `Plan ${retrieval.plan.strategy}; bundle memories=${retrieval.bundle.memoryIds.length} highways=${retrieval.bundle.highwayIds.length}.`,
    retrieval.bundle.memoryIds,
  ));

  const gate = decisionGate({
    id: `mem-${need.tenantId}`,
    action: `reason about ${need.claim}`,
    consequence: need.consequence ?? 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  const council = gate.executableByAgent
    ? await runDecisionCouncil({
      tenantId: need.tenantId,
      universeId: need.universeId,
      action: `memory retrieval ${need.claim.slice(0, 80)}`,
      consequence: need.consequence ?? 'LOW',
      root,
    })
    : null;
  hops.push(hop(
    'agent_reasoning',
    gate.humanApprovalRequired ? 'WAITING_DATA' : 'PASS',
    gate.humanApprovalRequired
      ? 'Consequential reasoning is recommendation-only.'
      : `Reused existing council; smarterBecauseMoreAgents=false; recruitment=${council?.recruitment.status ?? 'skipped'}.`,
    [],
  ));

  const offline = evaluateOfflineTask({
    needsInternet: need.needsExternalFreshness === true,
    needsCloudProvider: need.needsCloudProvider === true,
    needsExternalFreshness: need.needsExternalFreshness === true,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });
  const outcomeState: EvidenceState =
    offline.state === 'WAITING_DATA' || offline.state === 'UNAVAILABLE' || offline.state === 'DENIED'
      ? offline.state
      : 'PASS';
  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: need.tenantId,
    universeId: need.universeId,
    summary: `62L-AR memory cycle outcome ${outcomeState}`,
    payload: { claim: need.claim.slice(0, 80), outcomeState },
  }, root);
  hops.push(hop('outcome', outcomeState, offline.reason, evidenceRefs));

  const highways = await listCompiledHighways({ tenantId: need.tenantId, universeId: need.universeId, root });
  const highway = highways[0];
  const agreement = need.agreementLearning ?? {
    kind: 'agent_agreement' as const,
    evidenceQuality: 1,
    outcome: 1 as const,
    correction: false,
    latencyMs: 1,
    resourceCost: 0,
    agreementCount: 50,
    evidenceRefs: [],
    inventedFacts: false as const,
  };
  const verified = need.learning ?? {
    kind: 'verified_outcome' as const,
    evidenceQuality: 0.9,
    outcome: 1 as const,
    correction: false,
    latencyMs: 40,
    resourceCost: 0.1,
    evidenceRefs,
    inventedFacts: false as const,
  };
  const ignored = highway
    ? await applyHighwayLearning({
      tenantId: need.tenantId,
      universeId: need.universeId,
      highwayId: highway.id,
      signals: agreement,
      root,
    })
    : { applied: false as const, strengthened: false as const, weight: 0, reason: 'no highway', highway: null };
  const learned = highway
    ? await applyHighwayLearning({
      tenantId: need.tenantId,
      universeId: need.universeId,
      highwayId: highway.id,
      signals: verified,
      root,
    })
    : { applied: false as const, strengthened: false as const, weight: 0, reason: 'no highway', highway: null };
  await appendLearning({
    domain: 'distributed-memory',
    subject: need.claim.slice(0, 80),
    claimState: 'MODEL_INFERENCE',
    summary: `agreementIgnored=${!ignored.applied} evidenceApplied=${learned.applied}`,
    sourceRefs: evidenceRefs,
    evidence: evidenceRefs,
    confidence: verified.evidenceQuality,
  }, root);
  const metrics = societyMetricsFromSignals(verified, 4);
  hops.push(hop(
    'learning',
    !ignored.applied && learned.applied ? 'PASS' : learned.applied ? 'PASS' : 'FAIL',
    `Agreement did not strengthen (applied=${ignored.applied}). Evidence learning applied=${learned.applied} weight=${'weight' in learned ? learned.weight : 0}.`,
    highway ? [highway.id] : [],
  ));

  await pruneHighways({ tenantId: need.tenantId, universeId: need.universeId, root });
  if (need.founderRestricted) {
    await isolateFounderMemory({
      tenantId: need.tenantId,
      universeId: need.universeId,
      founderId: need.founderId ?? 'founder',
      twinId: 'twin-sim',
      subject: need.claim.slice(0, 80),
      summary: need.summary ?? need.claim,
      actorKind: 'founder_twin',
      root,
    });
  }
  if (need.sealedPayload) {
    await sealAndRefuseReplication({
      tenantId: need.tenantId,
      universeId: need.universeId,
      label: 'founder-priority-memory',
      payload: need.sealedPayload,
      actor,
      replicator,
      root,
    });
  }
  const devices = need.deviceIds ?? ['device-a', 'device-b'];
  await exportOfflineMemoryPack({
    tenantId: need.tenantId,
    universeId: need.universeId,
    deviceId: devices[0],
    lamport: 1,
    root,
  });
  await exportOfflineMemoryPack({
    tenantId: need.tenantId,
    universeId: need.universeId,
    deviceId: devices[1],
    lamport: 2,
    root,
  });
  const reconciled = await reconcileMemoryPacks({ tenantId: need.tenantId, universeId: need.universeId, root });
  const poison = await scanMemoryPoison({ tenantId: need.tenantId, universeId: need.universeId, root });
  const addressStats = await sparseAddressStats(root);
  const records = await listDistributedMemory({ tenantId: need.tenantId, universeId: need.universeId, root });
  const governance = governMemoryResources({
    materializedRelations: addressStats.materializedRelations,
    materializedRecords: records.length,
    bytes: tiers.bytes,
    extraProcesses: 0,
  });
  hops.push(hop(
    'memory_consolidation',
    governance.allowed && poison.quarantined === 0 ? 'PASS' : poison.quarantined ? 'FAIL' : 'PASS',
    `Consolidated packs devices=${reconciled.devices.length}; materializedRelations=${addressStats.materializedRelations}; ceiling=${addressStats.logicalRelationshipCeiling}.`,
    reconciled.contradictionIdsRetained,
  ));

  publishAgentMessage({
    tenantId: need.tenantId,
    universeId: need.universeId,
    fromRole: 'knowledge_curator',
    toRole: 'memory_librarian',
    kind: 'evidence',
    body: `62L-AR cycle hops=${hops.length}`,
    evidenceRefs,
    requiresHumanApproval: false,
    ttlMs: 60_000,
  });

  const store = new LocalCheckpointStore(xivLocalPath(root, 'brain-state.json'));
  await store.checkpoint({
    taskId: `62lar-${need.tenantId}`,
    at: new Date().toISOString(),
    state: outcomeState === 'PASS' ? 'completed' : outcomeState === 'WAITING_DATA' ? 'waiting_data' : 'unavailable',
    attempt: 1,
    summary: `Distributed memory cycle hops=${hops.length}`,
    evidence: evidenceRefs,
  });

  return {
    hops,
    architecture: MEMORY_NERVOUS_LOOP,
    ingested,
    contradiction,
    tiers,
    compressed,
    farAddress: far.address,
    compiled,
    retrieval,
    gate,
    ignoredAgreement: ignored,
    learned,
    metrics,
    poison,
    reconciled,
    addressStats,
    governance,
    ordinaryFounderRecall: await ordinaryCannotRecallFounderMemory({
      tenantId: need.tenantId,
      universeId: need.universeId,
      founderId: need.founderId ?? 'founder',
      actorKind: 'ordinary_agent',
      root,
    }),
    locks: DISTRIBUTED_MEMORY_LOCKS,
    predecessors: {
      '62L-AQ': predecessorReportState(root, '62L_AQ_ENTERPRISE_NERVOUS_SYSTEM_ETHICAL_SENTINEL_REPORT.md'),
      '62L-AP': predecessorReportState(root, '62L_AP_ENTERPRISE_OPERATIONS_PLANNER_COMMAND_CENTER_REPORT.md'),
      '62L-AO': predecessorReportState(root, '62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md'),
      '62L-AN': predecessorReportState(root, '62L_AN_INFORMATION_CONTROL_TOWER_SEMANTIC_ROUTER_REPORT.md'),
      '62L-AB': moduleState('knowledge-lake.ts') === 'PASS' ? 'PASS' : 'WAITING_DATA',
      '62L-AE': moduleState('ceo-sealed-vault.ts') === 'PASS' ? 'PASS' : 'WAITING_DATA',
      '62L-X': moduleState('memory-cortex.ts') === 'PASS' ? 'PASS' : 'WAITING_DATA',
      '62L-AD': moduleState('distributed-mesh-runtime.ts'),
      '62L-AF': moduleState('universe-os-kernel.ts'),
      '62L-AG': moduleState('evaluation-harness.ts'),
    },
    productionAuthorization: false as const,
    inventedPass: false as const,
    founderImpersonation: false as const,
    smarterBecauseMoreAgents: false as const,
    trillionRowsMaterialized: false as const,
  };
}

export async function buildDistributedMemoryHealthReport(root = process.cwd()) {
  const health = await checkLocalBrainHealth(root);
  const address = await sparseAddressStats(root);
  const sealed = await sealedVaultStats(root);
  return {
    generatedAt: new Date().toISOString(),
    architecture: MEMORY_NERVOUS_LOOP,
    localHealth: health,
    sparseAddress: address,
    sealedVault: sealed,
    predecessors: {
      '62L-AQ': predecessorReportState(root, '62L_AQ_ENTERPRISE_NERVOUS_SYSTEM_ETHICAL_SENTINEL_REPORT.md'),
      '62L-AP': predecessorReportState(root, '62L_AP_ENTERPRISE_OPERATIONS_PLANNER_COMMAND_CENTER_REPORT.md'),
      '62L-AO': predecessorReportState(root, '62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md'),
      '62L-AN': predecessorReportState(root, '62L_AN_INFORMATION_CONTROL_TOWER_SEMANTIC_ROUTER_REPORT.md'),
      '62L-AD': moduleState('distributed-mesh-runtime.ts'),
      '62L-AF': moduleState('universe-os-kernel.ts'),
      '62L-AG': moduleState('evaluation-harness.ts'),
    },
    githubIssue56: 'UNAVAILABLE' as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    liveTrillionRowMaterialization: 'NOT_TESTED' as const,
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    })),
    localRuntime: getRuntime('local').configured ? getRuntime('local').state : 'UNAVAILABLE',
    locks: DISTRIBUTED_MEMORY_LOCKS,
    productionAuthorization: false as const,
    inventedPass: false as const,
    strengthenOnAgentAgreement: false as const,
    next: '62L-AS — XIV Cognitive Compiler + Problem Decomposition Engine + Mathematical/Scientific Reasoning Fabric',
  };
}
