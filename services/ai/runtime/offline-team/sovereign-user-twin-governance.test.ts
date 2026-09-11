import { createSovereignUserTwin, SOVEREIGN_TWIN_GUARDRAILS } from './sovereign-user-twin';
import { isPolicyActive } from './consent-legal-policy-engine';
import { canReadFinancialData, FINANCIAL_VAULT_GUARDRAILS } from './financial-vault-governance';
import { canAccessDataRoomObject } from './private-data-room';
import { canListAvatar } from './avatar-marketplace-governance';

const twin = createSovereignUserTwin({
  tenantId: 'tenant-a', userId: 'user-a', genomeId: 'genome-a', learningMode: 'LOCAL_ONLY',
  permissions: ['FILES'], consentReceiptIds: ['consent:1'], cloudSync: 'DISABLED', confidence: 0.6,
});
if (!twin.localMemoryNamespace.includes('tenant-a/user-a')) throw new Error('isolated namespace missing');
if (SOVEREIGN_TWIN_GUARDRAILS.silentGlobalDataMiningAllowed) throw new Error('silent data mining must be blocked');

if (!isPolicyActive({ receiptId:'r1', tenantId:'tenant-a', userId:'user-a', scope:'PRIVACY', jurisdiction:'US-TX', policyVersion:'1', acceptedAt:new Date().toISOString(), legalReviewStatus:'APPROVED' })) throw new Error('approved policy should be active');
if (canReadFinancialData({ tenantId:'tenant-a', userId:'user-a', provider:'bank-api', connectionStatus:'SUPPORTED_API', capabilities:['READ_BALANCES'], humanApprovalRequired:true })) throw new Error('financial data must require user authorization');
if (!FINANCIAL_VAULT_GUARDRAILS.humanApprovalRequiredForConsequentialActions) throw new Error('human approval guardrail missing');
if (!canAccessDataRoomObject({ objectId:'o1', tenantId:'tenant-a', ownerUserId:'user-a', classification:'CONFIDENTIAL', encrypted:true, contentHash:'sha256:x', storageRef:'local://o1', accessPrincipals:['user-a'], provenanceRefs:['p1'] }, 'user-a')) throw new Error('authorized encrypted access failed');
if (!canListAvatar({ listingId:'l1', ownerUserId:'user-a', avatarId:'a1', rightsBasis:'SELF_OWNED', consentReceiptId:'c1', identityVerified:true, transferMode:'LICENSE_CAPABILITIES', status:'APPROVED' })) throw new Error('approved avatar listing should pass');

console.log('12D-60 sovereign user twin governance contracts: OK');
