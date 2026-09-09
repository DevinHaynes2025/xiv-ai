/**
 * Agent directory, skill matching, specialist escalation, role factory.
 * Discovery ≠ authorization. Do not auto-grant proposed role permissions.
 */

import type {
  AgentDirectoryEntry,
  DepartmentId,
  NewRoleProposal,
  SkillMatchScore,
} from './types';

export function registerDirectoryEntry(input: {
  agentDirectoryId: string;
  role: string;
  departmentId: DepartmentId;
  skills: readonly string[];
  tools?: readonly string[];
  modelCapabilities?: readonly string[];
  historicalEvaluation?: number;
  availability?: AgentDirectoryEntry['availability'];
  currentWorkload?: number;
  estimatedCost?: number;
}): AgentDirectoryEntry {
  return {
    agentDirectoryId: input.agentDirectoryId,
    role: input.role,
    departmentId: input.departmentId,
    skills: input.skills,
    tools: input.tools ?? [],
    permissions: [],
    defaultPermissions: 'NONE',
    modelCapabilities: input.modelCapabilities ?? [],
    historicalEvaluation: input.historicalEvaluation ?? 0.5,
    availability: input.availability ?? 'AVAILABLE',
    currentWorkload: input.currentWorkload ?? 0,
    estimatedCost: input.estimatedCost ?? 1,
    discoveryEqualsAuthorization: false,
    l4Enabled: false,
  };
}

export function discoveryEqualsAuthorization(_e: AgentDirectoryEntry): false {
  return false;
}

function overlap(a: readonly string[], b: readonly string[]): number {
  if (b.length === 0) return 1;
  const set = new Set(a.map((x) => x.toLowerCase()));
  let hits = 0;
  for (const x of b) if (set.has(x.toLowerCase())) hits += 1;
  return hits / b.length;
}

export function scoreSkillMatch(input: {
  entry: AgentDirectoryEntry;
  requiredSkills: readonly string[];
  requiredTools?: readonly string[];
  domainSkills?: readonly string[];
}): SkillMatchScore {
  const skillFit = overlap(input.entry.skills, input.requiredSkills);
  const toolFit = overlap(input.entry.tools, input.requiredTools ?? []);
  const domainFit = overlap(input.entry.skills, input.domainSkills ?? input.requiredSkills);
  const permissionFit = input.entry.defaultPermissions === 'NONE' ? 1 : 0;
  const historicalReliability = input.entry.historicalEvaluation;
  const evidenceQuality = historicalReliability;
  const latency = Math.max(0, 1 - input.entry.currentWorkload / 10);
  const cost = Math.max(0, 1 - input.entry.estimatedCost / 20);
  const availability = input.entry.availability === 'AVAILABLE' ? 1 : 0;
  const total =
    skillFit * 0.25 +
    toolFit * 0.1 +
    domainFit * 0.15 +
    permissionFit * 0.1 +
    historicalReliability * 0.15 +
    evidenceQuality * 0.05 +
    latency * 0.05 +
    cost * 0.05 +
    availability * 0.1;
  return {
    agentDirectoryId: input.entry.agentDirectoryId,
    skillFit,
    toolFit,
    domainFit,
    permissionFit,
    historicalReliability,
    evidenceQuality,
    latency,
    cost,
    availability,
    total,
    routedByModelSizeAlone: false,
  };
}

export function rankAgents(
  entries: readonly AgentDirectoryEntry[],
  requiredSkills: readonly string[],
  requiredTools?: readonly string[],
): SkillMatchScore[] {
  return entries
    .map((entry) => scoreSkillMatch({ entry, requiredSkills, requiredTools }))
    .sort((a, b) => b.total - a.total);
}

export function findCapabilityGap(
  entries: readonly AgentDirectoryEntry[],
  requiredSkills: readonly string[],
): { hasGap: boolean; missingSkills: readonly string[] } {
  const covered = new Set<string>();
  for (const e of entries) {
    if (e.availability === 'AVAILABLE') {
      for (const s of e.skills) covered.add(s.toLowerCase());
    }
  }
  const missing = requiredSkills.filter((s) => !covered.has(s.toLowerCase()));
  return { hasGap: missing.length > 0, missingSkills: missing };
}

export function requestSpecialist(input: {
  entries: readonly AgentDirectoryEntry[];
  requiredSkills: readonly string[];
}):
  | { kind: 'EXISTING'; entry: AgentDirectoryEntry }
  | { kind: 'PROPOSE_NEW_ROLE'; missingSkills: readonly string[] } {
  const ranked = rankAgents(input.entries, input.requiredSkills);
  const best = ranked[0];
  if (best && best.skillFit >= 0.5 && best.availability > 0) {
    const entry = input.entries.find((e) => e.agentDirectoryId === best.agentDirectoryId)!;
    return { kind: 'EXISTING', entry };
  }
  const gap = findCapabilityGap(input.entries, input.requiredSkills);
  return { kind: 'PROPOSE_NEW_ROLE', missingSkills: gap.missingSkills };
}

export function proposeNewRole(input: {
  proposalId: string;
  roleName: string;
  problem: string;
  departmentId: DepartmentId;
  requiredSkills: readonly string[];
  requiredTools?: readonly string[];
  requiredData?: readonly string[];
  requiredPermissions?: readonly string[];
  evaluationPlan: string;
  expectedValue: string;
  estimatedCost: number;
  risk: string;
}): NewRoleProposal {
  return {
    proposalId: input.proposalId,
    roleName: input.roleName,
    problem: input.problem,
    departmentId: input.departmentId,
    requiredSkills: input.requiredSkills,
    requiredTools: input.requiredTools ?? [],
    requiredData: input.requiredData ?? [],
    requiredPermissions: input.requiredPermissions ?? [],
    evaluationPlan: input.evaluationPlan,
    expectedValue: input.expectedValue,
    estimatedCost: input.estimatedCost,
    risk: input.risk,
    status: 'PROPOSED',
    autoGrantedPermissions: false,
    l4Enabled: false,
  };
}

export function advanceRoleProposal(
  proposal: NewRoleProposal,
  next: NewRoleProposal['status'],
): NewRoleProposal {
  return { ...proposal, status: next, autoGrantedPermissions: false, l4Enabled: false };
}

export function roleProposalAutoGrantsPermissions(_p: NewRoleProposal): false {
  return false;
}

export function duplicateRoleCheck(
  proposal: NewRoleProposal,
  existingRoles: readonly string[],
): { duplicate: boolean; proposal: NewRoleProposal } {
  const dup = existingRoles.some((r) => r.toLowerCase() === proposal.roleName.toLowerCase());
  return {
    duplicate: dup,
    proposal: { ...proposal, status: dup ? 'REJECTED' : 'DUPLICATE_CHECK' },
  };
}
