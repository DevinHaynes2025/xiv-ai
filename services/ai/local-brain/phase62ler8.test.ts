/**
 * 62L-ER8 — Ancient Civilizations Knowledge Pack denial + honesty tests.
 *
 * Script: npm run test:62ler8
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ANCIENT_CIVILIZATION_COVERAGE,
  ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_CYCLE,
  ANCIENT_CIV_CULTURAL_SAFEGUARDS,
  ANCIENT_CIV_EVIDENCE_CLASSES,
  ANCIENT_CIV_KNOWLEDGE_DOMAINS,
  ANCIENT_CIV_NEURAL_PATHWAY,
  ANCIENT_CIV_NODE_FIELDS,
  ANCIENT_CIV_PATHWAY_LABEL,
  ANCIENT_CIV_RIGHTS_STATES,
  ER8_AGENT_BOUNDS,
  ER8_DB_CANDIDATES_STATUS,
  ER8_LOCKS,
  ER8_MAY,
  ER8_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  analogyIsProof,
  assertEr8LocksIntact,
  er8SoftWireSnapshot,
  type Er8Actor,
} from './ancient-civilizations-knowledge-pack-types.ts';

import {
  attemptBeliefAsHiddenPolicy,
  attemptLostAdvancedTechnologyClaim,
  attemptMonolithicFlattening,
  attemptPiratedIngest,
  attemptRecommendAsAct,
  attemptTreatAnalogyAsProof,
  attachEvidenceClass,
  bootstrapAncientCivilizationsKnowledgePack,
  buildAnalogyPathway,
  exampleKushTradeNode,
  exampleNileIrrigationNode,
  probeGuardianRlsTenantUniverseIsolation,
  registerCivilizationNode,
  requireHumanApproval,
  returnEr8EvidenceToHomeBase,
  runAncientCivilizationsKnowledgePackCycle,
} from './ancient-civilizations-knowledge-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er8Actor = {
  kind: 'ancient_civ_research_agent',
  id: 'acr-1',
  orgId: 'org-er8',
  tenantId: 'ten-er8',
  universeId: 'uni-er8',
  permissions: ['draft'],
};

const human: Er8Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er8',
  tenantId: 'ten-er8',
  universeId: 'uni-er8',
  permissions: ['approve_consequential'],
};

test('SoT label ER8 / #162; Ancient Civilizations Knowledge Pack; next ER9 Public Law & Policy', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER8');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Ancient Civilizations Knowledge Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER9/);
  assert.match(NEXT_PHASE_TITLE, /Public Law & Policy Knowledge Pack/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; cultural safeguards; rights; DB NOT_APPLIED', () => {
  assert.equal(assertEr8LocksIntact(), true);
  assert.equal(ER8_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER8_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER8_LOCKS.MONOLITHIC_AFRICAN_KNOWLEDGE, false);
  assert.equal(ER8_LOCKS.MONOLITHIC_CHINESE_KNOWLEDGE, false);
  assert.equal(ER8_LOCKS.MONOLITHIC_INDIGENOUS_KNOWLEDGE, false);
  assert.equal(ER8_LOCKS.SPIRITUAL_BELIEF_AS_HIDDEN_SYSTEM_POLICY, false);
  assert.equal(ER8_LOCKS.UNSUPPORTED_LOST_ADVANCED_TECHNOLOGY_CLAIMS, false);
  assert.equal(ER8_LOCKS.ANALOGY_EQ_PROOF, false);
  assert.equal(ER8_LOCKS.PIRATED_BOOKS_DOCUMENTARIES_ARCHIVES, false);
  assert.equal(ER8_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ANCIENT_CIV_CULTURAL_SAFEGUARDS.noMonolithicAfricanKnowledge, true);
  assert.equal(analogyIsProof(), false);
  assert.equal(ER8_AGENT_BOUNDS.mayTreatAnalogyAsProof, false);
});

test('coverage + fields + evidence classes + domains + pathway encoded', () => {
  assert.equal(ANCIENT_CIVILIZATION_COVERAGE.length, 10);
  assert.ok(ANCIENT_CIVILIZATION_COVERAGE.includes('ancient_egypt'));
  assert.ok(
    ANCIENT_CIVILIZATION_COVERAGE.includes(
      'nubia_kush_and_broader_african_civilizations',
    ),
  );
  assert.ok(
    ANCIENT_CIVILIZATION_COVERAGE.includes(
      'islamic_golden_age_and_connected_knowledge_networks',
    ),
  );
  assert.equal(ANCIENT_CIV_NODE_FIELDS.length, 16);
  assert.ok(ANCIENT_CIV_NODE_FIELDS.includes('civilizationId'));
  assert.ok(ANCIENT_CIV_NODE_FIELDS.includes('translationSource'));
  assert.ok(ANCIENT_CIV_NODE_FIELDS.includes('culturalSensitivityNotes'));
  assert.deepEqual([...ANCIENT_CIV_EVIDENCE_CLASSES], [
    'PRIMARY_HISTORICAL_SOURCE',
    'ARCHAEOLOGICAL_EVIDENCE',
    'SCHOLARLY_INTERPRETATION',
    'CULTURAL_TRADITION',
    'DISPUTED',
    'SPECULATIVE',
  ]);
  assert.equal(ANCIENT_CIV_KNOWLEDGE_DOMAINS.length, 15);
  assert.ok(ANCIENT_CIV_KNOWLEDGE_DOMAINS.includes('trade_and_supply_routes'));
  assert.ok(ANCIENT_CIV_KNOWLEDGE_DOMAINS.includes('mathematics'));
  assert.deepEqual([...ANCIENT_CIV_NEURAL_PATHWAY], [
    'historical_system',
    'principle',
    'modern_analogue',
    'hypothesis',
    'simulation',
    'measured_result',
  ]);
  assert.equal(ANCIENT_CIV_PATHWAY_LABEL, 'analogy_inspiration_not_proof');
  assert.ok(ANCIENT_CIV_RIGHTS_STATES.includes('PUBLIC_DOMAIN'));
  assert.ok(ER8_MAY.includes('build_neural_pathways_labeled_analogy_inspiration_not_proof'));
  assert.ok(
    ER8_MUST_NOT.includes(
      'treat_african_chinese_or_indigenous_knowledge_as_one_monolithic_system',
    ),
  );
});

test('register requires region/era/translation; attach evidence; analogy not proof', () => {
  const node = exampleNileIrrigationNode(agent);
  assert.equal(node.civilizationId, 'ancient_egypt');
  assert.ok(node.regionGeography.includes('Nile'));
  assert.ok(node.era.length > 0);
  assert.ok(node.translationSource.length > 0);
  assert.equal(node.flattenedMonolith, false);

  assert.equal(
    registerCivilizationNode({
      actor: agent,
      nodeId: 'missing',
      civilizationId: 'china',
      regionGeography: '',
      era: '',
      languageScript: 'Classical Chinese',
      sourceType: 'test',
      authorAttribution: 't',
      translationSource: '',
      domain: 'astronomy',
      claimOrPractice: 'x',
      historicalContext: 'y',
      evidenceClass: 'DISPUTED',
      confidence: 0.2,
      scholarlyDisagreement: 'n/a',
      culturalSensitivityNotes: 'preserve dynastic/regional specificity',
      sourceRefs: ['r'],
      rightsState: 'OPEN',
    }).state,
    'DENIED',
  );

  const attached = attachEvidenceClass({
    node,
    evidenceClass: 'ARCHAEOLOGICAL_EVIDENCE',
  });
  assert.ok(!('denied' in attached));
  assert.equal(attached.evidenceClass, 'ARCHAEOLOGICAL_EVIDENCE');

  const pathway = buildAnalogyPathway({
    pathwayId: 'p1',
    fromNodeId: node.nodeId,
    historicalSystem: 'Nilometer flood accounting',
    principle: 'Measure inflow before allocate',
    modernAnalogue: 'sensor-informed inventory',
    hypothesis: 'early measurement reduces stockouts',
    simulation: 'sim-v0',
  });
  assert.ok(!('denied' in pathway));
  assert.equal(pathway.isProof, false);
  assert.equal(pathway.inspirationOnly, true);
  assert.equal(pathway.label, ANCIENT_CIV_PATHWAY_LABEL);
  assert.equal(attemptTreatAnalogyAsProof().state, 'DENIED');
  assert.equal(
    buildAnalogyPathway({
      pathwayId: 'bad',
      fromNodeId: node.nodeId,
      historicalSystem: 'x',
      principle: 'y',
      modernAnalogue: 'z',
      hypothesis: 'h',
      simulation: 's',
      attemptTreatAsProof: true,
    }).state,
    'DENIED',
  );
});

test('cultural + rights denies: monolith, belief→policy, lost tech, pirated', () => {
  assert.equal(attemptMonolithicFlattening().state, 'DENIED');
  assert.equal(attemptBeliefAsHiddenPolicy().state, 'DENIED');
  assert.equal(attemptLostAdvancedTechnologyClaim().state, 'DENIED');
  assert.equal(attemptPiratedIngest().state, 'DENIED');

  assert.equal(
    registerCivilizationNode({
      actor: agent,
      nodeId: 'mono',
      civilizationId: 'indigenous_knowledge_traditions',
      regionGeography: 'Turtle Island (unspecified)',
      era: 'various',
      languageScript: 'various',
      sourceType: 'test',
      authorAttribution: 't',
      translationSource: 'n/a',
      domain: 'philosophy_ethics',
      claimOrPractice: 'all indigenous knowledge as one system',
      historicalContext: 'flattened',
      evidenceClass: 'SPECULATIVE',
      confidence: 0.1,
      scholarlyDisagreement: 'n/a',
      culturalSensitivityNotes: 'must not flatten',
      sourceRefs: ['x'],
      rightsState: 'PUBLIC_DOMAIN',
      attemptMonolithicFlattening: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    registerCivilizationNode({
      actor: agent,
      nodeId: 'belief',
      civilizationId: 'ancient_egypt',
      regionGeography: 'Nile Valley',
      era: 'New Kingdom',
      languageScript: 'Egyptian',
      sourceType: 'test',
      authorAttribution: 't',
      translationSource: 'public-domain',
      domain: 'philosophy_ethics',
      claimOrPractice: 'temple cosmology',
      historicalContext: 'ritual belief',
      evidenceClass: 'CULTURAL_TRADITION',
      confidence: 0.4,
      scholarlyDisagreement: 'n/a',
      culturalSensitivityNotes: 'belief ≠ policy',
      sourceRefs: ['x'],
      rightsState: 'PUBLIC_DOMAIN',
      attemptBeliefAsHiddenPolicy: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    registerCivilizationNode({
      actor: agent,
      nodeId: 'lost-tech',
      civilizationId: 'mesopotamia',
      regionGeography: 'Southern Mesopotamia',
      era: 'Ur III',
      languageScript: 'Sumerian',
      sourceType: 'test',
      authorAttribution: 't',
      translationSource: 'public-domain',
      domain: 'metallurgy',
      claimOrPractice: 'lost advanced tech claim',
      historicalContext: 'unsupported',
      evidenceClass: 'SPECULATIVE',
      confidence: 0.05,
      scholarlyDisagreement: 'fringe',
      culturalSensitivityNotes: 'deny unsupported lost tech',
      sourceRefs: ['x'],
      rightsState: 'PUBLIC_DOMAIN',
      attemptLostAdvancedTechnologyClaim: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    registerCivilizationNode({
      actor: agent,
      nodeId: 'pirate',
      civilizationId: 'greece_and_rome',
      regionGeography: 'Athens',
      era: 'Classical',
      languageScript: 'Ancient Greek',
      sourceType: 'pirated',
      authorAttribution: 't',
      translationSource: 'stolen scan',
      domain: 'legal_traditions',
      claimOrPractice: 'x',
      historicalContext: 'y',
      evidenceClass: 'PRIMARY_HISTORICAL_SOURCE',
      confidence: 0.5,
      scholarlyDisagreement: 'n/a',
      culturalSensitivityNotes: 'n/a',
      sourceRefs: ['pirate://book'],
      rightsState: 'PUBLIC_DOMAIN',
      attemptPiratedIngest: true,
    }).state,
    'DENIED',
  );

  const kush = exampleKushTradeNode(agent);
  assert.match(kush.culturalSensitivityNotes, /monolithic/i);
  assert.equal(kush.civilizationId, 'nubia_kush_and_broader_african_civilizations');
});

test('authority denies + guardian isolation hold', () => {
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; ER2/ER1 PRESENT; ER7–ER5 WAITING_DATA ok', () => {
  const boot = bootstrapAncientCivilizationsKnowledgePack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.coverage.length, 10);
  assert.equal(boot.evidenceClasses.length, 6);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER9/);
  assert.equal(boot.pathwayLabel, 'analogy_inspiration_not_proof');

  const soft = er8SoftWireSnapshot(repoRoot);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  // Mid-flight predecessors may be absent → WAITING_DATA, not FAIL
  assert.equal(typeof soft.er7HistoricalScienceEngineeringAtlas.present, 'boolean');
  assert.equal(typeof soft.er6HistoricalBusinessCaseAtlas.present, 'boolean');
  assert.equal(typeof soft.er5GlobalHistoricalKnowledgeIngestion.present, 'boolean');
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);

  const ev = returnEr8EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    summary: 'ancient civ advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runAncientCivilizationsKnowledgePackCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er7Hop = cycle.hops.find((h) => h.hop === 'er7_soft_wire');
  assert.ok(er7Hop);
  assert.ok(
    er7Hop.state === 'PASS' || er7Hop.state === 'WAITING_DATA',
    `er7 unexpected ${er7Hop.state}`,
  );

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.node.civilizationId, 'ancient_egypt');
});
