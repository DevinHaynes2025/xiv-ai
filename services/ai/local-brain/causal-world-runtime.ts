import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { retrieveEvidencePathway } from './cortex-evidence';
import { conveneReflectionCouncil } from './reflection-council';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import { getRuntime } from './hybrid-runtime';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  CAUSAL_WORLD_CYCLE,
  CAUSAL_WORLD_LOCKS,
  DIGITAL_TWIN_KINDS,
  type CausalWorldHop,
  type DigitalTwinKind,
  type EvidenceState,
} from './causal-world-types';
import { generateCompetingCausalHypotheses, queryWorldModel } from './causal-world-model';
import { upsertIndustryTwin } from './industry-digital-twins';
import { runCounterfactual, runMonteCarlo, runSensitivity } from './causal-simulation';
import { runOptimizationWorkcell } from './optimization-workcells';
import {
  createApprovedSimulationPack,
  federateSimulationPacks,
  provisionTwinFederationNodes,
  runApprovedPackLocally,
} from './offline-simulation-packs';
import { calibrateOutcome } from './outcome-calibration';

export type CausalStory = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  subject: string;
  approved: boolean;
  twinKind?: DigitalTwinKind;
  consequence?: ConsequenceClass;
  production?: boolean;
  permissionChange?: boolean;
  needsCloudProvider?: boolean;
  needsExternalFreshness?: boolean;
  observed?: number;
  observedVerified?: boolean;
  federate?: boolean;
  requestQuantum?: boolean;
};

export type CausalHopRecord = {
  hop: CausalWorldHop;
  state: EvidenceState | 'DENIED';
  summary: string;
  at: string;
};

export type CausalCycleRecord = {
  id: string;
  storyId: string;
  tenantId: string;
  universeId: string;
  hops: CausalHopRecord[];
  hypothesisIds: string[];
  twinId?: string;
  simulationIds: string[];
  packId?: string;
  federationId?: string;
  calibrationId?: string;
  epistemicSeparation: true;
  founderImpersonation: false;
  l4AutonomyEnabled: false;
  productionAuthorization: false;
  state: 'completed' | 'denied' | 'waiting_data' | 'unavailable';
  createdAt: string;
  updatedAt: string;
};

type Store = { cycles: CausalCycleRecord[] };

function storePath(root: string) {
  return xivLocalPath(root, 'causal-world-runtime.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(storePath(root), { cycles: [] });
  return { cycles: Array.isArray(parsed.cycles) ? parsed.cycles : [] };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), { cycles: store.cycles.slice(-2_000) });
}

function hop(name: CausalWorldHop, state: CausalHopRecord['state'], summary: string): CausalHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

function modulePresent(file: string) {
  return existsSync(join(dirname(fileURLToPath(import.meta.url)), file));
}

export async function runCausalWorldCycle(input: CausalStory & { root?: string }): Promise<CausalCycleRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const cycle: CausalCycleRecord = {
    id: cortexId('cwcycle'),
    storyId: input.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    hops: [],
    hypothesisIds: [],
    simulationIds: [],
    epistemicSeparation: true,
    founderImpersonation: false,
    l4AutonomyEnabled: false,
    productionAuthorization: false,
    state: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const productionRequested = input.production === true;
  const permissionChangeRequested = input.permissionChange === true;
  if (!input.approved || productionRequested || permissionChangeRequested) {
    cycle.hops.push(hop('approved_story', 'DENIED', 'Story was not approved, or requested production/permission change.'));
    cycle.state = 'denied';
    cycle.updatedAt = new Date().toISOString();
    const store = await load(root);
    store.cycles.push(cycle);
    await save(root, store);
    return cycle;
  }
  cycle.hops.push(hop('approved_story', 'PASS', `Approved causal story: ${input.title}`));

  const query = await queryWorldModel({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.subject,
    needsCloudProvider: input.needsCloudProvider,
    needsExternalFreshness: input.needsExternalFreshness,
    root,
  });
  cycle.hops.push(
    hop(
      'world_model_query',
      query.evidenceState === 'AVAILABLE' ? 'PASS' : query.evidenceState,
      query.reason,
    ),
  );

  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.subject,
    needsCloudProvider: input.needsCloudProvider,
    needsExternalFreshness: input.needsExternalFreshness,
    root,
  });
  cycle.hops.push(
    hop(
      'evidence_retrieval',
      evidence.state === 'AVAILABLE' ? 'PASS' : evidence.state,
      `${evidence.reason} inventedFacts=${evidence.inventedFacts}`,
    ),
  );

  const hypotheses = await generateCompetingCausalHypotheses({
    tenantId: input.tenantId,
    universeId: input.universeId,
    queryId: query.id,
    subject: input.subject,
    root,
  });
  cycle.hypothesisIds = hypotheses.map((item) => item.id);
  cycle.hops.push(
    hop(
      'competing_causal_hypotheses',
      hypotheses.length >= 2 && hypotheses.every((item) => item.isCausation === false) ? 'PASS' : 'FAIL',
      `${hypotheses.length} competing hypotheses; correlation≠causation; none marked verified fact.`,
    ),
  );

  const kind = input.twinKind ?? 'business';
  const twin = await upsertIndustryTwin({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind,
    label: `${input.title} twin`,
    root,
  });
  cycle.twinId = twin.id;
  const counterfactual = await runCounterfactual({
    tenantId: input.tenantId,
    universeId: input.universeId,
    twinId: twin.id,
    hypothesisIds: cycle.hypothesisIds,
    intervention: { [twin.variables[0].name]: twin.variables[0].value * 1.1 },
    requestQuantum: input.requestQuantum,
    root,
  });
  const monte = await runMonteCarlo({
    tenantId: input.tenantId,
    universeId: input.universeId,
    twinId: twin.id,
    hypothesisIds: cycle.hypothesisIds,
    seed: 62108,
    root,
  });
  const sensitivity = await runSensitivity({
    tenantId: input.tenantId,
    universeId: input.universeId,
    twinId: twin.id,
    hypothesisIds: cycle.hypothesisIds,
    root,
  });
  const optimization = await runOptimizationWorkcell({
    tenantId: input.tenantId,
    universeId: input.universeId,
    twinId: twin.id,
    objective: `Optimize simulated ${kind} metric without actuation`,
    consequence: input.consequence,
    production: input.production,
    root,
  });
  cycle.simulationIds = [counterfactual.id, monte.id, sensitivity.id];
  cycle.hops.push(
    hop(
      'digital_twin_simulation',
      counterfactual.isVerifiedFact || monte.isVerifiedFact ? 'FAIL' : 'PASS',
      `twin=${twin.kind}; counterfactual/MC/sensitivity/optimization are SIMULATION; quantum=${counterfactual.quantumState}; opt=${optimization.status}`,
    ),
  );

  const council = await conveneReflectionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: `Challenge competing causal hypotheses for: ${input.subject}. Do not force consensus. Correlation is not causation.`,
    root,
  });
  cycle.hops.push(
    hop(
      'agent_challenge_council',
      council.consensusForced === false && council.claimsConsciousness === false ? 'PASS' : 'FAIL',
      `council=${council.runtimeState}; dissent=${council.dissent.length}; consensusForced=${council.consensusForced}`,
    ),
  );

  cycle.hops.push(
    hop(
      'evidence_check',
      evidence.inventedFacts === false ? (evidence.state === 'AVAILABLE' ? 'PASS' : evidence.state) : 'FAIL',
      'Simulation outputs were not accepted as verified facts. inventedFacts=false.',
    ),
  );

  const estimate = monte.results.mean ?? 0;
  cycle.hops.push(
    hop('outcome_estimate', 'PASS', `estimate=${estimate} class=SIMULATION|FORECAST; not VERIFIED_FACT`),
  );

  const gate = decisionGate({
    id: cortexId('cw-gate'),
    action: `Causal world estimate for ${input.title}`,
    consequence: input.consequence ?? 'LOW',
    production: productionRequested,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: permissionChangeRequested,
    externalPublication: false,
  });
  cycle.hops.push(
    hop(
      'human_gate',
      gate.executableByAgent ? 'PASS' : 'DENIED',
      gate.reason,
    ),
  );

  if (typeof input.observed === 'number') {
    cycle.hops.push(hop('observed_result', input.observedVerified ? 'PASS' : 'UNKNOWN', `observed=${input.observed}; verified=${Boolean(input.observedVerified)}`));
  } else {
    cycle.hops.push(hop('observed_result', 'WAITING_DATA', 'No independently observed result was supplied. UNKNOWN/WAITING_DATA is valid.'));
  }

  const calibration = await calibrateOutcome({
    tenantId: input.tenantId,
    universeId: input.universeId,
    simulationId: monte.id,
    observed: input.observed,
    observedVerified: input.observedVerified,
    evidenceRefs: evidence.evidenceRefs,
    root,
  });
  cycle.calibrationId = calibration.id;
  cycle.hops.push(
    hop(
      'calibration',
      calibration.simulationPromotedToFact ? 'FAIL' : calibration.status === 'CALIBRATED' ? 'PASS' : calibration.status,
      `observedClass=${calibration.observedClass}; estimateClass=${calibration.estimateClass}; promoted=${calibration.simulationPromotedToFact}`,
    ),
  );

  const pack = await createApprovedSimulationPack({
    tenantId: input.tenantId,
    universeId: input.universeId,
    scenario: input.title,
    approved: true,
    simulationIds: cycle.simulationIds,
    root,
  });
  if ('accepted' in pack) {
    cycle.hops.push(hop('learning_ledger', 'FAIL', pack.reason));
  } else {
    cycle.packId = pack.id;
    await runApprovedPackLocally({ packId: pack.id, tenantId: input.tenantId, universeId: input.universeId, root });
    if (input.federate) {
      const nodes = await provisionTwinFederationNodes({ tenantId: input.tenantId, universeId: input.universeId, root });
      const federation = await federateSimulationPacks({
        tenantId: input.tenantId,
        universeId: input.universeId,
        packIds: [pack.id],
        fromNodeId: nodes.left.id,
        toNodeId: nodes.right.id,
        root,
      });
      cycle.federationId = federation.id;
    }
  }

  const learning = await appendLearning({
    domain: 'science',
    subject: `causal-cycle:${cycle.id}`,
    claimState: 'MODEL_INFERENCE',
    summary: `cycle=${cycle.id}; hypotheses=${cycle.hypothesisIds.length}; sims=${cycle.simulationIds.length}; calibration=${calibration.status}`,
    sourceRefs: [`cycle:${cycle.id}`, ...evidence.evidenceRefs],
    evidence: evidence.evidenceRefs,
    taskId: cycle.id,
  }, root);
  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.id,
    summary: `Causal world cycle recorded. estimate=SIMULATION; observed=${calibration.observedClass}.`,
    payload: { cycleId: cycle.id, learningId: learning.id, epistemicSeparation: true },
  }, root);
  cycle.hops.push(hop('learning_ledger', 'PASS', `learning=${learning.id}; permissionChange=${learning.permissionChange}`));

  const memory = await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'scenario',
    claimState: 'PREDICTION',
    label: `Causal cycle ${input.title}`,
    summary: 'Simulation/forecast stored separately from any verified observation.',
    evidenceRefs: evidence.evidenceRefs,
    sourceRefs: [`cycle:${cycle.id}`],
    retentionClass: 'working',
    root,
  });
  cycle.hops.push(hop('memory', 'PASS', `memory=${memory.id}; claimState=${memory.claimState}`));
  cycle.hops.push(hop('next_story', 'PASS', 'Cycle complete. Next approved story may start. L4 remains false.'));

  if (input.needsCloudProvider) {
    cycle.state = 'unavailable';
  } else if (typeof input.observed !== 'number') {
    cycle.state = 'waiting_data';
  } else if (!gate.executableByAgent) {
    cycle.state = 'denied';
  } else {
    cycle.state = 'completed';
  }
  cycle.updatedAt = new Date().toISOString();

  const store = await load(root);
  store.cycles.push(cycle);
  await save(root, store);
  return cycle;
}

export async function buildCausalWorldHealth(root = process.cwd()) {
  const store = await load(root);
  const aws = getRuntime('aws');
  const azure = getRuntime('azure');
  const gcp = getRuntime('gcp');
  return {
    generatedAt: new Date().toISOString(),
    cycle: CAUSAL_WORLD_CYCLE,
    twinKinds: DIGITAL_TWIN_KINDS,
    cycles: store.cycles.length,
    completed: store.cycles.filter((item) => item.state === 'completed').length,
    predecessors: {
      '62L-AC': modulePresent('offline-agent-runtime.ts') ? 'PRESENT' : 'WAITING_DATA',
      '62L-AD': modulePresent('distributed-mesh-runtime.ts') ? 'PRESENT' : 'WAITING_DATA',
      '62L-AB': modulePresent('knowledge-lake.ts') ? 'PRESENT' : 'WAITING_DATA',
      '62L-AE': modulePresent('ceo-sealed-vault.ts') ? 'PRESENT' : 'WAITING_DATA',
      '62L-AF': modulePresent('logical-universe-graph.ts') ? 'PRESENT' : 'WAITING_DATA',
      '62L-AG': modulePresent('evaluation-harness.ts') ? 'PRESENT' : 'WAITING_DATA',
    },
    providers: {
      aws: aws.state,
      azure: azure.state,
      gcp: gcp.state,
      configured: { aws: aws.configured, azure: azure.configured, gcp: gcp.configured },
    },
    locks: CAUSAL_WORLD_LOCKS,
    windowsNodeVerification: 'NOT_TESTED',
    githubIssue46: 'UNAVAILABLE',
    inventedPass: false,
    productionAuthorization: false,
  };
}

export async function writeCausalWorldHealth(root = process.cwd()) {
  const report = await buildCausalWorldHealth(root);
  const path = xivLocalPath(root, 'causal-world-health.json');
  await writeJsonFileAtomic(path, report);
  return { path, report };
}
