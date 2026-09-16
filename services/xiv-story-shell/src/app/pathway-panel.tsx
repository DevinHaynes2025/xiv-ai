"use client";

// 12D-270 — the pathway-decision panel (client side). The operator drops a
// 12D-269 pathway decision submission (bridge packet + recorded decision
// custody plan) as a JSON file or pastes its text; the panel POSTs the RAW
// TEXT to the LOCAL /api/ingest/pathway route handler and renders ONLY the
// frozen view model the LOCAL server-side verifier returned. The browser
// never runs the verifier and never receives refused content. This surface
// REPORTS a decision a human already recorded out of band — there is no
// approve control here by construction: the shell never decides, and a
// verified approval means the ledger path exists, not that anything is
// activated.

import { useState } from "react";

type PathwayApprovalViewModel =
  | {
      kind: "VERIFIED_PATHWAY_DECISION";
      policyVersion: string;
      display: {
        headline: string;
        pathwayId: string;
        version: number;
        tenantId: string;
        domain: string;
        decision: string;
        decidedBy: string;
        decidedAtMs: number;
        decisionReceipt: string;
        purpose: string;
        ledgerPathOpen: string;
        operatorNote: string;
      };
    }
  | {
      kind: "REFUSED";
      policyVersion: string;
      reason: string;
      display: { headline: string; bodyText: string; operatorNote: string };
    };

export default function PathwayApprovalPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<PathwayApprovalViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/pathway", { method: "POST", body: text });
      if (!res.ok) {
        setError(`pathway endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as PathwayApprovalViewModel);
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
        Pathway decision surface · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a 12D-269 pathway decision submission (bridge packet + recorded
        decision custody plan). The whole submission re-verifies as ONE unit
        in the LOCAL server process — the cross-binding gate proves the
        decision record is about THESE candidate bytes, and the eligibility
        gate re-runs fresh. A verified submission renders the recorded
        decision; a tampered one renders a refusal carrying zero content.
        A verified APPROVAL means the 12D-264 ledger path is open — the
        candidate stays ledgered, never activated. Nothing is persisted and
        nothing leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose pathway JSON…
          <input
            id="pathway-file"
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
        id="pathway-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "packet": …, "plan": { "policyVersion": …, "decisionReceiptSha256": …, "decisionRecord": …, "steps": […] } }'
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
            Pathway decision · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_PATHWAY_DECISION" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Pathway decision · VERIFIED · recorded out of band
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>
              pathwayId: <span className="break-all">{vm.display.pathwayId}</span>
            </div>
            <div>version: {vm.display.version}</div>
            <div>
              tenantId: <span className="break-all">{vm.display.tenantId}</span>
            </div>
            <div>domain: {vm.display.domain}</div>
            <div>decision: {vm.display.decision}</div>
            <div>decidedBy: {vm.display.decidedBy}</div>
            <div>decidedAtMs: {vm.display.decidedAtMs}</div>
            <div>
              decisionReceipt: <span className="break-all">{vm.display.decisionReceipt}</span>
            </div>
            <div>purpose: {vm.display.purpose}</div>
          </dl>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            Ledger path: {vm.display.ledgerPathOpen}
          </p>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}