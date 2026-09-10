export interface PeerLesson {
  lessonId: string;
  tenantId: string;
  authorAgentId: string;
  topic: string;
  summary: string;
  evidenceRefs: readonly string[];
  confidence: number;
  createdAt: string;
  mutatesModelWeights: false;
  mutatesAgentCode: false;
}

export interface PeerEnvelope {
  messageId: string;
  tenantId: string;
  fromAgentId: string;
  toAgentIds: readonly string[];
  lesson: PeerLesson;
  offlineDeliverable: true;
}

export const PEER_LEARNING_GUARDRAILS = {
  offlineCommunicationAllowed: true,
  evidenceRequiredForPromotion: true,
  crossTenantCommunicationAllowed: false,
  automaticFactPromotionAllowed: false,
  modelWeightMutationAllowed: false,
  agentCodeMutationAllowed: false,
  maxRecipientsPerMessage: 32,
} as const;

export function publishPeerLesson(input: {
  lesson: PeerLesson;
  recipientAgentIds: readonly string[];
}): PeerEnvelope {
  if (input.lesson.confidence < 0 || input.lesson.confidence > 1) throw new Error('confidence must be 0..1');
  if (input.recipientAgentIds.length > PEER_LEARNING_GUARDRAILS.maxRecipientsPerMessage) throw new Error('recipient cap exceeded');
  if (input.lesson.evidenceRefs.length === 0) throw new Error('evidence required before peer promotion');
  return Object.freeze({
    messageId: `peer:${input.lesson.lessonId}`,
    tenantId: input.lesson.tenantId,
    fromAgentId: input.lesson.authorAgentId,
    toAgentIds: Object.freeze([...input.recipientAgentIds]),
    lesson: Object.freeze({ ...input.lesson, evidenceRefs: Object.freeze([...input.lesson.evidenceRefs]) }),
    offlineDeliverable: true,
  });
}

export function acceptPeerLesson(receiverTenantId: string, envelope: PeerEnvelope): PeerLesson {
  if (receiverTenantId !== envelope.tenantId) throw new Error('cross-tenant peer learning blocked');
  return envelope.lesson;
}
