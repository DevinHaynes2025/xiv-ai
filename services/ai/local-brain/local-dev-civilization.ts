import { planDemandAgents, type AgentDemand } from './demand-agent-planner';
import { proposeStructuredPatch, type PatchFileChange } from './coding-agent';
import { appendEvidenceEvent } from './evidence-ledger';
import { publishPersistentAgentMessage } from './persistent-agent-bus';
import { selectAvailableTargets, validateWorkEnvelope, type ProviderObservation, type WorkEnvelope } from './collaboration-protocol';
import { evaluateSandboxOperation } from './sandbox-guard';
import { verifyPatchProposal } from './security-verifier';
import { runTestingAgent, type TestingAgentRunner } from './testing-agent';

export type LocalDevCivilizationInput = {
  envelope: WorkEnvelope;
  demand: AgentDemand;
  observations: ProviderObservation[];
  currentBranch: string;
  files: PatchFileChange[];
  testsExpected?: string[];
  cwd: string;
  testCommands?: string[];
  runner?: TestingAgentRunner;
};

export async function runLocalDevelopmentCivilization(input: LocalDevCivilizationInput) {
  const envelopeGate = validateWorkEnvelope(input.envelope);
  const providers = selectAvailableTargets(input.envelope, input.observations);
  const sandbox = evaluateSandboxOperation({ currentBranch: input.currentBranch, action: 'commit' });
  const evidenceRefs: string[] = [];

  const record = async (kind: Parameters<typeof appendEvidenceEvent>[0]['kind'], summary: string, payload: Record<string, unknown>) => {
    const event = await appendEvidenceEvent({
      kind,
      storyId: input.envelope.storyId,
      tenantId: input.envelope.tenantId,
      universeId: input.envelope.universeId,
      summary,
      payload,
    }, input.cwd);
    evidenceRefs.push(event.id);
    return event;
  };

  await record('sandbox_decision', sandbox.reason, { allowed: sandbox.allowed, branch: input.currentBranch });

  const blocked = (status: 'BLOCKED' | 'HUMAN_APPROVAL_REQUIRED' | 'UNAVAILABLE' | 'NOT_APPROVED', extra: {
    taskForce: ReturnType<typeof planDemandAgents>;
    coding: ReturnType<typeof proposeStructuredPatch>;
  }) => ({
    status,
    envelopeGate,
    providers,
    sandbox,
    taskForce: extra.taskForce,
    coding: extra.coding,
    testing: null,
    security: null,
    evidenceRefs,
    companyDivisionRuntimes: false as const,
    productionAuthorization: false as const,
  });

  if (!envelopeGate.accepted) {
    const taskForce = { status: 'HUMAN_APPROVAL_REQUIRED' as const, agents: [], productionAuthorization: false as const };
    const coding = { accepted: false as const, reason: envelopeGate.reason };
    await record('population', 'Task force recruitment skipped until human approval.', { status: taskForce.status });
    return blocked(envelopeGate.state, { taskForce, coding });
  }
  if (!sandbox.allowed) {
    const taskForce = { status: 'NOT_APPROVED' as const, agents: [], productionAuthorization: false as const };
    const coding = { accepted: false as const, reason: sandbox.reason };
    await record('population', 'Task force recruitment skipped because the sandbox branch guard refused the work.', { status: taskForce.status });
    return blocked('BLOCKED', { taskForce, coding });
  }

  const taskForce = planDemandAgents(input.demand);
  await record('population', `Task force status ${taskForce.status}`, { status: taskForce.status, productionAuthorization: false });
  const coding = proposeStructuredPatch({
    storyId: input.envelope.storyId,
    tenantId: input.envelope.tenantId,
    universeId: input.envelope.universeId,
    summary: input.envelope.objective,
    files: input.files,
    testsExpected: input.testsExpected,
  });

  if (taskForce.status !== 'PLANNED') {
    return blocked(taskForce.status, { taskForce, coding });
  }
  if (!coding.accepted) {
    return blocked('BLOCKED', { taskForce, coding });
  }

  await record('patch_proposal', coding.proposal.summary, { proposalId: coding.proposal.id, files: coding.proposal.files.map((file) => file.path) });
  await publishPersistentAgentMessage({
    fromRole: 'coder',
    toRole: 'tester',
    tenantId: input.envelope.tenantId,
    universeId: input.envelope.universeId,
    kind: 'task',
    body: `Structured patch proposal ${coding.proposal.id} ready for allowlisted tests.`,
    evidenceRefs,
    requiresHumanApproval: false,
  }, input.cwd);

  const testing = await runTestingAgent({
    cwd: input.cwd,
    commands: input.testCommands ?? ['git_diff_check'],
    runner: input.runner,
  });
  await record('test_result', testing.reason, { passed: testing.passed, commandIds: testing.results.map((result) => result.commandId), exitCodes: testing.results.map((result) => result.exitCode) });

  const security = verifyPatchProposal(coding.proposal, input.currentBranch);
  await record('security_review', security.passed ? 'Security verifier passed.' : 'Security verifier found issues.', { passed: security.passed, findings: security.findings });

  const unavailableProviders = providers.filter((provider) => provider.state !== 'AVAILABLE');
  const status = !testing.passed || !security.passed
    ? 'BLOCKED' as const
    : unavailableProviders.length === providers.length
      ? 'UNAVAILABLE' as const
      : 'PREPARED' as const;

  return {
    status,
    envelopeGate,
    providers,
    sandbox,
    taskForce,
    coding,
    testing,
    security,
    evidenceRefs,
    companyDivisionRuntimes: false as const,
    productionAuthorization: false as const,
  };
}
