/**
 * 62L-EP2 — Cross-Vendor Capability Graph denial + honesty tests.
 *
 * Script: npm run test:62lep2
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  CAPABILITY_EVIDENCE_STATES,
  CAPABILITY_GRAPH_AGENT_BOUNDS,
  CAPABILITY_GRAPH_AGENT_QUESTIONS,
  CAPABILITY_GRAPH_CORE_PATH,
  CAPABILITY_GRAPH_CYCLE,
  CAPABILITY_GRAPH_VENDORS,
  CAPABILITY_NODE_FIELDS,
  EP2_DB_CANDIDATES_STATUS,
  EP2_LOCKS,
  EP2_MAY,
  EP2_MUST_NOT,
  FORBIDDEN_IP_INGEST_CLASSES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_SEMICONDUCTOR_LEARNING_PATH,
  HONESTY_BANNER,
  LAWFUL_LEARNING_SOURCES,
  NEXT_PHASE_TITLE,
  assertEp2LocksIntact,
  defaultEvidenceState,
  ep2SoftWireSnapshot,
  type Ep2Actor,
} from './cross-vendor-capability-graph-types.ts';

import {
  answerCapabilityQuestion,
  attemptAgentAutoAuthority,
  attemptForbiddenIpIngest,
  attemptStoreHiddenChainOfThought,
  bootstrapCrossVendorCapabilityGraph,
  encodeDocumentedDetectedVerifiedExamples,
  ingestLawfulLearningSource,
  labelEvidenceState,
  linkHistoricalSemiconductorLearning,
  markNeuralEdgeStaleOrRegressed,
  probeGuardianRlsTenantUniverseIsolation,
  registerCapabilityNode,
  requireHumanApproval,
  returnAgentEvidenceToHomeBase,
  runCrossVendorCapabilityGraphCycle,
  strengthenNeuralEdgeOnVerifiedBenchmark,
} from './cross-vendor-capability-graph-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const architect: Ep2Actor = {
  kind: 'capability_graph_architect',
  id: 'cg-arch-1',
  orgId: 'org-ep2',
  tenantId: 'ten-ep2',
  universeId: 'uni-ep2',
  permissions: ['draft'],
};

const human: Ep2Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep2',
  tenantId: 'ten-ep2',
  universeId: 'uni-ep2',
  permissions: ['approve_consequential', 'authorize_capability_publish'],
};

test('SoT label EP2 / #160; GitLab mirror not invented; next EP3', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP2');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Cross-Vendor Capability Graph/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP3/);
  assert.match(NEXT_PHASE_TITLE, /Chip Research Agent Team/);
});

test('honesty locks: L4 false + DOCUMENTED≠VERIFIED; DB NOT_APPLIED', () => {
  assert.equal(assertEp2LocksIntact(), true);
  assert.equal(EP2_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP2_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP2_LOCKS.DOCUMENTED_EQ_VERIFIED, false);
  assert.equal(EP2_LOCKS.PUBLIC_DOCS_EQ_XIV_RUNTIME_VERIFICATION, false);
  assert.equal(EP2_LOCKS.STORE_HIDDEN_CHAIN_OF_THOUGHT, false);
  assert.equal(EP2_LOCKS.TIP_LAND, false);
  assert.equal(EP2_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('vendors + core path + node fields + evidence states + questions encoded', () => {
  assert.deepEqual(
    [...CAPABILITY_GRAPH_VENDORS],
    [
      'amd',
      'nvidia',
      'intel',
      'apple',
      'qualcomm',
      'other_documented_accelerator',
    ],
  );

  assert.deepEqual(
    [...CAPABILITY_GRAPH_CORE_PATH],
    [
      'vendor',
      'chip_family',
      'device',
      'runtime',
      'model_support',
      'precision',
      'benchmark',
      'workload',
      'result',
      'lesson',
    ],
  );

  assert.equal(CAPABILITY_NODE_FIELDS.length, 20);
  for (const field of [
    'vendor',
    'productFamily',
    'deviceModel',
    'deviceType',
    'architecture',
    'generation',
    'memory',
    'supportedPrecisions',
    'documentedRuntimes',
    'executionProviders',
    'operatingSystems',
    'modelCompatibility',
    'workloadStrengths',
    'knownLimitations',
    'powerEnergyProxy',
    'benchmarkEvidence',
    'source',
    'sourceDate',
    'verificationState',
    'lastTestedAt',
  ] as const) {
    assert.ok(CAPABILITY_NODE_FIELDS.includes(field), field);
  }

  assert.deepEqual(
    [...CAPABILITY_EVIDENCE_STATES],
    [
      'DOCUMENTED',
      'DETECTED',
      'SUPPORTED',
      'VERIFIED',
      'DEGRADED',
      'NOT_TESTED',
      'UNAVAILABLE',
    ],
  );

  assert.equal(CAPABILITY_GRAPH_AGENT_QUESTIONS.length, 7);
  assert.equal(HISTORICAL_SEMICONDUCTOR_LEARNING_PATH.length, 7);

  assert.equal(
    defaultEvidenceState({ vendorDocumentationPresent: true }),
    'DOCUMENTED',
  );
  assert.equal(defaultEvidenceState({ hardwareDetected: true }), 'DETECTED');
  assert.equal(
    defaultEvidenceState({ xivRuntimeEvidencePresent: true }),
    'VERIFIED',
  );
});

test('DOCUMENTED ≠ VERIFIED; public docs ≠ XIV runtime verification', () => {
  const examples = encodeDocumentedDetectedVerifiedExamples();
  assert.equal(examples[0]?.verificationState, 'DOCUMENTED');
  assert.equal(examples[1]?.verificationState, 'DETECTED');
  assert.equal(examples[2]?.verificationState, 'VERIFIED');

  const denied = labelEvidenceState({
    nodeId: 'n1',
    desiredState: 'VERIFIED',
    xivRuntimeEvidencePresent: false,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const documented = registerCapabilityNode({
    nodeId: 'n-doc',
    vendor: 'amd',
    actor: architect,
    productFamily: 'ryzen_ai_npu',
    vendorDocumentationPresent: true,
  });
  assert.equal('denied' in documented, false);
  if (!('denied' in documented)) {
    assert.equal(documented.verificationState, 'DOCUMENTED');
    assert.equal(documented.documentedEqVerified, false);
  }

  const equateDenied = registerCapabilityNode({
    nodeId: 'n-bad',
    vendor: 'nvidia',
    actor: architect,
    attemptEquateDocumentedWithVerified: true,
  });
  assert.equal('denied' in equateDenied && equateDenied.denied, true);

  assert.ok(EP2_MUST_NOT.includes('equate_documented_with_verified'));
  assert.ok(EP2_MAY.includes('register_capability_nodes'));
});

test('proprietary-IP boundary: forbidden ingest denied; lawful sources accepted', () => {
  for (const cls of FORBIDDEN_IP_INGEST_CLASSES) {
    const denied = attemptForbiddenIpIngest(cls);
    assert.equal(denied.state, 'DENIED');
    assert.equal(denied.ingested, false);
  }

  const ingestDenied = registerCapabilityNode({
    nodeId: 'n-ip',
    vendor: 'intel',
    actor: architect,
    attemptForbiddenIpIngest: 'firmware_keys',
  });
  assert.equal('denied' in ingestDenied && ingestDenied.denied, true);

  const lawful = ingestLawfulLearningSource({
    ingestId: 'ing-1',
    sourceClass: 'public_technical_documentation',
  });
  assert.equal('denied' in lawful, false);

  assert.equal(LAWFUL_LEARNING_SOURCES.length, 7);
  assert.ok(LAWFUL_LEARNING_SOURCES.includes('xiv_owned_measured_benchmarks'));
});

test('neural edges strengthen on verified benchmark; STALE/REGRESSED on regression; no hidden CoT', () => {
  const weak = strengthenNeuralEdgeOnVerifiedBenchmark({
    edgeId: 'e1',
    model: 'A',
    runtime: 'B',
    device: 'C',
    workload: 'D',
    xivRuntimeEvidencePresent: false,
  });
  assert.equal('denied' in weak && weak.denied, true);

  const strong = strengthenNeuralEdgeOnVerifiedBenchmark({
    edgeId: 'e1',
    model: 'A',
    runtime: 'B',
    device: 'C',
    workload: 'D',
    xivRuntimeEvidencePresent: true,
  });
  assert.equal('denied' in strong, false);
  if (!('denied' in strong)) {
    assert.equal(strong.strength, 'STRENGTHENED');
    assert.equal(strong.hiddenChainOfThoughtStored, false);
  }

  const keepDenied = markNeuralEdgeStaleOrRegressed({
    edge: {
      edgeId: 'e1',
      model: 'A',
      runtime: 'B',
      device: 'C',
      workload: 'D',
      strength: 'STRENGTHENED',
      structuredEvidenceOnly: true,
      hiddenChainOfThoughtStored: false,
    },
    reason: 'regressed',
    attemptKeepAsVerified: true,
  });
  assert.equal('denied' in keepDenied && keepDenied.denied, true);

  const regressed = markNeuralEdgeStaleOrRegressed({
    edge: {
      edgeId: 'e1',
      model: 'A',
      runtime: 'B',
      device: 'C',
      workload: 'D',
      strength: 'STRENGTHENED',
      structuredEvidenceOnly: true,
      hiddenChainOfThoughtStored: false,
    },
    reason: 'regressed',
  });
  assert.equal('denied' in regressed, false);
  if (!('denied' in regressed)) {
    assert.equal(regressed.strength, 'REGRESSED');
  }

  const cot = attemptStoreHiddenChainOfThought();
  assert.equal(cot.state, 'DENIED');
  assert.equal(cot.stored, false);
});

test('agent questions advisory; historical learning; agent bounds + guardian', () => {
  const q = answerCapabilityQuestion({
    questionId: 'q1',
    question: 'which_verified_device_can_run_this_model',
  });
  assert.equal('denied' in q, false);
  if (!('denied' in q)) {
    assert.equal(q.advisoryOnly, true);
    assert.equal(q.productionAuthorized, false);
  }

  const bindDenied = answerCapabilityQuestion({
    questionId: 'q-bad',
    question: 'what_is_the_cheapest_verified_route',
    attemptBindProductionRoute: true,
  });
  assert.equal('denied' in bindDenied && bindDenied.denied, true);

  const hist = linkHistoricalSemiconductorLearning({ linkId: 'h1' });
  assert.equal(hist.hops.length, 7);
  assert.equal(hist.copiesProprietaryDesigns, false);

  assert.equal(CAPABILITY_GRAPH_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(attemptAgentAutoAuthority(architect).state, 'DENIED');

  const evidence = returnAgentEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: architect,
    summary: 'Capability node DOCUMENTED candidate',
  });
  assert.equal('denied' in evidence, false);

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  assert.equal(isolation.unchanged, true);

  const humanOk = requireHumanApproval({
    approvalId: 'ok',
    nodeId: 'n1',
    actor: human,
    action: 'authorize_capability_publish_candidate',
  });
  assert.equal('denied' in humanOk, false);
});

test('soft-wire EP1/EO11/EM157 present on EP1 tip', () => {
  const snap = ep2SoftWireSnapshot(repoRoot);
  assert.equal(snap.ep1VirtualChipContract.present, true);
  assert.equal(snap.ep1Report.present, true);
  assert.equal(snap.eo11VirtualDataWarehouse.present, true);
  assert.equal(snap.em157HomeBase.present, true);
});

test('cycle covers pack surfaces + bootstrap; register capability node', () => {
  for (const required of [
    'vendors_encoded',
    'core_graph_path_encoded',
    'capability_node_fields_encoded',
    'evidence_states_encoded',
    'documented_neq_verified',
    'public_docs_neq_xiv_runtime_verification',
    'no_forbidden_ip_ingest',
    'neural_edge_stale_or_regressed_on_regression',
    'no_hidden_chain_of_thought_storage',
    'l4_autonomy_false',
    'ep1_soft_wire',
  ] as const) {
    assert.ok(CAPABILITY_GRAPH_CYCLE.includes(required), required);
  }

  const boot = bootstrapCrossVendorCapabilityGraph(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.vendors.length, 6);
  assert.equal(boot.nodeFields.length, 20);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const cycle = runCrossVendorCapabilityGraphCycle({
    actor: architect,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 15);
  assert.equal('denied' in cycle.node, false);
  if (!('denied' in cycle.node)) {
    assert.equal(cycle.node.verificationState, 'DOCUMENTED');
    assert.equal(cycle.node.forbiddenIpIngested, false);
  }
  assert.equal(cycle.softWire.ep1VirtualChipContract.present, true);
});
