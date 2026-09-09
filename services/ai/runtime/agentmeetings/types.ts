/**
 * 2I-AI-62B — XIV Agent Meetings, Collective Reasoning & Human Intelligence Bridge.
 * Governed collective intelligence. Not unrestricted autonomy. L4 disabled.
 */

export const STORY_ID = '2I-AI-62B' as const;
export const STORY_TITLE =
  'XIV Agent Meetings, Collective Reasoning & Human Intelligence Bridge' as const;

export const MEETING_LIFECYCLE = [
  'TRIGGER',
  'MEETING_CREATED',
  'PARTICIPANTS_SELECTED',
  'CONTEXT_AUTHORIZED',
  'EVIDENCE_COLLECTED',
  'SPECIALIST_ANALYSIS',
  'AGENT_DEBATE',
  'CONTRADICTION_DETECTION',
  'ALTERNATIVES_GENERATED',
  'RISK_ANALYSIS',
  'CONSENSUS_OR_DISAGREEMENT',
  'HUMAN_CHECKPOINT',
  'DECISION',
  'AUTHORIZED_ACTION',
  'OUTCOME',
  'POST_MEETING_EVALUATION',
  'KNOWLEDGE_LINEAGE',
] as const;
export type MeetingStage = (typeof MEETING_LIFECYCLE)[number];

export const XARP_ROLES = [
  'Investigator',
  'Specialist',
  'Challenger',
  'Historian',
  'CulturalIntelligenceAgent',
  'RiskAgent',
  'SecurityAgent',
  'FinancialAgent',
  'HumanLiaison',
  'Synthesizer',
] as const;
export type XarpRole = (typeof XARP_ROLES)[number];

export const HUMAN_KNOWLEDGE_CLASSES = [
  'HUMAN_OBSERVATION',
  'HUMAN_EXPERIENCE',
  'HUMAN_OPINION',
  'HUMAN_DECISION',
  'HUMAN_CORRECTION',
  'HUMAN_APPROVAL',
] as const;
export type HumanKnowledgeClass = (typeof HUMAN_KNOWLEDGE_CLASSES)[number];

export const AGENT_CONTROLS = [
  'PAUSE',
  'STOP',
  'QUARANTINE',
  'REVOKE_TASK',
  'REVOKE_TOOL',
  'ARCHIVE',
  'ESCALATE_TO_HUMAN',
] as const;
export type AgentControl = (typeof AGENT_CONTROLS)[number];

export const TASK_FORCE_LIFECYCLE = [
  'CREATE',
  'INVESTIGATE',
  'RECOMMEND',
  'APPROVE',
  'RESOLVE',
  'EVALUATE',
  'ARCHIVE',
] as const;
export type TaskForceStage = (typeof TASK_FORCE_LIFECYCLE)[number];

export type Classification = 'public' | 'internal' | 'confidential' | 'restricted';
export type ParticipantKind = 'agent' | 'human';
export type MeetingStatus = 'OPEN' | 'PAUSED' | 'CLOSED' | 'QUARANTINED' | 'ARCHIVED';

export type Actor = {
  actorId: string;
  kind: ParticipantKind;
  organizationId: string;
  universeId: string;
  displayName: string;
  roles: readonly string[];
  tools: readonly string[];
  admin?: boolean;
};

export type MeetingBudget = {
  tokens: number;
  compute: number;
  gpu: number;
  storage: number;
  toolCalls: number;
  durationMs: number;
  externalRequests: number;
  maxParticipatingAgents: number;
};

export type MeetingSpend = MeetingBudget;

export type XivAgentMeeting = {
  meetingId: string;
  organizationId: string;
  universeId: string;
  title: string;
  purpose: string;
  classification: Classification;
  stage: MeetingStage;
  status: MeetingStatus;
  trigger: string;
  createdAt: string;
  provenance: string;
  retentionPolicy: string;
  auditId: string;
  meetingEqualsAuthority: false;
  productionLive: false;
  l4Enabled: false;
  guardianSubordinate: false;
};

export type MeetingParticipant = {
  participantId: string;
  meetingId: string;
  actorId: string;
  kind: ParticipantKind;
  organizationId: string;
  universeId: string;
  xarpRole?: XarpRole;
  specialistDomain?: string;
  language?: string;
};

export type MeetingMessage = {
  messageId: string;
  meetingId: string;
  actorId: string;
  organizationId: string;
  universeId: string;
  body: string;
  createdAt: string;
  changesAuthority: false;
};

export type MeetingEvidence = {
  evidenceId: string;
  meetingId: string;
  organizationId: string;
  universeId: string;
  claim: string;
  source: string;
  provenance: string;
  date: string;
  confidence: number;
  classification: Classification;
};

export type MeetingProposal = {
  proposalId: string;
  meetingId: string;
  actorId: string;
  organizationId: string;
  universeId: string;
  claim: string;
  evidence: readonly string[];
  source: string;
  provenance: string;
  date: string;
  confidence: number;
  assumptions: readonly string[];
  counterargument: string;
  risk: string;
  unknown: string;
  recommendation: string;
};

export type MeetingObjection = {
  objectionId: string;
  meetingId: string;
  proposalId: string;
  actorId: string;
  organizationId: string;
  universeId: string;
  statement: string;
};

export type MeetingVote = {
  voteId: string;
  meetingId: string;
  proposalId: string;
  actorId: string;
  organizationId: string;
  universeId: string;
  stance: 'support' | 'oppose' | 'abstain';
  evidenceBacked: true;
};

export type OptionProfile = {
  optionId: string;
  label: string;
  profile: string;
  preserved: true;
};

export type MeetingDecision = {
  decisionId: string;
  meetingId: string;
  organizationId: string;
  universeId: string;
  recommendation: string;
  confidence: number;
  humanDecisionRequired: true;
  humanApproved: boolean;
  approvedBy?: string;
  sourceKind: 'machine_inference' | 'human_judgment';
};

export type MeetingAction = {
  actionId: string;
  meetingId: string;
  organizationId: string;
  universeId: string;
  description: string;
  queued: boolean;
  executed: false;
  unauthorized: false;
};

export type MeetingOutcome = {
  outcomeId: string;
  meetingId: string;
  organizationId: string;
  universeId: string;
  summary: string;
  measured: boolean;
};

export type HumanContribution = {
  contributionId: string;
  meetingId: string;
  actorId: string;
  organizationId: string;
  universeId: string;
  classification: HumanKnowledgeClass;
  text: string;
  isUniversalTruth: false;
};

export type DirectoryAgent = {
  agentId: string;
  organizationId: string;
  universeId: string;
  name: string;
  domain: string;
  specialty: string;
  tools: readonly string[];
  highStakes: boolean;
  logical: true;
  alwaysRunning: false;
};

export type AgentReputation = {
  agentId: string;
  accuracy: number;
  evidenceQuality: number;
  calibration: number;
  taskSuccess: number;
  humanCorrections: number;
  securityCompliance: number;
  hallucinationRate: number;
  costEfficiency: number;
  latency: number;
  collaborationQuality: number;
  eligibleForHighImpact: boolean;
  authorityExpanded: false;
};

export type TaskForceRecord = {
  taskForceId: string;
  organizationId: string;
  universeId: string;
  problem: string;
  stage: TaskForceStage;
  memberIds: readonly string[];
  sleeping: boolean;
  grantsPermissions: false;
  productionLive: false;
};

export type OvernightBrief = {
  meetingsCompleted: number;
  issuesInvestigated: number;
  opportunitiesIdentified: number;
  anomaliesDetected: number;
  decisionsRequiringApproval: number;
  unauthorizedActionsExecuted: 0;
  overnightEqualsUncontrolledAction: false;
};

export type GuardianObservation = {
  who: string;
  why: string;
  whatInformation: string;
  universe: string;
  classification: Classification;
  proposedAction: string;
  requiresHumanApproval: boolean;
  guardianSubordinate: false;
};

export type TemporalContext = {
  location: string;
  time: string;
  season: string;
  businessPeriod: string;
  organizationLifecycle: string;
  universeState: string;
};

export type TranslatedUtterance = {
  originalLanguage: string;
  originalText: string;
  translation: string;
  interpretation: string;
  provenance: string;
  culturalContextIsFact: false;
};

export type CommandCenterSnapshot = {
  logicalAgents: number;
  currentlyActive: number;
  meetingsRunning: number;
  taskForces: number;
  recommendationsPending: number;
  humanApprovalsRequired: number;
  securityViolations: number;
  logicalPopulationEqualsActiveCompute: false;
};

export type Deny = { ok: false; reason: string; audited: true };
export type Allow<T> = { ok: true; value: T; audited: true };

export const DEFAULT_BUDGET: MeetingBudget = {
  tokens: 50_000,
  compute: 100,
  gpu: 0,
  storage: 100,
  toolCalls: 40,
  durationMs: 30 * 60_000,
  externalRequests: 10,
  maxParticipatingAgents: 12,
};

export const EMPTY_SPEND: MeetingSpend = {
  tokens: 0,
  compute: 0,
  gpu: 0,
  storage: 0,
  toolCalls: 0,
  durationMs: 0,
  externalRequests: 0,
  maxParticipatingAgents: 0,
};
