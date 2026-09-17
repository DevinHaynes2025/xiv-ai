"use client";

// 12D-306 — the assistant-memory panel (client side). The operator
// pastes the RAW 12D-305 memory packet (or drops it as a JSON file);
// the panel POSTs the RAW TEXT to the LOCAL /api/ingest/assistant-memory
// route handler and renders ONLY the frozen view model the LOCAL
// server-side verifier returned. The browser never re-derives the
// digest and never receives refused packet content. The verified view
// shows the carried reviewed facts (story, output-digest head, objective
// with its disclosed truncation) and every bound that bit — the mini
// brain's semantic memory, read-only, nothing learned. The view has no
// write path, and the shell decides nothing.

import { useState } from "react";

type MemoryEntry = {
  storyId: string;
  outputHashHead: string;
  objective: string;
  objectiveTruncated: boolean;
};

type AssistantMemoryViewModel =
  | {
      kind: "VERIFIED_ASSISTANT_MEMORY";
      policyVersion: string;
      display: {
        headline: string;
        tenantId: string;
        carriedCount: number;
        doneCount: number;
        scannedRows: number;
        truncatedNote: string;
        entries: MemoryEntry[];
        operatorNote: string;
      };
    }
  | {
      kind: "REFUSED";
      policyVersion: string;
      reason: string;
      display: { headline: string; bodyText: string; operatorNote: string };
    };

export default function AssistantMemoryPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<AssistantMemoryViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/assistant-memory", { method: "POST", body: text });
      if (!res.ok) {
        setError(`assistant-memory endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as AssistantMemoryViewModel);
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
        Mini-brain memory surface · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a 12D-305 assistant-memory packet (produced runtime-side over a
        trusted queue). The full re-verification runs in the LOCAL server
        process before anything renders — exact keys in order, the memory
        digest RE-DERIVED from the entries, objectives re-screened (secrets
        never render), honest flags, and the disclosed bounds re-checked — so
        a tampered digest, a smuggled secret, or an inconsistent truncation
        flag refuses the WHOLE packet with zero packet content. A verified
        render shows the carried reviewed facts and every bound that bit —
        read-only, nothing learned. Nothing is persisted and nothing leaves
        this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose memory packet JSON…
          <input
            id="assistant-memory-file"
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              void loadFile(e.target.files?.[0] ?? null);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            void verify();
          }}
          disabled={busy || text.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Re-verifying…" : "Re-verify & render"}
        </button>
      </div>

      <textarea
        id="assistant-memory-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "kind": "ASSISTANT_MEMORY_READ", "policyVersion": "12d-305-v1", … }'
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
            Mini-brain memory · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_ASSISTANT_MEMORY" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Mini-brain memory · VERIFIED · read-only, nothing learned
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>tenantId: {vm.display.tenantId}</div>
            <div>
              reviewed facts: {vm.display.carriedCount} carried of {vm.display.doneCount} DONE
              (scanned {vm.display.scannedRows} rows)
            </div>
            <div>bounds: {vm.display.truncatedNote}</div>
          </dl>
          <div className="mt-3 space-y-2">
            {vm.display.entries.map((entry) => (
              <div
                key={entry.storyId}
                className="rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs break-words text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
              >
                <div>storyId: {entry.storyId}</div>
                <div>outputHash: {entry.outputHashHead}</div>
                <div>
                  objective{entry.objectiveTruncated ? " (truncated at the 2,000-char cap)" : ""}:{" "}
                  {entry.objective}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}