import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { authorizeApiCall } from './agent-api-gateway-civilization';
import {
  composeCapabilities,
  discoverCapability,
} from './capability-discovery-composition-brain';
import {
  registerTranslationSchema,
  reportTranslationSchemaDrift,
  requestDataMovement,
} from './enterprise-data-translation-grid';
import {
  ingestCrossSystemEvent,
  registerInteropContract,
  signCrossSystemPayload,
} from './global-business-systems-interop-layer';
import {
  probeOfflineCapability,
  probeRegistrationAuthority,
  registerEdgeConnector,
} from './local-edge-connector-runtime';
import { evaluateActionRisk } from './plugin-action-risk-gate';
import { recordMarketplaceIntelligence } from './plugin-marketplace-intelligence';
import {
  computeTrustScore,
  probeTrustScoreScopeGrant,
} from './security-trust-scoring-engine';
import {
  bootstrapUniversalIntegrationBrain,
  universalIntegrationBrainHonesty,
} from './universal-integration-brain';
import {
  ACTION_RISK_MATRIX,
  API_CALL_WITHOUT_AUTH_DENIED,
  COMPOSITION_ESCALATION_DENIED,
  CONSEQUENTIAL_WRITE_GATE_REQUIRED,
  DATA_MOVEMENT_PREVIEW_REQUIRED,
  DQ_LOCKS,
  EXTERNAL_ACTION_GATE_REQUIRED,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  REGISTRATION_NO_BILLING_CREDS_DEPLOY,
  SCHEMA_DRIFT_QUARANTINED,
  SEALED_CROSS_MOVE_DENIED,
  TRUST_SCORE_NO_BROADER_SCOPES,
  UNCONFIGURED_EDGE_UNAVAILABLE,
  UNIVERSAL_INTEGRATION_BRAIN_CYCLE,
  UNSIGNED_EVENT_REJECTED,
  UNTESTED_OFFLINE_NOT_AVAILABLE,
  UNTRUSTED_INSTALLED_ONLY_DENIED,
  predecessorMap,
  type DqActor,
} from './universal-integration-brain-types';
import {
  buildUniversalIntegrationBrainHealthReport,
  runUniversalIntegrationBrainCycle,
} from './universal-integration-brain-runtime';
import type { DpActor } from './plugin-civilization-os-types';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldq-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DqActor = {
  kind: 'integration_brain_curator',
  id: 'test-curator',
  orgId: 'org-dq',
  tenantId: 'tenant-dq',
  universeId: 'universe-dq',
};
const agentActor: DqActor = { ...actor, kind: 'agent', id: 'agent-1' };
const dpAgent: DpActor = {
  kind: 'agent',
  id: 'agent-1',
  orgId: actor.orgId,
  tenantId: actor.tenantId,
  universeId: actor.universeId,
};

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DQ_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DQ_LOCKS.TIP_LAND === false &&
      DQ_LOCKS.PER_CALL_AUTHORIZATION_REQUIRED === true &&
      DQ_LOCKS.TRUST_SCORE_GRANTS_BROADER_SCOPES === false &&
      DQ_LOCKS.COMPOSITION_ESCALATES_PERMISSIONS === false &&
      ACTION_RISK_MATRIX.CONSEQUENTIAL_WRITE.selfApproveAllowed === false &&
      ACTION_RISK_MATRIX.EXTERNAL_ACTION.humanGateRequired === true &&
      UNIVERSAL_INTEGRATION_BRAIN_CYCLE.includes(
        'api_call_without_per_call_auth_denied',
      ),
    'locks + DP risk matrix reuse present',
  );

  const brain = await bootstrapUniversalIntegrationBrain({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_universal_integration_brain',
    Boolean(brain.id) &&
      brain.l4AutonomyEnabled === false &&
      brain.tipLand === false &&
      brain.dpCivilizationSoftWired === true,
    `brain=${brain.id}; predecessor=${brain.predecessorLayer}`,
  );

  const noAuth = await authorizeApiCall({
    callerId: agentActor.id,
    pluginId: 'p1',
    scope: 'invoke',
    perCallAuthToken: null,
    pluginTrusted: true,
    pluginVerified: true,
    root,
    actor: agentActor,
  });
  check(
    'api_call_without_per_call_auth_denied',
    noAuth.status === 'denied' && noAuth.reason === API_CALL_WITHOUT_AUTH_DENIED,
    noAuth.reason,
  );

  const installedOnly = await authorizeApiCall({
    callerId: agentActor.id,
    pluginId: 'p-installed',
    scope: 'invoke',
    perCallAuthToken: 'tok',
    pluginInstalled: true,
    pluginTrusted: false,
    pluginVerified: false,
    root,
    actor: agentActor,
  });
  check(
    'untrusted_installed_only_plugin_invocation_denied',
    installedOnly.status === 'denied' &&
      installedOnly.reason === UNTRUSTED_INSTALLED_ONLY_DENIED,
    installedOnly.reason,
  );

  const edge = await registerEdgeConnector({
    name: 'offline-edge',
    configured: true,
    offlineTested: false,
    root,
    actor,
  });
  const offline = await probeOfflineCapability({
    connectorId: edge.id,
    claimAvailable: true,
    root,
    actor,
  });
  check(
    'untested_offline_capability_not_marked_available',
    edge.offlineAvailable === false &&
      offline.status !== 'AVAILABLE' &&
      offline.reason === UNTESTED_OFFLINE_NOT_AVAILABLE,
    offline.reason,
  );

  const schema = await registerTranslationSchema({
    name: 'orders',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    fields: [{ name: 'notes', classification: 'internal' }],
    root,
    actor,
  });
  const drift = await reportTranslationSchemaDrift({
    schemaId: schema.id,
    observedSchemaVersion: '9.9.9',
    root,
    actor,
  });
  check(
    'schema_drift_quarantine_not_trusted',
    drift.quarantined === true &&
      drift.trusted === false &&
      drift.reason === SCHEMA_DRIFT_QUARANTINED,
    drift.reason,
  );

  const consequential = await evaluateActionRisk({
    pluginId: 'p1',
    actionId: 'cw',
    scope: 'write_consequential',
    grantedScopes: ['write_consequential'],
    humanGatePresent: false,
    actor: dpAgent,
    root,
  });
  check(
    'consequential_write_without_approval_denied',
    consequential.status === 'denied' &&
      consequential.reason === CONSEQUENTIAL_WRITE_GATE_REQUIRED,
    consequential.reason,
  );

  const external = await evaluateActionRisk({
    pluginId: 'p1',
    actionId: 'ea',
    scope: 'external_action',
    grantedScopes: ['external_action'],
    humanGatePresent: false,
    actor: dpAgent,
    root,
  });
  check(
    'external_action_without_approval_denied',
    external.status === 'denied' &&
      external.reason === EXTERNAL_ACTION_GATE_REQUIRED,
    external.reason,
  );

  const sealedSchema = await registerTranslationSchema({
    name: 'sealed',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    fields: [
      { name: 'vault', classification: 'sealed' },
      { name: 'cache', classification: 'local_only' },
    ],
    root,
    actor,
  });
  const sealedMove = await requestDataMovement({
    schemaId: sealedSchema.id,
    fieldName: 'vault',
    fromProvider: 'local',
    toProvider: 'aws',
    fromUniverse: actor.universeId,
    toUniverse: 'other',
    previewPresented: false,
    root,
    actor,
  });
  check(
    'sealed_local_only_silent_cross_provider_universe_move_denied',
    sealedMove.status === 'denied' && sealedMove.reason === SEALED_CROSS_MOVE_DENIED,
    sealedMove.reason,
  );

  const trust = await computeTrustScore({
    pluginId: 'p1',
    verification: 99,
    health: 99,
    marketplaceReputation: 99,
    incidentHistory: 0,
    ageDays: 365,
    root,
    actor,
  });
  const trustProbe = await probeTrustScoreScopeGrant({
    pluginId: 'p1',
    score: trust.score,
    requestedScopes: ['deploy', 'billing'],
    grantedScopes: ['read'],
    root,
    actor,
  });
  check(
    'trust_score_alone_does_not_grant_broader_scopes',
    trust.grantsBroaderScopes === false &&
      trust.breakdown.explainers.length > 0 &&
      trustProbe.status === 'denied' &&
      trustProbe.reason === TRUST_SCORE_NO_BROADER_SCOPES,
    trustProbe.reason,
  );

  const a = await discoverCapability({
    name: 'cap-a',
    scopes: ['read'],
    root,
    actor,
  });
  const b = await discoverCapability({
    name: 'cap-b',
    scopes: ['read', 'draft'],
    root,
    actor,
  });
  const composition = await composeCapabilities({
    capabilityIds: [a.id, b.id],
    requestedScopes: ['external_action'],
    root,
    actor,
  });
  check(
    'composition_cannot_escalate_beyond_constituent_permissions',
    composition.status === 'denied' &&
      composition.reason === COMPOSITION_ESCALATION_DENIED,
    composition.reason,
  );

  await registerInteropContract({ name: 'ioc', root, actor });
  const unsigned = await ingestCrossSystemEvent({
    sourceSystem: 'a',
    targetSystem: 'b',
    payload: 'x',
    signature: null,
    root,
    actor,
  });
  const sig = signCrossSystemPayload({
    payload: 'x',
    sourceSystem: 'a',
    targetSystem: 'b',
  });
  const signed = await ingestCrossSystemEvent({
    sourceSystem: 'a',
    targetSystem: 'b',
    payload: 'x',
    signature: sig,
    root,
    actor,
  });
  check(
    'unsigned_cross_system_event_rejected',
    unsigned.status === 'rejected' &&
      unsigned.reason === UNSIGNED_EVENT_REJECTED &&
      signed.status === 'accepted',
    unsigned.reason,
  );

  const classified = await registerTranslationSchema({
    name: 'pii-grid',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    fields: [{ name: 'ssn', classification: 'regulated' }],
    root,
    actor,
  });
  const noPreview = await requestDataMovement({
    schemaId: classified.id,
    fieldName: 'ssn',
    fromProvider: 'hr',
    toProvider: 'bi',
    fromUniverse: actor.universeId,
    toUniverse: actor.universeId,
    previewPresented: false,
    consequential: true,
    root,
    actor,
  });
  check(
    'data_movement_preview_required_before_consequential_classified_move',
    noPreview.status === 'denied' &&
      noPreview.reason === DATA_MOVEMENT_PREVIEW_REQUIRED,
    noPreview.reason,
  );

  const unconfigured = await registerEdgeConnector({
    name: 'no-config',
    configured: false,
    root,
    actor,
  });
  check(
    'unconfigured_edge_connector_unavailable',
    unconfigured.status === 'UNAVAILABLE' &&
      unconfigured.reason === UNCONFIGURED_EDGE_UNAVAILABLE,
    unconfigured.reason,
  );

  const reg = await probeRegistrationAuthority({
    connectorId: unconfigured.id,
    claimBilling: true,
    claimCredentials: true,
    claimDeploy: true,
    root,
    actor,
  });
  check(
    'registration_neq_billing_credentials_deploy',
    reg.grantsBilling === false &&
      reg.grantsCredentials === false &&
      reg.grantsDeploy === false &&
      reg.reason === REGISTRATION_NO_BILLING_CREDS_DEPLOY,
    reg.reason,
  );

  const intel = await recordMarketplaceIntelligence({
    connectorId: edge.id,
    healthScore: 80,
    reuseCount: 2,
    trustHint: 60,
    root,
    actor,
  });
  check(
    'marketplace_intelligence_not_authority',
    intel.grantsAuthority === false && intel.grantsTrust === false,
    intel.reason,
  );

  const honesty = universalIntegrationBrainHonesty(repoRoot);
  check(
    'honesty_surfaces',
    honesty.l4AutonomyEnabled === false &&
      honesty.perCallAuthorizationRequired === true &&
      honesty.trustScoreGrantsBroaderScopes === false &&
      honesty.subsystems.apiGateway.perCallAuthorizationRequired === true,
    'subsystem honesty surfaces deny-by-default',
  );

  check(
    'next_title',
    NEXT_PHASE_TITLE.startsWith('62L-DR —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'predecessor_DP_present',
    preds.DP.tipProbe === 'PRESENT' && preds.DP.report === 'PRESENT',
    `DP=${preds.DP.tipProbe}/${preds.DP.report}; DO=${preds.DO.tipProbe}`,
  );

  const cycle = await runUniversalIntegrationBrainCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle',
    cycle.hops.length === UNIVERSAL_INTEGRATION_BRAIN_CYCLE.length &&
      failedHops.length === 0 &&
      cycle.tipLand === false &&
      cycle.productionAuthorized === false &&
      cycle.dbCandidatesApplied === false,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildUniversalIntegrationBrainHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report',
    health.status === 'HEALTHY' &&
      health.productionAuthorized === false &&
      health.tipLand === false,
    `status=${health.status}; hops=${health.hopCount}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DQ stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log(
  'OK 62L-DQ Universal Integration Brain + Agent API Gateway Civilization stories passed.',
);
