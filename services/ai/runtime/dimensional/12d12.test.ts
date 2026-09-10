/**
 * 12D-12 — Read-only Command Center / offline consumer of Checkpoint Ledger rows.
 * Soft-confirm: LOCAL / OFFLINE_PREFER_LOCAL; CLOUD_SANDBOX only if read-only + Gate intact.
 * Assertable: no identity mutation, autonomy flips, deploy authority, Policy Gate bypass,
 * second control plane, production auto / autonomousProduction*, Twin claim bans.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  AGENT_CHECKPOINT_LEDGER_GUARDRAILS,
  ATOMIC_DATA_CELL_GUARDRAILS,
  BUSINESS_BAR_METRICS,
  CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS,
  CHECKPOINT_LEDGER_CONSUMER_SAFE_ENVIRONMENTS,
  CHECKPOINT_LEDGER_CONSUMER_SCHEMA_VERSION,
  FOUNDER_TWIN_GUARDRAILS,
  HIGH_AUTONOMY_TARGETS,
  OFFLINE_PREFER_LOCAL,
  VALUATION_THEATER_ALLOWED,
  applyProductionFromConsumer,
  assertCheckpointLedgerConsumerTwinBans,
  buildAtomicDataCell,
  buildCheckpointLedgerConsumer,
  buildCheckpointLedgerMobileReady,
  buildCheckpointLedgerOfflineSnapshot,
  bypassPolicyGateViaConsumer,
  createAgentCheckpointLedger,
  flipConsumerAutonomy,
  hydrateLedgerFromMobileReady,
  mutateCheckpointIdentity,
  parseCheckpointLedgerFixture,
  serializeCheckpointLedgerFixture,
} from './index';
import { BUILDER_GUARDRAILS } from '../builder/policy';

// --- Twin / Gate / soft-confirm hard asserts ---
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.readOnly, true);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.OFFLINE_PREFER_LOCAL, true);
assert.equal(OFFLINE_PREFER_LOCAL, true);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.preferredExecution, 'LOCAL');
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.identityMutationAllowed, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.autonomyFlipAllowed, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.deployAuthority, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.productionAutoApply, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.productionAutoMerge, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.productionAutoDeploy, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.autonomousProductionDML, false);
assert.equal(BUILDER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(BUILDER_GUARDRAILS.autonomousProductionDML, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.policyGateBypassAllowed, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.secondControlPlane, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.checkpointLedgerIsSecondControlPlane, false);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.ledgerIsAppendOnlyAuditNotControlPlane, true);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.twinClaimBansAssertable, true);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.noDdl, true);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.noDml, true);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.noDeploy, true);
assert.equal(CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.ticket, '12D-12');
assert.equal(CHECKPOINT_LEDGER_CONSUMER_SCHEMA_VERSION, '12d12.1');
assert.deepEqual([...CHECKPOINT_LEDGER_CONSUMER_SAFE_ENVIRONMENTS], ['LOCAL', 'CLOUD_SANDBOX']);
assert.deepEqual([...CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.highAutonomyTargets], ['LOCAL', 'CLOUD_SANDBOX']);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(FOUNDER_TWIN_GUARDRAILS.bioCloningAllowed, false);
assert.equal(FOUNDER_TWIN_GUARDRAILS.alwaysOnInfiniteClonesAllowed, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.appendOnly, true);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.secondControlPlane, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.policyGateBypassAllowed, false);
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.agentCheckpointLedgerWire, 'WIRED');
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.checkpointLedgerConsumerWire, 'WIRED');
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.ticketFollowUp, '12D-12');
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed, false);
assert.ok(BUSINESS_BAR_METRICS.includes('adoption'));
assert.ok(BUSINESS_BAR_METRICS.includes('customer_value'));

assertCheckpointLedgerConsumerTwinBans();

// --- Seed 12D-11 ledger (LOCAL + CLOUD_SANDBOX + PRODUCTION label) ---
const ledger = createAgentCheckpointLedger();
const cell = buildAtomicDataCell({
  cellId: 'cell-12d12-ev',
  tenantId: 'xiv',
  body: { note: 'evidence for consumer' },
  provenance: ['local:12d12'],
  confidence: 0.85,
});

const e1 = ledger.append({
  xivAgent: 'GROK',
  model: 'grok-bot',
  story: 'US-12D-12',
  environment: 'LOCAL',
  filesChanged: [
    'services/ai/runtime/dimensional/checkpoint-ledger-consumer.ts',
    'services/ai/runtime/dimensional/12d12.test.ts',
  ],
  testsPassed: ['12d12.test.ts'],
  testsFailed: [],
  databaseMigrations: [],
  atomicCellIds: [cell.cellId],
  confidence: 0.92,
  createdAt: '2026-09-10T05:00:00.000Z',
});

const e2 = ledger.append({
  xivAgent: 'OLLAMA',
  model: 'llama-local',
  story: 'US-12D-12-b',
  environment: 'CLOUD_SANDBOX',
  filesChanged: [],
  testsPassed: ['12d11.test.ts'],
  testsFailed: [],
  databaseMigrations: [],
  confidence: 0.7,
  createdAt: '2026-09-10T05:01:00.000Z',
});

const e3 = ledger.append({
  xivAgent: 'CHATGPT',
  model: 'chatgpt-review',
  story: 'audit-prod-label',
  environment: 'PRODUCTION',
  confidence: 0.3,
  createdAt: '2026-09-10T05:02:00.000Z',
});

assert.equal(ledger.size(), 3);
assert.equal(e1.environment, 'LOCAL');
assert.equal(e2.environment, 'CLOUD_SANDBOX');
assert.equal(e3.environment, 'PRODUCTION');
assert.equal(e3.autonomousProductionDDL, false);
assert.equal(e3.secondControlPlane, false);

// --- mobileReady projection ---
const mobile = buildCheckpointLedgerMobileReady(ledger);
assert.equal(mobile.rowCount, 3);
assert.equal(mobile.readOnly, true);
assert.equal(mobile.OFFLINE_PREFER_LOCAL, true);
assert.equal(mobile.preferredExecution, 'LOCAL');
assert.equal(mobile.productionAutoApply, false);
assert.equal(mobile.policyGateBypassAllowed, false);
assert.equal(mobile.secondControlPlane, false);
assert.equal(mobile.ledgerIsAppendOnlyAuditNotControlPlane, true);
assert.equal(mobile.latestSequence, 3);
assert.equal(mobile.latestEntryId, e3.entryId);
assert.equal(mobile.byAgent.GROK, 1);
assert.equal(mobile.byAgent.OLLAMA, 1);
assert.equal(mobile.byAgent.CHATGPT, 1);
assert.equal(mobile.byEnvironment.LOCAL, 1);
assert.equal(mobile.byEnvironment.CLOUD_SANDBOX, 1);
assert.equal(mobile.byEnvironment.PRODUCTION, 1);
assert.equal(mobile.rows[0].filesChangedCount, 2);
assert.equal(mobile.rows[0].testsPassedCount, 1);
assert.deepEqual([...mobile.rows[0].atomicCellIds], ['cell-12d12-ev']);
assert.equal(mobile.rows[0].immutable, true);
assert.equal(mobile.rows[0].policyGateBypass, false);
assert.equal(mobile.rows[0].autonomousProductionDDL, false);
assert.ok(mobile.banners.some((b) => b.includes('READ ONLY')));
assert.ok(mobile.banners.some((b) => b.includes('OFFLINE_PREFER_LOCAL')));

// --- Command Center bundle (md/json/html) ---
const bundle = buildCheckpointLedgerConsumer(ledger, { title: '12D-12 test consumer' });
assert.equal(bundle.title, '12D-12 test consumer');
assert.equal(bundle.readOnly, true);
assert.equal(bundle.OFFLINE_PREFER_LOCAL, true);
assert.equal(bundle.preferredExecution, 'LOCAL');
assert.equal(bundle.productionAutoApply, false);
assert.equal(bundle.productionAutoMerge, false);
assert.equal(bundle.productionAutoDeploy, false);
assert.equal(bundle.autonomousProductionDDL, false);
assert.equal(bundle.autonomousProductionDML, false);
assert.equal(bundle.policyGateBypass, false);
assert.equal(bundle.secondControlPlane, false);
assert.equal(bundle.identityMutationAllowed, false);
assert.equal(bundle.autonomyFlipAllowed, false);
assert.equal(bundle.deployAuthority, false);
assert.equal(bundle.layerKind, 'SIMULATION');
assert.equal(bundle.sourceLedgerSize, 3);
assert.ok(bundle.contentChecksum.length > 8);
assert.ok(bundle.markdown.includes('READ ONLY'));
assert.ok(bundle.markdown.includes('US-12D-12'));
assert.ok(bundle.markdown.includes('OFFLINE_PREFER_LOCAL'));
assert.ok(bundle.html.includes('Checkpoint Ledger Consumer'));
assert.ok(bundle.html.includes('US-12D-12'));
assert.ok(bundle.json.includes('"readOnly": true'));
assert.ok(bundle.json.includes('"OFFLINE_PREFER_LOCAL": true'));
assert.ok(bundle.json.includes('"autonomousProductionDDL": false'));
assert.ok(bundle.productLaneFollowUp.includes('FOLLOW_UP'));

// --- Offline snapshot + optional fixture persist (still read-only vs production) ---
const snap = buildCheckpointLedgerOfflineSnapshot(ledger, {
  snapshotId: 'snap-12d12-1',
  tenantId: 'xiv',
  capturedAt: '2026-09-10T05:10:00.000Z',
});
assert.equal(snap.snapshotId, 'snap-12d12-1');
assert.equal(snap.tenantId, 'xiv');
assert.equal(snap.readOnly, true);
assert.equal(snap.productionAutoApply, false);
assert.equal(snap.liveCloudSyncClaimed, false);
assert.equal(snap.layerKind, 'SIMULATION');
assert.equal(snap.mobileReady.rowCount, 3);

const fixtureJson = serializeCheckpointLedgerFixture(snap);
const tmp = mkdtempSync(join(tmpdir(), 'xiv-12d12-'));
const fixturePath = join(tmp, 'checkpoint-ledger-fixture.json');
writeFileSync(fixturePath, fixtureJson, 'utf8');
const fromDisk = readFileSync(fixturePath, 'utf8');
const parsed = parseCheckpointLedgerFixture(fromDisk);
assert.equal(parsed.snapshotId, 'snap-12d12-1');
assert.equal(parsed.tenantId, 'xiv');
assert.equal(parsed.readOnly, true);
assert.equal(parsed.productionAutoApply, false);
assert.equal(parsed.liveCloudSyncClaimed, false);
assert.equal(parsed.mobileReady.rowCount, 3);
assert.equal(parsed.contentChecksum, snap.contentChecksum);

// hydrate is offline re-display only — fresh in-memory ledger, not production write-back
const hydrated = hydrateLedgerFromMobileReady(parsed.mobileReady);
assert.equal(hydrated.size(), 3);
assert.equal(hydrated.list()[0].xivAgent, 'GROK');
assert.equal(hydrated.list()[1].environment, 'CLOUD_SANDBOX');
assert.equal(hydrated.list()[2].environment, 'PRODUCTION');
assert.equal(hydrated.list()[2].autonomousProductionDDL, false);

// fixture reject if production flags flipped in raw JSON
assert.throws(
  () =>
    parseCheckpointLedgerFixture(
      JSON.stringify({
        snapshotId: 'bad',
        tenantId: 'xiv',
        capturedAt: '2026-09-10T05:10:00.000Z',
        contentChecksum: 'x',
        mobileReady: mobile,
        productionAutoApply: true,
      }),
    ),
  /read-only/,
);

// --- Banned surfaces (assertable soft-confirm conditions) ---
assert.throws(() => mutateCheckpointIdentity(ledger, e1.entryId), /identity mutation banned/);
assert.throws(() => flipConsumerAutonomy('DDL', true), /autonomy flip banned/);
assert.throws(() => flipConsumerAutonomy('deploy', true), /autonomy flip banned/);
assert.throws(() => bypassPolicyGateViaConsumer(), /NEVER bypass Policy Gate/);
assert.throws(() => applyProductionFromConsumer(), /production auto-apply\/merge\/deploy banned/);

// source ledger still append-only / Gate intact after consumer use
assert.throws(() => ledger.rewrite(e1.entryId), /append-only/);
assert.throws(() => ledger.delete(e1.entryId), /append-only/);
assert.throws(() => ledger.bypassPolicyGate(), /NEVER bypass Policy Gate/);
assert.throws(() => ledger.flipAutonomousProduction('DDL', true), /cannot flip autonomousProduction/);
assert.equal(ledger.size(), 3);

rmSync(tmp, { recursive: true, force: true });

console.log('12d12.test.ts OK — Checkpoint Ledger consumer read-only / OFFLINE_PREFER_LOCAL / Twin+Gate holds');
