"use client";

// 12D-316 — the stale re-ingestion plan panel (client side): the story
// shell's evidence-refresh surface. The operator pastes the REAL 12D-305
// memory packet, the re-fetched digests, and the NEW bytes of a stale
// source; the LOCAL server re-derives the STALE assessment through the
// REAL staleness contract and the successor's bounded stories through the
// REAL ingest door. The lineage is disclosed in full (recorded head →
// successor head). NOTHING is admitted here — the operator submits the
// emitted stories through the REAL admission doors. No model is called.
// Nothing is persisted.

import { useState } from "react";

type CardView = {
  kind: "VERIFIED_STALE_REINGEST_PLAN";
  display: {
    headline: string;
    tenantId: string;
    staleDocumentId: string;
    previousDigestHead: string;
    currentDigestHead: string;
    newDocumentId: string;
    newTitle: string;
    newDigestHead: string;
    chunkCount: number;
    storyIds: readonly string[];
    stoppedBefore: string;
    operatorNote: string;
  };
};

type RefusedView = {
  kind: "REFUSED";
  reason: string;
  display: { headline: string; bodyText: string; operatorNote: string };
};

type PlanViewModel = CardView | RefusedView;

export default function StaleReingestPanel() {
  const [memoryText, setMemoryText] = useState("");
  const [memoryFile, setMemoryFile] = useState<string | null>(null);
  const [digestsText, setDigestsText] = useState("");
  const [staleDocumentId, setStaleDocumentId] = useState("");
  const [newDocumentId, setNewDocumentId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBodyText, setNewBodyText] = useState("");
  const [vm, setVm] = useState<PlanViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File | null) {
    if (!file) return;
    setMemoryFile(file.name);
    setMemoryText(await file.text());
    setVm(null);
    setError(null);
  }

  async function plan() {
    setError(null);
    if (!memoryText || !digestsText || !staleDocumentId || !newDocumentId || !newTitle || !newBodyText) return;
    let memoryPacket: unknown;
    let currentDigests: unknown;
    try {
      memoryPacket = JSON.parse(memoryText) as unknown;
    } catch (err) {
      setError(`the memory packet is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    try {
      currentDigests = JSON.parse(digestsText) as unknown;
    } catch (err) {
      setError(`the current digests are not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    setBusy(true);
    setVm(null);
    try {
      const res = await fetch("/api/ingest/stale-reingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memoryPacket, currentDigests, staleDocumentId, newDocumentId, newTitle, newBodyText }),
      });
      if (!res.ok) {
        setError(`stale-reingest endpoint returned HTTP ${res.status}; nothing was rendered`);
      } else {
        setVm((await res.json()) as PlanViewModel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const ready = memoryText.length > 0 && digestsText.length > 0 && staleDocumentId.length > 0
    && newDocumentId.length > 0 && newTitle.length > 0 && newBodyText.length > 0;

  return (
    <section className="rounded-lg border border-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-950">
      <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        Stale re-ingestion plan · evidence refresh · no model call · admits nothing · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        A STALE source (the staleness card said its bytes moved) requires work —
        this is where the work is PREPARED. Paste the REAL 12D-305 memory packet,
        the re-fetched digests, the stale document&apos;s id, and the NEW bytes
        under a genuinely NEW successor id; the LOCAL server re-derives the STALE
        assessment through the REAL staleness contract and emits bounded reading
        stories through the REAL ingest door, with the lineage disclosed in full
        (recorded head → successor head). NOTHING is admitted here: submit the
        emitted stories through the REAL admission doors yourself. A CURRENT or
        UNCHECKED source has nothing to re-ingest and refuses. No model runs
        here. Nothing is persisted.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose memory packet JSON…
          <input
            id="stale-reingest-file"
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              void loadFile(e.target.files?.[0] ?? null);
            }}
          />
        </label>
        {memoryFile !== null && (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            loaded: {memoryFile}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            void plan();
          }}
          disabled={busy || !ready}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Deriving…" : "Derive re-ingestion plan"}
        </button>
      </div>

      <textarea
        id="stale-reingest-packet"
        value={memoryText}
        onChange={(e) => {
          setMemoryText(e.target.value);
          setMemoryFile(null);
        }}
        rows={4}
        spellCheck={false}
        placeholder='{ "kind": "ASSISTANT_MEMORY_READ", "policyVersion": "12d-305-v1", … }'
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />
      <textarea
        id="stale-reingest-digests"
        value={digestsText}
        onChange={(e) => {
          setDigestsText(e.target.value);
        }}
        rows={3}
        spellCheck={false}
        placeholder='[{ "documentId": "…", "digestSha256": "<lowercase hex64 re-fetched NOW>" }, …]'
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input
          id="stale-reingest-stale-id"
          value={staleDocumentId}
          onChange={(e) => {
            setStaleDocumentId(e.target.value);
          }}
          spellCheck={false}
          placeholder="stale document id (assessed STALE by the staleness card)"
          className="w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        />
        <input
          id="stale-reingest-new-id"
          value={newDocumentId}
          onChange={(e) => {
            setNewDocumentId(e.target.value);
          }}
          spellCheck={false}
          placeholder="successor document id (genuinely NEW — never colliding)"
          className="w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        />
      </div>
      <input
        id="stale-reingest-new-title"
        value={newTitle}
        onChange={(e) => {
          setNewTitle(e.target.value);
        }}
        spellCheck={false}
        placeholder="successor source title (1..200 chars)"
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />
      <textarea
        id="stale-reingest-new-body"
        value={newBodyText}
        onChange={(e) => {
          setNewBodyText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder="Paste the NEW source bytes (≤100,000 chars; paragraphs ≤2200 chars — the REAL ingest door refuses over-budget text; chunk deliberately, never silently)"
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 text-sm leading-6 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />

      {error !== null && (
        <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-xs break-words text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {vm !== null && vm.kind === "REFUSED" && (
        <section className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
            Stale re-ingestion plan · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_STALE_REINGEST_PLAN" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Stale re-ingestion plan · verified · re-derived through the REAL contracts only
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <p className="mt-1 font-mono text-xs break-all text-neutral-500 dark:text-neutral-400">
            tenant: {vm.display.tenantId} · successor title: {vm.display.newTitle}
          </p>
          <div className="mt-3 rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">
            <p>stale document: {vm.display.staleDocumentId}</p>
            <p>recorded evidence head: {vm.display.previousDigestHead}</p>
            <p>current (moved) head: {vm.display.currentDigestHead}</p>
            <p>successor id: {vm.display.newDocumentId} · new evidence head: {vm.display.newDigestHead}</p>
            <p>bounded chunks: {vm.display.chunkCount}</p>
          </div>
          <div className="mt-3 rounded-md border border-neutral-300 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
            <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
              emitted stories (submit these through the REAL admission doors — not here):
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs break-all text-neutral-800 dark:text-neutral-200">
              {vm.display.storyIds.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
          <p className="mt-3 font-mono text-xs break-all text-neutral-500 dark:text-neutral-400">
            {vm.display.stoppedBefore}
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}