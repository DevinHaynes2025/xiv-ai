import crypto from 'node:crypto';

export const EXECUTIVE_ROLES = [
  'FOUNDER_TWIN','COO','CTO','CFO','CISO','CHIEF_PRODUCT','CHIEF_DATA','CHIEF_AI','CHIEF_PEOPLE','CHIEF_REVENUE','GENERAL_COUNSEL_RISK','SUPPLY_CHAIN_OPERATIONS'
] as const;
export type ExecutiveRole = typeof EXECUTIVE_ROLES[number];

export type ExecutiveResponse = { role: ExecutiveRole; recommendation: string; risk: string; challenge: string; evidenceRefs: string[]; hash: string };

export const CABINET_GUARDRAILS = Object.freeze({
  localFirst: true,
  autonomousProductionMutation: false,
  autonomousMoneyMovement: false,
  autonomousContractSignature: false,
  topSecretPromptingAllowed: false,
  preserveDissent: true,
  humanApprovalForConsequentialActions: true,
});

export function buildExecutivePrompt(role: ExecutiveRole, objective: string, evidenceRefs: string[] = []): string {
  return [
    `You are the XIV AI ${role} agent running locally through Ollama.`,
    `Objective: ${objective}`,
    `Evidence refs: ${evidenceRefs.join(', ') || 'none'}`,
    'Return: recommendation, primary risk, one challenge to another executive role, and evidence needed.',
    'Do not claim tests, revenue, security, hardware, cloud deployment, or facts without evidence.',
    'Do not expose secrets, sign contracts, move money, deploy production, or bypass tenant boundaries.'
  ].join('\n');
}

export async function runCabinetRound(args: {
  objective: string;
  model?: string;
  endpoint?: string;
  evidenceRefs?: string[];
  fetchImpl?: typeof fetch;
}): Promise<ExecutiveResponse[]> {
  const endpoint = args.endpoint ?? 'http://127.0.0.1:11434';
  const model = args.model ?? 'qwen2.5-coder:7b';
  const f = args.fetchImpl ?? fetch;
  const results: ExecutiveResponse[] = [];
  for (const role of EXECUTIVE_ROLES) {
    const prompt = buildExecutivePrompt(role, args.objective, args.evidenceRefs ?? []);
    const res = await f(`${endpoint}/api/generate`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({model,prompt,stream:false}) });
    if (!res.ok) throw new Error(`OLLAMA_${res.status}_${role}`);
    const data = await res.json() as { response?: string };
    const text = String(data.response ?? '').trim();
    results.push({ role, recommendation: text, risk: 'PARSE_FROM_RESPONSE', challenge: 'PARSE_FROM_RESPONSE', evidenceRefs: args.evidenceRefs ?? [], hash: crypto.createHash('sha256').update(`${role}\n${text}`).digest('hex') });
  }
  return results;
}
