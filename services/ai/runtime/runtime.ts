import { createId, nowIso, statusForVerdict, type GovernedAction, type GovernedResult } from './actions';
import { getXivAgent } from './agents';
import { getPrototypeAuditStore, type AuditStore } from './audit';
import { invokeApprovedTool } from './gateway';
import { evaluatePolicy, type PolicyInput, type RuntimeEnvironment } from './policy';
import { isRuntimeToolId } from './tools';

export type GovernedRequest = {
  agentId: string;
  intent: string;
  toolId: string;
  environment?: RuntimeEnvironment;
  approved?: boolean;
};

export type AgentRuntime = {
  request(input: GovernedRequest): GovernedResult;
};

function record(store: AuditStore, action: GovernedAction, note: string, verdict: GovernedResult['verdict']) {
  store.recordAction(action);
  store.record({
    eventId: createId('evt'),
    actionId: action.actionId,
    agentId: action.agentId,
    timestamp: action.timestamp,
    verdict,
    toolId: action.toolId,
    note,
  });
}

export function createAgentRuntime(store: AuditStore = getPrototypeAuditStore()): AgentRuntime {
  return {
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
      const authorityLevel = decision.authorityLevel ?? agent?.defaultAuthority ?? 'L0';
      const { status, approvalStatus } = statusForVerdict(decision.verdict);

      const action: GovernedAction = {
        actionId: createId('act'),
        agentId: input.agentId,
        timestamp: nowIso(),
        authorityLevel,
        intent: input.intent,
        toolId: input.toolId,
        status,
        approvalStatus,
        reason: decision.reason,
        inputSummary: input.intent,
        outputSummary: '',
        error: decision.verdict === 'denied' ? decision.reason : null,
        durationMs: 0,
      };

      if (decision.verdict !== 'allowed') {
        action.outputSummary = decision.reason;
        action.durationMs = Date.now() - started;
        record(store, action, decision.reason, decision.verdict);
        return {
          ok: false,
          prototype: true,
          verdict: decision.verdict,
          action,
          output: null,
          recommendedActions:
            decision.verdict === 'requires_approval'
              ? ['A human must approve before any consequential step. Guardian will not auto-apply the change.']
              : ['No tool ran. Review agent allowlists and authority before retrying.'],
        };
      }

      if (!isRuntimeToolId(input.toolId)) {
        action.status = 'failed';
        action.error = 'Tool passed policy but is not a runtime tool id.';
        action.durationMs = Date.now() - started;
        record(store, action, action.error, 'denied');
        return {
          ok: false,
          prototype: true,
          verdict: 'denied',
          action,
          output: null,
          recommendedActions: ['Use a registered Phase 2A tool.'],
        };
      }

      action.status = 'running';
      const invoked = invokeApprovedTool({
        toolId: input.toolId,
        agentId: input.agentId,
        intent: input.intent,
      });

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
        recommendedActions: ['Use this result as observation only. Do not treat it as a production instruction.'],
      };
    },
  };
}

const defaultRuntime = createAgentRuntime();

export function runGovernedRequest(input: GovernedRequest): GovernedResult {
  return defaultRuntime.request(input);
}

export function analyzeBusinessHealth(): GovernedResult {
  return runGovernedRequest({
    agentId: 'operations',
    toolId: 'diagnostic_summarizer',
    intent: 'Analyze current business health',
    environment: 'prototype',
  });
}
