/**
 * 12D-08 — Thin Command Center / mobile-ready Architecture Reader + Council consumer.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ARCH_READER_CONSUMER_GUARDRAILS,
  FOUNDER_TWIN_MAX_DUTY_CYCLE,
  FOUNDER_TWIN_REPLICA_HARD_CAP,
  ROSTER_DUTY_SCHEDULER_GUARDRAILS,
  UNIVERSE_KERNEL_GUARDRAILS,
  VALUATION_THEATER_ALLOWED,
  addCompany,
  addEconomicSignal,
  addSparseSimulationPathway,
  assertEthicsSafeCopy,
  buildArchitectureReaderConsumer,
  buildArchitectureReaderSummary,
  buildArchitectureReaderView,
  buildCommandCenterArchConsumer,
  createFounderTwinRoster,
  createSimulatedUniverse,
  createSpatialCoordinate,
  planRosterDutyCycle,
  registerTwinReplica,
  summarizeDutyPlan,
} from './index';
import {
  COUNCIL_UX_GUARDRAILS,
  buildCouncilQueueUxSummary,
  buildCouncilQueueUxView,
  generateBatch,
  reprioritizeStoryQueue,
} from '../storyfactory';

assert.equal(UNIVERSE_KERNEL_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(ARCH_READER_CONSUMER_GUARDRAILS.readOnly, true);
assert.equal(ARCH_READER_CONSUMER_GUARDRAILS.productionAutoApply, false);
assert.equal(ARCH_READER_CONSUMER_GUARDRAILS.bioCloningAllowed, false);
assert.equal(ARCH_READER_CONSUMER_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly, true);
assert.equal(ARCH_READER_CONSUMER_GUARDRAILS.replicaHardCap, 64);
assert.equal(ARCH_READER_CONSUMER_GUARDRAILS.maxDutyCycle, 0.25);
assert.equal(ARCH_READER_CONSUMER_GUARDRAILS.productLaneMobileWire, 'FOLLOW_UP');
assert.equal(COUNCIL_UX_GUARDRAILS.readOnly, true);
assert.equal(ROSTER_DUTY_SCHEDULER_GUARDRAILS.replicaHardCap, FOUNDER_TWIN_REPLICA_HARD_CAP);
assert.equal(ROSTER_DUTY_SCHEDULER_GUARDRAILS.maxDutyCycle, FOUNDER_TWIN_MAX_DUTY_CYCLE);

let universe = createSimulatedUniverse({
  universeId: 'cc-sim',
  tenantId: 'xiv',
  label: 'Command Center SIMULATION layer',
});
universe = addCompany(universe, {
  companyId: 'co-cc',
  name: 'CC Mill',
  sector: 'ops',
  tenantId: 'xiv',
  location: createSpatialCoordinate({ lon: -87.6, lat: 41.8 }),
  memoryHeat: 'hot',
});
universe = addEconomicSignal(universe, {
  signalId: 'sig-cc',
  metric: 'customer_value',
  value: 0.77,
  unit: 'ratio',
  stance: 'OBSERVED',
});

const archSummary = buildArchitectureReaderSummary({ universe });
const archView = buildArchitectureReaderView(archSummary);

const batch = generateBatch(5, 11);
const queue = reprioritizeStoryQueue({
  stories: batch.stories,
  availability: [
    { agent: 'LOCAL_RULES', online: true, local: true, canNetwork: false, maxConcurrent: 10 },
    { agent: 'OLLAMA', online: false, local: true, canNetwork: false, maxConcurrent: 5 },
    { agent: 'GROK', online: false, local: false, canNetwork: true, maxConcurrent: 3 },
  ],
});
const councilSummary = buildCouncilQueueUxSummary({ queue, stories: batch.stories });
const councilView = buildCouncilQueueUxView(councilSummary);

let roster = createFounderTwinRoster({ tenantId: 'xiv', cycleId: 'cycle-12d08' });
roster = registerTwinReplica(roster, {
  replicaId: 'twin-a',
  kind: 'DIGITAL_TWIN',
  dutyCycle: 0.25,
  energyUsedThisCycle: 40,
  activeShardCount: 4,
});
roster = registerTwinReplica(roster, {
  replicaId: 'twin-b',
  kind: 'COMPRESSED_SHARD_SET',
  dutyCycle: 0.1,
  energyUsedThisCycle: 20,
  activeShardCount: 2,
});
roster = addSparseSimulationPathway(roster);

const dutyPlan = planRosterDutyCycle(roster);
assert.equal(dutyPlan.readOnly, true);
assert.equal(dutyPlan.productionAutoApply, false);
assert.equal(dutyPlan.replicaHardCap, 64);
assert.equal(dutyPlan.maxDutyCycle, 0.25);
assert.equal(dutyPlan.replicaSlots.length, 2);
assert.ok(dutyPlan.replicaSlots.every((s) => s.dutyCycle <= 0.25));
assert.equal(dutyPlan.energyAllocated, 60);
assert.equal(dutyPlan.energyRemaining, roster.energyBudgetRemaining);
assert.equal(dutyPlan.sparsePathwayCount, 1);
const dutySummary = summarizeDutyPlan(dutyPlan);
assert.equal(dutySummary.bioCloningAllowed, false);
assert.equal(dutySummary.wormholesAreSparseSimulationPathwaysOnly, true);

const bundle = buildArchitectureReaderConsumer({
  architectureView: archView,
  councilView,
  roster,
  dutyPlan,
});
assert.equal(bundle.readOnly, true);
assert.equal(bundle.productionAutoApply, false);
assert.equal(bundle.layerKind, 'SIMULATION');
assert.ok(bundle.mobileReady.architectureCard);
assert.equal(bundle.mobileReady.architectureCard?.universeId, 'cc-sim');
assert.equal(bundle.mobileReady.architectureCard?.layerKind, 'SIMULATION');
assert.ok(bundle.mobileReady.councilTop.length >= 1);
assert.ok(bundle.mobileReady.councilProviderHonesty.some((h) => h.includes('GROK:WAITING_PROVIDER')));
assert.ok(bundle.mobileReady.dutyCycleStatus);
assert.equal(bundle.mobileReady.dutyCycleStatus?.hardCap, 64);
assert.equal(bundle.mobileReady.dutyCycleStatus?.maxDutyCycle, 0.25);
assert.equal(bundle.mobileReady.dutyCycleStatus?.bioCloningAllowed, false);
assert.match(bundle.markdown, /READ ONLY/);
assert.match(bundle.markdown, /FOLLOW_UP|productLaneMobileWire/i);
assert.match(bundle.html, /READ ONLY/);
assert.match(bundle.html, /<!DOCTYPE html>/);
assert.match(bundle.html, /Command Center Consumer/);
const parsed = JSON.parse(bundle.json);
assert.equal(parsed.readOnly, true);
assert.equal(parsed.productionAutoApply, false);
assert.equal(parsed.layerKind, 'SIMULATION');
assertEthicsSafeCopy(bundle.markdown, '12d08 markdown');
assertEthicsSafeCopy(bundle.html, '12d08 html');
assert.doesNotMatch(bundle.markdown, /physical portal/i);
assert.doesNotMatch(bundle.html, /valuation theater/i);

const fromSummary = buildCommandCenterArchConsumer(archSummary, { councilSummary, roster });
assert.equal(fromSummary.mobileReady.architectureCard?.companyCount, 1);
assert.ok(fromSummary.dutyPlan);
assert.equal(fromSummary.dutyPlan?.replicaSlots.length, 2);

const outDir = mkdtempSync(join(tmpdir(), 'xiv-12d08-'));
try {
  mkdirSync(outDir, { recursive: true });
  const htmlPath = join(outDir, 'command-center-consumer-preview.html');
  const mdPath = join(outDir, 'command-center-consumer-preview.md');
  const jsonPath = join(outDir, 'command-center-consumer-preview.json');
  writeFileSync(htmlPath, bundle.html, 'utf8');
  writeFileSync(mdPath, bundle.markdown, 'utf8');
  writeFileSync(jsonPath, bundle.json, 'utf8');
  assert.ok(readFileSync(htmlPath, 'utf8').includes('READ ONLY'));
  assert.equal(JSON.parse(readFileSync(jsonPath, 'utf8')).readOnly, true);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

console.log(
  'XIV 12D-08 Architecture Reader consumer + roster duty-cycle contracts hold (read-only, CAP 64, maxDuty 0.25, WAITING_PROVIDER).',
);
