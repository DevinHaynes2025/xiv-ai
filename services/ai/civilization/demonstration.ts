import { createCivilization, type Civilization } from './civilization';
import { evidenceRef } from './human-bridge';
import type { Clock, IdFactory } from './store';
import { describeOperatingTime, adaptRecommendation } from './temporal';
import type {
  ActorContext,
  AgentIdentity,
  GovernanceEvent,
  Meeting,
  TaskForceRecommendation,
  XacpMessage,
} from './types';

// The acceptance path for 2I-AI-62A, executed end to end against the governed
// layer rather than described in prose:
//
//   Human -> XIV Universe -> Coordinator Agent -> specialist agents ->
//   private agent meeting -> evidence exchange -> recommendation ->
//   human approval -> audited result
//
// Everything below runs through the same tenancy, guardian, quota and
// evaluation checks that any caller would hit. There is no privileged path.
export type DemonstrationResult = {
  civilization: Civilization;
  founder: ActorContext;
  executive: ActorContext;
  coordinator: AgentIdentity;
  specialists: AgentIdentity[];
  meeting: Meeting;
  conversation: XacpMessage[];
  protocolWalk: XacpMessage[];
  recommendation: TaskForceRecommendation;
  humanJudgmentStatement: string;
  approvedTaskId: string;
  auditedResult: Record<string, unknown>;
  costMicroUsd: number;
  auditTrail: GovernanceEvent[];
};

const SPECIALIST_BLUEPRINTS = [
  { agentKey: 'logistics', displayName: 'Logistics Agent', profession: 'logistics' },
  { agentKey: 'weather', displayName: 'Weather Agent', profession: 'weather' },
  { agentKey: 'procurement', displayName: 'Procurement Agent', profession: 'procurement' },
  { agentKey: 'finance', displayName: 'Finance Agent', profession: 'finance' },
  { agentKey: 'risk', displayName: 'Risk Agent', profession: 'risk' },
  { agentKey: 'geopolitical', displayName: 'Geopolitical Intelligence Agent', profession: 'geopolitical' },
  { agentKey: 'warehouse', displayName: 'Warehouse Agent', profession: 'warehouse' },
  { agentKey: 'customer', displayName: 'Customer Agent', profession: 'customer' },
] as const;

export function runSupplyChainTaskForceDemonstration(options?: {
  clock?: Clock;
  nextId?: IdFactory;
  founderUserId?: string;
  executiveUserId?: string;
  organizationId?: string;
}): DemonstrationResult {
  const xiv = createCivilization({ clock: options?.clock, nextId: options?.nextId });
  const founderUserId = options?.founderUserId ?? 'human-founder';
  const executiveUserId = options?.executiveUserId ?? 'human-executive';

  // 1. A human creates the universe and walks it into an operational lifecycle.
  const universe = xiv.createUniverse({
    organizationId: options?.organizationId ?? 'org-northwind',
    name: 'Northwind Operations Universe',
    createdBy: founderUserId,
    securityClassification: 'confidential',
    constellationKey: 'constellation.northwind',
    galaxyKey: null,
  });

  const founder: ActorContext = { userId: founderUserId, universeId: universe.id };
  const executive: ActorContext = { userId: executiveUserId, universeId: universe.id };

  xiv.addMember(founder, { userId: executiveUserId, membershipRole: 'supervisor', isSupervisor: true });
  xiv.advanceLifecycle(founder, { to: 'seed' });
  xiv.advanceLifecycle(founder, { to: 'growth' });
  xiv.advanceLifecycle(founder, { to: 'operational' });

  // 2. Quotas exist before any agent does.
  xiv.setResourceBudget(founder, {
    maxRegisteredAgents: 12,
    maxActiveAgents: 9,
    maxQueuedTasks: 25,
    maxCostMicroUsd: 2_000_000,
    hardStop: true,
  });

  // 3. Runtime is described as capabilities, never as a chip vendor. The
  // orbital node is registered purely so the interface exists; it stays
  // unconfigured and cannot be selected.
  const cloudNode = xiv.registerRuntimeNode(founder, {
    nodeKey: 'cloud-inference-01',
    platformClass: 'cloud_gpu',
    provider: 'primary-cloud',
    region: 'eu-west',
    status: 'available',
  });
  xiv.declareRuntimeCapability(founder, {
    nodeId: cloudNode.id,
    capabilityKey: 'compute.gpu.inference',
    verified: true,
  });
  xiv.declareRuntimeCapability(founder, {
    nodeId: cloudNode.id,
    capabilityKey: 'security.tenant_isolated_memory',
    verified: true,
  });
  xiv.registerRuntimeNode(founder, {
    nodeKey: 'orbital-reserved-01',
    platformClass: 'orbital_compute',
    provider: 'unconfigured-external',
  });

  const placement = xiv.requestCompute(founder, {
    required: ['compute.gpu.inference', 'security.tenant_isolated_memory'],
  });

  // 4. The coordinator and its specialists receive controlled identities.
  const coordinator = xiv.registerAgent(founder, {
    agentKey: 'coordinator',
    displayName: 'Northwind Coordinator',
    profession: 'coordination',
    specialization: 'supply chain coordination',
    modelRuntime: placement.node.nodeKey,
    memoryScope: 'universe',
    humanSupervisorId: executiveUserId,
    languages: ['en', 'de'],
    culturalContexts: ['eu-business-formal'],
    knowledgeDomains: ['supply_chain', 'logistics'],
    provenance: { requestedBy: founderUserId, reason: 'supply chain disruption response' },
  });

  const specialists = SPECIALIST_BLUEPRINTS.map((blueprint) =>
    xiv.registerAgent(founder, {
      agentKey: blueprint.agentKey,
      displayName: blueprint.displayName,
      profession: blueprint.profession,
      modelRuntime: placement.node.nodeKey,
      humanSupervisorId: executiveUserId,
      parentAgentId: coordinator.id,
      languages: ['en'],
      knowledgeDomains: [blueprint.profession],
    }),
  );

  // 5. Every agent passes the activation gate before it can hold runtime.
  for (const agent of [coordinator, ...specialists]) {
    xiv.grantCapability(founder, {
      agentId: agent.id,
      capabilityKind: 'tool',
      capabilityKey: 'summarize_business_health',
      riskLevel: 'low',
      approved: true,
    });
    xiv.recordEvaluation(founder, { agentId: agent.id, evaluationKind: 'safety', score: 0.94, passed: true });
    xiv.recordEvaluation(founder, { agentId: agent.id, evaluationKind: 'tenancy_isolation', score: 0.99, passed: true });
    xiv.activateAgent(founder, { agentId: agent.id });
  }

  // 6. Discovery only reaches peers a supervisor connected.
  for (const specialist of specialists) {
    xiv.authorizeRelationship(founder, {
      fromAgentId: coordinator.id,
      toAgentId: specialist.id,
      relationshipType: 'coordinates',
    });
    xiv.authorizeRelationship(founder, {
      fromAgentId: specialist.id,
      toAgentId: coordinator.id,
      relationshipType: 'reports_to',
    });
  }

  const discovered = xiv.discoverAgents(founder, { fromAgentId: coordinator.id });

  // 7. The task force forms around a human executive and dissolves later.
  const taskForce = xiv.formTaskForce(executive, {
    name: 'Supply Chain Crisis Task Force',
    purpose: 'Respond to a port closure affecting inbound components',
    humanExecutiveId: executiveUserId,
    memberAgentIds: discovered.map((agent) => agent.id),
  });

  // 8. Evidence enters as classified knowledge with lineage attached.
  const portClosure = xiv.recordKnowledgeSource(executive, {
    title: 'Port of Rotterdam berth closure notice',
    claimKind: 'human_fact',
    discipline: 'supply_chain',
    origin: 'carrier notice forwarded by the operations director',
    confidence: 0.95,
    securityClassification: 'confidential',
  });
  const weatherOutlook = xiv.recordKnowledgeSource(founder, {
    title: 'North Sea storm outlook, next 10 days',
    claimKind: 'external_source',
    discipline: 'meteorology',
    origin: 'national meteorological service bulletin',
    confidence: 0.72,
    recordedByAgentId: specialists[1].id,
  });
  const hanseaticPrecedent = xiv.recordKnowledgeSource(founder, {
    title: 'Hanseatic League contingency routing through Hamburg',
    claimKind: 'historical_evidence',
    discipline: 'trade',
    era: 'medieval',
    origin: 'municipal trade archive',
    civilizationOrLocation: 'Hanseatic League, northern Europe',
    originalLanguage: 'Middle Low German',
    originalText: 'de kopmanschop schal gan dorch Hamborch wan de haven to Brugge slaten is',
    translation: 'trade shall pass through Hamburg when the harbour at Bruges is closed',
    interpretation: 'Medieval traders kept a standing alternate port rather than negotiating one under pressure.',
    confidence: 0.55,
    contradictions: ['Later charters show the Bruges route reopening under different terms.'],
    recordedByAgentId: specialists[5].id,
  });
  const demandForecast = xiv.recordKnowledgeSource(founder, {
    title: 'Q4 component demand forecast',
    claimKind: 'prediction',
    discipline: 'finance',
    origin: 'internal forecast model',
    confidence: 0.48,
    recordedByAgentId: specialists[3].id,
  });

  // A medieval practice does not become a modern instruction. Asking what it
  // means today produces a separate, explicitly labelled inference.
  const modernReading = xiv.deriveModernRelevance(founder, {
    knowledgeSourceId: hanseaticPrecedent.id,
    relevance: 'Keep a pre-qualified secondary port under contract before disruption, not during it.',
    confidence: 0.6,
    derivedByAgentId: specialists[5].id,
  });

  // 9. The full XACP protocol walk, separate from the meeting room.
  const conversationId = 'xacp-supply-chain-crisis';
  const protocolWalk: XacpMessage[] = [];
  const situationEvidence = [
    evidenceRef({ label: portClosure.title, claimKind: 'human_fact', confidence: 0.95, knowledgeSourceId: portClosure.id }),
    evidenceRef({
      label: weatherOutlook.title,
      claimKind: 'external_source',
      confidence: 0.72,
      knowledgeSourceId: weatherOutlook.id,
    }),
  ];

  protocolWalk.push(
    xiv.sendMessage(founder, {
      conversationId,
      phase: 'discover',
      senderAgentId: coordinator.id,
      receiverAgentId: specialists[0].id,
      purpose: 'Identify the specialists needed for a port closure',
      reasoningArtifact: 'Coordinator matched the disruption type to logistics, weather and procurement professions.',
    }),
    xiv.sendMessage(founder, {
      conversationId,
      phase: 'request',
      senderAgentId: coordinator.id,
      receiverAgentId: specialists[0].id,
      purpose: 'Request current inbound routing exposure',
      reasoningArtifact: 'Routing exposure is the input every other specialist needs before it can reason.',
    }),
    xiv.sendMessage(founder, {
      conversationId,
      phase: 'negotiate',
      senderAgentId: specialists[0].id,
      receiverAgentId: coordinator.id,
      purpose: 'Agree the scope of the exposure review',
      reasoningArtifact: 'Logistics proposed limiting the review to inbound components rather than all freight.',
    }),
    xiv.sendMessage(founder, {
      conversationId,
      phase: 'reason',
      senderAgentId: specialists[0].id,
      receiverAgentId: coordinator.id,
      purpose: 'Explain the exposure',
      reasoningArtifact: 'Two of five inbound lanes terminate at the closed berth; the remainder are unaffected.',
      evidence: situationEvidence,
      confidence: 0.81,
    }),
    xiv.sendMessage(founder, {
      conversationId,
      phase: 'delegate',
      senderAgentId: coordinator.id,
      receiverAgentId: specialists[2].id,
      purpose: 'Delegate secondary supplier qualification',
      reasoningArtifact: 'Procurement owns supplier qualification; the coordinator does not.',
    }),
    xiv.sendMessage(founder, {
      conversationId,
      phase: 'collaborate',
      senderAgentId: specialists[2].id,
      receiverAgentId: coordinator.id,
      purpose: 'Return qualified alternates',
      reasoningArtifact: 'Two pre-qualified suppliers can absorb 15 percent of volume within the current terms.',
      evidence: situationEvidence,
      confidence: 0.74,
    }),
    xiv.sendMessage(founder, {
      conversationId,
      phase: 'verify',
      senderAgentId: specialists[4].id,
      receiverAgentId: coordinator.id,
      purpose: 'Verify the reallocation against risk limits',
      reasoningArtifact: 'Reallocation stays inside concentration limits but raises single-carrier dependency.',
      evidence: situationEvidence,
      confidence: 0.69,
    }),
    xiv.sendMessage(founder, {
      conversationId,
      phase: 'report',
      senderAgentId: coordinator.id,
      receiverUserId: executiveUserId,
      purpose: 'Report the task force position to the human executive',
      reasoningArtifact: 'Consolidated position with one unresolved objection from the finance specialist.',
      evidence: situationEvidence,
      decision: 'recommend_partial_reallocation',
      confidence: 0.71,
      approvalStatus: 'pending',
    }),
  );

  // 10. The private meeting room, where the human can enter the reasoning.
  const meeting = xiv.openMeeting(executive, {
    title: 'Port closure response',
    agenda: [
      { title: 'Situation', detail: 'Berth closure and weather outlook' },
      { title: 'Alternatives', detail: 'Reallocate, wait, or expedite by air' },
      { title: 'Recommendation', detail: 'What we ask the executive to approve' },
    ],
    taskForceId: taskForce.id,
    securityClassification: 'confidential',
    requiresHumanDecision: true,
  });

  xiv.joinMeeting(executive, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: coordinator.id,
    participantRole: 'chair',
  });
  for (const specialist of specialists) {
    xiv.joinMeeting(executive, {
      meetingId: meeting.id,
      participantKind: 'agent',
      agentId: specialist.id,
      participantRole: 'contributor',
    });
  }
  xiv.joinMeeting(executive, {
    meetingId: meeting.id,
    participantKind: 'human',
    userId: executiveUserId,
    participantRole: 'human_executive',
  });

  xiv.contribute(executive, {
    meetingId: meeting.id,
    kind: 'evidence',
    fromUserId: executiveUserId,
    statement: 'The berth closure notice came directly from the carrier',
    reasoning: 'Stated as a human fact so the agents do not treat it as an inference.',
    evidence: [
      evidenceRef({
        label: portClosure.title,
        claimKind: 'human_fact',
        confidence: 0.95,
        knowledgeSourceId: portClosure.id,
      }),
    ],
  });

  xiv.contribute(executive, {
    meetingId: meeting.id,
    kind: 'proposal',
    fromAgentId: specialists[2].id,
    statement: 'Reallocate 15 percent of inbound volume to the qualified secondary supplier',
    reasoning: 'Two suppliers are already qualified, so no new contract is required.',
    evidence: situationEvidence,
    confidence: 0.74,
  });

  xiv.contribute(executive, {
    meetingId: meeting.id,
    kind: 'alternative_hypothesis',
    fromAgentId: specialists[5].id,
    statement: 'Hold a standing secondary port rather than reacting per incident',
    reasoning: 'A medieval trade precedent points at the same structural answer, offered as an inference only.',
    evidence: [
      evidenceRef({
        label: modernReading.title,
        claimKind: 'agent_inference',
        confidence: 0.6,
        knowledgeSourceId: modernReading.id,
      }),
      evidenceRef({
        label: hanseaticPrecedent.title,
        claimKind: 'historical_evidence',
        confidence: 0.55,
        knowledgeSourceId: hanseaticPrecedent.id,
      }),
    ],
    confidence: 0.6,
  });

  xiv.contribute(executive, {
    meetingId: meeting.id,
    kind: 'objection',
    fromAgentId: specialists[3].id,
    statement: 'Q4 demand is a forecast, so the cost of reallocation is not yet bounded',
    reasoning: 'The finance position rests on a prediction and cannot carry a spending decision on its own.',
    evidence: [
      evidenceRef({
        label: demandForecast.title,
        claimKind: 'prediction',
        confidence: 0.48,
        knowledgeSourceId: demandForecast.id,
      }),
    ],
    confidence: 0.48,
  });

  xiv.recordVote(executive, {
    meetingId: meeting.id,
    agentId: coordinator.id,
    vote: 'recommend',
    rationale: 'Partial reallocation is reversible and keeps two lanes untouched.',
  });
  xiv.recordVote(executive, {
    meetingId: meeting.id,
    agentId: specialists[2].id,
    vote: 'recommend',
    rationale: 'Suppliers are pre-qualified.',
  });
  xiv.recordVote(executive, {
    meetingId: meeting.id,
    agentId: specialists[3].id,
    vote: 'object',
    rationale: 'Cost exposure rests on a forecast.',
  });
  xiv.recordVote(executive, {
    meetingId: meeting.id,
    agentId: specialists[4].id,
    vote: 'insufficient_evidence',
    rationale: 'Carrier dependency after reallocation is not yet measured.',
  });

  const deliberation = xiv.summarizeDeliberation(executive, meeting.id);
  xiv.escalateToHuman(executive, {
    meetingId: meeting.id,
    reason: deliberation.statement,
  });

  // 11. Situation -> Evidence -> Alternatives -> Risk -> Recommendation -> Required Approval.
  const operatingTime = describeOperatingTime(new Date(xiv.state.clock()), {
    region: 'eu-west',
    utcOffsetMinutes: 60,
    fiscalYearStartMonth: 1,
  });
  const adapted = adaptRecommendation({
    stage: xiv.readUniverse(executive).lifecycleStage,
    operatingTime,
    recommendation: 'Reallocate 15 percent of inbound volume to the qualified secondary supplier',
  });

  const recommendation: TaskForceRecommendation = {
    situation: 'A berth closure removes two of five inbound lanes for an estimated ten days.',
    evidence: [portClosure.title, weatherOutlook.title, hanseaticPrecedent.title, demandForecast.title],
    alternatives: [
      'Reallocate 15 percent of volume to a qualified secondary supplier',
      'Hold and absorb the delay',
      'Expedite the shortfall by air at a premium',
    ],
    risk: 'Reallocation raises single-carrier dependency; holding risks a stockout in two product lines.',
    recommendation: adapted.recommendation,
    requiredApproval: 'Human executive approval, because the cost exposure rests on a forecast.',
  };
  xiv.recordRecommendation(executive, { taskForceId: taskForce.id, recommendation });

  // 12. The consequential step is a task with a rollback plan, and it waits.
  const task = xiv.queueTask(executive, {
    title: 'Reallocate 15 percent of inbound volume',
    description: recommendation.recommendation,
    taskForceId: taskForce.id,
    assignedAgentId: specialists[2].id,
    priority: 10,
    requiresHumanApproval: true,
    rollbackPlan: 'Restore the original lane allocation from the pre-change snapshot and notify both carriers.',
    costEstimateMicroUsd: 120_000,
  });

  const schedule = xiv.runScheduler(executive);
  const approved = xiv.approveTask(executive, {
    taskId: task.id,
    note: 'Approved with the finance objection recorded as unresolved.',
  });
  xiv.startTask(executive, { taskId: approved.id });
  const completed = xiv.completeTask(executive, {
    taskId: approved.id,
    result: {
      reallocatedPercent: 15,
      secondarySupplier: 'qualified-supplier-2',
      lanesUntouched: 3,
      prototype: true,
      production: false,
    },
    costActualMicroUsd: 118_400,
  });

  // 13. The human decision becomes an attributable governance record.
  xiv.decideMeeting(executive, {
    meetingId: meeting.id,
    decision: 'Approve partial reallocation and open a separate review of carrier dependency',
    rationale: 'The reversible option is acceptable; the unresolved objection becomes its own review.',
  });

  xiv.recordLineage(executive, {
    knowledgeSourceId: portClosure.id,
    stage: 'decision',
    actorKind: 'human',
    detail: 'Executive approved partial reallocation on this evidence.',
    relatedTaskId: completed.id,
    relatedMeetingId: meeting.id,
  });

  const conversation = xiv.readConversation(executive, meeting.id);
  xiv.archiveMeeting(executive, {
    meetingId: meeting.id,
    summary:
      'Partial reallocation approved by the human executive. The finance objection about forecast-based cost exposure remains open as a separate review.',
  });
  xiv.archiveConversation(executive, {
    conversationId,
    summary: 'Port closure response completed and approved by the human executive.',
  });
  xiv.dissolveTaskForce(executive, { taskForceId: taskForce.id });

  // 14. Agents go back to sleep. Nothing stays resident because it once ran.
  for (const specialist of specialists) {
    xiv.sleepAgent(founder, { agentId: specialist.id });
  }
  xiv.sleepAgent(founder, { agentId: coordinator.id });

  const telemetry = xiv.costTelemetry(executive);

  return {
    civilization: xiv,
    founder,
    executive,
    coordinator,
    specialists,
    meeting: xiv.listMeetings(executive).find((item) => item.id === meeting.id) ?? meeting,
    conversation,
    protocolWalk,
    recommendation,
    humanJudgmentStatement: deliberation.statement,
    approvedTaskId: completed.id,
    auditedResult: {
      taskStatus: completed.status,
      approvedBy: completed.approvedBy,
      result: completed.result,
      scheduledAwaitingApproval: schedule.awaitingApproval.length,
      meetingDecision: meeting.decision,
      meetingDecisionBy: meeting.decisionBy,
      unresolvedDisagreements: meeting.unresolvedDisagreements,
    },
    costMicroUsd: telemetry.consumedCostMicroUsd,
    auditTrail: xiv.auditTrail(executive),
  };
}
