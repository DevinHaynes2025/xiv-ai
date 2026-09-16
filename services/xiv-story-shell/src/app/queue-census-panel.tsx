"use client";

// 12D-273 — the queue-census panel (client side). The operator drops a
// queue census submission (the queue's own frozen policy object + its own
// summary() output) as a JSON file or pastes its text; the panel POSTs the
// RAW TEXT to the LOCAL /api/ingest/queue-census route handler and renders
// ONLY the frozen view model the LOCAL server-side verifier returned. The
// browser never verifies and never receives refused content. The census
// reports MEASURED counts only — the 2,000,000-row ceiling renders as a
// POLICY bound, never as achieved usage — and the honest flags are
// re-verified, never trusted. The shell decides nothing.

import { useState } from "react";

type QueueCensusViewModel =
  | {
      kind: "VERIFIED_QUEUE_CENSUS";
      policyVersion: string;
      display: {
        headline: string;
        totalStories: number;
        byState: Record<string, number>;
        byKind: Record<string, number>;
        leaseHeld: boolean;
        leaseExpired: boolean;
        policyCeilingRows: number;
        capacityNote: string;
        liveAgentCount: null;
        operatorNote: string;
      };
    }
  | {
      kind: "REFUSED";
      policyVersion: string;
      reason: string;
      display: { headline: string; bodyText: string; operatorNote: string };
    };

export default function QueueCensusPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<QueueCensusViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/queue-census", { method: "POST", body: text });
      if (!res.ok) {
        setError(`queue-census endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as QueueCensusViewModel);
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
        Queue census surface · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a queue census submission: the queue&apos;s OWN frozen policy
        object plus its own summary() output, unchanged. The verifier
        re-checks both in the LOCAL server process — the policy must
        deep-equal the real one (a relaxed ceiling or auto-steal flag is
        not this queue&apos;s book), the summary must be its exact shape,
        and cross-consistency gates apply (no expired lease without a
        lease, no zero counts, measured total under the ceiling). Honest
        flags are re-verified, never trusted. The ceiling renders as a
        POLICY bound, never as achieved usage. Nothing is persisted and
        nothing leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose queue census JSON…
          <input
            id="queue-census-file"
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
        id="queue-census-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "policy": { …OFFLINE_QUEUE_POLICY… }, "summary": { "counts": …, "leaseHeld": …, … } }'
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
            Queue census · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_QUEUE_CENSUS" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Queue census · VERIFIED · measured counts only
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>totalStories: {vm.display.totalStories}</div>
            <div>
              byState:{" "}
              <span className="break-all">
                {Object.entries(vm.display.byState)
                  .map(([state, count]) => `${state}=${count}`)
                  .join(", ")}
              </span>
            </div>
            <div>
              byKind:{" "}
              <span className="break-all">
                {Object.entries(vm.display.byKind)
                  .map(([kind, count]) => `${kind}=${count}`)
                  .join(", ")}
              </span>
            </div>
            <div>leaseHeld: {String(vm.display.leaseHeld)}</div>
            <div>leaseExpired: {String(vm.display.leaseExpired)}</div>
            <div>policyCeilingRows: {vm.display.policyCeilingRows.toLocaleString("en-US")}</div>
            <div>liveAgentCount: {String(vm.display.liveAgentCount)}</div>
          </dl>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {vm.display.capacityNote}
          </p>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}