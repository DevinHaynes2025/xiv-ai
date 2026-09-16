"use client";

// 12D-274 — the document-ingest panel (client side). The operator drops a
// document submission ({ tenantId, documentId, title, bodyText } as JSON);
// the panel POSTs the RAW TEXT to the LOCAL /api/ingest/document route
// handler and renders ONLY the frozen result the LOCAL server-side
// contract returned: the source-bound digest, the measured chunk count,
// and the story ids of the bounded ORDINARY reading stories. The browser
// never verifies. A refused submission renders the honest refusal with
// zero document content — an oversized document refuses (it is never
// silently truncated) and credential-shaped content refuses inside the
// validator. The prepared stories are displayed by reference (id and
// objective length), never re-dumped. Admission into the queue happens
// through the REAL queue contract; review stays human; reading evidence
// LEDGERS, never activates (any weight-mutation learning promotion stays
// CEO-gated and is not part of this surface). The shell decides nothing.

import { useState } from "react";

type PreparedStory = {
  id: string;
  objectiveLength: number;
};

type DocumentIngestResult =
  | {
      kind: "PREPARED";
      policyVersion: string;
      documentId: string;
      tenantId: string;
      documentDigestSha256: string;
      chunkCount: number;
      stories: PreparedStory[];
    }
  | {
      kind: "REFUSED";
      policyVersion: string;
      reason: string;
      display: { headline: string; bodyText: string; operatorNote: string };
    };

export default function DocumentIngestPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<DocumentIngestResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/document", { method: "POST", body: text });
      if (!res.ok) {
        setError(`document endpoint returned HTTP ${res.status}; nothing was prepared`);
        setVm(null);
      } else {
        setVm((await res.json()) as DocumentIngestResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setVm(null);
    } finally {
      setBusy(false);
    }
  }

  async function loadFile(file: File | null) {
    if (!file) return;
    setText(await file.text());
    setVm(null);
    setError(null);
  }

  return (
    <section className="rounded-lg border border-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-950">
      <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        Document ingest surface · fail-closed · reading = the queue
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a document submission: {"{ tenantId, documentId, title, bodyText }"}
        {" "}exactly, in that key order. The ingest contract runs in the
        LOCAL server process: the document is bounded (oversized documents
        REFUSE — never silent truncation), credential-shaped content
        REFUSES inside the validator, chunking is deterministic, and every
        produced story carries the document&apos;s digest plus the approved
        master plan hash. Chunk text is quoted as UNTRUSTED DATA — never
        instructions. The prepared stories are ORDINARY queue material for
        the memory_curator role; admission happens through the REAL queue,
        review stays human, and reading evidence accumulates as LEDGERED
        evidence, never activated weights. Nothing leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose document JSON…
          <input
            id="document-file"
            type="file"
            accept=".json,application/json,.txt,text/plain"
            className="hidden"
            onChange={(e) => {
              void loadFile(e.target.files?.[0] ?? null);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            void ingest();
          }}
          disabled={busy || text.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Preparing…" : "Prepare reading stories"}
        </button>
      </div>

      <textarea
        id="document-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "tenantId": "…", "documentId": "…", "title": "…", "bodyText": "…the document text…" }'
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />

      {error !== null && (
        <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-xs break-words text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {vm !== null && vm.kind === "REFUSED" && (
        <section className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
            Document ingest · REFUSED
          </p>
          <h3 className="mt-2 text-lg font-semibold text-amber-800 dark:text-amber-200">
            {vm.display.headline}
          </h3>
          <p className="mt-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
            {vm.display.bodyText}
          </p>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            {vm.display.operatorNote}
          </p>
          <p className="mt-2 font-mono text-xs break-all text-neutral-500 dark:text-neutral-500">
            reason: {vm.reason}
          </p>
        </section>
      )}

      {vm !== null && vm.kind === "PREPARED" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Document ingest · PREPARED · source-bound reading stories
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.chunkCount} bounded reading chunk{vm.chunkCount === 1 ? "" : "s"} from &quot;{vm.documentId}&quot;
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>policyVersion: {vm.policyVersion}</div>
            <div>tenantId: {vm.tenantId}</div>
            <div>documentDigestSha256: <span className="break-all">{vm.documentDigestSha256}</span></div>
            <div>chunkCount: {vm.chunkCount}</div>
          </dl>
          <p className="mt-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            prepared stories:{" "}
            <span className="break-all">
              {vm.stories
                .map((s) => `${s.id} (${s.objectiveLength} chars)`)
                .join(", ")}
            </span>
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            Every chunk is one ORDINARY memory_curator story bound to the
            document digest above and the approved master plan hash.
            Admission happens through the REAL queue; review stays human;
            reading evidence accumulates as LEDGERED evidence, never
            activated — any learning promotion of weights stays a CEO
            decision outside this surface.
          </p>
        </section>
      )}
    </section>
  );
}