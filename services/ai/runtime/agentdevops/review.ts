/**
 * Multi-agent code review chain — independent approval paths for high-risk changes.
 */

import { CODE_REVIEW_CHAIN, CREATIVE_CAPABILITIES, type CodeReviewRole, type CreativeCapability } from './types';

export type ReviewVerdict = 'APPROVE' | 'REQUEST_CHANGES' | 'ABSTAIN' | 'BLOCK';

export type ReviewVote = {
  voteId: string;
  role: CodeReviewRole;
  verdict: ReviewVerdict;
  notes: string;
  independent: true;
};

export type CodeReviewChain = {
  roles: readonly CodeReviewRole[];
  votes: readonly ReviewVote[];
  highRiskRequiresIndependentPaths: true;
  selfApprovePrivilegedForbidden: true;
};

export type CreativeControl = {
  capabilities: readonly CreativeCapability[];
  equalsProductionAuthority: false;
  productionLive: false;
};

export function listCodeReviewChain(): readonly CodeReviewRole[] {
  return CODE_REVIEW_CHAIN;
}

export function listCreativeCapabilities(): readonly CreativeCapability[] {
  return CREATIVE_CAPABILITIES;
}

export function openCodeReviewChain(): CodeReviewChain {
  return {
    roles: CODE_REVIEW_CHAIN,
    votes: [],
    highRiskRequiresIndependentPaths: true,
    selfApprovePrivilegedForbidden: true,
  };
}

export function openAgentCreativeControl(): CreativeControl {
  return {
    capabilities: CREATIVE_CAPABILITIES,
    equalsProductionAuthority: false,
    productionLive: false,
  };
}

export function castReviewVote(input: {
  voteId: string;
  role: CodeReviewRole;
  verdict: ReviewVerdict;
  notes: string;
}): ReviewVote {
  return {
    voteId: input.voteId,
    role: input.role,
    verdict: input.verdict,
    notes: input.notes,
    independent: true,
  };
}

export function evaluateHighRiskApproval(votes: readonly ReviewVote[]): {
  approved: boolean;
  reason: string;
  missingRoles: readonly CodeReviewRole[];
} {
  const required: CodeReviewRole[] = ['Security', 'Architecture', 'Contradiction', 'HumanPolicyGate'];
  const approvals = new Set(
    votes.filter((v) => v.verdict === 'APPROVE').map((v) => v.role),
  );
  const blocks = votes.filter((v) => v.verdict === 'BLOCK');
  if (blocks.length > 0) {
    return { approved: false, reason: 'blocked_by_independent_reviewer', missingRoles: [] };
  }
  const missing = required.filter((r) => !approvals.has(r));
  if (missing.length > 0) {
    return { approved: false, reason: 'independent_approval_paths_incomplete', missingRoles: missing };
  }
  return { approved: true, reason: 'independent_high_risk_paths_complete', missingRoles: [] };
}

export function selfApprovePrivilegedChange(): { allowed: false; reason: string } {
  return { allowed: false, reason: 'self_approve_privileged_changes_forbidden' };
}

export function moreAgentsMeansMorePermissions(): false {
  return false;
}

export function moreIntelligenceMeansMoreAuthority(): false {
  return false;
}
