/**
 * CEO / Founder Council — Twin discusses but NEVER becomes actual CEO/authority.
 * Preserve disagreement; no forced artificial consensus.
 */

import {
  COUNCIL_FLOW,
  COUNCIL_ROLES,
  FOUNDER_TWIN_DISCLOSURE,
  type CouncilFlowStage,
  type CouncilRole,
} from './types';

export type AgentPosition = {
  positionId: string;
  role: CouncilRole;
  agentId: string;
  stance: string;
  confidence: number;
};

export type AgentChallenge = {
  challengeId: string;
  fromRole: CouncilRole;
  toRole: CouncilRole;
  claim: string;
};

export type AgentEvidence = {
  evidenceId: string;
  role: CouncilRole;
  refId: string;
  summary: string;
};

export type AgentCounterargument = {
  counterargumentId: string;
  role: CouncilRole;
  againstPositionId: string;
  text: string;
};

export type AgentProposal = {
  proposalId: string;
  role: CouncilRole;
  text: string;
  riskNotes: string;
};

export type AgentConsensus = {
  consensusId: string;
  agreeingRoles: readonly CouncilRole[];
  statement: string;
  forced: false;
};

export type AgentDisagreement = {
  disagreementId: string;
  roles: readonly CouncilRole[];
  issue: string;
  preserved: true;
};

export type FounderDecision = {
  decisionId: string;
  humanAuthorized: true;
  twinIsAuthority: false;
  twinIsActualCeo: false;
  decision: string;
  decidedAt: string;
};

export type CouncilAgenda = {
  agendaId: string;
  items: readonly string[];
};

export type CouncilSession = {
  sessionId: string;
  agenda: CouncilAgenda;
  stage: CouncilFlowStage;
  positions: readonly AgentPosition[];
  challenges: readonly AgentChallenge[];
  evidence: readonly AgentEvidence[];
  counterarguments: readonly AgentCounterargument[];
  proposals: readonly AgentProposal[];
  consensus: AgentConsensus | null;
  disagreements: readonly AgentDisagreement[];
  founderDecision: FounderDecision | null;
  twinDisclosure: typeof FOUNDER_TWIN_DISCLOSURE;
  twinIsActualFounder: false;
  twinIsUltimateAuthority: false;
  forcedConsensus: false;
};

export type FounderCouncil = {
  roles: readonly CouncilRole[];
  flow: readonly CouncilFlowStage[];
  twinDisclosure: typeof FOUNDER_TWIN_DISCLOSURE;
  twinIsActualCeo: false;
  twinIsUltimateAuthority: false;
  forcedArtificialConsensus: false;
  productionLive: false;
};

export function listCouncilRoles(): readonly CouncilRole[] {
  return COUNCIL_ROLES;
}

export function listCouncilFlow(): readonly CouncilFlowStage[] {
  return COUNCIL_FLOW;
}

export function founderTwinDisclosure(): typeof FOUNDER_TWIN_DISCLOSURE {
  return FOUNDER_TWIN_DISCLOSURE;
}

export function openFounderCouncil(): FounderCouncil {
  return {
    roles: COUNCIL_ROLES,
    flow: COUNCIL_FLOW,
    twinDisclosure: FOUNDER_TWIN_DISCLOSURE,
    twinIsActualCeo: false,
    twinIsUltimateAuthority: false,
    forcedArtificialConsensus: false,
    productionLive: false,
  };
}

export function openCouncilSession(input: {
  sessionId: string;
  agendaItems: readonly string[];
}): CouncilSession {
  return {
    sessionId: input.sessionId,
    agenda: { agendaId: `agenda-${input.sessionId}`, items: input.agendaItems },
    stage: 'QUESTION',
    positions: [],
    challenges: [],
    evidence: [],
    counterarguments: [],
    proposals: [],
    consensus: null,
    disagreements: [],
    founderDecision: null,
    twinDisclosure: FOUNDER_TWIN_DISCLOSURE,
    twinIsActualFounder: false,
    twinIsUltimateAuthority: false,
    forcedConsensus: false,
  };
}

export function advanceCouncilStage(stage: CouncilFlowStage): CouncilFlowStage | null {
  const idx = COUNCIL_FLOW.indexOf(stage);
  if (idx < 0 || idx >= COUNCIL_FLOW.length - 1) return null;
  return COUNCIL_FLOW[idx + 1]!;
}

export function recordDisagreement(input: {
  disagreementId: string;
  roles: readonly CouncilRole[];
  issue: string;
}): AgentDisagreement {
  return {
    disagreementId: input.disagreementId,
    roles: input.roles,
    issue: input.issue,
    preserved: true,
  };
}

export function forceArtificialConsensus(_roles: readonly CouncilRole[]): never {
  throw new Error('founder_council_forbids_forced_artificial_consensus');
}

export function twinBecomesActualCeo(): false {
  return false;
}

export function twinBecomesUltimateAuthority(): false {
  return false;
}

export function recordFounderDecision(input: {
  decisionId: string;
  decision: string;
  decidedAt: string;
}): FounderDecision {
  return {
    decisionId: input.decisionId,
    humanAuthorized: true,
    twinIsAuthority: false,
    twinIsActualCeo: false,
    decision: input.decision,
    decidedAt: input.decidedAt,
  };
}
