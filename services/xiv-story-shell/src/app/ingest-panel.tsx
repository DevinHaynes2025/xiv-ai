"use client";

// 12D-259 — the story-shell ingest panel (client side). The operator drops a
// packet JSON file or pastes its text; the panel POSTs the RAW TEXT to the
// LOCAL /api/ingest route handler and renders ONLY the frozen view models
// the LOCAL server-side verifier returned. The browser never runs the
// verifier (the 12D-242 digest re-derivation needs node:crypto, which cannot
// bundle client-side) and never receives refused packet content. There is no
// approve control here by construction: decisions happen in the custody
// stack (12D-247), never through the shell.

import { useState } from "react";
import PacketPanel from "./packet-panel";
import type { StoryShellIngestResult } from "../../../ai/runtime/offline-team/xiv-story-shell-ingest";

export default function IngestPanel() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<StoryShellIngestResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest", { method: "POST", body: text });
      if (!res.ok) {
        setError(`ingest endpoint returned HTTP ${res.status}; nothing was rendered`);
        setResult(null);
      } else {
        setResult((await res.json()) as StoryShellIngestResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function loadFile(file: File | null) {
    if (!file) return;
    const content = await file.text();
    setText(content);
    setResult(null);
    setError(null);
  }

  return (
    <section className="rounded-lg border border-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-950">
      <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        Ingest a real packet · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a packet JSON file or paste its text below. Verification runs in
        the LOCAL server process; a verified packet renders for display, a
        tampered or malformed one renders a refusal — and a refusal carries
        zero packet content. Nothing is persisted and nothing leaves this
        machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose packet JSON…
          <input
            id="ingest-file"
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
            void ingest();
          }}
          disabled={busy || text.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Verifying…" : "Verify & render"}
        </button>
      </div>

      <textarea
        id="ingest-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "packetVersion": 1, "storyId": "…", … }'
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />

      {error !== null && (
        <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-xs break-words text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {result !== null && result.kind === "UNPARSEABLE" && (
        <section className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
            Submission refused · UNPARSEABLE
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
            The submitted text could not be parsed. Nothing was rendered from
            it — no packet content crossed to this page.
          </p>
          {result.parseReasons.map((reason) => (
            <p key={reason} className="mt-2 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
              reason: {reason}
            </p>
          ))}
        </section>
      )}

      {result !== null && result.kind === "INGESTED" && (
        <div className="mt-4 space-y-4">
          {result.items.map((vm, i) => (
            <PacketPanel key={i} label={`Ingested packet ${i + 1}`} vm={vm} />
          ))}
        </div>
      )}
    </section>
  );
}