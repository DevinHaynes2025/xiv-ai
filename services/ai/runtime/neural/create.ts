import type { KnowledgeState } from './types';

export type CreateWorkspace = { workspaceId: string; productionPublished: false };
export type Idea = { ideaId: string; verifiedFact: false };
export type IdeaThread = { threadId: string };
export type IdeaSource = { sourceId: string; provenanceRequired: true };
export type IdeaEvidence = { evidenceId: string };
export type IdeaContributor = { contributorId: string };
export type IdeaAgent = { specialty: string; permanentAuthority: false };
export type IdeaExperiment = { experimentId: string };
export type IdeaVersion = { version: number };
export type IdeaRisk = { riskId: string };
export type IdeaOpportunity = { opportunityId: string };
export type IdeaMarket = { marketId: string };
export type IdeaPrototype = { prototypeId: string; labeledPrototype: true };
export type IdeaPipeline = { pipelineId: string };
export type IdeaOutcome = { outcomeId: string };

export function openCreateWorkspace(input: { tenantId: string; universeId: string }): CreateWorkspace {
  return { workspaceId: `create:${input.tenantId}:${input.universeId}`, productionPublished: false };
}

export function assembleIdeaTaskForce(input: { specialties: readonly string[] }) {
  return {
    agents: input.specialties.map((specialty) => ({ specialty, permanentAuthority: false as const })),
    temporary: true as const,
    grantsPermanentPrivilege: false as const,
  };
}

export function labelIdeaClaim(state: KnowledgeState) {
  return {
    state,
    aiGeneratedIsExternallyVerified: false as const,
    simulatedIsFact: state === 'SIMULATED' ? false : state === 'OBSERVED',
  };
}
