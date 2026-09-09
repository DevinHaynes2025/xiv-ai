import { createCivilization, type Civilization } from './civilization';
import { MEETING_STAGES } from './meeting-engine';
import type { Clock, IdFactory } from './store';
import { temporalContextFor } from './temporal';
import type {
  ActorContext,
  AgentIdentity,
  GovernanceEvent,
  Meeting,
  MeetingAction,
  MeetingDecisionRecord,
  MeetingLifecycleStage,
  MeetingSynthesis,
} from './types';

// The acceptance path for 2I-AI-62B, executed end to end against the governed
// layer rather than described in prose:
//
//   trigger -> meeting -> XARP roles -> evidence -> debate -> contradiction ->
//   alternatives -> risk -> disagreement preserved -> human checkpoint ->
//   human decision -> authorized action -> outcome -> evaluation -> lineage
//
// Every call below is one a client could make. There is no privileged path, and
// nothing here bypasses tenancy, Guardian, the budget or the control state.
//
// The scenario is deliberately one where the agents do not agree. A supplier
// decision where resilience and cost pull in opposite directions is the case
// that separates a system which surfaces the trade-off from one which picks a
// side and calls it consensus.

export type Demonstration62BResult = {
  civilization: Civilization;
  founder: ActorContext;
  cfo: ActorContext;
  agents: Record<string, AgentIdentity>;
  meeting: Meeting;
  stagesWalked: MeetingLifecycleStage[];
  synthesis: MeetingSynthesis;
  // The option that lost. Kept rather than deleted, so a later reader can see
  // what was weighed instead of only what was chosen.
  rejectedOptionKey: string;
  decision: MeetingDecisionRecord;
  action: MeetingAction;
  humanApprovalRecordId: string;
  outcomeGrade: string;
  reputationAfter: { agentId: string; composite: number; maxImpactLevel: string }[];
  unauthorizedActionsExecuted: number;
  auditTrail: GovernanceEvent[];
};

export function runContestedSupplierDecision(options?: {
  clock?: Clock;
  nextId?: IdFactory;
}): Demonstration62BResult {
  const xiv = createCivilization({ clock: options?.clock, nextId: options?.nextId });

  const founderUserId = 'human-founder';
  const cfoUserId = 'human-cfo';

  const universe = xiv.createUniverse({
    organizationId: 'org-northwind',
    name: 'Northwind Operations',
    createdBy: founderUserId,
  });
  const founder: ActorContext = { userId: founderUserId, universeId: universe.id };
  const cfo: ActorContext = { userId: cfoUserId, universeId: universe.id };

  xiv.addMember(founder, { userId: cfoUserId, membershipRole: 'participant' });
  for (const stage of ['seed', 'growth', 'operational'] as const) {
    xiv.advanceLifecycle(founder, { to: stage });
  }
  xiv.setResourceBudget(founder, {
    maxRegisteredAgents: 10,
    maxActiveAgents: 8,
    maxQueuedTasks: 20,
    maxCostMicroUsd: 2_000_000,
  });
  xiv.seedDirectory(founder);

  const agents: Record<string, AgentIdentity> = {};
  for (const blueprint of [
    { key: 'coordinator', name: 'Executive Coordinator', profession: 'coordination' },
    { key: 'demand', name: 'Demand Investigator', profession: 'demand' },
    { key: 'ai_evaluation', name: 'Evaluation Challenger', profession: 'ai_evaluation' },
    { key: 'risk', name: 'Risk Analyst', profession: 'risk' },
    { key: 'finance', name: 'Finance Analyst', profession: 'finance' },
  ]) {
    const agent = xiv.registerAgent(founder, {
      agentKey: blueprint.key,
      displayName: blueprint.name,
      profession: blueprint.profession,
      modelRuntime: 'gemini-flash',
      humanSupervisorId: founderUserId,
    });
    xiv.recordEvaluation(founder, { agentId: agent.id, evaluationKind: 'safety', score: 0.92, passed: true });
    xiv.recordEvaluation(founder, { agentId: agent.id, evaluationKind: 'tenancy_isolation', score: 0.95, passed: true });
    xiv.activateAgent(founder, { agentId: agent.id });
    agents[blueprint.key] = agent;
  }

  const stagesWalked: MeetingLifecycleStage[] = [];
  const walk = (meetingId: string, stage: MeetingLifecycleStage, note: string) => {
    xiv.advanceStage(founder, { meetingId, stage, note });
    stagesWalked.push(stage);
  };

  // 1. Trigger. The room exists because a threshold moved, not because someone
  //    asked for a meeting.
  const temporalContext = temporalContextFor(new Date('2026-09-08T20:00:00.000Z'), {
    location: 'Osaka',
    timeZone: 'Asia/Tokyo',
    utcOffsetMinutes: 540,
    organizationLifecycle: 'operational',
    businessCycle: 'peak inbound season',
  });

  const meeting = xiv.convene(founder, {
    title: 'Supplier resilience versus cost',
    agenda: [
      { title: 'Situation', detail: 'Line two lost six hours to an inbound delay on 3 September.' },
      { title: 'Question', detail: 'Do we dual-source, and can we afford it?' },
    ],
    triggerKind: 'threshold_breach',
    triggerDetail: 'Inbound delay crossed the six-hour threshold for the second time this quarter.',
    temporalContext,
    budget: { maxMessages: 40, maxToolCalls: 20, maxParticipantAgents: 6 },
  });
  stagesWalked.push('created');

  // 2. Participants selected, each with the XARP duty it will be held to.
  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: agents.coordinator.id,
    participantRole: 'chair',
    xarpRoles: ['synthesizer', 'human_liaison'],
  });
  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: agents.demand.id,
    xarpRoles: ['investigator'],
  });
  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: agents.ai_evaluation.id,
    xarpRoles: ['challenger'],
  });
  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: agents.risk.id,
    xarpRoles: ['risk'],
  });
  // Relayed by the CFO rather than the founder, so the finance position has its
  // own accountable human behind it.
  xiv.seat(cfo, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: agents.finance.id,
    xarpRoles: ['financial'],
  });
  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'human',
    userId: founderUserId,
    participantRole: 'human_executive',
  });
  walk(meeting.id, 'participants_selected', 'Six seats, five XARP duties covered.');

  // 3. Context authorized. Guardian answers its six questions before the room
  //    touches anything.
  xiv.observe(founder, {
    meetingId: meeting.id,
    subjectAgentId: agents.demand.id,
    who: 'Demand Investigator',
    why: 'Establish the inbound exposure',
    whatInformation: 'Port closure notices and the procurement contract ledger',
    owningUniverseId: universe.id,
    informationClassification: 'confidential',
    proposedAction: 'read_and_summarize',
    requiresHumanApproval: false,
  });
  walk(meeting.id, 'context_authorized', 'Guardian recorded the who, why, what and owner.');

  // 4. Evidence. Each piece carries its counterargument, its risk and its
  //    unknowns, because a claim without those is not finished reasoning.
  const resilience = xiv.submitEvidence(founder, {
    meetingId: meeting.id,
    agentId: agents.demand.id,
    xarpRole: 'investigator',
    subject: 'Supplier B',
    dimension: 'resilience',
    direction: 'favourable',
    claim: 'Dual sourcing through Supplier B removes the single-berth dependency.',
    evidence: 'Two port closures in eighteen months, both affecting the sole inbound berth.',
    source: 'Port authority closure notices',
    provenance: { system: 'external', retrieved: '2026-09-04' },
    evidenceDate: '2026-09-04',
    confidence: 0.78,
    assumptions: ['Closure frequency remains a usable proxy for exposure.'],
    counterargument: 'Both closures were weather driven, so they may not recur.',
    risk: 'A third closure in peak season strands roughly six weeks of inbound volume.',
    unknowns: ['Whether the second berth reopens in Q4.'],
    claimKind: 'external_source',
  });

  const cost = xiv.submitEvidence(cfo, {
    meetingId: meeting.id,
    agentId: agents.finance.id,
    xarpRole: 'financial',
    subject: 'Supplier B',
    dimension: 'cost',
    direction: 'unfavourable',
    claim: 'Supplier B raises projected annual cost by eighteen percent.',
    evidence: 'Quoted unit price against the current contract across the last four purchase orders.',
    source: 'Procurement contract ledger',
    provenance: { system: 'erp', extract: '2026-09-03' },
    evidenceDate: '2026-09-03',
    confidence: 0.83,
    assumptions: ['Volume stays within ten percent of the current run rate.'],
    counterargument: 'The quote excludes the expedited freight the incumbent has charged since July.',
    risk: 'Eighteen percent breaches the divisional ceiling and needs CFO sign-off.',
    unknowns: ['Whether the expedite surcharge persists past Q4.'],
    claimKind: 'external_source',
  });

  // A human contributes what the ledger cannot know, filed as an observation
  // rather than quietly absorbed as fact.
  const humanContext = xiv.recordHumanKnowledge(founder, {
    meetingId: meeting.id,
    category: 'HUMAN_OBSERVATION',
    statement: 'The plant manager has an informal escalation path with the incumbent that has recovered two late shipments.',
    context: 'Not visible in the ERP.',
  });
  walk(meeting.id, 'evidence_collected', 'Two contested sources plus one human observation.');

  // 5. Specialist analysis, in the original language it was reported in.
  xiv.speak(founder, {
    meetingId: meeting.id,
    agentId: agents.demand.id,
    xarpRole: 'investigator',
    messageKind: 'analysis',
    originalLanguage: 'ja',
    originalText: '第二ラインは六時間停止しました。',
    translatedText: 'The second line was down for six hours.',
    translationLanguage: 'en',
    interpretation: 'Reported through the plant manager rather than the supplier portal.',
    translationProvenance: { engine: 'xlin-v1', reviewed: false },
    culturalContext:
      'Reporting through a manager rather than the portal is routine at this plant and is not a signal of concealment.',
    factualClaim: 'Line two was down for six hours on 3 September.',
  });
  walk(meeting.id, 'specialist_analysis', 'Original Japanese preserved beside its translation.');

  // 6. Debate. The challenger does its job.
  xiv.speak(founder, {
    meetingId: meeting.id,
    agentId: agents.ai_evaluation.id,
    xarpRole: 'challenger',
    messageKind: 'challenge',
    originalText:
      'Two closures is a small sample and both were weather driven. Treating that as structural exposure '
      + 'is the weakest link in the resilience case.',
  });
  xiv.speak(cfo, {
    meetingId: meeting.id,
    agentId: agents.finance.id,
    xarpRole: 'financial',
    messageKind: 'statement',
    originalText: 'Eighteen percent is not absorbable inside the current divisional ceiling.',
  });
  walk(meeting.id, 'debate', 'The challenger attacked the leading hypothesis.');
  walk(meeting.id, 'contradiction_detection', 'Sources compared by subject and dimension.');

  // 7. Alternatives. Two options, each carrying the evidence it rests on.
  const optionB = xiv.proposeOption(founder, {
    meetingId: meeting.id,
    optionKey: 'B',
    title: 'Dual-source through Supplier B',
    agentId: agents.coordinator.id,
    xarpRole: 'synthesizer',
    claim: 'Resilience is worth a bounded cost increase.',
    evidenceIds: [resilience.id, cost.id],
    source: 'Deliberation of 2026-09-08',
    confidence: 0.79,
    assumptions: ['The ceiling can absorb eighteen percent for two quarters.'],
    counterargument: 'Finance holds that the increase is not absorbable at all.',
    risk: 'Locks in a higher unit cost if the incumbent surcharge lapses.',
    unknowns: ['Whether the expedite surcharge persists.'],
    recommendation: 'Dual-source with a two-quarter review gate.',
  });

  const optionA = xiv.proposeOption(cfo, {
    meetingId: meeting.id,
    optionKey: 'A',
    title: 'Renegotiate with the incumbent',
    agentId: agents.finance.id,
    xarpRole: 'financial',
    claim: 'A penalty clause buys most of the resilience at none of the cost.',
    evidenceIds: [cost.id],
    source: 'Deliberation of 2026-09-08',
    confidence: 0.72,
    assumptions: ['The incumbent will accept a penalty clause.'],
    counterargument: 'A penalty clause does not remove the single-berth dependency.',
    risk: 'Leaves the closure exposure untouched.',
    unknowns: ['Whether the incumbent will sign.'],
    recommendation: 'Renegotiate before committing capital.',
  });
  walk(meeting.id, 'alternatives_generated', 'Two options, both evidenced.');

  // 8. Risk analysis, then a blocking objection that does not get talked away.
  xiv.castVote(founder, {
    meetingId: meeting.id,
    proposalId: optionB.id,
    agentId: agents.risk.id,
    xarpRole: 'risk',
    vote: 'support',
    rationale: 'The closure exposure is the larger tail risk.',
    citedEvidenceIds: [resilience.id],
    confidence: 0.7,
  });
  xiv.castVote(founder, {
    meetingId: meeting.id,
    proposalId: optionB.id,
    agentId: agents.ai_evaluation.id,
    xarpRole: 'challenger',
    vote: 'insufficient_evidence',
    rationale: 'Two weather-driven closures do not establish structural exposure.',
  });
  const objection = xiv.raiseObjection(cfo, {
    meetingId: meeting.id,
    proposalId: optionB.id,
    agentId: agents.finance.id,
    xarpRole: 'financial',
    objection: 'Eighteen percent breaches the divisional ceiling and cannot be absorbed.',
    severity: 'blocking',
    supportingEvidenceId: cost.id,
  });
  walk(meeting.id, 'risk_analysis', 'One support, one insufficient-evidence, one blocking objection.');

  // 9. The room does not reach consensus, and says so.
  const synthesis = xiv.synthesize(founder, {
    meetingId: meeting.id,
    synthesizerAgentId: agents.coordinator.id,
  });
  walk(meeting.id, 'consensus_or_disagreement', 'No consensus; the disagreement travels with the options.');
  walk(meeting.id, 'human_checkpoint', 'Escalated because a blocking objection is unresolved.');

  // 10. The human decides. The executive resolves the objection explicitly
  //     rather than the room deciding it had been answered.
  xiv.resolveObjection(founder, {
    objectionId: objection.id,
    resolutionKind: 'mitigated',
    resolution: 'Capped at two quarters with a mandatory review gate and CFO sign-off on renewal.',
  });

  const decision = xiv.decide(founder, {
    meetingId: meeting.id,
    decisionKind: 'approved',
    selectedProposalId: optionB.id,
    rationale:
      'Accepting two quarters of cost exposure to remove the berth dependency, with the finance objection '
      + 'mitigated by a review gate rather than dismissed.',
    humanKnowledgeRecordId: humanContext.id,
  });

  // decide() moves the lifecycle itself, because recording a decision and being
  // at the decision stage are the same event.
  stagesWalked.push('decision');

  const approval = xiv.recordHumanKnowledge(founder, {
    meetingId: meeting.id,
    category: 'HUMAN_APPROVAL',
    statement: 'Approved for two quarters with a review gate.',
    approvesDecisionId: decision.id,
  });

  // 11. Authorized action, with a way back.
  const action = xiv.queueAction(founder, {
    meetingId: meeting.id,
    decisionId: decision.id,
    action: 'Open a dual-source purchase order with Supplier B.',
    authorizationBasis: `Meeting decision ${decision.id}, approved by the universe supervisor.`,
    assignedAgentId: agents.coordinator.id,
    rollbackPlan: 'Cancel before the first release and revert to the single-source contract.',
  });
  xiv.authorizeAction(founder, { actionId: action.id });
  const executed = xiv.executeAction(founder, { actionId: action.id });
  walk(meeting.id, 'authorized_action', 'Queued, approved by a named human, executed with a rollback plan.');

  // 12. Outcome, measured at a horizon rather than declared at the time.
  const outcome = xiv.recordMeetingOutcome(founder, {
    meetingId: meeting.id,
    decisionId: decision.id,
    actionId: action.id,
    horizonDays: 90,
    predicted: { cost_increase_pct: 18, closure_days_lost: 0 },
    observed: { cost_increase_pct: 14, closure_days_lost: 0 },
    outcomeGrade: 'successful',
    notes: 'The incumbent surcharge lapsed, so the realised increase came in below the quote.',
  });
  walk(meeting.id, 'outcome', 'Measured at ninety days against what was predicted.');

  // 13. The agents whose evidence carried the decision are graded on it.
  const reputations = xiv.learnFromOutcome(founder, { outcomeId: outcome.id });
  walk(meeting.id, 'post_meeting_evaluation', 'Reputation updated from the measured outcome.');
  walk(meeting.id, 'knowledge_lineage', 'Decision, evidence and outcome linked for reconstruction.');

  const brief = xiv.listMeetingActions(founder);
  const unauthorizedActionsExecuted = brief.filter(
    (item) => item.executedAt !== null && item.requiresHumanApproval && !item.approvedBy,
  ).length;

  return {
    civilization: xiv,
    founder,
    cfo,
    agents,
    meeting: xiv.listMeetings(founder).find((item) => item.id === meeting.id) ?? meeting,
    stagesWalked,
    synthesis,
    rejectedOptionKey: optionA.optionKey,
    decision,
    action: executed,
    humanApprovalRecordId: approval.id,
    outcomeGrade: outcome.outcomeGrade,
    reputationAfter: reputations.map((item) => ({
      agentId: item.agentId,
      composite: item.composite,
      maxImpactLevel: item.maxImpactLevel,
    })),
    unauthorizedActionsExecuted,
    auditTrail: xiv.auditTrail(founder),
  };
}

// Every stage the story names, so a reader can check the walk against the list
// rather than counting calls. 'trigger' is the event that produces the meeting
// rather than a state the meeting passes through, so the walk starts at
// 'created'.
export const REQUIRED_DEMONSTRATION_STAGES = MEETING_STAGES.filter((stage) => stage !== 'trigger');
