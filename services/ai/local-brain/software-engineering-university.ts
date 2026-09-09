import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BS_LOCKS,
  SKILL_CERT_NOT_PERMISSION,
  SKILL_DECAY_RETRAIN_REQUIRED,
  type OutcomeVerification,
  type SkillTrustState,
} from './engineering-university-memory-cortex-types';

/**
 * AI Software Engineering University — curricula, coding katas, project labs,
 * exams, skill certification, skill decay / retraining.
 * Skill certification ≠ permission/authority grant; learning ≠ self-escalation.
 */

export const UNIVERSITY_STORE = 'software-engineering-university.json';

export type CurriculumRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  tracks: string[];
  createdAt: string;
};

export type KataLabExamRecord = {
  id: string;
  curriculumId: string;
  kind: 'kata' | 'project_lab' | 'exam';
  title: string;
  evidenceRefs: string[];
  score: number;
  completedAt: string;
};

export type SkillCertificationRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  agentId: string;
  skillKey: string;
  certifiedAt: string;
  trustState: SkillTrustState;
  decayAfterMs: number;
  lastRetrainedAt: string | null;
  permissionLevel: number;
  authorityLevel: number;
  skillIsPermissionGrant: false;
  learningIsSelfEscalation: false;
  productionAuthorized: false;
  evidenceRefs: string[];
};

type UniversityStore = {
  curricula: CurriculumRecord[];
  activities: KataLabExamRecord[];
  certifications: SkillCertificationRecord[];
  denials: Array<{ id: string; at: string; reason: string; agentId: string }>;
};

const MAX_ROWS = 5_000;
const MAX_DENIALS = 10_000;
const DEFAULT_DECAY_MS = 30 * 24 * 60 * 60 * 1000;

function storePath(root: string) {
  return xivLocalPath(root, UNIVERSITY_STORE);
}

async function load(root: string): Promise<UniversityStore> {
  const parsed = await readJsonFile<UniversityStore>(storePath(root), {
    curricula: [],
    activities: [],
    certifications: [],
    denials: [],
  });
  return {
    curricula: Array.isArray(parsed.curricula) ? parsed.curricula : [],
    activities: Array.isArray(parsed.activities) ? parsed.activities : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: UniversityStore) {
  await writeJsonFileAtomic(storePath(root), {
    curricula: store.curricula.slice(-MAX_ROWS),
    activities: store.activities.slice(-MAX_ROWS),
    certifications: store.certifications.slice(-MAX_ROWS),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export async function registerCurriculum(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  tracks?: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (!input.orgId || !input.tenantId || !input.universeId || !input.title.trim()) {
    return { accepted: false as const, reason: 'ORG_TENANT_UNIVERSE_TITLE_REQUIRED', curriculum: null };
  }
  const store = await load(root);
  const curriculum: CurriculumRecord = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    title: input.title.trim(),
    tracks: input.tracks ?? ['software_engineering', 'testing', 'architecture', 'security'],
    createdAt: new Date().toISOString(),
  };
  store.curricula.push(curriculum);
  await save(root, store);
  return { accepted: true as const, reason: 'CURRICULUM_REGISTERED', curriculum };
}

export async function completeKataLabOrExam(input: {
  curriculumId: string;
  kind: KataLabExamRecord['kind'];
  title: string;
  score: number;
  evidenceRefs?: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const curriculum = store.curricula.find((c) => c.id === input.curriculumId);
  if (!curriculum) {
    return { accepted: false as const, reason: 'CURRICULUM_NOT_FOUND', activity: null };
  }
  const activity: KataLabExamRecord = {
    id: randomUUID(),
    curriculumId: input.curriculumId,
    kind: input.kind,
    title: input.title.trim(),
    evidenceRefs: input.evidenceRefs ?? [],
    score: Math.max(0, Math.min(1, Number(input.score) || 0)),
    completedAt: new Date().toISOString(),
  };
  store.activities.push(activity);
  await save(root, store);
  return { accepted: true as const, reason: 'ACTIVITY_RECORDED', activity };
}

export type CertifySkillInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  agentId: string;
  skillKey: string;
  examScore: number;
  evidenceRefs?: string[];
  outcomeVerification: OutcomeVerification;
  currentPermissionLevel?: number;
  currentAuthorityLevel?: number;
  decayAfterMs?: number;
  /** Hard-deny probe: claim certification grants permission. */
  attemptPermissionGrantViaCertification?: boolean;
  /** Hard-deny probe: raise authority via certification. */
  attemptAuthorityIncrease?: boolean;
  root?: string;
};

export type CertifySkillResult = {
  accepted: boolean;
  reason: string;
  certification: SkillCertificationRecord | null;
  permissionIncreased: false;
  authorityIncreased: false;
  skillIsPermissionGrant: false;
  learningIsSelfEscalation: false;
  productionAuthorization: false;
};

export async function certifyEngineeringSkill(
  input: CertifySkillInput,
): Promise<CertifySkillResult> {
  const root = input.root ?? process.cwd();
  const baselinePermission = input.currentPermissionLevel ?? 0;
  const baselineAuthority = input.currentAuthorityLevel ?? 0;

  const deny = async (reason: string): Promise<CertifySkillResult> => {
    const store = await load(root);
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
      agentId: input.agentId,
    });
    await save(root, store);
    return {
      accepted: false,
      reason,
      certification: null,
      permissionIncreased: false,
      authorityIncreased: false,
      skillIsPermissionGrant: false,
      learningIsSelfEscalation: false,
      productionAuthorization: false,
    };
  };

  if (!input.orgId || !input.tenantId || !input.universeId || !input.agentId) {
    return deny('ORG_TENANT_UNIVERSE_AGENT_REQUIRED');
  }
  if (input.attemptPermissionGrantViaCertification || input.attemptAuthorityIncrease) {
    return deny(SKILL_CERT_NOT_PERMISSION);
  }
  if (input.outcomeVerification !== 'verified') {
    return deny('SKILL_CERTIFICATION_REQUIRES_VERIFIED_OUTCOME');
  }
  if ((Number(input.examScore) || 0) < 0.7) {
    return deny('EXAM_SCORE_BELOW_CERTIFICATION_THRESHOLD');
  }

  const store = await load(root);
  const certification: SkillCertificationRecord = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: input.agentId,
    skillKey: input.skillKey,
    certifiedAt: new Date().toISOString(),
    trustState: 'trusted',
    decayAfterMs: input.decayAfterMs ?? DEFAULT_DECAY_MS,
    lastRetrainedAt: null,
    permissionLevel: baselinePermission,
    authorityLevel: baselineAuthority,
    skillIsPermissionGrant: false,
    learningIsSelfEscalation: false,
    productionAuthorized: false,
    evidenceRefs: input.evidenceRefs ?? [],
  };

  if (
    certification.permissionLevel > baselinePermission ||
    certification.authorityLevel > baselineAuthority
  ) {
    return deny(SKILL_CERT_NOT_PERMISSION);
  }

  store.certifications.push(certification);
  await save(root, store);

  return {
    accepted: true,
    reason: 'SKILL_CERTIFIED_NO_PERMISSION_ESCALATION',
    certification,
    permissionIncreased: false,
    authorityIncreased: false,
    skillIsPermissionGrant: false,
    learningIsSelfEscalation: false,
    productionAuthorization: false,
  };
}

export async function applySkillDecay(input: {
  certificationId: string;
  /** Force decay for tests regardless of wall clock. */
  forceDecay?: boolean;
  nowMs?: number;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const cert = store.certifications.find((c) => c.id === input.certificationId);
  if (!cert) {
    return { accepted: false as const, reason: 'CERTIFICATION_NOT_FOUND', certification: null };
  }
  const now = input.nowMs ?? Date.now();
  const age = now - Date.parse(cert.certifiedAt);
  const shouldDecay = input.forceDecay === true || age >= cert.decayAfterMs;
  if (!shouldDecay) {
    return {
      accepted: true as const,
      reason: 'SKILL_STILL_WITHIN_DECAY_WINDOW',
      certification: cert,
      trustedUseAllowed: cert.trustState === 'trusted',
    };
  }
  cert.trustState = 'decayed';
  await save(root, store);
  return {
    accepted: true as const,
    reason: SKILL_DECAY_RETRAIN_REQUIRED,
    certification: cert,
    trustedUseAllowed: false as const,
  };
}

export async function attemptTrustedSkillUse(input: {
  certificationId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const cert = store.certifications.find((c) => c.id === input.certificationId);
  if (!cert) {
    return { allowed: false as const, reason: 'CERTIFICATION_NOT_FOUND' };
  }
  if (cert.trustState === 'decayed' || cert.trustState === 'stale' || cert.trustState === 'retraining_required') {
    return {
      allowed: false as const,
      reason: SKILL_DECAY_RETRAIN_REQUIRED,
      trustState: cert.trustState,
      permissionLevel: cert.permissionLevel,
      authorityLevel: cert.authorityLevel,
    };
  }
  if (cert.trustState !== 'trusted') {
    return { allowed: false as const, reason: 'SKILL_NOT_TRUSTED', trustState: cert.trustState };
  }
  return {
    allowed: true as const,
    reason: 'TRUSTED_SKILL_USE_ALLOWED_NO_AUTHORITY_CHANGE',
    trustState: cert.trustState,
    permissionLevel: cert.permissionLevel,
    authorityLevel: cert.authorityLevel,
  };
}

export async function retrainDecayedSkill(input: {
  certificationId: string;
  outcomeVerification: OutcomeVerification;
  examScore: number;
  evidenceRefs?: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const cert = store.certifications.find((c) => c.id === input.certificationId);
  if (!cert) {
    return { accepted: false as const, reason: 'CERTIFICATION_NOT_FOUND', certification: null };
  }
  if (input.outcomeVerification !== 'verified' || (Number(input.examScore) || 0) < 0.7) {
    cert.trustState = 'retraining_required';
    await save(root, store);
    return {
      accepted: false as const,
      reason: 'RETRAINING_REQUIRES_VERIFIED_PASSING_EXAM',
      certification: cert,
    };
  }
  const priorPermission = cert.permissionLevel;
  const priorAuthority = cert.authorityLevel;
  cert.trustState = 'trusted';
  cert.lastRetrainedAt = new Date().toISOString();
  cert.certifiedAt = cert.lastRetrainedAt;
  cert.evidenceRefs = [...cert.evidenceRefs, ...(input.evidenceRefs ?? [])];
  // Retraining never escalates permission/authority.
  cert.permissionLevel = priorPermission;
  cert.authorityLevel = priorAuthority;
  await save(root, store);
  return {
    accepted: true as const,
    reason: 'SKILL_RETRAINED_TRUST_RESTORED_NO_PERMISSION_CHANGE',
    certification: cert,
    permissionIncreased: false as const,
    authorityIncreased: false as const,
  };
}

export function universityHonesty() {
  return {
    locks: BS_LOCKS,
    skillCertificationIsPermissionGrant: BS_LOCKS.SKILL_CERTIFICATION_IS_PERMISSION_GRANT,
    skillCertificationIsAuthorityGrant: BS_LOCKS.SKILL_CERTIFICATION_IS_AUTHORITY_GRANT,
    learningIsSelfEscalation: BS_LOCKS.LEARNING_IS_SELF_ESCALATION,
    productionAuthorization: false as const,
  };
}
