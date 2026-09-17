// 12D-321 — adversarial tests for the stale-re-ingestion flow CLI. Central
// properties under attack:
//   1. EVERY STAGE IS A REAL DOOR: the 12D-316 plan (staleness
//      re-derived through the REAL 12D-315 contract, stories through
//      the REAL 12D-274 door), then the 12D-278 bridge over the REAL
//      12D-275 door — called, never re-implemented. A CURRENT or
//      UNCHECKED source is "nothing to re-ingest" with NOTHING
//      admitted.
//   2. THE PREPARED RESULT IS RE-DERIVED, NEVER TRUSTED: a tampered
//      plan packet (digest, chunk count, or story ids edited in
//      flight) refuses HERE — a tampered plan cannot admit.
//   3. PROVENANCE REQUIRED: an unregistered source, a tampered
//      register, or a malformed register file refuses with NOTHING
//      admitted; the CLI never registers (its store's save throws).
//   4. THE TENANT COMES FROM THE VERIFIED PACKET: there is NO tenant
//      flag; a digests file of the wrong shape refuses; refusals carry
//      the door's message verbatim and admit nothing.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  STALE_REINGEST_FLOW_CLI_GUARDRAILS,
  STALE_REINGEST_FLOW_CLI_POLICY,
  ReadOnlyFlowRegisterStore,
  runStaleReingestFlowCommand,
} from './xiv-stale-reingest-flow.cli';
import {
  registerReadingSource, type ReadingSourceStore,
} from './xiv-reading-source-register';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';
import { prepareDocumentStories } from './xiv-document-ingest';

const TENANT = 'flow-tenant';
const GENESIS = '12d-321-register-genesis';
const SOURCE_ID = 'flow-source-repo';
const STALE_DOC = 'flow-doc-1';
const NEW_DOC = 'flow-doc-1-reingest-1';

const pad = (seed: string): string => `${seed}${'.'.repeat(1200 - seed.length)}`;
const NEW_BODY = [
  pad('Flow CLI successor paragraph one.'),
  pad('Flow CLI successor paragraph two.'),
].join('\n\n');

function hashOf(n: number): string {
  return createHash('sha256').update(`out-${n}`).digest('hex');
}

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `fact-story-${String(n).padStart(3, '0')}`,
    tenantId: TENANT,
    roleId: 'memory_curator',
    objective,
    acceptance: ['the fact is bounded and screened'],
    dependencies: [],
    sourceRevision: 'a'.repeat(40),
    masterPlanSha256: 'b'.repeat(64),
    securityClass: 'ORDINARY',
    kind: 'PRODUCT_STORY',
  };
}

function makeDone(q: OfflineStoryQueue, n: number, objective: string): void {
  const story = makeStory(n, objective);
  q.enqueue([story]);
  const lease = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash: hashOf(n), providerSettled: true });
  q.applyReviewDecision({
    tenantId: TENANT, storyId: story.id, reviewerId: 'secure_code_reviewer',
    expectedOutputHash: hashOf(n), decision: 'APPROVED', reviewRef: `review:${n}`,
  });
}

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

/** A workspace: registered source, REAL memory packet (one DONE fact
 *  citing the STALE doc via the 12D-287 doc-pattern), current digests
 *  file (the digest MOVED — STALE), successor body file, no queue yet. */
function flowWorkspace(dir: string, moved: boolean = true): { args: string[]; queuePath: string } {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId: TENANT, sourceId: SOURCE_ID,
    title: 'The Flow Source Handbook',
    sourceUrl: 'https://example.com/flow-source',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'MIT — public repository, cited verbatim',
  });
  const staleDigest = 'c'.repeat(64);
  const currentDigest = moved ? 'd'.repeat(64) : staleDigest;
  // The REAL memory packet: one DONE fact whose objective carries the
  // 12D-287 doc-pattern binding the story to the STALE document.
  const q = new OfflineStoryQueue(join(dir, 'memory-q.sqlite'));
  const memoryPacketPath = join(dir, 'memory.json');
  const digestsPath = join(dir, 'digests.json');
  const registerPath = join(dir, 'register.json');
  const bodyPath = join(dir, 'new-body.txt');
  const queuePath = join(dir, 'queue.sqlite');
  try {
    makeDone(q, 1, `SUMMARIZE the re-fetched handbook: doc:${STALE_DOC}:${staleDigest.slice(0, 16)}`);
    const packet = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    writeFileSync(memoryPacketPath, JSON.stringify(packet), 'utf8');
  } finally {
    q.close();
  }
  writeFileSync(digestsPath, JSON.stringify([
    { documentId: STALE_DOC, digestSha256: currentDigest },
  ]), 'utf8');
  writeFileSync(registerPath, JSON.stringify(store.load()), 'utf8');
  writeFileSync(bodyPath, NEW_BODY, 'utf8');
  const args = ['--queue', queuePath, '--register', registerPath, '--genesis', GENESIS,
    '--source', SOURCE_ID, '--memory', memoryPacketPath, '--digests', digestsPath,
    '--document', STALE_DOC, '--new-document', NEW_DOC,
    '--new-title', 'The Flow Source Handbook, second edition', '--new-body', bodyPath];
  return { args, queuePath };
}

function withWorkspace(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-flow-cli-'));
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('12d-321: guardrails pinned — every stage a real door, executor not decider, honest flags', () => {
  assert.equal(STALE_REINGEST_FLOW_CLI_GUARDRAILS.everyStageIsARealDoor, true);
  assert.equal(STALE_REINGEST_FLOW_CLI_GUARDRAILS.digestReDerivedNeverTrusted, true);
  assert.equal(STALE_REINGEST_FLOW_CLI_GUARDRAILS.tenantFromTheVerifiedPacket, true);
  assert.equal(STALE_REINGEST_FLOW_CLI_GUARDRAILS.staleOnly, true);
  assert.equal(STALE_REINGEST_FLOW_CLI_GUARDRAILS.registersNothing, true);
  assert.equal(STALE_REINGEST_FLOW_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(STALE_REINGEST_FLOW_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(STALE_REINGEST_FLOW_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(STALE_REINGEST_FLOW_CLI_POLICY.policyVersion, '12d-321-v1');
  assert.equal(STALE_REINGEST_FLOW_CLI_POLICY.flagOrder.length, 10);
  // There is NO tenant flag and NO digest flag anywhere in the chain.
  const flags = STALE_REINGEST_FLOW_CLI_POLICY.flagOrder as readonly string[];
  assert.ok(!flags.includes('--tenant'));
  assert.ok(!flags.includes('--digest'));
  assert.ok(!flags.includes('--new-digest'));
});

test('12d-321: parser discipline — exact flags, each once, bounded values, no tenant/digest escape hatch', () => {
  const base = ['--queue', 'q', '--register', 'r', '--genesis', GENESIS, '--source', 's',
    '--memory', 'm', '--digests', 'd', '--document', 'doc', '--new-document', 'doc2',
    '--new-title', 'T', '--new-body', 'b'];
  assert.throws(() => runStaleReingestFlowCommand(base.slice(0, -2)), /fail closed/);
  assert.throws(() => runStaleReingestFlowCommand([...base, '--extra', 'x']), /fail closed/);
  assert.throws(() => runStaleReingestFlowCommand(base.map((v, i) => (i === 2 ? '--smuggled' : v))), /unknown flag/);
  assert.throws(() => runStaleReingestFlowCommand(base.map((v, i) => (i === 4 ? '--queue' : v))), /duplicate flag/);
  assert.throws(() => runStaleReingestFlowCommand(base.map((v) => (v === 'b' ? '' : v))), /requires a value/);
  assert.throws(() => runStaleReingestFlowCommand(base.map((v) => (v === 's' ? 'bad id!' : v))), /source id/);
  assert.throws(() => runStaleReingestFlowCommand(base.map((v) => (v === 'doc' ? 'bad id!' : v))), /stale document id/);
  assert.throws(() => runStaleReingestFlowCommand(base.map((v) => (v === 'doc2' ? 'bad id!' : v))), /successor document id/);
  assert.throws(() => runStaleReingestFlowCommand(base.map((v) => (v === GENESIS ? 'short' : v))), /at least 8 chars/);
  assert.throws(() => runStaleReingestFlowCommand(base.map((v) => (v === 'T' ? 'x'.repeat(201) : v))), /bounded/);
});

test('12d-321: the REAL loop — STALE source -> plan -> re-derived prepared -> BOUND_READING_ADMITTED', () => {
  withWorkspace((dir) => {
    const { args, queuePath } = flowWorkspace(dir);
    const packet = runStaleReingestFlowCommand(args);
    assert.equal(packet.kind, 'STALE_REINGEST_ADMITTED');
    if (packet.kind !== 'STALE_REINGEST_ADMITTED') return;
    assert.equal(packet.policyVersion, STALE_REINGEST_FLOW_CLI_POLICY.policyVersion);
    assert.equal(packet.tenantId, TENANT); // from the VERIFIED packet, not a flag
    assert.equal(packet.sourceId, SOURCE_ID);
    // The lineage is the REAL one: recorded head -> moved head, successor digest re-derived.
    const prepared = prepareDocumentStories({
      tenantId: TENANT, documentId: NEW_DOC,
      title: 'The Flow Source Handbook, second edition', bodyText: NEW_BODY,
    });
    assert.equal(packet.lineage.staleDocumentId, STALE_DOC);
    assert.equal(packet.lineage.previousDigestHead, 'c'.repeat(16));
    assert.equal(packet.lineage.currentDigestHead, 'd'.repeat(16));
    assert.equal(packet.lineage.newDocumentId, NEW_DOC);
    assert.equal(packet.lineage.newDigestSha256, prepared.documentDigestSha256);
    assert.equal(packet.lineage.chunkCount, prepared.chunkCount);
    assert.equal(packet.registerEntries, 1);
    assert.equal(packet.admission.prepared, prepared.chunkCount);
    assert.equal(packet.admission.inserted, prepared.chunkCount);
    assert.equal(packet.admission.duplicates, 0);
    assert.equal(packet.binding.kind, 'READING_BOUND_TO_SOURCE');
    assert.equal(packet.binding.sourceId, SOURCE_ID);
    assert.equal(packet.binding.sourceClass, 'OPEN_SOURCE_REPO');
    assert.match(packet.stoppedBefore, /never claimed, settled, reviewed or promoted here/);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.remoteCalls, 0);
    assert.equal(packet.humanDecision, 'REQUIRED');
    // The queue REALLY holds the admitted rows (the door wrote them).
    const q = new OfflineStoryQueue(queuePath);
    try {
      const summary = q.summary(TENANT);
      const counts = summary.counts as { state?: string; count?: number }[];
      const ready = counts.find((c) => c.state === 'READY');
      assert.ok(ready && (ready.count ?? 0) >= prepared.chunkCount);
    } finally {
      q.close();
    }
  });
});

test('12d-321: a CURRENT source is "nothing to re-ingest" — NOTHING admitted, queue untouched', () => {
  withWorkspace((dir) => {
    const { args, queuePath } = flowWorkspace(dir, false);
    const packet = runStaleReingestFlowCommand(args);
    assert.equal(packet.kind, 'STALE_REINGEST_FLOW_REFUSED');
    if (packet.kind !== 'STALE_REINGEST_FLOW_REFUSED') return;
    assert.match(packet.reason, /nothing to re-ingest.*CURRENT/s);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.humanDecision, 'REQUIRED');
    // NOTHING was written: the queue file does not even exist (the CLI
    // opens it only after the plan passes).
    assert.throws(() => readFileSync(queuePath, 'utf8'));
  });
});

test('12d-321: a secret-shaped successor body refuses — the plan door refuses pre-admission, the secret never echoed', () => {
  withWorkspace((dir) => {
    const { args } = flowWorkspace(dir);
    // The CLI re-derives everything internally (there is no plan-packet
    // handoff to tamper with), so the equivalent attack is a poisoned
    // INPUT file: a secret-shaped successor body must refuse at the
    // plan's screen with NOTHING admitted and the secret never echoed.
    const secretBody = join(dir, 'secret-body.txt');
    const secret = `use key AKIA${'B'.repeat(16)} now\n\n${NEW_BODY}`;
    writeFileSync(secretBody, secret, 'utf8');
    const secretArgs = args.map((v, i) => (args[i - 1] === '--new-body' ? secretBody : v));
    const refused = runStaleReingestFlowCommand(secretArgs);
    assert.equal(refused.kind, 'STALE_REINGEST_FLOW_REFUSED');
    if (refused.kind !== 'STALE_REINGEST_FLOW_REFUSED') return;
    assert.match(refused.reason, /secret-shaped/);
    assert.ok(!refused.reason.includes('AKIA'), 'the refusal must never echo the secret');
  });
});

test('12d-321: provenance required — unregistered source, tampered register, malformed register file all refuse with NOTHING admitted', () => {
  withWorkspace((dir) => {
    // (a) unregistered source id
    const { args } = flowWorkspace(dir);
    const unregistered = args.map((v, i) => (args[i - 1] === '--source' ? 'never-registered' : v));
    const refusedA = runStaleReingestFlowCommand(unregistered);
    assert.equal(refusedA.kind, 'STALE_REINGEST_FLOW_REFUSED');
    if (refusedA.kind === 'STALE_REINGEST_FLOW_REFUSED') assert.match(refusedA.reason, /ADMISSION REFUSED|register|binding/i);
    // (b) tampered register (a middle line edited)
    const registerPath = args[args.indexOf('--register') + 1]!;
    const lines = JSON.parse(readFileSync(registerPath, 'utf8')) as string[];
    lines[0] = lines[0]!.slice(0, -8) + 'tampered';
    writeFileSync(registerPath, JSON.stringify(lines), 'utf8');
    const refusedB = runStaleReingestFlowCommand(args);
    assert.equal(refusedB.kind, 'STALE_REINGEST_FLOW_REFUSED');
    if (refusedB.kind === 'STALE_REINGEST_FLOW_REFUSED') {
      assert.match(refusedB.reason, /NOTHING was admitted/);
      assert.equal(refusedB.modelCalls, 0);
    }
    // (c) malformed register file
    writeFileSync(registerPath, '{"not":"an array"}', 'utf8');
    const refusedC = runStaleReingestFlowCommand(args);
    assert.equal(refusedC.kind, 'STALE_REINGEST_FLOW_REFUSED');
    if (refusedC.kind === 'STALE_REINGEST_FLOW_REFUSED') assert.match(refusedC.reason, /JSON array of register lines/);
  });
});

test('12d-321: file shapes refuse fail-closed — digests array, digests entry keys, unreadable files', () => {
  withWorkspace((dir) => {
    const { args } = flowWorkspace(dir);
    const digestsPath = args[args.indexOf('--digests') + 1]!;
    const memoryPath = args[args.indexOf('--memory') + 1]!;
    // (a) digests file not an array
    writeFileSync(digestsPath, '{"documentId":"x"}', 'utf8');
    assert.match((runStaleReingestFlowCommand(args) as { reason: string }).reason, /JSON array of 1\.\.64/);
    // (b) digests entry wrong keys (tampered shape)
    writeFileSync(digestsPath, JSON.stringify([{ documentId: STALE_DOC, digest: 'x' }]), 'utf8');
    assert.match((runStaleReingestFlowCommand(args) as { reason: string }).reason, /exactly the keys/);
    // (c) non-hex digest
    writeFileSync(digestsPath, JSON.stringify([{ documentId: STALE_DOC, digestSha256: 'zz'.repeat(32) }]), 'utf8');
    assert.match((runStaleReingestFlowCommand(args) as { reason: string }).reason, /hex64/);
    // (d) unreadable memory packet
    writeFileSync(digestsPath, JSON.stringify([{ documentId: STALE_DOC, digestSha256: 'd'.repeat(64) }]), 'utf8');
    writeFileSync(memoryPath, 'not json', 'utf8');
    assert.match((runStaleReingestFlowCommand(args) as { reason: string }).reason, /memory packet file is unreadable/);
  });
});

test('12d-321: the read-only register store never saves — registration stays the supervised 12D-276 step', () => {
  const store = new ReadOnlyFlowRegisterStore(['line-1']);
  assert.deepEqual([...store.load()!], ['line-1']);
  assert.throws(() => store.save(['line-2']), /never writes a register/);
});

test('12d-321: successor id colliding with an assessed document refuses at the plan (nothing admitted)', () => {
  withWorkspace((dir) => {
    const { args } = flowWorkspace(dir);
    const colliding = args.map((v, i) => (args[i - 1] === '--new-document' ? STALE_DOC : v));
    const refused = runStaleReingestFlowCommand(colliding);
    assert.equal(refused.kind, 'STALE_REINGEST_FLOW_REFUSED');
    if (refused.kind === 'STALE_REINGEST_FLOW_REFUSED') assert.match(refused.reason, /collides with an assessed document/);
  });
});