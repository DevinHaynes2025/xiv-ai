import crypto from 'node:crypto';
import type { ExecutiveResponse } from './executive-cabinet-ollama-runner';

export type ExecutiveDecisionPacket = {
  objective: string;
  recommendations: ExecutiveResponse[];
  dissent: ExecutiveResponse[];
  unresolvedRisks: string[];
  requiresHumanApproval: boolean;
  packetHash: string;
};

export function buildExecutiveDecisionPacket(objective: string, responses: ExecutiveResponse[]): ExecutiveDecisionPacket {
  if (!responses.length) throw new Error('CABINET_RESPONSES_REQUIRED');
  const dissent = responses.filter(r => /challenge|disagree|risk|concern/i.test(`${r.recommendation} ${r.challenge}`));
  const unresolvedRisks = responses.map(r => r.risk).filter(Boolean);
  const payload = JSON.stringify({objective,responses,dissent: dissent.map(d=>d.role),unresolvedRisks});
  return {
    objective,
    recommendations: responses,
    dissent,
    unresolvedRisks,
    requiresHumanApproval: true,
    packetHash: crypto.createHash('sha256').update(payload).digest('hex'),
  };
}
