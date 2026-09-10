import { createHash } from 'node:crypto';
import { buildRevenueLabPrompt, type RevenueLabRole } from './cfo-ollama-revenue-lab';
import { decideRevenueCouncil, type RevenueLabPosition } from './revenue-lab-council';
import { buildTrainingLedger, type TrainingEvaluation } from './training-evaluation-ledger';

export const REVENUE_LAB_ROLES: readonly RevenueLabRole[] = Object.freeze(['CFO','ACCOUNTANT','PRICING_ANALYST','COST_ANALYST','REVENUE_OPERATIONS']);

export interface RevenueLabRunResult {
  runId: string;
  model: string;
  positions: readonly RevenueLabPosition[];
  council: ReturnType<typeof decideRevenueCouncil>;
  training: ReturnType<typeof buildTrainingLedger>;
  outputHash: string;
}

export async function runRevenueLab(input: {
  runId: string;
  tenantId: string;
  objective: string;
  facts: readonly string[];
  model?: string;
  generate: (model: string, prompt: string) => Promise<string>;
}): Promise<RevenueLabRunResult> {
  const positions: RevenueLabPosition[] = [];
  const evaluations: TrainingEvaluation[] = [];

  for (const role of REVENUE_LAB_ROLES) {
    const request = buildRevenueLabPrompt({ runId: input.runId, tenantId: input.tenantId, objective: input.objective, facts: input.facts, role }, input.model);
    const response = await input.generate(request.model, request.prompt);
    const evidence = `OLLAMA:${request.model}:${createHash('sha256').update(response).digest('hex')}`;
    positions.push(Object.freeze({ role, response, confidence: 0.6, evidenceRefs: Object.freeze([evidence]), objections: Object.freeze([]) }));
    evaluations.push(Object.freeze({
      evaluationId: `${input.runId}:${role}`,
      runId: input.runId,
      agentRole: role,
      skill: 'finance-reasoning',
      score: response.trim().length > 0 ? 0.6 : 0,
      evidenceRefs: Object.freeze([evidence]),
      lesson: 'Preserve assumptions, calculations, risks, and evidence in the next finance round.',
      createdAt: new Date().toISOString(),
    }));
  }

  const council = decideRevenueCouncil(positions);
  const training = buildTrainingLedger(evaluations);
  const outputHash = createHash('sha256').update(JSON.stringify({ positions, council, training })).digest('hex');
  return Object.freeze({ runId: input.runId, model: input.model ?? 'qwen2.5-coder:7b', positions: Object.freeze(positions), council, training, outputHash });
}
