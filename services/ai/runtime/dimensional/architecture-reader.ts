/**
 * Architecture reader API — human-readable topology for Command Center / mobile.
 * Measurable summaries only; no valuation theater. READ-ONLY UX layer (12D-07).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { SimulatedUniverse, UniverseRoutePlan } from './universe-kernel';
import { universeFingerprint } from './universe-kernel';
import {
  BUSINESS_BAR_METRICS,
  UNIVERSE_KERNEL_GUARDRAILS,
  assertEthicsSafeCopy,
} from './universe-ethics';
import type { OfflineShardManifest, ManifestReconcileResult } from './offline-manifest';

export type ArchitectureReaderSummary = {
  title: string;
  universeId: string;
  tenantId: string;
  layerKind: 'SIMULATION';
  fingerprint: string;
  cityTiers: string[];
  companyCount: number;
  supplyLinkCount: number;
  agentPopulationTotal: number;
  worldEntityCount: number;
  branchCount: number;
  stances: string[];
  memoryHeatHistogram: Record<string, number>;
  businessBarMetricsPresent: string[];
  routeTarget: string | null;
  routeNodeIds: string[];
  guardrails: typeof UNIVERSE_KERNEL_GUARDRAILS;
  ethicsNotice: string;
  manifestStatus?: string;
};

/** Hardened multi-format view for Command Center / mobile (read-only). */
export type ArchitectureReaderView = {
  summary: ArchitectureReaderSummary;
  markdown: string;
  json: string;
  html: string;
  readOnly: true;
  productionAutoApply: false;
  layerKind: 'SIMULATION';
};

export function buildArchitectureReaderSummary(input: {
  universe: SimulatedUniverse;
  route?: UniverseRoutePlan | null;
  manifest?: OfflineShardManifest | null;
  reconcile?: ManifestReconcileResult | null;
}): ArchitectureReaderSummary {
  const { universe, route, reconcile } = input;
  const heatHist: Record<string, number> = { hot: 0, warm: 0, cold: 0, archive: 0 };
  for (const entity of universe.worldState) {
    heatHist[entity.memoryHeat] = (heatHist[entity.memoryHeat] ?? 0) + 1;
  }
  const stances = [
    ...new Set([
      ...universe.worldState.map((e) => e.stance),
      ...universe.branches.map((b) => b.stance),
      ...universe.economicSignals.map((s) => s.stance),
    ]),
  ].sort();
  const metricsPresent = [
    ...new Set(universe.economicSignals.map((s) => s.metric)),
  ].filter((m) => (BUSINESS_BAR_METRICS as readonly string[]).includes(m));

  const ethicsNotice =
    'Universes are SIMULATION layers only. Red-line capabilities remain disabled. GCP/Azure used for sandbox routing only.';
  assertEthicsSafeCopy(ethicsNotice, 'architecture-reader ethicsNotice');

  return {
    title: 'XIV Universe Simulation Kernel — Architecture Reader',
    universeId: universe.universeId,
    tenantId: universe.tenantId,
    layerKind: 'SIMULATION',
    fingerprint: universeFingerprint(universe),
    cityTiers: universe.cityNodes.map((n) => n.tier),
    companyCount: universe.companies.length,
    supplyLinkCount: universe.supplyLinks.length,
    agentPopulationTotal: universe.agentPopulations.reduce((sum, p) => sum + p.count, 0),
    worldEntityCount: universe.worldState.length,
    branchCount: universe.branches.length,
    stances,
    memoryHeatHistogram: heatHist,
    businessBarMetricsPresent: metricsPresent,
    routeTarget: route?.target ?? null,
    routeNodeIds: route?.multiCloudRoute?.nodeIds ?? [],
    guardrails: UNIVERSE_KERNEL_GUARDRAILS,
    ethicsNotice,
    manifestStatus: reconcile?.status,
  };
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return (Math.round(n * 1000) / 10).toFixed(1);
}

export function renderArchitectureMarkdown(summary: ArchitectureReaderSummary): string {
  const heatRows = Object.entries(summary.memoryHeatHistogram)
    .map(([tier, count]) => `| ${tier} | ${String(count)} |`)
    .join('\n');
  const lines = [
    '# ' + summary.title,
    '',
    '> **READ ONLY** — Command Center / mobile topology view. Never auto-applies production.',
    '',
    '## Identity',
    '',
    '| Field | Value |',
    '|-------|-------|',
    '| Universe | `' + summary.universeId + '` |',
    '| Layer | `' + summary.layerKind + '` |',
    '| Tenant | `' + summary.tenantId + '` |',
    '| Fingerprint | `' + summary.fingerprint + '` |',
    '| Manifest | ' + (summary.manifestStatus ?? 'n/a') + ' |',
    '',
    '## Topology',
    '',
    '| Metric | Count |',
    '|--------|------:|',
    '| City tiers | ' + String(summary.cityTiers.length) + ' |',
    '| Companies | ' + String(summary.companyCount) + ' |',
    '| Supply links | ' + String(summary.supplyLinkCount) + ' |',
    '| Agent population | ' + String(summary.agentPopulationTotal) + ' |',
    '| World entities | ' + String(summary.worldEntityCount) + ' |',
    '| Scenario branches | ' + String(summary.branchCount) + ' |',
    '',
    '- **City ladder:** ' + (summary.cityTiers.join(' → ') || '(none)'),
    '- **Stances:** ' + (summary.stances.join(', ') || '(none)'),
    '- **Business-bar metrics:** ' + (summary.businessBarMetricsPresent.join(', ') || '(none)'),
    '- **Route target:** ' + (summary.routeTarget ?? 'n/a'),
    '- **Route nodes:** ' + (summary.routeNodeIds.join(', ') || 'n/a'),
    '',
    '## Memory heat',
    '',
    '| Tier | Entities |',
    '|------|---------:|',
    heatRows || '| (none) | 0 |',
    '',
    '## Ethics',
    '',
    summary.ethicsNotice,
    '',
    '- productionAutoApply: **false**',
    '- L4_PRODUCTION_ENABLED: **false**',
    '- cloudProvidersAreSandboxRoutingOnly: **true**',
    '',
    '## Guardrails',
    '',
    '```json',
    JSON.stringify(summary.guardrails, null, 2),
    '```',
    '',
  ];
  const md = lines.join('\n');
  assertEthicsSafeCopy(md, 'architecture-reader markdown');
  return md;
}

/** Stable JSON string for mobile / Command Center payload. */
export function renderArchitectureJson(summary: ArchitectureReaderSummary): string {
  const payload = {
    readOnly: true as const,
    productionAutoApply: false as const,
    layerKind: summary.layerKind,
    summary,
  };
  const json = JSON.stringify(payload, null, 2);
  assertEthicsSafeCopy(json, 'architecture-reader json');
  return json;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Lightweight HTML artifact for local browse (no external assets). */
export function renderArchitectureHtml(summary: ArchitectureReaderSummary): string {
  const heatRows = Object.entries(summary.memoryHeatHistogram)
    .map(
      ([tier, count]) =>
        '<tr><td>' + escapeHtml(tier) + '</td><td>' + String(count) + '</td></tr>',
    )
    .join('');
  const html = [
    '<!DOCTYPE html>',
    '<html lang="en"><head><meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
    '<title>' + escapeHtml(summary.title) + '</title>',
    '<style>',
    'body{font-family:system-ui,sans-serif;max-width:880px;margin:2rem auto;padding:0 1rem;line-height:1.45;color:#122}',
    'h1,h2{color:#0b3d5c} table{border-collapse:collapse;width:100%;margin:0.75rem 0}',
    'th,td{border:1px solid #bcd;padding:0.4rem 0.6rem;text-align:left}',
    'th{background:#e8f2f8} .banner{background:#fff6e0;border:1px solid #e0c56a;padding:0.6rem 0.8rem;border-radius:6px}',
    'code{background:#f0f4f8;padding:0.1rem 0.3rem;border-radius:3px}',
    '</style></head><body>',
    '<p class="banner"><strong>READ ONLY</strong> — Architecture Reader for Command Center / mobile. Never auto-applies production.</p>',
    '<h1>' + escapeHtml(summary.title) + '</h1>',
    '<h2>Identity</h2>',
    '<table><tbody>',
    '<tr><th>Universe</th><td><code>' + escapeHtml(summary.universeId) + '</code></td></tr>',
    '<tr><th>Layer</th><td><code>' + escapeHtml(summary.layerKind) + '</code></td></tr>',
    '<tr><th>Tenant</th><td><code>' + escapeHtml(summary.tenantId) + '</code></td></tr>',
    '<tr><th>Fingerprint</th><td><code>' + escapeHtml(summary.fingerprint) + '</code></td></tr>',
    '<tr><th>Manifest</th><td>' + escapeHtml(summary.manifestStatus ?? 'n/a') + '</td></tr>',
    '</tbody></table>',
    '<h2>Topology</h2>',
    '<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>',
    '<tr><td>City ladder</td><td>' + escapeHtml(summary.cityTiers.join(' → ') || '(none)') + '</td></tr>',
    '<tr><td>Companies</td><td>' + String(summary.companyCount) + '</td></tr>',
    '<tr><td>Supply links</td><td>' + String(summary.supplyLinkCount) + '</td></tr>',
    '<tr><td>Agent population</td><td>' + String(summary.agentPopulationTotal) + '</td></tr>',
    '<tr><td>World entities</td><td>' + String(summary.worldEntityCount) + '</td></tr>',
    '<tr><td>Branches</td><td>' + String(summary.branchCount) + '</td></tr>',
    '<tr><td>Stances</td><td>' + escapeHtml(summary.stances.join(', ') || '(none)') + '</td></tr>',
    '<tr><td>Business-bar metrics</td><td>' +
      escapeHtml(summary.businessBarMetricsPresent.join(', ') || '(none)') +
      '</td></tr>',
    '<tr><td>Route target</td><td>' + escapeHtml(summary.routeTarget ?? 'n/a') + '</td></tr>',
    '<tr><td>Route nodes</td><td>' + escapeHtml(summary.routeNodeIds.join(', ') || 'n/a') + '</td></tr>',
    '</tbody></table>',
    '<h2>Memory heat</h2>',
    '<table><thead><tr><th>Tier</th><th>Entities</th></tr></thead><tbody>',
    heatRows || '<tr><td>(none)</td><td>0</td></tr>',
    '</tbody></table>',
    '<h2>Ethics</h2>',
    '<p>' + escapeHtml(summary.ethicsNotice) + '</p>',
    '<ul><li>productionAutoApply: false</li><li>L4_PRODUCTION_ENABLED: false</li>',
    '<li>cloudProvidersAreSandboxRoutingOnly: true</li></ul>',
    '<h2>Guardrails (JSON)</h2>',
    '<pre>' + escapeHtml(JSON.stringify(summary.guardrails, null, 2)) + '</pre>',
    '</body></html>',
  ].join('\n');
  assertEthicsSafeCopy(html, 'architecture-reader html');
  return html;
}

export function buildArchitectureReaderView(
  summary: ArchitectureReaderSummary,
): ArchitectureReaderView {
  return {
    summary,
    markdown: renderArchitectureMarkdown(summary),
    json: renderArchitectureJson(summary),
    html: renderArchitectureHtml(summary),
    readOnly: true,
    productionAutoApply: false,
    layerKind: 'SIMULATION',
  };
}

export function exportArchitectureArtifacts(input: {
  summary: ArchitectureReaderSummary;
  outDir: string;
  basename?: string;
}): { jsonPath: string; mdPath: string; htmlPath: string } {
  const basename = input.basename ?? 'universe-architecture-' + input.summary.universeId;
  mkdirSync(input.outDir, { recursive: true });
  const jsonPath = join(input.outDir, basename + '.json');
  const mdPath = join(input.outDir, basename + '.md');
  const htmlPath = join(input.outDir, basename + '.html');
  const view = buildArchitectureReaderView(input.summary);
  // JSON artifact stays summary-shaped for prior consumers; markdown/html are hardened views.
  writeFileSync(jsonPath, JSON.stringify(input.summary, null, 2), 'utf8');
  writeFileSync(mdPath, view.markdown, 'utf8');
  writeFileSync(htmlPath, view.html, 'utf8');
  mkdirSync(dirname(jsonPath), { recursive: true });
  return { jsonPath, mdPath, htmlPath };
}

/** @internal helper retained for score formatting in related UX modules */
export function architectureScoreLabel(n: number): string {
  return fmtPct(n);
}
