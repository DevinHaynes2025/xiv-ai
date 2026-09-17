// 12D-89 — neural pathway growth engine contracts.
// 12D-291 paydown: converted from a bare tsx script (custom OK output, no
// node:test summary) to a REAL node:test suite — every original scenario
// preserved (the lifecycle is rebuilt FRESH per test; the original shared
// one `active` object across the preferred-selection check, and the
// selection is independent of that sharing); the suite is now
// chain-measurable.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { activatePathway, applyConfidenceDecay, evaluatePathwayCandidate, rollbackPathway, selectPreferredPathway } from './neural-pathway-growth-engine';

const base = {
  pathwayId: 'path-89-code-v1',
  tenantId: 'tenant-1',
  domain: 'CODE' as const,
  version: 1,
  confidence: .94,
  evaluationScore: .97,
  evidenceRefs: ['ci:12d-88', 'ollama:review'],
  reviewRefs: ['claude:review-1', 'ci:contract-1'],
  humanApproved: true,
  rollbackRef: 'git:parent-sha',
  modelWeightMutation: false as const,
  productionMutation: false as const,
};

test('12d-89 the pathway lifecycle: eligible, active, degraded, rolled back', () => {
  const evaluated = evaluatePathwayCandidate(base);
  assert.equal(evaluated.eligible, true, `expected eligible pathway: ${evaluated.reasons.join(',')}`);
  const active = activatePathway(base, '2026-09-11T22:45:00.000Z');
  assert.equal(active.status, 'ACTIVE');
  assert.equal(active.modelWeightMutation, false);
  assert.equal(active.productionMutation, false);
  const degraded = applyConfidenceDecay(active, .3);
  assert.equal(degraded.status, 'DEGRADED', 'confidence decay should degrade pathway');
  const rolledBack = rollbackPathway(degraded, 'git:rollback-sha');
  assert.equal(rolledBack.status, 'ROLLED_BACK', 'rollback state required');
});

test('12d-89 a weak, unreviewed, unapproved pathway must not promote', () => {
  const weak = evaluatePathwayCandidate({ ...base, pathwayId: 'weak', evaluationScore: .8, reviewRefs: ['one'], humanApproved: false, rollbackRef: undefined });
  assert.equal(weak.eligible, false, 'weak pathway must not promote');
});

test('12d-89 the best active pathway wins preferred selection', () => {
  const active = activatePathway(base, '2026-09-11T22:45:00.000Z');
  const preferred = selectPreferredPathway([
    active,
    activatePathway({ ...base, pathwayId: 'path-89-code-v2', version: 2, confidence: .96, evaluationScore: .98, parentPathwayId: active.pathwayId }, '2026-09-11T22:46:00.000Z'),
  ], 'CODE');
  assert.equal(preferred?.pathwayId, 'path-89-code-v2', 'best active pathway should win');
});