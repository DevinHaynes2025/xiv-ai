import { planOfflineBrainCouncil } from './offline-brain-agent-council';
import { OfflineBrainExecutionLedger, summarizeCouncilExecution } from './offline-brain-execution-ledger';

const plan = planOfflineBrainCouncil({
  mission: {
    missionId: 'mission-87',
    tenantId: 'tenant-1',
    objective: 'Run bounded offline brain council',
    securityClass: 'ORDINARY',
    requestedRoles: ['LOCAL_ARCHITECT', 'OLLAMA_BUILDER', 'MEMORY_CURATOR', 'SECURITY_GUARDIAN'],
    evidenceRefs: ['receipt:mission-87'],
    humanApprovalRequired: true,
  },
});

const ledger = new OfflineBrainExecutionLedger({ tenantId: 'tenant-1', missionId: 'mission-87' });
const roles = ['LOCAL_ARCHITECT', 'OLLAMA_BUILDER', 'MEMORY_CURATOR', 'SECURITY_GUARDIAN'] as const;
const receipts = roles.map((role, index) => ({
  receiptId: `receipt-${index + 1}`,
  missionId: 'mission-87',
  tenantId: 'tenant-1',
  role,
  securityClass: 'ORDINARY' as const,
  outputHash: `hash-${index + 1}`,
  evidenceRefs: [`evidence-${index + 1}`],
  localExecution: true,
  createdAt: new Date(1_700_000_000_000 + index).toISOString(),
}));
for (const receipt of receipts) ledger.append(receipt);
if (!ledger.verify()) throw new Error('execution ledger hash chain must verify');
const summary = summarizeCouncilExecution(plan, receipts);
if (!summary.complete || summary.rawOutputsPersisted || summary.productionMutationAllowed) throw new Error('execution summary guardrails');

let crossTenantRejected = false;
try {
  ledger.append({ ...receipts[0], receiptId: 'bad-tenant', tenantId: 'tenant-2' });
} catch {
  crossTenantRejected = true;
}
if (!crossTenantRejected) throw new Error('cross-tenant receipt must be rejected');

let secretExternalRejected = false;
try {
  ledger.append({ ...receipts[0], receiptId: 'bad-external', role: 'CLAUDE_REVIEWER', securityClass: 'TOP_SECRET', localExecution: false });
} catch {
  secretExternalRejected = true;
}
if (!secretExternalRejected) throw new Error('TOP_SECRET external reviewer receipt must be rejected');

const incomplete = summarizeCouncilExecution(plan, receipts.slice(0, 2));
if (incomplete.complete || incomplete.missingRoles.length !== 2) throw new Error('missing council seats must be visible');

console.log('12D-87 offline brain execution ledger contracts: OK');
