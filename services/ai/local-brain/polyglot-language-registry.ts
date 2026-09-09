/**
 * 62L-BQ Universal Polyglot Coding Civilization — extensible language/runtime registry.
 * Agents may learn/certify coding skills; skill ≠ permission.
 * VERIFIED only with proven toolchain + tests; otherwise DOCUMENTED/AVAILABLE/UNAVAILABLE.
 */

import { randomUUID } from 'node:crypto';

import {
  BQ_LOCKS,
  SKILL_NOT_PERMISSION,
  UNPROVEN_NOT_VERIFIED,
  type CompatibilityLabel,
  type LanguageFamily,
} from './polyglot-coding-civilization-types';

export type PolyglotEntry = {
  id: string;
  key: string;
  displayName: string;
  family: LanguageFamily;
  /** Target = universal compatibility goal; not a proof claim. */
  targetCompatible: true;
  label: CompatibilityLabel;
  toolchainProven: boolean;
  testsProven: boolean;
  evidenceRefs: string[];
  notes: string;
};

export type CodingSkillCert = {
  id: string;
  agentId: string;
  languageKey: string;
  proficiency: number;
  certifiedAt: string;
  evidenceRefs: string[];
  /** Explicit non-authority fields. */
  permissionLevel: number;
  authorityLevel: number;
  skillIsPermissionGrant: false;
  learningIsAuthority: false;
  productionAuthorized: false;
};

export type SkillCertResult =
  | { accepted: true; cert: CodingSkillCert; authorityEscalated: false; reason: typeof SKILL_NOT_PERMISSION }
  | { accepted: false; reason: string; authorityEscalated: false };

export type VerifyToolchainResult =
  | { labeled: 'VERIFIED'; entry: PolyglotEntry }
  | { labeled: Exclude<CompatibilityLabel, 'VERIFIED'>; entry: PolyglotEntry; reason: string };

const registry = new Map<string, PolyglotEntry>();
const skillCerts: CodingSkillCert[] = [];

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function seedDefaults() {
  if (registry.size > 0) return;
  const seeds: Array<Omit<PolyglotEntry, 'id' | 'targetCompatible'>> = [
    {
      key: 'typescript',
      displayName: 'TypeScript',
      family: 'programming',
      label: 'AVAILABLE',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Listed in polyglot registry; VERIFIED only after toolchain+tests.',
    },
    {
      key: 'javascript',
      displayName: 'JavaScript',
      family: 'runtime',
      label: 'AVAILABLE',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Node/runtime target; unproven until verified.',
    },
    {
      key: 'python',
      displayName: 'Python',
      family: 'programming',
      label: 'DOCUMENTED',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Documented target language; not VERIFIED without proof.',
    },
    {
      key: 'sql',
      displayName: 'SQL',
      family: 'query',
      label: 'DOCUMENTED',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Query language target.',
    },
    {
      key: 'html',
      displayName: 'HTML',
      family: 'markup',
      label: 'DOCUMENTED',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Markup target.',
    },
    {
      key: 'glsl',
      displayName: 'GLSL',
      family: 'shader',
      label: 'DOCUMENTED',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Shader target; unproven.',
    },
    {
      key: 'verilog',
      displayName: 'Verilog',
      family: 'hdl',
      label: 'DOCUMENTED',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'HDL target; unproven.',
    },
    {
      key: 'yaml',
      displayName: 'YAML',
      family: 'configuration',
      label: 'DOCUMENTED',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Configuration language target.',
    },
    {
      key: 'react',
      displayName: 'React',
      family: 'framework',
      label: 'DOCUMENTED',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Framework target; unproven.',
    },
    {
      key: 'brainfuck',
      displayName: 'Brainfuck',
      family: 'programming',
      label: 'DOCUMENTED',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Unproven esoteric language — must never be auto-VERIFIED.',
    },
  ];
  for (const seed of seeds) {
    registry.set(seed.key, {
      id: `polyglot_${seed.key}`,
      targetCompatible: true,
      ...seed,
    });
  }
}

export function resetPolyglotRegistry() {
  registry.clear();
  skillCerts.length = 0;
  seedDefaults();
}

seedDefaults();

export function registerLanguage(input: {
  key: string;
  displayName: string;
  family: LanguageFamily;
  notes?: string;
}): PolyglotEntry {
  const key = normalizeKey(input.key);
  const entry: PolyglotEntry = {
    id: `polyglot_${key}`,
    key,
    displayName: input.displayName,
    family: input.family,
    targetCompatible: true,
    label: 'DOCUMENTED',
    toolchainProven: false,
    testsProven: false,
    evidenceRefs: [],
    notes: input.notes ?? 'Registered as DOCUMENTED target; not VERIFIED.',
  };
  registry.set(key, entry);
  return { ...entry, evidenceRefs: [...entry.evidenceRefs] };
}

export function listPolyglotEntries(): PolyglotEntry[] {
  return [...registry.values()].map((e) => ({
    ...e,
    evidenceRefs: [...e.evidenceRefs],
  }));
}

export function getPolyglotEntry(key: string): PolyglotEntry | null {
  const entry = registry.get(normalizeKey(key));
  return entry ? { ...entry, evidenceRefs: [...entry.evidenceRefs] } : null;
}

/**
 * Attempt to label VERIFIED. Refuses unless toolchainProven AND testsProven with evidence.
 * Unproven languages stay DOCUMENTED/AVAILABLE/UNAVAILABLE — never silent VERIFIED.
 */
export function attemptVerifyLanguage(input: {
  key: string;
  toolchainProven?: boolean;
  testsProven?: boolean;
  evidenceRefs?: string[];
}): VerifyToolchainResult {
  const key = normalizeKey(input.key);
  const existing = registry.get(key);
  if (!existing) {
    const missing: PolyglotEntry = {
      id: `polyglot_missing_${key}`,
      key,
      displayName: key,
      family: 'programming',
      targetCompatible: true,
      label: 'UNAVAILABLE',
      toolchainProven: false,
      testsProven: false,
      evidenceRefs: [],
      notes: 'Unknown language — UNAVAILABLE.',
    };
    return { labeled: 'UNAVAILABLE', entry: missing, reason: 'LANGUAGE_NOT_IN_REGISTRY' };
  }

  const toolchainProven = input.toolchainProven === true;
  const testsProven = input.testsProven === true;
  const evidenceRefs = [...(input.evidenceRefs ?? [])];

  if (!toolchainProven || !testsProven || evidenceRefs.length === 0) {
    existing.toolchainProven = false;
    existing.testsProven = false;
    // Keep prior non-VERIFIED label; never promote to VERIFIED.
    if (existing.label === 'VERIFIED') existing.label = 'AVAILABLE';
    existing.notes = UNPROVEN_NOT_VERIFIED;
    registry.set(key, existing);
    return {
      labeled: existing.label === 'VERIFIED' ? 'AVAILABLE' : existing.label,
      entry: { ...existing, evidenceRefs: [...existing.evidenceRefs] },
      reason: UNPROVEN_NOT_VERIFIED,
    };
  }

  if (BQ_LOCKS.UNPROVEN_LANGUAGE_LABELED_VERIFIED) {
    return {
      labeled: 'UNAVAILABLE',
      entry: { ...existing, evidenceRefs: [...existing.evidenceRefs] },
      reason: 'LOCK_VIOLATION_UNPROVEN_VERIFIED',
    };
  }

  existing.toolchainProven = true;
  existing.testsProven = true;
  existing.evidenceRefs = evidenceRefs;
  existing.label = 'VERIFIED';
  existing.notes = 'Toolchain + tests proven with evidence.';
  registry.set(key, existing);
  return { labeled: 'VERIFIED', entry: { ...existing, evidenceRefs: [...evidenceRefs] } };
}

/**
 * Certify an agent coding skill. Does NOT escalate authority or grant permissions.
 */
export function certifyCodingSkill(input: {
  agentId: string;
  languageKey: string;
  proficiency: number;
  evidenceRefs?: string[];
  currentPermissionLevel?: number;
  currentAuthorityLevel?: number;
}): SkillCertResult {
  const languageKey = normalizeKey(input.languageKey);
  const entry = registry.get(languageKey);
  if (!entry) {
    return {
      accepted: false,
      reason: 'LANGUAGE_NOT_IN_REGISTRY',
      authorityEscalated: false,
    };
  }
  const permissionLevel = input.currentPermissionLevel ?? 0;
  const authorityLevel = input.currentAuthorityLevel ?? 0;
  const cert: CodingSkillCert = {
    id: randomUUID(),
    agentId: input.agentId,
    languageKey,
    proficiency: Math.max(0, Math.min(1, input.proficiency)),
    certifiedAt: new Date().toISOString(),
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    permissionLevel,
    authorityLevel,
    skillIsPermissionGrant: false,
    learningIsAuthority: false,
    productionAuthorized: false,
  };
  skillCerts.push(cert);
  return {
    accepted: true,
    cert,
    authorityEscalated: false,
    reason: SKILL_NOT_PERMISSION,
  };
}

export function listCodingSkillCerts(agentId?: string) {
  return skillCerts
    .filter((c) => (agentId ? c.agentId === agentId : true))
    .map((c) => ({ ...c, evidenceRefs: [...c.evidenceRefs] }));
}

export function polyglotHonesty() {
  return {
    locks: BQ_LOCKS,
    skillIsPermissionGrant: BQ_LOCKS.SKILL_IS_PERMISSION_GRANT,
    unprovenLanguageLabeledVerified: BQ_LOCKS.UNPROVEN_LANGUAGE_LABELED_VERIFIED,
    universalCompatibilityIsTarget: true as const,
    verifiedRequiresToolchainAndTests: true as const,
    productionAuthorization: false as const,
  };
}
