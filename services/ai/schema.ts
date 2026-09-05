import type { AgentRiskLevel, StructuredAgentOutput } from './types';

const RISK_LEVELS: readonly AgentRiskLevel[] = ['low', 'medium', 'high', 'critical'];

export const EXECUTIVE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: 'Short business-health summary.' },
    recommendation: { type: 'STRING', description: 'The next recommended action.' },
    riskLevel: {
      type: 'STRING',
      enum: [...RISK_LEVELS],
      description: 'Risk of acting on the recommendation.',
    },
    requiresApproval: { type: 'BOOLEAN', description: 'Whether a human must approve before any next step.' },
    evidence: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Short evidence bullets. Use mock context when live metrics are unavailable.',
    },
    proposedAction: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', description: 'Action type label, not an executable tool.' },
        description: { type: 'STRING', description: 'What would be simulated if approved.' },
      },
    },
  },
  required: ['summary', 'recommendation', 'riskLevel', 'requiresApproval', 'evidence'],
} as const;

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function asRisk(value: unknown): AgentRiskLevel {
  return RISK_LEVELS.includes(value as AgentRiskLevel) ? (value as AgentRiskLevel) : 'medium';
}

export function parseStructuredOutput(raw: unknown): StructuredAgentOutput {
  if (!raw || typeof raw !== 'object') {
    throw Object.assign(new Error('malformed'), { code: 'malformed' });
  }

  const body = raw as Record<string, unknown>;
  const evidenceRaw = body.evidence;
  const evidence = Array.isArray(evidenceRaw)
    ? evidenceRaw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  const proposedRaw = body.proposedAction;
  const proposedAction =
    proposedRaw && typeof proposedRaw === 'object'
      ? {
          type: asString((proposedRaw as Record<string, unknown>).type),
          description: asString((proposedRaw as Record<string, unknown>).description),
        }
      : undefined;

  const parsed: StructuredAgentOutput = {
    summary: asString(body.summary),
    recommendation: asString(body.recommendation),
    riskLevel: asRisk(body.riskLevel),
    requiresApproval: Boolean(body.requiresApproval),
    evidence,
    proposedAction: proposedAction?.type || proposedAction?.description ? proposedAction : undefined,
  };

  if (!parsed.summary.trim() || !parsed.recommendation.trim()) {
    throw Object.assign(new Error('malformed'), { code: 'malformed' });
  }

  return parsed;
}

export function parseStructuredJsonText(text: string): StructuredAgentOutput {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return parseStructuredOutput(JSON.parse(trimmed) as unknown);
  } catch (caught) {
    if (caught && typeof caught === 'object' && 'code' in caught && (caught as { code?: string }).code === 'malformed') {
      throw caught;
    }
    throw Object.assign(new Error('malformed'), { code: 'malformed' });
  }
}
