export type StudyMediaKind = 'ARTICLE' | 'DOCUMENT' | 'VIDEO_TRANSCRIPT' | 'CASE_STUDY' | 'CODE_WALKTHROUGH';

export interface StudyMediaItem {
  mediaId: string;
  kind: StudyMediaKind;
  title: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  approvedForStudy: boolean;
}

export interface AgentMediaSession {
  sessionId: string;
  agentIds: string[];
  mediaIds: string[];
  startedAt: string;
  completedAt?: string;
  discussionRefs: string[];
  evaluationRefs: string[];
  approvedLessonRefs: string[];
}

export function validateAgentMediaSession(session: AgentMediaSession): true {
  if (session.agentIds.length < 1 || session.agentIds.length > 8) throw new Error('agent study session must use 1-8 agents');
  if (!session.mediaIds.length) throw new Error('study media required');
  return true;
}

export const AGENT_MEDIA_ROOM_GUARDRAILS = {
  citationsRequiredForLearnedClaims: true,
  mediaDoesNotEqualTruth: true,
  approvalRequiredBeforeSharedMemoryWrite: true,
  backgroundLearningClaimAllowedWithoutReceipt: false,
};
