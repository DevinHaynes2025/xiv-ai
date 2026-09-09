/**
 * 62L-ES-HC1 — Hybrid Compute Home Base denial + honesty tests.
 *
 * Script: npm run test:62leshc1
 * Track: Hybrid Compute Superbrain (#164) — distinct from productization ES1.
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  COMPUTE_DOMAIN_CLASSES,
  GITHUB_SOT_ACCESS_NOTE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITHUB_SOT_TRACK,
  GITLAB_MIRROR_NOTE,
  HC1_AGENT_BOUNDS,
  HC1_DB_CANDIDATES_STATUS,
  HC1_LOCKS,
  HC1_MAY,
  HC1_MUST_NOT,
  HC_LAYER_TITLE,
  HOME_BASE_CAPABILITY_STATES,
  HONESTY_BANNER,
  HYBRID_COMPUTE_HOME_BASE_CYCLE,
  HYBRID_COMPUTE_TRUTH_BOUNDARY,
  NEXT_PHASE_TITLE,
  OPTIMIZATION_CANDIDATE_LAYERS,
  PRODUCTIZATION_ES_COLLISION_NOTE,
  QUANTUM_CLAIM_STATES,
  RESEARCH_SIM_CATEGORIES,
  ROUTING_PATH_CLASSES,
  SPECULATIVE_FORBIDDEN_PRODUCTION,
  assertHc1LocksIntact,
  hc1SoftWireSnapshot,
  softWireHopState,
  type Hc1Actor,
} from './hybrid-compute-home-base-types.ts';

import {
  appendResourceToInventory,
  assertProductizationEs1NotOverwritten,
  attemptAutoCloudSpend,
  attemptEnableL4,
  attemptManagePullRequest,
  attemptMarkUnverifiedVerified,
  attemptPermissionExpansion,
  attemptPhysicalQpuWithoutEvidence,
  attemptQuantumWithoutClassicalBaseline,
  attemptSpeculativeAsProduction,
  attemptTipLand,
  attemptWaitingNodeHonesty,
  bootstrapHybridComputeHomeBase,
  buildRoutingEnvelope,
  createHomeBaseInventory,
  evaluateRouteEligibility,
  exampleHomeBaseInventory,
  listEncodedCatalog,
  probeGuardianRlsTenantUniverseIsolation,
  registerComputeResource,
  requireHumanApproval,
  runHybridComputeHomeBaseCycle,
} from './hybrid-compute-home-base-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Hc1Actor = {
  kind: 'hybrid_compute_home_base',
  id: 'hc1-1',
  orgId: 'org-hc1',
  tenantId: 'ten-hc1',
  universeId: 'uni-hc1',
  permissions: ['draft'],
};

const human: Hc1Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-hc1',
  tenantId: 'ten-hc1',
  universeId: 'uni-hc1',
  permissions: ['approve_consequential'],
};

test('SoT HC1 Hybrid Compute Home Base #164; distinct from productization ES1; next HC2', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES-HC1');
  assert.equal(GITHUB_SOT_ISSUE, 164);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES-HC');
  assert.match(GITHUB_SOT_TRACK, /Hybrid Compute Superbrain/);
  assert.match(GITHUB_SOT_TITLE, /Hybrid Compute Home Base/);
  assert.match(PRODUCTIZATION_ES_COLLISION_NOTE, /Distinct from productization/);
  assert.match(PRODUCTIZATION_ES_COLLISION_NOTE, /test:62les1/);
  assert.match(GITHUB_SOT_ACCESS_NOTE, /164/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES-HC2/);
  assert.match(HC_LAYER_TITLE, /Hybrid Compute/);
  const collision = assertProductizationEs1NotOverwritten(repoRoot);
  assert.equal(collision.overwritten, false);
  assert.equal(collision.hc1NamesUsed, true);
});

test('honesty locks: L4 false; no auto cloud spend; speculative≠production; DB NOT_APPLIED', () => {
  assert.equal(assertHc1LocksIntact(), true);
  assert.equal(HC1_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(HC1_LOCKS.AUTO_CLOUD_SPEND, false);
  assert.equal(HC1_LOCKS.PERMISSION_EXPANSION, false);
  assert.equal(HC1_LOCKS.UNVERIFIED_GPU_AS_VERIFIED, false);
  assert.equal(HC1_LOCKS.UNVERIFIED_NPU_AS_VERIFIED, false);
  assert.equal(HC1_LOCKS.UNVERIFIED_QPU_AS_VERIFIED, false);
  assert.equal(HC1_LOCKS.PHYSICAL_QPU_WITHOUT_EVIDENCE, false);
  assert.equal(HC1_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE, false);
  assert.equal(HC1_LOCKS.SPECULATIVE_AS_PRODUCTION, false);
  assert.equal(HC1_LOCKS.DARK_ENERGY_HARVESTING_PRODUCTION, false);
  assert.equal(HC1_LOCKS.FTL_NETWORKING_PRODUCTION, false);
  assert.equal(HC1_LOCKS.TIP_LAND, false);
  assert.equal(HC1_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(HC1_LOCKS.OVERWRITE_PRODUCTIZATION_ES1, false);
  assert.equal(HC1_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(HYBRID_COMPUTE_TRUTH_BOUNDARY.l4AutonomyEnabled, false);
  assert.equal(
    HYBRID_COMPUTE_TRUTH_BOUNDARY.unverifiedHardwareCannotBeVerified,
    true,
  );
  assert.equal(HC1_AGENT_BOUNDS.mayEnableL4, false);
  assert.equal(HC1_AGENT_BOUNDS.mayAutoCloudSpend, false);
  assert.equal(attemptEnableL4().denied, true);
  assert.equal(attemptPermissionExpansion().denied, true);
  assert.equal(attemptTipLand().denied, true);
  assert.equal(attemptManagePullRequest().denied, true);
});

test('inventory domains + capability states + routing paths + vendors + research catalogs encoded', () => {
  const catalog = listEncodedCatalog();
  assert.deepEqual([...catalog.domains], [...COMPUTE_DOMAIN_CLASSES]);
  assert.ok(catalog.domains.includes('local_cpu'));
  assert.ok(catalog.domains.includes('local_gpu'));
  assert.ok(catalog.domains.includes('local_npu'));
  assert.ok(catalog.domains.includes('authorized_cloud'));
  assert.ok(catalog.domains.includes('edge_node'));
  assert.ok(catalog.domains.includes('qpu_candidate'));
  assert.deepEqual([...catalog.states], [
    'DETECTED',
    'SUPPORTED',
    'NOT_TESTED',
    'VERIFIED',
    'WAITING_NODE',
    'UNAVAILABLE',
    'DEGRADED',
  ]);
  assert.equal(HOME_BASE_CAPABILITY_STATES.length, 7);
  assert.deepEqual([...catalog.paths], [
    'local',
    'edge',
    'authorized_cloud',
    'qpu_candidate',
  ]);
  assert.ok(OPTIMIZATION_CANDIDATE_LAYERS.includes('AMD'));
  assert.ok(OPTIMIZATION_CANDIDATE_LAYERS.includes('NVIDIA'));
  assert.ok(OPTIMIZATION_CANDIDATE_LAYERS.includes('RISC-V'));
  assert.ok(RESEARCH_SIM_CATEGORIES.includes('photonic_optical'));
  assert.ok(RESEARCH_SIM_CATEGORIES.includes('virtual_space_fabric'));
  assert.ok(
    SPECULATIVE_FORBIDDEN_PRODUCTION.includes('dark_energy_harvesting'),
  );
  assert.ok(
    SPECULATIVE_FORBIDDEN_PRODUCTION.includes('inter_dimensional_communication'),
  );
  assert.ok(SPECULATIVE_FORBIDDEN_PRODUCTION.includes('ftl_networking'));
  assert.ok(QUANTUM_CLAIM_STATES.includes('PHYSICAL_QPU_VERIFIED'));
  assert.ok(HYBRID_COMPUTE_HOME_BASE_CYCLE.includes('soft_wire_es33_identity'));
  assert.ok(HC1_MUST_NOT.includes('overwrite_productization_es1'));
  assert.ok(HC1_MAY.includes('build_routing_envelopes_across_local_edge_cloud_qpu_candidate'));
  assert.equal(ROUTING_PATH_CLASSES.length, 4);
});

test('unverified GPU/NPU/QPU cannot be marked VERIFIED; PHYSICAL_QPU needs evidence', () => {
  const inv = createHomeBaseInventory({ actor: agent });
  assert.ok(!('denied' in inv));
  const gpu = attemptMarkUnverifiedVerified({
    actor: agent,
    inventory: inv,
    domain: 'local_gpu',
  });
  assert.equal(gpu.denied, true);
  assert.match(gpu.reason, /VERIFIED/i);
  const npu = attemptMarkUnverifiedVerified({
    actor: agent,
    inventory: inv,
    domain: 'local_npu',
  });
  assert.equal(npu.denied, true);
  const qpu = attemptMarkUnverifiedVerified({
    actor: agent,
    inventory: inv,
    domain: 'qpu_candidate',
  });
  assert.equal(qpu.denied, true);
  const physical = attemptPhysicalQpuWithoutEvidence({
    actor: agent,
    inventory: inv,
  });
  assert.equal(physical.denied, true);
  assert.match(physical.reason, /PHYSICAL_QPU|evidence/i);

  const verifiedGpu = registerComputeResource({
    actor: agent,
    inventory: inv,
    domain: 'local_gpu',
    label: 'verified-gpu',
    capabilityState: 'VERIFIED',
    evidenceRefs: ['bounded-inference-pass'],
    vendorLayer: 'NVIDIA',
  });
  assert.ok(!('denied' in verifiedGpu));
  assert.equal(verifiedGpu.capabilityState, 'VERIFIED');
});

test('speculative physics not production; classical baseline required for quantum', () => {
  const inv = createHomeBaseInventory({ actor: agent });
  assert.ok(!('denied' in inv));
  for (const category of SPECULATIVE_FORBIDDEN_PRODUCTION) {
    const denied = attemptSpeculativeAsProduction({
      actor: agent,
      inventory: inv,
      category,
    });
    assert.equal(denied.denied, true, category);
    assert.match(denied.reason, /SPECULATIVE|RESEARCH_ONLY|production/i);
  }
  const research = registerComputeResource({
    actor: agent,
    inventory: inv,
    domain: 'local_cpu',
    label: 'photonic-research',
    capabilityState: 'NOT_TESTED',
    researchCategory: 'photonic_optical',
    researchLabel: 'RESEARCH_ONLY',
    treatAsProduction: true,
  });
  assert.ok('denied' in research);

  const noBaseline = attemptQuantumWithoutClassicalBaseline({
    actor: agent,
    inventory: inv,
  });
  assert.equal(noBaseline.denied, true);
  assert.match(noBaseline.reason, /classical/i);

  const withBaseline = registerComputeResource({
    actor: agent,
    inventory: inv,
    domain: 'qpu_candidate',
    label: 'qi-ok',
    capabilityState: 'NOT_TESTED',
    quantumClaim: 'QUANTUM_INSPIRED',
    classicalBaselinePresent: true,
    evidenceRefs: ['classical-baseline-lab'],
  });
  assert.ok(!('denied' in withBaseline));
});

test('WAITING_NODE honesty; routing envelopes; no auto cloud spend; Guardian/RLS; L4 false', () => {
  const inv = createHomeBaseInventory({ actor: agent });
  assert.ok(!('denied' in inv));
  const waiting = attemptWaitingNodeHonesty({ actor: agent, inventory: inv });
  assert.equal(waiting.denied, true);
  assert.equal(waiting.state, 'WAITING_NODE');

  const spend = attemptAutoCloudSpend({ actor: agent, inventory: inv });
  assert.equal(spend.denied, true);
  assert.match(spend.reason, /cloud spend/i);

  const example = exampleHomeBaseInventory(agent);
  assert.equal(example.l4AutonomyEnabled, false);
  assert.equal(example.autoCloudSpend, false);
  assert.equal(example.guardianRlsIntact, true);
  assert.ok(example.resources.length >= 4);

  const envDeny = buildRoutingEnvelope({
    actor: agent,
    inventory: example,
    taskId: 'task-1',
    preferredPaths: ['local'],
    allowUnverifiedHardware: true,
  });
  assert.ok('denied' in envDeny);

  const cpu = example.resources.find((r) => r.domain === 'local_cpu');
  assert.ok(cpu);
  const env = buildRoutingEnvelope({
    actor: agent,
    inventory: example,
    taskId: 'task-2',
    preferredPaths: ['local'],
    requiredCapabilityStates: ['SUPPORTED', 'VERIFIED', 'DETECTED'],
    targetResourceIds: [cpu.resourceId],
  });
  assert.ok(!('denied' in env));
  assert.equal(env.allowAutoCloudSpend, false);
  assert.equal(env.requireClassicalBaselineForQuantum, true);

  const eligible = evaluateRouteEligibility({
    inventory: example,
    envelope: env,
    resource: cpu,
  });
  assert.ok(!('denied' in eligible));
  assert.equal(eligible.eligible, true);

  const edgeWaiting = example.resources.find(
    (r) => r.capabilityState === 'WAITING_NODE',
  );
  assert.ok(edgeWaiting);
  const badRoute = evaluateRouteEligibility({
    inventory: example,
    envelope: {
      ...env,
      preferredPaths: ['edge'],
      requiredCapabilityStates: ['WAITING_NODE', 'SUPPORTED'],
    },
    resource: edgeWaiting,
  });
  assert.ok('denied' in badRoute);
  assert.equal(badRoute.state, 'WAITING_NODE');

  const probe = probeGuardianRlsTenantUniverseIsolation();
  assert.equal(probe.intact, true);
  assert.equal(probe.guardian, true);
  assert.equal(probe.rls, true);

  const approval = requireHumanApproval({
    actor: human,
    action: 'authorize_cloud_route',
  });
  assert.equal(approval.approved, true);
  const agentApproval = requireHumanApproval({
    actor: agent,
    action: 'authorize_cloud_route',
  });
  assert.equal(agentApproval.approved, false);
});

test('soft-wires ER29–ER34 / ER7 / ES33: presence≠VERIFIED; absent→WAITING_DATA not FAIL', () => {
  const snap = hc1SoftWireSnapshot(repoRoot);
  assert.equal(softWireHopState(snap.er34CapabilityManifest), 'PRESENT');
  assert.equal(softWireHopState(snap.er30AndroidArmRuntimePackage), 'PRESENT');
  assert.equal(softWireHopState(snap.es33UnifiedIdentity), 'PRESENT');
  // ER29/ER31–ER33 / ER7 often absent on this tip — must be WAITING_DATA, not FAIL.
  const er29State = softWireHopState(snap.er29WindowsRuntimePackage);
  assert.ok(er29State === 'PRESENT' || er29State === 'WAITING_DATA');
  assert.notEqual(er29State, 'FAIL');
  const er7State = softWireHopState(snap.er7HistoricalScienceEngineeringAtlas);
  assert.ok(er7State === 'PRESENT' || er7State === 'WAITING_DATA');
  assert.notEqual(er7State, 'FAIL');
  assert.equal(HC1_LOCKS.ABSENT_NODE_AS_FAIL, false);
  assert.equal(HC1_LOCKS.PRESENCE_EQ_VERIFIED, false);
  assert.equal(
    HYBRID_COMPUTE_TRUTH_BOUNDARY.absentMeansWaitingDataNotFail,
    true,
  );
  assert.equal(HYBRID_COMPUTE_TRUTH_BOUNDARY.presenceNeqVerified, true);

  const cycle = runHybridComputeHomeBaseCycle({ actor: agent, repoRoot });
  assert.equal(cycle.locksIntact, true);
  assert.ok(cycle.hops.length >= 10);
  const softHop = cycle.hops.find((h) => h.hop === 'soft_wire_er7_atlas');
  assert.ok(softHop);
  assert.ok(
    softHop.state === 'PRESENT' || softHop.state === 'WAITING_DATA',
  );
  assert.notEqual(softHop.state, 'FAIL');

  const boot = bootstrapHybridComputeHomeBase({ actor: agent, repoRoot });
  assert.equal(boot.inventory.l4AutonomyEnabled, false);
  assert.match(boot.inventory.collisionNote, /productization/i);

  // Append path stays honest for DETECTED GPU without claiming VERIFIED.
  let inv = createHomeBaseInventory({ actor: agent });
  assert.ok(!('denied' in inv));
  const detected = registerComputeResource({
    actor: agent,
    inventory: inv,
    domain: 'local_gpu',
    label: 'detected-only',
    capabilityState: 'DETECTED',
    vendorLayer: 'Intel',
  });
  assert.ok(!('denied' in detected));
  inv = appendResourceToInventory(inv, detected);
  assert.equal(inv.resources[0]?.capabilityState, 'DETECTED');
});
