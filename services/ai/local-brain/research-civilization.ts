import { MESH_AGENT_ROLES } from './agent-mesh';
import { retrieveEvidencePathway } from './cortex-evidence';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace, strengthenCortexPathway } from './memory-cortex';
import { runScenarioSimulation } from './simulation-lab';
import { learnAcrossIndustries } from './historical-industry-learning';
import { conveneReflectionCouncil } from './reflection-council';
import { runPlanetaryGalacticSimulator, type SimulatorScale } from './planetary-galactic-sim';
import { runBoundedQuantumLab } from './quantum-research-lab';
import { completeResearchJob, enqueueResearchJob, recoverInterruptedResearchJobs } from './offline-resilience';
import { PHYSICS_HONESTY } from './physics-domains';
import { signalInfrastructureHonesty } from './signal-infrastructure';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export const RESEARCH_FEEDBACK_LOOP = [
  'question',
  'hypothesis',
  'historical_evidence',
  'specialist_agents',
  'debate',
  'simulation_experiment',
  'result',
  'critique',
  'human_correction',
  'learning_ledger',
  'revised_hypothesis',
  'stronger_pathway',
] as const;

export type ResearchLoopStep = (typeof RESEARCH_FEEDBACK_LOOP)[number];

export type ResearchCivilizationController = {
  id: string;
  tenantId: string;
  universeId: string;
  preferOffline: true;
  claimsConsciousness: false;
  l4AutonomyEnabled: false;
  productionAuthorization: false;
  loop: typeof RESEARCH_FEEDBACK_LOOP;
};

type ControllerStore = { controllers: ResearchCivilizationController[] };

function controllersPath(root: string) {
  return xivLocalPath(root, 'research-civilization.json');
}

async function loadControllers(root: string) {
  const parsed = await readJsonFile<ControllerStore>(controllersPath(root), { controllers: [] });
  return Array.isArray(parsed.controllers) ? parsed.controllers : [];
}

async function saveControllers(root: string, controllers: ResearchCivilizationController[]) {
  await writeJsonFileAtomic(controllersPath(root), { controllers: controllers.slice(-200) });
}

export async function createResearchCivilization(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}): Promise<ResearchCivilizationController> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const controller: ResearchCivilizationController = {
    id: cortexId('civ'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    preferOffline: true,
    claimsConsciousness: false,
    l4AutonomyEnabled: false,
    productionAuthorization: false,
    loop: RESEARCH_FEEDBACK_LOOP,
  };
  const root = input.root ?? process.cwd();
  const controllers = await loadControllers(root);
  controllers.push(controller);
  await saveControllers(root, controllers);
  return controller;
}

export async function runResearchFeedbackLoop(input: {
  tenantId: string;
  universeId: string;
  question: string;
  hypothesis: string;
  simulatorScale?: SimulatorScale;
  includeQuantumLab?: boolean;
  humanCorrection?: string;
  consequence?: ConsequenceClass;
  production?: boolean;
  permissionChange?: boolean;
  memoryIds?: string[];
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.question.trim() || !input.hypothesis.trim()) throw new Error('RESEARCH_QUESTION_AND_HYPOTHESIS_REQUIRED');
  const root = input.root ?? process.cwd();
  const steps: ResearchLoopStep[] = [...RESEARCH_FEEDBACK_LOOP];

  const job = await enqueueResearchJob({
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.question,
    requirement: {
      needsProductionWrite: input.production === true,
      needsPermissionChange: input.permissionChange === true,
    },
    root,
  });

  const historical = await learnAcrossIndustries({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    root,
  });
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: `${input.question} ${input.hypothesis}`,
    root,
  });
  const specialists = ['researcher', 'skeptic', 'evidence_verifier', 'culture_historian', 'decision_strategist'] as const;
  const debate = await conveneReflectionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: `${input.question} — hypothesis: ${input.hypothesis}`,
    root,
  });

  const simulation = input.simulatorScale
    ? await runPlanetaryGalacticSimulator({
      tenantId: input.tenantId,
      universeId: input.universeId,
      scale: input.simulatorScale,
      hypothesis: input.hypothesis,
      consequence: input.consequence,
      root,
    })
    : {
      scale: 'planetary' as const,
      simulation: await runScenarioSimulation({
        tenantId: input.tenantId,
        universeId: input.universeId,
        hypothesis: input.hypothesis,
        consequence: input.consequence,
        production: input.production,
        root,
      }),
      isReality: false as const,
      galacticInfrastructure: 'simulation_research_only' as const,
      controlsPhysicalSystems: false as const,
      darkMatterAsInfrastructure: false as const,
      darkEnergyAsInfrastructure: false as const,
      productionAuthorization: false as const,
      evidenceRefs: evidence.evidenceRefs,
    };

  const quantum = input.includeQuantumLab
    ? runBoundedQuantumLab({
      id: `q-${job.id}`,
      objective: `Bounded research for: ${input.hypothesis}`,
      algorithm: 'qaoa',
      backend: 'classical_simulator',
      qubitCount: 4,
    })
    : null;

  const gate = decisionGate({
    id: `research-gate-${job.id}`,
    action: input.hypothesis,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: input.permissionChange === true,
    externalPublication: false,
  });

  const critique = [
    debate.dissent[0] ?? 'Critique recorded without forced consensus.',
    gate.reason,
    simulation.simulation.notes[0] ?? 'Simulation is not reality.',
  ];
  const humanCorrectionRequired = gate.humanApprovalRequired || Boolean(input.humanCorrection);
  const revisedHypothesis = input.humanCorrection
    ? `${input.hypothesis} [human correction: ${input.humanCorrection}]`
    : humanCorrectionRequired
      ? `${input.hypothesis} [pending human correction]`
      : input.hypothesis;

  const learning = await appendLearning({
    domain: 'science',
    subject: `research:${input.question.slice(0, 80)}`,
    claimState: evidence.evidenceRefs.length ? 'MODEL_INFERENCE' : 'UNKNOWN',
    summary: `result=${simulation.simulation.status}; revised=${revisedHypothesis.slice(0, 160)}`,
    sourceRefs: evidence.evidenceRefs,
    evidence: [...evidence.evidenceRefs, `sim:${simulation.simulation.id}`],
  }, root);

  const memory = await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'world',
    kind: 'lesson',
    claimState: 'MODEL_INFERENCE',
    label: `Research loop: ${input.question.slice(0, 72)}`,
    summary: `stronger_pathway after critique; claimsConsciousness=false; inventedFacts=false`,
    evidenceRefs: [`learn:${learning.id}`, ...evidence.evidenceRefs],
    sourceRefs: [`job:${job.id}`],
    pathwayStrength: 0.45,
    retentionClass: 'durable',
    root,
  });

  const strengthened = [];
  for (const id of input.memoryIds ?? []) {
    const next = await strengthenCortexPathway({
      id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      delta: simulation.simulation.status === 'COMPLETED' ? 0.12 : 0.02,
      root,
    });
    strengthened.push({ id: next.id, pathwayStrength: next.pathwayStrength });
  }

  if (job.state === 'queued' || job.state === 'running') {
    await completeResearchJob(job.id, input.tenantId, input.universeId, root);
  }

  return {
    steps,
    specialists: specialists.filter((role) => (MESH_AGENT_ROLES as readonly string[]).includes(role)),
    job,
    historical,
    evidence,
    debate,
    simulation,
    quantum,
    result: {
      status: simulation.simulation.status,
      isReality: false as const,
    },
    critique,
    humanCorrectionRequired,
    humanCorrection: input.humanCorrection ?? null,
    learning,
    revisedHypothesis,
    strongerPathway: {
      memoryId: memory.id,
      strengthened,
    },
    honesty: {
      ...PHYSICS_HONESTY,
      ...signalInfrastructureHonesty(),
      claimsConsciousness: false as const,
      satelliteControl: false as const,
      productionAuthorization: false as const,
      inventedFacts: false as const,
    },
    productionAuthorization: false as const,
  };
}

export async function runOfflineResearchCivilization(input: {
  tenantId: string;
  universeId: string;
  question: string;
  hypothesis: string;
  simulatorScale?: SimulatorScale;
  includeQuantumLab?: boolean;
  humanCorrection?: string;
  consequence?: ConsequenceClass;
  memoryIds?: string[];
  root?: string;
}) {
  const controller = await createResearchCivilization({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  await recoverInterruptedResearchJobs(input.root);
  const loop = await runResearchFeedbackLoop(input);
  return {
    controller,
    loop,
    architectureGoal: 'Make Global Brain more capable, not merely bigger.',
    next: '62L-Z — not implemented in this slice',
    productionAuthorization: false as const,
  };
}
