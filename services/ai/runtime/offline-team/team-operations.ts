export type TeamMemberState = 'ACTIVE' | 'READY' | 'WAITING' | 'OFFLINE' | 'UNVERIFIED';

export interface TeamMemberStatus {
  id: string;
  role: string;
  provider: 'OLLAMA' | 'LOCAL_RULES' | 'CURSOR' | 'GROK' | 'CHATGPT' | 'GEMINI' | 'GIT';
  state: TeamMemberState;
  evidence: readonly string[];
  lastSeenAt?: string;
}

export const TEAM_OPERATIONS_GUARDRAILS = {
  evidenceRequiredForActive: true,
  branchNameIsNotAuthorshipProof: true,
  processNameIsNotAgentProof: true,
  productionMutationAllowed: false,
} as const;

export function normalizeTeamMember(input: Omit<TeamMemberStatus, 'state'> & { state?: TeamMemberState }): TeamMemberStatus {
  const evidence = Object.freeze([...(input.evidence ?? [])]);
  const requested = input.state ?? 'UNVERIFIED';
  const state: TeamMemberState = requested === 'ACTIVE' && evidence.length === 0 ? 'UNVERIFIED' : requested;
  return Object.freeze({ ...input, evidence, state });
}

export function summarizeTeam(members: readonly TeamMemberStatus[]) {
  return Object.freeze({
    total: members.length,
    active: members.filter((m) => m.state === 'ACTIVE').length,
    ready: members.filter((m) => m.state === 'READY').length,
    waiting: members.filter((m) => m.state === 'WAITING').length,
    offline: members.filter((m) => m.state === 'OFFLINE').length,
    unverified: members.filter((m) => m.state === 'UNVERIFIED').length,
  });
}
