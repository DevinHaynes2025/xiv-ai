/**
 * 12D-07 — Architecture Reader + Adaptive Council UX (read-only).
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  UNIVERSE_KERNEL_GUARDRAILS,
  VALUATION_THEATER_ALLOWED,
  assertEthicsSafeCopy,
  buildArchitectureReaderSummary,
  buildArchitectureReaderView,
  createSimulatedUniverse,
  addCompany,
  addEconomicSignal,
  createSpatialCoordinate,
  exportArchitectureArtifacts,
  renderArchitectureHtml,
  renderArchitectureJson,
  renderArchitectureMarkdown,
  FOUNDER_TWIN_GUARDRAILS,
  FOUNDER_TWIN_REPLICA_HARD_CAP,
  FOUNDER_TWIN_MAX_DUTY_CYCLE,
  assertFounderTwinGuardrails,
  createFounderTwinRoster,
  registerTwinReplica,
  addSparseSimulationPathway,
  summarizeFounderTwinRoster,
} from './index';
import {
  ADAPTIVE_COUNCIL_GUARDRAILS,
  COUNCIL_UX_GUARDRAILS,
  buildCouncilQueueUxSummary,
  buildCouncilQueueUxView,
  exportCouncilQueueArtifacts,
  generateBatch,
  renderCouncilQueueHtml,
  renderCouncilQueueJson,
  renderCouncilQueueMarkdown,
  reprioritizeStoryQueue,
} from '../storyfactory';

assert.equal(UNIVERSE_KERNEL_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.productionAutoMerge, false);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.productionAutoDeploy, false);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.destructiveDbAutoApply, false);
assert.equal(COUNCIL_UX_GUARDRAILS.readOnly, true);
assert.equal(COUNCIL_UX_GUARDRAILS.productionAutoApply, false);
assert.equal(COUNCIL_UX_GUARDRAILS.productionAutoMerge, false);
assert.equal(COUNCIL_UX_GUARDRAILS.productionAutoDeploy, false);
assert.equal(COUNCIL_UX_GUARDRAILS.cloudAgentsDefaultWaitingIfUnbound, true);


assertFounderTwinGuardrails();
assert.equal(FOUNDER_TWIN_GUARDRAILS.bioCloningAllowed, false);
assert.equal(FOUNDER_TWIN_GUARDRAILS.alwaysOnInfiniteClonesAllowed, false);
assert.equal(FOUNDER_TWIN_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly, true);
assert.equal(FOUNDER_TWIN_GUARDRAILS.biologicalDnaCloningCapability, false);
assert.ok(FOUNDER_TWIN_REPLICA_HARD_CAP >= 1);
assert.ok(FOUNDER_TWIN_MAX_DUTY_CYCLE > 0 && FOUNDER_TWIN_MAX_DUTY_CYCLE <= 1);

let twinRoster = createFounderTwinRoster({ tenantId: 'xiv', cycleId: 'cycle-12d07' });
assert.equal(twinRoster.replicas.length, 0);
assert.equal(twinRoster.energyBudgetRemaining, FOUNDER_TWIN_GUARDRAILS.energyBudgetPerCycle);
twinRoster = registerTwinReplica(twinRoster, {
  replicaId: 'twin-1',
  kind: 'DIGITAL_TWIN',
  dutyCycle: 0.2,
  energyUsedThisCycle: 50,
  activeShardCount: 8,
});
assert.equal(twinRoster.replicas.length, 1);
assert.equal(twinRoster.energyBudgetRemaining, FOUNDER_TWIN_GUARDRAILS.energyBudgetPerCycle - 50);
assert.throws(() =>
  registerTwinReplica(twinRoster, {
    replicaId: 'twin-always-on',
    kind: 'DIGITAL_TWIN',
    dutyCycle: 1,
    energyUsedThisCycle: 1,
    activeShardCount: 1,
  }),
);
twinRoster = addSparseSimulationPathway(twinRoster);
assert.equal(twinRoster.sparsePathwayCount, 1);
const twinSummary = summarizeFounderTwinRoster(twinRoster);
assert.equal(twinSummary.bioCloningAllowed, false);
assert.equal(twinSummary.alwaysOnInfiniteClonesAllowed, false);
assert.equal(twinSummary.wormholesAreSparseSimulationPathwaysOnly, true);


let universe = createSimulatedUniverse({
  universeId: 'ux-sim',
  tenantId: 'xiv',
  label: 'UX SIMULATION layer',
});
universe = addCompany(universe, {
  companyId: 'co-ux',
  name: 'UX Mill',
  sector: 'ops',
  tenantId: 'xiv',
  location: createSpatialCoordinate({ lon: -87.6, lat: 41.8 }),
  memoryHeat: 'hot',
});
universe = addEconomicSignal(universe, {
  signalId: 'sig-ux',
  metric: 'customer_value',
  value: 0.8,
  unit: 'ratio',
  stance: 'OBSERVED',
});

const summary = buildArchitectureReaderSummary({ universe });
assert.equal(summary.layerKind, 'SIMULATION');
assert.equal(summary.companyCount, 1);

const md = renderArchitectureMarkdown(summary);
assert.match(md, /READ ONLY/);
assert.match(md, /SIMULATION/);
assert.match(md, /Memory heat/);
assert.doesNotMatch(md, /physical portal/i);
assert.doesNotMatch(md, /valuation theater/i);
assertEthicsSafeCopy(md, '12d07 architecture markdown');

const json = renderArchitectureJson(summary);
const parsed = JSON.parse(json);
assert.equal(parsed.readOnly, true);
assert.equal(parsed.productionAutoApply, false);
assert.equal(parsed.summary.universeId, 'ux-sim');

const html = renderArchitectureHtml(summary);
assert.match(html, /READ ONLY/);
assert.match(html, /<!DOCTYPE html>/);
assertEthicsSafeCopy(html, '12d07 architecture html');

const view = buildArchitectureReaderView(summary);
assert.equal(view.readOnly, true);
assert.equal(view.productionAutoApply, false);
assert.ok(view.markdown.includes('Architecture Reader'));
assert.ok(view.json.includes('"readOnly": true'));

const batch = generateBatch(7, 12);
const queue = reprioritizeStoryQueue({
  stories: batch.stories,
  availability: [
    { agent: 'LOCAL_RULES', online: true, local: true, canNetwork: false, maxConcurrent: 10 },
    { agent: 'OLLAMA', online: false, local: true, canNetwork: false, maxConcurrent: 5 },
    { agent: 'GROK', online: false, local: false, canNetwork: true, maxConcurrent: 3 },
  ],
});
assert.equal(queue.providerStatuses.find((s) => s.agent === 'GROK')?.status, 'WAITING_PROVIDER');

const councilSummary = buildCouncilQueueUxSummary({ queue, stories: batch.stories });
assert.equal(councilSummary.readOnly, true);
assert.equal(councilSummary.productionAutoApply, false);
assert.equal(councilSummary.productionAutoMerge, false);
assert.equal(councilSummary.productionAutoDeploy, false);
assert.ok(councilSummary.ranked.length === batch.stories.length);
assert.equal(councilSummary.ranked[0].priorityRank, 1);
assert.ok(councilSummary.ranked[0].composite >= councilSummary.ranked[councilSummary.ranked.length - 1].composite);
assert.deepEqual(
  [...councilSummary.scoreAxes],
  ['customerValue', 'technicalRisk', 'cost', 'security', 'dependencies', 'evidenceQuality'],
);
assert.ok(councilSummary.ranked.every((r) => typeof r.scores.customerValue === 'number'));
assert.ok(councilSummary.ranked.every((r) => typeof r.scores.evidenceQuality === 'number'));
assert.ok(
  councilSummary.ranked.some((r) => r.waitingProviders.includes('GROK')),
  'WAITING_PROVIDER honesty for unbound GROK',
);

const councilMd = renderCouncilQueueMarkdown(councilSummary);
assert.match(councilMd, /READ ONLY/);
assert.match(councilMd, /WAITING_PROVIDER/);
assert.match(councilMd, /customerValue/);
assert.doesNotMatch(councilMd, /auto-deploy production/i);

const councilJson = renderCouncilQueueJson(councilSummary);
const councilParsed = JSON.parse(councilJson);
assert.equal(councilParsed.readOnly, true);
assert.equal(councilParsed.productionAutoApply, false);

const councilHtml = renderCouncilQueueHtml(councilSummary);
assert.match(councilHtml, /READ ONLY/);
assert.match(councilHtml, /WAITING_PROVIDER/);

const councilView = buildCouncilQueueUxView(councilSummary);
assert.equal(councilView.readOnly, true);
assert.equal(councilView.productionAutoApply, false);

const outDir = mkdtempSync(join(tmpdir(), 'xiv-12d07-'));
try {
  const arch = exportArchitectureArtifacts({
    summary,
    outDir,
    basename: 'architecture-ux-sim',
  });
  assert.ok(readFileSync(arch.mdPath, 'utf8').includes('READ ONLY'));
  assert.equal(JSON.parse(readFileSync(arch.jsonPath, 'utf8')).universeId, 'ux-sim');
  assert.equal(JSON.parse(readFileSync(arch.jsonPath, 'utf8')).layerKind, 'SIMULATION');
  assert.ok(readFileSync(arch.htmlPath, 'utf8').includes('Architecture Reader'));

  const cq = exportCouncilQueueArtifacts({
    summary: councilSummary,
    outDir,
    basename: 'adaptive-council-queue',
  });
  assert.ok(readFileSync(cq.mdPath, 'utf8').includes('Ranked stories'));
  assert.equal(JSON.parse(readFileSync(cq.jsonPath, 'utf8')).readOnly, true);
  assert.ok(readFileSync(cq.htmlPath, 'utf8').includes('Provider seats'));
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

console.log(
  'XIV 12D-07 Architecture Reader + Adaptive Council UX + Founder Twin roster contracts hold (read-only, ethics, CAP/energy, WAITING_PROVIDER).',
);
