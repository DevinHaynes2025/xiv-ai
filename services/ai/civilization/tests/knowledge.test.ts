import assert from 'node:assert/strict';
import { test } from 'node:test';

import { KNOWLEDGE_ERAS, LINEAGE_STAGES, suggestStorageTier } from '../knowledge';
import { codeOf, twoUniverseWorld } from './harness';

test('the era ladder spans ancient civilizations to the present', () => {
  assert.deepEqual(KNOWLEDGE_ERAS, ['ancient', 'classical', 'medieval', 'industrial', 'modern', 'digital', 'present']);
});

test('a historical belief cannot be filed as a present-day fact', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.recordKnowledgeSource(world.alphaFounder, {
        title: 'Bloodletting cures fever',
        claimKind: 'historical_evidence',
        discipline: 'medicine',
        era: 'present',
        origin: 'medieval physician manual',
      }),
    ),
    'knowledge_historical_claim_as_present',
  );

  assert.equal(
    codeOf(() =>
      world.xiv.recordKnowledgeSource(world.alphaFounder, {
        title: 'Bloodletting cures fever',
        claimKind: 'human_fact',
        discipline: 'medicine',
        era: 'medieval',
        origin: 'medieval physician manual',
      }),
    ),
    'knowledge_historical_claim_as_present',
  );
});

test('translation and interpretation never replace the original', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.recordKnowledgeSource(world.alphaFounder, {
        title: 'Hanseatic routing charter',
        claimKind: 'historical_evidence',
        discipline: 'trade',
        era: 'medieval',
        origin: 'municipal archive',
        translation: 'trade shall pass through Hamburg',
      }),
    ),
    'knowledge_original_text_missing',
  );

  const preserved = world.xiv.recordKnowledgeSource(world.alphaFounder, {
    title: 'Hanseatic routing charter',
    claimKind: 'historical_evidence',
    discipline: 'trade',
    era: 'medieval',
    origin: 'municipal archive',
    originalLanguage: 'Middle Low German',
    originalText: 'de kopmanschop schal gan dorch Hamborch',
    translation: 'trade shall pass through Hamburg',
    interpretation: 'Traders kept a standing alternate port.',
    contradictions: ['Later charters show different terms.'],
    confidence: 0.55,
  });

  assert.equal(preserved.originalText, 'de kopmanschop schal gan dorch Hamborch');
  assert.equal(preserved.originalLanguage, 'Middle Low German');
  assert.notEqual(preserved.translation, preserved.interpretation);
  assert.deepEqual(preserved.contradictions, ['Later charters show different terms.']);
});

test('modern relevance is a separate labelled inference, not a promotion', () => {
  const world = twoUniverseWorld();

  const historical = world.xiv.recordKnowledgeSource(world.alphaFounder, {
    title: 'Hanseatic contingency routing',
    claimKind: 'historical_evidence',
    discipline: 'trade',
    era: 'medieval',
    origin: 'municipal archive',
    originalText: 'de kopmanschop schal gan dorch Hamborch',
    confidence: 0.55,
  });

  const derived = world.xiv.deriveModernRelevance(world.alphaFounder, {
    knowledgeSourceId: historical.id,
    relevance: 'Keep a pre-qualified secondary port under contract before disruption.',
    confidence: 0.6,
  });

  assert.equal(historical.claimKind, 'historical_evidence');
  assert.equal(historical.era, 'medieval');
  assert.equal(derived.claimKind, 'agent_inference');
  assert.equal(derived.era, 'present');
  assert.equal(derived.origin, `derived_from:${historical.id}`);
  assert.notEqual(derived.id, historical.id);
});

test('storage tier follows era, claim and confidence rather than a fixed size', () => {
  assert.equal(
    suggestStorageTier({
      era: 'present',
      claimKind: 'human_fact',
      confidence: 0.9,
      securityClassification: 'internal',
    }),
    'hot',
  );
  assert.equal(
    suggestStorageTier({ era: 'modern', claimKind: 'external_source', confidence: 0.7, securityClassification: 'internal' }),
    'warm',
  );
  assert.equal(
    suggestStorageTier({
      era: 'medieval',
      claimKind: 'historical_evidence',
      confidence: 0.5,
      securityClassification: 'internal',
    }),
    'cold',
  );
  assert.equal(
    suggestStorageTier({ era: 'ancient', claimKind: 'unknown', confidence: 0.2, securityClassification: 'internal' }),
    'archival',
  );
});

test('information logistics records every stage in order', () => {
  const world = twoUniverseWorld();

  const source = world.xiv.recordKnowledgeSource(world.alphaFounder, {
    title: 'Inbound lane exposure',
    claimKind: 'human_fact',
    discipline: 'supply_chain',
    origin: 'operations director',
    confidence: 0.9,
  });

  for (const stage of ['acquisition', 'classification', 'storage', 'transformation'] as const) {
    world.xiv.recordLineage(world.alphaFounder, {
      knowledgeSourceId: source.id,
      stage,
      actorKind: 'agent',
      actorAgentId: world.alphaSpecialist.id,
      modelId: 'gemini-flash',
      detail: `stage ${stage}`,
    });
  }

  assert.equal(
    codeOf(() =>
      world.xiv.recordLineage(world.alphaFounder, {
        knowledgeSourceId: source.id,
        stage: 'origin',
        actorKind: 'system',
        detail: 'rewind the lineage',
      }),
    ),
    'knowledge_lineage_out_of_order',
  );

  world.xiv.recordLineage(world.alphaFounder, {
    knowledgeSourceId: source.id,
    stage: 'decision',
    actorKind: 'human',
    detail: 'Executive approved on this evidence.',
    relatedMeetingId: 'meeting-1',
  });

  const trace = world.xiv.traceLineage(world.alphaFounder, source.id);
  assert.equal(trace.whereItCameFrom, 'operations director');
  assert.deepEqual(trace.whoChangedIt, [world.alphaFounder.userId]);
  assert.deepEqual(trace.whichAgentsUsedIt, [world.alphaSpecialist.id]);
  assert.deepEqual(trace.whichModelsInterpretedIt, ['gemini-flash']);
  assert.deepEqual(trace.whichDecisionsDependedOnIt, ['meeting-1']);
  assert.deepEqual(trace.stages, ['origin', 'acquisition', 'classification', 'storage', 'transformation', 'decision']);
  assert.ok(trace.stages.every((stage) => LINEAGE_STAGES.includes(stage)));
});

test('recording a source opens its lineage automatically', () => {
  const world = twoUniverseWorld();

  const source = world.xiv.recordKnowledgeSource(world.alphaFounder, {
    title: 'Carrier notice',
    claimKind: 'human_fact',
    discipline: 'supply_chain',
    origin: 'carrier email',
  });

  const trace = world.xiv.traceLineage(world.alphaFounder, source.id);
  assert.deepEqual(trace.stages, ['origin']);
});
