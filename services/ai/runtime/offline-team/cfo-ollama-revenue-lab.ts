export type RevenueLabRole = 'CFO' | 'ACCOUNTANT' | 'PRICING_ANALYST' | 'COST_ANALYST' | 'REVENUE_OPERATIONS';

export interface RevenueLabTask {
  runId: string;
  tenantId: string;
  objective: string;
  facts: readonly string[];
  role: RevenueLabRole;
}

export interface RevenueLabPrompt {
  role: RevenueLabRole;
  model: string;
  prompt: string;
  productionMutationAllowed: false;
}

export const REVENUE_LAB_GUARDRAILS = {
  offlineFirst: true,
  defaultModel: 'qwen2.5-coder:7b',
  maxFactsPerPrompt: 128,
  moneyMovementAllowed: false,
  contractSigningAllowed: false,
  productionPricingMutationAllowed: false,
  guaranteesAllowed: false,
} as const;

const roleMission: Record<RevenueLabRole, string> = {
  CFO: 'Optimize durable revenue, margin, runway, and capital efficiency while challenging unsupported assumptions.',
  ACCOUNTANT: 'Check arithmetic, revenue recognition assumptions, cost categories, and evidence quality.',
  PRICING_ANALYST: 'Design pricing tiers, packaging, willingness-to-pay hypotheses, and sensitivity tests.',
  COST_ANALYST: 'Model fixed, variable, inference, storage, support, sales, and compliance costs.',
  REVENUE_OPERATIONS: 'Model funnel, conversion, churn, expansion, renewals, contracts, and operational bottlenecks.',
};

// Prompt construction only; the caller remains responsible for authorizing model execution.
export function buildRevenueLabPrompt(task: RevenueLabTask, model: string = REVENUE_LAB_GUARDRAILS.defaultModel): RevenueLabPrompt {
  if (!task.runId || !task.tenantId || !task.objective.trim()) throw new Error('revenue lab identity required');
  const facts = task.facts.slice(0, REVENUE_LAB_GUARDRAILS.maxFactsPerPrompt);
  const prompt = [
    `You are XIV ${task.role}, a local offline finance specialist.`,
    roleMission[task.role],
    'Treat forecasts as scenarios, not guarantees.',
    'Do not move money, sign contracts, change production pricing, or claim customers/revenue without evidence.',
    'Separate OBSERVED facts from ASSUMPTIONS and SIMULATIONS.',
    `Objective: ${task.objective}`,
    'Facts:',
    ...facts.map((fact) => `- ${fact}`),
    'Return: findings, assumptions challenged, calculations to verify, risks, and one bounded recommendation.',
  ].join('\n');
  return Object.freeze({ role: task.role, model, prompt, productionMutationAllowed: false });
}
