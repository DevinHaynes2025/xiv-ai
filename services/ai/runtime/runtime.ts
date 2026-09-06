import { createId, nowIso, statusForVerdict, type GovernedAction, type GovernedResult } from './actions';
import { createApprovalService, type ApprovalService } from './approval';
import { getXivAgent } from './agents';
import { getPrototypeAuditStore, type AuditStore } from './audit';
import type { BusinessContextProvider } from './context/provider';
import { createPrototypeContextProvider } from './context/prototype';
import { invokeApprovedTool } from './gateway';
import { evaluatePolicy, type PolicyInput, type RuntimeEnvironment } from './policy';
import { getRuntimeTool, isRuntimeToolId } from './tools';

export type GovernedRequest = {
  agentId: string;
  intent: string;
  toolId: string;
  environment?: RuntimeEnvironment;
  approved?: boolean;
};

export type AgentRuntimeOptions = {
  store?: AuditStore;
  context?: BusinessContextProvider;
  approval?: ApprovalService;
};

export type AgentRuntime = {
  request(input: GovernedRequest): GovernedResult;
  store: AuditStore;
  approval: ApprovalService;
};

function record(store: AuditStore, action: GovernedAction, note: string, verdict: GovernedResult['verdict']) {
  store.recordAction(action);
  store.record({
    eventId: createId('evt'),
    actionId: action.actionId,
    agentId: action.agentId,
    timestamp: nowIso(),
    verdict,
    toolId: action.toolId,
    note,
    status: action.status,
  });
}

function emptyResult(action: GovernedAction, verdict: GovernedResult['verdict'], recommendedActions: string[]): GovernedResult {
  return {
    ok: false,
    prototype: true,
    verdict,
    action,
    output: null,
    story: null,
    healthReport: null,
    recommendedActions,
  };
}

export function createAgentRuntime(options: AgentRuntimeOptions = {}): AgentRuntime {
  const store = options.store ?? getPrototypeAuditStore();
  const context = options.context ?? createPrototypeContextProvider();
  const approval = options.approval ?? createApprovalService(store);

  return {
    store,
    approval,
    request(input) {
      const started = Date.now();
      const policyInput: PolicyInput = {
        agentId: input.agentId,
        toolId: input.toolId,
        environment: input.environment,
        approved: input.approved,
      };
      const decision = evaluatePolicy(policyInput);
      const agent = getXivAgent(input.agentId);
      const tool = getRuntimeTool(input.toolId);
      const authorityLevel = decision.authorityLevel ?? agent?.defaultAuthority ?? 'L0';
      const { status, approvalStatus } = statusForVerdict(decision.verdict);

      const action: GovernedAction = {
        actionId: createId('act'),
        agentId: input.agentId,
        timestamp: nowIso(),
        authorityLevel,
        intent: input.intent,
        toolId: input.toolId,
        riskLevel: tool?.riskLevel ?? 'high',
        status,
        approvalStatus,
        reason: decision.reason,
        inputSummary: input.intent,
        outputSummary: '',
        error: decision.verdict === 'denied' ? decision.reason : null,
        durationMs: 0,
      };

      if (decision.verdict === 'requires_approval') {
        if (!tool?.requiresApproval) {
          action.status = 'denied';
          action.approvalStatus = 'denied';
          action.error = 'Policy asked for approval, but the tool is not approval-gated.';
          action.durationMs = Date.now() - started;
          record(store, action, action.error, 'denied');
          return emptyResult(action, 'denied', ['Only tools marked requiresApproval can enter awaiting_approval.']);
        }
        action.approval = approval.open(action);
        action.outputSummary = decision.reason;
        action.durationMs = Date.now() - started;
        record(store, action, decision.reason, 'requires_approval');
        return {
          ok: false,
          prototype: true,
          verdict: 'requires_approval',
          action,
          output: null,
          story: null,
          healthReport: null,
          recommendedActions: ['A human must approve. Approval will be re-checked by policy and still cannot execute a production write.'],
        };
      }

      if (decision.verdict !== 'allowed') {
        action.outputSummary = decision.reason;
        action.durationMs = Date.now() - started;
        record(store, action, decision.reason, decision.verdict);
        return emptyResult(action, decision.verdict, ['No tool ran. Review agent allowlists and authority before retrying.']);
      }

      if (!isRuntimeToolId(input.toolId)) {
        action.status = 'failed';
        action.error = 'Tool passed policy but is not a runtime tool id.';
        action.durationMs = Date.now() - started;
        record(store, action, action.error, 'denied');
        return emptyResult(action, 'denied', ['Use a registered Phase 2B tool.']);
      }

      action.status = 'running';
      const invoked = invokeApprovedTool(
        { toolId: input.toolId, agentId: input.agentId, intent: input.intent },
        context,
      );

      action.status = 'completed';
      action.outputSummary = invoked.summary;
      action.durationMs = Date.now() - started;
      record(store, action, invoked.summary, 'allowed');

      return {
        ok: true,
        prototype: true,
        verdict: 'allowed',
        action,
        output: invoked.output,
        story: invoked.story,
        healthReport: invoked.healthReport,
        recommendedActions: ['Use this result as observation only. Do not treat it as a production instruction.'],
      };
    },
  };
}

const defaultRuntime = createAgentRuntime();

export function getDefaultAgentRuntime() {
  return defaultRuntime;
}

export function runGovernedRequest(input: GovernedRequest): GovernedResult {
  return defaultRuntime.request(input);
}

export function analyzeBusinessHealth(): GovernedResult {
  return runGovernedRequest({
    agentId: 'operations',
    toolId: 'diagnostic_story_builder',
    intent: 'Analyze current business health',
    environment: 'prototype',
  });
}

export function proposeOperationalChange(): GovernedResult {
  return runGovernedRequest({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    intent: 'Propose a six-hour recovery window for the two sample warehouses off SLA.',
    environment: 'prototype',
  });
}

export function analyzeSupplyChain(): GovernedResult {
  return runGovernedRequest({
    agentId: 'supply_chain',
    toolId: 'business_health_analyzer',
    intent: 'Read supply chain findings',
    environment: 'prototype',
  });
}

export function analyzeOperations(): GovernedResult {
  return runGovernedRequest({
    agentId: 'operations',
    toolId: 'diagnostic_story_builder',
    intent: 'Build an operations diagnostic story',
    environment: 'prototype',
  });
}

export function summarizeExecutiveHealth(): GovernedResult {
  return runGovernedRequest({
    agentId: 'executive',
    toolId: 'business_health_report',
    intent: 'Summarize business health across domains',
    environment: 'prototype',
  });
}
