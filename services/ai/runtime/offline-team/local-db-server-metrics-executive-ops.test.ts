import { LocalDatabaseServerRuntime } from './local-database-server-runtime';
import { composeOperationsMetrics } from './metrics-dashboard';
import { buildExecutiveOperationsRoom } from './executive-operations-room';
import { ReplicationAdapterRegistry } from './replication-adapter-registry';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const runtime = new LocalDatabaseServerRuntime();
runtime.registerStore({ storeId: 'primary', tenantId: 'xiv', engine: 'SQLITE', plane: 'LOCAL', status: 'VERIFIED', encryptionAtRest: true, receiptRef: 'receipt:db' });
runtime.recordReceipt({ serviceId: 'api-local', kind: 'API', host: '127.0.0.1', port: 8787, status: 'VERIFIED', checkedAt: '2026-09-11T00:00:00Z', evidenceRef: 'receipt:api' });
const readiness = runtime.readiness('xiv');
assert(readiness.ready, 'runtime should be ready with verified local store and API receipt');

const metrics = composeOperationsMetrics({
  tenantId: 'xiv',
  measuredAt: '2026-09-11T00:00:00Z',
  usage: { views: 11, uniqueUsers: 3, sessions: 4, featureUses: 7 },
  finance: { approvedEntries: 2, pendingEntries: 1, revenueCents: 10000, expenseCents: 2500, currency: 'USD' },
  work: { openTasks: 5, blockedTasks: 1, completedTasks: 8, meetingsHeld: 2, unresolvedDissent: 1 },
  runtimeReady: readiness.ready,
  runtimeBlockers: readiness.blockers,
});
assert(metrics.countSource === 'MEASURED', 'metrics must be marked measured');
const room = buildExecutiveOperationsRoom(metrics);
assert(room.requiresHumanReview, 'pending finance/tasks/dissent should require human review');

const replication = new ReplicationAdapterRegistry();
replication.register({ adapterId: 'future-cloud', provider: 'example', relationship: 'TARGET', status: 'DISABLED', allowedClassifications: ['PUBLIC'] });
assert(!replication.canReplicate('future-cloud', 'PUBLIC'), 'target-only vendor must not replicate');
let topSecretRejected = false;
try {
  replication.register({ adapterId: 'bad', provider: 'example', relationship: 'VERIFIED_PARTNER', status: 'VERIFIED', receiptRef: 'receipt:partner', allowedClassifications: ['TOP_SECRET'] });
} catch { topSecretRejected = true; }
assert(topSecretRejected, 'TOP_SECRET cloud replication must be rejected');

console.log('12D-60 local db/server metrics executive ops contracts: OK');
