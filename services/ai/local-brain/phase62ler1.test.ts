/**
 * 62L-ER1 — Real API Connection Registry denial + honesty tests.
 *
 * Script: npm run test:62ler1
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  API_CONNECTION_REGISTRY_FIELDS,
  API_CONNECTION_REGISTRY_FLOW,
  API_CONNECTION_STATES,
  API_CONNECTION_TRUTH_BOUNDARY,
  API_DATA_RIGHTS_CLASSES,
  ER1_AGENT_BOUNDS,
  ER1_DB_CANDIDATES_STATUS,
  ER1_LOCKS,
  ER1_MAY,
  ER1_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  LIVE_DATA_USE_PRECONDITIONS,
  NEXT_PHASE_TITLE,
  REAL_API_CONNECTION_REGISTRY_CYCLE,
  assertEr1LocksIntact,
  er1SoftWireSnapshot,
  evaluateLiveUsePreconditions,
  registryEntryMeansLiveUse,
  unknownRightsAllowed,
  type Er1Actor,
} from './real-api-connection-registry-types.ts';

import {
  attemptAutonomousSpendOrProvision,
  attemptBypassGuardianRls,
  attemptCredentialHarvesting,
  attemptExpandTenantUniverseAccess,
  attemptLiveDataUse,
  attemptLiveUseWithoutAuthorization,
  attemptPersistHiddenChainOfThought,
  attemptRecommendAsAct,
  attemptStoreRawSecrets,
  attemptUnknownRightsAsAllowed,
  attachCredentialRefAndScopes,
  authorizeConnection,
  bootstrapRealApiConnectionRegistry,
  exampleAuthorizedLiveConnection,
  probeConnectionHealth,
  probeGuardianRlsTenantUniverseIsolation,
  registerApiConnection,
  requireHumanApproval,
  returnEr1EvidenceToHomeBase,
  revokeConnection,
  runRealApiConnectionRegistryCycle,
} from './real-api-connection-registry-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er1Actor = {
  kind: 'api_connection_registry',
  id: 'acr-1',
  orgId: 'org-er1',
  tenantId: 'ten-er1',
  universeId: 'uni-er1',
  permissions: ['draft'],
};

const human: Er1Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er1',
  tenantId: 'ten-er1',
  universeId: 'uni-er1',
  permissions: ['approve_consequential'],
};

test('SoT label ER1 / #162; GitLab mirror not invented; next ER2; ER layer noted', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER1');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Real API Connection Registry/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER2/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
  assert.match(ER_LAYER_TITLE, /Historical Avatar/);
});

test('honesty locks: L4 false; registry≠live; no raw secrets; DB NOT_APPLIED', () => {
  assert.equal(assertEr1LocksIntact(), true);
  assert.equal(ER1_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER1_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER1_LOCKS.REGISTRY_ENTRY_EQ_LIVE_USE, false);
  assert.equal(ER1_LOCKS.STORE_RAW_SECRETS_IN_REGISTRY, false);
  assert.equal(ER1_LOCKS.CREDENTIAL_HARVESTING, false);
  assert.equal(ER1_LOCKS.UNKNOWN_RIGHTS_EQ_ALLOWED, false);
  assert.equal(ER1_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(registryEntryMeansLiveUse(), false);
  assert.equal(unknownRightsAllowed(), false);
  assert.equal(ER1_AGENT_BOUNDS.mayStoreRawSecrets, false);
  assert.equal(
    API_CONNECTION_TRUTH_BOUNDARY.registryAppearanceMeansDocumentedOnly,
    true,
  );
});

test('registry fields + states + rights + preconditions + flow encoded', () => {
  assert.deepEqual([...API_CONNECTION_REGISTRY_FIELDS], [
    'connectionId',
    'provider',
    'endpoint',
    'credentialRef',
    'scopes',
    'rateLimit',
    'dataRights',
    'authorization',
    'health',
    'revocation',
  ]);
  assert.ok(API_CONNECTION_STATES.includes('DOCUMENTED'));
  assert.ok(API_CONNECTION_STATES.includes('AUTHORIZED_LIVE'));
  assert.ok(API_CONNECTION_STATES.includes('REVOKED'));
  assert.ok(API_DATA_RIGHTS_CLASSES.includes('PUBLIC_OPEN'));
  assert.ok(API_DATA_RIGHTS_CLASSES.includes('UNKNOWN_RIGHTS'));
  assert.equal(LIVE_DATA_USE_PRECONDITIONS.length, 10);
  assert.ok(API_CONNECTION_REGISTRY_FLOW.includes('authorization_gate'));
  assert.ok(ER1_MAY.includes('allow_live_data_use_only_when_all_preconditions_met'));
  assert.ok(ER1_MUST_NOT.includes('treat_registry_entry_as_live_use_authorization'));
  assert.ok(ER1_MUST_NOT.includes('store_or_harvest_raw_secrets_in_registry'));
});

test('register documented; live use only after auth+rights+health; raw secret denied', () => {
  const documented = registerApiConnection({
    actor: agent,
    connectionId: 'c1',
    provider: 'ExampleAPI',
    endpoint: 'https://api.example.test/v1',
  });
  assert.ok(!('denied' in documented));
  assert.equal(documented.state, 'DOCUMENTED');
  assert.equal(documented.authorization, false);
  assert.equal(
    attemptLiveDataUse({ actor: agent, connection: documented }).state,
    'DENIED',
  );

  assert.equal(
    attachCredentialRefAndScopes({
      connection: documented,
      credentialRef: 'secret:raw-token-value',
      scopes: ['read'],
      rateLimit: {
        requestsPerMinute: 10,
        burst: 2,
        quotaPeriod: 'minute',
        remainingKnown: false,
      },
      dataRights: 'PUBLIC_OPEN',
    }).state,
    'DENIED',
  );
  assert.equal(
    attachCredentialRefAndScopes({
      connection: documented,
      credentialRef: 'vault:ok',
      scopes: ['read'],
      rateLimit: {
        requestsPerMinute: 10,
        burst: 2,
        quotaPeriod: 'minute',
        remainingKnown: false,
      },
      dataRights: 'PUBLIC_OPEN',
      attemptStoreRawSecret: true,
    }).state,
    'DENIED',
  );

  const { live } = exampleAuthorizedLiveConnection(agent, human);
  assert.equal(live.state, 'AUTHORIZED_LIVE');
  assert.equal(live.rawSecretPresent, false);
  const pre = evaluateLiveUsePreconditions(live);
  assert.equal(pre.ok, true);
  const use = attemptLiveDataUse({ actor: agent, connection: live });
  assert.ok(!('denied' in use));
  assert.equal(use.allowed, true);
  assert.equal(use.rawSecretUsed, false);
});

test('unknown rights + revocation + health failure block live use', () => {
  const unknown = registerApiConnection({
    actor: agent,
    connectionId: 'c-unknown',
    provider: 'Mystery',
    endpoint: 'https://mystery.invalid',
    dataRights: 'UNKNOWN_RIGHTS',
  });
  assert.ok(!('denied' in unknown));
  assert.equal(
    attemptLiveDataUse({ actor: agent, connection: unknown }).state,
    'DENIED',
  );
  assert.equal(attemptUnknownRightsAsAllowed().state, 'DENIED');

  const { live } = exampleAuthorizedLiveConnection(agent, human);
  const revoked = revokeConnection({ connection: live, reason: 'policy' });
  assert.equal(revoked.state, 'REVOKED');
  assert.equal(
    attemptLiveDataUse({ actor: agent, connection: revoked }).state,
    'DENIED',
  );

  const degraded = probeConnectionHealth({
    connection: live,
    health: 'AUTH_FAILED',
  });
  assert.equal(degraded.state, 'DEGRADED');
  assert.equal(
    attemptLiveDataUse({ actor: agent, connection: degraded }).state,
    'DENIED',
  );

  assert.equal(
    authorizeConnection({
      connection: unknown,
      human,
    }).state,
    'DENIED',
  );
});

test('authority denies hold', () => {
  assert.equal(attemptStoreRawSecrets().state, 'DENIED');
  assert.equal(attemptCredentialHarvesting().state, 'DENIED');
  assert.equal(attemptLiveUseWithoutAuthorization().state, 'DENIED');
  assert.equal(attemptBypassGuardianRls().state, 'DENIED');
  assert.equal(attemptExpandTenantUniverseAccess().state, 'DENIED');
  assert.equal(attemptPersistHiddenChainOfThought().state, 'DENIED');
  assert.equal(attemptAutonomousSpendOrProvision().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; EQ16 PRESENT; EQ14 WAITING_DATA', () => {
  const boot = bootstrapRealApiConnectionRegistry(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.registryFields.length, 10);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER2/);
  assert.match(boot.erLayer, /Data Fabric/);

  const soft = er1SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  assert.equal(soft.eq15PathwayPlasticity.present, true);
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);
  assert.match(soft.eq14NeuralPathwayArchitectureGraph.note, /WAITING_DATA/);
  assert.equal(soft.eq13ArchitectureReturnReceipt.present, true);

  const { live } = exampleAuthorizedLiveConnection(agent, human);
  const ev = returnEr1EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    connection: live,
    summary: 'registry advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(ev.rawSecretPresent, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runRealApiConnectionRegistryCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, REAL_API_CONNECTION_REGISTRY_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of REAL_API_CONNECTION_REGISTRY_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const eq16Hop = cycle.hops.find((h) => h.hop === 'eq16_soft_wire');
  assert.ok(eq16Hop);
  assert.equal(eq16Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.liveUse.allowed, true);
  assert.equal(cycle.connection.state, 'AUTHORIZED_LIVE');
});
