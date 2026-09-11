import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  materializeOperationsViews,
  PersistentOperationsViewStore,
  type MeasuredOperationsEvent,
} from './persistent-operations-views';
import {
  calculateVerifiedDeviceCoverage,
  decideExternalReplication,
  isVerifiedDevice,
  isVerifiedPartner,
  type DeviceVerificationRecord,
  type VendorVerificationRecord,
} from './vendor-device-verification-matrix';
import {
  buildExecutiveOperationsView,
  handleExecutiveControlRequest,
} from './executive-control-readonly-api';

const now = new Date('2026-09-11T08:30:00.000Z');
const tenantId = 'xiv-test-tenant';
const base = (eventId: string, kind: MeasuredOperationsEvent['kind'], payload: Record<string, unknown>): MeasuredOperationsEvent => ({
  tenantId,
  eventId,
  kind,
  measuredAt: now.toISOString(),
  classification: 'INTERNAL',
  evidenceRefs: [`evidence:${eventId}`],
  measurement: { measured: true, source: 'contract-test', receiptId: `receipt:${eventId}` },
  payload,
});

const events: MeasuredOperationsEvent[] = [
  base('view-1', 'USAGE', { usageType: 'VIEW', surface: 'home', actorHash: 'actor-a', sessionId: 'session-a' }),
  base('view-2', 'USAGE', { usageType: 'VIEW', surface: 'home', actorHash: 'actor-b', sessionId: 'session-b' }),
  base('feature-1', 'USAGE', { usageType: 'FEATURE_USE', feature: 'executive-room', actorHash: 'actor-a', sessionId: 'session-a' }),
  base('book-approved', 'BOOKKEEPING', { status: 'APPROVED', currency: 'USD', amountMinor: 12500, humanApprovalReceiptId: 'human:finance-1' }),
  base('book-pending', 'BOOKKEEPING', { status: 'PENDING_APPROVAL', currency: 'USD', amountMinor: 7000 }),
  base('task-blocked', 'TASK', { taskId: 'task-db-recovery', status: 'BLOCKED' }),
  base('meeting-1', 'MEETING', { activeRoles: ['COO', 'DEVOPS', 'FINANCE'], unresolvedDissentCount: 1, followUpTaskIds: ['task-db-recovery'], minutesEvidenceRef: 'minutes:meeting-1' }),
  base('runtime-db', 'RUNTIME', { component: 'local-database', status: 'HEALTHY' }),
];

async function run(): Promise<void> {
  const snapshot = materializeOperationsViews(tenantId, events, now.toISOString());
  assert.equal(snapshot.usage.views, 2);
  assert.equal(snapshot.usage.uniqueUsers, 2);
  assert.equal(snapshot.usage.sessions, 2);
  assert.equal(snapshot.usage.featureUsage['executive-room'], 1);
  assert.equal(snapshot.bookkeeping.approvedEntries, 1);
  assert.equal(snapshot.bookkeeping.pendingApprovalEntries, 1);
  assert.equal(snapshot.bookkeeping.approvedAmountMinorByCurrency.USD, 12500);
  assert.equal(snapshot.tasks.blocked, 1);
  assert.equal(snapshot.meetings.unresolvedDissent, 1);
  assert.equal(snapshot.runtime['local-database'].status, 'HEALTHY');

  assert.throws(() => materializeOperationsViews(tenantId, [{
    ...base('top-secret', 'USAGE', { usageType: 'VIEW', surface: 'vault' }),
    classification: 'TOP_SECRET',
  }]), /TOP_SECRET/);

  assert.throws(() => materializeOperationsViews(tenantId, [{
    ...base('bad-approval', 'BOOKKEEPING', { status: 'APPROVED', currency: 'USD', amountMinor: 1 }),
  }]), /humanApprovalReceiptId/);

  assert.throws(() => materializeOperationsViews(tenantId, [{
    ...base('too-many-roles', 'MEETING', { activeRoles: ['1','2','3','4','5','6','7','8','9'], unresolvedDissentCount: 0, minutesEvidenceRef: 'm' }),
  }]), /2-8/);

  const dir = await mkdtemp(join(tmpdir(), 'xiv-12d67-'));
  try {
    const store = new PersistentOperationsViewStore(dir);
    const receipt = await store.save(snapshot);
    const restored = await store.load(tenantId);
    assert.deepEqual(restored, snapshot);
    const envelope = JSON.parse(await readFile(receipt.path, 'utf8'));
    envelope.snapshot.usage.views = 999999;
    await writeFile(receipt.path, JSON.stringify(envelope));
    await assert.rejects(() => store.load(tenantId), /integrity check failed/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }

  const targetVendor: VendorVerificationRecord = {
    vendorId: 'vendor-target', vendorName: 'Example Vendor', status: 'TARGET', evidenceRefs: [],
  };
  const apiVendor: VendorVerificationRecord = {
    vendorId: 'vendor-api', vendorName: 'API Vendor', status: 'API_READY', evidenceRefs: ['api-doc'], apiReceiptId: 'api:1',
  };
  const verifiedVendor: VendorVerificationRecord = {
    vendorId: 'vendor-verified', vendorName: 'Verified Vendor', status: 'VERIFIED_PARTNER', evidenceRefs: ['partner-evidence'],
    apiReceiptId: 'api:verified', partnerReceiptId: 'partner:verified', verifiedAt: '2026-09-10T00:00:00.000Z', expiresAt: '2027-09-10T00:00:00.000Z',
  };
  assert.equal(isVerifiedPartner(targetVendor, now), false);
  assert.equal(isVerifiedPartner(apiVendor, now), false);
  assert.equal(isVerifiedPartner(verifiedVendor, now), true);
  assert.equal(decideExternalReplication({ classification: 'TOP_SECRET', vendor: verifiedVendor, localHealth: 'HEALTHY', now }).eligible, false);
  assert.equal(decideExternalReplication({ classification: 'CONFIDENTIAL', vendor: verifiedVendor, localHealth: 'HEALTHY', now }).eligible, true);

  const devices: DeviceVerificationRecord[] = [
    { deviceId: 'android-target', platform: 'Android', deviceFamily: 'phone', status: 'TARGET', evidenceRefs: [] },
    { deviceId: 'win-tested', platform: 'Windows', deviceFamily: 'desktop', status: 'TESTED', evidenceRefs: ['test-evidence'], adapterReceiptId: 'adapter:win', testReceiptId: 'test:win' },
    { deviceId: 'win-verified', platform: 'Windows', deviceFamily: 'desktop', status: 'VERIFIED', evidenceRefs: ['verify-evidence'], adapterReceiptId: 'adapter:win2', testReceiptId: 'test:win2', verificationReceiptId: 'verify:win2', verifiedAt: '2026-09-10T00:00:00.000Z', expiresAt: '2027-09-10T00:00:00.000Z' },
  ];
  assert.equal(isVerifiedDevice(devices[1], now), false);
  assert.equal(isVerifiedDevice(devices[2], now), true);
  const coverage = calculateVerifiedDeviceCoverage(devices, now);
  assert.equal(coverage.targetDevices, 3);
  assert.equal(coverage.verifiedDevices, 1);
  assert.equal(coverage.universalSupportClaim, false);

  const executiveView = buildExecutiveOperationsView({ snapshot, vendors: [targetVendor, apiVendor, verifiedVendor], devices, now });
  assert.equal(executiveView.finance.pendingApprovals, 1);
  assert.equal(executiveView.finance.canMoveMoney, false);
  assert.equal(executiveView.operations.unresolvedMeetingDissent, 1);
  assert.equal(executiveView.vendors.verifiedPartners, 1);
  assert.equal(executiveView.replication.eligibleVendors, 1);

  const lookup = async (id: string) => id === tenantId ? executiveView : undefined;
  const health = await handleExecutiveControlRequest({ method: 'GET', url: '/health', host: '127.0.0.1:7412', lookup });
  assert.equal(health.statusCode, 200);
  const mutation = await handleExecutiveControlRequest({ method: 'POST', url: `/v1/tenants/${tenantId}/operations`, host: '127.0.0.1:7412', lookup });
  assert.equal(mutation.statusCode, 405);
  const remote = await handleExecutiveControlRequest({ method: 'GET', url: '/health', host: 'example.com', lookup });
  assert.equal(remote.statusCode, 403);
  const viewResponse = await handleExecutiveControlRequest({ method: 'GET', url: `/v1/tenants/${tenantId}/operations`, host: 'localhost:7412', lookup });
  assert.equal(viewResponse.statusCode, 200);
  assert.equal(JSON.parse(viewResponse.body).deviceCoverage.universalSupportClaim, false);

  console.log('12D-67 persistent operations/executive control/vendor-device contracts: OK');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
