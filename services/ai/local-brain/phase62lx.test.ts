import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { applyCortexRetention, forgetCortexTrace, recallCortexTraces, rememberCortexTrace } from './memory-cortex';
import {
  listContradictions,
  listPartitionedKnowledge,
  recordContradiction,
  transitionContradiction,
  upsertPartitionedKnowledge,
} from './world-knowledge-graph';
import { conveneHistoricalCulturalCouncil, loadCouncil } from './cortex-councils';
import { retrieveEvidencePathway } from './cortex-evidence';
import { recordOutcomeAndLearn, runClassicalQuantQuantumBridge, runScenarioSimulation } from './simulation-lab';
import { buildCortexHealthReport, CORTEX_ARCHITECTURE, runMemoryCortexPathway } from './cortex-runtime';
import { appendEvidenceEvent } from './evidence-ledger';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lx-'));
const tenantId = '62lx-tenant';
const universeId = '62lx-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-X-architecture',
    CORTEX_ARCHITECTURE.join(' → ') === 'founder_digital_twin → neural_highways → agent_bus → tool_mesh → departments → memory_cortex → world_knowledge_graph → evidence → agent_councils → simulation → decision → build_test → outcome → learning → memory → stronger_future_pathways',
    'Architecture pathway is recorded in order.',
  );

  // US-X1 durable Memory Cortex
  const episode = await rememberCortexTrace({
    tenantId,
    universeId,
    partition: 'business',
    kind: 'episode',
    claimState: 'VERIFIED_FACT',
    label: 'Warehouse count observed',
    summary: 'Sandbox warehouse count is 12.',
    evidenceRefs: ['synthetic:62lx'],
    sourceRefs: ['synthetic:62lx'],
    retentionClass: 'durable',
    root,
  });
  const recalled = await recallCortexTraces({ tenantId, universeId, query: 'warehouse', root });
  const otherTenant = await recallCortexTraces({ tenantId: 'other-tenant', universeId, query: 'warehouse', root });
  check('US-X1', recalled.some((item) => item.id === episode.id) && episode.productionAuthorization === false, 'Durable cortex trace is recalled from local state.');
  check('US-X1', otherTenant.length === 0, 'Memory Cortex is tenant/Universe scoped.');

  // US-X2 temporal memory / no future leak
  const future = await rememberCortexTrace({
    tenantId,
    universeId,
    partition: 'business',
    kind: 'fact',
    claimState: 'PREDICTION',
    label: 'Future inventory rumor',
    summary: 'A future-dated claim must not leak into present recall.',
    validFrom: '2099-01-01T00:00:00.000Z',
    evidenceRefs: ['synthetic:62lx-future'],
    sourceRefs: ['synthetic:62lx-future'],
    root,
  });
  const asOfNow = await recallCortexTraces({ tenantId, universeId, query: 'inventory rumor', asOf: '2026-09-09T00:00:00.000Z', root });
  const asOfFuture = await recallCortexTraces({ tenantId, universeId, query: 'inventory rumor', asOf: '2099-06-01T00:00:00.000Z', root });
  check('US-X2', asOfNow.every((item) => item.id !== future.id), 'Future-dated memory does not leak into present as-of recall.');
  check('US-X2', asOfFuture.some((item) => item.id === future.id), 'Temporal recall returns the memory when as-of is after validFrom.');

  // US-X4 world/business partitions
  await upsertPartitionedKnowledge({
    id: 'world-claim-1',
    tenantId,
    universeId,
    partition: 'world',
    type: 'claim',
    domain: 'history',
    label: 'Public historical account',
    summary: 'A sourced historical account for the world partition.',
    claimState: 'HISTORICAL_ACCOUNT',
    sourceRefs: ['synthetic:62lx-world'],
    classification: 'internal',
    root,
  });
  await upsertPartitionedKnowledge({
    id: 'biz-claim-1',
    tenantId,
    universeId,
    partition: 'business',
    type: 'claim',
    domain: 'business',
    label: 'Company inventory claim',
    summary: 'Sandbox warehouse count is 12.',
    claimState: 'VERIFIED_FACT',
    sourceRefs: ['synthetic:62lx-biz'],
    classification: 'confidential',
    root,
  });
  await upsertPartitionedKnowledge({
    id: 'biz-claim-2',
    tenantId,
    universeId,
    partition: 'business',
    type: 'claim',
    domain: 'business',
    label: 'Conflicting inventory rumor',
    summary: 'Unverified rumor of 40 units.',
    claimState: 'DISPUTED',
    sourceRefs: ['synthetic:62lx-biz'],
    classification: 'confidential',
    root,
  });
  let privatePromoteDenied = false;
  try {
    await upsertPartitionedKnowledge({
      id: 'company-public',
      tenantId,
      universeId,
      partition: 'company',
      type: 'claim',
      domain: 'business',
      label: 'Illegal promotion',
      summary: 'Company secret.',
      claimState: 'VERIFIED_FACT',
      sourceRefs: ['synthetic:62lx'],
      classification: 'public',
      root,
    });
  } catch (error) {
    privatePromoteDenied = error instanceof Error && error.message === 'PRIVATE_KNOWLEDGE_CANNOT_PROMOTE_TO_WORLD';
  }
  const worldNodes = await listPartitionedKnowledge({ tenantId, universeId, partition: 'world', root });
  const businessNodes = await listPartitionedKnowledge({ tenantId, universeId, partition: 'business', root });
  check('US-X4', worldNodes.some((node) => node.id === 'world-claim-1') && !worldNodes.some((node) => node.id === 'biz-claim-1'), 'World partition does not include company business nodes.');
  check('US-X4', businessNodes.length === 2 && privatePromoteDenied, 'Business partition is separate; company knowledge cannot be public-world.');

  // US-X3 contradiction tracking
  const contradiction = await recordContradiction({
    tenantId,
    universeId,
    partition: 'business',
    claimA: 'biz-claim-1',
    claimB: 'biz-claim-2',
    evidenceRefs: ['synthetic:62lx-biz'],
    root,
  });
  const opened = await listContradictions({ tenantId, universeId, partition: 'business', root });
  const investigating = await transitionContradiction({
    id: contradiction.id,
    tenantId,
    universeId,
    state: 'INVESTIGATING',
    note: 'Both claims retained while evidence is compared.',
    root,
  });
  check('US-X3', opened.length === 1 && contradiction.state === 'OPEN' && contradiction.forgotten === false, 'Contradiction is recorded as OPEN without deleting either claim.');
  check('US-X3', investigating.state === 'INVESTIGATING' && investigating.history.length === 2, 'Contradiction history is append-only.');

  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId,
    universeId,
    storyId: 'US-X6',
    summary: 'Warehouse count evidence for 12 units.',
    payload: { count: 12 },
  }, root);

  // US-X6 evidence retrieval pathways
  const localEvidence = await retrieveEvidencePathway({
    tenantId,
    universeId,
    query: 'warehouse',
    partition: 'business',
    root,
  });
  const waiting = await retrieveEvidencePathway({
    tenantId,
    universeId,
    query: 'today market price',
    needsExternalFreshness: true,
    root,
  });
  const cloud = await retrieveEvidencePathway({
    tenantId,
    universeId,
    query: 'remote warehouse API',
    needsCloudProvider: true,
    root,
  });
  check('US-X6', localEvidence.state === 'AVAILABLE' && localEvidence.inventedFacts === false && localEvidence.memoryIds.includes(episode.id) && localEvidence.contradictionIds.includes(contradiction.id), 'Evidence pathway retrieves local memory, graph, and contradictions without inventing facts.');
  check('US-X6', waiting.state === 'WAITING_DATA' && waiting.inventedFacts === false && waiting.evidenceRefs.length === 0, 'External freshness becomes WAITING_DATA.');
  check('US-X6', cloud.state === 'UNAVAILABLE' && cloud.cloudFreshness === 'UNAVAILABLE', 'Unconfigured cloud retrieval is UNAVAILABLE.');

  // US-X5 historical/cultural councils
  const council = await conveneHistoricalCulturalCouncil({
    tenantId,
    universeId,
    topic: 'Historical warehouse practices vs current sandbox count',
    kind: 'historical',
    root,
  });
  const foreignCouncil = await loadCouncil(council.id, 'other-tenant', universeId, root);
  check('US-X5', council.consensusForced === false && council.independentPositions.length === 4 && council.productionAuthorized === false, 'Historical/cultural council writes independent positions and does not force consensus.');
  check('US-X5', foreignCouncil === null && (council.runtimeState === 'UNAVAILABLE' || council.runtimeState === 'COMPLETED'), `Council is tenant-scoped and records runtimeState=${council.runtimeState}.`);

  // US-X7 scenario simulations
  const sim = await runScenarioSimulation({
    tenantId,
    universeId,
    hypothesis: 'If inbound stock arrives, sandbox count stays internally consistent.',
    consequence: 'LOW',
    root,
  });
  const blockedSim = await runScenarioSimulation({
    tenantId,
    universeId,
    hypothesis: 'Deploy production inventory write.',
    consequence: 'CRITICAL',
    production: true,
    root,
  });
  check('US-X7', sim.isReality === false && sim.productionAuthorization === false && sim.status === 'COMPLETED', 'Scenario simulation is not reality and is not production.');
  check('US-X7', blockedSim.status === 'HUMAN_APPROVAL_REQUIRED' && blockedSim.isReality === false, 'Consequential simulation stays human-authorized.');

  // US-X8 classical quant → quantum research bridge
  const bridge = await runClassicalQuantQuantumBridge({
    tenantId,
    universeId,
    signals: [
      { id: 's1', weight: 1, confidence: 0.8, direction: 1, evidenceRefs: ['node:biz-claim-1'] },
      { id: 's2', weight: 1, confidence: 0.3, direction: -1, evidenceRefs: ['node:biz-claim-2'] },
    ],
    quantum: {
      id: 'q-sim-x',
      objective: 'Bounded QAOA research against a classical baseline',
      algorithm: 'qaoa',
      backend: 'classical_simulator',
      qubitCount: 6,
    },
    problem: {
      id: 'p-x',
      variables: 6,
      objective: 'minimize_cost',
      constraints: ['no production routing'],
      provenanceRefs: ['synthetic:62lx'],
    },
    root,
  });
  const qpu = await runClassicalQuantQuantumBridge({
    tenantId,
    universeId,
    signals: [{ id: 's1', weight: 1, confidence: 0.5, direction: 0, evidenceRefs: ['node:biz-claim-1'] }],
    quantum: {
      id: 'q-qpu-x',
      objective: 'Unverified QPU',
      algorithm: 'vqe',
      backend: 'quantum_qpu',
      qubitCount: 4,
      backendVerified: false,
    },
    root,
  });
  check('US-X8', bridge.classical.model === 'classical_probabilistic' && bridge.claimsQuantumAdvantage === false && bridge.productionDependency === false && bridge.quantumState === 'READY_FOR_SIMULATION', 'Classical quant runs first; quantum is bounded research, not a production dependency.');
  check('US-X8', qpu.quantumState === 'UNAVAILABLE' && qpu.quantum?.state === 'UNAVAILABLE', 'Unconfigured QPU remains UNAVAILABLE.');

  // US-X9 outcome learning
  const learned = await recordOutcomeAndLearn({
    tenantId,
    universeId,
    simulationId: sim.id,
    observed: 'Sandbox simulation matched the local count of 12. Not a live warehouse.',
    successful: true,
    memoryIds: [episode.id],
    evidenceRefs: localEvidence.evidenceRefs,
    root,
  });
  const afterLearn = await recallCortexTraces({ tenantId, universeId, query: 'Outcome', root });
  check('US-X9', learned.memory.kind === 'outcome' && learned.learning.productionChange === false && learned.strengthened[0]?.pathwayStrength > episode.pathwayStrength, 'Outcomes write the learning ledger and strengthen future memory pathways.');
  check('US-X9', afterLearn.some((item) => item.id === learned.memory.id), 'Outcome memory is durable in the cortex.');

  // US-X10 retention / forgetting
  const ephemeral = await rememberCortexTrace({
    tenantId,
    universeId,
    partition: 'business',
    kind: 'episode',
    claimState: 'UNKNOWN',
    label: 'Ephemeral scratch',
    summary: 'This should expire.',
    retentionClass: 'ephemeral',
    now: '2020-01-01T00:00:00.000Z',
    evidenceRefs: ['synthetic:62lx-ttl'],
    sourceRefs: ['synthetic:62lx-ttl'],
    root,
  });
  const retention = await applyCortexRetention({ tenantId, universeId, now: '2026-09-09T00:00:00.000Z', root });
  const forgottenVisible = await recallCortexTraces({ tenantId, universeId, query: 'Ephemeral scratch', root });
  const forgottenAudit = await recallCortexTraces({ tenantId, universeId, query: 'Ephemeral scratch', includeForgotten: true, root });
  const stillContradictions = await listContradictions({ tenantId, universeId, root });
  const forgottenContradiction = await forgetCortexTrace({ id: episode.id, tenantId, universeId, root });
  check('US-X10', retention.forgotten >= 1 && forgottenVisible.every((item) => item.id !== ephemeral.id), 'Expired ephemeral traces are forgotten from default recall.');
  check('US-X10', forgottenAudit.some((item) => item.id === ephemeral.id && item.forgottenAt) && stillContradictions[0]?.forgotten === false, 'Forgotten traces remain auditable; contradiction history is not deleted.');
  check('US-X10', forgottenContradiction.forgottenAt !== undefined && stillContradictions.length === 1, 'Forgetting a related memory does not delete the contradiction record.');

  // US-X11 Cortex health reporting
  const health = await buildCortexHealthReport(root);
  check('US-X11', health.productionAuthorization === false && health.inventedPass === false && health.safety.l4AutonomyEnabled === false, 'Cortex health preserves production and L4 locks.');
  check('US-X11', health.providers.every((slot) => slot.configured || slot.state === 'UNAVAILABLE') && health.quantumProductionDependency === false, 'Unconfigured providers remain UNAVAILABLE in health.');
  check('US-X11', health.next === '62L-Y — Global Brain Executive Cortex + Autonomous Research Laboratory' && health.founderTwinIsRealFounder === false, 'NEXT is 62L-Y only; founder twin is not real founder authority.');

  const pathway = await runMemoryCortexPathway({
    tenantId,
    universeId,
    objective: 'Review sandbox inventory evidence and record a local lesson',
    consequence: 'LOW',
    conveneCouncil: true,
    simulate: true,
    signals: [{ id: 's1', weight: 1, confidence: 0.7, direction: 1, evidenceRefs: ['node:biz-claim-1'] }],
    root,
  });
  check('US-X1', pathway.twin.twinIsRealFounder === false && pathway.neuralHighways.productionAuthorization === false && pathway.toolMesh.liveSystems === 'UNAVAILABLE', 'Pathway reuses Founder report, Neural Fabric highways, Agent Bus, and Tool Mesh without live systems.');
  check('US-X7', pathway.simulation?.isReality === false && pathway.buildTest.executed === false && pathway.productionAuthorization === false, 'End-to-end pathway does not execute merge/deploy/build-test as production.');
  check('US-X9', pathway.outcome?.productionAuthorization === false && pathway.next.startsWith('62L-Y'), 'Outcome learning is recorded; 62L-Y is noted only.');

  if (failures.length) {
    console.error('62L-X tests FAIL');
    for (const failure of failures) console.error(` - ${failure}`);
    process.exitCode = 1;
  } else {
    console.log('62L-X safety tests PASS');
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
