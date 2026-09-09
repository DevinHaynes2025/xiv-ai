export type SovereignInformationClass =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'FOUNDER_RESTRICTED'
  | 'SECURITY_CRITICAL'
  | 'SECRET';

export type VoiceMode =
  | 'VOICE_OFF'
  | 'PUSH_TO_TALK'
  | 'SESSION_ONLY'
  | 'MEETING_ASSISTANT'
  | 'PERSONAL_MEMORY_OPT_IN'
  | 'COMPANY_WORKFLOW_OPT_IN';

export type UniverseFabricType =
  | 'PERSONAL'
  | 'COMPANY'
  | 'SUPPLIER'
  | 'INDUSTRY'
  | 'COMMUNITY'
  | 'KNOWLEDGE'
  | 'HISTORICAL'
  | 'EARTH'
  | 'GLOBAL_PUBLIC';

export type MarketingPublishState =
  | 'AI_DRAFT'
  | 'EVIDENCE_CHECK'
  | 'BRAND_CHECK'
  | 'RIGHTS_CHECK'
  | 'HUMAN_POLICY_APPROVAL'
  | 'PUBLISHED';

export type FeedbackLoopStep =
  | 'OBSERVE'
  | 'UNDERSTAND'
  | 'VERIFY'
  | 'DECIDE_RECOMMEND'
  | 'ACT'
  | 'MEASURE'
  | 'COMPARE_EXPECTED_VS_ACTUAL'
  | 'LESSON'
  | 'EVALUATION'
  | 'IMPROVEMENT_PROPOSAL';

export type CryptoReadiness = 'NOT_PROVEN' | 'MIGRATION_READY' | 'LIVE';
