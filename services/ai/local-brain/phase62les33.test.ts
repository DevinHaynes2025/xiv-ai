/**
 * 62L-ES33 — Unified Identity & Account Federation Core denial + honesty tests.
 *
 * Script: npm run test:62les33
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ACCOUNT_LINKING_ACTIONS,
  AGENT_IDENTITY_FIELDS,
  CANDIDATE_PROVIDERS,
  CONNECTION_LIFECYCLE_STATES,
  CONSENT_DISCLOSURE_FIELDS,
  ES33_AGENT_BOUNDS,
  ES33_DB_CANDIDATES_STATUS,
  ES33_FEDERATION_CYCLE,
  ES33_LOCKS,
  ES33_MAY,
  ES33_MUST_NOT,
  ES_LAYER_TITLE,
  FEDERATION_TRUTH_BOUNDARY,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEURAL_IDENTITY_GRAPH_NODES,
  NEXT_PHASE_TITLE,
  XIV_BRAIN_CORE_PATH,
  XIV_IDENTITY_FIELDS,
  assertEs33LocksIntact,
  connectionIsAuthorizedForUse,
  es33SoftWireSnapshot,
  softWireHopState,
  xivAccountAuthorizesAllProviders,
  type Es33Actor,
} from './unified-identity-account-federation-types.ts';

import {
  assertProviderTokensNotInSource,
  attemptAutoScopeExpansion,
  attemptCrossTenantPooling,
  attemptCrossUniverseCredentialShare,
  attemptErpToPersonalBrain,
  attemptManagePullRequest,
  attemptPersonalDriveToEmployer,
  attemptSilentLinking,
  attemptTipLand,
  attemptXivAccountBlanketProviderAuth,
  associateProviderUnderXivIdentity,
  bootstrapUnifiedIdentityFederation,
  buildConsentDisclosure,
  changeConnectionScopes,
  checkNeuralGraphEdge,
  createOrganizationUniverse,
  createXivIdentity,
  enrollAgentIdentity,
  exampleFederatedIdentity,
  linkProviderAccount,
  listAuthorizedProviders,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  routeDataAcrossUniverses,
  runUnifiedIdentityFederationCycle,
  unlinkOrRevokeConnection,
  verifyProviderConnection,
} from './unified-identity-account-federation-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Es33Actor = {
  kind: 'identity_federation_core',
  id: 'idf-1',
  orgId: 'org-es33',
  tenantId: 'ten-es33',
  universeId: 'uni-es33',
  permissions: ['draft'],
};

const human: Es33Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-es33',
  tenantId: 'ten-es33',
  universeId: 'uni-es33',
  permissions: ['approve_consequential'],
};

test('SoT label ES33; Unified Identity Federation; next ES34; no invented issue', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ES33');
  assert.equal(GITHUB_SOT_ISSUE, null);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ES');
  assert.match(GITHUB_SOT_TITLE, /Unified Identity & Account Federation/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ES34/);
  assert.match(NEXT_PHASE_TITLE, /Identity-Aware Context Router/);
  assert.match(ES_LAYER_TITLE, /Home Base Identity Core/);
});

test('honesty locks: L4 false; no silent link; no cross-Universe creds; DB NOT_APPLIED', () => {
  assert.equal(assertEs33LocksIntact(), true);
  assert.equal(ES33_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ES33_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ES33_LOCKS.XIV_ACCOUNT_AUTHORIZES_ALL_PROVIDERS, false);
  assert.equal(ES33_LOCKS.PERSONAL_DRIVE_TO_EMPLOYER_UNIVERSE, false);
  assert.equal(ES33_LOCKS.ERP_TO_PERSONAL_BRAIN, false);
  assert.equal(ES33_LOCKS.SILENT_ACCOUNT_LINKING, false);
  assert.equal(ES33_LOCKS.CROSS_UNIVERSE_CREDENTIAL_SHARE, false);
  assert.equal(ES33_LOCKS.AUTOMATIC_SCOPE_EXPANSION, false);
  assert.equal(ES33_LOCKS.PROVIDER_TOKENS_IN_GIT, false);
  assert.equal(ES33_LOCKS.TIP_LAND, false);
  assert.equal(ES33_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(xivAccountAuthorizesAllProviders(), false);
  assert.equal(
    FEDERATION_TRUTH_BOUNDARY.xivAccountDoesNotAuthorizeAllProviders,
    true,
  );
  assert.equal(ES33_AGENT_BOUNDS.maySilentLink, false);
  assert.equal(ES33_AGENT_BOUNDS.mayShareCredentialsAcrossUniverses, false);
  assert.equal(ES33_AGENT_BOUNDS.automaticAuthority, false);
});

test('identity fields + lifecycle + consent + brain path + agent + graph encoded', () => {
  assert.equal(XIV_IDENTITY_FIELDS.length, 18);
  assert.ok(XIV_IDENTITY_FIELDS.includes('xivIdentityId'));
  assert.ok(XIV_IDENTITY_FIELDS.includes('linkedProviderAccounts'));
  assert.ok(XIV_IDENTITY_FIELDS.includes('consentRecords'));
  assert.deepEqual([...CONNECTION_LIFECYCLE_STATES], [
    'TARGET',
    'DOCUMENTED',
    'CONFIGURED',
    'AUTHORIZED',
    'VERIFIED',
    'DEGRADED',
    'REVOKED',
  ]);
  assert.equal(CONSENT_DISCLOSURE_FIELDS.length, 7);
  assert.ok(CONSENT_DISCLOSURE_FIELDS.includes('howToRevoke'));
  assert.equal(CANDIDATE_PROVIDERS.length, 11);
  assert.ok(CANDIDATE_PROVIDERS.includes('microsoft'));
  assert.ok(CANDIDATE_PROVIDERS.includes('erp'));
  assert.equal(XIV_BRAIN_CORE_PATH.length, 11);
  assert.equal(AGENT_IDENTITY_FIELDS.length, 10);
  assert.ok(AGENT_IDENTITY_FIELDS.includes('returnPath'));
  assert.equal(NEURAL_IDENTITY_GRAPH_NODES.length, 10);
  assert.deepEqual([...NEURAL_IDENTITY_GRAPH_NODES], [
    'person',
    'accounts',
    'organizations',
    'devices',
    'agents',
    'skills',
    'data',
    'tasks',
    'decisions',
    'outcomes',
  ]);
  assert.ok(ACCOUNT_LINKING_ACTIONS.includes('choose_universe_routing'));
  assert.ok(ES33_MAY.includes('disclose_consent_before_linking'));
  assert.ok(
    ES33_MUST_NOT.includes('treat_xiv_account_as_authorization_for_all_providers'),
  );
  assert.ok(ES33_FEDERATION_CYCLE.includes('deny_silent_linking'));
});

test('XIV account ≠ all providers authorized; independent connection lifecycle', () => {
  assert.equal(attemptXivAccountBlanketProviderAuth().state, 'DENIED');
  const example = exampleFederatedIdentity(agent);
  const authorized = listAuthorizedProviders(example.identity);
  assert.ok(authorized.includes('google'));
  assert.ok(authorized.includes('github'));
  assert.equal(authorized.includes('microsoft'), false);
  assert.equal(authorized.includes('erp'), false);
  assert.equal(
    connectionIsAuthorizedForUse(example.googlePersonal.lifecycle),
    true,
  );
  assert.equal(
    example.identity.providerAuthorizationState.microsoft,
    undefined,
  );

  const verified = verifyProviderConnection({
    identity: example.identity,
    connectionId: example.googlePersonal.connectionId,
  });
  assert.equal('denied' in verified, false);
  if (!('denied' in verified)) {
    assert.equal(verified.connection.lifecycle, 'VERIFIED');
  }
});

test('Personal Drive ↛ Employer; ERP ↛ Personal Brain; silent link denied', () => {
  assert.equal(attemptPersonalDriveToEmployer().state, 'DENIED');
  assert.equal(attemptErpToPersonalBrain().state, 'DENIED');
  assert.equal(attemptSilentLinking().state, 'DENIED');

  const created = createXivIdentity({
    actor: agent,
    primaryUserIdentity: 'boundary@example.com',
  });
  assert.equal('denied' in created, false);
  if ('denied' in created) return;

  const employer = createOrganizationUniverse({
    xivIdentityId: created.xivIdentityId,
    kind: 'company',
    orgId: agent.orgId,
    tenantId: 'ten-employer',
    label: 'corp',
  });
  let identity = {
    ...created,
    organizationMemberships: [employer],
  };

  const driveToEmployer = linkProviderAccount({
    actor: agent,
    identity,
    provider: 'google',
    providerSubjectId: 'g-drive',
    scopes: ['drive.readonly'],
    targetUniverseId: employer.universeId,
    consent: buildConsentDisclosure({
      provider: 'google',
      permissionsRequested: ['drive.readonly'],
      dataTypesAccessed: ['personal_files'],
      purpose: 'bad cross-universe',
      whereDataCanBeUsed: [employer.universeId],
      retention: 'n/a',
      userAcknowledged: true,
    }),
  });
  assert.equal('denied' in driveToEmployer, true);

  const erpToPersonal = linkProviderAccount({
    actor: agent,
    identity,
    provider: 'erp',
    providerSubjectId: 'sap-1',
    scopes: ['erp.read'],
    targetUniverseId: identity.personalUniverse.universeId,
    consent: buildConsentDisclosure({
      provider: 'erp',
      permissionsRequested: ['erp.read'],
      dataTypesAccessed: ['financials'],
      purpose: 'bad personal brain dump',
      whereDataCanBeUsed: [identity.personalUniverse.universeId],
      retention: 'n/a',
      userAcknowledged: true,
    }),
  });
  assert.equal('denied' in erpToPersonal, true);

  const silent = linkProviderAccount({
    actor: agent,
    identity,
    provider: 'github',
    providerSubjectId: 'silent',
    scopes: ['repo:read'],
    targetUniverseId: identity.personalUniverse.universeId,
    consent: buildConsentDisclosure({
      provider: 'github',
      permissionsRequested: ['repo:read'],
      dataTypesAccessed: ['source_metadata'],
      purpose: 'silent',
      whereDataCanBeUsed: [identity.personalUniverse.universeId],
      retention: 'n/a',
      userAcknowledged: false,
    }),
    silent: true,
  });
  assert.equal('denied' in silent, true);

  const routeDrive = routeDataAcrossUniverses({
    sourceUniverse: identity.personalUniverse,
    targetUniverse: employer,
    dataClass: 'personal_drive',
  });
  assert.equal('denied' in routeDrive, true);

  const routeErp = routeDataAcrossUniverses({
    sourceUniverse: employer,
    targetUniverse: identity.personalUniverse,
    dataClass: 'erp',
  });
  assert.equal('denied' in routeErp, true);

  void identity;
});

test('cross-Universe credential share denied; auto scope expansion denied; unlink/revoke', () => {
  assert.equal(attemptCrossUniverseCredentialShare().state, 'DENIED');
  assert.equal(attemptAutoScopeExpansion().state, 'DENIED');
  assert.equal(attemptCrossTenantPooling().state, 'DENIED');

  const example = exampleFederatedIdentity(agent);

  const shareCreds = linkProviderAccount({
    actor: agent,
    identity: example.identity,
    provider: 'slack',
    providerSubjectId: 'slack-1',
    scopes: ['chat:write'],
    targetUniverseId: example.identity.personalUniverse.universeId,
    consent: buildConsentDisclosure({
      provider: 'slack',
      permissionsRequested: ['chat:write'],
      dataTypesAccessed: ['messages'],
      purpose: 'workspace chat',
      whereDataCanBeUsed: [example.identity.personalUniverse.universeId],
      retention: 'Until unlink',
      userAcknowledged: true,
    }),
    shareCredentialFromUniverseId: example.employerUniverse.universeId,
  });
  assert.equal('denied' in shareCreds, true);

  const autoScope = changeConnectionScopes({
    identity: example.identity,
    connectionId: example.googlePersonal.connectionId,
    newScopes: ['drive.readonly', 'drive.full'],
    userAuthorized: false,
    autoExpand: true,
  });
  assert.equal('denied' in autoScope, true);

  const revoked = unlinkOrRevokeConnection({
    identity: example.identity,
    connectionId: example.googlePersonal.connectionId,
    mode: 'revoke_account',
  });
  assert.equal('denied' in revoked, false);
  if (!('denied' in revoked)) {
    assert.equal(revoked.connection.lifecycle, 'REVOKED');
    assert.equal(revoked.connection.tokenRef, null);
    assert.ok(revoked.connection.revokedAt);
    assert.ok(
      revoked.identity.revocationUnlinkState === 'partially_revoked' ||
        revoked.identity.revocationUnlinkState === 'fully_revoked',
    );
  }
});

test('identity resolution requires auth; agent identity; graph edges; tokens not in source', () => {
  const example = exampleFederatedIdentity(agent);

  const silentAssoc = associateProviderUnderXivIdentity({
    identity: example.identity,
    providers: [
      { provider: 'microsoft', providerSubjectId: 'ms-1' },
      { provider: 'google', providerSubjectId: 'g-1' },
    ],
    userAuthorized: false,
  });
  assert.equal('denied' in silentAssoc, true);

  const assoc = associateProviderUnderXivIdentity({
    identity: example.identity,
    providers: [
      { provider: 'microsoft', providerSubjectId: 'ms-1' },
      { provider: 'google', providerSubjectId: 'g-1' },
      { provider: 'github', providerSubjectId: 'gh-1' },
    ],
    userAuthorized: true,
  });
  assert.equal('denied' in assoc, false);

  const enrolled = enrollAgentIdentity({
    identity: example.identity,
    agent: {
      agentId: 'agent-home-1',
      skills: ['summarize'],
      tools: ['local_search'],
      computeBudget: 10,
      dataScopes: ['personal_universe_read'],
      heartbeat: null,
      returnPath: 'home_base',
    },
  });
  assert.equal('denied' in enrolled, false);
  if (!('denied' in enrolled)) {
    assert.equal(enrolled.agent.homeIdentity, example.identity.xivIdentityId);
    assert.equal(
      enrolled.agent.homeUniverse,
      example.identity.personalUniverse.universeId,
    );
  }

  const allowedEdge = checkNeuralGraphEdge({
    from: 'person',
    to: 'accounts',
    permissionRequired: 'identity.link_request',
    grantedPermissions: example.identity.permissions,
    universeId: example.identity.personalUniverse.universeId,
  });
  assert.equal(allowedEdge.allowed, true);

  const deniedEdge = checkNeuralGraphEdge({
    from: 'data',
    to: 'tasks',
    permissionRequired: 'erp.admin',
    grantedPermissions: example.identity.permissions,
    universeId: example.identity.personalUniverse.universeId,
    crossUniversePool: true,
  });
  assert.equal(deniedEdge.allowed, false);

  const tokenScan = assertProviderTokensNotInSource();
  assert.equal(tokenScan.clean, true);
  assert.ok(tokenScan.filesChecked.length >= 3);
});

test('cycle soft-wires ES32/ES31/ES30/ES25/ER16/ER14 (WAITING_DATA ok); L4 false; tip-land/PR denied', () => {
  const soft = es33SoftWireSnapshot(repoRoot);
  for (const presence of [
    soft.es32MissionDecomposition,
    soft.es31DynamicAgentTeamBuilder,
    soft.es30ReputationDomainTrust,
    soft.es25SkillCertification,
    soft.er16HomeBase,
    soft.er14OfflineBrain,
    soft.guardianRlsPattern,
  ]) {
    const state = softWireHopState(presence);
    assert.ok(state === 'AVAILABLE' || state === 'WAITING_DATA');
    assert.notEqual(state, 'FAIL');
  }
  // Presence ≠ VERIFIED — Home Base / ER14 may be PRESENT on this tip.
  assert.equal(typeof soft.er16HomeBase.present, 'boolean');
  assert.equal(typeof soft.er14OfflineBrain.present, 'boolean');

  const boot = bootstrapUnifiedIdentityFederation(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const isolation = probeGuardianRlsTenantUniverseIsolation({
    actor: agent,
    otherTenantId: 'ten-other',
    otherUniverseId: 'uni-other',
  });
  assert.equal('denied' in isolation, true);

  const approval = requireHumanApproval({
    approvalId: 'appr-1',
    actor: human,
    action: 'link_high_risk_provider',
  });
  assert.equal('denied' in approval, false);

  assert.equal(attemptTipLand().state, 'DENIED');
  assert.equal(attemptManagePullRequest().state, 'DENIED');

  const cycle = runUnifiedIdentityFederationCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 20);
  assert.equal(cycle.receipt.l4AutonomyEnabled, false);
  assert.equal(cycle.receipt.personalDriveToEmployer, false);
  assert.equal(cycle.receipt.erpToPersonalBrain, false);
  assert.equal(cycle.receipt.silentLinking, false);
  assert.equal(cycle.receipt.crossUniverseCredentialShare, false);
  assert.equal(cycle.receipt.autoScopeExpansion, false);
  assert.equal(cycle.receipt.providerTokensInGit, false);
  assert.equal(cycle.cycleEvidenceSha256.length, 64);

  const denyHop = cycle.hops.find((h) => h.hop === 'deny_silent_linking');
  assert.ok(denyHop);
  assert.equal(denyHop!.state, 'DENIED');
  const l4Hop = cycle.hops.find((h) => h.hop === 'l4_autonomy_false');
  assert.ok(l4Hop);
  assert.equal(l4Hop!.state, 'PASS');
  const softHop = cycle.hops.find((h) => h.hop === 'soft_wire_priors');
  assert.ok(softHop);
  assert.equal(softHop!.state, 'PASS');
});
