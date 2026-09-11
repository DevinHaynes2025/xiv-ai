import { canBuildOnXiv } from './developer-contract-entitlement-gate';
import { verifiedCollectedRevenue } from './billing-vault-ledger';
import { usageChargeMicros } from './infrastructure-rental-meter';
import { validateSandbox } from './developer-offline-sandbox';
import { validateDeveloperCouncil } from './developer-agent-council';

const entitlement = {
  developerId: 'dev-1', tenantId: 'tenant-1', status: 'APPROVED' as const,
  contractReceipt: 'contract-1', legalReviewReceipt: 'legal-1', securityReviewReceipt: 'security-1',
  scopes: ['universe:build'], offlineBuildAllowed: true, productionPublishAllowed: false,
};
if (!canBuildOnXiv(entitlement)) throw new Error('approved developer should build');

const revenue = verifiedCollectedRevenue([{ id:'p1', tenantId:'tenant-1', kind:'PAYMENT_RECEIVED', amountCents:2500, currency:'USD', evidenceRefs:['processor-receipt'], approved:true, createdAt:new Date().toISOString() }]);
if (revenue !== 2500) throw new Error('revenue receipt mismatch');

if (usageChargeMicros({ tenantId:'tenant-1', developerId:'dev-1', resource:'API_CALLS', quantity:100, unitPriceMicros:10, receiptRef:'usage-1', measuredAt:new Date().toISOString() }) !== 1000) throw new Error('usage charge mismatch');

if (!validateSandbox({ sandboxId:'s1', tenantId:'tenant-1', developerId:'dev-1', mode:'OFFLINE', localhostOnly:true, productionMutationAllowed:false, allowedTools:['ollama'] })) throw new Error('sandbox invalid');

if (!validateDeveloperCouncil({ meetingId:'m1', tenantId:'tenant-1', topic:'SDK release', participants:['LEGAL','SECURITY'], votes:[{ role:'LEGAL', recommendation:'review', evidenceRefs:['e1'], confidence:.9 },{ role:'SECURITY', recommendation:'sandbox', evidenceRefs:['e2'], confidence:.8 }], humanApprovalRequired:true })) throw new Error('council invalid');

console.log('12D-81 developer ecosystem/contract/billing/infrastructure/council contracts: OK');
