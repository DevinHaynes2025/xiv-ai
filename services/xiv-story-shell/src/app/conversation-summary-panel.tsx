"use client";

// 12D-320 — the conversation summary card panel (client side): the story
// shell's grounding MEASUREMENT surface. The operator names the
// conversation, pastes its prior turns as JSON, and drops the REAL
// 12D-305 memory packet; the LOCAL server runs the REAL 12D-320 card —
// the packet is re-verified through the 12D-306 gate, the turns pass the
// REAL history discipline, and every reply's [mem:<storyId>] citations
// are measured against the verified carried set. Fabricated citations
// are disclosed BY ID; zero citations render as UNGROUNDED, never
// hidden. NO model runs here — a summary is MEASURED, never generated.
// Nothing is persisted.

import { useState } from "react";

type SummaryRow = {
  turnIndex: number;
  citedStoryIds: readonly string[];
  groundedStoryIds: readonly string[];
  fabricatedStoryIds: readonly string[];
};

type SummaryView = {
  kind: "VERIFIED_CONVERSATION_SUMMARY";
  display: {
    headline: string;
    tenantId: string;
    conversationId: string;
    priorTurnCount: number;
    verdict: string;
    verdictNote: string;
    rows: readonly SummaryRow[];
    totalCitedCount: number;
    totalGroundedCount: number;
    totalFabricatedCount: number;
    uncitedReplyCount: number;
    memoryCarried: number;
    memoryDoneCount: number;
    firstUserMessageExcerpt: string;
    lastReplyExcerpt: string;
    summaryDigestSha256: string;
    operatorNote: string;
  };
};

type RefusedView = {
  kind: "REFUSED";
  reason: string;
  display: { headline: string; bodyText: string; operatorNote: string };
};

type SummaryViewModel = SummaryView | RefusedView;

export default function ConversationSummaryPanel() {
  const [tenantId, setTenantId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [turnsText, setTurnsText] = useState("");
  const [memoryText, setMemoryText] = useState("");
  const [memoryFile, setMemoryFile] = useState<string | null>(null);
  const [vm, setVm] = useState<SummaryViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File | null) {
    if (!file) return;
    setMemoryFile(file.name);
    setMemoryText(await file.text());
    setVm(null);
    setError(null);
  }

  async function measure() {
    setError(null);
    if (!tenantId || !conversationId || !userMessage || !turnsText || !memoryText) return;
    let priorTurns: unknown;
    let memoryPacket: unknown;
    try {
      priorTurns = JSON.parse(turnsText) as unknown;
    } catch (err) {
      setError(`the prior turns are not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    try {
      memoryPacket = JSON.parse(memoryText) as unknown;
    } catch (err) {
      setError(`the memory packet is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    setBusy(true);
    setVm(null);
    try {
      const res = await fetch("/api/ingest/conversation-summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, conversationId, userMessage, priorTurns, memoryPacket }),
      });
      if (!res.ok) {
        setError(`conversation-summary endpoint returned HTTP ${res.status}; nothing was rendered`);
      } else {
        setVm((await res.json()) as SummaryViewModel);
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
        Conversation summary card · grounding measurement · no model call · fail-closed
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Measure where a conversation&apos;s grounding stands — by measurement, not
        opinion. Name the conversation and the tenant, paste the prior turns as a
        JSON array of {"{"}&quot;userMessage&quot;, &quot;assistantReply&quot;{"}"} pairs, and drop the
        REAL 12D-305 memory packet; the LOCAL server re-verifies the packet and
        measures every reply&apos;s [mem:&lt;storyId&gt;] citations against the verified
        carried set. Fabricated citations are disclosed BY ID; no citations
        renders as UNGROUNDED, never hidden. NO model runs here — nothing is
        generated, nothing is stored. The verdict judges ONLY the citations; the
        prose is yours to judge.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          id="conversation-summary-tenant"
          value={tenantId}
          onChange={(e) => {
            setTenantId(e.target.value);
            setVm(null);
          }}
          placeholder="tenant id (must match the memory packet tenant)"
          spellCheck={false}
          className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        />
        <input
          id="conversation-summary-id"
          value={conversationId}
          onChange={(e) => {
            setConversationId(e.target.value);
            setVm(null);
          }}
          placeholder="conversation id"
          spellCheck={false}
          className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 font-mono text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          Choose memory packet JSON…
          <input
            id="conversation-summary-file"
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
            void measure();
          }}
          disabled={busy || tenantId.length === 0 || conversationId.length === 0 || userMessage.length === 0 || turnsText.length === 0 || memoryText.length === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {busy ? "Measuring…" : "Measure grounding"}
        </button>
      </div>

      <input
        id="conversation-summary-message"
        value={userMessage}
        onChange={(e) => {
          setUserMessage(e.target.value);
          setVm(null);
        }}
        placeholder="the pending user message this conversation would send next"
        spellCheck={false}
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />
      <textarea
        id="conversation-summary-turns"
        value={turnsText}
        onChange={(e) => {
          setTurnsText(e.target.value);
          setVm(null);
        }}
        rows={5}
        spellCheck={false}
        placeholder='[ { "userMessage": "…", "assistantReply": "… replied citing [mem:<storyId>] …" } ]'
        className="mt-3 w-full rounded-md border border-neutral-300 bg-neutral-50 p-3 font-mono text-xs leading-5 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />
      <textarea
        id="conversation-summary-packet"
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

      {error !== null && (
        <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-xs break-words text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {vm !== null && vm.kind === "REFUSED" && (
        <section className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
            Conversation summary card · REFUSED
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

      {vm !== null && vm.kind === "VERIFIED_CONVERSATION_SUMMARY" && (
        <section className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Conversation summary card · verified · card re-derived from the packet&apos;s own inputs
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {vm.display.headline}
          </h3>
          <p className="mt-1 font-mono text-xs break-all text-neutral-500 dark:text-neutral-400">
            tenant: {vm.display.tenantId} · conversation: {vm.display.conversationId} ·
            memory: {vm.display.memoryCarried} carried / {vm.display.memoryDoneCount} done
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {vm.display.verdictNote}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-neutral-300 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
              <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                measured totals:
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                <li>replies: {vm.display.priorTurnCount}</li>
                <li>cited: {vm.display.totalCitedCount}</li>
                <li>grounded: {vm.display.totalGroundedCount}</li>
                <li>uncited replies: {vm.display.uncitedReplyCount}</li>
              </ul>
            </div>
            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
              <p className="font-mono text-xs text-amber-600 dark:text-amber-400">
                fabricated ({vm.display.totalFabricatedCount}):
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs break-all text-amber-700 dark:text-amber-300">
                {vm.display.rows.flatMap((row) => row.fabricatedStoryIds).length > 0
                  ? vm.display.rows.flatMap((row) => row.fabricatedStoryIds).map((id) => (
                      <li key={id}>[mem:{id}]</li>
                    ))
                  : <li>none</li>}
              </ul>
            </div>
            <div className="rounded-md border border-neutral-300 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
              <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                bounded excerpts (≤120 chars):
              </p>
              <p className="mt-2 text-xs break-words text-neutral-800 dark:text-neutral-200">
                first: {vm.display.firstUserMessageExcerpt || "—"}
              </p>
              <p className="mt-1 text-xs break-words text-neutral-800 dark:text-neutral-200">
                last reply: {vm.display.lastReplyExcerpt || "— (no replies yet)"}
              </p>
            </div>
          </div>
          {vm.display.rows.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-150 border-collapse font-mono text-xs">
                <thead>
                  <tr className="text-left text-neutral-500 dark:text-neutral-400">
                    <th className="border-b border-neutral-300 px-2 py-1 dark:border-neutral-700">turn</th>
                    <th className="border-b border-neutral-300 px-2 py-1 dark:border-neutral-700">cited</th>
                    <th className="border-b border-neutral-300 px-2 py-1 dark:border-neutral-700">grounded</th>
                    <th className="border-b border-neutral-300 px-2 py-1 dark:border-neutral-700">fabricated</th>
                  </tr>
                </thead>
                <tbody>
                  {vm.display.rows.map((row) => (
                    <tr key={row.turnIndex} className="text-neutral-800 dark:text-neutral-200">
                      <td className="border-b border-neutral-200 px-2 py-1 dark:border-neutral-800">{row.turnIndex}</td>
                      <td className="border-b border-neutral-200 px-2 py-1 break-all dark:border-neutral-800">
                        {row.citedStoryIds.length > 0
                          ? row.citedStoryIds.map((id) => `[mem:${id}]`).join(" ")
                          : "NONE (uncited)"}
                      </td>
                      <td className="border-b border-neutral-200 px-2 py-1 break-all dark:border-neutral-800">
                        {row.groundedStoryIds.map((id) => `[mem:${id}]`).join(" ") || "—"}
                      </td>
                      <td className="border-b border-neutral-200 px-2 py-1 break-all text-amber-700 dark:border-neutral-800 dark:text-amber-300">
                        {row.fabricatedStoryIds.map((id) => `[mem:${id}]`).join(" ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 font-mono text-xs break-all text-neutral-500 dark:text-neutral-400">
            digest: {vm.display.summaryDigestSha256}
          </p>
          <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
            {vm.display.operatorNote}
          </p>
        </section>
      )}
    </section>
  );
}