"use client";

// 12D-282 — the reading-provenance panel (client side). The operator
// drops a pathway-ledger submission (ledger genesis + ledger lines) as
// a JSON file or pastes its text; the panel POSTs the RAW TEXT to the
// LOCAL /api/ingest/provenance route handler and renders ONLY the
// frozen view model the LOCAL server-side verifier returned. The
// browser never runs the replay and never receives refused content.
// The records show exactly the provenance refs the ledgered candidates
// carry (source id + register/document digests) — carried, never
// re-proven. The view has no write path, and the shell decides nothing.

import { useState } from "react";

type ProvenanceRecord = {
  pathwayId: string;
  version: number;
  domain: string;
  sourceId: string;
  registerEntryDigestSha256: string;
  documentDigestSha256: string;
  ledgerEntryDigest: string;
};

type ReadingProvenanceViewModel =
  | {
      kind: "VERIFIED_READING_PROVENANCE";
      policyVersion: string;
      display: {
        headline: string;
        ledgerEntries: number;
        readingProvenanceEntries: number;
        otherEntries: number;
        bySource: Record<string, number>;
        records: ProvenanceRecord[];
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

export default function ProvenancePanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<ReadingProvenanceViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/provenance", { method: "POST", body: text });
      if (!res.ok) {
        setError(`provenance endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as ReadingProvenanceViewModel);
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
        Reading provenance surface · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a pathway-ledger submission (ledger genesis + ledger lines).
        The full 12D-264 hash-chain replay and the 12D-281 provenance view
        re-run in the LOCAL server process before anything renders — a
        tampered ledger, an empty ledger, an over-budget ledger, or a
        malformed carried ref refuses the WHOLE submission with zero ledger
        content. Verified records show exactly the provenance refs the
        ledgered candidates carry — an entry counts as reading provenance
        ONLY if its own evidenceRefs carry a reading-source ref. Nothing is
        persisted and nothing leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose pathway ledger JSON…
          <input
            id="provenance-file"
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
        id="provenance-text"
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
            Reading provenance · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_READING_PROVENANCE" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Reading provenance · VERIFIED · carried, never re-proven
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>ledgerEntries: {vm.display.ledgerEntries}</div>
            <div>readingProvenanceEntries: {vm.display.readingProvenanceEntries}</div>
            <div>otherEntries: {vm.display.otherEntries}</div>
            {Object.entries(vm.display.bySource).map(([source, count]) => (
              <div key={source}>
                bySource[{source}]: {count}
              </div>
            ))}
          </dl>
          {vm.display.records.length > 0 && (
            <div className="mt-4 space-y-2">
              {vm.display.records.map((rec) => (
                <div
                  key={`${rec.pathwayId}-${rec.ledgerEntryDigest}`}
                  className="rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs break-all text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                >
                  <div>pathwayId: {rec.pathwayId}</div>
                  <div>version: {rec.version}</div>
                  <div>domain: {rec.domain}</div>
                  <div>sourceId: {rec.sourceId}</div>
                  <div>registerEntryDigestSha256: {rec.registerEntryDigestSha256}</div>
                  <div>documentDigestSha256: {rec.documentDigestSha256}</div>
                  <div>ledgerEntryDigest: {rec.ledgerEntryDigest}</div>
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