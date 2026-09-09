import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BR_LOCKS,
  COMPILER_CANDIDATE_ONLY,
  HONESTY_BANNER,
  SKILL_NO_PERMISSION_ESCALATION,
  UNVERIFIED_NOT_TRUSTED,
  type BrActor,
  type KnowledgeTrust,
} from './structured-code-memory-types';

export type CompilerArtifactKind =
  | 'knowledge'
  | 'debugging_exercise'
  | 'skill'
  | 'test_helper'
  | 'tool_candidate';

export type CompiledArtifact = {
  id: string;
  kind: CompilerArtifactKind;
  title: string;
  body: string;
  sourceRefs: string[];
  verifiedSource: boolean;
  trust: KnowledgeTrust;
  permissionChange: false;
  permissionEscalation: false;
  productionAuthority: false;
  underReview: boolean;
  status: 'candidate_under_review' | 'rejected_unverified' | 'rejected_hidden_trace';
  compiledAt: string;
  actorId: string;
};

export type CompilerStore = {
  artifacts: CompiledArtifact[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'superbrain-software-knowledge-compiler.json');
}

async function load(root: string): Promise<CompilerStore> {
  return readJsonFile<CompilerStore>(storePath(root), { artifacts: [] });
}

async function save(root: string, store: CompilerStore) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Compile verified fixes/failures/tests/notes/patterns into reusable candidates
 * that strengthen Global Operations Superbrain — under review, not silent production authority.
 *
 * Unverified fixes are NOT compiled into trusted reusable knowledge.
 * Skills / exercises never escalate permissions.
 */
export async function compileSoftwareKnowledge(input: {
  kind: CompilerArtifactKind;
  title: string;
  body: string;
  sourceRefs?: string[];
  /** Must be true for candidate_under_review trust; false → rejected_unverified. */
  verifiedSource: boolean;
  /** If true, treat as attempt to grant elevated permissions — DENIED. */
  requestPermissionEscalation?: boolean;
  /** Forbidden private fields — if present, reject. */
  payload?: Record<string, unknown>;
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (input.payload) {
    const keys = Object.keys(input.payload).map((k) => k.toLowerCase());
    if (
      keys.some(
        (k) =>
          k === 'hidden_reasoning_trace' ||
          k.includes('private_cot') ||
          k.includes('hidden_reasoning') ||
          k.includes('private_chain_of_thought'),
      )
    ) {
      return {
        accepted: false as const,
        reason: 'HIDDEN_REASONING_TRACE_DENIED',
        compiled: false as const,
      };
    }
  }

  if (input.requestPermissionEscalation) {
    return {
      accepted: false as const,
      reason: SKILL_NO_PERMISSION_ESCALATION,
      permissionEscalation: false as const,
      permissionChange: false as const,
      skillIsPermissionGrant: BR_LOCKS.SKILL_IS_PERMISSION_GRANT,
      exerciseIsPermissionGrant: BR_LOCKS.EXERCISE_IS_PERMISSION_GRANT,
    };
  }

  if (!input.verifiedSource) {
    const rejected: CompiledArtifact = {
      id: id('compile'),
      kind: input.kind,
      title: input.title,
      body: input.body,
      sourceRefs: input.sourceRefs ?? [],
      verifiedSource: false,
      trust: 'untrusted',
      permissionChange: false,
      permissionEscalation: false,
      productionAuthority: false,
      underReview: false,
      status: 'rejected_unverified',
      compiledAt: new Date().toISOString(),
      actorId: input.actor.id,
    };
    store.artifacts.push(rejected);
    await save(root, store);
    return {
      accepted: false as const,
      reason: UNVERIFIED_NOT_TRUSTED,
      artifact: rejected,
      trust: 'untrusted' as const,
      compiledIntoTrustedKnowledge: false as const,
    };
  }

  const artifact: CompiledArtifact = {
    id: id('compile'),
    kind: input.kind,
    title: input.title,
    body: input.body,
    sourceRefs: input.sourceRefs ?? [],
    verifiedSource: true,
    trust: 'candidate_under_review',
    permissionChange: false,
    permissionEscalation: false,
    productionAuthority: false,
    underReview: true,
    status: 'candidate_under_review',
    compiledAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  store.artifacts.push(artifact);
  store.artifacts = store.artifacts.slice(-5_000);
  await save(root, store);

  return {
    accepted: true as const,
    artifact,
    reason: COMPILER_CANDIDATE_ONLY,
    trust: artifact.trust,
    productionAuthority: false as const,
    compilerSilentProductionAuthority: BR_LOCKS.COMPILER_SILENT_PRODUCTION_AUTHORITY,
    permissionEscalation: false as const,
  };
}

/** Probe: promote compiler candidate to silent production authority — DENIED. */
export async function attemptPromoteCompilerToProduction(input: {
  artifactId: string;
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const artifact = store.artifacts.find((a) => a.id === input.artifactId);
  if (!artifact) {
    return { allowed: false as const, reason: 'ARTIFACT_NOT_FOUND' };
  }
  return {
    allowed: false as const,
    reason: COMPILER_CANDIDATE_ONLY,
    productionAuthority: false as const,
    trust: artifact.trust,
    underReview: artifact.underReview,
    lock: BR_LOCKS.COMPILER_SILENT_PRODUCTION_AUTHORITY,
  };
}

/** Probe: skill/exercise escalates permissions — DENIED. */
export async function attemptSkillPermissionEscalation(input: {
  artifactId: string;
  newPermissions: string[];
  actor: BrActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const artifact = store.artifacts.find((a) => a.id === input.artifactId);
  if (!artifact) {
    return { allowed: false as const, reason: 'ARTIFACT_NOT_FOUND' };
  }
  return {
    allowed: false as const,
    reason: SKILL_NO_PERMISSION_ESCALATION,
    permissionEscalation: false as const,
    permissionChange: false as const,
    kind: artifact.kind,
    requested: input.newPermissions,
  };
}

export async function listCompiledArtifacts(root?: string) {
  const store = await load(root ?? process.cwd());
  return store.artifacts;
}

export function softwareKnowledgeCompilerHonesty() {
  return {
    banner: HONESTY_BANNER,
    unverifiedFixTrustedKnowledge: BR_LOCKS.UNVERIFIED_FIX_TRUSTED_KNOWLEDGE,
    compilerSilentProductionAuthority: BR_LOCKS.COMPILER_SILENT_PRODUCTION_AUTHORITY,
    skillIsPermissionGrant: BR_LOCKS.SKILL_IS_PERMISSION_GRANT,
    exerciseIsPermissionGrant: BR_LOCKS.EXERCISE_IS_PERMISSION_GRANT,
    learnFromVerifiedOutcomesOnly: BR_LOCKS.LEARN_FROM_VERIFIED_OUTCOMES_ONLY,
  };
}
