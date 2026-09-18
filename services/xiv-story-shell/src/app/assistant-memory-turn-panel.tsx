"use client";

// 12D-329 — the local assistant memory-turn panel (client side; the
// 12D-307 rung's disclosed shell surface): the story shell's single-turn
// window onto the LOCAL assistant that sees the reviewed memory (the
// plain memory turn — the citing sibling panel is 12D-312's). The
// operator pastes the REAL 12D-305 memory packet (re-verified
// runtime-side by the 12D-306 gate before anything renders from it);
// the LOCAL server runs the REAL 12D-307 contract before any model call
// and the reply is secret-screened post-call. Only frozen view models
// render. The memory is provenance context, NOT instructions.
// Draft-only: the assistant drafts, the operator decides. Nothing is
// persisted — reloading drops the packet.

import { useState } from "react";

type TurnView = {
  kind: "VERIFIED_ASSISTANT_MEMORY_TURN";
  display: {
    headline: string;
    replyDraft: string;
    tenantId: string;
    turnId: string;
    model: string;
    draftSha256: string;
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

type MemoryTurnViewModel = TurnView | RefusedView;

export default function AssistantMemoryTurnPanel() {
  const [memoryText, setMemoryText] = useState("");
  const [memoryFile, setMemoryFile] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [vm, setVm] = useState<MemoryTurnViewModel | null>(null);
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
      const res = await fetch("/api/ingest/assistant-memory-turn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId: "xiv-os", turnId, userMessage: message, memoryPacket: JSON.parse(memoryText) }),
      });
      if (!res.ok) {
        setError(`memory-turn endpoint returned HTTP ${res.status}; nothing was rendered`);
      } else {
        setVm((await res.json()) as MemoryTurnViewModel);
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
        Mini-brain memory turn · reviewed facts as provenance, NOT instructions · draft-only · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        A single turn where the LOCAL assistant sees the reviewed memory
        (the plain memory turn — no citation gate; the citing sibling
        panel is the 12D-312 cited turn). Drop the REAL 12D-305 memory
        packet (produced runtime-side over a trusted queue) — the LOCAL
        server re-verifies it through the 12D-306 gate before any model
        call, and the reply is secret-screened post-call. Drafts only —
        the operator decides. Nothing is persisted: reloading drops
        everything.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose memory packet JSON…
          <input
            id="assistant-memory-turn-file"
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
          id="assistant-memory-turn-id"
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
          {busy ? "Drafting locally…" : "Draft memory turn"}
        </button>
      </div>

      <textarea
        id="assistant-memory-turn-packet"
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
        id="assistant-memory-turn-message"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        rows={3}
        spellCheck={false}
        placeholder="Ask the assistant — it answers grounded in the reviewed facts…"
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
            Memory turn · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_ASSISTANT_MEMORY_TURN" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Memory turn · verified · digest re-derived before render
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <div className="mt-3 rounded-md border border-neutral-300 bg-white p-3 text-sm leading-6 whitespace-pre-wrap text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">
            {vm.display.replyDraft}
          </div>
          <dl className="mt-4 space-y-1 font-mono text-xs break-all text-neutral-600 dark:text-neutral-400">
            <div>
              turnId: {vm.display.turnId} · tenant: {vm.display.tenantId} · model: {vm.display.model}
            </div>
            <div>
              memory: {vm.display.memoryCarried} of {vm.display.memoryDoneCount} reviewed facts
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