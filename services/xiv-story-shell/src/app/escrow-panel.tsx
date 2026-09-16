"use client";

// 12D-268 — the escrow-verdict panel (client side). The operator drops a
// 12D-266 escrow gate state ({escrowState}) as a JSON file or pastes its
// text; the panel POSTs the RAW TEXT to the LOCAL /api/ingest/escrow route
// handler and renders ONLY the frozen view model the LOCAL server-side
// verifier returned. The browser never runs the validator and never
// receives refused content. This surface RENDERS a ledger state and the
// next gate it already requires — there is no approve control here by
// construction: the human-signed approval event happens in the custody
// stack, never through the shell.

import { useState } from "react";

type EscrowVerdictViewModel =
  | {
      kind: "VERIFIED_ESCROW_STATE";
      policyVersion: string;
      display: {
        headline: string;
        escrowId: string;
        phase: string;
        track: string;
        amountMinorUnits: string;
        amountDisplay: string;
        payeeRef: string;
        auditsPassed: number;
        auditsFailed: number;
        approvalsRecorded: number;
        nextGate: string;
        operatorNote: string;
      };
    }
  | {
      kind: "REFUSED";
      policyVersion: string;
      reason: string;
      display: { headline: string; bodyText: string; operatorNote: string };
    };

export default function EscrowPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<EscrowVerdictViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/escrow", { method: "POST", body: text });
      if (!res.ok) {
        setError(`escrow endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as EscrowVerdictViewModel);
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
        Escrow verdict surface · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Drop a 12D-266 escrow gate state ({"{"} escrowState {"}"}). The state
        re-verifies through the forged-state validator in the LOCAL server
        process; a lawful state renders its phase, its exact money facts in
        minor units, and the next gate it already requires. A forged one —
        including an exit with no recorded approval or no passed audit —
        renders a refusal carrying zero content. Nothing is persisted and
        nothing leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose escrow JSON…
          <input
            id="escrow-file"
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
        id="escrow-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "escrowState": { "escrowId": …, "phase": …, "track": …, "amountMinorUnits": …, … } }'
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
            Escrow · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_ESCROW_STATE" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Escrow · VERIFIED · rails DESIGNED_NOT_INTEGRATED
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <div>
              escrowId: <span className="break-all">{vm.display.escrowId}</span>
            </div>
            <div>phase: {vm.display.phase}</div>
            <div>track: {vm.display.track}</div>
            <div>
              amount: {vm.display.amountDisplay} (minor units: {vm.display.amountMinorUnits})
            </div>
            <div>
              payeeRef: <span className="break-all">{vm.display.payeeRef}</span>
            </div>
            <div>
              audits: {vm.display.auditsPassed} passed · {vm.display.auditsFailed} failed
            </div>
            <div>approvalsRecorded: {vm.display.approvalsRecorded}</div>
          </dl>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            Next gate: {vm.display.nextGate}
          </p>
          <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}