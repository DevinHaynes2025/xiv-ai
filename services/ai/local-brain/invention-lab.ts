import { createHash } from 'node:crypto';

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { runScenarioSimulation } from './simulation-lab';
import { upsertIndustryTwin, getIndustryTwin } from './industry-digital-twins';
import { runOptimizationWorkcell } from './optimization-workcells';
import { evaluateQuantSignals, type QuantSignal } from './quant-logic';
import { runBoundedQuantumLab } from './quantum-research-lab';
import { promoteKnowledge } from '../runtime/society/promotion';
import { appendEvidenceEvent } from './evidence-ledger';
import { PROTOTYPE_IS_NOT_INVENTION, type EvidenceState, type ExperimentKind } from './discovery-invention-types';
import { cognitiveCompilerPresent } from './discovery-predecessors';
import { lookupDeadEnd, recordNegativeResult } from './discovery-negative-memory';
import type { PortfolioHypothesis } from './hypothesis-portfolio';

export type ExperimentDesign = {
  id: string;
  tenantId: string;
  universeId: string;
  hypothesisId: string;
  kind: ExperimentKind;
  title: string;
  protocol: string;
  seed: string;
  conditions: Record<string, string>;
  fingerprint: string;
  eligible: boolean;
  blockedByDeadEnd: boolean;
  epistemicClass: 'HYPOTHESIS';
  isFact: false;
};

export type DiscoveryPrototype = {
  id: string;
  tenantId: string;
  universeId: string;
  experimentId: string;
  title: string;
  artifact: string;
  epistemicClass: 'PROTOTYPE';
  isValidatedInvention: false;
  isVerifiedFact: false;
  trustedBrainEligible: false;
  note: typeof PROTOTYPE_IS_NOT_INVENTION;
};

export type TrustedBrainEntry = {
  id: string;
  tenantId: string;
  universeId: string;
  prototypeId: string;
  accepted: boolean;
  epistemicClass: 'TRUSTED_CANDIDATE' | 'PROTOTYPE';
  isVerifiedFact: false;
  isValidatedInvention: false;
  humanReviewRequired: true;
  reason: string;
};

export type ExperimentRun = {
  id: string;
  tenantId: string;
  universeId: string;
  designId: string;
  replicaLane: 'primary' | 'independent';
  evidenceState: EvidenceState;
  measurement: { metric: string; value: number; unit: string };
  digest: string;
  skippedDeadEnd: boolean;
  negativeResultId?: string;
  epistemicClass: 'SIMULATION';
  isVerifiedFact: false;
};

type Store = {
  designs: ExperimentDesign[];
  prototypes: DiscoveryPrototype[];
  runs: ExperimentRun[];
  trusted: TrustedBrainEntry[];
};

function pathFor(root: string) {
  return xivLocalPath(root, 'invention-lab.json');
}

async function load(root: string): Promise<Store> {
  const parsed = await readJsonFile<Store>(pathFor(root), { designs: [], prototypes: [], runs: [], trusted: [] });
  return {
    designs: Array.isArray(parsed.designs) ? parsed.designs : [],
    prototypes: Array.isArray(parsed.prototypes) ? parsed.prototypes : [],
    runs: Array.isArray(parsed.runs) ? parsed.runs : [],
    trusted: Array.isArray(parsed.trusted) ? parsed.trusted : [],
  };
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(pathFor(root), {
    designs: store.designs.slice(-4_000),
    prototypes: store.prototypes.slice(-4_000),
    runs: store.runs.slice(-4_000),
    trusted: store.trusted.slice(-4_000),
  });
}

export function designExperiment(input: {
  tenantId: string;
  universeId: string;
  hypothesis: PortfolioHypothesis;
}): ExperimentDesign {
  const conditions = { hypothesisId: input.hypothesis.id, role: input.hypothesis.role };
  const protocol = `offline-simulation:${input.hypothesis.id}`;
  const seed = 'xiv-62lat-classical';
  const fingerprint = createHash('sha256')
    .update(`${protocol}|${seed}|${JSON.stringify(conditions)}`)
    .digest('hex');
  return {
    id: cortexId('expd'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    hypothesisId: input.hypothesis.id,
    kind: 'simulation',
    title: `Offline experiment for ${input.hypothesis.role}`,
    protocol,
    seed,
    conditions,
    fingerprint,
    eligible: true,
    blockedByDeadEnd: false,
    epistemicClass: 'HYPOTHESIS',
    isFact: false,
  };
}

export async function runDesignedExperiment(input: {
  tenantId: string;
  universeId: string;
  design: ExperimentDesign;
  replicaLane?: 'primary' | 'independent';
  fail?: boolean;
  root?: string;
}): Promise<ExperimentRun> {
  const root = input.root ?? process.cwd();
  const dead = await lookupDeadEnd({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.design.kind,
    experiment: input.design.title,
    conditions: input.design.conditions,
    root,
  });
  if (dead) {
    return {
      id: cortexId('erun'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      designId: input.design.id,
      replicaLane: input.replicaLane ?? 'primary',
      evidenceState: 'FAIL',
      measurement: { metric: 'eligible', value: 0, unit: 'bool' },
      digest: input.design.fingerprint,
      skippedDeadEnd: true,
      negativeResultId: dead.id,
      epistemicClass: 'SIMULATION',
      isVerifiedFact: false,
    };
  }

  if (input.fail) {
    const recorded = await recordNegativeResult({
      tenantId: input.tenantId,
      universeId: input.universeId,
      experiment: input.design.title,
      kind: input.design.kind,
      conditions: input.design.conditions,
      evidenceRefs: [input.design.id],
      failure: 'Forced local experiment failure for negative-result retention.',
      root,
    });
    return {
      id: cortexId('erun'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      designId: input.design.id,
      replicaLane: input.replicaLane ?? 'primary',
      evidenceState: 'FAIL',
      measurement: { metric: 'eligible', value: 0, unit: 'bool' },
      digest: input.design.fingerprint,
      skippedDeadEnd: false,
      negativeResultId: recorded.id,
      epistemicClass: 'SIMULATION',
      isVerifiedFact: false,
    };
  }

  const sim = await runScenarioSimulation({
    tenantId: input.tenantId,
    universeId: input.universeId,
    hypothesis: input.design.title,
    consequence: 'LOW',
    root,
  });
  const evidenceState: EvidenceState = sim.status === 'COMPLETED' ? 'PASS' : sim.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'UNKNOWN';
  const run: ExperimentRun = {
    id: cortexId('erun'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    designId: input.design.id,
    replicaLane: input.replicaLane ?? 'primary',
    evidenceState,
    measurement: { metric: 'scenario_completed', value: sim.status === 'COMPLETED' ? 1 : 0, unit: 'bool' },
    digest: input.design.fingerprint,
    skippedDeadEnd: false,
    epistemicClass: 'SIMULATION',
    isVerifiedFact: false,
  };
  const store = await load(root);
  store.designs.push(input.design);
  store.runs.push(run);
  await save(root, store);
  return run;
}

export async function replicateExperiment(input: {
  tenantId: string;
  universeId: string;
  original: ExperimentRun;
  design: ExperimentDesign;
  root?: string;
}) {
  const replica = await runDesignedExperiment({
    tenantId: input.tenantId,
    universeId: input.universeId,
    design: input.design,
    replicaLane: 'independent',
    root: input.root,
  });
  const digestMatch = replica.digest === input.original.digest;
  const measurementAgreed = digestMatch
    && replica.measurement.metric === input.original.measurement.metric
    && replica.measurement.value === input.original.measurement.value
    && replica.evidenceState === input.original.evidenceState;
  let evidenceState: EvidenceState;
  if (!digestMatch) evidenceState = 'FAIL';
  else if (input.original.evidenceState === 'FAIL' && replica.evidenceState === 'FAIL') evidenceState = 'FAIL';
  else if (input.original.evidenceState === 'PASS' && replica.evidenceState === 'PASS' && measurementAgreed) evidenceState = 'PASS';
  else if (!measurementAgreed) evidenceState = 'FAIL';
  else evidenceState = 'UNKNOWN';
  return {
    originalLane: 'primary' as const,
    replicaLane: 'independent' as const,
    sharedMutableState: false as const,
    digestMatch,
    measurementAgreed,
    evidenceState,
    replica,
    inventedPass: false as const,
  };
}

export function generatePrototype(input: {
  tenantId: string;
  universeId: string;
  experiment: ExperimentRun;
  title: string;
}): DiscoveryPrototype {
  return {
    id: cortexId('proto'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    experimentId: input.experiment.id,
    title: input.title.trim().slice(0, 160),
    artifact: `prototype:${input.experiment.id}`,
    epistemicClass: 'PROTOTYPE',
    isValidatedInvention: false,
    isVerifiedFact: false,
    trustedBrainEligible: false,
    note: PROTOTYPE_IS_NOT_INVENTION,
  };
}

export async function runDigitalTwinExperiment(input: {
  tenantId: string;
  universeId: string;
  label: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const twin = await upsertIndustryTwin({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'technology_adoption',
    label: input.label,
    root,
  });
  const fetched = await getIndustryTwin(twin.id, input.tenantId, input.universeId, root);
  return {
    twin,
    fetched,
    isReality: false as const,
    physicalControl: false as const,
    epistemicClass: 'SIMULATION' as const,
    isVerifiedFact: false as const,
  };
}

export async function runMathOptimization(input: {
  tenantId: string;
  universeId: string;
  twinId: string;
  objective: string;
  root?: string;
}) {
  const compiler = cognitiveCompilerPresent();
  const cell = await runOptimizationWorkcell({
    tenantId: input.tenantId,
    universeId: input.universeId,
    twinId: input.twinId,
    objective: input.objective,
    consequence: 'LOW',
    root: input.root,
  });
  return {
    cognitiveCompiler: compiler ? 'AVAILABLE' as const : 'WAITING_DATA' as const,
    cell,
    epistemicClass: 'SIMULATION' as const,
    isVerifiedFact: false as const,
    claimsQuantumAdvantage: false as const,
  };
}

export function runQuantDiscovery(signals: QuantSignal[]) {
  const decision = evaluateQuantSignals(signals);
  return {
    decision,
    tradingAuthorized: false as const,
    epistemicClass: 'FORECAST' as const,
    isVerifiedFact: false as const,
  };
}

export function runQuantumDiscovery() {
  const lab = runBoundedQuantumLab({
    id: cortexId('qdisc'),
    objective: 'Bounded discovery quantum probe with mandatory classical baseline',
    algorithm: 'qaoa',
    backend: 'quantum_qpu',
    qubitCount: 4,
    backendVerified: false,
  });
  return {
    lab,
    classicalBaselineRequired: true as const,
    claimsQuantumAdvantage: false as const,
    qpu: 'UNAVAILABLE' as const,
  };
}

export function promoteDiscoveryEvidence(input: {
  text: string;
  replicatedPass: boolean;
  humanApproved: boolean;
  evidence?: { source: string; retrievedAt: string; reference: string } | null;
}) {
  if (!input.replicatedPass) {
    return {
      allowed: false as const,
      state: 'UNVERIFIED' as const,
      promotedToVerifiedFact: false as const,
      reason: 'Unreplicated evidence cannot be promoted.',
    };
  }
  if (!input.humanApproved) {
    return {
      allowed: false as const,
      state: 'REVIEW_REQUIRED' as const,
      promotedToVerifiedFact: false as const,
      reason: 'Human review is required before trusted-brain entry.',
    };
  }
  const promoted = promoteKnowledge({
    text: input.text,
    evidence: input.evidence,
    aiAgreementOnly: false,
  });
  if ('allowed' in promoted && promoted.allowed === false) {
    return {
      allowed: false as const,
      state: promoted.state,
      promotedToVerifiedFact: false as const,
      reason: promoted.reason,
    };
  }
  return {
    allowed: true as const,
    state: 'SUPPORTED' as const,
    promotedToVerifiedFact: false as const,
    reason: 'Promotion may reach SUPPORTED. It does not auto-become VERIFIED_FACT.',
    candidate: promoted,
  };
}

export async function enterTrustedBrain(input: {
  tenantId: string;
  universeId: string;
  prototype: DiscoveryPrototype;
  humanReviewerId?: string;
  humanApproved: boolean;
  impersonateFounder?: boolean;
  markValidatedInvention?: boolean;
  root?: string;
}): Promise<TrustedBrainEntry> {
  const root = input.root ?? process.cwd();
  if (input.impersonateFounder) {
    return {
      id: cortexId('tbe'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      prototypeId: input.prototype.id,
      accepted: false,
      epistemicClass: 'PROTOTYPE',
      isVerifiedFact: false,
      isValidatedInvention: false,
      humanReviewRequired: true,
      reason: 'FOUNDER_IMPERSONATION_DENIED',
    };
  }
  if (input.markValidatedInvention || input.prototype.isValidatedInvention) {
    return {
      id: cortexId('tbe'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      prototypeId: input.prototype.id,
      accepted: false,
      epistemicClass: 'PROTOTYPE',
      isVerifiedFact: false,
      isValidatedInvention: false,
      humanReviewRequired: true,
      reason: 'PROTOTYPE_IS_NOT_VALIDATED_INVENTION',
    };
  }
  if (!input.humanApproved || !input.humanReviewerId?.trim()) {
    return {
      id: cortexId('tbe'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      prototypeId: input.prototype.id,
      accepted: false,
      epistemicClass: 'PROTOTYPE',
      isVerifiedFact: false,
      isValidatedInvention: false,
      humanReviewRequired: true,
      reason: 'HUMAN_REVIEW_REQUIRED_BEFORE_TRUSTED_BRAIN_ENTRY',
    };
  }
  const entry: TrustedBrainEntry = {
    id: cortexId('tbe'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    prototypeId: input.prototype.id,
    accepted: true,
    epistemicClass: 'TRUSTED_CANDIDATE',
    isVerifiedFact: false,
    isValidatedInvention: false,
    humanReviewRequired: true,
    reason: 'Human-reviewed prototype entered as TRUSTED_CANDIDATE, not VERIFIED_FACT and not validated invention.',
  };
  const store = await load(root);
  store.prototypes.push(input.prototype);
  store.trusted.push(entry);
  await save(root, store);
  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Trusted-brain candidate ${entry.id} (not VERIFIED_FACT)`,
    payload: { prototypeId: input.prototype.id, epistemicClass: entry.epistemicClass },
  }, root);
  return entry;
}
