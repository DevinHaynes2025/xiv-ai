/**
 * Phase 2I-LA-03 Agent Mission Control + 24/7 Shift Orchestrator — typed contracts.
 * Composes LA-01 cloudworkforce + LA-02 cloudworker. Does not rebuild missions/leases.
 * L4 DISABLED. DEFAULT PERMISSIONS = NONE. Architecture ≠ 24/7 LIVE.
 * MORE AGENTS ≠ MORE AUTHORITY. MANAGER ≠ AUTHORIZATION. HANDOFF ≠ PERMISSION TRANSFER.
 */

export type AuthorityCeiling = 'L0' | 'L1' | 'L2' | 'L3';

export type PriorityClass = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_NORMAL' | 'P3_LOW' | 'P4_BACKGROUND';

export type FollowTheSunZone = 'AMERICAS' | 'EUROPE_AFRICA' | 'ASIA_PACIFIC' | 'NIGHT';

export type DepartmentId =
  | 'EXECUTIVE'
  | 'PRODUCT'
  | 'ENGINEERING'
  | 'AI_ML'
  | 'DATA'
  | 'DATABASE'
  | 'CLOUD_DEVOPS'
  | 'SECURITY'
  | 'QA'
  | 'RESEARCH'
  | 'KNOWLEDGE'
  | 'SUPPLY_CHAIN'
  | 'SALES'
  | 'MARKETING'
  | 'CUSTOMER'
  | 'FINANCE'
  | 'PARTNERSHIPS';

export type ShiftTemplateId =
  | 'ENGINEERING_SHIFT'
  | 'RESEARCH_SHIFT'
  | 'QA_SHIFT'
  | 'SECURITY_SHIFT'
  | 'DATABASE_SHIFT'
  | 'KNOWLEDGE_SHIFT'
  | 'RELIABILITY_SHIFT'
  | 'PRODUCT_SHIFT'
  | 'SUPPLY_CHAIN_SHIFT'
  | 'SALES_RESEARCH_SHIFT'
  | 'FOUNDER_BRIEF_SHIFT';

export type MissionGraphEdgeKind =
  | 'BLOCKED_BY'
  | 'DEPENDS_ON'
  | 'VALIDATES'
  | 'REVIEWS'
  | 'CHALLENGES'
  | 'PRODUCES'
  | 'CONSUMES';

export type AnalysisRound =
  | 'INDEPENDENT_ANALYSIS'
  | 'EVIDENCE_EXCHANGE'
  | 'CHALLENGE'
  | 'ALTERNATIVES'
  | 'SIMULATION'
  | 'SYNTHESIS';

export type BusMessageType =
  | 'QUESTION'
  | 'ANSWER'
  | 'REQUEST'
  | 'RESULT'
  | 'EVIDENCE'
  | 'CHALLENGE'
  | 'CONTRADICTION'
  | 'HANDOFF'
  | 'ESCALATION'
  | 'ALERT'
  | 'DEBRIEF';

export type Classification =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'SECRET';

export type ParallelBrainId =
  | 'FINANCE_BRAIN'
  | 'SUPPLY_CHAIN_BRAIN'
  | 'CUSTOMER_BRAIN'
  | 'ENGINEERING_BRAIN'
  | 'RESEARCH_BRAIN'
  | 'SECURITY_BRAIN'
  | 'CONTRADICTION_BRAIN';

export type AgentShiftDefinition = {
  id: ShiftTemplateId;
  name: string;
  department: DepartmentId;
  schedule: FollowTheSunZone | 'ON_DEMAND';
  missionTypes: readonly string[];
  agentRequirements: readonly string[];
  toolRequirements: readonly string[];
  dataScopes: readonly string[];
  budgetCeiling: number;
  authorityCeiling: AuthorityCeiling;
  concurrencyLimit: number;
  handoffPolicy: 'CHECKPOINT_DEBRIEF_REQUIRED';
  enabled: boolean;
  continuousAutonomy: false;
  productionLive: false;
  l4Enabled: false;
};

export type AgentShiftInstance = {
  instanceId: string;
  definitionId: ShiftTemplateId;
  tenantId: string;
  universeId: string;
  zone: FollowTheSunZone;
  startedAt: string;
  endsAt: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'HANDOFF' | 'CLOSED';
  continuousAutonomy: false;
  productionLive: false;
};

export type AgentShiftAssignment = {
  assignmentId: string;
  instanceId: string;
  agentDirectoryId: string;
  role: string;
  tenantId: string;
  universeId: string;
  permissions: readonly never[];
  defaultPermissions: 'NONE';
};

export type AgentShiftMission = {
  shiftMissionId: string;
  instanceId: string;
  missionId: string;
  priority: PriorityClass;
  tenantId: string;
  universeId: string;
};

export type AgentShiftHandoff = {
  handoffId: string;
  fromInstanceId: string;
  toInstanceId: string;
  missionId: string;
  objective: string;
  completedWork: readonly string[];
  remainingWork: readonly string[];
  checkpointId: string | null;
  repositoryStateRef: string | null;
  databaseStateRef: string | null;
  tests: readonly string[];
  failures: readonly string[];
  evidenceRefs: readonly string[];
  contradictions: readonly string[];
  unknowns: readonly string[];
  nextRecommendedAction: string;
  transfersPermissions: false;
  transfersAuthority: false;
  sameTenantRequired: true;
  sameUniverseRequired: true;
  createdAt: string;
};

export type AgentShiftReport = {
  reportId: string;
  instanceId: string;
  tenantId: string;
  universeId: string;
  missionsCompleted: number;
  missionsFailed: number;
  blockers: readonly string[];
  costSpent: number;
  productionLive: false;
  createdAt: string;
};

export type AgentDepartment = {
  departmentId: DepartmentId;
  name: string;
  tenantId: string;
  universeId: string;
  authorityCeiling: AuthorityCeiling;
  budgetCeiling: number;
  defaultPermissions: 'NONE';
  l4Enabled: false;
  productionLive: false;
};

export type DepartmentMission = {
  departmentMissionId: string;
  departmentId: DepartmentId;
  missionId: string;
  tenantId: string;
  universeId: string;
};

export type DepartmentPolicy = {
  departmentId: DepartmentId;
  maySelfGrantPermissions: false;
  mayDisableGuardian: false;
  mayApproveOwnProhibited: false;
  maySilentProductionDeploy: false;
};

export type DepartmentBudget = {
  departmentId: DepartmentId;
  tenantId: string;
  universeId: string;
  ceiling: number;
  spent: number;
  selfExpandable: false;
};

export type DepartmentHealth = {
  departmentId: DepartmentId;
  status: 'HEALTHY' | 'DEGRADED' | 'BLOCKED';
  activeMissions: number;
  blockers: readonly string[];
};

export type DepartmentReport = {
  departmentId: DepartmentId;
  summary: string;
  findings: readonly string[];
  decisionsRequiringHuman: readonly string[];
};

export type AgentManagerCapabilities = {
  mayInspectQueue: true;
  mayAssignMissions: true;
  mayFormTaskForces: true;
  mayRequestSpecialists: true;
  mayPauseWork: true;
  mayHandoffWork: true;
  mayRequestReview: true;
  mayEscalateBlockers: true;
  mayGrantPermissions: false;
  mayIncreaseAuthority: false;
  mayDisableGuardian: false;
  mayModifyOwnership: false;
  mayOverrideSecurity: false;
  mayApproveOwnProhibited: false;
};

export type AgentManager = {
  managerId: string;
  departmentId: DepartmentId;
  tenantId: string;
  universeId: string;
  capabilities: AgentManagerCapabilities;
  permissions: readonly never[];
  defaultPermissions: 'NONE';
  l4Enabled: false;
  isAuthorizationAuthority: false;
};

export type TaskForceMember = {
  agentDirectoryId: string;
  role: string;
  permissions: readonly never[];
  independentAnalysisRequired: true;
};

export type AgentTaskForce = {
  taskForceId: string;
  problem: string;
  tenantId: string;
  universeId: string;
  departmentId: DepartmentId | null;
  members: readonly TaskForceMember[];
  leadAgentDirectoryId: string | null;
  leadInheritsExtraPermissions: false;
  status: 'FORMING' | 'ACTIVE' | 'SYNTHESIS' | 'CLOSED';
  analysisRound: AnalysisRound;
  preserveDisagreement: true;
  productionLive: false;
  l4Enabled: false;
};

export type MissionGraphNode = {
  nodeId: string;
  missionId: string;
  label: string;
};

export type MissionGraphEdge = {
  fromNodeId: string;
  toNodeId: string;
  kind: MissionGraphEdgeKind;
};

export type MissionGraph = {
  graphId: string;
  tenantId: string;
  universeId: string;
  nodes: readonly MissionGraphNode[];
  edges: readonly MissionGraphEdge[];
};

export type PrioritySignals = {
  securitySeverity: number;
  customerImpact: number;
  businessValue: number;
  dependencyImpact: number;
  deadlinePressure: number;
  reliabilityImpact: number;
  dataQuality: number;
  costPressure: number;
  researchImportance: number;
  founderPriority: number;
};

export type WipLimits = {
  maxActiveMissions: number;
  maxAgentsPerDepartment: number;
  maxTaskForceSize: number;
  maxResearchConcurrency: number;
  maxEngineeringConcurrency: number;
  maxModelSpend: number;
  maxCloudSpend: number;
};

export type AgentDirectoryEntry = {
  agentDirectoryId: string;
  role: string;
  departmentId: DepartmentId;
  skills: readonly string[];
  tools: readonly string[];
  permissions: readonly never[];
  defaultPermissions: 'NONE';
  modelCapabilities: readonly string[];
  historicalEvaluation: number;
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'QUARANTINED';
  currentWorkload: number;
  estimatedCost: number;
  discoveryEqualsAuthorization: false;
  l4Enabled: false;
};

export type SkillMatchScore = {
  agentDirectoryId: string;
  skillFit: number;
  toolFit: number;
  domainFit: number;
  permissionFit: number;
  historicalReliability: number;
  evidenceQuality: number;
  latency: number;
  cost: number;
  availability: number;
  total: number;
  routedByModelSizeAlone: false;
};

export type NewRoleProposal = {
  proposalId: string;
  roleName: string;
  problem: string;
  departmentId: DepartmentId;
  requiredSkills: readonly string[];
  requiredTools: readonly string[];
  requiredData: readonly string[];
  requiredPermissions: readonly string[];
  evaluationPlan: string;
  expectedValue: string;
  estimatedCost: number;
  risk: string;
  status: 'PROPOSED' | 'DUPLICATE_CHECK' | 'SECURITY' | 'EVAL_DESIGN' | 'APPROVAL' | 'SANDBOX' | 'REJECTED';
  autoGrantedPermissions: false;
  l4Enabled: false;
};

export type MissionControlMessage = {
  messageId: string;
  type: BusMessageType;
  sender: string;
  receiver: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  classification: Classification;
  purpose: string;
  timestamp: string;
  traceId: string;
  forged: false;
};

export type EvidencePacket = {
  packetId: string;
  claim: string;
  sourceReferences: readonly string[];
  classification: Classification;
  provenance: string;
  freshness: string;
  confidence: number;
  contradictions: readonly string[];
  allowedRecipients: readonly string[];
  copiesSensitivePayload: false;
};

export type AgentMeeting = {
  meetingId: string;
  tenantId: string;
  universeId: string;
  agenda: string;
  stage:
    | 'AGENDA'
    | 'INDEPENDENT_POSITIONS'
    | 'EVIDENCE'
    | 'QUESTIONS'
    | 'CHALLENGES'
    | 'ALTERNATIVES'
    | 'DISAGREEMENTS'
    | 'SYNTHESIS'
    | 'ACTION_PROPOSALS';
  positions: readonly string[];
  disagreements: readonly string[];
  actionProposals: readonly string[];
  meetingEqualsAuthority: false;
  productionLive: false;
};

export type PerformanceMemory = {
  agentDirectoryId: string;
  taskClass: string;
  success: number;
  failure: number;
  accuracy: number;
  groundedness: number;
  toolSuccess: number;
  securityCompliance: number;
  latencyMs: number;
  cost: number;
  humanCorrections: number;
  outcomeQuality: number;
};

export type ComputationalDegradation = {
  agentDirectoryId: string;
  contextSaturation: number;
  errorRate: number;
  latencyMs: number;
  resourcePressure: number;
  toolFailures: number;
  modelDegradation: number;
  excessiveRetries: number;
  humanFatigueModel: false;
};

export type ShiftScorecard = {
  instanceId: string;
  missionCompletionRate: number;
  failureRate: number;
  retryRate: number;
  averageLatencyMs: number;
  evidenceQuality: number;
  securityViolations: number;
  humanCorrectionRate: number;
  computeCost: number;
  modelCost: number;
  usefulStoryGeneration: number;
  outcomeQuality: number;
  moreCompletedEqualsBetterIntelligence: false;
};

export type WhyAgentWorking = {
  agentDirectoryId: string;
  whyRunning: string;
  assignedBy: string;
  missionId: string;
  canAccess: readonly string[];
  cannotAccess: readonly string[];
  budgetRemaining: number;
  completionCriteria: string;
};

export type MorningExperience = {
  briefId: string;
  tenantId: string;
  universeId: string;
  missionsCompleted: readonly string[];
  codeBuilt: readonly string[];
  testsRun: readonly string[];
  researchCompleted: readonly string[];
  databaseFindings: readonly string[];
  securityFindings: readonly string[];
  newKnowledge: readonly string[];
  contradictions: readonly string[];
  failedMissions: readonly string[];
  agentPerformance: readonly string[];
  cost: number;
  newUserStories: readonly string[];
  decisionsRequiringYou: readonly string[];
  founderEmail: 'devinhaynes2025@gmail.com';
  gmailDelivery: 'NOT_CONFIGURED';
  runs247Live: false;
};

export type BrainLesson = {
  lessonId: string;
  missionId: string;
  result: string;
  outcome: string;
  evaluation: string;
  lesson: string;
  targetBrain: 'AGENT' | 'PROJECT' | 'DEPARTMENT' | 'COMPANY';
  classification: Classification;
  autoPromotesIgnoringClassification: false;
};

export type SimulationResult = {
  simulationId: string;
  proposal: string;
  expectedOutcomes: readonly string[];
  failureModes: readonly string[];
  risk: string;
  cost: number;
  recommendation: string;
  simulationEqualsReality: false;
};

export type FounderControlAction =
  | 'VIEW'
  | 'PAUSE'
  | 'RESUME'
  | 'CANCEL'
  | 'PRIORITIZE'
  | 'APPROVE'
  | 'REJECT'
  | 'QUARANTINE'
  | 'SET_BUDGET'
  | 'SET_SHIFT_POLICY'
  | 'SET_AUTHORITY_CEILING';

export type LiveWorkforceView = {
  activeAgents: number;
  activeDepartments: number;
  activeTaskForces: number;
  currentMissions: number;
  shift: ShiftTemplateId | null;
  queueDepth: number;
  blockers: readonly string[];
  testStatus: string;
  securityStatus: string;
  databaseStatus: string;
  cost: number;
  runs247Live: false;
  indefinite247Claimed: false;
};

export type OrgMapNode = {
  id: string;
  kind: 'Founder' | 'ChiefOfStaff' | 'Department' | 'Manager' | 'TaskForce' | 'Specialist';
  label: string;
  parentId: string | null;
};

export const ANALYSIS_ROUNDS: readonly AnalysisRound[] = [
  'INDEPENDENT_ANALYSIS',
  'EVIDENCE_EXCHANGE',
  'CHALLENGE',
  'ALTERNATIVES',
  'SIMULATION',
  'SYNTHESIS',
] as const;

export const INITIAL_DEPARTMENTS: readonly DepartmentId[] = [
  'EXECUTIVE',
  'PRODUCT',
  'ENGINEERING',
  'AI_ML',
  'DATA',
  'DATABASE',
  'CLOUD_DEVOPS',
  'SECURITY',
  'QA',
  'RESEARCH',
  'KNOWLEDGE',
  'SUPPLY_CHAIN',
  'SALES',
  'MARKETING',
  'CUSTOMER',
  'FINANCE',
  'PARTNERSHIPS',
] as const;

export const SHIFT_TEMPLATE_IDS: readonly ShiftTemplateId[] = [
  'ENGINEERING_SHIFT',
  'RESEARCH_SHIFT',
  'QA_SHIFT',
  'SECURITY_SHIFT',
  'DATABASE_SHIFT',
  'KNOWLEDGE_SHIFT',
  'RELIABILITY_SHIFT',
  'PRODUCT_SHIFT',
  'SUPPLY_CHAIN_SHIFT',
  'SALES_RESEARCH_SHIFT',
  'FOUNDER_BRIEF_SHIFT',
] as const;

export const DEFAULT_WIP_LIMITS: WipLimits = {
  maxActiveMissions: 24,
  maxAgentsPerDepartment: 12,
  maxTaskForceSize: 9,
  maxResearchConcurrency: 6,
  maxEngineeringConcurrency: 6,
  maxModelSpend: 100,
  maxCloudSpend: 100,
};

export const FOUNDER_BRIEF_EMAIL = 'devinhaynes2025@gmail.com' as const;
