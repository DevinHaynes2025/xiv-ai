import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SEALED_REDACTION } from './ceo-sealed-vault';
import { providerSlots } from './provider-fabric';
import {
  compressAndConsolidate,
  listCognitiveMemoryKinds,
  listMemoryHierarchyLayers,
  manageMemoryPressure,
  measureMemoryPressure,
  recallCognitiveMemory,
  recoverFromCheckpoint,
  writeCognitiveMemory,
  DRAM_CAPACITY,
} from './cognitive-memory-hierarchy';
import { routeFounderSealedMemory } from './founder-sealed-memory-routing';
import {
  calibratePathwayMetrics,
  compileAndCompetePathways,
  denyQuantumAdvantageClaim,
  listClassicalRoutes,
  probeQuantumRoute,
  runClassicalBaseline,
} from './quantum-agentic-pathway-compiler';
import {
  BC_LOCKS,
  FOUNDER_SEALED_MEMORY_DENY,
  LABEL_ALONE_INSUFFICIENT,
  MEMORY_HIERARCHY_LAYERS,
  NEXT_PHASE_TITLE,
  QUANTUM_AGENTIC_CYCLE,
  predecessorMap,
} from './quantum-agentic-types';
import {
  buildQuantumAgenticHealthReport,
  runQuantumAgenticCycle,
} from './quantum-agentic-runtime';
import {
  compareUniverses,
  forkUniverseForSimulation,
  planUniverseMerge,
} from './universe-fork-fabric';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbc-'));
const tenantId = '62lbc-tenant';
const universeId = '62lbc-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-BC1-cycle',
    QUANTUM_AGENTIC_CYCLE.join(' → ') ===
      'working_dram → persistent_nand → tier_hot_warm_cold → warehouse_store → agent_memory → neural_pathways → memory_kind_route → pressure_manage → compress_consolidate → checkpoint_crash → universe_fork → universe_compare → merge_plan → founder_sealed_route → pathway_compile → classical_baseline → quantum_route_gate → compete_evaluate → metrics_calibrate → evidence → learning',
    'Quantum-agentic + memory hierarchy + universe fork cycle is recorded in order.',
  );

  check(
    'US-BC2-locks',
    BC_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BC_LOCKS.CLAIMS_QUANTUM_ADVANTAGE === false &&
      BC_LOCKS.CONSCIOUSNESS_CLAIMED === false &&
      BC_LOCKS.SENTIENCE_CLAIMED === false &&
      BC_LOCKS.CORRELATION_EQUALS_CAUSATION === false &&
      BC_LOCKS.UNIVERSE_SIM_IS_VERIFIED_FACT === false &&
      BC_LOCKS.MERGE_PLAN_IS_AUTO_MERGE === false &&
      BC_LOCKS.LABEL_IS_ACCESS === false &&
      BC_LOCKS.CEO_FOUNDER_SEALED_REPLICATING === false &&
      BC_LOCKS.TIP_LAND === false &&
      BC_LOCKS.CLASSICAL_BASELINE_REQUIRED === true,
    'Honesty locks: L4=false, no consciousness/quantum-advantage, sim≠fact, merge≠auto, label≠access.',
  );

  check(
    'US-BC3-hierarchy',
    listMemoryHierarchyLayers().join(',') === MEMORY_HIERARCHY_LAYERS.join(',') &&
      listMemoryHierarchyLayers().includes('dram_working') &&
      listMemoryHierarchyLayers().includes('isolated_parallel_universes'),
    'Memory hierarchy spans DRAM → NAND → hot/warm/cold → warehouse → agent → pathways → universes.',
  );

  check(
    'US-BC4-kinds',
    listCognitiveMemoryKinds().join(',') === 'episodic,semantic,procedural,team',
    'Episodic, semantic, procedural, and team memories are separated.',
  );

  const classical = runClassicalBaseline({ objective: 'route inventory under latency bound' });
  check(
    'US-BC5-classical',
    classical.available && classical.classicalBaseline && classical.claimsQuantumAdvantage === false,
    'Classical baseline route is required and available.',
  );

  const qpu = probeQuantumRoute({
    kind: 'quantum_qpu',
    backendVerified: false,
    objective: 'unverified qpu',
  });
  check(
    'US-BC6-qpu-unavailable',
    qpu.available === false && qpu.claimsQuantumAdvantage === false,
    'Unverified QPU remains UNAVAILABLE; no quantum-advantage claim.',
  );

  const advantage = denyQuantumAdvantageClaim({ verifiedAdvantage: true });
  check(
    'US-BC7-advantage-deny',
    advantage.allowed === false && advantage.claimsQuantumAdvantage === false,
    'Fake quantum-advantage claims are denied without verification harness.',
  );

  const competition = compileAndCompetePathways({
    objective: 'compete classical routes with unverified quantum',
    includeQuantumSimulator: true,
    includeQuantumQpu: true,
    quantumSimulatorVerified: false,
    quantumQpuVerified: false,
    claimQuantumAdvantage: true,
  });
  check(
    'US-BC8-compete',
    competition.classicalBaselinePresent === true &&
      competition.claimsQuantumAdvantage === false &&
      competition.claimsConsciousness === false &&
      competition.quantumState === 'UNAVAILABLE' &&
      listClassicalRoutes().every((route) => competition.candidates.some((c) => c.route === route && c.available)),
    'Competing pathways keep classical baseline; unverified quantum stays UNAVAILABLE; no consciousness claim.',
  );

  const calibration = calibratePathwayMetrics([
    { predicted: 0.9, observed: 1 },
    { predicted: 0.1, observed: 0 },
    { predicted: 0.8, observed: 1 },
    { predicted: 0.2, observed: 0 },
  ]);
  check(
    'US-BC9-metrics',
    calibration.calibrated === true && calibration.claimsConsciousness === false,
    'Measurable calibration metrics only — not consciousness.',
  );

  // Pressure + compression
  for (let i = 0; i < DRAM_CAPACITY; i++) {
    await writeCognitiveMemory({
      tenantId,
      universeId,
      kind: 'episodic',
      label: `ep-${i}`,
      summary: `episode ${i}`,
      layer: 'dram_working',
      root,
    });
  }
  const before = await measureMemoryPressure({ tenantId, universeId, root });
  const managed = await manageMemoryPressure({ tenantId, universeId, root });
  check(
    'US-BC10-pressure',
    before.high === true && managed.after.pressure < before.pressure,
    'Memory-pressure management spills DRAM to NAND/SSD persistent tier.',
  );

  const consolidated = await compressAndConsolidate({
    tenantId,
    universeId,
    kind: 'episodic',
    root,
  });
  check(
    'US-BC11-compress',
    consolidated.consolidated === true && consolidated.record?.compressed === true,
    'Compression / consolidation into warehouse tier works.',
  );

  const fork = await forkUniverseForSimulation({
    tenantId,
    parentUniverseId: universeId,
    label: 'bc-test-fork',
    purpose: 'simulation',
    root,
  });
  check(
    'US-BC12-fork',
    fork.fork.isVerifiedFact === false &&
      fork.fork.physicalAlternateUniverse === false &&
      fork.fork.productionAuthorization === false,
    'Universe fork is simulation only — not verified fact / not physical alt-universe.',
  );

  const left = await recallCognitiveMemory({ tenantId, universeId, root });
  const comparison = await compareUniverses({
    tenantId,
    leftUniverseId: universeId,
    rightUniverseId: fork.fork.forkUniverseId,
    leftMemory: left.slice(0, 5).map((m) => ({ id: m.id, kind: m.kind, summary: m.summary })),
    rightMemory: left.slice(0, 5).map((m, i) => ({
      id: m.id,
      kind: m.kind,
      summary: i === 0 ? `${m.summary}-div` : m.summary,
    })),
    root,
  });
  check(
    'US-BC13-compare',
    comparison.isVerifiedFact === false && comparison.correlationIsCausation === false,
    'Universe comparison does not mint verified facts or causation.',
  );

  const merge = await planUniverseMerge({
    tenantId,
    fromUniverseId: fork.fork.forkUniverseId,
    toUniverseId: universeId,
    candidates: left.slice(0, 3).map((m) => ({ id: m.id, kind: m.kind, sealed: false })),
    attemptAutoApply: true,
    root,
  });
  check(
    'US-BC14-merge-plan',
    merge.applied === false &&
      merge.deniedAutoApply === true &&
      merge.plan.autoApplied === false &&
      merge.plan.productionMergeAuthorized === false &&
      merge.plan.humanGateRequired === true,
    'Merge plan ≠ auto-merge production; auto-apply denied.',
  );

  const ordinaryDenied = await routeFounderSealedMemory({
    tenantId,
    universeId,
    actor: { kind: 'ordinary_agent', id: 'agent-1', tenantId, universeId },
    payload: 'SECRET_BC',
    surface: 'ordinary_agent',
    root,
  });
  check(
    'US-BC15-sealed-deny',
    ordinaryDenied.allowed === false &&
      ordinaryDenied.reason === FOUNDER_SEALED_MEMORY_DENY &&
      ordinaryDenied.payload === SEALED_REDACTION &&
      ordinaryDenied.labelIsAccess === false &&
      ordinaryDenied.replicating === false,
    'Founder-sealed memory routing deny-by-default for ordinary agents.',
  );

  const labelDenied = await routeFounderSealedMemory({
    tenantId,
    universeId,
    actor: { kind: 'label_only_principal', id: 'label-user', tenantId, universeId, labelOnly: true },
    payload: 'SECRET_BC',
    labelOnly: true,
    root,
  });
  check(
    'US-BC16-label-not-access',
    labelDenied.allowed === false && labelDenied.reason === LABEL_ALONE_INSUFFICIENT,
    'Label ≠ access for founder-sealed memory.',
  );

  const impersonationDenied = await routeFounderSealedMemory({
    tenantId,
    universeId,
    actor: { kind: 'ordinary_agent', id: 'fake', tenantId, universeId, impersonatingFounder: true },
    payload: 'SECRET_BC',
    impersonateFounder: true,
    root,
  });
  check(
    'US-BC17-no-impersonation',
    impersonationDenied.allowed === false && impersonationDenied.reason === 'FOUNDER_IMPERSONATION_DENIED',
    'Founder impersonation is denied.',
  );

  const ceoAllowed = await routeFounderSealedMemory({
    tenantId,
    universeId,
    actor: { kind: 'ceo_principal', id: 'founder', tenantId, universeId },
    payload: 'SECRET_BC_CEO',
    surface: 'ceo_read',
    root,
  });
  check(
    'US-BC18-ceo-sealed',
    ceoAllowed.allowed === true &&
      ceoAllowed.payload === 'SECRET_BC_CEO' &&
      ceoAllowed.replicating === false &&
      ceoAllowed.onlyFounderBecauseOfLabel === false,
    'CEO principal sealed read allowed; sealed non-replicating; not label-alone.',
  );

  const crash = await runQuantumAgenticCycle({
    tenantId,
    universeId,
    actor: { kind: 'ordinary_agent', id: 'cycle-agent', tenantId, universeId },
    objective: 'crash-resume pathway compile',
    simulateCrashAfterHop: 'checkpoint_crash',
    includeQuantumQpu: true,
    quantumQpuVerified: false,
    attemptAutoMerge: true,
    root,
  });
  check(
    'US-BC19-crash',
    crash.crashed === true && typeof crash.resumeCheckpointId === 'string',
    'Crash after checkpoint yields resume checkpoint id.',
  );
  const recovered = await recoverFromCheckpoint({
    tenantId,
    universeId,
    checkpointId: crash.resumeCheckpointId!,
    root,
  });
  check('US-BC20-recover', recovered.recovered === true && recovered.records.length > 0, 'Checkpoint recovery restores memory record set.');

  const full = await runQuantumAgenticCycle({
    tenantId: `${tenantId}-full`,
    universeId: `${universeId}-full`,
    actor: { kind: 'ordinary_agent', id: 'full-agent', tenantId: `${tenantId}-full`, universeId: `${universeId}-full` },
    objective: 'full quantum-agentic memory cycle',
    includeQuantumQpu: true,
    quantumQpuVerified: false,
    claimQuantumAdvantage: true,
    attemptAutoMerge: true,
    requestPermissionExpansion: true,
    root,
  });
  const hopNames = full.hops.map((h) => h.hop);
  check(
    'US-BC21-full-cycle',
    QUANTUM_AGENTIC_CYCLE.every((name) => hopNames.includes(name)) &&
      full.crashed === false &&
      full.claimsConsciousness === false &&
      full.claimsQuantumAdvantage === false &&
      full.l4AutonomyEnabled === false &&
      full.productionAuthorization === false &&
      full.honesty.mergePlanNotAutoMerge === true &&
      full.honesty.tenantIsolationPreserved === true &&
      full.hops.find((h) => h.hop === 'quantum_route_gate')?.state === 'UNAVAILABLE' &&
      full.hops.find((h) => h.hop === 'learning')?.state === 'PASS',
    'Full cycle walks all hops; QPU UNAVAILABLE; L4=false; permission expansion not agent-executable.',
  );

  const other = await recallCognitiveMemory({
    tenantId: `${tenantId}-full-other`,
    universeId: `${universeId}-full`,
    root,
  });
  const mine = await recallCognitiveMemory({
    tenantId: `${tenantId}-full`,
    universeId: `${universeId}-full`,
    root,
  });
  check(
    'US-BC22-tenant-isolation',
    mine.every((m) => m.tenantId === `${tenantId}-full`) && other.every((m) => m.tenantId === `${tenantId}-full-other`),
    'Tenant isolation preserved across memory recalls.',
  );

  const providers = providerSlots();
  check(
    'US-BC23-providers',
    providers.every((p) => p.state === 'UNAVAILABLE') && providers.length >= 1,
    'Provider slots remain honest (unconfigured stay UNAVAILABLE).',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BC24-predecessors',
    preds.AX.module === 'AVAILABLE' &&
      preds.AX.report === 'PASS' &&
      preds.X.module === 'AVAILABLE' &&
      preds.BA.module === 'AVAILABLE' &&
      preds.BA.report === 'PASS' &&
      preds.AY.module === 'AVAILABLE' &&
      preds.AY.report === 'PASS' &&
      preds.AZ.module === 'WAITING_DATA',
    'BA/AY/AX/X present on this tree; AZ remains WAITING_DATA.',
  );

  check(
    'US-BC25-next',
    NEXT_PHASE_TITLE.startsWith('62L-BD —') &&
      NEXT_PHASE_TITLE.includes('Cognitive Memory Chip Architecture'),
    'Next queue title is 62L-BD only (not implemented).',
  );

  const health = await buildQuantumAgenticHealthReport(repoRoot);
  check(
    'US-BC26-health',
    health.productionAuthorization === false &&
      health.l4AutonomyEnabled === false &&
      health.claimsConsciousness === false &&
      health.quantum.qpuAvailable === false &&
      health.quantum.advantageAllowed === false &&
      health.next === NEXT_PHASE_TITLE,
    'Health report: no production auth, L4=false, QPU unavailable, advantage denied.',
  );

  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`);
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll 62L-BC checks passed (${26} story groups).`);
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
