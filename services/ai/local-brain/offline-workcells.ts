import { proposeStructuredPatch, type StructuredPatchProposal } from './coding-agent';
import { runTestingAgent, type TestingAgentRunner } from './testing-agent';
import { verifySecurity } from './security-verifier';
import { validateWorkEnvelope } from './collaboration-protocol';
import { planDemandAgents } from './demand-agent-planner';
import { retrieveEvidencePathway } from './cortex-evidence';
import { evaluateQuantSignals, type QuantSignal } from './quant-logic';
import { runClassicalQuantQuantumBridge } from './simulation-lab';
import { InfrastructurePathwayGraph, type InfrastructureNode } from './infrastructure-pathways';
import { runResearchFeedbackLoop } from './research-civilization';
import { runBoundedSelfImprovement } from './self-improvement-harness';
import { CHIP_COMPUTE_HONESTY } from './chip-compute-graph';
import type { AllowedLocalCommand } from './local-command-runner';
import type { ConsequenceClass } from './decision-gate';

export type CodingWorkcellResult = {
  retrieval: Awaited<ReturnType<typeof retrieveEvidencePathway>>;
  recruitment: ReturnType<typeof planDemandAgents>;
  envelope: ReturnType<typeof validateWorkEnvelope>;
  proposal: { accepted: false; reason: string } | { accepted: true; proposal: StructuredPatchProposal; reason: string };
  security: ReturnType<typeof verifySecurity> | null;
  tests: Awaited<ReturnType<typeof runTestingAgent>> | null;
  attempts: Array<{ testPassed: boolean; reason: string }>;
  shellCommands: [];
  productionAuthorization: false;
};

export async function runProtectedCodingWorkcell(input: {
  tenantId: string;
  universeId: string;
  storyId?: string;
  objective: string;
  files: StructuredPatchProposal['files'];
  testsExpected?: AllowedLocalCommand[];
  cwd: string;
  runner?: TestingAgentRunner;
  requestedShell?: string[];
  currentBranch?: string;
  approved?: boolean;
  root?: string;
}): Promise<CodingWorkcellResult> {
  const retrieval = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.objective,
    root: input.root,
  });
  const envelope = validateWorkEnvelope({
    id: `env_${input.storyId ?? 'ac'}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    objective: input.objective,
    requestedRoles: ['coder', 'tester', 'security'],
    sourceProvider: 'local_model',
    targetProviders: ['local_model'],
    evidenceRefs: retrieval.evidenceRefs,
    classification: 'internal',
    consequence: 'LOW',
    productionAuthorized: false,
    permissionExpansionAuthorized: false,
  });
  const recruitment = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: input.storyId ?? 'coding',
    requestedRoles: ['coder', 'tester', 'security'],
    consequence: 'LOW',
    approved: input.approved ?? true,
  });
  const proposal = proposeStructuredPatch({
    storyId: input.storyId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: input.objective,
    files: input.files,
    testsExpected: input.testsExpected,
    requestedShell: input.requestedShell,
  });
  if (!proposal.accepted) {
    return {
      retrieval,
      recruitment,
      envelope,
      proposal,
      security: null,
      tests: null,
      attempts: [],
      shellCommands: [],
      productionAuthorization: false,
    };
  }
  const security = verifySecurity({
    files: proposal.proposal.files.map((file) => ({ path: file.path, unifiedDiff: file.unifiedDiff })),
    currentBranch: input.currentBranch,
    productionLocks: { l4Autonomy: false, autoProduction: false, guardianOverride: false },
  });
  return {
    retrieval,
    recruitment,
    envelope,
    proposal,
    security,
    tests: null,
    attempts: [],
    shellCommands: [],
    productionAuthorization: false,
  };
}

export async function runTestFixRetestLoop(input: {
  tenantId: string;
  universeId: string;
  cwd: string;
  commands: AllowedLocalCommand[];
  maxAttempts?: number;
  runner?: TestingAgentRunner;
}): Promise<{
  passed: boolean;
  attempts: Array<{ attempt: number; passed: boolean; exitCodes: Array<number | null>; reason: string }>;
  productionEffect: false;
  productionAuthorization: false;
}> {
  const maxAttempts = Math.max(1, Math.min(input.maxAttempts ?? 3, 5));
  const attempts: Array<{ attempt: number; passed: boolean; exitCodes: Array<number | null>; reason: string }> = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await runTestingAgent({
      cwd: input.cwd,
      commands: input.commands,
      runner: input.runner,
    });
    attempts.push({
      attempt,
      passed: result.passed,
      exitCodes: result.results.map((item) => item.exitCode),
      reason: result.reason,
    });
    if (result.passed) {
      return { passed: true, attempts, productionEffect: false, productionAuthorization: false };
    }
  }
  return { passed: false, attempts, productionEffect: false, productionAuthorization: false };
}

export async function runQuantWorkcell(input: {
  tenantId: string;
  universeId: string;
  signals: QuantSignal[];
  includeQuantumResearch?: boolean;
  root?: string;
}) {
  const retrieval = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: 'quant workcell classical baseline',
    root: input.root,
  });
  const classical = evaluateQuantSignals(input.signals);
  const bridge = input.includeQuantumResearch
    ? await runClassicalQuantQuantumBridge({
      tenantId: input.tenantId,
      universeId: input.universeId,
      signals: input.signals,
      problem: {
        id: 'ac-quant',
        objective: 'minimize_cost',
        variables: 2,
        constraints: ['sandbox-only'],
        provenanceRefs: ['synthetic:62lac-quant'],
      },
      quantum: {
        id: 'ac-q-research',
        objective: 'Bounded quantum research after classical baseline',
        algorithm: 'qaoa',
        backend: 'quantum_qpu',
        qubitCount: 4,
        backendVerified: false,
      },
      root: input.root,
    })
    : null;
  return {
    retrieval,
    classical,
    bridge,
    tradingAuthorized: false as const,
    claimsQuantumAdvantage: false as const,
    productionAuthorization: false as const,
    independentOfSecurityLegalGates: true as const,
  };
}

export async function runInfrastructureWorkcell(input: {
  tenantId: string;
  universeId: string;
  nodes: InfrastructureNode[];
  edges?: Array<{ id: string; from: string; to: string; relation: 'connects' | 'depends_on' | 'hosts'; provenanceRefs: string[] }>;
  root?: string;
}) {
  const retrieval = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: 'infrastructure workcell local graph',
    root: input.root,
  });
  const graph = new InfrastructurePathwayGraph();
  for (const node of input.nodes) graph.addNode(node);
  for (const edge of input.edges ?? []) graph.addEdge(edge);
  return {
    retrieval,
    snapshot: graph.snapshot(),
    physicalDeviceControl: false as const,
    chipHonesty: CHIP_COMPUTE_HONESTY,
    productionAuthorization: false as const,
  };
}

export async function runResearchWorkcell(input: {
  tenantId: string;
  universeId: string;
  question: string;
  hypothesis: string;
  consequence?: ConsequenceClass;
  root?: string;
}) {
  const loop = await runResearchFeedbackLoop({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.question,
    hypothesis: input.hypothesis,
    consequence: input.consequence,
    root: input.root,
  });
  return {
    loop,
    speculativeOnly: true as const,
    isReality: false as const,
    productionAuthorization: false as const,
  };
}

export async function runBoundedImprovementAfterEvidence(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  observed: string;
  successful: boolean;
  evidenceRefs: string[];
  consequence?: ConsequenceClass;
  permissionChange?: boolean;
  root?: string;
}) {
  return runBoundedSelfImprovement({
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective,
    observed: input.observed,
    successful: input.successful,
    evidenceRefs: input.evidenceRefs,
    consequence: input.consequence,
    permissionChange: input.permissionChange,
    root: input.root,
  });
}
