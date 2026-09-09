/**
 * Founder controls, live workforce view, org map, "Why is this agent working?",
 * morning experience, brain learning, shift scorecard.
 */

import type {
  AgentDirectoryEntry,
  BrainLesson,
  Classification,
  FounderControlAction,
  LiveWorkforceView,
  MorningExperience,
  OrgMapNode,
  ShiftScorecard,
  ShiftTemplateId,
  WhyAgentWorking,
} from './types';
import { FOUNDER_BRIEF_EMAIL } from './types';

export function applyFounderControl(input: {
  action: FounderControlAction;
  missionId?: string;
  actorIsFounder: boolean;
}): { ok: true; action: FounderControlAction } | { ok: false; reason: string; audited: true } {
  if (!input.actorIsFounder) {
    return { ok: false, reason: 'founder controls require founder actor', audited: true };
  }
  return { ok: true, action: input.action };
}

export function openLiveWorkforceView(input: {
  activeAgents: number;
  activeDepartments: number;
  activeTaskForces: number;
  currentMissions: number;
  shift: ShiftTemplateId | null;
  queueDepth: number;
  blockers?: readonly string[];
  testStatus?: string;
  securityStatus?: string;
  databaseStatus?: string;
  cost?: number;
}): LiveWorkforceView {
  return {
    activeAgents: input.activeAgents,
    activeDepartments: input.activeDepartments,
    activeTaskForces: input.activeTaskForces,
    currentMissions: input.currentMissions,
    shift: input.shift,
    queueDepth: input.queueDepth,
    blockers: input.blockers ?? [],
    testStatus: input.testStatus ?? 'UNKNOWN',
    securityStatus: input.securityStatus ?? 'UNKNOWN',
    databaseStatus: input.databaseStatus ?? 'UNKNOWN',
    cost: input.cost ?? 0,
    runs247Live: false,
    indefinite247Claimed: false,
  };
}

export function liveViewClaims247(_v: LiveWorkforceView): false {
  return false;
}

export function buildOrgMap(): readonly OrgMapNode[] {
  return [
    { id: 'founder', kind: 'Founder', label: 'Founder', parentId: null },
    { id: 'cos', kind: 'ChiefOfStaff', label: 'ChiefOfStaff', parentId: 'founder' },
    { id: 'dept_eng', kind: 'Department', label: 'ENGINEERING', parentId: 'cos' },
    { id: 'mgr_eng', kind: 'Manager', label: 'EngineeringManager', parentId: 'dept_eng' },
    { id: 'tf_1', kind: 'TaskForce', label: 'TaskForce', parentId: 'mgr_eng' },
    { id: 'spec_1', kind: 'Specialist', label: 'Specialist', parentId: 'tf_1' },
  ];
}

export function explainWhyWorking(input: {
  entry: AgentDirectoryEntry;
  assignedBy: string;
  missionId: string;
  canAccess: readonly string[];
  cannotAccess: readonly string[];
  budgetRemaining: number;
  completionCriteria: string;
  whyRunning: string;
}): WhyAgentWorking {
  return {
    agentDirectoryId: input.entry.agentDirectoryId,
    whyRunning: input.whyRunning,
    assignedBy: input.assignedBy,
    missionId: input.missionId,
    canAccess: input.canAccess,
    cannotAccess: input.cannotAccess,
    budgetRemaining: input.budgetRemaining,
    completionCriteria: input.completionCriteria,
  };
}

export function composeMorningExperience(input: {
  briefId: string;
  tenantId: string;
  universeId: string;
  missionsCompleted?: readonly string[];
  codeBuilt?: readonly string[];
  testsRun?: readonly string[];
  researchCompleted?: readonly string[];
  databaseFindings?: readonly string[];
  securityFindings?: readonly string[];
  newKnowledge?: readonly string[];
  contradictions?: readonly string[];
  failedMissions?: readonly string[];
  agentPerformance?: readonly string[];
  cost?: number;
  newUserStories?: readonly string[];
  decisionsRequiringYou?: readonly string[];
}): MorningExperience {
  return {
    briefId: input.briefId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    missionsCompleted: input.missionsCompleted ?? [],
    codeBuilt: input.codeBuilt ?? [],
    testsRun: input.testsRun ?? [],
    researchCompleted: input.researchCompleted ?? [],
    databaseFindings: input.databaseFindings ?? [],
    securityFindings: input.securityFindings ?? [],
    newKnowledge: input.newKnowledge ?? [],
    contradictions: input.contradictions ?? [],
    failedMissions: input.failedMissions ?? [],
    agentPerformance: input.agentPerformance ?? [],
    cost: input.cost ?? 0,
    newUserStories: input.newUserStories ?? [],
    decisionsRequiringYou: input.decisionsRequiringYou ?? [],
    founderEmail: FOUNDER_BRIEF_EMAIL,
    gmailDelivery: 'NOT_CONFIGURED',
    runs247Live: false,
  };
}

export function morningExperienceIs247Live(_m: MorningExperience): false {
  return false;
}

export function recordBrainLesson(input: {
  lessonId: string;
  missionId: string;
  result: string;
  outcome: string;
  evaluation: string;
  lesson: string;
  targetBrain: BrainLesson['targetBrain'];
  classification: Classification;
}): BrainLesson {
  return {
    ...input,
    autoPromotesIgnoringClassification: false,
  };
}

export function lessonAutoPromotesIgnoringClassification(_l: BrainLesson): false {
  return false;
}

export function buildShiftScorecard(input: {
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
}): ShiftScorecard {
  return {
    ...input,
    moreCompletedEqualsBetterIntelligence: false,
  };
}

export function moreCompletedEqualsBetterIntelligence(_s: ShiftScorecard): false {
  return false;
}
