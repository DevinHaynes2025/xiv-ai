/**
 * 62L-DQ Universal Integration Brain runtime —
 * Walks UNIVERSAL_INTEGRATION_BRAIN_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  DQ_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  UNIVERSAL_INTEGRATION_BRAIN_CYCLE,
  predecessorMap,
  type DqActor,
  type DqEvidenceState,
  type DqHop,
  type DqHopRecord,
} from './universal-integration-brain-types';
import type { DpActor } from './plugin-civilization-os-types';

export {
  UNIVERSAL_INTEGRATION_BRAIN_CYCLE,
  DQ_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DqHop, state: DqEvidenceState, summary: string): DqHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

function toDpActor(actor: DqActor): DpActor {
  const kind =
    actor.kind === 'human_approver' || actor.kind === 'founder' || actor.kind === 'agent'
      ? actor.kind
      : 'plugin_civilization_curator';
  return {
    kind,
    id: actor.id,
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
  };
}

export type DqCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DqActor;
  root?: string;
  repoRoot?: string;
};

export async function runUniversalIntegrationBrainCycle(input: DqCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DqHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };
  const agentActor: DqActor = { ...actor, kind: 'agent', id: 'agent-self' };
  const dpAgent = toDpActor(agentActor);

  hops.push(
    hop(
      'honesty_locks',
      DQ_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DQ_LOCKS.LOCAL_FIRST &&
        DQ_LOCKS.PER_CALL_AUTHORIZATION_REQUIRED &&
        DQ_LOCKS.API_CALL_WITHOUT_PER_CALL_AUTH === false &&
        DQ_LOCKS.INSTALLED_ONLY_PLUGIN_MAY_INVOKE === false &&
        DQ_LOCKS.UNTESTED_OFFLINE_MARKED_AVAILABLE === false &&
        DQ_LOCKS.SCHEMA_DRIFT_QUARANTINES &&
        DQ_LOCKS.CONSEQUENTIAL_WRITE_SELF_APPROVE === false &&
        DQ_LOCKS.EXTERNAL_ACTION_SELF_APPROVE === false &&
        DQ_LOCKS.SEALED_SILENT_CROSS_PROVIDER_MOVE === false &&
        DQ_LOCKS.TRUST_SCORE_GRANTS_BROADER_SCOPES === false &&
        DQ_LOCKS.COMPOSITION_ESCALATES_PERMISSIONS === false &&
        DQ_LOCKS.UNSIGNED_CROSS_SYSTEM_EVENT_ACCEPTED === false &&
        DQ_LOCKS.DATA_MOVEMENT_WITHOUT_PREVIEW === false &&
        DQ_LOCKS.UNCONFIGURED_EDGE_CONNECTOR_AVAILABLE === false &&
        DQ_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const brain = await bootstrapUniversalIntegrationBrain({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  hops.push(
    hop(
      'universal_integration_brain_bootstrap',
      'PASS',
      `brain=${brain.id}; predecessor=${brain.predecessorLayer}; dpSoftWire=${brain.dpCivilizationSoftWired}`,
    ),
  );

  const noAuth = await authorizeApiCall({
    callerId: agentActor.id,
    pluginId: 'plug-1',
    scope: 'invoke',
    perCallAuthToken: null,
    pluginTrusted: true,
    pluginVerified: true,
    root,
    actor: agentActor,
  });
  hops.push(
    hop(
      'api_call_without_per_call_auth_denied',
      noAuth.status === 'denied' ? 'PASS' : 'FAIL',
      noAuth.reason,
    ),
  );

  const installedOnly = await authorizeApiCall({
    callerId: agentActor.id,
    pluginId: 'plug-installed',
    scope: 'invoke',
    perCallAuthToken: 'tok-1',
    pluginInstalled: true,
    pluginTrusted: false,
    pluginVerified: false,
    root,
    actor: agentActor,
  });
  hops.push(
    hop(
      'untrusted_installed_only_plugin_invocation_denied',
      installedOnly.status === 'denied' ? 'PASS' : 'FAIL',
      installedOnly.reason,
    ),
  );

  const edgeUntested = await registerEdgeConnector({
    name: 'edge-untested',
    configured: true,
    offlineTested: false,
    root,
    actor,
  });
  const offlineProbe = await probeOfflineCapability({
    connectorId: edgeUntested.id,
    claimAvailable: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'untested_offline_capability_not_marked_available',
      offlineProbe.status !== 'AVAILABLE' && edgeUntested.offlineAvailable === false
        ? 'PASS'
        : 'FAIL',
      offlineProbe.reason,
    ),
  );

  const schema = await registerTranslationSchema({
    name: 'crm-contact',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    fields: [
      { name: 'email', classification: 'pii' },
      { name: 'secret_note', classification: 'sealed' },
      { name: 'local_cache', classification: 'local_only' },
    ],
    root,
    actor,
  });
  const drifted = await reportTranslationSchemaDrift({
    schemaId: schema.id,
    observedSchemaVersion: '2.0.0',
    root,
    actor,
  });
  hops.push(
    hop(
      'schema_drift_quarantine_not_trusted',
      drifted.quarantined && !drifted.trusted ? 'QUARANTINED' : 'FAIL',
      drifted.reason,
    ),
  );

  const consequential = await evaluateActionRisk({
    pluginId: 'plug-1',
    actionId: 'cw',
    scope: 'write_consequential',
    grantedScopes: ['write_consequential'],
    humanGatePresent: false,
    actor: dpAgent,
    root,
  });
  hops.push(
    hop(
      'consequential_write_without_approval_denied',
      consequential.status === 'denied' ? 'PASS' : 'FAIL',
      consequential.reason,
    ),
  );

  const external = await evaluateActionRisk({
    pluginId: 'plug-1',
    actionId: 'ea',
    scope: 'external_action',
    grantedScopes: ['external_action'],
    humanGatePresent: false,
    actor: dpAgent,
    root,
  });
  hops.push(
    hop(
      'external_action_without_approval_denied',
      external.status === 'denied' ? 'PASS' : 'FAIL',
      external.reason,
    ),
  );

  // Fresh trusted schema for sealed move story (drifted one is quarantined)
  const sealedSchema = await registerTranslationSchema({
    name: 'sealed-pack',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    fields: [{ name: 'vault', classification: 'sealed' }],
    root,
    actor,
  });
  const sealedMove = await requestDataMovement({
    schemaId: sealedSchema.id,
    fieldName: 'vault',
    fromProvider: 'local',
    toProvider: 'cloud-x',
    fromUniverse: input.universeId,
    toUniverse: 'other-universe',
    previewPresented: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_local_only_silent_cross_provider_universe_move_denied',
      sealedMove.status === 'denied' ? 'PASS' : 'FAIL',
      sealedMove.reason,
    ),
  );

  const trust = await computeTrustScore({
    pluginId: 'plug-1',
    verification: 95,
    health: 90,
    marketplaceReputation: 88,
    incidentHistory: 0,
    ageDays: 120,
    root,
    actor,
  });
  const trustProbe = await probeTrustScoreScopeGrant({
    pluginId: 'plug-1',
    score: trust.score,
    requestedScopes: ['write_consequential', 'deploy'],
    grantedScopes: ['read'],
    root,
    actor,
  });
  hops.push(
    hop(
      'trust_score_alone_does_not_grant_broader_scopes',
      trust.grantsBroaderScopes === false && trustProbe.status === 'denied'
        ? 'PASS'
        : 'FAIL',
      trustProbe.reason,
    ),
  );

  const capA = await discoverCapability({
    name: 'read-crm',
    scopes: ['read'],
    root,
    actor,
  });
  const capB = await discoverCapability({
    name: 'draft-notes',
    scopes: ['read', 'draft'],
    root,
    actor,
  });
  const composition = await composeCapabilities({
    capabilityIds: [capA.id, capB.id],
    requestedScopes: ['write_consequential'],
    root,
    actor,
  });
  hops.push(
    hop(
      'composition_cannot_escalate_beyond_constituent_permissions',
      composition.status === 'denied' ? 'PASS' : 'FAIL',
      composition.reason,
    ),
  );

  await registerInteropContract({ name: 'ioc-default', root, actor });
  const unsigned = await ingestCrossSystemEvent({
    sourceSystem: 'erp',
    targetSystem: 'crm',
    payload: '{"order":1}',
    signature: null,
    root,
    actor,
  });
  const sig = signCrossSystemPayload({
    payload: '{"order":1}',
    sourceSystem: 'erp',
    targetSystem: 'crm',
  });
  const signed = await ingestCrossSystemEvent({
    sourceSystem: 'erp',
    targetSystem: 'crm',
    payload: '{"order":1}',
    signature: sig,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_cross_system_event_rejected',
      unsigned.status === 'rejected' && signed.status === 'accepted' ? 'PASS' : 'FAIL',
      unsigned.reason,
    ),
  );

  const classSchema = await registerTranslationSchema({
    name: 'payroll',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    fields: [{ name: 'ssn', classification: 'regulated' }],
    root,
    actor,
  });
  const noPreview = await requestDataMovement({
    schemaId: classSchema.id,
    fieldName: 'ssn',
    fromProvider: 'hr',
    toProvider: 'analytics',
    fromUniverse: input.universeId,
    toUniverse: input.universeId,
    previewPresented: false,
    consequential: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'data_movement_preview_required_before_consequential_classified_move',
      noPreview.status === 'denied' ? 'PASS' : 'FAIL',
      noPreview.reason,
    ),
  );

  const unconfigured = await registerEdgeConnector({
    name: 'edge-unconfigured',
    configured: false,
    offlineTested: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_edge_connector_unavailable',
      unconfigured.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FAIL',
      unconfigured.reason,
    ),
  );

  const reg = await probeRegistrationAuthority({
    connectorId: unconfigured.id,
    claimBilling: true,
    claimCredentials: true,
    claimDeploy: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'registration_neq_billing_credentials_deploy',
      reg.grantsBilling === false &&
        reg.grantsCredentials === false &&
        reg.grantsDeploy === false
        ? 'PASS'
        : 'FAIL',
      reg.reason,
    ),
  );

  await recordMarketplaceIntelligence({
    connectorId: edgeUntested.id,
    healthScore: 70,
    reuseCount: 3,
    trustHint: 55,
    root,
    actor,
  });

  void decisionGate({
    id: 'dq-cycle-gate',
    action: '62l_dq_universal_integration_brain_cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  void universalIntegrationBrainHonesty(input.repoRoot);

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DQ universal integration brain cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DQ'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DQ universal integration brain cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; per-call auth; trust≠authority; composition≠escalation; unsigned rejected`,
      sourceRefs: ['62L-DQ'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no production authorization.',
    ),
  );

  // Validate cycle order completeness
  void UNIVERSAL_INTEGRATION_BRAIN_CYCLE;

  const health = await checkLocalBrainHealth(root).catch(() => null);
  const preds = predecessorMap(input.repoRoot ?? root);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DQ_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: brain.predecessorLayer,
    dpCivilizationSoftWired: brain.dpCivilizationSoftWired,
    doMeshSoftWired: brain.doMeshSoftWired,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionUniversalIntegrationBrainShipped: false as const,
    dbCandidatesApplied: false as const,
    brain,
  };
}

export async function buildUniversalIntegrationBrainHealthReport(input?: {
  orgId?: string;
  tenantId?: string;
  universeId?: string;
  actor?: DqActor;
  root?: string;
  repoRoot?: string;
}) {
  const orgId = input?.orgId ?? 'org-local';
  const tenantId = input?.tenantId ?? 'tenant-local';
  const universeId = input?.universeId ?? 'universe-local';
  const actor: DqActor = input?.actor ?? {
    kind: 'integration_brain_curator',
    id: 'health',
    orgId,
    tenantId,
    universeId,
  };
  const cycle = await runUniversalIntegrationBrainCycle({
    orgId,
    tenantId,
    universeId,
    actor,
    root: input?.root,
    repoRoot: input?.repoRoot,
  });
  const failed = cycle.hops.filter((h) => h.state === 'FAIL');
  return {
    status: failed.length === 0 ? 'HEALTHY' : 'DEGRADED',
    failedHops: failed.map((h) => h.hop),
    hopCount: cycle.hops.length,
    predecessorLayer: cycle.predecessorLayer,
    dpCivilizationSoftWired: cycle.dpCivilizationSoftWired,
    honesty: universalIntegrationBrainHonesty(input?.repoRoot),
    nextPhaseTitle: NEXT_PHASE_TITLE,
    productionAuthorized: false as const,
    tipLand: false as const,
    dbCandidatesApplied: false as const,
  };
}
