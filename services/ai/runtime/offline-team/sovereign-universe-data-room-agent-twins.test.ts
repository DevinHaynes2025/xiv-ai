import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  AgentIdentityRegistry,
  FinancialDataGovernance,
  IndustryVendorAdapterRegistry,
  PrivateDataRoom,
  SovereignUniverseStore,
  approveSharedLearningSignal,
  createGovernedTwinProfile,
  type ConsentReceipt,
  type LegalPolicyReceipt,
  type UniverseKeyMaterial,
} from './sovereign-universe-data-room-agent-twins';

const tenantId = 'tenant-alpha';
const userId = 'user-1';
const universeId = 'universe-1';
const now = new Date('2026-09-11T13:00:00.000Z');
const future = '2026-09-12T13:00:00.000Z';
const evidence = ['evidence:12d71'];

async function main(): Promise<void> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'xiv-12d71-'));
  const key: UniverseKeyMaterial = {
    tenantId,
    userId,
    keyId: 'universe-key-1',
    keyVersion: 1,
    key: Buffer.alloc(32, 11),
    evidenceRefs: ['key-ceremony:universe-1'],
  };
  const resolver = { resolve: () => key };
  try {
    const store = new SovereignUniverseStore(tempRoot, tenantId, userId, resolver);
    const state = {
      schemaVersion: 1 as const,
      tenantId,
      userId,
      universeId,
      classification: 'TOP_SECRET' as const,
      localFirst: true as const,
      centralizeRawPrivateDataByDefault: false as const,
      profile: { displayName: 'Private User' },
      privateMemory: { note: 'never-centralize-raw-memory' },
      preferences: { locale: 'en-US' },
      evidenceRefs: evidence,
      updatedAt: now.toISOString(),
    };
    const receipt = await store.save(state, now);
    assert.equal(receipt.encryptedAtRest, true);
    const disk = await readFile(receipt.path, 'utf8');
    assert.equal(disk.includes('never-centralize-raw-memory'), false);
    assert.deepEqual(await store.load(universeId), state);
    const route = store.decideExternalRoute(state, true);
    assert.equal(route.allowed, false);
    assert.match(route.reasons.join(' '), /TOP_SECRET/);

    const wrongUserStore = new SovereignUniverseStore(tempRoot, tenantId, 'user-2', { resolve: () => ({ ...key, userId: 'user-2' }) });
    await assert.rejects(() => wrongUserStore.load(universeId));

    const consent: ConsentReceipt = {
      receiptId: 'consent-health-1', tenantId, subjectId: userId, connectorId: 'health-target', dataClass: 'HEALTH',
      scopes: ['records:read'], jurisdiction: 'US-TX', authorizedAt: now.toISOString(), expiresAt: future,
      externalRoutingAllowed: false, evidenceRefs: ['consent:user-signature'],
    };
    const legal: LegalPolicyReceipt = {
      receiptId: 'legal-health-1', tenantId, connectorId: 'health-target', dataClass: 'HEALTH', jurisdiction: 'US-TX',
      reviewedAt: now.toISOString(), expiresAt: future, approvedScopes: ['records:read'], externalRoutingAllowed: false,
      evidenceRefs: ['legal:review-1'],
    };
    const room = new PrivateDataRoom(tempRoot, tenantId, 'room-1', userId, resolver);
    const put = await room.putAsset(userId, {
      assetId: 'health-summary', name: 'Private health summary', content: 'sensitive-health-content', classification: 'TOP_SECRET',
      dataClass: 'HEALTH', scopes: ['records:read'], connectorId: 'health-target', jurisdiction: 'US-TX', evidenceRefs: ['source:health-1'],
      consentReceipt: consent, legalPolicyReceipt: legal,
    }, now);
    assert.equal(put.metadata.valueRendered, false);
    const storedAsset = await readFile(path.join(tempRoot, tenantId, 'data-rooms', 'room-1', 'assets', 'health-summary.xivroomasset.json'), 'utf8');
    assert.equal(storedAsset.includes('sensitive-health-content'), false);

    await room.grantAccess(userId, {
      grantId: 'grant-analyst-1', tenantId, roomId: 'room-1', subjectId: 'analyst-1', scopes: ['records:read'], issuedBy: userId,
      issuedAt: now.toISOString(), expiresAt: future, evidenceRefs: ['approval:room-grant-1'],
    }, ['auth:owner-session'], now);
    const read = await room.readAsset('analyst-1', 'health-summary', ['records:read'], ['auth:analyst-session'], now);
    assert.equal(read.content, 'sensitive-health-content');
    assert.equal(read.handling.noEmbedding, true);
    assert.equal(read.handling.noExternalPlugin, true);
    await assert.rejects(() => room.readAsset('intruder-1', 'health-summary', ['records:read'], ['auth:intruder-session'], now), /access denied/);
    const audit = await readFile(path.join(tempRoot, tenantId, 'data-rooms', 'room-1', 'access-audit.xivjsonl'), 'utf8');
    assert.equal(audit.includes('sensitive-health-content'), false);
    const auditLines = audit.trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(auditLines[0].previousHash, '0'.repeat(64));
    assert.equal(auditLines[1].previousHash, auditLines[0].hash);

    await assert.rejects(() => room.putAsset(userId, {
      assetId: 'genetic-no-consent', name: 'Genetic target', content: 'genetic-private', classification: 'RESTRICTED', dataClass: 'GENETIC',
      scopes: ['dna:read'], connectorId: 'dna-target', jurisdiction: 'US-TX', evidenceRefs: ['source:dna'],
    }, now), /authorization receipt|legal policy/i);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }

  const twin = createGovernedTwinProfile({
    twinId: 'twin-user-1', tenantId, userId, displayName: 'Sovereign Twin', profileVersion: '1.0.0', role: 'decision-support',
    goals: ['support user-authorized planning'], policies: ['no independent legal authority'], memoryNamespace: 'twin:user-1:private',
    sourceProfileRefs: ['profile:user-1:v1'], dataDna: { configurationVersion: 'cfg-1', capabilityVersion: 'cap-1', provenanceRefs: ['prov:profile-1'] },
    evidenceRefs: ['evidence:twin-profile'],
  });
  assert.equal(twin.claims.consciousness, false);
  assert.equal(twin.claims.freeWill, false);
  assert.equal(twin.claims.humanClone, false);

  const agents = new AgentIdentityRegistry();
  for (const [agentId, role, memoryNamespace] of [
    ['agent-strategy', 'strategy', 'mem:strategy'],
    ['agent-privacy', 'privacy', 'mem:privacy'],
    ['agent-ops', 'operations', 'mem:ops'],
  ]) {
    agents.register({
      agentId, tenantId, universeId, role, memoryNamespace, goals: [`perform ${role} work`], policies: ['evidence-first', 'human authority preserved'],
      active: true, evidenceRefs: [`profile:${agentId}`], claims: { consciousness: false, freeWill: false, independentLegalAuthority: false },
    });
  }
  const team = agents.activeTeam(tenantId, universeId);
  assert.equal(team.length, 3);
  assert.equal(new Set(team.map((agent) => agent.memoryNamespace)).size, 3);

  const signal = approveSharedLearningSignal({
    signalId: 'signal-1', tenantId, sourceUniverseId: universeId, metric: 'retrieval-success-rate', cohortSize: 12,
    aggregateValue: 0.87, dimensions: { industry: 'retail' }, anonymized: true, minimized: true, containsRawRecords: false,
    containsDirectIdentifiers: false, classification: 'INTERNAL', evidenceRefs: ['eval:cohort-1'],
  });
  assert.equal(signal.anonymized, true);
  assert.throws(() => approveSharedLearningSignal({ ...signal, signalId: 'signal-bad', containsRawRecords: true }), /raw private records/);
  assert.throws(() => approveSharedLearningSignal({ ...signal, signalId: 'signal-small', cohortSize: 2 }), /at least 5/);

  const adapters = new IndustryVendorAdapterRegistry();
  adapters.upsert({
    adapterId: 'bank-target', tenantId, providerName: 'Example Financial Integration Target', industry: 'financial-services', status: 'API_READY',
    supportedDataClasses: ['FINANCIAL'], supportedScopes: ['balances:read'], jurisdictions: ['US-TX'], evidenceRefs: ['api-docs:bank-target'],
  });
  const governance = new FinancialDataGovernance(adapters);
  const financialConsent: ConsentReceipt = {
    receiptId: 'consent-fin-1', tenantId, subjectId: userId, connectorId: 'bank-target', dataClass: 'FINANCIAL', scopes: ['balances:read'],
    jurisdiction: 'US-TX', authorizedAt: now.toISOString(), expiresAt: future, externalRoutingAllowed: true, evidenceRefs: ['consent:fin-user'],
  };
  const financialLegal: LegalPolicyReceipt = {
    receiptId: 'legal-fin-1', tenantId, connectorId: 'bank-target', dataClass: 'FINANCIAL', jurisdiction: 'US-TX', reviewedAt: now.toISOString(),
    expiresAt: future, approvedScopes: ['balances:read'], externalRoutingAllowed: true, evidenceRefs: ['legal:fin-review'],
  };
  const targetDenied = governance.decide({
    tenantId, userId, adapterId: 'bank-target', requestedCapabilities: ['BALANCES_READ'], scopes: ['balances:read'], classification: 'RESTRICTED',
    jurisdiction: 'US-TX', consentReceipt: financialConsent, legalPolicyReceipt: financialLegal,
  }, now.getTime());
  assert.equal(targetDenied.allowed, false);
  assert.match(targetDenied.reasons.join(' '), /VERIFIED_PARTNER/);

  adapters.upsert({
    adapterId: 'bank-target', tenantId, providerName: 'Example Financial Integration Target', industry: 'financial-services', status: 'VERIFIED_PARTNER',
    supportedDataClasses: ['FINANCIAL'], supportedScopes: ['balances:read'], jurisdictions: ['US-TX'], verifiedAt: now.toISOString(), expiresAt: future,
    evidenceRefs: ['agreement:bank-partner', 'api-test:bank-partner'],
  });
  const allowed = governance.decide({
    tenantId, userId, adapterId: 'bank-target', requestedCapabilities: ['BALANCES_READ', 'ANALYTICS'], scopes: ['balances:read'], classification: 'RESTRICTED',
    jurisdiction: 'US-TX', consentReceipt: financialConsent, legalPolicyReceipt: financialLegal,
  }, now.getTime());
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.authority.canMoveMoney, false);
  assert.equal(allowed.authority.canOpenAccounts, false);
  assert.equal(allowed.authority.canSignContracts, false);
  assert.equal(allowed.authority.unrestrictedBankAccess, false);

  const topSecretDenied = governance.decide({
    tenantId, userId, adapterId: 'bank-target', requestedCapabilities: ['BALANCES_READ'], scopes: ['balances:read'], classification: 'TOP_SECRET',
    jurisdiction: 'US-TX', consentReceipt: financialConsent, legalPolicyReceipt: financialLegal,
  }, now.getTime());
  assert.equal(topSecretDenied.allowed, false);
  assert.match(topSecretDenied.reasons.join(' '), /TOP_SECRET/);

  console.log('12D-71 sovereign universes/data rooms/agent twin contracts: OK');
}

void main();
