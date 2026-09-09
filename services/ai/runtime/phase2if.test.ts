/**
 * Phase 2I-F elite mobile experience + communication UX.
 * Deterministic. No network. Does not weaken 2I-E or tenant tests.
 */
import assert from 'node:assert/strict';

import { AuthorityLevel, boundedAutonomyEnabled } from './authority';
import { agentDebuggerCanDeploy } from './diagnostics';
import {
  agentAuthorityLabel,
  connectorCatalog,
  consequentialActionRequiresHumanApproval,
  createDemoExperienceRecord,
  demoDataIsIdentifiable,
  EXPERIENCE_AGENTS,
  forecastIsNotAFact,
  globalDataFabricProductionLive,
  inferenceIsNotAFact,
  l4RemainsDisabled,
  liveDemoInferenceForecastSeparated,
  meetingRoomFoundation,
  meetingsUiClaimsTransportLive,
  messagesUiClaimsTransportLive,
  PREMIUM_PRIMARY_NAV,
  providerStateTruthful,
  resolvePremiumRoute,
  sourceProvenanceRequired,
  surfaceMayBePresentedAsFact,
  uiCannotTakeCrossOrgAction,
  uiTenantSelectorIsNotAuthority,
  unprovenConnectorMustNotBeLive,
} from './network-os';
import { publishingWritesEnabled } from './publishing/policy';
import {
  catalogSecurityIsSound,
  catalogSecuritySnapshot,
  recordSecValidatedRetrieval,
  recordWorldBankValidatedRetrieval,
  resetSecAdapterStatusForTests,
  resetSourceRegistryForTests,
  resetWorldBankAdapterStatusForTests,
  seedDeclaredBusinessDataProviders,
  secActivationDoesNotInvalidateWorldBankCatalog,
  secAdapterCapabilityStatus,
  worldBankAdapterCapabilityStatus,
} from './sources';
import { clientSelectorIsNotAuthority, evaluateTenantActivation } from './tenant';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('live/demo/inference/forecast state separation', () => {
  assert.equal(liveDemoInferenceForecastSeparated(['LIVE', 'DEMO', 'INFERENCE', 'FORECAST']), true);
  assert.equal(surfaceMayBePresentedAsFact('LIVE'), true);
  assert.equal(surfaceMayBePresentedAsFact('FORECAST'), false);
  assert.equal(forecastIsNotAFact('FORECAST'), true);
  assert.equal(inferenceIsNotAFact('INFERENCE'), true);
});

test('provider state truthfulness; World Bank and SEC LIVE remain allowed; fabric not production-live', () => {
  resetWorldBankAdapterStatusForTests();
  resetSecAdapterStatusForTests();
  resetSourceRegistryForTests();
  seedDeclaredBusinessDataProviders();
  recordWorldBankValidatedRetrieval();
  recordSecValidatedRetrieval();
  assert.equal(worldBankAdapterCapabilityStatus(), 'LIVE');
  assert.equal(secAdapterCapabilityStatus(), 'LIVE');
  assert.equal(globalDataFabricProductionLive(), false);
  const truth = providerStateTruthful();
  assert.equal(truth.worldBankFabricProductionLive, false);
  assert.equal(truth.secFabricProductionLive, false);
  assert.equal(truth.nvidiaLive, false);
  assert.equal(truth.messagesTransportLive, false);
  assert.equal(truth.meetingsTransportLive, false);
  resetWorldBankAdapterStatusForTests();
  resetSecAdapterStatusForTests();
});

test('SEC activation does not invalidate World Bank catalog; unproven providers stay not_configured', () => {
  resetSourceRegistryForTests();
  seedDeclaredBusinessDataProviders();
  const snap = catalogSecuritySnapshot();
  assert.equal(snap.worldBank, 'authorized');
  assert.equal(snap.secEdgar, 'authorized');
  assert.equal(snap.unproven.us_bls, 'not_configured');
  assert.equal(snap.unproven.us_fred, 'not_configured');
  assert.equal(snap.unproven.us_census, 'not_configured');
  assert.equal(catalogSecurityIsSound(), true);
  assert.equal(secActivationDoesNotInvalidateWorldBankCatalog(), true);
  assert.equal(globalDataFabricProductionLive(), false);
});

test('unproven connectors are NOT_CONFIGURED', () => {
  for (const id of ['oracle', 'snowflake', 'bigquery', 'nvidia', 'video', 'messaging', 'crm', 'erp']) {
    const row = unprovenConnectorMustNotBeLive(id);
    assert.equal(row.live === false || row.surface === 'NOT_CONFIGURED', true);
    const catalog = connectorCatalog().find((item) => item.id === id);
    assert.equal(catalog?.provenLive, false);
    assert.equal(catalog?.surface, 'NOT_CONFIGURED');
  }
});

test('agent authority labels; L4 remains disabled; human approval for consequential actions', () => {
  assert.equal(agentAuthorityLabel(AuthorityLevel.L0_Observe), 'Observe');
  assert.equal(agentAuthorityLabel(AuthorityLevel.L3_HumanApproval), 'Human Approval');
  assert.equal(agentAuthorityLabel(AuthorityLevel.L4_BoundedAutonomy), 'Bounded Autonomy');
  assert.equal(agentAuthorityLabel(AuthorityLevel.L5_HumanOnly), 'Human Only');
  assert.equal(l4RemainsDisabled(), true);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(EXPERIENCE_AGENTS.length, 11);
  const l1 = consequentialActionRequiresHumanApproval({ authority: AuthorityLevel.L1_Recommend, consequential: true });
  assert.equal(l1.allowed, false);
  const l3 = consequentialActionRequiresHumanApproval({ authority: AuthorityLevel.L3_HumanApproval, consequential: true });
  assert.equal(l3.required, true);
  const l4 = consequentialActionRequiresHumanApproval({ authority: AuthorityLevel.L4_BoundedAutonomy, consequential: true });
  assert.equal(l4.allowed, false);
  assert.equal(l4.required, true);
  assert.equal(agentDebuggerCanDeploy(), false);
  assert.equal(publishingWritesEnabled(), false);
});

test('source provenance requirements', () => {
  assert.equal(sourceProvenanceRequired({ source: null, surface: 'LIVE' }).allowed, false);
  assert.equal(sourceProvenanceRequired({ source: 'world_bank_open_data', surface: 'HISTORICAL' }).allowed, true);
});

test('tenant selectors are never treated as authority; no UI cross-org action', () => {
  assert.equal(uiTenantSelectorIsNotAuthority('org_selected_in_ui').allowed, false);
  assert.equal(clientSelectorIsNotAuthority('universe_selected_in_ui').allowed, false);
  assert.equal(uiCannotTakeCrossOrgAction({ actorOrganizationId: 'org_a', targetOrganizationId: 'org_b' }).allowed, false);
  assert.equal(evaluateTenantActivation().tenantPersistence, 'blocked');
});

test('meeting/video UI does not claim transport is live; messages UI does not claim transport is live', () => {
  assert.equal(messagesUiClaimsTransportLive(), false);
  assert.equal(meetingsUiClaimsTransportLive(), false);
  const room = meetingRoomFoundation();
  assert.equal(room.visualOnly, true);
  assert.equal(room.transportLive, false);
  assert.equal(room.transcriptionLive, false);
});

test('demo data is identifiable', () => {
  const demo = createDemoExperienceRecord({ id: 'd1', title: 'Sample mixer' });
  assert.equal(demoDataIsIdentifiable(demo), true);
  assert.equal(demo.fabricatedProduction, false);
});

test('premium navigation routes resolve correctly', () => {
  assert.deepEqual([...PREMIUM_PRIMARY_NAV], ['home', 'intelligence', 'network', 'meetings', 'ai']);
  const home = resolvePremiumRoute({ experience: 'business', path: 'home' });
  assert.equal(home.href, '/business');
  assert.equal(resolvePremiumRoute({ experience: 'executive', path: 'intelligence' }).href, '/executive/intelligence');
  assert.equal(resolvePremiumRoute({ experience: 'business', path: 'ai' }).file, 'agents');
  assert.equal(resolvePremiumRoute({ experience: 'business', path: 'messages' }).href, '/business/messages');
  assert.equal(resolvePremiumRoute({ experience: 'business', path: 'mixer' }).href, '/business/mixer');
  assert.equal(resolvePremiumRoute({ experience: 'executive', path: 'agent-room' }).href, '/executive/agent-room');
  assert.equal(resolvePremiumRoute({ experience: 'business', path: 'sources' }).href, '/business/sources');
});

console.log('All Phase 2I-F elite experience unit cases passed.');
