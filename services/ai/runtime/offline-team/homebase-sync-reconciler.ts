export type SyncDecision = 'ACCEPT' | 'REVIEW' | 'REJECT';

export interface SyncCandidate {
  id: string;
  tenantId: string;
  evidenceRefs: string[];
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  localApproved: boolean;
  conflictsWithHomebase: boolean;
}

export interface SyncResult {
  candidateId: string;
  decision: SyncDecision;
  reason: string;
  requiresHumanApproval: boolean;
}

export function reconcileToHomebase(candidate: SyncCandidate): SyncResult {
  if (!candidate.tenantId || candidate.evidenceRefs.length === 0) return { candidateId: candidate.id, decision: 'REJECT', reason: 'missing tenant/evidence', requiresHumanApproval: true };
  if (candidate.classification === 'TOP_SECRET') return { candidateId: candidate.id, decision: 'REVIEW', reason: 'top secret requires local vault review', requiresHumanApproval: true };
  if (!candidate.localApproved || candidate.conflictsWithHomebase) return { candidateId: candidate.id, decision: 'REVIEW', reason: 'approval/conflict review required', requiresHumanApproval: true };
  return { candidateId: candidate.id, decision: 'ACCEPT', reason: 'eligible for governed homebase promotion', requiresHumanApproval: true };
}
