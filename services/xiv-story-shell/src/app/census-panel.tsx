"use client";

// 12D-271 — the pathway-census panel (client side). The operator drops a
// 12D-264 ledger census submission (ledger genesis + ledger lines) as a
// JSON file or pastes its text; the panel POSTs the RAW TEXT to the LOCAL
// /api/ingest/census route handler and renders ONLY the frozen view model
// the LOCAL server-side verifier returned. The browser never runs the
// replay and never receives refused content. The census reports MEASURED
// counts only — it claims nothing beyond the book, it has no write path,
// and `activated` stays the literal 0. The shell decides nothing.

import { useState } from "react";

type PathwayCensusViewModel =
  | {
      kind: "VERIFIED_PATHWAY_CENSUS";
      policyVersion: string;
      display: {
        headline: string;
        entries: number;
        capacity: number;
        remainingCapacity: number;
        byDomain: Record<string, number>;
        activated: 0;
        status: string;
        operatorNote: string;
      };
    }
  | {
      kind: "REFUSED";
      policyVersion: string;
      reason: string;
      display: { headline: string; bodyText: string; operatorNote: string };
    };

export default function PathwayCensusPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<PathwayCensusViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/census", { method: "POST", body: text });
      if (!res.ok) {
        setError(`census endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as PathwayCensusViewModel);
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
        Pathway census surface · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a 12D-264 ledger census submission (ledger genesis + ledger
        lines). The full hash-chain replay re-runs in the LOCAL server
        process before any count renders — one edited, inserted, or deleted
        line refuses the WHOLE submission with zero content. A verified
        census reports MEASURED counts only: what the book holds, its hard
        cap, and remaining capacity. It claims nothing beyond the book,
        has no write path, and nothing is activated. Nothing is persisted
        and nothing leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose census JSON…
          <input
            id="census-file"
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
          {busy ? "Replaying…" : "Replay & render"}
        </button>
      </div>

      <textarea
        id="census-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "ledgerGenesis": …, "lines": ["<ledger line 1>", …] }'
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
            Pathway census · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_PATHWAY_CENSUS" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Pathway census · VERIFIED · measured counts only
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>entries: {vm.display.entries}</div>
            <div>capacity: {vm.display.capacity}</div>
            <div>remainingCapacity: {vm.display.remainingCapacity}</div>
            <div>
              byDomain:{" "}
              <span className="break-all">
                {Object.entries(vm.display.byDomain)
                  .map(([domain, count]) => `${domain}=${count}`)
                  .join(", ")}
              </span>
            </div>
            <div>activated: {vm.display.activated}</div>
          </dl>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {vm.display.status}
          </p>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}