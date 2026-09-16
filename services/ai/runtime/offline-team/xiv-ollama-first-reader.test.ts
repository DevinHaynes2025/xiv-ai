// 12D-280 adversarial suite — the Ollama first reader.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import { prepareDocumentStories } from './xiv-document-ingest';
import { admitBoundReading } from './xiv-bound-admission';
import { registerReadingSource, type ReadingSourceStore } from './xiv-reading-source-register';
import {
  OLLAMA_FIRST_READER_POLICY, OLLAMA_FIRST_READER_GUARDRAILS,
  runOllamaFirstReader,
} from './xiv-ollama-first-reader';

const GENESIS = '12d-280-register-genesis';
const TENANT = 'reading-tenant';
const SOURCE_ID = 'quantumlib-cirq';
const DOC_ID = 'cirq-reading-1';
const TITLE = 'Cirq supervised reading';
const MODEL = 'qwen2.5-coder:7b';
const DRAFT = 'Cirq is an open-source Python framework for writing, simulating, and optimizing quantum circuits on NISQ devices.';

// The 12D-274/279 lesson AGAIN: short paragraphs greedy-pack into ONE
// chunk. Three ~1,200-char paragraphs pack into THREE chunks
// (1,200 + 2 + 1,200 > 2,200).
const pad = (seed: string): string => seed + '.'.repeat(Math.max(0, 1200 - seed.length));
const DOC = [
  pad('First paragraph of the cirq reading: circuit construction primitives and gate operations.'),
  pad('Second paragraph of the cirq reading: simulation engines and noise modeling for NISQ devices.'),
  pad('Third paragraph of the cirq reading: parameter study tooling for variational quantum algorithms.'),
].join('\n\n');

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
}

type Setup = {
  dir: string;
  queuePath: string;
  bound: ReturnType<typeof admitBoundReading>;
  submission: { tenantId: string; documentId: string; title: string; bodyText: string };
  storyIds: readonly string[];
};

function setup(): Setup {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId: TENANT, sourceId: SOURCE_ID,
    title: 'Cirq — open-source quantum circuit framework',
    sourceUrl: 'https://github.com/quantumlib/Cirq',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'Apache 2.0 — public repository, cited verbatim',
  });
  const prepared = prepareDocumentStories({ tenantId: TENANT, documentId: DOC_ID, title: TITLE, bodyText: DOC });
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-280-'));
  const queuePath = join(dir, 'reader-queue.sqlite');
  const q = new OfflineStoryQueue(queuePath);
  try {
    const bound = admitBoundReading(q, store, GENESIS, prepared, {
      tenantId: TENANT, sourceId: SOURCE_ID, documentId: DOC_ID,
      documentDigestSha256: prepared.documentDigestSha256,
    });
    return {
      dir, queuePath, bound,
      submission: { tenantId: TENANT, documentId: DOC_ID, title: TITLE, bodyText: DOC },
      storyIds: prepared.stories.map((s) => s.id),
    };
  } finally { q.close(); }
}

async function withQueue<T>(s: Setup, fn: (q: OfflineStoryQueue) => Promise<T> | T): Promise<T> {
  const q = new OfflineStoryQueue(s.queuePath);
  try { return await fn(q); } finally { q.close(); rmSync(s.dir, { recursive: true, force: true }); }
}

const requestFor = (s: Setup, storyId: string, overrides: Record<string, unknown> = {}) =>
  ({ tenantId: TENANT, storyId, sourceId: SOURCE_ID, documentId: DOC_ID, title: TITLE, bodyText: DOC, ...overrides });

const goodCaller = (captured?: string[]) => async (prompt: string) => {
  if (captured) captured.push(prompt);
  return { model: MODEL, response: DRAFT };
};

const sha256 = (v: string) => createHash('sha256').update(v, 'utf8').digest('hex');

describe('12D-280 — Ollama first reader', () => {
  it('settles a real model DRAFT into the queue as AWAITING_REVIEW with the pinned flags', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      const captured: string[] = [];
      const packet = await runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!), goodCaller(captured));
      assert.equal(packet.kind, 'OLLAMA_FIRST_READER_DRAFT');
      assert.equal(packet.policyVersion, '12d-280-v1');
      assert.equal(packet.model, MODEL);
      assert.equal(packet.loopbackEndpoint, '127.0.0.1:11434');
      assert.equal(packet.modelCalls, 1);
      assert.equal(packet.remoteCalls, 0);
      assert.equal(packet.activated, 0);
      assert.equal(packet.learningPromoted, false);
      assert.equal(packet.modelWeightMutation, false);
      assert.equal(packet.humanDecision, 'REQUIRED');
      assert.equal(packet.storyState, 'AWAITING_REVIEW');
      assert.equal(packet.draftSha256, sha256(DRAFT));
      assert.equal(packet.promptSha256, sha256(captured[0]!));
      // The queue's own record is the truth about the settlement.
      const story = q.inspectStory(TENANT, s.storyIds[0]!);
      assert.equal(story?.state, 'AWAITING_REVIEW');
      assert.equal(story?.outputHash, sha256(DRAFT));
      assert.equal(q.inspectHeldLease(), null);
    });
  });

  it('the prompt carries the re-derived chunk text with UNTRUSTED framing and nothing else', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      const captured: string[] = [];
      await runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!), goodCaller(captured));
      const prompt = captured[0]!;
      assert.ok(prompt.includes('<<<UNTRUSTED_DOCUMENT_TEXT>>>'));
      assert.ok(prompt.includes('<<<END_UNTRUSTED_DOCUMENT_TEXT>>>'));
      assert.ok(prompt.includes('First paragraph'));
      assert.ok(!prompt.includes('Second paragraph'));
      assert.ok(prompt.includes(`doc:${DOC_ID}`));
    });
  });

  it('refuses a caller that reports a foreign model and settles the attempt FAILED durably', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(
        () => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!), async () => ({ model: 'some-remote-model', response: DRAFT })),
        /may settle a reading draft/,
      );
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'FAILED');
      assert.equal(q.inspectHeldLease(), null);
    });
  });

  it('a caller that throws (Ollama unreachable) settles FAILED durably — never a silent retry', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(
        () => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!), async () => { throw new Error('connect ECONNREFUSED 127.0.0.1:11434'); }),
        /ECONNREFUSED/,
      );
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'FAILED');
      assert.equal(q.inspectHeldLease(), null);
    });
  });

  it('refuses a credential-shaped draft and settles FAILED', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(
        () => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!), async () => ({ model: MODEL, response: 'the leaked key is sk-abcdefghijklmnopqrst' })),
        /credential-shaped content/,
      );
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'FAILED');
    });
  });

  it('refuses an empty draft and an over-budget draft', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(
        () => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!), async () => ({ model: MODEL, response: '   ' })),
        /empty model draft/,
      );
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'FAILED');
      const s2 = setup();
      await withQueue(s2, async (q2) => {
        await assert.rejects(
          () => runOllamaFirstReader(q2, s2.bound, requestFor(s2, s2.storyIds[0]!), async () => ({ model: MODEL, response: 'x'.repeat(8001) })),
          /exceeds 8000/,
        );
        assert.equal(q2.inspectStory(TENANT, s2.storyIds[0]!)?.state, 'FAILED');
      });
    });
  });

  it('refuses a malformed caller result (extra key / reordered / non-object)', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(
        () => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!), async () => ({ response: DRAFT, model: MODEL })),
        /exactly the keys \[model, response\]/,
      );
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'FAILED');
      const s2 = setup();
      await withQueue(s2, async (q2) => {
        await assert.rejects(
          () => runOllamaFirstReader(q2, s2.bound, requestFor(s2, s2.storyIds[0]!), async () => ({ model: MODEL, response: DRAFT, extra: 1 })),
          /exactly the keys \[model, response\]/,
        );
      });
    });
  });

  it('refuses text that is not the bound document BEFORE claiming (digest cross-gate)', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(
        () => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!, { bodyText: `TAMPERED. ${DOC.slice(10)}` }), goodCaller()),
        /not the bound document/,
      );
      // Nothing was claimed and the story is untouched.
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'READY');
      assert.equal(q.inspectHeldLease(), null);
    });
  });

  it('refuses a credential-carrying submission at the re-run ingest gate', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(
        () => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!, { bodyText: `a key sk-abcdefghijklmnopqrst appears here. ${DOC.slice(30)}` }), goodCaller()),
        /credential-shaped content/,
      );
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'READY');
      assert.equal(q.inspectHeldLease(), null);
    });
  });

  it('refuses foreign story, source, and tenant BEFORE claiming', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(() => runOllamaFirstReader(q, s.bound, requestFor(s, 'doc-other-doc-chunk-1'), goodCaller()), /not one of the re-derived/);
      await assert.rejects(() => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!, { sourceId: 'other-source' }), goodCaller()), /does not match the bound source/);
      await assert.rejects(() => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!, { tenantId: 'other-tenant' }), goodCaller()), /does not match the binding tenant/);
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'READY');
      assert.equal(q.inspectHeldLease(), null);
    });
  });

  it('never jumps the queue: a non-head request returns unstarted and leaves the head READY', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(
        () => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[1]!), goodCaller()),
        /never jumps the queue/,
      );
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'READY');
      assert.equal(q.inspectStory(TENANT, s.storyIds[1]!)?.state, 'READY');
      assert.equal(q.inspectHeldLease(), null);
    });
  });

  it('refuses malformed bound results, requests, and callers before anything is claimed', async () => {
    const s = setup();
    await withQueue(s, async (q) => {
      await assert.rejects(() => runOllamaFirstReader(q, null, requestFor(s, s.storyIds[0]!), goodCaller()), /BOUND_READING_ADMITTED result object/);
      await assert.rejects(() => runOllamaFirstReader(q, { ...s.bound, kind: 'OTHER' }, requestFor(s, s.storyIds[0]!), goodCaller()), /12d-278-v1 is required/);
      await assert.rejects(() => runOllamaFirstReader(q, { ...s.bound, learningPromoted: true }, requestFor(s, s.storyIds[0]!), goodCaller()), /tampered honest flags/);
      await assert.rejects(() => runOllamaFirstReader(q, s.bound, null, goodCaller()), /first-reader request object/);
      await assert.rejects(() => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!, { extra: 1 }), goodCaller()), /exactly the keys/);
      await assert.rejects(() => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!), 42), /injected loopback caller/);
      await assert.rejects(() => runOllamaFirstReader(q, s.bound, requestFor(s, s.storyIds[0]!), null), /injected loopback caller/);
      await assert.rejects(() => runOllamaFirstReader('not-a-queue', s.bound, requestFor(s, s.storyIds[0]!), goodCaller()), /trusted OfflineStoryQueue/);
      assert.equal(q.inspectStory(TENANT, s.storyIds[0]!)?.state, 'READY');
    });
  });

  it('is deterministic: identical inputs produce an identical prompt hash and packet', async () => {
    const s1 = setup();
    const s2 = setup();
    await withQueue(s1, async (q1) => {
      await withQueue(s2, async (q2) => {
        const p1 = await runOllamaFirstReader(q1, s1.bound, requestFor(s1, s1.storyIds[0]!), goodCaller());
        const p2 = await runOllamaFirstReader(q2, s2.bound, requestFor(s2, s2.storyIds[0]!), goodCaller());
        assert.equal(JSON.stringify(p1), JSON.stringify(p2));
        assert.equal(p1.promptSha256, p2.promptSha256);
      });
    });
  });

  it('pins the policy and guardrails', () => {
    assert.equal(OLLAMA_FIRST_READER_POLICY.modelName, MODEL);
    assert.equal(OLLAMA_FIRST_READER_POLICY.loopbackEndpoint, '127.0.0.1:11434');
    assert.equal(OLLAMA_FIRST_READER_POLICY.ownerId, 'ollama-first-reader');
    assert.equal(OLLAMA_FIRST_READER_GUARDRAILS.remoteCalls, 0);
    assert.equal(OLLAMA_FIRST_READER_GUARDRAILS.injectedCallerOnly, true);
    assert.equal(OLLAMA_FIRST_READER_GUARDRAILS.learningPromoted, false);
    assert.equal(OLLAMA_FIRST_READER_GUARDRAILS.modelWeightMutation, false);
    assert.equal(OLLAMA_FIRST_READER_GUARDRAILS.humanDecision, 'REQUIRED');
    assert.equal(OLLAMA_FIRST_READER_GUARDRAILS.automaticRecovery, false);
    assert.equal(OLLAMA_FIRST_READER_GUARDRAILS.billionUsersProven, false);
    assert.equal(OLLAMA_FIRST_READER_GUARDRAILS.modelCallsCountedNotPinnedZero, true);
    assert.equal(OLLAMA_FIRST_READER_GUARDRAILS.shellDatabaseFree, true);
  });
});