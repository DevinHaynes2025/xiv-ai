import { OfflineStoryQueue, type StoryLease } from './offline-story-queue';
import { SharedHostLeaseStore, type HostLeaseHandle } from './shared-host-lease-store';

export interface SharedQueueTicket { storyLease: Readonly<StoryLease>; hostHandle: Readonly<HostLeaseHandle> }
export interface SharedQueueContext {
  tenantId: string; holderInstanceId: string; sourceCommit: string; approvedPlanSha256: string;
  presenceEvidenceRef: string; providerId: 'ollama'; modelId: string;
}
const sha = (v: unknown, n: number): v is string => typeof v === 'string' && v.length === n && new RegExp(`^[a-f0-9]{${n}}$`).test(v);
const id = (v: unknown): v is string => typeof v === 'string' && v === v.trim() && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
/**
 * One cooperative admission adapter, NOT a daemon or model executor.
 * Runs behind a trusted controller. Context/presence references are not authenticated here.
 * Two DBs are intentionally NOT called one atomic transaction: uncertain partial failure holds
 * a lease for operator recovery. No auto-retry/steal/deletion or inferred provider settlement.
 */
export class SharedQueueAdmission {
  readonly #context: Readonly<SharedQueueContext>;
  constructor(readonly queue: OfflineStoryQueue, readonly host: SharedHostLeaseStore, context: SharedQueueContext) {
    if (!context || ![context.tenantId, context.holderInstanceId].every(id)
      || !sha(context.sourceCommit, 40) || !sha(context.approvedPlanSha256, 64)
      || context.providerId !== 'ollama' || !id(context.modelId) || /cloud/i.test(context.modelId)
      || typeof context.presenceEvidenceRef !== 'string' || !context.presenceEvidenceRef.trim()
      || context.presenceEvidenceRef.length > 256) throw new Error('explicit local controller context required');
    this.#context = Object.freeze({ ...context });
  }
  claimNext(roleId: string) {
    const c = this.#context;
    const storyLease = this.queue.claimNext(c.tenantId, roleId, c.holderInstanceId, 120_000);
    if (!storyLease) return Object.freeze({ status: 'NO_ELIGIBLE_STORY_OR_QUEUE_BUSY' as const, ticket: null, modelCallsMade: 0 });
    let story;
    try {
      story = this.queue.inspectLease(storyLease);
      if (story.sourceRevision !== c.sourceCommit || story.masterPlanSha256 !== c.approvedPlanSha256
        || story.tenantId !== c.tenantId || story.kind !== 'PRODUCT_STORY' || story.securityClass !== 'ORDINARY') throw new Error('story revision or scope mismatch');
    } catch (error) { this.queue.returnUnstarted(storyLease); throw error; }
    // If the host operation throws after an uncertain commit, HOLD the queue lease. Never
    // assume no reservation exists just because an I/O operation did not return success.
    const reservation = this.host.acquire({ tenantId: c.tenantId, holderInstanceId: c.holderInstanceId,
      lane: 'OFFLINE_SHIFT', workId: `queue:${storyLease.token}`,  sourceCommit: c.sourceCommit, providerId: c.providerId,
      modelId: c.modelId, presenceEvidenceRef: c.presenceEvidenceRef });
    if (reservation.status === 'BLOCKED') {
      this.queue.returnUnstarted(storyLease); // No provider call is possible in this adapter.
      return Object.freeze({ status: 'HOST_BLOCKED' as const, decision: reservation.decision,
        operatorReviewRequired: reservation.operatorReviewRequired, ticket: null, modelCallsMade: 0 });
    }
    return Object.freeze({ status: 'ADMITTED_NOT_STARTED' as const,
      ticket: Object.freeze({ storyLease, hostHandle: reservation.handle }), story,
      modelCallsMade: 0, executionAuthorityGranted: false, humanReviewRequired: true });
  }
  #validate(ticket: SharedQueueTicket): void {
    const c = this.#context;
    if (!ticket || ticket.storyLease?.tenantId !== c.tenantId || ticket.storyLease.ownerId !== c.holderInstanceId
      || ticket.hostHandle?.tenantId !== c.tenantId || ticket.hostHandle.holderInstanceId !== c.holderInstanceId) throw new Error('ticket controller mismatch');
    this.queue.inspectLease(ticket.storyLease);
    this.host.assertBinding(ticket.hostHandle, { tenantId: c.tenantId, holderInstanceId: c.holderInstanceId,
      lane: 'OFFLINE_SHIFT', workId: `queue:${ticket.storyLease.token}`, providerId: c.providerId,
      modelId: c.modelId, sourceCommit: c.sourceCommit, presenceEvidenceRef: c.presenceEvidenceRef });
  }
  renew(ticket: SharedQueueTicket): Readonly<SharedQueueTicket> {
    this.#validate(ticket);
    this.queue.inspectLease(ticket.storyLease, true);
    return Object.freeze({ storyLease: ticket.storyLease, hostHandle: this.host.renew(ticket.hostHandle) });
  }
  /** Trusted controller supplies actual settlement evidence; the model cannot approve itself. */
  settle(ticket: SharedQueueTicket, result: {
    providerAcknowledged: boolean; outcome: 'DRAFT' | 'FAILED'; outputHash?: string; evidenceRef?: string;
  }) {
    this.#validate(ticket);
    if (!result || typeof result.providerAcknowledged !== 'boolean' || !['DRAFT', 'FAILED'].includes(result.outcome)
      || (result.outcome === 'DRAFT' && !sha(result.outputHash, 64))) throw new Error('invalid settlement request');
    if (!result.providerAcknowledged) {
      this.host.markStopped(ticket.hostHandle, false);
      return Object.freeze({ status: 'HELD_FOR_OPERATOR' as const, queueLeaseRetained: true,
        learningPromoted: false, liveAgentCount: null });
    }
    if (typeof result.evidenceRef !== 'string' || !result.evidenceRef.trim() || result.evidenceRef.length > 200) throw new Error('bounded settlement evidence required');
    const stopped = this.host.markStopped(ticket.hostHandle, true, result.evidenceRef);
    // Crash/failure before queue settlement leaves STOPPED_CONFIRMED, which still denies new work.
    this.queue.settle(ticket.storyLease, { outcome: result.outcome, outputHash: result.outputHash, providerSettled: true });
    this.host.release(stopped, result.evidenceRef);
    return Object.freeze({ status: 'SETTLED_REVIEW_NOT_GRANTED' as const, queueLeaseRetained: false,
      learningPromoted: false, liveAgentCount: null });
  }
}
