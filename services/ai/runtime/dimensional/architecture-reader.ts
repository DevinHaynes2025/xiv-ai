/**
 * Architecture reader API — human-readable topology for Command Center / mobile.
 * Measurable summaries only; no valuation theater.
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

export function renderArchitectureMarkdown(summary: ArchitectureReaderSummary): string {
  const lines = [
    '# ' + summary.title,
    '',
    '- **Universe:** `' + summary.universeId + '` (layer: SIMULATION)',
    '- **Tenant:** `' + summary.tenantId + '`',
    '- **Fingerprint:** `' + summary.fingerprint + '`',
    '- **City tiers:** ' + summary.cityTiers.join(' → '),
    '- **Companies:** ' + String(summary.companyCount),
    '- **Supply links:** ' + String(summary.supplyLinkCount),
    '- **Agent population:** ' + String(summary.agentPopulationTotal),
    '- **World entities:** ' + String(summary.worldEntityCount),
    '- **Scenario branches:** ' + String(summary.branchCount),
    '- **Stances:** ' + (summary.stances.join(', ') || '(none)'),
    '- **Memory heat:** ' + JSON.stringify(summary.memoryHeatHistogram),
    '- **Business-bar metrics:** ' + (summary.businessBarMetricsPresent.join(', ') || '(none)'),
    '- **Route target:** ' + (summary.routeTarget ?? 'n/a'),
    '- **Route nodes:** ' + (summary.routeNodeIds.join(', ') || 'n/a'),
    '- **Manifest:** ' + (summary.manifestStatus ?? 'n/a'),
    '',
    '## Ethics',
    '',
    summary.ethicsNotice,
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

export function exportArchitectureArtifacts(input: {
  summary: ArchitectureReaderSummary;
  outDir: string;
  basename?: string;
}): { jsonPath: string; mdPath: string } {
  const basename = input.basename ?? 'universe-architecture-' + input.summary.universeId;
  mkdirSync(input.outDir, { recursive: true });
  const jsonPath = join(input.outDir, basename + '.json');
  const mdPath = join(input.outDir, basename + '.md');
  const md = renderArchitectureMarkdown(input.summary);
  writeFileSync(jsonPath, JSON.stringify(input.summary, null, 2), 'utf8');
  writeFileSync(mdPath, md, 'utf8');
  // ensure parent exists for callers that pass nested paths
  mkdirSync(dirname(jsonPath), { recursive: true });
  return { jsonPath, mdPath };
}
