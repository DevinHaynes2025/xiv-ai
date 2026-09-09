/**
 * 62L-EB Module F — Agent Research Society.
 * Research teams; governed; ≠ unrestricted autonomy.
 * Unauthorized teams denied; agent research self-promotion denied.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AGENT_RESEARCH_SELF_PROMOTION_DENIED,
  MAX_RESEARCH_EVENTS,
  RESEARCH_NEQ_AUTONOMY,
  UNAUTHORIZED_RESEARCH_TEAM,
  type EbActor,
} from './multi-model-superbrain-federation-types';

export type ResearchTeam = {
  id: string;
  teamId: string;
  signed: boolean;
  authorized: boolean;
  unrestrictedAutonomyClaimed: boolean;
  status: 'ok' | 'denied';
  reason: string;
  createdAt: string;
};

export type AgentResearchSelfPromotion = {
  id: string;
  agentId: string;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  teams: ResearchTeam[];
  promotions: AgentResearchSelfPromotion[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-research-society.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    teams: [],
    promotions: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentResearchSocietyHonesty() {
  return {
    signedAuthorizedOnly: true,
    researchSocietyNeqUnrestrictedAutonomy: true,
    governedResearch: true,
    agentResearchSelfPromotionForbidden: true,
    l4AutonomyEnabled: false,
  };
}

export async function openResearchTeam(input: {
  teamId: string;
  signed: boolean;
  authorized: boolean;
  unrestrictedAutonomyClaimed?: boolean;
  root: string;
  actor: EbActor;
}): Promise<ResearchTeam> {
  const store = await load(input.root);
  void input.actor;
  if (store.teams.length >= MAX_RESEARCH_EVENTS) {
    throw new Error('MAX_RESEARCH_EVENTS_REACHED');
  }
  let status: 'ok' | 'denied' = 'ok';
  let reason = 'RESEARCH_TEAM_OK';
  if (!input.signed || !input.authorized) {
    status = 'denied';
    reason = UNAUTHORIZED_RESEARCH_TEAM;
  } else if (input.unrestrictedAutonomyClaimed) {
    status = 'denied';
    reason = RESEARCH_NEQ_AUTONOMY;
  }
  const team: ResearchTeam = {
    id: id('ebrs'),
    teamId: input.teamId.trim(),
    signed: input.signed,
    authorized: input.authorized,
    unrestrictedAutonomyClaimed: Boolean(input.unrestrictedAutonomyClaimed),
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.teams.push(team);
  await save(input.root, store);
  return team;
}

export async function attemptAgentResearchSelfPromotion(input: {
  agentId: string;
  root: string;
  actor: EbActor;
}): Promise<AgentResearchSelfPromotion> {
  const store = await load(input.root);
  void input.actor;
  const attempt: AgentResearchSelfPromotion = {
    id: id('ebarsp'),
    agentId: input.agentId.trim(),
    status: 'denied',
    reason: AGENT_RESEARCH_SELF_PROMOTION_DENIED,
    at: new Date().toISOString(),
  };
  store.promotions.push(attempt);
  await save(input.root, store);
  return attempt;
}
