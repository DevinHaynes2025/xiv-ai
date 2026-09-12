import { SharedHostLeaseStore } from './shared-host-lease-store';
import { OfflineStoryQueue } from './offline-story-queue';
import { SharedQueueAdmission } from './shared-queue-admission';
import { runSupervisedLocalStory } from './supervised-local-worker';

/**
 * 12D-99 one-shot CLI. Explicit, operator-invoked, non-interactive, non-daemonic.
 * Every argument must name a resource the operator provisioned in advance; nothing
 * is created, started, pulled, or pushed here. The single model request is loopback-only.
 */
function arg(name: string): string {
  const flag = `--${name}=`;
  const raw = process.argv.find(a => a.startsWith(flag));
  if (!raw) throw new Error(`missing required argument --${name}`);
  return raw.slice(flag.length);
}
const hex = (v: string, n: number): boolean => new RegExp(`^[a-f0-9]{${n}}$`).test(v);

const queuePath = arg('queue');
const ledgerPath = arg('host-ledger');
const hostId = arg('host-id');
const tenantId = arg('tenant');
const instanceId = arg('instance');
const sourceCommit = arg('source-commit');
const approvedPlanSha256 = arg('plan-sha');
const roleId = arg('role');
const presenceEvidenceRef = arg('presence-ref');
if (!hex(hostId, 32)) throw new Error('host-id must be 32 hex characters');
if (!hex(sourceCommit, 40) || !hex(approvedPlanSha256, 64)) throw new Error('40/64-hex revision identifiers required');

const queue = new OfflineStoryQueue(queuePath);
const host = new SharedHostLeaseStore(ledgerPath, hostId);
try {
  const admission = new SharedQueueAdmission(queue, host, {
    tenantId, holderInstanceId: instanceId, sourceCommit, approvedPlanSha256,
    providerId: 'ollama', modelId: 'qwen2.5-coder:7b', presenceEvidenceRef,
  });
  const run = await runSupervisedLocalStory(admission, roleId, { tenantId });
  process.stdout.write(`${JSON.stringify(run, null, 2)}\n`);
  if (run.status === 'ABORTED_UNCONFIRMED' || run.status === 'FAILED_PROVIDER_SETTLED') process.exitCode = 1;
  if (run.status === 'NO_ELIGIBLE_STORY_OR_QUEUE_BUSY' || run.status === 'HOST_BLOCKED') process.exitCode = 2;
} finally { queue.close(); host.close(); }