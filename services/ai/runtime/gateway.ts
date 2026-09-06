import type { BusinessContextProvider } from './context/provider';
import { createPrototypeContextProvider } from './context/prototype';
import { buildDiagnosticStory } from './context/story';
import type { DiagnosticStory } from './context/types';
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
  story: DiagnosticStory | null;
};

export type ToolHandler = (input: ToolInvokeInput, provider: BusinessContextProvider) => ToolInvokeResult;

const PROTOTYPE_HANDLERS: Record<RuntimeToolId, ToolHandler> = {
  business_context_reader: (input, provider) => {
    const context = provider.getBusinessContext();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: `Read prototype context for ${context.organization.name}. Sources: ${context.system.sourceLabels.join(', ')}.`,
      story: null,
      output: { context },
    };
  },
  business_health_analyzer: (input, provider) => {
    const health = provider.getBusinessContext().businessHealth;
    return {
      prototype: true,
      toolId: input.toolId,
      summary: `Sample business health is ${health.status} (${health.score}). ${health.summary}`,
      story: null,
      output: { health, source: 'prototype_sample' },
    };
  },
  operations_signal_reader: (input, provider) => {
    const operations = provider.getOperationalSignals();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: 'Read sample operations signals. No ERP, WMS, or TMS is connected.',
      story: null,
      output: { operations, source: 'prototype_sample' },
    };
  },
  risk_summarizer: (input, provider) => {
    const health = provider.getBusinessContext().businessHealth;
    return {
      prototype: true,
      toolId: input.toolId,
      summary: `Sample risks: ${health.risks.join(' ')} Confidence is low; evidence is prototype.`,
      story: null,
      output: { risks: health.risks, evidenceQuality: 'sample' },
    };
  },
  recommendation_generator: (input, provider) => {
    const next = provider.getBusinessContext().businessHealth.opportunities[0] ?? 'Review the diagnostic with a human.';
    return {
      prototype: true,
      toolId: input.toolId,
      summary: `Prototype recommendation: ${next} Nothing was executed.`,
      story: null,
      output: { recommendation: next, executable: false },
    };
  },
  diagnostic_summarizer: (input, provider) => {
    const context = provider.getBusinessContext();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: `Prototype diagnostic for ${context.organization.name}: ${context.businessHealth.summary}`,
      story: null,
      output: {
        intent: input.intent,
        hospitalLoop: ['diagnose'],
        finding: context.businessHealth.summary,
        sourceLabels: context.system.sourceLabels,
      },
    };
  },
  diagnostic_story_builder: (input, provider) => {
    const story = buildDiagnosticStory(provider.getBusinessContext());
    return {
      prototype: true,
      toolId: input.toolId,
      summary: story.whatHappened,
      story,
      output: { story },
    };
  },
  health_status_reader: (input, provider) => {
    const system = provider.getSystemContext();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: 'Registered health signals were read. Guardian is not continuously monitoring.',
      story: null,
      output: { system, continuousMonitoring: false },
    };
  },
  development_health_checker: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Guardian check registry is available. Allowlisted commands were not executed.',
    story: null,
    output: { executed: false, reason: 'Host TypeScript/lint/expo-doctor execution is not wired.' },
  }),
  propose_operational_change: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Gateway refused to execute a consequential tool.',
    story: null,
    output: { executed: false, intent: input.intent },
  }),
  human_only_production_change: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Gateway refused a human-only tool.',
    story: null,
    output: { executed: false, intent: input.intent },
  }),
};

export function invokeApprovedTool(
  input: ToolInvokeInput,
  provider: BusinessContextProvider = createPrototypeContextProvider(),
): ToolInvokeResult {
  const handler = PROTOTYPE_HANDLERS[input.toolId];
  if (!handler) {
    throw new Error('Tool handler is not registered.');
  }
  return handler(input, provider);
}
