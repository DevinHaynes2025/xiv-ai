"use client";

// 12D-298 — the dataset-CSV-census panel (client side). The operator
// drops a LOCAL CSV file or pastes its text; the panel POSTs
// { fileName, csvText } to the LOCAL /api/ingest/dataset-csv route
// handler and renders ONLY the frozen view model the LOCAL server-side
// verifier returned. The browser never runs the verification and never
// receives refused cell content. MEASURED COUNTS ONLY: the census
// renders what the CSV measured (rows, per-column nulls, distincts) —
// a census is NOT an ingest: nothing is persisted and nothing leaves
// this machine. PII-shaped headers refuse WHOLE.

import { useState } from "react";

type CsvColumn = {
  name: string;
  nullCount: number;
  nullPercent: number;
  distinctCount: number;
};

type DatasetCsvViewModel =
  | {
      status: "VERIFIED";
      headline: string;
      fileName: string;
      rowCount: number;
      columnCount: number;
      columns: CsvColumn[];
      majorityNullColumns: number;
      measuredChars: number;
      records: never[];
      operatorNote: string;
      policyVersion: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: "REQUIRED";
    }
  | {
      status: "REFUSED";
      headline: string;
      reason: string;
      records: never[];
      policyVersion: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: "REQUIRED";
    };

export default function DatasetCsvPanel() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("pasted.csv");
  const [vm, setVm] = useState<DatasetCsvViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function census() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/dataset-csv", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileName, csvText: text }),
      });
      if (!res.ok) {
        setError(`dataset-csv endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as DatasetCsvViewModel);
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
    setFileName(file.name);
    setVm(null);
    setError(null);
  }

  return (
    <section className="rounded-lg border border-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-950">
      <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        Dataset CSV census · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a LOCAL CSV file (e.g. an aggregate indicators export). The full
        verification — RFC 4180 parsing, header discipline, the PII-shaped
        refusal, and the 2,000,000-row measured ceiling — re-runs in the LOCAL
        server process before anything renders; an inconsistent file refuses
        WHOLE, with zero cell content and refusal reasons that never echo cell
        text. MEASURED COUNTS ONLY: rows, per-column nulls, and distincts.
        A census is NOT an ingest: nothing is persisted and nothing leaves
        this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose CSV…
          <input
            id="dataset-csv-file"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              void loadFile(e.target.files?.[0] ?? null);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            void census();
          }}
          disabled={busy || text.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Measuring…" : "Measure census"}
        </button>
      </div>

      <textarea
        id="dataset-csv-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setFileName("pasted.csv");
        }}
        rows={6}
        spellCheck={false}
        placeholder="Country Name,Country ISO3,Year,Indicator Name,Indicator Code,Value&#10;Angola,AGO,2023,…"
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />

      {error !== null && (
        <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-xs break-words text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {vm !== null && vm.status === "REFUSED" && (
        <section className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
            Dataset CSV census · REFUSED
          </p>
          <h3 className="mt-2 text-lg font-semibold text-amber-800 dark:text-amber-200">
            {vm.headline}
          </h3>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            reason: {vm.reason}
          </p>
          <p className="mt-2 font-mono text-xs break-all text-neutral-500 dark:text-neutral-500">
            zero CSV content rendered · policy {vm.policyVersion}
          </p>
        </section>
      )}

      {vm !== null && vm.status === "VERIFIED" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Dataset CSV census · VERIFIED · measured counts only
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>file: {vm.fileName}</div>
            <div>rows: {vm.rowCount} × columns: {vm.columnCount}</div>
            <div>majority-null columns: {vm.majorityNullColumns} (disclosed, never hidden)</div>
            <div>measuredChars: {vm.measuredChars}</div>
            <div>modelCalls: {vm.modelCalls} · remoteCalls: {vm.remoteCalls} · activated: {vm.activated} · learningPromoted: {String(vm.learningPromoted)}</div>
            <div>humanDecision: {vm.humanDecision}</div>
          </dl>
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
            {vm.columns.map((col) => (
              <div
                key={col.name}
                className="rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs break-all text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
              >
                <div>
                  {col.name} — null {col.nullCount} ({col.nullPercent}%), distinct {col.distinctCount}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            {vm.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}