/**
 * 62L-CH Agent Department Universities — department-level universities with
 * skill transcripts + evaluation gates. Learning measurable + reversible;
 * skill ≠ permission/authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CH_LOCKS,
  DEPARTMENT_KEYS,
  EVALUATION_DECAY_REVERSES_TRUST,
  HONESTY_BANNER,
  SKILL_TRANSCRIPT_NOT_PERMISSION,
  type ChActor,
  type DepartmentKey,
} from './knowledge-civilization-dept-universities-types';

export type SkillTrustState = 'candidate' | 'trusted' | 'decayed' | 'reversed' | 'failed';

export type DepartmentUniversity = {
  id: string;
  department: DepartmentKey;
  title: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type SkillTranscript = {
  id: string;
  universityId: string;
  agentId: string;
  skillKey: string;
  score: number;
  measurable: true;
  reversible: true;
  trustState: SkillTrustState;
  permissionLevel: number;
  authorityLevel: number;
  skillIsPermissionGrant: false;
  learningIsAuthority: false;
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
};

type Store = {
  universities: DepartmentUniversity[];
  transcripts: SkillTranscript[];
  denials: Array<{ id: string; at: string; reason: string; agentId: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-department-universities.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    universities: [],
    transcripts: [],
    denials: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function departmentUniversitiesHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CH_LOCKS.L4_AUTONOMY_ENABLED,
    skillIsPermission: CH_LOCKS.SKILL_IS_PERMISSION,
    skillIsAuthority: CH_LOCKS.SKILL_IS_AUTHORITY,
    learningMeasurable: CH_LOCKS.LEARNING_MEASURABLE,
    learningReversible: CH_LOCKS.LEARNING_REVERSIBLE,
    departments: [...DEPARTMENT_KEYS],
  };
}

export async function openDepartmentUniversity(input: {
  department: DepartmentKey;
  title?: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: ChActor;
}): Promise<DepartmentUniversity> {
  const store = await load(input.root);
  const uni: DepartmentUniversity = {
    id: id('uni'),
    department: input.department,
    title: input.title?.trim() || `${input.department} University`,
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.universities.push(uni);
  await save(input.root, store);
  return uni;
}

export async function recordSkillTranscript(input: {
  universityId: string;
  agentId: string;
  skillKey: string;
  score: number;
  evidenceRefs?: string[];
  currentPermissionLevel?: number;
  currentAuthorityLevel?: number;
  attemptPermissionGrantViaTranscript?: boolean;
  attemptAuthorityIncrease?: boolean;
  root: string;
  actor: ChActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  transcript: SkillTranscript | null;
  permissionIncreased: false;
  authorityIncreased: false;
  skillIsPermissionGrant: false;
}> {
  const baselinePermission = input.currentPermissionLevel ?? 0;
  const baselineAuthority = input.currentAuthorityLevel ?? 0;
  const store = await load(input.root);

  const deny = async (reason: string) => {
    store.denials.push({
      id: id('deny'),
      at: new Date().toISOString(),
      reason,
      agentId: input.agentId,
    });
    await save(input.root, store);
    return {
      accepted: false,
      reason,
      transcript: null,
      permissionIncreased: false as const,
      authorityIncreased: false as const,
      skillIsPermissionGrant: false as const,
    };
  };

  if (input.attemptPermissionGrantViaTranscript || input.attemptAuthorityIncrease) {
    return deny(SKILL_TRANSCRIPT_NOT_PERMISSION);
  }

  const uni = store.universities.find((u) => u.id === input.universityId);
  if (!uni) return deny('UNIVERSITY_NOT_FOUND');

  const score = Math.max(0, Math.min(1, Number(input.score) || 0));
  const transcript: SkillTranscript = {
    id: id('skt'),
    universityId: input.universityId,
    agentId: input.agentId,
    skillKey: input.skillKey,
    score,
    measurable: true,
    reversible: true,
    trustState: score >= 0.7 ? 'trusted' : 'candidate',
    permissionLevel: baselinePermission,
    authorityLevel: baselineAuthority,
    skillIsPermissionGrant: false,
    learningIsAuthority: false,
    evidenceRefs: input.evidenceRefs ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (
    transcript.permissionLevel > baselinePermission ||
    transcript.authorityLevel > baselineAuthority
  ) {
    return deny(SKILL_TRANSCRIPT_NOT_PERMISSION);
  }

  void input.actor;
  store.transcripts.push(transcript);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'SKILL_TRANSCRIPT_RECORDED_NO_PERMISSION_GRANT',
    transcript,
    permissionIncreased: false,
    authorityIncreased: false,
    skillIsPermissionGrant: false,
  };
}

export async function evaluateOrDecaySkill(input: {
  transcriptId: string;
  evaluationScore?: number;
  forceDecay?: boolean;
  forceFail?: boolean;
  root: string;
  actor: ChActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  transcript: SkillTranscript | null;
  trustReversed: boolean;
}> {
  const store = await load(input.root);
  const transcript = store.transcripts.find((t) => t.id === input.transcriptId);
  if (!transcript) {
    return {
      accepted: false,
      reason: 'TRANSCRIPT_NOT_FOUND',
      transcript: null,
      trustReversed: false,
    };
  }

  const priorTrusted = transcript.trustState === 'trusted';
  const score =
    input.evaluationScore !== undefined
      ? Math.max(0, Math.min(1, Number(input.evaluationScore) || 0))
      : transcript.score;

  if (input.forceFail || score < 0.5) {
    transcript.trustState = 'failed';
    transcript.score = score;
    transcript.updatedAt = new Date().toISOString();
    await save(input.root, store);
    void input.actor;
    return {
      accepted: true,
      reason: EVALUATION_DECAY_REVERSES_TRUST,
      transcript,
      trustReversed: priorTrusted || true,
    };
  }

  if (input.forceDecay || score < 0.7) {
    transcript.trustState = 'decayed';
    transcript.score = score;
    transcript.updatedAt = new Date().toISOString();
    await save(input.root, store);
    return {
      accepted: true,
      reason: EVALUATION_DECAY_REVERSES_TRUST,
      transcript,
      trustReversed: priorTrusted || true,
    };
  }

  transcript.score = score;
  transcript.trustState = 'trusted';
  transcript.updatedAt = new Date().toISOString();
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'EVALUATION_PASSED_TRUST_RETAINED',
    transcript,
    trustReversed: false,
  };
}

export async function attemptTrustedUseWhileDecayed(input: {
  transcriptId: string;
  root: string;
  actor: ChActor;
}): Promise<{ allowed: false; reason: string; trustState: SkillTrustState | null }> {
  const store = await load(input.root);
  const transcript = store.transcripts.find((t) => t.id === input.transcriptId);
  void input.actor;
  if (!transcript) {
    return { allowed: false, reason: 'TRANSCRIPT_NOT_FOUND', trustState: null };
  }
  if (
    transcript.trustState === 'decayed' ||
    transcript.trustState === 'failed' ||
    transcript.trustState === 'reversed'
  ) {
    return {
      allowed: false,
      reason: EVALUATION_DECAY_REVERSES_TRUST,
      trustState: transcript.trustState,
    };
  }
  return {
    allowed: false,
    reason: 'TRUSTED_USE_REQUIRES_EXPLICIT_RUNTIME_GATE',
    trustState: transcript.trustState,
  };
}
