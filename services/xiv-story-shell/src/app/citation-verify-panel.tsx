"use client";

// 12D-314 — the citation verify card panel (client side): the story
// shell's EYE-VERIFICATION surface. The operator pastes the REAL 12D-305
// memory packet and ANY draft text (e.g. a draft from the cited memory
// doors), and the LOCAL server runs the REAL 12D-314 card — the packet
// is re-verified through the 12D-306 gate and the draft's
// [mem:<storyId>] citations are extracted through the REAL 12D-310
// extractor and checked against the verified carried set. Fabricated
// citations are disclosed BY ID (operator-draft text, never model
// output); zero citations render honestly as UNGROUNDED. No model is
// called. The card judges ONLY the citations — the prose is the
// operator's to judge. Nothing is persisted.

import { useState } from "react";

type CardView = {
  kind: "VERIFIED_CITATION_VERIFY_CARD";
  display: {
    headline: string;
    draft: string;
    draftChars: number;
    tenantId: string;
    carriedCount: number;
    carriedStoryIds: readonly string[];
    citedCount: number;
    citedStoryIds: readonly string[];
    fabricatedCount: number;
    fabricatedStoryIds: readonly string[];
    verdict: string;
    stoppedBefore: string;
    operatorNote: string;
  };
};

type RefusedView = {
  kind: "REFUSED";
  reason: string;
  display: { headline: string; bodyText: string; operatorNote: string };
};

type CitationVerifyViewModel = CardView | RefusedView;

export default function CitationVerifyPanel() {
  const [memoryText, setMemoryText] = useState("");
  const [memoryFile, setMemoryFile] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [vm, setVm] = useState<CitationVerifyViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File | null) {
    if (!file) return;
    setMemoryFile(file.name);
    setMemoryText(await file.text());
    setVm(null);
    setError(null);
  }

  async function check() {
    setError(null);
    if (!memoryText || !draft) return;
    let memoryPacket: unknown;
    try {
      memoryPacket = JSON.parse(memoryText) as unknown;
    } catch (err) {
      setError(`the memory packet is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    setBusy(true);
    setVm(null);
    try {
      const res = await fetch("/api/ingest/citation-verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft, memoryPacket }),
      });
      if (!res.ok) {
        setError(`citation-verify endpoint returned HTTP ${res.status}; nothing was rendered`);
      } else {
        setVm((await res.json()) as CitationVerifyViewModel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-950">
      <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        Citation verify card · eye-verification · no model call · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Check ANY draft&apos;s [mem:&lt;storyId&gt;] citations against the reviewed
        memory — by eye, with the machine doing the exact-id matching. Drop the
        REAL 12D-305 memory packet and paste the draft; the LOCAL server
        re-verifies the packet through the 12D-306 gate and extracts the
        citations through the REAL extractor. Fabricated citations are
        disclosed BY ID; no citations renders as UNGROUNDED, never hidden.
        NO model runs here — verification only. The card judges ONLY the
        citations; the prose is yours to judge. Nothing is persisted.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose memory packet JSON…
          <input
            id="citation-verify-file"
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              void loadFile(e.target.files?.[0] ?? null);
            }}
          />
        </label>
        {memoryFile !== null && (
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
            loaded: {memoryFile}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            void check();
          }}
          disabled={busy || draft.length === 0 || memoryText.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Verifying…" : "Check citations"}
        </button>
      </div>

      <textarea
        id="citation-verify-packet"
        value={memoryText}
        onChange={(e) => {
          setMemoryText(e.target.value);
          setMemoryFile(null);
        }}
        rows={4}
        spellCheck={false}
        placeholder='{ "kind": "ASSISTANT_MEMORY_READ", "policyVersion": "12d-305-v1", … }'
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />
      <textarea
        id="citation-verify-draft"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
        }}
        rows={6}
        spellCheck={false}
        placeholder="Paste the draft to check — its [mem:<storyId>] citations are matched against the verified carried set…"
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 text-sm leading-6 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />

      {error !== null && (
        <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-xs break-words text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {vm !== null && vm.kind === "REFUSED" && (
        <section className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
            Citation verify card · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_CITATION_VERIFY_CARD" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Citation verify card · verified · digest re-derived, citations re-extracted
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-neutral-300 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
              <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                carried reviewed facts ({vm.display.carriedCount}) — the ONLY citable ids:
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs break-all text-neutral-800 dark:text-neutral-200">
                {vm.display.carriedStoryIds.map((id) => (
                  <li key={id}>[mem:{id}]</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-neutral-300 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
              <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                cited in the draft ({vm.display.citedCount}):
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs break-all text-neutral-800 dark:text-neutral-200">
                {vm.display.citedStoryIds.length > 0
                  ? vm.display.citedStoryIds.map((id) => <li key={id}>[mem:{id}]</li>)
                  : <li>NONE — UNGROUNDED draft</li>}
              </ul>
            </div>
            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
              <p className="font-mono text-xs text-amber-600 dark:text-amber-400">
                fabricated ({vm.display.fabricatedCount}):
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs break-all text-amber-700 dark:text-amber-300">
                {vm.display.fabricatedStoryIds.length > 0
                  ? vm.display.fabricatedStoryIds.map((id) => <li key={id}>[mem:{id}]</li>)
                  : <li>none</li>}
              </ul>
            </div>
          </div>
          <p className="mt-3 font-mono text-xs break-all text-neutral-500 dark:text-neutral-400">
            {vm.display.stoppedBefore}
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}