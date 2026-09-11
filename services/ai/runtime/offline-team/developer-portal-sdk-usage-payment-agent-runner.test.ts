import { strict as assert } from 'node:assert';
import { developerPortalReady } from './developer-portal-contract';
import { canUseScope } from './sdk-api-entitlement-manager';
import { summarizeUsage } from './metered-usage-dashboard';
import { commercialAccessAllowed, COMPANY_VAULT_LEDGER_POLICY } from './contract-payment-status-ledger';
import { validateDeveloperCouncilMeeting } from './local-developer-agent-meeting-runner';

assert.equal(developerPortalReady({
  developerId: 'dev-1', tenantId: 'tenant-a', status: 'APPROVED',
  contractReceiptRef: 'contract:1', legalReviewReceiptRef: 'legal:1', securityReviewReceiptRef: 'security:1',
  sandboxEnabled: true, productionPublishAllowed: false, approvedProjectRoomIds: ['room-1'],
}), true);

assert.equal(canUseScope({
  entitlementId: 'ent-1', developerId: 'dev-1', tenantId: 'tenant-a', scopes: ['WRITE_SANDBOX'],
  apiKeyRef: 'vault:key-1', revoked: false, contractReceiptRef: 'contract:1', securityReceiptRef: 'security:1',
}, 'WRITE_SANDBOX'), true);

const usage = summarizeUsage([
  { tenantId: 'tenant-a', developerId: 'dev-1', metric: 'API_CALLS', quantity: 10, unitPriceMicros: 25, evidenceRef: 'usage:1', measuredAt: new Date().toISOString() },
]);
assert.equal(usage.estimatedChargeMicros, 250);
assert.equal(usage.byMetric.API_CALLS, 10);

assert.equal(commercialAccessAllowed({
  developerId: 'dev-1', tenantId: 'tenant-a', contractState: 'SIGNED', contractReceiptRef: 'contract:1',
  invoiceRefs: ['invoice:1'], paymentReceiptRefs: ['payment:1'], paymentState: 'PAID', collectedAmountMinor: 5000, currency: 'USD',
}), true);
assert.equal(COMPANY_VAULT_LEDGER_POLICY.canMoveMoney, false);

const meetingErrors = validateDeveloperCouncilMeeting({
  meetingId: 'm-1', tenantId: 'tenant-a', developerId: 'dev-1', topic: 'SDK launch readiness',
  participants: ['PLATFORM', 'SECURITY'],
  contributions: [
    { role: 'PLATFORM', recommendation: 'ship to sandbox', evidenceRefs: ['test:1'], confidence: 0.9 },
    { role: 'SECURITY', recommendation: 'keep production disabled', evidenceRefs: ['security:1'], confidence: 0.95, dissent: 'no production promotion yet' },
  ],
  humanApprovalRequired: true, productionMutationAllowed: false, externalNetworkRequired: false,
});
assert.deepEqual(meetingErrors, []);

console.log('12D-82 developer portal/SDK/usage/payment/agent runner contracts: OK');
