/**
 * 12D-12 — Read-only Command Center / offline consumer of Checkpoint Ledger rows.
 * Consumes append-only ledger entries from 12D-11. mobileReady + offline snapshot
 * friendly views (md/json/html). Optional fixture persist remains read-only vs production.
 *
 * NEVER production auto-apply/merge/deploy; NEVER Policy Gate bypass; NEVER second control plane.
 * LOCAL / OFFLINE_PREFER_LOCAL; CLOUD_SANDBOX only while read-only + Gate intact.
 * No identity mutation, autonomy flips, or deploy authority. Twin claim bans assertable.
 */
import { isomorphicContentHash } from './datagene';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
} from './universe-ethics';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { FOUNDER_TWIN_GUARDRAILS } from './founder-twin-roster';
import { ATOMIC_DATA_CELL_GUARDRAILS } from './atomic-data-cell';
import { OFFLINE_PREFER_LOCAL } from './ollama-local-writer';
import {
  AGENT_CHECKPOINT_LEDGER_GUARDRAILS,
  AGENT_CHECKPOINT_LEDGER_SCHEMA_VERSION,
  assertAgentCheckpointTwinBans,
  createAgentCheckpointLedger,
  type AgentCheckpointLedger,
  type AgentCheckpointLedgerEntry,
  type CheckpointEnvironmentLabel,
  type CheckpointXivAgent,
} from './agent-checkpoint-ledger';

export const CHECKPOINT_LEDGER_CONSUMER_SCHEMA_VERSION = '12d12.1' as const;

/** Soft-confirm environments for the consumer (read-only + Gate intact). */
export const CHECKPOINT_LEDGER_CONSUMER_SAFE_ENVIRONMENTS = ['LOCAL', 'CLOUD_SANDBOX'] as const;

export const CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS = {
  readOnly: true as const,
  OFFLINE_PREFER_LOCAL: true as const,
  preferredExecution: 'LOCAL' as const,
  /** CLOUD_SANDBOX allowed only while consumer stays read-only and Policy Gate intact. */
  cloudSandboxAllowedIfReadOnlyAndGateIntact: true as const,
  identityMutationAllowed: false as const,
  autonomyFlipAllowed: false as const,
  deployAuthority: false as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  policyGateBypassAllowed: false as const,
  secondControlPlane: false as const,
  checkpointLedgerIsSecondControlPlane: false as const,
  /** Ledger remains append-only audit — consumer never becomes a control plane. */
  ledgerIsAppendOnlyAuditNotControlPlane: true as const,
  checkpointIsReadReviewOnly: true as const,
  chatgptAuthorityToFlipAutonomousProduction: false as const,
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  businessBarMetrics: BUSINESS_BAR_METRICS,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  twinClaimBansAssertable: true as const,
  bioCloningAllowed: false as const,
  alwaysOnInfiniteClonesAllowed: false as const,
  atomDbClaimAllowed: false as const,
  noDdl: true as const,
  noDml: true as const,
  noDeploy: true as const,
  ticket: '12D-12' as const,
} as const;

export type CheckpointRowPreview = {
  entryId: string;
  sequence: number;
  xivAgent: CheckpointXivAgent;
  model: string;
  story: string;
  environment: CheckpointEnvironmentLabel;
  confidence: number;
  testsPassedCount: number;
  testsFailedCount: number;
  filesChangedCount: number;
  databaseMigrationsCount: number;
  debriefId: string | null;
  evidenceHash: string;
  atomicCellIds: readonly string[];
  createdAt: string;
  immutable: true;
  policyGateBypass: false;
  secondControlPlane: false;
  autonomousProductionDDL: false;
  autonomousProductionDML: false;
};

export type CheckpointLedgerMobileReady = {
  schemaVersion: typeof CHECKPOINT_LEDGER_CONSUMER_SCHEMA_VERSION;
  rowCount: number;
  rows: CheckpointRowPreview[];
  byAgent: Readonly<Record<string, number>>;
  byEnvironment: Readonly<Record<string, number>>;
  latestSequence: number | null;
  latestEntryId: string | null;
  banners: string[];
  OFFLINE_PREFER_LOCAL: true;
  preferredExecution: 'LOCAL';
  readOnly: true;
  productionAutoApply: false;
  policyGateBypassAllowed: false;
  secondControlPlane: false;
  ledgerIsAppendOnlyAuditNotControlPlane: true;
};

export type CheckpointLedgerConsumerBundle = {
  title: string;
  mobileReady: CheckpointLedgerMobileReady;
  markdown: string;
  html: string;
  json: string;
  contentChecksum: string;
  readOnly: true;
  productionAutoApply: false;
  productionAutoMerge: false;
  productionAutoDeploy: false;
  autonomousProductionDDL: false;
  autonomousProductionDML: false;
  policyGateBypass: false;
  secondControlPlane: false;
  identityMutationAllowed: false;
  autonomyFlipAllowed: false;
  deployAuthority: false;
  OFFLINE_PREFER_LOCAL: true;
  preferredExecution: 'LOCAL';
  layerKind: 'SIMULATION';
  ethicsNotice: string;
  guardrails: typeof CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS;
  sourceLedgerSize: number;
  productLaneFollowUp: string;
};

export type CheckpointLedgerOfflineSnapshot = {
  snapshotId: string;
  tenantId: string;
  schemaVersion: typeof CHECKPOINT_LEDGER_CONSUMER_SCHEMA_VERSION;
  contentChecksum: string;
  capturedAt: string;
  mobileReady: CheckpointLedgerMobileReady;
  markdown: string;
  html: string;
  json: string;
  readOnly: true;
  productionAutoApply: false;
  liveCloudSyncClaimed: false;
  layerKind: 'SIMULATION';
  ethicsNotice: string;
  guardrails: typeof CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS;
};

function assertConsumerGuardrails(): void {
  if (!CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.readOnly) {
    throw new Error('readOnly must remain true');
  }
  if (!CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.OFFLINE_PREFER_LOCAL || !OFFLINE_PREFER_LOCAL) {
    throw new Error('OFFLINE_PREFER_LOCAL must remain true');
  }
  if (CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.identityMutationAllowed) {
    throw new Error('identityMutationAllowed must remain false');
  }
  if (CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.autonomyFlipAllowed) {
    throw new Error('autonomyFlipAllowed must remain false');
  }
  if (CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.deployAuthority) {
    throw new Error('deployAuthority must remain false');
  }
  if (
    CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.productionAutoApply ||
    CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.productionAutoMerge ||
    CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.productionAutoDeploy
  ) {
    throw new Error('production auto flags must remain false');
  }
  if (
    CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.autonomousProductionDDL ||
    CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.autonomousProductionDML ||
    BUILDER_GUARDRAILS.autonomousProductionDDL ||
    BUILDER_GUARDRAILS.autonomousProductionDML
  ) {
    throw new Error('autonomousProductionDDL/DML must remain false');
  }
  if (CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.policyGateBypassAllowed) {
    throw new Error('policyGateBypassAllowed must remain false — NEVER bypass Policy Gate');
  }
  if (
    CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.secondControlPlane ||
    CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.checkpointLedgerIsSecondControlPlane ||
    AGENT_CHECKPOINT_LEDGER_GUARDRAILS.secondControlPlane
  ) {
    throw new Error('checkpoint ledger consumer must NEVER be a second production control plane');
  }
  if (!CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.ledgerIsAppendOnlyAuditNotControlPlane) {
    throw new Error('ledger must remain append-only audit, not a control plane');
  }
  if (!AGENT_CHECKPOINT_LEDGER_GUARDRAILS.appendOnly) {
    throw new Error('source ledger appendOnly must remain true');
  }
  if (!CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.twinClaimBansAssertable) {
    throw new Error('twinClaimBansAssertable must remain true');
  }
  if (FOUNDER_TWIN_GUARDRAILS.bioCloningAllowed || FOUNDER_TWIN_GUARDRAILS.alwaysOnInfiniteClonesAllowed) {
    throw new Error('Founder Twin claim bans must hold');
  }
  if (ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed || CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.atomDbClaimAllowed) {
    throw new Error('atomDbClaimAllowed must remain false');
  }
  if (VALUATION_THEATER_ALLOWED) {
    throw new Error('VALUATION_THEATER_ALLOWED must remain false');
  }
  const targets = CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS.highAutonomyTargets;
  if (!targets.includes('LOCAL') || !targets.includes('CLOUD_SANDBOX') || targets.length !== 2) {
    throw new Error('highAutonomyTargets must be LOCAL|CLOUD_SANDBOX only');
  }
  assertAgentCheckpointTwinBans();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toRowPreview(entry: AgentCheckpointLedgerEntry): CheckpointRowPreview {
  return {
    entryId: entry.entryId,
    sequence: entry.sequence,
    xivAgent: entry.xivAgent,
    model: entry.model,
    story: entry.story,
    environment: entry.environment,
    confidence: entry.confidence,
    testsPassedCount: entry.testsPassed.length,
    testsFailedCount: entry.testsFailed.length,
    filesChangedCount: entry.filesChanged.length,
    databaseMigrationsCount: entry.databaseMigrations.length,
    debriefId: entry.debriefId,
    evidenceHash: entry.evidenceHash,
    atomicCellIds: entry.atomicCellIds,
    createdAt: entry.createdAt,
    immutable: true,
    policyGateBypass: false,
    secondControlPlane: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
  };
}

/**
 * Build a mobileReady / offline-friendly projection of checkpoint ledger rows.
 * Read-only: does not mutate the ledger or flip any production flags.
 */
export function buildCheckpointLedgerMobileReady(
  ledger: AgentCheckpointLedger,
): CheckpointLedgerMobileReady {
  assertConsumerGuardrails();
  const entries = ledger.list();
  const rows = entries.map(toRowPreview);
  const byAgent: Record<string, number> = {};
  const byEnvironment: Record<string, number> = {};
  for (const row of rows) {
    byAgent[row.xivAgent] = (byAgent[row.xivAgent] ?? 0) + 1;
    byEnvironment[row.environment] = (byEnvironment[row.environment] ?? 0) + 1;
  }
  const latest = rows.length ? rows[rows.length - 1] : null;
  const banners = [
    'READ ONLY — Checkpoint Ledger consumer (12D-12)',
    'OFFLINE_PREFER_LOCAL — no production auto-apply/merge/deploy',
    'Ledger is append-only audit — NOT a second control plane',
    'NEVER Policy Gate bypass; no identity mutation / autonomy flips / deploy authority',
    'High-autonomy surfaces: LOCAL | CLOUD_SANDBOX only (Gate intact)',
  ];
  return {
    schemaVersion: CHECKPOINT_LEDGER_CONSUMER_SCHEMA_VERSION,
    rowCount: rows.length,
    rows: Object.freeze([...rows]) as CheckpointRowPreview[],
    byAgent: Object.freeze({ ...byAgent }),
    byEnvironment: Object.freeze({ ...byEnvironment }),
    latestSequence: latest?.sequence ?? null,
    latestEntryId: latest?.entryId ?? null,
    banners: Object.freeze([...banners]) as string[],
    OFFLINE_PREFER_LOCAL: true,
    preferredExecution: 'LOCAL',
    readOnly: true,
    productionAutoApply: false,
    policyGateBypassAllowed: false,
    secondControlPlane: false,
    ledgerIsAppendOnlyAuditNotControlPlane: true,
  };
}

function renderMarkdown(mobileReady: CheckpointLedgerMobileReady, ethicsNotice: string): string {
  const lines = [
    '# XIV Command Center — Checkpoint Ledger Consumer (12D-12)',
    '',
    '> **READ ONLY** — Offline / mobileReady view of append-only Agent Checkpoint Ledger rows.',
    '> Never auto-applies production. Never bypasses Policy Gate. Not a second control plane.',
    '',
    ethicsNotice,
    '',
    '## Guardrails',
    '',
    '- readOnly: **true**',
    '- OFFLINE_PREFER_LOCAL: **true**',
    '- preferredExecution: **LOCAL**',
    '- productionAutoApply / Merge / Deploy: **false**',
    '- autonomousProductionDDL / DML: **false**',
    '- policyGateBypassAllowed: **false**',
    '- secondControlPlane: **false**',
    '- identityMutationAllowed: **false**',
    '- autonomyFlipAllowed: **false**',
    '- deployAuthority: **false**',
    '- twinClaimBansAssertable: **true**',
    '- source ledger schema: `' + AGENT_CHECKPOINT_LEDGER_SCHEMA_VERSION + '`',
    '',
    '## Summary',
    '',
    '| Field | Value |',
    '|-------|-------|',
    '| Rows | ' + String(mobileReady.rowCount) + ' |',
    '| Latest sequence | ' + String(mobileReady.latestSequence ?? '-') + ' |',
    '| Latest entryId | `' + (mobileReady.latestEntryId ?? '-') + '` |',
    '',
    '### By agent',
    '',
  ];
  for (const [agent, count] of Object.entries(mobileReady.byAgent)) {
    lines.push('- **' + agent + '**: ' + String(count));
  }
  if (!Object.keys(mobileReady.byAgent).length) lines.push('- _(none)_');
  lines.push('', '### By environment (label)', '');
  for (const [env, count] of Object.entries(mobileReady.byEnvironment)) {
    lines.push('- **' + env + '**: ' + String(count) + (env === 'PRODUCTION' ? ' _(audit label only)_' : ''));
  }
  if (!Object.keys(mobileReady.byEnvironment).length) lines.push('- _(none)_');
  lines.push(
    '',
    '## Rows',
    '',
    '| Seq | Agent | Model | Story | Env | Conf | Pass | Fail |',
    '|----:|-------|-------|-------|-----|-----:|-----:|-----:|',
  );
  for (const row of mobileReady.rows) {
    lines.push(
      '| ' +
        String(row.sequence) +
        ' | ' +
        row.xivAgent +
        ' | ' +
        row.model +
        ' | ' +
        row.story +
        ' | ' +
        row.environment +
        ' | ' +
        String(row.confidence) +
        ' | ' +
        String(row.testsPassedCount) +
        ' | ' +
        String(row.testsFailedCount) +
        ' |',
    );
  }
  if (!mobileReady.rows.length) lines.push('| — | — | — | — | — | — | — | — |');
  lines.push('', '## Banners', '');
  for (const b of mobileReady.banners) lines.push('- ' + b);
  const md = lines.join('\n');
  assertEthicsSafeCopy(md, '12d12 checkpoint ledger consumer markdown');
  return md;
}

function renderHtml(mobileReady: CheckpointLedgerMobileReady, ethicsNotice: string): string {
  const rowHtml = mobileReady.rows
    .map(
      (r) =>
        '<tr><td>' +
        String(r.sequence) +
        '</td><td>' +
        escapeHtml(r.xivAgent) +
        '</td><td>' +
        escapeHtml(r.model) +
        '</td><td>' +
        escapeHtml(r.story) +
        '</td><td>' +
        escapeHtml(r.environment) +
        '</td><td>' +
        String(r.confidence) +
        '</td><td>' +
        String(r.testsPassedCount) +
        '</td><td>' +
        String(r.testsFailedCount) +
        '</td></tr>',
    )
    .join('');
  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>XIV Checkpoint Ledger Consumer 12D-12</title>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>' +
    '<style>body{font-family:system-ui,sans-serif;margin:1rem;background:#0b1020;color:#e8eefc}table{border-collapse:collapse;width:100%}th,td{border:1px solid #334;padding:.4rem;text-align:left}th{background:#1a2438}.banner{color:#9cf;margin:.25rem 0}.readonly{color:#f8a}.notice{opacity:.85}</style></head><body>' +
    '<h1>Checkpoint Ledger Consumer (12D-12)</h1>' +
    '<p class="readonly"><strong>READ ONLY</strong> — OFFLINE_PREFER_LOCAL — no production auto / no Policy Gate bypass / not a control plane</p>' +
    '<p class="notice">' +
    escapeHtml(ethicsNotice) +
    '</p>' +
    '<p>Rows: <strong>' +
    String(mobileReady.rowCount) +
    '</strong> · Latest seq: <strong>' +
    String(mobileReady.latestSequence ?? '-') +
    '</strong></p>' +
    '<table><thead><tr><th>Seq</th><th>Agent</th><th>Model</th><th>Story</th><th>Env</th><th>Conf</th><th>Pass</th><th>Fail</th></tr></thead><tbody>' +
    (rowHtml || '<tr><td colspan="8">(empty ledger)</td></tr>') +
    '</tbody></table>' +
    '<h2>Banners</h2>' +
    mobileReady.banners.map((b) => '<p class="banner">' + escapeHtml(b) + '</p>').join('') +
    '</body></html>';
  assertEthicsSafeCopy(html, '12d12 checkpoint ledger consumer html');
  return html;
}

/**
 * Build Command Center / offline consumer bundle (md + json + html) from a 12D-11 ledger.
 */
export function buildCheckpointLedgerConsumer(
  ledger: AgentCheckpointLedger,
  opts?: { title?: string },
): CheckpointLedgerConsumerBundle {
  assertConsumerGuardrails();
  const mobileReady = buildCheckpointLedgerMobileReady(ledger);
  const ethicsNotice =
    '12D-12 Checkpoint Ledger consumer is LOCAL / OFFLINE_PREFER_LOCAL, read-only. ' +
    'Ledger rows are append-only audit evidence — not deploy authority. Twin claim bans hold. ' +
    'SIMULATION layer only. NEVER Policy Gate bypass; NEVER second control plane; NEVER production auto.';
  assertEthicsSafeCopy(ethicsNotice, '12d12 checkpoint ledger consumer ethics');
  const markdown = renderMarkdown(mobileReady, ethicsNotice);
  const html = renderHtml(mobileReady, ethicsNotice);
  const json = JSON.stringify(
    {
      schemaVersion: CHECKPOINT_LEDGER_CONSUMER_SCHEMA_VERSION,
      mobileReady,
      readOnly: true,
      productionAutoApply: false,
      productionAutoMerge: false,
      productionAutoDeploy: false,
      autonomousProductionDDL: false,
      autonomousProductionDML: false,
      policyGateBypass: false,
      secondControlPlane: false,
      identityMutationAllowed: false,
      autonomyFlipAllowed: false,
      deployAuthority: false,
      OFFLINE_PREFER_LOCAL: true,
      preferredExecution: 'LOCAL',
      layerKind: 'SIMULATION',
      ethicsNotice,
      guardrails: CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS,
    },
    null,
    2,
  );
  assertEthicsSafeCopy(json, '12d12 checkpoint ledger consumer json');
  const contentChecksum = isomorphicContentHash(json);
  return {
    title: opts?.title ?? 'XIV Command Center — Checkpoint Ledger (12D-12)',
    mobileReady,
    markdown,
    html,
    json,
    contentChecksum,
    readOnly: true,
    productionAutoApply: false,
    productionAutoMerge: false,
    productionAutoDeploy: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
    policyGateBypass: false,
    secondControlPlane: false,
    identityMutationAllowed: false,
    autonomyFlipAllowed: false,
    deployAuthority: false,
    OFFLINE_PREFER_LOCAL: true,
    preferredExecution: 'LOCAL',
    layerKind: 'SIMULATION',
    ethicsNotice,
    guardrails: CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS,
    sourceLedgerSize: ledger.size(),
    productLaneFollowUp:
      'Product-lane React Native wire remains FOLLOW_UP — this module is isomorphic research only.',
  };
}

/** Offline snapshot-friendly view (in-memory; optional disk via serialize/parse). */
export function buildCheckpointLedgerOfflineSnapshot(
  ledger: AgentCheckpointLedger,
  input: { snapshotId: string; tenantId: string; capturedAt?: string },
): CheckpointLedgerOfflineSnapshot {
  assertConsumerGuardrails();
  if (!input.snapshotId || !input.tenantId) {
    throw new TypeError('snapshotId and tenantId are required');
  }
  const bundle = buildCheckpointLedgerConsumer(ledger);
  return {
    snapshotId: input.snapshotId,
    tenantId: input.tenantId,
    schemaVersion: CHECKPOINT_LEDGER_CONSUMER_SCHEMA_VERSION,
    contentChecksum: bundle.contentChecksum,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    mobileReady: bundle.mobileReady,
    markdown: bundle.markdown,
    html: bundle.html,
    json: bundle.json,
    readOnly: true,
    productionAutoApply: false,
    liveCloudSyncClaimed: false,
    layerKind: 'SIMULATION',
    ethicsNotice: bundle.ethicsNotice,
    guardrails: CHECKPOINT_LEDGER_CONSUMER_GUARDRAILS,
  };
}

/** Isomorphic fixture serialize (caller writes bytes). Still read-only vs production. */
export function serializeCheckpointLedgerFixture(snapshot: CheckpointLedgerOfflineSnapshot): string {
  assertConsumerGuardrails();
  const json = JSON.stringify(
    {
      schemaVersion: snapshot.schemaVersion,
      snapshotId: snapshot.snapshotId,
      tenantId: snapshot.tenantId,
      contentChecksum: snapshot.contentChecksum,
      capturedAt: snapshot.capturedAt,
      mobileReady: snapshot.mobileReady,
      readOnly: true as const,
      productionAutoApply: false as const,
      liveCloudSyncClaimed: false as const,
      layerKind: 'SIMULATION' as const,
      ethicsNotice: snapshot.ethicsNotice,
      guardrails: {
        OFFLINE_PREFER_LOCAL: true,
        policyGateBypassAllowed: false,
        secondControlPlane: false,
        identityMutationAllowed: false,
        autonomyFlipAllowed: false,
        deployAuthority: false,
        autonomousProductionDDL: false,
        autonomousProductionDML: false,
        highAutonomyTargets: ['LOCAL', 'CLOUD_SANDBOX'],
        twinClaimBansAssertable: true,
      },
    },
    null,
    2,
  );
  assertEthicsSafeCopy(json, '12d12 checkpoint ledger fixture');
  return json;
}

/**
 * Parse fixture JSON back into an offline snapshot projection.
 * Fixture persist is optional and remains read-only relative to production (no DDL/DML/deploy).
 */
export function parseCheckpointLedgerFixture(json: string): {
  snapshotId: string;
  tenantId: string;
  capturedAt: string;
  contentChecksum: string;
  mobileReady: CheckpointLedgerMobileReady;
  readOnly: true;
  productionAutoApply: false;
  liveCloudSyncClaimed: false;
} {
  assertConsumerGuardrails();
  const raw = JSON.parse(json) as {
    snapshotId: string;
    tenantId: string;
    capturedAt: string;
    contentChecksum: string;
    mobileReady: CheckpointLedgerMobileReady;
    readOnly?: boolean;
    productionAutoApply?: boolean;
    liveCloudSyncClaimed?: boolean;
  };
  if (!raw.snapshotId || !raw.tenantId || !raw.mobileReady) {
    throw new TypeError('invalid checkpoint ledger fixture');
  }
  if (raw.productionAutoApply === true || raw.liveCloudSyncClaimed === true) {
    throw new Error('fixture must remain read-only with liveCloudSyncClaimed false');
  }
  return {
    snapshotId: raw.snapshotId,
    tenantId: raw.tenantId,
    capturedAt: raw.capturedAt,
    contentChecksum: raw.contentChecksum,
    mobileReady: raw.mobileReady,
    readOnly: true,
    productionAutoApply: false,
    liveCloudSyncClaimed: false,
  };
}

/**
 * Rebuild a ledger from fixture row previews for offline re-display only.
 * Does not grant write-back to production; appends into a fresh in-memory ledger.
 */
export function hydrateLedgerFromMobileReady(
  mobileReady: CheckpointLedgerMobileReady,
): AgentCheckpointLedger {
  assertConsumerGuardrails();
  const ledger = createAgentCheckpointLedger();
  for (const row of mobileReady.rows) {
    ledger.append({
      xivAgent: row.xivAgent,
      model: row.model,
      story: row.story,
      environment: row.environment,
      confidence: row.confidence,
      evidenceHash: row.evidenceHash,
      debriefId: row.debriefId,
      atomicCellIds: row.atomicCellIds,
      createdAt: row.createdAt,
      filesChanged: [],
      testsPassed: [],
      testsFailed: [],
      databaseMigrations: [],
    });
  }
  return ledger;
}

/** Explicitly banned — consumer cannot mutate agent identity. */
export function mutateCheckpointIdentity(_ledger: AgentCheckpointLedger, _entryId: string): never {
  throw new Error('identity mutation banned — 12D-12 consumer is read-only');
}

/** Explicitly banned — no autonomy flips. */
export function flipConsumerAutonomy(_flag: 'DDL' | 'DML' | 'deploy', _value: boolean): never {
  throw new Error('autonomy flip banned — 12D-12 consumer has no deploy/autonomy authority');
}

/** Explicitly banned — never bypass Policy Gate. */
export function bypassPolicyGateViaConsumer(): never {
  throw new Error('NEVER bypass Policy Gate via checkpoint ledger consumer');
}

/** Explicitly banned — never production apply/merge/deploy. */
export function applyProductionFromConsumer(): never {
  throw new Error('production auto-apply/merge/deploy banned — 12D-12 is read-only offline consumer');
}

export function assertCheckpointLedgerConsumerTwinBans(): void {
  assertConsumerGuardrails();
  if (!UNIVERSES_ARE_SIMULATION_LAYERS_ONLY) {
    throw new Error('universes must remain SIMULATION layers only');
  }
  if (FOUNDER_TWIN_GUARDRAILS.biologicalDnaCloningCapability) {
    throw new Error('biological DNA cloning capability must remain false');
  }
}
