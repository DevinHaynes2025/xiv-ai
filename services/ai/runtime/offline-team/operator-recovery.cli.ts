import { SharedHostLeaseStore } from './shared-host-lease-store';
import { OfflineStoryQueue } from './offline-story-queue';

/**
 * 12D-100 operator recovery CLI. One explicit action per invocation, operator-invoked,
 * non-daemonic, evidence-required. It never claims a provider settlement, never fakes a
 * review, and never runs automatically. Owner secrets are never needed or accepted here.
 */
function arg(name: string): string {
  const flag = `--${name}=`;
  const raw = process.argv.find(a => a.startsWith(flag));
  if (!raw) throw new Error(`missing required argument --${name}`);
  return raw.slice(flag.length);
}
const hex = (v: string, n: number): boolean => new RegExp(`^[a-f0-9]{${n}}$`).test(v);

const action = arg('action');
const queuePath = arg('queue');
const ledgerPath = arg('host-ledger');
const hostId = arg('host-id');
const tenantId = arg('tenant');
if (!hex(hostId, 32)) throw new Error('host-id must be 32 hex characters');
if (!/^[A-Za-z0-9_.:-]{1,128}$/.test(tenantId)) throw new Error('tenant required');

const queue = new OfflineStoryQueue(queuePath);
const host = new SharedHostLeaseStore(ledgerPath, hostId);
try {
  if (action === 'snapshot') {
    process.stdout.write(`${JSON.stringify({
      schemaVersion: 1, action, tenantId,
      queue: { ...queue.summary(tenantId), heldLease: queue.inspectHeldLease() },
      host: host.snapshot(tenantId),
      automaticRecovery: false, operatorEvidenceRequired: true, humanDecision: 'REQUIRED',
    }, null, 2)}\n`);
  } else if (action === 'void-host-lease') {
    const leaseId = arg('lease-id'); const evidenceRef = arg('evidence');
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, action, result: host.voidLeaseByOperator(leaseId, evidenceRef) }, null, 2)}\n`);
  } else if (action === 'confirm-host-stop') {
    const leaseId = arg('lease-id'); const evidenceRef = arg('evidence');
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, action, result: host.confirmStoppedByOperator(leaseId, evidenceRef) }, null, 2)}\n`);
  } else if (action === 'release-host-lease') {
    const leaseId = arg('lease-id'); const evidenceRef = arg('evidence');
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, action, result: host.releaseByOperator(leaseId, evidenceRef) }, null, 2)}\n`);
  } else if (action === 'void-queue-lease') {
    const held = queue.inspectHeldLease();
    if (!held) throw new Error('no held queue lease to void');
    const outcome = arg('outcome');
    if (outcome !== 'READY' && outcome !== 'FAILED') throw new Error('outcome must be READY or FAILED');
    const evidenceRef = arg('evidence');
    queue.voidLease(held, outcome, evidenceRef);
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, action, voided: { ...held },
      storyStateAfter: queue.page(tenantId, 0, 100).find(r => r.id === held.storyId)?.state ?? null,
      operatorAttestation: outcome === 'READY' ? 'operator attests no provider side-effect is outstanding' : 'story retired as FAILED without an output hash' }, null, 2)}\n`);
  } else {
    throw new Error('unknown action; use snapshot | void-host-lease | confirm-host-stop | release-host-lease | void-queue-lease');
  }
} finally { queue.close(); host.close(); }