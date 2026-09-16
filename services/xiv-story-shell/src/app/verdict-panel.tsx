"use client";

// 12D-262 — the arena-verdict panel (client side). The operator drops a
// verdict submission JSON file or pastes its text; the panel POSTs the RAW
// TEXT to the LOCAL /api/ingest/verdict route handler and renders ONLY the
// frozen view model the LOCAL server-side verifier returned. The browser
// never runs the arena verifier and never receives refused content. There is
// no approve control here by construction: a verified verdict means "ready
// for HUMAN review" — the decision happens in the custody stack (12D-247).

import { useState } from "react";

type VerdictViewModel =
  | {
      kind: "VERIFIED_ARENA_VERDICT";
      policyVersion: string;
      display: {
        headline: string;
        storyId: string;
        packetId: string;
        decidingOver: string;
        arenaReceipt: string;
        transcriptDigest: string;
        purpose: string;
        registeredBy: string;
        registeredAtMs: number;
        operatorNote: string;
      };
    }
  | {
      kind: "REFUSED";
      policyVersion: string;
      reason: string;
      display: { headline: string; bodyText: string; operatorNote: string };
    };

export default function VerdictPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<VerdictViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/verdict", { method: "POST", body: text });
      if (!res.ok) {
        setError(`verdict endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as VerdictViewModel);
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
        Arena verdict surface · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a 12D-258 verdict submission (transcript + packet + custody
        record + registeredBy + nowMs). The whole submission re-verifies as
        ONE unit in the LOCAL server process; a verified verdict renders the
        consensus receipt for human review, a tampered one renders a refusal
        carrying zero content. Nothing is persisted and nothing leaves this
        machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose verdict JSON…
          <input
            id="verdict-file"
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
        id="verdict-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "transcript": …, "packet": …, "verdict": …, "registeredBy": "…", "nowMs": … }'
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
            Verdict · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_ARENA_VERDICT" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Arena verdict · VERIFIED · ready for human review
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>
              storyId: <span className="break-all">{vm.display.storyId}</span>
            </div>
            <div>
              packetId: <span className="break-all">{vm.display.packetId}</span>
            </div>
            <div>
              transcriptDigest: <span className="break-all">{vm.display.transcriptDigest}</span>
            </div>
            <div>
              arenaReceipt: <span className="break-all">{vm.display.arenaReceipt}</span>
            </div>
            <div>purpose: {vm.display.purpose}</div>
            <div>registeredBy: {vm.display.registeredBy}</div>
            <div>registeredAtMs: {vm.display.registeredAtMs}</div>
          </dl>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            Deciding over: {vm.display.decidingOver}
          </p>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}