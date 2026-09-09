import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { retrieveEvidencePathway } from './cortex-evidence';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import { planDemandAgents } from './demand-agent-planner';
import { LocalCheckpointStore } from './checkpoint-store';
import { recoverInterruptedWorkcells } from './offline-agent-runtime';
import {
  admitWorkcell,
  releaseWorkcell,
  resetResourceBudget,
  resourceBudgetFor,
} from './resource-governor';
import {
  runBoundedImprovementAfterEvidence,
  runInfrastructureWorkcell,
  runProtectedCodingWorkcell,
  runQuantWorkcell,
  runResearchWorkcell,
  runTestFixRetestLoop,
} from './offline-workcells';
import { runScenarioSimulation } from './simulation-lab';
import { verifySecurity } from './security-verifier';
import type { AllowedLocalCommand } from './local-command-runner';
import type { TestingAgentRunner } from './testing-agent';
import {
  recoverSocietyRegistry,
  registerDepartmentAgents,
  societyRegistryStats,
  type SocietyDepartment,
} from './persistent-agent-registry';
import { conveneDepartmentCouncil, multiModelCouncilSlots, probeDistributedMeshModule } from './department-councils';
import {
  compareAgainstBaseline,
  computeEvaluationMetrics,
  evolveSkillsFromEvaluation,
  latestBaseline,
  listComparisons,
  recordEvaluation,
  recordStrategyOutcome,
  strategyReputation,
} from './evaluation-harness';
import {
  gateStoryAgainstCeoPriorities,
  probeCeoSealedVaultModule,
  type CompartmentActor,
} from './privacy-compartments';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { providerSlots } from './provider-fabric';
import { buildFounderReport } from './founder-report';

export const INTELLIGENCE_CYCLE = [
  'approved_story',
  'universe_kernel',
  'agent_council',
  'local_knowledge',
  'debate',
  'plan',
  'work',
  'test_simulation',
  'skeptic_review',
  'evidence',
  'decision_gate',
  'outcome',
  'evaluation',
  'skill_strategy_update',
  'memory',
  'debrief',
  'next_story',
] as const;

export type IntelligenceHop = (typeof INTELLIGENCE_CYCLE)[number];
export type SocietyWorkKind = SocietyDepartment;
export type CycleState =
  | 'queued'
  | 'running'
  | 'completed'
  | 'waiting_data'
  | 'unavailable'
  | 'denied'
  | 'failed';

export type HopEvidence = 'PASS' | 'FAIL' | 'UNAVAILABLE' | 'WAITING_DATA' | 'UNKNOWN' | 'NOT_TESTED' | 'DENIED';

export class SocietySimulatedCrash extends Error {
  hop: IntelligenceHop;
  constructor(hop: IntelligenceHop) {
    super(`Simulated society crash after hop ${hop}`);
    this.name = 'SocietySimulatedCrash';
    this.hop = hop;
  }
}

export type SocietyStory = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  objective: string;
  approved: boolean;
  workKind: SocietyWorkKind;
  storyTag?: string;
  contextPaths?: string[];
  repoRoot?: string;
  consequence?: ConsequenceClass;
  production?: boolean;
  permissionChange?: boolean;
  predictedConfidence?: number;
  actor?: CompartmentActor;
  patchFiles?: Array<{ path: string; action: 'create' | 'modify' | 'delete'; unifiedDiff: string }>;
  testCommands?: AllowedLocalCommand[];
  testRunner?: TestingAgentRunner;
  crashAfterHop?: IntelligenceHop;
};

export type CycleHopRecord = {
  hop: IntelligenceHop;
  state: HopEvidence;
  summary: string;
  at: string;
};

export type IntelligenceCycleRecord = {
  id: string;
  storyId: string;
  tenantId: string;
  universeId: string;
  state: CycleState;
  completedHops: CycleHopRecord[];
  evidenceRefs: string[];
  retrievalBeforeReasoning: boolean;
  agentIds: string[];
  evaluationId?: string;
  comparisonId?: string;
  productionAuthorization: false;
  l4AutonomyEnabled: false;
  founderImpersonation: false;
  smarterBecauseMoreAgents: false;
  createdAt: string;
  updatedAt: string;
};

type Store = { cycles: IntelligenceCycleRecord[]; recoveredCrashes: number };

function storePath(root: string) {
  return xivLocalPath(root, 'agent-society-runtime.json');
}

async function loadStore(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { cycles: [], recoveredCrashes: 0 });
  return {
    cycles: Array.isArray(parsed.cycles) ? parsed.cycles : [],
    recoveredCrashes: typeof parsed.recoveredCrashes === 'number' ? parsed.recoveredCrashes : 0,
  };
}

async function saveStore(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), {
    cycles: store.cycles.slice(-2_000),
    recoveredCrashes: store.recoveredCrashes,
  });
}

export async function probeUniverseKernel(): Promise<{
  state: HopEvidence;
  modulePresent: boolean;
  reason: string;
}> {
  const file = join(dirname(fileURLToPath(import.meta.url)), 'universe-os-kernel.ts');
  try {
    await access(file);
    return {
      state: 'WAITING_DATA',
      modulePresent: true,
      reason: 'universe-os-kernel.ts is present locally but 62L-AF is not this child parent; hop stays WAITING_DATA until the AF report is the predecessor.',
    };
  } catch {
    return {
      state: 'WAITING_DATA',
      modulePresent: false,
      reason: '62L-AF Universe OS Kernel (Issue #43) is not on this AC parent.',
    };
  }
}

function hopRecord(hop: IntelligenceHop, state: HopEvidence, summary: string): CycleHopRecord {
  return { hop, state, summary, at: new Date().toISOString() };
}

function already(cycle: IntelligenceCycleRecord, hop: IntelligenceHop) {
  return cycle.completedHops.some((item) => item.hop === hop);
}

export async function recoverInterruptedSocietyCycles(root = process.cwd()) {
  const registry = await recoverSocietyRegistry({ root });
  const workcells = await recoverInterruptedWorkcells(root);
  const store = await loadStore(root);
  let recovered = 0;
  for (const cycle of store.cycles) {
    if (cycle.state === 'running') {
      cycle.state = 'queued';
      cycle.updatedAt = new Date().toISOString();
      recovered += 1;
    }
  }
  if (recovered) store.recoveredCrashes += recovered;
  await saveStore(root, store);
  return {
    cycles: recovered,
    registryAgents: registry.recovered,
    workcells: workcells.workcells,
    recoveredCrashes: store.recoveredCrashes,
    productionAuthorization: false as const,
  };
}

export async function runSafeParallelWorkcells(input: {
  tenantId: string;
  universeId: string;
  count: number;
}) {
  resetResourceBudget(input.tenantId, input.universeId);
  const admissions = [];
  for (let i = 0; i < input.count; i += 1) {
    admissions.push(admitWorkcell(input.tenantId, input.universeId));
  }
  const admitted = admissions.filter((item) => item.admitted);
  const refused = admissions.filter((item) => !item.admitted);
  for (const _ of admitted) releaseWorkcell(input.tenantId, input.universeId);
  return {
    requested: input.count,
    admitted: admitted.length,
    refused: refused.length,
    permissionExpansion: false as const,
    budget: resourceBudgetFor(input.tenantId, input.universeId),
  };
}

export async function runIntelligenceCycle(story: SocietyStory, root = process.cwd()) {
  const actor: CompartmentActor = story.actor ?? { id: 'society-runtime', kind: 'ordinary_agent' };
  const store = await loadStore(root);
  let cycle = store.cycles.find((item) => item.storyId === story.id && item.tenantId === story.tenantId && item.universeId === story.universeId);
  if (!cycle) {
    cycle = {
      id: cortexId('icycle'),
      storyId: story.id,
      tenantId: story.tenantId,
      universeId: story.universeId,
      state: 'queued',
      completedHops: [],
      evidenceRefs: [],
      retrievalBeforeReasoning: false,
      agentIds: [],
      productionAuthorization: false,
      l4AutonomyEnabled: false,
      founderImpersonation: false,
      smarterBecauseMoreAgents: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.cycles.push(cycle);
  }
  cycle.state = 'running';
  cycle.updatedAt = new Date().toISOString();
  await saveStore(root, store);

  const checkpoints = new LocalCheckpointStore(join(root, '.xiv-local', 'society-checkpoints.json'));
  const started = Date.now();
  let testPassed = false;
  let testAttempts = 0;
  let corrections = 0;
  let comparisonId: string | undefined;

  const finishHop = async (hop: IntelligenceHop, state: HopEvidence, summary: string) => {
    if (!already(cycle!, hop)) cycle!.completedHops.push(hopRecord(hop, state, summary));
    cycle!.updatedAt = new Date().toISOString();
    await saveStore(root, store);
    if (story.crashAfterHop === hop) throw new SocietySimulatedCrash(hop);
  };

  try {
    const gate = await gateStoryAgainstCeoPriorities({
      tenantId: story.tenantId,
      universeId: story.universeId,
      storyTag: story.storyTag,
      approved: story.approved,
      consequence: story.consequence,
      actor,
      root,
    });
    if (!gate.allowed) {
      cycle.state = 'denied';
      await finishHop('approved_story', 'DENIED', gate.reason);
      await saveStore(root, store);
      return { cycle, hops: cycle.completedHops };
    }
    await finishHop('approved_story', 'PASS', `Approved sandbox story ${story.id} passed CEO-priority gating.`);

    const kernel = await probeUniverseKernel();
    await finishHop('universe_kernel', kernel.state, kernel.reason);

    const registered = await registerDepartmentAgents({
      tenantId: story.tenantId,
      universeId: story.universeId,
      department: story.workKind,
      approved: true,
      root,
    });
    cycle.agentIds = registered.agents.map((agent) => agent.id);
    const council = await conveneDepartmentCouncil({
      tenantId: story.tenantId,
      universeId: story.universeId,
      kind: story.workKind,
      topic: story.objective,
      actor,
      root,
    });
    await finishHop(
      'agent_council',
      council.retrievalBeforeReasoning ? (council.runtimeState === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'PASS') : 'FAIL',
      `Department ${story.workKind} council ${council.id}; sealed=${council.sealedPayload}; consensusForced=${council.consensusForced}.`,
    );

    const knowledge = await retrieveEvidencePathway({
      tenantId: story.tenantId,
      universeId: story.universeId,
      query: story.objective,
      root,
    });
    cycle.evidenceRefs = knowledge.evidenceRefs;
    cycle.retrievalBeforeReasoning = true;
    await finishHop(
      'local_knowledge',
      knowledge.inventedFacts ? 'FAIL' : knowledge.state === 'AVAILABLE' ? 'PASS' : knowledge.state,
      knowledge.reason,
    );

    const debate = await conveneDepartmentCouncil({
      tenantId: story.tenantId,
      universeId: story.universeId,
      kind: story.workKind === 'research' ? 'skeptic' : story.workKind,
      topic: `Bounded debate: ${story.objective}`,
      maxRounds: 2,
      actor,
      root,
    });
    await finishHop(
      'debate',
      debate.consensusForced ? 'FAIL' : debate.runtimeState === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'PASS',
      `Bounded debate rounds=${debate.debateRounds}; dissent=${debate.dissent.length}; founderImpersonation=${debate.founderImpersonation}.`,
    );

    const plan = planDemandAgents({
      tenantId: story.tenantId,
      universeId: story.universeId,
      taskId: story.id,
      requestedRoles: council.roles.slice(0, 4),
      consequence: story.consequence ?? 'LOW',
      approved: story.approved,
    });
    await finishHop('plan', plan.status === 'PLANNED' ? 'PASS' : 'DENIED', `Demand planner status=${plan.status}.`);

    const cwd = story.repoRoot ?? root;
    if (story.workKind === 'coding' || story.workKind === 'testing' || story.workKind === 'security') {
      const coding = await runProtectedCodingWorkcell({
        tenantId: story.tenantId,
        universeId: story.universeId,
        storyId: story.id,
        objective: story.objective,
        files: story.patchFiles ?? [],
        cwd,
        testsExpected: story.testCommands,
        runner: story.testRunner,
        approved: true,
        root,
      });
      const security = story.patchFiles?.length
        ? verifySecurity({
          files: story.patchFiles.map((file) => ({ path: file.path, unifiedDiff: file.unifiedDiff })),
          productionLocks: { l4Autonomy: false, autoProduction: false, guardianOverride: false },
        })
        : coding.security;
      await finishHop(
        'work',
        coding.productionAuthorization ? 'FAIL' : 'PASS',
        `Coding/testing/security workcell; shell=${coding.shellCommands.length}; securityPassed=${security?.passed ?? false}.`,
      );
    } else if (story.workKind === 'research') {
      const research = await runResearchWorkcell({
        tenantId: story.tenantId,
        universeId: story.universeId,
        question: story.objective,
        hypothesis: story.title,
        root,
      });
      await finishHop('work', research.isReality ? 'FAIL' : 'PASS', `Research workcell speculativeOnly=${research.speculativeOnly}.`);
    } else if (story.workKind === 'quant_simulation') {
      const quant = await runQuantWorkcell({
        tenantId: story.tenantId,
        universeId: story.universeId,
        signals: [{ id: 'society-q', weight: 1, confidence: 0.5, direction: 0, evidenceRefs: knowledge.evidenceRefs }],
        includeQuantumResearch: true,
        root,
      });
      await finishHop('work', quant.tradingAuthorized ? 'FAIL' : 'PASS', `Quant workcell classical=${quant.classical.model}; qpu=${quant.bridge?.quantumState ?? 'NOT_REQUESTED'}.`);
    } else if (story.workKind === 'infrastructure') {
      const infra = await runInfrastructureWorkcell({
        tenantId: story.tenantId,
        universeId: story.universeId,
        nodes: [{
          id: 'society-node',
          kind: 'data_center',
          label: 'Sandbox society node',
          classification: 'internal',
          provenanceRefs: knowledge.evidenceRefs.length ? knowledge.evidenceRefs : ['synthetic:62lag'],
          state: 'KNOWN',
        }],
        root,
      });
      await finishHop('work', infra.physicalDeviceControl ? 'FAIL' : 'PASS', 'Infrastructure workcell has no physical device control.');
    } else {
      await finishHop('work', 'PASS', `Department ${story.workKind} used council + evidence work only.`);
    }

    const testLoop = await runTestFixRetestLoop({
      tenantId: story.tenantId,
      universeId: story.universeId,
      cwd,
      commands: story.testCommands?.length ? story.testCommands : ['git_diff_check'],
      maxAttempts: 3,
      runner: story.testRunner,
    });
    testPassed = testLoop.passed;
    testAttempts = testLoop.attempts.length;
    corrections = testLoop.attempts.filter((attempt) => !attempt.passed).length;
    const sim = await runScenarioSimulation({
      tenantId: story.tenantId,
      universeId: story.universeId,
      hypothesis: story.objective,
      consequence: story.consequence ?? 'LOW',
      production: story.production === true,
      root,
    });
    await finishHop(
      'test_simulation',
      testLoop.productionAuthorization ? 'FAIL' : testPassed ? 'PASS' : 'FAIL',
      `testPassed=${testPassed}; attempts=${testAttempts}; simStatus=${sim.status}; isReality=${sim.isReality}.`,
    );

    const skeptic = await conveneDepartmentCouncil({
      tenantId: story.tenantId,
      universeId: story.universeId,
      kind: 'skeptic',
      topic: `Skeptic review: ${story.objective}`,
      actor,
      root,
    });
    await finishHop(
      'skeptic_review',
      skeptic.consensusForced ? 'FAIL' : skeptic.runtimeState === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'PASS',
      `Skeptic council ${skeptic.id}; dissent=${skeptic.dissent.length}.`,
    );

    const evidenceEvent = await appendEvidenceEvent({
      kind: 'evidence',
      tenantId: story.tenantId,
      universeId: story.universeId,
      storyId: story.id,
      summary: `Society cycle ${cycle.id} evidence hop; inventedFacts=${knowledge.inventedFacts}`,
      payload: { evidenceRefs: knowledge.evidenceRefs, inventedFacts: knowledge.inventedFacts },
    }, root);
    cycle.evidenceRefs = [...new Set([...cycle.evidenceRefs, evidenceEvent.id, ...knowledge.evidenceRefs])];
    await finishHop('evidence', knowledge.inventedFacts ? 'FAIL' : 'PASS', `Evidence event ${evidenceEvent.id}.`);

    const decision = decisionGate({
      id: cortexId('society-gate'),
      action: story.objective,
      consequence: story.consequence ?? 'LOW',
      production: story.production === true,
      financialCommitment: false,
      legalCommitment: false,
      permissionChange: story.permissionChange === true,
      externalPublication: false,
    });
    if (!decision.executableByAgent) {
      cycle.state = 'denied';
      await finishHop('decision_gate', 'DENIED', decision.reason);
      await saveStore(root, store);
      return { cycle, hops: cycle.completedHops };
    }
    await finishHop('decision_gate', 'PASS', decision.reason);

    const outcomeState: HopEvidence = testPassed ? 'PASS' : 'FAIL';
    await finishHop('outcome', outcomeState, `Sandbox outcome testPassed=${testPassed}; not a production authorization.`);

    const metrics = computeEvaluationMetrics({
      evidenceRefs: cycle.evidenceRefs,
      inventedFacts: knowledge.inventedFacts,
      testPassed,
      testAttempts,
      corrections,
      predictedConfidence: story.predictedConfidence ?? 0.5,
      latencyMs: Date.now() - started,
      tenantId: story.tenantId,
      universeId: story.universeId,
      agentCount: cycle.agentIds.length,
    });
    const baseline = await latestBaseline(story.tenantId, story.universeId, root);
    const evaluation = await recordEvaluation({
      tenantId: story.tenantId,
      universeId: story.universeId,
      label: story.title,
      kind: baseline ? 'candidate' : 'baseline',
      metrics,
      predictedConfidence: story.predictedConfidence ?? 0.5,
      observedOutcome: testPassed ? 1 : 0,
      evidenceRefs: cycle.evidenceRefs,
      root,
    });
    cycle.evaluationId = evaluation.id;
    if (baseline) {
      const comparison = await compareAgainstBaseline({
        tenantId: story.tenantId,
        universeId: story.universeId,
        baselineId: baseline.id,
        candidateId: evaluation.id,
        root,
      });
      comparisonId = comparison.id;
      cycle.comparisonId = comparison.id;
      await finishHop(
        'evaluation',
        comparison.intelligenceGainClaimed ? 'FAIL' : comparison.qualityRegression ? 'FAIL' : 'PASS',
        `verdict=${comparison.verdict}; qualityRegression=${comparison.qualityRegression}; smarterBecauseMoreAgents=false.`,
      );
    } else {
      await finishHop('evaluation', 'PASS', `Stored as baseline ${evaluation.id}; no prior baseline to compare.`);
    }

    if (comparisonId) {
      const comparison = (await listComparisons(story.tenantId, story.universeId, root)).find((item) => item.id === comparisonId);
      if (comparison) {
        await evolveSkillsFromEvaluation({
          tenantId: story.tenantId,
          universeId: story.universeId,
          agentIds: cycle.agentIds,
          comparison,
          evidenceRefs: cycle.evidenceRefs,
          root,
        });
      }
    }
    await recordStrategyOutcome({
      tenantId: story.tenantId,
      universeId: story.universeId,
      subject: story.title,
      tactic: 'evidence-first department council then sandbox work',
      outcome: testPassed ? 'succeeded' : 'failed',
      evidenceRefs: cycle.evidenceRefs,
      root,
    });
    const reputation = await strategyReputation({
      tenantId: story.tenantId,
      universeId: story.universeId,
      query: story.title,
      root,
    });
    await finishHop(
      'skill_strategy_update',
      reputation.smarterBecauseMoreAgents ? 'FAIL' : 'PASS',
      `Strategy reputation=${reputation.reputation.toFixed(3)}; samples=${reputation.samples}; skillUsesAgentCount=false.`,
    );

    await rememberCortexTrace({
      tenantId: story.tenantId,
      universeId: story.universeId,
      partition: 'business',
      kind: 'outcome',
      claimState: testPassed ? 'MODEL_INFERENCE' : 'UNKNOWN',
      label: `Society cycle ${story.title.slice(0, 72)}`,
      summary: `hops=${cycle.completedHops.length}; agents=${cycle.agentIds.length}; smarterBecauseMoreAgents=false`,
      evidenceRefs: cycle.evidenceRefs,
      sourceRefs: [`icycle:${cycle.id}`],
      retentionClass: 'working',
      root,
    });
    await appendLearning({
      domain: 'society',
      subject: story.title,
      claimState: 'MODEL_INFERENCE',
      summary: `Debrief cycle ${cycle.id}; evaluation=${evaluation.id}; comparison=${comparisonId ?? 'none'}`,
      sourceRefs: [`icycle:${cycle.id}`],
      evidence: cycle.evidenceRefs,
    }, root);
    await checkpoints.checkpoint({
      taskId: story.id,
      at: new Date().toISOString(),
      state: 'completed',
      attempt: 1,
      summary: `Society cycle ${cycle.id} memory hop`,
      evidence: cycle.evidenceRefs,
    });
    await finishHop('memory', 'PASS', 'Memory Cortex + learning ledger wrote the cycle outcome.');

    const improvement = await runBoundedImprovementAfterEvidence({
      tenantId: story.tenantId,
      universeId: story.universeId,
      objective: 'Rank retrieval of successful society tactics higher',
      observed: `testPassed=${testPassed}`,
      successful: testPassed,
      evidenceRefs: cycle.evidenceRefs,
      root,
    });
    await finishHop(
      'debrief',
      improvement.canExpandAutonomy || improvement.canChangePermissions ? 'FAIL' : improvement.status === 'HUMAN_APPROVAL_REQUIRED' ? 'DENIED' : 'PASS',
      `Self-improvement sandbox status=${improvement.status}; canExpandAutonomy=${improvement.canExpandAutonomy}.`,
    );
    await finishHop('next_story', 'PASS', 'Cycle complete; next approved story may enqueue.');
    cycle.state = 'completed';
    cycle.updatedAt = new Date().toISOString();
    await saveStore(root, store);
    return { cycle, hops: cycle.completedHops, evaluation, comparisonId };
  } catch (error) {
    if (error instanceof SocietySimulatedCrash) {
      cycle.state = 'running';
      cycle.updatedAt = new Date().toISOString();
      await saveStore(root, store);
    } else {
      cycle.state = 'failed';
      cycle.updatedAt = new Date().toISOString();
      await saveStore(root, store);
    }
    throw error;
  }
}

export async function buildAgentSocietyReport(root = process.cwd()) {
  const tenantId = 'local';
  const universeId = 'local';
  const store = await loadStore(root);
  const [kernel, vault, mesh, models, founder, registry] = await Promise.all([
    probeUniverseKernel(),
    probeCeoSealedVaultModule(),
    probeDistributedMeshModule(),
    multiModelCouncilSlots(),
    buildFounderReport(root),
    societyRegistryStats(tenantId, universeId, root),
  ]);
  const providers = providerSlots().map((slot) => ({
    provider: slot.provider,
    state: slot.configured && slot.authorized ? slot.state : 'UNAVAILABLE',
    configured: slot.configured,
  }));
  const completed = store.cycles.filter((item) => item.state === 'completed').length;
  return {
    generatedAt: new Date().toISOString(),
    headline: completed
      ? 'Persistent offline agent society ran bounded cycles; intelligence claims require baseline comparison, not agent count.'
      : 'Persistent offline agent society code is present; no completed cycles in this working directory.',
    intelligenceCycle: INTELLIGENCE_CYCLE,
    cycles: store.cycles.length,
    completedCycles: completed,
    recoveredCrashes: store.recoveredCrashes,
    registry,
    predecessors: {
      '62L-AF-universe-kernel': kernel,
      '62L-AE-ceo-sealed-vault': vault,
      '62L-AD-distributed-mesh': mesh,
      '62L-AC-offline-runtime': { state: 'PASS' as const, modulePresent: true, reason: 'This child is branched from the pushed 62L-AC operations-report tip.' },
    },
    multiModel: models,
    providers,
    founder: {
      headline: founder.headline,
      blockers: founder.blockers,
      safety: founder.safety,
    },
    locks: {
      l4AutonomyEnabled: false as const,
      autoProductionDeploy: false as const,
      productionDatabaseWrite: false as const,
      autoPermissionExpansion: false as const,
      founderImpersonation: false as const,
      tipLand: false as const,
      smarterBecauseMoreAgents: false as const,
      inventedPass: false as const,
    },
    productionAuthorization: false as const,
  };
}

export async function writeAgentSocietyReport(root = process.cwd()) {
  const report = await buildAgentSocietyReport(root);
  const path = xivLocalPath(root, 'agent-society-report.json');
  await writeJsonFileAtomic(path, report);
  return { path, report };
}
