import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { EncryptedKnowledgeVault, mayEnterOrdinaryEmbedding, mayEnterOrdinaryRag } from './encrypted-knowledge-vault';
import { EmbeddingVerificationReceiptStore } from './embedding-verification-receipt-store';
import { RetrievalSyncTelemetry } from './retrieval-sync-telemetry';
import { SyncConflictReviewQueue, mayExternalizeConflict } from './sync-conflict-review-queue';
import { assertLoopbackHost, dispatchLocalRagRequest } from './local-rag-readonly-service';

async function main(): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xiv-12d64-'));
  try {
    const tenantKey = randomBytes(32);
    const vault = new EncryptedKnowledgeVault({
      ordinaryRoot: path.join(root, 'ordinary'),
      topSecretRoot: path.join(root, 'restricted'),
      keyResolver: {
        resolveKey(tenantId: string) {
          if (tenantId !== 'tenant-a') throw new Error('unknown tenant');
          return { keyId: 'tenant-a-key-v1', key: tenantKey };
        },
      },
    });

    const saved = await vault.saveSnapshot({ tenantId: 'tenant-a', snapshotId: 'snap-1', securityClass: 'ORDINARY', payload: { approved: true, value: 42 } });
    assert.ok(saved.path.includes('ordinary'));
    assert.deepEqual(await vault.loadSnapshot({ tenantId: 'tenant-a', snapshotId: 'snap-1', securityClass: 'ORDINARY' }), { approved: true, value: 42 });

    const restricted = await vault.saveSnapshot({ tenantId: 'tenant-a', snapshotId: 'secret-1', securityClass: 'TOP_SECRET', payload: { secret: 'redacted-in-normal-rag' } });
    assert.ok(restricted.path.includes('restricted'));
    assert.equal(mayEnterOrdinaryRag('TOP_SECRET'), false);
    assert.equal(mayEnterOrdinaryEmbedding('TOP_SECRET'), false);

    const envelope = JSON.parse(await fs.readFile(saved.path, 'utf8'));
    envelope.ciphertext = `${envelope.ciphertext.slice(0, -4)}AAAA`;
    await fs.writeFile(saved.path, JSON.stringify(envelope));
    await assert.rejects(() => vault.loadSnapshot({ tenantId: 'tenant-a', snapshotId: 'snap-1', securityClass: 'ORDINARY' }));

    const receiptStore = new EmbeddingVerificationReceiptStore(path.join(root, 'receipts', 'embedding.json'));
    await receiptStore.upsert({ adapterId: 'local-embed', modelId: 'model-a', modelDigest: 'sha256:abc', runtimeScope: 'LOCAL', status: 'API_READY', evidenceRefs: ['config:declared'] });
    assert.equal((await receiptStore.select('local-embed')).mode, 'LEXICAL_FALLBACK');
    await receiptStore.upsert({ adapterId: 'local-embed', modelId: 'model-a', modelDigest: 'sha256:abc', runtimeScope: 'LOCAL', status: 'VERIFIED', evidenceRefs: ['receipt:test'], verifiedAt: new Date(Date.now() - 1000).toISOString(), validUntil: new Date(Date.now() + 60000).toISOString() });
    assert.equal((await receiptStore.select('local-embed')).mode, 'VERIFIED_EMBEDDING');

    const telemetry = new RetrievalSyncTelemetry();
    const provider = {
      async query() {
        return { strategy: 'LEXICAL_FALLBACK' as const, results: [{ id: 'r1', text: 'approved result', score: 1, securityClass: 'ORDINARY' as const, evidenceRefs: ['source:1'], provenance: { sourceId: 'source:1', sourceType: 'CASE_STUDY' } }] };
      },
    };
    assert.doesNotThrow(() => assertLoopbackHost('127.0.0.1'));
    assert.throws(() => assertLoopbackHost('0.0.0.0'));
    const queryResponse = await dispatchLocalRagRequest({ provider, telemetry }, { method: 'POST', path: '/v1/rag/query', body: { tenantId: 'tenant-a', query: 'private prompt text', limit: 5 } });
    assert.equal(queryResponse.status, 200);
    assert.equal((await dispatchLocalRagRequest({ provider, telemetry }, { method: 'DELETE', path: '/v1/rag/query' })).status, 405);
    const snapshotText = JSON.stringify(telemetry.snapshot());
    assert.equal(snapshotText.includes('private prompt text'), false);
    assert.equal(telemetry.snapshot().retrieval.lexicalFallbacks, 1);

    const conflicts = new SyncConflictReviewQueue();
    const conflict = conflicts.enqueue({ id: 'c1', tenantId: 'tenant-a', platform: 'ANDROID', localVersion: '2', remoteVersion: '3', securityClass: 'TOP_SECRET', evidenceRefs: ['journal:1'] });
    assert.equal(mayExternalizeConflict(conflict), false);
    assert.throws(() => conflicts.resolve({ id: 'c1', reviewer: { kind: 'AGENT', id: 'agent-1' }, resolution: 'RESOLVED_ACCEPT_LOCAL', rationale: 'agent choice', evidenceRefs: ['agent:1'] }));
    const resolved = conflicts.resolve({ id: 'c1', reviewer: { kind: 'HUMAN', id: 'reviewer-1' }, resolution: 'RESOLVED_MANUAL', rationale: 'reviewed evidence', evidenceRefs: ['review:1'] });
    assert.equal(resolved.status, 'RESOLVED_MANUAL');

    console.log('12D-64 encrypted knowledge vault/local RAG/telemetry contracts: OK');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
