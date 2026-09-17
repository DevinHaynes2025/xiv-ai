// 12D-312 — the LOCAL memory-CITED-conversation endpoint of the story
// shell: the multi-turn surface WITH the reviewed memory AND the
// 12D-310 citation gate. The browser sends { tenantId, conversationId,
// userMessage, priorTurns, memoryPacket } — the disclosed prior context
// AND the pasted REAL 12D-305 memory packet — and this handler runs the
// REAL 12D-311 contract against the INJECTED 12D-289 loopback caller in
// the LOCAL server process. The memory packet is re-verified through the
// REAL 12D-306 gate, the WHOLE history is re-screened BEFORE any model
// call (REAL 12D-302/308 discipline), the memory block is composed
// through the REAL 12D-307 composer, the composed prompt refuses over
// the derived ceiling, and the reply is secret-screened post-call; a
// cited storyId outside the verified carried set refuses POST-CALL
// (fabricated provenance never passes) and zero citations renders
// honestly as UNGROUNDED. ONLY the frozen view model renders.
// Draft-only: nothing is persisted, remoteCalls 0 (loopback is not
// remote), modelCalls 1 per drafted turn (counted).

import {
  prepareAssistantMemoryCitedConversationTurn, runAssistantMemoryCitedConversationTurn,
} from "../../../../../../ai/runtime/offline-team/xiv-assistant-memory-cited-conversation";
import { buildAssistantMemoryCitedConversationViewModel } from "../../../../../../ai/runtime/offline-team/xiv-assistant-memory-cited-conversation-view-model";
import { buildLoopbackCaller } from "../../../../../../ai/runtime/offline-team/xiv-reading-loopback-caller";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-311-v1",
      reason: `memory cited conversation turn input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Assistant memory cited conversation turn refused — HUMAN DECISION REQUIRED",
        bodyText: "The input could not be parsed as JSON; no model was called.",
        operatorNote: "Send { tenantId, conversationId, userMessage, priorTurns, memoryPacket } exactly.",
      },
    });
  }
  const prepared = prepareAssistantMemoryCitedConversationTurn(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildAssistantMemoryCitedConversationViewModel(prepared));
  const packet = await runAssistantMemoryCitedConversationTurn(prepared, buildLoopbackCaller());
  return Response.json(buildAssistantMemoryCitedConversationViewModel(packet));
}