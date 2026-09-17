"use client";

// 12D-315 — the source staleness card panel (client side): the story
// shell's evidence-currency surface. The operator pastes the REAL 12D-305
// memory packet plus the re-fetched sha256 digests of the sources the
// facts were read as, and the LOCAL server runs the REAL 12D-315 card —
// the packet is re-verified through the 12D-306 gate, the recorded
// digest heads are re-parsed from the verified objectives, and each
// document's verdict is DERIVED by comparison. STALE evidence is
// disclosed BY storyId (it requires re-work even if omitted); UNCHECKED
// is rendered as UNCHECKED — never allowed to look like current. The
// card NEVER fetches and NEVER mutates memory. No model is called.
// Nothing is persisted.

import { useState } from "react";

type AssessedRow = {
  documentId: string;
  recordedDigestHead: string;
  currentDigestHead: string;
  verdict: string;
};

type CardView = {
  kind: "VERIFIED_SOURCE_STALENESS_CARD";
  display: {
    headline: string;
    tenantId: string;
    assessed: readonly AssessedRow[];
    staleCount: number;
    staleDocumentIds: readonly string[];
    uncheckedCount: number;
    affectedStoryIds: readonly string[];
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

type SourceStalenessViewModel = CardView | RefusedView;

const VERDICT_STYLE: Record<string, string> = {
  CURRENT: "text-emerald-700 dark:text-emerald-400",
  STALE: "text-amber-700 dark:text-amber-300",
  UNCHECKED: "text-neutral-500 dark:text-neutral-400",
  PATTERN_ABSENT: "text-neutral-500 dark:text-neutral-400",
};

export default function SourceStalenessPanel() {
  const [memoryText, setMemoryText] = useState("");
  const [memoryFile, setMemoryFile] = useState<string | null>(null);
  const [digestsText, setDigestsText] = useState("");
  const [vm, setVm] = useState<SourceStalenessViewModel | null>(null);
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
    if (!memoryText || !digestsText) return;
    let memoryPacket: unknown;
    let currentDigests: unknown;
    try {
      memoryPacket = JSON.parse(memoryText) as unknown;
    } catch (err) {
      setError(`the memory packet is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    try {
      currentDigests = JSON.parse(digestsText) as unknown;
    } catch (err) {
      setError(`the current digests are not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    setBusy(true);
    setVm(null);
    try {
      const res = await fetch("/api/ingest/source-staleness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memoryPacket, currentDigests }),
      });
      if (!res.ok) {
        setError(`source-staleness endpoint returned HTTP ${res.status}; nothing was rendered`);
      } else {
        setVm((await res.json()) as SourceStalenessViewModel);
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
        Source staleness card · evidence currency · no model call · never fetches · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        A reviewed fact is grounded in the SOURCE BYTES it was read as. Drop the
        REAL 12D-305 memory packet and paste the re-fetched digests
        ([{"{ documentId, digestSha256 }"}] — lowercase hex64 sha256 of the source
        NOW); the LOCAL server re-verifies the packet, re-parses the recorded
        digest heads from the objectives (the same record the continuation gate
        binds to) and derives each document&apos;s verdict. A source that changed
        after its facts were read is STALE — disclosed BY storyId, because stale
        evidence requires re-work even if omitted. A source nobody re-fetched is
        UNCHECKED — never allowed to look like current. The card never fetches
        and never mutates memory. NO model runs here. Nothing is persisted.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose memory packet JSON…
          <input
            id="source-staleness-file"
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
          disabled={busy || digestsText.length === 0 || memoryText.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Assessing…" : "Assess staleness"}
        </button>
      </div>

      <textarea
        id="source-staleness-packet"
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
        id="source-staleness-digests"
        value={digestsText}
        onChange={(e) => {
          setDigestsText(e.target.value);
        }}
        rows={4}
        spellCheck={false}
        placeholder='[{ "documentId": "hdx-python-api-docs-1", "digestSha256": "<lowercase hex64 of the source NOW>" }, …]'
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
            Source staleness card · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_SOURCE_STALENESS_CARD" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Source staleness card · verified · derivation re-computed from the card&apos;s own inputs
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <p className="mt-1 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            tenant: {vm.display.tenantId} · verdict: {vm.display.verdict}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-neutral-300 dark:border-neutral-700">
                  <th className="py-2 pr-3 font-medium text-neutral-500 dark:text-neutral-400">document</th>
                  <th className="py-2 pr-3 font-medium text-neutral-500 dark:text-neutral-400">recorded head</th>
                  <th className="py-2 pr-3 font-medium text-neutral-500 dark:text-neutral-400">current head</th>
                  <th className="py-2 font-medium text-neutral-500 dark:text-neutral-400">verdict</th>
                </tr>
              </thead>
              <tbody className="text-neutral-800 dark:text-neutral-200">
                {vm.display.assessed.map((row) => (
                  <tr key={row.documentId} className="border-b border-neutral-200 last:border-0 dark:border-neutral-800">
                    <td className="py-1.5 pr-3 break-all">{row.documentId}</td>
                    <td className="py-1.5 pr-3 break-all">{row.recordedDigestHead === "" ? "—" : row.recordedDigestHead}</td>
                    <td className="py-1.5 pr-3 break-all">{row.currentDigestHead === "" ? "— (not re-fetched)" : row.currentDigestHead}</td>
                    <td className={`py-1.5 font-semibold ${VERDICT_STYLE[row.verdict] ?? ""}`}>{row.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {vm.display.staleDocumentIds.length > 0 && (
            <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm break-words text-amber-800 dark:text-amber-200">
              STALE: {vm.display.staleDocumentIds.join(", ")} — affected reviewed facts (the card
              never mutates memory; these facts STAY but they cite evidence that moved):
              {" "}{vm.display.affectedStoryIds.join(", ")}
            </p>
          )}
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