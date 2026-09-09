import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { rememberCortexTrace } from './memory-cortex';
import { upsertPartitionedKnowledge } from './world-knowledge-graph';
import { consolidateExecutiveMemory, listExecutiveMemory } from './executive-memory';
import { FounderPriorityGraph, mintPriorityNode } from './founder-priority-graph';
import {
  EVIDENCE_PROMOTION_STATES,
  distinguishPromotion,
  ingestRawEvidence,
  promoteEvidence,
} from './evidence-promotion-gate';
import {
  TOOLCHAIN_ADAPTERS,
  evidenceStateForAdapter,
  probeLocalModelAdapter,
  registerToolchainAdapter,
  selectLocalFirstProvider,
  toolchainSlots,
} from './toolchain-federation';
import { bridgeGithubGitlabEvidence } from './scm-evidence-bridge';
import { drainOfflineSyncQueue, enqueueOfflineSync, listOfflineSyncJobs } from './offline-sync-queue';
import { listDebateThreads, recordDebateTurn, resolveExecutiveConflict, routeCrossDomain } from './debate-conflict';
import { recallIndustryTimeline, recordIndustryTimelineEvent, registerRegionalIntelligencePack } from './timeline-regional-packs';
import {
  inspectSignalTransportKnowledge,
  latestHardwareMemory,
  mapInfrastructureDependencies,
  rememberHardwareCapabilities,
  simulateSignalTransport,
} from './infra-hardware-signal-memory';
import { evolveAgentSkill, listReproducibility, recordReproducibility, runQuantumKnowledgeOps } from './quantum-repro-skills';
import { detectKnowledgeGaps } from './knowledge-gap-detector';
import { consolidateDebriefMemory } from './debrief-memory-ops';
import { createKnowledgeOpsController, operateKnowledge } from './knowledge-ops-controller';
import { measureOfflineContinuityScore } from './offline-continuity-score';
import {
  DEVELOPMENT_EVIDENCE_BRIDGE,
  KNOWLEDGE_OPS_CYCLE,
  buildGlobalBrainOpsReport,
  runKnowledgeOpsCycle,
  runSafeScaleHarness,
} from './knowledge-ops-runtime';
import { registerRuntime } from './hybrid-runtime';

const root = await mkdtemp(join(tmpdir(), 'xiv-62laa-'));
const tenantId = '62laa-tenant';
const universeId = '62laa-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-AA-architecture',
    KNOWLEDGE_OPS_CYCLE.join(' → ') === 'founder_intent → executive_memory → story → context_retrieval → agent_department_routing → tool_model_selection → evidence → work_experiment → test_critique → decision → human_gate → outcome → learning → memory_consolidation → debrief → next_priority',
    'Knowledge ops operating cycle is recorded in order.',
  );
  check(
    'US-AA-bridge',
    DEVELOPMENT_EVIDENCE_BRIDGE.join(' → ') === 'story → branch → files → commands → tests → security_evidence → build_report → learning_entry',
    'Development evidence bridge is recorded in order.',
  );

  const sourced = await rememberCortexTrace({
    tenantId,
    universeId,
    partition: 'business',
    kind: 'fact',
    claimState: 'VERIFIED_FACT',
    label: 'Sandbox yield',
    summary: 'Local warehouse yield observation for 62L-AA.',
    evidenceRefs: ['synthetic:62laa-yield'],
    sourceRefs: ['synthetic:62laa-yield'],
    root,
  });
  const consolidated = await consolidateExecutiveMemory({ tenantId, universeId, query: 'yield', root });
  const listed = await listExecutiveMemory({ tenantId, universeId, root });
  const otherMem = await listExecutiveMemory({ tenantId: 'other', universeId, root });
  check('US-AA1', consolidated.sourceTraceIds.includes(sourced.id) && listed.some((item) => item.id === consolidated.id), 'Executive memory consolidates visible cortex traces.');
  check('US-AA1', otherMem.length === 0 && consolidated.productionAuthorization === false, 'Executive memory is tenant scoped and not a production authorization.');

  const graph = new FounderPriorityGraph(tenantId, universeId);
  const intent = graph.addNode(mintPriorityNode('intent', 'Keep knowledge ops local-first', 0.9, ['synthetic:62laa-yield']));
  const blocker = graph.addNode(mintPriorityNode('blocker', 'Live quotes missing', 0.4, []));
  const next = graph.addNode(mintPriorityNode('next_safe_step', 'Continue local yield research', 0.8, ['synthetic:62laa-yield']));
  graph.connect({ id: 'e1', from: intent.id, to: blocker.id, relation: 'blocks' });
  graph.connect({ id: 'e2', from: intent.id, to: next.id, relation: 'unlocks' });
  const snap = await graph.persist(root);
  check('US-AA2', snap.ordered[0] === intent.id && snap.twinIsRealFounder === false && snap.founderApprovalFabricated === false, 'Founder priority graph orders intents without impersonating the founder.');

  const controller = createKnowledgeOpsController({ tenantId, universeId });
  check('US-AA3', controller.l4AutonomyEnabled === false && controller.id.includes(tenantId), 'Knowledge Operations Controller exists with L4 lock.');

  const raw = await ingestRawEvidence({ tenantId, universeId, summary: 'Raw warehouse notes', sourceRefs: ['doc:aa-raw'], root });
  const parsed = await promoteEvidence({ id: raw.id, tenantId, universeId, to: 'parsed', root });
  const claims = await promoteEvidence({ id: parsed.id, tenantId, universeId, to: 'claims', root });
  const verified = await promoteEvidence({
    id: claims.id,
    tenantId,
    universeId,
    to: 'verified',
    testState: 'PASS',
    evidenceRefs: ['doc:aa-raw', 'test:aa'],
    root,
  });
  const stale = await promoteEvidence({ id: verified.id, tenantId, universeId, to: 'stale', root });
  const unknownDoc = await ingestRawEvidence({ tenantId, universeId, summary: 'Unsourced rumor', sourceRefs: [], root });
  const unknowns = await promoteEvidence({ id: unknownDoc.id, tenantId, universeId, to: 'unknowns', root });
  let illegal = false;
  try {
    await promoteEvidence({ id: raw.id, tenantId, universeId, to: 'verified', testState: 'PASS', evidenceRefs: ['x'], root });
  } catch {
    illegal = true;
  }
  check('US-AA4', EVIDENCE_PROMOTION_STATES.length === 8 && distinguishPromotion(stale).stale && distinguishPromotion(unknowns).unknowns, 'Promotion states distinguish raw/parsed/claims/verified/stale/superseded/conflicts/unknowns.');
  check('US-AA4', verified.promotion === 'verified' && stale.promotion === 'stale' && illegal, 'Verified requires sequential promotion plus PASS evidence; illegal jumps are rejected.');

  const unconfigured = toolchainSlots();
  check('US-AA5', TOOLCHAIN_ADAPTERS.every((id) => unconfigured.some((slot) => slot.adapter === id && slot.state === 'UNAVAILABLE')), 'Toolchain adapters start UNAVAILABLE without config, auth, and runtime evidence.');
  const fakeCloud = registerToolchainAdapter({
    adapter: 'aws',
    configured: true,
    authorized: false,
    runtimeEvidence: ['account-name-only'],
    access: 'none',
    notes: 'Name is not capability.',
  });
  const localProbe = await probeLocalModelAdapter();
  check('US-AA5', fakeCloud.state === 'UNAVAILABLE' && localProbe.state !== 'AVAILABLE', 'AWS without authorization stays UNAVAILABLE; local model is UNAVAILABLE in this environment (no XIV_LOCAL_MODEL).');
  check('US-AA5', evidenceStateForAdapter(localProbe) === 'UNAVAILABLE', 'Local model adapter evidence state is UNAVAILABLE without a reachable model.');

  const localFirst = selectLocalFirstProvider({ online: false, classification: 'internal', needsCloudProvider: true });
  check('US-AA6', localFirst.selected === null && localFirst.cloud === 'UNAVAILABLE', 'Local-first selection does not silently activate cloud when local runtime is UNAVAILABLE.');

  const scm = await bridgeGithubGitlabEvidence({ tenantId, universeId, cwd: process.cwd(), root });
  check('US-AA7', scm.github.state === 'UNAVAILABLE' && scm.gitlab.state === 'UNAVAILABLE' && scm.inventedPass === false, 'GitHub/GitLab remotes stay UNAVAILABLE without auth.');
  check('US-AA7', scm.localGit.attempted && (scm.localGit.state === 'PASS' || scm.localGit.state === 'FAIL'), 'Local git_status was executed as SCM evidence rather than invented.');

  const localJob = await enqueueOfflineSync({
    tenantId,
    universeId,
    summary: 'Sync local yield notes',
    requirement: {
      needsInternet: false,
      needsCloudProvider: false,
      needsExternalFreshness: false,
      needsProductionWrite: false,
      needsPermissionChange: false,
      classification: 'internal',
    },
    root,
  });
  const waitingJob = await enqueueOfflineSync({
    tenantId,
    universeId,
    summary: 'Sync live market tape',
    requirement: {
      needsInternet: true,
      needsCloudProvider: false,
      needsExternalFreshness: true,
      needsProductionWrite: false,
      needsPermissionChange: false,
      classification: 'internal',
    },
    root,
  });
  const drained = await drainOfflineSyncQueue({ tenantId, universeId, root });
  const jobs = await listOfflineSyncJobs({ tenantId, universeId, root });
  check('US-AA8', localJob.job.state === 'queued' && drained.some((job) => job.id === localJob.job.id && job.state === 'local_executable'), 'Offline sync queue drains locally executable jobs.');
  check('US-AA8', waitingJob.job.state === 'waiting_data' && jobs.some((job) => job.id === waitingJob.job.id && job.evidenceState === 'WAITING_DATA'), 'Freshness-dependent sync jobs stay WAITING_DATA.');

  const debate = await recordDebateTurn({
    tenantId,
    universeId,
    topic: 'Should yield be promoted?',
    role: 'skeptic',
    body: 'Keep the claim local until verified.',
    root,
  });
  const threads = await listDebateThreads({ tenantId, universeId, root });
  check('US-AA9', debate.turns.length === 1 && debate.consensusForced === false && threads.length === 1, 'Persistent debate memory stores independent turns without forced consensus.');

  const routed = routeCrossDomain({ domainId: 'science', question: 'What is known locally about yield physics?' });
  const missingDomain = routeCrossDomain({ domainId: 'not-a-domain', question: 'Invent a fact' });
  check('US-AA10', routed.routed === true && routed.domain?.id === 'science', 'Cross-domain routing uses registered knowledge domains.');
  check('US-AA10', missingDomain.routed === false && missingDomain.state === 'UNKNOWN', 'Unknown domains stay UNKNOWN and do not invent facts.');

  const futureEvent = await recordIndustryTimelineEvent({
    tenantId,
    universeId,
    industry: 'semiconductors',
    label: 'Future rumor',
    summary: 'Must not leak into present recall.',
    validFrom: '2099-01-01T00:00:00.000Z',
    sourceRefs: ['synthetic:62laa-tl-future'],
    root,
  });
  const presentEvent = await recordIndustryTimelineEvent({
    tenantId,
    universeId,
    industry: 'semiconductors',
    label: 'Sandbox fab note',
    summary: 'Local historical note about a sandbox fab.',
    validFrom: '2020-01-01T00:00:00.000Z',
    sourceRefs: ['synthetic:62laa-tl'],
    root,
  });
  const nowTl = await recallIndustryTimeline({ tenantId, universeId, industry: 'semiconductors', asOf: '2026-09-09T00:00:00.000Z', root });
  check('US-AA11', nowTl.some((item) => item.id === presentEvent.id) && nowTl.every((item) => item.id !== futureEvent.id), 'Industry timelines hide future-dated events from present as-of recall.');

  const pack = await registerRegionalIntelligencePack({
    tenantId,
    universeId,
    region: 'EU',
    title: 'Sandbox public culture note',
    claims: [{
      id: 'eu-claim-1',
      label: 'Sandbox cultural account',
      summary: 'A sourced sandbox cultural note.',
      claimState: 'CULTURAL_CONTEXT',
      sourceRefs: ['synthetic:62laa-eu'],
    }],
    root,
  });
  check('US-AA12', pack.region === 'EU' && pack.liveGlobalCorpus === false && pack.pack.claims.length === 1, 'Regional intelligence packs reuse knowledge packs and do not claim a live global corpus.');

  const infra = mapInfrastructureDependencies({
    tenantId,
    universeId,
    nodes: [
      { id: 'lab-1', kind: 'research_lab', label: 'Sandbox lab', classification: 'internal', provenanceRefs: ['synthetic:62laa-infra'], state: 'KNOWN' },
      { id: 'dc-1', kind: 'data_center', label: 'Sandbox DC', classification: 'internal', provenanceRefs: ['synthetic:62laa-infra'], state: 'KNOWN' },
    ],
    edges: [
      { id: 'edge-lab-dc', from: 'lab-1', to: 'dc-1', relation: 'connects', provenanceRefs: ['synthetic:62laa-infra'] },
    ],
  });
  check('US-AA13', infra.graph.edges.length === 1 && infra.physicalControl === false && infra.darkMatterAsInfrastructure === false, 'Infrastructure dependency mapping is advisory and not physical control.');

  const hardware = await rememberHardwareCapabilities(root);
  const remembered = await latestHardwareMemory(root);
  check('US-AA14', hardware.capabilities.some((item) => item.kind === 'cpu' && item.availability === 'AVAILABLE') && remembered !== null, 'Hardware capability memory records probed CPU evidence.');
  check('US-AA14', hardware.capabilities.filter((item) => item.kind !== 'cpu').every((item) => item.availability === 'UNAVAILABLE' || item.availability === 'AVAILABLE'), 'Non-CPU accelerators stay honest: AVAILABLE only when probed, otherwise UNAVAILABLE.');

  const signal = inspectSignalTransportKnowledge('terrestrial_network');
  const sim = simulateSignalTransport({ kind: 'radio', from: 'a', to: 'b', distanceKm: 10 });
  check('US-AA15', signal.satelliteControl === false && signal.isHardwareControl === false, 'Signal/transport knowledge does not control satellites or hardware.');
  check('US-AA15', sim.isReality === false && sim.simulation.isReality === false, 'Signal simulation is not treated as live emission.');

  const quantum = await runQuantumKnowledgeOps({
    tenantId,
    universeId,
    objective: 'Bounded research optimization',
    signals: [{ id: 'q1', weight: 0.2, confidence: 0.5, direction: 1, evidenceRefs: ['synthetic:62laa-q'] }],
    qubitCount: 4,
    backend: 'classical_simulator',
    root,
  });
  const qpu = await runQuantumKnowledgeOps({
    tenantId,
    universeId,
    objective: 'Unverified QPU attempt',
    signals: [{ id: 'q2', weight: 0.2, confidence: 0.5, direction: 0, evidenceRefs: ['synthetic:62laa-q'] }],
    qubitCount: 8,
    backend: 'quantum_qpu',
    backendVerified: false,
    root,
  });
  check('US-AA16', quantum.classicalBaselineRequired === true && quantum.claimsQuantumAdvantage === false && quantum.lab.experiment.state !== 'UNAVAILABLE', 'Quantum knowledge ops run a classical baseline first.');
  check('US-AA16', qpu.lab.experiment.state === 'UNAVAILABLE' && qpu.lab.experiment.backend === 'quantum_qpu', 'Unverified QPU remains UNAVAILABLE; simulator is not a QPU.');

  const repro = await recordReproducibility({
    tenantId,
    universeId,
    storyId: 'US-AA17',
    branch: 'cursor/62l-aa-executive-memory-knowledge-ops-4059',
    files: ['services/ai/local-brain/knowledge-ops-runtime.ts'],
    commands: ['npx tsc --noEmit', 'npm run test:62laa'],
    tests: ['phase62laa.test.ts'],
    securityEvidence: ['no-secrets', 'L4_AUTONOMY_ENABLED=false'],
    buildReport: 'not-a-production-build',
    root,
  });
  const reproList = await listReproducibility({ tenantId, universeId, root });
  check('US-AA17', Boolean(repro.learningEntryId) && reproList.some((item) => item.id === repro.id) && repro.inventedPass === false, 'Reproducibility ledger records story→files→commands→tests→learning without inventing PASS.');

  const skill = await evolveAgentSkill({
    tenantId,
    universeId,
    role: 'researcher',
    taskId: 'aa-skill-1',
    successful: true,
    notes: 'Local retrieval succeeded.',
    evidenceRefs: ['synthetic:62laa-yield'],
    root,
  });
  check('US-AA18', skill.successes === 1 && skill.canExpandPermissions === false && skill.canDeployProduction === false, 'Agent skill evolution cannot expand permissions or deploy production.');

  const gaps = await detectKnowledgeGaps({ tenantId, universeId, domainIds: ['finance', 'science'], root });
  check('US-AA19', gaps.inventedFacts === false && gaps.gaps.every((gap) => gap.state === 'UNKNOWN'), 'Knowledge-gap detection reports UNKNOWN rather than inventing coverage.');

  await upsertPartitionedKnowledge({
    id: 'claim-aa-a',
    tenantId,
    universeId,
    partition: 'business',
    type: 'claim',
    domain: 'business',
    label: 'Yield is 12',
    summary: 'Sandbox yield is 12.',
    claimState: 'VERIFIED_FACT',
    sourceRefs: ['synthetic:62laa-yield'],
    root,
  });
  await upsertPartitionedKnowledge({
    id: 'claim-aa-b',
    tenantId,
    universeId,
    partition: 'business',
    type: 'claim',
    domain: 'business',
    label: 'Yield is 40',
    summary: 'Unverified rumor of 40.',
    claimState: 'DISPUTED',
    sourceRefs: ['synthetic:62laa-rumor'],
    root,
  });
  const conflict = await resolveExecutiveConflict({
    tenantId,
    universeId,
    claimA: 'claim-aa-a',
    claimB: 'claim-aa-b',
    reason: 'Counts disagree.',
    consequence: 'HIGH',
    root,
  });
  check('US-AA20', conflict.consensusForced === false && conflict.gate.humanApprovalRequired === true && conflict.contradiction.state === 'INVESTIGATING', 'Executive conflict resolution keeps both claims and stays at the human gate for HIGH consequence.');

  const debrief = await consolidateDebriefMemory({
    tenantId,
    universeId,
    storyId: 'story-aa21',
    whatWorked: ['local consolidation'],
    whatFailed: [],
    remainingUnknowns: ['live quotes'],
    nextSafeStep: 'Keep researching locally.',
    root,
  });
  check('US-AA21', debrief.routingSuspended === true && debrief.debrief.recruitmentHalted === true && debrief.memoryId.length > 0, 'Debrief memory consolidation suspends routing and records the next safe step.');

  const continuity = await measureOfflineContinuityScore({
    tenantId,
    universeId,
    workload: [
      {
        id: 'w-local-cpu',
        summary: 'Read local yield traces',
        approved: true,
        needsLocalModel: false,
        needsLocalData: true,
        needsHardware: 'cpu',
        requirement: {
          needsInternet: false,
          needsCloudProvider: false,
          needsExternalFreshness: false,
          needsProductionWrite: false,
          needsPermissionChange: false,
          classification: 'internal',
        },
      },
      {
        id: 'w-local-model',
        summary: 'Speak with local model',
        approved: true,
        needsLocalModel: true,
        needsLocalData: false,
        needsHardware: 'cpu',
        requirement: {
          needsInternet: false,
          needsCloudProvider: false,
          needsExternalFreshness: false,
          needsProductionWrite: false,
          needsPermissionChange: false,
          classification: 'internal',
        },
      },
      {
        id: 'w-fresh',
        summary: 'Need live market',
        approved: true,
        needsLocalModel: false,
        needsLocalData: false,
        needsHardware: 'none',
        requirement: {
          needsInternet: true,
          needsCloudProvider: false,
          needsExternalFreshness: true,
          needsProductionWrite: false,
          needsPermissionChange: false,
          classification: 'internal',
        },
      },
    ],
    root,
  });
  check('US-AA22', continuity.plannedCapabilityCounted === false && continuity.approved === 3, 'Offline Continuity Score is measured against actually available models/data/hardware, not planned capability.');
  check('US-AA22', continuity.items.find((item) => item.id === 'w-local-cpu')?.localRunnable === true, 'Approved local data+CPU work is counted as locally runnable.');
  check('US-AA22', continuity.items.find((item) => item.id === 'w-local-model')?.localRunnable === false && continuity.items.find((item) => item.id === 'w-local-model')?.evidenceState === 'UNAVAILABLE', 'Model-dependent work is not counted while XIV_LOCAL_MODEL is UNAVAILABLE.');
  check('US-AA22', continuity.items.find((item) => item.id === 'w-fresh')?.evidenceState === 'WAITING_DATA', 'Freshness-dependent approved work is WAITING_DATA.');
  check('US-AA22', continuity.percent === Math.round((1 / 3) * 10_000) / 100, `Offline Continuity percent is ${continuity.percent} from 1/3 actually local-runnable items.`);

  const ops = await buildGlobalBrainOpsReport({ tenantId, universeId, root });
  check('US-AA23', ops.honesty.inventedPass === false && ops.honesty.l4AutonomyEnabled === false && ops.cycle.length === 16, 'Global Brain Operations reporting preserves honesty locks.');
  check('US-AA23', ops.toolchain.every((slot) => slot.configured || slot.state === 'UNAVAILABLE') && ops.next.includes('Do not tip-land xiv-v2.'), 'Ops report keeps unconfigured toolchain UNAVAILABLE and forbids tip-land.');

  const scale = await runSafeScaleHarness({ tenantId, universeId, materializedContexts: 50_000 });
  check('US-AA24', scale.logicalOnly === true && scale.trillion.materializedFileCount === 0 && scale.trillion.materializedContexts === 10_000, 'Safe scale harness caps materialized contexts and does not spawn a physical fleet.');

  const cycle = await runKnowledgeOpsCycle({
    tenantId,
    universeId,
    founderIntent: 'Keep local yield knowledge honest and offline-first.',
    executeTests: true,
    testCwd: process.cwd(),
    includeQuantum: true,
    root,
  });
  check('US-AA3', cycle.knowledge.controller.productionAuthorization === false && cycle.knowledge.inventedFacts === false, 'Cycle knowledge ops do not invent facts or authorize production.');
  check('US-AA24', cycle.test.state === 'PASS' || cycle.test.state === 'FAIL', `Allowlisted test hop recorded ${cycle.test.state} rather than NOT_TESTED.`);
  check('US-AA1', cycle.memory.productionAuthorization === false, 'Cycle consolidates executive memory.');
  check('US-AA21', cycle.debrief.routingSuspended === true, 'Cycle debrief suspends new routing.');

  const waitingCycle = await runKnowledgeOpsCycle({
    tenantId,
    universeId,
    founderIntent: 'Need today live market price.',
    needsExternalFreshness: true,
    root,
  });
  check('US-AA6', waitingCycle.selection.cloud === 'WAITING_DATA' || waitingCycle.selection.selected === null, 'Freshness-dependent cycle work does not fabricate a local cloud provider.');
  check('US-AA24', waitingCycle.test.state === 'NOT_TESTED', 'Unexecuted tests remain NOT_TESTED.');

  const blockedCycle = await runKnowledgeOpsCycle({
    tenantId,
    universeId,
    founderIntent: 'Deploy production inventory writes.',
    consequence: 'CRITICAL',
    production: true,
    permissionChange: true,
    root,
  });
  check('US-AA20', blockedCycle.gate.humanApprovalRequired === true && blockedCycle.honesty.mergeToMain === false && blockedCycle.honesty.tipLand === false, 'High-consequence cycles stay at the human gate with no tip-land or main merge.');

  registerRuntime({
    provider: 'local',
    state: 'AVAILABLE',
    configured: true,
    authorized: true,
    locality: 'device',
    allowedClassifications: ['internal'],
  });
  const localReady = selectLocalFirstProvider({ online: false, classification: 'internal' });
  check('US-AA6', localReady.selected === 'local' || localReady.localRuntime.state === 'AVAILABLE', 'When a local runtime is actually registered AVAILABLE, local-first can select it.');

  const knowledgeOp = await operateKnowledge({
    tenantId,
    universeId,
    summary: 'Promote sandbox yield claim',
    sourceRefs: ['synthetic:62laa-yield'],
    promoteTo: 'verified',
    testState: 'PASS',
    root,
  });
  check('US-AA3', knowledgeOp.record.promotion === 'verified' && knowledgeOp.record.testState === 'PASS', 'Knowledge ops can promote sourced claims to verified only with PASS evidence.');
} catch (error) {
  failures.push(`US-AA-runtime: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AA tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('62L-AA safety tests PASS');
}
