/**
 * 62L-ER7 — Historical Science & Engineering Atlas denial + honesty tests.
 *
 * Script: npm run test:62ler7
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ER7_AGENT_BOUNDS,
  ER7_DB_CANDIDATES_STATUS,
  ER7_LOCKS,
  ER7_MAY,
  ER7_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HISTORICAL_SCIENCE_ENGINEERING_ATLAS_CYCLE,
  HISTORY_PRODUCTION_TRUTH_BOUNDARY,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_BOUNDARY,
  QUANTUM_CONTENT_CLASSIFICATIONS,
  SCIENCE_ENGINEERING_DOMAINS,
  SCIENCE_ENGINEERING_EVIDENCE_CLASSES,
  SCIENCE_ENGINEERING_NEURAL_PATHWAY,
  SCIENCE_ENGINEERING_NODE_FIELDS,
  SCIENCE_ENGINEERING_QUERY_HELPERS,
  assertEr7LocksIntact,
  er7SoftWireSnapshot,
  historyImpliesProductionTruth,
  type Er7Actor,
} from './historical-science-engineering-atlas-types.ts';

import {
  attachEvidenceClass,
  attemptAutoPromoteHistoryToProduction,
  attemptExtraterrestrialTechnology,
  attemptFasterThanLightNetworking,
  attemptGravityDefiance,
  attemptPiratedIngest,
  attemptRecommendAsAct,
  attemptUnverifiedQuantumAdvantage,
  bootstrapHistoricalScienceEngineeringAtlas,
  classifyQuantumContent,
  createRegisterKnowledgeNode,
  exampleBellInequalityNode,
  exampleTransistorNode,
  inspireHypothesis,
  linkNeuralPathwayHops,
  probeGuardianRlsTenantUniverseIsolation,
  queryAtlasHelper,
  returnEr7EvidenceToHomeBase,
  requireHumanApproval,
  runHistoricalScienceEngineeringAtlasCycle,
} from './historical-science-engineering-atlas-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er7Actor = {
  kind: 'historical_research_agent',
  id: 'hsea-1',
  orgId: 'org-er7',
  tenantId: 'ten-er7',
  universeId: 'uni-er7',
  permissions: ['draft'],
};

const human: Er7Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er7',
  tenantId: 'ten-er7',
  universeId: 'uni-er7',
  permissions: ['approve_consequential'],
};

test('SoT label ER7 / #162; Historical Science & Engineering Atlas; next ER8', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER7');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Historical Science & Engineering Atlas/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER8/);
  assert.match(NEXT_PHASE_TITLE, /Ancient Civilizations Knowledge Pack/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; history≠production; quantum/FTL/ET denies; DB NOT_APPLIED', () => {
  assert.equal(assertEr7LocksIntact(), true);
  assert.equal(ER7_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER7_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER7_LOCKS.HISTORY_AUTO_BECOMES_PRODUCTION_TRUTH, false);
  assert.equal(ER7_LOCKS.UNVERIFIED_QUANTUM_ADVANTAGE_CLAIM, false);
  assert.equal(ER7_LOCKS.FASTER_THAN_LIGHT_NETWORKING_CLAIM, false);
  assert.equal(ER7_LOCKS.GRAVITY_DEFIANCE_CLAIM, false);
  assert.equal(ER7_LOCKS.EXTRATERRESTRIAL_TECHNOLOGY_CLAIM, false);
  assert.equal(ER7_LOCKS.PIRATED_BOOKS_PAPERS_DOCUMENTARIES, false);
  assert.equal(ER7_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    HISTORY_PRODUCTION_TRUTH_BOUNDARY.historicalKnowledgeAutomaticallyBecomesProductionTruth,
    false,
  );
  assert.equal(historyImpliesProductionTruth(), false);
  assert.equal(ER7_AGENT_BOUNDS.mayAutoPromoteHistoryToProductionTruth, false);
});

test('domains + node fields + evidence + quantum + pathway + helpers encoded', () => {
  assert.equal(SCIENCE_ENGINEERING_DOMAINS.length, 15);
  assert.ok(SCIENCE_ENGINEERING_DOMAINS.includes('classical_physics'));
  assert.ok(
    SCIENCE_ENGINEERING_DOMAINS.includes('quantum_physics_quantum_information'),
  );
  assert.ok(
    SCIENCE_ENGINEERING_DOMAINS.includes('databases_and_distributed_systems'),
  );
  assert.equal(SCIENCE_ENGINEERING_NODE_FIELDS.length, 16);
  assert.ok(SCIENCE_ENGINEERING_NODE_FIELDS.includes('topicId'));
  assert.ok(SCIENCE_ENGINEERING_NODE_FIELDS.includes('contradictionState'));
  assert.deepEqual([...SCIENCE_ENGINEERING_EVIDENCE_CLASSES], [
    'ESTABLISHED',
    'PEER_REVIEWED',
    'HISTORICAL_RECORD',
    'SCHOLARLY_INTERPRETATION',
    'SUPPORTED_HYPOTHESIS',
    'DISPUTED',
    'SPECULATIVE',
  ]);
  assert.deepEqual([...QUANTUM_CONTENT_CLASSIFICATIONS], [
    'ESTABLISHED_PHYSICS',
    'THEORETICAL_MODEL',
    'SIMULATED',
    'QUANTUM_INSPIRED',
    'PHYSICAL_QPU_VERIFIED',
  ]);
  assert.deepEqual([...SCIENCE_ENGINEERING_NEURAL_PATHWAY], [
    'historical_discovery',
    'engineering_principle',
    'modern_architecture',
    'candidate_algorithm',
    'simulation',
    'benchmark',
    'lesson',
  ]);
  assert.equal(SCIENCE_ENGINEERING_QUERY_HELPERS.length, 6);
  assert.ok(ER7_MAY.includes('inspire_hypotheses_from_history_without_auto_promotion'));
  assert.ok(
    ER7_MUST_NOT.includes('treat_historical_knowledge_as_automatic_production_truth'),
  );
});

test('register nodes; quantum classify required; pathway; inspire≠promote', () => {
  const transistor = exampleTransistorNode(agent);
  assert.equal(transistor.fieldDomain, 'semiconductor_history');
  assert.equal(transistor.productionTruthAuthorized, false);
  assert.equal(transistor.evidenceClass, 'HISTORICAL_RECORD');

  const withEvidence = attachEvidenceClass({
    node: transistor,
    evidenceClass: 'ESTABLISHED',
  });
  assert.ok(!('denied' in withEvidence));
  assert.equal(withEvidence.evidenceClass, 'ESTABLISHED');

  const bell = exampleBellInequalityNode(agent);
  assert.equal(bell.quantumClassification, 'ESTABLISHED_PHYSICS');

  assert.equal(
    createRegisterKnowledgeNode({
      actor: agent,
      topicId: 'q-noclass',
      fieldDomain: 'quantum_physics_quantum_information',
      discoveryInvention: 'x',
      peopleOrganizations: ['x'],
      dateEra: 'x',
      geography: 'x',
      prerequisiteConcepts: [],
      engineeringProblem: 'x',
      methodTechnology: 'x',
      measurableOutcome: 'x',
      limitations: 'x',
      laterDevelopments: 'x',
      sourceSet: ['public'],
      evidenceClass: 'SPECULATIVE',
      confidence: 0.1,
      rightsState: 'OPEN',
      attemptQuantumWithoutClassification: true,
    }).state,
    'DENIED',
  );

  const classified = classifyQuantumContent({
    node: bell,
    classification: 'THEORETICAL_MODEL',
  });
  assert.ok(!('denied' in classified));
  assert.equal(classified.quantumClassification, 'THEORETICAL_MODEL');

  assert.equal(
    classifyQuantumContent({
      node: bell,
      classification: 'PHYSICAL_QPU_VERIFIED',
    }).state,
    'DENIED',
  );

  const path = linkNeuralPathwayHops({
    linkId: 'p1',
    topicId: transistor.topicId,
    linkedHops: [...SCIENCE_ENGINEERING_NEURAL_PATHWAY],
  });
  assert.ok(!('denied' in path));
  assert.equal(path.productionTruthAuthorized, false);

  const hyp = inspireHypothesis({
    actor: agent,
    hypothesisId: 'h1',
    topicId: transistor.topicId,
    statement: 'Packaging history may inspire modern memory hierarchy hypotheses.',
  });
  assert.ok(!('denied' in hyp));
  assert.equal(hyp.state, 'HYPOTHESIS_ONLY');
  assert.equal(hyp.productionTruthAuthorized, false);

  assert.equal(
    inspireHypothesis({
      actor: agent,
      hypothesisId: 'h-bad',
      topicId: transistor.topicId,
      statement: 'bad',
      attemptAutoPromoteToProduction: true,
    }).state,
    'DENIED',
  );
});

test('query helpers + deny FTL/gravity/ET/quantum-advantage/pirated', () => {
  const nodes = [exampleTransistorNode(agent), exampleBellInequalityNode(agent)];

  const q1 = queryAtlasHelper({
    queryId: 'q1',
    helper: 'past_hardware_bottlenecks_resembling_today',
    nodes,
  });
  assert.ok(!('denied' in q1));
  assert.ok(q1.topicIds.includes('se-transistor-1947'));
  assert.equal(q1.productionTruthAuthorized, false);

  const q2 = queryAtlasHelper({
    queryId: 'q2',
    helper: 'quantum_ideas_experimentally_established_vs_theoretical',
    nodes,
  });
  assert.ok(!('denied' in q2));
  assert.ok(q2.topicIds.includes('se-bell-inequality'));

  assert.equal(QUANTUM_CLAIM_BOUNDARY.mayClaimUnverifiedQuantumAdvantage, false);
  assert.equal(attemptUnverifiedQuantumAdvantage().state, 'DENIED');
  assert.equal(attemptFasterThanLightNetworking().state, 'DENIED');
  assert.equal(attemptGravityDefiance().state, 'DENIED');
  assert.equal(attemptExtraterrestrialTechnology().state, 'DENIED');
  assert.equal(attemptPiratedIngest().state, 'DENIED');
  assert.equal(attemptAutoPromoteHistoryToProduction().state, 'DENIED');

  assert.equal(
    createRegisterKnowledgeNode({
      actor: agent,
      topicId: 'pirated',
      fieldDomain: 'mathematics',
      discoveryInvention: 'x',
      peopleOrganizations: ['x'],
      dateEra: 'x',
      geography: 'x',
      prerequisiteConcepts: [],
      engineeringProblem: 'x',
      methodTechnology: 'x',
      measurableOutcome: 'x',
      limitations: 'x',
      laterDevelopments: 'x',
      sourceSet: ['pirated scan'],
      evidenceClass: 'SPECULATIVE',
      confidence: 0.1,
      rightsState: 'OPEN',
      attemptPiratedIngest: true,
    }).state,
    'DENIED',
  );
});

test('authority denies + guardian isolation hold', () => {
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; ER6/ER5/ER2/ER1 PRESENT; ER4/ER3 WAITING_DATA ok', () => {
  const boot = bootstrapHistoricalScienceEngineeringAtlas(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.domains.length, 15);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER8/);

  const soft = er7SoftWireSnapshot(repoRoot);
  assert.equal(soft.er6HistoricalBusinessCaseAtlas.present, true);
  assert.equal(soft.er5GlobalHistoricalKnowledgeIngestion.present, true);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  // Absent predecessors → WAITING_DATA (not FAIL)
  assert.equal(soft.er4RightsProvenanceGate.present, false);
  assert.equal(soft.er3PublicDataSourceRegistry.present, false);

  const transistor = exampleTransistorNode(agent);
  const ev = returnEr7EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    node: transistor,
    summary: 'atlas advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.productionTruthAuthorized, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runHistoricalScienceEngineeringAtlasCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, HISTORICAL_SCIENCE_ENGINEERING_ATLAS_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of HISTORICAL_SCIENCE_ENGINEERING_ATLAS_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er6Hop = cycle.hops.find((h) => h.hop === 'er6_soft_wire');
  assert.ok(er6Hop);
  assert.equal(er6Hop.state, 'PASS');

  const er5Hop = cycle.hops.find((h) => h.hop === 'er5_soft_wire');
  assert.ok(er5Hop);
  assert.equal(er5Hop.state, 'PASS');

  const er4Hop = cycle.hops.find((h) => h.hop === 'er4_soft_wire');
  assert.ok(er4Hop);
  assert.equal(er4Hop.state, 'WAITING_DATA');

  const er3Hop = cycle.hops.find((h) => h.hop === 'er3_soft_wire');
  assert.ok(er3Hop);
  assert.equal(er3Hop.state, 'WAITING_DATA');

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const er1Hop = cycle.hops.find((h) => h.hop === 'er1_soft_wire');
  assert.ok(er1Hop);
  assert.equal(er1Hop.state, 'PASS');

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  // EQ14 may be WAITING_DATA on this tip
  assert.ok(
    eq14Hop.state === 'PASS' || eq14Hop.state === 'WAITING_DATA',
    eq14Hop.state,
  );

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.transistor.productionTruthAuthorized, false);
  assert.equal(cycle.bell.quantumClassification, 'ESTABLISHED_PHYSICS');
});
