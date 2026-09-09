import { conveneReflectionCouncil } from './reflection-council';
import { verifySecurity } from './security-verifier';
import { decisionGate, type ConsequenceClass } from './decision-gate';

export async function conveneAdversarialCouncil(input: {
  tenantId: string;
  universeId: string;
  question: string;
  candidateText?: string;
  consequence?: ConsequenceClass;
  production?: boolean;
  permissionChange?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const debate = await conveneReflectionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: `Adversarial review: ${input.question}`,
    root: input.root,
  });
  const security = verifySecurity({
    files: [{
      path: 'local-brain/executive-candidate.txt',
      content: input.candidateText ?? input.question,
    }],
  });
  const gate = decisionGate({
    id: `adv-${debate.id}`,
    action: input.question,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: input.permissionChange === true,
    externalPublication: false,
  });
  return {
    debate,
    security,
    gate,
    consensusForced: false as const,
    claimsToBeFounder: false as const,
    humanApprovalRequired: gate.humanApprovalRequired || !security.passed,
    productionAuthorization: false as const,
  };
}
