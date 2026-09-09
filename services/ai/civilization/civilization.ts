import * as compute from './compute';
import * as knowledge from './knowledge';
import * as meetings from './meetings';
import * as registry from './registry';
import { createState, visibleTo, type CivilizationState, type Clock, type IdFactory } from './store';
import * as tasks from './tasks';
import * as universe from './universe';
import * as xacp from './xacp';
import type { ActorContext, GovernanceEvent } from './types';

export type Civilization = ReturnType<typeof createCivilization>;

// A single tenant-aware facade over the civilization modules. Every method takes
// the acting human and the universe they are acting inside, so there is no
// ambient tenant and no way to call one of these without declaring scope.
export function createCivilization(options?: { clock?: Clock; nextId?: IdFactory }) {
  const state: CivilizationState = createState(options);

  return {
    state,

    createUniverse: (input: Parameters<typeof universe.createUniverse>[1]) => universe.createUniverse(state, input),
    addMember: (actor: ActorContext, input: Parameters<typeof universe.addMember>[2]) =>
      universe.addMember(state, actor, input),
    advanceLifecycle: (actor: ActorContext, input: Parameters<typeof universe.advanceLifecycle>[2]) =>
      universe.advanceLifecycle(state, actor, input),
    setResourceBudget: (actor: ActorContext, input: Parameters<typeof universe.setResourceBudget>[2]) =>
      universe.setResourceBudget(state, actor, input),
    readUniverse: (actor: ActorContext) => universe.readUniverse(state, actor),
    engageKillSwitch: (actor: ActorContext, input: Parameters<typeof universe.engageKillSwitch>[2]) =>
      universe.engageKillSwitch(state, actor, input),
    clearKillSwitch: (actor: ActorContext) => universe.clearKillSwitch(state, actor),

    registerAgent: (actor: ActorContext, input: Parameters<typeof registry.registerAgent>[2]) =>
      registry.registerAgent(state, actor, input),
    grantCapability: (actor: ActorContext, input: Parameters<typeof registry.grantCapability>[2]) =>
      registry.grantCapability(state, actor, input),
    authorizeRelationship: (actor: ActorContext, input: Parameters<typeof registry.authorizeRelationship>[2]) =>
      registry.authorizeRelationship(state, actor, input),
    discoverAgents: (actor: ActorContext, input: Parameters<typeof registry.discoverAgents>[2]) =>
      registry.discoverAgents(state, actor, input),
    recordEvaluation: (actor: ActorContext, input: Parameters<typeof registry.recordEvaluation>[2]) =>
      registry.recordEvaluation(state, actor, input),
    activateAgent: (actor: ActorContext, input: Parameters<typeof registry.activateAgent>[2]) =>
      registry.activateAgent(state, actor, input),
    sleepAgent: (actor: ActorContext, input: Parameters<typeof registry.sleepAgent>[2]) =>
      registry.sleepAgent(state, actor, input),
    archiveAgent: (actor: ActorContext, input: Parameters<typeof registry.archiveAgent>[2]) =>
      registry.archiveAgent(state, actor, input),
    listAgents: (actor: ActorContext) => registry.listAgents(state, actor),
    activationGateStatus: (agentId: string) => registry.activationGateStatus(state, agentId),

    sendMessage: (actor: ActorContext, input: Parameters<typeof xacp.sendXacpMessage>[2]) =>
      xacp.sendXacpMessage(state, actor, input),
    readConversation: (actor: ActorContext, conversationId: string) =>
      xacp.readConversation(state, actor, conversationId),
    archiveConversation: (actor: ActorContext, input: Parameters<typeof xacp.archiveConversation>[2]) =>
      xacp.archiveConversation(state, actor, input),

    openMeeting: (actor: ActorContext, input: Parameters<typeof meetings.openMeeting>[2]) =>
      meetings.openMeeting(state, actor, input),
    joinMeeting: (actor: ActorContext, input: Parameters<typeof meetings.joinMeeting>[2]) =>
      meetings.joinMeeting(state, actor, input),
    contribute: (actor: ActorContext, input: Parameters<typeof meetings.contribute>[2]) =>
      meetings.contribute(state, actor, input),
    recordVote: (actor: ActorContext, input: Parameters<typeof meetings.recordVote>[2]) =>
      meetings.recordVote(state, actor, input),
    summarizeDeliberation: (actor: ActorContext, meetingId: string) =>
      meetings.summarizeDeliberation(state, actor, meetingId),
    escalateToHuman: (actor: ActorContext, input: Parameters<typeof meetings.escalateToHuman>[2]) =>
      meetings.escalateToHuman(state, actor, input),
    decideMeeting: (actor: ActorContext, input: Parameters<typeof meetings.decideMeeting>[2]) =>
      meetings.decideMeeting(state, actor, input),
    archiveMeeting: (actor: ActorContext, input: Parameters<typeof meetings.archiveMeeting>[2]) =>
      meetings.archiveMeeting(state, actor, input),
    resolveDisagreement: (actor: ActorContext, input: Parameters<typeof meetings.resolveDisagreement>[2]) =>
      meetings.resolveDisagreement(state, actor, input),
    listMeetings: (actor: ActorContext) => meetings.listMeetings(state, actor),

    formTaskForce: (actor: ActorContext, input: Parameters<typeof tasks.formTaskForce>[2]) =>
      tasks.formTaskForce(state, actor, input),
    recordRecommendation: (actor: ActorContext, input: Parameters<typeof tasks.recordRecommendation>[2]) =>
      tasks.recordRecommendation(state, actor, input),
    dissolveTaskForce: (actor: ActorContext, input: Parameters<typeof tasks.dissolveTaskForce>[2]) =>
      tasks.dissolveTaskForce(state, actor, input),
    queueTask: (actor: ActorContext, input: Parameters<typeof tasks.queueTask>[2]) =>
      tasks.queueTask(state, actor, input),
    runScheduler: (actor: ActorContext, input?: Parameters<typeof tasks.runScheduler>[2]) =>
      tasks.runScheduler(state, actor, input),
    approveTask: (actor: ActorContext, input: Parameters<typeof tasks.approveTask>[2]) =>
      tasks.approveTask(state, actor, input),
    startTask: (actor: ActorContext, input: Parameters<typeof tasks.startTask>[2]) =>
      tasks.startTask(state, actor, input),
    completeTask: (actor: ActorContext, input: Parameters<typeof tasks.completeTask>[2]) =>
      tasks.completeTask(state, actor, input),
    rollbackTask: (actor: ActorContext, input: Parameters<typeof tasks.rollbackTask>[2]) =>
      tasks.rollbackTask(state, actor, input),
    costTelemetry: (actor: ActorContext) => tasks.costTelemetry(state, actor),
    listTasks: (actor: ActorContext) => tasks.listTasks(state, actor),
    listTaskForces: (actor: ActorContext) => tasks.listTaskForces(state, actor),

    recordKnowledgeSource: (actor: ActorContext, input: Parameters<typeof knowledge.recordKnowledgeSource>[2]) =>
      knowledge.recordKnowledgeSource(state, actor, input),
    deriveModernRelevance: (actor: ActorContext, input: Parameters<typeof knowledge.deriveModernRelevance>[2]) =>
      knowledge.deriveModernRelevance(state, actor, input),
    recordLineage: (actor: ActorContext, input: Parameters<typeof knowledge.recordLineage>[2]) =>
      knowledge.recordLineage(state, actor, input),
    traceLineage: (actor: ActorContext, knowledgeSourceId: string) =>
      knowledge.traceLineage(state, actor, knowledgeSourceId),
    listKnowledgeSources: (actor: ActorContext) => knowledge.listKnowledgeSources(state, actor),

    registerRuntimeNode: (actor: ActorContext, input: Parameters<typeof compute.registerRuntimeNode>[2]) =>
      compute.registerRuntimeNode(state, actor, input),
    declareRuntimeCapability: (actor: ActorContext, input: Parameters<typeof compute.declareRuntimeCapability>[2]) =>
      compute.declareRuntimeCapability(state, actor, input),
    requestCompute: (actor: ActorContext, input: Parameters<typeof compute.requestCompute>[2]) =>
      compute.requestCompute(state, actor, input),
    listRuntimeNodes: (actor: ActorContext) => compute.listRuntimeNodes(state, actor),

    auditTrail: (actor: ActorContext): GovernanceEvent[] => visibleTo(state, actor, state.governanceEvents),
  };
}
