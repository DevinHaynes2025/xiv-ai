// 12D-329 — the LOCAL memory-turn endpoint of the story shell (the
// 12D-307 rung's disclosed shell surface): the single-turn surface
// where the assistant SEES the reviewed memory WITHOUT the citation
// gate (the plain memory turn; the cited sibling is 12D-312's
// /api/ingest/assistant-memory-cited-turn). The browser sends
// { tenantId, turnId, userMessage, memoryPacket } — the pasted REAL
// 12D-305 memory packet — and this handler runs the REAL 12D-307
// contract against the INJECTED 12D-289 loopback caller in the LOCAL
// server process. The memory packet is re-verified through the REAL
// 12D-306 gate, the user message is secret-screened BEFORE any model
// call, the composed prompt refuses over the derived ceiling, and the
// reply is secret-screened post-call. ONLY the frozen view model
// renders. Draft-only: nothing is persisted, remoteCalls 0 (loopback
// is not remote), modelCalls 1 per drafted turn (counted).

import {
  prepareAssistantMemoryTurn, runAssistantMemoryTurn,
} from "../../../../../../ai/runtime/offline-team/xiv-assistant-memory-turn";
import { buildAssistantMemoryTurnViewModel } from "../../../../../../ai/runtime/offline-team/xiv-assistant-memory-turn-view-model";
import { buildLoopbackCaller } from "../../../../../../ai/runtime/offline-team/xiv-reading-loopback-caller";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-329-v1",
      reason: `memory turn input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Assistant memory turn refused — HUMAN DECISION REQUIRED",
        bodyText: "The input could not be parsed as JSON; no model was called.",
        operatorNote: "Send { tenantId, turnId, userMessage, memoryPacket } exactly.",
      },
    });
  }
  const prepared = prepareAssistantMemoryTurn(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildAssistantMemoryTurnViewModel(prepared));
  const packet = await runAssistantMemoryTurn(prepared, buildLoopbackCaller());
  return Response.json(buildAssistantMemoryTurnViewModel(packet));
}