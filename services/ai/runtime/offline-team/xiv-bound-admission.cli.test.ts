// 12D-296 — adversarial tests for the bound-admission CLI. Central
// properties under attack:
//   1. EXECUTOR, NOT DECIDER: the CLI derives the digest FROM THE TEXT
//      on disk (prepareDocumentStories), never from an operator claim —
//      there is NO digest flag, NO provenance bypass flag.
//   2. PROVENANCE REQUIRED (12D-295 adopted door): an unregistered
//      source, a tampered register, or a malformed register file
//      refuses with NOTHING admitted; the CLI never registers its way
//      past the gate (its store's save throws).
//   3. THE REAL DOORS DO THE WORK: prepareDocumentStories and
//      admitReadingStories are called, never re-implemented; the
//      measured packet is their output.
//   4. LOCAL I/O only, no model call, no network primitive; refusals
//      print verbatim and exit 2.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BOUND_ADMISSION_CLI_GUARDRAILS,
  BOUND_ADMISSION_CLI_POLICY,
  ReadOnlyRegisterStore,
  runBoundAdmissionCommand,
} from './xiv-bound-admission.cli';
import {
  registerReadingSource, type ReadingSourceStore,
} from './xiv-reading-source-register';
import { OfflineStoryQueue } from './offline-story-queue';
import { prepareDocumentStories } from './xiv-document-ingest';

const TENANT = 'cli-tenant';
const GENESIS = '12d-296-register-genesis';
const SOURCE_ID = 'psychopy-repo';

const pad = (seed: string): string => `${seed}${'.'.repeat(1200 - seed.length)}`;
const DOC = [
  pad('Admission CLI test paragraph one.'),
  pad('Admission CLI test paragraph two.'),
  pad('Admission CLI test paragraph three.'),
].join('\n\n');

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

function withWorkspace(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-bound-cli-'));
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

/** A workspace with a REGISTERED source, a body file, and no queue yet.
 *  `claimedSourceId` is what the CLI invocation claims — it may differ
 *  from the registered id (the unregistered-refusal case). */
function preparedWorkspace(dir: string, claimedSourceId: string = SOURCE_ID): { args: string[]; registerPath: string; bodyPath: string; queuePath: string } {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId: TENANT, sourceId: SOURCE_ID,
    title: 'PsychoPy — open-source psychology experiment platform',
    sourceUrl: 'https://github.com/psychopy/psychopy',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'GPL-3.0 — public repository, cited verbatim',
  });
  const registerPath = join(dir, 'register.json');
  writeFileSync(registerPath, JSON.stringify(store.load()), 'utf8');
  const bodyPath = join(dir, 'body.txt');
  writeFileSync(bodyPath, DOC, 'utf8');
  const queuePath = join(dir, 'q.sqlite');
  return {
    args: ['--queue', queuePath, '--register', registerPath, '--genesis', GENESIS,
      '--source', claimedSourceId, '--tenant', TENANT, '--document', 'cli-doc-1',
      '--title', 'The Admission CLI Handbook', '--body', bodyPath],
    registerPath, bodyPath, queuePath,
  };
}

/** The queue, opened only AFTER a command run (the CLI closed its own). */
function openQueue(queuePath: string): OfflineStoryQueue {
  return new OfflineStoryQueue(queuePath);
}

test('12d-296: parser discipline — exact flags, each once, bounded values', () => {
  const base = ['--queue', 'q', '--register', 'r', '--genesis', GENESIS, '--source', 's',
    '--tenant', 't', '--document', 'd', '--title', 'T', '--body', 'b'];
  // wrong arity (an appended pair also trips the arity gate first)
  assert.throws(() => runBoundAdmissionCommand(base.slice(0, -2)), /fail closed/);
  assert.throws(() => runBoundAdmissionCommand([...base, '--extra', 'x']), /fail closed/);
  // unknown flag (same arity — replaces one flag name in place)
  assert.throws(() => runBoundAdmissionCommand(base.map((v, i) => (i === 2 ? '--smuggled' : v))), /unknown flag/);
  // duplicate flag (same arity — replaces one flag name in place)
  assert.throws(() => runBoundAdmissionCommand(base.map((v, i) => (i === 4 ? '--queue' : v))), /duplicate flag/);
  // missing value (odd arity is caught by the arity gate; an EMPTY value
  // by the value gate)
  assert.throws(() => runBoundAdmissionCommand(base.map((v) => (v === 'b' ? '' : v))), /requires a value/);
  // malformed ids
  assert.throws(() => runBoundAdmissionCommand(base.map((v) => (v === 's' ? 'bad id!' : v))), /source id/);
  assert.throws(() => runBoundAdmissionCommand(base.map((v) => (v === 't' ? 'bad id!' : v))), /tenant id/);
  assert.throws(() => runBoundAdmissionCommand(base.map((v) => (v === 'd' ? 'bad id!' : v))), /document id/);
  // short genesis
  assert.throws(() => runBoundAdmissionCommand(base.map((v) => (v === GENESIS ? 'short' : v))), /at least 8 chars/);
  // unbounded title
  assert.throws(() => runBoundAdmissionCommand(base.map((v) => (v === 'T' ? 'x'.repeat(201) : v))), /bounded/);
});

test('12d-296: the REAL loop — register file + body file -> BOUND_ADMITTED, claimable rows, digest re-derived', () => {
  withWorkspace((dir) => {
    const { args, queuePath } = preparedWorkspace(dir);
    const packet = runBoundAdmissionCommand(args);
    assert.equal(packet.kind, 'BOUND_ADMITTED');
    assert.equal(packet.policyVersion, BOUND_ADMISSION_CLI_POLICY.policyVersion);
    assert.equal(packet.tenantId, TENANT);
    assert.equal(packet.documentId, 'cli-doc-1');
    assert.equal(packet.sourceId, SOURCE_ID);
    // The digest in the packet is the REAL prepareDocumentStories digest.
    const prepared = prepareDocumentStories({
      tenantId: TENANT, documentId: 'cli-doc-1', title: 'The Admission CLI Handbook', bodyText: DOC,
    });
    assert.equal(packet.documentDigestSha256, prepared.documentDigestSha256);
    assert.equal(packet.registerEntries, 1);
    assert.equal(packet.admission.prepared, prepared.chunkCount);
    assert.equal(packet.admission.inserted, prepared.chunkCount);
    assert.equal(packet.admission.duplicates, 0);
    assert.equal(packet.binding.kind, 'READING_BOUND_TO_SOURCE');
    assert.equal(packet.binding.sourceId, SOURCE_ID);
    assert.equal(packet.binding.sourceClass, 'OPEN_SOURCE_REPO');
    assert.equal(packet.binding.sourceEntryDigestSha256.length, 64);
    assert.equal(packet.modelCalls, 0);
    assert.equal(packet.remoteCalls, 0);
    assert.equal(packet.activated, 0);
    assert.equal(packet.learningPromoted, false);
    assert.equal(packet.humanDecision, 'REQUIRED');
    // The admitted rows are claimable through the REAL queue.
    const queue = openQueue(queuePath);
    try {
      const lease = queue.claimNext(TENANT, 'memory_curator', 'worker-1', 120000);
      assert.ok(lease, 'an admitted reading story is claimable');
    } finally {
      queue.close();
    }
  });
});

test('12d-296: an UNREGISTERED source refuses — the adopted door, verbatim, nothing written', () => {
  withWorkspace((dir) => {
    const { args, queuePath } = preparedWorkspace(dir, 'unregistered-source');
    const packet = runBoundAdmissionCommand(args);
    assert.equal(packet.kind, 'BOUND_ADMISSION_REFUSED');
    assert.match(packet.reason, /NO REGISTER, NO BINDING/);
    assert.equal(packet.humanDecision, 'REQUIRED');
    const queue = openQueue(queuePath);
    try {
      assert.equal(queue.summary(TENANT).counts.length, 0, 'nothing was written');
    } finally {
      queue.close();
    }
  });
});

test('12d-296: a TAMPERED register refuses — the chain is the proof, nothing written', () => {
  withWorkspace((dir) => {
    const { args, registerPath, queuePath } = preparedWorkspace(dir);
    const lines = JSON.parse(readFileSync(registerPath, 'utf8')) as string[];
    const tampered = lines.map((l) => (l.includes(SOURCE_ID) ? l.replace('OPEN_SOURCE_REPO', 'PUBLISHED_STANDARD') : l));
    writeFileSync(registerPath, JSON.stringify(tampered), 'utf8');
    const packet = runBoundAdmissionCommand(args);
    assert.equal(packet.kind, 'BOUND_ADMISSION_REFUSED');
    assert.match(packet.reason, /tampered|fail closed/);
    const queue = openQueue(queuePath);
    try {
      assert.equal(queue.summary(TENANT).counts.length, 0, 'nothing was written');
    } finally {
      queue.close();
    }
  });
});

test('12d-296: a malformed register file refuses cleanly — no stack, nothing written', () => {
  withWorkspace((dir) => {
    const { args, registerPath, queuePath } = preparedWorkspace(dir);
    writeFileSync(registerPath, '{not json', 'utf8');
    const packet = runBoundAdmissionCommand(args);
    assert.equal(packet.kind, 'BOUND_ADMISSION_REFUSED');
    assert.match(packet.reason, /unreadable or is not valid JSON/);
    const queue = openQueue(queuePath);
    try {
      assert.equal(queue.summary(TENANT).counts.length, 0);
    } finally {
      queue.close();
    }
  });
});

test('12d-296: a non-array register file refuses', () => {
  withWorkspace((dir) => {
    const { args, registerPath, queuePath } = preparedWorkspace(dir);
    writeFileSync(registerPath, JSON.stringify({ smuggled: true }), 'utf8');
    const packet = runBoundAdmissionCommand(args);
    assert.equal(packet.kind, 'BOUND_ADMISSION_REFUSED');
    assert.match(packet.reason, /JSON array of register lines/);
    const queue = openQueue(queuePath);
    try {
      assert.equal(queue.summary(TENANT).counts.length, 0);
    } finally {
      queue.close();
    }
  });
});

test('12d-296: an unreadable body file refuses before the queue is opened', () => {
  withWorkspace((dir) => {
    const { args, bodyPath, queuePath } = preparedWorkspace(dir);
    rmSync(bodyPath);
    const packet = runBoundAdmissionCommand(args);
    assert.equal(packet.kind, 'BOUND_ADMISSION_REFUSED');
    assert.match(packet.reason, /body file is unreadable/);
    const queue = openQueue(queuePath);
    try {
      assert.equal(queue.summary(TENANT).counts.length, 0);
    } finally {
      queue.close();
    }
  });
});

test('12d-296: an oversize body refuses by the INGEST contract bound — nothing read further', () => {
  withWorkspace((dir) => {
    const { args, bodyPath, queuePath } = preparedWorkspace(dir);
    writeFileSync(bodyPath, 'x'.repeat(100_001), 'utf8');
    const packet = runBoundAdmissionCommand(args);
    assert.equal(packet.kind, 'BOUND_ADMISSION_REFUSED');
    assert.match(packet.reason, /100000 chars/);
    const queue = openQueue(queuePath);
    try {
      assert.equal(queue.summary(TENANT).counts.length, 0);
    } finally {
      queue.close();
    }
  });
});

test('12d-296: the CLI never registers — its store save throws', () => {
  const store = new ReadOnlyRegisterStore(['"x"']);
  assert.equal(store.load()?.length, 1);
  assert.throws(() => store.save([] as readonly string[]), /never writes a register/);
});

test('12d-296: guardrails and policy are pinned and frozen — executor, provenance-bound, local', () => {
  assert.ok(Object.isFrozen(BOUND_ADMISSION_CLI_POLICY));
  assert.ok(Object.isFrozen(BOUND_ADMISSION_CLI_GUARDRAILS));
  assert.deepEqual(BOUND_ADMISSION_CLI_POLICY.flagOrder, ['--queue', '--register', '--genesis', '--source', '--tenant', '--document', '--title', '--body']);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.localIoOnly, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.noModelCallEver, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.noNetworkPrimitive, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.remoteCalls, 0);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.modelCalls, 0);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.executorNotDecider, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.provenanceRequired, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.reDerivesDigestFromTheText, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.registersNothing, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.oneDocumentPerInvocation, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.refusedWithExitTwo, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.printsPacketsVerbatim, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.collectsNothing, true);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.learningPromoted, false);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.activated, 0);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.automaticRecovery, false);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.billionUsersProven, false);
  assert.equal(BOUND_ADMISSION_CLI_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('12d-296: source-level purity — the CLI imports the REAL doors and carries NO network primitive', () => {
  const src = readFileSync(new URL('./xiv-bound-admission.cli.ts', import.meta.url), 'utf8');
  assert.ok(src.includes('prepareDocumentStories'), 'the REAL ingest contract is the digest derivation');
  assert.ok(src.includes('admitReadingStories'), 'the REAL adopted door is called, never re-implemented');
  assert.ok(src.includes('readSourceRegisterEntries'), 'the register census is the chain-walk measure');
  for (const forbidden of ['fetch(', 'http://', 'https://127.0.0.1', '11434', 'child_process', 'buildLoopbackCaller', 'XMLHttpRequest', 'WebSocket']) {
    assert.ok(!src.includes(forbidden), `no ${forbidden} in the CLI`);
  }
});