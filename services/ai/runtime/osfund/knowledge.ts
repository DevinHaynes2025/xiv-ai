/**
 * Knowledge routing — no private → global automatic promotion.
 */

import type { KnowledgeLane } from './types';

export type KnowledgeRouteRequest = {
  from: KnowledgeLane;
  to: KnowledgeLane;
  evidencePresent: boolean;
  humanOrPolicyVerified: boolean;
};

export function routeKnowledge(input: KnowledgeRouteRequest) {
  if (input.from === 'TENANT_PRIVATE' && input.to === 'GLOBAL_PUBLIC') {
    return { allowed: false as const, reason: 'private_knowledge_cannot_auto_enter_global' };
  }
  if (input.from === 'UNIVERSE_SCOPED' && input.to === 'GLOBAL_PUBLIC' && input.humanOrPolicyVerified !== true) {
    return { allowed: false as const, reason: 'universe_knowledge_requires_verification_for_global' };
  }
  if (input.to === 'GLOBAL_PUBLIC' && (input.evidencePresent !== true || input.humanOrPolicyVerified !== true)) {
    return { allowed: false as const, reason: 'global_knowledge_requires_evidence_and_verification' };
  }
  return { allowed: true as const, from: input.from, to: input.to };
}

export function privateKnowledgeAutoEntersGlobal(): false {
  return false;
}

export function knowledgeRouteCreatesAuthority(): false {
  return false;
}
