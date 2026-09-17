"use client";

// 12D-293 — the reading-register-census panel (client side). The
// operator drops a register submission (register genesis + register
// lines) as a JSON file or pastes its text; the panel POSTs the RAW
// TEXT to the LOCAL /api/ingest/register-census route handler and
// renders ONLY the frozen view model the LOCAL server-side verifier
// returned. The browser never runs the chain replay and never receives
// refused content. The records show exactly the REGISTERED public
// sources — REGISTERED IS NOT READ: the census's sourcesRead field is
// pinned 0 by the register contract; measured reads live in the queue
// and the 12D-285 draft receipts. The view has no write path, and the
// shell decides nothing.

import { useState } from "react";

type CensusRecord = {
  sourceId: string;
  sourceClass: string;
  sourceUrl: string;
  licenseNote: string;
  entryDigest: string;
};

type RegisterCensusViewModel =
  | {
      kind: "VERIFIED_REGISTER_CENSUS";
      policyVersion: string;
      display: {
        headline: string;
        entries: number;
        capacity: number;
        remainingCapacity: number;
        byClass: Record<string, number>;
        sourcesRead: 0;
        headDigest: string;
        records: CensusRecord[];
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

export default function RegisterCensusPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<RegisterCensusViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/register-census", { method: "POST", body: text });
      if (!res.ok) {
        setError(`register-census endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as RegisterCensusViewModel);
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
        Reading register census · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a reading-source-register submission (register genesis +
        register lines). The full 12D-276 hash-chain replay and the
        measured census re-run in the LOCAL server process before
        anything renders — a tampered line, an empty register, or a
        malformed submission refuses the WHOLE register with zero register
        content. Verified records show exactly the REGISTERED public
        sources. REGISTERED IS NOT READ — the census counts what is
        registered, never what has been read; reads are measured by the
        queue and the draft receipts. Nothing is persisted and nothing
        leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose register JSON…
          <input
            id="register-census-file"
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
        id="register-census-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "registerGenesis": …, "lines": ["<register line 1>", …] }'
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
            Reading register census · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_REGISTER_CENSUS" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Reading register census · VERIFIED · registered is NOT read
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>entries: {vm.display.entries}</div>
            <div>capacity: {vm.display.capacity}</div>
            <div>remainingCapacity: {vm.display.remainingCapacity}</div>
            <div>sourcesRead: {vm.display.sourcesRead} (pinned by the register contract)</div>
            <div>headDigest: {vm.display.headDigest}</div>
            {Object.entries(vm.display.byClass).map(([cls, count]) => (
              <div key={cls}>
                byClass[{cls}]: {count}
              </div>
            ))}
          </dl>
          {vm.display.records.length > 0 && (
            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
              {vm.display.records.map((rec) => (
                <div
                  key={rec.entryDigest}
                  className="rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs break-all text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                >
                  <div>sourceId: {rec.sourceId}</div>
                  <div>sourceClass: {rec.sourceClass}</div>
                  <div>sourceUrl: {rec.sourceUrl}</div>
                  <div>licenseNote: {rec.licenseNote}</div>
                  <div>entryDigest: {rec.entryDigest}</div>
                </div>
              ))}
            </div>
          )}
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