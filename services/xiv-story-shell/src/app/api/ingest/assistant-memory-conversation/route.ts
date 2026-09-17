// 12D-308 — the LOCAL memory-conversation endpoint of the story shell:
// the multi-turn surface WITH the mini brain's reviewed memory. The
// browser sends { tenantId, conversationId, userMessage, priorTurns,
// memoryPacket } — the disclosed prior context AND the pasted REAL
// 12D-305 memory packet — and this handler runs the REAL 12D-308
// contract against the INJECTED 12D-289 loopback caller in the LOCAL
// server process. The memory packet is re-verified through the REAL
// 12D-306 gate, the whole history is re-screened BEFORE any model call,
// the composed prompt refuses over the derived ceiling, and the reply
// is secret-screened post-call. ONLY the frozen view model renders.
// Draft-only: nothing is persisted, remoteCalls 0 (loopback is not
// remote), modelCalls 1 per drafted turn (counted).

import {
  prepareAssistantMemoryConversationTurn, runAssistantMemoryConversationTurn,
} from "../../../../../../ai/runtime/offline-team/xiv-assistant-memory-conversation";
import { buildAssistantMemoryConversationViewModel } from "../../../../../../ai/runtime/offline-team/xiv-assistant-memory-conversation-view-model";
import { buildLoopbackCaller } from "../../../../../../ai/runtime/offline-team/xiv-reading-loopback-caller";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-308-v1",
      reason: `memory conversation turn input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Assistant memory conversation turn refused — HUMAN DECISION REQUIRED",
        bodyText: "The input could not be parsed as JSON; no model was called.",
        operatorNote: "Send { tenantId, conversationId, userMessage, priorTurns, memoryPacket } exactly.",
      },
    });
  }
  const prepared = prepareAssistantMemoryConversationTurn(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildAssistantMemoryConversationViewModel(prepared));
  const packet = await runAssistantMemoryConversationTurn(prepared, buildLoopbackCaller());
  return Response.json(buildAssistantMemoryConversationViewModel(packet));
}