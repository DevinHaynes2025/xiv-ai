/**
 * 2I-AI-62C queued knowledge-schema contracts.
 * Deterministic. No network. Asserts the story stays queued and that the
 * schema slice cannot be migrated while two stories still name the same
 * concept differently.
 */
import assert from 'node:assert/strict';

import {
  AUTO_FLAGS,
  CAPABILITY_FLAGS,
  DEPLOYMENT_GATE_BLOCKED,
  DEPLOYMENT_STATE,
  HISTORICAL_PERIODS,
  IMPLEMENTATION_STARTED,
  INVARIANTS,
  KNOWLEDGE_ACCESS_CLASSES,
  KNOWLEDGE_CLASSIFICATIONS,
  KNOWLEDGE_LINEAGE_STAGES,
  KNOWLEDGE_SCHEMA_PLAN,
  KNOWLEDGE_SUPPLY_CHAIN_STAGES,
  L4_AUTONOMY_ENABLED,
  QUARANTINE_REASONS,
  REGIONAL_TIMELINES_MAY_OVERLAP,
  REQUIRED_EVALUATIONS_DEMONSTRATED,
  RETRIEVAL_PIPELINE,
  STORY_ID,
  TRANSLATION_CHAIN,
  allAutoFlagsFalse,
  allCapabilityFlagsFalse,
  noEvaluationsDemonstrated,
  referenceTables,
  storyIsImplemented,
  tenantBearingTables,
  unresolvedNameCollisions,
} from './2i-ai-62c';

function check(name: string, fn: () => void): void {
  fn();
  console.log(`  ok  ${name}`);
}

console.log(`${STORY_ID} queued knowledge-schema contracts`);

check('story is queued, not implemented', () => {
  assert.equal(DEPLOYMENT_STATE, 'QUEUED');
  assert.equal(IMPLEMENTATION_STARTED, false);
  assert.equal(DEPLOYMENT_GATE_BLOCKED, true);
  assert.equal(storyIsImplemented(), false);
});

check('L4 and every capability flag stay off', () => {
  assert.equal(L4_AUTONOMY_ENABLED, false);
  assert.equal(allCapabilityFlagsFalse(), true);
  assert.equal(CAPABILITY_FLAGS.KNOWLEDGE_INGESTION_ENABLED, false);
  assert.equal(CAPABILITY_FLAGS.XLIN_TRANSLATION_ENABLED, false);
});

check('no prohibited action is automatic (security boundary)', () => {
  assert.equal(allAutoFlagsFalse(), true);
  assert.equal(AUTO_FLAGS.AUTO_INTERNET_INGESTION, false);
  assert.equal(AUTO_FLAGS.AUTO_CROSS_TENANT_LEARNING, false);
  assert.equal(AUTO_FLAGS.AUTO_GUARDIAN_MODIFICATION, false);
  assert.equal(AUTO_FLAGS.AUTO_MODEL_RETRAINING, false);
});

check('§4 keeps all fifteen classifications distinct', () => {
  assert.equal(KNOWLEDGE_CLASSIFICATIONS.length, 15);
  assert.equal(new Set(KNOWLEDGE_CLASSIFICATIONS).size, 15);
  for (const required of ['VERIFIED_FACT', 'MYTHOLOGY', 'MODEL_INFERENCE', 'UNKNOWN'] as const) {
    assert.ok(KNOWLEDGE_CLASSIFICATIONS.includes(required));
  }
});

check('§16 keeps six access classes, private separate from public', () => {
  assert.equal(KNOWLEDGE_ACCESS_CLASSES.length, 6);
  assert.ok(KNOWLEDGE_ACCESS_CLASSES.includes('UNIVERSE_PRIVATE'));
  assert.ok(KNOWLEDGE_ACCESS_CLASSES.includes('HUMAN_PRIVATE'));
  assert.equal(INVARIANTS.publicKnowledgeJustifiesPrivatePooling, false);
});

check('§2 timeline is expandable and regionally overlapping', () => {
  assert.equal(HISTORICAL_PERIODS.length, 12);
  assert.equal(HISTORICAL_PERIODS[0], 'PREHISTORIC');
  assert.equal(HISTORICAL_PERIODS[HISTORICAL_PERIODS.length - 1], 'PRESENT');
  assert.equal(REGIONAL_TIMELINES_MAY_OVERLAP, true);
});

check('§8 translation chain starts at the original and never drops it', () => {
  assert.equal(TRANSLATION_CHAIN[0], 'ORIGINAL');
  assert.equal(TRANSLATION_CHAIN.length, 5);
  assert.equal(INVARIANTS.translationIsInterpretation, false);
  assert.equal(INVARIANTS.translatorIsCulturallyAuthoritative, false);
});

check('§17 lineage runs source through outcome', () => {
  assert.equal(KNOWLEDGE_LINEAGE_STAGES[0], 'SOURCE');
  assert.equal(KNOWLEDGE_LINEAGE_STAGES.at(-1), 'OUTCOME');
  assert.equal(KNOWLEDGE_LINEAGE_STAGES.length, 12);
  assert.ok(KNOWLEDGE_LINEAGE_STAGES.includes('HUMAN_DECISION'));
});

check('§20 supply chain keeps reverse logistics', () => {
  assert.equal(KNOWLEDGE_SUPPLY_CHAIN_STAGES.length, 9);
  assert.equal(KNOWLEDGE_SUPPLY_CHAIN_STAGES.at(-1), 'REVERSE_LOGISTICS');
});

check('§22 retrieval checks permission before assembling context', () => {
  const permission = RETRIEVAL_PIPELINE.indexOf('PERMISSION_CHECK');
  const assembly = RETRIEVAL_PIPELINE.indexOf('CONTEXT_ASSEMBLY');
  assert.ok(permission >= 0 && assembly > permission);
});

check('§24 quarantine covers all seven reasons and stays untrusted', () => {
  assert.equal(QUARANTINE_REASONS.length, 7);
  assert.equal(INVARIANTS.quarantinedIsTrusted, false);
});

check('§26 slice names all fifteen tables', () => {
  assert.equal(Object.keys(KNOWLEDGE_SCHEMA_PLAN).length, 15);
});

check('§26 every tenant-bearing table is separated from reference data', () => {
  const tenant = tenantBearingTables();
  const reference = referenceTables();
  assert.equal(tenant.length + reference.length, 15);
  assert.equal(tenant.length, 10);
  assert.equal(reference.length, 5);
  // Reference data is the shared historical record; no tenant owns it.
  assert.deepEqual(reference, [
    'xiv_civilizations',
    'xiv_historical_periods',
    'xiv_knowledge_domains',
    'xiv_languages',
    'xiv_professions',
  ]);
  // Anything holding a claim, a translation of one, or a grant is tenant-bearing.
  for (const t of ['xiv_knowledge_objects', 'xiv_knowledge_translations', 'xiv_agent_knowledge_access']) {
    assert.ok(tenant.includes(t), `${t} must be tenant-bearing`);
  }
});

check('§26 every table carries a stated rationale', () => {
  for (const [table, plan] of Object.entries(KNOWLEDGE_SCHEMA_PLAN)) {
    assert.ok(plan.rationale.length > 0, `${table} needs a rationale`);
  }
});

check('two knowledge concepts are still named twice across 62A and 62C', () => {
  const collisions = unresolvedNameCollisions();
  assert.equal(collisions.length, 2);
  assert.deepEqual(
    collisions.map((c) => `${c.planned}<->${c.alsoPlannedAs}`).sort(),
    ['xiv_knowledge_lineage<->knowledge_lineage', 'xiv_knowledge_sources<->agent_knowledge_sources'],
  );
});

check('no evaluation from §27 is demonstrated yet', () => {
  assert.equal(noEvaluationsDemonstrated(), true);
  assert.equal(REQUIRED_EVALUATIONS_DEMONSTRATED.tenantIsolation, false);
  assert.equal(REQUIRED_EVALUATIONS_DEMONSTRATED.promptInjection, false);
});

check('§12/§18/§19 reasoning invariants hold', () => {
  assert.equal(INVARIANTS.culturalContextIsIdentity, false);
  assert.equal(INVARIANTS.historicalAnalogueIsPrediction, false);
  assert.equal(INVARIANTS.consensusIsCertainty, false);
  assert.equal(INVARIANTS.mythologyIsHistory, false);
  assert.equal(INVARIANTS.historicalBeliefIsModernFact, false);
  assert.equal(INVARIANTS.newLearningOverwritesProvenance, false);
  assert.equal(INVARIANTS.oldInformationIsCurrent, false);
});

console.log(`${STORY_ID}: all queued knowledge-schema contracts hold`);
