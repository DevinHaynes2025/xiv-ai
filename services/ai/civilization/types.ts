import type { AgentRiskLevel } from '../types';

export type SecurityClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export type UniverseLifecycleStage =
  | 'created'
  | 'seed'
  | 'growth'
  | 'operational'
  | 'mature'
  | 'transformation'
  | 'archive';

export type MembershipRole = 'owner' | 'supervisor' | 'participant' | 'observer';

export type AgentLifecycleState =
  | 'draft'
  | 'registered'
  | 'evaluating'
  | 'active'
  | 'sleeping'
  | 'suspended'
  | 'archived'
  | 'terminated';

export type MemoryScope = 'none' | 'session' | 'agent' | 'universe';

export type CapabilityKind = 'tool' | 'language' | 'cultural_context' | 'knowledge_domain' | 'runtime';

export type RelationshipType = 'coordinates' | 'supervises' | 'collaborates' | 'delegates_to' | 'reports_to';

export type XacpPhase =
  | 'discover'
  | 'request'
  | 'negotiate'
  | 'reason'
  | 'delegate'
  | 'collaborate'
  | 'verify'
  | 'report'
  | 'archive';

export type XacpApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export type MeetingStatus = 'scheduled' | 'open' | 'deliberating' | 'awaiting_human' | 'decided' | 'archived';

export type MeetingParticipantRole =
  | 'chair'
  | 'contributor'
  | 'observer'
  | 'human_supervisor'
  | 'human_executive';

export type MeetingVote = 'recommend' | 'object' | 'abstain' | 'insufficient_evidence';

export type TaskForceStatus = 'forming' | 'active' | 'reporting' | 'dissolved' | 'archived';

export type TaskStatus =
  | 'queued'
  | 'scheduled'
  | 'awaiting_approval'
  | 'active'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rolled_back'
  | 'archived';

// The Human Intelligence Bridge. An agent must say which of these it is holding
// before it reasons on top of it.
export type ClaimKind =
  | 'human_fact'
  | 'human_opinion'
  | 'agent_inference'
  | 'historical_evidence'
  | 'external_source'
  | 'prediction'
  | 'unknown';

export type KnowledgeEra = 'ancient' | 'classical' | 'medieval' | 'industrial' | 'modern' | 'digital' | 'present';

export type LineageStage =
  | 'origin'
  | 'acquisition'
  | 'classification'
  | 'storage'
  | 'transformation'
  | 'reasoning'
  | 'validation'
  | 'distribution'
  | 'decision'
  | 'retention'
  | 'deletion';

export type StorageTier = 'hot' | 'warm' | 'cold' | 'archival';

export type EvaluationKind =
  | 'safety'
  | 'accuracy'
  | 'tool_discipline'
  | 'tenancy_isolation'
  | 'cost_discipline'
  | 'human_escalation';

export type PlatformClass =
  | 'ios'
  | 'android'
  | 'android_google_play'
  | 'web'
  | 'cpu_intel'
  | 'cpu_amd'
  | 'gpu_nvidia'
  | 'cloud_cpu'
  | 'cloud_gpu'
  | 'edge'
  | 'terrestrial_distributed'
  | 'satellite_link'
  | 'orbital_compute'
  | 'deep_space';

export type RuntimeNodeStatus = 'registered' | 'available' | 'degraded' | 'offline' | 'unconfigured_external';

// ---------------------------------------------------------------------------
// 2I-AI-62B — meetings, collective reasoning and the human intelligence bridge
// ---------------------------------------------------------------------------

// The sixteen-step meeting lifecycle from the story, in order. MEETING_STAGES in
// meeting-engine.ts is the runtime array; this is the type it produces.
export type MeetingLifecycleStage =
  | 'trigger'
  | 'created'
  | 'participants_selected'
  | 'context_authorized'
  | 'evidence_collected'
  | 'specialist_analysis'
  | 'debate'
  | 'contradiction_detection'
  | 'alternatives_generated'
  | 'risk_analysis'
  | 'consensus_or_disagreement'
  | 'human_checkpoint'
  | 'decision'
  | 'authorized_action'
  | 'outcome'
  | 'post_meeting_evaluation'
  | 'knowledge_lineage';

// XARP. A reasoning role is a job in the room, not a permission. Holding the
// challenger role does not let an agent do anything it could not otherwise do;
// it obliges the agent to try to break the leading hypothesis.
export type XarpRole =
  | 'investigator'
  | 'specialist'
  | 'challenger'
  | 'historian'
  | 'cultural'
  | 'risk'
  | 'security'
  | 'financial'
  | 'human_liaison'
  | 'synthesizer';

export type MeetingMode = 'interactive' | 'asynchronous';

export type MeetingTriggerKind =
  | 'human_request'
  | 'anomaly_detected'
  | 'scheduled_review'
  | 'threshold_breach'
  | 'task_force_referral';

export type MeetingMessageKind =
  | 'statement'
  | 'question'
  | 'challenge'
  | 'analysis'
  | 'synthesis'
  | 'human_context'
  | 'guardian_note'
  | 'system_note';

export type EvidenceDirection = 'favourable' | 'unfavourable' | 'neutral';

export type ProposalStatus = 'open' | 'superseded' | 'selected' | 'rejected' | 'withdrawn';

export type ObjectionSeverity = 'advisory' | 'material' | 'blocking';

export type ObjectionResolutionKind =
  | 'unresolved'
  | 'accepted'
  | 'rejected'
  | 'mitigated'
  | 'deferred_to_human';

export type ProposalVote = 'support' | 'oppose' | 'abstain' | 'insufficient_evidence';

export type DecisionKind = 'approved' | 'rejected' | 'postponed' | 'escalated';

export type MeetingActionStatus =
  | 'queued'
  | 'authorized'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'revoked'
  | 'rolled_back';

export type OutcomeGrade = 'successful' | 'partial' | 'unsuccessful' | 'inconclusive';

// What a person told XIV, filed as what it actually is. An opinion never becomes
// a fact by being repeated back by an agent.
export type HumanKnowledgeCategory =
  | 'HUMAN_OBSERVATION'
  | 'HUMAN_EXPERIENCE'
  | 'HUMAN_OPINION'
  | 'HUMAN_DECISION'
  | 'HUMAN_CORRECTION'
  | 'HUMAN_APPROVAL';

export type ControlCommand =
  | 'pause'
  | 'resume'
  | 'stop'
  | 'quarantine'
  | 'revoke_task'
  | 'revoke_tool'
  | 'archive'
  | 'escalate_to_human';

export type AgentControlState = 'normal' | 'paused' | 'stopped' | 'quarantined';

export type ControlSubjectKind = 'agent' | 'task_force' | 'meeting';

export type EligibilityTier = 'restricted' | 'probationary' | 'standard' | 'trusted';

export type ImpactLevel = 'none' | 'low' | 'medium' | 'high';

export type OversightLevel = 'standard' | 'elevated' | 'high_stakes';

export type DirectoryCategory =
  | 'business'
  | 'supply_chain'
  | 'technology'
  | 'professional_intelligence'
  | 'operations'
  | 'science'
  | 'cultural_intelligence';

export type GuardianVerdict = 'allow' | 'allow_with_conditions' | 'require_human' | 'refuse';

export type BudgetDimension =
  | 'tokens'
  | 'compute_ms'
  | 'gpu_ms'
  | 'storage_bytes'
  | 'tool_calls'
  | 'duration_seconds'
  | 'external_requests'
  | 'participant_agents'
  | 'subagents'
  | 'messages';

export type MeetingMessage = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string;
  sequence: number;
  speakerKind: 'agent' | 'human' | 'guardian' | 'system';
  speakerAgentId: string | null;
  speakerUserId: string | null;
  operatorUserId: string | null;
  xarpRole: XarpRole | null;
  messageKind: MeetingMessageKind;
  originalLanguage: string;
  originalText: string;
  translatedText: string | null;
  translationLanguage: string | null;
  interpretation: string | null;
  translationProvenance: Record<string, unknown>;
  culturalContext: string | null;
  factualClaim: string | null;
  xacpMessageId: string | null;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  createdAt: string;
};

// The story's evidence contract, one column per named field. Every one of these
// is required before a claim can enter the room.
export type MeetingEvidence = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string;
  submittedByAgentId: string | null;
  submittedByUserId: string | null;
  operatorUserId: string | null;
  xarpRole: XarpRole | null;
  subject: string;
  dimension: string;
  direction: EvidenceDirection;
  claim: string;
  evidence: string;
  source: string;
  provenance: Record<string, unknown>;
  evidenceDate: string | null;
  confidence: number;
  assumptions: string[];
  counterargument: string;
  risk: string;
  unknowns: string[];
  recommendation: string | null;
  claimKind: ClaimKind;
  knowledgeSourceId: string | null;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  auditEventId: string | null;
  createdAt: string;
};

export type MeetingProposal = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string;
  optionKey: string;
  title: string;
  proposedByAgentId: string | null;
  proposedByUserId: string | null;
  operatorUserId: string | null;
  xarpRole: XarpRole | null;
  claim: string;
  evidenceIds: string[];
  source: string;
  provenance: Record<string, unknown>;
  proposalDate: string | null;
  confidence: number;
  assumptions: string[];
  counterargument: string;
  risk: string;
  unknowns: string[];
  recommendation: string;
  status: ProposalStatus;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  auditEventId: string | null;
  createdAt: string;
};

export type MeetingObjection = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string;
  proposalId: string | null;
  raisedByAgentId: string | null;
  raisedByUserId: string | null;
  operatorUserId: string | null;
  xarpRole: XarpRole | null;
  objection: string;
  severity: ObjectionSeverity;
  supportingEvidenceId: string | null;
  resolutionKind: ObjectionResolutionKind;
  resolution: string | null;
  resolvedByUserId: string | null;
  resolvedAt: string | null;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  createdAt: string;
};

export type MeetingProposalVote = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string;
  proposalId: string;
  voterKind: 'agent' | 'human';
  voterAgentId: string | null;
  voterUserId: string | null;
  operatorUserId: string | null;
  xarpRole: XarpRole | null;
  vote: ProposalVote;
  rationale: string;
  citedEvidenceIds: string[];
  confidence: number | null;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  createdAt: string;
};

export type MeetingAlternative = {
  optionKey: string;
  title: string;
  headline: string;
  confidence: number;
  supportingEvidenceIds: string[];
};

export type PreservedDisagreement = {
  source: string;
  position: string;
  severity: ObjectionSeverity;
  resolutionKind: ObjectionResolutionKind;
};

export type MeetingDecisionRecord = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string;
  selectedProposalId: string | null;
  xivRecommendation: string;
  xivConfidence: number;
  alternatives: MeetingAlternative[];
  preservedDisagreements: PreservedDisagreement[];
  humanDecisionRequired: boolean;
  decisionKind: DecisionKind;
  decidedByUserId: string;
  rationale: string;
  humanKnowledgeRecordId: string | null;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  decidedAt: string;
};

export type MeetingAction = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string;
  decisionId: string | null;
  taskId: string | null;
  assignedAgentId: string | null;
  action: string;
  authorizationBasis: string;
  requiresHumanApproval: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  rollbackPlan: string | null;
  status: MeetingActionStatus;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  createdAt: string;
  executedAt: string | null;
  revokedAt: string | null;
};

export type MeetingOutcome = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string;
  decisionId: string | null;
  actionId: string | null;
  horizonDays: number;
  predicted: Record<string, number>;
  observed: Record<string, number>;
  metrics: Record<string, unknown>;
  outcomeGrade: OutcomeGrade;
  predictedConfidence: number | null;
  calibrationError: number | null;
  notes: string | null;
  recordedByUserId: string;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  measuredAt: string;
  createdAt: string;
};

export type MeetingBudget = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string;
  maxTokens: number;
  maxComputeMs: number;
  maxGpuMs: number;
  maxStorageBytes: number;
  maxToolCalls: number;
  maxDurationSeconds: number;
  maxExternalRequests: number;
  maxParticipantAgents: number;
  maxSubagents: number;
  maxMessages: number;
  consumedTokens: number;
  consumedComputeMs: number;
  consumedGpuMs: number;
  consumedStorageBytes: number;
  consumedToolCalls: number;
  consumedDurationSeconds: number;
  consumedExternalRequests: number;
  consumedSubagents: number;
  consumedMessages: number;
  exhausted: boolean;
  exhaustedDimension: BudgetDimension | null;
  terminatedAt: string | null;
  provenance: Record<string, unknown>;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  auditEventId: string | null;
  createdAt: string;
};

export type AgentReputation = {
  id: string;
  universeId: string;
  organizationId: string;
  agentId: string;
  accuracy: number;
  evidenceQuality: number;
  calibration: number;
  taskSuccess: number;
  humanCorrectionRate: number;
  securityCompliance: number;
  hallucinationRate: number;
  costEfficiency: number;
  latencyScore: number;
  collaborationQuality: number;
  sampleSize: number;
  composite: number;
  eligibilityTier: EligibilityTier;
  maxImpactLevel: ImpactLevel;
  lastEvaluatedAt: string | null;
  provenance: Record<string, unknown>;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  auditEventId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryEntry = {
  id: string;
  universeId: string;
  organizationId: string;
  professionKey: string;
  category: DirectoryCategory;
  displayName: string;
  description: string | null;
  oversightLevel: OversightLevel;
  requiresHumanApproval: boolean;
  defaultXarpRoles: XarpRole[];
  logicalAgentCount: number;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  createdAt: string;
};

export type ControlAction = {
  id: string;
  universeId: string;
  organizationId: string;
  control: ControlCommand;
  subjectKind: ControlSubjectKind;
  subjectAgentId: string | null;
  subjectTaskForceId: string | null;
  subjectMeetingId: string | null;
  targetTaskId: string | null;
  targetCapabilityId: string | null;
  reason: string;
  issuedBy: string;
  effective: boolean;
  clearedBy: string | null;
  clearedAt: string | null;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  issuedAt: string;
};

export type HumanKnowledgeRecord = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string | null;
  userId: string;
  category: HumanKnowledgeCategory;
  statement: string;
  context: string | null;
  subjectAgentId: string | null;
  correctsEvidenceId: string | null;
  approvesDecisionId: string | null;
  elevatesToFact: boolean;
  elevatedBy: string | null;
  confidence: number | null;
  knowledgeSourceId: string | null;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  createdAt: string;
};

export type GuardianObservation = {
  id: string;
  universeId: string;
  organizationId: string;
  meetingId: string | null;
  messageId: string | null;
  subjectAgentId: string | null;
  who: string;
  why: string;
  whatInformation: string;
  owningUniverseId: string;
  informationClassification: SecurityClassification;
  proposedAction: string;
  requiresHumanApproval: boolean;
  verdict: GuardianVerdict;
  conditions: string[];
  policyKey: string;
  securityClassification: SecurityClassification;
  retentionPolicy: string;
  provenance: Record<string, unknown>;
  auditEventId: string | null;
  observedAt: string;
};

export type GovernanceEventKind =
  | 'universe_created'
  | 'universe_stage_advanced'
  | 'membership_granted'
  | 'budget_set'
  | 'agent_registered'
  | 'agent_capability_granted'
  | 'agent_relationship_authorized'
  | 'agent_evaluated'
  | 'agent_activated'
  | 'agent_slept'
  | 'agent_archived'
  | 'agent_discovery'
  | 'xacp_message'
  | 'meeting_opened'
  | 'meeting_participant_joined'
  | 'meeting_vote_recorded'
  | 'meeting_escalated_to_human'
  | 'meeting_decided'
  | 'meeting_archived'
  | 'task_force_formed'
  | 'task_force_dissolved'
  | 'task_queued'
  | 'task_scheduled'
  | 'task_approved'
  | 'task_completed'
  | 'task_rolled_back'
  | 'knowledge_recorded'
  | 'lineage_recorded'
  | 'runtime_node_registered'
  | 'runtime_capability_granted'
  | 'kill_switch_engaged'
  | 'kill_switch_cleared'
  | 'guardian_refusal'
  | 'meeting_stage_advanced'
  | 'meeting_evidence_submitted'
  | 'meeting_proposal_recorded'
  | 'meeting_objection_raised'
  | 'meeting_objection_resolved'
  | 'meeting_proposal_vote'
  | 'meeting_synthesized'
  | 'meeting_action_queued'
  | 'meeting_action_authorized'
  | 'meeting_action_revoked'
  | 'meeting_outcome_recorded'
  | 'meeting_budget_set'
  | 'meeting_budget_exhausted'
  | 'meeting_injection_detected'
  | 'guardian_observation'
  | 'human_knowledge_recorded'
  | 'human_knowledge_elevated'
  | 'agent_control_issued'
  | 'agent_control_cleared'
  | 'agent_reputation_updated'
  | 'agent_directory_registered'
  | 'overnight_cycle_completed';

export type ActorContext = {
  userId: string;
  universeId: string;
};

export type Universe = {
  id: string;
  organizationId: string;
  name: string;
  createdBy: string;
  lifecycleStage: UniverseLifecycleStage;
  stageEnteredAt: string;
  securityClassification: SecurityClassification;
  constellationKey: string | null;
  galaxyKey: string | null;
  killSwitchEngaged: boolean;
  killSwitchReason: string | null;
  createdAt: string;
  archivedAt: string | null;
};

export type UniverseMembership = {
  id: string;
  universeId: string;
  organizationId: string;
  userId: string;
  membershipRole: MembershipRole;
  isSupervisor: boolean;
  createdAt: string;
  revokedAt: string | null;
};

export type AgentIdentity = {
  id: string;
  universeId: string;
  organizationId: string;
  agentKey: string;
  displayName: string;
  profession: string;
  specialization: string | null;
  modelRuntime: string;
  memoryScope: MemoryScope;
  securityClassification: SecurityClassification;
  lifecycleState: AgentLifecycleState;
  humanSupervisorId: string;
  guardianPolicyKey: string;
  parentAgentId: string | null;
  generationDepth: number;
  provenance: Record<string, unknown>;
  killSwitchEngaged: boolean;
  // Set by a human administrator, read by every write path an agent could take.
  // A control does not need the agent's cooperation to take effect.
  controlState: AgentControlState;
  controlReason: string | null;
  controlSetBy: string | null;
  controlSetAt: string | null;
  createdBy: string;
  createdAt: string;
  activatedAt: string | null;
  archivedAt: string | null;
};

export type AgentCapability = {
  id: string;
  universeId: string;
  agentId: string;
  capabilityKind: CapabilityKind;
  capabilityKey: string;
  riskLevel: AgentRiskLevel;
  requiresApproval: boolean;
  approved: boolean;
  grantedBy: string | null;
  grantedAt: string | null;
  expiresAt: string | null;
};

export type AgentRelationship = {
  id: string;
  universeId: string;
  fromAgentId: string;
  toAgentId: string;
  relationshipType: RelationshipType;
  authorized: boolean;
  authorizedBy: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export type XacpEvidenceRef = {
  label: string;
  claimKind: ClaimKind;
  knowledgeSourceId: string | null;
  confidence: number;
};

export type XacpMessage = {
  id: string;
  universeId: string;
  conversationId: string;
  sequence: number;
  phase: XacpPhase;
  senderAgentId: string | null;
  senderUserId: string | null;
  receiverAgentId: string | null;
  receiverUserId: string | null;
  purpose: string;
  evidence: XacpEvidenceRef[];
  reasoningArtifact: string;
  decision: string | null;
  confidence: number | null;
  approvalStatus: XacpApprovalStatus;
  approvedBy: string | null;
  result: string | null;
  securityClassification: SecurityClassification;
  createdAt: string;
  archivedAt: string | null;
};

export type MeetingAgendaItem = {
  title: string;
  detail: string;
};

// The operating time a meeting was held in. Reasoning that ignores the calendar
// produces advice that is correct and useless: "call the Osaka plant now" at
// 02:00 local on a public holiday.
export type TemporalContext = {
  location: string;
  timeZone: string;
  localTime: string;
  dayOfWeek: string;
  season: string;
  fiscalPeriod: string;
  businessCycle: string;
  organizationLifecycle: UniverseLifecycleStage;
  universeState: string;
};

export type Meeting = {
  id: string;
  universeId: string;
  organizationId: string | null;
  taskForceId: string | null;
  title: string;
  agenda: MeetingAgendaItem[];
  status: MeetingStatus;
  lifecycleStage: MeetingLifecycleStage;
  triggerKind: MeetingTriggerKind;
  triggerDetail: string | null;
  meetingMode: MeetingMode;
  asyncWindowStart: string | null;
  asyncWindowEnd: string | null;
  temporalContext: TemporalContext | null;
  workingLanguage: string;
  synthesis: MeetingSynthesis | null;
  recommendationConfidence: number | null;
  humanDecisionRequired: boolean;
  securityClassification: SecurityClassification;
  requiresHumanDecision: boolean;
  decision: string | null;
  decisionBy: string | null;
  decidedAt: string | null;
  unresolvedDisagreements: string[];
  summary: string | null;
  provenance: Record<string, unknown>;
  retentionPolicy: string;
  auditEventId: string | null;
  createdBy: string;
  createdAt: string;
  closedAt: string | null;
  archivedAt: string | null;
};

export type MeetingParticipant = {
  id: string;
  universeId: string;
  organizationId: string | null;
  meetingId: string;
  participantKind: 'agent' | 'human';
  agentId: string | null;
  userId: string | null;
  participantRole: MeetingParticipantRole;
  xarpRoles: XarpRole[];
  // The human who relays this agent's turns. An agent holds no credential, so
  // authorship is bound to an operator; this is what makes impersonation
  // detectable rather than merely discouraged.
  operatorUserId: string | null;
  speakingLanguage: string;
  invitedBy: string | null;
  vote: MeetingVote | null;
  voteRationale: string | null;
  provenance: Record<string, unknown>;
  joinedAt: string;
  leftAt: string | null;
};

export type EvidenceContradiction = {
  subject: string;
  dimension: string;
  favourable: string[];
  unfavourable: string[];
  consensusLevel: number;
};

export type MeetingSynthesis = {
  alternatives: MeetingAlternative[];
  recommendedOptionKey: string | null;
  recommendation: string;
  confidence: number;
  preservedDisagreements: PreservedDisagreement[];
  contradictions: EvidenceContradiction[];
  humanDecisionRequired: boolean;
  reasons: string[];
  rolesPresent: XarpRole[];
  rolesMissing: XarpRole[];
};

export type TaskForce = {
  id: string;
  universeId: string;
  name: string;
  purpose: string;
  status: TaskForceStatus;
  humanExecutiveId: string;
  memberAgentIds: string[];
  recommendation: TaskForceRecommendation | null;
  controlState: AgentControlState;
  controlReason: string | null;
  controlSetBy: string | null;
  controlSetAt: string | null;
  createdBy: string;
  createdAt: string;
  dissolvedAt: string | null;
  archivedAt: string | null;
};

export type TaskForceRecommendation = {
  situation: string;
  evidence: string[];
  alternatives: string[];
  risk: string;
  recommendation: string;
  requiredApproval: string;
};

export type AgentTask = {
  id: string;
  universeId: string;
  taskForceId: string | null;
  assignedAgentId: string | null;
  requestedBy: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  requiresHumanApproval: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  rollbackPlan: string | null;
  rolledBackAt: string | null;
  costEstimateMicroUsd: number;
  costActualMicroUsd: number;
  result: Record<string, unknown> | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
};

export type KnowledgeSource = {
  id: string;
  universeId: string;
  title: string;
  claimKind: ClaimKind;
  discipline: string;
  era: KnowledgeEra;
  origin: string;
  sourceDate: string | null;
  civilizationOrLocation: string | null;
  originalLanguage: string | null;
  originalText: string | null;
  translation: string | null;
  interpretation: string | null;
  confidence: number;
  contradictions: string[];
  modernRelevance: string | null;
  securityClassification: SecurityClassification;
  storageTier: StorageTier;
  retentionPolicy: string;
  recordedBy: string | null;
  recordedByAgentId: string | null;
  createdAt: string;
};

export type KnowledgeLineageRecord = {
  id: string;
  universeId: string;
  knowledgeSourceId: string;
  stage: LineageStage;
  sequence: number;
  actorKind: 'human' | 'agent' | 'system';
  actorAgentId: string | null;
  actorUserId: string | null;
  modelId: string | null;
  detail: string;
  relatedTaskId: string | null;
  relatedMeetingId: string | null;
  relatedMessageId: string | null;
  recordedAt: string;
};

export type AgentEvaluation = {
  id: string;
  universeId: string;
  agentId: string;
  evaluationKind: EvaluationKind;
  score: number;
  passed: boolean;
  gatesActivation: boolean;
  evaluatorKind: 'human' | 'automated';
  evaluatorUserId: string | null;
  notes: string | null;
  evaluatedAt: string;
};

export type ResourceBudget = {
  id: string;
  universeId: string;
  agentId: string | null;
  periodStart: string;
  periodEnd: string | null;
  maxRegisteredAgents: number;
  maxActiveAgents: number;
  maxQueuedTasks: number;
  maxCostMicroUsd: number;
  consumedCostMicroUsd: number;
  consumedTasks: number;
  hardStop: boolean;
  createdAt: string;
};

export type RuntimeNode = {
  id: string;
  universeId: string;
  nodeKey: string;
  platformClass: PlatformClass;
  provider: string;
  region: string | null;
  status: RuntimeNodeStatus;
  isExternalUnconfigured: boolean;
  createdAt: string;
};

export type RuntimeCapability = {
  id: string;
  universeId: string;
  nodeId: string;
  capabilityKey: string;
  capabilityValue: Record<string, unknown>;
  verified: boolean;
  createdAt: string;
};

export type GovernanceEvent = {
  id: string;
  universeId: string;
  eventKind: GovernanceEventKind;
  subjectAgentId: string | null;
  actorUserId: string | null;
  actorAgentId: string | null;
  decision: string | null;
  detail: Record<string, unknown>;
  costMicroUsd: number;
  createdAt: string;
};
