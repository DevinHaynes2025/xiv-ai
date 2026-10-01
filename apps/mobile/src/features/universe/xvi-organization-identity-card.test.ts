import test from 'node:test';
import assert from 'node:assert/strict';
import {presentOrganizationIdentityCard, validateOrganizationIdentityCardInput} from './xvi-organization-identity-card';

const NOW = '2026-10-01T06:00:00Z';
const base = {
  organizationId: 'org:africa:example', canonicalName: 'Example Holdings', mode: 'LOCAL_ONLY',
  identityState: 'RESOLVED', lifecycleState: 'ACTIVE', identityKeyCount: 2,
  supportingEvidenceCount: 12, contradictingEvidenceCount: 0, requiresHumanReview: false,
  observedAt: '2026-10-01T05:30:00Z', safeReadOnly: true, executionAuthority: false,
  mutationAuthority: false, productionAuthority: false,
} as const;

test('resolved fresh identity stays in Universe and zero-authority', () => {
  const p = presentOrganizationIdentityCard(base, NOW);
  assert.equal(p.attentionRoute, 'UNIVERSE'); assert.equal(p.freshnessState, 'FRESH');
  assert.equal(p.canMutate, false); assert.equal(p.canClaimExecution, false); assert.match(p.evidenceLabel, /12 supporting/);
});

test('conflicted identity routes to Needs You', () => {
  const x = { ...base, identityState: 'CONFLICTED' as const, contradictingEvidenceCount: 1, requiresHumanReview: true };
  const p = presentOrganizationIdentityCard(x, NOW); assert.equal(p.attentionRoute, 'NEEDS_YOU'); assert.match(p.attentionLabel ?? '', /conflict/i);
});

test('stale evidence routes to Needs You', () => {
  const p = presentOrganizationIdentityCard({ ...base, observedAt: '2026-09-20T00:00:00Z' }, NOW);
  assert.equal(p.freshnessState, 'STALE'); assert.equal(p.attentionRoute, 'NEEDS_YOU'); assert.match(p.attentionLabel ?? '', /stale/i);
});

test('resolved identity rejects contradiction', () => {
  assert.throws(() => validateOrganizationIdentityCardInput({ ...base, contradictingEvidenceCount: 1 }), /RESOLVED_WITH_CONTRADICTION_INVALID/);
});

test('authority escalation rejected', () => {
  assert.throws(() => validateOrganizationIdentityCardInput({ ...base, mutationAuthority: true }), /CARD_AUTHORITY_VIOLATION/);
});

test('accessor input fails closed without getter execution', () => {
  let hits = 0; const x: Record<string, unknown> = { ...base };
  Object.defineProperty(x, 'canonicalName', { enumerable: true, get() { hits++; return 'evil'; } });
  assert.throws(() => validateOrganizationIdentityCardInput(x), /CARD_INPUT_ACCESSOR_FORBIDDEN/); assert.equal(hits, 0);
});

test('future observation rejected', () => {
  assert.throws(() => presentOrganizationIdentityCard({ ...base, observedAt: '2026-10-02T00:00:00Z' }, NOW), /OBSERVATION_FROM_FUTURE/);
});

test('invalid freshness policy rejected', () => {
  assert.throws(() => presentOrganizationIdentityCard(base, NOW, 1000, 2000), /FRESHNESS_POLICY_INVALID/);
});
