import type { RuntimeToolId } from './tools';

export type ToolInvokeInput = {
  toolId: RuntimeToolId;
  agentId: string;
  intent: string;
};

export type ToolInvokeResult = {
  prototype: true;
  toolId: RuntimeToolId;
  output: Record<string, unknown>;
  summary: string;
};

export type ToolHandler = (input: ToolInvokeInput) => ToolInvokeResult;

const PROTOTYPE_HANDLERS: Record<RuntimeToolId, ToolHandler> = {
  business_context_reader: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Prototype business context was read. No live system was queried.',
    output: {
      source: 'prototype_context',
      loop: ['sense', 'understand'],
      note: 'Synthetic operating context only.',
    },
  }),
  health_status_reader: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Registered health signals were read. Guardian is not continuously monitoring.',
    output: {
      continuousMonitoring: false,
      source: 'registry',
    },
  }),
  recommendation_generator: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'A prototype recommendation was drafted. Nothing was executed.',
    output: {
      recommendation: 'Review the diagnostic summary with a human before any operational change.',
      executable: false,
    },
  }),
  diagnostic_summarizer: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Prototype diagnostic: business health can be reviewed, not treated automatically.',
    output: {
      intent: input.intent,
      hospitalLoop: ['diagnose'],
      finding: 'This is a governed prototype diagnosis, not a live operational readout.',
      next: 'Human review is required before Treat or Execute.',
    },
  }),
  development_health_checker: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Guardian check registry is available. Allowlisted commands were not executed.',
    output: {
      executed: false,
      reason: 'Phase 2A uses the check registry and prototype runner only.',
    },
  }),
  propose_operational_change: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Gateway refused to execute a consequential tool.',
    output: { executed: false, intent: input.intent },
  }),
  human_only_production_change: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Gateway refused a human-only tool.',
    output: { executed: false, intent: input.intent },
  }),
};

/**
 * Tools can only run after policy allows them. The gateway never
 * accepts an arbitrary tool id from a model.
 */
export function invokeApprovedTool(input: ToolInvokeInput): ToolInvokeResult {
  const handler = PROTOTYPE_HANDLERS[input.toolId];
  if (!handler) {
    throw new Error('Tool handler is not registered.');
  }
  return handler(input);
}
