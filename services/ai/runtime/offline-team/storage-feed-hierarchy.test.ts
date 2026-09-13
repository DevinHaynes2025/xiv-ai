import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  routeArtifactToTiers, registerCloudContract, feedSnapshot,
  STORAGE_TIER_POLICY, STORAGE_FEED_GUARDRAILS,
} from './storage-feed-hierarchy';

const HASH = 'a'.repeat(64);
const descriptor = (over: Record<string, unknown> = {}) => ({
  kind: 'REPORT', securityClass: 'ORDINARY', sizeBytes: 1_000,
  contentHash: HASH, tenantId: 'xiv-hq', evidenceRefs: ['commit:5f9d1b82'],
  ...over,
} as Parameters<typeof routeArtifactToTiers>[0]);

test('policy and guardrails are frozen with the honest storage posture', () => {
  assert.equal(STORAGE_TIER_POLICY.classificationRules.TOP_SECRET.permittedTiers.length, 1);
  assert.deepEqual([...STORAGE_TIER_POLICY.classificationRules.TOP_SECRET.permittedTiers], ['LOCAL']);
  assert.deepEqual([...STORAGE_TIER_POLICY.classificationRules.ORDINARY.permittedTiers], ['LOCAL', 'OFFLINE_CARRIER', 'CLOUD']);
  assert.equal(STORAGE_FEED_GUARDRAILS.performsNoIO, true);
  assert.equal(STORAGE_FEED_GUARDRAILS.remoteCallsAllowed, false);
  assert.equal(STORAGE_FEED_GUARDRAILS.cloudIsContractOnly, true);
  assert.equal(STORAGE_FEED_GUARDRAILS.topSecretNeverLeavesLocalPlane, true);
  assert.equal(STORAGE_FEED_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.throws(() => { (STORAGE_TIER_POLICY as Record<string, unknown>).LOCAL = undefined; }, TypeError);
  assert.throws(() => { (STORAGE_FEED_GUARDRAILS as Record<string, unknown>).remoteCallsAllowed = true; }, TypeError);
});

test('TOP_SECRET never routes above LOCAL: full matrix denies carrier and cloud, explicit attempts throw', () => {
  const d = routeArtifactToTiers(descriptor({ kind: 'RECEIPT', securityClass: 'TOP_SECRET' }));
  assert.equal(d.decisions.LOCAL.allowed, true);
  assert.equal(d.decisions.OFFLINE_CARRIER.allowed, false);
  assert.equal(d.decisions.CLOUD.allowed, false);
  assert.match(d.decisions.CLOUD.reason, /LOCAL-only/);
  assert.equal(d.realArtifactsStored, 0);
  assert.equal(d.ioPerformed, false);
  assert.throws(() => routeArtifactToTiers(descriptor({ securityClass: 'TOP_SECRET', requestedTier: 'CLOUD' })), /fail closed/);
  assert.throws(() => routeArtifactToTiers(descriptor({ securityClass: 'TOP_SECRET', requestedTier: 'OFFLINE_CARRIER' })), /fail closed/);
});

test('ORDINARY routes to all three tiers by contract', () => {
  registerCloudContract({ tenantId: 'xiv-hq', region: 'EU-CENTRAL', retentionClass: 'STANDARD_30D', operatorAuthorizationRef: 'operator-receipt:001' });
  const d = routeArtifactToTiers(descriptor());
  assert.equal(d.decisions.LOCAL.allowed, true);
  assert.equal(d.decisions.OFFLINE_CARRIER.allowed, true);
  assert.equal(d.decisions.CLOUD.allowed, true);
  assert.equal(d.decisions.CLOUD.reason, 'permitted by the storage tier contract');
  assert.equal(d.humanDecision, 'REQUIRED');
});

test('CONFIDENTIAL stays LOCAL or contract-registered CLOUD and is never carrier-exportable', () => {
  const uncontracted = routeArtifactToTiers(descriptor({ tenantId: 'tenant-no-contract', securityClass: 'CONFIDENTIAL' }));
  assert.equal(uncontracted.decisions.LOCAL.allowed, true);
  assert.equal(uncontracted.decisions.OFFLINE_CARRIER.allowed, false);
  assert.equal(uncontracted.decisions.CLOUD.allowed, false);
  assert.match(uncontracted.decisions.CLOUD.reason, /contract-only/);
  assert.throws(() => routeArtifactToTiers(descriptor({ securityClass: 'CONFIDENTIAL', requestedTier: 'OFFLINE_CARRIER' })), /refused by contract/);
  registerCloudContract({ tenantId: 'tenant-conf', region: 'EU-CENTRAL', retentionClass: 'STANDARD_30D', operatorAuthorizationRef: 'operator-receipt:002' });
  const contracted = routeArtifactToTiers(descriptor({ tenantId: 'tenant-conf', securityClass: 'CONFIDENTIAL' }));
  assert.equal(contracted.decisions.CLOUD.allowed, true);
});

test('oversized, malformed, and cross-tenant-garbage inputs fail closed', () => {
  assert.throws(() => routeArtifactToTiers(descriptor({ sizeBytes: STORAGE_TIER_POLICY.LOCAL.maxItemBytes + 1 })), /item ceiling/);
  assert.throws(() => routeArtifactToTiers(descriptor({ contentHash: 'deadbeef' })), /sha256 hex/);
  assert.throws(() => routeArtifactToTiers(descriptor({ contentHash: HASH.toUpperCase() })), /sha256 hex/);
  assert.throws(() => routeArtifactToTiers(descriptor({ tenantId: 'bad tenant!' })), /tenant identity/);
  assert.throws(() => routeArtifactToTiers(descriptor({ tenantId: '../../etc' })), /tenant identity/);
  assert.throws(() => routeArtifactToTiers(descriptor({ evidenceRefs: ['ok', '   '] })), /evidence refs/);
  assert.throws(() => routeArtifactToTiers(descriptor({ sizeBytes: 0 })), /positive integer/);
  assert.throws(() => routeArtifactToTiers(descriptor({ kind: 'SOMETHING_ELSE' })), /unknown artifact kind/);
});

test('cloud contracts are contract-only: operator receipt required, no credentials, transfer never claimed', () => {
  assert.throws(() => registerCloudContract({ tenantId: 'tenant-x', region: 'US-EAST', retentionClass: 'STD', operatorAuthorizationRef: '   ' }), /operatorAuthorizationRef required/);
  assert.throws(() => registerCloudContract({ tenantId: 'tenant-x', region: 'US-EAST', retentionClass: 'STD', operatorAuthorizationRef: 'op:1', credentials: { key: 'k' } } as never), /accept no credentials/);
  assert.throws(() => registerCloudContract({ tenantId: 'tenant-x', region: 'US-EAST', retentionClass: 'STD', operatorAuthorizationRef: 'op:1', endpointUrl: 'https://example.com' } as never), /accept no endpointUrl/);
  assert.throws(() => registerCloudContract({ tenantId: 'tenant-x', region: 'BAD_REGION_LABEL_TOO_LONG_FOR_POLICY_00000000000000000000000000', retentionClass: 'STD', operatorAuthorizationRef: 'op:1' }), /region/);
  const packet = registerCloudContract({ tenantId: 'tenant-x', region: 'US-EAST', retentionClass: 'STD', operatorAuthorizationRef: 'operator-receipt:003' });
  assert.equal(packet.cloudTransferPerformed, false);
  assert.equal(packet.contractOnly, true);
  assert.equal(packet.endpointsCalled, 0);
  assert.equal(packet.credentialsAccepted, false);
  assert.equal(packet.requiresAuditedOperatorLayerForExecution, true);
  assert.equal(packet.humanDecision, 'REQUIRED');
  assert.throws(() => registerCloudContract({ tenantId: 'tenant-x', region: 'US-EAST', retentionClass: 'STD', operatorAuthorizationRef: 'operator-receipt:003' }), /already registered/);
});

test('feedSnapshot reports honest counts and never claims stored artifacts or transfers', () => {
  const s = feedSnapshot('xiv-hq');
  assert.equal(s.realArtifactsStored, 0);
  assert.equal(s.cloudTransferPerformed, false);
  assert.equal(s.remoteCallsPerformed, 0);
  assert.equal(s.ioPerformed, false);
  assert.equal(s.cloudContractsRegistered, 1);
  assert.ok(s.routed.total >= 2);
  assert.ok(s.routed.byTier.LOCAL >= 2);
  assert.equal(s.guardrails.performsNoIO, true);
  assert.throws(() => { (s as { routed: unknown }).routed = null; }, TypeError);
  assert.throws(() => feedSnapshot('no such tenant'), /tenant identity/);
  const empty = feedSnapshot('tenant-untouched');
  assert.equal(empty.routed.total, 0);
  assert.equal(empty.routed.byTier.CLOUD, 0);
});

test('routing is deterministic and pure over the same descriptor', () => {
  const d = descriptor({ tenantId: 'tenant-det' });
  const a = routeArtifactToTiers(d);
  const b = routeArtifactToTiers(d);
  assert.deepEqual(a.decisions, b.decisions);
  assert.deepEqual(
    { kind: a.kind, securityClass: a.securityClass, sizeBytes: a.sizeBytes, contentHash: a.contentHash, tenantId: a.tenantId },
    { kind: b.kind, securityClass: b.securityClass, sizeBytes: b.sizeBytes, contentHash: b.contentHash, tenantId: b.tenantId },
  );
  assert.deepEqual(Object.keys(a.decisions), ['LOCAL', 'OFFLINE_CARRIER', 'CLOUD']);
});