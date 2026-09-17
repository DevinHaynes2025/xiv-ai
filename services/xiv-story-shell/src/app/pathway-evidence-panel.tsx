"use client";

// 12D-304 — the bound-reading pathway-evidence panel (client side). The
// operator pastes the RAW 12D-279 evidence packet (or drops it as a JSON
// file); the panel POSTs the RAW TEXT to the LOCAL
// /api/ingest/pathway-evidence route handler and renders ONLY the frozen
// view model the LOCAL server-side verifier returned. The browser never
// re-derives eligibility and never receives refused packet content. The
// verified view shows the honest eligibility (with its unmet
// CEO-gated-gate reasons) and the provenance refs the candidate carries
// — ledgered NEVER activated. The view has no write path, and the shell
// decides nothing.

import { useState } from "react";

type BoundReadingEvidenceViewModel =
  | {
      kind: "VERIFIED_BOUND_READING_EVIDENCE";
      policyVersion: string;
      display: {
        headline: string;
        sourceId: string;
        documentId: string;
        storyId: string;
        eligible: boolean;
        eligibilityReasons: string[];
        evidenceRefs: string[];
        admissionCounts: { prepared: number; inserted: number; duplicates: number };
        operatorNote: string;
      };
    }
  | {
      kind: "REFUSED";
      policyVersion: string;
      reason: string;
      display: { headline: string; bodyText: string; operatorNote: string };
    };

export default function PathwayEvidencePanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<BoundReadingEvidenceViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/pathway-evidence", { method: "POST", body: text });
      if (!res.ok) {
        setError(`pathway-evidence endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as BoundReadingEvidenceViewModel);
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
        Pathway evidence surface · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a 12D-279 bound-reading pathway-evidence packet (produced
        runtime-side over a trusted queue). The full re-verification runs in
        the LOCAL server process before anything renders — exact keys in
        order, honest flags, the binding receipt re-gated, and the
        eligibility RE-DERIVED with the real growth-engine evaluator — so a
        tampered eligibility, a forged approval, or a mutated flag refuses
        the WHOLE packet with zero packet content. A verified render shows
        the honest eligibility and the provenance refs the candidate
        carries — ledgered NEVER activated. Nothing is persisted and
        nothing leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose evidence packet JSON…
          <input
            id="pathway-evidence-file"
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
        id="pathway-evidence-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "kind": "BOUND_READING_EVIDENCE_PACKET", "policyVersion": "12d-279-v1", … }'
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
            Pathway evidence · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_BOUND_READING_EVIDENCE" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Pathway evidence · VERIFIED · ledgered never activated
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>sourceId: {vm.display.sourceId}</div>
            <div>documentId: {vm.display.documentId}</div>
            <div>storyId: {vm.display.storyId}</div>
            <div>
              eligibility: {vm.display.eligible ? "TRUE" : "FALSE (honest — CEO-gated gates unmet)"}
            </div>
            <div>
              admissionCounts: prepared {vm.display.admissionCounts.prepared} · inserted{" "}
              {vm.display.admissionCounts.inserted} · duplicates {vm.display.admissionCounts.duplicates}
            </div>
          </dl>
          {vm.display.eligibilityReasons.length > 0 && (
            <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
              <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                Unmet growth-engine gates (CEO-gated)
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs break-words text-amber-700 dark:text-amber-300">
                {vm.display.eligibilityReasons.map((reason) => (
                  <li key={reason}>· {reason}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3">
            <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
              Provenance carried by the candidate
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs break-all text-neutral-600 dark:text-neutral-400">
              {vm.display.evidenceRefs.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </div>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}