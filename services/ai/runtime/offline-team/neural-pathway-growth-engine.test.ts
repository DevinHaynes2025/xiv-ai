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

const evaluated = evaluatePathwayCandidate(base);
if (!evaluated.eligible) throw new Error(`expected eligible pathway: ${evaluated.reasons.join(',')}`);
const active = activatePathway(base, '2026-09-11T22:45:00.000Z');
if (active.status !== 'ACTIVE' || active.modelWeightMutation || active.productionMutation) throw new Error('activation guardrails failed');
const degraded = applyConfidenceDecay(active, .3);
if (degraded.status !== 'DEGRADED') throw new Error('confidence decay should degrade pathway');
const rolledBack = rollbackPathway(degraded, 'git:rollback-sha');
if (rolledBack.status !== 'ROLLED_BACK') throw new Error('rollback state required');

const weak = evaluatePathwayCandidate({ ...base, pathwayId: 'weak', evaluationScore: .8, reviewRefs: ['one'], humanApproved: false, rollbackRef: undefined });
if (weak.eligible) throw new Error('weak pathway must not promote');

const preferred = selectPreferredPathway([
  active,
  activatePathway({ ...base, pathwayId: 'path-89-code-v2', version: 2, confidence: .96, evaluationScore: .98, parentPathwayId: active.pathwayId }, '2026-09-11T22:46:00.000Z'),
], 'CODE');
if (preferred?.pathwayId !== 'path-89-code-v2') throw new Error('best active pathway should win');

console.log('12D-89 neural pathway growth contracts: OK');
