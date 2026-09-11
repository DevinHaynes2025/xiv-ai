import { buildCollaborationPlan, canPromoteReasoningPathway } from './local-model-collaboration-bus';
const nowMs = Date.parse('2026-09-11T23:00:00.000Z');
const bound = { tenantId: 'tenant-1', verifiedAt: new Date(nowMs).toISOString(), expiresAt: new Date(nowMs + 120_000).toISOString() };
const receipts = [
  { ...bound, collaboratorId: 'OLLAMA_LOCAL' as const, status: 'VERIFIED' as const, receiptRef: 'receipt:ollama-local',
    endpoint: 'http://127.0.0.1:11434', providerId: 'ollama', modelId: 'qwen2.5-coder:7b', deviceLocalCli: true,
    modelExecutionLocal: true, productionAuthority: false as const, rawPrivateDataAllowed: true },
  { ...bound, collaboratorId: 'CLAUDE_CODE_LOCAL' as const, status: 'VERIFIED' as const, receiptRef: 'receipt:claude-code-cli',
    providerId: 'fixture-provider', modelId: 'fixture-review-model', deviceLocalCli: true,
    modelExecutionLocal: false, productionAuthority: false as const, rawPrivateDataAllowed: false },
];
const ordinary = buildCollaborationPlan({ nowMs, networkAvailable: true,
  task: { taskId: 'task-88-a', tenantId: 'tenant-1', objective: 'Review and improve agent pathway orchestration',
    kind: 'ARCHITECTURE', securityClass: 'ORDINARY', evidenceRefs: ['receipt:task-88-a'], humanApprovalRequired: true, externalReviewApproved: true },
  collaboratorReceipts: receipts });
if (!ordinary.assignments.find(a => a.collaboratorId === 'OLLAMA_LOCAL')?.enabled) throw new Error('ollama should be enabled');
if (!ordinary.assignments.find(a => a.collaboratorId === 'CLAUDE_CODE_LOCAL')?.enabled) throw new Error('claude should be enabled for ordinary minimized review');
if (ordinary.productionMutationAllowed || ordinary.autonomousDeployAllowed || ordinary.modelWeightMutationAllowed) throw new Error('guardrails violated');
const confidential = buildCollaborationPlan({ nowMs,
  task: { taskId: 'task-88-b', tenantId: 'tenant-1', objective: 'Review private company-brain routing', kind: 'REVIEW',
    securityClass: 'CONFIDENTIAL', evidenceRefs: ['receipt:task-88-b'], humanApprovalRequired: true }, collaboratorReceipts: receipts });
if (confidential.assignments.find(a => a.collaboratorId === 'CLAUDE_CODE_LOCAL')?.enabled) throw new Error('confidential Claude review must be disabled by default');
const secret = buildCollaborationPlan({ nowMs,
  task: { taskId: 'task-88-c', tenantId: 'tenant-1', objective: 'Reason over top secret memory locally', kind: 'REASON',
    securityClass: 'TOP_SECRET', evidenceRefs: ['receipt:task-88-c'], humanApprovalRequired: true }, collaboratorReceipts: receipts });
if (secret.assignments.find(a => a.collaboratorId === 'CLAUDE_CODE_LOCAL')?.enabled) throw new Error('TOP_SECRET Claude review must be disabled');
if (!canPromoteReasoningPathway({ pathwayId: 'path-1', tenantId: 'tenant-1', evaluationScore: .96, evidenceRefs: ['e1'], independentReviewRefs: ['r1','r2'], securityClass: 'ORDINARY', humanApproved: true })) throw new Error('high quality reviewed pathway should promote');
if (canPromoteReasoningPathway({ pathwayId: 'path-2', tenantId: 'tenant-1', evaluationScore: .99, evidenceRefs: ['e1'], independentReviewRefs: ['r1'], securityClass: 'ORDINARY', humanApproved: true })) throw new Error('two independent reviews required');
if (canPromoteReasoningPathway({ pathwayId: 'path-3', tenantId: 'tenant-1', evaluationScore: .99, evidenceRefs: ['e1'], independentReviewRefs: ['r1','r2'], securityClass: 'TOP_SECRET', humanApproved: true })) throw new Error('TOP_SECRET must not promote to shared pathway');
console.log('12D-88 local model collaboration contracts: OK');
