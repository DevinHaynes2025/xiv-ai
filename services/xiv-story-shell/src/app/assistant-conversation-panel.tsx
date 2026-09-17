"use client";

// 12D-303 — the local assistant conversation panel (client side): the
// story shell's multi-turn window onto the XIV AI OS LOCAL assistant.
// The BROWSER holds the disclosed conversation history (at most 6 prior
// pairs — the 12D-302 contract bound) and sends it with every turn; the
// LOCAL server re-screens the whole history through the REAL 12D-302
// contract before any model call. Only frozen view models render: a
// drafted turn shows the reply with its re-derived digest; a refusal
// shows the honest reason. Draft-only: the assistant drafts, the
// operator decides what history carries forward. Nothing is persisted —
// reloading the page drops the conversation (disclosed).

import { useState } from "react";

type TurnView = {
  kind: "VERIFIED_ASSISTANT_CONVERSATION_TURN";
  display: {
    headline: string;
    replyDraft: string;
    conversationId: string;
    draftSha256: string;
    priorTurnCount: number;
    stoppedBefore: string;
    operatorNote: string;
  };
};

type RefusedView = {
  kind: "REFUSED";
  reason: string;
  display: { headline: string; bodyText: string; operatorNote: string };
};

type ConversationViewModel = TurnView | RefusedView;

type Exchange = { userMessage: string; draftHeadline: string; replyDraft: string };

const MAX_PRIOR_TURNS = 6; // mirrors the 12D-302 contract bound

export default function AssistantConversationPanel() {
  const [conversationId, setConversationId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [vm, setVm] = useState<ConversationViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priorTurns = exchanges.slice(-MAX_PRIOR_TURNS).map((e) => ({ userMessage: e.userMessage, assistantReply: e.replyDraft }));

  async function send() {
    setError(null);
    setBusy(true);
    setVm(null);
    try {
      const res = await fetch("/api/ingest/assistant-conversation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId: "xiv-os", conversationId, userMessage: message, priorTurns }),
      });
      if (!res.ok) {
        setError(`conversation endpoint returned HTTP ${res.status}; nothing was rendered`);
      } else {
        const data = (await res.json()) as ConversationViewModel;
        setVm(data);
        if (data.kind === "VERIFIED_ASSISTANT_CONVERSATION_TURN") {
          setExchanges((prev) => [...prev, { userMessage: message, draftHeadline: data.display.headline, replyDraft: data.display.replyDraft }]);
          setMessage("");
        }
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
        XIV AI OS LOCAL assistant · multi-turn · draft-only · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        A real multi-turn conversation with the LOCAL assistant. The browser
        holds the disclosed history — at most {MAX_PRIOR_TURNS} prior pairs, the
        12D-302 contract bound — and sends it with every turn; the LOCAL server
        re-screens the WHOLE history (every message and reply) before any model
        call, and a secret-shaped string anywhere refuses the turn. The composed
        prompt refuses over the derived ceiling. Drafts only — the operator
        decides what history carries forward. Nothing is persisted: reloading
        drops the conversation.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          id="assistant-conversation-id"
          value={conversationId}
          onChange={(e) => {
            setConversationId(e.target.value);
          }}
          placeholder="conversation id (1..128 chars)"
          maxLength={128}
          className="w-64 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        />
        <button
          type="button"
          onClick={() => {
            setExchanges([]);
            setVm(null);
            setError(null);
          }}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Clear conversation
        </button>
        <button
          type="button"
          onClick={() => {
            void send();
          }}
          disabled={busy || message.length === 0 || conversationId.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Drafting locally…" : `Send turn ${priorTurns.length + 1}`}
        </button>
      </div>

      <textarea
        id="assistant-conversation-message"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        rows={3}
        spellCheck={false}
        placeholder="Continue the conversation…"
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 text-sm leading-6 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />

      {error !== null && (
        <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-xs break-words text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {exchanges.length > 0 && (
        <section className="mt-4 space-y-3">
          {exchanges.map((e, i) => (
            <div key={i} className="rounded-md border border-neutral-300 bg-neutral-100 p-3 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                turn {i + 1} · operator said:
              </p>
              <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">{e.userMessage}</p>
              <p className="mt-2 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                assistant drafted ({e.draftHeadline}):
              </p>
              <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">{e.replyDraft}</p>
            </div>
          ))}
        </section>
      )}

      {vm !== null && vm.kind === "REFUSED" && (
        <section className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
            Conversation turn · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_ASSISTANT_CONVERSATION_TURN" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Conversation turn · verified · digest re-derived before render
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <div className="mt-3 rounded-md border border-neutral-300 bg-white p-3 text-sm leading-6 whitespace-pre-wrap text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">
            {vm.display.replyDraft}
          </div>
          <dl className="mt-4 space-y-1 font-mono text-xs break-all text-neutral-600 dark:text-neutral-400">
            <div>conversationId: {vm.display.conversationId} · priorTurns carried: {vm.display.priorTurnCount}</div>
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