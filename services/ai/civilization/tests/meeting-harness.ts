import { createCivilization, type Civilization } from '../civilization';
import { temporalContextFor } from '../temporal';
import type { ActorContext, AgentIdentity, Meeting, TemporalContext } from '../types';
import { fixedClock, sequentialIds } from './harness';

// A boardroom big enough to hold a real disagreement.
//
// The 62A harness builds two universes with three agents, which is the right
// shape for isolation tests and too small for XARP: a room needs investigator,
// challenger, risk, human_liaison and synthesizer filled before it may
// synthesize anything. This builds that room, plus a second universe to keep
// every isolation assertion honest.

export type BoardroomWorld = {
  xiv: Civilization;
  founder: ActorContext;
  analyst: ActorContext;
  operatorOfFinance: ActorContext;
  rival: ActorContext;
  outsider: ActorContext;
  coordinator: AgentIdentity;
  investigator: AgentIdentity;
  challenger: AgentIdentity;
  risk: AgentIdentity;
  finance: AgentIdentity;
  rivalAgent: AgentIdentity;
  temporalContext: TemporalContext;
};

export function boardroomWorld(): BoardroomWorld {
  const xiv = createCivilization({ clock: fixedClock('2026-09-08T20:00:00.000Z'), nextId: sequentialIds() });

  const alpha = xiv.createUniverse({
    organizationId: 'org-alpha',
    name: 'Alpha Universe',
    createdBy: 'human-alpha',
  });
  const beta = xiv.createUniverse({
    organizationId: 'org-beta',
    name: 'Beta Universe',
    createdBy: 'human-beta',
  });

  const founder: ActorContext = { userId: 'human-alpha', universeId: alpha.id };
  const analyst: ActorContext = { userId: 'human-alpha-analyst', universeId: alpha.id };
  const operatorOfFinance: ActorContext = { userId: 'human-alpha-cfo', universeId: alpha.id };
  const rival: ActorContext = { userId: 'human-beta', universeId: beta.id };
  const outsider: ActorContext = { userId: 'human-nobody', universeId: alpha.id };

  xiv.addMember(founder, { userId: analyst.userId, membershipRole: 'participant' });
  xiv.addMember(founder, { userId: operatorOfFinance.userId, membershipRole: 'participant' });

  for (const actor of [founder, rival]) {
    xiv.setResourceBudget(actor, {
      maxRegisteredAgents: 12,
      maxActiveAgents: 10,
      maxQueuedTasks: 20,
      maxCostMicroUsd: 5_000_000,
    });
  }

  xiv.seedDirectory(founder);

  const coordinator = activate(xiv, founder, 'coordinator', 'Executive Coordinator', 'coordination');
  const investigator = activate(xiv, founder, 'demand', 'Demand Investigator', 'demand');
  const challenger = activate(xiv, founder, 'ai_evaluation', 'Evaluation Challenger', 'ai_evaluation');
  const risk = activate(xiv, founder, 'risk', 'Risk Analyst', 'risk');
  const finance = activate(xiv, founder, 'finance', 'Finance Analyst', 'finance');
  const rivalAgent = activate(xiv, rival, 'coordinator', 'Beta Coordinator', 'coordination');

  // 20:00 UTC is 05:00 the next morning in Osaka, which is exactly the kind of
  // thing a recommendation needs to know before it suggests calling the plant.
  const temporalContext = temporalContextFor(new Date('2026-09-08T20:00:00.000Z'), {
    location: 'Osaka',
    timeZone: 'Asia/Tokyo',
    utcOffsetMinutes: 540,
    organizationLifecycle: 'operational',
    businessCycle: 'peak inbound season',
  });

  return {
    xiv,
    founder,
    analyst,
    operatorOfFinance,
    rival,
    outsider,
    coordinator,
    investigator,
    challenger,
    risk,
    finance,
    rivalAgent,
    temporalContext,
  };
}

function activate(
  xiv: Civilization,
  actor: ActorContext,
  agentKey: string,
  displayName: string,
  profession: string,
): AgentIdentity {
  const agent = xiv.registerAgent(actor, {
    agentKey,
    displayName,
    profession,
    modelRuntime: 'test-runtime',
    humanSupervisorId: actor.userId,
  });
  xiv.recordEvaluation(actor, { agentId: agent.id, evaluationKind: 'safety', score: 0.9, passed: true });
  xiv.recordEvaluation(actor, { agentId: agent.id, evaluationKind: 'tenancy_isolation', score: 0.9, passed: true });
  xiv.activateAgent(actor, { agentId: agent.id });
  return agent;
}

// A supplier decision with every XARP role filled. Callers get a room that is
// ready to receive evidence; nothing is deliberated yet.
export function openSupplierRoom(
  world: BoardroomWorld,
  options?: { budget?: Parameters<Civilization['convene']>[1]['budget'] },
): Meeting {
  const { xiv, founder } = world;

  const meeting = xiv.convene(founder, {
    title: 'Supplier resilience versus cost',
    agenda: [
      { title: 'Situation', detail: 'Line two lost six hours to an inbound delay.' },
      { title: 'Question', detail: 'Do we dual-source, and at what cost?' },
    ],
    triggerKind: 'threshold_breach',
    triggerDetail: 'Inbound delay crossed the six-hour threshold.',
    temporalContext: world.temporalContext,
    workingLanguage: 'en',
    budget: options?.budget,
  });

  seatAll(world, meeting);
  return meeting;
}

export function seatAll(world: BoardroomWorld, meeting: Meeting) {
  const { xiv, founder } = world;

  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.coordinator.id,
    participantRole: 'chair',
    xarpRoles: ['synthesizer', 'human_liaison'],
  });
  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.investigator.id,
    xarpRoles: ['investigator'],
  });
  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.challenger.id,
    xarpRoles: ['challenger'],
  });
  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.risk.id,
    xarpRoles: ['risk'],
  });
  // Seated by, and therefore relayed by, the CFO rather than the founder. This
  // is what makes the impersonation tests meaningful.
  xiv.seat(world.operatorOfFinance, {
    meetingId: meeting.id,
    participantKind: 'agent',
    agentId: world.finance.id,
    xarpRoles: ['financial'],
  });
  xiv.seat(founder, {
    meetingId: meeting.id,
    participantKind: 'human',
    userId: founder.userId,
    participantRole: 'human_executive',
  });
}

// Two pieces of evidence that genuinely pull in opposite directions, so the room
// has something real to disagree about.
export function loadEvidence(world: BoardroomWorld, meeting: Meeting) {
  const { xiv, founder } = world;

  const resilience = xiv.submitEvidence(founder, {
    meetingId: meeting.id,
    agentId: world.investigator.id,
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
    counterargument: 'Both closures were weather driven, so they may not recur politically.',
    risk: 'A third closure in peak season strands roughly six weeks of inbound volume.',
    unknowns: ['Whether the second berth reopens in Q4.'],
    claimKind: 'external_source',
  });

  const cost = xiv.submitEvidence(world.operatorOfFinance, {
    meetingId: meeting.id,
    agentId: world.finance.id,
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

  return { resilience, cost };
}
