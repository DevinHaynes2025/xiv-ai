import { publishPersistentAgentMessage } from './persistent-agent-bus';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { runLocalDevelopmentCivilization } from './local-dev-civilization';
import { createFounderDigitalTwin, twinAct, type FounderDigitalTwin } from './founder-digital-twin';
import { rememberFounderMemory } from './founder-memory-vault';
import { simulateFounderDecision } from './founder-decision-engine';
import { planVirtualFounderDelegates, type FounderDelegateDepartment } from './founder-delegates';
import { GlobalBrainHighways, GLOBAL_BRAIN_PIPELINE } from './global-brain-highways';
import { cloudToolRoutingDecision, listSharedToolCapabilities, requestSharedTool } from './tool-capability-exchange';
import { planRdRecruiting } from './rd-recruiting-planner';
import { conveneMarketingIntelligenceCouncil } from './marketing-intelligence-council';
import { conveneGlobalResearchCouncil } from './global-research-council';
import { runDebriefRecoveryCycle } from './debrief-recovery';
import { inspectBrainHighwayHealth } from './brain-highway-health';
import { addressLogicalContext, simulateVirtualPopulation } from './virtual-population';
import type { AgentDemand } from './demand-agent-planner';
import type { WorkEnvelope, ProviderObservation } from './collaboration-protocol';
import type { PatchFileChange } from './coding-agent';
import type { TestingAgentRunner } from './testing-agent';
import type { ConsequenceClass } from './decision-gate';

export { GLOBAL_BRAIN_PIPELINE };

export type GlobalBrainStoryInput = {
  founderId: string;
  tenantId: string;
  universeId: string;
  storyId: string;
  objective: string;
  departments?: FounderDelegateDepartment[];
  consequence?: ConsequenceClass;
  twinClaimedFounderApproval?: boolean;
  founderAuthorization?: {
    source: 'human_founder';
    founderId: string;
    authorizedAction: string;
    evidenceRefs: string[];
  };
  envelope: WorkEnvelope;
  demand: AgentDemand;
  observations: ProviderObservation[];
  currentBranch: string;
  files: PatchFileChange[];
  cwd: string;
  testCommands?: string[];
  runner?: TestingAgentRunner;
};

export async function runGlobalBrainStory(input: GlobalBrainStoryInput) {
  const highways = new GlobalBrainHighways();
  highways.ensureScope(input.tenantId, input.universeId);

  const twin: FounderDigitalTwin = createFounderDigitalTwin({
    founderId: input.founderId,
    tenantId: input.tenantId,
    universeId: input.universeId,
  });

  const twinGate = twinAct({
    twin,
    action: input.objective,
    kind: input.twinClaimedFounderApproval ? 'fabricate_founder_approval' : 'route',
    consequence: input.consequence,
  });

  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'founder_twin',
    toLane: 'department',
    topic: input.storyId,
    body: input.objective,
    evidenceRefs: ['62L-V:story-start'],
  });

  if (!twinGate.allowed) {
    return {
      pipeline: GLOBAL_BRAIN_PIPELINE,
      twin,
      twinGate,
      status: 'DENIED' as const,
      productionAuthorization: false as const,
      founderApprovalFabricated: false as const,
      highways: highways.stats(),
    };
  }

  await rememberFounderMemory({
    twinId: twin.id,
    founderId: input.founderId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'decision',
    subject: input.storyId,
    summary: `Twin routed story ${input.storyId} as a simulated recommendation only.`,
    sourceRefs: ['62L-V:orchestrator'],
    root: input.cwd,
  });

  const departments = input.departments ?? ['rd', 'engineering', 'marketing', 'finance', 'supply_chain'];
  const delegates = planVirtualFounderDelegates({
    twin,
    departments,
    consequence: input.consequence ?? 'LOW',
    approved: true,
    taskId: input.demand.taskId,
  });

  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'department',
    toLane: 'agent_team',
    topic: 'delegates',
    body: delegates.delegates.map((delegate) => delegate.department).join(','),
  });

  const recruiting = planRdRecruiting({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: `${input.demand.taskId}-rd`,
    focus: input.objective,
    consequence: input.consequence ?? 'LOW',
    approved: true,
  });

  const tools = listSharedToolCapabilities();
  const localModel = requestSharedTool('local_model');
  const cloud = cloudToolRoutingDecision();
  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'agent_team',
    toLane: 'tool_model',
    topic: 'tool-exchange',
    body: `local_model=${localModel.state}; cloud=${cloud.cloud}`,
  });

  const research = await conveneGlobalResearchCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.objective,
    consequence: input.consequence ?? 'LOW',
    approved: true,
    root: input.cwd,
  });
  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'knowledge',
    toLane: 'debate',
    topic: 'research-council',
    body: research.reason,
    evidenceRefs: research.knowledge.evidenceRefs,
  });

  const marketing = await conveneMarketingIntelligenceCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    topic: input.objective,
    consequence: input.consequence ?? 'LOW',
    approved: true,
    root: input.cwd,
  });
  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'debate',
    toLane: 'decision',
    topic: 'marketing-council',
    body: marketing.reason,
  });

  const decision = await simulateFounderDecision({
    twin,
    action: input.objective,
    consequence: input.consequence ?? 'LOW',
    twinClaimedFounderApproval: input.twinClaimedFounderApproval,
    founderAuthorization: input.founderAuthorization,
    root: input.cwd,
  });
  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'decision',
    toLane: 'build',
    topic: 'simulated-decision',
    body: decision.reason,
  });

  const civilization = await runLocalDevelopmentCivilization({
    envelope: input.envelope,
    demand: input.demand,
    observations: input.observations,
    currentBranch: input.currentBranch,
    files: input.files,
    cwd: input.cwd,
    testCommands: input.testCommands,
    runner: input.runner,
  });

  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'build',
    toLane: 'test',
    topic: 'civilization',
    body: civilization.status,
    evidenceRefs: civilization.evidenceRefs,
  });
  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'test',
    toLane: 'evidence',
    topic: 'tests',
    body: civilization.testing?.reason ?? 'no tests',
  });

  const outcome = {
    status: civilization.status,
    decisionKind: decision.kind,
    researchStatus: research.status,
    marketingStatus: marketing.status,
    recruitingStatus: recruiting.status,
  };

  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'evidence',
    toLane: 'outcome',
    topic: 'outcome',
    body: JSON.stringify(outcome),
    evidenceRefs: civilization.evidenceRefs,
  });

  const learning = await appendLearning({
    domain: 'technology',
    subject: `story:${input.storyId}`,
    claimState: 'MODEL_INFERENCE',
    summary: `Global Brain story ${input.storyId} outcome ${civilization.status}. Twin did not fabricate founder approval.`,
    sourceRefs: civilization.evidenceRefs,
    evidence: [decision.reason, research.reason, marketing.reason],
    confidence: 0.5,
    taskId: input.demand.taskId,
  }, input.cwd);

  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'outcome',
    toLane: 'learning',
    topic: 'learning',
    body: learning.id,
  });

  await publishPersistentAgentMessage({
    fromRole: 'executive_synthesizer',
    toRole: 'executive_secretary',
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'status',
    body: `Story ${input.storyId} completed pipeline through debrief. productionAuthorization=false.`,
    evidenceRefs: [...civilization.evidenceRefs, learning.id],
    requiresHumanApproval: true,
  }, input.cwd);

  const debrief = await runDebriefRecoveryCycle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    taskId: input.demand.taskId,
    accomplishments: civilization.status !== 'BLOCKED' ? [`Prepared ${input.storyId}`] : [],
    failures: civilization.status === 'BLOCKED' ? ['Civilization pipeline blocked'] : [],
    assumptions: ['Local/offline preferred; unconfigured providers remain UNAVAILABLE'],
    resourceUse: { modelCalls: 0, residentAgents: delegates.recruitment.agents.length, notes: 'Sparse logical teams.' },
    lessons: ['Twin recommendations are not founder approval.', 'Trillions of Devins are addressable logical contexts, not running programs.'],
    nextPriorities: ['Wait for explicit founder authorization before any external effect.', 'Keep cloud UNAVAILABLE until configured.'],
    root: input.cwd,
  });

  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'learning',
    toLane: 'debrief',
    topic: 'debrief',
    body: debrief.record.id,
  });
  highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'debrief',
    toLane: 'next_story',
    topic: 'next',
    body: debrief.record.nextPriorities.join(' | '),
  });

  addressLogicalContext({
    tenantId: input.tenantId,
    universeId: input.universeId,
    highway: 'global-brain',
    department: 'engineering',
    pathwayIndex: 42,
  });

  const health = inspectBrainHighwayHealth(highways, { tenantId: input.tenantId, universeId: input.universeId });
  const population = simulateVirtualPopulation(highways.fabric);

  await appendEvidenceEvent({
    kind: 'evidence',
    storyId: input.storyId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Global Brain story ${input.storyId} finished the governed pipeline.`,
    payload: {
      pipeline: GLOBAL_BRAIN_PIPELINE,
      productionAuthorization: false,
      founderApprovalFabricated: false,
      populationHonesty: population.honesty,
    },
  }, input.cwd);

  return {
    pipeline: GLOBAL_BRAIN_PIPELINE,
    twin,
    twinGate,
    delegates,
    recruiting,
    tools,
    cloud,
    localModel,
    research,
    marketing,
    decision,
    civilization,
    learning,
    debrief,
    health,
    population,
    status: civilization.status,
    productionAuthorization: false as const,
    founderApprovalFabricated: false as const,
    highways: highways.stats(),
  };
}
