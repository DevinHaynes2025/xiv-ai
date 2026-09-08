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
  | 'guardian_refusal';

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

export type Meeting = {
  id: string;
  universeId: string;
  taskForceId: string | null;
  title: string;
  agenda: MeetingAgendaItem[];
  status: MeetingStatus;
  securityClassification: SecurityClassification;
  requiresHumanDecision: boolean;
  decision: string | null;
  decisionBy: string | null;
  decidedAt: string | null;
  unresolvedDisagreements: string[];
  summary: string | null;
  createdBy: string;
  createdAt: string;
  archivedAt: string | null;
};

export type MeetingParticipant = {
  id: string;
  universeId: string;
  meetingId: string;
  participantKind: 'agent' | 'human';
  agentId: string | null;
  userId: string | null;
  participantRole: MeetingParticipantRole;
  vote: MeetingVote | null;
  voteRationale: string | null;
  joinedAt: string;
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
