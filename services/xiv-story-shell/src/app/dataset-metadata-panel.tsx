"use client";

// 12D-297 — the dataset-metadata-census panel (client side). The
// operator drops an OEX-style metadata packet (the kind
// OpenStreetMap/HDX extractors emit) as a JSON file or pastes its
// text; the panel POSTs the RAW TEXT to the LOCAL
// /api/ingest/dataset-metadata route handler and renders ONLY the
// frozen view model the LOCAL server-side verifier returned. The
// browser never runs the structural verification and never receives
// refused content. MEASURED COUNTS ONLY: the census renders what the
// packet measured (features, geometry census, per-column nulls) —
// a metadata packet is NOT a dataset read, and the 2,000,000-row
// ceiling is the only measured bound. The view has no write path, and
// the shell decides nothing.

import { useState } from "react";

type MetadataColumn = {
  name: string;
  type: string;
  nullCount: number;
  nullPercent: number;
  distinctCount: number;
};

type DatasetMetadataViewModel =
  | {
      status: "VERIFIED";
      headline: string;
      sourceName: string;
      snapshotLabel: string;
      datasetSource: string;
      featureCount: number;
      geometryTypes: Record<string, number>;
      bbox: [number, number, number, number];
      columns: MetadataColumn[];
      majorityNullColumns: number;
      columnCount: number;
      license: { label: string; url: string };
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

export default function DatasetMetadataPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<DatasetMetadataViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/dataset-metadata", { method: "POST", body: text });
      if (!res.ok) {
        setError(`dataset-metadata endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as DatasetMetadataViewModel);
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
        Dataset metadata census · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop an OEX-style dataset metadata packet (e.g. an OpenStreetMap/HDX
        extract summary). The full structural verification — exact shape,
        geometry census cross-binding, per-column bounds, and the
        2,000,000-row measured ceiling — re-runs in the LOCAL server
        process before anything renders; an internally inconsistent packet
        refuses WHOLE, with zero content. MEASURED COUNTS ONLY: the census
        renders what the packet measured — a metadata packet is NOT a
        dataset read, and the license (label + URL) renders with the
        census. Nothing is persisted and nothing leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose metadata JSON…
          <input
            id="dataset-metadata-file"
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
        id="dataset-metadata-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "source_name": "osm", "snapshot_label": …, "metadata": { "feature_count": … } }'
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
            Dataset metadata census · REFUSED
          </p>
          <h3 className="mt-2 text-lg font-semibold text-amber-800 dark:text-amber-200">
            {vm.headline}
          </h3>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            reason: {vm.reason}
          </p>
          <p className="mt-2 font-mono text-xs break-all text-neutral-500 dark:text-neutral-500">
            zero dataset content rendered · policy {vm.policyVersion}
          </p>
        </section>
      )}

      {vm !== null && vm.status === "VERIFIED" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Dataset metadata census · VERIFIED · measured counts only
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>source: {vm.sourceName}</div>
            <div>snapshot: {vm.snapshotLabel}</div>
            <div>datasetSource: {vm.datasetSource}</div>
            <div>featureCount: {vm.featureCount}</div>
            <div>
              geometryTypes:{" "}
              {Object.entries(vm.geometryTypes)
                .map(([cls, count]) => `${cls}=${count}`)
                .join(", ")}
            </div>
            <div>
              bbox: [{vm.bbox.join(", ")}]
            </div>
            <div>columns: {vm.columnCount} (majority-null: {vm.majorityNullColumns} — disclosed, never hidden)</div>
            <div>
              license: {vm.license.label} ({vm.license.url})
            </div>
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
                  {col.name} ({col.type}) — null {col.nullCount} ({col.nullPercent}%), distinct {col.distinctCount}
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