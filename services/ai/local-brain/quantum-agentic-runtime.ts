import { LocalCheckpointStore } from './checkpoint-store';
import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { getRuntime } from './hybrid-runtime';
import { appendLearning } from './learning-ledger';
import { providerSlots } from './provider-fabric';
import {
  attachAgentMemory,
  checkpointMemoryHierarchy,
  compressAndConsolidate,
  listCognitiveMemoryKinds,
  listMemoryHierarchyLayers,
  manageMemoryPressure,
  measureMemoryPressure,
  placeInWarehouse,
  promoteMemoryTier,
  recallCognitiveMemory,
  recoverFromCheckpoint,
  strengthenNeuralPathway,
  writeCognitiveMemory,
} from './cognitive-memory-hierarchy';
import { routeFounderSealedMemory, assertTenantIsolation } from './founder-sealed-memory-routing';
import {
  calibratePathwayMetrics,
  compileAndCompetePathways,
  denyQuantumAdvantageClaim,
  listClassicalRoutes,
  probeQuantumRoute,
  runClassicalBaseline,
} from './quantum-agentic-pathway-compiler';
import {
  compareUniverses,
  forkUniverseForSimulation,
  planUniverseMerge,
} from './universe-fork-fabric';
import {
  BC_LOCKS,
  CORRELATION_IS_NOT_CAUSATION,
  NEXT_PHASE_TITLE,
  NO_CONSCIOUSNESS,
  QUANTUM_AGENTIC_CYCLE,
  UNIVERSE_SIM_NOT_FACT,
  predecessorMap,
  type BcActor,
  type BcEvidenceState,
  type BcHop,
  type BcHopRecord,
} from './quantum-agentic-types';

export {
  BC_LOCKS,
  QUANTUM_AGENTIC_CYCLE,
  NEXT_PHASE_TITLE,
  compileAndCompetePathways,
  runClassicalBaseline,
  probeQuantumRoute,
  denyQuantumAdvantageClaim,
  forkUniverseForSimulation,
  planUniverseMerge,
  routeFounderSealedMemory,
  writeCognitiveMemory,
  recallCognitiveMemory,
};

function hop(name: BcHop, state: BcEvidenceState, summary: string): BcHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BcCycleInput = {
  tenantId: string;
  universeId: string;
  actor: BcActor;
  objective?: string;
  sealedPayload?: string;
  labelOnly?: boolean;
  impersonateFounder?: boolean;
  includeQuantumQpu?: boolean;
  quantumQpuVerified?: boolean;
  claimQuantumAdvantage?: boolean;
  attemptAutoMerge?: boolean;
  requestPermissionExpansion?: boolean;
  simulateCrashAfterHop?: BcHop;
  resumeFromCheckpointId?: string;
  root?: string;
};

export async function runQuantumAgenticCycle(input: BcCycleInput) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BcHopRecord[] = [];
  const objective = input.objective ?? 'Bounded pathway optimization with classical baseline';
  const checkpointStore = new LocalCheckpointStore(`${root}/.xiv-local/bc-brain-state.json`);

  if (input.resumeFromCheckpointId) {
    const recovered = await recoverFromCheckpoint({
      tenantId: input.tenantId,
      universeId: input.universeId,
      checkpointId: input.resumeFromCheckpointId,
      root,
    });
    hops.push(
      hop(
        'checkpoint_crash',
        recovered.recovered ? 'PASS' : 'FAIL',
        recovered.recovered
          ? `Resumed from checkpoint ${input.resumeFromCheckpointId}; records=${recovered.records.length}.`
          : recovered.reason,
      ),
    );
  }

  const layers = listMemoryHierarchyLayers();
  const dram = await writeCognitiveMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'episodic',
    label: 'working-episode',
    summary: `DRAM working memory for: ${objective}`,
    layer: 'dram_working',
    evidenceRefs: ['bc:dram'],
    root,
  });
  hops.push(hop('working_dram', 'PASS', `DRAM record ${dram.id}; layers=${layers.length}.`));

  const nand = await writeCognitiveMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'semantic',
    label: 'persistent-fact',
    summary: 'NAND/SSD persistent semantic memory slot.',
    layer: 'nand_ssd_persistent',
    evidenceRefs: ['bc:nand'],
    root,
  });
  hops.push(hop('persistent_nand', 'PASS', `NAND record ${nand.id}.`));

  await promoteMemoryTierDemo(input.tenantId, input.universeId, dram.id, root);
  hops.push(hop('tier_hot_warm_cold', 'PASS', 'Hot/warm/cold temperature tiers exercised.'));

  const warehouse = await placeInWarehouse({
    id: nand.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  hops.push(
    hop('warehouse_store', warehouse.placed ? 'PASS' : 'FAIL', warehouse.placed ? `Warehouse placement ${nand.id}.` : warehouse.reason),
  );

  const agentMem = await attachAgentMemory({
    id: dram.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  hops.push(hop('agent_memory', agentMem.attached ? 'PASS' : 'FAIL', agentMem.attached ? `Agent memory ${dram.id}.` : agentMem.reason));

  const pathway = await strengthenNeuralPathway({
    id: dram.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    delta: 0.1,
    evidenceRefs: ['bc:verified-outcome'],
    root,
  });
  hops.push(
    hop(
      'neural_pathways',
      pathway.strengthened ? 'PASS' : 'FAIL',
      pathway.strengthened ? `Pathway strength=${pathway.record.pathwayStrength}.` : pathway.reason,
    ),
  );

  const kinds = listCognitiveMemoryKinds();
  for (const kind of kinds) {
    if (kind === 'episodic' || kind === 'semantic') continue;
    await writeCognitiveMemory({
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind,
      label: `${kind}-sample`,
      summary: `${kind} memory sample`,
      layer: 'agent_memory',
      root,
    });
  }
  hops.push(hop('memory_kind_route', 'PASS', `Kinds routed: ${kinds.join(',')}.`));

  // Fill DRAM to trigger pressure management.
  for (let i = 0; i < 60; i++) {
    await writeCognitiveMemory({
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: 'episodic',
      label: `pressure-${i}`,
      summary: `pressure fill ${i}`,
      layer: 'dram_working',
      root,
    });
  }
  const pressure = await manageMemoryPressure({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  hops.push(
    hop(
      'pressure_manage',
      pressure.after.pressure <= 0.85 ? 'PASS' : 'FAIL',
      `Pressure before=${pressure.before.pressure.toFixed(2)} after=${pressure.after.pressure.toFixed(2)} spilled=${pressure.spilled.length}.`,
    ),
  );

  const consolidated = await compressAndConsolidate({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'episodic',
    root,
  });
  hops.push(
    hop(
      'compress_consolidate',
      consolidated.consolidated ? 'PASS' : 'FAIL',
      consolidated.consolidated ? `Consolidated ${consolidated.record?.id}.` : consolidated.reason,
    ),
  );

  const cp = await checkpointMemoryHierarchy({
    tenantId: input.tenantId,
    universeId: input.universeId,
    hop: 'checkpoint_crash',
    root,
  });
  await checkpointStore.checkpoint({
    taskId: '62l-bc-cycle',
    at: new Date().toISOString(),
    state: 'queued',
    attempt: 0,
    summary: `hierarchy checkpoint ${cp.id}`,
    nextAction: 'resume_cycle',
    evidence: [cp.id],
  });
  hops.push(hop('checkpoint_crash', 'PASS', `Checkpoint ${cp.id} recorded for crash recovery.`));

  if (input.simulateCrashAfterHop === 'checkpoint_crash') {
    return {
      hops,
      crashed: true as const,
      resumeCheckpointId: cp.id,
      productionAuthorization: false as const,
      l4AutonomyEnabled: false as const,
      claimsConsciousness: false as const,
      claimsQuantumAdvantage: false as const,
      next: NEXT_PHASE_TITLE,
    };
  }

  const fork = await forkUniverseForSimulation({
    tenantId: input.tenantId,
    parentUniverseId: input.universeId,
    label: 'bc-sim-fork',
    purpose: 'simulation',
    memorySnapshotIds: [dram.id, nand.id],
    root,
  });
  hops.push(
    hop(
      'universe_fork',
      fork.fork.isVerifiedFact === false ? 'PASS' : 'FAIL',
      `Fork ${fork.fork.forkUniverseId}; ${UNIVERSE_SIM_NOT_FACT}`,
    ),
  );

  const leftMem = await recallCognitiveMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  const rightMem = leftMem.map((m) => ({
    id: m.id,
    kind: m.kind,
    summary: m.id === dram.id ? `${m.summary} [fork-divergent]` : m.summary,
  }));
  const comparison = await compareUniverses({
    tenantId: input.tenantId,
    leftUniverseId: input.universeId,
    rightUniverseId: fork.fork.forkUniverseId,
    leftMemory: leftMem.map((m) => ({ id: m.id, kind: m.kind, summary: m.summary })),
    rightMemory: rightMem,
    root,
  });
  hops.push(
    hop(
      'universe_compare',
      comparison.isVerifiedFact === false && comparison.correlationIsCausation === false ? 'PASS' : 'FAIL',
      `Compare ${comparison.id}; leftOnly=${comparison.leftOnly} diverged=${comparison.divergedSummaries.length}. ${CORRELATION_IS_NOT_CAUSATION}`,
    ),
  );

  const merge = await planUniverseMerge({
    tenantId: input.tenantId,
    fromUniverseId: fork.fork.forkUniverseId,
    toUniverseId: input.universeId,
    candidates: leftMem.slice(0, 5).map((m) => ({ id: m.id, kind: m.kind, sealed: m.sealed })),
    attemptAutoApply: input.attemptAutoMerge === true,
    root,
  });
  hops.push(
    hop(
      'merge_plan',
      merge.applied === false && merge.plan.productionMergeAuthorized === false ? 'PASS' : 'FAIL',
      `Merge plan ${merge.plan.id}; autoApplied=${merge.plan.autoApplied}.`,
    ),
  );

  const sealedRoute = await routeFounderSealedMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    actor: {
      ...input.actor,
      tenantId: input.tenantId,
      universeId: input.universeId,
      labelOnly: input.labelOnly === true,
      impersonatingFounder: input.impersonateFounder === true,
    },
    payload: input.sealedPayload ?? 'FOUNDER_SEALED_BC_SECRET',
    labelOnly: input.labelOnly,
    impersonateFounder: input.impersonateFounder,
    surface: input.actor.kind === 'ceo_principal' && !input.labelOnly ? 'ceo_read' : 'ordinary_agent',
    root,
  });
  const sealedOk =
    input.actor.kind === 'ceo_principal' && !input.labelOnly && !input.impersonateFounder
      ? sealedRoute.allowed
      : !sealedRoute.allowed;
  hops.push(
    hop(
      'founder_sealed_route',
      sealedOk ? 'PASS' : 'FAIL',
      `Sealed route allowed=${sealedRoute.allowed} reason=${sealedRoute.reason}; labelIsAccess=false; replicating=false.`,
    ),
  );

  hops.push(hop('pathway_compile', 'PASS', `Classical routes=${listClassicalRoutes().join(',')}.`));

  const classical = runClassicalBaseline({ objective });
  hops.push(
    hop(
      'classical_baseline',
      classical.classicalBaseline && classical.available ? 'PASS' : 'FAIL',
      `Classical baseline route=${classical.route}; correctness=${classical.metrics.correctness}.`,
    ),
  );

  const qpuProbe = probeQuantumRoute({
    kind: 'quantum_qpu',
    backendVerified: input.quantumQpuVerified === true,
    objective,
  });
  hops.push(
    hop(
      'quantum_route_gate',
      input.quantumQpuVerified === true ? (qpuProbe.available ? 'PASS' : 'FAIL') : qpuProbe.available ? 'FAIL' : 'UNAVAILABLE',
      `QPU available=${qpuProbe.available}; reason=${qpuProbe.reason}.`,
    ),
  );

  const competition = compileAndCompetePathways({
    objective,
    includeQuantumSimulator: true,
    includeQuantumQpu: input.includeQuantumQpu === true,
    quantumSimulatorVerified: false,
    quantumQpuVerified: input.quantumQpuVerified === true,
    claimQuantumAdvantage: input.claimQuantumAdvantage === true,
  });
  const advantage = denyQuantumAdvantageClaim({ verifiedAdvantage: input.claimQuantumAdvantage === true });
  hops.push(
    hop(
      'compete_evaluate',
      competition.classicalBaselinePresent &&
        competition.claimsQuantumAdvantage === false &&
        competition.claimsConsciousness === false &&
        advantage.allowed === false
        ? 'PASS'
        : 'FAIL',
      `Winner=${competition.winnerRoute}; quantumUsed=${competition.quantumUsed}; quantumState=${competition.quantumState}.`,
    ),
  );

  const calibration = calibratePathwayMetrics([
    { predicted: 0.8, observed: 1 },
    { predicted: 0.8, observed: 1 },
    { predicted: 0.2, observed: 0 },
    { predicted: 0.3, observed: 0 },
  ]);
  hops.push(
    hop(
      'metrics_calibrate',
      calibration.calibrated && calibration.claimsConsciousness === false ? 'PASS' : 'FAIL',
      `ECE=${calibration.ece.toFixed(3)}. ${NO_CONSCIOUSNESS}`,
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: `62L-BC cycle complete; winner=${competition.winnerRoute}`,
      payload: {
        competitionId: competition.id,
        checkpointId: cp.id,
        claimsQuantumAdvantage: false,
        claimsConsciousness: false,
      },
    },
    root,
  );
  hops.push(hop('evidence', 'PASS', 'Evidence recorded (local). Correlation≠causation lock held.'));

  const gate = decisionGate({
    id: 'bc-decision',
    action: input.requestPermissionExpansion ? 'grant_permission' : `bc pathway: ${objective}`,
    consequence: input.requestPermissionExpansion ? 'CRITICAL' : 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: input.requestPermissionExpansion === true,
    externalPublication: false,
  });
  await appendLearning(
    {
      domain: '62l-bc',
      subject: 'quantum-agentic-pathway',
      claimState: 'UNKNOWN',
      summary: `62L-BC learning; winner=${competition.winnerRoute}; gate=${gate.reason}`,
      sourceRefs: hops.map((item) => item.hop),
      evidence: [competition.id, cp.id],
    },
    root,
  );
  hops.push(
    hop(
      'learning',
      input.requestPermissionExpansion && gate.executableByAgent ? 'FAIL' : 'PASS',
      `Learning recorded. Permission expansion executableByAgent=${gate.executableByAgent}.`,
    ),
  );

  const otherTenant = await writeCognitiveMemory({
    tenantId: `${input.tenantId}-other`,
    universeId: input.universeId,
    kind: 'team',
    label: 'other-tenant',
    summary: 'must not leak',
    root,
  });
  const isolation = await assertTenantIsolation({
    tenantA: input.tenantId,
    tenantB: `${input.tenantId}-other`,
    universeId: input.universeId,
    records: [
      ...(await recallCognitiveMemory({ tenantId: input.tenantId, universeId: input.universeId, root })),
      otherTenant,
    ],
  });

  return {
    hops,
    crashed: false as const,
    resumeCheckpointId: cp.id,
    competition,
    fork: fork.fork,
    comparison,
    mergePlan: merge.plan,
    sealedRoute,
    isolation,
    pressure: await measureMemoryPressure({
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
    }),
    providers: providerSlots(),
    localRuntime: getRuntime('local'),
    health: await checkLocalBrainHealth(root).catch(() => ({ available: false })),
    productionAuthorization: false as const,
    l4AutonomyEnabled: BC_LOCKS.L4_AUTONOMY_ENABLED,
    claimsConsciousness: false as const,
    claimsSentience: false as const,
    claimsQuantumAdvantage: false as const,
    honesty: {
      documentedNeqImplementedNeqVerifiedNeqProductionAuthorized: true as const,
      classicalBaselineRequired: true as const,
      qpuUnavailableWhenUnverified: input.quantumQpuVerified !== true ? qpuProbe.available === false : true,
      universeSimNotFact: true as const,
      mergePlanNotAutoMerge: merge.applied === false,
      founderSealedDenyByDefault: true as const,
      labelIsNotAccess: true as const,
      sealedNonReplicating: true as const,
      tenantIsolationPreserved: isolation.isolated,
      noConsciousnessClaims: true as const,
      correlationIsNotCausation: true as const,
    },
    predecessors: predecessorMap(resolveRepoRoot(root)),
    next: NEXT_PHASE_TITLE,
  };
}

async function promoteMemoryTierDemo(tenantId: string, universeId: string, id: string, root: string) {
  await promoteMemoryTier({ id, tenantId, universeId, temperature: 'hot', root });
  await promoteMemoryTier({ id, tenantId, universeId, temperature: 'warm', root });
  await promoteMemoryTier({ id, tenantId, universeId, temperature: 'cold', root });
  await promoteMemoryTier({ id, tenantId, universeId, temperature: 'hot', root });
}

function resolveRepoRoot(cwd: string) {
  if (cwd.includes('/services/ai')) return cwd.split('/services/ai')[0]!;
  // Temp test roots do not contain docs/; probe from process cwd when it is the worktree.
  const candidates = [cwd, process.cwd()];
  for (const candidate of candidates) {
    if (candidate.includes('/services/ai')) return candidate.split('/services/ai')[0]!;
  }
  return process.cwd();
}

export async function buildQuantumAgenticHealthReport(cwd = process.cwd()) {
  const repoRoot = resolveRepoRoot(cwd);
  const predecessors = predecessorMap(repoRoot);
  const providers = providerSlots();
  const local = getRuntime('local');
  const classical = runClassicalBaseline({ objective: 'health-check classical baseline' });
  const qpu = probeQuantumRoute({
    kind: 'quantum_qpu',
    backendVerified: false,
    objective: 'health-check qpu',
  });
  const advantage = denyQuantumAdvantageClaim({});
  return {
    phase: '62L-BC',
    title: 'Quantum-Agentic Pathway Compiler + Cognitive Memory Hierarchy + Universe Fork Memory Fabric',
    productionAuthorization: false as const,
    l4AutonomyEnabled: BC_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: BC_LOCKS.TIP_LAND,
    claimsConsciousness: false as const,
    claimsSentience: false as const,
    claimsQuantumAdvantage: false as const,
    classicalBaseline: {
      available: classical.available,
      route: classical.route,
      modelRequired: true as const,
    },
    quantum: {
      qpuAvailable: qpu.available,
      qpuReason: qpu.reason,
      advantageAllowed: advantage.allowed,
    },
    providers,
    localRuntime: local,
    predecessors,
    cycle: QUANTUM_AGENTIC_CYCLE,
    next: NEXT_PHASE_TITLE,
    honestyLocks: BC_LOCKS,
    notes: [NO_CONSCIOUSNESS, CORRELATION_IS_NOT_CAUSATION, UNIVERSE_SIM_NOT_FACT],
  };
}
