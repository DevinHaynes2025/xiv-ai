import { learnAcrossIndustries } from './historical-industry-learning';
import { retrieveEvidencePathway } from './cortex-evidence';
import { evaluateQuantSignals, type QuantSignal } from './quant-logic';
import { runBoundedQuantumLab } from './quantum-research-lab';
import { snapshotChipComputeGraph, registerChipComputeNode } from './chip-compute-graph';
import { runNightShift } from './night-shift';
import { createResearchCivilization, runResearchFeedbackLoop } from './research-civilization';
import { evaluateResearchOffline, gateResearchAction } from './research-authority';
import type { EvidenceState } from './autonomous-research-types';

export async function runMultiIndustryResearch(input: {
  tenantId: string;
  universeId: string;
  question: string;
  needsExternalFreshness?: boolean;
  root?: string;
}) {
  const lesson = await learnAcrossIndustries({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    needsExternalFreshness: input.needsExternalFreshness,
    root: input.root,
  });
  return {
    ...lesson,
    cell: 'multi_industry' as const,
    analogyIsIdentity: false as const,
  };
}

export async function runHistoricalResearch(input: {
  tenantId: string;
  universeId: string;
  question: string;
  needsExternalFreshness?: boolean;
  root?: string;
}) {
  const lesson = await learnAcrossIndustries({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    domains: ['history', 'culture', 'humanities'],
    needsExternalFreshness: input.needsExternalFreshness,
    root: input.root,
  });
  return {
    ...lesson,
    cell: 'historical' as const,
    inventedFacts: false as const,
  };
}

export async function runRegionalResearch(input: {
  tenantId: string;
  universeId: string;
  region: string;
  question: string;
  needsExternalFreshness?: boolean;
  root?: string;
}) {
  const offline = evaluateResearchOffline({
    needsExternalFreshness: input.needsExternalFreshness,
    needsInternet: input.needsExternalFreshness,
  });
  if (!offline.allowed) {
    return {
      cell: 'regional' as const,
      region: input.region,
      state: offline.state,
      inventedFacts: false as const,
      liveFieldStudy: false as const,
      reason: offline.reason,
    };
  }
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: `${input.region} ${input.question}`,
    root: input.root,
  });
  return {
    cell: 'regional' as const,
    region: input.region,
    state: (evidence.evidenceRefs.length ? 'PASS' : evidence.state === 'AVAILABLE' ? 'UNKNOWN' : evidence.state) as EvidenceState,
    inventedFacts: false as const,
    liveFieldStudy: false as const,
    evidenceRefs: evidence.evidenceRefs,
    reason: evidence.reason,
  };
}

export function runQuantResearch(input: { signals: QuantSignal[] }) {
  const trade = gateResearchAction({ action: 'quant research trade', trading: true });
  const classical = evaluateQuantSignals(input.signals);
  return {
    cell: 'quant' as const,
    classical,
    tradingAuthorized: false as const,
    tradeDenied: trade.allowed === false,
    tradeState: trade.state,
    claimsQuantumAdvantage: false as const,
  };
}

export function runBoundedQuantumResearchCell(input: {
  id: string;
  objective: string;
}) {
  const lab = runBoundedQuantumLab({
    id: input.id,
    objective: input.objective,
    algorithm: 'qaoa',
    backend: 'classical_simulator',
    qubitCount: 4,
  });
  const qpu = runBoundedQuantumLab({
    id: `${input.id}-qpu`,
    objective: input.objective,
    algorithm: 'qaoa',
    backend: 'quantum_qpu',
    qubitCount: 8,
    backendVerified: false,
  });
  return {
    cell: 'quantum' as const,
    classicalBaselineRequired: true as const,
    claimsQuantumAdvantage: false as const,
    simulatorIsQpu: false as const,
    classicalLab: lab,
    unverifiedQpu: qpu,
    qpuState: qpu.experiment.state,
  };
}

export function runInfrastructureRd(input: {
  tenantId: string;
  universeId: string;
}) {
  const physical = gateResearchAction({ action: 'control data-center hardware', physicalControl: true });
  registerChipComputeNode({
    id: `infra-rd-${input.tenantId}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    family: 'cpu_x86_64',
    label: 'Logical research CPU node',
    locality: 'device',
    configured: true,
    authorized: true,
    state: 'AVAILABLE',
    capabilities: ['local_research'],
    maxConcurrentTasks: 2,
    productionAuthorized: false,
    provenanceRefs: ['synthetic:62lai-infra'],
  });
  const snapshot = snapshotChipComputeGraph({ tenantId: input.tenantId, universeId: input.universeId });
  return {
    cell: 'infrastructure' as const,
    snapshot,
    physicalDenied: physical.allowed === false,
    physicalState: physical.state,
    autoPurchase: snapshot.honesty.autoInfrastructurePurchase,
    darkMatterChipFamily: snapshot.honesty.darkMatterChipFamily,
    productionAuthorization: false as const,
  };
}

export async function runOfflineNightResearch(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  approved: boolean;
}) {
  const report = await runNightShift([{
    id: `night-rd-${input.tenantId}`,
    objective: input.objective,
    roles: ['researcher', 'skeptic', 'evidence_verifier'],
    maxRounds: 1,
    approved: input.approved,
  }]);
  return {
    cell: 'offline_night' as const,
    report,
    productionDeployments: report.productionDeployments,
    permissionExpansions: report.permissionExpansions,
  };
}

export async function wrapResearchCivilization(input: {
  tenantId: string;
  universeId: string;
  question: string;
  hypothesis: string;
  root?: string;
}) {
  const lab = await createResearchCivilization({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  const loop = await runResearchFeedbackLoop({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    hypothesis: input.hypothesis,
    includeQuantumLab: true,
    root: input.root,
  });
  return {
    lab,
    loop,
    isReality: false as const,
    productionAuthorization: false as const,
  };
}
