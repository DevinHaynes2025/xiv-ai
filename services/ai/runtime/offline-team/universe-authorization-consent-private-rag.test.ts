import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  ConsentPolicyVault,
  PrivacyPreservingUniverseRagBridge,
  UniverseAuthorizationLedger,
  buildApprovedSharedLearningSignal,
  decideUniverseSync,
  type ConsentPolicyBundle,
  type LocalEmbeddingVerificationReceipt,
  type SyncAdapterVerificationReceipt,
  type UniverseAuthorizationGrant,
  type UniverseRagMemoryRecord,
} from './universe-authorization-consent-private-rag';
import type { UniverseKeyMaterial } from './sovereign-universe-data-room-agent-twins';

const tenantId = 'tenant-alpha';
const userId = 'user-1';
const universeId = 'universe-1';
const now = new Date('2026-09-11T14:00:00.000Z');
const future = '2026-09-12T14:00:00.000Z';

async function main(): Promise<void> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'xiv-12d72-'));
  const key: UniverseKeyMaterial = {
    tenantId,
    userId,
    keyId: 'universe-key-1',
    keyVersion: 1,
    key: Buffer.alloc(32, 12),
    evidenceRefs: ['key-ceremony:12d72'],
  };
  const resolver = { resolve: () => key };

  try {
    const ledger = new UniverseAuthorizationLedger(tempRoot, tenantId, userId);
    const grant: UniverseAuthorizationGrant = {
      grantId: 'grant-user-1',
      tenantId,
      userId,
      subjectId: userId,
      universeId,
      scopes: ['memory:write', 'memory:read', 'sync:device', 'sync:external'],
      authorizationType: 'USER_EXPLICIT',
      issuedBy: userId,
      issuedAt: now.toISOString(),
      expiresAt: future,
      evidenceRefs: ['consent:explicit-user-grant'],
    };
    const grantEvent = await ledger.grant(grant, ['session:authenticated-user'], now);
    assert.equal(grantEvent.sequence, 1);
    assert.equal(grantEvent.previousHash, '0'.repeat(64));

    const restartedLedger = new UniverseAuthorizationLedger(tempRoot, tenantId, userId);
    const restored = await restartedLedger.load();
    assert.equal(restored.length, 1);
    assert.equal((await restartedLedger.decide(grant.grantId, userId, universeId, ['memory:read'], now.getTime())).allowed, true);

    const allowedAccess = await restartedLedger.recordAccess({
      grantId: grant.grantId,
      actorId: userId,
      universeId,
      requestedScopes: ['memory:read'],
      resourceRef: 'rag:agent-strategy',
      evidenceRefs: ['session:local-auth'],
      now,
    });
    assert.equal(allowedAccess.outcome, 'ALLOWED');
    assert.equal(allowedAccess.previousHash, grantEvent.hash);

    const deniedAccess = await restartedLedger.recordAccess({
      grantId: grant.grantId,
      actorId: userId,
      universeId,
      requestedScopes: ['money:move'],
      resourceRef: 'forbidden:finance-action',
      evidenceRefs: ['request:forbidden-scope'],
      now,
    });
    assert.equal(deniedAccess.outcome, 'DENIED');

    const vault = new ConsentPolicyVault(tempRoot, tenantId, userId, resolver);
    const bundle: ConsentPolicyBundle = {
      bundleId: 'bundle-local-health-rag',
      tenantId,
      userId,
      consentReceipt: {
        receiptId: 'consent-health-local-rag',
        tenantId,
        subjectId: userId,
        connectorId: 'universe-local-rag',
        dataClass: 'HEALTH',
        scopes: ['memory:write', 'memory:read'],
        jurisdiction: 'LOCAL-SOVEREIGN',
        authorizedAt: now.toISOString(),
        expiresAt: future,
        externalRoutingAllowed: false,
        evidenceRefs: ['consent:user-signature-local-rag'],
      },
      legalPolicyReceipt: {
        receiptId: 'policy-health-local-rag',
        tenantId,
        connectorId: 'universe-local-rag',
        dataClass: 'HEALTH',
        jurisdiction: 'LOCAL-SOVEREIGN',
        reviewedAt: now.toISOString(),
        expiresAt: future,
        approvedScopes: ['memory:write', 'memory:read'],
        externalRoutingAllowed: false,
        evidenceRefs: ['policy:local-health-review'],
      },
      evidenceRefs: ['bundle:evidence-1'],
      storedAt: now.toISOString(),
    };
    const vaultReceipt = await vault.save(bundle, now);
    assert.equal(vaultReceipt.encryptedAtRest, true);
    const vaultDiskPath = path.join(tempRoot, tenantId, 'users', userId, 'consent-policy', `${bundle.bundleId}.xivpolicy.json`);
    const vaultDisk = await readFile(vaultDiskPath, 'utf8');
    assert.equal(vaultDisk.includes('consent:user-signature-local-rag'), false);
    assert.equal(vaultDisk.includes('LOCAL-SOVEREIGN'), false);
    assert.deepEqual(await vault.load(bundle.bundleId), bundle);
    assert.deepEqual(await vault.validateForUse(bundle.bundleId, {
      connectorId: 'universe-local-rag',
      dataClass: 'HEALTH',
      jurisdiction: 'LOCAL-SOVEREIGN',
      scopes: ['memory:read'],
      requireExternalRouting: false,
      asOf: now.getTime(),
    }), []);
    assert.match((await vault.validateForUse(bundle.bundleId, {
      connectorId: 'universe-local-rag',
      dataClass: 'HEALTH',
      jurisdiction: 'LOCAL-SOVEREIGN',
      scopes: ['memory:read'],
      requireExternalRouting: true,
      asOf: now.getTime(),
    })).join(' '), /external routing/i);

    const embeddingReceipt: LocalEmbeddingVerificationReceipt = {
      receiptId: 'embedding-local-1',
      tenantId,
      adapterId: 'local-embedding-adapter',
      runtimeId: 'cpu-local-runtime',
      status: 'VERIFIED',
      verifiedAt: now.toISOString(),
      expiresAt: future,
      evidenceRefs: ['benchmark:local-embedding', 'runtime:cpu-receipt'],
    };
    const rag = new PrivacyPreservingUniverseRagBridge({
      root: tempRoot,
      tenantId,
      userId,
      universeId,
      keyResolver: resolver,
      authorizationLedger: restartedLedger,
      consentPolicyVault: vault,
      embeddingReceipt,
    });

    const healthMemory: UniverseRagMemoryRecord = {
      schemaVersion: 1,
      recordId: 'memory-health-1',
      tenantId,
      userId,
      universeId,
      agentMemoryNamespace: 'agent:privacy',
      classification: 'TOP_SECRET',
      dataClass: 'HEALTH',
      content: 'private recovery plan uses evidence first local retrieval',
      sourceEvidenceRefs: ['source:private-health-note'],
      authorizationGrantId: grant.grantId,
      consentPolicyBundleId: bundle.bundleId,
      createdAt: now.toISOString(),
    };
    const healthSave = await rag.saveRecord(healthMemory, ['memory:write'], now);
    assert.equal(healthSave.encryptedAtRest, true);
    assert.equal(healthSave.ordinaryEmbeddingEligible, false);
    assert.equal(healthSave.topSecretOrdinaryEmbeddingAllowed, false);
    const healthDisk = await readFile(healthSave.path, 'utf8');
    assert.equal(healthDisk.includes('private recovery plan'), false);

    const generalMemory: UniverseRagMemoryRecord = {
      schemaVersion: 1,
      recordId: 'memory-general-1',
      tenantId,
      userId,
      universeId,
      agentMemoryNamespace: 'agent:strategy',
      classification: 'CONFIDENTIAL',
      dataClass: 'GENERAL',
      content: 'retail inventory bottleneck evaluation improved forecast accuracy',
      sourceEvidenceRefs: ['source:inventory-evaluation'],
      authorizationGrantId: grant.grantId,
      createdAt: now.toISOString(),
    };
    const generalSave = await rag.saveRecord(generalMemory, ['memory:write'], now);
    assert.equal(generalSave.ordinaryEmbeddingEligible, true);

    const localTopSecret = await rag.query({
      agentMemoryNamespace: 'agent:privacy',
      query: 'private local recovery evidence',
      executionMode: 'LOCAL_ONLY',
      useOrdinaryEmbeddings: false,
      now,
    });
    assert.equal(localTopSecret.hits.length, 1);
    assert.equal(localTopSecret.hits[0]?.classification, 'TOP_SECRET');
    assert.equal(localTopSecret.receipt.ordinaryEmbeddingsExecuted, false);
    assert.equal(localTopSecret.receipt.retrievalMode, 'DETERMINISTIC_LEXICAL');

    const hybridTopSecret = await rag.query({
      agentMemoryNamespace: 'agent:privacy',
      query: 'private recovery evidence',
      executionMode: 'HYBRID',
      useOrdinaryEmbeddings: true,
      now,
    });
    assert.equal(hybridTopSecret.hits.length, 0);
    assert.equal(hybridTopSecret.receipt.topSecretHybridAllowed, false);

    const strategyQuery = await rag.query({
      agentMemoryNamespace: 'agent:strategy',
      query: 'inventory forecast accuracy',
      executionMode: 'LOCAL_ONLY',
      useOrdinaryEmbeddings: true,
      now,
    });
    assert.equal(strategyQuery.hits.length, 1);
    assert.equal(strategyQuery.receipt.verifiedEmbeddingAdapterObserved, true);
    assert.equal(strategyQuery.receipt.ordinaryEmbeddingsExecuted, false);
    assert.equal((await rag.loadNamespace('agent:privacy')).some((record) => record.recordId === generalMemory.recordId), false);

    const promotion = rag.evaluatePromotion({
      record: generalMemory,
      evaluationScore: 0.91,
      threshold: 0.8,
      evidenceRefs: ['eval:retrieval-quality-1', 'eval:human-review-1'],
      now,
    });
    assert.equal(promotion.promotedToPrivateMemory, true);
    assert.equal(promotion.modelWeightsMutated, false);
    assert.equal(promotion.graphEdgeIsFact, false);
    assert.equal(promotion.correlationIsCausation, false);

    const lowPromotion = rag.evaluatePromotion({
      record: generalMemory,
      evaluationScore: 0.42,
      threshold: 0.8,
      evidenceRefs: ['eval:retrieval-quality-low'],
      now,
    });
    assert.equal(lowPromotion.promotedToPrivateMemory, false);

    const sharedSignal = buildApprovedSharedLearningSignal({
      signalId: 'shared-signal-1',
      tenantId,
      sourceUniverseId: universeId,
      metric: 'retrieval-success-rate',
      cohortSize: 12,
      aggregateValue: 0.88,
      dimensions: { industry: 'retail' },
      classification: 'INTERNAL',
      evidenceRefs: ['aggregate:privacy-review-1'],
    });
    assert.equal(sharedSignal.anonymized, true);
    assert.equal(sharedSignal.minimized, true);
    assert.equal(sharedSignal.containsRawRecords, false);
    assert.equal(sharedSignal.containsDirectIdentifiers, false);
    assert.throws(() => buildApprovedSharedLearningSignal({
      signalId: 'shared-signal-small',
      tenantId,
      sourceUniverseId: universeId,
      metric: 'retrieval-success-rate',
      cohortSize: 2,
      aggregateValue: 0.5,
      dimensions: {},
      classification: 'INTERNAL',
      evidenceRefs: ['aggregate:small-cohort'],
    }), /at least 5/);

    const targetDevice: SyncAdapterVerificationReceipt = {
      receiptId: 'device-target-1',
      tenantId,
      adapterId: 'android-target',
      kind: 'DEVICE',
      providerName: 'Android integration target',
      platform: 'android',
      deviceStatus: 'TESTED',
      supportedScopes: ['sync:device'],
      jurisdictions: ['US-TX'],
      verifiedAt: now.toISOString(),
      expiresAt: future,
      evidenceRefs: ['test:android-adapter'],
    };
    const targetDecision = await decideUniverseSync({
      ledger: restartedLedger,
      grantId: grant.grantId,
      tenantId,
      userId,
      universeId,
      classification: 'CONFIDENTIAL',
      requestedScopes: ['sync:device'],
      jurisdiction: 'US-TX',
      adapterReceipt: targetDevice,
      now,
    });
    assert.equal(targetDecision.allowed, false);
    assert.match(targetDecision.reasons.join(' '), /VERIFIED device adapter/i);

    const verifiedDevice: SyncAdapterVerificationReceipt = {
      ...targetDevice,
      receiptId: 'device-verified-1',
      deviceStatus: 'VERIFIED',
      evidenceRefs: ['device-receipt:android-physical', 'test:sync-roundtrip'],
    };
    const verifiedDeviceDecision = await decideUniverseSync({
      ledger: restartedLedger,
      grantId: grant.grantId,
      tenantId,
      userId,
      universeId,
      classification: 'CONFIDENTIAL',
      requestedScopes: ['sync:device'],
      jurisdiction: 'US-TX',
      adapterReceipt: verifiedDevice,
      now,
    });
    assert.equal(verifiedDeviceDecision.allowed, true);
    assert.equal(verifiedDeviceDecision.universalDeviceSupportClaim, false);

    const externalTarget: SyncAdapterVerificationReceipt = {
      receiptId: 'external-api-ready-1',
      tenantId,
      adapterId: 'commerce-target',
      kind: 'EXTERNAL',
      providerName: 'Named commerce integration target',
      vendorStatus: 'API_READY',
      supportedScopes: ['sync:external'],
      jurisdictions: ['US-TX'],
      verifiedAt: now.toISOString(),
      expiresAt: future,
      evidenceRefs: ['api-docs:commerce-target'],
    };
    const externalTargetDecision = await decideUniverseSync({
      ledger: restartedLedger,
      grantId: grant.grantId,
      tenantId,
      userId,
      universeId,
      classification: 'CONFIDENTIAL',
      requestedScopes: ['sync:external'],
      jurisdiction: 'US-TX',
      adapterReceipt: externalTarget,
      now,
    });
    assert.equal(externalTargetDecision.allowed, false);
    assert.match(externalTargetDecision.reasons.join(' '), /VERIFIED_PARTNER/);

    const externalVerified: SyncAdapterVerificationReceipt = {
      ...externalTarget,
      receiptId: 'external-verified-1',
      vendorStatus: 'VERIFIED_PARTNER',
      evidenceRefs: ['agreement:partner-receipt', 'api-test:verified-roundtrip'],
    };
    const topSecretExternal = await decideUniverseSync({
      ledger: restartedLedger,
      grantId: grant.grantId,
      tenantId,
      userId,
      universeId,
      classification: 'TOP_SECRET',
      requestedScopes: ['sync:external'],
      jurisdiction: 'US-TX',
      adapterReceipt: externalVerified,
      now,
    });
    assert.equal(topSecretExternal.allowed, false);
    assert.match(topSecretExternal.reasons.join(' '), /TOP_SECRET/);
    assert.equal(topSecretExternal.topSecretExternalRoutingAllowed, false);

    const revoke = await restartedLedger.revoke(grant.grantId, userId, ['user:revocation'], 'user revoked access', now);
    assert.equal(revoke.kind, 'REVOKE');
    assert.equal((await restartedLedger.decide(grant.grantId, userId, universeId, ['memory:read'], now.getTime())).allowed, false);

    const ledgerPath = restartedLedger.filePath;
    const ledgerRaw = await readFile(ledgerPath, 'utf8');
    const lines = ledgerRaw.trim().split('\n');
    const tampered = JSON.parse(lines[0] ?? '{}');
    tampered.evidenceRefs = ['tampered'];
    lines[0] = JSON.stringify(tampered);
    await writeFile(ledgerPath, `${lines.join('\n')}\n`, 'utf8');
    await assert.rejects(() => new UniverseAuthorizationLedger(tempRoot, tenantId, userId).load(), /integrity|hash-chain/);

    console.log('12D-72 universe authorization/consent vault/private RAG contracts: OK');
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

void main();
