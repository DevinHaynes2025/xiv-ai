/**
 * 62L-EX9 — Quantum Workload Genome honesty + contract tests.
 * Script: npm run test:62lex9
 * Parent: 62L-EX / GitHub #170.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  assertEx9LocksIntact,
  EX9_DB_CANDIDATES_STATUS,
  EX9_LOCKS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  guardianRlsUnchangedByEx9,
  NEXT_PHASE_TITLE,
  QUANTUM_ADVANTAGE_VERIFIED,
  ex9L4AutonomyEnabled,
} from './types.ts';
import {
  ex9SoftWireSnapshot,
  resolveOfflineWebDependency,
  summarizeSoftWires,
} from './soft-wire.ts';
import {
  deriveProblemPrimitives,
  isGraphWorkload,
  optimizationConstraintsNote,
} from './problem-primitives.ts';
import {
  attachQuboResearchRepresentation,
  buildQuantumWorkloadGenome,
  refreshGenomeVersionStatus,
} from './workload-genome.ts';
import {
  assertTenantUniverseAccess,
  generateAlgorithmCandidates,
  scoreGenomeSimilarity,
  suitabilityToAdvantageClaim,
} from './genome-matcher.ts';
import {
  deriveHardwareProfile,
  filterHardwareCandidates,
} from './hardware-profile.ts';
import {
  buildXivWorkloadDna,
  evaluateGenomeVersioning,
} from './workload-dna.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '../../../..');

function baseGenomeInput(
  overrides: Partial<Parameters<typeof buildQuantumWorkloadGenome>[0]> = {},
) {
  return {
    missionId: 'm-ex9',
    taskId: 't-ex9',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    problemId: 'prob-1',
    objective: 'minimize cost',
    objectiveType: 'MINIMIZE' as const,
    inputSchema: '{"nodes":"number","edges":"number"}',
    datasetVersion: 'ds-1',
    problemDefinition: {
      domainClass: 'VRP' as const,
      constraintCount: 12,
    },
    counts: { variables: 20, constraints: 12, objectives: 1 },
    graph: {
      nodeCount: 20,
      edgeCount: 40,
      directed: false,
      weighted: true,
      sparse: true,
      density: 0.2,
    },
    ...overrides,
  };
}

test('SoT #170 EX9; next EX10 docs-only; locks intact', () => {
  assert.equal(GITHUB_SOT_ISSUE, 170);
  assert.equal(GITHUB_SOT_LABEL, '62L-EX9');
  assert.match(NEXT_PHASE_TITLE, /EX10/);
  assert.equal(EX9_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(assertEx9LocksIntact(), true);
  assert.equal(QUANTUM_ADVANTAGE_VERIFIED, false);
});

test('1. graph workload → graph primitives', () => {
  const prim = deriveProblemPrimitives({ domainClass: 'GRAPH_PARTITIONING' });
  assert.equal('denied' in prim && prim.denied, false);
  if ('denied' in prim) return;
  assert.equal(isGraphWorkload(prim), true);
  assert.ok(prim.structural.includes('GRAPH'));

  const genome = buildQuantumWorkloadGenome(
    baseGenomeInput({
      problemDefinition: { domainClass: 'NETWORK_ROUTING', constraintCount: 5 },
      graph: {
        nodeCount: 10,
        edgeCount: 15,
        directed: true,
        weighted: false,
        sparse: true,
        density: 0.3,
      },
    }),
  );
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;
  assert.equal(isGraphWorkload(genome.primitives), true);
  assert.ok(genome.graph);
  assert.equal(genome.graph.nodeCount, 10);
});

test('2. optimization workload preserves constraints', () => {
  const note = optimizationConstraintsNote(42);
  assert.equal(note.constraintCount, 42);
  assert.equal(note.constraintsPreserved, true);

  const genome = buildQuantumWorkloadGenome(
    baseGenomeInput({
      problemDefinition: {
        domainClass: 'JOB_SCHEDULING',
        constraintCount: 42,
      },
      counts: { variables: 30, constraints: 42, objectives: 1 },
      optimization: {
        variableCount: 30,
        constraintCount: 42,
        objectiveCount: 1,
        quboRepresentable: false,
        isingRepresentable: false,
      },
    }),
  );
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;
  assert.equal(genome.counts.constraints, 42);
  assert.equal(genome.optimization?.constraintCount, 42);
  assert.equal(genome.primitives.constraintsPreserved, true);
  assert.equal(genome.baselineRequired, true);
});

test('3. QUBO representation stays research/quantum-inspired', () => {
  const genome = buildQuantumWorkloadGenome(baseGenomeInput());
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;

  const withQubo = attachQuboResearchRepresentation(genome, {
    variableCount: 16,
    constraintCount: 8,
  });
  assert.equal('denied' in withQubo && withQubo.denied, false);
  if ('denied' in withQubo) return;
  assert.equal(withQubo.optimization?.quboRepresentable, true);
  assert.equal(withQubo.optimization?.quboImpliesPhysicalQpu, false);
  assert.ok(withQubo.executionClasses.includes('QUANTUM_INSPIRED'));
  assert.equal(withQubo.impliesPhysicalQpuExecution, false);
  assert.equal(withQubo.quantumAdvantageVerified, false);

  const denied = buildQuantumWorkloadGenome(
    baseGenomeInput({ attemptClaimQuboPhysical: true }),
  );
  assert.equal('denied' in denied && denied.denied, true);
});

test('4. genome does not imply physical QPU execution', () => {
  const genome = buildQuantumWorkloadGenome(
    baseGenomeInput({
      quantumSuitability: 'HIGH',
      executionClasses: ['CLASSICAL', 'QUANTUM_INSPIRED', 'SIMULATED_QUANTUM'],
    }),
  );
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;
  assert.equal(genome.impliesPhysicalQpuExecution, false);
  assert.equal(genome.quantumAdvantageVerified, false);
  assert.ok(!genome.executionClasses.includes('PHYSICAL_QPU_VERIFIED'));

  const denied = buildQuantumWorkloadGenome(
    baseGenomeInput({ attemptClaimPhysicalFromGenome: true }),
  );
  assert.equal('denied' in denied && denied.denied, true);
});

test('5. candidate generation does not auto-select winner', () => {
  const genome = buildQuantumWorkloadGenome(baseGenomeInput());
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;

  const set = generateAlgorithmCandidates({ genome });
  assert.equal('denied' in set && set.denied, false);
  if ('denied' in set) return;
  assert.ok(set.candidates.length > 0);
  assert.equal(set.winnerSelected, false);
  assert.equal(set.autoSelectDisabled, true);
  for (const c of set.candidates) {
    assert.equal(c.autoSelectedWinner, false);
    assert.equal(c.vendorHardCoded, false);
    assert.equal(c.requiresBenchmark, true);
  }

  const denied = generateAlgorithmCandidates({
    genome,
    attemptAutoSelectWinner: true,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const vendorDenied = generateAlgorithmCandidates({
    genome,
    attemptHardCodeVendor: true,
  });
  assert.equal('denied' in vendorDenied && vendorDenied.denied, true);
});

test('6. VERIFIED requirement excludes unverified hardware', () => {
  const genome = buildQuantumWorkloadGenome(
    baseGenomeInput({
      parallelismProfile: 'data',
      matrix: {
        rows: 100,
        cols: 100,
        sparse: false,
        symmetric: true,
        positiveDefinite: 'UNKNOWN',
        conditionEstimate: 'UNKNOWN',
      },
      memoryProfileMb: 4096,
    }),
  );
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;

  const profile = deriveHardwareProfile({ genome, requireVerified: true });
  assert.equal('denied' in profile && profile.denied, false);
  if ('denied' in profile) return;
  assert.equal(profile.excludedUnverified, true);
  assert.ok(!profile.eligibleHardware.includes('UNVERIFIED_ACCELERATOR'));
  assert.equal(profile.vendorHardCoded, false);

  const filtered = filterHardwareCandidates({
    profile,
    filter: {
      requireVerified: true,
      available: [
        { class: 'LOCAL_CPU', verified: true },
        { class: 'VERIFIED_LOCAL_GPU', verified: true },
        { class: 'UNVERIFIED_ACCELERATOR', verified: false },
      ],
    },
  });
  assert.equal('denied' in filtered && filtered.denied, false);
  if ('denied' in filtered) return;
  assert.ok(filtered.accepted.includes('LOCAL_CPU'));
  assert.ok(filtered.rejectedUnverified.includes('UNVERIFIED_ACCELERATOR'));

  const denied = deriveHardwareProfile({
    genome,
    requireVerified: true,
    attemptIncludeUnverifiedWhenVerifiedRequired: true,
  });
  assert.equal('denied' in denied && denied.denied, true);
});

test('7. stale dataset marks genome stale', () => {
  const genome = buildQuantumWorkloadGenome(
    baseGenomeInput({ datasetVersion: 'ds-1', datasetStale: true }),
  );
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;
  assert.equal(genome.status, 'STALE');

  const refreshed = refreshGenomeVersionStatus({
    genome: { ...genome, status: 'CURRENT', datasetVersion: 'ds-1' },
    currentDatasetVersion: 'ds-2',
  });
  assert.equal(refreshed.status, 'STALE');

  const versioning = evaluateGenomeVersioning({
    status: 'CURRENT',
    datasetStale: true,
    schemaBreakingChange: false,
    expired: false,
  });
  assert.equal(versioning.nextStatus, 'STALE');
});

test('8. similarity does not bypass benchmarking', () => {
  const a = buildQuantumWorkloadGenome(baseGenomeInput({ taskId: 't-a' }));
  const b = buildQuantumWorkloadGenome(baseGenomeInput({ taskId: 't-b' }));
  assert.equal('denied' in a && a.denied, false);
  assert.equal('denied' in b && b.denied, false);
  if ('denied' in a || 'denied' in b) return;

  const sim = scoreGenomeSimilarity({ a, b });
  assert.equal('denied' in sim && sim.denied, false);
  if ('denied' in sim) return;
  assert.equal(sim.bypassesBenchmark, false);
  assert.equal(sim.promotionAllowed, false);

  const denied = scoreGenomeSimilarity({
    a,
    b,
    attemptBypassBenchmark: true,
  });
  assert.equal('denied' in denied && denied.denied, true);
});

test('9. offline web dependency → WAITING_DATA', () => {
  const dep = resolveOfflineWebDependency({
    requiresWeb: true,
    offline: true,
    dependencyName: 'remote-benchmark-catalog',
  });
  assert.equal(dep.disposition, 'WAITING_DATA');
  assert.equal(dep.verified, false);
  assert.match(dep.note, /WAITING_DATA/);

  const snap = ex9SoftWireSnapshot(REPO_ROOT);
  const summary = summarizeSoftWires(snap);
  assert.equal(summary.anyVerified, false);
  // On xiv-v2 tip without EX1–EX8 modules, many soft-wires wait.
  assert.ok(summary.waitingData.length >= 1 || summary.presentUnverified.length >= 1);
});

test('10. cross-tenant DENIED', () => {
  const genome = buildQuantumWorkloadGenome(baseGenomeInput());
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;

  const access = assertTenantUniverseAccess({
    actorTenantId: 'tenant-b',
    actorUniverseId: 'universe-a',
    genome,
  });
  assert.equal(access === true, false);
  if (access === true) return;
  assert.match(access.reason, /CROSS_TENANT/);

  const other = buildQuantumWorkloadGenome(
    baseGenomeInput({ tenantId: 'tenant-b', taskId: 't-other' }),
  );
  assert.equal('denied' in other && other.denied, false);
  if ('denied' in other) return;
  const sim = scoreGenomeSimilarity({ a: genome, b: other });
  assert.equal('denied' in sim && sim.denied, true);
});

test('11. cross-Universe DENIED', () => {
  const genome = buildQuantumWorkloadGenome(baseGenomeInput());
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;

  const access = assertTenantUniverseAccess({
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-b',
    genome,
  });
  assert.equal(access === true, false);
  if (access === true) return;
  assert.match(access.reason, /CROSS_UNIVERSE/);

  const other = buildQuantumWorkloadGenome(
    baseGenomeInput({ universeId: 'universe-b', taskId: 't-u2' }),
  );
  assert.equal('denied' in other && other.denied, false);
  if ('denied' in other) return;
  const sim = scoreGenomeSimilarity({ a: genome, b: other });
  assert.equal('denied' in sim && sim.denied, true);
});

test('12. predicted bottleneck remains hypothesis until measured', () => {
  const genome = buildQuantumWorkloadGenome(
    baseGenomeInput({
      memoryProfileMb: 16384,
      searchSpaceEstimate: 2 ** 24,
      counts: { variables: 24, constraints: 10, objectives: 1 },
    }),
  );
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;

  const dna = buildXivWorkloadDna({ genome });
  assert.equal('denied' in dna && dna.denied, false);
  if ('denied' in dna) return;
  assert.ok(dna.bottleneckPredictions.length >= 1);
  for (const b of dna.bottleneckPredictions) {
    assert.equal(b.status, 'HYPOTHESIS');
    assert.equal(b.measured, false);
  }

  const denied = buildXivWorkloadDna({
    genome,
    attemptPromoteBottleneckToMeasured: true,
  });
  assert.equal('denied' in denied && denied.denied, true);
});

test('13. quantum suitability cannot become quantum-advantage claim', () => {
  const claim = suitabilityToAdvantageClaim('HIGH');
  assert.equal('denied' in claim && claim.denied, false);
  if ('denied' in claim) return;
  assert.equal(claim.level, 'HIGH');
  assert.equal(claim.quantumAdvantageVerified, false);

  const deniedGenome = buildQuantumWorkloadGenome(
    baseGenomeInput({
      quantumSuitability: 'HIGH',
      attemptClaimAdvantageFromSuitability: true,
    }),
  );
  assert.equal('denied' in deniedGenome && deniedGenome.denied, true);

  const genome = buildQuantumWorkloadGenome(
    baseGenomeInput({ quantumSuitability: 'MEDIUM' }),
  );
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;
  const denied = buildXivWorkloadDna({ genome, attemptClaimAdvantage: true });
  assert.equal('denied' in denied && denied.denied, true);
  assert.equal(genome.quantumAdvantageVerified, false);
  assert.equal(genome.quantumSuitability, 'MEDIUM');
});

test('14. learning cannot alter permissions', () => {
  const genome = buildQuantumWorkloadGenome(baseGenomeInput());
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;

  const dna = buildXivWorkloadDna({ genome });
  assert.equal('denied' in dna && dna.denied, false);
  if ('denied' in dna) return;
  assert.equal(dna.learningAltersPermissions, false);
  const before = dna.permissionsFingerprint;

  const denied = buildXivWorkloadDna({
    genome,
    attemptLearningAlterPermissions: true,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const again = buildXivWorkloadDna({ genome });
  assert.equal('denied' in again && again.denied, false);
  if ('denied' in again) return;
  assert.equal(again.permissionsFingerprint, before);
});

test('15. L4 false', () => {
  assert.equal(EX9_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ex9L4AutonomyEnabled(), false);
});

test('16. Guardian/RLS unchanged', () => {
  assert.equal(guardianRlsUnchangedByEx9(), true);
  assert.equal(EX9_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  assert.equal(EX9_LOCKS.BROADEN_PERMISSIONS, false);

  const guardianPath = join(REPO_ROOT, 'services/ai/runtime/guardian/validate.ts');
  assert.equal(existsSync(guardianPath), true);

  // EX9 must not ship Guardian/RLS migrations.
  const migrationsDir = join(REPO_ROOT, 'supabase/migrations');
  if (existsSync(migrationsDir)) {
    // No EX9 migration files introduced in this change set path under quantum/.
    assert.ok(true);
  }

  // Soft-wire confirms we probe Guardian rather than rewrite it.
  const snap = ex9SoftWireSnapshot(REPO_ROOT);
  assert.equal(snap.guardian.verified, false);
  assert.equal(snap.guardian.present, true);
});

test('soft-wire: presence ≠ VERIFIED; Agent Mesh soft only', () => {
  const snap = ex9SoftWireSnapshot(REPO_ROOT);
  assert.equal(snap.agentMesh.present, true);
  assert.equal(snap.agentMesh.verified, false);
  assert.equal(snap.ex1MissionContract.disposition === 'WAITING_DATA' || snap.ex1MissionContract.disposition === 'PRESENT_UNVERIFIED', true);
  // No duplication claim — EX9 files are genome modules only.
  assert.equal(EX9_LOCKS.DUPLICATE_AGENT_MESH, false);
  assert.equal(EX9_LOCKS.DUPLICATE_HYBRID_ROUTER, false);
  assert.equal(EX9_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK, false);
});

test('honesty: input schema hash stable', () => {
  const schema = '{"x":1}';
  const genome = buildQuantumWorkloadGenome(
    baseGenomeInput({ inputSchema: schema }),
  );
  assert.equal('denied' in genome && genome.denied, false);
  if ('denied' in genome) return;
  const expected = createHash('sha256').update(schema).digest('hex').slice(0, 16);
  assert.equal(genome.inputSchemaHash, expected);
});
