export type TenantKeyState = 'STAGED' | 'ACTIVE' | 'RETIRING' | 'RETIRED';
export type RotationStatus = 'READY' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETE';

export interface TenantKeyReceipt {
  tenantId: string;
  keyId: string;
  version: number;
  algorithm: 'AES-256-GCM';
  state: TenantKeyState;
  createdAt: string;
  evidenceRefs: string[];
  scope: 'ORDINARY_KNOWLEDGE' | 'RESTRICTED_TOP_SECRET';
}

export interface TenantKeyRotationPlan {
  tenantId: string;
  fromKeyId: string;
  fromVersion: number;
  toKeyId: string;
  toVersion: number;
  scope: TenantKeyReceipt['scope'];
  requestedAt: string;
}

export interface TenantKeyRotationReceipt {
  tenantId: string;
  fromKeyId: string;
  fromVersion: number;
  toKeyId: string;
  toVersion: number;
  scope: TenantKeyReceipt['scope'];
  startedAt: string;
  completedAt?: string;
  itemsAttempted: number;
  itemsReencrypted: number;
  failures: Array<{ itemId: string; reason: string }>;
  evidenceRefs: string[];
}

export interface HumanApprovalReceipt {
  approverType: 'HUMAN' | 'AGENT';
  approverId: string;
  approvedAt: string;
  evidenceRefs: string[];
}

export interface RotationAssessment {
  status: RotationStatus;
  reasons: string[];
  mayActivateTargetKey: boolean;
  mayRetireSourceKey: boolean;
}

function validEvidence(refs: string[] | undefined): boolean {
  return Array.isArray(refs) && refs.some((ref) => ref.trim().length > 0);
}

export function assessTenantKeyRotation(
  plan: TenantKeyRotationPlan,
  source: TenantKeyReceipt | undefined,
  target: TenantKeyReceipt | undefined,
  rotation?: TenantKeyRotationReceipt,
  retirementApproval?: HumanApprovalReceipt,
): RotationAssessment {
  const reasons: string[] = [];

  if (!source || !target) reasons.push('SOURCE_OR_TARGET_KEY_RECEIPT_MISSING');
  if (source && source.tenantId !== plan.tenantId) reasons.push('SOURCE_TENANT_MISMATCH');
  if (target && target.tenantId !== plan.tenantId) reasons.push('TARGET_TENANT_MISMATCH');
  if (source && source.scope !== plan.scope) reasons.push('SOURCE_SCOPE_MISMATCH');
  if (target && target.scope !== plan.scope) reasons.push('TARGET_SCOPE_MISMATCH');
  if (plan.toVersion <= plan.fromVersion) reasons.push('TARGET_VERSION_MUST_ADVANCE');
  if (source && (source.keyId !== plan.fromKeyId || source.version !== plan.fromVersion)) reasons.push('SOURCE_KEY_MISMATCH');
  if (target && (target.keyId !== plan.toKeyId || target.version !== plan.toVersion)) reasons.push('TARGET_KEY_MISMATCH');
  if (source && source.algorithm !== 'AES-256-GCM') reasons.push('SOURCE_ALGORITHM_UNSUPPORTED');
  if (target && target.algorithm !== 'AES-256-GCM') reasons.push('TARGET_ALGORITHM_UNSUPPORTED');
  if (source && !validEvidence(source.evidenceRefs)) reasons.push('SOURCE_KEY_EVIDENCE_MISSING');
  if (target && !validEvidence(target.evidenceRefs)) reasons.push('TARGET_KEY_EVIDENCE_MISSING');
  if (target && !['STAGED', 'ACTIVE'].includes(target.state)) reasons.push('TARGET_KEY_NOT_USABLE');

  if (reasons.length > 0) {
    return { status: 'BLOCKED', reasons, mayActivateTargetKey: false, mayRetireSourceKey: false };
  }

  if (!rotation) {
    return { status: 'READY', reasons: [], mayActivateTargetKey: true, mayRetireSourceKey: false };
  }

  if (
    rotation.tenantId !== plan.tenantId ||
    rotation.fromKeyId !== plan.fromKeyId ||
    rotation.fromVersion !== plan.fromVersion ||
    rotation.toKeyId !== plan.toKeyId ||
    rotation.toVersion !== plan.toVersion ||
    rotation.scope !== plan.scope
  ) {
    return {
      status: 'BLOCKED',
      reasons: ['ROTATION_RECEIPT_DOES_NOT_MATCH_PLAN'],
      mayActivateTargetKey: false,
      mayRetireSourceKey: false,
    };
  }

  if (!validEvidence(rotation.evidenceRefs)) {
    return {
      status: 'BLOCKED',
      reasons: ['ROTATION_EVIDENCE_MISSING'],
      mayActivateTargetKey: false,
      mayRetireSourceKey: false,
    };
  }

  if (rotation.failures.length > 0 || rotation.itemsAttempted !== rotation.itemsReencrypted) {
    return {
      status: 'IN_PROGRESS',
      reasons: ['REENCRYPTION_INCOMPLETE_OR_FAILED'],
      mayActivateTargetKey: true,
      mayRetireSourceKey: false,
    };
  }

  if (!rotation.completedAt) {
    return {
      status: 'IN_PROGRESS',
      reasons: ['COMPLETION_RECEIPT_MISSING'],
      mayActivateTargetKey: true,
      mayRetireSourceKey: false,
    };
  }

  const humanApproved = retirementApproval?.approverType === 'HUMAN' && validEvidence(retirementApproval.evidenceRefs);
  if (!humanApproved) {
    return {
      status: 'COMPLETE',
      reasons: ['SOURCE_KEY_RETIREMENT_REQUIRES_HUMAN_APPROVAL'],
      mayActivateTargetKey: true,
      mayRetireSourceKey: false,
    };
  }

  return { status: 'COMPLETE', reasons: [], mayActivateTargetKey: true, mayRetireSourceKey: true };
}

export function assertNoAutomaticKeyDestruction(): { allowed: false; reason: string } {
  return {
    allowed: false,
    reason: 'KEY_DESTRUCTION_IS_NEVER_AUTOMATIC; retention/destruction requires separate governed human procedure',
  };
}
