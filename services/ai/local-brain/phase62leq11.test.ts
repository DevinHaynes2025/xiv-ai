/**
 * 62L-EQ11 — Device-Neutral Workload Genome denial + honesty tests.
 *
 * Script: npm run test:62leq11
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  DEVICE_NEUTRAL_WORKLOAD_GENOME_CYCLE,
  EQ11_AGENT_BOUNDS,
  EQ11_DB_CANDIDATES_STATUS,
  EQ11_LOCKS,
  EQ11_MAY,
  EQ11_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  VECTOR_SEARCH_EXAMPLE_PROFILE,
  WORKLOAD_GENOME_CORE_FLOW,
  WORKLOAD_GENOME_FIELDS,
  WORKLOAD_GENOME_NEURAL_PATHWAY,
  WORKLOAD_PRIMITIVES,
  XIV_WORKLOAD_INTELLIGENCE_CHAIN,
  assertEq11LocksIntact,
  assumeGpuAlwaysBest,
  canStrengthenPathway,
  eq11SoftWireSnapshot,
  vendorNameFirstScheduling,
  type Eq11Actor,
} from './device-neutral-workload-genome-types.ts';

import {
  attemptAutomaticCloudPurchasing,
  attemptFirmwareModification,
  attemptInferBeyondEvidence,
  attemptPermissionExpansion,
  attemptProprietaryIsaCloning,
  attemptRecommendAsAct,
  attemptStrengthenWithoutMeasurement,
  attemptUnsafeHardwareTuning,
  bootstrapDeviceNeutralWorkloadGenome,
  compareEligibleRoutes,
  deriveCapabilityRequirements,
  emitWorkloadGenome,
  exampleVectorSearchGenome,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEq11EvidenceToHomeBase,
  runDeviceNeutralWorkloadGenomeCycle,
  strengthenPathwayWithMeasurement,
} from './device-neutral-workload-genome-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq11Actor = {
  kind: 'workload_genome_curator',
  id: 'wgc-1',
  orgId: 'org-eq11',
  tenantId: 'ten-eq11',
  universeId: 'uni-eq11',
  permissions: ['draft'],
};

const human: Eq11Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq11',
  tenantId: 'ten-eq11',
  universeId: 'uni-eq11',
  permissions: ['approve_consequential'],
};

test('SoT label EQ11 / #161; GitLab mirror not invented; next EQ12', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ11');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Device-Neutral Workload Genome/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ12/);
  assert.match(NEXT_PHASE_TITLE, /Cross-Architecture Benchmark Matrix/);
});

test('honesty locks: L4 false; needs≠vendor; GPU not always best; DB NOT_APPLIED', () => {
  assert.equal(assertEq11LocksIntact(), true);
  assert.equal(EQ11_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ11_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ11_LOCKS.VENDOR_NAME_FIRST_SCHEDULING, false);
  assert.equal(EQ11_LOCKS.ASSUME_GPU_ALWAYS_BEST, false);
  assert.equal(EQ11_LOCKS.STRENGTHEN_WITHOUT_MEASUREMENT, false);
  assert.equal(EQ11_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EQ11_AGENT_BOUNDS.mayAssumeGpuAlwaysBest, false);
  assert.equal(vendorNameFirstScheduling(), false);
  assert.equal(assumeGpuAlwaysBest(), false);
  assert.equal(VECTOR_SEARCH_EXAMPLE_PROFILE.assumeGpuAlwaysBest, false);
});

test('primitives + genome fields + flow + pathway encoded', () => {
  assert.equal(WORKLOAD_PRIMITIVES.length, 20);
  assert.ok(WORKLOAD_PRIMITIVES.includes('matrix_multiplication'));
  assert.ok(WORKLOAD_PRIMITIVES.includes('attention'));
  assert.ok(WORKLOAD_PRIMITIVES.includes('vector_search'));
  assert.ok(WORKLOAD_PRIMITIVES.includes('vision_inference'));
  assert.ok(WORKLOAD_GENOME_FIELDS.includes('workloadId'));
  assert.ok(WORKLOAD_GENOME_FIELDS.includes('localityPrivacyRequirements'));
  assert.ok(WORKLOAD_GENOME_FIELDS.includes('evidenceState'));
  assert.deepEqual([...WORKLOAD_GENOME_CORE_FLOW], [
    'agent_task',
    'workload_genome',
    'capability_requirements',
    'eligible_runtimes_devices',
    'benchmark_comparison',
    'scheduler_decision',
  ]);
  assert.deepEqual([...XIV_WORKLOAD_INTELLIGENCE_CHAIN], [
    'task_meaning',
    'computational_structure',
    'architecture_fit',
    'measured_performance',
    'learned_routing_policy',
  ]);
  assert.deepEqual([...WORKLOAD_GENOME_NEURAL_PATHWAY], [
    'business_problem',
    'algorithm',
    'workload_primitives',
    'runtime',
    'architecture',
    'device',
    'benchmark',
    'outcome',
  ]);
  assert.ok(EQ11_MAY.includes('compare_architectures_by_workload_needs_not_vendor_name'));
  assert.ok(EQ11_MUST_NOT.includes('assume_gpu_is_always_best'));
});

test('vector-search genome: memory-heavy, latency-sensitive, local-only; no GPU assumption', () => {
  const genome = exampleVectorSearchGenome(agent);
  assert.equal(genome.operationFamily, 'vector_search');
  assert.equal(genome.memoryIntensity, 'heavy');
  assert.equal(genome.latencySensitivity, 'sensitive');
  assert.equal(genome.localityPrivacyRequirements, 'local-only');
  assert.ok(genome.modelRuntimeDependencies.includes('embedding_runtime'));
  assert.equal(genome.assumeGpuAlwaysBest, false);
  assert.equal(genome.vendorNameFirst, false);

  const req = deriveCapabilityRequirements({ genome });
  assert.ok(!('denied' in req));
  assert.ok(req.needs.includes('memory_heavy'));
  assert.ok(req.needs.includes('latency_sensitive'));
  assert.ok(req.needs.includes('local_only'));
  assert.equal(req.gpuAssumedAlwaysBest, false);

  assert.equal(
    compareEligibleRoutes({
      workloadId: genome.workloadId,
      candidates: ['cpu', 'gpu'],
      attemptForceGpuBest: true,
    }).state,
    'DENIED',
  );
  const cmp = compareEligibleRoutes({
    workloadId: genome.workloadId,
    candidates: ['cpu', 'gpu', 'npu', 'edge'],
  });
  assert.ok(!('denied' in cmp));
  assert.equal(cmp.gpuForcedBest, false);
});

test('only measured results strengthen pathway', () => {
  const genome = exampleVectorSearchGenome(agent);
  assert.equal(attemptStrengthenWithoutMeasurement().state, 'DENIED');
  assert.equal(
    canStrengthenPathway({ measuredResults: false, evidenceRefs: [] }),
    false,
  );
  assert.equal(
    strengthenPathwayWithMeasurement({
      genome,
      measuredEvidenceRefs: [],
    }).state,
    'DENIED',
  );
  const ok = strengthenPathwayWithMeasurement({
    genome,
    measuredEvidenceRefs: ['m1'],
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.genome.evidenceState, 'VERIFIED');
  assert.ok(ok.genome.pathwayStrength > genome.pathwayStrength);
});

test('safety denies infer-beyond / ISA clone / firmware / cloud buy / perms', () => {
  assert.equal(attemptInferBeyondEvidence().state, 'DENIED');
  assert.equal(attemptProprietaryIsaCloning().state, 'DENIED');
  assert.equal(attemptFirmwareModification().state, 'DENIED');
  assert.equal(attemptUnsafeHardwareTuning().state, 'DENIED');
  assert.equal(attemptAutomaticCloudPurchasing().state, 'DENIED');
  assert.equal(attemptPermissionExpansion().state, 'DENIED');
  assert.equal(
    emitWorkloadGenome({
      actor: agent,
      workloadId: 'bad',
      operationFamily: 'attention',
      inputOutputShape: 'x',
      computeIntensity: 'high',
      memoryIntensity: 'high',
      bandwidthNeeds: 'high',
      latencySensitivity: 'high',
      throughputPriority: 'high',
      precisionRequirements: 'fp16',
      parallelismProfile: 'high',
      localityPrivacyRequirements: 'any',
      modelRuntimeDependencies: [],
      acceleratorRequirements: [],
      fallbackOptions: [],
      benchmarkSuite: 'x',
      attemptVendorNameFirst: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapDeviceNeutralWorkloadGenome(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.primitives.length, WORKLOAD_PRIMITIVES.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq11SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq10InstructionSemanticsLearning.present, true);
  assert.equal(soft.eq8ArmServerCloudRuntime.present, true);
  assert.equal(soft.eq6ArchitectureCapabilityGraph.present, true);
  assert.equal(soft.eq5CompilerIrTranslationLayer.present, true);
  assert.equal(soft.eq1CrossArchitectureContract.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnEq11EvidenceToHomeBase({
    evidenceId: 'ev-eq11-1',
    actor: agent,
    summary: 'workload genome advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runDeviceNeutralWorkloadGenomeCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, DEVICE_NEUTRAL_WORKLOAD_GENOME_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of DEVICE_NEUTRAL_WORKLOAD_GENOME_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.genome.operationFamily, 'vector_search');
  assert.equal(cycle.verified.evidenceState, 'VERIFIED');
  assert.equal(cycle.comparison.gpuForcedBest, false);
});
