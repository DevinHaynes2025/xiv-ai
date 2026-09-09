import { planDemandAgents } from './demand-agent-planner';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { appendLearning } from './learning-ledger';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import { openMeetingRoom } from './meeting-rooms';
import { evaluateQuantSignals, type QuantSignal } from './quant-logic';
import { createQuantumExperiment, validateQuantProblem, type QuantumExperiment, type QuantOptimizationProblem } from './quantum-research';
import { runAllowedLocalCommand, type AllowedLocalCommand } from './local-command-runner';
import { validateWorkEnvelope, type WorkEnvelope } from './collaboration-protocol';
import type { MeshAgentRole } from './agent-mesh';

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const PROTECTED_BRANCHES = new Set(['main', 'master']);
const DENIED_PATH_MARKERS = ['.env', 'id_rsa', 'credentials', '.git/'];

export type DecisionCouncilInput = {
  tenantId: string;
  universeId: string;
  action: string;
  consequence: ConsequenceClass;
  production?: boolean;
  financialCommitment?: boolean;
  legalCommitment?: boolean;
  permissionChange?: boolean;
  externalPublication?: boolean;
  approved?: boolean;
  root?: string;
};

export async function runDecisionCouncil(input: DecisionCouncilInput) {
  const gate = decisionGate({
    id: id('decision'),
    action: input.action,
    consequence: input.consequence,
    production: input.production === true,
    financialCommitment: input.financialCommitment === true,
    legalCommitment: input.legalCommitment === true,
    permissionChange: input.permissionChange === true,
    externalPublication: input.externalPublication === true,
  });

  const recruitment = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: id('council'),
    requestedRoles: ['skeptic', 'evidence_verifier', 'decision_strategist', 'executive_synthesizer'],
    consequence: input.consequence,
    approved: input.approved ?? input.consequence === 'LOW',
  });

  const knowledge = await retrieveOfflineKnowledge(input.action, {
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });

  const dissent: string[] = ['Consensus is not forced; dissent is preserved.'];
  if (knowledge.nodes.some((node) => node.claimState === 'DISPUTED')) {
    dissent.push('Local knowledge contains disputed claims; consensus is not forced.');
  }
  if (!gate.executableByAgent) {
    dissent.push(gate.reason);
  }
  if (recruitment.status !== 'PLANNED') {
    dissent.push(`Recruitment blocked: ${recruitment.status}.`);
  }

  let roomId: string | undefined;
  if (recruitment.status === 'PLANNED') {
    const room = await openMeetingRoom({
      tenantId: input.tenantId,
      universeId: input.universeId,
      objective: `Decision Council: ${input.action}`,
      roles: ['skeptic', 'evidence_verifier', 'decision_strategist', 'executive_synthesizer'],
      maxRounds: 1,
      root: input.root,
    });
    roomId = room.id;
  }

  const recommendation = !gate.executableByAgent || input.consequence === 'HIGH' || input.consequence === 'CRITICAL'
    ? 'HUMAN_APPROVAL_REQUIRED'
    : recruitment.status !== 'PLANNED'
      ? recruitment.status
      : 'PREPARE_LOCALLY';

  await appendLearning({
    domain: 'business',
    subject: `decision-council:${input.action.slice(0, 80)}`,
    claimState: 'MODEL_INFERENCE',
    summary: `${recommendation}; dissent=${dissent.length}; knowledge=${knowledge.evidenceRefs.length}`,
    sourceRefs: knowledge.evidenceRefs,
    evidence: knowledge.evidenceRefs,
    taskId: roomId,
    meetingId: roomId,
  }, input.root);

  return {
    gate,
    recruitment,
    knowledge,
    dissent,
    roomId,
    recommendation,
    consensusForced: false as const,
    productionAuthorization: false as const,
  };
}

export async function runQuantWorkcell(input: {
  tenantId: string;
  universeId: string;
  signals: QuantSignal[];
  approved?: boolean;
  root?: string;
}) {
  const recruitment = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: id('quant'),
    requestedRoles: ['finance_analyst'],
    consequence: 'LOW',
    approved: input.approved ?? true,
  });
  const decision = evaluateQuantSignals(input.signals);
  await appendLearning({
    domain: 'finance',
    subject: `quant-workcell:${input.tenantId}`,
    claimState: 'MODEL_INFERENCE',
    summary: `score=${decision.score}; confidence=${decision.confidence}; rec=${decision.recommendation}`,
    sourceRefs: input.signals.flatMap((signal) => signal.evidenceRefs),
    evidence: input.signals.map((signal) => signal.id),
  }, input.root);

  return {
    decision,
    recruitment,
    tradingAuthorized: false as const,
    claimsQuantumAdvantage: false as const,
    productionAuthorization: false as const,
    independentOfSecurityLegalGates: true as const,
  };
}

export async function runQuantumResearchWorkcell(input: {
  tenantId: string;
  universeId: string;
  experiment: Parameters<typeof createQuantumExperiment>[0];
  problem?: QuantOptimizationProblem;
  approved?: boolean;
  root?: string;
}) {
  const experiment: QuantumExperiment = createQuantumExperiment(input.experiment);
  const problem = input.problem ? validateQuantProblem(input.problem) : null;
  const recruitment = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: id('quantum'),
    requestedRoles: ['researcher'],
    consequence: 'LOW',
    approved: input.approved ?? true,
  });

  await appendLearning({
    domain: 'science',
    subject: `quantum-workcell:${experiment.id}`,
    claimState: 'MODEL_INFERENCE',
    summary: `backend=${experiment.backend}; state=${experiment.state}; qubits=${experiment.qubitCount}; classicalBaselineRequired=${experiment.classicalBaselineRequired}`,
    sourceRefs: experiment.evidenceRefs,
    evidence: [`experiment:${experiment.id}`],
  }, input.root);

  return {
    experiment,
    problem,
    recruitment,
    claimsQuantumAdvantage: false as const,
    productionAuthorization: false as const,
    qpuExecutionAuthorized: false as const,
  };
}

export type GovernedCodingProposal = {
  summary: string;
  files: Array<{ path: string; unifiedDiff: string }>;
  testsExpected: AllowedLocalCommand[];
  requestedShell?: string[];
};

export async function runCodingTestingWorkcell(input: {
  tenantId: string;
  universeId: string;
  proposal: GovernedCodingProposal;
  currentBranch?: string;
  cwd?: string;
  runTests?: boolean;
  approved?: boolean;
  consequence?: ConsequenceClass;
  storyId?: string;
  root?: string;
}) {
  const envelope: WorkEnvelope = {
    id: id('code-env'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    objective: input.proposal.summary,
    requestedRoles: ['coder', 'tester', 'security'],
    sourceProvider: 'local_model',
    targetProviders: ['local_model'],
    evidenceRefs: [`story:${input.storyId ?? '62L-U'}`],
    classification: 'internal',
    consequence: input.consequence ?? 'LOW',
    productionAuthorized: false,
    permissionExpansionAuthorized: false,
  };
  const accepted = validateWorkEnvelope(envelope);
  if (!accepted.accepted) {
    return { accepted: false as const, reason: accepted.reason, productionGitPush: false as const, shellCommands: [] as const };
  }
  if (!input.proposal.files.length && !input.runTests) {
    return { accepted: false as const, reason: 'CODING_WORKCELL_EMPTY_PROPOSAL', productionGitPush: false as const, shellCommands: [] as const };
  }
  if (input.proposal.requestedShell && input.proposal.requestedShell.length > 0) {
    return { accepted: false as const, reason: 'CODING_WORKCELL_NO_SHELL: structured proposals only; arbitrary shell is denied.', productionGitPush: false as const, shellCommands: [] as const };
  }
  if (input.currentBranch && PROTECTED_BRANCHES.has(input.currentBranch)) {
    return { accepted: false as const, reason: `PROTECTED_BRANCH:${input.currentBranch}`, productionGitPush: false as const, shellCommands: [] as const };
  }
  for (const file of input.proposal.files) {
    const path = file.path.replaceAll('\\', '/');
    if (DENIED_PATH_MARKERS.some((marker) => path.includes(marker))) {
      return { accepted: false as const, reason: `PROTECTED_PATH:${file.path}`, productionGitPush: false as const, shellCommands: [] as const };
    }
  }

  const recruitment = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: id('coding'),
    requestedRoles: ['coder', 'tester', 'security'] as MeshAgentRole[],
    consequence: input.consequence ?? 'LOW',
    approved: input.approved ?? true,
  });

  const testResults: Array<{ id: AllowedLocalCommand; exitCode: number | null; timedOut: boolean; productionEffect: false }> = [];
  if (input.runTests) {
    for (const commandId of input.proposal.testsExpected) {
      const result = await runAllowedLocalCommand({ id: commandId, cwd: input.cwd ?? process.cwd(), timeoutMs: 30_000 });
      testResults.push({ id: commandId, exitCode: result.exitCode, timedOut: result.timedOut, productionEffect: false });
    }
  }

  await appendLearning({
    domain: 'technology',
    subject: `coding-workcell:${input.proposal.summary.slice(0, 80)}`,
    claimState: 'MODEL_INFERENCE',
    summary: `proposal files=${input.proposal.files.length}; tests=${testResults.length}; recruitment=${recruitment.status}`,
    sourceRefs: [envelope.id],
    evidence: testResults.map((result) => `${result.id}:${result.exitCode}`),
  }, input.root);

  return {
    accepted: true as const,
    envelope,
    recruitment,
    testResults,
    shellCommands: [] as const,
    productionGitPush: false as const,
    productionDatabaseWrite: false as const,
    reason: 'Structured coding/testing workcell recorded without production effect.',
  };
}
