import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { appendLearning } from './learning-ledger';
import {
  BR_LOCKS,
  HONESTY_BANNER,
  WORKCELL_AUTHORITY_BOUNDED,
  type BrActor,
} from './structured-code-memory-types';

export type WorkcellLesson = {
  id: string;
  subject: string;
  summary: string;
  verified: boolean;
  evidenceRefs: string[];
  permissionChange: false;
  authorityExpanded: false;
  recordedAt: string;
};

export type SelfLearningWorkcell = {
  id: string;
  name: string;
  tenantId: string;
  universeId: string;
  boundPermissions: readonly string[];
  lessons: WorkcellLesson[];
  authorityCeiling: 'bounded_workcell';
  selfExpansionAllowed: false;
  productionAuthorized: false;
  l4AutonomyEnabled: false;
  createdAt: string;
};

export type WorkcellStore = {
  workcells: SelfLearningWorkcell[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'self-learning-workcells.json');
}

async function load(root: string): Promise<WorkcellStore> {
  return readJsonFile<WorkcellStore>(storePath(root), { workcells: [] });
}

async function save(root: string, store: WorkcellStore) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_BOUND_PERMISSIONS = Object.freeze([
  'local_read',
  'local_write_sandbox',
  'append_learning',
  'run_bounded_tests',
] as const);

export async function declareSelfLearningWorkcell(input: {
  name: string;
  tenantId: string;
  universeId: string;
  boundPermissions?: string[];
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const workcell: SelfLearningWorkcell = {
    id: id('wc'),
    name: input.name,
    tenantId: input.tenantId,
    universeId: input.universeId,
    boundPermissions: Object.freeze(
      (input.boundPermissions ?? [...DEFAULT_BOUND_PERMISSIONS]).slice(),
    ),
    lessons: [],
    authorityCeiling: 'bounded_workcell',
    selfExpansionAllowed: false,
    productionAuthorized: false,
    l4AutonomyEnabled: false,
    createdAt: new Date().toISOString(),
  };
  store.workcells.push(workcell);
  await save(root, store);
  return { accepted: true as const, workcell };
}

/**
 * Update workcell from a verified outcome only. Unverified outcomes are rejected.
 * Never expands permissions / authority.
 */
export async function updateWorkcellFromVerifiedOutcome(input: {
  workcellId: string;
  subject: string;
  summary: string;
  verified: boolean;
  evidenceRefs?: string[];
  requestedPermissionExpansion?: string[];
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const workcell = store.workcells.find((w) => w.id === input.workcellId);
  if (!workcell) {
    return { accepted: false as const, reason: 'WORKCELL_NOT_FOUND' };
  }

  if (input.requestedPermissionExpansion && input.requestedPermissionExpansion.length > 0) {
    return {
      accepted: false as const,
      reason: WORKCELL_AUTHORITY_BOUNDED,
      authorityExpanded: false as const,
      permissionChange: false as const,
      boundPermissions: workcell.boundPermissions,
    };
  }

  if (!input.verified) {
    return {
      accepted: false as const,
      reason: 'UNVERIFIED_OUTCOME_NOT_LEARNED',
      learnFromVerifiedOutcomesOnly: BR_LOCKS.LEARN_FROM_VERIFIED_OUTCOMES_ONLY,
    };
  }

  if (!input.evidenceRefs || input.evidenceRefs.length === 0) {
    return {
      accepted: false as const,
      reason: 'VERIFIED_OUTCOME_REQUIRES_EVIDENCE',
    };
  }

  const lesson: WorkcellLesson = {
    id: id('lesson'),
    subject: input.subject,
    summary: input.summary,
    verified: true,
    evidenceRefs: input.evidenceRefs,
    permissionChange: false,
    authorityExpanded: false,
    recordedAt: new Date().toISOString(),
  };
  workcell.lessons.push(lesson);
  workcell.lessons = workcell.lessons.slice(-2_000);
  await save(root, store);

  await appendLearning(
    {
      domain: 'engineering',
      subject: `workcell:${input.subject.slice(0, 80)}`,
      claimState: 'VERIFIED_FACT',
      summary: input.summary,
      sourceRefs: input.evidenceRefs,
      evidence: input.evidenceRefs,
      taskId: workcell.id,
    },
    root,
  );

  return {
    accepted: true as const,
    lesson,
    workcellId: workcell.id,
    authorityExpanded: false as const,
    permissionChange: false as const,
    reason: WORKCELL_AUTHORITY_BOUNDED,
  };
}

/** Probe: workcell cannot self-expand authority. */
export async function attemptWorkcellAuthorityExpansion(input: {
  workcellId: string;
  newPermissions: string[];
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const workcell = store.workcells.find((w) => w.id === input.workcellId);
  if (!workcell) {
    return { allowed: false as const, reason: 'WORKCELL_NOT_FOUND' };
  }
  return {
    allowed: false as const,
    reason: WORKCELL_AUTHORITY_BOUNDED,
    selfExpansionAllowed: false as const,
    permissionChange: false as const,
    boundPermissions: workcell.boundPermissions,
    requested: input.newPermissions,
    lock: BR_LOCKS.WORKCELL_SELF_EXPANDS_AUTHORITY,
  };
}

export async function getWorkcell(workcellId: string, root?: string) {
  const store = await load(root ?? process.cwd());
  return store.workcells.find((w) => w.id === workcellId) ?? null;
}

export function selfLearningWorkcellHonesty() {
  return {
    banner: HONESTY_BANNER,
    workcellSelfExpandsAuthority: BR_LOCKS.WORKCELL_SELF_EXPANDS_AUTHORITY,
    learningIsPermissionGrant: BR_LOCKS.LEARNING_IS_PERMISSION_GRANT,
    learnFromVerifiedOutcomesOnly: BR_LOCKS.LEARN_FROM_VERIFIED_OUTCOMES_ONLY,
    l4AutonomyEnabled: BR_LOCKS.L4_AUTONOMY_ENABLED,
  };
}
