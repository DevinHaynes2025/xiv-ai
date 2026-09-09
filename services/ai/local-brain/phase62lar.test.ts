import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sealCeoRecord, SEALED_REDACTION } from './ceo-sealed-vault';
import {
  DISTRIBUTED_MEMORY_LOCKS,
  MEMORY_NERVOUS_LOOP,
} from './distributed-memory-types';
import {
  buildDistributedMemoryHealthReport,
  runDistributedMemoryCycle,
} from './distributed-memory-runtime';
import {
  detectAndPreserveContradiction,
  ingestEvidenceMemory,
  listDistributedMemory,
} from './memory-ingest';
import {
  injectPoisonForTest,
  isolateFounderMemory,
  ordinaryCannotRecallFounderMemory,
  scanMemoryPoison,
  sealAndRefuseReplication,
} from './memory-integrity';
import { compressKnowledge, governMemoryResources, placeHotWarmCold } from './memory-storage';
import { retrieveWithPlan } from './memory-retrieval';
import {
  applyHighwayLearning,
  compileLongDistanceShortcut,
  compileNeuralHighway,
  evidenceBasedDelta,
  listCompiledHighways,
  pruneHighways,
} from './neural-highway-compiler';
import { exportOfflineMemoryPack, reconcileMemoryPacks } from './offline-memory-packs';
import {
  addressLogicalRelationship,
  LOGICAL_RELATIONSHIP_CEILING,
  MATERIALIZED_RELATION_BUDGET,
  sparseAddressStats,
} from './sparse-logical-address';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lar-'));
const tenantId = '62lar-tenant';
const universeId = '62lar-universe';
const ceo = { kind: 'ceo_principal' as const, id: 'ceo-principal-sim' };
const ordinary = { kind: 'ordinary_agent' as const, id: 'memory-agent', role: 'knowledge_curator' };
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-AR30-loop',
    MEMORY_NERVOUS_LOOP.join(' → ') ===
      'evidence → memory_classification → deduplication → contradiction_detection → hot_warm_cold_storage → compression → neural_highway_compilation → retrieval → agent_reasoning → outcome → learning → memory_consolidation',
    'Executable memory loop is recorded in order.',
  );
  check(
    'US-AR29',
    DISTRIBUTED_MEMORY_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DISTRIBUTED_MEMORY_LOCKS.FOUNDER_IMPERSONATION === false &&
      DISTRIBUTED_MEMORY_LOCKS.TIP_LAND === false &&
      DISTRIBUTED_MEMORY_LOCKS.STRENGTHEN_ON_AGENT_AGREEMENT === false &&
      DISTRIBUTED_MEMORY_LOCKS.MATERIALIZE_TRILLION_ROWS === false &&
      DISTRIBUTED_MEMORY_LOCKS.CEO_SEALED_REPLICATES === false,
    'L4, founder impersonation, tip-land, agreement-strengthen, trillion-row materialization, and sealed replication are false.',
  );

  const cycle = await runDistributedMemoryCycle({
    tenantId,
    universeId,
    claim: 'The supplier lead time is 10 days',
    counterclaim: 'The supplier lead time is not 10 days',
    summary: 'Lead-time evidence pair',
    query: 'supplier lead',
    evidenceRefs: ['ev-lead-1', 'ev-lead-2'],
    sealedPayload: 'founder-priority sealed note',
    actor: ceo,
    replicator: ordinary,
    root,
  });

  check('US-AR1', cycle.hops[0]?.hop === 'evidence' && cycle.ingested.record.id.length > 0, 'Evidence ingest hop ran.');
  check('US-AR2', cycle.hops[1]?.hop === 'memory_classification' && Boolean(cycle.ingested.record.memoryClass), 'Memory classification hop ran.');
  check('US-AR3', cycle.hops[2]?.hop === 'deduplication', 'Deduplication hop ran.');
  check(
    'US-AR4',
    cycle.contradiction.contradicted === true &&
      cycle.contradiction.dropped === false &&
      cycle.contradiction.bothRetained === true &&
      cycle.contradiction.forgotten === false,
    'Contradiction preserved; conflicting evidence was not dropped.',
  );

  const now = new Date().toISOString();
  const future = new Date(Date.now() + 86_400_000).toISOString();
  await ingestEvidenceMemory({
    tenantId,
    universeId,
    partition: 'business',
    claim: 'Future-dated capacity signal',
    summary: 'Must not leak into present as-of recall',
    validFrom: future,
    evidenceRefs: ['ev-future'],
    root,
  });
  const present = await listDistributedMemory({ tenantId, universeId, asOf: now, root });
  const later = await listDistributedMemory({ tenantId, universeId, asOf: future, root });
  check(
    'US-AR5',
    present.every((item) => item.claim !== 'Future-dated capacity signal') &&
      later.some((item) => item.claim === 'Future-dated capacity signal'),
    'Temporal memory hides future-dated traces from present as-of queries.',
  );

  const tiers = await placeHotWarmCold({ tenantId, universeId, root });
  check('US-AR6', tiers.hot + tiers.warm + tiers.cold === tiers.records && tiers.withinBudget, 'Hot/warm/cold placement stayed in budget.');

  const compressed = await compressKnowledge({ tenantId, universeId, root });
  const afterCompress = await listDistributedMemory({ tenantId, universeId, root });
  check(
    'US-AR7',
    compressed.droppedContradictions === false &&
      afterCompress.some((item) => item.polarity === 'claim') &&
      afterCompress.some((item) => item.polarity === 'counterclaim'),
    'Compression reduced bytes without dropping contradictory claims.',
  );

  const near = addressLogicalRelationship({ tenantId, universeId, partition: 'business', slot: 0 });
  const far = addressLogicalRelationship({
    tenantId,
    universeId,
    partition: 'business',
    slot: LOGICAL_RELATIONSHIP_CEILING - 1,
  });
  const beforeStats = await sparseAddressStats(root);
  check(
    'US-AR8',
    near.materialized === false &&
      far.materialized === false &&
      far.address.slot === LOGICAL_RELATIONSHIP_CEILING - 1 &&
      far.processSpawned === false,
    'Sparse logical addressing encodes the ceiling slot without spawning a process.',
  );
  check(
    'US-AR9',
    beforeStats.logicalRelationshipCeiling === LOGICAL_RELATIONSHIP_CEILING &&
      beforeStats.materializedRelations <= MATERIALIZED_RELATION_BUDGET &&
      beforeStats.trillionRowsMaterialized === false &&
      beforeStats.materializedProcesses === 0 &&
      cycle.trillionRowsMaterialized === false,
    'Logical ceiling is one trillion; materialized rows stay bounded and are not invented as trillions.',
  );

  const compiled = await compileNeuralHighway({
    tenantId,
    universeId,
    partition: 'business',
    fromSlot: 3,
    toSlot: 99,
    evidenceRefs: ['ev-hwy-1'],
    root,
  });
  if (!compiled.compiled) throw new Error('expected highway compile');
  check('US-AR10', compiled.highway.pruned === false, 'Neural Highway Compiler compiled an evidence-backed pathway.');

  const agreementDelta = evidenceBasedDelta({
    kind: 'agent_agreement',
    evidenceQuality: 1,
    outcome: 1,
    correction: false,
    latencyMs: 1,
    resourceCost: 0,
    agreementCount: 500,
    evidenceRefs: [],
    inventedFacts: false,
  });
  const agreement = await applyHighwayLearning({
    tenantId,
    universeId,
    highwayId: compiled.highway.id,
    signals: {
      kind: 'agent_agreement',
      evidenceQuality: 1,
      outcome: 1,
      correction: false,
      latencyMs: 1,
      resourceCost: 0,
      agreementCount: 500,
      evidenceRefs: [],
      inventedFacts: false,
    },
    root,
  });
  if (!agreement.applied && agreement.weight === undefined) throw new Error('agreement result missing weight');
  check(
    'US-AR12',
    agreementDelta.applied === false &&
      agreement.applied === false &&
      agreement.strengthened === false &&
      typeof agreement.weight === 'number' &&
      agreement.weight === compiled.highway.weight &&
      agreement.highway !== null &&
      agreement.highway.agreementCountIgnored >= 500,
    'Mere agent agreement does not strengthen a highway.',
  );

  const verified = await applyHighwayLearning({
    tenantId,
    universeId,
    highwayId: compiled.highway.id,
    signals: {
      kind: 'verified_outcome',
      evidenceQuality: 0.95,
      outcome: 1,
      correction: false,
      latencyMs: 20,
      resourceCost: 0.05,
      evidenceRefs: ['ev-hwy-1', 'ev-outcome-1'],
      inventedFacts: false,
    },
    root,
  });
  if (!verified.applied) throw new Error('expected verified strengthen');
  check(
    'US-AR11',
    verified.strengthened === true && verified.weight > (agreement.weight ?? 0),
    'Verified outcome quality strengthens the compiled highway.',
  );

  const correction = await applyHighwayLearning({
    tenantId,
    universeId,
    highwayId: compiled.highway.id,
    signals: {
      kind: 'correction',
      evidenceQuality: 0.2,
      outcome: 0,
      correction: true,
      latencyMs: 5_000,
      resourceCost: 0.9,
      evidenceRefs: ['ev-correction'],
      inventedFacts: false,
    },
    root,
  });
  if (!correction.applied) throw new Error('expected correction weaken');
  check('US-AR11-weaken', correction.weakened === true && correction.weight < verified.weight, 'Corrections weaken the compiled highway.');

  await compileNeuralHighway({
    tenantId,
    universeId,
    partition: 'business',
    fromSlot: 4,
    toSlot: 5,
    evidenceRefs: ['ev-prune'],
    root,
  });
  const pruneTarget = (await listCompiledHighways({ tenantId, universeId, root })).find((item) => item.fromIri.endsWith('/4'));
  if (pruneTarget) {
    const weaken = {
      kind: 'correction' as const,
      evidenceQuality: 0,
      outcome: 0 as const,
      correction: true,
      latencyMs: 9_000,
      resourceCost: 1,
      evidenceRefs: ['ev-prune'],
      inventedFacts: false as const,
    };
    await applyHighwayLearning({ tenantId, universeId, highwayId: pruneTarget.id, signals: weaken, root });
    await applyHighwayLearning({ tenantId, universeId, highwayId: pruneTarget.id, signals: weaken, root });
  }
  const pruned = await pruneHighways({ tenantId, universeId, root });
  check('US-AR13', pruned.pruned >= 1, 'Low-weight unused routes are pruned.');

  const shortcut = await compileLongDistanceShortcut({
    tenantId,
    universeId,
    partition: 'business',
    fromSlot: 8,
    toSlot: 10_000,
    viaSlots: [100, 200, 300],
    evidenceRefs: ['ev-shortcut'],
    root,
  });
  check(
    'US-AR14',
    shortcut.compiled === true &&
      shortcut.shortcut === true &&
      shortcut.skippedIntermediateMaterialization === true,
    'Long-distance shortcut compiled without materializing every intermediate row.',
  );

  const retrieval = await retrieveWithPlan({
    tenantId,
    universeId,
    query: 'supplier lead',
    estimatedRecords: LOGICAL_RELATIONSHIP_CEILING,
    root,
  });
  check(
    'US-AR15',
    retrieval.plan.strategy === 'highway_then_sparse_index' &&
      retrieval.plan.materializedFiles === 0 &&
      retrieval.plan.materializedAgents === 0 &&
      retrieval.inventedFacts === false,
    'Intelligent retrieval planning stays sparse and does not invent facts.',
  );
  check(
    'US-AR16',
    retrieval.bundle.inventedFacts === false &&
      retrieval.bundle.rawPooled === false &&
      retrieval.bundle.contradictionIds.length >= 1,
    'Evidence bundles keep contradiction ids and do not pool raw rows.',
  );
  check('US-AR22', retrieval.memoryHits.length >= 1, 'Retrieval returned local memory hits.');

  const packA = await exportOfflineMemoryPack({ tenantId, universeId, deviceId: 'laptop-1', lamport: 1, root });
  const packB = await exportOfflineMemoryPack({ tenantId, universeId, deviceId: 'phone-1', lamport: 2, root });
  check(
    'US-AR17',
    packA.exported === true && packB.exported === true && packA.sealedReplicated === false && packA.pack.offline === true,
    'Offline memory packs export without replicating sealed records.',
  );
  const sealedPack = await exportOfflineMemoryPack({
    tenantId,
    universeId,
    deviceId: 'laptop-1',
    includeSealed: true,
    root,
  });
  check('US-AR17-sealed', sealedPack.exported === false && sealedPack.redacted === SEALED_REDACTION, 'Sealed include is refused.');

  const reconciled = await reconcileMemoryPacks({ tenantId, universeId, root });
  check(
    'US-AR18',
    reconciled.devices.includes('laptop-1') &&
      reconciled.devices.includes('phone-1') &&
      reconciled.lastWriteDoesNotDropConflicts === true &&
      reconciled.contradictionIdsRetained.length >= 1,
    'Multi-device reconciliation retains contradictions.',
  );

  const founderWrite = await isolateFounderMemory({
    tenantId,
    universeId,
    founderId: 'founder',
    twinId: 'twin-sim',
    subject: 'Founder preference',
    summary: 'Keep isolation restricted',
    actorKind: 'founder_twin',
    root,
  });
  const ordinaryWrite = await isolateFounderMemory({
    tenantId,
    universeId,
    founderId: 'founder',
    twinId: 'twin-sim',
    subject: 'Impersonation attempt',
    summary: 'Ordinary agent writing founder memory',
    actorKind: 'ordinary_agent',
    root,
  });
  const ordinaryRead = await ordinaryCannotRecallFounderMemory({
    tenantId,
    universeId,
    founderId: 'founder',
    actorKind: 'ordinary_agent',
    root,
  });
  check(
    'US-AR19',
    founderWrite.accepted === true &&
      ordinaryWrite.accepted === false &&
      ordinaryRead.allowed === false &&
      ordinaryRead.memories.length === 0 &&
      founderWrite.founderImpersonation === false,
    'Restricted founder-memory isolation blocks ordinary agents and does not impersonate the founder.',
  );

  const poisonTarget = afterCompress[0];
  await injectPoisonForTest({ tenantId, universeId, recordId: poisonTarget.id, root });
  const poison = await scanMemoryPoison({ tenantId, universeId, root });
  const stillThere = (await listDistributedMemory({ tenantId, universeId, root })).some((item) => item.id === poisonTarget.id);
  check(
    'US-AR20',
    poison.quarantined >= 1 &&
      poison.findings[0]?.dropped === false &&
      stillThere,
    'Poisoning/integrity detection quarantines tampered records without dropping them.',
  );

  const governance = governMemoryResources({
    materializedRelations: (await sparseAddressStats(root)).materializedRelations,
    materializedRecords: (await listDistributedMemory({ tenantId, universeId, root })).length,
    bytes: tiers.bytes,
    extraProcesses: 0,
  });
  check('US-AR21', governance.allowed && governance.denyTrillionMaterialization && governance.processOk, 'Memory resource governance keeps processes and rows bounded.');

  check(
    'US-AR23',
    cycle.hops.some((item) => item.hop === 'agent_reasoning') && cycle.smarterBecauseMoreAgents === false,
    'Agent reasoning reuses existing councils; intelligence is not claimed from more agents.',
  );
  check('US-AR24', cycle.hops.some((item) => item.hop === 'outcome'), 'Outcome hop recorded.');
  check(
    'US-AR25',
    cycle.ignoredAgreement.applied === false && cycle.learned.applied === true,
    'Learning is measurable from verified evidence, not agreement.',
  );
  check(
    'US-AR26',
    cycle.hops.at(-1)?.hop === 'memory_consolidation' && cycle.hops.length === MEMORY_NERVOUS_LOOP.length,
    'Memory consolidation completed the 12-hop loop.',
  );

  const sealed = await sealAndRefuseReplication({
    tenantId,
    universeId,
    label: 'ceo-sealed-memory',
    payload: 'non-replicating founder-priority payload',
    actor: ceo,
    replicator: ordinary,
    root,
  });
  const ordinarySeal = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'forged',
    payload: 'should deny',
    actor: ordinary,
    root,
  });
  check(
    'US-AR27',
    sealed.sealed === true &&
      sealed.replicated === false &&
      sealed.allowed === false &&
      sealed.payload === SEALED_REDACTION &&
      ordinarySeal.accepted === false,
    'CEO-sealed memory is non-replicating and redacted from ordinary agents.',
  );

  check(
    'US-AR28',
    cycle.locks.PRODUCTION_AUTHORIZATION === false && cycle.inventedPass === false,
    'Offline-first cycle does not invent production authorization or PASS.',
  );

  const health = await buildDistributedMemoryHealthReport(root);
  check(
    'US-AR30',
    health.productionAuthorization === false &&
      health.githubIssue56 === 'UNAVAILABLE' &&
      health.windowsNodeVerification === 'NOT_TESTED' &&
      health.strengthenOnAgentAgreement === false &&
      health.providers.every((item) => item.state === 'UNAVAILABLE') &&
      health.next.startsWith('62L-AS'),
    'Health report keeps providers UNAVAILABLE, GitHub issue UNAVAILABLE, and next title only.',
  );

  const noEvidenceCompile = await compileNeuralHighway({
    tenantId,
    universeId,
    partition: 'business',
    fromSlot: 1,
    toSlot: 2,
    evidenceRefs: [],
    root,
  });
  check('US-AR10-no-evidence', noEvidenceCompile.compiled === false, 'Highways do not compile from empty evidence.');

  const contradictAgain = await detectAndPreserveContradiction({
    tenantId,
    universeId,
    partition: 'business',
    claimA: 'Warehouse A is open',
    claimB: 'Warehouse A is not open',
    evidenceRefs: ['ev-wh'],
    root,
  });
  check('US-AR4-second', contradictAgain.bothRetained && !contradictAgain.dropped, 'Second contradiction pair is retained.');
} catch (error) {
  failures.push(`UNCAUGHT: ${(error as Error).stack ?? (error as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AR safety tests FAIL');
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

console.log('62L-AR safety tests PASS');
