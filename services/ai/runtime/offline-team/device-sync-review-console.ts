export type SyncReviewDecision = 'PENDING' | 'APPROVED_LOCAL' | 'APPROVED_REMOTE' | 'APPROVED_MERGE' | 'REJECTED' | 'RESTRICTED_MANUAL';
export type ReviewerType = 'HUMAN' | 'AGENT';
export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type DeviceVerificationStatus = 'TARGET' | 'ADAPTER_BUILT' | 'TESTED' | 'VERIFIED';

export interface DeviceVerificationReceipt {
  tenantId: string;
  deviceId: string;
  platform: string;
  status: DeviceVerificationStatus;
  observedAt: string;
  expiresAt?: string;
  evidenceRefs: string[];
}

export interface SyncConflictReviewItem {
  reviewId: string;
  tenantId: string;
  userId: string;
  conflictId: string;
  deviceId: string;
  platform: string;
  classification: DataClassification;
  localVersion: number;
  remoteVersion: number;
  createdAt: string;
  sanitizedSummary: string;
  evidenceRefs: string[];
  decision: SyncReviewDecision;
  reviewerType?: ReviewerType;
  reviewerId?: string;
  reviewedAt?: string;
  decisionEvidenceRefs?: string[];
  agentRecommendation?: Exclude<SyncReviewDecision, 'PENDING' | 'RESTRICTED_MANUAL'>;
}

export interface SyncAttemptReceipt {
  tenantId: string;
  deviceId: string;
  platform: string;
  observedAt: string;
  result: 'SUCCESS' | 'CONFLICT' | 'FAILED';
  evidenceRefs: string[];
}

export interface PlatformSyncMetric {
  platform: string;
  verifiedDevices: number;
  syncAttempts: number;
  successes: number;
  failures: number;
  conflicts: number;
  pendingHumanReviews: number;
  successRatio: number | null;
}

function hasEvidence(refs: string[] | undefined): boolean {
  return Array.isArray(refs) && refs.some((ref) => ref.trim().length > 0);
}

function receiptIsCurrent(receipt: DeviceVerificationReceipt, now = new Date()): boolean {
  if (!hasEvidence(receipt.evidenceRefs) || receipt.status !== 'VERIFIED') return false;
  if (!receipt.expiresAt) return true;
  return Date.parse(receipt.expiresAt) > now.getTime();
}

export function createSyncConflictReviewItem(
  input: Omit<SyncConflictReviewItem, 'decision'>,
): SyncConflictReviewItem {
  if (!hasEvidence(input.evidenceRefs)) throw new Error('SYNC_CONFLICT_EVIDENCE_REQUIRED');
  if (input.localVersion < 0 || input.remoteVersion < 0) throw new Error('SYNC_VERSION_MUST_BE_NON_NEGATIVE');
  return {
    ...input,
    decision: input.classification === 'TOP_SECRET' ? 'RESTRICTED_MANUAL' : 'PENDING',
  };
}

export function recordAgentRecommendation(
  item: SyncConflictReviewItem,
  recommendation: Exclude<SyncReviewDecision, 'PENDING' | 'RESTRICTED_MANUAL'>,
): SyncConflictReviewItem {
  if (item.classification === 'TOP_SECRET') return { ...item, decision: 'RESTRICTED_MANUAL' };
  return { ...item, agentRecommendation: recommendation };
}

export function finalizeSyncConflictReview(
  item: SyncConflictReviewItem,
  decision: Exclude<SyncReviewDecision, 'PENDING' | 'RESTRICTED_MANUAL'>,
  reviewer: { reviewerType: ReviewerType; reviewerId: string; reviewedAt: string; evidenceRefs: string[] },
): SyncConflictReviewItem {
  if (item.classification === 'TOP_SECRET') {
    return { ...item, decision: 'RESTRICTED_MANUAL' };
  }
  if (reviewer.reviewerType !== 'HUMAN') throw new Error('HUMAN_REVIEW_REQUIRED');
  if (!reviewer.reviewerId.trim()) throw new Error('REVIEWER_ID_REQUIRED');
  if (!hasEvidence(reviewer.evidenceRefs)) throw new Error('REVIEW_DECISION_EVIDENCE_REQUIRED');
  return {
    ...item,
    decision,
    reviewerType: reviewer.reviewerType,
    reviewerId: reviewer.reviewerId,
    reviewedAt: reviewer.reviewedAt,
    decisionEvidenceRefs: reviewer.evidenceRefs,
  };
}

export function buildPerPlatformSyncMetrics(
  devices: DeviceVerificationReceipt[],
  attempts: SyncAttemptReceipt[],
  reviews: SyncConflictReviewItem[],
  now = new Date(),
): PlatformSyncMetric[] {
  const verified = devices.filter((receipt) => receiptIsCurrent(receipt, now));
  const platforms = new Set<string>([
    ...verified.map((receipt) => receipt.platform),
    ...attempts.map((receipt) => receipt.platform),
    ...reviews.map((review) => review.platform),
  ]);

  return [...platforms].sort().map((platform) => {
    const verifiedIds = new Set(verified.filter((r) => r.platform === platform).map((r) => `${r.tenantId}:${r.deviceId}`));
    const platformAttempts = attempts.filter(
      (r) => r.platform === platform && verifiedIds.has(`${r.tenantId}:${r.deviceId}`) && hasEvidence(r.evidenceRefs),
    );
    const successes = platformAttempts.filter((r) => r.result === 'SUCCESS').length;
    const failures = platformAttempts.filter((r) => r.result === 'FAILED').length;
    const conflicts = platformAttempts.filter((r) => r.result === 'CONFLICT').length;
    const pendingHumanReviews = reviews.filter(
      (r) => r.platform === platform && (r.decision === 'PENDING' || r.decision === 'RESTRICTED_MANUAL'),
    ).length;
    return {
      platform,
      verifiedDevices: verifiedIds.size,
      syncAttempts: platformAttempts.length,
      successes,
      failures,
      conflicts,
      pendingHumanReviews,
      successRatio: platformAttempts.length ? successes / platformAttempts.length : null,
    };
  });
}

export function buildDeviceSyncReviewConsole(
  devices: DeviceVerificationReceipt[],
  attempts: SyncAttemptReceipt[],
  reviews: SyncConflictReviewItem[],
  now = new Date(),
) {
  const metrics = buildPerPlatformSyncMetrics(devices, attempts, reviews, now);
  return {
    generatedAt: now.toISOString(),
    metrics,
    pendingReviewCount: reviews.filter((r) => r.decision === 'PENDING').length,
    restrictedManualCount: reviews.filter((r) => r.decision === 'RESTRICTED_MANUAL').length,
    universalDeviceSupport: false,
    vendorPartnershipImplied: false,
    note: 'Platform metrics are measured from current VERIFIED device receipts only; they do not establish universal device support or vendor partnership.',
  };
}
