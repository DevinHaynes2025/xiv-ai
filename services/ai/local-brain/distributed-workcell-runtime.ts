import { planDemandAgents } from './demand-agent-planner';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { type PatchFileChange } from './coding-agent';
import { type QuantSignal } from './quant-logic';
import { runAllowedLocalCommand, type AllowedLocalCommand } from './local-command-runner';
import { appendLearning } from './learning-ledger';
import { routeLocalFirst } from './local-first-router';
import { enterEdgeAgentMode } from './edge-agent-mode';
import { consumeNodeResource } from './distributed-resource-governance';
import { beginConsequentialWork, completeConsequentialWork, lookupConsequentialWork } from './mesh-reconciliation';
import { publishMeshEnvelope } from './partition-safe-bus';
import { getMeshNode, isRoutingEligible } from './mesh-node-registry';
import { type MeshEvidenceState } from './distributed-mesh-types';
import {
  runProtectedCodingWorkcell,
  runQuantWorkcell,
  runResearchWorkcell,
} from './offline-workcells';

export type DistributedWorkcellKind = 'coding' | 'research' | 'quant' | 'generic';

export type DistributedWorkcellResult = {
  workId: string;
  kind: DistributedWorkcellKind;
  executedOnNodeId: string | null;
  mode: 'local' | 'authorized_peer' | 'none' | 'duplicate';
  state: MeshEvidenceState;
  duplicatePrevented: boolean;
  edgeLocalOnly: boolean;
  recommendation?: string;
  evidenceRefs: string[];
  productionAuthorization: false;
  tradingAuthorized: false;
  reason: string;
};

async function refuseIfNotEligible(nodeId: string, tenantId: string, universeId: string, root: string | undefined, now: number) {
  const node = await getMeshNode(nodeId, tenantId, universeId, root);
  if (!node || !isRoutingEligible(node, now)) {
    return { ok: false as const, reason: 'Workcell host is not detected, configured, authorized, and verified.' };
  }
  return { ok: true as const, node };
}

export async function runDistributedWorkcell(input: {
  workId: string;
  kind: DistributedWorkcellKind;
  localNodeId: string;
  tenantId: string;
  universeId: string;
  action: string;
  consequence?: ConsequenceClass;
  edgeMode?: boolean;
  coding?: { summary: string; files: PatchFileChange[]; testsExpected?: AllowedLocalCommand[]; cwd?: string; runGitStatus?: boolean };
  quantSignals?: QuantSignal[];
  approved?: boolean;
  root?: string;
  now?: number;
}): Promise<DistributedWorkcellResult> {
  const root = input.root ?? process.cwd();
  const now = input.now ?? Date.now();
  const existing = await lookupConsequentialWork({
    workId: input.workId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  if (existing) {
    return {
      workId: input.workId,
      kind: input.kind,
      executedOnNodeId: null,
      mode: 'duplicate',
      state: 'PASS',
      duplicatePrevented: true,
      edgeLocalOnly: input.edgeMode === true,
      evidenceRefs: [existing.resultRef || existing.workId],
      productionAuthorization: false,
      tradingAuthorized: false,
      reason: 'Duplicate consequential workId was not re-executed.',
    };
  }

  const host = await refuseIfNotEligible(input.localNodeId, input.tenantId, input.universeId, root, now);
  if (!host.ok) {
    return {
      workId: input.workId,
      kind: input.kind,
      executedOnNodeId: null,
      mode: 'none',
      state: 'UNAVAILABLE',
      duplicatePrevented: false,
      edgeLocalOnly: input.edgeMode === true,
      evidenceRefs: [],
      productionAuthorization: false,
      tradingAuthorized: false,
      reason: host.reason,
    };
  }

  const budget = await consumeNodeResource({
    nodeId: input.localNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'workcells',
    units: 1,
    root,
  });
  if (!budget.allowed) {
    return {
      workId: input.workId,
      kind: input.kind,
      executedOnNodeId: null,
      mode: 'none',
      state: 'FAIL',
      duplicatePrevented: false,
      edgeLocalOnly: input.edgeMode === true,
      evidenceRefs: [],
      productionAuthorization: false,
      tradingAuthorized: false,
      reason: budget.reason,
    };
  }

  if (input.edgeMode) {
    const edge = await enterEdgeAgentMode({
      nodeId: input.localNodeId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root,
      now,
    });
    if (!edge.eligible || edge.peerRouting) {
      return {
        workId: input.workId,
        kind: input.kind,
        executedOnNodeId: null,
        mode: 'none',
        state: 'UNAVAILABLE',
        duplicatePrevented: false,
        edgeLocalOnly: true,
        evidenceRefs: [],
        productionAuthorization: false,
        tradingAuthorized: false,
        reason: edge.reason,
      };
    }
  }

  const requiredCapability = input.kind === 'generic' ? 'coding' : input.kind;
  const route = input.edgeMode
    ? {
      targetNodeId: input.localNodeId,
      mode: 'local' as const,
      state: 'PASS' as const,
      reason: 'Edge-agent mode forces local execution.',
      localFirst: true as const,
      productionAuthorization: false as const,
    }
    : await routeLocalFirst({
      localNodeId: input.localNodeId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      requiredCapability,
      consequence: input.consequence,
      root,
      now,
    });

  if (!route.targetNodeId || route.mode === 'none') {
    return {
      workId: input.workId,
      kind: input.kind,
      executedOnNodeId: null,
      mode: 'none',
      state: route.state,
      duplicatePrevented: false,
      edgeLocalOnly: input.edgeMode === true,
      evidenceRefs: [],
      productionAuthorization: false,
      tradingAuthorized: false,
      reason: route.reason,
    };
  }

  const lock = await beginConsequentialWork({
    workId: input.workId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    root,
    now,
  });
  if (!lock.accepted && lock.duplicatePrevented) {
    return {
      workId: input.workId,
      kind: input.kind,
      executedOnNodeId: null,
      mode: 'duplicate',
      state: 'PASS',
      duplicatePrevented: true,
      edgeLocalOnly: input.edgeMode === true,
      evidenceRefs: lock.existing ? [lock.existing.resultRef || lock.existing.workId] : [input.workId],
      productionAuthorization: false,
      tradingAuthorized: false,
      reason: 'Duplicate consequential workId was not re-executed.',
    };
  }

  const gate = decisionGate({
    id: `workcell-${input.workId}`,
    action: input.action,
    consequence: input.consequence ?? 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  const recruitment = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: input.workId,
    requestedRoles: input.kind === 'quant' ? ['finance_analyst'] : input.kind === 'coding' ? ['coder', 'tester'] : ['researcher', 'skeptic'],
    consequence: input.consequence ?? 'LOW',
    approved: input.approved ?? true,
  });

  const evidenceRefs: string[] = [`route:${route.mode}:${route.targetNodeId}`];
  let recommendation = gate.executableByAgent ? 'PREPARE_LOCALLY' : 'HUMAN_APPROVAL_REQUIRED';

  if (input.kind === 'coding') {
    const coding = await runProtectedCodingWorkcell({
      tenantId: input.tenantId,
      universeId: input.universeId,
      storyId: input.workId,
      objective: input.coding?.summary ?? input.action,
      files: input.coding?.files ?? [{
        path: 'services/ai/local-brain/README.md',
        action: 'modify',
        unifiedDiff: '--- a/services/ai/local-brain/README.md\n+++ b/services/ai/local-brain/README.md\n@@ sandbox note @@\n',
      }],
      testsExpected: input.coding?.testsExpected,
      cwd: input.coding?.cwd ?? root,
      approved: input.approved ?? true,
      root,
    });
    if (!coding.proposal.accepted) {
      recommendation = coding.proposal.reason;
    } else {
      evidenceRefs.push(`patch:${coding.proposal.proposal.id}`);
    }
    if (input.coding?.runGitStatus && input.coding.cwd) {
      const status = await runAllowedLocalCommand({ id: 'git_status', cwd: input.coding.cwd, timeoutMs: 8_000 });
      evidenceRefs.push(`git_status:${status.exitCode}`);
    }
  } else if (input.kind === 'research') {
    const research = await runResearchWorkcell({
      tenantId: input.tenantId,
      universeId: input.universeId,
      question: input.action,
      hypothesis: `${input.action} can be prepared locally first.`,
      consequence: input.consequence,
      root,
    });
    evidenceRefs.push(`research:${research.loop.job.id}:${research.loop.result.status}`);
    if (research.loop.job.state !== 'queued' && research.loop.job.state !== 'completed') {
      recommendation = research.loop.job.state.toUpperCase();
    }
  } else if (input.kind === 'quant') {
    const quant = await runQuantWorkcell({
      tenantId: input.tenantId,
      universeId: input.universeId,
      signals: input.quantSignals ?? [],
      root,
    });
    evidenceRefs.push(`quant:${quant.classical.recommendation}`);
    recommendation = quant.classical.recommendation;
  }

  await publishMeshEnvelope({
    idempotencyKey: `workcell:${input.workId}`,
    fromNodeId: input.localNodeId,
    toNodeId: route.targetNodeId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'workcell',
    body: `${input.kind} workcell ${input.action}`,
    evidenceRefs,
    workId: input.workId,
    root,
    now,
  });

  const learning = await appendLearning({
    domain: input.kind === 'quant' ? 'finance' : input.kind === 'coding' ? 'technology' : 'science',
    subject: `mesh-workcell:${input.kind}:${input.workId}`,
    claimState: 'MODEL_INFERENCE',
    summary: `${route.mode} on ${route.targetNodeId}; rec=${recommendation}; recruited=${recruitment.status}`,
    sourceRefs: evidenceRefs,
    evidence: evidenceRefs,
    taskId: input.workId,
  }, root);

  await completeConsequentialWork({
    workId: input.workId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    resultRef: `learn:${learning.id}`,
    root,
    now,
  });

  return {
    workId: input.workId,
    kind: input.kind,
    executedOnNodeId: route.targetNodeId,
    mode: route.mode,
    state: gate.executableByAgent ? 'PASS' : 'WAITING_DATA',
    duplicatePrevented: false,
    edgeLocalOnly: input.edgeMode === true,
    recommendation,
    evidenceRefs: [...evidenceRefs, `learn:${learning.id}`],
    productionAuthorization: false,
    tradingAuthorized: false,
    reason: route.reason,
  };
}
