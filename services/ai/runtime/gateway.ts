import type { ExecutiveBrief } from './brief';
import type { BusinessContextProvider } from './context/provider';
import { createPrototypeContextProvider } from './context/prototype';
import { findingsForDomain } from './context/report';
import type { BusinessHealthReport } from './context/report';
import { buildDiagnosticStory, buildNarrative } from './context/story';
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
  healthReport: BusinessHealthReport | null;
  brief: ExecutiveBrief | null;
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
      healthReport: null,
      brief: null,
      output: { context },
    };
  },
  business_health_analyzer: (input, provider) => {
    const report = provider.getBusinessHealthReport();
    const domain = input.agentId === 'supply_chain' ? 'supply_chain' : undefined;
    const findings = domain ? findingsForDomain(report, domain) : report.findings;
    return {
      prototype: true,
      toolId: input.toolId,
      summary: report.narrativeSummary,
      story: null,
      healthReport: report,
      brief: null,
      output: { report, findings, source: report.dataStatus ?? 'prototype_sample' },
    };
  },
  operations_signal_reader: (input, provider) => {
    const operations = provider.getOperationalSignals();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: 'Read sample operations signals. No ERP, WMS, or TMS is connected.',
      story: null,
      healthReport: null,
      brief: null,
      output: { operations, source: 'prototype_sample' },
    };
  },
  risk_summarizer: (input, provider) => {
    const report = provider.getBusinessHealthReport();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: `Sample risks: ${report.topRisks.join(' ')} Confidence is low; evidence is prototype.`,
      story: null,
      healthReport: report,
      brief: null,
      output: { risks: report.topRisks, evidenceQuality: 'sample' },
    };
  },
  recommendation_generator: (input, provider) => {
    const next = provider.getBusinessContext().businessHealth.opportunities[0] ?? 'Review the diagnostic with a human.';
    return {
      prototype: true,
      toolId: input.toolId,
      summary: `Prototype recommendation: ${next} Nothing was executed.`,
      story: null,
      healthReport: null,
      brief: null,
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
      healthReport: null,
      brief: null,
      output: {
        intent: input.intent,
        hospitalLoop: ['diagnose'],
        finding: context.businessHealth.summary,
        sourceLabels: context.system.sourceLabels,
      },
    };
  },
  diagnostic_story_builder: (input, provider) => {
    const context = provider.getBusinessContext();
    const report = provider.getBusinessHealthReport();
    const finding = report.findings.find((item) => item.domain === 'operations') ?? report.findings[0];
    const story = buildDiagnosticStory(context, finding);
    return {
      prototype: true,
      toolId: input.toolId,
      summary: story.whatHappened,
      story,
      healthReport: report,
      brief: null,
      output: { story, narrative: buildNarrative(finding) },
    };
  },
  business_health_report: (input, provider) => {
    const report = provider.getBusinessHealthReport();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: report.narrativeSummary,
      story: null,
      healthReport: report,
      brief: null,
      output: { report, source: report.dataStatus ?? 'prototype_sample' },
    };
  },
  company_data_reader: (input, provider) => {
    const availability = provider.getDataAvailability();
    const report = provider.getBusinessHealthReport();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: availability.message,
      story: null,
      healthReport: report,
      brief: null,
      output: {
        availability,
        via: 'company_data_gateway_required',
        usedPrototypeFallback: false,
        adapterCalledDirectly: false,
      },
    };
  },
  executive_brief_builder: (input, provider) => {
    const brief = provider.getExecutiveBrief();
    const report = provider.getBusinessHealthReport();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: `Executive Intelligence Brief · ${brief.dataStatus}`,
      story: null,
      healthReport: report,
      brief,
      output: { brief, financialImpactClaimed: false },
    };
  },
  health_status_reader: (input, provider) => {
    const system = provider.getSystemContext();
    return {
      prototype: true,
      toolId: input.toolId,
      summary: 'Registered health signals were read. Guardian is not continuously monitoring.',
      story: null,
      healthReport: null,
      brief: null,
      output: { system, continuousMonitoring: false },
    };
  },
  development_health_checker: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Guardian accepts registered check IDs only. The agent cannot pass a raw command.',
    story: null,
    healthReport: null,
    brief: null,
    output: { executed: false, reason: 'Trusted host runner is not invoked from the agent gateway.' },
  }),
  propose_operational_change: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Gateway refused to execute a consequential tool.',
    story: null,
    healthReport: null,
    brief: null,
    output: { executed: false, intent: input.intent },
  }),
  human_only_production_change: (input) => ({
    prototype: true,
    toolId: input.toolId,
    summary: 'Gateway refused a human-only tool.',
    story: null,
    healthReport: null,
    brief: null,
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
