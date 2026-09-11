import { canPromoteLearning, planOfflineBrainCouncil } from './offline-brain-agent-council';

const ordinary = planOfflineBrainCouncil({
  mission: {
    missionId: 'mission-86-a',
    tenantId: 'tenant-1',
    objective: 'Improve offline brain retrieval quality',
    securityClass: 'ORDINARY',
    requestedRoles: ['LOCAL_ARCHITECT', 'OLLAMA_BUILDER', 'MEMORY_CURATOR', 'SECURITY_GUARDIAN', 'QA_REVIEWER', 'CLAUDE_REVIEWER'],
    evidenceRefs: ['receipt:mission-86-a'],
    humanApprovalRequired: true,
  },
  reviewerAdapters: [{
    adapterId: 'CLAUDE',
    status: 'VERIFIED',
    receiptRef: 'receipt:claude-review-adapter',
    networkRequired: true,
    privateDataAllowed: false,
    productionAuthority: false,
  }],
});
if (!ordinary.localFirst || ordinary.productionMutationAllowed || ordinary.cloudExecutionVerified) throw new Error('offline council guardrails');
if (!ordinary.seats.find((seat) => seat.role === 'CLAUDE_REVIEWER')?.enabled) throw new Error('verified minimized reviewer should be eligible');

const secret = planOfflineBrainCouncil({
  mission: {
    missionId: 'mission-86-b',
    tenantId: 'tenant-1',
    objective: 'Review top secret private memory',
    securityClass: 'TOP_SECRET',
    requestedRoles: ['SECURITY_GUARDIAN', 'ILM_REVIEWER', 'CLAUDE_REVIEWER'],
    evidenceRefs: ['receipt:mission-86-b'],
    humanApprovalRequired: true,
  },
  reviewerAdapters: [
    { adapterId: 'ILM', status: 'VERIFIED', receiptRef: 'receipt:ilm', networkRequired: true, privateDataAllowed: false, productionAuthority: false },
    { adapterId: 'CLAUDE', status: 'VERIFIED', receiptRef: 'receipt:claude', networkRequired: true, privateDataAllowed: false, productionAuthority: false },
  ],
});
if (secret.seats.some((seat) => (seat.role === 'ILM_REVIEWER' || seat.role === 'CLAUDE_REVIEWER') && seat.enabled)) throw new Error('TOP_SECRET external review must stay disabled');

if (!canPromoteLearning({ candidateId: 'learn-1', tenantId: 'tenant-1', securityClass: 'ORDINARY', evaluationScore: .95, evidenceRefs: ['receipt:eval'], humanApproved: true })) throw new Error('approved learning should promote');
if (canPromoteLearning({ candidateId: 'learn-2', tenantId: 'tenant-1', securityClass: 'TOP_SECRET', evaluationScore: .99, evidenceRefs: ['receipt:eval'], humanApproved: true })) throw new Error('TOP_SECRET must not promote to shared learning');
if (canPromoteLearning({ candidateId: 'learn-3', tenantId: 'tenant-1', securityClass: 'ORDINARY', evaluationScore: .99, evidenceRefs: ['receipt:eval'], humanApproved: false })) throw new Error('human approval required');

console.log('12D-86 offline brain agent council contracts: OK');
