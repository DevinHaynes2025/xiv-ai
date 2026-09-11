import assert from 'node:assert/strict';
import { mkdtemp, readFile, appendFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  OperationsEventJournal,
  VerificationReceiptStore,
  type OperationsEvent,
  type VerificationReceipt,
} from './operations-event-journal-view-rebuilder-receipts';
import {
  buildExecutiveRecoverySnapshot,
  buildPlatformSyncTelemetry,
  createOperationsCheckpoint,
  EncryptedOperationsCheckpointStore,
  EncryptedOperationsJournalStore,
  OperationsRecoverySupervisor,
  type TenantOperationsKeyMaterial,
  type TenantOperationsKeyResolver,
} from './encrypted-operations-journal-checkpoint-recovery';

class RotatingResolver implements TenantOperationsKeyResolver {
  activeVersion = 1;
  private readonly keys = new Map<number, TenantOperationsKeyMaterial>([
    [1, { tenantId: 'tenant-a', keyId: 'ops-key-v1', keyVersion: 1, algorithm: 'AES-256-GCM', key: Buffer.alloc(32, 11), evidenceRefs: ['local-key-receipt:v1'] }],
    [2, { tenantId: 'tenant-a', keyId: 'ops-key-v2', keyVersion: 2, algorithm: 'AES-256-GCM', key: Buffer.alloc(32, 22), evidenceRefs: ['local-key-receipt:v2'] }],
  ]);

  resolveKey(tenantId: string, keyVersion?: number): TenantOperationsKeyMaterial {
    assert.equal(tenantId, 'tenant-a');
    const material = this.keys.get(keyVersion ?? this.activeVersion);
    if (!material) throw new Error('missing test key');
    return material;
  }
}

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'xiv-12d69-'));
  try {
    const resolver = new RotatingResolver();
    const events = new OperationsEventJournal('tenant-a');
    const receipts = new VerificationReceiptStore('tenant-a');
    const eventStore = new EncryptedOperationsJournalStore<OperationsEvent>(
      path.join(root, 'journals'), 'tenant-a', 'OPERATIONS_EVENT', 'events.xivenc.jsonl', resolver,
    );
    const receiptStore = new EncryptedOperationsJournalStore<VerificationReceipt>(
      path.join(root, 'journals'), 'tenant-a', 'VERIFICATION_RECEIPT', 'receipts.xivenc.jsonl', resolver,
    );
    const checkpointStore = new EncryptedOperationsCheckpointStore(path.join(root, 'checkpoints'), 'tenant-a', resolver);

    const deviceReceipt = receipts.append({
      tenantId: 'tenant-a', kind: 'DEVICE', subjectId: 'windows-laptop-01', status: 'VERIFIED',
      evidenceRefs: ['device-test-receipt:windows-laptop-01'], issuedAt: '2026-09-11T10:00:00.000Z',
    });
    const usage = events.append({
      tenantId: 'tenant-a', kind: 'USAGE', occurredAt: '2026-09-11T10:01:00.000Z', classification: 'INTERNAL',
      evidenceRefs: ['analytics-receipt:1'], payload: { metric: 'VIEW', userHash: 'u1', sessionId: 's1', feature: 'executive-control', count: 1 },
    });
    await receiptStore.append(deviceReceipt);
    await eventStore.append(usage);

    const initialViewTime = Date.parse('2026-09-11T10:02:00.000Z');
    const checkpoint = createOperationsCheckpoint({ tenantId: 'tenant-a', events: events.list(), receipts: receipts.list(), asOfMs: initialViewTime });
    const checkpointEnvelope = await checkpointStore.save(checkpoint);
    assert.equal(checkpointEnvelope.keyVersion, 1);

    const rawJournal = await readFile(path.join(root, 'journals', 'tenant-a', 'events.xivenc.jsonl'), 'utf8');
    assert.equal(rawJournal.includes('executive-control'), false, 'encrypted journal must not expose event payload text');

    resolver.activeVersion = 2;
    const syncSuccess = events.append({
      tenantId: 'tenant-a', kind: 'SYNC', occurredAt: '2026-09-11T10:03:00.000Z', classification: 'INTERNAL',
      evidenceRefs: ['sync-receipt:1'], payload: { platform: 'WINDOWS', deviceSubjectId: 'windows-laptop-01', outcome: 'SUCCESS', latencyMs: 42 },
    });
    const syncError = events.append({
      tenantId: 'tenant-a', kind: 'SYNC', occurredAt: '2026-09-11T10:04:00.000Z', classification: 'INTERNAL',
      evidenceRefs: ['sync-receipt:2'], payload: { platform: 'WINDOWS', deviceSubjectId: 'windows-laptop-01', outcome: 'ERROR', latencyMs: 120 },
    });
    await eventStore.append(syncSuccess);
    await eventStore.append(syncError);

    const eventScan = await eventStore.scan();
    assert.deepEqual(eventScan.keyVersionsObserved, [1, 2], 'replay must resolve every envelope by its recorded key version');
    assert.equal(eventScan.integrityVerified, true);

    const telemetry = buildPlatformSyncTelemetry(events.list(), receipts.list(), Date.parse('2026-09-11T10:05:00.000Z'));
    assert.equal(telemetry.WINDOWS.success, 1);
    assert.equal(telemetry.WINDOWS.error, 1);
    assert.equal(telemetry.WINDOWS.p50LatencyMs, 42);
    assert.equal(telemetry.WINDOWS.p95LatencyMs, 120);
    assert.equal(telemetry.WINDOWS.universalSupportClaim, false);

    const supervisor = new OperationsRecoverySupervisor('tenant-a', eventStore, receiptStore, checkpointStore);
    const cleanRecovery = await supervisor.recover({ asOfMs: Date.parse('2026-09-11T10:05:00.000Z') });
    assert.equal(cleanRecovery.receipt.status, 'HEALTHY');
    assert.equal(cleanRecovery.receipt.checkpointVerified, true);
    assert.equal(cleanRecovery.receipt.eventTailReplayed, 2);
    assert.equal(cleanRecovery.receipt.receiptTailReplayed, 0);
    assert.ok(cleanRecovery.view);

    const executive = buildExecutiveRecoverySnapshot(cleanRecovery.view!, cleanRecovery.receipt, cleanRecovery.syncTelemetry);
    assert.equal(executive.authority.canWrite, false);
    assert.equal(executive.authority.canMoveMoney, false);
    assert.equal(executive.authority.canSignContracts, false);
    assert.equal(executive.grounding.autonomousCounterattackAllowed, false);
    assert.equal(executive.grounding.universalDeviceSupportClaim, false);

    const forbidden = { ...syncError, sequence: 4, classification: 'TOP_SECRET' as const };
    await assert.rejects(() => eventStore.append(forbidden), /TOP_SECRET/);

    const eventPath = path.join(root, 'journals', 'tenant-a', 'events.xivenc.jsonl');
    await appendFile(eventPath, '{"corrupted":true}\n', 'utf8');
    const degradedRecovery = await supervisor.recover({
      asOfMs: Date.parse('2026-09-11T10:06:00.000Z'), quarantineCorruptedTails: true,
    });
    assert.equal(degradedRecovery.receipt.status, 'DEGRADED');
    assert.equal(degradedRecovery.receipt.eventCorruptTailLines, 1);
    assert.equal(degradedRecovery.quarantineReceipts.length, 1);
    assert.equal(degradedRecovery.quarantineReceipts[0].originalJournalModified, false);
    const originalStillCorrupt = await readFile(eventPath, 'utf8');
    assert.equal(originalStillCorrupt.includes('{"corrupted":true}'), true, 'recovery must not silently rewrite the original journal');

    console.log('12D-69 encrypted operations journal/checkpoint/recovery contracts: OK');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
