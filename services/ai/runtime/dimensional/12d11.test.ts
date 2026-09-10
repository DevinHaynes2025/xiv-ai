/**
 * 12D-11 — Agent Identity + Checkpoint Ledger (append-only).
 * Twin gates; Policy Gate never bypassed; not a second control plane;
 * ChatGPT = read/review consumer only; Atomic Data Cells as evidence units.
 */
import assert from 'node:assert/strict';
import {
  AGENT_CHECKPOINT_LEDGER_GUARDRAILS,
  AGENT_CHECKPOINT_LEDGER_SCHEMA_VERSION,
  ATOMIC_DATA_CELL_GUARDRAILS,
  BUSINESS_BAR_METRICS,
  FOUNDER_TWIN_GUARDRAILS,
  HIGH_AUTONOMY_TARGETS,
  OLLAMA_WRITER_GUARDRAILS,
  POCKET_BRAIN_INGEST_GUARDRAILS,
  VALUATION_THEATER_ALLOWED,
  appendCheckpointFromAdaptiveCouncil,
  appendCheckpointFromStoryDebrief,
  assertAgentCheckpointTwinBans,
  buildAtomicDataCell,
  createAgentCheckpointLedger,
  reviewCheckpointAsChatGPT,
  verifyAtomicDataCellChecksum,
} from './index';
import { createDebrief, createLearningState, learnFromDebriefs } from '../storyfactory';

assert.equal(AGENT_CHECKPOINT_LEDGER_SCHEMA_VERSION, '12d11.1');
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.appendOnly, true);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.mutable, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.deleteAllowed, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.rewriteAllowed, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.secondControlPlane, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.checkpointLedgerIsSecondControlPlane, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.policyGateBypassAllowed, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.checkpointIsReadReviewOnly, true);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.chatgptAuthorityToFlipAutonomousProduction, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.autonomousProductionDML, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.productionAutoApply, false);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.twinClaimBansAssertable, true);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.atomicDataCellsMayBeEvidenceUnits, true);
assert.equal(AGENT_CHECKPOINT_LEDGER_GUARDRAILS.ticket, '12D-11');
assert.deepEqual([...AGENT_CHECKPOINT_LEDGER_GUARDRAILS.highAutonomyTargets], ['LOCAL', 'CLOUD_SANDBOX']);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);
assert.equal(VALUATION_THEATER_ALLOWED, false);
for (const m of ['adoption', 'reliability', 'security', 'unit_economics', 'customer_value']) {
  assert.ok(BUSINESS_BAR_METRICS.includes(m as (typeof BUSINESS_BAR_METRICS)[number]));
}

// Prior ticket pointers still honest
assert.equal(OLLAMA_WRITER_GUARDRAILS.nextTicket, '12D-11');
assert.equal(POCKET_BRAIN_INGEST_GUARDRAILS.checkpointLedgerTicket, '12D-11');
assert.equal(POCKET_BRAIN_INGEST_GUARDRAILS.checkpointLedgerIsSecondControlPlane, false);
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.agentCheckpointLedgerWire, 'WIRED');
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.ticketFollowUp, '12D-12');
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed, false);
assert.equal(FOUNDER_TWIN_GUARDRAILS.bioCloningAllowed, false);
assert.equal(FOUNDER_TWIN_GUARDRAILS.alwaysOnInfiniteClonesAllowed, false);

assertAgentCheckpointTwinBans();

const ledger = createAgentCheckpointLedger();
assert.equal(ledger.size(), 0);

const cell = buildAtomicDataCell({
  cellId: 'cell-12d11-ev',
  tenantId: 'xiv',
  body: { note: 'evidence unit for checkpoint' },
  provenance: ['local:12d11'],
  confidence: 0.8,
});
assert.equal(verifyAtomicDataCellChecksum(cell), true);

const entry = ledger.append({
  xivAgent: 'GROK',
  model: 'grok-bot',
  story: 'US-12D-11',
  environment: 'LOCAL',
  filesChanged: [
    'services/ai/runtime/dimensional/agent-checkpoint-ledger.ts',
    'services/ai/runtime/dimensional/12d11.test.ts',
  ],
  testsPassed: ['12d11.test.ts'],
  testsFailed: [],
  databaseMigrations: [],
  atomicCellIds: [cell.cellId],
  confidence: 0.9,
  debriefId: null,
  createdAt: '2026-09-10T04:30:00.000Z',
});

assert.equal(entry.sequence, 1);
assert.equal(entry.xivAgent, 'GROK');
assert.equal(entry.model, 'grok-bot');
assert.equal(entry.story, 'US-12D-11');
assert.equal(entry.environment, 'LOCAL');
assert.equal(entry.immutable, true);
assert.equal(entry.policyGateBypass, false);
assert.equal(entry.secondControlPlane, false);
assert.equal(entry.autonomousProductionDDL, false);
assert.equal(entry.autonomousProductionDML, false);
assert.equal(entry.chatgptAuthorityToFlipAutonomousProduction, false);
assert.ok(entry.evidenceHash.length > 8);
assert.deepEqual([...entry.atomicCellIds], ['cell-12d11-ev']);
assert.equal(ledger.size(), 1);

// Append-only: second entry grows sequence; rewrite/delete banned
const entry2 = ledger.append({
  xivAgent: 'OLLAMA',
  model: 'llama-local',
  story: 'US-12D-11-b',
  environment: 'CLOUD_SANDBOX',
  filesChanged: [],
  testsPassed: [],
  testsFailed: ['flaky'],
  databaseMigrations: ['noop.sql'],
  confidence: 0.55,
  createdAt: '2026-09-10T04:31:00.000Z',
});
assert.equal(entry2.sequence, 2);
assert.equal(ledger.list().length, 2);

assert.throws(() => ledger.rewrite(entry.entryId), /append-only/);
assert.throws(() => ledger.delete(entry.entryId), /append-only/);
assert.throws(() => ledger.bypassPolicyGate(), /NEVER bypass Policy Gate/);
assert.throws(() => ledger.flipAutonomousProduction('DDL', true), /cannot flip autonomousProduction/);

// PRODUCTION is label only — still no autonomy / control-plane flags
const prodLabel = ledger.append({
  xivAgent: 'LOCAL_RULES',
  model: 'local-rules',
  story: 'audit-prod-label',
  environment: 'PRODUCTION',
  confidence: 0.2,
  createdAt: '2026-09-10T04:32:00.000Z',
});
assert.equal(prodLabel.environment, 'PRODUCTION');
assert.equal(prodLabel.autonomousProductionDDL, false);
assert.equal(prodLabel.autonomousProductionDML, false);
assert.equal(prodLabel.secondControlPlane, false);

// ChatGPT = read/review consumer only
const review = reviewCheckpointAsChatGPT(ledger, entry.entryId);
assert.equal(review.role, 'READ_REVIEW_CONSUMER');
assert.equal(review.mayFlipAutonomousProduction, false);
assert.equal(review.mayBypassPolicyGate, false);
assert.equal(review.isControlPlane, false);
assert.equal(review.entry.entryId, entry.entryId);

// Optional Story Factory debrief hook
const debrief = createDebrief({
  agent: 'CHATGPT',
  storyIds: ['US-12D-11'],
  completed: ['US-12D-11'],
  failed: [],
  blocked: [],
  lessons: ['ledger is append-only'],
  assumptions: ['policy gate remains closed'],
  evidenceRefs: [cell.checksum],
  nextActions: ['push origin only'],
});
const fromDebrief = appendCheckpointFromStoryDebrief(ledger, debrief, {
  model: 'chatgpt-review',
  environment: 'LOCAL',
  atomicCellIds: [cell.cellId],
  filesChanged: ['docs/operations/XIV_12D11_AGENT_CHECKPOINT_LEDGER.md'],
});
assert.equal(fromDebrief.xivAgent, 'CHATGPT');
assert.equal(fromDebrief.debriefId, debrief.debriefId);
assert.equal(fromDebrief.story, 'US-12D-11');
assert.ok(fromDebrief.atomicCellIds.includes(cell.cellId));

// ChatGPT review of its own debrief row still cannot flip production
const chatgptReview = reviewCheckpointAsChatGPT(ledger, fromDebrief.entryId);
assert.equal(chatgptReview.mayFlipAutonomousProduction, false);

// Optional Adaptive Council learning hook
const learning = learnFromDebriefs(createLearningState(), [debrief], [
  {
    storyId: 'US-12D-11',
    ballots: [],
    blended: {
      customerValue: 0.7,
      technicalRisk: 0.3,
      cost: 0.4,
      security: 0.8,
      dependencies: 0.6,
      evidenceQuality: 0.7,
    },
    composite: 0.7,
    worthExecuting: true,
    priorityRank: 1,
    learningTags: ['domain:PLATFORM', 'agent:CHATGPT'],
  },
]);
assert.ok(learning.samples >= 1);
const fromCouncil = appendCheckpointFromAdaptiveCouncil(ledger, {
  story: 'US-12D-11',
  learning,
  debriefId: debrief.debriefId,
  xivAgent: 'LOCAL_RULES',
});
assert.equal(fromCouncil.xivAgent, 'LOCAL_RULES');
assert.equal(fromCouncil.debriefId, debrief.debriefId);
assert.equal(fromCouncil.secondControlPlane, false);

// Confidence bounds
assert.throws(
  () =>
    ledger.append({
      xivAgent: 'GEMINI',
      model: 'g',
      story: 's',
      environment: 'LOCAL',
      confidence: 1.5,
    }),
  /confidence/,
);

console.log(
  'XIV 12D-11 Agent Identity + Checkpoint Ledger contracts hold (append-only, no Policy Gate bypass, no second control plane, ChatGPT read/review only).',
);
