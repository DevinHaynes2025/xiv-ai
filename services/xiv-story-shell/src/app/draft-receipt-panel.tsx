"use client";

// 12D-286 — the reading draft receipt panel (client side). The reviewer
// pastes (or drops as JSON) the draft receipt submission — tenantId,
// storyId, documentId, the CLAIMED draft digest, the draft TEXT they
// actually hold, and the model label; the panel POSTs the RAW TEXT to
// the LOCAL /api/ingest/draft-receipt route handler and renders ONLY the
// frozen view model the LOCAL server-side verifier returned. The REAL
// 12D-285 receipt door re-derives the digest from the pasted text — a
// claimed digest that does not match the held text refuses ("not
// holding the draft they claim"). The draft text is NEVER echoed back,
// verified or refused; only the digest and metadata render. The queue
// cross-check door stays runtime-side: carry the rendered draftSha256 as
// the 12D-100 review door's expectedOutputHash. The shell decides
// nothing and approves nothing — a receipt proves bytes, not quality.

import { useState } from "react";

type ReceiptMetadata = {
  kind: string;
  policyVersion: string;
  tenantId: string;
  storyId: string;
  documentId: string;
  model: string;
  draftChars: number;
  draftSha256: string;
  reviewHint: string;
  modelCalls: number;
  remoteCalls: number;
  activated: number;
  learningPromoted: boolean;
  humanDecision: string;
};

type ReadingDraftReceiptViewModel =
  | {
      kind: "VERIFIED_READING_DRAFT_RECEIPT";
      policyVersion: string;
      display: {
        headline: string;
        receipt: ReceiptMetadata;
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

export default function DraftReceiptPanel() {
  const [text, setText] = useState("");
  const [vm, setVm] = useState<ReadingDraftReceiptViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ingest/draft-receipt", { method: "POST", body: text });
      if (!res.ok) {
        setError(`draft receipt endpoint returned HTTP ${res.status}; nothing was rendered`);
        setVm(null);
      } else {
        setVm((await res.json()) as ReadingDraftReceiptViewModel);
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
        Draft receipt surface · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Paste a draft receipt submission — the claimed digest plus the draft
        TEXT you actually hold. The REAL 12D-285 receipt door re-derives the
        SHA-256 from the held text in the LOCAL server process before
        anything renders: a digest that does not match the held text, a
        credential-shaped draft, or an over-budget draft refuses the WHOLE
        submission. The draft text is NEVER echoed back — verified or
        refused, only the digest and metadata render. Carry the rendered
        draftSha256 as the 12D-100 review door&apos;s expectedOutputHash; the
        queue cross-check happens runtime-side. Nothing is persisted and
        nothing leaves this machine.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose draft receipt JSON…
          <input
            id="draft-receipt-file"
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
          {busy ? "Re-deriving…" : "Re-derive & render"}
        </button>
      </div>

      <textarea
        id="draft-receipt-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder='{ "tenantId": …, "storyId": …, "documentId": …, "draftSha256": "<64 hex>", "draftText": …, "model": … }'
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
            Draft receipt · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_READING_DRAFT_RECEIPT" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Draft receipt · VERIFIED · digest re-derived, text never echoed
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <dl className="mt-4 space-y-1 font-mono text-xs break-all text-neutral-600 dark:text-neutral-400">
            <div>tenantId: {vm.display.receipt.tenantId}</div>
            <div>storyId: {vm.display.receipt.storyId}</div>
            <div>documentId: {vm.display.receipt.documentId}</div>
            <div>model: {vm.display.receipt.model}</div>
            <div>draftChars: {vm.display.receipt.draftChars}</div>
            <div>draftSha256: {vm.display.receipt.draftSha256}</div>
            <div>modelCalls: {vm.display.receipt.modelCalls} · remoteCalls: {vm.display.receipt.remoteCalls}</div>
            <div>
              humanDecision: {vm.display.receipt.humanDecision} · learningPromoted: {String(vm.display.receipt.learningPromoted)}
            </div>
          </dl>
          <p className="mt-3 rounded-md border border-neutral-300 bg-white p-3 font-mono text-xs break-words text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
            {vm.display.receipt.reviewHint}
          </p>
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