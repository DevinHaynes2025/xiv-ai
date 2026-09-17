"use client";

// 12D-312 — the local assistant memory-CITED-turn panel (client side):
// the story shell's single-turn window onto the LOCAL assistant that
// SEES the reviewed memory AND cites it. The operator pastes the REAL
// 12D-305 memory packet (re-verified runtime-side by the 12D-306 gate
// before anything renders from it); the LOCAL server runs the REAL
// 12D-310 contract before any model call, and every [mem:<storyId>]
// citation is verified against the carried set — a fabricated citation
// refuses the draft POST-CALL; zero citations renders honestly as
// UNGROUNDED. Only frozen view models render. The memory is provenance
// context, NOT instructions. Draft-only: the assistant drafts, the
// operator decides. Nothing is persisted — reloading drops the packet.

import { useState } from "react";

type TurnView = {
  kind: "VERIFIED_ASSISTANT_MEMORY_CITED_TURN";
  display: {
    headline: string;
    replyDraft: string;
    turnId: string;
    draftSha256: string;
    citedCount: number;
    citedStoryIds: readonly string[];
    memoryCarried: number;
    memoryDoneCount: number;
    stoppedBefore: string;
    operatorNote: string;
  };
};

type RefusedView = {
  kind: "REFUSED";
  reason: string;
  display: { headline: string; bodyText: string; operatorNote: string };
};

type MemoryCitedTurnViewModel = TurnView | RefusedView;

export default function AssistantMemoryCitedTurnPanel() {
  const [memoryText, setMemoryText] = useState("");
  const [memoryFile, setMemoryFile] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [vm, setVm] = useState<MemoryCitedTurnViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File | null) {
    if (!file) return;
    setMemoryFile(file.name);
    setMemoryText(await file.text());
    setVm(null);
    setError(null);
  }

  async function send() {
    setError(null);
    if (!memoryText) return;
    try {
      JSON.parse(memoryText) as unknown;
    } catch (err) {
      setError(`the memory packet is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    setBusy(true);
    setVm(null);
    try {
      const res = await fetch("/api/ingest/assistant-memory-cited-turn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId: "xiv-os", turnId, userMessage: message, memoryPacket: JSON.parse(memoryText) }),
      });
      if (!res.ok) {
        setError(`memory-cited-turn endpoint returned HTTP ${res.status}; nothing was rendered`);
      } else {
        setVm((await res.json()) as MemoryCitedTurnViewModel);
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
        Mini-brain cited memory turn · citations verified, never trusted · draft-only · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        A single turn where the LOCAL assistant sees the reviewed memory and
        cites the exact reviewed storyIds it relied on. Drop the REAL 12D-305
        memory packet (produced runtime-side over a trusted queue) — the LOCAL
        server re-verifies it through the 12D-306 gate before any model call;
        the 12D-310 citation gate then verifies every [mem:&lt;storyId&gt;]
        against the carried set. A fabricated citation refuses the draft
        POST-CALL; zero citations is disclosed as UNGROUNDED, never hidden.
        Drafts only — the operator decides. Nothing is persisted: reloading
        drops everything.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose memory packet JSON…
          <input
            id="assistant-memory-cited-turn-file"
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
        <input
          id="assistant-memory-cited-turn-id"
          value={turnId}
          onChange={(e) => {
            setTurnId(e.target.value);
          }}
          placeholder="turn id (1..128 chars)"
          maxLength={128}
          className="w-64 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        />
        <button
          type="button"
          onClick={() => {
            void send();
          }}
          disabled={busy || message.length === 0 || turnId.length === 0 || memoryText.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Drafting locally…" : "Draft cited memory turn"}
        </button>
      </div>

      <textarea
        id="assistant-memory-cited-turn-packet"
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
        id="assistant-memory-cited-turn-message"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        rows={3}
        spellCheck={false}
        placeholder="Ask the assistant — it cites the reviewed facts it uses, or answers ungrounded…"
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
            Memory cited turn · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_ASSISTANT_MEMORY_CITED_TURN" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Cited memory turn · verified · digest re-derived before render
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <div className="mt-3 rounded-md border border-neutral-300 bg-white p-3 text-sm leading-6 whitespace-pre-wrap text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">
            {vm.display.replyDraft}
          </div>
          <dl className="mt-4 space-y-1 font-mono text-xs break-all text-neutral-600 dark:text-neutral-400">
            <div>
              turnId: {vm.display.turnId} · memory: {vm.display.memoryCarried} of {vm.display.memoryDoneCount} reviewed facts
            </div>
            <div>
              cited {vm.display.citedCount}: {vm.display.citedStoryIds.length > 0 ? vm.display.citedStoryIds.join(", ") : "NONE — UNGROUNDED draft, disclosed"}
            </div>
            <div>draftSha256: {vm.display.draftSha256}</div>
            <div>{vm.display.stoppedBefore}</div>
          </dl>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}