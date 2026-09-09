import { commandCenter } from './command-center';
import * as compute from './compute';
import * as controls from './controls';
import * as directory from './directory';
import * as governor from './governor';
import * as guardianObserver from './guardian-observer';
import * as humanKnowledge from './human-knowledge';
import * as knowledge from './knowledge';
import * as engine from './meeting-engine';
import * as meetings from './meetings';
import * as overnight from './overnight';
import * as registry from './registry';
import * as reputation from './reputation';
import { createState, visibleTo, type CivilizationState, type Clock, type IdFactory } from './store';
import * as tasks from './tasks';
import * as temporal from './temporal';
import * as universe from './universe';
import * as xacp from './xacp';
import type { ActorContext, GovernanceEvent, ImpactLevel } from './types';

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
    listCapabilities: (actor: ActorContext) => visibleTo(state, actor, state.capabilities),
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

    // --- 2I-AI-62B — meetings, collective reasoning, human intelligence bridge

    convene: (actor: ActorContext, input: Parameters<typeof engine.convene>[2]) =>
      engine.convene(state, actor, input),
    advanceStage: (actor: ActorContext, input: Parameters<typeof engine.advanceStage>[2]) =>
      engine.advanceStage(state, actor, input),
    seat: (actor: ActorContext, input: Parameters<typeof engine.seat>[2]) => engine.seat(state, actor, input),
    speak: (actor: ActorContext, input: Parameters<typeof engine.speak>[2]) => engine.speak(state, actor, input),
    submitEvidence: (actor: ActorContext, input: Parameters<typeof engine.submitEvidence>[2]) =>
      engine.submitEvidence(state, actor, input),
    proposeOption: (actor: ActorContext, input: Parameters<typeof engine.proposeOption>[2]) =>
      engine.proposeOption(state, actor, input),
    raiseObjection: (actor: ActorContext, input: Parameters<typeof engine.raiseObjection>[2]) =>
      engine.raiseObjection(state, actor, input),
    resolveObjection: (actor: ActorContext, input: Parameters<typeof engine.resolveObjection>[2]) =>
      engine.resolveObjection(state, actor, input),
    castVote: (actor: ActorContext, input: Parameters<typeof engine.castVote>[2]) =>
      engine.castVote(state, actor, input),
    detectContradictions: (actor: ActorContext, meetingId: string) =>
      engine.detectContradictions(state, actor, meetingId),
    synthesize: (actor: ActorContext, input: Parameters<typeof engine.synthesize>[2]) =>
      engine.synthesize(state, actor, input),
    escalateMeeting: (actor: ActorContext, input: Parameters<typeof engine.escalate>[2]) =>
      engine.escalate(state, actor, input),
    decide: (actor: ActorContext, input: Parameters<typeof engine.decide>[2]) => engine.decide(state, actor, input),
    queueAction: (actor: ActorContext, input: Parameters<typeof engine.queueAction>[2]) =>
      engine.queueAction(state, actor, input),
    authorizeAction: (actor: ActorContext, input: Parameters<typeof engine.authorizeAction>[2]) =>
      engine.authorizeAction(state, actor, input),
    executeAction: (actor: ActorContext, input: Parameters<typeof engine.executeAction>[2]) =>
      engine.executeAction(state, actor, input),
    revokeAction: (actor: ActorContext, input: Parameters<typeof engine.revokeAction>[2]) =>
      engine.revokeAction(state, actor, input),
    recordMeetingOutcome: (actor: ActorContext, input: Parameters<typeof engine.recordOutcome>[2]) =>
      engine.recordOutcome(state, actor, input),
    reconstructMeeting: (actor: ActorContext, meetingId: string) => engine.reconstruct(state, actor, meetingId),
    transcript: (actor: ActorContext, meetingId: string) => engine.transcript(state, actor, meetingId),
    roleCoverage: (actor: ActorContext, meetingId: string) => engine.roleCoverage(state, actor, meetingId),
    listDecisions: (actor: ActorContext) => engine.listDecisions(state, actor),
    listMeetingActions: (actor: ActorContext) => engine.listActions(state, actor),
    listMeetingOutcomes: (actor: ActorContext) => engine.listOutcomes(state, actor),

    setMeetingBudget: (actor: ActorContext, input: Parameters<typeof governor.setMeetingBudget>[2]) =>
      governor.setMeetingBudget(state, actor, input),
    readMeetingBudget: (actor: ActorContext, meetingId: string) =>
      governor.readMeetingBudget(state, actor, meetingId),

    recordHumanKnowledge: (actor: ActorContext, input: Parameters<typeof humanKnowledge.recordHumanKnowledge>[2]) =>
      humanKnowledge.recordHumanKnowledge(state, actor, input),
    elevateToFact: (actor: ActorContext, input: Parameters<typeof humanKnowledge.elevateToFact>[2]) =>
      humanKnowledge.elevateToFact(state, actor, input),
    listHumanKnowledge: (actor: ActorContext) => humanKnowledge.listHumanKnowledge(state, actor),

    observe: (actor: ActorContext, input: Parameters<typeof guardianObserver.observe>[2]) =>
      guardianObserver.observe(state, actor, input),
    listObservations: (actor: ActorContext) => guardianObserver.listObservations(state, actor),

    issueControl: (actor: ActorContext, input: Parameters<typeof controls.issueControl>[2]) =>
      controls.issueControl(state, actor, input),
    clearControl: (actor: ActorContext, input: Parameters<typeof controls.clearControl>[2]) =>
      controls.clearControl(state, actor, input),
    listControls: (actor: ActorContext) => controls.listControls(state, actor),

    registerProfession: (actor: ActorContext, input: Parameters<typeof directory.registerProfession>[2]) =>
      directory.registerProfession(state, actor, input),
    seedDirectory: (actor: ActorContext) => directory.seedDirectory(state, actor),
    setLogicalPopulation: (actor: ActorContext, input: Parameters<typeof directory.setLogicalPopulation>[2]) =>
      directory.setLogicalPopulation(state, actor, input),
    listDirectory: (actor: ActorContext) => directory.listDirectory(state, actor),

    recordReputationSignals: (actor: ActorContext, input: Parameters<typeof reputation.recordSignals>[2]) =>
      reputation.recordSignals(state, actor, input),
    learnFromOutcome: (actor: ActorContext, input: Parameters<typeof reputation.learnFromOutcome>[2]) =>
      reputation.learnFromOutcome(state, actor, input),
    readReputation: (actor: ActorContext, agentId: string) => reputation.readReputation(state, actor, agentId),
    listReputations: (actor: ActorContext) => reputation.listReputations(state, actor),
    assignmentEligibility: (actor: ActorContext, input: { agentId: string; impactLevel: ImpactLevel }) =>
      reputation.assignmentEligibility(state, actor, input),

    openOvernightMeeting: (actor: ActorContext, input: Parameters<typeof overnight.openOvernightMeeting>[2]) =>
      overnight.openOvernightMeeting(state, actor, input),
    overnightBrief: (actor: ActorContext, window: overnight.OvernightWindow) =>
      overnight.overnightBrief(state, actor, window),

    describeOperatingTime: temporal.describeOperatingTime,
    commandCenter: (actor: ActorContext) => commandCenter(state, actor),

    auditTrail: (actor: ActorContext): GovernanceEvent[] => visibleTo(state, actor, state.governanceEvents),
  };
}
