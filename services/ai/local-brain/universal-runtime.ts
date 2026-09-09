import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { LocalCheckpointStore } from './checkpoint-store';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { localModelStatus } from './local-model';
import { providerSlots } from './provider-fabric';
import { OFFLINE_OPERATING_CYCLE } from './offline-agent-runtime';
import {
  algorithmHonestyLocks,
  constrainedRoute,
  detectAnomalies,
  economicOrderQuantity,
  edmondsKarp,
  generalLpUnavailable,
  generalMilpUnavailable,
  independentProbability,
  knapsack01,
  listSchedule,
  movingAverageForecast,
  rankByLinearScore,
  runLengthEncode,
  sampleMoments,
  selectAlgorithm,
  shortestPath,
  solveTwoVariableLp,
  type AlgorithmFamily,
} from './algorithm-foundry';
import {
  breakEven,
  computeMargin,
  designPackage,
  humanApprovePricing,
  modelCost,
  priceScenario,
  proveRecommendationIsNotCharge,
  recommendPricing,
  selectBundle,
  sensitivity,
  type BundleChannel,
  type CfoCycleInput,
} from './cfo-pricing-engine';
import { probePredecessorDataModules, probeStorageEngines, selectStorageEngine, type WorkloadKind } from './polyglot-data-fabric';
import {
  capabilityGate,
  listRuntimeProfiles,
  probeHostHardware,
  requestVehicleCapability,
  type RuntimeProfileId,
  type VehicleCapability,
} from './runtime-profiles';
import {
  AV_HONESTY,
  AvSimulatedCrash,
  NEXT_PHASE_TITLE,
  UNIVERSAL_RUNTIME_CYCLE,
  type AvEvidenceState,
  type AvHop,
  type AvHopRecord,
  type AvJobState,
} from './universal-runtime-types';

export { UNIVERSAL_RUNTIME_CYCLE, AV_HONESTY, AvSimulatedCrash };

export type AvNeed = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  approved: boolean;
  profileId: RuntimeProfileId;
  vehicleCapability?: VehicleCapability;
  algorithmFamily: AlgorithmFamily;
  storageWorkload: WorkloadKind;
  cfo: CfoCycleInput;
  crashAfterHop?: AvHop;
};

export type AvJob = {
  id: string;
  needId: string;
  tenantId: string;
  universeId: string;
  title: string;
  state: AvJobState;
  completedHops: AvHop[];
  hopRecords: AvHopRecord[];
  charged: false;
  billingMutated: false;
  vehicleControlAuthorized: false;
  crashAfterHop?: AvHop;
  createdAt: string;
  updatedAt: string;
};

type AvStore = { jobs: AvJob[] };

function emptyStore(): AvStore {
  return { jobs: [] };
}

function storePath(root: string) {
  return xivLocalPath(root, 'universal-runtime.json');
}

function nowIso() {
  return new Date().toISOString();
}

function record(hop: AvHop, state: AvEvidenceState, summary: string): AvHopRecord {
  return { hop, state, summary, at: nowIso() };
}

export async function enqueueAvNeed(need: AvNeed, root = process.cwd()) {
  const state = await readJsonFile(storePath(root), emptyStore());
  const job: AvJob = {
    id: cortexId('av'),
    needId: need.id,
    tenantId: need.tenantId,
    universeId: need.universeId,
    title: need.title,
    state: need.approved ? 'queued' : 'denied',
    completedHops: [],
    hopRecords: need.approved
      ? []
      : [record('device_profile', 'DENIED', 'Unapproved runtime/CFO need is not an input.')],
    charged: false,
    billingMutated: false,
    vehicleControlAuthorized: false,
    crashAfterHop: need.crashAfterHop,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.jobs.push(job);
  await writeJsonFileAtomic(storePath(root), state);
  return job;
}

export async function listAvJobs(root = process.cwd()) {
  const store = await readJsonFile(storePath(root), emptyStore());
  return store.jobs;
}

async function saveJob(job: AvJob, root: string) {
  const state = await readJsonFile(storePath(root), emptyStore());
  const index = state.jobs.findIndex((item) => item.id === job.id);
  job.updatedAt = nowIso();
  if (index >= 0) state.jobs[index] = job;
  else state.jobs.push(job);
  await writeJsonFileAtomic(storePath(root), state);
  return job;
}

export async function recoverInterruptedAvJobs(root = process.cwd()) {
  const state = await readJsonFile(storePath(root), emptyStore());
  const recovered: AvJob[] = [];
  for (const job of state.jobs) {
    if (job.state === 'running') {
      job.state = 'queued';
      job.updatedAt = nowIso();
      recovered.push(job);
    }
  }
  await writeJsonFileAtomic(storePath(root), state);
  return recovered;
}

export async function runUniversalRuntimeCycle(input: { need: AvNeed; root: string; resume?: AvJob }) {
  const root = input.root;
  const need = input.need;
  const job = input.resume ?? await enqueueAvNeed(need, root);
  if (job.state === 'denied' && job.completedHops.length === 0) return job;

  const done = new Set(job.completedHops);
  job.state = 'running';
  await saveJob(job, root);

  const finishHop = async (hop: AvHop, state: AvEvidenceState, summary: string) => {
    job.hopRecords.push(record(hop, state, summary));
    if (state === 'PASS' || state === 'DENIED' || state === 'UNAVAILABLE' || state === 'WAITING_DATA') {
      job.completedHops.push(hop);
    }
    await saveJob(job, root);
    if (need.crashAfterHop === hop && !input.resume?.completedHops.includes(hop)) {
      throw new AvSimulatedCrash(hop);
    }
  };

  const skip = (hop: AvHop) => done.has(hop);

  try {
    if (!skip('device_profile')) {
      const profiles = listRuntimeProfiles();
      const selected = profiles.find((item) => item.id === need.profileId);
      await finishHop(
        'device_profile',
        selected ? 'PASS' : 'UNAVAILABLE',
        `Cataloged ${profiles.length} runtime profiles. selected=${need.profileId} hostState=${selected?.state ?? 'UNAVAILABLE'}.`,
      );
    }

    if (!skip('hardware_verify')) {
      const hardware = await probeHostHardware();
      const profile = listRuntimeProfiles().find((item) => item.id === need.profileId);
      await finishHop(
        'hardware_verify',
        profile?.state === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
        `Host ${hardware.host.platform}/${hardware.host.arch}. profile=${need.profileId} state=${profile?.state}. Unverified profiles stay UNAVAILABLE.`,
      );
      if (profile?.state === 'UNAVAILABLE') {
        job.state = 'unavailable';
        await saveJob(job, root);
        return job;
      }
    }

    if (!skip('capability_gate')) {
      const gate = capabilityGate({ profileId: need.profileId, vehicleCapability: need.vehicleCapability });
      await finishHop(
        'capability_gate',
        gate.state,
        `Capability gate ${gate.state}. vehicle=${gate.vehicle?.capability ?? 'none'} physicalControl=${gate.physicalVehicleActuation}.`,
      );
      if (gate.state === 'DENIED') {
        job.state = 'denied';
        await saveJob(job, root);
        return job;
      }
    }

    if (!skip('algorithm_select')) {
      const selected = selectAlgorithm(need.algorithmFamily);
      const honesty = algorithmHonestyLocks(selected);
      await finishHop(
        'algorithm_select',
        'PASS',
        `Selected ${selected.algorithm} (${selected.baseline}). inventedOptimality=${honesty.inventedOptimality} optimalClaimed=${selected.optimalClaimed}.`,
      );
    }

    if (!skip('data_fabric_select')) {
      const engines = await probeStorageEngines();
      const choice = await selectStorageEngine(need.storageWorkload);
      await finishHop(
        'data_fabric_select',
        choice.state,
        `Workload ${need.storageWorkload} → ${choice.selected?.engine ?? 'none'} (${choice.state}). probed=${engines.length}.`,
      );
    }

    const cost = modelCost({
      sku: need.cfo.sku,
      fixedCost: need.cfo.fixedCost,
      variableCost: need.cfo.variableCost,
      unitCost: need.cfo.unitCost,
      units: need.cfo.units,
    });
    if (!skip('cost_model')) {
      await finishHop('cost_model', 'PASS', `Cost model total=${cost.totalCost}. billingMutated=${cost.billingMutated}.`);
    }

    const pkg = designPackage(need.cfo);
    if (!skip('package_design')) {
      await finishHop('package_design', 'PASS', `Package ${pkg.name} executable=${pkg.executable}.`);
    }

    const bundle = selectBundle(need.cfo.channel);
    if (!skip('bundle_select')) {
      await finishHop('bundle_select', 'PASS', `Bundle ${bundle.channel}. liveBillingConnected=${bundle.liveBillingConnected}.`);
    }

    const scenario = priceScenario(need.cfo);
    if (!skip('pricing_scenario')) {
      await finishHop('pricing_scenario', 'PASS', `Net price ${scenario.netPrice} on ${scenario.channel}. recommendation only.`);
    }

    const margin = computeMargin(scenario.netPrice, need.cfo.unitCost);
    const be = breakEven(need.cfo.fixedCost, scenario.netPrice, need.cfo.variableCost);
    if (!skip('margin_break_even')) {
      await finishHop(
        'margin_break_even',
        margin.state === 'PASS' && be.state === 'PASS' ? 'PASS' : 'UNAVAILABLE',
        `Margin rate=${margin.marginRate ?? 'n/a'} breakEvenUnits=${be.units ?? 'n/a'}.`,
      );
    }

    const sens = sensitivity({
      listPrice: need.cfo.listPrice,
      unitCost: need.cfo.unitCost,
      variableCost: need.cfo.variableCost,
      fixedCost: need.cfo.fixedCost,
    });
    if (!skip('sensitivity')) {
      await finishHop('sensitivity', 'PASS', `Sensitivity rows=${sens.rows.length}. inventedOptimum=${sens.inventedOptimum}.`);
    }

    if (!skip('human_approval')) {
      const recommendation = recommendPricing(need.cfo);
      const proof = proveRecommendationIsNotCharge(recommendation);
      const approval = humanApprovePricing(need.cfo);
      await finishHop(
        'human_approval',
        approval.accepted ? 'PASS' : 'DENIED',
        `CFO recommend=${recommendation.recommended} charged=${proof.charged} billingMutated=${proof.billingMutated} approved=${approval.approved} reason=${approval.reason}.`,
      );
      if (!approval.accepted) {
        job.state = 'denied';
        await saveJob(job, root);
        return job;
      }
    }

    if (!skip('outcome')) {
      await appendEvidenceEvent({
        kind: 'evidence',
        tenantId: need.tenantId,
        universeId: need.universeId,
        storyId: need.id,
        summary: '62L-AV cycle outcome is local recommendation evidence, not a charge or vehicle actuation.',
        payload: { charged: false, billingMutated: false, vehicleControlAuthorized: false },
      }, root);
      await finishHop('outcome', 'WAITING_DATA', 'No independently observed customer charge or hardware fleet result. WAITING_DATA; not invented PASS.');
    }

    if (!skip('learning')) {
      await appendLearning({
        domain: 'technology',
        subject: need.title,
        claimState: 'MODEL_INFERENCE',
        summary: 'Runtime/algorithm/CFO recommendation cycle completed. No charge, billing mutation, or vehicle control.',
        sourceRefs: [job.id],
        evidence: job.hopRecords.map((item) => `${item.hop}:${item.state}`),
        taskId: job.id,
      }, root);
      const checkpoints = new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json'));
      await checkpoints.checkpoint({
        taskId: job.id,
        at: nowIso(),
        state: 'completed',
        attempt: 1,
        summary: '62L-AV cycle checkpoint. Recommendation is not a charge, billing mutation, or vehicle control.',
        nextAction: 'Human owns pricing/billing. Hardware stays UNAVAILABLE until verified.',
        evidence: job.hopRecords.map((item) => `${item.hop}:${item.state}`),
      });
      await finishHop('learning', 'PASS', 'Learning Ledger write permissionChange=false productionChange=false.');
    }

    job.state = 'completed';
    await saveJob(job, root);
    return job;
  } catch (error) {
    if (error instanceof AvSimulatedCrash) {
      job.state = 'running';
      await saveJob(job, root);
      throw error;
    }
    job.state = 'failed';
    await saveJob(job, root);
    throw error;
  }
}

export async function resumeAvJob(input: { need: AvNeed; root: string }) {
  await recoverInterruptedAvJobs(input.root);
  const jobs = await listAvJobs(input.root);
  const job = jobs.find((item) => item.needId === input.need.id);
  if (!job) throw new Error('AV_JOB_NOT_FOUND');
  return runUniversalRuntimeCycle({ need: input.need, root: input.root, resume: job });
}

export function runAlgorithmDemo() {
  return {
    graph: shortestPath(
      [
        { from: 's', to: 'a', weight: 1 },
        { from: 'a', to: 't', weight: 2 },
        { from: 's', to: 't', weight: 10 },
      ],
      's',
      't',
    ),
    constrained: constrainedRoute(
      [
        { from: 's', to: 'x', weight: 1 },
        { from: 'x', to: 't', weight: 1 },
        { from: 's', to: 't', weight: 5 },
      ],
      's',
      't',
      ['x'],
    ),
    flow: edmondsKarp(
      4,
      [
        { from: 0, to: 1, capacity: 3 },
        { from: 0, to: 2, capacity: 2 },
        { from: 1, to: 2, capacity: 1 },
        { from: 1, to: 3, capacity: 2 },
        { from: 2, to: 3, capacity: 3 },
      ],
      0,
      3,
    ),
    schedule: listSchedule([{ id: 'j1', duration: 3 }, { id: 'j2', duration: 2 }, { id: 'j3', duration: 2 }], 2),
    inventory: economicOrderQuantity(1000, 50, 2),
    lp: solveTwoVariableLp({ c: [3, 4], constraints: [{ a: [1, 1], b: 4 }, { a: [2, 1], b: 6 }] }),
    generalLp: generalLpUnavailable(5),
    knapsack: knapsack01([{ id: 'a', value: 6, weight: 2 }, { id: 'b', value: 5, weight: 3 }, { id: 'c', value: 4, weight: 1 }], 5),
    generalMilp: generalMilpUnavailable(),
    stats: sampleMoments([1, 2, 3, 4, 100]),
    probability: independentProbability([0.5, 0.5]),
    anomaly: detectAnomalies([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 100]),
    forecast: movingAverageForecast([10, 12, 11, 13], 2),
    ranking: rankByLinearScore([{ id: 'p1', features: [1, 0] }, { id: 'p2', features: [0, 2] }], [1, 1]),
    compression: runLengthEncode('aaabbc'),
  };
}

export async function buildAvHealthReport(input: { tenantId: string; universeId: string; root?: string }) {
  const root = input.root ?? process.cwd();
  const jobs = await listAvJobs(root);
  const model = await localModelStatus();
  const repoRoot = existsSync(join(root, 'docs', 'operations')) ? root : join(root, '..', '..');
  const predecessors = probePredecessorDataModules(repoRoot);
  const profiles = listRuntimeProfiles();
  const engines = await probeStorageEngines();
  const hardware = await probeHostHardware();
  const vehicleDeny = requestVehicleCapability('steering');
  const fileState = (relative: string): AvEvidenceState =>
    existsSync(join(repoRoot, relative)) ? 'PASS' : 'WAITING_DATA';

  return {
    generatedAt: new Date().toISOString(),
    tenantId: input.tenantId,
    universeId: input.universeId,
    cycle: UNIVERSAL_RUNTIME_CYCLE,
    offlineCycleReuse: OFFLINE_OPERATING_CYCLE,
    jobs: jobs.length,
    completed: jobs.filter((item) => item.state === 'completed').length,
    charged: jobs.filter((item) => item.charged).length,
    billingMutated: jobs.filter((item) => item.billingMutated).length,
    vehicleControlAuthorized: jobs.filter((item) => item.vehicleControlAuthorized).length,
    profiles: profiles.map((item) => ({ id: item.id, state: item.state, verified: item.verified })),
    host: hardware.host,
    engines: engines.map((item) => ({ kind: item.kind, engine: item.engine, state: item.state, partnershipClaimed: item.partnershipClaimed })),
    vehicleDeny: { capability: vehicleDeny.capability, state: vehicleDeny.state, reason: vehicleDeny.reason },
    localModel: {
      availability: model.availability === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
      reason: model.reason,
    },
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.state === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
      configured: slot.configured,
    })),
    predecessor: {
      auInformationEconomy: fileState('docs/operations/62L_AU_AGENTIC_INFORMATION_ECONOMY_LOGISTICS_REPORT.md'),
      asCognitiveCompiler: fileState('docs/operations/62L_AS_COGNITIVE_COMPILER_MATH_REASONING_FABRIC_REPORT.md'),
      aoSupplyChain: fileState('docs/operations/62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md'),
      abKnowledgeLake: fileState('docs/operations/62L_AB_KNOWLEDGE_LAKE_INDUSTRY_MEMORY_REPORT.md'),
      acOfflineRuntime: fileState('docs/operations/62L_AC_OFFLINE_AGENT_RUNTIME_WORKCELLS_REPORT.md'),
      apOpsPlanner: fileState('docs/operations/62L_AP_ENTERPRISE_OPERATIONS_PLANNER_COMMAND_CENTER_REPORT.md'),
    },
    predecessorModules: predecessors,
    honesty: {
      ...AV_HONESTY,
      windowsNodeVerification: 'NOT_TESTED' as const,
    },
    next: NEXT_PHASE_TITLE,
  };
}

export {
  listRuntimeProfiles,
  requestVehicleCapability,
  verifyHardwareForProfile,
  capabilityGate,
} from './runtime-profiles';
export {
  ALGORITHM_CATALOG,
  selectAlgorithm,
  algorithmHonestyLocks,
  shortestPath,
  constrainedRoute,
  edmondsKarp,
  listSchedule,
  economicOrderQuantity,
  solveTwoVariableLp,
  generalLpUnavailable,
  knapsack01,
  generalMilpUnavailable,
  sampleMoments,
  independentProbability,
  detectAnomalies,
  movingAverageForecast,
  rankByLinearScore,
  runLengthEncode,
  deduplicateBytes,
} from './algorithm-foundry';
export { probeStorageEngines, selectStorageEngine, describeStorageEngine } from './polyglot-data-fabric';
export {
  modelCost,
  designPackage,
  selectBundle,
  priceScenario,
  computeMargin,
  breakEven,
  sensitivity,
  recommendPricing,
  humanApprovePricing,
  attemptChargeCustomer,
  attemptMutateBilling,
  proveRecommendationIsNotCharge,
} from './cfo-pricing-engine';
