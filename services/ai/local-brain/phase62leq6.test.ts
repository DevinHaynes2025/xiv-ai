/**
 * 62L-EQ6 — Architecture Capability Graph denial + honesty tests.
 *
 * Script: npm run test:62leq6
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  AGENT_GRAPH_QUERIES,
  ALLOWED_GRAPH_SOURCES,
  ARCHITECTURE_CAPABILITY_GRAPH_CYCLE,
  BLOCKED_GRAPH_CONTENT,
  CAPABILITY_EDGE_FIELDS,
  CAPABILITY_GRAPH_AGENT_BOUNDS,
  CAPABILITY_GRAPH_PATHWAY,
  CAPABILITY_STATES,
  EQ6_DB_CANDIDATES_STATUS,
  EQ6_LOCKS,
  EQ6_MAY,
  EQ6_MUST_NOT,
  EVIDENCE_CLASSES,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  assertEq6LocksIntact,
  canPromoteToVerified,
  eq6SoftWireSnapshot,
  inferredMayBecomeFactSilently,
  type Eq6Actor,
} from './architecture-capability-graph-types.ts';

import {
  answerGraphQuery,
  attemptConfidentialRtl,
  attemptFirmwareKeys,
  attemptInferredSilentFact,
  attemptLeakedImplementation,
  attemptRecommendAsAct,
  attemptTradeSecrets,
  attemptUnauthorizedCustomerData,
  attemptVerifiedWithoutMeasurement,
  bootstrapArchitectureCapabilityGraph,
  emitCapabilityEdge,
  exampleAarch64EmbeddingPath,
  probeGuardianRlsTenantUniverseIsolation,
  reclassifyEvidenceClass,
  requireHumanApproval,
  returnGraphEvidenceToHomeBase,
  runArchitectureCapabilityGraphCycle,
  strengthenEdgeWithMeasurement,
  weakenEdge,
} from './architecture-capability-graph-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq6Actor = {
  kind: 'graph_curator',
  id: 'gc-1',
  orgId: 'org-eq6',
  tenantId: 'ten-eq6',
  universeId: 'uni-eq6',
  permissions: ['draft'],
};

const human: Eq6Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq6',
  tenantId: 'ten-eq6',
  universeId: 'uni-eq6',
  permissions: ['approve_consequential'],
};

test('SoT label EQ6 / #161; GitLab mirror not invented; next EQ7', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ6');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Architecture Capability Graph/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ7/);
  assert.match(NEXT_PHASE_TITLE, /ARM Edge\/Phone Runtime Research/);
});

test('honesty locks: L4 false; inferred≠fact; DB NOT_APPLIED', () => {
  assert.equal(assertEq6LocksIntact(), true);
  assert.equal(EQ6_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ6_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ6_LOCKS.INFERRED_SILENT_FACT, false);
  assert.equal(EQ6_LOCKS.VERIFIED_WITHOUT_MEASUREMENT, false);
  assert.equal(EQ6_LOCKS.CONFIDENTIAL_RTL_IN_GRAPH, false);
  assert.equal(EQ6_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayPromoteInferredToFactSilently,
    false,
  );
  assert.equal(inferredMayBecomeFactSilently(), false);
});

test('pathway + states + evidence classes + edge fields + queries encoded', () => {
  assert.deepEqual([...CAPABILITY_GRAPH_PATHWAY], [
    'architecture',
    'extension_feature',
    'compiler_ir',
    'runtime',
    'model_operator',
    'device',
    'benchmark',
    'workload',
    'outcome',
  ]);
  assert.deepEqual([...CAPABILITY_STATES], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'PARTIAL',
    'DEGRADED',
    'STALE',
    'NOT_TESTED',
    'UNAVAILABLE',
  ]);
  assert.deepEqual([...EVIDENCE_CLASSES], [
    'FACT',
    'MEASURED',
    'DOCUMENTED',
    'INFERRED',
    'HYPOTHESIS',
  ]);
  assert.ok(CAPABILITY_EDGE_FIELDS.includes('sourceNode'));
  assert.ok(CAPABILITY_EDGE_FIELDS.includes('evidenceClass'));
  assert.ok(CAPABILITY_EDGE_FIELDS.includes('expiryOrStaleness'));
  assert.ok(
    AGENT_GRAPH_QUERIES.includes('which_verified_architectures_execute_workload'),
  );
  assert.ok(ALLOWED_GRAPH_SOURCES.includes('xiv_owned_measurements'));
  assert.ok(BLOCKED_GRAPH_CONTENT.includes('confidential_rtl'));
  assert.ok(EQ6_MAY.includes('strengthen_edges_on_measured_success'));
  assert.ok(EQ6_MUST_NOT.includes('promote_inferred_edge_to_fact_silently'));
});

test('AArch64 path documented; only measured part → VERIFIED', () => {
  const { nodes, edges } = exampleAarch64EmbeddingPath(agent);
  assert.ok(nodes.some((n) => n.label === 'AArch64'));
  assert.ok(nodes.some((n) => n.label === 'embedding workload'));
  assert.ok(edges.every((e) => e.compatibilityState !== 'VERIFIED'));

  const wl = edges.find((e) => e.edgeId === 'e-bench-wl')!;
  assert.equal(wl.compatibilityState, 'SUPPORTED');

  assert.equal(
    strengthenEdgeWithMeasurement({
      edge: wl,
      to: 'VERIFIED',
      measurementRefs: [],
    }).state,
    'DENIED',
  );
  assert.equal(attemptVerifiedWithoutMeasurement().state, 'DENIED');
  assert.equal(
    canPromoteToVerified({
      from: 'SUPPORTED',
      hasMeasuredEvidence: false,
      evidenceClass: 'DOCUMENTED',
    }),
    false,
  );

  const ok = strengthenEdgeWithMeasurement({
    edge: wl,
    to: 'VERIFIED',
    measurementRefs: ['xiv-measure-1'],
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.edge.compatibilityState, 'VERIFIED');
  assert.equal(ok.edge.evidenceClass, 'MEASURED');
});

test('measurement strengthens; failure/stale/regression weaken; queries work', () => {
  const { edges } = exampleAarch64EmbeddingPath(agent);
  const e = edges.find((x) => x.edgeId === 'e-rt-model')!;
  const strong = strengthenEdgeWithMeasurement({
    edge: e,
    to: 'VERIFIED',
    measurementRefs: ['m1'],
  });
  assert.ok(!('denied' in strong));
  assert.ok(strong.edge.strength > e.strength);

  const weak = weakenEdge({
    edge: strong.edge,
    reason: 'failed_benchmark',
  });
  assert.equal(weak.edge.compatibilityState, 'DEGRADED');
  assert.ok(weak.edge.strength < strong.edge.strength);

  const stale = weakenEdge({
    edge: strong.edge,
    reason: 'stale_evidence',
  });
  assert.equal(stale.edge.compatibilityState, 'STALE');

  const ans = answerGraphQuery({
    query: 'which_path_has_regressed',
    graphEdges: [weak.edge],
  });
  assert.equal(ans.authorityGranted, false);
  assert.ok(ans.results.includes(weak.edge.edgeId));
});

test('inferred ≠ silent fact; IP boundary denies', () => {
  assert.equal(attemptInferredSilentFact().state, 'DENIED');
  const inferred = emitCapabilityEdge({
    actor: agent,
    edgeId: 'inf-1',
    sourceNode: 'a',
    targetNode: 'b',
    relationshipType: 'has_extension',
    evidenceClass: 'INFERRED',
    sourceReference: 'guess',
    version: '0',
  });
  assert.ok(!('denied' in inferred));
  assert.equal(
    reclassifyEvidenceClass({
      edge: inferred,
      to: 'FACT',
    }).state,
    'DENIED',
  );

  assert.equal(attemptConfidentialRtl().state, 'DENIED');
  assert.equal(attemptFirmwareKeys().state, 'DENIED');
  assert.equal(attemptLeakedImplementation().state, 'DENIED');
  assert.equal(attemptTradeSecrets().state, 'DENIED');
  assert.equal(attemptUnauthorizedCustomerData().state, 'DENIED');

  assert.equal(
    emitCapabilityEdge({
      actor: agent,
      edgeId: 'bad-rtl',
      sourceNode: 'a',
      targetNode: 'b',
      relationshipType: 'has_extension',
      evidenceClass: 'DOCUMENTED',
      sourceReference: 'x',
      version: '0',
      blockedContent: 'confidential_rtl',
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapArchitectureCapabilityGraph(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.pathway.length, CAPABILITY_GRAPH_PATHWAY.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq6SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq5CompilerIrTranslationLayer.present, true);
  assert.equal(soft.eq4ProprietaryIsaBoundary.present, true);
  assert.equal(soft.eq3RiscvOpenIsaKnowledgePack.present, true);
  assert.equal(soft.eq2ArmArchitectureKnowledgePack.present, true);
  assert.equal(soft.eq1CrossArchitectureContract.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnGraphEvidenceToHomeBase({
    evidenceId: 'ev-eq6-1',
    actor: agent,
    summary: 'capability graph advisory',
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

  const cycle = runArchitectureCapabilityGraphCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ARCHITECTURE_CAPABILITY_GRAPH_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ARCHITECTURE_CAPABILITY_GRAPH_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.verifiedEdge.compatibilityState, 'VERIFIED');
  assert.equal(cycle.weakenedEdge.compatibilityState, 'DEGRADED');
});
