import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MultiTenantLocalDatabaseService } from './multi-tenant-local-database-service';
import { buildBookkeepingMaterializedView, buildUsageMaterializedView } from './operations-materialized-views';
import { OperationsMeetingScheduler } from './operations-meeting-scheduler';
import { buildServerCapacityHealthReceipt } from './server-capacity-health';
import { ReplicationAdapterRegistry } from './replication-adapter-registry';
import { evaluateOperationalReplication } from './operational-replication-gate';
import type { BookkeepingEntry } from './bookkeeping-ops';
import type { UsageEvent } from './usage-analytics-ledger';

async function run() {
  const root = await mkdtemp(join(tmpdir(), 'xiv-12d66-'));
  try {
    const keyResolver = (tenantId: string) => createHash('sha256').update(`test-only:${tenantId}`).digest();
    const database = new MultiTenantLocalDatabaseService(root, keyResolver);

    await database.migrate('tenant-a', [
      {
        version: 1,
        name: 'create-operational-tables',
        apply(snapshot) {
          return { ...snapshot, tables: { ...snapshot.tables, usage: [], bookkeeping: [], meetings: [] } };
        },
      },
    ]);
    await database.upsert('tenant-a', 'usage', { rowId: 'event-1', kind: 'VIEW', secretMarker: 'encrypted-at-rest-marker' });
    const loaded = await database.load('tenant-a');
    assert.equal(loaded.schemaVersion, 1);
    assert.equal(loaded.tables.usage.length, 1);
    assert.equal((await database.load('tenant-b')).tables.usage, undefined);

    const raw = await readFile(join(root, 'tenant-a.xivdb'), 'utf8');
    assert.equal(raw.includes('encrypted-at-rest-marker'), false);
    const recovery = await database.recoveryReceipt('tenant-a', 'local-file-readback:test');
    assert.equal(recovery.integrityVerified, true);
    assert.equal(recovery.rowCount, 1);

    const usageEvents: UsageEvent[] = [
      { eventId: 'u1', tenantId: 'tenant-a', actorHash: 'actor-1', type: 'VIEW', occurredAt: new Date().toISOString(), surface: 'home' },
      { eventId: 'u2', tenantId: 'tenant-a', actorHash: 'actor-2', type: 'VIEW', occurredAt: new Date().toISOString(), surface: 'home' },
      { eventId: 'u3', tenantId: 'tenant-a', actorHash: 'actor-1', type: 'SESSION_START', occurredAt: new Date().toISOString() },
      { eventId: 'u4', tenantId: 'tenant-a', actorHash: 'actor-1', type: 'FEATURE_USE', occurredAt: new Date().toISOString(), feature: 'rag-search' },
      { eventId: 'u5', tenantId: 'tenant-b', actorHash: 'other', type: 'VIEW', occurredAt: new Date().toISOString(), surface: 'home' },
    ];
    const usage = buildUsageMaterializedView('tenant-a', usageEvents);
    assert.equal(usage.views, 2);
    assert.equal(usage.uniqueUsers, 2);
    assert.equal(usage.sessions, 1);
    assert.equal(usage.featureUses, 1);
    assert.equal(usage.viewsBySurface.home, 2);

    const bookkeepingEntries: BookkeepingEntry[] = [
      { entryId: 'b1', tenantId: 'tenant-a', account: 'software-expense', amountCents: 2500, currency: 'USD', side: 'DEBIT', occurredAt: new Date().toISOString(), evidenceRef: 'receipt:1', approved: true },
      { entryId: 'b2', tenantId: 'tenant-a', account: 'software-expense', amountCents: 900, currency: 'USD', side: 'DEBIT', occurredAt: new Date().toISOString(), evidenceRef: 'receipt:2', approved: false },
    ];
    const books = buildBookkeepingMaterializedView('tenant-a', bookkeepingEntries);
    assert.equal(books.approvedEntries, 1);
    assert.equal(books.pendingApprovalEntries, 1);
    assert.equal(books.approvedDebitCents, 2500);

    const meetings = new OperationsMeetingScheduler();
    meetings.schedule({
      meetingId: 'm1',
      tenantId: 'tenant-a',
      objective: 'Review offline database health and next work',
      scheduledFor: new Date(Date.now() + 60_000).toISOString(),
      ownerRole: 'VIRTUAL_COO',
      roles: ['VIRTUAL_COO', 'ENGINEERING'],
      evidenceRefs: ['db-recovery:1'],
      agenda: ['Database recovery receipt', 'Capacity blockers'],
    });
    meetings.recordOutcome({
      meetingId: 'm1',
      tenantId: 'tenant-a',
      heldAt: new Date().toISOString(),
      minutes: ['Database receipt reviewed; production change remains gated.'],
      decisions: [
        { decisionId: 'd1', summary: 'Change production replication policy', ownerRole: 'ENGINEERING', evidenceRefs: ['db-recovery:1'], productionImpact: true, humanApproved: false },
      ],
      dissent: ['Engineering requested more recovery samples before replication.'],
      followUpTaskIds: ['task-66-1'],
    });
    assert.equal(meetings.actionableDecisions('m1').length, 0);
    assert.equal(meetings.pendingHumanApprovals('m1').length, 1);
    assert.equal(meetings.receipt('m1').dissentCount, 1);

    const health = buildServerCapacityHealthReceipt('local-db-1', [
      { probeId: 'p1', nodeId: 'local-db-1', measuredAt: new Date().toISOString(), reachable: true, latencyMs: 12, storageUsedBytes: 50, storageCapacityBytes: 100, queueDepth: 1, evidenceRef: 'probe:p1' },
      { probeId: 'p2', nodeId: 'local-db-1', measuredAt: new Date().toISOString(), reachable: false, evidenceRef: 'probe:p2' },
    ], { maxP95LatencyMs: 100, maxStorageUtilization: 0.9, maxQueueDepth: 20 });
    assert.equal(health.state, 'DEGRADED');
    assert.equal(buildServerCapacityHealthReceipt('missing-node', [], { maxP95LatencyMs: 100, maxStorageUtilization: 0.9, maxQueueDepth: 20 }).state, 'UNVERIFIED');

    const adapters = new ReplicationAdapterRegistry();
    adapters.register({ adapterId: 'cloud-db', provider: 'example-provider', relationship: 'API_READY', status: 'CONFIGURED', allowedClassifications: ['INTERNAL'] });
    const blocked = evaluateOperationalReplication(adapters, {
      tenantId: 'tenant-a', adapterId: 'cloud-db', classification: 'INTERNAL', recoveryReceipt: recovery, evidenceRefs: ['review:1'],
    });
    assert.equal(blocked.allowed, false);

    adapters.register({ adapterId: 'cloud-db', provider: 'example-provider', relationship: 'VERIFIED_PARTNER', status: 'VERIFIED', receiptRef: 'partner-receipt:1', allowedClassifications: ['INTERNAL'] });
    const allowed = evaluateOperationalReplication(adapters, {
      tenantId: 'tenant-a', adapterId: 'cloud-db', classification: 'INTERNAL', recoveryReceipt: recovery, evidenceRefs: ['review:2'],
    });
    assert.equal(allowed.allowed, true);
    assert.equal(evaluateOperationalReplication(adapters, {
      tenantId: 'tenant-a', adapterId: 'cloud-db', classification: 'TOP_SECRET', recoveryReceipt: recovery, evidenceRefs: ['review:3'],
    }).allowed, false);

    console.log('12D-66 multi-tenant DB/materialized views/operations meetings contracts: OK');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
