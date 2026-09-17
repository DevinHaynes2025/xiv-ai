"use client";

// 12D-301 — the local assistant turn panel (client side): the story
// shell's interactive window onto the XIV AI OS LOCAL assistant (the
// CEO's in-house "mini grok bot" seed). The operator types a message;
// the panel POSTs { tenantId, turnId, userMessage } to the LOCAL
// /api/ingest/assistant-turn route, which runs the REAL 12D-300 turn
// contract against the pinned LOCAL loopback model in the LOCAL server
// process. Only the frozen view model renders: a drafted turn shows the
// DRAFT reply with its re-derived digest; a refused turn shows the
// honest refusal reason. This is a DRAFT surface — the assistant drafts,
// the operator decides. Nothing is persisted, nothing leaves this
// machine (remoteCalls 0), no weights move (learningPromoted false).

import { useState } from "react";

type DraftView = {
  kind: "VERIFIED_ASSISTANT_TURN_DRAFT";
  policyVersion: string;
  display: {
    headline: string;
    replyDraft: string;
    tenantId: string;
    turnId: string;
    model: string;
    draftSha256: string;
    stoppedBefore: string;
    operatorNote: string;
  };
};

type RefusedView = {
  kind: "REFUSED";
  policyVersion: string;
  reason: string;
  display: { headline: string; bodyText: string; operatorNote: string };
};

type AssistantTurnViewModel = DraftView | RefusedView;

export default function AssistantTurnPanel() {
  const [message, setMessage] = useState("");
  const [vm, setVm] = useState<AssistantTurnViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setError(null);
    setBusy(true);
    setVm(null);
    try {
      const res = await fetch("/api/ingest/assistant-turn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantId: "xiv-os",
          turnId: `shell-turn-${Date.now().toString(36)}`,
          userMessage: message,
        }),
      });
      if (!res.ok) {
        setError(`assistant turn endpoint returned HTTP ${res.status}; nothing was rendered`);
      } else {
        setVm((await res.json()) as AssistantTurnViewModel);
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
        XIV AI OS LOCAL assistant · draft-only · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Ask the LOCAL assistant a question. The turn runs the REAL 12D-300
        contract against the pinned local model in this machine&apos;s server
        process: the message is secret-screened BEFORE any model call (a
        credential-shaped message never reaches ANY model), the reply is
        screened again after, and the returned draft is re-verified — digest
        re-derived, secrets re-checked — before it renders. Honest scope is
        pinned: the assistant drafts for the operator, who decides; no cloud,
        no deployment, no GPU changes, no weight mutation. Nothing is
        persisted.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void ask();
          }}
          disabled={busy || message.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Drafting locally…" : "Ask the local assistant"}
        </button>
      </div>

      <textarea
        id="assistant-turn-message"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        rows={3}
        spellCheck={false}
        placeholder="Ask about what the local assistant can draft for you…"
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
            Assistant turn · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_ASSISTANT_TURN_DRAFT" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Assistant draft · verified · digest re-derived before render
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <div className="mt-3 rounded-md border border-neutral-300 bg-white p-3 text-sm leading-6 whitespace-pre-wrap text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">
            {vm.display.replyDraft}
          </div>
          <dl className="mt-4 space-y-1 font-mono text-xs break-all text-neutral-600 dark:text-neutral-400">
            <div>tenantId: {vm.display.tenantId} · turnId: {vm.display.turnId}</div>
            <div>model: {vm.display.model}</div>
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