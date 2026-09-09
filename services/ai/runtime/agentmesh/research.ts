/**
 * 62L-EW1–EW5 Offline Research Mission + Safe Web/TI + Branch/Return Mesh.
 * Extends existing Agent Mesh — not a second agent framework.
 * Soft-wires 2I-LA-61O hardening + GOB orchestration via existsSync; presence ≠ VERIFIED.
 * L4_AUTONOMY_ENABLED=false. No hidden chain-of-thought persistence.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APPROVED_ONLINE_SOURCE_CLASSES,
  CONCEPT_TRANSLATIONS,
  DENIED_RESEARCH_SOURCE_CLASSES,
  EW_LOCKS,
  LAWFUL_DEFENSIVE_TI_CLASSES,
  RESEARCH_RUNTIME_STATES,
  type ApprovedOnlineSourceClass,
  type DeniedResearchSourceClass,
  type LawfulDefensiveTiClass,
  type ResearchDataClass,
  type ResearchEvidenceClass,
  type ResearchRuntimeState,
  type ResearchSourceDisposition,
} from './types';

const HERE = dirname(fileURLToPath(import.meta.url));
const AI_ROOT = join(HERE, '..', '..');
/** Worktree root for .wt-ew1-ew5 (or repo root when not in a nested worktree). */
const WORKTREE_ROOT = join(AI_ROOT, '..', '..');
/** Parent of nested worktrees (e.g. /workspace when this is /workspace/.wt-ew1-ew5). */
const WORKSPACE_PARENT = join(WORKTREE_ROOT, '..');

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
  verified: false;
};

export type OfflineResearchMission = {
  missionId: string;
  taskId: string;
  agentId: string;
  tenantId: string;
  universeId: string;
  approvedSourceClasses: readonly ApprovedOnlineSourceClass[];
  allowedDataClasses: readonly ResearchDataClass[];
  computeBudget: number;
  maxChildren: number;
  expiry: string;
  stopConditions: readonly string[];
  evidenceRequirements: readonly string[];
  returnPath: string;
  state: ResearchRuntimeState;
  requiresWebOrApi: boolean;
  verifiedConnection: boolean;
  parentTaskId: string | null;
  l4Enabled: false;
  hiddenCotPersistence: false;
};

export type ResearchChildSpec = {
  childTaskId: string;
  childAgentId: string;
  parentTaskId: string;
  tenantId: string;
  universeId: string;
  approvedSourceClasses: readonly ApprovedOnlineSourceClass[];
  allowedDataClasses: readonly ResearchDataClass[];
  computeBudget: number;
  expiry: string;
  evidenceRequirements: readonly string[];
  returnPath: string;
};

export type ResearchChildReturn = {
  finding: string;
  sourceRefs: readonly string[];
  evidenceClass: ResearchEvidenceClass;
  confidence: number;
  contradictions: readonly string[];
  tests: readonly string[];
  blockers: readonly string[];
  candidateLesson: string | null;
  nextExperiment: string | null;
};

export type HomeBaseResearchReceipt = {
  receiptId: string;
  missionId: string;
  taskId: string;
  agentId: string;
  tenantId: string;
  universeId: string;
  state: 'COMPLETED';
  finding: string;
  sourceRefs: readonly string[];
  evidenceClass: ResearchEvidenceClass;
  confidence: number;
  contradictions: readonly string[];
  tests: readonly string[];
  blockers: readonly string[];
  candidateLesson: string | null;
  nextExperiment: string | null;
  returnPath: string;
  returnedAt: string;
  hiddenCotPersisted: false;
  l4Enabled: false;
};

export type ResearchAdvanceResult =
  | { ok: true; mission: OfflineResearchMission }
  | { ok: false; reason: string; state: ResearchRuntimeState; mission: OfflineResearchMission };

export type SourceEvaluation = {
  sourceClass: string;
  disposition: ResearchSourceDisposition;
  reason: string;
};

export type ChildSpawnResult =
  | { allowed: true; child: OfflineResearchMission }
  | { allowed: false; reason: string };

export type ChildReturnResult =
  | { allowed: true; receipt: ResearchChildReturn & { parentTaskId: string; accepted: true } }
  | { allowed: false; reason: string };

export type HandoffEvalResult =
  | { allowed: true }
  | { allowed: false; reason: string };

function softWire(relFromAiRoot: string, notePresent: string, noteAbsent: string): SoftWirePresence {
  const pathChecked = join(AI_ROOT, relFromAiRoot);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
    verified: false,
  };
}

/** Soft-wire for 61O via sibling worktree path (existsSync only). */
export function probe61oHardening(): SoftWirePresence {
  const candidates = [
    join(WORKSPACE_PARENT, '.wt-61o-v741', 'services', 'ai', 'runtime', 'agentmesh', 'runtime.ts'),
    join(WORKTREE_ROOT, '.wt-61o-v741', 'services', 'ai', 'runtime', 'agentmesh', 'runtime.ts'),
  ];
  for (const pathChecked of candidates) {
    if (existsSync(pathChecked)) {
      return {
        present: true,
        pathChecked,
        note: '2I-LA-61O AgentMesh hardening worktree present via existsSync — soft-wire only; presence ≠ VERIFIED.',
        verified: false,
      };
    }
  }
  return {
    present: false,
    pathChecked: candidates[0]!,
    note: '2I-LA-61O hardening worktree absent → WAITING_DATA (not FAIL).',
    verified: false,
  };
}

export function probeGobOrchestration(): SoftWirePresence {
  const candidates = [
    join(AI_ROOT, 'orchestration', 'types.ts'),
    // Sibling main checkout on GOB branch (soft only).
    join(WORKSPACE_PARENT, 'services', 'ai', 'orchestration', 'types.ts'),
    join(WORKTREE_ROOT, 'services', 'ai', 'orchestration', 'types.ts'),
  ];
  for (const pathChecked of candidates) {
    if (existsSync(pathChecked)) {
      return {
        present: true,
        pathChecked,
        note: 'GOB local-first orchestration present via existsSync — soft-wire only; presence ≠ VERIFIED.',
        verified: false,
      };
    }
  }
  return {
    present: false,
    pathChecked: candidates[0]!,
    note: 'GOB orchestration absent on this tip → WAITING_DATA (not FAIL).',
    verified: false,
  };
}

/** Soft-wire audit — presence ≠ VERIFIED. Absent → WAITING_DATA hop, not FAIL. */
export function auditEwSoftWires(): {
  agentMeshRuntime: SoftWirePresence;
  agentMeshSync: SoftWirePresence;
  agentsRuntime: SoftWirePresence;
  agentMeetings: SoftWirePresence;
  hardening61oRuntime: SoftWirePresence;
  gobOrchestration: SoftWirePresence;
  gobLocalWorker: SoftWirePresence;
} {
  const gob = probeGobOrchestration();
  const gobWorkerPath = gob.present
    ? gob.pathChecked.replace(/types\.ts$/, 'local-worker.ts')
    : join(AI_ROOT, 'orchestration', 'local-worker.ts');
  return {
    agentMeshRuntime: softWire(
      'runtime/agentmesh/runtime.ts',
      'Agent mesh runtime present (extend-in-place).',
      'Agent mesh runtime absent → WAITING_DATA.',
    ),
    agentMeshSync: softWire(
      'runtime/agentmesh/sync.ts',
      'Agent mesh sync present.',
      'Agent mesh sync absent → WAITING_DATA.',
    ),
    agentsRuntime: softWire(
      'runtime/agents.ts',
      'agents.ts soft-wired.',
      'agents.ts absent → WAITING_DATA.',
    ),
    agentMeetings: softWire(
      'runtime/agentmeetings/index.ts',
      'agentmeetings soft-wired.',
      'agentmeetings absent → WAITING_DATA.',
    ),
    hardening61oRuntime: probe61oHardening(),
    gobOrchestration: gob,
    gobLocalWorker: {
      present: existsSync(gobWorkerPath),
      pathChecked: gobWorkerPath,
      note: existsSync(gobWorkerPath)
        ? 'GOB local-worker soft-wired (present).'
        : 'GOB local-worker absent → WAITING_DATA (not FAIL).',
      verified: false,
    },
  };
}

export function listResearchRuntimeStates(): readonly ResearchRuntimeState[] {
  return RESEARCH_RUNTIME_STATES;
}

export function listApprovedOnlineSourceClasses(): readonly ApprovedOnlineSourceClass[] {
  return APPROVED_ONLINE_SOURCE_CLASSES;
}

export function listDeniedResearchSourceClasses(): readonly DeniedResearchSourceClass[] {
  return DENIED_RESEARCH_SOURCE_CLASSES;
}

export function listLawfulDefensiveTiClasses(): readonly LawfulDefensiveTiClass[] {
  return LAWFUL_DEFENSIVE_TI_CLASSES;
}

export function conceptTranslations() {
  return CONCEPT_TRANSLATIONS;
}

export function ewL4AutonomyEnabled(): false {
  return EW_LOCKS.L4_AUTONOMY_ENABLED;
}

export function ewHiddenCotPersistenceAllowed(): false {
  return EW_LOCKS.HIDDEN_COT_PERSISTENCE;
}

export function assertEwLocksIntact(): boolean {
  return (
    EW_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EW_LOCKS.TIP_LAND === false &&
    EW_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EW_LOCKS.PRODUCTION_WRITE === false &&
    EW_LOCKS.MERGE_MAIN === false &&
    EW_LOCKS.MANAGE_PULL_REQUEST === false &&
    EW_LOCKS.FABRICATE_LIVE_RESEARCH_WHEN_OFFLINE === false &&
    EW_LOCKS.HIDDEN_COT_PERSISTENCE === false &&
    EW_LOCKS.CHILD_PERMISSION_EXPANSION === false &&
    EW_LOCKS.CROSS_TENANT_HANDOFF === false &&
    EW_LOCKS.CROSS_UNIVERSE_HANDOFF === false &&
    EW_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    EW_LOCKS.ILLICIT_SOURCE_USE === false &&
    EW_LOCKS.PRESENCE_EQ_VERIFIED === false
  );
}

function isApprovedSource(c: string): c is ApprovedOnlineSourceClass {
  return (APPROVED_ONLINE_SOURCE_CLASSES as readonly string[]).includes(c);
}

function isDeniedSource(c: string): c is DeniedResearchSourceClass {
  return (DENIED_RESEARCH_SOURCE_CLASSES as readonly string[]).includes(c);
}

function isSubset<T extends string>(child: readonly T[], parent: readonly T[]): boolean {
  const set = new Set(parent);
  return child.every((x) => set.has(x));
}

function isExpired(expiryIso: string, nowIso: string): boolean {
  return Date.parse(nowIso) > Date.parse(expiryIso);
}

export function createOfflineResearchMission(input: {
  missionId: string;
  taskId: string;
  agentId: string;
  tenantId: string;
  universeId: string;
  approvedSourceClasses: readonly ApprovedOnlineSourceClass[];
  allowedDataClasses: readonly ResearchDataClass[];
  computeBudget: number;
  maxChildren: number;
  expiry: string;
  stopConditions?: readonly string[];
  evidenceRequirements: readonly string[];
  returnPath: string;
  requiresWebOrApi?: boolean;
  verifiedConnection?: boolean;
  parentTaskId?: string | null;
  now?: string;
}): ResearchAdvanceResult {
  if (!assertEwLocksIntact() || EW_LOCKS.L4_AUTONOMY_ENABLED) {
    const blocked: OfflineResearchMission = {
      missionId: input.missionId,
      taskId: input.taskId,
      agentId: input.agentId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      approvedSourceClasses: input.approvedSourceClasses,
      allowedDataClasses: input.allowedDataClasses,
      computeBudget: input.computeBudget,
      maxChildren: input.maxChildren,
      expiry: input.expiry,
      stopConditions: input.stopConditions ?? ['EXPIRY', 'REVOCATION', 'BUDGET_EXHAUSTED'],
      evidenceRequirements: input.evidenceRequirements,
      returnPath: input.returnPath,
      state: 'BLOCKED',
      requiresWebOrApi: input.requiresWebOrApi === true,
      verifiedConnection: input.verifiedConnection === true,
      parentTaskId: input.parentTaskId ?? null,
      l4Enabled: false,
      hiddenCotPersistence: false,
    };
    return { ok: false, reason: 'L4_AUTONOMY_MUST_REMAIN_FALSE', state: 'BLOCKED', mission: blocked };
  }

  const now = input.now ?? new Date().toISOString();
  const requiresWebOrApi = input.requiresWebOrApi === true;
  const verifiedConnection = input.verifiedConnection === true;

  let state: ResearchRuntimeState = verifiedConnection ? 'ONLINE_READY' : 'LOCAL_READY';

  if (isExpired(input.expiry, now)) {
    state = 'BLOCKED';
  } else if (requiresWebOrApi && !verifiedConnection) {
    // OFFLINE RULE: never fabricate live/current research.
    state = 'WAITING_DATA';
  }

  const mission: OfflineResearchMission = {
    missionId: input.missionId,
    taskId: input.taskId,
    agentId: input.agentId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    approvedSourceClasses: [...input.approvedSourceClasses],
    allowedDataClasses: [...input.allowedDataClasses],
    computeBudget: input.computeBudget,
    maxChildren: input.maxChildren,
    expiry: input.expiry,
    stopConditions: input.stopConditions ?? ['EXPIRY', 'REVOCATION', 'BUDGET_EXHAUSTED'],
    evidenceRequirements: [...input.evidenceRequirements],
    returnPath: input.returnPath,
    state,
    requiresWebOrApi,
    verifiedConnection,
    parentTaskId: input.parentTaskId ?? null,
    l4Enabled: false,
    hiddenCotPersistence: false,
  };

  if (state === 'BLOCKED') {
    return { ok: false, reason: 'RESEARCH_TASK_EXPIRED', state, mission };
  }
  if (state === 'WAITING_DATA') {
    return {
      ok: false,
      reason: 'WEB_OR_API_REQUIRED_WITHOUT_VERIFIED_CONNECTION',
      state,
      mission,
    };
  }
  return { ok: true, mission };
}

export function advanceResearchMission(
  mission: OfflineResearchMission,
  input: {
    now?: string;
    revoked?: boolean;
    nodeAvailable?: boolean;
    verifiedConnection?: boolean;
    markRunningVerified?: boolean;
  } = {},
): ResearchAdvanceResult {
  const now = input.now ?? new Date().toISOString();
  let next: OfflineResearchMission = { ...mission };

  if (input.revoked === true) {
    next = { ...next, state: 'REVOKED' };
    return { ok: false, reason: 'RESEARCH_REVOKED', state: 'REVOKED', mission: next };
  }

  if (isExpired(next.expiry, now) || next.stopConditions.includes('EXPIRY') && isExpired(next.expiry, now)) {
    next = { ...next, state: 'BLOCKED' };
    return { ok: false, reason: 'RESEARCH_TASK_EXPIRED', state: 'BLOCKED', mission: next };
  }

  if (input.nodeAvailable === false) {
    next = { ...next, state: 'WAITING_NODE' };
    return { ok: false, reason: 'WAITING_NODE', state: 'WAITING_NODE', mission: next };
  }

  const verified =
    input.verifiedConnection !== undefined ? input.verifiedConnection : next.verifiedConnection;
  next = { ...next, verifiedConnection: verified };

  if (next.requiresWebOrApi && !verified) {
    if (EW_LOCKS.FABRICATE_LIVE_RESEARCH_WHEN_OFFLINE) {
      next = { ...next, state: 'BLOCKED' };
      return { ok: false, reason: 'FABRICATE_LIVE_RESEARCH_FORBIDDEN', state: 'BLOCKED', mission: next };
    }
    next = { ...next, state: 'WAITING_DATA' };
    return {
      ok: false,
      reason: 'WEB_OR_API_REQUIRED_WITHOUT_VERIFIED_CONNECTION',
      state: 'WAITING_DATA',
      mission: next,
    };
  }

  if (input.markRunningVerified === true) {
    next = { ...next, state: 'RUNNING_VERIFIED' };
    return { ok: true, mission: next };
  }

  next = {
    ...next,
    state: verified ? 'ONLINE_READY' : 'LOCAL_READY',
  };
  return { ok: true, mission: next };
}

export function evaluateResearchSource(input: {
  sourceClass: string;
  missionApprovedClasses: readonly ApprovedOnlineSourceClass[];
  defensiveTiClass?: string;
}): SourceEvaluation {
  if (isDeniedSource(input.sourceClass)) {
    return {
      sourceClass: input.sourceClass,
      disposition: 'QUARANTINED',
      reason: `DENIED_SOURCE:${input.sourceClass}`,
    };
  }

  if (input.defensiveTiClass) {
    const lawful = (LAWFUL_DEFENSIVE_TI_CLASSES as readonly string[]).includes(input.defensiveTiClass);
    if (!lawful) {
      return {
        sourceClass: input.sourceClass,
        disposition: 'DENIED',
        reason: `DEFENSIVE_TI_NOT_LAWFUL:${input.defensiveTiClass}`,
      };
    }
  }

  if (!isApprovedSource(input.sourceClass)) {
    return {
      sourceClass: input.sourceClass,
      disposition: 'DENIED',
      reason: `SOURCE_CLASS_NOT_APPROVED:${input.sourceClass}`,
    };
  }

  if (!input.missionApprovedClasses.includes(input.sourceClass)) {
    return {
      sourceClass: input.sourceClass,
      disposition: 'DENIED',
      reason: `SOURCE_NOT_IN_MISSION_APPROVAL:${input.sourceClass}`,
    };
  }

  return {
    sourceClass: input.sourceClass,
    disposition: 'ALLOWED',
    reason: 'AUTHORIZED_PUBLIC_OR_LICENSED_SOURCE',
  };
}

export function spawnResearchChild(
  parent: OfflineResearchMission,
  child: ResearchChildSpec,
  opts: { now?: string; currentChildCount?: number } = {},
): ChildSpawnResult {
  const now = opts.now ?? new Date().toISOString();
  const current = opts.currentChildCount ?? 0;

  if (parent.state === 'REVOKED' || parent.state === 'BLOCKED') {
    return { allowed: false, reason: `PARENT_STATE_${parent.state}` };
  }
  if (isExpired(parent.expiry, now)) {
    return { allowed: false, reason: 'PARENT_EXPIRED' };
  }
  if (current >= parent.maxChildren) {
    return { allowed: false, reason: 'MAX_CHILDREN_EXCEEDED' };
  }
  if (child.parentTaskId !== parent.taskId) {
    return { allowed: false, reason: 'PARENT_TASK_ID_MISMATCH' };
  }
  if (child.tenantId !== parent.tenantId) {
    return { allowed: false, reason: 'CROSS_TENANT_CHILD_DENIED' };
  }
  if (child.universeId !== parent.universeId) {
    return { allowed: false, reason: 'CROSS_UNIVERSE_CHILD_DENIED' };
  }
  if (child.computeBudget > parent.computeBudget) {
    return { allowed: false, reason: 'CHILD_BUDGET_EXPANSION_DENIED' };
  }
  if (isExpired(child.expiry, now) || Date.parse(child.expiry) > Date.parse(parent.expiry)) {
    return { allowed: false, reason: 'CHILD_EXPIRY_INVALID' };
  }
  if (!isSubset(child.approvedSourceClasses, parent.approvedSourceClasses)) {
    return { allowed: false, reason: 'CHILD_SOURCE_PERMISSION_EXPANSION_DENIED' };
  }
  if (!isSubset(child.allowedDataClasses, parent.allowedDataClasses)) {
    return { allowed: false, reason: 'CHILD_DATA_PERMISSION_EXPANSION_DENIED' };
  }
  if (EW_LOCKS.CHILD_PERMISSION_EXPANSION) {
    return { allowed: false, reason: 'CHILD_PERMISSION_EXPANSION_LOCK' };
  }

  const created = createOfflineResearchMission({
    missionId: parent.missionId,
    taskId: child.childTaskId,
    agentId: child.childAgentId,
    tenantId: child.tenantId,
    universeId: child.universeId,
    approvedSourceClasses: child.approvedSourceClasses,
    allowedDataClasses: child.allowedDataClasses,
    computeBudget: child.computeBudget,
    maxChildren: 0,
    expiry: child.expiry,
    evidenceRequirements: child.evidenceRequirements,
    returnPath: child.returnPath,
    requiresWebOrApi: parent.requiresWebOrApi,
    verifiedConnection: parent.verifiedConnection,
    parentTaskId: parent.taskId,
    now,
  });

  return { allowed: true, child: created.mission };
}

export function acceptResearchChildReturn(
  parent: OfflineResearchMission,
  payload: {
    parentTaskId: string;
    tenantId: string;
    universeId: string;
    finding: string;
    sourceRefs: readonly string[];
    evidenceClass: ResearchEvidenceClass;
    confidence: number;
    contradictions?: readonly string[];
    tests?: readonly string[];
    blockers?: readonly string[];
    candidateLesson?: string | null;
    nextExperiment?: string | null;
    /** Must never be accepted / persisted. */
    hiddenChainOfThought?: unknown;
  },
): ChildReturnResult {
  if (payload.parentTaskId !== parent.taskId) {
    return { allowed: false, reason: 'PARENT_TASK_MISMATCH' };
  }
  if (payload.tenantId !== parent.tenantId) {
    return { allowed: false, reason: 'CROSS_TENANT_RETURN_DENIED' };
  }
  if (payload.universeId !== parent.universeId) {
    return { allowed: false, reason: 'CROSS_UNIVERSE_RETURN_DENIED' };
  }
  if (payload.hiddenChainOfThought !== undefined) {
    return { allowed: false, reason: 'HIDDEN_COT_PERSISTENCE_DENIED' };
  }
  if (EW_LOCKS.HIDDEN_COT_PERSISTENCE) {
    return { allowed: false, reason: 'HIDDEN_COT_LOCK_VIOLATION' };
  }

  const receipt = {
    finding: payload.finding,
    sourceRefs: [...payload.sourceRefs],
    evidenceClass: payload.evidenceClass,
    confidence: payload.confidence,
    contradictions: [...(payload.contradictions ?? [])],
    tests: [...(payload.tests ?? [])],
    blockers: [...(payload.blockers ?? [])],
    candidateLesson: payload.candidateLesson ?? null,
    nextExperiment: payload.nextExperiment ?? null,
    parentTaskId: parent.taskId,
    accepted: true as const,
  };

  return { allowed: true, receipt };
}

export function evaluateResearchHandoff(input: {
  fromTenantId: string;
  toTenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
}): HandoffEvalResult {
  if (input.fromTenantId !== input.toTenantId) {
    return { allowed: false, reason: 'CROSS_TENANT_HANDOFF_DENIED' };
  }
  if (input.fromUniverseId !== input.toUniverseId) {
    return { allowed: false, reason: 'CROSS_UNIVERSE_HANDOFF_DENIED' };
  }
  if (EW_LOCKS.CROSS_TENANT_HANDOFF || EW_LOCKS.CROSS_UNIVERSE_HANDOFF) {
    return { allowed: false, reason: 'HANDOFF_LOCK_VIOLATION' };
  }
  return { allowed: true };
}

export function completeResearchToHomeBase(
  mission: OfflineResearchMission,
  payload: {
    finding: string;
    sourceRefs: readonly string[];
    evidenceClass: ResearchEvidenceClass;
    confidence: number;
    contradictions?: readonly string[];
    tests?: readonly string[];
    blockers?: readonly string[];
    candidateLesson?: string | null;
    nextExperiment?: string | null;
    returnedAt?: string;
    hiddenChainOfThought?: unknown;
  },
):
  | { allowed: true; receipt: HomeBaseResearchReceipt; mission: OfflineResearchMission }
  | { allowed: false; reason: string; mission: OfflineResearchMission } {
  if (payload.hiddenChainOfThought !== undefined) {
    return { allowed: false, reason: 'HIDDEN_COT_PERSISTENCE_DENIED', mission };
  }
  if (mission.state === 'REVOKED') {
    return { allowed: false, reason: 'MISSION_REVOKED', mission };
  }
  if (mission.state === 'WAITING_DATA') {
    return {
      allowed: false,
      reason: 'CANNOT_COMPLETE_WHILE_WAITING_DATA',
      mission,
    };
  }
  if (mission.state === 'BLOCKED') {
    return { allowed: false, reason: 'MISSION_BLOCKED', mission };
  }

  const completed: OfflineResearchMission = { ...mission, state: 'COMPLETED' };
  const receipt: HomeBaseResearchReceipt = {
    receiptId: `hb-research-${mission.missionId}-${mission.taskId}`,
    missionId: mission.missionId,
    taskId: mission.taskId,
    agentId: mission.agentId,
    tenantId: mission.tenantId,
    universeId: mission.universeId,
    state: 'COMPLETED',
    finding: payload.finding,
    sourceRefs: [...payload.sourceRefs],
    evidenceClass: payload.evidenceClass,
    confidence: payload.confidence,
    contradictions: [...(payload.contradictions ?? [])],
    tests: [...(payload.tests ?? [])],
    blockers: [...(payload.blockers ?? [])],
    candidateLesson: payload.candidateLesson ?? null,
    nextExperiment: payload.nextExperiment ?? null,
    returnPath: mission.returnPath,
    returnedAt: payload.returnedAt ?? new Date().toISOString(),
    hiddenCotPersisted: false,
    l4Enabled: false,
  };

  return { allowed: true, receipt, mission: completed };
}
